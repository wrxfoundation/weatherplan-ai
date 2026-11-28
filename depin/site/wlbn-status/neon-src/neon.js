// WLBN 네온 모드(52차 — 서우 「비주얼을 극대화한 인포그래픽 모드도 하나 만들어보자. three.js 활용 neon mode로 따로」)
//   이 파일은 원본이다. 화면이 읽는 것은 scripts/build-neon.js 가 three.js 와 묶어 만든 public/neon/neon.js 다
//   숫자는 화면(index.html)이 계산해서 넘긴다(neonData) — 이 파일은 그리기만 한다. 같은 숫자가 다른 값으로 보이는 일이 없게
//   그림: 판 쪽(붉은 유리) → 거친 풀(청록 판) → 산 쪽(시안 유리) 블록과 그 사이를 흐르는 빛 알갱이 · 위에 HUD(읽음표 · 데이터 흐름 · 날마다 막대 · 큰 숫자)
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

const C = { bg: 0x02060b, cyan: 0x1ff2e0, sky: 0x3cc8ff, violet: 0x8f7dff, pink: 0xff4fa3, red: 0xff3b3b, orange: 0xff8a3d, dim: 0x0d3b42 };
const hex = (n) => '#' + n.toString(16).padStart(6, '0');
const fmt = (v) => (v === null || v === undefined || isNaN(v) ? '—' : Math.round(v).toLocaleString('en-US'));
const pct = (v, d) => (v === null || v === undefined || isNaN(v) ? '—' : (v * 100).toFixed(d === undefined ? 1 : d) + '%');
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };

