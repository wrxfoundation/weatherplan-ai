/**
 * chronicle-mcp — 공개 원장 위의 MCP 질의 표면 (stdio JSON-RPC 2.0).
 *
 * 에이전트가 원장을 통째로 떠가는 대신 호출하게 만든다 — 그 순간 "떠가는
 * 대상"이 "고객"이 된다. 무상태: 공개 raw 원장을 매 질의 읽고, 신뢰가
 * 필요하면 verify_source가 제네시스부터 재계산한다.
 *
 * 실행: npm run mcp   (CHRONICLE_REPO=owner/repo 로 대상 지정, 기본 kwangdol-star/aiagentlabs)
 *       CHRONICLE_DATA_DIR=... 로 로컬 원장 지정 가능
 *
 * MCP 프로토콜은 개행 구분 JSON-RPC(stdio)다. handleRpc는 순수 함수라
 * 전송 없이 테스트된다.
 */
import { createInterface } from "node:readline";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dispatch } from "./tools.js";
import { localLedger, remoteLedger, type Ledger } from "./ledger.js";

const DEFAULT_PROTOCOL = "2024-11-05";

export const TOOLS = [
  {
    name: "list_sources",
    description:
      "추적 중인 모든 소스와 현황(레코드 수·봉인 이벤트 수·체인 머리·최신 관측)을 나열한다.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_record",
    description: "한 엔티티의 현재 상태(마지막으로 관측된 필드)를 반환한다.",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string", description: "소스 id (예: deal-audit-ledger)" },
        entity_id: { type: "string", description: "엔티티 id (예: deal:11680:20260615:…)" },
      },
      required: ["source", "entity_id"],
      additionalProperties: false,
    },
  },
  {
    name: "get_history",
    description:
      "한 엔티티가 언제 어떻게 바뀌었는지 전체 변경 이력(생성·필드변경·삭제)을 시간순으로 반환한다 — 소급 불가능한 시간해자를 질의로 노출. 예: 이 실거래가 취소·정정된 적 있는가.",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string" },
        entity_id: { type: "string" },
      },
      required: ["source", "entity_id"],
      additionalProperties: false,
    },
  },
  {
    name: "get_changes",
    description: "소스의 최근 변경 이벤트를 시간 필터와 함께 반환한다 (since/until은 ISO 8601, field로 특정 필드만).",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string" },
        since: { type: "string", description: "이 시각 이후 (ISO 8601)" },
        until: { type: "string", description: "이 시각 이전 (ISO 8601)" },
        field: { type: "string", description: "특정 필드명만 (예: LTTOT_TOP_AMOUNT)" },
        limit: { type: "number", description: "최대 반환 건수 (기본 50, 최대 500)" },
      },
      required: ["source"],
      additionalProperties: false,
    },
  },
  {
    name: "verify_source",
    description:
      "소스의 해시체인을 제네시스부터 전 줄 재계산해 무결성을 검증한다 — 신뢰를 요구하지 않고 호출로 확인. 변조·단절이 있으면 ok=false와 사유를 반환.",
    inputSchema: {
      type: "object",
      properties: { source: { type: "string" } },
      required: ["source"],
      additionalProperties: false,
    },
  },
];

interface RpcRequest {
  jsonrpc?: string;
  id?: string | number;
  method?: string;
  params?: Record<string, unknown>;
}

/** 순수 디스패처 — 요청 하나를 처리해 응답(또는 알림이면 null)을 돌려준다. */
export async function handleRpc(request: RpcRequest, ledger: Ledger): Promise<object | null> {
  const { id, method, params } = request;

  if (method === "initialize") {
    const requested = typeof params?.protocolVersion === "string" ? params.protocolVersion : DEFAULT_PROTOCOL;
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: requested,
        capabilities: { tools: {} },
        serverInfo: { name: "chronicle-mcp", version: "0.1.0" },
      },
    };
  }

  if (method?.startsWith("notifications/")) return null;

  if (method === "tools/list") {
    return { jsonrpc: "2.0", id, result: { tools: TOOLS } };
  }

  if (method === "tools/call") {
    const name = typeof params?.name === "string" ? params.name : "";
    const args = (params?.arguments as Record<string, unknown> | undefined) ?? {};
    try {
      const data = await dispatch(name, args, ledger);
      return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] } };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: `오류: ${message}` }], isError: true } };
    }
  }

  if (id === undefined) return null; // 알림
  return { jsonrpc: "2.0", id, error: { code: -32601, message: `메서드 없음: ${method}` } };
}

function makeLedger(): Ledger {
  const dataDir = process.env.CHRONICLE_DATA_DIR;
  if (dataDir) return localLedger(resolve(dataDir));
  return remoteLedger(process.env.CHRONICLE_REPO ?? "kwangdol-star/aiagentlabs");
}

const isCliEntry = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCliEntry) {
  const ledger = makeLedger();
  const rl = createInterface({ input: process.stdin });
  for await (const line of rl) {
    if (line.trim() === "") continue;
    let request: RpcRequest;
    try {
      request = JSON.parse(line) as RpcRequest;
    } catch {
      continue; // 파싱 불가 줄은 무시
    }
    const response = await handleRpc(request, ledger);
    if (response) process.stdout.write(`${JSON.stringify(response)}\n`);
  }
}
