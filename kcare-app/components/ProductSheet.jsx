import Icon from "./icons";
import { fmtWon } from "../lib/config";

// 스토어 상품 상세 시트 — 상품을 누르면 바로 담기지 않고 먼저 이 시트가 열린다
// (2026-09-22 상담실장 확인: "상세설명이 안 들어가면 신고 대상" — 전자상거래법상
// 상품 정보 표시 없이 결제로 이어지면 안 된다). 담기는 이 시트 안에서만 한다.
//
// 지어내지 않는다: 카탈로그에 있는 것(이름 · 가격 · 배송비 · 용도 · 메모)만 채우고,
// 제조사 · 원산지 · 용량 · 소비기한 · 소비자상담 같은 고시 항목은 공급처 자료가 오면
// 채운다 (2026-09-11 결정 4번 "상품 가격과 이미지 파일 준비해서 따로 보내겠다").
// 그때까지는 "확인 중"으로 정직하게 두고, 그 상태를 화면에 그대로 말한다.
//
// elder=true 면 어르신 규격(글자 19px 이상 · 버튼 높이 64px) 으로 커진다.

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
  const body = elder ? "text-[19px] leading-[1.55]" : "text-[14px] leading-[1.7]";
  const small = elder ? "text-[17px]" : "text-[12.5px]";
  const label = elder ? "text-[17px]" : "text-[12px]";

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center bg-navy/45 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${item.name} 상품 정보`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-[520px] flex-col overflow-hidden rounded-t-[24px] bg-white sm:rounded-[24px]"
      >
        {/* 머리 — 분류 · 닫기 */}
        <div className="flex items-center justify-between gap-3 border-b border-navy/[.08] px-5 py-3.5">
          <span className={`font-bold text-muted ${label}`}>{category?.name || "스토어"} · 상품 정보</span>
          <button
            onClick={onClose}
            aria-label="닫기"
            className={`btn-press rounded-full px-4 font-bold text-navy ${elder ? "py-[12px] text-[17px]" : "py-2 text-[13px]"}`}
            style={{ background: "rgba(10,31,60,.07)" }}
          >
            닫기
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-4">
          {/* 사진 */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[18px] bg-[#EDF1EA]">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={`${item.name} 사진`} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className={`rounded-full bg-white/80 px-4 py-2 font-bold text-navy/45 ${elder ? "text-[17px]" : "text-[12px]"}`}>
                  사진 준비 중 — 공급처 이미지 수령 후 표시
                </span>
              </span>
            )}
          </div>

          {/* 이름 · 가격 */}
          <h3 className={`mt-4 font-bold text-ink ${elder ? "text-[24px] leading-[1.35]" : "text-[19px] leading-[1.4]"}`}>{item.name}</h3>
          {item.note && <p className={`mt-1 text-muted ${body}`}>{item.note}</p>}
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {canBuy ? (
              <>
                <span className={`font-num font-bold text-navy ${elder ? "text-[28px]" : "text-[22px]"}`}>{fmtWon(item.price)}</span>
                <span className={`font-num text-muted ${small}`}>배송비 {item.ship ? fmtWon(item.ship) : "무료"}</span>
              </>
            ) : (
              <span className={`font-bold text-amber ${elder ? "text-[20px]" : "text-[15px]"}`}>{item.pending || "가격 확정 전"} — 아직 담을 수 없습니다</span>
            )}
          </div>

          {/* 어떤 물건인가 — 카탈로그에 있는 용도만 */}
          <section className="mt-4 rounded-[16px] bg-navy/[.04] px-4 py-3.5">
            <div className={`font-bold text-navy ${label}`}>어떤 물건인가요</div>
            <p className={`mt-1 text-ink ${body}`}>
              {item.effect || item.desc || "상세 설명은 공급처 자료를 받은 뒤 표시됩니다."}
            </p>
            {catId === "vitamin" && (
              <p className={`mt-2 text-muted ${small} leading-[1.6]`}>
                건강기능식품은 질병의 예방 및 치료를 위한 의약품이 아닙니다. 복용 중인 약이 있으면 의사·약사와
                상의하세요.
              </p>
            )}
          </section>

          {/* 상품 정보 고시 — 없는 값은 확인 중 */}
          <section className="mt-3">
            <div className={`font-bold text-navy ${label}`}>상품 정보</div>
            <dl className="mt-1.5 divide-y divide-navy/[.07] rounded-[16px] border border-navy/[.08]">
              {rows.map(([k, field]) => {
                const v = item[field];
                return (
                  <div key={k} className="flex items-baseline gap-3 px-4 py-2.5">
                    <dt className={`w-[112px] shrink-0 text-muted ${small}`}>{k}</dt>
                    <dd className={`min-w-0 flex-1 ${elder ? "text-[17px]" : "text-[13px]"} ${v ? "text-ink" : "text-muted/80"}`}>{v || "확인 중"}</dd>
                  </div>
                );
              })}
            </dl>
            <p className={`mt-1.5 text-muted ${small} leading-[1.6]`}>
              &lsquo;확인 중&rsquo;인 항목은 공급처 자료를 받는 대로 채웁니다. 교환·환불·배송 안내도 같이 표시됩니다.
            </p>
          </section>
        </div>

        {/* 담기 — 상세를 본 뒤에만 */}
        <div className="border-t border-navy/[.08] px-5 py-3.5">
          {canBuy ? (
            <button
              onClick={() => {
                onToggle?.(item);
                onClose?.();
              }}
              className={`btn-press flex w-full items-center justify-center gap-2 rounded-[18px] font-bold text-white ${
                elder ? "py-[19px] text-[20px]" : "py-[14px] text-[15px]"
              }`}
              style={{ background: selected ? "#5C5A54" : "#1E7A5A" }}
            >
              <Icon name={selected ? "check" : "bag"} size={elder ? 24 : 18} strokeWidth={2} />
              {selected ? "담은 것 빼기" : "장바구니에 담기"}
            </button>
          ) : (
            <p className={`text-center font-bold text-muted ${elder ? "text-[18px]" : "text-[13px]"}`}>
              가격이 확정되면 담을 수 있습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
