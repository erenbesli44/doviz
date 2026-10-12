from datetime import datetime, timedelta

import httpx
from fastapi.testclient import TestClient

from app.config import Settings
from app.dependencies import get_settings

TRACKER_BASE = "http://tracker.test"
AUTH_HEADERS = {"X-API-Key": "test-secret"}


def _video(video_id: int) -> dict:
    created = datetime(2026, 9, 1) + timedelta(minutes=video_id)
    return {
        "id": video_id,
        "channel_id": 1,
        "platform": "youtube",
        "video_id": f"yt{video_id}",
        "video_url": f"https://youtube.com/watch?v=yt{video_id}",
        "title": f"Video {video_id}",
        "created_at": created.isoformat(),
    }


def _summary(video_id: int) -> dict:
    return {
        "id": video_id,
        "video_id": video_id,
        "short_summary": "Kısa özet.",
        "long_summary": "Uzun özet.",
        "language": "tr",
        "source": "llm",
        "created_at": "2026-09-01T00:00:00",
    }


def _install_tracker_mock(client: TestClient, video_count: int, summarized: set[int]) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        path = request.url.path
        if path == "/channels/":
            return httpx.Response(
                200, json=[{"id": 1, "name": "Kanal", "slug": "kanal", "platform": "youtube"}]
            )
        if path == "/videos/":
            return httpx.Response(
                200, json={"items": [_video(i) for i in range(1, video_count + 1)]}
            )
        if path.startswith("/videos/") and path.endswith("/summary"):
            video_id = int(path.split("/")[2])
            if video_id in summarized:
                return httpx.Response(200, json=_summary(video_id))
            return httpx.Response(404, json={"detail": "Summary not found for this video"})
        return httpx.Response(404)

    client.app.state.http_client = httpx.AsyncClient(
        transport=httpx.MockTransport(handler),
        base_url=TRACKER_BASE,
    )
    client.app.dependency_overrides[get_settings] = lambda: Settings(
        api_secret_key="test-secret",
        tracker_api_url=TRACKER_BASE,
        tracker_timeout_seconds=5.0,
    )


def test_latest_skips_past_a_run_of_unsummarized_videos(client: TestClient):
    # Newest 35 videos have no summary (e.g. LLM quota exhausted); only 1..5 do.
    _install_tracker_mock(client, video_count=40, summarized={1, 2, 3, 4, 5})

    response = client.get("/v1/news/latest?limit=3", headers=AUTH_HEADERS)

    assert response.status_code == 200
    ids = [story["video"]["id"] for story in response.json()["stories"]]
    assert ids == [5, 4, 3]


def test_latest_can_return_more_than_one_batch(client: TestClient):
    _install_tracker_mock(client, video_count=60, summarized=set(range(1, 61)))

    response = client.get("/v1/news/latest?limit=50", headers=AUTH_HEADERS)

    assert response.status_code == 200
    ids = [story["video"]["id"] for story in response.json()["stories"]]
    assert ids == list(range(60, 10, -1))
