// 장마 디펜스 — 물 모형(브라우저·Node 공용). 격자 12×16, 칸 = 100m. 높이·수심 m, 시간 h, 강수 mm/h
(function (root) {
  const W = 12, H = 16, N = W * H;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const id = (x, y) => y * W + x;
  // 강 경로(북서 → 남동). 강바닥은 하류로 갈수록 낮다
  const RIVER = [[1, 0], [1, 1], [2, 2], [3, 3], [3, 4], [4, 5], [5, 6], [5, 7], [6, 8], [7, 9], [7, 10], [8, 11], [9, 12], [9, 13], [10, 14], [11, 15]];
  const HOUSES = [[2, 9], [2, 8], [3, 9], [3, 8], [1, 10], [9, 7], [8, 8], [9, 8], [6, 10], [5, 10], [8, 10], [6, 5], [7, 5], [7, 12], [8, 13], [7, 13], [9, 11], [4, 7], [10, 10], [5, 13]];
  const BANK = 0.95; // 강둑 높이(강바닥 위)
  const COST = { pump: 40, levee: 12, gauge: 15 };
  const PUMP_RATE = 0.16; // m/h — 펌프 한 대가 3×3 칸에서 퍼내는 총량(칸당 환산)
  const LEVEE_H = 0.9;    // 제방이 더해 주는 높이
  const HOUSE_FLOOD = 0.3; // 집이 잠기는 수심(m)

  function hash(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 2246822519) >>> 0; h = (h ^ (h >>> 13)) * 1274126177 >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function buildTerrain() {
    const h = new Float32Array(N), river = new Int16Array(N).fill(-1), bed = new Float32Array(N);
    RIVER.forEach(([x, y], k) => { river[id(x, y)] = k; bed[id(x, y)] = 3.2 * (1 - k / (RIVER.length - 1)); });
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = id(x, y); if (river[i] >= 0) { h[i] = bed[i]; continue; }
      let dmin = 1e9, kb = 0; RIVER.forEach(([rx, ry], k) => { const d = Math.hypot(rx - x, ry - y); if (d < dmin) { dmin = d; kb = k; } });
      const b = 3.2 * (1 - kb / (RIVER.length - 1));
      const hill = Math.max(0, 3.5 - y) * 1.8 + Math.max(0, x - 8) * 0.25;
      h[i] = b + BANK - 0.2 + dmin * 0.2 + hill + (hash(x, y, 7) - 0.5) * 0.3;
    }
    // 마을 안 오목한 곳 두 군데(배수가 안 되는 저지대)
    for (const [cx, cy, dep] of [[2, 9, 1.1], [8, 12, 1.0], [9, 7, 0.9]]) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = id(x, y); if (river[i] >= 0) continue; const d = Math.hypot(x - cx, y - cy); if (d < 2.2) h[i] -= dep * (1 - d / 2.2); }
    return { h, river, bed };
  }

  // 하루치 비: 장마전선(띠) + 집중호우 칸. p = 진행률 0..1
  const DAYS = [
    { name: '첫 비', front: { y0: -2, y1: 18, width: 3.2, rate: 5.5 }, cells: [], note: '약한 비가 북쪽에서 남쪽으로 지나갑니다.' },
    { name: '굵어지는 빗줄기', front: { y0: -2, y1: 18, width: 3.0, rate: 7 }, cells: [{ x0: -2, y0: 5, x1: 14, y1: 9, r: 1.8, rate: 30, t0: 0.25, t1: 0.7 }], note: '비구름 하나가 마을 한가운데를 가로지릅니다.' },
    { name: '정체전선', front: { y0: 2, y1: 11, width: 3.5, rate: 9 }, cells: [{ x0: 14, y0: 3, x1: -2, y1: 8, r: 1.8, rate: 34, t0: 0.15, t1: 0.55 }, { x0: -2, y0: 9, x1: 14, y1: 12, r: 1.7, rate: 32, t0: 0.5, t1: 0.9 }], note: '전선이 마을 위에 오래 머뭅니다. 강 위쪽 언덕에 내린 비가 늦게 불어납니다.' },
    { name: '밤사이 폭우', front: { y0: 6, y1: 9, width: 4.0, rate: 11 }, cells: [{ x0: -2, y0: 11, x1: 14, y1: 7, r: 2.0, rate: 42, t0: 0.1, t1: 0.45 }, { x0: 6, y0: -2, x1: 7, y1: 18, r: 1.8, rate: 40, t0: 0.55, t1: 0.95 }], note: '강한 비구름 두 개가 연달아 지납니다. 강 수위를 지켜보세요.' },
    { name: '집중호우', front: { y0: 4, y1: 12, width: 4.5, rate: 13 }, cells: [{ x0: -2, y0: 6, x1: 14, y1: 10, r: 2.2, rate: 55, t0: 0.05, t1: 0.4 }, { x0: 14, y0: 12, x1: -2, y1: 6, r: 2.0, rate: 52, t0: 0.35, t1: 0.7 }, { x0: 3, y0: -2, x1: 9, y1: 18, r: 2.2, rate: 58, t0: 0.62, t1: 0.98 }], note: '장마의 고비. 시간당 50mm가 넘는 비구름 셋이 지나갑니다.' },
  ];
  // 실제 날씨: 예보에서 조금 비틀린다(비구름 경로 ±1.5칸, 세기 ±15%)
  function realize(day, seed) {
    const r = k => hash(day * 31 + k, seed, 3);
    const D = DAYS[day];
    if (seed == null) return { front: { ...D.front }, cells: D.cells.map(c => ({ ...c })) }; // 예보(교란 없음)
    return { front: { ...D.front, rate: D.front.rate * (0.85 + 0.3 * r(1)), y0: D.front.y0 + (r(2) - 0.5) * 3, y1: D.front.y1 + (r(3) - 0.5) * 3 },
      cells: D.cells.map((c, k) => ({ ...c, y0: c.y0 + (r(10 + k) - 0.5) * 4, y1: c.y1 + (r(20 + k) - 0.5) * 4, x0: c.x0 + (r(30 + k) - 0.5) * 3, x1: c.x1 + (r(40 + k) - 0.5) * 3, rate: c.rate * (0.8 + 0.4 * r(50 + k)) })) };
  }
  function rainAt(w, x, y, p) { // mm/h at tile center
    const f = w.front; const fy = f.y0 + (f.y1 - f.y0) * p; let r = f.rate * Math.exp(-(((y - fy) / f.width) ** 2));
    for (const c of w.cells) { if (p < c.t0 || p > c.t1) continue; const q = (p - c.t0) / (c.t1 - c.t0); const cx = c.x0 + (c.x1 - c.x0) * q, cy = c.y0 + (c.y1 - c.y0) * q; const env = Math.sin(Math.PI * q) ** 0.6; r += c.rate * env * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (c.r * c.r)); }
    return r;
  }

  function forecastTotals(day, steps = 96) { const wx = realize(day, null); const F = new Float32Array(N); for (let s = 0; s < steps; s++) { const p = (s + 0.5) / steps; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) F[id(x, y)] += rainAt(wx, x, y, p) * 24 / steps; } return F; }
  function newWorld() {
    const T = buildTerrain();
    return { ...T, d: new Float32Array(N), L: new Float32Array(RIVER.length).fill(0.35), build: new Array(N).fill(null), houses: HOUSES.map(([x, y]) => ({ x, y, i: id(x, y), ok: true })), coins: 100, day: 0 };
  }
  const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function leveeAt(w, i) { return w.build[i] === 'levee' ? LEVEE_H : 0; }
  // 하루 진행: dt(h) 한 걸음. w.rain(현재 실현 날씨), p(진행률)
  function step(w, wx, p, dt, acc) {
    const { h, d, river, bed, L } = w;
    // 1) 비 + 침투
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = id(x, y); const r = rainAt(wx, x, y, p) / 1000; // m/h
      acc.rain[i] += r * 1000 * dt;
      if (river[i] >= 0) L[river[i]] += r * dt; else d[i] = Math.max(0, d[i] + r * dt - 0.004 * dt);
    }
    // 2) 북쪽 언덕 유역 → 강 상류 유입(늦게 도착)
    let hill = 0; for (let y = 0; y < 4; y++) for (let x = 0; x < W; x++) hill += rainAt(wx, x, y, Math.max(0, p - 0.12));
    L[0] += (0.03 + hill / (W * 4) * 0.02) * dt * 3;
    // 3) 땅 위 물 흐름(높은 곳 → 낮은 곳), 강가 칸은 강으로
    const out = new Float32Array(N);
    const flows = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = id(x, y); if (river[i] >= 0 || d[i] <= 1e-5) continue; const s = h[i] + d[i]; let tot = 0; const f = [];
      for (const [dx, dy] of NB) {
        const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const j = id(X, Y);
        const sj = river[j] >= 0 ? bed[j] + L[river[j]] : h[j] + d[j]; // 강으로는 강 수면보다 높을 때만(제방 배수문)
        const dh = s - sj; if (dh > 0) { const q = dh * 2.2 * dt; f.push([j, q]); tot += q; }
      }
      if (!tot) continue; const scale = Math.min(1, (d[i] * 0.5) / tot);
      for (const [j, q] of f) flows.push([i, j, q * scale]);
    }
    for (const [i, j, q] of flows) { d[i] -= q; if (river[j] >= 0) L[river[j]] += q; else d[j] += q; }
    // 4) 펌프: 3×3 칸의 물을 가장 가까운 강 칸으로
    for (let i = 0; i < N; i++) {
      if (w.build[i] !== 'pump') continue; const x = i % W, y = (i / W) | 0; let cap = PUMP_RATE * dt * 9, moved = 0;
      for (let yy = y - 1; yy <= y + 1; yy++) for (let xx = x - 1; xx <= x + 1; xx++) { if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const j = id(xx, yy); if (river[j] >= 0) continue; const q = Math.min(d[j], PUMP_RATE * dt * 1.5, cap - moved); if (q > 0) { d[j] -= q; moved += q; } }
      let best = 0, bd = 1e9; RIVER.forEach(([rx, ry], k) => { const dd = Math.hypot(rx - x, ry - y); if (dd < bd) { bd = dd; best = k; } }); L[best] += moved; acc.pumped += moved;
    }
    // 5) 강: 하류로 흐르고, 둑을 넘으면 넘친다
    for (let k = 0; k < RIVER.length; k++) {
      const [x, y] = RIVER[k]; const i = id(x, y);
      if (k < RIVER.length - 1) { const j = id(...RIVER[k + 1]); const s1 = bed[i] + L[k], s2 = bed[j] + L[k + 1]; const q = clamp((s1 - s2) * 1.6 * dt, 0, L[k] * 0.6) + Math.min(L[k] * 0.6, 0.55 * L[k] * dt); L[k] -= q; L[k + 1] += q; }
      else { const q = Math.min(L[k], (0.7 * L[k] ** 1.3 + 0.05) * dt); L[k] -= q; acc.out += q; }
      // 넘침: 둑(+제방)보다 높으면 옆 땅으로
      const over = L[k] - BANK; if (over <= 0) continue;
      for (const [dx, dy] of NB) {
        const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const j = id(X, Y); if (river[j] >= 0) continue;
        const wall = bed[i] + BANK + leveeAt(w, j); const s = bed[i] + L[k]; const ex = s - Math.max(wall, h[j] + d[j]); if (ex <= 0) continue;
        const q = Math.min(ex * 0.8 * dt, (L[k] - BANK) * 0.25); L[k] -= q; d[j] += q; acc.spill += q;
      }
    }
    // 6) 집 잠김
    for (const hs of w.houses) if (hs.ok && d[hs.i] >= HOUSE_FLOOD) { hs.ok = false; acc.lost.push(hs); }
  }
  // 하루 전체(빠른 계산): 전략 점검용
  function runDay(w, dayIdx, seed, steps = 480) {
    const wx = realize(dayIdx, seed); const acc = { rain: new Float32Array(N), pumped: 0, out: 0, spill: 0, lost: [] }; const dt = 24 / steps;
    for (let s = 0; s < steps; s++) step(w, wx, (s + 0.5) / steps, dt, acc);
    // 하루가 끝나면 고인 물 일부가 빠진다(밤사이 배수)
    for (let i = 0; i < N; i++) w.d[i] *= 0.45;
    for (let k = 0; k < w.L.length; k++) w.L[k] = Math.min(w.L[k], 0.35 + (w.L[k] - 0.35) * 0.4);
    return acc;
  }
  // 비 보험: 「예보보다 10% 넘게 더 온 날」 지급. 판정은 우량계 — 우량계마다 (측정 ÷ 그 자리 예보)의 평균. 우량계가 없으면 보류(보험료 환급)
  const INS = { premium: 20, payout: 60, ratio: 1.1 };
  function settle(w, acc, dayIdx, insured, F) {
    F = F || forecastTotals(dayIdx); const gauges = []; for (let i = 0; i < N; i++) if (w.build[i] === 'gauge') gauges.push({ i, m: acc.rain[i], f: F[i] });
    let town = 0, ftown = 0; for (const hs of w.houses) { town += acc.rain[hs.i]; ftown += F[hs.i]; } town /= w.houses.length; ftown /= w.houses.length;
    const ratio = gauges.length ? gauges.reduce((a, g) => a + g.m / Math.max(1, g.f), 0) / gauges.length : null;
    let ins = null; if (insured) ins = ratio == null ? 'hold' : ratio >= INS.ratio ? 'paid' : 'unpaid';
    const intact = w.houses.filter(h => h.ok).length;
    return { gauges, ratio, town, ftown, ins, intact, income: intact * 5 };
  }
  const API = { W, H, N, id, RIVER, HOUSES, BANK, COST, LEVEE_H, HOUSE_FLOOD, DAYS, INS, newWorld, realize, rainAt, step, runDay, settle, forecastTotals, hash };
  if (typeof module !== 'undefined') module.exports = API; else root.MSIM = API;
})(this);
