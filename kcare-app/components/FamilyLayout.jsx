import Link from "next/link";
import { useRouter } from "next/router";
import { Avatar } from "./ui";
import { ELDER } from "../lib/mock";
import { useAppState } from "../lib/state";

const TABS = [
  { href: "/family", label: "홈", icon: "⌂" },
  { href: "/family/calendar", label: "캘린더", icon: "▦" },
  { href: "/family/requests", label: "해주세요", icon: "✚" },
  { href: "/family/store", label: "스토어", icon: "◇" },
  { href: "/family/my", label: "마이", icon: "☺" },
];

export default function FamilyLayout({ children, title }) {
  const router = useRouter();
  const { state } = useAppState();
  const elderName = state.onboarding?.elderName || ELDER.name;

  return (
    <div className="min-h-screen bg-nav">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-paper shadow-[0_0_60px_rgba(0,0,0,.45)]">
        <header className="sticky top-0 z-20 border-b border-navy/10 bg-paper/95 px-5 pb-3 pt-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-num text-[10px] font-bold tracking-[.18em] text-gold">
                FAMILY MEMBERSHIP
              </div>
              <div className="mt-0.5 text-[19px] font-black leading-tight text-navy">
                {title || `어머니 · ${elderName}`}
              </div>
            </div>
            <Avatar name={elderName} size={38} />
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
                  className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${
                    active ? "text-navy" : t.soon ? "text-muted/40" : "text-muted"
                  }`}
                >
                  <span className="text-[16px] leading-none">{t.icon}</span>
                  <span>
                    {t.label}
                    {t.soon && <span className="ml-0.5 text-[9px] text-gold">예정</span>}
                  </span>
                  {active && <span className="mt-0.5 h-[3px] w-5 rounded-full bg-gold" />}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
