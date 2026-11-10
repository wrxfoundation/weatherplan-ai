/* 반응 축적 (9/2 서우 — "댓글을 쓴다는 게 아니라 반응들을 축적해 놓으란 거지")

   판정 화면이 아니다. 우리가 한 말에 남이 어떻게 반응했는지를 원문 그대로 쌓고, 셋만 센다 —
     1 우리 문장이 되받아졌는가 (문장별) — 시그니처를 올릴지 정하는 근거
     2 질문·비판이 왔는가 — 팟 공감 열 개보다 회의적 질문 하나가 값지다
     3 오해(수익·가격·리플 관계)가 반복되는가 — 다음 발화에서 먼저 막을 것
   시작값은 lib/reactions.ts(SEED), 화면에서 붙인 것은 KV(rx:items). 둘을 합쳐 보여 준다. */

import { isAuthed } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { listReactions, putReaction, delReaction, newId, storeKind } from "@/lib/store";
import {
  SEED, ACCTS, KINDS, ACTIONS, OUR_LINES, RX_UPDATED, acctLabel, kindLabel, actionLabel,
  type Reaction, type RxAcct, type RxKind, type RxAction,
} from "@/lib/reactions";
import Nav from "../Nav";

export const dynamic = "force-dynamic";

const qs = (o: Record<string, string>) => {
  const p = new URLSearchParams(o);
  for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
  return `${p}`;
};
const todayKst = () => new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
/* ISO 주 — 월요일 시작. 주간 집계표의 행이다. */
const weekOf = (date: string) => {
  const d = new Date(`${date}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  const y = d.getUTCFullYear();
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const week = 1 + Math.round(((d.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
  return `${y}-W${String(week).padStart(2, "0")}`;
};
const isAcct = (v: string): v is RxAcct => ACCTS.some((a) => a.key === v);
const isKind = (v: string): v is RxKind => KINDS.some((a) => a.key === v);
const isAction = (v: string): v is RxAction => ACTIONS.some((a) => a.key === v);

export default async function ReactionsPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  if (!(await isAuthed(sp.k))) redirect("/");
  const k = (await isAuthed()) ? "" : (sp.k ?? "");
  const fAcct = isAcct(sp.acct ?? "") ? (sp.acct as RxAcct) : "";
  const fKind = isKind(sp.kind ?? "") ? (sp.kind as RxKind) : "";
  const oursOnly = sp.ours === "1";
  const view = { k, acct: fAcct, kind: fKind, ours: oursOnly ? "1" : "" };
  const link = (o: Record<string, string>) => `/admin/reactions?${qs({ ...view, ...o })}`;

  async function addReaction(form: FormData) {
    "use server";
    const key = String(form.get("k") ?? "");
    if (!(await isAuthed(key))) return;
    const s = (n: string) => String(form.get(n) ?? "").trim();
    const text = s("text");
    const handle = s("handle").replace(/^@/, "");
    if (!text || !handle) return;
    const acct = s("acct"), kind = s("kind"), action = s("action");
    if (!isAcct(acct) || !isKind(kind) || !isAction(action)) return;
    const date = isDate(s("date")) ? s("date") : todayKst();
    const echoOf = s("echoOf");
    const note = s("note");
    const r: Reaction = {
      id: newId(), at: Date.now(), date, post: s("post") || "(어느 글인지 미기입)", handle, acct, text, kind, action,
      ...(echoOf ? { echoOf } : {}), ...(note ? { note } : {}), ...(form.get("translated") ? { translated: true } : {}),
    };
    await putReaction(r);
    revalidatePath("/admin/reactions");
    redirect(`/admin/reactions?${qs({ k: key })}`);
  }

  async function delReactionAction(form: FormData) {
    "use server";
    const key = String(form.get("k") ?? "");
    if (!(await isAuthed(key))) return;
    const id = String(form.get("id") ?? "");
    if (!id || id.startsWith("s-")) return;
    await delReaction(id);
    revalidatePath("/admin/reactions");
    redirect(`/admin/reactions?${qs({ k: key })}`);
  }

  const stored = await listReactions();
  const all = [...SEED, ...stored].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.at - a.at));
  const list = all
    .filter((r) => !fAcct || r.acct === fAcct)
    .filter((r) => !fKind || r.kind === fKind)
    .filter((r) => !oursOnly || !!r.echoOf);
  const n = (f: (r: Reaction) => boolean) => all.filter(f).length;

  /* 셋만 센다 */
  const echoes = all.filter((r) => r.kind === "echo" && r.echoOf);
  const asked = n((r) => r.kind === "question" || r.kind === "critic");
  const misread = n((r) => r.kind === "misread" || r.kind === "price");

  /* 되받기 — 문장별 */
  const byLine = new Map<string, { n: number; handles: Set<string>; first: string }>();
  for (const r of echoes) {
    const key = r.echoOf as string;
    const cur = byLine.get(key) ?? { n: 0, handles: new Set<string>(), first: r.date };
    cur.n += 1; cur.handles.add(r.handle); if (r.date < cur.first) cur.first = r.date;
    byLine.set(key, cur);
  }
  const lines = [...byLine.entries()].sort((a, b) => b[1].n - a[1].n);

  /* 주간 */
  const byWeek = new Map<string, { total: number; echo: number; asked: number; misread: number }>();
  for (const r of all) {
    const w = weekOf(r.date);
    const cur = byWeek.get(w) ?? { total: 0, echo: 0, asked: 0, misread: 0 };
    cur.total += 1;
    if (r.kind === "echo" && r.echoOf) cur.echo += 1;
    if (r.kind === "question" || r.kind === "critic") cur.asked += 1;
    if (r.kind === "misread" || r.kind === "price") cur.misread += 1;
    byWeek.set(w, cur);
  }
  const weeks = [...byWeek.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));

  const delId = sp.del ?? "";
  const delTarget = delId ? stored.find((r) => r.id === delId) : undefined;
  const heading = [fAcct ? acctLabel(fAcct) : "전체", fKind ? kindLabel(fKind) : "", oursOnly ? "우리 문장 되받기" : ""].filter(Boolean).join(" · ");

  return (
    <>
      <Nav k={k} current="reactions" title="반응 축적"
        sub={<>{all.length}건 · 시작값 {RX_UPDATED} · 저장소 {storeKind() === "kv" ? "KV" : "메모리(임시)"}</>}>
        <span className="flab">계정</span>
        <a className={`chip${fAcct ? "" : " on"}`} href={link({ acct: "" })}>전체 <span className="n">{all.length}</span></a>
        {ACCTS.map((a) => (
          <a key={a.key} className={`chip${fAcct === a.key ? " on" : ""}`} href={link({ acct: a.key })} title={a.hint}>
            {a.label} <span className="n">{n((r) => r.acct === a.key)}</span>
          </a>
        ))}
      </Nav>

      <main className="wrap" style={{ paddingBottom: 72 }}>
        {delTarget && (
          <section className="confirm">
            <h2 className="confirm-h">이 반응을 지웁니다 — 되돌릴 수 없습니다</h2>
            <ul className="confirm-list">
              <li><span className="confirm-w">@{delTarget.handle}</span><span className="confirm-t">{delTarget.text}</span></li>
            </ul>
            <div className="confirm-act">
              <a className="btn" href={link({})}>취소</a>
              <form action={delReactionAction}>
                <input type="hidden" name="k" value={k} />
                <input type="hidden" name="id" value={delTarget.id} />
                <button className="btn danger solid" type="submit">정말 지웁니다</button>
              </form>
            </div>
          </section>
        )}

        {/* 셋만 센다 — 팔로워·좋아요 수는 여기 없다 */}
        <section className="now">
          <a className="now-card lead" href={link({ ours: oursOnly ? "" : "1", kind: "" })}>
            <div className="now-k">우리 문장 되받기</div>
            <div className="now-v mono" style={{ color: echoes.length ? "var(--w-main)" : "var(--dis)" }}>{echoes.length}</div>
            <div className="now-note">{lines.length ? `${lines.length}개 문장` : "아직 없음"} · 시그니처를 올리는 근거</div>
          </a>
          <a className="now-card lead" href={link({ kind: fKind === "question" ? "" : "question", ours: "" })}>
            <div className="now-k">질문 · 비판</div>
            <div className="now-v mono" style={{ color: asked ? "var(--attn-icon)" : "var(--dis)" }}>{asked}</div>
            <div className="now-note">팟 공감 열보다 이게 하나 더 값지다</div>
          </a>
          <a className={`now-card${misread ? " alert" : ""}`} href={link({ kind: fKind === "misread" ? "" : "misread", ours: "" })}>
            <div className="now-k">오해 · 가격</div>
            <div className="now-v mono" style={{ color: misread ? "var(--warn-icon)" : "var(--dis)" }}>{misread}</div>
            <div className="now-note">수익 프레임·티커 — 다음 글에서 먼저 막을 것</div>
          </a>
        </section>

        {/* 붙이기 — 캡처를 보고 원문을 옮긴다. 판정은 적지 않는다. */}
        <details className="sched-box">
          <summary><span className="sched-h">반응 붙이기</span><span className="sched-next">원문 그대로 · 번역이면 표시</span></summary>
          <form action={addReaction} className="rx-form">
            <input type="hidden" name="k" value={k} />
            <label>날짜<input type="date" name="date" defaultValue={todayKst()} /></label>
            <label>계정 (@ 없이)<input name="handle" placeholder="handle" required /></label>
            <label className="wide">어느 글에<input name="post" placeholder="예: 우리 디센트 공지 스레드 · @ifureJack 인용 답글" /></label>
            <label className="wide">원문<textarea name="text" placeholder="반응 원문 그대로" required /></label>
            <label>계정 유형<select name="acct" defaultValue="community">{ACCTS.map((a) => <option key={a.key} value={a.key}>{a.label} — {a.hint}</option>)}</select></label>
            <label>반응 유형<select name="kind" defaultValue="agree">{KINDS.map((a) => <option key={a.key} value={a.key}>{a.label} — {a.hint}</option>)}</select></label>
            <label>우리 조치<select name="action" defaultValue="none">{ACTIONS.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}</select></label>
            <label>되받은 우리 문장 (되받기일 때)
              <input name="echoOf" list="our-lines" placeholder="목록에서 고르거나 직접" />
              <datalist id="our-lines">{OUR_LINES.map((l) => <option key={l} value={l} />)}</datalist>
            </label>
            <label className="wide">메모<input name="note" placeholder="맥락 한 줄 (선택)" /></label>
            <div className="act">
              <label style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <input type="checkbox" name="translated" value="1" /> X 가 번역해 보여준 문장
              </label>
              <span style={{ flex: 1 }} />
              <button className="btn primary" type="submit">붙이기</button>
            </div>
          </form>
        </details>

        {/* 되받기 — 문장별. 이 표가 시그니처 승격의 근거다. */}
        {lines.length > 0 && (
          <div className="rules" style={{ marginTop: 14 }}>
            <h2 className="rules-h">되받기 — 문장별</h2>
            <table className="rx-table">
              <thead><tr><th>문장</th><th>횟수</th><th>계정</th><th>첫 되받기</th></tr></thead>
              <tbody>
                {lines.map(([line, v]) => (
                  <tr key={line}>
                    <td>{line}</td>
                    <td className="num">{v.n}</td>
                    <td>{[...v.handles].map((h) => `@${h}`).join(", ")}</td>
                    <td className="mono" style={{ fontWeight: 500 }}>{v.first}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="frow" style={{ marginTop: 14 }}>
          <span className="flab">반응</span>
          <a className={`chip${fKind || oursOnly ? "" : " on"}`} href={link({ kind: "", ours: "" })}>전체</a>
          {KINDS.map((a) => (
            <a key={a.key} className={`chip${fKind === a.key ? " on" : ""}`} href={link({ kind: a.key, ours: "" })} title={a.hint}>
              {a.label} <span className="n">{n((r) => r.kind === a.key)}</span>
            </a>
          ))}
        </div>

        <p className="rep-sub" style={{ marginTop: 10, marginBottom: 6 }}>
          <b>{heading}</b> · {list.length}건 · 최신이 위
        </p>

        {list.length === 0 ? (
          <div className="notice">이 조건의 반응이 없습니다.</div>
        ) : (
          <div className="faq-list">
            {list.map((r) => (
              <details key={r.id} className="faq-item">
                <summary>
                  <span className="intel-date">{r.date.slice(5).replace("-", "/")}</span>
                  <span className={`rx-acct ${r.acct}`}>{acctLabel(r.acct)}</span>
                  <span className={`rx-kind ${r.kind}`}>{kindLabel(r.kind)}</span>
                  <span className="faq-q">
                    <b>@{r.handle}</b> {r.text.length > 90 ? `${r.text.slice(0, 90)}…` : r.text}
                    {r.translated && <span className="tag watch" style={{ marginLeft: 6 }}>번역</span>}
                  </span>
                </summary>
                <div className="faq-a">
                  <blockquote className="rx-text">{r.text}</blockquote>
                  <div className="intel-src">
                    <a href={`https://x.com/${r.handle}`} target="_blank" rel="noopener noreferrer">@{r.handle}</a>
                    {" · "}{r.post}{" · 우리 조치: "}<b>{actionLabel(r.action)}</b>
                  </div>
                  {r.echoOf && <div className="intel-src">되받은 문장: <b>{r.echoOf}</b></div>}
                  {r.note && <div className="intel-src">메모: {r.note}</div>}
                  {r.id.startsWith("s-") ? (
                    <div className="intel-src">파일 시작값 — 고치려면 <code>lib/reactions.ts</code></div>
                  ) : (
                    <div className="intel-src"><a href={link({ del: r.id })} className="btn ghost" style={{ padding: "2px 6px" }}>지우기</a></div>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}

        {weeks.length > 0 && (
          <div className="rules" style={{ marginTop: 18 }}>
            <h2 className="rules-h">주간 집계</h2>
            <table className="rx-table">
              <thead><tr><th>주</th><th>반응</th><th>되받기</th><th>질문·비판</th><th>오해·가격</th></tr></thead>
              <tbody>
                {weeks.map(([w, v]) => (
                  <tr key={w}>
                    <td className="mono" style={{ fontWeight: 500 }}>{w}</td>
                    <td className="num">{v.total}</td>
                    <td className="num">{v.echo}</td>
                    <td className="num">{v.asked}</td>
                    <td className="num">{v.misread}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="rep-sub" style={{ marginTop: 20 }}>
          정본은 <code>depin/intel/reaction-log.md</code>. 여기 붙인 것은 주간 리뷰 때 파일로 옮긴다.
          되받기가 두 번 넘는 문장은 플레이북 「인용문 제조법」에 올린다.
        </p>
      </main>
    </>
  );
}
