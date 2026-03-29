"""
API endpoint tests for /v1/quotes/*.
Uses TestClient with mocked QuoteService — tests routing and response shape.
"""
import pytest
from fastapi.testclient import TestClient


def test_get_quote_returns_200(client: TestClient):
    resp = client.get("/v1/quotes/USD-TRY")
    assert resp.status_code == 200
    body = resp.json()
    assert body["data"]["symbol"] == "USD/TRY"
    assert body["data"]["category"] == "fx"
    assert body["meta"]["provider"] == "fmp"
    assert body["meta"]["is_live"] is True


def test_get_quote_unknown_symbol_returns_404(client: TestClient):
    resp = client.get("/v1/quotes/FAKE-XYZ")
    assert resp.status_code == 404


def test_get_quote_response_has_meta_fields(client: TestClient):
    resp = client.get("/v1/quotes/USD-TRY")
    meta = resp.json()["meta"]
    assert "provider" in meta
    assert "is_live" in meta
    assert "fetched_at" in meta


def test_batch_endpoint_returns_list(client: TestClient):
    resp = client.post("/v1/quotes/batch", json=["USD-TRY", "EUR-TRY"])
    assert resp.status_code == 200
    body = resp.json()
    assert "quotes" in body
    assert "errors" in body


def test_health_returns_ok(client: TestClient):
    resp = client.get("/v1/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_market_overview_returns_list(client: TestClient):
    resp = client.get("/v1/market/overview")
    assert resp.status_code == 200
    assert "quotes" in resp.json()
