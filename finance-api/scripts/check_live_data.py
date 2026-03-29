"""
Live data quality checker — tests every symbol against every configured provider
and reports price, freshness, and quality.

Run: cd finance-api && uv run python scripts/check_live_data.py
"""
import asyncio
import json
import sys
from datetime import UTC, datetime
from pathlib import Path

# Add parent to path so we can import app modules
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import httpx

from app.config import Settings
from app.providers.coingecko import CoinGeckoProvider
from app.providers.fmp import FMPProvider
from app.providers.yahoo_finance import YahooFinanceProvider
from app.symbols.registry import SYMBOL_REGISTRY


async def main():
    settings = Settings()
    timeout = httpx.Timeout(10.0)
    
    async with httpx.AsyncClient(timeout=timeout) as client:
        yahoo = YahooFinanceProvider(client)
        fmp = FMPProvider(client, settings.fmp_api_key)
        coingecko = CoinGeckoProvider(client, settings.coingecko_api_key)

        providers = {
            "yahoo": yahoo,
            "fmp": fmp,
            "coingecko": coingecko,
        }

        now = datetime.now(UTC)
        print(f"\n{'='*90}")
        print(f"  LIVE DATA QUALITY CHECK — {now.strftime('%Y-%m-%d %H:%M:%S UTC')}")
        print(f"{'='*90}\n")

        results = []

        for symbol, config in SYMBOL_REGISTRY.items():
            if config.primary_provider == "derived":
                continue

            row = {
                "symbol": symbol,
                "category": config.category,
                "primary": config.primary_provider,
                "fallback": config.fallback_provider,
                "ttl": config.ttl_seconds,
            }

            # Test primary provider
            provider = providers.get(config.primary_provider)
            if provider:
                try:
                    raw = await provider.fetch_quote(config.external_primary)
                    row["primary_price"] = raw.price
                    row["primary_change"] = raw.change_pct
                    row["primary_prev_close"] = raw.previous_close
                    row["primary_open"] = raw.open
                    row["primary_high"] = raw.high
                    row["primary_low"] = raw.low
                    row["primary_status"] = "✓"
                    age = (datetime.now(UTC) - raw.fetched_at).total_seconds()
                    row["primary_age_s"] = round(age, 1)
                except Exception as e:
                    row["primary_status"] = f"✗ {e}"
                    row["primary_price"] = None

            # Test fallback provider
            if config.fallback_provider and config.fallback_provider in providers:
                fb_provider = providers[config.fallback_provider]
                ext_fb = config.external_fallback or config.external_primary
                try:
                    raw_fb = await fb_provider.fetch_quote(ext_fb)
                    row["fallback_price"] = raw_fb.price
                    row["fallback_change"] = raw_fb.change_pct
                    row["fallback_status"] = "✓"
                except Exception as e:
                    row["fallback_status"] = f"✗ {e}"
                    row["fallback_price"] = None

            # Price drift between primary and fallback
            if row.get("primary_price") and row.get("fallback_price"):
                drift = abs(row["primary_price"] - row["fallback_price"]) / row["primary_price"] * 100
                row["drift_pct"] = round(drift, 3)

            results.append(row)

        # Print results by category
        categories = ["fx", "crypto", "gold", "index", "commodity"]
        for cat in categories:
            cat_results = [r for r in results if r["category"] == cat]
            if not cat_results:
                continue

            print(f"  ── {cat.upper()} {'─'*75}")
            print(f"  {'Symbol':<12} {'Provider':<10} {'Price':>12} {'Chg%':>8} {'Open':>12} {'High':>12} {'Low':>12} {'PrevCl':>12} {'Status':<8} {'Drift%':>7}")
            print(f"  {'─'*12} {'─'*10} {'─'*12} {'─'*8} {'─'*12} {'─'*12} {'─'*12} {'─'*12} {'─'*8} {'─'*7}")

            for r in cat_results:
                p_price = f"{r.get('primary_price', 'N/A'):>12.4f}" if r.get('primary_price') else f"{'N/A':>12}"
                p_chg = f"{r.get('primary_change', 0):>8.2f}" if r.get('primary_change') is not None else f"{'N/A':>8}"
                p_open = f"{r.get('primary_open', 'N/A'):>12.4f}" if r.get('primary_open') else f"{'—':>12}"
                p_high = f"{r.get('primary_high', 'N/A'):>12.4f}" if r.get('primary_high') else f"{'—':>12}"
                p_low = f"{r.get('primary_low', 'N/A'):>12.4f}" if r.get('primary_low') else f"{'—':>12}"
                p_prev = f"{r.get('primary_prev_close', 'N/A'):>12.4f}" if r.get('primary_prev_close') else f"{'—':>12}"
                status = r.get("primary_status", "?")[:8]
                drift = f"{r.get('drift_pct', ''):>7.3f}" if r.get('drift_pct') is not None else f"{'':>7}"

                print(f"  {r['symbol']:<12} {r['primary']:<10} {p_price} {p_chg} {p_open} {p_high} {p_low} {p_prev} {status:<8} {drift}")

                # Show fallback line if available
                if r.get("fallback_price"):
                    fb_price = f"{r['fallback_price']:>12.4f}"
                    fb_chg = f"{r.get('fallback_change', 0):>8.2f}" if r.get('fallback_change') is not None else f"{'N/A':>8}"
                    fb_status = r.get("fallback_status", "?")[:8]
                    print(f"  {'':12} {r.get('fallback', ''):10} {fb_price} {fb_chg} {'':>12} {'':>12} {'':>12} {'':>12} {fb_status}")
                elif r.get("fallback_status", "").startswith("✗"):
                    print(f"  {'':12} {r.get('fallback', '?'):10} {'FAILED':>12} {'':>8} {'':>12} {'':>12} {'':>12} {'':>12} {'✗':8}")

            print()

        # Summary
        print(f"\n{'='*90}")
        print("  SUMMARY")
        print(f"{'='*90}")
        ok_count = sum(1 for r in results if r.get("primary_status") == "✓")
        fail_count = len(results) - ok_count
        print(f"  Total symbols tested: {len(results)}")
        print(f"  Primary OK: {ok_count}   Primary FAILED: {fail_count}")

        missing_data = []
        for r in results:
            issues = []
            if r.get("primary_price") is None:
                issues.append("no price")
            elif r.get("primary_open") is None:
                issues.append("no open")
            if r.get("primary_high") is None:
                issues.append("no high")
            if r.get("primary_low") is None:
                issues.append("no low")
            if r.get("primary_prev_close") is None:
                issues.append("no prev_close")
            if r.get("primary_change") is None or r.get("primary_change") == 0.0:
                issues.append("change=0")
            if issues:
                missing_data.append((r["symbol"], r["primary"], issues))

        if missing_data:
            print(f"\n  ⚠ Symbols with incomplete data:")
            for sym, prov, issues in missing_data:
                print(f"    {sym:<12} ({prov}): {', '.join(issues)}")

        # High drift warnings
        high_drift = [(r["symbol"], r["drift_pct"]) for r in results if r.get("drift_pct", 0) > 0.5]
        if high_drift:
            print(f"\n  ⚠ High price drift (>0.5%) between primary/fallback:")
            for sym, d in high_drift:
                print(f"    {sym}: {d:.3f}%")

        # FMP call count
        print(f"\n  FMP calls used: {fmp.calls_last_minute}")
        print(f"  FMP rate limit: 300/min")
        print()


if __name__ == "__main__":
    asyncio.run(main())
