import { convertStringToHex } from "xrpl";
import type { AccountNFToken } from "xrpl";
import { createHmac } from "node:crypto";
import { prisma } from "@/lib/db";
import { enqueueTx, drainOutbox, hotWalletAddress } from "@/lib/xrpl/outbox";
import { xrplRead } from "@/lib/xrpl/client";
import { ISSUER_ADDRESS } from "@/lib/xrpl/config";
import { newDestTag, verifyXrpPayment } from "@/lib/launch/xrpl-pay";

/**
 * XRPL SEOUL 2026 래플 (2026-09-16 지시).
 *
 * 흐름: 로그인 → 5 XRP 결제(XRP 만, 핫월렛 + 응모별 DestinationTag) → 결제 확정 시 래플 번호 + 티켓 코드(QR) 부여 +
 *       래플 NFT(GenesisPass kind RAFFLE_XRPSEOUL, taxon 1004, 세로 카드 이미지에 번호·QR) 발행 큐잉 → 지갑 수락
 *       → 응모 마감(시작 후 7일 또는 선착순 500명) → 24시간 안에 블라인드 추첨 공개(전원 당첨, 무엇이 당첨될지만 추첨)
 *       → 10/3 행사장에서 우리 스캐너로 QR 확인 후 지급(한 번 쓴 QR 은 다시 쓸 수 없다).
 * 계정당 1회. 미션 없음.
 *
 * 리허설(mode="test")은 /launch/test 와 같은 격리 원칙: event·kind·taxon·설정 키가 실제와 절대 겹치지 않는다.
 * 결제는 실제와 같은 5 XRP 다(리허설 입금은 핫월렛에 남으므로 끝나면 돌려준다).
 */
export type RaffleMode = "prod" | "test";
export const raffleEvent = (m: RaffleMode) => (m === "test" ? "xrpseoul-2026-test" : "xrpseoul-2026");
export const raffleKind = (m: RaffleMode) => (m === "test" ? "RAFFLE_XRPSEOUL_TEST" : "RAFFLE_XRPSEOUL");
export const raffleTaxon = (m: RaffleMode) => (m === "test" ? 900014 : 1004);
const configKey = (m: RaffleMode) => (m === "test" ? "raffle_xrpseoul_test" : "raffle_xrpseoul");
export const modeOfEvent = (event: string): RaffleMode => (event.endsWith("-test") ? "test" : "prod");

export interface RafflePrize { name: string; qty: number; note?: string }
export interface RaffleConfig {
  open: string;       // 응모 시작 (ISO)
  close: string;      // 응모 마감 - 시작 후 7일
  drawAt: string;     // 추첨 공개 - 마감 후 24시간 이내
  eventAt: string;    // 행사일 - 상품은 이날 행사장에서 QR 확인 후 지급
  priceXrp: number;   // 응모 금액 (XRP)
  maxEntries: number; // 선착순 정원 - 경품 수 합계와 같아 전원이 하나는 받는다
  prizes: RafflePrize[];
}

/* 2026-09-16 확정 → 2026-09-21 공지문 확정치로 갱신(시작 9/22 18:00 · 마감 9/27 18:00 · 발표 마감 후 24시간 이내 ·
   경품 290/10/50/150 = 500 · 수령은 행사 당일 wellbian 플래티넘 부스). AdminConfig raffle_xrpseoul 로 덮어쓴다. */
const DEFAULT: RaffleConfig = {
  open: "2026-09-22T09:00:00Z",   // 09-22(화) 18:00 KST
  close: "2026-09-27T09:00:00Z",  // 09-27(일) 18:00 KST (선착순 500명이 차면 조기 종료)
  drawAt: "2026-09-28T09:00:00Z", // 09-28(월) 18:00 KST (마감 후 24시간 이내)
  eventAt: "2026-10-03T00:00:00Z",
  priceXrp: 5,
  maxEntries: 500,
  prizes: [
    { name: "XRP SEOUL 2026 초대권", qty: 290, note: "10월 3일 서울 · 행사장 입장권" },
    { name: "Weather Data Token Generator™", qty: 10, note: "제네시스 한정판, 실물 날씨데이터 토큰 생성기 1대 · 행사 당일 'wellbian 플래티넘 부스' 현장수령" },
    { name: "wellbian 우산", qty: 50, note: "행사 당일 'wellbian 플래티넘 부스' 현장수령" },
    { name: "wellbian 에코백", qty: 150, note: "행사 당일 'wellbian 플래티넘 부스' 현장수령" },
  ],
};
const DEFAULT_TEST: RaffleConfig = { ...DEFAULT, open: "2026-09-16T00:00:00Z" };   // 리허설은 지금 열려 있고 나머지는 실제와 같다

