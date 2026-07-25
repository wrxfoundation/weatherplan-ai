/* ============================================================
 * Weather Plan AI · AI 성적표 진단 엔진
 *
 * SEO · AEO · GEO 결정론 체크 엔진 (순수 함수 — 네트워크 없음)
 * pages/api/scorecard.js 가 수집한 아티팩트를 받아 채점한다.
 *
 * 설계 원칙:
 * - 결정론 전용: 같은 입력이면 항상 같은 점수 (재현 가능)
 * - LLM 심사·인용 측정이 필요한 항목은 "manual"(평가 불가)로 두고
 *   점수에서 제외한다 — FAIL로 위장하지 않는다
 * - 치명적(critical) 체크가 FAIL이면 해당 영역 점수 상한 40점
 * ============================================================ */

/* ─── AI 봇 카탈로그 ───
   search: 답변 인용 경로 — 차단되면 AI 답변에 인용될 수 없음
   train : 모델 학습용 — 정책에 따라 의도적으로 막을 수도 있음 */
export const AI_BOTS = [
  { ua: "OAI-SearchBot",     vendor: "OpenAI",       kind: "search" },
  { ua: "ChatGPT-User",      vendor: "OpenAI",       kind: "search" },
  { ua: "Claude-SearchBot",  vendor: "Anthropic",    kind: "search" },
  { ua: "Claude-User",       vendor: "Anthropic",    kind: "search" },
  { ua: "PerplexityBot",     vendor: "Perplexity",   kind: "search" },
  { ua: "Googlebot",         vendor: "Google",       kind: "search" },
  { ua: "Bingbot",           vendor: "Microsoft",    kind: "search" },
  { ua: "GPTBot",            vendor: "OpenAI",       kind: "train" },
  { ua: "ClaudeBot",         vendor: "Anthropic",    kind: "train" },
  { ua: "Google-Extended",   vendor: "Google",       kind: "train" },
  { ua: "CCBot",             vendor: "Common Crawl", kind: "train" },
  { ua: "Meta-ExternalAgent", vendor: "Meta",        kind: "train" },
  { ua: "Applebot-Extended", vendor: "Apple",        kind: "train" },
];

/* ═════════════════════════════════════════════════════════════
   robots.txt 파서 (RFC 9309 — 그룹 · 최장 일치 · * / $ 와일드카드)
   ═════════════════════════════════════════════════════════════ */

