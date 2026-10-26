// 어르신 마이 (2026-10-22 시제품 v17) — 아래 메뉴 오른쪽 끝. 보호자 없이도 어르신이 멤버십을 보고 직접 정한다.
//   한 달 이용료 · 이용료 결제(누가 · 어떻게 — 보호자 멤버십과 같은 값) · 결제 권한(가족 누구나 금액 제한 없이) · 가입 · 설치비 ·
//   정보 동의 · 약관(큰 글씨 — 위치 정보 갱신은 보호자 화면에도 같이 반영) · 환불 정책 · 로그인 계정.
//   맨 아래 작은 글자 — 변경 상담 · 해지 신청 · 고객센터. 셋 다 관제 '지금 처리할 일'로 가고 관제가 연락드린다.
// 해지 기준(약정 · 위약금)과 고객센터 번호 · 운영 시간은 확정 전이라 화면에 적지 않는다 (지어내지 않는다 —
// docs/kcare/decisions/2026-10-22-booking-pay.md '확인이 필요한 값').
import Link from "next/link";
import { useState } from "react";
import { BackHead, Btn, Sheet, SheetTitle, TONE, WhiteBtn } from "./ds";
import { Line } from "./clay";
import { PolicyAcc, PolicyBody } from "./Policy";
import { MemberPayCard, MemberPaySheet, PAY_HOW, PermCard, payWhoOptions } from "./MemberPay";
import { ACCESS_LOG, CONSENTS } from "../lib/mock";
import { POLICIES, policyOf } from "../lib/policies";
import { PRICING, fmtWon } from "../lib/config";
import { fmtCard } from "../lib/payments";
import { PROVIDER_LABEL, logout, useAuth } from "../lib/auth";
import { useAppState, useSync } from "../lib/state";
import { consentOn } from "../lib/consent";
import { monthlyLabel, payGroup } from "../lib/membership";

const md = (t) => new Date(t).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
const CHANGE_TOPICS = ["이용료 · 요금제", "결제일", "결제 방법", "방문 날짜 · 시간", "그 밖의 것"];
const CANCEL_REASONS = ["이용료가 부담돼요", "서비스가 맞지 않아요", "시설 · 병원에 들어가요", "그 밖의 이유"];

// 고르는 칸 — 큰 글씨 · 고르면 남색 테두리
function Pick({ on, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className="ds-press min-h-[58px] w-full rounded-[18px] px-4 text-left text-[18px] font-extrabold"
      style={on ? { background: TONE.green.bg, boxShadow: "inset 0 0 0 2.5px #1B2340", color: "#1B2340" } : { background: "#FFFFFF", boxShadow: "0 3px 0 #E3DED3", color: "#1B2340" }}
    >
      {children}
    </button>
  );
}

// 다음 결제일 — 가입일과 같은 날짜로 매달 (그 달에 그 날이 없으면 말일)
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

