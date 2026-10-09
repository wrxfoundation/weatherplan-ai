// 관제 SOS 팝업 — 어르신 SOS 가 들어오면 어느 메뉴 · 어느 스크롤 위치에 있든 화면 가운데에 뜬다
// (2026-10-02 현장 요청: "SOS 발생 시 팝업처럼 떠야 하는데, SOS 대응 탭에 건수만 올라감").
// 닫아도 위쪽 빨간 배너와 SOS 대응 메뉴에는 그대로 남는다 — 팝업은 '놓치지 않게', 처리는 배너 · 센터에서.
import { useEffect, useRef } from "react";
import PhoneLink from "./PhoneLink";
import { telHref } from "../../lib/ops-health";

export default function SosAlertModal({ customer, sosAt, elapsed, dispatched, canDispatch = true, onOpenCenter, onDispatch, onClose }) {
  const first = useRef(null);
  useEffect(() => {
    first.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const c = customer;
  const main = c.guardians.find((g) => g.role === "주") || c.guardians[0];
  const dial = telHref(c.phone);
  const at = sosAt ? new Date(sosAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : "방금";
  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-navy/55 px-4" onClick={onClose}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="sos-alert-title"
        aria-describedby="sos-alert-desc"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[520px] overflow-hidden rounded-[16px] bg-white shadow-2xl"
      >
        <div className="animate-sosPulse bg-danger px-5 py-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-lg bg-white/[.18] px-2.5 py-1 text-[12px] font-bold tracking-[.14em]">SOS 발생</span>
            <span className="font-num text-[13px] opacity-90">{at} · 경과 {elapsed}</span>
          </div>
          <h2 id="sos-alert-title" className="mt-2 text-[22px] font-bold leading-[1.35]">
            {c.name}{c.age ? ` (${c.age})` : ""} 어르신 SOS 버튼 발신
          </h2>
          <p id="sos-alert-desc" className="mt-0.5 text-[14px] opacity-90">
            {c.district} · 목표 응답 60초 이내 · {dispatched ? "급파 지시됨" : "급파 지시 전"}
          </p>
        </div>
        <div className="space-y-2 px-5 py-4 text-[14px]">
          <div className="flex items-baseline gap-3">
            <span className="w-[72px] shrink-0 text-[12px] text-muted">휴대폰</span>
            <PhoneLink phone={c.phone} source={c.phoneSource} />
          </div>
          {main && (
            <div className="flex items-baseline gap-3">
              <span className="w-[72px] shrink-0 text-[12px] text-muted">주 보호자</span>
              <span className="min-w-0">
                <b className="text-navy">{main.name}</b> <span className="text-muted">({main.rel})</span>{" "}
                <PhoneLink phone={main.phone} source={main.phoneSource} />
              </span>
            </div>
          )}
          <div className="flex items-baseline gap-3">
            <span className="w-[72px] shrink-0 text-[12px] text-muted">자택</span>
            <span className="text-ink">{c.address}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-navy/[.08] px-5 py-4">
          <button ref={first} onClick={onOpenCenter} className="btn-press flex-1 rounded-xl bg-danger px-4 py-3 text-[15px] font-bold text-white">
            SOS 대응 열기
          </button>
          {dial && (
            <a href={dial} className="btn-press flex-1 rounded-xl border border-danger px-4 py-3 text-center text-[15px] font-bold text-danger">
              어르신께 전화
            </a>
          )}
          <button
            onClick={onDispatch}
            disabled={dispatched || !canDispatch}
            className="btn-press rounded-xl border border-navy/20 px-4 py-3 text-[14px] font-bold text-navy disabled:opacity-60"
          >
            {dispatched ? "급파 중" : canDispatch ? "급파 지시" : "급파할 컨시어지 없음"}
          </button>
          <button onClick={onClose} className="btn-press w-full rounded-xl py-2 text-[13px] font-bold text-muted underline underline-offset-2">
            닫기 — 위쪽 빨간 배너에서 계속 처리
          </button>
        </div>
      </div>
    </div>
  );
}
