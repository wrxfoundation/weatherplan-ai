import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        {/* Pretendard 폰트는 globals.css에서 @import 처리됨 */}

        {/* Kakao SDK — 카카오톡 공유 기능용 */}
        {/* 사용 시 NEXT_PUBLIC_KAKAO_JS_KEY 환경변수 설정 후 _app.jsx에서 init 호출 권장 */}
        <script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
          integrity="sha384-DKYJZ8NLiK8MN4/C5P2dtSmLQ4KwPaoqAfyA/DfmEc1VDxu4yyC7wy6K1Hs90nka"
          crossOrigin="anonymous"
          async
        ></script>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== "undefined") {
                window.addEventListener("load", function () {
                  var key = "${process.env.NEXT_PUBLIC_KAKAO_JS_KEY || ""}";
                  if (key && window.Kakao && !window.Kakao.isInitialized()) {
                    try { window.Kakao.init(key); } catch (e) {}
                  }
                });
              }
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
