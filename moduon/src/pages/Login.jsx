// ─── 데모 로그인 (RBAC 롤 스위처) ────────────────────────────────
// 실서비스: Supabase Auth(카카오+이메일) + RLS. 데모는 원클릭 롤 전환.
// 조직 3계층(총판 → 대리점 → 셀러)과 회원 구분(개인/사업자)이 여기서 한눈에 보인다 —
// R/B 노출과 정산 열람 범위는 전부 org.bizIdentity 가 이 세션을 읽어 결정한다.
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useStore, setSession } from '../lib/store'
import { Logo, Card, useToast } from '../components/ui'
import { IcCart, IcBriefcase, IcRadar, IcMap, IcUsers, IcStore } from '../components/icons'
import { unitName } from '../lib/constants'
import { allAgencies, allMembers, sellerCode, agenciesOf } from '../lib/org'

export default function Login() {
  const { db, dispatch } = useStore()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const toast = useToast()
  const next = params.get('next')
  const activeTenants = db.tenants.filter((t) => t.status === '활성')
  const members = allMembers(db)
  const personal = members.find((m) => m.type === '개인')
  const bizMember = members.find((m) => m.type === '사업자' && m.tier === 'seller' && m.status === '승인')

  const goConsumer = () => { setSession(null); nav('/') }
  const goAdmin = () => { setSession({ role: 'admin' }); toast('본사 관리자로 로그인했어요'); nav(next?.startsWith('/admin') ? next : '/admin') }
  const keyAct = (fn) => (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn() } }
  const pill = 'rounded-field border border-bline px-3 py-2 text-left text-[12.5px] font-semibold text-bbody transition-colors hover:border-primary hover:text-primary-text'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bbg px-5 py-10">
      <Link to="/"><Logo size="lg" /></Link>
      <p className="mt-2 text-[14px] text-bmuted">데모 계정으로 소비자 · 3계층 사업자 · 본사를 체험해 보세요</p>

      <div className="mt-8 grid w-full max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* 소비자 — 비로그인 둘러보기 */}
        <Card track="b" hover role="button" tabIndex={0} onKeyDown={keyAct(goConsumer)} className="cursor-pointer p-6 text-center outline-none focus-visible:ring-2 ring-primary/40" onClick={goConsumer}>
          <div className="flex justify-center text-primary-text"><IcCart size={34} sw={1.6} /></div>
          <div className="mt-2 text-[16px] font-extrabold text-bink">소비자몰</div>
          <p className="mt-1 text-[12px] leading-5 text-bmuted">비교·견적·상담 신청<br />AI 상담봇 모비</p>
          <div className="mt-3 text-[12px] font-bold text-primary-text">로그인 없이 둘러보기 →</div>
        </Card>

        {/* 회원 — 개인/사업자. R/B 노출 차이를 이 두 버튼으로 바로 비교할 수 있다 */}
        <Card track="b" className="p-6 text-center">
          <div className="flex justify-center text-primary-text"><IcUsers size={34} sw={1.6} /></div>
          <div className="mt-2 text-[16px] font-extrabold text-bink">회원 (개인 · 사업자)</div>
          <p className="mt-1 text-[12px] leading-5 text-bmuted">개인은 온라인 구매 화면으로<br />사업자는 식별번호 · R/B 열람</p>
          <div className="mt-3 flex flex-col gap-1.5">
            <button data-t="login-personal" onClick={() => { setSession({ role: 'member', memberId: personal?.id, type: '개인' }); toast(`${personal?.name ?? '개인'} 개인회원으로 로그인했어요`); nav('/phone/shop') }} className={pill}>
              개인회원 <span className="pii text-bfaint">· {personal?.name ?? '데모'}</span>
            </button>
            <button data-t="login-biz" onClick={() => { setSession({ role: 'member', memberId: bizMember?.id, type: '사업자', tier: bizMember?.tier, code: bizMember?.code }); toast(`${bizMember?.name} 사업자회원(${bizMember?.code})으로 로그인했어요`); nav('/calculator/phone') }} className={pill}>
              사업자회원 <span className="tnum text-bfaint">· {bizMember?.code ?? '-'}</span>
            </button>
            <Link to="/signup" className="mt-0.5 text-[12px] font-bold text-primary-text">새로 가입하기 →</Link>
          </div>
        </Card>

        {/* 셀러 — 분양몰 마이오피스 */}
        <Card track="b" className="p-6 text-center">
          <div className="flex justify-center text-primary-text"><IcBriefcase size={34} sw={1.6} /></div>
          <div className="mt-2 text-[16px] font-extrabold text-bink">셀러 마이오피스</div>
          <p className="mt-1 text-[12px] leading-5 text-bmuted">리드 인박스 · 매일 정산<br />내 몰 브랜딩</p>
          <div className="mt-3 flex flex-col gap-1.5">
            {activeTenants.slice(0, 3).map((t) => (
              <button
                key={t.id}
                onClick={() => { setSession({ role: 'partner', tenantId: t.id }); toast(`${t.name} 사장님으로 로그인했어요`); nav(next?.startsWith('/office') ? next : '/office') }}
                className={pill}
              >
                {t.name} <span className="tnum text-bfaint">· {sellerCode(db, t) ?? unitName(t.unit)}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* 대리점(지역) */}
        <Card track="b" className="p-6 text-center">
          <div className="flex justify-center text-primary-text"><IcStore size={34} sw={1.6} /></div>
          <div className="mt-2 text-[16px] font-extrabold text-bink">대리점 콘솔</div>
          <p className="mt-1 text-[12px] leading-5 text-bmuted">소속 셀러 실적·정산<br />셀러 판매 건당 영업비</p>
          <div className="mt-3 flex flex-col gap-1.5">
            {allAgencies(db).filter((a) => a.status === '활성').slice(0, 3).map((a) => (
              <button
                key={a.id}
                data-t="login-agency"
                onClick={() => { setSession({ role: 'agency', agencyId: a.id }); toast(`${a.name}으로 로그인했어요`); nav('/agency') }}
                className={pill}
              >
                <span className="tnum font-extrabold text-primary-text">{a.code}</span> {a.name.replace('지역 대리점', '')}
              </button>
            ))}
          </div>
        </Card>

        {/* 총판(권역) */}
        <Card track="b" className="p-6 text-center">
          <div className="flex justify-center text-primary-text"><IcMap size={34} sw={1.6} /></div>
          <div className="mt-2 text-[16px] font-extrabold text-bink">총판 관제</div>
          <p className="mt-1 text-[12px] leading-5 text-bmuted">권역 셀러·리드 관제<br />대리점까지 정산 열람</p>
          <div className="mt-3 flex flex-col gap-1.5">
            {(db.distributors ?? []).slice(0, 4).map((d) => (
              <button
                key={d.id}
                onClick={() => { setSession({ role: 'regional', distributorId: d.id }); toast(`${d.name} ${d.owner} 총판으로 로그인했어요`); nav('/regional') }}
                className={pill}
              >
                <span className="tnum font-extrabold text-primary-text">{d.code}</span> {unitName(d.unit)} <span className="text-bfaint">· 대리점 {agenciesOf(db, d.id).length}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* 본사 */}
        <Card track="b" hover role="button" tabIndex={0} onKeyDown={keyAct(goAdmin)} className="cursor-pointer p-6 text-center outline-none focus-visible:ring-2 ring-primary/40" onClick={goAdmin}>
          <div className="flex justify-center text-primary-text"><IcRadar size={34} sw={1.6} /></div>
          <div className="mt-2 text-[16px] font-extrabold text-bink">본사 어드민 · 관제</div>
          <p className="mt-1 text-[12px] leading-5 text-bmuted">조직·회원 · 분양 승인<br />정산 실행 · 전 계층 열람</p>
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
      <p className="mt-3 max-w-xl text-center text-[11px] leading-4 text-bfaint">
        실서비스에서는 hq_admin / hq_staff / distributor(총판) / agency(대리점) / seller(셀러) / consumer 롤이 Supabase RLS로 강제됩니다.
        정산 열람은 본사만 전 계층, 총판·대리점은 바로 아래 1대까지입니다. 데모는 브라우저 localStorage에만 저장돼요.
      </p>
    </div>
  )
}
