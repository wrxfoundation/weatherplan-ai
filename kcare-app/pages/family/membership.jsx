import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { PolicyBody } from "../../components/Policy";
import { Line } from "../../components/clay";
import { Btn, EvenGrid, Sheet, SheetTitle, TONE, WhiteBtn } from "../../components/ds";
import { ELDER } from "../../lib/mock";
import { fmtWon } from "../../lib/config";
import { safeReceiptUrl } from "../../lib/payments";
import { PROVIDER_LABEL, logout, useAuth } from "../../lib/auth";
import { elderNameOf, meAs } from "../../lib/people";
import { storageText, useAppState, useSync } from "../../lib/state";
import { useGuardianRole } from "../../lib/guardian-role";
import { videoConsentOf } from "../../lib/consent";
import { payGroup } from "../../lib/membership";
import { FEE, PLAN_PENDING_NOTE, planFor, planPrice, won } from "../../lib/plans";
import { MemberPayCard, MemberPaySheet, PAY_HOW, PermCard, payWhoOptions } from "../../components/MemberPay";
import { LEGAL, policyOf } from "../../lib/policies";
import { TEL } from "../../lib/landing";

// 마이 › 멤버십 (2026-10-15 디자인 시안) — 요금제 · 이용료 결제 · 결제 권한 · 설치비 · 동의 · 환불 정책 · 로그인 계정.
// 전에 마이의 '결제 관리' 시트와 '멤버십' 카드에 있던 것을 한 화면에 모았다 (기능은 그대로).
// 2026-10-22 시제품 v17 — 이용료 결제(누가 · 어떻게)는 어르신 마이와 같은 값(state.memberPay · components/MemberPay.jsx),
// 결제 권한은 '가족 누구나 금액 제한 없이' 한 줄 + 가족 칩 (하루 한도 · 보호자 승인 단계와 바꾸기 시트는 없앴다).
// 2026-11-10 두 요금제 — 이 가구의 요금제는 관제가 어르신 관리에서 지정한 값이다 (state.plan · lib/plans.js).
//   · 지정 전이면 금액을 적지 않고 '요금제 확인 중'이라고 쓴다. 두 분 가구는 금액 대신 '상담에서 안내'.
//   · 월 요금은 토스 결제창에서 카드를 등록하지 않는다 — 자동 결제 등록은 관제가 연락해 안내한다 (월 요금은 자동이체 대행 · 2026-11-06 결제 범위).
//     전에 있던 '카드 등록하기'와 '다음 결제일'은 뺐다 (앱은 자동 결제 날짜를 모른다 — 계약서에 적힌다).
//   · 해지할 때 드는 비용은 요금제 칸에 그대로 적는다 (서비스 소개 요금표와 같은 값).
// 시안의 산호색(결제수단 카드 · 카드 등록 버튼)은 금색으로 — 빨강 계열은 위험 신호 전용.

const md = (t) => new Date(t).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });

