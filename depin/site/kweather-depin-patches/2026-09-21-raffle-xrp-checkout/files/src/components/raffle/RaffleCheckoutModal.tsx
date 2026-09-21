"use client";
/* 래플 응모 결제창 (2026-09-21 지시: "기존 페이지 결제창 내용 체크해서 XRP 결제할 수 있게 갖춰라. 기존 흐름을 따르되
   카드결제는 없고 순전히 XRP 로만").

   판매 페이지 구매 모달(components/launch/BuyModal)의 흐름 - 결제 방법 → 수량 → 배송 정보 → 동의 → 결제 - 을 그대로 따른다.
   래플에 없는 단계는 접었다: 결제 방법은 XRP 하나뿐이라 고르는 화면이 없고(BuyModal 도 한 방식만 열리면 건너뛴다),
   수량은 계정당 1회라 「응모 내용」 확인으로, 배송은 현장 수령뿐이라 수령 안내를 그 자리에 넣었다.
   그 뒤 동의 → XRP 결제(송금 → 원장 확인 → 응모 확정) → 래플 NFT 수락은 래플 고유 단계다.

   단계  ① 응모 내용  ② 동의  ③ XRP 결제  ④ NFT 수령(→ 완료)
   서버  ② 동의 버튼 = /api/raffle/enter(응모 행·DestinationTag 발급, 계정당 1회, 이미 있으면 그 행)
        ③ 결제      = 연결된 지갑 서명(Payment, DestinationTag) 또는 외부 지갑 송금 뒤 해시 입력 → /api/raffle/verify
        ④ NFT       = NFTokenAcceptOffer 서명 → /api/raffle/confirm
   판매 페이지와 코드·데이터를 공유하지 않는다는 원칙(RafflePage 머리말)대로 BuyModal 의 부품은 가져오지 않고 같은 모양으로
   다시 그렸다 - 스타일(.wb-store, launch/store.css)만 같이 쓴다. 지갑·로그인·아웃박스는 공용.
   결제 수단은 XRP 뿐이다: 카드(토스)·RLUSD 경로는 이 창에 없다. */
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "@/app/launch/store.css";
import { useI18n } from "@/lib/launch/i18n";
import { useWallet } from "@/lib/wallet/WalletContext";
import { toast } from "@/components/Toast";
import { TicketCard } from "./TicketCard";
import { raffleQs, type RaffleMine, type RaffleMode, type RaffleStateView } from "./types";
import { prizeLabel } from "@/lib/raffle-prizes";

interface Bal { address: string; xrp: number; activated: boolean; reserve: number }
interface Entry { destTag: number; status: string }
type PayStatus = "idle" | "signing" | "verifying" | "done";

/** 잔고 기준: 응모 금액 + 계정 예치금(원장값, 미활성이면 1) + 래플 NFT 한 장 예치금 0.2 + 수수료 여유 0.1 */
const NFT_RESERVE = 0.2;
const FEE_HEADROOM = 0.1;
const needXrp = (price: number, bal: Bal | null) => Math.round((price + (bal?.activated ? bal.reserve : 1) + NFT_RESERVE + FEE_HEADROOM) * 100) / 100;

const kst = (iso?: string) => (iso ? new Date(Date.parse(iso) + 9 * 3600_000) : null);
const fmtDate = (iso: string | undefined, lang: string) => {
  const d = kst(iso); if (!d) return "";
  const M = d.getUTCMonth() + 1, D = d.getUTCDate(), H = d.getUTCHours();
  if (lang === "ko") return `${M}월 ${D}일 ${H === 12 ? "정오" : `${H}시`}`;
  if (lang === "ja") return `${M}月${D}日 ${H}時`;
  if (lang === "zh") return `${M}月${D}日 ${H}时`;
  const mon = d.toLocaleString(lang === "es" ? "es-ES" : "en-US", { month: "short", timeZone: "UTC" });
  return lang === "es" ? `${D} ${mon}, ${String(H).padStart(2, "0")}:00` : `${mon} ${D}, ${String(H).padStart(2, "0")}:00`;
};

/** 미리보기 전용(스크린샷·SSR 확인) - 실제 화면은 넘기지 않는다. 넘기면 첫 상태를 그 값으로 시작한다. */
export interface CheckoutPreview { step?: 1 | 2 | 3 | 4; bal?: Bal | null; entry?: Entry | null; mine?: RaffleMine | null; qr?: string; payStatus?: PayStatus; terms?: boolean; email?: string; holdUntil?: string | null; holdLost?: boolean }
const fmtLeft = (ms: number | null) => { const s = Math.max(0, Math.floor((ms ?? 0) / 1000)); return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };

