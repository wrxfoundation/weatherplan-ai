/** 모두온 디자인 토큰 — design_handoff_moduon/README.md 확정 팔레트 기준 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // 트랙 A (소비자몰 · 파트너 랜딩)
        primary: '#5377D6',
        'primary-hover': '#4467C8',
        'primary-text': '#4F74D2',
        tint: '#EDF1FB',
        orange: '#F97B4C',
        'orange-text': '#F2662D',
        'orange-tint': '#FFF0E8',
        cream: '#F7F2EE',
        warm: '#F6F2EF',
        band: '#5176CE',
        ink: '#24272E',
        body: '#33363D',
        label: '#6A6F79',
        muted: '#878D99',
        faint: '#999EA8',
        disabled: '#ABB0BA',
        line: '#E9E2D8',
        'line-soft': '#EDE5DA',
        'line-card': '#F1ECE5',
        // 트랙 B (마이오피스 · 어드민)
        bbg: '#F4F6FA',
        bink: '#242B3D',
        bbody: '#5A6478',
        bmuted: '#8C93A5',
        bfaint: '#A9B1C0',
        bline: '#E8ECF3',
        brow: '#F1F4F9',
        bindigo: '#7D8EE8',
        // 시맨틱
        ok: '#17B26A',
        warn: '#F79009',
        danger: '#F04438',
        // 리드 상태 6단계
        'st-new': '#5377D6',
        'st-wait': '#8B7BFF',
        'st-done': '#E255A1',
        'st-install': '#F79009',
        'st-complete': '#17B26A',
        'st-cancel': '#F04438',
      },
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', '-apple-system', 'Apple SD Gothic Neo', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 20px rgba(36,39,46,0.04)',
        bcard: '0 4px 16px rgba(36,43,61,0.05)',
        panel: '0 16px 44px rgba(83,119,214,0.14)',
        cta: '0 8px 20px rgba(83,119,214,0.3)',
        bottombar: '0 -8px 28px rgba(36,39,46,0.1)',
      },
      borderRadius: {
        card: '20px',
        section: '24px',
        btn: '14px',
        field: '12px',
      },
      keyframes: {
        livePulse: { '50%': { opacity: '0.3' } },
        riseIn: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        rowFlash: { from: { backgroundColor: 'rgba(83,119,214,0.14)' }, to: { backgroundColor: 'transparent' } },
      },
      animation: {
        live: 'livePulse 1.6s ease-in-out infinite',
        rise: 'riseIn .2s ease-out both',
        rowflash: 'rowFlash 1.5s ease-out both',
      },
    },
  },
  plugins: [],
}
