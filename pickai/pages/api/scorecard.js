/* ============================================================
 * Pick AI · /api/scorecard
 *
 * 무료 진단 수집기 — SEO·AEO·GEO·확산 결정론 채점
 *
 * 수집 파이프라인 (전부 서버사이드 · 타임아웃 엄수):
 *  1) 메인 페이지: 수동 리다이렉트 추적(최대 5회) + 본문 1.5MB 캡
 *  2) 병렬: robots.txt · llms.txt · sitemap.xml · RSS 프로브 ·
 *           위키백과 조회(실측) · AI 봇 라이브 페치 4종
 *  3) lib/scorecardEngine 채점 → JSON 응답
 * ============================================================ */

import {
  normalizeTargetUrl, fetchChain, fetchWithTimeout, readBodyCapped, probe,
  sendFetchError, SIDE_TIMEOUT_MS,
} from "../../lib/netUtils.js";
import {
  AI_BOTS, parseRobotsTxt, robotsVerdict, analyzeHtml, runScorecard,
} from "../../lib/scorecardEngine.js";

export const config = {
  api: { responseLimit: "4mb" },
};

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
    /* 한국어에 없으면 영어도 한 번 */
    try {
      const en = await call("en");
      return {
        checked: true,
        exact: en.exact,
        hits: Math.max(ko.hits, en.hits),
        brand,
      };
    } catch {
      return { checked: true, exact: false, hits: ko.hits, brand };
    }
  } catch {
    return { checked: false, brand };
  }
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const target = normalizeTargetUrl(req.body?.url);
  if (!target) {
    return res.status(400).json({ error: "올바른 URL 형식이 아닙니다 — 예: https://example.co.kr" });
  }

  try {
    /* 1) 메인 페이지 */
    const chain = await fetchChain(target.href);
    const finalUrl = chain.finalUrl;
    const html = chain.status >= 200 && chain.status < 300 ? await readBodyCapped(chain.resp) : "";
    const xRobotsTag = chain.resp.headers.get("x-robots-tag") || null;
    const originBase = `${finalUrl.protocol}//${finalUrl.host}`;

    /* 2) HTML 분석 (조직명은 위키백과 조회에 필요) */
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
      const paths = ["/rss.xml", "/feed"];
      for (const p of paths) {
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

    return res.status(200).json({
      ok: true,
      target: {
        input: String(req.body.url).trim(),
        finalUrl: finalUrl.href,
        host: finalUrl.host,
        status: chain.status,
        redirects: chain.redirects,
        responseMs: chain.responseMs,
        scheme: finalUrl.protocol.replace(":", ""),
        tlsValid: chain.tlsValid,
      },
      bots,
      report,
      scannedAt: new Date().toISOString(),
    });
  } catch (err) {
    return sendFetchError(res, err);
  }
}
