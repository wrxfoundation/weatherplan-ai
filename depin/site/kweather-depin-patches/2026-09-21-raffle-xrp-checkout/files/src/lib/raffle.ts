import { convertStringToHex } from "xrpl";
import type { AccountNFToken } from "xrpl";
import { createHmac } from "node:crypto";
import type { Prisma } from "@prisma/client";
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

/* 마감 뒤 확인된 입금 (2026-09-21 점검). 추첨 명단은 마감 시점의 결제 확정 응모로 봉인되므로 늦게 확정된 응모는 추첨에 들어가지
   못한다 - 그래서 마감(정원·기간) 뒤에 확인된 입금은 PAID 로 만들지 않고 OVERFLOW 로 남겨 관리자 콘솔 › 래플에서 환불 대상으로 본다.
   마감 직전에 보낸 송금이 원장 반영·확인까지 걸리는 시간을 생각해 기간 마감은 10분을 받아 준다. */
export const CLOSE_GRACE_MS = 10 * 60_000;
const OVERFLOW_MSG = "정원 또는 기간이 마감되어 결제를 확정할 수 없습니다. 입금액은 환불해 드립니다 - admin@wellbianlabs.io 로 지갑 주소와 트랜잭션 해시를 보내 주세요.";
async function markOverflow(entryId: string, hash: string) {
  await prisma.raffleEntry.updateMany({ where: { id: entryId, status: "PENDING" }, data: { status: "OVERFLOW", txHash: hash } }).catch(() => {});
}

export interface RafflePrize { name: string; qty: number; note?: string }
export interface RaffleConfig {
  open: string;       // 응모 시작 (ISO)
  close: string;      // 응모 마감 - 시작 후 7일
  drawAt: string;     // 추첨 공개 - 마감 후 24시간 이내
  eventAt: string;    // 행사일 - 상품은 이날 행사장에서 QR 확인 후 지급
  priceXrp: number;   // 응모 금액 (XRP)
  maxEntries: number; // 선착순 정원 - 경품 수 합계와 같아 전원이 하나는 받는다. 정원 = 결제 확정 + 유효 예약(아래 holdMinutes)
  holdMinutes: number; // 결제 대기 예약(응모 시작)이 자리를 잡아 두는 시간(분). 만료되면 자리가 풀리고, 결제창을 열어 두면 자동 연장된다
  drawId?: string;    // 블라인드 추첨 id - 봉인(커밋)하면 관리자 콘솔이 넣고, 페이지 일정 섹션에 검증 링크(/api/draw/<id>)가 뜬다
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
  holdMinutes: 30,
  prizes: [
    { name: "XRP SEOUL 2026 초대권", qty: 290, note: "10월 3일 서울 · 행사장 입장권 · 당첨자 이메일로 발송" },
    { name: "Weather Data Token Generator™", qty: 10, note: "제네시스 한정판, 실물 날씨데이터 토큰 생성기 1대 · 행사 당일 'wellbian 플래티넘 부스' 현장수령" },
    { name: "wellbian 우산", qty: 50, note: "행사 당일 'wellbian 플래티넘 부스' 현장수령" },
    { name: "wellbian 에코백", qty: 150, note: "행사 당일 'wellbian 플래티넘 부스' 현장수령" },
  ],
};
const DEFAULT_TEST: RaffleConfig = { ...DEFAULT, open: "2026-09-16T00:00:00Z" };   // 리허설은 지금 열려 있고 나머지는 실제와 같다

/** 관리자 설정(raffle_xrpseoul[_test]) 부분 갱신 - undefined 값은 키를 지운다 */
export async function saveRaffleConfig(mode: RaffleMode, patch: Partial<RaffleConfig>) {
  const key = configKey(mode);
  const row = await prisma.adminConfig.findUnique({ where: { key } }).catch(() => null);
  const value: Record<string, unknown> = { ...((row?.value as Record<string, unknown> | null) ?? {}) };
  for (const [k, v] of Object.entries(patch)) { if (v === undefined) delete value[k]; else value[k] = v; }
  await prisma.adminConfig.upsert({ where: { key }, create: { key, value: value as never, updatedBy: "admin" }, update: { value: value as never, updatedBy: "admin" } });
  return value;
}

