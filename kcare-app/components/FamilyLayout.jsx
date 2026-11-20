import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { avatarText, elderNameOf } from "../lib/people";
import { trackOf, honorific } from "../lib/tracks";
import { useAppState } from "../lib/state";
import { useGuardianRole } from "../lib/guardian-role";
import Splash from "./Splash";
import RoleGate from "./RoleGate";
import { HelpCallPopup } from "./HelpCall";
import { ClayDefs, Line } from "./clay";
import { GuardianNav, INK } from "./ds";

// 보호자 화면 틀 — 2026-10-15 디자인 시안: 머리(작은 글씨 + 큰 제목 + 오른쪽 얼굴), 카드들, 아래 떠 있는 흰 메뉴 5칸.
// 하위 화면(수면 · 활동 · 복약 · 외출 · 어머니 건강 …)은 back 을 주면 뒤로 버튼 + 제목으로 바뀐다.
//
// title  — 이 화면의 h1 (없으면 '김순자 님 가족')
// sub    — 제목 위 작은 글씨 (없으면 오늘 날짜 · 가족 이름)
// action — 오른쪽 위 자리에 얼굴 대신 넣을 것 (스토어 '주문내역' · 마이 '내 정보')
// back   — 뒤로 갈 주소 (하위 화면)
// tab    — 아래 메뉴에서 켤 칸 (하위 화면이 어느 탭 아래인지)
// face   — false 면 오른쪽 위 얼굴을 그리지 않는다 (시안의 예약 · 해주세요 화면)
const TAB_OF = {
  "/family/sleep": "/family",
  "/family/activity": "/family",
  "/family/meds": "/family",
  "/family/outing": "/family",
  "/family/watch": "/family",
  "/family/hospitals": "/family/calendar",
  "/family/health": "/family/my",
  "/family/videos": "/family/my",
  "/family/members": "/family/my",
  "/family/consent": "/family/my",
  "/family/membership": "/family/my",
  "/family/report": "/family/my",
};

export default function FamilyLayout({ children, title, sub, action, back, backLabel, tab, h1Size, face = true }) {
  const router = useRouter();
  const { state, dispatch } = useAppState();
  const elderName = elderNameOf(state.onboarding);
  const { role, demo } = useGuardianRole();
  // 정기 케어는 "김순자 님 가족", 나머지 트랙은 "병원 동행 · 이정민" — 무엇으로 쓰고 있는지가 제목에 드러나야 한다.
  // 옆의 '주 보호자' 배지가 이름에 붙어 '김순자 님 · 주 보호자'로 읽히지 않게 — '김순자 님 가족' (2026-10-02 QA)
  const track = trackOf(state.onboarding?.track);
  const family = track.id === "elder" ? `${honorific(state.onboarding)} 가족` : `${track.short} · ${elderName}`;
  const today = new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" });
  const current = tab || TAB_OF[router.pathname] || (router.pathname === "/family" ? "/family" : `/family/${router.pathname.split("/")[2] || ""}`);

  // 역할 배지 — 데모에서만 탭해 주/부 전환(시연). 로그인한 가구는 계정으로 정해진 역할을 보이기만 한다 —
  // 전에는 누르면 가구 전체의 값이 바뀌어 누구나 주 보호자가 될 수 있었다 (2026-10-19 점검 F-08)
  const chipStyle = role === "primary" ? { background: "#FBF1DA", color: "#86621F" } : { background: "#EEEDEA", color: "#5E5A52" };
  const roleChip = demo ? (
    <button
      type="button"
      onClick={() => dispatch({ type: "demo", payload: { guardianRole: role === "primary" ? "secondary" : "primary" } })}
      title="시연 — 주/부 보호자 전환"
      aria-label={`${role === "primary" ? "주 보호자" : "부 보호자"} — 눌러서 ${role === "primary" ? "부" : "주"} 보호자 화면 보기 (시연)`}
      className="relative ml-1.5 inline-flex min-h-[26px] items-center rounded-full px-2.5 text-[12px] font-extrabold align-middle before:absolute before:-inset-x-1 before:-inset-y-[9px] before:content-['']"
      style={chipStyle}
    >
      {role === "primary" ? "주 보호자" : "부 보호자"}
    </button>
  ) : (
    <span className="ml-1.5 inline-flex min-h-[26px] items-center rounded-full px-2.5 text-[12px] font-extrabold align-middle" style={chipStyle}>
      {role === "primary" ? "주 보호자" : "부 보호자"}
    </span>
  );

  return (
    <RoleGate role="guardian" title="보호자">
      {/* 휴대폰 주소창 · 상태 표시줄 색을 밝은 바탕에 맞춘다 (다른 화면은 기본 남색) */}
      <Head>
        <meta name="theme-color" content="#F8F7F4" />
      </Head>
      <Splash service="family" />
      <ClayDefs />
      <div className="ds-app min-h-dvh">
        <div className="relative mx-auto w-full max-w-[430px]">
          <main className="ds-scr ds-play">
            {back ? (
              <div className="ds-r flex items-center gap-3">
                <Link href={back} aria-label={backLabel || "뒤로"} className="ds-press ds-back">
                  <Line name="back" size={24} style={{ color: INK }} />
                </Link>
                <div className="min-w-0 flex-1">
                  {sub && <div className="ds-hsub">{sub}</div>}
                  {/* 화면마다 제목이 바뀌므로 여기가 이 화면의 h1 이다 (없으면 /family 계열 화면이 h1 없는 문서가 된다) */}
                  <h1 className="ds-h1" style={{ margin: 0, fontSize: h1Size }}>
                    {title}
                  </h1>
                </div>
                {action}
              </div>
            ) : (
              <div className="ds-r flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="ds-hsub">
                    {sub || `${today} · ${family}`}
                    {roleChip}
                  </div>
                  <h1 className="ds-h1" style={{ marginTop: 10, fontSize: h1Size }}>
                    {title || family}
                  </h1>
                </div>
                {/* 성 제외 이름 — 화면이 오른쪽 위 버튼을 주면 그것이 대신 선다 */}
                {action || (face && (
                  <span aria-hidden="true" className="flex h-14 w-14 flex-none items-center justify-center rounded-full text-[15px] font-extrabold text-white" style={{ background: INK }}>
                    {avatarText(elderName)}
                  </span>
                ))}
              </div>
            )}
            {/* SOS — 홈이 아닌 탭에서도 맨 위에 (2026-10-19 점검 L-02 · 전에는 홈 탭에만 떴다). 누르면 홈의 SOS 카드로 */}
            {state.demo.sos && router.pathname !== "/family" && (
              <Link href="/family" role="alert" className="ds-press animate-sosPulse flex items-center gap-3 rounded-[22px] p-4 text-white" style={{ background: "#C0392B" }}>
                <span className="min-w-0 flex-1">
                  <b className="block text-[17px] font-black">긴급 · {honorific(state.onboarding)}이 도움을 요청했습니다</b>
                  <span className="text-[14px] opacity-90">관제센터가 대응하고 있습니다 · 눌러서 홈에서 보기</span>
                </span>
                <Line name="chevR" size={22} />
              </Link>
            )}
            {children}
          </main>
          {/* 도와줘요 — 어르신이 누르면, 관제가 단계를 넘길 때마다 어느 탭에서든 뜬다 (2026-10-05) */}
          <HelpCallPopup role="guardian" />
        </div>
        <GuardianNav current={current} />
      </div>
    </RoleGate>
  );
}
