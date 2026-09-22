// 컨시어지 '오늘' 탭 앞단 — 2026-09-22 강도완 시안 1.
// 출근해서 처음 보는 순서: 인사 → 오늘 업무 요약 → 긴급확인 → 현재 진행 중 → 오늘의 일정 → 마무리 필요.
// 아래 기존 카드(짝·컨디션·확인전화·어르신 부탁 등)는 그대로 두고 그 위에 이 순서를 얹는다.
//
// 일정은 lib/console.js CONCIERGE_CAL 의 오늘(day) 건을 그대로 쓴다 — 달력·관제 배차와 같은 출처다.
import { useMemo } from "react";
import { Card, Badge } from "./ui";
import { CONCIERGE_JOB_KINDS } from "../lib/console";

const hm = (s) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};
export const jobState = (j, nowMin) => {
  if (!j.start) return "planned";
  if (nowMin >= hm(j.end)) return "done";
  if (nowMin >= hm(j.start)) return "active";
  if (hm(j.start) - nowMin <= 90) return "soon";
  return "planned";
};
const STATE_STYLE = {
  done: { label: "완료", fg: "#1E7A5A", bg: "rgba(30,122,90,.12)", dot: "#1E7A5A" },
  active: { label: "진행 중", fg: "#0A1F3C", bg: "rgba(10,31,60,.08)", dot: "#0A1F3C" },
  soon: { label: "이동 준비", fg: "#7A4C8A", bg: "rgba(122,76,138,.12)", dot: "#7A4C8A" },
  planned: { label: "예정", fg: "#3B5C8A", bg: "rgba(59,92,138,.12)", dot: "#3B5C8A" },
};

export function useToday(jobs, now) {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return useMemo(() => {
    const rows = jobs
      .map((j) => ({ ...j, state: jobState(j, nowMin) }))
      .sort((a, b) => hm(a.start || "23:59") - hm(b.start || "23:59"));
    // 지금 수행 중인 건. 업무 시간 밖(시연은 아무 때나 열린다)이면 오늘의 중심 업무를
    // 대신 세운다 — 카드가 비는 대신 '예정'·'완료'로 제 상태를 말한다.
    const active = rows.find((r) => r.state === "active") || null;
    const focus = active || rows.find((r) => r.main) || rows.find((r) => r.state !== "done") || rows[0] || null;
    const counts = {
      total: rows.length,
      done: rows.filter((r) => r.state === "done").length,
      active: rows.filter((r) => r.state === "active").length,
      ahead: rows.filter((r) => r.state === "soon" || r.state === "planned").length,
    };
    const endsAt = rows.length ? rows[rows.length - 1].end : null;
    const mix = rows.reduce((m, r) => {
      const k = CONCIERGE_JOB_KINDS[r.kind].label;
      m[k] = (m[k] || 0) + 1;
      return m;
    }, {});
    return { rows, active, focus, counts, endsAt, mix, nowMin };
  }, [jobs, nowMin]);
}

