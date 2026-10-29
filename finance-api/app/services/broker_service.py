"""Broker model-portfolio proxy (OI-027 step 4).

Subclasses TrackerService to reuse its upstream base URL, X-API-Key header,
timeout and 404 → TrackerNotFoundError mapping without touching that class.
Validated responses are cached for 5 minutes, keyed by upstream path + query;
errors are never cached.
"""
from typing import TypeVar
from urllib.parse import urlencode

import httpx
from pydantic import BaseModel

from ..cache.memory import MemoryCache
from ..config import Settings
from ..schemas.brokers import BrokerEventsResponse, BrokerListResponse, BrokerPortfolioResponse
from .tracker_service import TrackerService

BROKER_CACHE_TTL_SECONDS = 300

M = TypeVar("M", bound=BaseModel)


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

    async def list_brokers(self) -> BrokerListResponse:
        return await self._cached("/brokers/", BrokerListResponse)

    async def events(self, days: int, limit: int, broker: str | None) -> BrokerEventsResponse:
        params: dict[str, str | int] = {"days": days}
        if broker:
            params["broker"] = broker
        params["limit"] = limit
        return await self._cached(
            f"/brokers/model-portfolio/events?{urlencode(params)}", BrokerEventsResponse
        )

    async def portfolio(self, slug: str) -> BrokerPortfolioResponse:
        return await self._cached(f"/brokers/{slug}/model-portfolio", BrokerPortfolioResponse)
