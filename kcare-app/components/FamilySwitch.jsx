// 가족 고르기 · 다른 가족에서 온 긴급 (2026-11-12 — 가족마다 기록 나누기 · lib/families.js).
//
// 관제 · 컨시어지는 한 센터의 여러 가족을 맡는다. 화면은 한 번에 한 가족의 기록을 보여 주고, 어느 가족인지는 여기서 고른다.
//  · FamilySwitch       지금 보는 가족 + 눌러서 바꾸기. 가족마다 '지금 상황'(SOS · 도와줘요 · 승인 대기)을 같이 보인다.
//  · OtherFamilyAlerts  지금 보고 있지 않은 가족의 SOS · 도와줘요 — 어느 화면에서든 맨 위에. 누르면 그 가족으로 간다.
// 가족이 하나뿐이면(예전 공간 그대로) 고르는 칸은 보이지 않는다. 센터 밖(데모 · 테스트 가구)과 어르신 · 보호자 화면에는 아무것도 그리지 않는다.
// 빨강은 SOS 에만 쓴다.
import { useEffect, useRef, useState } from "react";
import { useSync } from "../lib/state";
import { useAuth } from "../lib/auth";
import { familyFlags, useFamilies } from "../lib/families-client";

const FLAG_CLS = {
  danger: "bg-danger text-white",
  warn: "bg-[#FFF1D6] text-[#8A5A00]",
  gold: "bg-[rgba(176,141,87,.16)] text-[#7A5C28]",
  muted: "bg-navy/[.07] text-muted",
};

function Flags({ f, role }) {
  const flags = familyFlags(f, role);
  if (!flags.length) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {flags.map((x) => (
        <span key={x.key} className={`rounded-full px-1.5 py-[1px] text-[11px] font-bold ${FLAG_CLS[x.tone]}`}>
          {x.text}
        </span>
      ))}
    </span>
  );
}

const whoLine = (f) => {
  const parts = [f.elders.length ? `어르신 ${f.elders.join(" · ")}` : null, f.guardians.length ? `보호자 ${f.guardians.join(" · ")}` : null].filter(Boolean);
  return parts.length ? parts.join(" / ") : "아직 가입한 구성원이 없습니다";
};

export function FamilySwitch({ className = "", onManage = null }) {
  const { user } = useAuth();
  const sync = useSync();
  const fam = useFamilies();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!fam.on || !sync.staff || fam.status !== "ready") return null;
  const list = fam.families;
  // 가족이 하나뿐이고 만들 수도 없는 사람(컨시어지)에게는 고를 것이 없다. 관제는 하나뿐이어도 보인다 — 가족을 늘리는 입구다
  if (list.length <= 1 && !onManage) return null;
  const now = list.find((f) => f.id === sync.household) || null;
  const others = list.filter((f) => f.id !== sync.household);
  const alerts = others.filter((f) => f.sos || f.help).length;

  const go = async (id) => {
    setBusy(true);
    try {
      await sync.switchFamily(id);
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  return (
    <div ref={box} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="btn-press flex min-h-[44px] w-full items-center gap-2 rounded-xl border border-navy/15 bg-white px-3 py-2 text-left"
      >
        <span className="shrink-0 text-[11px] font-bold tracking-[.06em] text-muted">가족</span>
        <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-navy">{now ? now.title : "가족을 골라 주세요"}</span>
        {alerts > 0 && <span className="shrink-0 rounded-full bg-[#FFF1D6] px-1.5 py-[1px] text-[11px] font-bold text-[#8A5A00]">다른 가족 {alerts}</span>}
        <span className="shrink-0 text-[12px] font-bold text-muted">
          {list.length}곳 {open ? "▴" : "▾"}
        </span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[1100] max-h-[60vh] min-w-[260px] overflow-y-auto rounded-xl border border-navy/15 bg-white p-1.5 shadow-xl">
          <ul aria-label="가족 고르기">
            {list.map((f) => {
              const here = f.id === sync.household;
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    aria-current={here ? "true" : undefined}
                    disabled={busy || here}
                    onClick={() => go(f.id)}
                    className={`flex min-h-[48px] w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left ${here ? "bg-navy/[.06]" : "hover:bg-navy/[.04]"}`}
                  >
                    <span className="flex w-full flex-wrap items-center gap-1.5">
                      <span className="text-[14px] font-bold text-navy">{f.title}</span>
                      {here && <span className="rounded-full bg-navy px-1.5 py-[1px] text-[10px] font-bold text-white">보는 중</span>}
                      <Flags f={f} role={user?.role} />
                    </span>
                    <span className="text-[12px] leading-[1.5] text-muted">{whoLine(f)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {onManage && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onManage();
              }}
              className="btn-press mt-1 min-h-[44px] w-full rounded-lg border border-navy/15 px-3 py-2 text-[13px] font-bold text-navy"
            >
              가족 관리 — 가족 추가 · 가입 코드
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// 지금 보고 있지 않은 가족의 SOS · 도와줘요 — 놓치지 않게 화면 맨 위에. 누르면 그 가족으로 바꾼다
export function OtherFamilyAlerts({ className = "" }) {
  const sync = useSync();
  const fam = useFamilies();
  const [busy, setBusy] = useState(null);
  if (!fam.on || !sync.staff || fam.status !== "ready") return null;
  const urgent = fam.families.filter((f) => f.id !== sync.household && (f.sos || f.help));
  if (!urgent.length) return null;
  const go = async (id) => {
    setBusy(id);
    try {
      await sync.switchFamily(id);
    } finally {
      setBusy(null);
    }
  };
  return (
    <div role="alert" aria-label="다른 가족에서 온 긴급" className={`space-y-1.5 ${className}`}>
      {urgent.map((f) => (
          <button
            key={f.id}
            type="button"
            disabled={busy === f.id}
            onClick={() => go(f.id)}
            className={`btn-press flex min-h-[48px] w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-left ${f.sos ? "animate-sosPulse bg-danger text-white" : "border border-amber/40 bg-[#FFF7E8] text-[#5A4A22]"}`}
          >
            <span className="min-w-0 flex-1 text-[14px] font-bold leading-[1.5]">
              {f.sos ? "SOS" : `도와줘요 ${f.help}건`} — {f.title}
              <span className="block text-[12px] font-medium opacity-90">지금 보고 있는 가족이 아닙니다 · 누르면 그 가족으로 갑니다</span>
            </span>
            <span className="shrink-0 text-[13px] font-bold">열기 ›</span>
          </button>
      ))}
    </div>
  );
}
