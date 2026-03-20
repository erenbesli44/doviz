#!/usr/bin/env python3
"""
Live price verification — directly hits external APIs for the three critical assets.

Usage:
    python scripts/test_live_prices.py
    python scripts/test_live_prices.py --api http://localhost:8000

Checks (no server required for provider checks):
  • USD/TRY    → Yahoo Finance (real-time, TTL 30s)
  • WTI Oil    → Yahoo Finance (real-time, TTL 60s)
  • Brent Oil  → FMP primary (~15-min delayed) + Yahoo fallback (real-time)
  • Bitcoin    → CoinGecko primary (real-time) + Yahoo fallback (real-time)
  • Cross-checks: BTC divergence ≤2%, Brent divergence ≤5%, USD/TRY triangulation ≤1%

When --api is given, also checks that the running server serves fresh cached prices.
"""
import argparse
import asyncio
import os
import sys
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path

# ── Load .env ─────────────────────────────────────────────────────────────────
_env = Path(__file__).parent.parent / ".env"
if _env.exists():
    for _line in _env.read_text().splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _, _v = _line.partition("=")
            os.environ.setdefault(_k.strip(), _v.strip())

import httpx  # noqa: E402 — after env load

TIMEOUT = 10.0
FMP_KEY = os.environ.get("FMP_API_KEY", "")
CG_KEY = os.environ.get("COINGECKO_API_KEY", "")

# ── Terminal colours ──────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
DIM    = "\033[2m"
RESET  = "\033[0m"


# ── Result tracking ───────────────────────────────────────────────────────────
@dataclass
class Check:
    label: str
    passed: bool
    value: str = ""
    note: str = ""


_checks: list[Check] = []


def _pass(label: str, value: str = "", note: str = "") -> None:
    _checks.append(Check(label, True, value, note))
    print(f"  {GREEN}✓{RESET} {label}: {BOLD}{value}{RESET} {DIM}{note}{RESET}")


def _fail(label: str, note: str = "") -> None:
    _checks.append(Check(label, False, note=note))
    print(f"  {RED}✗{RESET} {label}: {note}")


def _warn(label: str, value: str = "", note: str = "") -> None:
    _checks.append(Check(label, True, value, note))
    print(f"  {YELLOW}~{RESET} {label}: {BOLD}{value}{RESET}  {YELLOW}{note}{RESET}")


def _section(title: str) -> None:
    pad = max(1, 58 - len(title))
    print(f"\n{BOLD}── {title} {'─' * pad}{RESET}")


def _age(fetched_at: datetime) -> str:
    secs = (datetime.now(UTC) - fetched_at).total_seconds()
    return f"{secs:.1f}s ago"


def _plausible(price: float, lo: float, hi: float) -> bool:
    return lo <= price <= hi


# ── Raw provider fetchers (no provider class overhead) ────────────────────────
_YAHOO_HEADERS = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}


async def _yahoo(client: httpx.AsyncClient, symbol: str) -> dict:
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
    resp = await client.get(url, params={"interval": "1d", "range": "5d"}, headers=_YAHOO_HEADERS)
    resp.raise_for_status()
    meta = resp.json()["chart"]["result"][0]["meta"]
    price = float(meta["regularMarketPrice"])
    prev = meta.get("chartPreviousClose") or price
    chg = (price - prev) / prev * 100 if prev else 0.0
    return {"price": price, "change_pct": round(chg, 4), "fetched_at": datetime.now(UTC)}


async def _coingecko(client: httpx.AsyncClient, coin_id: str) -> dict:
    headers = {"x-cg-demo-api-key": CG_KEY} if CG_KEY else {}
    resp = await client.get(
        "https://api.coingecko.com/api/v3/simple/price",
        params={"ids": coin_id, "vs_currencies": "usd", "include_24hr_change": "true"},
        headers=headers,
    )
    resp.raise_for_status()
    data = resp.json()[coin_id]
    return {
        "price": float(data["usd"]),
        "change_pct": round(float(data.get("usd_24h_change") or 0), 4),
        "fetched_at": datetime.now(UTC),
    }


async def _fmp(client: httpx.AsyncClient, symbol: str) -> dict:
    if not FMP_KEY:
        raise ValueError("FMP_API_KEY not set")
    resp = await client.get(
        "https://financialmodelingprep.com/stable/quote",
        params={"symbol": symbol, "apikey": FMP_KEY},
    )
    resp.raise_for_status()
    q = resp.json()[0]
    return {
        "price": float(q["price"]),
        "change_pct": round(float(q.get("changesPercentage") or 0), 4),
        "fetched_at": datetime.now(UTC),
    }


