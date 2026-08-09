// ─── S-03 견적 계산기 (목업 #4a/#4b) — "고를수록 월 납부금이 보인다" ──
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { calcQuote, won, CARRIERS, SPEED_MAP, BUNDLE_MAP, BUNDLE_LABEL } from '../../lib/engine'
import { LEGAL } from '../../lib/constants'

export default function Calculator() {
  const nav = useNavigate()
  // 기본 상태: KT · 500M · 정수기 결합 · 프로모션 off → 32,900원 / 사은품 350,000원 (PRD 인수 기준)
  const [carrier, setCarrier] = useState('KT')
  const [speed, setSpeed] = useState('500M')
  const [bundle, setBundle] = useState('water')
  const [promo, setPromo] = useState(false)

  const q = useMemo(() => calcQuote({ speed, bundle, promo }), [speed, bundle, promo])

  const goConsult = () => nav('/consult?cat=internet', { state: { quote: { carrier, speed, bundle: BUNDLE_LABEL[bundle], promo, ...q } } })

  return (
    <main className="mx-auto max-w-6xl px-5 pb-28 sm:px-10 lg:pb-0">
      <div className="pt-8 sm:pt-12">
        <h1 className="text-[24px] font-extrabold tracking-[-0.6px] text-ink sm:text-[26px]">인터넷 견적 계산기</h1>
        <p className="mt-1.5 text-[14px] text-muted sm:text-[15px]">조건을 고를 때마다 월 납부금이 실시간으로 계산돼요.</p>
      </div>

      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[1fr_400px]">
        {/* ── 좌: 스텝 카드 4 ── */}
        <div className="flex flex-col gap-4">
          <StepCard no={1} title="통신사를 선택하세요">
            <div className="grid grid-cols-3 gap-3">
              {CARRIERS.map((c) => (
                <OptionCard key={c} active={carrier === c} onClick={() => setCarrier(c)}>
                  <span className="flex h-[30px] w-[46px] items-center justify-center rounded bg-brow text-[10px] font-bold text-bfaint">LOGO</span>
                  <span className="mt-2 text-[13.5px] font-bold text-ink">{c}</span>
                </OptionCard>
              ))}
            </div>
          </StepCard>

          <StepCard no={2} title="인터넷 속도를 선택하세요">
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(SPEED_MAP).map(([s, price]) => (
                <OptionCard key={s} active={speed === s} onClick={() => setSpeed(s)}>
                  <span className="text-[16px] font-extrabold text-ink">{s}</span>
                  <span className="tnum mt-1 text-[12.5px] font-semibold text-label">{won(price)}/월</span>
                  <span className="mt-0.5 text-[11px] text-faint">{s === '100M' ? '1~2인 가구' : s === '500M' ? '가장 인기' : '4K·게임 최적'}</span>
                </OptionCard>
              ))}
            </div>
          </StepCard>

          <StepCard no={3} title="결합 상품을 선택하세요">
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(BUNDLE_MAP).map(([b, dc]) => (
                <OptionCard key={b} active={bundle === b} onClick={() => setBundle(b)}>
                  <span className="text-[13.5px] font-bold text-ink">{BUNDLE_LABEL[b]}</span>
                  <span className={`tnum mt-1 text-[12.5px] font-bold ${dc ? 'text-ok' : 'text-faint'}`}>{dc ? `월 −${won(dc)}` : '할인 없음'}</span>
                </OptionCard>
              ))}
            </div>
          </StepCard>

          <StepCard no={4} title="추가 혜택">
            <button
              onClick={() => setPromo(!promo)}
              className={`flex w-full items-center justify-between rounded-btn border p-4 text-left transition-colors ${promo ? 'border-primary bg-tint' : 'border-line bg-white hover:border-primary/50'}`}
            >
              <div className="flex items-center gap-3">
                <span className={`flex h-[22px] w-[22px] items-center justify-center rounded-md border text-[13px] text-white transition-colors ${promo ? 'border-primary bg-primary' : 'border-line bg-white'}`}>✓</span>
                <div>
                  <div className="text-[14px] font-bold text-ink">신규가입 프로모션 적용</div>
                  <div className="text-[12px] text-faint">가입 후 12개월 간 적용 · 조건 상담 시 확정</div>
                </div>
              </div>
              <span className="tnum text-[13.5px] font-bold text-ok">월 −{won(3000)}</span>
            </button>
          </StepCard>
        </div>

        {/* ── 우: 스티키 합계 카드 (데스크톱) ── */}
        <aside className="sticky top-24 hidden rounded-section bg-white p-6 shadow-panel lg:block">
          <div className="text-[12.5px] font-semibold text-faint">나의 구성</div>
          <div className="mt-1 text-[15px] font-bold text-ink">{carrier} 인터넷 {speed}{bundle !== 'none' ? ` + ${BUNDLE_LABEL[bundle]}` : ''}</div>

          <div className="mt-5 flex flex-col gap-2.5 text-[14px]">
            <Row label="월 기본요금" value={won(q.base)} />
            <Row label="결합 할인" value={q.bundleDc ? `−${won(q.bundleDc)}` : '미선택'} accent={q.bundleDc ? 'text-ok' : 'text-disabled'} />
            <Row label="프로모션 할인" value={q.promoDc ? `−${won(q.promoDc)}` : '미선택'} accent={q.promoDc ? 'text-ok' : 'text-disabled'} />
          </div>

          <div className="my-4 border-t border-dashed border-line" />
          <div className="flex items-baseline justify-between">
            <span className="text-[14px] font-bold text-ink">월 납부금</span>
            <span className="tnum text-[34px] font-extrabold tracking-[-1px] text-primary-text">{won(q.total)}</span>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-field bg-orange-tint px-4 py-3">
            <span className="text-[13px] font-bold text-orange-text">🎁 사은품 혜택</span>
            <span className="tnum text-[16px] font-extrabold text-orange-text">{won(q.gift)}</span>
          </div>
          <div className="mt-2 text-center text-[12px] text-faint">약정 3년 · 설치비 무료</div>

          <button onClick={goConsult} className="mt-5 h-[52px] w-full rounded-btn bg-primary text-[15px] font-bold text-white shadow-cta transition-colors hover:bg-primary-hover">
            상담 신청하고 혜택 확정하기
          </button>
          <p className="mt-3 text-center text-[11.5px] leading-4 text-disabled">{LEGAL.quote}</p>
        </aside>
      </div>

      {/* ── 모바일 하단 고정 바 ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-card bg-white px-5 pb-5 pt-4 shadow-bottombar lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-faint">월 납부금</div>
            <div className="tnum text-[24px] font-extrabold tracking-tight text-primary-text">{won(q.total)}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-semibold text-faint">사은품</div>
            <div className="tnum text-[15px] font-extrabold text-orange-text">{won(q.gift)}</div>
          </div>
        </div>
        <button onClick={goConsult} className="mt-3 h-12 w-full rounded-btn bg-primary text-[15px] font-bold text-white">
          상담 신청하고 혜택 확정하기
        </button>
      </div>
    </main>
  )
}

function StepCard({ no, title, children }) {
  return (
    <section className="rounded-card bg-white p-5 shadow-card sm:p-6 animate-rise">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-tint text-[13px] font-bold text-primary-text">{no}</span>
        <h2 className="text-[16px] font-bold text-ink">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function OptionCard({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-start rounded-btn border p-3.5 text-left transition-all sm:p-4 ${
        active ? 'border-[1.5px] border-primary bg-tint' : 'border-line bg-white hover:border-primary/50'
      }`}
    >
      <span className={`absolute right-3 top-3 h-[18px] w-[18px] rounded-full ${active ? 'border-[6px] border-primary bg-white' : 'border border-line bg-white'}`} />
      {children}
    </button>
  )
}

function Row({ label, value, accent = 'text-ink' }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-label">{label}</span>
      <span className={`tnum font-bold ${accent}`}>{value}</span>
    </div>
  )
}
