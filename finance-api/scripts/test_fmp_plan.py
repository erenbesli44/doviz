"""Check FMP plan tier and working endpoints."""
import asyncio, os
from pathlib import Path

env = Path(__file__).parent.parent / ".env"
for line in env.read_text().splitlines():
    if "=" in line and not line.startswith("#"):
        k, _, v = line.partition("=")
        os.environ.setdefault(k.strip(), v.strip())

import httpx
KEY = os.environ.get("FMP_API_KEY", "")

async def check(client, label, url):
    try:
        r = await client.get(url, timeout=6)
        d = r.json()
        if r.status_code == 200 and isinstance(d, list) and d:
            print(f"  ✓ {label}: {d[0].get('price')}")
        elif r.status_code == 200:
            print(f"  ~ {label}: 200 but unexpected: {str(d)[:80]}")
        else:
            print(f"  ✗ {label}: HTTP {r.status_code} | {str(d)[:80]}")
    except Exception as e:
        print(f"  ! {label}: {e}")

async def main():
    base_v3 = "https://financialmodelingprep.com/api/v3"
    base_st = "https://financialmodelingprep.com/stable"
    async with httpx.AsyncClient() as c:
        print("-- v3 endpoints --")
        await check(c, "v3 AAPL (stock)", f"{base_v3}/quote/AAPL?apikey={KEY}")
        await check(c, "v3 ^GSPC (index)", f"{base_v3}/quote/%5EGSPC?apikey={KEY}")
        await check(c, "v3 GCUSD (gold)", f"{base_v3}/quote/GCUSD?apikey={KEY}")
        await check(c, "v3 USDTRY (fx)", f"{base_v3}/quote/USDTRY?apikey={KEY}")
        print("\n-- stable endpoints --")
        await check(c, "stable AAPL", f"{base_st}/quote?symbol=AAPL&apikey={KEY}")
        await check(c, "stable ^GSPC", f"{base_st}/quote?symbol=%5EGSPC&apikey={KEY}")
        await check(c, "stable GCUSD", f"{base_st}/quote?symbol=GCUSD&apikey={KEY}")
        await check(c, "stable USDTRY", f"{base_st}/quote?symbol=USDTRY&apikey={KEY}")
        # Also try forex endpoint specifically
        print("\n-- FX-specific endpoint --")
        await check(c, "v4 forex USDTRY", f"https://financialmodelingprep.com/api/v4/forex?symbol=USDTRY&apikey={KEY}")

asyncio.run(main())
