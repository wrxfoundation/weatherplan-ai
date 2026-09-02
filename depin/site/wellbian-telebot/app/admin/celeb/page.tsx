/* 셀럽 사다리 (9/2 서우 — "셀럽 접근 내용이나 진화 과정도 대시보드에")

   두 가지를 한 화면에 둔다. 우리가 정한 것(층·이유·접점·다음 수)은 lib/celeb.ts 에서 읽고,
   상대가 어디까지 받아줬는지(칸)는 KV 에서 읽어 화면에서 바로 고친다. 금요일 리뷰는 이 화면
   하나로 끝나야 한다 — 파일을 고쳐 재배포하는 리뷰는 두 번째 주부터 안 하게 된다.

   지표는 팔로워가 아니라 "우리에게 답한 A·C 계정 수"다. 맨 위 타일이 그것이다. */

import { isAuthed } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { listRungs, setRung, storeKind, type RungState } from "@/lib/store";
import { CELEBS, TIERS, RUNGS, CELEB_UPDATED, type CelebTier } from "@/lib/celeb";

export const dynamic = "force-dynamic";

const qs = (o: Record<string, string>) => {
  const p = new URLSearchParams(o);
  for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
  return `${p}`;
};
const kst = (ms: number) =>
  new Date(ms).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false });

