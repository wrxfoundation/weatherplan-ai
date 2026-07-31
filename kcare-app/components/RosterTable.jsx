import { useMemo, useState } from "react";
import { downloadCsv } from "../lib/rosters";

// 명부 테이블 — 관제·경영 공용. 검색 + 등록일 기간 필터(일·주·월·지정 범위) + 엑셀(CSV).
// 내보내기는 "지금 보이는(필터된) 행"만 담는다 · 다운로드는 감사 로그에 기록(onExport).

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

export default function RosterTable({ roster, onExport, onRowClick }) {
  const [q, setQ] = useState("");
  const [range, setRange] = useState("all");
  const [from, setFrom] = useState(""); // 지정 범위 (range와 배타 — 입력 시 프리셋 해제)
  const [to, setTo] = useState("");
  const hasDate = roster.dateCol != null;

  const rows = useMemo(() => {
    let r = roster.rows;
    const needle = q.trim();
    if (needle) r = r.filter((row) => row.some((v) => String(v).includes(needle)));
    if (hasDate) {
      const dayMs = 86400000;
      const parse = (v) => new Date(`${v}T00:00:00`).getTime();
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
    return r;
  }, [roster, q, range, from, to, hasDate]);

  const filtered = rows.length !== roster.rows.length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-[15px] font-bold text-navy">{roster.title}</h2>
        <span className="font-num text-[12px] text-muted">
          {filtered ? `${rows.length} / ${roster.rows.length}건` : `${roster.rows.length}건`}
        </span>
        <ExportBtn roster={{ ...roster, rows }} onExport={onExport} className="ml-auto" />
      </div>

      {/* 검색 + 기간 필터 */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="검색 — 이름 · 동 · 담당 · 상태"
          className="w-full min-w-[180px] rounded-[10px] border border-navy/15 bg-white/70 px-3 py-2 text-[13px] text-ink outline-none placeholder:text-muted/60 focus:ring-1 focus:ring-gold sm:w-[240px]"
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
            <div className="flex items-center gap-1.5 text-[12px] text-muted">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                aria-label="시작일"
                className="rounded-[10px] border border-navy/15 bg-white/70 px-2 py-1.5 font-num text-[12px] text-ink outline-none focus:ring-1 focus:ring-gold"
              />
              ~
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                aria-label="종료일"
                className="rounded-[10px] border border-navy/15 bg-white/70 px-2 py-1.5 font-num text-[12px] text-ink outline-none focus:ring-1 focus:ring-gold"
              />
              {(from || to) && (
                <button
                  onClick={() => {
                    setFrom("");
                    setTo("");
                  }}
                  className="btn-press rounded-full border border-navy/15 px-2.5 py-1 text-[11px] font-bold text-muted"
                >
                  지정 해제
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-[12px]">
          <thead>
            <tr className="whitespace-nowrap border-b-2 border-navy/20 text-[11px] font-bold text-muted">
              {roster.cols.map((c) => (
                <th key={c} className="py-2 pr-4 font-bold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r[0]}
                onClick={() => onRowClick?.(r[0])}
                className={`whitespace-nowrap border-b border-navy/[.06] ${
                  onRowClick ? "cursor-pointer hover:bg-navy/[.03]" : ""
                }`}
              >
                {r.map((v, i) => (
                  <td key={i} className={`py-2 pr-4 ${i === 0 ? "font-bold text-navy" : "text-ink"}`}>
                    {v}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={roster.cols.length} className="py-6 text-center text-[12px] text-muted">
                  조건에 맞는 항목이 없습니다 — 검색어 · 기간을 조정해 보세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
