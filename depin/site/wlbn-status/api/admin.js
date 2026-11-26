'use strict';
// /api/admin — 내부판 관리자 모드(44차)
//   GET  → { set: 비밀번호가 설정됐나, in: 지금 보낸 열쇠가 맞나, hours }
//   POST { password } → 맞으면 { key, exp }(HOURS 시간 유효한 서명 열쇠) · 틀리면 401(조금 늦게 답한다 — 마구 넣어 보기를 늦춘다)
//   상품판(EDITION=watch)에서는 없는 주소처럼 404
const admin = require('../lib/admin');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!admin.ON) return res.status(404).json({ ok: false });
  if (req.method === 'GET') return res.status(200).json({ ok: true, set: admin.set(), in: admin.verify(req), hours: admin.HOURS });
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  if (!admin.set()) return res.status(503).json({ ok: false, error: 'unset' });
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  if (!admin.check(b && b.password)) { await new Promise((r) => setTimeout(r, 800)); return res.status(401).json({ ok: false, error: 'wrong' }); }
  const m = admin.mint();
  return res.status(200).json({ ok: true, key: m.key, exp: m.exp });
};
