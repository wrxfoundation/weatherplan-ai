/* 분석 리포트 (8/30 서우 — "분석 리포트도 고도화")

   순서가 곧 위계다. 리포트는 숫자를 늘어놓기 쉬운 화면이라, "지금 무엇이 잘못
   돌아가는가 → 어디서 막히는가 → 무엇을 고치면 되는가 → 언제 몰리는가" 로
   읽히게 세웠다. 예쁜 숫자(총 건수 같은 것)는 아래로 내렸다.

   집계는 lib/report.ts 가 맡는다. 여기서는 그리기만 한다 — 계산이 화면에 섞이면
   값이 틀려도 눈으로는 알 수 없다. */

import { listItems, listBeats } from "@/lib/store";
import { isAuthed } from "@/lib/auth";
import { SEV_LABEL, STATUS_LABEL, type CsSeverity } from "@/lib/cs";
import { clusterItems } from "@/lib/cluster";
import {
  inSpan, buckets, timeStats, topicRows, quality, waiting, answerGaps,
  beatHours, beatTopics, moodSpike, SPAN_LABEL, type Span,
} from "@/lib/report";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const qs = (o: Record<string, string>) => {
  const p = new URLSearchParams(o);
  for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
  return `${p}`;
};

/* 0 인 자리는 떼어 낸다 — "22시간 0분 초과" 는 읽는 사람이 한 번 더 셈하게 만든다 */
const mins = (m: number | null) => {
  if (m === null) return "—";
  if (m < 60) return `${m}분`;
  if (m < 1440) { const h = Math.floor(m / 60), r = m % 60; return r ? `${h}시간 ${r}분` : `${h}시간`; }
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60);
  return h ? `${d}일 ${h}시간` : `${d}일`;
};

