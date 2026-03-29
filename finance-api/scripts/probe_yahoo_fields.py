"""Check what Yahoo v8 chart API returns for open/previousClose fields."""
import asyncio, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import httpx

async def main():
    syms = ["USDTRY=X", "EURUSD=X", "GC=F", "BZ=F", "^GSPC", "^NDX", "XU100.IS"]
    async with httpx.AsyncClient(timeout=10.0) as c:
        for sym in syms:
            r = await c.get(
                f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}",
                params={"interval": "1h", "range": "2d"},
                headers={"User-Agent": "Mozilla/5.0"},
            )
            data = r.json()
            try:
                result = data["chart"]["result"][0]
                meta = result["meta"]
            except Exception:
                print(f"  {sym}: ERROR - {r.text[:100]}")
                continue
                
            print(f"\n{sym}:")
            for key in ["regularMarketPrice", "regularMarketOpen", "regularMarketDayHigh",
                         "regularMarketDayLow", "regularMarketChangePercent", "regularMarketChange",
                         "chartPreviousClose", "previousClose", "marketState"]:
                print(f"  {key}: {meta.get(key)}")

asyncio.run(main())
