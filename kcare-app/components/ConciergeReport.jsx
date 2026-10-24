// 컨시어지 방문 리포트 작성 부품 (2026-10-24 컨시어지 화면설계서 v3 §3).
// 방식 고르기 · 글 칸(보호자께 부탁드려요 · 어르신께 남길 말 · 내부 메모) · 미팅 양식 · 제출 줄 · 발행 전 미리보기
// (보호자 리포트 · 어르신 앱 · 관제). 자택 · 요양병원의 21가지 점검표 · 총평 · 사진은 pages/concierge.jsx 에 그대로 있다.
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AudChip, AudChips, BodyBody, GuardianA4, LEVEL_TONE, LevelToggle, LifeBody, MeetLead, wornDays } from "./ReportParts";
import { VISIT_LEVELS, VISIT_MODES, meetLevel, visitText } from "../lib/checkup";
import { givenName } from "../lib/people";

// 업무형 시안 값 (설계서 0-2)
export const RCARD = "rounded-[14px] border border-[#E5E3DE] bg-white p-3.5";
export const RCARD_IN = "rounded-[14px] border border-dashed border-[#B9BCC8] bg-[#FAFAFB] p-3.5";
const FIELD =
  "w-full rounded-[10px] border border-[#D9D6CF] bg-white px-3 py-2.5 text-[14px] leading-[1.6] text-[#1B2340] outline-none placeholder:text-[#9A9690] focus:border-[#1B2340] read-only:bg-[#FAFAFB]";
const OPT = "btn-press min-h-[44px] rounded-[10px] border text-[14px] font-bold disabled:cursor-not-allowed";
const optTone = (on) => (on ? "border-[#1B2340] bg-[#1B2340] text-white" : "border-[#D9D6CF] bg-white text-[#1B2340]");

// 방식 고르기 — 버튼 3개 같은 폭, 고른 것이 눌린 상태 (설계서 3-2). 제출한 뒤에는 바꾸지 않는다
export function ModePicker({ value, onChange, disabled }) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="방문 리포트 방식">
      {VISIT_MODES.map((m) => (
        <button key={m.k} type="button" aria-pressed={value === m.k} disabled={disabled} onClick={() => onChange(m.k)} className={`${OPT} ${optTone(value === m.k)}`}>
          <span aria-hidden="true">{m.emoji}</span> {m.label}
        </button>
      ))}
    </div>
  );
}

// 글 칸 — 쓰는 동안은 이 칸에만 두고, 칸을 벗어나거나 화면을 내리거나 탭을 바꿀 때 한 번 보낸다
// (폰에서는 탭 전환 · 화면 끄기에 blur 가 오지 않는다 — pages/concierge.jsx 의 총평 · 항목 메모와 같은 방식)
export function ReportText({ label, aud = [], value, onSave, readOnly, oneLine = false, rows = 3, placeholder }) {
  const id = useId();
  const [draft, setDraft] = useState(null);
  const cur = useRef(null);
  cur.current = { draft, value, onSave };
  const flush = useCallback(() => {
    const { draft: d, value: v, onSave: save } = cur.current;
    if (d == null) return;
    if (d !== v) save(d);
    setDraft(null);
  }, []);
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") setTimeout(flush, 0);
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
      flush();
    };
  }, [flush]);
  const common = {
    id,
    value: draft ?? value ?? "",
    readOnly,
    placeholder,
    maxLength: 2000,
    onChange: (e) => setDraft(e.target.value),
    onBlur: flush,
  };
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-h-[22px] items-center justify-between gap-2">
        <label htmlFor={id} className="text-[14px] font-bold text-[#1B2340]">
          {label}
        </label>
        {aud.length > 0 && <AudChips list={aud} />}
      </div>
      {oneLine ? <input type="text" {...common} className={`${FIELD} min-h-[44px]`} /> : <textarea rows={rows} {...common} className={`${FIELD} resize-none`} />}
    </div>
  );
}

