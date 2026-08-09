// ─── 데모 로그인 (RBAC 롤 스위처) ────────────────────────────────
// 실서비스: Supabase Auth(카카오+이메일) + RLS. 데모는 원클릭 롤 전환.
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useStore, setSession } from '../lib/store'
import { Logo, Card, useToast } from '../components/ui'
import { unitName } from '../lib/constants'

export default function Login() {
  const { db, dispatch } = useStore()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const toast = useToast()
  const next = params.get('next')
  const activeTenants = db.tenants.filter((t) => t.status === '활성')

  // 클릭형 롤 카드 공용 — 키보드(Enter/Space) 동작 부여
  const goConsumer = () => { setSession(null); nav('/') }
  const goAdmin = () => { setSession({ role: 'admin' }); toast('본사 관리자로 로그인했어요'); nav(next?.startsWith('/admin') ? next : '/admin') }
  const keyAct = (fn) => (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn() } }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bbg px-5 py-10">
      <Link to="/"><Logo size="lg" /></Link>
      <p className="mt-2 text-[14px] text-bmuted">데모 계정으로 3면 플랫폼을 체험해 보세요</p>

      <div className="mt-8 grid w-full max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 소비자 */}
        <Card track="b" hover role="button" tabIndex={0} onKeyDown={keyAct(goConsumer)} className="cursor-pointer p-6 text-center outline-none focus-visible:ring-2 ring-primary/40" onClick={goConsumer}>
          <div className="text-[34px]">🛒</div>
          <div className="mt-2 text-[16px] font-extrabold text-bink">소비자몰</div>
          <p className="mt-1 text-[12px] leading-5 text-bmuted">비교·견적·상담 신청<br />AI 상담봇 모비</p>
          <div className="mt-3 text-[12px] font-bold text-primary-text">로그인 없이 둘러보기 →</div>
        </Card>

        {/* 파트너 */}
        <Card track="b" className="p-6 text-center">
          <div className="text-[34px]">💼</div>
          <div className="mt-2 text-[16px] font-extrabold text-bink">파트너 마이오피스</div>
          <p className="mt-1 text-[12px] leading-5 text-bmuted">리드 인박스 · 매일 정산<br />내 몰 브랜딩</p>
          <div className="mt-3 flex flex-col gap-1.5">
            {activeTenants.slice(0, 3).map((t) => (
              <button
                key={t.id}
                onClick={() => { setSession({ role: 'partner', tenantId: t.id }); toast(`${t.name} 사장님으로 로그인했어요`); nav(next?.startsWith('/office') ? next : '/office') }}
                className="rounded-field border border-bline px-3 py-2 text-[12.5px] font-semibold text-bbody transition-colors hover:border-primary hover:text-primary-text"
              >
                {t.name} <span className="text-bfaint">· {unitName(t.unit)}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* 총판(관리단) */}
        <Card track="b" className="p-6 text-center">
          <div className="text-[34px]">🗺️</div>
          <div className="mt-2 text-[16px] font-extrabold text-bink">총판 관리단</div>
          <p className="mt-1 text-[12px] leading-5 text-bmuted">권역 셀러·리드 관제<br />배분 수익 확인</p>
          <div className="mt-3 flex flex-col gap-1.5">
            {(db.distributors ?? []).map((d) => (
              <button
                key={d.id}
                onClick={() => { setSession({ role: 'regional', distributorId: d.id }); toast(`${d.name} ${d.owner} 총판으로 로그인했어요`); nav('/regional') }}
                className="rounded-field border border-bline px-3 py-2 text-[12.5px] font-semibold text-bbody transition-colors hover:border-primary hover:text-primary-text"
              >
                {unitName(d.unit)} <span className="text-bfaint">· {d.owner}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* 본사 */}
        <Card track="b" hover role="button" tabIndex={0} onKeyDown={keyAct(goAdmin)} className="cursor-pointer p-6 text-center outline-none focus-visible:ring-2 ring-primary/40" onClick={goAdmin}>
          <div className="text-[34px]">🛰️</div>
          <div className="mt-2 text-[16px] font-extrabold text-bink">본사 어드민 · 관제</div>
          <p className="mt-1 text-[12px] leading-5 text-bmuted">분양 승인 · 리드 관제<br />정산 실행 · AI 운영</p>
          <div className="mt-3 text-[12px] font-bold text-primary-text">hq_admin으로 입장 →</div>
        </Card>
      </div>

      <div className="mt-8 flex items-center gap-4 text-[12px] text-bfaint">
        <Link to="/partner" className="font-semibold text-primary-text">분양 신청은 여기서 →</Link>
        <span>·</span>
        <button
          onClick={() => { dispatch({ type: 'RESET' }); toast('데모 데이터를 초기화했어요') }}
          className="underline hover:text-bink"
        >
          데모 데이터 초기화
        </button>
      </div>
      <p className="mt-3 max-w-md text-center text-[11px] leading-4 text-bfaint">
        실서비스에서는 hq_admin / hq_staff / regional(관리단) / partner / consumer 5개 롤이 Supabase RLS로 강제됩니다. 데모는 브라우저 localStorage에만 저장돼요.
      </p>
    </div>
  )
}
