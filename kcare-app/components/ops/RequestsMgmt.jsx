// 해주세요 관리 — 요청서 §12. 앱 상태(state.requests)의 요청은 그대로 연결하고,
// 2026-10-05 운영 결정: 보호자 · 어르신 해주세요는 담당 컨시어지가 승인하고, 관제는 현황(승인 내역 · 결제액)을 보며
// 강제 취소 · 취소 요청 승인 · 환불 처리만 한다. 실제 요청의 상태를 관제가 임의로 넘기지 않는다.
// 다른 고객의 데모 요청(lib/ops-admin OPS_REQUEST_EXTRAS)은 컴포넌트 안에서 같은 전이 규칙으로 움직인다.
// 앱 상태에 없는 열(실제 비용·영수증·완료 확인·평가·환불·반복)은 id 별 meta 로 보관하고 localStorage 에 남긴다
// (§19 "새로고침 후에도 입력내용 유지").
import { scopedKey } from "../../lib/scope";
import { useEffect, useMemo, useState } from "react";
import Icon from "../icons";
import { useAppState } from "../../lib/state";
import { useAuth } from "../../lib/auth";
import { LiveToggle } from "./LiveToggle";
import { APPROVER_LABEL, STATUS, SERVICE_MENU, URGENCY, approverOf, canTransition, fmtPreferred, fmtScheduled, isVisitCall, paymentOf, transition } from "../../lib/requests";
import { PRICING, fmtWon } from "../../lib/config";
import { Panel, PanelHead, Stat, Pill, Btn, Table, KV, Field, Toggle, Drawer, Confirm, Note, Empty, useOperator } from "./ui";
import { CONCIERGES, OPS_REQUEST_EXTRAS, OPS_REQUEST_META, REQ_DIR, REPEAT_OPTIONS, elderOf, fmtDT, fmtRel } from "../../lib/ops-admin";
import { LIVE_TAG } from "../../lib/live-household";
import { LIVE_ELDER } from "../../lib/ops-health";
import { conciergeChoices } from "../../lib/people";

const META_KEY = "kcare-ops-requests-meta-v1";
const EXTRA_KEY = "kcare-ops-requests-extra-v1";
const NO_REQUESTS = [];

// 정렬 — 기본은 최근 접수 순 (2026-10-05: 보호자가 방금 넣은 요청이 긴급 · 완료 건 밑에 묻혀 바로 안 보였다).
// '처리 우선 순'은 예외를 먼저 — 긴급 → 관리자 확인 → 접수 → 결제대기 → 확인 → 처리중 → 완료 → 종결
const SORTS = { recent: "최근 접수 순", priority: "처리 우선 순" };
const STATUS_RANK = { needsAdmin: 0, cancelRequested: 0, requested: 1, awaitingPayment: 2, confirmed: 3, inProgress: 4, done: 5, rejected: 6, cancelled: 7 };
const GROUPS = {
  received: { label: "접수 · 확정", keys: ["requested", "confirmed", "needsAdmin", "cancelRequested"], tone: "navy" },
  awaitingPayment: { label: "결제 대기", keys: ["awaitingPayment"], tone: "warn" },
  inProgress: { label: "진행 중", keys: ["inProgress"], tone: "info" },
  done: { label: "완료", keys: ["done"], tone: "ok" },
  closed: { label: "취소 · 환불", keys: ["cancelled", "rejected"], tone: "muted" },
};

// STATUS 의 색을 그대로 쓰는 배지 — 처리상태(CASE_STATE)와 다른 체계라 StatePill 을 쓰지 않는다
function StatusPill({ status }) {
  const s = STATUS[status] || STATUS.requested;
  return (
    <span className="inline-flex shrink-0 items-center rounded-full px-2 py-[2px] text-[11px] font-bold" style={{ color: s.fg, background: s.bg }}>
      {s.label}
    </span>
  );
}

function normalize(r) {
  const elder = r.elder || LIVE_ELDER;
  const e = elderOf(elder);
  const by = {
    fromGuardian: `${e?.guardian || "보호자"} (보호자)`,
    fromElder: `${elder} (어르신)`,
    fromConcierge: `${r.assignee || "컨시어지"} (컨시어지)`,
    fromOps: "김태영 (관제)",
  }[r.dir] || REQ_DIR[r.dir] || "—";
  return { ...r, elder, by, receivedAt: r.history?.[0]?.at ?? null, menu: SERVICE_MENU.find((s) => s.name === r.type) || null, limit: r.limit ?? e?.payLimit ?? PRICING.paymentLimitDefault };
}

