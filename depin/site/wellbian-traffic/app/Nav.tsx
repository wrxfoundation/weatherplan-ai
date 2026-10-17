/* 머리 — 사이트 이름 · 하위 페이지 둘. 지금 있는 곳은 채운다(텔레봇 상단 메뉴와 같은 모양). */
import Link from "next/link";

const PAGES = [
  { href: "/", key: "home", label: "개요" },
  { href: "/sources", key: "sources", label: "소스별 일자" },
] as const;

export default function Nav({ current, sub }: { current: (typeof PAGES)[number]["key"]; sub: string }) {
  return (
    <header className="top">
      <div className="wrap top-in">
        <Link href="/" className="brand">wellbian 유입</Link>
        <span className="brand-sub">{sub}</span>
        <nav className="gnb" aria-label="화면">
          {PAGES.map((p) => (
            <Link key={p.key} href={p.href} className={p.key === current ? "on" : undefined}
              aria-current={p.key === current ? "page" : undefined}>{p.label}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
