/* CS 대시보드 (8/30 서우 — "텔레그램 현황 대시보드 · cs 분류 및 처리")

   봇이 답하지 못한 질문이 여기 쌓인다. 텔레그램 운영 채널의 카드와 같은 데이터를 보지만,
   채널은 하나씩 흘러가는 피드이고 이 화면은 전체를 한 번에 본다 — 어느 주제가 몰리는지,
   무엇이 아직 처리되지 않았는지는 목록을 세로로 늘어놓아야 보인다.

   접근은 ADMIN_KEY 하나로 막는다. 로그인 화면을 붙이면 계정·세션·복구가 따라오는데,
   판매 전 여드레에 그만한 표면을 늘릴 이유가 없다. 주소를 아는 사람만 들어온다. */

import { listItems, patchItem, storeKind, type CsStatus } from "@/lib/store";
import { MOOD_LABEL, STATUS_LABEL, SEV_LABEL, type CsMoodTag, type CsSeverity } from "@/lib/cs";
import { applyFilters } from "@/lib/filter";

export const dynamic = "force-dynamic";

const KEY = process.env.ADMIN_KEY ?? "";

const C = {
  bg: "#0E0E14", card: "#181822", line: "#2A2A38", ink: "#E8E8F0", mute: "#8A8AA0",
  new: "#5B8DEF", doing: "#D9A441", done: "#4FA96A", faq: "#9B6BD6", neg: "#D9534F",
  high: "#E05A4F", mid: "#D9A441", low: "#6A6A80",
};
const STATUS_COLOR: Record<string, string> = { new: C.new, doing: C.doing, done: C.done, faq: C.faq };

