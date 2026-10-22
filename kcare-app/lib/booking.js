// 해주세요 예약 — 날짜 · 시작 시간 · 이용 시간 · 요금 · 추가 이용 금액 (2026-10-22 시제품 v17 결정 ·
// docs/kcare/decisions/2026-10-22-booking-pay.md).
//
// 보호자 · 어르신 신청서, 컨시어지 확인 · 추가 이용 금액 청구, 관제 표, 결제 서버(pages/api/payments/order · confirm)가
// 같은 계산을 쓴다 — 서버는 브라우저가 보낸 금액이 아니라 저장된 서비스 · 이용 시간 · 인원으로 다시 계산한다.
// 서비스별 규칙(기본 금액 · 이용 시간 범위 · 30분 단가)은 lib/requests.js 메뉴의 dur 한 곳에 있다. 이 파일은 계산만 한다.
import { SERVICE_MENU, SERVICE_PLUS, kstYmd, serviceYmd } from "./requests";

export const STEP = 30; // 분 — 시작 시간 간격 · 이용 시간을 늘리고 줄이는 단위
export const BOOK_MIN_DAYS = 1; // 내일부터
export const BOOK_MAX_DAYS = 365; // 1년 뒤까지 (대형병원 예약 대비)
// 함께가요 인원 추가 — 1명마다 (시제품 예시 값 · 이용 시간과 상관없이 1회 — 확인 필요)
export const EXTRA_PERSON_FEE = 50000;
export const EXTRA_PEOPLE_MAX = 2;
// 추가 이용 금액 — 결제 기한은 청구한 날 + 3일. 지나면 받는 분의 등록 카드로 결제한다
export const EXTRA_DUE_DAYS = 3;
export const EXTRA_USED_MAX = 12 * 60; // 실제 이용 시간 상한 — 잘못 누른 값으로 큰 청구가 나가지 않게

