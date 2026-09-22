// 마음사서함 (컨시어지) — 담당 고객과 하루의 안부를 음성으로 주고받는 탭의 데이터·규칙.
// 2026-09-22 강도완 명세 · 시안 2(목록)·3(대화·녹음).
//
// 글자에 대한 원칙: STT 는 A안(제목만 · 내용은 듣기 · 2026-09-11 결정)이다. 말풍선 아래 글은
// 받아쓴 것이 아니라 사람이 쓴 한 줄 — 내가 보낸 것은 보낼 때 적은 제목, 받은 것은 들은 뒤
// 적는 '청취 메모'. 듣기 전에는 글이 없다.
//
// 완료의 기준: 녹음 버튼을 누른 것이 아니라 서버가 정상 발송을 확인한 것 (명세 마지막 줄).
// 데모는 서버 대신 1.2초 뒤 결과를 돌려주고, 기기가 꺼진 고객(sendFail)은 첫 시도가 실패한다 —
// 실패는 목록에서 빼지 않고 '발송 실패'로 남는다.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MY_CLIENTS } from "./console";
import { TEACHER_INBOX } from "./mock";

const MIN = 60000;
export const VOICE_CATEGORIES = ["안부인사", "방문안내", "복약확인", "병원일정", "가족 메시지 전달", "요청사항 답변", "긴급확인"];

// 받은 음성 처리 상태 (명세 2절) — ops·done 은 어느 단계에서든 갈 수 있다.
// 빨강은 SOS·낙상 전용이라 '답장 필요'는 호박색이다.
export const INBOX_STATUS = {
  unheard: { label: "미청취", fg: "#6E4FD8", bg: "rgba(110,79,216,.12)" },
  heard: { label: "청취 완료", fg: "#3B5C8A", bg: "rgba(59,92,138,.12)" },
  needReply: { label: "답장 필요", fg: "#8A5D12", bg: "rgba(138,93,18,.14)" },
  replied: { label: "답장 완료", fg: "#1E7A5A", bg: "rgba(30,122,90,.12)" },
  ops: { label: "관제 전달", fg: "#0A1F3C", bg: "rgba(10,31,60,.08)" },
  done: { label: "처리 완료", fg: "#5C5A54", bg: "rgba(10,31,60,.06)" },
};
export const OPEN_INBOX = new Set(["unheard", "heard", "needReply"]); // 미처리 — 상단 목록에 남는 것

// 고객별 소통 상태 씨앗 — MY_CLIENTS 12명. 시각은 '지금' 기준 분 단위 상대값 (며칠 뒤 열어도 오늘로 보이게).
//  sentToday    오늘 내가 정상 발송했는가            lastSentMin / lastReplyMin  마지막 발송·응답 (분 전 · null = 이력 없음)
//  noReplyDays  연속 미응답 일수                    callMissed  통화 미연결 횟수
//  exclude      오늘 소통 대상 제외 사유 (명세 3절)   sendFail    기기 오프라인 — 첫 발송이 실패하는 고객
//  opsNote      최근 관제 특이사항
export const CLIENT_SEED = {
  김순자: { sentToday: true, lastSentMin: 85, lastReplyMin: 20, noReplyDays: 0, callMissed: 0, opsNote: "오늘 13:50 병원동행 · 어제 심박 알림 1건 정상 확인" },
  오태식: { sentToday: false, lastSentMin: 2 * 1440 + 60, lastReplyMin: 2 * 1440 + 30, noReplyDays: 2, callMissed: 1, sendFail: true, opsNote: "워치 정상 수신 · 오늘 09:00 KMI 검진 동행 완료 (대면 뒤에도 음성 안부는 보내는 정책)" },
  안병철: { sentToday: false, lastSentMin: 1440 + 120, lastReplyMin: 1440 + 90, noReplyDays: 1, callMissed: 2, opsNote: "워치 3시간 무수집 · 관제 긴급확인 요청 08:42" },
  정말순: { sentToday: true, lastSentMin: 150, lastReplyMin: 1440 + 300, noReplyDays: 0, callMissed: 0, opsNote: "요양병원 · 오늘 11:40 면회 예정" },
  박영자: { sentToday: false, lastSentMin: null, lastReplyMin: null, noReplyDays: 0, callMissed: 0, exclude: "첫 방문 전 — 9/24 첫 안심방문 뒤 소통 시작", opsNote: null },
  윤정례: { sentToday: true, lastSentMin: 130, lastReplyMin: 210, noReplyDays: 0, callMissed: 0, opsNote: null },
  배기태: { sentToday: true, lastSentMin: 160, lastReplyMin: 95, noReplyDays: 0, callMissed: 0, opsNote: null },
  손말자: { sentToday: true, lastSentMin: 1440 + 200, lastReplyMin: 185, noReplyDays: 0, callMissed: 0, opsNote: "복약 상담 이력 · 약 재구매는 보호자 승인 필요" },
  전옥희: { sentToday: false, lastSentMin: 1440 + 20, lastReplyMin: 100, noReplyDays: 0, callMissed: 0, opsNote: null },
  한동식: { sentToday: true, lastSentMin: 140, lastReplyMin: 60, noReplyDays: 0, callMissed: 0, opsNote: null },
  김복남: { sentToday: false, lastSentMin: 3 * 1440, lastReplyMin: null, noReplyDays: 0, callMissed: 0, exclude: "입원 중 — 병원 소통 대행 (관제 제외 처리)", opsNote: "요양병원 · 간호사 전달사항 관제 경유" },
  이순례: { sentToday: false, lastSentMin: 1440 + 30, lastReplyMin: 1440 + 10, noReplyDays: 1, callMissed: 0, opsNote: "9/20 첫 방문 · 앱 사용 안내 완료" },
};

