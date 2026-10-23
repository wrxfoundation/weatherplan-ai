// 어르신 날짜 · 시간 고르기 — 달력에서 날짜를 누르고, 큰 버튼으로 몇 시인지 고른다 (2026-10-14 현장 테스트:
// "일정을 입력하는 팝업을 달력으로 날짜와 시간을 조정하고 예약을 할 수 있게"). 오늘 탭 '일정 하나 남기기'와
// 해주세요 상세 시트가 같은 것을 쓴다.
//
// 오늘 · 내일 · 모레 세 칸과 아침 9시 · 낮 12시 같은 네 칸만 있던 것을 바꿨다 — 다음 주 병원 예약을 넣을 수 없었다.
// 시간은 시(時) 버튼 + 정각 · 30분 두 칸 — 시계 바늘이나 휠은 어르신 손에 맞지 않는다.
// 지난 날짜와 두 달 뒤는 고를 수 없다. 고른 것은 맨 아래 한 줄로 다시 읽어 드린다.
// 2026-10-15 시안 — 흰 3D 카드 달력(고른 날 남색 · 오늘 금색 테두리), 시간은 큰 고르기 칸(고른 것 보라).
// 일요일 숫자는 시안의 빨강 대신 갈색 — 빨강은 위험 신호 전용이다.
// 해주세요 예약(2026-10-22 · book)은 내일부터 1년 뒤까지, 오전 7시 ~ 오후 8시 정각까지 30분 간격 (lib/booking.js 와 같은 범위).
import { useState } from "react";
import { Line } from "./clay";
import { EvenGrid, TONE } from "./ds";

export const ELDER_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
// 해주세요 예약 시간 — 오전 7:00 ~ 오후 8:00 (8시는 정각만)
export const BOOK_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
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