# ── Check runners ──────────────────────────────────────────────────────────────

async def _check_usdtry(client: httpx.AsyncClient) -> None:
    _section("USD/TRY  (Yahoo Finance — real-time, TTL 30s)")
    try:
        q = await _yahoo(client, "USDTRY=X")
        label = f"{q['price']:.4f} TRY  Δ {q['change_pct']:+.3f}%  {_age(q['fetched_at'])}"
        if _plausible(q["price"], 25.0, 60.0):
            _pass("USD/TRY", label)
        else:
            _fail("USD/TRY", f"{q['price']:.4f} — outside plausible range [25, 60]")
    except Exception as exc:
        _fail("USD/TRY", str(exc))


async def _check_wti(client: httpx.AsyncClient) -> None:
    _section("WTI Crude Oil  (Yahoo Finance — real-time, TTL 60s)")
    try:
        q = await _yahoo(client, "CL=F")
        label = f"${q['price']:.2f}/bbl  Δ {q['change_pct']:+.3f}%  {_age(q['fetched_at'])}"
        if _plausible(q["price"], 30.0, 200.0):
            _pass("WTI", label)
        else:
            _fail("WTI", f"${q['price']:.2f} — outside plausible range [30, 200]")
    except Exception as exc:
        _fail("WTI", str(exc))


async def _check_brent(client: httpx.AsyncClient) -> None:
    _section("Brent Crude Oil  (FMP ≈15-min delayed, TTL 300s | Yahoo fallback real-time)")
    brent_fmp = brent_yahoo = None

    try:
        brent_fmp = await _fmp(client, "BZUSD")
        label = f"${brent_fmp['price']:.2f}/bbl  Δ {brent_fmp['change_pct']:+.3f}%"
        if _plausible(brent_fmp["price"], 30.0, 200.0):
            _warn("Brent FMP/BZUSD", label, "(source lags market ~15-20 min)")
        else:
            _fail("Brent FMP/BZUSD", f"${brent_fmp['price']:.2f} — outside range [30, 200]")
    except ValueError:
        _warn("Brent FMP/BZUSD", note="FMP_API_KEY not set — skipped")
    except Exception as exc:
        _fail("Brent FMP/BZUSD", str(exc))

    try:
        brent_yahoo = await _yahoo(client, "BZ=F")
        label = f"${brent_yahoo['price']:.2f}/bbl  Δ {brent_yahoo['change_pct']:+.3f}%  {_age(brent_yahoo['fetched_at'])}"
        if _plausible(brent_yahoo["price"], 30.0, 200.0):
            _pass("Brent Yahoo/BZ=F", label)
        else:
            _fail("Brent Yahoo/BZ=F", f"${brent_yahoo['price']:.2f} — outside range [30, 200]")
    except Exception as exc:
        _fail("Brent Yahoo/BZ=F", str(exc))

    if brent_fmp and brent_yahoo:
        div = abs(brent_fmp["price"] - brent_yahoo["price"]) / brent_yahoo["price"] * 100
        if div <= 5.0:
            _pass("Brent cross-check (FMP vs Yahoo)", f"{div:.2f}%", "divergence ≤5% ✓")
        else:
            _fail("Brent cross-check (FMP vs Yahoo)", f"{div:.2f}% — exceeds 5% (FMP may be stale)")


async def _check_bitcoin(client: httpx.AsyncClient) -> None:
    _section("Bitcoin  (CoinGecko — real-time, TTL 60s | Yahoo fallback)")
    btc_cg = btc_yahoo = None

    try:
        btc_cg = await _coingecko(client, "bitcoin")
        label = f"${btc_cg['price']:,.2f}  24h Δ {btc_cg['change_pct']:+.3f}%  {_age(btc_cg['fetched_at'])}"
        if _plausible(btc_cg["price"], 10_000, 500_000):
            _pass("BTC CoinGecko", label)
        else:
            _fail("BTC CoinGecko", f"${btc_cg['price']:,.0f} — outside range [10k, 500k]")
    except Exception as exc:
        _fail("BTC CoinGecko", str(exc))

    try:
        btc_yahoo = await _yahoo(client, "BTC-USD")
        label = f"${btc_yahoo['price']:,.2f}  Δ {btc_yahoo['change_pct']:+.3f}%  {_age(btc_yahoo['fetched_at'])}"
        if _plausible(btc_yahoo["price"], 10_000, 500_000):
            _pass("BTC Yahoo/BTC-USD", label)
        else:
            _fail("BTC Yahoo/BTC-USD", f"${btc_yahoo['price']:,.0f} — outside range")
    except Exception as exc:
        _fail("BTC Yahoo/BTC-USD", str(exc))

    if btc_cg and btc_yahoo:
        div = abs(btc_cg["price"] - btc_yahoo["price"]) / btc_yahoo["price"] * 100
        if div <= 2.0:
            _pass("BTC cross-check (CoinGecko vs Yahoo)", f"{div:.2f}%", "divergence ≤2% ✓")
        else:
            _warn(
                "BTC cross-check (CoinGecko vs Yahoo)",
                f"{div:.2f}%",
                "> 2% — check for slippage or delayed Yahoo feed",
            )


