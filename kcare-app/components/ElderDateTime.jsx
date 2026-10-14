// 어르신 날짜 · 시간 고르기 — 달력에서 날짜를 누르고, 큰 버튼으로 몇 시인지 고른다 (2026-10-14 현장 테스트:
// "일정을 입력하는 팝업을 달력으로 날짜와 시간을 조정하고 예약을 할 수 있게"). 오늘 탭 '일정 하나 남기기'와
// 해주세요 상세 시트가 같은 것을 쓴다.
//
// 오늘 · 내일 · 모레 세 칸과 아침 9시 · 낮 12시 같은 네 칸만 있던 것을 바꿨다 — 다음 주 병원 예약을 넣을 수 없었다.
// 시간은 시(時) 버튼 + 정각 · 30분 두 칸 — 시계 바늘이나 휠은 어르신 손에 맞지 않는다.
// 지난 날짜와 두 달 뒤는 고를 수 없다. 고른 것은 맨 아래 한 줄로 다시 읽어 드린다.
import { useState } from "react";
import Icon from "./icons";

export const ELDER_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

const pad = (n) => String(n).padStart(2, "0");
export const ymdOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromYmd = (s) => {
  const [y, m, d] = String(s).split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const hourLabel = (h) => (h < 12 ? `오전 ${h}시` : h === 12 ? "낮 12시" : `오후 ${h - 12}시`);
// "2026-10-20", "14:30" → "10월 20일 화요일 오후 2시 30분"
export function spokenDateTime(ymd, hm) {
  if (!ymd) return "";
  const d = fromYmd(ymd);
  const day = `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEK[d.getDay()]}요일`;
  if (!hm) return day;
  const [h, m] = hm.split(":").map(Number);
  return `${day} ${hourLabel(h)}${m ? ` ${m}분` : ""}`;
}
// 그 시각의 시각값(ms) — 이 기기 시간대 기준 (어르신 폰은 한국 시간)
export const atOf = (ymd, hm) => {
  const d = fromYmd(ymd);
  const [h, m] = (hm || "00:00").split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d.getTime();
};

export default function ElderDateTime({ ymd, hm, onChange, maxDays = 60, title = "날짜를 골라 주세요", timeTitle = "몇 시에요?" }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = new Date(today);
  last.setDate(last.getDate() + maxDays);
  const start = ymd ? fromYmd(ymd) : today;
  const [view, setView] = useState({ y: start.getFullYear(), m: start.getMonth() });
  const hour = hm ? Number(hm.split(":")[0]) : null;
  const half = hm ? hm.endsWith(":30") : false;

  const first = new Date(view.y, view.m, 1);
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [...Array.from({ length: first.getDay() }, () => null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const canPrev = new Date(view.y, view.m, 1) > new Date(today.getFullYear(), today.getMonth(), 1);
  const canNext = new Date(view.y, view.m + 1, 1) <= last;
  const move = (n) => setView((v) => {
    const d = new Date(v.y, v.m + n, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const pickDay = (d) => onChange?.({ ymd: ymdOf(new Date(view.y, view.m, d)), hm: hm || null });
  const pickHour = (h) => onChange?.({ ymd: ymd || null, hm: `${pad(h)}:${half ? "30" : "00"}` });
  const pickHalf = (v) => hour != null && onChange?.({ ymd: ymd || null, hm: `${pad(hour)}:${v ? "30" : "00"}` });

  const navBtn = "btn-press flex h-[48px] min-w-[48px] items-center justify-center rounded-2xl text-navy disabled:opacity-25";
  return (
    <div>
      <div className="text-[19px] font-bold text-navy">{title}</div>
      <div className="mt-2 rounded-[20px] bg-white/80 p-3" style={{ boxShadow: "inset 0 0 0 1px rgba(10,31,60,.08)" }}>
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => move(-1)} disabled={!canPrev} aria-label="지난 달" className={navBtn} style={{ background: "rgba(10,31,60,.06)" }}>
            <span aria-hidden className="rotate-90">
              <Icon name="chev" size={24} strokeWidth={2.2} />
            </span>
          </button>
          <span className="text-[21px] font-black text-navy" aria-live="polite">
            {view.y}년 {view.m + 1}월
          </span>
          <button type="button" onClick={() => move(1)} disabled={!canNext} aria-label="다음 달" className={navBtn} style={{ background: "rgba(10,31,60,.06)" }}>
            <span aria-hidden className="-rotate-90">
              <Icon name="chev" size={24} strokeWidth={2.2} />
            </span>
          </button>
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1 text-center" role="group" aria-label={`${view.m + 1}월 달력`}>
          {WEEK.map((w) => (
            <div key={w} aria-hidden className="py-1 text-[16px] font-bold text-muted">
              {w}
            </div>
          ))}
          {cells.map((d, i) => {
            if (d == null) return <div key={`b${i}`} />;
            const date = new Date(view.y, view.m, d);
            const key = ymdOf(date);
            const off = date < today || date > last;
            const on = key === ymd;
            const isToday = date.getTime() === today.getTime();
            return (
              <button
                key={key}
                type="button"
                disabled={off}
                onClick={() => pickDay(d)}
                aria-pressed={on}
                aria-label={`${view.m + 1}월 ${d}일 ${WEEK[date.getDay()]}요일${isToday ? " 오늘" : ""}`}
                className="btn-press flex min-h-[48px] flex-col items-center justify-center rounded-xl font-num text-[19px] font-bold disabled:opacity-25"
                style={on ? { background: "#0A1F3C", color: "#FFFFFF" } : { color: isToday ? "#8A5D12" : "#40413F", boxShadow: isToday ? "inset 0 0 0 1.5px rgba(176,141,87,.6)" : "none" }}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 text-[19px] font-bold text-navy">{timeTitle}</div>
      <div className="mt-2 grid grid-cols-3 gap-2" role="group" aria-label="몇 시">
        {ELDER_HOURS.map((h) => {
          const on = hour === h;
          return (
            <button
              key={h}
              type="button"
              onClick={() => pickHour(h)}
              aria-pressed={on}
              className={`btn-press rounded-2xl border-2 px-1 py-3.5 text-[19px] font-bold leading-[1.25] ${on ? "border-navy bg-navy text-white" : "border-navy/15 text-ink"}`}
            >
              {hourLabel(h)}
            </button>
          );
        })}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-label="분">
        {[
          [false, "정각"],
          [true, "30분"],
        ].map(([v, label]) => {
          const on = hour != null && half === v;
          return (
            <button
              key={label}
              type="button"
              disabled={hour == null}
              onClick={() => pickHalf(v)}
              aria-pressed={on}
              className={`btn-press rounded-2xl border-2 px-2 py-3.5 text-[19px] font-bold disabled:opacity-40 ${on ? "border-navy bg-navy text-white" : "border-navy/15 text-ink"}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <p
        aria-live="polite"
        className="mt-4 rounded-2xl px-4 py-3.5 text-[20px] font-bold leading-[1.45]"
        style={ymd && hm ? { background: "rgba(10,31,60,.07)", color: "#0A1F3C" } : { background: "rgba(138,93,18,.1)", color: "#8A5D12" }}
      >
        {ymd && hm ? spokenDateTime(ymd, hm) : ymd ? `${spokenDateTime(ymd)} · 몇 시인지 골라 주세요` : "날짜와 시간을 골라 주세요"}
      </p>
    </div>
  );
}
