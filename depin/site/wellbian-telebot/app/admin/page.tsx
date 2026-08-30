/* CS 대시보드 (8/30 서우 — "브랜드 가이드에 맞게, 위계질서와 UX")

   판매 사이트와 같은 토큰·서체를 쓴다(app/globals.css). 관리 도구라고 다른 팔레트를 쓰면
   같은 제품처럼 보이지 않고, 두 화면을 오가는 사람이 한 사람이라 더 그렇다.

   위계는 "지금 손이 필요한가"를 기준으로 넷으로 나눴다.
     1 지금 처리해야 할 것(긴급·미처리) — 가장 크게, 색으로
     2 흐름을 보는 숫자(전체·적중률) — 한 줄로 조용히
     3 검색과 필터 — 도구이지 정보가 아니므로 무게를 낮춘다
     4 목록
   앞의 셋을 다 크게 만들면 위계가 없어지고, 그러면 몰릴 때 눈이 어디에도 먼저 가지 않는다. */

import { listItems, patchItem, getItem, delItems, storeKind, type CsStatus } from "@/lib/store";
import { getDoc } from "@/lib/faq-client";
import { tgCall } from "@/lib/tg";
import { STATUS_LABEL, SEV_LABEL, MOOD_LABEL, TOPICS, overdueMin, type CsMoodTag, type CsSeverity } from "@/lib/cs";
import { applyFilters } from "@/lib/filter";
import { pulse } from "@/lib/report";
import { clusterItems } from "@/lib/cluster";
import { ADMIN_KEY, isAuthed, clearAuthCookie } from "@/lib/auth";
import { redirect } from "next/navigation";
import Keys from "./Keys";
/* 서버 액션이 저장을 마쳐도 라우터가 들고 있던 화면을 그대로 다시 그린다 — 값은 바뀌었는데
   버튼과 정렬은 그대로여서, 눌러도 아무 일이 없는 것처럼 보인다. 몰릴 때 같은 건을 두 번
   누르게 되는 자리다. 고친 뒤 이 경로를 무효화해서 다시 읽게 한다. */
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

/* 주소 조립은 컴포넌트 밖에 둔다. 서버 액션이 클로저로 함수를 끌어안으면 직렬화할 수 없어
   ("Functions cannot be passed directly to Client Components") 화면이 통째로 깨진다.
   액션이 무는 건 문자열뿐이어야 한다. */
/* 닫으면 시각을 남기고, 다시 열면 지운다. 처리 시간을 재는 근거가 이 값 하나다.

   adminUrl 과 같은 이유로 컴포넌트 밖에 둔다 — 서버 액션이 컴포넌트 안의 함수를 클로저로
   물면 직렬화가 깨지고(React #441), 저장은 되는데 화면이 안 바뀌거나 아예 아무 일도
   일어나지 않는다. 액션이 무는 건 문자열과 값뿐이어야 한다. */
const closeStamp = (to: string) =>
  to === "done" || to === "faq" ? { closedAt: Date.now() } : { closedAt: undefined };

const adminUrl = (o: Record<string, string>) => {
  const p = new URLSearchParams(o);
  for (const [key, v] of [...p.entries()]) if (!v) p.delete(key);
  return `/admin?${p}`;
};