// ── 인사 + 오늘 업무 요약 ──
export function TodayHeader({ name, now, today, urgentCount, reportDue }) {
  const hour = now.getHours();
  const greet = hour < 11 ? "좋은 아침입니다" : hour < 17 ? "오늘도 수고 많으십니다" : "오늘 하루 고생하셨습니다";
  const date = `${now.getMonth() + 1}월 ${now.getDate()}일 ${["일", "월", "화", "수", "목", "금", "토"][now.getDay()]}요일`;
  const mix = Object.entries(today.mix).map(([k, v]) => `${k} ${v}`).join(" · ");
  return (
    <>
      <div className="px-1">
        <h2 className="text-[22px] font-black leading-[1.35] text-navy">{greet}, {name}님</h2>
        <p className="mt-0.5 text-[13px] leading-[1.6] text-muted">{date} · 오늘 만나야 할 고객과 업무입니다.</p>
      </div>
      <Card className="p-[18px]">
        <div className="flex items-end gap-4">
          <div className="shrink-0">
            <div className="text-[12px] font-bold text-muted">오늘 업무</div>
            <div className="mt-1 font-num text-[30px] font-black leading-none text-navy">{today.counts.total}건</div>
            {today.endsAt && <div className="mt-1 font-num text-[11px] text-muted">예상 종료 {today.endsAt}</div>}
          </div>
          <div className="flex flex-1 justify-between border-l border-navy/[.08] pl-4">
            {[
              ["완료", today.counts.done, "#1E7A5A"],
              ["진행", today.counts.active, "#0A1F3C"],
              ["예정", today.counts.ahead, "#3B5C8A"],
              ["긴급확인", urgentCount, urgentCount > 0 ? "#C0392B" : "#5C5A54"],
            ].map(([k, v, c]) => (
              <div key={k} className="text-center">
                <div className="font-num text-[22px] font-black leading-none" style={{ color: c }}>{v}</div>
                <div className="mt-1 text-[11px] text-muted">{k}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 border-t border-navy/[.08] pt-2.5 text-[12px] text-muted">
          {mix}
          {reportDue ? ` · 미작성 보고서 ${reportDue}` : ""}
        </div>
      </Card>
    </>
  );
}

// ── 긴급확인 — 관제가 넘긴 확인 요청 ──
export function UrgentBanner({ u, done, onOpen }) {
  if (!u) return null;
  return (
    <div
      className="rounded-2xl border p-4"
      style={done ? { borderColor: "rgba(30,122,90,.3)", background: "#F1FAF6" } : { borderColor: "rgba(192,57,43,.35)", background: "#FDF3F2" }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge fg="#FFFFFF" bg={done ? "#1E7A5A" : "#C0392B"}>{done ? "확인 완료" : "긴급확인"}</Badge>
        <span className="text-[15px] font-bold text-navy">
          {u.client} 고객 · {u.title}
        </span>
      </div>
      <p className="mt-1.5 text-[12.5px] leading-[1.6] text-muted">{u.facts.join(" · ")}</p>
      <button
        onClick={onOpen}
        className={`btn-press btn-dark mt-3 w-full rounded-xl py-3 text-[15px] font-bold text-white ${done ? "bg-green" : "bg-danger"}`}
      >
        {done ? "처리 내용 보기" : "긴급업무 열기"}
      </button>
    </div>
  );
}

// ── 긴급확인 시트 — 전화 · 보호자 · 관제 보고 3단계 ──
export function UrgentSheet({ u, steps, onStep, onClose }) {
  const all = u.steps.every((s) => steps[s.k]);
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[rgba(8,23,45,.45)]">
      <div className="max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-white p-6 pb-8">
        <div className="mx-auto mb-4 h-[4px] w-[38px] rounded-full bg-navy/15" />
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 text-[19px] font-black text-navy">긴급확인 · {u.client} 고객</div>
          <button onClick={onClose} className="btn-press shrink-0 rounded-[10px] border border-navy/20 px-3 py-1.5 text-[13px] font-bold text-muted">
            닫기
          </button>
        </div>
        <div className="mt-3 rounded-xl border border-navy/10 bg-paper p-3">
          <div className="text-[14px] font-bold text-navy">{u.title}</div>
          <div className="mt-1 text-[12.5px] leading-[1.7] text-muted">
            {u.age}세 · {u.where}
            <br />
            {u.by} 요청 {u.requestedAt} · {u.facts.join(" · ")}
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {u.steps.map((s, i) => {
            const on = !!steps[s.k];
            return (
              <button
                key={s.k}
                onClick={() => onStep(s.k)}
                aria-pressed={on}
                className="btn-press flex w-full items-start gap-3 rounded-xl border p-3 text-left"
                style={on ? { borderColor: "rgba(30,122,90,.35)", background: "rgba(30,122,90,.07)" } : { borderColor: "rgba(10,31,60,.12)" }}
              >
                <span
                  aria-hidden
                  className="mt-[2px] flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full font-num text-[12px] font-bold"
                  style={on ? { background: "#1E7A5A", color: "#fff" } : { background: "rgba(10,31,60,.07)", color: "#5C5A54" }}
                >
                  {on ? "✓" : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-bold text-navy">{s.label}</span>
                  <span className="block text-[12px] leading-[1.6] text-muted">{s.note}</span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 rounded-xl bg-navy/[.04] p-3 text-[11.5px] leading-[1.7] text-muted">
          {all
            ? "세 단계를 모두 마쳤습니다 — 결과가 관제로 전달되어 무감지 대응이 종료됩니다."
            : "통화가 안 되면 체크하지 마세요. 안 된 것도 관제가 알아야 할 정보입니다. 결과는 정상 확인 · 방문 필요 · 관제 이관 중 하나로 보고합니다."}
        </p>
      </div>
    </div>
  );
}

// ── 현재 진행 중 ──
export function NowCard({ job, checkDone, checkTotal, onOps, onGo }) {
  if (!job) return null;
  const k = CONCIERGE_JOB_KINDS[job.kind];
  const st = STATE_STYLE[job.state] || STATE_STYLE.planned;
  const live = job.state === "active";
  const pct = checkTotal ? Math.round((checkDone / checkTotal) * 100) : 0;
  return (
    <Card className="p-[18px]" style={{ borderColor: live ? "rgba(30,122,90,.35)" : "rgba(10,31,60,.1)" }}>
      <div className="text-[12px] font-bold tracking-[.08em] text-muted">
        {live ? "현재 진행 중" : job.state === "done" ? "오늘의 중심 업무 · 완료" : "오늘의 중심 업무"}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <Badge fg={k.color} bg={`${k.color}1A`}>{k.label}</Badge>
        <span className="font-num text-[14px] font-bold text-navy">{job.start}–{job.end}</span>
        <span className="ml-auto">
          <Badge fg={st.fg} bg={st.bg}>{st.label}</Badge>
        </span>
      </div>
      <div className="mt-2 text-[21px] font-black text-navy">{job.client} 고객</div>
      <div className="mt-0.5 text-[12.5px] leading-[1.6] text-muted">
        {job.where} · {job.crew}
      </div>
      {job.memo && <div className="mt-0.5 text-[12.5px] leading-[1.6] text-muted">{job.memo}</div>}
      {job.chips?.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {job.chips.map(([tag, text, tone]) => (
            <span
              key={tag}
              className="rounded-[10px] px-2.5 py-1.5 text-[12px] font-bold"
              style={{ background: `${tone}14`, color: tone }}
            >
              <span className="opacity-70">{tag} </span>
              {text}
            </span>
          ))}
        </div>
      )}
      {checkTotal > 0 && (
        <>
          <div className="mt-3 flex items-center justify-between text-[12px]">
            <span className="text-muted">{checkTotal}가지 점검</span>
            <span className="font-num font-bold text-navy">{checkDone} / {checkTotal} 완료</span>
          </div>
          <div className="mt-1.5 h-[7px] w-full overflow-hidden rounded-full bg-navy/[.08]">
            <span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#1E7A5A,#2E9B72)" }} />
          </div>
        </>
      )}
      <div className="mt-3 flex gap-2">
        <button onClick={onOps} className="btn-press flex-1 rounded-xl border border-navy/20 py-3 text-[14px] font-bold text-navy">
          관제센터 연락
        </button>
        <button onClick={onGo} className="btn-press btn-dark flex-[1.4] rounded-xl bg-green py-3 text-[14px] font-bold text-white">
          {checkDone > 0 ? "점검 계속하기" : "방문 화면 열기"}
        </button>
      </div>
    </Card>
  );
}

// ── 오늘의 일정 ──
export function TodaySchedule({ rows, activeId, onOpen }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <span className="text-[15px] font-black text-navy">오늘의 일정</span>
        <span className="ml-auto text-[11.5px] text-muted">시간순</span>
      </div>
      <div className="mt-2.5 space-y-2">
        {rows.map((j) => {
          const st = STATE_STYLE[j.state];
          const k = CONCIERGE_JOB_KINDS[j.kind];
          return (
            <button
              key={j.id}
              onClick={() => onOpen(j.id)}
              className="btn-press flex w-full items-start gap-3 rounded-xl border p-3 text-left"
              style={j.id === activeId ? { borderColor: "rgba(30,122,90,.3)", background: "rgba(30,122,90,.05)" } : { borderColor: "rgba(10,31,60,.08)", background: "rgba(255,255,255,.6)" }}
            >
              <span className="w-[46px] shrink-0 pt-[2px] font-num text-[14px] font-bold text-navy">{j.start}</span>
              <span aria-hidden className="mt-[7px] h-[8px] w-[8px] shrink-0 rounded-full" style={{ background: st.dot }} />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-navy">{j.client}</span>
                <span className="block text-[12.5px] leading-[1.5]" style={{ color: k.color }}>
                  {k.label} · {j.detail.split("·")[0].trim()}
                </span>
                <span className="block text-[11.5px] text-muted">{j.where}</span>
              </span>
              <span className="shrink-0 text-right">
                <Badge fg={st.fg} bg={st.bg}>{st.label}</Badge>
                <span className="mt-1 block text-[11.5px] font-bold text-muted">상세 보기 ›</span>
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ── 마무리 필요 — 미작성 보고서 ──
export function WrapUp({ client, onWrite }) {
  if (!client) return null;
  return (
    <div className="rounded-2xl border border-amber/30 bg-[#FFF7E8] p-4">
      <div className="text-[12px] font-bold tracking-[.08em] text-amber">마무리 필요</div>
      <div className="mt-1 flex items-center gap-3">
        <p className="min-w-0 flex-1 text-[14px] leading-[1.6] text-[#5A4A22]">
          {client} 고객 방문 결과보고서가 아직 작성되지 않았습니다.
        </p>
        <button onClick={onWrite} className="btn-press shrink-0 rounded-xl border border-amber/40 bg-white/70 px-3 py-2.5 text-[13px] font-bold text-amber">
          작성하기 ›
        </button>
      </div>
    </div>
  );
}
