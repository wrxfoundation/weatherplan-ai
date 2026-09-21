"use client";
/* XRP SEOUL 2026 래플 페이지 (2026-09-16 지시). 5 XRP 응모 → 래플 NFT → 블라인드 추첨.
   판매 페이지(/launch)와 코드·데이터를 공유하지 않는다 - 지갑·로그인·아웃박스만 같이 쓴다.
   mode="test" 는 리허설: 격리된 장부·NFT taxon, 금액은 실제와 같은 5 XRP.
   문구는 2026-09-16 지시로 '일반적인 이벤트 안내 형식'(정중한 안내체) - 홍보 카피 톤·설명조 둘 다 사용자가 어색하다고 함.
   응모 결제창은 RaffleCheckoutModal (2026-09-21) - 판매 페이지 구매 모달과 같은 흐름(응모 내용 → 동의 → 결제 → NFT 수령), 결제는 XRP 뿐. */
import { useCallback, useEffect, useState } from "react";
import "@/app/wb-page.css";
import { useI18n } from "@/lib/launch/i18n";
import { useWallet } from "@/lib/wallet/WalletContext";
import RaffleCheckoutModal from "./RaffleCheckoutModal";
import { RaffleHero, RaffleStats, fmtDay } from "./RaffleHero";
import { prizeLabel, prizeNote, prizeWord } from "@/lib/raffle-prizes";
import { TicketCard } from "./TicketCard";
import { RESERVE_XRP, raffleQs as qs, type RaffleMode as Mode, type RaffleStateView as State } from "./types";

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

