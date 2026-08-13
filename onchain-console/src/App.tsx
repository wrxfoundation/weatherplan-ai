import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/app/Layout'
import { ModeProvider } from '@/app/ModeProvider'
import { DashboardPage } from '@/modules/dashboard/DashboardPage'
import { M1Page } from '@/modules/m1/M1Page'
import { M2Page } from '@/modules/m2/M2Page'
import { M3Page } from '@/modules/m3/M3Page'
import { Placeholder } from '@/modules/Placeholder'

const placeholders: [string, string, string][] = [
  ['/m4', 'M4 DePIN 보상', 'DePIN 보상 관제 모듈'],
  ['/m5', 'M5 재무 현황', '재무 현황 모듈'],
  ['/m6', 'M6 파트너 정산', '파트너 정산 모듈'],
  ['/m7', 'M7 소셜 & 미디어', '소셜·평판 레이더 모듈'],
  ['/m8', 'M8 토큰 홀더', '지갑 흐름 인텔리전스 모듈'],
  ['/m9', 'M9 리포트 & 알림', '리포트·알림 모듈'],
  ['/settings/modes', '모듈 모드 관리', 'DEMO/LIVE 모듈별 전환 설정'],
  ['/settings/wallets', '지갑 레지스트리', '지갑 주소·라벨·종류 관리'],
  ['/settings/alerts', '알림 규칙', '알림 규칙 편집'],
  ['/settings/users', '사용자 관리', '이메일 allowlist·역할 관리'],
  ['/settings/audit', '감사 로그', '운영 액션 감사 이력'],
]

export default function App() {
  return (
    <ModeProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/m1" element={<M1Page />} />
            <Route path="/m2" element={<M2Page />} />
            <Route path="/m3" element={<M3Page />} />
            {placeholders.map(([path, title, desc]) => (
              <Route key={path} path={path} element={<Placeholder title={title} description={desc} />} />
            ))}
          </Routes>
        </Layout>
      </BrowserRouter>
    </ModeProvider>
  )
}
