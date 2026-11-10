// 상담 신청 (2026-11-06 랜딩 요청 5-4) — /consult 에서 로그인 없이 받고, 관제 화면 '상담 신청'에서 처리한다.
// 화면 · 서버 공용 (비밀 값 없음). 저장은 Supabase 의 consults 표 (supabase/consults.sql).
//
// 정한 것:
//   · 받는 값은 이름 · 연락처(휴대폰) · 신청자 구분(보호자 / 어르신 본인) · 동의. 파트너 추천 링크(?ref=)로 오면 추천 코드도 같이 남긴다.
//   · 겹친 접수 — 같은 연락처 · 같은 신청자 구분으로 '새 접수'가 이미 있으면 새로 쌓지 않는다 (다시 신청한 횟수와 시각만 올린다).
//     관제가 '연락함' · '상담 종료'로 넘긴 뒤에 다시 신청하면 새 접수로 받는다.
//   · 상담 종료 — 이름과 연락처를 지운다 (화면 약속: "상담이 끝나면 파기합니다"). 되돌릴 수 없다.
//     남는 것은 접수 시각 · 신청자 구분 · 추천 코드 · 처리한 사람 · 처리 시각뿐이다.

export const CONSULT_WHO = { guardian: "보호자", elder: "어르신 본인" };
export const CONSULT_STATUS = {
  new: { label: "새 접수", tone: "warn" },
  contacted: { label: "연락함", tone: "info" },
  done: { label: "상담 종료", tone: "muted" },
};
// 관제가 바꿀 수 있는 다음 상태 — 종료는 이름 · 연락처를 지우므로 되돌리지 못한다
export const CONSULT_NEXT = { new: ["contacted", "done"], contacted: ["done", "new"], done: [] };

export const phoneDigits = (v) => String(v || "").replace(/\D/g, "");
// 휴대폰 — 010 · 011 · 016 · 017 · 018 · 019 로 시작하는 10~11자리
export const isMobile = (v) => /^01[016789]\d{7,8}$/.test(phoneDigits(v));
export function fmtPhone(v) {
  const d = phoneDigits(v);
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return d;
}
// 추천 코드 — lib/sales.js isRepCode 와 같은 모양 (S-0012 · S-아이디). 모양이 다르면 버린다
const REF_RE = /^S-(\d{4}|[A-Z][A-Z0-9._-]{3,19})$/;
export const cleanRef = (v) => {
  const s = String(v || "").trim().toUpperCase();
  return REF_RE.test(s) ? s : null;
};
const cleanName = (v) => String(v || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();

// 양식 확인 — { fields: { 칸: 안내 }, value } . fields 가 비어 있으면 통과
export function checkConsult(body) {
  const b = body && typeof body === "object" ? body : {};
  const fields = {};
  const name = cleanName(b.name);
  if (name.length < 2) fields.name = "이름을 2자 이상 적어 주세요";
  else if (name.length > 40) fields.name = "이름은 40자까지 적을 수 있습니다";
  if (!phoneDigits(b.phone)) fields.phone = "연락처를 적어 주세요";
  else if (!isMobile(b.phone)) fields.phone = "휴대폰 번호를 확인해 주세요 (예: 010-0000-0000)";
  const who = Object.prototype.hasOwnProperty.call(CONSULT_WHO, b.who) ? b.who : null;
  if (!who) fields.who = "누가 신청하시는지 골라 주세요";
  if (b.agree !== true) fields.agree = "개인정보 수집에 동의해 주세요";
  return { fields, value: { name, phone: phoneDigits(b.phone), who, ref: cleanRef(b.ref) } };
}

const COLS = "id, created_at, name, phone, who, ref, status, again_count, again_at, handled_by, handled_at";
const errOf = (error, status) => Object.assign(error, { status });

// 접수 저장 — { duplicate } . 같은 연락처 · 신청자 구분의 '새 접수'가 있으면 그 줄에 다시 신청한 것만 적는다.
// 표의 고유 색인(consults_open_key)이 동시에 들어온 두 요청도 한 줄로 막는다 (23505 → 겹친 접수).
export async function addConsult(client, v, now = new Date()) {
  const open = () => client.from("consults").select("id, again_count").eq("phone", v.phone).eq("who", v.who).eq("status", "new").limit(1);
  const bump = async (row) => {
    const { error, status } = await client
      .from("consults")
      .update({ again_count: (row.again_count || 0) + 1, again_at: now.toISOString() })
      .eq("id", row.id);
    if (error) throw errOf(error, status);
    return { duplicate: true };
  };
  const first = await open();
  if (first.error) throw errOf(first.error, first.status);
  if (first.data?.[0]) return bump(first.data[0]);
  const ins = await client.from("consults").insert({ name: v.name, phone: v.phone, who: v.who, ref: v.ref });
  if (!ins.error) return { duplicate: false };
  if (String(ins.error.code) !== "23505") throw errOf(ins.error, ins.status);
  const again = await open();
  if (again.error) throw errOf(again.error, again.status);
  return again.data?.[0] ? bump(again.data[0]) : { duplicate: true };
}

// 관제 목록 — 최근 200건
export async function listConsults(client) {
  const { data, error, status } = await client.from("consults").select(COLS).order("created_at", { ascending: false }).limit(200);
  if (error) throw errOf(error, status);
  return data || [];
}

// 처리 상태 바꾸기 — { ok, row } | { error }. 종료로 바꾸면 이름 · 연락처를 지운다
export async function setConsultStatus(client, id, next, by, now = new Date()) {
  const cur = await client.from("consults").select("id, status").eq("id", id).limit(1);
  if (cur.error) throw errOf(cur.error, cur.status);
  const row = cur.data?.[0];
  if (!row) return { error: "not-found" };
  if (!(CONSULT_NEXT[row.status] || []).includes(next)) return { error: "bad-state" };
  const patch = { status: next, handled_by: next === "new" ? null : by, handled_at: next === "new" ? null : now.toISOString() };
  if (next === "done") Object.assign(patch, { name: null, phone: null });
  // 그사이 다른 관제가 먼저 바꿨으면 건드리지 않는다 (status 를 같이 건다)
  const up = await client.from("consults").update(patch).eq("id", id).eq("status", row.status).select(COLS);
  if (up.error) {
    // '새 접수'로 되돌리는데 같은 연락처의 새 접수가 그사이 들어왔다
    if (String(up.error.code) === "23505") return { error: "open-exists" };
    throw errOf(up.error, up.status);
  }
  if (!up.data?.[0]) return { error: "bad-state" };
  return { ok: true, row: up.data[0] };
}

// 관제 화면으로 내보내는 한 줄
export const consultView = (r) => ({
  id: r.id,
  createdAt: r.created_at,
  name: r.name || null,
  phone: r.phone ? fmtPhone(r.phone) : null,
  who: r.who,
  ref: r.ref || null,
  status: r.status,
  againCount: r.again_count || 0,
  againAt: r.again_at || null,
  handledBy: r.handled_by || null,
  handledAt: r.handled_at || null,
});
