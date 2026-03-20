"""Probe candidate Kapalıçarşı / physical gold price endpoints."""
import asyncio
import httpx


CANDIDATES = [
    # doviz.com public API variants
    ("doviz.com gram-altin", "https://www.doviz.com/api/v1/golds/gram-altin/records/last"),
    ("doviz.com all golds", "https://www.doviz.com/api/v1/golds/all/records/last"),
    ("doviz.com altin list", "https://www.doviz.com/altin"),
    # Bigpara (Hurriyet)
    ("bigpara altin", "https://bigpara.hurriyet.com.tr/api/1/altin/listesi"),
    # Collecting / altin.com alternatives
    ("collecting", "https://collecting.com.tr/api/gold"),
    # Altinkaynak API probe
    ("altinkaynak api", "https://www.altinkaynak.com/Altin/Kur/Json"),
    ("altinkaynak api2", "https://www.altinkaynak.com/api/gold"),
    # Finans.mynet.com
    ("mynet altin", "https://finans.mynet.com/altin/"),
    # Borsaistanbul
    ("borsa istanbul", "https://www.borsaistanbul.com/api/v1/gold/price"),
    # kapalicarsi.com.tr
    ("kapalicarsi", "https://www.kapalicarsi.com.tr/altin-fiyatlari"),
    # goldapi.io free tier
    ("goldapi.io", "https://www.goldapi.io/api/XAU/TRY"),
    # haremaltın with correct domain
    ("haremaltın", "https://www.haremaltın.com.tr/altin-fiyatlari"),
]

HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}


async def main() -> None:
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        for name, url in CANDIDATES:
            try:
                r = await client.get(url, headers=HEADERS)
                ct = r.headers.get("content-type", "?")[:50]
                body = r.text[:300]
                print(f"[{r.status_code}] {name}")
                print(f"  URL: {url}")
                print(f"  CT:  {ct}")
                if r.status_code == 200:
                    print(f"  BODY: {body[:200]}")
                print()
            except Exception as e:
                print(f"[ERR] {name}: {e}\n")


asyncio.run(main())
