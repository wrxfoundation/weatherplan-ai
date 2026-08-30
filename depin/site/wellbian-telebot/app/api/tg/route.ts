/* 텔레그램 FAQ 봇 웹훅 (8/30 서우)

   역할 분담이 이 파일의 전제다.
     · Rose             — 입장 캡챠·금칙어·뮤트 등 그룹 질서. 관리자 권한을 가진 건 Rose 뿐이다.
     · @wellbian_faq_bot — 이 코드. 질문에 답하는 일만 한다. 관리자 권한이 필요 없고,
                           privacy mode 를 켠 일반 멤버로 @wellbiantalk 에 들어간다.
   그래서 여기에는 캡챠·차단·삭제가 없다. 권한이 없으니 할 수도 없다.

   답변 문장은 이 프로젝트에 한 줄도 없다. 판매 사이트의 /api/faq 를 읽어 옮긴다
   (lib/faq-client.ts 주석 참조). 정본에 없는 질문에는 답을 지어내지 않고 사람에게 넘긴다 —
   가격·수량은 아직 공지 전 값이라 봇의 추측이 그대로 대외 발표가 되어 버린다.

   서버리스라 상태를 들고 있을 수 없다. "지금 누가 무엇을 보고 있는지"를 저장하지 않고
   전부 콜백 데이터에 실어 보낸다 — 텔레그램이 우리가 보낸 값을 그대로 돌려주므로 위조되지 않는다.

   환경변수 (Vercel · wellbian-telebot 프로젝트):
     TG_BOT_TOKEN      BotFather 토큰. Production=운영봇 / Preview=개발봇 으로 나눠 저장한다.
     TG_WEBHOOK_SECRET setWebhook 의 secret_token 과 같은 값. 위조 요청을 막는 유일한 수단이다.
     FAQ_SOURCE_URL    정본 주소. 예: https://wellbianstorenextjs.vercel.app/api/faq
     TG_GROUP          (선택) 반응할 공개 그룹의 유저네임. 예: wellbiantalk — @ 와 t.me/ 는 뺀다.
   ※ NEXT_PUBLIC_ 접두사를 절대 붙이지 않는다 — 붙이는 순간 토큰이 브라우저 번들에 실린다. */

import type { NextRequest } from "next/server";
import {
  getDoc, findFaq, langOf, searchFaq,
  type FaqDoc, type FaqLang, type Loc,
} from "@/lib/faq-client";

const TOKEN = process.env.TG_BOT_TOKEN ?? "";
const SECRET = process.env.TG_WEBHOOK_SECRET ?? "";
const GROUP = process.env.TG_GROUP ?? "";
const COMMUNITY = "https://t.me/wellbiantalk";

const L = (m: Loc, lang: FaqLang) => (lang === "ko" ? m.ko : m.en || m.ko);

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
const menu = (doc: FaqDoc, lang: FaqLang, extra: boolean) => {
  const rows: Btn[][] = (doc.faq[lang] ?? [])
    .filter((f) => f.extra === extra)
    .map((f) => [{ text: f.q, callback_data: `f:${lang}:${f.id}` }]);
  rows.push([
    extra
      ? { text: lang === "ko" ? "← 기본 질문" : "← Main questions", callback_data: `p:${lang}:b` }
      : { text: lang === "ko" ? "더 보기 →" : "More →", callback_data: `p:${lang}:x` },
  ]);
  /* 언어를 직접 고를 수 있게 둔다. 텔레그램이 language_code 를 주지 않을 때가 있어
     자동 판별만으로는 반대 언어에 갇히는 사람이 생긴다 — 같은 목록을 반대 언어로 다시 그린다. */
  rows.push([{
    text: lang === "ko" ? "🌐 English" : "🌐 한국어",
    callback_data: `p:${lang === "ko" ? "en" : "ko"}:${extra ? "x" : "b"}`,
  }]);
  return { inline_keyboard: rows };
};

const menuText = (lang: FaqLang) =>
  lang === "ko" ? "궁금한 항목을 골라 주세요." : "Pick a question.";

/* +9h 만큼 옮긴 뒤 UTC 로 읽으면 보는 사람의 시간대와 무관하게 KST 로 나온다 */
const fmtKst = (iso: string, lang: FaqLang) => {
  const d = new Date(new Date(iso).getTime() + 9 * 3600000);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  return lang === "ko"
    ? `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 ${hh}:${mi} KST`
    : `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${hh}:${mi} KST`;
};