export async function loadRaffleConfig(mode: RaffleMode = "prod"): Promise<RaffleConfig> {
  const row = await prisma.adminConfig.findUnique({ where: { key: configKey(mode) } }).catch(() => null);
  const base = mode === "test" ? DEFAULT_TEST : DEFAULT;
  return { ...base, ...((row?.value as Partial<RaffleConfig> | null) ?? {}) };
}

export type RafflePhase = "BEFORE" | "OPEN" | "SOLD_OUT" | "CLOSED";
/** 시간 + 정원. 정원(결제 확정 + 유효 예약)이 차면 마감 시각 전이라도 SOLD_OUT - 새 응모를 시작할 수 없다.
 *  유효 예약이 만료되면(결제 없이 holdMinutes 경과) 자리가 풀려 다시 OPEN 이 된다. 2026-09-21 결정: 500 이 되면 결제를 막는다. */
export function rafflePhaseAt(c: RaffleConfig, paidCount: number, now = new Date(), liveHolds = 0): RafflePhase {
  const t = now.getTime();
  if (t < Date.parse(c.open)) return "BEFORE";
  if (t >= Date.parse(c.close)) return "CLOSED";
  if (paidCount + liveHolds >= c.maxEntries) return "SOLD_OUT";
  return "OPEN";
}
export const holdMsOf = (c: RaffleConfig) => Math.max(1, c.holdMinutes ?? 30) * 60_000;
/** 예약 만료 시각 - 결제 대기 행만. createdAt 이 예약 시작(연장하면 갱신된다) */
export const holdUntilOf = (entry: { status: string; createdAt: Date }, c: RaffleConfig) => (entry.status === "PENDING" ? new Date(entry.createdAt.getTime() + holdMsOf(c)) : null);
/** 유효 예약 수 - 결제 대기 가운데 예약이 살아 있는 행. excludeId 는 자기 자신(연장할 때) */
async function liveHolds(event: string, c: RaffleConfig, excludeId?: string, db: Pick<Prisma.TransactionClient, "raffleEntry"> = prisma) {
  return db.raffleEntry.count({ where: { event, status: "PENDING", createdAt: { gt: new Date(Date.now() - holdMsOf(c)) }, ...(excludeId ? { id: { not: excludeId } } : {}) } });
}

/* ── 티켓 코드 (QR 내용) ──
   WBR-0001-XXXXXXXXXX : 번호 + HMAC(SESSION_SECRET) 10자. 번호만 알아서는 만들 수 없고, 코드만 보고 응모 행을 찾는다.
   QR 이 새어 나가면 남이 먼저 수령할 수 있으므로 화면마다 관리 경고를 붙인다(보상 없음). */
export function ticketCodeFor(event: string, entryId: string, entryNo: number): string {
  const mac = createHmac("sha256", process.env.SESSION_SECRET ?? "").update(`raffle|${event}|${entryId}|${entryNo}`).digest("hex").slice(0, 10).toUpperCase();
  return `${event.endsWith("-test") ? "WBT" : "WBR"}-${String(entryNo).padStart(4, "0")}-${mac}`;
}
export const ticketUrl = (origin: string, code: string) => `${origin}/event/xrpl-seoul/ticket/${code}`;

