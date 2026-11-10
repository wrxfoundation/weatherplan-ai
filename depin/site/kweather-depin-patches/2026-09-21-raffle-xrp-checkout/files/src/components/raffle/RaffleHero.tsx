"use client";
/* XRP SEOUL 2026 래플 - 히어로 + 스탯 줄 (2026-09-21, 정적 시안 xrpseoul-raffle 이식).
   시안: 좌측 텍스트(락업 로고 · 제목 두 줄 · 알약 3개 · 경품 한 줄 · 버튼 2 · 행사 링크) + 우측 경품 예상도, 아래 흰 카드 5칸.
   문구·숫자는 서버 설정(raffleState.config)에서 읽는다 - 시안의 하드코딩(500명·9.22·9.27·경품 수)은 전부 설정값이다.
   모바일(≤920px)은 다크 배경 + 이미지가 텍스트 아래로 내려간다(2026-09-19 지시: PC 기준 배경색). */
import "./raffle-hero.css";
import { useI18n, type Lang, type Msg } from "@/lib/launch/i18n";
import type { RaffleMine, RaffleStateView } from "./types";
import { prizeWord } from "@/lib/raffle-prizes";

type Phase = RaffleStateView["phase"];

/* 시안 표기 "9.22(화) 18:00" - 요일은 언어별 */
const WD: Record<Lang, string[]> = {
  ko: ["일", "월", "화", "수", "목", "금", "토"], en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  ja: ["日", "月", "火", "水", "木", "金", "土"], zh: ["日", "一", "二", "三", "四", "五", "六"], es: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
};
const kstParts = (iso?: string) => {
  if (!iso) return null;
  const d = new Date(Date.parse(iso) + 9 * 3600_000);
  return { M: d.getUTCMonth() + 1, D: d.getUTCDate(), wd: d.getUTCDay(), hm: `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}` };
};
/** "9.22(화)" · "18:00" */
export const fmtDay = (iso: string | undefined, lang: Lang) => { const p = kstParts(iso); return p ? `${p.M}.${String(p.D).padStart(2, "0")}(${WD[lang][p.wd]})` : ""; };
export const fmtHm = (iso: string | undefined) => kstParts(iso)?.hm ?? "";

/* 행사장 - 보도·텔레그램 정본 표기 「그랜드 하얏트 서울」(2026-09-21 확인) */
const VENUE: Msg<string> = { ko: "그랜드 하얏트 서울", en: "Grand Hyatt Seoul", ja: "グランド ハイアット ソウル", zh: "首尔君悦酒店", es: "Grand Hyatt Seúl" };
const EVENT_TIME = "10:00~";

