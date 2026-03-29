"""Quick API endpoint check — calls localhost:8000 for key symbols."""
import asyncio
import httpx

SYMBOLS = [
    "USD-TRY", "EUR-TRY", "GBP-TRY", "EUR-USD", "GBP-USD",
    "CHF-TRY", "JPY-TRY",
    "BTC-USD",
    "XAU-USD", "XAG-USD", "GAUTRY", "GAGTRY",
    "SPX", "DJI", "NDX", "XU100", "DAX", "UKX", "N225",
    "BRENT", "WTI", "NATGAS", "HG", "ZW",
]


async def main():
    async with httpx.AsyncClient(timeout=10) as c:
        header = f"{'Symbol':<12} {'Price':>12} {'Chg%':>8} {'ChgVal':>10} {'Provider':<14} {'Live':>5} {'Mode':<8} {'HTTP':>4}"
        print(header)
        print("-" * len(header))

        for sym in SYMBOLS:
            try:
                r = await c.get(f"http://localhost:8000/v1/quotes/{sym}")
                if r.status_code == 200:
                    d = r.json()
                    data = d.get("data", {})
                    meta = d.get("meta", {})
                    price = data.get("price", 0)
                    chg = data.get("change_pct", 0)
                    chg_val = data.get("change_value")
                    chg_str = f"{chg_val:>10.4f}" if chg_val is not None else f"{'—':>10}"
                    prov = meta.get("provider", "?")
                    live = meta.get("is_live", False)
                    mode = meta.get("display_mode", "?")
                    print(f"{sym:<12} {price:>12.4f} {chg:>8.2f} {chg_str} {prov:<14} {str(live):>5} {mode:<8} {r.status_code:>4}")
                else:
                    print(f"{sym:<12} {'':>12} {'':>8} {'':>10} {'':14} {'':>5} {'':8} {r.status_code:>4}")
            except Exception as e:
                print(f"{sym:<12} ERROR: {e}")


if __name__ == "__main__":
    asyncio.run(main())
