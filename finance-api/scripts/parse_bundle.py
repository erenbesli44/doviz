"""Parse altinkaynak.com JS bundle for API endpoint patterns."""
import asyncio
import re
import httpx

HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
BASE = "https://www.altinkaynak.com"
SCRIPT = "/assets/index-iqo7Q2Ju.js"


async def main() -> None:
    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as c:
        print(f"Fetching JS bundle: {BASE}{SCRIPT}")
        r = await c.get(f"{BASE}{SCRIPT}", headers=HEADERS)
        print(f"Status: {r.status_code}, size: {len(r.text)} chars")
        js = r.text

        # Find URL patterns in bundle
        urls = re.findall(r'["\`](https?://[^"` ]{10,120})["\`]', js)
        print("\nExternal URLs in bundle:")
        for u in sorted(set(urls)):
            print(" ", u)

        # Find relative API paths
        api_paths = re.findall(r'["\`](/(?:api|v\d|gold|altin)[^"` ]{2,80})["\`]', js, re.IGNORECASE)
        print("\nRelative API paths in bundle:")
        for p in sorted(set(api_paths))[:30]:
            print(" ", p)

        # Find fetch/axios calls
        fetches = re.findall(r'(?:fetch|axios\.get|\.get)\(["\`]([^"` ]{5,120})["\`]', js)
        print("\nFetch/axios calls:")
        for f in fetches[:20]:
            print(" ", f)


asyncio.run(main())
