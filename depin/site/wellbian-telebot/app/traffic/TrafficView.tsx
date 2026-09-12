/* 유입 화면 본문 — 관리자(/admin/traffic)와 공개(/traffic)가 같은 것을 본다
   (9/8 서우 — "이해하기 쉽게 일목요연하게 정리해줘, 그래프도 넣어서, 별도 키값 없이 접속 가능하게")

   순서가 위계다.
     ① 지금 얼마나 — 숫자 넷(지난 30분 · 오늘 · 이번 주 · 런치 이후)
     ② 언제 들어왔나 — 일·주·월 추이(채널 색으로 쌓은 막대)
     ③ 어디서 들어왔나 — 채널 비중. 그 아래 소스/매체 원문은 접어 둔다
     ④ 상세 — 어느 링크(utm_content) · 캠페인 · 많이 본 페이지
     ⑤ 읽는 법 — (direct)·출처 미확인·구글 로그인 복귀가 무엇인지

   읽기만 한다. 집계는 lib/traffic.ts, 호출·캐시는 lib/ga.ts, 이 파일은 그리기만 한다.
   PII 는 없다 — GA 가 주는 것은 집계 숫자뿐이다. */

import type { ReactNode } from "react";
import Charts from "./Charts";
import { CHANNEL, channelOf, dayLong, weekLong, type Channel } from "@/lib/traffic";
import type { TrafficSnapshot } from "@/lib/ga";
import { aiComment, aiReady } from "@/lib/ai-comment";
import { CSV_TABLES } from "@/lib/traffic-csv";

const n = (v: string | undefined) => Number(v ?? 0) || 0;
const fmt = (x: number) => x.toLocaleString("ko-KR");
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");
const grid = (cols: string) => ({ gridTemplateColumns: cols } as const);

const Sw = ({ c }: { c: Channel }) => {
  const m = CHANNEL[c];
  return <i className={`tf-sw${m.hatch ? " hatch" : ""}`} style={m.hatch ? undefined : { background: m.color }} />;
};

/* rep-tr 은 7열 고정(리포트용)이라 열 수가 다른 표는 폭을 직접 준다 */
const Table = ({ head, rows, cols }: { head: string[]; rows: (ReactNode | number)[][]; cols: string }) => (
  <div className="rep-table">
    <div className="rep-tr rep-th" style={grid(cols)}>
      {head.map((h) => <span key={h}>{h}</span>)}
    </div>
    {rows.length === 0 && (
      <div className="rep-tr" style={grid(cols)}><span style={{ color: "var(--dis)" }}>아직 없습니다</span></div>
    )}
    {rows.map((r, i) => (
      <div key={i} className="rep-tr" style={grid(cols)}>
        {r.map((v, j) => (
          <span key={j} className={j === 0 ? "rep-topic" : "mono"}
            style={j === 0 ? undefined : { color: typeof v === "number" && v ? "var(--ink-2)" : "var(--dis)" }}>
            {typeof v === "number" ? fmt(v) : v}
          </span>
        ))}
      </div>
    ))}
  </div>
);

