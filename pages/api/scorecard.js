/* ============================================================
 * Weather Plan AI · /api/scorecard
 *
 * AI 성적표 — SEO·AEO·GEO 결정론 진단 수집기
 * 대상 URL을 서버에서 직접 페치해 lib/scorecardEngine.js 로 채점
 *
 * 수집 파이프라인 (전부 서버사이드 · 타임아웃 엄수):
 *  1) 메인 페이지: 수동 리다이렉트 추적(최대 5회) + 본문 1.5MB 캡
 *  2) 병렬: robots.txt · llms.txt · sitemap.xml · AI 봇 라이브 페치 4종
 *  3) 엔진 채점 → JSON 응답
 *
 * 보안:
 *  - SSRF 가드: 사설 IP·localhost·비 http(s) 스킴 차단
 *  - 응답 본문 크기 캡, 요청당 페치 수 고정
 * ============================================================ */

import { lookup } from "node:dns/promises";
import {
  AI_BOTS, parseRobotsTxt, robotsVerdict, analyzeHtml, runScorecard,
} from "../../lib/scorecardEngine.js";

export const config = {
  api: { responseLimit: "4mb" },
};

const MAIN_TIMEOUT_MS = 12000;
const SIDE_TIMEOUT_MS = 6000;
const MAX_REDIRECTS = 5;
const MAX_BODY_BYTES = 1_500_000;
const DEFAULT_UA =
  "Mozilla/5.0 (compatible; WeatherPlanAI-Scorecard/1.0; +https://weatherplan-ai.vercel.app/ai-scorecard)";

/* 라이브 페치를 실제 실행할 봇 (나머지는 robots.txt 판정만) */
const LIVE_FETCH_BOTS = ["OAI-SearchBot", "GPTBot", "ClaudeBot", "PerplexityBot"];
const BOT_UA_STRINGS = {
  "OAI-SearchBot": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot",
  "GPTBot": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot",
  "ClaudeBot": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
  "PerplexityBot": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
};

/* ─── SSRF 가드 ─── */
function isPrivateIp(ip) {
  if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.)/.test(ip)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  if (ip === "::1" || /^f[cd]/i.test(ip) || /^fe80/i.test(ip)) return true;
  if (/^::ffff:/i.test(ip)) return isPrivateIp(ip.replace(/^::ffff:/i, ""));
  return false;
}

async function assertPublicHost(hostname) {
  const bare = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (bare === "localhost" || bare.endsWith(".local") || bare.endsWith(".internal")) {
    throw new Error("BLOCKED_HOST");
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(bare) || bare.includes(":")) {
    if (isPrivateIp(bare)) throw new Error("BLOCKED_HOST");
    return;
  }
  try {
    const { address } = await lookup(bare);
    if (isPrivateIp(address)) throw new Error("BLOCKED_HOST");
  } catch (e) {
    if (e.message === "BLOCKED_HOST") throw e;
    throw new Error("DNS_FAIL");
  }
}

/* ─── 타임아웃 페치 ─── */
function fetchWithTimeout(url, opts = {}, ms = SIDE_TIMEOUT_MS) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, {
    redirect: "manual",
    signal: ctrl.signal,
    headers: {
      "user-agent": opts.ua || DEFAULT_UA,
      accept: "text/html,application/xhtml+xml,*/*;q=0.8",
      "accept-language": "ko,en;q=0.8",
      ...(opts.headers || {}),
    },
  }).finally(() => clearTimeout(timer));
}

const TLS_ERROR_CODES = [
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE", "CERT_HAS_EXPIRED", "DEPTH_ZERO_SELF_SIGNED_CERT",
  "SELF_SIGNED_CERT_IN_CHAIN", "ERR_TLS_CERT_ALTNAME_INVALID", "UNABLE_TO_GET_ISSUER_CERT",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY", "HOSTNAME_MISMATCH", "CERT_NOT_YET_VALID",
];
function isTlsError(err) {
  const code = err?.cause?.code || err?.code || "";
  const msg = String(err?.cause?.message || err?.message || "");
  return TLS_ERROR_CODES.some((c) => code === c || msg.includes(c)) ||
    /certificate|SSL routines|TLS/i.test(msg);
}

/* 본문을 캡까지만 읽기 */
async function readBodyCapped(resp, cap = MAX_BODY_BYTES) {
  const reader = resp.body?.getReader?.();
  if (!reader) return await resp.text();
  const chunks = [];
  let total = 0;
  while (total < cap) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }
  try { await reader.cancel(); } catch {}
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
}