const CSS = `
.nx{position:fixed;inset:0;z-index:300;background:#02060b;color:#cfeff0;font-family:"Pretendard Variable",Pretendard,"Noto Sans KR",system-ui,sans-serif;overflow:hidden;--c:#1ff2e0;--s:#3cc8ff;--v:#8f7dff;--r:#ff3b3b;--p:#ff4fa3;--o:#ff8a3d;--dim:rgba(170,230,235,.58);--line:rgba(31,242,224,.18);--mono:ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace}
.nx *{box-sizing:border-box} .nx:focus{outline:none}
.nx-stage{position:absolute;inset:0}
.nx-stage canvas{display:block;width:100%;height:100%;outline:none}
.nx-labels{position:absolute;inset:0;pointer-events:none}
.nx-lab{font-family:var(--mono);text-align:center;white-space:nowrap;text-shadow:0 0 8px currentColor;transform:translateY(-6px)}
.nx-lab b{display:block;font-size:11px;letter-spacing:.12em;font-weight:600;opacity:.85}
.nx-lab span{display:block;font-size:15px;font-weight:700;color:#fff;text-shadow:0 0 10px var(--lc,#1ff2e0)}
.nx-lab i{display:block;font-style:normal;font-size:12px;font-weight:700;color:#eafeff;text-shadow:0 0 8px var(--lc,#1ff2e0);opacity:.92}
.nx-zone{font-family:var(--mono);font-size:12px;letter-spacing:.32em;color:var(--dim);white-space:nowrap}
.nx.pt .nx-lab b{font-size:9.5px;letter-spacing:.04em}.nx.pt .nx-lab span{font-size:12.5px}.nx.pt .nx-lab i{font-size:10.5px}.nx.pt .nx-lab.up{padding-bottom:34px}.nx-flowlg{position:absolute;top:62px;left:50%;transform:translateX(-50%);display:flex;gap:12px;align-items:center;font-family:var(--mono);font-size:11px;letter-spacing:.22em;color:var(--dim);white-space:nowrap;pointer-events:none}
.nx-flowlg span::before{content:'';display:inline-block;width:7px;height:7px;border-radius:999px;margin-right:8px;background:var(--zc);box-shadow:0 0 8px var(--zc);vertical-align:1px}
.nx-flowlg b{font-weight:400;opacity:.6}
.nx.hud-off .nx-flowlg{opacity:.5}
.nx-top{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;gap:18px;padding:14px 22px;background:linear-gradient(#02060bee,#02060b00);pointer-events:none}
.nx-brand{font-family:var(--mono);font-size:13px;letter-spacing:.28em;color:var(--c);text-shadow:0 0 10px var(--c);white-space:nowrap}
.nx-brand b{color:#fff}
.nx-brand small{margin-left:10px;letter-spacing:.06em;color:var(--dim);text-shadow:none;font-family:inherit}
.nx-meta{font-family:var(--mono);font-size:12px;color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nx-tools{margin-left:auto;display:flex;gap:8px;pointer-events:auto}
.nx-tools button{all:unset;cursor:pointer;display:grid;place-items:center;width:34px;height:34px;border-radius:999px;border:1px solid var(--line);color:var(--c);background:rgba(2,10,14,.6)}
.nx-tools button:hover,.nx-tools button:focus-visible{border-color:var(--c);box-shadow:0 0 12px rgba(31,242,224,.45)}
.nx-tools button:focus-visible{outline:2px solid var(--c);outline-offset:2px}
.nx-tools svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}
.nx-panel{position:absolute;border:1px solid var(--line);background:linear-gradient(180deg,rgba(4,18,22,.72),rgba(2,8,12,.6));-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);border-radius:4px}
.nx-panel h3{margin:0;padding:10px 14px 8px;font-family:var(--mono);font-size:11px;letter-spacing:.28em;font-weight:600;color:var(--c);border-bottom:1px solid var(--line);display:flex;gap:10px;align-items:baseline}
.nx-panel h3 small{letter-spacing:.04em;color:var(--dim);font-family:"Pretendard Variable",Pretendard,sans-serif;font-weight:400}
.nx-read{left:22px;top:70px;width:262px;padding-bottom:6px}
.nx-row{padding:9px 14px 7px;border-bottom:1px dashed rgba(31,242,224,.1)}
.nx-row:last-child{border-bottom:0}
.nx-row em{display:block;font-style:normal;font-size:11px;letter-spacing:.06em;color:var(--dim)}
.nx-row strong{display:block;font-family:var(--mono);font-size:22px;font-weight:600;color:#fff;letter-spacing:-.01em;text-shadow:0 0 12px var(--rc,#1ff2e0)}
.nx-row strong small{font-size:11px;margin-left:6px;color:var(--dim);text-shadow:none;letter-spacing:.04em}
.nx-row span{display:block;font-size:11px;color:var(--dim);margin-top:1px}
.nx-stream{right:22px;top:70px;bottom:236px;width:330px;display:flex;flex-direction:column}
.nx-log{flex:1;overflow:hidden;position:relative;-webkit-mask-image:linear-gradient(transparent,#000 8%,#000 88%,transparent);mask-image:linear-gradient(transparent,#000 8%,#000 88%,transparent)}
.nx-logi{position:absolute;left:0;right:0;top:0;padding:6px 14px;font-family:var(--mono);font-size:11.5px;line-height:1.45}
.nx-logi div{padding:5px 0;border-bottom:1px solid rgba(31,242,224,.06)}
.nx-logi .t{color:rgba(170,230,235,.4)}
.nx-logi .sell{color:var(--p)} .nx-logi .buy{color:var(--c)} .nx-logi .who{color:#e6fbfb} .nx-logi .g{color:var(--v)}
.nx-act{left:22px;right:374px;bottom:22px;height:196px;display:flex;flex-direction:column}
.nx-act-lg{display:flex;gap:16px;padding:8px 14px 0;font-size:11px;color:var(--dim);flex-wrap:wrap}
.nx-act-lg i{display:inline-block;width:8px;height:8px;border-radius:999px;margin-right:6px;box-shadow:0 0 8px currentColor;background:currentColor}
.nx-bars{flex:1;width:100%;min-height:0;display:block}
.nx-big{right:22px;bottom:22px;width:330px;height:196px;display:grid;grid-template-rows:auto 1fr}
.nx-bigs{display:grid;grid-template-columns:1fr 1fr;gap:0 10px;padding:8px 14px 10px;align-content:center}
.nx-bigs div{padding:6px 0}
.nx-bigs strong{display:block;font-family:var(--mono);font-weight:300;font-size:30px;color:#eafcff;letter-spacing:-.02em;text-shadow:0 0 14px var(--bc,#3cc8ff)}
.nx-bigs em{font-style:normal;font-size:11px;color:var(--dim)}
.nx-foot{position:absolute;left:0;right:0;bottom:4px;text-align:center;font-size:10.5px;color:rgba(170,230,235,.42);pointer-events:none}
.nx-note{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);max-width:420px;text-align:center;font-size:13px;color:var(--dim);padding:16px 18px;border:1px solid var(--line);border-radius:4px;background:rgba(2,8,12,.8)}
.nx.hud-off .nx-panel{opacity:0;pointer-events:none}
.nx-panel{transition:opacity .35s}
@media (max-width:860px){
 .nx{overflow-y:auto}
 .nx-stage{position:relative;height:62vh;min-height:360px}
 .nx-top{position:fixed;z-index:3;padding:10px 14px}
 .nx-brand small,.nx-meta{display:none}
 .nx-panel{position:relative;left:auto;right:auto;top:auto;bottom:auto;width:auto;height:auto;margin:10px 14px}
 .nx-stream{height:260px}
 .nx-flowlg{position:fixed;top:58px;z-index:3;font-size:9.5px;letter-spacing:.08em;gap:8px}
 .nx-act{height:200px}
 .nx-big{height:auto}
 .nx-foot{position:relative;padding:8px 14px 18px}
}
@media (prefers-reduced-motion:reduce){.nx-panel{transition:none}}
`;

