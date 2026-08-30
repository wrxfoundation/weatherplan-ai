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
import { csCard, csButtons, topicOf, moodOf, whoOf, severityOf, isQuestion, isAlarming, type CsKind } from "@/lib/cs";
import { putItem, patchItem, newId, bumpBeat, type CsItem, type CsStatus } from "@/lib/store";
import { tgCall } from "@/lib/tg";

const SECRET = process.env.TG_WEBHOOK_SECRET ?? "";
const GROUP = process.env.TG_GROUP ?? "";
/* 답하지 못한 질문을 흘려보낼 운영 채널. 미설정이면 아무 데도 보내지 않는다 —
   설정 전에 배포돼도 엉뚱한 곳으로 문의가 새지 않게 하는 기본값이다. */
const CS_CHAT = process.env.TG_CS_CHAT ?? "";
const COMMUNITY = "https://t.me/wellbiantalk";

const L = (m: Loc, lang: FaqLang) => (lang === "ko" ? m.ko : m.en || m.ko);

type Btn = { text: string; callback_data: string };

/* 텔레그램이 잠깐 안 닿아도 우리는 200 을 돌려줘야 한다 — 아래 주석 참조 */
const call = tgCall;

/* 답을 못 준 질문을 기록하고 운영 채널로 보낸다. 어느 쪽이 실패해도 사용자 응답에는
   영향을 주지 않는다 — CS 기록보다 사용자에게 답이 가는 쪽이 먼저다. */
const recordCs = async (
  kind: CsKind,
  text: string,
  lang: FaqLang,
  chatType: string,
  from?: { username?: string; first_name?: string; id?: number },
  chatId?: number,
  phase?: string,
): Promise<CsItem> => {
  const mood = moodOf(text);
  const topic = topicOf(text);
  const item: CsItem = {
    id: newId(), at: Date.now(), text,
    topic, mood,
    sev: severityOf(text, mood, chatType, { phase, topic, kind }),
    lang, who: whoOf(from), chatType, kind, status: "new",
    chatId, phase,
  };
  try { await putItem(item); } catch { /* 저장소가 없거나 흔들려도 흐름은 막지 않는다 */ }
  return item;
};

/* 그룹에서 그냥 오간 말을 지켜본다 (8/30 서우 — privacy mode 를 끄고 열었다).

   답장하지 않는다. 대화에 끼어들면 그룹이 망가지고, 그건 여기서 얻는 것보다 크다.

   남기는 것은 두 가지뿐이다.
     · 질문으로 보이는 말은 원문을 남긴다 — 그룹에서 물었는데 아무도 답하지 않은
       질문이 지금은 통째로 새고 있다. 1:1 로 봇에 물어야만 잡혔다.
     · 그 밖의 말은 시간·주제·어조만 세고 원문은 버린다. 되돌려 누가 무슨 말을
       했는지 알 수 없는 형태다. 공개 그룹이라도 전 대화를 쌓는 것은 다른 문제다.

   운영 채널로 카드를 보내지 않는다(recordCs 만 부른다) — 잡담이 채널을 덮으면
   정작 급한 카드를 못 본다. */
const observeGroup = async (
  text: string, lang: FaqLang, chatType: string,
  from?: { username?: string; first_name?: string; id?: number },
  chatId?: number,
) => {
  const mood = moodOf(text);
  const topic = topicOf(text);
  await bumpBeat(Date.now(), topic, mood).catch(() => null);
  /* 질문이거나, 질문이 아니어도 사고를 알리는 말이면 원문을 남긴다 */
  if (!isQuestion(text) && !isAlarming(text)) return;
  await recordCs("group", text, lang, chatType, from, chatId).catch(() => null);
};

/* 운영 채널로 카드를 보낸다. 후보를 보여준 건(matched) 보내지 않는다 —
   그건 아직 미해결이라 부를 수 없고, 전부 보내면 채널이 노이즈로 덮인다.
   대시보드에서는 필터로 볼 수 있다. */
const pushCard = async (item: CsItem) => {
  if (!CS_CHAT) return;
  await call("sendMessage", {
    chat_id: CS_CHAT, text: csCard(item),
    reply_markup: csButtons(item.id, item.status),
    disable_web_page_preview: true,
  });
};

