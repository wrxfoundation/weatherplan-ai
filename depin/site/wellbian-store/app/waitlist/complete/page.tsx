"use client";
/* 2c 대기 등록 완료 — 공유 카드(초대 코드 내장) */
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { redirect } from "next/navigation";
import { SubHeader } from "@/components/chrome";
import { Check, TgIcon, XIcon } from "@/components/icons";
import { LINKS, MOCK_WAITLIST_ME, WAITLIST_ENABLED } from "@/lib/data";

export default function WaitlistCompletePage() {
  if (!WAITLIST_ENABLED) redirect("/");
  const [copied, setCopied] = useState(false);
  const code = MOCK_WAITLIST_ME.inviteCode;

  const saveCard = async () => {
    try {
      await navigator.clipboard.writeText(`wellbian 2차 대기 초대 코드: ${code}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <SubHeader right={<span style={{ fontSize: 12.5, color: "var(--cap)" }}>2차 대기 등록</span>} />

      <main className="wl-sec-pad" style={{ display: "flex", flexDirection: "column", gap: 22, alignItems: "center", background: "linear-gradient(var(--panel), #fff)" }}>
        <span style={{ width: 58, height: 58, borderRadius: 99, background: "var(--w-tint)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <Check size={27} color="var(--w-main)" w={3} />
        </span>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(21px, 3.5vw, 26px)", fontWeight: 800, color: "var(--w-deep)" }}>
            대기 등록 완료 — <span style={{ color: "var(--w-main)" }}>#12,848</span>
          </h2>
          <div style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--ink-4)", flexWrap: "wrap", justifyContent: "center" }}>
            <span>응모권 <b style={{ color: "var(--w-main)" }}>+10장</b></span>
            <span>·</span>
            <span>순번 점수 <b style={{ color: "var(--w-deep)" }}>+100점</b></span>
            <span>·</span>
            <span>확인 이메일 발송됨</span>
          </div>
        </div>

        {/* 공유 카드 */}
        <div className="w440" style={{ background: "var(--w-deep)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 14, color: "#fff", boxShadow: "0 16px 40px rgba(27,27,72,.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Image src="/assets/wb-white.png" alt="wellbian" width={70} height={14} style={{ height: 14, width: "auto", opacity: 0.9 }} />
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", color: "rgba(255,255,255,.5)" }}>2ND BATCH WAITLIST</span>
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.45 }}>
            나와 함께 대기하면<br />우리 둘 다 응모권을 받아요
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,.1)", border: "1px dashed rgba(255,255,255,.3)", borderRadius: 10, padding: "11px 14px" }}>
            <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>{code}</span>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: "color-mix(in oklab, var(--w-main) 45%, white)" }}>초대 코드 내장</span>
          </div>
          <button className="btn-main" style={{ fontSize: 13.5, borderRadius: 10, padding: 12 }} onClick={saveCard}>
            {copied ? "복사되었습니다" : "공유 카드 저장 · 소식 공유 +6장"}
          </button>
        </div>

        {/* 다음 행동 3버튼 */}
        <div className="w440 rl-grid" style={{ gap: 10 }}>
          <Link href="/me/waitlist" className="btn-ghost" style={{ padding: 12, fontSize: 12.5, borderRadius: 10, textDecoration: "none" }}>
            미션 시작
          </Link>
          <a href={LINKS.telegram} target="_blank" rel="noopener" className="btn-main" style={{ padding: 12, fontSize: 12.5, borderRadius: 10, color: "#fff", textDecoration: "none" }}>
            <TgIcon size={13} /> 텔레그램
          </a>
          <a href={LINKS.x} target="_blank" rel="noopener" className="btn-ghost" style={{ padding: 12, fontSize: 12.5, borderRadius: 10, textDecoration: "none" }}>
            <XIcon size={12} /> X 팔로우
          </a>
        </div>
      </main>
    </div>
  );
}
