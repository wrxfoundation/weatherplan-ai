import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { PolicyBody } from "../../components/Policy";
import { Line } from "../../components/clay";
import { Btn, Sheet, SheetTitle, TONE, WhiteBtn } from "../../components/ds";
import { ELDER } from "../../lib/mock";
import { PRICING, fmtWon } from "../../lib/config";
import { fmtCard, payHref, safeReceiptUrl } from "../../lib/payments";
import { PROVIDER_LABEL, logout, useAuth } from "../../lib/auth";
import { elderNameOf, meAs } from "../../lib/people";
import { storageText, useAppState, useSync } from "../../lib/state";
import { useGuardianRole } from "../../lib/guardian-role";
import { videoConsentOf } from "../../lib/consent";
import { monthlyLabel, payGroup } from "../../lib/membership";
import { MemberPayCard, MemberPaySheet, PAY_HOW, PermCard, payWhoOptions } from "../../components/MemberPay";
import { policyOf } from "../../lib/policies";

// 마이 › 멤버십 (2026-10-15 디자인 시안) — 월 구독료 · 이용료 결제 · 결제 권한 · 가입 및 설치비 · 동의 · 환불 정책 · 로그인 계정.
// 전에 마이의 '결제 관리' 시트와 '멤버십' 카드에 있던 것을 한 화면에 모았다 (기능은 그대로).
// 2026-10-22 시제품 v17 — 이용료 결제(누가 · 어떻게)는 어르신 마이와 같은 값(state.memberPay · components/MemberPay.jsx),
// 결제 권한은 '가족 누구나 금액 제한 없이' 한 줄 + 가족 칩 (하루 한도 · 보호자 승인 단계와 바꾸기 시트는 없앴다).
// 카드 등록은 토스페이먼츠 결제창 (/pay) 한 곳 — 카드정보는 K-CARE 서버에 저장되지 않는다.
// 가입 및 설치비는 확정 전이면 결제 버튼을 열지 않는다 (2026-10-02 케어박스 제외 · lib/config.js).
// 시안의 산호색(결제수단 카드 · 카드 등록 버튼)은 금색으로 — 빨강 계열은 위험 신호 전용.

const md = (t) => new Date(t).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });

