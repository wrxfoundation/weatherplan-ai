// 마음사서함 (컨시어지 탭) — 2026-09-22 강도완 명세 · 시안 2·3.
// 화면 순서: 오늘의 음성소통 진행률 → 받은 음성(답장 필요) → 오늘 미발송 고객 →
// 장기 미응답·관제 확인 필요 → 전체 관리 고객 → (고객을 누르면) 고객별 음성 대화기록.
//
// 원칙 둘.
//  1) 완료는 녹음이 아니라 '정상 발송 확인'이다 — 실패는 목록에서 빼지 않고 실패로 남긴다.
//  2) 글은 STT 가 아니다 (2026-09-11 A안 확정) — 보낼 때 적은 한 줄, 들은 뒤 적는 청취 메모.
//     듣기 전 받은 음성에는 글이 없다.
// 빨강은 SOS·낙상 전용이라 '답장 필요'·'확인 필요'는 호박색을 쓴다.
import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "./icons";
import { Card, SectionLabel, Badge } from "./ui";
import {
  INBOX_STATUS,
  VOICE_CATEGORIES,
  agoLabel,
  fmtSecs,
  whenLabel,
} from "../lib/mailbox";

// ── 파형 — 기다란 막대 (id 로 모양을 고정한다 · 리렌더마다 흔들리면 눈이 피로하다) ──
function Wave({ seed = "", n = 22, color = "#1E7A5A", dim = false }) {
  const bars = useMemo(() => {
    let h = 7;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 9973;
    return Array.from({ length: n }, (_, i) => {
      h = (h * 1103515245 + 12345) % 2147483647;
      const base = 8 + (h % 22);
      return i % 3 === 2 ? Math.max(6, base - 8) : base;
    });
  }, [seed, n]);
  return (
    <span aria-hidden className="flex flex-1 items-center gap-[3px]">
      {bars.map((b, i) => (
        <span
          key={i}
          className="w-[3px] shrink-0 rounded-full"
          style={{ height: b, background: color, opacity: dim ? 0.35 : 0.85 }}
        />
      ))}
    </span>
  );
}

function Face({ name, tone = "gold", size = 44 }) {
  const tones = {
    gold: { bg: "#EFE6D5", fg: "#7A5C28" },
    green: { bg: "rgba(30,122,90,.12)", fg: "#1E7A5A" },
    navy: { bg: "rgba(10,31,60,.08)", fg: "#0A1F3C" },
  };
  const t = tones[tone] || tones.gold;
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{ width: size, height: size, background: t.bg, color: t.fg, fontSize: size * 0.36 }}
    >
      {name.slice(0, 1)}
    </span>
  );
}

function StatusPill({ status }) {
  const s = INBOX_STATUS[status];
  if (!s) return null;
  return <Badge fg={s.fg} bg={s.bg}>{s.label}</Badge>;
}

// ── 1. 오늘의 음성소통 진행률 ──
function Progress({ counts }) {
  const pct = counts.target ? Math.round((counts.done / counts.target) * 100) : 0;
  return (
    <Card className="p-[18px]">
      <div className="flex items-baseline gap-2">
        <span className="text-[15px] font-black text-navy">오늘의 마음안부</span>
        <span className="ml-auto font-num text-[12px] text-muted">
          담당 {counts.total}명{counts.excluded > 0 ? ` · 오늘 제외 ${counts.excluded}` : ""}
        </span>
      </div>
      <div className="mt-2 flex items-end gap-4">
        <div>
          <div className="font-num text-[30px] font-black leading-none text-navy">{counts.target}명</div>
          <div className="mt-1 text-[11px] text-muted">오늘 소통 대상</div>
        </div>
        <div className="flex flex-1 justify-between">
          {[
            ["완료", counts.done, "#1E7A5A"],
            ["답장 필요", counts.needReply, "#8A5D12"],
            ["미발송", counts.unsent, "#3B5C8A"],
          ].map(([k, v, c]) => (
            <div key={k} className="text-center">
              <div className="font-num text-[22px] font-black leading-none" style={{ color: c }}>{v}</div>
              <div className="mt-1 text-[11px] text-muted">{k}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px]">
        <span className="text-muted">오늘 소통 진행률</span>
        <span className="font-num font-bold text-navy">{counts.done} / {counts.target} 완료</span>
      </div>
      <div className="mt-1.5 h-[7px] w-full overflow-hidden rounded-full bg-navy/[.08]">
        <span
          className="block h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg,#1E7A5A,#2E9B72)" }}
        />
      </div>
      {counts.failed > 0 && (
        <p className="mt-2.5 rounded-xl border border-amber/30 bg-[#FFF7E8] px-3 py-2 text-[12px] font-bold leading-[1.6] text-amber">
          발송 실패 {counts.failed}건 — 실패한 건은 완료로 넘어가지 않습니다. 목록에서 다시 보내세요.
        </p>
      )}
    </Card>
  );
}

