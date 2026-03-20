"""Probe deeper — SPA backend APIs and known Turkish gold endpoint patterns."""
import asyncio
import httpx

CANDIDATES = [
    # AltinKaynak SPA API (React app — inspect network calls)
    ("altinkaynak api3", "https://www.altinkaynak.com/api/v2/altin"),
    ("altinkaynak api4", "https://api.altinkaynak.com/v1/gold"),
    # Harem Altin - punycode domain (dotless i = xn--haremalt-q2a)
    ("haremaltın punycode", "https://www.xn--haremalt-q2a.com.tr/altin-fiyatlari"),
    ("haremaltin ascii", "https://www.haremaltin.com/altin-fiyatlari"),
    # Doviz.com alternate paths
    ("doviz v2 golds", "https://www.doviz.com/api/v2/golds/all/records/last"),
    ("doviz v8", "https://www.doviz.com/api/v8/golds/all/records/last"),
    # collectapi.com (free Turkish data)
    ("collectapi gold free", "https://api.collectapi.com/economy/goldPrice"),
    # Goldprice
    ("goldprice.org", "https://data-asg.goldprice.org/GetData/XAU-TRY/1"),
    # Borsa İstanbul IAB (precious metals)
    ("BIST IAB", "https://www.borsaistanbul.com/tr/veri/veriler/kiymetli-madenler-verileri"),
    # matriks / isyatirim style
    ("isyatirim altin", "https://www.isyatirim.com.tr/analiz-ve-raporlar/altin"),
    # turkgold - not sure if real
    ("turkgold", "https://www.turkgold.com.tr/altin-fiyatlari"),
    # altın.com.tr alternate
    ("altin.com.tr", "https://altin.com.tr/altın-fiyatları"),
    ("altin.com.tr2", "https://altin.com.tr/"),
    # IAB XML feed style
    ("kdm.gov.tr", "https://www.kdm.gov.tr/altin"),
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/html",
}


async def main() -> None:
    async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
        for name, url in CANDIDATES:
            try:
                r = await client.get(url, headers=HEADERS)
                ct = r.headers.get("content-type", "?")[:60]
                print(f"[{r.status_code}] {name}")
                if r.status_code == 200 and "json" in ct:
                    print(f"  *** JSON FOUND: {r.text[:400]}")
                elif r.status_code == 200:
                    # Look for gold-related numbers in HTML
                    import re
                    # Look for patterns like 6.664 or 6664 (gram gold ~6600-6700 TRY)
                    prices = re.findall(r'6[.,]?[56789]\d\d', r.text[:5000])
                    print(f"  CT: {ct} | matching prices: {prices[:5]}")
                print()
            except Exception as e:
                print(f"[ERR] {name}: {e}\n")


asyncio.run(main())
