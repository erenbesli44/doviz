"""Test nitter.net and alternative Twitter RSS approaches"""
import httpx
import asyncio

ACCOUNT = "BloombergHT"


async def main():
    async with httpx.AsyncClient(follow_redirects=True, timeout=10) as c:
        # Check nitter.net in detail
        print("=== nitter.net detailed check ===")
        for path in [f"/{ACCOUNT}/rss", f"/{ACCOUNT}", "/"]:
            r = await c.get(f"https://nitter.net{path}")
            ct = r.headers.get("content-type", "?")[:50]
            print(f"  {path}: HTTP {r.status_code}  ct={ct}  body_len={len(r.text)}  snippet={r.text[:120]!r}")

        # Try with a browser-like User-Agent (some instances block default)
        print("\n=== nitter instances with User-Agent ===")
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/rss+xml,application/xml;q=0.9,*/*;q=0.8",
        }
        for host in ["nitter.poast.org", "nitter.tiekoetter.com", "nitter.net"]:
            url = f"https://{host}/{ACCOUNT}/rss"
            try:
                r = await c.get(url, headers=headers)
                snippet = r.text[:100].replace("\n", " ")
                print(f"  {host}: HTTP {r.status_code}  body={snippet!r}")
            except Exception as e:
                print(f"  {host}: {type(e).__name__}: {str(e)[:60]}")

        # RSS Bridge public instances
        print("\n=== RSS-Bridge public instances ===")
        # RSS Bridge can bridge Twitter to RSS
        rssbridge_instances = [
            "https://rssbridge.fr/",
            "https://rss-bridge.org/bridge01/",
        ]
        for base in rssbridge_instances:
            try:
                r = await c.get(base, timeout=5)
                print(f"  {base}: HTTP {r.status_code}  available={r.status_code < 400}")
            except Exception as e:
                print(f"  {base}: {type(e).__name__}: {str(e)[:60]}")


if __name__ == "__main__":
    asyncio.run(main())