export function RaffleHero({ st, phase, done, held, mine, onHold, tba, cd, onCta, onOpen }: {
  st: RaffleStateView | null; phase: Phase; done: boolean; held: boolean; mine: RaffleMine | null;
  onHold: boolean; tba: string; cd: string; onCta: () => void; onOpen: () => void;
}) {
  const { lang, t } = useI18n();
  const cfg = st?.config;
  const price = cfg?.priceXrp ?? 5;
  const max = cfg?.maxEntries ?? 500;
  const no = String(mine?.entryNo ?? 0).padStart(4, "0");
  const prizes = cfg?.prizes ?? [];
  const sep = " · ";
  /* 상태를 아직 못 읽은 첫 화면 - 빈 날짜("  시작")가 잠깐 보이지 않게 자리표시자를 둔다 (2026-09-21 점검) */
  const loading = !st;
  const whenChip = loading ? "…" : onHold ? tba
    : phase === "BEFORE" ? t({ ko: `${fmtDay(cfg?.open, lang)} ${fmtHm(cfg?.open)} 시작`, en: `Opens ${fmtDay(cfg?.open, lang)} ${fmtHm(cfg?.open)}`, ja: `${fmtDay(cfg?.open, lang)} ${fmtHm(cfg?.open)} 開始`, zh: `${fmtDay(cfg?.open, lang)} ${fmtHm(cfg?.open)} 开始`, es: `Abre ${fmtDay(cfg?.open, lang)} ${fmtHm(cfg?.open)}` })
    : phase === "OPEN" ? t({ ko: `${fmtDay(cfg?.close, lang)} ${fmtHm(cfg?.close)} 마감`, en: `Closes ${fmtDay(cfg?.close, lang)} ${fmtHm(cfg?.close)}`, ja: `${fmtDay(cfg?.close, lang)} ${fmtHm(cfg?.close)} 締切`, zh: `${fmtDay(cfg?.close, lang)} ${fmtHm(cfg?.close)} 截止`, es: `Cierra ${fmtDay(cfg?.close, lang)} ${fmtHm(cfg?.close)}` })
    : t({ ko: "응모 마감", en: "Entries closed", ja: "応募締切", zh: "报名已截止", es: "Cerrado" });

  /* 주 버튼 - 페이즈·내 응모 상태에 따라 (기존 페이지의 분기 그대로) */
  let primary: { label: string; onClick?: () => void; disabled?: boolean; shine?: boolean; done?: boolean };
  if (loading) {
    primary = { label: t({ ko: "불러오는 중…", en: "Loading…", ja: "読み込み中…", zh: "加载中…", es: "Cargando…" }), disabled: true };
  } else if (done && (phase === "OPEN" || phase === "SOLD_OUT" || phase === "CLOSED")) {
    primary = { label: held ? t({ ko: `응모 완료 · 래플 번호 #${no}`, en: `Entered · Ticket #${no}`, ja: `応募完了 · No.${no}`, zh: `已参与 · 编号 #${no}`, es: `Inscrito · N.º ${no}` }) : t({ ko: "결제 완료 · NFT 수령", en: "Paid · collect NFT", ja: "決済完了 · NFT受取", zh: "已支付 · 领取 NFT", es: "Pagado · recibir NFT" }), onClick: onOpen, done: held };
  } else if (phase === "OPEN") {
    primary = { label: t({ ko: `${price} XRP 로 참여하기`, en: `Enter with ${price} XRP`, ja: `${price} XRPで参加する`, zh: `用 ${price} XRP 参与`, es: `Participar con ${price} XRP` }), onClick: onCta, shine: true };
  } else if (phase === "BEFORE") {
    primary = { label: onHold ? t({ ko: "응모 일정은 추후 공지됩니다", en: "Entry schedule to be announced", ja: "応募日程は後日発表します", zh: "报名时间另行通知", es: "Fechas por anunciar" }) : t({ ko: `${fmtDay(cfg?.open, lang)} ${fmtHm(cfg?.open)} 응모 시작`, en: `Opens ${fmtDay(cfg?.open, lang)} ${fmtHm(cfg?.open)}`, ja: `${fmtDay(cfg?.open, lang)} ${fmtHm(cfg?.open)} 応募開始`, zh: `${fmtDay(cfg?.open, lang)} ${fmtHm(cfg?.open)} 开始参与`, es: `Abre el ${fmtDay(cfg?.open, lang)} ${fmtHm(cfg?.open)}` }), disabled: true };
  } else if (phase === "SOLD_OUT" && mine?.status === "PENDING" && mine.holdLive) {
    /* 정원(확정 + 예약)이 찼지만 내 예약이 살아 있으면 결제를 이어 갈 수 있다 */
    primary = { label: t({ ko: "결제 이어서 하기 · 자리 확보 중", en: "Continue payment · spot held", ja: "決済を続ける・席を確保中", zh: "继续支付 · 名额已保留", es: "Continuar el pago · plaza reservada" }), onClick: onCta, shine: true };
  } else if (phase === "SOLD_OUT") {
    primary = { label: t({ ko: `선착순 ${max}명 마감`, en: `All ${max} spots filled`, ja: `先着${max}名 締切`, zh: `${max} 个名额已满`, es: `${max} plazas completas` }), disabled: true };
  } else {
    primary = { label: t({ ko: "응모가 마감되었습니다", en: "Entries are closed", ja: "応募は締め切りました", zh: "报名已截止", es: "Inscripciones cerradas" }), disabled: true };
  }

  return (
    <header className="rf-hero">
      <div className="rf-hero-veil" aria-hidden="true" />
      <div className="rf-wrap rf-hero-grid">
        <div>
          <div className="rf-lockup">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo_w_medium.svg" alt="wellbian × XRP Ledger" />
          </div>
          <h1>
            XRP SEOUL 2026
            <span className="rf-sub">{t({ ko: <><em>플래티넘 스폰서</em> 래플 이벤트</>, en: <><em>Platinum Sponsor</em> Raffle Event</>, ja: <><em>プラチナスポンサー</em> ラッフルイベント</>, zh: <><em>白金赞助商</em> 抽奖活动</>, es: <>Sorteo del <em>Patrocinador Platinum</em></> })}</span>
          </h1>
          <div className="rf-hero-facts">
            <span className="rf-fact">{t({ ko: `선착순 ${max}명`, en: `First ${max}`, ja: `先着${max}名`, zh: `限前 ${max} 名`, es: `Primeros ${max}` })}</span>
            <span className="rf-fact">{t({ ko: "100% 당첨", en: "Everyone wins", ja: "全員当選", zh: "100% 中奖", es: "Todos ganan" })}</span>
            <span className="rf-fact when">{whenChip}</span>
          </div>
          <p className="rf-hero-lead">
            {prizes.slice(0, 2).map((p) => prizeWord(p, lang)).join(sep)}{prizes.length > 2 && sep}{prizes.length > 2 && <br />}
            {prizes.slice(2).map((p) => prizeWord(p, lang)).join(sep)}{" "}
            <b>{t({ ko: "— 참여하면 이 중 하나는 반드시 당첨.", en: "— enter and one of these is yours, guaranteed.", ja: "— 参加すればこのうち1つが必ず当たります。", zh: "— 参与即必得其中一份。", es: "— participe y uno de ellos es suyo, garantizado." })}</b>
          </p>
          <p className="rf-hero-sub">{t({ ko: "초대권은 이메일로, 실물 경품은 10월 3일 XRP SEOUL 2026 현장에서 수령합니다", en: "Invitations by email; physical prizes are collected at XRP SEOUL 2026 on 3 October", ja: "招待券はメールで、実物の賞品は10月3日、XRP SEOUL 2026会場でお受け取りください", zh: "邀请函通过邮件发送，实物奖品于 10 月 3 日在 XRP SEOUL 2026 现场领取", es: "Invitaciones por correo; los premios físicos se recogen en XRP SEOUL 2026 el 3 de octubre" })}</p>
          <div className="rf-hero-cta">
            <button type="button" className={`rf-btn fill${primary.shine ? " shine" : ""}${primary.done ? " done" : ""}`} disabled={primary.disabled} onClick={primary.onClick}>{primary.label}</button>
            <a className="rf-btn ghost" href="#prizes">{t({ ko: "경품 보기", en: "See prizes", ja: "賞品を見る", zh: "查看奖品", es: "Ver premios" })}</a>
            {cd && (phase === "BEFORE" || phase === "OPEN") && !onHold && (
              <span className="rf-hero-cd">{phase === "BEFORE" ? t({ ko: "시작까지", en: "starts in", ja: "開始まで", zh: "距开始", es: "empieza en" }) : t({ ko: "마감까지", en: "closes in", ja: "締切まで", zh: "距截止", es: "cierra en" })} {cd}</span>
            )}
          </div>
          <a className="rf-hero-link" href="https://xrpseoul.com" target="_blank" rel="noopener">
            {t({ ko: "XRP SEOUL 2026 바로가기", en: "Go to XRP SEOUL 2026", ja: "XRP SEOUL 2026 公式サイトへ", zh: "前往 XRP SEOUL 2026", es: "Ir a XRP SEOUL 2026" })}
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
          </a>
        </div>
      </div>
      <div className="rf-hero-bg" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/raffle/hero.webp" alt="" />
      </div>
      <span className="rf-hero-cap">{t({ ko: "*경품 예상도이며, 실물과 다를 수 있습니다", en: "*Illustrative image; actual prizes may differ", ja: "*イメージです。実物とは異なる場合があります", zh: "*示意图，实物可能有所不同", es: "*Imagen ilustrativa; los premios reales pueden variar" })}</span>
    </header>
  );
}

