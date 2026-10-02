// 커뮤니케이션 — 테스트 가구 1 의 실제 연락 (2026-10-02 현장 요청: "관제랑은 SOS 빼고는 연동이 안 되어 있다").
// 가구 기록에서 바로 읽는다:
//   음성      voices — 보호자 ↔ 어르신 안부 음성, 컨시어지 ↔ 어르신 마음사서함
//   관제 연락  opsMessages — 컨시어지 '관제에 알리기'. 여기서 확인 · 답장하면 컨시어지 화면에 그대로 보인다
//   어르신 부탁 requests(dir fromElder) — 도와줘요 · 말로 부탁. 처리는 해주세요 관리에서
// 화면이 고치는 것은 관제 연락 확인 · 답장뿐이다 — 나머지는 이미 일어난 연락의 기록이다.
import { useMemo, useState } from "react";
import { Panel, PanelHead, Stat, Pill, Btn, Table, Note, Empty } from "./ui";
import { useAppState } from "../../lib/state";
import { STATUS } from "../../lib/requests";
import { ELDER } from "../../lib/mock";

const KST = 9 * 3600 * 1000;
const day = (t) => new Date(t + KST).toISOString().slice(0, 10);
const when = (t) => new Date(t + KST).toISOString().slice(5, 16).replace("T", " ");
const CHANNELS = { voice: { label: "음성", tone: "info" }, ops: { label: "관제 연락", tone: "warn" }, ask: { label: "어르신 부탁", tone: "gold" } };
const VOICE_CONTEXT = { 안부: "안부 음성", 긴급: "긴급 음성", 마음사서함: "마음사서함" };

function rowsOf(state) {
  const played = state.elder?.msgPlayed || {};
  const guardianHeard = state.guardian?.voiceHeard || {};
  const voices = (state.voices || []).map((v) => {
    const toElder = v.to === ELDER.name || v.to === `${ELDER.name} 님`;
    const toGuardian = v.to === "아들 민수" || v.to === "가족 모두";
    return {
      id: `v-${v.id}`,
      at: v.at,
      ch: "voice",
      from: v.from === "컨시어지" ? "컨시어지 박지현" : v.from,
      to: v.to === "컨시어지" ? "컨시어지 박지현" : v.to,
      text: `${VOICE_CONTEXT[v.context] || v.context || "음성"} · ${Number(v.secs) || 0}초${v.title && v.title !== "선생님께 보낸 목소리" ? ` · ${v.title}` : ""}`,
      state: toElder ? (played[v.id] ? "어르신 청취" : "미청취") : toGuardian ? (guardianHeard[v.id] ? "보호자 청취" : "보호자 미청취") : "전달됨",
      tone: (toElder && !played[v.id]) || (toGuardian && !guardianHeard[v.id]) ? "warn" : "ok",
    };
  });
  const ops = (state.opsMessages || []).map((m) => ({
    id: `o-${m.id}`,
    msgId: m.id,
    at: m.at,
    ch: "ops",
    from: m.from,
    to: "관제",
    text: m.text,
    reply: m.reply,
    state: m.ackAt ? `확인 ${when(m.ackAt).slice(6)}` : "확인 전",
    tone: m.ackAt ? "ok" : "warn",
    open: !m.ackAt,
  }));
  const asks = (state.requests || [])
    .filter((r) => r.dir === "fromElder")
    .map((r) => ({
      id: `r-${r.id}`,
      at: r.history?.[0]?.at || 0,
      ch: "ask",
      from: `${ELDER.name} 님`,
      to: "관제",
      text: `${r.type}${r.detail ? ` — ${r.detail}` : ""}`,
      state: STATUS[r.status]?.label || r.status,
      tone: r.status === "requested" ? "warn" : "ok",
    }));
  return [...voices, ...ops, ...asks].sort((a, b) => b.at - a.at);
}

