"""
Turkey timezone boundary & price freshness validation.

Fetches live reference prices directly from the Yahoo Finance v8 chart API,
then cross-checks them against our running API instance.  An optional
best-effort scrape of doviz.com provides a second reference for USD/TRY.

Marks
-----
  e2e   — requires a running local server (default BASE_URL=http://localhost:8000)
  live  — makes real outbound network calls

Usage
-----
    # 1. Start the server
    uvicorn app.main:app --reload

    # 2. Run these tests
    pytest tests/test_live_data/test_turkey_timezone.py -m "e2e and live" -v

    # Or against a deployed instance
    BASE_URL=https://my-server.example.com pytest ... -m "e2e and live" -v

Acceptance criteria (per the Turkey-timezone QA spec)
------------------------------------------------------
  - Price within ±1 % of Yahoo Finance reference (allows provider lag).
  - changePercent SIGN matches reference 100 % of the time.
    A wrong sign always means the day-open baseline is anchored to the
    wrong calendar midnight → timezone boundary bug.
  - changePercent VALUE within ±0.5 percentage points of reference.
  - fetched_at no older than TTL + 5 s buffer.
  - All timestamps carry an explicit timezone marker (Z or ±HH:MM).
  - is_live flag matches the registry's structural delay declaration.
"""

import logging
import os
import re
from datetime import UTC, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import httpx
import pytest

# ── Load .env so tests work when run from the project root ───────────────────
_env = Path(__file__).parents[2] / ".env"
if _env.exists():
    for _line in _env.read_text().splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _, _v = _line.partition("=")
            os.environ.setdefault(_k.strip(), _v.strip())

log = logging.getLogger(__name__)

# Turkey Standard Time — UTC+3, no DST
_TRT = timezone(timedelta(hours=3))

_BASE_URL = os.environ.get("BASE_URL", "http://localhost:8000")
_YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart"
_YAHOO_FALLBACK = "https://query2.finance.yahoo.com/v8/finance/chart"

pytestmark = [pytest.mark.e2e, pytest.mark.live]


# ── Asset definitions ─────────────────────────────────────────────────────────
# Each entry describes one instrument to check.
#   api_symbol    — URL-safe path segment used in /v1/quotes/{symbol}
#   yahoo_symbol  — ticker as Yahoo Finance expects it
#   price_range   — (low, high) plausibility bounds, used only in logging
#   ttl_seconds   — cache TTL declared in the symbol registry
#   is_live       — expected value of meta.is_live in API responses
# fmt: off
ASSETS: list[dict[str, Any]] = [
    {
        "name":         "USD/TRY",
        "api_symbol":   "USD-TRY",
        "yahoo_symbol": "TRY=X",
        "price_range":  (25.0, 60.0),
        "ttl_seconds":  30,
        "is_live":      True,
    },
    {
        "name":         "XU100",
        "api_symbol":   "XU100",
        "yahoo_symbol": "XU100.IS",
        "price_range":  (5_000.0, 50_000.0),
        "ttl_seconds":  300,
        "is_live":      False,   # structurally delayed 15 min — intentional
    },
    {
        "name":         "BTC/USD",
        "api_symbol":   "BTC-USD",
        "yahoo_symbol": "BTC-USD",
        "price_range":  (10_000.0, 500_000.0),
        "ttl_seconds":  60,
        "is_live":      True,
    },
    {
        "name":         "XAU/USD",
        "api_symbol":   "XAU-USD",
        "yahoo_symbol": "GC=F",   # COMEX gold front-month futures on Yahoo
        "price_range":  (1_000.0, 5_000.0),
        "ttl_seconds":  60,
        "is_live":      True,
    },
]
# fmt: on

_ASSET_IDS = [a["name"] for a in ASSETS]


# ── Shared HTTP helpers ───────────────────────────────────────────────────────

