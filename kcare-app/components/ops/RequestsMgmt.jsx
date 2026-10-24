// 해주세요 관리 — 요청서 §12. 앱 상태(state.requests)의 요청은 그대로 연결하고,
// 2026-10-05 운영 결정: 보호자 · 어르신 해주세요는 담당 컨시어지가 승인하고, 관제는 현황(승인 내역 · 결제액)을 보며
// 강제 취소 · 취소 요청 승인 · 환불 처리만 한다. 실제 요청의 상태를 관제가 임의로 넘기지 않는다.
// 2026-10-22 시제품 v17: 결제 → 컨시어지 확인 → 관제 승인 → 일정 확정. 컨시어지가 확인한 일정은 여기서 승인하거나(확정)
// 사유를 적어 다시 맞추게 한다. 추가 이용 금액(예약한 시간보다 길어진 서비스)은 아래 표 — 결제 대기 · 수납 · 기한 지남 · 취소.
// 다른 고객의 데모 요청(lib/ops-admin OPS_REQUEST_EXTRAS)은 컴포넌트 안에서 같은 전이 규칙으로 움직인다.
// 앱 상태에 없는 열(실제 비용·영수증·완료 확인·평가·환불·반복)은 id 별 meta 로 보관하고 localStorage 에 남긴다
// (§19 "새로고침 후에도 입력내용 유지").
import { scopedKey } from "../../lib/scope";
import { useEffect, useMemo, useState } from "react";
import Icon from "../icons";
import { useAppState } from "../../lib/state";
import { useAuth } from "../../lib/auth";
import { LiveToggle } from "./LiveToggle";
import { APPROVER_LABEL, STATUS, SERVICE_MENU, URGENCY, approverOf, canTransition, crewOf, crewReady, fmtPreferred, fmtScheduled, isVisitCall, paymentOf, transition } from "../../lib/requests";
import { addMin, clock12, dateLabel, durText, extraDueYmd, extraOverdue, extraStateText, extraToText, peopleText, svcTitle } from "../../lib/booking";
import { fmtWon } from "../../lib/config";
import { Panel, PanelHead, Stat, Pill, Btn, Table, KV, Field, Toggle, Drawer, Confirm, Note, Empty, useOperator } from "./ui";
import { CONCIERGES, OPS_REQUEST_EXTRAS, OPS_REQUEST_META, REQ_DIR, REPEAT_OPTIONS, elderOf, fmtDT, fmtRel } from "../../lib/ops-admin";
import { LIVE_TAG } from "../../lib/live-household";
import { LIVE_ELDER } from "../../lib/ops-health";
import { conciergeChoices } from "../../lib/people";
import { clock, playErrorText, useVoicePlayer } from "../../lib/voice-client";

const META_KEY = "kcare-ops-requests-meta-v1";
const EXTRA_KEY = "kcare-ops-requests-extra-v1";
const NO_REQUESTS = [];

// 정렬 — 기본은 최근 접수 순 (2026-10-05: 보호자가 방금 넣은 요청이 긴급 · 완료 건 밑에 묻혀 바로 안 보였다).
// '처리 우선 순'은 예외를 먼저 — 긴급 → 관리자 확인 → 접수 → 결제대기 → 확인 → 처리중 → 완료 → 종결
const SORTS = { recent: "최근 접수 순", priority: "처리 우선 순" };
const STATUS_RANK = { needsAdmin: 0, cancelRequested: 0, opsReview: 1, requested: 1, awaitingPayment: 2, confirmed: 3, inProgress: 4, done: 5, rejected: 6, cancelled: 7 };
const GROUPS = {
  received: { label: "접수 · 확정", keys: ["requested", "confirmed", "needsAdmin", "cancelRequested"], tone: "navy" },
  opsReview: { label: "관제 승인 대기", keys: ["opsReview"], tone: "warn" },
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
  return { ...r, elder, by, receivedAt: r.history?.[0]?.at ?? null, menu: SERVICE_MENU.find((s) => s.name === r.type) || null };
}

// 서비스 이름 — 메뉴 이름 · 함께가요 인원 ('함께가요 · 3명' · 2026-10-22)
const svcName = (r) => [svcTitle(r.type), peopleText(r)].filter(Boolean).join(" · ");

// 결제 상태 — 금액·진행상태에서 읽는다. 지어내지 않고 없는 값은 "요금 확정 전".
// 2026-10-22부터 가족 누구나 금액 제한 없이 결제한다 — 어르신 하루 한도 · 보호자 승인 단계는 없앴다.
function payState(r, payments) {
  const paid = paymentOf(payments, r.id);
  if (paid?.refund) return paid.refund.status === "done" ? { label: `환불 완료 ${fmtWon(paid.refund.amount)}`, tone: "ok" } : { label: `환불 대기 ${fmtWon(paid.refund.amount)}`, tone: "warn" };
  if (paid) return { label: `결제 완료 ${fmtWon(paid.amount)}${paid.demo ? " (데모)" : ""}`, tone: "ok" };
  if (r.payBy === "elder" && r.amount > 0) return { label: `어르신 직접 ${fmtWon(r.amount)}`, tone: "muted" };
  if (r.amount == null) return { label: "요금 확정 전", tone: "muted" };
  if (r.amount === 0) return { label: "승인 불필요 (무료)", tone: "muted" };
  if (r.status === "awaitingPayment") return { label: "가족 결제 대기", tone: "warn" };
  if (r.status === "cancelled" || r.status === "rejected") return { label: "—", tone: "muted" };
  return { label: "결제 전", tone: "muted" };
}

