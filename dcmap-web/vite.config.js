import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 상위 디렉터리(weatherplan-ai)의 tailwind postcss.config.js 상속 차단
  css: { postcss: { plugins: [] } },
})
