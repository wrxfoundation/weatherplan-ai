'use strict';
// /api/snapshot — 내부판 관리자 모드(44차)에서 미리 넣어 둔 자료(첫 화면 · 원장을 못 받을 때)를 관리자 열쇠가 있을 때만 준다.
//   내부판 배포 묶음(scripts/build-internal.js)은 public/snapshot.json 을 빼고 lib/snapshot-view.json 으로 옮긴다 — public 은 누구나 받을 수 있어서다.
//   상품판(EDITION=watch)에서는 없는 주소처럼 404(상품판의 미리 넣어 둔 자료는 무료만큼만 남긴 public/snapshot.json 이다)
const admin = require('../lib/admin');
let SNAP = null;
try { SNAP = require('../lib/snapshot-view.json'); } catch (e) { SNAP = null; }

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (!admin.ON) return res.status(404).json({ ok: false });
  if (admin.need(req)) return res.status(401).json({ ok: false, error: 'admin', set: admin.set() });
  if (!SNAP) return res.status(404).json({ ok: false, error: 'none' });
  return res.status(200).json(SNAP);
};