export async function loadRaffleConfig(mode: RaffleMode = "prod"): Promise<RaffleConfig> {
  const row = await prisma.adminConfig.findUnique({ where: { key: configKey(mode) } }).catch(() => null);
  const base = mode === "test" ? DEFAULT_TEST : DEFAULT;
  return { ...base, ...((row?.value as Partial<RaffleConfig> | null) ?? {}) };
}

export type RafflePhase = "BEFORE" | "OPEN" | "SOLD_OUT" | "CLOSED";
/** 시간 + 정원. 정원(결제 확정 수)이 차면 마감 시각 전이라도 SOLD_OUT. */
export function rafflePhaseAt(c: RaffleConfig, paidCount: number, now = new Date()): RafflePhase {
  const t = now.getTime();
  if (t < Date.parse(c.open)) return "BEFORE";
  if (t >= Date.parse(c.close)) return "CLOSED";
  if (paidCount >= c.maxEntries) return "SOLD_OUT";
  return "OPEN";
}

/* ── 티켓 코드 (QR 내용) ──
   WBR-0001-XXXXXXXXXX : 번호 + HMAC(SESSION_SECRET) 10자. 번호만 알아서는 만들 수 없고, 코드만 보고 응모 행을 찾는다.
   QR 이 새어 나가면 남이 먼저 수령할 수 있으므로 화면마다 관리 경고를 붙인다(보상 없음). */
export function ticketCodeFor(event: string, entryId: string, entryNo: number): string {
  const mac = createHmac("sha256", process.env.SESSION_SECRET ?? "").update(`raffle|${event}|${entryId}|${entryNo}`).digest("hex").slice(0, 10).toUpperCase();
  return `${event.endsWith("-test") ? "WBT" : "WBR"}-${String(entryNo).padStart(4, "0")}-${mac}`;
}
export const ticketUrl = (origin: string, code: string) => `${origin}/event/xrpl-seoul/ticket/${code}`;

type EntryRow = { status: string; destTag: number; entryNo: number | null; txHash: string | null; amountXrp: unknown; ticketCode: string | null; prize: string | null; redeemedAt: Date | null };
type PassRow = { state: string; offerIndex: string | null; nftTokenId: string | null };
const mineView = (entry: EntryRow | null, pass: PassRow | null) =>
  entry ? {
    status: entry.status, destTag: entry.destTag, entryNo: entry.entryNo, txHash: entry.txHash, amountXrp: Number(entry.amountXrp),
    ticketCode: entry.ticketCode, prize: entry.prize, redeemedAt: entry.redeemedAt ? entry.redeemedAt.toISOString() : null,
    pass: pass ? { state: pass.state, offerIndex: pass.offerIndex, nftTokenId: pass.nftTokenId } : null,
  } : null;

/** 화면이 한 번에 읽는 상태 - 설정·페이즈·응모 수·(로그인 시) 내 응모 */
export async function raffleState(wallet: string | null, mode: RaffleMode = "prod") {
  const config = await loadRaffleConfig(mode);
  const event = raffleEvent(mode);
  const count = await prisma.raffleEntry.count({ where: { event, status: "PAID" } });
  const phase = rafflePhaseAt(config, count);
  let mine = null;
  if (wallet) {
    const entry = await prisma.raffleEntry.findUnique({ where: { event_wallet: { event, wallet } } });
    const pass = await prisma.genesisPass.findUnique({ where: { wallet_kind: { wallet, kind: raffleKind(mode) } } });
    mine = mineView(entry, pass);
  }
  return { mode, phase, config, count, remaining: Math.max(0, config.maxEntries - count), destination: hotWalletAddress(), mine };
}