const reportCs = async (
  kind: CsKind, text: string, lang: FaqLang, chatType: string,
  from?: { username?: string; first_name?: string; id?: number },
  chatId?: number, phase?: string,
) => {
  if (!text) return;
  await pushCard(await recordCs(kind, text, lang, chatType, from, chatId, phase));
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
      const [kind, langRaw, key, csId] = String(cq.data ?? "").split(":");
      const lang: FaqLang = langRaw === "ko" ? "ko" : "en";
      /* 운영 채널 카드의 상태 버튼. 같은 자리를 고쳐 써서 처리 흐름이 메시지에 남는다. */
      if (kind === "cs" && chat && mid) {
        const next = key as CsStatus;
        const updated = await patchItem(langRaw, { status: next }).catch(() => null);
        if (updated) {
          await call("editMessageText", {
            chat_id: chat, message_id: mid, text: csCard(updated),
            reply_markup: csButtons(updated.id, updated.status),
            disable_web_page_preview: true,
          });
        }
        return Response.json({ ok: true });
      }

      if (kind === "none" && chat && mid) {
        const l: FaqLang = langRaw === "ko" ? "ko" : "en";
        await call("editMessageText", { chat_id: chat, message_id: mid, text: noAnswerText(l) });
        /* 후보를 보여줄 때 만들어 둔 기록을 미해결로 올린다 */
        const up = key ? await patchItem(key, { kind: "unanswered", status: "new" }).catch(() => null) : null;
        if (up) await pushCard(up);
        else {
          /* 옛 버전 메시지 등으로 id 가 없으면 첫 줄의 원문으로 새로 만든다 */
          const raw = String(cq.message?.text ?? "").split("\n")[0].replace(/^"|"$/g, "");
          if (raw) await reportCs("unanswered", raw, l, cq.message?.chat?.type ?? "?", cq.from, chat);
        }
        return Response.json({ ok: true });
      }

      const doc = await getDoc();
      if (chat && mid && doc) {
        if (kind === "p") {
          await call("editMessageText", {
            chat_id: chat, message_id: mid,
            text: menuText(lang), reply_markup: menu(doc, lang, key === "x"),
          });
        } else if (kind === "f") {
          const hit = findFaq(doc, lang, key);
          /* 후보를 눌렀다는 건 그 답으로 갈음됐다는 뜻이다 — FAQ 적중으로 기록한다 */
          /* 사용자가 후보를 눌러 스스로 해결한 순간이다. 닫힌 시각을 같이 남긴다 —
             리포트에서 "봇이 즉시 해결한 건"과 "사람이 답한 건"을 가르는 근거가 된다. */
          if (csId && hit) await patchItem(csId, { status: "done", note: `사용자가 선택: ${hit.q}`, closedAt: Date.now() }).catch(() => null);
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
    if (!wants) {
      /* 봇끼리 주고받는 말과 명령은 세지 않는다 — Rose 의 안내까지 대화로 잡히면
         주제 분포가 통째로 틀어진다 */
      if (!isPrivate && text && !cmd && !msg.from?.is_bot) {
        await observeGroup(text, lang, chat.type ?? "?", msg.from, chat.id);
      }
      return Response.json({ ok: true });
    }

    const doc = await getDoc();
    if (!doc) {
      await call("sendMessage", { chat_id: chat.id, text: offlineText(lang), disable_web_page_preview: true });
      /* 정본이 안 읽히는 동안 들어온 질문도 흘리지 않는다 — 복구 후 답해야 할 목록이다 */
      if (!cmd) await reportCs("offline", text, lang, chat.type ?? "?", msg.from, chat.id);
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
        /* 원문을 첫 줄에 담는 이유: 아래 "찾는 답이 없어요" 를 눌렀을 때 무엇을 물었는지
           되찾아야 하는데, 서버리스라 저장할 데가 없고 콜백 데이터는 64바이트다.
           메시지 자체가 저장소 역할을 한다 — 텔레그램이 콜백에 원본 메시지를 실어 준다. */
        /* 후보를 보여준 것도 기록해 둔다. 사용자가 하나를 누르면 done, "찾는 답이 없어요"를
           누르면 unanswered 로 바뀐다 — 그래야 FAQ 가 실제로 맞았는지 알 수 있다.
           id 를 콜백에 실어 보내므로 원문을 다시 파싱할 필요가 없다(총 20바이트, 제한 64). */
        const rec = await recordCs("matched", text, lang, chat.type ?? "?", msg.from, chat.id, doc.schedule.phase);
        await call("sendMessage", {
          chat_id: chat.id,
          text: `"${text}"\n\n${lang === "ko" ? "이 질문이신가요?" : "Did you mean one of these?"}`,
          reply_markup: { inline_keyboard: [
            ...hits.map((f) => [{ text: f.q, callback_data: `f:${lang}:${f.id}:${rec.id}` }]),
            /* 키워드가 겹쳐 후보가 떴다고 답이 된 것은 아니다. 이 버튼이 없으면
               "정본에 없는 질문"이 후보 뒤에 숨어 CS 인박스에 영영 안 잡힌다. */
            [{ text: lang === "ko" ? "❓ 찾는 답이 없어요" : "❓ None of these", callback_data: `none:${lang}:${rec.id}` }],
          ]},
        });
      } else {
        await call("sendMessage", { chat_id: chat.id, text: noAnswerText(lang), disable_web_page_preview: true });
        await reportCs("unanswered", text, lang, chat.type ?? "?", msg.from, chat.id, doc.schedule.phase);
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
