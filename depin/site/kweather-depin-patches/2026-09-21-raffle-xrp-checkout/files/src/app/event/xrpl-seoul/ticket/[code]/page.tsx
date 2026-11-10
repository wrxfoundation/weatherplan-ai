import "@/app/wb-page.css";
import { findTicket, loadRaffleConfig, modeOfEvent } from "@/lib/raffle";
import { prizeLabel } from "@/lib/raffle-prizes";

export const dynamic = "force-dynamic";
export const metadata = { title: "XRP SEOUL 2026 래플 티켓 확인 - Wellbian", robots: { index: false, follow: false } };

/* 래플 NFT 카드의 QR 이 가리키는 공개 확인 페이지. 번호·유효 여부·경품·수령 여부만 보여 주고 지갑은 드러내지 않는다.
   수령 처리는 여기서 할 수 없다 - 행사장 스태프 스캐너(/admin/raffle-check)만 한다. */
export default async function TicketPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const entry = await findTicket(code);
  const cfg = entry ? await loadRaffleConfig(modeOfEvent(entry.event)) : null;
  const no = entry?.entryNo != null ? `#${String(entry.entryNo).padStart(4, "0")}` : "";
  const drawDone = !!entry?.prize;
  return (
    <div className="wb-page full-bleed">
      <section className="sec-pad"><div className="wrap" style={{ maxWidth: 640 }}>
        <div className="section-header">
          <h1 style={{ fontSize: 26 }}>XRP SEOUL 2026 래플 티켓</h1>
          <div className="section-coord"><div>{entry ? (entry.event.endsWith("-test") ? "REHEARSAL" : "TICKET CHECK") : "INVALID"}</div></div>
        </div>
        {!entry ? (
          <div className="panel"><p style={{ margin: 0, color: "var(--red, #c0392b)", fontWeight: 700 }}>유효하지 않은 티켓입니다.</p><p className="dim" style={{ margin: "8px 0 0", fontSize: 14 }}>코드가 올바르지 않거나 정식 발급된 QR 코드가 아닙니다.</p></div>
        ) : (
          <>
            <div className="panel" style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/raffle/card/${entry.ticketCode}`} alt={`Raffle ticket ${no}`} style={{ width: 180, borderRadius: 12, boxShadow: "0 8px 24px rgba(27,27,72,.25)" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 220 }}>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{no}</div>
                <div><span className={`badge ${entry.status === "PAID" ? "green" : ""}`}>{entry.status === "PAID" ? "유효한 티켓" : "결제 확인 전"}</span></div>
                <div style={{ fontSize: 15 }}>경품 <b>{drawDone ? entry.prize : "추첨 전"}</b></div>
                <div style={{ fontSize: 15 }}>수령 <b style={{ color: entry.redeemedAt ? "var(--red, #c0392b)" : "var(--green, #16a34a)" }}>{entry.redeemedAt ? `완료 (${entry.redeemedAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })})` : "미수령"}</b></div>
                <div className="dim" style={{ fontSize: 13 }}>행사 {cfg ? new Date(cfg.eventAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }) : "2026. 10. 3."} · 행사장에서 QR 코드 확인 후 경품이 지급됩니다</div>
              </div>
            </div>
            {/* 해외 참가자용 영문 요약 - QR 을 자기 폰으로 찍으면 이 페이지가 뜬다(카드 이미지는 영문뿐) */}
            <div className="panel" style={{ marginTop: 12, fontSize: 14, lineHeight: 1.65, color: "var(--ink-3)" }}>
              <b>Ticket {no}</b> · {entry.status === "PAID" ? "Valid" : "Payment not confirmed"} · Prize: <b>{drawDone && entry.prize ? prizeLabel(entry.prize, "en") : "not drawn yet"}</b> · {entry.redeemedAt ? "Collected" : "Not collected yet"}.
              {" "}Prizes are handed out at the XRP SEOUL 2026 venue on 3 October after QR verification. The QR code is valid once - do not share or expose it; prizes collected by others will not be compensated.
            </div>
            <div className="note warn" style={{ marginTop: 12 }}>
              <b>QR 코드 관리 안내</b> QR 코드는 본인 확인 및 경품 수령에 사용되며 1회만 유효합니다. QR 코드를 타인과 공유하거나 외부에 노출하여 발생한 피해(타인의 선수령 등)는 보상하지 않으니, 캡처·전달 없이 안전하게 보관해 주시기 바랍니다.
            </div>
          </>
        )}
      </div></section>
    </div>
  );
}
