// SOS 콘솔 오른쪽 열 — 고객 핵심정보 · 보호자 연락 · 현장 출동 추천 · 119 전달용 요약 (시안 SOS 긴급대응 센터).
import { Btn, FeedPill, KV, Panel, PanelHead, Pill, Stamp, TONE } from "../ui";
import { getCustomer, getHealth } from "../../../lib/ops-health";
import { fmtLocal, fmtTime } from "../../../lib/ops-time";
import { build119, consciousness, summary119Text } from "./helpers";
import { DispatchForm } from "./StepForms";

const RANK = { 주: "1순위", 부: "2순위", 비상: "3순위" };
const STEP_OF_ROLE = { 주: "guardian1", 부: "guardian2", 비상: "guardian2" };

export default function SidePanels({ inc, now, api, role }) {
  const c = getCustomer(inc.customer);
  const h = getHealth(inc.customer);
  const ro = role !== "controller";
  const rows119 = build119(inc, c, h);
  const stamp = (f) => (now ? fmtTime(now - (f?.agoSec ?? 0) * 1000) : "—");
  const guardianState = (g) => {
    const rec = inc.steps?.[STEP_OF_ROLE[g.role]];
    if (!rec) return { label: "대기", tone: "muted" };
    if (rec.result === "connected") return { label: "연결", tone: "ok" };
    if (rec.result === "noanswer") return { label: "미연결", tone: "warn" };
    if (rec.result === "refused" || rec.result === "unavailable") return { label: rec.result === "refused" ? "거절" : "통화불가", tone: "warn" };
    if (rec.tries?.length) return { label: `시도 ${rec.tries.length}회`, tone: "info" };
    return { label: "대기", tone: "muted" };
  };
  const logGuardian = (g, ch) => api.setStep(inc.id, STEP_OF_ROLE[g.role], { try: { result: "dialing", note: `${ch} · ${g.name}` } }, { advance: false });
  return (
    <div className="space-y-4">
      <Panel>
        <PanelHead title="고객 핵심정보" />
        <div className="mt-1">
          <KV k="현재 위치" v={<span>{h.location.v} <FeedPill feed={h.location.feed} /></span>} />
          <KV k="마지막 수신" v={<Stamp at={stamp(h.lastRx)} prefix="" />} mono />
          <KV k="자택 주소" v={c.address} />
          <KV k="주요 질환" v={c.conditions.join(" · ")} />
          <KV k="복용약" v={c.meds.join(" · ")} />
          <KV k="알레르기" v={c.allergies.join(" · ")} />
          <KV k="의식·통화" v={consciousness(inc)} />
          <KV k="출입 동의" v={c.consent.entry} />
          <KV k="출입 정보" v={c.consent.door} />
          <KV k="담당 컨시어지" v={`주 ${c.concierge.main} · 부 ${c.concierge.sub}`} />
        </div>
      </Panel>

      <Panel>
        <PanelHead title="보호자 연락" sub="전화·알림 버튼은 시도 횟수와 시각을 자동 기록" />
        {c.guardians.length === 0 ? (
          <div className="mt-2 text-[13px] text-muted">등록된 보호자가 없습니다 — 등록 확인 필요.</div>
        ) : (
          <ul className="mt-2 divide-y divide-navy/[.06]">
            {c.guardians.map((g) => {
              const st = guardianState(g);
              return (
                <li key={g.name} className="py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex flex-wrap items-center gap-1.5 text-[13px]">
                      <Pill tone="ok">{RANK[g.role] || g.role}</Pill>
                      <span className="font-bold text-navy">{g.name}</span>
                      <span className="text-muted">{g.rel} · {g.role} 보호자</span>
                    </span>
                    <Pill tone={st.tone}>{st.label}</Pill>
                  </div>
                  <div className="mt-0.5 text-[12px] text-muted">
                    {g.place}{g.tz ? ` · 현지시각 ${fmtLocal(now, g.tz)}` : ""} · {g.phone}{g.note ? ` · ${g.note}` : ""}
                  </div>
                  <div className="mt-1.5 flex gap-1.5">
                    <Btn small tone="navy" disabled={ro} onClick={() => logGuardian(g, "전화")}>전화</Btn>
                    <Btn ghost small tone="navy" disabled={ro} onClick={() => logGuardian(g, "앱 알림")}>앱 알림</Btn>
                    <Btn ghost small tone="navy" disabled={ro} onClick={() => logGuardian(g, "문자")}>문자</Btn>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel>
        <PanelHead title="현장 출동 추천" sub={`${c.district} 기준 가까운 순 · 파견은 관제사 승인 후 실행`} />
        <div className="mt-2"><DispatchForm inc={inc} c={c} api={api} ro={ro} compact /></div>
      </Panel>

      <Panel style={{ background: TONE.gold.bg, boxShadow: `inset 0 0 0 1px ${TONE.gold.bar}66` }}>
        <PanelHead
          title={<span style={{ color: TONE.gold.fg }}>119 전달용 요약</span>}
          right={<Btn ghost small tone="gold" onClick={() => { try { navigator.clipboard?.writeText(summary119Text(rows119)); } catch { /* 권한 없음 */ } }}>복사</Btn>}
        />
        <div className="mt-1">{rows119.map(([k, v]) => <KV key={k} k={k} v={v} />)}</div>
      </Panel>
    </div>
  );
}