// 가입일 기준 다음 달 결제일 — 오늘 이후 첫 날짜. 그 달에 같은 날이 없으면 말일로 맞춘다
function nextMonthly(joinedAt, now = Date.now()) {
  const j = new Date(joinedAt);
  const day = j.getDate();
  for (let k = 1; k < 600; k++) {
    const d = new Date(j.getFullYear(), j.getMonth() + k, 1);
    d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
    if (d.getTime() > now) return d;
  }
  return j;
}

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
  const billing = state.billing;
  const memberPay = state.memberPay || null;
  const group = payGroup(elderNameOf(ob));
  const region = ob ? `${ob.district} · ${ob.tier === 2 ? "2급지" : "1급지"}` : `${ELDER.district} · 1급지`;
  // 다음 결제일 — 가입일과 같은 날짜로 매달, 그 달에 그 날이 없으면 말일 (1월 31일 → 2월 28일 · 전에는 3월 3일로 넘쳤다 · 2026-10-19 점검)
  const nextBill = ob?.joinedAt ? nextMonthly(ob.joinedAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric" }) : null;
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
          <div className="flex items-start justify-between gap-2">
            <span>
              <span className="block text-[15px] font-extrabold" style={{ color: TONE.beige.fg }}>
                월 구독료
              </span>
              <span className="ds-num block text-[32px] font-black leading-[1.2]">{monthlyLabel(ob)}</span>
            </span>
            <span className="ds-gchip flex-none" style={{ color: TONE.beige.fg }}>
              {region}
            </span>
          </div>
          <div className="text-[15px] font-bold" style={{ color: "#6B5A35" }}>
            가입일 기준 매월 결제{nextBill ? ` · 다음 결제 ${nextBill}` : ""} · 최소 약정 {PRICING.subscription.term}개월
          </div>
        </div>

        {/* 이용료 결제 — 누가 · 어떻게 (어르신 마이와 같은 값). 카드로 정했으면 카드 등록 · 바꾸기는 주 보호자만 —
            계약 · 정기 결제의 단일 주체 (docs/kcare/guardian-invite-policy.md · 2026-10-19 점검) */}
        <MemberPayCard value={memberPay} onOpen={() => setPayOpen(true)}>
          {(!memberPay || memberPay.how === "card") && (
            <div className="flex items-center justify-between gap-2 rounded-[14px] bg-white px-3 py-2.5">
              <span className="text-[14px] font-bold" style={{ color: "#5E6270" }}>
                {billing ? `등록된 카드 ${fmtCard(billing)}` : "등록된 카드 없음"}
              </span>
              {isPrimary ? (
                <Link
                  href={payHref({ kind: "billing", orderName: "월 구독료 자동결제" })}
                  className="ds-press ds-btn3d flex h-10 flex-none items-center rounded-[14px] px-3.5 text-[14px] font-extrabold"
                  style={{ background: TONE.gold.solid, boxShadow: `0 3px 0 ${TONE.gold.solidSh}`, color: TONE.gold.solidFg }}
                >
                  {billing ? "카드 바꾸기" : "카드 등록하기"}
                </Link>
              ) : (
                <span className="flex-none text-[13px] font-bold" style={{ color: "#5E6270" }}>
                  등록은 주 보호자
                </span>
              )}
            </div>
          )}
          <div className="text-center text-[13px] font-bold" style={{ color: "#6B5A35" }}>
            토스페이먼츠 · 카드정보는 K-CARE 서버에 저장되지 않아요 · 자동 청구는 아직 하지 않아요
          </div>
        </MemberPayCard>

        <PermCard group={group} text="가족 누구나 금액 제한 없이 결제해요" />

        <div className="ds-gcard ds-r" style={{ "--d": "160ms", background: TONE.green.bg, paddingTop: 8, paddingBottom: 8 }}>
          <ul className="m-0 list-none p-0">
            <li className="ds-row">
              <span className="ds-k">
                <b>가입 · 설치비</b>
                <small>갤럭시 Fit3 · 첫 21항목 점검 · 앱 설치 (처음 한 번)</small>
              </span>
              {entryPaid ? (
                <span className="flex-none text-[14px] font-extrabold" style={{ color: TONE.green.fg }}>
                  결제 완료
                </span>
              ) : PRICING.entryFee.total != null && isPrimary ? (
                <Link href={payHref({ kind: "entry", amount: PRICING.entryFee.total, orderName: "K-CARE 가입 및 설치비" })} className={mini} style={{ boxShadow: `0 3px 0 ${TONE.green.sh}`, color: TONE.green.fg }}>
                  {fmtWon(PRICING.entryFee.total)} 결제
                </Link>
              ) : (
                <span className="flex-none text-right text-[14px] font-extrabold" style={{ color: TONE.green.fg }}>
                  배정 상담 때 안내
                </span>
              )}
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
            {/* 해지 · 변경 — 해지 기준(약정 · 위약금)이 확정 전이라 앱에서 바로 해지하지 않고 상담을 요청한다 (2026-10-18).
                요청은 관제 '지금 처리할 일'에 뜨고, 관제가 확인하면 다시 요청할 수 있다 */}
            <li className="ds-row flex-wrap">
              <span className="ds-k">
                <b>해지 · 변경 상담</b>
                <small>{cancelAsk ? `${md(cancelAsk.at)} 요청 · ${cancelAsk.ackAt ? "관제 확인 — 연락드립니다" : "관제 확인 전"}` : "해지 기준은 확정 전이라 상담으로 안내해 드려요"}</small>
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
                  <div role="group" aria-label="무엇을 상담할까요" className="flex flex-wrap gap-1.5">
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
                  </div>
                  <p className="text-[14px] leading-[1.6]" style={{ color: "#5E6270" }}>
                    요청하면 관제가 연락드려 약정 · 환불을 안내합니다. 상담 전에는 아무것도 바뀌지 않습니다.
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
              // 계좌 자동이체 · 무통장 입금은 관제가 연락해 안내한다 — 지금 처리할 일로
              if (how !== "card") dispatch({ type: "addOpsMessage", payload: { from: by, role: "guardian", kind: "memberPay", text: `이용료 결제 방법 — ${who} · ${PAY_HOW[how]} · 안내 연락 부탁드립니다` } });
              setPayOpen(false);
            }}
          />
        )}
        {refundOpen && (
          <Sheet onClose={() => setRefundOpen(false)} label="환불 정책">
            <SheetTitle sub="초안 · 법무 검토 전" title="환불 정책" />
            <div className="ds-acc">
              <div className="ds-accbody" style={{ paddingTop: 16 }}>
                <PolicyBody policy={policyOf("refund")} />
              </div>
            </div>
            <p className="text-[13px]" style={{ color: "#5E6270" }}>
              노란 칸은 아직 정해지지 않은 값이에요.
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
