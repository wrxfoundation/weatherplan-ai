/* 상단 메뉴 (9/2 서우 — "계속 추가하다 보니 UX 적으로 불편")

   화면이 일곱이 되도록 메뉴는 첫 화면에만 있었고, 나머지 화면에는 "← CS 인박스" 하나뿐이라
   동향에서 셀럽으로 가려면 인박스를 거쳐 두 번 눌러야 했다. 첫 화면 메뉴는 칩 아홉 개가 한 줄이었는데
   그중 넷은 화면 이동이 아니라 보기 방식(묶어 보기)과 내보내기(CSV·JSON)였다. 같은 모양의 칩이
   다른 일을 하면 손이 멈춘다.

   그래서 셋으로 가른다.
     1 이 줄 — 화면 이동만. 모든 화면에 같은 순서로, 지금 있는 곳은 채워서.
       운영(인박스·정본·사람) · 분석(리포트) · 인텔(동향·셀럽·반응) 으로 묶고 이름을 붙였다.
     2 그 아래 줄 — 그 화면의 보기·필터(언어·기간·주제·층). 칩은 그대로 쓰되 메뉴와 줄을 나눈다.
     3 묶어 보기·내보내기는 인박스의 도구 상자로 내려갔다. 그 화면에서만 뜻이 있는 것들이다.

   키(k)는 쿠키가 없는 세션에서만 붙는다 — 주소창에 키를 남기지 않는 기존 방침 그대로. */

import { logout } from "./actions";
import NavScroll from "./NavScroll";

export type NavKey = "inbox" | "faq" | "people" | "report" | "intel" | "celeb" | "reactions";

const GROUPS: { label: string; items: { key: NavKey; label: string; href: string }[] }[] = [
  { label: "운영", items: [
    { key: "inbox", label: "인박스", href: "/admin" },
    { key: "faq", label: "정본", href: "/admin/faq" },
    { key: "people", label: "사람", href: "/admin/people" },
  ] },
  { label: "분석", items: [{ key: "report", label: "리포트", href: "/admin/report" }] },
  { label: "인텔", items: [
    { key: "intel", label: "동향", href: "/admin/intel" },
    { key: "celeb", label: "셀럽", href: "/admin/celeb" },
    { key: "reactions", label: "반응", href: "/admin/reactions" },
  ] },
];

export default function Nav({ k, current, title, sub, children }: {
  k: string;
  current: NavKey;
  title: string;
  sub?: React.ReactNode;
  /* 그 화면만의 보기·필터 칩. 메뉴 아래 줄에 놓인다. */
  children?: React.ReactNode;
}) {
  const withKey = (href: string) => (k ? `${href}?k=${encodeURIComponent(k)}` : href);
  return (
    <header className="top">
      <div className="wrap top-in">
        <span className="brand">{title}</span>
        {sub && <span className="brand-sub">{sub}</span>}
        <nav className="gnb" aria-label="관리 화면">
          {GROUPS.map((g) => (
            <div key={g.label} className="gnb-g">
              <span className="gnb-l">{g.label}</span>
              {g.items.map((it) => (
                <a
                  key={it.key}
                  href={withKey(it.href)}
                  className={it.key === current ? "on" : ""}
                  aria-current={it.key === current ? "page" : undefined}
                >
                  {it.label}
                </a>
              ))}
            </div>
          ))}
          <NavScroll />
          <div className="gnb-util">
            <form action={logout}><button type="submit">닫기</button></form>
          </div>
        </nav>
      </div>
      {children && <div className="wrap sub-nav">{children}</div>}
    </header>
  );
}
