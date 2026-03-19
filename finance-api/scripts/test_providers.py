"""
Provider reachability test — runs against all live APIs and prints a clear summary.

Usage:
    python scripts/test_providers.py

No API keys needed except Finnhub (read from .env automatically).
"""
import asyncio
import os
import sys
from dataclasses import dataclass, field
from pathlib import Path

# Load .env from project root
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())

import httpx

FINNHUB_KEY = os.environ.get("FINNHUB_API_KEY", "")
FMP_KEY = os.environ.get("FMP_API_KEY", "")
TIMEOUT = 8.0

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"


@dataclass
class Result:
    provider: str
    symbol: str
    label: str
    ok: bool
    value: str = ""
    note: str = ""


results: list[Result] = []


def ok(provider, symbol, label, value="", note=""):
    results.append(Result(provider, symbol, label, True, value, note))
    print(f"  {GREEN}✓{RESET} {label}: {BOLD}{value}{RESET} {note}")


def fail(provider, symbol, label, note=""):
    results.append(Result(provider, symbol, label, False, note=note))
    print(f"  {RED}✗{RESET} {label}: {note}")


def warn(provider, symbol, label, value="", note=""):
    results.append(Result(provider, symbol, label, True, value, note))
    print(f"  {YELLOW}~{RESET} {label}: {BOLD}{value}{RESET} {YELLOW}{note}{RESET}")


# ─────────────────────────────────────────────────────────────────────────────
# FINNHUB
# ─────────────────────────────────────────────────────────────────────────────

FINNHUB_FOREX_SYMBOLS = {
    "USD/TRY": "OANDA:USD_TRY",
    "EUR/TRY": "OANDA:EUR_TRY",
    "GBP/TRY": "OANDA:GBP_TRY",
    "CHF/TRY": "OANDA:CHF_TRY",
    "JPY/TRY": "OANDA:JPY_TRY",
    "EUR/USD": "OANDA:EUR_USD",
    "GBP/USD": "OANDA:GBP_USD",
}

async def test_finnhub(client: httpx.AsyncClient):
    print(f"\n{BOLD}── Finnhub ────────────────────────────────────────────────{RESET}")
    if not FINNHUB_KEY:
        print(f"  {RED}No FINNHUB_API_KEY set — skipping{RESET}")
        return

    base = "https://finnhub.io/api/v1"

    # Test each forex pair
    for internal, fh_sym in FINNHUB_FOREX_SYMBOLS.items():
        try:
            r = await client.get(
                f"{base}/quote",
                params={"symbol": fh_sym, "token": FINNHUB_KEY},
                timeout=TIMEOUT,
            )
            if r.status_code == 200:
                data = r.json()
                price = data.get("c")
                pc = data.get("pc")
                if price and price > 0:
                    change = round((price - pc) / pc * 100, 3) if pc else 0
                    ok("finnhub", internal, internal, f"{price:.4f}", f"(prev close: {pc})")
                else:
                    warn("finnhub", internal, internal, str(data), "price=0 — market may be closed")
            else:
                fail("finnhub", internal, internal, f"HTTP {r.status_code}: {r.text[:80]}")
        except Exception as e:
            fail("finnhub", internal, internal, str(e))

    # Test forex candles (history) for one pair
    print(f"\n  {BOLD}Finnhub forex candles (history){RESET}")
    import time
    now = int(time.time())
    from_ = now - 86400  # 24h
    try:
        r = await client.get(
            f"{base}/forex/candle",
            params={"symbol": "OANDA:USD_TRY", "resolution": "60", "from": from_, "to": now, "token": FINNHUB_KEY},
            timeout=TIMEOUT,
        )
        if r.status_code == 200:
            data = r.json()
            status = data.get("s")
            count = len(data.get("c", []))
            if status == "ok" and count > 0:
                ok("finnhub", "USD/TRY history", "USD/TRY 24h candles", f"{count} hourly bars")
            else:
                warn("finnhub", "USD/TRY history", "USD/TRY 24h candles", str(data.get("s")), f"— {count} bars (no_data if market closed)")
        else:
            fail("finnhub", "USD/TRY history", "USD/TRY candles", f"HTTP {r.status_code}")
    except Exception as e:
        fail("finnhub", "USD/TRY history", "USD/TRY candles", str(e))

    # Test a stock quote (to see if plan supports it)
    print(f"\n  {BOLD}Finnhub stock quote (S&P 500 proxy: SPY){RESET}")
    try:
        r = await client.get(
            f"{base}/quote",
            params={"symbol": "SPY", "token": FINNHUB_KEY},
            timeout=TIMEOUT,
        )
        if r.status_code == 200:
            data = r.json()
            price = data.get("c")
            if price and price > 0:
                ok("finnhub", "SPY", "SPY (S&P 500 ETF)", f"{price:.2f}")
            else:
                warn("finnhub", "SPY", "SPY (S&P 500 ETF)", str(data), "price=0")
        else:
            fail("finnhub", "SPY", "SPY stock", f"HTTP {r.status_code}")
    except Exception as e:
        fail("finnhub", "SPY", "SPY stock", str(e))


