'use strict';
// GET /api/data — 최신 원장을 반영한 화면용 자료. 화면을 열 때 부른다.
const { run } = require('../lib/run');

module.exports = async function handler(req, res) {
  const r = await run();
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=' + (r.persistent ? 900 : 3600) + ', stale-while-revalidate=86400');
  res.status(200).json(Object.assign({ ok: true, generated_at: new Date().toISOString(), ledger: r.ledger, info: r.info }, r.out));
};