export default async function Admin({
  searchParams,
}: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const k = sp.k ?? "";

  if (!KEY || k !== KEY) {
    return (
      <main style={{ background: C.bg, color: C.ink, minHeight: "100vh", padding: 48, fontFamily: "system-ui, sans-serif" }}>
        <h1 style={{ fontSize: 18, margin: 0 }}>접근 키가 필요합니다</h1>
        <p style={{ color: C.mute, fontSize: 14 }}>
          {KEY ? "주소 끝에 ?k=… 를 붙여 주세요." : "ADMIN_KEY 환경변수가 설정되지 않았습니다."}
        </p>
      </main>
    );
  }

  const all = await listItems();
  const fStatus = sp.status ?? "";
  const fTopic = sp.topic ?? "";
  const fKind = sp.kind ?? "";
  const fSev = sp.sev ?? "";
  const q = sp.q ?? "";
  const items = applyFilters(all, { status: fStatus, topic: fTopic, kind: fKind, sev: fSev, q });

  const count = (f: (i: typeof all[number]) => boolean) => all.filter(f).length;
  const topics = [...new Set(all.map((i) => i.topic))].sort();

  /* FAQ 적중률 — 후보를 보여준 것 중 사용자가 실제로 하나를 눌러 갈음된 비율.
     "후보를 보여줬다"와 "답이 됐다"는 다르고, 이 숫자가 그 차이를 드러낸다.
     낮으면 정본이 얇거나 매칭이 틀린 것이다 — 어느 쪽인지는 목록을 보면 안다. */
  const shown = count((i) => i.kind === "matched");
  const solved = count((i) => i.kind === "matched" && i.status === "done");
  const hitRate = shown ? Math.round((solved / shown) * 100) : null;
  const openCount = count((i) => i.kind !== "matched" && i.status !== "done" && i.status !== "faq");

  /* 상태 변경 — 같은 데이터를 텔레그램 카드 버튼도 바꾼다. 두 곳에서 같은 함수를 부른다 */
  async function setStatus(form: FormData) {
    "use server";
    if ((form.get("k") as string) !== KEY) return;
    await patchItem(form.get("id") as string, { status: form.get("to") as CsStatus });
  }

  const S = {
    chip: { display: "inline-block", padding: "6px 12px", borderRadius: 999, border: `1px solid ${C.line}`,
            fontSize: 13, textDecoration: "none", color: C.ink, marginRight: 8, marginBottom: 8 } as const,
    btn: { background: "transparent", border: `1px solid ${C.line}`, color: C.mute, borderRadius: 8,
           padding: "6px 10px", fontSize: 12.5, cursor: "pointer", marginRight: 6 } as const,
  };

  const link = (o: Record<string, string>) => {
    const p = new URLSearchParams({ k, ...(fStatus && { status: fStatus }),
      ...(fTopic && { topic: fTopic }), ...(fKind && { kind: fKind }),
      ...(fSev && { sev: fSev }), ...(q && { q }), ...o });
    for (const [key, v] of [...p.entries()]) if (!v) p.delete(key);
    return `/admin?${p}`;
  };

  return (
    <main style={{ background: C.bg, color: C.ink, minHeight: "100vh", padding: "32px 28px 80px",
                   fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>

        <header style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, margin: 0, fontWeight: 800 }}>CS 인박스</h1>
          <span style={{ fontSize: 12.5, color: C.mute }}>
            @wellbiantalk · 저장소 {storeKind() === "kv" ? "KV" : "메모리(임시)"}
          </span>
          <nav style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <a href={`/admin/people?k=${k}`} style={{ ...S.chip, marginBottom: 0 }}>사람 보기 →</a>
            <a href={link({}).replace("/admin?", "/api/admin/export?")}
               style={{ ...S.chip, marginBottom: 0, marginRight: 0 }}>CSV</a>
            <a href={link({}).replace("/admin?", "/api/admin/export?") + "&format=json"}
               style={{ ...S.chip, marginBottom: 0, marginRight: 0, color: C.mute }}>JSON</a>
          </nav>
        </header>

        {/* 검색 — 원문·메모·사용자를 함께 훑는다 */}
        <form method="get" action="/admin" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input type="hidden" name="k" value={k} />
          {fStatus && <input type="hidden" name="status" value={fStatus} />}
          {fTopic && <input type="hidden" name="topic" value={fTopic} />}
          {fKind && <input type="hidden" name="kind" value={fKind} />}
          {fSev && <input type="hidden" name="sev" value={fSev} />}
          <input name="q" defaultValue={q} placeholder="원문 · 메모 · 사용자 검색"
                 style={{ flex: 1, background: C.card, border: `1px solid ${C.line}`, color: C.ink,
                          borderRadius: 10, padding: "10px 14px", fontSize: 14 }} />
          <button type="submit" style={{ ...S.btn, padding: "10px 18px", color: C.ink }}>검색</button>
          {q && <a href={link({ q: "" })} style={{ ...S.chip, marginBottom: 0, alignSelf: "center" }}>지우기</a>}
        </form>

        {storeKind() === "memory" && (
          <div style={{ background: "#3A2A18", border: `1px solid ${C.doing}`, borderRadius: 10,
                        padding: "12px 14px", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
            KV 가 연결되지 않았습니다. 지금 기록은 서버가 살아 있는 동안만 남고, 배포·재시작이나
            다른 인스턴스로 넘어가면 사라집니다. Vercel 프로젝트 → Storage 에서 KV 를 만들어
            이 프로젝트에 연결하면 환경변수가 자동으로 붙고 그때부터 영구히 쌓입니다.
          </div>
        )}

        {/* 한 줄 요약 — 지금 손이 필요한 건 몇 건이고, FAQ 가 얼마나 맞고 있는가 */}
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 18,
                      padding: "14px 18px", background: C.card, border: `1px solid ${C.line}`, borderRadius: 12 }}>
          <div>
            <div style={{ fontSize: 11.5, color: C.mute }}>들어온 문의</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{all.length}</div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: C.mute }}>처리 필요</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: openCount ? C.new : C.mute }}>{openCount}</div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: C.mute }}>긴급</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: count((i) => i.sev === "high" && i.status === "new") ? C.high : C.mute }}>
              {count((i) => i.sev === "high" && i.status === "new")}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: C.mute }}>FAQ 적중률</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: hitRate === null ? C.mute : hitRate >= 60 ? C.done : C.doing }}>
              {hitRate === null ? "—" : `${hitRate}%`}
              <span style={{ fontSize: 12, fontWeight: 500, color: C.mute }}> ({solved}/{shown})</span>
            </div>
          </div>
          <div style={{ marginLeft: "auto", alignSelf: "center", fontSize: 12, color: C.mute, maxWidth: 300, lineHeight: 1.5 }}>
            적중률은 후보를 보여준 질문 중 사용자가 실제로 하나를 눌러 해결된 비율입니다.
          </div>
        </div>

        {/* 종류 — 미해결만 볼지, 후보를 보여준 것까지 볼지 */}
        <div style={{ marginBottom: 14 }}>
          {([["", "전체"], ["open", "답변 없음"], ["matched", "후보 제시"]] as const).map(([v, label]) => (
            <a key={v || "all"} href={link({ kind: v })}
               style={{ ...S.chip, borderColor: fKind === v ? C.ink : C.line }}>
              {label} <span style={{ color: C.mute }}>
                {v === "" ? all.length : v === "open" ? count((i) => i.kind !== "matched") : shown}
              </span>
            </a>
          ))}
        </div>

        {/* 긴급도 — 돈·사칭·법적 언급이나 공개된 불만이 높음으로 올라온다 */}
        <div style={{ marginBottom: 14 }}>
          {([["", "긴급도 전체", C.mute], ["high", "긴급", C.high], ["mid", "주의", C.mid], ["low", "일반", C.low]] as const)
            .map(([v, label, color]) => (
            <a key={v || "all"} href={link({ sev: v })}
               style={{ ...S.chip, borderColor: fSev === v ? color : C.line, color: v ? color : C.ink }}>
              {label} <span style={{ color: C.mute }}>
                {v ? count((i) => (i.sev ?? "low") === v) : all.length}
              </span>
            </a>
          ))}
        </div>

        {/* 상태별 — 클릭하면 그 상태만 본다 */}
        <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
          {([["", "전체", C.mute], ["new", STATUS_LABEL.new, C.new], ["doing", STATUS_LABEL.doing, C.doing],
             ["done", STATUS_LABEL.done, C.done], ["faq", STATUS_LABEL.faq, C.faq]] as const).map(([s, label, color]) => (
            <a key={s || "all"} href={link({ status: s })}
               style={{ background: C.card, border: `1px solid ${fStatus === s ? color : C.line}`,
                        borderRadius: 12, padding: "12px 16px", minWidth: 92, textDecoration: "none", color: C.ink }}>
              <div style={{ fontSize: 12, color: C.mute }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>
                {s ? count((i) => i.status === s) : all.length}
              </div>
            </a>
          ))}
        </div>

        {/* 주제별 */}
        {topics.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <a href={link({ topic: "" })} style={{ ...S.chip, borderColor: fTopic ? C.line : C.ink }}>주제 전체</a>
            {topics.map((t) => (
              <a key={t} href={link({ topic: t })}
                 style={{ ...S.chip, borderColor: fTopic === t ? C.ink : C.line }}>
                {t} <span style={{ color: C.mute }}>{count((i) => i.topic === t)}</span>
              </a>
            ))}
          </div>
        )}

        {items.length === 0 && (
          <p style={{ color: C.mute, fontSize: 14 }}>
            {all.length === 0
              ? "아직 기록이 없습니다. 봇이 답하지 못한 질문이 여기 쌓입니다."
              : "이 조건에 해당하는 항목이 없습니다."}
          </p>
        )}

        {items.map((i) => {
          const t = new Date(i.at + 9 * 3600000);
          const when = `${t.getUTCMonth() + 1}/${t.getUTCDate()} ${String(t.getUTCHours()).padStart(2, "0")}:${String(t.getUTCMinutes()).padStart(2, "0")}`;
          return (
            <article key={i.id} style={{ background: C.card, border: `1px solid ${C.line}`,
                                         borderLeft: `3px solid ${i.sev === "high" ? C.high : STATUS_COLOR[i.status] ?? C.line}`,
                                         borderRadius: 12, padding: "16px 18px", marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
                {i.sev === "high" && (
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", background: C.high,
                                 borderRadius: 5, padding: "2px 7px" }}>
                    {SEV_LABEL.high}
                  </span>
                )}
                <span style={{ fontSize: 11.5, fontWeight: 700, color: STATUS_COLOR[i.status] ?? C.mute }}>
                  {STATUS_LABEL[i.status as keyof typeof STATUS_LABEL] ?? i.status}
                </span>
                <span style={{ fontSize: 11.5, color: C.mute }}>· {i.topic}</span>
                <span style={{ fontSize: 11.5, color: i.mood === "negative" ? C.neg : C.mute }}>
                  · {MOOD_LABEL[i.mood as CsMoodTag] ?? i.mood}
                </span>
                <span style={{ fontSize: 11.5, color: C.mute }}>· {i.lang}</span>
                <span style={{ fontSize: 11.5, color: C.mute }}>
                  · {i.chatType === "private" ? "1:1" : "그룹"}
                </span>
                {i.kind === "offline" && (
                  <span style={{ fontSize: 11.5, color: C.doing }}>· 정본 미로딩 중 수신</span>
                )}
                {i.kind === "matched" && (
                  <span style={{ fontSize: 11.5, color: C.mute }}>· 후보 제시</span>
                )}
                <span style={{ marginLeft: "auto", fontSize: 11.5, color: C.mute }}>{when} · {i.who}</span>
              </div>

              <p style={{ fontSize: 16, lineHeight: 1.6, margin: "0 0 12px" }}>{i.text}</p>

              <form action={setStatus} style={{ display: "flex", flexWrap: "wrap" }}>
                <input type="hidden" name="k" value={k} />
                <input type="hidden" name="id" value={i.id} />
                {(["new", "doing", "done", "faq"] as const).filter((s) => s !== i.status).map((s) => (
                  <button key={s} type="submit" name="to" value={s}
                          style={{ ...S.btn, color: STATUS_COLOR[s] }}>
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </form>
            </article>
          );
        })}
      </div>
    </main>
  );
}
