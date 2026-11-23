'use strict';
// GET /api/data — 최신 원장을 반영한 화면용 자료. 화면을 열 때 부른다.
//   ?from=YYYY-MM-DD&to=YYYY-MM-DD 를 붙이면 그 날짜 범위의 합계(ranges.custom)를 함께 내려 준다(「지표 모아보기」의 날짜 지정)
const { run } = require('../lib/run');

module.exports = async function handler(req, res) {
  const q = req.query || {}, DAY = /^\d{4}-\d{2}-\d{2}$/;
  const range = DAY.test(String(q.from || '')) && DAY.test(String(q.to || '')) ? { from: String(q.from), to: String(q.to) } : null;
  const r = await run({ range });
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=' + (r.persistent ? 900 : 3600) + ', stale-while-revalidate=86400');
  res.status(200).json(Object.assign({ ok: true, generated_at: new Date().toISOString(), ledger: r.ledger, info: r.info }, r.out));
};