export function parseRobotsTxt(text) {
  const groups = [];   // { agents: [..], rules: [{type:"allow"|"disallow", path}] }
  const sitemaps = [];
  let current = null;
  let lastWasAgent = false;

  for (const rawLine of String(text || "").split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (field === "sitemap") {
      if (value) sitemaps.push(value);
      continue;
    }
    if (field === "user-agent") {
      if (!lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      if (current) current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (field === "allow" || field === "disallow") {
      if (!current) continue; // 그룹 밖 규칙은 무시
      current.rules.push({ type: field, path: value });
    }
  }
  return { groups, sitemaps };
}

/* 패턴 매칭: * = 임의 문자열, $ = 끝 고정 */
function robotsPathMatch(pattern, path) {
  if (pattern === "") return false; // 빈 Disallow = 전체 허용
  let re = "";
  for (const ch of pattern) {
    if (ch === "*") re += ".*";
    else if (ch === "$") re += "$";
    else re += ch.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  }
  try {
    return new RegExp("^" + re).test(path);
  } catch {
    return path.startsWith(pattern.replace(/[*$]/g, ""));
  }
}

/* 봇에 적용되는 그룹 선택: UA 토큰 최장 일치, 없으면 * 그룹 */
function pickGroup(groups, botUa) {
  const bot = botUa.toLowerCase();
  let best = null;
  let bestLen = -1;
  let star = null;
  for (const g of groups) {
    for (const a of g.agents) {
      if (a === "*") { if (!star) star = g; continue; }
      if ((bot.includes(a) || a.includes(bot)) && a.length > bestLen) {
        best = g; bestLen = a.length;
      }
    }
  }
  return best || star || null;
}

/* 판정: { allowed, rule } — rule은 사람이 읽을 근거 문자열 */
export function robotsVerdict(parsed, botUa, path = "/") {
  if (!parsed || !parsed.groups || parsed.groups.length === 0) {
    return { allowed: true, rule: "robots.txt 없음 — 기본 허용" };
  }
  const group = pickGroup(parsed.groups, botUa);
  if (!group) return { allowed: true, rule: "매칭 그룹 없음 — 기본 허용" };

  let winner = null;
  let winnerLen = -1;
  for (const r of group.rules) {
    if (!robotsPathMatch(r.path, path)) continue;
    const len = r.path.length;
    if (len > winnerLen || (len === winnerLen && r.type === "allow")) {
      winner = r; winnerLen = len;
    }
  }
  if (!winner) return { allowed: true, rule: "일치 규칙 없음 — 허용" };
  return {
    allowed: winner.type === "allow",
    rule: `${winner.type === "allow" ? "Allow" : "Disallow"}: ${winner.path}`,
  };
}

/* ═════════════════════════════════════════════════════════════
   HTML 경량 파서 (서버 전용 — 정규식 기반, 외부 의존성 0)
   ═════════════════════════════════════════════════════════════ */

function parseAttrs(tag) {
  const attrs = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let m;
  while ((m = re.exec(tag))) {
    attrs[m[1].toLowerCase()] = (m[3] ?? m[4] ?? m[5] ?? "").trim();
  }
  return attrs;
}

function decodeEntities(s) {
  return String(s || "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function textOf(htmlFragment) {
  return decodeEntities(
    String(htmlFragment || "").replace(/<[^>]*>/g, " ")
  ).replace(/\s+/g, " ").trim();
}

export function analyzeHtml(html) {
  const src = String(html || "");

  /* script/style 제거 본문 */
  const bodyOnly = src
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const text = textOf(bodyOnly);
  const words = text ? text.split(/\s+/) : [];

  /* title */
  const titleM = src.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleM ? textOf(titleM[1]) : null;

  /* meta */
  const metas = [];
  for (const m of src.matchAll(/<meta\b[^>]*>/gi)) metas.push(parseAttrs(m[0]));
  const metaBy = (key, name) =>
    metas.find((a) => (a[key] || "").toLowerCase() === name)?.content ?? null;
  const description = metaBy("name", "description");
  const metaRobots = metaBy("name", "robots");
  const og = {
    title: metaBy("property", "og:title"),
    description: metaBy("property", "og:description"),
    image: metaBy("property", "og:image"),
  };
  const twitterCard = metaBy("name", "twitter:card");
  const viewport = metaBy("name", "viewport");
  const charset = metas.some((a) => "charset" in a) ||
    metas.some((a) => (a["http-equiv"] || "").toLowerCase() === "content-type");
  const publishedTime = metaBy("property", "article:published_time") ||
    metaBy("property", "article:modified_time");

  /* link */
  const links = [];
  for (const m of src.matchAll(/<link\b[^>]*>/gi)) links.push(parseAttrs(m[0]));
  const canonical = links.find((l) => (l.rel || "").toLowerCase().split(/\s+/).includes("canonical"))?.href ?? null;
  const favicon = links.some((l) => /(^|\s)(icon|shortcut icon|apple-touch-icon)(\s|$)/.test((l.rel || "").toLowerCase()));

  /* html lang */
  const htmlTagM = src.match(/<html\b[^>]*>/i);
  const lang = htmlTagM ? (parseAttrs(htmlTagM[0]).lang || null) : null;

  /* headings */
  const headings = [];
  for (const m of src.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const t = textOf(m[2]);
    if (t) headings.push({ level: Number(m[1]), text: t.slice(0, 160) });
  }

  /* JSON-LD */
  const jsonld = [];
  for (const m of src.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const raw = decodeEntities(m[1]).trim();
    if (!raw) continue;
    try {
      const data = JSON.parse(raw);
      jsonld.push({ ok: true, data });
    } catch (e) {
      jsonld.push({ ok: false, error: String(e && e.message || e).slice(0, 140), snippet: raw.slice(0, 90) });
    }
  }
  const ldTypes = [];
  const collectTypes = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(collectTypes);
    const t = node["@type"];
    if (typeof t === "string") ldTypes.push(t);
    else if (Array.isArray(t)) t.forEach((x) => typeof x === "string" && ldTypes.push(x));
    if (node["@graph"]) collectTypes(node["@graph"]);
    Object.values(node).forEach((v) => { if (v && typeof v === "object") collectTypes(v); });
  };
  jsonld.filter((b) => b.ok).forEach((b) => collectTypes(b.data));
  const hasSameAs = jsonld.filter((b) => b.ok).some((b) => JSON.stringify(b.data).includes('"sameAs"'));

  /* images */
  const images = [];
  for (const m of src.matchAll(/<img\b[^>]*>/gi)) images.push(parseAttrs(m[0]));
  const imgTotal = images.length;
  const imgWithAlt = images.filter((a) => (a.alt || "").trim().length > 0).length;
  const hasVideo = /<video\b|youtube\.com\/embed|player\.vimeo\.com/i.test(src);

  /* anchors */
  const anchors = [];
  for (const m of src.matchAll(/<a\b[^>]*href\s*=\s*("([^"]*)"|'([^']*)')[^>]*>([\s\S]*?)<\/a>/gi)) {
    anchors.push({ href: (m[2] ?? m[3] ?? "").trim(), text: textOf(m[4]).slice(0, 80) });
  }

  /* 신뢰 신호 휴리스틱 */
  const hasAbout = anchors.some((a) => /about|company|회사\s*소개|기업\s*소개|소개/i.test(a.href + " " + a.text));
  const hasContact = anchors.some((a) => /contact|문의|상담|inquiry|support/i.test(a.href + " " + a.text)) ||
    anchors.some((a) => a.href.startsWith("mailto:") || a.href.startsWith("tel:"));
  const hasAuthor = /작성자|글쓴이|기자\b|editor|written by|by\s+[A-Z][a-z]+/i.test(text) ||
    metas.some((a) => (a.name || "").toLowerCase() === "author");
  const hasAddress = /사업자\s*등록\s*번호|대표이사|대표\s*:|주소\s*:|copyright|©/i.test(text);
  const dateMatches = text.match(/20\d{2}[.\-/년]\s?\d{1,2}[.\-/월]\s?\d{1,2}/g) || [];

  /* 1차 출처 인용 (권위 도메인으로 나가는 링크) */
  const primarySourceLinks = anchors.filter((a) =>
    /\.(go\.kr|or\.kr|re\.kr|ac\.kr|gov|edu|int)([/?#]|$)|wikipedia\.org|doi\.org|scholar\.google|data\.[a-z.]+/i.test(a.href)
  );

  /* 통계 밀도: 숫자 토큰 / 100단어 */
  const numberTokens = text.match(/\d[\d,.]*\s?(%|퍼센트|원|억|만|배|위|점|명|건|개|시간|분|℃|°C|km|kg|mm)?/g) || [];
  const statDensity = words.length > 0 ? +(numberTokens.length / words.length * 100).toFixed(2) : 0;

  /* 문장 길이 (가독성) — lookbehind 미사용 (구형 Safari 호환) */
  const sentences = text.split(/[.!?。…]+["')\]]?\s+/).filter((s) => s.trim().length > 4);
  const avgSentenceWords = sentences.length > 0
    ? +(words.length / sentences.length).toFixed(1) : 0;

  /* 질문형 헤딩 */
  const isQuestion = (t) =>
    /[?？]\s*$/.test(t) ||
    /^(왜|어떻게|무엇|뭐가|어디서?|언제|누가|얼마나|몇|어떤)/.test(t) ||
    /(까요|나요|을까|ㄹ까|인가요?|한가요?|될까|일까|는가)\s*[?？]?$/.test(t) ||
    /^(how|what|why|when|where|who|which|can|does|do(es)?|is|are|should)\b/i.test(t);
  const questionHeadings = headings.filter((h) => isQuestion(h.text));

  /* SPA 셸 신호 */
  const scriptCount = (src.match(/<script\b/gi) || []).length;
  const spaMarkers = /id=["'](root|app|__next|___gatsby)["'][^>]*>\s*<\/(div|main)>/i.test(src) ||
    /window\.__NUXT__|window\.__INITIAL_STATE__/.test(src);

  return {
    title, description, metaRobots, og, twitterCard, viewport, charset, lang,
    canonical, favicon, publishedTime,
    headings, questionHeadings,
    jsonld, ldTypes, hasSameAs,
    imgTotal, imgWithAlt, hasVideo,
    anchors: anchors.length,
    hasAbout, hasContact, hasAuthor, hasAddress,
    dateCount: dateMatches.length,
    primarySourceCount: primarySourceLinks.length,
    wordCount: words.length,
    statDensity, numberCount: numberTokens.length,
    sentenceCount: sentences.length, avgSentenceWords,
    scriptCount, spaMarkers,
  };
}

/* ═════════════════════════════════════════════════════════════
   채점
   ═════════════════════════════════════════════════════════════ */

const STATUS_SCORE = { pass: 1, warn: 0.5, fail: 0 };

export function gradeOf(score) {
  if (score >= 85) return "A";
  if (score >= 75) return "B";
  if (score >= 65) return "C";
  if (score >= 50) return "D";
  return "F";
}

function koreanLen(s) {
  /* 한글 위주 문자열은 자모 조합 글자 수 그대로 */
  return [...String(s || "")].length;
}

/* artifacts:
   {
     url, finalUrl, path, scheme, status, redirects, responseMs,
     tlsValid, tlsError, mixedContentCount, xRobotsTag,
     parsed (analyzeHtml 결과), robots { found, parsed, sitemaps },
     llmsTxtFound, sitemapXml { checked, ok, status },
     bots: [{ ua, vendor, kind, robotsAllowed, robotsRule, live: {ran, ok, status} }],
   }
*/
export function runScorecard(a) {
  const p = a.parsed || {};
  const checks = [];
  const add = (c) => checks.push(c);
  const pageType = a.path === "/" || a.path === "" ? "homepage" :
    /blog|news|article|post|press|insight/i.test(a.path) ? "article" : "page";

  const isKorean = /[가-힣]/.test((p.title || "") + (p.description || ""));

  /* ── SEO ─────────────────────────────────────── */

  add({
    id: "http-status", area: "seo", severity: "critical", weight: 3,
    label: "HTTP 상태 코드 · 리다이렉트 체인",
    status: a.status >= 200 && a.status < 300
      ? (a.redirects <= 1 ? "pass" : "warn")
      : "fail",
    summary: a.status >= 200 && a.status < 300
      ? `${a.status} OK${a.redirects ? ` (리다이렉트 ${a.redirects}회)` : ""} — 크롤러가 정상 도달합니다.`
      : `최종 상태 ${a.status || "도달 실패"} — 크롤러가 콘텐츠에 도달하지 못합니다.`,
    details: [
      { k: "최종 상태", v: String(a.status || "-") },
      { k: "리다이렉트", v: `${a.redirects}회` },
      { k: "응답 시간", v: `${a.responseMs}ms` },
    ],
    passRule: "2xx이며 리다이렉트 1회 이하일 때 통과",
    fix: a.redirects > 1 ? {
      title: "리다이렉트 체인 단축",
      action: "정리",
      note: "중간 리다이렉트를 제거하고 최초 URL이 바로 최종 URL로 301 되도록 정리하세요.",
      code: `# 예: http → https, www → 루트를 한 번의 301로\nreturn 301 https://example.com$request_uri;`,
    } : null,
  });

  {
    const mixed = a.mixedContentCount || 0;
    const ok = a.scheme === "https" && a.tlsValid !== false;
    add({
      id: "https-tls", area: "seo", severity: "high", weight: 3,
      label: "HTTPS · TLS · 혼합 콘텐츠",
      status: !ok ? "fail" : mixed > 0 ? "warn" : "pass",
      summary: !ok
        ? (a.tlsValid === false
          ? "TLS 인증서가 유효하지 않습니다. 브라우저·크롤러가 비보안 경고를 띄우고 랭킹이 하락합니다."
          : "HTTPS가 아닙니다. 보안 연결이 없으면 랭킹·신뢰 모두 불리합니다.")
        : mixed > 0
          ? `HTTPS이지만 http:// 리소스 ${mixed}건이 혼합 로드됩니다.`
          : "유효한 TLS의 HTTPS로 서빙되며 혼합 콘텐츠가 없습니다.",
      details: [
        { k: "스킴", v: a.scheme },
        { k: "TLS 유효", v: a.tlsValid === false ? "무효" : "유효" },
        { k: "혼합 콘텐츠", v: mixed > 0 ? `${mixed}건` : "없음" },
      ],
      passRule: "유효 TLS의 HTTPS + 혼합 콘텐츠 0건일 때 통과",
      fix: !ok ? {
        title: "유효 TLS의 HTTPS로 전환",
        action: "교체",
        note: "전체 사이트를 유효한 인증서의 HTTPS로 서빙하고 HTTP 요청을 301로 리다이렉트하세요. Let's Encrypt로 무료 발급 가능합니다.",
        code: `# 모든 http:// 요청을 https:// 로 301 리다이렉트 (nginx)\nserver {\n  listen 80;\n  return 301 https://$host$request_uri;\n}`,
      } : mixed > 0 ? {
        title: "혼합 콘텐츠 제거",
        action: "교체",
        note: "http:// 로 로드되는 이미지·스크립트를 https:// 로 바꾸세요.",
        code: `<!-- 교체 전 --> <img src="http://cdn.example.com/a.png">\n<!-- 교체 후 --> <img src="https://cdn.example.com/a.png">`,
      } : null,
    });
  }

  {
    const v = a.robots?.parsed ? robotsVerdict(a.robots.parsed, "*", a.path || "/") : { allowed: true, rule: "robots.txt 없음 — 기본 허용" };
    add({
      id: "robots-crawl", area: "seo", severity: "critical", weight: 3,
      label: "robots.txt 크롤 허용",
      status: v.allowed ? "pass" : "fail",
      summary: v.allowed
        ? "robots.txt가 이 URL의 크롤을 허용합니다."
        : "robots.txt가 이 URL을 차단하고 있습니다 — 검색엔진이 페이지를 읽지 못합니다.",
      details: [
        { k: "robots.txt", v: a.robots?.found ? "있음" : "없음" },
        { k: "적용 규칙", v: v.rule },
        { k: "사이트맵 선언", v: (a.robots?.sitemaps?.length || 0) > 0 ? `${a.robots.sitemaps.length}개` : "없음" },
      ],
      passRule: "이 URL이 허용될 때 통과",
      fix: v.allowed ? null : {
        title: "크롤 차단 해제",
        action: "교체",
        note: "의도한 차단이 아니라면 해당 Disallow 규칙을 제거하세요.",
        code: `User-agent: *\nAllow: /`,
      },
    });
  }

  {
    const robotsMeta = (p.metaRobots || "").toLowerCase();
    const xTag = (a.xRobotsTag || "").toLowerCase();
    const noindex = /noindex/.test(robotsMeta) || /noindex/.test(xTag);
    const nofollow = /nofollow/.test(robotsMeta) || /nofollow/.test(xTag);
    add({
      id: "noindex", area: "seo", severity: "critical", weight: 3,
      label: "인덱싱 차단 지시어 (noindex/nofollow)",
      status: noindex ? "fail" : nofollow ? "warn" : "pass",
      summary: noindex
        ? "noindex 지시어가 있어 검색 결과에서 제외됩니다."
        : nofollow
          ? "nofollow가 설정되어 링크 신호가 전달되지 않습니다."
          : "noindex·nofollow 차단 지시어가 없어 정상적으로 인덱싱 가능합니다.",
      details: [
        { k: "meta robots", v: p.metaRobots || "(없음)" },
        { k: "X-Robots-Tag", v: a.xRobotsTag || "(없음)" },
      ],
      passRule: "noindex가 어디에도 없고 nofollow도 없을 때 통과",
      fix: noindex || nofollow ? {
        title: "차단 지시어 제거",
        action: "교체",
        note: "인덱싱을 원한다면 noindex/nofollow를 제거하거나 all로 바꾸세요.",
        code: `<meta name="robots" content="all">`,
      } : null,
    });
  }

  {
    const t = p.title || "";
    const len = koreanLen(t);
    const [minL, maxL] = isKorean ? [15, 30] : [30, 60];
    const band = isKorean ? "한글 12~35자" : "영문 25~65자";
    add({
      id: "title-tag", area: "seo", severity: "high", weight: 2,
      label: "Title 태그",
      status: !t ? "fail" : len < minL || len > maxL + 5 ? "warn" : "pass",
      summary: !t
        ? "title 태그가 없습니다 — 검색 결과 제목을 검색엔진이 임의로 만듭니다."
        : len < minL
          ? `title이 ${len}자로 너무 짧습니다 (권장 ${minL}~${maxL}자). 키워드·맥락이 부족합니다.`
          : len > maxL + 5
            ? `title이 ${len}자로 깁니다 (권장 ${minL}~${maxL}자). 검색 결과에서 잘립니다.`
            : `title이 ${len}자로 적정 범위입니다.`,
      details: [
        { k: "title", v: t || "(없음)" },
        { k: "길이", v: `${len}자` },
        { k: "권장 범위", v: `${minL}~${maxL}자 (${band})` },
      ],
      passRule: `제목 길이 ${minL}~${maxL + 5}자일 때 통과`,
      fix: (!t || len < minL || len > maxL + 5) ? {
        title: `Title을 ${minL}~${maxL}자로 재작성`,
        action: "교체",
        note: "핵심 키워드를 앞에 두고 브랜드명을 뒤에 붙이세요. 잘리지 않으면서 클릭을 유도하는 길이입니다.",
        code: `<title>핵심 키워드 · 제공 가치 | 브랜드명</title>`,
      } : null,
    });
  }

  {
    const d = p.description || "";
    const len = koreanLen(d);
    const [minL, maxL] = isKorean ? [40, 120] : [70, 200];
    add({
      id: "meta-description", area: "seo", severity: "medium", weight: 2,
      label: "Meta Description",
      status: !d ? "fail" : len < minL || len > maxL ? "warn" : "pass",
      summary: !d
        ? "meta description이 없습니다 — 검색 결과 요약문을 통제할 수 없습니다."
        : len < minL || len > maxL
          ? `meta description이 ${len}자로 권장 범위(${minL}~${maxL}자)를 벗어납니다.`
          : `meta description이 ${len}자로 적정 범위입니다.`,
      details: [
        { k: "description", v: d ? d.slice(0, 120) : "(없음)" },
        { k: "길이", v: `${len}자` },
      ],
      passRule: `설명 ${minL}~${maxL}자일 때 통과`,
      fix: (!d || len < minL || len > maxL) ? {
        title: "행동 유도가 담긴 요약문 작성",
        action: d ? "교체" : "추가",
        note: "페이지가 답하는 질문과 핵심 수치를 담아 한 문단으로 쓰세요.",
        code: `<meta name="description" content="무엇을·누구에게·어떤 결과 — 핵심 수치 1개를 포함한 60~90자 요약">`,
      } : null,
    });
  }

  {
    const c = p.canonical;
    let status = "warn"; let summary = "canonical 태그가 없습니다. 중복 URL 발생 시 색인 신호가 분산될 수 있습니다.";
    let host = null;
    if (c) {
      try { host = new URL(c, a.finalUrl).host; } catch { host = null; }
      const sameHost = host && host === new URL(a.finalUrl).host;
      status = sameHost ? "pass" : "warn";
      summary = sameHost
        ? "자기참조 canonical이 설정되어 색인 신호가 한 URL로 모입니다."
        : "canonical이 다른 도메인을 가리킵니다 — 의도한 크로스도메인 정규화인지 확인하세요.";
    }
    add({
      id: "canonical", area: "seo", severity: "high", weight: 2,
      label: "Canonical 정합성 (자기참조 · 크로스도메인)",
      status, summary,
      details: [
        { k: "canonical", v: c || "(없음)" },
      ],
      passRule: "자기 도메인을 가리키는 canonical이 있을 때 통과",
      fix: status !== "pass" ? {
        title: "자기참조 canonical 추가",
        action: "추가",
        note: "<head>에 자기 자신을 가리키는 canonical을 추가해 색인 신호를 한 URL로 통합하세요.",
        code: `<link rel="canonical" href="${a.finalUrl}">`,
      } : null,
    });
  }

  {
    const hs = p.headings || [];
    const h1s = hs.filter((h) => h.level === 1);
    let skip = false;
    let prev = 0;
    for (const h of hs) {
      if (prev && h.level > prev + 1) { skip = true; break; }
      prev = h.level;
    }
    const status = hs.length === 0 ? "fail" : h1s.length === 1 && !skip ? "pass" : "warn";
    add({
      id: "heading-structure", area: "seo", severity: "high", weight: 2,
      label: "헤딩 구조 (단일 H1 · 레벨 스킵)",
      status,
      summary: hs.length === 0
        ? "헤딩이 하나도 없습니다 — 문서 구조를 파싱할 수 없습니다."
        : h1s.length === 0
          ? "H1이 없습니다. 문서 위계가 모호해 구조 파싱이 어렵습니다."
          : h1s.length > 1
            ? `H1이 ${h1s.length}개입니다 — 페이지 주제가 분산됩니다.`
            : skip
              ? "헤딩 레벨을 건너뛰는 구간이 있습니다 (예: H1 → H3)."
              : "단일 H1과 순차 위계가 정상입니다.",
      details: [
        { k: "H1 개수", v: String(h1s.length) },
        { k: "전체 헤딩", v: `${hs.length}개` },
        { k: "레벨 스킵", v: skip ? "있음" : "없음" },
      ],
      passRule: "H1이 정확히 1개이고 레벨 스킵이 없을 때 통과",
      fix: status !== "pass" ? {
        title: "단일 H1 · 순차 헤딩 위계 정리",
        action: "재작성",
        note: "페이지 주제를 담은 H1을 정확히 하나 두고, 하위 섹션은 레벨을 건너뛰지 않고 내려가세요.",
        code: `<h1>페이지 핵심 주제</h1>\n  <h2>주요 섹션</h2>\n    <h3>하위 항목</h3>\n  <h2>다음 섹션</h2>`,
      } : null,
    });
  }

  {
    const blocks = p.jsonld || [];
    const bad = blocks.filter((b) => !b.ok);
    add({
      id: "jsonld-valid", area: "seo", severity: "high", weight: 2,
      label: "구조화 데이터 (JSON-LD) 유효성",
      status: blocks.length === 0 ? "warn" : bad.length > 0 ? "fail" : "pass",
      summary: blocks.length === 0
        ? "JSON-LD가 없습니다 — 검색엔진·AI가 페이지 의미를 구조적으로 읽지 못합니다."
        : bad.length > 0
          ? `JSON-LD 블록 ${bad.length}개가 유효하지 않습니다 (${bad[0].error}). 검색 엔진이 무시합니다.`
          : `JSON-LD ${blocks.length}개 블록이 모두 유효합니다.`,
      details: [
        { k: "블록 수", v: String(blocks.length) },
        { k: "오류", v: bad.length > 0 ? bad[0].error : "없음" },
        { k: "감지 타입", v: (p.ldTypes || []).slice(0, 6).join(", ") || "(없음)" },
      ],
      passRule: "JSON-LD가 1개 이상 있고 전부 유효할 때 통과",
      fix: blocks.length === 0 || bad.length > 0 ? {
        title: bad.length > 0 ? "JSON-LD 문법 오류 수정" : "기본 JSON-LD 추가",
        action: bad.length > 0 ? "교체" : "추가",
        note: "흔한 원인은 굽은 따옴표(“ ”), 트레일링 콤마, @context/@type 누락입니다. 반드시 곧은 따옴표를 쓰세요.",
        code: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "WebSite",\n  "name": "브랜드명",\n  "url": "${a.finalUrl}"\n}\n</script>`,
      } : null,
    });
  }

  {
    const declared = (a.robots?.sitemaps?.length || 0) > 0;
    const fileOk = a.sitemapXml?.ok === true;
    add({
      id: "sitemap", area: "seo", severity: "medium", weight: 1.5,
      label: "XML 사이트맵 선언",
      status: declared ? "pass" : fileOk ? "warn" : "fail",
      summary: declared
        ? "robots.txt에 사이트맵이 선언되어 크롤러가 URL 목록을 빠르게 발견합니다."
        : fileOk
          ? "/sitemap.xml은 있지만 robots.txt에 선언되지 않았습니다."
          : "robots.txt에 선언된 XML 사이트맵이 없습니다. 크롤러의 URL 발견 효율이 떨어집니다.",
      details: [
        { k: "robots.txt 선언", v: declared ? `${a.robots.sitemaps.length}개` : "0개" },
        { k: "/sitemap.xml", v: a.sitemapXml?.checked ? (fileOk ? "응답 OK" : "없음/오류") : "미확인" },
      ],
      passRule: "robots.txt에 Sitemap이 1개 이상 선언될 때 통과",
      fix: declared ? null : {
        title: "robots.txt에 Sitemap 선언 추가",
        action: "추가",
        note: "robots.txt 마지막 줄에 Sitemap: 을 추가하세요.",
        code: `Sitemap: ${a.scheme}://${a.host}/sitemap.xml`,
      },
    });
  }

  {
    const signals = [p.hasAbout, p.hasContact, p.hasAddress, p.hasAuthor].filter(Boolean).length;
    add({
      id: "eeat-onpage", area: "seo", severity: "high", weight: 2,
      label: "E-E-A-T 온페이지 신호 (저자 · About/Contact · 사업자 정보)",
      status: signals >= 2 ? "pass" : signals === 1 ? "warn" : "fail",
      summary: signals >= 2
        ? "조직 실체를 확인할 수 있는 신뢰 신호가 충분합니다."
        : signals === 1
          ? "신뢰 신호가 1개뿐입니다 — About·Contact·사업자 정보를 보강하세요."
          : "About/Contact 링크가 없습니다 — 조직의 신뢰 신호를 확인할 수 없습니다.",
      details: [
        { k: "About 링크", v: p.hasAbout ? "있음" : "없음" },
        { k: "Contact 링크", v: p.hasContact ? "있음" : "없음" },
        { k: "사업자·주소 표기", v: p.hasAddress ? "있음" : "없음" },
        { k: "저자 표기", v: p.hasAuthor ? "있음" : "없음" },
      ],
      passRule: "신뢰 신호 2개 이상일 때 통과",
      fix: signals >= 2 ? null : {
        title: "About·Contact 링크 추가",
        action: "추가",
        note: "푸터/내비에 회사 소개와 문의 링크를 추가하세요. AI가 조직의 실체를 확인하는 기본 신호입니다.",
        code: `<a href="/about">회사 소개</a> · <a href="/contact">문의</a>`,
      },
    });
  }

  {
    const wc = p.wordCount || 0;
    const status = wc >= 150 || (!p.spaMarkers && wc >= 60) ? "pass" : wc < 60 && p.spaMarkers ? "fail" : "warn";
    add({
      id: "js-render-gap", area: "seo", severity: "high", weight: 2,
      label: "JS 렌더링 콘텐츠 갭 (SSR 커버리지)",
      status,
      summary: status === "pass"
        ? `raw-HTML에 본문 ${wc}단어가 담겨 있어 JS 미실행 크롤러도 콘텐츠를 확보합니다.`
        : status === "fail"
          ? "raw-HTML이 빈 SPA 셸입니다 — JS를 실행하지 않는 크롤러·AI 봇은 빈 페이지를 봅니다."
          : `raw-HTML 본문이 ${wc}단어로 얇습니다 — SSR/프리렌더 보강을 검토하세요.`,
      details: [
        { k: "raw 단어 수", v: String(wc) },
        { k: "스크립트 태그", v: `${p.scriptCount || 0}개` },
        { k: "SPA 마커", v: p.spaMarkers ? "감지" : "없음" },
      ],
      passRule: "raw 본문 150단어 이상 또는 SPA 셸 신호가 없을 때 통과",
      fix: status === "pass" ? null : {
        title: "SSR / 프리렌더 도입",
        action: "정리",
        note: "Next.js·Nuxt 등의 SSR, 또는 프리렌더링으로 핵심 본문이 raw HTML에 담기게 하세요.",
        code: `// Next.js 예: 페이지를 서버에서 렌더\nexport async function getServerSideProps() { return { props: {} } }`,
      },
    });
  }

  {
    const ogc = [p.og?.title, p.og?.description, p.og?.image].filter(Boolean).length;
    add({
      id: "og-social", area: "seo", severity: "medium", weight: 1.5,
      label: "Open Graph · 소셜 카드",
      status: ogc === 3 ? "pass" : ogc > 0 ? "warn" : "fail",
      summary: ogc === 3
        ? "OG 태그 3종이 모두 있어 공유·AI 미리보기가 완전합니다."
        : ogc > 0
          ? `OG 태그가 ${ogc}/3종만 있습니다 — 누락분을 채우세요.`
          : "OG 태그가 없습니다 — 카톡·슬랙 공유와 AI 미리보기에서 빈 카드가 나갑니다.",
      details: [
        { k: "og:title", v: p.og?.title ? "있음" : "없음" },
        { k: "og:description", v: p.og?.description ? "있음" : "없음" },
        { k: "og:image", v: p.og?.image ? "있음" : "없음" },
        { k: "twitter:card", v: p.twitterCard || "(없음)" },
      ],
      passRule: "og:title · og:description · og:image 3종 모두 있을 때 통과",
      fix: ogc === 3 ? null : {
        title: "OG 태그 3종 세트 추가",
        action: "추가",
        note: "공유 미리보기와 AI 인용 카드에 쓰이는 기본 3종입니다.",
        code: `<meta property="og:title" content="페이지 제목">\n<meta property="og:description" content="한 줄 요약">\n<meta property="og:image" content="https://example.com/og-image.png">`,
      },
    });
  }

  {
    const items = [
      ["viewport", !!p.viewport], ["charset", !!p.charset],
      ["html lang", !!p.lang], ["favicon", !!p.favicon],
    ];
    const okCount = items.filter(([, v]) => v).length;
    add({
      id: "basic-meta", area: "seo", severity: "low", weight: 1,
      label: "기본 위생 (viewport · charset · lang · favicon)",
      status: okCount === 4 ? "pass" : okCount >= 2 ? "warn" : "fail",
      summary: okCount === 4
        ? "기본 메타 위생 4종이 모두 갖춰져 있습니다."
        : `기본 메타 4종 중 ${okCount}개만 있습니다 (${items.filter(([, v]) => !v).map(([k]) => k).join(", ")} 누락).`,
      details: items.map(([k, v]) => ({ k, v: v ? "있음" : "없음" })),
      passRule: "4종 모두 있을 때 통과",
      fix: okCount === 4 ? null : {
        title: "기본 메타 보강",
        action: "추가",
        code: `<html lang="ko">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<link rel="icon" href="/favicon.ico">`,
      },
    });
  }

  add({
    id: "freshness", area: "seo", severity: "medium", weight: pageType === "homepage" ? 0 : 1,
    label: "콘텐츠 신선도 신호",
    status: pageType === "homepage" ? "na"
      : (p.publishedTime || p.dateCount > 0) ? "pass" : "warn",
    summary: pageType === "homepage"
      ? "에버그린/기업 홈은 게시일 신호가 없는 것이 정상입니다 — 평가 제외."
      : (p.publishedTime || p.dateCount > 0)
        ? "게시·수정일 신호가 확인됩니다."
        : "게시일 신호가 없습니다 — 아티클형 페이지는 날짜를 명시하세요.",
    details: [
      { k: "페이지 타입", v: pageType },
      { k: "article:published_time", v: p.publishedTime || "(없음)" },
      { k: "본문 날짜 표기", v: `${p.dateCount || 0}건` },
    ],
    passRule: "최근 갱신 신호가 있을 때 통과 (홈페이지는 평가 제외)",
    fix: null,
  });

  add({
    id: "cwv", area: "seo", severity: "high", weight: 0,
    label: "Core Web Vitals (랩 측정)",
    status: "manual",
    summary: "무료 결정론 진단에서는 PSI를 호출하지 않습니다 (재현성·속도 보장). 정밀 진단에서 측정됩니다.",
    details: [
      { k: "LCP 임계값", v: "≤ 2500ms" },
      { k: "INP 임계값", v: "≤ 200ms" },
      { k: "CLS 임계값", v: "≤ 0.1" },
    ],
    passRule: "정밀 진단(비동기 랩 측정) 대상",
    fix: null,
  });

  add({
    id: "content-quality-llm", area: "seo", severity: "high", weight: 0,
    label: "콘텐츠 품질 · AEO 준비도 (LLM 심사)",
    status: "manual",
    summary: "콘텐츠 깊이·독창성·답변 우선 구조는 LLM이 심사합니다 — 무료 결정론 레인에서는 점수에서 제외됩니다.",
    details: [
      { k: "본문 단어 수", v: String(p.wordCount || 0) },
      { k: "섹션 수", v: String((p.headings || []).length) },
    ],
    passRule: "LLM 서브점수 ≥ 70일 때 통과 (정밀 진단)",
    fix: null,
  });

  /* ── AEO ─────────────────────────────────────── */

  {
    const qn = (p.questionHeadings || []).length;
    const total = (p.headings || []).length;
    add({
      id: "question-headings", area: "aeo", severity: "high", weight: 2.5,
      label: "질문형 헤딩",
      status: qn >= 3 || (total > 0 && qn / total >= 0.2) ? "pass" : qn >= 1 ? "warn" : "fail",
      summary: qn === 0
        ? "헤딩이 모두 서술형이며 질문형이 전혀 없습니다 — AI는 질문에 답하는 구조를 우선 인용합니다."
        : qn >= 3 || (total > 0 && qn / total >= 0.2)
          ? `질문형 헤딩 ${qn}개 — 답변엔진이 인용하기 좋은 구조입니다.`
          : `질문형 헤딩이 ${qn}개뿐입니다 — 핵심 섹션을 질문형으로 바꿔보세요.`,
      details: [
        { k: "질문형 헤딩", v: `${qn}개 / 전체 ${total}개` },
        { k: "예시", v: (p.questionHeadings || [])[0]?.text || "(없음)" },
      ],
      passRule: "질문형 헤딩 3개 이상 또는 전체의 20% 이상일 때 통과",
      fix: qn >= 3 ? null : {
        title: "핵심 섹션을 질문형 헤딩으로 전환",
        action: "재작성",
        note: "사용자가 실제로 검색창·AI에 묻는 문장을 그대로 헤딩으로 쓰고, 바로 아래 2~3문장으로 직접 답하세요.",
        code: `<h2>날씨 기반 광고는 어떻게 시작하나요?</h2>\n<p>핵심 답변을 첫 문장에 — 근거와 수치는 그 다음에.</p>`,
      },
    });
  }

  {
    const entity = (p.ldTypes || []).some((t) => /Organization|Person|LocalBusiness|Corporation/i.test(t));
    add({
      id: "entity-schema", area: "aeo", severity: "high", weight: 2.5,
      label: "엔티티 스키마 (Organization/Person + sameAs)",
      status: entity && p.hasSameAs ? "pass" : entity ? "warn" : "fail",
      summary: entity && p.hasSameAs
        ? "Organization 엔티티와 sameAs 연결이 있어 AI가 브랜드 실체를 식별합니다."
        : entity
          ? "엔티티 스키마는 있지만 sameAs 연결이 없습니다 — 공식 채널을 연결하세요."
          : "Organization/Person 엔티티 스키마가 없습니다 — sameAs 연결도 없습니다.",
      details: [
        { k: "엔티티 타입", v: (p.ldTypes || []).filter((t) => /Organization|Person|LocalBusiness/i.test(t)).join(", ") || "(없음)" },
        { k: "sameAs", v: p.hasSameAs ? "있음" : "없음" },
      ],
      passRule: "엔티티 스키마 + sameAs 둘 다 있을 때 통과",
      fix: entity && p.hasSameAs ? null : {
        title: "Organization + sameAs 스키마 추가",
        action: "추가",
        note: "브랜드를 하나의 엔티티로 선언하고 공식 채널(sameAs)로 신원을 굳히세요.",
        code: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "브랜드명",\n  "url": "${a.finalUrl}",\n  "logo": "${a.scheme}://${a.host}/logo.png",\n  "sameAs": [\n    "https://www.linkedin.com/company/브랜드",\n    "https://www.youtube.com/@브랜드",\n    "https://blog.naver.com/브랜드"\n  ]\n}\n</script>`,
      },
    });
  }

  {
    const answerTypes = (p.ldTypes || []).filter((t) => /FAQPage|HowTo|QAPage|Article|NewsArticle|BlogPosting/i.test(t));
    const hasAny = (p.jsonld || []).some((b) => b.ok);
    add({
      id: "answer-schema", area: "aeo", severity: "high", weight: 2,
      label: "답변형 스키마 (FAQPage · HowTo · Article)",
      status: answerTypes.length > 0 ? "pass" : hasAny ? "warn" : "fail",
      summary: answerTypes.length > 0
        ? `답변형 스키마(${answerTypes.slice(0, 3).join(", ")})가 있어 발췌·인용이 쉽습니다.`
        : hasAny
          ? "JSON-LD는 있으나 답변형 스키마 타입(FAQPage/HowTo/Article)이 없습니다."
          : "답변형 스키마가 전혀 없습니다 — AI가 Q&A 구조를 인식하지 못합니다.",
      details: [
        { k: "감지 타입", v: answerTypes.join(", ") || "(없음)" },
      ],
      passRule: "FAQPage·HowTo·Article 계열 타입이 1개 이상일 때 통과",
      fix: answerTypes.length > 0 ? null : {
        title: "FAQPage 스키마 추가",
        action: "추가",
        note: "자주 묻는 질문 2~3개만으로도 시작할 수 있습니다.",
        code: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": [{\n    "@type": "Question",\n    "name": "핵심 질문?",\n    "acceptedAnswer": { "@type": "Answer", "text": "직접적인 답변." }\n  }]\n}\n</script>`,
      },
    });
  }

  {
    const hs = p.headings || [];
    let skip = false; let prev = 0;
    for (const h of hs) { if (prev && h.level > prev + 1) { skip = true; break; } prev = h.level; }
    const hasH1 = hs.some((h) => h.level === 1);
    add({
      id: "heading-hierarchy", area: "aeo", severity: "medium", weight: 1.5,
      label: "헤딩 위계",
      status: hs.length === 0 ? "fail" : hasH1 && !skip ? "pass" : "warn",
      summary: hs.length === 0
        ? "헤딩이 없어 답변 단위 분해가 불가능합니다."
        : hasH1 && !skip
          ? "헤딩 위계가 온전해 답변 단위로 발췌하기 좋습니다."
          : `헤딩 위계 문제: ${!hasH1 ? "H1 없음" : "레벨 스킵"}.`,
      details: [
        { k: "H1", v: hasH1 ? "있음" : "없음" },
        { k: "레벨 스킵", v: skip ? "있음" : "없음" },
      ],
      passRule: "H1이 있고 레벨 스킵이 없을 때 통과",
      fix: null,
    });
  }

  {
    const avg = p.avgSentenceWords || 0;
    const enough = (p.wordCount || 0) >= 60;
    add({
      id: "readability", area: "aeo", severity: "medium", weight: 2,
      label: "가독성 점수",
      status: !enough ? "warn" : avg <= 25 ? "pass" : avg <= 40 ? "warn" : "fail",
      summary: !enough
        ? "본문 텍스트가 적어 보수적으로 평가합니다."
        : avg <= 25
          ? `평균 문장 길이 ${avg}단어 — AI가 발췌하기 좋은 짧은 문장입니다.`
          : `평균 문장 길이 ${avg}단어로 ${avg > 40 ? "너무 깁니다" : "긴 편입니다"} — 문장을 짧게 나누세요.`,
      details: [
        { k: "평균 문장 길이", v: `${avg}단어` },
        { k: "문장 수", v: String(p.sentenceCount || 0) },
        { k: "본문 단어 수", v: String(p.wordCount || 0) },
      ],
      passRule: "평균 문장 길이 25단어 이하일 때 통과",
      fix: avg > 25 && enough ? {
        title: "문장 분할",
        action: "재작성",
        note: "한 문장 = 한 주장. 접속사로 이어진 긴 문장을 마침표로 끊으세요.",
        code: null,
      } : null,
    });
  }

  {
    const signals = [
      p.hasAuthor, p.dateCount > 0, (p.primarySourceCount || 0) > 0,
      (p.ldTypes || []).some((t) => /Organization/i.test(t)),
    ].filter(Boolean).length;
    add({
      id: "eeat-signals", area: "aeo", severity: "high", weight: 2,
      label: "E-E-A-T 신호 (저자 · 날짜 · 출처 · 조직)",
      status: signals >= 2 ? "pass" : signals === 1 ? "warn" : "fail",
      summary: signals >= 2
        ? `E-E-A-T 신호 ${signals}종 확인 — AI가 신뢰할 근거가 있습니다.`
        : signals === 1
          ? "E-E-A-T 신호 1개만 확인되어 신뢰도가 낮습니다."
          : "저자·날짜·1차 출처·조직 스키마가 모두 없습니다 — 신뢰 근거가 비어 있습니다.",
      details: [
        { k: "저자 표기", v: p.hasAuthor ? "있음" : "없음" },
        { k: "날짜 표기", v: p.dateCount > 0 ? "있음" : "없음" },
        { k: "1차 출처 링크", v: `${p.primarySourceCount || 0}건` },
        { k: "Organization 스키마", v: (p.ldTypes || []).some((t) => /Organization/i.test(t)) ? "있음" : "없음" },
      ],
      passRule: "신호 2종 이상일 때 통과",
      fix: signals >= 2 ? null : {
        title: "신뢰 신호 보강",
        action: "추가",
        note: "저자·게시일 표기와 권위 출처 인용부터 시작하세요.",
        code: `<p class="byline">작성 홍길동 · 검수 데이터팀 · 2026.07.25 업데이트</p>`,
      },
    });
  }

  add({
    id: "intent-format", area: "aeo", severity: "medium", weight: 0,
    label: "의도-포맷 일치 (LLM)",
    status: "manual",
    summary: "질문 의도별 최적 포맷(표·리스트·단답) 일치는 LLM 심사 항목입니다 — 정밀 진단에서 평가됩니다.",
    details: [],
    passRule: "정밀 진단(LLM 심사) 대상",
    fix: null,
  });

  add({
    id: "answer-directness", area: "aeo", severity: "medium", weight: 0,
    label: "답변 직접성 · 자체완결성 (LLM)",
    status: "manual",
    summary: "섹션 첫 문장이 질문에 바로 답하는지는 LLM 심사 항목입니다 — 정밀 진단에서 평가됩니다.",
    details: [],
    passRule: "정밀 진단(LLM 심사) 대상",
    fix: null,
  });

  /* ── GEO ─────────────────────────────────────── */

  {
    const d = p.statDensity || 0;
    const cite = p.primarySourceCount || 0;
    const status = (d >= 3 || (d >= 1.5 && cite >= 1)) ? "pass" : (d >= 1 || cite >= 1) ? "warn" : "fail";
    add({
      id: "stats-density", area: "geo", severity: "high", weight: 2.5,
      label: "통계 밀도 + 1차 출처 인용",
      status,
      summary: status === "pass"
        ? `통계 밀도 ${d}/100단어 · 1차 출처 ${cite}건 — 생성형 엔진이 인용할 근거가 풍부합니다.`
        : status === "warn"
          ? `통계 밀도 ${d}/100단어 · 1차 출처 ${cite}건 — 수치와 출처를 더 보강하세요.`
          : `통계 밀도 ${d}/100단어이며 권위 있는 1차 출처 인용이 없습니다 — GEO 최상위 인용 레버가 비어 있습니다.`,
      details: [
        { k: "통계 밀도", v: `${d} / 100단어` },
        { k: "숫자 토큰", v: `${p.numberCount || 0}개` },
        { k: "1차 출처 링크", v: `${cite}건` },
      ],
      passRule: "밀도 3 이상, 또는 1.5 이상 + 1차 출처 1건 이상일 때 통과",
      fix: status === "pass" ? null : {
        title: "핵심 문단에 수치·출처 주입",
        action: "재작성",
        note: "주장 뒤에 구체적 수치와 출처 링크를 붙이세요. AI는 '숫자 + 출처'가 있는 문장을 우선 인용합니다.",
        code: `<!-- 전 --> <p>많은 고객이 만족하고 있습니다.</p>\n<!-- 후 --> <p>도입 기업 132곳의 재계약률은 91%입니다\n(<a href="https://example.go.kr/report">2026 공식 통계</a> 기준).</p>`,
      },
    });
  }

  {
    const citeTypes = (p.ldTypes || []).filter((t) => /Article|FAQPage|Organization|Dataset|Report|HowTo/i.test(t));
    const hasAny = (p.jsonld || []).some((b) => b.ok);
    add({
      id: "citation-schema", area: "geo", severity: "high", weight: 2,
      label: "인용 관련 JSON-LD 스키마 타입",
      status: citeTypes.length > 0 ? "pass" : hasAny ? "warn" : "fail",
      summary: citeTypes.length > 0
        ? `인용 친화 스키마(${citeTypes.slice(0, 3).join(", ")})가 선언되어 있습니다.`
        : hasAny
          ? "JSON-LD가 있으나 인용 관련 스키마 타입(Article/FAQPage/Organization 등)이 없습니다."
          : "인용 관련 스키마가 없어 생성형 엔진이 출처 카드로 쓰기 어렵습니다.",
      details: [
        { k: "감지 타입", v: citeTypes.join(", ") || "(없음)" },
      ],
      passRule: "Article·FAQPage·Organization 계열 타입이 1개 이상일 때 통과",
      fix: citeTypes.length > 0 ? null : {
        title: "인용 친화 스키마 추가",
        action: "추가",
        code: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "브랜드명",\n  "url": "${a.finalUrl}"\n}\n</script>`,
      },
    });
  }

  {
    const bots = a.bots || [];
    const searchBlocked = bots.filter((b) => b.kind === "search" && !b.robotsAllowed);
    const trainBlocked = bots.filter((b) => b.kind === "train" && !b.robotsAllowed);
    /* 메인 페치(일반 UA)가 2xx일 때만 라이브 페치 실패를 "봇 차단"으로 귀속
       — 사이트가 모든 요청을 막는 경우와 구분하기 위함 */
    const liveMeaningful = a.status >= 200 && a.status < 300;
    const liveBlocked = liveMeaningful
      ? bots.filter((b) => b.live?.ran && b.live.ok === false && b.robotsAllowed)
      : [];
    const status = searchBlocked.length > 0 || liveBlocked.some((b) => b.kind === "search")
      ? "fail" : trainBlocked.length > 0 ? "warn" : "pass";
    add({
      id: "ai-crawler-access", area: "geo", severity: "critical", weight: 3,
      label: "AI 크롤러 접근성 (GPTBot · ClaudeBot · PerplexityBot …)",
      status,
      summary: status === "pass"
        ? `검색·학습 AI 봇 ${bots.length}개가 모두 접근 가능합니다. AI 답변 인용 경로가 열려 있습니다.`
        : status === "warn"
          ? `학습 봇 ${trainBlocked.length}개가 차단되어 있습니다 (정책상 의도라면 문제 없음). 검색 봇은 모두 허용입니다.`
          : `검색 AI 봇 ${searchBlocked.length + liveBlocked.filter((b) => b.kind === "search").length}개가 차단되어 있습니다 — AI 답변에 인용될 수 없는 상태입니다.`,
      details: [
        { k: "검색 봇 허용", v: `${bots.filter((b) => b.kind === "search" && b.robotsAllowed).length}/${bots.filter((b) => b.kind === "search").length}` },
        { k: "학습 봇 허용", v: `${bots.filter((b) => b.kind === "train" && b.robotsAllowed).length}/${bots.filter((b) => b.kind === "train").length}` },
        { k: "차단 봇", v: [...searchBlocked, ...trainBlocked].map((b) => b.ua).join(", ") || "없음" },
      ],
      passRule: "어떤 검색 봇도 차단되지 않을 때 통과",
      fix: status === "pass" ? null : {
        title: "AI 검색 봇 차단 해제",
        action: "교체",
        note: "robots.txt에서 검색 봇 차단 규칙을 제거하세요. 학습 봇 차단은 정책 판단입니다.",
        code: `# AI 답변 인용을 원한다면 검색 봇은 허용\nUser-agent: OAI-SearchBot\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /\n\nUser-agent: Claude-SearchBot\nAllow: /`,
      },
    });
  }

  add({
    id: "llms-txt", area: "geo", severity: "low", weight: 1,
    label: "/llms.txt 존재",
    status: a.llmsTxtFound ? "pass" : "warn",
    summary: a.llmsTxtFound
      ? "/llms.txt가 있습니다 — LLM에게 사이트 구조를 요약 제공하는 초기 표준을 선도 채택했습니다."
      : "/llms.txt가 없습니다 — 다만 채택률이 낮고 주요 LLM이 아직 네이티브로 소비하지 않아 영향은 낮습니다.",
    details: [
      { k: "/llms.txt", v: a.llmsTxtFound ? "있음" : "없음" },
    ],
    passRule: "/llms.txt가 200으로 응답할 때 통과",
    fix: a.llmsTxtFound ? null : {
      title: "/llms.txt 추가 (선택)",
      action: "추가",
      note: "사이트 핵심 페이지를 마크다운 목록으로 요약한 파일입니다.",
      code: `# 브랜드명\n\n> 한 줄 소개\n\n## 주요 문서\n- [서비스 소개](${a.scheme}://${a.host}/about): 무엇을 하는 회사인지\n- [가격](${a.scheme}://${a.host}/pricing): 요금제 요약`,
    },
  });

  {
    const total = p.imgTotal || 0;
    const withAlt = p.imgWithAlt || 0;
    const ratio = total > 0 ? withAlt / total : 1;
    const status = total < 3 ? (p.hasVideo || total > 0 ? "pass" : "warn")
      : ratio >= 0.7 ? "pass" : ratio >= 0.3 ? "warn" : "fail";
    add({
      id: "multimodal", area: "geo", severity: "medium", weight: 1.5,
      label: "멀티모달 콘텐츠 (이미지/영상 + alt)",
      status,
      summary: total === 0 && !p.hasVideo
        ? "이미지·영상이 없습니다 — 멀티모달 인용 기회가 없습니다."
        : status === "fail"
          ? `이미지 ${total - withAlt}개에 alt 텍스트가 없습니다 — AI가 이미지 내용을 이해하지 못합니다.`
          : status === "warn"
            ? `alt 커버리지 ${Math.round(ratio * 100)}% — 누락 이미지에 alt를 채우세요.`
            : `이미지 ${total}개 · alt 커버리지 ${Math.round(ratio * 100)}%${p.hasVideo ? " · 영상 있음" : ""} — 양호합니다.`,
      details: [
        { k: "이미지", v: `${total}개` },
        { k: "alt 보유", v: `${withAlt}개 (${total ? Math.round(ratio * 100) : 100}%)` },
        { k: "영상", v: p.hasVideo ? "있음" : "없음" },
      ],
      passRule: "alt 커버리지 70% 이상일 때 통과",
      fix: status === "pass" ? null : {
        title: "이미지 alt 텍스트 채우기",
        action: "추가",
        note: "장식용이 아닌 모든 이미지에 내용을 설명하는 alt를 넣으세요.",
        code: `<img src="/chart.png" alt="2026년 여름 폭염일수와 음료 매출 상관 그래프 — 폭염 7일차에 매출 +24%">`,
      },
    });
  }

  add({
    id: "citation-rate", area: "geo", severity: "high", weight: 0,
    label: "실제 AI 인용률",
    status: "manual",
    summary: "여러 생성형 엔진에서 이 페이지가 실제로 인용되는 비율은 반복 프로빙으로 측정합니다 — 정밀 진단 대상입니다.",
    details: [],
    passRule: "정밀 진단(GEO 인용 측정) 대상",
    fix: null,
  });

  add({
    id: "sov", area: "geo", severity: "high", weight: 0,
    label: "브랜드 언급률 · Share of Voice",
    status: "manual",
    summary: "생성형 엔진 답변에서 브랜드가 언급되는 비율·경쟁사 대비 점유율은 정밀 진단에서 측정됩니다.",
    details: [],
    passRule: "정밀 진단(GEO 인용 측정) 대상",
    fix: null,
  });

  /* ── 영역 점수 집계 ─────────────────────────── */

  const areas = {};
  for (const key of ["seo", "aeo", "geo"]) {
    const list = checks.filter((c) => c.area === key);
    const scored = list.filter((c) => c.weight > 0 && c.status !== "na" && c.status !== "manual");
    const wsum = scored.reduce((s, c) => s + c.weight, 0);
    let score = wsum > 0
      ? Math.round(scored.reduce((s, c) => s + c.weight * STATUS_SCORE[c.status], 0) / wsum * 100)
      : 0;
    const criticalFail = list.some((c) => c.severity === "critical" && c.status === "fail");
    if (criticalFail && score > 40) score = 40;
    areas[key] = {
      score,
      grade: gradeOf(score),
      criticalFail,
      counts: {
        pass: list.filter((c) => c.status === "pass").length,
        warn: list.filter((c) => c.status === "warn").length,
        fail: list.filter((c) => c.status === "fail").length,
        manual: list.filter((c) => c.status === "manual").length,
        na: list.filter((c) => c.status === "na").length,
      },
    };
  }

  const overall = Math.round(areas.seo.score * 0.35 + areas.aeo.score * 0.35 + areas.geo.score * 0.30);

  /* ── 레이더 6축 ─────────────────────────────── */
  const AXES = [
    { key: "tech",    label: "기술 기반",     ids: ["http-status", "https-tls", "robots-crawl", "noindex", "sitemap", "js-render-gap", "basic-meta"] },
    { key: "content", label: "콘텐츠 구조",   ids: ["title-tag", "meta-description", "heading-structure", "heading-hierarchy", "readability"] },
    { key: "schema",  label: "스키마·엔티티", ids: ["jsonld-valid", "entity-schema", "answer-schema", "citation-schema"] },
    { key: "trust",   label: "신뢰 신호",     ids: ["eeat-onpage", "eeat-signals", "og-social", "canonical"] },
    { key: "open",    label: "AI 개방성",     ids: ["ai-crawler-access", "llms-txt"] },
    { key: "cite",    label: "인용 경쟁력",   ids: ["stats-density", "question-headings", "multimodal"] },
  ];
  const radar = AXES.map((ax) => {
    const list = checks.filter((c) => ax.ids.includes(c.id) && c.weight > 0 && c.status !== "na" && c.status !== "manual");
    const w = list.reduce((s, c) => s + c.weight, 0);
    const v = w > 0 ? Math.round(list.reduce((s, c) => s + c.weight * STATUS_SCORE[c.status], 0) / w * 100) : null;
    return { key: ax.key, label: ax.label, value: v };
  });

  /* 우선순위 이슈: fail > warn, severity 순 */
  const sevRank = { critical: 0, high: 1, medium: 2, low: 3 };
  const issues = checks
    .filter((c) => c.status === "fail" || c.status === "warn")
    .sort((x, y) =>
      (x.status === y.status ? 0 : x.status === "fail" ? -1 : 1) ||
      sevRank[x.severity] - sevRank[y.severity] ||
      y.weight - x.weight
    )
    .map((c) => c.id);

  return {
    engine: "wpai-deterministic-v1",
    pageType,
    overall,
    grade: gradeOf(overall),
    areas,
    radar,
    issues,
    checks,
    weights: { seo: 0.35, aeo: 0.35, geo: 0.30 },
  };
}