// 자택 · 요양병원 — 21가지 점검 · 총평 아래 세 칸 (설계서 3-3 4 · 5 · 6번)
export function HomeTextCards({ visit, dispatch, lock }) {
  const save = (key) => (text) => dispatch({ type: "visitText", key, text });
  return (
    <>
      <section className={RCARD}>
        <ReportText label="보호자께 부탁드려요" aud={["gua"]} value={visitText(visit, "ask")} onSave={save("ask")} readOnly={!!lock} rows={2} placeholder="한 줄에 하나씩 — 번호는 저절로 붙어요" />
      </section>
      <section className={RCARD}>
        <ReportText label="어르신께 남길 말" aud={["sen"]} oneLine value={visitText(visit, "toElder")} onSave={save("toElder")} readOnly={!!lock} placeholder="예) 욕실 매트는 다음 방문 때 바꿔 드릴게요." />
      </section>
      <section className={RCARD_IN}>
        <ReportText label="내부 메모" aud={["in"]} value={visitText(visit, "inner")} onSave={save("inner")} readOnly={!!lock} rows={2} placeholder="관제 · 컨시어지만 봐요 — 보호자 리포트에 나가지 않아요" />
      </section>
    </>
  );
}

function BoxHead({ title, sub, children }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <b className="block text-[16px] text-[#1B2340]">{title}</b>
        <span className="text-[12px] font-bold text-[#7A7F8E]">{sub}</span>
      </div>
      <span className="flex flex-none flex-wrap items-center justify-end gap-1.5">{children}</span>
    </div>
  );
}

