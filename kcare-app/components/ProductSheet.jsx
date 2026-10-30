import { fmtWon } from "../lib/config";
import { Clay } from "./clay";
import { Pill, Sheet, SheetTitle, TONE, WhiteBtn, solid } from "./ds";

// 스토어 상품 상세 시트 — 상품을 누르면 바로 담기지 않고 먼저 이 시트가 열린다
// (2026-09-22 상담실장 확인: "상세설명이 안 들어가면 신고 대상" — 전자상거래법상
// 상품 정보 표시 없이 결제로 이어지면 안 된다). 담기는 이 시트 안에서만 한다.
//
// 지어내지 않는다: 카탈로그에 있는 것(이름 · 가격 · 배송비 · 용도 · 메모)만 채우고,
// 제조사 · 원산지 · 용량 · 소비기한 · 소비자상담 같은 고시 항목은 공급처 자료가 오면
// 채운다 (2026-09-11 결정 4번 "상품 가격과 이미지 파일 준비해서 따로 보내겠다").
// 그때까지는 "확인 중"으로 정직하게 두고, 그 상태를 화면에 그대로 말한다.
//
// 2026-10-15 시안 — 위에 상품 그림(분류 색 바탕), 이름 · 가격 · '배송비 없음', 상품 정보 카드, 큰 담기 버튼, 닫기.
// elder=true 면 어르신 규격(글자 17px 이상 · 버튼 높이 66px) 으로 커진다.

// 상품별 그림 · 색 (시안의 스토어 칸) — 공급처 사진이 오면 사진이 먼저다 (콘솔 업로드 state.productImages)
// 슬리퍼는 시안의 산호색 대신 금색 바탕 — 빨강 계열은 위험 신호 전용
export const GOODS_LOOK = {
  mat: { tone: "blue", clay: "goods_mat" },
  slippers: { tone: "gold", clay: "goods_slippers" },
  grabBar: { tone: "green", clay: "goods_grabBar" },
  sensorLight: { tone: "beige", clay: "goods_sensorLight" },
  magnifier: { tone: "purple", clay: "goods_magnifier" },
  swivel: { tone: "blue", clay: "goods_swivel" },
};

// 전자상거래법 표시·광고 고시(2020) 중 소비자에게 보여야 하는 항목 — 카탈로그 필드가
// 있으면 그 값을, 없으면 '확인 중'. 분류별로 항목이 조금 다르다.
const DISCLOSURE = {
  vitamin: [
    ["식품의 유형", "type"],
    ["제조사 · 수입자", "maker"],
    ["원산지", "origin"],
    ["용량 · 수량", "volume"],
    ["소비기한", "expiry"],
    ["보관 방법", "storage"],
    ["소비자상담", "contact"],
  ],
  daily: [
    ["제조사 · 수입자", "maker"],
    ["원산지", "origin"],
    ["용량 · 규격", "volume"],
    ["사용기한", "expiry"],
    ["주의사항", "caution"],
    ["소비자상담", "contact"],
  ],
  safety: [
    ["제조사 · 수입자", "maker"],
    ["원산지", "origin"],
    ["규격 · 재질", "volume"],
    ["설치 · 사용 방법", "usage"],
    ["주의사항", "caution"],
    ["소비자상담", "contact"],
  ],
};

