/** @type {import('tailwindcss').Config} */
// 디자인 토큰 출처: docs/kcare/design-handoff/05-design-tokens.md · repo-CLAUDE.md
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#0A1F3C",
        gold: "#B08D57",
        "gold-soft": "#C9A46B",
        danger: "#C0392B",
        green: "#1E7A5A",
        paper: "#F1EFE8",
        dark: "#0E1B2E",
        nav: "#08172D",
        elder: "#FDFCF9",
        ink: "#40413F",
        muted: "#5C5A54",
        amber: "#8A5D12",
      },
      fontFamily: {
        sans: [
          "Noto Sans KR",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Apple SD Gothic Neo",
          "Malgun Gothic",
          "sans-serif",
        ],
        num: ["Montserrat", "Noto Sans KR", "sans-serif"],
        // 펜 흘림체 — 히어로 아이브로우 한 줄에만 쓴다.
        // 굵기가 400 하나뿐이라 font-bold 를 걸면 브라우저가 가짜 굵기를
        // 합성해 획이 뭉개진다. 굵기를 지정하지 말 것.
        pen: ["Nanum Pen Script", "Pen Fallback", "Noto Sans KR", "cursive"],
      },
      borderRadius: {
        card: "18px",
      },
      keyframes: {
        sosPulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(192,57,43,.5)" },
          "50%": { boxShadow: "0 0 0 20px rgba(192,57,43,0)" },
        },
        livePing: {
          "0%, 100%": { opacity: ".35" },
          "50%": { opacity: "1" },
        },
        escalateGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(192,57,43,.55)" },
          "50%": { boxShadow: "0 0 14px 5px rgba(192,57,43,.45)" },
        },
        tickIn: {
          from: { opacity: "0", transform: "translateY(-6px)" },
          to: { opacity: "1", transform: "none" },
        },
      },
      animation: {
        sosPulse: "sosPulse 1.8s infinite",
        livePing: "livePing 1.6s ease-in-out infinite",
        escalateGlow: "escalateGlow 2.2s ease-in-out infinite",
        tickIn: "tickIn .28s ease both",
      },
    },
  },
  plugins: [],
};
