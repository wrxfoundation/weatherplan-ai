// 단계별 대응 기록 폼 — 요청서 6-3 · 6-4 · 6-5.
// 전화·알림 버튼은 시도 횟수와 시각을 자동 기록하고, 결과를 저장하면 다음 단계가 열린다.
// 조회 전용 권한은 모든 실행 버튼이 잠긴다.
import { useState } from "react";
import { Btn, Confirm, Empty, Field, KV, Pill, Toggle, TONE } from "../ui";
import { CALL_RESULTS } from "../../../lib/ops-sos";
import { dispatchCandidates, getCustomer, getHealth } from "../../../lib/ops-health";
import { fmtClock, fmtTime } from "../../../lib/ops-time";
import { build119, guardianOf, summary119Text } from "./helpers";
import { CloseForm, ReportView } from "./CloseReport";

const RESULT_LABELS = Object.values(CALL_RESULTS);
const keyOf = (label) => Object.keys(CALL_RESULTS).find((k) => CALL_RESULTS[k] === label) || "noanswer";

function copyText(text) {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(text);
  } catch {
    /* 클립보드 권한이 없으면 화면의 텍스트를 직접 복사한다 */
  }
}

function Tries({ tries }) {
  if (!tries?.length) return <span className="text-[12px] text-muted">아직 시도 없음</span>;
  return (
    <span className="font-num text-[12px] text-muted">
      시도 {tries.length}회 · 마지막 {fmtTime(tries[tries.length - 1].at)}
    </span>
  );
}

// 어르신 전화 · 보호자 연락 공용 — withRequest 는 보호자 요청사항 칸
function ContactForm({ inc, stepKey, rec, api, ro, target, channels, withRequest, allowSkip, nextDefault }) {
  const [result, setResult] = useState("미연결");
  const [answer, setAnswer] = useState("");
  const [request, setRequest] = useState("");
  const [next, setNext] = useState(nextDefault || "");
  const [memo, setMemo] = useState("");
  const id = `${inc.id}-${stepKey}`;
  const logTry = (ch) => api.setStep(inc.id, stepKey, { try: { result: "dialing", note: `${ch} · ${target}` } }, { advance: false });
  return (
    <div className="card-glass rounded-xl p-3">
      <div className="flex flex-wrap items-center gap-2">
        {channels.map((ch) => (
          <Btn key={ch} small tone={ch === "전화 걸기" ? "danger" : "navy"} disabled={ro} onClick={() => logTry(ch)}>{ch}</Btn>
        ))}
        <span className="text-[12px] text-ink">{target}</span>
        <Tries tries={rec.tries} />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Field id={`${id}-result`} label="결과" value={result} onChange={setResult} options={RESULT_LABELS} disabled={ro} required />
        <Field id={`${id}-answer`} label="상대방 답변" value={answer} onChange={setAnswer} placeholder="예: 어지러워 누워 있다고 함" disabled={ro} />
        {withRequest && <Field id={`${id}-request`} label="보호자 요청사항" value={request} onChange={setRequest} placeholder="예: 119 부르지 말고 먼저 컨시어지 방문 요청" disabled={ro} />}
        <Field id={`${id}-next`} label="다음 조치" value={next} onChange={setNext} disabled={ro} />
        <Field id={`${id}-memo`} label="관제사 메모" value={memo} onChange={setMemo} type="textarea" disabled={ro} />
      </div>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        {allowSkip && <Btn ghost small tone="muted" disabled={ro} onClick={() => api.setStep(inc.id, stepKey, { result: "skip", memo: memo || "해당 없음" })}>건너뛰기</Btn>}
        <Btn small disabled={ro} onClick={() => api.setStep(inc.id, stepKey, { result: keyOf(result), answer, request, next, memo })}>결과 저장 · 다음 단계</Btn>
      </div>
    </div>
  );
}

function ConfirmForm({ inc, api, ro }) {
  const [memo, setMemo] = useState(inc.steps?.confirm?.memo || "");
  return (
    <div className="card-glass rounded-xl p-3">
      <Field id={`${inc.id}-confirm-memo`} label="확인 내용 (관제사 메모)" value={memo} onChange={setMemo} type="textarea" placeholder="수치·위치·기기 상태를 확인한 내용" disabled={ro} />
      <div className="mt-3 flex justify-end gap-2">
        <Btn small disabled={ro} onClick={() => api.setStep(inc.id, "confirm", { result: "done", memo })}>이상징후 확인 완료 · 1차 전화로</Btn>
      </div>
    </div>
  );
}

