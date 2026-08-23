"""Endpoint discovery — what an agent platform / marketplace / agent OS actually probes.

The canonical manifest lives on the static Pages site, but the LIVE host is what implements REST +
MCP, and it answered 404 at `/.well-known/agent.json`. Now it serves the manifest itself, with the
URLs resolved to THIS deployment (the static copy can only name a documented pattern), so "give us
your endpoint" has one correct answer: `https://<host>/.well-known/agent.json`.
"""

from __future__ import annotations

from starlette.testclient import TestClient

from koreaapi.api import app


def test_wellknown_and_agents_json_are_served_by_the_live_host():
    c = TestClient(app)
    a, b = c.get("/.well-known/agent.json"), c.get("/agents.json")
    assert a.status_code == 200 and b.status_code == 200
    assert a.json() == b.json()                       # one manifest, two conventional paths
    man = a.json()
    assert man["name"] == "KoreaAPI" and man["served_by"] == "koreaapi-api"
    assert man["trust_model"]["basis"] == "verification, not brand"   # the differentiator survives
    assert any(t["name"] == "get_verified" for t in man["mcp"]["tools"])
    assert man["autonomous_use"]["allowed"] is True   # the agent-economy terms travel with it


def test_manifest_urls_point_at_this_deployment():
    # The static copy can only document a pattern; the live host must hand back CONNECTABLE URLs.
    c = TestClient(app, base_url="https://api.example.test")
    man = c.get("/.well-known/agent.json").json()
    assert man["mcp"]["http"]["url"] == "https://api.example.test/mcp"
    assert man["mcp"]["http"]["transport"] == "streamable-http"
    assert man["api"]["base_url"] == "https://api.example.test"
    assert man["api"]["openapi"] == "https://api.example.test/openapi.json"
    # and that MCP URL is real, not aspirational: the mount answers the protocol there
    with TestClient(app, base_url="https://api.example.test") as live:
        r = live.post("/mcp/", json={"jsonrpc": "2.0", "id": 1, "method": "initialize",
                                     "params": {"protocolVersion": "2025-03-26", "capabilities": {},
                                                "clientInfo": {"name": "probe", "version": "0"}}},
                      headers={"Accept": "application/json, text/event-stream"})
        assert r.status_code == 200 and r.headers.get("mcp-session-id")


def test_index_catalog_advertises_both_protocols():
    free = TestClient(app).get("/").json()["free"]     # both lanes are free — listed with the rest
    assert any("/mcp" in k for k in free)
    assert any("agent.json" in k for k in free)


def test_deploy_artifacts_describe_the_dual_protocol_endpoint():
    # A stale deploy comment is a real cost here: it tells an operator to run a SECOND process for
    # MCP that the mount already serves. Pin the corrected story in the shipped artifacts.
    import os
    repo = os.path.join(os.path.dirname(__file__), "..")
    docker = open(os.path.join(repo, "Dockerfile"), encoding="utf-8").read()
    render = open(os.path.join(repo, "render.yaml"), encoding="utf-8").read()
    api_md = open(os.path.join(repo, "API.md"), encoding="utf-8").read()
    for text, label in ((docker, "Dockerfile"), (render, "render.yaml"), (api_md, "API.md")):
        assert "/mcp" in text, f"{label} does not mention the mounted MCP endpoint"
        assert "agent.json" in text, f"{label} does not mention the discovery manifest"


if __name__ == "__main__":
    import pytest

    raise SystemExit(pytest.main([__file__, "-q"]))
