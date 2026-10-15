// 2026-10-15 디자인 시안의 공통 부품 — 어르신 · 보호자 화면이 같이 쓴다.
// 색 · 그림자 값은 시안 그대로다. 다만 빨강은 위험 신호(SOS · 낙상 · 응급) 전용이라
// 시안의 빨간 '새 소식' 점 · 주황 배지는 금색(TONE.gold)으로 바꿔 쓴다 — 이 파일 밖에서 빨강을 고르지 않게
// 위험 색(TONE.danger)은 이름부터 위험이라고 붙였다.
import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Line } from "./clay";

// 분류 색 — bg 바탕 · sh 아래 그림자(입체) · fg 글자 · title 큰 제목 · sub 보조 글자 · solid 채운 버튼 · solidSh 그 그림자
export const TONE = {
  blue: { bg: "#E8EBF7", sh: "#C5D0EC", fg: "#3A4E96", title: "#4459A8", sub: "#4A5068", solid: "#4459A8", solidSh: "#2F3F80", solidFg: "#FFFFFF" },
  green: { bg: "#E4EEE5", sh: "#C9DCCB", fg: "#2F5A3B", title: "#3B6B47", sub: "#4A5E4F", solid: "#3B6B47", solidSh: "#24432C", solidFg: "#FFFFFF" },
  purple: { bg: "#ECE8F4", sh: "#D6CDE6", fg: "#4E3880", title: "#6A4D9C", sub: "#5E5670", solid: "#6A4D9C", solidSh: "#4E3880", solidFg: "#FFFFFF" },
  beige: { bg: "#F1E9DC", sh: "#E2D3B5", fg: "#86621F", title: "#9A7432", sub: "#6B5A35", solid: "#9A7432", solidSh: "#6B5A35", solidFg: "#FFFFFF" },
  // 금색 — 시안의 노랑 카드 · '주문하기' 버튼, 그리고 시안의 빨간 점 · 주황 배지 자리 (주의 · 새 소식)
  gold: { bg: "#FBF1DA", sh: "#EAD9AC", fg: "#86621F", title: "#86621F", sub: "#6B5A35", solid: "#E8B54A", solidSh: "#B58A2A", solidFg: "#1B2340", dot: "#C9A064", badge: "#A8761C" },
  gray: { bg: "#EEEDEA", sh: "#DCD8CF", fg: "#5E5A52", title: "#3A3F50", sub: "#5E5A52", solid: "#5E5A52", solidSh: "#3A3F50", solidFg: "#FFFFFF" },
  stone: { bg: "#F3F1EC", sh: "#E3DED3", fg: "#1B2340", title: "#1B2340", sub: "#5E6270", solid: "#1B2340", solidSh: "#0E1428", solidFg: "#FFFFFF" },
  brown: { bg: "#F0EAE4", sh: "#E0D5CA", fg: "#6E5A4A", title: "#6B4A3A", sub: "#6E5A4A", solid: "#9C8371", solidSh: "#7A6352", solidFg: "#FFFFFF" },
  navy: { bg: "#1B2340", sh: "#0E1428", fg: "#FFFFFF", title: "#FFFFFF", sub: "rgba(255,255,255,.75)", solid: "#1B2340", solidSh: "#0E1428", solidFg: "#FFFFFF" },
  white: { bg: "#FFFFFF", sh: "#E3DED3", fg: "#1B2340", title: "#1B2340", sub: "#5E6270", solid: "#1B2340", solidSh: "#0E1428", solidFg: "#FFFFFF" },
  // 도와줘요 — 살구색 (위험 신호의 문 앞이라 옅게)
  help: { bg: "#FCE2CF", sh: "#EFC09C", fg: "#8A3712", title: "#8A3712", sub: "#8A3712", solid: "#E2703A", solidSh: "#B5501E", solidFg: "#FFFFFF" },
  // 위험 — SOS · 낙상 의심 · 응급 대응에만
  danger: { bg: "#FBE5E0", sh: "#E8CFC8", fg: "#9A3424", title: "#6E2216", sub: "#7A4A40", solid: "#C0392B", solidSh: "#8E2A1F", solidFg: "#FFFFFF" },
};

export const INK = "#1B2340";

// 일정 종류 → 색 (시안 예약 달력: 병원 초록 · 안심방문 베이지 · 배송 파랑 · 가족 보라). 어르신 · 보호자 화면이 같은 색을 쓴다.
// lib/mock.js EVENT_KINDS 의 color 는 관제 콘솔 점 색이다 (병원 = 빨강) — 이 화면들에서는 빨강을 위험 신호에만 쓴다.
export const eventTone = (kind) =>
  ["hospital", "checkup", "nextAppt", "medication"].includes(kind) ? "green" : kind === "visit" ? "beige" : kind === "delivery" ? "blue" : kind === "family" ? "purple" : "blue";
export const MUTE = "#5E6270";

