// 선택 방문 상세 — 2인 1조 · GPS 체크인 · 21항목(몸·마음·집 / 병실) · 후속조치 · 완료 5단계.
// 상태 흐름: 예정 → 진행(체크인) → 완료(검수 대기) → 관제 검수 → 보호자 리포트 발송 → 열람.
// 21항목은 lib/checkup.js 의 항목 그대로 — 점수·진단명을 쓰지 않고 완료/대기만 기록한다.
import { useState } from "react";
import { Panel, Pill, Stamp, Bar, Btn, Steps, Field, KV, Drawer, Confirm, Note, TONE } from "../ui";
import Icon from "../../icons";
import { checkupFor } from "../../../lib/checkup";
import { SERVICE_MENU } from "../../../lib/requests";
import { VISIT_STATE, VISIT_STEPS, requiredFor, visitPill, stampNow } from "../../../lib/ops-mgmt";

const AXIS_TONE = { green: "ok", gold: "gold", navy: "navy" };
const REVIEW_TONE = { "검수 완료": "ok", "검수 대기": "warn", "수행 중": "info" };
const VIEW_TONE = { "열람 완료": "ok", 미열람: "warn" };
const SERVICES = SERVICE_MENU.filter((s) => s.active);
const clock = () => stampNow().slice(11);
const TITLES = { start: "방문을 시작합니다", complete: "점검을 완료하고 보고서를 작성합니다", approve: "관제 검수를 승인합니다", send: "보호자에게 리포트를 발송합니다" };
const LABELS = { start: "체크인", complete: "점검 완료", approve: "검수 승인", send: "발송" };

function Tile({ title, right, children }) {
  return (
    <div className="rounded-xl bg-navy/[.04] px-3.5 py-3">
      <div className="flex items-center justify-between text-[11px] font-bold text-muted">
        <span>{title}</span>
        {right}
      </div>
      <div className="mt-1 text-[13px] text-ink">{children}</div>
    </div>
  );
}

