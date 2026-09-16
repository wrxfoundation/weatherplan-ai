/* 정본 보기 (8/30 서우 — "듀얼 모니터로 보면서 응대")

   한쪽 화면에 띄워 두고 쓰는 자리다. 그래서 두 가지를 노렸다.

   첫째, 검색은 봇이 쓰는 것과 같은 함수(searchFaq)를 그대로 쓴다. 문의 원문을
   붙여넣으면 "봇이라면 무엇을 골랐을까" 가 그대로 보인다. 후보가 0이면 정본에
   답이 없다는 뜻이고, 그게 곧 정본에 채울 목록이다 — 리포트가 사후에 세는 것을
   여기서는 응대하는 순간에 알 수 있다.

   둘째, 답을 눈으로 옮겨 적지 않게 한다. 옮겨 적으면 오타가 나고, 그 오타가
   커뮤니티에 남는다. 복사 단추를 답마다 붙였다.

   정본 사본을 만들지 않는다. 판매 사이트의 /api/faq 를 60초 캐시로 읽을 뿐이라,
   사이트를 재배포하면 여기도 따라 바뀐다. */

import { getDoc, cacheInfo, searchFaq, type FaqLang } from "@/lib/faq-client";
import { isAuthed } from "@/lib/auth";
import { redirect } from "next/navigation";
import Copy from "./Copy";
import Nav from "../Nav";

export const dynamic = "force-dynamic";

/* 표시는 KST 로 고정한다. 서버는 UTC 로 돌고 보는 사람은 한국에 있다. */
const kst = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric",
    day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });

const qs = (o: Record<string, string>) => {
  const p = new URLSearchParams(o);
  for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
  return `${p}`;
};

