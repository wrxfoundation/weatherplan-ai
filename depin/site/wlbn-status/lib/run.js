'use strict';
// 상태를 불러와(저장소 → 없으면 배포에 든 출발 상태) 최신 원장까지 이어 받고, 화면용 자료를 만든다.
const core = require('./core');
const xrpl = require('./xrpl');
const store = require('./store');
const { fetchExt } = require('./ext');
const bundled = require('./snapshot-state.json');

const SHOW_BEFORE = process.env.SHOW_BEFORE === '1';   // 이전 풀 기간(10/2~24) 표를 화면에 낼지

async function run() {
  const info = { storage: 'bundled' };
  let S = null;
  try {
    const got = await store.load();
    if (got && got.v === bundled.v && got.ledger >= bundled.ledger) { S = got; info.storage = 'blob'; }
  } catch (e) { info.storage_error = String((e && e.message) || e).slice(0, 160); }
  if (!S) S = JSON.parse(JSON.stringify(bundled));

  const ext = await fetchExt().catch(() => null);
  core.setLabels(S, ext);
  try {
    const u = await xrpl.update(S, { budgetMs: 35000 });
    Object.assign(info, { updated: u.changed, fetched: u.fetched, complete: u.complete });
    core.pickExt(S, ext);
    if (store.enabled() && u.changed) {
      try { info.saved = await store.save(S); } catch (e) { info.storage_error = String((e && e.message) || e).slice(0, 160); }
    }
  } catch (e) {
    info.xrpl_error = String((e && e.message) || e).slice(0, 160);
    core.pickExt(S, ext);
  }
  const out = core.buildDatasets(S, { showBefore: SHOW_BEFORE });
  return { ledger: S.ledger, info, out, persistent: store.enabled() };
}
module.exports = { run };
