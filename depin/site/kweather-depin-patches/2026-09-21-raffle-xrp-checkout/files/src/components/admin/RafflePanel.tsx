"use client";
/* 관리자 콘솔 "래플" 탭 (2026-09-21) - XRPL SEOUL 2026 래플 응모 현황. 결제 확정 수(=참여 현황 카운트)·경품 배정·현장 수령을
   한 표로 본다. 데이터는 /api/admin/raffle?mode= (읽기 전용). 경품 배정은 블라인드 추첨 탭의 「래플 경품 배정」, 수령 처리는
   /admin/raffle-check 스캐너에서 한다. */
import { useCallback, useEffect, useState } from "react";
import { toast } from "@/components/Toast";
import { Pager, SortTh, usePager, useSort, type SortSpec } from "@/components/admin/sortable";

interface Row {
  id: string; event: string; wallet: string; email: string | null; status: string; entryNo: number | null; ticketCode: string | null; prize: string | null;
  redeemedAt: string | null; redeemedBy: string | null; paidAt: string | null; txHash: string | null; amountXrp: number; createdAt: string;
}
interface Summary { total: number; paid: number; holds: number; overflow: number; redeemed: number; assigned: number; byPrize: [string, number][] }

const SORT: SortSpec<Row> = {
  no: (r) => r.entryNo, wallet: (r) => r.wallet, email: (r) => r.email, status: (r) => r.status, paid: (r) => (r.paidAt ? new Date(r.paidAt).getTime() : null),
  prize: (r) => r.prize, redeemed: (r) => (r.redeemedAt ? new Date(r.redeemedAt).getTime() : null), created: (r) => new Date(r.createdAt).getTime(),
};

