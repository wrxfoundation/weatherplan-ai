/* ============================================================
 * Weather Plan AI · /agency-board
 *
 * 광고대행사 AE 다중 광고주 콘솔 — v1.2 로드맵 미리 구현
 * AE 한 명이 광고주 5~10개를 동시 운영하는 워크플로우
 *
 * 페이지 구조:
 * - 좌측: 광고주 리스트 (5~10개) + 신규 추가 + 검색
 * - 중앙: 선택한 광고주의 일간 추천 결과 + 챗봇 대화
 * - 우측: 일간 보고 자동 요약 (광고주 모두 한 번에 카톡 보고용)
 *
 * 라우팅: /agency-board
 * ============================================================ */

import React, { useState, useMemo } from "react";

/* ─── 디자인 토큰 ─── */
const T = {
  canvas:        "#FFFFFF",
  surface:       "#F7F5EE",
  surfaceSoft:   "#FAF8F2",
  ink:           "#050038",
  charcoal:      "#1A1A1A",
  slate:         "#4F5460",
  steel:         "#7B7F8C",
  muted:         "#9CA3AF",
  hairline:      "rgba(5,0,56,0.12)",
  hairlineSoft:  "rgba(5,0,56,0.08)",
  brandTeal:     "#4EB3A8",
  mossDark:      "#14443B",
  brandBlue:     "#4262FF",
  tealLight:     "#D7F2EE",
  coralDark:     "#E04E2C",
  rose:          "#FFE2D7",
  yellow:        "#FFD43B",
  amber:         "#FFB800",
  onPrimary:     "#FFFFFF",
};

const R = { sm: 8, md: 10, lg: 12, xl: 16, xxl: 20, xxxl: 24, full: 9999 };

