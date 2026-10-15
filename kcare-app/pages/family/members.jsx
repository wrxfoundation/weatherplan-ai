import Head from "next/head";
import { useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import InviteLink from "../../components/InviteLink";
import { Line } from "../../components/clay";
import { Btn, Card, TONE } from "../../components/ds";
import { INVITE } from "../../lib/mock";
import { useAppState } from "../../lib/state";
import { useAuth } from "../../lib/auth";
import { familyOf, meOf, shortName } from "../../lib/membership";

// 마이 › 가족 (2026-10-15 디자인 시안) — 가족 구성원 · 초대. 주 보호자가 초대 링크를 만들고, 부 보호자는 보기만 한다.
// 관제 센터 회원은 실제 초대 링크 (2026-10-14 · components/InviteLink.jsx), 데모는 링크 발급 시늉만 한다.
// 센터 공간은 그 센터에 가입 · 승인된 보호자만 보인다 (lib/membership.js familyOf).
export default function MembersPage() {
  const { state, dispatch } = useAppState();
  const auth = useAuth();
  const me = meOf(auth.user);
  const family = familyOf(me);
  const isPrimary = (state.demo.guardianRole || "primary") === "primary";
  const [invited, setInvited] = useState(false);

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
              {family.map((g) => (
                <li key={g.name} className="ds-row">
                  <span aria-hidden="true" className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white text-[14px] font-extrabold" style={{ color: TONE.green.fg }}>
                    {shortName(g.name)}
                  </span>
                  <span className="ds-k">
                    <b>{g.name}</b>
                    <small>{String(g.relation || "").split(" · ")[0]}</small>
                  </span>
                  <span
                    className="flex-none rounded-full px-3 py-1 text-[13px] font-extrabold"
                    style={g.isPrimary ? { background: TONE.green.fg, color: "#FFFFFF" } : { background: "#FFFFFF", color: TONE.green.fg }}
                  >
                    {g.isPrimary ? "주 보호자" : "부 보호자"}
                  </span>
                </li>
              ))}
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
              {INVITE.rule}. 참여자는 이름·관계·연락처만 입력하고 결제수단은 필요 없습니다. 구성원 제거는 주 보호자만 할 수 있습니다.
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
