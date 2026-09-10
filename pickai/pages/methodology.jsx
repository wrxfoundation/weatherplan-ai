/**
 * Pick AI · 측정 설계서 (내부용)
 * ─────────────────────────────────────────────
 * 이해관계자에게 "어떤 원리로 측정하는가"를 설명하기 위한 문서 페이지.
 *
 * 핵심 설계:
 *  · 체크 레지스트리(항목·도움말·통과 조건·심각도·가중치)는 엔진에서
 *    직접 추출해 렌더링 — 문서와 실제 채점 코드가 어긋날 수 없다
 *  · noindex + robots.txt Disallow — 내부 공유 전용
 *  · 인쇄(PDF) 친화 레이아웃
 */

import { useMemo, useCallback } from "react";
import Head from "next/head";
import {
  analyzeHtml, runScorecard, AI_BOTS, AREA_WEIGHTS, DEEP_RUBRIC, ENGINE_ID,
} from "../lib/scorecardEngine";

const T = {
  surface: "#F7F5EE", surfaceSoft: "#FAFAF6", canvas: "#FFFFFF",
  hairline: "#E5E1D6", hairlineSoft: "#EFEBE0", hairlineStrong: "#C9C5B7",
  inkDeep: "#050038", ink: "#0F0A2E", charcoal: "#2D2A4A",
  slate: "#6B6781", steel: "#8E8AA3", stone: "#A5A2B8",
  onDark: "#FFFFFF", onDarkMuted: "rgba(255,255,255,0.62)",
  brandTeal: "#4EB3A8", tealLight: "#CDEEE8", mossDark: "#14443B",
  coralLight: "#FFE0D6", coralDark: "#8B2C16",
  lavender: "#E7E3FF", lavenderInk: "#4A3DB8",
  amber: "#FFE5C2", amberInk: "#7A4500",
};
const R = { sm: 6, md: 8, lg: 12, xl: 16, xxl: 20, full: 9999 };

const AREA_META = {
  seo: { label: "검색엔진 (SEO)", desc: "구글·네이버가 크롤·인덱싱하고 이해할 수 있는가" },
  aeo: { label: "답변엔진 (AEO)", desc: "AI가 발췌해 답변으로 쓰기 좋은 구조인가" },
  geo: { label: "생성형엔진 (GEO)", desc: "생성형 AI가 출처로 인용할 근거가 있는가" },
  reach: { label: "확산 신호 (Reach)", desc: "콘텐츠가 밖으로 퍼질 통로·언급 기반이 있는가" },
};
const SEVERITY_LABEL = { critical: "치명적", high: "높음", medium: "중간", low: "낮음" };

/* 엔진에서 체크 레지스트리 추출 — 참조용 아티팩트로 1회 실행 */
function extractRegistry() {
  /* 한글 참조 픽스처 — 통과 조건이 한글 사이트 기준(한글 자수 밴드)으로 표시되게 한다 */
  const parsed = analyzeHtml('<html lang="ko"><head><title>참조 문서 기준 페이지</title><meta name="description" content="한글 기준 참조 문서입니다."></head><body><p>참조용 본문입니다.</p></body></html>');
  const bots = AI_BOTS.map((b) => ({ ...b, robotsAllowed: true, robotsRule: "Allow: /", live: { ran: false, ok: null, status: null } }));
  const r = runScorecard({
    url: "https://ref.example/blog/ref", finalUrl: "https://ref.example/blog/ref",
    host: "ref.example", path: "/blog/ref", scheme: "https",
    status: 200, redirects: 0, responseMs: 500, tlsValid: true, tlsError: null,
    mixedContentCount: 0, xRobotsTag: null, parsed,
    robots: { found: true, parsed: { groups: [{ agents: ["*"], rules: [{ type: "allow", path: "/" }] }], sitemaps: [] }, sitemaps: [] },
    llmsTxtFound: false, sitemapXml: { checked: true, ok: false, status: 404 },
    rssProbe: { checked: true, found: false },
    wikipedia: { checked: false },
    bots,
  });
  return r.checks.map((c) => ({
    id: c.id, area: c.area, label: c.label, help: c.help,
    passRule: c.passRule, severity: c.severity, weight: c.weight,
    manual: c.status === "manual",
  }));
}

