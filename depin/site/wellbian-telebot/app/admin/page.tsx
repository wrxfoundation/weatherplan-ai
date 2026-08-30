/* CS 대시보드 (8/30 서우 — "브랜드 가이드에 맞게, 위계질서와 UX")

   판매 사이트와 같은 토큰·서체를 쓴다(app/globals.css). 관리 도구라고 다른 팔레트를 쓰면
   같은 제품처럼 보이지 않고, 두 화면을 오가는 사람이 한 사람이라 더 그렇다.

   위계는 "지금 손이 필요한가"를 기준으로 넷으로 나눴다.
     1 지금 처리해야 할 것(긴급·미처리) — 가장 크게, 색으로
     2 흐름을 보는 숫자(전체·적중률) — 한 줄로 조용히
     3 검색과 필터 — 도구이지 정보가 아니므로 무게를 낮춘다
     4 목록
   앞의 셋을 다 크게 만들면 위계가 없어지고, 그러면 몰릴 때 눈이 어디에도 먼저 가지 않는다. */

import { listItems, patchItem, getItem, storeKind, type CsStatus } from "@/lib/store";
import { getDoc } from "@/lib/faq-client";
import { tgCall } from "@/lib/tg";
import { STATUS_LABEL, SEV_LABEL, MOOD_LABEL, overdueMin, type CsMoodTag, type CsSeverity } from "@/lib/cs";
import { applyFilters } from "@/lib/filter";
import { clusterItems } from "@/lib/cluster";

export const dynamic = "force-dynamic";
const KEY = process.env.ADMIN_KEY ?? "";

export default async function Admin({
  searchParams,
}: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const k = sp.k ?? "";
  if (!KEY || k !== KEY) {
    return (
      <main className="wrap" style={{ paddingTop: 56 }}>
        <h1 style={{ fontSize: 19, fontWeight: 800 }}>접근 키가 필요합니다</h1>
        <p style={{ marginTop: 8, color: "var(--ink-3)", fontSize: 14 }}>
          {KEY ? "주소 끝에 ?k=… 를 붙여 주세요." : "ADMIN_KEY 환경변수가 설정되지 않았습니다."}
        </p>
      </main>
    );
  }

  const all = await listItems();
  const doc = await getDoc();
  const fStatus = sp.status ?? "", fTopic = sp.topic ?? "", fKind = sp.kind ?? "";
  const fSev = sp.sev ?? "", q = sp.q ?? "";
  const grouped = sp.group === "1";
  const isOpen = (i: { status: string }) => i.status !== "done" && i.status !== "faq";
  const filtered = applyFilters(all, { status: fStatus, topic: fTopic, kind: fKind, sev: fSev, q });

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

  const link = (o: Record<string, string>) => {
    const p = new URLSearchParams({ k, ...(fStatus && { status: fStatus }), ...(fTopic && { topic: fTopic }),
      ...(fKind && { kind: fKind }), ...(fSev && { sev: fSev }), ...(q && { q }),
      ...(grouped && { group: "1" }), ...o });
    for (const [key, v] of [...p.entries()]) if (!v) p.delete(key);
    return `/admin?${p}`;
  };

  async function setStatus(form: FormData) {
    "use server";
    if ((form.get("k") as string) !== KEY) return;
    await patchItem(form.get("id") as string, { status: form.get("to") as CsStatus });
  }
  async function bulkStatus(form: FormData) {
    "use server";
    if ((form.get("k") as string) !== KEY) return;
    const to = form.get("to") as CsStatus;
    for (const id of form.getAll("ids").map(String)) await patchItem(id, { status: to });
  }
  /* 답장 — 정본 FAQ 를 골라 보내는 길을 기본으로 둔다. 답을 새로 쓰지 않으니 발화 규칙을
     매번 검토할 필요가 없고 사이트·봇과 문장이 갈리지도 않는다. 몰릴 때 제일 빠르다. */
  async function sendReply(form: FormData) {
    "use server";
    if ((form.get("k") as string) !== KEY) return;
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
    if (ok) await patchItem(id, { status: "done", note: body, repliedAt: Date.now() });
  }
  /* 한 번에 30건까지 — 서버리스에 시간 제한이 있고 텔레그램도 초당 처리량이 정해져 있다.
     넘치면 도중에 잘려 "보낸 줄 알았는데 안 간" 건이 생긴다. */
  async function bulkReply(form: FormData) {
    "use server";
    if ((form.get("k") as string) !== KEY) return;
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
        await patchItem(id, { status: "done", note: body, repliedAt: Date.now() });
    }
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
            <a className="chip" href={`/admin/people?k=${k}`}>사람</a>
            <a className="chip" href={link({}).replace("/admin?", "/api/admin/export?")}>CSV</a>
            <a className="chip" href={link({}).replace("/admin?", "/api/admin/export?") + "&format=json"}>JSON</a>
          </nav>
        </div>
      </header>

      <main className="wrap" style={{ paddingBottom: 72 }}>
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
            {([["", "종류 전체"], ["open", "답변 없음"], ["matched", "후보 제시"]] as const).map(([v, label]) => (
              <a key={v || "a"} className={`chip${fKind === v ? " on" : ""}`} href={link({ kind: v })}>
                {label}<span className="n">
                  {v === "" ? all.length : v === "open" ? count((i) => i.kind !== "matched") : shown}
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
                    {i.kind === "offline" && <><span className="sep">·</span><span>정본 미로딩</span></>}
                    <span className="right">{when(i.at)} · {i.who}</span>
                  </div>

                  <p className="q">{i.text}</p>

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
      </main>
    </>
  );
}