function useCountdown(target: string | null) {
  const [left, setLeft] = useState("");
  useEffect(() => {
    if (!target) { setLeft(""); return; }
    const tick = () => {
      const ms = Date.parse(target) - Date.now();
      if (ms <= 0) { setLeft("00:00:00"); return; }
      const d = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
      setLeft(`${d > 0 ? d + "d " : ""}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [target]);
  return left;
}

/** 미리보기 전용(스크린샷·SSR 확인) - 실제 화면은 넘기지 않는다. 넘기면 상태 요청 없이 그 값으로 그린다. */
export interface RafflePreview { st: State | null; cd?: string }

export default function RafflePage({ mode, preview }: { mode: Mode; preview?: RafflePreview }) {
  const { lang, t } = useI18n();
  const { address, sessionVerified, openLogin } = useWallet();
  const [st, setSt] = useState<State | null>(preview?.st ?? null);
  const [modal, setModal] = useState(false);
  const [wantOpen, setWantOpen] = useState(false);

  const load = useCallback(async () => {
    try { const r = await fetch(`/api/raffle/state${qs(mode)}`, { cache: "no-store" }); if (r.ok) setSt(await r.json()); } catch { /* 다음 주기 */ }
  }, [mode]);
  useEffect(() => { if (preview) return; load(); const id = setInterval(load, 20000); return () => clearInterval(id); }, [load, address, preview]);

  const cfg = st?.config;
  const phase = st?.phase ?? "BEFORE";
  const target = phase === "BEFORE" ? cfg?.open : phase === "OPEN" ? cfg?.close : null;
  /* 보류 상태(2026-09-17): 관리자 설정 open 이 1년 이상 뒤면 일정 미정으로 본다 - 날짜 대신 "추후 공지", 카운트다운 없음 */
  const onHold = !!cfg && Date.parse(cfg.open) > Date.now() + 365 * 86400_000;
  const cdLive = useCountdown(onHold || preview ? null : (target ?? null));
  const cd = preview?.cd ?? cdLive;
  const tba = t({ ko: "추후 공지", en: "TBA", ja: "後日発表", zh: "另行通知", es: "Por anunciar" });
  const mine = st?.mine ?? null;
  const done = !!mine && mine.status === "PAID";
  const held = done && mine?.pass?.state === "CLAIMED";

  const cta = () => {
    if (!address || !sessionVerified) { setWantOpen(true); openLogin(); return; }
    setModal(true);
  };
  /* 참여 버튼을 눌렀다가 로그인한 경우 - 내 응모 상태를 새로 읽은 뒤 결제창을 바로 연다(버튼을 다시 누르게 하지 않는다, 2026-09-21 점검) */
  useEffect(() => {
    if (!wantOpen || !address || !sessionVerified || preview) return;
    let live = true;
    load().then(() => { if (live) { setWantOpen(false); setModal(true); } });
    return () => { live = false; };
  }, [wantOpen, address, sessionVerified, load, preview]);
  /* 카운트다운이 0 이 되면 20초 주기를 기다리지 않고 바로 상태를 읽는다(시작·마감 순간) */
  useEffect(() => { if (cd === "00:00:00" && !preview) load(); }, [cd, load, preview]);
  /* FAQ "전원 당첨" 의 경품 목록 - 설정값에서 만든다(예전엔 290/10/50/150 을 글에 박아 두어 설정과 어긋날 수 있었다) */
  const prizeList = (cfg?.prizes ?? []).map((p) => prizeWord(p, lang)).join(" · ") || "…";
  const prizeSum = (cfg?.prizes ?? []).reduce((a, p) => a + p.qty, 0) || (cfg?.maxEntries ?? 500);

  const price = cfg?.priceXrp ?? 5;

  return (
    <div className="wb-page full-bleed">
      {/* ── 히어로 + 스탯 줄 (2026-09-21 정적 시안 이식 - RaffleHero.tsx) ── */}
      <RaffleHero st={st} phase={phase} done={done} held={held} mine={mine} onHold={onHold} tba={tba} cd={cd} onCta={cta} onOpen={() => setModal(true)} />
      <RaffleStats st={st} onHold={onHold} tba={tba} />

      {/* ── 경품 ── */}
      <section className="sec-pad" id="prizes"><div className="wrap">
        <div className="section-header">
          <h2>{t({ ko: "경품", en: "Prizes", ja: "賞品", zh: "奖品", es: "Premios" })}</h2>
          <div className="section-coord"><div>{t({ ko: `총 ${cfg?.maxEntries ?? 500}명 · 전원 당첨 · 경품 종류만 추첨`, en: `${cfg?.maxEntries ?? 500} entrants · everyone wins · the draw decides the prize`, ja: `計${cfg?.maxEntries ?? 500}名・全員当選・賞品の種類のみ抽選`, zh: `共 ${cfg?.maxEntries ?? 500} 名 · 人人有奖 · 仅抽奖决定奖品种类`, es: `${cfg?.maxEntries ?? 500} participantes · todos ganan · el sorteo decide el premio` })} · COMMIT-REVEAL</div></div>
        </div>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))" }}>
          {(cfg?.prizes ?? []).map((p, i) => (
            <div key={i} className="panel" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span className="badge cyan" style={{ alignSelf: "flex-start" }}>{t({ ko: `${p.qty}명`, en: `${p.qty} winners`, ja: `${p.qty}名`, zh: `${p.qty} 名`, es: `${p.qty} ganadores` })}</span>
              <div style={{ fontSize: 19, fontWeight: 800 }}>{prizeLabel(p.name, lang)}</div>
              {prizeNote(p, lang) && <div className="dim" style={{ fontSize: 14.5 }}>{prizeNote(p, lang)}</div>}
            </div>
          ))}
        </div>
      </div></section>

      {/* ── 방법 ── */}
      <section className="sec-pad" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="section-header">
          <h2>{t({ ko: "참여 방법", en: "How it works", ja: "参加方法", zh: "参与方式", es: "Cómo participar" })}</h2>
          <div className="section-coord"><div>3 STEPS · {t({ ko: "약 3분 소요", en: "about 3 minutes", ja: "所要約3分", zh: "约需 3 分钟", es: "unos 3 minutos" })}</div></div>
        </div>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))" }}>
          {[
            t({ ko: ["회원가입 · 로그인", "이메일 또는 구글 계정으로 가입하면 XRPL 지갑이 자동 생성됩니다. 기존 지갑이 있는 경우 연결하여 사용할 수 있습니다."], en: ["Sign up · log in", "Sign up with email or Google and an XRPL wallet is created automatically. An existing wallet can be connected instead."], ja: ["会員登録・ログイン", "メールまたはGoogleアカウントで登録するとXRPLウォレットが自動作成されます。既存のウォレットを接続して利用することもできます。"], zh: ["注册 · 登录", "使用邮箱或 Google 账号注册后将自动创建 XRPL 钱包。如已有钱包，可直接连接使用。"], es: ["Registro · inicio de sesión", "Al registrarse con correo o Google se crea automáticamente una billetera XRPL. También puede conectar una billetera existente."] }),
            t({ ko: [`${price} XRP 결제`, "지갑에 XRP 를 입금한 뒤 응모 버튼을 누르면 서명 한 번으로 결제가 완료됩니다. 다른 지갑에서 송금하는 경우 Destination Tag 를 반드시 입력해야 합니다."], en: [`Pay ${price} XRP`, "Deposit XRP into your wallet, press Enter and sign once to complete payment. When sending from another wallet, the Destination Tag is required."], ja: [`${price} XRP決済`, "ウォレットにXRPを入金し応募ボタンを押すと、署名1回で決済が完了します。他のウォレットから送金する場合はDestination Tagの入力が必須です。"], zh: [`支付 ${price} XRP`, "钱包充入 XRP 后点击参与按钮，签名一次即完成支付。从其他钱包汇款时必须填写 Destination Tag。"], es: [`Pagar ${price} XRP`, "Deposite XRP en su billetera, pulse Participar y firme una vez para completar el pago. Si envía desde otra billetera, el Destination Tag es obligatorio."] }),
            t({ ko: ["래플 NFT 발급 · 추첨", "결제 확인 후 래플 번호와 QR 코드가 포함된 NFT 가 발급됩니다. 응모 마감 후 블라인드 추첨 결과를 본 페이지와 공식 채널에 공개합니다."], en: ["Raffle NFT · draw", "After payment is confirmed, an NFT containing your raffle number and QR code is issued. After entries close, the blind draw results are published on this page and official channels."], ja: ["ラッフルNFT発行・抽選", "決済確認後、ラッフル番号とQRコードを含むNFTが発行されます。応募締切後、ブラインド抽選の結果を本ページと公式チャンネルで公開します。"], zh: ["发放抽奖 NFT · 开奖", "支付确认后发放含抽奖编号与二维码的 NFT。报名截止后，盲抽结果将在本页及官方渠道公布。"], es: ["NFT del sorteo · sorteo", "Tras confirmar el pago se emite un NFT con su número de sorteo y código QR. Al cerrar las inscripciones, los resultados del sorteo ciego se publican en esta página y en los canales oficiales."] }),
          ].map(([h, d], i) => (
            <div key={i} className="panel">
              <div className="mono" style={{ fontSize: 12.5, color: "var(--ink-faint)", marginBottom: 6 }}>STEP {i + 1}</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{h}</div>
              <div style={{ fontSize: 15, lineHeight: 1.65, color: "var(--ink-dim)" }}>{d}</div>
            </div>
          ))}
        </div>
      </div></section>

      {/* ── 내 응모 ── */}
      {address && (
        <section className="sec-pad" style={{ paddingTop: 0 }}><div className="wrap">
          <div className="section-header">
            <h2>{t({ ko: "내 응모", en: "My entry", ja: "マイ応募", zh: "我的参与", es: "Mi entrada" })}</h2>
            <div className="section-coord"><div>{address.slice(0, 8)}…{address.slice(-4)}</div></div>
          </div>
          <div className="panel" style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 19, fontWeight: 800 }}>
                {!mine ? t({ ko: "응모 내역이 없습니다", en: "No entry yet", ja: "応募履歴がありません", zh: "暂无参与记录", es: "Sin participación" })
                  : mine.status === "OVERFLOW" ? t({ ko: "확정되지 않은 결제 · 환불 대상", en: "Payment not confirmed · refund due", ja: "未確定の決済・返金対象", zh: "未确认的支付 · 待退款", es: "Pago no confirmado · reembolso pendiente" })
                  : mine.status !== "PAID" ? t({ ko: "결제 대기 중", en: "Awaiting payment", ja: "決済待ち", zh: "待支付", es: "Pago pendiente" })
                  : t({ ko: `래플 번호 #${String(mine.entryNo ?? 0).padStart(4, "0")}`, en: `Ticket #${String(mine.entryNo ?? 0).padStart(4, "0")}`, ja: `ラッフル番号 #${String(mine.entryNo ?? 0).padStart(4, "0")}`, zh: `编号 #${String(mine.entryNo ?? 0).padStart(4, "0")}`, es: `N.º ${String(mine.entryNo ?? 0).padStart(4, "0")}` })}
              </div>
              <div style={{ fontSize: 14.5, color: "var(--ink-dim)" }}>
                {done && (mine!.pass?.state === "CLAIMED"
                  ? t({ ko: "래플 NFT 보유 중 ✓", en: "Raffle NFT held ✓", ja: "ラッフルNFT保有中 ✓", zh: "已持有抽奖 NFT ✓", es: "NFT del sorteo recibido ✓" })
                  : mine!.pass?.offerIndex
                    ? t({ ko: "NFT 발행 완료 · 지갑에서 수락해 주세요", en: "NFT minted · please accept it in your wallet", ja: "NFT発行完了 · ウォレットで承認してください", zh: "NFT 已发行 · 请在钱包中接受", es: "NFT emitido · acéptelo en su billetera" })
                    : t({ ko: "래플 NFT 발행 중 (약 1~3분 소요)", en: "Minting raffle NFT (about 1-3 min)", ja: "ラッフルNFT発行中（約1〜3分）", zh: "正在发行抽奖 NFT（约 1-3 分钟）", es: "Emitiendo NFT (1-3 min aprox.)" }))}
                {!done && mine?.status === "OVERFLOW" && t({ ko: "정원·기간 마감 뒤 확인된 입금이라 응모가 확정되지 않았습니다. 입금액은 환불해 드립니다 - admin@wellbianlabs.io 로 지갑 주소와 트랜잭션 해시를 보내 주세요.", en: "The payment was confirmed after entries closed, so the entry was not confirmed. The deposit will be refunded - email admin@wellbianlabs.io with your wallet address and transaction hash.", ja: "定員・期間の締切後に確認された入金のため、応募は確定していません。入金は返金します - admin@wellbianlabs.io へウォレットアドレスとハッシュをお送りください。", zh: "该笔款项在报名截止后确认，参与未生效。款项将退还 - 请将钱包地址与交易哈希发送至 admin@wellbianlabs.io。", es: "El pago se confirmó tras el cierre, así que la participación no se confirmó. Se devolverá el depósito: escriba a admin@wellbianlabs.io con su dirección y el hash." })}
                {!done && mine && mine.status !== "OVERFLOW" && (phase === "OPEN" || mine.holdLive
                  ? t({ ko: `${price} XRP 결제 확인 후 응모가 확정됩니다`, en: `Entry is confirmed once ${price} XRP is received`, ja: `${price} XRPの決済確認後に応募が確定します`, zh: `确认收到 ${price} XRP 后即确认参与`, es: `La participación se confirma al recibir ${price} XRP` })
                  : t({ ko: "정원 또는 기간이 마감되어 결제 전 응모는 확정되지 않습니다. XRP 를 보내지 마세요.", en: "Entries have closed (capacity or deadline), so an unpaid entry can no longer be confirmed. Please do not send XRP.", ja: "定員または期間が締め切られたため、未決済の応募は確定できません。XRPを送らないでください。", zh: "名额已满或报名已截止，未支付的参与无法再确认。请勿再发送 XRP。", es: "Las inscripciones han cerrado (aforo o plazo); una entrada sin pagar ya no puede confirmarse. No envíe XRP." }))}
              </div>
            </div>
            {/* 결제 확정(PAID) 은 페이즈와 무관하게 NFT 수령을 이어 간다. 결제 전(PENDING) 은 응모가 열려 있을 때만 결제로 보낸다 -
                정원·기간 마감 뒤 입금은 확정되지 않고 환불 대상이 되므로(2026-09-21 점검) 버튼을 내린다. */}
            {done && !held && (
              <button type="button" className="btn-primary" onClick={cta}>{t({ ko: "래플 NFT 받기", en: "Collect raffle NFT", ja: "ラッフルNFTを受け取る", zh: "领取抽奖 NFT", es: "Recibir el NFT" })}</button>
            )}
            {!done && mine?.status !== "OVERFLOW" && (phase === "OPEN" || (phase === "SOLD_OUT" && mine?.holdLive)) && (
              <button type="button" className="btn-primary" onClick={cta}>
                {!mine ? t({ ko: "응모하기", en: "Enter", ja: "応募する", zh: "参与", es: "Participar" }) : t({ ko: "계속 진행", en: "Continue", ja: "続ける", zh: "继续", es: "Continuar" })}
              </button>
            )}
          </div>
          {done && mine?.ticketCode && (
            <div className="panel" style={{ marginTop: 12 }}>
              <TicketCard mine={mine} t={t} lang={lang} />
            </div>
          )}
        </div></section>
      )}

      {/* ── 일정 ── */}
      <section className="sec-pad" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="section-header">
          <h2>{t({ ko: "일정", en: "Timeline", ja: "日程", zh: "日程", es: "Calendario" })}</h2>
          <div className="section-coord"><div>KST</div></div>
        </div>
        <div className="panel">
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9, fontSize: 15.5 }}>
            <li><b>{onHold ? tba : fmtDate(cfg?.open, lang)}</b> {t({ ko: "응모 시작", en: "entries open", ja: "応募開始", zh: "开始报名", es: "inicio de inscripciones" })}</li>
            <li><b>{onHold ? tba : fmtDate(cfg?.close, lang)}</b> {t({ ko: `응모 마감 · 기본 모집 기간 1주일, 선착순 ${cfg?.maxEntries ?? 500}명 모집 완료 시 조기 종료`, en: `entries close · 1-week period by default; ends early once ${cfg?.maxEntries ?? 500} entries are filled`, ja: `応募締切・基本募集期間1週間、先着${cfg?.maxEntries ?? 500}名に達した時点で早期終了`, zh: `报名截止 · 默认招募 1 周，${cfg?.maxEntries ?? 500} 名额满即提前结束`, es: `cierre · periodo de 1 semana; termina antes al completarse ${cfg?.maxEntries ?? 500} participantes` })}</li>
            <li><b>{onHold ? tba : fmtDate(cfg?.drawAt, lang)}</b> {t({ ko: "당첨자 발표 · 응모 마감 후 24시간 이내 공식 페이지(본 페이지)를 통해 안내, 당첨 경품은 NFT 카드에 표시", en: "results · announced on the official page (this page) within 24 hours of close; your prize is shown on the NFT card", ja: "当選発表・応募締切後24時間以内に公式ページ（本ページ）でご案内、当選賞品はNFTカードに表示", zh: "公布中奖结果 · 报名截止后 24 小时内通过官方页面（本页）公布，中奖奖品显示在 NFT 卡上", es: "resultados · se anuncian en la página oficial (esta página) en 24 h desde el cierre; el premio se muestra en la tarjeta NFT" })}</li>
            <li><b>{cfg ? fmtDay(cfg.eventAt, lang) : "10.03"}</b> {t({ ko: "실물 경품 지급 · 10월 3일 행사 당일 XRP SEOUL 2026 행사장에서 QR 코드 확인 후 지급(현장 수령만) · 초대권은 발표 후 이메일로 발송", en: "physical prizes · at the XRP SEOUL 2026 venue on 3 October after QR verification (on-site only) · invitations are emailed after the results", ja: "実物賞品のお渡し・10月3日イベント当日、XRP SEOUL 2026会場でQRコード確認後にお渡し（現地受取のみ）・招待券は発表後にメールで送付", zh: "实物奖品发放 · 10 月 3 日活动当天在 XRP SEOUL 2026 会场核验二维码后发放（仅限现场）· 邀请函在公布后通过邮件发送", es: "premios físicos · en el recinto de XRP SEOUL 2026 el 3 de octubre tras verificar el QR (solo presencial) · las invitaciones se envían por correo tras los resultados" })}</li>
          </ul>
        </div>
      </div></section>

      {/* ── FAQ ── */}
      <section className="sec-pad" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="section-header">
          <h2>FAQ</h2>
          <div className="section-coord"><div>{t({ ko: "자주 묻는 질문", en: "Frequently asked questions", ja: "よくあるご質問", zh: "常见问题", es: "Preguntas frecuentes" })}</div></div>
        </div>
        {[
          t({ ko: ["결제 수단은 XRP 만 가능한가요?", "네. 본 이벤트는 XRPL 커뮤니티 행사 참여를 위한 이벤트로, 결제 수단은 XRP 만 지원합니다."], en: ["Is XRP the only payment method?", "Yes. This event is for participation in the XRPL community event, and XRP is the only supported payment method."], ja: ["決済はXRPのみですか？", "はい。本イベントはXRPLコミュニティイベントへの参加を目的としており、決済手段はXRPのみ対応しています。"], zh: ["只能用 XRP 支付吗？", "是的。本活动旨在参与 XRPL 社区活动，仅支持 XRP 支付。"], es: ["¿Solo se puede pagar con XRP?", "Sí. Este evento está orientado a la participación en la comunidad XRPL y solo admite pagos en XRP."] }),
          t({ ko: ["지갑에 XRP 가 얼마나 필요한가요?", `응모 금액 ${price} XRP 와 계정·NFT 예치금, 수수료를 포함하여 약 ${(price + RESERVE_XRP).toFixed(1)} XRP 가 필요합니다. 신규 지갑은 첫 입금 시 자동으로 활성화됩니다.`], en: ["How much XRP is required?", `About ${(price + RESERVE_XRP).toFixed(1)} XRP in total: the ${price} XRP entry plus account and NFT reserves and fees. A new wallet is activated automatically with its first deposit.`], ja: ["XRPはいくら必要ですか？", `応募金額${price} XRPにアカウント・NFTの準備金と手数料を含め、約${(price + RESERVE_XRP).toFixed(1)} XRPが必要です。新規ウォレットは初回入金時に自動で有効化されます。`], zh: ["需要多少 XRP？", `包含 ${price} XRP 参与费、账户与 NFT 储备金及手续费，约需 ${(price + RESERVE_XRP).toFixed(1)} XRP。新钱包在首次入金时自动激活。`], es: ["¿Cuánto XRP se necesita?", `Unos ${(price + RESERVE_XRP).toFixed(1)} XRP en total: la entrada de ${price} XRP más las reservas de cuenta y NFT y las comisiones. Una billetera nueva se activa automáticamente con el primer depósito.`] }),
          t({ ko: ["래플 NFT 는 무엇인가요?", "응모 자격을 증명하는 XRPL NFT(XLS-20)이며, 행사장에서 경품을 수령할 때 사용됩니다. 계정당 1장 발급되며 추첨은 결제가 확정된 응모 전원을 대상으로 진행됩니다. 초대권은 당첨자에게 이메일로 발송됩니다."], en: ["What is the raffle NFT?", "An XRPL NFT (XLS-20) that proves your entry and is used to collect your prize at the venue. One is issued per account, and the draw covers every confirmed entry. Invitations are emailed to winners."], ja: ["ラッフルNFTとは？", "応募資格を証明するXRPL NFT（XLS-20）で、会場での賞品受取に使用します。1アカウントにつき1枚発行され、抽選は決済が確定した応募全員を対象に行います。招待券は当選者へメールで送付します。"], zh: ["什么是抽奖 NFT？", "证明参与资格的 XRPL NFT（XLS-20），用于在会场领取奖品。每账户发放一张，抽奖面向所有已确认支付的参与者。邀请函将通过邮件发送给中奖者。"], es: ["¿Qué es el NFT del sorteo?", "Un NFT de XRPL (XLS-20) que acredita su participación y se usa para recoger el premio en el recinto. Se emite uno por cuenta y el sorteo incluye a todas las participaciones confirmadas. Las invitaciones se envían por correo a los ganadores."] }),
          t({ ko: ["추첨은 어떻게 진행되나요?", "응모 마감 시점에 참가자 목록과 무작위 시드를 봉인하여 공개하고, 발표일에 시드를 공개(리빌)합니다. 누구나 동일한 결과를 재계산하여 검증할 수 있으며, 운영진도 결과를 사전에 확인하거나 변경할 수 없습니다."], en: ["How is the draw conducted?", "At close, the participant list and a random seed are sealed and published; on the announcement date the seed is revealed. Anyone can recompute and verify the same result, and the organisers cannot view or alter it in advance."], ja: ["抽選はどのように行われますか？", "応募締切時に参加者リストと乱数シードを封印して公開し、発表日にシードを開示します。誰でも同じ結果を再計算して検証でき、運営側も事前に確認・変更することはできません。"], zh: ["抽奖如何进行？", "截止时封存并公开参与名单与随机种子，公布日揭示种子。任何人都可复算验证同一结果，主办方亦无法提前查看或更改。"], es: ["¿Cómo se realiza el sorteo?", "Al cierre se sellan y publican la lista de participantes y una semilla aleatoria; el día del anuncio se revela la semilla. Cualquiera puede recalcular y verificar el mismo resultado, y la organización no puede verlo ni modificarlo de antemano."] }),
          t({ ko: ["전원 당첨이 맞나요?", `네. 선착순 정원과 경품 수량이 동일합니다(${prizeList} = 총 ${prizeSum}). 응모가 확정된 분은 반드시 한 가지 경품을 받으며, 경품 종류만 추첨으로 결정됩니다.`], en: ["Does everyone win?", `Yes. The number of spots equals the number of prizes (${prizeList} = ${prizeSum}). Every confirmed entrant receives one prize; only the type of prize is decided by draw.`], ja: ["全員当選ですか？", `はい。先着定員と賞品数が同数です（${prizeList}＝計${prizeSum}）。応募が確定した方は必ず1点を受け取り、賞品の種類のみ抽選で決まります。`], zh: ["真的人人有奖吗？", `是的。名额与奖品数量相同（${prizeList} = 共 ${prizeSum}）。确认参与者必获一份奖品，仅奖品种类由抽奖决定。`], es: ["¿Todos ganan?", `Sí. El número de plazas coincide con el de premios (${prizeList} = ${prizeSum}). Cada participante confirmado recibe un premio; el sorteo solo decide el tipo.`] }),
          t({ ko: ["경품은 어떻게 수령하나요?", "초대권은 응모 때 적은 이메일로 발송합니다. Weather Data Token Generator™·우산·에코백은 10월 3일 XRP SEOUL 2026 행사장 wellbian 플래티넘 부스에서 지갑에 보관된 래플 NFT 카드의 QR 코드를 현장 스태프에게 제시하면 확인 후 지급합니다. 확인된 QR 코드는 재사용할 수 없으며, 실물 경품의 택배 배송은 지원하지 않습니다."], en: ["How do I collect my prize?", "Invitations are sent to the email given at entry. The Weather Data Token Generator™, umbrellas and eco bags are handed out at the wellbian Platinum booth, XRP SEOUL 2026 venue, on 3 October: present the QR code on the raffle NFT card in your wallet to on-site staff. A verified QR code cannot be reused, and physical prizes are not shipped."], ja: ["賞品はどのように受け取りますか？", "招待券は応募時に入力したメールへ送付します。Weather Data Token Generator™・傘・エコバッグは10月3日、XRP SEOUL 2026会場のwellbianプラチナブースで、ウォレット内のラッフルNFTカードのQRコードを現地スタッフに提示いただくと確認後にお渡しします。確認済みのQRコードは再使用できず、実物の賞品の配送は行いません。"], zh: ["如何领取奖品？", "邀请函将发送至参与时填写的邮箱。Weather Data Token Generator™、雨伞、环保袋于 10 月 3 日在 XRP SEOUL 2026 会场 wellbian 白金展位领取：向现场工作人员出示钱包中抽奖 NFT 卡的二维码，核验后发放。已核验的二维码不可重复使用，实物奖品不提供邮寄。"], es: ["¿Cómo recojo el premio?", "Las invitaciones se envían al correo indicado al participar. El Weather Data Token Generator™, los paraguas y las bolsas se entregan en el stand Platinum de wellbian, en XRP SEOUL 2026, el 3 de octubre: presente al personal el QR de la tarjeta NFT de su billetera. Un QR verificado no puede reutilizarse y los premios físicos no se envían."] }),
          t({ ko: ["QR 코드를 다른 사람에게 보여 줘도 되나요?", "QR 코드는 본인 확인용이므로 타인과 공유하거나 외부에 노출하지 마시기 바랍니다. 공유·노출로 인해 타인이 먼저 수령하는 등의 피해는 보상하지 않습니다."], en: ["Can I show my QR code to others?", "The QR code is for identity verification; please do not share it or expose it publicly. Losses caused by sharing or exposure, such as collection by another person, will not be compensated."], ja: ["QRコードを他の人に見せてもよいですか？", "QRコードは本人確認用のため、他人と共有したり外部に露出したりしないでください。共有・露出により第三者が先に受け取るなどの被害は補償いたしません。"], zh: ["可以把二维码给别人看吗？", "二维码用于本人核验，请勿与他人分享或对外泄露。因分享或泄露导致被他人先行领取等损失，不予赔偿。"], es: ["¿Puedo mostrar mi código QR a otras personas?", "El código QR sirve para verificar su identidad; no lo comparta ni lo exponga públicamente. No se compensarán los perjuicios derivados de compartirlo o exponerlo, como que otra persona recoja el premio."] }),
          t({ ko: ["환불이 가능한가요?", "응모 확정 후에는 환불이 불가합니다. 결제 전 금액과 조건을 확인해 주시기 바랍니다."], en: ["Are refunds available?", "Entries cannot be refunded once confirmed. Please check the amount and terms before paying."], ja: ["返金は可能ですか？", "応募確定後の返金はできません。お支払い前に金額と条件をご確認ください。"], zh: ["可以退款吗？", "参与确认后不可退款。请在支付前确认金额与条款。"], es: ["¿Se admiten reembolsos?", "Una vez confirmada la participación no se puede reembolsar. Revise el importe y las condiciones antes de pagar."] }),
        ].map(([q, a], i) => (
          <details key={i} className="panel" style={{ marginBottom: 10 }}>
            <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 16 }}>{q}</summary>
            <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.7, color: "var(--ink-dim)" }}>{a}</p>
          </details>
        ))}
        <p className="dim" style={{ fontSize: 13.5, marginTop: 14 }}>{t({ ko: "문의: admin@wellbianlabs.io", en: "Contact: admin@wellbianlabs.io", ja: "お問い合わせ: admin@wellbianlabs.io", zh: "联系方式: admin@wellbianlabs.io", es: "Contacto: admin@wellbianlabs.io" })}</p>
      </div></section>

      {modal && st && <RaffleCheckoutModal mode={mode} st={st} onClose={() => { setModal(false); load(); }} onChange={load} />}
    </div>
  );
}
