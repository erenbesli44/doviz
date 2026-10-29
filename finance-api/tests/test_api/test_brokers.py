"""Hermetic tests for the broker model-portfolio proxy (OI-027 step 4)."""
import copy

import httpx
import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.dependencies import get_settings

TRACKER_BASE = "http://tracker.test"
TRACKER_KEY = "tracker-test-key"

IS_SAHOL_REMOVED = {
    "id": 31,
    "broker": {"slug": "is-yatirim", "name": "İş Yatırım"},
    "ticker": "SAHOL",
    "action": "removed",
    "event_date": "2026-10-28",
    "reason_quote": "Sabancı Holding'i (SAHOL) model portföyümüzden çıkarıyoruz.",
    "quote_page": 1,
    "recommendation": None,
    "target_price": None,
    "document": {
        "url": "https://www.isyatirim.com.tr/tr-tr/analiz/Documents/model-portfoy-20261028.pdf",
        "published_at": "2026-10-28",
    },
    "previous": {"action": "added", "event_date": "2026-10-20"},
}

YK_VAKBN_REMOVED = {
    "id": 12,
    "broker": {"slug": "yapi-kredi-yatirim", "name": "Yapı Kredi Yatırım"},
    "ticker": "VAKBN",
    "action": "removed",
    "event_date": "2026-09-14",
    "reason_quote": (
        "Vakıfbank'ı (VAKBN) model portföyümüzden çıkarıyoruz; AL tavsiyemizi koruyoruz."
    ),
    "quote_page": 2,
    "recommendation": "AL",
    "target_price": 41.0,
    "document": {
        "url": "https://www.ykyatirim.com.tr/arastirma/model-portfoy-20260914.pdf",
        "published_at": None,
    },
    "previous": None,
}

GEDIK_TICKERS = [
    "AKBNK", "ASTOR", "BIMAS", "KCAER", "MGROS", "RGYAS", "THYAO", "TCELL", "YKBNK", "SISE",
]

BROKERS = {
    "brokers": [
        {
            "slug": "is-yatirim",
            "name": "İş Yatırım",
            "site_url": "https://www.isyatirim.com.tr",
            "enabled": True,
            "events_count": 14,
            "last_event_date": "2026-10-28",
        },
        {
            "slug": "gedik-yatirim",
            "name": "Gedik Yatırım",
            "site_url": "https://www.gedik.com",
            "enabled": True,
            "events_count": 9,
            "last_event_date": "2026-09-22",
        },
        {
            "slug": "yapi-kredi-yatirim",
            "name": "Yapı Kredi Yatırım",
            "site_url": "https://www.ykyatirim.com.tr",
            "enabled": True,
            "events_count": 1,
            "last_event_date": "2026-09-14",
        },
    ]
}

EVENTS = {"count": 2, "events": [IS_SAHOL_REMOVED, YK_VAKBN_REMOVED]}

GEDIK_PORTFOLIO = {
    "broker": {"slug": "gedik-yatirim", "name": "Gedik Yatırım", "site_url": "https://www.gedik.com"},
    "composition": {
        "as_of": "2026-10-29",
        "basis": "current",
        "items": [{"ticker": t, "entry_date": "2026-09-22"} for t in GEDIK_TICKERS],
    },
    "events": [],
}


class Tracker:
    """MockTransport handler: records requests, serves a route table."""

    def __init__(self) -> None:
        self.requests: list[httpx.Request] = []
        self.routes: dict[str, httpx.Response | Exception] = {
            "/brokers/": httpx.Response(200, json=BROKERS),
            "/brokers/model-portfolio/events": httpx.Response(200, json=EVENTS),
            "/brokers/gedik-yatirim/model-portfolio": httpx.Response(200, json=GEDIK_PORTFOLIO),
        }

    def __call__(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request)
        result = self.routes.get(request.url.path, httpx.Response(404, json={"detail": "x"}))
        if isinstance(result, Exception):
            raise result
        return result

    def calls(self, path: str) -> list[httpx.Request]:
        return [r for r in self.requests if r.url.path == path]


@pytest.fixture
def tracker(client: TestClient) -> Tracker:
    handler = Tracker()
    client.app.state.http_client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    client.app.dependency_overrides[get_settings] = lambda: Settings(
        api_secret_key="test-secret",
        tracker_api_url=TRACKER_BASE,
        tracker_api_key=TRACKER_KEY,
        tracker_timeout_seconds=5.0,
    )
    return handler


# --- happy paths ---------------------------------------------------------