const I = {
  hud: '<svg viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M5 6.5h6M5 9.5h3.5"/></svg>',
  pause: '<svg viewBox="0 0 16 16"><path d="M6 3.5v9M10 3.5v9"/></svg>',
  play: '<svg viewBox="0 0 16 16"><path d="M5 3.5l7 4.5-7 4.5z"/></svg>',
  close: '<svg viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
};

// 캔버스 무늬: 유리 윗면의 격자 · 바닥의 빛 웅덩이
function gridTex(color) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.strokeStyle = color; g.globalAlpha = 0.55; g.lineWidth = 2; g.strokeRect(6, 6, 244, 244);
  g.globalAlpha = 0.16; g.lineWidth = 1; for (let i = 16; i < 256; i += 16) { g.beginPath(); g.moveTo(i, 8); g.lineTo(i, 248); g.stroke(); g.beginPath(); g.moveTo(8, i); g.lineTo(248, i); g.stroke(); }
  g.globalAlpha = 0.7; g.fillStyle = color; for (let i = 0; i < 6; i++) g.fillRect(14 + i * 7, 16, 4, 2); g.fillRect(200, 232, 40, 2); g.fillRect(16, 230, 2, 14);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function glowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
function dotTex() {
  const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'), r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.4, 'rgba(255,255,255,.6)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

export function open(host, P, opts) {
  opts = opts || {};
  const reduce = !!opts.reduce;
  if (!document.getElementById('nx-css')) { const st = el('style'); st.id = 'nx-css'; st.textContent = CSS; document.head.appendChild(st); }
  const root = el('div', 'nx'); root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'WLBN 네온 모드');
  host.replaceChildren(root);
  const stage = el('div', 'nx-stage'), labels = el('div', 'nx-labels'); stage.appendChild(labels); root.appendChild(stage);

  // ── 위 줄
  const top = el('header', 'nx-top'), brand = el('div', 'nx-brand'); brand.innerHTML = '<b>WLBN</b> NEON<small>운용현황 인포그래픽</small>';
  const meta = el('div', 'nx-meta', P.period + ' · ' + P.from + ' ~ ' + P.to + ' · 기준 ' + P.asof);
  const tools = el('div', 'nx-tools');
  const bt = (k, label, fn) => { const b = el('button'); b.type = 'button'; b.innerHTML = I[k]; b.setAttribute('aria-label', label); b.title = label; b.addEventListener('click', fn); tools.appendChild(b); return b; };
  const bHud = bt('hud', 'HUD 숨기기 · 보이기 (H)', () => toggleHud());
  const bPause = bt('pause', '움직임 멈추기 (Space)', () => togglePause());
  const bClose = bt('close', '나가기 (Esc)', () => close());
  bClose.setAttribute('data-nx-close', ''); bHud.setAttribute('data-nx-hud', ''); bPause.setAttribute('data-nx-pause', '');
  top.append(brand, meta, tools); root.appendChild(top);
  const flg = el('div', 'nx-flowlg'); flg.setAttribute('aria-hidden', 'true');
  [['판 쪽 · SELL', 'var(--p)'], ['거친 풀 · POOL', 'var(--c)'], ['산 쪽 · BUY', 'var(--s)']].forEach((z, i) => { if (i) flg.appendChild(el('b', '', '→')); const x = el('span', '', z[0]); x.style.setProperty('--zc', z[1]); flg.appendChild(x); });
  root.appendChild(flg);

  // ── 읽음표(왼쪽)
  const read = el('aside', 'nx-panel nx-read'); read.innerHTML = '<h3>READOUT <small>고른 기간</small></h3>';
  P.read.forEach((r) => { const row = el('div', 'nx-row'); row.style.setProperty('--rc', r.c || '#1ff2e0'); row.append(el('em', '', r.l)); const s = el('strong', '', r.v); if (r.u) s.appendChild(el('small', '', r.u)); row.appendChild(s); if (r.s) row.appendChild(el('span', '', r.s)); row.setAttribute('data-nx-read', r.k); read.appendChild(row); });
  root.appendChild(read);

  // ── 데이터 흐름(오른쪽)
  const stream = el('aside', 'nx-panel nx-stream'); stream.innerHTML = '<h3>DATA STREAM <small>원장 · 날마다 큰 거래</small></h3>';
  const log = el('div', 'nx-log'), logi = el('div', 'nx-logi'); log.appendChild(logi); stream.appendChild(log); root.appendChild(stream);
  const line = (x) => { const d = el('div'); d.innerHTML = ''; d.append(el('span', 't', x.date + ' '), el('span', x.side, x.side === 'sell' ? 'SELL ' : 'BUY  '), el('span', 'who', fmt(x.w) + ' WLBN '), document.createElement('br'), el('span', 't', '  ' + (x.side === 'sell' ? 'from ' : 'by   ')), el('span', 'who', x.who + ' '), el('span', 'g', '· ' + x.g)); if (x.cur) d.appendChild(el('span', 't', ' · ' + x.cur)); return d; };
  const items = P.stream.length ? P.stream : [];
  items.forEach((x) => logi.appendChild(line(x)));
  if (!reduce && items.length > 6) items.forEach((x) => logi.appendChild(line(x)));      // 이어 붙여 끝없이 흐르게
  if (!items.length) logi.appendChild(el('div', 't', '이 기간에는 날마다 큰 거래 기록이 없다'));

  // ── 날마다 막대(아래 왼쪽)
  const act = el('section', 'nx-panel nx-act'); act.innerHTML = '<h3>ACTIVITY <small>날마다 · 밝을수록 많다</small></h3>';
  const lg = el('div', 'nx-act-lg'); P.series.forEach((s) => { const x = el('span'); const dot = el('i'); dot.style.color = s.c; x.append(dot, document.createTextNode(s.l + ' · 합계 ' + fmt(s.sum))); lg.appendChild(x); });
  const bars = el('canvas', 'nx-bars'); bars.setAttribute('role', 'img'); bars.setAttribute('aria-label', '날마다 ' + P.series.map((s) => s.l).join(' · ') + ' — 밝을수록 많다');
  act.append(lg, bars); root.appendChild(act);

  // ── 큰 숫자(아래 오른쪽)
  const big = el('section', 'nx-panel nx-big'); big.innerHTML = '<h3>TOTAL <small>고른 기간 합계</small></h3>';
  const bigs = el('div', 'nx-bigs'); P.big.forEach((b) => { const d = el('div'); d.style.setProperty('--bc', b.c); d.append(el('strong', '', b.v), el('em', '', b.l)); d.setAttribute('data-nx-big', b.k); bigs.appendChild(d); });
  big.appendChild(bigs); root.appendChild(big);
  root.appendChild(el('footer', 'nx-foot', '내부 현황용 · 공개 원장 기준 계산 · 대외 인용 금지 · 보상의 지급량과 가치는 보장되지 않습니다'));

  // ── 날마다 막대 그리기(빛나는 바코드)
  function drawBars() {
    const r = bars.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1); if (!r.width || !r.height) return;
    bars.width = Math.round(r.width * dpr); bars.height = Math.round(r.height * dpr); const g = bars.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, r.width, r.height);
    const days = P.days, n = days.length; if (!n) return;
    const padL = 14, padR = 14, padT = 6, padB = 18, rows = P.series.length, rh = (r.height - padT - padB) / rows, w = (r.width - padL - padR) / n;
    g.globalCompositeOperation = 'lighter';
    P.series.forEach((s, si) => {
      const mx = Math.max(1, ...days.map((d) => d[s.k] || 0)), y0 = padT + si * rh;
      g.fillStyle = 'rgba(31,242,224,.04)'; g.fillRect(padL, y0 + rh * 0.2, r.width - padL - padR, rh * 0.6);
      days.forEach((d, i) => {
        const v = (d[s.k] || 0) / mx; if (v <= 0) return;
        const lines = Math.max(1, Math.round(2 + v * 7)), x0 = padL + i * w;
        for (let j = 0; j < lines; j++) {
          const jx = x0 + ((j * 37 + i * 13) % 100) / 100 * (w - 1.5), a = 0.18 + v * 0.75 * (0.55 + ((j * 53 + i) % 45) / 100);
          g.shadowColor = s.c; g.shadowBlur = 6 + v * 14; g.fillStyle = s.c; g.globalAlpha = Math.min(1, a); g.fillRect(jx, y0 + rh * 0.18, 1.3 + v * 1.4, rh * 0.64);
        }
      });
    });
    g.globalCompositeOperation = 'source-over'; g.shadowBlur = 0; g.globalAlpha = 1; g.fillStyle = 'rgba(170,230,235,.5)'; g.font = '10px ui-monospace,monospace';
    const step = Math.max(1, Math.ceil(n / 8)); for (let i = 0; i < n; i += step) g.fillText(days[i].date.slice(5).replace('-', '/'), padL + i * w, r.height - 4);
  }

  // ── 3D 장면
  let renderer = null, composer = null, l2 = null, controls = null, raf = 0, paused = reduce, t0 = performance.now(), last = 0, alive = true;
  const disposables = [];
  const scene = new THREE.Scene(); scene.background = new THREE.Color(C.bg); scene.fog = new THREE.FogExp2(C.bg, 0.012);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 400);
  const blocks = [], streams = [], intro = [], world = new THREE.Group(); scene.add(world);
  let portrait = false, auto = !reduce;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.capture });
  } catch (e) { renderer = null; }
  if (!renderer || !renderer.getContext()) {
    root.appendChild(el('div', 'nx-note', '이 기기(브라우저)에서는 3D 그림을 그릴 수 없어 숫자 패널만 보여 줍니다.'));
    root.setAttribute('data-nx-gl', '0');
  } else {
    root.setAttribute('data-nx-gl', '1');
    renderer.setPixelRatio(Math.min(window.innerWidth < 860 ? 1.5 : 2, window.devicePixelRatio || 1));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.outputColorSpace = THREE.SRGBColorSpace;
    stage.insertBefore(renderer.domElement, labels);
    renderer.domElement.setAttribute('aria-label', '판 쪽에서 거친 풀을 지나 산 쪽으로 가는 WLBN 흐름 3D 그림 — 끌어서 돌려 보기'); renderer.domElement.setAttribute('role', 'img');
    l2 = new CSS2DRenderer({ element: labels });
    composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 1.05, 0.55, 0.12); composer.addPass(bloom); composer.addPass(new OutputPass());
    controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = 0.06; controls.enablePan = false;
    controls.minDistance = 24; controls.maxDistance = 110; controls.minPolarAngle = 0.3; controls.maxPolarAngle = 1.22; controls.autoRotate = false;
    controls.addEventListener('start', () => { auto = false; });      // 손대면 흔들기를 멈추고 그 자리에 둔다
    const VIEW = () => (portrait ? { r: 62, pol: 0.52, az: 0 } : { r: 56, pol: 0.84, az: -0.14 });
    const place = (az) => { const v = VIEW(), sp = new THREE.Spherical(v.r, v.pol, az === undefined ? v.az : az); camera.position.setFromSpherical(sp).add(controls.target); camera.lookAt(controls.target); };
    controls.target.set(0, 2.2, 0); place(); controls.update();

    scene.add(new THREE.AmbientLight(0x5fa8b0, 0.35));
    const pl1 = new THREE.PointLight(C.cyan, 60, 60, 1.6); pl1.position.set(12, 10, 4); scene.add(pl1);
    const pl2 = new THREE.PointLight(C.red, 50, 50, 1.6); pl2.position.set(-14, 8, 6); scene.add(pl2);

    // 바닥 · 받침
    const grid = new THREE.GridHelper(220, 110, C.dim, 0x06232a); grid.material.transparent = true; grid.material.opacity = 0.55; grid.position.y = -0.02; scene.add(grid);
    const baseG = new THREE.BoxGeometry(46, 0.6, 26), baseM = new THREE.MeshStandardMaterial({ color: 0x041218, metalness: 0.7, roughness: 0.4, emissive: 0x021014 });
    const base = new THREE.Mesh(baseG, baseM); base.position.y = 0.3; world.add(base);
    const baseE = new THREE.LineSegments(new THREE.EdgesGeometry(baseG), new THREE.LineBasicMaterial({ color: C.cyan, transparent: true, opacity: 0.35, toneMapped: false })); baseE.position.copy(base.position); world.add(baseE);
    const topTex = gridTex('#1ff2e0'); topTex.wrapS = topTex.wrapT = THREE.RepeatWrapping; topTex.repeat.set(9, 5);
    const topP = new THREE.Mesh(new THREE.PlaneGeometry(46, 26), new THREE.MeshBasicMaterial({ map: topTex, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    topP.rotation.x = -Math.PI / 2; topP.position.y = 0.61; world.add(topP);
    disposables.push(baseG, baseM, topTex);

    const GLOW = glowTex(), DOT = dotTex(); disposables.push(GLOW, DOT);
    const glass = (w, h, d, color, x, z, strong) => {
      const grp = new THREE.Group(); grp.position.set(x, 0.6, z);
      const geo = new THREE.BoxGeometry(w, h, d); geo.translate(0, h / 2, 0);
      const mat = new THREE.MeshPhysicalMaterial({ color, metalness: 0, roughness: 0.18, transparent: true, opacity: strong ? 0.26 : 0.16, emissive: color, emissiveIntensity: strong ? 0.42 : 0.2, side: THREE.DoubleSide, depthWrite: false });
      const body = new THREE.Mesh(geo, mat); grp.add(body);
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color, transparent: true, opacity: strong ? 1 : 0.8, toneMapped: false })); grp.add(edge);
      const inG = new THREE.BoxGeometry(w * 0.86, h * 0.94, d * 0.86); inG.translate(0, h * 0.47, 0);
      const inner = new THREE.LineSegments(new THREE.EdgesGeometry(inG), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.28, toneMapped: false })); grp.add(inner);
      const tt = gridTex(hex(color)); const cap = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.96, d * 0.96), new THREE.MeshBasicMaterial({ map: tt, transparent: true, opacity: strong ? 0.9 : 0.6, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      cap.rotation.x = -Math.PI / 2; cap.position.y = h + 0.01; grp.add(cap);
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(w * 2.6, d * 2.6), new THREE.MeshBasicMaterial({ map: GLOW, color, transparent: true, opacity: strong ? 0.55 : 0.3, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      pool.rotation.x = -Math.PI / 2; pool.position.y = 0.02; grp.add(pool);
      disposables.push(geo, mat, inG, tt, edge.geometry, edge.material, inner.geometry, inner.material, cap.geometry, cap.material, pool.geometry, pool.material);
      world.add(grp); return { grp, h, cap };
    };
    const label = (grp, h, title, v, sh, color) => {
      const d = el('div', 'nx-lab'); d.style.color = hex(color); d.style.setProperty('--lc', hex(color));
      d.append(el('b', '', title), el('span', '', fmt(v)), el('i', '', sh)); d.setAttribute('data-nx-lab', title);
      const o = new CSS2DObject(d); o.position.set(0, h + 1.1, 0); grp.add(o); return d;
    };
    const zone = (txt, x) => { const d = el('div', 'nx-zone', txt); const o = new CSS2DObject(d); o.position.set(x, 0.7, -13.9); world.add(o); };      // 뒤쪽 가장자리(앞쪽은 아래 패널에 가린다)

    // 블록 배치: 판 쪽 x=-15 · 풀 x=0 · 산 쪽 x=+15, 큰 것부터 앞에서 뒤로
    const F = P.flow, mx = Math.max(1, ...F.sell.map((x) => x.v), ...F.buy.map((x) => x.v)), H = (v) => 0.5 + 9.5 * (v / mx);
    const col = (list, x, colorOf, strongOf) => { const n = list.length, gap = Math.min(6.2, 22 / Math.max(1, n)); return list.map((it, i) => { const z = -((n - 1) * gap) / 2 + i * gap, side = Math.max(1.6, Math.min(3.4, gap * 0.62)); const b = glass(side, H(it.v), side, colorOf(it, i), x, z, strongOf(it, i)); b.it = it; b.lab = label(b.grp, b.h, it.name, it.v, it.share, colorOf(it, i)); if (i % 2) b.lab.classList.add('up'); blocks.push(b); intro.push(b); return b; }); };
    const sellB = col(F.sell, -15, (it, i) => (i === 0 ? C.pink : C.red), () => false);
    const buyB = col(F.buy, 15, (it) => (it.hi ? C.cyan : C.sky), (it) => !!it.hi);
    const pm = Math.max(1, ...F.pools.map((p) => p.v)), pn = F.pools.length, pgap = 8.8;
    const poolB = F.pools.map((p, i) => { const side = 2.6 + 4.2 * Math.sqrt(p.v / pm), z = -((pn - 1) * pgap) / 2 + i * pgap; const b = glass(side, 1.1, side, p.key === 'O' ? C.violet : C.cyan, 0, z, false); b.it = p; b.lab = label(b.grp, b.h, p.name, p.v, p.share, p.key === 'O' ? C.violet : C.cyan); if (i % 2) b.lab.classList.add('up'); blocks.push(b); intro.push(b); return b; });

    // 흐름: 판 쪽 → 풀 → 산 쪽 빛 알갱이(양에 따라 알갱이 수)
    const total = Math.max(1, F.links.reduce((a, l) => a + l.v, 0));
    const at = (b, up) => new THREE.Vector3(b.grp.position.x, 0.6 + (up ? b.h * 0.5 : 0.55), b.grp.position.z);
    F.links.forEach((l) => {
      const A = l.from[0] === 'S' ? sellB[l.from[1]] : poolB[l.from[1]], B = l.to[0] === 'P' ? poolB[l.to[1]] : buyB[l.to[1]]; if (!A || !B) return;
      const p0 = at(A, true), p3 = at(B, true), mid = p0.clone().lerp(p3, 0.5); mid.y += 4 + 5 * (l.v / total);
      const curve = new THREE.CatmullRomCurve3([p0, p0.clone().lerp(mid, 0.5).setY(mid.y * 0.85), mid, p3.clone().lerp(mid, 0.5).setY(mid.y * 0.85), p3]);
      const color = l.hi ? C.cyan : l.from[0] === 'S' ? C.pink : C.sky;
      const lg2 = new THREE.BufferGeometry().setFromPoints(curve.getPoints(60)), lm = new THREE.LineBasicMaterial({ color, transparent: true, opacity: l.hi ? 0.35 : 0.14, toneMapped: false });
      world.add(new THREE.Line(lg2, lm));
      const n = Math.max(8, Math.min(420, Math.round((l.v / total) * 1600))), pos = new Float32Array(n * 3), seed = new Float32Array(n);
      for (let i = 0; i < n; i++) seed[i] = Math.random();
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const m = new THREE.PointsMaterial({ color, size: l.hi ? 0.34 : 0.24, map: DOT, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, sizeAttenuation: true });
      const pts = new THREE.Points(g, m); world.add(pts); streams.push({ curve, pos, seed, n, g, speed: 0.045 + 0.05 * Math.random(), jit: 0.12 });
      disposables.push(lg2, lm, g, m);
    });

    // 떠다니는 먼지
    const dn = 1400, dp = new Float32Array(dn * 3); for (let i = 0; i < dn; i++) { dp[i * 3] = (Math.random() - 0.5) * 120; dp[i * 3 + 1] = Math.random() * 30; dp[i * 3 + 2] = (Math.random() - 0.5) * 90; }
    const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    const dm = new THREE.PointsMaterial({ color: 0x5fe9ff, size: 0.12, map: DOT, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const dust = new THREE.Points(dg, dm); scene.add(dust); disposables.push(dg, dm);

    // 흐름 알갱이 위치
    const flowAt = (tt) => {
      streams.forEach((s) => {
        for (let i = 0; i < s.n; i++) {
          const u = (s.seed[i] + tt * s.speed) % 1, p = s.curve.getPointAt(u), j = (s.seed[(i + 7) % s.n] - 0.5) * s.jit;
          s.pos[i * 3] = p.x + j; s.pos[i * 3 + 1] = p.y + j * 0.6; s.pos[i * 3 + 2] = p.z - j;
        }
        s.g.attributes.position.needsUpdate = true;
      });
    };
    const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
    const introAt = (sec) => { intro.forEach((b, i) => { const k = reduce ? 1 : ease((sec - i * 0.07) / 1.3); b.grp.scale.set(1, Math.max(0.001, k), 1); b.lab.style.opacity = String(reduce ? 1 : ease((sec - 0.9 - i * 0.05) / 0.6)); }); };
    flowAt(reduce ? 3.2 : 0); introAt(reduce ? 99 : 0);

    const frame = (now) => {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      const sec = (now - t0) / 1000;
      if (!paused) { introAt(sec); flowAt(sec); dust.rotation.y = sec * 0.01; if (auto) place(VIEW().az + Math.sin(sec * 0.11) * (portrait ? 0.18 : 0.3)); }
      controls.update();
      composer.render(); l2.render(scene, camera);
      last = sec;
    };
    const size = () => {
      const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false); composer.setSize(w, h); l2.setSize(w, h); camera.aspect = w / h;
      const was = portrait; portrait = w / h < 0.9; root.classList.toggle('pt', portrait); world.rotation.y = portrait ? -Math.PI / 2 : 0; if (was !== portrait && auto) place();
      camera.fov = portrait ? 46 : 36;
      if (w >= 860) camera.setViewOffset(w, h, Math.round((read.offsetWidth - stream.offsetWidth) / -2), Math.round(act.offsetHeight * 0.3), w, h); else camera.clearViewOffset();      // 패널 사이 빈 곳 가운데로
      camera.updateProjectionMatrix(); drawBars();
    };
    const ro = new ResizeObserver(size); ro.observe(stage); ro.observe(bars); disposables.push({ dispose: () => ro.disconnect() });
    size();
    if (reduce) { introAt(99); controls.update(); composer.render(); l2.render(scene, camera); controls.addEventListener('change', () => { composer.render(); l2.render(scene, camera); }); }
    raf = requestAnimationFrame(frame);
  }
  if (!renderer) { const ro2 = new ResizeObserver(drawBars); ro2.observe(bars); disposables.push({ dispose: () => ro2.disconnect() }); drawBars(); }

  // ── 데이터 흐름 굴리기
  let ly = 0, lt = 0;
  const roll = (now) => {
    if (!alive) return; requestAnimationFrame(roll);
    if (reduce || paused || document.hidden || items.length <= 6 || log.matches(':hover')) { lt = now; return; }
    const dt = Math.min(64, now - (lt || now)); lt = now; ly += dt * 0.012; const half = logi.scrollHeight / 2; if (ly >= half) ly -= half; logi.style.transform = 'translateY(' + (-ly).toFixed(1) + 'px)';
  };
  requestAnimationFrame(roll);

  // ── 조작
  function toggleHud(on) { const off = on === undefined ? !root.classList.contains('hud-off') : !on; root.classList.toggle('hud-off', off); bHud.setAttribute('aria-pressed', String(off)); }
  function togglePause() { paused = !paused; if (!paused) t0 = performance.now() - last * 1000; if (controls) controls.autoRotate = !paused && !reduce; bPause.innerHTML = paused ? I.play : I.pause; bPause.title = paused ? '움직임 다시 (Space)' : '움직임 멈추기 (Space)'; bPause.setAttribute('aria-label', bPause.title); }
  if (reduce) { bPause.innerHTML = I.play; bPause.title = '움직임 켜기 (Space)'; bPause.setAttribute('aria-label', bPause.title); }
  const onKey = (ev) => {
    if (ev.key === 'Escape') { ev.preventDefault(); close(); }
    else if (ev.key === 'h' || ev.key === 'H' || ev.key === 'ㅗ') { ev.preventDefault(); toggleHud(); }
    else if (ev.key === ' ' && !(ev.target && ev.target.closest && ev.target.closest('button'))) { ev.preventDefault(); togglePause(); }
  };
  document.addEventListener('keydown', onKey);
  root.tabIndex = -1; setTimeout(() => { try { root.focus({ preventScroll: true }); } catch (e) { root.focus(); } }, 30);      // 처음 초점은 화면 자체 — 닫기 단추에 두면 Space 가 「닫기」를 누른다

  function close() {
    if (!alive) return; alive = false; cancelAnimationFrame(raf); document.removeEventListener('keydown', onKey);
    disposables.forEach((d) => { try { d.dispose(); } catch (e) { /* 이미 비웠다 */ } });
    if (controls) controls.dispose(); if (composer) composer.dispose && composer.dispose();
    if (renderer) { renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) { /* 이미 잃었다 */ } }
    host.replaceChildren(); if (opts.onClose) opts.onClose();
  }
  return { close, root };
}