// 받은 음성 (미처리 우선 목록의 씨앗). memo 는 들은 뒤 적는 청취 메모 — 안 들었으면 null.
// in-t5 는 어르신 마음사서함(lib/mock.js TEACHER_INBOX t5)과 같은 메시지다.
export const INBOX_SEED = [
  { id: "in-t5", client: "김순자", minsAgo: 20, secs: 36, status: "unheard", memo: null, mirror: "t5" },
  { id: "in-son", client: "손말자", minsAgo: 185, secs: 22, status: "needReply", memo: "약이 떨어졌다고 하심 · 재구매는 보호자 승인 뒤" },
  { id: "in-jeon", client: "전옥희", minsAgo: 100, secs: 18, status: "unheard", memo: null },
  { id: "in-yun", client: "윤정례", minsAgo: 210, secs: 41, status: "unheard", memo: null },
];

// 고객별 대화기록 씨앗. 김순자는 어르신 마음사서함(TEACHER_INBOX)을 거울처럼 본다 —
// 어르신의 '받은 것'이 내 '보낸 것'이고, 어르신의 '보낸 것'이 내 '받은 것'이다.
const KIM_MEMOS = { t2: "무릎이 불편하다는 말씀 · 방문 때 살펴보기" };
const OTHER_THREADS = {
  손말자: [
    { id: "th-son-1", dir: "out", minsAgo: 1440 + 200, secs: 19, text: "안부인사 · 어제 비 오는데 무릎은 괜찮으세요" },
    { id: "th-son-2", dir: "in", minsAgo: 185, secs: 22, text: KIM_MEMOS.none ?? "약이 떨어졌다고 하심 · 재구매는 보호자 승인 뒤", inboxId: "in-son" },
  ],
  윤정례: [
    { id: "th-yun-1", dir: "in", minsAgo: 210, secs: 41, text: null, inboxId: "in-yun" },
    { id: "th-yun-2", dir: "out", minsAgo: 130, secs: 24, text: "안부인사 · 오늘은 바람이 차니 겉옷 챙기세요" },
  ],
  전옥희: [
    { id: "th-jeon-1", dir: "out", minsAgo: 1440 + 20, secs: 21, text: "방문안내 · 15일 방문 잘 받으셨는지" },
    { id: "th-jeon-2", dir: "in", minsAgo: 100, secs: 18, text: null, inboxId: "in-jeon" },
  ],
  오태식: [
    { id: "th-oh-1", dir: "out", minsAgo: 3 * 1440 + 30, secs: 20, text: "안부인사 · 검진 전날 금식 안내" },
    { id: "th-oh-2", dir: "out", minsAgo: 2 * 1440 + 60, secs: 18, text: "병원일정 · 22일 09:00 KMI 검진 모시러 갑니다" },
  ],
  안병철: [
    { id: "th-ahn-1", dir: "out", minsAgo: 1440 + 120, secs: 23, text: "복약확인 · 저녁 약 드셨는지" },
    { id: "th-ahn-2", dir: "in", minsAgo: 1440 + 90, secs: 12, text: "드셨다고 짧게 답하심", heard: true },
  ],
  정말순: [{ id: "th-jeong-1", dir: "out", minsAgo: 150, secs: 26, text: "방문안내 · 오늘 11:40 면회 가요 · 따님 영상 가져갑니다" }],
  배기태: [
    { id: "th-bae-1", dir: "out", minsAgo: 160, secs: 17, text: "안부인사" },
    { id: "th-bae-2", dir: "in", minsAgo: 95, secs: 14, text: "잘 지낸다 · 다음 주 등산 간다고 하심", heard: true },
  ],
  한동식: [
    { id: "th-han-1", dir: "out", minsAgo: 140, secs: 15, text: "복약확인 · 혈압약 아침 복용" },
    { id: "th-han-2", dir: "in", minsAgo: 60, secs: 9, text: "복용 완료 · 특이사항 없음", heard: true },
  ],
  이순례: [{ id: "th-lee-1", dir: "out", minsAgo: 1440 + 30, secs: 28, text: "안부인사 · 첫 방문 뒤 앱 잘 되시는지" }],
  김복남: [{ id: "th-kbn-1", dir: "out", minsAgo: 3 * 1440, secs: 20, text: "안부인사 · 병실에서 잘 지내시는지" }],
  박영자: [],
};

