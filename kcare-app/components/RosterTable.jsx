import { useEffect, useMemo, useState } from "react";
import { downloadCsv } from "../lib/rosters";

// 명부 테이블 — 관제·경영 공용.
// 방대해지는 명부를 사람이 다룰 수 있게: 검색 · 기간 · 빠른 필터(저장된 뷰) · 값 필터(패싯)
// · 컬럼 접기 · 정렬 · 행 선택 · 더보기.
// 원칙: 내보내기는 "지금 화면에 보이는 것"만 담는다 — 선택이 있으면 선택분, 없으면 필터 결과.
//       숨긴 컬럼은 파일에도 담기지 않는다 (필요 없는 개인정보를 파일로 흘리지 않기 위해).
//       다운로드는 감사 로그에 기록(onExport).

const TONE = {
  ok: { fg: "#1E7A5A", bg: "rgba(30,122,90,.1)" },
  warn: { fg: "#8A5D12", bg: "rgba(138,93,18,.12)" },
  bad: { fg: "#C0392B", bg: "rgba(192,57,43,.1)" },
  info: { fg: "#5C5A54", bg: "rgba(10,31,60,.06)" },
};

export function ExportBtn({ roster, onExport, className = "" }) {
  return (
    <button
      onClick={() => {
        downloadCsv(roster);
        onExport?.(roster.title);
      }}
      className={`btn-press rounded-[10px] border border-navy/20 px-3 py-1.5 text-[12px] font-bold text-navy ${className}`}
    >
      ⤓ 엑셀 다운로드
    </button>
  );
}

// 기간 프리셋 — 일(오늘) · 주(7일) · 월(30일)
const RANGES = [
  ["all", "전체", null],
  ["day", "오늘", 1],
  ["week", "1주", 7],
  ["month", "1개월", 30],
];

const PAGE = 12; // 첫 화면 표시 행 수 — 나머지는 더보기

function Chip({ on, children, onClick, tone }) {
  const t = tone && TONE[tone];
  return (
    <button
      onClick={onClick}
      className="btn-press rounded-full border px-2.5 py-1 text-[11px] font-bold"
      style={
        on
          ? { background: "#0A1F3C", color: "#FFFFFF", borderColor: "#0A1F3C" }
          : t
          ? { background: t.bg, color: t.fg, borderColor: "transparent" }
          : { background: "rgba(255,255,255,.6)", color: "#5C5A54", borderColor: "rgba(10,31,60,.14)" }
      }
    >
      {children}
    </button>
  );
}

