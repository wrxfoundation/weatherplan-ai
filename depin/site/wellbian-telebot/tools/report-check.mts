/* 리포트 집계 확인 (8/30)

   리포트는 틀려도 티가 안 나는 화면이다. 숫자가 하나 어긋나도 그럴듯해 보이고,
   그 숫자를 보고 사람을 어디에 넣을지 정하게 된다. 그래서 값을 고정해 두고 센다.

   실행:
     node --experimental-strip-types \
       --import "data:text/javascript,import{register}from'node:module';import{pathToFileURL}from'node:url';register('./tools/ts-resolve.mjs',pathToFileURL('./'));" \
       tools/report-check.mts

   SLA 기준(lib/cs.ts SLA_MIN)이나 분류 규칙을 손대면 여기부터 돌려 볼 것. */

import { timeStats, buckets, topicRows, quality, median, waiting, inSpan } from "../lib/report.ts";

const NOW = new Date("2026-08-30T12:00:00Z").getTime();
const M = 60_000, H = 3600_000;
let fail = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) { console.log(`✗ ${name}\n   got  ${g}\n   want ${w}`); fail++; }
  else console.log(`✓ ${name} = ${g}`);
};

eq("median 홀수", median([5, 1, 3]), 3);
eq("median 짝수", median([1, 2, 3, 4]), 3);   // (2+3)/2 = 2.5 → 반올림 3
eq("median 빈 배열", median([]), null);

const rows = [
  // 긴급(SLA 30분) — 20분 만에 닫힘 → 준수
  { at: NOW - 2*H, topic: "결제", mood: "negative", status: "done", kind: "unanswered",
    sev: "high", closedAt: NOW - 2*H + 20*M, repliedAt: NOW - 2*H + 20*M },
  // 긴급 — 90분 걸려 닫힘 → 미준수
  { at: NOW - 5*H, topic: "결제", mood: "question", status: "done", kind: "unanswered",
    sev: "high", closedAt: NOW - 5*H + 90*M },
  // 주의(240분) — 아직 열림, 100분 경과 → 판정 보류
  { at: NOW - 100*M, topic: "지갑", mood: "question", status: "new", kind: "unanswered", sev: "mid" },
  // 일반(1440분) — 아직 열림, 2000분 경과 → 미준수 확정
  { at: NOW - 2000*M, topic: "기기", mood: "question", status: "new", kind: "unanswered", sev: "low" },
  // 봇이 후보로 즉시 해결
  { at: NOW - 3*H, topic: "일정", mood: "question", status: "done", kind: "matched",
    sev: "low", closedAt: NOW - 3*H + 1*M },
  // 후보를 보여줬지만 아직 안 눌림
  { at: NOW - 30*M, topic: "일정", mood: "positive", status: "new", kind: "matched", sev: "low" },
  // 분류를 손으로 고친 건
  { at: NOW - 10*M, topic: "보상", mood: "question", status: "new", kind: "unanswered", sev: "high", fixed: true },
];

const t = timeStats(rows, NOW);
eq("첫 응답 중앙값(분)", t.firstReply, 20);          // repliedAt 있는 건 하나
eq("첫 응답 표본 수", t.firstReplyN, 1);
eq("처리 완료 중앙값(분)", t.closed, 20);            // 20, 90, 1 → 중앙값 20
eq("처리 완료 표본 수", t.closedN, 3);
eq("봇 즉시 해결", t.botInstant, 1);
eq("SLA 준수", t.slaOk, 2);                          // 20분 긴급 + 1분 matched
eq("SLA 미준수", t.slaBad, 2);                       // 90분 긴급 + 2000분 일반
eq("SLA 준수율", t.slaRate, 50);
eq("가장 오래 기다린 열린 건(분)", t.worstOpen, 2000);

const q = quality(rows);
eq("어조 (긍/부/의문)", [q.pos, q.neg, q.q], [1, 1, 5]);
eq("부정 비율", q.negRate, 14);                       // 1/7
eq("고친 분류 수", q.fixed, 1);
eq("후보 제시/해결", [q.shown, q.solved], [2, 1]);
eq("FAQ 적중률", q.hitRate, 50);

const tr = topicRows(rows);
/* 긴급 수가 같으면 건수 순이다 — 일정 2건이 지갑 1건보다 앞 */
eq("주제 정렬(긴급 → 건수)", tr.map(r => r.topic), ["결제", "보상", "일정", "지갑", "기기"]);
eq("결제 행", [tr[0].n, tr[0].high, tr[0].open, tr[0].neg], [2, 2, 0, 1]);

const b24 = buckets(rows, "24h", NOW);
eq("24시간 칸 수", b24.length, 24);
eq("24시간 합계", b24.reduce((s, x) => s + x.n, 0), 6);   // 2000분(≈33시간) 건은 창 밖
eq("빈 칸이 남아 있는가", b24.some(x => x.n === 0), true);

const w = waiting(rows, NOW);
eq("기한 초과 열린 건", w.length, 1);
eq("초과 분", w[0].over, 2000 - 1440);

eq("최근 24시간 필터", inSpan(rows, "24h", NOW).length, 6);
eq("전체 필터", inSpan(rows, "all", NOW).length, 7);

console.log(fail ? `\n실패 ${fail}건` : "\n전부 통과");
process.exit(fail ? 1 : 0);