export default async function TrafficView({ snap, variant }: { snap: TrafficSnapshot; variant: "public" | "admin" }) {
  const d = snap.data;
  /* 숫자 넷 아래 한 문단 — 데이터가 바뀔 때만 새로 만든다(lib/ai-comment.ts). 키가 없으면 칸이 없다. */
  const ai = await aiComment(snap);
  const k = d.kpi;
  const ago = Math.max(0, Math.round((Date.now() - snap.fetchedAt) / 60000));
  const unset = d.channels.find((c) => c.key === "unset");
  const googleBack = d.sources.find((s) => s.source === "accounts.google.com");
  const noUtm = snap.byContent.filter((r) => r.sessionManualAdContent === "(not set)").reduce((a, r) => a + n(r.sessions), 0);

  return (
    <>
      {/* ① 지금 얼마나 */}
      <section className="tf-kpis" aria-label="요약">
        <div className="tf-kpi lead">
          <div className="tf-k">지금 보고 있는 사람</div>
          <div className="tf-v mono" style={{ color: snap.realtime ? "var(--ok-text)" : "var(--dis)" }}>{fmt(snap.realtime)}</div>
          <div className="tf-n">지난 30분 · 실시간</div>
        </div>
        <div className="tf-kpi">
          <div className="tf-k">오늘 세션</div>
          <div className="tf-v mono">{fmt(k.today)}</div>
          <div className="tf-n">{dayLong(d.today)} · 처리 지연으로 늘어납니다</div>
        </div>
        <div className="tf-kpi">
          <div className="tf-k">이번 주 세션</div>
          <div className="tf-v mono">{fmt(k.week)}</div>
          <div className="tf-n">{weekLong(k.weekStart)} · 월요일부터</div>
        </div>
        <div className="tf-kpi lead">
          <div className="tf-k">런치 이후 세션</div>
          <div className="tf-v mono">{fmt(k.total)}</div>
          <div className="tf-n">사용자 {fmt(k.users)} · 신규 {fmt(k.newUsers)} · 참여 {pct(k.engaged, k.total)}</div>
        </div>
      </section>

      {/* ①-2 종합 코멘트 (9/8 서우 — "종합적 분석 코멘트도 AI 가, 숫자 넷 하단에") */}
      {ai ? (
        <section className="tf-ai" aria-label="AI 종합 코멘트">
          <div className="tf-ai-k">AI 종합 코멘트 <span>자동 생성 · 위 숫자와 아래 표만 근거로 씁니다 · {Math.max(0, Math.round((Date.now() - ai.at) / 60000)) === 0 ? "방금" : `${Math.round((Date.now() - ai.at) / 60000)}분 전`} 작성</span></div>
          <p className="tf-ai-t">{ai.text}</p>
        </section>
      ) : variant === "admin" && !aiReady() ? (
        <p className="tf-foot" style={{ marginTop: 6 }}>Vercel 에 <span className="mono">ANTHROPIC_API_KEY</span> 를 넣으면 이 자리에 AI 종합 코멘트가 붙습니다(README · AI 코멘트).</p>
      ) : null}

      {/* CSV (9/8 서우 — "csv로도 export할 수 있게") — 아래 표들을 그대로 파일로. 엑셀에서 바로 열린다(BOM). */}
      <div className="tf-dl" aria-label="내려받기">
        <span className="tf-dl-k">내려받기</span>
        <a className="xl" href="/traffic/export?f=xlsx" download>엑셀 파일(.xlsx) — 표 전부</a>
        <span className="tf-dl-k" style={{ marginLeft: 6 }}>CSV</span>
        {CSV_TABLES.map((t) => <a key={t.key} href={`/traffic/export?t=${t.key}`} download>{t.label}</a>)}
        <span className="tf-dl-n">한글이 깨져 보이면 엑셀 파일을 쓰세요. CSV 는 UTF-8(BOM)이고, 그래도 깨지는 프로그램에는 <a href="/traffic/export?t=all&f=csv16" download>유니코드 CSV</a>가 있습니다 · 화면과 같은 5분 캐시 데이터</span>
      </div>

      {/* ② 언제 */}
      <h2 className="rep-h">언제 들어왔나 — 일 · 주 · 월</h2>
      <p className="rep-sub">
        막대 하나가 하루(한 주·한 달)이고, 그 안을 채널 색으로 쌓았습니다. 막대에 올리면 그날의 채널 구성이 보입니다.
        태그를 붙인 {snap.since} 부터라, 그 전은 유입이 없어서가 아니라 측정이 없어서 비어 있습니다.
      </p>
      <Charts daily={d.daily} weekly={d.weekly} monthly={d.monthly} />

      {/* ③ 어디서 */}
      <h2 className="rep-h">어디서 들어왔나 — 채널</h2>
      <p className="rep-sub">
        색이 있는 채널이 우리가 링크를 뿌린 곳입니다. 회색은 우리가 뿌리지 않은 곳(검색 · 직접)이거나,
        방문은 잡혔지만 어느 경로로 왔는지 비어 있는 것(출처 미확인)입니다. 비중은 런치 이후 세션 기준입니다.
      </p>
      <div className="tf-card">
        <div className="tf-share h">
          <span>채널</span><span /><span className="num">세션</span><span className="num">비중</span>
          <span className="num m-hide">사용자</span><span className="num m-hide">참여율</span>
        </div>
        {d.channels.length === 0 && <div className="tf-share"><span style={{ color: "var(--dis)" }}>아직 없습니다</span></div>}
        {d.channels.map((c) => {
          const m = CHANNEL[c.key];
          return (
            <div key={c.key} className="tf-share">
              <span className="tf-ch"><Sw c={c.key} /><span style={{ minWidth: 0 }}>{m.label}<span className="tf-hint">{m.hint}</span></span></span>
              <span className="tf-bar" aria-hidden="true">
                <i className={m.hatch ? "hatch" : undefined} style={{ width: `${Math.max(c.share, 1)}%`, background: m.hatch ? undefined : m.color }} />
              </span>
              <span className="num mono">{fmt(c.sessions)}</span>
              <span className="num mono" style={{ color: "var(--ink-3)" }}>{c.share}%</span>
              <span className="num mono m-hide" style={{ color: "var(--ink-3)" }}>{fmt(c.users)}</span>
              <span className="num mono m-hide" style={{ color: "var(--ink-3)" }}>{pct(c.engaged, c.sessions)}</span>
            </div>
          );
        })}

        {unset && (
          <p className="tf-why">
            <Sw c="unset" /><b>출처 미확인 {fmt(unset.sessions)}세션({unset.share}%)은 측정이 안 된 것이 아닙니다.</b> 방문 자체는
            위 「런치 이후 세션」에 들어 있고, 어느 경로로 왔는지만 GA 가 세션에 붙이지 못한 것입니다. 이렇게 되는 경우는 넷입니다.
            ① 오늘 들어온 세션의 처리가 아직 안 끝남(표준 보고서는 24~48시간 뒤 대부분 채워집니다) ② 어제 시작해 자정을 넘긴
            세션의 오늘 몫 ③ 첫 페이지뷰보다 다른 이벤트가 먼저 잡힌 세션(사이트 안 로그인 · 화면 전환 뒤 이어진 방문)
            ④ 쿠키 동의를 거부한 방문의 일부. 며칠이 지나도 이 비중이 크면 사이트 태그 순서를 개발자에게 확인합니다.
          </p>
        )}

        <details className="tf-details" open={variant === "admin"}>
          <summary>소스 / 매체 원문 그대로 보기 — UTM 값이 어느 채널로 묶였는지</summary>
          <Table head={["소스 / 매체", "채널", "세션", "사용자", "참여"]} cols="1.9fr 1fr 0.8fr 0.8fr 0.8fr"
            rows={d.sources.map((s) => [
              `${s.source} / ${s.medium}`,
              <span key="c" className="tf-src" style={{ justifyContent: "flex-end", fontWeight: 600, color: "var(--ink-3)" }}><Sw c={s.channel} />{CHANNEL[s.channel].label}</span>,
              s.sessions, s.users, s.engaged,
            ])} />
        </details>
      </div>

      {/* ④ 상세 */}
      <h2 className="rep-h">어느 링크인가 — utm_content</h2>
      <p className="rep-sub">
        같은 채널 안에서 어느 글·영상·매체의 링크였는지 가릅니다. <b>(없음)</b> 은 utm_content 를 안 붙인 링크이거나
        링크를 안 거친 유입입니다{noUtm ? ` — 지금 ${fmt(noUtm)} 세션` : ""}.
      </p>
      <Table head={["채널 · 소스 · 콘텐츠", "세션", "사용자"]} cols="2.6fr 1fr 1fr"
        rows={[...snap.byContent]
          /* 콘텐츠가 붙은 행을 앞에 — (없음) 은 총량 확인용이라 뒤로 */
          .sort((a, b) => Number(a.sessionManualAdContent === "(not set)") - Number(b.sessionManualAdContent === "(not set)") || n(b.sessions) - n(a.sessions))
          .map((r) => {
          const ch = channelOf(r.sessionSource, r.sessionMedium);
          const content = r.sessionManualAdContent === "(not set)" ? "(없음)" : r.sessionManualAdContent;
          return [
            <span key="s" className="tf-src"><Sw c={ch} />{r.sessionSource} · <span style={{ color: content === "(없음)" ? "var(--dis)" : "var(--w-main)" }}>{content}</span></span>,
            n(r.sessions), n(r.activeUsers),
          ];
        })} />

      <div className="tf-two">
        <div>
          <h2 className="rep-h">캠페인</h2>
          <Table head={["utm_campaign", "세션", "사용자"]} cols="1.8fr 1fr 1fr"
            rows={snap.byCampaign.map((r) => [r.sessionCampaignName, n(r.sessions), n(r.activeUsers)])} />
        </div>
        <div>
          <h2 className="rep-h">많이 본 페이지</h2>
          <Table head={["경로", "조회", "사용자"]} cols="1.8fr 1fr 1fr"
            rows={snap.byPage.map((r) => [r.pagePath, n(r.screenPageViews), n(r.activeUsers)])} />
        </div>
      </div>

      {/* ⑤ 읽는 법 */}
      <div className="tf-note">
        <b>읽는 법</b>
        <ul>
          <li><b>세션</b>은 한 번의 방문, <b>사용자</b>는 사람 수입니다. 한 사람이 세 번 오면 세션 3 · 사용자 1. 채널별 사용자는 소스별 합이라 위 합계보다 클 수 있습니다.</li>
          <li><b>직접</b>은 출처가 안 넘어온 방문입니다 — 주소를 직접 쳤거나, 텔레그램·카카오톡 앱 안 브라우저처럼 리퍼러를 안 보내는 곳에서 눌렀거나. UTM 을 붙인 링크만 채널로 잡힙니다. 그래서 링크는 항상 UTM 붙은 것을 씁니다.</li>
          {googleBack && (
            <li><b>구글 로그인 복귀</b>(accounts.google.com {fmt(googleBack.sessions)} 세션)는 사이트에서 구글 로그인을 하고 돌아온 것이라 직접에 넣었습니다. GA 관리 › 데이터 스트림 › 태그 설정 › <b>원치 않는 리퍼럴</b>에 accounts.google.com 을 넣으면 원래 세션에 이어집니다.</li>
          )}
          {unset && (
            <li><b>출처 미확인</b>({unset.share}%)은 방문은 집계됐는데 경로만 비어 있는 세션입니다. 위 채널 표 아래에 원인 넷을 적어 두었습니다. 오늘 것은 처리가 덜 끝나서 그렇고 하루 지나면 대개 줄어듭니다. 며칠이 지나도 크면 개발자에게 "페이지뷰(config) 태그가 커스텀 이벤트보다 먼저 실행되는지, 로그인 리다이렉트 뒤 세션이 끊기지 않는지" 확인을 요청합니다.</li>
          )}
          <li>표준 보고서는 GA4 처리 지연으로 몇 시간 늦습니다. 오늘 숫자는 저녁에 다시 보면 늘어 있습니다. 실시간 칸만 지금 값입니다.</li>
        </ul>
      </div>

      <p className="tf-foot">
        {ago === 0 ? "방금" : `${ago}분 전에`} GA4 에서 읽음 · 5분마다 새로 읽습니다 · 집계 시작 {snap.since} · 기준 시간 한국
      </p>
    </>
  );
}