async def _check_triangulation(client: httpx.AsyncClient) -> None:
    _section("USD/TRY Triangulation  (EURTRY ÷ EURUSD ≈ USDTRY, tolerance ≤1%)")
    try:
        q_usdtry = await _yahoo(client, "USDTRY=X")
        q_eurusd = await _yahoo(client, "EURUSD=X")
        q_eurtry = await _yahoo(client, "EURTRY=X")

        derived = q_eurtry["price"] / q_eurusd["price"]
        div = abs(q_usdtry["price"] - derived) / q_usdtry["price"] * 100

        label = (
            f"direct={q_usdtry['price']:.4f}  "
            f"derived={derived:.4f}  "
            f"deviation={div:.3f}%"
        )
        if div <= 1.0:
            _pass("USD/TRY triangulation", label, "✓")
        else:
            _fail("USD/TRY triangulation", f"{label} — exceeds 1% tolerance")
    except Exception as exc:
        _fail("USD/TRY triangulation", str(exc))


async def _check_api_freshness(api_base: str) -> None:
    _section(f"API Freshness  ({api_base})")
    checks = [
        # (path,               label,      lo,     hi,      max_age_s, fmt)
        ("/v1/quotes/USD-TRY", "USD/TRY",  25.0,   60.0,    35,       "{:.4f}"),
        ("/v1/quotes/WTI",     "WTI",      30.0,   200.0,   65,       "${:.2f}"),
        ("/v1/quotes/BRENT",   "Brent",    30.0,   200.0,   310,      "${:.2f}"),
        ("/v1/quotes/BTC-USD", "BTC/USD",  10_000, 500_000, 90,       "${:,.2f}"),
    ]
    async with httpx.AsyncClient(base_url=api_base, timeout=10.0) as api:
        for path, label, lo, hi, max_age, fmt in checks:
            try:
                resp = await api.get(path)
                resp.raise_for_status()
                body = resp.json()
                price = body["data"]["price"]
                fa_str = body["meta"]["fetched_at"]
                age = (
                    datetime.now(UTC)
                    - datetime.fromisoformat(fa_str.replace("Z", "+00:00"))
                ).total_seconds()
                price_str = fmt.format(price)

                if not _plausible(price, lo, hi):
                    _fail(f"API {label}", f"{price_str} — outside range [{lo}, {hi}]")
                elif age > max_age:
                    _fail(f"API {label}", f"age {age:.0f}s > {max_age}s — cache TTL breach")
                else:
                    _pass(f"API {label}", price_str, f"age {age:.0f}s ≤ {max_age}s")
            except httpx.ConnectError:
                _fail(f"API {label}", f"cannot reach {api_base}")
                break
            except Exception as exc:
                _fail(f"API {label}", str(exc))


# ── Entry point ───────────────────────────────────────────────────────────────

async def _main(api_base: str | None) -> int:
    print(f"\n{BOLD}{CYAN}Finance API — Live Price Verification{RESET}")
    print(f"{DIM}{datetime.now(UTC).strftime('%Y-%m-%d %H:%M:%S UTC')}{RESET}")

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        await _check_usdtry(client)
        await _check_wti(client)
        await _check_brent(client)
        await _check_bitcoin(client)
        await _check_triangulation(client)

    if api_base:
        await _check_api_freshness(api_base)

    n_pass = sum(1 for c in _checks if c.passed)
    n_fail = len(_checks) - n_pass

    print(f"\n{BOLD}{'─' * 60}{RESET}")
    if n_fail == 0:
        print(f"{GREEN}{BOLD}All {len(_checks)} checks passed{RESET}")
    else:
        print(f"{RED}{BOLD}{n_fail}/{len(_checks)} checks failed{RESET}")
        for c in _checks:
            if not c.passed:
                print(f"  {RED}✗{RESET} {c.label}: {c.note}")
    print()
    return n_fail


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Verify live market data prices")
    parser.add_argument(
        "--api",
        metavar="URL",
        default=None,
        help="Base URL of a running API server (e.g. http://localhost:8000)",
    )
    args = parser.parse_args()
    sys.exit(1 if asyncio.run(_main(args.api)) > 0 else 0)
