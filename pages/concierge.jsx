import Head from "next/head";
import { useMemo, useState } from "react";
import { Card, SectionLabel, PrimaryButton, GhostButton, Badge } from "../components/ui";
import { TODAY_ROUTE, OBSERVATION_ITEMS, DIAGNOSIS_WORDS } from "../lib/mock";
import { CONCIERGE_PRESETS } from "../lib/requests";
import { fmtWon } from "../lib/config";
import { useAppState } from "../lib/state";

// 컨시어지 앱 — REQ-09(당일 동선·주소 게이팅) · REQ-10(케어박스) · REQ-11(관찰 리포트)
// + 방문 감사 타임라인(REQ-12 골격: GPS·사진·체크리스트·리포트 자동 연결)
// 절대 규칙: 판매액 지표 없음 · 의료 측정값 입력 없음 · 소견/진단 기재 금지 · 오프라인 우선

export default function ConciergePage() {
  const { state, dispatch } = useAppState();
  const [kitOpen, setKitOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const v = state.visit;

  const fmtT = (t) =>
    new Date(t).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <>
      <Head>
        <title>컨시어지 — K-CARE</title>
      </Head>
      <div className="min-h-screen bg-nav">
        <div className="mx-auto min-h-screen w-full max-w-[430px] space-y-3.5 bg-paper px-4 pb-16 pt-5">
          <header className="flex items-center justify-between px-1">
            <div>
              <div className="font-num text-[10px] font-bold tracking-[.18em] text-gold">
                CONCIERGE
              </div>
              <div className="mt-0.5 text-[19px] font-black text-navy">박지현 · 주 동행</div>
            </div>
            <button
              onClick={() => dispatch({ type: "demo", payload: { offline: !state.demo.offline } })}
              className="btn-press rounded-lg border border-navy/20 px-2.5 py-1.5 text-[11px] font-bold text-muted"
            >
              {state.demo.offline ? "온라인 전환" : "오프라인 시연"}
            </button>
          </header>

          {/* 오프라인 배너 — 로컬 큐 잔여 표시 */}
          {state.demo.offline && (
            <div className="rounded-[14px] border border-amber/30 bg-gradient-to-b from-[#FFF7E8] to-[#FBEFD8] p-3.5">
              <div className="text-[12px] font-bold text-amber">
                오프라인 — 기록은 기기에 저장 중입니다
              </div>
              <p className="mt-1 text-[11px] leading-[1.6] text-[#5A4A22]">
                오늘 일정·체크리스트는 미리 받아 두었습니다. 연결이 돌아오면 대기 중인 기록{" "}
                {v.audit.length}건이 자동 전송됩니다.
              </p>
            </div>
          )}

          {/* 당일 동선 — REQ-09 */}
          <SectionLabel>오늘 동선</SectionLabel>
          {TODAY_ROUTE.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-center gap-2">
                <span className="font-num text-[15px] font-bold text-navy">{a.time}</span>
                <span className="text-[13px] font-bold text-ink">{a.customer}</span>
                <span className="ml-auto">
                  {a.approved ? (
                    <Badge fg="#1E7A5A" bg="rgba(30,122,90,.12)">
                      담당 확정
                    </Badge>
                  ) : (
                    <Badge fg="#8A5D12" bg="rgba(138,93,18,.12)">
                      배정 대기
                    </Badge>
                  )}
                </span>
              </div>
              <div className="mt-1 text-[12px] text-muted">{a.purpose}</div>

              <div className="mt-3 space-y-1.5 border-t border-navy/10 pt-3 text-[12px]">
                <Route k="출발" v={a.origin} />
                {/* 주소 게이팅 — 담당 확정 전에는 행정동까지만 */}
                <Route
                  k="고객"
                  v={
                    a.approved ? (
                      a.address
                    ) : (
                      <span className="text-muted">
                        {a.dong} —{" "}
                        <span className="text-amber">담당 확정 후 상세 주소 표시</span>
                      </span>
                    )
                  }
                />
                {a.hospital && <Route k="병원" v={a.hospital} />}
                {a.approved && (
                  <>
                    <Route k="이동" v={`약 ${a.etaMin}분 · 다음 일정까지 여유 ${a.bufferMin}분`} />
                    <Route k="주차" v={a.parking} />
                    <Route
                      k="승하차"
                      v={
                        <>
                          {a.pickup} ·{" "}
                          <b className={a.wheelchair ? "text-green" : "text-danger"}>
                            휠체어 {a.wheelchair ? "진입 가능" : "진입 불가"}
                          </b>
                        </>
                      }
                    />
                  </>
                )}
              </div>
            </Card>
          ))}

          {/* 방문 수행 — 감사 타임라인 (REQ-12 골격) */}
          <SectionLabel>김순자 님 방문 수행</SectionLabel>
          <Card className="p-4">
            <div className="grid grid-cols-3 gap-2">
              <StepBtn
                done={v.checkedIn}
                label={v.checkedIn ? "체크인 완료" : "GPS 체크인"}
                onClick={() =>
                  !v.checkedIn &&
                  dispatch({
                    type: "audit",
                    patch: { checkedIn: true },
                    event: { kind: "gps", label: "도착 · GPS 체크인 (좌표 기록)" },
                  })
                }
              />
              <StepBtn
                done={v.kitDone}
                disabled={!v.checkedIn}
                label={v.kitDone ? "케어박스 완료" : "케어박스 점검"}
                onClick={() => v.checkedIn && !v.kitDone && setKitOpen(true)}
              />
              <StepBtn
                done={v.reportSent}
                disabled={!v.checkedIn}
                label={v.reportSent ? "리포트 발송됨" : "관찰 리포트"}
                onClick={() => v.checkedIn && !v.reportSent && setReportOpen(true)}
              />
            </div>

            {v.audit.length > 0 && (
              <div className="mt-4 border-t border-navy/10 pt-3">
                <SectionLabel>방문 기록 (자동 연결)</SectionLabel>
                <div className="mt-2 space-y-1.5">
                  {v.audit.map((e, i) => (
                    <div key={i} className="flex items-center gap-2 text-[12px]">
                      <span className="font-num font-bold text-navy">{fmtT(e.at)}</span>
                      <span
                        className="h-[7px] w-[7px] rounded-full"
                        style={{
                          background: { gps: "#1E7A5A", photo: "#B08D57", check: "#3B5C8A", report: "#0A1F3C", request: "#8A5D12" }[e.kind] || "#5C5A54",
                        }}
                      />
                      <span className="flex-1 text-ink">{e.label}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-2.5 text-[10px] leading-[1.6] text-muted">
                  GPS·시간·체크리스트·사진·리포트가 하나의 방문 기록으로 묶여 보관됩니다.
                  {state.demo.offline && " (오프라인 — 연결 복구 시 전송)"}
                </p>
              </div>
            )}
          </Card>

          {/* 해주세요 발신 — 컨시어지→보호자 */}
          <SectionLabel>보호자에게 요청</SectionLabel>
          <Card className="p-4">
            <div className="flex flex-wrap gap-1.5">
              {CONCIERGE_PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    dispatch({
                      type: "addRequest",
                      payload: {
                        id: `rq-${Date.now()}`,
                        dir: "fromConcierge",
                        type: p,
                        detail: "현장 확인 후 등록된 요청입니다. 세부 내용은 방문 기록을 참조해 주세요.",
                        amount: null,
                        preferredDate: null,
                        urgency: "normal",
                        assignee: "박지현",
                        photos: [],
                        status: "requested",
                        history: [{ at: Date.now(), status: "requested", note: "컨시어지 현장 등록" }],
                        proof: null,
                      },
                    });
                    dispatch({
                      type: "audit",
                      event: { kind: "request", label: `보호자 요청 등록 · ${p}` },
                    });
                  }}
                  className="btn-press rounded-full border border-navy/15 px-3 py-1.5 text-[12px] font-bold text-muted"
                >
                  {p}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-[1.6] text-muted">
              등록한 요청은 보호자 &lsquo;해주세요&rsquo; 화면에 상태와 함께 표시됩니다. 성과
              지표에 판매액은 기록되지 않습니다.
            </p>
          </Card>

          {kitOpen && (
            <KitSheet
              items={state.kit}
              onboarding={state.onboarding}
              onClose={() => setKitOpen(false)}
              onDone={({ items, refill, estAmount }) => {
                dispatch({ type: "kitUpdate", items });
                dispatch({
                  type: "audit",
                  patch: { kitDone: true },
                  event: { kind: "photo", label: "케어박스 점검 · 전체사진 촬영" },
                });
                if (refill.length > 0) {
                  dispatch({
                    type: "addRequest",
                    payload: {
                      id: `rq-${Date.now()}`,
                      dir: "fromConcierge",
                      type: "약이 부족합니다",
                      detail: `보충 필요: ${refill.join(", ")}. 고객 요청 시 약국 구매대행으로 진행합니다.`,
                      amount: estAmount,
                      preferredDate: null,
                      urgency: "normal",
                      assignee: "박지현",
                      photos: ["kit-check.jpg"],
                      status: "awaitingPayment",
                      history: [
                        { at: Date.now(), status: "requested", note: "케어박스 점검 중 확인" },
                        { at: Date.now(), status: "confirmed", note: "" },
                        { at: Date.now(), status: "awaitingPayment", note: `예상 금액 ${fmtWon(estAmount)}` },
                      ],
                      proof: null,
                    },
                  });
                  dispatch({
                    type: "audit",
                    event: { kind: "request", label: `보충 승인 요청 · ${refill.length}개 품목` },
                  });
                }
                setKitOpen(false);
              }}
            />
          )}

          {reportOpen && (
            <ReportSheet
              onClose={() => setReportOpen(false)}
              onSend={(summary) => {
                dispatch({
                  type: "audit",
                  patch: { reportSent: true },
                  event: { kind: "report", label: `관찰 리포트 발송 · 특이 ${summary.flagged}건` },
                });
                setReportOpen(false);
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}

function Route({ k, v }) {
  return (
    <div className="flex gap-2">
      <span className="w-[44px] shrink-0 font-bold text-gold">{k}</span>
      <span className="flex-1 text-ink">{v}</span>
    </div>
  );
}

function StepBtn({ done, disabled, label, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn-press min-h-[64px] rounded-xl border p-2 text-[12px] font-bold leading-[1.4] ${
        done
          ? "border-green/30 bg-green/10 text-green"
          : disabled
          ? "border-navy/10 text-muted/40"
          : "border-navy bg-navy text-white"
      }`}
    >
      {done ? "✓ " : ""}
      {label}
    </button>
  );
}

// 케어박스 점검 시트 — REQ-10
// 의약품(isMedicine)은 수량 확인만. 보충은 보호자 승인 → 구매대행.
function KitSheet({ items, onboarding, onClose, onDone }) {
  const [rows, setRows] = useState(items);
  const [photoTaken, setPhotoTaken] = useState(false);

  const refill = useMemo(() => rows.filter((r) => r.low).map((r) => r.name), [rows]);
  const estAmount = refill.length * 9000; // 데모용 추정 단가

  const setQty = (i, d) =>
    setRows((rs) =>
      rs.map((r, j) =>
        j === i ? { ...r, qty: Math.max(0, r.qty + d), low: r.qty + d <= 1 } : r
      )
    );

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[rgba(8,23,45,.45)]">
      <div className="max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-white p-6 pb-8">
        <div className="mx-auto mb-4 h-[4px] w-[38px] rounded-full bg-navy/15" />
        <div className="text-[17px] font-black text-navy">안심케어박스 점검</div>
        <p className="mt-1 text-[11px] leading-[1.6] text-muted">
          품목별 잔여량·유효기간·개봉 여부를 기록합니다. 의약품은{" "}
          <b>수량 확인과 구매대행만</b> — 복약 보조는 직무 범위가 아닙니다.
        </p>

        <button
          onClick={() => setPhotoTaken(true)}
          className={`btn-press mt-4 w-full rounded-xl border py-3 text-[13px] font-bold ${
            photoTaken ? "border-green/30 bg-green/10 text-green" : "border-navy/20 text-navy"
          }`}
        >
          {photoTaken ? "✓ 기존 키트 전체사진 촬영됨 (데모)" : "기존 키트 전체사진 촬영"}
        </button>

        <div className="mt-4 space-y-3">
          {rows.map((r, i) => (
            <div key={r.name} className="rounded-xl border border-navy/10 p-3">
              <div className="flex items-center gap-2">
                <span className="flex-1 text-[13px] font-bold text-ink">
                  {r.name}
                  {r.isMedicine && (
                    <span className="ml-1.5 rounded bg-amber/10 px-1.5 py-[1px] text-[9px] font-bold text-amber">
                      수량 확인만
                    </span>
                  )}
                </span>
                {r.low && (
                  <Badge fg="#C0392B" bg="rgba(192,57,43,.1)">
                    보충 필요
                  </Badge>
                )}
              </div>
              <div className="mt-2 flex items-center gap-3 text-[12px] text-muted">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setQty(i, -1)}
                    className="btn-press h-[30px] w-[30px] rounded-lg border border-navy/15 font-bold"
                  >
                    −
                  </button>
                  <span className="w-[52px] text-center font-num font-bold text-navy">
                    {r.qty}
                    {r.unit}
                  </span>
                  <button
                    onClick={() => setQty(i, 1)}
                    className="btn-press h-[30px] w-[30px] rounded-lg border border-navy/15 font-bold"
                  >
                    +
                  </button>
                </div>
                {r.expiry && <span>유효 {r.expiry}</span>}
                <span>{r.opened ? "개봉" : "미개봉"}</span>
              </div>
            </div>
          ))}
        </div>

        {refill.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber/30 bg-[#FFF7E8] p-3.5 text-[12px] leading-[1.7] text-[#5A4A22]">
            보충 필요 {refill.length}건: {refill.join(", ")}
            <br />
            예상 금액 <b className="font-num">{fmtWon(estAmount)}</b> — 보호자 승인 요청과 함께
            전송됩니다.
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <GhostButton onClick={onClose} className="flex-1">
            닫기
          </GhostButton>
          <PrimaryButton
            className="flex-[2]"
            disabled={!photoTaken}
            onClick={() => onDone({ items: rows, refill, estAmount })}
          >
            점검 완료{refill.length > 0 ? " + 승인 요청 보내기" : ""}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

// 관찰 리포트 시트 — REQ-11. 관찰 사실과 발언 인용만. 진단·소견 금지.
function ReportSheet({ onClose, onSend }) {
  const [flags, setFlags] = useState({});
  const [note, setNote] = useState("");

  const banned = DIAGNOSIS_WORDS.filter((w) => note.includes(w));
  const flagged = Object.values(flags).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[rgba(8,23,45,.45)]">
      <div className="max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-white p-6 pb-8">
        <div className="mx-auto mb-4 h-[4px] w-[38px] rounded-full bg-navy/15" />
        <div className="text-[17px] font-black text-navy">가정환경 · 정서 관찰 리포트</div>
        <p className="mt-1 text-[11px] leading-[1.7] text-muted">
          관찰한 사실과 들은 말만 적어주세요. 판단·진단은 기록하지 않습니다.
          <br />
          좋은 예: &ldquo;지난 방문보다 대화량이 감소했고, &lsquo;아무것도 하기 싫다&rsquo;는
          말을 세 차례 함.&rdquo;
        </p>

        <div className="mt-4 grid grid-cols-2 gap-1.5">
          {OBSERVATION_ITEMS.map((it) => {
            const on = !!flags[it];
            return (
              <button
                key={it}
                onClick={() => setFlags((f) => ({ ...f, [it]: !f[it] }))}
                className={`btn-press rounded-xl border px-2.5 py-2.5 text-left text-[12px] font-bold leading-[1.4] ${
                  on ? "border-amber bg-amber/10 text-amber" : "border-navy/12 text-muted"
                }`}
              >
                {it}
                <span className="mt-0.5 block text-[10px] font-medium">
                  {on ? "특이 관찰" : "양호"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <SectionLabel>관찰 내용 · 직접 발언 인용</SectionLabel>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder='예: 거실에 신문이 쌓여 있음. "요즘 입맛이 없다"고 두 번 말씀하심.'
            className={`mt-2 w-full resize-none rounded-xl border px-3.5 py-3 text-[14px] leading-[1.7] outline-none ${
              banned.length ? "border-danger" : "border-navy/15 focus:border-gold"
            }`}
          />
          {banned.length > 0 && (
            <p className="mt-1.5 rounded-lg bg-danger/8 px-3 py-2 text-[11px] font-bold leading-[1.6] text-danger">
              &lsquo;{banned.join(", ")}&rsquo; — 진단 표현은 기록할 수 없습니다 (의료법
              제17조). 관찰한 사실과 직접 발언 인용으로 바꿔 주세요.
            </p>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <GhostButton onClick={onClose} className="flex-1">
            닫기
          </GhostButton>
          <PrimaryButton
            className="flex-[2]"
            disabled={banned.length > 0 || (!note.trim() && flagged === 0)}
            onClick={() => onSend({ flagged })}
          >
            리포트 발송 (특이 {flagged}건)
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