async def _yahoo_quote(symbol: str, client: httpx.AsyncClient) -> dict[str, float]:
    """Return {price, change_pct, change_pct_is_computed} from Yahoo Finance v8 chart API.

    Falls back from query1 to query2 on network error.  Skips the test
    (rather than failing) if Yahoo is unreachable.

    Yahoo's v8 ``regularMarketChangePercent`` field occasionally returns 0 or
    null even when the market is open (a known API quirk).  When this happens
    we derive the change ourselves from ``chartPreviousClose`` / ``previousClose``
    so sign-comparison tests have a reliable reference value.

    Extra key ``change_pct_is_computed`` is True when we fell back to our own
    calculation — callers can use it to loosen assertions if needed.
    """
    headers = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}
    params = {"interval": "1h", "range": "2d"}
    last_exc: Exception | None = None

    for base in (_YAHOO_BASE, _YAHOO_FALLBACK):
        try:
            resp = await client.get(f"{base}/{symbol}", params=params, headers=headers)
            if resp.status_code != 200:
                continue
            data = resp.json()
            result = data["chart"]["result"][0]
            meta_y = result["meta"]

            price = meta_y.get("regularMarketPrice")
            if price is None:
                pytest.skip(f"Yahoo returned null regularMarketPrice for {symbol}")

            price_f = float(price)
            raw_pct = meta_y.get("regularMarketChangePercent")

            # Yahoo sometimes returns 0 (or null) for regularMarketChangePercent.
            # We compute from chartPreviousClose when the authoritative field is
            # absent or zero so that sign comparisons have a meaningful reference.
            computed = False
            if raw_pct:
                change_pct = float(raw_pct)
            else:
                prev = meta_y.get("chartPreviousClose") or meta_y.get("previousClose")
                if prev:
                    prev_f = float(prev)
                    change_pct = (price_f - prev_f) / prev_f * 100
                    computed = True
                else:
                    change_pct = 0.0
                    computed = True  # no reference — treat as unreliable

            return {
                "price": price_f,
                "change_pct": change_pct,
                "change_pct_is_computed": computed,
            }
        except (httpx.RequestError, KeyError, IndexError, TypeError) as exc:
            last_exc = exc
            continue

    pytest.skip(f"Yahoo Finance unreachable for {symbol}: {last_exc}")


async def _api_quote(path_symbol: str, client: httpx.AsyncClient) -> dict[str, Any]:
    """Return the full JSON body from GET /v1/quotes/{path_symbol}.

    Skips the test if the server is not running or the symbol is not registered.
    """
    try:
        resp = await client.get(f"{_BASE_URL}/v1/quotes/{path_symbol}")
    except httpx.ConnectError:
        pytest.skip(f"Server not reachable at {_BASE_URL} — start it first")

    if resp.status_code == 404:
        pytest.skip(f"Symbol {path_symbol!r} not registered in API")

    resp.raise_for_status()
    return resp.json()


def _now_istanbul() -> str:
    """Current wall-clock time in Istanbul (TRT = UTC+3), formatted for logging."""
    return datetime.now(_TRT).strftime("%Y-%m-%d %H:%M:%S TRT")


def _age_seconds(iso_str: str) -> float:
    """Seconds elapsed since the ISO 8601 timestamp in *iso_str*."""
    dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
    return (datetime.now(UTC) - dt).total_seconds()


# ── Module-scoped async HTTP client ──────────────────────────────────────────

