// 태풍 키우기 — 모형(브라우저 · Node 공용). 좌표: x = (경도-140)·KX, y = 위도(°). 시간 단위는 게임 시간(h).
(function (root) {
  const D2R = Math.PI / 180;
  const KX = Math.cos(24 * D2R);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const lonOf = x => x / KX + 140;
  const xOf = lon => (lon - 140) * KX;
  // 지도(텍스처) 범위와 놀이 범위
  const MAP = { lon0: 96, lon1: 184, lat0: -8, lat1: 54 };
  const PLAY = { x0: xOf(101), x1: xOf(179), y0: 1.5, y1: 50 };

  const T = {
    hoursPerSec: 1,         // 실시간 1초 = 게임 1시간
    lifeH: 216,             // 9일
    eat: 0.62,              // 내 반경의 이 비율보다 작은 구름만 삼킨다
    grow: 0.40,             // 삼킬 때 R² += grow·s²
    Rmax: 6.5,
    items: 72,
    absorbH: 1.1,           // 빨려 들어가는 연출 시간
    combo: 2.6,             // 이 시간 안에 또 삼키면 콤보
  };

  // ── 해안선 · 육지 격자 ─────────────────────────────
  function decodeCoast(coast) {
    return coast.map(r => { const pts = []; let x = 0, y = 0; for (let i = 0; i < r.d.length; i += 2) { x += r.d[i]; y += r.d[i + 1]; pts.push([x / 100, y / 100]); } return { h: r.h ? 1 : 0, pts }; });
  }
  let MASK = null;
  function buildMask(rings, res = 0.1) {
    const w = Math.round((MAP.lon1 - MAP.lon0) / res), h = Math.round((MAP.lat1 - MAP.lat0) / res);
    const a = new Uint8Array(w * h); const xs = [];
    for (let i = 0; i < h; i++) {
      const lat = MAP.lat1 - (i + 0.5) * res; xs.length = 0;
      for (const r of rings) {
        const p = r.pts;
        for (let k = 0, n = p.length; k < n; k++) {
          const [x1, y1] = p[k], [x2, y2] = p[(k + 1) % n];
          if ((y1 <= lat) !== (y2 <= lat)) xs.push(x1 + ((lat - y1) / (y2 - y1)) * (x2 - x1));
        }
      }
      xs.sort((u, v) => u - v);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const j0 = Math.max(0, Math.ceil((xs[k] - MAP.lon0) / res - 0.5)), j1 = Math.min(w - 1, Math.floor((xs[k + 1] - MAP.lon0) / res - 0.5));
        for (let j = j0; j <= j1; j++) a[i * w + j] ^= 1;
      }
    }
    MASK = { w, h, res, a };
    return MASK;
  }
  function isLand(x, y) {
    if (!MASK) return 0; const lon = lonOf(x);
    const i = Math.floor((MAP.lat1 - y) / MASK.res), j = Math.floor((lon - MAP.lon0) / MASK.res);
    if (i < 0 || j < 0 || i >= MASK.h || j >= MASK.w) return 0; return MASK.a[i * MASK.w + j];
  }
  // 반경 안 육지 비율(성긴 표본)
  function landFrac(x, y, r) {
    let n = 0, l = 0;
    for (let k = 0; k < 9; k++) { const a = k * 0.698, q = k ? r : 0; n++; l += isLand(x + Math.cos(a) * q, y + Math.sin(a) * q); }
    return l / n;
  }

  // ── 난수 ─────────────────────────────────────────
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e7) / 1e7; }; }
  function gauss(r) { let u = 0; for (let i = 0; i < 4; i++) u += r(); return (u - 2) * 1.732; }

  // ── 환경: 해수면 온도 · 지향류 · 바람 시어 ─────────────
  // 늦여름 북서태평양을 단순화한 기후값(℃). 난수 소용돌이(±)는 판마다 바뀐다.
  function sstClim(x, y, env) {
    const lon = lonOf(x);
    let t = y < 18 ? 29.8 : 29.8 - 0.012 * (y - 18) ** 2;
    t -= 0.6 * smooth(5, 0, y);                                   // 적도 용승
    t -= 0.9 * smooth(160, 182, lon) * smooth(14, 30, y);         // 동쪽 먼바다는 조금 차다
    t -= 1.4 * smooth(124, 119, lon) * smooth(24, 31, y);         // 중국 연안·황해
    const axis = 29 + (lon - 124) * 0.33;                          // 쿠로시오 난류
    if (lon > 122 && lon < 150) t += 1.1 * Math.exp(-((y - axis) ** 2) / 2.2) * smooth(150, 140, lon);
    if (env) for (const e of env.eddies) { const d2 = (x - e.x) ** 2 + (y - e.y) ** 2; if (d2 < 9 * e.r * e.r) t += e.a * Math.exp(-d2 / (e.r * e.r)); }
    return t;
  }
  // 차가운 꼬리: 0.5° 격자
  const WG = { res: 0.5 }; WG.w = Math.round((MAP.lon1 - MAP.lon0) / WG.res); WG.h = Math.round((MAP.lat1 - MAP.lat0) / WG.res);
  function wakeIdx(x, y) { const j = Math.floor((lonOf(x) - MAP.lon0) / WG.res), i = Math.floor((MAP.lat1 - y) / WG.res); return i < 0 || j < 0 || i >= WG.h || j >= WG.w ? -1 : i * WG.w + j; }
  function sst(g, x, y) { const k = wakeIdx(x, y); return sstClim(x, y, g.env) - (k >= 0 ? g.wake[k] : 0); }

  function ridgeLat(g, x) { const lon = lonOf(x); return 26.5 + 2.6 * Math.sin(g.t / 70 + g.env.rPh) + 1.5 * smooth(150, 125, lon) * Math.sin(g.t / 45 + g.env.rPh2); }
  function jetLat(g, x) { const lon = lonOf(x); return 34 + 2.2 * Math.sin(g.t / 60 + g.env.jPh) - 2.5 * smooth(135, 110, lon) + 1.2 * Math.sin(lon * 0.09 - g.t / 18); }
  // 지향류(세계 단위/h): 능 남쪽은 동풍(북서진), 북쪽은 편서풍(북동진), 능의 서쪽 끝에서 전향
  function flow(g, x, y) {
    const lon = lonOf(x), lr = ridgeLat(g, x);
    const s = smooth(lr - 4, lr + 3, y);
    let u = lerp(-0.22, 0.34, s), v = lerp(0.06, 0.13, s);
    v += 0.16 * smooth(136, 118, lon) * (1 - s) * smooth(12, 22, y);
    u *= KX; return [u, v];
  }
  // 바람 시어 0~1: 제트기류 띠 + 서쪽으로 흘러가는 상층 저기압(TUTT)
  function shear(g, x, y) {
    const jl = jetLat(g, x); let S = smooth(jl - 5, jl + 0.5, y);
    for (const c of g.env.tutt) { const d2 = (x - c.x) ** 2 + (y - c.y) ** 2; S += c.a * Math.exp(-d2 / (c.r * c.r)); }
    return clamp(S, 0, 1);
  }
  // 대류 잠재력(구름이 생기기 쉬운 정도) 0~1
  function convection(g, x, y) {
    if (isLand(x, y)) return 0.08;
    const t = sst(g, x, y);
    return smooth(26.0, 29.2, t) * (1 - 0.8 * shear(g, x, y)) * smooth(1, 5, y) * (0.55 + 0.45 * smooth(26, 14, Math.abs(y - 11)));
  }

  // ── 강도 표기 ────────────────────────────────────
  const wind = I => 10 + 60 * I;                     // 최대풍속 m/s
  const pres = I => 1008 - 110 * I;                  // 중심기압 hPa
  const GRADES = [
    { id: 'dist', name: '열대요란', min: 0 },
    { id: 'td', name: '열대저압부', min: 0.035 },
    { id: 'g1', name: '태풍 · 약', min: (17 - 10) / 60 },
    { id: 'g2', name: '태풍 · 중', min: (25 - 10) / 60 },
    { id: 'g3', name: '태풍 · 강', min: (33 - 10) / 60 },
    { id: 'g4', name: '태풍 · 매우 강', min: (44 - 10) / 60 },
    { id: 'g5', name: '태풍 · 초강력', min: (54 - 10) / 60 },
  ];
  const gradeIdx = I => { let k = 0; for (let i = 0; i < GRADES.length; i++) if (I >= GRADES[i].min) k = i; return k; };
  const EYE_I = 0.42;

  // ── 게임 ─────────────────────────────────────────
  function viewHalf(R) { return 5.2 * R + 2.2; }
  function newGame(seed) {
    const r = rng(seed);
    const env = { eddies: [], tutt: [], rPh: r() * 6.28, rPh2: r() * 6.28, jPh: r() * 6.28 };
    for (let i = 0; i < 34; i++) env.eddies.push({ x: xOf(lerp(104, 178, r())), y: lerp(4, 40, r()), r: lerp(1.2, 3.2, r()), a: (r() < 0.55 ? 1 : -1) * lerp(0.4, 1.0, r()) });
    for (let i = 0; i < 3; i++) env.tutt.push({ x: xOf(lerp(135, 180, r())), y: lerp(19, 26, r()), r: lerp(3.2, 4.8, r()), a: lerp(0.55, 0.8, r()), vx: -lerp(0.08, 0.14, r()) * KX });
    const lon0 = lerp(138, 158, r()), lat0 = lerp(8, 13.5, r());
    const g = {
      seed, r, env, t: 0, x: xOf(lon0), y: lat0, vx: 0, vy: 0,
      I: 0.03, R: 0.5, M: 0.15, peakI: 0.03, peakR: 0.5, ace: 0, eaten: 0, bigHits: 0,
      combo: 0, lastEat: -99, lastBig: -99, landH: 0, landfall: false, eye: false,
      grade: 0, over: false, end: '', items: [], nextId: 1, wake: new Float32Array(WG.w * WG.h),
      events: [], track: [{ t: 0, x: 0, y: 0, I: 0.03 }], sst: 29, S: 0, land: 0, Ipot: 0,
    };
    g.track[0].x = g.x; g.track[0].y = g.y;
    for (let i = 0; i < T.items * 1.3; i++) spawn(g, true);
    return g;
  }
  function itemType(s) { return s < 0.3 ? 0 : s < 0.9 ? 1 : s < 2.2 ? 2 : 3; } // 적운 · 뇌우 · 구름 무리 · 열대요란
  function spawn(g, initial) {
    const r = g.r, V = viewHalf(g.R);
    for (let k = 0; k < 14; k++) {
      const a = r() * 6.2832, d = initial ? lerp(0.25, 1.6, Math.sqrt(r())) * V : lerp(1.05, 1.6, r()) * V;
      const x = g.x + Math.cos(a) * d, y = g.y + Math.sin(a) * d * 0.8;
      if (x < PLAY.x0 - 4 || x > PLAY.x1 + 4 || y < -2 || y > PLAY.y1 + 3) continue;
      if (r() > convection(g, x, y)) continue;
      const u = r(); let s = g.R * (0.1 + 0.95 * u ** 1.8); s = Math.max(0.06, s);
      let ty = itemType(s); if (ty === 3 && r() > 0.25) ty = 2; // 다른 열대요란은 드물게
      g.items.push({ id: g.nextId++, x, y, s, type: ty, seed: r(), rot: r() * 6.28, age: initial ? r() * 20 : 0, life: lerp(30, 70, r()), st: 0, p: 0, rx: 0, ry: 0 });
      return true;
    }
    return false;
  }

  function step(g, ix, iy, dt) {
    if (g.over || !(dt > 0)) return;
    g.t += dt; const ev = g.events;
    // 환경
    for (const c of g.env.tutt) { c.x += c.vx * dt; if (c.x < xOf(118)) { c.x = xOf(lerp(170, 182, g.r())); c.y = lerp(19, 27, g.r()); } }
    const land = landFrac(g.x, g.y, Math.min(g.R * 0.35, 1.2));
    const T0 = sst(g, g.x, g.y), S = shear(g, g.x, g.y);
    g.sst = T0; g.S = S; g.land = land;
    const cor = smooth(2.5, 6.5, g.y);
    let Ipot = clamp((T0 - 26.0) / 3.6, 0, 1) * cor * (1 - 0.75 * S) * (1 - land);
    g.Ipot = Ipot;
    // 수증기 저장고
    g.M = clamp(g.M * Math.exp(-0.045 * dt) + 0.0015 * clamp(T0 - 27, 0, 3) * (1 - land) * dt, 0, 1.5);
    // 강도
    if (g.I < Ipot) g.I += Math.min((Ipot - g.I) * (0.0025 + 0.03 * g.M), 0.024) * dt;
    else g.I += (Ipot - g.I) * (0.045 + 0.08 * land) * dt;
    g.I -= 0.012 * S * g.I * dt;
    g.I = clamp(g.I, 0, 1);
    // 움직임: 내 조작 + 지향류. 강해질수록 큰 흐름(지향류)이 더 세게 끌고 간다
    const [fu, fv] = flow(g, g.x, g.y);
    const sp = 1.1 * g.R ** 0.7 + 0.5, ia = 1 - 0.5 * smooth(0.3, 0.9, g.I), fk = 1.4 + 1.4 * smooth(0.25, 0.85, g.I);
    const im = Math.hypot(ix, iy); if (im > 1) { ix /= im; iy /= im; }
    const tvx = sp * (ia * ix + fu * fk), tvy = sp * (ia * iy + fv * fk);
    g.ia = ia;
    const k = 1 - Math.exp(-dt * 3.2);
    g.vx += (tvx - g.vx) * k; g.vy += (tvy - g.vy) * k;
    g.x = clamp(g.x + g.vx * dt, PLAY.x0, PLAY.x1); g.y = clamp(g.y + g.vy * dt, PLAY.y0, PLAY.y1);
    // 차가운 꼬리: 강할수록, 오래 머물수록 식는다. 사흘쯤에 걸쳐 회복
    const rc = Math.max(0.5, 0.45 * g.R), cool = 0.32 * g.I * g.I * dt;
    for (let yy = g.y - rc; yy <= g.y + rc; yy += 0.5) for (let xx = g.x - rc; xx <= g.x + rc; xx += 0.5) {
      const d = Math.hypot(xx - g.x, yy - g.y); if (d > rc) continue; const w = wakeIdx(xx, yy); if (w >= 0) g.wake[w] = Math.min(4, g.wake[w] + cool * (1 - d / rc * 0.6));
    }
    if (((g.t / dt) | 0) % 8 === 0) { const f = Math.exp(-(dt * 8) / 72); for (let i = 0; i < g.wake.length; i++) if (g.wake[i] > 0.001) g.wake[i] *= f; else g.wake[i] = 0; }
    // 상륙
    if (land > 0.5 && g.I >= GRADES[2].min && !g.landfall) { g.landfall = true; ev.push({ k: 'land' }); }
    if (land > 0.5) g.landH += dt;
    // 구름
    const V = viewHalf(g.R);
    for (let i = g.items.length - 1; i >= 0; i--) {
      const it = g.items[i];
      if (it.st === 1) {
        it.p += dt / T.absorbH;
        if (it.p >= 1) { g.items.splice(i, 1); continue; }
        continue;
      }
      it.age += dt;
      const [u, v] = flow(g, it.x, it.y); it.x += u * 0.6 * dt; it.y += v * 0.6 * dt; it.rot += dt * 0.05;
      const dx = it.x - g.x, dy = it.y - g.y, d = Math.hypot(dx, dy);
      if (it.age > it.life + 6 || d > 2.3 * V) { g.items.splice(i, 1); continue; }
      if (d < g.R * 0.8 + it.s * 0.45) {
        if (it.s <= T.eat * g.R) {
          it.st = 1; it.p = 0; it.rx = dx; it.ry = dy;
          g.combo = g.t - g.lastEat < T.combo ? g.combo + 1 : 1; g.lastEat = g.t;
          const q = it.s / g.R;
          g.M = Math.min(1.5, g.M + 0.85 * q * q * (1 + 0.08 * Math.min(g.combo, 10)));
          g.R = Math.min(T.Rmax, Math.sqrt(g.R * g.R + T.grow * it.s * it.s));
          g.eaten++; ev.push({ k: 'eat', s: it.s, combo: g.combo, id: it.id });
        } else if (d < g.R * 0.55 + it.s * 0.55) {
          // 아직 큰 구름: 서로 밀어내고, 내 구조가 조금 흐트러진다
          const nx = dx / (d || 1), ny = dy / (d || 1), push = (g.R * 0.55 + it.s * 0.55 - d);
          g.x -= nx * push * 0.6; g.y -= ny * push * 0.6; it.x += nx * push * 0.4; it.y += ny * push * 0.4;
          if (g.t - g.lastBig > 1.5) { g.lastBig = g.t; g.bigHits++; g.I = Math.max(0, g.I - 0.01); ev.push({ k: 'big', ratio: it.s / g.R }); }
        }
      }
    }
    let live = 0; for (const it of g.items) if (it.st === 0) live++;
    for (let n = 0; live < T.items && n < 6; n++) if (spawn(g, false)) live++;
    // 점수: 바다 위에서만 ACE(6시간마다 (최대풍속 kt)² × 10⁻⁴ 를 시간으로 나눠 쌓는다)
    const vkt = wind(g.I) * 1.9438;
    if (vkt >= 34 && land < 0.5) g.ace += (vkt * vkt * 1e-4) * (dt / 6);
    // 단계 · 눈
    const gi = gradeIdx(g.I);
    if (gi > g.grade) { g.grade = gi; if (gi >= 2) ev.push({ k: 'grade', gi }); }
    else if (gi < g.grade - 1) g.grade = gi + 1;
    if (!g.eye && g.I > EYE_I) { g.eye = true; ev.push({ k: 'eye' }); } else if (g.eye && g.I < EYE_I - 0.08) g.eye = false;
    if (g.I > g.peakI) g.peakI = g.I; if (g.R > g.peakR) g.peakR = g.R;
    if (g.track.length === 0 || g.t - g.track[g.track.length - 1].t >= 3) g.track.push({ t: g.t, x: g.x, y: g.y, I: g.I });
    // 끝
    if (g.t >= T.lifeH) { g.over = true; g.end = 'life'; }
    else if (g.t > 24 && g.I < 0.02) { g.over = true; g.end = g.landH > 6 ? 'land' : 'fade'; }
    if (g.over) ev.push({ k: 'over', end: g.end });
  }

  function stars(ace) { return ace >= 30 ? 3 : ace >= 16 ? 2 : ace >= 6 ? 1 : 0; }
  const api = { D2R, KX, MAP, PLAY, T, WG, clamp, lerp, smooth, lonOf, xOf, decodeCoast, buildMask, isLand, landFrac, sstClim, sst, flow, shear, ridgeLat, jetLat, convection, wind, pres, GRADES, gradeIdx, EYE_I, viewHalf, newGame, step, stars, rng };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TG = api;
})(typeof window !== 'undefined' ? window : globalThis);