export default function RafflePanel({ secret }: { secret: string }) {
  const [mode, setMode] = useState<"prod" | "test">("prod");
  const [status, setStatus] = useState<"" | "PAID" | "PENDING" | "OVERFLOW">("");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [msg, setMsg] = useState("");
  const filtered = rows.filter((r) => (!status || r.status === status) && (!q || r.wallet.includes(q) || (r.email ?? "").toLowerCase().includes(q.toLowerCase()) || (r.ticketCode ?? "").includes(q.toUpperCase()) || (r.txHash ?? "").includes(q.toUpperCase())));
  const sort = useSort(filtered, SORT, { key: "no", dir: "asc" });
  const pager = usePager(sort.sorted);

  const load = useCallback(async () => {
    setMsg("");
    try {
      const r = await fetch(`/api/admin/raffle?mode=${mode}`, { headers: { "x-admin-secret": secret }, cache: "no-store" });
      const d = await r.json();
      if (!r.ok) { setMsg(d.error || "조회 실패"); return; }
      setRows(d.entries); setSummary(d.summary);
    } catch (e) { setMsg((e as Error).message); toast.err((e as Error).message); }
  }, [mode, secret]);
  useEffect(() => { load(); }, [load]);

  /* CSV - 초대권 이메일 발송·현장 명단용(관리자 콘솔 › 메일 발송 도구는 지갑 목록으로 보낸다) */
  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["번호", "지갑", "이메일", "상태", "경품", "결제 확정", "수령", "티켓", "해시"];
    const body = sort.sorted.map((r) => [r.entryNo ?? "", r.wallet, r.email ?? "", r.status, r.prize ?? "", r.paidAt ?? "", r.redeemedAt ?? "", r.ticketCode ?? "", r.txHash ?? ""].map(esc).join(","));
    const blob = new Blob(["\uFEFF" + [head.map(esc).join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `raffle-${mode}-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };
  const short = (s: string | null, n = 10) => (s ? `${s.slice(0, n)}…` : "-");
  const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) : "-");

  return (
    <div className="stats-grid">
      <div className="stat-cell span-12" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <select className="field-select" value={mode} onChange={(e) => setMode(e.target.value as "prod" | "test")} style={{ width: 200 }}>
          <option value="prod">실제 (xrpseoul-2026)</option>
          <option value="test">리허설 (xrpseoul-2026-test)</option>
        </select>
        <select className="field-select" value={status} onChange={(e) => setStatus(e.target.value as "" | "PAID" | "PENDING" | "OVERFLOW")} style={{ width: 200 }}>
          <option value="">전체 상태</option>
          <option value="PAID">결제 확정</option>
          <option value="PENDING">결제 대기</option>
          <option value="OVERFLOW">정원 초과 · 환불 대상</option>
        </select>
        <input className="field-input" placeholder="지갑 · 이메일 · 티켓 코드 · 해시" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 260 }} />
        <button className="btn-ghost" onClick={load} style={{ padding: "6px 14px" }}>새로고침</button>
        <button className="btn-ghost" onClick={exportCsv} disabled={!filtered.length} style={{ padding: "6px 14px" }} title="현재 필터·정렬대로 CSV 저장(이메일 포함)">CSV 내보내기</button>
        {msg && <span className="warn" style={{ fontSize: 13 }}>{msg}</span>}
      </div>

      {summary && (
        <>
          <div className="stat-cell span-3"><div className="stat-cell-k"><span>결제 확정 (참여 현황)</span></div><div className="stat-cell-v">{summary.paid.toLocaleString()}</div><div className="stat-cell-delta">응모 행 {summary.total.toLocaleString()} · 유효 예약 {summary.holds.toLocaleString()} · 대기 {(summary.total - summary.paid - summary.overflow).toLocaleString()}{summary.overflow ? <> · <b style={{ color: "var(--red)" }}>환불 대상 {summary.overflow}</b></> : null}</div></div>
          <div className="stat-cell span-3"><div className="stat-cell-k"><span>경품 배정</span></div><div className="stat-cell-v">{summary.assigned.toLocaleString()}</div><div className="stat-cell-delta">{summary.assigned ? "추첨 완료" : "추첨 전 - 블라인드 추첨 탭 › 래플 경품 배정"}</div></div>
          <div className="stat-cell span-3"><div className="stat-cell-k"><span>현장 수령</span></div><div className="stat-cell-v">{summary.redeemed.toLocaleString()}</div><div className="stat-cell-delta">/admin/raffle-check 스캐너</div></div>
          <div className="stat-cell span-3"><div className="stat-cell-k"><span>경품별 배정</span></div><div style={{ fontSize: 13, lineHeight: 1.6 }}>{summary.byPrize.length ? summary.byPrize.map(([k, v]) => <div key={k}>{k} <b>{v}</b></div>) : <span className="dim">-</span>}</div></div>
        </>
      )}

      <div className="stat-cell span-12">
        <div className="stat-cell-k"><span>응모 목록</span><span>{filtered.length.toLocaleString()}건</span></div>
        <div className="feed-table-scroll">
          <table className="feed-table compact">
            <thead><tr>
              {([["no", "번호"], ["wallet", "지갑"], ["email", "이메일"], ["status", "상태"], ["paid", "결제 확정"], ["prize", "경품"], ["redeemed", "수령"], ["created", "예약(시작)"]] as [string, string][]).map(([k, label]) => (
                <SortTh key={k} k={k} sortKey={sort.sortKey} dir={sort.dir} onToggle={sort.toggle}>{label}</SortTh>
              ))}
              <th>티켓 · 해시</th>
            </tr></thead>
            <tbody>
              {pager.slice.map((r) => (
                <tr key={r.id}>
                  <td className="num mono">{r.entryNo != null ? `#${String(r.entryNo).padStart(4, "0")}` : "-"}</td>
                  <td className="mono" title={r.wallet} style={{ fontSize: 12 }}>{short(r.wallet, 12)}</td>
                  <td style={{ fontSize: 12.5 }}>{r.email ?? <span className="dim">-</span>}</td>
                  <td className={r.status === "PAID" ? "ok" : "warn"}>{r.status === "PAID" ? "결제 확정" : r.status === "PENDING" ? "대기" : r.status === "OVERFLOW" ? "정원 초과 · 환불" : r.status}</td>
                  <td className="dim">{when(r.paidAt)}</td>
                  <td>{r.prize ?? <span className="dim">-</span>}</td>
                  <td className="dim">{r.redeemedAt ? `${when(r.redeemedAt)} · ${r.redeemedBy ?? ""}` : "-"}</td>
                  <td className="dim">{when(r.createdAt)}</td>
                  <td className="mono" style={{ fontSize: 11 }}>{r.ticketCode ? <a href={`/event/xrpl-seoul/ticket/${r.ticketCode}`} target="_blank" rel="noreferrer">{r.ticketCode}</a> : "-"}{r.txHash ? <span className="dim"> · {short(r.txHash, 8)}</span> : null}</td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={9} className="dim">응모가 없습니다</td></tr>}
            </tbody>
          </table>
        </div>
        <Pager p={pager} />
      </div>
    </div>
  );
}