export default function RosterTable({ roster, onExport, onRowClick, clickableNames, defaultQuery = "", defaultView = null }) {
  const [q, setQ] = useState(defaultQuery);
  const [range, setRange] = useState("all");
  const [from, setFrom] = useState(""); // 지정 범위 (range와 배타 — 입력 시 프리셋 해제)
  const [to, setTo] = useState("");
  const [view, setView] = useState(defaultView); // 빠른 필터(저장된 뷰) 1개
  const [facet, setFacet] = useState({}); // { 컬럼인덱스: [선택 값…] } — 같은 컬럼 안은 OR, 컬럼 간은 AND
  const [hidden, setHidden] = useState(() => new Set(roster.hideCols || []));
  const [sort, setSort] = useState(null); // { col, dir }
  const [sel, setSel] = useState(() => new Set());
  const [limit, setLimit] = useState(PAGE);
  const [openFilter, setOpenFilter] = useState(false);
  const [openCols, setOpenCols] = useState(false);
  const hasDate = roster.dateCol != null;

  // 명부를 바꾸면(서브메뉴 이동) 필터·선택 상태를 초기화한다
  useEffect(() => {
    setQ(defaultQuery);
    setView(defaultView);
    setFacet({});
    setRange("all");
    setFrom("");
    setTo("");
    setSort(null);
    setSel(new Set());
    setLimit(PAGE);
    setHidden(new Set(roster.hideCols || []));
  }, [roster, defaultQuery, defaultView]);

  const rows = useMemo(() => {
    let r = roster.rows;
    const needle = q.trim();
    if (needle) r = r.filter((row) => row.some((v) => String(v).includes(needle)));
    const v = (roster.views || []).find((x) => x.k === view);
    if (v) r = r.filter(v.match);
    for (const [col, vals] of Object.entries(facet)) {
      if (vals.length) r = r.filter((row) => vals.includes(row[col]));
    }
    if (hasDate) {
      const dayMs = 86400000;
      const parse = (val) => new Date(`${val}T00:00:00`).getTime();
      if (from || to) {
        const lo = from ? parse(from) : -Infinity;
        const hi = to ? parse(to) + dayMs : Infinity; // to 당일 포함
        r = r.filter((row) => {
          const t = parse(row[roster.dateCol]);
          return t >= lo && t < hi;
        });
      } else if (range !== "all") {
        const days = RANGES.find(([k]) => k === range)[2];
        const cut = Date.now() - days * dayMs;
        r = r.filter((row) => parse(row[roster.dateCol]) >= cut - dayMs + 1);
      }
    }
    if (sort) {
      const num = (x) => {
        const m = String(x).match(/-?[\d.]+/);
        return m ? parseFloat(m[0]) : null;
      };
      const allNum = r.every((row) => num(row[sort.col]) !== null);
      r = [...r].sort((a, b) => {
        const x = a[sort.col];
        const y = b[sort.col];
        const c = allNum ? num(x) - num(y) : String(x).localeCompare(String(y), "ko");
        return sort.dir === "asc" ? c : -c;
      });
    }
    return r;
  }, [roster, q, view, facet, range, from, to, hasDate, sort]);

  // 패싯 값 분포 — 지금 조건(패싯 제외)에서의 건수를 함께 보여준다
  const facetVals = useMemo(
    () =>
      (roster.facets || []).map(([col, label]) => {
        const map = new Map();
        roster.rows.forEach((row) => map.set(row[col], (map.get(row[col]) || 0) + 1));
        return { col, label, vals: [...map.entries()].sort((a, b) => b[1] - a[1]) };
      }),
    [roster]
  );

  const visCols = roster.cols.map((c, i) => i).filter((i) => !hidden.has(i));
  const shown = rows.slice(0, limit);
  const selRows = rows.filter((r) => sel.has(r[0]));
  const outRows = (selRows.length ? selRows : rows).map((r) => visCols.map((i) => r[i]));
  const activeFilters =
    (q.trim() ? 1 : 0) + (view ? 1 : 0) + Object.values(facet).filter((v) => v.length).length + (range !== "all" || from || to ? 1 : 0);

  const toggleFacet = (col, val) =>
    setFacet((f) => {
      const cur = f[col] || [];
      return { ...f, [col]: cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val] };
    });

  const reset = () => {
    setQ("");
    setView(null);
    setFacet({});
    setRange("all");
    setFrom("");
    setTo("");
    setSel(new Set());
  };

  const clickable = (name) => !!onRowClick && (!clickableNames || clickableNames.has(name));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-[15px] font-bold text-navy">{roster.title}</h2>
        <span className="font-num text-[12px] text-muted">
          {rows.length !== roster.rows.length ? `${rows.length} / ${roster.rows.length}건` : `${roster.rows.length}건`}
        </span>
        {sel.size > 0 && (
          <span className="rounded-full bg-navy px-2.5 py-1 text-[11px] font-bold text-white">{sel.size}건 선택</span>
        )}
        <ExportBtn
          roster={{ ...roster, cols: visCols.map((i) => roster.cols[i]), rows: outRows }}
          onExport={onExport}
          className="ml-auto"
        />
      </div>

      {/* 검색 + 기간 + 접기 토글 */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="검색 — 이름 · 동 · 담당 · 상태"
          className="w-full min-w-[180px] rounded-[10px] border border-navy/15 bg-white/70 px-3 py-2 text-[13px] text-ink outline-none placeholder:text-muted/60 focus:ring-1 focus:ring-gold sm:w-[228px]"
        />
        {hasDate && (
          <>
            <div className="flex gap-1">
              {RANGES.map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => {
                    setRange(k);
                    setFrom("");
                    setTo("");
                  }}
                  className="btn-press rounded-full border px-3 py-1.5 text-[12px] font-bold"
                  style={
                    range === k && !from && !to
                      ? { background: "#0A1F3C", color: "#FFFFFF", borderColor: "#0A1F3C" }
                      : { background: "rgba(255,255,255,.6)", color: "#5C5A54", borderColor: "rgba(10,31,60,.14)" }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex w-full items-center gap-1.5 text-[12px] text-muted sm:w-auto">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                aria-label="시작일"
                className="min-w-0 flex-1 rounded-[10px] border border-navy/15 bg-white/70 px-2 py-1.5 font-num text-[12px] text-ink outline-none focus:ring-1 focus:ring-gold sm:flex-none"
              />
              ~
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                aria-label="종료일"
                className="min-w-0 flex-1 rounded-[10px] border border-navy/15 bg-white/70 px-2 py-1.5 font-num text-[12px] text-ink outline-none focus:ring-1 focus:ring-gold sm:flex-none"
              />
            </div>
          </>
        )}
        <div className="ml-auto flex gap-1.5">
          {facetVals.length > 0 && (
            <button
              onClick={() => setOpenFilter((v) => !v)}
              className="btn-press flex items-center gap-1 rounded-[10px] border border-navy/15 bg-white/60 px-3 py-1.5 text-[12px] font-bold text-navy"
            >
              값 필터
              {activeFilters > 0 && <span className="font-num text-gold">{activeFilters}</span>}
              <span className="text-[10px] text-muted">{openFilter ? "▲" : "▼"}</span>
            </button>
          )}
          <button
            onClick={() => setOpenCols((v) => !v)}
            className="btn-press flex items-center gap-1 rounded-[10px] border border-navy/15 bg-white/60 px-3 py-1.5 text-[12px] font-bold text-navy"
          >
            컬럼 <span className="font-num">{visCols.length}/{roster.cols.length}</span>
            <span className="text-[10px] text-muted">{openCols ? "▲" : "▼"}</span>
          </button>
          {activeFilters > 0 && (
            <button
              onClick={reset}
              className="btn-press rounded-[10px] border border-navy/15 px-3 py-1.5 text-[12px] font-bold text-muted"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 빠른 필터 — 매일 여는 조건만 저장해 둔 뷰 */}
      {(roster.views || []).length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-muted">빠른 필터</span>
          {roster.views.map((v) => {
            const n = roster.rows.filter(v.match).length;
            return (
              <Chip key={v.k} on={view === v.k} onClick={() => setView(view === v.k ? null : v.k)}>
                {v.label} <span className="font-num opacity-70">{n}</span>
              </Chip>
            );
          })}
        </div>
      )}

      {/* 값 필터(패싯) — 스르르 열리는 접기/펴기 */}
      <div className={`smooth-open ${openFilter ? "is-open" : ""}`}>
        <div>
        <div className="mt-2 space-y-2 rounded-xl border border-navy/[.08] bg-white/50 p-3">
          {facetVals.map((f) => (
            <div key={f.col} className="flex flex-wrap items-center gap-1.5">
              <span className="w-[52px] shrink-0 text-[11px] font-bold text-muted">{f.label}</span>
              {f.vals.map(([val, n]) => (
                <Chip key={val} on={(facet[f.col] || []).includes(val)} onClick={() => toggleFacet(f.col, val)}>
                  {val} <span className="font-num opacity-70">{n}</span>
                </Chip>
              ))}
            </div>
          ))}
        </div>
        </div>
      </div>

      {/* 컬럼 접기 — 방대한 표에서 지금 필요한 열만 */}
      <div className={`smooth-open ${openCols ? "is-open" : ""}`}>
        <div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-xl border border-navy/[.08] bg-white/50 p-3">
          <span className="w-[52px] shrink-0 text-[11px] font-bold text-muted">컬럼</span>
          {roster.cols.map((c, i) => (
            <Chip
              key={c}
              on={!hidden.has(i)}
              onClick={() =>
                setHidden((h) => {
                  const n = new Set(h);
                  n.has(i) ? n.delete(i) : n.add(i);
                  return n.size === roster.cols.length ? h : n; // 전부 숨기는 것은 막는다
                })
              }
            >
              {c}
            </Chip>
          ))}
        </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] font-bold text-muted sm:hidden">← 표를 좌우로 밀어 보세요 · 컬럼 버튼으로 열을 줄일 수 있습니다</p>
      <div className="mt-1.5 overflow-x-auto sm:mt-3">
        <table className="w-full min-w-[720px] text-left text-[12px]">
          <thead>
            <tr className="whitespace-nowrap border-b-2 border-navy/20 text-[11px] font-bold text-muted">
              <th className="w-[30px] py-2 pr-2">
                <input
                  type="checkbox"
                  aria-label="전체 선택"
                  checked={rows.length > 0 && sel.size === rows.length}
                  onChange={(e) => setSel(e.target.checked ? new Set(rows.map((r) => r[0])) : new Set())}
                  className="h-[13px] w-[13px] accent-navy"
                />
              </th>
              {visCols.map((i) => (
                <th key={i} className="py-2 pr-4 font-bold">
                  <button
                    onClick={() =>
                      setSort((s) =>
                        s?.col !== i ? { col: i, dir: "asc" } : s.dir === "asc" ? { col: i, dir: "desc" } : null
                      )
                    }
                    className="flex items-center gap-1 font-bold hover:text-navy"
                  >
                    {roster.cols[i]}
                    <span className="text-[9px] text-gold">{sort?.col === i ? (sort.dir === "asc" ? "▲" : "▼") : ""}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            className="rows-in"
            key={`${roster.file}-${view || ""}-${JSON.stringify(facet)}-${q}-${sort?.col ?? ""}${sort?.dir ?? ""}-${limit}`}
          >
            {shown.map((r) => {
              const can = clickable(r[0]);
              return (
                <tr
                  key={r[0]}
                  className={`whitespace-nowrap border-b border-navy/[.06] ${
                    sel.has(r[0]) ? "bg-gold/[.07]" : can ? "hover:bg-navy/[.03]" : ""
                  }`}
                >
                  <td className="py-2 pr-2">
                    <input
                      type="checkbox"
                      aria-label={`${r[0]} 선택`}
                      checked={sel.has(r[0])}
                      onChange={() =>
                        setSel((s) => {
                          const n = new Set(s);
                          n.has(r[0]) ? n.delete(r[0]) : n.add(r[0]);
                          return n;
                        })
                      }
                      className="h-[13px] w-[13px] accent-navy"
                    />
                  </td>
                  {visCols.map((i) => {
                    const v = r[i];
                    const tone = roster.tones?.[i]?.(v);
                    return (
                      <td
                        key={i}
                        onClick={() => can && onRowClick(r[0])}
                        className={`py-2 pr-4 ${i === 0 ? "font-bold text-navy" : "text-ink"} ${can ? "cursor-pointer" : ""}`}
                      >
                        {tone ? (
                          <span
                            className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                            style={{ background: TONE[tone].bg, color: TONE[tone].fg }}
                          >
                            {v}
                          </span>
                        ) : (
                          v
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={visCols.length + 1} className="py-6 text-center text-[12px] text-muted">
                  조건에 맞는 항목이 없습니다 — 검색어 · 기간 · 필터를 조정해 보세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {rows.length > shown.length && (
        <button
          onClick={() => setLimit((n) => n + PAGE)}
          className="btn-press mt-2.5 w-full rounded-[10px] border border-navy/15 bg-white/60 py-2 text-[12px] font-bold text-navy"
        >
          더보기 <span className="font-num">+{Math.min(PAGE, rows.length - shown.length)}</span>
          <span className="ml-1 font-medium text-muted">· 남은 {rows.length - shown.length}건</span>
        </button>
      )}

      <p className="mt-2.5 text-[11px] leading-[1.7] text-muted">
        내보내기는 지금 보이는 것만 담습니다 — 선택이 있으면 선택한 {sel.size || 0}건, 없으면 필터 결과 {rows.length}건 ·
        숨긴 컬럼은 파일에도 포함되지 않습니다. 다운로드 이력은 접근 기록으로 남습니다.
      </p>
    </div>
  );
}
