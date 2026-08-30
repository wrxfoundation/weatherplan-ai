/* CS 저장소 (8/30 서우 — "cs 분류 및 처리 saas급으로")

   Vercel 프로젝트에 KV(Upstash Redis)를 연결하면 KV_REST_API_URL·KV_REST_API_TOKEN 이
   자동으로 주입된다. 서우가 키를 복사해 옮길 일이 없다 — Supabase 를 쓰면 계정·프로젝트·
   테이블·키까지 손으로 거쳐야 해서 그 마찰만큼 늦어진다.

   SDK 를 쓰지 않고 REST 로 직접 부른다. 의존성이 늘지 않고 버전이 어긋날 일도 없다 —
   이 프로젝트는 지금도 fetch 하나로 텔레그램과 정본을 다 다루고 있다.

   저장소가 없으면 인메모리로 떨어진다. 서버리스라 인스턴스가 재활용되는 동안만 남고
   신뢰할 수 없지만, KV 를 붙이기 전에도 화면이 뜨고 흐름을 확인할 수 있다.
   /api/health 의 store 값이 "kv" 인지 "memory" 인지로 어느 쪽인지 알 수 있다. */

/* Vercel 이 KV 를 연결하면 환경변수가 자동으로 붙는데, 통합 경로에 따라 이름이 갈린다 —
   Vercel KV 로 붙으면 KV_REST_API_*, Upstash 마켓플레이스로 붙으면 UPSTASH_REDIS_REST_* 다.
   어느 쪽이 오든 받는다. 이름 하나를 못 맞춰 저장이 안 되는 건 알아채기도 어렵다. */
const pick = (...names: string[]) => {
  for (const n of names) { const v = process.env[n]; if (v) return { v, n }; }
  return { v: "", n: "" };
};
const U = pick("KV_REST_API_URL", "UPSTASH_REDIS_REST_URL");
const T = pick("KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN");
const URL_ = U.v, TOKEN = T.v;

export const storeKind = () => (URL_ && TOKEN ? "kv" : "memory");
/* 어떤 이름으로 붙었는지 첫 화면에 보여 준다 — 붙었는데 안 된다면 이름부터 의심한다 */
export const storeVars = () => (URL_ && TOKEN ? `${U.n} · ${T.n}` : "");

const HASH = "cs:items";
/* 왕복 확인 전용 키. 기록(cs:items)과 섞이지 않게 따로 둔다. */
const PROBE = "cs:probe";

export type CsStatus = "new" | "doing" | "done" | "faq";
export type CsMood = "question" | "positive" | "negative";

export type CsItem = {
  id: string;
  at: number;            // epoch ms
  text: string;
  topic: string;
  mood: CsMood;
  lang: string;
  who: string;
  chatType: string;
  /* matched = 후보를 보여준 것. 답한 것은 아니다 — 사용자가 하나를 누르면 done 이 된다 */
  kind: "unanswered" | "offline" | "matched";
  status: CsStatus;
  sev?: "high" | "mid" | "low";   // 긴급도 — 옛 기록에는 없을 수 있어 선택
  /* 답장을 보내려면 어디로 보낼지 알아야 한다. 텔레그램 내부 식별자라 저장소에만 두고
     CSV·JSON 내보내기에는 싣지 않는다 — 표에 있어 봐야 쓸 데가 없고 새어 나갈 자리만 는다. */
  chatId?: number;
  phase?: string;        // 문의가 들어온 시점의 판매 단계
  note?: string;         // 처리 메모 / 확정한 답변
  repliedAt?: number;    // 답장을 보낸 시각
  /* 닫힌 시각. 처리 시간을 재려면 있어야 한다 — 답장 없이 상태만 바꿔 닫는 경우가 많고,
     그때는 repliedAt 이 비어서 얼마나 걸렸는지 알 길이 없었다. 다시 열면 지운다. */
  closedAt?: number;
  /* 자동 분류를 손으로 고쳤는지. 고친 건 다시 자동값으로 덮지 않고, 리포트에서
     "분류가 얼마나 맞았나"를 볼 때도 이 표시로 가른다. */
  fixed?: boolean;
};

/* ── Upstash REST ─────────────────────────────────────────────────────────
   명령을 JSON 배열로 POST 한다: ["HSET","cs:items","<id>","<json>"] */
