import { Suspense, lazy, ReactNode } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/app/Layout'
import { ModeProvider } from '@/app/ModeProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Placeholder } from '@/modules/Placeholder'

// 모듈 lazy 로딩 — 첫 화면 FCP 단축 (PRD §10 코드 스플릿)
const DashboardPage = lazy(() => import('@/modules/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const M1Page = lazy(() => import('@/modules/m1/M1Page').then(m => ({ default: m.M1Page })))
const M2Page = lazy(() => import('@/modules/m2/M2Page').then(m => ({ default: m.M2Page })))
const M3Page = lazy(() => import('@/modules/m3/M3Page').then(m => ({ default: m.M3Page })))
const M4Page = lazy(() => import('@/modules/m4/M4Page').then(m => ({ default: m.M4Page })))
const M5Page = lazy(() => import('@/modules/m5/M5Page').then(m => ({ default: m.M5Page })))
const M6Page = lazy(() => import('@/modules/m6/M6Page').then(m => ({ default: m.M6Page })))
const M7Page = lazy(() => import('@/modules/m7/M7Page').then(m => ({ default: m.M7Page })))
const M8Page = lazy(() => import('@/modules/m8/M8Page').then(m => ({ default: m.M8Page })))

const modulePages: [string, string, ReactNode][] = [
  ['/', '대시보드', <DashboardPage />],
  ['/m1', 'M1 활성 지갑', <M1Page />],
  ['/m2', 'M2 정산 지수', <M2Page />],
  ['/m3', 'M3 결제/정산', <M3Page />],
  ['/m4', 'M4 DePIN 보상', <M4Page />],
  ['/m5', 'M5 재무 현황', <M5Page />],
  ['/m6', 'M6 파트너 정산', <M6Page />],
  ['/m7', 'M7 소셜 & 미디어', <M7Page />],
  ['/m8', 'M8 토큰 홀더', <M8Page />],
]

const placeholders: [string, string, string][] = [
  ['/m9', 'M9 리포트 & 알림', '리포트·알림 모듈'],
  ['/settings/modes', '모듈 모드 관리', 'DEMO/LIVE 모듈별 전환 설정'],
  ['/settings/wallets', '지갑 레지스트리', '지갑 주소·라벨·종류 관리'],
  ['/settings/alerts', '알림 규칙', '알림 규칙 편집'],
  ['/settings/users', '사용자 관리', '이메일 allowlist·역할 관리'],
  ['/settings/audit', '감사 로그', '운영 액션 감사 이력'],
]

function PageFallback() {
  return (
    <div className="grid min-h-[360px] place-items-center text-meta text-mute">
      <span className="flex items-center gap-2">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line border-t-navy" />
        불러오는 중…
      </span>
    </div>
  )
}

export default function App() {
  return (
    <ModeProvider>
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              {modulePages.map(([path, label, el]) => (
                <Route key={path} path={path} element={<ErrorBoundary label={label}>{el}</ErrorBoundary>} />
              ))}
              {placeholders.map(([path, title, desc]) => (
                <Route key={path} path={path} element={<Placeholder title={title} description={desc} />} />
              ))}
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </ModeProvider>
  )
}
