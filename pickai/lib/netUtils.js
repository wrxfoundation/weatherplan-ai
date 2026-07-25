/* ============================================================
 * Pick AI · 네트워크 공용 유틸 (서버 전용)
 *
 * - SSRF 가드: 사설 IP · localhost · 비 http(s) 차단
 * - 타임아웃 페치 · 본문 크기 캡 · 수동 리다이렉트 추적
 * - /api/scorecard 와 /api/deep-scan 이 공유
 * ============================================================ */

import { lookup } from "node:dns/promises";

export const MAIN_TIMEOUT_MS = 12000;
export const SIDE_TIMEOUT_MS = 6000;
export const MAX_REDIRECTS = 10;
export const MAX_BODY_BYTES = 1_500_000;
export const DEFAULT_UA =
  "Mozilla/5.0 (compatible; PickAI-Scorecard/1.0; +https://github.com/aeogeo)";

function isPrivateIp(ip) {
  if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.)/.test(ip)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  if (ip === "::1" || /^f[cd]/i.test(ip) || /^fe80/i.test(ip)) return true;
  if (/^::ffff:/i.test(ip)) return isPrivateIp(ip.replace(/^::ffff:/i, ""));
  return false;
}

export async function assertPublicHost(hostname) {
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

export function fetchWithTimeout(url, opts = {}, ms = SIDE_TIMEOUT_MS) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, {
    redirect: "manual",
    signal: ctrl.signal,
    headers: {
      "user-agent": opts.ua || DEFAULT_UA,
      accept: opts.accept || "text/html,application/xhtml+xml,*/*;q=0.8",
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

export function isTlsError(err) {
  const code = err?.cause?.code || err?.code || "";
  const msg = String(err?.cause?.message || err?.message || "");
  return TLS_ERROR_CODES.some((c) => code === c || msg.includes(c)) ||
    /certificate|SSL routines|TLS/i.test(msg);
}

export async function readBodyCapped(resp, cap = MAX_BODY_BYTES) {
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

/* 대상 URL 정규화 + 형식 검증 — 실패 시 null */
export function normalizeTargetUrl(input) {
  let s = String(input || "").trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try {
    const u = new URL(s);
    if (!/^https?:$/.test(u.protocol)) return null;
    if (!u.hostname.includes(".")) return null;
    return u;
  } catch {
    return null;
  }
}

/* 메인 페이지: 리다이렉트 체인 수동 추적 (TLS 무효 시 http 폴백으로 진단 지속) */
export async function fetchChain(startUrl) {
  let url = new URL(startUrl);
  let redirects = 0;
  let tlsValid = url.protocol === "https:" ? true : null;
  let tlsError = null;
  const t0 = Date.now();
  const visited = new Set([url.href]);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(url.hostname);
    let resp;
    try {
      resp = await fetchWithTimeout(url.href, {}, MAIN_TIMEOUT_MS);
    } catch (err) {
      if (url.protocol === "https:" && isTlsError(err)) {
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
        return { finalUrl: url, status: resp.status, redirects, resp, tlsValid, tlsError, responseMs: Date.now() - t0, redirectLoop: redirects >= MAX_REDIRECTS };
      }
      redirects += 1;
      const next = new URL(loc, url);
      if (visited.has(next.href)) {
        /* 리다이렉트 루프 — 더 따라가도 의미 없음 */
        return { finalUrl: url, status: resp.status, redirects, resp, tlsValid, tlsError, responseMs: Date.now() - t0, redirectLoop: true };
      }
      visited.add(next.href);
      url = next;
      if (url.protocol === "https:" && tlsValid === null) tlsValid = true;
      continue;
    }
    return { finalUrl: url, status: resp.status, redirects, resp, tlsValid, tlsError, responseMs: Date.now() - t0 };
  }
  throw new Error("TOO_MANY_REDIRECTS");
}

/* 상태만 확인하는 경량 페치 (본문 즉시 취소) */
export async function probe(url, ua) {
  try {
    const resp = await fetchWithTimeout(url, { ua }, SIDE_TIMEOUT_MS);
    const status = resp.status;
    try { await resp.body?.cancel?.(); } catch {}
    return { ran: true, ok: status >= 200 && status < 400, status };
  } catch {
    return { ran: true, ok: false, status: 0 };
  }
}

/* 표준 에러 → HTTP 응답 매핑 */
export function sendFetchError(res, err) {
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
  console.error("[aeogeo/netUtils]", err);
  return res.status(502).json({
    error: "사이트에 연결하지 못했습니다 — 주소가 맞는지, 사이트가 살아있는지 확인해 주세요",
  });
}
