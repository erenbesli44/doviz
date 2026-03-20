"""Live verification: Kapalıçarşı gold price vs derived spot."""
import asyncio
import httpx
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.providers.altinkaynak_gold import AltinkaynakGoldProvider
from app.providers.yahoo_finance import YahooFinanceProvider


async def main() -> None:
    async with httpx.AsyncClient(timeout=12.0) as client:
        ak = AltinkaynakGoldProvider(client)
        yf = YahooFinanceProvider(client)

        # Kapalıçarşı physical prices
        print("=== Altınkaynak Kapalıçarşı Physical Gold ===")
        for kod in ("HH_T", "GAT", "CH_T"):
            try:
                q = await ak.fetch_quote(kod)
                print(f"  {kod}: {q.price:,.2f} TRY (fetched at {q.fetched_at})")
            except Exception as e:
                print(f"  {kod}: FAILED — {e}")

        # International spot
        print("\n=== International Spot (Yahoo Finance) ===")
        xau = await yf.fetch_quote("GC=F")
        usdtry = await yf.fetch_quote("USDTRY=X")
        derived = (xau.price / 31.1035) * usdtry.price
        print(f"  XAU/USD: ${xau.price:,.2f}  Δ{xau.change_pct:+.4f}%")
        print(f"  USD/TRY: {usdtry.price:.4f}  Δ{usdtry.change_pct:+.4f}%")
        print(f"  Derived GAUTRY: {derived:,.2f} TRY/gram")

        # Compare
        try:
            hh_t = await ak.fetch_quote("HH_T")
            premium = hh_t.price - derived
            premium_pct = premium / derived * 100
            print(f"\n=== Kapalıçarşı Premium over Spot ===")
            print(f"  HH_T Alış:  {hh_t.price:,.2f} TRY")
            print(f"  Derived:    {derived:,.2f} TRY")
            print(f"  Premium:    {premium:+,.2f} TRY ({premium_pct:+.2f}%)")

            combined_change = round(xau.change_pct + usdtry.change_pct, 4)
            print(f"\n=== Change% ===")
            print(f"  XAU change:      {xau.change_pct:+.4f}%")
            print(f"  USD/TRY change:  {usdtry.change_pct:+.4f}%")
            print(f"  Combined (GAUTRY change): {combined_change:+.4f}%")
        except Exception as e:
            print(f"  Comparison failed: {e}")


asyncio.run(main())
