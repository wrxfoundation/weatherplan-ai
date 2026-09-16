// ─── P-01 분양 신청 — 소재지=권역 자동 판정, 어드민 승인 큐로 연결 ──
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { REGIONS, unitBySigungu, unitName, LEGAL } from '../../lib/constants'
import { phoneValid, won, saUpGwonFee } from '../../lib/engine'
import { Field, inputCls, Logo, useToast } from '../../components/ui'

export default function PartnerApply() {
  const { db, dispatch } = useStore()
  const nav = useNavigate()
  const toast = useToast()
  const [type, setType] = useState('개인')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [sigungu, setSigungu] = useState('')
  const [wantName, setWantName] = useState('')
  const [wantSlug, setWantSlug] = useState('')
  const [memo, setMemo] = useState('')
  const [agree, setAgree] = useState(false)
  const [done, setDone] = useState(false)

  const unit = useMemo(() => (sigungu ? unitBySigungu(sigungu) : null), [sigungu])
  const slugTaken = wantSlug && db.tenants.some((t) => t.slug === wantSlug)
  const slugValid = /^[a-z0-9-]{3,20}$/.test(wantSlug)
  const valid = name.trim().length >= 2 && phoneValid(phone) && sigungu && wantName.trim().length >= 2 && slugValid && !slugTaken && agree

  const submit = () => {
    if (!valid) return
    dispatch({ type: 'ADD_APPLICATION', payload: { name: name.trim(), phone: phone.trim(), type, sigungu, wantName: wantName.trim(), wantSlug, memo } })
    setDone(true)
    toast('분양 신청이 접수되었어요!')
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-5 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full text-white shadow-panel" style={{ background: 'linear-gradient(135deg,#5B80D9,#5174CD)' }}>
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m4.5 12.5 5 5 10-11" /></svg>
        </div>
        <h1 className="mt-6 text-[24px] font-extrabold text-ink">분양 신청 완료!</h1>
        <p className="mt-3 max-w-sm text-[14.5px] leading-6 text-muted">
          담당 매니저가 <strong className="font-bold text-primary-text">1영업일 내</strong>에 연락드려 심사와 계약 절차를 안내해 드려요.
          승인되면 <strong className="font-bold text-ink">moduon.com/m/{wantSlug}</strong> 주소로 내 몰이 열립니다.
        </p>
        <div className="mt-8 flex gap-3">
          <Link to="/partner" className="inline-flex h-12 items-center rounded-btn border border-line-soft bg-white px-6 text-[14.5px] font-bold text-body">랜딩으로</Link>
          <Link to="/login" className="inline-flex h-12 items-center rounded-btn bg-primary px-6 text-[14.5px] font-bold text-white">데모 마이오피스 구경 →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream pb-16">
      <header className="mx-auto flex h-[64px] max-w-md items-center justify-between px-5">
        <button onClick={() => nav(-1)} className="text-[20px] text-label" aria-label="뒤로">←</button>
        <Logo size="sm" />
        <span className="w-5" />
      </header>

      <main className="mx-auto max-w-md px-5">
        <h1 className="text-[24px] font-extrabold tracking-tight text-ink">분양 신청</h1>
        <p className="mt-1.5 text-[14px] text-muted">
          대리점 분양몰 가입비 <strong className="tnum font-bold text-ink">{won(db.policies.joinFee)}</strong> · 월 이용료 <strong className="tnum font-bold text-ink">{won(db.policies.monthlyFee)}</strong> — 결제는 승인 후 안내돼요.
        </p>

        <div className="mt-6 flex flex-col gap-4 rounded-card bg-white p-5 shadow-card">
          <Field label="신청 유형" required>
            <div className="grid grid-cols-2 gap-2">
              {['개인', '사업자'].map((t) => (
                <button key={t} type="button" onClick={() => setType(t)} className={`h-11 rounded-field border text-[14px] font-semibold transition-colors ${type === t ? 'border-primary bg-tint text-primary-text' : 'border-line bg-white text-label'}`}>
                  {t}
                </button>
              ))}
            </div>
          </Field>
          <Field label="이름 (대표자)" required>
            <input className={inputCls} placeholder="홍길동" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="연락처" required>
            <input className={inputCls} placeholder="010-0000-0000" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="소재지 (권역 결정 기준)" required hint={unit ? `${unitName(unit)} 관할 · 이 권역 사업권(총판) 시세 ${won(saUpGwonFee(sigungu))}` : '사업자등록증 주소지 기준으로 권역이 배정돼요'}>
            <select className={`${inputCls} appearance-none ${sigungu ? '' : 'text-disabled'}`} value={sigungu} onChange={(e) => setSigungu(e.target.value)}>
              <option value="" disabled>시·군·구를 선택하세요</option>
              {REGIONS.map((r) => <option key={r.sigungu} value={r.sigungu}>{r.sigungu}</option>)}
            </select>
          </Field>
          <Field label="희망 몰 이름" required>
            <input className={inputCls} placeholder="예) 강남으뜸통신" value={wantName} onChange={(e) => setWantName(e.target.value)} />
          </Field>
          <Field
            label="희망 몰 주소" required
            hint={wantSlug ? (slugTaken ? '이미 사용 중인 주소예요' : slugValid ? `moduon.com/m/${wantSlug} 로 열려요` : '영문 소문자·숫자·하이픈 3~20자') : '영문 소문자·숫자·하이픈 3~20자'}
          >
            <div className="flex items-center overflow-hidden rounded-field border border-line bg-white focus-within:border-primary">
              <span className="shrink-0 pl-4 text-[13.5px] text-faint">moduon.com/m/</span>
              <input className="h-12 w-full px-1 text-[15px] text-ink placeholder:text-disabled" placeholder="myshop" value={wantSlug} onChange={(e) => setWantSlug(e.target.value.toLowerCase().trim())} />
            </div>
          </Field>
          <Field label="영업 경력·소개 (선택)">
            <textarea className="min-h-[80px] w-full rounded-field border border-line bg-white p-4 text-[14px] placeholder:text-disabled focus:border-primary" placeholder="예) 통신 대리점 3년, 렌탈 영업 경력" value={memo} onChange={(e) => setMemo(e.target.value)} />
          </Field>
        </div>

        <div className="mt-4 rounded-card bg-white p-5 shadow-card">
          <button type="button" onClick={() => setAgree(!agree)} className="flex items-center gap-3 text-left">
            <span className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border text-[13px] text-white transition-colors ${agree ? 'border-primary bg-primary' : 'border-line bg-white'}`}>✓</span>
            <span className="text-[13.5px] text-body"><em className="not-italic font-bold text-primary-text">[필수]</em> 개인정보 수집·이용 및 분양 상담 연락 동의</span>
          </button>
        </div>

        <button onClick={submit} disabled={!valid} className="mt-5 h-[54px] w-full rounded-btn bg-primary text-[16px] font-bold text-white shadow-cta transition-colors hover:bg-primary-hover disabled:shadow-none disabled:opacity-40">
          분양 신청 접수하기
        </button>
        <p className="mt-3 text-center text-[11.5px] leading-4 text-disabled">{LEGAL.profit}</p>
      </main>
    </div>
  )
}
