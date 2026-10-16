import Head from "next/head";
import FamilyLayout from "../../components/FamilyLayout";
import { PolicyAcc } from "../../components/Policy";
import { TONE, WhiteBtn } from "../../components/ds";
import { ACCESS_LOG, CONSENTS } from "../../lib/mock";
import { POLICIES } from "../../lib/policies";
import { useAppState } from "../../lib/state";
import { useAuth } from "../../lib/auth";

// 마이 › 정보 동의 (2026-10-15 디자인 시안) — 신뢰 센터: 어떤 동의가 있고, 누가 언제 우리 가족 데이터를 봤는지 전부 공개.
// 동의 갱신은 가구 상태(state.guardian.consentRenewedAt)에 남긴다 — 마이 '정보 동의' 칸의 '갱신 1' 배지가 같이 꺼진다.
// 약관 · 정책은 법무 검토 전 초안 (lib/policies.js) — '초안'과 확인 필요 칸을 그대로 보인다.
// 테스트 가구 · 센터 공간에는 예시 접근 기록을 보이지 않는다 (없는 열람을 있었던 것처럼 쓰지 않는다).
export default function ConsentPage() {
  const { state, dispatch } = useAppState();
  const live = !!useAuth().user?.household;
  const renewedAt = state.guardian?.consentRenewedAt || null;
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
              const renewable = c.expiring && !renewedAt;
              return (
                <li key={c.k} className="ds-row">
                  <span className="ds-k">
                    <b>{title}</b>
                    {sub && <small>{sub}</small>}
                  </span>
                  {renewable ? (
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
          언제든 바꿀 수 있어요 · 만료 30일 전 미리 알려 드려요 · 철회해도 기본 케어는 그대로 · 탈퇴하면 24시간 안에 삭제
        </p>
      </FamilyLayout>
    </>
  );
}
