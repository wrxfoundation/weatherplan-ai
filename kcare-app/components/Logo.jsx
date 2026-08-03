// K-CARE 로고 — 파일이 있으면 이미지, 없으면 글자.
//
// 쓰는 법: public/brand/ 에 로고 파일을 넣고 다시 빌드하면 끝이다.
// 스위치를 만질 필요가 없다 (next.config.js 가 빌드 시점에 파일 존재를 확인해
// NEXT_PUBLIC_BRAND_LOGO 로 넘겨준다). 자세한 규격은 public/brand/README.md.
//
// 파일이 없을 때 글자로 떨어지는 이유: 없는 파일을 <img> 로 걸면 화면마다
// 깨진 이미지 아이콘과 콘솔 404 가 남는다. 지금은 그런 흔적이 전혀 없다.
//
// 색: 로고가 남색 단색이라 어두운 배경(사이드바)에서는 그대로 두면 안 보인다.
// tone="onDark" 를 주면 흰색으로 반전한다 — 원본이 단색일 때만 맞는 처리라
// 컬러 로고를 넣는다면 밝은 배경용 파일과 어두운 배경용 파일을 따로 둬야 한다.

const SRC = process.env.NEXT_PUBLIC_BRAND_LOGO || "";

export default function Logo({
  height = 22,
  tone = "onLight", // onLight | onDark
  beta = false,
  className = "",
}) {
  const betaMark = beta && (
    <span className={`align-top text-[9px] font-bold ${tone === "onDark" ? "text-gold" : "text-gold"}`}>
      BETA
    </span>
  );

  if (!SRC) {
    // 글자 폴백 — 지금까지 쓰던 모양 그대로
    return (
      <span
        className={`whitespace-nowrap font-num font-bold tracking-[.16em] ${
          tone === "onDark" ? "text-white" : "text-navy"
        } ${className}`}
        style={{ fontSize: Math.round(height * 0.78) }}
      >
        K-CARE {betaMark}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {/* next/image 를 쓰지 않는 것은 이 프로젝트의 결정이다 — 이미지 최적화
          엔드포인트를 열지 않으려고 next.config.js 에서 unoptimized 로 두었다.
          로고는 수 KB 라 최적화 이득도 없다. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={SRC}
        alt="K-CARE"
        style={{ height, width: "auto" }}
        className={tone === "onDark" ? "brightness-0 invert" : ""}
        draggable={false}
      />
      {betaMark}
    </span>
  );
}
