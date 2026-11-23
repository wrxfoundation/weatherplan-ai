'use strict';
// 상태를 불러와(저장소 → 없으면 배포에 든 출발 상태) 최신 원장까지 이어 받고, 화면용 자료를 만든다.
const core = require('./core');
const xrpl = require('./xrpl');
const store = require('./store');
const trace = require('./trace');
const { fetchExt, fetchHistory } = require('./ext');
const bundled = require('./snapshot-state.json');

const SHOW_BEFORE = process.env.SHOW_BEFORE === '1';   // 이전 풀 기간(10/2~24) 표를 화면에 낼지
const SHOW_ADDR = process.env.SHOW_ADDR === '1';       // 지갑 전체 주소를 응답에 넣을지(지갑 따라가 보기에서 원장 탐색기 링크가 열린다)

// opts.range = 날짜를 직접 정한 기간 · opts.daily = 매일 예약 실행(부정 쪽 지갑 자금 흐름을 새로 받기 시작한다)
async function run(opts) {
  const info = { storage: 'bundled' }, t0 = Date.now();
  let S = null;
  try {
    const got = await store.load();
    if (got && got.v === bundled.v && got.ledger >= bundled.ledger) { S = got; info.storage = 'blob'; }
  } catch (e) { info.storage_error = String((e && e.message) || e).slice(0, 160); }
  if (!S) S = JSON.parse(JSON.stringify(bundled));
  if (!S.fund && bundled.fund) S.fund = JSON.parse(JSON.stringify(bundled.fund));   // 예전에 저장한 상태에는 판매 대금 기록이 없다
  if (bundled.trace && (!S.trace || !S.trace.day || (!S.trace.job && S.trace.day < bundled.trace.day))) S.trace = JSON.parse(JSON.stringify(bundled.trace));   // 자금 흐름 기록: 배포에 든 것이 더 새것이면 그것부터
  if (bundled.trace && bundled.trace.dep && S.trace && !S.trace.dep) S.trace.dep = JSON.parse(JSON.stringify(bundled.trace.dep));   // 회사 계정에 들어온 돈: 저장된 상태에 없으면 배포에 든 것부터(되돌린 돈에 들어간다)

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
    // 부정 쪽 지갑 자금 흐름(하루 한 번). 이어 받으려면 저장소가 있어야 하므로 저장소가 있을 때만 새로 받는다 — 없으면 배포에 든 기록을 쓴다.
    //   새 날의 일은 예약 실행(opts.daily)이 시작한다. 화면 요청은 하다 만 것만 잠깐 잇고, 기록이 이틀 넘게 묵었을 때만 대신 시작한다(예약 실행이 빠진 경우)
    let trChanged = false;
    if (store.enabled() && u.complete) {
      try {
        const daily = !!(opts && opts.daily), today = core.kday(Math.floor(Date.now() / 1000) - 946684800);
        const old = !S.trace || !S.trace.day || (Date.parse(today) - Date.parse(S.trace.day)) / 86400000 >= 2;
        const budget = Math.min(daily ? 30000 : 5000, 52000 - (Date.now() - t0));
        if (budget >= 2000) { const t = await trace.update(S, { budgetMs: budget, start: daily || old }); trChanged = !!t.changed; info.trace = { fetched: t.fetched, done: t.done, left: t.left || 0 }; }
      } catch (e) { info.trace_error = String((e && e.message) || e).slice(0, 120); }
    }
    if (store.enabled() && (u.changed || info.live || info.fund_changed || mktChanged || trChanged)) {
      try { info.saved = await store.save(S); } catch (e) { info.storage_error = String((e && e.message) || e).slice(0, 160); }
    }
  } catch (e) {
    info.xrpl_error = String((e && e.message) || e).slice(0, 160);
    core.pickExt(S, ext);
  }
  const out = core.buildDatasets(S, { showBefore: SHOW_BEFORE, showAddr: SHOW_ADDR, range: opts && opts.range });      // range = 날짜를 직접 정한 기간(없으면 전체 · 30일 · 7일만)
  return { ledger: S.ledger, info, out, persistent: store.enabled() };
}
module.exports = { run };