function NoticeForm({ inc, c, api, ro }) {
  const [targets, setTargets] = useState({ 주보호자: true, 부보호자: !!guardianOf(c, "부"), 컨시어지: true });
  const [text, setText] = useState(`${c.name} 어르신 ${inc.cause} 확인 중입니다. 본인 통화가 연결되지 않아 119 신고 및 컨시어지 현장 방문을 진행할 예정입니다.`);
  const chosen = Object.keys(targets).filter((k) => targets[k]);
  return (
    <div className="card-glass rounded-xl p-3">
      <fieldset className="flex flex-wrap gap-3">
        <legend className="text-[11px] font-bold text-muted">통보 대상</legend>
        {Object.keys(targets).map((k) => (
          <label key={k} htmlFor={`${inc.id}-notice-${k}`} className="flex items-center gap-1.5 text-[13px] text-ink">
            <input id={`${inc.id}-notice-${k}`} type="checkbox" checked={targets[k]} disabled={ro} onChange={(e) => setTargets({ ...targets, [k]: e.target.checked })} />
            {k}
          </label>
        ))}
      </fieldset>
      <div className="mt-2"><Field id={`${inc.id}-notice-text`} label="통보 내용" value={text} onChange={setText} type="textarea" disabled={ro} /></div>
      <div className="mt-3 flex justify-end gap-2">
        <Btn small disabled={ro || chosen.length === 0} onClick={() => api.setStep(inc.id, "notice", { try: { result: "sent", note: `앱 푸시·문자 → ${chosen.join("·")}` }, result: "done", answer: `발송 대상 ${chosen.join("·")}`, memo: text })}>
          조치 예정 통보 발송
        </Btn>
      </div>
    </div>
  );
}

const AGENCIES = ["서울종합방재센터 119", "강동소방서", "강남소방서", "송파소방서", "서초소방서"];
const TRANSFER_OPTS = ["미정", "이송", "현장 처치 후 미이송"];

function Report119Form({ inc, c, api, ro }) {
  const rows = build119(inc, c, getHealth(inc.customer));
  const [f, setF] = useState({ at: fmtTime(Date.now()), reporter: inc.controller || "김태영", caseNo: "", agency: AGENCIES[0], content: `${c.name}(${c.age}세) ${inc.cause} · ${inc.value} · 본인 통화 미연결`, eta: "", arrivedAt: "", transferred: "미정", hospital: "", request: "" });
  const set = (k) => (v) => setF({ ...f, [k]: v });
  const id = `${inc.id}-119`;
  return (
    <div className="space-y-3">
      <div className="rounded-xl p-3" style={{ background: TONE.gold.bg, boxShadow: `inset 0 0 0 1px ${TONE.gold.bar}55` }}>
        <div className="flex items-center justify-between gap-2">
          <h5 className="text-[13px] font-bold" style={{ color: TONE.gold.fg }}>119 전달용 요약 — 신고 전 한 화면에서 읽기</h5>
          <Btn ghost small tone="gold" onClick={() => copyText(summary119Text(rows))}>요약 복사</Btn>
        </div>
        <div className="mt-1">{rows.map(([k, v]) => <KV key={k} k={k} v={v} />)}</div>
      </div>
      <div className="card-glass rounded-xl p-3">
        <h5 className="text-[13px] font-bold text-navy">신고 후 기록</h5>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Field id={`${id}-at`} label="신고 시각" value={f.at} onChange={set("at")} disabled={ro} required />
          <Field id={`${id}-reporter`} label="신고자" value={f.reporter} onChange={set("reporter")} disabled={ro} required />
          <Field id={`${id}-caseNo`} label="신고 접수번호" value={f.caseNo} onChange={set("caseNo")} placeholder="접수 후 안내받은 번호" disabled={ro} />
          <Field id={`${id}-agency`} label="출동기관" value={f.agency} onChange={set("agency")} options={AGENCIES} disabled={ro} />
          <div className="sm:col-span-2"><Field id={`${id}-content`} label="신고내용" value={f.content} onChange={set("content")} type="textarea" disabled={ro} /></div>
          <Field id={`${id}-eta`} label="예상 도착시간" value={f.eta} onChange={set("eta")} placeholder="예: 8분" disabled={ro} />
          <Field id={`${id}-arrived`} label="실제 도착시간" value={f.arrivedAt} onChange={set("arrivedAt")} placeholder="도착 후 입력" hint="도착·이송 항목은 나중에 이 단계에서 다시 입력할 수 있습니다" disabled={ro} />
          <Field id={`${id}-transfer`} label="이송 여부" value={f.transferred} onChange={set("transferred")} options={TRANSFER_OPTS} disabled={ro} />
          <Field id={`${id}-hospital`} label="이송 병원" value={f.hospital} onChange={set("hospital")} disabled={ro} />
          <div className="sm:col-span-2"><Field id={`${id}-request`} label="구급대 요청사항" value={f.request} onChange={set("request")} placeholder="예: 복용약 봉투 준비, 보호자 연락처 전달" disabled={ro} /></div>
        </div>
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <Btn ghost small tone="muted" disabled={ro} onClick={() => api.setStep(inc.id, "call119", { result: "skip", memo: "119 신고 불필요 판단 (보호자·본인 확인)" })}>신고 불필요 — 건너뛰기</Btn>
          <Btn small tone="danger" disabled={ro} onClick={() => api.setStep(inc.id, "call119", { try: { result: "reported", note: f.agency }, result: "done", report: f, memo: f.content })}>119 신고 기록 저장</Btn>
        </div>
      </div>
    </div>
  );
}

