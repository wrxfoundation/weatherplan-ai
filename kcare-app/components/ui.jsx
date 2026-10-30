// 공용 UI — 핸드오프 카드·배지·버튼 규격
import { useId, useState } from "react";
import Icon from "./icons";

export function Card({ children, className = "", onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`card-glass block w-full text-left rounded-card ${
        onClick ? "btn-press" : ""
      } ${className}`}
    >
      {children}
    </Tag>
  );
}

export function SectionLabel({ children }) {
  return (
    <div className="text-[12px] font-bold tracking-[.14em] text-muted/90 uppercase">
      {children}
    </div>
  );
}

export function Badge({ fg, bg, children, className = "" }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-[3px] text-[11px] font-bold font-num tracking-[.06em] ${className}`}
      style={{ color: fg, background: bg }}
    >
      {children}
    </span>
  );
}

export function PrimaryButton({ children, onClick, className = "", disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn-press btn-dark w-full rounded-xl bg-navy py-3.5 text-[16px] font-bold text-white disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`btn-press w-full rounded-xl border border-navy/25 bg-white/70 py-3.5 text-[16px] font-bold text-navy ${className}`}
    >
      {children}
    </button>
  );
}

export function Avatar({ name, text, size = 30, className = "" }) {
  const label = text || name.slice(0, 1);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-navy font-num font-bold text-white ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, (size * 0.36) / Math.max(1, label.length * 0.55)),
      }}
    >
      {label}
    </span>
  );
}

export function PendingTag({ children = "연동 대기" }) {
  // 정직성 원칙 — 미연동 지표는 임의 수치 대신 상태를 표기
  return (
    <span className="inline-block rounded-md border border-muted/30 px-1.5 py-[1px] text-[11px] font-bold text-muted">
      {children}
    </span>
  );
}

// 접기 · 펴기 — 화면이 길어질 때 쓴다.
//
// 보호자 앱이 기능이 늘면서 홈 5.6화면·해주세요 3.8화면 분량까지 길어졌다.
// 스크롤로 다 내려야 뭐가 있는지 아는 화면은 "많다"가 아니라 "모르겠다"가 된다.
// 제목줄에 개수를 함께 보여 줘서, 펴지 않고도 안에 뭐가 몇 개 있는지 알게 한다.
//
// 기본 열림(defaultOpen)은 그 화면에서 지금 할 일에만 준다. 나머지는 접어 둔다.
export function Collapse({ title, count, note, defaultOpen = false, tone = "plain", children }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const gold = tone === "gold";
  return (
    <div className={`rounded-xl border ${gold ? "border-gold/25 bg-gold/[.04]" : "border-navy/10"}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className="btn-press flex w-full items-center gap-2 px-3.5 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-bold text-navy">
            {title}
            {count != null && (
              <span className="ml-1.5 font-num text-[12px] font-bold text-muted">{count}</span>
            )}
          </span>
          {note && <span className="mt-0.5 block text-[11.5px] leading-[1.55] text-muted">{note}</span>}
        </span>
        <span
          aria-hidden
          className="shrink-0 text-muted transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        >
          <Icon name="chev" size={18} strokeWidth={2} />
        </span>
      </button>
      {/* 닫힐 때 내용을 지운다 — 화면 밖에 남겨 두면 스크린리더가 계속 읽는다 */}
      {open && (
        <div id={id} className="px-3.5 pb-3.5">
          {children}
        </div>
      )}
    </div>
  );
}
