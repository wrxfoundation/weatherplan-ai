import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { Clay, Line } from "../../components/clay";
import { Btn, Card, EvenGrid, Sheet, SheetTitle, TONE, WhiteBtn, eventTone } from "../../components/ds";
import { EVENT_KINDS, MOU_HOSPITALS } from "../../lib/mock";
import { useAppState } from "../../lib/state";
import { useGuardianRole } from "../../lib/guardian-role";
import { REAPPROVE_KEYS, eventOwner, eventRights } from "../../lib/event-rights";
import { honorific } from "../../lib/tracks";

// 공유 캘린더 — REQ-02 · 2026-10-15 디자인 시안 '예약'
// 보호자 권한: 조회·등록·수정·결제. 컨시어지 등록 일정은 source로 구분 표시.
// 알림: 지정 기간(7일) 내 일정을 맨 위 한 줄로 — 누르면 목록이 펼쳐진다 (센 만큼 다 보여 준다 · 2026-10-02 QA).
// 시안과 다른 점: 달 넘기기(‹ ›)를 그대로 둔다 · 일요일 숫자는 갈색 (빨강은 위험 신호 전용).

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
// 달력 점 색 — 일정 종류의 색(eventTone)을 진하게
const DOT = { green: "#3B6B47", beige: "#B08A4A", blue: "#5470B8", purple: "#6A4D9C" };
// 일정 카드 왼쪽 작은 꼬리표 — EVENT_KINDS 이름이 길면(다음 진료 예정일) 줄인다
const SHORT = { hospital: "병원", checkup: "검진", nextAppt: "진료 예정", medication: "복약", visit: "안심방문", family: "가족", delivery: "배송", request: "해주세요", daily: "일상동행" };
const hm = (at) => new Date(at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
const md = (at) => new Date(at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
const smallBtn = "ds-press ds-btn3d h-11 flex-none rounded-[14px] bg-white px-3.5 text-[14px]";

// 고른 날 일정 한 줄 — 수정 · 삭제(승인 전 · 가족 일정 · 반려) · 취소(확정된 일정, 관제에 알림). 규칙은 lib/event-rights.js
function EventRow({ e, rights, onEdit, onRemove }) {
  const [confirm, setConfirm] = useState(false);
  const [reason, setReason] = useState("");
  const tn = TONE[eventTone(e.kind)];
  const cancel = rights.remove === "cancel";
  return (
    <div className="ds-swap flex flex-col gap-2.5 rounded-[22px] px-4 py-3.5" style={{ background: tn.bg }}>
      <div className="flex items-center gap-3.5">
        <div className="w-[62px] flex-none text-center">
          <div className="text-[12px] font-extrabold" style={{ color: tn.fg }}>
            {SHORT[e.kind] || EVENT_KINDS[e.kind]?.label || "일정"}
          </div>
          <div className="ds-num text-[18px] font-black">{hm(e.at)}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[18px] font-extrabold leading-[1.35]">{e.title}</div>
          <div className="text-[14px] leading-[1.5]" style={{ color: "#4A4F5E" }}>
            {/* 자동으로 붙은 '동행 필요 / 불필요'는 지금 동행 값으로 읽는다 (예전 기록의 메모가 바뀐 동행과 어긋나지 않게) */}
            {[e.source, /^동행 (불)?필요$/.test(e.note || "") ? (e.escort ? "동행 필요" : "동행 불필요") : e.note, e.editedAt ? "수정됨" : ""].filter(Boolean).join(" · ")}
          </div>
          {/* 확정 뒤 바꾼 것을 관제가 반려 — 일정은 원래 확정 값으로 돌아갔다 */}
          {e.changeRejected && e.approval === "approved" && (
            <span className="mt-1 inline-flex rounded-full bg-white px-2.5 py-0.5 text-[12px] font-extrabold" style={{ color: "#5E6270" }}>
              바꾼 내용 관제 반려{e.changeRejected.reason ? ` — ${e.changeRejected.reason}` : ""} · 원래 일정 그대로
            </span>
          )}
          {/* 승인 상태 — 승인 전에는 확정된 일정처럼 보이면 안 된다 */}
          {e.approval === "pending" && (
            <span className="mt-1 inline-flex rounded-full bg-white px-2.5 py-0.5 text-[12px] font-extrabold" style={{ color: TONE.gold.fg }}>
              {e.reapproval ? "바뀐 내용 관제 재승인 대기" : "관제 승인 대기"} {e.escort ? "· 동행 필요" : "· 동행 불필요"}
            </span>
          )}
          {/* 반려는 위험 신호가 아니다 — 빨강 대신 회색 */}
          {e.approval === "rejected" && (
            <span className="mt-1 inline-flex rounded-full bg-white px-2.5 py-0.5 text-[12px] font-extrabold" style={{ color: "#5E6270" }}>
              관제 반려{e.rejectReason ? ` — ${e.rejectReason}` : ""}
            </span>
          )}
          {/* 병원 일정 — 관제가 승인한 동행 건만 '동행 확정'. 누가 가는지는 배차가 정해지기 전엔 지어내지 않는다 */}
          {e.kind === "hospital" && e.approval === "approved" && e.escort && (
            <span className="mt-1 inline-flex rounded-full bg-white px-2.5 py-0.5 text-[12px] font-extrabold" style={{ color: TONE.green.fg }}>
              동행 확정{e.escortTeam ? ` — ${e.escortTeam}` : " — 담당자는 관제가 배정 후 안내"}
            </span>
          )}
          {e.reqId && (
            <Link href="/family/requests" className="mt-1 inline-flex min-h-[32px] items-center text-[13px] font-extrabold underline underline-offset-4" style={{ color: "#3A3F50" }}>
              해주세요에서 바꾸거나 취소해요
            </Link>
          )}
        </div>
      </div>
      {(rights.edit || rights.remove) && !confirm && (
        <div className="flex justify-end gap-2">
          {rights.edit && (
            <button type="button" onClick={onEdit} aria-label={`${e.title} 수정`} className={smallBtn} style={{ boxShadow: "0 3px 0 rgba(0,0,0,.08)" }}>
              수정
            </button>
          )}
          {rights.remove && (
            <button type="button" onClick={() => setConfirm(true)} aria-label={`${e.title} ${cancel ? "취소" : "삭제"}`} className={smallBtn} style={{ boxShadow: "0 3px 0 rgba(0,0,0,.08)", color: "#6E5A4A" }}>
              {cancel ? "취소" : "삭제"}
            </button>
          )}
        </div>
      )}
      {confirm && (
        <div className="rounded-[16px] bg-white p-3.5">
          <p className="text-[16px] font-extrabold">{cancel ? "확정된 일정을 취소할까요?" : "이 일정을 지울까요?"}</p>
          <p className="mt-0.5 text-[13px] leading-[1.6]" style={{ color: "#5E6270" }}>
            {cancel
              ? "관제에 바로 알리고, 잡혀 있던 동행 · 차량도 함께 거둡니다. 기록에는 '취소'로 남습니다."
              : e.approval === "pending"
                ? "관제에 보낸 승인 요청도 함께 거둡니다."
                : "가족 달력에서 빠집니다."}
          </p>
          {cancel && (
            <>
              <label htmlFor={`cx-${e.id}`} className="mt-2 block text-[13px] font-extrabold" style={{ color: "#3A3F50" }}>
                취소 사유 (선택)
              </label>
              <input
                id={`cx-${e.id}`}
                value={reason}
                onChange={(x) => setReason(x.target.value)}
                placeholder="예: 병원 예약이 바뀌었어요"
                className="mt-1 min-h-[46px] w-full rounded-[14px] border-2 border-[#E3DED3] bg-white px-3 text-[15px] outline-none focus:border-[#1B2340]"
              />
            </>
          )}
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setConfirm(false)} className="ds-press flex min-h-[46px] items-center justify-center rounded-[14px] text-[15px] font-extrabold" style={{ background: "#F3F1EC", boxShadow: "0 3px 0 #E3DED3" }}>
              그대로 두기
            </button>
            <button
              type="button"
              onClick={() => (onRemove(reason), setConfirm(false))}
              className="ds-press flex min-h-[46px] items-center justify-center rounded-[14px] text-[15px] font-extrabold text-white"
              style={{ background: "#1B2340", boxShadow: "0 3px 0 #0E1428" }}
            >
              {cancel ? "일정 취소" : "지우기"}
            </button>
          </div>
        </div>
      )}
      {!rights.edit && !rights.remove && rights.why && !e.reqId && (
        <p className="text-right text-[12px] font-bold" style={{ color: "#5E6270" }}>
          {rights.why}
        </p>
      )}
    </div>
  );
}

export default function CalendarPage() {
  const { state, dispatch } = useAppState();
  const { isPrimary } = useGuardianRole(); // 로그인한 가구는 계정 기준 (lib/guardian-role.js)
  const honor = honorific(state.onboarding); // 고객 호칭 — 전부 "~~님" (2026-08-12 시트)
  const today = new Date();
  const [ym, setYm] = useState({ y: today.getFullYear(), m: today.getMonth() });
  // 첫 진입 시 빈 날짜 대신 가장 가까운 일정이 있는 날을 보여준다 (홈 "다음 일정" 동선)
  const [selected, setSelected] = useState(() => {
    const inMonth = state.events.filter((e) => {
      const d = new Date(e.at);
      return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
    });
    const next =
      inMonth.filter((e) => e.at >= Date.now()).sort((a, b) => a.at - b.at)[0] ||
      inMonth.sort((a, b) => b.at - a.at)[0];
    return next ? new Date(next.at).getDate() : today.getDate();
  });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null); // 수정 대상 이벤트 — 보호자 권한(REQ-02)
  const [soonOpen, setSoonOpen] = useState(false);

  const events = state.events;

  const monthEvents = useMemo(() => {
    const map = {};
    for (const e of events) {
      const d = new Date(e.at);
      if (d.getFullYear() === ym.y && d.getMonth() === ym.m) {
        (map[d.getDate()] = map[d.getDate()] || []).push(e);
      }
    }
    return map;
  }, [events, ym]);

  const first = new Date(ym.y, ym.m, 1);
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells = [...Array(first.getDay()).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const dayEvents = (monthEvents[selected] || []).sort((a, b) => a.at - b.at);
  // 7일 이내 — 반려된 것은 빼고, 센 만큼 다 보여 준다 ('5건'이라 해 놓고 3건만 보이던 것 · 2026-10-02 QA)
  const soon = events
    .filter((e) => e.approval !== "rejected" && e.at > Date.now() && e.at < Date.now() + 7 * 86400000)
    .sort((a, b) => a.at - b.at);

  // 지운 · 취소한 일정 — 취소(확정된 것을 거둔 것)만 30일 동안 보여 준다
  const cancelled = (state.eventsRemoved || []).filter((x) => x.removed?.mode === "cancel" && x.removed.at > Date.now() - 30 * 86400000).slice(0, 8);
  const removeEvent = (e, reason) => {
    const rights = eventRights(e, "guardian", { primary: isPrimary });
    if (!rights.remove) return;
    const cancel = rights.remove === "cancel";
    dispatch({ type: "removeEvent", id: e.id, mode: rights.remove, by: "보호자", reason, title: e.title });
    // 컨시어지가 병원과 잡은 진료 예약 — 보호자가 지우면 담당 컨시어지 · 관제가 알아야 한다 (동행 배차가 걸려 있을 수 있다 · 2026-10-19 점검)
    if (eventOwner(e) === "concierge") {
      dispatch({
        type: "addOpsMessage",
        payload: { from: "보호자", role: "guardian", kind: "event", text: `컨시어지가 등록한 진료 예약을 보호자가 지웠습니다 — ${e.title} · ${md(e.at)} ${hm(e.at)}${e.escort ? " · 동행 배차 정리 필요" : ""}${reason?.trim() ? ` · ${reason.trim()}` : ""}` },
      });
    }
    dispatch({
      type: "pushEvent",
      payload: cancel
        ? { kind: "일정", text: `보호자 일정 취소 — ${e.title}${reason?.trim() ? ` · ${reason.trim()}` : ""} · 동행 · 차량 정리 필요`, color: "#F0D9A8" }
        : { kind: "일정", text: `${e.approval === "pending" ? "보호자 일정요청 철회" : "가족 일정 삭제"} — ${e.title}`, color: "#8FA9CC" },
    });
  };
  const isToday = (d) => d === today.getDate() && ym.m === today.getMonth() && ym.y === today.getFullYear();
  const moveMonth = (delta) => {
    const m = ym.m + delta;
    setYm(m < 0 ? { y: ym.y - 1, m: 11 } : m > 11 ? { y: ym.y + 1, m: 0 } : { ...ym, m });
    setSelected(1);
  };
  // 이번 달에 있는 일정 종류만 범례에 (없는 색을 설명하지 않는다)
  const legend = [
    ["green", "병원"],
    ["beige", "안심방문"],
    ["blue", "배송 · 그 밖"],
    ["purple", "가족"],
  ].filter(([t]) => Object.values(monthEvents).flat().some((e) => eventTone(e.kind) === t));

  return (
    <>
      <Head>
        <title>예약 — K-CARE</title>
      </Head>
      <FamilyLayout sub={`${honor} 일정`} title="예약" face={false}>
        {/* 다가오는 일정 — 회의: 지정 기간 내 알람은 팝업 표기. 한 줄로 알리고 누르면 펼친다 */}
        {soon.length > 0 && (
          <div className="ds-r overflow-hidden rounded-[20px]" style={{ "--d": "40ms", background: TONE.beige.bg }}>
            <button
              type="button"
              onClick={() => setSoonOpen((v) => !v)}
              aria-expanded={soonOpen}
              className="ds-press flex min-h-[52px] w-full items-center gap-2.5 px-4 text-left"
            >
              <Line name="bell" size={24} style={{ color: TONE.beige.fg }} />
              <span className="flex-1 text-[16px] font-extrabold" style={{ color: "#5E4A1E" }}>
                일주일 안에 일정 {soon.length}개가 있어요
              </span>
              <span className="flex-none transition-transform" style={{ transform: soonOpen ? "rotate(180deg)" : undefined, color: TONE.beige.fg }}>
                <Line name="chevD" size={20} />
              </span>
            </button>
            {soonOpen && (
              <ul className="ds-swap m-0 flex list-none flex-col gap-1.5 px-4 pb-3.5 pt-0">
                {soon.map((e) => (
                  <li key={e.id} className="flex items-center gap-2 text-[15px]">
                    <span aria-hidden="true" className="h-2 w-2 flex-none rounded-full" style={{ background: DOT[eventTone(e.kind)] }} />
                    <span className="ds-num flex-none font-extrabold" style={{ color: TONE.beige.fg }}>
                      {new Date(e.at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{e.title}</span>
                    {e.approval === "pending" && (
                      <span className="flex-none text-[12px] font-extrabold" style={{ color: TONE.gold.fg }}>
                        승인 대기
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 제휴 병원 예약 — 예약하러 온 동선에서 병원부터 찾는다. 과목을 누르면 그 병원 카드로 간다.
            이미 다니시던 병원 등록하는 길을 같은 카드에 둔다 — 제휴 병원이 아니어도 동행은 간다 (2026-08-12 시트) */}
        <div className="ds-r flex flex-col gap-3.5 rounded-[26px] p-[18px]" style={{ "--d": "80ms", background: TONE.green.bg }}>
          <div className="flex items-center gap-3">
            <Clay name="hospitalBook" size={48} />
            <h2 className="m-0 text-[20px] font-extrabold" style={{ color: TONE.green.fg }}>
              제휴 병원 예약
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {MOU_HOSPITALS.slice(0, 4).map((h) => (
              <Link
                key={h.dept}
                href={`/family/hospitals?dept=${encodeURIComponent(h.dept)}`}
                className="ds-press ds-btn3d flex h-[50px] items-center justify-center rounded-[16px] bg-white text-[17px]"
                style={{ boxShadow: `0 4px 0 ${TONE.green.sh}`, color: TONE.green.fg }}
              >
                {h.dept}
              </Link>
            ))}
          </div>
          <Link href="/family/hospitals" className="flex min-h-[44px] items-center justify-between gap-2 text-[15px] font-extrabold" style={{ color: TONE.green.fg }}>
            <span>
              전체 병원 · 다니시던 병원 등록
              {state.myHospitals.length > 0 && <span className="font-bold"> (등록 {state.myHospitals.length}곳)</span>}
            </span>
            <Line name="chevR" size={20} />
          </Link>
        </div>

        {/* 달력 */}
        <Card className="ds-r flex flex-col gap-3" pad={16} style={{ "--d": "120ms" }}>
          <div className="flex items-center justify-between">
            <button type="button" aria-label="이전 달" onClick={() => moveMonth(-1)} className="ds-press flex h-11 w-11 items-center justify-center rounded-[14px]" style={{ background: "#F3F1EC" }}>
              <Line name="back" size={20} />
            </button>
            <h2 className="m-0 text-[20px] font-black">
              {ym.y}년 {ym.m + 1}월
            </h2>
            <button type="button" aria-label="다음 달" onClick={() => moveMonth(1)} className="ds-press flex h-11 w-11 items-center justify-center rounded-[14px]" style={{ background: "#F3F1EC" }}>
              <Line name="chevR" size={20} />
            </button>
          </div>
          <div className="ds-cal text-center text-[13px] font-extrabold" aria-hidden="true" style={{ color: "#5E6270" }}>
            {DOW.map((d, i) => (
              <span key={d} className="!h-6" style={i === 0 ? { color: "#9A5B1E" } : i === 6 ? { color: "#3A4E96" } : undefined}>
                {d}
              </span>
            ))}
          </div>
          <div className="ds-cal">
            {cells.map((d, i) => {
              /* 달 시작 전 빈 칸까지 <button> 으로 그리면 이름 없는 버튼이 된다
                 (axe critical: button-name). 빈 칸은 컨트롤이 아니므로 span 으로 둔다. */
              if (!d) return <span key={`b${i}`} aria-hidden="true" />;
              const col = i % 7;
              const sel = d === selected;
              const tdy = isToday(d);
              const evs = monthEvents[d] || [];
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelected(d)}
                  /* 숫자만 있으면 스크린리더가 "15" 라고만 읽는다 — 무슨 날인지 말해 준다 */
                  aria-label={`${ym.m + 1}월 ${d}일${tdy ? " 오늘" : ""}${evs.length ? ` · 일정 ${evs.length}건` : ""}`}
                  aria-pressed={sel}
                  className="ds-tap"
                  style={{
                    background: sel ? "#1B2340" : tdy ? TONE.beige.bg : "transparent",
                    borderColor: tdy && !sel ? "#C9A064" : "transparent",
                    color: sel ? "#FFFFFF" : col === 0 ? "#9A5B1E" : col === 6 ? "#3A4E96" : "#1B2340",
                  }}
                >
                  <span>{d}</span>
                  <span className="flex h-1.5 gap-[2px]" aria-hidden="true">
                    {evs.slice(0, 3).map((e) => (
                      <i key={e.id} style={{ background: sel ? "#FFFFFF" : DOT[eventTone(e.kind)] }} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
          {legend.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 text-[13px] font-bold" style={{ color: "#3A3F50" }}>
              {legend.map(([t, label]) => (
                <span key={t} className="inline-flex items-center gap-1">
                  <b aria-hidden="true" style={{ color: DOT[t] }}>
                    ●
                  </b>
                  {label}
                </span>
              ))}
            </div>
          )}
        </Card>

        {/* 고른 날 일정 */}
        <div className="ds-r flex flex-col gap-2.5" style={{ "--d": "160ms" }}>
          <h2 className="m-0 text-[18px] font-extrabold">
            {ym.m + 1}월 {selected}일{isToday(selected) ? " · 오늘" : ""}
            {dayEvents.length > 1 ? ` · ${dayEvents.length}건` : ""}
          </h2>
          {dayEvents.length === 0 ? (
            <div className="ds-swap rounded-[22px] p-[18px] text-center text-[16px] font-bold" style={{ background: "#F3F1EC", color: "#5E6270" }}>
              이날은 일정이 없어요
            </div>
          ) : (
            dayEvents.map((e) => (
              <EventRow key={e.id} e={e} rights={eventRights(e, "guardian", { primary: isPrimary })} onEdit={() => setEditing(e)} onRemove={(reason) => removeEvent(e, reason)} />
            ))
          )}
        </div>

        {/* 최근 취소된 일정 — 달력에서는 빠지지만 누가 · 왜 취소했는지는 남긴다 (2026-10-18) */}
        {cancelled.length > 0 && (
          <details className="ds-r rounded-[20px] px-4 py-3" style={{ "--d": "180ms", background: "#F3F1EC" }}>
            <summary className="min-h-[40px] cursor-pointer py-2 text-[15px] font-extrabold" style={{ color: "#3A3F50" }}>
              최근 취소된 일정 {cancelled.length}건
            </summary>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0 pb-1">
              {cancelled.map((x) => (
                <li key={`${x.id}-${x.removed.at}`} className="text-[14px] leading-[1.6]" style={{ color: "#4A4F5E" }}>
                  <b className="ds-num">{md(x.at)}</b> {x.title} — {x.removed.by || "취소"} 취소{x.removed.reason ? ` · ${x.removed.reason}` : ""}
                </li>
              ))}
            </ul>
          </details>
        )}

        <Btn tone="navy" h={64} r={22} className="ds-r text-[19px]" style={{ "--d": "200ms" }} onClick={() => setCreating(true)}>
          <span aria-hidden="true">+</span> 일정 등록하기
        </Btn>
        <p className="-mt-1 px-1 text-[14px] leading-[1.7]" style={{ color: "#5E6270" }}>
          가족끼리 보는 일정은 바로 등록되고, K-CARE 방문·동행이 필요한 일정은 관제 승인을 거쳐 달력에 올라갑니다. 컨시어지가 병원에서 다음
          예약을 등록하면 바로 공유되고, {honor} 화면에도 같은 일정이 큰 글씨로 보입니다.
        </p>

        {creating && (
          <CreateEventSheet
            honor={honor}
            defaultDate={new Date(ym.y, ym.m, selected, 10, 0)}
            onClose={() => setCreating(false)}
            onCreate={(ev) => {
              dispatch({ type: "addEvent", payload: ev });
              dispatch({
                type: "pushEvent",
                payload:
                  ev.approval === "pending"
                    ? {
                        kind: "일정",
                        text: `보호자 일정등록 요청 — ${ev.title}${ev.escort ? " · 동행 필요" : " · 동행 불필요"} · 관제 검토 대기`,
                        color: "#B08D57",
                      }
                    : { kind: "일정", text: `가족 일정 등록 — ${ev.title}`, color: "#8FA9CC" },
              });
              const d = new Date(ev.at);
              if (Number.isFinite(d.getTime())) {
                setYm({ y: d.getFullYear(), m: d.getMonth() });
                setSelected(d.getDate());
              }
              setCreating(false);
            }}
          />
        )}

        {editing && (
          <CreateEventSheet
            honor={honor}
            initial={editing}
            defaultDate={new Date(editing.at)}
            onClose={() => setEditing(null)}
            onCreate={(ev) => {
              // 종류 · 내용 · 시간 · (K-CARE 일정이면) 동행 — 메모는 덮어쓰지 않는다. 확정된 일정의 시간 · 종류 · 동행이 바뀌면 관제 재승인
              // '동행 필요 / 불필요' 메모는 등록 때 자동으로 붙은 글이라 동행을 바꾸면 같이 바꾼다 (손으로 쓴 메모는 그대로)
              const autoNote = /^동행 (불)?필요$/.test(editing.note || "");
              const patch = {
                kind: ev.kind,
                title: ev.title,
                at: ev.at,
                ...(editing.approval ? { escort: ev.escort } : {}),
                ...(editing.approval && autoNote ? { note: ev.escort ? "동행 필요" : "동행 불필요" } : {}),
              };
              const moved = editing.approval === "approved" && REAPPROVE_KEYS.some((k) => k in patch && patch[k] !== editing[k]);
              dispatch({ type: "updateEvent", id: editing.id, patch, by: "보호자", title: ev.title });
              // 컨시어지가 잡은 진료 예약의 날짜 · 시간을 보호자가 바꿨다 — 담당 컨시어지 · 관제에 알린다 (2026-10-19 점검)
              if (eventOwner(editing) === "concierge" && ev.at !== editing.at) {
                dispatch({
                  type: "addOpsMessage",
                  payload: { from: "보호자", role: "guardian", kind: "event", text: `컨시어지가 등록한 진료 예약 시간을 보호자가 바꿨습니다 — ${ev.title} · ${md(editing.at)} ${hm(editing.at)} → ${md(ev.at)} ${hm(ev.at)}${editing.escort ? " · 동행 배차 확인" : ""}` },
                });
              }
              if (moved) {
                dispatch({ type: "pushEvent", payload: { kind: "일정", text: `보호자 일정 변경 — ${ev.title} · ${md(ev.at)} ${hm(ev.at)} · 관제 재승인 대기`, color: "#B08D57" } });
              }
              const d = new Date(ev.at);
              if (Number.isFinite(d.getTime())) {
                setYm({ y: d.getFullYear(), m: d.getMonth() });
                setSelected(d.getDate());
              }
              setEditing(null);
            }}
          />
        )}
      </FamilyLayout>
    </>
  );
}

// 고르는 칸 — 고르면 남색 테두리 · 연한 바탕
function Choice({ on, onClick, children, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`ds-press rounded-[18px] p-3 text-left ${className}`}
      style={on ? { background: TONE.blue.bg, boxShadow: "inset 0 0 0 2.5px #1B2340" } : { background: "#FFFFFF", boxShadow: "0 3px 0 #E3DED3" }}
    >
      {children}
    </button>
  );
}

function CreateEventSheet({ defaultDate, initial, onClose, onCreate, honor }) {
  const [kind, setKind] = useState(initial?.kind || "family");
  const [title, setTitle] = useState(initial?.title || "");
  // 일정은 두 가지다 (2026-08-12 대표 피드백): 가족끼리 쓰는 일정관리와
  // K-CARE 가 사람을 보내야 하는 일정. 후자만 관제 승인을 거친다.
  const [mode, setMode] = useState(initial?.approval ? "kcare" : "family");
  // 동행 필요 유무 — 컨시어지가 필요하면 등록요청, 가족 행사면 그냥 등록 (시트 예약 2번)
  const [escort, setEscort] = useState(initial?.escort ?? true);
  const [dt, setDt] = useState(() => {
    const d = new Date(defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 16);
  });
  // 휴대폰 날짜 칸의 '지우기'로 비울 수 있다 — 빈 날짜로 저장하면 달력 전체가 멈췄다 (2026-10-19 점검 G2)
  const atMs = dt ? new Date(dt).getTime() : NaN;
  const dtOk = Number.isFinite(atMs);
  const needsApproval = mode === "kcare";
  const head = initial ? "일정 수정" : needsApproval ? "일정 등록 요청" : "일정 등록";

  return (
    <Sheet onClose={onClose} label={head}>
      <SheetTitle sub={`${honor} 일정`} title={head} />
      <p className="text-[14px] leading-[1.6]" style={{ color: "#5E6270" }}>
        {initial
          ? initial.approval === "approved"
            ? "확정된 일정입니다 — 날짜 · 시간 · 종류 · 동행을 바꾸면 관제가 다시 확인한 뒤 확정됩니다. 내용만 고치면 바로 반영됩니다."
            : `수정 내용은 ${honor}·컨시어지 달력에 바로 반영됩니다.`
          : needsApproval
            ? "관제가 팀 배정과 배차를 검토한 뒤 승인하면 모든 화면의 달력에 올라갑니다."
            : "가족끼리 보는 일정입니다 — 승인 없이 바로 등록됩니다."}
      </p>

      {/* 수정할 때는 일정 종류(가족 · K-CARE)를 바꾸지 않는다 — 바꾸려면 지우고 다시 등록 (승인 흐름이 섞이지 않게) */}
      {initial && (
        <div className="rounded-[16px] px-3.5 py-2.5 text-[14px] font-extrabold" style={{ background: "#F3F1EC", color: "#3A3F50" }}>
          {needsApproval
            ? "K-CARE 일정 · 관제 승인 일정"
            : eventOwner(initial) === "concierge"
              ? "컨시어지가 병원과 잡은 진료 예약 · 바꾸면 담당 컨시어지 · 관제에 알립니다"
              : "가족 일정 · 승인 없이 바로"}
        </div>
      )}

      {/* 어떤 일정인가 — 이걸 먼저 고르면 아래 폼의 의미가 달라진다 */}
      {!initial && <div role="group" aria-label="일정 종류" className="grid grid-cols-2 gap-2">
        {[
          ["family", "가족 일정", "생일 · 방문 · 모임", false],
          ["kcare", "K-CARE 일정", "방문 · 동행 · 병원", true],
        ].map(([k, label, desc, approve]) => (
          <Choice key={k} on={mode === k} onClick={() => setMode(k)}>
            <span className="block text-[16px] font-extrabold">{label}</span>
            <span className="mt-0.5 block text-[13px] leading-[1.5]" style={{ color: "#5E6270" }}>
              {desc}
            </span>
            <span className="mt-1 block text-[13px] font-extrabold" style={{ color: approve ? TONE.gold.fg : TONE.green.fg }}>
              {approve ? "관제 승인 필요" : "바로 등록"}
            </span>
          </Choice>
        ))}
      </div>}

      {/* 동행 서비스 필요 유무 — K-CARE 일정일 때만 의미가 있다 */}
      {needsApproval && (
        <div role="group" aria-label="동행 서비스" className="flex flex-col gap-2">
          <div className="text-[15px] font-extrabold">동행 서비스</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              [true, "필요합니다", "컨시어지 배정 · 배차까지 검토합니다"],
              [false, "필요 없습니다", "일정만 공유합니다"],
            ].map(([v, label, desc]) => (
              <Choice key={String(v)} on={escort === v} onClick={() => setEscort(v)}>
                <span className="block text-[15px] font-extrabold">{label}</span>
                <span className="mt-0.5 block text-[13px] leading-[1.5]" style={{ color: "#5E6270" }}>
                  {desc}
                </span>
              </Choice>
            ))}
          </div>
        </div>
      )}

      <div role="group" aria-label="종류" className="flex flex-col gap-2">
        <div className="text-[15px] font-extrabold">종류</div>
        <EvenGrid labels={Object.values(EVENT_KINDS).map((v) => v.label)} gap={6}>
          {Object.entries(EVENT_KINDS).map(([k, v]) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              aria-pressed={kind === k}
              className="ds-press min-h-[40px] rounded-full px-3.5 text-[14px] font-extrabold"
              style={kind === k ? { background: "#1B2340", color: "#FFFFFF" } : { background: "#FFFFFF", color: "#3A3F50", boxShadow: "inset 0 0 0 1.5px #E3DED3" }}
            >
              {v.label}
            </button>
          ))}
        </EvenGrid>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="ev-title" className="text-[15px] font-extrabold">
          내용
        </label>
        <input
          id="ev-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 주말 방문 · 점심 함께"
          className="min-h-[52px] w-full rounded-[16px] border-2 border-[#E3DED3] bg-white px-3.5 text-[17px] outline-none focus:border-[#1B2340]"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="ev-at" className="text-[15px] font-extrabold">
          날짜와 시간
        </label>
        <input
          id="ev-at"
          type="datetime-local"
          value={dt}
          onChange={(e) => setDt(e.target.value)}
          className="min-h-[52px] w-full rounded-[16px] border-2 border-[#E3DED3] bg-white px-3.5 text-[17px] outline-none focus:border-[#1B2340]"
        />
      </div>
      {!dtOk && (
        <p role="status" className="-mt-2 text-[14px] font-bold" style={{ color: "#8A5D12" }}>
          날짜와 시간을 골라 주세요
        </p>
      )}
      <div className="flex gap-2">
        <WhiteBtn className="flex-1 text-[17px]" onClick={onClose}>
          닫기
        </WhiteBtn>
        <Btn
          tone="navy"
          h={56}
          className="flex-[2] text-[17px] disabled:opacity-50"
          disabled={!title.trim() || !dtOk}
          onClick={() =>
            dtOk &&
            onCreate({
              id: `ev-${Date.now()}`,
              kind,
              title: title.trim(),
              at: atMs,
              source: needsApproval ? "보호자 요청" : "보호자 등록",
              by: "guardian", // 누가 만든 일정인가 — 수정 · 삭제 권한이 이것을 본다 (lib/event-rights.js)
              note: needsApproval ? (escort ? "동행 필요" : "동행 불필요") : "",
              // approval 이 있는 일정만 관제 승인 큐에 뜬다
              ...(needsApproval ? { approval: "pending", escort } : {}),
            })
          }
        >
          {initial ? "저장" : needsApproval ? "등록 요청" : "등록"}
        </Btn>
      </div>
    </Sheet>
  );
}