// 6-5 파견 — 가장 가까운 출동 가능 인원을 먼저 보이되 실제 파견은 Confirm 을 거친다
export function DispatchForm({ inc, c, api, ro, compact = false }) {
  const cands = dispatchCandidates(c.district);
  const [two, setTwo] = useState({});
  const [pick, setPick] = useState(null);
  const done = inc.steps?.dispatch?.dispatch;
  if (done) {
    return (
      <div className="card-glass rounded-xl p-3 text-[13px] text-ink">
        <span className="font-bold text-navy">{done.name}</span> {done.two ? "2인" : "1인"} 출동 지시 {fmtClock(done.orderedAt)} · 예상 도착 {done.etaMin}분 · 거리 {done.distKm}km
        <div className="mt-1 text-[12px] text-muted">수락 {done.acceptedAt ? fmtClock(done.acceptedAt) : "대기"} · 출발 {done.departedAt ? fmtClock(done.departedAt) : "대기"} · 도착 {done.arrivedAt ? fmtClock(done.arrivedAt) : "대기"}</div>
      </div>
    );
  }
  const list = compact ? cands.slice(0, 3) : cands;
  return (
    <div className="space-y-2">
      {list.map((k, i) => (
        <div key={k.name} className="card-glass flex flex-wrap items-center gap-2 rounded-xl px-3 py-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
              <span className="font-bold text-navy">{k.name}</span>
              <span className="text-muted">{k.role}</span>
              {i === 0 && k.emergency && <Pill tone="gold">자동 추천 · 최근접</Pill>}
              <Pill tone={k.emergency ? "ok" : "muted"}>{k.emergency ? "긴급출동 가능" : "긴급출동 불가"}</Pill>
              {k.car && <Pill tone="info">차량</Pill>}
            </div>
            <div className="mt-0.5 text-[12px] text-muted">{k.where} · <span className="font-num">{k.distKm}km · 예상 도착 {k.etaMin}분</span></div>
          </div>
          {!compact && (
            <label htmlFor={`${inc.id}-two-${k.name}`} className="text-[12px] text-muted">
              <span className="sr-only">출동 인원</span>
              <select id={`${inc.id}-two-${k.name}`} value={two[k.name] ? "2인" : "1인"} disabled={ro || !k.two} onChange={(e) => setTwo({ ...two, [k.name]: e.target.value === "2인" })} className="card-glass rounded-lg px-2 py-1 text-[12px] font-bold text-navy">
                <option>1인</option>
                {k.two && <option>2인</option>}
              </select>
            </label>
          )}
          <Btn small tone={k.emergency ? "navy" : "muted"} disabled={ro || !k.emergency} onClick={() => setPick(k)}>파견</Btn>
        </div>
      ))}
      <Confirm
        open={!!pick}
        title={`${pick?.name} 컨시어지를 현장에 파견합니다`}
        body={pick ? `${c.name} 어르신 자택(${c.district})까지 ${pick.distKm}km · 예상 ${pick.etaMin}분 · ${two[pick.name] ? "2인" : "1인"} 출동. 파견 지시 시각이 기록되고 컨시어지 앱으로 지시가 전송됩니다.` : ""}
        confirmLabel="파견 지시"
        tone="danger"
        onCancel={() => setPick(null)}
        onConfirm={() => {
          api.setStep(inc.id, "dispatch", { result: "done", dispatch: { name: pick.name, two: !!two[pick.name], orderedAt: Date.now(), acceptedAt: null, departedAt: null, arrivedAt: null, actions: "", accompany: false, etaMin: pick.etaMin, distKm: pick.distKm } });
          setPick(null);
        }}
      />
    </div>
  );
}

