import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { payHref } from "../../lib/payments";
import FamilyLayout from "../../components/FamilyLayout";
import { Card, SectionLabel, PrimaryButton, GhostButton, Badge, Collapse } from "../../components/ui";
import { STATUS, GUARDIAN_PRESETS, SERVICE_MENU, SERVICE_PLUS, URGENCY, CANCEL_FREE_DAYS, CLOSED, approverOf, cancelRule, fmtPreferred, fmtScheduled, isStoreOrder, isVisitCall, paymentOf } from "../../lib/requests";
import { fmtWon, PRICING } from "../../lib/config";
import { useAppState } from "../../lib/state";
import { LIVE_CONCIERGE } from "../../lib/live-household";
import { honorific } from "../../lib/tracks";
import { ELDER } from "../../lib/mock";
import WelfareList from "../../components/WelfareList";
import { ASK_GUARDIAN, matchWelfare, profileFor, welfareCounts } from "../../lib/welfare";

// 양방향 "해주세요" — REQ-03 + 2026-10-05 운영 결정 (lib/requests.js 머리말)
// 보호자 화면: 요청(금액이 있으면 그 자리에서 결제) → 담당 컨시어지가 일정을 보고 승인 → 확정.
// 컨시어지 제안 중 승인 대상이 보호자인 것은 여기서 수락(결제) · 거절한다.
// 확정 뒤 취소는 서비스일 3일 전까지 바로, 그 안은 관제 승인.

// 활성 서비스 분류 순서 — 급한 것부터. lib/requests.js 의 cat 값과 같아야 한다.
// 5분류 — 2026-08-28 실무진 제안 (lib/requests.js 주석 참고)
const ACTIVE_CATS = ["건강지원", "생활지원", "가족지원", "전문지원", "긴급지원"];
const INACTIVE = SERVICE_MENU.filter((s) => !s.active);


