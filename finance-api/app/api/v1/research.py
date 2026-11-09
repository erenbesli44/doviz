import logging

from fastapi import APIRouter, HTTPException, Path, Query

from ...dependencies import CacheDep, HttpClientDep, SettingsDep
from ...schemas.research import ResearchDigestsResponse, ResearchItem
from ...services.research_service import ResearchService, UnknownTopicError
from ...services.tracker_service import TrackerNotFoundError

# Failures are logged by exception type only: never headers or upstream bodies.
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/research", tags=["research"])


def _service(client: HttpClientDep, settings: SettingsDep, cache: CacheDep) -> ResearchService:
    return ResearchService(client, settings, cache)


@router.get("/digests", response_model=ResearchDigestsResponse)
async def list_digests(
    client: HttpClientDep,
    settings: SettingsDep,
    cache: CacheDep,
    days: int = Query(365, ge=1, le=3650),
    limit: int = Query(20, ge=1, le=100),
    topic: str | None = Query(None, pattern=r"^[a-z-]{1,40}$"),
) -> ResearchDigestsResponse:
    """Plain-language digests of research posts (TCMB blog first), newest first."""
    try:
        return await _service(client, settings, cache).digests(days, limit, topic)
    except UnknownTopicError as exc:
        raise HTTPException(status_code=422, detail="unknown_topic") from exc
    except Exception as exc:
        logger.warning("research proxy %s failed: %s", "list", type(exc).__name__)
        raise HTTPException(status_code=502, detail="tracker_upstream_error") from exc


@router.get("/digests/{item_id}", response_model=ResearchItem)
async def get_digest(
    client: HttpClientDep,
    settings: SettingsDep,
    cache: CacheDep,
    item_id: int = Path(ge=1),
) -> ResearchItem:
    try:
        return await _service(client, settings, cache).digest(item_id)
    except TrackerNotFoundError as exc:
        raise HTTPException(status_code=404, detail="digest_not_found") from exc
    except Exception as exc:
        logger.warning("research proxy %s failed: %s", "item", type(exc).__name__)
        raise HTTPException(status_code=502, detail="tracker_upstream_error") from exc
