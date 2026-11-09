"""Research digest proxy (OI-041), same pattern as BrokerService.

The tracker is always called with one fixed query, cached for an hour (posts arrive a few
times a month); `days`, `topic`, `limit` and the single-item lookup are applied locally,
so visitor parameters never create cache keys or upstream calls. Errors are not cached;
invalid items are dropped one by one (logged) instead of failing the list. A missing
upstream route is an upstream error (502), never a 404 for one digest.
Topics are served as public asset keys (topic_mapping); unknown tracker slugs are dropped.
"""
import logging
from datetime import UTC, date, datetime, timedelta

import httpx
from pydantic import ValidationError

from ..cache.memory import MemoryCache
from ..config import Settings
from ..schemas.research import ResearchDigestsResponse, ResearchItem
from .topic_mapping import ASSET_BY_PUBLIC_KEY, all_assets
from .tracker_service import TrackerNotFoundError, TrackerService

RESEARCH_CACHE_TTL_SECONDS = 3600
UPSTREAM_PATH = "/research/digests?days=3650&limit=100"

_PUBLIC_KEY_BY_SLUG = {a.tracker_slug: a.public_key for a in all_assets()}


logger = logging.getLogger(__name__)


class UpstreamError(Exception):
    """The tracker answered, but not with a usable research payload."""


class UnknownTopicError(Exception):
    """`topic` is not a public asset key."""


def _today() -> date:
    return datetime.now(UTC).date()


def _public_topics(item: ResearchItem) -> ResearchItem:
    topics = [_PUBLIC_KEY_BY_SLUG[t] for t in item.digest.topics if t in _PUBLIC_KEY_BY_SLUG]
    return item.model_copy(update={"digest": item.digest.model_copy(update={"topics": topics})})


class ResearchService(TrackerService):
    def __init__(
        self, client: httpx.AsyncClient, settings: Settings, cache: MemoryCache
    ) -> None:
        super().__init__(client, settings)
        self._cache = cache

    async def _all(self) -> list[ResearchItem]:
        key = f"tracker:{UPSTREAM_PATH}"
        cached = await self._cache.get(key)
        if cached is not None:
            return cached
        async with self._cache.lock(key):
            cached = await self._cache.get(key)
            if cached is not None:
                return cached
            try:
                payload = await self._get(UPSTREAM_PATH)
            except TrackerNotFoundError as exc:  # the route itself is missing upstream
                raise UpstreamError("research route missing on the tracker") from exc
            raw_items = payload.get("items") if isinstance(payload, dict) else None
            if not isinstance(raw_items, list):
                raise UpstreamError("research payload without items list")
            items = []
            for raw in raw_items:  # one malformed item must not hide the others
                try:
                    items.append(_public_topics(ResearchItem.model_validate(raw)))
                except ValidationError:
                    logger.warning("research proxy dropped an invalid upstream item")
            await self._cache.set(key, items, RESEARCH_CACHE_TTL_SECONDS)
            return items

    async def digests(self, days: int, limit: int, topic: str | None) -> ResearchDigestsResponse:
        cutoff = _today() - timedelta(days=days)
        items = [i for i in await self._all() if i.published_at and i.published_at >= cutoff]
        if topic:
            if topic not in ASSET_BY_PUBLIC_KEY:
                raise UnknownTopicError(topic)
            items = [i for i in items if topic in i.digest.topics]
        items = items[:limit]
        return ResearchDigestsResponse(count=len(items), items=items)

    async def digest(self, item_id: int) -> ResearchItem:
        for item in await self._all():
            if item.id == item_id:
                return item
        raise TrackerNotFoundError(str(item_id))