type EntryRow = { status: string; destTag: number; entryNo: number | null; txHash: string | null; amountXrp: unknown; ticketCode: string | null; prize: string | null; redeemedAt: Date | null; createdAt: Date };
type PassRow = { state: string; offerIndex: string | null; nftTokenId: string | null };
const mineView = (entry: EntryRow | null, pass: PassRow | null, config: RaffleConfig) =>
  entry ? {
    status: entry.status, destTag: entry.destTag, entryNo: entry.entryNo, txHash: entry.txHash, amountXrp: Number(entry.amountXrp),
    ticketCode: entry.ticketCode, prize: entry.prize, redeemedAt: entry.redeemedAt ? entry.redeemedAt.toISOString() : null,
    holdUntil: holdUntilOf(entry, config)?.toISOString() ?? null, holdLive: (holdUntilOf(entry, config)?.getTime() ?? 0) > Date.now(),
    pass: pass ? { state: pass.state, offerIndex: pass.offerIndex, nftTokenId: pass.nftTokenId } : null,
  } : null;

/** 화면이 한 번에 읽는 상태 - 설정·페이즈·응모 수·(로그인 시) 내 응모 */
export async function raffleState(wallet: string | null, mode: RaffleMode = "prod") {
  const config = await loadRaffleConfig(mode);
  const event = raffleEvent(mode);
  const count = await prisma.raffleEntry.count({ where: { event, status: "PAID" } });
  const holds = await liveHolds(event, config);
  const phase = rafflePhaseAt(config, count, new Date(), holds);
  let mine = null;
  if (wallet) {
    const entry = await prisma.raffleEntry.findUnique({ where: { event_wallet: { event, wallet } } });
    const pass = await prisma.genesisPass.findUnique({ where: { wallet_kind: { wallet, kind: raffleKind(mode) } } });
    mine = mineView(entry, pass, config);
  }
  /* 봉인된 블라인드 추첨 - 커밋은 즉시, 시드·결과는 공개 뒤 /api/draw/<id> 에서 누구나 검증한다 */
  const d = config.drawId ? await prisma.blindDraw.findUnique({ where: { id: config.drawId }, select: { id: true, status: true, commitment: true, participantsHash: true, createdAt: true, revealedAt: true, revealAfter: true } }).catch(() => null) : null;
  const draw = d ? { id: d.id, status: d.status, commitment: d.commitment, participantsHash: d.participantsHash, createdAt: d.createdAt.toISOString(), revealedAt: d.revealedAt?.toISOString() ?? null, revealAfter: d.revealAfter?.toISOString() ?? null } : null;
  return { mode, phase, config, count, holds, remaining: Math.max(0, config.maxEntries - count - holds), destination: hotWalletAddress(), mine, draw };
}

/** 응모 시작(예약) - 결제를 기다리는 행을 만든다(태그 발급). 이미 있으면 예약을 연장해 그 행을 돌려준다.
 *  정원 = 결제 확정 + 유효 예약. 정원이 차면 새 예약도 연장도 거절한다 - 그래서 결제 화면에 들어간 사람은 예약이 살아 있는 동안 자리가 있다
 *  (2026-09-21 결정: 500 이 되면 결제를 막는다). 같은 순간의 요청이 정원을 넘기지 않게 이벤트별 조언 잠금 안에서 세고 만든다.
 *  email 은 당첨 안내(초대권 발송) 연락처 - 계정 연락처(AccountContact)에 넣는다. */
