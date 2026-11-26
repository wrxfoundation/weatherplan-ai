'use strict';
// GET /api/data — 최신 원장을 반영한 화면용 자료. 화면을 열 때 부른다.
//   ?from=YYYY-MM-DD&to=YYYY-MM-DD 를 붙이면 그 날짜 범위의 합계(ranges.custom)를 함께 내려 준다(「지표 모아보기」의 날짜 지정)
const { run } = require('../lib/run');
const edition = require('../lib/edition');      // 상품판(EDITION=watch)일 때만 요금제별로 자료를 거른다
const admin = require('../lib/admin');      // 내부판은 관리자 열쇠가 있어야 자료를 준다(44차)

module.exports = async function handler(req, res) {
  if (admin.need(req)) { res.setHeader('Cache-Control', 'no-store'); return res.status(401).json({ ok: false, error: 'admin', set: admin.set() }); }
  const q = req.query || {}, DAY = /^\d{4}-\d{2}-\d{2}$/;
  // 꼴만이 아니라 실제 있는 날짜인지 본다(2026-10-99 같은 값은 버린다 — 범위 없이 전체 · 30일 · 7일만 돌려준다)
  const real = (v) => { const t = String(v || ''); if (!DAY.test(t)) return false; const ms = Date.parse(t + 'T00:00:00Z'); return !isNaN(ms) && new Date(ms).toISOString().slice(0, 10) === t; };
  const ed = edition.ON ? edition.who(req) : null;      // { plan, state, exp } — 내부 현황판이면 null
  const range = real(q.from) && real(q.to) && (!ed || edition.can(ed.plan, 'daily')) ? { from: String(q.from), to: String(q.to) } : null;      // 상품판의 날짜 지정은 스탠더드부터
  let r;
  try { r = await run({ range }); } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({ ok: false, error: String((e && e.message) || e).slice(0, 160) });
  }
  // 상품판: 응답이 요금제마다 다르므로 이용권이 붙은 요청은 함께 쓰는 보관본에 두지 않는다
  if (ed) res.setHeader('Vary', 'Authorization');
  // 미리보기(정식 구독 시작 전)는 누구에게나 같은 응답이라 함께 쓰는 보관본에 둔다 — 시작한 뒤 오래 남지 않게 짧게(10~15분) 두고 묵은 것을 내주지 않는다
  if (ed && ed.state === 'open') res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=' + (r.persistent ? 600 : 900));
  else if (admin.ON) res.setHeader('Cache-Control', 'private, no-store');      // 관리자에게만 주는 응답 — 함께 쓰는 보관본에 두지 않는다(열쇠 없는 사람에게 보관본이 나가지 않게)
  else res.setHeader('Cache-Control', ed && ed.plan !== 'free' ? 'private, no-store' : 'public, max-age=0, s-maxage=' + (r.persistent ? 900 : 3600) + ', stale-while-revalidate=86400');
  const info = ed ? { storage: r.info.storage } : r.info;      // 상품판에는 서버 안쪽 기록을 내지 않는다
  res.status(200).json(Object.assign({ ok: true, generated_at: new Date().toISOString(), ledger: r.ledger, info: info }, ed ? edition.prune(r.out, ed.plan, ed) : r.out));
};