function ArriveForm({ inc, api, ro }) {
  const d = inc.steps?.dispatch?.dispatch;
  const [actions, setActions] = useState(d?.actions || "");
  const [accompany, setAccompany] = useState(!!d?.accompany);
  if (!d) {
    return (
      <div className="card-glass rounded-xl p-3">
        <Empty>파견 기록이 없습니다 — 컨시어지 출동 없이 진행 중인 사건입니다.</Empty>
        <div className="mt-2 flex justify-end"><Btn ghost small tone="muted" disabled={ro} onClick={() => api.setStep(inc.id, "arrive", { result: "skip", memo: "현장 파견 없음" })}>해당 없음 — 건너뛰기</Btn></div>
      </div>
    );
  }
  const stamp = (k) => api.setStep(inc.id, "dispatch", { dispatch: { ...d, [k]: Date.now() } }, { advance: false });
  return (
    <div className="card-glass rounded-xl p-3">
      <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
        <span className="font-bold text-navy">{d.name}</span>
        <Btn ghost small disabled={ro || !!d.acceptedAt} onClick={() => stamp("acceptedAt")}>{d.acceptedAt ? `수락 ${fmtClock(d.acceptedAt)}` : "수락 시각 기록"}</Btn>
        <Btn ghost small disabled={ro || !!d.departedAt} onClick={() => stamp("departedAt")}>{d.departedAt ? `출발 ${fmtClock(d.departedAt)}` : "출발 시각 기록"}</Btn>
        <Btn small disabled={ro || !!d.arrivedAt} onClick={() => stamp("arrivedAt")}>{d.arrivedAt ? `도착 ${fmtClock(d.arrivedAt)}` : "현장 도착 기록"}</Btn>
      </div>
      <div className="mt-3"><Field id={`${inc.id}-arrive-actions`} label="현장 조치내용" value={actions} onChange={setActions} type="textarea" placeholder="예: 의식 확인 · 낙상 부위 확인 · 구급대 인계" disabled={ro} /></div>
      <div className="mt-2 flex items-center gap-2 text-[13px] text-ink">
        <Toggle id={`${inc.id}-arrive-accompany`} on={accompany} onChange={setAccompany} label="병원 동행 여부" />
        병원 동행 {accompany ? "예" : "아니오"}
      </div>
      <div className="mt-3 flex justify-end">
        <Btn small disabled={ro || !d.arrivedAt} title={!d.arrivedAt ? "현장 도착을 먼저 기록합니다" : undefined} onClick={() => {
          api.setStep(inc.id, "dispatch", { dispatch: { ...d, actions, accompany } }, { advance: false });
          api.setStep(inc.id, "arrive", { result: "done", memo: `현장 조치: ${actions || "기록 없음"} · 병원 동행 ${accompany ? "예" : "아니오"}` });
        }}>도착·조치 저장</Btn>
      </div>
    </div>
  );
}