// ── 2. 받은 음성메시지 ──
function InboxCard({ m, client, onPlay, onOpen, onOps }) {
  return (
    <div className="rounded-xl border border-navy/[.08] bg-white/70 p-3">
      <div className="flex items-center gap-2.5">
        <Face name={m.client} tone={m.status === "needReply" ? "gold" : "navy"} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[15px] font-bold text-navy">{m.client} 고객</span>
            {client?.age && <span className="font-num text-[11px] text-muted">{client.age}세</span>}
            <StatusPill status={m.status} />
          </div>
          <div className="mt-0.5 font-num text-[12px] text-muted">
            {whenLabel(m.at)} · 음성 {m.secs}초
            {client?.sent?.status === "sent" && ` · 내 발송 ${agoLabel((Date.now() - client.sent.at) / 60000)}`}
          </div>
        </div>
      </div>
      {/* 청취 메모 — 들은 뒤에만. STT 가 아니라 컨시어지가 적은 한 줄이다 */}
      {m.memo ? (
        <p className="mt-2 rounded-lg bg-navy/[.04] px-2.5 py-1.5 text-[12.5px] leading-[1.6] text-ink">{m.memo}</p>
      ) : (
        <p className="mt-2 text-[12px] leading-[1.6] text-muted">
          {m.status === "unheard" ? "아직 듣지 않았습니다 — 들으면 답장 필요로 넘어갑니다." : "청취 메모가 없습니다 — 대화에서 적을 수 있습니다."}
        </p>
      )}
      <div className="mt-2.5 flex gap-2">
        <button
          onClick={onPlay}
          className="btn-press flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-navy/20 py-2.5 text-[13px] font-bold text-navy"
        >
          <Icon name={m.status === "unheard" ? "play" : "speaker"} size={16} strokeWidth={2} />
          {m.status === "unheard" ? "재생" : "다시 듣기"}
        </button>
        <button
          onClick={onOpen}
          className="btn-press btn-dark flex-1 rounded-xl bg-green py-2.5 text-[13px] font-bold text-white"
        >
          음성 답장
        </button>
        <button
          onClick={onOps}
          className="btn-press shrink-0 rounded-xl border border-navy/20 px-3 py-2.5 text-[13px] font-bold text-muted"
          title="삭제·완료 대신 관제로 넘깁니다"
        >
          관제 전달
        </button>
      </div>
    </div>
  );
}

// ── 3. 오늘 음성을 보내지 않은 고객 ──
function UnsentCard({ c, onSend, onOpen }) {
  const failed = c.sent?.status === "failed";
  const sending = c.sent?.status === "sending";
  return (
    <div
      className="rounded-xl border bg-white/70 p-3"
      style={failed ? { borderColor: "rgba(138,93,18,.4)", background: "#FFFBF2" } : { borderColor: "rgba(10,31,60,.08)" }}
    >
      <div className="flex items-center gap-2.5">
        <Face name={c.name} tone="navy" size={40} />
        <button onClick={onOpen} className="btn-press btn-inline min-w-0 flex-1 text-left">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-[15px] font-bold text-navy">{c.name} 고객</span>
            <span className="font-num text-[11px] text-muted">{c.age}세 · {c.where}</span>
            {c.role === "부" && <Badge fg="#5C5A54" bg="rgba(10,31,60,.06)">부 담당</Badge>}
          </span>
          <span className="mt-0.5 block font-num text-[12px] text-muted">
            마지막 발송 {agoLabel(c.lastSentMin)} · 최근 응답 {agoLabel(c.lastReplyMin)}
            {c.noReplyDays > 0 && <span className="font-bold text-amber"> · 연속 미응답 {c.noReplyDays}일</span>}
          </span>
        </button>
      </div>
      {c.opsNote && <p className="mt-1.5 text-[12px] leading-[1.6] text-muted">관제 · {c.opsNote}</p>}
      {failed && (
        <p className="mt-1.5 text-[12.5px] font-bold leading-[1.6] text-amber">
          발송 실패 — 고객 기기가 꺼져 있습니다. 완료로 넘기지 않았습니다.
        </p>
      )}
      <button
        onClick={onSend}
        disabled={sending}
        className={`btn-press btn-dark mt-2.5 w-full rounded-xl py-2.5 text-[14px] font-bold text-white disabled:opacity-70 ${
          failed ? "bg-amber" : "bg-green"
        }`}
      >
        {sending ? "발송 중…" : failed ? "다시 보내기" : "음성 보내기"}
      </button>
    </div>
  );
}

