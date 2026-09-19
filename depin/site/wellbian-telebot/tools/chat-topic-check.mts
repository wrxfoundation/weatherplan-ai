/* 그룹 잡담 갈래 확인 (8/30)

   실행: node --experimental-strip-types \
     --import "data:text/javascript,import{register}from'node:module';import{pathToFileURL}from'node:url';register('./tools/ts-resolve.mjs',pathToFileURL('./'));" \
     tools/chat-topic-check.mts

   CS 주제(결제·지갑·기기…)가 먼저 걸리고, 거기 안 걸리는 말만 잡담 갈래로 간다.
   규칙을 손대면 여기부터 돌려 볼 것. */
import { chatTopicOf } from "../lib/cs.ts";

const CASES: [string, string][] = [
  // CS 주제가 먼저 — 문의는 문의로 남아야 한다
  ["환불되나요?", "결제"],
  ["지갑 주소 어디서 봐요", "지갑"],
  ["배송 언제 되나요", "기기"],
  ["가격 얼마예요", "결제"],
  // 잡담 갈래
  ["gm", "인사"],
  ["좋은 아침입니다", "인사"],
  ["안녕하세요~", "인사"],
  ["화이팅!", "응원"],
  ["기대됩니다", "응원"],
  ["최고네요", "응원"],
  ["떡상 가즈아", "시세"],
  ["물렸다 ㅠㅠ", "시세"],
  ["존버한다", "시세"],
  ["트위터 팔로우했어요", "커뮤니티"],
  ["공지 확인했습니다", "커뮤니티"],
  ["ㅋㅋㅋㅋ", "잡담"],
  ["오늘 점심 뭐 먹지", "잡담"],
  // 사고 신호는 잡담에 묻히면 안 된다
  ["이거 사기 아님?", "사고"],
  ["스캠인가요", "사고"],
  ["지갑 털렸어요", "지갑"],   // CS 주제가 먼저 걸린다
];
let fail = 0;
for (const [text, want] of CASES) {
  const got = chatTopicOf(text);
  if (got !== want) { console.log(`✗ "${text}" → ${got} (기대 ${want})`); fail++; }
}
console.log(fail ? `실패 ${fail} / ${CASES.length}` : `전부 통과 (${CASES.length}건)`);
process.exit(fail ? 1 : 0);