// 미팅 리포트 양식 (설계서 3-4) — 대화 · 생활 반응 · 몸 신호 · 종합 · 내부 메모. 21가지 점검 · 사진이 없다.
// 센서 · 워치 값은 자동이라 고치는 칸이 없다 (sensors 가 없으면 '기록 연결 전'). 총평은 자택 리포트와 같은 칸(visit.memo)
export function MeetForm({ visit, dispatch, lock, sensors, period }) {
  const ro = !!lock;
  const t = (k) => visitText(visit, k);
  const save = (key) => (text) => dispatch({ type: "visitText", key, text });
  const lv = (k) => meetLevel(visit, k);
  const setLv = (k) => (v) => dispatch({ type: "visitLevel", k, v });
  return (
    <>
      <div className="rounded-[14px] bg-[#F3F1EC] px-3.5 py-3">
        <MeetLead period={period} sensors={sensors} />
      </div>
      <section className={RCARD} aria-label="만나서 나눈 이야기">
        <BoxHead title="만나서 나눈 이야기" sub="대화 기록">
          <AudChip k="gua" />
          <LevelToggle level={lv("talk")} onChange={setLv("talk")} label="만나서 나눈 이야기" disabled={ro} />
        </BoxHead>
        <div className="mt-3 flex flex-col gap-3">
          <ReportText label="어르신 말씀" value={t("said")} onSave={save("said")} readOnly={ro} rows={2} placeholder="하신 말씀 그대로 — 한 줄에 하나씩" />
          <ReportText label="컨시어지가 본 것" value={t("seen")} onSave={save("seen")} readOnly={ro} rows={2} placeholder="표정 · 걸음 · 옷차림처럼 본 것만 — 한 줄에 하나씩" />
          <ReportText label="부탁하신 것" aud={["sen", "gua"]} oneLine value={t("asked")} onSave={save("asked")} readOnly={ro} placeholder="어르신이 부탁하신 것 — 어르신 앱에도 보여요" />
          <ReportText label="전해 달라신 말" oneLine value={t("relay")} onSave={save("relay")} readOnly={ro} placeholder="가족에게 전해 달라신 말" />
        </div>
      </section>
      <section className={RCARD} aria-label="생활 반응">
        <BoxHead title="생활 반응" sub="모션 감지 센서 · 자동">
          <AudChip k="gua" />
          <LevelToggle level={lv("life")} onChange={setLv("life")} label="생활 반응" disabled={ro} />
        </BoxHead>
        <div className="mt-2">
          <LifeBody sensors={sensors} />
        </div>
      </section>
      <section className={RCARD} aria-label="몸 신호">
        <BoxHead title="몸 신호" sub="갤럭시핏 · 자동">
          <AudChip k="gua" />
          {sensors && <span className="inline-flex h-[22px] items-center rounded-[6px] bg-[#EEEDEA] px-2 text-[11px] font-bold text-[#5E5A52]">7일 중 {wornDays(sensors)}일</span>}
        </BoxHead>
        <div className="mt-2">
          <BodyBody sensors={sensors} />
        </div>
        <div className="mt-3">
          <ReportText label="컨시어지가 챙길 것" value={t("care")} onSave={save("care")} readOnly={ro} rows={2} placeholder="다음 만남까지 챙길 것" />
        </div>
      </section>
      <section className={RCARD} aria-label="종합">
        <div className="flex items-center justify-between gap-2">
          <b className="text-[16px] text-[#1B2340]">종합</b>
          <AudChip k="gua" />
        </div>
        <div className="mt-2.5 grid grid-cols-4 gap-1.5" role="group" aria-label="종합 상태">
          {VISIT_LEVELS.map((l) => {
            const on = lv("level") === l;
            const tone = LEVEL_TONE[l];
            return (
              <button
                key={l}
                type="button"
                aria-pressed={on}
                disabled={ro}
                onClick={() => setLv("level")(l)}
                className={`${OPT} min-h-[40px]`}
                style={on ? { background: tone.bg, color: tone.fg, borderColor: tone.fg } : { background: "#FFFFFF", color: "#1B2340", borderColor: "#D9D6CF" }}
              >
                {l}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-col gap-3">
          <ReportText label="총평" value={visit?.memo || ""} onSave={(text) => dispatch({ type: "visitNote", text })} readOnly={ro} rows={3} placeholder="이번 주를 한두 줄로 — 보호자 리포트 맨 위에 나가요" />
          <ReportText label="보호자께 부탁드려요" value={t("ask")} onSave={save("ask")} readOnly={ro} rows={2} placeholder="한 줄에 하나씩 — 번호는 저절로 붙어요" />
        </div>
      </section>
      <section className={RCARD_IN}>
        <ReportText label="내부 메모" aud={["in"]} value={t("inner")} onSave={save("inner")} readOnly={ro} rows={2} placeholder="관제 · 컨시어지만 봐요 — 보호자 리포트에 나가지 않아요" />
      </section>
    </>
  );
}

// 제출 줄 — [미리보기] [리포트 제출 · 관제 검수 중 · 가족에게 발송됨] (설계서 3-3 7번 · 3-6)
// stage: open(낼 수 있음 · 고치는 중) · submitted(관제 검수 중) · sent(가족에게 발송됨). 발송되는 순간을 보고 있었으면 한 번 반짝인다
export function SendRow({ stage, label, canSubmit, onSubmit, onPreview, glow }) {
  return (
    <div className="flex items-stretch gap-2">
      <button type="button" onClick={onPreview} className="btn-press min-h-[44px] flex-none rounded-[10px] border border-[#D9D6CF] bg-white px-4 text-[14px] font-bold text-[#1B2340]">
        미리보기
      </button>
      <div className="min-w-0 flex-1">
        {stage === "sent" ? (
          <span role="status" className={`flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#3B6B47] text-[14px] font-bold text-white ${glow ? "sent-glow" : ""}`}>
            <span aria-hidden="true">✓</span> 가족에게 발송됨
          </span>
        ) : stage === "submitted" ? (
          <span role="status" className="flex min-h-[44px] w-full items-center justify-center rounded-[10px] bg-[#86621F] text-[14px] font-bold text-white">
            관제 검수 중
          </span>
        ) : (
          <button
            type="button"
            disabled={!canSubmit}
            onClick={onSubmit}
            className="btn-press min-h-[44px] w-full rounded-[10px] bg-[#1B2340] px-2 text-[14px] font-bold text-white disabled:bg-[#E5E3DE] disabled:text-[#9A9690]"
          >
            {label}
          </button>
        )}
      </div>
    </div>
  );
}

// A4 한 장을 칸 너비에 맞춰 줄인다 — '크게 보기'는 82% 로 키우고 옆으로 밀어 본다 (목업 그대로)
function A4Fit({ zoom, children }) {
  const box = useRef(null);
  const inner = useRef(null);
  const [k, setK] = useState(0.4);
  const [h, setH] = useState(1123);
  useEffect(() => {
    const fit = () => {
      const w = box.current?.clientWidth || 320;
      setK(zoom ? 0.82 : w / 794);
      setH(inner.current?.offsetHeight || 1123);
    };
    fit();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(fit);
    if (box.current) ro.observe(box.current);
    if (inner.current) ro.observe(inner.current);
    return () => ro.disconnect();
  }, [zoom]);
  return (
    <div ref={box} className="overflow-x-auto rounded-[10px] border border-[#E5E3DE] bg-[#F3F1EC]">
      <div style={{ width: 794 * k, height: h * k }}>
        <div ref={inner} style={{ width: 794, transform: `scale(${k})`, transformOrigin: "0 0" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

const KST = 9 * 3600 * 1000;
const hm = (t) => new Date(Number(t) + KST).toISOString().slice(11, 16);
// '10월 22일 (목) 오후 2시' — 어르신 앱의 '다음에 오는 날'과 같은 읽는 말
function dayTime(t) {
  const d = new Date(Number(t) + KST);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${"일월화수목금토"[d.getUTCDay()]}) ${h < 12 ? "오전" : "오후"} ${h % 12 || 12}시${m ? ` ${m}분` : ""}`;
}

const TABS = [
  ["gua", "보호자 리포트"],
  ["sen", "어르신 앱"],
  ["in", "관제"],
];

// 발행 전 미리보기 — 시트 위 탭 3개 (설계서 3-5). r = visitReportOf(지금 가구 기록) — 아직 내지 않은 것도 그대로 보인다
export function ReportPreview({ r, period, headline, stage, returned, checkinAt, crew, inner, nextVisitAt }) {
  const [tab, setTab] = useState("gua");
  const [zoom, setZoom] = useState(false);
  const meet = r.mode === "meet";
  const elderLine = meet ? r.meet?.asked : r.toElder;
  const review =
    stage === "sent"
      ? ["발송 완료", LEVEL_TONE.양호]
      : stage === "submitted"
        ? ["검수 중", LEVEL_TONE.주의]
        : returned
          ? ["반려 — 고치는 중", LEVEL_TONE.주의]
          : ["제출 전", { bg: "#EEEDEA", fg: "#5E5A52" }];
  const kv = [
    ["방문", meet ? "외부 미팅 · 카페" : `${r.mode === "hospital" ? "요양병원" : "자택"}${crew ? ` · ${crew}인` : ""}`],
    ["체크인", checkinAt ? `${hm(checkinAt)} GPS` : "체크인 전"],
    ["사진", meet ? "해당 없음" : `${r.photos}장`],
    ["점검", meet ? "해당 없음" : `${r.done} / ${r.total}`],
  ];
  return (
    <div className="flex flex-col gap-3 text-[#1B2340]">
      <div className="grid grid-cols-3 gap-1 rounded-[12px] bg-[#F3F1EC] p-1" role="group" aria-label="받는 곳">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            type="button"
            aria-pressed={tab === k}
            onClick={() => setTab(k)}
            className={`btn-press min-h-[40px] rounded-[9px] text-[13px] font-bold ${tab === k ? "bg-[#1B2340] text-white" : "text-[#5E6676]"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "gua" && (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <AudChip k="gua" />
              <span className="text-[12px] font-bold text-[#7A7F8E]">A4 세로</span>
            </span>
            <button type="button" onClick={() => setZoom((z) => !z)} className="btn-press min-h-[40px] rounded-[10px] border border-[#D9D6CF] bg-white px-3 text-[13px] font-bold">
              {zoom ? "화면 맞춤" : "크게 보기"}
            </button>
          </div>
          <A4Fit zoom={zoom}>
            <GuardianA4 r={r} period={period} headline={headline} />
          </A4Fit>
          <span className="flex items-center gap-1.5 text-[12px] text-[#7A7F8E]">
            <AudChip k="in" />
            내부 메모는 빠져요
          </span>
        </>
      )}

      {tab === "sen" && (
        <>
          <span className="flex items-center gap-1.5">
            <AudChip k="sen" />
            <span className="text-[12px] font-bold text-[#7A7F8E]">어르신 앱 · 홈에 보여요</span>
          </span>
          <section className="flex flex-col gap-1 rounded-[14px] bg-[#E4EEE5] px-4 py-3.5">
            <span className="text-[13px] font-extrabold text-[#2A4D33]">{givenName(r.concierge?.pri || "")} 선생님이 남겼어요</span>
            {elderLine ? (
              <b className="text-[17px] leading-[1.5]">{elderLine}</b>
            ) : (
              <span className="text-[14px] text-[#5E6676]">{meet ? "'부탁하신 것'" : "'어르신께 남길 말'"}이 비어 있어요 — 비워 두면 이 칸은 어르신 홈에 나오지 않아요.</span>
            )}
          </section>
          <section className="flex flex-col gap-1 rounded-[14px] border border-[#E5E3DE] px-4 py-3.5">
            <span className="text-[13px] font-extrabold text-[#5E6676]">다음에 오는 날</span>
            <b className="text-[17px]">{nextVisitAt ? dayTime(nextVisitAt) : "잡힌 방문 일정이 없어요"}</b>
          </section>
          <p className="m-0 text-[12px] leading-[1.6] text-[#7A7F8E]">관제가 검수해 보호자에게 보낼 때 어르신 홈에도 함께 보여요.</p>
        </>
      )}

      {tab === "in" && (
        <>
          <span className="flex items-center gap-1.5">
            <AudChip k="in" />
            <span className="text-[12px] font-bold text-[#7A7F8E]">관제 · 컨시어지만</span>
          </span>
          <section className={RCARD}>
            <div className="flex items-center justify-between gap-2">
              <b className="text-[15px]">검수</b>
              <span className="inline-flex h-[22px] items-center rounded-[6px] px-2 text-[11px] font-bold" style={{ background: review[1].bg, color: review[1].fg }}>
                {review[0]}
              </span>
            </div>
            <dl className="m-0 mt-2 grid grid-cols-[64px_1fr] gap-y-1.5 text-[14px]">
              {kv.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="font-bold text-[#7A7F8E]">{k}</dt>
                  <dd className="m-0 font-bold">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className={RCARD_IN}>
            <div className="flex items-center justify-between gap-2">
              <b className="text-[15px]">내부 메모</b>
              <AudChip k="in" />
            </div>
            <p className="m-0 mt-1.5 whitespace-pre-line text-[14px] font-bold leading-[1.55]">{inner || <span className="font-normal text-[#7A7F8E]">적은 내부 메모가 없어요.</span>}</p>
          </section>
          <section className={RCARD}>
            <div className="flex items-center justify-between gap-2">
              <b className="text-[15px]">보호자 리포트</b>
              <AudChip k="gua" />
            </div>
            <span className="text-[13px] text-[#7A7F8E]">검수 후 보호자 앱 · 알림톡으로 발송</span>
          </section>
        </>
      )}
    </div>
  );
}
