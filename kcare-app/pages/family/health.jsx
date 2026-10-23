import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { Btn, EvenGrid, Sheet, SheetTitle, TONE, WhiteBtn } from "../../components/ds";
import { PRIORITY_PRESETS, WEATHER_FACTORS } from "../../lib/mock";
import { useAppState } from "../../lib/state";
import { useGuardianRole } from "../../lib/guardian-role";
import { honorific, subjectLabel, trackOf } from "../../lib/tracks";
import { healthOf } from "../../lib/meds";

// 마이 › 건강 (2026-10-15 디자인 시안 '어머니 건강') — 질환 · 알레르기 · 드시는 약 · 먼저 볼 날씨.
// 건강 정보는 어르신 앱 · 관제 · SOS 신고 정보와 같은 한 벌이다 (lib/meds.js healthOf).
// 보호자는 보기만 한다 — 고치는 것은 첫 안심방문 때 약봉투를 본 컨시어지와 관제다. 약이 바뀌면 '약이 바뀌었어요'로 알린다.
// 먼저 볼 날씨 — REQ-01: 자동 추론이 아니라 사람이 설정한다 (설정 주체 · 시각 기록). 주 보호자만 바꾼다.
const PINK = { bg: "#F6E3EC", fg: "#8A3A62" };
const SLOT_LOOK = (slot) => (["저녁", "자기 전"].includes(slot) ? { background: TONE.blue.bg, color: TONE.blue.fg } : { background: TONE.beige.bg, color: TONE.beige.fg });

