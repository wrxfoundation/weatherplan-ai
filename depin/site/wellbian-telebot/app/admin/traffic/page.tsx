/* GA4 유입 (9/8 서우 — "GA 분석 대시보드도 같이 연동 못 붙이나")

   GA 화면은 소스/매체를 보려면 차원을 바꿔야 하고, 우리 UTM(owned·kol)은 기본 채널 그룹에서
   전부 Unassigned 로 뭉개진다. 여기서는 처음부터 소스/매체·utm_content 로 편다 — 운영자가
   매번 GA 에서 차원을 바꾸는 손을 없앤다.

   읽기만 한다. 집계·캐시는 lib/ga.ts 가 맡고, 이 파일은 그리기만 한다(리포트 화면과 같은 원칙).

   순서가 위계다 — ① 지금(실시간·기간 합계) ② 어디서 왔는가(소스/매체) ③ 어느 링크인가(utm_content)
   ④ 일별 추이 ⑤ 캠페인·페이지. KOL 정산과 채널 판단에 쓰는 것은 ②③ 이라 앞에 둔다. */

import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import Nav from "../Nav";
import { gaSnapshot, gaConfigured, gaMissing, GA_SPAN_LABEL, gaDay, type GaSpan, type GaRow } from "@/lib/ga";

export const dynamic = "force-dynamic";

const qs = (o: Record<string, string>) => {
  const p = new URLSearchParams(o);
  for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
  return `${p}`;
};
const n = (v: string | undefined) => Number(v ?? 0) || 0;
const fmt = (x: number) => x.toLocaleString("ko-KR");

/* rep-tr 은 7열 고정(리포트용)이라 열 수가 다른 표는 폭을 직접 준다 */
const grid = (cols: string) => ({ gridTemplateColumns: cols } as const);

const Table = ({ head, rows, cols, cells }: {
  head: string[]; rows: GaRow[]; cols: string; cells: (r: GaRow) => (string | number)[];
}) => (
  <div className="rep-table">
    <div className="rep-tr rep-th" style={grid(cols)}>
      {head.map((h) => <span key={h}>{h}</span>)}
    </div>
    {rows.length === 0 && <div className="rep-tr" style={grid(cols)}><span style={{ color: "var(--dis)" }}>이 기간에는 없습니다</span></div>}
    {rows.map((r, i) => {
      const c = cells(r);
      return (
        <div key={i} className="rep-tr" style={grid(cols)}>
          {c.map((v, j) => (
            <span key={j} className={j === 0 ? "rep-topic" : "mono"} style={j === 0 ? undefined : { color: n(String(v)) ? "var(--ink-2)" : "var(--dis)" }}>
              {typeof v === "number" ? fmt(v) : v}
            </span>
          ))}
        </div>
      );
    })}
  </div>
);

