"""Review current gold price computation and research Kapalıçarşı data sources."""
import asyncio
import httpx
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.providers.yahoo_finance import YahooFinanceProvider


async def main() -> None:
    async with httpx.AsyncClient(timeout=15.0) as client:
        yp = YahooFinanceProvider(client)

        # XAU/USD (troy oz)
        xau = await yp.fetch_quote("GC=F")
        print(f"XAU/USD (troy oz):    ${xau.price:,.2f}  Δ{xau.change_pct:+.4f}%")

        # USD/TRY
        usdtry = await yp.fetch_quote("USDTRY=X")
        print(f"USD/TRY:              {usdtry.price:.4f}  Δ{usdtry.change_pct:+.4f}%")

        # Derived gram gold (TRY)
        TROY_OZ_TO_GRAMS = 31.1035
        gautry = (xau.price / TROY_OZ_TO_GRAMS) * usdtry.price
        print(f"\nGram Altın (derived): {gautry:,.2f} TRY/gram")
        print(f"  = XAU/USD ({xau.price:.2f}) / 31.1035 × USD/TRY ({usdtry.price:.4f})")

        # Kapalıçarşı gold - try fetching directly
        print("\n--- Checking Kapalıçarşı / Turkish physical gold sources ---")

        # Try kapalicarsi.com.tr / doviz.com / altin.com.tr
        sources = [
            ("doviz.com", "https://www.doviz.com/api/v1/golds/gram-altin/records/last"),
            ("altin.com.tr JSON", "https://www.altin.com.tr/api"),
            ("altinkaynak", "https://www.altinkaynak.com/Altin/Kur"),
        ]
        for name, url in sources:
            try:
                r = await client.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=8.0)
                print(f"{name}: HTTP {r.status_code} (content-type: {r.headers.get('content-type','?')[:60]})")
                if r.status_code == 200:
                    print(f"  preview: {r.text[:200]}")
            except Exception as e:
                print(f"{name}: FAILED — {e}")


asyncio.run(main())