export default async function CelebPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  if (!(await isAuthed(sp.k))) redirect("/");
  const k = (await isAuthed()) ? "" : (sp.k ?? "");
  const tier = TIERS.some((t) => t.key === sp.tier) ? (sp.tier as CelebTier) : "";
  const link = (o: Record<string, string>) => `/admin/celeb?${qs({ k, tier, ...o })}`;

  async function setRungAction(form: FormData) {
    "use server";
    if (!(await isAuthed(String(form.get("k") ?? "")))) return;
    const handle = String(form.get("handle") ?? "");
    const to = Number(form.get("to"));
    if (!CELEBS.some((c) => c.handle === handle) || !Number.isInteger(to) || to < 0 || to > 6) return;
    await setRung(handle, to);
    revalidatePath("/admin/celeb");
  }

  const rungs = await listRungs();
  const rungOf = (h: string): RungState | undefined => rungs[h];

  /* 지표 — 답한 A·C 계정 수(칸 ≥ 2), 목표 도달, 미확인 */
  const ac = CELEBS.filter((c) => c.tier === "A" || c.tier === "C");
  const answered = ac.filter((c) => (rungOf(c.handle)?.rung ?? -1) >= 2).length;
  const reached = CELEBS.filter((c) => c.goal > 0 && (rungOf(c.handle)?.rung ?? -1) >= c.goal).length;
  const unknown = CELEBS.filter((c) => c.touches.length > 0 && !rungOf(c.handle)).length;

  const order: Record<CelebTier, number> = { A: 0, B: 1, C: 2, KR: 3 };
  const list = CELEBS
    .filter((c) => !tier || c.tier === tier)
    .sort((a, b) => order[a.tier] - order[b.tier] || (rungOf(b.handle)?.rung ?? -1) - (rungOf(a.handle)?.rung ?? -1));
  const count = (t: CelebTier) => CELEBS.filter((c) => c.tier === t).length;

  return (
    <>
      <header className="top">
        <div className="wrap top-in">
          <span className="brand">셀럽 사다리</span>
          <span className="brand-sub">
            로스터 {CELEB_UPDATED} · 칸 저장소 {storeKind() === "kv" ? "KV" : "메모리(임시)"}
          </span>
          <nav className="top-nav">
            <a className={`chip${tier ? "" : " on"}`} href={link({ tier: "" })}>전체 <span className="n">{CELEBS.length}</span></a>
            {TIERS.map((t) => (
              <a key={t.key} className={`chip${tier === t.key ? " on" : ""}`} href={link({ tier: t.key })}>
                {t.label} <span className="n">{count(t.key)}</span>
              </a>
            ))}
            <a className="chip" href={`/admin?${qs({ k })}`}>← CS 인박스</a>
          </nav>
        </div>
      </header>

      <main className="wrap" style={{ paddingBottom: 72 }}>
        {/* 지표 — 팔로워가 아니라 받아줌 */}
        <section className="now">
          <div className="now-card lead">
            <div className="now-k">우리에게 답한 A·C 계정</div>
            <div className="now-v mono">{answered}<span className="now-note" style={{ fontSize: 14 }}> / {ac.length}</span></div>
            <div className="now-note">칸 2(답글 받음) 이상. 이 숫자가 지표다.</div>
          </div>
          <div className="now-card">
            <div className="now-k">이번 주 목표 도달</div>
            <div className="now-v mono">{reached}</div>
            <div className="now-note">계정별 목표 칸에 닿은 수</div>
          </div>
          <div className={`now-card${unknown ? " alert" : ""}`}>
            <div className="now-k">칸 미확인</div>
            <div className="now-v mono">{unknown}</div>
            <div className="now-note">접근은 했는데 반응을 아직 안 적은 계정 — 금요일에 채운다</div>
          </div>
        </section>

        <div className="notice">
          칸: {RUNGS.map((r, i) => <span key={i}><b>{i}</b> {r}{i < RUNGS.length - 1 ? " · " : ""}</span>)}.
          칸을 누르면 바로 저장되고 이력에 남습니다. 로스터(층·이유·접점·다음 수)는 <code>lib/celeb.ts</code> 를 고쳐 재배포합니다.
        </div>

        {TIERS.filter((t) => !tier || t.key === tier).map((t) => (
          <p key={t.key} className="rep-sub" style={{ marginBottom: 6 }}>
            <b>{t.label}</b> — 얻을 것: {t.want} · 방식: {t.how}
          </p>
        ))}

        <div className="faq-list" style={{ marginTop: 10 }}>
          {list.map((c) => {
            const st = rungOf(c.handle);
            const r = st?.rung ?? -1;
            return (
              <details key={c.handle} className="faq-item">
                <summary>
                  <span className={`tier ${c.tier}`}>{c.tier}</span>
                  <span className="faq-q">
                    {c.real ? <a href={`https://x.com/${c.handle}`} target="_blank" rel="noopener noreferrer">@{c.handle}</a> : c.name}
                    {c.real && <span className="celeb-name"> · {c.name}</span>}
                  </span>
                  <span className="rung" title={r >= 0 ? `${r} ${RUNGS[r]}` : "미확인"}>
                    {RUNGS.map((_, i) => (
                      <span key={i} className={`rung-c${i <= r ? " on" : ""}${i === c.goal && c.goal > 0 ? " goal" : ""}`} />
                    ))}
                    <span className="rung-n mono">{r >= 0 ? `${r}` : "?"}<span style={{ color: "var(--dis)" }}>/{c.goal}</span></span>
                  </span>
                </summary>
                <div className="faq-a">
                  <p style={{ marginBottom: 6 }}>{c.why}</p>

                  <div className="celeb-k">우리 접근</div>
                  {c.touches.length ? (
                    <ul className="celeb-hist">
                      {c.touches.map((tc, i) => <li key={i}><b>{tc.date}</b> {tc.what}</li>)}
                    </ul>
                  ) : <p className="rep-empty">아직 접촉 없음</p>}

                  <div className="celeb-k">다음 수</div>
                  <p style={{ marginBottom: 4 }}>{c.next}</p>

                  <div className="celeb-k">상대 반응 — 현재 칸 {r >= 0 ? `${r} ${RUNGS[r]}` : "미확인"} · 목표 {c.goal} {RUNGS[c.goal]}</div>
                  <div className="rung-set">
                    {RUNGS.map((label, i) => (
                      <form key={i} action={setRungAction}>
                        <input type="hidden" name="k" value={k} />
                        <input type="hidden" name="handle" value={c.handle} />
                        <input type="hidden" name="to" value={i} />
                        <button type="submit" className={`rung-btn${i === r ? " on" : ""}`} title={label}>{i} {label}</button>
                      </form>
                    ))}
                  </div>

                  {st && st.hist.length > 0 && (
                    <>
                      <div className="celeb-k">진화 이력</div>
                      <ul className="celeb-hist">
                        {[...st.hist].reverse().map((h, i) => (
                          <li key={i}><span className="mono">{kst(h.at)}</span> → {h.rung} {RUNGS[h.rung]}{h.note ? ` — ${h.note}` : ""}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </details>
            );
          })}
        </div>

        <p className="rep-sub" style={{ marginTop: 20 }}>
          매주 금요일: 이 화면에서 칸을 갱신 → 한 칸 올릴 계정 셋을 고른다. 상한은 하루 B층 1건 · A/C층 1건.
          정본은 <code>depin/intel/celeb-ladder.md</code>, 규칙은 플레이북 「셀럽 활용 복안」.
        </p>
      </main>
    </>
  );
}
