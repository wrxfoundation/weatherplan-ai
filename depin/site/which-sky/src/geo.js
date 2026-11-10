// Natural Earth(world-atlas land-110m) → 세계 육지 고리(0.1° 정수 델타 부호화) — 지구본 육지 텍스처용
const fs = require('fs');
const T = JSON.parse(fs.readFileSync('land-110m.json', 'utf8'));
const [sx, sy] = T.transform.scale, [tx, ty] = T.transform.translate;
const arcs = T.arcs.map(a => { let x = 0, y = 0; return a.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; }); });
const arc = i => (i >= 0 ? arcs[i] : arcs[~i].slice().reverse());
const ring = idx => { const pts = []; idx.forEach(i => { const a = arc(i); pts.push(...(pts.length ? a.slice(1) : a)); }); return pts; };
function dp(pts, eps) {
  if (pts.length < 4) return pts;
  const keep = new Array(pts.length).fill(false); keep[0] = keep[pts.length - 1] = true; const st = [[0, pts.length - 1]];
  while (st.length) {
    const [i, j] = st.pop(); if (j <= i + 1) continue;
    const [px, py] = pts[i], [qx, qy] = pts[j]; const dx = qx - px, dy = qy - py; const L = Math.hypot(dx, dy); let best = -1, bi = -1;
    for (let k = i + 1; k < j; k++) { const d = L > 0 ? Math.abs(dx * (pts[k][1] - py) - dy * (pts[k][0] - px)) / L : Math.hypot(pts[k][0] - px, pts[k][1] - py); if (d > best) { best = d; bi = k; } }
    if (best > eps) { keep[bi] = true; st.push([i, bi], [bi, j]); }
  }
  return pts.filter((_, k) => keep[k]);
}
const out = []; let n = 0;
for (const g of T.objects.land.geometries) {
  const polys = g.type === 'MultiPolygon' ? g.arcs : [g.arcs];
  for (const poly of polys) poly.forEach((r, k) => {
    const s = dp(ring(r), 0.08); if (s.length < 4) return;
    let px = 0, py = 0; const d = [];
    for (const [x, y] of s) { const X = Math.round(x * 10), Y = Math.round(y * 10); d.push(X - px, Y - py); px = X; py = Y; }
    out.push(k > 0 ? { h: 1, d } : { d }); n += s.length;
  });
}
fs.writeFileSync('land.json', JSON.stringify(out));
console.log('rings', out.length, 'points', n, 'bytes', fs.statSync('land.json').size);