export default async function Admin({
  searchParams,
}: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  /* 첫 화면에서 한 번 열면 쿠키로 기억한다. 주소로 들어온 ?k= 도 계속 받는다 —
     이미 저장해 둔 링크가 있고, 쿠키를 못 쓰는 상황에서 들어올 길을 막을 이유가 없다. */
  if (!(await isAuthed(sp.k))) redirect("/");
  /* 쿠키로 통과했으면 링크에 키를 붙이지 않는다 — 주소창에 남기지 않으려는 것이다 */
  const k = (await isAuthed()) ? "" : (sp.k ?? "");

  const all = await listItems();
  const doc = await getDoc();
  const fStatus = sp.status ?? "", fTopic = sp.topic ?? "", fKind = sp.kind ?? "";
  const fSev = sp.sev ?? "", q = sp.q ?? "";
  const grouped = sp.group === "1";
  const isOpen = (i: { status: string }) => i.status !== "done" && i.status !== "faq";
  const filtered = applyFilters(all, { status: fStatus, topic: fTopic, kind: fKind, sev: fSev, q });
  /* 추이는 걸어 둔 필터와 무관하게 전체로 본다 — 필터를 좁힌 채로 "줄었다" 고 읽으면 위험하다 */
  const pl = pulse(all);
  const pulsePeak = Math.max(1, ...pl.bars.map((b) => b.n));

  /* 순서가 곧 위계다. 시간순으로 두면 긴급 건이 목록 맨 아래로 밀려서, 화면 위쪽에
     "긴급 2건"이라고 크게 띄워 놓고 정작 그 두 건은 스크롤을 한참 내려야 나온다.
     그래서 미처리 → 긴급도 → 오래 기다린 순으로 세운다. 같은 급이면 먼저 물은 사람이
     먼저다. 닫힌 건만 최신순으로 뒤에 붙인다 — 그건 훑어보는 기록이지 처리 대상이 아니다. */
  const rank = (i: typeof all[number]) =>
    !isOpen(i) ? 9 : i.sev === "high" ? 0 : i.sev === "mid" ? 1 : 2;
  const items = [...filtered].sort((a, b) => {
    const ra = rank(a), rb = rank(b);
    return ra !== rb ? ra - rb : ra === 9 ? b.at - a.at : a.at - b.at;
  });
  const clusters = grouped ? clusterItems(items) : [];

  const count = (f: (i: typeof all[number]) => boolean) => all.filter(f).length;
  const topics = [...new Set(all.map((i) => i.topic))].sort();

  const urgentOpen = count((i) => i.sev === "high" && isOpen(i));
  const openCount = count((i) => i.kind !== "matched" && isOpen(i));
  const overdue = count((i) => isOpen(i) && overdueMin(i.at, (i.sev ?? "low") as CsSeverity) > 0);
  const shown = count((i) => i.kind === "matched");
  const solved = count((i) => i.kind === "matched" && i.status === "done");
  const hit = shown ? Math.round((solved / shown) * 100) : null;

  /* 내보내기는 별도 라우트라 쿠키로도 통과하지만, ?k= 세션에서는 쿠키가 없으므로 그대로 잇는다 */
  /* 지금 보고 있는 화면. 서버 액션은 이 값(문자열들)만 물고 돌아온다 — 지운 뒤에도
     걸어 둔 필터가 그대로 남아야 하던 일을 이어서 할 수 있다. */
  const view = { k, status: fStatus, topic: fTopic, kind: fKind, sev: fSev, q, group: grouped ? "1" : "" };
  const link = (o: Record<string, string>) => adminUrl({ ...view, ...o });

  /* 지울 대상은 주소로 넘긴다. 두 번 묻기 위해서다 — 한 번의 오조작으로 기록이 사라지는
     자리를 만들지 않는다. 실전에서는 되돌릴 방법이 없다. */
  const delIds = (sp.del ?? "").split(".").filter(Boolean);
  const delTargets = delIds.length ? all.filter((i) => delIds.includes(i.id)) : [];

  async function doDelete(form: FormData) {
    "use server";
    if (!(await isAuthed(String(form.get("k") ?? "")))) return;
    await delItems(String(form.get("ids") ?? "").split(".").filter(Boolean));
    revalidatePath("/admin");
    redirect(adminUrl({ ...view, del: "" }));
  }

  async function logout() {
    "use server";
    await clearAuthCookie();
    redirect("/");
  }

  /* 자동 분류를 손으로 고친다. 오분류를 못 고치면 정렬·필터·리포트가 같이 틀어진다 —
     한 건이 "일반"으로 잘못 잡히면 목록 아래로 가라앉아 아무도 다시 보지 않는다. */
  async function reclassify(form: FormData) {
    "use server";
    if (!(await isAuthed(String(form.get("k") ?? "")))) return;
    const id = String(form.get("id") ?? "");
    const cur = await getItem(id);
    if (!cur) return;
    const topic = String(form.get("topic") ?? "") || cur.topic;
    const sev = (String(form.get("sev") ?? "") || cur.sev || "low") as CsSeverity;
    const changed = topic !== cur.topic || sev !== (cur.sev ?? "low");
    await patchItem(id, changed ? { topic, sev, fixed: true } : { topic, sev });
    revalidatePath("/admin");
  }

  async function setStatus(form: FormData) {
    "use server";
    if (!(await isAuthed(String(form.get("k") ?? "")))) return;
    const to = form.get("to") as CsStatus;
    await patchItem(form.get("id") as string, { status: to, ...closeStamp(to) });
    revalidatePath("/admin");
  }
  /* 지우기도 이 폼으로 받는다. 버튼마다 formAction 을 다르게 주면 하이드레이션 전에는
     눌리지 않는다 — 서버에서 그려 보내는 화면이라 자바스크립트가 늦거나 막혀도 동작해야 한다. */
  async function bulkStatus(form: FormData) {
    "use server";
    if (!(await isAuthed(String(form.get("k") ?? "")))) return;
    const to = String(form.get("to") ?? "");
    const ids = form.getAll("ids").map(String).filter(Boolean);
    if (!ids.length) return;
    /* 지우기는 여기서 실행하지 않는다. 무엇을 지우는지 보여 주고 한 번 더 묻는다. */
    if (to === "del") redirect(adminUrl({ ...view, del: ids.join(".") }));
    for (const id of ids) await patchItem(id, { status: to as CsStatus, ...closeStamp(to) });
    revalidatePath("/admin");
  }
  /* 답장 — 정본 FAQ 를 골라 보내는 길을 기본으로 둔다. 답을 새로 쓰지 않으니 발화 규칙을
     매번 검토할 필요가 없고 사이트·봇과 문장이 갈리지도 않는다. 몰릴 때 제일 빠르다. */
  async function sendReply(form: FormData) {
    "use server";
    if (!(await isAuthed(String(form.get("k") ?? "")))) return;
    const id = form.get("id") as string;
    const item = await getItem(id);
    if (!item?.chatId) return;
    let body = String(form.get("text") ?? "").trim();
    const faqId = String(form.get("faqId") ?? "");
    if (faqId) {
      const d = await getDoc();
      const hitF = d?.faq[item.lang === "ko" ? "ko" : "en"]?.find((f) => f.id === faqId);
      if (hitF) body = `${hitF.q}\n\n${hitF.a}`;
    }
    if (!body) return;
    const ok = await tgCall("sendMessage", { chat_id: item.chatId, text: body, disable_web_page_preview: true });
    /* 보내지 못했으면 완료로 바꾸지 않는다 — 안 간 답을 완료로 적으면 그 사람은 잊힌다 */
    if (ok) await patchItem(id, { status: "done", note: body, repliedAt: Date.now(), closedAt: Date.now() });
    revalidatePath("/admin");
  }
  /* 한 번에 30건까지 — 서버리스에 시간 제한이 있고 텔레그램도 초당 처리량이 정해져 있다.
     넘치면 도중에 잘려 "보낸 줄 알았는데 안 간" 건이 생긴다. */
  async function bulkReply(form: FormData) {
    "use server";
    if (!(await isAuthed(String(form.get("k") ?? "")))) return;
    const faqId = String(form.get("faqId") ?? "");
    if (!faqId) return;
    const d = await getDoc();
    for (const id of form.getAll("ids").map(String).slice(0, 30)) {
      const item = await getItem(id);
      if (!item?.chatId || item.status === "done") continue;
      const hitF = d?.faq[item.lang === "ko" ? "ko" : "en"]?.find((f) => f.id === faqId);
      if (!hitF) continue;
      const body = `${hitF.q}\n\n${hitF.a}`;
      if (await tgCall("sendMessage", { chat_id: item.chatId, text: body, disable_web_page_preview: true }))
        await patchItem(id, { status: "done", note: body, repliedAt: Date.now(), closedAt: Date.now() });
    }
    revalidatePath("/admin");
  }

  const when = (ms: number) => {
    const t = new Date(ms + 9 * 3600000);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${t.getUTCMonth() + 1}/${t.getUTCDate()} ${p(t.getUTCHours())}:${p(t.getUTCMinutes())}`;
  };

  const faqOptions = (lang: string) => (doc?.faq[lang === "ko" ? "ko" : "en"] ?? []);

  return (
    <>
      <header className="top">
        <div className="wrap top-in">
          <span className="brand">CS 인박스</span>
          <span className="brand-sub">
            @wellbiantalk · 저장소 {storeKind() === "kv" ? "KV" : "메모리(임시)"}
          </span>
          <nav className="top-nav">
            <a className={`chip${grouped ? " on" : ""}`} href={link({ group: grouped ? "" : "1" })}>
              묶어 보기
            </a>
            <a className="chip" href={`/admin/faq?k=${k}`}>정본</a>
            <a className="chip" href={`/admin/report?k=${k}`}>리포트</a>
            <a className="chip" href={`/admin/people?k=${k}`}>사람</a>
            <a className="chip" href={link({}).replace("/admin?", "/api/admin/export?")}>CSV</a>
            <a className="chip" href={link({}).replace("/admin?", "/api/admin/export?") + "&format=json"}>JSON</a>
            <form action={logout}><button className="chip" type="submit">닫기</button></form>
          </nav>
        </div>
      </header>

      <main className="wrap" style={{ paddingBottom: 72 }}>
        {/* 두 번째 물음. 무엇을 지우는지 원문으로 보여 준다 — 개수만 보여 주면 확인이 아니라
            그냥 한 번 더 누르는 절차가 된다. 취소가 기본이 되도록 왼쪽에 둔다. */}
        {delTargets.length > 0 && (
          <section className="confirm">
            <h2 className="confirm-h">{delTargets.length}건을 지웁니다 — 되돌릴 수 없습니다</h2>
            <ul className="confirm-list">
              {delTargets.slice(0, 8).map((i) => (
                <li key={i.id}>
                  <span className={`tag st-${i.status}`}>
                    {STATUS_LABEL[i.status as keyof typeof STATUS_LABEL] ?? i.status}
                  </span>
                  <span className="confirm-t">{i.text}</span>
                  <span className="confirm-w">{i.who}</span>
                </li>
              ))}
              {delTargets.length > 8 && <li className="confirm-more">그 밖 {delTargets.length - 8}건</li>}
            </ul>
            <div className="confirm-act">
              <a className="btn" href={link({ del: "" })}>취소</a>
              <form action={doDelete}>
                <input type="hidden" name="k" value={k} />
                <input type="hidden" name="ids" value={delIds.join(".")} />
                <button className="btn danger solid" type="submit">정말 지웁니다</button>
              </form>
            </div>
          </section>
        )}

        {storeKind() === "memory" && (
          <div className="notice">
            KV 가 연결되지 않았습니다. 지금 기록은 서버가 살아 있는 동안만 남고 배포·재시작에 사라집니다.
            Vercel 프로젝트 → Storage 에서 KV 를 만들어 이 프로젝트에 연결하면 환경변수가 자동으로 붙습니다.
          </div>
        )}

        {/* 1차 — 지금 손이 필요한 것 */}
        <section className="now">
          <a className={`now-card lead${urgentOpen ? " alert" : ""}`} href={link({ sev: "high", status: "" })}>
            <div className="now-k">긴급 · 미처리</div>
            <div className="now-v mono" style={{ color: urgentOpen ? "var(--warn-icon)" : "var(--dis)" }}>
              {urgentOpen}
            </div>
            <div className="now-note">{urgentOpen ? "30분 안에 답해야 합니다" : "지금은 없습니다"}</div>
          </a>
          <a className="now-card lead" href={link({ kind: "open", status: "new", sev: "" })}>
            <div className="now-k">처리 필요</div>
            <div className="now-v mono" style={{ color: openCount ? "var(--w-main)" : "var(--dis)" }}>
              {openCount}
            </div>
            <div className="now-note">답변 없음 · 아직 닫히지 않음</div>
          </a>
          <a className="now-card" href={link({ status: "", sev: "", kind: "" })}>
            <div className="now-k">기한 초과</div>
            <div className="now-v mono" style={{ color: overdue ? "var(--attn-icon)" : "var(--dis)" }}>
              {overdue}
            </div>
            <div className="now-note">긴급 30분 · 주의 4시간 · 일반 24시간</div>
          </a>
        </section>

        {/* 1.5차 — 늘고 있는가 (8/30 서우: "빠르게 현황 파악")
            카드 셋은 지금 이 순간의 스냅샷이라, 몰리는 중인지 잦아드는 중인지를 말해 주지 못한다. */}
        <section className="pulse">
          <span className="pulse-k">최근 12시간</span>
          <span className="pulse-bars" aria-hidden>
            {pl.bars.map((b) => (
              <span key={b.from} className="pulse-bar" title={`${b.label} · ${b.n}건`}>
                <span className="pulse-fill" style={{ height: `${Math.max(b.n ? 8 : 2, (b.n / pulsePeak) * 100)}%` }} />
              </span>
            ))}
          </span>
          <span className="pulse-now">
            <b className="mono">{pl.lastHour}</b>건
            <span className="pulse-k"> / 시간</span>
          </span>
          <span className={`pulse-d${pl.delta > 0 ? " up" : pl.delta < 0 ? " down" : ""}`}>
            {pl.delta === 0 ? "직전 시간과 같음" : `직전 시간보다 ${pl.delta > 0 ? "+" : ""}${pl.delta}`}
          </span>
          <a className="chip" href={`/admin/report?k=${k}&span=24h`}>리포트에서 보기 →</a>
        </section>

        {/* 2차 — 흐름을 보는 숫자 */}
        <section className="sub">
          <span><span className="sub-k">들어온 문의</span><b className="sub-v mono">{all.length}</b></span>
          <span>
            <span className="sub-k">FAQ 적중률</span>
            <b className="sub-v mono" style={{ color: hit === null ? "var(--dis)" : hit >= 60 ? "var(--ok-text)" : "var(--attn-icon)" }}>
              {hit === null ? "—" : `${hit}%`}
            </b>
            <span className="sub-k" style={{ marginLeft: 4 }}>({solved}/{shown})</span>
          </span>
          <span className="sub-note">
            적중률은 후보를 보여준 질문 중 사용자가 실제로 하나를 눌러 해결된 비율입니다.
          </span>
        </section>

        {/* 3차 — 검색과 필터 */}
        <section className="tools">
          <form className="search" method="get" action="/admin">
            <input type="hidden" name="k" value={k} />
            {fStatus && <input type="hidden" name="status" value={fStatus} />}
            {fTopic && <input type="hidden" name="topic" value={fTopic} />}
            {fKind && <input type="hidden" name="kind" value={fKind} />}
            {fSev && <input type="hidden" name="sev" value={fSev} />}
            {grouped && <input type="hidden" name="group" value="1" />}
            <input name="q" defaultValue={q} placeholder="원문 · 답장 · 사용자 검색" />
            <button className="btn primary" type="submit">검색</button>
            {q && <a className="btn ghost" href={link({ q: "" })}>지우기</a>}
          </form>

          <div className="frow">
            <span className="flab">긴급도</span>
            {([["", "전체", ""], ["high", SEV_LABEL.high, "danger"], ["mid", SEV_LABEL.mid, "attn"], ["low", SEV_LABEL.low, ""]] as const)
              .map(([v, label, cls]) => (
              <a key={v || "a"} className={`chip ${cls}${fSev === v ? " on" : ""}`} href={link({ sev: v })}>
                {label}<span className="n">{v ? count((i) => (i.sev ?? "low") === v) : all.length}</span>
              </a>
            ))}
          </div>
          <div className="frow">
            <span className="flab">상태</span>
            {([["", "전체"], ["new", STATUS_LABEL.new], ["doing", STATUS_LABEL.doing],
               ["done", STATUS_LABEL.done], ["faq", STATUS_LABEL.faq]] as const).map(([v, label]) => (
              <a key={v || "a"} className={`chip${fStatus === v ? " on" : ""}`} href={link({ status: v })}>
                {label}<span className="n">{v ? count((i) => i.status === v) : all.length}</span>
              </a>
            ))}
            <span style={{ width: 10 }} />
            {/* 8/30: 그룹에서 그냥 오간 말도 들어오기 시작했다. 봇에게 직접 물은 것과
                갈라 볼 수 있어야 처리 대상이 흐려지지 않는다. */}
            {([["", "종류 전체"], ["open", "답변 없음"], ["matched", "후보 제시"],
               ["direct", "봇에 직접"], ["group", "그룹 대화"]] as const).map(([v, label]) => (
              <a key={v || "a"} className={`chip${fKind === v ? " on" : ""}`} href={link({ kind: v })}>
                {label}<span className="n">
                  {v === "" ? all.length
                    : v === "open" ? count((i) => i.kind !== "matched")
                    : v === "matched" ? shown
                    : v === "direct" ? count((i) => i.kind !== "group")
                    : count((i) => i.kind === "group")}
                </span>
              </a>
            ))}
          </div>
          {topics.length > 0 && (
            <div className="frow">
              <span className="flab">주제</span>
              <a className={`chip${fTopic ? "" : " on"}`} href={link({ topic: "" })}>전체</a>
              {topics.map((t) => (
                <a key={t} className={`chip${fTopic === t ? " on" : ""}`} href={link({ topic: t })}>
                  {t}<span className="n">{count((i) => i.topic === t)}</span>
                </a>
              ))}
            </div>
          )}
        </section>

        {/* 4차 — 목록 */}
        {items.length === 0 ? (
          <p className="empty">
            {all.length === 0
              ? "아직 기록이 없습니다. 봇이 답하지 못한 질문이 여기 쌓입니다."
              : "이 조건에 해당하는 항목이 없습니다."}
          </p>
        ) : grouped ? (
          clusters.map((c) => {
            const open = c.members.filter(isOpen);
            return (
              <article key={c.head.id} className={`item sev-${c.head.sev ?? "low"}`}>
                <div className="meta">
                  <span className="tag st-new">{c.members.length}건</span>
                  {c.head.sev === "high" && <span className="tag high">{SEV_LABEL.high}</span>}
                  <span>{c.head.topic}</span>
                  <span className="sep">·</span>
                  <span>미처리 {open.length}건</span>
                </div>
                <p className="q">{c.head.text}</p>
                {c.members.length > 1 && (
                  <details style={{ marginBottom: 10 }}>
                    <summary style={{ fontSize: 12.5, color: "var(--cap)" }}>
                      묶인 원문 {c.members.length}건
                    </summary>
                    <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13,
                                 color: "var(--ink-3)", lineHeight: 1.75 }}>
                      {c.members.map((m) => (
                        <li key={m.id}>{m.text} <span style={{ color: "var(--hint)" }}>— {m.who}</span></li>
                      ))}
                    </ul>
                  </details>
                )}
                {open.length > 0 ? (
                  <form action={bulkReply} className="reply-row">
                    <input type="hidden" name="k" value={k} />
                    {open.slice(0, 30).map((m) => <input key={m.id} type="hidden" name="ids" value={m.id} />)}
                    <select name="faqId" defaultValue="">
                      <option value="">정본 FAQ 고르기…</option>
                      {faqOptions(c.head.lang).map((f) => <option key={f.id} value={f.id}>{f.q}</option>)}
                    </select>
                    <button className="btn primary" type="submit">
                      {Math.min(open.length, 30)}건에 한 번에 답장
                    </button>
                    {open.length > 30 && (
                      <span style={{ fontSize: 11.5, color: "var(--hint)", alignSelf: "center" }}>
                        한 번에 30건까지 — 남은 {open.length - 30}건은 다시 누르세요
                      </span>
                    )}
                  </form>
                ) : (
                  <div style={{ fontSize: 12.5, color: "var(--ok-text)" }}>모두 처리됨</div>
                )}
              </article>
            );
          })
        ) : (
          <>
            {/* 체크박스는 카드 안에 있고 폼은 밖에 있다 — 카드에 이미 폼이 있어 중첩할 수 없다.
                HTML 의 form 속성으로 이어 붙인다. */}
            <form id="bulk" action={bulkStatus} className="bulk">
              <input type="hidden" name="k" value={k} />
              <span className="bulk-k">선택한 건을 한 번에</span>
              {(["doing", "done", "faq"] as const).map((st) => (
                <button key={st} className="btn" type="submit" name="to" value={st}>{STATUS_LABEL[st]}</button>
              ))}
              {/* 지우기는 되돌릴 수 없으므로 다른 동작들과 떼어 두고, 눌러도 바로 지우지 않는다 */}
              <button className="btn danger" type="submit" name="to" value="del"
                      style={{ marginLeft: "auto" }}>삭제</button>
            </form>

            {items.map((i) => {
              const over = isOpen(i) ? overdueMin(i.at, (i.sev ?? "low") as CsSeverity) : 0;
              /* 긴급하고 아직 안 닫힌 건은 답장창을 처음부터 펴 둔다 — 한 번 더 누르게 하면
                 몰릴 때 그 한 번이 쌓인다 */
              const openReply = i.sev === "high" && isOpen(i);
              return (
                <article key={i.id} className={`item sev-${i.sev ?? "low"}${i.status === "done" ? " done" : ""}`}>
                  <div className="meta">
                    <input type="checkbox" name="ids" value={i.id} form="bulk" aria-label="선택"
                           style={{ accentColor: "var(--w-main)" }} />
                    <span className={`tag st-${i.status}`}>
                      {STATUS_LABEL[i.status as keyof typeof STATUS_LABEL] ?? i.status}
                    </span>
                    {i.sev === "high" && <span className="tag high">{SEV_LABEL.high}</span>}
                    {over > 0 && (
                      <span className="tag over">
                        {over >= 60 ? `${Math.floor(over / 60)}시간` : `${over}분`} 초과
                      </span>
                    )}
                    <span>{i.topic}</span>
                    {i.mood === "negative" && <span className="tag mood-neg">{MOOD_LABEL.negative}</span>}
                    {i.mood !== "negative" && <><span className="sep">·</span><span>{MOOD_LABEL[i.mood as CsMoodTag]}</span></>}
                    <span className="sep">·</span><span>{i.lang}</span>
                    <span className="sep">·</span><span>{i.chatType === "private" ? "1:1" : "그룹"}</span>
                    {i.kind === "matched" && <><span className="sep">·</span><span>후보 제시</span></>}
                    {/* 봇에게 물은 것이 아니라 그룹에서 오간 말을 지켜본 것이다 —
                        답장 대상이 아닐 수 있으므로 눈에 띄게 구분한다 */}
                    {i.kind === "group" && <span className="tag watch">지켜봄</span>}
                    {i.kind === "offline" && <><span className="sep">·</span><span>정본 미로딩</span></>}
                  </div>

                  {/* 8/30 서우: 언제·누가를 오른쪽 끝으로 밀어 두니 넓은 화면에서 문의 내용과
                      멀찍이 떨어져, 한 건을 읽는 데 눈이 두 번 움직였다. 원문 옆에 붙인다. */}
                  <div className="qline">
                    <p className="q">{i.text}</p>
                    <span className="qwho">{when(i.at)} · {i.who}</span>
                  </div>

                  {i.note && (
                    <div className="said">
                      <b style={{ color: "var(--ink-2)" }}>{i.repliedAt ? "보낸 답장" : "메모"}</b>
                      {"\n"}{i.note}
                    </div>
                  )}

                  <div className="acts">
                    <form action={setStatus} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <input type="hidden" name="k" value={k} />
                      <input type="hidden" name="id" value={i.id} />
                      {(["new", "doing", "done", "faq"] as const).filter((s) => s !== i.status).map((s) => (
                        <button key={s} className="btn" type="submit" name="to" value={s}>{STATUS_LABEL[s]}</button>
                      ))}
                    </form>
                  </div>

                  {/* 분류 고치기 — 긴급도는 한 번에 눌러 바꾼다(정렬에 바로 걸리므로 제일 급하다).
                      주제는 고를 것이 여덟 개라 select 로 두되 같은 줄에 둔다. */}
                  <div className="fixrow">
                    <form action={reclassify} className="fixrow-in">
                      <input type="hidden" name="k" value={k} />
                      <input type="hidden" name="id" value={i.id} />
                      <span className="fix-k">긴급도</span>
                      {(["high", "mid", "low"] as const).map((v) => (
                        <button key={v} type="submit" name="sev" value={v}
                                className={`chip sev-${v}${(i.sev ?? "low") === v ? " on" : ""}`}
                                disabled={(i.sev ?? "low") === v}>
                          {SEV_LABEL[v]}
                        </button>
                      ))}
                      <span className="fix-k" style={{ marginLeft: 6 }}>주제</span>
                      <select name="topic" defaultValue={i.topic} aria-label="주제">
                        {TOPICS.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
                      </select>
                      <button className="btn" type="submit">바꿈</button>
                      {i.fixed && <span className="fix-mark">고친 분류</span>}
                    </form>
                    {/* 응대하는 자리에서 정본으로 바로 건너간다 — 원문을 그대로 검색어로 넘기면
                        봇이 이 질문에 무엇을 고르는지까지 같이 보인다 */}
                    <a className="fix-faq" target="_blank" rel="noreferrer"
                       href={`/admin/faq?${new URLSearchParams({ ...(k && { k }), q: i.text.slice(0, 60) })}`}>
                      정본에서 찾기 ↗
                    </a>
                  </div>

                  {i.chatId ? (
                    <details className="reply" open={openReply}>
                      <summary>답장 보내기</summary>
                      <form action={sendReply} className="reply-row">
                        <input type="hidden" name="k" value={k} />
                        <input type="hidden" name="id" value={i.id} />
                        <select name="faqId" defaultValue="">
                          <option value="">정본 FAQ 고르기…</option>
                          {faqOptions(i.lang).map((f) => <option key={f.id} value={f.id}>{f.q}</option>)}
                        </select>
                        <button className="btn primary" type="submit">정본으로 답장</button>
                      </form>
                      <form action={sendReply} className="reply-row">
                        <input type="hidden" name="k" value={k} />
                        <input type="hidden" name="id" value={i.id} />
                        <textarea name="text" rows={2}
                          placeholder="직접 쓰기 — 정본에 없는 값(가격·수량·일정)은 확정 전까지 쓰지 않습니다" />
                        <button className="btn" type="submit" style={{ alignSelf: "flex-start" }}>답장</button>
                      </form>
                    </details>
                  ) : (
                    <div style={{ fontSize: 12, color: "var(--hint)", marginTop: 8 }}>
                      답장 대상 정보가 없는 옛 기록입니다
                    </div>
                  )}
                </article>
              );
            })}
          </>
        )}
        <Keys />
      </main>
    </>
  );
}
