import Head from "next/head";
import { useMemo, useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { Card, SectionLabel, PrimaryButton, GhostButton } from "../../components/ui";
import Link from "next/link";
import { EVENT_KINDS, MOU_HOSPITALS } from "../../lib/mock";
import { useAppState } from "../../lib/state";

// 공유 캘린더 — REQ-02
// 보호자 권한: 조회·등록·수정·결제. 컨시어지 등록 일정은 source로 구분 표시.
// 알림: 지정 기간(7일) 내 일정을 상단 팝업 카드로 표기.

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

export default function CalendarPage() {
  const { state, dispatch } = useAppState();
  const isPrimary = (state.demo.guardianRole || "primary") === "primary";
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
  const cells = [
    ...Array(first.getDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const dayEvents = (monthEvents[selected] || []).sort((a, b) => a.at - b.at);
  const soon = events
    .filter((e) => e.at > Date.now() && e.at < Date.now() + 7 * 86400000)
    .sort((a, b) => a.at - b.at);

  const isToday = (d) =>
    d === today.getDate() && ym.m === today.getMonth() && ym.y === today.getFullYear();

  return (
    <>
      <Head>
        <title>공유 캘린더 — K-CARE</title>
      </Head>
      <FamilyLayout title="공유 캘린더">
        {/* 다가오는 알림 팝업 — 회의: 지정 기간 내 알람은 팝업 표기 */}
        {soon.length > 0 && (
          <Card className="border-gold/40 bg-gradient-to-b from-[#FBF6EC] to-[#F4EEE1] p-4">
            <SectionLabel>7일 이내 알림 {soon.length}건</SectionLabel>
            <div className="mt-2 space-y-1.5">
              {soon.slice(0, 3).map((e) => (
                <div key={e.id} className="flex items-center gap-2 text-[13px]">
                  <span
                    className="h-[8px] w-[8px] shrink-0 rounded-full"
                    style={{ background: EVENT_KINDS[e.kind].color }}
                  />
                  <span className="font-num font-bold text-amber">
                    {new Date(e.at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
                  </span>
                  <span className="flex-1 truncate text-ink">{e.title}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 제휴 병원 진입점 — 예약하러 온 동선에서 병원부터 찾는다.
            패스트트랙 문구는 2026-08-12 요청으로 삭제. 대신 이미 다니시던 병원을
            등록하는 길을 같은 카드에 둔다 — 제휴 병원이 아니어도 동행은 간다. */}
        <Link href="/family/hospitals" className="block">
          <Card className="btn-press p-4">
            <div className="flex items-center justify-between">
              <div className="text-[16px] font-bold text-navy">제휴병원 예약 및 상담</div>
              <span className="text-[20px] text-muted/50">›</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {MOU_HOSPITALS.slice(0, 4).map((h) => (
                <span key={h.dept} className="chip-gold rounded-full px-2.5 py-1 text-[12px] font-bold">
                  {h.dept}
                </span>
              ))}
              <span className="rounded-full border border-navy/15 px-2.5 py-1 text-[12px] font-bold text-muted">
                전체 보기
              </span>
            </div>
            <p className="mt-2 text-[12px] leading-[1.7] text-muted">
              제휴 병원 예약·상담과 동행 요청 · 기존에 다니시던 병원 등록하기
              {state.myHospitals.length > 0 && ` (등록 ${state.myHospitals.length}곳)`}
            </p>
          </Card>
        </Link>

        {/* 월 그리드 */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <button
              aria-label="이전 달"
              className="btn-press h-11 w-11 rounded-lg border border-navy/15 text-muted"
              onClick={() => {
                const m = ym.m - 1;
                setYm(m < 0 ? { y: ym.y - 1, m: 11 } : { ...ym, m });
                setSelected(1);
              }}
            >
              ‹
            </button>
            <div className="font-num text-[17px] font-bold text-navy">
              {ym.y}. {String(ym.m + 1).padStart(2, "0")}
            </div>
            <button
              aria-label="다음 달"
              className="btn-press h-11 w-11 rounded-lg border border-navy/15 text-muted"
              onClick={() => {
                const m = ym.m + 1;
                setYm(m > 11 ? { y: ym.y + 1, m: 0 } : { ...ym, m });
                setSelected(1);
              }}
            >
              ›
            </button>
          </div>
          <div className="mt-3 grid grid-cols-7 text-center">
            {DOW.map((d, i) => (
              <div
                key={d}
                className={`pb-1 text-[11px] font-bold ${
                  i === 0 ? "text-danger/70" : "text-muted/70"
                }`}
              >
                {d}
              </div>
            ))}
            {cells.map((d, i) =>
              /* 달 시작 전 빈 칸까지 <button> 으로 그리면 이름 없는 버튼이 된다
                 (axe critical: button-name). 빈 칸은 컨트롤이 아니므로 div 로 둔다. */
              !d ? (
                <div key={i} className="mx-auto my-[2px] h-[44px] w-[44px]" aria-hidden="true" />
              ) : (
              <button
                key={i}
                onClick={() => setSelected(d)}
                /* 숫자만 있으면 스크린리더가 "15" 라고만 읽는다 — 무슨 날인지 말해 준다 */
                aria-label={`${ym.m + 1}월 ${d}일${
                  (monthEvents[d] || []).length ? ` · 일정 ${(monthEvents[d] || []).length}건` : ""
                }`}
                aria-pressed={d === selected}
                className={`relative mx-auto my-[2px] flex h-[44px] w-[44px] flex-col items-center justify-center rounded-xl ${
                  d === selected
                    ? "bg-navy text-white"
                    : isToday(d)
                    ? "border border-gold text-navy"
                    : "text-ink"
                }`}
              >
                {d && (
                  <>
                    <span className="font-num text-[15px] font-bold leading-none">{d}</span>
                    <span className="mt-[3px] flex gap-[2px]">
                      {(monthEvents[d] || []).slice(0, 3).map((e) => (
                        <span
                          key={e.id}
                          className="h-[4px] w-[4px] rounded-full"
                          style={{
                            background:
                              d === selected ? "#C9A46B" : EVENT_KINDS[e.kind].color,
                          }}
                        />
                      ))}
                    </span>
                  </>
                )}
              </button>
              )
            )}
          </div>
        </Card>

        {/* 선택일 일정 */}
        <Card className="p-[18px]">
          <SectionLabel>
            {ym.m + 1}월 {selected}일 일정 {dayEvents.length ? `· ${dayEvents.length}건` : ""}
          </SectionLabel>
          {dayEvents.length === 0 ? (
            <p className="mt-3 text-[15px] text-muted">등록된 일정이 없습니다.</p>
          ) : (
            <div className="mt-3 space-y-3.5">
              {dayEvents.map((e) => (
                <div key={e.id} className="flex items-start gap-3">
                  <div className="w-[52px] shrink-0 pt-[1px] text-right font-num text-[15px] font-bold text-navy">
                    {new Date(e.at).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </div>
                  <span
                    className="mt-[5px] h-[10px] w-[10px] shrink-0 rounded-full"
                    style={{ background: EVENT_KINDS[e.kind].color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[16px] font-bold leading-[1.4] text-ink">{e.title}</div>
                    <div className="mt-0.5 text-[12px] text-muted">
                      {EVENT_KINDS[e.kind].label} · {e.source}
                    </div>
                    {/* 승인 상태 — 승인 전에는 확정된 일정처럼 보이면 안 된다 */}
                    {e.approval === "pending" && (
                      <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#FFF7E8] px-2 py-0.5 text-[11px] font-bold text-amber">
                        관제 승인 대기 {e.escort ? "· 동행 필요" : "· 동행 불필요"}
                      </div>
                    )}
                    {e.approval === "rejected" && (
                      <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-bold text-danger">
                        관제 반려 — 해주세요로 사유가 전달됩니다
                      </div>
                    )}
                    {e.note && (
                      <div className="mt-1 text-[13px] leading-[1.6] text-muted">{e.note}</div>
                    )}
                    {/* 병원 일정 — 외출 컨디션 · 동행 편성 상태 (날씨 × 배차 연동) */}
                    {e.kind === "hospital" && !e.approval && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <span className="rounded-full border border-amber/30 bg-[#FFF7E8] px-2 py-0.5 text-[11px] font-bold text-amber">
                          외출지수 52 주의 · 차량 권장
                        </span>
                        <span className="rounded-full bg-green/10 px-2 py-0.5 text-[11px] font-bold text-green">
                          동행 확정 — 박지현 + 서다인
                        </span>
                      </div>
                    )}
                  </div>
                  {isPrimary && (
                    <button
                      onClick={() => setEditing(e)}
                      className="btn-press shrink-0 rounded-lg border border-navy/15 px-2.5 py-1.5 text-[12px] font-bold text-muted"
                    >
                      수정
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 일정 종류 범례 */}
        <Card className="p-4">
          <SectionLabel>일정 종류</SectionLabel>
          <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5">
            {Object.entries(EVENT_KINDS).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5 text-[12px] text-muted">
                <span className="h-[8px] w-[8px] rounded-full" style={{ background: v.color }} />
                {v.label}
              </span>
            ))}
          </div>
          <p className="mt-3 border-t border-navy/10 pt-2.5 text-[12px] leading-[1.7] text-muted">
            컨시어지가 병원에서 다음 예약을 등록하면 이 캘린더에 즉시 공유됩니다. 어르신
            화면에는 같은 일정이 큰 글씨로 표시됩니다.
          </p>
        </Card>

        <PrimaryButton onClick={() => setCreating(true)}>일정 등록 요청</PrimaryButton>
        <p className="-mt-1 px-1 text-[12px] leading-[1.7] text-muted">
          가족끼리 보는 일정은 바로 등록되고, K-CARE 방문·동행이 필요한 일정은 관제 승인을
          거쳐 캘린더에 올라갑니다.
        </p>

        {creating && (
          <CreateEventSheet
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
              setYm({ y: d.getFullYear(), m: d.getMonth() });
              setSelected(d.getDate());
              setCreating(false);
            }}
          />
        )}

        {editing && (
          <CreateEventSheet
            initial={editing}
            defaultDate={new Date(editing.at)}
            onClose={() => setEditing(null)}
            onCreate={(ev) => {
              dispatch({
                type: "updateEvent",
                id: editing.id,
                patch: { kind: ev.kind, title: ev.title, at: ev.at, note: `보호자 수정 · ${editing.source}` },
              });
              const d = new Date(ev.at);
              setYm({ y: d.getFullYear(), m: d.getMonth() });
              setSelected(d.getDate());
              setEditing(null);
            }}
          />
        )}
      </FamilyLayout>
    </>
  );
}

function CreateEventSheet({ defaultDate, initial, onClose, onCreate }) {
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
  const needsApproval = mode === "kcare";

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[rgba(8,23,45,.45)]">
      <div className="max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-white p-6 pb-8">
        <div className="mx-auto mb-4 h-[4px] w-[38px] rounded-full bg-navy/15" />
        <div className="text-[19px] font-black text-navy">
          {initial ? "일정 수정" : needsApproval ? "일정 등록 요청" : "일정 등록"}
        </div>
        <p className="mt-1 text-[12px] leading-[1.6] text-muted">
          {initial
            ? "수정 내용은 어르신·컨시어지 캘린더에 즉시 반영됩니다."
            : needsApproval
            ? "관제가 팀 배정과 배차를 검토한 뒤 승인하면 모든 화면의 캘린더에 올라갑니다."
            : "가족끼리 보는 일정입니다 — 승인 없이 바로 등록됩니다."}
        </p>

        {/* 어떤 일정인가 — 이걸 먼저 고르면 아래 폼의 의미가 달라진다 */}
        <div className="mt-4">
          <SectionLabel>일정 종류</SectionLabel>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[
              ["family", "가족 일정", "생일 · 방문 · 모임", false],
              ["kcare", "K-CARE 일정", "방문 · 동행 · 병원", true],
            ].map(([k, label, desc, approve]) => (
              <button
                key={k}
                onClick={() => setMode(k)}
                aria-pressed={mode === k}
                className={`btn-press rounded-xl border p-3 text-left ${
                  mode === k ? "border-gold bg-gold/10" : "border-navy/15"
                }`}
              >
                <div className={`text-[15px] font-bold ${mode === k ? "text-navy" : "text-muted"}`}>
                  {label}
                </div>
                <div className="mt-0.5 text-[11px] leading-[1.5] text-muted">{desc}</div>
                <div className={`mt-1 text-[11px] font-bold ${approve ? "text-amber" : "text-green"}`}>
                  {approve ? "관제 승인 필요" : "바로 등록"}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 동행 서비스 필요 유무 — K-CARE 일정일 때만 의미가 있다 */}
        {needsApproval && (
          <div className="mt-4">
            <SectionLabel>동행 서비스</SectionLabel>
            <div className="mt-2 flex gap-2">
              {[
                [true, "필요합니다", "컨시어지 배정 · 배차까지 검토합니다"],
                [false, "필요 없습니다", "일정만 공유합니다"],
              ].map(([v, label, desc]) => (
                <button
                  key={String(v)}
                  onClick={() => setEscort(v)}
                  aria-pressed={escort === v}
                  className={`btn-press flex-1 rounded-xl border p-3 text-left ${
                    escort === v ? "border-navy bg-navy/[.05]" : "border-navy/15"
                  }`}
                >
                  <div className={`text-[14px] font-bold ${escort === v ? "text-navy" : "text-muted"}`}>
                    {label}
                  </div>
                  <div className="mt-0.5 text-[11px] leading-[1.5] text-muted">{desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <SectionLabel>종류</SectionLabel>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Object.entries(EVENT_KINDS).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={`btn-press rounded-full border px-3 py-1.5 text-[13px] font-bold ${
                  kind === k ? "border-gold bg-gold/10 text-navy" : "border-navy/15 text-muted"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <SectionLabel>내용</SectionLabel>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 주말 방문 · 점심 함께"
            className="mt-2 w-full rounded-xl border border-navy/15 px-3.5 py-3 text-[16px] outline-none focus:border-gold"
          />
        </div>
        <div className="mt-4">
          <SectionLabel>일시</SectionLabel>
          <input
            type="datetime-local"
            value={dt}
            onChange={(e) => setDt(e.target.value)}
            className="mt-2 w-full rounded-xl border border-navy/15 px-3.5 py-3 text-[16px] outline-none focus:border-gold"
          />
        </div>
        <div className="mt-5 flex gap-2">
          <GhostButton onClick={onClose} className="flex-1">
            닫기
          </GhostButton>
          <PrimaryButton
            className="flex-[2]"
            disabled={!title.trim()}
            onClick={() =>
              onCreate({
                id: `ev-${Date.now()}`,
                kind,
                title: title.trim(),
                at: new Date(dt).getTime(),
                source: needsApproval ? "보호자 요청" : "보호자 등록",
                note: needsApproval ? (escort ? "동행 필요" : "동행 불필요") : "",
                // approval 이 있는 일정만 관제 승인 큐에 뜬다
                ...(needsApproval ? { approval: "pending", escort } : {}),
              })
            }
          >
            {initial ? "저장" : needsApproval ? "등록 요청" : "등록"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
