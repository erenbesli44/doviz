"""Quick FMP live-data verification using the stored .env key."""
import asyncio, json, os, sys
from pathlib import Path

env = Path(__file__).parent.parent / ".env"
for line in env.read_text().splitlines():
    if "=" in line and not line.startswith("#"):
        k, _, v = line.partition("=")
        os.environ.setdefault(k.strip(), v.strip())

import httpx

KEY = os.environ.get("FMP_API_KEY", "")
BASE = "https://financialmodelingprep.com/api/v3"
TIMEOUT = 8.0

TESTS = {
    "Indices": ["^GSPC", "^DJI", "^NDX", "^GDAXI", "^FTSE", "^N225"],
    "Commodities": ["GCUSD", "SIUSD", "BZUSD", "CLUSD", "NGUSD", "HGUSD", "KWUSD"],
    "FX-fallback": ["USDTRY", "EURTRY", "GBPTRY", "EURUSD"],
}

async def main():
    print(f"FMP key: {KEY[:8]}… ({len(KEY)} chars)\n")
    async with httpx.AsyncClient() as client:
        for group, symbols in TESTS.items():
            print(f"── {group} ─────────────────────────────────────")
            for sym in symbols:
                try:
                    r = await client.get(f"{BASE}/quote/{sym}", params={"apikey": KEY}, timeout=TIMEOUT)
                    if r.status_code == 200:
                        d = r.json()
                        if isinstance(d, list) and d:
                            q = d[0]
                            print(f"  ✓ {sym}: {q.get('price')}  ({q.get('changesPercentage'):+.2f}%)")
                        else:
                            print(f"  ~ {sym}: empty list or unexpected shape: {str(d)[:60]}")
                    else:
                        print(f"  ✗ {sym}: HTTP {r.status_code}")
                except Exception as e:
                    print(f"  ✗ {sym}: {e}")
            print()

asyncio.run(main())
