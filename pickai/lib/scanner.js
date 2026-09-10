/* ============================================================
 * Pick AI · 스캔 파이프라인 (공용)
 *
 * /api/scorecard · /api/benchmark-run · /api/cron-rescan 이 공유하는
 * 수집→분석→채점 전체 파이프라인. 네트워크 정책(SSRF 가드·타임아웃·
 * 본문 캡)은 lib/netUtils.js 를 그대로 따른다.
 * ============================================================ */

import {
  normalizeTargetUrl, fetchChain, fetchWithTimeout, readBodyCapped, probe,
  SIDE_TIMEOUT_MS,
} from "./netUtils.js";
import {
  AI_BOTS, parseRobotsTxt, robotsVerdict, analyzeHtml, runScorecard,
} from "./scorecardEngine.js";

/* 라이브 페치를 실제 실행할 봇 (나머지는 robots.txt 판정만) */
const LIVE_FETCH_BOTS = ["OAI-SearchBot", "GPTBot", "ClaudeBot", "PerplexityBot"];
const BOT_UA_STRINGS = {
  "OAI-SearchBot": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot",
  "GPTBot": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot",
  "ClaudeBot": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
  "PerplexityBot": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
};

/* 위키백과 실측 조회 — 단독 문서(정확 일치) + 언급(검색 히트) */
async function checkWikipedia(brand) {
  if (!brand || brand.length < 2) return { checked: false };
  const q = encodeURIComponent(brand.slice(0, 60));
  const call = async (lang) => {
    const r = await fetchWithTimeout(
      `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${q}&srlimit=5&format=json&origin=*`,
      { accept: "application/json" }, SIDE_TIMEOUT_MS
    );
    if (r.status !== 200) throw new Error("wiki fail");
    const j = JSON.parse(await readBodyCapped(r, 200_000));
    const results = j?.query?.search || [];
    const norm = (s) => String(s).toLowerCase().replace(/\s|\(주\)|주식회사/g, "");
    const exact = results.some((x) => norm(x.title) === norm(brand));
    return { hits: results.length, exact };
  };
  try {
    const ko = await call("ko");
    if (ko.exact) return { checked: true, exact: true, hits: ko.hits, brand };
    try {
      const en = await call("en");
      return { checked: true, exact: en.exact, hits: Math.max(ko.hits, en.hits), brand };
    } catch {
      return { checked: true, exact: false, hits: ko.hits, brand };
    }
  } catch {
    return { checked: false, brand };
  }
}

/* 전체 스캔 실행 — 성공 시 { target, bots, report } 반환, 실패 시 netUtils 오류를 그대로 throw */
export async function performScan(inputUrl) {
  const target = normalizeTargetUrl(inputUrl);
  if (!target) {
    const e = new Error("BAD_URL");
    throw e;
  }

  /* 1) 메인 페이지 */
  const chain = await fetchChain(target.href);
  const finalUrl = chain.finalUrl;
  const html = chain.status >= 200 && chain.status < 300 ? await readBodyCapped(chain.resp) : "";
  const xRobotsTag = chain.resp.headers.get("x-robots-tag") || null;
  const respHeaders = {
    contentEncoding: chain.resp.headers.get("content-encoding") || null,
    cacheControl: chain.resp.headers.get("cache-control") || null,
    etag: chain.resp.headers.get("etag") || null,
    lastModified: chain.resp.headers.get("last-modified") || null,
  };
  const originBase = `${finalUrl.protocol}//${finalUrl.host}`;

  /* 2) HTML 분석 */
  const parsed = analyzeHtml(html);

  /* 3) 병렬 수집 */
  const robotsP = (async () => {
    try {
      const r = await fetchWithTimeout(`${originBase}/robots.txt`);
      if (r.status !== 200) return { found: false, parsed: null, sitemaps: [] };
      const txt = await readBodyCapped(r, 200_000);
      const rp = parseRobotsTxt(txt);
      return { found: true, parsed: rp, sitemaps: rp.sitemaps };
    } catch {
      return { found: false, parsed: null, sitemaps: [] };
    }
  })();

  const llmsP = probe(`${originBase}/llms.txt`);
  const sitemapP = probe(`${originBase}/sitemap.xml`);
  const rssP = (async () => {
    if (parsed.rssLink) return { checked: true, found: true };
    for (const p of ["/rss.xml", "/feed"]) {
      const r = await probe(`${originBase}${p}`);
      if (r.ok) return { checked: true, found: true };
    }
    return { checked: true, found: false };
  })();
  const wikiP = checkWikipedia(parsed.orgName);
  const liveBotsP = Promise.all(
    LIVE_FETCH_BOTS.map((ua) => probe(finalUrl.href, BOT_UA_STRINGS[ua]).then((r) => [ua, r]))
  );

  const [robots, llms, sitemapXml, rssProbe, wikipedia, liveEntries] =
    await Promise.all([robotsP, llmsP, sitemapP, rssP, wikiP, liveBotsP]);
  const liveMap = Object.fromEntries(liveEntries);

  /* 4) 봇 판정 조립 */
  const path = finalUrl.pathname || "/";
  const bots = AI_BOTS.map((b) => {
    const v = robots.parsed
      ? robotsVerdict(robots.parsed, b.ua, path)
      : { allowed: true, rule: "robots.txt 없음 — 기본 허용" };
    return {
      ...b,
      robotsAllowed: v.allowed,
      robotsRule: v.rule,
      live: liveMap[b.ua] || { ran: false, ok: null, status: null },
    };
  });

  /* 5) 혼합 콘텐츠 + 채점 */
  const mixedContentCount = finalUrl.protocol === "https:"
    ? (html.match(/(?:src|href)\s*=\s*["']http:\/\//gi) || []).length
    : 0;

  const report = runScorecard({
    url: target.href,
    finalUrl: finalUrl.href,
    host: finalUrl.host,
    path,
    scheme: finalUrl.protocol.replace(":", ""),
    status: chain.status,
    redirects: chain.redirects,
    responseMs: chain.responseMs,
    tlsValid: chain.tlsValid,
    tlsError: chain.tlsError,
    redirectLoop: chain.redirectLoop === true,
    headers: respHeaders,
    mixedContentCount,
    xRobotsTag,
    parsed,
    robots,
    llmsTxtFound: llms.ok,
    sitemapXml: { checked: true, ok: sitemapXml.ok, status: sitemapXml.status },
    rssProbe,
    wikipedia,
    bots,
  });

  return {
    target: {
      input: String(inputUrl).trim(),
      inputHost: target.hostname,
      finalUrl: finalUrl.href,
      host: finalUrl.host,
      status: chain.status,
      redirects: chain.redirects,
      responseMs: chain.responseMs,
      scheme: finalUrl.protocol.replace(":", ""),
      tlsValid: chain.tlsValid,
      redirectLoop: chain.redirectLoop === true,
      framework: parsed.framework || null,
    },
    bots,
    report,
  };
}

/* DB 저장용 요약 행 구성 */
export function scanToRow(result, { isBenchmark = false, company = null, industry = null, source = "web" } = {}) {
  const r = result.report;
  return {
    host: result.target.inputHost,
    final_host: result.target.host,
    http_status: result.target.status,
    overall: r.overall,
    grade: r.grade,
    seo: r.areas.seo.score,
    aeo: r.areas.aeo.score,
    geo: r.areas.geo.score,
    reach: r.areas.reach.score,
    issues: r.issues.length,
    fails: r.checks.filter((c) => c.status === "fail").length,
    is_benchmark: isBenchmark,
    company, industry,
    engine: r.engine,
    source,
  };
}
