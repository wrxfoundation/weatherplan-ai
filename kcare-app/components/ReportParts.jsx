// 방문 리포트 조각 — 컨시어지 작성 화면 · 발행 전 미리보기 · 보호자 리포트가 같은 모양을 쓴다 (2026-10-24 컨시어지 화면설계서 v3).
// 어느 화면의 디자인 부품(ds · ui)에도 기대지 않는다 — 컨시어지 앱 안 미리보기와 보호자 앱에 그대로 놓인다.
import { MEET_PLACE, VISIT_LEVELS } from "../lib/checkup";
import { WEEK_DAYS, meetMinutesText } from "../lib/visit-report";

// 상태 칩 색 — 양호/완료 · 주의 · 관찰/정보 · 위험/긴급 (설계서 0-2)
export const LEVEL_TONE = {
  양호: { bg: "#E4EEE5", fg: "#2A4D33" },
  관찰: { bg: "#E8EBF7", fg: "#33468E" },
  주의: { bg: "#F1E9DC", fg: "#6A4C16" },
  위험: { bg: "#FBE5E0", fg: "#9A3424" },
};

// '보이는 곳' 칩 — 입력칸 오른쪽 (설계서 0-3)
const AUD = {
  sen: { label: "어르신", bg: "#F1E9DC", fg: "#86621F" },
  gua: { label: "보호자", bg: "#DCEDEB", fg: "#0E5A5A" },
  in: { label: "내부", bg: "#E6E7ED", fg: "#3A3F50", lock: true },
};
export function AudChip({ k }) {
  const a = AUD[k];
  if (!a) return null;
  return (
    <span className="inline-flex h-[22px] flex-none items-center gap-1 rounded-[6px] px-1.5 text-[11px] font-bold" style={{ background: a.bg, color: a.fg }}>
      {a.lock && (
        <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      )}
      {a.label}
    </span>
  );
}
export function AudChips({ list }) {
  return (
    <span className="flex flex-none items-center gap-1">
      {list.map((k) => (
        <AudChip key={k} k={k} />
      ))}
    </span>
  );
}

export function LevelChip({ level, prefix = "", suffix = "" }) {
  const t = LEVEL_TONE[level] || LEVEL_TONE.관찰;
  return (
    <span className="inline-flex h-[22px] flex-none items-center gap-1 rounded-[6px] px-2 text-[11px] font-bold" style={{ background: t.bg, color: t.fg }}>
      <span aria-hidden="true">●</span>
      {prefix}
      {level}
      {suffix}
    </span>
  );
}

// 눌러서 바꾸는 상태 칩 — 양호 → 관찰 → 주의 → 위험 → 양호
export function LevelToggle({ level, onChange, label, disabled }) {
  const next = VISIT_LEVELS[(VISIT_LEVELS.indexOf(level) + 1) % VISIT_LEVELS.length];
  const t = LEVEL_TONE[level] || LEVEL_TONE.관찰;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(next)}
      aria-label={`${label} 상태 ${level} — 누르면 ${next}`}
      className="btn-press inline-flex min-h-[32px] flex-none items-center gap-1 rounded-[8px] px-2.5 text-[12px] font-bold disabled:opacity-60"
      style={{ background: t.bg, color: t.fg }}
    >
      <span aria-hidden="true">●</span>
      {level}
    </button>
  );
}

// 줄마다 하나 — 앞에 붙은 '1.' · '2)' 같은 번호는 지운다 (보호자께 부탁드려요는 화면이 번호를 다시 붙인다)
export const textLines = (s) =>
  String(s || "")
    .split("\n")
    .map((x) => x.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean);

