// ─── S-03 견적 계산기 (목업 #4a/#4b) — "고를수록 월 납부금이 보인다" ──
import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { calcQuote, won, copyText, CARRIERS, SPEED_MAP, BUNDLE_MAP, BUNDLE_LABEL, PAYOUTS, payout } from '../../lib/engine'
import { LEGAL } from '../../lib/constants'
import { useToast } from '../../components/ui'
import { CalcTabs } from './PhoneCalculator'
import InstallCheck from '../../components/InstallCheck'

export default function Calculator() {
  const nav = useNavigate()
  const toast = useToast()
  const [sp] = useSearchParams()
  const loc = useLocation()
  // 프리셋: 요금표(state.preset)·설치조회(state 직접 {carrier,speed,sigungu}) > 공유 링크 쿼리(?carrier=&speed=&bundle=&promo=1) > 기본값
  const preset = loc.state?.preset ?? loc.state ?? { carrier: sp.get('carrier'), speed: sp.get('speed'), bundle: sp.get('bundle'), promo: sp.get('promo') === '1' }
  // 기본 상태: KT · 500M · 정수기 결합 · 프로모션 off → 32,900원 / 사은품 350,000원 (PRD 인수 기준)
  const [carrier, setCarrier] = useState(CARRIERS.includes(preset?.carrier) ? preset.carrier : 'KT')
  const [speed, setSpeed] = useState(SPEED_MAP[preset?.speed] ? preset.speed : '500M')
  const [bundle, setBundle] = useState(BUNDLE_MAP[preset?.bundle] !== undefined ? preset.bundle : 'water')
  const [promo, setPromo] = useState(preset?.promo === true)
  const [payoutM, setPayoutM] = useState('cash')
  const [copied, setCopied] = useState(false)

  const q = useMemo(() => calcQuote({ carrier, speed, bundle, promo }), [carrier, speed, bundle, promo])
  const pay = payout(q.gift, payoutM)
  const payLabel = PAYOUTS.find((p) => p.key === payoutM)?.label ?? '현금'
  // 다음 행동 + 기대 효과 힌트 (axion 델타 문장 패턴)
  const hint = bundle === 'none' ? `정수기 결합을 추가하면 월 ${won(11100)} 더 내려가요`
    : !promo ? `신규가입 프로모션을 켜면 월 ${won(3000)} 더 내려가요` : null

  const goConsult = () => nav('/consult?cat=internet', { state: { quote: { carrier, speed, bundle: BUNDLE_LABEL[bundle], promo, payout: payLabel, ...q } } })

  // 결과 공유 — 같은 조건으로 열리는 링크 + 면책 문구를 카톡용 텍스트로 (axion 흡수)
  const share = async () => {
    const url = `${window.location.origin}/calculator?carrier=${encodeURIComponent(carrier)}&speed=${speed}&bundle=${bundle}${promo ? '&promo=1' : ''}`
    const payTxt = pay.kind === 'monthly' ? `월 ${won(pay.monthly)} 요금할인` : `${payLabel} ${won(pay.lump)}`
    const text = `[모두온 인터넷 견적]\n${carrier} 인터넷 ${speed}${bundle !== 'none' ? ` + ${BUNDLE_LABEL[bundle]}` : ''}\n월 납부금 ${won(q.total)} · 사은품 ${payTxt}\n같은 조건으로 계산해 보기 → ${url}\n※ 예상 견적이며 최종 조건은 상담 시 확정됩니다.`
    if (await copyText(text)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-5 pb-28 sm:px-10 lg:pb-0">
      <div className="pt-8 sm:pt-12">
        <CalcTabs active="internet" />
        <h1 className="mt-4 text-[24px] font-extrabold tracking-[-0.6px] text-ink sm:text-[26px]">인터넷 견적 계산기</h1>
        <p className="mt-1.5 text-[14px] text-muted sm:text-[15px]">조건을 고를 때마다 월 납부금이 실시간으로 계산돼요.</p>
      </div>

      <div className="mt-5">
        {/* 조회 결과를 이동 없이 현재 견적에 바로 반영 (가능 통신사 중 첫 번째 + 최대 속도) */}
        <InstallCheck onPrefill={(res) => {
          const best = res?.carriers?.find((c) => c.ok)
          if (!best) { toast('설치 가능 통신사가 없어 상담 확인이 필요해요', 'err'); return }
          setCarrier(best.name)
          if (SPEED_MAP[best.max]) setSpeed(best.max)
          toast('조회 결과를 견적에 반영했어요')
        }} />
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_400px]">
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
            {/* 핸드오프 #4b: 모바일에서는 행형 리스트 */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
              {Object.entries(BUNDLE_MAP).map(([b, dc]) => (
                <button
                  key={b}
                  onClick={() => setBundle(b)}
                  className={`relative flex items-center justify-between gap-2 rounded-btn border p-3.5 text-left transition-all sm:flex-col sm:items-start sm:justify-start sm:p-4 ${
                    bundle === b ? 'border-[1.5px] border-primary bg-tint' : 'border-line bg-white hover:border-primary/50'
                  }`}
                >
                  <span className="flex items-center gap-2.5 sm:block">
                    <span className={`h-[18px] w-[18px] shrink-0 rounded-full sm:absolute sm:right-3 sm:top-3 ${bundle === b ? 'border-[6px] border-primary bg-white' : 'border border-line bg-white'}`} />
                    <span className="text-[13.5px] font-bold text-ink">{BUNDLE_LABEL[b]}</span>
                  </span>
                  <span className={`tnum text-[12.5px] font-bold sm:mt-1 ${dc ? 'text-ok' : 'text-faint'}`}>{dc ? `월 −${won(dc)}` : '할인 없음'}</span>
                </button>
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

          <StepCard no={5} title="사은품 받는 방식 — 현금이 제일 커요">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {PAYOUTS.map((p) => {
                const pv = payout(q.gift, p.key)
                return (
                  <button
                    key={p.key}
                    onClick={() => setPayoutM(p.key)}
                    className={`relative flex flex-col items-start rounded-btn border p-4 text-left transition-all ${payoutM === p.key ? 'border-[1.5px] border-primary bg-tint' : 'border-line bg-white hover:border-primary/50'}`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="text-[13.5px] font-bold text-ink">{p.label}</span>
                      {p.badge && <span className="rounded-full bg-orange-tint px-1.5 py-0.5 text-[10px] font-bold text-orange-text">{p.badge}</span>}
                    </span>
                    <span className="tnum mt-1 text-[16px] font-extrabold text-primary-text">
                      {pv.kind === 'monthly' ? `월 ${won(pv.monthly)}` : won(pv.lump)}
                    </span>
                    <span className="mt-0.5 text-[11px] leading-4 text-faint">{p.sub}</span>
                  </button>
                )
              })}
            </div>
          </StepCard>

          {/* 모바일 전용 — 합계 상세 분해 (데스크톱은 우측 스티키 카드) */}
          <section className="rounded-card bg-white p-5 shadow-card lg:hidden">
            <div className="text-[13px] font-bold text-ink">나의 구성 상세</div>
            <div className="mt-3 flex flex-col gap-2 text-[13.5px]">
              <Row label="월 기본요금" value={won(q.base)} />
              <Row label="결합 할인" value={q.bundleDc ? `−${won(q.bundleDc)}` : '미선택'} accent={q.bundleDc ? 'text-ok' : 'text-disabled'} />
              <Row label="프로모션 할인" value={q.promoDc ? `−${won(q.promoDc)}` : '미선택'} accent={q.promoDc ? 'text-ok' : 'text-disabled'} />
            </div>
            {hint && <div className="mt-3 rounded-field bg-tint px-3.5 py-2.5 text-[12px] font-semibold leading-4 text-primary-text">💡 {hint}</div>}
            <div className="mt-2.5 border-t border-dashed border-line pt-2.5 text-[11.5px] text-faint">약정 3년 · 설치비 무료 — {LEGAL.quote}</div>
          </section>
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

          <div className="mt-4 rounded-field bg-orange-tint px-4 py-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-orange-text">🎁 {payLabel} 사은품</span>
              <span className="tnum text-[20px] font-extrabold text-orange-text">
                {pay.kind === 'monthly' ? `월 ${won(pay.monthly)}` : won(pay.lump)}
              </span>
            </div>
            <div className="mt-1 text-[11px] leading-4 text-orange-text/80">
              {pay.kind === 'monthly' ? `${pay.months}개월 자동 차감 · 총 ${won(pay.total)} 상당` : PAYOUTS.find((p) => p.key === payoutM)?.sub}
            </div>
          </div>
          {hint && <div className="mt-2 rounded-field bg-tint px-3.5 py-2.5 text-[12px] font-semibold leading-4 text-primary-text">💡 {hint}</div>}
          <div className="mt-2 text-center text-[12px] text-faint">약정 3년 · 설치비 무료</div>

          <button onClick={goConsult} className="shimmer-cta glass-btn-cta mt-5 h-[52px] w-full rounded-btn bg-primary text-[15px] font-bold text-white transition-colors hover:bg-primary-hover">
            상담 신청하고 혜택 확정하기
          </button>
          <button onClick={share} className="glass-btn mt-2 h-11 w-full rounded-btn border border-line bg-white text-[13.5px] font-bold text-label transition-colors hover:border-primary hover:text-primary-text">
            {copied ? '✓ 복사됐어요 — 카톡에 붙여넣으세요' : '견적 공유하기'}
          </button>
          <p className="mt-3 text-center text-[11.5px] leading-4 text-disabled">{LEGAL.quote}</p>
        </aside>
      </div>

      {/* ── 모바일 하단 고정 바 ── */}
      <div className="safe-b fixed inset-x-0 bottom-0 z-40 rounded-t-card bg-white px-5 pb-4 pt-4 shadow-bottombar lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-faint">월 납부금</div>
            <div className="tnum text-[24px] font-extrabold tracking-tight text-primary-text">{won(q.total)}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-semibold text-faint">{payLabel} 사은품</div>
            <div className="tnum text-[15px] font-extrabold text-orange-text">{pay.kind === 'monthly' ? `월 ${won(pay.monthly)}` : won(pay.lump)}</div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={share} aria-label="견적 공유" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-btn border border-line bg-white text-[17px]">
            {copied ? '✓' : '📤'}
          </button>
          <button onClick={goConsult} className="shimmer-cta glass-btn-cta h-12 flex-1 rounded-btn bg-primary text-[15px] font-bold text-white">
            상담 신청하고 혜택 확정하기
          </button>
        </div>
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
