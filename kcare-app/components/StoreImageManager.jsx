import { useRef, useState } from "react";
import Icon from "./icons";
import { STORE_CATALOG } from "../lib/store";
import { useAppState } from "../lib/state";

// 스토어 썸네일 관리 — 경영 콘솔 '가격 · 상품' 탭에서 쓴다 (실무자 요청:
// 어드민에서 올리면 프론트 이미지가 바뀌게).
//
// 여기서 올린 이미지는 state.productImages 로 들어가 보호자 스토어 썸네일에
// 즉시 반영된다. 데모라 서버가 없어 localStorage 에 저장하는데 한도가 5MB 라,
// 올린 파일을 320px JPEG 로 줄여서 담는다 — 썸네일 용도로는 충분하고,
// 원본을 그대로 담으면 사진 몇 장에 저장소가 차서 상태 전체가 날아간다.

const FLAT = STORE_CATALOG.flatMap((c) =>
  c.groups.flatMap((g) => g.items.map((i) => ({ ...i, cat: c.name, catIcon: c.icon })))
);

function shrink(file, maxSide, cb) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      cb(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

export default function StoreImageManager() {
  const { state, dispatch } = useAppState();
  const images = state.productImages || {};
  const [q, setQ] = useState("");
  const [savedId, setSavedId] = useState(null);
  const fileRef = useRef(null);
  const targetRef = useRef(null); // 파일 선택 대화상자가 열려 있는 동안의 대상 상품

  const list = FLAT.filter((i) => !q.trim() || i.name.includes(q.trim()) || i.cat.includes(q.trim()));
  const uploaded = Object.keys(images).length;

  const pick = (id) => {
    targetRef.current = id;
    fileRef.current?.click();
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    const id = targetRef.current;
    e.target.value = ""; // 같은 파일 재선택도 change 로 잡히게
    if (!f || !id) return;
    shrink(f, 320, (dataUrl) => {
      dispatch({ type: "setProductImage", id, dataUrl });
      dispatch({
        type: "pushEvent",
        payload: { kind: "스토어", text: `상품 썸네일 등록 — ${FLAT.find((x) => x.id === id)?.name}`, color: "#B08D57" },
      });
      setSavedId(id);
      setTimeout(() => setSavedId(null), 1800);
    });
  };

  return (
    <div className="min-w-0 rounded-2xl border border-navy/[.08] bg-white/60 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[15px] font-bold text-navy">스토어 썸네일 관리</span>
        <span className="rounded-full bg-green/10 px-2 py-0.5 text-[10px] font-bold text-green">
          프론트 즉시 반영
        </span>
        <span className="ml-auto font-num text-[12px] text-muted">
          이미지 {uploaded} / {FLAT.length}
        </span>
      </div>
      <p className="mt-1 text-[12px] leading-[1.65] text-muted">
        여기서 올린 이미지가 보호자 스토어의 상품 썸네일로 바로 바뀝니다. 이미지가 없는
        상품은 카테고리 아이콘으로 나갑니다. 업로드 시 320px 로 줄여 저장합니다 (데모 —
        실서비스에서는 서버 저장).
      </p>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} aria-label="상품 이미지 파일" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="상품 · 카테고리 검색"
        className="mt-3 w-full rounded-xl border border-navy/15 bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-gold"
      />
      <ul className="mt-2.5 max-h-[380px] space-y-1.5 overflow-y-auto pr-1">
        {list.map((i) => {
          const img = images[i.id];
          return (
            <li key={i.id} className="flex items-center gap-2.5 rounded-xl border border-navy/[.07] bg-white px-2.5 py-2">
              <span className="relative block h-[44px] w-[44px] shrink-0 overflow-hidden rounded-lg bg-[#EDF1EA]">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-navy/30">
                    <Icon name={i.catIcon} size={20} />
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-bold text-ink">{i.name}</span>
                <span className="block text-[11px] text-muted">
                  {i.cat}
                  {savedId === i.id && <b className="ml-1.5 text-green">✓ 반영됨</b>}
                </span>
              </span>
              <button
                onClick={() => pick(i.id)}
                className="btn-press btn-inline shrink-0 rounded-lg border border-navy/20 px-2.5 py-1.5 text-[12px] font-bold text-navy"
              >
                {img ? "교체" : "올리기"}
              </button>
              {img && (
                <button
                  onClick={() => dispatch({ type: "setProductImage", id: i.id, dataUrl: null })}
                  className="btn-press btn-inline shrink-0 rounded-lg border border-navy/12 px-2.5 py-1.5 text-[12px] font-bold text-muted"
                >
                  삭제
                </button>
              )}
            </li>
          );
        })}
        {list.length === 0 && (
          <li className="rounded-xl border border-navy/[.07] bg-white px-3 py-4 text-center text-[13px] text-muted">
            검색 결과가 없습니다
          </li>
        )}
      </ul>
    </div>
  );
}
