"""
MarketCalendarService — knows when each exchange is open or closed.

Exchange identifiers:
  BIST | NYSE | XETRA | LSE | TSE | COMEX | NYMEX | FOREX | CRYPTO

For continuous / near-continuous markets (FOREX, COMEX, NYMEX) trading sessions
are modelled as all-day Mon–Fri (00:00–23:58 local time).  This correctly
distinguishes weekday trading from the weekend closure, which is the primary
use-case: "should I serve a live quote or the last session close?"

Crypto is always open (7 × 24 × 365).
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Domain types
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class TradingSession:
    """A single open-to-close window within one calendar day (naive local times)."""

    open_hour: int
    open_min: int
    close_hour: int
    close_min: int

    def open_time(self) -> time:
        return time(self.open_hour, self.open_min)

    def close_time(self) -> time:
        return time(self.close_hour, self.close_min)


@dataclass(frozen=True)
class ExchangeCalendar:
    exchange_id: str
    timezone: ZoneInfo
    sessions: tuple[TradingSession, ...]  # ordered, non-overlapping
    trading_weekdays: frozenset[int]       # 0=Mon … 6=Sun
    holidays: frozenset[date] = field(default_factory=frozenset)
    always_open: bool = False              # True only for CRYPTO


@dataclass
class SessionState:
    is_open: bool
    display_mode: str         # "live" | "last_completed_session" | "no_data"
    session_date: date        # current session date (open) or last completed (closed)
    as_of: datetime           # tz-aware UTC timestamp of state evaluation
    next_open: datetime       # tz-aware UTC next session open (== as_of when already open)
    stale_reason: str | None = None


# ---------------------------------------------------------------------------
# Exchange definitions
# ---------------------------------------------------------------------------

_EASTERN = ZoneInfo("America/New_York")
_LONDON = ZoneInfo("Europe/London")
_BERLIN = ZoneInfo("Europe/Berlin")
_TOKYO = ZoneInfo("Asia/Tokyo")
_ISTANBUL = ZoneInfo("Europe/Istanbul")
_UTC = ZoneInfo("UTC")

_MON_FRI = frozenset({0, 1, 2, 3, 4})
_EVERY_DAY = frozenset({0, 1, 2, 3, 4, 5, 6})

# Nearly-24h session for continuous futures / FX markets (Mon–Fri only)
_CONTINUOUS = TradingSession(0, 0, 23, 58)

# Per-exchange freshness windows (how old can a cached live quote be before
# we consider it "delayed" rather than "live").
FRESHNESS_SECONDS: dict[str, int] = {
    "CRYPTO": 90,
    "FOREX": 60,
    "BIST": 120,   # 15-min delayed feed; any recent fetch is acceptable
    "NYSE": 120,
    "XETRA": 120,
    "LSE": 120,
    "TSE": 120,
    "COMEX": 120,
    "NYMEX": 120,
}

_CALENDARS: dict[str, ExchangeCalendar] = {
    "BIST": ExchangeCalendar(
        exchange_id="BIST",
        timezone=_ISTANBUL,
        sessions=(TradingSession(9, 40, 18, 10),),
        trading_weekdays=_MON_FRI,
    ),
    "NYSE": ExchangeCalendar(
        exchange_id="NYSE",
        timezone=_EASTERN,
        sessions=(TradingSession(9, 30, 16, 0),),
        trading_weekdays=_MON_FRI,
    ),
    "XETRA": ExchangeCalendar(
        exchange_id="XETRA",
        timezone=_BERLIN,
        sessions=(TradingSession(9, 0, 17, 30),),
        trading_weekdays=_MON_FRI,
    ),
    "LSE": ExchangeCalendar(
        exchange_id="LSE",
        timezone=_LONDON,
        sessions=(TradingSession(8, 0, 16, 30),),
        trading_weekdays=_MON_FRI,
    ),
    "TSE": ExchangeCalendar(
        exchange_id="TSE",
        timezone=_TOKYO,
        sessions=(TradingSession(9, 0, 15, 30),),  # continuous since Oct 2023
        trading_weekdays=_MON_FRI,
    ),
    # Futures / near-24h markets: only the weekend is "closed"
    "COMEX": ExchangeCalendar(
        exchange_id="COMEX",
        timezone=_EASTERN,
        sessions=(_CONTINUOUS,),
        trading_weekdays=_MON_FRI,
    ),
    "NYMEX": ExchangeCalendar(
        exchange_id="NYMEX",
        timezone=_EASTERN,
        sessions=(_CONTINUOUS,),
        trading_weekdays=_MON_FRI,
    ),
    "FOREX": ExchangeCalendar(
        exchange_id="FOREX",
        timezone=_UTC,
        sessions=(_CONTINUOUS,),
        trading_weekdays=_MON_FRI,
    ),
    # Crypto: 24 × 7 × 365
    "CRYPTO": ExchangeCalendar(
        exchange_id="CRYPTO",
        timezone=_UTC,
        sessions=(_CONTINUOUS,),
        trading_weekdays=_EVERY_DAY,
        always_open=True,
    ),
}


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------


class MarketCalendarService:
    """Query exchange open/closed state and associated session dates."""

    def get_calendar(self, exchange_id: str) -> ExchangeCalendar:
        cal = _CALENDARS.get(exchange_id)
        if cal is None:
            logger.warning("Unknown exchange %r, defaulting to FOREX calendar", exchange_id)
            return _CALENDARS["FOREX"]
        return cal

    def freshness_window(self, exchange_id: str) -> int:
        """Return how fresh (seconds) a cached quote should be to count as 'live'."""
        return FRESHNESS_SECONDS.get(exchange_id, 120)

    def is_trading_day(
        self, exchange_id: str, d: date, *, cal: ExchangeCalendar | None = None
    ) -> bool:
        if cal is None:
            cal = self.get_calendar(exchange_id)
        if cal.always_open:
            return True
        if d.weekday() not in cal.trading_weekdays:
            return False
        return d not in cal.holidays

    def get_session_state(self, exchange_id: str, now_utc: datetime) -> SessionState:
        """Return the current session state for the given exchange at now_utc."""
        cal = self.get_calendar(exchange_id)

        if cal.always_open:
            return SessionState(
                is_open=True,
                display_mode="live",
                session_date=now_utc.date(),
                as_of=now_utc,
                next_open=now_utc,
            )

        now_local = now_utc.astimezone(cal.timezone)
        today = now_local.date()
        current_time = now_local.time()

        if self.is_trading_day(exchange_id, today, cal=cal):
            for session in cal.sessions:
                if session.open_time() <= current_time < session.close_time():
                    return SessionState(
                        is_open=True,
                        display_mode="live",
                        session_date=today,
                        as_of=now_utc,
                        next_open=now_utc,
                    )

        # Market is closed
        last_session = self._last_session_date(cal, now_local)
        next_open = self._next_open(cal, now_local)

        return SessionState(
            is_open=False,
            display_mode="last_completed_session",
            session_date=last_session,
            as_of=now_utc,
            next_open=next_open.astimezone(UTC),
        )

    def get_last_session_date(self, exchange_id: str, now_utc: datetime) -> date:
        cal = self.get_calendar(exchange_id)
        return self._last_session_date(cal, now_utc.astimezone(cal.timezone))

    def get_next_open(self, exchange_id: str, now_utc: datetime) -> datetime:
        cal = self.get_calendar(exchange_id)
        return self._next_open(cal, now_utc.astimezone(cal.timezone)).astimezone(UTC)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _last_session_date(self, cal: ExchangeCalendar, now_local: datetime) -> date:
        """Walk backward to find the date of the most recently completed session."""
        candidate = now_local.date()

        # If today is a trading day AND we're past its last session close, today counts.
        if self.is_trading_day(cal.exchange_id, candidate, cal=cal):
            last_close_time = cal.sessions[-1].close_time()
            close_dt = datetime.combine(candidate, last_close_time, tzinfo=cal.timezone)
            if now_local >= close_dt:
                return candidate

        # Walk backward looking for the last completed trading day (up to 14 days back).
        for i in range(1, 15):
            d = now_local.date() - timedelta(days=i)
            if self.is_trading_day(cal.exchange_id, d, cal=cal):
                return d

        return now_local.date()  # should never be reached

    def _next_open(self, cal: ExchangeCalendar, now_local: datetime) -> datetime:
        """Find the next session open datetime (exchange-local timezone)."""
        candidate = now_local.date()

        # Check if today still has an upcoming session open.
        if self.is_trading_day(cal.exchange_id, candidate, cal=cal):
            for session in cal.sessions:
                open_dt = datetime.combine(
                    candidate, session.open_time(), tzinfo=cal.timezone
                )
                if open_dt > now_local:
                    return open_dt

        # Walk forward up to 14 days.
        for i in range(1, 15):
            d = now_local.date() + timedelta(days=i)
            if self.is_trading_day(cal.exchange_id, d, cal=cal):
                return datetime.combine(
                    d, cal.sessions[0].open_time(), tzinfo=cal.timezone
                )

        return now_local + timedelta(days=1)  # should never be reached
