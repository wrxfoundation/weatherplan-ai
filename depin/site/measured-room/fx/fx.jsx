/* Measured Room 효과 묶음 (v0.17) — Libraries.dev 의 네 효과를 React 섬으로 얹는다.
   페이지(index.html)는 React 를 모른다. 이 파일이 늦게 불려 와서 window.__mrfx(api) 로 자신을 알리고,
   페이지는 api.beam / note / busy / wave 만 부른다. 이 파일을 못 받아도 페이지는 그대로 돈다.
     Beam   (border-beam)      곡선 상자 테두리 — 환기 안내가 떠 있는 동안
     Orb    (thinking-orbs)    사진을 받는 동안 — 안내 글 옆 작은 것 · 장면 가운데 큰 것
     Wave   (distortion-waves) 건물 · 방을 바꿀 때 — 누른 탭에서 퍼지며 앞 장면을 다음 장면으로
     Metal  (metal-fx)         「게임 · 환기 타이밍」 버튼의 금속 테 */
import { useLayoutEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { BorderBeam } from "border-beam";
import { ThinkingOrb } from "thinking-orbs";
import { MetalFx } from "metal-fx";
import { DistortionWave, defaultStyle, duration } from "distortion-waves";

const $ = (id) => document.getElementById(id);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const webgl2 = (() => { try { return !!document.createElement("canvas").getContext("webgl2"); } catch (e) { return false; } })();
const roots = new Map();
const rootOf = (el) => { let r = roots.get(el); if (!r) { r = createRoot(el); roots.set(el, r); } return r; };
const drop = (el) => { const r = roots.get(el); if (r) r.render(null); };   // 뿌리는 살려 두고 비우기만 한다(뿌리를 걷으며 DOM 을 직접 건드리면 React 와 엇갈린다)
const guard = (name, fn) => (...a) => { try { return fn(...a); } catch (e) { console.warn("[fx] " + name, e); } };

/* ── Beam: 곡선 상자 ── */
let beamHost = null, beamKey = "";
function beam(on, soon) {
  const box = $("curve"); if (!box || reduced) return;
  const key = (on ? 1 : 0) + "" + (soon ? 1 : 0); if (key === beamKey) return; beamKey = key;
  if (!beamHost) { beamHost = document.createElement("div"); beamHost.className = "fx-beam"; box.appendChild(beamHost); box.classList.add("fxb"); }   // .fxb = CSS 로 만든 대체 빛을 쉰다
  rootOf(beamHost).render(
    <BorderBeam size="sm" colorVariant="sunset" theme="light" borderRadius={8} active={!!on} strength={soon ? 0.8 : 1} duration={soon ? 3 : 1.96} brightness={1.5} style={{ display: "block", width: "100%", height: "100%" }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 8 }} />
    </BorderBeam>);
}

/* ── Orb: 사진을 받는 동안 ── */
let noteKey = "";
function note(text, busy) {   // 장면 귀퉁이의 안내 글(「장면 불러오는 중 4/8」) 옆에 작은 구슬
  const el = $("assets"); if (!el) return;
  const key = text + "|" + (busy ? 1 : 0); if (key === noteKey) return; noteKey = key;
  if (!text) { if (roots.has(el)) drop(el); else el.textContent = ""; return; }   // 비면 :empty 로 숨는다. React 가 맡은 뒤로는 직접 비우지 않는다
  rootOf(el).render(<>{busy ? <ThinkingOrb state="weaving" size={20} theme="dark" aria-hidden="true" /> : null}<span>{text}</span></>);
}
let loadHost = null, loadT = 0, loadOn = false;
function busy(on) {   // 보여 줄 사진이 아직 안 왔다 → 장면 가운데 숨 쉬는 구슬(0.25초 넘게 걸릴 때만)
  const stage = $("stage"); if (!stage) return;
  on = !!on; if (on === loadOn) return; loadOn = on; clearTimeout(loadT);
  if (!loadHost) { loadHost = document.createElement("div"); loadHost.className = "fx-load"; loadHost.setAttribute("aria-hidden", "true"); stage.appendChild(loadHost); }
  if (on) loadT = setTimeout(() => { rootOf(loadHost).render(<ThinkingOrb state="breathing" size={64} theme="dark" />); loadHost.classList.add("on"); }, 250);
  else { loadHost.classList.remove("on"); loadT = setTimeout(() => drop(loadHost), 400); }
}

