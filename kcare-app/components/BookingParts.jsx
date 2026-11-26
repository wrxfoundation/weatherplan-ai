// 해주세요 예약 칸 (2026-10-22 시제품 v17) — 보호자 · 어르신 신청서가 같이 쓴다. 계산은 lib/booking.js 한 곳.
//   날짜 · 시작 시간  달력(내일 ~ 1년 뒤)에서 날짜, 목록(오전 7:00 ~ 오후 8:00 · 30분)에서 시작 시간 — 보호자 화면용.
//                    어르신 화면은 큰 버튼 달력(components/ElderDateTime.jsx)을 같은 범위로 쓴다.
//   이용 시간        − / + 로 30분씩. 바꿀 때마다 금액과 끝나는 시간이 바로 바뀐다. 정해진 시간 서비스는 끝나는 시간만.
//   함께가요 인원    혼자(○○ 님만) / 인원 추가 → 1명 · 2명. 1명마다 추가 요금
//   확정 단계 막대   결제 → 컨시어지 확인 → 관제 승인 → 일정 확정 (신청 완료 화면)
// 일요일 숫자는 빨강 대신 갈색 — 빨강은 위험 신호 전용이다.
import { useEffect, useState } from "react";
import { Line } from "./clay";
import { TONE } from "./ds";
import { fmtWon } from "../lib/config";
import { EXTRA_PEOPLE_MAX, EXTRA_PERSON_FEE, START_TIMES, STEP, addMin, bookRange, clock12, dateLabel, durText } from "../lib/booking";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n) => String(n).padStart(2, "0");
const ymdOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

