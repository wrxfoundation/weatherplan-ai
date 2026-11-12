// 컨시어지 고객 탭 — 이름 목록 → 누르면 상세 (2026-10-24 컨시어지 화면설계서 v3 §2 · 목업 방식 확정).
// 줄을 누르면 목록이 상세로 바뀌고, 맨 위 '‹' 로 목록에 돌아온다 (아래로 펼치기 아님).
// 상세 순서: 선호 카드(내부) · AI 동행 브리핑(내부) · 건강 정보(어르신 · 보호자) · 다음 진료 예약(어르신 · 보호자) · 공유 일정(어르신 · 보호자).
import { useId, useState } from "react";
import { Card } from "./ui";
import { AudChips } from "./ReportParts";
import { askDoneText, isOpenAsk } from "../lib/elder-asks";
import { EVENT_SHORT } from "../lib/mock";
import { eventOwner } from "../lib/event-rights";

const LOC_CHIP = { 자택: { bg: "#EEEDEA", fg: "#5E5A52" }, 요양병원: { bg: "#E8EBF7", fg: "#33468E" } };
const KST = 9 * 3600 * 1000;
const kd = (t) => new Date(Number(t) + KST);
const hm = (t) => kd(t).toISOString().slice(11, 16);
const md = (t) => `${kd(t).getUTCMonth() + 1}/${kd(t).getUTCDate()}`;
// 오늘이면 시각만, 아니면 날짜와 시각 — '수정 11:12' · '수정 10/21 11:12'
const whenShort = (t) => (md(t) === md(Date.now()) ? hm(t) : `${md(t)} ${hm(t)}`);

// '동네 · n번째' (첫 방문 전이면 '동네 · 첫 방문 10/27')
export const clientSub = (c) => [c.where, c.first ? `첫 방문 ${c.first}` : c.round ? `${c.round}번째` : null].filter(Boolean).join(" · ");
const nameAge = (c) => `${c.name}${c.age ? ` (${c.age})` : ""}`;

function LocChip({ loc }) {
  const t = LOC_CHIP[loc] || LOC_CHIP.자택;
  return (
    <span className="inline-flex h-[22px] flex-none items-center rounded-[6px] px-2 text-[11px] font-bold" style={{ background: t.bg, color: t.fg }}>
      {loc}
    </span>
  );
}

function Head({ title, aud, right }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[17px] font-black text-navy">{title}</span>
      <span className="flex flex-none items-center gap-1.5">
        {right}
        <AudChips list={aud} />
      </span>
    </div>
  );
}

