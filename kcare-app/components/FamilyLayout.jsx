import Link from "next/link";
import Icon from "./icons";
import { useRouter } from "next/router";
import { Avatar } from "./ui";
import { ELDER } from "../lib/mock";
import { useAppState } from "../lib/state";
import Splash from "./Splash";

const TABS = [
  { href: "/family", label: "홈", icon: "home" },
  { href: "/family/calendar", label: "예약", icon: "calendar" },
  { href: "/family/requests", label: "해주세요", icon: "plus" },
  { href: "/family/store", label: "스토어", icon: "bag" },
  { href: "/family/my", label: "마이", icon: "user" },
];

export default function FamilyLayout({ children, title }) {
  const router = useRouter();
  const { state, dispatch } = useAppState();
  const elderName = state.onboarding?.elderName || ELDER.name;
  const role = state.demo.guardianRole || "primary";

  return (
    <>
      <Splash service="family" />
    <div className="min-h-screen bg-nav">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-paper shadow-[0_0_60px_rgba(0,0,0,.45)]">
        <header className="sticky top-0 z-20 border-b border-navy/10 bg-paper/95 px-5 pb-3 pt-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-num text-[11px] font-bold tracking-[.18em] text-gold">
                FAMILY MEMBERSHIP
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                {/* 화면마다 제목이 바뀌므로 여기가 이 화면의 h1 이다.
                    이게 없으면 /family 계열 7개 화면 전부 h1 없는 문서가 된다. */}
                <h1 className="text-[21px] font-black leading-tight text-navy">
                  {title || `어머니 · ${elderName}`}
                </h1>
                {/* 역할 배지 — 탭하면 주/부 전환 (시연) */}
                <button
                  onClick={() =>
                    dispatch({
                      type: "demo",
                      payload: { guardianRole: role === "primary" ? "secondary" : "primary" },
                    })
                  }
                  title="시연 — 주/부 보호자 전환"
                  className={`btn-press rounded-full px-2 py-[3px] text-[10px] font-bold ${
                    role === "primary" ? "chip-gold" : "bg-navy/[.07] text-muted"
                  }`}
                >
                  {role === "primary" ? "주 보호자" : "부 보호자"}
                </button>
              </div>
            </div>
            {/* 성 제외 이름 — 디자인 콘솔 헤더 아바타 */}
            <Avatar name={elderName} text={elderName.length >= 3 ? elderName.slice(1) : elderName} size={38} />
          </div>
        </header>

        <main className="flex-1 space-y-3.5 overflow-y-auto px-4 pb-28 pt-4">{children}</main>

        <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-navy/10 bg-white/95 backdrop-blur">
          <div className="grid grid-cols-5">
            {TABS.map((t) => {
              const active =
                t.href === "/family"
                  ? router.pathname === "/family"
                  : router.pathname.startsWith(t.href);
              return (
                <Link
                  key={t.href}
                  href={t.soon ? "#" : t.href}
                  aria-disabled={t.soon}
                  onClick={(e) => t.soon && e.preventDefault()}
                  className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[12px] font-bold ${
                    active ? "text-navy" : t.soon ? "text-muted/40" : "text-muted"
                  }`}
                >
                  <Icon name={t.icon} size={19} />
                  <span>
                    {t.label}
                    {t.soon && <span className="ml-0.5 text-[10px] text-gold">예정</span>}
                  </span>
                  {active && <span className="mt-0.5 h-[3px] w-5 rounded-full bg-gold" />}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
    </>
  );
}
