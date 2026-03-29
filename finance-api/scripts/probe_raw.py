"""Quick probe: dump raw FMP and Yahoo responses for comparison."""
import asyncio, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import httpx
from app.config import Settings

settings = Settings()

async def main():
    async with httpx.AsyncClient(timeout=10.0) as c:
        # FMP raw responses
        for sym in ["^GSPC", "^DJI", "^FTSE", "^N225", "BZUSD", "GCUSD", "SIUSD", "EURUSD", "GBPUSD"]:
            r = await c.get(
                "https://financialmodelingprep.com/stable/quote",
                params={"symbol": sym, "apikey": settings.fmp_api_key},
            )
            data = r.json()
            if data and isinstance(data, list):
                d = data[0]
                print(f"FMP {sym:>10}: price={d.get('price')}  chg%={d.get('changesPercentage')}  prevClose={d.get('previousClose')}  open={d.get('open')}  dayH={d.get('dayHigh')}  dayL={d.get('dayLow')}")
            else:
                print(f"FMP {sym:>10}: {r.status_code} - {r.text[:100]}")

        print()

        # Yahoo raw meta comparison
        for sym in ["^GSPC", "^DJI", "^FTSE", "^N225", "BZ=F", "GC=F", "SI=F", "EURUSD=X", "GBPUSD=X"]:
            r = await c.get(
                f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}",
                params={"interval": "1h", "range": "2d"},
                headers={"User-Agent": "Mozilla/5.0"},
            )
            data = r.json()
            meta = data.get("chart", {}).get("result", [{}])[0].get("meta", {})
            print(f"YAH {sym:>10}: price={meta.get('regularMarketPrice')}  chgPct={meta.get('regularMarketChangePercent')}  chg={meta.get('regularMarketChange')}  prevCl={meta.get('chartPreviousClose')}  state={meta.get('marketState')}")

asyncio.run(main())
