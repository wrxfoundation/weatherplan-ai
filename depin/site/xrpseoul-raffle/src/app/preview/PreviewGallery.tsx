"use client";
import "@/app/launch/store.css";
import { RaffleCheckoutCard, type CheckoutPreview } from "@/components/raffle/RaffleCheckoutModal";
import { WalletProvider } from "@/lib/wallet/WalletContext";
import { RAFFLE_CONFIG } from "@/lib/raffle-config";
import type { RaffleMine, RaffleStateView } from "@/components/raffle/types";

const ST: RaffleStateView = { mode: "prod", phase: "OPEN", config: RAFFLE_CONFIG, count: 128, holds: 6, remaining: 366, destination: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh", mine: null, draw: null };
const ENTRY = { destTag: 1839266153, status: "PENDING" };
const PAID: RaffleMine = { status: "PAID", destTag: 1839266153, entryNo: 129, txHash: "A".repeat(64), amountXrp: 5, ticketCode: "WBR-0129-3F9A1C77B2", prize: null, redeemedAt: null, holdUntil: null, holdLive: false, pass: { state: "MINT_QUEUED", offerIndex: null, nftTokenId: null } };
const OFFER: RaffleMine = { ...PAID, pass: { state: "OFFER_CREATED", offerIndex: "B".repeat(64), nftTokenId: null } };
const HELD: RaffleMine = { ...PAID, pass: { state: "CLAIMED", offerIndex: null, nftTokenId: "000800001D2E9A5B7C3F0A1B2C3D4E5F60718293A4B5C6D7E8F90A1B2C3D4E5F" } };
const BAL = { address: "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH", xrp: 8.42, activated: true, reserve: 1 };
const IN = (m: number) => new Date(Date.now() + m * 60_000).toISOString();

const SCENES: { title: string; preview: CheckoutPreview; st?: Partial<RaffleStateView> }[] = [
  { title: "① 응모 내용", preview: { step: 1 } },
  { title: "② 동의 · 당첨 안내 이메일", preview: { step: 2, terms: true, email: "name@example.com" } },
  { title: "③ XRP 결제 — 지갑 미활성(입금 안내)", preview: { step: 3, entry: ENTRY, bal: { address: BAL.address, xrp: 0, activated: false, reserve: 0 }, holdUntil: IN(27) } },
  { title: "③ XRP 결제 — 잔액 충분 · 자리 확보 중", preview: { step: 3, entry: ENTRY, bal: BAL, holdUntil: IN(27) } },
  { title: "③ 남은 자리 경고", preview: { step: 3, entry: ENTRY, bal: BAL, holdUntil: IN(27) }, st: { count: 493, remaining: 7 } },
  { title: "④ NFT 발행 중", preview: { step: 4, mine: PAID, entry: { destTag: 1839266153, status: "PAID" } } },
  { title: "④ NFT 수락", preview: { step: 4, mine: OFFER, entry: { destTag: 1839266153, status: "PAID" } } },
  { title: "④ 완료 · 티켓", preview: { step: 4, mine: HELD, entry: { destTag: 1839266153, status: "PAID" } } },
  { title: "차단 — 정원 마감(결제 전)", preview: { step: 3, entry: ENTRY }, st: { phase: "SOLD_OUT", count: 500, remaining: 0 } },
  { title: "차단 — 예약 만료 + 정원 마감(이미 보낸 입금 해시 확인)", preview: { step: 3, entry: ENTRY, mine: { ...PAID, status: "PENDING", entryNo: null, ticketCode: null, pass: null, holdUntil: IN(-1), holdLive: false }, holdUntil: IN(-1) }, st: { phase: "SOLD_OUT", count: 488, holds: 12, remaining: 0 } },
];

export default function PreviewGallery() {
  return (
    <WalletProvider fake>
      <style>{`
        .pv-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(560px, 100%), 1fr)); gap: 28px 32px; padding: 28px clamp(16px, 4vw, 40px) 60px; background: #ecedf5; }
        .pv-grid figure { margin: 0; } .pv-grid figcaption { font: 800 14px/1.4 "Pretendard Variable", Pretendard, sans-serif; color: #1b1b48; margin: 0 0 10px; letter-spacing: .04em; }
        .pv-grid .wb-store .overlay { position: static; background: none; padding: 0; animation: none; display: block; z-index: auto; }
        .pv-grid .wb-store .modal-card { animation: none; max-height: none; overflow: visible; width: 100%; max-width: 560px; }
      `}</style>
      <div className="pv-grid">
        {SCENES.map((s) => (
          <figure key={s.title}>
            <figcaption>{s.title}</figcaption>
            <div className="wb-store" style={{ background: "transparent" }}>
              <RaffleCheckoutCard mode="prod" st={{ ...ST, ...(s.st ?? {}) }} onClose={() => {}} onChange={() => {}} preview={s.preview} />
            </div>
          </figure>
        ))}
      </div>
    </WalletProvider>
  );
}
