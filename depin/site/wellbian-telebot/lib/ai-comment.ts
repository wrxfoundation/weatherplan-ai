/* AI 종합 코멘트 (9/8 서우 — "종합적 분석 코멘트도 AI 가 상단에, 숫자 넷 하단에 달아주고")

   숫자 넷과 그래프는 있는데 "그래서 지금 어떤 상황인가" 한 문단이 없었다. 파트너에게 주소를 건네면
   그 문단부터 찾는다. 유입 스냅샷(일별·채널·UTM·페이지)을 Claude 에 넘겨 4~6문장으로 받는다.

   규칙은 화면과 같다 — 주어진 숫자만, 출처 미확인은 "누락" 이 아니라 "경로만 빈 것", 오늘 숫자는
   처리 지연으로 늘어나므로 오늘만으로 감소를 단정하지 않는다. 매출·전환·시세는 입에 올리지 않는다.

   비용: 코멘트는 데이터가 바뀔 때만 다시 만든다 — 핵심 숫자(오늘·이번 주·전체·채널 비중)를 요약한
   키가 같으면 KV 에 둔 것을 그대로 쓰고, 키가 달라도 30분 안에는 다시 만들지 않는다. 서버리스라
   인스턴스마다 메모리가 따로 놀아서 KV 가 있으면 KV 에 둔다. 실패하면 10분 동안 다시 부르지 않는다.

   ANTHROPIC_API_KEY 가 없으면 조용히 빈손으로 돌아간다 — 화면은 코멘트 칸 없이 그대로 뜬다. */

import Anthropic from "@anthropic-ai/sdk";
import { cacheGet, cacheSet } from "./store";
import { CHANNEL } from "./traffic";
import type { TrafficSnapshot } from "./ga";

const MODEL = "claude-opus-5";
const KEY = "ai:traffic";
const FRESH_MS = 30 * 60_000;      // 키가 달라져도 이 안에는 다시 안 만든다
const STALE_MS = 6 * 3600_000;     // 키가 같아도 이 지나면 다시 만든다
const FAIL_MS = 10 * 60_000;       // 실패 뒤 재시도 간격

export const aiReady = () => Boolean(process.env.ANTHROPIC_API_KEY);

export type AiComment = { text: string; at: number; model: string };
type Cached = AiComment & { key: string; failed?: boolean };

const SYSTEM = `당신은 wellbian.io(날씨 데이터 측정기 사전예약·판매 사이트)의 GA4 유입 데이터를 읽고 운영자와 파트너에게 짧은 종합 코멘트를 쓰는 분석가입니다.

규칙
- 한국어 존댓말. 4~6문장, 350자 안팎. 문단 하나로 쓰고 줄바꿈·마크다운·이모지·제목·글머리표를 쓰지 않습니다.
- 주어진 숫자만 근거로 씁니다. 없는 사실, 외부 정보, 확인되지 않은 원인을 만들지 않습니다.
- 순서: ① 총량과 추이 한 줄(이번 주·오늘·직전 며칠) ② 채널 구성에서 눈에 띄는 것(UTM 을 붙인 채널, KOL, utm_content 별 성과, 많이 본 페이지) ③ 주의해서 읽을 점 ④ 다음 행동 한 가지.
- "출처 미확인"(not set)은 측정이 안 된 것이 아닙니다. 방문은 집계됐고 어느 경로로 왔는지만 비어 있는 세션이며, 오늘 것은 처리 지연이 가장 큰 이유입니다. "미측정·누락·유실·오류"라고 쓰지 않습니다.
- "직접"은 UTM 없는 링크, 앱 안 브라우저, 주소 직접 입력처럼 출처가 넘어오지 않은 방문입니다.
- 오늘 숫자는 처리 지연으로 늘어나므로 오늘 값만으로 감소를 단정하지 않습니다.
- 매출·전환·수익·시세·토큰 가격을 언급하지 않습니다. 과장과 홍보 문구를 쓰지 않습니다. 숫자는 정수 또는 소수 첫째 자리까지만 씁니다.
- 자신이 AI 라는 말, 데이터를 받았다는 말, 인사말을 쓰지 않습니다. 코멘트 본문만 씁니다.`;

/* 모델에 넘길 것만 추린다 — 화면에 있는 표와 같은 숫자다. 원문 소스 이름이 그대로 가는 것은
   UTM 값(utm_source·utm_content)뿐이고, 개인정보는 애초에 GA 에 없다. */
