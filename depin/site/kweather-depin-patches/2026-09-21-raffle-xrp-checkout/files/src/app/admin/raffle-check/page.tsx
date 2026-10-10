"use client";
/* 행사장 QR 스캐너 (2026-09-16). 래플 NFT 카드의 QR 을 읽어 티켓을 확인하고 한 번만 수령 처리한다.
   카메라(BarcodeDetector 지원 브라우저)로 읽거나, 스캐너 건·수동으로 코드를 입력한다. 관리자 시크릿은 이 브라우저에만 저장. */
import { useCallback, useEffect, useRef, useState } from "react";
import "@/app/wb-page.css";

type Ticket = { entryNo: number | null; ticketCode: string | null; status: string; prize: string | null; redeemedAt: string | null; redeemedBy: string | null; event: string; wallet: string };
const codeOf = (raw: string) => { const m = raw.trim().toUpperCase().match(/WB[RT]-\d{4}-[0-9A-F]{10}/); return m ? m[0] : ""; };

export default function RaffleCheckPage() {
  const [secret, setSecret] = useState("");
  const [staff, setStaff] = useState("");
  const [input, setInput] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [msg, setMsg] = useState<{ tone: "ok" | "warn" | "bad"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [cam, setCam] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastRef = useRef("");

  useEffect(() => { try { setSecret(sessionStorage.getItem("kw_admin_secret") ?? ""); setStaff(localStorage.getItem("wb_staff") ?? ""); } catch { /* ignore */ } }, []);
  useEffect(() => { try { sessionStorage.setItem("kw_admin_secret", secret); } catch { /* ignore */ } }, [secret]);
  useEffect(() => { try { localStorage.setItem("wb_staff", staff); } catch { /* ignore */ } }, [staff]);
  const H = useCallback(() => ({ "content-type": "application/json", "x-admin-secret": secret }), [secret]);

  const lookup = useCallback(async (raw: string) => {
    const code = codeOf(raw);
    if (!code) { setMsg({ tone: "bad", text: "티켓 코드 형식이 아닙니다 (WBR-0001-XXXXXXXXXX)" }); setTicket(null); return; }
    setBusy(true); setMsg(null);
    try {
      const r = await fetch(`/api/admin/raffle?code=${encodeURIComponent(code)}`, { headers: H(), cache: "no-store" });
      const d = await r.json();
      if (!r.ok) { setTicket(null); setMsg({ tone: "bad", text: d.error || "조회 실패" }); return; }
      setTicket(d.ticket);
      setMsg(d.ticket.redeemedAt ? { tone: "warn", text: `이미 수령 처리됨 · ${new Date(d.ticket.redeemedAt).toLocaleString("ko-KR")} · ${d.ticket.redeemedBy ?? ""}` }
        : d.ticket.status !== "PAID" ? { tone: "bad", text: "결제가 확정되지 않은 응모" }
        : !d.ticket.prize ? { tone: "warn", text: "유효한 티켓 · 아직 경품이 배정되지 않았습니다(추첨 전)" }
        : { tone: "ok", text: `유효한 티켓 · 경품: ${d.ticket.prize}` });
    } finally { setBusy(false); }
  }, [H]);

  const redeem = useCallback(async () => {
    if (!ticket?.ticketCode) return;
    setBusy(true);
    try {
      const r = await fetch("/api/admin/raffle", { method: "POST", headers: H(), body: JSON.stringify({ code: ticket.ticketCode, staff: staff || "scanner" }) });
      const d = await r.json();
      if (!r.ok) { setMsg({ tone: "bad", text: d.error || "처리 실패" }); if (d.ticket) setTicket(d.ticket); return; }
      setTicket(d.ticket);
      setMsg({ tone: "ok", text: `수령 처리 완료 · #${String(d.ticket.entryNo).padStart(4, "0")} · ${d.ticket.prize ?? "경품 미배정"}` });
    } finally { setBusy(false); lastRef.current = ""; /* 같은 QR 을 다시 읽으면 "이미 수령 처리됨" 이 뜨도록 연속 읽기 잠금을 푼다 */ }
  }, [H, staff, ticket]);

  /* 카메라: BarcodeDetector 가 있는 브라우저(Chrome/Android 등)에서만. 같은 코드는 연속으로 다시 읽지 않는다. */
  useEffect(() => {
    if (!cam) { streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; return; }
    let raf = 0; let stop = false;
    (async () => {
      const Det = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
      if (!Det) { setMsg({ tone: "warn", text: "이 브라우저는 카메라 인식을 지원하지 않습니다. 코드를 직접 입력하거나 스캐너 건을 쓰세요." }); setCam(false); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        const det = new Det({ formats: ["qr_code"] });
        const tick = async () => {
          if (stop || !videoRef.current) return;
          try {
            const found = await det.detect(videoRef.current);
            const v = found[0]?.rawValue;
            if (v && codeOf(v) && codeOf(v) !== lastRef.current) { lastRef.current = codeOf(v); setInput(codeOf(v)); lookup(v); }
          } catch { /* 프레임 건너뜀 */ }
          raf = window.setTimeout(tick, 400) as unknown as number;
        };
        tick();
      } catch (e) { setMsg({ tone: "bad", text: `카메라를 열 수 없습니다: ${(e as Error).message}` }); setCam(false); }
    })();
    return () => { stop = true; window.clearTimeout(raf); streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; };
  }, [cam, lookup]);

  const tone = msg?.tone === "ok" ? "note ok" : msg?.tone === "warn" ? "note warn" : "note";
  return (
    <div className="wb-page full-bleed">
      <section className="sec-pad"><div className="wrap" style={{ maxWidth: 640 }}>
        <div className="section-header">
          <h1 style={{ fontSize: 26 }}>래플 QR 확인 · 현장 수령</h1>
          <div className="section-coord"><div>XRP SEOUL 2026 · STAFF SCANNER</div></div>
        </div>
        <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input className="field-input" type="password" placeholder="관리자 시크릿" value={secret} onChange={(e) => setSecret(e.target.value)} />
          <input className="field-input" placeholder="스태프 이름(처리자 표시)" value={staff} onChange={(e) => setStaff(e.target.value)} />
          <div style={{ display: "flex", gap: 8 }}>
            <input className="field-input" placeholder="WBR-0001-XXXXXXXXXX 또는 QR 주소 붙여넣기" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && secret) lookup(input); }} style={{ flex: 1, fontFamily: "monospace" }} autoFocus />
            <button className="btn-primary" disabled={busy || !secret} onClick={() => lookup(input)}>조회</button>
          </div>
          <button className="btn-ghost" onClick={() => setCam((c) => !c)} style={{ alignSelf: "flex-start" }}>{cam ? "카메라 끄기" : "카메라로 QR 읽기"}</button>
          {cam && <video ref={videoRef} muted playsInline style={{ width: "100%", borderRadius: 12, background: "#000" }} />}
        </div>
        {msg && <div className={tone} style={{ marginTop: 12, fontWeight: 700, ...(msg.tone === "bad" ? { color: "var(--red, #c0392b)" } : {}) }}>{msg.text}</div>}
        {ticket && (
          <div className="panel" style={{ marginTop: 12, display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {ticket.ticketCode && <img src={`/api/raffle/card/${ticket.ticketCode}`} alt="" style={{ width: 120, borderRadius: 10 }} />}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 26, fontWeight: 800 }}>#{String(ticket.entryNo ?? 0).padStart(4, "0")} {ticket.event.endsWith("-test") && <span className="badge">리허설</span>}</div>
              <div>경품: <b>{ticket.prize ?? "미배정"}</b></div>
              <div className="mono dim" style={{ fontSize: 12 }}>{ticket.wallet}</div>
              <div style={{ marginTop: 6 }}>
                {ticket.redeemedAt
                  ? <span className="badge" style={{ background: "#fde2e2", color: "#b42318" }}>수령 완료 · {new Date(ticket.redeemedAt).toLocaleString("ko-KR")}</span>
                  : <button className="btn-primary" disabled={busy || ticket.status !== "PAID"} onClick={redeem} style={{ fontSize: 17, padding: "12px 18px" }}>수령 처리 (한 번만)</button>}
              </div>
            </div>
          </div>
        )}
        <p className="dim" style={{ fontSize: 13, marginTop: 14 }}>수령 처리는 되돌릴 수 없습니다. 같은 QR 을 다시 읽으면 &ldquo;이미 수령 처리됨&rdquo;과 시각이 뜹니다. 관리자 콘솔 → 래플 목록에서 전체 현황을 볼 수 있습니다.</p>
      </div></section>
    </div>
  );
}