// ── 4. 소통이 끊긴 고객 ──
function AlertCard({ c, onOps, onOpen }) {
  const ops = c.comm === "opsNeeded";
  return (
    <div className="rounded-xl border border-amber/35 bg-[#FFF7E8] p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[14.5px] font-bold text-navy">{c.name} 고객</span>
        <Badge fg="#8A5D12" bg="rgba(138,93,18,.14)">{ops ? "관제 확인 필요" : "확인 필요"}</Badge>
        {c.opsSentAt && <Badge fg="#0A1F3C" bg="rgba(10,31,60,.08)">관제 전달됨</Badge>}
      </div>
      <p className="mt-1 text-[12.5px] leading-[1.6] text-[#5A4A22]">
        음성 답장 {c.noReplyDays}일 없음
        {c.callMissed > 0 && ` · 통화 ${c.callMissed}회 미연결`}
        {c.opsNote && ` · ${c.opsNote}`}
      </p>
      <div className="mt-2.5 flex gap-2">
        <a
          href="tel:"
          onClick={(e) => e.preventDefault()}
          className="tap flex flex-1 items-center justify-center rounded-xl border border-navy/20 bg-white/70 py-2.5 text-[13px] font-bold text-navy"
        >
          고객 전화
        </a>
        <button onClick={onOpen} className="btn-press flex-1 rounded-xl border border-navy/20 bg-white/70 py-2.5 text-[13px] font-bold text-navy">
          대화 보기
        </button>
        <button
          onClick={onOps}
          disabled={!!c.opsSentAt}
          className="btn-press btn-dark flex-1 rounded-xl bg-navy py-2.5 text-[13px] font-bold text-white disabled:opacity-60"
        >
          {c.opsSentAt ? "전달됨" : "관제 전달"}
        </button>
      </div>
    </div>
  );
}

// ── 5. 전체 관리 고객 ──
const FILTERS = [
  ["all", "전체"],
  ["done", "오늘 완료"],
  ["reply", "답장 필요"],
  ["unsent", "미발송"],
  ["stale", "장기 미응답"],
  ["ops", "관제 확인 필요"],
];