export async function createRaffleEntry(wallet: string, mode: RaffleMode = "prod", email?: string) {
  const config = await loadRaffleConfig(mode);
  const event = raffleEvent(mode);
  if (email) await prisma.accountContact.upsert({ where: { address: wallet }, create: { address: wallet, email }, update: { email, updatedAt: new Date() } }).catch(() => {});
  const timePhase = rafflePhaseAt(config, 0);   // 시간만 본다 - 정원은 아래 잠금 안에서 센다
  const run = () => prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"raffle-hold:" + event}))`;
    const existing = await tx.raffleEntry.findUnique({ where: { event_wallet: { event, wallet } } });
    if (existing?.status === "PAID") return { ok: true as const, entry: existing, config };
    if (existing?.status === "OVERFLOW") return { ok: false as const, error: OVERFLOW_MSG, code: "OVERFLOW" as const };
    if (timePhase === "BEFORE") return { ok: false as const, error: "아직 응모가 열리지 않았습니다.", code: "BEFORE" as const };
    if (timePhase === "CLOSED") return { ok: false as const, error: "응모가 마감되었습니다.", code: "CLOSED" as const };
    const paid = await tx.raffleEntry.count({ where: { event, status: "PAID" } });
    const holds = await liveHolds(event, config, existing?.id, tx);
    if (paid + holds >= config.maxEntries) {
      return { ok: false as const, error: existing ? "예약이 만료된 사이 선착순 정원이 모두 찼습니다. XRP 를 보내지 마세요." : "선착순 정원이 모두 찼습니다.", code: "SOLD_OUT" as const };
    }
    if (existing) {
      const entry = await tx.raffleEntry.update({ where: { id: existing.id }, data: { createdAt: new Date() } });   // 예약 연장
      return { ok: true as const, entry, config };
    }
    const entry = await tx.raffleEntry.create({ data: { event, wallet, destTag: newDestTag(), amountXrp: config.priceXrp, status: "PENDING" } });
    return { ok: true as const, entry, config };
  });
  try {
    return await run();
  } catch (e) {
    // 무작위 태그가 겹친 경우(P2002) - 한 번 더
    if ((e as { code?: string }).code === "P2002") return await run();
    throw e;
  }
}

/** 해시 없이 입금 찾기 - 핫월렛의 최근 거래에서 이 응모의 Destination Tag 로 들어온 XRP Payment(검증 완료·성공·금액 충족)의 해시를 돌려준다.
 *  거래소에서 보낸 사람은 해시를 찾기 어렵다(2026-09-21 결정). 최근 것부터 최대 5쪽(쪽당 200건)만 본다. */
export async function findPaymentByTag(destTag: number, minXrp: number): Promise<string | null> {
  const hot = hotWalletAddress();
  let marker: unknown = undefined;
  for (let page = 0; page < 5; page++) {
    const res = await xrplRead<{ transactions?: unknown[]; marker?: unknown }>("account_tx", { account: hot, limit: 200, ledger_index_min: -1, ledger_index_max: -1, ...(marker ? { marker } : {}) });
    for (const entry of res.result.transactions ?? []) {
      const e = entry as { tx_json?: Record<string, unknown>; tx?: Record<string, unknown>; meta?: { TransactionResult?: string; delivered_amount?: unknown }; hash?: string; validated?: boolean };
      const tx = e.tx_json ?? e.tx;
      if (!tx || e.validated === false) continue;
      if (tx.TransactionType !== "Payment" || tx.Destination !== hot || Number(tx.DestinationTag) !== destTag) continue;
      if (e.meta?.TransactionResult !== "tesSUCCESS" || typeof e.meta.delivered_amount !== "string") continue;
      if (Number(e.meta.delivered_amount) / 1e6 + 1e-9 < minXrp) continue;
      const hash = String(e.hash ?? tx.hash ?? "");
      if (/^[0-9A-F]{64}$/i.test(hash)) return hash.toUpperCase();
    }
    marker = res.result.marker;
    if (!marker) break;
  }
  return null;
}

/** 결제 확정 - 해시를 검증해 PAID 로 만들고 래플 번호·티켓 코드를 매기고 NFT 발행을 큐에 넣는다. 같은 해시 재호출은 멱등.
 *  txHash 가 null 이면 핫월렛 거래에서 이 응모의 태그로 입금을 찾는다(해시 없이 확인). */
export async function verifyRaffleEntry(wallet: string, txHash: string | null, origin: string, mode: RaffleMode = "prod") {
  const event = raffleEvent(mode);
  const entry = await prisma.raffleEntry.findUnique({ where: { event_wallet: { event, wallet } } });
  if (!entry) return { ok: false as const, error: "응모 내역이 없습니다. 먼저 응모를 시작해 주세요." };
  if (entry.status === "PAID") return { ok: true as const, entry, already: true };
  if (entry.status === "OVERFLOW") return { ok: false as const, error: OVERFLOW_MSG, pending: false };
  const hash = txHash ? txHash.toUpperCase() : await findPaymentByTag(entry.destTag, Number(entry.amountXrp));
  if (!hash) return { ok: false as const, error: "아직 입금이 확인되지 않았습니다. 거래소 출금은 몇 분 걸릴 수 있습니다 - 잠시 후 다시 확인해 주세요. 태그 없이 보냈다면 admin@wellbianlabs.io 로 알려 주세요.", pending: true };
  const dup = await prisma.raffleEntry.findUnique({ where: { txHash: hash } });
  if (dup && dup.id !== entry.id) return { ok: false as const, error: "이미 다른 응모에 사용된 트랜잭션입니다." };
  const v = await verifyXrpPayment(hash, Number(entry.amountXrp), entry.destTag);
  if (!v.ok) return { ok: false as const, error: v.error, pending: "pending" in v && v.pending };

  const kind = raffleKind(mode);
  const config = await loadRaffleConfig(mode);
  if (Date.now() >= Date.parse(config.close) + CLOSE_GRACE_MS) {
    await markOverflow(entry.id, hash);
    return { ok: false as const, error: OVERFLOW_MSG, pending: false };
  }
  /* 예약이 만료된 응모의 입금: 남은 자리(정원 - 확정 - 유효 예약)가 없으면 확정하지 않는다 - 예약이 살아 있는 사람의 자리를 지킨다.
     결제창을 열어 둔 사람은 예약이 자동 연장되므로 여기 걸리지 않는다. */
  if ((holdUntilOf(entry, config)?.getTime() ?? 0) <= Date.now()) {
    const paidNow = await prisma.raffleEntry.count({ where: { event, status: "PAID" } });
    const holds = await liveHolds(event, config, entry.id);
    if (paidNow + holds >= config.maxEntries) {
      await markOverflow(entry.id, hash);
      return { ok: false as const, error: OVERFLOW_MSG, pending: false };
    }
  }
  /* 래플 번호 = 결제 확정 순번. 같은 순간 여러 명이 확정되면 둘 다 같은 max+1 을 계산해 (event, entryNo) 유일 제약에
     걸린다(2026-09-21 점검 - 18:00 오픈 러시에서 실제로 날 수 있는 경우). 그때는 번호를 다시 세어 재시도한다(최대 6회).
     같은 응모의 중복 호출(확인 버튼 두 번)은 status=PENDING 조건으로 한 번만 통과시킨다 - 예전에는 두 번째 호출이
     번호를 덮어써 구멍을 내고 NFT 발행을 한 번 더 큐에 넣을 수 있었다. */
  type Paid = { entry: typeof entry; pass: { id: string; state: string; mintTxId: string | null }; metadataUri: string };
  let paid: Paid | null | "RACE" | "ALREADY" = "RACE";
  for (let attempt = 0; attempt < 6 && paid === "RACE"; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 60 + Math.random() * 140));
    paid = await prisma.$transaction(async (tx): Promise<Paid> => {
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
      const r = await tx.raffleEntry.updateMany({
        where: { id: entry.id, status: "PENDING" },
        data: { status: "PAID", txHash: hash, paidAt: new Date(), entryNo, ticketCode, passId: pass.id },
      });
      if (r.count === 0) throw new Error("ALREADY_PAID");
      const u = await tx.raffleEntry.findUniqueOrThrow({ where: { id: entry.id } });
      return { entry: u, pass, metadataUri };
    }).catch((e: Error & { code?: string }): Paid | null | "RACE" | "ALREADY" => {
      if (e.message === "SOLD_OUT") return null;
      if (e.message === "ALREADY_PAID") return "ALREADY";
      if (e.code === "P2002") return "RACE";   // (event, entryNo) 충돌 - 다시 센다
      throw e;
    });
  }
  if (paid === "ALREADY") {
    const again = await prisma.raffleEntry.findUniqueOrThrow({ where: { id: entry.id } });
    if (again.status !== "PAID") return { ok: false as const, error: OVERFLOW_MSG, pending: false };   // 그 사이 OVERFLOW 로 남은 행
    return { ok: true as const, entry: again, already: true };
  }
  if (paid === "RACE") return { ok: false as const, error: "확정이 몰려 번호를 매기지 못했습니다. 잠시 후 해시로 다시 확인해 주세요.", pending: true };
  if (!paid) { await markOverflow(entry.id, hash); return { ok: false as const, error: OVERFLOW_MSG, pending: false }; }
  if (paid.pass.state === "MINT_QUEUED" && !paid.pass.mintTxId) {
    /* 이 NFT 의 발행 작업이 이미 큐에 있으면 다시 넣지 않는다 */
    const queued = await prisma.xrplTransaction.findFirst({ where: { refType: "GenesisPass", refId: paid.pass.id, purpose: "NFT_MINT" }, select: { id: true } });
    if (!queued) {
      await enqueueTx(
        "NFT_MINT",
        { TransactionType: "NFTokenMint", Issuer: ISSUER_ADDRESS, NFTokenTaxon: raffleTaxon(mode), Flags: 8, URI: convertStringToHex(paid.metadataUri) },
        { type: "GenesisPass", id: paid.pass.id },
      );
      /* 짧게만 민다 - 기본 40초 예산을 verify(maxDuration 30초) 안에서 기다리면 오픈 러시 때 응답이 끊긴다. 나머지는 매분 크론(/api/cron/drain)이 잇는다. */
      await drainOutbox(8_000).catch(() => {});
    }
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

/** 추첨 결과의 지갑들이 어느 장부(실제/리허설)의 결제 확정 응모인지 - 전원이 한 장부에 있어야 한다. 둘 다 아니면 null. */
export async function inferRaffleMode(wallets: string[]): Promise<RaffleMode | null> {
  if (!wallets.length) return null;
  for (const mode of ["prod", "test"] as RaffleMode[]) {
    const n = await prisma.raffleEntry.count({ where: { event: raffleEvent(mode), status: "PAID", wallet: { in: wallets } } });
    if (n === wallets.length) return mode;
  }
  return null;
}

/** 추첨 결과(ordered: 지갑 순서)로 경품을 배정한다 - 앞에서부터 경품 수만큼 끊는다. 전원이 하나는 받는다.
 *  참가자가 경품 수 합계보다 많으면 배정하지 않고 알린다(정원·경품 수를 관리자 설정에서 다르게 바꿨을 때). */
export async function assignPrizes(mode: RaffleMode, ordered: string[]) {
  const config = await loadRaffleConfig(mode);
  const event = raffleEvent(mode);
  const capacity = config.prizes.reduce((a, p) => a + p.qty, 0);
  if (ordered.length > capacity) return { ok: false as const, error: `참가자 ${ordered.length}명이 경품 수 합계 ${capacity}보다 많습니다 - 설정(raffle_xrpseoul)의 경품 수량을 먼저 맞춰 주세요.` };
  let i = 0; let assigned = 0; const byPrize: Record<string, number> = {};
  for (const p of config.prizes) {
    const slice = ordered.slice(i, i + p.qty); i += p.qty;
    if (!slice.length) continue;
    const r = await prisma.raffleEntry.updateMany({ where: { event, status: "PAID", wallet: { in: slice } }, data: { prize: p.name } });
    assigned += r.count; byPrize[p.name] = r.count;
  }
  return { ok: true as const, assigned, total: ordered.length, byPrize, mode };
}