/* 민감도 검증 실측치 (test-sensitivity 실행 결과 · 2026.07.25 · 엔진 v2 + 연구 레버 9종) */
const SENSITIVITY_ROWS = [
  ["0. 방치 상태", 31, "F", [55, 16, 28, 19]],
  ["1. + JSON-LD 문법 수정", 37, "F", [61, 23, 36, 19]],
  ["2. + 메타·공유 카드", 45, "F", [76, 23, 36, 44]],
  ["3. + 답변형 콘텐츠·alt", 65, "C", [79, 60, 68, 44]],
  ["4. + 엔티티·FAQ·신뢰 신호", 85, "A", [88, 95, 80, 69]],
  ["5. + 확산 신호 전부", 91, "A", [91, 95, 84, 94]],
  ["6. + 연구 레버(인용문·선행 배치 등)", 100, "A", [100, 100, 100, 100]],
];

function H2({ id, num, children }) {
  return (
    <h2 id={id} style={{
      color: T.inkDeep, fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em",
      marginTop: 56, marginBottom: 14, scrollMarginTop: 96,
    }}>
      <span style={{ color: T.brandTeal, marginRight: 10 }}>{num}</span>{children}
    </h2>
  );
}

function P({ children, style = {} }) {
  return <p style={{ color: T.charcoal, fontSize: 14, lineHeight: 1.8, marginBottom: 12, ...style }}>{children}</p>;
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff", border: `1px solid ${T.hairline}`, borderRadius: R.xl,
      padding: "18px 22px", marginBottom: 14, ...style,
    }}>{children}</div>
  );
}

