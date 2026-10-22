"""OI-018 interim: views from multi-guest channels need one named, known guest."""

from datetime import UTC, datetime

import httpx
from fastapi.testclient import TestClient

from app.config import Settings
from app.dependencies import get_settings
from app.services.attribution import (
    normalize_name,
    single_known_guest,
    title_participants,
)

TRACKER_BASE = "http://tracker.test"
AUTH_HEADERS = {"X-API-Key": "test-secret"}
NOW = datetime.now(UTC).isoformat()
KNOWN = {normalize_name("Atilla Yeşilada"): "Atilla Yeşilada"}


def _entry(video_id: int, title: str, sentiment: str = "bullish") -> dict:
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
    }


def _payload(path: str):
    if path == "/persons/":
        return [{"id": 9, "name": "Atilla Yeşilada", "slug": "atilla-yesilada"}]
    if path == "/channels/":
        return [
            {"id": 1, "name": "ATİLLA YEŞİLADA", "slug": "atilla-yesilada", "platform": "youtube"},
            {"id": 3, "name": "Mesele Ekonomi", "slug": "mesele-ekonomi", "platform": "youtube"},
        ]
    if path == "/channels/1/topics/overview":
        return {"channel_id": 1, "topics": []}
    if path == "/videos/":
        return {"items": [], "total": 0}
    if path == "/topics/kripto-paralar/opinions":
        return {
            "topic": {"id": 10, "name": "Kripto Paralar", "slug": "kripto-paralar"},
            "total_channels": 2,
            "channel_opinions": [
                {
                    "channel_id": 1,
                    "channel_name": "ATİLLA YEŞİLADA",
                    "channel_slug": "atilla-yesilada",
                    "entries": [_entry(101, "Kendi kanalında yorum")],
                },
                {
                    "channel_id": 3,
                    "channel_name": "Mesele Ekonomi",
                    "channel_slug": "mesele-ekonomi",
                    "entries": [
                        _entry(301, "Devalüasyon Yaklaştı Mı? | Atilla Yeşilada"),
                        _entry(302, "Piyasalar Gergin! | Atilla Yeşilada & Yunus Emre Erdölen"),
                        _entry(303, "Merkez Bankası'ndan Döviz Mesajı! | Erdal Sağlam"),
                        _entry(304, "Seans Başlarken 22.10.2026", "bearish"),
                    ],
                },
            ],
        }
    if path.startswith("/channels/") and "/topics/10/timeline" in path:
        return {"entries": []}
    raise AssertionError(f"unexpected tracker request: {path}")


def _install(client: TestClient) -> None:
    client.app.state.http_client = httpx.AsyncClient(
        transport=httpx.MockTransport(lambda r: httpx.Response(200, json=_payload(r.url.path))),
        base_url=TRACKER_BASE,
    )
    client.app.dependency_overrides[get_settings] = lambda: Settings(
        api_secret_key="test-secret",
        tracker_api_url=TRACKER_BASE,
        tracker_timeout_seconds=5.0,
    )


def test_title_participants_reads_names_after_last_pipe():
    assert title_participants("Konu | Piyasanın Efendisi | Atilla Yeşilada & Perihan Tantuğ") == [
        "Atilla Yeşilada",
        "Perihan Tantuğ",
    ]
    assert title_participants("Konu | Murat Aysan, Ömer Gencal ve Ali Veli") == [
        "Murat Aysan",
        "Ömer Gencal",
        "Ali Veli",
    ]
    assert title_participants("Seans Başlarken 22.10.2026") == []


def test_single_known_guest_requires_exactly_one_known_name():
    assert single_known_guest("Konu | ATİLLA YEŞİLADA", KNOWN) == "Atilla Yeşilada"
    assert single_known_guest("Konu | Atilla Yeşilada & Perihan Tantuğ", KNOWN) is None
    assert single_known_guest("Konu | Erdal Sağlam", KNOWN) is None
    assert single_known_guest("Seans Başlarken", KNOWN) is None
    assert single_known_guest(None, KNOWN) is None


def test_opinions_keep_only_single_known_guest_on_multi_guest_channels(client: TestClient):
    _install(client)

    response = client.get("/v1/inference/topics/bitcoin/opinions", headers=AUTH_HEADERS)

    assert response.status_code == 200
    rows = {(row["video_id"], row["channel_name"], row["person_name"]) for row in response.json()}
    assert rows == {
        (101, "ATİLLA YEŞİLADA", "ATİLLA YEŞİLADA"),
        (301, "Mesele Ekonomi", "Atilla Yeşilada"),
    }


def test_consensus_drops_unattributed_multi_guest_views(client: TestClient):
    _install(client)

    response = client.get("/v1/consensus/bitcoin", headers=AUTH_HEADERS)

    assert response.status_code == 200
    body = response.json()
    assert body["stats"]["opinion_count"] == 2
    names = {e["expert_name"] for e in body["important_experts"]}
    assert "Mesele Ekonomi" not in names


def test_multi_guest_channels_have_no_expert_listing_or_profile(client: TestClient):
    _install(client)

    listing = client.get("/v1/channels/", headers=AUTH_HEADERS)
    assert listing.status_code == 200
    assert [row["slug"] for row in listing.json()] == ["atilla-yesilada"]

    profile = client.get("/v1/channels/mesele-ekonomi/overview", headers=AUTH_HEADERS)
    assert profile.status_code == 404
