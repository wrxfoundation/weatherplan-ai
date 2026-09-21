"use client";
/* 래플 NFT 카드 + QR 관리 경고 - 페이지(내 응모)와 결제창(완료 화면)이 같이 쓴다 (2026-09-21 분리). */
import type { Lang, Msg } from "@/lib/launch/i18n";
import { prizeLabel } from "@/lib/raffle-prizes";
import type { RaffleMine } from "./types";

type T = <V>(m: Msg<V>) => V;

/* QR 관리 경고 - 카드가 보이는 곳마다 반드시 붙인다 (2026-09-16 지시: 공유·노출로 인한 피해는 보상하지 않음) */
export function QrWarning({ t }: { t: T }) {
  return (
    <div className="note warn" style={{ fontSize: 13.5, lineHeight: 1.6, border: "1px solid #f2c9c9", borderLeft: "3px solid #c0392b", borderRadius: 12, background: "#fdf3f2", color: "#8a3535", padding: "12px 16px" }}>
      {t({
        ko: <><b>QR 코드 관리 안내</b> QR 코드는 본인 확인 및 경품 수령에 사용되며 1회만 유효합니다. QR 코드를 타인과 공유하거나 외부에 노출하여 발생한 피해(타인의 선수령 등)는 보상하지 않으니, 캡처·전달 없이 안전하게 보관해 주시기 바랍니다.</>,
        en: <><b>QR code notice</b> The QR code is used for identity verification and prize collection and is valid once only. Losses caused by sharing or exposing the QR code (e.g. collection by another person) will not be compensated. Please do not screenshot or forward it.</>,
        ja: <><b>QRコード管理のご案内</b> QRコードは本人確認と賞品受取に使用され、1回のみ有効です。QRコードの共有・外部への露出により生じた被害（第三者の先受取など）は補償いたしませんので、キャプチャ・転送せず安全に保管してください。</>,
        zh: <><b>二维码管理须知</b> 二维码用于本人核验及奖品领取，仅可使用一次。因分享或泄露二维码造成的损失（如被他人先行领取）不予赔偿，请勿截图或转发，妥善保管。</>,
        es: <><b>Aviso sobre el código QR</b> El código QR se usa para verificar la identidad y recoger el premio, y es válido una sola vez. No se compensarán los perjuicios derivados de compartirlo o exponerlo (por ejemplo, que otra persona lo cobre). No lo capture ni lo reenvíe.</>,
      })}
    </div>
  );
}

export function TicketCard({ mine, t, lang }: { mine: RaffleMine; t: T; lang: Lang }) {
  if (!mine.ticketCode) return null;
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/api/raffle/card/${mine.ticketCode}`} alt={`Raffle ticket #${String(mine.entryNo ?? 0).padStart(4, "0")}`} style={{ width: 200, borderRadius: 14, boxShadow: "0 10px 30px rgba(27,27,72,.28)" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 220 }}>
        <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--ink-dim, var(--ink-3))" }}>
          {t({ ko: "래플 NFT 카드입니다. 행사 당일(10월 3일) 행사장에서 QR 코드 확인 후 경품이 지급됩니다.", en: "This is your raffle NFT card. Prizes are handed out at the venue on 3 October after the QR code is verified.", ja: "ラッフルNFTカードです。イベント当日（10月3日）に会場でQRコードを確認後、賞品をお渡しします。", zh: "这是您的抽奖 NFT 卡。活动当天（10 月 3 日）在会场核验二维码后发放奖品。", es: "Esta es su tarjeta NFT del sorteo. Los premios se entregan en el recinto el 3 de octubre tras verificar el código QR." })}
        </div>
        {mine.prize && <div style={{ fontSize: 15 }}>{t({ ko: "당첨 경품", en: "Prize", ja: "当選賞品", zh: "中奖奖品", es: "Premio" })}: <b>{prizeLabel(mine.prize, lang)}</b></div>}
        {mine.redeemedAt && <div style={{ fontSize: 14, color: "#b42318", fontWeight: 700 }}>{t({ ko: "수령 완료", en: "Collected", ja: "受取済み", zh: "已领取", es: "Recogido" })} · {new Date(mine.redeemedAt).toLocaleString()}</div>}
        <QrWarning t={t} />
      </div>
    </div>
  );
}
