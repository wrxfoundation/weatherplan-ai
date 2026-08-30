/* 사람 보기 (8/30 서우 — "이상한 사람 · 열성적인 사람")

   문의는 건별로 쌓이지만 사람은 건별로 판단할 수 없다. 같은 사람이 한 시간에 다섯 번
   불만을 쏟는 것과 사흘에 걸쳐 다섯 번 묻는 것은 전혀 다른 신호인데, 시간순 목록에서는
   둘이 똑같아 보인다.

   여기 붙는 딱지는 라벨이지 처분이 아니다. 이 화면은 아무도 차단하지 않는다 —
   사람을 규칙으로 거르는 일은 틀릴 수 있고, 틀렸을 때 값이 가장 비싼 종류의 실수다.
   그래서 판정보다 근거 숫자를 크게 두고, 원문으로 바로 넘어갈 길을 옆에 뒀다. */

import { listItems, storeKind } from "@/lib/store";
import { rollupPeople } from "@/lib/cs";

export const dynamic = "force-dynamic";
const KEY = process.env.ADMIN_KEY ?? "";

export default async function People({
  searchParams,
}: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const k = sp.k ?? "";
  if (!KEY || k !== KEY) {
    return (
      <main className="wrap" style={{ paddingTop: 56 }}>
        <h1 style={{ fontSize: 19, fontWeight: 800 }}>접근 키가 필요합니다</h1>
      </main>
    );
  }

  const rows = rollupPeople(await listItems());
  const fFlag = sp.flag ?? "";
  const shown = fFlag ? rows.filter((r) => r.flag === fFlag) : rows;
  const day = (ms: number) => {
    const d = new Date(ms + 9 * 3600000);
    return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  };
  const nOf = (v: string) => (v ? rows.filter((r) => r.flag === v).length : rows.length);

  return (
    <>
      <header className="top">
        <div className="wrap top-in">
          <span className="brand">사람 보기</span>
          <span className="brand-sub">
            {rows.length}명 · 저장소 {storeKind() === "kv" ? "KV" : "메모리(임시)"}
          </span>
          <nav className="top-nav">
            <a className="chip" href={`/admin?k=${k}`}>← 문의 목록</a>
          </nav>
        </div>
      </header>

      <main className="wrap" style={{ paddingBottom: 72 }}>
        {/* 1차 — 손이 필요한 쪽부터 */}
        <section className="now">
          <a className={`now-card lead${nOf("risk") ? " alert" : ""}`} href={`/admin/people?k=${k}&flag=risk`}>
            <div className="now-k">주의</div>
            <div className="now-v mono" style={{ color: nOf("risk") ? "var(--warn-icon)" : "var(--dis)" }}>
              {nOf("risk")}
            </div>
            <div className="now-note">긴급이 겹치거나 불만이 몰린 사람</div>
          </a>
          <a className="now-card lead" href={`/admin/people?k=${k}&flag=champion`}>
            <div className="now-k">열성</div>
            <div className="now-v mono" style={{ color: nOf("champion") ? "var(--ok-text)" : "var(--dis)" }}>
              {nOf("champion")}
            </div>
            <div className="now-note">여러 번 묻되 불만이 없는 사람</div>
          </a>
          <a className="now-card" href={`/admin/people?k=${k}`}>
            <div className="now-k">전체</div>
            <div className="now-v mono" style={{ color: "var(--ink-2)" }}>{rows.length}</div>
            <div className="now-note">문의를 남긴 사람</div>
          </a>
        </section>

        <section className="sub">
          <span className="sub-note" style={{ marginLeft: 0, maxWidth: "none", lineHeight: 1.7 }}>
            <b style={{ color: "var(--warn-text)" }}>주의</b> — 긴급 2건 이상, 또는 3건 이상 중 불만이
            절반을 넘거나, 한 시간에 5건 넘게 몰아친 사람. <b style={{ color: "var(--ok-text)" }}>열성</b> —
            여러 번 물었는데 불만이 없고 고마움을 표했거나 꾸준히 참여한 사람.
            <b> 딱지는 판단의 출발점일 뿐입니다 — 원문을 읽고 정하세요.</b>
          </span>
        </section>

        {shown.length === 0 ? (
          <p className="empty">해당하는 사람이 없습니다.</p>
        ) : shown.map((r) => (
          <article key={r.who}
                   className={`item${r.flag === "risk" ? " sev-high" : r.flag === "champion" ? " done" : ""}`}
                   style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <div style={{ minWidth: 170 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{r.who}</div>
              <div style={{ fontSize: 11.5, color: "var(--hint)", marginTop: 2 }}>
                {day(r.first)} ~ {day(r.last)} · {r.langs.join(",")}
              </div>
            </div>

            {r.flag && (
              <span className={`tag ${r.flag === "risk" ? "high" : "st-done"}`}>
                {r.flag === "risk" ? "주의" : "열성"}
              </span>
            )}

            <div style={{ display: "flex", gap: 18, fontSize: 11.5, color: "var(--cap)" }}>
              <span>문의 <b className="mono" style={{ fontSize: 15, color: "var(--ink-1)" }}>{r.n}</b></span>
              <span>긴급 <b className="mono" style={{ fontSize: 15, color: r.high ? "var(--warn-icon)" : "var(--dis)" }}>{r.high}</b></span>
              <span>불만 <b className="mono" style={{ fontSize: 15, color: r.neg ? "var(--attn-icon)" : "var(--dis)" }}>{r.neg}</b></span>
              <span>긍정 <b className="mono" style={{ fontSize: 15, color: r.pos ? "var(--ok-text)" : "var(--dis)" }}>{r.pos}</b></span>
              {r.burst >= 3 && (
                <span>1시간 최다 <b className="mono" style={{ fontSize: 15, color: "var(--attn-icon)" }}>{r.burst}</b></span>
              )}
            </div>

            <div style={{ fontSize: 11.5, color: "var(--hint)", flex: 1, minWidth: 110 }}>
              {r.topics.join(" · ")}
            </div>

            <a className="btn" href={`/admin?k=${k}&q=${encodeURIComponent(r.who)}`}>문의 보기</a>
          </article>
        ))}
      </main>
    </>
  );
}
