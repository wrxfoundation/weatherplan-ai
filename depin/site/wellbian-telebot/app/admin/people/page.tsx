/* 사람 보기 (8/30 서우 — "이상한 사람을 추려내고 열성적인 사람도")

   문의는 건별로 쌓이지만 사람은 건별로 판단할 수 없다. 같은 사람이 한 시간에 다섯 번
   불만을 쏟는 것과 사흘에 걸쳐 다섯 번 묻는 것은 전혀 다른 신호인데, 목록을 시간순으로
   보면 둘이 똑같아 보인다.

   여기 붙는 딱지는 라벨이지 처분이 아니다. 이 화면은 아무도 차단하지 않는다 —
   사람을 규칙으로 거르는 일은 틀릴 수 있고, 틀렸을 때 값이 가장 비싼 종류의 실수다.
   판단은 원문을 눌러 읽고 사람이 한다. */

import { listItems, storeKind } from "@/lib/store";
import { rollupPeople } from "@/lib/cs";

export const dynamic = "force-dynamic";

const KEY = process.env.ADMIN_KEY ?? "";
const C = {
  bg: "#0E0E14", card: "#181822", line: "#2A2A38", ink: "#E8E8F0", mute: "#8A8AA0",
  risk: "#E05A4F", champ: "#4FA96A", warn: "#D9A441",
};

export default async function People({
  searchParams,
}: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const k = sp.k ?? "";
  if (!KEY || k !== KEY) {
    return (
      <main style={{ background: C.bg, color: C.ink, minHeight: "100vh", padding: 48, fontFamily: "system-ui, sans-serif" }}>
        <h1 style={{ fontSize: 18, margin: 0 }}>접근 키가 필요합니다</h1>
      </main>
    );
  }

  const items = await listItems();
  const rows = rollupPeople(items);
  const fFlag = sp.flag ?? "";
  const shown = fFlag ? rows.filter((r) => r.flag === fFlag) : rows;

  const day = (ms: number) => {
    const d = new Date(ms + 9 * 3600000);
    return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  };
  const chip = {
    display: "inline-block", padding: "6px 12px", borderRadius: 999,
    border: `1px solid ${C.line}`, fontSize: 13, textDecoration: "none",
    color: C.ink, marginRight: 8,
  } as const;

  return (
    <main style={{ background: C.bg, color: C.ink, minHeight: "100vh", padding: "32px 28px 80px",
                   fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, margin: 0, fontWeight: 800 }}>사람 보기</h1>
          <span style={{ fontSize: 12.5, color: C.mute }}>
            {rows.length}명 · 저장소 {storeKind() === "kv" ? "KV" : "메모리(임시)"}
          </span>
          <a href={`/admin?k=${k}`} style={{ ...chip, marginLeft: "auto", marginRight: 0 }}>← 문의 목록</a>
        </header>

        <div style={{ marginBottom: 18 }}>
          {([["", "전체", C.ink], ["risk", "주의", C.risk], ["champion", "열성", C.champ]] as const).map(([v, label, color]) => (
            <a key={v || "all"} href={`/admin/people?k=${k}${v ? `&flag=${v}` : ""}`}
               style={{ ...chip, borderColor: fFlag === v ? color : C.line, color: v ? color : C.ink }}>
              {label} <span style={{ color: C.mute }}>
                {v ? rows.filter((r) => r.flag === v).length : rows.length}
              </span>
            </a>
          ))}
        </div>

        <p style={{ fontSize: 12.5, color: C.mute, lineHeight: 1.7, marginBottom: 20, maxWidth: 720 }}>
          <b style={{ color: C.risk }}>주의</b> — 긴급 문의가 2건 이상이거나, 불만이 절반을 넘거나(3건 이상 중),
          한 시간에 5건 넘게 몰아친 사람. <b style={{ color: C.champ }}>열성</b> — 여러 번 물었는데 불만이 없고,
          고마움을 표했거나 꾸준히 참여한 사람. 딱지는 판단의 출발점일 뿐이라 원문을 읽고 정하세요.
        </p>

        {shown.length === 0 && (
          <p style={{ color: C.mute, fontSize: 14 }}>해당하는 사람이 없습니다.</p>
        )}

        {shown.map((r) => (
          <article key={r.who} style={{ background: C.card, border: `1px solid ${C.line}`,
                     borderLeft: `3px solid ${r.flag === "risk" ? C.risk : r.flag === "champion" ? C.champ : C.line}`,
                     borderRadius: 12, padding: "14px 18px", marginBottom: 10,
                     display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <div style={{ minWidth: 180 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{r.who}</div>
              <div style={{ fontSize: 11.5, color: C.mute }}>
                {day(r.first)} ~ {day(r.last)} · {r.langs.join(",")}
              </div>
            </div>

            {r.flag && (
              <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", borderRadius: 5, padding: "3px 8px",
                             background: r.flag === "risk" ? C.risk : C.champ }}>
                {r.flag === "risk" ? "주의" : "열성"}
              </span>
            )}

            <div style={{ display: "flex", gap: 16, fontSize: 12.5, color: C.mute }}>
              <span>문의 <b style={{ color: C.ink, fontSize: 14 }}>{r.n}</b></span>
              <span>긴급 <b style={{ color: r.high ? C.risk : C.ink, fontSize: 14 }}>{r.high}</b></span>
              <span>불만 <b style={{ color: r.neg ? C.warn : C.ink, fontSize: 14 }}>{r.neg}</b></span>
              <span>긍정 <b style={{ color: r.pos ? C.champ : C.ink, fontSize: 14 }}>{r.pos}</b></span>
              {r.burst >= 3 && <span>1시간 최다 <b style={{ color: C.warn, fontSize: 14 }}>{r.burst}</b></span>}
            </div>

            <div style={{ fontSize: 11.5, color: C.mute, flex: 1, minWidth: 120 }}>{r.topics.join(" · ")}</div>

            <a href={`/admin?k=${k}&q=${encodeURIComponent(r.who)}`}
               style={{ ...chip, marginRight: 0, fontSize: 12 }}>문의 보기</a>
          </article>
        ))}
      </div>
    </main>
  );
}
