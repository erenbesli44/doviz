import asyncio
import logging
from typing import Any

import httpx

from ..config import Settings
from ..schemas.channels import ChannelOverview, PersonTimelinePoint, PersonTopicStance
from ..schemas.news import (
    LatestNewsResponse,
    NewsChannel,
    NewsStory,
    NewsSummary,
    NewsVideo,
)
from .topic_mapping import to_public_topic_key, to_tracker_topic_slug

logger = logging.getLogger(__name__)

# Over-fetch candidates so we can skip any whose summary isn't generated yet
# (tracker returns 404 for those).
CANDIDATE_POOL = 30
VALID_SENTIMENTS = {"bullish", "bearish", "neutral"}


class TrackerNotFoundError(Exception):
    """Raised when a story (summary or video) doesn't exist upstream."""


class TrackerService:
    """
    Proxy + aggregator for the YouTube summary tracker. Wraps the upstream
    X-API-Key so it never leaves the server.
    """

    def __init__(self, client: httpx.AsyncClient, settings: Settings) -> None:
        self._client = client
        self._base = settings.tracker_api_url.rstrip("/")
        self._headers = (
            {"X-API-Key": settings.tracker_api_key} if settings.tracker_api_key else {}
        )
        self._timeout = settings.tracker_timeout_seconds

    async def _get(self, path: str) -> Any:
        url = f"{self._base}{path}"
        resp = await self._client.get(
            url,
            headers=self._headers,
            timeout=self._timeout,
            follow_redirects=True,
        )
        if resp.status_code == 404:
            raise TrackerNotFoundError(path)
        resp.raise_for_status()
        return resp.json()

    async def _list_channels(self) -> list[NewsChannel]:
        data = await self._get("/channels/")
        return [NewsChannel.model_validate(c) for c in data]

    async def _list_videos(self, channel_id: int) -> list[NewsVideo]:
        try:
            data = await self._get(f"/videos/?channel_id={channel_id}")
        except Exception as exc:
            logger.warning("tracker list_videos failed for channel %s: %s", channel_id, exc)
            return []
        items = data["items"] if isinstance(data, dict) else data
        return [NewsVideo.model_validate(v) for v in items]

    async def _get_summary(self, video_id: int) -> NewsSummary | None:
        try:
            data = await self._get(f"/videos/{video_id}/summary")
            return NewsSummary.model_validate(data)
        except TrackerNotFoundError:
            return None
        except Exception as exc:
            logger.warning("tracker summary validation failed for video %s: %s", video_id, exc)
            return None

    async def _channel_by_slug(self, slug: str) -> NewsChannel | None:
        channels = await self._list_channels()
        for channel in channels:
            if channel.slug == slug:
                return channel
        return None

    async def _get_channel_topics_overview(self, channel_id: int) -> dict[str, Any]:
        return await self._get(f"/channels/{channel_id}/topics/overview")

    async def _get_topic_by_key(self, topic_key: str) -> dict[str, Any]:
        tracker_topic = to_tracker_topic_slug(topic_key)
        data = await self._get(f"/topics/{tracker_topic}/opinions?limit=1&days=365")
        return data["topic"]

    async def _get_channel_topic_timeline(
        self,
        channel_id: int,
        topic_id: int,
        limit: int = 100,
    ) -> dict[str, Any]:
        return await self._get(
            f"/channels/{channel_id}/topics/{topic_id}/timeline?limit={limit}"
        )

    async def list_channels_overview(self) -> list[ChannelOverview]:
        channels = await self._list_channels()
        overview_results = await asyncio.gather(
            *(self._safe_channel_topics_overview(c.id) for c in channels)
        )
        videos_by_channel = await asyncio.gather(
            *(self._list_videos(c.id) for c in channels),
            return_exceptions=False,
        )

        response: list[ChannelOverview] = []
        for channel, overview, videos in zip(
            channels,
            overview_results,
            videos_by_channel,
            strict=True,
        ):
            topics = overview.get("topics") or []
            top_topic = _top_topic(topics)
            recent_topic = _most_recent_topic(topics)
            response.append(
                ChannelOverview(
                    id=channel.id,
                    name=channel.name,
                    slug=channel.slug,
                    avatar_url=channel.avatar_url,
                    bio=channel.bio,
                    channel_url=channel.channel_url,
                    subscriber_count=channel.subscriber_count,
                    top_topic_key=_topic_key(top_topic),
                    top_topic_label=_topic_label(top_topic),
                    recent_sentiment=_sentiment_or_none(
                        recent_topic.get("latest_sentiment") if recent_topic else None
                    ),
                    video_count=len(videos),
                )
            )
        return response

    async def channel_overview(self, slug: str) -> list[PersonTopicStance]:
        channel = await self._channel_by_slug(slug)
        if channel is None:
            raise TrackerNotFoundError(f"/channels/{slug}")

        overview = await self._get_channel_topics_overview(channel.id)
        topics = overview.get("topics") or []
        confidence_by_topic = await self._latest_confidence_by_topic(channel.id, topics)

        response: list[PersonTopicStance] = []
        for item in topics:
            topic = item.get("topic") or {}
            topic_id = int(topic["id"])
            response.append(
                PersonTopicStance(
                    topic_key=to_public_topic_key(str(topic.get("slug") or "")),
                    topic_label=str(topic.get("name") or ""),
                    sentiment=_normalize_sentiment(item.get("latest_sentiment")),
                    confidence=confidence_by_topic.get(topic_id, 0.0),
                    last_updated=str(item.get("latest_published_at") or ""),
                    video_count=int(item.get("mention_count") or 0),
                )
            )
        return response

    async def channel_timeline(
        self,
        slug: str,
        topic_key: str,
    ) -> list[PersonTimelinePoint]:
        channel = await self._channel_by_slug(slug)
        if channel is None:
            raise TrackerNotFoundError(f"/channels/{slug}")

        topic = await self._get_topic_by_key(topic_key)
        data = await self._get_channel_topic_timeline(channel.id, int(topic["id"]))
        entries = list(data.get("entries") or [])
        entries.reverse()
        return [
            PersonTimelinePoint(
                date=_date_only(entry.get("published_at")),
                sentiment=_normalize_sentiment(entry.get("sentiment")),
                confidence=float(entry.get("confidence") or 0.0),
                video_id=int(entry["video_id"]),
                summary=str(entry.get("summary") or ""),
            )
            for entry in entries
        ]

    async def _safe_channel_topics_overview(self, channel_id: int) -> dict[str, Any]:
        try:
            return await self._get_channel_topics_overview(channel_id)
        except Exception as exc:
            logger.warning("tracker channel overview failed for channel %s: %s", channel_id, exc)
            return {"topics": []}

    async def _latest_confidence_by_topic(
        self,
        channel_id: int,
        topics: list[dict[str, Any]],
    ) -> dict[int, float]:
        async def load(topic_id: int) -> tuple[int, float]:
            try:
                data = await self._get_channel_topic_timeline(channel_id, topic_id, limit=1)
                entries = data.get("entries") or []
                if entries:
                    return topic_id, float(entries[0].get("confidence") or 0.0)
            except Exception as exc:
                logger.warning(
                    "tracker latest confidence failed for channel=%s topic=%s: %s",
                    channel_id,
                    topic_id,
                    exc,
                )
            return topic_id, 0.0

        topic_ids = [int(item["topic"]["id"]) for item in topics if item.get("topic")]
        rows = await asyncio.gather(*(load(topic_id) for topic_id in topic_ids))
        return dict(rows)

    @staticmethod
    def _video_sort_key(v: NewsVideo) -> str:
        # published_at is ISO-8601 — string compare is equivalent to time compare.
        return v.published_at or v.created_at

    async def latest(self, limit: int) -> LatestNewsResponse:
        """
        Aggregated "newest across all channels" feed. Upstream has no such
        endpoint, so we fan out per channel, merge, and pick the top N with
        a successfully-generated summary.
        """
        channels = await self._list_channels()
        channel_by_id = {c.id: c for c in channels}

        per_channel = await asyncio.gather(
            *(self._list_videos(c.id) for c in channels),
            return_exceptions=False,
        )

        candidates = sorted(
            (v for bucket in per_channel for v in bucket),
            key=self._video_sort_key,
            reverse=True,
        )[:CANDIDATE_POOL]

        summaries = await asyncio.gather(
            *(self._get_summary(v.id) for v in candidates),
            return_exceptions=False,
        )

        stories: list[NewsStory] = []
        for video, summary in zip(candidates, summaries, strict=True):
            if summary is None:
                continue
            channel = channel_by_id.get(video.channel_id) if video.channel_id else None
            stories.append(NewsStory(video=video, channel=channel, summary=summary))
            if len(stories) >= limit:
                break

        return LatestNewsResponse(stories=stories)

    async def story(self, video_id: int) -> NewsStory:
        """
        Assemble one story by id. Upstream GET /videos/{id} returns 500,
        so we locate the video by scanning channel listings in parallel.
        """
        summary = await self._get_summary(video_id)
        if summary is None:
            raise TrackerNotFoundError(f"/videos/{video_id}/summary")

        channels = await self._list_channels()
        channel_by_id = {c.id: c for c in channels}

        per_channel = await asyncio.gather(
            *(self._list_videos(c.id) for c in channels),
            return_exceptions=False,
        )

        for bucket in per_channel:
            for v in bucket:
                if v.id == video_id:
                    channel = channel_by_id.get(v.channel_id) if v.channel_id else None
                    return NewsStory(video=v, channel=channel, summary=summary)

        # Summary exists but we can't find the video metadata — treat as not found.
        raise TrackerNotFoundError(f"/videos/{video_id}")


def _normalize_sentiment(value: object) -> str:
    if isinstance(value, str) and value in VALID_SENTIMENTS:
        return value
    return "neutral"


def _sentiment_or_none(value: object) -> str | None:
    if isinstance(value, str) and value in VALID_SENTIMENTS:
        return value
    return None


def _top_topic(topics: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not topics:
        return None
    return max(topics, key=lambda item: int(item.get("mention_count") or 0))


def _most_recent_topic(topics: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not topics:
        return None
    return max(topics, key=lambda item: str(item.get("latest_published_at") or ""))


def _topic_key(item: dict[str, Any] | None) -> str | None:
    if item is None:
        return None
    topic = item.get("topic") or {}
    slug = str(topic.get("slug") or "")
    return to_public_topic_key(slug) if slug else None


def _topic_label(item: dict[str, Any] | None) -> str | None:
    if item is None:
        return None
    topic = item.get("topic") or {}
    label = str(topic.get("name") or "")
    return label or None


def _date_only(value: object) -> str:
    if not isinstance(value, str) or not value:
        return ""
    return value.split("T", 1)[0]
