import Head from "next/head";
import { useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { PolicyAcc } from "../../components/Policy";
import { Btn, TONE, WhiteBtn } from "../../components/ds";
import { ACCESS_LOG, CONSENTS } from "../../lib/mock";
import { POLICIES } from "../../lib/policies";
import { useAppState } from "../../lib/state";
import { useGuardianRole } from "../../lib/guardian-role";
import { useAuth } from "../../lib/auth";
import { CONSENT_WITHDRAW } from "../../lib/lifecycle";
import { meOf } from "../../lib/membership";
import { consentOn } from "../../lib/consent";

// 동의 철회 (2026-10-18) — '언제든 바꿀 수 있어요'라고 적어 두고 무를 화면이 없었다. 규칙은 lib/lifecycle.js CONSENT_WITHDRAW 그대로:
// 접수 즉시 효력 · 못 하게 되는 것을 먼저 알리고 다시 묻는다 · 지난 기록 파기는 따로 고른다 · 재동의를 조르지 않는다.
// 철회하면 못 하게 되는 것 — 그 표의 문장을 그대로 쓴다 (지어내지 않는다)
const WITHDRAW_ROW = { "위치 정보 (동행 중)": "위치 정보 (실종 대응)", "방문기록 영상 (요약 30초)": "방문 영상 기록", "건강 신호 (워치)": "웨어러블 착용 · 활동 수집" };
const effectOf = (k) => CONSENT_WITHDRAW.items.find((i) => i.k === WITHDRAW_ROW[k])?.effect || null;
const md = (t) => new Date(t).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });

