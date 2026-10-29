import logging

from fastapi import APIRouter, HTTPException, Path, Query

from ...dependencies import CacheDep, HttpClientDep, SettingsDep
from ...schemas.brokers import (
    SLUG_PATTERN,
    BrokerEventsResponse,
    BrokerListResponse,
    BrokerPortfolioResponse,
)
from ...services.broker_service import BrokerService
from ...services.tracker_service import TrackerNotFoundError

# Failures are logged by exception type only: never headers or upstream bodies.
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/brokers", tags=["brokers"])


def _service(client: HttpClientDep, settings: SettingsDep, cache: CacheDep) -> BrokerService:
    return BrokerService(client, settings, cache)


@router.get("", response_model=BrokerListResponse)
async def list_brokers(
    client: HttpClientDep,
    settings: SettingsDep,
    cache: CacheDep,
) -> BrokerListResponse:
    """Brokers whose model portfolios are tracked."""
    try:
        return await _service(client, settings, cache).list_brokers()
    except Exception as exc:
        logger.warning("broker proxy %s failed: %s", "list", type(exc).__name__)
        # An upstream 404 here means the route is missing, not an unknown broker.
        raise HTTPException(status_code=502, detail="tracker_upstream_error") from exc


# Declared before /{slug} so "model-portfolio" is never captured as a slug.
@router.get("/model-portfolio/events", response_model=BrokerEventsResponse)
async def model_portfolio_events(
    client: HttpClientDep,
    settings: SettingsDep,
    cache: CacheDep,
    days: int = Query(90, ge=1, le=3650),
    limit: int = Query(100, ge=1, le=500),
    broker: str | None = Query(None, pattern=SLUG_PATTERN),
) -> BrokerEventsResponse:
    """Model-portfolio changes across brokers, newest first."""
    try:
        return await _service(client, settings, cache).events(days, limit, broker)
    except TrackerNotFoundError as exc:
        raise HTTPException(status_code=404, detail="broker_not_found") from exc
    except Exception as exc:
        logger.warning("broker proxy %s failed: %s", "events", type(exc).__name__)
        raise HTTPException(status_code=502, detail="tracker_upstream_error") from exc


@router.get("/{slug}", response_model=BrokerPortfolioResponse)
async def broker_portfolio(
    client: HttpClientDep,
    settings: SettingsDep,
    cache: CacheDep,
    slug: str = Path(pattern=SLUG_PATTERN),
) -> BrokerPortfolioResponse:
    """One broker: current composition and recent events."""
    try:
        return await _service(client, settings, cache).portfolio(slug)
    except TrackerNotFoundError as exc:
        raise HTTPException(status_code=404, detail="broker_not_found") from exc
    except Exception as exc:
        logger.warning("broker proxy %s failed: %s", "portfolio", type(exc).__name__)
        raise HTTPException(status_code=502, detail="tracker_upstream_error") from exc
