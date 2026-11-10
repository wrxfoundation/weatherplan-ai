// 단일 도구 해 영역 지도(0.5° 격자): '#'=중앙 예보 0타격, '+'=앙상블 90%+ 무사, '.'=실패, 'o'=시작점
const SIM = require('./sim.js'); const fs = require('fs');
SIM.loadMask(JSON.parse(fs.readFileSync('mask.json', 'utf8')));
const B = SIM.BOUNDS; const id = +process.argv[2]; const type = process.argv[3] || 'H';
const L = SIM.LEVELS.find(l => l.id === id); const fixed = JSON.parse(process.argv[4] || '[]');
let ok = 0, ens = 0, n = 0; const rows = [];
for (let lat = B.lat1 - 0.5; lat >= B.lat0; lat -= 0.75) {
  let row = '';
  for (let lon = B.lon0 + 0.25; lon < B.lon1; lon += 0.5) {
    n++; const pl = [...fixed, { type, lon, lat }];
    const c = SIM.simulate(L, pl);
    let ch = '.';
    if (!c.hit.length) { ok++; ch = '#'; if (SIM.forecast(L, pl).clean >= 0.9) { ens++; ch = '+'; } }
    if (Math.abs(lon - L.start.lon) < 0.3 && Math.abs(lat - L.start.lat) < 0.4) ch = 'o';
    if (SIM.isLand(lon, lat) && ch === '.') ch = ',';
    row += ch;
  }
  rows.push(lat.toFixed(1).padStart(5) + ' ' + row);
}
console.log(rows.join('\n'));
console.log(`central 0-hit ${(ok / n * 100).toFixed(1)}%  ens≥90% ${(ens / n * 100).toFixed(1)}%`);
