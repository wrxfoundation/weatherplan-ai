// 공유 SOS 사건 상태 — 요청서 6절 · 19절.
// 대시보드·긴급 배너·SOS 콘솔이 같은 사건 목록을 본다. 모듈 단위 저장소 하나를 useSyncExternalStore 로 구독하고,
// localStorage["kcare-ops-sos-v1"] 에 저장해 새로고침·메뉴 이동 뒤에도 진행 중 사건이 남는다 (19절).
// 서버에서는 빈 목록을 주고, 마운트 뒤에 저장값을 읽는다 — 첫 렌더가 서버와 어긋나지 않게.
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
    window.localStorage.setItem(SOS_KEY, JSON.stringify({ v: 1, incidents: state.incidents }));
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
    const raw = window.localStorage.getItem(SOS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.incidents)) incidents = parsed.incidents;
    }
  } catch {
    incidents = null;
  }
  state = { hydrated: true, incidents: incidents || seedIncidents(Date.now()) };
  if (!incidents) persist();
  if (!storageBound) {
    storageBound = true;
    // 다른 탭에서 바뀐 사건도 같이 본다 (관제사 2명이 같은 사건을 볼 때)
    window.addEventListener("storage", (e) => {
      if (e.key !== SOS_KEY || !e.newValue) return;
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
    patch(existing.id, (inc) => ({
      ...inc,
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

// setStep(id, stepKey, record, { advance }) — 단계 기록을 덮어쓰지 않고 합친다.
// record.try 가 있으면 시도 횟수·시각을 자동 기록 (6-3 "버튼을 누르면 시도 횟수와 시간이 자동 기록").
// record.result 가 있으면 다음 단계로 넘어간다 — 2차 미연결이면 3차가 자동 활성된다.
function setStep(id, stepKey, record = {}, opts = {}) {
  const now = Date.now();
  patch(id, (inc) => {
    const prev = inc.steps?.[stepKey] || {};
    const { try: tryNote, ...rest } = record;
    const tries = tryNote ? [...(prev.tries || []), { at: now, result: tryNote.result || "pending", note: tryNote.note || "" }] : prev.tries;
    const merged = { ...prev, ...rest, at: rest.at ?? prev.at ?? now, by: rest.by ?? prev.by ?? inc.controller ?? "김태영", tries };
    const steps = { ...inc.steps, [stepKey]: merged };
    let step = inc.step;
    if (rest.result && opts.advance !== false && STEP_INDEX[stepKey] >= (STEP_INDEX[inc.step] ?? 0)) {
      const i = STEP_INDEX[stepKey];
      step = STEP_ORDER[Math.min(i + 1, STEP_ORDER.length - 1)].k;
    }
    const escalated = STEP_INDEX[step] > STEP_INDEX.confirm && inc.state !== "closed";
    return { ...inc, steps, step, state: escalated ? "active" : inc.state === "new" ? "ack" : inc.state, controller: inc.controller || merged.by };
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
    const firstOpen = STEP_ORDER.find((s) => s.k !== "close" && s.k !== "report" && !inc.steps?.[s.k]?.result)?.k || "close";
    const { close: _closed, ...steps } = inc.steps || {};
    return { ...inc, state: "active", closed: null, step: firstOpen, steps, signals: [...(inc.signals || []), { at: Date.now(), text: "사건 재개 (종료 취소)" }] };
  });
}

export function useIncidents() {
  const snap = useSyncExternalStore(subscribe, () => state, () => SERVER_SNAPSHOT);
  useEffect(() => {
    hydrate();
  }, []);
  const api = useMemo(() => ({ start, ack, assign, setStep, addSignal, update, close, reopen }), []);
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
