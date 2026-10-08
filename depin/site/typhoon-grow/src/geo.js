// Natural Earth(world-atlas land-50m, 퍼블릭 도메인) → 북서태평양 해안선(단순화, 0.01° 정수 델타)
// 실행: world-atlas 패키지의 land-50m.json 을 같은 폴더에 두고 node geo.js (원본은 저장소에 넣지 않음)
const fs = require('fs');
const T = JSON.parse(fs.readFileSync(process.argv[2] || 'land-50m.json', 'utf8'));
const [sx, sy] = T.transform.scale, [tx, ty] = T.transform.translate;
const arcs = T.arcs.map(a => { let x = 0, y = 0; return a.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; }); });
const arc = i => (i >= 0 ? arcs[i] : arcs[~i].slice().reverse());
const ring = idx => { const pts = []; idx.forEach(i => { const a = arc(i); pts.push(...(pts.length ? a.slice(1) : a)); }); return pts; };
const BB = [96.0, -8.0, 184.0, 54.0];
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
const out = []; let npts = 0;
for (const g of T.objects.land.geometries) {
  const polys = g.type === 'MultiPolygon' ? g.arcs : [g.arcs];
  for (const poly of polys) poly.forEach((r, k) => {
    let pts = ring(r);
    // 날짜변경선 너머(서경)는 +360 으로 옮겨 이어 붙인다
    { const hasE = pts.some(p => p[0] > 150), hasW = pts.some(p => p[0] < -150), maxX = Math.max(...pts.map(p => p[0]));
      if (hasE && hasW) pts = pts.map(([x, y]) => [x < -100 ? x + 360 : x, y]);
      else if (maxX < -150) pts = pts.map(([x, y]) => [x + 360, y]); }
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    if (Math.max(...xs) < BB[0] || Math.min(...xs) > BB[2] || Math.max(...ys) < BB[1] || Math.min(...ys) > BB[3]) return;
    const c = clip(pts, BB); if (c.length < 4) return;
    if (area(c) < 0.003) return;
    const s = dp(c, 0.025); if (s.length < 4) return;
    let px = 0, py = 0; const flat = [];
    for (const [x, y] of s) { const X = Math.round(x * 100), Y = Math.round(y * 100); flat.push(X - px, Y - py); px = X; py = Y; }
    out.push(k > 0 ? { h: 1, d: flat } : { d: flat }); npts += s.length;
  });
}
fs.writeFileSync('coast.json', JSON.stringify(out));
console.log('rings', out.length, 'points', npts, 'bytes', fs.statSync('coast.json').size);