export default async function Traffic({
  searchParams,
}: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  if (!(await isAuthed(sp.k))) redirect("/");
  const k = (await isAuthed()) ? "" : (sp.k ?? "");

  const span: GaSpan = sp.span === "today" || sp.span === "7d" ? sp.span : "launch";
  const spanLink = (s: GaSpan) => `/admin/traffic?${qs({ k, span: s === "launch" ? "" : s })}`;

  const snap = await gaSnapshot(span);
  const peak = Math.max(1, ...snap.byDay.map((r) => n(r.sessions)));
  const ago = Math.max(0, Math.round((Date.now() - snap.fetchedAt) / 60000));
  const engRate = snap.total.sessions ? Math.round((snap.total.engaged / snap.total.sessions) * 100) : null;

  return (
    <>
      <Nav k={k} current="traffic" title="유입" sub={<>{GA_SPAN_LABEL[span]}{span === "launch" ? ` (${snap.since}~)` : ""} · GA4</>}>
        <span className="flab">기간</span>
        {(["today", "7d", "launch"] as const).map((s) => (
          <a key={s} className={`chip${span === s ? " on" : ""}`} href={spanLink(s)}>{GA_SPAN_LABEL[s]}</a>
        ))}
      </Nav>

      <main className="wrap" style={{ paddingBottom: 72 }}>
        {!gaConfigured() ? (
          <div className="notice" style={{ marginTop: 18, lineHeight: 1.7 }}>
            <b>GA4 가 아직 연결되지 않았습니다</b>{gaMissing() ? <> — 비어 있는 변수: <span className="mono">{gaMissing()}</span></> : null}
            <ol style={{ margin: "10px 0 0 18px", padding: 0 }}>
              <li>Google Cloud 콘솔 → 프로젝트 하나 → API 라이브러리에서 <b>Google Analytics Data API</b> 사용 설정</li>
              <li>IAM → <b>서비스 계정</b> 만들기 → 키 탭에서 JSON 키 발급</li>
              <li>GA4 → 관리 → <b>속성 액세스 관리</b> → 서비스 계정 이메일을 <b>뷰어</b>로 추가</li>
              <li>Vercel 환경변수에 <span className="mono">GA_PROPERTY_ID</span>(속성 ID 숫자) · <span className="mono">GA_SA_EMAIL</span> · <span className="mono">GA_SA_PRIVATE_KEY</span>(JSON 의 private_key) → <b>Redeploy</b></li>
            </ol>
          </div>
        ) : snap.error ? (
          <div className="notice" style={{ marginTop: 18 }}>
            GA4 를 읽지 못했습니다 — <span className="mono">{snap.error}</span>
          </div>
        ) : (
          <>
            {/* 1차 — 지금 */}
            <section className="now">
              <div className="now-card lead">
                <div className="now-k">지난 30분 활성 사용자</div>
                <div className="now-v mono" style={{ color: snap.realtime ? "var(--ok-text)" : "var(--dis)" }}>{fmt(snap.realtime)}</div>
                <div className="now-note">실시간 · 기간과 무관</div>
              </div>
              <div className="now-card lead">
                <div className="now-k">세션</div>
                <div className="now-v mono" style={{ color: "var(--ink-2)" }}>{fmt(snap.total.sessions)}</div>
                <div className="now-note">{engRate === null ? "—" : `참여 세션 ${fmt(snap.total.engaged)} · ${engRate}%`}</div>
              </div>
              <div className="now-card">
                <div className="now-k">활성 사용자</div>
                <div className="now-v mono" style={{ color: "var(--ink-2)" }}>{fmt(snap.total.users)}</div>
                <div className="now-note">신규 {fmt(snap.total.newUsers)}</div>
              </div>
            </section>

            {/* 2차 — 어디서 왔는가 */}
            <h2 className="rep-h">어디서 왔는가 — 소스 / 매체</h2>
            <p className="rep-sub">
              우리 UTM 그대로 보입니다 — <span className="mono">x · telegram · linktree</span> 는 <span className="mono">owned</span>,
              KOL 은 <span className="mono">kol</span>. <span className="mono">(direct)</span> 은 리퍼러가 안 넘어온 유입(앱 안 브라우저)이라 정상입니다.
            </p>
            <Table head={["소스 / 매체", "세션", "사용자", "참여 세션"]} rows={snap.bySource} cols="1.8fr 1fr 1fr 1fr"
              cells={(r) => [`${r.sessionSource} / ${r.sessionMedium}`, n(r.sessions), n(r.activeUsers), n(r.engagedSessions)]} />

            {/* 3차 — 어느 링크인가 */}
            <h2 className="rep-h">어느 링크인가 — utm_content</h2>
            <p className="rep-sub">
              같은 소스 안의 링크를 가릅니다(판매 타래·기사·영상·KOL 매체별). <span className="mono">(not set)</span> 은 utm_content 없이 온 것입니다.
            </p>
            <Table head={["소스 · 콘텐츠", "세션", "사용자"]} rows={snap.byContent} cols="2.4fr 1fr 1fr"
              cells={(r) => [`${r.sessionSource} · ${r.sessionManualAdContent}`, n(r.sessions), n(r.activeUsers)]} />

            {/* 4차 — 일별 */}
            <h2 className="rep-h">일별 세션</h2>
            <p className="rep-sub">태그를 붙인 날부터입니다. 그 전이 0 인 것은 유입이 없어서가 아니라 측정이 없어서입니다.</p>
            {snap.byDay.length === 0 ? (
              <div className="notice">이 기간에는 없습니다</div>
            ) : (
              <div className="rep-bars">
                {snap.byDay.map((r) => (
                  <div key={r.date} className="rep-bar" title={`${gaDay(r.date)} · 세션 ${r.sessions} · 사용자 ${r.activeUsers}`}>
                    <div className="rep-bar-v">
                      <div className="rep-bar-fill" style={{ height: `${Math.round((n(r.sessions) / peak) * 100)}%` }} />
                    </div>
                    <span className="rep-bar-k">{gaDay(r.date)}</span>
                    <span className="rep-bar-n mono">{n(r.sessions)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 5차 — 캠페인 · 페이지 */}
            <h2 className="rep-h">캠페인</h2>
            <Table head={["캠페인", "세션", "사용자"]} rows={snap.byCampaign} cols="2.4fr 1fr 1fr"
              cells={(r) => [r.sessionCampaignName, n(r.sessions), n(r.activeUsers)]} />

            <h2 className="rep-h">많이 본 페이지</h2>
            <Table head={["경로", "조회", "사용자"]} rows={snap.byPage} cols="2.4fr 1fr 1fr"
              cells={(r) => [r.pagePath, n(r.screenPageViews), n(r.activeUsers)]} />

            <p className="rep-sub" style={{ marginTop: 18 }}>
              {ago === 0 ? "방금" : `${ago}분 전에`} 읽음 · 5분마다 새로 읽습니다 · 표준 보고서는 GA4 처리 지연으로 몇 시간 늦을 수 있습니다
            </p>
          </>
        )}
      </main>
    </>
  );
}