export default function MembershipPage() {
  const { state, dispatch } = useAppState();
  const auth = useAuth();
  const sync = useSync();
  const ob = state.onboarding;
  const { isPrimary } = useGuardianRole(); // 로그인한 가구는 계정 기준 (lib/guardian-role.js)
  const [payOpen, setPayOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelTopic, setCancelTopic] = useState("해지");
  // 마지막으로 보낸 해지 · 변경 상담 요청 (관제 연락 기록에서 읽는다)
  const cancelAsk = (state.opsMessages || []).find((m) => m.role === "guardian" && m.kind === "membership") || null;
  const payments = state.payments || [];
  const memberPay = state.memberPay || null;
  const group = payGroup(elderNameOf(ob));
  const region = ob ? `${ob.district} · ${ob.tier === 2 ? "2급지" : "1급지"}` : `${ELDER.district} · 1급지`;
  // 이 가구의 요금제 — 관제가 지정한 값. 로그인한 가구가 지정 전이면 null (금액을 지어내지 않는다) · 시연 화면은 전담 케어 예시
  const plan = planFor(state, auth.user);
  const couple = ob?.household === "couple";
  const videoConsent = videoConsentOf(state) ? "동의함" : "동의 안 함"; // 정보 동의와 같은 값 (lib/consent.js)
  const entryPaid = payments.some((p) => p.kind === "entry");
  const mini = "ds-press ds-btn3d flex h-10 flex-none items-center gap-1 rounded-[14px] bg-white px-3.5 text-[15px]";

  return (
    <>
      <Head>
        <title>멤버십 — K-CARE</title>
      </Head>
      <FamilyLayout back="/family/my" backLabel="마이로 돌아가기" sub="마이" title="멤버십">
        <div className="ds-gcard ds-r" style={{ "--d": "40ms", background: TONE.beige.bg }}>
          {/* 요금제 이름과 지역 칩을 한 줄에, 금액은 그 아래 한 줄을 다 쓴다 — 칩이 길어도('지역 미등록 · 1급지') 금액이 꺾이지 않게 */}
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 text-[15px] font-extrabold" style={{ color: TONE.beige.fg }}>
              요금제{plan ? ` · ${plan.name}` : ""}
            </span>
            <span className="ds-gchip flex-none" style={{ color: TONE.beige.fg }}>
              {region}
            </span>
          </div>
          <div data-plan-price className="ds-num whitespace-nowrap text-[32px] font-black leading-[1.2]">
            {plan && !couple ? `월 ${planPrice(plan)}` : planPrice(plan, { couple })}
          </div>
          <div className="text-[15px] font-bold leading-[1.55]" style={{ color: "#6B5A35" }}>
            {plan ? `${plan.term} · 설치비 ${won(FEE.install)}은 설치하는 달에 한 번 · 부가세 포함` : PLAN_PENDING_NOTE}
          </div>
        </div>

        {/* 요금제에 들어 있는 것 · 해지할 때 드는 비용 — 서비스 소개 요금표와 같은 값 (lib/plans.js). 지정 전이면 그리지 않는다 */}
        {plan && (
          <div className="ds-gcard ds-r" style={{ "--d": "60ms", background: "#FFFFFF", boxShadow: "0 5px 0 #E6E2DA" }}>
            <h2 className="ds-lab m-0">{plan.name}에 들어 있는 것</h2>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[15px] font-bold leading-[1.55]" style={{ color: "#1B2340" }}>
              {plan.items.map((x) => (
                <li key={x} className="flex gap-2">
                  <span aria-hidden="true" className="flex-none" style={{ color: TONE.green.fg }}>
                    ✓
                  </span>
                  <span className="min-w-0">{x}</span>
                </li>
              ))}
            </ul>
            {plan.not && (
              <p className="m-0 text-[14px] font-bold leading-[1.6]" style={{ color: "#5E6270" }}>
                {plan.not}
              </p>
            )}
            <h2 className="ds-lab m-0 mt-1">해지할 때 드는 비용</h2>
            <ul className="m-0 list-none p-0">
              {plan.exit.map((e) => (
                <li key={e.when} className="ds-row">
                  <span className="ds-k">
                    <b className="!text-[15px]">{e.when}</b>
                    <small>{e.note}</small>
                  </span>
                  <span className="ds-num flex-none text-[15px] font-black">{e.cost}</span>
                </li>
              ))}
            </ul>
            <p className="m-0 text-[14px] font-bold leading-[1.6]" style={{ color: "#5E6270" }}>
              계약서를 받은 날부터 14일 안에는 위약금 없이 철회할 수 있어요.
            </p>
          </div>
        )}

        {/* 이용료 결제 — 누가 · 어떻게 (어르신 마이와 같은 값). 정한 방법으로 자동 결제를 등록하는 일은 관제가 연락해 안내한다 —
            월 요금은 이 앱의 결제창(토스)에서 카드를 등록하지 않는다 (2026-11-10) */}
        <MemberPayCard value={memberPay} onOpen={() => setPayOpen(true)}>
          <div className="text-center text-[13px] font-bold leading-[1.6]" style={{ color: "#6B5A35" }}>
            월 요금 자동 결제 등록은 관제가 연락드려 안내해요 · 앱에서 바로 빠져나가지 않아요
          </div>
        </MemberPayCard>

        <PermCard group={group} text="가족 누구나 금액 제한 없이 결제해요" />

        <div className="ds-gcard ds-r" style={{ "--d": "160ms", background: TONE.green.bg, paddingTop: 8, paddingBottom: 8 }}>
          <ul className="m-0 list-none p-0">
            <li className="ds-row">
              <span className="ds-k">
                <b>설치비</b>
                <small>센서 설치 · 갤럭시 핏 · 앱 설치 (설치하는 달에 한 번)</small>
              </span>
              <span className="flex-none text-right text-[14px] font-extrabold" style={{ color: TONE.green.fg }}>
                {entryPaid ? "결제 완료" : won(FEE.install)}
              </span>
            </li>
            <li className="ds-row">
              <span className="ds-k">
                <b>방문 영상 동의</b>
              </span>
              <Link href="/family/consent" className={mini} style={{ boxShadow: `0 3px 0 ${TONE.green.sh}`, color: TONE.green.fg }}>
                {videoConsent} <Line name="chevR" size={16} />
              </Link>
            </li>
            <li className="ds-row">
              <span className="ds-k">
                <b>환불 정책</b>
              </span>
              <button type="button" onClick={() => setRefundOpen(true)} className={mini} style={{ boxShadow: `0 3px 0 ${TONE.green.sh}`, color: TONE.green.fg }}>
                보기 <Line name="chevR" size={16} />
              </button>
            </li>
            {/* 해지 · 변경 — 앱에서 바로 해지하지 않고 상담을 요청한다 (2026-10-18). 기기 회수와 정산을 사람이 안내해야 해서다.
                드는 비용은 위 요금제 칸과 환불 정책에 적혀 있다. 요청은 관제 '지금 처리할 일'에 뜨고, 관제가 확인하면 다시 요청할 수 있다 */}
            <li className="ds-row flex-wrap">
              <span className="ds-k">
                <b>해지 · 변경 상담</b>
                <small>{cancelAsk ? `${md(cancelAsk.at)} 요청 · ${cancelAsk.ackAt ? "관제 확인 — 연락드립니다" : "관제 확인 전"}` : "드는 비용은 환불 정책에 있어요 · 상담으로 진행해요"}</small>
              </span>
              {isPrimary ? (
                cancelAsk && !cancelAsk.ackAt ? (
                  <span className="flex-none text-[14px] font-extrabold" style={{ color: TONE.green.fg }}>
                    요청됨
                  </span>
                ) : (
                  <button type="button" onClick={() => setCancelOpen((v) => !v)} aria-expanded={cancelOpen} className={mini} style={{ boxShadow: `0 3px 0 ${TONE.green.sh}`, color: TONE.green.fg }}>
                    상담 요청
                  </button>
                )
              ) : (
                <span className="flex-none text-[14px] font-bold" style={{ color: "#5E6270" }}>
                  주 보호자만
                </span>
              )}
              {cancelOpen && !(cancelAsk && !cancelAsk.ackAt) && (
                <div className="flex basis-full flex-col gap-2.5 rounded-[18px] bg-white p-3.5">
                  <EvenGrid role="group" aria-label="무엇을 상담할까요" labels={["해지", "일시 중지", "요금제 변경"]} gap={6}>
                    {["해지", "일시 중지", "요금제 변경"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        aria-pressed={cancelTopic === t}
                        onClick={() => setCancelTopic(t)}
                        className="ds-press min-h-[40px] rounded-full px-3.5 text-[14px] font-extrabold"
                        style={cancelTopic === t ? { background: "#1B2340", color: "#FFFFFF" } : { background: "#F3F1EC", color: "#3A3F50" }}
                      >
                        {t}
                      </button>
                    ))}
                  </EvenGrid>
                  <p className="text-[14px] leading-[1.6]" style={{ color: "#5E6270" }}>
                    요청하면 관제가 연락드려 기기 회수와 환불을 안내합니다. 상담 전에는 아무것도 바뀌지 않습니다.
                  </p>
                  <div className="grid grid-cols-[1fr_2fr] gap-2">
                    <WhiteBtn h={48} className="text-[15px]" onClick={() => setCancelOpen(false)}>
                      닫기
                    </WhiteBtn>
                    <Btn
                      tone="navy"
                      h={48}
                      className="text-[15px]"
                      onClick={() => {
                        dispatch({
                          type: "addOpsMessage",
                          payload: { from: `보호자 ${auth.user?.name || "주 보호자"}`, role: "guardian", kind: "membership", text: `멤버십 ${cancelTopic} 상담 요청 — 연락 부탁드립니다` },
                        });
                        dispatch({ type: "pushEvent", payload: { kind: "설정", text: `멤버십 ${cancelTopic} 상담 요청`, color: "#8FA9CC" } });
                        setCancelOpen(false);
                      }}
                    >
                      {cancelTopic} 상담 요청
                    </Btn>
                  </div>
                </div>
              )}
            </li>
            {/* 로그인 계정 — 테스트 계정 · 구글 (설정 전이면 '설정 전'). 로그인하면 기록이 서버에 저장된다 */}
            <li className="ds-row">
              <span className="ds-k">
                <b>로그인 계정</b>
                {auth.user && (
                  <small>
                    {auth.user.name}
                    {auth.user.provider ? ` · ${PROVIDER_LABEL[auth.user.provider] || auth.user.provider}` : ""}
                  </small>
                )}
              </span>
              {auth.user ? (
                <button
                  type="button"
                  onClick={async () => {
                    // 모아 둔 것을 다 보낸 뒤에 나간다 — 로그아웃하면 세션이 끊겨 더는 못 보낸다
                    await sync.flush?.();
                    logout("/login");
                  }}
                  className={mini}
                  style={{ boxShadow: `0 3px 0 ${TONE.green.sh}`, color: TONE.green.fg }}
                >
                  로그아웃
                </button>
              ) : (
                <Link href="/login?callbackUrl=%2Ffamily%2Fmembership" className={mini} style={{ boxShadow: `0 3px 0 ${TONE.green.sh}`, color: TONE.green.fg }}>
                  {auth.enabled ? "로그인" : "로그인 설정 전"}
                </Link>
              )}
            </li>
            <li className="ds-row">
              <span className="ds-k !flex-none">
                <b>기록 저장</b>
              </span>
              <span className="min-w-0 flex-1 text-right text-[14px] font-extrabold" style={{ color: sync.mode === "server" && sync.status !== "error" ? TONE.green.fg : "#5E6270" }}>
                {storageText(sync)}
              </span>
            </li>
          </ul>
        </div>

        {/* 결제 내역 — 승인이 끝난 건만 */}
        {payments.length > 0 && (
          <div className="ds-gcard ds-r" style={{ "--d": "180ms", background: "#FFFFFF", boxShadow: "0 5px 0 #E6E2DA" }}>
            <h2 className="ds-lab m-0">최근 결제 내역</h2>
            <ul className="m-0 list-none p-0">
              {payments.slice(0, 5).map((p) => (
                <li key={p.id} className="ds-row">
                  <span className="ds-k">
                    <b className="!text-[15px]">{p.orderName}</b>
                    <small>
                      {new Date(p.at).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })} · {p.easyPay || p.method || "카드"}
                      {p.demo ? " · 데모" : ""}
                    </small>
                  </span>
                  <span className="flex-none text-right">
                    <span className="ds-num block text-[15px] font-black">{fmtWon(p.amount)}</span>
                    {safeReceiptUrl(p.receiptUrl) && (
                      <a href={safeReceiptUrl(p.receiptUrl)} target="_blank" rel="noreferrer" className="inline-flex min-h-[28px] items-center text-[13px] font-extrabold underline underline-offset-2" style={{ color: TONE.green.fg }}>
                        영수증
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {payOpen && (
          <MemberPaySheet
            value={memberPay}
            whoList={payWhoOptions(group)}
            onClose={() => setPayOpen(false)}
            onSave={({ who, how }) => {
              const by = `보호자 ${meAs(auth.user, "guardian")}`;
              dispatch({ type: "setMemberPay", who, how, by });
              dispatch({ type: "pushEvent", payload: { kind: "설정", text: `멤버십 이용료 결제 방법 — ${who} · ${PAY_HOW[how]}`, color: "#8FA9CC" } });
              // 어떤 방법이든 자동 결제 등록은 관제가 연락해 안내한다 — 지금 처리할 일로 (카드도 앱 결제창에서 등록하지 않는다 · 2026-11-10)
              dispatch({ type: "addOpsMessage", payload: { from: by, role: "guardian", kind: "memberPay", text: `이용료 결제 방법 — ${who} · ${PAY_HOW[how]} · 안내 연락 부탁드립니다` } });
              setPayOpen(false);
            }}
          />
        )}
        {refundOpen && (
          <Sheet onClose={() => setRefundOpen(false)} label="환불 정책">
            <SheetTitle sub={LEGAL.reviewed ? `시행일 ${LEGAL.effective}` : "정식 판매 전 안내본"} title="환불 정책" />
            <div className="ds-acc">
              <div className="ds-accbody" style={{ paddingTop: 16 }}>
                <PolicyBody policy={policyOf("refund")} />
              </div>
            </div>
            <p className="text-[13px] font-bold leading-[1.6]" style={{ color: "#5E6270" }}>
              문의는 고객센터 <span className="whitespace-nowrap">{TEL.label}</span>
              {" · "}
              <a href="/refund" target="_blank" rel="noopener" className="inline-flex min-h-[28px] items-center underline underline-offset-2" style={{ color: TONE.green.fg }}>
                큰 화면으로 보기
              </a>
            </p>
            <WhiteBtn className="text-[16px]" onClick={() => setRefundOpen(false)}>
              닫기
            </WhiteBtn>
          </Sheet>
        )}
      </FamilyLayout>
    </>
  );
}