function Reply({ msgId, onAck }) {
  const [text, setText] = useState("");
  return (
    <div className="mt-1.5 flex gap-1.5">
      <input
        aria-label="관제 답장"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="답장 (선택)"
        className="card-glass min-w-0 flex-1 rounded-[8px] px-2.5 py-1.5 text-[12px] text-navy outline-none focus:ring-1 focus:ring-gold"
      />
      <Btn small tone="ok" onClick={() => onAck(msgId, text.trim())}>{text.trim() ? "답장 · 확인" : "확인"}</Btn>
    </div>
  );
}

export default function LiveComms() {
  const { state, dispatch } = useAppState();
  const [ch, setCh] = useState("");
  const rows = useMemo(() => rowsOf(state), [state]);
  const today = day(Date.now());
  const list = rows.filter((r) => !ch || (ch === "open" ? r.open : r.ch === ch));
  const ack = (id, reply) => {
    dispatch({ type: "ackOpsMessage", id, by: "관제", reply });
    const m = (state.opsMessages || []).find((x) => x.id === id);
    dispatch({ type: "pushEvent", payload: { kind: "관제", text: `관제 연락 확인 — ${m?.from || "컨시어지"}${reply ? ` · 답: ${reply}` : ""}`, color: "#8FA9CC" } });
  };
  const stats = [
    ["", "오늘 연락", rows.filter((r) => day(r.at) === today).length, "navy"],
    ["voice", "음성 메시지", rows.filter((r) => r.ch === "voice").length, "info"],
    ["ops", "관제 연락", rows.filter((r) => r.ch === "ops").length, "warn"],
    ["open", "확인 전", rows.filter((r) => r.open).length, "warn"],
    ["ask", "어르신 부탁", rows.filter((r) => r.ch === "ask").length, "gold"],
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {stats.map(([k, label, value, tone]) => (
          <Stat key={label} label={label} value={value} unit="건" tone={tone} active={ch === k && k !== ""} onClick={() => setCh(ch === k ? "" : k)} />
        ))}
      </div>
      <Panel>
        <PanelHead title="통합 이력 — 테스트 가구 1" sub="최근 순 · 보호자 · 어르신 · 컨시어지가 앱에서 주고받은 실제 연락. 관제 연락은 여기서 확인 · 답장합니다" right={<span className="font-num text-[13px] font-bold text-navy">{list.length}건</span>} />
        <div className="mt-3">
          {rows.length === 0 ? (
            <Empty>아직 연락이 없습니다 — 보호자 안부 음성, 어르신 마음사서함, 컨시어지 '관제에 알리기'가 여기에 쌓입니다.</Empty>
          ) : (
            <Table
              dense
              rows={list}
              rowKey={(r) => r.id}
              cols={[
                { k: "at", label: "시각", render: (r) => <span className="whitespace-nowrap font-num text-[12px]">{when(r.at)}</span> },
                { k: "ch", label: "채널", render: (r) => <Pill tone={CHANNELS[r.ch].tone}>{CHANNELS[r.ch].label}</Pill> },
                { k: "who", label: "보낸 사람 → 받는 사람", render: (r) => <span className="whitespace-nowrap text-[12px]"><b className="text-navy">{r.from}</b> → {r.to}</span> },
                {
                  k: "text",
                  label: "내용",
                  render: (r) => (
                    <div className="min-w-[220px] text-[12px] text-ink">
                      {r.text}
                      {r.reply && <div className="mt-0.5 font-bold text-navy">관제 답 — {r.reply}</div>}
                      {r.open && <Reply msgId={r.msgId} onAck={ack} />}
                    </div>
                  ),
                },
                { k: "state", label: "상태", render: (r) => <Pill tone={r.tone}>{r.state}</Pill> },
              ]}
              empty="조건에 맞는 연락이 없습니다."
            />
          )}
        </div>
      </Panel>
      <Note>음성은 길이 · 보낸 사람만 기록합니다 (베타 — 실제 녹음 파일은 저장하지 않음). 어르신 부탁의 처리는 해주세요 관리에서 합니다.</Note>
    </div>
  );
}