# ─────────────────────────────────────────────────────────────────────────────
# COINGECKO
# ─────────────────────────────────────────────────────────────────────────────

async def test_coingecko(client: httpx.AsyncClient):
    print(f"\n{BOLD}── CoinGecko ───────────────────────────────────────────────{RESET}")
    base = "https://api.coingecko.com/api/v3"

    # Ping
    try:
        r = await client.get(f"{base}/ping", timeout=TIMEOUT)
        if r.status_code == 200:
            ok("coingecko", "ping", "API reachable", r.json().get("gecko_says", "ok"))
        else:
            fail("coingecko", "ping", "API ping", f"HTTP {r.status_code}")
    except Exception as e:
        fail("coingecko", "ping", "API ping", str(e))
        return

    # Bitcoin price
    try:
        r = await client.get(
            f"{base}/simple/price",
            params={"ids": "bitcoin", "vs_currencies": "usd", "include_24hr_change": "true"},
            timeout=TIMEOUT,
        )
        if r.status_code == 200:
            data = r.json().get("bitcoin", {})
            price = data.get("usd")
            change = data.get("usd_24h_change")
            if price:
                ok("coingecko", "BTC/USD", "BTC/USD", f"${price:,.2f}", f"({change:+.2f}%)" if change else "")
            else:
                fail("coingecko", "BTC/USD", "BTC/USD", "empty price")
        elif r.status_code == 429:
            warn("coingecko", "BTC/USD", "BTC/USD", "", "HTTP 429 — rate limited (still reachable)")
        else:
            fail("coingecko", "BTC/USD", "BTC/USD", f"HTTP {r.status_code}: {r.text[:80]}")
    except Exception as e:
        fail("coingecko", "BTC/USD", "BTC/USD", str(e))

    # Bitcoin 24h history
    try:
        r = await client.get(
            f"{base}/coins/bitcoin/market_chart",
            params={"vs_currency": "usd", "days": "1", "interval": "hourly"},
            timeout=TIMEOUT,
        )
        if r.status_code == 200:
            points = r.json().get("prices", [])
            ok("coingecko", "BTC history", "BTC 24h history", f"{len(points)} hourly points")
        elif r.status_code == 429:
            warn("coingecko", "BTC history", "BTC history", "", "HTTP 429 — rate limited")
        else:
            fail("coingecko", "BTC history", "BTC history", f"HTTP {r.status_code}")
    except Exception as e:
        fail("coingecko", "BTC history", "BTC history", str(e))


# ─────────────────────────────────────────────────────────────────────────────
# FMP
# ─────────────────────────────────────────────────────────────────────────────

FMP_SYMBOLS = {
    "S&P 500": "^GSPC",
    "Dow Jones": "^DJI",
    "Nasdaq 100": "^NDX",
    "Gold (XAU/USD)": "GCUSD",
    "Silver (XAG/USD)": "SIUSD",
    "Brent Oil": "BZUSD",
    "WTI Oil": "CLUSD",
    "EUR/USD (FX)": "EURUSD",
}