export default function VisitDetail({ visit: v, onChange, openProfile }) {
  const [showAll, setShowAll] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [svcOpen, setSvcOpen] = useState(false);
  const [svcName, setSvcName] = useState(SERVICES[0].name);
  const [fu, setFu] = useState("");
  const [msg, setMsg] = useState("");

  const axes = checkupFor(v.loc);
  const required = requiredFor(v.loc);
  const total = v.keys.length;
  const done = total - v.pending.length;
  const missing = required.filter((k) => v.pending.includes(k));
  const editable = v.status === "active";
  const pk = visitPill(v);
  const svc = SERVICES.find((s) => s.name === svcName) || SERVICES[0];

  const toggle = (k) => onChange({ pending: v.pending.includes(k) ? v.pending.filter((x) => x !== k) : [...v.pending, k] });
  const addFollow = (item) => onChange({ followups: [...v.followups, { ...item, at: clock() }], followup: true });
  const run = () => {
    const at = clock();
    if (confirm === "start") onChange({ status: "active", checkin: { at, gps: "GPS 확인 · 고객 주소 반경 확인 중" }, stepIdx: 1, review: "수행 중" });
    if (confirm === "complete") onChange({ status: "done", stepIdx: 3, review: "검수 대기", completedAt: at });
    if (confirm === "approve") onChange({ review: "검수 완료", stepIdx: 4, reviewedAt: at });
    if (confirm === "send") onChange({ stepIdx: 5, viewed: "미열람", sentAt: at });
    setConfirm(null);
  };
  const BODIES = {
    start: `${v.name} 님 주소 반경에서 GPS 체크인을 기록합니다. 주 ${v.pair.pri.name} · 부 ${v.pair.sub.name}.`,
    complete: `${done}/${total} 항목 점검 · 후속조치 ${v.followups.length}건. 완료 후에는 점검 내용을 바꿀 수 없고 관제 검수로 넘어갑니다.`,
    approve: "검수 승인 후 보호자 리포트 발송 단계로 넘어갑니다. 반려하려면 취소하고 상담·관제메모에 사유를 남기세요.",
    send: "발송 후에는 회수할 수 없습니다. 리포트에는 관찰 사실만 담기고 진단·판단은 들어가지 않습니다.",
  };

  const subs = [
    v.checkin ? `GPS 체크인 ${v.checkin.at}` : "GPS 체크인 전",
    `${done}/${total} 점검${v.status === "done" && v.pending.length ? ` · 선택 ${v.pending.length}개 미점검` : ""}`,
    "고객(또는 동석 보호자) 확인",
    `관제 검수 · ${v.review}`,
    v.stepIdx === 5 ? `보호자 ${v.viewed}${v.sentAt ? ` · 발송 ${v.sentAt}` : ""}` : "보고서 발송 전",
  ];
  const steps = VISIT_STEPS.map((title, i) => ({ k: title, title, sub: subs[i], state: i < v.stepIdx ? "done" : i === v.stepIdx ? "active" : "wait" }));

  return (
    <Panel className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-[17px] font-bold text-navy">{v.name} 고객 방문</h2>
        <Pill tone={VISIT_STATE[pk].tone}>{VISIT_STATE[pk].label}{pk !== "followup" && v.followup ? " · 후속" : ""}</Pill>
        <span className="font-num text-[12px] text-muted">{v.time}–{v.end}</span>
        <span className="text-[12px] text-muted">· {v.addr}</span>
        <span className="ml-auto flex gap-2">
          {openProfile && <Btn small ghost onClick={() => openProfile(v.name)}>고객 상세</Btn>}
          {v.status === "planned" && <Btn small onClick={() => setConfirm("start")}>방문 시작 · GPS 체크인</Btn>}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
        <span>방문 주기 <b className="text-ink">{v.cycle}</b></span>
        <span>다음 방문일 <b className="font-num text-ink">{v.nextDate}</b></span>
        <span className="inline-flex items-center gap-1">일정 <Pill tone={v.confirmed ? "ok" : "warn"}>{v.confirmed ? "확정" : "확정 전"}</Pill></span>
        <span className="inline-flex items-center gap-1">보호자 통보 <Pill tone={v.notified ? "ok" : "warn"}>{v.notified ? "통보 완료" : "통보 전"}</Pill></span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Tile title="방문 담당 · 2인 1조">
          <div className="font-bold text-navy">
            {v.pair.pri.name} <span className="text-[11px] font-semibold text-muted">주</span> · {v.pair.sub.name} <span className="text-[11px] font-semibold text-muted">부</span>
          </div>
          <div className="mt-0.5 font-num text-[11px] text-muted">{v.team} | 연락 {v.pair.pri.tel} · {v.pair.sub.tel}</div>
        </Tile>
        <Tile title="현장 체크인">
          {v.checkin ? (
            <>
              <div className="font-num font-bold text-navy">{v.checkin.at} <span className="text-[12px] font-semibold text-green">GPS 확인</span></div>
              <div className="mt-0.5 text-[11px] text-muted">{v.checkin.gps} · <Stamp at={v.checkin.at} prefix="위치 수신" /></div>
            </>
          ) : (
            <span className="text-muted">체크인 전 — 방문 시작 시 GPS 로 고객 주소 반경을 확인합니다</span>
          )}
        </Tile>
        <Tile title="점검 진행률" right={<span className="font-num text-[13px] font-bold text-navy">{done} / {total}</span>}>
          <Bar value={done} max={total} tone={done === total ? "ok" : "gold"} />
          <div className="mt-1 font-num text-[11px] text-muted">{Math.round((done / total) * 100)}% 완료{missing.length ? ` · 필수 ${missing.length}개 남음` : ""}</div>
        </Tile>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[15px] font-bold text-navy">21가지 방문 점검</h3>
          <span className="text-[11px] font-bold text-gold">필수(*) 항목 누락 시 방문 완료 불가</span>
          <span className="text-[11px] text-muted">· {v.loc === "hospital" ? "요양병원용 — 몸 7 · 마음 7 · 병실 7" : "자택 — 몸 7 · 마음 7 · 집 7"}</span>
          <Btn small ghost className="ml-auto" onClick={() => setShowAll((s) => !s)}>{showAll ? "간략히" : "전체 항목 보기"}</Btn>
        </div>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {axes.map((a) => {
            const t = TONE[AXIS_TONE[a.tone]];
            const items = showAll ? a.items : a.items.slice(0, 5);
            const dn = a.items.filter((i) => !v.pending.includes(i.k)).length;
            return (
              <div key={a.axis} className="rounded-xl p-3" style={{ background: t.bg }}>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-navy"><Icon name={a.icon} size={14} />{a.axis}</span>
                  <span className="font-num text-[12px] font-bold" style={{ color: t.fg }}>{dn}/{a.items.length}</span>
                </div>
                <div className="mt-1.5"><Bar value={dn} max={a.items.length} tone={AXIS_TONE[a.tone]} height={4} /></div>
                <ul className="mt-2 space-y-0.5">
                  {items.map((i) => {
                    const ok = !v.pending.includes(i.k);
                    const req = required.includes(i.k);
                    return (
                      <li key={i.k}>
                        <button type="button" onClick={() => toggle(i.k)} disabled={!editable} aria-pressed={ok} title={`${i.w} — ${i.why}`} className="btn-press btn-inline flex w-full items-center justify-between gap-2 rounded-md px-1.5 py-1 text-left text-[12px]">
                          <span className="min-w-0 truncate text-ink">{i.k}{req && <span className="ml-0.5 font-bold text-gold" aria-label="필수">*</span>}</span>
                          <Pill tone={ok ? "ok" : "muted"}>{ok ? "완료" : "대기"}</Pill>
                        </button>
                      </li>
                    );
                  })}
                  {!showAll && a.items.length > 5 && <li className="px-1.5 text-[11px] text-muted">+ {a.items.length - 5}개 항목</li>}
                </ul>
              </div>
            );
          })}
        </div>
        {editable && <div className="mt-1.5 text-[11px] text-muted">항목을 누르면 완료·대기가 바뀝니다. 기록은 관찰 사실만 — 점수·진단명을 쓰지 않습니다.</div>}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-navy/[.08] p-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-bold text-navy">사진 및 메모</h3>
            <span className="inline-flex items-center gap-2 text-[12px] text-muted">
              <Icon name="film" size={14} /> <span className="font-num">{v.photos}</span>장
              {editable && <Btn small ghost onClick={() => onChange({ photos: v.photos + 1 })}>사진 추가</Btn>}
            </span>
          </div>
          <div className="mt-2">
            <Field id={`memo-${v.id}`} label="현장 메모 (본 것과 들은 말 그대로)" type="textarea" value={v.memo} onChange={(m) => onChange({ memo: m })} placeholder='예) 복약 달력 빈칸 2회 · 본인은 "먹었다"고 하심' disabled={v.status === "planned"} />
          </div>
        </div>
        <div className="rounded-xl border border-navy/[.08] p-3">
          <h3 className="text-[13px] font-bold text-navy">이전 방문 대비 변화</h3>
          {v.changes.length ? (
            <ul className="mt-2 space-y-1 text-[12px] text-ink">
              {v.changes.map((c) => (
                <li key={c} className="flex gap-1.5"><Icon name="trend" size={13} className="mt-0.5 shrink-0 text-gold" />{c}</li>
              ))}
            </ul>
          ) : (
            <div className="mt-2 text-[12px] text-muted">점검을 진행하면 지난 방문 기록과 같은 항목을 나란히 보여줍니다.</div>
          )}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl p-3" style={{ background: TONE.warn.bg }}>
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-bold" style={{ color: TONE.warn.fg }}>즉시 조치 필요사항</h3>
            <span className="font-num text-[11px] text-muted">{v.followups.length}건</span>
          </div>
          <ul className="mt-2 space-y-1.5">
            {v.followups.length === 0 && <li className="text-[12px] text-muted">등록된 후속조치가 없습니다.</li>}
            {v.followups.map((f, i) => (
              <li key={`${f.text}-${i}`} className="flex flex-wrap items-center gap-1.5 text-[12px] text-ink">
                <Pill tone={f.kind === "service" ? "gold" : "warn"}>{f.kind === "service" ? "해주세요 전환" : "조치 필요"}</Pill>
                <span className="min-w-0 flex-1">{f.text}</span>
                {f.at && <Stamp at={f.at} prefix="등록" />}
              </li>
            ))}
          </ul>
          {v.status !== "planned" && (
            <div className="mt-2 flex gap-2">
              <input id={`fu-${v.id}`} aria-label="후속조치 내용" value={fu} onChange={(e) => setFu(e.target.value)} placeholder="조치 필요사항 입력" className="card-glass min-w-0 flex-1 rounded-[10px] px-3 py-2 text-[13px] text-navy outline-none focus:ring-1 focus:ring-gold" />
              <Btn small tone="warn" disabled={!fu.trim()} onClick={() => { addFollow({ text: fu.trim(), kind: "immediate" }); setFu(""); }}>조치 등록</Btn>
            </div>
          )}
        </div>
        <div className="rounded-xl bg-navy/[.04] p-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-bold text-navy">고객 요청 '해주세요'</h3>
            {v.status !== "planned" && <Btn small ghost tone="gold" onClick={() => setSvcOpen(true)}>해주세요 서비스 전환</Btn>}
          </div>
          <div className="mt-2 text-[12px] text-ink">
            {v.request ? <>{v.request.text} <Pill tone="ok">{v.request.state}</Pill></> : <span className="text-muted">현장에서 발견한 일 중 우리가 직접 못 하는 것은 해주세요 서비스로 넘깁니다 — 가격은 서비스 메뉴 그대로, 보호자 결제 승인 후 진행.</span>}
          </div>
          {v.followups.filter((f) => f.kind === "service").map((f, i) => (
            <div key={`${f.text}-${i}`} className="mt-1.5 flex items-center gap-1 text-[12px] text-ink"><Icon name="repeat" size={12} className="text-gold" />{f.service?.name} · <span className="text-muted">{f.service?.priceLabel}</span></div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[15px] font-bold text-navy">방문 완료 및 결과보고</h3>
        <div className="mt-3"><Steps steps={steps} /></div>
        {missing.length > 0 && editable && <div className="mt-2"><Note tone="warn">필수 항목 {missing.length}개 미점검 — {missing.join(" · ")}. 필수 항목을 모두 점검해야 완료할 수 있습니다.</Note></div>}
        <div className="mt-3 flex flex-wrap gap-2">
          {editable && (
            <>
              <Btn ghost onClick={() => setMsg(`임시 저장 ${stampNow()} · 새로고침 후에도 입력내용이 유지됩니다`)}>임시 저장</Btn>
              <Btn ghost tone="info" onClick={() => { onChange({ interimAt: clock() }); setMsg(`보호자 중간 알림 발송 ${stampNow()} · 점검 ${done}/${total} · 발송 상태는 보호자 관리 연락이력에서 확인`); }}>보호자에게 중간 알림</Btn>
              <Btn className="ml-auto" disabled={missing.length > 0} onClick={() => setConfirm("complete")} title={missing.length ? "필수 항목 누락 — 완료 불가" : undefined}>점검 완료 및 보고서 작성</Btn>
            </>
          )}
          {v.status === "done" && v.review === "검수 대기" && <Btn className="ml-auto" tone="info" onClick={() => setConfirm("approve")}>관제 검수 승인</Btn>}
          {v.status === "done" && v.review === "검수 완료" && v.stepIdx < 5 && <Btn className="ml-auto" onClick={() => setConfirm("send")}>보호자 리포트 발송</Btn>}
          {v.status === "done" && v.stepIdx === 5 && v.viewed === "미열람" && <Btn className="ml-auto" ghost tone="warn" onClick={() => setMsg(`보호자 미열람 재알림 발송 ${stampNow()}`)}>미열람 재알림</Btn>}
        </div>
        {msg && <div className="mt-2"><Note tone="ok">{msg}</Note></div>}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted">
          <span className="inline-flex items-center gap-1">관제 검수 <Pill tone={REVIEW_TONE[v.review] || "muted"}>{v.review}</Pill>{v.reviewedAt && <Stamp at={v.reviewedAt} prefix="검수" />}</span>
          <span className="inline-flex items-center gap-1">보호자 열람 <Pill tone={VIEW_TONE[v.viewed] || "muted"}>{v.viewed}</Pill>{v.sentAt && <Stamp at={v.sentAt} prefix="발송" />}</span>
          {v.interimAt && <Stamp at={v.interimAt} prefix="중간 알림" />}
          {v.completedAt && <Stamp at={v.completedAt} prefix="점검 완료" />}
        </div>
      </div>

      <Drawer
        open={svcOpen}
        onClose={() => setSvcOpen(false)}
        title="해주세요 서비스 전환"
        sub={`${v.name} 님 · 현장 발견 → 유료 서비스 요청`}
        footer={
          <div className="flex justify-end gap-2">
            <Btn ghost tone="muted" onClick={() => setSvcOpen(false)}>취소</Btn>
            <Btn tone="gold" onClick={() => { addFollow({ text: `${svc.name} 전환 요청 · 보호자 결제 승인 대기`, kind: "service", service: svc }); setSvcOpen(false); }}>전환 요청</Btn>
          </div>
        }
      >
        <div className="space-y-3">
          <Field id="svc-name" label="서비스" value={svcName} onChange={setSvcName} options={SERVICES.map((s) => s.name)} />
          <KV k="가격" v={svc.priceLabel} />
          <KV k="범위" v={svc.scope} />
          {svc.point && <KV k="특징" v={svc.point} />}
          <Note>보호자 결제 승인 후 담당자가 배정됩니다. 진행 상태는 해주세요 관리에서 이어집니다.</Note>
        </div>
      </Drawer>

      <Confirm open={Boolean(confirm)} onCancel={() => setConfirm(null)} onConfirm={run} title={TITLES[confirm] || ""} body={BODIES[confirm] || ""} confirmLabel={LABELS[confirm] || "실행"} />
    </Panel>
  );
}