export default function ElderDateTime({ ymd, hm, onChange, maxDays = 60, title = "날짜를 골라 주세요", timeTitle = "몇 시에요?", book = false }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // book — 해주세요 예약: 내일부터 1년 뒤까지 · 오전 7시 ~ 오후 8시 정각
  const firstDay = new Date(today);
  if (book) firstDay.setDate(firstDay.getDate() + 1);
  const last = new Date(today);
  last.setDate(last.getDate() + (book ? 365 : maxDays));
  const hours = book ? BOOK_HOURS : ELDER_HOURS;
  const lastHour = hours[hours.length - 1];
  // 마지막 시(오후 8시)는 정각만 — 30분은 고를 수 없다
  const tooLate = (h, m) => book && h === lastHour && m > 0;
  const start = ymd ? fromYmd(ymd) : firstDay;
  const [view, setView] = useState({ y: start.getFullYear(), m: start.getMonth() });
  const hour = hm ? Number(hm.split(":")[0]) : null;
  const half = hm ? hm.endsWith(":30") : false;

  const first = new Date(view.y, view.m, 1);
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [...Array.from({ length: first.getDay() }, () => null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const canPrev = new Date(view.y, view.m, 1) > new Date(firstDay.getFullYear(), firstDay.getMonth(), 1);
  const canNext = new Date(view.y, view.m + 1, 1) <= last;
  const move = (n) => setView((v) => {
    const d = new Date(v.y, v.m + n, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  // 오늘을 고르면 이미 지난 시각은 고를 수 없다 — 오후 3시에 '오늘 오전 9시'로 예약되던 것 (2026-10-19 점검 E15)
  const now = new Date();
  const isToday = (k) => k === ymdOf(today);
  const past = (k, h, m) => isToday(k) && (h < now.getHours() || (h === now.getHours() && m <= now.getMinutes()));
  const pickDay = (d) => {
    const k = ymdOf(new Date(view.y, view.m, d));
    const keep = hm && !past(k, hour, half ? 30 : 0) ? hm : null;
    onChange?.({ ymd: k, hm: keep });
  };
  const pickHour = (h) => {
    // 정각이 지났으면 30분으로, 둘 다 지났으면 고르지 않는다 (버튼도 꺼져 있다). 마지막 시는 정각으로
    const m = (half || past(ymd, h, 0)) && !tooLate(h, 30) ? 30 : 0;
    if (past(ymd, h, m)) return;
    onChange?.({ ymd: ymd || null, hm: `${pad(h)}:${m ? "30" : "00"}` });
  };
  const pickHalf = (v) => hour != null && !past(ymd, hour, v ? 30 : 0) && !tooLate(hour, v ? 30 : 0) && onChange?.({ ymd: ymd || null, hm: `${pad(hour)}:${v ? "30" : "00"}` });

  const navBtn = "ds-press flex h-[48px] min-w-[48px] items-center justify-center rounded-[16px] disabled:opacity-25";
  // 고르기 칸 — 고른 것은 보라로 찬다 (시안 chipBtn)
  const pick = (on) =>
    on
      ? { background: TONE.purple.solid, color: "#FFFFFF", boxShadow: `0 4px 0 ${TONE.purple.solidSh}` }
      : { background: "#FFFFFF", color: "#1B2340", boxShadow: "0 4px 0 #E3DED3" };
  return (
    <div className="flex flex-col gap-2.5">
      <div className="text-[19px] font-extrabold">{title}</div>
      <div className="rounded-[24px] bg-white p-3" style={{ boxShadow: "0 5px 0 #E6E2DA" }}>
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => move(-1)} disabled={!canPrev} aria-label="지난 달" className={navBtn} style={{ background: "#F3F1EC" }}>
            <Line name="back" size={22} />
          </button>
          <span className="text-[20px] font-black" aria-live="polite">
            {view.y}년 {view.m + 1}월
          </span>
          <button type="button" onClick={() => move(1)} disabled={!canNext} aria-label="다음 달" className={navBtn} style={{ background: "#F3F1EC" }}>
            <Line name="chevR" size={22} />
          </button>
        </div>
        <div className="ds-cal mt-2 text-center" role="group" aria-label={`${view.m + 1}월 달력`}>
          {WEEK.map((w, i) => (
            <span key={w} aria-hidden className="text-[15px]" style={{ height: 30, color: i === 0 ? "#9A5B1E" : i === 6 ? "#3A4E96" : "#5E6270" }}>
              {w}
            </span>
          ))}
          {cells.map((d, i) => {
            if (d == null) return <span key={`b${i}`} aria-hidden />;
            const date = new Date(view.y, view.m, d);
            const key = ymdOf(date);
            const off = date < firstDay || date > last;
            const on = key === ymd;
            const isToday = date.getTime() === today.getTime();
            const dow = date.getDay();
            return (
              <button
                key={key}
                type="button"
                disabled={off}
                onClick={() => pickDay(d)}
                aria-pressed={on}
                aria-label={`${view.m + 1}월 ${d}일 ${WEEK[dow]}요일${isToday ? " 오늘" : ""}`}
                className="ds-tap text-[18px] disabled:opacity-25"
                style={
                  on
                    ? { background: "#1B2340", color: "#FFFFFF" }
                    : { color: dow === 0 ? "#9A5B1E" : dow === 6 ? "#3A4E96" : "#1B2340", background: isToday ? "#F1E9DC" : "transparent", borderColor: isToday ? "#C9A064" : "transparent" }
                }
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-2 text-[19px] font-extrabold">{timeTitle}</div>
      {/* 예약 시간은 14칸이라 마지막 줄 두 칸이 반씩 채운다 — 오른쪽이 비지 않게 (2026-10-23) */}
      <EvenGrid cols={3} role="group" aria-label="몇 시">
        {hours.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => pickHour(h)}
            disabled={past(ymd, h, 30)}
            aria-pressed={hour === h}
            className="ds-pick px-1 text-[17px] leading-[1.25] disabled:opacity-30"
            style={pick(hour === h)}
          >
            {hourLabel(h)}
          </button>
        ))}
      </EvenGrid>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="분">
        {[
          [false, "정각"],
          [true, "30분"],
        ].map(([v, label]) => {
          const on = hour != null && half === v;
          return (
            <button key={label} type="button" disabled={hour == null || past(ymd, hour, v ? 30 : 0) || tooLate(hour, v ? 30 : 0)} onClick={() => pickHalf(v)} aria-pressed={on} className="ds-pick px-2 text-[17px] disabled:opacity-40" style={pick(on)}>
              {label}
            </button>
          );
        })}
      </div>

      <p
        aria-live="polite"
        className="mt-1 rounded-[18px] px-4 py-3.5 text-[18px] font-extrabold leading-[1.45]"
        style={ymd && hm ? { background: TONE.blue.bg, color: TONE.blue.fg } : { background: TONE.gold.bg, color: TONE.gold.fg }}
      >
        {ymd && hm ? spokenDateTime(ymd, hm) : ymd ? `${spokenDateTime(ymd)} · 몇 시인지 골라 주세요` : "날짜와 시간을 골라 주세요"}
      </p>
    </div>
  );
}
