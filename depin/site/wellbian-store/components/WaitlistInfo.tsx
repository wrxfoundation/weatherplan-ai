"use client";
/* GNB 우측 「응모·순번 안내」 칩 + 로직 설명 모달
   — 2차 물량 응모(S그룹 추첨)와 순번 변동(점수→그룹) 규칙을 화면 안에서 설명 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { COPY_DUAL, COPY_SCORE, COPY_TICKETS, NOTICE_CARRYOVER, NOTICE_SELF_CHECK, NOTICE_TICKET_CAP } from "@/lib/data";

function Num({ n }: { n: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 99, background: "var(--w-main)", color: "#fff", fontSize: 13, fontWeight: 800, flex: "none" }}>
      {n}
    </span>
  );
}

function InfoModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    addEventListener("keydown", esc);
    return () => { document.body.style.overflow = ""; removeEventListener("keydown", esc); };
  }, [onClose]);

  const chip = (l: string, v: string) => (
    <span key={l} style={{ display: "inline-flex", alignItems: "baseline", gap: 5, background: "var(--sec-alt)", border: "1px solid var(--bd-card)", borderRadius: 99, padding: "4px 10px", fontSize: 11.5, whiteSpace: "nowrap" }}>
      <span style={{ color: "var(--ink-3)" }}>{l}</span>
      <b style={{ color: "var(--w-deep)" }}>{v}</b>
    </span>
  );

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label="2차 응모·순번 안내" style={{ gap: 18 }}>
        <div className="sheet-handle" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--w-deep)", lineHeight: 1.35 }}>
            2차 물량 응모와 순번,<br />이렇게 정해집니다
          </h3>
          <button onClick={onClose} aria-label="닫기" style={{ color: "var(--dis)", fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        {/* ① 응모권 — S그룹 추첨 */}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <Num n="1" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--w-deep)" }}>응모권 — S그룹(1,000명) 추첨</div>
            <div style={{ fontSize: 13, lineHeight: 1.65, color: "var(--ink-3)" }}>
              미션으로 모은 응모권이 {COPY_TICKETS}. 추첨 방식은 접수 마감 전에 미리 공개되어 누구나 같은 결과를 다시 확인할 수 있고, 발표는 9/30 마감 직후입니다.
            </div>
            <div style={{ fontSize: 11.5, color: "var(--cap)" }}>{NOTICE_TICKET_CAP}</div>
          </div>
        </div>

        {/* ② 순번 점수 — 변동 규칙 */}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <Num n="2" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--w-deep)" }}>순번 점수 — 그룹을 확정합니다</div>
            <div style={{ fontSize: 13, lineHeight: 1.65, color: "var(--ink-3)" }}>
              {COPY_SCORE}. 저희가 확인할 수 있는 활동만 점수에 들어갑니다.
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {chip("대기 등록", "100점")}{chip("구매 의사", "20점")}{chip("wellbian 커뮤니티", "20점")}{chip("친구 초대", "30점")}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.65, color: "var(--ink-3)" }}>
              <b style={{ color: "var(--w-deep)" }}>순번이 바뀌는 경우</b> — 내가 미션을 완료하거나 초대가 성사되면 오르고, 다른 참가자의 점수에 따라 상대 순위도 움직입니다. 9월 중 1회 중간 재계산으로 반영되고, 최종 순번은 9/30 마감 때 확정됩니다.
            </div>
          </div>
        </div>

        {/* ③ 오픈 순서 */}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <Num n="3" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--w-deep)" }}>구매는 S → A → B → 일반 순서로 열립니다 (10/3)</div>
            <div style={{ fontSize: 13, lineHeight: 1.65, color: "var(--ink-3)" }}>{COPY_DUAL}</div>
          </div>
        </div>

        {/* 고지 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 7, border: "1px solid var(--bd-card)", background: "var(--panel)", borderRadius: 12, padding: "13px 16px", fontSize: 11.5, lineHeight: 1.6, color: "var(--cap)" }}>
          {[NOTICE_SELF_CHECK, NOTICE_CARRYOVER].map((t) => (
            <span key={t} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ flex: "none", width: 4, height: 4, borderRadius: 99, background: "var(--hint)", marginTop: 7 }} />
              {t}
            </span>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/waitlist" onClick={onClose} className="btn-main" style={{ flex: 1, fontSize: 14, borderRadius: 10, padding: 13, textDecoration: "none", color: "#fff" }}>
            대기 등록 하러 가기
          </Link>
          <Link href="/me/waitlist" onClick={onClose} className="btn-outline-deep" style={{ flex: 1, fontSize: 14, borderRadius: 10, padding: 13, textDecoration: "none" }}>
            내 순번 보기
          </Link>
        </div>
      </div>
    </div>
  );
}

/* GNB 우측용 트리거 칩 */
export default function WaitlistInfoChip({ deskOnly = false }: { deskOnly?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={deskOnly ? "desk-only" : undefined}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--w-deep)", border: "1px solid var(--bd-btn)", borderRadius: 8, padding: "7px 11px", background: "#fff", whiteSpace: "nowrap" }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 14, height: 14, borderRadius: 99, background: "var(--w-tint)", color: "var(--w-main)", fontSize: 10, fontWeight: 800 }}>?</span>
        응모·순번 안내
      </button>
      {open && <InfoModal onClose={() => setOpen(false)} />}
    </>
  );
}
