import { useState } from "react";
import { GLOSSARY } from "../lib/glossary";

// (?) 용어 도움말 — 클릭 토글 팝오버. light: 다크 배경(네이비 카드) 위에서 사용
export default function HelpTip({ term, light = false }) {
  const [open, setOpen] = useState(false);
  const g = GLOSSARY[term];
  if (!g) return null;
  return (
    <span className="relative inline-block align-middle">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label={`${term} 용어 설명`}
        className={`btn-press ml-1 inline-flex h-[16px] w-[16px] items-center justify-center rounded-full border text-[10px] font-bold leading-none ${
          light ? "border-white/50 text-white/80" : "border-navy/30 text-muted"
        }`}
      >
        ?
      </button>
      {open && (
        <span
          className="card-frost absolute left-1/2 top-[22px] z-[1300] block w-[260px] -translate-x-1/2 rounded-xl p-3 text-left shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="block text-[13px] font-bold text-navy">{term}</span>
          <span className="mt-1 block text-[12px] font-normal leading-[1.65] text-ink">{g}</span>
        </span>
      )}
    </span>
  );
}
