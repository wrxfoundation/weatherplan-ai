import { useEffect, useRef } from "react";

// 섹션 진입 연출 — 패널이 한꺼번에 튀어나오지 않고 시차를 두고 하나씩 들어온다.
// 순서는 화면상 위치로 정한다 (위 → 아래, 같은 줄이면 왼쪽 → 오른쪽).
// 방향은 패널이 놓인 쪽에서 — 왼쪽 패널은 왼쪽에서, 오른쪽 패널은 오른쪽에서 밀려 들어온다.
// DOM 순서가 아니라 실제 좌표로 계산하므로 grid가 몇 열로 접히든 순서가 맞는다.

const STEP = 70; // 패널 간 시차(ms)
const MAX = 12; // 이보다 뒤는 같은 지연 — 긴 화면에서 지연이 쌓이지 않게

export default function StaggerIn({ trigger, className = "", children }) {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const all = [...root.querySelectorAll("section")];
    // 중첩된 패널은 제외 — 바깥 패널이 들어올 때 같이 들어온다
    const panels = all.filter((el) => !all.some((o) => o !== el && o.contains(el)));
    if (!panels.length) return;

    const rootRect = root.getBoundingClientRect();
    // 애니메이션을 초기화한 뒤 리플로를 강제해야 같은 섹션을 다시 열 때도 재생된다
    panels.forEach((el) => {
      el.style.animation = "none";
    });
    void root.offsetWidth;

    panels
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .sort((a, b) => a.r.top - b.r.top || a.r.left - b.r.left)
      .forEach(({ el, r }, i) => {
        const isLeft = r.left + r.width / 2 < rootRect.left + rootRect.width / 2;
        el.style.setProperty("--dx", isLeft ? "-16px" : "16px");
        el.style.animation = "";
        el.style.animationDelay = `${Math.min(i, MAX) * STEP}ms`;
      });
  }, [trigger]);

  return (
    <div ref={ref} className={`stagger-in ${className}`}>
      {children}
    </div>
  );
}
