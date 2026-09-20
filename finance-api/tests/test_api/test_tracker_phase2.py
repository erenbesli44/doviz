import httpx
from fastapi.testclient import TestClient

from app.config import Settings
from app.dependencies import get_settings

TRACKER_BASE = "http://tracker.test"
AUTH_HEADERS = {"X-API-Key": "test-secret"}


def _json_response(data):
    return httpx.Response(200, json=data)


def _tracker_payload(path: str, query: str):
    if path == "/channels/":
        return [
            {
                "id": 1,
                "name": "Kriptokoin TV",
                "slug": "kriptokoin-tv",
                "platform": "youtube",
                "channel_url": "https://youtube.com/@kriptokointv",
                "bio": "Kripto para piyasaları üzerine günlük analizler.",
                "channel_metadata": {
                    "avatar_url": "https://cdn.example/avatar.jpg",
                    "subscriber_count": 125000,
                },
            }
        ]

    if path == "/channels/1/topics/overview":
        return {
            "channel_id": 1,
            "topics": [
                {
                    "topic": {
                        "id": 10,
                        "name": "Kripto Paralar",
                        "slug": "kripto-paralar",
                    },
                    "mention_count": 2,
                    "latest_sentiment": "bullish",
                    "latest_published_at": "2026-05-18T14:00:00Z",
                }
            ],
        }

    if path == "/videos/":
        assert query == "channel_id=1"
        return {
            "items": [
                {
                    "id": 1001,
                    "channel_id": 1,
                    "person_id": None,
                    "platform": "youtube",
                    "video_id": "abc123",
                    "video_url": "https://youtube.com/watch?v=abc123",
                    "title": "Bitcoin update",
                    "published_at": "2026-05-18T14:00:00Z",
                    "created_at": "2026-05-18T14:05:00Z",
                    "duration": 1200,
                }
            ],
            "total": 1,
        }

    if path == "/topics/kripto-paralar/opinions":
        return {
            "topic": {
                "id": 10,
                "name": "Kripto Paralar",
                "slug": "kripto-paralar",
            },
            "total_channels": 1,
            "channel_opinions": [
                {
                    "channel_id": 1,
                    "channel_name": "Kriptokoin TV",
                    "channel_slug": "kriptokoin-tv",
                    "mention_count": 1,
                    "latest_sentiment": "bullish",
                    "entries": [
                        {
                            "mention_id": 501,
                            "video_id": 1001,
                            "video_title": "Bitcoin update",
                            "video_url": "https://youtube.com/watch?v=abc123",
                            "published_at": "2026-05-18T14:00:00Z",
                            "summary": "Bitcoin desteği korudu.",
                            "sentiment": "bullish",
                            "key_levels": ["67,000", "70,000"],
                            "confidence": 0.82,
                        }
                    ],
                }
            ],
        }

    if path == "/channels/1/topics/10/timeline":
        entries = [
            {
                "mention_id": 501,
                "video_id": 1001,
                "video_title": "Bitcoin update",
                "video_url": "https://youtube.com/watch?v=abc123",
                "published_at": "2026-05-18T14:00:00Z",
                "summary": "Bitcoin desteği korudu.",
                "sentiment": "bullish",
                "key_levels": ["67,000", "70,000"],
                "start_time": "12:32",
                "end_time": "14:00",
                "confidence": 0.82,
            },
            {
                "mention_id": 500,
                "video_id": 1000,
                "video_title": "Bitcoin older update",
                "video_url": "https://youtube.com/watch?v=old123",
                "published_at": "2026-05-17T14:00:00Z",
                "summary": "Bitcoin yatay kaldı.",
                "sentiment": "neutral",
                "key_levels": [],
                "start_time": None,
                "end_time": None,
                "confidence": 0.55,
            },
        ]
        if query == "limit=1":
            entries = entries[:1]
        return {
            "topic": {"id": 10, "name": "Kripto Paralar", "slug": "kripto-paralar"},
            "channel_id": 1,
            "total": len(entries),
            "entries": entries,
        }

    raise AssertionError(f"unexpected tracker request: {path}?{query}")


def _install_tracker_mock(client: TestClient) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return _json_response(_tracker_payload(request.url.path, request.url.query.decode()))

    client.app.state.http_client = httpx.AsyncClient(
        transport=httpx.MockTransport(handler),
        base_url=TRACKER_BASE,
    )
    client.app.dependency_overrides[get_settings] = lambda: Settings(
        api_secret_key="test-secret",
        tracker_api_url=TRACKER_BASE,
        tracker_timeout_seconds=5.0,
    )


def test_topic_opinions_returns_flat_structured_opinions(client: TestClient):
    _install_tracker_mock(client)

    response = client.get("/v1/inference/topics/bitcoin/opinions", headers=AUTH_HEADERS)

    assert response.status_code == 200
    body = response.json()
    assert body == [
        {
            "video_id": 1001,
            "channel_id": 1,
            "channel_name": "Kriptokoin TV",
            "channel_avatar_url": "https://cdn.example/avatar.jpg",
            "person_name": None,
            "sentiment": "bullish",
            "confidence": 0.82,
            "summary": "Bitcoin desteği korudu.",
            "key_levels": ["67,000", "70,000"],
            "published_at": "2026-05-18T14:00:00Z",
            "video_url": "https://youtube.com/watch?v=abc123",
            "start_time_seconds": 752,
        }
    ]


def test_channels_directory_returns_enriched_rows(client: TestClient):
    _install_tracker_mock(client)

    response = client.get("/v1/channels/", headers=AUTH_HEADERS)

    assert response.status_code == 200
    body = response.json()
    assert body[0]["slug"] == "kriptokoin-tv"
    assert body[0]["avatar_url"] == "https://cdn.example/avatar.jpg"
    assert body[0]["subscriber_count"] == 125000
    assert body[0]["top_topic_key"] == "bitcoin"
    assert body[0]["recent_sentiment"] == "bullish"
    assert body[0]["video_count"] == 1


def test_channel_overview_returns_topic_stances(client: TestClient):
    _install_tracker_mock(client)

    response = client.get("/v1/channels/kriptokoin-tv/overview", headers=AUTH_HEADERS)

    assert response.status_code == 200
    assert response.json() == [
        {
            "topic_key": "bitcoin",
            "topic_label": "Kripto Paralar",
            "sentiment": "bullish",
            "confidence": 0.82,
            "last_updated": "2026-05-18T14:00:00Z",
            "video_count": 2,
        }
    ]


def test_channel_timeline_returns_oldest_to_newest_points(client: TestClient):
    _install_tracker_mock(client)

    response = client.get(
        "/v1/channels/kriptokoin-tv/timeline?topic_key=bitcoin",
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 200
    body = response.json()
    assert [item["video_id"] for item in body] == [1000, 1001]
    assert body[0]["date"] == "2026-05-17"
    assert body[1]["sentiment"] == "bullish"
