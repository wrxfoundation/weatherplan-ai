import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useLayoutEffect, useState } from 'react'
import ConsumerLayout from './components/layout/ConsumerLayout'
import OfficeLayout from './components/layout/OfficeLayout'
import AdminLayout from './components/layout/AdminLayout'
import Home from './pages/consumer/Home'
import Category from './pages/consumer/Category'
import Calculator from './pages/consumer/Calculator'
import PhoneCalculator from './pages/consumer/PhoneCalculator'
import RentalCalculator from './pages/consumer/RentalCalculator'
import Consult from './pages/consumer/Consult'
import Diagnosis from './pages/consumer/Diagnosis'
import Payouts from './pages/consumer/Payouts'
import Support from './pages/consumer/Support'
import Shop from './pages/consumer/Shop'
import Onboard from './pages/consumer/Onboard'
import TenantMall from './pages/consumer/TenantMall'
import PartnerLanding from './pages/partner/Landing'
import PartnerApply from './pages/partner/Apply'
import Login from './pages/Login'
import Invest from './pages/Invest'
import InvestDeck from './pages/InvestDeck'
import OfficeDashboard from './pages/office/Dashboard'
import OfficeLeads from './pages/office/Leads'
import OfficeSettlement from './pages/office/Settlement'
import OfficeCustomers from './pages/office/Customers'
import OfficeMarketing from './pages/office/Marketing'
import OfficeDesign from './pages/office/Design'
import OfficeResources from './pages/office/Resources'
import OfficeSetup from './pages/office/Setup'
import AdminDashboard from './pages/admin/Dashboard'
import RegionalDashboard from './pages/regional/Dashboard'
import AdminBiz from './pages/admin/Biz'
import AdminTenants from './pages/admin/Tenants'
import AdminProducts from './pages/admin/Products'
import AdminPolicies from './pages/admin/Policies'
import AdminLeadsConsole from './pages/admin/LeadsConsole'
import AdminSettlements from './pages/admin/Settlements'
import AdminAiOps from './pages/admin/AiOps'
import AdminPersonaLab from './pages/admin/PersonaLab'
import AdminPress from './pages/admin/Press'
import AdminAudit from './pages/admin/Audit'

function ScrollTop() {
  const { pathname } = useLocation()
  // 라우트 전환 시 항상 최상단부터 — 페인트 전(useLayoutEffect)에 이동해 깜빡임 없음.
  // 브라우저 스크롤 복원을 끄고 window·document 양쪽을 리셋한다.
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname])
  return null
}

// 개인정보 가림 모드 — Ctrl+Shift+H 전역 토글. 쇼핑몰·오피스·어드민·정산서 등
// pii 태그가 붙은 모든 항목(이름·연락처·대표자)을 블러 처리한다.
// 화면에는 어떤 배지·칩도 띄우지 않는다 — 외부 점검·실사 시 마스킹이
// 프로그램의 기본 상태처럼 보여야 하므로 단축키 외 흔적을 남기지 않는다.
function PrivacyGuard() {
  const [on, setOn] = useState(() => { try { return localStorage.getItem('moduon_pmask') === '1' } catch { return false } })
  useEffect(() => {
    document.documentElement.classList.toggle('pmask', on)
    try { localStorage.setItem('moduon_pmask', on ? '1' : '0') } catch { /* noop */ }
  }, [on])
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'h') { e.preventDefault(); setOn((v) => !v) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return null
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <PrivacyGuard />
      <Routes>
        {/* 트랙 A — 소비자몰 */}
        <Route element={<ConsumerLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/category/:slug" element={<Category />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/calculator/phone" element={<PhoneCalculator />} />
          <Route path="/calculator/rental" element={<RentalCalculator />} />
          <Route path="/consult" element={<Consult />} />
          <Route path="/diagnosis" element={<Diagnosis />} />
          <Route path="/payouts" element={<Payouts />} />
          <Route path="/support" element={<Support />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/onboard/:slug" element={<Onboard />} />
        </Route>

        {/* 멀티테넌시 — 파트너 분양몰 (moduon.com/m/{slug}) */}
        <Route path="/m/:slug/*" element={<TenantMall />} />

        {/* 파트너 모집 */}
        <Route path="/partner" element={<PartnerLanding />} />
        <Route path="/partner/apply" element={<PartnerApply />} />

        {/* IR 원페이지 */}
        <Route path="/ir" element={<Invest />} />
        <Route path="/ir/deck" element={<InvestDeck />} />

        {/* 데모 로그인 */}
        <Route path="/login" element={<Login />} />

        {/* 트랙 B — 파트너 마이오피스 */}
        <Route path="/office" element={<OfficeLayout />}>
          <Route index element={<OfficeDashboard />} />
          <Route path="leads" element={<OfficeLeads />} />
          <Route path="settlement" element={<OfficeSettlement />} />
          <Route path="customers" element={<OfficeCustomers />} />
          <Route path="marketing" element={<OfficeMarketing />} />
          <Route path="design" element={<OfficeDesign />} />
          <Route path="resources" element={<OfficeResources />} />
          <Route path="setup" element={<OfficeSetup />} />
        </Route>

        {/* 트랙 B' — 총판(관리단) 콘솔 */}
        <Route path="/regional" element={<RegionalDashboard />} />

        {/* 트랙 B — 본사 어드민(관제) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="biz" element={<AdminBiz />} />
          <Route path="tenants" element={<AdminTenants />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="policies" element={<AdminPolicies />} />
          <Route path="leads" element={<AdminLeadsConsole />} />
          <Route path="settlements" element={<AdminSettlements />} />
          <Route path="ai" element={<AdminAiOps />} />
          <Route path="persona-lab" element={<AdminPersonaLab />} />
          <Route path="press" element={<AdminPress />} />
          <Route path="audit" element={<AdminAudit />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
