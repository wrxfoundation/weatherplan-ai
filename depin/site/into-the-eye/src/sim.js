// 태풍 속으로 — 모형(브라우저 · Node 공용). 좌표: 태풍 중심 기준 km, x = 동, n = 북. 시간: 게임 초(실시간 1초).
(function (root) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const D2R = Math.PI / 180;

  const T = {
    penv: 1010,          // 바깥 기압 hPa
    B: 1.6,              // Holland 형상 계수
    airspeed: 100,       // 관측기 대기속도 m/s
    tc: 9,               // 시간 압축(실시간 1초 = 9초 비행)
    alt: 3.0,            // 비행 고도 km(700 hPa 부근)
    turnMax: 14,         // 최대 선회 °/s(게임 초)
    sondes: 2,
    fallS: 270,          // 낙하 관측기가 3 km 를 떨어지는 실제 시간(초) — 바람에 떠밀리는 거리 계산용
    fallShow: 4.5,       // 화면에서 보여 주는 시간
    timeLimit: 240,      // 연료(게임 초)
  };
  const PRESETS = [
    { id: 'g3', name: '강', pc: 960, rm: 34 },
    { id: 'g4', name: '매우 강', pc: 935, rm: 25 },
    { id: 'g5', name: '초강력', pc: 908, rm: 17 },
  ];

  // 값 노이즈(난류 칸 · 레이더 얼룩)
  function hash(i, j, s) { let h = (i * 374761393 + j * 668265263 + s * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
  function vnoise(x, y, s) {
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j; const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash(i, j, s), b = hash(i + 1, j, s), c = hash(i, j + 1, s), d = hash(i + 1, j + 1, s);
    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  }
  function fbm(x, y, s) { return vnoise(x, y, s) * 0.55 + vnoise(x * 2.1, y * 2.1, s + 7) * 0.3 + vnoise(x * 4.3, y * 4.3, s + 13) * 0.15; }

  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e7) / 1e7; }; }

  function makeStorm(opt) {
    const pc = opt.pc, rm = opt.rm, dp = T.penv - pc;
    const vSfc = 3.447 * Math.pow(Math.max(dp, 5), 0.644);    // Atkinson–Holliday 근사(지상 1분 평균, m/s)
    const vFL = vSfc / 0.9;                                    // 비행 고도 바람 ≈ 지상 ÷ 0.9
    const r = rng(opt.seed || 1);
    const mv = (opt.moveDeg != null ? opt.moveDeg : 125 + r() * 30) * D2R;   // 진행 방향(수학 각, 북서쪽 안팎)
    return {
      pc, rm, dp, vSfc, vFL, seed: opt.seed || 1, B: T.B,
      move: [Math.cos(mv) * 6, Math.sin(mv) * 6], moveAng: mv,
      bandPh: r() * 6.28, re: rm * 0.78,      // 눈 반경(비행 고도)
      intensity: clamp(dp / 100, 0.3, 1.1),
    };
  }
  function pressure(S, x, n) { const r = Math.max(0.05, Math.hypot(x, n)); return S.pc + S.dp * Math.exp(-Math.pow(S.rm / r, S.B)); }
  function windSpeed(S, r) {
    if (r < S.rm) return S.vFL * Math.pow(r / S.rm, 1.25);
    const xx = Math.pow(S.rm / r, S.B); return S.vFL * Math.sqrt(xx * Math.exp(1 - xx));
  }
  // 비행 고도 바람 벡터(m/s): 반시계 회전 + 바깥은 안으로 감겨 듦 + 진행 방향 쪽(오른쪽 앞)이 더 셈
  function wind(S, x, n) {
    const r = Math.max(0.05, Math.hypot(x, n)), th = Math.atan2(n, x);
    const v = windSpeed(S, r), inA = 18 * D2R * smooth(0.9 * S.rm, 1.4 * S.rm, r);
    const tx = -Math.sin(th), tn = Math.cos(th), rx = Math.cos(th), rn = Math.sin(th);
    const k = 0.55 * smooth(0.4 * S.rm, 1.0 * S.rm, r);
    return [v * (Math.cos(inA) * tx - Math.sin(inA) * rx) + S.move[0] * k, v * (Math.cos(inA) * tn - Math.sin(inA) * rn) + S.move[1] * k];
  }
  // 난류 · 비 · 눈벽 · 나선 띠
  function fields(S, x, n) {
    const r = Math.max(0.05, Math.hypot(x, n)), th = Math.atan2(n, x);
    const rf = Math.cos(th - (S.moveAng - Math.PI / 4));                       // 진행 방향 오른쪽 앞 = 1
    const cell = fbm(x / 9 + 3, n / 9 - 5, S.seed);
    const wallW = 0.32 * S.rm;
    const wall = Math.exp(-(((r - 1.05 * S.rm) / wallW) ** 2)) * (0.72 + 0.28 * rf) * (0.8 + 0.4 * cell);
    const lr = Math.log(r / S.rm);
    const arm = 0.5 + 0.5 * Math.cos(2 * (th + 1.35 * lr) + S.bandPh + (cell - 0.5) * 2.2);
    const band = smooth(0.5, 0.92, arm) * smooth(1.7 * S.rm, 2.6 * S.rm, r) * smooth(10 * S.rm, 5 * S.rm, r) * (0.55 + 0.45 * cell);
    const outer = 0.18 * smooth(1.3 * S.rm, 2.0 * S.rm, r) * (0.6 + 0.8 * cell);
    const eye = 1 - smooth(0.6 * S.re, 1.0 * S.re, r);
    const rain = clamp(Math.max(wall * 1.05, band * 0.85, outer), 0, 1) * (1 - eye);
    const turb = clamp((wall * 1.05 + band * 0.4 + outer * 0.35) * (0.55 + 0.5 * S.intensity), 0, 1.3) * (1 - 0.9 * eye);
    return { r, rain, turb, wall, band, eye };
  }
  function phase(S, r) { return r < S.re ? 'eye' : r < 1.55 * S.rm ? 'wall' : 'outer'; }

  function newFlight(S, seed) {
    const r = rng((seed || 1) * 31 + 7);
    const r0 = clamp(4.4 * S.rm, 60, 130);
    const b = r() * 6.2832;
    const x = Math.cos(b) * r0, n = Math.sin(b) * r0;
    const hdg = Math.atan2(-n, -x) + (r() - 0.5) * 0.5;      // 대략 중심 쪽
    return { S, x, n, hdg, turn: 0, t: 0, hull: 0, sondes: T.sondes, drops: [], maxWind: 0, minP: 9999, phase: 'outer', over: false, end: '', events: [], gs: [0, 0], visitedEye: false, flashT: 0 };
  }
  // 조작: steer -1..1(왼쪽 · 오른쪽)
  function step(F, steer, dt) {
    if (F.over || !(dt > 0)) return;
    const S = F.S; F.t += dt;
    F.turn += (clamp(steer, -1, 1) * T.turnMax * D2R - F.turn) * (1 - Math.exp(-dt * 4));
    F.hdg -= F.turn * dt;                                               // 오른쪽(+)이면 시계 방향
    const [wx, wn] = wind(S, F.x, F.n);
    const ax = Math.cos(F.hdg) * T.airspeed, an = Math.sin(F.hdg) * T.airspeed;
    const gx = ax + wx, gn = an + wn; F.gs = [gx, gn];
    F.x += gx * T.tc / 1000 * dt; F.n += gn * T.tc / 1000 * dt;
    const f = fields(S, F.x, F.n);
    F.f = f; F.wind = [wx, wn]; F.ws = Math.hypot(wx, wn); F.p = pressure(S, F.x, F.n);
    if (F.ws > F.maxWind) F.maxWind = F.ws;
    if (F.p < F.minP) F.minP = F.p;
    F.hull = clamp(F.hull + 8.5 * Math.pow(Math.max(0, f.turb - 0.22), 1.5) * dt, 0, 100);
    const ph = phase(S, f.r);
    if (ph !== F.phase) { F.events.push({ k: 'phase', from: F.phase, to: ph }); F.phase = ph; if (ph === 'eye') F.visitedEye = true; }
    // 번개: 비 · 난류가 센 곳에서
    if (f.rain > 0.45 && Math.random() < f.rain * f.rain * 0.9 * dt) F.events.push({ k: 'flash', i: 0.5 + 0.5 * Math.random() });
    // 낙하 관측기 진행
    for (const d of F.drops) if (!d.done) { d.age += dt; if (d.age >= T.fallShow) { d.done = true; F.events.push({ k: 'splash', d }); } }
    if (F.hull >= 100) { F.over = true; F.end = 'hull'; }
    else if (F.t >= T.timeLimit) { F.over = true; F.end = 'fuel'; }
    else if (F.sondes === 0 && F.drops.every(d => d.done)) { F.over = true; F.end = 'done'; }
    else if (f.r > 1.6 * clamp(4.4 * S.rm, 60, 130) + 20) { F.over = true; F.end = 'left'; }
    if (F.over) F.events.push({ k: 'over', end: F.end });
  }
  // 낙하: 떨어지는 동안 평균 바람(비행 고도의 약 0.8배)에 떠밀린 자리에서 지상 기압을 잰다
  function drop(F) {
    if (F.over || F.sondes <= 0) return null;
    const S = F.S; F.sondes--;
    let x = F.x, n = F.n; const steps = 18, dts = T.fallS / steps;
    for (let i = 0; i < steps; i++) { const [wx, wn] = wind(S, x, n); const k = 0.8 - 0.25 * (i / steps); x += wx * k * dts / 1000; n += wn * k * dts / 1000; }
    const pr = pressure(S, x, n), noise = (Math.random() - 0.5) * 0.6;
    const d = { t: F.t, x0: F.x, n0: F.n, x, n, p: pr + noise, r0: Math.hypot(F.x, F.n), r1: Math.hypot(x, n), sfcWind: windSpeed(S, Math.hypot(x, n)) * 0.9, age: 0, done: false };
    F.drops.push(d); F.events.push({ k: 'drop', d });
    return d;
  }
  function best(F) { let b = null; for (const d of F.drops) if (!b || d.p < b.p) b = d; return b; }
  function grade(F) {
    const b = best(F); if (!b || F.end === 'hull') return { stars: 0, err: null, b };
    const err = b.p - F.S.pc;
    let st = F.visitedEye ? 1 : 0;
    if (err <= 2 && F.visitedEye) st = 2;
    if (err <= 0.6 && F.hull <= 60 && F.visitedEye) st = 3;
    return { stars: st, err, b };
  }
  const api = { T, PRESETS, D2R, clamp, lerp, smooth, makeStorm, pressure, windSpeed, wind, fields, phase, newFlight, step, drop, best, grade, fbm };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TE = api;
})(typeof window !== 'undefined' ? window : globalThis);
