// K-CARE 로고 — 파일이 있으면 이미지, 없으면 글자.
//
// 쓰는 법: public/brand/ 에 로고 파일을 넣고 다시 빌드하면 끝이다.
// 스위치를 만질 필요가 없다 (next.config.js 가 빌드 시점에 파일 존재를 확인해
// NEXT_PUBLIC_BRAND_LOGO 로 넘겨준다). 자세한 규격은 public/brand/README.md.
//
// 파일이 없을 때 글자로 떨어지는 이유: 없는 파일을 <img> 로 걸면 화면마다
// 깨진 이미지 아이콘과 콘솔 404 가 남는다. 지금은 그런 흔적이 전혀 없다.
//
// 어두운 배경: logo-dark 파일이 있으면 그걸 쓰고, 없으면 밝은 배경용을
// brightness(0) invert 로 반전한다. 반전은 단색 로고에만 맞는 처리다 —
// K-CARE 로고는 진한 파랑/밝은 파랑 2색이라 반전하면 두 색이 같은 흰색이
// 되어 심볼(◁C)이 한 덩어리로 뭉친다. 그래서 어두운 배경용 파일을 따로 뒀다.

const SRC = process.env.NEXT_PUBLIC_BRAND_LOGO || "";
const SRC_DARK = process.env.NEXT_PUBLIC_BRAND_LOGO_DARK || "";

// 글자 폴백의 크기 비율. height 는 이미지 로고의 상자 높이인데, 로고 안에서
// K-CARE 워드마크가 차지하는 세로 비중이 약 49% 다. 글자로 떨어졌을 때 그
// 워드마크와 비슷한 덩치로 보이게 맞춘 값 (Montserrat 캡 높이 기준).
const TEXT_RATIO = 0.55;

export default function Logo({
  height = 32,
  tone = "onLight", // onLight | onDark
  beta = false,
  className = "",
}) {
  const dark = tone === "onDark";
  const betaMark = beta && (
    <span className="align-top text-[9px] font-bold text-gold">BETA</span>
  );

  if (!SRC) {
    // 글자 폴백 — 로고 파일을 넣기 전 모양
    return (
      <span
        className={`whitespace-nowrap font-num font-bold tracking-[.16em] ${
          dark ? "text-white" : "text-navy"
        } ${className}`}
        style={{ fontSize: Math.round(height * TEXT_RATIO) }}
      >
        K-CARE {betaMark}
      </span>
    );
  }

  const src = dark && SRC_DARK ? SRC_DARK : SRC;
  const invert = dark && !SRC_DARK;

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {/* next/image 를 쓰지 않는 것은 이 프로젝트의 결정이다 — 이미지 최적화
          엔드포인트를 열지 않으려고 next.config.js 에서 unoptimized 로 두었다.
          로고는 수 KB 라 최적화 이득도 없다. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="K-CARE"
        style={{ height, width: "auto" }}
        className={invert ? "brightness-0 invert" : ""}
        draggable={false}
      />
      {betaMark}
    </span>
  );
}
