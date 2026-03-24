import json
import os
import urllib.error
import urllib.request


LIVE_BASE_URL = os.getenv("URUTI_LIVE_BASE_URL", "http://173.249.25.80:1199")


def _get(path: str):
    req = urllib.request.Request(f"{LIVE_BASE_URL}{path}", method="GET")
    with urllib.request.urlopen(req, timeout=12) as resp:
        body = resp.read().decode("utf-8")
        return resp.status, body, dict(resp.headers)


def test_live_health_endpoint_returns_healthy() -> None:
    status, body, _ = _get("/health")
    payload = json.loads(body)

    assert status == 200
    assert payload["status"] == "healthy"
    assert "version" in payload


def test_live_root_endpoint_has_docs_pointer() -> None:
    status, body, _ = _get("/")
    payload = json.loads(body)

    assert status == 200
    assert payload["docs"] == "/docs"
    assert "message" in payload


def test_live_auth_login_get_is_not_allowed() -> None:
    req = urllib.request.Request(
        f"{LIVE_BASE_URL}/api/v1/auth/login",
        method="GET",
    )
    try:
        urllib.request.urlopen(req, timeout=12)
    except urllib.error.HTTPError as exc:
        assert exc.code in {405, 422}
        return

    raise AssertionError("Expected 405/422 for GET on login endpoint")
