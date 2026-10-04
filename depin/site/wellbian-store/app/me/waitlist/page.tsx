"use client";
/* 2b 내 대기 현황 — 미션 대시보드 (응모권 · 순번 점수 · 예상 그룹) */
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { redirect } from "next/navigation";
import { Check } from "@/components/icons";
import WaitlistInfoChip from "@/components/WaitlistInfo";
import {
  MISSIONS, MOCK_WAITLIST_ME, NOTICE_ABUSE, NOTICE_INVITE_VERIFY, NOTICE_SELF_CHECK, NOTICE_TICKET_CAP, VERIFY_LABEL, SCORE_ROWS, WAITLIST_ENABLED, fmt,
} from "@/lib/data";
import type { Mission } from "@/lib/data";

const TICKET_VALUE: Record<string, number> = {
  join: 10, share: 6, community: 5, invite: 10, daily: 1,
  x_follow: 3, kw_app: 5, kw_youtube: 3, kw_insta: 2,
};

export default function MissionDashboard() {
  if (!WAITLIST_ENABLED) redirect("/");
  const me = MOCK_WAITLIST_ME;
  const [missions, setMissions] = useState<Mission[]>(MISSIONS);
  const [copied, setCopied] = useState(false);

  const doneCount = missions.filter((m) => m.done).length;
  const tickets = me.tickets + missions.filter((m, i) => m.done && !MISSIONS[i].done).reduce((s, m) => s + (TICKET_VALUE[m.key] ?? 0), 0);

  const complete = async (key: string) => {
    try {
      await fetch(`/api/waitlist/missions/${key}`, { method: "POST" });
    } catch {}
    setMissions((ms) => ms.map((m) => (m.key === key ? { ...m, done: true } : m)));
  };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(`https://wlbn.wellbianlabs.io/waitlist?invite=${me.inviteCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--panel)" }}>
      {/* 헤더 */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, padding: "0 36px", borderBottom: "1px solid var(--line)", background: "#fff" }} className="gnb-root">
        <Link href="/" style={{ display: "inline-flex" }}>
          <Image src="/assets/wb-black.png" alt="wellbian" width={100} height={20} style={{ height: 20, width: "auto" }} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--ink-4)" }}>
          <WaitlistInfoChip />
          <span className="mono desk-only" style={{ background: "var(--sec-alt)", borderRadius: 8, padding: "6px 10px" }}>rWLB9…kQ2f</span>
          <span>대기번호 <b style={{ color: "var(--w-deep)" }}>#{fmt(me.queueNo)}</b></span>
        </div>
      </header>

      {/* 재산정 스트립 */}
      <div className="tint-strip" style={{ background: "var(--w-tint)", fontSize: 12.5, color: "var(--ink-2)" }}>
        <div className="strip-in">
          <span><b style={{ color: "var(--w-main)" }}>중간 점수 재계산 완료(9월 중 1회)</b> — 지금 순위가 반영되어 있습니다 · 최종 확정은 9/30 마감 때</span>
          <span style={{ color: "var(--cap)" }}>추첨 방식 공개: 9/30 마감 전</span>
        </div>
      </div>

      {/* PC: 메인과 동일하게 1080px 중앙 컨테이너 */}
      <main className="dash-pad">
        <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* 상단 3카드 */}
        <div className="dash-top">
          <div style={{ background: "#fff", border: "1px solid var(--bd-card)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--cap)" }}>내 응모권 — S그룹 추첨</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 34, fontWeight: 800, color: "var(--w-main)" }}>{tickets}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-4)" }}>장</span>
            </div>
            <span style={{ fontSize: 12, color: "var(--hint)" }}>1,000명 추첨 · 많을수록 잘 뽑힙니다 · 1인 상한 있음</span>
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--bd-card)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--cap)" }}>내 순번 점수 — 그룹 확정</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 34, fontWeight: 800, color: "var(--w-deep)" }}>{me.score}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-4)" }}>점</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 2 }}>
              {SCORE_ROWS.map((sr) => (
                <div key={sr.t} style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--cap)" }}>
                  <span>✓ {sr.t}</span>
                  <span style={{ fontWeight: 700, color: "var(--ink-4)" }}>{sr.p}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "var(--w-deep)", color: "#fff", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.6)" }}>내 그룹 — 기준 140점 (고정)</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, background: "#fff", color: "var(--w-deep)", fontSize: 21, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{me.expectedGroup}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 800 }}>{me.expectedGroup}그룹 확정 — {me.score}점 (기준 140점 이상)</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>점수는 내려가지 않아 확정이 유지됩니다 · 추첨 결과와도 무관합니다</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 2 }}>
              <div className="track on-dark" style={{ height: 7 }}><i style={{ width: "78%" }} /></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,.5)" }}>
                <span>B 구간</span><span>A 기준 140점</span><span>기준 고정</span>
              </div>
            </div>
          </div>
        </div>

        {/* 미션 리스트 + 우측 컬럼 */}
        <div className="dash-main">
          <div style={{ background: "#fff", border: "1px solid var(--bd-card)", borderRadius: 16, padding: "8px 24px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 2px", borderBottom: "1px solid var(--line)" }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "var(--w-deep)" }}>미션</span>
              <span style={{ fontSize: 12, color: "var(--cap)" }}>{doneCount} / {missions.length} 완료</span>
            </div>
            {missions.map((m) => (
              <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 2px", borderBottom: "1px solid var(--line-2)" }}>
                {m.done ? (
                  <span style={{ width: 24, height: 24, borderRadius: 99, background: "var(--w-main)", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                    <Check size={12} color="#fff" />
                  </span>
                ) : (
                  <span style={{ width: 24, height: 24, borderRadius: 99, border: "2px solid var(--bd-input)", background: "#fff", flex: "none" }} />
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--w-deep)" }}>{m.title}</span>
                  {m.note && <span style={{ fontSize: 11.5, color: "var(--hint)" }}>{m.note}</span>}
                </div>
                <span className="desk-only" style={{ fontSize: 10.5, fontWeight: 700, color: "var(--cap)", border: "1px solid var(--bd-btn)", borderRadius: 99, padding: "3px 9px", whiteSpace: "nowrap" }}>
                  {VERIFY_LABEL[m.verify]}
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--w-main)", width: 52, textAlign: "right", flex: "none" }}>{m.tickets}</span>
                {m.done ? (
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--hint)", width: 74, textAlign: "center", flex: "none" }}>적립됨</span>
                ) : (
                  <button
                    onClick={() => complete(m.key)}
                    style={{ display: "inline-flex", justifyContent: "center", border: "1.5px solid var(--w-main)", color: "var(--w-main)", fontSize: 12, fontWeight: 800, borderRadius: 8, padding: "7px 0", width: 74, flex: "none" }}
                  >
                    참여하기
                  </button>
                )}
              </div>
            ))}
            <div style={{ padding: "13px 2px", fontSize: 11.5, lineHeight: 1.6, color: "var(--hint)" }}>{NOTICE_SELF_CHECK} {NOTICE_TICKET_CAP}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* 친구 초대 */}
            <div style={{ background: "#fff", border: "2px solid var(--w-main)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--w-deep)" }}>친구 초대 — 성사 {me.invitedOk} / 10명</span>
              <button onClick={copyInvite} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--w-tint)", borderRadius: 10, padding: "12px 14px", width: "100%" }}>
                <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: "var(--w-deep)" }}>{me.inviteCode}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--w-main)" }}>{copied ? "복사됨" : "링크 복사"}</span>
              </button>
              <div className="track" style={{ height: 6, background: "var(--line)" }}><i style={{ width: `${me.invitedOk * 10}%` }} /></div>
              <span style={{ fontSize: 12, lineHeight: 1.6, color: "var(--ink-4)" }}>
                성사 1명 = 응모권 +5장 · 순번 점수 반영 · <b style={{ color: "var(--ink-2)" }}>초대 {10 - me.invitedOk}명 남음</b>
              </span>
              <span style={{ fontSize: 11, lineHeight: 1.6, color: "var(--hint)" }}>{NOTICE_INVITE_VERIFY} {NOTICE_ABUSE}</span>
            </div>

            {/* 일정 */}
            <div style={{ background: "#fff", border: "1px solid var(--bd-card)", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5, color: "var(--ink-4)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>접수 마감</span><b style={{ color: "var(--w-deep)" }}>9/30 (판매 사흘 전)</b></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>S그룹 추첨 발표</span><b style={{ color: "var(--w-deep)" }}>9/30 마감 직후</b></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>2차 판매 오픈</span><b style={{ color: "var(--w-main)" }}>10/3 S→A→B→일반</b></div>
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
