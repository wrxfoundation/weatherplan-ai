/* 수사망 보드 (9/16 서우 — "CIA / FBI 전개도 수사망 지도 처럼 각자의 관계성등을 나타내는 맵")

   명부(/admin/map)는 훑는 화면이다. 이 화면은 다른 것을 본다 — **누가 누구와 묶여 있는가.**
   목록에서는 「테더에 둘」·「바이낸스에 셋」이 글자로만 보이지만, 선으로 그리면 한 회사에
   우리 손이 몇 개 들어가 있는지가 형태로 먼저 읽힌다. 「한 하우스에 둘을 동시에 열지 않는다」가
   규칙이 아니라 그림이 되는 것이 이 화면의 목적이다.

   그리는 것은 셋뿐이다.
     · 중심에서 뻗는 선 = 우리와의 거리(자세). 대화 중은 굵고 가깝다, 열지 않음은 희미하고 멀다.
     · 사람끼리 잇는 붉은 선 = 같은 회사. 이 선이 두 가닥 이상이면 상한 경고다.
     · 바깥 고리 = 게이트. 아직 열 수 없는 사람은 테두리가 끊겨 있다.

   레이아웃은 난수를 쓰지 않는다 — 새로고침마다 그림이 바뀌면 기억이 쌓이지 않기 때문이다.
   같은 데이터면 같은 자리에 선다(seeded jitter + 결정론적 완화 반복).

   ⚠ 접근하지 않기로 한 자리가 그대로 보인다. 주소를 외부에 공유하지 말 것. */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type Node = {
  id: string; name: string; org: string; role: string;
  lane: string; laneLabel: string; stance: string; stanceLabel: string;
  why: string; next: string; tie?: string; via?: string; meet?: string;
  group?: string; gate?: string; gateLabel?: string; inbound?: boolean;
};

/* 자세가 곧 중심에서의 거리다. 숫자는 픽셀 */
const RING: Record<string, number> = { talking: 190, open: 275, linked: 390, hold: 520, off: 625 };
const STANCE_COLOR: Record<string, string> = {
  talking: "#5ee0a0", open: "#7cc6ff", linked: "#c8d4e6", hold: "#8a94a6", off: "#4b5364",
};

const W = 1960, H = 1240, CX = W / 2, CY = H / 2;

/* 문자열에서 뽑는 고정 난수 — 같은 사람은 늘 같은 흔들림을 받는다 */
const seed = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
};