/* 남은 시간은 산수라 여기서 센다. 날짜 자체는 한 줄도 갖고 있지 않다 — 전부 정본에서 온다. */
const untilText = (iso: string, now: number, lang: FaqLang) => {
  const ms = Math.max(0, new Date(iso).getTime() - now);
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return lang === "ko" ? `${d}일 ${h}시간 ${m}분` : `${d}d ${h}h ${m}m`;
};

const scheduleText = (doc: FaqDoc, lang: FaqLang) => {
  const s = doc.schedule;
  const now = Date.now();
  const lines = s.milestones.map((m) =>
    `${fmtKst(m.at, lang)} — ${L(m.label, lang)}${m.note ? `\n   (${L(m.note, lang)})` : ""}`);
  const tail = [L(s.phaseLabel, lang)];
  if (s.next) tail.push(`${L(s.nextStepIn, lang)}: ${untilText(s.next.at, now, lang)}`);
  return [
    `${L(s.title, lang)} · ${L(s.name, lang)}`, "",
    ...lines, "",
    ...tail, "",
    ...s.notices.map((n) => L(n, lang)),
  ].join("\n");
};

const helpText = (lang: FaqLang) =>
  lang === "ko"
    ? ["무엇을 도와드릴까요?", "",
       "/faq — 자주 묻는 질문",
       "/schedule — 판매 일정과 현재 단계", "",
       `여기에 질문을 그냥 적어 주셔도 됩니다. 준비된 답이 없으면 커뮤니티(${COMMUNITY})로 안내해 드립니다.`].join("\n")
    : ["How can I help?", "",
       "/faq — frequently asked questions",
       "/schedule — sale schedule and current phase", "",
       `You can also just type your question. If there is no prepared answer, we point you to the community (${COMMUNITY}).`].join("\n");

/* 정본에 없는 질문. 지어내지 않고 사람에게 넘긴다. */
const noAnswerText = (lang: FaqLang) =>
  lang === "ko"
    ? `아직 준비된 답변이 없는 질문입니다. 커뮤니티에 남겨 주시면 확인 후 답변드리겠습니다.\n${COMMUNITY}`
    : `We don't have a prepared answer for that yet. Please ask in the community and we'll follow up.\n${COMMUNITY}`;

/* 정본을 한 번도 못 읽은 상태(FAQ_SOURCE_URL 미설정, 사이트 미배포 등).
   틀린 답을 내놓느니 못 불러왔다고 말한다. */
const offlineText = (lang: FaqLang) =>
  lang === "ko"
    ? `지금 답변을 불러오지 못했습니다. 잠시 후 다시 시도해 주시거나 커뮤니티로 문의해 주세요.\n${COMMUNITY}`
    : `Couldn't load the answers right now. Please try again shortly, or ask in the community.\n${COMMUNITY}`;

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
      const doc = await getDoc();
      if (chat && mid && doc) {
        if (kind === "p") {
          await call("editMessageText", {
            chat_id: chat, message_id: mid,
            text: menuText(lang), reply_markup: menu(doc, lang, key === "x"),
          });
        } else if (kind === "f") {
          const hit = findFaq(doc, lang, key);
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
    const wants = cmd === "faq" || cmd === "start" || cmd === "schedule" || cmd === "help"
      || (!cmd && Boolean(text) && isPrivate);
    if (!wants) return Response.json({ ok: true });

    const doc = await getDoc();
    if (!doc) {
      await call("sendMessage", { chat_id: chat.id, text: offlineText(lang), disable_web_page_preview: true });
      return Response.json({ ok: true });
    }

    if (cmd === "faq" || cmd === "start") {
      await call("sendMessage", { chat_id: chat.id, text: menuText(lang), reply_markup: menu(doc, lang, false) });
    } else if (cmd === "schedule") {
      await call("sendMessage", { chat_id: chat.id, text: scheduleText(doc, lang), disable_web_page_preview: true });
    } else if (cmd === "help") {
      await call("sendMessage", { chat_id: chat.id, text: helpText(lang), disable_web_page_preview: true });
    } else {
      /* 자유 질문은 1:1 에서만 받는다. 그룹에서 아무 말에나 끼어들면 대화를 망친다
         (privacy mode 가 켜져 있어 애초에 대부분 오지도 않는다). */
      const hits = searchFaq(doc, lang, text);
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

/* 브라우저 주소창으로 열어 보는 사람이 있어서 존재만 알리고 아무것도 내주지 않는다 */
export function GET() {
  return new Response("ok", { status: 200 });
}
