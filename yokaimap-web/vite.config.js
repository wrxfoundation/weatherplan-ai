import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 상위 디렉터리(모노리포 루트)의 postcss.config.js(tailwind)를 끌어오지 않도록 명시적으로 비운다.
  // 이 앱은 Tailwind를 쓰지 않고 토큰 CSS만 쓴다.
  css: { postcss: { plugins: [] } },
  build: {
    rollupOptions: {
      output: {
        // leaflet(+markercluster)은 지도 라우트에서만 쓰이므로 별도 청크로 분리
        manualChunks: { leaflet: ['leaflet', 'leaflet.markercluster'] },
      },
    },
  },
})
