import { downloadCsv } from "../lib/rosters";

// 명부 테이블 + 엑셀(CSV) 내보내기 — 관제·경영 공용. 다운로드는 감사 로그에 기록(onExport)
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

export default function RosterTable({ roster, onExport, onRowClick }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-[15px] font-bold text-navy">{roster.title}</h2>
        <span className="font-num text-[12px] text-muted">{roster.rows.length}건</span>
        <ExportBtn roster={roster} onExport={onExport} className="ml-auto" />
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
            {roster.rows.map((r) => (
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