// 보호자 결제 승인 상태 — 금액·진행상태에서 읽는다. 지어내지 않고 없는 값은 "요금 확정 전".
// 어르신 한도는 어르신이 낸 요청에만 쓴다 — 보호자가 직접 낸 6만원 요청이 '한도 내 · 승인 불필요'로 보였다 (2026-10-05).
function payState(r, payments) {
  const paid = paymentOf(payments, r.id);
  if (paid?.refund) return paid.refund.status === "done" ? { label: `환불 완료 ${fmtWon(paid.refund.amount)}`, tone: "ok" } : { label: `환불 대기 ${fmtWon(paid.refund.amount)}`, tone: "warn" };
  if (paid) return { label: `결제 완료 ${fmtWon(paid.amount)}${paid.demo ? " (데모)" : ""}`, tone: "ok" };
  if (r.payBy === "elder" && r.amount > 0) return { label: `어르신 직접 ${fmtWon(r.amount)}`, tone: "muted" };
  if (r.amount == null) return { label: "요금 확정 전", tone: "muted" };
  if (r.amount === 0) return { label: "승인 불필요 (무료)", tone: "muted" };
  if (r.status === "awaitingPayment") return { label: "보호자 결제 대기", tone: "warn" };
  if (r.status === "inProgress" || r.status === "done") return { label: "승인 완료", tone: "ok" };
  if (r.status === "cancelled" || r.status === "rejected") return { label: "—", tone: "muted" };
  if (r.dir === "fromGuardian") return { label: "보호자 신청 · 결제 전", tone: "muted" };
  if (r.dir !== "fromElder") return { label: "보호자 승인 필요", tone: "info" };
  return r.amount > r.limit ? { label: "승인 필요 (한도 초과)", tone: "info" } : { label: "한도 내 · 승인 불필요", tone: "muted" };
}

// 누가 승인했나 — 보호자 · 어르신 요청은 담당 컨시어지, 제안은 승인 대상, 도와줘요는 관제
function approvalText(r) {
  if (isVisitCall(r)) return "관제 처리 (도와줘요)";
  if (r.approvedAt) return `${r.approvedBy || APPROVER_LABEL[approverOf(r)]} · ${fmtRel(r.approvedAt)}`;
  if (r.status === "requested") return `${APPROVER_LABEL[approverOf(r)]} 승인 대기`;
  if (r.status === "awaitingPayment") return approverOf(r) === "concierge" ? "결제 뒤 컨시어지 승인" : "수락 · 결제 대기";
  return "—";
}

const stars = (n) => "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);

// 이력에 남길 값 표기 — 필드별로 사람이 읽는 형태로
function showVal(field, v) {
  if (v == null || v === "") return "—";
  if (field === "cost") return fmtWon(v);
  if (field === "confirmedAt") return fmtDT(v);
  if (field === "rating") return `${v}점`;
  if (field === "repeat") return v.on ? `반복 · ${v.every}` : "1회 요청";
  if (field === "refund") return `${v.status}${v.reason ? ` · ${v.reason}` : ""}`;
  return String(v);
}