async def test_fmp(client: httpx.AsyncClient):
    print(f"\n{BOLD}── FMP (Financial Modeling Prep) ───────────────────────────{RESET}")
    if not FMP_KEY:
        print(f"  {YELLOW}No FMP_API_KEY set — testing unauthenticated (demo key){RESET}")
        api_key = "demo"
    else:
        api_key = FMP_KEY

    base = "https://financialmodelingprep.com/api/v3"

    for label, sym in FMP_SYMBOLS.items():
        try:
            r = await client.get(
                f"{base}/quote/{sym}",
                params={"apikey": api_key},
                timeout=TIMEOUT,
            )
            if r.status_code == 200:
                data = r.json()
                if isinstance(data, list) and data:
                    q = data[0]
                    price = q.get("price")
                    change = q.get("changesPercentage")
                    if price:
                        ok("fmp", sym, label, f"{price:.4f}", f"({change:+.2f}%)" if change else "")
                    else:
                        warn("fmp", sym, label, str(q)[:60], "null price")
                elif isinstance(data, dict) and "Error Message" in data:
                    fail("fmp", sym, label, data["Error Message"][:80])
                else:
                    warn("fmp", sym, label, str(data)[:60], "unexpected response shape")
            elif r.status_code == 403:
                fail("fmp", sym, label, "HTTP 403 — key required or plan limit")
            else:
                fail("fmp", sym, label, f"HTTP {r.status_code}: {r.text[:60]}")
        except Exception as e:
            fail("fmp", sym, label, str(e))


# ─────────────────────────────────────────────────────────────────────────────
# YAHOO FINANCE
# ─────────────────────────────────────────────────────────────────────────────

YAHOO_SYMBOLS = {
    "BIST 100": "XU100.IS",
    "S&P 500": "^GSPC",
    "Dow Jones": "^DJI",
    "Nasdaq 100": "^NDX",
    "DAX 40": "^GDAXI",
    "Gold futures": "GC=F",
    "Silver futures": "SI=F",
    "Brent futures": "BZ=F",
    "WTI futures": "CL=F",
    "EUR/USD": "EURUSD=X",
    "USD/TRY": "USDTRY=X",
}

async def test_yahoo(client: httpx.AsyncClient):
    print(f"\n{BOLD}── Yahoo Finance (unofficial) ──────────────────────────────{RESET}")
    base = "https://query1.finance.yahoo.com/v8/finance/chart"
    headers = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}

    for label, sym in YAHOO_SYMBOLS.items():
        try:
            r = await client.get(
                f"{base}/{sym}",
                params={"interval": "1d", "range": "2d"},
                headers=headers,
                timeout=TIMEOUT,
            )
            if r.status_code == 200:
                data = r.json()
                result = data.get("chart", {}).get("result")
                if result:
                    meta = result[0].get("meta", {})
                    price = meta.get("regularMarketPrice")
                    market = meta.get("marketState", "")
                    currency = meta.get("currency", "")
                    if price:
                        note = f"[{market}] currency={currency}"
                        ok("yahoo", sym, label, f"{price:,.2f}", note)
                    else:
                        warn("yahoo", sym, label, str(meta)[:60], "null price")
                else:
                    err = data.get("chart", {}).get("error")
                    fail("yahoo", sym, label, str(err)[:80] if err else "empty result")
            elif r.status_code == 429:
                warn("yahoo", sym, label, "", "HTTP 429 — rate limited")
            else:
                fail("yahoo", sym, label, f"HTTP {r.status_code}: {r.text[:60]}")
        except Exception as e:
            fail("yahoo", sym, label, str(e))


# ─────────────────────────────────────────────────────────────────────────────
# HAREM ALTIN
# ─────────────────────────────────────────────────────────────────────────────

