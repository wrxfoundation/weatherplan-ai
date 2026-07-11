import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: Vercel(루트 '/') 기본, GitHub Pages 하위경로 배포 시 VITE_BASE=/map/ 주입
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  // 상위 디렉터리(weatherplan-ai)의 tailwind postcss.config.js 상속 차단
  css: { postcss: { plugins: [] } },
})
