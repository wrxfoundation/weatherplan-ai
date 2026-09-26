/* ============================================================
 * Pick AI · AI 성적표 진단 엔진 v2
 *
 * SEO · AEO · GEO · 확산(Reach) 결정론 체크 엔진 (순수 함수 — 네트워크 없음)
 * pages/api/scorecard.js 가 수집한 아티팩트를 받아 채점한다.
 *
 * 설계 원칙:
 * - 결정론 전용: 같은 입력이면 항상 같은 점수 (재현 가능)
 * - LLM 심사가 필요한 항목은 "manual"(평가 불가)로 두고 무료 점수에서
 *   제외한다 — FAIL로 위장하지 않는다. 정밀 진단(deep-scan)이 별도로 채운다
 * - 치명적(critical) 체크가 FAIL이면 해당 영역 점수 상한 40점
 * - 모든 체크에 일반인용 도움말(help)을 단다
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

/* ─── 정밀 진단(LLM 심사) 루브릭 — deep-scan API·UI가 공유 ─── */
export const DEEP_RUBRIC = [
  {
    key: "contentQuality", checkId: "content-quality-llm",
    label: "콘텐츠 품질 · AEO 준비도",
    desc: "콘텐츠의 깊이·독창성·답변 우선 구조",
  },
  {
    key: "answerDirectness", checkId: "answer-directness",
    label: "답변 직접성 · 자체완결성",
    desc: "각 섹션 첫 문장이 질문에 바로 답하는가",
  },
  {
    key: "intentFormat", checkId: "intent-format",
    label: "의도-포맷 일치",
    desc: "질문 의도별 최적 포맷(표·리스트·단답)을 쓰는가",
  },
  {
    key: "eeatLlm", checkId: "eeat-llm",
    label: "E-E-A-T 신호 (LLM)",
    desc: "경험·전문성·권위·신뢰의 서술적 근거",
  },
];

export function deepVerdict(score) {
  return score >= 70 ? "pass" : score >= 40 ? "warn" : "fail";
}

/* ═════════════════════════════════════════════════════════════
   robots.txt 파서 (RFC 9309 — 그룹 · 최장 일치 · * / $ 와일드카드)
   ═════════════════════════════════════════════════════════════ */

export function parseRobotsTxt(text) {
  const groups = [];
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
      if (!current) continue;
      current.rules.push({ type: field, path: value });
    }
  }
  return { groups, sitemaps };
}

