// SOS 콘솔 공용 계산 — 119 전달용 요약(6-4)·단계 요약 문장·의식/통화 가능 여부 판정.
import { CALL_RESULTS, STEP_ORDER } from "../../../lib/ops-sos";
import { fmtClock, fmtTime } from "../../../lib/ops-time";

export const stepTitle = (k) => STEP_ORDER.find((s) => s.k === k)?.title || k;

// 어르신 통화 결과로 "의식 및 통화 가능 여부"를 판정한다 — 판정이 아니라 기록 사실만 옮긴다
export function consciousness(inc) {
  const calls = ["call1", "call2", "call3"].map((k) => inc.steps?.[k]).filter(Boolean);
  if (calls.some((c) => c.result === "connected")) return "통화 연결됨 — 의식 있음 · 응답 가능 (관제사 통화 기준)";
  if (calls.some((c) => c.result === "refused")) return "통화 거절 — 응답은 있음";
  if (calls.length === 0) return "미확인 — 아직 통화 시도 없음";
  return `미확인 — 본인 전화 ${calls.length}회 미연결`;
}

export function guardianOf(c, role) {
  return c.guardians.find((g) => g.role === role) || (role === "부" ? c.guardians.find((g) => g.role === "비상") : null) || null;
}

// 6-4 119 전달용 요약 — 한 화면에서 읽을 수 있게 [항목, 값] 배열로
export function build119(inc, c, health) {
  return [
    ["이름·나이", `${c.name} · ${c.age ?? "—"}세 · ${c.sex}`],
    ["정확한 위치", `${health.location.v} · 마지막 위치 수신 ${health.location.agoSec != null ? `${Math.round(health.location.agoSec / 60)}분 전` : "—"}`],
    ["자택 주소", c.address],
    ["이상징후", inc.cause],
    ["실제 측정값", `${inc.value} (기준 ${inc.threshold})`],
    ["발생 시각", fmtTime(inc.startedAt)],
    ["주요 질환", c.conditions.join(", ")],
    ["복용약", c.meds.join(", ")],
    ["알레르기", c.allergies.join(", ")],
    ["의식·통화 가능", consciousness(inc)],
    ["출입 정보", `${c.consent.door} · ${c.consent.entry}`],
    ["현장 연락", `관제사 ${inc.controller || "미배정"} · 담당 컨시어지 ${c.concierge.main}`],
  ];
}

export function summary119Text(rows) {
  return rows.map(([k, v]) => `${k}: ${v}`).join("\n");
}

// 단계 기록 한 줄 요약 — Steps 의 sub 에 들어간다 (6-3 기록 항목 전부)
export function stepSummary(rec) {
  if (!rec) return null;
  const parts = [];
  if (rec.at) parts.push(`수행 ${fmtTime(rec.at)}`);
  if (rec.by) parts.push(`수행자 ${rec.by}`);
  if (rec.tries?.length) parts.push(`시도 ${rec.tries.length}회 (${rec.tries.map((t) => fmtClock(t.at)).join(", ")})`);
  if (rec.result && CALL_RESULTS[rec.result]) parts.push(`결과 ${CALL_RESULTS[rec.result]}`);
  else if (rec.result === "skip") parts.push("건너뜀");
  if (rec.answer) parts.push(`답변 “${rec.answer}”`);
  if (rec.request) parts.push(`보호자 요청 “${rec.request}”`);
  if (rec.next) parts.push(`다음 조치 ${rec.next}`);
  if (rec.memo) parts.push(`메모 ${rec.memo}`);
  if (rec.dispatch) parts.push(`${rec.dispatch.name} ${rec.dispatch.two ? "2인" : "1인"} 출동 · 지시 ${fmtClock(rec.dispatch.orderedAt)}${rec.dispatch.arrivedAt ? ` · 도착 ${fmtClock(rec.dispatch.arrivedAt)}` : ""}`);
  if (rec.report) parts.push(`접수번호 ${rec.report.caseNo || "—"} · ${rec.report.agency || "119"}`);
  return parts.join(" · ");
}

export function resultLabel(rec) {
  if (!rec?.result) return null;
  if (rec.result === "done") return "완료";
  if (rec.result === "skip") return "건너뜀";
  return CALL_RESULTS[rec.result] || rec.result;
}

// 시간순 자동 정리 (6-7) — 이상징후·단계 기록·시도·종료를 한 축으로
export function buildTimeline(inc) {
  const ev = [];
  (inc.signals || []).forEach((s) => ev.push({ at: s.at, kind: "이상징후", text: s.text }));
  Object.entries(inc.steps || {}).forEach(([k, rec]) => {
    (rec.tries || []).forEach((t, i) => ev.push({ at: t.at, kind: stepTitle(k), text: `${i + 1}차 시도${t.note ? ` · ${t.note}` : ""}` }));
    if (rec.at && (rec.result || rec.memo)) {
      ev.push({ at: rec.at, kind: stepTitle(k), text: [resultLabel(rec), rec.answer && `답변 “${rec.answer}”`, rec.request && `요청 “${rec.request}”`, rec.next && `다음 ${rec.next}`, rec.memo].filter(Boolean).join(" · ") || "기록", by: rec.by });
    }
    if (rec.dispatch) {
      const d = rec.dispatch;
      if (d.acceptedAt) ev.push({ at: d.acceptedAt, kind: "현장 파견", text: `${d.name} 수락` });
      if (d.departedAt) ev.push({ at: d.departedAt, kind: "현장 파견", text: `${d.name} 출발` });
      if (d.arrivedAt) ev.push({ at: d.arrivedAt, kind: "현장 도착", text: `${d.name} 현장 도착${d.actions ? ` · ${d.actions}` : ""}` });
    }
    if (rec.report) {
      const r = rec.report;
      if (r.arrivedAt) ev.push({ at: rec.at, kind: "119 신고", text: `구급대 실제 도착 ${r.arrivedAt}${r.hospital ? ` · 이송 ${r.hospital}` : ""}` });
    }
  });
  if (inc.closed) ev.push({ at: inc.closed.at, kind: "사건 종료", text: `${inc.closed.result} · ${inc.closed.reason} · 조치결과 ${inc.closed.outcome}`, by: inc.closed.by });
  return ev.sort((a, b) => a.at - b.at);
}