export default function HealthPage() {
  const { state, dispatch } = useAppState();
  const ob = state.onboarding;
  const subj = subjectLabel(trackOf(ob?.track), ob);
  const honor = honorific(ob);
  const { isPrimary } = useGuardianRole(); // 로그인한 가구는 계정 기준 (lib/guardian-role.js)
  const health = healthOf(state);
  const [settingOpen, setSettingOpen] = useState(false);

  // 약 이름별로 묶는다 — '혈압약 1정 · 아침 · 저녁' (lib/meds.js medSummary 와 같은 묶음)
  const drugs = [];
  for (const d of health.meds) {
    for (const i of d.items) {
      let row = drugs.find((x) => x.name === i.name);
      if (!row) drugs.push((row = { name: i.name, dose: i.dose, slots: [] }));
      if (!row.slots.includes(d.slot)) row.slots.push(d.slot);
    }
  }
  const who = health.custom && health.at ? `${new Date(health.at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })} 수정${health.by ? ` · ${health.by}` : ""}` : "첫 방문 때 등록";

  return (
    <>
      <Head>
        <title>{subj} 건강 — K-CARE</title>
      </Head>
      <FamilyLayout back="/family/my" backLabel="마이로 돌아가기" sub="마이" title={`${subj} 건강`}>
        <div className="ds-gcard ds-r" style={{ "--d": "40ms", background: PINK.bg }}>
          <h2 className="ds-lab m-0" style={{ color: PINK.fg }}>
            질환
          </h2>
          {health.conditions.length ? (
            <EvenGrid labels={health.conditions}>
              {health.conditions.map((c) => (
                <span key={c} className="ds-gchip" style={{ color: PINK.fg }}>
                  {c}
                </span>
              ))}
            </EvenGrid>
          ) : (
            <p className="text-[16px] font-bold" style={{ color: PINK.fg }}>
              등록 없음
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="ds-lab" style={{ color: PINK.fg }}>
              알레르기
            </span>
            <span className="text-right text-[15px] font-bold" style={{ color: "#5E3A4E" }}>
              {health.allergies.length ? health.allergies.join(" · ") : "등록 없음"}
            </span>
          </div>
        </div>

        <div className="ds-gcard ds-r" style={{ "--d": "80ms", background: TONE.purple.bg }}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="ds-lab m-0" style={{ color: TONE.purple.fg }}>
              드시는 약 {drugs.length}가지
            </h2>
            <span className="text-[13px] font-bold" style={{ color: TONE.purple.sub }}>
              {who}
            </span>
          </div>
          {drugs.length ? (
            <div>
              {drugs.map((m) => (
                <div key={m.name} className="ds-row">
                  <span className="ds-k">
                    <b>{m.name}</b>
                    {m.dose && <small>{m.dose}</small>}
                  </span>
                  <span className="flex flex-none flex-wrap justify-end gap-1">
                    {m.slots.map((s) => (
                      <span key={s} className="rounded-full px-2.5 py-1 text-[13px] font-extrabold" style={SLOT_LOOK(s)}>
                        {s}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[15px] leading-[1.6]" style={{ color: TONE.purple.sub }}>
              아직 등록된 약이 없어요. 첫 안심방문 때 컨시어지가 약봉투를 보고 등록합니다.
            </p>
          )}
          <Link
            href="/family/requests?ask=med"
            className="ds-press ds-btn3d ds-btn flex items-center justify-center text-white"
            style={{ background: TONE.purple.title, boxShadow: `0 4px 0 ${TONE.purple.fg}` }}
          >
            약이 바뀌었어요
          </Link>
          <p className="text-[13px] leading-[1.6]" style={{ color: TONE.purple.sub }}>
            담당 컨시어지 · 관제가 고치면 {honor} 복약 알림도 같이 바뀝니다.
          </p>
        </div>

        <div className="ds-gcard ds-r" style={{ "--d": "120ms", background: TONE.blue.bg }}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="ds-lab m-0" style={{ color: TONE.blue.fg }}>
              먼저 볼 날씨
            </h2>
            <span className="text-[13px] font-bold" style={{ color: TONE.blue.sub }}>
              {state.priority.source}
            </span>
          </div>
          <EvenGrid labels={state.priority.factors}>
            {state.priority.factors.map((f) => (
              <span key={f} className="ds-gchip" style={{ color: "#1B2340" }}>
                {f}
              </span>
            ))}
          </EvenGrid>
          <p className="text-[14px] leading-[1.6]" style={{ color: "#4A5068" }}>
            고른 날씨가 {honor} 화면 &lsquo;지금 우리 동네&rsquo;에 먼저 보입니다. 병력에 맞춰 사람이 직접 고르며, 건강정보로 자동 추천하지 않습니다.
          </p>
          <div className="ds-src">날씨 · 케이웨더</div>
          {isPrimary ? (
            <WhiteBtn h={54} sh={TONE.blue.sh} color={TONE.blue.fg} className="text-[17px]" onClick={() => setSettingOpen(true)}>
              바꾸기
            </WhiteBtn>
          ) : (
            <p className="rounded-[14px] bg-white px-3 py-2.5 text-[14px] font-bold" style={{ color: "#5E6270" }}>
              설정 변경은 주 보호자만 할 수 있습니다
            </p>
          )}
        </div>

        {settingOpen && (
          <PrioritySheet
            honor={honor}
            current={state.priority}
            onClose={() => setSettingOpen(false)}
            onSave={(factors) => {
              dispatch({ type: "setPriority", payload: { factors, source: `보호자 설정${ob?.rel ? ` · ${ob.rel}` : ""}` } });
              dispatch({ type: "pushEvent", payload: { kind: "설정", text: `우선 날씨 요소 변경 · ${factors.join(" · ")}`, color: "#8FA9CC" } });
              setSettingOpen(false);
            }}
          />
        )}
      </FamilyLayout>
    </>
  );
}

// 먼저 볼 날씨 설정 — 병력 프리셋 또는 직접 선택
function PrioritySheet({ current, onClose, onSave, honor }) {
  const [factors, setFactors] = useState(current.factors);
  const toggle = (f) => setFactors((fs) => (fs.includes(f) ? fs.filter((x) => x !== f) : [...fs, f]));
  return (
    <Sheet onClose={onClose} label="먼저 볼 날씨 설정">
      <SheetTitle sub="건강" title="먼저 볼 날씨" />
      <p className="text-[14px] leading-[1.6]" style={{ color: "#5E6270" }}>
        {honor} 병력에 맞는 날씨를 먼저 보여 드립니다. 누가 언제 정했는지 기록됩니다.
      </p>
      <div role="group" aria-label="병력 프리셋" className="flex flex-col gap-2">
        <div className="text-[15px] font-extrabold">병력에 맞춰 고르기</div>
        {PRIORITY_PRESETS.map((p) => {
          const on = JSON.stringify(factors) === JSON.stringify(p.factors);
          return (
            <button
              key={p.label}
              type="button"
              aria-pressed={on}
              onClick={() => setFactors(p.factors)}
              className="ds-press rounded-[18px] p-3 text-left"
              style={on ? { background: TONE.blue.bg, boxShadow: "inset 0 0 0 2.5px #1B2340" } : { background: "#FFFFFF", boxShadow: "0 3px 0 #E3DED3" }}
            >
              <span className="block text-[16px] font-extrabold">{p.label}</span>
              <span className="mt-0.5 block text-[13px]" style={{ color: "#5E6270" }}>
                {p.hint}
              </span>
            </button>
          );
        })}
      </div>
      <div role="group" aria-label="직접 고르기" className="flex flex-col gap-2">
        <div className="text-[15px] font-extrabold">직접 고르기</div>
        <EvenGrid labels={WEATHER_FACTORS} gap={6}>
          {WEATHER_FACTORS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={factors.includes(f)}
              onClick={() => toggle(f)}
              className="ds-press min-h-[40px] rounded-full px-3.5 text-[14px] font-extrabold"
              style={factors.includes(f) ? { background: "#1B2340", color: "#FFFFFF" } : { background: "#FFFFFF", color: "#3A3F50", boxShadow: "inset 0 0 0 1.5px #E3DED3" }}
            >
              {f}
            </button>
          ))}
        </EvenGrid>
      </div>
      <div className="flex gap-2">
        <WhiteBtn className="flex-1 text-[16px]" onClick={onClose}>
          닫기
        </WhiteBtn>
        <Btn tone="navy" h={56} className="flex-[2] text-[16px] disabled:opacity-50" disabled={factors.length === 0} onClick={() => onSave(factors)}>
          저장
        </Btn>
      </div>
    </Sheet>
  );
}
