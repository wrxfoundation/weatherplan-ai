/* 텔레그램 FAQ 봇 웹훅 (8/30 서우)

   역할 분담이 이 파일의 전제다.
     · Rose            — 입장 캡챠·금칙어·뮤트 등 그룹 질서. 관리자 권한을 가진 건 Rose 뿐이다.
     · @wellbian_faq_bot — 이 코드. 질문에 답하는 일만 한다. 관리자 권한이 필요 없고,
                          privacy mode 를 켠 일반 멤버로 그룹에 들어간다.
   그래서 여기에는 캡챠·차단·삭제가 없다. 권한이 없으니 할 수도 없다.

   답변의 정본은 lib/data.ts 하나다(lib/faq-source.ts 주석 참조). 이 파일은 정본을 텔레그램 화면에
   옮기기만 하고, 정본에 없는 질문에는 답을 지어내지 않고 사람에게 넘긴다.

   서버리스라 상태를 들고 있을 수 없다. 그래서 "지금 누가 무엇을 보고 있는지"를 저장하지 않고
   전부 콜백 데이터에 실어 보낸다 — 텔레그램이 우리가 보낸 값을 그대로 돌려주므로 위조되지 않는다.

   환경변수 (Vercel):
     TG_BOT_TOKEN      BotFather 토큰. Production=운영봇 / Preview=개발봇 으로 나눠 저장한다.
     TG_WEBHOOK_SECRET setWebhook 의 secret_token 과 같은 값. 위조 요청을 막는 유일한 수단이다.
     TG_GROUP          (선택) 반응할 공개 그룹의 유저네임. 예: wellbiantalk — @ 와 t.me/ 는 뺀다.
                       비워 두면 어느 채팅에서든 답한다.
   ※ NEXT_PUBLIC_ 접두사를 절대 붙이지 않는다 — 붙이는 순간 토큰이 브라우저 번들에 실린다. */

import type { NextRequest } from "next/server";
import { FAQ, findFaq, langOf, searchFaq, type FaqLang } from "@/lib/faq-source";
import { MILESTONES, phaseAt, nextMilestone, remain } from "@/lib/schedule";
import { D } from "@/lib/dict";
import { LINKS } from "@/lib/data";

const TOKEN = process.env.TG_BOT_TOKEN ?? "";
const SECRET = process.env.TG_WEBHOOK_SECRET ?? "";
const GROUP = process.env.TG_GROUP ?? "";

/* dict 의 t() 는 클라이언트 훅이라 여기서 못 쓴다. FAQ 정본이 KO·EN 뿐이므로 두 갈래면 충분하다. */
const P = (m: { ko: string; en?: string }, lang: FaqLang) => (lang === "ko" ? m.ko : m.en ?? m.ko);

type Btn = { text: string; callback_data: string };

const call = async (method: string, body: unknown) => {
  if (!TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    /* 텔레그램이 잠깐 안 닿아도 우리는 200 을 돌려줘야 한다 — 아래 주석 참조 */
  }
};

/* ── FAQ 목록 화면 ──────────────────────────────────────────────────────
   17문항을 한 번에 세우면 스크롤이 화면을 넘긴다. 기본 8 + "더 보기" 로 나눈다.
   콜백 데이터는 64바이트 제한이 있어 `f:ko:b3` 처럼 짧게 유지한다. */
const menu = (lang: FaqLang, extra: boolean) => {
  const rows: Btn[][] = FAQ[lang]
    .filter((f) => f.extra === extra)
    .map((f) => [{ text: f.q, callback_data: `f:${lang}:${f.id}` }]);
  rows.push([
    extra
      ? { text: lang === "ko" ? "← 기본 질문" : "← Main questions", callback_data: `p:${lang}:b` }
      : { text: lang === "ko" ? "더 보기 →" : "More →", callback_data: `p:${lang}:x` },
  ]);
  return { inline_keyboard: rows };
};

const menuText = (lang: FaqLang) =>
  lang === "ko" ? "궁금한 항목을 골라 주세요." : "Pick a question.";

