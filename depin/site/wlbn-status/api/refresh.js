'use strict';
// GET /api/refresh — 매일 예약 실행이 부른다. 최신 원장까지 반영해 저장하고 상태만 돌려준다.
const { run } = require('../lib/run');

module.exports = async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret && (req.headers && req.headers.authorization) !== 'Bearer ' + secret) return res.status(401).json({ ok: false });
  const r = await run();
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ ok: true, at: new Date().toISOString(), ledger: r.ledger, as_of: r.out.summary[0].as_of, info: r.info });
};
