import { useEffect, useRef, useState } from "react";
import Icon from "./icons";

// 모바일 섹션 내비 — 좁은 화면에서 칩을 옆으로 미는 대신, 현재 섹션을 먼저 보여주고
// 눌러야 전체 목록이 펴진다. 섹션이 18개까지 늘어난 경영 콘솔에서 칩 스트립은 끝까지 못 간다.
// groups: [[그룹명, [[key, label, icon, hidden?], ...]], ...]  — 그룹이 하나면 라벨은 숨긴다.

export default function MobileSectionNav({ groups, current, onSelect, badges = {}, dots = {}, className = "" }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const items = groups.flatMap(([, list]) => list).filter(([, , , hidden]) => !hidden);
  const here = items.find(([k]) => k === current);
  const single = groups.length === 1;

  // 바깥을 누르면 닫힘 (모바일에서 목록이 계속 떠 있으면 본문을 가린다)
  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("pointerdown", h);
    return () => window.removeEventListener("pointerdown", h);
  }, [open]);

  return (
    <div ref={box} className={`relative lg:hidden ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="btn-press flex w-full items-center gap-2.5 rounded-[12px] border border-navy/15 bg-white/70 px-4 py-2.5 text-left"
      >
        {here?.[2] && (
          <span className="shrink-0 text-navy">
            <Icon name={here[2]} size={17} />
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-navy">{here?.[1] || "섹션 선택"}</span>
        <span className="shrink-0 font-num text-[11px] text-muted">
          {items.findIndex(([k]) => k === current) + 1} / {items.length}
        </span>
        <span className="shrink-0 text-muted">
          <Icon name="chev" size={16} className={open ? "rotate-180" : ""} />
        </span>
      </button>

      <div className={`smooth-open absolute left-0 right-0 top-[calc(100%+6px)] z-[900] ${open ? "is-open" : "pointer-events-none"}`}>
        <div>
        <div className="card-frost max-h-[70vh] overflow-y-auto rounded-[14px] p-2">
          {groups.map(([group, list]) => {
            const vis = list.filter(([, , , hidden]) => !hidden);
            if (!vis.length) return null;
            return (
              <div key={group} className="mb-1 last:mb-0">
                {!single && (
                  <div className="px-3 pb-1 pt-2 text-[10px] font-bold tracking-[.14em] text-muted">{group}</div>
                )}
                {vis.map(([k, label, icon]) => (
                  <button
                    key={k}
                    onClick={() => {
                      onSelect(k);
                      setOpen(false);
                    }}
                    className="btn-press flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-left"
                    style={current === k ? { background: "#0A1F3C", color: "#FFFFFF" } : { color: "#0A1F3C" }}
                  >
                    <Icon name={icon} size={16} />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-bold">{label}</span>
                    {dots[k] && <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-danger" />}
                    {badges[k] != null && (
                      <span className={`shrink-0 font-num text-[11px] ${current === k ? "text-white/60" : "text-muted"}`}>
                        {badges[k]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
}