export function RaffleStats({ st, onHold, tba }: { st: RaffleStateView | null; onHold: boolean; tba: string }) {
  const { lang, t } = useI18n();
  const cfg = st?.config;
  const price = cfg?.priceXrp ?? 5;
  const max = cfg?.maxEntries ?? 500;
  const count = st?.count ?? 0;
  const holds = st?.holds ?? 0;
  return (
    <div className="rf-wrap">
      <dl className="rf-stats">
        <Stat accent k={t({ ko: "참여 금액", en: "Entry", ja: "応募金額", zh: "参与金额", es: "Entrada" })} v={String(price)} unit="XRP" sub={t({ ko: "XRP 결제만 지원", en: "XRP only", ja: "XRP決済のみ", zh: "仅支持 XRP 支付", es: "Solo XRP" })} />
        <Stat k={t({ ko: "참여 현황", en: "Entries", ja: "応募数", zh: "已参与", es: "Inscritos" })} v={st ? count.toLocaleString() : "…"} unit={`/ ${max.toLocaleString()}`} sub={holds > 0 ? t({ ko: `예약 중 ${holds} · 선착순 마감`, en: `${holds} reserving · first come, first served`, ja: `予約中${holds}・先着順で締切`, zh: `${holds} 人预约中 · 先到先得`, es: `${holds} reservando · por orden de llegada` }) : t({ ko: "선착순 마감", en: "first come, first served", ja: "先着順で締切", zh: "先到先得", es: "por orden de llegada" })} />
        <Stat k={t({ ko: "당첨 확률", en: "Win rate", ja: "当選確率", zh: "中奖率", es: "Probabilidad" })} v="100" unit="%" sub={t({ ko: "참여하면 경품 중 100% 당첨", en: "everyone wins one prize", ja: "参加者全員に賞品", zh: "参与即 100% 中奖", es: "todos ganan un premio" })} />
        <Stat k={t({ ko: "참여 마감", en: "Closes", ja: "応募締切", zh: "参与截止", es: "Cierre" })} v={!st ? "…" : onHold ? tba : fmtDay(cfg?.close, lang)} unit={!st || onHold ? "" : fmtHm(cfg?.close)} sub={t({ ko: `${max}명 도달 시 조기 종료`, en: `ends early at ${max} entries`, ja: `${max}名到達で早期終了`, zh: `满 ${max} 人提前结束`, es: `termina antes al llegar a ${max}` })} />
        <Stat k={t({ ko: "행사일", en: "Event", ja: "開催日", zh: "活动日期", es: "Evento" })} v={st ? fmtDay(cfg?.eventAt, lang) || "10.03" : "…"} unit={st ? EVENT_TIME : ""} sub={t(VENUE)} />
      </dl>
    </div>
  );
}

function Stat({ k, v, unit, sub, accent }: { k: string; v: string; unit: string; sub: string; accent?: boolean }) {
  return (
    <div className={`rf-stat${accent ? " accent" : ""}`}>
      <dt>{k}</dt>
      <dd className="rf-tnum">{v}{unit && <small>{unit}</small>}</dd>
      <div className="rf-stat-sub">{sub}</div>
    </div>
  );
}

