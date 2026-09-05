import { NextResponse } from "next/server";

/* GET /api/inventory — 8/29 비활성화.
   PRD §7 목 엔드포인트였는데, 인증 없이 열린 채로 대외 표기가 금지된 값들을 그대로
   JSON 으로 내보내고 있었다: phase 기본값·에코가 "early_bird"(얼리버드 명칭 대외 표기 금지),
   price 가 {first:450, later:650}(차수·확정가), sold 가 재고 수치(수량 대외 표기 금지).
   화면 문구에서 걷어낸 것들이 API 에는 남아 있어, 사람은 새 문구를 보고 API 를 여는 쪽은
   옛 정책을 봤다. 호출하는 코드는 없다 — 랜딩은 MOCK_INVENTORY 를 직접 읽는다(Landing.tsx:47).

   제네시스 정책으로 재작성할 때 다시 연다. 그때는 재고·가격 대신
   판매 단계(사전예매/우선창/일반창/종료)만 내보내는 형태가 맞다. */
export async function GET() {
  return NextResponse.json({ error: "not_available" }, { status: 404 });
}