// 3D 버튼 · 카드의 바탕 + 아래 그림자
export const solid = (t, px = 5) => ({ background: TONE[t].solid, boxShadow: `0 ${px}px 0 ${TONE[t].solidSh}`, color: TONE[t].solidFg });
export const soft = (t, px = 5) => ({ background: TONE[t].bg, boxShadow: `0 ${px}px 0 ${TONE[t].sh}`, color: TONE[t].fg });
export const flat = (t) => ({ background: TONE[t].bg, color: TONE[t].fg });

// 한 화면 — 보일 때마다 차례로 떠오른다 (ds-play). 숨겨도 상태는 남는다 (언마운트하지 않는다)
export function Screen({ show = true, label, className = "", style, children, as: Tag = "section" }) {
  return (
    <Tag aria-label={label} className={`ds-scr ${show ? "ds-play" : ""} ${className}`} style={{ display: show ? undefined : "none", ...style }}>
      {children}
    </Tag>
  );
}

// 차례로 떠오르는 줄 — d 는 지연(ms)
export function R({ d = 0, className = "", style, children, as: Tag = "div", ...rest }) {
  return (
    <Tag className={`ds-r ${className}`} style={{ "--d": `${d}ms`, ...style }} {...rest}>
      {children}
    </Tag>
  );
}

