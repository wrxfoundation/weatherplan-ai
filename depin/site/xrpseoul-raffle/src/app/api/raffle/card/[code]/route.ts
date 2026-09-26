import { NextRequest, NextResponse } from "next/server";

/** 미리보기용 래플 NFT 카드(SVG) - 정본은 번호·QR 을 넣은 PNG 를 만든다. 여기서는 모양만 보여 준다. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const m = code.toUpperCase().match(/WB[RT]-(\d{4})/);
  const no = m ? m[1] : "0000";
  const cells: string[] = [];
  let seed = 7;
  for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; if ((seed >> 16) & 1) cells.push(`<rect x="${120 + x * 17}" y="${420 + y * 17}" width="16" height="16" fill="#1b1b48"/>`); }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="1000" viewBox="0 0 600 1000">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4d4dce"/><stop offset="0.55" stop-color="#1b1b48"/><stop offset="1" stop-color="#12122f"/></linearGradient></defs>
  <rect width="600" height="1000" rx="36" fill="url(#bg)"/>
  <text x="48" y="78" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#ffffff" letter-spacing="2">wellbian  ×  XRP LEDGER</text>
  <text x="48" y="136" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="800" fill="#ffffff">XRP SEOUL 2026</text>
  <text x="48" y="172" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#c8c8f0" letter-spacing="4">RAFFLE TICKET  ·  PREVIEW</text>
  <text x="48" y="300" font-family="Arial, Helvetica, sans-serif" font-size="108" font-weight="800" fill="#ffffff">#${no}</text>
  <text x="48" y="346" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#c8c8f0">2026.10.03  ·  SEOUL  ·  5 XRP ENTRY</text>
  <rect x="100" y="400" width="400" height="400" rx="24" fill="#ffffff"/>${cells.join("")}
  <text x="300" y="850" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" fill="#ffffff">Present this QR at the venue to collect your prize</text>
  <text x="300" y="882" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#f5b8b8">Valid once. Do not share or expose this QR.</text>
  <text x="300" y="960" text-anchor="middle" font-family="Courier New, monospace" font-size="16" fill="#9a9ad0">${code.toUpperCase().replace(/[^A-Z0-9-]/g, "")}</text>
</svg>`;
  return new NextResponse(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" } });
}
