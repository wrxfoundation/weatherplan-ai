"use client";
/* 관리자 콘솔 › 블라인드 추첨: 커밋(봉인) → 공개(리빌). 결과는 /api/draw/[id] 에서 누구나 검증할 수 있다. */
import { useCallback, useEffect, useState } from "react";
import { toast } from "@/components/Toast";
import { Pager, SortTh, usePager, useSort, type SortSpec } from "@/components/admin/sortable";

interface Draw {
  id: string; kind: string; title: string; status: string; backend: string; commitment: string; participantsHash: string;
  participantCount: number; createdAt: string; revealAfter: string | null; revealedAt: string | null;
  seed?: string; result?: { ordered: string[]; winners: string[]; assignment: { id: string; rank: number; number: number }[] };
  params?: Record<string, unknown>; attestation?: unknown;
}

const DRAW_SORT: SortSpec<Draw> = {
  created: (d) => new Date(d.createdAt).getTime(), title: (d) => `${d.kind} · ${d.title}`, count: (d) => d.participantCount,
  commit: (d) => d.commitment, backend: (d) => d.backend, status: (d) => d.status,
};

export default function BlindDrawPanel({ secret }: { secret: string }) {
  const [draws, setDraws] = useState<Draw[]>([]);
  const sort = useSort(draws, DRAW_SORT); const pager = usePager(sort.sorted);
  const [form, setForm] = useState({ kind: "PREORDER_LOTTERY", title: "", participantsFrom: "reservations", participants: "", winners: "", start: "1", revealAfter: "", paramsJson: "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const hdr = { "content-type": "application/json", "x-admin-secret": secret };

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/draw", { headers: { "x-admin-secret": secret } });
    if (r.ok) setDraws((await r.json()).draws);
  }, [secret]);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setBusy(true); setMsg("");
    try {
      let params: Record<string, unknown> = {};
      if (form.kind === "SETTLEMENT_PARAMS") {
        try { params = form.paramsJson ? JSON.parse(form.paramsJson) : {}; } catch { setMsg("정산 기준 JSON 형식 오류"); toast.ok("정산 기준 JSON 형식 오류"); return; }
      } else {
        if (form.winners) params.winners = Number(form.winners);
        if (form.start) params.start = Number(form.start);
      }
      const body = {
        kind: form.kind, title: form.title || `${form.kind} ${new Date().toISOString().slice(0, 10)}`,
        participantsFrom: form.kind === "SETTLEMENT_PARAMS" ? "custom" : form.participantsFrom,
        participants: form.participantsFrom === "custom" ? form.participants.split(/[\s,]+/).filter(Boolean) : [],
        params, ...(form.revealAfter ? { revealAfter: new Date(form.revealAfter).toISOString() } : {}),
      };
      const r = await fetch("/api/admin/draw", { method: "POST", headers: hdr, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) { setMsg(d.error || "생성 실패"); toast.err(d.error || "생성 실패"); return; }
      setMsg(`봉인 완료 · 커밋 ${d.draw.commitment.slice(0, 16)}… (공개 링크 /api/draw/${d.draw.id})`); toast.ok(`봉인 완료 · 커밋 ${d.draw.commitment.slice(0, 16)}… (공개 링크 /api/draw/${d.draw.id})`);
      await load();
    } finally { setBusy(false); }
  };
  /* XRPL SEOUL 래플 (2026-09-21): 공개된 추첨의 지갑 순서로 경품을 배정한다 - 앞에서부터 초대권 → 측정기 → 우산 → 에코백.
     서버가 참가자 전원이 속한 장부(실제/리허설)를 찾아 그쪽에 적는다. 다시 눌러도 같은 순서로 같은 결과(멱등). */
  const assignRaffle = async (id: string) => {
    if (!confirm("이 추첨의 공개된 순서로 래플 경품을 배정합니다(전원 하나씩). 진행할까요?")) return;
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/admin/raffle", { method: "PUT", headers: hdr, body: JSON.stringify({ drawId: id }) });
      const d = await r.json();
      if (!r.ok) { setMsg(d.error || "배정 실패"); toast.err(d.error || "배정 실패"); return; }
      const by = Object.entries((d.byPrize ?? {}) as Record<string, number>).map(([k, v]) => `${k} ${v}`).join(" · ");
      setMsg(`경품 배정 완료 (${d.mode}) · ${d.assigned}/${d.total}명 · ${by}`); toast.ok(`경품 배정 완료 · ${d.assigned}/${d.total}명`);
    } finally { setBusy(false); }
  };
  const reveal = async (id: string) => {
    if (!confirm("공개(리빌)하면 되돌릴 수 없습니다. 진행할까요?")) return;
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/admin/draw", { method: "PUT", headers: hdr, body: JSON.stringify({ id }) });
      const d = await r.json();
      if (!r.ok) { setMsg(d.error || "공개 실패"); toast.err(d.error || "공개 실패"); return; }
      setMsg("공개되었습니다 - 결과와 시드가 /api/draw 에서 검증 가능합니다"); toast.ok("공개되었습니다 - 결과와 시드가 /api/draw 에서 검증 가능합니다");
      await load();
    } finally { setBusy(false); }
  };

  return (
    <div className="stats-grid">
      <div className="stat-cell span-12 feature">
        <div className="stat-cell-k"><span>새 추첨 · 봉인</span></div>
        <p style={{ fontSize: 13, color: "var(--ink-dim)", lineHeight: 1.7, margin: "0 0 10px" }}>
          시드를 먼저 봉인하고 커밋 해시만 공개합니다. 공개 시점에 시드를 드러내면 <code className="mono">HMAC-SHA256(seed, 참가자)</code> 오름차순으로
          결과가 정해지고 누구나 재계산할 수 있습니다. FCC(Flare 기밀컴퓨팅)가 설정돼 있으면 TEE 가 시드를 보관·공개하고 증명을 남깁니다.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
          <div>
            <label className="field-label">종류</label>
            <select className="field-select" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              <option value="PREORDER_LOTTERY">사전예약 추첨 (초과 시)</option>
              <option value="GENESIS_NUMBER">제네시스 넘버 무작위 배정</option>
              <option value="SETTLEMENT_PARAMS">정산 기준 봉인</option>
              <option value="CUSTOM">사용자 정의</option>
            </select>
          </div>
          <div>
            <label className="field-label">제목</label>
            <input className="field-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="예: 1차 사전예약 추첨" />
          </div>
          {form.kind !== "SETTLEMENT_PARAMS" && (
            <>
              <div>
                <label className="field-label">참가자</label>
                <select className="field-select" value={form.participantsFrom} onChange={(e) => setForm({ ...form, participantsFrom: e.target.value })}>
                  <option value="reservations">실제 사전예약 계정 전체</option>
                  <option value="reservations-test">리허설(/launch/test) 예약 계정</option>
                  <option value="raffle">XRPL SEOUL 래플 응모(결제 완료)</option>
                  <option value="raffle-test">래플 리허설(/event/xrpl-seoul/test) 응모</option>
                  <option value="custom">직접 입력</option>
                </select>
              </div>
              <div>
                <label className="field-label">당첨 수 (비우면 전체 순위)</label>
                <input className="field-input" value={form.winners} onChange={(e) => setForm({ ...form, winners: e.target.value })} placeholder="예: 25000" inputMode="numeric" />
              </div>
              <div>
                <label className="field-label">번호 시작값 (제네시스 넘버)</label>
                <input className="field-input" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} inputMode="numeric" />
              </div>
            </>
          )}
          <div>
            <label className="field-label">공개 예정 시각 (선택)</label>
            <input className="field-input" type="datetime-local" value={form.revealAfter} onChange={(e) => setForm({ ...form, revealAfter: e.target.value })} />
          </div>
        </div>
        {form.participantsFrom === "custom" && form.kind !== "SETTLEMENT_PARAMS" && (
          <textarea className="field-textarea" rows={3} style={{ marginTop: 10 }} placeholder="참가자 식별자를 공백·쉼표로 구분" value={form.participants} onChange={(e) => setForm({ ...form, participants: e.target.value })} />
        )}
        {form.kind === "SETTLEMENT_PARAMS" && (
          <textarea className="field-textarea" rows={4} style={{ marginTop: 10 }} placeholder='봉인할 정산 기준 JSON - 예: {"qualityWeights":{"uptime":40,"outlier":25,"correlation":20,"calibration":15},"excellentBonus":1.4}' value={form.paramsJson} onChange={(e) => setForm({ ...form, paramsJson: e.target.value })} />
        )}
        <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
          <button className={`btn-primary${busy ? " is-busy" : ""}`} disabled={busy} onClick={create} style={{ padding: "8px 14px", fontSize: 13 }}>{busy ? "…" : "봉인(커밋) 생성"}</button>
          {msg && <span style={{ fontSize: 12.5, color: msg.includes("실패") || msg.includes("오류") ? "var(--red)" : "var(--green)" }}>{msg}</span>}
        </div>
      </div>

      <div className="stat-cell span-12">
        <div className="stat-cell-k"><span>추첨 목록</span></div>
        <div className="feed-table-scroll">
          <table className="feed-table compact">
            <thead><tr>
              {([["created","생성"],["title","종류 · 제목"],["count","참가자"],["commit","커밋"],["backend","백엔드"],["status","상태"]] as [string, string][]).map(([k, label]) => (
                <SortTh key={k} k={k} sortKey={sort.sortKey} dir={sort.dir} onToggle={sort.toggle}>{label}</SortTh>
              ))}
              <th></th>
            </tr></thead>
            <tbody>
              {pager.slice.map((d) => (
                <tr key={d.id}>
                  <td className="dim">{new Date(d.createdAt).toLocaleString("ko-KR")}</td>
                  <td><b>{d.kind}</b> · {d.title}</td>
                  <td className="num">{d.participantCount}</td>
                  <td className="mono" style={{ fontSize: 11 }}>{d.commitment.slice(0, 18)}…</td>
                  <td>{d.backend}</td>
                  <td className={d.status === "REVEALED" ? "ok" : "warn"}>{d.status}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <a href={`/api/draw/${d.id}`} target="_blank" rel="noreferrer" style={{ marginRight: 8 }}>공개 링크</a>
                    {d.status === "COMMITTED"
                      ? <button className={`btn-ghost${busy ? " is-busy" : ""}`} disabled={busy} onClick={() => reveal(d.id)} style={{ padding: "4px 10px", fontSize: 12 }}>공개</button>
                      : <>
                          <button className="btn-ghost" onClick={() => setOpen(open === d.id ? null : d.id)} style={{ padding: "4px 10px", fontSize: 12, marginRight: 6 }}>{open === d.id ? "접기" : "결과"}</button>
                          <button className={`btn-ghost${busy ? " is-busy" : ""}`} disabled={busy} onClick={() => assignRaffle(d.id)} title="XRPL SEOUL 래플 - 공개된 순서대로 경품을 배정한다(전원 하나씩)" style={{ padding: "4px 10px", fontSize: 12 }}>래플 경품 배정</button>
                        </>}
                  </td>
                </tr>
              ))}
              {!draws.length && <tr><td colSpan={7} className="dim">아직 추첨이 없습니다</td></tr>}
            </tbody>
          </table>
        </div>
        <Pager p={pager} />
        {open && draws.find((d) => d.id === open)?.result && (
          <pre className="mono" style={{ fontSize: 11.5, lineHeight: 1.6, marginTop: 10, padding: 12, background: "var(--bg-2)", border: "1px solid var(--line-2)", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: 360 }}>
            {JSON.stringify({ seed: draws.find((d) => d.id === open)!.seed, params: draws.find((d) => d.id === open)!.params, result: draws.find((d) => d.id === open)!.result, attestation: draws.find((d) => d.id === open)!.attestation }, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
