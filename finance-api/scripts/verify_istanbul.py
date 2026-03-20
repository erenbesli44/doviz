"""Diagnostic: verify Istanbul midnight anchor is active for USD/TRY change%."""
import asyncio
import httpx
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.providers.yahoo_finance import (
    YahooFinanceProvider,
    _istanbul_midnight_utc,
    _prev_close_at_istanbul_midnight,
)


async def main() -> None:
    async with httpx.AsyncClient(timeout=10.0) as client:
        provider = YahooFinanceProvider(client)
        data = await provider._get("USDTRY=X", {"interval": "1h", "range": "2d"})
        result = data["chart"]["result"][0]
        meta = result["meta"]
        timestamps = result.get("timestamp") or []
        closes = (result.get("indicators", {}).get("quote") or [{}])[0].get("close") or []

        midnight_utc = _istanbul_midnight_utc()
        prev = _prev_close_at_istanbul_midnight(timestamps, closes)
        price = float(meta["regularMarketPrice"])
        yahoo_prev = meta.get("chartPreviousClose") or meta.get("previousClose")
        yahoo_change = (price - float(yahoo_prev)) / float(yahoo_prev) * 100 if yahoo_prev else None
        istanbul_change = (price - prev) / prev * 100 if prev else None

        print(f"Istanbul midnight (UTC): {midnight_utc}")
        print(f"Hourly bars fetched:    {len(timestamps)}")
        print()
        print(f"Current price (USD/TRY): {price:.4f}")

        if prev:
            print(f"Midnight bar close:     {prev:.4f}  ← Istanbul anchor")
        else:
            print("Midnight bar close:     NOT FOUND — using Yahoo chartPreviousClose")

        if yahoo_prev:
            print(f"Yahoo chartPrevClose:   {float(yahoo_prev):.4f}  ← NY session close")

        print()
        if istanbul_change is not None:
            print(f"Istanbul-day change%:   {istanbul_change:+.4f}%  ← what BloombergHT shows")
        if yahoo_change is not None:
            print(f"Yahoo session change%:  {yahoo_change:+.4f}%  ← old baseline")

        if prev and yahoo_prev:
            diff = abs(istanbul_change - yahoo_change) if istanbul_change and yahoo_change else None
            if diff is not None:
                print(f"Difference:            {diff:.4f}pp")


asyncio.run(main())
