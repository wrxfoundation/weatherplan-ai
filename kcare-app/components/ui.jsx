// 공용 UI — 핸드오프 카드·배지·버튼 규격

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
