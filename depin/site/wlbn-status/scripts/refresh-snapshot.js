'use strict';
// 배포에 넣을 출발 상태를 지금 원장까지 당겨 놓는다(로컬에서 실행, 인터넷 필요).
//   node scripts/refresh-snapshot.js
const fs = require('fs'), path = require('path');
const core = require('../lib/core'), xrpl = require('../lib/xrpl');
const { fetchExt, fetchHistory } = require('../lib/ext');
const FILE = path.join(__dirname, '../lib/snapshot-state.json');
(async () => {
  const S = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const ext = await fetchExt();
  core.setLabels(S, ext);
  const u = await xrpl.update(S, { budgetMs: 240000 });
  core.pickExt(S, ext);
  const fu = await xrpl.updateFund(S, { budgetMs: 240000 });   // 판매 대금 기록(operations 계정 내역)
  console.log(JSON.stringify({ fund: fu }));
  const live = u.complete ? await xrpl.fetchLive(S, { budgetMs: 20000 }) : null;
  // 시장 비교 자료(주요 코인 10종 · 전체 시장)
  if (core.pickMarket(S, ext)) { if (S.mkt) S.mkt.tried = 0; const need = core.marketNeeds(S); if (need) { const got = await fetchHistory(need); for (const x of need) core.mergeHistory(S, x.sym, got[x.id]); S.mkt.tried = 0; } }
  fs.writeFileSync(FILE, JSON.stringify(S));
  const out = core.buildDatasets(JSON.parse(JSON.stringify(S)), {});
  fs.writeFileSync(path.join(__dirname, '../public/snapshot.json'), JSON.stringify(Object.assign({ ok: true, generated_at: null, ledger: S.ledger, info: { storage: 'snapshot' } }, out)));
  console.log(JSON.stringify({ update: u, live, as_of: out.summary[0].as_of, ledger: S.ledger, stateBytes: fs.statSync(FILE).size, fee: [out.summary[0].fee_r, out.summary[0].fee_x], lpShares: out.lpShares, accounts: out.ranges.all.accounts.map((a) => [a.name, a.rlusd, a.xrp]), prev7: out.ranges.d7.prev, lp_company_share: out.summary[0].lp_company_share, lp_user_share: out.summary[0].lp_user_share }, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
