'use strict';
// GET /api/data — 최신 원장을 반영한 화면용 자료. 화면을 열 때 부른다.
//   ?from=YYYY-MM-DD&to=YYYY-MM-DD 를 붙이면 그 날짜 범위의 합계(ranges.custom)를 함께 내려 준다(「지표 모아보기」의 날짜 지정)
const { run } = require('../lib/run');

module.exports = async function handler(req, res) {
  const q = req.query || {}, DAY = /^\d{4}-\d{2}-\d{2}$/;
  // 꼴만이 아니라 실제 있는 날짜인지 본다(2026-10-99 같은 값은 버린다 — 범위 없이 전체 · 30일 · 7일만 돌려준다)
  const real = (v) => { const t = String(v || ''); if (!DAY.test(t)) return false; const ms = Date.parse(t + 'T00:00:00Z'); return !isNaN(ms) && new Date(ms).toISOString().slice(0, 10) === t; };
  const range = real(q.from) && real(q.to) ? { from: String(q.from), to: String(q.to) } : null;
  let r;
  try { r = await run({ range }); } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({ ok: false, error: String((e && e.message) || e).slice(0, 160) });
  }
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=' + (r.persistent ? 900 : 3600) + ', stale-while-revalidate=86400');
  res.status(200).json(Object.assign({ ok: true, generated_at: new Date().toISOString(), ledger: r.ledger, info: r.info }, r.out));
};
