// 영업자 화면 — 회원 유치 담당 (2026-09-23 이성준 님 요청).
// "간략히 수당과 본인이 모집한 고객정보가 보이도록" — 한 화면에 실적 · 수당 · 내 고객 · 초대 링크.
//
// 영업자는 컨시어지가 아니다: 케어(방문·동행)에는 관여하지 않고 고객 모집만 한다.
// 그래서 고객의 건강·위치·케어 기록은 이 화면에 싣지 않는다 — 이름·연락처도 일부만 보인다.
// 수당은 수수료 제도가 오기 전까지 금액을 만들지 않는다 (lib/sales.js).
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, SectionLabel, Badge } from "../components/ui";
import Icon from "../components/icons";
import { useAppState } from "../lib/state";
import { fmtWon } from "../lib/config";
import {
  IN_PROGRESS,
  PAID,
  SALES_COMMISSION,
  SALES_CUSTOMERS,
  SALES_REP,
  SALES_STATUS,
  commissionFor,
  householdLabel,
  liveLead,
  maskName,
  monthlyOf,
  referralPath,
  salesSummary,
} from "../lib/sales";

const FILTERS = [
  ["all", "전체"],
  ["progress", "진행 중"],
  ["paid", "가입 완료"],
  ["lost", "가입 안 함 · 해지"],
];

const md = (d) => (d ? `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}` : null);

