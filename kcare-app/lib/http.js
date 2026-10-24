// API 쓰기 요청 확인 (2026-10-06 점검) — 다른 사이트의 폼이 로그인 쿠키를 타고 보내는 요청(CSRF)을 막는다.
// 우리 화면은 모두 JSON 으로 보낸다. JSON 이 아니거나, 브라우저가 붙인 Origin 이 이 사이트가 아니면 거절한다.
export function sameSiteJson(req) {
  const type = String(req.headers["content-type"] || "").toLowerCase();
  if (!type.startsWith("application/json")) return false;
  const origin = req.headers.origin;
  if (!origin) return true; // 서버끼리 부르는 요청 · 오래된 브라우저 — JSON 이면 폼으로는 못 보낸다
  try {
    return new URL(origin).host === req.headers.host;
  } catch (_) {
    return false;
  }
}

// 요청한 곳 — 플랫폼(Vercel)이 붙이는 값을 먼저 본다 (x-real-ip). 사용자가 넣은 X-Forwarded-For 첫 값은 믿지 않는다
export function clientIp(req) {
  const real = req.headers["x-real-ip"];
  if (real) return String(real).trim();
  const fwd = String(req.headers["x-forwarded-for"] || "").split(",").map((s) => s.trim()).filter(Boolean);
  return fwd.length ? fwd[fwd.length - 1] : req.socket?.remoteAddress || "?";
}

// 짧은 시간 여러 번 — 서버 인스턴스마다의 최소 장치 (오래된 기록은 지운다)
export function makeLimiter({ windowMs, max }) {
  const hits = new Map();
  return (key) => {
    const now = Date.now();
    if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
    const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
    list.push(now);
    hits.set(key, list);
    return list.length > max;
  };
}
