"""Compare FMP vs Yahoo for index symbols — which gives more complete data?"""
import asyncio, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import httpx
from app.config import Settings
from app.providers.fmp import FMPProvider
from app.providers.yahoo_finance import YahooFinanceProvider

settings = Settings()

INDEXES = [
    ("SPX", "^GSPC", "^GSPC"),
    ("DJI", "^DJI", "^DJI"),
    ("UKX", "^FTSE", "^FTSE"),
    ("N225", "^N225", "^N225"),
]

async def main():
    async with httpx.AsyncClient(timeout=10.0) as c:
        fmp = FMPProvider(c, settings.fmp_api_key)
        yahoo = YahooFinanceProvider(c)

        print(f"{'Symbol':<8} {'Source':<8} {'Price':>12} {'Chg%':>8} {'Open':>12} {'High':>12} {'Low':>12} {'PrevCl':>12}")
        print("-" * 90)

        for name, fmp_sym, yahoo_sym in INDEXES:
            try:
                f = await fmp.fetch_quote(fmp_sym)
                print(f"{name:<8} {'FMP':<8} {f.price:>12.2f} {f.change_pct:>8.2f} {f.open or 0:>12.2f} {f.high or 0:>12.2f} {f.low or 0:>12.2f} {f.previous_close or 0:>12.2f}")
            except Exception as e:
                print(f"{name:<8} {'FMP':<8} FAILED: {e}")

            try:
                y = await yahoo.fetch_quote(yahoo_sym)
                print(f"{'':8} {'Yahoo':<8} {y.price:>12.2f} {y.change_pct:>8.2f} {y.open or 0:>12.2f} {y.high or 0:>12.2f} {y.low or 0:>12.2f} {y.previous_close or 0:>12.2f}")
            except Exception as e:
                print(f"{'':8} {'Yahoo':<8} FAILED: {e}")
            print()

asyncio.run(main())
