"use client";
/* 관리자 "시스템·용량" 탭 - 유입 소스별 방문자 · 페이지뷰 (2026-09-26 지시: "일자별 방문자 페이지수를 소스별로 보고싶은데 다운로드도 가능하게")
   줄 = 소스(방문자의 그날 첫 입구), 칸 = 날짜(최근 날이 왼쪽 - 위 일일 표와 같은 순서). 계산은 lib/traffic-source-table.ts.
   소스는 기록을 켠 뒤의 방문부터 있다. 그 전 방문자는 「(기록 전)」 한 줄로 모인다. */
import { useMemo, useState } from "react";
import { BEFORE, dailyTable, pivot, pivotTable, rawTable, toCsv, toUtf16, type DayTotals, type Metric, type SourceDayRow, type Table } from "@/lib/traffic-source-table";

const fmtN = (n: number) => n.toLocaleString("ko-KR");
const today = () => new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10).replace(/-/g, "");

export default function TrafficSources({ ready, rows, daily }: { ready: boolean; rows: SourceDayRow[]; daily: Record<string, DayTotals> }) {
  const [metric, setMetric] = useState<Metric>("visitors");
  const [q, setQ] = useState("");
  const [excel, setExcel] = useState(true);
  const days = useMemo(() => [...new Set([...Object.keys(daily), ...rows.map((r) => r.day)])].sort().reverse(), [daily, rows]);
  const p = useMemo(() => pivot(rows, days, metric), [rows, days, metric]);
  const needle = q.trim().toLowerCase();
  const shown = needle ? p.rows.filter((r) => r.source.toLowerCase().includes(needle) || r.mediums.some((m) => m.toLowerCase().includes(needle))) : p.rows;
  const max = Math.max(1, ...p.rows.filter((r) => r.source !== BEFORE).flatMap((r) => r.cells));
  const recorded = p.rows.some((r) => r.source !== BEFORE);
  const unit = metric === "visitors" ? "방문자" : "페이지뷰";

  const save = (name: string, t: Table) => {
    const blob = excel
      ? new Blob([toUtf16(t) as BlobPart], { type: "text/csv;charset=utf-16le" })
      : new Blob([toCsv(t)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${name}-${today()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const tint = (v: number) => (v ? `rgba(77, 77, 206, ${(0.06 + 0.34 * (Math.log1p(v) / Math.log1p(max))).toFixed(3)})` : undefined);
  const btn = { padding: "6px 12px", fontSize: 13 } as const;

  return (
    <div className="feed-wrap" style={{ marginBottom: 16 }}>
      <div className="feed-head"><span className="feed-head-title">유입 소스별 방문자 · 페이지뷰 (30일)</span><span className="dim">자체 계측 · 방문의 첫 입구 기준 · 봇 제외</span></div>

      <div style={{ padding: "10px 14px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {(["visitors", "pages"] as const).map((m) => (
          <button key={m} className={metric === m ? "btn-primary" : "btn-ghost"} style={btn} onClick={() => setMetric(m)} aria-pressed={metric === m}>
            {m === "visitors" ? "방문자" : "페이지뷰"}
          </button>
        ))}
        <input className="field-input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="소스 찾기 - pixie, t.co …" aria-label="소스 찾기" style={{ width: 200, padding: "6px 10px", fontSize: 13 }} />
        <span style={{ flex: 1 }} />
        <span className="dim" style={{ fontSize: 12.5 }}>내려받기</span>
        <button className="btn-ghost" style={btn} onClick={() => save("wellbian-traffic-daily", dailyTable(daily))}>일별 합계</button>
        <button className="btn-ghost" style={btn} disabled={!recorded} onClick={() => save(`wellbian-traffic-source-${metric}`, pivotTable(p, metric))}>소스×일자 ({unit})</button>
        <button className="btn-ghost" style={btn} disabled={!recorded} onClick={() => save("wellbian-traffic-source-raw", rawTable(rows))}>원자료</button>
        <label className="dim" style={{ fontSize: 12.5, display: "inline-flex", gap: 5, alignItems: "center" }}>
          <input type="checkbox" checked={excel} onChange={(e) => setExcel(e.target.checked)} />엑셀용(한글 안 깨짐)
        </label>
      </div>

      {!ready ? (
        <p className="dim" style={{ fontSize: 13, padding: "0 14px 14px", margin: 0, lineHeight: 1.65 }}>
          소스 기록이 아직 켜지지 않았습니다. DB 에 <span className="mono">prisma/sql/2026-09-26-traffic-source.sql</span> 을 적용하면(또는 <span className="mono">npx prisma db push</span>)
          그 뒤 방문부터 소스가 쌓입니다. 위 일일 표와 「일별 합계」 내려받기는 지금도 됩니다.
        </p>
      ) : (
        <>
          {!recorded && (
            <p className="dim" style={{ fontSize: 13, padding: "0 14px 10px", margin: 0, lineHeight: 1.65 }}>
              소스는 기록을 켠 뒤의 방문부터 쌓입니다. 그 전 방문자는 「{BEFORE}」 한 줄로 보이고 소스로 나눌 수 없습니다 - 지난 기간의 소스는 GA 에서 봅니다.
            </p>
          )}
          <div className="feed-table-scroll" style={{ maxHeight: 420, overflow: "auto" }}>
            <table className="feed-table compact">
              <thead><tr>
                <th style={{ position: "sticky", left: 0, top: 0, zIndex: 3, minWidth: 170 }}>소스 · 매체</th>
                <th style={{ position: "sticky", top: 0, zIndex: 2, textAlign: "right" }}>합계</th>
                {p.days.map((d) => <th key={d} style={{ position: "sticky", top: 0, zIndex: 2, textAlign: "right" }}>{d.slice(5)}</th>)}
              </tr></thead>
              <tbody>
                {shown.length === 0 && <tr><td colSpan={p.days.length + 2} className="dim">맞는 소스가 없습니다</td></tr>}
                {shown.map((r, i) => (
                  <tr key={r.source}>
                    <td style={{ position: "sticky", left: 0, zIndex: 1, background: i % 2 ? "#f8f8fd" : "var(--bg-1)", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }} title={r.source}>
                      <b style={{ color: r.quiet ? "var(--ink-faint)" : undefined }}>{r.source}</b>
                      {r.mediums.length > 0 && <span className="dim" style={{ marginLeft: 6, fontSize: 11.5 }}>{r.mediums.join(" · ")}</span>}
                    </td>
                    <td className="num"><b>{fmtN(r.total)}</b></td>
                    {r.cells.map((v, j) => (
                      <td key={p.days[j]} className="num" title={v ? `${r.source} · ${p.days[j]} · ${unit} ${fmtN(v)}` : undefined}
                        style={{ background: r.source === BEFORE ? undefined : tint(v), color: v ? (r.quiet ? "var(--ink-dim)" : undefined) : "var(--ink-ghost)" }}>
                        {v ? fmtN(v) : "·"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td style={{ position: "sticky", left: 0, zIndex: 1, background: "var(--bg-2)", fontWeight: 700 }}>합계{needle ? " (전체)" : ""}</td>
                  <td className="num" style={{ background: "var(--bg-2)" }}><b>{fmtN(p.total)}</b></td>
                  {p.colTotals.map((v, j) => <td key={p.days[j]} className="num" style={{ background: "var(--bg-2)", fontWeight: 700 }}>{v ? fmtN(v) : "·"}</td>)}
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="dim" style={{ fontSize: 12.5, padding: "8px 14px 12px", margin: 0, lineHeight: 1.65 }}>
            {unit === "방문자" ? "방문자 = 그날 그 소스로 처음 들어온 방문자 수(한 사람은 하루 한 소스)." : "페이지뷰 = 그 소스로 들어온 방문자들의 그날 페이지뷰 합."}{" "}
            소스는 utm_source → promo 코드 → 리퍼러 순으로 정합니다. (direct) = 리퍼러도 UTM 도 없는 방문(텔레그램·카카오톡 앱 안 브라우저 포함) ·
            (internal) = 사이트 안 이동 중 새로 잡힌 방문자(휴대폰 망 전환 등) · {BEFORE} = 소스 기록을 켜기 전 방문자.
            합계는 위 일일 표의 방문자·페이지뷰와 같습니다(기록을 켠 날부터).
          </p>
        </>
      )}
    </div>
  );
}
