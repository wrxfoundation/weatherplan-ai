// 공유 SOS 사건 상태 — 요청서 6절 · 19절.
// 대시보드·긴급 배너·SOS 콘솔이 같은 사건 목록을 본다. 모듈 단위 저장소 하나를 useSyncExternalStore 로 구독하고,
// localStorage["kcare-ops-sos-v1"] 에 저장해 새로고침·메뉴 이동 뒤에도 진행 중 사건이 남는다 (19절).
// 서버에서는 빈 목록을 주고, 마운트 뒤에 저장값을 읽는다 — 첫 렌더가 서버와 어긋나지 않게.
import { isAccountScope, scopedKey } from "./scope";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { SEV, Btn, Pill, SevPill } from "../components/ops/ui";
import { dayKey, fmtElapsed, useNow, MIN } from "./ops-time";

export const SOS_KEY = "kcare-ops-sos-v1";

// 6-3 단계별 대응절차 13단계 — 순서가 곧 진행 순서
export const STEP_ORDER = [
  { k: "confirm", title: "이상징후 확인" },
  { k: "call1", title: "어르신 1차 전화" },
  { k: "call2", title: "어르신 2차 전화" },
  { k: "call3", title: "어르신 3차 전화" },
  { k: "guardian1", title: "주 보호자 연락" },
  { k: "guardian2", title: "부 보호자 연락" },
  { k: "notice", title: "조치 예정 통보" },
  { k: "call119", title: "119 신고" },
  { k: "dispatch", title: "컨시어지 현장 파견" },
  { k: "arrive", title: "현장 도착" },
  { k: "transfer", title: "병원 이송 / 보호자 인계" },
  { k: "close", title: "사건 종료" },
  { k: "report", title: "사후 상황보고서 작성" },
];
export const STEP_INDEX = Object.fromEntries(STEP_ORDER.map((s, i) => [s.k, i]));

// 6-3 결과 종류
export const CALL_RESULTS = { connected: "연결", noanswer: "미연결", refused: "거절", unavailable: "통화불가" };
// 6-7 종료 결과 — 필수 선택
export const CLOSE_RESULTS = ["정상 확인", "단순 오작동", "기기 이상", "현장 조치 완료", "119 이송", "병원 동행", "보호자 인계", "기타"];

// ── 저장소 ─────────────────────────────────────────────────────────────
let state = { hydrated: false, incidents: [] };
const SERVER_SNAPSHOT = state;
const listeners = new Set();
let storageBound = false;

function emit() {
  listeners.forEach((fn) => fn());
}
function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function persist() {
  if (typeof window === "undefined" || !state.hydrated) return;
  try {
    window.localStorage.setItem(scopedKey(SOS_KEY), JSON.stringify({ v: 1, incidents: state.incidents }));
  } catch {
    /* 저장 공간이 막힌 브라우저에서는 메모리 상태만 쓴다 */
  }
}
function commit(incidents) {
  state = { ...state, incidents };
  persist();
  emit();
}

// 초기 데모 사건 2건 — 시각은 마운트 시점 기준 상대값 (경과시간 타이머가 자연스럽게 흐르도록)
function seedIncidents(now) {
  const kimStart = now - 6 * MIN - 12000;
  const parkStart = now - 4 * MIN - 12000;
  return [
    {
      id: `SOS-${dayKey(now)}-001`,
      customer: "김순자",
      age: 78,
      sev: "danger",
      cause: "심박수 위험기준 초과",
      value: "132 bpm · 7분 지속",
      threshold: "개별 위험 기준 120 bpm 이상 · 2분 지속 (표준 130)",
      startedAt: kimStart,
      state: "ack",
      controller: "김태영",
      step: "confirm",
      steps: { confirm: { at: kimStart + 40000, by: "김태영", memo: "워치 정상 수신 · 수치 확인 중 (안정시 71 bpm 대비 급상승)" } },
      signals: [
        { at: kimStart, text: "심박 132 bpm — 개별 위험 기준 120 bpm 초과 · 2분 지속" },
        { at: kimStart + 3 * MIN, text: "심박 128 bpm — 위험 기준 지속 중 (반복 알림 병합)" },
      ],
      alerts: 3,
      closed: null,
    },
    {
      id: `SOS-${dayKey(now)}-002`,
      customer: "박말순",
      age: 83,
      sev: "sev1",
      cause: "낙상 의심",
      value: "낙상 감지 후 2분 18초 무동작",
      threshold: "낙상 감지 후 30초 무동작 시 SEV1",
      startedAt: parkStart,
      state: "active",
      controller: "김태영",
      step: "call2",
      steps: {
        confirm: { at: parkStart + 8000, by: "김태영", result: "done", memo: "낙상 감지 후 2분 18초 무동작 확인 · 위치 자택 3층" },
        call1: { at: parkStart + 13000, by: "김태영", result: "noanswer", tries: [{ at: parkStart + 13000, result: "noanswer", note: "12초 발신 · 응답 없음" }], next: "2차 전화" },
      },
      signals: [
        { at: parkStart, text: "낙상 감지 (워치 충격 센서) — 이후 무동작" },
        { at: parkStart + 60000, text: "거실 mmWave 움직임 없음 지속 — 같은 사건에 병합" },
      ],
      alerts: 2,
      closed: null,
    },
  ];
}

