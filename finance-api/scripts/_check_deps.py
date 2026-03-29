"""
Dependency pre-flight check for news feature:
  1. Supabase PAT + project REST connectivity
  2. Nitter RSS instances for @BloombergHT
"""
import asyncio
import xml.etree.ElementTree as ET
import httpx

SUPABASE_TOKEN = "sbp_df103b8c6111115065edea01b672d194fd9473c2"
SUPABASE_MGMT = "https://api.supabase.com/v1"

NITTER_INSTANCES = [
    "nitter.lucabased.com",
    "nitter.privacydev.net",
    "nitter.poast.org",
    "nitter.nl",
    "nitter.net",
]
ACCOUNT = "BloombergHT"


async def check_supabase(client: httpx.AsyncClient):
    print("\n=== Supabase ===")
    # 1. Management API - list projects
    r = await client.get(
        f"{SUPABASE_MGMT}/projects",
        headers={"Authorization": f"Bearer {SUPABASE_TOKEN}"},
        timeout=8,
    )
    if r.status_code != 200:
        print(f"  [FAIL] Management API: HTTP {r.status_code} — {r.text[:200]}")
        return None

    projects = r.json()
    print(f"  [OK]   Management API reachable — {len(projects)} project(s)")
    for p in projects:
        print(f"         name={p['name']}  ref={p['id']}  region={p['region']}  status={p['status']}")

    if not projects:
        print("  [WARN] No projects found under this token")
        return None

    proj = projects[0]
    ref = proj["id"]

    # 2. PostgREST REST API — check connectivity
    supabase_url = f"https://{ref}.supabase.co"
    rest_r = await client.get(
        f"{supabase_url}/rest/v1/",
        headers={"apikey": SUPABASE_TOKEN, "Authorization": f"Bearer {SUPABASE_TOKEN}"},
        timeout=8,
    )
    print(f"  [{'OK' if rest_r.status_code in (200, 404) else 'FAIL'}]   PostgREST endpoint: HTTP {rest_r.status_code}")

    return {"ref": ref, "url": supabase_url}


async def test_nitter(client: httpx.AsyncClient, host: str):
    url = f"https://{host}/{ACCOUNT}/rss"
    try:
        r = await client.get(url, timeout=7, follow_redirects=True)
        if r.status_code == 200 and "<rss" in r.text:
            root = ET.fromstring(r.text)
            channel = root.find("channel")
            items = channel.findall("item") if channel else []
            first = items[0].findtext("title", "?") if items else "no items"
            return host, "OK", len(items), first[:80]
        return host, f"HTTP {r.status_code}", 0, ""
    except Exception as e:
        return host, f"FAIL: {type(e).__name__}: {str(e)[:60]}", 0, ""


async def check_nitter(client: httpx.AsyncClient):
    print("\n=== Nitter RSS Instances ===")
    tasks = [test_nitter(client, h) for h in NITTER_INSTANCES]
    results = await asyncio.gather(*tasks)
    working = []
    for host, status, count, first in results:
        tag = "OK  " if status == "OK" else "FAIL"
        print(f"  [{tag}]  {host:35s}  items={count:>2}  first={first!r}")
        if status == "OK":
            working.append(host)
    return working


async def main():
    async with httpx.AsyncClient() as client:
        proj_info = await check_supabase(client)
        working_nitter = await check_nitter(client)

    print("\n=== Summary ===")
    if proj_info:
        print(f"  Supabase: READY  ref={proj_info['ref']}  url={proj_info['url']}")
    else:
        print("  Supabase: NOT READY")

    if working_nitter:
        print(f"  Nitter:   READY  working instances: {working_nitter}")
    else:
        print("  Nitter:   NOT READY — all instances failed")

    print()
    print("  Recommended NITTER_INSTANCES order for implementation:")
    for i, h in enumerate(working_nitter, 1):
        print(f"    {i}. {h}")


if __name__ == "__main__":
    asyncio.run(main())