def test_list_brokers(client: TestClient, tracker: Tracker):
    response = client.get("/v1/brokers")

    assert response.status_code == 200
    body = response.json()
    assert [b["slug"] for b in body["brokers"]] == [
        "is-yatirim", "gedik-yatirim", "yapi-kredi-yatirim",
    ]
    assert body["brokers"][0] == BROKERS["brokers"][0]
    (req,) = tracker.calls("/brokers/")
    assert req.headers["X-API-Key"] == TRACKER_KEY


def test_events_default_params_and_fields(client: TestClient, tracker: Tracker):
    response = client.get("/v1/brokers/model-portfolio/events")

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 2
    assert body["events"] == [IS_SAHOL_REMOVED, YK_VAKBN_REMOVED]  # order kept: newest first
    (req,) = tracker.calls("/brokers/model-portfolio/events")
    assert dict(req.url.params) == {"days": "90", "limit": "100"}
    assert req.headers["X-API-Key"] == TRACKER_KEY


def test_events_forwards_query_params(client: TestClient, tracker: Tracker):
    response = client.get(
        "/v1/brokers/model-portfolio/events",
        params={"days": 30, "broker": "is-yatirim", "limit": 5},
    )

    assert response.status_code == 200
    (req,) = tracker.calls("/brokers/model-portfolio/events")
    assert dict(req.url.params) == {"days": "30", "broker": "is-yatirim", "limit": "5"}


def test_broker_portfolio(client: TestClient, tracker: Tracker):
    response = client.get("/v1/brokers/gedik-yatirim")

    assert response.status_code == 200
    body = response.json()
    assert body == GEDIK_PORTFOLIO
    assert body["composition"]["as_of"] == "2026-10-29"
    assert len(body["composition"]["items"]) == 10
    assert len(tracker.calls("/brokers/gedik-yatirim/model-portfolio")) == 1


def test_broker_portfolio_without_composition(client: TestClient, tracker: Tracker):
    payload = {
        "broker": {"slug": "is-yatirim", "name": "İş Yatırım", "site_url": "https://www.isyatirim.com.tr"},
        "composition": None,
        "events": [IS_SAHOL_REMOVED],
    }
    tracker.routes["/brokers/is-yatirim/model-portfolio"] = httpx.Response(200, json=payload)

    response = client.get("/v1/brokers/is-yatirim")

    assert response.status_code == 200
    assert response.json() == payload


def test_events_route_not_captured_by_slug(client: TestClient, tracker: Tracker):
    response = client.get("/v1/brokers/model-portfolio/events")

    assert response.status_code == 200
    assert tracker.calls("/brokers/model-portfolio/model-portfolio") == []
    assert len(tracker.calls("/brokers/model-portfolio/events")) == 1


# --- cache ---------------------------------------------------------------


def test_events_cached_within_ttl(client: TestClient, tracker: Tracker):
    first = client.get("/v1/brokers/model-portfolio/events", params={"days": 90})
    second = client.get("/v1/brokers/model-portfolio/events", params={"days": 90})

    assert first.json() == second.json()
    assert len(tracker.calls("/brokers/model-portfolio/events")) == 1


def test_cache_keyed_by_query(client: TestClient, tracker: Tracker):
    client.get("/v1/brokers/model-portfolio/events", params={"days": 90})
    client.get("/v1/brokers/model-portfolio/events", params={"days": 30})
    client.get("/v1/brokers/model-portfolio/events", params={"days": 30, "broker": "is-yatirim"})

    assert len(tracker.calls("/brokers/model-portfolio/events")) == 3


def test_list_and_portfolio_cached(client: TestClient, tracker: Tracker):
    for _ in range(2):
        client.get("/v1/brokers")
        client.get("/v1/brokers/gedik-yatirim")

    assert len(tracker.calls("/brokers/")) == 1
    assert len(tracker.calls("/brokers/gedik-yatirim/model-portfolio")) == 1


def test_cache_expires_after_ttl(client: TestClient, tracker: Tracker, monkeypatch):
    import app.cache.memory as memory

    now = [1000.0]

    class FakeTime:  # patch the cache module only, not the global clock
        @staticmethod
        def monotonic() -> float:
            return now[0]

    monkeypatch.setattr(memory, "time", FakeTime)
    client.get("/v1/brokers")
    now[0] += 299
    client.get("/v1/brokers")
    now[0] += 2
    client.get("/v1/brokers")

    assert len(tracker.calls("/brokers/")) == 2


def test_errors_are_not_cached(client: TestClient, tracker: Tracker):
    tracker.routes["/brokers/"] = httpx.Response(500)
    assert client.get("/v1/brokers").status_code == 502
    tracker.routes["/brokers/"] = httpx.Response(200, json=BROKERS)
    assert client.get("/v1/brokers").status_code == 200


# --- upstream errors -----------------------------------------------------


