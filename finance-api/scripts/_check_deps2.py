"""Detailed dependency diagnostic: Supabase anon key + Nitter failure modes"""
import httpx
import asyncio

SUPABASE_TOKEN = "sbp_df103b8c6111115065edea01b672d194fd9473c2"
REF = "gnouyebblmyubhlphgta"
NITTER_INSTANCES = [
    "nitter.lucabased.com",
    "nitter.privacydev.net",
    "nitter.poast.org",
    "nitter.nl",
    "nitter.net",
    "xcancel.com",          # another popular nitter-compatible instance
    "nitter.tiekoetter.com",
]


async def main():
    async with httpx.AsyncClient() as c:
        # --- Supabase anon key via Management API ---
        r = await c.get(
            f"https://api.supabase.com/v1/projects/{REF}/api-keys",
            headers={"Authorization": f"Bearer {SUPABASE_TOKEN}"},
            timeout=8,
        )
        print(f"Supabase API keys status: {r.status_code}")
        if r.status_code == 200:
            for k in r.json():
                name = k.get("name", "?")
                key_val = k.get("api_key", "")
                # Print full anon key (it's a public key, safe to display)
                print(f"  {name}: {key_val}")
        else:
            print(f"  Error: {r.text[:300]}")

        # --- Test PostgREST with anon key ---
        if r.status_code == 200:
            anon_key = next((k["api_key"] for k in r.json() if k.get("name") == "anon"), None)
            if anon_key:
                r2 = await c.get(
                    f"https://{REF}.supabase.co/rest/v1/",
                    headers={"apikey": anon_key, "Authorization": f"Bearer {anon_key}"},
                    timeout=8,
                )
                print(f"\nPostgREST with anon key: HTTP {r2.status_code}")
                if r2.status_code != 200:
                    print(f"  Body: {r2.text[:200]}")

        # --- Nitter detailed check ---
        print("\nNitter instance check:")
        for host in NITTER_INSTANCES:
            url = f"https://{host}/BloombergHT/rss"
            try:
                r3 = await c.get(url, timeout=7, follow_redirects=True)
                ct = r3.headers.get("content-type", "?")[:40]
                snippet = r3.text[:80].replace("\n", " ")
                print(f"  {host:35s}  HTTP {r3.status_code}  ct={ct}  body={snippet!r}")
            except Exception as e:
                print(f"  {host:35s}  {type(e).__name__}: {str(e)[:80]}")


if __name__ == "__main__":
    asyncio.run(main())
