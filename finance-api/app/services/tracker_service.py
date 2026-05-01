import asyncio
import logging
from typing import Any

import httpx

from ..config import Settings
from ..schemas.news import (
    LatestNewsResponse,
    NewsChannel,
    NewsStory,
    NewsSummary,
    NewsVideo,
)


logger = logging.getLogger(__name__)

# Over-fetch candidates so we can skip any whose summary isn't generated yet
# (tracker returns 404 for those).
CANDIDATE_POOL = 30


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
        return [NewsVideo.model_validate(v) for v in data]

    async def _get_summary(self, video_id: int) -> NewsSummary | None:
        try:
            data = await self._get(f"/videos/{video_id}/summary")
            return NewsSummary.model_validate(data)
        except TrackerNotFoundError:
            return None
        except Exception as exc:
            logger.warning("tracker summary validation failed for video %s: %s", video_id, exc)
            return None

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