// 뒤로 버튼 + 작은 제목(sub) + 큰 제목 — 하위 화면 머리
export function BackHead({ onBack, backLabel = "홈으로 돌아가기", sub, title, color = INK, size = 28, right, h1 = false }) {
  const T = h1 ? "h1" : "h2";
  return (
    <R className="flex items-center gap-3">
      {onBack && (
        <button type="button" onClick={onBack} aria-label={backLabel} className="ds-press ds-back">
          <Line name="back" size={24} style={{ color: INK }} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        {sub && <div className="ds-hsub">{sub}</div>}
        <T className="m-0 font-extrabold leading-[1.3]" style={{ fontSize: size, color }}>
          {title}
        </T>
      </div>
      {right}
    </R>
  );
}

// 3D 버튼 — tone 바탕(soft) 또는 채움(fill). 높이는 h(px)
export function Btn({ tone = "navy", fill = true, h = 58, r = 18, px = 4, className = "", style, children, ...rest }) {
  const look = fill ? solid(tone, px) : soft(tone, px);
  return (
    <button
      type="button"
      {...rest}
      className={`ds-press ds-btn3d flex items-center justify-center gap-2 disabled:cursor-default ${className}`}
      style={{ minHeight: h, borderRadius: r, ...look, ...style }}
    >
      {children}
    </button>
  );
}

// 흰 3D 버튼 (닫기 · 후기 쓰기 …) — 그림자 색만 바꿀 수 있다
export function WhiteBtn({ h = 56, r = 18, sh = "#E3DED3", color = INK, className = "", style, children, ...rest }) {
  return (
    <button
      type="button"
      {...rest}
      className={`ds-press ds-btn3d flex items-center justify-center gap-2 ${className}`}
      style={{ minHeight: h, borderRadius: r, background: "#FFFFFF", boxShadow: `0 4px 0 ${sh}`, color, ...style }}
    >
      {children}
    </button>
  );
}

// 카드 — 흰 3D(기본) 또는 분류 색 바탕
export function Card({ tone, shadow = true, r = 26, pad = 18, className = "", style, children, as: Tag = "div", ...rest }) {
  const look = tone ? { background: TONE[tone].bg, ...(shadow ? { boxShadow: `0 5px 0 ${TONE[tone].sh}` } : {}) } : { background: "#FFFFFF", ...(shadow ? { boxShadow: "0 5px 0 #E6E2DA" } : {}) };
  return (
    <Tag {...rest} className={className} style={{ borderRadius: r, padding: pad, ...look, ...style }}>
      {children}
    </Tag>
  );
}

// 얼굴(이니셜) 동그라미
export function Face({ text, size = 40, bg = "#FFFFFF", fg = INK, ring, fontSize, className = "", style }) {
  return (
    <span
      aria-hidden="true"
      className={`ds-face ${className}`}
      style={{ width: size, height: size, background: bg, color: fg, fontSize: fontSize || Math.round(size * 0.32), border: ring ? `3px solid ${ring}` : "none", boxSizing: "border-box", ...style }}
    >
      {text}
    </span>
  );
}

// 작은 알약 배지
export function Pill({ children, bg = "#FFFFFF", fg = INK, className = "", style }) {
  return (
    <span className={`inline-flex flex-none items-center rounded-full px-[10px] py-1 text-[13px] font-extrabold ${className}`} style={{ background: bg, color: fg, ...style }}>
      {children}
    </span>
  );
}

// 섹션 제목 — 앞에 색 점
export function Sect({ dot, children, right, as: Tag = "h2", className = "" }) {
  return (
    <div className={`flex items-center justify-between gap-2 ${className}`}>
      <Tag className="ds-sect">
        {dot && <i aria-hidden="true" style={{ background: dot }} />}
        {children}
      </Tag>
      {right}
    </div>
  );
}

// 날짜 블록 (요일 · 날)
export function DBlock({ top, day, bg = "#FFFFFF", fg = INK, topFg, size = 56 }) {
  return (
    <span className="ds-dblock" style={{ width: size, height: size, background: bg, color: fg }} aria-hidden="true">
      <span style={{ color: topFg || fg }}>{top}</span>
      <b style={{ fontSize: size > 60 ? 24 : 21 }}>{day}</b>
    </span>
  );
}

// 듣기 · 녹음 파형 — on 이면 움직인다
export function Wave({ heights = [10, 22, 14, 26, 18, 12, 24, 16, 20, 10], color = INK, on = false, h = 30 }) {
  return (
    <span aria-hidden="true" className="flex min-w-0 flex-1 items-center gap-[3px] overflow-hidden" style={{ height: h }}>
      {heights.map((x, k) => (
        <span key={k} className={`ds-bar-sm ${on ? "on" : ""}`} style={{ height: x, background: color, opacity: on ? 1 : 0.45, animationDelay: `${k * 0.08}s` }} />
      ))}
    </span>
  );
}

// 별 (약 미션) — 채운 별은 금 그라디언트
export function Star({ on = true, size = 32, className = "" }) {
  const id = "st" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const d = "M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21.1 7 14.2 2 9.3l6.9-1z";
  return (
    <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 24 24" className={className}>
      {on ? (
        <>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FFF4C8" />
              <stop offset=".35" stopColor="#F2C759" />
              <stop offset=".6" stopColor="#C8922E" />
              <stop offset=".8" stopColor="#F6D980" />
              <stop offset="1" stopColor="#B07F22" />
            </linearGradient>
          </defs>
          <path d={d} fill={`url(#${id})`} stroke="#A9781E" strokeWidth="1" strokeLinejoin="round" />
          <path d="M9.2 8.6l1.6-3.2" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" opacity=".8" />
        </>
      ) : (
        <path d={d} fill="none" stroke="#D4BC82" strokeWidth="1.8" strokeLinejoin="round" />
      )}
    </svg>
  );
}

// 7일 / 30일 같은 둘 중 하나 고르기
export function Tog({ value, options, onChange, label }) {
  return (
    <div className="ds-tog" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.v} type="button" aria-pressed={value === o.v} onClick={() => onChange(o.v)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// 아래에서 올라오는 시트 — 바탕을 누르거나 Esc 로 닫는다. 열리면 시트 안 첫 칸으로 초점을 옮긴다
export function Sheet({ open = true, onClose, label, children, className = "", style }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const prev = typeof document !== "undefined" ? document.activeElement : null;
    const t = setTimeout(() => {
      const el = ref.current?.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
      el?.focus({ preventScroll: true });
    }, 30);
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      prev?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="ds-sheetwrap ds-app" style={{ background: "transparent" }}>
      <button type="button" className="ds-backdrop" aria-label="닫기" tabIndex={-1} onClick={onClose} />
      <div ref={ref} className={`ds-sheet ${className}`} role="dialog" aria-modal="true" aria-label={label} style={style}>
        {children}
      </div>
    </div>
  );
}

// 시트 머리 — 작은 제목 + 큰 제목
export function SheetTitle({ sub, title, color = INK }) {
  return (
    <div>
      {sub && <div className="text-[15px] font-extrabold" style={{ color: "#8F7F63" }}>{sub}</div>}
      <div className="text-[25px] font-black leading-[1.3]" style={{ color }}>
        {title}
      </div>
    </div>
  );
}

// 알림 한 줄 (토스트) — const [toastEl, toast] = useToast()
export function useToast() {
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);
  const t = useRef(null);
  useEffect(() => () => clearTimeout(t.current), []);
  const fire = useCallback((m) => {
    setMsg(m);
    setShow(true);
    clearTimeout(t.current);
    t.current = setTimeout(() => setShow(false), 2200);
  }, []);
  const el = (
    <div className={`ds-toast ${show ? "show" : ""}`} role="status" aria-live="polite">
      {msg}
    </div>
  );
  return [el, fire];
}

// 보호자 하단 메뉴 — 흰 막대 하나, 지금 화면만 남색으로 찬다
export const GUARDIAN_TABS = [
  { href: "/family", label: "홈", icon: "gHome" },
  { href: "/family/calendar", label: "예약", icon: "gCal" },
  { href: "/family/requests", label: "해주세요", icon: "gPlus" },
  { href: "/family/store", label: "스토어", icon: "gBag" },
  { href: "/family/my", label: "마이", icon: "gUser" },
];
export function GuardianNav({ current }) {
  return (
    <nav className="ds-nav ds-nav-g" aria-label="보호자 메뉴">
      {GUARDIAN_TABS.map((t) => {
        const on = t.href === current;
        return (
          <Link key={t.href} href={t.href} aria-current={on ? "page" : undefined} className="ds-press">
            <Line name={t.icon} size={22} />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
