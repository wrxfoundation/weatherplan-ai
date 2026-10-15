/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F4F6FB',
        panel: '#FFFFFF',
        line: '#E6EAF3',
        'line-soft': '#EFF2F8',
        ink: '#111C33',
        body: '#3D4A63',
        mute: '#8593AB',
        navy: '#3E6FE0',
        'navy-deep': '#2B54B8',
        'navy-soft': '#EBF1FD',
        'navy-tint': '#F5F8FE',
        amber: '#E0A63E',
        'amber-soft': '#FDF4E3',
        ok: '#2FA870',
        'ok-soft': '#E7F6EF',
        bad: '#E0574F',
        'bad-soft': '#FCEDEC',
        warn: '#E08A2E',
        'warn-soft': '#FDF2E4',
      },
      fontFamily: {
        sans: ['"Pretendard Variable"', 'Pretendard', '-apple-system', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // 타이포 위계 (Pretendard 단일 서체, 크기·굵기로만 위계)
        display: ['26px', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' }], // KPI 대형 수치
        h1: ['22px', { lineHeight: '1.3', fontWeight: '700', letterSpacing: '-0.01em' }],       // 페이지 타이틀
        h2: ['16px', { lineHeight: '1.4', fontWeight: '700', letterSpacing: '-0.01em' }],       // 카드/섹션 타이틀
        h3: ['14px', { lineHeight: '1.4', fontWeight: '600' }],                                  // 서브섹션
        base: ['13.5px', { lineHeight: '1.55', fontWeight: '400' }],                             // 본문
        label: ['13px', { lineHeight: '1.4', fontWeight: '500' }],                               // 지표 라벨·테이블 셀
        meta: ['12px', { lineHeight: '1.4', fontWeight: '400' }],                                // 보조 메타
        tiny: ['11px', { lineHeight: '1.35', fontWeight: '500' }],                               // 칩·태그
      },
      boxShadow: {
        card: '0 1px 2px rgba(17,28,51,0.04), 0 4px 14px rgba(17,28,51,0.04)',
        pop: '0 8px 28px rgba(17,28,51,0.14)',
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
}
