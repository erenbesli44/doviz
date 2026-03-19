"""Check FMP stable API coverage for all symbols we need."""
import asyncio, os
from pathlib import Path

env = Path(__file__).parent.parent / ".env"
for line in env.read_text().splitlines():
    if "=" in line and not line.startswith("#"):
        k, _, v = line.partition("=")
        os.environ.setdefault(k.strip(), v.strip())

import httpx
KEY = os.environ.get("FMP_API_KEY", "")
BASE = "https://financialmodelingprep.com/stable"

SYMBOLS = [
    # Indices
    ("^GSPC", "S&P 500"), ("^DJI", "Dow Jones"), ("^NDX", "Nasdaq"),
    ("^GDAXI", "DAX"), ("^FTSE", "FTSE"), ("^N225", "Nikkei"),
    # Commodities
    ("GCUSD", "Gold"), ("SIUSD", "Silver"), ("BZUSD", "Brent"),
    ("CLUSD", "WTI"), ("NGUSD", "NatGas"), ("HGUSD", "Copper"), ("KWUSD", "Wheat"),
    # FX fallback
    ("USDTRY", "USD/TRY"), ("EURTRY", "EUR/TRY"), ("GBPTRY", "GBP/TRY"),
    ("EURUSD", "EUR/USD"), ("GBPUSD", "GBP/USD"),
]

async def main():
    print(f"FMP /stable/quote endpoint — key {KEY[:8]}…\n")
    async with httpx.AsyncClient() as c:
        for sym, label in SYMBOLS:
            try:
                r = await c.get(f"{BASE}/quote", params={"symbol": sym, "apikey": KEY}, timeout=6)
                if r.status_code == 200 and r.text.strip():
                    d = r.json()
                    if isinstance(d, list) and d:
                        q = d[0]
                        chg = q.get("changesPercentage") or 0
                        print(f"  ✓ {label:20s} ({sym}): {q.get('price')}  {chg:+.2f}%")
                    else:
                        print(f"  ~ {label:20s} ({sym}): empty list")
                elif r.status_code == 200:
                    print(f"  ~ {label:20s} ({sym}): 200 but empty body")
                else:
                    body = r.text[:60] if r.text else ""
                    print(f"  ✗ {label:20s} ({sym}): HTTP {r.status_code} {body}")
            except Exception as e:
                print(f"  ! {label:20s} ({sym}): {e}")

asyncio.run(main())
