// 가구 기록에 서버가 직접 동작을 넣는다 (2026-11-18) — 화면과 같은 규칙(lib/state.js reducer)으로.
// 결제 서버(lib/pay-server.js applyPaidToHousehold)와 같은 방식이다: 읽고 → 동작을 얹고 → 버전이 그대로일 때만 저장. 그 사이
// 다른 폰이 저장했으면 다시 읽어 넣는다. 서버(API 라우트)에서만 쓴다.
// 돌려주는 값: true(넣음) · false(가구 기록이 아직 없거나 계속 엇갈림)
import { db } from "./db";
import { applyToServerState } from "./state";

export async function applyToHousehold(household, actions, by, client = db()) {
  if (!household || !Array.isArray(actions) || !actions.length) return false;
  for (let i = 0; i < 4; i++) {
    const { data, error } = await client.from("households").select("state,version").eq("id", household).maybeSingle();
    if (error) throw error;
    const raw = data?.state;
    if (!raw || typeof raw !== "object") return false;
    const next = applyToServerState(raw, household, actions);
    const { data: upd, error: e2 } = await client
      .from("households")
      .update({ state: next, version: (data.version || 0) + 1, updated_at: new Date().toISOString(), updated_by: String(by || "서버").slice(0, 120) })
      .eq("id", household)
      .eq("version", data.version || 0)
      .select("version");
    if (e2) throw e2;
    if (upd && upd.length) return true;
  }
  return false;
}
