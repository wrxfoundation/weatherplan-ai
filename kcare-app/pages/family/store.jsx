import Head from "next/head";
import { useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { Card, SectionLabel, PrimaryButton } from "../../components/ui";
import { STORE_ITEMS } from "../../lib/mock";
import { fmtWon } from "../../lib/config";
import { useAppState } from "../../lib/state";

// 보호자 스토어 — 회의 6 "양쪽 모두 결제". 어르신이 담은 것과 같은 카탈로그.
// 보호자 결제는 승인 절차 없이 바로 주문 (자기 결제).

export default function StorePage() {
  const { state, dispatch } = useAppState();
  const [sel, setSel] = useState({});
  const [ordered, setOrdered] = useState(false);

  const items = STORE_ITEMS.filter((i) => sel[i.id]);
  const total = items.reduce((s, i) => s + i.price, 0);

  const order = () => {
    if (items.length === 0 || ordered) return;
    setOrdered(true);
    dispatch({ type: "demo", payload: { cart: true } }); // 어르신 배송 카드 갱신
    dispatch({
      type: "addRequest",
      payload: {
        id: `rq-${Date.now()}`,
        dir: "fromGuardian",
        type: "물품 전달해 주세요",
        detail: `보호자 주문: ${items.map((i) => i.name).join(", ")} — 다음 배송일에 전달해 주세요.`,
        amount: total,
        preferredDate: null,
        urgency: "normal",
        assignee: "박지현",
        photos: [],
        status: "inProgress",
        history: [
          { at: Date.now(), status: "requested", note: "스토어 주문" },
          { at: Date.now(), status: "confirmed", note: "" },
          { at: Date.now(), status: "inProgress", note: `보호자 결제 ${fmtWon(total)} (결제 연동 대기 · 데모)` },
        ],
        proof: null,
      },
    });
    dispatch({
      type: "pushEvent",
      payload: { kind: "스토어", text: `보호자 주문 ${items.length}건 · ${fmtWon(total)}`, color: "#B08D57" },
    });
  };

  return (
    <>
      <Head>
        <title>스토어 — K-CARE</title>
      </Head>
      <FamilyLayout title="스토어">
        <p className="px-1 text-[13px] leading-[1.7] text-muted">
          어르신 화면과 같은 카탈로그입니다. 어르신이 담은 물품은 결제권한 설정에 따라 승인
          요청으로 도착하고, 보호자 주문은 바로 결제됩니다.
        </p>

        {/* 케어 필요 기반 추천 — 환경(폭염) × 이력. 판매 목표 아님 (원칙 1) */}
        <Card className="border border-amber/30 p-4" style={{ background: "linear-gradient(180deg,#FFF7E8,#FBEFD8)" }}>
          <div className="text-[12px] font-bold text-amber">폭염 특보 — 이번 주 챙기면 좋은 것</div>
          <p className="mt-1 text-[14px] leading-[1.65] text-ink">
            실내 온도가 높은 날이 이어집니다. 보냉백 · 생수 묶음 · 쿨매트를 아래 목록에서 확인해
            보세요 — 담당 컨시어지가 다음 방문에 함께 전달합니다.
          </p>
          <p className="mt-1.5 text-[11px] text-muted">추천 기준: 케이웨더 환경 신호 × 어르신 이력 — 판매 실적과 무관합니다</p>
        </Card>
        <Card className="p-4">
          <SectionLabel>생활 · 건강 물품</SectionLabel>
          <div className="mt-3 space-y-2">
            {STORE_ITEMS.map((i) => {
              const on = !!sel[i.id];
              return (
                <button
                  key={i.id}
                  onClick={() => !ordered && setSel((s) => ({ ...s, [i.id]: !s[i.id] }))}
                  className={`btn-press flex w-full items-center gap-3 rounded-xl border p-3 text-left ${
                    on ? "border-gold bg-gold/10" : "border-navy/12"
                  }`}
                >
                  <span
                    className={`inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border text-[12px] font-bold ${
                      on ? "border-gold bg-gold text-white" : "border-navy/25 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span className="flex-1 text-[15px] font-bold text-ink">{i.name}</span>
                  <span className="font-num text-[15px] font-bold text-navy">{fmtWon(i.price)}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {items.length > 0 && !ordered && (
          <Card className="p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[15px] font-bold text-navy">담은 물품 {items.length}건</span>
              <span className="font-num text-[19px] font-bold text-navy">{fmtWon(total)}</span>
            </div>
          </Card>
        )}

        {ordered ? (
          <Card className="border-green/30 bg-[#F1FAF6] p-4 text-[15px] font-bold text-green">
            주문이 접수되었습니다 — 다음 배송일에 전달됩니다. 어르신 화면의 배송 안내도
            갱신되었습니다.
          </Card>
        ) : (
          <PrimaryButton disabled={items.length === 0} onClick={order}>
            {items.length === 0 ? "물품을 선택해 주세요" : `바로 결제 (보호자) · ${fmtWon(total)}`}
          </PrimaryButton>
        )}
      </FamilyLayout>
    </>
  );
}