export default function SalesPage() {
  const { state } = useAppState();
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(null);
  const [copied, setCopied] = useState(false);
  // 주소 앞부분은 브라우저에서만 안다 — 렌더 중에 window 를 읽으면 정적 HTML 과 어긋난다
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  // 가입 상담에서 내 코드로 들어온 신청이 있으면 맨 위에 붙는다 — 영업 → 가입 상담 연계
  const rows = useMemo(() => {
    const live = liveLead(state.onboarding);
    return live ? [live, ...SALES_CUSTOMERS] : SALES_CUSTOMERS;
  }, [state.onboarding]);

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const sum = salesSummary(rows, monthKey);
  const commission = commissionFor(rows);

  const list = rows
    .filter((r) => {
      if (filter === "progress") return IN_PROGRESS.has(r.status);
      if (filter === "paid") return PAID.has(r.status);
      if (filter === "lost") return r.status === "dropped" || r.status === "canceled";
      return true;
    })
    .sort((a, b) => (b.live ? 1 : 0) - (a.live ? 1 : 0) || (b.leadAt || "").localeCompare(a.leadAt || ""));

  const link = `${origin}${referralPath()}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // 클립보드가 막힌 브라우저 — 링크는 화면에 그대로 보이니 길게 눌러 복사하면 된다
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "K-CARE 가입 상담", text: "부모님 케어 멤버십 K-CARE — 가입 상담은 아래 링크에서 신청하실 수 있습니다.", url: link });
        return;
      } catch {
        /* 공유 창을 닫은 것 — 아무것도 하지 않는다 */
      }
    }
    copy();
  };

  return (
    <>
      <Head>
        <title>영업자 — K-CARE</title>
      </Head>
      <div className="min-h-screen bg-nav">
        <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-paper">
          <header className="sticky top-0 z-20 border-b border-navy/10 bg-paper/95 px-5 pb-3 pt-4 backdrop-blur">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-num text-[11px] font-bold tracking-[.18em] text-gold">SALES · 회원 유치</div>
                <div className="mt-0.5 flex items-center gap-2">
                  <h1 className="whitespace-nowrap text-[21px] font-black text-navy">{SALES_REP.name} 영업자</h1>
                  <span className="chip-gold shrink-0 rounded-full px-2 py-[3px] text-[10px] font-bold">{SALES_REP.model}</span>
                </div>
                <div className="mt-0.5 font-num text-[12px] text-muted">
                  {SALES_REP.code} · {SALES_REP.branch}
                </div>
              </div>
              <Link href="/" className="tap shrink-0 text-[12px] font-bold text-muted/60">
                데모 홈
              </Link>
            </div>
          </header>

          <main className="flex-1 space-y-3.5 px-4 pb-12 pt-4">
            {/* 이번 달 실적 */}
            <Card className="p-[18px]">
              <div className="flex items-baseline gap-2">
                <span className="text-[15px] font-black text-navy">{now.getMonth() + 1}월 실적</span>
                <span className="ml-auto font-num text-[12px] text-muted">누적 모집 {sum.total}건 · 가입 전환 {sum.conversion}%</span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                {[
                  ["상담 신청", sum.leadsMonth, "#3B5C8A"],
                  ["진행 중", sum.inProgress, "#7A4C8A"],
                  ["가입 완료", sum.paidMonth, "#8A5D12"],
                  ["설치 완료", sum.installed, "#1E7A5A"],
                ].map(([k, v, c]) => (
                  <div key={k} className="rounded-xl bg-navy/[.04] px-1 py-2.5">
                    <div className="font-num text-[22px] font-black leading-none" style={{ color: c }}>{v}</div>
                    <div className="mt-1 text-[11px] text-muted">{k}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 수당 — 제도 확정 전에는 금액을 만들지 않는다 */}
            <Card className="p-[18px]">
              <div className="flex items-center gap-2">
                <span aria-hidden className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-gold/15 text-gold">
                  <Icon name="coin" size={16} />
                </span>
                <span className="text-[15px] font-black text-navy">수당</span>
                <span className="ml-auto">
                  {commission ? (
                    <Badge fg="#1E7A5A" bg="rgba(30,122,90,.12)">확정</Badge>
                  ) : (
                    <Badge fg="#8A5D12" bg="rgba(138,93,18,.14)">확정 전</Badge>
                  )}
                </span>
              </div>
              {commission ? (
                <>
                  <div className="mt-3 font-num text-[28px] font-black text-navy">{fmtWon(commission.total)}</div>
                  <div className="mt-1 text-[12px] text-muted">
                    대상 {commission.eligible}건 · 가입·설치비 몫 {fmtWon(commission.fromEntry)} · 월 구독 몫 {fmtWon(commission.fromMonthly)}
                  </div>
                </>
              ) : (
                <p className="mt-2.5 rounded-xl border border-amber/30 bg-[#FFF7E8] px-3 py-2.5 text-[13px] leading-[1.7] text-[#5A4A22]">
                  {SALES_COMMISSION.pendingNote}
                </p>
              )}
              <div className="mt-3 border-t border-navy/[.08] pt-3">
                <div className="text-[12px] font-bold text-muted">수당 계산에 쓰일 내 실적</div>
                <div className="mt-2 space-y-1.5 text-[13.5px]">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted">가입 완료 고객</span>
                    <span className="font-num font-bold text-ink">{sum.paid}건</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted">가입·설치비 결제 합계</span>
                    <span className="font-num font-bold text-ink">{fmtWon(sum.entrySum)}</span>
                  </div>
                  {sum.entryUnknown > 0 && (
                    <p className="text-[11.5px] leading-[1.6] text-muted">
                      부부 가구 {sum.entryUnknown}건은 가입·설치비가 확정 전이라 합계에서 뺐습니다.
                    </p>
                  )}
                  <div className="flex justify-between gap-3">
                    <span className="text-muted">월 구독료 합계</span>
                    <span className="font-num font-bold text-ink">{fmtWon(sum.monthlySum)} / 월</span>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-[11.5px] leading-[1.7] text-muted">
                직판 방식입니다 — 내가 직접 모집한 고객만 집계되고, 하위 조직 수당은 없습니다.
              </p>
            </Card>

            {/* 내 모집 고객 */}
            <Card className="p-4">
              <div className="flex items-baseline gap-2">
                <span className="text-[15px] font-black text-navy">내가 모집한 고객</span>
                <span className="ml-auto font-num text-[12px] text-muted">{list.length}건</span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {FILTERS.map(([k, label]) => {
                  const on = filter === k;
                  return (
                    <button
                      key={k}
                      onClick={() => setFilter(k)}
                      aria-pressed={on}
                      className="btn-press btn-chip rounded-full border px-3 text-[12px] font-bold"
                      style={on ? { background: "#0A1F3C", color: "#FFFFFF", borderColor: "#0A1F3C" } : { color: "#5C5A54", borderColor: "rgba(10,31,60,.15)" }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2.5 space-y-2">
                {list.length === 0 && <p className="py-4 text-center text-[13px] text-muted">해당하는 고객이 없습니다.</p>}
                {list.map((r) => {
                  const st = SALES_STATUS[r.status];
                  const isOpen = open === r.id;
                  return (
                    <div
                      key={r.id}
                      className="rounded-xl border bg-white/70"
                      style={r.live ? { borderColor: "rgba(176,141,87,.55)", background: "#FBF6EC" } : { borderColor: "rgba(10,31,60,.08)" }}
                    >
                      <button
                        onClick={() => setOpen(isOpen ? null : r.id)}
                        aria-expanded={isOpen}
                        className="btn-press flex w-full items-center gap-3 p-3 text-left"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[15px] font-bold text-navy">{r.live ? r.name : `${maskName(r.name)} 님`}</span>
                            <span className="text-[11.5px] text-muted">{r.rel}</span>
                            {r.live && <Badge fg="#7A5C28" bg="rgba(176,141,87,.2)">새 신청</Badge>}
                          </span>
                          <span className="mt-0.5 block text-[12px] text-muted">
                            {r.district} · {householdLabel(r.household)} · 신청 {md(r.leadAt)}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <Badge fg={st.fg} bg={st.bg}>{st.label}</Badge>
                        </span>
                        <span aria-hidden className="shrink-0 text-muted transition-transform duration-200" style={{ transform: isOpen ? "rotate(180deg)" : "none" }}>
                          <Icon name="chev" size={16} strokeWidth={2} />
                        </span>
                      </button>
                      {isOpen && (
                        <div className="border-t border-navy/[.07] px-3 pb-3 pt-2.5 text-[12.5px] leading-[1.7] text-ink">
                          <ol className="flex flex-wrap gap-x-3 gap-y-1">
                            {[
                              ["상담 신청", r.leadAt],
                              ["가입", r.joinedAt],
                              ["설치", r.installedAt],
                            ].map(([k, d]) => (
                              <li key={k} className={d ? "font-bold text-navy" : "text-muted"}>
                                {d ? "✓" : "○"} {k} {d ? md(d) : ""}
                              </li>
                            ))}
                          </ol>
                          <div className="mt-1.5 text-muted">
                            연락처 {r.phone} · 월 구독 {fmtWon(monthlyOf(r.household))}
                          </div>
                          {r.note && <div className="mt-1 text-muted">메모 · {r.note}</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                고객의 건강 · 위치 · 케어 기록은 영업자 화면에 나오지 않습니다. 이름과 연락처도 일부만
                보입니다.
              </p>
            </Card>

            {/* 고객 초대 — 가입 상담 링크. 이 링크로 들어온 신청은 내 고객으로 집계된다. */}
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <span aria-hidden className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-navy/[.06] text-navy">
                  <Icon name="megaphone" size={16} />
                </span>
                <span className="text-[15px] font-black text-navy">고객 초대</span>
              </div>
              <p className="mt-2 text-[12.5px] leading-[1.7] text-muted">
                이 링크로 가입 상담을 신청하면 내 고객으로 집계됩니다. 링크 없이 신청한 고객에게는 추천
                코드 <b className="font-num text-navy">{SALES_REP.code}</b> 를 알려 주세요.
              </p>
              <div className="mt-2.5 break-all rounded-xl border border-navy/12 bg-white/70 px-3 py-2.5 font-num text-[12.5px] text-navy">
                {link}
              </div>
              <div className="mt-2.5 flex gap-2">
                <button onClick={copy} className="btn-press flex-1 rounded-xl border border-navy/20 py-3 text-[14px] font-bold text-navy">
                  {copied ? "✓ 복사됨" : "링크 복사"}
                </button>
                <button onClick={share} className="btn-press btn-dark flex-[1.4] rounded-xl bg-navy py-3 text-[14px] font-bold text-white">
                  고객에게 공유
                </button>
              </div>
              <Link href={referralPath()} className="tap mt-2 flex w-full items-center justify-center text-[12.5px] font-bold text-gold underline underline-offset-2">
                내 링크로 가입 상담 화면 열어 보기
              </Link>
            </Card>

            {/* 영업 안내 — 무엇을 하고 무엇을 하지 않는지 */}
            <Card className="p-4">
              <SectionLabel>영업 안내</SectionLabel>
              <ul className="mt-2 space-y-1.5 text-[12.5px] leading-[1.7] text-ink">
                <li>· 영업자는 회원 유치를 맡습니다. 방문 · 동행 같은 케어 업무는 컨시어지가 합니다.</li>
                <li>· 요금과 해지 · 환불 규정은 서비스 소개에 있는 그대로 안내합니다. 확정 전인 요금은 확정 전이라고 말씀해 주세요.</li>
                <li>· 의료 행위 · 진단을 하는 서비스가 아닙니다. 건강이 좋아진다고 약속하지 않습니다.</li>
              </ul>
              <Link href="/service" className="tap mt-2.5 flex w-full items-center justify-center rounded-xl border border-navy/15 text-[13px] font-bold text-navy">
                서비스 소개 열기 (요금 · 해지 · 환불)
              </Link>
            </Card>
          </main>
        </div>
      </div>
    </>
  );
}
