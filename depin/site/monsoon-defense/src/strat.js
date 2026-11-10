const M = require('./sim.js');
function run(plan, seed = 1, verbose = true) {
  const w = M.newWorld(); w.coins = 100; const spillAt = new Float32Array(M.N); let insuranceNet = 0;
  for (let day = 0; day < 5; day++) {
    for (const [type, x, y] of plan[day] || []) { const i = M.id(x, y); if (w.river[i] >= 0 || w.build[i]) continue; if (type !== 'levee' && w.houses.some(h => h.i === i)) { if (verbose) console.log(`  (D${day + 1} ${type} ${x},${y} 집 칸 — 불가)`); continue; } if (w.coins < M.COST[type]) { if (verbose) console.log(`  (D${day + 1} ${type} ${x},${y} 코인 부족)`); continue; } w.build[i] = type; w.coins -= M.COST[type]; }
    const wx = M.realize(day, seed); const acc = { rain: new Float32Array(M.N), pumped: 0, out: 0, spill: 0, lost: [] }; const steps = 480, dt = 24 / steps; let maxL = 0;
    for (let s = 0; s < steps; s++) { const before = w.d.slice(); M.step(w, wx, (s + 0.5) / steps, dt, acc); maxL = Math.max(maxL, ...w.L); }
    for (let i = 0; i < M.N; i++) w.d[i] *= 0.45; for (let k = 0; k < w.L.length; k++) w.L[k] = Math.min(w.L[k], 0.35 + (w.L[k] - 0.35) * 0.4);
    const st = M.settle(w, acc, day, true); w.coins += st.income - M.INS.premium; if (st.ins === 'paid') w.coins += M.INS.payout; if (st.ins === 'hold') w.coins += M.INS.premium;
    if (verbose) console.log(`D${day + 1} lost ${acc.lost.map(h => h.x + ',' + h.y).join(' ') || '-'} | intact ${st.intact} | riverMax ${maxL.toFixed(2)} spill ${acc.spill.toFixed(2)} pumped ${acc.pumped.toFixed(2)} | gauge ratio ${st.ratio == null ? '-' : st.ratio.toFixed(2)} town ${st.town.toFixed(0)}/${st.ftown.toFixed(0)}fc → ${st.ins} | coins ${w.coins}`);
  }
  return w.houses.filter(h => h.ok).length;
}
module.exports = { run };
// 기준 전략(합법 배치: 펌프·우량계는 집이 없는 칸): 저지대 옆 펌프 5대 + 강가 제방을 이어 쌓기 + 우량계 1
const REF = { 0: [['pump', 1, 9], ['gauge', 5, 8]], 1: [['pump', 8, 12], ['pump', 10, 7]], 2: [['pump', 6, 11], ['levee', 6, 9], ['levee', 6, 10]], 3: [['levee', 8, 10], ['levee', 9, 11], ['levee', 7, 11], ['levee', 8, 9], ['levee', 7, 8], ['levee', 9, 13], ['levee', 10, 13]], 4: [['pump', 8, 14], ['levee', 6, 6], ['levee', 5, 5], ['levee', 10, 15], ['levee', 9, 14], ['levee', 10, 12]] };
if (require.main === module) {
  const seeds = [1, 2, 3, 4, 5, 6, 7, 8];
  console.log('=== 기준 전략, 날씨 시드 1'); run(REF);
  console.log('지킨 집(시드 1~8) — 기준 전략:', seeds.map(s => run(REF, s, false)).join(' '), '| 아무것도 안 지음:', seeds.map(s => run({}, s, false)).join(' '));
}