// 보호자께 부탁드려요 — 번호 목록
export function AskList({ text, dark = false }) {
  const ls = textLines(text);
  if (!ls.length) return null;
  return (
    <section className="flex flex-col gap-1.5 rounded-[14px] px-4 py-3" style={dark ? { background: "#1E2B4A", color: "#FFFFFF" } : { background: "#F3F1EC", color: "#1B2340" }}>
      <b className="text-[15px]">보호자께 부탁드려요</b>
      <ol className="m-0 flex list-none flex-col gap-1 p-0">
        {ls.map((x, i) => (
          <li key={i} className="flex gap-2 text-[14px] leading-[1.55]">
            <b style={{ color: dark ? "#C9B27A" : "#86621F" }}>{i + 1}</b>
            <span>{x}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Dots({ arr, on, worn = false }) {
  return (
    <div className="grid grid-cols-7 gap-1 py-1.5 text-center">
      {WEEK_DAYS.map((d, i) => (
        <div key={d} className="flex flex-col items-center gap-1 text-[12px] font-extrabold">
          {d}
          {worn ? (
            <span
              className="flex h-[28px] w-full items-center justify-center rounded-[6px] text-[11px]"
              style={arr[i] ? { background: on, color: "#FFFFFF" } : { border: "1.5px dashed #B9B2A3", color: "#9A9690" }}
            >
              {arr[i] ? "착용" : "–"}
            </span>
          ) : (
            <span aria-hidden="true" className="h-3 w-3 rounded-full" style={arr[i] ? { background: on } : { border: "1.5px solid #9A9690" }} />
          )}
        </div>
      ))}
    </div>
  );
}

const ROW = "flex items-center justify-between gap-2 border-t border-[#EFEDE8] py-2 text-[14px]";

// 생활 반응 — 모션 감지 센서(자동). 기록이 없으면 연결 전이라고만 쓴다 (값을 지어내지 않는다)
export function LifeBody({ sensors }) {
  if (!sensors)
    return <p className="m-0 py-1 text-[13px] leading-[1.6] text-[#7A7F8E]">모션 감지 센서 기록이 아직 연결되지 않았어요 — 연결되면 무반응 알림 · 하루 첫 움직임 · 새벽 움직임이 자동으로 들어와요.</p>;
  const L = sensors.life;
  return (
    <>
      <div className={ROW}>
        <span className="font-bold">무반응 알림</span>
        <b className="font-num">{L.noResponse}회</b>
      </div>
      <div className={ROW}>
        <span className="font-bold">하루 첫 움직임</span>
        <b className="font-num">{L.firstMove}</b>
      </div>
      <div className={ROW}>
        <span className="font-bold">새벽 1–4시</span>
        <b className="font-num">
          {L.dawn}회 · 평소 {L.dawnUsual}
        </b>
      </div>
      <Dots arr={L.nights} on="#4F6383" />
    </>
  );
}

// 몸 신호 — 갤럭시핏(자동). 착용한 날만 기록된다
export function BodyBody({ sensors }) {
  if (!sensors) return <p className="m-0 py-1 text-[13px] leading-[1.6] text-[#7A7F8E]">갤럭시핏 기록이 아직 연결되지 않았어요 — 연결되면 착용한 날의 수면 · 걸음 · 심박이 자동으로 들어와요.</p>;
  const B = sensors.body;
  return (
    <>
      <Dots arr={B.worn} on="#0E5A5A" worn />
      {B.days.map(([d, v]) => (
        <div key={d} className={ROW}>
          <span className="font-bold">{d}</span>
          <b className="font-num text-[13px]">{v}</b>
        </div>
      ))}
    </>
  );
}
export const wornDays = (sensors) => (sensors ? sensors.body.worn.filter(Boolean).length : 0);
const dayWord = (n) => ["", "하루", "이틀", "사흘"][n] || `${n}일`;

// 미팅 리포트 머리 줄 — '10.05 – 10.11 · 만남 10.08 (목)' / '집 근처 카페 · 1시간 30분'
export function MeetLead({ period, sensors }) {
  return (
    <div className="flex flex-col gap-0.5">
      <b className="text-[15px] text-[#1B2340]">
        {period.range} · 만남 {period.meetDay}
      </b>
      <span className="text-[13px] font-bold text-[#6F7482]">
        {MEET_PLACE}
        {sensors?.minutes ? ` · ${meetMinutesText(sensors.minutes)}` : ""}
      </span>
    </div>
  );
}

const Bul = ({ text }) =>
  textLines(text).map((x, i) => (
    <li key={i} className="flex gap-2 text-[14px] leading-[1.6]">
      <span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 flex-none rounded-full bg-[#1B2340]" />
      <span>{x}</span>
    </li>
  ));

// 보호자에게 가는 미팅 리포트 본문 — 보호자 리포트 · 컨시어지 발행 전 미리보기 (내부 메모는 넣지 않는다)
// lead — 머리 줄(기간 · 장소)을 이 안에 둘지. A4 인쇄본은 문서 머리에 기간이 있어 뺀다
export function MeetGuardianBody({ r, period, lead = true }) {
  const m = r.meet || {};
  const card = "flex flex-col gap-1.5 rounded-[14px] border border-[#E5E3DE] bg-white p-3.5";
  return (
    <div className="flex flex-col gap-3 text-[#1B2340]">
      {lead && <MeetLead period={period} sensors={m.sensors} />}
      <section className={card}>
        <p className="m-0 text-[15px] leading-[1.65]">
          <b>총평 </b>
          {r.memo || "총평이 아직 없어요."}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <LevelChip level={m.talk} prefix="만나서 나눈 이야기 · " />
          {m.sensors && <LevelChip level={m.life} prefix="생활 반응 · " />}
          <span className="inline-flex h-[22px] items-center rounded-[6px] border border-dashed border-[#9A9690] px-2 text-[11px] font-bold text-[#5E6676]">
            몸 신호 · {m.sensors ? `7일 중 ${wornDays(m.sensors)}일 착용` : "기록 연결 전"}
          </span>
        </div>
      </section>
      <section className={card}>
        <div className="flex items-center justify-between gap-2">
          <b className="text-[16px]">만나서 나눈 이야기</b>
          <LevelChip level={m.talk} />
        </div>
        <span className="text-[12px] font-bold text-[#7A7F8E]">대화 기록 · {MEET_PLACE}</span>
        {m.said && (
          <>
            <span className="mt-1 text-[12px] font-extrabold text-[#5E6676]">어르신 말씀</span>
            <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
              <Bul text={m.said} />
            </ul>
          </>
        )}
        {m.seen && (
          <>
            <span className="mt-1 text-[12px] font-extrabold text-[#5E6676]">컨시어지가 본 것</span>
            <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
              <Bul text={m.seen} />
            </ul>
          </>
        )}
        {(m.asked || m.relay) && (
          <div className="mt-1 flex flex-col gap-0.5 rounded-[10px] bg-[#F3F1EC] px-3 py-2 text-[14px] leading-[1.55]">
            {m.asked && (
              <>
                <span className="text-[12px] font-extrabold text-[#5E6676]">부탁하신 것</span>
                <span>{m.asked}</span>
              </>
            )}
            {m.relay && (
              <>
                <span className="mt-1 text-[12px] font-extrabold text-[#5E6676]">전해 달라신 말</span>
                <span>{m.relay}</span>
              </>
            )}
          </div>
        )}
        {!m.said && !m.seen && !m.asked && !m.relay && <span className="text-[13px] text-[#7A7F8E]">적은 대화 기록이 없어요.</span>}
      </section>
      <section className={card}>
        <div className="flex items-center justify-between gap-2">
          <b className="text-[16px]">생활 반응</b>
          {m.sensors && <LevelChip level={m.life} />}
        </div>
        <span className="text-[12px] font-bold text-[#7A7F8E]">모션 감지 센서 · 비접촉 · 자동</span>
        <LifeBody sensors={m.sensors} />
        <p className="m-0 rounded-[10px] bg-[#F3F1EC] px-3 py-2 text-[12.5px] leading-[1.55] text-[#3A4558]">무반응이 감지되면 관제가 먼저 전화드리고, 응답이 없으면 컨시어지가 찾아갑니다.</p>
      </section>
      <section className={card}>
        <div className="flex items-center justify-between gap-2">
          <b className="text-[16px]">몸 신호</b>
          {m.sensors && <span className="text-[12px] font-bold text-[#5E6676]">7일 중 {wornDays(m.sensors)}일</span>}
        </div>
        <span className="text-[12px] font-bold text-[#7A7F8E]">갤럭시핏 · 착용하신 날만 기록됩니다</span>
        <BodyBody sensors={m.sensors} />
        {wornDays(m.sensors) > 0 && wornDays(m.sensors) < 4 && <p className="m-0 text-[12px] text-[#7A7F8E]">{dayWord(wornDays(m.sensors))} 기록으로는 평균을 내거나 평소와 비교하지 않습니다.</p>}
        {m.care && (
          <div className="mt-1 flex flex-col gap-0.5 rounded-[10px] bg-[#F3F1EC] px-3 py-2 text-[14px] leading-[1.55]">
            <span className="text-[12px] font-extrabold text-[#5E6676]">컨시어지가 챙길 것</span>
            <span>{m.care}</span>
          </div>
        )}
      </section>
      <AskList text={r.ask} dark />
      <p className="m-0 border-t-[1.5px] border-dashed border-[#8A909C] pt-2 text-[12px] leading-[1.6] text-[#5E6676]">
        집 안 21가지 점검 없이 · 만남 · 센서 · 갤럭시핏 기록으로 만든 리포트입니다. 관찰 기록이며 진단 · 판단이 아닙니다.
      </p>
    </div>
  );
}

// ── 보호자 리포트 A4 한 장 (컨시어지 '발행 전 미리보기'의 보호자 리포트 탭 · 설계서 v3 §3-5) ──
// 794 × 1123 (A4 세로 96dpi). 화면에 맞추는 축소는 쓰는 쪽이 한다. 내부 메모는 넣지 않는다.
// 실제 인쇄본(PDF 저장)은 /report/visit 한 곳 — 이것은 컨시어지가 내기 전에 보는 모양이다.
const ymdDot = (t) => new Date(Number(t) + 9 * 3600 * 1000).toISOString().slice(0, 10).replace(/-/g, ".");
const A4_BOX = "flex flex-col gap-2.5 rounded-[14px] border-[1.5px] border-[#A79F8E] px-[18px] py-3.5";
const A4_COL = "flex min-w-0 flex-col gap-1.5 rounded-[14px] border-[1.5px] border-[#D9D3C6] p-3.5";
const A4_LAB = "text-[12px] font-extrabold text-[#5E6676]";
const A4_ROW = "flex items-start justify-between gap-2 border-b border-[#EFEDE8] py-1.5 text-[13px] last:border-0";

function A4Ask({ text }) {
  const ls = textLines(text);
  if (!ls.length) return null;
  return (
    <section className="flex flex-col gap-1.5 rounded-[14px] bg-[#1E2B4A] px-5 py-3.5 text-white">
      <b className="text-[15px]">보호자께 부탁드려요</b>
      {ls.map((x, i) => (
        <div key={i} className="flex gap-2.5 text-[13px] leading-[1.5]">
          <b className="text-[#C9B27A]">{i + 1}</b>
          <span>{x}</span>
        </div>
      ))}
    </section>
  );
}

function HomeA4({ r, headline }) {
  // 관찰 · 주의는 컨시어지가 그 항목에 고른 상태 그대로 — 화면이 판정을 만들지 않는다
  const marked = r.axes.flatMap((a) => a.items.filter((i) => i.grade === "관찰" || i.grade === "주의").map((i) => ({ ...i, axis: a.axis })));
  return (
    <>
      <section className={A4_BOX}>
        {headline && <p className="m-0 text-[19px] font-extrabold">{headline}</p>}
        <p className="m-0 text-[14.5px] leading-[1.6]">
          <b>총평</b>&nbsp; {r.memo || "총평이 아직 없어요."}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {r.axes.map((a) => (
            <span key={a.axis} className="inline-flex h-[24px] items-center rounded-[6px] bg-[#F3F1EC] px-2 text-[12px] font-bold text-[#3A4558]">
              {a.axis} · 확인 {a.items.filter((i) => i.done).length}/{a.items.length}
            </span>
          ))}
          {["양호", "관찰", "주의"]
            .filter((g) => r.gradeCounts?.[g])
            .map((g) => (
              <LevelChip key={g} level={g} suffix={` ${r.gradeCounts[g]}`} />
            ))}
          <span className="inline-flex h-[24px] items-center rounded-[6px] border border-dashed border-[#9A9690] px-2 text-[12px] font-bold text-[#5E6676]">
            21가지 중 {r.done} 확인
          </span>
        </div>
      </section>
      <section className="flex flex-col gap-2 rounded-[14px] bg-[#0E5A5A] px-4 py-3 text-white">
        <div className="flex items-baseline justify-between gap-2">
          <b className="text-[15px]">관찰 · 주의로 적은 것 · {marked.length}</b>
          <span className="text-[12px]">점수가 아니라 달라진 것만 적습니다</span>
        </div>
        {marked.length ? (
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(4, marked.length)}, minmax(0, 1fr))` }}>
            {marked.slice(0, 4).map((i) => (
              <div key={`${i.axis}-${i.k}`} className="flex flex-col gap-0.5 rounded-[9px] bg-white px-2.5 py-2">
                <span className="text-[12px] font-extrabold text-[#0E5A5A]">
                  {i.axis} · {i.k}
                </span>
                <span className="text-[13px] font-bold text-[#17233A]">{i.note || i.grade}</span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-[13px]">관찰 · 주의로 고른 항목이 없어요.</span>
        )}
      </section>
      <div className="grid flex-1 grid-cols-3 gap-2.5">
        {r.axes.map((a) => (
          <section key={a.axis} className={A4_COL}>
            <b className="border-b-2 border-[#1E2B4A] pb-1 text-[15px]">{a.axis} 7가지</b>
            <div>
              {a.items.map((i) => (
                <div key={i.k} className={A4_ROW}>
                  <span className={`flex-none font-bold ${i.done ? "" : "text-[#9A9690]"}`}>{i.k}</span>
                  <span className={`text-right ${i.done ? "font-semibold" : "text-[#9A9690]"}`}>{i.done ? i.note || i.grade || "확인함" : "이번엔 보지 않음"}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

function MeetA4({ r, m }) {
  return (
    <>
      <section className={A4_BOX}>
        <p className="m-0 text-[15px] leading-[1.6]">
          <b>총평</b>&nbsp; {r.memo || "총평이 아직 없어요."}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <LevelChip level={m.talk} prefix="만나서 나눈 이야기 · " />
          {m.sensors && <LevelChip level={m.life} prefix="생활 반응 · " />}
          <span className="inline-flex h-[22px] items-center rounded-[6px] border border-dashed border-[#9A9690] px-2 text-[11px] font-bold text-[#5E6676]">
            몸 신호 · {m.sensors ? `7일 중 ${wornDays(m.sensors)}일 착용` : "기록 연결 전"}
          </span>
        </div>
      </section>
      <div className="grid flex-1 grid-cols-3 gap-2.5">
        <section className={A4_COL}>
          <b className="border-b-2 border-[#1E2B4A] pb-1 text-[15px]">만나서 나눈 이야기</b>
          <span className="text-[12px] text-[#7A7F8E]">대화 기록 · {MEET_PLACE}</span>
          {m.said && <span className={A4_LAB}>어르신 말씀</span>}
          {m.said && (
            <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
              <Bul text={m.said} />
            </ul>
          )}
          {m.seen && <span className={A4_LAB}>컨시어지가 본 것</span>}
          {m.seen && (
            <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
              <Bul text={m.seen} />
            </ul>
          )}
          <div className="flex-1" />
          {(m.asked || m.relay) && (
            <div className="flex flex-col gap-0.5 rounded-[10px] bg-[#F3F1EC] px-3 py-2 text-[13px] leading-[1.5]">
              {m.asked && <span className={A4_LAB}>부탁하신 것</span>}
              {m.asked && <span>{m.asked}</span>}
              {m.relay && <span className={`${A4_LAB} mt-1`}>전해 달라신 말</span>}
              {m.relay && <span>{m.relay}</span>}
            </div>
          )}
        </section>
        <section className={A4_COL}>
          <b className="border-b-2 border-[#1E2B4A] pb-1 text-[15px]">생활 반응</b>
          <span className="text-[12px] text-[#7A7F8E]">모션 감지 센서 · 비접촉</span>
          <LifeBody sensors={m.sensors} />
          <div className="flex-1" />
          <p className="m-0 rounded-[10px] bg-[#F3F1EC] px-3 py-2 text-[12px] leading-[1.5] text-[#3A4558]">무반응이 감지되면 관제가 먼저 전화드리고, 응답이 없으면 컨시어지가 찾아갑니다.</p>
        </section>
        <section className={A4_COL}>
          <b className="border-b-2 border-[#1E2B4A] pb-1 text-[15px]">몸 신호</b>
          <span className="text-[12px] text-[#7A7F8E]">갤럭시핏 · 착용하신 날만 기록됩니다</span>
          <BodyBody sensors={m.sensors} />
          <div className="flex-1" />
          {m.care && (
            <div className="flex flex-col gap-0.5 rounded-[10px] bg-[#F3F1EC] px-3 py-2 text-[13px] leading-[1.5]">
              <span className={A4_LAB}>컨시어지가 챙길 것</span>
              <span>{m.care}</span>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export function GuardianA4({ r, period, headline }) {
  const meet = r.mode === "meet";
  const m = r.meet || {};
  const pri = r.concierge?.pri || "";
  const sub = meet
    ? `${period.long} · 담당 컨시어지 ${pri} · 만남 1회 (${period.meetDayBare})`
    : `${ymdDot(r.visitedTs || Date.now())} 안심방문 · 담당 컨시어지 ${pri}`;
  return (
    <div className="flex min-h-[1123px] w-[794px] flex-col gap-3 bg-white p-[34px] text-[#17233A]">
      {/* 머리 · 꼬리는 div — 시트 안 미리보기라 header · footer 로 두면 화면의 머리 영역(banner)이 둘이 된다 (스모크 landmark-unique) */}
      <div className="flex items-center justify-between gap-4 rounded-[16px] bg-[#1E2B4A] px-[22px] py-[18px] text-white">
        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-extrabold tracking-[.08em] text-[#C9B27A]">K-CARE 보호자 리포트{meet ? " · 미팅" : ""}</span>
          <span className="flex items-baseline gap-2">
            <b className="text-[32px] font-black">{r.client}</b>
            <span className="text-[14px] text-[#D5DAE4]">어르신</span>
          </span>
          <span className="text-[13px] text-[#D5DAE4]">{sub}</span>
        </div>
        {/* 종합은 미팅 리포트에만 — 컨시어지가 고른 4단계 그대로 (자택 리포트는 종합 판정을 만들지 않는다) */}
        {meet && (
          <div className="flex flex-col items-end gap-1.5">
            <LevelChip level={m.level} prefix="종합 · " />
            <span className="text-[12px] text-[#AEB6C6]">양호 · 관찰 · 주의 · 위험</span>
          </div>
        )}
      </div>
      {meet ? <MeetA4 r={r} m={m} /> : <HomeA4 r={r} headline={headline} />}
      <A4Ask text={r.ask} />
      <div className="flex items-center justify-between gap-3 border-t-[1.5px] border-dashed border-[#8A909C] pt-2 text-[12px] text-[#5E6676]">
        <span>{meet ? "집 안 21가지 점검 없이 · 만남 · 센서 · 갤럭시핏 기록으로 만든 리포트입니다." : `관제 검수 후 발송 · 사진 ${r.photos}장 첨부`}</span>
        <span className="whitespace-nowrap">K-CARE · 담당 {pri}</span>
      </div>
    </div>
  );
}
