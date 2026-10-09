// 균형: 봇 셋(곧장 · 바람 보정 · 보정+약한 쪽 진입)으로 태풍 셋을 여러 번 날려 기체 부하 · 측정 오차 · 별을 본다. node tune.js [판 수]
const TE = require('./sim.js');
const N = +process.argv[2] || 40; const DROPW = +process.argv[3] || 0.25;
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
function steerTo(F, tx, tn, crab) {
  let want = Math.atan2(tn - F.n, tx - F.x);
  if (crab) { const [wx, wn] = TE.wind(F.S, F.x, F.n); const dx = tx - F.x, dn = tn - F.n, L = Math.hypot(dx, dn) || 1; // 옆바람 보정
    const cross = (wx * -dn + wn * dx) / L; want += Math.asin(TE.clamp(-cross / TE.T.airspeed, -0.9, 0.9)); }
  return TE.clamp(-wrap(want - F.hdg) * 2.2, -1, 1);
}
const BOTS = {
  straight: F => steerTo(F, 0, 0, false),
  crab: F => steerTo(F, 0, 0, true),
  weakside: F => { const S = F.S, r = Math.hypot(F.x, F.n); if (r > 2.2 * S.rm) { const a = S.moveAng - Math.PI / 4 + Math.PI; return steerTo(F, Math.cos(a) * 1.8 * S.rm, Math.sin(a) * 1.8 * S.rm, true); } return steerTo(F, 0, 0, true); },
};
for (const P of TE.PRESETS) for (const [name, bot] of Object.entries(BOTS)) {
  const out = [];
  for (let s = 1; s <= N; s++) {
    const S = TE.makeStorm({ pc: P.pc, rm: P.rm, seed: s * 97 }); const F = TE.newFlight(S, s);
    const dt = 1 / 30; let dropped = 0;
    while (!F.over) {
      TE.step(F, bot(F), dt); F.events.length = 0;
      const r = Math.hypot(F.x, F.n);
      if (F.sondes > 0 && F.phase === 'eye' && F.ws < DROPW * S.vFL && !dropped) { TE.drop(F); dropped = 1; }
      if (F.sondes > 0 && dropped && F.drops[0].done) TE.drop(F);
    }
    const g = TE.grade(F); out.push({ hull: F.hull, err: g.err, st: g.stars, t: F.t, end: F.end, mw: F.maxWind / F.S.vFL });
  }
  const q = (f, p) => { const v = out.map(f).filter(x => x != null).sort((a, b) => a - b); return v.length ? v[Math.floor(p * (v.length - 1))].toFixed(1) : '-'; };
  const st = [0, 0, 0, 0]; out.forEach(o => st[o.st]++); const ends = {}; out.forEach(o => ends[o.end] = (ends[o.end] || 0) + 1);
  console.log(`${P.name.padEnd(4)} ${name.padEnd(8)} 부하 ${q(o => o.hull, .1)}/${q(o => o.hull, .5)}/${q(o => o.hull, .9)}% · 오차 ${q(o => o.err, .5)}hPa · 시간 ${q(o => o.t, .5)}s · 별 ${st.join('/')} · ${JSON.stringify(ends)}`);
}