export function threadSeed(name, now) {
  if (name === "김순자") {
    return TEACHER_INBOX.map((m) => ({
      id: `th-${m.id}`,
      dir: m.dir === "in" ? "out" : "in",
      at: now - m.minsAgo * MIN,
      secs: m.durationSec,
      text: m.dir === "in" ? m.text : KIM_MEMOS[m.id] ?? null,
      inboxId: m.id === "t5" ? "in-t5" : null,
      heard: m.dir === "out" && m.id !== "t5",
    }));
  }
  return (OTHER_THREADS[name] || []).map((m) => ({ ...m, at: now - m.minsAgo * MIN }));
}

// ── 시각 표기 ──
export function whenLabel(at, now = Date.now()) {
  const d = new Date(at);
  const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const today = new Date(now);
  const dayDiff = Math.round((new Date(today.getFullYear(), today.getMonth(), today.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
  if (dayDiff === 0) return `오늘 ${hm}`;
  if (dayDiff === 1) return `어제 ${hm}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${hm}`;
}
export function agoLabel(mins) {
  if (mins == null) return "이력 없음";
  if (mins < 1) return "방금";
  if (mins < 60) return `${Math.round(mins)}분 전`;
  if (mins < 1440) return `${Math.floor(mins / 60)}시간 전`;
  return `${Math.floor(mins / 1440)}일 전`;
}
export function fmtSecs(s) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// 소통 끊김 판정 (명세 4절 · 무감지 대응정책과 연결)
//  alert: 2일 이상 답장 없음 또는 통화 2회 이상 미연결 → '확인 필요' 강조
//  opsNeeded: 3일 이상 모든 소통이 끊김 → 관제 확인 필요로 자동 전환
export function commState(c) {
  if (c.opsSentAt) return "ops";
  if (c.noReplyDays >= 3) return "opsNeeded";
  if (c.noReplyDays >= 2 || c.callMissed >= 2) return "alert";
  return null;
}

// ── 화면 상태 훅 — 페이지가 들고 탭·하단 배지가 같이 본다 ──
export function useMailbox() {
  const [inbox, setInbox] = useState(() => INBOX_SEED.map((m) => ({ ...m })));
  const [sent, setSent] = useState({}); // { 이름: { at, secs, category, title, status: sending|sent|failed, tries, shareGuardian } }
  const [opsSent, setOpsSent] = useState({}); // { 이름: at }
  const [extra, setExtra] = useState({}); // { 이름: [대화기록에 덧붙은 메시지] }
  // 청취 메모 — 오늘 받은 것은 inbox 에, 지난 대화기록의 메시지는 여기에 붙는다
  // (미처리 목록에서 이미 내려간 메시지에도 메모를 적을 수 있어야 한다)
  const [threadMemo, setThreadMemo] = useState({}); // { 메시지id: 메모 }
  const [heardExtra, setHeardExtra] = useState({}); // 지난 메시지를 다시 들은 표시
  const [now, setNow] = useState(() => Date.now());
  const timers = useRef({});
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    const pending = timers.current; // 정리 시점에 ref 가 바뀌어 있을 수 있어 지금 값을 잡아 둔다
    return () => {
      clearInterval(t);
      Object.values(pending).forEach(clearTimeout);
    };
  }, []);

  const clients = useMemo(
    () =>
      MY_CLIENTS.map((c) => {
        const seed = CLIENT_SEED[c.name] || {};
        const s = sent[c.name];
        const open = inbox.filter((m) => m.client === c.name && OPEN_INBOX.has(m.status));
        const doneToday = !!seed.sentToday || s?.status === "sent";
        const excluded = !!seed.exclude;
        const row = { ...c, ...seed, sent: s, open, doneToday, excluded, unsent: !doneToday && !excluded, opsSentAt: opsSent[c.name] || null };
        row.comm = commState(row);
        return row;
      }),
    [inbox, sent, opsSent]
  );

  const counts = useMemo(() => {
    const target = clients.filter((c) => !c.excluded);
    return {
      total: clients.length,
      target: target.length,
      excluded: clients.length - target.length,
      done: target.filter((c) => c.doneToday).length,
      needReply: inbox.filter((m) => OPEN_INBOX.has(m.status)).length,
      unsent: target.filter((c) => c.unsent).length,
      failed: clients.filter((c) => c.sent?.status === "failed").length,
    };
  }, [clients, inbox]);

  const openInbox = useMemo(() => {
    const rank = { needReply: 0, unheard: 1, heard: 2 };
    return inbox
      .filter((m) => OPEN_INBOX.has(m.status))
      .map((m) => ({ ...m, at: now - m.minsAgo * MIN }))
      .sort((a, b) => rank[a.status] - rank[b.status] || a.minsAgo - b.minsAgo);
  }, [inbox, now]);

  const unsentList = useMemo(
    () => clients.filter((c) => c.unsent).sort((a, b) => (b.noReplyDays - a.noReplyDays) || (b.callMissed - a.callMissed)),
    [clients]
  );
  const alerts = useMemo(() => clients.filter((c) => c.comm === "alert" || c.comm === "opsNeeded"), [clients]);

  // 청취 — 미청취 → 답장 필요 (명세 자동처리 규칙). 메모는 들은 뒤 따로 적는다.
  const hear = useCallback((id) => setInbox((xs) => xs.map((m) => (m.id === id && m.status === "unheard" ? { ...m, status: "needReply" } : m))), []);
  const setMemo = useCallback((id, memo) => {
    setInbox((xs) => (xs.some((m) => m.id === id) ? xs.map((m) => (m.id === id ? { ...m, memo } : m)) : xs));
    setThreadMemo((t) => ({ ...t, [id]: memo }));
  }, []);
  const complete = useCallback((id) => setInbox((xs) => xs.map((m) => (m.id === id ? { ...m, status: "done" } : m))), []);
  const toOps = useCallback((name, inboxId) => {
    const at = Date.now();
    setOpsSent((o) => ({ ...o, [name]: at }));
    if (inboxId) setInbox((xs) => xs.map((m) => (m.id === inboxId ? { ...m, status: "ops" } : m)));
    return at;
  }, []);

  // 발송 — 서버 확인이 온 뒤에만 '완료'. 첫 시도가 실패하는 고객은 두 번째에 붙는다.
  const send = useCallback(
    (name, payload, onResult) => {
      const at = Date.now();
      const prevTries = sent[name]?.tries || 0;
      setSent((s) => ({ ...s, [name]: { ...payload, at, status: "sending", tries: prevTries + 1 } }));
      clearTimeout(timers.current[name]);
      timers.current[name] = setTimeout(() => {
        const fail = !!CLIENT_SEED[name]?.sendFail && prevTries === 0;
        setSent((s) => ({ ...s, [name]: { ...s[name], status: fail ? "failed" : "sent" } }));
        if (!fail) {
          setExtra((e) => ({ ...e, [name]: [...(e[name] || []), { id: `th-sent-${at}`, dir: "out", at, secs: payload.secs, text: payload.title, mine: true }] }));
          // 받은 메시지에 답한 것 — 그 고객의 미처리 건은 '답장 완료'
          setInbox((xs) => xs.map((m) => (m.client === name && OPEN_INBOX.has(m.status) ? { ...m, status: "replied" } : m)));
        }
        onResult?.(fail ? "failed" : "sent");
      }, 1200);
    },
    [sent]
  );

  const threadFor = useCallback(
    (name) => {
      const base = threadSeed(name, now).map((m) => {
        const ib = m.inboxId ? inbox.find((x) => x.id === m.inboxId) : null;
        const withInbox = ib ? { ...m, text: ib.memo ?? m.text, status: ib.status, heard: ib.status !== "unheard" } : m;
        const heard = withInbox.heard || !!heardExtra[m.id] || !!heardExtra[m.inboxId];
        const memo = threadMemo[m.inboxId] ?? threadMemo[m.id];
        return { ...withInbox, heard, ...(memo === undefined ? null : { text: memo }) };
      });
      return [...base, ...(extra[name] || [])].sort((a, b) => a.at - b.at);
    },
    [inbox, extra, threadMemo, heardExtra, now]
  );

  // 들은 것으로 표시 — 오늘 받은 것은 미청취 → 답장 필요로 옮기고, 지난 메시지는 표시만 바꾼다
  const hearAny = useCallback(
    (id) => {
      hear(id);
      setHeardExtra((h) => ({ ...h, [id]: true }));
    },
    [hear]
  );

  return { now, clients, counts, openInbox, unsentList, alerts, sent, opsSent, hear: hearAny, setMemo, complete, toOps, send, threadFor };
}
