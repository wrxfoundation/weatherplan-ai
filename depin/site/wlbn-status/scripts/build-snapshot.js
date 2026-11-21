'use strict';
// 내려받은 거래 내역(jsonl)으로 배포에 넣을 출발 상태를 만든다.
//   node scripts/build-snapshot.js <작업 폴더> [--nocut]
// 작업 폴더: dl/issuer_tx.jsonl · dl/amm_rlusd_tx.jsonl · dl/amm_xrp_tx.jsonl · ext/api_*.json · ext/dex.json
// (받는 법은 depin/tools/wlbn-cashout/README.md)
const fs = require('fs'), path = require('path'), readline = require('readline');
const core = require('../lib/core');
const D = process.argv[2], NOCUT = process.argv.includes('--nocut');
const FILES = ['dl/issuer_tx.jsonl', 'dl/amm_rlusd_tx.jsonl', 'dl/amm_xrp_tx.jsonl'].map((f) => path.join(D, f));
const rd = (f) => { try { return JSON.parse(fs.readFileSync(path.join(D, f), 'utf8')); } catch (_) { return null; } };

async function lastLedger(file) {
  let last = 0;
  for await (const line of readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity })) {
    if (!line) continue;
    const m = /"ledger_index":\s*(\d+)/.exec(line.slice(-4000)) || /"ledger_index":\s*(\d+)/.exec(line);
    if (m) last = Math.max(last, +m[1]);
  }
  return last;
}
async function* reader(file) {
  for await (const line of readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity })) {
    if (!line) continue;
    const n = core.normalize(JSON.parse(line));
    if (n) yield n;
  }
}
(async () => {
  const ends = [];
  for (const f of FILES) ends.push(await lastLedger(f));
  const cut = NOCUT ? Infinity : Math.min(...ends);
  const ext = { explorer: rd('ext/api_explorer.json'), network: rd('ext/api_network.json'), supply: rd('ext/api_supply.json'), fees: rd('ext/api_amm_fees.json'), dex: rd('ext/dex.json') };
  const S = core.newState();
  core.setLabels(S, ext);
  const its = FILES.map((f) => reader(f)[Symbol.asyncIterator]());
  const heads = await Promise.all(its.map((it) => it.next()));
  let n = 0, curLedger = -1, seen = new Set();
  for (;;) {
    let b = -1;
    for (let i = 0; i < heads.length; i++) {
      if (heads[i].done) continue;
      const v = heads[i].value;
      if (b < 0 || v.li < heads[b].value.li || (v.li === heads[b].value.li && v.ti < heads[b].value.ti)) b = i;
    }
    if (b < 0) break;
    const v = heads[b].value;
    heads[b] = await its[b].next();
    if (v.li > cut) continue;
    if (v.li !== curLedger) { curLedger = v.li; seen = new Set(); }
    if (seen.has(v.hash)) continue;
    seen.add(v.hash);
    core.applyTx(S, v.tx, v.meta); n++;
  }
  S.ledger = NOCUT ? Math.max(...ends) : cut;
  core.pickExt(S, ext);
  const full = core.buildDatasets(S, { showBefore: true, withAddress: true });
  console.log(JSON.stringify({ tx: n, ledger: S.ledger, summary: full.summary[0], all: { kpi: full.ranges.all.kpi, groups: full.ranges.all.groups, flow: full.ranges.all.flow, lp: full.ranges.all.lp, accounts: full.ranges.all.accounts }, d7: full.ranges.d7.kpi, positions: full.positions, before: full.before, wallets: full.ranges.all.wallets.length, daily: full.daily.length, lastDaily: full.daily[full.daily.length - 1] }, null, 1));
  if (!NOCUT) {
    fs.writeFileSync(path.join(__dirname, '../lib/snapshot-state.json'), JSON.stringify(S));
    console.error('state bytes', fs.statSync(path.join(__dirname, '../lib/snapshot-state.json')).size, 'ev', Object.keys(S.ev).length, 'accounts', Object.keys(S.bal).length);
  }
})().catch((e) => { console.error(e); process.exit(1); });
