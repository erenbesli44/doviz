"""Find embedded API endpoints in altinkaynak.com SPA."""
import asyncio
import re
import httpx

HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}


async def main() -> None:
    async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as c:
        r = await c.get("https://www.altinkaynak.com/Altin/Kur", headers=HEADERS)
        html = r.text

        # Next.js
        m = re.search(r'id="__NEXT_DATA__"[^>]*>({.*?})</script>', html, re.DOTALL)
        if m:
            print("NEXT_DATA found:", m.group(1)[:800])
        else:
            print("No __NEXT_DATA__")

        # API URLs
        apis = re.findall(r'["\']((https?://[^"\']*?)(api|gold|altin)[^"\']*?)["\']', html[:30000], re.IGNORECASE)
        if apis:
            print("\nAPI-like URLs:")
            for a in apis[:20]:
                print(" ", a[0])

        # Numbers matching gram gold range 6500-6800
        prices = re.findall(r'6[5-8]\d\d[.,]\d{2}', html)
        print("\nGold-range prices found:", prices[:10])

        # Script src
        scripts = re.findall(r'<script[^>]+src="([^"]+)"', html)
        print("\nScript sources:", scripts[:10])

        # Try the most likely XHR endpoint
        print("\n--- Probing likely XHR paths ---")
        for path in ["/api/gold", "/api/currency", "/api/gold/list", "/Altin/Kur/List", "/api/v1/gold"]:
            try:
                rr = await c.get(f"https://www.altinkaynak.com{path}", headers=HEADERS)
                ct = rr.headers.get("content-type", "?")[:60]
                print(f"  {path}: {rr.status_code} {ct} | {rr.text[:100]}")
            except Exception as ex:
                print(f"  {path}: ERROR {ex}")


asyncio.run(main())