function Chip({ bg, fg, children }) {
  return (
    <span style={{
      background: bg, color: fg, fontSize: 11.5, fontWeight: 600,
      padding: "2px 9px", borderRadius: R.full, whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

export default function Methodology() {
  const registry = useMemo(() => extractRegistry(), []);
  const detChecks = registry.filter((c) => !c.manual);
  const manualChecks = registry.filter((c) => c.manual);
  const printPage = useCallback(() => window.print(), []);

  const TOC = [
    ["#summary", "1. 한 장 요약"],
    ["#principles", "2. 측정 철학"],
    ["#pipeline", "3. 수집 파이프라인"],
    ["#scoring", "4. 채점 공식"],
    ["#registry", "5. 체크 레지스트리 (전 항목)"],
    ["#crawler", "6. AI 크롤러 판정 원리"],
    ["#reach", "7. 확산 신호 실측"],
    ["#deep", "8. 정밀 진단 (LLM 심사)"],
    ["#validation", "9. 검증 결과"],
    ["#limits", "10. 한계와 로드맵"],
  ];

  return (
    <div style={{ background: T.surface, minHeight: "100vh" }}>
      <Head>
        <title>Pick AI 측정 설계서 (내부용)</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="Pick AI AI 성적표의 측정 원리·채점 공식·검증 결과 — 내부 공유용 설계 문서" />
      </Head>

      {/* 상단 바 */}
      <div className="print-hide" style={{
        background: "rgba(255,255,255,0.95)", borderBottom: `1px solid ${T.hairline}`,
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <div className="max-w-[980px] mx-auto px-6 h-[64px] flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5" style={{ textDecoration: "none" }}>
            <svg width="28" height="28" viewBox="0 0 48 48" aria-hidden="true">
              <rect width="48" height="48" rx="12" fill="#050038" />
              <circle cx="19" cy="29" r="4" fill="#4EB3A8" />
              <path d="M25 23 A8.5 8.5 0 0 1 27.5 29" stroke="#4EB3A8" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M29 18.5 A15 15 0 0 1 33.5 29" stroke="#7CCFC5" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M33 14 A21.5 21.5 0 0 1 39.5 29" stroke="#B7E6E0" strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
            <span style={{ color: T.ink, fontSize: 14, fontWeight: 600 }}>Pick AI · 측정 설계서</span>
            <Chip bg={T.amber} fg={T.amberInk}>내부용</Chip>
          </a>
          <button onClick={printPage} className="transition hover:opacity-80" style={{
            background: T.inkDeep, color: "#fff", fontSize: 13, fontWeight: 500,
            padding: "8px 16px", borderRadius: R.full, border: "none",
          }}>
            인쇄 · PDF 저장
          </button>
        </div>
      </div>

      <div className="max-w-[980px] mx-auto px-6" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <h1 style={{ color: T.inkDeep, fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.3 }}>
          Pick AI — AI 성적표 측정 설계서
        </h1>
        <p style={{ color: T.slate, fontSize: 14, marginTop: 10 }}>
          엔진 {ENGINE_ID} · 결정론 체크 {detChecks.length}개 + LLM 심사 {DEEP_RUBRIC.length}개 ·
          이 문서의 체크 목록·통과 조건·가중치는 <strong style={{ color: T.ink }}>채점 엔진 코드에서 직접 추출</strong>되어
          문서와 실제 채점이 어긋날 수 없습니다.
        </p>

        {/* 목차 */}
        <Card style={{ background: T.surfaceSoft, marginTop: 24 }}>
          <div style={{ color: T.ink, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>목차</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5">
            {TOC.map(([href, label]) => (
              <a key={href} href={href} className="transition hover:opacity-70"
                style={{ color: T.charcoal, fontSize: 13.5, textDecoration: "none" }}>
                {label}
              </a>
            ))}
          </div>
        </Card>

        {/* 1. 한 장 요약 */}
        <H2 id="summary" num="1.">한 장 요약</H2>
        <Card style={{ borderLeft: `3px solid ${T.brandTeal}` }}>
          <P style={{ marginBottom: 8 }}>
            <strong>무엇을 측정하나</strong> — 웹사이트가 AI 검색(ChatGPT·Claude·Gemini 등)의 답변에
            인용될 준비가 되어 있는지를 4개 영역(SEO·AEO·GEO·확산)의 결정론 체크 {detChecks.length}개로 채점합니다.
          </P>
          <P style={{ marginBottom: 8 }}>
            <strong>왜 믿을 수 있나</strong> — ① 같은 사이트는 언제나 같은 점수(결정론·재현 가능)
            ② 모든 항목의 통과 조건·가중치 공개 ③ 단위 테스트 31건 + 처방 민감도 검증
            (방치 F 31점 → 처방 7단계 → A 100점, 단조 상승) 통과 ④ 측정 불가 항목은 점수에서
            제외하며 실패로 위장하지 않음.
          </P>
          <P style={{ marginBottom: 0 }}>
            <strong>무엇을 보장하지 않나</strong> — "점수 상승 = AI 인용률 상승"의 정량 보장.
            체크 항목은 검색엔진 공식 문서·AEO/GEO 연구의 공통 인용 요인을 따르지만,
            실제 인용률은 반복 프로빙으로 실측해야 하며 이는 로드맵에 있습니다 (10장).
          </P>
        </Card>

        {/* 2. 측정 철학 */}
        <H2 id="principles" num="2.">측정 철학 — 4원칙</H2>
        {[
          ["결정론 · 재현성", "같은 입력(HTML·robots·헤더)이면 항상 같은 점수를 낸다. 임의성·시점 의존 요소(속도 측정, LLM 판단)는 무료 점수에서 배제한다. 점수가 흔들리면 개선 효과를 추적할 수 없기 때문이다."],
          ["평가 불가의 정직한 처리", "LLM 심사나 외부 인프라가 필요해 지금 측정할 수 없는 항목은 '평가 불가'로 표기하고 점수에서 제외한다. 실패(FAIL)로 위장해 점수를 깎지 않는다."],
          ["치명 결함 게이팅", "크롤 차단·noindex·도달 실패처럼 다른 모든 노력을 무의미하게 만드는 결함이 있으면, 해당 영역 점수에 40점 상한을 건다. 사소한 항목을 많이 통과했다고 치명 결함이 가려지는 것을 막는다."],
          ["처방 가능성", "모든 실패·주의 항목에는 복사해서 바로 적용할 수 있는 수정안이 붙는다. 측정은 처방으로 이어져야 하고, 처방을 적용하면 점수가 올라야 한다(9장 민감도 검증)."],
        ].map(([t, d], i) => (
          <Card key={t}>
            <div style={{ color: T.ink, fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
              원칙 {i + 1} — {t}
            </div>
            <P style={{ marginBottom: 0, color: T.slate }}>{d}</P>
          </Card>
        ))}

        {/* 3. 파이프라인 */}
        <H2 id="pipeline" num="3.">수집 파이프라인</H2>
        <P>
          진단 요청 1건당 아래 수집을 서버에서 수행합니다. 모든 요청에 타임아웃(메인 12초·부속 6초)과
          본문 크기 상한(1.5MB)을 두고, 사설 IP·내부망 주소는 차단(SSRF 가드)합니다.
        </P>
        <Card style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.hairlineStrong}` }}>
                {["단계", "수집 대상", "방법", "산출물"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: T.steel, fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["①", "메인 페이지", "수동 리다이렉트 추적(최대 5회) · TLS 유효성 감지 · 일반 브라우저형 UA", "최종 URL, 상태 코드, 응답 시간, raw HTML"],
                ["②", "HTML 분석", "경량 파서(정규식 기반·의존성 0)로 title/메타/헤딩/JSON-LD/링크/이미지/본문 추출", "구조 지표 40여 종 (통계 밀도·문장 길이 포함)"],
                ["③", "robots.txt", "RFC 9309 파서 — 그룹·최장 일치·와일드카드(* $)", "봇 13종별 허용/차단 판정"],
                ["④", "부속 파일", "/llms.txt · /sitemap.xml · /rss.xml · /feed 존재 프로브 (상태만 확인)", "존재 여부"],
                ["⑤", "라이브 봇 페치", "대표 4종(OAI-SearchBot·GPTBot·ClaudeBot·PerplexityBot)의 실제 UA로 재요청", "WAF/서버 단계 차단 여부"],
                ["⑥", "위키백과 조회", "ko/en 위키백과 공개 검색 API — 조직명(JSON-LD→og:site_name→title 순 추출)으로 조회", "단독 문서 유무 · 언급 문서 수"],
                ["⑦", "채점", "순수 함수 엔진 — 위 산출물만 입력으로 결정론 채점", "영역·종합 점수, 이슈, 수정안, 레이더"],
              ].map((row) => (
                <tr key={row[0]} style={{ borderBottom: `1px solid ${T.hairlineSoft}` }}>
                  <td style={{ padding: "8px 10px", color: T.brandTeal, fontWeight: 600 }}>{row[0]}</td>
                  <td style={{ padding: "8px 10px", color: T.ink, fontWeight: 500, whiteSpace: "nowrap" }}>{row[1]}</td>
                  <td style={{ padding: "8px 10px", color: T.charcoal }}>{row[2]}</td>
                  <td style={{ padding: "8px 10px", color: T.slate }}>{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <P style={{ color: T.slate, fontSize: 13 }}>
          오귀속 방지 규칙: 메인 페치(일반 UA)가 2xx가 아닌 사이트는 라이브 봇 페치 실패를
          "봇 차단"으로 귀속하지 않습니다 — 모두를 막는 서버와 봇만 막는 서버를 구분하기 위함입니다.
        </P>

        {/* 4. 채점 공식 */}
        <H2 id="scoring" num="4.">채점 공식</H2>
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
            <div>
              <div style={{ color: T.ink, fontSize: 13.5, fontWeight: 600, marginBottom: 8 }}>판정 → 점수 환산</div>
              <div style={{ color: T.charcoal, fontSize: 13.5, lineHeight: 2 }}>
                통과 = 100% · 주의 = 50% · 실패 = 0%<br />
                영역 점수 = Σ(가중치 × 환산) ÷ Σ(가중치)<br />
                <span style={{ color: T.coralDark }}>치명적 체크 실패 시 영역 상한 40점</span><br />
                평가 불가·비해당 = 분모에서 제외
              </div>
            </div>
            <div>
              <div style={{ color: T.ink, fontSize: 13.5, fontWeight: 600, marginBottom: 8 }}>종합 = 영역 가중 평균</div>
              <div style={{ color: T.charcoal, fontSize: 13.5, lineHeight: 2 }}>
                {Object.entries(AREA_WEIGHTS).map(([k, w]) => (
                  <span key={k} style={{ marginRight: 14 }}>
                    {AREA_META[k].label.split(" ")[0]} <strong>{Math.round(w * 100)}%</strong>
                  </span>
                ))}
                <br />
                등급: A ≥ 85 · B ≥ 75 · C ≥ 65 · D ≥ 50 · F &lt; 50
              </div>
            </div>
          </div>
        </Card>
        <P style={{ color: T.slate, fontSize: 13 }}>
          가중치 근거 — SEO·AEO 동률(30%): 크롤 가능성과 발췌 가능성은 인용의 필요조건 두 축.
          GEO(25%): 인용 "선택"을 좌우하는 근거 신호. 확산(15%): 직접 인용 요인은 아니나 AI가
          학습·검색하는 외부 생태계에 브랜드가 존재할 확률을 높이는 간접 신호.
        </P>

        {/* 5. 레지스트리 */}
        <H2 id="registry" num="5.">체크 레지스트리 — 전 항목 (엔진에서 자동 추출)</H2>
        <P>
          아래 표는 이 페이지가 렌더링될 때 채점 엔진에서 직접 추출한 것입니다.
          엔진이 바뀌면 이 표도 자동으로 바뀝니다. 일부 항목은 공개 연구에 직접 근거합니다 —
          통계 밀도·인용문·출처(Princeton 외, KDD 2024: 생성형 인용 최대 +40% 레버),
          답변 선행 배치(Zyppy 2025: LLM 인용의 44.2%가 본문 앞 30% 구간에서 발생),
          구조화 블록(동일 연구군의 구조화 콘텐츠 우위).
        </P>
        {["seo", "aeo", "geo", "reach"].map((area) => (
          <div key={area} style={{ marginBottom: 22 }}>
            <div className="flex items-center gap-2.5" style={{ marginBottom: 10 }}>
              <Chip bg={T.tealLight} fg={T.mossDark}>{AREA_META[area].label}</Chip>
              <span style={{ color: T.steel, fontSize: 12.5 }}>{AREA_META[area].desc} · 가중치 {Math.round(AREA_WEIGHTS[area] * 100)}%</span>
            </div>
            <Card style={{ overflowX: "auto", padding: "6px 10px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.hairlineStrong}` }}>
                    {["체크", "무엇을 어떻게 보는가", "통과 조건", "심각도", "가중치"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 8px", color: T.steel, fontWeight: 600, fontSize: 11.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {registry.filter((c) => c.area === area).map((c) => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${T.hairlineSoft}`, verticalAlign: "top" }}>
                      <td style={{ padding: "9px 8px", color: T.ink, fontWeight: 600, minWidth: 150 }}>
                        {c.label}
                        {c.manual && <div style={{ marginTop: 4 }}><Chip bg={T.lavender} fg={T.lavenderInk}>점수 제외</Chip></div>}
                      </td>
                      <td style={{ padding: "9px 8px", color: T.charcoal, lineHeight: 1.6, minWidth: 260 }}>{c.help}</td>
                      <td style={{ padding: "9px 8px", color: T.slate, lineHeight: 1.6, minWidth: 170 }}>{c.passRule}</td>
                      <td style={{ padding: "9px 8px", color: c.severity === "critical" ? "#B3301C" : T.charcoal, fontWeight: 600, whiteSpace: "nowrap" }}>
                        {SEVERITY_LABEL[c.severity]}
                      </td>
                      <td style={{ padding: "9px 8px", color: T.charcoal, fontWeight: 600 }}>{c.manual ? "—" : c.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        ))}

        {/* 5-1. 연구 근거 보강 레버 */}
        <div style={{ marginTop: 8 }}>
          <div className="flex items-center gap-2.5" style={{ marginBottom: 10 }}>
            <Chip bg={T.lavender} fg={T.lavenderInk}>2026.08 보강</Chip>
            <span style={{ color: T.ink, fontSize: 14, fontWeight: 600 }}>외부 연구 기반 추가 레버 10종</span>
          </div>
          <Card style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.hairlineStrong}` }}>
                  {["체크", "영역", "근거"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 8px", color: T.steel, fontWeight: 600, fontSize: 11.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["인용문 · 전문가 발언", "GEO", "Princeton 외 (KDD 2024) — 3대 인용 레버 'Quotation Addition'. 통계·출처·인용문이 생성형 노출을 최대 +40% 개선"],
                  ["답변 선행 배치", "AEO", "Zyppy (2025) — LLM 인용의 44.2%가 본문 앞 30% 구간에서 발생. 첫 수치 등장 위치를 측정"],
                  ["구조화 블록 (리스트·표)", "AEO", "동일 연구군 — 구조화 콘텐츠가 서술형 문단보다 발췌·인용에 유리"],
                  ["응답 속도 (TTFB 근사)", "SEO", "업계 공통 — AI 크롤러는 느린 응답에서 수집을 중도 포기"],
                  ["크롤 효율 (압축·캐시 헤더)", "SEO", "크롤 예산 최적화 — 같은 예산으로 더 많은 페이지 수집"],
                  ["검색 콘솔 연동 (네이버·구글)", "SEO", "한국 시장 특화 — 색인 능동 관리의 운영 신호 (벤치마크 원본에 없던 항목)"],
                  ["내부 링크 구조", "SEO", "크롤러의 페이지 발견 경로 확보"],
                  ["지식그래프 연결 (Wikidata sameAs)", "GEO", "소셜보다 강한 엔티티 신원 증명 — 지식그래프·AI의 브랜드 확정에 기여"],
                  ["다국어 신호 (hreflang)", "확산", "영어권 AI 답변 인용 대비 — 글로벌 확산 기반"],
                  ["단정적 문체 (모호 표현 밀도)", "AEO", "Growth Memo / Gauge (2026.2) — ChatGPT 응답 120만 건·인용 18,012건 분석에서 단정적 문체가 모호한 문체보다 1.8배 더 인용. 한국어 '~할 수 있습니다'(기능 서술)는 헤지에서 제외하고 추측·완충 표현만 계수"],
                ].map((row) => (
                  <tr key={row[0]} style={{ borderBottom: `1px solid ${T.hairlineSoft}`, verticalAlign: "top" }}>
                    <td style={{ padding: "8px 8px", color: T.ink, fontWeight: 600, whiteSpace: "nowrap" }}>{row[0]}</td>
                    <td style={{ padding: "8px 8px", color: T.charcoal, whiteSpace: "nowrap" }}>{row[1]}</td>
                    <td style={{ padding: "8px 8px", color: T.slate, lineHeight: 1.6 }}>{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <P style={{ color: T.slate, fontSize: 12.5 }}>
            인용 친화 스키마 타입도 확장되었습니다 (Product · Review · AggregateRating ·
            VideoObject · Speakable — 이커머스 별점 스니펫과 음성 AI 대응).
          </P>
        </div>

        {/* 6. 크롤러 판정 */}
        <H2 id="crawler" num="6.">AI 크롤러 판정 원리</H2>
        <P>
          {AI_BOTS.length}개 봇({AI_BOTS.filter((b) => b.kind === "search").length}개 검색 봇 ·{" "}
          {AI_BOTS.filter((b) => b.kind === "train").length}개 학습 봇)을 2단계로 판정합니다.
        </P>
        <Card>
          <ol style={{ color: T.charcoal, fontSize: 13.5, lineHeight: 1.9, paddingLeft: 20, margin: 0, listStyle: "decimal" }}>
            <li><strong>robots.txt 판정</strong> — RFC 9309 규격: 봇 이름과 User-agent 값의 최장 일치로 적용 그룹을 고르고, 그룹 안에서는 경로 패턴 최장 일치(동률이면 Allow 우선)로 판정. <code style={{ background: T.surfaceSoft, padding: "1px 6px", borderRadius: 4 }}>*</code>(임의 문자열)·<code style={{ background: T.surfaceSoft, padding: "1px 6px", borderRadius: 4 }}>$</code>(끝 고정) 와일드카드 지원.</li>
            <li><strong>라이브 페치 검증</strong> — 대표 4종은 실제 봇 User-Agent 문자열로 재요청해 WAF·CDN 단계의 차단(robots에는 없는 차단)까지 확인. 검색 봇이 하나라도 차단이면 GEO 영역 치명 실패(40점 상한).</li>
          </ol>
        </Card>
        <P style={{ color: T.slate, fontSize: 13 }}>
          판정 기준을 검색 봇/학습 봇으로 나누는 이유 — 검색 봇 차단은 AI 답변 인용 경로 자체를 끊는
          실질 손실이지만, 학습 봇 차단은 저작권 정책상 의도적 선택일 수 있어 "주의"로만 처리합니다.
        </P>

        {/* 7. 확산 신호 */}
        <H2 id="reach" num="7.">확산 신호 실측</H2>
        <Card style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.hairlineStrong}` }}>
                {["신호", "측정 방법", "확산과의 연결 고리"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: T.steel, fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["소셜 채널 연결", "본문 링크 + JSON-LD sameAs에서 10개 플랫폼(인스타·유튜브·네이버 블로그 등) 패턴 감지", "콘텐츠가 퍼질 통로의 존재 — 채널 없는 사이트는 확산 시작점이 없음"],
                ["공유 카드", "OG 3종(title/description/image) + Twitter Card 태그 존재", "미리보기 카드가 없는 링크는 공유 클릭률이 급락 — 바이럴의 기본기"],
                ["RSS/Atom 피드", "link rel=alternate 선언 또는 표준 경로(/rss.xml·/feed) 응답 프로브", "구독 생태계·수집기로의 자동 전파 경로"],
                ["위키백과 등재", "ko/en 위키백과 공개 API로 브랜드 단독 문서·언급 문서를 실제 조회", "AI가 가장 신뢰하는 3자 출처 — 브랜드 인지도의 강한 대리 지표"],
                ["뉴스레터 장치", "구독 폼(email input+구독 문구)·뉴스레터 플랫폼 링크 감지", "일회성 방문을 반복 노출 자산으로 바꾸는 재확산 루프"],
              ].map((row) => (
                <tr key={row[0]} style={{ borderBottom: `1px solid ${T.hairlineSoft}`, verticalAlign: "top" }}>
                  <td style={{ padding: "9px 10px", color: T.ink, fontWeight: 600, whiteSpace: "nowrap" }}>{row[0]}</td>
                  <td style={{ padding: "9px 10px", color: T.charcoal, lineHeight: 1.6 }}>{row[1]}</td>
                  <td style={{ padding: "9px 10px", color: T.slate, lineHeight: 1.6 }}>{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <P style={{ color: T.slate, fontSize: 13 }}>
          확산 영역은 "사이트 밖에서 벌어지는 일"의 온사이트 대리 지표입니다. 실제 언급량·트래픽은
          외부 데이터 없이 측정할 수 없으므로, 가중치를 15%로 보수적으로 잡았습니다.
        </P>

        {/* 8. 정밀 진단 */}
        <H2 id="deep" num="8.">정밀 진단 — LLM 심사</H2>
        <P>
          결정론 체크가 원리적으로 못 보는 것(글의 깊이·직접성·형식 적합성·서술적 신뢰)은
          LLM(claude-opus-5)이 고정 루브릭으로 심사합니다. 서버가 페이지를 재수집해
          본문(최대 9,000자)·헤딩 구조를 심사위원 프롬프트에 넣고, 항목별 0~100점과
          심사평·개선 지시를 JSON으로 받습니다.
        </P>
        <Card style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.hairlineStrong}` }}>
                {["루브릭", "심사 질문"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: T.steel, fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEEP_RUBRIC.map((rb) => (
                <tr key={rb.key} style={{ borderBottom: `1px solid ${T.hairlineSoft}` }}>
                  <td style={{ padding: "9px 10px", color: T.ink, fontWeight: 600, whiteSpace: "nowrap" }}>{rb.label}</td>
                  <td style={{ padding: "9px 10px", color: T.charcoal }}>{rb.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <P style={{ color: T.slate, fontSize: 13 }}>
          분리 원칙 — LLM 심사는 실행마다 소폭 달라질 수 있어 정밀 점수를 결정론 종합 점수와
          <strong style={{ color: T.charcoal }}> 분리 표기</strong>합니다 (판정 경계: 70 이상 통과 · 40 이상 주의 · 미만 실패).
          심사는 제공된 페이지 데이터만 근거로 하며, 외부 지식으로 브랜드를 추측하지 않도록 프롬프트에 고정되어 있습니다.
        </P>

        {/* 9. 검증 */}
        <H2 id="validation" num="9.">검증 결과</H2>
        <P>
          <strong>단위 테스트 31건</strong> — robots 파서(최장 일치·와일드카드·그룹 공유 + 네이버형
          Allow: /$ 등 실제 대형 사이트 패턴 11건), HTML 분석(스키마·소셜·질문형 헤딩·인용문·구조화
          블록 감지), 채점 구성({detChecks.length}개 결정론 + {manualChecks.length}개 제외),
          동일 입력 → 동일 출력(결정론), 치명 결함 게이팅 — 전부 통과.
        </P>
        <P>
          <strong>처방 민감도 검증</strong> — 문제를 모두 심은 가상 사이트에 Pick AI의 수정안을
          단계적으로 적용하며 재진단한 실측 결과입니다. 전 단계 단조 상승, 최종 잔여 이슈 0건:
        </P>
        <Card style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.hairlineStrong}` }}>
                {["처방 단계", "종합", "등급", "SEO", "AEO", "GEO", "확산"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: T.steel, fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SENSITIVITY_ROWS.map(([name, score, grade, areas]) => (
                <tr key={name} style={{ borderBottom: `1px solid ${T.hairlineSoft}` }}>
                  <td style={{ padding: "8px 10px", color: T.ink, fontWeight: 500 }}>{name}</td>
                  <td style={{ padding: "8px 10px", color: T.inkDeep, fontWeight: 600 }}>{score}점</td>
                  <td style={{ padding: "8px 10px" }}>
                    <Chip bg={grade === "A" ? "#DDF3E7" : grade === "C" ? T.amber : T.coralLight}
                      fg={grade === "A" ? "#116A44" : grade === "C" ? T.amberInk : T.coralDark}>{grade}</Chip>
                  </td>
                  {areas.map((v, i) => (
                    <td key={i} style={{ padding: "8px 10px", color: T.charcoal }}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <P style={{ color: T.slate, fontSize: 13 }}>
          이 검증이 입증하는 것: 진단이 잡은 문제와 처방이 정확히 대응하고, 처방을 적용하면
          그만큼 점수가 회복된다 — 즉 도구 내부에 자기모순이 없다. (2026.07.25 실측, 검증 스크립트는 저장소에 보존)
        </P>

        {/* 10. 한계 */}
        <H2 id="limits" num="10.">한계와 로드맵 — 정직한 경계선</H2>
        <Card style={{ borderLeft: `3px solid ${T.coralDark}` }}>
          <ul style={{ color: T.charcoal, fontSize: 13.5, lineHeight: 1.9, paddingLeft: 18, margin: 0 }}>
            <li><strong>인용률 정량 보장 없음</strong> — "점수 N점 상승 = 인용률 M% 상승"은 현재 실측 불가. 체크 항목은 업계 공통 인용 요인에 근거하지만, 인과의 최종 검증은 반복 프로빙(로드맵)이 필요.</li>
            <li><strong>홈 1페이지 기준</strong> — 진단은 입력한 URL 1페이지를 봅니다. 사이트 전체 감사는 페이지별 반복 진단으로 근사.</li>
            <li><strong>휴리스틱의 한계</strong> — About 링크·저자 표기 등 일부 신호는 패턴 감지라 드물게 오탐/미탐 가능. 상세 판정 근거를 모두 노출해 사람이 재확인할 수 있게 함.</li>
            <li><strong>로드맵</strong> — ① 실제 AI 인용률·브랜드 언급률(SOV) 반복 프로빙 ② Core Web Vitals 랩 측정 ③ 다중 페이지 감사(사이트맵 기반). <em>구현 완료: 진단 이력·점수 추이(DB), 자체 벤치마크 축적·실측 백분위, 주간 자동 재진단·변동 알림, AI 명령서 프레임워크 맞춤 지침, 사이트 나란히 비교.</em></li>
            <li><strong>엔진 버전과 점수 비교</strong> — 채점 항목이 추가되면 같은 사이트라도 점수가 달라진다. v2 → v3에서 &ldquo;단정적 문체&rdquo; 1개가 추가되어 AEO 가중치 분포가 바뀌었다. 그래서 진단 기록마다 엔진 버전을 함께 저장하고, 추이 그래프에 서로 다른 버전이 섞여 있으면 &ldquo;점수 변화의 일부는 사이트가 아니라 기준이 달라진 것&rdquo;이라고 화면에 표시한다. 버전이 같은 구간끼리만 순수 비교로 읽어야 한다.</li>
            <li><strong>나란히 비교의 경계</strong> — 상대 사이트도 공개된 첫 화면 1개만 같은 40개 항목으로 재며, 로그인이 필요한 영역이나 하위 페이지는 보지 않는다. 따라서 &ldquo;사이트 전체의 우열&rdquo;이 아니라 &ldquo;대표 페이지의 AI 검색 대비 상태&rdquo; 비교로 읽어야 한다. 두 사이트를 같은 시점에 같은 기준으로 재기 때문에 점수 자체는 그대로 견줄 수 있다. 무엇을 비교 대상으로 삼을지는 시스템이 판정하지 않고 사용자가 정하며, 페이지 성격(홈·글·일반)이 서로 다르면 경고를 띄운다.</li>
          </ul>
        </Card>

        <div className="mt-10 pt-6 flex flex-wrap items-center justify-between gap-3"
          style={{ borderTop: `1px solid ${T.hairline}` }}>
          <span style={{ color: T.stone, fontSize: 12 }}>
            Pick AI 측정 설계서 · 내부 공유용 (검색 비노출 · noindex) · 엔진 pickai-deterministic-v2
          </span>
          <a href="/" className="print-hide transition hover:opacity-70"
            style={{ color: T.brandTeal, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            ← 진단 도구로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}