export default function RaffleCheckoutModal({ mode, st, onClose, onChange }: {
  mode: RaffleMode; st: RaffleStateView; onClose: () => void; onChange: () => Promise<void> | void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  if (!mounted) return null;
  /* 구매 모달과 같은 .wb-store 스타일을 쓰려고 포털로 body 에 붙인다(래플 페이지는 .wb-page 스코프라 변수·모달 규칙이 없다) */
  return createPortal(
    <div className="wb-store" style={{ background: "transparent" }}>
      <RaffleCheckoutCard mode={mode} st={st} onClose={onClose} onChange={onChange} />
    </div>,
    document.body,
  );
}

export function RaffleCheckoutCard({ mode, st, onClose, onChange, preview }: {
  mode: RaffleMode; st: RaffleStateView; onClose: () => void; onChange: () => Promise<void> | void; preview?: CheckoutPreview;
}) {
  const { lang, t } = useI18n();
  const { address, sessionVerified, openLogin, signAndSubmit, walletKind } = useWallet();
  const price = st.config.priceXrp;
  const [mine, setMine] = useState<RaffleMine | null>(preview?.mine !== undefined ? preview.mine : st.mine);
  const [entry, setEntry] = useState<Entry | null>(preview?.entry !== undefined ? preview.entry : st.mine ? { destTag: st.mine.destTag, status: st.mine.status } : null);
  const [bal, setBal] = useState<Bal | null>(preview?.bal ?? null);
  /* 처음 여는 자리: 결제까지 끝났으면 ④, 응모 행(태그)이 이미 있으면 동의를 마친 것이므로 ③, 아니면 ① */
  const [step, setStep] = useState<1 | 2 | 3 | 4>(() => preview?.step ?? (st.mine?.status === "PAID" ? 4 : st.mine ? 3 : 1));
  const [terms1, setTerms1] = useState(!!preview?.terms);
  const [terms2, setTerms2] = useState(!!preview?.terms);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [payStatus, setPayStatus] = useState<PayStatus>(preview?.payStatus ?? "idle");
  const [hash, setHash] = useState("");
  const [copied, setCopied] = useState<"" | "addr" | "dest" | "tag">("");
  const [qr, setQr] = useState(preview?.qr ?? "");
  /* 당첨 안내 이메일(초대권 발송) - 계정 연락처(AccountContact)에서 미리 채우고, 동의 단계에서 확인받아 저장한다 */
  const [email, setEmail] = useState(preview?.email ?? "");
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const prefilledRef = useRef(false);
  /* 예약(자리 확보) - 결제 대기 행의 예약 만료 시각. 결제 화면에 있는 동안 5분마다, 결제 직전에 연장한다(2026-09-21 결정: 정원이 차면 결제를 막는다) */
  const [holdUntil, setHoldUntil] = useState<string | null>(preview?.holdUntil !== undefined ? preview.holdUntil : (st.mine?.holdUntil ?? null));
  const [holdLost, setHoldLost] = useState(!!preview?.holdLost);
  const [holdLostMsg, setHoldLostMsg] = useState("");
  const [nowTick, setNowTick] = useState(() => Date.now());
  const lastRenewRef = useRef(0);
  const pollRef = useRef<number | null>(null);

  const done = !!mine && mine.status === "PAID";
  const held = done && mine?.pass?.state === "CLAIMED";
  const need = needXrp(price, bal);
  const enough = !!bal && bal.activated && bal.xrp >= need;
  const no = String(mine?.entryNo ?? 0).padStart(4, "0");
  /* 서명·원장 확인·응모 생성·NFT 수락 중에는 창을 닫지 않는다(바탕 클릭·ESC·✕) - 닫히면 진행 상황을 잃고 해시로 다시 확인해야 한다 (2026-09-21 점검) */
  const locked = payStatus === "signing" || payStatus === "verifying" || busy;
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { if (!preview) dialogRef.current?.focus(); }, [preview]);
  useEffect(() => {
    if (preview) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape" && !locked) onClose(); };
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [locked, onClose, preview]);
  /* 결제 전인데 응모가 열려 있지 않으면(정원·기간 마감, 정원 초과로 확정되지 않은 입금) 결제 화면을 보여 주지 않는다 -
     마감 뒤 보낸 입금은 확정되지 않고 환불 대상이 된다(2026-09-21 점검). st 는 페이지가 20초마다 새로 읽어 내려 준다. */
  const holdLive = !!holdUntil && Date.parse(holdUntil) > nowTick;
  const holdLeft = holdUntil ? Math.max(0, Date.parse(holdUntil) - nowTick) : null;
  const blocked = !done && (mine?.status === "OVERFLOW" || holdLost || st.phase === "BEFORE" || st.phase === "CLOSED" || (st.phase === "SOLD_OUT" && !holdLive));

  const stepNames = t<string[]>({
    ko: ["응모 내용", "동의", "XRP 결제", "NFT 수령"], en: ["Entry", "Consent", "Pay XRP", "Get NFT"],
    ja: ["応募内容", "同意", "XRP決済", "NFT受取"], zh: ["参与内容", "同意", "支付 XRP", "领取 NFT"], es: ["Entrada", "Acuerdo", "Pagar XRP", "Recibir NFT"],
  });
  const methodName = t({ ko: "XRP 결제", en: "XRP payment", ja: "XRP決済", zh: "XRP 付款", es: "Pago en XRP" });
  const ticketName = t({ ko: "XRP SEOUL 2026 래플 응모권", en: "XRP SEOUL 2026 raffle entry", ja: "XRP SEOUL 2026 ラッフル応募券", zh: "XRP SEOUL 2026 抽奖参与券", es: "Entrada al sorteo XRP SEOUL 2026" });
  const notConfirmed = t({ ko: "아직 원장에서 확인되지 않았습니다. 잠시 후 트랜잭션 해시로 다시 확인해 주세요.", en: "Not yet confirmed on the ledger. Please try again shortly using the transaction hash.", ja: "まだ台帳で確認できません。しばらくしてからハッシュで再確認してください。", zh: "账本尚未确认，请稍后使用交易哈希重新验证。", es: "Aún no está confirmado en el ledger. Inténtelo de nuevo en breve con el hash." });

  const refreshMine = useCallback(async () => {
    const r = await fetch(`/api/raffle/state${raffleQs(mode)}`, { cache: "no-store" }); if (!r.ok) return null;
    const d: RaffleStateView = await r.json(); setMine(d.mine); return d.mine;
  }, [mode]);
  const refreshBal = useCallback(async () => {
    try {
      const r = await fetch("/api/wallet", { cache: "no-store" }); const d = await r.json();
      if (r.ok) setBal({ address: d.address, xrp: Number(d.xrp ?? 0), activated: d.activated !== false, reserve: Number(d.reserve ?? 1) });
    } catch { /* 다음 주기 */ }
  }, []);
  /* 예약 연장 - /api/raffle/enter 는 이미 있는 행의 예약을 연장해 돌려준다. 정원이 차서 연장이 안 되면(409) 결제 화면을 닫는다 */
  const renewHold = useCallback(async (force = false): Promise<boolean> => {
    if (!force && Date.now() - lastRenewRef.current < 60_000) return true;
    try {
      const r = await fetch("/api/raffle/enter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode }) });
      const d = await r.json().catch(() => ({}));
      if (r.ok) { lastRenewRef.current = Date.now(); setHoldUntil(d.entry?.holdUntil ?? null); if (d.entry) setEntry({ destTag: d.entry.destTag, status: d.entry.status }); setHoldLost(false); return true; }
      if (r.status === 409) { setHoldLost(true); setHoldLostMsg(d.error || ""); return false; }
      return true;   // 일시 오류(429 등)는 막지 않는다 - 서버가 확정 때 다시 본다
    } catch { return true; }
  }, [mode]);

  /* ③ 결제 화면: 지갑 잔고를 읽고, 부족한 동안 8초마다 다시 읽는다(입금이 들어오면 버튼이 저절로 열린다).
     ④ NFT 화면: 발행·오퍼 상태를 5초마다 다시 읽는다. */
  useEffect(() => {
    if (preview) return;
    if (step === 3 && address) refreshBal();
  }, [step, address, refreshBal, preview]);
  useEffect(() => {
    if (preview) return;
    if (pollRef.current) window.clearInterval(pollRef.current);
    if (step === 3 && !enough) pollRef.current = window.setInterval(refreshBal, 8000);
    if (step === 4 && !held) pollRef.current = window.setInterval(refreshMine, 5000);
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
  }, [step, enough, held, refreshBal, refreshMine, preview]);
  /* ③ 결제 화면에 있는 동안: 들어올 때 + 5분마다 예약 연장, 1초마다 남은 시간 표시 */
  useEffect(() => {
    if (preview || step !== 3 || done) return;
    renewHold();
    const id = window.setInterval(() => { setNowTick(Date.now()); if (Date.now() - lastRenewRef.current > 5 * 60_000) renewHold(); }, 1000);
    return () => window.clearInterval(id);
  }, [step, done, preview, renewHold]);
  /* 이메일 미리 채우기 - 계정 연락처(이메일 로그인·구매 때 적은 주소) */
  useEffect(() => {
    if (preview || !address || prefilledRef.current) return;
    prefilledRef.current = true;
    fetch("/api/account/contact", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => { if (d?.email) setEmail((e) => e || d.email); }).catch(() => {});
  }, [address, preview]);
  /* 내 주소 QR - 거래소·다른 지갑에서 입금할 때 쓴다 */
  useEffect(() => {
    if (preview || !bal?.address || qr) return;
    import("qrcode").then((q) => q.toDataURL(bal.address, { margin: 1, width: 132, color: { dark: "#1b1b48", light: "#ffffff" } })).then(setQr).catch(() => {});
  }, [bal?.address, qr, preview]);

  /* ② 동의 → 응모 행(태그) 만들기 → ③ (구매 모달의 동의 → 주문 생성 → 결제 단계와 같은 자리) */
  const startEntry = useCallback(async () => {
    if (!address || !sessionVerified) { openLogin(); return; }
    setErr(""); setBusy(true);
    try {
      const r = await fetch("/api/raffle/enter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, email: email.trim().toLowerCase() }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { const m = d.error || t({ ko: "응모를 시작할 수 없습니다.", en: "Could not start the entry.", ja: "応募を開始できません。", zh: "无法开始参与。", es: "No se pudo iniciar la participación." }); setErr(m); toast.err(m); return; }
      setEntry({ destTag: d.entry.destTag, status: d.entry.status });
      setHoldUntil(d.entry.holdUntil ?? null); setHoldLost(false); lastRenewRef.current = Date.now();
      setStep(3);
    } catch {
      const m = t({ ko: "응모를 시작할 수 없습니다. 잠시 후 다시 시도해 주세요.", en: "Could not start the entry. Please try again shortly.", ja: "応募を開始できません。しばらくしてからお試しください。", zh: "无法开始参与，请稍后重试。", es: "No se pudo iniciar. Inténtelo de nuevo en breve." });
      setErr(m); toast.err(m);
    } finally { setBusy(false); }
  }, [address, sessionVerified, openLogin, mode, t, email]);

  /* ③ 결제 확정 - 해시로 서버 검증(원장 반영까지 4초 간격 8회) */
  const verify = useCallback(async (h: string) => {
    setPayStatus("verifying"); setErr("");
    try {
      for (let i = 0; i < 8; i++) {
        const r = await fetch("/api/raffle/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ txHash: h, mode }) });
        const d = await r.json();
        if (r.ok) {
          toast.ok(t({ ko: "결제가 확인되었습니다", en: "Payment confirmed", ja: "決済を確認しました", zh: "支付已确认", es: "Pago confirmado" }));
          setPayStatus("done"); await refreshMine(); await onChange(); setStep(4); return;
        }
        if (r.status !== 202) { const m = d.error || t({ ko: "결제 확인에 실패했습니다.", en: "Payment could not be verified.", ja: "決済を確認できませんでした。", zh: "支付验证失败。", es: "No se pudo verificar el pago." }); setErr(m); toast.err(m); setPayStatus("idle"); await refreshMine().catch(() => null); await onChange(); return; }
        await new Promise((res) => setTimeout(res, 4000));
      }
      setErr(notConfirmed); toast.err(notConfirmed); setPayStatus("idle");
    } catch (e) { setErr((e as Error).message); setPayStatus("idle"); }
  }, [mode, onChange, refreshMine, t, notConfirmed]);

  /* ③ 연결된 지갑(간편·D'CENT·Girin·Xaman)에서 XRP Payment 서명 → 해시로 검증 */
  const pay = useCallback(async () => {
    if (!entry) return;
    setErr(""); setPayStatus("signing");
    try {
      /* 결제 직전에 예약을 확인·연장한다 - 정원이 찼으면 지갑 서명 전에 멈춘다(돈이 움직이지 않는다) */
      if (!(await renewHold(true))) { setPayStatus("idle"); return; }
      const res = await signAndSubmit({ TransactionType: "Payment", Destination: st.destination, DestinationTag: entry.destTag, Amount: String(Math.round(price * 1e6)) });
      if (!res.hash) throw new Error(t({ ko: "지갑이 트랜잭션 해시를 돌려주지 않았습니다 - 아래에 해시를 직접 입력해 주세요.", en: "The wallet did not return a hash - paste it below.", ja: "ウォレットからハッシュが返りませんでした - 下に入力してください。", zh: "钱包未返回哈希，请在下方输入。", es: "La billetera no devolvió el hash: péguelo abajo." }));
      setHash(res.hash);
      await verify(res.hash);
    } catch (e) {
      const m = friendlyXrpError((e as Error).message, t); setErr(m); toast.err(m); setPayStatus("idle");
    }
  }, [entry, signAndSubmit, st.destination, price, verify, t, renewHold]);

  /* ④ 래플 NFT 오퍼 수락 → 온체인 보유 확인 */
  const accept = useCallback(async () => {
    if (!mine?.pass?.offerIndex) return;
    setBusy(true); setErr("");
    try {
      await signAndSubmit({ TransactionType: "NFTokenAcceptOffer", NFTokenSellOffer: mine.pass.offerIndex });
      for (let i = 0; i < 8; i++) {
        await new Promise((res) => setTimeout(res, 4000));
        const c = await fetch("/api/raffle/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode }) });
        if (c.ok) { await refreshMine(); await onChange(); toast.ok(t({ ko: "래플 NFT 를 받았습니다", en: "Raffle NFT received", ja: "NFTを受け取りました", zh: "已收到 NFT", es: "NFT recibido" })); return; }
      }
      const m = t({ ko: "확인이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.", en: "Confirmation is delayed. Please try again shortly.", ja: "確認が遅れています。しばらくしてから再度お試しください。", zh: "确认延迟，请稍后重试。", es: "La confirmación se está retrasando. Inténtelo de nuevo en breve." });
      setErr(m); toast.err(m);
    } catch (e) { const m = friendlyXrpError((e as Error).message, t); setErr(m); toast.err(m); } finally { setBusy(false); }
  }, [mine, signAndSubmit, mode, refreshMine, onChange, t]);

  const copy = async (s: string, which: "addr" | "dest" | "tag") => { try { await navigator.clipboard.writeText(s); setCopied(which); setTimeout(() => setCopied(""), 1500); } catch { /* clipboard 미지원 */ } };
  const copyLabel = (which: "addr" | "dest" | "tag") => copied === which ? t({ ko: "복사됨 ✓", en: "Copied ✓", ja: "コピー済み ✓", zh: "已复制 ✓", es: "Copiado ✓" }) : t({ ko: "복사", en: "Copy", ja: "コピー", zh: "复制", es: "Copiar" });

  const stepBody = (() => {
    if (blocked) {
      const why = mine?.status === "OVERFLOW"
        ? t({ ko: "정원·기간 마감 뒤 확인된 입금이라 응모가 확정되지 않았습니다. 입금액은 환불해 드립니다 - admin@wellbianlabs.io 로 지갑 주소와 트랜잭션 해시를 보내 주세요.", en: "The payment was confirmed after entries closed, so the entry was not confirmed. The deposit will be refunded - email admin@wellbianlabs.io with your wallet address and transaction hash.", ja: "定員・期間の締切後に確認された入金のため、応募は確定していません。入金は返金します - admin@wellbianlabs.io へウォレットアドレスとハッシュをお送りください。", zh: "该笔款项在报名截止后确认，参与未生效。款项将退还 - 请将钱包地址与交易哈希发送至 admin@wellbianlabs.io。", es: "El pago se confirmó tras el cierre, así que la participación no se confirmó. Se devolverá el depósito: escriba a admin@wellbianlabs.io con su dirección y el hash." })
        : holdLost && holdLostMsg ? holdLostMsg
        : st.phase === "SOLD_OUT" || holdLost ? t({ ko: `선착순 ${st.config.maxEntries}명이 모두 찼습니다. 결제 전 응모는 확정되지 않으니 XRP 를 보내지 마세요.`, en: `All ${st.config.maxEntries} spots are filled. An unpaid entry can no longer be confirmed - please do not send XRP.`, ja: `先着${st.config.maxEntries}名が埋まりました。未決済の応募は確定できませんので、XRPを送らないでください。`, zh: `${st.config.maxEntries} 个名额已满。未支付的参与无法再确认，请勿发送 XRP。`, es: `Las ${st.config.maxEntries} plazas están completas. Una entrada sin pagar ya no puede confirmarse: no envíe XRP.` })
        : st.phase === "BEFORE" ? t({ ko: "아직 응모가 열리지 않았습니다.", en: "Entries are not open yet.", ja: "まだ応募は始まっていません。", zh: "报名尚未开始。", es: "Las inscripciones aún no están abiertas." })
        : t({ ko: "응모가 마감되었습니다. 결제 전 응모는 확정되지 않으니 XRP 를 보내지 마세요.", en: "Entries are closed. An unpaid entry can no longer be confirmed - please do not send XRP.", ja: "応募は締め切りました。未決済の応募は確定できませんので、XRPを送らないでください。", zh: "报名已截止。未支付的参与无法再确认，请勿发送 XRP。", es: "Las inscripciones han cerrado. Una entrada sin pagar ya no puede confirmarse: no envíe XRP." });
      return (
        <>
          <h3 style={h3}>{t({ ko: "응모를 진행할 수 없습니다", en: "Entry unavailable", ja: "応募できません", zh: "无法参与", es: "No se puede participar" })}</h3>
          <Alert>{why}</Alert>
          {/* 이미 보낸 입금이 있으면 해시로 확인한다 - 자리가 남았으면 확정, 없으면 OVERFLOW(환불 대상)로 기록된다 */}
          {mine?.status === "PENDING" && st.phase !== "BEFORE" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 14.5, color: "var(--ink-4)", lineHeight: 1.5 }}>{t({ ko: "이미 XRP 를 보냈다면 트랜잭션 해시를 입력해 주세요. 자리가 남아 있으면 확정되고, 없으면 환불 대상으로 기록됩니다.", en: "If you already sent XRP, paste the transaction hash. It is confirmed if a spot remains; otherwise it is recorded for refund.", ja: "すでにXRPを送った場合はハッシュを入力してください。枠が残っていれば確定、なければ返金対象として記録されます。", zh: "若已发送 XRP，请输入交易哈希。仍有名额则确认参与，否则记录为待退款。", es: "Si ya envió XRP, pegue el hash. Se confirma si queda plaza; si no, se registra para reembolso." })}</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="field-input" value={hash} onChange={(e) => setHash(e.target.value.trim())} placeholder="A1B2C3…" style={{ flex: 1, fontFamily: "monospace" }} />
                <button className="btn-ghost" disabled={payStatus !== "idle" || !/^[0-9A-Fa-f]{64}$/.test(hash)} onClick={() => verify(hash.toUpperCase())} style={{ padding: "0 16px", whiteSpace: "nowrap" }}>{t({ ko: "확인", en: "Verify", ja: "確認", zh: "确认", es: "Verificar" })}</button>
              </div>
              {err && <Alert>{err}</Alert>}
            </div>
          )}
          <button className="btn-main" style={cta} onClick={onClose}>{t({ ko: "닫기", en: "Close", ja: "閉じる", zh: "关闭", es: "Cerrar" })}</button>
        </>
      );
    }
    switch (step) {
      /* ── ① 응모 내용 (구매 모달의 '수량' 자리 - 계정당 1회라 확인만 한다) + 수령 안내 ('배송 정보' 자리 - 현장 수령뿐) ── */
      case 1: return (
        <>
          <h3 style={h3}>{t({ ko: "응모 내용을 확인해 주세요", en: "Check your entry", ja: "応募内容をご確認ください", zh: "请确认参与内容", es: "Revise su participación" })}</h3>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid var(--bd-card)", borderRadius: 14, padding: "18px 20px", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 19, fontWeight: 800, color: "var(--w-deep)" }}>{ticketName}</span>
              <span style={{ fontSize: 16, color: "var(--cap)" }}><b style={{ color: "var(--w-main)" }}>{price} XRP</b> / {t({ ko: "1회", en: "entry", ja: "1回", zh: "次", es: "entrada" })} <span style={{ fontSize: 13.5 }}>{t({ ko: "(계정당 1회)", en: "(one per account)", ja: "（1アカウント1回）", zh: "（每账户一次）", es: "(una por cuenta)" })}</span></span>
            </div>
            <span className="mono" style={{ fontSize: 22, fontWeight: 800, color: "var(--w-deep)" }}>× 1</span>
          </div>
          <div style={{ border: "1px solid var(--bd-card)", borderRadius: 14, padding: "14px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: ".1em", color: "var(--w-main)" }}>{t({ ko: "경품 · 전원 당첨, 종류만 추첨", en: "PRIZES · EVERYONE WINS, THE DRAW DECIDES WHICH", ja: "賞品・全員当選、種類のみ抽選", zh: "奖品 · 人人有奖，仅抽种类", es: "PREMIOS · TODOS GANAN, EL SORTEO DECIDE CUÁL" })}</span>
            {st.config.prizes.map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 15.5, color: "var(--ink-2)" }}>
                <span>{prizeLabel(p.name, lang)}</span><span className="mono" style={{ color: "var(--ink-4)" }}>{p.qty}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--sec-alt)", borderRadius: 12, padding: "14px 20px" }}>
            <span style={{ fontSize: 17.5, color: "var(--ink-4)" }}>{t({ ko: "합계 · 1회", en: "Total · 1 entry", ja: "合計 · 1回", zh: "合计 · 1 次", es: "Total · 1 entrada" })}</span>
            <span style={{ fontSize: 26, fontWeight: 800, color: "var(--w-deep)" }}>{price} XRP</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 16, lineHeight: 1.6, color: "var(--cap)" }}>
            <span>· {t({ ko: "계정당 1회 응모할 수 있습니다. 응모하신 분 전원에게 경품 중 한 가지가 추첨으로 지급됩니다.", en: "One entry per account. Every entrant receives one of the prizes, decided by draw.", ja: "1アカウントにつき1回応募できます。応募者全員に賞品のいずれか1点を抽選でお渡しします。", zh: "每账户可参与一次。所有参与者均通过抽奖获得一份奖品。", es: "Una entrada por cuenta. Todos los participantes reciben uno de los premios, decidido por sorteo." })}</span>
            <span>· {t({ ko: "마지막 단계에서 XRPL 지갑에서 XRP 를 보내면 끝입니다. 간편 지갑(이메일·구글), D'CENT, Girin Wallet, Xaman 모두 됩니다.", en: "At the last step you send XRP from your XRPL wallet - the built-in wallet (email/Google), D'CENT, Girin Wallet, Xaman, etc.", ja: "最後のステップでXRPLウォレットからXRPを送るだけです。かんたんウォレット（メール・Google）・D'CENT・Girin Wallet・Xamanに対応。", zh: "最后一步从 XRPL 钱包发送 XRP 即可，支持内置钱包（邮箱/Google）、D'CENT、Girin Wallet、Xaman 等。", es: "En el último paso envía XRP desde su billetera XRPL: la billetera integrada (correo/Google), D'CENT, Girin Wallet, Xaman, etc." })}</span>
            <span>· {t({ ko: "결제는 XRP 만 가능합니다. 카드·RLUSD 는 받지 않습니다.", en: "Payment in XRP only. Cards and RLUSD are not accepted.", ja: "決済はXRPのみです。カード・RLUSDは使えません。", zh: "仅支持 XRP 支付，不接受银行卡或 RLUSD。", es: "Pago solo en XRP. No se aceptan tarjetas ni RLUSD." })}</span>
            <span style={{ color: "var(--warn-text)" }}>· {t({ ko: "초대권은 당첨자 이메일로 발송됩니다. 실물 경품(Weather Data Token Generator™·우산·에코백)은 10월 3일 XRP SEOUL 2026 행사장 wellbian 플래티넘 부스에서 래플 NFT 의 QR 코드 확인 후 수령하며, 택배 배송은 하지 않습니다.", en: "Invitations are emailed to winners. Physical prizes (Weather Data Token Generator™, umbrella, eco bag) are collected at the wellbian Platinum booth, XRP SEOUL 2026 venue, on 3 October after the raffle NFT's QR code is verified. No shipping.", ja: "招待券は当選者へメールで送付します。実物の賞品（Weather Data Token Generator™・傘・エコバッグ）は10月3日、XRP SEOUL 2026会場のwellbianプラチナブースでラッフルNFTのQRコード確認後にお受け取りください。配送はありません。", zh: "邀请函将通过邮件发送给中奖者。实物奖品（Weather Data Token Generator™、雨伞、环保袋）于 10 月 3 日在 XRP SEOUL 2026 会场 wellbian 白金展位核验抽奖 NFT 二维码后领取，不提供邮寄。", es: "Las invitaciones se envían por correo a los ganadores. Los premios físicos (Weather Data Token Generator™, paraguas, bolsa) se recogen en el stand Platinum de wellbian, en XRP SEOUL 2026, el 3 de octubre tras verificar el QR del NFT. Sin envíos." })}</span>
          </div>
          <button className="btn-main" style={cta} onClick={() => { if (!address || !sessionVerified) { openLogin(); return; } setStep(2); }}>
            {t({ ko: "다음 - 동의", en: "Next - consent", ja: "次へ - 同意", zh: "下一步 - 同意", es: "Siguiente: acuerdo" })}
          </button>
        </>
      );
      /* ── ② 동의 (구매 모달의 동의 단계와 같은 카드 두 장) ── */
      case 2: return (
        <>
          <h3 style={h3}>{t({ ko: "환불·수령 안내를 확인해 주세요", en: "Review the refund & collection notices", ja: "返金・受取のご案内をご確認ください", zh: "请确认退款与领取须知", es: "Revise los avisos de reembolso y recogida" })}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 15, fontWeight: 700, color: "var(--w-deep)" }}>{t({ ko: "당첨 안내 이메일", en: "Email for prize notices", ja: "当選案内メール", zh: "中奖通知邮箱", es: "Correo para avisos de premio" })}</label>
            <input className="field-input" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
            <span style={{ fontSize: 13.5, color: "var(--cap)", lineHeight: 1.5 }}>{t({ ko: "초대권에 당첨되면 이 주소로 초대권을 보냅니다. 실물 경품 안내에도 씁니다.", en: "If you win an invitation it is sent to this address. Also used for prize notices.", ja: "招待券に当選した場合、この宛先へ送付します。実物賞品のご案内にも使います。", zh: "若中奖邀请函，将发送至此邮箱；实物奖品通知亦使用此邮箱。", es: "Si gana una invitación se enviará a esta dirección. También para avisos de premios." })}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <TermCard checked={terms1} onToggle={() => setTerms1(!terms1)}
              title={t({ ko: "[필수] 환불 불가 고지", en: "[Required] No-refund notice", ja: "【必須】返金不可のご案内", zh: "[必读] 不可退款告知", es: "[Obligatorio] Aviso de no reembolso" })}
              desc={t({ ko: `응모가 확정(결제 확인)된 뒤에는 환불이 불가합니다. 결제 전 금액(${price} XRP)과 조건을 확인해 주세요.`, en: `Once the entry is confirmed (payment verified) it cannot be refunded. Please check the amount (${price} XRP) and terms before paying.`, ja: `応募確定（決済確認）後の返金はできません。お支払い前に金額（${price} XRP）と条件をご確認ください。`, zh: `参与确认（支付核验）后不可退款。请在支付前确认金额（${price} XRP）与条款。`, es: `Una vez confirmada la participación (pago verificado) no hay reembolso. Revise el importe (${price} XRP) y las condiciones antes de pagar.` })} />
            <TermCard checked={terms2} onToggle={() => setTerms2(!terms2)}
              title={t({ ko: "[필수] 현장 수령·QR 코드 관리 확인", en: "[Required] On-site collection & QR code notice", ja: "【必須】現地受取・QRコード管理の確認", zh: "[必读] 现场领取与二维码管理确认", es: "[Obligatorio] Recogida presencial y aviso QR" })}
              desc={t({ ko: "초대권은 응모 때 적은 이메일로 발송되며, 실물 경품은 행사 당일 현장 수령만 가능하고 별도 배송은 없습니다. 래플 NFT 의 QR 코드는 본인 확인용으로 1회만 유효하고, 공유·노출로 인한 피해(타인의 선수령 등)는 보상하지 않습니다.", en: "Invitations are sent to the email given at entry; physical prizes are collected on site on the event day only, with no shipping. The raffle NFT's QR code is for identity verification and valid once; losses from sharing or exposing it (e.g. collection by another person) are not compensated.", ja: "招待券は応募時に入力したメールへ送付し、実物の賞品はイベント当日の現地受取のみで配送はありません。ラッフルNFTのQRコードは本人確認用で1回のみ有効、共有・露出による被害（第三者の先受取など）は補償しません。", zh: "邀请函将发送至参与时填写的邮箱；实物奖品仅限活动当天现场领取，不提供邮寄。抽奖 NFT 二维码用于本人核验且仅可使用一次，因分享或泄露造成的损失（如被他人先行领取）不予赔偿。", es: "Las invitaciones se envían al correo indicado al participar; los premios físicos se recogen solo en el recinto el día del evento, sin envíos. El QR del NFT sirve para verificar su identidad y vale una sola vez; no se compensan pérdidas por compartirlo o exponerlo." })} />
          </div>
          {err && <Alert>{err}</Alert>}
          <button className={`btn-main${busy ? " is-busy" : ""}`} style={cta} disabled={!(terms1 && terms2 && emailOk) || busy} onClick={startEntry}>
            {busy ? t({ ko: "연결 중…", en: "Connecting…", ja: "接続中…", zh: "连接中…", es: "Conectando…" }) : t({ ko: `동의하고 XRP 결제로 (${price} XRP)`, en: `Agree & pay in XRP (${price} XRP)`, ja: `同意してXRP決済へ (${price} XRP)`, zh: `同意并用 XRP 付款 (${price} XRP)`, es: `Aceptar y pagar en XRP (${price} XRP)` })}
          </button>
        </>
      );
      /* ── ③ XRP 결제 (구매 모달의 RLUSD 송금 단계와 같은 모양 - 통화만 XRP) ── */
      case 3: return (
        <>
          <h3 style={h3}>{t({ ko: "XRP 를 보내 주세요", en: "Send the XRP", ja: "XRPを送ってください", zh: "请发送 XRP", es: "Envíe el XRP" })}</h3>
          <PayProgress cur={payStatus === "done" ? 2 : payStatus === "verifying" ? 1 : 0}
            items={t<string[]>({ ko: ["XRP 보내기", "원장 확인", "응모 확정"], en: ["Send XRP", "Ledger check", "Entry confirmed"], ja: ["XRP送金", "台帳確認", "応募確定"], zh: ["发送 XRP", "账本确认", "参与确认"], es: ["Enviar XRP", "Verificar", "Confirmada"] })} />
          {holdUntil && !done && (
            <div style={{ fontSize: 14.5, lineHeight: 1.5, color: holdLeft !== null && holdLeft < 5 * 60_000 ? "var(--warn-text)" : "var(--ink-2)", background: "var(--sec-alt)", borderRadius: 10, padding: "9px 12px" }}>
              {t({ ko: `자리 확보 중 · 남은 시간 ${fmtLeft(holdLeft)} — 이 시간 안에 입금이 확인되어야 하며, 창을 열어 두면 자동으로 연장됩니다.`, en: `Your spot is held · ${fmtLeft(holdLeft)} left — the payment must be confirmed within this time; keeping this window open extends it automatically.`, ja: `席を確保中・残り${fmtLeft(holdLeft)} — この時間内に入金が確認される必要があります。ウィンドウを開いたままにすると自動延長されます。`, zh: `已为您保留名额 · 剩余 ${fmtLeft(holdLeft)} — 需在此时间内确认到账；保持窗口打开会自动延长。`, es: `Plaza reservada · quedan ${fmtLeft(holdLeft)} — el pago debe confirmarse en este tiempo; mantener la ventana abierta lo prolonga automáticamente.` })}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--bd-card)", borderRadius: 14, overflow: "hidden" }}>
            <PayRow k={t({ ko: "응모", en: "Entry", ja: "応募", zh: "参与", es: "Entrada" })} v={<b style={{ color: "var(--w-deep)" }}>{ticketName}{"\u00a0"}×{"\u00a0"}1</b>} />
            <PayRow k={t({ ko: "결제 금액", en: "Amount", ja: "金額", zh: "金额", es: "Importe" })} v={<b style={{ fontSize: 21, color: "var(--w-deep)" }}>{price} XRP</b>} />
            <PayRow k={t({ ko: "받는 주소", en: "Destination", ja: "受取アドレス", zh: "收款地址", es: "Destino" })} v={
              <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                <span className="mono" style={{ fontSize: 14, color: "var(--ink-2)", wordBreak: "break-all" }}>{st.destination}</span>
                <button className="btn-ghost" onClick={() => copy(st.destination, "dest")} style={{ padding: "4px 10px", fontSize: 13.5, minHeight: 0 }}>{copyLabel("dest")}</button>
              </span>} />
            <PayRow k="Destination Tag" last v={
              <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                <span className="mono" style={{ fontSize: 16, fontWeight: 800, color: "var(--w-deep)" }}>{entry?.destTag ?? "…"}</span>
                {entry && <button className="btn-ghost" onClick={() => copy(String(entry.destTag), "tag")} style={{ padding: "4px 10px", fontSize: 13.5, minHeight: 0 }}>{copyLabel("tag")}</button>}
              </span>} />
          </div>
          {mode === "test" && (
            <div style={{ fontSize: 14, color: "#b45309", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "9px 12px" }}>
              {t({ ko: `래플 리허설 모드 - 응모 기록은 테스트 장부에 저장됩니다. 응모 금액은 실제와 같은 ${price} XRP 이며, 리허설 입금은 종료 후 반환됩니다.`, en: `Raffle rehearsal - entries go to the test ledger. The amount is the real ${price} XRP; rehearsal deposits are returned afterwards.`, ja: `ラッフルリハーサル - 応募記録はテスト台帳に保存されます。金額は実際と同じ${price} XRPで、リハーサルの入金は終了後に返還します。`, zh: `抽奖彩排模式 - 参与记录保存在测试账本。金额与实际相同（${price} XRP），彩排入金将在结束后退还。`, es: `Ensayo del sorteo: las entradas van al libro de prueba. El importe es el real (${price} XRP); los depósitos del ensayo se devuelven después.` })}
            </div>
          )}
          {st.phase === "OPEN" && st.remaining > 0 && st.remaining <= 20 && (
            <Alert>{t({ ko: `남은 자리 ${st.remaining}. 결제 확정 순서로 반영되며, 확정 전에 정원이 차면 응모는 확정되지 않고 입금액은 환불됩니다.`, en: `${st.remaining} spots left. Entries are confirmed in payment order; if capacity fills before yours is confirmed, the entry is not confirmed and the deposit is refunded.`, ja: `残り${st.remaining}枠。決済確定順に反映され、確定前に定員に達した場合は応募が確定せず入金は返金されます。`, zh: `仅剩 ${st.remaining} 个名额。按支付确认顺序生效；若在确认前满员，参与不生效，款项将退还。`, es: `Quedan ${st.remaining} plazas. Se confirman por orden de pago; si se completa antes de confirmar la suya, la entrada no se confirma y se devuelve el depósito.` })}</Alert>
          )}
          <Alert>
            {t({ ko: "외부 지갑에서 보낼 때는 Destination Tag 를 반드시 입력하세요. 태그가 없으면 응모와 연결되지 않습니다. XRP 만 인정됩니다 - RLUSD·다른 토큰은 받지 않습니다.", en: "If you send from an external wallet you must include the Destination Tag - without it the payment can't be matched to your entry. XRP only: RLUSD and other tokens are not accepted.", ja: "外部ウォレットから送る場合は必ずDestination Tagを入力してください。タグがないと応募と紐付きません。XRPのみ有効で、RLUSD・他のトークンは受け付けません。", zh: "从外部钱包转账时务必填写 Destination Tag，否则无法匹配到您的参与记录。仅接受 XRP，不接受 RLUSD 或其他代币。", es: "Si envía desde una billetera externa, incluya el Destination Tag; sin él no se puede vincular el pago. Solo XRP: no se acepta RLUSD ni otros tokens." })}
          </Alert>
          {address && walletKind && (
            <div style={{ border: `1px solid ${enough ? "var(--w-main)" : "var(--warn-bd)"}`, background: enough ? "var(--w-tint)" : "var(--warn-bg)", borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 16.5, fontWeight: 800, color: enough ? "var(--w-deep)" : "var(--warn-text)" }}>
                  {!bal ? t({ ko: "지갑 잔액 확인 중…", en: "Checking wallet balance…", ja: "残高を確認中…", zh: "正在检查钱包余额…", es: "Comprobando saldo…" })
                    : enough ? t({ ko: "✓ 연결된 지갑에 XRP 가 충분합니다", en: "✓ Your wallet has enough XRP", ja: "✓ ウォレットに十分なXRPがあります", zh: "✓ 钱包 XRP 余额充足", es: "✓ Su billetera tiene XRP suficiente" })
                    : !bal.activated ? t({ ko: "이 지갑은 아직 활성화되지 않았습니다 (XRP 0)", en: "This wallet isn't activated yet (0 XRP)", ja: "このウォレットはまだ有効化されていません（XRP 0）", zh: "此钱包尚未激活（0 XRP）", es: "Esta billetera aún no está activada (0 XRP)" })
                    : t({ ko: "연결된 지갑의 XRP 가 부족합니다", en: "Not enough XRP in your wallet", ja: "ウォレットのXRPが不足しています", zh: "钱包 XRP 余额不足", es: "No hay XRP suficiente" })}
                </span>
                <span className="mono" style={{ fontSize: 14.5, color: "var(--ink-2)" }}>{t({ ko: "잔액", en: "Balance", ja: "残高", zh: "余额", es: "Saldo" })} {bal ? bal.xrp.toFixed(2) : "…"} / {t({ ko: "필요 약", en: "need ~", ja: "必要 約", zh: "需要约", es: "necesita ~" })} {need.toFixed(1)} XRP</span>
              </div>
              {bal && !enough && (
                <>
                  <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--ink-2)", margin: 0 }}>
                    {t({ ko: `거래소나 다른 지갑에서 아래 내 주소로 XRP 를 보낸 뒤 '다시 확인' 을 누르세요. 필요 금액에는 응모 ${price} XRP 외에 계정 예치금·래플 NFT 예치금·수수료가 들어 있습니다(빠져나가는 것이 아니라 지갑에 남습니다). 본인 지갑으로 입금할 때는 태그가 필요 없습니다. 또는 XRP 가 있는 다른 지갑에서 위 받는 주소로 직접 보내고 아래에 해시를 입력해도 됩니다.`, en: `Send XRP to your address below from an exchange or another wallet, then tap 'Re-check'. Besides the ${price} XRP entry the amount covers the account reserve, the raffle NFT reserve and fees (kept in your wallet, not spent). No tag is needed when depositing to your own wallet. Or pay directly from another wallet to the destination above and paste the hash below.`, ja: `取引所や他のウォレットから下記の自分のアドレスへXRPを送り、「再確認」を押してください。必要額には応募${price} XRPのほか、アカウント準備金・ラッフルNFT準備金・手数料が含まれます（消費されずウォレットに残ります）。自分のウォレットへの入金にタグは不要です。または、XRPのある他のウォレットから上記の受取アドレスへ直接送り、下にハッシュを入力しても構いません。`, zh: `从交易所或其他钱包向下方您的地址发送 XRP，然后点击“重新检查”。所需金额除 ${price} XRP 参与费外，还包含账户储备、抽奖 NFT 储备及手续费（保留在钱包中，不会扣除）。转入本人钱包无需标签。也可用持有 XRP 的其他钱包直接向上方收款地址付款并在下方输入哈希。`, es: `Envíe XRP a su dirección de abajo desde un exchange u otra billetera y pulse 'Volver a comprobar'. Además de los ${price} XRP, el importe cubre la reserva de cuenta, la reserva del NFT y las comisiones (se quedan en su billetera). No hace falta tag al depositar en su propia billetera. O pague desde otra billetera al destino de arriba y pegue el hash abajo.` })}
                  </p>
                  <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                    {qr
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={qr} alt="QR" width={104} height={104} style={{ display: "block", borderRadius: 8, border: "1px solid var(--bd-card)", background: "#fff" }} />
                      : <span style={{ width: 104, height: 104, borderRadius: 8, background: "#fff", border: "1px solid var(--bd-card)", display: "block" }} />}
                    <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".1em", color: "var(--cap)" }}>{t({ ko: "내 XRPL 주소", en: "MY XRPL ADDRESS", ja: "自分のXRPLアドレス", zh: "我的 XRPL 地址", es: "MI DIRECCIÓN XRPL" })}</span>
                      <span className="mono" style={{ fontSize: 13.5, color: "var(--ink-2)", wordBreak: "break-all" }}>{bal.address}</span>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button className="btn-outline-deep" onClick={() => copy(bal.address, "addr")} style={{ padding: "9px 14px", fontSize: 15, borderRadius: 10 }}>{copied === "addr" ? t({ ko: "복사됨 ✓", en: "Copied ✓", ja: "コピー済み ✓", zh: "已复制 ✓", es: "Copiado ✓" }) : t({ ko: "주소 복사", en: "Copy address", ja: "アドレスをコピー", zh: "复制地址", es: "Copiar dirección" })}</button>
                        <button className="btn-ghost" onClick={refreshBal} style={{ padding: "9px 14px", fontSize: 15, borderRadius: 10 }}>{t({ ko: "다시 확인", en: "Re-check", ja: "再確認", zh: "重新检查", es: "Volver a comprobar" })}</button>
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: "var(--cap)", margin: 0 }}>
                    {t({ ko: "회사가 XRP 를 대신 넣어 드리지 않습니다. 입금이 원장에 반영되면 결제 버튼이 자동으로 열립니다(보통 몇 초, 거래소 출금은 몇 분).", en: "We do not fund XRP for you. Once the deposit lands on the ledger the pay button opens automatically (seconds; exchange withdrawals can take minutes).", ja: "会社がXRPを代わりに入金することはありません。入金が台帳に反映されると決済ボタンが自動で有効になります（通常数秒、取引所出金は数分）。", zh: "公司不会代为充入 XRP。充值写入账本后付款按钮会自动开启（通常几秒，交易所提现需几分钟）。", es: "No depositamos XRP por usted. Cuando el depósito llegue al ledger, el botón de pago se activa solo (segundos; desde un exchange, minutos)." })}
                  </p>
                </>
              )}
            </div>
          )}
          {address && walletKind && (
            <button className={`btn-main${payStatus !== "idle" ? " is-busy" : ""}`} style={cta} disabled={payStatus !== "idle" || !enough || !entry} onClick={pay}>
              {payStatus === "signing" ? t({ ko: "지갑에서 서명 중…", en: "Signing in wallet…", ja: "ウォレットで署名中…", zh: "钱包签名中…", es: "Firmando en la billetera…" })
                : payStatus === "verifying" ? t({ ko: "원장 확인 중…", en: "Confirming on ledger…", ja: "台帳確認中…", zh: "账本确认中…", es: "Confirmando en el ledger…" })
                : t({ ko: `연결된 지갑에서 ${price} XRP 결제하기`, en: `Pay ${price} XRP from connected wallet`, ja: `接続中のウォレットで${price} XRPを支払う`, zh: `使用已连接钱包支付 ${price} XRP`, es: `Pagar ${price} XRP desde la billetera conectada` })}
            </button>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 14.5, color: "var(--ink-4)" }}>{t({ ko: "다른 지갑에서 보냈다면 트랜잭션 해시를 입력하세요", en: "Sent from another wallet? Paste the transaction hash", ja: "他のウォレットから送った場合はハッシュを入力", zh: "从其他钱包转账？请输入交易哈希", es: "¿Envió desde otra billetera? Pegue el hash" })}</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="field-input" value={hash} onChange={(e) => setHash(e.target.value.trim())} placeholder="A1B2C3…" style={{ flex: 1, fontFamily: "monospace" }} />
              <button className="btn-ghost" disabled={payStatus !== "idle" || !/^[0-9A-Fa-f]{64}$/.test(hash)} onClick={() => verify(hash.toUpperCase())} style={{ padding: "0 16px", whiteSpace: "nowrap" }}>
                {t({ ko: "확인", en: "Verify", ja: "確認", zh: "确认", es: "Verificar" })}
              </button>
            </div>
          </div>
          {err && <Alert>{err}</Alert>}
        </>
      );
      /* ── ④ 래플 NFT 수령 → 완료 (래플 고유 단계 - 결제 확정 뒤 NFT 가 발행되고 지갑이 수락한다) ── */
      case 4: return held && mine ? (
        <>
          <h3 style={h3}>{t({ ko: `응모 완료 · 래플 번호 #${no}`, en: `You're in · Ticket #${no}`, ja: `応募完了 · No.${no}`, zh: `参与成功 · 编号 #${no}`, es: `Inscrito · N.º ${no}` })}</h3>
          <PayProgress cur={3} items={t<string[]>({ ko: ["NFT 발행", "지갑 수락", "완료"], en: ["NFT minted", "Accepted", "Done"], ja: ["NFT発行", "受取", "完了"], zh: ["NFT 发行", "已接受", "完成"], es: ["NFT emitido", "Aceptado", "Listo"] })} />
          <p style={{ fontSize: 16, lineHeight: 1.65, color: "var(--ink-2)", margin: 0 }}>
            {t({ ko: `래플 NFT 가 지갑으로 전송되었습니다. 당첨 경품은 ${fmtDate(st.config.drawAt, lang)} 본 페이지와 X·텔레그램에서 발표되고 NFT 카드에 표시됩니다.`, en: `The raffle NFT is in your wallet. Prizes are announced ${fmtDate(st.config.drawAt, lang)} on this page, X and Telegram, and shown on the NFT card.`, ja: `ラッフルNFTがウォレットへ転送されました。当選賞品は${fmtDate(st.config.drawAt, lang)}に本ページとX・Telegramで発表され、NFTカードに表示されます。`, zh: `抽奖 NFT 已转入您的钱包。中奖奖品将于 ${fmtDate(st.config.drawAt, lang)} 在本页及 X、Telegram 公布，并显示在 NFT 卡上。`, es: `El NFT del sorteo está en su billetera. Los premios se anuncian el ${fmtDate(st.config.drawAt, lang)} en esta página, X y Telegram, y se muestran en la tarjeta NFT.` })}
          </p>
          <TicketCard mine={mine} t={t} lang={lang} />
          {mine.pass?.nftTokenId && <div className="mono" style={{ fontSize: 12, color: "var(--cap)", wordBreak: "break-all", fontWeight: 400 }}>NFT {mine.pass.nftTokenId}</div>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a href={`https://x.com/intent/post?text=${encodeURIComponent(`XRP SEOUL 2026 raffle - I'm in with ticket #${no} 🎟️ @wellbianlabs`)}&url=${encodeURIComponent("https://wellbian.io/event/xrpl-seoul")}`} target="_blank" rel="noopener" className="btn-ghost" style={{ padding: "0 18px" }}>
              {t({ ko: "X 에 공유", en: "Share on X", ja: "Xで共有", zh: "分享到 X", es: "Compartir en X" })}
            </a>
            <button className="btn-main" onClick={onClose} style={{ padding: "0 26px", borderRadius: 12, flex: 1 }}>{t({ ko: "닫기", en: "Close", ja: "閉じる", zh: "关闭", es: "Cerrar" })}</button>
          </div>
        </>
      ) : (
        <>
          <h3 style={h3}>{t({ ko: `결제 완료 · 래플 번호 #${no}`, en: `Payment complete · Ticket #${no}`, ja: `決済完了 · No.${no}`, zh: `支付完成 · 编号 #${no}`, es: `Pago completado · N.º ${no}` })}</h3>
          <PayProgress cur={mine?.pass?.offerIndex ? 1 : 0} items={t<string[]>({ ko: ["NFT 발행", "지갑 수락", "완료"], en: ["NFT minted", "Accept", "Done"], ja: ["NFT発行", "受取", "完了"], zh: ["NFT 发行", "接受", "完成"], es: ["NFT emitido", "Aceptar", "Listo"] })} />
          {mine?.pass?.offerIndex ? (
            <>
              <p style={{ fontSize: 16, lineHeight: 1.65, color: "var(--ink-2)", margin: 0 }}>{t({ ko: "래플 NFT 가 발행되었습니다. 수락 서명을 하면 지갑으로 전송됩니다(NFT 예치금 0.2 XRP 가 지갑에 잠깁니다).", en: "Your raffle NFT has been minted. Sign to accept and it is transferred to your wallet (0.2 XRP is locked as NFT reserve).", ja: "ラッフルNFTが発行されました。承認の署名を行うとウォレットへ転送されます（NFT準備金0.2 XRPがロックされます）。", zh: "抽奖 NFT 已发行。签名接受后将转入您的钱包（0.2 XRP 作为 NFT 储备锁定）。", es: "Su NFT del sorteo ha sido emitido. Firme para aceptarlo y pasará a su billetera (se bloquean 0,2 XRP de reserva)." })}</p>
              <button className={`btn-main${busy ? " is-busy" : ""}`} style={cta} disabled={busy} onClick={accept}>
                {busy ? t({ ko: "지갑에서 서명 중…", en: "Signing in wallet…", ja: "ウォレットで署名中…", zh: "钱包签名中…", es: "Firmando…" }) : t({ ko: "NFT 받기 (서명)", en: "Accept NFT (sign)", ja: "NFTを受け取る（署名）", zh: "接受 NFT（签名）", es: "Aceptar NFT (firmar)" })}
              </button>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16, color: "var(--ink-2)", background: "var(--sec-alt)", border: "1px solid var(--bd-card)", borderRadius: 12, padding: "14px 16px", lineHeight: 1.6 }}>
              <span className="pulse" style={{ width: 8, height: 8, borderRadius: 99, background: "var(--w-main)", flex: "none" }} />
              <span>{t({ ko: "래플 NFT 를 발행하고 있습니다 (약 1~3분 소요). 창을 닫아도 본 페이지 '내 응모'에서 이어서 수령할 수 있습니다.", en: "Minting your raffle NFT (about 1-3 minutes). You may close this window and continue from 'My entry' on this page.", ja: "ラッフルNFTを発行中です（約1〜3分）。ウィンドウを閉じても本ページの「マイ応募」から続きを受け取れます。", zh: "正在发行抽奖 NFT（约 1-3 分钟）。关闭窗口后也可在本页“我的参与”继续领取。", es: "Emitiendo su NFT (1-3 minutos aprox.). Puede cerrar esta ventana y continuar desde 'Mi entrada' en esta página." })}</span>
            </div>
          )}
          {err && <Alert>{err}</Alert>}
        </>
      );
    }
  })();

  return (
    <div className="overlay" style={{ zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget && !locked) onClose(); }}>
      <div className="modal-card easy" role="dialog" aria-modal="true" aria-label={t({ ko: "래플 응모", en: "Raffle entry", ja: "ラッフル応募", zh: "抽奖参与", es: "Participar en el sorteo" })} ref={dialogRef} tabIndex={-1} style={{ outline: "none" }}>
        <div className="sheet-handle" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="mstep-ind">
            {stepNames.map((name, i) => (
              <span key={name} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                {i > 0 && <span className={`mstep-line${i + 1 <= step ? " done" : ""}`} />}
                <span className={`mstep-dot ${i + 1 < step ? "done" : i + 1 === step ? "cur" : "todo"}`} aria-current={i + 1 === step ? "step" : undefined}>
                  {i + 1 < step ? "✓" : i + 1}
                </span>
                <span className={`mstep-label${i + 1 === step ? " cur" : ""}`}>{name}</span>
              </span>
            ))}
          </div>
          <button onClick={onClose} disabled={locked} aria-label={t({ ko: "닫기", en: "Close", ja: "閉じる", zh: "关闭", es: "Cerrar" })} style={{ color: "var(--dis)", fontSize: 23.5, lineHeight: 1 }}>✕</button>
        </div>
        {/* 결제 방법 표시 - 구매 모달의 방법 배지 자리. 래플은 XRP 하나뿐이라 고르는 화면 없이 배지만 둔다 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span className="pill" style={{ fontSize: 14.5, fontWeight: 800, padding: "5px 12px", color: "var(--w-main)", background: "var(--w-tint)", border: "1px solid currentColor" }}>◈ {methodName}</span>
          <span style={{ fontSize: 14.5, color: "var(--cap)" }}>{t({ ko: "XRP 만 · 카드·RLUSD 불가", en: "XRP only · no card, no RLUSD", ja: "XRPのみ・カード・RLUSD不可", zh: "仅限 XRP · 不支持银行卡/RLUSD", es: "Solo XRP · sin tarjeta ni RLUSD" })}</span>
          {mode === "test" && <span className="pill" style={{ fontSize: 12.5, padding: "3px 9px", color: "#b45309", background: "#fff7ed", border: "1px solid #fed7aa" }}>REHEARSAL</span>}
        </div>
        <div key={step} className="step-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {stepBody}
        </div>
        {step === 2 && (
          <button onClick={() => setStep(1)} style={{ fontSize: 16, color: "var(--cap)", alignSelf: "flex-start" }}>
            {t({ ko: "← 이전 단계", en: "← Back", ja: "← 前の手順", zh: "← 上一步", es: "← Atrás" })}
          </button>
        )}
      </div>
    </div>
  );
}

/* XRPL 엔진 코드를 사람이 읽을 안내로 - XRP 결제에서 나올 것만 (RLUSD 의 tecPATH_DRY 계열은 여기 없다). */
function friendlyXrpError(msg: string, t: ReturnType<typeof useI18n>["t"]): string {
  const m = msg || "";
  if (/tecUNFUNDED_PAYMENT|tecUNFUNDED|tecINSUFFICIENT_RESERVE|tecINSUF_RESERVE|tecINSUFFICIENT_FUNDS/.test(m)) {
    return t({ ko: "지갑의 XRP 가 부족합니다(예치금 포함). 위 안내대로 XRP 를 채우거나, XRP 가 있는 다른 지갑에서 보낸 뒤 해시를 입력하세요.", en: "Not enough XRP in the wallet (including reserves). Top it up as described above, or pay from another wallet and paste the hash.", ja: "ウォレットのXRPが不足しています（準備金を含む）。上の案内に従って入金するか、他のウォレットから送ってハッシュを入力してください。", zh: "钱包 XRP 不足（含储备金）。请按上方说明充值，或用其他钱包付款并输入哈希。", es: "No hay XRP suficiente (incluidas las reservas). Recargue como se indica o pague desde otra billetera y pegue el hash." });
  }
  if (/actNotFound/.test(m)) {
    return t({ ko: "지갑이 아직 활성화되지 않았습니다. 위 안내대로 XRP 를 먼저 입금해 주세요.", en: "The wallet isn't activated yet. Please deposit XRP first as described above.", ja: "ウォレットがまだ有効化されていません。上の案内に従って先にXRPを入金してください。", zh: "钱包尚未激活，请先按上方说明充值 XRP。", es: "La billetera aún no está activada. Deposite XRP primero como se indica." });
  }
  if (/tecNO_DST|tecDST_TAG_NEEDED|temBAD_/.test(m)) {
    return t({ ko: "받는 주소 설정에 문제가 있습니다. admin@wellbianlabs.io 로 알려 주세요.", en: "There is a problem with the destination. Please contact admin@wellbianlabs.io.", ja: "受取アドレスの設定に問題があります。admin@wellbianlabs.io までご連絡ください。", zh: "收款地址设置有问题，请联系 admin@wellbianlabs.io。", es: "Hay un problema con el destino. Escriba a admin@wellbianlabs.io." });
  }
  if (/tecOBJECT_NOT_FOUND/.test(m)) {
    return t({ ko: "이 NFT 오퍼는 이미 처리되었습니다. 잠시 후 상태가 갱신됩니다.", en: "This NFT offer was already handled. The status will refresh shortly.", ja: "このNFTオファーはすでに処理済みです。まもなく状態が更新されます。", zh: "此 NFT 报价已处理，状态稍后更新。", es: "Esta oferta de NFT ya se procesó. El estado se actualizará en breve." });
  }
  return m;
}

/* 결제 단계 안의 소진행 (구매 모달과 같은 모양: 송금 → 원장 확인 → 완료) */
function PayProgress({ items, cur }: { items: string[]; cur: number }) {
  return (
    <ol style={{ display: "flex", gap: 6, listStyle: "none", margin: 0, padding: 0 }}>
      {items.map((label, i) => {
        const state = i < cur ? "done" : i === cur ? "cur" : "todo";
        return (
          <li key={label} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ height: 6, borderRadius: 99, background: state === "todo" ? "var(--line)" : "var(--w-main)", opacity: state === "done" ? 0.55 : 1 }} />
            <span style={{ fontSize: 13.5, fontWeight: state === "cur" ? 800 : 600, color: state === "todo" ? "var(--hint)" : state === "cur" ? "var(--w-main)" : "var(--ink-4)" }}>
              {state === "done" ? "✓ " : `${i + 1}. `}{label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" style={{ display: "flex", gap: 10, border: "1px solid var(--warn-bd)", background: "var(--warn-bg)", borderRadius: 12, padding: "13px 16px", fontSize: 16, lineHeight: 1.6, color: "var(--warn-text)" }}>
      <span style={{ flex: "none", marginTop: 2 }}>
        <svg width={15} height={15} viewBox="0 0 24 24" fill="#c0392b"><path d="M12 2 23 21H1L12 2zm-1 7v6h2V9h-2zm0 8v2h2v-2h-2z" /></svg>
      </span>
      <span>{children}</span>
    </div>
  );
}

function TermCard({ checked, onToggle, title, desc }: { checked: boolean; onToggle: () => void; title: string; desc: string }) {
  return (
    <button onClick={onToggle} role="checkbox" aria-checked={checked} style={{ display: "flex", gap: 12, border: checked ? "1px solid var(--w-main)" : "1px solid var(--bd-card)", background: checked ? "var(--panel)" : "#fff", borderRadius: 14, padding: "16px 18px", alignItems: "flex-start", textAlign: "left" }}>
      <span style={{ width: 22, height: 22, borderRadius: 7, background: checked ? "var(--w-main)" : "#fff", border: checked ? "none" : "1.5px solid var(--bd-input)", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none", marginTop: 1 }}>
        {checked && <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4L19 6" /></svg>}
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: "var(--w-deep)" }}>{title}</span>
        <span style={{ fontSize: 16, lineHeight: 1.6, color: "var(--ink-4)" }}>{desc}</span>
      </span>
    </button>
  );
}

function PayRow({ k, v, last }: { k: string; v: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "14px 18px", fontSize: 17.5, borderBottom: last ? "none" : "1px solid var(--line)" }}>
      <span style={{ color: "var(--ink-4)", flex: "none" }}>{k}</span>
      <span style={{ textAlign: "right", minWidth: 0 }}>{v}</span>
    </div>
  );
}

const h3: React.CSSProperties = { fontSize: 27, fontWeight: 800, color: "var(--w-deep)", lineHeight: 1.3 };
const cta: React.CSSProperties = { fontSize: 20, padding: 18, width: "100%", minHeight: 60 };