export default function RequestsPage() {
  const { state, dispatch } = useAppState();
  const isPrimary = (state.demo.guardianRole || "primary") === "primary";
  const [creating, setCreating] = useState(false); // false | true | 서비스 메뉴 항목
  const [openId, setOpenId] = useState(null);
  const [wanted, setWanted] = useState({}); // 미개시 서비스 수요 신호 — no 별 1회
  const ob = state.onboarding;
  const honor = honorific(ob); // 고객 호칭 — "~~님" (2026-08-12 시트)

  const active = state.requests.filter((r) => !CLOSED.includes(r.status));
  const closed = state.requests.filter((r) => CLOSED.includes(r.status));
  const router = useRouter();

  const limitLabel =
    ob?.paymentMode === "limit" || !ob
      ? `${fmtWon(ob?.limitAmount ?? PRICING.paymentLimitDefault)} 초과 시 보호자 승인`
      : null;

  // 복지혜택 (2026-09-04 시트 앱 전체 3번) — 관제가 자동 매칭한 것을 보호자가 확인·신청한다.
  // 답(answers)은 관제·컨시어지·어르신 화면이 같이 본다.
  const honorName = ob?.elderName || ELDER.name;
  const answers = state.welfare?.answers || {};
  const welfareMatches = matchWelfare(profileFor(honorName, answers));
  const welfareN = welfareCounts(welfareMatches);
  const [welfareSent, setWelfareSent] = useState({});
  const askWelfare = (m) => {
    setWelfareSent((s) => ({ ...s, [m.policy.id]: true }));
    dispatch({
      type: "addRequest",
      payload: {
        id: `rq-${Date.now()}`,
        dir: "fromGuardian",
        type: `복지혜택 신청 도움 · ${m.policy.name}`,
        detail: `${m.policy.summary} — ${m.policy.value}. 신청 경로: ${m.policy.apply} (${m.policy.org} · ${m.policy.contact}). 확인할 것: ${m.checks}`,
        amount: 0,
        preferredDate: null,
        urgency: "normal",
        assignee: LIVE_CONCIERGE, // 가구 담당 컨시어지가 승인한다 (2026-10-05)
        photos: [],
        status: "requested",
        history: [{ at: Date.now(), status: "requested", note: "보호자 앱 · 복지혜택 신청 도움 요청" }],
        proof: null,
      },
    });
    dispatch({ type: "welfareStatus", id: m.policy.id, status: "신청예정", by: "보호자" });
    dispatch({ type: "pushEvent", payload: { kind: "복지", text: `보호자 복지혜택 신청 도움 요청 — ${m.policy.name}`, color: "#F0D9A8" } });
  };

  return (
    <>
      <Head>
        <title>해주세요 — K-CARE</title>
      </Head>
      <FamilyLayout title="해주세요">
        <p className="px-1 text-[13px] leading-[1.7] text-muted">
          부탁하시면 담당 컨시어지가 일정을 보고 승인합니다. 금액이 있는 서비스는 요청할 때 결제하고,
          승인되지 않으면 환불됩니다. 확정 뒤에는 서비스일 {CANCEL_FREE_DAYS}일 전까지 바로 취소할 수 있고,
          그 안에는 관제 승인을 거쳐 취소됩니다.{limitLabel && ` 어르신 직접 결제: ${limitLabel}.`}
        </p>

        {/* 복지혜택 — 베타부터 연다 (2026-09-04 시트 앱 전체 3번). 무료 회원도 같다. */}
        <Card className="p-0">
          <Collapse
            title="복지혜택 — 나라에서 받을 수 있는 것"
            count={`높음 ${welfareN.high} · 확인 ${welfareN.check}`}
            note={`${honor} 정보로 정책 79건을 자동 판정했습니다 · 무료 회원도 이용 · 2026-09-04 검증`}
            defaultOpen
            tone="gold"
          >
            {/* 미확인 항목 — 보호자가 답하면 '추가확인'이 '높음'으로 바뀐다 (시트의 노란 입력칸) */}
            <div className="rounded-xl bg-navy/[.04] p-3">
              <div className="text-[12px] font-bold text-navy">몇 가지만 확인해 주세요 — 답할수록 판정이 정확해집니다</div>
              <div className="mt-2 space-y-2">
                {ASK_GUARDIAN.map((q) => {
                  const cur = answers[q.key];
                  const opts = q.options || ["Y", "N"];
                  const label = (o) => (o === "Y" ? "예" : o === "N" ? "아니요" : o);
                  return (
                    <div key={q.key} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="min-w-[150px] flex-1 text-[12.5px] text-ink">{q.q}</span>
                      <span className="flex gap-1">
                        {opts.map((o) => (
                          <button
                            key={o}
                            onClick={() => dispatch({ type: "welfareAnswer", key: q.key, value: o })}
                            aria-pressed={cur === o}
                            className={`btn-press rounded-lg border px-2.5 py-1.5 text-[12px] font-bold ${
                              cur === o ? "border-navy bg-navy text-white" : "border-navy/15 text-muted"
                            }`}
                          >
                            {label(o)}
                          </button>
                        ))}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] leading-[1.6] text-muted">
                답은 관제·담당 컨시어지에게만 보이고, 자동판정에만 씁니다. 모르시면 비워 두세요 — 방문 때 확인합니다.
              </p>
            </div>
            <div className="mt-3">
              <WelfareList
                matches={welfareMatches}
                statuses={state.welfare?.status}
                hideLow
                pageSize={5}
                onStatus={(id, s) => dispatch({ type: "welfareStatus", id, status: s, by: "보호자" })}
                onSend={askWelfare}
                sendLabel="신청 도움 요청"
                sent={welfareSent}
              />
            </div>
          </Collapse>
        </Card>

        {/* 서비스 메뉴 — 실무자 피드백 (2026-08-09): no1~6 활성 · no7~11 예고 · no12 응급
            메뉴가 15개까지 늘어 한 장에 다 펼치면 3.8화면 분량이 된다. 분류로 묶고
            접어 둔다 — 제목줄의 개수만 봐도 안에 뭐가 몇 개 있는지 알 수 있게. */}
        <Card className="p-4">
          <SectionLabel>무엇을 부탁드릴까요</SectionLabel>
          <div className="mt-2.5 space-y-2">
            {ACTIVE_CATS.map((cat) => {
              const rows = SERVICE_MENU.filter((x) => x.active && x.cat === cat);
              if (!rows.length) return null;
              return (
                <Collapse key={cat} title={cat} count={`${rows.length}가지`}>
                  <div className="space-y-2">
                    {rows.map((s) => (
                      <button
                        key={s.no}
                        onClick={() => setCreating(s)}
                        className="btn-press w-full rounded-xl border border-navy/12 p-3 text-left"
                      >
                        <div className="text-[15px] font-bold text-navy">{s.name}</div>
                        <div className="mt-1 font-num text-[12.5px] font-bold text-gold">{s.priceLabel}</div>
                        <div className="mt-0.5 text-[12px] leading-[1.6] text-muted">{s.scope}</div>
                        {s.point && <div className="mt-0.5 text-[12px] leading-[1.6] text-green">{s.point}</div>}
                      </button>
                    ))}
                  </div>
                </Collapse>
              );
            })}

            {/* 해주세요 PLUS — 외주 파트너 연계 (개편안 V2 ONE STOP 축) */}
            <Collapse
              title="해주세요 PLUS — 전문업체 연결"
              count={`${SERVICE_PLUS.length}가지`}
              note="직접 못 하는 일은 전문업체로 연결하고 진행 상황을 보고합니다. 공사·수리의 책임은 시공 업체에 있습니다."
              tone="gold"
            >
              <div className="space-y-2">
                {SERVICE_PLUS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() =>
                      setCreating({
                        no: `plus-${s.key}`,
                        name: s.name,
                        priceLabel: s.priceLabel,
                        amount: s.amount,
                      })
                    }
                    className="btn-press w-full rounded-xl border border-gold/25 bg-white/70 p-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-navy">{s.name}</span>
                      <span className="ml-auto shrink-0 rounded-full bg-navy/[.06] px-2 py-[3px] text-[11px] font-bold text-muted">
                        {s.tag}
                      </span>
                    </div>
                    <div className={`mt-1 font-num text-[12.5px] font-bold ${s.confirmed ? "text-gold" : "text-muted"}`}>
                      {s.priceLabel}
                    </div>
                    <div className="mt-0.5 text-[12px] leading-[1.6] text-muted">{s.scope}</div>
                    <div className="mt-0.5 text-[11.5px] leading-[1.55] text-amber">{s.note}</div>
                  </button>
                ))}
              </div>
            </Collapse>

            {/* 미개시 서비스 — 표기만 하고 비활성. "이런 서비스도 앞으로 이용할 수
                있구나"를 보여주고, 필요 신호로 수요를 잰다 (실무자 요청 그대로) */}
            <Collapse
              title="준비 중인 서비스"
              count={`${INACTIVE.length}가지`}
              note="곧 열립니다 — 필요하시면 알려 주세요"
            >
              <div className="space-y-2">
                {INACTIVE.map((s) => {
                  const sent = !!wanted[s.no];
                  return (
                    <div key={s.no} className="rounded-xl border border-dashed border-navy/15 bg-navy/[.025] p-3">
                      <div className="text-[14.5px] font-bold text-muted">{s.name}</div>
                      <div className="mt-0.5 text-[12px] leading-[1.6] text-muted/80">{s.scope}</div>
                      <button
                        onClick={() => {
                          if (sent) return;
                          setWanted((w) => ({ ...w, [s.no]: true }));
                          dispatch({
                            type: "pushEvent",
                            payload: { kind: "수요", text: `미개시 서비스 수요 신호 — ${s.name}`, color: "#8FA9CC" },
                          });
                        }}
                        className={`btn-press mt-2 w-full rounded-lg border px-3 py-2 text-[12px] font-bold ${
                          sent ? "border-green/30 bg-green/10 text-green" : "border-navy/20 text-navy"
                        }`}
                      >
                        {sent ? "✓ 알려주셔서 감사합니다 — 열리면 먼저 안내드릴게요" : "이 서비스가 필요하신가요?"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </Collapse>
          </div>
        </Card>

        {active.length === 0 && (
          <Card className="p-5 text-center text-[15px] text-muted">진행 중인 요청이 없습니다.</Card>
        )}

        {active.map((r) => (
          <RequestCard
            key={r.id}
            req={r}
            open={openId === r.id}
            onToggle={() => setOpenId(openId === r.id ? null : r.id)}
            onboarding={ob}
            dispatch={dispatch}
            isPrimary={isPrimary}
            payments={state.payments}
          />
        ))}

        {closed.length > 0 && (
          <>
            <SectionLabel>완료 · 종결</SectionLabel>
            {closed.map((r) => (
              <RequestCard
                key={r.id}
                req={r}
                open={openId === r.id}
                onToggle={() => setOpenId(openId === r.id ? null : r.id)}
                onboarding={ob}
                dispatch={dispatch}
                isPrimary={isPrimary}
                payments={state.payments}
              />
            ))}
          </>
        )}

        <PrimaryButton onClick={() => setCreating(true)}>해주세요 요청하기</PrimaryButton>

        {creating && (
          <CreateRequestSheet
            preset={typeof creating === "object" ? creating : null}
            myHospitals={(state.myHospitals || []).map((h) => h.name).filter(Boolean)}
            onClose={() => setCreating(false)}
            isPrimary={isPrimary}
            onCreate={(req) => {
              dispatch({ type: "addRequest", payload: req });
              dispatch({
                type: "pushEvent",
                payload: { kind: "해주세요", text: `보호자 해주세요 — ${req.type}${req.status === "awaitingPayment" ? " · 결제 후 담당 컨시어지 승인" : " · 담당 컨시어지 승인 대기"}`, color: "#8FA9CC" },
              });
              setCreating(false);
              // 결제는 요청할 때 먼저 (2026-10-05) — 주 보호자는 바로 결제창으로
              if (req.status === "awaitingPayment" && isPrimary) router.push(payHref({ kind: "request", amount: req.amount, orderName: req.type, ref: req.id }));
            }}
          />
        )}
      </FamilyLayout>
    </>
  );
}

// 진행 단계 — 보호자 · 어르신 요청: 결제 → 컨시어지 승인 → 확정 → 진행 → 완료.
// 컨시어지 제안: 제안 → 수락(결제) → 확정 → 진행 → 완료. 금액이 없는 것은 결제 단계를 지나간 것으로 본다.
const STEPS_ASK = ["결제", "컨시어지 승인", "확정", "진행", "완료"];
const STEPS_PROPOSAL = ["제안", "수락 · 결제", "확정", "진행", "완료"];
function stepOf(r) {
  if ((CLOSED.includes(r.status) && r.status !== "done") || isVisitCall(r) || isStoreOrder(r)) return -1;
  const proposal = approverOf(r) !== "concierge";
  switch (r.status) {
    case "awaitingPayment":
      return proposal || r.approvedAt ? 1 : 0;
    case "requested":
    case "needsAdmin":
      return 1;
    case "confirmed":
    case "cancelRequested":
      return 2;
    case "inProgress":
      return 3;
    case "done":
      return 4;
    default:
      return -1;
  }
}

function RequestCard({ req, open, onToggle, onboarding, dispatch, isPrimary, payments }) {
  const router = useRouter();
  const honor = honorific(onboarding); // 고객 호칭 — 전부 "~~님" (2026-08-12 시트)
  const [notified, setNotified] = useState(false); // 부 보호자 → 주 보호자 결제 알림
  const [confirming, setConfirming] = useState(null); // "cancel" | "decline"
  const st = STATUS[req.status] || STATUS.requested;
  const approver = approverOf(req);
  const proposal = approver !== "concierge";
  const stepIdx = stepOf(req);
  const steps = proposal ? STEPS_PROPOSAL : STEPS_ASK;
  const pay = paymentOf(payments, req.id);
  const rule = cancelRule(req);
  const scheduled = fmtScheduled(req);
  const visitCall = req.type === "즉시 방문 요청";
  const route = visitCall
    ? `${honor} → 관제`
    : {
        fromConcierge: approver === "elder" ? `컨시어지 제안 → ${honor} 승인` : "컨시어지 제안 → 보호자 승인",
        fromElder: req.status === "awaitingPayment" ? `${honor} 부탁 · 보호자 결제` : `${honor} → 담당 컨시어지`,
        fromGuardian: "보호자 → 담당 컨시어지",
        fromOps: "관제 → 보호자", // 복지혜택 안내 (2026-09-04)
      }[req.dir];
  // 보호자가 할 수 있는 것 — 결제(결제 대기) · 제안 수락/거절(승인 대상이 보호자일 때) · 취소(규칙대로)
  const canAnswer = req.status === "requested" && approver === "guardian";
  const canPay = req.status === "awaitingPayment";
  const canCancel = !visitCall && !isStoreOrder(req) && req.dir !== "fromOps" && !canAnswer && ["free", "ops"].includes(rule.mode) && !(proposal && req.status === "requested");
  const goPay = () => router.push(payHref({ kind: "request", amount: req.amount, orderName: req.type, ref: req.id }));

  return (
    <Card className="overflow-hidden">
      <button onClick={onToggle} className="btn-press w-full p-4 text-left">
        <div className="flex items-center gap-2">
          <Badge fg={st.fg} bg={st.bg}>
            {st.label}
          </Badge>
          {req.urgency === "urgent" && (
            <Badge fg={URGENCY.urgent.fg} bg={URGENCY.urgent.bg}>
              긴급
            </Badge>
          )}
          <span className="ml-auto text-right text-[11px] font-bold text-muted/70">{route}</span>
        </div>
        <div className="mt-2 text-[17px] font-bold leading-[1.45] text-navy">{req.type}</div>
        <div className="mt-0.5 line-clamp-2 text-[13px] leading-[1.65] text-muted">
          {req.detail}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted">
          <span>
            금액 <b className="font-num text-ink">{req.amount != null ? fmtWon(req.amount) : "확정 전"}</b>
          </span>
          {scheduled ? (
            <span>
              확정 <b className="font-num text-ink">{scheduled}</b>
            </span>
          ) : (
            (req.preferredDate || req.preferredWhen) && <span>희망 {fmtPreferred(req)}</span>
          )}
          {req.hospital && <span>병원 {req.hospital}</span>}
          <span>담당 {req.assignee || "미배정"}</span>
          {req.photos?.length > 0 && <span>사진 {req.photos.length}장</span>}
        </div>
        {(pay || req.payBy === "elder") && (
          <div className="mt-1.5 text-[12px] font-bold">
            {pay?.refund ? (
              <span className={pay.refund.status === "done" ? "text-green" : "text-amber"}>
                {pay.refund.status === "done" ? `환불 완료 ${fmtWon(pay.refund.amount)}` : `환불 대기 ${fmtWon(pay.refund.amount)} — 관제가 처리합니다`}
              </span>
            ) : pay ? (
              <span className="text-green">
                결제 완료 {fmtWon(pay.amount)}
                {pay.demo ? " (데모 · 실제 결제 없음)" : ""}
              </span>
            ) : (
              <span className="text-muted">{honor} 직접 결제 (하루 한도 안)</span>
            )}
          </div>
        )}
        {/* 진행 스텝퍼 — 지금 어디까지 왔는지 한눈에 */}
        {stepIdx >= 0 && (
          <div className="mt-3 flex items-center gap-1">
            {steps.map((l, i) => (
              <div key={l} className="flex-1">
                <div
                  className="h-[5px] rounded-full"
                  style={{
                    background:
                      i < stepIdx ? "#0A1F3C" : i === stepIdx ? "#B08D57" : "rgba(10,31,60,.1)",
                  }}
                />
                <div
                  className={`mt-1 text-center text-[10px] font-bold leading-[1.3] ${
                    i === stepIdx ? "text-[#7A5C28]" : i < stepIdx ? "text-navy" : "text-muted/50"
                  }`}
                >
                  {l}
                </div>
              </div>
            ))}
          </div>
        )}
        {req.status === "cancelRequested" && (
          <div className="mt-2.5 rounded-lg bg-amber/10 px-3 py-2 text-[12px] font-bold text-amber">
            취소 요청 — 관제가 확인하고 있습니다
          </div>
        )}
        {req.status === "requested" && approver === "concierge" && !visitCall && (
          <div className="mt-2.5 rounded-lg bg-navy/[.05] px-3 py-2 text-[12px] font-bold text-navy">
            {req.assignee || "담당 컨시어지"} 컨시어지가 일정을 보고 승인합니다
          </div>
        )}
        {req.status === "requested" && approver === "elder" && (
          <div className="mt-2.5 rounded-lg bg-navy/[.05] px-3 py-2 text-[12px] font-bold text-navy">
            {honor}이 수락하시면 진행됩니다
          </div>
        )}
      </button>

      {/* 할 일 — 접지 않고 바로 보인다 */}
      {(canPay || canAnswer || canCancel) && (
        <div className="border-t border-navy/10 px-4 pb-4 pt-3">
          {canPay &&
            (isPrimary ? (
              <PrimaryButton onClick={goPay}>{fmtWon(req.amount)} 결제하기</PrimaryButton>
            ) : (
              // 부 보호자 — 결제 권한 없음. 주 보호자 호출만
              <button
                onClick={() => {
                  if (notified) return;
                  setNotified(true);
                  dispatch({
                    type: "pushEvent",
                    payload: { kind: "승인", text: "부 보호자 → 주 보호자 결제 요청 알림", color: "#8FA9CC" },
                  });
                }}
                className={`btn-press w-full rounded-xl border py-3 text-[15px] font-bold ${
                  notified ? "border-green/30 bg-green/10 text-green" : "border-navy/20 text-navy"
                }`}
              >
                {notified ? "✓ 주 보호자(민수)에게 알림 보냄" : "결제는 주 보호자 권한 — 알림 보내기"}
              </button>
            ))}
          {canAnswer && (
            <div className="flex gap-2">
              <GhostButton className="flex-1" onClick={() => setConfirming("decline")}>
                거절
              </GhostButton>
              <PrimaryButton
                className="flex-[2]"
                disabled={!isPrimary && req.amount > 0}
                onClick={() => {
                  dispatch({ type: "respondProposal", id: req.id, accept: true, role: "guardian" });
                  dispatch({ type: "pushEvent", payload: { kind: "해주세요", text: `보호자 컨시어지 제안 수락 — ${req.type}`, color: "#8FE3C0" } });
                  if (req.amount > 0 && isPrimary) goPay();
                }}
              >
                {req.amount > 0 ? `수락 · ${fmtWon(req.amount)} 결제` : "수락"}
              </PrimaryButton>
            </div>
          )}
          {canCancel && !confirming && (
            <GhostButton className={canPay || canAnswer ? "mt-2" : ""} onClick={() => setConfirming("cancel")}>
              {rule.mode === "ops" ? "취소 요청 (관제 승인)" : "취소하기"}
            </GhostButton>
          )}
          {confirming && (
            <div className="mt-2 rounded-xl border border-navy/12 bg-white p-3">
              <p className="text-[13px] leading-[1.65] text-ink">
                {confirming === "decline"
                  ? "이 제안을 거절할까요? 컨시어지에게 거절로 전달됩니다."
                  : rule.mode === "ops"
                    ? `${req.status === "inProgress" ? "이미 진행 중이라" : rule.days == null ? "확정 날짜가 없어" : `서비스일까지 ${CANCEL_FREE_DAYS}일이 안 남아`} 관제가 확인한 뒤 취소됩니다.${pay ? " 승인되면 결제하신 금액은 관제가 환불합니다." : ""}`
                    : `지금 취소하면 바로 취소됩니다.${pay ? ` 결제하신 ${fmtWon(pay.amount)}은 관제가 환불 처리합니다.` : ""}`}
              </p>
              <div className="mt-2.5 flex gap-2">
                <GhostButton className="flex-1" onClick={() => setConfirming(null)}>
                  아니요
                </GhostButton>
                <PrimaryButton
                  className="flex-[2]"
                  onClick={() => {
                    if (confirming === "decline") {
                      dispatch({ type: "respondProposal", id: req.id, accept: false, role: "guardian" });
                      dispatch({ type: "pushEvent", payload: { kind: "해주세요", text: `보호자 컨시어지 제안 거절 — ${req.type}`, color: "#8FA9CC" } });
                    } else {
                      dispatch({ type: "cancelRequest", id: req.id, by: "보호자" });
                      dispatch({
                        type: "pushEvent",
                        payload: { kind: "해주세요", text: `보호자 ${rule.mode === "ops" ? "취소 요청 (관제 승인 필요)" : "취소"} — ${req.type}`, color: "#B08D57" },
                      });
                    }
                    setConfirming(null);
                  }}
                >
                  {confirming === "decline" ? "네, 거절합니다" : rule.mode === "ops" ? "네, 취소 요청합니다" : "네, 취소합니다"}
                </PrimaryButton>
              </div>
            </div>
          )}
        </div>
      )}

      {open && (
        <div className="border-t border-navy/10 bg-paper/60 p-4">
          {/* 상태 타임라인 */}
          <SectionLabel>처리 이력</SectionLabel>
          <div className="mt-2.5 space-y-2">
            {req.history.map((h, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span
                  className="mt-[5px] h-[8px] w-[8px] shrink-0 rounded-full"
                  style={{ background: (STATUS[h.status] || STATUS.requested).fg }}
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[13px] font-bold text-ink">
                    {(STATUS[h.status] || STATUS.requested).label}
                  </span>
                  <span className="ml-2 font-num text-[11px] text-muted">
                    {new Date(h.at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}
                  </span>
                  {h.note && (
                    <div className="text-[12px] leading-[1.6] text-muted">{h.note}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {req.proof && (
            <div className="mt-3 rounded-xl border border-green/25 bg-green/5 p-3 text-[12px] text-green">
              완료증빙 첨부됨 · {req.proof}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function CreateRequestSheet({ preset, onClose, onCreate, myHospitals = [], isPrimary = true }) {
  const [type, setType] = useState(preset ? preset.name : GUARDIAN_PRESETS[0]);
  const [detail, setDetail] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  // 시간 · 병원 — 병원 동행처럼 '어디서 · 언제'가 있어야 배차하는 요청 (2026-10-02 QA "날짜·시간·병원 선택 단계 없음")
  const [preferredTime, setPreferredTime] = useState("");
  const [hospital, setHospital] = useState("");
  const hospitalAsk = /병원|진료|검진/.test(String(type || ""));
  const [urgency, setUrgency] = useState("normal");
  const [photo, setPhoto] = useState(false);
  // 금액은 서비스 메뉴 값 그대로 — 메뉴 항목을 골랐을 때만. 보호자가 적는 금액으로 결제하지 않는다
  // (요청할 때 결제하므로). 메뉴 밖 요청 · 요금 확정 전 항목은 담당 컨시어지가 승인하며 정하고 그 뒤 결제한다.
  const onMenu = !!preset && type === preset.name;
  const amount = onMenu && preset.amount != null ? Number(preset.amount) : null;
  const payNow = amount > 0;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[rgba(8,23,45,.45)]">
      <div className="max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-white p-6 pb-8">
        <div className="mx-auto mb-4 h-[4px] w-[38px] rounded-full bg-navy/15" />
        <div className="text-[19px] font-black text-navy">{preset ? preset.name : "해주세요 요청"}</div>
        <p className="mt-1 text-[12px] leading-[1.6] text-muted">
          담당 컨시어지({LIVE_CONCIERGE})가 일정을 보고 승인하면 확정됩니다.
          {payNow ? " 요청할 때 결제하고, 승인되지 않으면 환불됩니다." : amount === 0 ? " 따로 내실 금액이 없습니다." : " 요금은 컨시어지가 승인하며 알려 드리고, 그 뒤 결제합니다."}
        </p>
        {preset?.priceLabel && (
          <p className="mt-2 rounded-xl bg-gold/[.08] px-3 py-2 font-num text-[12.5px] font-bold text-gold">
            {preset.priceLabel}
          </p>
        )}

        <div className="mt-4">
          <SectionLabel>요청 종류</SectionLabel>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(preset ? [preset.name, ...GUARDIAN_PRESETS] : GUARDIAN_PRESETS).map((p) => (
              <button
                key={p}
                onClick={() => setType(p)}
                className={`btn-press rounded-full border px-3 py-1.5 text-[13px] font-bold ${
                  type === p ? "border-gold bg-gold/10 text-navy" : "border-navy/15 text-muted"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <SectionLabel>상세 내용</SectionLabel>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={3}
            placeholder="무엇을 어떻게 해드리면 될까요?"
            className="mt-2 w-full resize-none rounded-xl border border-navy/15 px-3.5 py-3 text-[16px] leading-[1.6] outline-none focus:border-gold"
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <SectionLabel>희망일 (선택)</SectionLabel>
            <input
              aria-label="희망일 (선택)"
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="mt-2 w-full rounded-xl border border-navy/15 px-3.5 py-3 text-[15px] outline-none focus:border-gold"
            />
          </div>
          <div>
            <SectionLabel>희망 시간 (선택)</SectionLabel>
            <input
              aria-label="희망 시간 (선택)"
              type="time"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="mt-2 w-full rounded-xl border border-navy/15 px-3.5 py-3 text-[15px] outline-none focus:border-gold"
            />
          </div>
        </div>
        {hospitalAsk && (
          <div className="mt-3">
            <SectionLabel>병원 (선택)</SectionLabel>
            <input
              aria-label="병원 (선택)"
              list="req-hospitals"
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              placeholder="병원 · 진료과"
              className="mt-2 w-full rounded-xl border border-navy/15 px-3.5 py-3 text-[15px] outline-none focus:border-gold"
            />
            <datalist id="req-hospitals">
              {myHospitals.map((h) => (
                <option key={h} value={h} />
              ))}
            </datalist>
          </div>
        )}

        <div className="mt-4 flex items-center gap-4">
          <div>
            <SectionLabel>긴급도</SectionLabel>
            <div className="mt-2 flex gap-1.5">
              {Object.entries(URGENCY).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => setUrgency(k)}
                  className={`btn-press rounded-lg border px-3 py-1.5 text-[13px] font-bold ${
                    urgency === k
                      ? "border-gold bg-gold/10 text-navy"
                      : "border-navy/15 text-muted"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <SectionLabel>사진 첨부</SectionLabel>
            <button
              onClick={() => setPhoto((v) => !v)}
              className={`btn-press mt-2 w-full rounded-lg border px-3 py-1.5 text-[13px] font-bold ${
                photo ? "border-gold bg-gold/10 text-navy" : "border-navy/15 text-muted"
              }`}
            >
              {photo ? "첨부됨 (데모)" : "사진 선택 (데모)"}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-navy/[.04] px-3.5 py-3 text-[12px] leading-[1.65] text-muted">
          <div className="flex items-center justify-between">
            <span className="font-bold text-navy">결제 금액</span>
            <b className="font-num text-[15px] text-navy">{amount == null ? "요금 확정 전" : fmtWon(amount)}</b>
          </div>
          확정 뒤 취소는 서비스일 {CANCEL_FREE_DAYS}일 전까지 바로, 그 안에는 관제 승인을 거쳐 취소됩니다.
          {payNow && !isPrimary ? " 결제는 주 보호자가 합니다 — 요청은 결제 대기로 남습니다." : ""}
        </div>

        <div className="mt-5 flex gap-2">
          <GhostButton onClick={onClose} className="flex-1">
            닫기
          </GhostButton>
          <PrimaryButton
            className="flex-[2]"
            disabled={!detail.trim()}
            onClick={() => {
              const now = Date.now();
              onCreate({
                id: `rq-${now}`,
                dir: "fromGuardian",
                type,
                detail: detail.trim(),
                amount,
                preferredDate: preferredDate ? new Date(preferredDate).getTime() : null,
                preferredTime: preferredTime || null,
                hospital: hospitalAsk && hospital.trim() ? hospital.trim() : null,
                urgency,
                // 가구 담당 컨시어지가 받아 승인한다 — 관제는 바꿀 수 있다 (2026-10-05)
                assignee: LIVE_CONCIERGE,
                photos: photo ? ["첨부사진.jpg"] : [],
                status: payNow ? "awaitingPayment" : "requested",
                history: [
                  { at: now, status: "requested", note: "보호자 요청" },
                  ...(payNow ? [{ at: now, status: "awaitingPayment", note: `요청과 함께 결제 ${fmtWon(amount)}` }] : []),
                ],
                proof: null,
              });
            }}
          >
            {payNow ? (isPrimary ? `${fmtWon(amount)} 결제하고 요청` : "요청 보내기 (주 보호자 결제)") : "요청 보내기"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