function AllClients({ clients, onOpen }) {
  const [q, setQ] = useState("");
  const [f, setF] = useState("all");
  const list = clients
    .filter((c) => {
      if (f === "done") return c.doneToday;
      if (f === "reply") return c.open.length > 0;
      if (f === "unsent") return c.unsent;
      if (f === "stale") return c.noReplyDays >= 2;
      if (f === "ops") return c.comm === "opsNeeded" || !!c.opsSentAt;
      return true;
    })
    .filter((c) => !q.trim() || c.name.includes(q.trim()));
  return (
    <Card className="p-4">
      <div className="flex items-baseline gap-2">
        <span className="text-[15px] font-black text-navy">전체 관리 고객</span>
        <span className="ml-auto font-num text-[12px] text-muted">총 {clients.length}명</span>
      </div>
      <label htmlFor="mb-q" className="sr-only">고객명 검색</label>
      <input
        id="mb-q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="고객명 검색"
        className="mt-2.5 w-full rounded-xl border border-navy/15 bg-white/70 px-3.5 py-2.5 text-[14px] text-navy outline-none placeholder:text-muted/60 focus:border-gold"
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {FILTERS.map(([k, label]) => {
          const on = f === k;
          return (
            <button
              key={k}
              onClick={() => setF(k)}
              aria-pressed={on}
              className="btn-press btn-chip rounded-full border px-3 text-[12px] font-bold"
              style={on ? { background: "#0A1F3C", color: "#FFFFFF", borderColor: "#0A1F3C" } : { color: "#5C5A54", borderColor: "rgba(10,31,60,.15)" }}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="mt-2.5 divide-y divide-navy/[.06]">
        {list.length === 0 && <p className="py-4 text-center text-[13px] text-muted">해당하는 고객이 없습니다.</p>}
        {list.map((c) => (
          <button key={c.name} onClick={() => onOpen(c.name)} className="btn-press flex w-full items-center gap-2.5 py-2.5 text-left">
            <Face name={c.name} tone="navy" size={34} />
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-bold text-ink">
                {c.name} <span className="font-num text-[11px] text-muted">{c.age}세</span>
              </span>
              <span className="block font-num text-[11.5px] text-muted">
                발송 {agoLabel(c.lastSentMin)} · 응답 {agoLabel(c.lastReplyMin)}
                {c.nextVisit ? ` · 다음 방문 ${c.nextVisit}` : ""}
              </span>
            </span>
            {c.excluded ? (
              <Badge fg="#5C5A54" bg="rgba(10,31,60,.06)">오늘 제외</Badge>
            ) : c.open.length > 0 ? (
              <Badge fg="#8A5D12" bg="rgba(138,93,18,.14)">답장</Badge>
            ) : c.doneToday ? (
              <Badge fg="#1E7A5A" bg="rgba(30,122,90,.12)">완료</Badge>
            ) : (
              <Badge fg="#3B5C8A" bg="rgba(59,92,138,.12)">미발송</Badge>
            )}
            <span aria-hidden className="shrink-0 text-muted"><Icon name="chev" size={16} strokeWidth={2} /></span>
          </button>
        ))}
      </div>
      <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
        오늘 제외는 입원 · 여행 · 서비스 일시정지 · 관제 제외 처리입니다. 대면으로 만난 고객도
        음성 안부는 보내는 운영정책이라 방문만으로는 빠지지 않습니다.
      </p>
    </Card>
  );
}

// ── 고객별 음성 대화기록 (시안 3) ──
export function VoiceThread({ client, thread, onClose, onRecord, onPlay, onMemo, onOps, sendState }) {
  const [memoFor, setMemoFor] = useState(null);
  const [memoText, setMemoText] = useState("");
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [thread.length]);

  const days = [];
  thread.forEach((m) => {
    const label = whenLabel(m.at).startsWith("오늘") ? "오늘" : whenLabel(m.at).replace(/ \d\d:\d\d$/, "");
    if (!days.length || days[days.length - 1].label !== label) days.push({ label, items: [m] });
    else days[days.length - 1].items.push(m);
  });

  return (
    <div className="fixed inset-0 z-40 flex justify-center bg-[rgba(8,23,45,.45)]">
      <div className="flex h-full w-full max-w-[430px] flex-col bg-paper">
        {/* 머리 — 고객 · 마지막 접속 · 관제 전달 */}
        <header className="shrink-0 bg-green px-4 pb-3 pt-4 text-white">
          <div className="flex items-center gap-2.5">
            <button onClick={onClose} aria-label="마음사서함으로 돌아가기" className="btn-press -ml-1 shrink-0 rounded-lg px-2 py-1 text-[18px] font-bold text-white/90">
              ‹
            </button>
            <span
              aria-hidden
              className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-white/20 text-[15px] font-bold"
            >
              {client.name.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[17px] font-bold leading-tight">{client.name} 고객</div>
              <div className="mt-0.5 font-num text-[11.5px] text-white/75">
                {client.age}세 · {client.where} · 최근 응답 {agoLabel(client.lastReplyMin)}
              </div>
            </div>
            <button
              onClick={() => onOps(null)}
              disabled={!!client.opsSentAt}
              className="btn-press shrink-0 rounded-[10px] border border-white/40 px-2.5 py-1.5 text-[12px] font-bold text-white disabled:opacity-60"
            >
              {client.opsSentAt ? "관제 전달됨" : "관제 전달"}
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {thread.length === 0 && (
            <p className="mt-6 text-center text-[14px] leading-[1.7] text-muted">
              아직 주고받은 음성이 없습니다.
              <br />
              아래에서 첫 안부를 보내 보세요.
            </p>
          )}
          {days.map((d) => (
            <div key={d.label}>
              <div className="my-3 text-center">
                <span className="rounded-full bg-navy/[.06] px-3 py-1 text-[11.5px] font-bold text-muted">{d.label}</span>
              </div>
              <div className="space-y-3">
                {d.items.map((m) => {
                  const mine = m.dir === "out";
                  const unheard = !mine && m.status === "unheard";
                  return (
                    <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                      <span className="mb-1 px-1 text-[11px] font-bold text-muted">
                        {mine ? "내가 보낸 음성" : "고객이 보내온 음성"}
                      </span>
                      <div
                        className="w-[88%] rounded-2xl border p-3"
                        style={
                          mine
                            ? { background: "rgba(30,122,90,.09)", borderColor: "rgba(30,122,90,.22)" }
                            : unheard
                              ? { background: "#FFFFFF", borderColor: "rgba(176,141,87,.5)" }
                              : { background: "#FFFFFF", borderColor: "rgba(10,31,60,.1)" }
                        }
                      >
                        <button
                          onClick={() => onPlay(m)}
                          aria-label={`${mine ? "내가 보낸" : "고객이 보낸"} 음성 ${m.secs}초 듣기`}
                          className="btn-press flex w-full items-center gap-2.5"
                        >
                          <span
                            aria-hidden
                            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full"
                            style={{ background: unheard ? "#B08D57" : "#1E7A5A", color: "#FFFFFF" }}
                          >
                            <Icon name={m.heard || mine ? "speaker" : "play"} size={17} strokeWidth={2} />
                          </span>
                          <Wave seed={m.id} color={mine ? "#1E7A5A" : "#0A1F3C"} dim={!mine && !m.heard} />
                          <span className="shrink-0 font-num text-[12px] font-bold text-muted">{fmtSecs(m.secs)}</span>
                        </button>
                        {m.text ? (
                          <p className="mt-2 text-[13.5px] leading-[1.6] text-ink">{m.text}</p>
                        ) : (
                          !mine && (
                            <p className="mt-2 text-[12.5px] leading-[1.6] text-muted">
                              {unheard ? "아직 듣지 않았습니다" : "청취 메모가 없습니다"}
                            </p>
                          )
                        )}
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="font-num text-[11px] text-muted">
                            {whenLabel(m.at).replace(/^오늘 /, "")}
                            {mine && (m.status === "sending" ? " · 발송 중" : " · 전송 완료")}
                          </span>
                          {!mine && (
                            <>
                              <button
                                onClick={() => {
                                  setMemoFor(m.id);
                                  setMemoText(m.text || "");
                                }}
                                className="btn-press btn-inline ml-auto text-[11.5px] font-bold text-navy underline underline-offset-2"
                              >
                                {m.text ? "메모 수정" : "청취 메모"}
                              </button>
                              <button
                                onClick={() => onOps(m.inboxId)}
                                className="btn-press btn-inline text-[11.5px] font-bold text-gold underline underline-offset-2"
                              >
                                관제 전달
                              </button>
                            </>
                          )}
                        </div>
                        {memoFor === m.id && (
                          <div className="mt-2 border-t border-navy/[.08] pt-2">
                            <label htmlFor={`memo-${m.id}`} className="text-[11px] font-bold text-muted">
                              들은 내용을 한 줄로 (자동 변환이 아니라 직접 적습니다)
                            </label>
                            <textarea
                              id={`memo-${m.id}`}
                              value={memoText}
                              onChange={(e) => setMemoText(e.target.value)}
                              rows={2}
                              className="mt-1 w-full rounded-lg border border-navy/15 px-2.5 py-2 text-[13px] text-ink outline-none focus:border-gold"
                              placeholder="예: 무릎이 불편하다고 하심 · 방문 때 확인"
                            />
                            <div className="mt-1.5 flex gap-2">
                              <button
                                onClick={() => setMemoFor(null)}
                                className="btn-press flex-1 rounded-lg border border-navy/15 py-2 text-[12.5px] font-bold text-muted"
                              >
                                취소
                              </button>
                              <button
                                onClick={() => {
                                  onMemo(m.inboxId || m.id, memoText.trim());
                                  setMemoFor(null);
                                }}
                                className="btn-press btn-dark flex-1 rounded-lg bg-navy py-2 text-[12.5px] font-bold text-white"
                              >
                                메모 저장
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* 녹음 입구 — 채팅의 입력창 자리 */}
        <div className="shrink-0 border-t border-navy/10 bg-white px-4 py-3">
          {sendState === "failed" && (
            <p className="mb-2 rounded-lg border border-amber/30 bg-[#FFF7E8] px-3 py-2 text-[12.5px] font-bold text-amber">
              발송 실패 — 다시 녹음해 보내 주세요. 실패한 건은 완료로 넘기지 않았습니다.
            </p>
          )}
          <button
            onClick={onRecord}
            className="btn-press flex w-full items-center gap-3 rounded-2xl border border-navy/12 bg-paper px-4 py-3 text-left"
          >
            <span className="flex-1 text-[14px] text-muted">음성메시지를 녹음해보세요</span>
            <span
              aria-hidden
              className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-green text-white"
            >
              <Icon name="mic" size={20} strokeWidth={2} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 녹음 시트 (시안 3 하단) ──
export function RecordSheet({ client, onClose, onSend }) {
  const [rec, setRec] = useState(false);
  const [secs, setSecs] = useState(0);
  const [done, setDone] = useState(false);
  const [paused, setPaused] = useState(false);
  const [cat, setCat] = useState(VOICE_CATEGORIES[0]);
  const [title, setTitle] = useState("");
  const [share, setShare] = useState(false);
  const [ops, setOps] = useState(true);
  const [sending, setSending] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!rec || paused) return undefined;
    timer.current = setInterval(() => setSecs((s) => Math.min(s + 1, 120)), 1000);
    return () => clearInterval(timer.current);
  }, [rec, paused]);

  const stop = () => {
    setRec(false);
    setPaused(false);
    if (secs >= 1) setDone(true);
    else setSecs(0);
  };
  const again = () => {
    setDone(false);
    setSecs(0);
    setRec(false);
    setPaused(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(8,23,45,.5)]">
      <div className="max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-white p-6 pb-8">
        <div className="mx-auto mb-4 h-[4px] w-[38px] rounded-full bg-navy/15" />
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 text-[18px] font-black text-navy">{client.name} 고객에게 음성 보내기</div>
          <button onClick={onClose} className="btn-press shrink-0 rounded-[10px] border border-navy/20 px-3 py-1.5 text-[13px] font-bold text-muted">
            닫기
          </button>
        </div>

        {/* 녹음기 · 미리듣기 */}
        <div className="mt-4 rounded-2xl border border-navy/10 bg-paper p-4">
          {!done ? (
            <>
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className={`flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full ${rec && !paused ? "animate-livePing" : ""}`}
                  style={{ background: rec ? "#C0392B" : "#1E7A5A", color: "#FFFFFF" }}
                >
                  <Icon name="mic" size={21} strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-num text-[22px] font-black leading-none text-navy">{fmtSecs(secs)}</div>
                  <div className="mt-1 text-[12px] text-muted">
                    {rec ? (paused ? "일시정지 — 이어서 녹음할 수 있습니다" : "녹음 중") : "눌러서 녹음을 시작하세요"}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                {!rec ? (
                  <button onClick={() => setRec(true)} className="btn-press btn-dark flex-1 rounded-xl bg-green py-3 text-[15px] font-bold text-white">
                    녹음 시작
                  </button>
                ) : (
                  <>
                    <button onClick={() => setPaused((p) => !p)} className="btn-press flex-1 rounded-xl border border-navy/20 py-3 text-[15px] font-bold text-navy">
                      {paused ? "이어서 녹음" : "일시정지"}
                    </button>
                    <button onClick={stop} className="btn-press btn-dark flex-1 rounded-xl bg-navy py-3 text-[15px] font-bold text-white">
                      녹음 종료
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <span aria-hidden className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-green text-white">
                  <Icon name="play" size={18} strokeWidth={2} />
                </span>
                <Wave seed={`rec-${secs}`} n={20} color="#1E7A5A" />
                <span className="shrink-0 font-num text-[13px] font-bold text-muted">{fmtSecs(secs)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11.5px]">
                <span className="text-muted">녹음 미리듣기</span>
                <span className="font-bold text-green">녹음 완료</span>
              </div>
            </>
          )}
        </div>

        {/* 분류 · 제목 */}
        <div className="mt-4">
          <SectionLabel>메시지 분류</SectionLabel>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {VOICE_CATEGORIES.map((c) => {
              const on = cat === c;
              return (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  aria-pressed={on}
                  className="btn-press btn-chip rounded-full border px-3 text-[12.5px] font-bold"
                  style={on ? { background: "#1E7A5A", color: "#FFFFFF", borderColor: "#1E7A5A" } : { color: "#5C5A54", borderColor: "rgba(10,31,60,.15)" }}
                >
                  {c}
                </button>
              );
            })}
          </div>
          <label htmlFor="rec-title" className="mt-3 block text-[12px] font-bold text-muted">
            한 줄 제목 (고객 화면 목록에 이 글이 보입니다 · 자동 변환 아님)
          </label>
          <input
            id="rec-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`예: ${cat} · 오늘 오후에 뵙겠습니다`}
            className="mt-1 w-full rounded-xl border border-navy/15 px-3.5 py-2.5 text-[14px] text-navy outline-none placeholder:text-muted/60 focus:border-gold"
          />
        </div>

        {/* 공유 범위 */}
        <div className="mt-3 space-y-2 rounded-2xl border border-navy/10 bg-paper p-3">
          {[
            ["보호자에게 동시 공유", share, setShare, "보호자 앱 안부 기록에도 남습니다"],
            ["관제 기록에 포함", ops, setOps, "발송 사실만 남고 음성 내용은 담당자만 듣습니다"],
          ].map(([label, on, set, hint]) => (
            <button
              key={label}
              onClick={() => set(!on)}
              aria-pressed={on}
              className="btn-press flex w-full items-center gap-2.5 text-left"
            >
              <span
                aria-hidden
                className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px] border"
                style={on ? { background: "#1E7A5A", borderColor: "#1E7A5A", color: "#fff" } : { borderColor: "rgba(10,31,60,.25)" }}
              >
                {on && <Icon name="check" size={14} strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-bold text-ink">{label}</span>
                <span className="block text-[11.5px] leading-[1.5] text-muted">{hint}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={again}
            disabled={!done || sending}
            className="btn-press flex-1 rounded-xl border border-navy/20 py-3.5 text-[15px] font-bold text-navy disabled:opacity-40"
          >
            다시 녹음
          </button>
          <button
            onClick={() => {
              if (!done || sending) return;
              setSending(true);
              onSend({ secs, category: cat, title: title.trim() || `${cat} · 음성 ${secs}초`, shareGuardian: share, opsLog: ops });
            }}
            disabled={!done || sending}
            className="btn-press btn-dark flex-[1.6] rounded-xl bg-green py-3.5 text-[15px] font-bold text-white disabled:opacity-40"
          >
            {sending ? "발송 중… (서버 확인 대기)" : "고객에게 음성 발송"}
          </button>
        </div>
        <p className="mt-3 text-[11.5px] leading-[1.7] text-muted">
          정상 발송이 확인되면 오늘 미발송 목록에서 자동으로 제외됩니다. 실패하면 목록에 남고
          실패로 표시됩니다.
          <br />
          받은 음성과 내가 보낸 음성은 고객별 대화기록에 함께 보관됩니다.
        </p>
      </div>
    </div>
  );
}

// ── 탭 본문 ──
export default function Mailbox({ mb, onEvent, onSent }) {
  const { clients, counts, openInbox, unsentList, alerts, threadFor, hear, setMemo, complete, toOps, send } = mb;
  const [open, setOpen] = useState(null); // 대화 열린 고객 이름
  const [recFor, setRecFor] = useState(null); // 녹음 시트 대상

  const byName = useMemo(() => Object.fromEntries(clients.map((c) => [c.name, c])), [clients]);
  const cur = open ? byName[open] : null;

  const doOps = (name, inboxId) => {
    toOps(name, inboxId);
    onEvent?.("관제", `${name} 고객 음성 · 관제 전달 — 확인 요청`, "#8FA9CC");
  };
  // 발송은 서버 확인이 온 뒤에 끝난다 — 성공해야 고객 화면(어르신 마음사서함)에 꽂히고
  // 미발송 목록에서 빠진다. 실패는 티커에도 실패로 남긴다.
  const doSend = (name, payload) => {
    send(name, payload, (result) => {
      setRecFor(null);
      if (result === "sent") onSent?.(name, payload);
      onEvent?.(
        "음성",
        result === "sent"
          ? `${name} 고객에게 안부 음성 ${payload.secs}초 발송 — 정상 확인`
          : `${name} 고객 음성 발송 실패 — 기기 미수신 · 재발송 필요`,
        result === "sent" ? "#8FE3C0" : "#F0D9A8"
      );
    });
  };

  return (
    <>
      <div className="space-y-3.5">
        <div className="px-1">
          <h2 className="text-[21px] font-black text-navy">마음사서함</h2>
          <p className="mt-0.5 text-[13px] leading-[1.6] text-muted">담당 고객과 오늘의 안부를 음성으로 주고받습니다.</p>
        </div>

        <Progress counts={counts} />

        {/* 받은 음성메시지 — 미처리 우선 */}
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-black text-navy">받은 음성메시지</span>
            {counts.needReply > 0 && (
              <span className="rounded-full bg-amber/15 px-2 py-[2px] font-num text-[12px] font-bold text-amber">{counts.needReply}</span>
            )}
            <span className="ml-auto text-[11.5px] text-muted">미처리 우선</span>
          </div>
          <div className="mt-3 space-y-2">
            {openInbox.length === 0 && (
              <p className="py-3 text-center text-[13px] text-muted">받은 음성을 모두 처리했습니다.</p>
            )}
            {openInbox.map((m) => (
              <div key={m.id}>
                <InboxCard
                  m={m}
                  client={byName[m.client]}
                  onPlay={() => hear(m.id)}
                  onOpen={() => {
                    hear(m.id);
                    setOpen(m.client);
                  }}
                  onOps={() => doOps(m.client, m.id)}
                />
                {m.status !== "unheard" && (
                  <button
                    onClick={() => complete(m.id)}
                    className="btn-press mt-1 w-full rounded-lg py-2 text-[12px] font-bold text-muted underline underline-offset-2"
                  >
                    답장 없이 처리 완료로 넘기기
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
            답장하거나 처리 완료를 누르면 이 목록에서 빠지고 고객별 대화기록에 남습니다. 긴급이
            의심되면 완료로 넘기지 말고 관제로 전달하세요.
          </p>
        </Card>

        {/* 오늘 음성을 보내지 않은 고객 */}
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-black text-navy">오늘 음성을 보내지 않은 고객</span>
            {counts.unsent > 0 && (
              <span className="rounded-full bg-navy/[.07] px-2 py-[2px] font-num text-[12px] font-bold text-navy">{counts.unsent}</span>
            )}
            <span className="ml-auto text-[11.5px] text-muted">발송 확인 시 자동 제외</span>
          </div>
          <div className="mt-3 space-y-2">
            {unsentList.length === 0 && (
              <p className="py-3 text-center text-[13px] font-bold text-green">오늘 소통 대상 전원에게 안부를 보냈습니다.</p>
            )}
            {unsentList.map((c) => (
              <UnsentCard key={c.name} c={c} onSend={() => setRecFor(c.name)} onOpen={() => setOpen(c.name)} />
            ))}
          </div>
        </Card>

        {/* 소통이 끊긴 고객 */}
        {alerts.length > 0 && (
          <Card className="border border-amber/30 p-4">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-black text-navy">확인이 필요한 고객</span>
              <span className="ml-auto font-num text-[12px] font-bold text-amber">{alerts.length}명</span>
            </div>
            <div className="mt-3 space-y-2">
              {alerts.map((c) => (
                <AlertCard key={c.name} c={c} onOps={() => doOps(c.name, null)} onOpen={() => setOpen(c.name)} />
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-[1.7] text-muted">
              2일 이상 답장이 없거나 통화가 두 번 연결되지 않으면 여기 올라옵니다. 3일 이상 모든
              소통이 끊기면 관제 확인 필요로 자동 전환됩니다 — 무감지 대응정책과 같은 기준입니다.
            </p>
          </Card>
        )}

        <AllClients clients={clients} onOpen={setOpen} />
      </div>

      {cur && (
        <VoiceThread
          client={cur}
          thread={threadFor(cur.name)}
          sendState={cur.sent?.status}
          onClose={() => setOpen(null)}
          onRecord={() => setRecFor(cur.name)}
          onPlay={(m) => hear(m.inboxId || m.id)}
          onMemo={(id, text) => setMemo(id, text)}
          onOps={(inboxId) => doOps(cur.name, inboxId)}
        />
      )}
      {recFor && byName[recFor] && (
        <RecordSheet client={byName[recFor]} onClose={() => setRecFor(null)} onSend={(payload) => doSend(recFor, payload)} />
      )}
    </>
  );
}