/* ─── 광고주 mock 데이터 8개 ─── */
/* 각 lift에 metric(어떤 지표) + basis(근거) 필수 — 모호한 +XX% 금지 */
const MOCK_CLIENTS = [
  {
    id: "c1", name: "골든커피 (강남)", industry: "음료·외식", emoji: "☕",
    region: "서울 강남구", budget: "월 800만원", channels: ["인스타그램", "네이버 GFA"],
    lastUpdate: "5분 전", status: "live",
    lift: "+38%", liftMetric: "매장 매출",
    liftBasis: "장마 시즌 카페 방문 +22% (KOBACO 2024) × 위치 5km 반경 매칭 +16%p",
    todayRec: "장마 진입 D-7. 인스타·페북 입찰 +35% 권장. 비 오는 날 카피 \"빗소리 가까운 커피\"",
    season: "장마", trigger: "주말 강수확률 78%",
  },
  {
    id: "c2", name: "오미가 빙수 (홍대)", industry: "디저트", emoji: "🍧",
    region: "서울 마포구", budget: "월 1,200만원", channels: ["인스타그램", "TikTok", "DOOH"],
    lastUpdate: "12분 전", status: "live",
    lift: "+58%", liftMetric: "매장 매출",
    liftBasis: "폭염 7일+ 디저트 매출 +42% (소상공인진흥공단) × 5km 반경 노출 +16%p",
    todayRec: "폭염 7일 연속 진입. 매장 5km 반경 인스타 광고 +50%, 콜드 메뉴 집중 노출",
    season: "폭염", trigger: "체감 33℃+ 8일 연속",
  },
  {
    id: "c3", name: "필웰 공기청정기", industry: "가전·셀러", emoji: "🌬️",
    region: "전국 (이커머스)", budget: "월 3,500만원", channels: ["쿠팡", "네이버", "GFA"],
    lastUpdate: "1시간 전", status: "live",
    lift: "+47%", liftMetric: "구매 전환율",
    liftBasis: "PM2.5 75㎍+ 시 검색→구매 전환 +47% (Dyson Air 글로벌 사례 검증)",
    todayRec: "미세먼지 PM2.5 75㎍+ 진입 지역만 쿠팡·네이버 검색광고 +60%. 익일 배송 강조",
    season: "미세먼지", trigger: "PM2.5 75㎍+",
  },
  {
    id: "c4", name: "스피드워시 차량용품", industry: "이커머스", emoji: "🚗",
    region: "전국", budget: "월 600만원", channels: ["쿠팡", "메타"],
    lastUpdate: "2시간 전", status: "pending",
    lift: "+22%", liftMetric: "ROAS",
    liftBasis: "주말 맑음 + UV 5+ 세차 검색 +180% (네이버 트렌드) → ROAS ×1.22",
    todayRec: "주말 맑음 + UV 5+ 예측 시점 세차 용품 광고 부스팅 권장 — D-3 사전 등록",
    season: "주말 맑음", trigger: "UV 5+ 주말",
  },
  {
    id: "c5", name: "베이비포레 유아용품", industry: "유아·셀러", emoji: "👶",
    region: "전국 (이커머스)", budget: "월 1,800만원", channels: ["네이버", "쿠팡", "인스타그램"],
    lastUpdate: "3시간 전", status: "live",
    lift: "+44%", liftMetric: "장바구니 객단가",
    liftBasis: "장마 시작 D-5 유아 우비·곰팡이 케어 동시 구매율 +44% (이커머스 패턴)",
    todayRec: "장마 시작 D-5. 아기 우비·우산 + 곰팡이 케어 카테고리 +40% 인스타·네이버 집중",
    season: "장마", trigger: "장마 시작 D-5",
  },
  {
    id: "c6", name: "한라피크 등산복", industry: "아웃도어", emoji: "⛰️",
    region: "전국 (이커머스)", budget: "월 2,200만원", channels: ["네이버", "구글", "인스타"],
    lastUpdate: "어제 18:24", status: "live",
    lift: "+33%", liftMetric: "광고 CTR",
    liftBasis: "주말 맑음 + UV 5+ 시점 등산 키워드 검색 +210% (네이버) → CTR +33%",
    todayRec: "주말 맑음 등산 D-Day. UV 5+, 등산복·모자·선크림 카테고리 매대 +35%",
    season: "주말 맑음", trigger: "주말 맑음 + UV 5+",
  },
  {
    id: "c7", name: "사쿠라 코스메 (신규)", industry: "뷰티·셀러", emoji: "💄",
    region: "전국 (이커머스)", budget: "월 500만원", channels: ["인스타그램", "올리브영"],
    lastUpdate: "방금 등록", status: "new",
    lift: "추천 중", liftMetric: "—",
    liftBasis: "사업장 등록 후 케이웨더 데이터 매칭 학습 중 (약 5분 소요)",
    todayRec: "추천 시스템이 학습 중 — 5분 후 첫 추천 결과 도착 예정",
    season: "—", trigger: "—",
  },
  {
    id: "c8", name: "퍼피플레이트 반려식품", industry: "반려·셀러", emoji: "🐶",
    region: "전국 (이커머스)", budget: "월 900만원", channels: ["인스타그램", "쿠팡", "네이버 쇼핑"],
    lastUpdate: "30분 전", status: "live",
    lift: "+44%", liftMetric: "구매 전환율",
    liftBasis: "장마 시작 + 반려동물 발 곰팡이·진드기 검색 +290% (Wellbian 본진 반려 카테고리)",
    todayRec: "장마 시작 D-5. 반려동물 살균·발 케어 카테고리 인스타·쿠팡 +40% 권장",
    season: "장마", trigger: "장마 시작 + 반려 검색 +290%",
  },
];