function hydrate() {
  if (state.hydrated || typeof window === "undefined") return;
  let incidents = null;
  try {
    const raw = window.localStorage.getItem(scopedKey(SOS_KEY));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.incidents)) incidents = parsed.incidents;
    }
  } catch {
    incidents = null;
  }
  // 테스트 가구는 목업 사건 없이 시작한다 — 실제로 들어온 SOS 만 사건이 된다
  state = { hydrated: true, incidents: incidents || (isAccountScope() ? [] : seedIncidents(Date.now())) };
  if (!incidents) persist();
  if (!storageBound) {
    storageBound = true;
    // 다른 탭에서 바뀐 사건도 같이 본다 (관제사 2명이 같은 사건을 볼 때)
    window.addEventListener("storage", (e) => {
      if (e.key !== scopedKey(SOS_KEY) || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed && Array.isArray(parsed.incidents)) {
          state = { ...state, incidents: parsed.incidents };
          emit();
        }
      } catch {
        /* 깨진 값은 무시 */
      }
    });
  }
  emit();
}

// ── 정렬·조회 도우미 ─────────────────────────────────────────────────
export function isOpen(inc) {
  return inc.state !== "closed";
}
export function sortIncidents(list) {
  return [...list].sort((a, b) => {
    const r = (SEV[a.sev]?.rank ?? 9) - (SEV[b.sev]?.rank ?? 9);
    return r !== 0 ? r : a.startedAt - b.startedAt;
  });
}
export function nextStepKey(inc) {
  const i = STEP_INDEX[inc.step] ?? 0;
  return STEP_ORDER[Math.min(i + 1, STEP_ORDER.length - 1)].k;
}

