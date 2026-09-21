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
import { RaffleHero, RaffleStats } from "./RaffleHero";
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

export default function RafflePage({ mode }: { mode: Mode }) {
  const { lang, t } = useI18n();
  const { address, sessionVerified, openLogin } = useWallet();
  const [st, setSt] = useState<State | null>(null);
  const [modal, setModal] = useState(false);

  const load = useCallback(async () => {
    try { const r = await fetch(`/api/raffle/state${qs(mode)}`, { cache: "no-store" }); if (r.ok) setSt(await r.json()); } catch { /* 다음 주기 */ }
  }, [mode]);
  useEffect(() => { load(); const id = setInterval(load, 20000); return () => clearInterval(id); }, [load, address]);

  const cfg = st?.config;
  const phase = st?.phase ?? "BEFORE";
  const target = phase === "BEFORE" ? cfg?.open : phase === "OPEN" ? cfg?.close : null;
  /* 보류 상태(2026-09-17): 관리자 설정 open 이 1년 이상 뒤면 일정 미정으로 본다 - 날짜 대신 "추후 공지", 카운트다운 없음 */
  const onHold = !!cfg && Date.parse(cfg.open) > Date.now() + 365 * 86400_000;
  const cd = useCountdown(onHold ? null : (target ?? null));
  const tba = t({ ko: "추후 공지", en: "TBA", ja: "後日発表", zh: "另行通知", es: "Por anunciar" });
  const mine = st?.mine ?? null;
  const done = !!mine && mine.status === "PAID";
  const held = done && mine?.pass?.state === "CLAIMED";

  const cta = () => {
    if (!address || !sessionVerified) { openLogin(); return; }
    setModal(true);
  };

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
              <div style={{ fontSize: 19, fontWeight: 800 }}>{p.name}</div>
              {p.note && <div className="dim" style={{ fontSize: 14.5 }}>{p.note}</div>}
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
                  : mine.status !== "PAID" ? t({ ko: "결제 대기 중", en: "Awaiting payment", ja: "決済待ち", zh: "待支付", es: "Pago pendiente" })
                  : t({ ko: `래플 번호 #${String(mine.entryNo ?? 0).padStart(4, "0")}`, en: `Ticket #${String(mine.entryNo ?? 0).padStart(4, "0")}`, ja: `ラッフル番号 #${String(mine.entryNo ?? 0).padStart(4, "0")}`, zh: `编号 #${String(mine.entryNo ?? 0).padStart(4, "0")}`, es: `N.º ${String(mine.entryNo ?? 0).padStart(4, "0")}` })}
              </div>
              <div style={{ fontSize: 14.5, color: "var(--ink-dim)" }}>
                {done && (mine!.pass?.state === "CLAIMED"
                  ? t({ ko: "래플 NFT 보유 중 ✓", en: "Raffle NFT held ✓", ja: "ラッフルNFT保有中 ✓", zh: "已持有抽奖 NFT ✓", es: "NFT del sorteo recibido ✓" })
                  : mine!.pass?.offerIndex
                    ? t({ ko: "NFT 발행 완료 · 지갑에서 수락해 주세요", en: "NFT minted · please accept it in your wallet", ja: "NFT発行完了 · ウォレットで承認してください", zh: "NFT 已发行 · 请在钱包中接受", es: "NFT emitido · acéptelo en su billetera" })
                    : t({ ko: "래플 NFT 발행 중 (약 1~3분 소요)", en: "Minting raffle NFT (about 1-3 min)", ja: "ラッフルNFT発行中（約1〜3分）", zh: "正在发行抽奖 NFT（约 1-3 分钟）", es: "Emitiendo NFT (1-3 min aprox.)" }))}
                {!done && mine && t({ ko: `${price} XRP 결제 확인 후 응모가 확정됩니다`, en: `Entry is confirmed once ${price} XRP is received`, ja: `${price} XRPの決済確認後に応募が確定します`, zh: `确认收到 ${price} XRP 后即确认参与`, es: `La participación se confirma al recibir ${price} XRP` })}
              </div>
            </div>
            {(phase === "OPEN" || (phase === "SOLD_OUT" && !!mine)) && !held && (
              <button type="button" className="btn-primary" onClick={cta}>
                {!mine ? t({ ko: "응모하기", en: "Enter", ja: "応募する", zh: "参与", es: "Participar" }) : t({ ko: "계속 진행", en: "Continue", ja: "続ける", zh: "继续", es: "Continuar" })}
              </button>
            )}
          </div>
          {done && mine?.ticketCode && (
            <div className="panel" style={{ marginTop: 12 }}>
              <TicketCard mine={mine} t={t} />
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
            <li><b>2026.10.03</b> {t({ ko: "경품 지급 · 10월 3일 행사 당일 XRP SEOUL 2026 행사장에서 QR 코드 확인 후 지급, 현장 수령만 가능", en: "prize collection · at the XRP SEOUL 2026 venue on 3 October after QR verification; on-site collection only", ja: "賞品お渡し・10月3日イベント当日、XRP SEOUL 2026会場でQRコード確認後にお渡し、現地受取のみ", zh: "奖品发放 · 10 月 3 日活动当天在 XRP SEOUL 2026 会场核验二维码后发放，仅限现场领取", es: "entrega de premios · el 3 de octubre en el recinto de XRP SEOUL 2026 tras verificar el QR; solo recogida presencial" })}</li>
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
          t({ ko: ["래플 NFT 는 무엇인가요?", "응모 자격을 증명하는 XRPL NFT(XLS-20)이며, 행사장에서 경품을 수령할 때 사용됩니다. 계정당 1장 발급되며 추첨은 NFT 를 보유한 계정을 대상으로 진행됩니다. 행사 초대권은 당첨자에게 별도 안내됩니다."], en: ["What is the raffle NFT?", "An XRPL NFT (XLS-20) that proves your entry and is used to collect your prize at the venue. One is issued per account, and the draw is held among accounts holding the NFT. Event invitations are sent separately to winners."], ja: ["ラッフルNFTとは？", "応募資格を証明するXRPL NFT（XLS-20）で、会場での賞品受取に使用します。1アカウントにつき1枚発行され、抽選はNFTを保有するアカウントを対象に行います。招待券は当選者に別途ご案内します。"], zh: ["什么是抽奖 NFT？", "证明参与资格的 XRPL NFT（XLS-20），用于在会场领取奖品。每账户发放一张，抽奖在持有 NFT 的账户中进行。活动邀请函将另行通知中奖者。"], es: ["¿Qué es el NFT del sorteo?", "Un NFT de XRPL (XLS-20) que acredita su participación y se usa para recoger el premio en el recinto. Se emite uno por cuenta y el sorteo se realiza entre las cuentas que lo poseen. Las invitaciones se comunican por separado a los ganadores."] }),
          t({ ko: ["추첨은 어떻게 진행되나요?", "응모 마감 시점에 참가자 목록과 무작위 시드를 봉인하여 공개하고, 발표일에 시드를 공개(리빌)합니다. 누구나 동일한 결과를 재계산하여 검증할 수 있으며, 운영진도 결과를 사전에 확인하거나 변경할 수 없습니다."], en: ["How is the draw conducted?", "At close, the participant list and a random seed are sealed and published; on the announcement date the seed is revealed. Anyone can recompute and verify the same result, and the organisers cannot view or alter it in advance."], ja: ["抽選はどのように行われますか？", "応募締切時に参加者リストと乱数シードを封印して公開し、発表日にシードを開示します。誰でも同じ結果を再計算して検証でき、運営側も事前に確認・変更することはできません。"], zh: ["抽奖如何进行？", "截止时封存并公开参与名单与随机种子，公布日揭示种子。任何人都可复算验证同一结果，主办方亦无法提前查看或更改。"], es: ["¿Cómo se realiza el sorteo?", "Al cierre se sellan y publican la lista de participantes y una semilla aleatoria; el día del anuncio se revela la semilla. Cualquiera puede recalcular y verificar el mismo resultado, y la organización no puede verlo ni modificarlo de antemano."] }),
          t({ ko: ["전원 당첨이 맞나요?", "네. 선착순 정원과 경품 수량이 동일합니다(초대권 290 · Weather Data Token Generator™ 10 · 우산 50 · 에코백 150 = 총 500). 응모가 확정된 분은 반드시 한 가지 경품을 받으며, 경품 종류만 추첨으로 결정됩니다."], en: ["Does everyone win?", "Yes. The number of spots equals the number of prizes (290 invitations · 10 Weather Data Token Generator™ · 50 umbrellas · 150 eco bags = 500). Every confirmed entrant receives one prize; only the type of prize is decided by draw."], ja: ["全員当選ですか？", "はい。先着定員と賞品数が同数です（招待券290・Weather Data Token Generator™ 10・傘50・エコバッグ150＝計500）。応募が確定した方は必ず1点を受け取り、賞品の種類のみ抽選で決まります。"], zh: ["真的人人有奖吗？", "是的。名额与奖品数量相同（邀请函 290 · Weather Data Token Generator™ 10 · 雨伞 50 · 环保袋 150 = 共 500）。确认参与者必获一份奖品，仅奖品种类由抽奖决定。"], es: ["¿Todos ganan?", "Sí. El número de plazas coincide con el de premios (290 invitaciones · 10 Weather Data Token Generator™ · 50 paraguas · 150 bolsas = 500). Cada participante confirmado recibe un premio; el sorteo solo decide el tipo."] }),
          t({ ko: ["경품은 어떻게 수령하나요?", "10월 3일 XRP SEOUL 2026 행사장에서 수령합니다. 지갑에 보관된 래플 NFT 카드의 QR 코드를 현장 스태프에게 제시하면 확인 후 배정된 경품을 지급합니다. 확인된 QR 코드는 재사용할 수 없으며, 현장 수령 외 별도 배송은 지원하지 않습니다."], en: ["How do I collect my prize?", "At the XRP SEOUL 2026 venue on 3 October. Present the QR code on the raffle NFT card in your wallet to on-site staff; after verification, the assigned prize is handed over. A verified QR code cannot be reused, and shipping is not available: on-site collection only."], ja: ["賞品はどのように受け取りますか？", "10月3日、XRP SEOUL 2026の会場でお受け取りください。ウォレット内のラッフルNFTカードのQRコードを現地スタッフに提示いただくと、確認後に賞品をお渡しします。確認済みのQRコードは再使用できず、現地受取以外の配送は行いません。"], zh: ["如何领取奖品？", "10 月 3 日在 XRP SEOUL 2026 会场领取。向现场工作人员出示钱包中抽奖 NFT 卡的二维码，核验后发放所分配的奖品。已核验的二维码不可重复使用，不提供邮寄，仅限现场领取。"], es: ["¿Cómo recojo el premio?", "En el recinto de XRP SEOUL 2026, el 3 de octubre. Presente al personal el código QR de la tarjeta NFT que tiene en su billetera; tras la verificación se entrega el premio asignado. Un QR verificado no puede reutilizarse y no hay envíos: solo recogida presencial."] }),
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
