'use strict';
// 상태를 불러와(저장소 → 없으면 배포에 든 출발 상태) 최신 원장까지 이어 받고, 화면용 자료를 만든다.
const core = require('./core');
const xrpl = require('./xrpl');
const store = require('./store');
const trace = require('./trace');
const edition = require('./edition');      // 상품판(EDITION=watch)이면 전체 주소 · 이전 풀 기간 · 자금 추적을 만들지 않는다
const { fetchExt, fetchHistory } = require('./ext');
const bundled = require('./snapshot-state.json');

const SHOW_BEFORE = process.env.SHOW_BEFORE === '1';   // 이전 풀 기간(10/2~24) 표를 화면에 낼지
const SHOW_ADDR = process.env.SHOW_ADDR === '1';       // 지갑 전체 주소를 응답에 넣을지(지갑 따라가 보기에서 원장 탐색기 링크가 열린다)

// opts.range = 날짜를 직접 정한 기간 · opts.daily = 매일 예약 실행(부정 쪽 지갑 자금 흐름을 새로 받기 시작한다)
async function run(opts) {
  const info = { storage: 'bundled' }, t0 = Date.now();
  // 함수 한도(60초) 안에 끝나게 단계마다 남은 시간으로 예산을 깎는다. 52초를 넘기지 않게 잡고, 화면용 자료를 만들고 저장할 시간을 남긴다
  const left = (reserve) => 52000 - (Date.now() - t0) - (reserve || 0);
  let S = null, loadFailed = false;
  try {
    const got = await store.load();
    if (got && got.v === bundled.v && got.ledger >= bundled.ledger) { S = got; info.storage = 'blob'; }
  } catch (e) { loadFailed = true; info.storage_error = String((e && e.message) || e).slice(0, 160); }      // 저장소를 못 읽었다: 이번에는 출발 상태로 보여 주기만 하고 저장하지 않는다(좋은 상태를 덮어쓰지 않게)
  if (!S) S = JSON.parse(JSON.stringify(bundled));
  if (!S.fund && bundled.fund) S.fund = JSON.parse(JSON.stringify(bundled.fund));   // 예전에 저장한 상태에는 판매 대금 기록이 없다
  if (bundled.trace && (!S.trace || !S.trace.day || (!S.trace.job && S.trace.day < bundled.trace.day))) S.trace = JSON.parse(JSON.stringify(bundled.trace));   // 자금 흐름 기록: 배포에 든 것이 더 새것이면 그것부터
  if (bundled.live && bundled.live.esc && S.live && !S.live.esc) S.live.esc = JSON.parse(JSON.stringify(bundled.live.esc));   // 잠금 해제 달력의 에스크로 목록: 저장된 상태에 없으면 배포에 든 것부터(다음 원장 갱신 때 다시 읽는다)
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
    const u = await xrpl.update(S, { budgetMs: Math.max(3000, Math.min(30000, left(12000))) });
    Object.assign(info, { updated: u.changed, fetched: u.fetched, complete: u.complete });
    core.pickExt(S, ext);
    // 판매 대금 기록(operations 계정 내역)도 같은 원장까지 이어 받는다. 못 받으면 그 고리만 「자료 없음」이 된다.
    try { const f = await xrpl.updateFund(S, { budgetMs: Math.max(1500, Math.min(10000, left(6000))) }); info.fund = { fetched: f.fetched, complete: f.complete }; if (f.changed) info.fund_changed = true; } catch (e) { info.fund_error = String((e && e.message) || e).slice(0, 120); }
    if (u.complete && (u.changed || !S.live) && left(3000) >= 1500) { try { info.live = await xrpl.fetchLive(S, { budgetMs: Math.min(8000, left(3000)) }); } catch (e) { info.live_error = String((e && e.message) || e).slice(0, 120); } }
    // 부정 쪽 지갑 자금 흐름(하루 한 번). 이어 받으려면 저장소가 있어야 하므로 저장소가 있을 때만 새로 받는다 — 없으면 배포에 든 기록을 쓴다.
    //   새 날의 일은 예약 실행(opts.daily)이 시작한다. 화면 요청은 하다 만 것만 잠깐 잇고, 기록이 이틀 넘게 묵었을 때만 대신 시작한다(예약 실행이 빠진 경우)
    // 원장까지 받은 것은 자금 흐름을 받기 전에 먼저 저장한다 — 뒤 단계가 한도에 걸려 끊겨도 여기까지는 남는다
    const canSave = store.enabled() && !loadFailed;
    if (canSave && (u.changed || info.live || info.fund_changed || mktChanged)) {
      try { info.saved = await store.save(S); } catch (e) { info.storage_error = String((e && e.message) || e).slice(0, 160); }
    }
    let trChanged = false;
    if (canSave && u.complete) {
      try {
        const daily = !!(opts && opts.daily), today = core.kday(Math.floor(Date.now() / 1000) - 946684800);
        const old = !S.trace || !S.trace.day || (Date.parse(today) - Date.parse(S.trace.day)) / 86400000 >= 2;
        const budget = Math.min(daily ? 30000 : 5000, left(4000));
        if (budget >= 2000) { const t = await trace.update(S, { budgetMs: budget, start: daily || old }); trChanged = !!t.changed; info.trace = { fetched: t.fetched, done: t.done, left: t.left || 0 }; }
      } catch (e) { info.trace_error = String((e && e.message) || e).slice(0, 120); }
    }
    if (canSave && trChanged) {
      try { info.saved = await store.save(S); } catch (e) { info.storage_error = String((e && e.message) || e).slice(0, 160); }
    }
  } catch (e) {
    info.xrpl_error = String((e && e.message) || e).slice(0, 160);
    core.pickExt(S, ext);
  }
  const out = core.buildDatasets(S, { showBefore: SHOW_BEFORE && !edition.ON, showAddr: SHOW_ADDR && !edition.ON, noTrace: edition.ON, range: opts && opts.range });      // range = 날짜를 직접 정한 기간(없으면 전체 · 30일 · 7일만)
  return { ledger: S.ledger, info, out, persistent: store.enabled() };
}
module.exports = { run };
