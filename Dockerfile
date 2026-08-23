# KoreaAPI — the agent-facing endpoint: REST (x402 + verified-data + resolve) AND the MCP server,
# from ONE process. Works on any Docker host (Railway / Render / Fly / Cloud Run). The container
# hydrates its DB from the published open data at boot (see deploy/start.sh), then serves:
#   https://<host>/                        REST + the endpoint catalog
#   https://<host>/mcp                     MCP over Streamable HTTP — point any MCP client here
#   https://<host>/.well-known/agent.json  the manifest, with THIS host's URLs resolved
# (A standalone MCP-only process still works — MCP_TRANSPORT=http python -m koreaapi.server — but is
# no longer needed: the mount serves the same tools in the same container.)
FROM python:3.11-slim
WORKDIR /app
RUN pip install --no-cache-dir uv
COPY pyproject.toml uv.lock ./
COPY src ./src
RUN uv sync --frozen --extra web
COPY deploy/start.sh ./deploy/start.sh
ENV PYTHONPATH=/app/src \
    KOREAAPI_DB=/app/koreaapi.db \
    KOREAAPI_DATA_URL=https://aiagentlabs.co.kr/latest.json \
    PORT=8000
EXPOSE 8000
CMD ["sh", "deploy/start.sh"]
