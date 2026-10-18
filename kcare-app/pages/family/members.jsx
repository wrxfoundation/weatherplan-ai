import Head from "next/head";
import { useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import InviteLink from "../../components/InviteLink";
import { Line } from "../../components/clay";
import { Btn, Card, TONE, WhiteBtn } from "../../components/ds";
import { INVITE } from "../../lib/mock";
import { useAppState } from "../../lib/state";
import { useAuth } from "../../lib/auth";
import { familyOf, meOf, shortName } from "../../lib/membership";

// 마이 › 가족 (2026-10-15 디자인 시안) — 가족 구성원 · 초대. 주 보호자가 초대 링크를 만들고, 부 보호자는 보기만 한다.
// 관제 센터 회원은 실제 초대 링크 (2026-10-14 · components/InviteLink.jsx), 데모는 링크 발급 시늉만 한다.
// 센터 공간은 그 센터에 가입 · 승인된 보호자만 보인다 (lib/membership.js familyOf).
// 구성원 빼기 (2026-10-18) — 주 보호자가 '빼기 요청'을 보내면 관제가 계정 · 권한에서 사용을 멈춘다('다시 사용'으로 되돌린다).
// 주 · 부 보호자 구분이 서버 계정에 없어서 보호자 화면에서 바로 빼지 않는다 — 다른 보호자를 잘못 막는 일이 없게.
export default function MembersPage() {
  const { state, dispatch } = useAppState();
  const auth = useAuth();
  const me = meOf(auth.user);
  const family = familyOf(me);
  const member = auth.user?.provider === "member";
  const isPrimary = (state.demo.guardianRole || "primary") === "primary";
  // 센터 회원은 명단 맨 앞(주 보호자 표시)이 나일 때만 — 데모는 보는 역할(주 · 부)대로
  const canAskRemove = member ? family[0]?.name === me.name : isPrimary;
  const removeAsks = (state.opsMessages || []).filter((m) => m.kind === "member");
  const [invited, setInvited] = useState(false);
  const [confirm, setConfirm] = useState(null); // 빼기 요청을 묻는 사람 이름

  return (
    <>
      <Head>
        <title>가족 — K-CARE</title>
      </Head>
      <FamilyLayout
        back="/family/my"
        backLabel="마이로 돌아가기"
        sub="마이"
        title="가족"
        action={
          <span className="ds-gchip flex-none" style={{ background: TONE.green.bg, color: TONE.green.fg }}>
            {family.length} / 5명
          </span>
        }
      >
        <div className="ds-gcard ds-r" style={{ "--d": "40ms", background: TONE.green.bg }}>
          {family.length === 0 ? (
            <p className="text-[16px]" style={{ color: TONE.green.fg }}>
              아직 이 센터에 승인된 보호자가 없습니다.
            </p>
          ) : (
            <ul className="m-0 list-none p-0">
              {family.map((g) => {
                const ask = removeAsks.find((m) => m.target === g.name);
                const removable = canAskRemove && !g.isPrimary && g.name !== me.name;
                return (
                  <li key={g.name} className="ds-row flex-wrap">
                    <span aria-hidden="true" className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white text-[14px] font-extrabold" style={{ color: TONE.green.fg }}>
                      {shortName(g.name)}
                    </span>
                    <span className="ds-k">
                      <b>{g.name}</b>
                      <small>{ask ? (ask.ackAt ? "빼기 요청 · 관제 확인함" : "빼기 요청됨 · 관제 확인 전") : String(g.relation || "").split(" · ")[0]}</small>
                    </span>
                    {removable && !ask && confirm !== g.name ? (
                      <button
                        type="button"
                        onClick={() => setConfirm(g.name)}
                        aria-label={`${g.name} 가족에서 빼기 요청`}
                        className="ds-press min-h-[44px] flex-none rounded-full bg-white px-3 text-[13px] font-extrabold"
                        style={{ color: "#5E6270" }}
                      >
                        빼기 요청
                      </button>
                    ) : (
                      <span
                        className="flex-none rounded-full px-3 py-1 text-[13px] font-extrabold"
                        style={g.isPrimary ? { background: TONE.green.fg, color: "#FFFFFF" } : { background: "#FFFFFF", color: TONE.green.fg }}
                      >
                        {g.isPrimary ? "주 보호자" : "부 보호자"}
                      </span>
                    )}
                    {confirm === g.name && (
                      <div className="ds-swap flex w-full basis-full flex-col gap-2.5 rounded-[18px] bg-white p-3.5">
                        <p className="text-[15px] leading-[1.6]">
                          {g.name} 님을 가족에서 빼 달라고 관제에 요청할까요? 관제가 확인하고 사용을 멈춥니다 — 지난 기록은 그대로 남고, 다시 쓰게 할 수도 있습니다.
                        </p>
                        <div className="grid grid-cols-[1fr_2fr] gap-2">
                          <WhiteBtn h={50} className="text-[15px]" onClick={() => setConfirm(null)}>
                            아니요
                          </WhiteBtn>
                          <Btn
                            tone="navy"
                            h={50}
                            className="text-[15px]"
                            onClick={() => {
                              dispatch({
                                type: "addOpsMessage",
                                payload: { from: `보호자 ${auth.user?.name || me.name}`, role: "guardian", kind: "member", target: g.name, text: `가족 구성원 빼기 요청 — ${g.name} 님` },
                              });
                              dispatch({ type: "pushEvent", payload: { kind: "설정", text: `가족 구성원 빼기 요청 — ${g.name} 님`, color: "#8FA9CC" } });
                              setConfirm(null);
                            }}
                          >
                            네, 요청합니다
                          </Btn>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {auth.user?.provider === "member" ? (
          // 관제 센터 회원 — 실제 초대 링크
          <div className="ds-r" style={{ "--d": "80ms" }}>
            <InviteLink variant="guardian" fromName={auth.user?.name || ""} />
          </div>
        ) : isPrimary ? (
          <div className="ds-r flex flex-col gap-2" style={{ "--d": "80ms" }}>
            {invited ? (
              <div className="ds-swap flex items-center gap-3 rounded-[22px] p-4" style={{ background: TONE.green.bg }}>
                <span className="ds-pop flex h-11 w-11 flex-none items-center justify-center rounded-full text-white" style={{ background: TONE.green.solid }}>
                  <Line name="check" size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block text-[16px] font-extrabold" style={{ color: TONE.green.fg }}>
                    초대 링크를 만들었어요
                  </b>
                  <span className="block break-all text-[14px]" style={{ color: TONE.green.sub }}>
                    {INVITE.link} · 데모
                  </span>
                </span>
              </div>
            ) : (
              <Btn
                tone="green"
                h={60}
                r={20}
                className="text-[17px]"
                onClick={() => {
                  setInvited(true);
                  dispatch({ type: "pushEvent", payload: { kind: "초대", text: "부 보호자 초대 링크 발급 (7일 · 1회용)", color: "#8FA9CC" } });
                }}
              >
                부 보호자 초대 링크 만들기
              </Btn>
            )}
            <p className="px-1 text-[13px] leading-[1.7]" style={{ color: "#5E6270" }}>
              {INVITE.rule}. 참여자는 이름·관계·연락처만 입력하고 결제수단은 필요 없습니다. 구성원을 빼려면 이름 옆 &lsquo;빼기 요청&rsquo; — 주 보호자만 할 수 있고, 관제가 확인해 처리합니다.
            </p>
          </div>
        ) : (
          <Card tone="stone" shadow={false} pad={14} className="ds-r text-[14px] leading-[1.7]" style={{ "--d": "80ms", color: "#5E6270" }}>
            초대·구성원 관리는 주 보호자만 할 수 있습니다. 상태·리포트·일정은 모든 보호자에게 똑같이 공유됩니다.
          </Card>
        )}
      </FamilyLayout>
    </>
  );
}