const shape = (s: TrafficSnapshot) => {
  const d = s.data;
  const n = (v: string | undefined) => Number(v ?? 0) || 0;
  const top = (b: { by: Partial<Record<string, number>> }) =>
    Object.entries(b.by).sort((a, c) => (c[1] ?? 0) - (a[1] ?? 0)).slice(0, 3)
      .map(([k, v]) => `${CHANNEL[k as keyof typeof CHANNEL]?.label ?? k} ${v}`).join(", ");
  return {
    기준: { 오늘: d.today, 집계시작: s.since, 실시간_지난30분_사용자: s.realtime },
    요약: { 오늘_세션: d.kpi.today, 이번주_세션: d.kpi.week, 전체_세션: d.kpi.total, 전체_사용자: d.kpi.users, 신규_사용자: d.kpi.newUsers, 참여_세션: d.kpi.engaged },
    일별_최근14일: d.daily.slice(-14).map((b) => ({ 날: b.long, 세션: b.total, 상위채널: top(b) })),
    주별: d.weekly.map((b) => ({ 주: b.long, 세션: b.total })),
    채널: d.channels.map((c) => ({ 채널: CHANNEL[c.key].label, 세션: c.sessions, 비중_퍼센트: c.share, 사용자: c.users, 참여세션: c.engaged })),
    소스_상위: d.sources.slice(0, 8).map((r) => ({ 소스_매체: `${r.source} / ${r.medium}`, 채널: CHANNEL[r.channel].label, 세션: r.sessions })),
    utm_content_상위: s.byContent.slice(0, 8).map((r) => ({ 소스: r.sessionSource, 콘텐츠: r.sessionManualAdContent === "(not set)" ? "(없음)" : r.sessionManualAdContent, 세션: n(r.sessions) })),
    캠페인: s.byCampaign.slice(0, 5).map((r) => ({ 캠페인: r.sessionCampaignName, 세션: n(r.sessions) })),
    페이지_상위: s.byPage.slice(0, 6).map((r) => ({ 경로: r.pagePath, 조회: n(r.screenPageViews), 사용자: n(r.activeUsers) })),
  };
};

/* 핵심 숫자가 그대로면 같은 코멘트를 쓴다. 실시간 사용자는 분마다 바뀌므로 구간으로 뭉갠다. */
const keyOf = (s: TrafficSnapshot) => {
  const d = s.data;
  const rt = s.realtime === 0 ? 0 : s.realtime <= 5 ? 1 : s.realtime <= 20 ? 2 : 3;
  return JSON.stringify([d.today, d.kpi.today, d.kpi.week, d.kpi.total, rt, d.channels.map((c) => [c.key, Math.round(c.share)])]);
};

const FIXTURE_TEXT =
  "런치 이후 세션은 282건이고 첫날 194건이 몰린 뒤 둘째 날 88건으로 이어지고 있습니다. 채널로는 직접 유입이 47.9%로 가장 크고, " +
  "UTM 을 붙인 채널 중에는 X 23건과 텔레그램 10건이 앞서며 utm_content 로는 국문 타래(thread_ko)가 14건으로 가장 많이 들어왔습니다. " +
  "출처 미확인 30.1%는 방문이 집계됐지만 경로가 비어 있는 세션으로 오늘 몫은 처리 지연이 반영되면 줄어드는 것이 보통입니다. " +
  "많이 본 페이지는 첫 화면과 마이페이지 순이라 예약 뒤 확인 동선이 작동하고 있습니다. " +
  "다음 행동으로는 텔레그램과 링크트리 링크에 utm_content 를 붙여 어느 글이 데려오는지 가르는 것을 권합니다.";

export const aiComment = async (snap: TrafficSnapshot): Promise<AiComment | null> => {
  if (snap.error) return null;
  /* 가짜 자료로 볼 때(GA_FIXTURE)는 키가 없으면 견본 문장으로 자리를 보여 준다 */
  if (!aiReady()) return process.env.GA_FIXTURE ? { text: FIXTURE_TEXT, at: snap.fetchedAt, model: "fixture" } : null;

  const key = keyOf(snap);
  const now = Date.now();
  const hit = await cacheGet<Cached>(KEY);
  if (hit) {
    const age = now - hit.at;
    if (hit.failed && age < FAIL_MS) return null;
    if (!hit.failed && (age < FRESH_MS || (hit.key === key && age < STALE_MS))) return { text: hit.text, at: hit.at, model: hit.model };
  }

  try {
    const client = new Anthropic({ maxRetries: 1, timeout: 60_000 });
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system: SYSTEM,
      messages: [{ role: "user", content: `아래는 오늘까지의 유입 데이터입니다. 규칙대로 종합 코멘트를 쓰세요.\n\n${JSON.stringify(shape(snap), null, 0)}` }],
    });
    if (res.stop_reason === "refusal") throw new Error("refusal");
    const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    if (!text) throw new Error("empty");
    const v: Cached = { key, at: now, text, model: res.model };
    await cacheSet(KEY, v, STALE_MS / 1000);
    return { text, at: now, model: res.model };
  } catch (e) {
    /* 실패는 조용히 — 화면은 코멘트 없이 뜬다. 원인은 서버 로그에만. */
    console.error("ai-comment", e instanceof Error ? e.message : e);
    await cacheSet(KEY, { key, at: now, text: "", model: "", failed: true } as Cached, FAIL_MS / 1000);
    return null;
  }
};