/** 응모 시작 - 결제를 기다리는 행을 만든다(태그 발급). 이미 있으면 그 행을 돌려준다. */
export async function createRaffleEntry(wallet: string, mode: RaffleMode = "prod") {
  const config = await loadRaffleConfig(mode);
  const event = raffleEvent(mode);
  const existing = await prisma.raffleEntry.findUnique({ where: { event_wallet: { event, wallet } } });
  if (existing) return { ok: true as const, entry: existing, config };
  const paid = await prisma.raffleEntry.count({ where: { event, status: "PAID" } });
  const phase = rafflePhaseAt(config, paid);
  if (phase !== "OPEN") {
    return { ok: false as const, error: phase === "BEFORE" ? "아직 응모가 열리지 않았습니다." : phase === "SOLD_OUT" ? "선착순 정원이 모두 찼습니다." : "응모가 마감되었습니다." };
  }
  try {
    const entry = await prisma.raffleEntry.create({
      data: { event, wallet, destTag: newDestTag(), amountXrp: config.priceXrp, status: "PENDING" },
    });
    return { ok: true as const, entry, config };
  } catch (e) {
    // 같은 지갑이 동시에 두 번 눌렀거나(React 개발 모드의 이중 effect 포함) 태그가 겹친 경우 - 이미 생긴 행을 돌려준다
    const code = (e as { code?: string }).code;
    if (code === "P2002") {
      const again = await prisma.raffleEntry.findUnique({ where: { event_wallet: { event, wallet } } });
      if (again) return { ok: true as const, entry: again, config };
    }
    throw e;
  }
}

/** 결제 확정 - 해시를 검증해 PAID 로 만들고 래플 번호·티켓 코드를 매기고 NFT 발행을 큐에 넣는다. 같은 해시 재호출은 멱등. */
export async function verifyRaffleEntry(wallet: string, txHash: string, origin: string, mode: RaffleMode = "prod") {
  const event = raffleEvent(mode);
  const entry = await prisma.raffleEntry.findUnique({ where: { event_wallet: { event, wallet } } });
  if (!entry) return { ok: false as const, error: "응모 내역이 없습니다. 먼저 응모를 시작해 주세요." };
  if (entry.status === "PAID") return { ok: true as const, entry, already: true };
  const hash = txHash.toUpperCase();
  const dup = await prisma.raffleEntry.findUnique({ where: { txHash: hash } });
  if (dup && dup.id !== entry.id) return { ok: false as const, error: "이미 다른 응모에 사용된 트랜잭션입니다." };
  const v = await verifyXrpPayment(hash, Number(entry.amountXrp), entry.destTag);
  if (!v.ok) return { ok: false as const, error: v.error, pending: "pending" in v && v.pending };

  const kind = raffleKind(mode);
  const config = await loadRaffleConfig(mode);
  const paid = await prisma.$transaction(async (tx) => {
    const last = await tx.raffleEntry.aggregate({ where: { event, status: "PAID" }, _max: { entryNo: true } });
    const entryNo = (last._max.entryNo ?? 0) + 1;
    /* 선착순 정원: 결제 확정 순서로 센다. 정원을 넘긴 입금은 확정하지 않고 알린다(운영자가 환불) - 응모 시작 때 이미 막으므로 드물다 */
    if (entryNo > config.maxEntries) throw new Error("SOLD_OUT");
    const ticketCode = ticketCodeFor(event, entry.id, entryNo);
    // NFT 메타데이터·카드 이미지는 티켓 코드별로 만든다(번호·QR 이 그림에 들어간다)
    const metadataUri = `${origin}/api/raffle/meta/${ticketCode}`;
    // 래플 NFT - 계정당 1장. 발행·오퍼 체인은 아웃박스(applyOutcome, refType GenesisPass)가 이어 간다.
    const pass = await tx.genesisPass.upsert({
      where: { wallet_kind: { wallet, kind } },
      create: { wallet, kind, qty: 1, taxonValue: raffleTaxon(mode), metadataUri, state: "MINT_QUEUED", destination: wallet },
      update: {},
    });
    const u = await tx.raffleEntry.update({
      where: { id: entry.id },
      data: { status: "PAID", txHash: hash, paidAt: new Date(), entryNo, ticketCode, passId: pass.id },
    });
    return { entry: u, pass, metadataUri };
  }).catch((e: Error) => { if (e.message === "SOLD_OUT") return null; throw e; });
  if (!paid) return { ok: false as const, error: "선착순 정원이 모두 찼습니다. 입금액은 환불해 드립니다 - admin@wellbianlabs.io 로 알려 주세요.", pending: false };
  if (paid.pass.state === "MINT_QUEUED" && !paid.pass.mintTxId) {
    await enqueueTx(
      "NFT_MINT",
      { TransactionType: "NFTokenMint", Issuer: ISSUER_ADDRESS, NFTokenTaxon: raffleTaxon(mode), Flags: 8, URI: convertStringToHex(paid.metadataUri) },
      { type: "GenesisPass", id: paid.pass.id },
    );
    await drainOutbox().catch(() => {});
  }
  return { ok: true as const, entry: paid.entry, already: false };
}