const cmd = async (...args: (string | number)[]): Promise<unknown> => {
  const res = await fetch(URL_, {
    method: "POST",
    headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`kv ${res.status}`);
  const j = (await res.json()) as { result?: unknown };
  return j.result;
};

/* 실제로 되는지 확인한다. 환경변수가 있다고 저장이 되는 건 아니다 — 토큰이 read-only
   이거나(연결 화면에 READ_ONLY_TOKEN 도 같이 뜬다) URL 이 다른 DB 를 가리켜도 화면에는
   "연결됨" 으로 보이고, 쓰기 실패는 웹훅이 200 을 돌려주는 사이에 조용히 묻힌다.
   그래서 전용 키에 한 번 쓰고, 읽어서 같은 값인지 보고, 지운다. 60초 만료를 걸어 두어
   지우기가 실패해도 쓰레기가 남지 않는다. */
export const storeProbe = async (): Promise<{ ok: boolean; note: string; ms: number }> => {
  const t0 = Date.now();
  if (storeKind() === "memory") return { ok: false, note: "memory", ms: 0 };
  const mark = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    await cmd("SET", PROBE, mark, "EX", 60);
    const back = (await cmd("GET", PROBE)) as string | null;
    await cmd("DEL", PROBE);
    /* 쓰기는 200 인데 값이 안 돌아오면 URL 이 다른 DB 를 보고 있다는 뜻이다 */
    if (back !== mark) return { ok: false, note: "readback_mismatch", ms: Date.now() - t0 };
    return { ok: true, note: "ok", ms: Date.now() - t0 };
  } catch (e) {
    /* cmd 가 던지는 "kv 401"·"kv 403" 은 토큰, "kv 404" 는 URL 이 원인이다 */
    return { ok: false, note: (e as Error).message || "network", ms: Date.now() - t0 };
  }
};

/* 인메모리 폴백. globalThis 에 붙이는 이유가 있다 — 모듈 스코프에 두면 라우트마다
   따로 평가돼서 웹훅이 넣은 것을 대시보드가 못 본다(실제로 0건이 떴다).
   그래도 인스턴스가 재활용되는 동안만 남는 임시 저장이다. KV 를 붙이기 전 확인용이다. */
const mem: Map<string, CsItem> =
  ((globalThis as { __csMem?: Map<string, CsItem> }).__csMem ??= new Map());

export const putItem = async (item: CsItem) => {
  if (storeKind() === "memory") { mem.set(item.id, item); return; }
  await cmd("HSET", HASH, item.id, JSON.stringify(item));
};

export const listItems = async (): Promise<CsItem[]> => {
  if (storeKind() === "memory") return [...mem.values()].sort((a, b) => b.at - a.at);
  /* HGETALL 은 [field, value, field, value, …] 로 온다 */
  const flat = (await cmd("HGETALL", HASH)) as string[] | null;
  if (!Array.isArray(flat)) return [];
  const out: CsItem[] = [];
  for (let i = 1; i < flat.length; i += 2) {
    try { out.push(JSON.parse(flat[i]) as CsItem); } catch { /* 깨진 항목은 건너뛴다 */ }
  }
  return out.sort((a, b) => b.at - a.at);
};

export const getItem = async (id: string): Promise<CsItem | null> => {
  if (storeKind() === "memory") return mem.get(id) ?? null;
  const v = (await cmd("HGET", HASH, id)) as string | null;
  if (!v) return null;
  try { return JSON.parse(v) as CsItem; } catch { return null; }
};

/* 지우기. 되돌릴 수 없어서 화면에서 두 번 묻고 부른다.
   실전 지표에 시험 기록이 섞이면 "어디가 막히는지" 를 볼 수 없게 된다 — 그걸 걷어내는 용도다. */
export const delItems = async (ids: string[]): Promise<number> => {
  if (!ids.length) return 0;
  if (storeKind() === "memory") return ids.filter((id) => mem.delete(id)).length;
  /* HDEL 은 지운 개수를 돌려준다 */
  return Number(await cmd("HDEL", HASH, ...ids)) || 0;
};

/* 상태·종류·메모만 바꾼다. 원문과 분류는 기록이라 덮어쓰지 않는다. */
export const patchItem = async (
  id: string,
  patch: Partial<Pick<CsItem, "status" | "note" | "kind" | "repliedAt" | "closedAt" | "topic" | "sev" | "fixed">>,
) => {
  const cur = await getItem(id);
  if (!cur) return null;
  const next = { ...cur, ...patch };
  await putItem(next);
  return next;
};

/* 짧은 정렬 가능 id — 시각이 앞에 오므로 문자열 정렬이 곧 시간순이다 */
export const newId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