/* ── 판매 일정 ──────────────────────────────────────────────────────────
   날짜를 여기 다시 적지 않는다. lib/schedule.ts 가 정본이라 일정이 바뀌면 화면과 봇이 같이 바뀐다. */
const MS_LABEL = {
  reserveOpen: D.msReserveOpen,
  reserveClose: D.msReserveClose,
  priorityOpen: D.msPriorityOpen,
  generalOpen: D.msGeneralOpen,
  saleEnd: D.msSaleEnd,
} as const;

const PHASE_LABEL = {
  before_reserve: D.phaseBeforeReserve,
  reserve_open: D.phaseReserveOpen,
  reserve_closed: D.phaseReserveClosed,
  priority_window: D.phasePriorityWindow,
  general_window: D.phaseGeneralWindow,
  closed: D.phaseClosed,
} as const;

/* +9h 만큼 옮긴 뒤 UTC 로 읽으면 보는 사람의 시간대와 무관하게 KST 로 나온다 */
const fmtKst = (iso: string, lang: FaqLang) => {
  const d = new Date(new Date(iso).getTime() + 9 * 3600000);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  return lang === "ko"
    ? `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 ${hh}:${mi} KST`
    : `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${hh}:${mi} KST`;
};

const scheduleText = (lang: FaqLang) => {
  const now = Date.now();
  const lines = MILESTONES.map((m) => {
    const note = m.key === "generalOpen" ? `\n   (${P(D.msGeneralNote, lang)})` : "";
    return `${fmtKst(m.at, lang)} — ${P(MS_LABEL[m.key], lang)}${note}`;
  });
  const nx = nextMilestone(now);
  const tail: string[] = [P(PHASE_LABEL[phaseAt(now)], lang)];
  if (nx) {
    const r = remain(nx.at, now);
    tail.push(
      `${P(D.nextStepIn, lang)}: ${r.d}${lang === "ko" ? "일" : "d"} ${r.h}${lang === "ko" ? "시간" : "h"} ${r.m}${lang === "ko" ? "분" : "m"}`,
    );
  }
  /* 일정만 떼어 말하면 "가격도 정해졌다"로 읽힌다 — 미확정 고지를 항상 같이 보낸다 */
  return [
    `${P(D.scheduleTitle, lang)} · ${P(D.launchName, lang)}`,
    "",
    ...lines,
    "",
    ...tail,
    "",
    P(D.priceTbd, lang),
    P(D.reserveNotGuaranteed, lang),
  ].join("\n");
};

const helpText = (lang: FaqLang) =>
  lang === "ko"
    ? [
        "무엇을 도와드릴까요?",
        "",
        "/faq — 자주 묻는 질문",
        "/schedule — 판매 일정과 현재 단계",
        "",
        `여기에 질문을 그냥 적어 주셔도 됩니다. 준비된 답이 없으면 커뮤니티(${LINKS.telegram})로 안내해 드립니다.`,
      ].join("\n")
    : [
        "How can I help?",
        "",
        "/faq — frequently asked questions",
        "/schedule — sale schedule and current phase",
        "",
        `You can also just type your question. If there is no prepared answer, we point you to the community (${LINKS.telegram}).`,
      ].join("\n");

/* 정본에 없는 질문. 지어내지 않고 사람에게 넘긴다 —
   가격·수량처럼 아직 공지 전인 값을 봇이 추측하면 그대로 대외 발표가 되어 버린다. */
const noAnswerText = (lang: FaqLang) =>
  lang === "ko"
    ? `아직 준비된 답변이 없는 질문입니다. 커뮤니티에 남겨 주시면 확인 후 답변드리겠습니다.\n${LINKS.telegram}`
    : `We don't have a prepared answer for that yet. Please ask in the community and we'll follow up.\n${LINKS.telegram}`;