/* ── Metal: 게임 버튼 ── */
let metalHost = null;
function MetalGame({ btn, paused }) {
  const host = useRef(null);
  useLayoutEffect(() => { const slot = host.current && host.current.querySelector(".fx-slot"); if (slot && btn.parentNode !== slot) slot.appendChild(btn); }, [btn]);   // 진짜 버튼을 금속 테 안으로 옮긴다(버튼은 그대로 — id · 이벤트 유지)
  return <div ref={host} className="fx-metal-in"><MetalFx preset="chromatic" variant="button" theme="dark" paused={paused}><div className="fx-slot" /></MetalFx></div>;
}
function metal() {
  const btn = $("b-game"); if (!btn || metalHost || !webgl2 || reduced) return;
  metalHost = document.createElement("div"); metalHost.className = "fx-metal"; metalHost.hidden = btn.hidden; btn.parentNode.insertBefore(metalHost, btn);
  const app = $("app"), draw = () => rootOf(metalHost).render(<MetalGame btn={btn} paused={btn.hidden || app.classList.contains("gaming")} />);
  draw();
  new MutationObserver(() => { metalHost.hidden = btn.hidden; draw(); }).observe(btn, { attributes: true, attributeFilter: ["hidden"] });   // 집이 아닌 건물에선 버튼이 숨는다 → 테도 같이
  new MutationObserver(draw).observe(app, { attributes: true, attributeFilter: ["class"] });
}

