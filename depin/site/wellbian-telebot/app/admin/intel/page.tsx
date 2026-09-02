/* 생태계 동향 (9/2 서우 — "rlusd, xrp, ripplelabs, xrpl 동향을 대시보드에")

   정본 보기와 같은 자리에 두는 화면이다 — 응대하다가 "RLUSD가 뭐예요", "XRPL 업데이트
   있어요?" 를 받으면 여기서 같은 사실을 같은 말로 꺼낸다.

   두 가지를 지킨다. 시세·시총·가격 전망은 싣지 않는다(담당자 눈앞에 가격이 있으면 고객에게
   새어 나간다). 자동 피드가 아니라 정본에서 등급을 붙여 옮긴 것만 싣는다(자동 피드는 하이프와
   미검증을 그대로 끌어온다). 그래서 이 화면은 lib/intel.ts 를 읽을 뿐이고, 갱신은 그 파일을
   고쳐 재배포하는 것이다. */

import { isAuthed } from "@/lib/auth";
import { redirect } from "next/navigation";
import { INTEL, INTEL_UPDATED, TOPICS, GRADE_HELP, CS_RULES, type IntelTopic, type IntelGrade } from "@/lib/intel";
import Copy from "../faq/Copy";

export const dynamic = "force-dynamic";

const qs = (o: Record<string, string>) => {
  const p = new URLSearchParams(o);
  for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
  return `${p}`;
};

const GRADE_CLS: Record<IntelGrade, string> = { 공식: "official", 검증: "verified", 미검증: "unverified" };

export default async function IntelPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  if (!(await isAuthed(sp.k))) redirect("/");
  const k = (await isAuthed()) ? "" : (sp.k ?? "");

  const topic = TOPICS.some((t) => t.key === sp.topic) ? (sp.topic as IntelTopic) : "";
  const link = (o: Record<string, string>) => `/admin/intel?${qs({ k, topic, ...o })}`;

  /* 최신이 위. 날짜만 있는 달 단위 항목은 그 달의 끝으로 밀리지 않게 문자열 그대로 비교한다. */
  const list = [...INTEL]
    .filter((i) => !topic || i.topic === topic)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const count = (t: IntelTopic) => INTEL.filter((i) => i.topic === t).length;

  return (
    <>
      <header className="top">
        <div className="wrap top-in">
          <span className="brand">생태계 동향</span>
          <span className="brand-sub">RLUSD · XRPL · XRP · Ripple · 한국 · 갱신 {INTEL_UPDATED}</span>
          <nav className="top-nav">
            <a className={`chip${topic ? "" : " on"}`} href={link({ topic: "" })}>전체 <span className="n">{INTEL.length}</span></a>
            {TOPICS.map((t) => (
              <a key={t.key} className={`chip${topic === t.key ? " on" : ""}`} href={link({ topic: t.key })}>
                {t.label} <span className="n">{count(t.key)}</span>
              </a>
            ))}
            <a className="chip" href={`/admin?${qs({ k })}`}>← CS 인박스</a>
          </nav>
        </div>
      </header>

      <main className="wrap" style={{ paddingBottom: 72 }}>
        {/* 응대 기준 — 동향보다 먼저. 동향을 읽고 이걸 잊으면 안 된다. */}
        <section className="rules">
          <h2 className="rules-h">응대 기준</h2>
          <ul>
            {CS_RULES.map((r) => (
              <li key={r.k}><b>{r.k}</b> — {r.v}</li>
            ))}
          </ul>
        </section>

        <div className="notice">
          이 화면에는 시세·시총·가격 전망을 싣지 않습니다. 자동 수집도 아닙니다 — 정본에서 검증 등급을 붙여
          옮긴 것만 있습니다. 등급: <b>공식</b> {GRADE_HELP.공식} <b>검증</b> {GRADE_HELP.검증} <b>미검증</b> {GRADE_HELP.미검증}
        </div>

        <h2 className="rep-h" style={{ marginTop: 6 }}>{topic ? `${topic} ${list.length}건` : `최근 ${list.length}건`}</h2>
        <p className="rep-sub">제목을 누르면 우리에게 무슨 뜻인지와 출처가 펼쳐집니다. 고객용 문장이 있는 항목은 복사 단추가 있습니다.</p>

        <div className="faq-list">
          {list.map((i) => (
            <details key={`${i.date}-${i.title}`} className="faq-item">
              <summary>
                <span className="intel-date mono">{i.date}</span>
                <span className="intel-topic">{i.topic}</span>
                <span className={`grade ${GRADE_CLS[i.grade]}`}>{i.grade}</span>
                <span className="faq-q">{i.title}</span>
              </summary>
              <div className="faq-a">
                <p>{i.note}</p>
                <div className="intel-src">
                  출처 — {i.url ? <a href={i.url} target="_blank" rel="noopener noreferrer">{i.source} ↗</a> : i.source}
                </div>
                {i.say && (
                  <div className="intel-say">
                    <span className="intel-say-k">고객에게 이렇게</span>
                    {i.say}
                    <div className="faq-act" style={{ marginTop: 8 }}>
                      <Copy text={i.say} label="고객용 문장 복사" />
                    </div>
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>

        <p className="rep-sub" style={{ marginTop: 20 }}>
          이 목록은 <code>lib/intel.ts</code> 를 읽습니다. 정본(<code>depin/intel/ecosystem-log.md</code>)을 고칠 때
          같이 옮기고 재배포하세요 — 여기에는 자동 갱신이 없습니다.
        </p>
      </main>
    </>
  );
}