export async function POST(req: NextRequest) {
  /* 시크릿이 비어 있으면(=환경변수 미설정) 아무도 통과시키지 않는다.
     설정 전에 배포돼도 열린 엔드포인트가 되지 않게 하는 잠금이다. */
  if (!SECRET || req.headers.get("x-telegram-bot-api-secret-token") !== SECRET) {
    return new Response("unauthorized", { status: 401 });
  }

  try {
    const u = await req.json();

    /* ── 버튼 ── */
    const cq = u.callback_query;
    if (cq) {
      /* 먼저 응답하지 않으면 누른 사람 화면에서 로딩 표시가 안 풀린다 */
      await call("answerCallbackQuery", { callback_query_id: cq.id });
      const chat = cq.message?.chat?.id;
      const mid = cq.message?.message_id;
      const [kind, langRaw, key] = String(cq.data ?? "").split(":");
      const lang: FaqLang = langRaw === "ko" ? "ko" : "en";
      if (chat && mid) {
        if (kind === "p") {
          await call("editMessageText", {
            chat_id: chat, message_id: mid,
            text: menuText(lang), reply_markup: menu(lang, key === "x"),
          });
        } else if (kind === "f") {
          const hit = findFaq(lang, key);
          /* 새 메시지를 쌓지 않고 같은 자리를 고쳐 쓴다 — 그룹에서 대화창이 밀리지 않게 */
          await call("editMessageText", {
            chat_id: chat, message_id: mid,
            text: hit ? `${hit.q}\n\n${hit.a}` : noAnswerText(lang),
            reply_markup: {
              inline_keyboard: [[{
                text: lang === "ko" ? "← 목록" : "← Back",
                callback_data: `p:${lang}:${hit?.extra ? "x" : "b"}`,
              }]],
            },
          });
        }
      }
      return Response.json({ ok: true });
    }

    /* ── 메시지 ── */
    const msg = u.message;
    const chat = msg?.chat;
    if (!chat) return Response.json({ ok: true });

    const isPrivate = chat.type === "private";
    /* 우리 그룹이 아닌 곳에 초대되면 조용히 무시한다(1:1 은 누구에게나 열어 둔다) */
    if (!isPrivate && GROUP && chat.username !== GROUP) return Response.json({ ok: true });

    const lang = langOf(msg.from?.language_code);
    const text: string = (msg.text ?? "").trim();
    /* 그룹에서는 /faq@wellbian_faq_bot 처럼 봇 이름이 붙어 온다 */
    const cmd = text.startsWith("/") ? text.slice(1).split(/[\s@]/)[0].toLowerCase() : "";

    if (cmd === "faq" || cmd === "start") {
      await call("sendMessage", { chat_id: chat.id, text: menuText(lang), reply_markup: menu(lang, false) });
    } else if (cmd === "schedule") {
      await call("sendMessage", { chat_id: chat.id, text: scheduleText(lang), disable_web_page_preview: true });
    } else if (cmd === "help") {
      await call("sendMessage", { chat_id: chat.id, text: helpText(lang), disable_web_page_preview: true });
    } else if (!cmd && text && isPrivate) {
      /* 자유 질문은 1:1 에서만 받는다. 그룹에서 아무 말에나 끼어들면 대화를 망친다
         (privacy mode 가 켜져 있어 애초에 대부분 오지도 않는다). */
      const hits = searchFaq(lang, text);
      if (hits.length) {
        await call("sendMessage", {
          chat_id: chat.id,
          text: lang === "ko" ? "이 질문이신가요?" : "Did you mean one of these?",
          reply_markup: { inline_keyboard: hits.map((f) => [{ text: f.q, callback_data: `f:${lang}:${f.id}` }]) },
        });
      } else {
        await call("sendMessage", { chat_id: chat.id, text: noAnswerText(lang), disable_web_page_preview: true });
      }
    }
  } catch {
    /* 여기서 500 을 돌려주면 텔레그램이 같은 업데이트를 계속 다시 보낸다.
       한 건이 실패해도 큐를 막지 않도록 삼키고 200 을 준다. */
  }

  return Response.json({ ok: true });
}

/* GET 으로 열어 보는 사람이 있어서(브라우저 주소창) 존재만 알리고 아무것도 내주지 않는다 */
export function GET() {
  return new Response("ok", { status: 200 });
}
