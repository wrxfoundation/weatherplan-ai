import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import sharp from "sharp";
import { findTicket, ticketUrl } from "@/lib/raffle";
import { prizeLabel } from "@/lib/raffle-prizes";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * 래플 NFT 카드 이미지 (세로 600×1000 PNG) - 번호 + QR. NFT 의 image 가 이 주소를 가리킨다.
 * 글자는 영문만 쓴다(서버 렌더러에 한글 글꼴이 없다). QR 내용은 공개 티켓 주소(/event/xrpl-seoul/ticket/<code>).
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const entry = await findTicket(code.replace(/\.png$/i, ""));
  if (!entry) return new NextResponse("not found", { status: 404 });
  const origin = new URL(req.url).origin;
  const no = String(entry.entryNo).padStart(4, "0");
  const test = entry.event.endsWith("-test");
  /* 추첨 뒤에는 배정된 경품을 카드에 적는다(영문 - 서버 렌더러에 한글 글꼴이 없다) */
  const prize = entry.prize ? prizeLabel(entry.prize, "en").toUpperCase() : null;
  const qr = await QRCode.toDataURL(ticketUrl(origin, entry.ticketCode!), { margin: 1, width: 360, errorCorrectionLevel: "M", color: { dark: "#1b1b48", light: "#ffffff" } });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="600" height="1000" viewBox="0 0 600 1000">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4d4dce"/><stop offset="0.55" stop-color="#1b1b48"/><stop offset="1" stop-color="#12122f"/></linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0.14"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
  </defs>
  <rect width="600" height="1000" rx="36" fill="url(#bg)"/>
  <rect width="600" height="1000" rx="36" fill="url(#sheen)"/>
  <circle cx="520" cy="110" r="150" fill="#ffffff" fill-opacity="0.05"/>
  <circle cx="80" cy="900" r="120" fill="#ffffff" fill-opacity="0.05"/>
  <text x="48" y="78" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#ffffff" letter-spacing="2">wellbian  ×  XRP LEDGER</text>
  <text x="48" y="136" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="800" fill="#ffffff">XRP SEOUL 2026</text>
  <text x="48" y="172" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#c8c8f0" letter-spacing="4">RAFFLE TICKET${test ? "  ·  TEST" : ""}</text>
  <text x="48" y="300" font-family="Arial, Helvetica, sans-serif" font-size="108" font-weight="800" fill="#ffffff">#${no}</text>
  <text x="48" y="346" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#c8c8f0">2026.10.03  ·  SEOUL  ·  5 XRP ENTRY</text>
${prize ? `  <text x="48" y="382" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="700" fill="#ffd166" letter-spacing="1">PRIZE  ·  ${prize}</text>\n` : ""}  <rect x="100" y="400" width="400" height="400" rx="24" fill="#ffffff"/>
  <image x="120" y="420" width="360" height="360" xlink:href="${qr}"/>
  <text x="300" y="850" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" fill="#ffffff">Present this QR at the venue to collect your prize</text>
  <text x="300" y="882" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#f5b8b8">Valid once. Do not share or expose this QR.</text>
  <text x="300" y="906" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="14" fill="#c8c8f0">Prizes collected by others will not be compensated.</text>
  <text x="300" y="960" text-anchor="middle" font-family="Courier New, monospace" font-size="16" fill="#9a9ad0">${entry.ticketCode}</text>
</svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new NextResponse(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
