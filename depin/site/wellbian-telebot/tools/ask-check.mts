import { isQuestion } from "../lib/cs.ts";
const YES = [
  "환불되나요?", "배송비는 따로있나요", "언제 오픈해요?", "지갑 어떻게 만들어요",
  "얼마예요?", "제네시스가 뭔가요", "1.5 XRP 꼭 필요한가요?", "혹시 아시는 분",
  "트러스트라인 설정 어떻게 하죠?", "How do I buy RLUSD?", "when does it open",
  "anyone know the price", "이거 가능한가", "메일 주소 알려주세요", "궁금한 게 있는데",
];
const NO = [
  "ㅋㅋㅋ", "감사합니다", "좋네요", "화이팅!", "네", "왜곡된 정보가 많네요",
  "어디까지나 제 생각입니다", "오늘 날씨 좋다", "gm", "축하드립니다",
  "저도 샀어요", "기대됩니다", "잘 받았습니다", "굿",
];
let fail = 0;
for (const t of YES) if (!isQuestion(t)) { console.log("✗ 질문인데 못 잡음:", t); fail++; }
for (const t of NO)  if (isQuestion(t))  { console.log("✗ 질문 아닌데 잡음:", t); fail++; }
console.log(fail ? `실패 ${fail}건 / 총 ${YES.length + NO.length}` : `전부 통과 (질문 ${YES.length} · 잡담 ${NO.length})`);
process.exit(fail ? 1 : 0);
