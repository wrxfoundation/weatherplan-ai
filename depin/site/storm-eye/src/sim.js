// 태풍의 눈 — 시뮬레이션 핵심(브라우저·Node 공용). 단위: 경위도(°), 시간(h), 속도(°/h)
(function (root) {
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const D2R = Math.PI / 180;
  const BOUNDS = { lon0: 116.0, lon1: 139.5, lat0: 17.0, lat1: 42.0 };
  const CITIES = [
    { id: 'seoul', name: '서울', lon: 126.98, lat: 37.57 , side: 'l' }, { id: 'gangneung', name: '강릉', lon: 128.90, lat: 37.75 , side: 'r' },
    { id: 'gwangju', name: '광주', lon: 126.85, lat: 35.16 , side: 'l' }, { id: 'busan', name: '부산', lon: 129.08, lat: 35.18 , side: 'r' },
    { id: 'jeju', name: '제주', lon: 126.53, lat: 33.50 , side: 'l' }, { id: 'fukuoka', name: '후쿠오카', lon: 130.40, lat: 33.59 , side: 'r' },
    { id: 'kagoshima', name: '가고시마', lon: 130.56, lat: 31.60 , side: 'r' }, { id: 'osaka', name: '오사카', lon: 135.50, lat: 34.69 , side: 'r' },
    { id: 'naha', name: '나하', lon: 127.68, lat: 26.21 , side: 'r' }, { id: 'shanghai', name: '상하이', lon: 121.47, lat: 31.23 , side: 'l' },
    { id: 'wenzhou', name: '원저우', lon: 120.70, lat: 28.00 , side: 'l' }, { id: 'fuzhou', name: '푸저우', lon: 119.30, lat: 26.08 , side: 'l' },
    { id: 'qingdao', name: '칭다오', lon: 120.38, lat: 36.07 , side: 'l' }, { id: 'taipei', name: '타이베이', lon: 121.56, lat: 25.03 , side: 'r' },
    { id: 'kaohsiung', name: '가오슝', lon: 120.30, lat: 22.63 , side: 'l' },
    { id: 'aparri', name: '아파리', lon: 121.64, lat: 18.36 , side: 'r' },
    { id: 'pyongyang', name: '평양', lon: 125.75, lat: 39.03 , side: 'l' },
  ];
  const TOOL = {
    H: { A: 0.28, R: 5.0, push: 0.7, swirl: 0.7 },
    L: { A: 0.25, R: 6.5, push: -0.85, swirl: -0.45, absorb: 1.4 },
    S: { R: 3.0, cut: 0.85 },
  };
  let MASK = null;
  function loadMask(m) { const a = new Uint8Array(m.w * m.h); let v = 0, k = 0; for (const n of m.rle) { if (v) a.fill(1, k, k + n); k += n; v ^= 1; } MASK = { ...m, a }; }
  function isLand(lon, lat) { if (!MASK) return 0; const i = Math.floor((MASK.lat1 - lat) / MASK.res), j = Math.floor((lon - MASK.lon0) / MASK.res); if (i < 0 || j < 0 || i >= MASK.h || j >= MASK.w) return 0; return MASK.a[i * MASK.w + j]; }
  // 해수면 온도(°C): 위도 경도 + 쿠로시오 난류 띠
  function sst(lon, lat) { let t = 30.4 - 0.47 * (lat - 20); const axis = 28.6 + (lon - 124) * 0.36; if (lon > 122.5 && lon < 141) t += 1.7 * Math.exp(-((lat - axis) ** 2) / (2 * 1.1 ** 2)); return t; }
  // 배경 지향류: 저위도 북서진 → 전향 → 중위도 북동진
  const FLOW = { u0: -0.11, u1: 0.30, v0: 0.15, v1: 0.20, a: 24, b: 32.5 };
  let F = FLOW;
  function baseFlow(lon, lat) { const s = smooth(F.a, F.b, lat); return [lerp(F.u0, F.u1, s), lerp(F.v0, F.v1, s)]; }
  const kx = lat => Math.cos(lat * D2R);
  function dist(a, b) { const c = kx((a.lat + b.lat) / 2); return Math.hypot((a.lon - b.lon) * c, a.lat - b.lat); }
  const params = t => (t.p ? { ...TOOL[t.type], ...t.p } : TOOL[t.type]);
  const LIFE = { hold: 60, fade: 40 };
  const life = t => (t < LIFE.hold ? 1 : Math.max(0, 1 - (t - LIFE.hold) / LIFE.fade));
  function steer(lon, lat, tools, time = 0) {
    let [u, v] = baseFlow(lon, lat); const g = life(time);
    for (const t of tools) {
      if (t.type === 'S' || t.gone) continue;
      const P = params(t); const c = kx(lat);
      let dx = (lon - t.lon) * c, dy = lat - t.lat; let r = Math.hypot(dx, dy);
      if (r < 0.35) { dx *= 0.35 / (r || 1); dy *= 0.35 / (r || 1); r = 0.35; }
      const w = Math.exp(-((r / P.R) ** 2)) * P.A * (t.fixed ? 1 : g); const ux = dx / r, uy = dy / r;
      u += w * (P.push * ux + P.swirl * uy); v += w * (P.push * uy - P.swirl * ux);
    }
    return [u, v];
  }
  function noiseFactor(lon, lat, tools) { let best = 0; for (const t of tools) if (t.type === 'S') best = Math.max(best, Math.exp(-((dist({ lon, lat }, t) / TOOL.S.R) ** 2))); return 1 - TOOL.S.cut * best; }
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; }; }
  // 앙상블 교란: 멤버마다 일정한 편향(오차가 시간에 따라 커짐) + 느린 흔들림
  function makeNoise(seed) {
    const r = rng(seed); r(); r();
    const ang = r() * 6.2832, mag = Math.sqrt(r()) * 0.9; const bx = Math.cos(ang) * mag, by = Math.sin(ang) * mag;
    const comp = () => [0, 1].map(() => ({ f: (2 * Math.PI) / lerp(20, 60, r()), p: r() * 6.283, a: lerp(0.3, 0.6, r()) }));
    const cx = comp(), cy = comp(); const f = (cs, t) => cs.reduce((s, c) => s + c.a * Math.sin(c.f * t + c.p), 0);
    return t => [bx + f(cx, t), by + f(cy, t)];
  }
  const windRadius = I => 0.5 + 1.1 * I; const maxWind = I => Math.round(17 + 45 * I); const pressure = I => Math.round(1008 - 88 * I);
  function grade(I) { const w = maxWind(I); return w >= 54 ? '초강력' : w >= 44 ? '매우 강' : w >= 33 ? '강' : w >= 25 ? '중' : '약'; }
  function simulate(level, placed, opt = {}) {
    const dt = opt.dt || 1, maxH = opt.maxH || 180;
    const tools = [...(level.fixed || []).map(t => ({ ...t, fixed: true })), ...placed].map(t => ({ ...t, gone: false }));
    F = level.flow ? { ...FLOW, ...level.flow } : FLOW;
    const nz = opt.seed ? makeNoise(opt.seed) : null; const amp = level.noise || 0.04;
    let lon = level.start.lon, lat = level.start.lat, I = level.I0;
    let [u, v] = baseFlow(lon, lat); if (level.v0) [u, v] = level.v0;
    const track = [{ t: 0, lon, lat, I, land: 0 }]; const hit = new Set(); let end = 'time'; const events = []; let landfall = 0;
    for (let t = dt; t <= maxH; t += dt) {
      let [tu, tv] = steer(lon, lat, tools, t);
      if (nz) { const [a, b] = nz(t); const f = amp * noiseFactor(lon, lat, tools); tu += a * f; tv += b * f; }
      const k = 1 - Math.exp(-dt / 5); u += (tu - u) * k; v += (tv - v) * k;
      const sp = Math.hypot(u, v); if (sp > 0.46) { u *= 0.46 / sp; v *= 0.46 / sp; }
      lon += (u / kx(lat)) * dt; lat += v * dt;
      if (opt.ref) { const w = 1 - noiseFactor(lon, lat, tools); const q = opt.ref[Math.min(t, opt.ref.length - 1)]; if (w > 0 && q) { const k = Math.min(1, 0.25 * w * dt); lon += (q.lon - lon) * k; lat += (q.lat - lat) * k; } }
      if (lat < BOUNDS.lat0) { lat = BOUNDS.lat0; if (v < 0) v = 0; } // 적도 쪽 가장자리는 벽
      const land = isLand(lon, lat);
      // 상륙: 강도가 남아 있으면 상륙 지점에서 가장 가까운 도시가 피해를 입는다(도시 사이 빈 해안으로 빼돌리기 방지)
      if (land && !landfall) { landfall = t; if (I >= 0.15) { let nc = null, nd = 1e9; for (const c of CITIES) { const d = dist({ lon, lat }, c); if (d < nd) { nd = d; nc = c; } } if (nc && !hit.has(nc.id)) { hit.add(nc.id); events.push({ t, kind: 'hit', city: nc.id, landfall: true }); } } }
      const dI = land ? -0.035 : 0.008 * clamp((sst(lon, lat) - 26.4) / 2.6, -1.3, 1) - (lat > 35 ? 0.004 * (lat - 35) : 0);
      I = clamp(I + dI * dt, 0, 1);
      for (const tl of tools) if (tl.type === 'L' && !tl.fixed && !tl.gone && dist({ lon, lat }, tl) < TOOL.L.absorb) { tl.gone = true; events.push({ t, kind: 'absorb', tool: tl }); }
      if (I >= 0.15) { const R = windRadius(I); for (const c of CITIES) if (!hit.has(c.id) && dist({ lon, lat }, c) <= R) { hit.add(c.id); events.push({ t, kind: 'hit', city: c.id }); } }
      track.push({ t, lon, lat, I, land });
      if (I < 0.08) { end = 'dissipate'; break; }
      if (lon < BOUNDS.lon0 || lon > BOUNDS.lon1 || lat > BOUNDS.lat1) { end = 'exit'; break; }
    }
    return { track, hit: [...hit], end, events, landfall };
  }
  const ENS = 30;
  function seeds(level) { return Array.from({ length: ENS }, (_, k) => ((level.id * 104729 + (k + 1) * 7919) >>> 0)); }
  function forecast(level, placed) {
    const central = simulate(level, placed);
    const members = seeds(level).map(s => simulate(level, placed, { seed: s, ref: central.track }));
    const prob = {}; for (const c of CITIES) prob[c.id] = 0;
    let clean = 0; for (const m of members) { for (const id of m.hit) prob[id] += 1 / ENS; if (!m.hit.length) clean++; }
    return { central, members, prob, clean: clean / ENS };
  }
  // 별: 피해 도시 0곳 ★★★ · 1곳 ★★ · 2곳 ★ · 3곳 이상 실패. level.pass(최소 별)가 있으면 그보다 적은 별은 실패
  function stars(nHit, level) { const s = nHit === 0 ? 3 : nHit === 1 ? 2 : nHit === 2 ? 1 : 0; return level && level.pass && s < level.pass ? 0 : s; }
  const NPH = (lon, lat, A, R) => ({ type: 'H', lon, lat, name: '북태평양 고기압', p: { A, R } });
  const LEVELS = [
    { id: 1, code: 'T-01', title: '빈 바다로', tools: { H: 0, L: 1, S: 0 }, start: { lon: 133.0, lat: 21.0 }, I0: 0.55, noise: 0.02,
      hint: '저기압은 태풍을 끌어당깁니다. 태풍이 가 줬으면 하는 빈 바다에 놓으세요.' },
    { id: 2, code: 'T-02', title: '첫 번째 곡선', tools: { H: 1, L: 0, S: 0 }, start: { lon: 131.0, lat: 21.5 }, I0: 0.40, noise: 0.015,
      hint: '고기압 둘레의 바람은 시계 방향으로 돕니다. 태풍 서쪽에 바짝 붙여 두면 동쪽 바다로 휘어 나갑니다.' },
    { id: 3, code: 'T-03', title: '따뜻한 바다', tools: { H: 1, L: 0, S: 1 }, pass: 2, start: { lon: 132.0, lat: 20.0 }, I0: 0.55, noise: 0.04,
      flow: { u0: -0.2, v0: 0.08, a: 27, b: 34 },
      hint: '난류 위에서는 예보 선이 크게 흩어집니다. 관측소를 진로 위에 두면 선들이 모입니다.' },
    { id: 4, code: 'T-04', title: '한반도 관통', tools: { H: 2, L: 1, S: 1 }, start: { lon: 127.2, lat: 21.0 }, I0: 0.45, noise: 0.03,
      flow: { u0: -0.01, v0: 0.17, a: 32, b: 39 }, fixed: [NPH(136.0, 30.0, 0.2, 6.0)],
      hint: '북태평양 고기압이 태풍을 곧장 북쪽으로 올려 보냅니다. 찬 서해에서 힘을 빼거나 동쪽 먼바다로 끌어내 보세요.' },
    { id: 5, code: 'T-05', title: '초강력 태풍', tools: { H: 2, L: 1, S: 1 }, start: { lon: 134.2, lat: 18.5 }, I0: 0.95, noise: 0.035,
      flow: { u0: -0.04, v0: 0.17, a: 30, b: 37 }, fixed: [NPH(139.5, 29.0, 0.22, 6.5)],
      hint: '바람 반경이 넓어 스치기만 해도 피해가 납니다. 일본 남쪽 먼바다로 크게 돌려 내보내 보세요.' },
  ];
  const API = { BOUNDS, CITIES, TOOL, FLOW, LIFE, life, LEVELS, ENS, loadMask, isLand, sst, baseFlow, steer, simulate, forecast, seeds, stars, windRadius, maxWind, pressure, grade, dist, makeNoise, noiseFactor };
  if (typeof module !== 'undefined') module.exports = API; else root.SIM = API;
})(this);
