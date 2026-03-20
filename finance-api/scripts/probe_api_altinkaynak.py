"""Probe the api.altinkaynak.com endpoints discovered from the JS bundle."""
import asyncio
import json
import httpx

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Accept": "application/json, */*",
    "Referer": "https://www.altinkaynak.com/",
    "Origin": "https://www.altinkaynak.com",
}
BASE_API = "https://api.altinkaynak.com"
BASE_STATIC = "https://static.altinkaynak.com"


async def probe(c: httpx.AsyncClient, url: str) -> None:
    try:
        r = await c.get(url, headers=HEADERS)
        ct = r.headers.get("content-type", "?")[:60]
        print(f"[{r.status_code}] {url}")
        print(f"  CT: {ct}")
        if r.status_code == 200:
            if "json" in ct:
                try:
                    data = r.json()
                    print(f"  JSON: {json.dumps(data)[:500]}")
                except Exception:
                    print(f"  TEXT: {r.text[:300]}")
            else:
                print(f"  BODY: {r.text[:200]}")
    except Exception as e:
        print(f"[ERR] {url}: {e}")
    print()


async def main() -> None:
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as c:
        candidates = [
            f"{BASE_API}/Altin/Kur",
            f"{BASE_API}/Altin/Kur/Guncel",
            f"{BASE_API}/Altin/Arsiv",
            f"{BASE_API}/gold",
            f"{BASE_API}/gold/list",
            f"{BASE_STATIC}/public/Gold",
            f"{BASE_STATIC}/public/Gold/list.json",
            f"{BASE_STATIC}/public/Gold/current.json",
            f"{BASE_STATIC}/public/Currency",
        ]
        for url in candidates:
            await probe(c, url)


asyncio.run(main())