/** 오퍼 수락 뒤 - 지갑이 래플 NFT 를 실제로 들고 있으면 CLAIMED 로 마감 */
export async function confirmRaffleNft(wallet: string, mode: RaffleMode = "prod") {
  const pass = await prisma.genesisPass.findUnique({ where: { wallet_kind: { wallet, kind: raffleKind(mode) } } });
  if (!pass) return { ok: false as const, error: "응모 내역이 없습니다." };
  if (pass.state === "CLAIMED") return { ok: true as const, state: "CLAIMED" };
  if (!pass.nftTokenId) return { ok: false as const, error: "래플 NFT 발행이 아직 진행 중입니다.", code: 409 };
  let held = false;
  let marker: unknown = undefined;
  do {
    const res = await xrplRead<{ account_nfts: unknown[]; marker?: unknown }>("account_nfts", { account: wallet, limit: 400, ...(marker ? { marker } : {}) });
    for (const nft of res.result.account_nfts as AccountNFToken[]) {
      if (nft.NFTokenID === pass.nftTokenId && nft.Issuer === ISSUER_ADDRESS && nft.NFTokenTaxon === raffleTaxon(mode)) held = true;
    }
    marker = res.result.marker;
  } while (marker && !held);
  if (!held) return { ok: false as const, error: "지갑에서 아직 래플 NFT 가 확인되지 않습니다. 수락 후 잠시 뒤 다시 시도해 주세요.", code: 409 };
  await prisma.genesisPass.update({ where: { id: pass.id }, data: { state: "CLAIMED" } });
  return { ok: true as const, state: "CLAIMED" };
}

/* ── 티켓 조회·검증·수령 처리 ── */
export async function findTicket(code: string) {
  const c = code.trim().toUpperCase();
  if (!/^WB[RT]-\d{4}-[0-9A-F]{10}$/.test(c)) return null;
  const entry = await prisma.raffleEntry.findUnique({ where: { ticketCode: c } });
  if (!entry || entry.entryNo == null) return null;
  // 코드가 DB 값과 같더라도 HMAC 을 다시 계산해 위조·DB 조작을 걸러 낸다
  if (ticketCodeFor(entry.event, entry.id, entry.entryNo) !== c) return null;
  return entry;
}

/** 현장 스캐너: 유효한 티켓이면 한 번만 수령 처리한다. 두 번째부터는 언제 이미 썼는지 알려 준다. */
export async function redeemTicket(code: string, staff: string) {
  const entry = await findTicket(code);
  if (!entry) return { ok: false as const, error: "유효하지 않은 티켓입니다." };
  if (entry.status !== "PAID") return { ok: false as const, error: "결제가 확정되지 않은 응모입니다.", entry };
  if (entry.redeemedAt) return { ok: false as const, error: `이미 수령 처리된 티켓입니다 (${entry.redeemedAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })})`, entry };
  const u = await prisma.raffleEntry.update({ where: { id: entry.id }, data: { redeemedAt: new Date(), redeemedBy: staff } });
  return { ok: true as const, entry: u };
}

/** 추첨 결과(ordered: 지갑 순서)로 경품을 배정한다 - 앞에서부터 경품 수만큼 끊는다. 전원이 하나는 받는다. */
export async function assignPrizes(mode: RaffleMode, ordered: string[]) {
  const config = await loadRaffleConfig(mode);
  const event = raffleEvent(mode);
  let i = 0; let assigned = 0;
  for (const p of config.prizes) {
    const slice = ordered.slice(i, i + p.qty); i += p.qty;
    if (!slice.length) continue;
    const r = await prisma.raffleEntry.updateMany({ where: { event, status: "PAID", wallet: { in: slice } }, data: { prize: p.name } });
    assigned += r.count;
  }
  return { assigned, total: ordered.length };
}