export default function Graph({ nodes, lanes }: { nodes: Node[]; lanes: { key: string; label: string; note: string }[] }) {
  const [lane, setLane] = useState<string>("");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Node | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null);
  const moved = useRef(false);

  /* ── 자리 잡기 ─────────────────────────────────────────────
     레인마다 부채꼴을 하나씩 주고, 그 안에서 자세에 따라 중심에서 멀어진다.
     그다음 겹침만 밀어낸다 — 같은 회사는 서로 조금 당긴다. */
  const laid = useMemo(() => {
    /* 부채꼴 폭을 인원에 비례해 나눈다 — 균등 분할이면 서른 명짜리 레인이 뭉치고
       한 명짜리 레인이 빈다. 레인마다 최소 폭은 보장한다. */
    const groups = lanes.map((l) => ({ ...l, arr: nodes.filter((n) => n.lane === l.key) })).filter((g) => g.arr.length);
    const total = groups.reduce((a, g) => a + g.arr.length, 0) || 1;
    const MINW = 0.055;                       /* 전체 원의 5.5% 는 보장 */
    const raw = groups.map((g) => Math.max(MINW, g.arr.length / total));
    const scale = 1 / raw.reduce((a, b) => a + b, 0);
    const spans = raw.map((r) => r * scale * Math.PI * 2);

    const sectors: Record<string, { start: number; span: number }> = {};
    let acc = -Math.PI / 2;
    groups.forEach((g, i) => { sectors[g.key] = { start: acc, span: spans[i] }; acc += spans[i]; });

    const pts = nodes.map((n) => {
      const sec = sectors[n.lane] ?? { start: 0, span: Math.PI * 2 };
      const arr = nodes.filter((m) => m.lane === n.lane);
      const idx = arr.findIndex((m) => m.id === n.id);
      const inner = sec.span * 0.86;
      const a = sec.start + sec.span / 2
        + (arr.length > 1 ? (idx / (arr.length - 1) - 0.5) * inner : 0)
        + (seed(n.id) - 0.5) * sec.span * 0.1;
      const r = (RING[n.stance] ?? 460) + (seed(n.id + "r") - 0.5) * 90;
      return { n, x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r * 0.8 };
    });

    /* 완화 — 이름은 가로로 길다. 충돌도 타원으로 본다(가로 여유를 더 준다) */
    const RX = 78, RY = 40;
    for (let it = 0; it < 420; it++) {
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j];
          const dx = (b.x - a.x) / RX, dy = (b.y - a.y) / RY;
          const d = Math.hypot(dx, dy) || 0.001;
          const same = (a.n.group ?? a.n.org) === (b.n.group ?? b.n.org);
          if (d < 1) {
            const f = ((1 - d) / d) * 0.45;
            a.x -= dx * RX * f; a.y -= dy * RY * f; b.x += dx * RX * f; b.y += dy * RY * f;
          } else if (same && d > 2.2) {
            const f = ((d - 2.2) / d) * 0.03;
            a.x += dx * RX * f; a.y += dy * RY * f; b.x -= dx * RX * f; b.y -= dy * RY * f;
          }
        }
      }
    }
    /* 레인 이름을 놓을 자리 — 그 레인 사람들의 바깥쪽 평균 */
    const labels = groups.map((g) => {
      const mid = sectors[g.key].start + sectors[g.key].span / 2;
      const rr = Math.max(...g.arr.map((n) => RING[n.stance] ?? 460)) + 92;
      return { key: g.key, label: g.label, n: g.arr.length, x: CX + Math.cos(mid) * rr, y: CY + Math.sin(mid) * rr * 0.8 };
    });
    return { pts, labels };
  }, [nodes, lanes]);

  const pts = laid.pts;

  /* 같은 회사를 잇는 선. 회사에 둘 이상 있을 때만 생긴다 = 상한 경고가 그림이 된다 */
  const orgEdges = useMemo(() => {
    const by = new Map<string, typeof pts>();
    for (const p of pts) {
      const k = p.n.group ?? p.n.org;
      if (!k || k.startsWith("(")) continue;
      (by.get(k) ?? by.set(k, []).get(k)!).push(p);
    }
    const out: { a: typeof pts[0]; b: typeof pts[0]; org: string; n: number }[] = [];
    for (const [org, arr] of by) {
      if (arr.length < 2) continue;
      for (let i = 0; i < arr.length - 1; i++) out.push({ a: arr[i], b: arr[i + 1], org, n: arr.length });
    }
    return out;
  }, [pts]);

  const dim = (n: Node) => {
    if (lane && n.lane !== lane) return true;
    if (q && !`${n.name} ${n.org} ${n.role}`.toLowerCase().includes(q.toLowerCase())) return true;
    return false;
  };
  const linked = (id: string) => {
    if (!hover) return false;
    const h = nodes.find((n) => n.id === hover);
    const t = nodes.find((n) => n.id === id);
    if (!h || !t) return false;
    return (h.group ?? h.org) === (t.group ?? t.org);
  };

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setSel(null); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const n of nodes) c[n.lane] = (c[n.lane] ?? 0) + 1;
    return c;
  }, [nodes]);

  return (
    <div className="wb">
      <div className="bar">
        <button className={lane === "" ? "chip on" : "chip"} onClick={() => setLane("")}>전체 {nodes.length}</button>
        {lanes.map((l) => (
          <button key={l.key} className={lane === l.key ? "chip on" : "chip"} onClick={() => setLane(lane === l.key ? "" : l.key)} title={l.note}>
            {l.label} {counts[l.key] ?? 0}
          </button>
        ))}
        <input className="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름·회사·직함" />
        <span className="legend">
          {Object.entries(STANCE_COLOR).map(([k, v]) => (
            <span key={k}><i style={{ background: v }} />{{ talking: "대화 중", open: "여는 중", linked: "연결됨", hold: "보류", off: "열지 않음" }[k]}</span>
          ))}
          <span><i className="org" />같은 회사</span>
        </span>
        <span className="zoom">
          <button onClick={() => setView((v) => ({ ...v, k: Math.min(2.4, v.k * 1.2) }))}>＋</button>
          <button onClick={() => setView((v) => ({ ...v, k: Math.max(0.5, v.k / 1.2) }))}>－</button>
          <button onClick={() => setView({ x: 0, y: 0, k: 1 })}>처음</button>
        </span>
      </div>

      <div
        className="canvas"
        onPointerDown={(e) => {
          /* 여기서 포인터를 잡아 버리면 점 클릭이 캔버스에 먹힌다 —
             실제로 끌기 시작한 뒤(onPointerMove)에만 잡는다. */
          drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false };
          moved.current = false;
        }}
        onPointerMove={(e) => {
          const d = drag.current; if (!d) return;
          const dx = e.clientX - d.x, dy = e.clientY - d.y;
          if (!d.moved && Math.hypot(dx, dy) > 4) {
            d.moved = true; moved.current = true;
            e.currentTarget.setPointerCapture?.(e.pointerId);
          }
          if (d.moved) setView((v) => ({ ...v, x: d.vx + dx, y: d.vy + dy }));
        }}
        onPointerUp={(e) => {
          drag.current = null;
          if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
          /* 클릭 판정이 끝난 뒤에 푼다 */
          setTimeout(() => { moved.current = false; }, 0);
        }}
        onPointerCancel={() => { drag.current = null; }}
        onWheel={(e) => { setView((v) => ({ ...v, k: Math.min(2.4, Math.max(0.5, v.k * (e.deltaY < 0 ? 1.08 : 0.93))) })); }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="board">
          <defs>
            <radialGradient id="vig" cx="50%" cy="50%" r="72%">
              <stop offset="0%" stopColor="#111722" stopOpacity="0" />
              <stop offset="100%" stopColor="#05070c" stopOpacity="0.92" />
            </radialGradient>
            <pattern id="grid" width="34" height="34" patternUnits="userSpaceOnUse">
              <path d="M34 0H0V34" fill="none" stroke="#1b2432" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="#080b12" />
          <rect width={W} height={H} fill="url(#grid)" />
          <g transform={`translate(${view.x} ${view.y}) translate(${CX} ${CY}) scale(${view.k}) translate(${-CX} ${-CY})`}>
            {/* 자세 고리 — 중심에서의 거리가 무엇을 뜻하는지 배경으로 */}
            {Object.entries(RING).map(([k, r]) => (
              <ellipse key={k} cx={CX} cy={CY} rx={r} ry={r * 0.78} fill="none" stroke="#141c28" strokeWidth={1} strokeDasharray="3 7" />
            ))}
            {/* 레인 이름 — 어느 부채꼴이 무엇인지 */}
            {laid.labels.map((l) => (
              <text key={l.key} x={l.x} y={l.y} className="lane"
                opacity={lane && lane !== l.key ? 0.18 : 0.9}>{l.label} · {l.n}</text>
            ))}
            {/* 중심 → 사람 */}
            {pts.map((p) => {
              const d = dim(p.n);
              const s = p.n.stance;
              return (
                <line key={"c" + p.n.id} x1={CX} y1={CY} x2={p.x} y2={p.y}
                  stroke={STANCE_COLOR[s] ?? "#666"}
                  strokeWidth={s === "talking" ? 1.9 : s === "open" ? 1.4 : 0.8}
                  strokeDasharray={s === "hold" || s === "off" ? "2 6" : undefined}
                  opacity={d ? 0.05 : s === "off" ? 0.16 : s === "hold" ? 0.26 : 0.5} />
              );
            })}
            {/* 같은 회사 — 붉은 실 */}
            {orgEdges.map((e, i) => {
              const d = dim(e.a.n) || dim(e.b.n);
              const mx = (e.a.x + e.b.x) / 2, my = (e.a.y + e.b.y) / 2 - 26;
              return (
                <path key={"o" + i} d={`M${e.a.x} ${e.a.y} Q ${mx} ${my} ${e.b.x} ${e.b.y}`}
                  fill="none" stroke={e.n >= 3 ? "#ff5d5d" : "#c8503f"} strokeWidth={e.n >= 3 ? 1.8 : 1.2}
                  opacity={d ? 0.07 : 0.62} />
              );
            })}
            {/* 중심 */}
            <g>
              <circle cx={CX} cy={CY} r={40} fill="#0d1420" stroke="#5ee0a0" strokeWidth={1.4} />
              <text x={CX} y={CY - 2} className="hub">wellbian</text>
              <text x={CX} y={CY + 13} className="hubs">우리</text>
            </g>
            {/* 사람 */}
            {pts.map((p) => {
              const n = p.n, d = dim(n), hl = hover === n.id || linked(n.id);
              const c = STANCE_COLOR[n.stance] ?? "#888";
              const r = n.stance === "talking" ? 11 : n.stance === "open" ? 9.5 : 8;
              return (
                <g key={n.id} className="node" opacity={d ? 0.14 : 1}
                  onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)}
                  onClick={(e) => { e.stopPropagation(); if (!moved.current) setSel(n); }}>
                  {n.inbound && <circle cx={p.x} cy={p.y} r={r + 6} fill="none" stroke="#ffd166" strokeWidth={1.1} opacity={0.8} />}
                  <circle cx={p.x} cy={p.y} r={r} fill={hl ? c : "#0d1420"} stroke={c}
                    strokeWidth={hl ? 2.4 : 1.6} strokeDasharray={n.gate ? "3 3" : undefined} />
                  <text x={p.x} y={p.y + r + 13} className={hl ? "lbl on" : "lbl"}>{n.name}</text>
                  <text x={p.x} y={p.y + r + 25} className="sub">{n.org}</text>
                </g>
              );
            })}
          </g>
          <rect width={W} height={H} fill="url(#vig)" pointerEvents="none" />
        </svg>

        {sel && (
          <aside className="panel" onPointerDown={(e) => e.stopPropagation()}>
            <button className="x" onClick={() => setSel(null)}>닫기</button>
            <h3>{sel.name}</h3>
            <p className="org">{sel.org}</p>
            <p className="role">{sel.role}</p>
            <div className="tags">
              <span className="t" style={{ borderColor: STANCE_COLOR[sel.stance] }}>{sel.stanceLabel}</span>
              <span className="t">{sel.laneLabel}</span>
              {sel.gate && <span className="t gate">게이트 · {sel.gateLabel ?? sel.gate}</span>}
              {sel.inbound && <span className="t in">인바운드</span>}
            </div>
            {sel.tie && <p className="kv"><b>연결</b>{sel.tie}</p>}
            {sel.via && <p className="kv"><b>경유</b>{sel.via}</p>}
            {sel.meet && <p className="kv"><b>만날 자리</b>{sel.meet}</p>}
            <p className="kv"><b>왜</b>{sel.why}</p>
            <p className="kv"><b>다음</b>{sel.next}</p>
          </aside>
        )}
      </div>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
    </div>
  );
}

