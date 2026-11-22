'use strict';
// 상태를 불러와(저장소 → 없으면 배포에 든 출발 상태) 최신 원장까지 이어 받고, 화면용 자료를 만든다.
const core = require('./core');
const xrpl = require('./xrpl');
const store = require('./store');
const { fetchExt, fetchHistory } = require('./ext');
const bundled = require('./snapshot-state.json');

const SHOW_BEFORE = process.env.SHOW_BEFORE === '1';   // 이전 풀 기간(10/2~24) 표를 화면에 낼지
const SHOW_ADDR = process.env.SHOW_ADDR === '1';       // 지갑 전체 주소를 응답에 넣을지(지갑 따라가 보기에서 원장 탐색기 링크가 열린다)

async function run() {
  const info = { storage: 'bundled' };
  let S = null;
  try {
    const got = await store.load();
    if (got && got.v === bundled.v && got.ledger >= bundled.ledger) { S = got; info.storage = 'blob'; }
  } catch (e) { info.storage_error = String((e && e.message) || e).slice(0, 160); }
  if (!S) S = JSON.parse(JSON.stringify(bundled));
  if (!S.fund && bundled.fund) S.fund = JSON.parse(JSON.stringify(bundled.fund));   // 예전에 저장한 상태에는 판매 대금 기록이 없다

  const ext = await fetchExt().catch(() => null);
  core.setLabels(S, ext);
  // 시장 비교 자료(주요 코인 · 전체 시장). 배포에 든 일별 기록을 먼저 채우고, 모자란 날만 더 받는다. 못 받으면 마지막으로 받은 값을 쓴다
  let mktChanged = false;
  try {
    if (bundled.mkt) { if (!S.mkt) S.mkt = JSON.parse(JSON.stringify(bundled.mkt)); else for (const d of Object.keys(bundled.mkt.hist || {})) if (!(S.mkt.hist || (S.mkt.hist = {}))[d]) S.mkt.hist[d] = bundled.mkt.hist[d]; }
    if (core.pickMarket(S, ext)) {
      const need = core.marketNeeds(S);
      if (need) {
        S.mkt.tried = Date.now(); mktChanged = true;
        const got = await fetchHistory(need); let rows = 0; for (const x of need) rows += core.mergeHistory(S, x.sym, got[x.id]);
        info.market = { asked: need.length, rows };
      }
    }
  } catch (e) { info.market_error = String((e && e.message) || e).slice(0, 120); }
  try {
    const u = await xrpl.update(S, { budgetMs: 30000 });
    Object.assign(info, { updated: u.changed, fetched: u.fetched, complete: u.complete });
    core.pickExt(S, ext);
    // 판매 대금 기록(operations 계정 내역)도 같은 원장까지 이어 받는다. 못 받으면 그 고리만 「자료 없음」이 된다.
    try { const f = await xrpl.updateFund(S, { budgetMs: 10000 }); info.fund = { fetched: f.fetched, complete: f.complete }; if (f.changed) info.fund_changed = true; } catch (e) { info.fund_error = String((e && e.message) || e).slice(0, 120); }
    if (u.complete && (u.changed || !S.live)) { try { info.live = await xrpl.fetchLive(S, { budgetMs: 8000 }); } catch (e) { info.live_error = String((e && e.message) || e).slice(0, 120); } }
    if (store.enabled() && (u.changed || info.live || info.fund_changed || mktChanged)) {
      try { info.saved = await store.save(S); } catch (e) { info.storage_error = String((e && e.message) || e).slice(0, 160); }
    }
  } catch (e) {
    info.xrpl_error = String((e && e.message) || e).slice(0, 160);
    core.pickExt(S, ext);
  }
  const out = core.buildDatasets(S, { showBefore: SHOW_BEFORE, showAddr: SHOW_ADDR });
  return { ledger: S.ledger, info, out, persistent: store.enabled() };
}
module.exports = { run };