const TRANSFER_TYPES = ["병원 이송 (119)", "병원 동행 (컨시어지)", "보호자 인계", "현장 종결 — 이송 없음"];
function TransferForm({ inc, c, api, ro }) {
  const [type, setType] = useState(TRANSFER_TYPES[0]);
  const [hospital, setHospital] = useState(inc.steps?.call119?.report?.hospital || "");
  const guardians = c.guardians.map((g) => `${g.name} (${g.rel})`);
  const [guardian, setGuardian] = useState(guardians[0] || "");
  const [memo, setMemo] = useState("");
  return (
    <div className="card-glass rounded-xl p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Field id={`${inc.id}-tr-type`} label="처리 방식" value={type} onChange={setType} options={TRANSFER_TYPES} disabled={ro} required />
        {type.startsWith("병원") && <Field id={`${inc.id}-tr-hospital`} label="이송·동행 병원" value={hospital} onChange={setHospital} disabled={ro} />}
        {type === "보호자 인계" && <Field id={`${inc.id}-tr-guardian`} label="인계 보호자" value={guardian} onChange={setGuardian} options={guardians.length ? guardians : ["등록 보호자 없음"]} disabled={ro} />}
        <div className="sm:col-span-2"><Field id={`${inc.id}-tr-memo`} label="관제사 메모" value={memo} onChange={setMemo} type="textarea" disabled={ro} /></div>
      </div>
      <div className="mt-3 flex justify-end">
        <Btn small disabled={ro} onClick={() => {
          const r119 = inc.steps?.call119?.report;
          if (r119 && type.startsWith("병원 이송")) api.setStep(inc.id, "call119", { report: { ...r119, transferred: "이송", hospital } }, { advance: false });
          api.setStep(inc.id, "transfer", { result: "done", answer: type, memo: [type.startsWith("병원") && hospital && `병원 ${hospital}`, type === "보호자 인계" && guardian, memo].filter(Boolean).join(" · ") });
        }}>처리 결과 저장 · 종료 단계로</Btn>
      </div>
    </div>
  );
}

export default function StepForm({ inc, stepKey, api, role }) {
  const c = getCustomer(inc.customer);
  const rec = inc.steps?.[stepKey] || {};
  const ro = role !== "controller";
  const main = guardianOf(c, "주");
  const sub = guardianOf(c, "부");
  const common = { inc, api, ro };
  switch (stepKey) {
    case "confirm": return <ConfirmForm {...common} />;
    case "call1": return <ContactForm {...common} stepKey="call1" rec={rec} target={`어르신 ${c.name} ${c.phone}`} channels={["전화 걸기"]} nextDefault="미연결 시 2차 전화" />;
    case "call2": return <ContactForm {...common} stepKey="call2" rec={rec} target={`어르신 ${c.name} ${c.phone}`} channels={["전화 걸기"]} nextDefault="미연결 시 3차 전화 자동 활성" />;
    case "call3": return <ContactForm {...common} stepKey="call3" rec={rec} target={`어르신 ${c.name} ${c.phone}`} channels={["전화 걸기", "워치 알림"]} nextDefault="미연결 시 주 보호자 연락" allowSkip />;
    case "guardian1": return <ContactForm {...common} stepKey="guardian1" rec={rec} target={main ? `주 보호자 ${main.name} (${main.rel} · ${main.place}) ${main.phone}` : "주 보호자 등록 없음"} channels={["전화 걸기", "앱 알림", "문자"]} withRequest nextDefault="부 보호자 연락 · 조치 예정 통보" allowSkip={!main} />;
    case "guardian2": return <ContactForm {...common} stepKey="guardian2" rec={rec} target={sub ? `부 보호자 ${sub.name} (${sub.rel} · ${sub.place}) ${sub.phone}` : "부 보호자 등록 없음"} channels={["전화 걸기", "앱 알림", "문자"]} withRequest nextDefault="조치 예정 통보" allowSkip />;
    case "notice": return <NoticeForm {...common} c={c} />;
    case "call119": return <Report119Form {...common} c={c} />;
    case "dispatch": return <DispatchForm {...common} c={c} />;
    case "arrive": return <ArriveForm {...common} />;
    case "transfer": return <TransferForm {...common} c={c} />;
    case "close": return <CloseForm inc={inc} api={api} role={role} />;
    case "report": return inc.closed ? <ReportView inc={inc} /> : <Empty>사건 종료 후 발생~종료 기록이 시간순으로 자동 정리됩니다.</Empty>;
    default: return null;
  }
}
