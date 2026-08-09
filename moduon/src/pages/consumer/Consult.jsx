// ─── S-04 상담 신청 + 완료 (목업 #3a/#3b) — 30초 완성 리드 폼 ────
import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { CATEGORIES, CONSULT_TIMES, REGIONS, LEGAL } from '../../lib/constants'
import { maskPhone, phoneValid, won, captureRef } from '../../lib/engine'
import { Btn, Field, inputCls, Modal, useToast } from '../../components/ui'
import { IcStore, IcRobot, IcDoc } from '../../components/icons'
import StatusTracker from '../../components/StatusTracker'

export default function Consult() {
  const { db, dispatch } = useStore()
  const [params] = useSearchParams()
  const loc = useLocation()
  const nav = useNavigate()
  const toast = useToast()

  const src = params.get('src') // 파트너몰 slug
  const tenant = src ? db.tenants.find((t) => t.slug === src) : null
  // AI 진단에서 넘어온 컨텍스트 — 계산기 견적이 없으면 진단 라벨을 견적 자리에 붙여 판매자에게 보여준다
  const diagnosis = loc.state?.diagnosis ?? null
  const fromDiag = !loc.state?.quote && !!diagnosis
  const quote = loc.state?.quote ?? (diagnosis ? { label: diagnosis.label } : null)
  const diagCats = [...new Set(diagnosis?.cats?.filter((s) => CATEGORIES.some((c) => c.slug === s)) ?? [])]

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [sigunguSel, setSigunguSel] = useState('') // '__custom'이면 직접 입력
  const [customSigungu, setCustomSigungu] = useState('')
  const [cats, setCats] = useState(params.get('cat') ? [params.get('cat')] : diagCats.length ? diagCats : quote ? ['internet'] : [])
  const [time, setTime] = useState('지금 바로')
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeMkt, setAgreeMkt] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)
  const [done, setDone] = useState(null)

  const sigungu = sigunguSel === '__custom' ? customSigungu.trim() : sigunguSel

  const toggleCat = (slug) => setCats((c) => (c.includes(slug) ? c.filter((x) => x !== slug) : [...c, slug]))

  // 비활성 버튼 대신, 누르면 비어 있는 첫 항목을 짚어준다
  const firstMissing = () => {
    if (name.trim().length < 2) return '이름을 입력해 주세요'
    if (!phoneValid(phone)) return '연락처를 010-0000-0000 형식으로 입력해 주세요'
    if (!sigungu) return sigunguSel === '__custom' ? '기타 지역명을 입력해 주세요' : '지역을 선택해 주세요'
    if (cats.length === 0) return '관심 서비스를 1개 이상 선택해 주세요'
    if (!agreePrivacy) return '개인정보 수집·이용에 동의해 주세요'
    return null
  }

  const submit = () => {
    const missing = firstMissing()
    if (missing) { toast(missing, 'err'); return }
    // 중복 제출 가드 — 10분 내 동일 연락처·카테고리 접수가 있으면 리드를 새로 만들지 않는다 (idempotency)
    const dup = db.leads.find((l) => l.phone === phone.trim() && l.cat === cats[0] && Date.now() - l.createdAt < 10 * 60000 && l.status !== '취소')
    if (dup) {
      setDone({ name: name.trim(), phone: phone.trim(), sigungu, cats: [...cats], time })
      toast('이미 접수된 신청이 있어요 — 담당 상담사가 곧 연락드려요!')
      return
    }
    dispatch({
      type: 'CREATE_LEAD',
      // cat: 대표(라우팅용) / cats: 선택 전체 — "복수 선택" UI 약속대로 전부 저장한다
      payload: { name: name.trim(), phone: phone.trim(), sigungu, cat: cats[0], cats: [...cats], wish: time, source: src ?? 'main', quote, ref: captureRef() },
    })
    dispatch({ type: 'AI_EVENT', payload: { kind: 'classify', q: cats.join(','), source: 'engine', label: '상담 신청', auto: true } })
    setDone({ name: name.trim(), phone: phone.trim(), sigungu, cats: [...cats], time })
    toast('상담 신청이 접수되었어요!')
  }

  // ── 완료 화면 (#3b) ──
  if (done) {
    const catNames = done.cats.map((s) => CATEGORIES.find((c) => c.slug === s)?.name).filter(Boolean).join(' · ')
    return (
      <main className="mx-auto max-w-md px-5 pb-16">
        <div className="flex justify-end pt-4">
          <button onClick={() => nav(tenant ? `/m/${tenant.slug}` : '/')} className="text-[24px] text-faint hover:text-ink" aria-label="닫기">×</button>
        </div>
        <div className="mt-4 flex flex-col items-center text-center">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-full text-white shadow-panel" style={{ background: 'linear-gradient(135deg,#5B80D9,#5174CD)' }}>
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m4.5 12.5 5 5 10-11" /></svg>
            </div>
            <span className="absolute -left-3 top-2 h-2.5 w-2.5 rounded-full bg-orange" />
            <span className="absolute -right-1 top-0 h-2 w-2 rounded-full bg-[#F7745F]" />
            <span className="absolute -bottom-1 -left-1 h-2 w-2 rounded-full bg-tint" />
          </div>
          <h1 className="mt-5 text-[24px] font-extrabold tracking-tight text-ink">신청 완료!</h1>
          <p className="mt-2 text-[14.5px] leading-6 text-muted">
            <strong className="font-bold text-primary-text">평균 10분 내</strong>에 {tenant ? `${tenant.name} ` : ''}전문 상담사가 연락드려요.
          </p>
        </div>

        <div className="mt-7 rounded-card bg-white p-5 shadow-card">
          <div className="text-[13px] font-bold text-ink">신청 내용</div>
          <div className="mt-3 flex flex-col gap-2.5 text-[13.5px]">
            <SummaryRow k="이름" v={done.name} />
            <SummaryRow k="연락처" v={maskPhone(done.phone)} />
            <SummaryRow k="지역" v={done.sigungu} />
            <SummaryRow k="관심 서비스" v={catNames} accent />
            <SummaryRow k="희망 시간" v={done.time} />
            {quote && <SummaryRow k="구성 견적" v={quote.label ?? `월 ${won(quote.total)} · 사은품 ${won(quote.gift)}`} accent />}
          </div>
        </div>

        <StatusTracker current={0} />

        <div className="mt-7 text-[13px] font-semibold text-faint">기다리는 동안 이런 혜택은 어때요?</div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button onClick={() => nav('/calculator')} className="relative overflow-hidden rounded-card p-4 text-left text-white transition-transform hover:-translate-y-[3px]" style={{ background: 'linear-gradient(180deg,#5B80D9,#5174CD)' }}>
            <div className="text-[12px] font-bold text-white/80">인터넷/TV</div>
            <div className="mt-0.5 text-[14px] font-extrabold leading-5">결합하면 월 11,100원 절약</div>
            <img src="/assets/obj-wifi.webp" alt="" className="absolute -bottom-2 -right-2 h-16 w-16 object-contain" />
          </button>
          <button onClick={() => nav('/diagnosis')} className="relative overflow-hidden rounded-card p-4 text-left text-white transition-transform hover:-translate-y-[3px]" style={{ background: 'linear-gradient(180deg,#F98974,#F7745F)' }}>
            <div className="text-[12px] font-bold text-white/80">AI 진단</div>
            <div className="mt-0.5 text-[14px] font-extrabold leading-5">1분 만에 생활비 새는 곳 찾기</div>
            <img src="/assets/obj-purifier.webp" alt="" className="absolute -bottom-2 -right-2 h-16 w-16 object-contain" />
          </button>
        </div>

        <button onClick={() => nav(tenant ? `/m/${tenant.slug}` : '/')} className="mt-8 h-[52px] w-full rounded-btn bg-primary text-[15px] font-bold text-white shadow-cta hover:bg-primary-hover">
          확인
        </button>
        {/* 기다리기 싫은 고객용 즉시통화 — 콜백 대기 이탈 방지 */}
        <a href="tel:16600000" className="glass-btn mt-2.5 flex h-12 w-full items-center justify-center rounded-btn border border-line-soft bg-white text-[14px] font-bold text-body transition-colors hover:border-primary hover:text-primary-text">
          지금 바로 전화하기 (대표번호 1660-0000)
        </a>
      </main>
    )
  }

  // ── 신청 폼 (#3a) ──
  return (
    <main className="mx-auto max-w-md px-5 pb-16">
      <div className="pt-6">
        {tenant && (
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-primary-text shadow-card">
            <IcStore size={13} /> {tenant.name} 파트너몰 상담
          </div>
        )}
        <h1 className="text-[24px] font-extrabold tracking-tight text-ink">30초면 신청 완료!</h1>
        <p className="mt-1.5 text-[14px] text-muted">
          남겨주시면 <strong className="font-bold text-primary-text">평균 10분 내</strong> 전문 상담사가 연락드려요.
        </p>
      </div>

      {quote && (
        <div className="mt-5 rounded-card border border-tint bg-white p-4 shadow-card">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-bold text-ink">{fromDiag ? <><IcRobot size={13} className="inline -mt-0.5 mr-1" />AI 진단에서 가져온 결과</> : <><IcDoc size={13} className="inline -mt-0.5 mr-1" />계산기에서 가져온 구성</>}</span>
            <Link to={fromDiag ? '/diagnosis' : '/calculator'} className="font-semibold text-primary-text">수정</Link>
          </div>
          <div className="tnum mt-1.5 text-[13.5px] text-label">
            {quote.label ?? <>{quote.carrier} {quote.speed} + {quote.bundle} → 월 <strong className="font-extrabold text-primary-text">{won(quote.total)}</strong> · 사은품 {won(quote.gift)}</>}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-4 rounded-card bg-white p-5 shadow-card">
        <Field label="이름" required>
          <input className={inputCls} placeholder="홍길동" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="연락처" required hint={!phone || phoneValid(phone) ? undefined : '010-0000-0000 형식으로 입력해 주세요'}>
          <input className={inputCls} placeholder="010-0000-0000" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="지역" required hint="상담 배정을 위해 시·군·구까지만 수집해요">
          <select className={`${inputCls} appearance-none ${sigunguSel ? '' : 'text-disabled'}`} value={sigunguSel} onChange={(e) => setSigunguSel(e.target.value)}>
            <option value="" disabled>시·군·구를 선택하세요</option>
            {REGIONS.map((r) => <option key={r.sigungu} value={r.sigungu}>{r.sigungu}</option>)}
            <option value="__custom">기타 지역(직접 입력)</option>
          </select>
          {sigunguSel === '__custom' && (
            <input className={`${inputCls} mt-2`} placeholder="예) 경남 진주시" value={customSigungu} onChange={(e) => setCustomSigungu(e.target.value)} />
          )}
        </Field>
        <Field label="관심 서비스 (복수 선택)" required>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => toggleCat(c.slug)}
                className={`h-10 rounded-full border px-4 text-[13.5px] font-semibold transition-colors ${
                  cats.includes(c.slug) ? 'border-primary bg-primary text-white' : 'border-line bg-white text-label hover:border-primary hover:text-primary-text'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </Field>
        <Field label="상담 희망 시간" required>
          <div className="grid grid-cols-2 gap-2">
            {CONSULT_TIMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTime(t)}
                className={`h-11 rounded-field border text-[13.5px] font-semibold transition-colors ${
                  time === t ? 'border-primary bg-tint text-primary-text' : 'border-line bg-white text-label hover:border-primary/50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>
      </div>

      {/* 동의 (분리 체크) */}
      <div className="mt-4 flex flex-col gap-3 rounded-card bg-white p-5 shadow-card">
        <Consent
          checked={agreePrivacy} onChange={setAgreePrivacy} onDetail={() => setTermsOpen(true)}
          label={<><em className="not-italic font-bold text-primary-text">[필수]</em> 개인정보 수집·이용 동의</>}
        />
        <Consent
          checked={agreeMkt} onChange={setAgreeMkt} onDetail={() => setTermsOpen(true)}
          label={<><em className="not-italic font-semibold text-faint">[선택]</em> 혜택 정보 마케팅 수신 동의</>}
        />
      </div>

      {/* 항상 활성 — 누락 시 토스트로 첫 번째 빈 항목을 안내 */}
      <button
        onClick={submit}
        className="glass-btn-cta mt-5 h-[54px] w-full rounded-btn bg-primary text-[16px] font-bold text-white transition-colors hover:bg-primary-hover"
      >
        무료 상담 신청하기
      </button>
      <p className="mt-3 text-center text-[11.5px] leading-4 text-label">{LEGAL.privacy} {LEGAL.policy}</p>

      {/* 약관 전문 — 필수·선택 두 섹션을 한 모달로 */}
      <Modal open={termsOpen} onClose={() => setTermsOpen(false)} title="약관 전문">
        <div className="flex flex-col gap-5 text-[13px] leading-6">
          <section>
            <div className="font-bold text-ink">[필수] 개인정보 수집·이용 동의</div>
            <ul className="mt-1.5 flex flex-col gap-1 text-muted">
              <li>· 수집 항목: 이름, 연락처, 지역(시·군·구)</li>
              <li>· 이용 목적: 상담 연결 및 상담 파트너 배정</li>
              <li>· 보유 기간: 상담 완료 후 1년 또는 동의 철회 시까지</li>
              <li>· 제3자 제공: 배정된 상담 파트너에 한해 제공됩니다</li>
            </ul>
            <p className="mt-1.5 text-[12px] text-faint">동의를 거부하실 수 있으나, 거부 시 상담 신청이 제한됩니다.</p>
          </section>
          <section>
            <div className="font-bold text-ink">[선택] 혜택 정보 마케팅 수신 동의</div>
            <p className="mt-1.5 text-muted">할인·프로모션 등 혜택 정보를 문자·알림톡으로 받아보실 수 있어요. 동의하지 않아도 상담 이용에는 제한이 없으며, 언제든 수신 거부할 수 있습니다.</p>
          </section>
        </div>
        <Btn className="mt-5 w-full" onClick={() => setTermsOpen(false)}>확인</Btn>
      </Modal>
    </main>
  )
}

function Consent({ checked, onChange, label, onDetail }) {
  return (
    <div className="flex items-center justify-between">
      <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-3 text-left">
        <span className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border text-[13px] text-white transition-colors ${checked ? 'border-primary bg-primary' : 'border-line bg-white'}`}>✓</span>
        <span className="text-[13.5px] text-body">{label}</span>
      </button>
      <button type="button" onClick={onDetail} className="text-[12px] text-faint underline hover:text-label">전문 보기</button>
    </div>
  )
}

function SummaryRow({ k, v, accent }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-label">{k}</span>
      <span className={`text-right font-semibold ${accent ? 'text-primary-text' : 'text-ink'}`}>{v}</span>
    </div>
  )
}
