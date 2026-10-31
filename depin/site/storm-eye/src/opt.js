// 언덕 오르기로 최선 배치 탐색: 점수 = 앙상블 평균 타격 수 (낮을수록 좋음)
const SIM = require('./sim.js'); SIM.loadMask(require('./mask.json'));
const B = SIM.BOUNDS; let S = 4242; const R = () => { S ^= S << 13; S ^= S >>> 17; S ^= S << 5; return ((S >>> 0) % 1e6) / 1e6; };
const gauss = () => Math.sqrt(-2 * Math.log(R() + 1e-9)) * Math.cos(6.2832 * R());
const clampLon = x => Math.max(B.lon0 + 0.3, Math.min(B.lon1 - 0.3, x)), clampLat = y => Math.max(B.lat0 + 0.3, Math.min(B.lat1 - 0.3, y));
const rt = type => ({ type, lon: B.lon0 + 0.5 + R() * (B.lon1 - B.lon0 - 1), lat: B.lat0 + 0.5 + R() * (B.lat1 - B.lat0 - 1) });
function score(L, pl) { const f = SIM.forecast(L, pl); return { s: f.members.reduce((a, m) => a + m.hit.length, 0) / f.members.length + (f.central.hit.length ? 0.5 : 0), clean: f.clean }; }
function optimize(L, restarts = 20, steps = 150) {
  const types = []; for (const k of ['H', 'L', 'S']) for (let i = 0; i < L.tools[k]; i++) types.push(k);
  let best = null;
  for (let r = 0; r < restarts; r++) {
    let pl = types.map(rt), cur = score(L, pl);
    for (let k = 0; k < steps; k++) {
      const i = Math.floor(R() * pl.length); const sig = k < steps / 2 ? 2.0 : 0.7;
      const np = pl.map((t, j) => (j === i ? { ...t, lon: clampLon(t.lon + gauss() * sig), lat: clampLat(t.lat + gauss() * sig) } : t));
      const ns = score(L, np); if (ns.s <= cur.s) { pl = np; cur = ns; }
    }
    if (!best || cur.s < best.s) best = { ...cur, pl };
  }
  return best;
}
module.exports = { optimize, score };
if (require.main === module) {
  const id = +process.argv[2]; const over = JSON.parse(process.argv[3] || '{}'); const life = JSON.parse(process.argv[4] || 'null');
  if (life) { SIM.LIFE.hold = life[0]; SIM.LIFE.fade = life[1]; }
  const L = { ...SIM.LEVELS[id - 1], ...over };
  const b = optimize(L, +(process.argv[5] || 16), 150);
  console.log(`L${id} ${JSON.stringify(over)} life ${SIM.LIFE.hold}/${SIM.LIFE.fade}: best ens mean hits ${b.s.toFixed(2)} clean ${(b.clean * 100).toFixed(0)}% :: ` + b.pl.map(t => `${t.type}(${t.lon.toFixed(1)},${t.lat.toFixed(1)})`).join(' '));
}
