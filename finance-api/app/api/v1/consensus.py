from fastapi import APIRouter, HTTPException, Request

from ...dependencies import HttpClientDep, SettingsDep
from ...schemas.consensus import AssetConsensusResponse, AssetConsensusSummary
from ...services.consensus_service import (
    AssetNotFoundError,
    ConsensusService,
)

router = APIRouter(prefix="/consensus", tags=["consensus"])

_CONSENSUS_CACHE_TTL_SECONDS = 300  # 5 minutes


def _service(client: HttpClientDep, settings: SettingsDep) -> ConsensusService:
    return ConsensusService(client, settings)


@router.get("/", response_model=list[AssetConsensusSummary])
async def list_consensus(
    request: Request,
    client: HttpClientDep,
    settings: SettingsDep,
) -> list[AssetConsensusSummary]:
    """Compact per-asset consensus row for every tracked asset (home page cards)."""
    cache = getattr(request.app.state, "consensus_cache", None)
    cache_key = "consensus:list"
    if cache is not None:
        cached = await cache.get(cache_key)
        if cached is not None:
            return cached
    try:
        rows = await _service(client, settings).consensus_summary_list()
    except Exception as exc:
        raise HTTPException(status_code=502, detail="consensus_upstream_error") from exc
    if cache is not None:
        await cache.set(cache_key, rows, _CONSENSUS_CACHE_TTL_SECONDS)
    return rows


@router.get("/{asset_key}", response_model=AssetConsensusResponse)
async def asset_consensus(
    asset_key: str,
    request: Request,
    client: HttpClientDep,
    settings: SettingsDep,
) -> AssetConsensusResponse:
    """Full consensus block for one asset — used by the asset detail page."""
    cache = getattr(request.app.state, "consensus_cache", None)
    cache_key = f"consensus:asset:{asset_key.lower()}"
    if cache is not None:
        cached = await cache.get(cache_key)
        if cached is not None:
            return cached
    try:
        block = await _service(client, settings).asset_consensus(asset_key)
    except AssetNotFoundError as exc:
        raise HTTPException(status_code=404, detail="asset_not_found") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="consensus_upstream_error") from exc
    if cache is not None:
        await cache.set(cache_key, block, _CONSENSUS_CACHE_TTL_SECONDS)
    return block
