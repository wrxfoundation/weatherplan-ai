// Natural Earth(world-atlas land-50m) → 동아시아 해안선(단순화) + 0.1° 육지 격자
const fs = require('fs');
const T = JSON.parse(fs.readFileSync('land-50m.json', 'utf8'));
const [sx, sy] = T.transform.scale, [tx, ty] = T.transform.translate;
const arcs = T.arcs.map(a => { let x = 0, y = 0; return a.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; }); });
const arc = i => (i >= 0 ? arcs[i] : arcs[~i].slice().reverse());
const ring = idx => { const pts = []; idx.forEach(i => { const a = arc(i); pts.push(...(pts.length ? a.slice(1) : a)); }); return pts; };
const BB = [115.0, 16.5, 140.0, 42.5];
const rings = [];
for (const g of T.objects.land.geometries) {
  const polys = g.type === 'MultiPolygon' ? g.arcs : [g.arcs];
  for (const poly of polys) poly.forEach((r, k) => {
    const pts = ring(r); const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    if (Math.max(...xs) < BB[0] || Math.min(...xs) > BB[2] || Math.max(...ys) < BB[1] || Math.min(...ys) > BB[3]) return;
    rings.push({ hole: k > 0, pts });
  });
}
function clip(pts, bb) {
  const inside = ([x, y], e) => [x >= bb[0], y >= bb[1], x <= bb[2], y <= bb[3]][e];
  const inter = ([x1, y1], [x2, y2], e) => {
    if (e === 0 || e === 2) { const X = e === 0 ? bb[0] : bb[2]; const t = (X - x1) / (x2 - x1); return [X, y1 + t * (y2 - y1)]; }
    const Y = e === 1 ? bb[1] : bb[3]; const t = (Y - y1) / (y2 - y1); return [x1 + t * (x2 - x1), Y];
  };
  let out = pts;
  for (let e = 0; e < 4 && out.length; e++) {
    const inp = out; out = [];
    for (let i = 0; i < inp.length; i++) {
      const cur = inp[i], prev = inp[(i - 1 + inp.length) % inp.length];
      if (inside(cur, e)) { if (!inside(prev, e)) out.push(inter(prev, cur, e)); out.push(cur); }
      else if (inside(prev, e)) out.push(inter(prev, cur, e));
    }
  }
  return out;
}
function dp(pts, eps) {
  if (pts.length < 3) return pts;
  const keep = new Array(pts.length).fill(false); keep[0] = keep[pts.length - 1] = true;
  const st = [[0, pts.length - 1]];
  while (st.length) {
    const [i, j] = st.pop(); if (j <= i + 1) continue;
    const [px, py] = pts[i], [qx, qy] = pts[j]; const dx = qx - px, dy = qy - py; const L = Math.hypot(dx, dy);
    let best = -1, bi = -1;
    for (let k = i + 1; k < j; k++) {
      const d = L > 0 ? Math.abs(dx * (pts[k][1] - py) - dy * (pts[k][0] - px)) / L : Math.hypot(pts[k][0] - px, pts[k][1] - py);
      if (d > best) { best = d; bi = k; }
    }
    if (best > eps) { keep[bi] = true; st.push([i, bi], [bi, j]); }
  }
  return pts.filter((_, k) => keep[k]);
}
const area = pts => Math.abs(pts.reduce((s, [x2, y2], i) => { const [x1, y1] = pts[(i - 1 + pts.length) % pts.length]; return s + x1 * y2 - x2 * y1; }, 0)) / 2;
const out = []; let npts = 0; const clipped = [];
for (const { hole, pts } of rings) {
  const c = clip(pts, BB); if (c.length < 4) continue;
  clipped.push({ hole, c });
  if (area(c) < 0.012) continue;
  const s = dp(c, 0.022); if (s.length < 4) continue;
  let px = 0, py = 0; const flat = [];
  for (const [x, y] of s) { const X = Math.round(x * 100), Y = Math.round(y * 100); flat.push(X - px, Y - py); px = X; py = Y; }
  out.push({ h: hole ? 1 : 0, d: flat }); npts += s.length;
}
fs.writeFileSync('coast.json', JSON.stringify(out));
console.log('rings', out.length, 'points', npts);
// 육지 격자
const LON0 = 115.0, LAT1 = 42.5, RES = 0.1;
const W = Math.round((BB[2] - BB[0]) / RES), H = Math.round((BB[3] - BB[1]) / RES);
const mask = new Uint8Array(W * H);
function pip(poly, x, y) {
  let ins = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}
for (const { hole, c } of clipped) {
  const xs = c.map(p => p[0]), ys = c.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const j0 = Math.max(0, Math.floor((x0 - LON0) / RES)), j1 = Math.min(W - 1, Math.ceil((x1 - LON0) / RES));
  const i0 = Math.max(0, Math.floor((LAT1 - y1) / RES)), i1 = Math.min(H - 1, Math.ceil((LAT1 - y0) / RES));
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
    const x = LON0 + RES * (j + 0.5), y = LAT1 - RES * (i + 0.5);
    if (pip(c, x, y)) mask[i * W + j] = hole ? 0 : 1;
  }
}
const rle = []; let cur = 0, n = 0;
for (const v of mask) { if (v === cur) n++; else { rle.push(n); cur = v; n = 1; } }
rle.push(n);
fs.writeFileSync('mask.json', JSON.stringify({ lon0: LON0, lat1: LAT1, res: RES, w: W, h: H, rle }));
console.log('mask', W, H, 'land', mask.reduce((a, b) => a + b, 0), 'rle', rle.length);
console.log('sizes', fs.statSync('coast.json').size, fs.statSync('mask.json').size);
const isl = (lo, la) => mask[Math.floor((LAT1 - la) / RES) * W + Math.floor((lo - LON0) / RES)];
for (const [nm, lo, la] of [['서울', 126.98, 37.57], ['부산', 129.08, 35.18], ['제주', 126.53, 33.5], ['후쿠오카', 130.4, 33.59], ['상하이', 121.47, 31.23], ['타이베이', 121.56, 25.03], ['나하', 127.68, 26.21], ['오사카', 135.5, 34.69], ['동중국해', 125.0, 29.0], ['동해', 131.0, 38.0]])
  console.log(nm, isl(lo, la));
