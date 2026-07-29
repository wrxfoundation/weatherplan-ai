"""Machine-actionable API errors — the caller is an autonomous agent, not a human on a browser page.
Starlette's default 404/405 are text/plain dead-ends; ours are JSON with the NEXT ACTION (catalog at /,
spec at /openapi.json), so an agent (or an agent spawned by an agent) self-corrects instead of failing."""

from __future__ import annotations

from starlette.testclient import TestClient

from koreaapi.api import app


def test_unknown_endpoint_returns_json_with_next_action():
    r = TestClient(app).get("/v1/does-not-exist")
    assert r.status_code == 404
    body = r.json()
    assert "/v1/does-not-exist" in body["error"]
    assert "openapi.json" in body["hint"]                      # the self-correcting pointer
    assert any("agents.json" in s for s in body["see"])        # the machine manifest


def test_wrong_method_returns_json_405():
    r = TestClient(app).post("/v1/certified")
    assert r.status_code == 405
    assert "GET" in r.json()["hint"]                            # tells the agent the right verb


def test_cache_headers_for_agent_fleets():
    # Verified facts change on a daily cadence -> short public max-age; metered/billing/health never cache.
    c = TestClient(app)
    assert c.get("/v1/certified").headers["cache-control"] == "public, max-age=300"
    assert c.get("/healthz").headers["cache-control"] == "no-store"
    assert c.get("/v1/does-not-exist").headers.get("cache-control") is None  # errors are not cacheable
    assert c.get("/v1/buy-options/artist:bts").headers["cache-control"] == "no-store"  # buy-INTENT signal


def test_mcp_is_mounted_over_streamable_http():
    # The SAME MCP tools, served over a URL: any MCP client pointed at https://<host>/mcp gets the
    # full toolset with no install and no API key. The `with` runs the app lifespan — the MCP
    # session manager requires it (a plain TestClient(app).post would die before routing).
    with TestClient(app) as c:
        r = c.post("/mcp/", json={"jsonrpc": "2.0", "id": 1, "method": "initialize",
                                  "params": {"protocolVersion": "2025-03-26", "capabilities": {},
                                             "clientInfo": {"name": "probe", "version": "0"}}},
                   headers={"Accept": "application/json, text/event-stream"})
        assert r.status_code == 200
        assert r.headers.get("mcp-session-id")       # a real MCP session opened over the mount
        assert '"name":"koreaapi"' in r.text          # ... served by OUR server, not a stub
        # a session-less follow-up is a protocol-level JSON-RPC error, not a Starlette 404
        r2 = c.post("/mcp/", json={"jsonrpc": "2.0", "id": 2, "method": "tools/list"},
                    headers={"Accept": "application/json, text/event-stream"})
        assert r2.status_code == 400 and "jsonrpc" in r2.text
        # and the REST surface keeps working side-by-side with the mount + its lifespan
        assert c.get("/v1/certified").status_code == 200



if __name__ == "__main__":
    import pytest

    raise SystemExit(pytest.main([__file__, "-q"]))
