'use strict';
// GET /api/refresh — 매일 예약 실행이 부른다. 최신 원장까지 반영하고, 부정 쪽 지갑 자금 흐름을 하루 한 번 새로 받아 저장한 뒤 상태만 돌려준다.
const { run } = require('../lib/run');
const edition = require('../lib/edition');

module.exports = async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret && (req.headers && req.headers.authorization) !== 'Bearer ' + secret) return res.status(401).json({ ok: false });
  const r = await run({ daily: true });
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ ok: true, at: new Date().toISOString(), ledger: r.ledger, as_of: r.out.summary[0].as_of, info: edition.ON ? { storage: r.info.storage } : r.info });      // 상품판에는 서버 안쪽 기록을 내지 않는다
};
