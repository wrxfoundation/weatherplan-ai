(() => {
  'use strict';
  const M = window.MSIM; const $ = s => document.querySelector(s);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const reduceMotion = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
  const KEY = 'monsoon.v1'; let best = {};
  try { const v = JSON.parse(localStorage.getItem(KEY) || '{}'); if (v && typeof v === 'object') best = v; } catch (e) { best = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(best)); } catch (e) { /* 저장 불가 환경 */ } };
  const STEPS = 480, DAY_SEC = 38; // 하루 = 480걸음, 보통 속도로 약 38초
  const NAMES = { pump: '펌프', levee: '제방', gauge: '우량계' };

  // ── 상태
  let G;
  function newGame() {
    G = { w: M.newWorld(), day: 0, phase: 'plan', tool: null, insured: false, seed: (Math.random() * 1e9) | 0, speed: 1, p: 0, acc: null, wx: null, F: M.forecastTotals(0), reports: [], pulses: [], drops: [], stepCarry: 0, lostSeen: 0, peak: 0 };
    G.w.coins = 100; $('#report').classList.remove('on'); renderAll();
  }

  // ── 캔버스
  const cv = $('#cv'), ctx = cv.getContext('2d'); let Wp = 0, Hp = 0, T = 0, DPR = 1;
  const low = document.createElement('canvas'); low.width = M.W; low.height = M.H; const lctx = low.getContext('2d');
  function resize() {
    const r = $('#map').getBoundingClientRect(); if (!r.width) return; DPR = Math.min(2, window.devicePixelRatio || 1);
    Wp = r.width; Hp = r.height; T = Wp / M.W; cv.width = Math.round(Wp * DPR); cv.height = Math.round(Hp * DPR); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); terrainCache = null;
  }
  // 지형 색(높이 + 언덕 그림자)
  const TER = [[0, [62, 104, 64]], [1.8, [82, 126, 72]], [3.5, [108, 138, 80]], [6, [138, 140, 90]], [9, [150, 138, 104]], [13, [160, 150, 128]]];
  function terColor(h) { for (let k = 1; k < TER.length; k++) if (h <= TER[k][0]) { const [h0, c0] = TER[k - 1], [h1, c1] = TER[k]; const t = (h - h0) / (h1 - h0); return c0.map((v, i) => v + (c1[i] - v) * t); } return TER[TER.length - 1][1]; }
  let terrainCache = null;
  function terrain() {
    if (terrainCache) return terrainCache; const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; const x = c.getContext('2d'); x.setTransform(DPR, 0, 0, DPR, 0, 0);
    const { h, river } = G.w; const H_ = (X, Y) => h[M.id(clamp(X, 0, M.W - 1), clamp(Y, 0, M.H - 1))];
    for (let y = 0; y < M.H; y++) for (let X = 0; X < M.W; X++) {
      const i = M.id(X, y); if (river[i] >= 0) continue;
      const sx = (H_(X + 1, y) - H_(X - 1, y)) / 2, sy = (H_(X, y + 1) - H_(X, y - 1)) / 2; const n = [-sx, -sy, 1.4]; const L = [-0.62, -0.62, 0.48];
      const shade = clamp((n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) / Math.hypot(...n) / Math.hypot(...L), 0.3, 1.2);
      const col = terColor(h[i]).map(v => clamp(v * (0.55 + 0.5 * shade), 0, 255)); x.fillStyle = `rgb(${col.map(Math.round).join(',')})`; x.fillRect(X * T, y * T, T + 0.5, T + 0.5);
      const g = M.hash(X, y, 11); if (g > 0.55 && h[i] > 4) { x.fillStyle = 'rgba(30,50,34,0.35)'; for (let k = 0; k < 3; k++) { const a = M.hash(X, y, 20 + k), b = M.hash(X, y, 30 + k); x.beginPath(); x.arc(X * T + (0.2 + 0.6 * a) * T, y * T + (0.2 + 0.6 * b) * T, T * 0.09, 0, 6.3); x.fill(); } }
    }
    x.strokeStyle = 'rgba(0,0,0,0.10)'; x.lineWidth = 1; for (let k = 1; k < M.W; k++) { x.beginPath(); x.moveTo(k * T + 0.5, 0); x.lineTo(k * T + 0.5, Hp); x.stroke(); } for (let k = 1; k < M.H; k++) { x.beginPath(); x.moveTo(0, k * T + 0.5); x.lineTo(Wp, k * T + 0.5); x.stroke(); }
    terrainCache = c; return c;
  }
  // 레이더 색(시간당 강수)·하루 강수 색
  const RADAR = [[0.5, [140, 200, 255]], [5, [63, 155, 255]], [10, [63, 203, 95]], [20, [242, 227, 75]], [30, [243, 156, 51]], [50, [232, 69, 60]], [70, [166, 74, 209]]];
  function radar(v) { if (v < RADAR[0][0]) return null; for (let k = RADAR.length - 1; k >= 0; k--) if (v >= RADAR[k][0]) return RADAR[k][1]; return null; }
  const DAILY = [10, 40, 80, 120, 160, 220, 300];
  function dailyCol(mm) { let k = -1; for (let i = 0; i < DAILY.length; i++) if (mm >= DAILY[i]) k = i; return k < 0 ? null : RADAR[k][1]; }

  function nearestRiver(x, y) { let best = 0, bd = 1e9; M.RIVER.forEach(([rx, ry], k) => { const d = Math.hypot(rx - x, ry - y); if (d < bd) { bd = d; best = k; } }); return M.RIVER[best]; }
  function draw(now) {
    if (!T) return; const c = ctx; const w = G.w; c.clearRect(0, 0, Wp, Hp);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(terrain(), 0, 0); c.restore();
    // 강
    for (const [x, y] of M.RIVER) { c.fillStyle = '#4C6B4A'; c.fillRect(x * T, y * T, T + 0.5, T + 0.5); }
    const pts = [[M.RIVER[0][0] + 0.5, -0.3], ...M.RIVER.map(([x, y]) => [x + 0.5, y + 0.5]), [M.RIVER[M.RIVER.length - 1][0] + 0.9, M.H + 0.3]];
    const riverPath = () => { c.beginPath(); c.moveTo(pts[0][0] * T, pts[0][1] * T); for (let k = 1; k < pts.length - 1; k++) { const mx = (pts[k][0] + pts[k + 1][0]) / 2, my = (pts[k][1] + pts[k + 1][1]) / 2; c.quadraticCurveTo(pts[k][0] * T, pts[k][1] * T, mx * T, my * T); } c.lineTo(pts[pts.length - 1][0] * T, pts[pts.length - 1][1] * T); };
    const Lm = Math.max(...w.L); const lv = clamp(Lm / 2, 0, 1); const over = Lm > M.BANK;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    riverPath(); c.strokeStyle = over ? 'rgba(240,100,90,0.55)' : 'rgba(20,40,34,0.45)'; c.lineWidth = T * (0.72 + 0.32 * lv) + 4; c.stroke();
    riverPath(); c.strokeStyle = `rgb(${Math.round(38 + 60 * lv)},${Math.round(104 + 50 * lv)},${Math.round(128 + 55 * lv)})`; c.lineWidth = T * (0.72 + 0.32 * lv); c.stroke();
    if (!reduceMotion) { riverPath(); c.setLineDash([T * 0.18, T * 0.55]); c.lineDashOffset = -now / 40; c.strokeStyle = 'rgba(220,240,255,0.22)'; c.lineWidth = Math.max(1, T * 0.06); c.stroke(); c.setLineDash([]); }
    c.restore();
    // 땅 위 물
    for (let i = 0; i < M.N; i++) { if (w.river[i] >= 0) continue; const d = w.d[i]; if (d < 0.01) continue; const x = i % M.W, y = (i / M.W) | 0; c.fillStyle = `rgba(70,150,232,${Math.min(0.85, 0.18 + (d / 0.45) * 0.67).toFixed(3)})`; c.fillRect(x * T, y * T, T + 0.5, T + 0.5); }
    // 예보(준비 단계) 또는 레이더(비 단계)
    const img = lctx.createImageData(M.W, M.H); let any = false;
    for (let y = 0; y < M.H; y++) for (let x = 0; x < M.W; x++) {
      const i = M.id(x, y); const col = G.phase === 'rain' ? radar(M.rainAt(G.wx, x, y, G.p)) : G.phase === 'plan' ? dailyCol(G.F[i]) : null; if (!col) continue; any = true;
      img.data.set([...col, G.phase === 'rain' ? 96 : Math.round(clamp((G.F[i] - 20) / 220, 0, 0.6) * 255)], i * 4);
    }
    if (any) { lctx.putImageData(img, 0, 0); c.save(); c.imageSmoothingEnabled = true; c.drawImage(low, 0, 0, Wp, Hp); c.restore(); }
    if (G.phase === 'plan') for (const cl of M.DAYS[G.day].cells) {
      const ax = (cl.x0 + 0.5) * T, ay = (cl.y0 + 0.5) * T, bx = (cl.x1 + 0.5) * T, by = (cl.y1 + 0.5) * T;
      c.save(); c.setLineDash([6, 5]); c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke(); c.setLineDash([]);
      const a = Math.atan2(by - ay, bx - ax); const mx = ax + (bx - ax) * 0.62, my = ay + (by - ay) * 0.62; c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.moveTo(mx + Math.cos(a) * 9, my + Math.sin(a) * 9); c.lineTo(mx + Math.cos(a + 2.5) * 8, my + Math.sin(a + 2.5) * 8); c.lineTo(mx + Math.cos(a - 2.5) * 8, my + Math.sin(a - 2.5) * 8); c.fill(); c.restore();
    }
    // 비구름·빗줄기
    if (G.phase === 'rain') {
      for (const cl of G.wx.cells) { if (G.p < cl.t0 || G.p > cl.t1) continue; const q = (G.p - cl.t0) / (cl.t1 - cl.t0); const cx = (cl.x0 + (cl.x1 - cl.x0) * q + 0.5) * T, cy = (cl.y0 + (cl.y1 - cl.y0) * q + 0.5) * T; const R = cl.r * T * 2.3; const g = c.createRadialGradient(cx, cy, 0, cx, cy, R); g.addColorStop(0, 'rgba(200,210,220,0.34)'); g.addColorStop(1, 'rgba(200,210,220,0)'); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R, 0, 6.3); c.fill(); }
      if (!reduceMotion) { c.strokeStyle = 'rgba(210,230,255,0.42)'; c.lineWidth = 1; c.beginPath(); for (const d of G.drops) { c.moveTo(d.x, d.y); c.lineTo(d.x - 2.5, d.y + 9); } c.stroke(); }
    }
    // 시설
    for (let i = 0; i < M.N; i++) {
      const b = w.build[i]; if (!b) continue; const x = i % M.W, y = (i / M.W) | 0; const cx = (x + 0.5) * T, cy = (y + 0.5) * T;
      if (b === 'levee') {
        c.save(); c.strokeStyle = '#B08A5A'; c.lineWidth = Math.max(3, T * 0.16); c.lineCap = 'round'; let edged = false;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= M.W || Y >= M.H || w.river[M.id(X, Y)] < 0) continue; edged = true; const ex = dx === 1 ? (x + 1) * T : dx === -1 ? x * T : null, ey = dy === 1 ? (y + 1) * T : dy === -1 ? y * T : null; c.beginPath(); if (ex != null) { c.moveTo(ex - dx * 3, y * T + 3); c.lineTo(ex - dx * 3, (y + 1) * T - 3); } else { c.moveTo(x * T + 3, ey - dy * 3); c.lineTo((x + 1) * T - 3, ey - dy * 3); } c.stroke(); }
        if (!edged) { c.fillStyle = '#B08A5A'; c.beginPath(); c.moveTo(cx - T * 0.3, cy + T * 0.18); c.lineTo(cx - T * 0.12, cy - T * 0.16); c.lineTo(cx + T * 0.12, cy - T * 0.16); c.lineTo(cx + T * 0.3, cy + T * 0.18); c.fill(); }
        c.restore();
      } else if (b === 'pump') {
        const [rx, ry] = nearestRiver(x, y); const a = Math.atan2(ry - y, rx - x); const R = T * 0.3;
        c.save(); c.fillStyle = '#0F3A3A'; c.strokeStyle = '#4FD1C5'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, R, 0, 6.3); c.fill(); c.stroke();
        c.strokeStyle = '#E7EEF0'; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - Math.cos(a) * R * 0.5, cy - Math.sin(a) * R * 0.5); c.lineTo(cx + Math.cos(a) * R * 0.55, cy + Math.sin(a) * R * 0.55); c.stroke();
        c.beginPath(); c.moveTo(cx + Math.cos(a) * R * 0.55, cy + Math.sin(a) * R * 0.55); c.lineTo(cx + Math.cos(a + 2.4) * R * 0.3 + Math.cos(a) * R * 0.3, cy + Math.sin(a + 2.4) * R * 0.3 + Math.sin(a) * R * 0.3); c.moveTo(cx + Math.cos(a) * R * 0.55, cy + Math.sin(a) * R * 0.55); c.lineTo(cx + Math.cos(a - 2.4) * R * 0.3 + Math.cos(a) * R * 0.3, cy + Math.sin(a - 2.4) * R * 0.3 + Math.sin(a) * R * 0.3); c.stroke();
        if (G.phase === 'rain' && !reduceMotion) { let wet = 0; for (let yy = y - 1; yy <= y + 1; yy++) for (let xx = x - 1; xx <= x + 1; xx++) if (xx >= 0 && yy >= 0 && xx < M.W && yy < M.H) wet += w.d[M.id(xx, yy)]; if (wet > 0.02) { c.strokeStyle = 'rgba(79,209,197,0.55)'; c.setLineDash([3, 4]); c.lineDashOffset = -now / 60; c.beginPath(); c.arc(cx, cy, R + 4, 0, 6.3); c.stroke(); } }
        c.restore();
      } else if (b === 'gauge') {
        const mm = G.acc ? G.acc.rain[i] : 0; const f = G.F[i] || 1; const fill = clamp(mm / Math.max(1, f * 1.3), 0, 1);
        c.save(); const gw = T * 0.26, gh = T * 0.58; c.fillStyle = 'rgba(10,18,22,0.85)'; c.strokeStyle = '#F3F6F7'; c.lineWidth = 1.6; c.beginPath(); c.rect(cx - gw / 2, cy - gh / 2, gw, gh); c.fill(); c.stroke();
        c.fillStyle = '#58A6FF'; c.fillRect(cx - gw / 2 + 2, cy + gh / 2 - 2 - (gh - 4) * fill, gw - 4, (gh - 4) * fill);
        const fy = cy + gh / 2 - 2 - (gh - 4) * clamp(1 / 1.3, 0, 1); c.strokeStyle = '#F2B33D'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx - gw / 2 - 2, fy); c.lineTo(cx + gw / 2 + 2, fy); c.stroke();
        if (T >= 26 && G.acc) { c.font = `500 ${Math.max(9, T * 0.24)}px 'IBM Plex Mono', monospace`; c.textAlign = 'center'; c.textBaseline = 'top'; c.lineWidth = 3; c.strokeStyle = 'rgba(8,14,16,0.9)'; c.strokeText(Math.round(mm), cx, cy + gh / 2 + 1); c.fillStyle = '#F3F6F7'; c.fillText(Math.round(mm), cx, cy + gh / 2 + 1); }
        c.restore();
      }
    }
    // 집
    for (const hs of w.houses) {
      const cx = (hs.x + 0.5) * T, cy = (hs.y + 0.55) * T; const s = T * 0.24;
      c.save(); c.fillStyle = hs.ok ? '#EDE6D6' : '#7E7A73'; c.fillRect(cx - s, cy - s * 0.2, s * 2, s * 1.1);
      c.fillStyle = hs.ok ? '#D5573B' : '#5B4F4B'; c.beginPath(); c.moveTo(cx - s * 1.25, cy - s * 0.15); c.lineTo(cx, cy - s * 1.2); c.lineTo(cx + s * 1.25, cy - s * 0.15); c.closePath(); c.fill();
      c.fillStyle = hs.ok ? '#3B4A52' : '#4E5A60'; c.fillRect(cx - s * 0.28, cy + s * 0.35, s * 0.56, s * 0.55);
      if (!hs.ok) { c.strokeStyle = '#8CCBFF'; c.lineWidth = 1.6; c.beginPath(); for (let k = 0; k <= 8; k++) { const px = cx - s * 1.2 + (k / 8) * s * 2.4, py = cy + s * 1.0 + Math.sin(k * 1.6) * 2; k ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); }
      const wd = w.d[hs.i]; if (hs.ok && wd > 0.12) { c.strokeStyle = wd > 0.22 ? '#F0645A' : '#F2B33D'; c.lineWidth = 2; c.strokeRect(hs.x * T + 2, hs.y * T + 2, T - 4, T - 4); }
      c.restore();
    }
    for (const pu of G.pulses) { const age = (now - pu.at) / 1000; if (age > 1.5) continue; c.save(); c.globalAlpha = 1 - age / 1.5; c.strokeStyle = '#F0645A'; c.lineWidth = 2.5; c.beginPath(); c.arc((pu.x + 0.5) * T, (pu.y + 0.5) * T, T * 0.4 + age * T * 1.2, 0, 6.3); c.stroke(); c.restore(); }
    if (G.hover && G.phase !== 'report' && G.phase !== 'final') { c.save(); c.strokeStyle = G.tool ? '#58A6FF' : 'rgba(255,255,255,0.4)'; c.lineWidth = 2; c.strokeRect(G.hover.x * T + 1, G.hover.y * T + 1, T - 2, T - 2); c.restore(); }
  }
  function tickDrops(dt) {
    if (reduceMotion || G.phase !== 'rain') { G.drops.length = 0; return; }
    for (const d of G.drops) { d.y += d.v * dt; d.x -= d.v * 0.28 * dt; }
    G.drops = G.drops.filter(d => d.y < d.y1 && d.x > -10);
    let budget = 26; while (budget-- > 0 && G.drops.length < 520) { const x = Math.random() * M.W, y = Math.random() * M.H; const r = M.rainAt(G.wx, Math.floor(x), Math.floor(y), G.p); if (Math.random() * 60 < r) G.drops.push({ x: x * T, y: y * T - 20, y1: y * T + T * 0.8, v: 520 + Math.random() * 180 }); }
  }

  // ── 조작
  function tileAt(e) { const r = cv.getBoundingClientRect(); const x = Math.floor(((e.clientX - r.left) / r.width) * M.W), y = Math.floor(((e.clientY - r.top) / r.height) * M.H); return x >= 0 && y >= 0 && x < M.W && y < M.H ? { x, y } : null; }
  cv.addEventListener('pointermove', e => { G.hover = tileAt(e); });
  cv.addEventListener('pointerleave', () => { G.hover = null; });
  cv.addEventListener('click', e => { const t = tileAt(e); if (t) act(t.x, t.y); });
  function act(x, y) {
    if (G.phase === 'report' || G.phase === 'final') return; const w = G.w; const i = M.id(x, y); const house = w.houses.some(h => h.i === i); const b = w.build[i];
    if (!G.tool) { tip(`(${x + 1}, ${y + 1}) 높이 ${w.h[i].toFixed(1)}m${w.river[i] >= 0 ? ` · 강 수위 ${w.L[w.river[i]].toFixed(2)}m` : ` · 물 ${Math.round(w.d[i] * 100)}cm`}${house ? ' · 집' : ''}${b ? ' · ' + NAMES[b] : ''}${G.phase === 'plan' ? ` · 오늘 예보 ${Math.round(G.F[i])}mm` : ''}`); return; }
    if (G.tool === 'remove') { if (!b) return tip('여기에는 철거할 시설이 없습니다.'); const back = Math.floor(M.COST[b] / 2); w.build[i] = null; w.coins += back; tip(`${NAMES[b]}를 철거하고 ${back}코인을 돌려받았습니다.`); renderStats(); return; }
    if (w.river[i] >= 0) return tip('강 위에는 지을 수 없습니다.');
    if (b) return tip(`이미 ${NAMES[b]}가 있습니다. 철거하려면 「철거」를 고르세요.`);
    if (house && G.tool !== 'levee') return tip('집이 있는 칸에는 제방만 쌓을 수 있습니다.');
    const cost = M.COST[G.tool]; if (w.coins < cost) return tip(`코인이 모자랍니다. ${NAMES[G.tool]}는 ${cost}코인입니다.`);
    w.build[i] = G.tool; w.coins -= cost; renderStats();
    tip(G.tool === 'levee' ? (edgeRiver(x, y) ? '제방을 쌓았습니다. 강 쪽 둑이 0.9m 높아집니다. 이웃 칸도 이어서 쌓아야 물이 돌아 들어오지 않습니다.' : '제방을 쌓았습니다. 다만 강과 맞닿지 않은 칸이라 강물을 막지는 못합니다.') : G.tool === 'pump' ? '펌프를 놓았습니다. 둘레 9칸의 물을 가장 가까운 강으로 퍼냅니다.' : '우량계를 놓았습니다. 이 칸에 내린 비를 재고, 비 보험 판정에 쓰입니다.');
  }
  const edgeRiver = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const X = x + dx, Y = y + dy; return X >= 0 && Y >= 0 && X < M.W && Y < M.H && G.w.river[M.id(X, Y)] >= 0; });
  document.querySelectorAll('.tool').forEach(b => b.addEventListener('click', () => { const t = b.dataset.t; G.tool = G.tool === t ? null : t; renderTools(); tip(G.tool ? (G.tool === 'remove' ? '철거할 시설을 누르세요. 값의 절반을 돌려받습니다.' : `지도에서 ${NAMES[G.tool]}를 지을 칸을 누르세요.`) : '칸을 누르면 높이·물·예보를 보여 줍니다.'); }));
  $('#insw').addEventListener('click', () => { if (G.phase !== 'plan') return; if (!G.insured && G.w.coins < M.INS.premium) return tip('보험료 20코인이 모자랍니다.'); G.insured = !G.insured; renderIns(); });
  $('#go').addEventListener('click', () => { if (G.phase === 'plan') startDay(); else if (G.phase === 'report') nextDay(); else if (G.phase === 'final') newGame(); });
  $('#speed').addEventListener('click', () => { G.speed = G.speed === 1 ? 3 : 1; $('#speed').textContent = G.speed === 1 ? '빨리 ×3' : '보통 속도'; });

  // ── 하루 진행
  function startDay() {
    if (G.insured) G.w.coins -= M.INS.premium;
    G.phase = 'rain'; G.wx = M.realize(G.day, G.seed); G.acc = { rain: new Float32Array(M.N), pumped: 0, out: 0, spill: 0, lost: [] }; G.p = 0; G.stepCarry = 0; G.lostSeen = 0; G.peak = 0; G.speed = 1;
    $('#speed').hidden = false; $('#speed').textContent = '빨리 ×3'; renderAll(); toast(`${G.day + 1}일째 비가 시작됩니다`);
  }
  function stepDay(dtSec, now) {
    G.stepCarry += (dtSec * STEPS / DAY_SEC) * G.speed; const dtH = 24 / STEPS;
    while (G.stepCarry >= 1 && G.p < 1) {
      G.stepCarry -= 1; M.step(G.w, G.wx, G.p + 0.5 / STEPS, dtH, G.acc); G.p = Math.min(1, G.p + 1 / STEPS);
      for (const L of G.w.L) G.peak = Math.max(G.peak, L);
      while (G.lostSeen < G.acc.lost.length) { const hs = G.acc.lost[G.lostSeen++]; G.pulses.push({ x: hs.x, y: hs.y, at: now }); toast(`집 한 채가 물에 잠겼습니다 (${hs.x + 1}, ${hs.y + 1})`); renderStats(); }
    }
    if (G.p >= 1) endDay();
  }
  function endDay() {
    const w = G.w; const st = M.settle(w, G.acc, G.day, G.insured, G.F); let insTxt = '';
    if (G.insured) {
      const pct = st.ratio == null ? null : Math.round(st.ratio * 100);
      if (st.ins === 'hold') { w.coins += M.INS.premium; insTxt = `<li>비 보험: <b class="warnc">판정 보류</b> — 우량계가 없어 잴 수 없었습니다. 보험료 20코인 환급.</li>`; }
      else if (st.ins === 'paid') { w.coins += M.INS.payout; insTxt = `<li>비 보험: <b class="good">지급 +${M.INS.payout}</b> — 우량계 ${st.gauges.length}곳이 예보의 ${pct}%를 쟀습니다(기준 110%).</li>`; }
      else { const townPct = Math.round((st.town / Math.max(1, st.ftown)) * 100); insTxt = `<li>비 보험: <b class="badc">지급 없음</b> — 우량계는 예보의 ${pct}%(기준 110%).${townPct >= 110 ? ` 마을 전체로는 예보의 ${townPct}%가 왔는데, 우량계 자리는 비구름을 비껴갔습니다. 측정 지점이 정산을 바꿉니다.` : ''}</li>`; }
    }
    w.coins += st.income;
    const lost = G.acc.lost.length;
    G.reports[G.day] = { intact: st.intact, lost, town: st.town };
    for (let i = 0; i < M.N; i++) w.d[i] *= 0.45; for (let k = 0; k < w.L.length; k++) w.L[k] = Math.min(w.L[k], 0.35 + (w.L[k] - 0.35) * 0.4);
    const last = G.day >= M.DAYS.length - 1;
    G.phase = last ? 'final' : 'report'; $('#speed').hidden = true;
    const rep = $('#report');
    const dayHtml = `<div class="lbl">${G.day + 1}일째 · ${M.DAYS[G.day].name} — 끝</div>` +
      `<div class="big">${lost ? `<span class="badc">집 ${lost}채 침수</span>` : '<span class="good">침수 0</span>'}</div>` +
      `<ul><li>마을 평균 강수 ${Math.round(st.town)}mm (예보 ${Math.round(st.ftown)}mm) · 강 최고 수위 ${G.peak.toFixed(2)}m${G.peak > M.BANK ? ' <b class="badc">범람</b>' : ''}</li>${insTxt}` +
      `<li>수입 +${st.income}코인 (집 ${st.intact}채 × 5)</li><li>밤사이 고인 물이 절반쯤 빠지고 강이 내려갑니다.</li></ul>`;
    if (!last) rep.innerHTML = dayHtml;
    else {
      const n = st.intact; const stars = n >= 18 ? 3 : n >= 15 ? 2 : n >= 12 ? 1 : 0;
      const prev = best.stars || 0; if (stars > prev || (stars === prev && n > (best.intact || 0))) { best = { stars, intact: n }; save(); }
      rep.innerHTML = dayHtml + `<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line)"><div class="stars" aria-label="별 ${stars}개">${[0, 1, 2].map(k => (k < stars ? '<b>★</b>' : '☆')).join('')}</div>` +
        `<h2 style="margin-top:6px">장마가 끝났습니다 — 집 ${n}/20채를 지켰습니다</h2><p>★★★ 18채 이상 · ★★ 15채 · ★ 12채. 최고 기록 ${'★'.repeat(best.stars || 0) || '—'} (${best.intact || 0}채).</p>` +
        `<div class="actions"><button class="btn sm" id="share" type="button">결과 복사</button></div></div>`;
      $('#share').addEventListener('click', async () => { const text = `장마 디펜스 ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)} — 닷새 장마에서 집 ${n}/20채를 지켰습니다`; try { await navigator.clipboard.writeText(text); toast('결과를 복사했습니다'); } catch (e) { toast(text); } });
    }
    rep.classList.add('on'); try { rep.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' }); } catch (e) { /* 무시 */ }
    renderAll();
  }
  function nextDay() { G.day++; G.phase = 'plan'; G.insured = false; G.acc = null; G.F = M.forecastTotals(G.day); $('#report').classList.remove('on'); renderAll(); }

  // ── 패널
  let toastT = 0;
  function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1800); }
  function tip(m) { $('#tip').textContent = m; }
  function renderStats() { const w = G.w; $('#coins').textContent = w.coins; $('#houses').textContent = `${w.houses.filter(h => h.ok).length}/20`; $('#dayv').textContent = `${Math.min(G.day + 1, 5)}/5`; }
  function renderTools() { document.querySelectorAll('.tool').forEach(b => { b.setAttribute('aria-pressed', G.tool === b.dataset.t ? 'true' : 'false'); b.disabled = G.phase === 'report' || G.phase === 'final'; }); }
  function renderIns() { const s = $('#insw'); s.setAttribute('aria-checked', G.insured ? 'true' : 'false'); s.disabled = G.phase !== 'plan'; }
  function renderDays() {
    const el = $('#days'); el.innerHTML = '';
    M.DAYS.forEach((d, k) => { const r = G.reports[k]; const e = document.createElement('div'); e.className = 'dchip' + (k === G.day && G.phase !== 'final' ? ' now' : '') + (r ? ' done' : ''); e.innerHTML = `${k + 1}일<b>${r ? (r.lost ? `−${r.lost}채` : '무사') : d.name.length > 5 ? d.name.slice(0, 5) : d.name}</b>`; el.appendChild(e); });
  }
  function renderForecast() {
    const D = M.DAYS[Math.min(G.day, 4)]; const F = G.F; let town = 0; for (const h of G.w.houses) town += F[h.i]; town /= G.w.houses.length; let fmax = 0; for (let i = 0; i < M.N; i++) fmax = Math.max(fmax, F[i]);
    const peak = Math.max(D.front.rate, ...D.cells.map(c => c.rate + D.front.rate * 0.5));
    $('#fname').textContent = `${Math.min(G.day + 1, 5)}일째 · ${D.name}`; $('#fnote').textContent = D.note;
    $('#fc').innerHTML = `<dt>마을 평균</dt><dd>약 ${Math.round(town)}mm</dd><dt>가장 많은 곳</dt><dd>약 ${Math.round(fmax)}mm</dd><dt>시간당 최대</dt><dd>약 ${Math.round(peak)}mm/h · 비구름 ${D.cells.length}개</dd><dt>불확실성</dt><dd>비구름 길 ±2칸 · 세기 ±20%</dd>`;
    const rain = G.phase === 'rain'; $('#scale').innerHTML = RADAR.map(([, c]) => `<span style="background:rgb(${c.join(',')})"></span>`).join('');
    $('#scalelbl').innerHTML = (rain ? RADAR.map(([v]) => v) : DAILY).map(v => `<span>${v}</span>`).join('') + `<span>${rain ? 'mm/h' : 'mm/일'}</span>`;
  }
  function renderGo() {
    const b = $('#go'); b.textContent = G.phase === 'plan' ? `▶ ${G.day + 1}일째 비 시작` : G.phase === 'rain' ? '비가 내리는 중…' : G.phase === 'report' ? `다음 날 준비 →` : '새 장마 시작'; b.disabled = G.phase === 'rain';
  }
  function renderAll() { renderStats(); renderTools(); renderIns(); renderDays(); renderForecast(); renderGo(); tip(G.phase === 'plan' ? '색칠은 오늘 예보 강수량, 흰 점선은 비구름이 지나갈 길입니다. 시설을 고르고 칸을 누르세요.' : G.phase === 'rain' ? '비가 오는 동안에도 지을 수 있습니다.' : ''); }
  function hud() {
    const w = G.w; const hr = Math.floor(G.p * 24); const Lmax = Math.max(...w.L);
    $('#clock').textContent = G.phase === 'rain' ? `${G.day + 1}일째 ${String(hr).padStart(2, '0')}:00` : G.phase === 'plan' ? `${G.day + 1}일째 · 준비` : `${G.day + 1}일째 · 밤`;
    $('#rbar').style.width = `${clamp(Lmax / 2, 0, 1) * 100}%`; $('#rbar').style.background = Lmax > M.BANK ? '#F0645A' : Lmax > M.BANK * 0.8 ? '#F2B33D' : '#58A6FF';
    $('#rline').style.left = `${(M.BANK / 2) * 100}%`; $('#rtxt').textContent = `${Lmax.toFixed(2)}m`;
  }

  // ── 루프
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (G.phase === 'rain') stepDay(dt, now);
    tickDrops(dt); draw(now); hud();
    requestAnimationFrame(frame);
  }
  try { new ResizeObserver(() => resize()).observe($('#map')); } catch (e) { window.addEventListener('resize', resize); }
  if (matchMedia('(min-width: 940px)').matches) $('#howto').open = true;
  newGame(); resize(); requestAnimationFrame(frame);
  window.__md = { get G() { return G; }, M, act: (x, y) => act(x, y), tool: t => { G.tool = t; renderTools(); }, speed: v => { G.speed = v; }, start: () => startDay(), next: () => nextDay() };
})();