async def test_harem_altin(client: httpx.AsyncClient):
    print(f"\n{BOLD}── Harem Altın (scraper) ───────────────────────────────────{RESET}")
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
        "Referer": "https://www.google.com/",
    }

    urls_to_try = [
        "https://www.haremaltın.com.tr/altin-fiyatlari",
        "https://www.haremaltin.com/altin-fiyatlari",
        "https://www.haremaltin.com.tr/altin-fiyatlari",
    ]

    reached = False
    for url in urls_to_try:
        try:
            r = await client.get(url, headers=headers, timeout=TIMEOUT, follow_redirects=True)
            if r.status_code == 200:
                html = r.text
                # Try to find any price-like value for 1000 gram / 1 kg
                import re
                patterns = [
                    r'1[.\s]?000\s*[Gg]ram[^<]{0,200}?([\d]{4,7}[,.][\d]{2})',
                    r'"1000"[^}]{0,100}"satis"[^}]{0,50}"([\d.,]+)"',
                    r'1\.000[^<]{0,100}([\d.]{5,8})',
                ]
                found_price = None
                for pat in patterns:
                    m = re.search(pat, html)
                    if m:
                        raw = m.group(1)
                        try:
                            price = float(raw.replace(".", "").replace(",", "."))
                            if price > 100000:  # sanity: 1kg TRY gold should be >100k TRY
                                found_price = price
                                break
                        except ValueError:
                            pass

                if found_price:
                    ok("harem_altin", "1kg", "Harem 1kg TRY", f"{found_price:,.2f} TRY", f"(from {url})")
                else:
                    # Check if the page at least loaded
                    if "altın" in html.lower() or "altin" in html.lower():
                        warn("harem_altin", "1kg", "Harem page reachable", "",
                             f"Page loaded ({len(html)} chars) but 1kg price pattern not found — scraper needs tuning")
                    else:
                        warn("harem_altin", "1kg", "Harem page", "", f"Loaded but content not gold-related ({url})")
                reached = True
                break
            elif r.status_code in (403, 406):
                fail("harem_altin", "1kg", f"Harem ({url})", f"HTTP {r.status_code} — bot protection")
            else:
                fail("harem_altin", "1kg", f"Harem ({url})", f"HTTP {r.status_code}")
        except Exception as e:
            fail("harem_altin", "1kg", f"Harem ({url})", str(e))

    if not reached:
        print(f"  {YELLOW}→ Alternative: use Altın Fiyatları API or bigpara.com for physical gold{RESET}")


# ─────────────────────────────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────────────────────────────

def print_summary():
    print(f"\n{'═' * 62}")
    print(f"{BOLD}  PROVIDER REACHABILITY SUMMARY{RESET}")
    print(f"{'═' * 62}")

    by_provider: dict[str, list[Result]] = {}
    for r in results:
        by_provider.setdefault(r.provider, []).append(r)

    total_ok = sum(1 for r in results if r.ok)
    total = len(results)

    for provider, items in by_provider.items():
        passed = [i for i in items if i.ok]
        failed = [i for i in items if not i.ok]
        status = GREEN + "✓" + RESET if failed == [] else (YELLOW + "~" + RESET if passed else RED + "✗" + RESET)
        print(f"\n  {status} {BOLD}{provider.upper()}{RESET}  ({len(passed)}/{len(items)} OK)")
        for item in items:
            icon = f"{GREEN}✓{RESET}" if item.ok else f"{RED}✗{RESET}"
            val = f" = {item.value}" if item.value else ""
            note = f"  ← {item.note}" if item.note else ""
            print(f"      {icon} {item.label}{val}{note}")

    print(f"\n{'─' * 62}")
    print(f"  Total: {total_ok}/{total} checks passed")

    print(f"\n{BOLD}  KEY DECISIONS FOR THE APP:{RESET}")
    print("""
  FX (USD/TRY, EUR/TRY …)  → Finnhub OANDA (live, free tier)
  Bitcoin (BTC/USD)         → CoinGecko simple/price (live, free)
  S&P 500, Dow, Nasdaq      → Check FMP result above
                               Fallback: Yahoo Finance (slightly delayed)
  Gold spot (XAU/USD)       → Check FMP result above
                               Fallback: Yahoo GC=F futures
  BIST 100                  → Yahoo Finance XU100.IS (15-min delayed, free)
  Harem 1kg physical gold   → Scraper (fragile); may need manual adjustment
""")


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

async def main():
    print(f"\n{BOLD}Finance API — Provider Reachability Test{RESET}")
    print(f"Finnhub key: {'SET (' + FINNHUB_KEY[:8] + '…)' if FINNHUB_KEY else 'NOT SET'}")
    print(f"FMP key:     {'SET' if FMP_KEY else 'NOT SET — will use demo'}")

    async with httpx.AsyncClient(follow_redirects=True) as client:
        await test_finnhub(client)
        await test_coingecko(client)
        await test_fmp(client)
        await test_yahoo(client)
        await test_harem_altin(client)

    print_summary()


if __name__ == "__main__":
    asyncio.run(main())
