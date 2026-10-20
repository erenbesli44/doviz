"""
Guards for the X-API-Key middleware: protected routes reject a missing key,
the health endpoint stays open.
"""
from fastapi.testclient import TestClient


def test_protected_route_without_api_key_returns_401(client: TestClient):
    resp = client.get("/v1/quotes/USD-TRY", headers={"X-API-Key": ""})
    assert resp.status_code == 401


def test_health_without_api_key_returns_200(client: TestClient):
    resp = client.get("/v1/health", headers={"X-API-Key": ""})
    assert resp.status_code == 200
