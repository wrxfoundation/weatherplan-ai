import { useEffect, useRef, useState } from 'react'
import { submitLead, mailtoFor, inquiryText, hasContactEmail, leadReasonLabel, CONTACT_EMAIL } from '../data/leadApi.js'

const TYPES = ['정밀 리포트 요청', 'Pro/구독 관심', '제휴 (EPC·냉각·PPA·법무)', '데이터·API', '매각·투자 문의', '기타 문의']

/* 문의/리드 접수 모달 — 정직성: 서버 웹훅 전달 성공 시에만 '접수됨'. 미설정 시 mailto/클립보드 폴백. */
export default function LeadDialog({ open, onClose, defaultType = '정밀 리포트 요청', context = '' }) {
  const [form, setForm] = useState({ type: defaultType, name: '', company: '', email: '', phone: '', mw: '', region: '', message: '' })
  const [state, setState] = useState('idle') // idle | sending | sent | fallback | error
  const [reason, setReason] = useState(null)
  const [copied, setCopied] = useState(false)
  const firstRef = useRef(null)

  useEffect(() => {
    if (open) {
      setForm((f) => ({ ...f, type: defaultType }))
      setState('idle')
      setReason(null)
      setTimeout(() => firstRef.current?.focus(), 40)
    }
  }, [open, defaultType])

  if (!open) return null

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const payload = { ...form, context }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (state === 'sending') return
    if (!form.email && !form.phone) {
      setState('error')
      setReason('missing_contact')
      return
    }
    setState('sending')
    const res = await submitLead(payload)
    if (res.ok) {
      setState('sent')
    } else if (res.reason === 'not_configured') {
      setState('fallback') // 웹훅 미설정 — 대체 경로 안내(정직)
      setReason(res.reason)
    } else {
      setState('error')
      setReason(res.reason)
    }
  }

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(inquiryText(payload))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* noop */
    }
  }

  const mailto = mailtoFor(payload)

  return (
    <div className="lead-overlay" role="presentation" onClick={onClose}>
      <div
        className="lead-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="문의하기"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose()
        }}
      >
        <div className="lead-head">
          <span className="ai-badge">✦ 문의하기</span>
          <button type="button" className="lead-x" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        {state === 'sent' ? (
          <div className="lead-done" role="status">
            <div className="lead-done-ic">✓</div>
            <h4>문의가 접수됐습니다</h4>
            <p>확인 후 입력하신 연락처로 회신드리겠습니다. 감사합니다.</p>
            <button type="button" className="btn primary" onClick={onClose}>
              닫기
            </button>
          </div>
        ) : (
          <form className="lead-form" onSubmit={onSubmit}>
            <p className="lead-sub">
              데이터센터 부지 검토·정밀 리포트·제휴·데이터 이용에 대해 문의하세요. 공개 데이터 기반 도구이며, 상용 리포트/컨설팅은 검토 후 개별 안내드립니다.
            </p>
            <label>
              문의 유형
              <select ref={firstRef} value={form.type} onChange={set('type')}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <div className="lead-grid2">
              <label>
                이름
                <input type="text" value={form.name} onChange={set('name')} placeholder="홍길동" />
              </label>
              <label>
                회사/소속
                <input type="text" value={form.company} onChange={set('company')} placeholder="○○디벨로퍼" />
              </label>
              <label>
                이메일
                <input type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" />
              </label>
              <label>
                연락처
                <input type="tel" value={form.phone} onChange={set('phone')} placeholder="010-0000-0000" />
              </label>
              <label>
                검토 용량 (MW)
                <input type="text" value={form.mw} onChange={set('mw')} placeholder="예: 40" inputMode="numeric" />
              </label>
              <label>
                관심 지역
                <input type="text" value={form.region} onChange={set('region')} placeholder="예: 비수도권 / 전남" />
              </label>
            </div>
            <label>
              내용
              <textarea value={form.message} onChange={set('message')} rows={3} placeholder="검토 배경·필요 사항을 적어주세요." />
            </label>
            {context && <div className="lead-ctx">첨부 맥락: {context}</div>}
            <p className="lead-note">
              연락은 이메일 또는 연락처 중 하나만 있어도 됩니다. 직접 메일을 선호하시면{' '}
              <a href={mailto || `mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> 로 보내주세요.
            </p>

            {state === 'fallback' && (
              <div className="lead-fallback" role="status">
                <b>자동 접수 채널이 아직 연동되지 않았습니다.</b> 아래 방법으로 전달해 주세요 — 내용은 그대로 담겨 있습니다.
                <div className="lead-fallback-actions">
                  {hasContactEmail() && mailto && (
                    <a className="btn primary" href={mailto}>
                      이메일로 보내기
                    </a>
                  )}
                  <button type="button" className="btn" onClick={onCopy}>
                    {copied ? '복사됨 ✓' : '내용 복사'}
                  </button>
                </div>
              </div>
            )}
            {state === 'error' && (
              <div className="lead-err" role="alert">
                {leadReasonLabel(reason)}
              </div>
            )}

            {state !== 'fallback' && (
              <button type="submit" className="btn primary lead-submit" disabled={state === 'sending'}>
                {state === 'sending' ? '전송 중…' : '문의 보내기'}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