/* ─── Icon ─── */
function Icon({ name, size = 18, stroke = 2 }) {
  const p = {
    width: size, height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
  switch (name) {
    case "cloud":       return <svg {...p}><path d="M17.5 19a4.5 4.5 0 1 0-1.41-8.775A6.5 6.5 0 1 0 5.5 19Z"/></svg>;
    case "sparkles":    return <svg {...p}><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>;
    case "arrow-right": return <svg {...p}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
    case "users":       return <svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "plus":        return <svg {...p}><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
    case "search":      return <svg {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
    case "send":        return <svg {...p}><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>;
    case "menu":        return <svg {...p}><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>;
    case "x":           return <svg {...p}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
    case "copy":        return <svg {...p}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>;
    case "share":       return <svg {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>;
    case "check":       return <svg {...p}><path d="M20 6 9 17l-5-5"/></svg>;
    case "trending":    return <svg {...p}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
    case "alert":       return <svg {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>;
    default: return null;
  }
}

export default function AgencyBoardPage() {
  const [activeClientId, setActiveClientId] = useState(MOCK_CLIENTS[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [reportCopied, setReportCopied] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return MOCK_CLIENTS;
    const q = search.toLowerCase();
    return MOCK_CLIENTS.filter((c) =>
      c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q) || c.region.toLowerCase().includes(q)
    );
  }, [search]);

  const active = MOCK_CLIENTS.find((c) => c.id === activeClientId) || MOCK_CLIENTS[0];

  /* 일간 보고 자동 요약 — 광고주 전체 한 번에 카톡 보고용 */
  const dailyReport = useMemo(() => {
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}월 ${today.getDate()}일`;
    return [
      `📋 ${dateStr} · 광고주 ${MOCK_CLIENTS.length}개 일간 추천 요약`,
      ``,
      `[케이웨더 시즌 시그널]`,
      `· 장마 D-7 진입 (강남·마포·서울 일대)`,
      `· 폭염 7일 연속 (서울 전역, 체감 33℃+)`,
      `· 미세먼지 PM2.5 75㎍+ (수도권·중부)`,
      `· 주말 맑음 + UV 5+ (전국)`,
      ``,
      `[광고주별 추천 결과]`,
      ...MOCK_CLIENTS.filter((c) => c.status !== "new").map((c, i) =>
        `${i + 1}. ${c.name} (${c.industry}) · ${c.season}` +
        `\n   추천: ${c.todayRec}` +
        `\n   예상 ${c.liftMetric || "효과"}: ${c.lift}` +
        (c.liftBasis ? `\n   근거: ${c.liftBasis}` : "")
      ),
      ``,
      `💡 AE 액션 권장`,
      `· 골든커피·베이비포레 — 장마 D-7 사전 등록`,
      `· 오미가 빙수 — 폭염 매장 5km 반경 즉시 적용`,
      `· 필웰 공기청정기 — PM2.5 트리거 자동 발동`,
      ``,
      `wellbian AI · ${today.toLocaleString("ko-KR")}`,
    ].join("\n");
  }, []);

  const [shareStatus, setShareStatus] = useState(null);  // null | "shared" | "copied" | "error"

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(dailyReport);
      setReportCopied(true);
      setTimeout(() => setReportCopied(false), 1800);
    } catch (e) {
      // 구형 브라우저 fallback
      const ta = document.createElement("textarea");
      ta.value = dailyReport;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); setReportCopied(true); setTimeout(() => setReportCopied(false), 1800); }
      catch (e2) {}
      document.body.removeChild(ta);
    }
  };

  /* 카톡 공유 — 3단계 fallback
   * 1) navigator.share() (모바일 시스템 공유 시트 — 카톡 포함)
   * 2) Kakao SDK (window.Kakao 존재 시 — Picker API)
   * 3) 클립보드 복사 + 카톡 PC/모바일 앱 deep-link 시도 */
  const handleKakaoShare = async () => {
    const shareTitle = "오늘의 광고 추천 요약";
    const shareText = dailyReport;
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";

    // 1) Web Share API (모바일 시스템 공유 시트)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        setShareStatus("shared");
        setTimeout(() => setShareStatus(null), 1800);
        return;
      } catch (err) {
        // 사용자 취소 또는 share 미지원
        if (err.name === "AbortError") return;
      }
    }

    // 2) Kakao SDK Picker (SDK가 페이지에 로드된 경우)
    if (typeof window !== "undefined" && window.Kakao && window.Kakao.Share) {
      try {
        window.Kakao.Share.sendDefault({
          objectType: "text",
          text: shareText.length > 200 ? shareText.slice(0, 200) + "..." : shareText,
          link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
        });
        setShareStatus("shared");
        setTimeout(() => setShareStatus(null), 1800);
        return;
      } catch (err) {
        // SDK 호출 실패 → 다음 fallback
      }
    }

    // 3) 최종 fallback — 클립보드 복사 + 카톡 PC/모바일 앱 deep-link 안내
    try {
      await navigator.clipboard.writeText(dailyReport);
      setShareStatus("copied");
      setTimeout(() => setShareStatus(null), 2800);
    } catch (e) {
      setShareStatus("error");
      setTimeout(() => setShareStatus(null), 2400);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.surface, fontFamily: "'Pretendard Variable', Pretendard, 'Noto Sans KR', system-ui, sans-serif", display: "flex", flexDirection: "column" }}>

      {/* ─── 상단 헤더 ─── */}
      <header style={{
        background: T.canvas,
        borderBottom: `1px solid ${T.hairlineSoft}`,
        padding: "12px 16px",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center"
              style={{
                width: 36, height: 36,
                background: T.surface,
                borderRadius: R.md,
                color: T.ink,
                border: `1px solid ${T.hairline}`,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Icon name="menu" size={18} stroke={2} />
            </button>
            <a href="/" className="flex items-center gap-2.5 min-w-0">
              <div style={{
                width: 32, height: 32, borderRadius: R.md,
                background: T.mossDark, color: "#FFFFFF",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Icon name="cloud" size={18} stroke={2} />
              </div>
              <div className="leading-none min-w-0">
                <div style={{ color: T.ink, fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
                  Weather Plan AI
                </div>
                <div className="hidden sm:block" style={{ color: T.steel, fontSize: 10.5, marginTop: 3, letterSpacing: "0.04em", fontWeight: 500, whiteSpace: "nowrap" }}>
                  Agency Board · {MOCK_CLIENTS.length}개 광고주
                </div>
              </div>
            </a>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5" style={{
              background: T.tealLight, color: T.mossDark,
              fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em",
              padding: "5px 11px", borderRadius: R.full,
              border: `1px solid ${T.brandTeal}`,
              whiteSpace: "nowrap",
            }}>
              <Icon name="sparkles" size={10} stroke={2} />
              광고대행사 베타
            </span>
            <button
              onClick={() => setReportOpen(true)}
              className="flex items-center gap-1.5 transition active:translate-y-px"
              style={{
                background: `linear-gradient(180deg, #1F6157 0%, ${T.mossDark} 100%)`,
                color: T.onPrimary,
                fontSize: 12.5, fontWeight: 600,
                padding: "8px 14px",
                borderRadius: R.full,
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.22), 0 2px 6px rgba(20,68,59,0.16)",
                position: "relative",
              }}
            >
              <Icon name="share" size={13} stroke={2.2} />
              일간 보고
              {/* 적용 필요 카운트 배지 */}
              {(() => {
                const pendingCount = MOCK_CLIENTS.filter((c) => c.status === "pending" || c.status === "new").length;
                if (pendingCount === 0) return null;
                return (
                  <span style={{
                    position: "absolute",
                    top: -4, right: -4,
                    background: T.coralDark, color: "#FFFFFF",
                    fontSize: 9.5, fontWeight: 800,
                    minWidth: 18, height: 18,
                    padding: "0 5px",
                    borderRadius: R.full,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 0 2px rgba(255,255,255,0.95)",
                    letterSpacing: "0",
                  }}>
                    {pendingCount}
                  </span>
                );
              })()}
            </button>
          </div>
        </div>
      </header>

      {/* ─── 메인 영역 ─── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ─── 좌측 사이드바: 광고주 리스트 ─── */}
        <aside
          className={sidebarOpen ? "fixed inset-0 z-40 lg:relative" : "hidden lg:block"}
          style={{
            width: sidebarOpen ? "100vw" : 320,
            background: T.canvas,
            borderRight: `1px solid ${T.hairlineSoft}`,
            overflowY: "auto",
            flexShrink: 0,
          }}
        >
          {sidebarOpen && (
            <div className="lg:hidden flex justify-end p-3">
              <button
                onClick={() => setSidebarOpen(false)}
                style={{
                  width: 32, height: 32,
                  background: T.surface, color: T.ink,
                  borderRadius: R.md,
                  border: `1px solid ${T.hairline}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Icon name="x" size={16} stroke={2} />
              </button>
            </div>
          )}

          <div style={{ padding: "20px 18px" }} className={sidebarOpen ? "max-w-md mx-auto" : ""}>
            <div className="flex items-center justify-between mb-3">
              <div style={{ color: T.steel, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em" }}>
                광고주 ({MOCK_CLIENTS.length})
              </div>
              <a
                href="/onboarding"
                className="flex items-center gap-1 transition hover:opacity-70"
                style={{
                  background: T.canvas,
                  color: T.mossDark,
                  fontSize: 11.5, fontWeight: 600,
                  padding: "5px 10px",
                  borderRadius: R.full,
                  border: `1px solid ${T.brandTeal}`,
                  textDecoration: "none",
                }}
              >
                <Icon name="plus" size={11} stroke={2.2} />
                추가
              </a>
            </div>

            {/* 검색 */}
            <div className="flex items-center gap-2 mb-4" style={{
              background: T.surface,
              border: `1px solid ${T.hairlineSoft}`,
              borderRadius: R.md,
              padding: "8px 12px",
            }}>
              <Icon name="search" size={14} stroke={2} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="광고주 검색"
                style={{
                  background: "transparent",
                  color: T.ink, fontSize: 12.5, fontWeight: 400,
                  border: "none", outline: "none",
                  flex: 1, minWidth: 0,
                }}
              />
            </div>

            {/* 광고주 카드 리스트 */}
            <div className="space-y-2">
              {filtered.map((c) => {
                const isActive = c.id === activeClientId;
                const statusColor =
                  c.status === "live" ? T.mossDark :
                  c.status === "pending" ? T.amber :
                  T.brandBlue;
                const statusLabel =
                  c.status === "live" ? "LIVE" :
                  c.status === "pending" ? "검토" :
                  "신규";
                const needsAttention = c.status === "pending" || c.status === "new";
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveClientId(c.id);
                      setSidebarOpen(false);
                    }}
                    className="agency-client-card w-full text-left transition active:translate-y-px"
                    style={{
                      background: isActive ? "rgba(78,179,168,0.10)" : T.canvas,
                      border: `1.5px solid ${isActive ? T.brandTeal : T.hairlineSoft}`,
                      borderRadius: R.xl,
                      padding: "12px 14px",
                      cursor: "pointer",
                      boxShadow: isActive
                        ? "0 4px 12px rgba(78,179,168,0.18), 0 1px 2px rgba(5,0,56,0.03)"
                        : "0 1px 2px rgba(5,0,56,0.03)",
                      transition: "all 200ms ease",
                      position: "relative",
                    }}
                  >
                    {/* 우측 알림 점 (적용 필요 시) */}
                    {needsAttention && !isActive && (
                      <span style={{
                        position: "absolute",
                        top: 10, right: 10,
                        width: 7, height: 7,
                        background: T.coralDark,
                        borderRadius: R.full,
                        boxShadow: "0 0 0 3px rgba(224,78,44,0.18)",
                      }} aria-hidden="true" />
                    )}

                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span style={{ fontSize: 18, flexShrink: 0 }}>{c.emoji}</span>
                        <div className="min-w-0">
                          <div style={{ color: T.ink, fontSize: 13, fontWeight: 700, letterSpacing: "-0.005em", lineHeight: 1.3, wordBreak: "keep-all" }}>
                            {c.name}
                          </div>
                          <div style={{ color: T.steel, fontSize: 11, fontWeight: 400, marginTop: 2 }}>
                            {c.industry} · {c.region}
                          </div>
                        </div>
                      </div>
                      <span style={{
                        background: statusColor, color: "#FFFFFF",
                        fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em",
                        padding: "2px 6px", borderRadius: R.full,
                        flexShrink: 0,
                        marginRight: needsAttention && !isActive ? 10 : 0,
                      }}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span style={{
                          background: T.tealLight, color: T.mossDark,
                          fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
                          padding: "2px 7px", borderRadius: R.full,
                          border: `1px solid ${T.brandTeal}`,
                        }}>
                          {c.season}
                        </span>
                        {c.lift && c.lift.startsWith("+") && (
                          <span style={{
                            color: T.mossDark, fontSize: 10.5, fontWeight: 700,
                            letterSpacing: "-0.005em",
                            display: "inline-flex", alignItems: "baseline", gap: 3,
                          }}>
                            {c.lift}
                            {c.liftMetric && c.liftMetric !== "—" && (
                              <span style={{ color: T.steel, fontSize: 9.5, fontWeight: 500, letterSpacing: "0" }}>
                                {c.liftMetric}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                      <span style={{ color: T.steel, fontSize: 10, fontWeight: 500 }}>
                        {c.lastUpdate}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 카드 호버 효과 CSS */}
            <style>{`
              .agency-client-card:hover {
                transform: translateY(-1px);
                box-shadow: 0 6px 16px rgba(5,0,56,0.06), 0 2px 4px rgba(5,0,56,0.04) !important;
              }
            `}</style>

            {/* 사이드바 푸터 */}
            <div className="mt-7 pt-5" style={{ borderTop: `1px solid ${T.hairlineSoft}` }}>
              <a
                href="/onboarding"
                className="block w-full text-center transition active:translate-y-px"
                style={{
                  background: T.canvas,
                  color: T.mossDark,
                  fontSize: 12.5, fontWeight: 600,
                  padding: "9px 14px",
                  borderRadius: R.full,
                  border: `1.5px solid ${T.brandTeal}`,
                  textDecoration: "none",
                  boxShadow: "0 1px 2px rgba(78,179,168,0.06)",
                }}
              >
                <Icon name="plus" size={11} stroke={2.2} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                새 광고주 등록
              </a>
              <p className="mt-3 text-center" style={{ color: T.muted, fontSize: 10.5, fontWeight: 400, lineHeight: 1.55 }}>
                광고대행사 AE 전용<br />
                광고대행사 베타 · 광고주 무제한
              </p>
            </div>
          </div>
        </aside>

        {/* ─── 중앙: 선택한 광고주 상세 ─── */}
        <main style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}>
          <div className="max-w-3xl mx-auto">

            {/* 광고주 헤더 */}
            <div style={{
              background: T.canvas,
              border: `1px solid ${T.hairlineSoft}`,
              borderRadius: R.xxxl,
              padding: "22px 24px",
              marginBottom: 16,
              boxShadow: "0 1px 3px rgba(5,0,56,0.04), 0 8px 24px rgba(5,0,56,0.06)",
            }}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div style={{ fontSize: 32, flexShrink: 0 }}>{active.emoji}</div>
                  <div className="min-w-0">
                    <h1 style={{ color: T.ink, fontSize: 22, fontWeight: 700, letterSpacing: "-0.015em", lineHeight: 1.2, marginBottom: 4 }}>
                      {active.name}
                    </h1>
                    <p style={{ color: T.slate, fontSize: 13, fontWeight: 400 }}>
                      {active.industry} · {active.region} · {active.budget}
                    </p>
                  </div>
                </div>
                <a
                  href="/studio"
                  className="hidden sm:flex items-center gap-1.5 transition active:translate-y-px"
                  style={{
                    background: T.canvas,
                    color: T.mossDark,
                    fontSize: 11.5, fontWeight: 600,
                    padding: "6px 12px",
                    borderRadius: R.full,
                    border: `1px solid ${T.brandTeal}`,
                    textDecoration: "none",
                    flexShrink: 0,
                  }}
                >
                  <Icon name="sparkles" size={11} stroke={2} />
                  챗봇으로
                </a>
              </div>

              {/* 채널 칩 */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span style={{ color: T.steel, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em" }}>채널:</span>
                {active.channels.map((ch) => (
                  <span key={ch} style={{
                    background: T.surface, color: T.ink,
                    fontSize: 11, fontWeight: 600,
                    padding: "3px 9px", borderRadius: R.full,
                    border: `1px solid ${T.hairline}`,
                  }}>
                    {ch}
                  </span>
                ))}
              </div>
            </div>

            {/* 오늘의 추천 결과 */}
            <div style={{
              background: T.canvas,
              border: `1.5px solid ${T.brandTeal}`,
              borderRadius: R.xxxl,
              padding: "22px 24px",
              marginBottom: 16,
              boxShadow: "0 2px 8px rgba(78,179,168,0.14)",
            }}>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span style={{
                    background: T.mossDark, color: "#FFFFFF",
                    fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
                    padding: "4px 11px", borderRadius: R.full,
                  }}>
                    오늘의 추천
                  </span>
                  <span style={{ color: T.steel, fontSize: 12, fontWeight: 500 }}>
                    {active.trigger}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span style={{ color: T.steel, fontSize: 11, fontWeight: 500 }}>
                    예상 {active.liftMetric || "효과"}
                  </span>
                  <span style={{
                    background: T.brandTeal, color: T.mossDark,
                    fontSize: 14, fontWeight: 700,
                    padding: "4px 12px", borderRadius: R.md,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.12)",
                  }}>
                    {active.lift}
                  </span>
                </div>
              </div>

              <p style={{ color: T.ink, fontSize: 15, fontWeight: 500, lineHeight: 1.65, marginBottom: 12, wordBreak: "keep-all" }}>
                {active.todayRec}
              </p>

              {/* 근거 행 — 왜 이 수치인지 짧게 */}
              {active.liftBasis && active.liftBasis !== "—" && (
                <div className="mb-4 flex items-start gap-2" style={{
                  background: T.surface,
                  borderRadius: R.lg,
                  padding: "9px 12px",
                  border: `1px solid ${T.hairlineSoft}`,
                }}>
                  <div style={{ color: T.mossDark, marginTop: 2, flexShrink: 0 }}>
                    <Icon name="sparkles" size={11} stroke={2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: T.steel, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", marginBottom: 2 }}>
                      예측 근거
                    </div>
                    <div style={{ color: T.charcoal, fontSize: 12, fontWeight: 400, lineHeight: 1.55, wordBreak: "keep-all" }}>
                      {active.liftBasis}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  className="flex items-center gap-1.5 transition active:translate-y-px"
                  style={{
                    background: `linear-gradient(180deg, #1F6157 0%, ${T.mossDark} 100%)`,
                    color: T.onPrimary,
                    fontSize: 12.5, fontWeight: 600,
                    padding: "8px 14px",
                    borderRadius: R.full,
                    cursor: "pointer",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.22)",
                  }}
                >
                  광고 콘솔에서 적용 <Icon name="arrow-right" size={12} stroke={2.2} />
                </button>
                <button
                  className="flex items-center gap-1.5 transition hover:opacity-70"
                  style={{
                    background: T.surface,
                    color: T.ink,
                    fontSize: 12, fontWeight: 500,
                    padding: "8px 12px",
                    borderRadius: R.full,
                    border: `1px solid ${T.hairline}`,
                    cursor: "pointer",
                  }}
                >
                  <Icon name="copy" size={12} stroke={2.2} />
                  카피 복사
                </button>
                <button
                  className="flex items-center gap-1.5 transition hover:opacity-70"
                  style={{
                    background: T.surface,
                    color: T.ink,
                    fontSize: 12, fontWeight: 500,
                    padding: "8px 12px",
                    borderRadius: R.full,
                    border: `1px solid ${T.hairline}`,
                    cursor: "pointer",
                  }}
                >
                  <Icon name="share" size={12} stroke={2.2} />
                  광고주에 카톡 공유
                </button>
              </div>
            </div>

            {/* 운영 현황 stat */}
            {/* 운영 stat — metric 별 평균 (광고주 lift × metric 가중 평균) */}
            {(() => {
              const liveClients = MOCK_CLIENTS.filter((c) => c.status === "live" || c.status === "pending");
              const liftNums = liveClients
                .map((c) => parseInt((c.lift || "").replace(/[^0-9-]/g, ""), 10))
                .filter((n) => !isNaN(n) && n > 0);
              const avgLift = liftNums.length > 0
                ? Math.round(liftNums.reduce((a, b) => a + b, 0) / liftNums.length)
                : 0;
              const pendingCount = MOCK_CLIENTS.filter((c) => c.status === "pending" || c.status === "new").length;

              const stats = [
                { icon: "users", label: "운영 광고주", sub: "live · 검토 포함", value: MOCK_CLIENTS.length, unit: "개" },
                { icon: "trending", label: "추천 적용 시 평균 개선", sub: "매출·CTR·전환·ROAS 가중 평균", value: "+" + avgLift, unit: "%" },
                { icon: "alert", label: "오늘 적용 필요", sub: "신규 + 검토 대기 광고주", value: pendingCount, unit: "건" },
              ];

              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  {stats.map((s) => (
                    <div key={s.label} style={{
                      background: T.canvas,
                      border: `1px solid ${T.hairlineSoft}`,
                      borderRadius: R.xxl,
                      padding: "14px 16px",
                      textAlign: "center",
                    }}>
                      <div style={{ color: T.mossDark, marginBottom: 6, display: "flex", justifyContent: "center" }}>
                        <Icon name={s.icon} size={16} stroke={2} />
                      </div>
                      <div style={{ color: T.ink, fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em" }}>
                        {s.value}<span style={{ color: T.steel, fontSize: 12, fontWeight: 500, marginLeft: 2 }}>{s.unit}</span>
                      </div>
                      <div style={{ color: T.ink, fontSize: 11, fontWeight: 600, marginTop: 4, letterSpacing: "-0.005em" }}>{s.label}</div>
                      <div style={{ color: T.muted, fontSize: 10, fontWeight: 400, marginTop: 2, lineHeight: 1.4, wordBreak: "keep-all" }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* AE 워크플로우 안내 */}
            <div style={{
              background: T.surface,
              border: `1px solid ${T.hairlineSoft}`,
              borderRadius: R.xxl,
              padding: "18px 20px",
            }}>
              <div className="flex items-center gap-2 mb-3">
                <Icon name="sparkles" size={14} stroke={2} />
                <span style={{ color: T.mossDark, fontSize: 11.5, fontWeight: 700, letterSpacing: "0.08em" }}>
                  AE 워크플로우 (베타)
                </span>
              </div>
              <div className="space-y-2">
                {[
                  "① 좌측 광고주 카드 클릭 → 오늘의 추천 결과 즉시 확인",
                  "② 카피 복사 또는 광고 콘솔에서 1클릭 적용",
                  "③ 상단 \"일간 보고\" 버튼 → 광고주 전체 요약 자동 생성",
                  "④ 광고주별 챗봇 대화는 다음 업데이트에서 분리 저장 예정",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2" style={{ color: T.charcoal, fontSize: 12.5, fontWeight: 400, lineHeight: 1.55, wordBreak: "keep-all" }}>
                    <span style={{ color: T.mossDark, marginTop: 2, flexShrink: 0 }}>
                      <Icon name="check" size={11} stroke={2.5} />
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* ─── 일간 보고 모달 ─── */}
      {reportOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(5,0,56,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setReportOpen(false)}
        >
          <div
            className="w-full"
            style={{
              maxWidth: 640,
              maxHeight: "85vh",
              background: T.canvas,
              borderRadius: R.xxxl,
              padding: "24px 24px 20px",
              boxShadow: "0 24px 60px rgba(5,0,56,0.24)",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 style={{ color: T.ink, fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>
                  일간 보고 자동 요약
                </h2>
                <p style={{ color: T.steel, fontSize: 12, fontWeight: 400, marginTop: 3 }}>
                  광고주 {MOCK_CLIENTS.length}개 한 번에 카톡 보고
                </p>
              </div>
              <button
                onClick={() => setReportOpen(false)}
                style={{
                  width: 32, height: 32,
                  background: T.surface, color: T.ink,
                  borderRadius: R.md,
                  border: `1px solid ${T.hairline}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Icon name="x" size={16} stroke={2} />
              </button>
            </div>

            <pre style={{
              background: T.surface,
              border: `1px solid ${T.hairlineSoft}`,
              borderRadius: R.lg,
              padding: "16px 18px",
              fontSize: 12,
              fontFamily: "'Pretendard Variable', system-ui, sans-serif",
              color: T.charcoal,
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
              wordBreak: "keep-all",
              maxHeight: 360,
              overflowY: "auto",
              margin: 0,
            }}>
              {dailyReport}
            </pre>

            <div className="flex items-center gap-2 mt-4 justify-end flex-wrap">
              <button
                onClick={handleCopyReport}
                className="flex items-center gap-1.5 transition active:translate-y-px"
                style={{
                  background: reportCopied ? T.brandTeal : T.canvas,
                  color: reportCopied ? T.mossDark : T.ink,
                  fontSize: 12.5, fontWeight: 600,
                  padding: "9px 14px",
                  borderRadius: R.full,
                  border: `1.5px solid ${reportCopied ? T.brandTeal : T.hairline}`,
                  cursor: "pointer",
                }}
              >
                {reportCopied ? <Icon name="check" size={13} stroke={2.5} /> : <Icon name="copy" size={13} stroke={2.2} />}
                {reportCopied ? "복사됨" : "보고문 복사"}
              </button>
              <button
                onClick={handleKakaoShare}
                className="flex items-center gap-1.5 transition active:translate-y-px"
                style={{
                  background: shareStatus === "shared" || shareStatus === "copied"
                    ? `linear-gradient(180deg, ${T.brandTeal} 0%, #2E8A7E 100%)`
                    : `linear-gradient(180deg, #1F6157 0%, ${T.mossDark} 100%)`,
                  color: T.onPrimary,
                  fontSize: 12.5, fontWeight: 600,
                  padding: "9px 14px",
                  borderRadius: R.full,
                  cursor: "pointer",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.22), 0 2px 6px rgba(20,68,59,0.16)",
                }}
              >
                {shareStatus === "shared" ? (
                  <><Icon name="check" size={13} stroke={2.5} />공유됨</>
                ) : shareStatus === "copied" ? (
                  <><Icon name="check" size={13} stroke={2.5} />복사 → 카톡 붙여넣기</>
                ) : shareStatus === "error" ? (
                  <><Icon name="alert" size={13} stroke={2.2} />다시 시도</>
                ) : (
                  <><Icon name="share" size={13} stroke={2.2} />카카오톡 공유</>
                )}
              </button>
            </div>

            {/* 공유 안내 */}
            {shareStatus === "copied" && (
              <p className="mt-3 text-center" style={{ color: T.steel, fontSize: 11, fontWeight: 400, lineHeight: 1.55 }}>
                보고문이 클립보드에 복사되었습니다. 카카오톡 채팅창에 붙여넣어 광고주에게 전달하세요.
              </p>
            )}
            {shareStatus === "error" && (
              <p className="mt-3 text-center" style={{ color: T.coralDark, fontSize: 11, fontWeight: 500, lineHeight: 1.55 }}>
                공유에 실패했습니다. "보고문 복사" 버튼으로 직접 복사해 카톡에 붙여넣어 주세요.
              </p>
            )}
            {shareStatus === "shared" && (
              <p className="mt-3 text-center" style={{ color: T.mossDark, fontSize: 11, fontWeight: 500, lineHeight: 1.55 }}>
                공유 시트에서 카카오톡을 선택하셨습니다. 채팅방에서 전달 완료하세요.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