const pad = (n) => String(n).padStart(2, "0");
const isYmd = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ""));
export function hhmm(min) {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}
export const minOf = (t) => {
  const m = /^(\d{2}):(\d{2})$/.exec(String(t || ""));
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
export const addMin = (t, d) => (minOf(t) == null ? null : hhmm(minOf(t) + Number(d || 0)));

// 시작 시간 목록 — 오전 7:00 ~ 오후 8:00, 30분 간격 (27칸)
export const START_TIMES = Array.from({ length: (20 - 7) * 2 + 1 }, (_, i) => hhmm(7 * 60 + i * STEP));
export const isStartTime = (t) => START_TIMES.includes(t);

// "14:30" → "오후 2:30" · "12:00" → "오후 12:00" · "09:40" → "오전 9:40"
export function clock12(t) {
  const m = minOf(t);
  if (m == null) return "";
  const h = Math.floor(m / 60);
  return `${h < 12 ? "오전" : "오후"} ${h > 12 ? h - 12 : h === 0 ? 12 : h}:${pad(m % 60)}`;
}
// 이용 시간 글 — 150 → "2시간 30분"
export function durText(min) {
  const v = Math.max(0, Math.round(Number(min) || 0));
  const h = Math.floor(v / 60);
  const r = v % 60;
  return [h ? `${h}시간` : "", r ? `${r}분` : ""].filter(Boolean).join(" ") || "0분";
}
const WEEK = "일월화수목금토";
// "2026-10-31" → "10월 31일 (토)" — 올해가 아니면 해를 붙인다
export function dateLabel(ymd, now = Date.now()) {
  if (!isYmd(ymd)) return "";
  const [y, m, d] = ymd.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const thisYear = Number(kstYmd(now).slice(0, 4));
  return `${y !== thisYear ? `${y}년 ` : ""}${m}월 ${d}일 (${WEEK[dow]})`;
}
// 시각값 → 한국 시간 "HH:MM"
export const kstHm = (at) => (Number.isFinite(Number(at)) ? new Date(Number(at) + 9 * 3600000).toISOString().slice(11, 16) : null);

// 고를 수 있는 날 — 내일 ~ 1년 뒤 (한국 날짜)
export function bookRange(now = Date.now()) {
  return { from: kstYmd(now + BOOK_MIN_DAYS * 86400000), to: kstYmd(now + BOOK_MAX_DAYS * 86400000) };
}
export function inBookRange(ymd, now = Date.now()) {
  const r = bookRange(now);
  return isYmd(ymd) && ymd >= r.from && ymd <= r.to;
}

// ── 서비스 · 이용 시간 · 금액 ──
// 메뉴 항목 — 요청 기록의 type(서비스 이름)으로 찾는다 (해주세요 메뉴 · 집 고칠 일)
export const menuOf = (type) => SERVICE_MENU.find((s) => s.name === type) || SERVICE_PLUS.find((p) => p.name === type) || null;
export const durOf = (type) => menuOf(type)?.dur || null;
// 화면 이름 — 메뉴의 title(병원 동행 (선생님 두 분) 등), 없으면 서비스 이름 그대로
export const svcTitle = (type) => menuOf(type)?.title || String(type || "");
// 처음 고른 이용 시간 — 함께가요는 3시간부터, 나머지는 기본 시간
export const durStart = (d) => (d ? d.start || d.min : null);
export function clampDur(d, min) {
  if (!d) return null;
  const v = Math.round(Number(min) / STEP) * STEP;
  if (!Number.isFinite(v)) return durStart(d);
  return Math.max(d.min, Math.min(d.max, v));
}
export const validDur = (d, min) => !!d && Number.isInteger(min) && min % STEP === 0 && min >= d.min && min <= d.max;
export const clampPeople = (n) => Math.max(0, Math.min(EXTRA_PEOPLE_MAX, Math.round(Number(n) || 0)));

// 금액 — 기본 금액 + (이용 시간 − 기본 시간) ÷ 30분 × 30분 단가 + (함께가요) 추가 1명당 50,000원.
// 이용 시간 규칙이 없는 서비스는 메뉴 금액 그대로 (요금 확정 전이면 null)
export function priceOf(type, durMin, extraPeople = 0) {
  const item = menuOf(type);
  if (!item) return null;
  const d = item.dur;
  if (!d) return item.amount ?? null;
  const m = clampDur(d, durMin ?? durStart(d));
  const steps = d.fixed ? 0 : Math.round((m - d.min) / STEP);
  return Number(item.amount) + steps * (d.each || 0) + (d.people ? clampPeople(extraPeople) * EXTRA_PERSON_FEE : 0);
}

// 저장된 요청의 요금 — 결제 서버가 쓴다. 이용 시간 규칙이 있는 서비스는 서비스 · 이용 시간 · 인원으로 다시 계산하고,
// 기록의 이용 시간 · 인원이 규칙 밖이면 null(결제하지 않는다). 규칙이 없는 서비스는 기록된 금액 그대로.
// 2026-10-22 전에 만든 요청(이용 시간 기록 없음)은 기본 시간 금액, 또는 그때 메뉴 금액(legacyAmount — 기본 금액이 바뀐
// 병원 동행 한 분 · 함께가요)과 대조한다 — 바뀌기 전에 결제 대기로 남은 요청 · 제안이 결제되지 않고 멈추지 않게 (2026-10-22 점검)
export function expectedAmount(r) {
  const d = durOf(r?.type);
  if (!d) return r?.amount ?? null;
  const old = r.durationMin == null && !(Number(r.extraPeople) > 0) ? menuOf(r.type)?.legacyAmount : null;
  if (old != null && Number(r.amount) === old) return old;
  const dur = r.durationMin == null ? d.min : r.durationMin;
  if (!validDur(d, dur)) return null;
  const extra = r.extraPeople == null ? 0 : r.extraPeople;
  if (!Number.isInteger(extra) || extra < 0 || extra > (d.people ? EXTRA_PEOPLE_MAX : 0)) return null;
  return priceOf(r.type, dur, extra);
}

// ── 신청 이름 ──
// 언제 — "10월 31일 (토) 오전 10:00~오후 1:00". 담당 컨시어지가 날짜 · 시간을 정했으면 그 일정(관제 승인 전이면 승인 대기 중인 일정 —
// 관제가 돌려보내면 지워진다), 그 전에는 희망 일정. 이용 시간이 없으면 시작 시각까지만
export function whenText(r) {
  const ymd = serviceYmd(r);
  if (!ymd) return "";
  const start = (isYmd(r?.scheduledDate) ? r.scheduledTime : r?.preferredTime) || "";
  const s = minOf(start) != null ? clock12(start) : "";
  const end = s && Number(r?.durationMin) > 0 ? clock12(addMin(start, r.durationMin)) : "";
  return `${dateLabel(ymd)}${s ? ` ${s}` : ""}${end ? `~${end}` : ""}`;
}
// 인원 — 함께가요에 추가한 사람까지 "3명"
export const peopleText = (r) => (Number(r?.extraPeople) > 0 ? `${Number(r.extraPeople) + 1}명` : "");
// 신청 이름 — '함께가요 · 3명 · 10월 31일 (토) 오전 10:00~오후 1:00' (신청 내역 · 컨시어지 · 관제가 같은 이름을 쓴다)
export const reqTitle = (r) => [svcTitle(r?.type), peopleText(r), whenText(r)].filter(Boolean).join(" · ");

// ── 다음 외래 ──
// 컨시어지가 동행 때 등록한 '다음 진료 예정일' 일정 중 가장 가까운 것 (내일 이후)
export function nextAppt(events, now = Date.now()) {
  const from = bookRange(now).from;
  return (
    (events || [])
      .filter((e) => e && e.kind === "nextAppt" && e.approval !== "rejected" && Number.isFinite(Number(e.at)) && kstYmd(Number(e.at)) >= from)
      .sort((a, b) => a.at - b.at)[0] || null
  );
}
// 다음 외래 동행의 시작 — 진료 시각에서 그 서비스의 nextApptLead 분 앞 (두 분 동행 1시간 전 픽업 · 한 분 동행 20분 전 로비 — 확인 필요).
// 진료 시각이 정해 둔 것이라 30분 간격 · 오전 7시 ~ 오후 8시 범위에 맞추지 않는다. 앞당기면 전날로 넘어가는 이른 진료는 진료 시각 그대로
export function nextApptStart(type, appt) {
  const t = kstHm(appt?.at);
  const lead = durOf(type)?.nextApptLead;
  return t && Number.isFinite(lead) && minOf(t) >= lead ? addMin(t, -lead) : t;
}

// ── 추가 이용 금액 (예약한 시간보다 길어진 서비스) ──
// 청구할 수 있는 서비스 — 30분 단가가 있는 것 (정해진 시간 서비스는 해당 없음)
export const canChargeExtra = (type) => {
  const d = durOf(type);
  return !!d && !d.fixed && d.each > 0;
};
// 추가 금액 — (실제 − 예약) ÷ 30분 × 30분 단가. 규칙 밖(줄었거나 30분 단위가 아님)이면 null
export function extraAmountOf(x) {
  const d = durOf(x?.service);
  if (!d || d.fixed || !d.each) return null;
  const used = Number(x.usedMin);
  const booked = Number(x.bookedMin);
  const over = used - booked;
  if (!Number.isInteger(over) || over <= 0 || over % STEP !== 0 || used > EXTRA_USED_MAX) return null;
  return (over / STEP) * d.each;
}
// 결제 기한 — 청구한 날 + 3일 (그날 밤 12시까지 · 한국 시간)
export const extraDueYmd = (sentAt) => kstYmd(Number(sentAt) + EXTRA_DUE_DAYS * 86400000);
export const extraDueAt = (sentAt) => Date.parse(`${extraDueYmd(sentAt)}T23:59:59+09:00`);
export const extraOverdue = (x, now = Date.now()) => x?.status === "pending" && now > extraDueAt(x.sentAt);
// 받는 분 — "김민수 (보호자)"
export const extraToText = (x) => `${x?.to?.name || (x?.to?.role === "elder" ? "어르신" : "보호자")} (${x?.to?.role === "elder" ? "어르신" : "보호자"})`;
// 이 청구를 받은 사람인가 — 어르신 화면은 어르신에게 보낸 것만, 보호자 화면은 그 보호자에게 보낸 것만 (2026-10-22 · 받은 당사자에게만 보인다)
export function extraIsFor(x, role, name) {
  if (!x?.to || x.to.role !== role) return false;
  if (role === "elder") return true;
  return !x.to.name || !name || x.to.name === name;
}
// 결제 상태 글 — 받는 분 · 컨시어지 · 관제가 같은 말을 쓴다
export function extraStateText(x) {
  if (!x) return "";
  if (x.status === "cancelled") return "청구 취소";
  if (x.status === "paid") return x.auto ? "등록된 카드로 결제됐어요" : "결제 완료";
  return "추가 결제 대기";
}
