'use strict';
// POST /api/pay — 상품판의 RLUSD 결제(lib/pay.js). 상품판이 아니거나 결제를 켜지 않았으면 없는 주소다(404)
//   { action: 'order', plan, term }  → 주문(받는 주소 · 태그 · 금액 · 서명한 주문 글)
//   { action: 'check', order }       → 원장에서 그 주문의 입금을 찾는다. 찾으면 이용권
//   { action: 'demo',  order }       → 데모 결제(WATCH_PAY_DEMO=1 일 때만) — 30분짜리 이용권
// 주문 글은 본문으로만 받는다(주소에 붙이지 않는다). 응답은 보관하지 않는다
const edition = require('../lib/edition');
const pay = require('../lib/pay');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!edition.ON || !edition.payOn()) return res.status(404).json({ ok: false, error: 'off' });
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, error: 'method' }); }
  let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== 'object') return res.status(400).json({ ok: false, error: 'body' });
  try {
    if (b.action === 'order') { const o = pay.order(String(b.plan || ''), String(b.term || '')); return o ? res.status(200).json(Object.assign({ ok: true }, o)) : res.status(400).json({ ok: false, error: 'plan' }); }
    if (b.action === 'check') { const r = await pay.check(String(b.order || '')); return res.status(r.ok ? 200 : 400).json(r); }
    if (b.action === 'demo') { const r = pay.demoPay(String(b.order || '')); return res.status(r.ok ? 200 : r.error === 'off' ? 403 : 400).json(r); }
    return res.status(400).json({ ok: false, error: 'action' });
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'ledger' });      // 원장 서버가 답하지 않았다 — 화면이 잠시 뒤 다시 묻는다(서버 안쪽 사정은 내지 않는다)
  }
};
