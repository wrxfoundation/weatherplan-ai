// 관제 센터 회원 · 권한 — 실제 (2026-10-06). 그 센터 관제(ops1 · ops2 · ops3 또는 승인된 관제 회원)만 본다.
//  · 센터 가입 코드와 가입 링크 — 직원(현장 · 영업 · 관제)용. 코드를 바꾸면 옛 코드는 바로 막힌다.
//    어르신 · 보호자는 가족마다 따로 있는 가족 가입 코드로 가입한다 (2026-11-12 · 가족 관리 · lib/families.js).
//    서버 표에 가족 칸이 아직 없으면(families.sql 실행 전) 예전처럼 센터 코드 하나로 모두 가입하고 한 가족으로 보인다
//  · 회원마다 어느 가족인지 보이고, 어르신 · 보호자는 [가족 옮기기]로 그 센터의 다른 가족으로 옮긴다
//  · 승인 대기 — 모든 가입 신청을 승인(역할을 바꿔 승인할 수도) · 거절
//  · 회원 목록 — 역할 부여 · 정지 · 다시 사용 · 삭제(센터 관리자만 · 되돌릴 수 없어 한 번 묻는다 · 2026-11-12 요청).
//    자기 계정과 테스트 계정은 바꾸지 않는다
//  · 권한 변경 기록 — 누가 언제 무엇을 (지우지 않는다)
// 아래쪽 기존 '계정·권한'(권한 매트릭스)은 운영 설계 예시다.
import { useCallback, useEffect, useState } from "react";
import { Btn, Confirm, Empty, Note, Panel, PanelHead, Pill, Stat, Table } from "./ui";
import { useAuth } from "../../lib/auth";
import { ALL_ROLES, AREAS, CENTERS, MEMBER_STATUS, areaOfRole } from "../../lib/centers";
import { ROLE_LABEL } from "../../lib/test-accounts";
import { fmtDateTime } from "../../lib/ops-time";

const ERR = {
  "schema-missing": "서버 표가 아직 없습니다 — supabase/schema.sql 을 다시 실행해야 합니다 (DEPLOY.md 4-2).",
  "db-not-configured": "서버 저장(Supabase) 연결 전입니다.",
  "no-center": "센터 관제 계정(ops1 · ops2 · ops3 또는 승인된 관제 회원)으로 들어와야 회원을 관리할 수 있습니다.",
  "ops-only": "관제 계정만 볼 수 있습니다.",
  // 처리 결과 — 서버 코드를 그대로 보이지 않는다 (2026-10-06 UX 점검)
  "bad-state": "다른 관제가 먼저 처리했습니다 — 목록을 새로 불러왔습니다.",
  "not-found": "이 회원을 찾지 못했습니다 — 목록을 새로 불러왔습니다.",
  "owner-only": "관제 역할과 관제 회원은 센터 관리자(ops1 · ops2 · ops3)만 바꿀 수 있습니다.",
  "owner-only-delete": "계정 삭제는 센터 관리자(ops1 · ops2 · ops3)만 할 수 있습니다.",
  "same-family": "이미 그 가족입니다.",
  "bad-family": "옮길 가족을 골라 주세요.",
  "family-not-found": "그 가족을 찾지 못했습니다 — 목록을 새로 불러왔습니다.",
  "not-family-role": "가족은 어르신 · 보호자만 옮길 수 있습니다.",
  "account-suspended": "이 관제 계정이 정지되었습니다 — 센터 관리자에게 문의해 주세요.",
  "account-removed": "이 관제 계정을 찾을 수 없습니다.",
  "role-changed": "이 계정의 역할이 바뀌었습니다 — 다시 로그인해 주세요.",
  "json-only": "요청 형식이 맞지 않습니다 — 새로고침한 뒤 다시 해 주세요.",
  "login-required": "로그인이 만료됐습니다 — 다시 로그인해 주세요.",
  network: "서버에 연결하지 못했습니다 — 연결을 확인하고 새로고침해 주세요.",
};
const errText = (code, message) => ERR[code] || message || `처리하지 못했습니다 (${code})`;
// 메뉴 숫자 · 지금 처리할 일이 패널과 같은 승인 대기 수를 보게 — 패널이 새로 읽을 때마다 알린다
const PENDING_EVENT = "kcare-members-pending";
const ACTION_TEXT = {
  signup: "가입",
  approve: "가입 승인",
  reject: "가입 거절",
  role: "역할 변경",
  suspend: "사용 정지",
  activate: "다시 사용",
  "join-code": "센터 가입 코드 변경",
  invite: "가족 초대 링크 만듦",
  delete: "계정 삭제",
  move: "가족 옮김",
  "family-add": "가족 추가",
  "family-rename": "가족 이름 바꿈",
  "family-code": "가족 가입 코드 변경",
  "family-delete": "빈 가족 지움",
};
const when = (t) => (t ? fmtDateTime(Date.parse(t)) : "—");
// 초대 링크로 온 가입은 누가 보낸 링크인지 붙인다 (2026-10-14 · lib/invite.js)
const extraText = (p) =>
  [p?.invitedBy && `${p.invitedBy} 님 초대`, p?.rel && `관계 ${p.rel}`, p?.region && `지역 ${p.region}`, p?.org && `소속 ${p.org}`].filter(Boolean).join(" · ");

