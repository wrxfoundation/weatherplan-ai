import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { payHref } from "../../lib/payments";
import FamilyLayout from "../../components/FamilyLayout";
import { Clay, Line } from "../../components/clay";
import { Btn, Card, TONE, WhiteBtn, solid } from "../../components/ds";
import { STORE_CATALOG, STORE_INDEX } from "../../lib/store";
import ProductSheet, { GOODS_LOOK } from "../../components/ProductSheet";
import { fmtWon } from "../../lib/config";
import { useAppState } from "../../lib/state";
import { useAuth } from "../../lib/auth";
import { honorific } from "../../lib/tracks";

// 보호자 스토어 — 실무자 피드백 (2026-08-09) '쇼핑몰 제안' 시트 구조 + 2026-10-15 디자인 시안.
// 2열 상품 칸(그림 · 이름 · 가격 · 담기) → 아래 남색 결제 막대. 오른쪽 위 '주문내역'은 구매내역 조회 (2026-08-12 시트).
// 썸네일은 경영 콘솔에서 올린 이미지가 있으면 그 이미지, 없으면 시안의 클레이 그림이다 (state.productImages — 콘솔 연동).
//
// 칸을 누르든 '담기'를 누르든 상품 정보 시트가 먼저 열린다 — 담기는 그 안에서만 (2026-09-22 상담실장 확인 · 전자상거래법 표시).
// 가격은 남색 — 이 앱에서 빨강은 위험 신호 전용이다 (SOS · 낙상). 시안의 산호색 '선생님 제안' 배지도 금색으로.
// 스토어는 생활안전용품만 판다 (2026-10-02 운영 결정 · lib/store.js).

const ORDER_STATUS = {
  preparing: { label: "준비 중", style: { background: TONE.gold.bg, color: TONE.gold.fg } },
  shipping: { label: "배송 중", style: { background: TONE.blue.bg, color: TONE.blue.fg } },
  delivered: { label: "전달 완료", style: { background: TONE.green.bg, color: TONE.green.fg } },
};

