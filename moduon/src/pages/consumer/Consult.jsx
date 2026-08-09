// ─── S-04 상담 신청 + 완료 (목업 #3a/#3b) — 30초 완성 리드 폼 ────
import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { CATEGORIES, CONSULT_TIMES, REGIONS, LEGAL } from '../../lib/constants'
import { maskPhone, phoneValid, won } from '../../lib/engine'
import { Field, inputCls, useToast } from '../../components/ui'

export default function Consult() {
  const { db, dispatch } = useStore()
  const [params] = useSearchParams()
  const loc = useLocation()
  const nav = useNavigate()
  const toast = useToast()

  const src = params.get('src') // 파트너몰 slug
  const tenant = src ? db.tenants.find((t) => t.slug === src) : null
  const quote = loc.state?.quote ?? null

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [sigungu, setSigungu] = useState('')
  const [cats, setCats] = useState(params.get('cat') ? [params.get('cat')] : quote ? ['internet'] : [])
  const [time, setTime] = useState('지금 바로')
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeMkt, setAgreeMkt] = useState(false)
  const [done, setDone] = useState(null)

  const valid = name.trim().length >= 2 && phoneValid(phone) && sigungu && cats.length > 0 && agreePrivacy

  const toggleCat = (slug) => setCats((c) => (c.includes(slug) ? c.filter((x) => x !== slug) : [...c, slug]))

  const submit = () => {
    if (!valid) return
    dispatch({
      type: 'CREATE_LEAD',
      payload: { name: name.trim(), phone: phone.trim(), sigungu, cat: cats[0], wish: time, source: src ?? 'main', quote },
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

        <div className="mt-7 text-[13px] font-semibold text-faint">기다리는 동안 이런 혜택은 어때요?</div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button onClick={() => nav('/calculator')} className="relative overflow-hidden rounded-card p-4 text-left text-white transition-transform hover:-translate-y-[3px]" style={{ background: 'linear-gradient(180deg,#5B80D9,#5174CD)' }}>
            <div className="text-[12px] font-bold text-white/80">인터넷/TV</div>
            <div className="mt-0.5 text-[14px] font-extrabold leading-5">결합하면 월 11,100원 절약</div>
            <img src="/assets/obj-wifi.webp" alt="" className="obj-mask absolute -bottom-2 -right-2 h-16 w-16 object-contain" />
          </button>
          <button onClick={() => nav('/diagnosis')} className="relative overflow-hidden rounded-card p-4 text-left text-white transition-transform hover:-translate-y-[3px]" style={{ background: 'linear-gradient(180deg,#F98974,#F7745F)' }}>
            <div className="text-[12px] font-bold text-white/80">AI 진단</div>
            <div className="mt-0.5 text-[14px] font-extrabold leading-5">1분 만에 생활비 새는 곳 찾기</div>
            <img src="/assets/obj-purifier.webp" alt="" className="obj-mask absolute -bottom-2 -right-2 h-16 w-16 object-contain" />
          </button>
        </div>

        <button onClick={() => nav(tenant ? `/m/${tenant.slug}` : '/')} className="mt-8 h-[52px] w-full rounded-btn bg-primary text-[15px] font-bold text-white shadow-cta hover:bg-primary-hover">
          확인
        </button>
      </main>
    )
  }

  // ── 신청 폼 (#3a) ──
  return (
    <main className="mx-auto max-w-md px-5 pb-16">
      <div className="pt-6">
        {tenant && (
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-primary-text shadow-card">
            🏪 {tenant.name} 파트너몰 상담
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
            <span className="font-bold text-ink">📄 계산기에서 가져온 구성</span>
            <Link to="/calculator" className="font-semibold text-primary-text">수정</Link>
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
          <select className={`${inputCls} appearance-none ${sigungu ? '' : 'text-disabled'}`} value={sigungu} onChange={(e) => setSigungu(e.target.value)}>
            <option value="" disabled>시·군·구를 선택하세요</option>
            {REGIONS.map((r) => <option key={r.sigungu} value={r.sigungu}>{r.sigungu}</option>)}
          </select>
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
          checked={agreePrivacy} onChange={setAgreePrivacy}
          label={<><em className="not-italic font-bold text-primary-text">[필수]</em> 개인정보 수집·이용 동의</>}
        />
        <Consent
          checked={agreeMkt} onChange={setAgreeMkt}
          label={<><em className="not-italic font-semibold text-faint">[선택]</em> 혜택 정보 마케팅 수신 동의</>}
        />
      </div>

      <button
        onClick={submit}
        disabled={!valid}
        className="mt-5 h-[54px] w-full rounded-btn bg-primary text-[16px] font-bold text-white shadow-cta transition-colors hover:bg-primary-hover disabled:shadow-none"
      >
        무료 상담 신청하기
      </button>
      <p className="mt-3 text-center text-[11.5px] leading-4 text-disabled">{LEGAL.privacy} {LEGAL.policy}</p>
    </main>
  )
}

function Consent({ checked, onChange, label }) {
  return (
    <div className="flex items-center justify-between">
      <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-3 text-left">
        <span className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border text-[13px] text-white transition-colors ${checked ? 'border-primary bg-primary' : 'border-line bg-white'}`}>✓</span>
        <span className="text-[13.5px] text-body">{label}</span>
      </button>
      <button type="button" className="text-[12px] text-faint underline hover:text-label">전문 보기</button>
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