// ── 목록 ── 성 한 글자 · '이름 (나이)' · '동네 · n번째' · 거주 칩 · ›
// counts — 고객 이름 → 열린 부탁 수 (이름 옆 점 · 2026-10-28 요청 1)
export function ClientList({ clients, onOpen, counts = {} }) {
  return (
    <Card className="p-4">
      <h2 className="m-0 text-[17px] font-black text-navy">내 담당 고객 {clients.length}명</h2>
      <ul className="m-0 mt-1.5 list-none p-0">
        {clients.map((c) => (
          <li key={c.name} className="border-b border-[#EFEDE8] last:border-0">
            <button type="button" onClick={() => onOpen(c)} className="btn-press flex min-h-[52px] w-full items-center gap-3 py-2 text-left">
              <span aria-hidden="true" className="flex h-[36px] w-[36px] flex-none items-center justify-center rounded-full bg-[#F1E9DC] text-[15px] font-black text-[#86621F]">
                {c.name.slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1">
                <b className="flex items-center gap-1.5 text-[15px] text-[#1B2340]">
                  {nameAge(c)}
                  {counts[c.name] > 0 && (
                    <span className="inline-flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#B08D57] px-1.5 font-num text-[11px] font-black text-white">
                      <span className="sr-only">열린 부탁 </span>
                      {counts[c.name]}
                      <span className="sr-only">건</span>
                    </span>
                  )}
                </b>
                <span className="block text-[12.5px] text-[#7A7F8E]">{clientSub(c)}</span>
              </span>
              <LocChip loc={c.loc} />
              <span aria-hidden="true" className="flex-none text-[18px] text-[#9A9690]">
                ›
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ── 상세 머리 ── '‹  고객  김순자 (78) · 대치동'
export function ClientHead({ c, onBack, extra }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onBack}
          aria-label="고객 목록으로"
          className="btn-press flex h-[44px] w-[44px] flex-none items-center justify-center rounded-[12px] border border-[#D9D6CF] bg-white text-[24px] leading-none text-navy"
        >
          ‹
        </button>
        <div className="min-w-0">
          <div className="text-[12px] font-bold text-muted">고객</div>
          <h2 className="m-0 truncate text-[19px] font-black text-navy">
            {nameAge(c)}
            {c.where ? ` · ${c.where}` : ""}
          </h2>
        </div>
        <span className="ml-auto">
          <LocChip loc={c.loc} />
        </span>
      </div>
      {extra}
    </div>
  );
}

// 1. 선호 카드 — 관제 · 컨시어지만 (어르신 · 보호자 앱에 나가지 않는다). '오늘 알게 된 선호'는 가구 기록에 쌓인다
export function PrefCard({ prefs, notes, onAdd }) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const submit = (e) => {
    e.preventDefault();
    const t = draft.trim();
    if (!t) return;
    onAdd(t);
    setDraft("");
  };
  return (
    <Card className="p-[18px]">
      <Head title="선호 카드" aud={["in"]} />
      <div className="mt-3 space-y-2">
        {prefs.length === 0 && notes.length === 0 && <p className="text-[13px] leading-[1.6] text-muted">아직 적힌 선호가 없습니다.</p>}
        {prefs.map(([k, val]) => (
          <div key={k} className="flex gap-2.5 text-[13.5px]">
            <span className="w-[56px] shrink-0 font-bold text-gold">{k}</span>
            <span className="flex-1 leading-[1.6] text-ink">{val}</span>
          </div>
        ))}
        {notes.map((n) => (
          <div key={`${n.at}-${n.text}`} className="flex gap-2.5 text-[13.5px]">
            <span className="w-[56px] shrink-0 font-bold text-gold">{md(n.at)} 기록</span>
            <span className="flex-1 leading-[1.6] text-ink">
              {n.text}
              {n.by && <span className="text-muted"> · {n.by}</span>}
            </span>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <label htmlFor={id} className="sr-only">
          오늘 알게 된 선호
        </label>
        <input
          id={id}
          value={draft}
          maxLength={120}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="오늘 알게 된 선호"
          className="min-h-[44px] min-w-0 flex-1 rounded-[10px] border border-[#D9D6CF] bg-white px-3 text-[14px] text-[#1B2340] outline-none placeholder:text-[#9A9690] focus:border-[#1B2340]"
        />
        <button type="submit" disabled={!draft.trim()} className="btn-press min-h-[44px] flex-none rounded-[10px] bg-[#1B2340] px-4 text-[14px] font-bold text-white disabled:bg-[#E5E3DE] disabled:text-[#9A9690]">
          남기기
        </button>
      </form>
      <p className="mt-2 text-[11px] leading-[1.6] text-muted">관제 · 담당 컨시어지만 보는 칸입니다 — 어르신 · 보호자 앱에는 나가지 않아요.</p>
    </Card>
  );
}

// 2. AI 동행 브리핑 — 확인된 것(체크) + 미확정(확인된 정보가 아님)
export function BriefingCard({ confirmed, unconfirmed, empty }) {
  return (
    <Card className="p-[18px]">
      <Head title="AI 동행 브리핑" aud={["in"]} />
      {empty ? (
        <p className="mt-3 text-[12.5px] leading-[1.6] text-muted">{empty}</p>
      ) : (
        <>
          <div className="mt-3 space-y-1.5">
            {confirmed.map((b) => (
              <div key={b} className="flex items-start gap-2 text-[13.5px] leading-[1.6] text-ink">
                <span aria-hidden="true" className="mt-[3px] inline-flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full bg-green/15 text-[10px] font-bold text-green">
                  ✓
                </span>
                {b}
              </div>
            ))}
          </div>
          {unconfirmed.length > 0 && (
            <div className="mt-2.5 rounded-xl border border-amber/30 bg-[#FFF7E8] p-3">
              <span className="inline-flex h-[22px] items-center rounded-[6px] bg-[#F1E9DC] px-2 text-[11px] font-bold text-[#6A4C16]">미확정 — 확인된 정보가 아닙니다</span>
              {unconfirmed.map((u) => (
                <p key={u} className="mt-1.5 text-[13px] leading-[1.6] text-[#5A4A22]">
                  {u}
                </p>
              ))}
            </div>
          )}
          <p className="mt-2.5 text-[11px] leading-[1.6] text-muted">관찰 · 발언 기록에서 AI가 추렸습니다 — 진단 · 판단 없음.</p>
        </>
      )}
    </Card>
  );
}

// 3. 건강 정보 — 질환 칩 · 복용약(아침 · 점심 · 저녁 · 자기 전) · 수정 기록 줄. 고치면 어르신 복약 · 보호자 · 관제가 같은 값을 본다
export function HealthCard({ health, editing, onEdit, editor }) {
  return (
    <Card className="p-[18px]">
      <Head title="건강 정보" aud={["sen", "gua"]} />
      {editing ? (
        <div className="mt-3">{editor}</div>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-1.5" aria-label="질환">
            {health.conditions.length ? (
              health.conditions.map((x) => (
                <span key={x} className="inline-flex h-[24px] items-center rounded-[6px] bg-[#F3F1EC] px-2 text-[12px] font-bold text-[#3A4558]">
                  {x}
                </span>
              ))
            ) : (
              <span className="text-[13px] text-muted">등록된 질환 없음</span>
            )}
          </div>
          <div className="mt-1.5 text-[12px] text-muted">알레르기 {health.allergies.length ? health.allergies.join(" · ") : "등록 없음"}</div>
          <div className="mt-3 divide-y divide-[#EFEDE8] border-y border-[#EFEDE8]">
            {health.meds.length === 0 && <div className="py-2.5 text-[13px] text-muted">등록된 복용약 없음</div>}
            {health.meds.map((d) => (
              <div key={d.slot} className="flex gap-3 py-2">
                <span className="w-[64px] flex-none">
                  <b className="block text-[13.5px] text-navy">{d.slot}</b>
                  <span className="font-num text-[11.5px] text-muted">{d.time}</span>
                </span>
                <span className="min-w-0 flex-1">
                  {d.items.map((i) => (
                    <span key={i.name} className="block text-[13.5px] leading-[1.6] text-ink">
                      {i.name}
                      {i.dose ? <span className="text-muted"> · {i.dose}</span> : null}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
          {/* 건강식품 — 같은 때의 약과 함께 어르신 복약 미션에 들어간다 (2026-10-28 요청 5) */}
          <div className="mt-3">
            <div className="text-[12px] font-bold text-muted">건강식품</div>
            {(health.supplements || []).length ? (
              <ul className="m-0 mt-1 list-none p-0">
                {health.supplements.map((x) => (
                  <li key={x.id} className="text-[13.5px] leading-[1.6] text-ink">
                    {x.name}
                    <span className="text-muted">
                      {" "}
                      · {x.slot} {x.perDay}
                      {x.unit}
                      {x.expiry ? ` · 유통기한 ${x.expiry}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-1 text-[13px] text-muted">등록된 건강식품 없음</div>
            )}
          </div>
          <div className="mt-2 text-[11.5px] leading-[1.6] text-muted">
            {health.custom && health.at ? `수정 ${whenShort(health.at)}${health.by ? ` · ${health.by}` : ""} · 어르신 · 보호자 · 관제 3곳 반영` : "첫 안심방문 등록값 · 아직 고친 사람 없음"}
          </div>
          <button type="button" onClick={onEdit} className="btn-press mt-3 min-h-[40px] w-full rounded-[10px] border border-[#D9D6CF] bg-white text-[14px] font-bold text-navy">
            복용약 · 질환 · 건강식품 수정
          </button>
        </>
      )}
    </Card>
  );
}

// 어르신 부탁 — 미팅 리포트 '부탁하신 것' 한 줄 = 한 건 (2026-10-28 요청 1 · lib/elder-asks.js).
// 열린 것 위, 해결 · 취소된 것 아래 흐리게. '해결'은 한 줄 메모(선택)를 받고 닫는다 — 어르신 홈에서도 바로 빠진다.
// 어르신이 취소한 것은 '어르신 취소'로 보인다
export function AsksCard({ asks, onResolve }) {
  const id = useId();
  const open = asks.filter(isOpenAsk);
  const closed = asks
    .filter((a) => !isOpenAsk(a))
    .sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0))
    .slice(0, 8);
  const [doing, setDoing] = useState(null); // 해결 메모를 적고 있는 부탁 id
  const [memo, setMemo] = useState("");
  return (
    <Card className="p-[18px]">
      <Head title={`어르신 부탁 ${open.length}건`} aud={["sen"]} />
      {asks.length === 0 ? (
        <p className="mt-2.5 text-[13px] leading-[1.6] text-muted">미팅 리포트 &lsquo;부탁하신 것&rsquo;에 적으면 한 줄에 한 건씩 여기 남아요.</p>
      ) : (
        <ul className="m-0 mt-2 list-none p-0">
          {open.map((a) => (
            <li key={a.id} className="border-b border-[#EFEDE8] py-2.5 last:border-0">
              <div className="flex items-start gap-2.5">
                <span className="min-w-0 flex-1">
                  <b className="block text-[14px] leading-[1.5] text-ink">{a.text}</b>
                  <span className="block text-[11.5px] text-muted">
                    {md(a.at)}
                    {a.by ? ` · ${a.by} 미팅 리포트` : ""} · {a.shownAt ? "어르신 앱에 보이는 중" : "관제가 리포트를 보내면 어르신 앱에"}
                  </span>
                </span>
                {doing !== a.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setDoing(a.id);
                      setMemo("");
                    }}
                    className="btn-press min-h-[40px] flex-none rounded-[10px] bg-navy px-3.5 text-[13px] font-bold text-white"
                  >
                    해결
                  </button>
                )}
              </div>
              {doing === a.id && (
                <div className="mt-2 flex flex-col gap-2">
                  <label htmlFor={`${id}-${a.id}`} className="text-[12px] font-bold text-navy">
                    한 줄 메모 (선택)
                  </label>
                  <input
                    id={`${id}-${a.id}`}
                    value={memo}
                    maxLength={80}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="예) 10/30 전구 교체함"
                    className="min-h-[44px] rounded-[10px] border border-[#D9D6CF] bg-white px-3 text-[14px] text-navy outline-none focus:border-navy"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setDoing(null)} className="btn-press min-h-[44px] rounded-[10px] border border-[#D9D6CF] bg-white text-[13.5px] font-bold text-navy">
                      그만두기
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onResolve(a, memo.trim());
                        setDoing(null);
                      }}
                      className="btn-press min-h-[44px] rounded-[10px] bg-navy text-[13.5px] font-bold text-white"
                    >
                      해결로 저장
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
          {closed.map((a) => (
            <li key={a.id} className="border-b border-[#EFEDE8] py-2 opacity-60 last:border-0">
              <span className="block text-[13.5px] leading-[1.5] text-ink">{a.text}</span>
              <span className="block text-[11.5px] text-muted">{askDoneText(a)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// 4. 다음 진료 예약 — 어르신 · 보호자 캘린더에 함께 보이는 진료 일정 (컨시어지가 방문 탭에서 등록한 것 포함)
export function ApptCard({ appts }) {
  return (
    <Card className="p-[18px]">
      <Head title="다음 진료 예약" aud={["sen", "gua"]} />
      {appts.length ? (
        <ul className="m-0 mt-2 list-none p-0">
          {appts.map((e) => (
            <li key={e.id} className="flex min-h-[44px] items-center justify-between gap-3 border-b border-[#EFEDE8] py-2 last:border-0">
              <span className="min-w-0 text-[14px] font-bold text-ink">{e.title}</span>
              <span className="font-num flex-none text-[13px] font-bold text-navy">
                {md(e.at)} {hm(e.at)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2.5 text-[13px] leading-[1.6] text-muted">잡힌 진료 예약이 없어요 — 병원에서 확정되면 방문 · 리포트 탭 &lsquo;다음 진료 예약&rsquo;에서 등록해요.</p>
      )}
    </Card>
  );
}

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const dayOf = (t) => `${md(t)} (${DOW[kd(t).getUTCDay()]})`;
// 누가 올린 일정인가 — 관제가 승인하면 출처 글이 '관제 승인'으로 바뀌어 등록한 쪽(lib/event-rights.js eventOwner)으로 말한다
const OWNER_WORD = { elder: "어르신 등록", guardian: "보호자 등록", concierge: "컨시어지 등록", family: "가족 요청", request: "해주세요" };
const fromOf = (e) => OWNER_WORD[eventOwner(e)] || e.source || "관제";

// 5. 공유 일정 — 어르신 · 보호자 달력과 같은 기록 (2026-10-28 요청 7 · 10-30 현장 확인). 일정 달력(오늘 탭)은 내가 나가는 일만
// 보여서, 가족 · 배송 · 동행 없는 부탁 같은 나머지 공유 일정은 볼 곳이 없었다. 관제가 확정한 것과 가족 일정만 (승인 전 · 반려는
// 안 보인다 — lib/state.js eventsFor). 바꾼 것을 관제가 다시 보는 중이면 원래 확정 값 + '변경 확인 중'. 취소된 것은 아래에 누가 · 왜와 함께
export function SharedScheduleCard({ events, cancelled, isWork, limit = 8 }) {
  const shown = events.slice(0, limit);
  return (
    <Card className="p-[18px]">
      <Head title="공유 일정" aud={["sen", "gua"]} right={events.length ? <span className="font-num text-[12px] font-bold text-muted">오늘부터 {events.length}건</span> : null} />
      {shown.length ? (
        <ul aria-label="공유 일정" className="m-0 mt-2 list-none p-0">
          {shown.map((e) => (
            <li key={e.id} className="flex gap-3 border-b border-[#EFEDE8] py-2.5 last:border-0">
              <span className="w-[66px] flex-none">
                <b className="block font-num text-[13px] text-navy">{dayOf(e.at)}</b>
                <span className="font-num text-[12px] text-muted">{hm(e.at)}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start gap-1.5">
                  <span className="mt-[1px] inline-flex h-[20px] flex-none items-center rounded-[6px] bg-[#EEEDEA] px-1.5 text-[11px] font-bold text-[#5E5A52]">{EVENT_SHORT[e.kind] || "일정"}</span>
                  <b className="min-w-0 text-[14px] leading-[1.45] text-ink">{e.title}</b>
                </span>
                <span className="mt-0.5 block text-[11.5px] leading-[1.5] text-muted">
                  {[fromOf(e), e.approval === "approved" ? "관제 확정" : null, e.escort ? "동행" : e.approval === "approved" && e.kind !== "visit" ? "동행 없음" : null].filter(Boolean).join(" · ")}
                </span>
                {e.changePending && <span className="block text-[11.5px] font-bold leading-[1.5] text-gold">변경 확인 중 — 관제가 바뀐 내용을 보고 있어요 · 지금 보이는 것이 확정된 원래 일정</span>}
              </span>
              {isWork(e) && <span className="h-[22px] flex-none self-start rounded-[6px] bg-[#F1E9DC] px-2 text-[11px] font-bold leading-[22px] text-[#6A4C16]">나갈 일</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2.5 text-[13px] leading-[1.6] text-muted">오늘부터 잡힌 공유 일정이 없어요.</p>
      )}
      {events.length > shown.length && <p className="mt-1.5 text-[12px] text-muted">그 뒤 {events.length - shown.length}건 더 — 어르신 · 보호자 달력에 같이 있어요.</p>}
      {cancelled.length > 0 && (
        <div className="mt-3 border-t border-[#EFEDE8] pt-2.5">
          <div className="text-[12px] font-bold text-muted">최근 취소된 일정 {cancelled.length}건</div>
          <ul aria-label="최근 취소된 일정" className="m-0 mt-1 list-none p-0">
            {cancelled.map((x) => (
              <li key={`${x.id}-${x.removed.at}`} className="py-1.5 text-[12.5px] leading-[1.55] text-[#5E5A52]">
                <b className="block line-through decoration-[#5E5A52]/50">
                  {dayOf(x.at)} {hm(x.at)} · {x.title}
                </b>
                <span className="block">
                  {x.removed.by || "관제"} 취소 · {whenShort(x.removed.at)}
                  {x.removed.reason ? ` · ${x.removed.reason}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-2.5 text-[11px] leading-[1.6] text-muted">어르신 · 보호자 달력과 같은 기록이에요 — 등록 · 변경 · 취소가 여기도 바로 바뀌어요. &lsquo;나갈 일&rsquo;은 오늘 탭 일정 달력에도 떠요.</p>
    </Card>
  );
}