/* ── Wave: 건물 · 방을 바꿀 때 ── */
let waveHost = null;
// 기본 center 물결은 4.2초(대화 상자용)다. 장면을 바꾸는 데는 길어서 1.6초 안팎으로 줄이고, 렌즈는 조금 세게
const WSTYLE = { travel: 1.2, anticipation: 0.15, rimFade: 0.85, particleLife: 1.2, hairlineFade: 0.9, aberration: 0.45, strength: 0.8 };
const WDUR = (() => { try { return duration({ ...defaultStyle("center"), ...WSTYLE }); } catch (e) { return 2.2; } })();
function paint(cv, stage, tainted) {   // 지금 장면(사진 + 열림 조각 + 가장자리 어둠)을 캔버스에 그대로 옮긴다. 못 그리면 false
  const media = $("media"), img = media.querySelector(".still.on"), w = stage.clientWidth, h = stage.clientHeight;
  if (!img || !img.complete || !img.naturalWidth) return false;
  const d = Math.min(window.devicePixelRatio || 1, 2); cv.width = Math.round(w * d); cv.height = Math.round(h * d); cv.style.width = w + "px"; cv.style.height = h + "px";
  const c = cv.getContext("2d"), cs = getComputedStyle(img), pos = cs.objectPosition.split(" ").map((v) => parseFloat(v) / 100), ms = getComputedStyle(media);
  const px = parseFloat(ms.getPropertyValue("--px")) || 0, py = parseFloat(ms.getPropertyValue("--py")) || 0;
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight), dw = img.naturalWidth * s, dh = img.naturalHeight * s;
  c.setTransform(d, 0, 0, d, 0, 0); c.fillStyle = "#0b0b22"; c.fillRect(0, 0, w, h);
  c.save(); c.translate(w / 2 + px, h / 2 + py); c.scale(1.035, 1.035); c.translate(-w / 2, -h / 2);   // 장면의 살짝 확대 + 시차와 같은 자리
  if (cs.filter && cs.filter !== "none" && "filter" in c) c.filter = cs.filter;   // 밤 회의실처럼 사진을 어둡게 쓴 장면
  c.drawImage(img, (w - dw) * (isNaN(pos[0]) ? 0.5 : pos[0]), (h - dh) * (isNaN(pos[1]) ? 0.5 : pos[1]), dw, dh);
  c.restore(); if ("filter" in c) c.filter = "none";
  const sr = stage.getBoundingClientRect();
  for (const p of media.querySelectorAll(".patch.on")) { if (!p.complete || !p.naturalWidth) continue; const r = p.getBoundingClientRect(); c.drawImage(p, r.left - sr.left, r.top - sr.top, r.width, r.height); }   // 열린 문 · 창
  const vig = $("vig"), vo = vig ? parseFloat(getComputedStyle(vig).opacity) || 0 : 0;
  if (vo > 0) { c.save(); c.globalAlpha = vo; c.translate(w * 0.52, h * 0.42); c.scale(w, h); const g = c.createRadialGradient(0, 0, 0.3 * 0.72, 0, 0, 0.72); g.addColorStop(0, "rgba(4,4,20,0)"); g.addColorStop(1, "rgba(4,4,20,.75)"); c.fillStyle = g; c.fillRect(-1, -1, 2, 2); c.restore(); }
  if (tainted) { try { c.getImageData(0, 0, 1, 1); tainted.v = false; } catch (e) { tainted.v = true; } }   // 다른 곳에서 온 사진(집 장면)은 WebGL 로 못 넘긴다 → 색 물결만
  return true;
}
function WaveView({ go, src, clean, a, b, done }) {
  const cap = clean ? (req) => (req.slot === "revealed" ? b.current : a.current) : false;
  return (
    <DistortionWave revealed={go} type="center" palette="ocean" waveStyle={WSTYLE} source={src} capture={cap} live={false} prewarm={false} onFinish={done} style={{ position: "absolute", inset: 0 }}
      revealedContent={<canvas ref={b} className="fx-view" />}>
      <canvas ref={a} className="fx-view" />
    </DistortionWave>);
}
let waveNow = null;   // 지금 돌고 있는 물결(있으면 .cancel())
function wave(o) {   // o = { from: 누른 탭, swap: 실제로 공간을 바꾸는 함수 }
  const stage = $("stage"), media = $("media");
  if (waveNow) { waveNow.cancel(); return o.swap(); }   // 물결 도중에 또 누르면: 물결을 걷고 바로 바꾼다
  if (!stage || reduced || !webgl2 || document.hidden) return o.swap();
  if (!waveHost) { waveHost = document.createElement("div"); waveHost.className = "fx-wave"; waveHost.setAttribute("aria-hidden", "true"); stage.appendChild(waveHost); }
  const a = { current: null }, b = { current: null }, root = rootOf(waveHost), sr = stage.getBoundingClientRect(), fr = o.from.getBoundingClientRect();
  const src = { x: fr.left - sr.left, y: fr.top - sr.top, w: fr.width, h: fr.height }, tA = { v: false }, tB = { v: false };
  let over = false, timer = 0;
  const me = { cancel() { if (over) return; over = true; clearTimeout(timer); waveNow = null; waveHost.classList.remove("on"); stage.classList.remove("waving"); drop(waveHost); } };
  const end = () => { if (over) return; over = true; clearTimeout(timer); waveHost.classList.remove("on"); stage.classList.remove("waving"); setTimeout(() => { if (waveNow === me) { waveNow = null; drop(waveHost); } }, 260); };   // 덮개를 0.25초에 걷는다
  const view = (go) => <WaveView go={go} src={src} clean={!tA.v && !tB.v} a={a} b={b} done={(rev) => { if (rev) end(); }} />;
  flushSync(() => root.render(view(false)));   // 앞 장면을 그려 얹어 놓고
  if (!a.current || !paint(a.current, stage, tA)) { drop(waveHost); return o.swap(); }
  waveNow = me; waveHost.classList.add("on"); stage.classList.add("waving");
  o.swap();                                    // 그 밑에서 공간을 바꾼다
  const play = () => { if (over) return;
    if (!b.current || !paint(b.current, stage, tB)) return me.cancel();
    flushSync(() => root.render(view(false)));
    requestAnimationFrame(() => { if (!over) { root.render(view(true)); timer = setTimeout(end, (WDUR + 0.5) * 1000); } }); };   // 물결을 보낸다(끝났다는 신호가 안 와도 덮개는 걷는다)
  const img = media.querySelector(".still.on");
  if (!img) return me.cancel();                // 도면 장면 등 사진이 없는 곳
  if (img.complete && img.naturalWidth) play();
  else { timer = setTimeout(() => me.cancel(), 6000); img.addEventListener("load", () => { clearTimeout(timer); requestAnimationFrame(play); }, { once: true }); }   // 다음 사진이 올 때까지 앞 장면을 붙들고 있다(그동안 가운데 구슬이 돈다)
}

const api = { beam: guard("beam", beam), note: guard("note", note), busy: guard("busy", busy), version: "0.17",
  wave(o) {   // 무슨 일이 있어도 공간은 한 번 바뀐다
    let swapped = false; const once = { from: o.from, swap: () => { if (!swapped) { swapped = true; o.swap(); } } };
    try { wave(once); } catch (e) { console.warn("[fx] wave", e); waveNow = null; const st = $("stage"); if (st) st.classList.remove("waving"); if (waveHost) { waveHost.classList.remove("on"); drop(waveHost); } }
    once.swap();
  } };
guard("metal", metal)();
if (typeof window.__mrfx === "function") window.__mrfx(api); else window.__mrfxApi = api;