export default function StorePage() {
  const { state, dispatch } = useAppState();
  const auth = useAuth();
  const router = useRouter();
  const images = state.productImages || {};
  // 첫 방문 안전진단(컨시어지)이 담아 둔 생활안전용품 — 자동으로 선택된 채 시작
  const safetyCart = state.demo.safetyCart || [];
  const safetyPick = new Set(safetyCart);
  const [sel, setSel] = useState(() => Object.fromEntries(safetyCart.map((id) => [id, true])));
  const [tab, setTab] = useState("shop"); // shop | orders — 구매내역 조회 (2026-08-12 시트)
  // 상품 상세 시트 — 카드를 누르면 바로 담기지 않고 상세를 먼저 본다 (2026-09-22 상담실장 확인)
  const [detail, setDetail] = useState(null);
  const honor = honorific(state.onboarding); // 온보딩에서 받은 성함을 쓴다 — 인자 없이 부르면 기본값(김순자)으로 굳는다
  const orders = state.orders || [];
  const active = STORE_CATALOG[0];
  const all = STORE_CATALOG.flatMap((c) => c.groups.flatMap((g) => g.items));

  const items = Object.keys(sel)
    .filter((id) => sel[id])
    .map((id) => STORE_INDEX[id])
    .filter(Boolean);
  const total = items.reduce((s, i) => s + (i.price || 0) + (i.ship || 0), 0);

  // 결제 — 토스페이먼츠 결제창으로 보낸다 (2026-09-23). 승인이 끝나야 주문이 선다.
  // 여기서는 무엇을 살지만 정하고, 돈이 오가는 자리는 /pay 한 곳이다.
  const payNow = () => {
    if (items.length === 0) return;
    const name = items.length === 1 ? items[0].name : `${items[0].name} 외 ${items.length - 1}건`;
    // 결제 성공 뒤에 주문을 세우려면 무엇을 담았는지가 남아 있어야 한다 (/pay/result 가 이걸 본다)
    dispatch({
      type: "setPendingOrder",
      payload: {
        items: items.map((i) => ({ id: i.id, name: i.name, qty: 1, price: i.price })),
        ship: items.reduce((s, i) => s + (i.ship || 0), 0),
        total,
        channel: safetyCart.length > 0 ? "안전진단 자동 담기" : "보호자 스토어",
        orderName: name,
      },
    });
    router.push(payHref({ kind: "store", amount: total, orderName: name }));
  };

  const ordersBtn = (
    <button
      type="button"
      onClick={() => setTab(tab === "shop" ? "orders" : "shop")}
      aria-pressed={tab === "orders"}
      className="ds-press ds-btn3d flex h-[46px] flex-none items-center rounded-[16px] bg-white px-3.5 text-[15px]"
      style={{ boxShadow: "0 4px 0 #E3DED3" }}
    >
      {tab === "shop" ? `주문내역${orders.length ? ` ${orders.length}` : ""}` : "물품 보기"}
    </button>
  );

  return (
    <>
      <Head>
        <title>스토어 — K-CARE</title>
      </Head>
      <FamilyLayout sub={`${honor} 댁에 필요한 물건`} title={tab === "orders" ? "주문내역" : "스토어"} action={ordersBtn}>
        {tab === "orders" ? (
          <OrderHistory
            orders={orders}
            asks={(state.opsMessages || []).filter((m) => m.kind === "order")}
            onAsk={(o, topic) => {
              const what = o.items.length === 1 ? o.items[0].name : `${o.items[0]?.name || "물품"} 외 ${o.items.length - 1}건`;
              dispatch({
                type: "addOpsMessage",
                payload: { from: `보호자 ${auth.user?.name || "보호자"}`, role: "guardian", kind: "order", orderId: o.id, topic, text: `스토어 주문 ${topic} 문의 — ${what} (${new Date(o.at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })} 주문)` },
              });
              dispatch({ type: "pushEvent", payload: { kind: "주문", text: `보호자 스토어 주문 ${topic} 문의 — ${what}`, color: "#8FA9CC" } });
            }}
          />
        ) : (
          <>
            {/* 안전진단 연동 — 컨시어지 첫 방문 진단과 연결 (실무자 요청). 담겨 있으면 그렇다고 먼저 말한다 */}
            <div className="ds-r flex items-center gap-2.5 rounded-[20px] px-4 py-3" style={{ "--d": "40ms", background: TONE.green.bg }}>
              <Clay name="shieldGreen" size={34} className="flex-none" />
              <p className="text-[14px] font-bold leading-[1.55]" style={{ color: TONE.green.fg }}>
                {safetyCart.length > 0 ? (
                  <>
                    첫 방문 홈 안전진단에서 &lsquo;아니오&rsquo;가 나온 항목의 용품 {safetyCart.length}개를 담아 두었어요. 빼셔도 됩니다 — 필요한 것만 결제하세요.
                  </>
                ) : (
                  active?.note
                )}
              </p>
            </div>

            {/* 상품 칸 — 2열 */}
            <ul className="ds-g2 ds-r m-0 list-none p-0" style={{ "--d": "80ms" }} aria-label={active?.name}>
              {all.map((i) => {
                const on = !!sel[i.id];
                const off = !i.price; // 가격 확정 전 — 담기지 않는다
                const look = GOODS_LOOK[i.id] || { tone: "stone", clay: null };
                const tn = TONE[look.tone];
                const img = images[i.id];
                return (
                  <li key={i.id} className="relative flex flex-col gap-2 rounded-[24px] bg-white p-3" style={{ boxShadow: "0 4px 0 #E6E2DA" }}>
                    {safetyPick.has(i.id) && (
                      <span className="absolute left-[18px] top-[18px] z-[1] rounded-full px-[9px] py-[3px] text-[12px] font-extrabold text-white" style={{ background: TONE.gold.fg }}>
                        선생님 제안
                      </span>
                    )}
                    <button type="button" onClick={() => setDetail(i)} aria-label={`${i.name} 상품 정보 보기`} className="ds-tap flex flex-1 flex-col gap-2 text-left">
                      <span className="relative flex h-24 w-full items-center justify-center overflow-hidden rounded-[18px]" style={{ background: tn.bg }}>
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" />
                        ) : look.clay ? (
                          <Clay name={look.clay} size={60} className="ds-ico" />
                        ) : (
                          <span className="text-[12px] font-bold" style={{ color: "#5E6270" }}>
                            사진 준비 중
                          </span>
                        )}
                      </span>
                      <b className="text-[16px] font-extrabold leading-[1.3]">{i.name}</b>
                      <span className="ds-num text-[17px] font-black">{i.price ? fmtWon(i.price) : i.pending || "가격 확정 전"}</span>
                    </button>
                    <button
                      type="button"
                      disabled={off}
                      onClick={() => setDetail(i)}
                      aria-label={on ? `${i.name} — 담았어요 · 빼려면 상품 정보에서` : `${i.name} 담기 — 상품 정보를 먼저 봅니다`}
                      className="ds-press ds-btn3d flex h-11 items-center justify-center rounded-[14px] text-[15px] disabled:opacity-50"
                      style={on ? solid("green", 3) : { background: "#F3F1EC", boxShadow: "0 3px 0 #E3DED3", color: "#1B2340" }}
                    >
                      {on ? "담았어요 ✓" : "담기"}
                    </button>
                  </li>
                );
              })}
            </ul>

            <ProductSheet
              item={detail}
              image={detail ? images[detail.id] : null}
              category={active}
              selected={detail ? !!sel[detail.id] : false}
              onToggle={(it) => setSel((s) => ({ ...s, [it.id]: !s[it.id] }))}
              onClose={() => setDetail(null)}
            />

            {/* 결제 — 승인이 끝나야 주문이 선다. 완료 안내는 결제 결과 화면과 구매내역 조회가 맡는다. */}
            {items.length > 0 ? (
              <div className="ds-r ds-swap flex flex-col gap-2" style={{ "--d": "120ms" }}>
                <button
                  type="button"
                  onClick={payNow}
                  className="ds-press ds-btn3d flex h-[66px] w-full items-center gap-3 rounded-[22px] px-5 text-left text-white"
                  style={{ background: "#1B2340", boxShadow: "0 5px 0 #0E1428" }}
                >
                  <span className="flex h-8 min-w-[32px] flex-none items-center justify-center rounded-2xl px-2 text-[16px] font-black" style={{ background: TONE.gold.solid, color: "#1B2340" }}>
                    {items.length}
                  </span>
                  <span className="flex-1 text-[18px]">{fmtWon(total)} 결제하기</span>
                  <Line name="chevR" size={22} />
                </button>
                <p className="text-center text-[13px]" style={{ color: "#5E6270" }}>
                  배송비 무료 · 다음 안심방문 또는 택배로 배송됩니다
                </p>
              </div>
            ) : (
              <p className="ds-r text-center text-[14px]" style={{ "--d": "120ms", color: "#5E6270" }}>
                필요한 물건을 담으면 여기서 한 번에 결제해요
              </p>
            )}
            <p className="px-1 text-[13px] leading-[1.7]" style={{ color: "#5E6270" }}>
              {honor} 화면과 같은 물건들입니다. {honor}께서 담으신 물품은 결제권한에 따라 승인 요청으로 오고, 보호자 주문은 바로 결제됩니다.
            </p>
          </>
        )}
      </FamilyLayout>
    </>
  );
}

