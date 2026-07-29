import Head from "next/head";
import { useMemo, useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { Card, SectionLabel, PrimaryButton, GhostButton } from "../../components/ui";
import { EVENT_KINDS } from "../../lib/mock";
import { useAppState } from "../../lib/state";

// 공유 캘린더 — REQ-02
// 보호자 권한: 조회·등록·수정·결제. 컨시어지 등록 일정은 source로 구분 표시.
// 알림: 지정 기간(7일) 내 일정을 상단 팝업 카드로 표기.

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

export default function CalendarPage() {
  const { state, dispatch } = useAppState();
  const today = new Date();
  const [ym, setYm] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState(today.getDate());
  const [creating, setCreating] = useState(false);

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
                <div key={e.id} className="flex items-center gap-2 text-[12px]">
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

        {/* 월 그리드 */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <button
              className="btn-press h-8 w-8 rounded-lg border border-navy/15 text-muted"
              onClick={() => {
                const m = ym.m - 1;
                setYm(m < 0 ? { y: ym.y - 1, m: 11 } : { ...ym, m });
                setSelected(1);
              }}
            >
              ‹
            </button>
            <div className="font-num text-[15px] font-bold text-navy">
              {ym.y}. {String(ym.m + 1).padStart(2, "0")}
            </div>
            <button
              className="btn-press h-8 w-8 rounded-lg border border-navy/15 text-muted"
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
                className={`pb-1 text-[10px] font-bold ${
                  i === 0 ? "text-danger/70" : "text-muted/70"
                }`}
              >
                {d}
              </div>
            ))}
            {cells.map((d, i) => (
              <button
                key={i}
                disabled={!d}
                onClick={() => setSelected(d)}
                className={`relative mx-auto my-[2px] flex h-[40px] w-[40px] flex-col items-center justify-center rounded-xl ${
                  d === selected
                    ? "bg-navy text-white"
                    : isToday(d)
                    ? "border border-gold text-navy"
                    : "text-ink"
                }`}
              >
                {d && (
                  <>
                    <span className="font-num text-[13px] font-bold leading-none">{d}</span>
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
            ))}
          </div>
        </Card>

        {/* 선택일 일정 */}
        <Card className="p-[18px]">
          <SectionLabel>
            {ym.m + 1}월 {selected}일 일정 {dayEvents.length ? `· ${dayEvents.length}건` : ""}
          </SectionLabel>
          {dayEvents.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted">등록된 일정이 없습니다.</p>
          ) : (
            <div className="mt-3 space-y-3.5">
              {dayEvents.map((e) => (
                <div key={e.id} className="flex items-start gap-3">
                  <div className="w-[52px] shrink-0 pt-[1px] text-right font-num text-[13px] font-bold text-navy">
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
                    <div className="text-[14px] font-bold leading-[1.4] text-ink">{e.title}</div>
                    <div className="mt-0.5 text-[11px] text-muted">
                      {EVENT_KINDS[e.kind].label} · {e.source}
                    </div>
                    {e.note && (
                      <div className="mt-1 text-[12px] leading-[1.6] text-muted">{e.note}</div>
                    )}
                  </div>
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
              <span key={k} className="flex items-center gap-1.5 text-[11px] text-muted">
                <span className="h-[8px] w-[8px] rounded-full" style={{ background: v.color }} />
                {v.label}
              </span>
            ))}
          </div>
          <p className="mt-3 border-t border-navy/10 pt-2.5 text-[11px] leading-[1.7] text-muted">
            컨시어지가 병원에서 다음 예약을 등록하면 이 캘린더에 즉시 공유됩니다. 어르신
            화면에는 같은 일정이 큰 글씨로 표시됩니다.
          </p>
        </Card>

        <PrimaryButton onClick={() => setCreating(true)}>일정 등록 (보호자)</PrimaryButton>

        {creating && (
          <CreateEventSheet
            defaultDate={new Date(ym.y, ym.m, selected, 10, 0)}
            onClose={() => setCreating(false)}
            onCreate={(ev) => {
              dispatch({ type: "addEvent", payload: ev });
              setCreating(false);
            }}
          />
        )}
      </FamilyLayout>
    </>
  );
}

function CreateEventSheet({ defaultDate, onClose, onCreate }) {
  const [kind, setKind] = useState("family");
  const [title, setTitle] = useState("");
  const [dt, setDt] = useState(() => {
    const d = new Date(defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 16);
  });

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[rgba(8,23,45,.45)]">
      <div className="w-full max-w-[430px] rounded-t-3xl bg-white p-6 pb-8">
        <div className="mx-auto mb-4 h-[4px] w-[38px] rounded-full bg-navy/15" />
        <div className="text-[17px] font-black text-navy">일정 등록</div>
        <p className="mt-1 text-[11px] text-muted">
          등록한 일정은 어르신·컨시어지 캘린더에 즉시 공유됩니다.
        </p>
        <div className="mt-4">
          <SectionLabel>종류</SectionLabel>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Object.entries(EVENT_KINDS).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={`btn-press rounded-full border px-3 py-1.5 text-[12px] font-bold ${
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
            className="mt-2 w-full rounded-xl border border-navy/15 px-3.5 py-3 text-[14px] outline-none focus:border-gold"
          />
        </div>
        <div className="mt-4">
          <SectionLabel>일시</SectionLabel>
          <input
            type="datetime-local"
            value={dt}
            onChange={(e) => setDt(e.target.value)}
            className="mt-2 w-full rounded-xl border border-navy/15 px-3.5 py-3 text-[14px] outline-none focus:border-gold"
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
                source: "보호자 등록",
                note: "",
              })
            }
          >
            등록
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