function robotsPathMatch(pattern, path) {
  if (pattern === "") return false;
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
   HTML 경량 파서 (정규식 기반, 외부 의존성 0 — 서버·브라우저 공용)
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

/* 소셜 플랫폼 감지 테이블 */
/* AI 인용 소스 분포 (Semrush, AI 인용 15만 건 분석 · 2025.6):
   Reddit 40.1% · Wikipedia 26.3% · YouTube 23.5% · Google 23.3% · Medium 20.0%
   · Instagram 10.9% · LinkedIn 5.9% · Quora 4.6%
   커뮤니티(Reddit·Quora)가 1위 인용 소스인데 목록에 빠져 있어 추가한다.
   citedByAi 표시는 실제 AI 인용 상위 소스인지 여부 — 안내 문구에서 우선순위를 알려주는 데 쓴다. */
export const ENGINE_ID = "pickai-deterministic-v3";

const SOCIAL_PLATFORMS = [
  { key: "reddit",    label: "레딧",       re: /reddit\.com\//,  citedByAi: true },
  { key: "quora",     label: "쿠오라",     re: /quora\.com\//,   citedByAi: true },
  { key: "medium",    label: "미디엄",     re: /medium\.com\//,  citedByAi: true },
  { key: "instagram", label: "인스타그램", re: /instagram\.com\// },
  { key: "youtube",   label: "유튜브",     re: /youtube\.com\/|youtu\.be\//, citedByAi: true },
  { key: "facebook",  label: "페이스북",   re: /facebook\.com\// },
  { key: "x",         label: "X(트위터)",  re: /(^|\/\/)(www\.)?(x|twitter)\.com\// },
  { key: "linkedin",  label: "링크드인",   re: /linkedin\.com\// },
  { key: "naverblog", label: "네이버 블로그", re: /blog\.naver\.com\/|post\.naver\.com\// },
  { key: "threads",   label: "스레드",     re: /threads\.(net|com)\// },
  { key: "kakao",     label: "카카오 채널", re: /pf\.kakao\.com\// },
  { key: "tiktok",    label: "틱톡",       re: /tiktok\.com\// },
  { key: "telegram",  label: "텔레그램",   re: /t\.me\// },
];

/* 모호(헤지) 표현 —
   인용된 텍스트는 단정적 문체가 모호한 문체보다 1.8배 많다
   (Growth Memo / Gauge, ChatGPT 응답 120만 건 · 인용 18,012건 분석, 2026.2).

   주의: 한국어 "~할 수 있습니다"는 대부분 헤지가 아니라 기능·가능성 서술이다
   ("API로 데이터를 받을 수 있습니다"). 이걸 헤지로 세면 멀쩡한 제품 설명이
   전부 감점되므로 의도적으로 제외하고, 추측·완충 표현만 센다. */
const HEDGE_PATTERNS = [
  /것\s?같(습니다|다|아|은|았)/g,
  /것으로\s?(보입니다|보인다|보이며|예상)/g,
  /듯\s?(합니다|하다|하며|보입니다)/g,
  /(으?로|라고)\s?(추정|예상|여겨|판단|생각)(됩니다|된다|되며)/g,
  /수도\s?있(습니다|다|으며|는)/g,
  /* \b는 한글 뒤에서 동작하지 않는다. "아마추어·아마존" 오탐을 막으려면
     뒤에 한글이 오지 않는 경우만 센다. */
  /아마도(?![가-힣])/g,
  /아마(?=[\s,.])/g,
  /어쩌면/g,
  /일반적으로/g,
  /대체로/g,
  /대개/g,
  /\b(may|might|could)\s+(be|have|help|lead|result|vary)/gi,
  /\b(possibly|perhaps|arguably|presumably|somewhat|relatively)\b/gi,
  /\b(seems?|appears?)\s+to\b/gi,
  /\btends?\s+to\b/gi,
  /\b(generally|typically|usually)\b/gi,
];

export function countHedges(text) {
  const t = String(text || "");
  let n = 0;
  for (const re of HEDGE_PATTERNS) n += (t.match(re) || []).length;
  return n;
}

export function analyzeHtml(html) {
  const src = String(html || "");

  const bodyOnly = src
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const text = textOf(bodyOnly);
  const words = text ? text.split(/\s+/) : [];

  const titleM = src.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleM ? textOf(titleM[1]) : null;

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

  const links = [];
  for (const m of src.matchAll(/<link\b[^>]*>/gi)) links.push(parseAttrs(m[0]));
  const canonical = links.find((l) => (l.rel || "").toLowerCase().split(/\s+/).includes("canonical"))?.href ?? null;
  const favicon = links.some((l) => /(^|\s)(icon|shortcut icon|apple-touch-icon)(\s|$)/.test((l.rel || "").toLowerCase()));
  const rssLink = links.find((l) =>
    (l.rel || "").toLowerCase() === "alternate" &&
    /application\/(rss|atom)\+xml/i.test(l.type || "")
  )?.href ?? null;

  const htmlTagM = src.match(/<html\b[^>]*>/i);
  const lang = htmlTagM ? (parseAttrs(htmlTagM[0]).lang || null) : null;

  const headings = [];
  for (const m of src.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const t = textOf(m[2]);
    if (t) headings.push({ level: Number(m[1]), text: t.slice(0, 160) });
  }

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

  /* 조직명 추출 (위키백과 조회용) — Organization JSON-LD > og:site_name > title 앞토큰 */
  let orgName = null;
  for (const b of jsonld.filter((x) => x.ok)) {
    const find = (node) => {
      if (!node || typeof node !== "object") return null;
      if (Array.isArray(node)) { for (const n of node) { const r = find(n); if (r) return r; } return null; }
      const t = node["@type"];
      const types = typeof t === "string" ? [t] : Array.isArray(t) ? t : [];
      if (types.some((x) => /Organization|LocalBusiness|Corporation/i.test(x)) && typeof node.name === "string") {
        return node.name;
      }
      if (node["@graph"]) return find(node["@graph"]);
      return null;
    };
    orgName = find(b.data);
    if (orgName) break;
  }
  if (!orgName) orgName = metaBy("property", "og:site_name");
  if (!orgName && title) orgName = title.split(/[|·\-–—:]/)[0].trim();

  const images = [];
  for (const m of src.matchAll(/<img\b[^>]*>/gi)) images.push(parseAttrs(m[0]));
  const imgTotal = images.length;
  const imgWithAlt = images.filter((a) => (a.alt || "").trim().length > 0).length;
  const hasVideo = /<video\b|youtube\.com\/embed|player\.vimeo\.com/i.test(src);

  const anchors = [];
  for (const m of src.matchAll(/<a\b[^>]*href\s*=\s*("([^"]*)"|'([^']*)')[^>]*>([\s\S]*?)<\/a>/gi)) {
    anchors.push({ href: (m[2] ?? m[3] ?? "").trim(), text: textOf(m[4]).slice(0, 80) });
  }

  /* 소셜 채널 (앵커 + sameAs 문자열 전체에서 감지) */
  const sameAsBlob = jsonld.filter((b) => b.ok).map((b) => JSON.stringify(b.data)).join(" ");
  const linkBlob = anchors.map((a) => a.href).join(" ") + " " + sameAsBlob;
  const matchedPlatforms = SOCIAL_PLATFORMS.filter((p) => p.re.test(linkBlob));
  const socialPlatforms = matchedPlatforms.map((p) => p.label);
  /* AI가 실제로 많이 인용하는 소스(레딧·유튜브·미디엄·쿠오라)에 연결돼 있는지 */
  const aiCitedPlatforms = matchedPlatforms.filter((p) => p.citedByAi).map((p) => p.label);

  /* 뉴스레터/구독 장치 */
  const hasNewsletter =
    /(뉴스레터|newsletter)/i.test(text) ||
    (/type\s*=\s*["']email["']/i.test(src) && /(구독|subscribe|가입)/i.test(text)) ||
    /stibee\.com|mailchimp\.com|substack\.com/i.test(linkBlob);

  const hasAbout = anchors.some((a) => /about|company|회사\s*소개|기업\s*소개|소개/i.test(a.href + " " + a.text));
  const hasContact = anchors.some((a) => /contact|문의|상담|inquiry|support/i.test(a.href + " " + a.text)) ||
    anchors.some((a) => a.href.startsWith("mailto:") || a.href.startsWith("tel:"));
  const hasAuthor = /작성자|글쓴이|기자\b|editor|written by|by\s+[A-Z][a-z]+/i.test(text) ||
    metas.some((a) => (a.name || "").toLowerCase() === "author");
  const hasAddress = /사업자\s*등록\s*번호|대표이사|대표\s*:|주소\s*:|copyright|©/i.test(text);
  const dateMatches = text.match(/20\d{2}[.\-/년]\s?\d{1,2}[.\-/월]\s?\d{1,2}/g) || [];

  const primarySourceLinks = anchors.filter((a) =>
    /\.(go\.kr|or\.kr|re\.kr|ac\.kr|gov|edu|int)([/?#]|$)|wikipedia\.org|doi\.org|scholar\.google|data\.[a-z.]+/i.test(a.href)
  );

  const numberTokens = text.match(/\d[\d,.]*\s?(%|퍼센트|원|억|만|배|위|점|명|건|개|시간|분|℃|°C|km|kg|mm)?/g) || [];
  const statDensity = words.length > 0 ? +(numberTokens.length / words.length * 100).toFixed(2) : 0;

  /* 모호(헤지) 표현 밀도 — 100단어당 건수 */
  const hedgeCount = countHedges(text);
  const hedgeDensity = words.length > 0 ? +(hedgeCount / words.length * 100).toFixed(2) : 0;

  /* 문장 길이 (가독성) — lookbehind 미사용 (구형 Safari 호환) */
  const sentences = text.split(/[.!?。…]+["')\]]?\s+/).filter((s) => s.trim().length > 4);
  const avgSentenceWords = sentences.length > 0
    ? +(words.length / sentences.length).toFixed(1) : 0;

  const isQuestion = (t) =>
    /[?？]\s*$/.test(t) ||
    /^(왜|어떻게|무엇|뭐가|어디서?|언제|누가|얼마나|몇|어떤)/.test(t) ||
    /(까요|나요|을까|ㄹ까|인가요?|한가요?|될까|일까|는가)\s*[?？]?$/.test(t) ||
    /^(how|what|why|when|where|who|which|can|does|do(es)?|is|are|should)\b/i.test(t);
  const questionHeadings = headings.filter((h) => isQuestion(h.text));

  /* 구조화 블록 (리스트·표) — Princeton GEO 연구: 구조화 콘텐츠가 생성형 인용에 유리 */
  const listCount = (src.match(/<[uo]l\b/gi) || []).length;
  const tableCount = (src.match(/<table\b/gi) || []).length;

  /* 인용문 신호 — Princeton KDD 2024 "Quotation Addition" 레버 */
  const blockquoteCount = (src.match(/<blockquote\b/gi) || []).length;
  const attributedQuoteCount = (text.match(/(에 따르면|라고 말했|라고 밝혔|라고 전했|according to|, said |, says )/gi) || []).length;

  /* 답변 선행 배치 — Zyppy 2025: LLM 인용의 44.2%가 본문 앞 30%에서 발생 */
  let firstStatRatio = null;
  {
    const m = text.match(/\d[\d,.]*/);
    if (m && text.length > 0) firstStatRatio = +(m.index / text.length).toFixed(3);
  }

  /* 내부 링크 (발견 가능성) */
  const internalLinkCount = anchors.filter((a) => {
    const h = a.href;
    return h && !/^(https?:|mailto:|tel:|javascript:|#)/i.test(h);
  }).length;

  /* 다국어(hreflang) */
  const hasHreflang = links.some((l) =>
    (l.rel || "").toLowerCase() === "alternate" && !!l.hreflang);

  /* 검색 콘솔 소유 확인 메타 (네이버·구글) */
  const naverVerification = !!metaBy("name", "naver-site-verification");
  const googleVerification = !!metaBy("name", "google-site-verification");

  /* 지식그래프 연결 — sameAs에 위키데이터/위키백과 */
  const hasKnowledgeGraphLink = /wikidata\.org|wikipedia\.org/i.test(sameAsBlob);

  /* 프레임워크/빌더 감지 — AI 명령서 맞춤 지침용 */
  const gen = metaBy("name", "generator") || "";
  let framework = null;
  if (/wordpress/i.test(gen) || /wp-content\/|wp-json/i.test(src)) framework = "WordPress";
  else if (/id=["']__next["']|__NEXT_DATA__/.test(src)) framework = "Next.js";
  else if (/window\.__NUXT__|id=["']__nuxt["']/.test(src)) framework = "Nuxt";
  else if (/___gatsby/.test(src)) framework = "Gatsby";
  else if (/cafe24\.com|cafe24img|ec-concier/i.test(src)) framework = "카페24";
  else if (/imweb\.me|cdn\.imweb/i.test(src)) framework = "아임웹";
  else if (/modoo\.at/i.test(src)) framework = "모두(modoo)";
  else if (/sixshop/i.test(src)) framework = "식스샵";
  else if (/cdn\.shopify|shopify\.com/i.test(src)) framework = "Shopify";
  else if (/wixstatic\.com|wix\.com/i.test(src)) framework = "Wix";
  else if (/squarespace/i.test(gen + src.slice(0, 4000))) framework = "Squarespace";
  else if (gen) framework = gen.split(/\s+/)[0].slice(0, 30);

  const scriptCount = (src.match(/<script\b/gi) || []).length;
  const spaMarkers = /id=["'](root|app|__next|___gatsby)["'][^>]*>\s*<\/(div|main)>/i.test(src) ||
    /window\.__NUXT__|window\.__INITIAL_STATE__/.test(src);

  return {
    title, description, metaRobots, og, twitterCard, viewport, charset, lang,
    canonical, favicon, publishedTime, rssLink, orgName,
    headings, questionHeadings,
    jsonld, ldTypes, hasSameAs,
    imgTotal, imgWithAlt, hasVideo,
    anchors: anchors.length,
    socialPlatforms, aiCitedPlatforms, hasNewsletter,
    hasAbout, hasContact, hasAuthor, hasAddress,
    dateCount: dateMatches.length,
    primarySourceCount: primarySourceLinks.length,
    wordCount: words.length,
    hedgeCount, hedgeDensity,
    statDensity, numberCount: numberTokens.length,
    sentenceCount: sentences.length, avgSentenceWords,
    scriptCount, spaMarkers,
    listCount, tableCount, blockquoteCount, attributedQuoteCount,
    firstStatRatio, internalLinkCount, hasHreflang,
    naverVerification, googleVerification, hasKnowledgeGraphLink,
    framework,
  };
}

/* ═════════════════════════════════════════════════════════════
   채점
   ═════════════════════════════════════════════════════════════ */

const STATUS_SCORE = { pass: 1, warn: 0.5, fail: 0 };

export const AREA_WEIGHTS = { seo: 0.30, aeo: 0.30, geo: 0.25, reach: 0.15 };

export function gradeOf(score) {
  if (score >= 85) return "A";
  if (score >= 75) return "B";
  if (score >= 65) return "C";
  if (score >= 50) return "D";
  return "F";
}

function koreanLen(s) {
  return [...String(s || "")].length;
}

/* artifacts:
   {
     url, finalUrl, host, path, scheme, status, redirects, responseMs,
     tlsValid, tlsError, mixedContentCount, xRobotsTag,
     parsed (analyzeHtml 결과), robots { found, parsed, sitemaps },
     llmsTxtFound, sitemapXml { checked, ok, status },
     rssProbe { checked, found },
     wikipedia { checked, exact, hits, brand },
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
    help: "사이트 주소를 입력했을 때 서버가 정상 응답(200)을 주는지, 몇 번이나 다른 주소로 튕기는지(리다이렉트) 봅니다. 여러 번 튕기면 사람도 로봇도 도착이 느려집니다.",
    status: a.status >= 200 && a.status < 300
      ? (a.redirects <= 1 ? "pass" : "warn")
      : "fail",
    summary: a.status >= 200 && a.status < 300
      ? `${a.status} OK${a.redirects ? ` (리다이렉트 ${a.redirects}회)` : ""} — 크롤러가 정상 도달합니다.`
      : a.status >= 300 && a.status < 400
        ? `리다이렉트가 ${a.redirects}회가 넘도록 끝나지 않습니다${a.redirectLoop ? " (루프 감지)" : ""} — 크롤러가 콘텐츠에 도달하지 못합니다. www↔비-www·http↔https 리다이렉트 설정 오류가 가장 흔한 원인입니다.`
        : `최종 상태 ${a.status || "도달 실패"} — 크롤러가 콘텐츠에 도달하지 못합니다.`,
    details: [
      { k: "최종 상태", v: String(a.status || "-") },
      { k: "리다이렉트", v: `${a.redirects}회` },
      { k: "응답 시간", v: `${a.responseMs}ms` },
    ],
    passRule: "2xx이며 리다이렉트 1회 이하일 때 통과",
    fix: (a.status >= 300 && a.status < 400) ? {
      title: "리다이렉트 루프/과다 체인 해소",
      action: "정리",
      note: "www↔비-www, http↔https가 서로를 가리키면 루프가 됩니다. 최종 대표 주소 하나를 정하고, 나머지는 전부 그 주소로 단 한 번의 301이 되게 정리하세요.",
      code: `# 대표 주소를 https://example.com 하나로 통일 (nginx 예시)\nserver { listen 80; server_name example.com www.example.com;\n  return 301 https://example.com$request_uri; }\nserver { listen 443 ssl; server_name www.example.com;\n  return 301 https://example.com$request_uri; }`,
    } : a.redirects > 1 ? {
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
      help: "주소창의 자물쇠(https)가 제대로 걸려 있는지 봅니다. 자물쇠가 깨져 있으면 방문자에게 '안전하지 않음' 경고가 뜨고, 검색 순위도 내려갑니다.",
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
      help: "robots.txt는 검색 로봇에게 '들어와도 됨/안 됨'을 알리는 안내문입니다. 실수로 전체 차단이 걸려 있으면 검색에서 사이트가 통째로 사라집니다.",
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
      help: "페이지 안에 '검색 결과에 올리지 마세요(noindex)'라는 숨은 표시가 있는지 봅니다. 개발 중에 넣었다가 지우는 걸 잊는 경우가 의외로 많습니다.",
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
      help: "브라우저 탭과 검색 결과에 뜨는 페이지 제목입니다. 너무 짧으면 무슨 사이트인지 알 수 없고, 너무 길면 잘립니다. '핵심 키워드 + 브랜드명' 조합이 정석입니다.",
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
      help: "검색 결과에서 제목 아래 나오는 요약문입니다. 이게 없으면 검색엔진이 아무 문장이나 잘라서 보여주고, 클릭률이 떨어집니다.",
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
      help: "같은 페이지가 여러 주소(www 유무, ?파라미터 등)로 열릴 때 '이게 진짜 주소'라고 알려주는 표시입니다. 없으면 검색 점수가 여러 주소로 쪼개집니다.",
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
      help: "제목(H1)과 소제목(H2, H3)이 목차처럼 정리돼 있는지 봅니다. 책에 큰 제목이 없거나 챕터 번호가 뒤죽박죽이면 읽기 어려운 것과 같습니다.",
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
      help: "구조화 데이터는 '우리는 이런 회사고 이 페이지는 이런 내용'이라고 기계가 읽기 쉽게 정리한 명함입니다. 문법이 하나라도 틀리면 명함 전체가 무시됩니다.",
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
      help: "사이트맵은 우리 사이트의 전체 페이지 목록표입니다. robots.txt에 위치를 적어두면 검색 로봇이 새 페이지를 훨씬 빨리 찾아냅니다.",
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
      help: "'이 사이트 뒤에 진짜 회사/사람이 있는가'를 보여주는 신호입니다. 회사 소개·문의처·사업자 정보가 있으면 검색엔진과 AI 모두 더 신뢰합니다.",
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
      help: "일부 사이트는 자바스크립트를 실행해야만 내용이 보입니다. 그런데 AI 봇 상당수는 자바스크립트를 실행하지 않아서, 그런 사이트는 빈 종이로 보입니다.",
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
    const items = [
      ["viewport", !!p.viewport], ["charset", !!p.charset],
      ["html lang", !!p.lang], ["favicon", !!p.favicon],
    ];
    const okCount = items.filter(([, v]) => v).length;
    add({
      id: "basic-meta", area: "seo", severity: "low", weight: 1,
      label: "기본 위생 (viewport · charset · lang · favicon)",
      help: "모바일 화면 대응, 글자 깨짐 방지, 언어 표시, 탭 아이콘 — 웹사이트의 기본 예의 4종 세트입니다. 하나라도 빠지면 어딘가에서 어색하게 보입니다.",
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
    help: "블로그·뉴스형 페이지는 '언제 쓴 글인지'가 중요합니다. 회사 홈처럼 날짜가 원래 없는 페이지는 평가에서 제외합니다.",
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

  {
    const reachable = a.status >= 200 && a.status < 300;
    const ms = a.responseMs || 0;
    add({
      id: "response-speed", area: "seo", severity: "low", weight: 1,
      label: "응답 속도 (서버 TTFB 근사)",
      help: "AI 수집 로봇은 기다려주지 않습니다 — 응답이 느린 사이트는 수집을 중도 포기하는 경우가 많습니다. 첫 응답이 오기까지 걸린 시간을 봅니다.",
      status: !reachable ? "na" : ms <= 1500 ? "pass" : ms <= 3000 ? "warn" : "fail",
      summary: !reachable
        ? "도달 실패 상태라 속도 평가를 제외합니다."
        : ms <= 1500
          ? `첫 응답 ${ms}ms — 크롤러가 쾌적하게 수집할 수 있는 속도입니다.`
          : ms <= 3000
            ? `첫 응답 ${ms}ms — 느린 편입니다. 크롤 빈도가 줄 수 있습니다.`
            : `첫 응답 ${ms}ms — 매우 느립니다. AI 크롤러가 수집을 포기할 수 있습니다.`,
      details: [
        { k: "측정 응답 시간", v: `${ms}ms` },
        { k: "권장", v: "1,500ms 이하" },
      ],
      passRule: "첫 응답 1,500ms 이하일 때 통과 (네트워크 상황에 따라 변동 가능한 참고 지표)",
      fix: (!reachable || ms <= 1500) ? null : {
        title: "서버 응답 가속",
        action: "정리",
        note: "CDN 캐싱, 서버 사이드 캐시, 불필요한 리다이렉트 제거가 가장 효과적입니다.",
        code: null,
      },
    });
  }

  {
    const h = a.headers || {};
    const compressed = /gzip|br|deflate|zstd/i.test(h.contentEncoding || "");
    const cacheable = !!(h.cacheControl || h.etag || h.lastModified);
    const okCount = [compressed, cacheable].filter(Boolean).length;
    add({
      id: "crawl-efficiency", area: "seo", severity: "low", weight: 1,
      label: "크롤 효율 (압축 · 캐시 헤더)",
      help: "압축 전송과 캐시 헤더는 크롤러가 같은 예산으로 더 많은 페이지를 가져가게 해줍니다. 크롤 예산이 아껴질수록 사이트 전체가 더 자주, 더 깊게 수집됩니다.",
      status: a.status >= 200 && a.status < 300
        ? (okCount === 2 ? "pass" : okCount === 1 ? "warn" : "fail")
        : "na",
      summary: !(a.status >= 200 && a.status < 300)
        ? "도달 실패 상태라 평가를 제외합니다."
        : okCount === 2
          ? "압축 전송과 캐시 헤더가 모두 있어 크롤 효율이 좋습니다."
          : okCount === 1
            ? `${compressed ? "압축은 되지만 캐시 헤더가 없습니다" : "캐시 헤더는 있지만 압축 전송이 확인되지 않습니다"} — 나머지 하나를 보강하세요.`
            : "압축·캐시 헤더가 모두 확인되지 않습니다 — 크롤 예산이 낭비됩니다.",
      details: [
        { k: "Content-Encoding", v: h.contentEncoding || "(없음)" },
        { k: "Cache-Control", v: h.cacheControl ? h.cacheControl.slice(0, 40) : "(없음)" },
        { k: "ETag / Last-Modified", v: (h.etag || h.lastModified) ? "있음" : "없음" },
      ],
      passRule: "압축 전송 + 캐시 헤더(Cache-Control·ETag·Last-Modified 중 1개) 둘 다 있을 때 통과",
      fix: okCount === 2 ? null : {
        title: "압축·캐시 헤더 활성화",
        action: "추가",
        code: `# nginx 예시\ngzip on;\ngzip_types text/html text/css application/javascript application/json;\nadd_header Cache-Control "public, max-age=3600";`,
      },
    });
  }

  {
    const nv = p.naverVerification;
    const gv = p.googleVerification;
    add({
      id: "verification-meta", area: "seo", severity: "low", weight: 1,
      label: "검색 콘솔 연동 신호 (네이버 · 구글)",
      help: "네이버 서치어드바이저·구글 서치콘솔에 사이트를 등록하면 소유 확인 메타 태그가 남습니다. 이 태그는 '검색 성과를 실제로 관리하는 사이트'라는 운영 신호이자, 색인 요청·오류 확인의 출발점입니다.",
      status: (nv && gv) ? "pass" : (nv || gv) ? "warn" : "fail",
      summary: nv && gv
        ? "네이버·구글 검색 콘솔 소유 확인이 모두 있습니다 — 색인을 능동 관리 중입니다."
        : (nv || gv)
          ? `${nv ? "네이버만" : "구글만"} 연동되어 있습니다 — ${nv ? "구글 서치콘솔" : "네이버 서치어드바이저"}도 등록하세요.`
          : "검색 콘솔 소유 확인 메타가 없습니다 — 색인 상태를 확인·요청할 채널이 없습니다.",
      details: [
        { k: "naver-site-verification", v: nv ? "있음" : "없음" },
        { k: "google-site-verification", v: gv ? "있음" : "없음" },
      ],
      passRule: "네이버·구글 소유 확인 메타가 모두 있을 때 통과",
      fix: (nv && gv) ? null : {
        title: "검색 콘솔 등록",
        action: "추가",
        note: "네이버 서치어드바이저와 구글 서치콘솔에서 발급받은 메타 태그를 <head>에 넣으세요.",
        code: `<meta name="naver-site-verification" content="발급받은 코드">\n<meta name="google-site-verification" content="발급받은 코드">`,
      },
    });
  }

  {
    const n = p.internalLinkCount || 0;
    const reachable = a.status >= 200 && a.status < 300;
    add({
      id: "internal-links", area: "seo", severity: "low", weight: 1,
      label: "내부 링크 구조",
      help: "크롤러는 링크를 타고 사이트를 발견합니다. 페이지 안에 내부 링크가 충분해야 다른 페이지들도 수집·색인됩니다.",
      status: !reachable ? "na" : n >= 10 ? "pass" : n >= 3 ? "warn" : "fail",
      summary: !reachable
        ? "도달 실패 상태라 평가를 제외합니다."
        : n >= 10
          ? `내부 링크 ${n}개 — 크롤러가 사이트 구조를 잘 발견할 수 있습니다.`
          : n >= 3
            ? `내부 링크가 ${n}개로 적습니다 — 주요 페이지로 가는 링크를 보강하세요.`
            : `내부 링크가 ${n}개뿐입니다 — 크롤러가 다른 페이지를 발견할 경로가 없습니다.`,
      details: [
        { k: "내부 링크 수", v: `${n}개` },
      ],
      passRule: "내부 링크 10개 이상일 때 통과",
      fix: (!reachable || n >= 10) ? null : {
        title: "내비게이션·푸터 내부 링크 보강",
        action: "추가",
        code: `<nav>\n  <a href="/products">제품</a>\n  <a href="/pricing">가격</a>\n  <a href="/blog">블로그</a>\n  <a href="/about">회사 소개</a>\n</nav>`,
      },
    });
  }

  add({
    id: "cwv", area: "seo", severity: "high", weight: 0,
    label: "Core Web Vitals (랩 측정)",
    help: "페이지가 뜨는 속도와 클릭 반응 속도입니다. 별도 성능 측정 장비(PSI)가 필요해 이 무료 진단에는 포함되지 않습니다.",
    status: "manual",
    summary: "무료 결정론 진단에서는 PSI를 호출하지 않습니다 (재현성·속도 보장) — 로드맵 항목입니다.",
    details: [
      { k: "LCP 임계값", v: "≤ 2500ms" },
      { k: "INP 임계값", v: "≤ 200ms" },
      { k: "CLS 임계값", v: "≤ 0.1" },
    ],
    passRule: "비동기 랩 측정 레인 (로드맵)",
    fix: null,
  });

  add({
    id: "content-quality-llm", area: "seo", severity: "high", weight: 0,
    label: "콘텐츠 품질 · AEO 준비도 (LLM 심사)",
    help: "글의 깊이와 독창성, '질문에 먼저 답하는 구조'인지를 AI 심사위원이 읽고 평가합니다. 아래 정밀 진단을 실행하면 채워집니다.",
    status: "manual",
    summary: "콘텐츠 깊이·독창성·답변 우선 구조는 LLM이 심사합니다 — 정밀 진단(무료 베타)을 실행하면 채워집니다.",
    details: [
      { k: "본문 단어 수", v: String(p.wordCount || 0) },
      { k: "섹션 수", v: String((p.headings || []).length) },
    ],
    passRule: "LLM 심사 점수 70 이상일 때 통과 (정밀 진단)",
    fix: null,
  });

  /* ── AEO ─────────────────────────────────────── */

  {
    const qn = (p.questionHeadings || []).length;
    const total = (p.headings || []).length;
    add({
      id: "question-headings", area: "aeo", severity: "high", weight: 2.5,
      label: "질문형 헤딩",
      help: "사람들이 AI에게 묻는 문장('~은 어떻게 하나요?')을 소제목으로 그대로 쓰면, AI가 그 아래 답을 통째로 인용하기 쉬워집니다.",
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
        code: `<h2>서비스 도입은 어떻게 시작하나요?</h2>\n<p>핵심 답변을 첫 문장에 — 근거와 수치는 그 다음에.</p>`,
      },
    });
  }

  {
    const entity = (p.ldTypes || []).some((t) => /Organization|Person|LocalBusiness|Corporation/i.test(t));
    add({
      id: "entity-schema", area: "aeo", severity: "high", weight: 2.5,
      label: "엔티티 스키마 (Organization/Person + sameAs)",
      help: "AI에게 '우리 회사는 이런 조직이고, 공식 유튜브·블로그는 여기'라고 신원을 등록하는 것입니다. 이게 있어야 AI가 브랜드를 하나의 실체로 인식합니다.",
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
      help: "'자주 묻는 질문'이나 '따라하기 단계'를 기계가 읽는 형식으로 한 번 더 정리해 두는 것입니다. AI가 Q&A를 그대로 발췌하기 가장 쉬운 형태입니다.",
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
      help: "AI는 소제목 단위로 내용을 잘라 답변에 씁니다. 소제목 층위가 정리돼 있어야 '이 질문의 답은 이 단락'이라고 정확히 집어낼 수 있습니다.",
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
      /* SEO의 "헤딩 구조"와 같은 원인을 보지만, 조치가 비어 있으면
         명령서를 받은 쪽이 이 항목만 손댈 방법이 없어 안내를 붙인다. */
      fix: hasH1 && !skip ? null : {
        title: "헤딩 위계 정리 (SEO '헤딩 구조'와 함께 처리)",
        action: "정리",
        note: "H1을 하나 두고 레벨을 건너뛰지 않게 정리하면 이 항목도 함께 해소됩니다. "
          + "AEO 관점에서는 각 H2가 '하나의 질문 = 하나의 답변 블록'이 되도록 끊는 것이 핵심입니다.",
        code: `<h1>페이지 핵심 주제</h1>\n  <h2>질문형 소제목 1</h2>\n  <p>바로 이어지는 직접 답변.</p>\n  <h2>질문형 소제목 2</h2>`,
      },
    });
  }

  {
    const avg = p.avgSentenceWords || 0;
    const enough = (p.wordCount || 0) >= 60;
    add({
      id: "readability", area: "aeo", severity: "medium", weight: 2,
      label: "가독성 점수",
      help: "문장이 길수록 사람도 AI도 요점을 집어내기 어렵습니다. '한 문장 = 한 주장'으로 짧게 끊는 것이 발췌되기 좋은 글입니다.",
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
      fix: avg <= 25 && enough ? null : !enough ? {
        title: "판정할 본문부터 확보",
        action: "추가",
        note: "본문이 너무 짧아 가독성을 잴 수 없습니다. 문장을 고치기 전에 raw HTML에 실제 본문이 담기게 하는 것이 먼저입니다 "
          + "(JS로만 그려지는 페이지라면 'JS 렌더링 콘텐츠 갭' 항목을 먼저 처리하세요).",
        code: null,
      } : {
        title: "문장 분할",
        action: "재작성",
        note: "한 문장 = 한 주장. 접속사로 이어진 긴 문장을 마침표로 끊으세요.",
        code: null,
      },
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
      help: "누가 언제 썼고 근거는 무엇인지 — AI가 '믿고 인용해도 되는 글'인지 가리는 기준입니다. 저자·날짜·출처 링크가 그 증거입니다.",
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

  {
    const blocks = (p.listCount || 0) + (p.tableCount || 0);
    const enough = (p.wordCount || 0) >= 100;
    add({
      id: "structured-blocks", area: "aeo", severity: "medium", weight: 1.5,
      label: "구조화 블록 (리스트 · 표)",
      help: "AI는 긴 문단보다 목록과 표를 훨씬 잘 발췌합니다. GEO 연구(Princeton, KDD 2024)에서도 구조화된 콘텐츠가 생성형 답변에 더 잘 인용되는 것으로 확인됐습니다.",
      status: blocks >= 3 ? "pass" : blocks >= 1 ? "warn" : enough ? "fail" : "warn",
      summary: blocks >= 3
        ? `리스트·표 ${blocks}개 — AI가 발췌하기 좋은 구조화 콘텐츠입니다.`
        : blocks >= 1
          ? `리스트·표가 ${blocks}개뿐입니다 — 나열형 정보를 목록·표로 더 바꿔보세요.`
          : enough
            ? "리스트·표가 전혀 없습니다 — 전부 서술형 문단이면 AI가 발췌하기 어렵습니다."
            : "본문이 적어 보수적으로 평가합니다 — 콘텐츠를 늘릴 때 목록·표 구조를 쓰세요.",
      details: [
        { k: "리스트(ul/ol)", v: `${p.listCount || 0}개` },
        { k: "표(table)", v: `${p.tableCount || 0}개` },
      ],
      passRule: "리스트·표 합계 3개 이상일 때 통과",
      fix: blocks >= 3 ? null : {
        title: "나열 정보를 목록·표로 전환",
        action: "재작성",
        note: "제품 비교는 표로, 절차·특징은 번호/불릿 목록으로 바꾸세요.",
        code: `<ul>\n  <li>특징 1 — 구체적 수치 포함</li>\n  <li>특징 2 — 구체적 수치 포함</li>\n</ul>`,
      },
    });
  }

  {
    const wc = p.wordCount || 0;
    const d = p.hedgeDensity || 0;
    const n = p.hedgeCount || 0;
    /* 본문이 너무 짧으면 밀도가 요동친다 — 판정하지 않는다 */
    const status = wc < 120 ? "na" : d <= 1.0 ? "pass" : d <= 2.5 ? "warn" : "fail";
    add({
      id: "definitive-tone", area: "aeo", severity: "medium", weight: 1.5,
      label: "단정적 문체 (모호 표현 밀도)",
      help: "AI는 '~일 수도 있습니다', '일반적으로' 같은 얼버무리는 문장보다 '~이다', '~를 뜻한다'처럼 딱 잘라 말하는 문장을 훨씬 자주 인용합니다. 본문에 추측성 표현이 얼마나 섞여 있는지 재는 항목입니다.",
      status,
      summary: wc < 120
        ? "본문이 짧아 문체를 판정하지 않았습니다 (120단어 이상부터 측정)."
        : status === "pass"
          ? `모호 표현이 100단어당 ${d}건으로 적습니다 — 단정적으로 서술되어 인용되기 좋습니다.`
          : status === "warn"
            ? `모호 표현이 100단어당 ${d}건입니다 — 추측성 문장을 단정형으로 바꾸면 인용 확률이 올라갑니다.`
            : `모호 표현이 100단어당 ${d}건으로 많습니다 — AI가 근거로 쓰기 어려운 얼버무리는 문체입니다.`,
      details: [
        { k: "모호 표현", v: wc < 120 ? "(측정 안 함)" : `${n}건 · 100단어당 ${d}건` },
        { k: "권장", v: "100단어당 1건 이하" },
        { k: "근거", v: "단정적 문체 1.8배 더 인용 (인용 18,012건 분석, 2026)" },
      ],
      passRule: "본문 120단어 이상이고 모호 표현이 100단어당 1건 이하일 때 통과",
      fix: status === "pass" || status === "na" ? null : {
        title: "추측성 표현을 단정형으로",
        action: "수정",
        note: "사실인 것은 사실로 쓰세요. 근거가 있으면 수치와 출처를 붙여 단정하고, 정말 불확실한 것만 조건을 명시하세요. "
          + "다만 확인되지 않은 것을 단정하라는 뜻은 아닙니다 — 모르는 것은 빼거나 근거를 만들어 붙이는 쪽이 맞습니다.",
        code: `<!-- 이렇게 쓰지 말고 -->\n<p>이 방법은 일반적으로 효과가 있을 수도 있습니다.</p>\n\n<!-- 이렇게 -->\n<p>이 방법은 도입 3개월 만에 응답 시간을 40% 줄였습니다. (2026년 자체 측정, 132개 지점)</p>`,
      },
    });
  }

  {
    const r = p.firstStatRatio;
    const hasStats = (p.numberCount || 0) > 0;
    add({
      id: "answer-position", area: "aeo", severity: "medium", weight: 1.5,
      label: "답변 선행 배치 (핵심 정보의 위치)",
      help: "LLM 인용의 44.2%가 본문 앞 30% 구간에서 나온다는 분석(Zyppy, 2025)이 있습니다. 결론과 핵심 수치를 서두에 두면 인용 확률이 크게 올라갑니다.",
      status: !hasStats ? "fail" : r != null && r <= 0.3 ? "pass" : r != null && r <= 0.6 ? "warn" : "fail",
      summary: !hasStats
        ? "본문에 수치가 없어 선행 배치를 평가할 수 없습니다 — 우선 핵심 수치부터 넣으세요."
        : r <= 0.3
          ? `첫 번째 수치가 본문 앞 ${Math.round(r * 100)}% 지점에 등장합니다 — 인용되기 좋은 배치입니다.`
          : r <= 0.6
            ? `첫 번째 수치가 본문 ${Math.round(r * 100)}% 지점에야 등장합니다 — 핵심 정보를 서두로 끌어올리세요.`
            : `핵심 수치가 본문 후반(${Math.round(r * 100)}% 지점)에 있습니다 — AI는 대부분 앞부분만 발췌합니다.`,
      details: [
        { k: "첫 수치 등장 위치", v: r != null ? `본문 ${Math.round(r * 100)}% 지점` : "(수치 없음)" },
        { k: "권장", v: "앞 30% 이내" },
      ],
      passRule: "첫 번째 수치가 본문 앞 30% 이내에 등장할 때 통과",
      fix: (hasStats && r != null && r <= 0.3) ? null : {
        title: "핵심 결론·수치를 서두로 이동",
        action: "재작성",
        note: "첫 문단에서 결론과 대표 수치를 먼저 말하고, 배경 설명은 그 뒤로 미루세요.",
        code: `<!-- 첫 문단 예시 -->\n<p>도입 기업 132곳의 재계약률은 91%입니다.\n이 성과의 배경에는 세 가지 이유가 있습니다.</p>`,
      },
    });
  }

  add({
    id: "intent-format", area: "aeo", severity: "medium", weight: 0,
    label: "의도-포맷 일치 (LLM)",
    help: "비교 질문에는 표, 절차 질문에는 번호 목록 — 질문 종류에 맞는 형식을 쓰는지 AI 심사위원이 봅니다. 정밀 진단을 실행하면 채워집니다.",
    status: "manual",
    summary: "질문 의도별 최적 포맷(표·리스트·단답) 일치는 LLM 심사 항목입니다 — 정밀 진단(무료 베타)에서 평가됩니다.",
    details: [],
    passRule: "LLM 심사 점수 70 이상일 때 통과 (정밀 진단)",
    fix: null,
  });

  add({
    id: "answer-directness", area: "aeo", severity: "medium", weight: 0,
    label: "답변 직접성 · 자체완결성 (LLM)",
    help: "소제목 아래 첫 문장이 바로 결론부터 말하는지 봅니다. 뜸 들이는 글은 AI가 발췌하기 어렵습니다. 정밀 진단을 실행하면 채워집니다.",
    status: "manual",
    summary: "섹션 첫 문장이 질문에 바로 답하는지는 LLM 심사 항목입니다 — 정밀 진단(무료 베타)에서 평가됩니다.",
    details: [],
    passRule: "LLM 심사 점수 70 이상일 때 통과 (정밀 진단)",
    fix: null,
  });

  add({
    id: "eeat-llm", area: "aeo", severity: "medium", weight: 0,
    label: "E-E-A-T 신호 (LLM 심사)",
    help: "표기상 신호를 넘어, 글 내용 자체가 실제 경험과 전문성을 보여주는지 AI 심사위원이 읽고 평가합니다. 정밀 진단을 실행하면 채워집니다.",
    status: "manual",
    summary: "경험·전문성·권위·신뢰의 서술적 근거는 LLM 심사 항목입니다 — 정밀 진단(무료 베타)에서 평가됩니다.",
    details: [],
    passRule: "LLM 심사 점수 70 이상일 때 통과 (정밀 진단)",
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
      help: "AI는 '많이 좋아졌습니다'보다 '132곳에서 91%'처럼 숫자와 출처가 있는 문장을 골라 인용합니다. 본문에 수치가 얼마나 촘촘한지 재는 항목입니다.",
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
    const citeTypes = (p.ldTypes || []).filter((t) => /Article|FAQPage|Organization|Dataset|Report|HowTo|Product|Review|AggregateRating|VideoObject|Speakable/i.test(t));
    const hasAny = (p.jsonld || []).some((b) => b.ok);
    add({
      id: "citation-schema", area: "geo", severity: "high", weight: 2,
      label: "인용 관련 JSON-LD 스키마 타입",
      help: "생성형 AI가 답변 아래 '출처 카드'를 달 때 참고하는 구조화 정보입니다. Article·FAQ·Organization 타입이 선언돼 있으면 출처로 뽑히기 쉽습니다.",
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
       (3xx 리다이렉트 응답은 차단으로 세지 않음) */
    const reachable = a.status >= 200 && a.status < 300;
    const liveBlocked = reachable
      ? bots.filter((b) => b.live?.ran && b.live.ok === false && !b.live.redirect && b.robotsAllowed)
      : [];
    /* 사이트 자체가 도달 불가면 robots가 허용이어도 봇은 본문을 못 가져간다 — 개방성 100점 모순 방지 */
    const status = !reachable
      ? "fail"
      : searchBlocked.length > 0 || liveBlocked.some((b) => b.kind === "search")
        ? "fail" : trainBlocked.length > 0 ? "warn" : "pass";
    add({
      id: "ai-crawler-access", area: "geo", severity: "critical", weight: 3,
      label: "AI 크롤러 접근성 (GPTBot · ClaudeBot · PerplexityBot …)",
      help: "ChatGPT·Claude·Perplexity의 수집 로봇이 우리 사이트에 들어올 수 있는지 봅니다. 검색용 봇을 막아두면 AI 답변에 인용될 길 자체가 끊깁니다.",
      status,
      summary: !reachable
        ? `robots.txt 기준 ${bots.filter((b) => b.robotsAllowed).length}/${bots.length}개 봇이 허용이지만, 사이트 자체가 도달 불가(HTTP ${a.status || "실패"}) 상태라 AI 봇도 본문을 수집할 수 없습니다 — HTTP 상태 문제부터 해결해야 개방성이 의미를 갖습니다.`
        : status === "pass"
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
    help: "llms.txt는 AI 전용 사이트 안내문(신생 표준)입니다. 아직 필수는 아니지만, 있으면 '우리는 AI 친화적'이라는 선도 신호가 됩니다.",
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
      help: "alt 텍스트는 이미지에 붙이는 설명문입니다. AI는 이미지를 이 설명으로 이해하므로, alt가 없는 이미지는 AI에게 투명 인간입니다.",
      status,
      summary: total === 0 && !p.hasVideo
        ? "이미지·영상이 없습니다 — 멀티모달 인용 기회가 없습니다."
        : status === "fail"
          ? `이미지 ${total - withAlt}개에 alt 텍스트가 없습니다 — AI가 이미지 내용을 이해하지 못합니다.`
          : status === "warn"
            ? `alt 커버리지 ${Math.round(ratio * 100)}% — 누락 이미지에 alt를 채우세요.`
            : total === 0
              ? "영상이 있어 멀티모달 인용 기회는 있습니다 — 이미지를 더하면 폭이 넓어집니다."
              : `이미지 ${total}개 · alt 커버리지 ${Math.round(ratio * 100)}%${p.hasVideo ? " · 영상 있음" : ""} — 양호합니다.`,
      details: [
        { k: "이미지", v: `${total}개` },
        /* 이미지가 0개면 커버리지 100%는 의미가 없다 — "0개 (100%)"로 보이면 오히려 오해를 준다 */
        { k: "alt 보유", v: total > 0 ? `${withAlt}개 (${Math.round(ratio * 100)}%)` : "해당 없음 (이미지 없음)" },
        { k: "영상", v: p.hasVideo ? "있음" : "없음" },
      ],
      passRule: "alt 커버리지 70% 이상일 때 통과",
      fix: status === "pass" ? null : {
        title: "이미지 alt 텍스트 채우기",
        action: "추가",
        note: "장식용이 아닌 모든 이미지에 내용을 설명하는 alt를 넣으세요.",
        code: `<img src="/chart.png" alt="2026년 상반기 도입 기업 수 추이 — 1월 40곳에서 6월 132곳으로 증가">`,
      },
    });
  }

  {
    const bq = p.blockquoteCount || 0;
    const att = p.attributedQuoteCount || 0;
    add({
      id: "quotation", area: "geo", severity: "medium", weight: 1.5,
      label: "인용문 · 전문가 발언",
      help: "GEO 원조 연구(Princeton, KDD 2024)가 확인한 3대 인용 레버 중 하나가 '인용문 추가'입니다. 출처가 달린 전문가 발언·인용문이 있는 콘텐츠는 생성형 답변에 인용될 확률이 최대 40%까지 올라갑니다.",
      status: (bq >= 1 || att >= 2) ? "pass" : att >= 1 ? "warn" : "fail",
      summary: bq >= 1 || att >= 2
        ? `인용 블록 ${bq}개 · 출처 표기 발언 ${att}건 — 생성형 엔진이 신뢰하는 인용 구조입니다.`
        : att >= 1
          ? "출처 표기 발언이 1건 있습니다 — 전문가 인용을 더 보강하세요."
          : "출처가 달린 인용문·전문가 발언이 없습니다 — GEO 3대 인용 레버 중 하나가 비어 있습니다.",
      details: [
        { k: "blockquote", v: `${bq}개` },
        { k: "출처 표기 발언(에 따르면 등)", v: `${att}건` },
      ],
      passRule: "인용 블록 1개 이상 또는 출처 표기 발언 2건 이상일 때 통과",
      fix: (bq >= 1 || att >= 2) ? null : {
        title: "출처 있는 인용문 추가",
        action: "재작성",
        note: "권위자·기관의 발언을 실명 출처와 함께 인용하세요.",
        code: `<blockquote>\n  "구체적 발언 내용" — 홍길동, ○○협회 회장 (2026)\n</blockquote>\n<p>○○연구원 보고서에 따르면 도입 효과는 평균 18%였습니다.</p>`,
      },
    });
  }

  {
    const kg = p.hasKnowledgeGraphLink;
    add({
      id: "knowledge-graph", area: "geo", severity: "low", weight: 1,
      label: "지식그래프 연결 (Wikidata · 위키백과 sameAs)",
      help: "sameAs에 위키데이터·위키백과 문서를 연결하면 구글 지식그래프와 AI가 브랜드를 공인된 엔티티로 확정하는 데 도움이 됩니다. 소셜 링크보다 한 단계 강한 신원 증명입니다.",
      status: kg ? "pass" : p.hasSameAs ? "warn" : "fail",
      summary: kg
        ? "sameAs에 위키데이터/위키백과 연결이 있습니다 — 엔티티 신원이 가장 강한 형태로 선언되어 있습니다."
        : p.hasSameAs
          ? "sameAs는 있지만 위키데이터/위키백과 연결이 없습니다 — 등재되어 있다면 반드시 연결하세요."
          : "sameAs 자체가 없어 지식그래프 연결도 없습니다.",
      details: [
        { k: "Wikidata/위키백과 sameAs", v: kg ? "있음" : "없음" },
        { k: "sameAs", v: p.hasSameAs ? "있음" : "없음" },
      ],
      passRule: "sameAs에 위키데이터 또는 위키백과 URL이 있을 때 통과",
      fix: kg ? null : {
        title: "지식그래프 sameAs 연결",
        action: "추가",
        note: "위키데이터에 브랜드 항목이 있다면 그 URL을, 없다면 우선 소셜 채널을 유지하며 3자 출처를 쌓으세요.",
        code: `"sameAs": [\n  "https://www.wikidata.org/wiki/Q000000",\n  "https://ko.wikipedia.org/wiki/브랜드명"\n]`,
      },
    });
  }

  add({
    id: "citation-rate", area: "geo", severity: "high", weight: 0,
    label: "실제 AI 인용률",
    help: "ChatGPT·Perplexity에 실제 질문을 여러 번 던져 우리 사이트가 답변 출처로 등장하는 비율을 재는 항목입니다. 반복 측정 인프라가 필요해 로드맵에 있습니다.",
    status: "manual",
    summary: "여러 생성형 엔진에서 이 페이지가 실제로 인용되는 비율은 반복 프로빙으로 측정합니다 — 로드맵 항목입니다.",
    details: [],
    passRule: "GEO 인용 프로빙 레인 (로드맵)",
    fix: null,
  });

  add({
    id: "sov", area: "geo", severity: "high", weight: 0,
    label: "브랜드 언급률 · Share of Voice",
    help: "'이 분야 추천 업체는?'이라고 AI에 물었을 때 우리 브랜드가 경쟁사 대비 얼마나 언급되는지 재는 항목입니다. 반복 측정 인프라가 필요해 로드맵에 있습니다.",
    status: "manual",
    summary: "생성형 엔진 답변에서 브랜드가 언급되는 비율·경쟁사 대비 점유율은 반복 프로빙으로 측정합니다 — 로드맵 항목입니다.",
    details: [],
    passRule: "GEO 인용 프로빙 레인 (로드맵)",
    fix: null,
  });

  /* ── 확산 (Reach) ────────────────────────────── */

  {
    const platforms = p.socialPlatforms || [];
    const aiCited = p.aiCitedPlatforms || [];
    add({
      id: "social-channels", area: "reach", severity: "medium", weight: 2,
      label: "소셜 채널 연결",
      help: "사이트에 공식 인스타·유튜브·레딧 같은 채널 링크가 걸려 있는지 봅니다. 채널이 연결돼 있어야 콘텐츠가 밖으로 퍼질 통로가 생기고, AI도 공식 채널을 함께 인식합니다. 특히 AI 답변은 커뮤니티(레딧)와 영상(유튜브)을 가장 많이 인용합니다.",
      status: platforms.length >= 2 ? "pass" : platforms.length === 1 ? "warn" : "fail",
      summary: platforms.length >= 2
        ? `소셜 채널 ${platforms.length}종(${platforms.slice(0, 4).join(", ")})이 연결되어 확산 통로가 열려 있습니다.`
          + (aiCited.length === 0 ? " 다만 AI가 많이 인용하는 커뮤니티·영상 채널은 없습니다." : ` AI 인용 상위 채널로는 ${aiCited.join(", ")}이(가) 잡힙니다.`)
        : platforms.length === 1
          ? `소셜 채널이 ${platforms[0]} 1종뿐입니다 — 채널을 늘리고 사이트에 연결하세요.`
          : "사이트에 연결된 소셜 채널이 없습니다 — 콘텐츠가 퍼질 통로가 보이지 않습니다.",
      details: [
        { k: "감지 채널", v: platforms.join(", ") || "(없음)" },
        { k: "AI 인용 상위 채널", v: aiCited.length ? aiCited.join(", ") : "(없음)" },
        { k: "sameAs 연동", v: p.hasSameAs ? "있음" : "없음" },
      ],
      passRule: "소셜 플랫폼 2종 이상 연결 시 통과",
      fix: platforms.length >= 2 && aiCited.length > 0 ? null : {
        title: aiCited.length === 0 ? "AI가 실제로 인용하는 채널부터 연결" : "공식 채널 링크 추가",
        action: "추가",
        note: aiCited.length === 0
          ? "AI 답변이 인용하는 출처는 커뮤니티·영상에 크게 쏠려 있습니다(레딧 40.1%, 위키백과 26.3%, 유튜브 23.5% — Semrush, AI 인용 15만 건 분석, 2025.6). "
            + "인스타·카카오만 연결돼 있으면 확산 통로는 있어도 AI 인용 경로는 비어 있는 셈입니다. "
            + "다만 커뮤니티는 홍보 글을 올리는 곳이 아니라, 실제로 도움이 되는 답변을 남겨 신뢰를 쌓는 곳입니다 — "
            + "광고 계정 도배나 직원이 고객인 척 남기는 후기는 적발 시 채널 차단과 평판 손상으로 되돌아옵니다."
          : "푸터에 공식 채널 링크를 걸고, Organization 스키마의 sameAs에도 같은 주소를 넣으세요.",
        code: `<footer>\n  <a href="https://www.youtube.com/@브랜드">유튜브</a>\n  <a href="https://www.reddit.com/user/브랜드">레딧</a>\n  <a href="https://www.instagram.com/브랜드">인스타그램</a>\n</footer>`,
      },
    });
  }

  {
    const ogc = [p.og?.title, p.og?.description, p.og?.image].filter(Boolean).length;
    const hasTw = !!p.twitterCard;
    add({
      id: "share-card", area: "reach", severity: "medium", weight: 2,
      label: "공유 카드 (Open Graph · Twitter Card)",
      help: "카톡·슬랙에 링크를 붙였을 때 나오는 미리보기 카드입니다. 카드가 예쁘게 나오는 링크가 훨씬 많이 클릭되고 공유됩니다 — 바이럴의 기본기입니다.",
      status: ogc === 3 ? "pass" : ogc > 0 ? "warn" : "fail",
      summary: ogc === 3
        ? `OG 태그 3종 완비${hasTw ? " + Twitter Card" : ""} — 공유 시 완전한 미리보기 카드가 나갑니다.`
        : ogc > 0
          ? `OG 태그가 ${ogc}/3종만 있습니다 — 누락분을 채우면 공유 클릭률이 올라갑니다.`
          : "OG 태그가 없습니다 — 카톡·슬랙 공유 시 빈 카드가 나가 확산이 죽습니다.",
      details: [
        { k: "og:title", v: p.og?.title ? "있음" : "없음" },
        { k: "og:description", v: p.og?.description ? "있음" : "없음" },
        { k: "og:image", v: p.og?.image ? "있음" : "없음" },
        { k: "twitter:card", v: p.twitterCard || "(없음)" },
      ],
      passRule: "og:title · og:description · og:image 3종 모두 있을 때 통과",
      fix: ogc === 3 ? null : {
        title: "공유 카드 태그 추가",
        action: "추가",
        note: "미리보기 카드에 쓰이는 기본 3종 + 트위터 카드입니다.",
        code: `<meta property="og:title" content="페이지 제목">\n<meta property="og:description" content="한 줄 요약">\n<meta property="og:image" content="https://example.com/og-image.png">\n<meta name="twitter:card" content="summary_large_image">`,
      },
    });
  }

  {
    const found = !!p.rssLink || a.rssProbe?.found === true;
    add({
      id: "rss-feed", area: "reach", severity: "low", weight: 1,
      label: "RSS/Atom 피드",
      help: "RSS는 새 글이 올라오면 구독자·뉴스 서비스·AI 수집기에 자동으로 알려주는 방송 채널입니다. 콘텐츠를 내는 사이트라면 확산 자동화의 기본입니다.",
      status: found ? "pass" : "warn",
      summary: found
        ? "RSS/Atom 피드가 있어 새 콘텐츠가 구독 생태계로 자동 전파됩니다."
        : "RSS/Atom 피드가 없습니다 — 콘텐츠형 사이트라면 피드를 열어 자동 확산 경로를 만드세요.",
      details: [
        { k: "link rel=alternate", v: p.rssLink || "(없음)" },
        { k: "/rss·/feed 프로브", v: a.rssProbe?.checked ? (a.rssProbe.found ? "발견" : "없음") : "미실행" },
      ],
      passRule: "피드 링크 선언 또는 표준 경로 응답 시 통과",
      fix: found ? null : {
        title: "RSS 피드 노출",
        action: "추가",
        note: "블로그/뉴스 섹션이 있다면 피드를 생성하고 <head>에 선언하세요.",
        code: `<link rel="alternate" type="application/rss+xml" title="브랜드 블로그" href="${a.scheme}://${a.host}/rss.xml">`,
      },
    });
  }

  {
    const w = a.wikipedia || { checked: false };
    add({
      id: "wikipedia-presence", area: "reach", severity: "low", weight: 1,
      label: "위키백과 등재 (실측)",
      help: "위키백과에 브랜드 문서가 있는지 실제로 조회합니다. AI들은 위키백과를 가장 신뢰하는 출처로 쓰기 때문에, 등재 여부가 브랜드 인지도의 강력한 대리 지표입니다.",
      status: !w.checked ? "na" : w.exact ? "pass" : (w.hits || 0) > 0 ? "warn" : "fail",
      summary: !w.checked
        ? "위키백과 조회를 실행하지 못했습니다 — 이번 진단에서는 평가 제외."
        : w.exact
          ? `위키백과에 "${w.brand}" 문서가 등재되어 있습니다 — AI가 참조하는 최상위 신뢰 출처를 확보했습니다.`
          : (w.hits || 0) > 0
            ? `위키백과에 브랜드 단독 문서는 없지만 언급된 문서 ${w.hits}건이 검색됩니다.`
            : `위키백과에서 "${w.brand || "브랜드"}"를 찾지 못했습니다 — 장기적인 확산·권위 구축 과제입니다.`,
      details: [
        { k: "조회 브랜드", v: w.brand || "(추출 실패)" },
        { k: "단독 문서", v: !w.checked ? "미실행" : w.exact ? "있음" : "없음" },
        { k: "언급 문서", v: !w.checked ? "-" : `${w.hits || 0}건` },
      ],
      passRule: "브랜드 단독 문서가 존재할 때 통과",
      fix: (w.checked && !w.exact) ? {
        title: "3자 출처 만들기 (장기 과제)",
        action: "전략",
        note: "위키백과는 직접 만들 수 없습니다. 언론 보도·수상·공공데이터 등 독립적인 3자 출처가 쌓이면 등재 가능성이 생깁니다. 우선 보도자료·미디어킷 페이지부터 정비하세요.",
        code: null,
      } : null,
    });
  }

  {
    add({
      id: "newsletter", area: "reach", severity: "low", weight: 1,
      label: "뉴스레터 · 구독 장치",
      help: "방문자가 다시 찾아오게 만드는 재방문 장치(뉴스레터 구독, 이메일 수집)가 있는지 봅니다. 한 번 온 트래픽을 자산으로 바꾸는 기본 도구입니다.",
      status: p.hasNewsletter ? "pass" : "warn",
      summary: p.hasNewsletter
        ? "뉴스레터/구독 장치가 감지됩니다 — 방문 트래픽을 구독 자산으로 전환하고 있습니다."
        : "뉴스레터/구독 장치가 보이지 않습니다 — 재방문·재확산 루프가 없습니다.",
      details: [
        { k: "구독 장치", v: p.hasNewsletter ? "감지" : "없음" },
      ],
      passRule: "구독 폼 또는 뉴스레터 링크 감지 시 통과",
      fix: p.hasNewsletter ? null : {
        title: "구독 장치 추가",
        action: "추가",
        note: "스티비·메일침프 등 무료 플랜으로도 시작할 수 있습니다.",
        code: `<form action="/subscribe" method="post">\n  <input type="email" name="email" placeholder="이메일 주소">\n  <button type="submit">뉴스레터 구독</button>\n</form>`,
      },
    });
  }

  {
    add({
      id: "hreflang-intl", area: "reach", severity: "low", weight: 1,
      label: "다국어 신호 (hreflang)",
      help: "hreflang은 '이 페이지의 영어판은 여기'라고 알려주는 표시입니다. 글로벌 AI 답변(영어 질문)에 인용되려면 다국어 버전과 이 연결이 필요합니다.",
      status: p.hasHreflang ? "pass" : "warn",
      summary: p.hasHreflang
        ? "hreflang 다국어 연결이 있습니다 — 글로벌 AI 답변 노출 기반이 갖춰져 있습니다."
        : "hreflang이 없습니다 — 한국어 단일 페이지는 영어권 AI 답변에 인용되기 어렵습니다 (내수 전용이라면 무시해도 됩니다).",
      details: [
        { k: "hreflang alternate", v: p.hasHreflang ? "있음" : "없음" },
      ],
      passRule: "hreflang alternate 링크가 1개 이상일 때 통과",
      fix: p.hasHreflang ? null : {
        title: "다국어 버전 + hreflang 연결 (선택)",
        action: "추가",
        code: `<link rel="alternate" hreflang="ko" href="https://example.com/">\n<link rel="alternate" hreflang="en" href="https://example.com/en/">`,
      },
    });
  }

  /* ── 영역 점수 집계 ─────────────────────────── */

  const areas = {};
  for (const key of ["seo", "aeo", "geo", "reach"]) {
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

  const overall = Math.round(
    areas.seo.score * AREA_WEIGHTS.seo +
    areas.aeo.score * AREA_WEIGHTS.aeo +
    areas.geo.score * AREA_WEIGHTS.geo +
    areas.reach.score * AREA_WEIGHTS.reach
  );

  /* ── 레이더 7축 ─────────────────────────────── */
  const AXES = [
    { key: "tech",    label: "기술 기반",     ids: ["http-status", "https-tls", "robots-crawl", "noindex", "sitemap", "js-render-gap", "basic-meta", "response-speed", "crawl-efficiency", "verification-meta", "internal-links"] },
    { key: "content", label: "콘텐츠 구조",   ids: ["title-tag", "meta-description", "heading-structure", "heading-hierarchy", "readability", "structured-blocks", "answer-position"] },
    { key: "schema",  label: "스키마·엔티티", ids: ["jsonld-valid", "entity-schema", "answer-schema", "citation-schema", "knowledge-graph"] },
    { key: "trust",   label: "신뢰 신호",     ids: ["eeat-onpage", "eeat-signals", "canonical"] },
    { key: "open",    label: "AI 개방성",     ids: ["ai-crawler-access", "llms-txt"] },
    { key: "cite",    label: "인용 경쟁력",   ids: ["stats-density", "question-headings", "multimodal", "quotation"] },
    { key: "reach",   label: "확산 신호",     ids: ["social-channels", "share-card", "rss-feed", "wikipedia-presence", "newsletter", "hreflang-intl"] },
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

  /* raw HTML에 본문이 거의 없으면 콘텐츠 계열 체크는 "사이트에 없다"가 아니라
     "크롤러 눈에 안 보인다"를 재고 있는 것이다. 점수는 그대로 두되(AI 봇이 실제로
     빈 페이지를 보는 것은 사실이므로) 근본 원인을 앞세울 수 있게 표시만 남긴다. */
  const contentBlind = (p.wordCount || 0) < 60 && !!p.spaMarkers;

  return {
    engine: ENGINE_ID,
    pageType,
    contentBlind,
    overall,
    grade: gradeOf(overall),
    areas,
    radar,
    issues,
    checks,
    weights: AREA_WEIGHTS,
  };
}
