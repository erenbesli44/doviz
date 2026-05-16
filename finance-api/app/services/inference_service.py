import logging
from typing import Any

import httpx

from ..config import Settings
from ..schemas.inference import InferenceLatestResponse, TopicHistoryEntry


logger = logging.getLogger(__name__)


class InferenceService:
    """
    Thin proxy for the inference API. Wraps the upstream X-API-Key so it
    never leaves the server. Reuses the same tracker upstream and key.
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
        resp.raise_for_status()
        return resp.json()

    async def latest(self) -> InferenceLatestResponse:
        data = await self._get("/inference/latest")
        return InferenceLatestResponse.model_validate(data)

    async def topic_history(self, topic_key: str, days: int) -> list[TopicHistoryEntry]:
        data = await self._get(f"/inference/topics/{topic_key}/history?days={days}")
        return [TopicHistoryEntry.model_validate(e) for e in data]
