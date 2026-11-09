"""Hermetic tests for the research digest proxy (OI-041)."""
import copy
from datetime import date

import httpx
import pytest
from fastapi.testclient import TestClient

import app.services.research_service as research_service
from app.config import Settings
from app.dependencies import get_settings

TRACKER_BASE = "http://tracker.test"
TRACKER_KEY = "tracker-test-key"
TODAY = date(2026, 11, 9)
PATH = "/research/digests"

DIGEST = {
    "headline": "Tasfiye kapsamındaki fonlarda 116 milyar TL reel sektör yatırımı var",
    "why_now": "Yazarlar fon tasfiyelerinin reel sektöre etkisini inceledi.",
    "findings": ["Yaklaşık 3 bin firma 116 milyar TL tutuyor.", "Aktiflerin yüzde 1,2'si."],
    "so_what": "Doğrudan ağırlık sınırlı görünüyor.",
    "not_said": "Toplam etkiyi ölçmüyor.",
    "terms": [{"term": "Maruziyet oranı", "meaning": "Fondaki yatırım / dönen varlıklar."}],
    "quote": "Özetle, analizlerimiz ... ortaya koyuyor.",
    "basis": "Firma bilançoları ve kredi verileri.",
    "topics": ["faiz-para-politikasi", "not-mapped"],
}


def _item(item_id: int, published_at: str, topics: list[str]) -> dict:
    return {
        "id": item_id,
        "source": {
            "slug": "tcmb-blog",
            "name": "Merkezin Güncesi (TCMB blogu)",
            "disclaimer": "Yazarların görüşüdür; TCMB'nin resmi görüşü değildir.",
        },
        "url": f"https://tcmbblog.org/wps/wcm/connect/blog/tr/main+menu/analizler/p{item_id}",
        "title": f"Yazı {item_id}",
        "authors": ["Ünal Seven", "Kadir Gürci"],
        "category": "Finansal Piyasalar",
        "published_at": published_at,
        "digest": {**copy.deepcopy(DIGEST), "topics": topics},
        "digest_version": "research-digest-v1",
        "digested_at": "2026-11-09T08:00:00",
    }


UPSTREAM = {
    "count": 2,
    "items": [
        _item(7, "2026-11-04", ["faiz-para-politikasi", "not-mapped"]),
        _item(3, "2025-12-23", ["enflasyon"]),
    ],
}


class Tracker:
    def __init__(self) -> None:
        self.requests: list[httpx.Request] = []
        self.response: httpx.Response | Exception = httpx.Response(200, json=UPSTREAM)

    def __call__(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request)
        if request.url.path != PATH:
            return httpx.Response(404, json={"detail": "x"})
        if isinstance(self.response, Exception):
            raise self.response
        return self.response


@pytest.fixture
def tracker(client: TestClient, monkeypatch) -> Tracker:
    monkeypatch.setattr(research_service, "_today", lambda: TODAY)
    handler = Tracker()
    client.app.state.http_client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    client.app.dependency_overrides[get_settings] = lambda: Settings(
        api_secret_key="test-secret",
        tracker_api_url=TRACKER_BASE,
        tracker_api_key=TRACKER_KEY,
        tracker_timeout_seconds=5.0,
    )
    return handler


def test_list_maps_topics_to_public_keys_and_uses_fixed_upstream_query(client, tracker):
    response = client.get("/v1/research/digests")
    assert response.status_code == 200
    body = response.json()
    assert [i["id"] for i in body["items"]] == [7, 3]
    assert body["items"][0]["digest"]["topics"] == ["faiz"]  # unknown slug dropped
    assert body["items"][1]["digest"]["topics"] == ["enflasyon"]
    assert body["items"][0]["source"]["disclaimer"].startswith("Yazarların görüşüdür")
    (req,) = tracker.requests
    assert dict(req.url.params) == {"days": "3650", "limit": "100"}
    assert req.headers["X-API-Key"] == TRACKER_KEY


def test_filters_are_local_and_cached(client, tracker):
    assert client.get("/v1/research/digests?days=30").json()["count"] == 1
    assert client.get("/v1/research/digests?topic=enflasyon").json()["items"][0]["id"] == 3
    assert client.get("/v1/research/digests?limit=1").json()["count"] == 1
    assert client.get("/v1/research/digests/3").json()["title"] == "Yazı 3"
    assert len(tracker.requests) == 1  # one upstream call, then the cache


def test_unknown_topic_and_item(client, tracker):
    assert client.get("/v1/research/digests?topic=uzay").status_code == 422
    assert client.get("/v1/research/digests/999").status_code == 404


def test_upstream_errors_map_to_502_and_are_not_cached(client, tracker):
    tracker.response = httpx.Response(500, json={"detail": "boom"})
    assert client.get("/v1/research/digests").status_code == 502
    tracker.response = httpx.Response(200, json={"count": 1, "detail": "no items key"})
    assert client.get("/v1/research/digests").status_code == 502  # malformed payload
    tracker.response = httpx.Response(200, json=UPSTREAM)
    assert client.get("/v1/research/digests").status_code == 200


def test_invalid_item_is_dropped_not_the_list(client, tracker):
    broken = {**_item(9, "2026-11-01", []), "title": ""}
    tracker.response = httpx.Response(200, json={"count": 3, "items": [broken, *UPSTREAM["items"]]})
    body = client.get("/v1/research/digests").json()
    assert [i["id"] for i in body["items"]] == [7, 3]


def test_missing_tracker_route_is_502_for_list_and_item(client, tracker):
    tracker.response = httpx.Response(404, json={"detail": "Not Found"})
    assert client.get("/v1/research/digests").status_code == 502
    assert client.get("/v1/research/digests/7").status_code == 502