export default async function FaqPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  if (!(await isAuthed(sp.k))) redirect("/");
  const k = (await isAuthed()) ? "" : (sp.k ?? "");

  const lang: FaqLang = sp.lang === "en" ? "en" : "ko";
  const q = (sp.q ?? "").trim();

  const doc = await getDoc();
  const info = cacheInfo();
  const list = doc?.faq[lang] ?? [];
  const hits = doc && q ? searchFaq(doc, lang, q) : [];
  const hitIds = new Set(hits.map((f) => f.id));

  const link = (o: Record<string, string>) => `/admin/faq?${qs({ k, lang, q, ...o })}`;
  const base = list.filter((f) => !f.extra);
  const extra = list.filter((f) => f.extra);
  /* 아직 지나지 않은 첫 단계 — 접었을 때 요약에 남길 값이다 */
  const nextM = doc?.schedule?.milestones?.find((m) => new Date(m.at).getTime() > Date.now()) ?? null;

  return (
    <>
      <Nav k={k} current="faq" title="정본 보기"
        sub={<>{list.length}문항{info.ageSec !== null && ` · ${info.ageSec}초 전에 읽음`}</>}>
        <span className="flab">언어</span>
        {(["ko", "en"] as const).map((l) => (
          /* 언어를 바꾸면 검색어를 비운다 — 한국어로 찾던 말을 영어 목록에 대면
             "정본에 답이 없다" 는 안내가 뜨는데, 그건 사실이 아니다 */
          <a key={l} className={`chip${lang === l ? " on" : ""}`} href={link({ lang: l, q: "" })}>
            {l === "ko" ? "한국어" : "English"}
          </a>
        ))}
      </Nav>

      <main className="wrap" style={{ paddingBottom: 72 }}>
        {!doc ? (
          <div className="notice" style={{ marginTop: 18 }}>
            정본을 읽어 오지 못했습니다{info.last ? ` — ${info.last.note}${info.last.status ? ` (${info.last.status})` : ""}` : ""}.
            판매 사이트의 <code>/api/faq</code> 가 열려 있는지, <code>FAQ_SOURCE_URL</code> 이 맞는지 확인해 주세요.
          </div>
        ) : (
          <>
            {/* 일정 (8/30 서우: "맨 위로, 펴기 상태이나 접을 수 있게")
                응대 중 제일 자주 확인하는 값이라 맨 앞에 둔다. 다만 늘 펴 두면 문항 목록이
                그만큼 밀리므로 접을 수 있게 하고, 접었을 때도 다음 단계는 요약에 남긴다 —
                접어 놓고 다시 펴야 알 수 있으면 접는 의미가 없다. */}
            {doc.schedule?.milestones?.length > 0 && (
              <details className="sched-box" open>
                <summary>
                  <span className="sched-h">일정</span>
                  {nextM && (
                    <span className="sched-next">
                      다음 — {nextM.label[lang]} <b className="mono">{kst(nextM.at)}</b>
                    </span>
                  )}
                </summary>
                <div className="faq-sched">
                  {doc.schedule.milestones.map((m) => {
                    const done = new Date(m.at).getTime() < Date.now();
                    return (
                      <div key={m.key} className={`faq-sched-row${done ? " done" : ""}${m === nextM ? " next" : ""}`}>
                        <span className="faq-sched-k">{m.label[lang]}</span>
                        <span className="faq-sched-v mono">{kst(m.at)} KST</span>
                        {done ? <span className="faq-sched-done">지남</span>
                              : m === nextM ? <span className="faq-sched-mark">다음</span> : null}
                      </div>
                    );
                  })}
                </div>
              </details>
            )}

            {/* 검색 — 봇과 같은 함수를 쓴다. 여기서 후보가 0이면 봇에서도 0이다. */}
            <section className="tools" style={{ marginTop: 14 }}>
              <form className="search" method="get" action="/admin/faq">
                <input type="hidden" name="k" value={k} />
                <input type="hidden" name="lang" value={lang} />
                <input name="q" defaultValue={q}
                       placeholder="문의 원문을 그대로 붙여넣어 보세요 — 봇이 무엇을 고르는지 같이 보여줍니다" />
                <button className="btn primary" type="submit">찾기</button>
                {q && <a className="btn ghost" href={link({ q: "" })}>지우기</a>}
              </form>
            </section>

            {q && (
              <section style={{ marginTop: 14 }}>
                {hits.length ? (
                  <>
                    <h2 className="rep-h" style={{ marginTop: 0 }}>봇이 고를 후보 {hits.length}개</h2>
                    <p className="rep-sub">이 순서 그대로 사용자에게 버튼으로 보여집니다.</p>
                    <div className="faq-list">
                      {hits.map((f, n) => <Card key={f.id} f={f} rank={n + 1} />)}
                    </div>
                  </>
                ) : (
                  <div className="notice">
                    봇이라면 후보를 하나도 만들지 못합니다 — 정본에 이 질문의 답이 없다는 뜻입니다.
                    직접 답하시고, 이 질문은 다음 정본 업데이트 목록에 올려 주세요.
                  </div>
                )}
              </section>
            )}

            {/* 전체 목록 — 접어 두고 질문만 보인다. 스물넷이 한 화면에 들어와야 눈으로 훑을 수 있다. */}
            <h2 className="rep-h">기본 문항 {base.length}</h2>
            <p className="rep-sub">봇이 목록으로 먼저 보여주는 문항입니다. 질문을 누르면 답이 펼쳐집니다.</p>
            <div className="faq-list">
              {base.map((f) => <Card key={f.id} f={f} hit={hitIds.has(f.id)} />)}
            </div>

            <h2 className="rep-h">확장 문항 {extra.length}</h2>
            <p className="rep-sub">전체 보기에서만 나오는 문항입니다 — 구조·정책처럼 한 번 읽으면 되는 것들입니다.</p>
            <div className="faq-list">
              {extra.map((f) => <Card key={f.id} f={f} hit={hitIds.has(f.id)} />)}
            </div>

            <p className="rep-sub" style={{ marginTop: 20 }}>
              이 화면은 판매 사이트의 <code>/api/faq</code> 를 그대로 읽습니다(60초마다 다시 읽음).
              문구를 고치려면 사이트 쪽 정본을 고치고 재배포하세요 — 여기에는 사본이 없습니다.
            </p>
          </>
        )}
      </main>
    </>
  );
}

/* 검색에 걸린 항목은 위쪽 후보 목록에 이미 펼쳐져 있다. 아래 전체 목록에서는
   테두리로 자리만 알려 주고 접어 둔다 — 같은 답을 두 번 펼치면 스크롤만 길어진다. */
function Card({ f, rank, hit }: {
  f: { id: string; q: string; a: string }; rank?: number; hit?: boolean;
}) {
  return (
    <details className={`faq-item${hit ? " hit" : ""}`} open={rank !== undefined}>
      <summary>
        {rank !== undefined && <span className="faq-rank mono">{rank}</span>}
        <span className="faq-q">{f.q}</span>
        <span className="faq-id mono">{f.id}</span>
      </summary>
      <div className="faq-a">
        <p>{f.a}</p>
        <div className="faq-act">
          <Copy text={f.a} label="답변 복사" />
          <Copy text={`${f.q}\n\n${f.a}`} label="질문＋답변 복사" />
        </div>
      </div>
    </details>
  );
}
