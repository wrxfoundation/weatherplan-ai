import Head from "next/head";
import { useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { Card, SectionLabel, PrimaryButton, Badge } from "../../components/ui";
import Icon from "../../components/icons";
import { STORE_CATALOG, STORE_INDEX } from "../../lib/store";
import { fmtWon } from "../../lib/config";
import { useAppState } from "../../lib/state";

// 보호자 스토어 — 실무자 피드백 (2026-08-09) '쇼핑몰 제안' 시트 구조 그대로.
// 썸네일 2열 그리드 (실무자 UI 샘플 반영): 카테고리 큰 버튼 → 하위분류 칩 →
// 상품 카드(썸네일 · 이름 · 가격). 썸네일은 경영 콘솔에서 올린 이미지가 있으면
// 그 이미지, 없으면 카테고리 아이콘이다 (state.productImages — 콘솔 연동).
//
// 가격은 navy 로 쓴다 — 샘플은 빨간 가격이지만 이 앱에서 빨강은 위험 신호
// 전용이다 (SOS · 낙상). 상거래 숫자에 쓰면 그 원칙이 무너진다.
// 약국은 판매가 아니라 구매대행 — 약사법 경계라 배지로 명시한다.

export default function StorePage() {
  const { state, dispatch } = useAppState();
  const images = state.productImages || {};
  // 첫 방문 안전진단(컨시어지)이 담아 둔 생활안전용품 — 자동으로 선택된 채 시작
  const safetyCart = state.demo.safetyCart || [];
  const [sel, setSel] = useState(() => Object.fromEntries(safetyCart.map((id) => [id, true])));
  const [cat, setCat] = useState(safetyCart.length > 0 ? "safety" : "pharmacy");
  const [groupIdx, setGroupIdx] = useState(0);
  const [ordered, setOrdered] = useState(false);

  const items = Object.keys(sel)
    .filter((id) => sel[id])
    .map((id) => STORE_INDEX[id])
    .filter(Boolean);
  const total = items.reduce((s, i) => s + (i.price || 0) + (i.ship || 0), 0);
  const active = STORE_CATALOG.find((c) => c.id === cat);
  const group = active.groups[Math.min(groupIdx, active.groups.length - 1)];

  const order = () => {
    if (items.length === 0 || ordered) return;
    setOrdered(true);
    dispatch({ type: "demo", payload: { cart: true, safetyCart: [] } }); // 어르신 배송 카드 갱신 · 진단 장바구니 소진
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

        {/* 안전진단 자동 담기 — 컨시어지 첫 방문 진단과 연동 (실무자 요청) */}
        {safetyCart.length > 0 && !ordered && (
          <Card className="border-gold/40 p-4" style={{ background: "linear-gradient(180deg,#FBF6EC,#F6EFDE)" }}>
            <div className="text-[12px] font-bold text-gold">첫 방문 홈 안전진단 결과</div>
            <p className="mt-1 text-[14px] leading-[1.65] text-ink">
              진단에서 <b>&lsquo;아니오&rsquo;</b>가 나온 항목에 맞는 생활안전용품{" "}
              <b>{safetyCart.length}개</b>가 장바구니에 담겨 있습니다. 빼셔도 됩니다 — 필요한
              것만 결제하세요.
            </p>
          </Card>
        )}

        {/* 카테고리 — 큰 버튼 (실무자 UI 샘플: 활성은 채움, 비활성은 옅게) */}
        <div className="grid grid-cols-4 gap-2">
          {STORE_CATALOG.map((c) => {
            const on = cat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setCat(c.id);
                  setGroupIdx(0);
                }}
                className={`btn-press flex flex-col items-center gap-1.5 rounded-2xl border px-1 py-3 ${
                  on ? "border-navy bg-navy text-white" : "border-navy/12 bg-white/70 text-muted"
                }`}
              >
                <Icon name={c.icon} size={22} />
                <span className={`text-[11.5px] font-bold leading-tight ${on ? "text-white" : "text-muted"}`}>
                  {c.name}
                </span>
                {c.badge && (
                  <span
                    className={`rounded-full px-1.5 py-[2px] text-[9px] font-bold ${
                      on ? "bg-white/15 text-gold-soft" : "bg-navy/[.07] text-muted"
                    }`}
                  >
                    {c.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 하위분류 칩 — 약국처럼 그룹이 여럿일 때만 */}
        {active.groups.length > 1 && (
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
            {active.groups.map((g, i) => {
              const on = i === Math.min(groupIdx, active.groups.length - 1);
              return (
                <button
                  key={g.name}
                  onClick={() => setGroupIdx(i)}
                  className={`btn-press shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-bold ${
                    on ? "border-navy bg-navy text-white" : "border-navy/15 bg-white/70 text-muted"
                  }`}
                >
                  {g.name}
                </button>
              );
            })}
          </div>
        )}

        {active.note && (
          <p className="rounded-xl bg-navy/[.045] px-3.5 py-2.5 text-[12.5px] leading-[1.7] text-muted">
            {active.note}
          </p>
        )}

        {/* 상품 썸네일 그리드 — 2열 */}
        <div>
          <div className="flex items-center gap-2 px-1">
            <span className="h-[7px] w-[7px] rounded-full bg-navy" />
            <SectionLabel>{group.name}</SectionLabel>
            {active.id === "pharmacy" && (
              <Badge fg="#8A5D12" bg="rgba(176,141,87,.16)">
                구매대행
              </Badge>
            )}
          </div>
          <ul className="mt-2.5 grid grid-cols-2 gap-2.5">
            {group.items.map((i) => {
              const on = !!sel[i.id];
              const disabled = !i.price; // 가격 확정 전 — 담기지 않는다
              const img = images[i.id];
              return (
                <li key={i.id}>
                  <button
                    disabled={disabled}
                    onClick={() => !ordered && setSel((s) => ({ ...s, [i.id]: !s[i.id] }))}
                    className={`btn-press w-full overflow-hidden rounded-2xl border text-left ${
                      disabled
                        ? "cursor-not-allowed border-dashed border-navy/15 opacity-70"
                        : on
                        ? "border-gold ring-2 ring-gold/50"
                        : "border-navy/12"
                    } bg-white`}
                  >
                    {/* 썸네일 — 콘솔 업로드 이미지가 있으면 그 이미지, 없으면 아이콘 */}
                    <span className="relative block aspect-square w-full bg-[#EDF1EA]">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-navy/30">
                          <Icon name={active.icon} size={44} strokeWidth={1.4} />
                        </span>
                      )}
                      {on && (
                        <span className="absolute right-2 top-2 inline-flex h-[24px] w-[24px] items-center justify-center rounded-full bg-gold text-[13px] font-bold text-white shadow">
                          ✓
                        </span>
                      )}
                    </span>
                    <span className="block px-3 pb-3 pt-2.5">
                      <span className="block min-h-[38px] text-[14px] font-bold leading-[1.4] text-ink">
                        {i.name}
                      </span>
                      {i.price ? (
                        <>
                          <span className="mt-1 block font-num text-[17px] font-bold text-navy">
                            {fmtWon(i.price)}
                          </span>
                          {i.ship ? (
                            <span className="block font-num text-[10.5px] text-muted">
                              배송 {fmtWon(i.ship)}
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <span className="mt-1 block text-[12px] font-bold text-muted">{i.pending}</span>
                      )}
                      {i.note && (
                        <span className="mt-1 block text-[11px] leading-[1.5] text-muted">{i.note}</span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {items.length > 0 && !ordered && (
          <Card className="p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[15px] font-bold text-navy">담은 물품 {items.length}건</span>
              <span className="font-num text-[19px] font-bold text-navy">{fmtWon(total)}</span>
            </div>
            <p className="mt-1 text-[11px] text-muted">배송비 포함 · 약국 물품은 구매대행 후 영수증이 첨부됩니다</p>
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