// 누가 확인 · 승인했나 — 보호자 · 어르신 요청은 담당 컨시어지 확인 → 관제 승인, 제안은 승인 대상, 도와줘요는 관제
function approvalText(r) {
  if (isVisitCall(r)) return "관제 처리 (도와줘요)";
  if (r.opsApprovedAt) return `${r.approvedBy || "담당 컨시어지"} 확인 · 관제 승인 ${r.opsApprovedBy || ""} · ${fmtRel(r.opsApprovedAt)}`;
  if (r.status === "opsReview") return `${r.approvedBy || "담당 컨시어지"} 확인 · 관제 승인 대기`;
  if (r.approvedAt && r.status !== "awaitingPayment") return `${r.approvedBy || APPROVER_LABEL[approverOf(r)]} · ${fmtRel(r.approvedAt)}`;
  if (r.status === "requested") return approverOf(r) === "concierge" ? "담당 컨시어지 확인 대기" : `${APPROVER_LABEL[approverOf(r)]} 수락 대기`;
  if (r.status === "awaitingPayment") return approverOf(r) !== "concierge" ? "수락 · 결제 대기" : r.approvedAt ? "결제 뒤 관제 승인" : "결제 뒤 컨시어지 확인";
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
  const charges = ctx?.state?.extraCharges || NO_REQUESTS;
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
    () => [...stateRequests.map((r) => ({ ...r, real: liveOn })), ...(withDemo ? extras.map((r) => ({ ...r, demo: liveOn })) : [])].map(normalize),
    [stateRequests, extras, withDemo, liveOn]
  );
  const types = useMemo(() => ["전체", ...Array.from(new Set(all.map((r) => r.type)))], [all]);
  const counts = useMemo(() => {
    const c = {};
    Object.entries(GROUPS).forEach(([k, g]) => {
      c[k] = all.filter((r) => g.keys.includes(r.status)).length;
    });
    c.closed += all.filter((r) => meta[r.id]?.refund?.status === "환불 요청" && !GROUPS.closed.keys.includes(r.status)).length;
    // 결제 대기에는 추가 이용 금액 결제 대기도 센다 (2026-10-22)
    c.extraWait = charges.filter((x) => x.status === "pending").length;
    c.awaitingPayment += c.extraWait;
    return c;
  }, [all, meta, charges]);
  const [xOpenId, setXOpenId] = useState(null);
  const xOpen = xOpenId ? charges.find((x) => x.id === xOpenId) || null : null;

  const rows = useMemo(() => {
    const kw = q.trim();
    return all
      .filter((r) => !group || GROUPS[group].keys.includes(r.status) || (group === "closed" && meta[r.id]?.refund?.status === "환불 요청"))
      .filter((r) => type === "전체" || r.type === type)
      .filter((r) => status === "전체" || STATUS[r.status]?.label === status)
      .filter((r) => !kw || [r.elder, r.type, svcTitle(r.type), r.detail, r.by, r.assignee].join(" ").includes(kw))
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
        <div className="font-semibold text-ink">{svcName(r)}</div>
        <div className="text-[11px] text-muted">{r.menu ? r.menu.cat : "메뉴 외 요청"}</div>
      </div>
    ) },
    { k: "desc", label: "서비스 설명 및 가격", render: (r) => (
      <div className="min-w-[200px] max-w-[260px]">
        <div className="text-[12px] leading-[1.5] text-ink">{r.menu ? r.menu.scope : r.detail}</div>
        <div className="mt-0.5 font-num text-[12px] font-bold text-gold">
          {Number(r.durationMin) > 0 && r.amount != null ? `${durText(r.durationMin)} · ${fmtWon(r.amount)}` : r.menu ? r.menu.priceLabel : r.amount != null ? `${fmtWon(r.amount)} (예상)` : "요금 확정 전"}
        </div>
      </div>
    ) },
    { k: "pay", label: "결제", render: (r) => { const p = payState(r, payments); return <Pill tone={p.tone}>{p.label}</Pill>; } },
    { k: "assignee", label: "담당자 배정", render: (r) => <span className="font-medium text-ink">{meta[r.id]?.assignee || r.assignee || <span className="text-muted">미배정</span>}</span> },
    { k: "approval", label: "승인", render: (r) => (
      <span className="text-[12px]">
        {approvalText(r)}
        {/* 관제는 새 해주세요를 '확인'만 한다 (2026-10-14) — 확인 전이면 표시 */}
        {r.real && !isVisitCall(r) && !r.opsAck && ["requested", "awaitingPayment"].includes(r.status) && <span className="ml-1"><Pill tone="warn">관제 확인 전</Pill></span>}
      </span>
    ) },
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
          <p className="mt-0.5 text-[13px] text-muted">고객 요청의 접수 · 결제 · 컨시어지 확인 · 관제 승인 · 수행 · 완료 확인 · 평가 · 환불 · 추가 이용 금액까지 한 줄로 관리합니다</p>
        </div>
        <div className="text-[12px] text-muted">앱 상태 연결 {stateRequests.length}건 · 데모 {extras.length}건{liveOn && !withDemo ? " (숨김)" : ""}</div>
      </div>
      {liveOn && <LiveToggle view={withDemo ? "demo" : "real"} onChange={(k) => setShowDemo(k === "demo")} label="요청 보기" realLabel={`실제 요청만 (${LIVE_TAG})`} demoLabel="예시 요청도 함께" />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Object.entries(GROUPS).map(([k, g]) => (
          <Stat
            key={k}
            label={g.label}
            value={counts[k]}
            unit="건"
            tone={g.tone}
            sub={k === "awaitingPayment" && counts.extraWait ? `추가 이용 금액 ${counts.extraWait}건 포함` : undefined}
            active={group === k}
            onClick={() => setGroup(group === k ? "" : k)}
          />
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

      <ExtraChargesPanel charges={charges} onRow={(x) => setXOpenId(x.id)} selected={xOpenId} />

      <Note>건강 · 센서 데이터는 참고자료이며 의료진의 진단을 대신하지 않습니다. 서비스 가격은 확정된 메뉴 값만 표시하고, 확정 전 항목은 "요금 확정 전"으로 둡니다.</Note>

      {xOpen && <ExtraDetail x={xOpen} liveOn={liveOn} dispatch={dispatch} onClose={() => setXOpenId(null)} />}

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

// 말로 남기신 부탁 — 관제도 들을 수 있다. 글은 담당 컨시어지가 듣고 정리한 한 줄 (받아쓰기 아님)
function VoiceDetail({ r }) {
  const player = useVoicePlayer();
  const key = `ops-${r.id}`;
  const clip = r.voice?.clip;
  return (
    <section className="rounded-xl border border-gold/30 bg-[#FBF6EC] p-3">
      <div className="text-[12px] font-bold text-[#7A5C28]">어르신 목소리 {clip ? clock(clip.secs || 0) : ""}</div>
      <p className="mt-1 text-[13px] leading-[1.6] text-ink">{r.summary?.text ? `“${r.summary.text}” — ${r.summary.by || "담당 컨시어지"} 정리` : "아직 담당 컨시어지가 정리하지 않았습니다."}</p>
      {clip ? (
        <Btn small tone="navy" onClick={() => player.play(key, { clip })}>{player.playing === key ? "멈추기" : player.busy === key ? "받는 중…" : "목소리 듣기"}</Btn>
      ) : (
        <p className="text-[11.5px] text-muted">녹음 기능 전에 남은 요청 — 소리가 없습니다.</p>
      )}
      {player.failed?.key === key && <p role="alert" className="mt-1 text-[11.5px] font-bold text-amber">{playErrorText(player.failed.code)}</p>}
    </section>
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
  const reqPays = (payments || []).filter((p) => p.ref === r.id && p.status === "done");
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
    // 강제 취소 · 취소 요청 반려는 사유가 있어야 한다 — 요청한 분에게 보이는 이력에 남는다 (2026-10-19 점검 OPS-06 · L-09)
    if (confirm.kind === "force" && opsNote.trim()) dispatch?.({ type: "forceCancel", id: r.id, by: OPERATOR, reason: opsNote.trim() });
    if (confirm.kind === "cancelReject" && opsNote.trim()) dispatch?.({ type: "decideCancel", id: r.id, approve: false, by: OPERATOR, note: opsNote.trim() });
    if (confirm.kind === "cancelOk") dispatch?.({ type: "decideCancel", id: r.id, approve: true, by: OPERATOR, note: opsNote.trim() });
    if (confirm.kind === "refundDone") dispatch?.({ type: "refundDone", paymentId: confirm.paymentId, by: OPERATOR });
    if (confirm.kind === "opsReturn" && opsNote.trim()) dispatch?.({ type: "opsReturnRequest", id: r.id, by: OPERATOR, reason: opsNote.trim() });
    if (confirm.kind === "refund") {
      onPatch(r.id, "refund", "취소 · 환불", { status: "환불 요청", amount: m.cost ?? r.amount, reason: refundReason, at: Date.now() });
      if (canTransition(r.status, "cancelled")) onTransition(r, "cancelled", `환불 요청 · ${refundReason || "사유 미입력"}`);
    }
    setConfirm(null);
  };

  return (
    <Drawer open onClose={onClose} title={`${r.elder} · ${svcName(r)}`} sub={`${r.by} · ${fmtDT(r.receivedAt)} 접수`} width={600}
      footer={<div className="flex flex-wrap items-center justify-between gap-2"><StatusPill status={r.status} /><span className="text-[11px] text-muted">모든 변경은 이력으로 남고 덮어쓰지 않습니다</span></div>}>
      <div className="space-y-5">
        {real && r.voice && <VoiceDetail r={r} />}
        {real && !isVisitCall(r) && ["requested", "awaitingPayment"].includes(r.status) && (
          <section className="rounded-xl border border-navy/[.08] bg-navy/[.03] p-3">
            {r.opsAck ? (
              <p className="text-[12.5px] text-ink">관제 확인 · {r.opsAck.by} · {fmtDT(r.opsAck.at)} — 승인은 담당 컨시어지가 합니다.</p>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[12.5px] text-ink">새 해주세요 — 승인은 담당 컨시어지가 하고, 관제는 받았다는 것을 확인합니다.</span>
                <Btn small tone="navy" onClick={() => dispatch?.({ type: "opsAckRequest", id: r.id, by: OPERATOR })}>관제 확인</Btn>
              </div>
            )}
          </section>
        )}
        <section>
          <KV k="요청 내용" v={r.detail} />
          <KV k="서비스 설명" v={r.menu ? r.menu.scope : "메뉴 외 요청 — 관제가 범위를 정합니다"} />
          <KV k="가격" v={r.menu ? r.menu.priceLabel : r.amount != null ? `${fmtWon(r.amount)} (예상)` : "요금 확정 전"} tone="gold" />
          {Number(r.durationMin) > 0 && (
            <KV
              k="이용 시간"
              v={`${durText(r.durationMin)}${r.scheduledTime || r.preferredTime ? ` · ${clock12(r.scheduledTime || r.preferredTime)}~${clock12(addMin(r.scheduledTime || r.preferredTime, r.durationMin))}` : ""}${Number(r.extraPeople) > 0 ? ` · ${Number(r.extraPeople) + 1}명 (추가 ${r.extraPeople}명)` : ""} · ${r.amount != null ? fmtWon(r.amount) : "—"}`}
              mono
            />
          )}
          {r.nextAppt && <KV k="다음 외래" v={`${r.nextAppt.title || "진료"} — 컨시어지가 등록한 진료 예정일`} />}
          <KV k="희망일" v={fmtPreferred(r)} mono />
          {real && <KV k="확정 일정" v={fmtScheduled(r) || "아직 없음"} mono tone={fmtScheduled(r) ? "ok" : undefined} />}
          {real && <KV k="승인" v={approvalText(r)} />}
          {real && paid && <KV k="결제" v={`${fmtWon(paid.amount)} · ${paid.method || "카드"}${paid.demo ? " (데모 · 실제 결제 없음)" : ""} · ${fmtDT(paid.at || Date.parse(paid.approvedAt) || r.receivedAt)}`} tone="ok" />}
          {real && r.cancelReq && <KV k="취소 요청" v={`${r.cancelReq.by} · ${fmtDT(r.cancelReq.at)}${r.cancelReq.reason ? ` · ${r.cancelReq.reason}` : ""}`} tone="gold" />}
          {r.hospital && <KV k="병원" v={r.hospital} />}
          <KV k="긴급도" v={URGENCY[r.urgency]?.label || "보통"} tone={r.urgency === "urgent" ? "gold" : undefined} />
          <KV k="결제" v={<span className="flex flex-wrap items-center gap-2"><Pill tone={pay.tone}>{pay.label}</Pill><span className="text-[11px] text-muted">가족 누구나 금액 제한 없이 결제</span></span>} />
          {r.photos?.length > 0 && <KV k="첨부 사진" v={r.photos.join(", ")} mono />}
          {r.proof && <KV k="완료 증빙" v={r.proof} mono />}
        </section>

        <section>
          <h4 className="mb-2 text-[13px] font-bold text-navy">담당자 배정</h4>
          {/* 끝난 요청의 담당은 처리 기록이라 바꾸지 않는다 (2026-10-18) */}
          {real && ["done", "cancelled", "rejected"].includes(r.status) ? (
            <KV k="담당 컨시어지" v={`${assignee || "미배정"} — 종결된 요청이라 기록으로 남습니다`} />
          ) : (
            <Field id={`req-assignee-${r.id}`} label="담당 컨시어지" value={assignee || "미배정"} options={["미배정", ...conciergeChoices(CONCIERGES)]}
              onChange={(v) => v !== (assignee || "미배정") && onPatch(r.id, "assignee", "담당자", v === "미배정" ? "" : v, assignee || "미배정")} />
          )}
          {/* 2인 해주세요의 짝 — 확정 · 진행 중에는 두 사람이 다르게 남아 있어야 바뀐다 (단독 배차 0 · 2026-10-19 점검) */}
          {real && crewOf(r) === 2 && !["done", "cancelled", "rejected"].includes(r.status) && (
            <div className="mt-2">
              <Field
                id={`req-partner-${r.id}`}
                label="짝 (2인 1조)"
                value={r.partner || "미정"}
                options={["미정", ...conciergeChoices(CONCIERGES).filter((n) => n !== assignee)]}
                onChange={(v) => {
                  const next = v === "미정" ? "" : v;
                  if (next === (r.partner || "")) return;
                  dispatch?.({ type: "assignRequest", id: r.id, partner: next });
                  onPatch(r.id, "partner", "짝", next || "미정", r.partner || "미정");
                }}
              />
              {!crewReady({ ...r, assignee }) && (
                <p className="mt-1 text-[11.5px] font-bold text-amber">2인 1조 서비스 — 담당과 다른 짝이 정해져야 확정 · 진행됩니다.</p>
              )}
            </div>
          )}
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
                    : "확인 · 진행은 담당 컨시어지가 합니다. 관제는 컨시어지가 확인한 일정을 승인(확정)하거나 다시 맞추게 하고, 취소 요청을 승인 · 반려하거나 강제 취소합니다."}
                </p>
                {r.status === "opsReview" && (
                  <div className="mb-2 rounded-xl border border-gold/40 bg-[#FBF6EC] p-3">
                    <div className="text-[12.5px] font-bold text-navy">
                      관제 승인 대기 — {r.approvedBy || "담당 컨시어지"} 확인 · {fmtScheduled(r) || "일정 미정"}
                      {r.partner ? ` · 2인 ${r.assignee} · ${r.partner}` : ""}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Btn small tone="navy" disabled={!crewReady({ ...r, assignee })} onClick={() => dispatch?.({ type: "opsApproveRequest", id: r.id, by: OPERATOR, note: opsNote.trim() })}>
                        관제 승인 · 일정 확정
                      </Btn>
                      <Btn small ghost disabled={!opsNote.trim()} title={opsNote.trim() ? "" : "관제 메모에 다시 맞출 사유를 적어 주세요"} onClick={() => setConfirm({ kind: "opsReturn", label: "다시 맞추기" })}>
                        다시 맞추기 (컨시어지 확인으로)
                      </Btn>
                    </div>
                    <p className="mt-1.5 text-[11.5px] text-muted">다시 맞추기는 관제 메모(사유)를 적어야 누를 수 있습니다 — 사유가 담당 컨시어지 확인 칸과 요청한 분의 이력에 보입니다. 결제는 그대로 둡니다.</p>
                  </div>
                )}
                <Field id={`req-opsnote-${r.id}`} label="관제 메모 (이력에 남고 요청자에게 보입니다)" value={opsNote} onChange={setOpsNote} placeholder="예: 보호자와 통화 후 취소 승인" />
                <div className="mt-2 flex flex-wrap gap-2">
                  {/* 메모만 — 상태는 그대로 두고 처리 이력에 한 줄 (남긴 메모는 기록이라 고치거나 지우지 않는다 · 2026-10-18) */}
                  <Btn small ghost disabled={!opsNote.trim()} onClick={() => {
                    dispatch?.({ type: "noteRequest", id: r.id, note: `관제 메모 (${OPERATOR}) — ${opsNote.trim()}`, by: OPERATOR });
                    setOpsNote("");
                  }}>메모만 남기기</Btn>
                  {r.status === "needsAdmin" && crewOf(r) === 2 && r.approvedAt ? (
                    // 수락 · 결제까지 끝난 2인 제안 — 짝을 정하면 관제가 확정한다 (컨시어지 승인 대기로 보내면 다시 보호자 수락을 기다린다)
                    <Btn small tone="navy" disabled={!crewReady({ ...r, assignee })} onClick={() => dispatch?.({ type: "transitionRequest", id: r.id, to: "confirmed", note: `관제 확인 — 짝 ${r.partner} 배정 · 확정 (${OPERATOR})`, by: OPERATOR })}>
                      짝 배정 확인 · 확정
                    </Btn>
                  ) : r.status === "needsAdmin" ? (
                    <Btn small tone="navy" onClick={() => dispatch?.({ type: "transitionRequest", id: r.id, to: "requested", note: `관제 확인 — 담당 컨시어지 승인 대기로 (${OPERATOR})`, by: OPERATOR })}>승인 대기로 돌려보내기</Btn>
                  ) : null}
                  {r.status === "cancelRequested" && (
                    <>
                      <Btn small tone="navy" onClick={() => setConfirm({ kind: "cancelOk", label: "취소 승인" })}>취소 요청 승인{paid ? " (환불 대기로)" : ""}</Btn>
                      <Btn small ghost disabled={!opsNote.trim()} title={opsNote.trim() ? "" : "관제 메모에 반려 사유를 적어 주세요"} onClick={() => setConfirm({ kind: "cancelReject", label: "취소 요청 반려" })}>취소 요청 반려</Btn>
                    </>
                  )}
                  <Btn small ghost tone="muted" disabled={!opsNote.trim()} title={opsNote.trim() ? "" : "관제 메모에 취소 사유를 적어 주세요"} onClick={() => setConfirm({ kind: "force", label: "강제 취소" })}>강제 취소{paid && !paid.refund ? " (환불 대기로)" : ""}</Btn>
                </div>
                <p className="mt-1.5 text-[11.5px] text-muted">
                  {r.status === "cancelRequested" ? "취소 요청 반려 · " : ""}강제 취소는 관제 메모(사유)를 적어야 누를 수 있습니다 — 사유는 요청한 분의 이력에 남습니다.
                </p>
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
            // 이 요청의 결제를 모두 보인다 — 금액이 다른 결제 · 두 번 결제처럼 환불 대기가 최신 결제 뒤에 가려지지 않게 (2026-10-19 점검)
            reqPays.length ? (
              <ul className="space-y-2">
                {reqPays.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-2">
                    {p.refund ? (
                      <>
                        <Pill tone={p.refund.status === "done" ? "ok" : "warn"}>{p.refund.status === "done" ? "환불 완료" : "환불 대기"} {fmtWon(p.refund.amount)}</Pill>
                        <span className="text-[11px] text-muted">{p.refund.reason}</span>
                        {p.refund.status !== "done" && (
                          <Btn small tone="ok" onClick={() => setConfirm({ kind: "refundDone", paymentId: p.id, amount: p.refund.amount, label: "환불 완료" })}>토스에서 환불함 · 환불 완료</Btn>
                        )}
                      </>
                    ) : (
                      <span className="text-[12px] text-ink">결제 완료 {fmtWon(p.amount)}{p.demo ? " (데모)" : ""} — 거절 · 취소되면 여기서 환불 대기로 넘어옵니다.</span>
                    )}
                  </li>
                ))}
              </ul>
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
        title={confirm?.kind === "refundDone" ? `${fmtWon(confirm.amount)} 환불을 완료로 기록합니다` : confirm?.kind === "opsReturn" ? "일정을 다시 맞추게 합니다" : confirm?.kind === "cancelReject" ? "취소 요청을 반려합니다" : confirm?.kind === "refund" ? "취소 · 환불을 요청합니다" : confirm?.kind === "force" ? "강제 취소합니다" : confirm?.kind === "cancelOk" ? "취소 요청을 승인합니다" : `상태를 '${confirm?.label}'로 바꿉니다`}
        body={confirm?.kind === "refundDone" ? "토스페이먼츠 상점관리자에서 이 결제를 실제로 환불(취소)한 뒤에 누르세요. 보호자 화면에 '환불 완료'로 바뀌고 되돌릴 수 없습니다." : confirm?.kind === "opsReturn" ? `${r.elder} · ${svcName(r)} — 담당 컨시어지 확인 단계로 돌아갑니다. 사유 "${opsNote.trim()}"가 컨시어지 확인 칸과 요청한 분의 이력에 남고, 결제는 그대로입니다.` : confirm?.kind === "cancelReject" ? `${r.elder} · ${svcName(r)} — 요청은 원래 상태(확정 · 진행)로 돌아가고, 사유 "${opsNote.trim()}"가 요청한 분의 이력에 남습니다.` : confirm?.kind === "refund" ? `${r.elder} · ${svcName(r)} — 환불 요청이 기록되고, 가능하면 요청이 취소 상태로 바뀝니다. 되돌릴 수 없습니다.` : confirm?.kind === "force" || confirm?.kind === "cancelOk" ? `${r.elder} · ${svcName(r)} — 요청이 취소됩니다${paid && !paid.refund ? ` (결제 ${fmtWon(paid.amount)}은 환불 대기로 넘어갑니다)` : ""}. 사유: ${opsNote.trim() || "—"} · 보호자 · 어르신 · 컨시어지 화면에 같이 반영되고 되돌릴 수 없습니다.` : "종결 상태로 바뀌면 다시 진행할 수 없습니다. 메모가 이력에 남습니다."}
        confirmLabel={confirm?.kind === "refund" ? "환불 요청" : confirm?.label} tone="navy" />
    </Drawer>
  );
}

// ── 추가 이용 금액 (2026-10-22 시제품 v17) ──
// 예약한 시간보다 길어진 서비스 — 컨시어지가 청구하고 받는 분(어르신 · 구두로 동의한 보호자)만 결제한다. 결제 기한은 청구일 + 3일.
// 기한이 지나면 받는 분의 등록 카드로 결제한다 — 자동 청구(토스 자동결제 · 빌링키 서버 보관)가 붙기 전에는 관제가 결제를 마친 뒤
// '등록 카드 결제 완료로 기록'으로 닫는다 (환불 완료와 같은 방식). 데모는 기한 전에도 시연 버튼으로 볼 수 있다.
function ExtraChargesPanel({ charges, onRow, selected }) {
  const wait = charges.filter((x) => x.status === "pending").length;
  const cols = [
    { k: "sent", label: "청구", render: (x) => (
      <div className="min-w-[110px]">
        <div className="font-num text-[12px] font-bold text-navy">{fmtDT(x.sentAt)}</div>
        <div className="text-[11px] text-muted">{x.by} · {x.customer || "—"}</div>
      </div>
    ) },
    { k: "svc", label: "서비스", render: (x) => (
      <div className="min-w-[120px] max-w-[200px]">
        <div className="font-semibold text-ink">{svcTitle(x.service)}</div>
        {x.memo && <div className="truncate text-[11px] text-muted">{x.memo}</div>}
      </div>
    ) },
    { k: "time", label: "예약 → 실제", render: (x) => (
      <span className="font-num text-[12px]">
        {durText(x.bookedMin)} → {durText(x.usedMin)}
        {x.startTime && <span className="block text-[11px] text-muted">{clock12(x.startTime)}~{clock12(addMin(x.startTime, x.usedMin))}</span>}
      </span>
    ) },
    { k: "amt", label: "추가 금액", align: "right", render: (x) => <b className="font-num">{fmtWon(x.amount)}</b> },
    { k: "to", label: "받는 분", render: (x) => <span className="text-[12px]">{extraToText(x)}</span> },
    { k: "due", label: "결제 기한", render: (x) => (
      <span className="font-num text-[12px]">
        <span className="whitespace-nowrap">{dateLabel(extraDueYmd(x.sentAt))}</span>
        {extraOverdue(x) && <span className="ml-1 whitespace-nowrap"><Pill tone="warn">기한 지남</Pill></span>}
      </span>
    ) },
    { k: "state", label: "상태", render: (x) => <span className="whitespace-nowrap"><Pill tone={x.status === "paid" ? "ok" : x.status === "cancelled" ? "muted" : "warn"}>{x.status === "paid" ? "수납 완료" : extraStateText(x)}</Pill></span> },
    { k: "payer", label: "결제자 · 수단", render: (x) => (x.status === "paid" ? (
      <span className="text-[12px]">
        {x.payer || extraToText(x)}
        <span className="block text-[11px] text-muted">{x.method}{x.demo ? " (데모)" : ""} · {fmtDT(x.paidAt)}</span>
      </span>
    ) : <span className="text-muted">—</span>) },
    { k: "settle", label: "이 건 정산", render: (x) => (
      <span className="font-num text-[12px]">
        {fmtWon(x.base || 0)}
        {x.status === "paid" ? <> + {fmtWon(x.amount)}<b className="block text-navy">= {fmtWon((x.base || 0) + x.amount)}</b></> : <span className="block text-[11px] text-muted">{x.status === "cancelled" ? "추가 청구 취소" : "추가 미수납"}</span>}
      </span>
    ) },
  ];
  return (
    <Panel>
      <PanelHead
        title="추가 이용 금액"
        sub="컨시어지 청구 · 받는 분만 결제 · 기한은 청구일 + 3일 · 지나면 등록 카드로 결제합니다. 행을 누르면 상세가 열립니다"
        right={<span>{wait ? `결제 대기 ${wait}건` : "결제 대기 없음"}</span>}
      />
      <div className="mt-3">
        <Table cols={cols} rows={charges} onRow={onRow} selected={selected} empty="아직 청구가 없어요. 컨시어지 오늘 › 지금 카드 › 추가 이용 금액 보내기로 시작해요." />
      </div>
    </Panel>
  );
}

function ExtraDetail({ x, liveOn, dispatch, onClose }) {
  const OPERATOR = useOperator();
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState(null); // auto | cancel
  const late = extraOverdue(x);
  const pending = x.status === "pending";
  const run = () => {
    if (confirm === "auto") dispatch?.({ type: "autoChargeExtra", id: x.id, by: OPERATOR, ...(liveOn ? {} : { demo: true }) });
    if (confirm === "cancel" && reason.trim()) dispatch?.({ type: "cancelExtraCharge", id: x.id, by: OPERATOR, reason: reason.trim() });
    setConfirm(null);
  };
  return (
    <Drawer open onClose={onClose} title={`${x.customer || "고객"} · ${svcTitle(x.service)} 추가 이용 금액`} sub={`${x.by} 청구 · ${fmtDT(x.sentAt)}`} width={520}
      footer={<div className="flex items-center justify-between gap-2"><Pill tone={x.status === "paid" ? "ok" : x.status === "cancelled" ? "muted" : "warn"}>{extraStateText(x)}</Pill><span className="text-[11px] text-muted">받는 분 화면 · 컨시어지 카드에 같은 상태로 보입니다</span></div>}>
      <div className="space-y-5">
        <section>
          <KV k="예약한 시간" v={`${durText(x.bookedMin)}${x.startTime ? ` · ${clock12(x.startTime)}~${clock12(addMin(x.startTime, x.bookedMin))}` : ""}`} mono />
          <KV k="실제 이용" v={`${durText(x.usedMin)}${x.startTime ? ` · ${clock12(x.startTime)}~${clock12(addMin(x.startTime, x.usedMin))}` : ""}`} mono />
          <KV k="추가 시간" v={durText(x.usedMin - x.bookedMin)} mono />
          <KV k="추가 금액" v={fmtWon(x.amount)} tone="gold" mono />
          <KV k="받는 분" v={extraToText(x)} />
          <KV k="결제 기한" v={`${dateLabel(extraDueYmd(x.sentAt))}까지${late ? " · 기한 지남" : ""}`} tone={late ? "gold" : undefined} />
          {x.memo && <KV k="메모 (받는 분께 보임)" v={x.memo} />}
          {x.status === "paid" && <KV k="결제" v={`${x.payer || extraToText(x)} · ${x.method}${x.demo ? " (데모)" : ""} · ${fmtDT(x.paidAt)}${x.auto ? ` · ${x.autoBy || "관제"} 기록` : ""}`} tone="ok" />}
          {x.status === "cancelled" && <KV k="청구 취소" v={`${x.cancel?.by || "관제"} · ${fmtDT(x.cancel?.at)} · ${x.cancel?.reason || ""}`} />}
          <KV k="이 건 정산" v={`${fmtWon(x.base || 0)}${x.status === "paid" ? ` + ${fmtWon(x.amount)} = ${fmtWon((x.base || 0) + x.amount)}` : x.status === "cancelled" ? " (추가 청구 취소)" : " + 추가 미수납"}`} mono />
        </section>

        {pending ? (
          <section>
            <h4 className="mb-2 text-[13px] font-bold text-navy">관제 조치</h4>
            {liveOn ? (
              late ? (
                <Btn small tone="navy" onClick={() => setConfirm("auto")}>등록 카드 결제 완료로 기록</Btn>
              ) : (
                <p className="text-[12px] leading-[1.6] text-muted">결제 기한 전입니다 — 받는 분이 앱에서 결제하면 바로 &lsquo;수납 완료&rsquo;로 바뀝니다.</p>
              )
            ) : (
              <Btn small tone="navy" onClick={() => setConfirm("auto")}>기한 지남 · 등록 카드 결제 (시연)</Btn>
            )}
            <p className="mt-1.5 text-[11.5px] leading-[1.6] text-muted">
              자동 청구(토스 자동결제 · 등록 카드 서버 보관)는 아직 연결 전입니다. 기한이 지난 건은 등록 카드로 결제를 마친 뒤 기록합니다 —
              받는 분 화면에 &lsquo;등록된 카드로 결제됐어요&rsquo;, 컨시어지 카드에 &lsquo;등록된 카드로 결제됐어요&rsquo;로 바뀝니다.
              받는 분은 기한이 지나도 앱에서 낼 수 있습니다 — 카드로 결제하기 직전에 이 상태가 아직 &lsquo;결제 대기&rsquo;인지 다시 보세요.
              그 사이 앱 결제가 들어왔으면 카드 결제분은 기록할 때 &lsquo;환불 대기&rsquo;로 넘어갑니다.
            </p>
            <div className="mt-3 flex items-end gap-2">
              <div className="flex-1"><Field id={`xc-reason-${x.id}`} label="청구 취소 사유 (컨시어지가 잘못 보낸 경우 등)" value={reason} onChange={setReason} placeholder="예: 실제 이용 시간 잘못 입력 — 다시 청구" /></div>
              <Btn small ghost tone="muted" disabled={!reason.trim()} onClick={() => setConfirm("cancel")}>청구 취소</Btn>
            </div>
          </section>
        ) : !x.opsAck ? (
          <section>
            <Btn small tone="ok" onClick={() => dispatch?.({ type: "ackExtraCharge", id: x.id, by: OPERATOR })}>확인 — 지금 처리할 일에서 내리기</Btn>
          </section>
        ) : (
          <p className="text-[12px] text-muted">관제 확인 · {x.opsAck.by} · {fmtDT(x.opsAck.at)}</p>
        )}
      </div>
      <Confirm
        open={!!confirm}
        onCancel={() => setConfirm(null)}
        onConfirm={run}
        title={confirm === "auto" ? (liveOn ? `${fmtWon(x.amount)} 등록 카드 결제를 기록합니다` : "기한 지남 · 등록 카드 결제를 시연합니다") : "추가 이용 금액 청구를 취소합니다"}
        body={
          confirm === "auto"
            ? liveOn
              ? "받는 분의 등록 카드로 실제 결제를 마친 뒤에 누르세요. 받는 분 화면이 '등록된 카드로 결제됐어요'로 바뀌고 되돌릴 수 없습니다. 그 사이 받는 분이 앱에서 냈다면 카드 결제분은 '환불 대기'로 남습니다."
              : "데모 — 실제 결제 없이 기한이 지나 등록 카드로 결제된 상태를 보여 줍니다."
            : `사유 "${reason.trim()}" — 받는 분 화면에서 결제 요청이 사라지고, 컨시어지가 다시 보낼 수 있습니다.`
        }
        confirmLabel={confirm === "auto" ? (liveOn ? "결제 완료로 기록" : "시연") : "청구 취소"}
        tone="navy"
      />
    </Drawer>
  );
}