def test_unknown_slug_maps_to_404(client: TestClient, tracker: Tracker):
    response = client.get("/v1/brokers/olmayan-kurum")

    assert response.status_code == 404
    assert response.json()["detail"] == "broker_not_found"


def test_unknown_broker_filter_maps_to_404(client: TestClient, tracker: Tracker):
    tracker.routes["/brokers/model-portfolio/events"] = httpx.Response(404, json={"detail": "x"})

    response = client.get("/v1/brokers/model-portfolio/events", params={"broker": "olmayan"})

    assert response.status_code == 404
    assert response.json()["detail"] == "broker_not_found"


def test_list_upstream_404_is_upstream_error(client: TestClient, tracker: Tracker):
    tracker.routes["/brokers/"] = httpx.Response(404)

    response = client.get("/v1/brokers")

    assert response.status_code == 502
    assert response.json()["detail"] == "tracker_upstream_error"


ROUTES = [
    ("/v1/brokers", "/brokers/"),
    ("/v1/brokers/model-portfolio/events", "/brokers/model-portfolio/events"),
    ("/v1/brokers/gedik-yatirim", "/brokers/gedik-yatirim/model-portfolio"),
]

UPSTREAM_FAILURES = {
    "http_500": httpx.Response(500, json={"detail": "boom"}),
    "timeout": httpx.ReadTimeout("timed out"),
    "connect_error": httpx.ConnectError("refused"),
    "not_json": httpx.Response(200, text="<html>bad gateway</html>"),
}


@pytest.mark.parametrize("route,upstream", ROUTES)
@pytest.mark.parametrize("failure", list(UPSTREAM_FAILURES))
def test_upstream_failures_map_to_502(
    client: TestClient, tracker: Tracker, route: str, upstream: str, failure: str
):
    tracker.routes[upstream] = UPSTREAM_FAILURES[failure]

    response = client.get(route)

    assert response.status_code == 502
    assert response.json()["detail"] == "tracker_upstream_error"


def _bad(mutate):
    payload = copy.deepcopy(EVENTS)
    mutate(payload["events"][0])
    return {"count": 2, "events": payload["events"]}


MALFORMED_EVENTS = {
    "unknown_action": _bad(lambda e: e.update(action="bought")),
    "missing_ticker": _bad(lambda e: e.pop("ticker")),
    "bad_date": _bad(lambda e: e.update(event_date="28.10.2026")),
    "quote_too_long": _bad(lambda e: e.update(reason_quote="x" * 301)),
    "missing_document": _bad(lambda e: e.pop("document")),
    "events_not_list": {"count": 1, "events": {"id": 1}},
    "list_instead_of_object": [IS_SAHOL_REMOVED],
}


@pytest.mark.parametrize("case", list(MALFORMED_EVENTS))
def test_malformed_events_payload_maps_to_502(client: TestClient, tracker: Tracker, case: str):
    tracker.routes["/brokers/model-portfolio/events"] = httpx.Response(
        200, json=MALFORMED_EVENTS[case]
    )

    response = client.get("/v1/brokers/model-portfolio/events")

    assert response.status_code == 502
    assert response.json()["detail"] == "tracker_upstream_error"


def test_malformed_portfolio_payload_maps_to_502(client: TestClient, tracker: Tracker):
    bad = copy.deepcopy(GEDIK_PORTFOLIO)
    del bad["composition"]["as_of"]
    tracker.routes["/brokers/gedik-yatirim/model-portfolio"] = httpx.Response(200, json=bad)

    response = client.get("/v1/brokers/gedik-yatirim")

    assert response.status_code == 502


# --- request validation --------------------------------------------------


@pytest.mark.parametrize(
    "params",
    [
        {"days": 0},
        {"days": 3651},
        {"limit": 0},
        {"limit": 501},
        {"broker": "Is_Yatirim"},
        {"broker": "a" * 41},
        {"days": "abc"},
    ],
)
def test_events_query_validation(client: TestClient, tracker: Tracker, params):
    response = client.get("/v1/brokers/model-portfolio/events", params=params)

    assert response.status_code == 422
    assert tracker.requests == []


def test_events_query_bounds_accepted(client: TestClient, tracker: Tracker):
    for params in ({"days": 1, "limit": 1}, {"days": 3650, "limit": 500}):
        assert client.get("/v1/brokers/model-portfolio/events", params=params).status_code == 200


def test_slug_validation(client: TestClient, tracker: Tracker):
    response = client.get("/v1/brokers/Gedik_Yatirim")

    assert response.status_code == 422
    assert tracker.requests == []


def test_requires_api_key(client: TestClient, tracker: Tracker):
    response = client.get("/v1/brokers", headers={"X-API-Key": "wrong"})

    assert response.status_code == 401
    assert tracker.requests == []
