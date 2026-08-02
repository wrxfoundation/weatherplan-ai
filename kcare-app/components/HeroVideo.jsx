import { useEffect, useRef, useState } from "react";

// 히어로 배경 루프 영상 — 장식 전용.
//
// 왜 클라이언트에서만 붙이는가:
//   서버 HTML에는 영상 태그가 없다. 첫 화면은 CSS의 정지 이미지(::before)가 그리고,
//   영상은 하이드레이션이 끝난 뒤에 얹힌다. 그래서 LCP는 60KB 이미지가 잡고
//   1MB짜리 영상이 첫 페인트 경로에 끼어들지 않는다.
//
// 영상을 아예 안 받는 경우 — 이때는 정지 이미지가 그대로 남는다:
//   · 모션 최소화 설정 (prefers-reduced-motion)
//   · 데이터 절약 모드 (saveData)
//   · 2G급 회선
// 배경 장식 하나에 사용자의 데이터·배터리를 쓰지 않는다.
//
// 자동재생이 거부돼도(iOS 저전력 모드 등) 화면은 비지 않는다 — poster가
// ::before와 같은 파일이고, 그 파일이 곧 영상의 0번 프레임이라 어느 쪽으로
// 굴러가든 같은 그림이 보인다.

export default function HeroVideo() {
  const [on, setOn] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const c = navigator.connection;
    const slow = c?.saveData === true || /^(slow-)?2g$/.test(c?.effectiveType || "");
    if (!reduce && !slow) setOn(true);
  }, []);

  // 화면 밖으로 나가면 세운다 — 안 보이는 영상을 계속 디코딩하면
  // 노트북 팬이 돌고 모바일에서는 배터리가 눈에 띄게 준다.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) el.play?.().catch(() => {});
        else el.pause?.();
      },
      { threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [on]);

  if (!on) return null;

  return (
    <video
      ref={ref}
      className="hero-vid"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster="/hero/home.webp"
      aria-hidden="true"
      tabIndex={-1}
      disablePictureInPicture
    >
      {/* VP9가 먼저 — 같은 화질에서 H.264의 40% 크기다. Safari는 아래 mp4로 내려간다. */}
      <source src="/hero/loop.webm" type="video/webm" />
      <source src="/hero/loop.mp4" type="video/mp4" />
    </video>
  );
}
