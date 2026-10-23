"""OI-018: views on multi-guest channels belong to the guest the tracker attributed them to."""

from datetime import UTC, datetime

import httpx
from fastapi.testclient import TestClient

from app.config import Settings
from app.dependencies import get_settings
from app.services.attribution import speaker_of

TRACKER_BASE = "http://tracker.test"
AUTH_HEADERS = {"X-API-Key": "test-secret"}
NOW = datetime.now(UTC).isoformat()
CALLS: list[str] = []


def _entry(video_id: int, title: str, person: str | None = None, sentiment="bullish") -> dict:
    return {
        "mention_id": video_id * 10,
        "video_id": video_id,
        "video_title": title,
        "video_url": f"https://youtube.com/watch?v=v{video_id}",
        "published_at": NOW,
        "summary": "Kripto Paralar: görüş.",
        "sentiment": sentiment,
        "key_levels": [],
        "confidence": 0.8,
        "person_name": person,
        "person_slug": None,
    }


def _payload(path: str):
    CALLS.append(path)
    if path == "/persons/appearances":
        return [
            {"id": 9, "name": "Atilla Yeşilada", "slug": "atilla-yesilada", "mention_count": 5,
             "channel_slugs": ["atilla-yesilada", "mesele-ekonomi"],
             "own_channel_slug": "atilla-yesilada"},
            {"id": 21, "name": "Erdal Sağlam", "slug": "erdal-saglam", "mention_count": 2,
             "channel_slugs": ["mesele-ekonomi"], "own_channel_slug": None},
        ]
    if path == "/channels/":
        return [
            {"id": 1, "name": "ATİLLA YEŞİLADA", "slug": "atilla-yesilada", "platform": "youtube"},
            {"id": 3, "name": "Mesele Ekonomi", "slug": "mesele-ekonomi", "platform": "youtube"},
        ]
    if path in ("/channels/1/topics/overview", "/persons/21/topics/overview",
                "/persons/9/topics/overview"):
        return {"topics": [{"topic": {"id": 10, "name": "Kripto Paralar", "slug": "kripto-paralar"},
                            "mention_count": 2, "latest_sentiment": "bullish",
                            "latest_published_at": NOW}]}
    if path == "/videos/":
        return {"items": [], "total": 0}
    if path == "/topics/kripto-paralar/opinions":
        return {
            "topic": {"id": 10, "name": "Kripto Paralar", "slug": "kripto-paralar"},
            "total_channels": 2,
            "channel_opinions": [
                {"channel_id": 1, "channel_name": "ATİLLA YEŞİLADA",
                 "channel_slug": "atilla-yesilada", "multi_guest": False,
                 "entries": [_entry(101, "Kendi kanalında yorum", "Atilla Yeşilada")]},
                {"channel_id": 3, "channel_name": "Mesele Ekonomi",
                 "channel_slug": "mesele-ekonomi", "multi_guest": True,
                 "entries": [
                     _entry(301, "Devalüasyon? | Atilla Yeşilada", "Atilla Yeşilada"),
                     _entry(302, "Piyasalar | Atilla Yeşilada & Yunus Emre Erdölen",
                            "Yunus Emre Erdölen"),
                     _entry(303, "Döviz Mesajı! | Erdal Sağlam", "Erdal Sağlam"),
                     _entry(304, "Seans Başlarken 22.10.2026", None, "bearish"),
                 ]},
            ],
        }
    if "/topics/10/timeline" in path:
        return {"entries": [{"video_id": 301, "published_at": NOW, "sentiment": "bullish",
                             "confidence": 0.8, "summary": "x", "start_time": "01:00"}]}
    raise AssertionError(f"unexpected tracker request: {path}")


def _install(client: TestClient) -> None:
    CALLS.clear()
    client.app.state.http_client = httpx.AsyncClient(
        transport=httpx.MockTransport(lambda r: httpx.Response(200, json=_payload(r.url.path))),
        base_url=TRACKER_BASE,
    )
    client.app.dependency_overrides[get_settings] = lambda: Settings(
        api_secret_key="test-secret",
        tracker_api_url=TRACKER_BASE,
        tracker_timeout_seconds=5.0,
    )


def test_speaker_of_drops_unattributed_multi_guest_views():
    multi = {"channel_slug": "mesele-ekonomi", "channel_name": "Mesele Ekonomi"}
    single = {"channel_slug": "kanal-finans", "channel_name": "Kanal Finans"}
    assert speaker_of(multi, {"person_name": "Erdal Sağlam"}) == "Erdal Sağlam"
    assert speaker_of(multi, {"person_name": None}) is None
    assert speaker_of(single, {"person_name": "Tunç Şatıroğlu"}) == "Tunç Şatıroğlu"
    assert speaker_of(single, {}) == "Kanal Finans"


def test_opinions_use_the_tracker_speaker(client: TestClient):
    _install(client)

    response = client.get("/v1/inference/topics/bitcoin/opinions", headers=AUTH_HEADERS)

    assert response.status_code == 200
    rows = {(r["video_id"], r["channel_name"], r["person_name"]) for r in response.json()}
    assert rows == {
        (101, "ATİLLA YEŞİLADA", "Atilla Yeşilada"),
        (301, "Mesele Ekonomi", "Atilla Yeşilada"),
        (302, "Mesele Ekonomi", "Yunus Emre Erdölen"),
        (303, "Mesele Ekonomi", "Erdal Sağlam"),
    }


def test_consensus_counts_only_attributed_multi_guest_views(client: TestClient):
    _install(client)

    body = client.get("/v1/consensus/bitcoin", headers=AUTH_HEADERS).json()

    assert body["stats"]["opinion_count"] == 4
    assert "Mesele Ekonomi" not in {e["expert_name"] for e in body["important_experts"]}


def test_expert_list_hides_multi_guest_channels_and_adds_guests(client: TestClient):
    _install(client)

    rows = client.get("/v1/channels/", headers=AUTH_HEADERS).json()

    assert [(r["slug"], r["kind"]) for r in rows] == [
        ("atilla-yesilada", "channel"),
        ("erdal-saglam", "person"),
    ]
    guest = rows[1]
    assert guest["id"] < 0 and "Mesele Ekonomi" in guest["bio"]


def test_profiles_use_the_person_when_one_owns_the_slug(client: TestClient):
    _install(client)

    # Atilla: his own channel slug resolves to his person (own channel + guest spots)
    overview = client.get("/v1/channels/atilla-yesilada/overview", headers=AUTH_HEADERS)
    assert overview.status_code == 200
    assert "/persons/9/topics/overview" in CALLS and "/channels/1/topics/overview" not in CALLS
    # a guest without a channel has a profile too
    timeline = client.get(
        "/v1/channels/erdal-saglam/timeline?topic_key=bitcoin", headers=AUTH_HEADERS
    )
    assert timeline.status_code == 200 and timeline.json()[0]["video_id"] == 301
    assert "/persons/21/topics/10/timeline" in CALLS
    # the multi-guest channel itself has none
    hidden = client.get("/v1/channels/mesele-ekonomi/overview", headers=AUTH_HEADERS)
    assert hidden.status_code == 404
