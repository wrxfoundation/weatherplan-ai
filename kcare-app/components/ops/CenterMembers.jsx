// 관제 센터 회원 · 권한 — 실제 (2026-10-06). 그 센터 관제(ops1 · ops2 · ops3 또는 승인된 관제 회원)만 본다.
//  · 가입 코드와 영역별 가입 링크 (이용자 · 현장 · 영업 · 관제) — 코드를 바꾸면 옛 코드는 바로 막힌다
//  · 승인 대기 — 모든 가입 신청을 승인(역할을 바꿔 승인할 수도) · 거절
//  · 회원 목록 — 역할 부여 · 정지 · 다시 사용. 자기 계정과 테스트 계정은 바꾸지 않는다
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
const ACTION_TEXT = { signup: "가입", approve: "가입 승인", reject: "가입 거절", role: "역할 변경", suspend: "사용 정지", activate: "다시 사용", "join-code": "가입 코드 변경" };
const when = (t) => (t ? fmtDateTime(Date.parse(t)) : "—");
const extraText = (p) => [p?.rel && `관계 ${p.rel}`, p?.region && `지역 ${p.region}`, p?.org && `소속 ${p.org}`].filter(Boolean).join(" · ");

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

export default function CenterMembers() {
  const { user } = useAuth();
  const center = CENTERS[user?.center];
  const [data, setData] = useState(null);
  const [error, setError] = useState(null); // 목록을 못 읽었을 때
  const [notice, setNotice] = useState(null); // 방금 한 처리가 안 됐을 때 — 목록을 다시 읽어도 남긴다
  const [busy, setBusy] = useState(null);
  const [ask, setAsk] = useState(null); // { id, action, role, title, body }
  const [roleOf, setRoleOf] = useState({}); // 승인 · 역할 변경 때 고른 역할
  const [copied, setCopied] = useState(null);

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
  const act = (id, action, role) => send("PATCH", { id, action, role }, `${id}:${action}`);
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
  const links = code ? Object.values(AREAS).map((a) => [a, `${origin}${a.join}?code=${code}`]) : [];
  const count = (role) => members.filter((m) => m.status === "active" && m.role === role).length;
  const pickRole = (m) => roleOf[m.id] || m.role;
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
          <Btn small disabled={!!busy} onClick={() => setAsk({ id: m.id, action: "role", role: pickRole(m), title: `${m.name} 님 역할을 ${ROLE_LABEL[pickRole(m)]}(으)로 바꿉니다`, body: `${ROLE_LABEL[m.role]} → ${ROLE_LABEL[pickRole(m)]}. 지금 로그인해 있으면 15초 안에 화면이 멈추고, ${AREAS[areaOfRole(pickRole(m))].label} 로그인으로 다시 들어와야 합니다.` })}>
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
  const actCell = (m) =>
    !m.member || m.id === data?.me || lockedForMe(m) ? null : m.status === "active" ? (
      <Btn ghost small tone="warn" disabled={!!busy} onClick={() => setAsk({ id: m.id, action: "suspend", title: `${m.name} 님 사용을 정지합니다`, body: "지금 로그인해 있어도 15초 안에 저장 · 조회가 막힙니다. '다시 사용'으로 되돌릴 수 있습니다." })}>
        정지
      </Btn>
    ) : m.status === "suspended" || m.status === "rejected" ? (
      <Btn ghost small disabled={!!busy} onClick={() => act(m.id, "activate")}>
        다시 사용
      </Btn>
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

      {/* 가입 코드 · 링크 */}
      <div className="mt-4 rounded-xl bg-navy/[.03] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-bold text-navy">가입 코드</span>
          <span className="rounded-lg bg-white px-3 py-1 font-num text-[18px] font-bold tracking-[.2em] text-navy" aria-label="가입 코드">
            {code || "—"}
          </span>
          <Btn ghost small onClick={() => code && (copy(code), copied2s("code"))}>{copied === "code" ? "복사됨" : "코드 복사"}</Btn>
          <span className="flex-1" />
          <Btn ghost small tone="warn" disabled={busy === "code"} onClick={() => setAsk({ action: "rotate", title: "가입 코드를 새로 만듭니다", body: "지금 코드는 바로 쓸 수 없게 됩니다. 이미 가입한 회원에게는 영향이 없습니다. 새 코드를 다시 나눠 주세요." })}>
            코드 바꾸기
          </Btn>
        </div>
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
              <Btn small tone="ok" disabled={!!busy || lockedForMe(m)} onClick={() => setAsk({ id: m.id, action: "approve", role: pickRole(m), title: `${m.name} 님을 ${ROLE_LABEL[pickRole(m)]}(으)로 승인합니다`, body: `${AREAS[areaOfRole(pickRole(m))].label} 로그인(${AREAS[areaOfRole(pickRole(m))].login})에서 들어올 수 있게 됩니다.` })}>
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
            { k: "status", label: "상태", w: 90, render: (m) => statusCell(m) },
            { k: "createdAt", label: "가입 · 승인", w: 150, render: (m) => <span className="text-[12px] text-muted">{when(m.createdAt)}{m.approvedBy ? <><br />{m.status === "rejected" ? "거절" : "승인"} {m.approvedBy}</> : null}</span> },
            { k: "last", label: "마지막 로그인", w: 120, render: (m) => <span className="font-num text-[12px] text-muted">{when(m.lastLoginAt)}</span> },
            { k: "act", label: "", w: 96, render: (m) => actCell(m) },
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
              {a.account_id && a.account_id !== a.actor_id ? ` → ${nameOf(a.account_id)}` : ""}{" "}
              {a.before?.role && a.after?.role && a.before.role !== a.after.role
                ? `${ROLE_LABEL[a.before.role]} → ${ROLE_LABEL[a.after.role]}${a.action === "role" ? "" : "(으)로"} `
                : a.action === "approve" && a.after?.role
                  ? `${ROLE_LABEL[a.after.role]}(으)로 `
                  : a.action === "signup" && a.after?.role
                    ? `${ROLE_LABEL[a.after.role]} `
                    : ""}
              {ACTION_TEXT[a.action] || a.action}
            </li>
          ))}
        </ul>
      </details>

      <Confirm
        open={!!ask}
        title={ask?.title || ""}
        body={ask?.body || ""}
        confirmLabel={ask?.action === "approve" ? "승인" : ask?.action === "reject" ? "거절" : ask?.action === "suspend" ? "정지" : ask?.action === "rotate" ? "새 코드 만들기" : "적용"}
        tone={ask?.action === "approve" ? "ok" : ask?.action === "suspend" || ask?.action === "reject" ? "warn" : "navy"}
        onCancel={() => setAsk(null)}
        onConfirm={() => {
          const x = ask;
          setAsk(null);
          if (x.action === "rotate") rotate();
          else act(x.id, x.action, x.role);
        }}
      />
    </Panel>
  );
}
