import { useEffect, useState } from "react";
import Icon from "./icons";

// 맨 위로 — 우측 하단 고정. AI 버튼 바로 위에 쌓인다.
//
// 스크롤을 조금 내렸을 때는 뜨지 않는다. 화면 한 번 분량(대략 500px)을
// 지나야 나타나게 해서, 짧은 화면에서 버튼 두 개가 괜히 붙어 있지 않게 한다.
//
// 채팅 패널이 열리면 패널(z-1200)이 이 버튼(z-1100)을 덮는다 — 의도한 것이다.
// 대화 중에는 맨 위로 갈 일이 없고, 억지로 비켜 세우면 위치가 흔들려 보인다.

export default function ScrollTop({ threshold = 500 }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  const toTop = () => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button
      onClick={toTop}
      aria-label="맨 위로"
      // 안 보일 때는 pointer-events를 꺼야 투명한 버튼이 클릭을 가로채지 않는다
      className={`btn-press fixed bottom-[84px] right-5 z-[1100] flex h-[46px] w-[46px] items-center justify-center rounded-full border border-navy/12 bg-white/90 text-navy backdrop-blur transition-all duration-200 ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      }`}
      style={{ boxShadow: "0 8px 22px -10px rgba(10,31,60,.45)" }}
    >
      <Icon name="chev" size={19} className="-rotate-180" />
    </button>
  );
}