/* ─── 메인 페이지: 리다이렉트 체인 수동 추적 ─── */
async function fetchChain(startUrl) {
  let url = new URL(startUrl);
  let redirects = 0;
  let tlsValid = url.protocol === "https:" ? true : null;
  let tlsError = null;
  const t0 = Date.now();

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(url.hostname);
    let resp;
    try {
      resp = await fetchWithTimeout(url.href, {}, MAIN_TIMEOUT_MS);
    } catch (err) {
      if (url.protocol === "https:" && isTlsError(err)) {
        /* TLS 무효 — 진단은 계속해야 하므로 http 폴백으로 콘텐츠 확보 시도 */
        tlsValid = false;
        tlsError = String(err?.cause?.code || err?.message || "TLS_ERROR").slice(0, 120);
        const httpUrl = new URL(url.href);
        httpUrl.protocol = "http:";
        try {
          resp = await fetchWithTimeout(httpUrl.href, {}, MAIN_TIMEOUT_MS);
          url = httpUrl;
        } catch {
          throw new Error("UNREACHABLE");
        }
      } else if (err.message === "BLOCKED_HOST" || err.message === "DNS_FAIL") {
        throw err;
      } else {
        throw new Error("UNREACHABLE");
      }
    }

    if (resp.status >= 300 && resp.status < 400) {
      const loc = resp.headers.get("location");
      if (!loc || redirects >= MAX_REDIRECTS) {
        return { finalUrl: url, status: resp.status, redirects, resp, tlsValid, tlsError, responseMs: Date.now() - t0 };
      }
      redirects += 1;
      url = new URL(loc, url);
      if (url.protocol === "https:" && tlsValid === null) tlsValid = true;
      continue;
    }
    return { finalUrl: url, status: resp.status, redirects, resp, tlsValid, tlsError, responseMs: Date.now() - t0 };
  }
  throw new Error("TOO_MANY_REDIRECTS");
}

/* 상태만 확인하는 경량 페치 (본문 즉시 취소) */
async function probe(url, ua) {
  try {
    const resp = await fetchWithTimeout(url, { ua }, SIDE_TIMEOUT_MS);
    const status = resp.status;
    try { await resp.body?.cancel?.(); } catch {}
    return { ran: true, ok: status >= 200 && status < 400, status };
  } catch {
    return { ran: true, ok: false, status: 0 };
  }
}

/* ─── 핸들러 ─── */
export default async function handler(req, res) {
  const allowedOrigins = [
    "https://weatherplan.kweather.co.kr",
    "https://weatherplan-ai.vercel.app",
    "http://localhost:3000",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let input = String(req.body?.url || "").trim();
  if (!input) return res.status(400).json({ error: "url 필수" });
  if (!/^https?:\/\//i.test(input)) input = "https://" + input;

  let target;
  try {
    target = new URL(input);
    if (!/^https?:$/.test(target.protocol)) throw new Error("bad scheme");
    if (!target.hostname.includes(".")) throw new Error("bad host");
  } catch {
    return res.status(400).json({ error: "올바른 URL 형식이 아닙니다 — 예: https://example.co.kr" });
  }

  try {
    /* 1) 메인 페이지 */
    const chain = await fetchChain(target.href);
    const finalUrl = chain.finalUrl;
    const html = chain.status >= 200 && chain.status < 300 ? await readBodyCapped(chain.resp) : "";
    const xRobotsTag = chain.resp.headers.get("x-robots-tag") || null;
    const originBase = `${finalUrl.protocol}//${finalUrl.host}`;

    /* 2) 병렬 수집 */
    const robotsP = (async () => {
      try {
        const r = await fetchWithTimeout(`${originBase}/robots.txt`);
        if (r.status !== 200) return { found: false, parsed: null, sitemaps: [] };
        const txt = await readBodyCapped(r, 200_000);
        const parsed = parseRobotsTxt(txt);
        return { found: true, parsed, sitemaps: parsed.sitemaps };
      } catch {
        return { found: false, parsed: null, sitemaps: [] };
      }
    })();

    const llmsP = probe(`${originBase}/llms.txt`);
    const sitemapP = probe(`${originBase}/sitemap.xml`);
    const liveBotsP = Promise.all(
      LIVE_FETCH_BOTS.map((ua) => probe(finalUrl.href, BOT_UA_STRINGS[ua]).then((r) => [ua, r]))
    );

    const [robots, llms, sitemapXml, liveEntries] = await Promise.all([robotsP, llmsP, sitemapP, liveBotsP]);
    const liveMap = Object.fromEntries(liveEntries);

    /* 3) 봇 판정 조립 */
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

    /* 4) HTML 분석 + 혼합 콘텐츠 */
    const parsed = analyzeHtml(html);
    const mixedContentCount = finalUrl.protocol === "https:"
      ? (html.match(/(?:src|href)\s*=\s*["']http:\/\//gi) || []).length
      : 0;

    /* 5) 채점 */
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
      mixedContentCount,
      xRobotsTag,
      parsed,
      robots,
      llmsTxtFound: llms.ok,
      sitemapXml: { checked: true, ok: sitemapXml.ok, status: sitemapXml.status },
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
    const msg = err?.message || "";
    if (msg === "BLOCKED_HOST") {
      return res.status(400).json({ error: "내부망·사설 주소는 진단할 수 없습니다" });
    }
    if (msg === "DNS_FAIL") {
      return res.status(400).json({ error: "도메인을 찾을 수 없습니다 — 주소를 확인해 주세요" });
    }
    if (msg === "TOO_MANY_REDIRECTS") {
      return res.status(422).json({ error: "리다이렉트가 너무 많아 진단을 중단했습니다 (5회 초과)" });
    }
    console.error("[/api/scorecard]", err);
    return res.status(502).json({
      error: "사이트에 연결하지 못했습니다 — 주소가 맞는지, 사이트가 살아있는지 확인해 주세요",
    });
  }
}