const CSS = `
.wb{--ink:#dfe6f2;--dim:#8a94a6;color:var(--ink)}
.wb .bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px 0 10px}
.wb .chip{background:#111827;border:1px solid #232c3b;color:#c2ccdb;border-radius:999px;padding:4px 10px;font-size:12px;cursor:pointer}
.wb .chip.on{background:#1b2a3f;border-color:#3d6ea8;color:#eaf2ff}
.wb .q{background:#0d131d;border:1px solid #232c3b;color:#dfe6f2;border-radius:6px;padding:5px 9px;font-size:12px;width:160px}
.wb .legend{display:flex;gap:10px;align-items:center;font-size:11px;color:var(--dim);margin-left:auto}
.wb .legend span{display:inline-flex;gap:4px;align-items:center}
.wb .legend i{width:9px;height:9px;border-radius:50%;display:inline-block}
.wb .legend i.org{width:14px;height:2px;border-radius:0;background:#ff5d5d}
.wb .zoom{display:flex;gap:4px}
.wb .zoom button{background:#111827;border:1px solid #232c3b;color:#c2ccdb;border-radius:6px;padding:3px 8px;font-size:12px;cursor:pointer}
.wb .canvas{position:relative;border:1px solid #1b2432;border-radius:10px;overflow:hidden;background:#080b12;touch-action:none;cursor:grab}
.wb .canvas:active{cursor:grabbing}
.wb .board{display:block;width:100%;height:auto}
.wb .node{cursor:pointer}
.wb text{font-family:inherit;text-anchor:middle;pointer-events:none}
.wb .hub{fill:#5ee0a0;font-size:14px;font-weight:700}
.wb .hubs{fill:#7d8a9c;font-size:10px}
.wb .lbl{fill:#ccd8ea;font-size:13px}
.wb .lbl.on{fill:#fff;font-weight:700}
.wb .sub{fill:#77839a;font-size:10.5px}
.wb .lane{fill:#6d8fbb;font-size:18px;font-weight:700;letter-spacing:.04em}
.wb .panel{position:absolute;right:12px;top:12px;width:330px;max-height:calc(100% - 24px);overflow:auto;
  background:rgba(10,15,24,.97);border:1px solid #2a3547;border-radius:10px;padding:14px 14px 16px;backdrop-filter:blur(3px)}
.wb .panel h3{margin:0 0 2px;font-size:16px}
.wb .panel .org{margin:0;font-size:12px;color:#8fb4e8}
.wb .panel .role{margin:2px 0 8px;font-size:11px;color:var(--dim);line-height:1.5}
.wb .panel .x{float:right;background:none;border:1px solid #2a3547;color:var(--dim);border-radius:6px;font-size:11px;padding:2px 7px;cursor:pointer}
.wb .tags{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:9px}
.wb .t{font-size:10px;border:1px solid #33405a;border-radius:999px;padding:2px 8px;color:#c2ccdb}
.wb .t.gate{border-color:#8a6d3b;color:#e8c07d}
.wb .t.in{border-color:#ffd166;color:#ffd166}
.wb .kv{margin:0 0 8px;font-size:12px;line-height:1.65;color:#cbd5e4}
.wb .kv b{display:block;font-size:10px;color:#7d8a9c;margin-bottom:2px;font-weight:600}
@media (max-width:760px){.wb .panel{position:static;width:auto;margin-top:10px;max-height:none}.wb .legend{margin-left:0}}
`;
