// 경보 임계값 설정 — 요청서 4절 · 시안 "관제기준 설정". ("알람 설정키" 대신 "경보 임계값 설정"으로 표기)
// 전체 기본값과 고객별 개별값을 분리하고, 모든 변경은 사유와 함께 이력에 쌓인다. 기본값 변경은 관리자 승인 후 적용된다.
import { useMemo, useState } from "react";
import { Btn, Confirm, Note, Panel, PanelHead, Pill, Stat, Table, Tabs, Toggle, TONE } from "./ui";
import RuleDrawer from "./Thresholds/RuleDrawer";
import { ALERTS_TODAY, CATEGORIES, CHANNEL_RULES, EXCEPTIONS, EXCEPTION_TOTAL, HISTORY, POLICY, RESPONSE_STEPS, RULES, SAFEGUARDS } from "../../lib/ops-thresholds";
import { CUSTOMERS } from "../../lib/ops-health";
import { fmtDateTime } from "../../lib/ops-time";

const ACCOUNT = "김태영 (관제사)";
const APPROVER = "이수정 (관리자)";

export default function Thresholds() {
  const [rules, setRules] = useState(RULES);
  const [exceptions, setExceptions] = useState(EXCEPTIONS);
  const [history, setHistory] = useState(HISTORY);
  const [guards, setGuards] = useState(Object.fromEntries(SAFEGUARDS.map((g) => [g.k, g.on])));
  const [cat, setCat] = useState("vital");
  const [tab, setTab] = useState("rules");
  const [drawer, setDrawer] = useState(null); // {rule, preset?, exception?}
  const [approve, setApprove] = useState(false);

  const pending = history.filter((h) => h.status === "승인 대기");
  const latest = history.reduce((m, h) => (h.at > m ? h.at : m), "");
  const category = CATEGORIES.find((c) => c.k === cat) || CATEGORIES[0];
  const catRules = useMemo(() => rules.filter((r) => r.cat === cat), [rules, cat]);
  const countOf = (k) => (k === "response" ? CHANNEL_RULES.length : rules.filter((r) => r.cat === k).length);

  // 저장 = 이력 추가 + 규칙 갱신(승인 대기 표시). 개별값은 예외 목록에 쌓인다. 어느 쪽도 이전 값을 지우지 않는다.
  function save({ ruleId, fields, changes, reason, customer }) {
    const now = fmtDateTime(Date.now());
    const rule = rules.find((r) => r.id === ruleId);
    if (customer) {
      const personal = `주의 ${fields.warn} / 위험 ${fields.danger}${fields.duration && fields.duration !== rule.duration ? ` · ${fields.duration}` : ""}`;
      const ex = { id: `ex-${customer}-${ruleId}-${Date.now()}`, customer, age: CUSTOMERS[customer]?.age ?? null, ruleId, ruleName: rule.name, condition: (CUSTOMERS[customer]?.conditions || []).join(" · "), base: `주의 ${rule.warn} / 위험 ${rule.danger}`, personal, reason, by: ACCOUNT, at: now };
      setExceptions([ex, ...exceptions.filter((e) => !(e.customer === customer && e.ruleId === ruleId))]);
      const prev = exceptions.find((e) => e.customer === customer && e.ruleId === ruleId);
      setHistory([{ id: `h-${Date.now()}`, at: now, by: ACCOUNT, target: `${customer} 개별값`, rule: rule.name, field: "개별 기준", before: prev?.personal || `표준 (${rule.warn} / ${rule.danger})`, after: personal, reason, status: "승인 대기" }, ...history]);
    } else {
      setRules(rules.map((r) => (r.id === ruleId ? { ...r, ...fields, pending: true } : r)));
      setHistory([...changes.map((ch, i) => ({ id: `h-${Date.now()}-${i}`, at: now, by: ACCOUNT, target: "전체 기본값", rule: rule.name, field: ch.field, before: ch.before, after: ch.after, reason, status: "승인 대기" })), ...history]);
    }
    setDrawer(null);
  }

  function approveAll() {
    const now = fmtDateTime(Date.now());
    setHistory(history.map((h) => (h.status === "승인 대기" ? { ...h, status: "승인", approvedBy: APPROVER, approvedAt: now } : h)));
    setRules(rules.map((r) => (r.pending ? { ...r, pending: false } : r)));
    setApprove(false);
  }

  const ruleCols = [
    { k: "name", label: "측정항목", render: (r) => <span className="font-bold text-navy">{r.name}{r.pending && <Pill tone="gold" className="ml-1">승인 대기</Pill>}</span> },
    { k: "warn", label: "주의 기준", render: (r) => <span className="rounded-lg px-2 py-0.5 text-[12px] font-bold" style={{ background: TONE.warn.bg, color: TONE.warn.fg }}>{r.warn}</span> },
    { k: "danger", label: "위험 기준", render: (r) => <span className="rounded-lg px-2 py-0.5 text-[12px] font-bold" style={{ background: TONE.danger.bg, color: TONE.danger.fg }}>{r.danger}</span> },
    { k: "duration", label: "지속 조건" },
    { k: "repeat", label: "반복 횟수" },
    { k: "window", label: "적용 시간대" },
    { k: "action", label: "동작 (알림방법)", render: (r) => <span className="text-[12px] font-bold" style={{ color: TONE.info.fg }}>{r.action}</span> },
    { k: "autoSos", label: "자동 SOS", render: (r) => <Pill tone={r.autoSos ? "danger" : "muted"}>{r.autoSos ? "전환" : "—"}</Pill> },
    { k: "on", label: "사용", render: (r) => <Toggle id={`thr-on-${r.id}`} on={r.on} onChange={(v) => setDrawer({ rule: r, preset: { on: v } })} label={`${r.name} 사용 여부`} /> },
    { k: "edit", label: "", w: 64, render: (r) => <Btn ghost small onClick={() => setDrawer({ rule: r })}>편집</Btn> },
  ];

  return (
    <div className="space-y-4">
      <PanelHead
        title="경보 임계값 설정"
        sub="건강·낙상·위치·무감지·장비 상태의 경보 기준과 대응 단계를 설정합니다 · 개별값은 고객별 예외에서"
        right={
          <>
            <Btn ghost small tone="navy" onClick={() => setTab("history")}>변경 이력 {history.length}</Btn>
            <Btn small onClick={() => setDrawer({ rule: catRules[0] || rules[0] })} disabled={cat === "response"}>+ 새 기준 만들기</Btn>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="적용 중 기준" value={rules.filter((r) => r.on).length} unit="개" sub={`전체 ${rules.length}개 중`} tone="ok" />
        <Stat label="개별 예외 고객" value={EXCEPTION_TOTAL + Math.max(0, exceptions.length - EXCEPTIONS.length)} unit="명" sub={`예시 ${exceptions.length}건 표시`} tone="device" onClick={() => setTab("exceptions")} active={tab === "exceptions"} />
        <Stat label="승인 대기" value={pending.length} unit="건" sub="관리자 승인 필요" tone="warn" onClick={() => setTab("history")} active={tab === "history"} />
        <Stat label="오늘 발생 경보" value={ALERTS_TODAY} unit="건" sub="위험 2 · 주의 12 · 기기 5 · 기타" tone="warn" />
        <Stat label="최근 변경" value={latest.slice(5, 10).replace("-", ".")} sub={latest.slice(11)} tone="info" />
      </div>

      <Panel className="flex flex-wrap items-center gap-3">
        <span className="text-[12px] text-muted">적용 정책</span>
        <span className="text-[15px] font-bold text-navy">{POLICY.name} {POLICY.version}</span>
        <Pill tone="ok">{POLICY.state}</Pill>
        <span className="text-[13px] text-ink">{POLICY.scope}</span>
        <span className="text-[12px] text-muted">최근 승인 {POLICY.updatedAt} · {POLICY.updatedBy}</span>
        <span className="flex-1" />
        <Btn ghost small tone="muted" disabled title="버전 비교 연동 대기">다른 버전 비교 (연동 대기)</Btn>
        <Btn small tone="navy" disabled={pending.length === 0} onClick={() => setApprove(true)}>변경사항 저장·승인 {pending.length ? `(${pending.length})` : ""}</Btn>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-3">
          <PanelHead title="관제 항목" sub="기준을 선택하여 편집" />
          <ul className="mt-2 divide-y divide-navy/[.06]">
            {CATEGORIES.map((c) => {
              const on = c.k === cat;
              return (
                <li key={c.k}>
                  <button type="button" aria-pressed={on} onClick={() => { setCat(c.k); setTab("rules"); }} className="btn-press flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left" style={on ? { background: "rgba(176,141,87,.14)", boxShadow: "inset 0 0 0 1.5px #B08D57" } : undefined}>
                    <span className="h-[10px] w-[10px] shrink-0 rounded-full" style={{ background: TONE[c.tone].bar }} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-bold text-navy">{c.label}</span>
                      <span className="block text-[11px] text-muted">{c.sub}</span>
                    </span>
                    <span className="font-num text-[11px] font-bold" style={{ color: TONE[c.tone].fg }}>{countOf(c.k)}{c.k === "response" ? "단계" : "개 규칙"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel className="lg:col-span-9">
          <PanelHead
            title={`${category.label} 경보 기준`}
            sub={cat === "response" ? "위험 경보가 나면 아래 순서로 자동 대응합니다. 채널별 동작은 표에서 조정합니다." : "갤럭시 Fit·센서에서 수신되는 값이 기준을 벗어나면 고객을 강조하고 관제 알림을 생성합니다."}
            right={<Btn ghost small tone="navy" onClick={() => setTab("exceptions")}>고객별 예외 설정</Btn>}
          />
          <Tabs className="mt-3" value={tab} onChange={setTab} tabs={[["rules", "기준값 설정", cat === "response" ? CHANNEL_RULES.length : catRules.length], ["exceptions", "고객별 예외", exceptions.length], ["history", "변경 이력", history.length]]} />

          {tab === "rules" && (
            <div className="mt-3 space-y-5">
              {cat === "response" ? (
                <Table dense cols={[{ k: "name", label: "채널", render: (r) => <span className="font-bold text-navy">{r.name}</span> }, { k: "warn", label: "주의 경보 시" }, { k: "danger", label: "위험 경보 시" }, { k: "note", label: "비고" }]} rows={CHANNEL_RULES} />
              ) : (
                <Table dense cols={ruleCols} rows={catRules} empty="이 항목에 규칙이 없습니다." />
              )}

              <section>
                <h4 className="text-[14px] font-bold text-navy">경보 판정 안전장치</h4>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {SAFEGUARDS.map((g) => (
                    <div key={g.k} className="card-glass flex items-start justify-between gap-2 rounded-xl px-3 py-2.5" style={g.k === "merge" ? { boxShadow: `inset 0 0 0 1px ${TONE.warn.bar}66` } : undefined}>
                      <span className="min-w-0">
                        <span className="block text-[11px] font-bold text-muted">{g.title}</span>
                        <span className="mt-0.5 block text-[13px] font-semibold text-ink">{g.body}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-bold" style={{ color: guards[g.k] ? TONE.ok.fg : TONE.muted.fg }}>
                        <Toggle id={`guard-${g.k}`} on={guards[g.k]} onChange={(v) => setGuards({ ...guards, [g.k]: v })} label={`${g.title} 사용`} />
                        {guards[g.k] ? "사용" : "미사용"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h4 className="text-[14px] font-bold text-navy">위험 경보 발생 시 자동 대응</h4>
                <ol className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-2">
                  {RESPONSE_STEPS.map((s, i) => (
                    <li key={s.n} className="flex items-center gap-1">
                      <span className="flex items-center gap-2">
                        <span className="font-num flex h-[28px] w-[28px] items-center justify-center rounded-full text-[12px] font-bold text-white" style={{ background: TONE[s.tone].bar }}>{s.n}</span>
                        <span>
                          <span className="block text-[13px] font-bold text-navy">{s.title}</span>
                          <span className="block text-[11px]" style={{ color: TONE[s.tone].fg }}>{s.sub}</span>
                        </span>
                      </span>
                      {i < RESPONSE_STEPS.length - 1 && <span className="mx-2 hidden h-px w-6 bg-navy/[.15] sm:block" aria-hidden />}
                    </li>
                  ))}
                </ol>
              </section>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <Note tone="warn">관리자 승인 후 전체 고객에게 적용됩니다. 개별값은 해당 고객에게만 적용됩니다.</Note>
                <span className="text-[12px] text-muted">최근 수정: {history[0]?.by} · {history[0]?.at}</span>
              </div>
            </div>
          )}

          {tab === "exceptions" && (
            <div className="mt-3 space-y-3">
              <Note tone="gold">고령자마다 기저질환과 평상시 수치가 다르므로 고객 개인의 평상시 수치에 맞춘 개별 기준을 적용합니다. 개별값은 전체 기본값과 분리해 저장되며, 기본값이 바뀌어도 개별값은 유지됩니다.</Note>
              <div className="flex justify-end"><Btn small onClick={() => setDrawer({ rule: catRules[0] || rules[0], exception: { customer: "김순자" } })}>+ 개별 기준 추가</Btn></div>
              <Table
                dense
                cols={[
                  { k: "customer", label: "고객", render: (r) => <span className="font-bold text-navy">{r.customer} <span className="font-num text-[11px] font-normal text-muted">{r.age}세</span></span> },
                  { k: "condition", label: "기저질환" },
                  { k: "ruleName", label: "항목" },
                  { k: "base", label: "전체 기본값", render: (r) => <span className="text-muted">{r.base}</span> },
                  { k: "personal", label: "개별값", render: (r) => <span className="font-bold" style={{ color: TONE.gold.fg }}>{r.personal}</span> },
                  { k: "reason", label: "사유" },
                  { k: "by", label: "설정", render: (r) => <span className="text-[12px] text-muted">{r.by}<br />{r.at}</span> },
                  { k: "edit", label: "", w: 64, render: (r) => <Btn ghost small onClick={() => setDrawer({ rule: rules.find((x) => x.id === r.ruleId) || rules[0], exception: r })}>편집</Btn> },
                ]}
                rows={exceptions}
              />
              <div className="text-[12px] text-muted">개별 기준 적용 고객 총 {EXCEPTION_TOTAL + Math.max(0, exceptions.length - EXCEPTIONS.length)}명 — 예시 {exceptions.length}건만 표시. 전체 목록은 어르신 탭에서.</div>
            </div>
          )}

          {tab === "history" && (
            <div className="mt-3">
              <Table
                dense
                cols={[
                  { k: "at", label: "변경일시", w: 130, render: (r) => <span className="font-num text-[12px]">{r.at}</span> },
                  { k: "by", label: "변경 계정" },
                  { k: "target", label: "대상" },
                  { k: "rule", label: "항목" },
                  { k: "field", label: "필드" },
                  { k: "before", label: "변경 전", render: (r) => <span className="text-muted line-through">{r.before}</span> },
                  { k: "after", label: "변경 후", render: (r) => <span className="font-bold text-navy">{r.after}</span> },
                  { k: "reason", label: "변경 사유" },
                  { k: "status", label: "상태", render: (r) => <span><Pill tone={r.status === "승인" ? "ok" : "warn"}>{r.status}</Pill>{r.approvedBy && <span className="block text-[11px] text-muted">{r.approvedBy} · {r.approvedAt}</span>}</span> },
                ]}
                rows={history}
              />
            </div>
          )}
        </Panel>
      </div>

      <Note>건강·센서 데이터는 참고자료이며 의료진의 진단을 대신하지 않습니다. 기준 변경은 변경 전·후 값, 사유, 계정, 일시가 감사기록으로 남습니다.</Note>

      <RuleDrawer open={!!drawer} rule={drawer?.rule} preset={drawer?.preset} exception={drawer?.exception} onClose={() => setDrawer(null)} onSave={save} />
      <Confirm
        open={approve}
        title={`변경사항 ${pending.length}건을 승인하고 적용합니다`}
        body={`승인자 ${APPROVER}. 승인 즉시 ${POLICY.scope}에게 적용되며, 이력의 상태가 “승인”으로 바뀝니다. 이전 값은 이력에 그대로 남습니다.`}
        confirmLabel="승인·적용"
        onCancel={() => setApprove(false)}
        onConfirm={approveAll}
      >
        <ul className="mt-3 max-h-[200px] space-y-1 overflow-y-auto text-[12px] text-ink">
          {pending.map((h) => <li key={h.id}>· {h.target} · {h.rule} · {h.field}: <span className="text-muted line-through">{h.before}</span> → <b>{h.after}</b></li>)}
        </ul>
      </Confirm>
    </div>
  );
}
