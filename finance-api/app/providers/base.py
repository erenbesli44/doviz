"""
Provider base types.

All provider adapters implement the MarketProvider Protocol.
Using Protocol (structural subtyping) rather than ABC keeps adapters lightweight
and easier to mock in tests — no inheritance required.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Protocol, runtime_checkable


@dataclass
class RawQuote:
    price: float
    change_pct: float          # percentage, e.g. 0.12 = +0.12%
    fetched_at: datetime
    open: float | None = None
    high: float | None = None
    low: float | None = None
    market_status: str | None = None  # "open" | "closed" | "pre-market"


@dataclass
class RawHistoryPoint:
    time: str    # "HH:MM" or ISO timestamp
    value: float


class ProviderError(Exception):
    """Raised by any provider when the external call fails or returns unusable data."""

    def __init__(self, provider: str, symbol: str, reason: str) -> None:
        self.provider = provider
        self.symbol = symbol
        self.reason = reason
        super().__init__(f"[{provider}] {symbol}: {reason}")


@runtime_checkable
class MarketProvider(Protocol):
    """Structural interface every provider adapter must satisfy."""

    provider_id: str  # class-level string, e.g. "finnhub"

    async def fetch_quote(self, external_symbol: str) -> RawQuote: ...

    async def fetch_history(
        self, external_symbol: str, hours: int = 24
    ) -> list[RawHistoryPoint]: ...

    async def is_healthy(self) -> bool: ...
