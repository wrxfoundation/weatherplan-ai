const SIM = require('./sim.js'); const fs = require('fs');
SIM.loadMask(JSON.parse(fs.readFileSync('mask.json', 'utf8')));
const B = SIM.BOUNDS; let S = 12345; const R = () => { S ^= S << 13; S ^= S >>> 17; S ^= S << 5; return ((S >>> 0) % 1e6) / 1e6; };
const only = process.argv[2] ? +process.argv[2] : 0; const tries = +(process.argv[3] || 3000);
function randTool(type) { return { type, lon: B.lon0 + 0.5 + R() * (B.lon1 - B.lon0 - 1), lat: B.lat0 + 0.5 + R() * (B.lat1 - B.lat0 - 1) }; }
const fmt = pl => pl.map(t => `${t.type}(${t.lon.toFixed(1)},${t.lat.toFixed(1)})`).join(' ');
for (const L of SIM.LEVELS) {
  if (only && L.id !== only) continue;
  const f0 = SIM.forecast(L, []); const c0 = f0.central; const last = c0.track[c0.track.length - 1];
  const pts = c0.track.filter(p => p.t % 12 === 0).map(p => `${p.t}(${p.lon.toFixed(1)},${p.lat.toFixed(1)} ${p.I.toFixed(2)}${p.land ? 'L' : ''})`).join(' ');
  const types = []; for (const k of ['H', 'L', 'S']) for (let i = 0; i < L.tools[k]; i++) types.push(k);
  let solved = 0; const cands = [];
  for (let n = 0; n < tries; n++) { const pl = types.map(randTool); const r = SIM.simulate(L, pl); if (!r.hit.length) { solved++; if (cands.length < 300) cands.push(pl); } }
  let best = null, bestC = -1, good = 0;
  for (const pl of cands) { const f = SIM.forecast(L, pl); if (f.clean >= 0.9) good++; if (f.clean > bestC) { bestC = f.clean; best = pl; } }
  const ensAvg = f0.members.reduce((s, m) => s + m.hit.length, 0) / f0.members.length;
  console.log(`L${L.id} ${L.title}: base [${c0.hit}] end=${c0.end}@${last.t}h | ens avg hits ${ensAvg.toFixed(1)} clean ${(f0.clean * 100).toFixed(0)}% | random 3★ ${(solved / tries * 100).toFixed(1)}% | best ens ${(bestC * 100).toFixed(0)}% (≥90%: ${good}/${cands.length})`);
  console.log('   ' + pts);
  if (best) {
    console.log('   best: ' + fmt(best));
    // 골짜기 폭: 나머지 도구 고정, 하나씩 0.5° 격자 스캔
    for (let i = 0; i < best.length; i++) {
      let ok = 0, n = 0;
      for (let lon = B.lon0 + 0.25; lon < B.lon1; lon += 0.5) for (let lat = B.lat0 + 0.25; lat < B.lat1; lat += 0.5) {
        const pl = best.map((t, j) => (j === i ? { ...t, lon, lat } : t)); n++;
        if (!SIM.simulate(L, pl).hit.length) ok++;
      }
      console.log(`   valley ${best[i].type}#${i}: central-0hit area ${(ok / n * 100).toFixed(1)}%`);
    }
  }
}