// 구매내역 조회 — 누가 · 어떤 경로로 · 무엇을 · 얼마에 샀는지.
// 결제된 주문은 기록이라 앱에서 고치거나 지우지 않는다 — 취소 · 반품은 문의로 관제에 보낸다 (2026-10-18 · 주문 취소는 관제 · 고객센터)
function OrderHistory({ orders, asks = [], onAsk }) {
  const [asking, setAsking] = useState(null); // 문의를 고르는 주문 id
  if (orders.length === 0)
    return (
      <Card tone="stone" shadow={false} pad={22} className="text-center text-[16px] font-bold" style={{ color: "#5E6270" }}>
        아직 구매내역이 없습니다.
      </Card>
    );

  return orders.map((o, k) => {
    const goods = o.items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
    const st = ORDER_STATUS[o.status] || ORDER_STATUS.preparing;
    return (
      <Card key={o.id} className="ds-r flex flex-col gap-3" style={{ "--d": `${40 + k * 30}ms` }}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="ds-num text-[15px] font-extrabold">{new Date(o.at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}</div>
            <div className="truncate text-[13px]" style={{ color: "#5E6270" }}>
              {o.by} · {o.channel}
            </div>
          </div>
          <span className="flex-none rounded-full px-2.5 py-1 text-[13px] font-extrabold" style={st.style}>
            {st.label}
          </span>
        </div>
        <ul className="m-0 flex list-none flex-col gap-1.5 border-t p-0 pt-3" style={{ borderColor: "#F0ECE4" }}>
          {o.items.map((i) => (
            <li key={i.id} className="flex items-baseline gap-2 text-[15px]">
              <span className="min-w-0 flex-1 truncate">{i.name}</span>
              <span className="ds-num text-[13px]" style={{ color: "#5E6270" }}>
                ×{i.qty || 1}
              </span>
              <span className="ds-num font-extrabold">{fmtWon((i.price || 0) * (i.qty || 1))}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-baseline justify-between border-t pt-2.5" style={{ borderColor: "#F0ECE4" }}>
          <span className="text-[13px]" style={{ color: "#5E6270" }}>
            물품 {fmtWon(goods)} · {o.ship ? `배송 ${fmtWon(o.ship)}` : "배송 무료"}
          </span>
          <span className="ds-num text-[18px] font-black">{fmtWon(goods + (o.ship || 0))}</span>
        </div>
        {o.receipt && (
          <p className="rounded-[14px] px-3 py-2 text-[13px] leading-[1.6]" style={{ background: "#F3F1EC", color: "#5E6270" }}>
            구매대행 영수증 — {o.receipt}
          </p>
        )}
        {o.note && (
          <p className="text-[13px] leading-[1.6]" style={{ color: "#5E6270" }}>
            {o.note}
          </p>
        )}
        {(() => {
          const ask = asks.find((m) => m.orderId === o.id);
          if (ask)
            return (
              <p className="rounded-[14px] px-3 py-2 text-[13px] font-bold leading-[1.6]" style={{ background: TONE.blue.bg, color: TONE.blue.fg }}>
                {ask.topic || "취소 · 반품"} 문의함 · {ask.ackAt ? "관제 확인 — 연락드립니다" : "관제 확인 전"}
              </p>
            );
          if (!onAsk) return null;
          return asking === o.id ? (
            <div className="flex flex-col gap-2 rounded-[14px] p-3" style={{ background: "#F3F1EC" }}>
              <p className="text-[14px] leading-[1.6]">무엇을 문의할까요? 관제가 확인하고 연락드립니다 — 문의만으로 결제가 취소되지는 않습니다.</p>
              <div className="grid grid-cols-3 gap-2">
                {["취소", "반품", "교환"].map((t) => (
                  <Btn
                    key={t}
                    tone="navy"
                    h={44}
                    className="text-[15px]"
                    onClick={() => {
                      onAsk(o, t);
                      setAsking(null);
                    }}
                  >
                    {t}
                  </Btn>
                ))}
              </div>
              <WhiteBtn h={44} className="text-[15px]" onClick={() => setAsking(null)}>
                닫기
              </WhiteBtn>
            </div>
          ) : (
            <button type="button" onClick={() => setAsking(o.id)} className="min-h-[40px] self-start text-[14px] font-extrabold underline underline-offset-2" style={{ color: "#5E6270" }}>
              취소 · 반품 문의
            </button>
          );
        })()}
      </Card>
    );
  });
}