function copy(text) {
  try {
    navigator.clipboard?.writeText(text);
  } catch (_) {
    /* 권한이 없으면 화면의 글을 직접 복사한다 */
  }
}

// 관제 첫 화면 '지금 처리할 일' · 메뉴 숫자용 — 승인 대기 회원 수 (센터 관제만 · 1분마다)
export function usePendingMembers() {
  const { user } = useAuth();
  const on = user?.role === "ops" && !!CENTERS[user?.center];
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!on) return undefined;
    let stop = false;
    const get = async () => {
      try {
        const r = await fetch("/api/members", { cache: "no-store" });
        const j = r.ok ? await r.json() : null;
        if (!stop && j) setN((j.members || []).filter((m) => m.status === "pending").length);
      } catch (_) {
        /* 다음 차례에 */
      }
    };
    const onPanel = (e) => setN(Number(e.detail) || 0);
    get();
    const t = setInterval(get, 30000);
    window.addEventListener(PENDING_EVENT, onPanel);
    return () => {
      stop = true;
      clearInterval(t);
      window.removeEventListener(PENDING_EVENT, onPanel);
    };
  }, [on]);
  return n;
}

export default function CenterMembers({ onFamilies = null }) {
  const { user } = useAuth();
  const center = CENTERS[user?.center];
  const [data, setData] = useState(null);
  const [error, setError] = useState(null); // 목록을 못 읽었을 때
  const [notice, setNotice] = useState(null); // 방금 한 처리가 안 됐을 때 — 목록을 다시 읽어도 남긴다
  const [busy, setBusy] = useState(null);
  const [ask, setAsk] = useState(null); // { id, action, role, title, body } — 삭제는 body 대신 lines(줄마다 한 가지)
  const [roleOf, setRoleOf] = useState({}); // 승인 · 역할 변경 때 고른 역할
  const [copied, setCopied] = useState(null);
  const [move, setMove] = useState(null); // { m, to } — 가족 옮기기 창

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/members", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(j.error || `http-${r.status}`);
        return;
      }
      setError(null);
      setData(j);
      window.dispatchEvent(new CustomEvent(PENDING_EVENT, { detail: (j.members || []).filter((m) => m.status === "pending").length }));
    } catch (_) {
      setError("network");
    }
  }, []);

  useEffect(() => {
    if (!center) return undefined;
    load();
    // 새 가입 신청이 들어오면 보이게 — 30초마다
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [center, load]);

  if (!user?.household) return null; // 데모 — 아래 예시 '계정·권한'만
  if (!center) {
    return (
      <Panel>
        <PanelHead title="회원 · 권한 (실제)" sub="관제 센터 계정 전용" />
        <div className="mt-2">
          <Note tone="info">{ERR["no-center"]} 지금 계정은 {user.name}입니다. 관제 로그인(/ops/login)에서 들어오세요.</Note>
        </div>
      </Panel>
    );
  }

  const send = async (method, body, key) => {
    setBusy(key);
    setNotice(null);
    try {
      const r = await fetch("/api/members", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setNotice(errText(j.error || `http-${r.status}`, j.message));
    } catch (_) {
      setNotice(errText("network"));
    }
    try {
      await load();
    } finally {
      setBusy(null);
    }
  };
  const act = (id, action, role, household) => send("PATCH", { id, action, role, household }, `${id}:${action}`);
  const rotate = () => send("POST", { action: "rotate-code" }, "code");
  const copied2s = (k) => {
    setCopied(k);
    setTimeout(() => setCopied((c) => (c === k ? null : c)), 2000);
  };
  // 누가 누구에게 — 아이디만 늘어놓지 않고 이름(아이디)으로
  const nameOf = (id) => {
    const m = (data?.members || []).find((x) => x.id === id);
    return m ? `${m.name}(${id})` : id || "—";
  };

  const members = data?.members || [];
  const pending = members.filter((m) => m.status === "pending");
  const listed = members.filter((m) => m.status !== "pending");
  const code = data?.center?.joinCode;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  // 가족 나누기가 켜져 있나 (서버 표에 가족 칸이 있나) — 꺼져 있으면 예전처럼 한 센터 = 한 가족으로 보인다
  const families = Array.isArray(data?.families) ? data.families : null;
  const famOn = !!families;
  const famTitle = (id) => families?.find((f) => f.id === id)?.title || "—";
  const isUserRole = (r) => r === "elder" || r === "guardian";
  // 센터 가입 코드로는 직원만 가입한다 — 가족 나누기가 켜져 있으면 이용자 링크는 여기서 주지 않는다 (가족 관리에서 가족마다)
  const links = code ? Object.values(AREAS).filter((a) => !famOn || a.key !== "user").map((a) => [a, `${origin}${a.join}?code=${code}`]) : [];
  const count = (role) => members.filter((m) => m.status === "active" && m.role === role).length;
  // 같은 가족에서 이미 사용 중인 어르신 (가입 순) — 한 가족에 어르신이 둘이면 기록을 함께 쓰고 먼저 가입한 분 기준으로 보인다
  const eldersIn = (hh) => members.filter((m) => m.status === "active" && m.role === "elder" && (!famOn || m.household === hh)).map((m) => m.name);
  const activeElders = eldersIn(null);
  // 어르신이 둘 이상인 가족 — 부부가 아니라 서로 다른 집이면 나눠야 한다
  const crowded = famOn ? families.map((f) => ({ f, names: eldersIn(f.id) })).filter((x) => x.names.length > 1) : [];
  const pickRole = (m) => roleOf[m.id] || m.role;
  // 직원을 어르신 · 보호자로 바꾸면 계정에 적힌 가족(직원으로 가입했으면 첫 가족)에 들어간다 — 그 가족의 기록이 보이게 되므로 미리 알린다
  const joinsNote = (m, next) => (famOn && isUserRole(next) && !isUserRole(m.role) ? ` 어르신 · 보호자가 되면 ${famTitle(m.home)}의 기록을 보게 됩니다 — 다른 가족이면 바꾼 뒤 회원 목록의 [옮기기]로 옮겨 주세요.` : "");
  // 관제 역할 · 관제 회원은 센터 관리자(ops1~3)만 바꾼다 — 관제 회원 화면에서는 고를 수 없게
  const owner = !!data?.owner;
  const roleChoices = owner ? ALL_ROLES : ALL_ROLES.filter((r) => r !== "ops");
  const lockedForMe = (m) => !owner && m.role === "ops";

  const nameCell = (m) => (
    <span>
      <b className="text-navy">{m.name}</b> <span className="font-num text-muted">{m.loginId || m.id}</span>
      {m.id === data?.me && <Pill tone="info" className="ml-1">나</Pill>}
    </span>
  );
  const statusCell = (m) => <Pill tone={MEMBER_STATUS[m.status]?.tone || "muted"}>{MEMBER_STATUS[m.status]?.label || m.status}</Pill>;
  const roleCell = (m) =>
    m.member && m.id !== data?.me && m.status !== "rejected" && !lockedForMe(m) ? (
      <span className="flex flex-wrap items-center gap-1">
        <select
          aria-label={`${m.name} 역할`}
          value={pickRole(m)}
          onChange={(e) => setRoleOf({ ...roleOf, [m.id]: e.target.value })}
          className="min-h-[32px] rounded-md border border-navy/15 bg-white px-1.5 py-1 text-[12px] font-bold text-navy"
        >
          {roleChoices.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]} ({AREAS[areaOfRole(r)].label})
            </option>
          ))}
        </select>
        {pickRole(m) !== m.role && (
          <Btn small disabled={!!busy} onClick={() => setAsk({ id: m.id, action: "role", role: pickRole(m), title: `${m.name} 님 역할을 ${ROLE_LABEL[pickRole(m)]}(으)로 바꿉니다`, body: `${ROLE_LABEL[m.role]} → ${ROLE_LABEL[pickRole(m)]}. 지금 로그인해 있으면 15초 안에 화면이 멈추고, ${AREAS[areaOfRole(pickRole(m))].label} 로그인으로 다시 들어와야 합니다.${joinsNote(m, pickRole(m))}` })}>
            적용
          </Btn>
        )}
      </span>
    ) : (
      <span>
        {ROLE_LABEL[m.role] || "—"} <span className="text-muted">({AREAS[areaOfRole(m.role)]?.label || "—"})</span>
        {!m.member && <span className="ml-1 text-[11px] text-muted">센터 관리자</span>}
        {m.member && lockedForMe(m) && <span className="ml-1 text-[11px] text-muted">센터 관리자만 변경</span>}
      </span>
    );
  // 지우면 어떻게 되나 — 되돌릴 수 없는 일이라 무엇이 남고 무엇이 사라지는지 먼저 적는다.
  // 이 센터 기록의 기준 어르신(사용 중인 어르신 가운데 먼저 가입한 분)을 지우면 화면의 어르신 이름이 바뀐다 — 그것도 미리 알린다
  const deleteLines = (m) => {
    const mine = famOn ? eldersIn(m.household) : activeElders;
    const main = m.status === "active" && m.role === "elder" && mine[0] === m.name;
    const next = mine.filter((n) => n !== m.name)[0];
    return [
      "되돌릴 수 없습니다. 이 아이디로는 더 로그인할 수 없고(지금 로그인해 있어도 15초 안에 막힙니다) 목록에서 사라집니다.",
      "이 회원이 남긴 기록(일정 · 요청 · 음성 등)과 권한 변경 기록은 지워지지 않습니다.",
      "같은 아이디로 다시 가입할 수 있습니다.",
      main ? `이 ${famOn ? "가족" : "센터"}의 기록은 지금 ${m.name} 님 기준으로 보입니다 — 지우면 ${next ? `${next} 님` : "'어르신'"} 이름으로 보입니다 (기록 내용은 그대로).` : "",
      "잠깐만 막으려면 삭제 대신 '정지'를 쓰세요.",
    ].filter(Boolean);
  };
  const delBtn = (m) =>
    owner ? (
      <Btn ghost small tone="muted" disabled={!!busy} onClick={() => setAsk({ id: m.id, action: "delete", title: `${m.name} 님(${m.loginId || m.id}) 계정을 삭제합니다`, lines: deleteLines(m) })}>
        삭제
      </Btn>
    ) : null;
  // 가족 — 어르신 · 보호자만 가족에 속한다. [옮기기]는 그 센터의 다른 가족으로 (기록은 가족에 남고 사람만 옮긴다)
  const famCell = (m) =>
    !famOn ? null : !isUserRole(m.role) ? (
      <span className="text-[12px] text-muted">—</span>
    ) : (
      <span className="flex flex-wrap items-center gap-1.5">
        <span className="text-[13px] font-bold text-ink">{famTitle(m.household)}</span>
        {m.member && m.status !== "rejected" && families.length > 1 && (
          <Btn ghost small tone="muted" disabled={!!busy} onClick={() => setMove({ m, to: families.find((f) => f.id !== m.household)?.id || "" })}>
            옮기기
          </Btn>
        )}
      </span>
    );
  const actCell = (m) =>
    !m.member || m.id === data?.me || lockedForMe(m) ? null : m.status === "active" ? (
      <span className="flex flex-wrap items-center gap-1.5">
        <Btn ghost small tone="warn" disabled={!!busy} onClick={() => setAsk({ id: m.id, action: "suspend", title: `${m.name} 님 사용을 정지합니다`, body: "지금 로그인해 있어도 15초 안에 저장 · 조회가 막힙니다. '다시 사용'으로 되돌릴 수 있습니다." })}>
          정지
        </Btn>
        {delBtn(m)}
      </span>
    ) : m.status === "suspended" || m.status === "rejected" ? (
      <span className="flex flex-wrap items-center gap-1.5">
        <Btn ghost small disabled={!!busy} onClick={() => act(m.id, "activate")}>
          다시 사용
        </Btn>
        {delBtn(m)}
      </span>
    ) : null;

  return (
    <Panel>
      <PanelHead
        title={`${data?.center?.name || center.name} 회원 · 권한 (실제)`}
        sub="이 센터에 가입한 사람만 보입니다 — 다른 센터 회원 · 기록은 섞이지 않습니다"
        right={<Btn ghost small onClick={load}>새로고침</Btn>}
      />
      {(error || notice) && (
        <div className="mt-2 space-y-1.5" role="alert">
          {error && <Note tone="warn">{errText(error)}</Note>}
          {notice && <Note tone="warn">{notice}</Note>}
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Stat label="승인 대기" value={pending.length} tone={pending.length ? "warn" : "muted"} />
        {["elder", "guardian", "concierge", "sales"].map((r) => (
          <Stat key={r} label={ROLE_LABEL[r]} value={count(r)} unit="명" tone="navy" />
        ))}
      </div>

      {/* 한 가족에 어르신이 여럿 (2026-11-12: 코드를 바꿔 따로 가입했는데 한 사람으로 보인다는 문의) —
          가족 나누기가 켜져 있으면 가족별로, 꺼져 있으면(families.sql 실행 전) 예전처럼 센터 전체로 알린다 */}
      {famOn
        ? crowded.map(({ f, names }) => (
            <div key={f.id} className="mt-3">
              <Note tone="info">
                <b>{f.title}</b>에 어르신 회원이 {names.length}명입니다 ({names.join(" · ")}) — 한 가족은 기록을 함께 쓰고, 화면의 어르신은 먼저 가입한 {names[0]} 님 기준으로 보입니다.
                서로 다른 댁이면 가족 관리에서 [가족 추가]로 가족을 만든 뒤 아래 회원 목록의 [옮기기]로 나눠 주세요.
              </Note>
            </div>
          ))
        : activeElders.length > 1 && (
            <div className="mt-3">
              <Note tone="info">
                어르신 회원이 {activeElders.length}명입니다 — 지금은 한 센터가 한 가족의 기록을 쓰기 때문에, 모두 {activeElders[0]} 님의 약 · 일정 · 부탁 · 마음사서함을 함께 봅니다
                (먼저 가입한 어르신 기준). 가족마다 따로 쓰려면 Supabase 에서 supabase/families.sql 을 한 번 실행해 주세요 (DEPLOY.md 4-19).
              </Note>
            </div>
          )}
      {data && !famOn && (
        <div className="mt-3">
          <Note tone="warn">가족 나누기 칸이 아직 없습니다 — supabase/families.sql 을 실행하면 가족마다 기록 · 가입 코드가 따로 생깁니다 (DEPLOY.md 4-19). 그 전에는 한 센터가 한 가족입니다.</Note>
        </div>
      )}

      {/* 가입 코드 · 링크 */}
      <div className="mt-4 rounded-xl bg-navy/[.03] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-bold text-navy">{famOn ? "센터 가입 코드 (직원용)" : "가입 코드"}</span>
          <span className="rounded-lg bg-white px-3 py-1 font-num text-[18px] font-bold tracking-[.2em] text-navy" aria-label={famOn ? "센터 가입 코드" : "가입 코드"}>
            {code || "—"}
          </span>
          <Btn ghost small onClick={() => code && (copy(code), copied2s("code"))}>{copied === "code" ? "복사됨" : "코드 복사"}</Btn>
          <span className="flex-1" />
          <Btn ghost small tone="warn" disabled={busy === "code"} onClick={() => setAsk({ action: "rotate", title: famOn ? "센터 가입 코드를 새로 만듭니다" : "가입 코드를 새로 만듭니다", body: famOn ? `지금 코드는 바로 쓸 수 없게 됩니다. 이미 가입한 회원에게는 영향이 없습니다. 이 코드는 직원(컨시어지 · 파트너 · 관제) 가입용입니다 — 어르신 · 보호자는 가족 관리에서 가족마다 만든 가족 가입 코드로 가입합니다.` : `지금 코드는 바로 쓸 수 없게 됩니다. 이미 가입한 회원에게는 영향이 없습니다. 새 코드로 가입해도 같은 ${data?.center?.name || center.name} · 같은 가족 기록에 들어옵니다 — 새 가족 공간이 생기지 않습니다.` })}>
            코드 바꾸기
          </Btn>
        </div>
        {famOn ? (
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] leading-[1.6] text-muted">
            <span>
              이 코드는 <b className="text-ink">컨시어지 · 파트너 · 관제</b> 가입에만 씁니다. 어르신 · 보호자는 가족마다 따로 있는 <b className="text-ink">가족 가입 코드</b>로 가입합니다 — 코드가 다르면 다른 가족입니다.
            </span>
            {onFamilies && (
              <Btn ghost small onClick={onFamilies}>가족 관리 열기 — 가족 추가 · 가족 가입 코드</Btn>
            )}
          </p>
        ) : (
          <p className="mt-1.5 text-[11.5px] leading-[1.6] text-muted">
            가입 코드는 &lsquo;어느 센터에 가입하나&rsquo;만 정합니다 — 지금은 한 센터 = 한 가족 기록이라, 코드를 바꿔도 같은 기록을 함께 씁니다.
          </p>
        )}
        <ul className="mt-2 space-y-1.5">
          {links.map(([a, url]) => (
            <li key={a.key} className="flex flex-wrap items-center gap-2 text-[12px]">
              <Pill tone={a.approval ? "gold" : "ok"}>{a.label}</Pill>
              <span className="text-muted">{a.desc} · {a.approval ? "관제 승인 뒤 사용" : "가입하면 바로 사용"}</span>
              <span className="min-w-0 flex-1 truncate font-num text-ink">{url}</span>
              <Btn ghost small onClick={() => (copy(url), copied2s(a.key))}>{copied === a.key ? "복사됨" : "링크 복사"}</Btn>
            </li>
          ))}
        </ul>
      </div>

      {/* 승인 대기 */}
      <h4 className="mt-5 text-[14px] font-bold text-navy">승인 대기 {pending.length ? `${pending.length}명` : ""}</h4>
      {pending.length === 0 ? (
        <div className="mt-2">
          <Empty>승인할 가입 신청이 없습니다. 이용자 · 현장 · 영업 · 관제 모든 가입은 여기서 승인해야 로그인됩니다.</Empty>
        </div>
      ) : (
        <ul className="mt-2 space-y-2">
          {pending.map((m) => (
            <li key={m.id} className="card-glass flex flex-col gap-2 rounded-xl px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="min-w-0 sm:flex-1">
                <div className="flex flex-wrap items-center gap-1.5 text-[14px]">
                  <span className="font-bold text-navy">{m.name}</span>
                  <span className="font-num text-muted">{m.loginId}</span>
                  <Pill tone="gold">{ROLE_LABEL[m.requestedRole || m.role]} 신청</Pill>
                </div>
                <div className="mt-0.5 text-[12px] text-muted">
                  신청 {when(m.createdAt)}
                  {m.phone ? ` · ${m.phone}` : ""}
                  {extraText(m.profile) ? ` · ${extraText(m.profile)}` : ""}
                  {famOn && isUserRole(m.requestedRole || m.role) ? ` · 가족 ${famTitle(m.household)}` : ""}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1 text-[12px] text-muted">
                승인할 역할
                <select
                  aria-label={`${m.name} 승인할 역할`}
                  value={pickRole(m)}
                  onChange={(e) => setRoleOf({ ...roleOf, [m.id]: e.target.value })}
                  className="rounded-md border border-navy/15 bg-white px-2 py-1 text-[12px] font-bold text-navy"
                >
                  {(lockedForMe(m) ? ["ops"] : roleChoices).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]} ({AREAS[areaOfRole(r)].label})
                    </option>
                  ))}
                </select>
              </label>
              {lockedForMe(m) && <span className="text-[11px] text-muted">관제 가입은 센터 관리자가 승인</span>}
              <Btn small tone="ok" disabled={!!busy || lockedForMe(m)} onClick={() => setAsk({ id: m.id, action: "approve", role: pickRole(m), title: `${m.name} 님을 ${ROLE_LABEL[pickRole(m)]}(으)로 승인합니다`, body: `${AREAS[areaOfRole(pickRole(m))].label} 로그인(${AREAS[areaOfRole(pickRole(m))].login})에서 들어올 수 있게 됩니다.${
                famOn
                  ? isUserRole(pickRole(m))
                    ? ` ${famTitle(m.home)}에 들어갑니다.${pickRole(m) === "elder" && eldersIn(m.home).length ? ` 이 가족에는 이미 어르신 ${eldersIn(m.home).join(" · ")} 님이 있습니다 — 한 가족은 기록을 함께 쓰고 화면은 ${eldersIn(m.home)[0]} 님 기준으로 보입니다. 다른 댁이면 승인한 뒤 회원 목록의 [옮기기]로 다른 가족으로 옮겨 주세요.` : ""}${isUserRole(m.requestedRole || m.role) ? "" : " 직원으로 신청한 가입이라 가족을 고르지 않았습니다 — 다른 가족이면 승인한 뒤 [옮기기]로 옮겨 주세요."}`
                    : ""
                  : pickRole(m) === "elder" && activeElders.length
                    ? ` 이 센터에는 이미 어르신 ${activeElders.join(" · ")} 님이 있습니다 — 지금은 한 센터 = 한 가족이라 약 · 일정 · 부탁 · SOS 기록을 함께 쓰고, 화면은 ${activeElders[0]} 님 기준으로 보입니다.`
                    : ""
              }` })}>
                승인
              </Btn>
              <Btn small ghost tone="muted" disabled={!!busy} onClick={() => setAsk({ id: m.id, action: "reject", title: `${m.name} 님 가입을 거절합니다`, body: "거절한 아이디는 로그인할 수 없습니다. 나중에 '다시 사용'으로 되돌릴 수 있습니다." })}>
                거절
              </Btn>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 회원 목록 — 넓은 화면은 표, 휴대폰은 한 사람씩 카드 (표가 320px 칸에 560px 로 잘려 상태 · 정지가 안 보였다) */}
      <h4 className="mt-5 text-[14px] font-bold text-navy">회원 {listed.length}명</h4>
      <div className="mt-2 hidden sm:block">
        <Table
          dense
          cols={[
            { k: "name", label: "이름 · 아이디", render: (m) => nameCell(m) },
            { k: "role", label: "역할 (영역)", w: 210, render: (m) => roleCell(m) },
            ...(famOn ? [{ k: "family", label: "가족", w: 190, render: (m) => famCell(m) }] : []),
            { k: "status", label: "상태", w: 90, render: (m) => statusCell(m) },
            { k: "createdAt", label: "가입 · 승인", w: 150, render: (m) => <span className="text-[12px] text-muted">{when(m.createdAt)}{m.approvedBy ? <><br />{m.status === "rejected" ? "거절" : "승인"} {m.approvedBy}</> : null}</span> },
            { k: "last", label: "마지막 로그인", w: 120, render: (m) => <span className="font-num text-[12px] text-muted">{when(m.lastLoginAt)}</span> },
            { k: "act", label: "", w: 150, render: (m) => actCell(m) },
          ]}
          rows={listed}
          empty="아직 회원이 없습니다 — 위 가입 링크를 나눠 주세요."
        />
      </div>
      <ul className="mt-2 space-y-2 sm:hidden">
        {listed.length === 0 && <li><Empty>아직 회원이 없습니다 — 위 가입 링크를 나눠 주세요.</Empty></li>}
        {listed.map((m) => (
          <li key={m.id} className="card-glass rounded-xl px-3 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 text-[14px]">{nameCell(m)}</div>
              {statusCell(m)}
            </div>
            <div className="mt-2 text-[13px]">{roleCell(m)}</div>
            {famOn && isUserRole(m.role) && <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-muted">가족 {famCell(m)}</div>}
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted">
              <span>
                가입 {when(m.createdAt)}
                {m.approvedBy ? ` · ${m.status === "rejected" ? "거절" : "승인"} ${m.approvedBy}` : ""} · 마지막 로그인 {when(m.lastLoginAt)}
              </span>
              {actCell(m)}
            </div>
          </li>
        ))}
      </ul>

      {/* 권한 변경 기록 */}
      <details className="mt-4 rounded-xl bg-navy/[.03] px-3 py-2">
        <summary className="cursor-pointer text-[12px] font-bold text-muted">권한 변경 기록 {data?.audit?.length || 0}건 (지우지 않음)</summary>
        <ul className="mt-1 space-y-0.5 text-[12px] text-ink">
          {(data?.audit || []).map((a) => (
            <li key={a.id}>
              <span className="font-num text-muted">{when(a.created_at)}</span> {nameOf(a.actor_id)}
              {/* 지운 계정은 목록에 없다 — 지울 때 적어 둔 이름으로 */}
              {a.account_id && a.account_id !== a.actor_id ? ` → ${a.action === "delete" && a.before?.name ? `${a.before.name}(${a.account_id})` : nameOf(a.account_id)}` : ""}{" "}
              {a.action === "delete" && a.before?.role ? `${ROLE_LABEL[a.before.role]} ` : ""}
              {a.before?.role && a.after?.role && a.before.role !== a.after.role
                ? `${ROLE_LABEL[a.before.role]} → ${ROLE_LABEL[a.after.role]}${a.action === "role" ? "" : "(으)로"} `
                : a.action === "approve" && a.after?.role
                  ? `${ROLE_LABEL[a.after.role]}(으)로 `
                  : a.action === "signup" && a.after?.role
                    ? `${ROLE_LABEL[a.after.role]} `
                    : ""}
              {ACTION_TEXT[a.action] || a.action}
              {/* 가족을 옮긴 줄 · 가족을 만들고 바꾼 줄 — 어느 가족인지 (지워진 가족은 번호 대신 적어 둔 이름으로) */}
              {a.action === "move" && famOn ? ` (${famTitle(a.before?.household)} → ${famTitle(a.after?.household)})` : ""}
              {/^family-/.test(a.action) && famOn ? ` (${famTitle((a.after || a.before)?.household) !== "—" ? famTitle((a.after || a.before)?.household) : (a.before || a.after)?.label || "지워진 가족"})` : ""}
            </li>
          ))}
        </ul>
      </details>

      <Confirm
        open={!!ask}
        title={ask?.title || ""}
        body={ask?.body || ""}
        confirmLabel={ask?.action === "approve" ? "승인" : ask?.action === "reject" ? "거절" : ask?.action === "suspend" ? "정지" : ask?.action === "delete" ? "삭제" : ask?.action === "rotate" ? "새 코드 만들기" : "적용"}
        tone={ask?.action === "approve" ? "ok" : ask?.action === "suspend" || ask?.action === "reject" || ask?.action === "delete" ? "warn" : "navy"}
        onCancel={() => setAsk(null)}
        onConfirm={() => {
          const x = ask;
          setAsk(null);
          if (x.action === "rotate") rotate();
          else act(x.id, x.action, x.role);
        }}
      >
        {ask?.lines && (
          <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px] leading-[1.6] text-ink">
            {ask.lines.map((ln) => (
              <li key={ln}>{ln}</li>
            ))}
          </ul>
        )}
      </Confirm>

      {/* 가족 옮기기 — 사람만 옮긴다. 남긴 기록은 원래 가족에 그대로 있다 */}
      <Confirm
        open={!!move}
        title={move ? `${move.m.name} 님(${ROLE_LABEL[move.m.role]})을 다른 가족으로 옮깁니다` : ""}
        body=""
        confirmLabel="옮기기"
        tone="warn"
        onCancel={() => setMove(null)}
        onConfirm={() => {
          const x = move;
          setMove(null);
          if (x?.to) act(x.m.id, "move", undefined, x.to);
        }}
      >
        {move && (
          <>
            <label htmlFor="move-family" className="mt-2 block">
              <span className="text-[11px] font-bold text-muted">옮길 가족 (지금: {famTitle(move.m.household)})</span>
              <select
                id="move-family"
                value={move.to}
                onChange={(e) => setMove({ ...move, to: e.target.value })}
                className="card-glass mt-1 min-h-[40px] w-full rounded-[10px] px-3 py-2 text-[13px] font-bold text-navy"
              >
                {(families || [])
                  .filter((f) => f.id !== move.m.household)
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title}
                    </option>
                  ))}
              </select>
            </label>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px] leading-[1.6] text-ink">
              <li>이 회원이 남긴 기록(일정 · 요청 · 음성 등)은 지금 가족에 그대로 남습니다 — 사람만 옮깁니다.</li>
              <li>지금 로그인해 있으면 15초 안에 화면이 멈추고, 다시 로그인하면 새 가족의 기록이 열립니다.</li>
              <li>옮긴 사실은 권한 변경 기록과 두 가족의 감사로그에 남습니다. 다시 옮겨 되돌릴 수 있습니다.</li>
            </ul>
          </>
        )}
      </Confirm>
    </Panel>
  );
}