export default async function Report({
  searchParams,
}: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  if (!(await isAuthed(sp.k))) redirect("/");
  const k = (await isAuthed()) ? "" : (sp.k ?? "");

  const span: Span = sp.span === "24h" || sp.span === "7d" ? sp.span : "all";
  const all = await listItems();
  const rows = inSpan(all, span);

  const t = timeStats(rows);
  const q = quality(rows);
  const topics = topicRows(rows);
  const bars = buckets(rows, span);
  const late = waiting(rows);
  const gaps = clusterItems(answerGaps(rows)).slice(0, 8);

  /* 그룹 분위기 — 개수만 담긴 별도 저장소를 읽는다. 원문은 여기 없다. */
  const beats = await listBeats();
  const moodRows = beatHours(beats, span === "7d" || span === "all" ? 48 : 24);
  const moodTop = beatTopics(beats, span === "7d" || span === "all" ? 48 : 24);
  const spike = moodSpike(moodRows);
  const talkPeak = Math.max(1, ...moodRows.map((r) => r.n));
  const talkTotal = moodRows.reduce((a, r) => a + r.n, 0);

  const peak = Math.max(1, ...bars.map((b) => b.n));
  const adminLink = (o: Record<string, string> = {}) => `/admin?${qs({ k, ...o })}`;
  const spanLink = (s: Span) => `/admin/report?${qs({ k, span: s === "all" ? "" : s })}`;

  /* 준수율은 낮을수록 눈에 띄어야 한다 — 색으로 먼저 말한다 */
  const slaColor = t.slaRate === null ? "var(--dis)"
    : t.slaRate >= 90 ? "var(--ok-text)" : t.slaRate >= 70 ? "var(--attn-icon)" : "var(--warn-icon)";

  return (
    <>
      <header className="top">
        <div className="wrap top-in">
          <span className="brand">분석 리포트</span>
          <span className="brand-sub">{SPAN_LABEL[span]} · {rows.length}건</span>
          <nav className="top-nav">
            {(["24h", "7d", "all"] as const).map((s) => (
              <a key={s} className={`chip${span === s ? " on" : ""}`} href={spanLink(s)}>{SPAN_LABEL[s]}</a>
            ))}
            <a className="chip" href={adminLink()}>← CS 인박스</a>
          </nav>
        </div>
      </header>

      <main className="wrap" style={{ paddingBottom: 72 }}>
        {rows.length === 0 ? (
          <div className="notice" style={{ marginTop: 18 }}>
            이 기간에 들어온 문의가 없습니다. 기간을 넓혀 보세요.
          </div>
        ) : (
          <>
            {/* 1차 — 지금 무엇이 잘못 돌아가는가 */}
            <section className="now">
              <a className={`now-card lead${t.slaRate !== null && t.slaRate < 70 ? " alert" : ""}`}
                 href={adminLink({ kind: "open" })}>
                <div className="now-k">기한 안에 답한 비율</div>
                <div className="now-v mono" style={{ color: slaColor }}>
                  {t.slaRate === null ? "—" : `${t.slaRate}%`}
                </div>
                <div className="now-note">
                  {t.slaRate === null ? "아직 판정할 건이 없습니다" : `지킴 ${t.slaOk} · 넘김 ${t.slaBad}`}
                </div>
              </a>
              <a className="now-card lead" href={adminLink({ kind: "open", status: "new" })}>
                <div className="now-k">기한 넘겨 대기 중</div>
                <div className="now-v mono" style={{ color: late.length ? "var(--attn-icon)" : "var(--dis)" }}>
                  {late.length}
                </div>
                <div className="now-note">
                  {late.length ? `가장 오래 ${mins(late[0].over)} 초과` : "지금은 없습니다"}
                </div>
              </a>
              <a className="now-card" href={adminLink({ sev: "high" })}>
                <div className="now-k">가장 오래 기다린 건</div>
                <div className="now-v mono" style={{ color: t.worstOpen ? "var(--ink-2)" : "var(--dis)" }}>
                  {t.worstOpen ? mins(t.worstOpen) : "—"}
                </div>
                <div className="now-note">아직 닫히지 않은 것 기준</div>
              </a>
            </section>

            {/* 2차 — 어디가 막히는가 */}
            <h2 className="rep-h">주제별로 어디가 막히는가</h2>
            <p className="rep-sub">
              긴급이 많은 순입니다. &quot;결제 문의가 많다&quot; 보다 &quot;결제 문의 중 긴급이 몇 건인가&quot; 가
              손을 어디에 둘지 알려 줍니다. 행을 누르면 그 주제만 걸러 목록으로 갑니다.
            </p>
            <div className="rep-table">
              <div className="rep-tr rep-th">
                <span>주제</span><span>전체</span><span>긴급</span><span>주의</span>
                <span>미처리</span><span>부정</span><span>정본에 답 없음</span>
              </div>
              {topics.map((r) => (
                <a key={r.topic} className="rep-tr" href={adminLink({ topic: r.topic })}>
                  <span className="rep-topic">{r.topic}</span>
                  <span className="mono">{r.n}</span>
                  <span className="mono" style={{ color: r.high ? "var(--warn-icon)" : "var(--dis)" }}>{r.high}</span>
                  <span className="mono" style={{ color: r.mid ? "var(--attn-icon)" : "var(--dis)" }}>{r.mid}</span>
                  <span className="mono" style={{ color: r.open ? "var(--ink-2)" : "var(--dis)" }}>{r.open}</span>
                  <span className="mono" style={{ color: r.neg ? "var(--warn-text)" : "var(--dis)" }}>{r.neg}</span>
                  <span className="mono" style={{ color: r.unanswered ? "var(--ink-2)" : "var(--dis)" }}>{r.unanswered}</span>
                </a>
              ))}
            </div>

            {/* 3차 — 무엇을 고치면 되는가 */}
            <h2 className="rep-h">정본에 채울 질문</h2>
            <p className="rep-sub">
              정본에 답이 없어 사람에게 넘어온 질문입니다. 같은 질문이 여러 번 오면 위로 올라옵니다 —
              이 목록이 곧 다음 정본 업데이트 목록입니다.
            </p>
            {gaps.length ? (
              <ol className="rep-gaps">
                {gaps.map((c, n) => (
                  <li key={c.head.id}>
                    <span className="rep-n mono">{n + 1}</span>
                    <a href={adminLink({ q: c.head.text.slice(0, 12) })} className="rep-gap-t">{c.head.text}</a>
                    {c.members.length > 1 && <span className="rep-cnt">{c.members.length}번</span>}
                    <span className="rep-gap-topic">{c.head.topic}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="rep-empty">정본이 다 받아내고 있습니다 — 사람에게 넘어온 질문이 없습니다.</p>
            )}

            {/* 3.5차 — 그룹은 지금 어떤 분위기인가 */}
            {talkTotal > 0 && (
              <>
                <h2 className="rep-h">그룹은 지금 어떤 분위기인가</h2>
                <p className="rep-sub">
                  봇에게 말을 걸지 않고 그룹에서 그냥 오간 말입니다. 원문은 남기지 않고 개수만 셉니다 —
                  질문과 사고를 알리는 말만 위 목록에 원문으로 올라옵니다.
                </p>

                {spike && (
                  <div className={spike.jumped ? "notice warn" : "notice"} style={{ marginBottom: 12 }}>
                    {spike.jumped
                      ? `부정 어조가 ${spike.base}% → ${spike.now}% 로 뛰었습니다. 그룹을 직접 열어 보세요.`
                      : `부정 어조 ${spike.now}% (앞선 시간 평균 ${spike.base}%) — 평소 범위입니다.`}
                  </div>
                )}

                <div className="rep-bars">
                  {moodRows.map((r) => (
                    <div key={r.at} className="rep-bar"
                         title={`${r.label} · ${r.n}건${r.negRate !== null ? ` · 부정 ${r.negRate}%` : ""}`}>
                      <div className="rep-bar-v">
                        <div className="rep-bar-fill" style={{ height: `${(r.n / talkPeak) * 100}%` }}>
                          {/* 짙은 부분이 부정이다 — 높이가 아니라 색이 먼저 보여야 한다 */}
                          <div className="rep-bar-neg" style={{ height: r.n ? `${(r.neg / r.n) * 100}%` : "0%" }} />
                        </div>
                      </div>
                      <div className="rep-bar-n mono">{r.n || ""}</div>
                      <div className="rep-bar-k">{r.label}</div>
                    </div>
                  ))}
                </div>

                {moodTop.length > 0 && (
                  <div className="rep-table" style={{ marginTop: 10 }}>
                    <div className="rep-tr rep-th" style={{ gridTemplateColumns: "1.4fr 1fr 1fr" }}>
                      <span>무슨 얘기를 하는가</span><span>말수</span><span>그중 부정</span>
                    </div>
                    {moodTop.map((t) => (
                      <div key={t.topic} className="rep-tr" style={{ gridTemplateColumns: "1.4fr 1fr 1fr" }}>
                        <span className="rep-topic">{t.topic}</span>
                        <span className="mono">{t.n}</span>
                        <span className="mono" style={{ color: t.neg ? "var(--warn-text)" : "var(--dis)" }}>{t.neg}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* 4차 — 언제 몰리는가 */}
            <h2 className="rep-h">언제 몰리는가</h2>
            <p className="rep-sub">
              막대 하나가 {span === "24h" ? "한 시간" : "하루"}입니다. 짙은 부분이 아직 닫히지 않은 건입니다 —
              들어온 양보다 이쪽이 쌓이는 구간이 사람을 더 넣어야 하는 때입니다.
            </p>
            <div className="rep-bars">
              {bars.map((b) => (
                <div key={b.from} className="rep-bar" title={`${b.label} · ${b.n}건 (미처리 ${b.open})`}>
                  <div className="rep-bar-v">
                    <div className="rep-bar-fill" style={{ height: `${(b.n / peak) * 100}%` }}>
                      <div className="rep-bar-open" style={{ height: b.n ? `${(b.open / b.n) * 100}%` : "0%" }} />
                    </div>
                  </div>
                  <div className="rep-bar-n mono">{b.n || ""}</div>
                  <div className="rep-bar-k">{b.label}</div>
                </div>
              ))}
            </div>

            {/* 5차 — 속도와 품질 */}
            <h2 className="rep-h">속도와 품질</h2>
            <div className="rep-kpis">
              <div className="rep-kpi">
                <div className="rep-kpi-k">첫 응답까지</div>
                <div className="rep-kpi-v mono">{mins(t.firstReply)}</div>
                <div className="rep-kpi-n">사람이 답장을 보낸 {t.firstReplyN}건의 중앙값</div>
              </div>
              <div className="rep-kpi">
                <div className="rep-kpi-k">닫히기까지</div>
                <div className="rep-kpi-v mono">{mins(t.closed)}</div>
                <div className="rep-kpi-n">닫힌 {t.closedN}건의 중앙값</div>
              </div>
              <div className="rep-kpi">
                <div className="rep-kpi-k">봇이 즉시 해결</div>
                <div className="rep-kpi-v mono">{t.botInstant}</div>
                <div className="rep-kpi-n">사람 손이 닿지 않은 건</div>
              </div>
              <div className="rep-kpi">
                <div className="rep-kpi-k">FAQ 적중률</div>
                <div className="rep-kpi-v mono"
                     style={{ color: q.hitRate === null ? "var(--dis)" : q.hitRate >= 60 ? "var(--ok-text)" : "var(--attn-icon)" }}>
                  {q.hitRate === null ? "—" : `${q.hitRate}%`}
                </div>
                <div className="rep-kpi-n">후보를 보여준 {q.shown}건 중 {q.solved}건 해결</div>
              </div>
              <div className="rep-kpi">
                <div className="rep-kpi-k">부정 어조</div>
                <div className="rep-kpi-v mono"
                     style={{ color: (q.negRate ?? 0) >= 20 ? "var(--warn-icon)" : "var(--ink-2)" }}>
                  {q.negRate === null ? "—" : `${q.negRate}%`}
                </div>
                <div className="rep-kpi-n">긍정 {q.pos} · 부정 {q.neg} · 의문 {q.q}</div>
              </div>
              <div className="rep-kpi">
                <div className="rep-kpi-k">손으로 고친 분류</div>
                <div className="rep-kpi-v mono"
                     style={{ color: (q.fixedRate ?? 0) >= 20 ? "var(--attn-icon)" : "var(--ink-2)" }}>
                  {q.fixedRate === null ? "—" : `${q.fixedRate}%`}
                </div>
                <div className="rep-kpi-n">{q.fixed}건 — 높으면 자동 분류 규칙을 손봐야 합니다</div>
              </div>
            </div>

            {/* 리포트에서 바로 처리로 넘어갈 수 있어야 한다 */}
            {late.length > 0 && (
              <>
                <h2 className="rep-h">기한을 넘긴 채 기다리는 건</h2>
                <div className="rep-late">
                  {late.slice(0, 10).map(({ r, over }) => (
                    <a key={r.id} className="rep-late-row" href={adminLink({ q: r.text.slice(0, 12) })}>
                      <span className={`tag ${(r.sev ?? "low") === "high" ? "high" : `st-${r.status}`}`}>
                        {SEV_LABEL[(r.sev ?? "low") as CsSeverity]}
                      </span>
                      <span className="rep-late-t">{r.text}</span>
                      <span className="rep-late-o mono">{mins(over)} 초과</span>
                      <span className="rep-late-s">{STATUS_LABEL[r.status as keyof typeof STATUS_LABEL] ?? r.status}</span>
                    </a>
                  ))}
                  {late.length > 10 && (
                    <div className="rep-empty">그 밖 {late.length - 10}건 — <a href={adminLink({ kind: "open" })}>목록에서 보기</a></div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </>
  );
}
