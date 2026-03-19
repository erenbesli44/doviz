import asyncio
from datetime import UTC, datetime

from fastapi import APIRouter

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
