"""Broker model-portfolio proxy (OI-027 step 4).

Subclasses TrackerService to reuse its upstream base URL, X-API-Key header,
timeout and 404 → TrackerNotFoundError mapping without touching that class.

The cache stays bounded: the tracker is always called with one fixed query per
scope (all brokers, or one broker) and `days`/`limit` are applied locally, so
visitor-supplied parameters never create cache keys. Slugs are checked against
the cached broker list before any per-slug cache entry, lock or upstream call.
Keys: `/brokers/`, the all-brokers events query, and per known broker its
events query and `/brokers/{slug}/model-portfolio` — 2 + 2 × brokers at most.
Validated responses are cached for 5 minutes; errors are never cached.
"""
from datetime import UTC, date, datetime, timedelta
from typing import TypeVar
from urllib.parse import urlencode

import httpx
from pydantic import BaseModel

from ..cache.memory import MemoryCache
from ..config import Settings
from ..schemas.brokers import BrokerEventsResponse, BrokerListResponse, BrokerPortfolioResponse
from .tracker_service import TrackerNotFoundError, TrackerService

BROKER_CACHE_TTL_SECONDS = 300
# Widest window the public API accepts; narrower requests are filtered locally.
UPSTREAM_DAYS = 3650
UPSTREAM_LIMIT = 500

M = TypeVar("M", bound=BaseModel)


def _today() -> date:
    return datetime.now(UTC).date()


class BrokerService(TrackerService):
    def __init__(
        self, client: httpx.AsyncClient, settings: Settings, cache: MemoryCache
    ) -> None:
        super().__init__(client, settings)
        self._cache = cache

    async def _cached(self, path: str, model: type[M]) -> M:
        key = f"tracker:{path}"
        cached = await self._cache.get(key)
        if cached is not None:
            return cached
        async with self._cache.lock(key):
            cached = await self._cache.get(key)
            if cached is not None:
                return cached
            value = model.model_validate(await self._get(path))
            await self._cache.set(key, value, BROKER_CACHE_TTL_SECONDS)
            return value

    async def _require_known(self, slug: str) -> None:
        brokers = await self.list_brokers()
        if all(b.slug != slug for b in brokers.brokers):
            raise TrackerNotFoundError(slug)

    async def list_brokers(self) -> BrokerListResponse:
        return await self._cached("/brokers/", BrokerListResponse)

    async def events(self, days: int, limit: int, broker: str | None) -> BrokerEventsResponse:
        params: dict[str, str | int] = {"days": UPSTREAM_DAYS, "limit": UPSTREAM_LIMIT}
        if broker:
            await self._require_known(broker)
            params["broker"] = broker
        upstream = await self._cached(
            f"/brokers/model-portfolio/events?{urlencode(params)}", BrokerEventsResponse
        )
        cutoff = _today() - timedelta(days=days)
        # Tracker order (newest first) is kept; only the window and the cap are applied.
        events = [e for e in upstream.events if e.event_date >= cutoff][:limit]
        return BrokerEventsResponse(count=len(events), events=events)

    async def portfolio(self, slug: str) -> BrokerPortfolioResponse:
        await self._require_known(slug)
        return await self._cached(f"/brokers/{slug}/model-portfolio", BrokerPortfolioResponse)