export default function ElderMy({ elderName, right }) {
  const { state, dispatch } = useAppState();
  const auth = useAuth();
  const sync = useSync();
  const live = !!auth.user?.household;
  const ob = state.onboarding;
  const [view, setView] = useState(null); // null | "consent"
  const [sheet, setSheet] = useState(null); // pay | refund | change | cancel | cs
  const [topic, setTopic] = useState(null);
  const [reason, setReason] = useState(null);
  const [sent, setSent] = useState(null); // 방금 보낸 요청 글
  const group = payGroup(elderName);
  const who = `어르신 ${elderName}`;
  const region = ob ? `${ob.district} · ${ob.tier === 2 ? "2급지" : "1급지"}` : null;
  const nextBill = ob?.joinedAt ? md(nextMonthly(ob.joinedAt)) : null;
  const entryPaid = (state.payments || []).some((p) => p.kind === "entry");
  const memberPay = state.memberPay || null;
  // 아직 관제가 확인하지 않은 내 요청 — 같은 요청을 거듭 보내지 않게 보여 준다
  const openAsk = (kind) => (state.opsMessages || []).find((m) => m.role === "elder" && m.kind === kind && !m.ackAt) || null;
  const close = () => {
    setSheet(null);
    setTopic(null);
    setReason(null);
    setSent(null);
  };
  const askOps = (kind, text) => {
    dispatch({ type: "addOpsMessage", payload: { from: who, role: "elder", kind, text } });
    dispatch({ type: "pushEvent", payload: { kind: "설정", text: `${who} — ${text}`, color: "#8FA9CC" } });
    setSent(text);
  };
  const mini = "ds-press ds-btn3d flex h-12 flex-none items-center gap-1 rounded-[14px] bg-white px-3.5 text-[17px] font-extrabold";
  const linkBtn = "min-h-[44px] px-2.5 text-[15px] font-bold underline underline-offset-[3px]";

  // ── 정보 동의 (보호자 정보 동의와 같은 내용 · 큰 글씨) ──
  if (view === "consent") {
    const renewedAt = state.guardian?.consentRenewedAt || null;
    const decided = state.guardian?.consents || {};
    return (
      <>
        <BackHead onBack={() => setView(null)} backLabel="마이로 돌아가기" sub="마이" title="정보 동의" h1 right={right} />
        <div className="ds-gcard ds-r" style={{ "--d": "40ms", background: TONE.blue.bg }}>
          <h2 className="ds-lab m-0" style={{ color: TONE.blue.fg, fontSize: 18 }}>
            동의한 것
          </h2>
          <ul className="m-0 list-none p-0">
            {CONSENTS.map((c) => {
              const m = c.k.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
              const title = m ? m[1] : c.k;
              const sub = m ? m[2] : "";
              const mine = decided[c.k];
              const off = c.on && !consentOn(state, c.k, c.on);
              const renewable = c.expiring && !renewedAt && !off;
              return (
                <li key={c.k} className="ds-row flex-wrap">
                  <span className="ds-k">
                    <b className="!text-[19px]">{title}</b>
                    {sub && <small className="!text-[16px]">{sub}</small>}
                  </span>
                  {off ? (
                    <span className="flex-none text-[16px] font-extrabold" style={{ color: "#5E6270" }}>
                      {mine?.on === false ? `철회 · ${md(mine.at)}` : "동의 안 함"}
                    </span>
                  ) : renewable ? (
                    <span className="flex flex-none items-center gap-2">
                      <span className="text-[16px] font-extrabold" style={{ color: "#9A5B1E" }}>
                        {c.expiring} 만료
                      </span>
                      <WhiteBtn
                        h={48}
                        r={14}
                        sh={TONE.blue.sh}
                        color={TONE.blue.fg}
                        className="px-3.5 text-[17px] font-extrabold"
                        onClick={() => {
                          // 보호자 정보 동의와 같은 값 — 보호자 화면의 '갱신 1' 배지도 같이 꺼진다
                          dispatch({ type: "guardianPatch", patch: { consentRenewedAt: Date.now() } });
                          dispatch({ type: "pushEvent", payload: { kind: "설정", text: `${title} 동의 갱신 완료 (1년 연장) — 어르신 화면`, color: "#8FA9CC" } });
                        }}
                      >
                        갱신
                      </WhiteBtn>
                    </span>
                  ) : (
                    <span className="flex-none text-right text-[16px] font-extrabold" style={{ color: c.on ? TONE.blue.fg : "#5E6270" }}>
                      {c.expiring && renewedAt ? "갱신 완료" : c.until !== "—" ? `${c.until}까지` : c.state}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="ds-gcard ds-r" style={{ "--d": "80ms", background: TONE.beige.bg }}>
          <h2 className="ds-lab m-0" style={{ color: TONE.beige.fg, fontSize: 18 }}>
            누가 봤나요
          </h2>
          {live ? (
            <p className="m-0 text-[17px] leading-[1.6]" style={{ color: "#5E4A1E" }}>
              아직 남은 기록이 없어요. 누가 기록을 열면 여기에 남아요.
            </p>
          ) : (
            <ul className="m-0 list-none p-0">
              {ACCESS_LOG.map((l, i) => (
                <li key={i} className="ds-row">
                  <span className="ds-k">
                    <b className="!text-[18px]">{l.who.replace(/\s*\(([^)]*)\)/, " · $1")}</b>
                    <small className="!text-[15px]">
                      {l.what} · {l.why}
                    </small>
                  </span>
                  <span className="ds-num flex-none text-[15px] font-extrabold">{l.at}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="ds-r ds-accbig flex flex-col gap-2.5" style={{ "--d": "110ms" }}>
          <h2 className="ds-lab m-0 pl-1" style={{ color: "#1B2340", fontSize: 18 }}>
            약관 · 정책
          </h2>
          {POLICIES.map((p) => (
            <PolicyAcc key={p.id} id={`elder-policy-${p.id}`} policy={p} />
          ))}
        </div>
        <p className="ds-r m-0 text-center text-[15px] font-bold leading-[1.6]" style={{ "--d": "130ms", color: "#5E6270" }}>
          언제든 바꿀 수 있어요 · 철회해도 기본 케어는 그대로 · 동의 철회는 주 보호자 화면에서 해요
        </p>
      </>
    );
  }

  // ── 마이 ──
  return (
    <>
      <BackHead sub={`${elderName} 님`} title="내 멤버십" size={30} h1 right={right} />
      <div className="ds-gcard ds-r" style={{ "--d": "40ms", background: TONE.beige.bg }}>
        <div className="flex items-end justify-between gap-2">
          <span>
            <span className="block text-[17px] font-extrabold" style={{ color: TONE.beige.fg }}>
              한 달 이용료
            </span>
            <span className="ds-num block text-[34px] font-black leading-[1.2]" style={{ color: "#5E4A1E" }}>
              {monthlyLabel(ob)}
            </span>
          </span>
          {region && (
            <span className="ds-gchip flex-none" style={{ color: TONE.beige.fg }}>
              {region}
            </span>
          )}
        </div>
        <div className="text-[17px] font-bold" style={{ color: "#6B5A35" }}>
          {/* 자동 청구는 아직 하지 않는다 — '매달 결제돼요'라고 하면 빠져나가는 줄 아신다 (2026-10-19 결정 #8 · 2026-10-26 점검) */}
          가입한 날짜에 매달 내는 이용료예요{nextBill ? ` · 다음 ${nextBill}` : ""} · 아직 자동으로 빠져나가지 않아요
        </div>
      </div>

      <MemberPayCard value={memberPay} big onOpen={() => setSheet("pay")}>
        {memberPay?.how === "card" && (
          <div className="text-[15px] font-bold" style={{ color: TONE.gold.sub }}>
            {state.billing ? `등록된 카드 ${fmtCard(state.billing)}` : "카드 등록은 가입 상담 때나 주 보호자 화면에서 해요"}
          </div>
        )}
      </MemberPayCard>

      <PermCard big group={group} text={
        <>
          가족 누구나
          <br />
          금액 제한 없이 결제해요
        </>
      } />

      <div className="ds-gcard ds-r" style={{ "--d": "160ms", background: TONE.green.bg, paddingTop: 6, paddingBottom: 6 }}>
        <ul className="m-0 list-none p-0">
          <li className="ds-row">
            <span className="ds-k">
              <b className="!text-[19px]">가입 · 설치비</b>
              <small className="!text-[15px]">갤럭시 Fit3 · 첫 점검 · 앱 설치</small>
            </span>
            <span className="flex-none text-right text-[16px] font-extrabold" style={{ color: TONE.green.fg }}>
              {entryPaid ? "결제 완료" : PRICING.entryFee.total != null ? fmtWon(PRICING.entryFee.total) : "상담 때 안내"}
            </span>
          </li>
          <li className="ds-row">
            <span className="ds-k">
              <b className="!text-[19px]">정보 동의 · 약관</b>
              <small className="!text-[15px]">방문 영상 · 위치 · 건강 신호</small>
            </span>
            <button type="button" onClick={() => setView("consent")} className={mini} style={{ boxShadow: `0 3px 0 ${TONE.green.sh}`, color: TONE.green.fg }}>
              보기 <Line name="chevR" size={18} />
            </button>
          </li>
          <li className="ds-row">
            <span className="ds-k">
              <b className="!text-[19px]">환불 정책</b>
            </span>
            <button type="button" onClick={() => setSheet("refund")} className={mini} style={{ boxShadow: `0 3px 0 ${TONE.green.sh}`, color: TONE.green.fg }}>
              보기 <Line name="chevR" size={18} />
            </button>
          </li>
          <li className="ds-row">
            <span className="ds-k">
              <b className="!text-[19px]">로그인 계정</b>
              {auth.user && (
                <small className="!text-[15px]">
                  {auth.user.name}
                  {auth.user.provider ? ` · ${PROVIDER_LABEL[auth.user.provider] || auth.user.provider}` : ""}
                </small>
              )}
            </span>
            {auth.user ? (
              <button
                type="button"
                onClick={async () => {
                  await sync.flush?.();
                  logout("/login");
                }}
                className={mini}
                style={{ boxShadow: `0 3px 0 ${TONE.green.sh}`, color: TONE.green.fg }}
              >
                로그아웃
              </button>
            ) : (
              <Link href="/login?callbackUrl=%2Felder" className={mini} style={{ boxShadow: `0 3px 0 ${TONE.green.sh}`, color: TONE.green.fg }}>
                {auth.enabled ? "로그인" : "로그인 설정 전"}
              </Link>
            )}
          </li>
        </ul>
      </div>

      {/* 맨 아래 작은 글자 — 변경 상담 · 해지 신청 · 고객센터 (시제품 결정) */}
      <nav aria-label="멤버십 상담" className="ds-r flex flex-wrap items-center justify-center gap-1 pt-1" style={{ "--d": "200ms", color: "#5E6270" }}>
        <button type="button" onClick={() => setSheet("change")} className={linkBtn}>
          변경 상담
        </button>
        <span aria-hidden="true" style={{ color: "#C9C2B4" }}>
          |
        </span>
        <button type="button" onClick={() => setSheet("cancel")} className={linkBtn}>
          해지 신청
        </button>
        <span aria-hidden="true" style={{ color: "#C9C2B4" }}>
          |
        </span>
        <button type="button" onClick={() => setSheet("cs")} className={linkBtn}>
          고객센터
        </button>
      </nav>

      {sheet === "pay" && (
        <MemberPaySheet
          big
          value={memberPay}
          whoList={payWhoOptions(group)}
          onClose={close}
          onSave={({ who: payer, how }) => {
            dispatch({ type: "setMemberPay", who: payer, how, by: who });
            dispatch({ type: "pushEvent", payload: { kind: "설정", text: `멤버십 이용료 결제 방법 — ${payer} · ${PAY_HOW[how]} (어르신 화면)`, color: "#8FA9CC" } });
            // 계좌 자동이체 · 무통장 입금은 관제가 연락해 안내한다 — 지금 처리할 일로
            if (how !== "card") dispatch({ type: "addOpsMessage", payload: { from: who, role: "elder", kind: "memberPay", text: `이용료 결제 방법 — ${payer} · ${PAY_HOW[how]} · 안내 연락 부탁드립니다` } });
            close();
          }}
        />
      )}

      {sheet === "refund" && (
        <Sheet onClose={close} label="환불 정책">
          <SheetTitle sub="초안 · 법무 검토 전" title="환불 정책" />
          <div className="ds-acc ds-accbig">
            <div className="ds-accbody" style={{ paddingTop: 16 }}>
              <PolicyBody policy={policyOf("refund")} />
            </div>
          </div>
          <p className="m-0 text-[15px]" style={{ color: "#5E6270" }}>
            노란 칸은 아직 정해지지 않은 값이에요.
          </p>
          <WhiteBtn h={60} className="w-full text-[19px] font-extrabold" onClick={close}>
            닫기
          </WhiteBtn>
        </Sheet>
      )}

      {sheet === "change" && (
        <Sheet onClose={close} label="변경 상담">
          <SheetTitle sub="상담 요청" title="무엇을 바꿀까요" />
          {sent ? (
            <p role="status" className="m-0 rounded-[18px] px-4 py-3.5 text-[18px] font-extrabold" style={{ background: TONE.green.bg, color: TONE.green.fg }}>
              상담을 요청했어요 · 관제센터가 연락드려요
            </p>
          ) : (
            <>
              {openAsk("membership") && (
                <p className="m-0 text-[16px] font-bold" style={{ color: "#5E6270" }}>
                  {md(openAsk("membership").at)}에 남긴 요청을 관제가 확인하고 있어요
                </p>
              )}
              <div role="group" aria-label="무엇을 바꿀까요" className="flex flex-col gap-2">
                {CHANGE_TOPICS.map((t) => (
                  <Pick key={t} on={topic === t} onClick={() => setTopic(t)}>
                    {t}
                  </Pick>
                ))}
              </div>
              <Btn tone="navy" h={66} className="w-full text-[20px] font-extrabold" disabled={!topic} onClick={() => askOps("membership", `멤버십 변경 상담 요청 — ${topic} · 연락 부탁드립니다`)}>
                상담 요청하기
              </Btn>
            </>
          )}
          <WhiteBtn h={60} className="w-full text-[19px] font-extrabold" onClick={close}>
            닫기
          </WhiteBtn>
        </Sheet>
      )}

      {sheet === "cancel" && (
        <Sheet onClose={close} label="해지 신청">
          <SheetTitle sub="멤버십" title="해지 신청" />
          {sent ? (
            <p role="status" className="m-0 rounded-[18px] px-4 py-3.5 text-[18px] font-extrabold" style={{ background: TONE.green.bg, color: TONE.green.fg }}>
              {/상담/.test(sent) ? "상담을 요청했어요" : "해지 신청을 받았어요"} · 관제센터가 연락드려요
            </p>
          ) : (
            <>
              <p className="m-0 rounded-[18px] bg-white px-4 py-3.5 text-[17px] font-bold leading-[1.6]">
                신청하면 관제센터가 연락드려 약정 · 환불을 안내해 드려요. 연락 전에는 아무것도 바뀌지 않아요.
              </p>
              {openAsk("membership") && (
                <p className="m-0 text-[16px] font-bold" style={{ color: "#5E6270" }}>
                  {md(openAsk("membership").at)}에 남긴 요청을 관제가 확인하고 있어요
                </p>
              )}
              <div role="group" aria-label="해지하는 이유 (선택)" className="flex flex-col gap-2">
                <div className="text-[17px] font-extrabold">
                  해지하는 이유 <small className="text-[14px] font-bold" style={{ color: "#6B6658" }}>선택</small>
                </div>
                {CANCEL_REASONS.map((t) => (
                  <Pick key={t} on={reason === t} onClick={() => setReason(reason === t ? null : t)}>
                    {t}
                  </Pick>
                ))}
              </div>
              <Btn tone="green" h={64} className="w-full text-[19px] font-extrabold" onClick={() => askOps("membership", `멤버십 해지 상담 요청${reason ? ` — ${reason}` : ""} · 연락 부탁드립니다`)}>
                상담 먼저 받아 볼게요
              </Btn>
              <WhiteBtn h={58} className="w-full text-[18px] font-extrabold" onClick={() => askOps("membership", `멤버십 해지 신청${reason ? ` — ${reason}` : ""} · 연락 부탁드립니다`)}>
                해지 신청하기
              </WhiteBtn>
            </>
          )}
          <WhiteBtn h={60} className="w-full text-[19px] font-extrabold" onClick={close}>
            닫기
          </WhiteBtn>
        </Sheet>
      )}

      {sheet === "cs" && (
        <Sheet onClose={close} label="고객센터">
          <SheetTitle sub="K-CARE" title="고객센터" />
          {sent ? (
            <p role="status" className="m-0 rounded-[18px] px-4 py-3.5 text-[18px] font-extrabold" style={{ background: TONE.green.bg, color: TONE.green.fg }}>
              전화 부탁을 남겼어요 · 관제센터가 전화드려요
            </p>
          ) : (
            <>
              <p className="m-0 rounded-[18px] bg-white px-4 py-3.5 text-[17px] font-bold leading-[1.6]">
                궁금한 것이 있으면 남겨 주세요. 관제센터가 전화드려요. 급한 일은 홈의 &lsquo;도와줘요&rsquo;를 눌러 주세요.
              </p>
              {openAsk("cs") ? (
                <p className="m-0 text-[16px] font-bold" style={{ color: "#5E6270" }}>
                  {md(openAsk("cs").at)}에 남긴 전화 부탁을 관제가 확인하고 있어요
                </p>
              ) : (
                <Btn tone="navy" h={66} className="w-full text-[20px] font-extrabold" onClick={() => askOps("cs", "고객센터 — 전화 부탁드립니다")}>
                  전화 부탁하기
                </Btn>
              )}
            </>
          )}
          <WhiteBtn h={60} className="w-full text-[19px] font-extrabold" onClick={close}>
            닫기
          </WhiteBtn>
        </Sheet>
      )}
    </>
  );
}
