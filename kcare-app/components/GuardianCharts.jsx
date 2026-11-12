// 보호자 세부 화면(수면 · 활동 · 복약)의 그래프 · 상태 칩 — 2026-10-15 디자인 시안.
// 막대 높이는 값 그대로 비례한다. 진한 막대가 무엇인지(6시간 미만 · 평균 이상)는 화면 아래 한 줄로 밝힌다.
// 그림만으로 말하지 않는다 — 막대마다 숫자를 위에 쓰고, 묶음에는 aria-label 로 값을 그대로 읽어 준다.
import Link from "next/link";
import { Clay } from "./clay";
import { Card, TONE } from "./ds";

// 상태 칩 — 양호(초록) · 관찰(청회색) · 주의(갈색). 빨강은 쓰지 않는다 (위험 신호 전용)
const STATUS = {
  ok: { label: "양호", cls: "ds-rpok", dot: "#2E7356" },
  watch: { label: "관찰", cls: "ds-rpwatch", dot: "#4F6383" },
  caution: { label: "주의", style: { background: "#FFFFFF", color: "#6E5A4A", border: "1.5px solid #9C8371" }, dot: "#9C8371" },
};
export function StatusChip({ kind = "ok", label }) {
  const s = STATUS[kind] || STATUS.ok;
  return (
    <span className={`inline-flex flex-none items-center gap-[5px] rounded-full px-3 py-[5px] text-[14px] font-extrabold ${s.cls || ""}`} style={s.style}>
      <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full" style={{ background: s.dot }} />
      {label || s.label}
    </span>
  );
}

// 7일 막대 — days: [{ label, value, text }] · dark(v): 진한 막대인가 · max: 막대 위쪽 기준값
export function WeekBars({ days, color, dark, max, label }) {
  return (
    <div className="ds-bars" role="img" aria-label={`${label}: ${days.map((d) => `${d.label} ${d.text}`).join(", ")}`}>
      {days.map((d, i) => {
        const on = dark(d.value);
        return (
          <div key={`${d.label}-${i}`}>
            <span>{d.text}</span>
            <i
              style={{
                height: Math.max(8, Math.round((d.value / max) * 112)),
                animationDelay: `${i * 60}ms`,
                background: on ? color : "#FFFFFF",
                border: on ? "none" : `2px solid ${color}`,
                borderBottom: "none",
                outline: d.label === "오늘" ? "2px solid #1B2340" : undefined,
                outlineOffset: 1,
              }}
            />
            <b style={d.label === "오늘" ? { color: "#1B2340" } : undefined}>{d.label}</b>
          </div>
        );
      })}
    </div>
  );
}

// 30일 막대 — 가로축은 7일마다 날짜, 기준선(평소 · 지난주 평균)은 점선
export function MonthBars({ days, value, lo, hi, color, dark, base, baseLabel, label }) {
  const H = 130;
  const y = (v) => Math.max(6, Math.round(((v - lo) / (hi - lo)) * H));
  return (
    <div>
      <div className="ds-m30" role="img" aria-label={`${label}: ${days.map((d) => `${d.md} ${value(d)}`).join(", ")}`}>
        {days.map((d, i) => {
          const v = value(d);
          const on = dark(v);
          return (
            <i
              key={d.md}
              title={`${d.md} ${v}`}
              style={{
                height: y(v),
                animationDelay: `${i * 18}ms`,
                background: on ? color : "#FFFFFF",
                boxShadow: on ? undefined : `inset 0 0 0 1.5px ${color}`,
                outline: i === days.length - 1 ? "2px solid #1B2340" : undefined,
                outlineOffset: 1,
              }}
            />
          );
        })}
        <div aria-hidden="true" className="absolute left-0 right-0" style={{ bottom: y(base), borderTop: "2px dashed rgba(27,35,64,.35)" }}>
          <span className="absolute right-0 rounded px-1 text-[11px] font-extrabold" style={{ top: -20, color: "#3A3F50", background: "rgba(255,255,255,.8)" }}>
            {baseLabel}
          </span>
        </div>
      </div>
      <div className="grid text-[11px] font-bold" style={{ gridTemplateColumns: "repeat(30, minmax(0,1fr))", color: "#5E6270" }} aria-hidden="true">
        {days.map((d, i) => (
          <span key={d.md} className="whitespace-nowrap">
            {[0, 7, 14, 21, 28].includes(i) ? d.md : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

// 워치를 연결하지 않은 가구 — 지어낸 숫자 대신 그렇다고 말한다 (테스트 가구 · 관제 센터 공간)
export function NoWatch({ what, tone = "blue" }) {
  return (
    <Card tone={tone} shadow={false} className="flex flex-col items-center gap-3 text-center" pad={22}>
      <Clay name="sunNow" size={48} />
      <div className="text-[20px] font-black">워치를 연결하지 않았어요</div>
      <p className="text-[15px] leading-[1.6]" style={{ color: "#5E6270" }}>
        베타 테스트에서는 갤럭시 워치를 드리지 않아 {what} 기록을 받지 않습니다. 연결되면 여기에 지난 30일까지 보입니다.
      </p>
      <Link href="/family/watch" className="ds-press flex min-h-[48px] items-center rounded-[16px] bg-white px-4 text-[15px] font-extrabold" style={{ boxShadow: "0 4px 0 #E3DED3", color: TONE[tone].fg }}>
        워치 연결 안내 보기
      </Link>
    </Card>
  );
}
