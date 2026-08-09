import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import ConsumerLayout from './components/layout/ConsumerLayout'
import OfficeLayout from './components/layout/OfficeLayout'
import AdminLayout from './components/layout/AdminLayout'
import Home from './pages/consumer/Home'
import Category from './pages/consumer/Category'
import Calculator from './pages/consumer/Calculator'
import PhoneCalculator from './pages/consumer/PhoneCalculator'
import Consult from './pages/consumer/Consult'
import Diagnosis from './pages/consumer/Diagnosis'
import TenantMall from './pages/consumer/TenantMall'
import PartnerLanding from './pages/partner/Landing'
import PartnerApply from './pages/partner/Apply'
import Login from './pages/Login'
import OfficeDashboard from './pages/office/Dashboard'
import OfficeLeads from './pages/office/Leads'
import OfficeSettlement from './pages/office/Settlement'
import OfficeCustomers from './pages/office/Customers'
import OfficeResources from './pages/office/Resources'
import OfficeSetup from './pages/office/Setup'
import AdminDashboard from './pages/admin/Dashboard'
import AdminTenants from './pages/admin/Tenants'
import AdminProducts from './pages/admin/Products'
import AdminPolicies from './pages/admin/Policies'
import AdminLeadsConsole from './pages/admin/LeadsConsole'
import AdminSettlements from './pages/admin/Settlements'
import AdminAiOps from './pages/admin/AiOps'
import AdminAudit from './pages/admin/Audit'

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <Routes>
        {/* 트랙 A — 소비자몰 */}
        <Route element={<ConsumerLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/category/:slug" element={<Category />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/calculator/phone" element={<PhoneCalculator />} />
          <Route path="/consult" element={<Consult />} />
          <Route path="/diagnosis" element={<Diagnosis />} />
        </Route>

        {/* 멀티테넌시 — 파트너 분양몰 (moduon.com/m/{slug}) */}
        <Route path="/m/:slug/*" element={<TenantMall />} />

        {/* 파트너 모집 */}
        <Route path="/partner" element={<PartnerLanding />} />
        <Route path="/partner/apply" element={<PartnerApply />} />

        {/* 데모 로그인 */}
        <Route path="/login" element={<Login />} />

        {/* 트랙 B — 파트너 마이오피스 */}
        <Route path="/office" element={<OfficeLayout />}>
          <Route index element={<OfficeDashboard />} />
          <Route path="leads" element={<OfficeLeads />} />
          <Route path="settlement" element={<OfficeSettlement />} />
          <Route path="customers" element={<OfficeCustomers />} />
          <Route path="resources" element={<OfficeResources />} />
          <Route path="setup" element={<OfficeSetup />} />
        </Route>

        {/* 트랙 B — 본사 어드민(관제) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="tenants" element={<AdminTenants />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="policies" element={<AdminPolicies />} />
          <Route path="leads" element={<AdminLeadsConsole />} />
          <Route path="settlements" element={<AdminSettlements />} />
          <Route path="ai" element={<AdminAiOps />} />
          <Route path="audit" element={<AdminAudit />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
