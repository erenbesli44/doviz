import asyncio
import logging
from typing import Any

import httpx

from ..config import Settings
from ..schemas.inference import InferenceLatestResponse, TopicHistoryEntry, TopicOpinion
from .topic_mapping import to_tracker_topic_slug

logger = logging.getLogger(__name__)

VALID_SENTIMENTS = {"bullish", "bearish", "neutral"}


class InferenceService:
    """
    Thin proxy for the inference API. Wraps the upstream X-API-Key so it
    never leaves the server. Uses inference_api_key (separate from tracker_api_key).
    """

    def __init__(self, client: httpx.AsyncClient, settings: Settings) -> None:
        self._client = client
        self._base = settings.tracker_api_url.rstrip("/")
        key = settings.inference_api_key or settings.tracker_api_key
        self._headers = {"X-API-Key": key} if key else {}
        self._timeout = settings.tracker_timeout_seconds

    async def _get(self, path: str) -> Any:
        url = f"{self._base}{path}"
        resp = await self._client.get(
            url,
            headers=self._headers,
            timeout=self._timeout,
            follow_redirects=True,
        )
        if not resp.is_success:
            logger.error(
                "inference upstream %s returned %s: %s",
                url,
                resp.status_code,
                resp.text[:200],
            )
        resp.raise_for_status()
        return resp.json()

    async def latest(self) -> InferenceLatestResponse:
        data = await self._get("/inference/latest")
        return InferenceLatestResponse.model_validate(data)

    async def topic_history(self, topic_key: str, days: int) -> list[TopicHistoryEntry]:
        data = await self._get(f"/inference/topics/{topic_key}/history?days={days}")
        return [TopicHistoryEntry.model_validate(e) for e in data]

    async def topic_opinions(
        self,
        topic_key: str,
        limit: int = 5,
        days: int = 30,
    ) -> list[TopicOpinion]:
        tracker_topic = to_tracker_topic_slug(topic_key)
        data = await self._get(
            f"/topics/{tracker_topic}/opinions?limit={limit}&days={days}"
        )
        channels = await self._list_channels_by_id()
        topic_id = int(data["topic"]["id"])
        groups = data.get("channel_opinions") or []
        start_times_by_channel = await self._topic_start_times_by_channel(
            topic_id,
            [int(group["channel_id"]) for group in groups],
        )

        opinions: list[TopicOpinion] = []
        for group in groups:
            channel_id = int(group["channel_id"])
            channel = channels.get(channel_id, {})
            starts_by_video = start_times_by_channel.get(channel_id, {})
            channel_name = str(group.get("channel_name") or "")
            # tracker /topics/{slug}/opinions doesn't return person_id and the
            # Person.primary_channel_id link is unpopulated upstream, so fall
            # back to channel_name — most pros are 1:1 with their channel.
            person_name = str(group.get("person_name") or channel_name) or None
            for entry in group.get("entries") or []:
                video_id = int(entry["video_id"])
                opinions.append(
                    TopicOpinion(
                        video_id=video_id,
                        channel_id=channel_id,
                        channel_name=channel_name,
                        channel_avatar_url=channel.get("avatar_url"),
                        person_name=person_name,
                        sentiment=_normalize_sentiment(entry.get("sentiment")),
                        confidence=float(entry.get("confidence") or 0.0),
                        summary=str(entry.get("summary") or ""),
                        key_levels=_list_of_strings(entry.get("key_levels")),
                        published_at=str(entry.get("published_at") or ""),
                        video_url=str(entry.get("video_url") or ""),
                        start_time_seconds=starts_by_video.get(video_id),
                    )
                )

        return sorted(opinions, key=lambda item: item.published_at, reverse=True)

    async def _list_channels_by_id(self) -> dict[int, dict[str, Any]]:
        data = await self._get("/channels/")
        result: dict[int, dict[str, Any]] = {}
        for item in data:
            metadata = item.get("channel_metadata") or {}
            if not isinstance(metadata, dict):
                metadata = {}
            result[int(item["id"])] = {
                "avatar_url": item.get("avatar_url") or metadata.get("avatar_url"),
            }
        return result

    async def _topic_start_times_by_channel(
        self,
        topic_id: int,
        channel_ids: list[int],
    ) -> dict[int, dict[int, int | None]]:
        async def load(channel_id: int) -> tuple[int, dict[int, int | None]]:
            try:
                data = await self._get(
                    f"/channels/{channel_id}/topics/{topic_id}/timeline?limit=50"
                )
            except Exception as exc:
                logger.warning(
                    "tracker topic timeline failed for channel=%s topic=%s: %s",
                    channel_id,
                    topic_id,
                    exc,
                )
                return channel_id, {}
            by_video = {
                int(entry["video_id"]): _parse_timecode(entry.get("start_time"))
                for entry in data.get("entries") or []
            }
            return channel_id, by_video

        rows = await asyncio.gather(*(load(channel_id) for channel_id in channel_ids))
        return dict(rows)


def _normalize_sentiment(value: object) -> str:
    if isinstance(value, str) and value in VALID_SENTIMENTS:
        return value
    return "neutral"


def _list_of_strings(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item) for item in value if str(item).strip()]


def _parse_timecode(value: object) -> int | None:
    if not isinstance(value, str) or not value.strip():
        return None
    parts = value.strip().split(":")
    if len(parts) not in (2, 3):
        return None
    try:
        numbers = [int(part) for part in parts]
    except ValueError:
        return None
    if len(numbers) == 2:
        minutes, seconds = numbers
        return minutes * 60 + seconds
    hours, minutes, seconds = numbers
    return hours * 3600 + minutes * 60 + seconds