export default function RequestsMgmt() {
  const OPERATOR = useOperator();
  const ctx = useAppState();
  // 상태 훅이 없을 때(단독 렌더)는 고정 빈 배열 — 매 렌더마다 새 배열이면 useMemo 의존성이 계속 바뀐다
  const stateRequests = ctx?.state?.requests || NO_REQUESTS;
  const payments = ctx?.state?.payments || NO_REQUESTS;
  const dispatch = ctx?.dispatch;
  // 가입 상담에서 보호자가 정한 어르신 직접 결제 한도 — 어르신 앱이 보는 값과 같아야 한다 (2026-10-02 QA)
  const obLimit = ctx?.state?.onboarding?.paymentMode === "limit" || (ctx?.state?.onboarding && !ctx.state.onboarding.paymentMode) ? ctx.state.onboarding.limitAmount ?? null : null;
  const [extras, setExtras] = useState(OPS_REQUEST_EXTRAS);
  // 테스트 계정이면 실제 요청(가구 기록)만 기본으로 — 예시 요청(김순자 이름의 예시 포함)이 실제 일처럼 섞이지 않게 (2026-10-02 코드 점검)
  const liveOn = !!useAuth().user?.household;
  const [showDemo, setShowDemo] = useState(null);
  const withDemo = showDemo ?? !liveOn;
  const [meta, setMeta] = useState(OPS_REQUEST_META);
  const [loaded, setLoaded] = useState(false);
  const [group, setGroup] = useState("");
  const [q, setQ] = useState("");
  const [type, setType] = useState("전체");
  const [status, setStatus] = useState("전체");
  const [sort, setSort] = useState(SORTS.recent);
  const [openId, setOpenId] = useState(null);

  // 저장값 복원은 마운트 뒤에 — 서버 프리렌더와 어긋나지 않게
  useEffect(() => {
    try {
      const m = JSON.parse(localStorage.getItem(scopedKey(META_KEY)) || "null");
      if (m && typeof m === "object") setMeta((prev) => ({ ...prev, ...m }));
      const x = JSON.parse(localStorage.getItem(scopedKey(EXTRA_KEY)) || "null");
      if (Array.isArray(x) && x.length) setExtras(x);
    } catch (_) {
      /* 손상된 저장값은 무시 */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(scopedKey(META_KEY), JSON.stringify(meta));
      localStorage.setItem(scopedKey(EXTRA_KEY), JSON.stringify(extras));
    } catch (_) {
      /* 저장 실패는 데모 동작에 영향 없음 */
    }
  }, [meta, extras, loaded]);

  const all = useMemo(
    () => [...stateRequests.map((r) => ({ ...r, real: liveOn, ...(obLimit != null ? { limit: obLimit } : {}) })), ...(withDemo ? extras.map((r) => ({ ...r, demo: liveOn })) : [])].map(normalize),
    [stateRequests, extras, withDemo, liveOn, obLimit]
  );
  const types = useMemo(() => ["전체", ...Array.from(new Set(all.map((r) => r.type)))], [all]);
  const counts = useMemo(() => {
    const c = {};
    Object.entries(GROUPS).forEach(([k, g]) => {
      c[k] = all.filter((r) => g.keys.includes(r.status)).length;
    });
    c.closed += all.filter((r) => meta[r.id]?.refund?.status === "환불 요청" && !GROUPS.closed.keys.includes(r.status)).length;
    return c;
  }, [all, meta]);

  const rows = useMemo(() => {
    const kw = q.trim();
    return all
      .filter((r) => !group || GROUPS[group].keys.includes(r.status) || (group === "closed" && meta[r.id]?.refund?.status === "환불 요청"))
      .filter((r) => type === "전체" || r.type === type)
      .filter((r) => status === "전체" || STATUS[r.status]?.label === status)
      .filter((r) => !kw || [r.elder, r.type, r.detail, r.by, r.assignee].join(" ").includes(kw))
      .sort((x, y) =>
        sort === SORTS.priority
          ? (x.urgency === "urgent" ? 0 : 1) - (y.urgency === "urgent" ? 0 : 1) || STATUS_RANK[x.status] - STATUS_RANK[y.status] || (y.receivedAt || 0) - (x.receivedAt || 0)
          : (y.receivedAt || 0) - (x.receivedAt || 0)
      );
  }, [all, group, type, status, q, meta, sort]);

  const open = openId ? all.find((r) => r.id === openId) : null;

  // 상태 전이 — 앱 상태의 요청은 dispatch, 데모 요청은 같은 transition 으로 로컬 전이
  const doTransition = (r, to, note) => {
    if (!canTransition(r.status, to)) return;
    if (stateRequests.some((s) => s.id === r.id) && dispatch) dispatch({ type: "transitionRequest", id: r.id, to, note });
    else setExtras((prev) => prev.map((x) => (x.id === r.id ? transition(x, to, note) : x)));
  };
  // meta 변경 — 덮어쓰지 않고 변경 이력을 쌓는다 (감사로그 원칙). before 는 호출자가 표시용 문자열로 준다.
  // 앱 상태 요청의 담당자는 공유 상태에 쓴다 (보호자 카드 '담당'이 같이 바뀐다) — 이 기기에는 변경 이력만 남긴다.
  // 값까지 기기에 두면 다른 관제 기기에서 바꾼 담당을 이 기기의 옛 값이 가린다.
  const patchMeta = (id, field, label, after, before) => {
    const shared = field === "assignee" && dispatch && stateRequests.some((s) => s.id === id);
    if (shared) dispatch({ type: "assignRequest", id, assignee: after });
    setMeta((prev) => {
      const cur = prev[id] || {};
      const entry = { at: Date.now(), by: OPERATOR, field: label, before: before ?? "—", after: showVal(field, after) };
      return { ...prev, [id]: { ...cur, ...(shared ? {} : { [field]: after }), changes: [...(cur.changes || []), entry] } };
    });
  };

  const cols = [
    { k: "recv", label: "고객 요청 접수", render: (r) => (
      <div className="min-w-[150px]">
        <div className="flex items-center gap-1.5 font-bold text-navy">{r.elder}{r.real && <Pill tone="gold">실제</Pill>}{r.demo && <span className="text-[11px] font-normal text-muted">예시</span>}{r.urgency === "urgent" && <span className="rounded-full px-1.5 text-[10px] font-bold" style={{ color: URGENCY.urgent.fg, background: URGENCY.urgent.bg }}>긴급</span>}</div>
        <div className="text-[12px] text-muted">{r.by}</div>
        <div className="font-num text-[11px] text-muted">{fmtRel(r.receivedAt)}</div>
      </div>
    ) },
    { k: "type", label: "서비스 종류", render: (r) => (
      <div className="min-w-[130px]">
        <div className="font-semibold text-ink">{r.type}</div>
        <div className="text-[11px] text-muted">{r.menu ? r.menu.cat : "메뉴 외 요청"}</div>
      </div>
    ) },
    { k: "desc", label: "서비스 설명 및 가격", render: (r) => (
      <div className="min-w-[200px] max-w-[260px]">
        <div className="text-[12px] leading-[1.5] text-ink">{r.menu ? r.menu.scope : r.detail}</div>
        <div className="mt-0.5 font-num text-[12px] font-bold text-gold">{r.menu ? r.menu.priceLabel : r.amount != null ? `${fmtWon(r.amount)} (예상)` : "요금 확정 전"}</div>
      </div>
    ) },
    { k: "pay", label: "결제", render: (r) => { const p = payState(r, payments); return <Pill tone={p.tone}>{p.label}</Pill>; } },
    { k: "assignee", label: "담당자 배정", render: (r) => <span className="font-medium text-ink">{meta[r.id]?.assignee || r.assignee || <span className="text-muted">미배정</span>}</span> },
    { k: "approval", label: "승인", render: (r) => <span className="text-[12px]">{approvalText(r)}</span> },
    { k: "date", label: "확정 일정 · 희망", render: (r) => <span className="font-num text-[12px]">{fmtScheduled(r) ? <b className="text-navy">{fmtScheduled(r)}</b> : <span className="text-muted">희망 {fmtPreferred(r)}</span>}{r.hospital ? <span className="block text-[11px] text-muted">{r.hospital}</span> : null}</span> },
    { k: "status", label: "진행상태", render: (r) => <StatusPill status={r.status} /> },
    { k: "cost", label: "실제 비용", align: "right", render: (r) => (meta[r.id]?.cost != null ? fmtWon(meta[r.id].cost) : "—") },
    { k: "receipt", label: "영수증", render: (r) => (meta[r.id]?.receipt ? <Pill tone="ok">첨부</Pill> : <span className="text-muted">—</span>) },
    { k: "confirm", label: "완료 확인", render: (r) => (meta[r.id]?.confirmedAt ? <span className="font-num text-[12px] text-green">{fmtRel(meta[r.id].confirmedAt)}</span> : r.status === "done" ? <Pill tone="warn">확인 대기</Pill> : <span className="text-muted">—</span>) },
    { k: "rating", label: "고객평가", render: (r) => (meta[r.id]?.rating ? <span className="font-num text-[12px] text-gold" aria-label={`${meta[r.id].rating}점`}>{stars(meta[r.id].rating)}</span> : <span className="text-muted">—</span>) },
    { k: "refund", label: "취소 · 환불", render: (r) => (meta[r.id]?.refund ? <Pill tone="info">{meta[r.id].refund.status}</Pill> : r.status === "cancelled" ? <Pill tone="muted">취소</Pill> : r.status === "rejected" ? <Pill tone="muted">처리불가</Pill> : <span className="text-muted">—</span>) },
    { k: "repeat", label: "반복 요청", render: (r) => (meta[r.id]?.repeat?.on ? <Pill tone="gold">반복 · {meta[r.id].repeat.every}</Pill> : <span className="text-muted">—</span>) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-bold text-navy">해주세요 관리</h2>
          <p className="mt-0.5 text-[13px] text-muted">고객 요청의 접수 · 결제 승인 · 배정 · 수행 · 완료 확인 · 평가 · 환불까지 한 줄로 관리합니다</p>
        </div>
        <div className="text-[12px] text-muted">앱 상태 연결 {stateRequests.length}건 · 데모 {extras.length}건{liveOn && !withDemo ? " (숨김)" : ""}</div>
      </div>
      {liveOn && <LiveToggle view={withDemo ? "demo" : "real"} onChange={(k) => setShowDemo(k === "demo")} label="요청 보기" realLabel={`실제 요청만 (${LIVE_TAG})`} demoLabel="예시 요청도 함께" />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {Object.entries(GROUPS).map(([k, g]) => (
          <Stat key={k} label={g.label} value={counts[k]} unit="건" tone={g.tone} active={group === k} onClick={() => setGroup(group === k ? "" : k)} />
        ))}
      </div>

      <Panel className="!py-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1"><Field id="req-q" label="검색" value={q} onChange={setQ} placeholder="고객 · 요청자 · 서비스 · 내용" /></div>
          <div className="w-[220px]"><Field id="req-type" label="서비스 종류" value={type} onChange={setType} options={types} /></div>
          <div className="w-[160px]"><Field id="req-status" label="진행상태" value={status} onChange={setStatus} options={["전체", ...Object.values(STATUS).map((s) => s.label)]} /></div>
          <div className="w-[160px]"><Field id="req-sort" label="정렬" value={sort} onChange={setSort} options={Object.values(SORTS)} /></div>
          <div className="pb-2 text-[12px] text-muted">총 <b className="font-num text-navy">{rows.length}</b>건</div>
        </div>
      </Panel>

      <Panel>
        <PanelHead title="요청 명부" sub={`${sort === SORTS.priority ? "긴급 · 관리자 확인 · 접수 순으로" : "최근에 접수된 요청부터"} 보입니다. 행을 누르면 상세가 열립니다`} right={<span>가격은 서비스 메뉴(lib/requests) 값 그대로</span>} />
        <div className="mt-3">
          <Table cols={cols} rows={rows} onRow={(r) => setOpenId(r.id)} selected={openId} empty="조건에 맞는 요청이 없습니다." />
        </div>
      </Panel>

      <Note>건강 · 센서 데이터는 참고자료이며 의료진의 진단을 대신하지 않습니다. 서비스 가격은 확정된 메뉴 값만 표시하고, 확정 전 항목은 "요금 확정 전"으로 둡니다.</Note>

      {open && (
        <Detail
          r={open}
          m={meta[open.id] || {}}
          real={stateRequests.some((x) => x.id === open.id)}
          payments={payments}
          dispatch={dispatch}
          onClose={() => setOpenId(null)}
          onTransition={doTransition}
          onPatch={patchMeta}
        />
      )}
    </div>
  );
}

function Detail({ r, m, real, payments, dispatch, onClose, onTransition, onPatch }) {
  const OPERATOR = useOperator();
  const paid = paymentOf(payments, r.id);
  const [opsNote, setOpsNote] = useState("");
  const [note, setNote] = useState("");
  const [cost, setCost] = useState(m.cost != null ? String(m.cost) : "");
  const [ratingNote, setRatingNote] = useState(m.ratingNote || "");
  const [confirm, setConfirm] = useState(null); // { kind: 'transition'|'refund', to, reason }
  const [refundReason, setRefundReason] = useState("");
  const pay = payState(r, payments);
  const assignee = m.assignee || r.assignee || "";
  const nextStates = Object.keys(STATUS).filter((k) => canTransition(r.status, k));
  const refundable = r.amount > 0 && !m.refund && ["awaitingPayment", "inProgress", "done"].includes(r.status);

  const timeline = [
    ...r.history.map((h) => ({ at: h.at, title: STATUS[h.status]?.label || h.status, sub: h.note, status: h.status })),
    ...(m.changes || []).map((c) => ({ at: c.at, title: `${c.field} 변경`, sub: `${c.before} → ${c.after} · ${c.by}` })),
  ].sort((x, y) => x.at - y.at);

  const runConfirm = () => {
    if (!confirm) return;
    if (confirm.kind === "transition") onTransition(r, confirm.to, note || confirm.label);
    if (confirm.kind === "force") dispatch?.({ type: "forceCancel", id: r.id, by: OPERATOR, reason: opsNote.trim() || "관제 판단" });
    if (confirm.kind === "cancelOk") dispatch?.({ type: "decideCancel", id: r.id, approve: true, by: OPERATOR, note: opsNote.trim() });
    if (confirm.kind === "refund") {
      onPatch(r.id, "refund", "취소 · 환불", { status: "환불 요청", amount: m.cost ?? r.amount, reason: refundReason, at: Date.now() });
      if (canTransition(r.status, "cancelled")) onTransition(r, "cancelled", `환불 요청 · ${refundReason || "사유 미입력"}`);
    }
    setConfirm(null);
  };

  return (
    <Drawer open onClose={onClose} title={`${r.elder} · ${r.type}`} sub={`${r.by} · ${fmtDT(r.receivedAt)} 접수`} width={600}
      footer={<div className="flex flex-wrap items-center justify-between gap-2"><StatusPill status={r.status} /><span className="text-[11px] text-muted">모든 변경은 이력으로 남고 덮어쓰지 않습니다</span></div>}>
      <div className="space-y-5">
        <section>
          <KV k="요청 내용" v={r.detail} />
          <KV k="서비스 설명" v={r.menu ? r.menu.scope : "메뉴 외 요청 — 관제가 범위를 정합니다"} />
          <KV k="가격" v={r.menu ? r.menu.priceLabel : r.amount != null ? `${fmtWon(r.amount)} (예상)` : "요금 확정 전"} tone="gold" />
          <KV k="희망일" v={fmtPreferred(r)} mono />
          {real && <KV k="확정 일정" v={fmtScheduled(r) || "아직 없음"} mono tone={fmtScheduled(r) ? "ok" : undefined} />}
          {real && <KV k="승인" v={approvalText(r)} />}
          {real && paid && <KV k="결제" v={`${fmtWon(paid.amount)} · ${paid.method || "카드"}${paid.demo ? " (데모 · 실제 결제 없음)" : ""} · ${fmtDT(paid.at || Date.parse(paid.approvedAt) || r.receivedAt)}`} tone="ok" />}
          {real && r.cancelReq && <KV k="취소 요청" v={`${r.cancelReq.by} · ${fmtDT(r.cancelReq.at)}${r.cancelReq.reason ? ` · ${r.cancelReq.reason}` : ""}`} tone="gold" />}
          {r.hospital && <KV k="병원" v={r.hospital} />}
          <KV k="긴급도" v={URGENCY[r.urgency]?.label || "보통"} tone={r.urgency === "urgent" ? "gold" : undefined} />
          <KV k="결제" v={<span className="flex flex-wrap items-center gap-2"><Pill tone={pay.tone}>{pay.label}</Pill><span className="text-[11px] text-muted">{elderOf(r.elder)?.guardian || "보호자"} · 어르신 직접 결제 하루 {fmtWon(r.limit)}까지</span></span>} />
          {r.photos?.length > 0 && <KV k="첨부 사진" v={r.photos.join(", ")} mono />}
          {r.proof && <KV k="완료 증빙" v={r.proof} mono />}
        </section>

        <section>
          <h4 className="mb-2 text-[13px] font-bold text-navy">담당자 배정</h4>
          <Field id={`req-assignee-${r.id}`} label="담당 컨시어지" value={assignee || "미배정"} options={["미배정", ...conciergeChoices(CONCIERGES)]}
            onChange={(v) => v !== (assignee || "미배정") && onPatch(r.id, "assignee", "담당자", v === "미배정" ? "" : v, assignee || "미배정")} />
        </section>

        {real ? (
          <section>
            <h4 className="mb-2 text-[13px] font-bold text-navy">관제 조치</h4>
            {["done", "cancelled", "rejected"].includes(r.status) ? (
              <Empty>종결된 요청입니다.</Empty>
            ) : (
              <>
                <p className="mb-2 text-[12px] leading-[1.6] text-muted">
                  {isVisitCall(r)
                    ? "도와줘요는 대시보드 팝업(지금 처리할 일 › 대응 열기)에서 확인 전화 · 출동 지시 · 해결 완료로 처리합니다."
                    : "승인 · 진행은 담당 컨시어지가 합니다. 관제는 취소 요청을 승인 · 반려하거나 강제 취소합니다."}
                </p>
                <Field id={`req-opsnote-${r.id}`} label="관제 메모 (이력에 남고 요청자에게 보입니다)" value={opsNote} onChange={setOpsNote} placeholder="예: 보호자와 통화 후 취소 승인" />
                <div className="mt-2 flex flex-wrap gap-2">
                  {r.status === "needsAdmin" && (
                    <Btn small tone="navy" onClick={() => dispatch?.({ type: "transitionRequest", id: r.id, to: "requested", note: `관제 확인 — 담당 컨시어지 승인 대기로 (${OPERATOR})`, by: OPERATOR })}>승인 대기로 돌려보내기</Btn>
                  )}
                  {r.status === "cancelRequested" && (
                    <>
                      <Btn small tone="navy" onClick={() => setConfirm({ kind: "cancelOk", label: "취소 승인" })}>취소 요청 승인{paid ? " (환불 대기로)" : ""}</Btn>
                      <Btn small ghost onClick={() => dispatch?.({ type: "decideCancel", id: r.id, approve: false, by: OPERATOR, note: opsNote.trim() })}>취소 요청 반려</Btn>
                    </>
                  )}
                  <Btn small ghost tone="muted" onClick={() => setConfirm({ kind: "force", label: "강제 취소" })}>강제 취소{paid && !paid.refund ? " (환불 대기로)" : ""}</Btn>
                </div>
              </>
            )}
          </section>
        ) : (
        <section>
          <h4 className="mb-2 text-[13px] font-bold text-navy">진행상태 변경 <span className="text-[11px] font-normal text-muted">예시 요청</span></h4>
          {nextStates.length === 0 ? <Empty>종결된 요청입니다 — 더 바꿀 수 있는 상태가 없습니다.</Empty> : (
            <>
              <Field id={`req-note-${r.id}`} label="변경 메모 (이력에 남습니다)" value={note} onChange={setNote} placeholder="예: 보호자 승인 완료 · 컨시어지 진행" />
              <div className="mt-2 flex flex-wrap gap-2">
                {nextStates.map((k) => {
                  const risky = k === "cancelled" || k === "rejected";
                  return (
                    <Btn key={k} small ghost={risky} tone={k === "done" ? "ok" : risky ? "muted" : k === "needsAdmin" ? "warn" : "navy"}
                      onClick={() => (risky ? setConfirm({ kind: "transition", to: k, label: STATUS[k].label }) : onTransition(r, k, note))}>
                      {STATUS[k].label}
                    </Btn>
                  );
                })}
              </div>
            </>
          )}
        </section>
        )}

        <section>
          <h4 className="mb-2 text-[13px] font-bold text-navy">실제 비용 · 영수증</h4>
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-[180px]"><Field id={`req-cost-${r.id}`} label="실제 비용 (원)" type="number" value={cost} onChange={setCost} placeholder="현장 결제 금액" /></div>
            <Btn small onClick={() => cost !== "" && Number(cost) !== m.cost && onPatch(r.id, "cost", "실제 비용", Number(cost), m.cost != null ? fmtWon(m.cost) : "—")}>비용 저장</Btn>
            {m.receipt ? <Pill tone="ok">영수증 {m.receipt}</Pill> : <Btn small ghost onClick={() => onPatch(r.id, "receipt", "영수증", `receipt-${r.id}.jpg`, "없음")}><Icon name="doc" size={14} /> 영수증 첨부 (표시만)</Btn>}
          </div>
          {r.amount != null && m.cost != null && m.cost !== r.amount && <p className="mt-1.5 text-[11px] text-muted">예상 {fmtWon(r.amount)} → 실제 {fmtWon(m.cost)} · 차액은 정산에 반영</p>}
        </section>

        <section>
          <h4 className="mb-2 text-[13px] font-bold text-navy">완료 확인 · 고객평가</h4>
          {m.confirmedAt ? <KV k="완료 확인" v={`${fmtDT(m.confirmedAt)} · ${m.confirmedBy || OPERATOR}`} tone="ok" /> : r.status === "done" ? (
            <Btn small tone="ok" onClick={() => { onPatch(r.id, "confirmedAt", "완료 확인", Date.now(), "미확인"); onPatch(r.id, "confirmedBy", "완료 확인자", OPERATOR, "—"); }}>완료 확인 (보호자 확인 대행)</Btn>
          ) : <Empty>완료 상태가 되면 확인할 수 있습니다.</Empty>}
          <div className="mt-2 flex flex-wrap items-center gap-1" role="group" aria-label="고객평가">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" aria-label={`${n}점`} aria-pressed={m.rating === n} onClick={() => onPatch(r.id, "rating", "고객평가", n, m.rating ? `${m.rating}점` : "없음")}
                className="btn-press btn-inline px-1 text-[20px]" style={{ color: (m.rating || 0) >= n ? "#B08D57" : "rgba(10,31,60,.2)" }}>★</button>
            ))}
            <span className="ml-1 text-[12px] text-muted">{m.rating ? `${m.rating}점` : "평가 전"}</span>
          </div>
          <div className="mt-2 flex items-end gap-2">
            <div className="flex-1"><Field id={`req-rating-note-${r.id}`} label="평가 메모" value={ratingNote} onChange={setRatingNote} placeholder="고객 · 보호자 의견" /></div>
            <Btn small ghost onClick={() => ratingNote !== (m.ratingNote || "") && onPatch(r.id, "ratingNote", "평가 메모", ratingNote, m.ratingNote || "—")}>저장</Btn>
          </div>
        </section>

        <section>
          <h4 className="mb-2 text-[13px] font-bold text-navy">취소 · 환불</h4>
          {real ? (
            paid?.refund ? (
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={paid.refund.status === "done" ? "ok" : "warn"}>{paid.refund.status === "done" ? "환불 완료" : "환불 대기"} {fmtWon(paid.refund.amount)}</Pill>
                <span className="text-[11px] text-muted">{paid.refund.reason}</span>
                {paid.refund.status !== "done" && (
                  <Btn small tone="ok" onClick={() => dispatch?.({ type: "refundDone", paymentId: paid.id, by: OPERATOR })}>토스에서 환불함 · 환불 완료</Btn>
                )}
              </div>
            ) : paid ? (
              <Empty>결제 완료 {fmtWon(paid.amount)} — 거절 · 취소되면 여기서 환불 대기로 넘어옵니다.</Empty>
            ) : (
              <Empty>{r.payBy === "elder" ? "어르신 직접 결제 — 카드 결제 기록이 없어 환불 처리 대상이 아닙니다." : "결제 기록 없음."}</Empty>
            )
          ) : m.refund ? <KV k={m.refund.status} v={`${m.refund.amount ? fmtWon(m.refund.amount) : "—"} · ${m.refund.reason || "사유 미입력"}`} tone="info" /> : refundable ? (
            <div className="flex items-end gap-2">
              <div className="flex-1"><Field id={`req-refund-${r.id}`} label="사유" value={refundReason} onChange={setRefundReason} placeholder="예: 보호자 요청 · 일정 변경" /></div>
              <Btn small ghost tone="muted" onClick={() => setConfirm({ kind: "refund" })}>취소 · 환불 요청</Btn>
            </div>
          ) : <Empty>{r.amount ? "이 상태에서는 환불 대상이 아닙니다." : "무료 서비스 — 환불 대상 없음."}</Empty>}
        </section>

        <section>
          <h4 className="mb-2 text-[13px] font-bold text-navy">반복 요청 설정</h4>
          <div className="flex flex-wrap items-center gap-3">
            <Toggle id={`req-repeat-${r.id}`} on={!!m.repeat?.on} label="반복 요청" onChange={(on) => onPatch(r.id, "repeat", "반복 요청", { on, every: m.repeat?.every || REPEAT_OPTIONS[0] }, m.repeat?.on ? `반복 · ${m.repeat.every}` : "없음")} />
            <span className="text-[13px] text-ink">{m.repeat?.on ? "반복 중" : "1회 요청"}</span>
            {m.repeat?.on && (
              <div className="w-[140px]"><Field id={`req-every-${r.id}`} label="주기" value={m.repeat.every} options={REPEAT_OPTIONS} onChange={(v) => onPatch(r.id, "repeat", "반복 주기", { on: true, every: v }, `반복 · ${m.repeat.every}`)} /></div>
            )}
          </div>
        </section>

        <section>
          <h4 className="mb-2 text-[13px] font-bold text-navy">이력 <span className="font-num text-[11px] text-muted">{timeline.length}</span></h4>
          <ol className="space-y-2">
            {timeline.map((t, i) => (
              <li key={i} className="flex items-start gap-3 text-[12px]">
                <span className="w-[86px] shrink-0 font-num text-muted">{fmtDT(t.at)}</span>
                <span className="min-w-0 flex-1">
                  {t.status ? <StatusPill status={t.status} /> : <b className="text-ink">{t.title}</b>}
                  {t.sub && <span className="ml-2 text-muted">{t.sub}</span>}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <Confirm open={!!confirm} onCancel={() => setConfirm(null)} onConfirm={runConfirm}
        title={confirm?.kind === "refund" ? "취소 · 환불을 요청합니다" : confirm?.kind === "force" ? "강제 취소합니다" : confirm?.kind === "cancelOk" ? "취소 요청을 승인합니다" : `상태를 '${confirm?.label}'로 바꿉니다`}
        body={confirm?.kind === "refund" ? `${r.elder} · ${r.type} — 환불 요청이 기록되고, 가능하면 요청이 취소 상태로 바뀝니다. 되돌릴 수 없습니다.` : confirm?.kind === "force" || confirm?.kind === "cancelOk" ? `${r.elder} · ${r.type} — 요청이 취소되고${paid && !paid.refund ? `, 결제 ${fmtWon(paid.amount)}은 환불 대기로 넘어갑니다` : ""}. 보호자 · 어르신 · 컨시어지 화면에 같이 반영되고 되돌릴 수 없습니다.` : "종결 상태로 바뀌면 다시 진행할 수 없습니다. 메모가 이력에 남습니다."}
        confirmLabel={confirm?.kind === "refund" ? "환불 요청" : confirm?.label} tone="navy" />
    </Drawer>
  );
}
