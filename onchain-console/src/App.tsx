import { Suspense, lazy, ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/app/Layout'
import { SHOW_ONCHAIN, HOME_PATH } from '@/app/nav'
import { ModeProvider } from '@/app/ModeProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'

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
const M9Page = lazy(() => import('@/modules/m9/M9Page').then(m => ({ default: m.M9Page })))
const ModesPage = lazy(() => import('@/modules/settings/ModesPage').then(m => ({ default: m.ModesPage })))
const RegistryPage = lazy(() => import('@/modules/settings/RegistryPage').then(m => ({ default: m.RegistryPage })))
const AlertRulesPage = lazy(() => import('@/modules/settings/AlertRulesPage').then(m => ({ default: m.AlertRulesPage })))
const UsersPage = lazy(() => import('@/modules/settings/UsersPage').then(m => ({ default: m.UsersPage })))
const AuditPage = lazy(() => import('@/modules/settings/AuditPage').then(m => ({ default: m.AuditPage })))
const TransparencyPage = lazy(() => import('@/modules/pages/TransparencyPage').then(m => ({ default: m.TransparencyPage })))
const MethodologyPage = lazy(() => import('@/modules/pages/MethodologyPage').then(m => ({ default: m.MethodologyPage })))
const CommunityPage = lazy(() => import('@/modules/community/CommunityPage').then(m => ({ default: m.CommunityPage })))
const PreorderPage = lazy(() => import('@/modules/community/PreorderPage').then(m => ({ default: m.PreorderPage })))
const ContentPage = lazy(() => import('@/modules/community/ContentPage').then(m => ({ default: m.ContentPage })))

// 온체인 감춤 모드에서도 라우트는 유지(URL 직접 접근·기존 링크 보존). 사이드바에서만 감춘다.
const modulePages: [string, string, ReactNode][] = [
  ...(SHOW_ONCHAIN ? ([['/', '대시보드', <DashboardPage />]] as [string, string, ReactNode][]) : []),
  ['/m1', 'M1 활성 지갑', <M1Page />],
  ['/m2', 'M2 정산 지수', <M2Page />],
  ['/m3', 'M3 결제/정산', <M3Page />],
  ['/m4', 'M4 DePIN 보상', <M4Page />],
  ['/m5', 'M5 재무 현황', <M5Page />],
  ['/m6', 'M6 파트너 정산', <M6Page />],
  ['/m7', 'M7 소셜 & 미디어', <M7Page />],
  ['/m8', 'M8 토큰 홀더', <M8Page />],
  ['/m9', 'M9 리포트 & 알림', <M9Page />],
  ['/settings/modes', '모듈 모드 관리', <ModesPage />],
  ['/settings/wallets', '지갑 레지스트리', <RegistryPage />],
  ['/settings/alerts', '알림 규칙', <AlertRulesPage />],
  ['/settings/users', '사용자 관리', <UsersPage />],
  ['/settings/audit', '감사 로그', <AuditPage />],
  ['/transparency', 'RLUSD 투명성', <TransparencyPage />],
  ['/methodology', '산식·방법론', <MethodologyPage />],
  ['/community', 'WELLBIAN 커뮤니티 운영', <CommunityPage />],
  ['/community/preorder', '사전신청 · 판매 퍼널', <PreorderPage />],
  ['/community/content', '콘텐츠·일정', <ContentPage />],
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
              <Route path="*" element={<Navigate to={HOME_PATH} replace />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </ModeProvider>
  )
}
