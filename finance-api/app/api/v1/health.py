import asyncio
from datetime import UTC, datetime

from fastapi import APIRouter, Request

from ...dependencies import HttpClientDep, SettingsDep
from ...providers.registry import ProviderRegistry

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health() -> dict:
    """Basic liveness check."""
    return {"status": "ok", "timestamp": datetime.now(UTC).isoformat()}


@router.get("/providers")
async def provider_health(client: HttpClientDep, settings: SettingsDep) -> dict:
    """
    Checks each provider's health endpoint concurrently.
    Useful for monitoring and debugging data source outages.
    """
    registry = ProviderRegistry(client, settings)
    providers = registry.all()

    async def check(name: str, provider) -> tuple[str, bool]:
        try:
            ok = await asyncio.wait_for(provider.is_healthy(), timeout=5.0)
            return name, ok
        except Exception:
            return name, False

    results = await asyncio.gather(*[check(n, p) for n, p in providers.items()])
    return {
        "providers": {name: "ok" if ok else "unavailable" for name, ok in results},
        "timestamp": datetime.now(UTC).isoformat(),
    }


@router.get("/fmp")
async def fmp_status(request: Request) -> dict:
    """FMP Starter plan monitoring: call rate and blocked symbols."""
    from ...providers.fmp import FMPProvider

    fmp_blocked: set[str] = getattr(request.app.state, "fmp_blocked", set())

    # Get FMP provider from the shared registry if available
    providers = getattr(request.app.state, "quote_service", None)
    calls_last_minute = 0
    if providers is not None:
        try:
            fmp: FMPProvider = providers._providers.get("fmp")
            calls_last_minute = fmp.calls_last_minute
        except Exception:
            pass

    return {
        "fmp_calls_last_minute": calls_last_minute,
        "rate_limit": 300,
        "headroom": 300 - calls_last_minute,
        "blocked_symbols": sorted(fmp_blocked),
        "blocked_count": len(fmp_blocked),
        "timestamp": datetime.now(UTC).isoformat(),
    }