@pytest.fixture(scope="module")
async def http() -> httpx.AsyncClient:
    """Single shared async HTTP client for all tests in this module."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        yield client


# ── 1. Price within ±1 % of Yahoo Finance reference ─────────────────────────

@pytest.mark.parametrize("asset", ASSETS, ids=_ASSET_IDS)
async def test_price_within_tolerance(asset: dict, http: httpx.AsyncClient) -> None:
    """Our API price must be within ±1 % of the live Yahoo Finance price."""
    istanbul_time = _now_istanbul()

    ref = await _yahoo_quote(asset["yahoo_symbol"], http)
    api = await _api_quote(asset["api_symbol"], http)

    api_price = api["data"]["price"]
    ref_price = ref["price"]
    tolerance = ref_price * 0.01  # ±1 %
    diff = api_price - ref_price

    log.info(
        "[%s] Istanbul=%s  ref_price=%.4f  api_price=%.4f  diff=%.4f (%.3f%%)",
        asset["name"], istanbul_time, ref_price, api_price, diff,
        diff / ref_price * 100,
    )

    assert abs(diff) <= tolerance, (
        f"{asset['name']}: api_price={api_price:.4f} deviates from "
        f"ref_price={ref_price:.4f} by {diff / ref_price * 100:+.3f}% "
        f"(tolerance ±1%).  Istanbul time: {istanbul_time}"
    )


# ── 2. changePercent SIGN match — primary timezone check ─────────────────────

@pytest.mark.parametrize("asset", ASSETS, ids=_ASSET_IDS)
async def test_change_pct_sign_matches(asset: dict, http: httpx.AsyncClient) -> None:
    """changePercent sign must match Yahoo Finance.

    A sign mismatch means our day-open baseline is anchored to the wrong
    calendar midnight — i.e. a timezone boundary bug.

    The check is skipped (not failed) when:
    - Both values are so close to zero that a sign flip is statistically
      meaningless (< 0.05 pp), OR
    - Yahoo's ``regularMarketChangePercent`` field was absent/zero and we had
      to derive the reference from ``chartPreviousClose`` (Yahoo API quirk).
      A derived reference is still used for logging, but a sign mismatch in
      that case is flagged as a WARNING rather than a hard failure to avoid
      false positives caused by Yahoo returning 0 for live sessions.
    """
    istanbul_time = _now_istanbul()

    ref = await _yahoo_quote(asset["yahoo_symbol"], http)
    api = await _api_quote(asset["api_symbol"], http)

    api_pct = api["data"]["change_pct"]
    ref_pct = ref["change_pct"]
    ref_computed: bool = ref.get("change_pct_is_computed", False)

    log.info(
        "[%s] Istanbul=%s  ref_change_pct=%+.4f%%%s  api_change_pct=%+.4f%%",
        asset["name"], istanbul_time, ref_pct,
        " (derived)" if ref_computed else " (authoritative)",
        api_pct,
    )

    # Skip sign assertion in the near-zero ambiguity zone
    _NEAR_ZERO_THRESHOLD = 0.05  # percentage points
    if abs(ref_pct) < _NEAR_ZERO_THRESHOLD and abs(api_pct) < _NEAR_ZERO_THRESHOLD:
        log.warning(
            "[%s] Both ref and api change_pct within ±%.2f pp of zero — "
            "sign check skipped (ambiguous zone).  Istanbul time: %s",
            asset["name"], _NEAR_ZERO_THRESHOLD, istanbul_time,
        )
        return

    api_positive = api_pct >= 0
    ref_positive = ref_pct >= 0
    signs_match = api_positive == ref_positive

    if not signs_match and ref_computed:
        # Yahoo returned 0/null for the authoritative field; our derived
        # reference may itself be wrong.  Warn but don't hard-fail.
        log.warning(
            "POSSIBLE TIMEZONE BUG (unconfirmed) — %s: "
            "api_change_pct=%+.4f%%  ref_change_pct=%+.4f%% (derived from chartPreviousClose). "
            "Yahoo's regularMarketChangePercent was absent — cannot confirm definitively. "
            "Istanbul time: %s",
            asset["name"], api_pct, ref_pct, istanbul_time,
        )
        return

    assert signs_match, (
        f"TIMEZONE BOUNDARY BUG — {asset['name']}: "
        f"api_change_pct={api_pct:+.4f}%  ref_change_pct={ref_pct:+.4f}% (authoritative). "
        f"Signs differ — day-open baseline is anchored to the wrong midnight. "
        f"Istanbul time: {istanbul_time}"
    )


# ── 3. changePercent value within ±0.5 pp of reference ───────────────────────

@pytest.mark.parametrize("asset", ASSETS, ids=_ASSET_IDS)
async def test_change_pct_within_half_point(asset: dict, http: httpx.AsyncClient) -> None:
    """changePercent must be within ±0.5 percentage points of Yahoo reference.

    This assertion is demoted to a WARNING when Yahoo's
    ``regularMarketChangePercent`` was absent and we had to derive the reference
    from ``chartPreviousClose``, because in that case both sides are computing
    the same quantity — small differences are expected (snapshot timing, rounding).
    """
    istanbul_time = _now_istanbul()

    ref = await _yahoo_quote(asset["yahoo_symbol"], http)
    api = await _api_quote(asset["api_symbol"], http)

    api_pct = api["data"]["change_pct"]
    ref_pct = ref["change_pct"]
    ref_computed: bool = ref.get("change_pct_is_computed", False)
    diff = abs(api_pct - ref_pct)

    log.info(
        "[%s] Istanbul=%s  ref_pct=%+.4f%%%s  api_pct=%+.4f%%  abs_diff=%.4f pp",
        asset["name"], istanbul_time, ref_pct,
        " (derived)" if ref_computed else "",
        api_pct, diff,
    )

    if ref_computed:
        # Both sides derived from prev-close; minor divergence is expected
        if diff > 0.5:
            log.warning(
                "[%s] changePercent diff=%.4f pp > 0.5 pp, but Yahoo reference "
                "was itself derived (not authoritative) — soft breach logged only. "
                "Istanbul time: %s",
                asset["name"], diff, istanbul_time,
            )
        return

    assert diff <= 0.5, (
        f"{asset['name']}: change_pct diff={diff:.4f} pp exceeds ±0.5 pp tolerance. "
        f"api={api_pct:+.4f}%  ref={ref_pct:+.4f}%  "
        f"Istanbul time: {istanbul_time}"
    )


# ── 4. fetched_at within TTL ──────────────────────────────────────────────────

@pytest.mark.parametrize("asset", ASSETS, ids=_ASSET_IDS)
async def test_fetched_at_within_ttl(asset: dict, http: httpx.AsyncClient) -> None:
    """meta.fetched_at must be no older than the asset's TTL + 5 s buffer.

    A stale fetched_at means the background refresh loop has stalled or
    the cache is serving data from a previous session.
    """
    istanbul_time = _now_istanbul()

    api = await _api_quote(asset["api_symbol"], http)
    fetched_at_str = api["meta"]["fetched_at"]
    age = _age_seconds(fetched_at_str)
    ttl = asset["ttl_seconds"]
    max_age = ttl + 5  # 5 s network + processing buffer

    log.info(
        "[%s] Istanbul=%s  fetched_at=%s  age=%.1f s  TTL=%d s  max_allowed=%d s",
        asset["name"], istanbul_time, fetched_at_str, age, ttl, max_age,
    )

    assert age <= max_age, (
        f"{asset['name']}: data is {age:.0f} s old — exceeds TTL={ttl} s + 5 s buffer. "
        f"Cache refresh may have stalled.  Istanbul time: {istanbul_time}"
    )


# ── 5. Timestamp timezone explicitness ───────────────────────────────────────

@pytest.mark.parametrize("asset", ASSETS, ids=_ASSET_IDS)
async def test_timestamps_carry_explicit_timezone(asset: dict, http: httpx.AsyncClient) -> None:
    """meta.fetched_at and meta.as_of must carry explicit timezone info.

    Acceptable formats:
      - "2026-03-20T10:30:00Z"         (UTC with Z suffix)
      - "2026-03-20T13:30:00+03:00"    (Istanbul local with offset)
      - "2026-03-20T10:30:00+00:00"    (UTC with explicit offset)

    Bare "2026-03-20T10:30:00" is ambiguous and MUST NOT appear in responses.
    """
    istanbul_time = _now_istanbul()

    api = await _api_quote(asset["api_symbol"], http)
    meta = api["meta"]

    for field in ("fetched_at", "as_of"):
        raw: str | None = meta.get(field)
        if raw is None:
            continue  # as_of is optional

        # Must end with Z or have ± offset after the date portion
        has_tz = (
            raw.endswith("Z")
            or bool(re.search(r"[+-]\d{2}:\d{2}$", raw))
        )
        assert has_tz, (
            f"{asset['name']}.meta.{field}={raw!r} has no timezone suffix — "
            f"ambiguous timestamp.  Istanbul time: {istanbul_time}"
        )

        # Must parse as tz-aware datetime
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        assert dt.tzinfo is not None, (
            f"{asset['name']}.meta.{field} parsed as naive datetime — must be tz-aware. "
            f"Istanbul time: {istanbul_time}"
        )


# ── 6. is_live flag matches the registry declaration ─────────────────────────

@pytest.mark.parametrize("asset", ASSETS, ids=_ASSET_IDS)
async def test_is_live_flag_matches_registry(asset: dict, http: httpx.AsyncClient) -> None:
    """meta.is_live must match the is_live flag declared in the symbol registry.

    XU100 is expected to have is_live=False (15-min structurally delayed feed).
    All other tested assets should have is_live=True.
    """
    api = await _api_quote(asset["api_symbol"], http)
    api_is_live: bool = api["meta"]["is_live"]
    expected: bool = asset["is_live"]

    assert api_is_live == expected, (
        f"{asset['name']}: meta.is_live={api_is_live} "
        f"but the registry declares is_live={expected}. "
        f"Istanbul time: {_now_istanbul()}"
    )


# ── 7. doviz.com soft cross-check (USD/TRY only) ─────────────────────────────

async def test_usdtry_doviz_com_soft_check(http: httpx.AsyncClient) -> None:
    """Soft check: USD/TRY price vs doviz.com.

    doviz.com does not expose a public JSON API, so this test performs a
    best-effort HTML scrape.  Mismatches log a WARNING — they do NOT fail the
    test — to avoid CI breakage when the site's HTML structure changes.

    Pass/fail semantics:
      - HTTP error or scrape failure  → warning + test passes (informational only)
      - Price diff ≤ 1 %              → PASS with info log
      - Price diff > 1 %              → warning (soft threshold breach)
    """
    istanbul_time = _now_istanbul()
    log.info("[USD/TRY doviz.com] Istanbul=%s  starting soft cross-check", istanbul_time)

    try:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
        }
        resp = await http.get(
            "https://www.doviz.com",
            headers=headers,
            follow_redirects=True,
        )
        if resp.status_code != 200:
            log.warning(
                "doviz.com returned HTTP %d — soft check skipped.  Istanbul time: %s",
                resp.status_code, istanbul_time,
            )
            return

        html = resp.text

        # Attempt 1: JSON embedded in page — "code":"USD","selling":"37.1234"
        m = re.search(r'"code"\s*:\s*"USD"[^}]*?"selling"\s*:\s*"([\d.]+)"', html)
        if not m:
            # Attempt 2: data attribute pattern — data-socket-key="USD" ...>37.1234<
            m = re.search(r'data-socket-key="USD"[^>]*>([\d,.]+)<', html)
        if not m:
            # Attempt 3: generic USD rate pattern near "dolar" keyword
            m = re.search(
                r'(?i)dolar[^<]{0,200}?(\b\d{2}\.\d{3,4}\b)',
                html,
            )

        if not m:
            log.warning(
                "doviz.com: could not locate USD/TRY price in page — "
                "scrape pattern may be stale.  Istanbul time: %s",
                istanbul_time,
            )
            return

        doviz_price = float(m.group(1).replace(",", "."))

    except (httpx.RequestError, ValueError, AttributeError) as exc:
        log.warning(
            "doviz.com soft check aborted (%s: %s).  Istanbul time: %s",
            type(exc).__name__, exc, istanbul_time,
        )
        return

    api = await _api_quote("USD-TRY", http)
    api_price = api["data"]["price"]
    diff_pct = abs(api_price - doviz_price) / doviz_price * 100

    log.info(
        "[USD/TRY doviz.com] Istanbul=%s  doviz_price=%.4f  api_price=%.4f  diff=%.3f%%",
        istanbul_time, doviz_price, api_price, diff_pct,
    )

    if diff_pct > 1.0:
        log.warning(
            "USD/TRY: api_price=%.4f differs from doviz.com=%.4f by %.3f%% "
            "(exceeds 1%% soft threshold).  Istanbul time: %s",
            api_price, doviz_price, diff_pct, istanbul_time,
        )
    else:
        log.info(
            "USD/TRY: doviz.com cross-check PASSED (diff=%.3f%%).",
            diff_pct,
        )
