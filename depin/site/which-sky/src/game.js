(() => {
  'use strict';
  const LAND = /*@LAND@*/;
  const A = window.ASTRO; const { D2R, R2D } = A;
  const $ = s => document.querySelector(s);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const KEY = 'skyguess.v1';
  const kstKey = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  let store = {};
  try { const v = JSON.parse(localStorage.getItem(KEY) || '{}'); if (v && typeof v === 'object') store = v; } catch (e) { store = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* 저장 불가 환경 */ } };

  // ── 상태
  const today = kstKey();
  const HINT = { circle: 0.85, ghost: 0.6 };
  const S = { mode: 'daily', cities: A.daily(today), round: 0, scores: [], pin: null, revealed: false, hints: {}, lon0: 127 * D2R, lat0: 20 * D2R, zoom: 1, now: new Date() };
  const rec = store[today];
  if (rec && Array.isArray(rec.scores)) { S.scores = rec.scores.slice(0, 5); S.round = Math.min(S.scores.length, 5); }
  const city = () => (S.mode === 'daily' ? S.cities[Math.min(S.round, 4)] : S.practice);

  // ── WebGL 공통
  function glCtx(canvas, keep) { try { return canvas.getContext('webgl', { antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: !!keep }) || null; } catch (e) { return null; } }
  function program(gl, fs) {
    const sh = (t, src) => { const o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }')); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link'); gl.useProgram(p);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const ap = gl.getAttribLocation(p, 'p'); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
    const cache = {}; return new Proxy(cache, { get: (o, k) => (k in o ? o[k] : (o[k] = gl.getUniformLocation(p, k))) });
  }
  const NOISE = `float hash(vec2 p){ p = fract(p * vec2(443.897, 441.423)); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ s += a * noise(p); p = p * 2.07 + 3.1; a *= 0.5; } return s; }`;

  // ── 전천 하늘 셰이더(등거리 어안: 가운데 천정, 가장자리 지평선, 위=북·왼쪽=동)
  const SKY_FS = `precision highp float;
uniform vec2 uRes; uniform float uR; uniform vec3 uSun; uniform vec3 uMoon; uniform float uMoonK; uniform mat3 uGal;
${NOISE}
vec3 skyCol(vec3 d){
  float h = uSun.z; float up = max(d.z, 0.0); float mu = dot(d, uSun);
  float day = smoothstep(-0.12, 0.10, h);
  float twi = smoothstep(-0.32, -0.03, h) * (1.0 - smoothstep(0.02, 0.26, h));
  float hz = pow(1.0 - up, 4.0);
  vec3 zen = mix(vec3(0.006, 0.009, 0.024), vec3(0.10, 0.30, 0.78), day);
  vec3 hor = mix(vec3(0.02, 0.028, 0.06), vec3(0.58, 0.72, 0.90), day);
  float low = 1.0 - smoothstep(0.0, 0.35, h); zen = mix(zen, zen * vec3(0.55, 0.62, 0.85), low * day);
  vec3 col = mix(zen, hor, hz);
  vec2 dh = normalize(d.xy + 1e-5), sh = normalize(uSun.xy + 1e-5); float side = 0.5 + 0.5 * dot(dh, sh);
  col += twi * pow(1.0 - up, 6.0) * mix(vec3(0.62, 0.30, 0.45) * 0.35, vec3(1.0, 0.42, 0.16) * 1.2, pow(side, 4.0));
  col += twi * pow(1.0 - up, 2.0) * vec3(0.06, 0.05, 0.13);
  float vis = smoothstep(-0.05, 0.02, h);
  col += vec3(1.0, 0.82, 0.55) * (exp((mu - 1.0) * 400.0) * 1.5 + exp((mu - 1.0) * 30.0) * 0.35 + exp((mu - 1.0) * 5.0) * 0.12) * vis;
  float disc = smoothstep(0.99975, 0.99982, mu);
  vec3 sunC = mix(vec3(1.0, 0.55, 0.25), vec3(1.0, 0.97, 0.9), smoothstep(0.0, 0.2, h));
  col = mix(col, sunC * 4.0, disc * vis);
  float mm = dot(d, uMoon);
  col += vec3(0.75, 0.8, 1.0) * exp((mm - 1.0) * 250.0) * 0.3 * uMoonK * (1.0 - day) * step(-0.02, uMoon.z);
  vec3 g = uGal * d; float b = asin(clamp(g.z, -1.0, 1.0));
  float mw = exp(-b * b / 0.02) * (0.5 + 0.5 * fbm(g.xy * 3.0 + vec2(g.z * 7.0))) + exp(-b * b / 0.004) * 0.35 * fbm(g.xy * 9.0 + 2.0);
  mw *= (1.0 - smoothstep(-0.30, -0.18, h)) * 0.075 * (1.0 - 0.6 * uMoonK * step(0.0, uMoon.z));
  col += vec3(0.75, 0.78, 0.95) * mw;
  return col;
}
void main(){
  vec2 c = gl_FragCoord.xy - 0.5 * uRes; float r = length(c) / uR;
  if (r > 1.0) { float g = exp(-(r - 1.0) * uR / 5.0) * 0.5; gl_FragColor = vec4(vec3(0.25, 0.32, 0.6) * g * 0.35, g * 0.35); return; }
  float alt = (1.0 - r) * 1.5707963, az = atan(-c.x, c.y);
  vec2 hd = vec2(sin(az), cos(az)); vec3 d = vec3(hd * cos(alt), sin(alt));
  float ridge = 0.012 + 0.030 * fbm(hd * 2.4 + 7.0) + 0.010 * fbm(hd * 9.0 + 2.0);
  vec3 col = alt < ridge ? skyCol(normalize(vec3(hd, 0.02))) * 0.07 + vec3(0.004, 0.005, 0.009) : skyCol(d);
  col = 1.0 - exp(-col * 1.45);
  float edge = 1.0 - smoothstep(1.0 - 1.5 / uR, 1.0, r);
  gl_FragColor = vec4(col * edge, edge);
}`;

  // ── 지구본 셰이더: 직교 투영, 밤낮·박명, 30° 경위선
  const GLOBE_FS = `precision highp float;
uniform vec2 uRes; uniform float uLon0; uniform float uLat0; uniform float uZoom; uniform vec3 uSub; uniform sampler2D uLand;
void main(){
  float R = 0.5 * min(uRes.x, uRes.y) * 0.9 * uZoom;
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / R; float r2 = dot(p, p);
  if (r2 > 1.0) { float a = exp(-(sqrt(r2) - 1.0) * R / 12.0) * 0.45; gl_FragColor = vec4(vec3(0.35, 0.55, 1.0) * a, a); return; }
  float z = sqrt(1.0 - r2); float cl = cos(uLat0), sl = sin(uLat0), co = cos(uLon0), so = sin(uLon0);
  vec3 e = p.x * vec3(-so, co, 0.0) + p.y * vec3(-sl * co, -sl * so, cl) + z * vec3(cl * co, cl * so, sl);
  float lat = asin(clamp(e.z, -1.0, 1.0)), lon = atan(e.y, e.x);
  float land = smoothstep(0.3, 0.7, texture2D(uLand, vec2(lon / 6.2831853 + 0.5, 0.5 - lat / 3.1415927)).r);
  vec3 col = mix(vec3(0.045, 0.12, 0.25), vec3(0.34, 0.40, 0.33), land);
  float gw = 0.0035 / uZoom;
  float gl = min(abs(fract(lat / 0.5235988 + 0.5) - 0.5), abs(fract(lon / 0.5235988 + 0.5) - 0.5) * cos(lat)) * 0.5235988;
  col = mix(col, vec3(0.55, 0.65, 0.9), (1.0 - smoothstep(gw * 0.5, gw * 1.5, gl)) * 0.22);
  float sd = dot(e, uSub); float dayf = smoothstep(-0.10, 0.05, sd);
  col = mix(col * 0.2 + vec3(0.0, 0.008, 0.03), col * (0.78 + 0.32 * clamp(sd, 0.0, 1.0)), dayf);
  col += vec3(1.0, 0.5, 0.2) * 0.13 * exp(-sd * sd / 0.003);
  col *= 0.62 + 0.38 * z; col += vec3(0.25, 0.45, 1.0) * pow(1.0 - z, 3.0) * 0.35;
  gl_FragColor = vec4(col, 1.0);
}`;

  // ── 캔버스
  const els = { sky: $('#skyA'), sGl: $('#skyAgl'), s2d: $('#skyA2d'), globe: $('#globe'), gGl: $('#gGl'), g2d: $('#g2d'), mini: $('#mini') };
  const glS = glCtx(els.sGl, true), glG = glCtx(els.gGl);
  const fail = msg => { document.querySelector('.stage').innerHTML = `<div class="card nogl">${msg}</div>`; };
  if (!glS || !glG) return fail('이 브라우저에서는 WebGL을 쓸 수 없어 하늘과 지구본을 그릴 수 없습니다. 최신 크롬·사파리·엣지에서 열어 주세요.');
  let uS, uG;
  try { uS = program(glS, SKY_FS); uG = program(glG, GLOBE_FS); } catch (e) { return fail('그래픽 초기화에 실패했습니다. 다른 브라우저에서 열어 주세요.'); }

  (function landTexture() { // 등장방형 2048×1024 육지 마스크
    const c = document.createElement('canvas'); c.width = 2048; c.height = 1024; const x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, 2048, 1024); x.fillStyle = '#fff'; x.beginPath();
    const XY = (lon, lat) => [((lon + 180) / 360) * 2048, ((90 - lat) / 180) * 1024];
    const ring = (pts, off) => { pts.forEach(([lo, la], i) => { const [X, Y] = XY(lo + off, la); i ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.closePath(); };
    for (const r of LAND) {
      let px = 0, py = 0; let pts = []; for (let i = 0; i < r.d.length; i += 2) { px += r.d[i]; py += r.d[i + 1]; pts.push([px / 10, py / 10]); }
      const jumps = []; for (let i = 1; i < pts.length; i++) if (Math.abs(pts[i][0] - pts[i - 1][0]) > 180) jumps.push(i);
      if (jumps.length === 1) { // 극을 도는 고리(남극): 날짜변경선에서 극까지 내려 닫는다
        pts = pts.slice(jumps[0]).concat(pts.slice(0, jumps[0])); const f = pts[0], l = pts[pts.length - 1]; const pole = f[1] < 0 ? -90 : 90;
        pts = pts.concat([[Math.sign(l[0]) * 180, l[1]], [Math.sign(l[0]) * 180, pole], [Math.sign(f[0]) * 180, pole], [Math.sign(f[0]) * 180, f[1]]]); ring(pts, 0);
      } else if (jumps.length) { // 날짜변경선을 넘는 고리: 경도를 이어 붙이고 ±360° 사본까지 그린다
        for (let i = 1; i < pts.length; i++) { while (pts[i][0] - pts[i - 1][0] > 180) pts[i][0] -= 360; while (pts[i][0] - pts[i - 1][0] < -180) pts[i][0] += 360; }
        for (const off of [-360, 0, 360]) ring(pts, off);
      } else ring(pts, 0);
    }
    x.fill('evenodd');
    const gl = glG; const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(uG.uLand, 0);
  })();

  const size = {};
  function fit(el, cs, key) {
    const r = el.getBoundingClientRect(); const dpr = Math.min(2, window.devicePixelRatio || 1);
    for (const c of cs) { c.width = Math.max(1, Math.round(r.width * dpr)); c.height = Math.max(1, Math.round(r.height * dpr)); }
    size[key] = { w: r.width, h: r.height, dpr };
  }
  function resize() {
    fit(els.sky, [els.sGl, els.s2d], 's'); fit(els.globe, [els.gGl, els.g2d], 'g');
    const mr = els.mini.getBoundingClientRect(); const dpr = Math.min(2, window.devicePixelRatio || 1); els.mini.width = Math.max(1, Math.round(mr.width * dpr)); els.mini.height = Math.max(1, Math.round(mr.height * dpr));
    glS.viewport(0, 0, els.sGl.width, els.sGl.height); glG.viewport(0, 0, els.gGl.width, els.gGl.height);
    dirty.sky = dirty.globe = true;
  }

  // ── 관측: 지점·시각 → 태양·달·별의 지평 좌표(동·북·천정)
  function observe(lat, lon, date) {
    const f = A.frame(lat, lon, date); const s = A.sun(date), m = A.moon(date);
    const sunV = A.eqVec(s.ra, s.dec), moonV = A.eqVec(m.ra, m.dec); const k = (1 - A.dot(sunV, moonV)) / 2;
    const gal = A.GAL.map(row => [A.dot(row, f.E), A.dot(row, f.N), A.dot(row, f.U)]);
    const stars = A.STARS.map(st => A.toENU(f, A.eqVec(st[1] * 15 * D2R, st[2] * D2R)));
    return { sun: A.toENU(f, sunV), moon: A.toENU(f, moonV), moonK: k, gal, stars, f };
  }
  const FAINT = (() => { const r = A.rng(7331); const o = []; for (let i = 0; i < 520; i++) { const z = r() * 2 - 1, t = r() * Math.PI * 2, q = Math.sqrt(1 - z * z); o.push({ v: [q * Math.cos(t), q * Math.sin(t), z], m: 3.6 + r() * 1.9 }); } return o; })();
  const altOf = d => Math.asin(clamp(d[2], -1, 1)), azOf = d => Math.atan2(d[0], d[1]);
  const COMPASS = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
  const comp8 = az => COMPASS[Math.round((((az * R2D) % 360) + 360) % 360 / 45) % 8];
  function phaseName(k, waxing) { if (k < 0.04) return '그믐·삭'; if (k > 0.96) return '보름'; if (Math.abs(k - 0.5) < 0.1) return waxing ? '상현' : '하현'; return k < 0.5 ? (waxing ? '초승' : '그믐') : waxing ? '차오르는 달' : '기우는 달'; }

  // 어안 투영: 방향 → 돔 좌표
  function domeGeom(sz) { const m = Math.min(sz.w, sz.h); const R = m / 2 - Math.max(30, m * 0.075); return { cx: sz.w / 2, cy: sz.h / 2, R }; }
  function dproj(d, g) { const alt = altOf(d); const rho = 1 - alt / (Math.PI / 2); const az = azOf(d); return [g.cx - g.R * rho * Math.sin(az), g.cy - g.R * rho * Math.cos(az), alt]; }

  function drawSky() {
    const obs = obsA; const gl = glS; const sz = size.s; const g = domeGeom(sz);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uS.uRes, gl.drawingBufferWidth, gl.drawingBufferHeight); gl.uniform1f(uS.uR, g.R * sz.dpr);
    gl.uniform3fv(uS.uSun, obs.sun); gl.uniform3fv(uS.uMoon, obs.moon); gl.uniform1f(uS.uMoonK, obs.moonK);
    const m = obs.gal; gl.uniformMatrix3fv(uS.uGal, false, [m[0][0], m[1][0], m[2][0], m[0][1], m[1][1], m[2][1], m[0][2], m[1][2], m[2][2]]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    const c = els.s2d.getContext('2d'); c.setTransform(sz.dpr, 0, 0, sz.dpr, 0, 0); c.clearRect(0, 0, sz.w, sz.h);
    const sunAlt = altOf(obs.sun) * R2D; const vis = mag => clamp((-sunAlt - (4 + 2.3 * (mag + 1.5))) / 3, 0, 1);
    c.save(); c.beginPath(); c.arc(g.cx, g.cy, g.R, 0, Math.PI * 2); c.clip();
    for (const fs of FAINT) { const a = vis(fs.m); if (a <= 0) continue; const d = A.toENU(obs.f, fs.v); if (d[2] < 0.03) continue; const p = dproj(d, g); c.globalAlpha = a * 0.6 * clamp(d[2] / 0.1, 0, 1); c.fillStyle = '#CFD6FF'; c.fillRect(p[0] - 0.6, p[1] - 0.6, 1.2, 1.2); }
    const pts = obs.stars.map((d, i) => { const st = A.STARS[i]; const a = vis(st[3]) * clamp(d[2] / 0.06, 0, 1); return a > 0 && d[2] > 0 ? { p: dproj(d, g), a, st } : null; });
    c.globalAlpha = 1; c.lineWidth = 1; c.strokeStyle = 'rgba(160,175,255,0.24)';
    for (const [i, j] of A.LINES) { const a = pts[i], b = pts[j]; if (!a || !b) continue; c.globalAlpha = Math.min(a.a, b.a); c.beginPath(); c.moveTo(a.p[0], a.p[1]); c.lineTo(b.p[0], b.p[1]); c.stroke(); }
    const fsz = sz.w < 420 ? 9.5 : 11; c.font = `500 ${fsz}px 'IBM Plex Sans KR', sans-serif`; c.textBaseline = 'middle';
    for (const q of pts) {
      if (!q) continue; const r = Math.max(0.7, (sz.w < 420 ? 2.2 : 2.7) - 0.55 * q.st[3]); c.globalAlpha = q.a;
      const gr = c.createRadialGradient(q.p[0], q.p[1], 0, q.p[0], q.p[1], r * 2.6); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(225,232,255,0.85)'); gr.addColorStop(1, 'rgba(200,210,255,0)');
      c.fillStyle = gr; c.beginPath(); c.arc(q.p[0], q.p[1], r * 2.6, 0, Math.PI * 2); c.fill();
      if (A.LABELED.has(q.st[0]) && q.a > 0.5) { c.fillStyle = 'rgba(200,208,245,0.85)'; c.fillText(q.st[0], q.p[0] + r + 5, q.p[1]); }
    }
    c.globalAlpha = 1;
    if (obs.moon[2] > -0.01) drawMoon(c, obs, g, sunAlt);
    // 고도 원 30°·60°
    c.setLineDash([2, 5]); c.strokeStyle = 'rgba(210,220,255,0.22)'; c.lineWidth = 1;
    for (const a of [30, 60]) { c.beginPath(); c.arc(g.cx, g.cy, g.R * (1 - a / 90), 0, Math.PI * 2); c.stroke(); }
    c.setLineDash([]); c.fillStyle = 'rgba(210,220,255,0.55)'; c.font = "500 10px 'IBM Plex Mono', monospace"; c.textBaseline = 'middle'; c.textAlign = 'left';
    for (const a of [30, 60]) c.fillText(`${a}°`, g.cx + 4, g.cy - g.R * (1 - a / 90) + 7);
    if (S.hints.ghost || S.revealed) drawGhost(c, g);
    c.restore();
    // 테두리 방위
    c.strokeStyle = 'rgba(210,220,255,0.35)'; c.lineWidth = 1; c.beginPath(); c.arc(g.cx, g.cy, g.R, 0, Math.PI * 2); c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let k = 0; k < 72; k++) {
      const az = k * 5 * D2R; const sx = -Math.sin(az), sy = -Math.cos(az); const major = k % 9 === 0; const len = major ? 8 : k % 3 === 0 ? 5 : 3;
      c.strokeStyle = major ? 'rgba(236,238,248,0.8)' : 'rgba(210,220,255,0.35)'; c.beginPath(); c.moveTo(g.cx + sx * g.R, g.cy + sy * g.R); c.lineTo(g.cx + sx * (g.R + len), g.cy + sy * (g.R + len)); c.stroke();
      if (major) { const lab = COMPASS[k / 9]; const main = lab.length === 1; c.font = `${main ? 600 : 500} ${main ? (sz.w < 420 ? 13 : 15) : sz.w < 420 ? 10 : 11}px 'IBM Plex Sans KR', sans-serif`; c.fillStyle = k === 0 ? '#FFC45C' : main ? 'rgba(236,238,248,0.95)' : 'rgba(200,208,235,0.6)'; const off = g.R + (main ? 18 : 16); c.fillText(lab, g.cx + sx * off, g.cy + sy * off); }
    }
    // 휴대폰: 지구본 모서리의 작은 하늘
    const mc = els.mini.getContext('2d'); if (els.mini.width > 2) { mc.clearRect(0, 0, els.mini.width, els.mini.height); mc.drawImage(els.sGl, 0, 0, els.mini.width, els.mini.height); mc.drawImage(els.s2d, 0, 0, els.mini.width, els.mini.height); }
  }
  function drawMoon(c, obs, g, sunAlt) {
    const p = dproj(obs.moon, g); const rad = Math.max(6, (g.R / 90) * 2.2);
    const ahead = [0, 1, 2].map(i => obs.moon[i] + (obs.sun[i] - obs.moon[i]) * 0.04); const pa = dproj(ahead, g); const ang = Math.atan2(pa[1] - p[1], pa[0] - p[0]); const k = obs.moonK;
    const dayA = clamp((sunAlt + 6) / 10, 0, 1);
    c.save(); c.translate(p[0], p[1]); c.rotate(ang);
    c.globalAlpha = 1 - dayA * 0.75; c.fillStyle = 'rgba(40,46,70,0.9)'; c.beginPath(); c.arc(0, 0, rad, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 1 - dayA * 0.45; c.fillStyle = '#E9ECFF'; c.beginPath(); c.arc(0, 0, rad, -Math.PI / 2, Math.PI / 2); c.ellipse(0, 0, rad * Math.abs(1 - 2 * k), rad, 0, Math.PI / 2, -Math.PI / 2, k < 0.5); c.fill();
    c.restore(); c.globalAlpha = 1;
  }
  const GHOST_STARS = ['북극성', '시리우스', '카노푸스', '베가', '아크룩스', '베텔게우스', '아크투루스', '안타레스', '카펠라', '알타이르'];
  function drawGhost(c, g) {
    if (!obsB) return; const o = obsB; c.save(); c.strokeStyle = '#FF7657'; c.fillStyle = '#FF7657'; c.lineWidth = 2;
    const sAlt = altOf(o.sun);
    if (sAlt > -0.01) { const p = dproj(o.sun, g); c.beginPath(); c.arc(p[0], p[1], 11, 0, Math.PI * 2); c.stroke(); c.font = "600 11px 'IBM Plex Sans KR', sans-serif"; c.textAlign = 'left'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(7,9,19,0.85)'; c.strokeText('내 핀의 태양', p[0] + 15, p[1]); c.fillText('내 핀의 태양', p[0] + 15, p[1]); c.strokeStyle = '#FF7657'; c.lineWidth = 2; }
    if (o.moon[2] > -0.01) { const p = dproj(o.moon, g); c.setLineDash([3, 3]); c.beginPath(); c.arc(p[0], p[1], 9, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); }
    const night = altOf(obsA.sun) < -6 * D2R;
    if (night) for (const nm of GHOST_STARS) { const i = A.STARS.findIndex(s => s[0] === nm); const d = o.stars[i]; if (d[2] <= 0.02) continue; const p = dproj(d, g); c.lineWidth = 1.5; c.beginPath(); c.arc(p[0], p[1], 5, 0, Math.PI * 2); c.stroke(); }
    c.restore();
  }
  function renderReadout() {
    const o = obsA; const sa = altOf(o.sun) * R2D, ma = altOf(o.moon) * R2D; const r5 = x => Math.round(x / 5) * 5;
    const waxing = (() => { const m2 = A.moon(new Date(S.now.getTime() + 3600e3)), s2 = A.sun(S.now); const k2 = (1 - A.dot(A.eqVec(s2.ra, s2.dec), A.eqVec(m2.ra, m2.dec))) / 2; return k2 > o.moonK; })();
    const sunTxt = sa > 0 ? `고도 약 ${Math.max(5, r5(sa))}° · ${comp8(azOf(o.sun))}쪽 하늘` : sa > -18 ? `지평선 아래 · ${sa > -6 ? '해가 막 지거나 뜨는 중' : '박명'}` : '지평선 아래 · 깊은 밤';
    const moonTxt = ma > 0 ? `고도 약 ${Math.max(5, r5(ma))}° · ${comp8(azOf(o.moon))}쪽 · ${phaseName(o.moonK, waxing)}` : `지평선 아래 · ${phaseName(o.moonK, waxing)}`;
    let html = `<dt>태양</dt><dd>${sunTxt}</dd><dt>달</dt><dd>${moonTxt}</dd>`;
    if ((S.hints.ghost || S.revealed) && obsB) { const pa = altOf(obsB.sun) * R2D; html += `<dt class="ghost">내 핀</dt><dd class="ghost">태양 ${pa > 0 ? `고도 약 ${Math.max(5, r5(pa))}° · ${comp8(azOf(obsB.sun))}쪽` : '지평선 아래'}</dd>`; }
    $('#readout').innerHTML = html;
  }

  // ── 지구본
  function gBasis() { const cl = Math.cos(S.lat0), sl = Math.sin(S.lat0), co = Math.cos(S.lon0), so = Math.sin(S.lon0); return { E: [-so, co, 0], N: [-sl * co, -sl * so, cl], C: [cl * co, cl * so, sl] }; }
  const ecef = (lat, lon) => [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
  const gR = () => 0.5 * Math.min(size.g.w, size.g.h) * 0.9 * S.zoom;
  function gProject(lat, lon) { const b = gBasis(); const e = ecef(lat, lon); const R = gR(); return { x: size.g.w / 2 + A.dot(e, b.E) * R, y: size.g.h / 2 - A.dot(e, b.N) * R, vis: A.dot(e, b.C) > 0 }; }
  function gUnproject(x, y) {
    const R = gR(); const px = (x - size.g.w / 2) / R, py = -(y - size.g.h / 2) / R; const r2 = px * px + py * py; if (r2 > 1) return null;
    const b = gBasis(); const z = Math.sqrt(1 - r2); const e = [0, 1, 2].map(i => px * b.E[i] + py * b.N[i] + z * b.C[i]);
    return { lat: Math.asin(clamp(e[2], -1, 1)), lon: Math.atan2(e[1], e[0]) };
  }
  function gPath(c, pts) { c.beginPath(); let on = false; for (const [lat, lon] of pts) { const p = gProject(lat, lon); if (!p.vis) { on = false; continue; } if (!on) { c.moveTo(p.x, p.y); on = true; } else c.lineTo(p.x, p.y); } }
  function marker(c, lat, lon, color, kind) {
    const p = gProject(lat, lon); if (!p.vis) return; c.save();
    if (kind === 'sun') { c.fillStyle = color; c.beginPath(); c.arc(p.x, p.y, 5, 0, Math.PI * 2); c.fill(); c.strokeStyle = color; c.lineWidth = 1.5; for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4; c.beginPath(); c.moveTo(p.x + Math.cos(a) * 8, p.y + Math.sin(a) * 8); c.lineTo(p.x + Math.cos(a) * 11, p.y + Math.sin(a) * 11); c.stroke(); } }
    else if (kind === 'pin') { c.fillStyle = color; c.strokeStyle = '#1A0B06'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(p.x, p.y); c.bezierCurveTo(p.x - 9, p.y - 12, p.x - 8, p.y - 24, p.x, p.y - 24); c.bezierCurveTo(p.x + 8, p.y - 24, p.x + 9, p.y - 12, p.x, p.y); c.fill(); c.stroke(); c.fillStyle = '#1A0B06'; c.beginPath(); c.arc(p.x, p.y - 16, 3, 0, Math.PI * 2); c.fill(); }
    else { c.strokeStyle = color; c.lineWidth = 2.5; c.beginPath(); c.arc(p.x, p.y, 8, 0, Math.PI * 2); c.stroke(); c.fillStyle = color; c.beginPath(); c.arc(p.x, p.y, 3, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }
  function altCircle(ss, alt) { const rho = Math.PI / 2 - alt; const o = []; for (let k = 0; k <= 180; k++) { const be = (k / 180) * Math.PI * 2; const la = Math.asin(Math.sin(ss.lat) * Math.cos(rho) + Math.cos(ss.lat) * Math.sin(rho) * Math.cos(be)); const lo = ss.lon + Math.atan2(Math.sin(be) * Math.sin(rho) * Math.cos(ss.lat), Math.cos(rho) - Math.sin(ss.lat) * Math.sin(la)); o.push([la, lo]); } return o; }
  function drawGlobe() {
    const gl = glG; const ss = A.subsolar(S.now);
    gl.uniform2f(uG.uRes, gl.drawingBufferWidth, gl.drawingBufferHeight); gl.uniform1f(uG.uLon0, S.lon0); gl.uniform1f(uG.uLat0, S.lat0); gl.uniform1f(uG.uZoom, S.zoom);
    gl.uniform3fv(uG.uSub, ecef(ss.lat, ss.lon)); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    const c = els.g2d.getContext('2d'); const { w, h, dpr } = size.g; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    const ct = city();
    if (S.hints.circle || S.revealed) { c.setLineDash([3, 5]); c.strokeStyle = 'rgba(255,196,92,0.8)'; c.lineWidth = 1.6; gPath(c, altCircle(ss, altOf(obsA.sun))); c.stroke(); c.setLineDash([]); }
    if (S.revealed) {
      if (S.pin) {
        const a = ecef(S.pin.lat, S.pin.lon), b = ecef(ct.lat, ct.lon); const om = Math.acos(clamp(A.dot(a, b), -1, 1)); const arc = [];
        for (let k = 0; k <= 64; k++) { const t = k / 64; const s0 = om < 1e-6 ? 1 - t : Math.sin((1 - t) * om) / Math.sin(om), s1 = om < 1e-6 ? t : Math.sin(t * om) / Math.sin(om); const v = [0, 1, 2].map(i => a[i] * s0 + b[i] * s1); arc.push([Math.asin(clamp(v[2], -1, 1)), Math.atan2(v[1], v[0])]); }
        c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 1.6; gPath(c, arc); c.stroke();
      }
      marker(c, ct.lat, ct.lon, '#6FF0C5', 'ans');
      const p = gProject(ct.lat, ct.lon); if (p.vis) { c.font = "600 13px 'IBM Plex Sans KR', sans-serif"; c.lineWidth = 3; c.strokeStyle = 'rgba(3,5,12,0.9)'; c.strokeText(ct.name, p.x + 12, p.y - 10); c.fillStyle = '#6FF0C5'; c.fillText(ct.name, p.x + 12, p.y - 10); }
    }
    marker(c, ss.lat, ss.lon, '#FFC45C', 'sun');
    if (S.pin) marker(c, S.pin.lat, S.pin.lon, '#FF7657', 'pin');
  }

  // ── 렌더 루프(바뀐 것만)
  const dirty = { sky: true, globe: true };
  let obsA = null, obsB = null, lastObs = -1e9;
  function frame(t) {
    if (t - lastObs > 20000) { S.now = new Date(); const ct = city(); obsA = observe(ct.lat, ct.lon, S.now); obsB = S.pin ? observe(S.pin.lat, S.pin.lon, S.now) : null; lastObs = t; dirty.sky = dirty.globe = true; clockText(); renderReadout(); }
    if (dirty.sky) { drawSky(); dirty.sky = false; }
    if (dirty.globe) { drawGlobe(); dirty.globe = false; }
    requestAnimationFrame(frame);
  }
  function clockText() { const d = S.now, p2 = n => String(n).padStart(2, '0'), k = new Date(d.getTime() + 9 * 3600e3); $('#clock').textContent = `UTC ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())} · 한국 ${p2(k.getUTCHours())}:${p2(k.getUTCMinutes())}`; }

  // ── 지구본 조작: 끌면 회전, 누르면 핀
  (function bindGlobe() {
    const el = els.globe; let st = null;
    el.addEventListener('pointerdown', e => { if (e.target.closest('.zoom')) return; st = { x: e.clientX, y: e.clientY, lon0: S.lon0, lat0: S.lat0, moved: false, id: e.pointerId }; try { el.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ } });
    el.addEventListener('pointermove', e => {
      if (!st || st.id !== e.pointerId) return; const dx = e.clientX - st.x, dy = e.clientY - st.y;
      if (!st.moved && Math.hypot(dx, dy) > 6) { st.moved = true; el.classList.add('grabbing'); }
      if (st.moved) { const R = gR(); S.lon0 = A.wrapPi(st.lon0 - dx / R); S.lat0 = clamp(st.lat0 + dy / R, -80 * D2R, 80 * D2R); dirty.globe = true; }
    });
    const end = e => {
      if (!st || st.id !== e.pointerId) return; const moved = st.moved; st = null; el.classList.remove('grabbing'); if (moved || S.revealed) return;
      const r = el.getBoundingClientRect(); const ll = gUnproject(e.clientX - r.left, e.clientY - r.top); if (!ll) return; setPin(ll);
    };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', () => { st = null; el.classList.remove('grabbing'); });
    el.addEventListener('wheel', e => { e.preventDefault(); S.zoom = clamp(S.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), 1, 6); dirty.globe = true; }, { passive: false });
    $('#zin').addEventListener('click', () => { S.zoom = clamp(S.zoom * 1.4, 1, 6); dirty.globe = true; });
    $('#zout').addEventListener('click', () => { S.zoom = clamp(S.zoom / 1.4, 1, 6); dirty.globe = true; });
  })();
  function setPin(ll) { S.pin = ll; obsB = observe(ll.lat, ll.lon, S.now); dirty.sky = dirty.globe = true; renderReadout(); renderPanel(); }

  // ── 진행·패널
  let toastT = 0;
  function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1800); }
  const fmtKm = km => Math.round(km).toLocaleString('ko-KR') + 'km';
  const total = () => S.scores.reduce((a, b) => a + b, 0);
  const mult = () => (S.hints.circle ? HINT.circle : 1) * (S.hints.ghost ? HINT.ghost : 1);
  function renderRounds() {
    const el = $('#rounds'); el.innerHTML = '';
    for (let i = 0; i < 5; i++) { const d = document.createElement('div'); const done = i < S.scores.length; d.className = 'rchip' + (done ? ' done' : '') + (S.mode === 'daily' && i === S.round && !done ? ' now' : ''); d.innerHTML = `${i + 1}<b>${done ? S.scores[i].toLocaleString('ko-KR') : '—'}</b>`; el.appendChild(d); }
    const t = document.createElement('div'); t.className = 'total'; t.innerHTML = `합계 <b>${total().toLocaleString('ko-KR')}</b> / 25,000`; el.appendChild(t);
  }
  function solarTime(lon) { const h = ((S.now.getUTCHours() + S.now.getUTCMinutes() / 60 + (lon * R2D) / 15) % 24 + 24) % 24; return `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`; }
  function renderPanel() {
    const el = $('#panel');
    if (S.mode === 'daily' && S.round >= 5) return renderSummary();
    if (!S.revealed) {
      const m = mult();
      el.innerHTML = `<h2>${S.mode === 'daily' ? `오늘의 하늘 ${S.round + 1} / 5` : '연습 하늘'}</h2>` +
        `<p>하늘 원의 태양·달·별을 읽고 지구본을 눌러 핀을 꽂으세요. 지구본은 끌어서 돌립니다.</p>` +
        `<div class="row"><button class="btn sm" id="hc" type="button" ${S.hints.circle ? 'disabled' : ''}>힌트 · 태양 고도 원 (×${HINT.circle})</button>` +
        `<button class="btn sm" id="hg" type="button" ${S.hints.ghost ? 'disabled' : ''}>힌트 · 내 핀의 하늘 겹쳐 보기 (×${HINT.ghost})</button></div>` +
        `<div class="row"><button class="btn primary" id="lock" type="button" ${S.pin ? '' : 'disabled'}>이 위치로 확정</button>${m < 1 ? `<span style="align-self:center;color:var(--ink-3);font-size:13px">이번 판 점수 ×${m.toFixed(2)}</span>` : ''}</div>`;
      $('#lock').addEventListener('click', reveal);
      $('#hc').addEventListener('click', () => { S.hints.circle = true; dirty.globe = true; renderPanel(); toast('노란 점선 위 어딘가가 정답입니다'); });
      $('#hg').addEventListener('click', () => { S.hints.ghost = true; dirty.sky = true; renderReadout(); renderPanel(); toast(S.pin ? '산호색이 내 핀에서 본 하늘입니다' : '핀을 꽂으면 산호색으로 겹쳐 보입니다'); });
      return;
    }
    const ct = city(); const km = A.distKm(S.pin, ct); const base = A.score(km); const sc = Math.round(base * mult()); const alt = altOf(obsA.sun) * R2D;
    el.innerHTML = `<h2>${ct.name} <span style="color:var(--ink-3);font-weight:400;font-size:14px">${A.CONT[ct.cont]}</span></h2>` +
      `<div class="big">${sc.toLocaleString('ko-KR')}점</div>` +
      `<dl class="facts"><dt>거리</dt><dd>${fmtKm(km)}</dd><dt>현지 태양시</dt><dd>${solarTime(ct.lon)}</dd><dt>태양 고도</dt><dd>${alt.toFixed(0)}°${alt < -18 ? ' (깊은 밤)' : alt < 0 ? ' (박명)' : ''}</dd>${mult() < 1 ? `<dt>힌트</dt><dd>${base.toLocaleString('ko-KR')}점 × ${mult().toFixed(2)}</dd>` : ''}</dl>` +
      `<p style="margin-top:10px">노란 점선은 지금 태양 고도가 ${ct.name}과 같은 곳입니다. 정답은 늘 그 원 위에 있습니다. 산호색 표시는 내 핀에서 본 하늘입니다.</p>` +
      `<div class="row"><button class="btn primary" id="next" type="button">${S.mode === 'daily' ? (S.round >= 4 ? '결과 보기' : '다음 하늘 →') : '다른 연습 하늘'}</button></div>`;
    $('#next').addEventListener('click', next);
  }
  function renderSummary() {
    const el = $('#panel'); const t = total();
    el.innerHTML = `<h2>오늘의 다섯 하늘</h2><div class="big">${t.toLocaleString('ko-KR')}점</div><p>25,000점 만점 · ${today} · 내일 새 하늘이 열립니다</p>` +
      `<ol class="list">${S.cities.map((c, i) => `<li><span class="n">${i + 1}</span><span>${c.name}</span><span class="s">${(S.scores[i] || 0).toLocaleString('ko-KR')}</span></li>`).join('')}</ol>` +
      `<div class="row"><button class="btn primary" id="share" type="button">결과 복사</button><button class="btn" id="practice" type="button">연습 한 판</button></div>`;
    $('#share').addEventListener('click', async () => {
      const sq = s => (s >= 4000 ? '🟩' : s >= 2500 ? '🟨' : s >= 1000 ? '🟧' : '🟥');
      const text = `이 하늘, 어디게? ${today}\n${t.toLocaleString('ko-KR')} / 25,000\n${S.scores.map(sq).join('')}`;
      try { await navigator.clipboard.writeText(text); toast('결과를 복사했습니다'); } catch (e) { toast(text.replace(/\n/g, ' · ')); }
    });
    $('#practice').addEventListener('click', startPractice);
  }
  function reveal() {
    if (!S.pin || S.revealed) return; S.revealed = true; const ct = city(); const sc = Math.round(A.score(A.distKm(S.pin, ct)) * mult());
    if (S.mode === 'daily') { S.scores[S.round] = sc; store[today] = { scores: S.scores.slice() }; save(); renderRounds(); }
    const a = ecef(S.pin.lat, S.pin.lon), b = ecef(ct.lat, ct.lon); const m = [0, 1, 2].map(i => a[i] + b[i]); const L = Math.hypot(...m) || 1;
    S.lat0 = clamp(Math.asin(m[2] / L), -80 * D2R, 80 * D2R); S.lon0 = Math.atan2(m[1], m[0]); S.zoom = clamp(0.55 / Math.sin(Math.max(0.05, Math.acos(clamp(A.dot(a, b), -1, 1)) / 2)), 1, 2.2);
    dirty.sky = dirty.globe = true; renderReadout(); renderPanel();
  }
  function resetRound() { S.pin = null; obsB = null; S.revealed = false; S.hints = {}; S.zoom = 1; lastObs = -1e9; dirty.sky = dirty.globe = true; renderRounds(); renderPanel(); }
  function next() { if (S.mode === 'daily') S.round++; else S.practice = randomCity(); resetRound(); }
  function randomCity() { const pool = A.CITIES.filter(c => !S.cities.includes(c) && c !== S.practice); return pool[Math.floor(Math.random() * pool.length)]; }
  function startPractice() { S.mode = 'practice'; S.practice = randomCity(); resetRound(); }

  try { new ResizeObserver(() => resize()).observe(document.querySelector('.stage')); } catch (e) { window.addEventListener('resize', resize); }
  if (matchMedia('(min-width: 980px)').matches) $('#howto').open = true;
  resize(); if (S.round >= 5) { renderRounds(); renderPanel(); } else resetRound();
  requestAnimationFrame(frame);
  window.__sky = { S, A, pin: (latDeg, lonDeg) => setPin({ lat: latDeg * D2R, lon: lonDeg * D2R }), reveal: () => reveal(), next: () => next(), hint: k => { S.hints[k] = true; dirty.sky = dirty.globe = true; renderReadout(); renderPanel(); } };
})();