// 마이 › 정보 동의 (2026-10-15 디자인 시안) — 신뢰 센터: 어떤 동의가 있고, 누가 언제 우리 가족 데이터를 봤는지 전부 공개.
// 동의 철회 · 다시 동의는 state.guardian.consents 에 남고 관제 '지금 처리할 일'에 연락이 간다 (2026-10-18).
// 동의 갱신은 가구 상태(state.guardian.consentRenewedAt)에 남긴다 — 마이 '정보 동의' 칸의 '갱신 1' 배지가 같이 꺼진다.
// 약관 · 정책은 법무 검토 전 초안 (lib/policies.js) — '초안'과 확인 필요 칸을 그대로 보인다.
// 테스트 가구 · 센터 공간에는 예시 접근 기록을 보이지 않는다 (없는 열람을 있었던 것처럼 쓰지 않는다).
export default function ConsentPage() {
  const { state, dispatch } = useAppState();
  const auth = useAuth();
  const live = !!auth.user?.household;
  const me = meOf(auth.user);
  // 동의 · 철회 · 갱신은 주 보호자만 — 계약 · 법적 동의의 단일 주체 (docs/kcare/guardian-invite-policy.md · 2026-10-19 점검)
  const { isPrimary } = useGuardianRole();
  const renewedAt = state.guardian?.consentRenewedAt || null;
  const decided = state.guardian?.consents || {};
  const [asking, setAsking] = useState(null); // 철회를 묻고 있는 동의 k
  const [purge, setPurge] = useState("keep");
  const withdraw = (c, title) => {
    const effect = effectOf(c.k);
    dispatch({ type: "setConsent", k: c.k, on: false, purge, by: me.name });
    // 관제가 알아야 실제로 멈춘다 (위치 · 영상은 서면 확인 연락) — 지금 처리할 일에 뜬다
    dispatch({
      type: "addOpsMessage",
      payload: {
        from: `보호자 ${me.name}`,
        role: "guardian",
        text: `동의 철회 — ${title}${purge === "delete" ? " · 지난 기록 파기 요청" : " · 지난 기록 보관"}${effect && /서면/.test(effect) ? " · 서면 확인 필요" : ""}`,
      },
    });
    dispatch({ type: "pushEvent", payload: { kind: "설정", text: `${title} 동의 철회 접수`, color: "#8FA9CC" } });
    setAsking(null);
    setPurge("keep");
  };
  const nextYear = (until) => {
    const [y, m] = String(until).split(".");
    return y && m ? `${Number(y) + 1}.${m}` : "1년 연장";
  };

  return (
    <>
      <Head>
        <title>정보 동의 — K-CARE</title>
      </Head>
      <FamilyLayout back="/family/my" backLabel="마이로 돌아가기" sub="마이" title="정보 동의">
        <div className="ds-gcard ds-r" style={{ "--d": "40ms", background: TONE.blue.bg }}>
          <h2 className="ds-lab m-0" style={{ color: TONE.blue.fg }}>
            동의한 것
          </h2>
          <ul className="m-0 list-none p-0">
            {CONSENTS.map((c) => {
              const m = c.k.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
              const title = m ? m[1] : c.k;
              const sub = m ? m[2] : "";
              const mine = decided[c.k];
              const effect = effectOf(c.k);
              // 계속 유지되는 동의만 철회 · 다시 동의 (건별 동의는 그때그때). 지금 값은 철회 기록 · 가입 상담 값 · 예시 순 (lib/consent.js)
              const standing = !!effect;
              const off = standing && !consentOn(state, c.k, c.on); // 철회했거나 가입 때 동의하지 않음
              const renewable = isPrimary && c.expiring && !renewedAt && !off;
              const canWithdraw = isPrimary && standing && !off;
              return (
                <li key={c.k} className="ds-row flex-wrap">
                  <span className="ds-k">
                    <b>{title}</b>
                    {sub && <small>{sub}</small>}
                  </span>
                  {off ? (
                    <span className="flex flex-none items-center gap-2">
                      <span className="text-[14px] font-extrabold" style={{ color: "#5E6270" }}>
                        {mine?.on === false ? `철회 · ${md(mine.at)}` : "동의 안 함"}
                      </span>
                      {isPrimary && (
                        <WhiteBtn
                          h={40}
                          r={12}
                          sh={TONE.blue.sh}
                          color={TONE.blue.fg}
                          className="px-3 text-[14px]"
                          onClick={() => {
                            dispatch({ type: "setConsent", k: c.k, on: true, by: me.name });
                            dispatch({ type: "pushEvent", payload: { kind: "설정", text: `${title} ${mine?.on === false ? "다시 동의" : "동의"}`, color: "#8FA9CC" } });
                          }}
                        >
                          {mine?.on === false ? "다시 동의" : "동의하기"}
                        </WhiteBtn>
                      )}
                    </span>
                  ) : renewable ? (
                    <span className="flex flex-none items-center gap-2">
                      <span className="text-[14px] font-extrabold" style={{ color: "#9A5B1E" }}>
                        {c.expiring} 만료
                      </span>
                      <WhiteBtn
                        h={40}
                        r={12}
                        sh={TONE.blue.sh}
                        color={TONE.blue.fg}
                        className="px-3 text-[14px]"
                        onClick={() => {
                          dispatch({ type: "guardianPatch", patch: { consentRenewedAt: Date.now() } });
                          dispatch({ type: "pushEvent", payload: { kind: "설정", text: `${title} 동의 갱신 완료 (1년 연장)`, color: "#8FA9CC" } });
                        }}
                      >
                        갱신
                      </WhiteBtn>
                    </span>
                  ) : (
                    <span className="flex-none text-right text-[14px] font-extrabold" style={{ color: c.on ? TONE.blue.fg : "#5E6270" }}>
                      {c.expiring && renewedAt ? `갱신 완료 · ${nextYear(c.until)}까지` : c.until !== "—" ? `${c.until}까지` : c.state}
                    </span>
                  )}
                  {canWithdraw && asking !== c.k && (
                    <button
                      type="button"
                      onClick={() => {
                        setAsking(c.k);
                        setPurge("keep");
                      }}
                      aria-label={`${title} 동의 철회`}
                      className="min-h-[40px] basis-full text-right text-[14px] font-extrabold underline underline-offset-2"
                      style={{ color: "#5E6270" }}
                    >
                      동의 철회
                    </button>
                  )}
                  {canWithdraw && asking === c.k && (
                    <div role="group" aria-label={`${title} 동의 철회`} className="flex basis-full flex-col gap-2.5 rounded-[18px] bg-white p-3.5">
                      <p className="text-[15px] leading-[1.6]">
                        철회하면 달라지는 것 — <b>{effect}</b>. 철회는 바로 효력이 생기고, 기본 케어는 그대로입니다.
                        {/서면/.test(effect) ? " 서면 확인이 필요한 항목이라 관제가 확인 연락을 드립니다." : ""}
                      </p>
                      <fieldset className="flex flex-col gap-1.5">
                        <legend className="mb-1 text-[14px] font-extrabold">지금까지 모은 기록은</legend>
                        {[
                          ["keep", "보관합니다 (기본)"],
                          ["delete", "파기를 요청합니다 — 관제가 처리하고 알려 드립니다"],
                        ].map(([v, l]) => (
                          <label key={v} className="flex min-h-[40px] items-center gap-2 text-[14px]">
                            <input type="radio" name={`purge-${c.k}`} value={v} checked={purge === v} onChange={() => setPurge(v)} className="h-[18px] w-[18px]" />
                            {l}
                          </label>
                        ))}
                      </fieldset>
                      <div className="grid grid-cols-[1fr_2fr] gap-2">
                        <WhiteBtn h={48} className="text-[15px]" onClick={() => setAsking(null)}>
                          그대로 두기
                        </WhiteBtn>
                        <Btn tone="navy" h={48} className="text-[15px]" onClick={() => withdraw(c, title)}>
                          동의 철회하기
                        </Btn>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="ds-gcard ds-r" style={{ "--d": "80ms", background: TONE.beige.bg }}>
          <h2 className="ds-lab m-0" style={{ color: TONE.beige.fg }}>
            누가 봤나요
          </h2>
          {live ? (
            <p className="text-[15px] leading-[1.6]" style={{ color: "#5E4A1E" }}>
              아직 남은 접근 기록이 없습니다. 누가 우리 가족 기록을 열면 여기에 남습니다.
            </p>
          ) : (
            <ul className="m-0 list-none p-0">
              {ACCESS_LOG.map((l, i) => (
                <li key={i} className="ds-row">
                  <span className="ds-k">
                    <b>{l.who.replace(/\s*\(([^)]*)\)/, " · $1")}</b>
                    <small>
                      {l.what} · {l.why}
                    </small>
                  </span>
                  <span className="ds-num flex-none text-[14px] font-extrabold">{l.at}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="ds-r flex flex-col gap-2.5" style={{ "--d": "120ms" }}>
          <h2 className="ds-lab m-0" style={{ color: "#3A3F50" }}>
            약관 · 정책
          </h2>
          {POLICIES.map((p) => (
            <PolicyAcc key={p.id} id={`policy-${p.id}`} policy={p} />
          ))}
          <p className="px-1 text-[13px] leading-[1.6]" style={{ color: "#5E6270" }}>
            &lsquo;초안&rsquo;은 법무 검토 전입니다. 노란 칸은 아직 정해지지 않은 값이에요.
          </p>
        </div>

        <p className="ds-r px-1 text-[14px] font-bold leading-[1.6]" style={{ "--d": "140ms", color: "#5E6270" }}>
          {isPrimary ? "언제든 바꿀 수 있어요" : "동의 · 철회 · 갱신은 주 보호자가 해요"} · 만료 30일 전 미리 알려 드려요 · 철회해도 기본 케어는 그대로 · 탈퇴하면 24시간 안에 삭제
        </p>
      </FamilyLayout>
    </>
  );
}
