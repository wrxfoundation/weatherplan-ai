// ─── 회원가입 — 개인 / 사업자 분기 ─────────────────────────────────
// 개인: 이름·연락처만. 조직에 속하지 않으므로 식별번호가 없고 R/B·정산 화면도 닫힌다.
// 사업자: 추천인(권역 총판) → 지역(대리점) → 등급을 고르면 그 자리에서 식별번호를 발급한다.
//   식별번호 A1J1234 = 권역(A) + 지역(1) + 셀러코드(J1234). 이 번호 하나로
//   "어느 권역 · 어느 대리점 소속 셀러인가"가 즉시 판별된다(org.js 접두사 규칙).
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore, setSession } from '../../lib/store'
import { agenciesOf, allDistributors, issueSellerCode, SIGNUP_TIERS, MEMBER_TYPES, TIER_LABEL } from '../../lib/org'
import { unitName } from '../../lib/constants'
import { phoneValid, copyText } from '../../lib/engine'
import { Field, inputCls, Btn, Steps, useToast } from '../../components/ui'
import { IcCheck } from '../../components/icons'

export default function Signup() {
  const { db, dispatch } = useStore()
  const nav = useNavigate()
  const toast = useToast()

  const [type, setType] = useState(null) // '개인' | '사업자'
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [tier, setTier] = useState('seller')
  const [distributorId, setDistributorId] = useState('')
  const [agencyId, setAgencyId] = useState('')
  const [done, setDone] = useState(null) // 발급 결과 { code, tier, ... }
  const [copied, setCopied] = useState(false)

  const dists = allDistributors(db).slice().sort((a, b) => String(a.code).localeCompare(String(b.code)))
  const dist = dists.find((d) => d.id === distributorId) ?? null
  const agencies = distributorId ? agenciesOf(db, distributorId) : []
  const agency = agencies.find((a) => a.id === agencyId) ?? null

  // 발급 예정 식별번호 — 셀러는 난수 코드라 "미리보기"는 형식만 보여 준다(실제 코드는 제출 시 확정).
  const previewCode = useMemo(() => {
    if (type !== '사업자') return null
    if (tier === 'distributor') return dist?.code ?? null
    if (tier === 'agency') return agency?.code ?? null
    return agency ? `${agency.code}○0000` : null
  }, [type, tier, dist, agency])

  const needAgency = tier !== 'distributor'
  const ready = type === '개인'
    ? name.trim().length >= 2 && phoneValid(phone)
    : name.trim().length >= 2 && phoneValid(phone) && !!distributorId && (!needAgency || !!agencyId)

  const submit = () => {
    if (!ready) return
    if (type === '개인') {
      const id = `MB${Date.now().toString(36)}`
      dispatch({ type: 'MEMBER_SIGNUP', payload: { id, type: '개인', name: name.trim(), phone: phone.trim(), code: null, tier: null, distributorId: null, agencyId: null } })
      setSession({ role: 'member', memberId: id, type: '개인' })
      toast('개인 회원으로 가입했어요')
      nav('/benefits')
      return
    }
    // 사업자 — 등급에 따라 식별번호가 달라진다. 셀러만 난수 셀러코드를 새로 발급받는다.
    const code = tier === 'distributor' ? dist?.code
      : tier === 'agency' ? agency?.code
        : issueSellerCode(db, agency?.code)
    if (!code) { toast('식별번호를 발급하지 못했어요 — 지역을 다시 선택해 주세요'); return }
    const id = `MB${Date.now().toString(36)}`
    const payload = {
      id, type: '사업자', name: name.trim(), phone: phone.trim(), code, tier,
      distributorId, agencyId: needAgency ? agencyId : null,
      // 셀러·대리점 신규 가입은 본사 승인 대기로 시작한다 — 승인 전에도 코드는 고정된다
      status: '대기',
    }
    dispatch({ type: 'MEMBER_SIGNUP', payload })
    setSession({ role: 'member', memberId: id, type: '사업자', tier, code })
    setDone(payload)
  }

  // ── 발급 완료 화면
  if (done) {
    return (
      <main className="mx-auto max-w-lg px-5 pb-24 pt-10 sm:pt-14">
        <div className="rounded-card bg-white p-7 text-center shadow-card">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ok/10 text-ok"><IcCheck size={24} /></span>
          <h1 className="mt-3 text-[21px] font-extrabold tracking-[-0.4px] text-ink">사업자 회원가입 완료</h1>
          <p className="mt-1.5 text-[13.5px] text-muted">아래 개인식별번호로 소속과 실적이 관리됩니다.</p>

          <div data-t="issued-code" className="mt-5 rounded-card bg-tint px-5 py-6">
            <div className="text-[12px] font-bold text-primary-text">개인식별번호</div>
            <div className="tnum mt-1 text-[34px] font-extrabold tracking-[3px] text-primary-text">{done.code}</div>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5 text-[11.5px] font-semibold text-muted">
              <span className="rounded-full bg-white px-2.5 py-1">권역 {dist?.code} · {unitName(dist?.unit)}</span>
              {agency && <span className="rounded-full bg-white px-2.5 py-1">지역 {agency.code} · {agency.name}</span>}
              <span className="rounded-full bg-white px-2.5 py-1">{TIER_LABEL[done.tier]}</span>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Btn variant="outline" className="flex-1" onClick={async () => { if (await copyText(done.code)) { setCopied(true); setTimeout(() => setCopied(false), 1600) } }}>
              {copied ? '복사했어요' : '식별번호 복사'}
            </Btn>
            <Btn className="flex-1" onClick={() => nav('/calculator/phone')}>R/B 보며 설계하기</Btn>
          </div>
          <p className="mt-4 text-[11.5px] leading-[1.6] text-faint">
            본사 승인 후 정산 대상이 됩니다. 승인 전에도 식별번호와 R/B 조회는 사용할 수 있어요.<br />
            로그인 화면에서 언제든 역할을 전환할 수 있습니다.
          </p>
          <Link to="/login" className="hit mt-3 inline-block text-[12.5px] font-bold text-primary-text">로그인 화면으로 →</Link>
        </div>
      </main>
    )
  }

  // ── 가입 폼
  return (
    <main className="mx-auto max-w-lg px-5 pb-24 pt-8 sm:pt-12">
      <h1 className="text-[24px] font-extrabold tracking-[-0.6px] text-ink">회원가입</h1>
      <p className="mt-1.5 text-[14px] text-muted">개인 회원과 사업자 회원은 보이는 화면이 다릅니다.</p>
      <div className="mt-5"><Steps items={['회원 구분', '정보 입력', '가입 완료']} current={type ? 1 : 0} /></div>

      {/* 1. 회원 구분 */}
      <section data-t="signup-type" className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {MEMBER_TYPES.map((t) => (
          <button
            key={t.key}
            data-t={`type-${t.key === '개인' ? 'personal' : 'biz'}`}
            onClick={() => setType(t.key)}
            aria-pressed={type === t.key}
            className={`rounded-card border p-4 text-left transition-all ${type === t.key ? 'border-[1.5px] border-primary bg-tint' : 'border-line bg-white hover:border-primary/50'}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[15.5px] font-extrabold text-ink">{t.key} 회원</span>
              <span className={`h-[18px] w-[18px] rounded-full ${type === t.key ? 'border-[6px] border-primary bg-white' : 'border border-line bg-white'}`} />
            </div>
            <p className="mt-1.5 text-[12.5px] leading-[1.5] text-muted">{t.desc}</p>
          </button>
        ))}
      </section>

      {type && (
        <section className="mt-4 flex flex-col gap-4 rounded-card bg-white p-5 shadow-card animate-rise sm:p-6">
          <Field label="이름" required>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="실명을 입력해 주세요" />
          </Field>
          <Field label="휴대폰 번호" required hint="개통·정산 안내가 이 번호로 발송됩니다">
            <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" inputMode="tel" />
          </Field>

          {type === '사업자' && (
            <>
              <div>
                <span className="mb-1.5 block text-[13px] font-semibold text-label">가입 등급 <em className="not-italic text-primary-text">*</em></span>
                <div data-t="signup-tier" className="grid gap-2">
                  {SIGNUP_TIERS.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => { setTier(t.key); if (t.key === 'distributor') setAgencyId('') }}
                      aria-pressed={tier === t.key}
                      className={`rounded-btn border p-3 text-left transition-all ${tier === t.key ? 'border-[1.5px] border-primary bg-tint' : 'border-line bg-white hover:border-primary/50'}`}
                    >
                      <span className="text-[13.5px] font-bold text-ink">{t.label}</span>
                      <p className="mt-0.5 text-[12px] leading-[1.45] text-muted">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Field label="추천인 (권역 총판)" required hint="어느 권역 소속인지가 식별번호 첫 글자로 들어갑니다">
                <select data-t="signup-region" className={inputCls} value={distributorId} onChange={(e) => { setDistributorId(e.target.value); setAgencyId('') }}>
                  <option value="">권역을 선택해 주세요</option>
                  {dists.map((d) => (
                    <option key={d.id} value={d.id}>{d.code} · {d.name} ({unitName(d.unit)})</option>
                  ))}
                </select>
              </Field>

              {needAgency && (
                <Field label="소속 지역 (대리점)" required hint={distributorId ? undefined : '권역을 먼저 선택해 주세요'}>
                  <select data-t="signup-area" className={inputCls} value={agencyId} onChange={(e) => setAgencyId(e.target.value)} disabled={!distributorId}>
                    <option value="">{distributorId ? '지역을 선택해 주세요' : '권역 선택 후 활성화'}</option>
                    {agencies.map((a) => (
                      <option key={a.id} value={a.id}>{a.code} · {a.name}</option>
                    ))}
                  </select>
                </Field>
              )}

              {previewCode && (
                <div data-t="code-preview" className="rounded-btn bg-tint px-4 py-3">
                  <div className="text-[11.5px] font-bold text-primary-text">발급될 개인식별번호</div>
                  <div className="tnum mt-0.5 text-[22px] font-extrabold tracking-[2px] text-primary-text">{previewCode}</div>
                  <p className="mt-1 text-[11px] leading-[1.5] text-muted">
                    권역({dist?.code}){agency ? ` + 지역(${agency.code.slice(-1)})` : ''}{tier === 'seller' ? ' + 셀러코드(영문 1 + 숫자 4)' : ''} 형식입니다.
                    {tier === 'seller' ? ' 셀러코드는 가입 완료 시 중복 없이 발급돼요.' : ''}
                  </p>
                </div>
              )}
            </>
          )}

          <Btn disabled={!ready} onClick={submit} className="w-full">
            {type === '사업자' ? '식별번호 발급하고 가입' : '가입하기'}
          </Btn>
          {type === '개인' && <p className="text-center text-[11.5px] text-faint">개인 회원은 소속·식별번호 없이 비교·견적·혜택만 이용합니다.</p>}
        </section>
      )}

      <p className="mt-5 text-center text-[12.5px] text-faint">
        이미 계정이 있나요? <Link to="/login" className="hit font-bold text-primary-text">로그인 →</Link>
      </p>
    </main>
  )
}
