// 균형 점검: 봇 셋(가만히 · 무작위 · 욕심쟁이)으로 여러 판 돌려 ACE · 최저기압 · 종료 사유 분포를 본다
// node tune.js [판 수] [봇]
const TG = require('./sim.js');
TG.buildMask(TG.decodeCoast(require('./coast.json')));
const N = +process.argv[2] || 40, only = process.argv[3];
function botIdle() { return [0, 0]; }
function botRand(g) { if (!g._d || g.r() < 0.02) { const a = g.r() * 6.28; g._d = [Math.cos(a), Math.sin(a)]; } return g._d; }
function botGreedy(g) {
  let best = null, bs = -1;
  for (const it of g.items) {
    if (it.st || it.s > TG.T.eat * g.R) continue;
    const d = Math.hypot(it.x - g.x, it.y - g.y);
    const pot = TG.clamp((TG.sst(g, it.x, it.y) - 26) / 3.6, 0, 1) * (1 - TG.shear(g, it.x, it.y)) * (TG.isLand(it.x, it.y) ? 0 : 1);
    const sc = (it.s / g.R) ** 2 * (0.2 + pot) / (d + g.R);
    if (sc > bs) { bs = sc; best = it; }
  }
  let ix = 0, iy = 0;
  if (best) { const d = Math.hypot(best.x - g.x, best.y - g.y) || 1; ix = (best.x - g.x) / d; iy = (best.y - g.y) / d; }
  // 위험 회피: 앞쪽 3 R 에서 잠재 강도가 떨어지면 남동쪽으로
  const lx = g.x + g.vx * 2, ly = g.y + g.vy * 2;
  const pAhead = TG.clamp((TG.sst(g, lx, ly) - 26) / 3.6, 0, 1) * (1 - TG.shear(g, lx, ly)) * (1 - TG.landFrac(lx, ly, 1));
  if (pAhead < 0.55) { ix += 0.4; iy -= 1.0; }
  if (g.y > 24) iy -= 0.8; if (g.y < 8) iy += 1;
  return [ix, iy];
}
const BOTS = { idle: botIdle, rand: botRand, greedy: botGreedy };
for (const [name, bot] of Object.entries(BOTS)) {
  if (only && only !== name) continue;
  const res = [];
  for (let s = 1; s <= N; s++) {
    const g = TG.newGame(s * 7919);
    const dt = 1 / 30; let firstTS = null, firstSuper = null;
    while (!g.over) { const [ix, iy] = bot(g); TG.step(g, ix, iy, dt); g.events.length = 0; if (firstTS === null && g.I >= TG.GRADES[2].min) firstTS = g.t; if (firstSuper === null && g.I >= TG.GRADES[6].min) firstSuper = g.t; }
    res.push({ ace: g.ace, p: TG.pres(g.peakI), R: g.peakR, eat: g.eaten, end: g.end, t: g.t, land: g.landfall, ts: firstTS, sup: firstSuper, big: g.bigHits, st: TG.stars(g.ace) });
  }
  const q = (a, f) => { const v = a.map(f).sort((x, y) => x - y); return [0.1, 0.5, 0.9].map(p => v[Math.floor(p * (v.length - 1))]); };
  const fmt = a => a.map(v => v == null ? '-' : (+v).toFixed(1)).join(' / ');
  const ends = {}; res.forEach(r => ends[r.end] = (ends[r.end] || 0) + 1);
  const st = [0, 0, 0, 0]; res.forEach(r => st[r.st]++);
  console.log(`[${name}] ACE p10/50/90 ${fmt(q(res, r => r.ace))} · 최저hPa ${fmt(q(res, r => r.p))} · 최대R ${fmt(q(res, r => r.R))} · 삼킴 ${fmt(q(res, r => r.eat))} · 부딪힘 ${fmt(q(res, r => r.big))}`);
  console.log(`   끝 ${JSON.stringify(ends)} · 상륙 ${res.filter(r => r.land).length}/${N} · 태풍까지 h ${fmt(q(res.filter(r => r.ts != null), r => r.ts))} · 초강력 도달 ${res.filter(r => r.sup != null).length} (h ${fmt(q(res.filter(r => r.sup != null), r => r.sup))}) · 별0~3 ${st.join('/')}`);
}