export default function ProductSheet({ item, image, category, selected = false, onToggle, onClose, elder = false }) {
  if (!item) return null;
  const catId = category?.id || "daily";
  const rows = DISCLOSURE[catId] || DISCLOSURE.daily;
  const canBuy = !!item.price;
  const look = GOODS_LOOK[item.id] || { tone: "stone", clay: null };
  const tn = TONE[look.tone];
  const body = elder ? "text-[17px] leading-[1.6]" : "text-[14px] leading-[1.7]";
  const small = elder ? "text-[15px]" : "text-[12.5px]";

  return (
    <Sheet onClose={onClose} label={`${item.name} 상품 정보`}>
      {/* 사진 — 공급처 사진이 없으면 상품 그림 */}
      <div className="relative flex h-[150px] flex-none items-center justify-center overflow-hidden rounded-[22px]" style={{ background: tn.bg }}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={`${item.name} 사진`} className="absolute inset-0 h-full w-full object-cover" />
        ) : look.clay ? (
          <Clay name={look.clay} size={96} />
        ) : (
          <span className={`rounded-full bg-white/80 px-4 py-2 font-bold ${small}`} style={{ color: "#5E6270" }}>
            사진 준비 중 — 공급처 이미지 수령 후 표시
          </span>
        )}
      </div>

      <SheetTitle sub={category?.name || "스토어"} title={item.name} />
      {item.note && <p className={`-mt-1.5 ${body}`} style={{ color: "#5E6270" }}>{item.note}</p>}
      <div className="flex flex-wrap items-center gap-2.5">
        {canBuy ? (
          <>
            <span className={`ds-num font-black ${elder ? "text-[24px]" : "text-[21px]"}`}>{fmtWon(item.price)}</span>
            <Pill bg={TONE.green.bg} fg="#2A4D33">
              {item.ship ? `배송비 ${fmtWon(item.ship)}` : "배송비 없음"}
            </Pill>
          </>
        ) : (
          <span className={`font-bold ${elder ? "text-[18px]" : "text-[15px]"}`} style={{ color: TONE.gold.fg }}>
            {item.pending || "가격 확정 전"} — 아직 담을 수 없습니다
          </span>
        )}
      </div>

      {/* 어떤 물건인가 — 카탈로그에 있는 용도만 */}
      <div className="rounded-[20px] px-4 py-3.5" style={{ background: tn.bg }}>
        <div className={`font-extrabold ${elder ? "text-[16px]" : "text-[13px]"}`} style={{ color: tn.fg }}>
          어떤 물건인가요
        </div>
        <p className={`mt-1 ${body}`}>{item.effect || item.desc || "상세 설명은 공급처 자료를 받은 뒤 표시됩니다."}</p>
        {catId === "vitamin" && (
          <p className={`mt-2 ${small} leading-[1.6]`} style={{ color: "#5E6270" }}>
            건강기능식품은 질병의 예방 및 치료를 위한 의약품이 아닙니다. 복용 중인 약이 있으면 의사·약사와 상의하세요.
          </p>
        )}
      </div>

      {/* 상품 정보 고시 — 없는 값은 확인 중 */}
      <div>
        <div className={`font-extrabold ${elder ? "text-[16px]" : "text-[13px]"}`}>상품 정보</div>
        <dl className="mt-1.5 rounded-[20px] bg-white px-4 py-1" style={{ boxShadow: "0 3px 0 #E6E2DA" }}>
          {rows.map(([k, field], i) => {
            const v = item[field];
            return (
              <div key={k} className="flex items-baseline justify-between gap-3 py-3" style={i ? { borderTop: "1px solid #F0ECE4" } : undefined}>
                <dt className={`flex-none font-bold ${elder ? "text-[16px]" : "text-[13px]"}`}>{k}</dt>
                <dd className={`min-w-0 text-right ${elder ? "text-[15px]" : "text-[13px]"}`} style={{ color: v ? "#1B2340" : "#5E6270" }}>
                  {v || "확인 중"}
                </dd>
              </div>
            );
          })}
        </dl>
        <p className={`mt-1.5 ${small} leading-[1.6]`} style={{ color: "#5E6270" }}>
          &lsquo;확인 중&rsquo;인 항목은 공급처 자료를 받는 대로 채웁니다. 교환·환불·배송 안내도 같이 표시됩니다.
        </p>
      </div>

      {/* 담기 — 상세를 본 뒤에만 */}
      {canBuy ? (
        <button
          type="button"
          onClick={() => {
            onToggle?.(item);
            onClose?.();
          }}
          className={`ds-press ds-btn3d flex w-full items-center justify-center gap-2 ${elder ? "min-h-[66px] rounded-[22px] text-[20px]" : "min-h-[56px] rounded-[18px] text-[16px]"}`}
          style={selected ? solid("green", 5) : solid("navy", 5)}
        >
          {selected ? "담았어요 ✓ · 빼기" : "장바구니에 담기"}
        </button>
      ) : (
        <p className={`text-center font-bold ${elder ? "text-[17px]" : "text-[13px]"}`} style={{ color: "#5E6270" }}>
          가격이 확정되면 담을 수 있습니다.
        </p>
      )}
      <WhiteBtn h={elder ? 56 : 50} className={elder ? "text-[18px]" : "text-[15px]"} onClick={onClose}>
        닫기
      </WhiteBtn>
    </Sheet>
  );
}