function nextId(incidents, now) {
  const day = dayKey(now);
  const prefix = `SOS-${day}-`;
  const max = incidents.reduce((m, inc) => (inc.id.startsWith(prefix) ? Math.max(m, Number(inc.id.slice(prefix.length)) || 0) : m), 0);
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

function patch(id, fn) {
  commit(state.incidents.map((inc) => (inc.id === id ? fn(inc) : inc)));
}

// ── 변경 동작 ───────────────────────────────────────────────────────────
// start(customer, cause): customer 는 이름 문자열 또는 {name, age, sev, value, threshold, controller}.
// 같은 고객의 진행 중 사건이 있으면 새 사건을 만들지 않고 signals[] 에 붙인다 (6-6).
function start(customer, cause) {
  const now = Date.now();
  const c = typeof customer === "string" ? { name: customer } : customer || {};
  const existing = state.incidents.find((inc) => inc.customer === c.name && isOpen(inc));
  if (existing) {
    // 어르신이 SOS 버튼을 누른 것은 기존 이상징후보다 앞에 둔다 — 사건 제목이 예전 신호(예: 심박)로 남으면
    // 관제가 SOS 를 못 알아본다 (2026-10-02 QA "SOS 버튼 사건이 '심박 132bpm' 사건에 병합")
    const sosButton = /SOS 버튼/.test(cause || "");
    patch(existing.id, (inc) => ({
      ...inc,
      ...(sosButton && !/SOS 버튼/.test(inc.cause || "") ? { cause: `어르신 SOS 버튼 발신 · 이전 신호: ${inc.cause}`, state: "new" } : {}),
      alerts: (inc.alerts || 0) + 1,
      signals: [...(inc.signals || []), { at: now, text: `${cause || c.cause || "추가 이상징후"}${c.value ? ` · ${c.value}` : ""} — 기존 사건에 추가` }],
      sev: (SEV[c.sev]?.rank ?? 9) < (SEV[inc.sev]?.rank ?? 9) ? c.sev : inc.sev,
    }));
    return existing.id;
  }
  const id = nextId(state.incidents, now);
  commit([
    ...state.incidents,
    {
      id,
      customer: c.name,
      age: c.age ?? null,
      sev: c.sev || "danger",
      cause: cause || c.cause || "SOS 대응 시작",
      value: c.value || "—",
      threshold: c.threshold || "—",
      startedAt: now,
      state: "new",
      controller: c.controller || null,
      step: "confirm",
      steps: {},
      signals: [{ at: now, text: `${cause || c.cause || "SOS 대응 시작"}${c.value ? ` · ${c.value}` : ""}` }],
      alerts: 1,
      closed: null,
    },
  ]);
  return id;
}

function ack(id, by = "김태영") {
  patch(id, (inc) => ({ ...inc, state: inc.state === "new" ? "ack" : inc.state, controller: inc.controller || by }));
}

function assign(id, controller) {
  patch(id, (inc) => ({ ...inc, controller }));
}

// 이 단계부터 아직 결과가 없는 첫 단계 — 다른 곳(팝업 급파 · 옆 패널 파견)에서 미리 끝낸 단계는 건너뛴다
export function firstOpenFrom(steps, i) {
  for (let j = Math.max(0, i); j < STEP_ORDER.length; j++) {
    const k = STEP_ORDER[j].k;
    if (k === "close" || k === "report") return "close";
    if (!steps?.[k]?.result) return k;
  }
  return "close";
}

// setStep(id, stepKey, record, { advance }) — 단계 기록을 덮어쓰지 않고 합친다.
// record.try 가 있으면 시도 횟수·시각을 자동 기록 (6-3 "버튼을 누르면 시도 횟수와 시간이 자동 기록").
// record.result 가 있으면 다음 단계로 넘어간다 — 2차 미연결이면 3차가 자동 활성된다.
function setStep(id, stepKey, record = {}, opts = {}) {
  const now = Date.now();
  patch(id, (inc) => {
    const prev = inc.steps?.[stepKey] || {};
    const { try: tryNote, ...rest } = record;
    const tries = tryNote ? [...(prev.tries || []), { at: now, result: tryNote.result || "pending", note: tryNote.note || "" }] : prev.tries;
    const merged = { ...prev, ...rest, at: rest.at ?? prev.at ?? now, by: rest.by ?? prev.by ?? opts.by ?? inc.controller ?? "김태영", tries };
    const steps = { ...inc.steps, [stepKey]: merged };
    // 어르신 본인과 통화가 연결되면 남은 어르신 전화(2차 · 3차)는 할 필요가 없다 — '건너뜀'으로 남기고 보호자 연락으로
    if (rest.result === "connected" && opts.advance !== false && stepKey === inc.step && ["call1", "call2"].includes(stepKey)) {
      ["call2", "call3"].forEach((k) => {
        if (STEP_INDEX[k] > STEP_INDEX[stepKey] && !steps[k]?.result) steps[k] = { ...(steps[k] || {}), at: now, by: merged.by, result: "skip", byConnect: true, memo: `${STEP_ORDER[STEP_INDEX[stepKey]].title} 연결 — 추가 전화 불필요` };
      });
    }
    let step = inc.step;
    // 지금 단계를 끝낸 때만 다음으로 — 뒤 단계(옆 패널 파견 등)를 먼저 기록해도 앞 단계를 건너뛰지 않는다 (2026-10-05 점검)
    if (rest.result && opts.advance !== false && stepKey === inc.step) step = firstOpenFrom(steps, STEP_INDEX[stepKey] + 1);
    // 가리키는 단계가 이미 끝나 있으면(팝업에서 급파 등) 다음 빈 단계로 — 진행 중 단계가 사라지지 않게
    if (inc.state !== "closed" && steps[step]?.result && !["close", "report"].includes(step)) step = firstOpenFrom(steps, STEP_INDEX[step] + 1);
    const escalated = STEP_INDEX[step] > STEP_INDEX.confirm && inc.state !== "closed";
    return { ...inc, steps, step, state: escalated ? "active" : inc.state === "new" ? "ack" : inc.state, controller: inc.controller || merged.by };
  });
}

// 어느 단계에서든 119 신고 · 담당자 파견으로 바로 (2026-10-05 현장 요청: "1단계나 2단계에서 바로 119 연결하거나
// 담당자 배치하거나 이슈 해결이 될 수도 있으니까"). 지금 단계부터 그 앞까지 결과 없는 단계는 '건너뜀 — ○○(으)로 바로 진행'으로
// 남기고 그 단계를 연다. 건너뛴 단계는 redo 로 다시 진행할 수 있다 — 지우지 않고 기록으로 남는다.
export const JUMP_LABEL = { call119: "119 신고로 바로 진행", dispatch: "담당자 파견으로 바로 진행" };
function jumpTo(id, target, by) {
  const now = Date.now();
  patch(id, (inc) => {
    const ti = STEP_INDEX[target];
    const from = STEP_INDEX[inc.step] ?? 0;
    if (inc.state === "closed" || ti == null || ti <= from) return inc;
    const who = by || inc.controller || "김태영";
    const steps = { ...(inc.steps || {}) };
    for (let j = from; j < ti; j++) {
      const k = STEP_ORDER[j].k;
      const prev = steps[k] || {};
      if (!prev.result) steps[k] = { ...prev, at: now, by: who, result: "skip", jumpSkip: { target, prevAt: prev.at ?? null, prevBy: prev.by ?? null, prevMemo: prev.memo ?? "" }, memo: prev.memo ? `${prev.memo} · ${JUMP_LABEL[target] || "바로 진행"}` : JUMP_LABEL[target] || "바로 진행" };
    }
    const step = steps[target]?.result ? firstOpenFrom(steps, ti + 1) : target;
    return { ...inc, steps, step, state: "active", controller: inc.controller || who };
  });
}

// 건너뛴 단계 다시 진행 — 결과(건너뜀)만 걷어 내고 그 단계를 연다. 시도 · 메모는 남고, 다시 진행했다는 메모가 시각과 함께 붙는다.
// 그 단계를 마치면 다음 빈 단계(원래 하던 단계)로 돌아간다.
function redo(id, k, by) {
  const now = Date.now();
  patch(id, (inc) => {
    const rec = inc.steps?.[k];
    if (inc.state === "closed" || rec?.result !== "skip") return inc;
    const { result: _r, jumpSkip, byConnect: _c, autoSkip: _s, ...keep } = rec; // eslint-disable-line no-unused-vars
    const back = jumpSkip ? { ...keep, at: jumpSkip.prevAt ?? undefined, by: jumpSkip.prevBy ?? undefined, memo: jumpSkip.prevMemo || undefined } : keep;
    Object.keys(back).forEach((x) => back[x] === undefined && delete back[x]);
    const note = { id: `n${now}`, at: now, by: by || inc.controller || "김태영", text: `건너뛴 단계 다시 진행 (${rec.memo || "건너뜀"})`, after: false };
    return { ...inc, steps: { ...inc.steps, [k]: { ...back, notes: [...(rec.notes || []), note] } }, step: k };
  });
}

function addSignal(id, text) {
  const now = Date.now();
  patch(id, (inc) => ({ ...inc, alerts: (inc.alerts || 0) + 1, signals: [...(inc.signals || []), { at: now, text }] }));
}

function update(id, fields) {
  patch(id, (inc) => ({ ...inc, ...fields }));
}

// close(id, {result, reason, outcome, by}) — 6-7. 결과·사유·조치결과는 호출 전에 화면이 검증한다.
function close(id, { result, reason, outcome, by = "김태영" }) {
  const now = Date.now();
  patch(id, (inc) => ({
    ...inc,
    state: "closed",
    step: "report",
    closed: { at: now, by, result, reason, outcome },
    steps: { ...inc.steps, close: { at: now, by, result: "done", memo: `${result} · ${reason}` } },
  }));
}

function reopen(id) {
  patch(id, (inc) => {
    const { close: _closed, ...steps0 } = inc.steps || {};
    // '해결 완료'가 자동으로 채운 건너뜀 · 완료는 되돌린다 — 그 단계를 다시 진행할 수 있게 (시도 · 메모는 남긴다)
    const steps = {};
    Object.entries(steps0).forEach(([k, rec]) => {
      if (rec?.autoSkip || rec?.autoDone) {
        const { result: _r, autoSkip: _s, autoDone: _d, autoPrev, ...keep } = rec; // eslint-disable-line no-unused-vars
        const back = { ...keep, at: autoPrev?.at ?? undefined, by: autoPrev?.by ?? undefined, memo: autoPrev?.memo || undefined };
        Object.keys(back).forEach((x) => back[x] === undefined && delete back[x]);
        if (Object.keys(back).some((x) => !["at", "by", "memo"].includes(x)) || back.memo) steps[k] = back;
      } else steps[k] = rec;
    });
    // 종료 뒤에 남긴 메모는 지우지 않는다 (사후 메모 — 덮어쓰지 않는 기록)
    if (_closed?.notes?.length) steps.close = { notes: _closed.notes };
    const firstOpen = firstOpenFrom(steps, 0);
    // 앞선 종료는 지우지 않고 이력으로 남긴다 ("종료는 이력에 남습니다")
    const closures = inc.closed ? [...(inc.closures || []), inc.closed] : inc.closures || [];
    return { ...inc, state: "active", closed: null, closures, step: firstOpen, steps, signals: [...(inc.signals || []), { at: Date.now(), text: "사건 재개 (종료 취소)" }] };
  });
}

export function useIncidents() {
  const snap = useSyncExternalStore(subscribe, () => state, () => SERVER_SNAPSHOT);
  useEffect(() => {
    hydrate();
  }, []);
  const api = useMemo(() => ({ start, ack, assign, setStep, jumpTo, redo, addSignal, update, close, reopen }), []);
  const open = useMemo(() => sortIncidents(snap.incidents.filter(isOpen)), [snap.incidents]);
  const closed = useMemo(() => [...snap.incidents.filter((i) => !isOpen(i))].sort((a, b) => (b.closed?.at || 0) - (a.closed?.at || 0)), [snap.incidents]);
  return { incidents: snap.incidents, open, closed, hydrated: snap.hydrated, ...api };
}

// ── 긴급 배너 — 다른 메뉴에서도 상단에 남는다 (6-6). 진행 중 사건이 없으면 아무것도 그리지 않는다.
export function SosBanner({ onOpen }) {
  const { open } = useIncidents();
  const now = useNow(1000);
  if (open.length === 0) return null;
  const top = open[0];
  const unread = open.filter((i) => i.state === "new").length;
  const unassigned = open.filter((i) => !i.controller).length;
  return (
    <div
      role="status"
      aria-live="polite"
      className="card-frost flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[14px] px-4 py-3"
      style={{ boxShadow: "inset 0 0 0 1.5px rgba(192,57,43,.55)" }}
    >
      <span className="flex items-center gap-2">
        <span className="h-[10px] w-[10px] rounded-full animate-livePing" style={{ background: "#C0392B" }} aria-hidden />
        <span className="text-[13px] font-bold text-danger">진행 중 SOS {open.length}건</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-[13px] text-ink">
        <SevPill sev={top.sev} />
        <span className="font-bold text-navy">{top.customer}</span>
        <span className="truncate">{top.cause} · {top.value}</span>
        <span className="font-num text-[12px] font-bold text-danger">경과 {now ? fmtElapsed(now - top.startedAt) : "--:--"}</span>
        {open.length > 1 && <span className="text-[12px] text-muted">외 {open.length - 1}건</span>}
        {unread > 0 && <Pill tone="danger">미확인 {unread}</Pill>}
        {unassigned > 0 && <Pill tone="warn">담당자 없음 {unassigned}</Pill>}
      </span>
      <Btn tone="danger" small onClick={() => onOpen?.(top.id)}>
        SOS 대응으로
      </Btn>
    </div>
  );
}
