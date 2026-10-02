// ─── 멀티테넌시 파트너몰 (moduon.com/m/{slug}) ───────────────────
// 파트너 브랜딩(이름·인사말·노출 카테고리)이 적용된 소비자몰 변형.
// 이 몰에서 발생한 리드는 L-02 규칙 ①에 따라 해당 파트너에게 직접 배정된다.
import { useParams, Link } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { ConsumerHeader, ConsumerFooter } from '../../components/layout/ConsumerLayout'
import Home from './Home'
import ChatWidget from '../../components/ChatWidget'
import { Logo } from '../../components/ui'

export default function TenantMall() {
  const { slug } = useParams()
  const { db } = useStore()
  const tenant = db.tenants.find((t) => t.slug === slug)

  if (!tenant || tenant.status !== '활성') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-5 text-center">
        <Logo />
        <h1 className="mt-6 text-[20px] font-extrabold text-ink">{tenant ? '운영이 잠시 중단된 몰이에요' : '존재하지 않는 분양몰이에요'}</h1>
        <p className="mt-2 text-[14px] text-muted">모두온 본진에서 동일한 서비스를 이용하실 수 있어요.</p>
        <Link to="/" className="mt-6 inline-flex h-12 items-center rounded-btn bg-primary px-6 text-[15px] font-bold text-white">모두온 홈으로 가기</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <ConsumerHeader tenant={tenant} />
      <Home tenant={tenant} />
      <ConsumerFooter tenant={tenant} />
      <ChatWidget tenant={tenant} />
    </div>
  )
}