// ── 보호자 · 날짜 + 시작 시간 ──
export function BookingPicker({ ymd, hm, onChange, tone = "green", title = "날짜 · 시작 시간", optional = false }) {
  const range = bookRange();
  const t = TONE[tone] || TONE.green;
  const [fy, fm] = range.from.split("-").map(Number);
  const [ty, tm] = range.to.split("-").map(Number);
  const startView = ymd ? ymd.split("-").map(Number) : [fy, fm];
  const [view, setView] = useState({ y: startView[0], m: startView[1] - 1 });
  // 바깥에서 날짜가 바뀌면(내용 고치기 등) 그 달을 보여 준다
  useEffect(() => {
    if (!ymd) return;
    const [y, m] = ymd.split("-").map(Number);
    setView({ y, m: m - 1 });
  }, [ymd]);
  const cur = view.y * 12 + view.m;
  const canPrev = cur > fy * 12 + (fm - 1);
  const canNext = cur < ty * 12 + (tm - 1);
  const move = (n) =>
    setView((v) => {
      const d = new Date(v.y, v.m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  const first = new Date(view.y, view.m, 1).getDay();
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [...Array.from({ length: first }, () => null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const nav = "ds-press flex h-[40px] min-w-[40px] items-center justify-center rounded-[12px] disabled:opacity-25";
  return (
    <div className="flex flex-col gap-2" role="group" aria-label={title}>
      <div className="text-[15px] font-extrabold">
        {title}
        {optional && <small className="ml-1.5 text-[13px] font-bold" style={{ color: "#5E6270" }}>선택</small>}
      </div>
      <div className="rounded-[20px] bg-white p-2.5" style={{ boxShadow: `0 3px 0 ${t.sh}` }}>
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => move(-1)} disabled={!canPrev} aria-label="이전 달" className={nav} style={{ background: "#F3F1EC" }}>
            <Line name="back" size={18} />
          </button>
          <b className="text-[16px]" aria-live="polite">
            {view.y}년 {view.m + 1}월
          </b>
          <button type="button" onClick={() => move(1)} disabled={!canNext} aria-label="다음 달" className={nav} style={{ background: "#F3F1EC" }}>
            <Line name="chevR" size={18} />
          </button>
        </div>
        <div className="ds-cal mt-1.5 text-center" role="group" aria-label={`${view.m + 1}월 달력`}>
          {WEEK.map((w, i) => (
            <span key={w} aria-hidden className="text-[13px]" style={{ height: 26, color: i === 0 ? "#9A5B1E" : i === 6 ? "#3A4E96" : "#5E6270" }}>
              {w}
            </span>
          ))}
          {cells.map((d, i) => {
            if (d == null) return <span key={`b${i}`} aria-hidden />;
            const key = ymdOf(view.y, view.m, d);
            const off = key < range.from || key > range.to;
            const on = key === ymd;
            const dow = new Date(view.y, view.m, d).getDay();
            return (
              <button
                key={key}
                type="button"
                disabled={off}
                aria-pressed={on}
                aria-label={`${view.m + 1}월 ${d}일 ${WEEK[dow]}요일`}
                onClick={() => onChange?.({ ymd: key, hm: hm || null })}
                className="ds-tap text-[15px] disabled:opacity-25"
                style={on ? { background: t.solid, color: "#FFFFFF", height: 40 } : { color: dow === 0 ? "#9A5B1E" : dow === 6 ? "#3A4E96" : "#1B2340", height: 40 }}
              >
                {d}
              </button>
            );
          })}
        </div>
        <label className="mt-2 flex items-center gap-2.5 border-t pt-2.5" style={{ borderColor: "#F0ECE4" }}>
          <span className="flex-none text-[15px] font-extrabold" style={{ color: t.fg }}>
            시작
          </span>
          <select
            value={hm || ""}
            onChange={(e) => onChange?.({ ymd: ymd || null, hm: e.target.value || null })}
            aria-label="시작 시간"
            className="min-h-[46px] min-w-0 flex-1 rounded-[14px] border-2 bg-white px-3 text-[16px] font-bold outline-none"
            style={{ borderColor: "#E3DED3" }}
          >
            <option value="">시간 고르기</option>
            {START_TIMES.map((x) => (
              <option key={x} value={x}>
                {clock12(x)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p aria-live="polite" className="rounded-[14px] px-3.5 py-2.5 text-[15px] font-extrabold" style={ymd && hm ? { background: t.bg, color: t.fg } : { background: TONE.gold.bg, color: TONE.gold.fg }}>
        {ymd && hm ? `${dateLabel(ymd)} ${clock12(hm)}` : ymd ? `${dateLabel(ymd)} · 시작 시간을 골라 주세요` : optional ? "고르지 않으면 담당 컨시어지가 연락드려 정해요" : "날짜와 시작 시간을 골라 주세요"}
      </p>
    </div>
  );
}

// ── 이용 시간 − / + ──
// d — 메뉴의 dur. start — 시작 시각 ("14:30") — 있으면 끝나는 시간을 함께 보인다. big — 어르신 화면 크기
export function DurationStepper({ d, value, onChange, start = null, big = false, tone = "green", title = "이용 시간" }) {
  if (!d) return null;
  const t = TONE[tone] || TONE.green;
  const v = value ?? d.start ?? d.min;
  const end = start ? addMin(start, v) : null;
  const fs = big ? { q: 19, val: 24, note: 16, btn: 64 } : { q: 15, val: 20, note: 13, btn: 52 };
  return (
    <div className="flex flex-col gap-2" role="group" aria-label={title}>
      <div className="font-extrabold" style={{ fontSize: fs.q }}>
        {title}
      </div>
      {d.fixed ? (
        <div className="flex items-center gap-3 rounded-[18px] bg-white px-4 py-3" style={{ boxShadow: `0 3px 0 ${t.sh}` }}>
          <span className="min-w-0 flex-1">
            <b className="block font-black" style={{ color: t.fg, fontSize: fs.val }}>
              {d.label || durText(v)}
            </b>
            <small className="block font-bold" style={{ color: "#5E6270", fontSize: fs.note }}>
              정해진 시간이에요
            </small>
          </span>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              aria-label="30분 줄이기"
              disabled={v <= d.min}
              onClick={() => onChange?.(Math.max(d.min, v - STEP))}
              className="ds-press ds-btn3d flex flex-none items-center justify-center rounded-[18px] bg-white font-black disabled:opacity-35"
              style={{ width: fs.btn, height: fs.btn, fontSize: fs.val + 6, color: t.fg, boxShadow: `0 4px 0 ${t.sh}` }}
            >
              −
            </button>
            <b className="ds-num min-w-0 flex-1 text-center font-black" style={{ color: t.fg, fontSize: fs.val }} aria-live="polite">
              {durText(v)}
            </b>
            <button
              type="button"
              aria-label="30분 늘리기"
              disabled={v >= d.max}
              onClick={() => onChange?.(Math.min(d.max, v + STEP))}
              className="ds-press ds-btn3d flex flex-none items-center justify-center rounded-[18px] bg-white font-black disabled:opacity-35"
              style={{ width: fs.btn, height: fs.btn, fontSize: fs.val + 6, color: t.fg, boxShadow: `0 4px 0 ${t.sh}` }}
            >
              +
            </button>
          </div>
          <div className="text-center font-bold" style={{ color: "#6B6658", fontSize: fs.note }}>
            30분마다 +{fmtWon(d.each)} · {durText(d.min)} ~ {durText(d.max)}
          </div>
        </>
      )}
      <div className="ds-num rounded-[14px] px-3.5 py-2.5 text-center font-extrabold" style={{ background: t.bg, color: t.fg, fontSize: big ? 18 : 15 }} aria-live="polite">
        {end ? `${clock12(start)} → ${clock12(end)}` : "시작 시간을 고르면 끝나는 시간이 보여요"}
      </div>
    </div>
  );
}

// ── 함께가요 · 누가 가나요 ──
// alone — 혼자 가는 말 ("혼자" · "김순자 님만"). value — 추가 인원 (null 아직 안 고름 · 0 혼자 · 1~2)
export function PeoplePick({ alone, value, onChange, big = false, tone = "blue" }) {
  const t = TONE[tone] || TONE.blue;
  const adding = value != null && value > 0;
  const [open, setOpen] = useState(adding);
  const chip = (on) => (on ? { background: t.solid, color: "#FFFFFF", boxShadow: `0 4px 0 ${t.solidSh}` } : { background: "#FFFFFF", color: t.fg, boxShadow: `0 3px 0 ${t.sh}` });
  const fs = big ? 19 : 15;
  const h = big ? 60 : 48;
  return (
    <div className="flex flex-col gap-2">
      <div className="font-extrabold" style={{ fontSize: fs }}>
        누가 가나요
      </div>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="누가 가나요">
        <button type="button" aria-pressed={value === 0} onClick={() => { setOpen(false); onChange?.(0); }} className="ds-press rounded-[16px] px-2 font-extrabold" style={{ ...chip(value === 0), minHeight: h, fontSize: fs }}>
          {alone}
        </button>
        <button type="button" aria-pressed={open || adding} onClick={() => { setOpen(true); if (!adding) onChange?.(null); }} className="ds-press rounded-[16px] px-2 font-extrabold" style={{ ...chip(open || adding), minHeight: h, fontSize: fs }}>
          인원 추가
        </button>
      </div>
      {(open || adding) && (
        <>
          <div className="mt-1 font-extrabold" style={{ fontSize: fs }}>
            추가 인원
          </div>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="추가 인원">
            {Array.from({ length: EXTRA_PEOPLE_MAX }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" aria-pressed={value === n} onClick={() => onChange?.(n)} className="ds-press rounded-[16px] px-2 font-extrabold" style={{ ...chip(value === n), minHeight: h, fontSize: fs }}>
                {n}명 추가
              </button>
            ))}
          </div>
          <div className="text-center font-bold" style={{ color: "#6B6658", fontSize: big ? 16 : 13 }}>
            1명마다 +{fmtWon(EXTRA_PERSON_FEE)}
          </div>
        </>
      )}
    </div>
  );
}

// ── 확정 단계 막대 — 결제(무료면 요청) → 컨시어지 확인 → 관제 승인 → 일정 확정 ──
// at — 지금 단계 (0 결제 · 1 컨시어지 확인 · 2 관제 승인 · 3 일정 확정 · 4 모두 끝남)
export const CONFIRM_STEPS = ["결제", "컨시어지 확인", "관제 승인", "일정 확정"];
export function ConfirmSteps({ at = 1, free = false, big = false }) {
  const steps = free ? ["요청", ...CONFIRM_STEPS.slice(1)] : CONFIRM_STEPS;
  return (
    <ol className="m-0 grid list-none grid-cols-4 gap-1 p-0" aria-label={`확정 단계 — 지금 ${steps[Math.min(at, 3)]}`}>
      {steps.map((l, i) => (
        <li key={l} className="flex flex-col items-center gap-1.5" aria-current={i === at ? "step" : undefined}>
          <span className="block h-2 w-full rounded-[4px]" style={{ background: i < at ? TONE.green.solid : i === at ? TONE.gold.solid : "#E3DED3" }} />
          <span className="text-center font-extrabold leading-[1.25]" style={{ color: i <= at ? "#1B2340" : "#6B6658", fontSize: big ? 15 : 12 }}>
            {l}
          </span>
        </li>
      ))}
    </ol>
  );
}
