// ─── 우측 플로팅 패널 "MODUON 알아보기" (아정당식) ─────────────────────
// 데스크톱(lg 이상)에서만 렌더 — 모바일은 ChatWidget FAB 가 같은 역할을 한다.
// · ≥1600px(여백 모드): 콘텐츠(max-w-6xl) 옆 여백에 펼쳐진 채 상주. 왼쪽 › 탭으로 접을 수 있다.
// · 1024~1599px(오버레이 모드): 세로 탭("상담하기")만 보이고, 클릭하면 콘텐츠 위로 펼쳐진다.
//   다시 클릭·바깥 클릭·Escape·라우트 이동 시 접힌다.
// 접힘/펼침은 localStorage 'moduon_fp_open' 에 기억한다 — 여백 모드의 초기 상태에만 적용하고,
// 오버레이 모드는 늘 접힌 채 시작한다(페이지를 열 때마다 콘텐츠를 덮지 않게).
// 문구·노출 여부는 db.benefits.floating(어드민 혜택 설정), 번호·운영시간은 HQ_TEL·HQ_HOURS_SHORT 단일 소스(고객센터와 같은 값).
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { HQ_TEL, HQ_HOURS, HQ_HOURS_SHORT } from '../lib/constants'
import { IcGift, IcSearch, IcHeadset } from './icons'

const FP_KEY = 'moduon_fp_open'
const Q_DESKTOP = '(min-width: 1024px)' // Tailwind lg
const Q_WIDE = '(min-width: 1600px)'

function useMedia(query) {
  const [m, setM] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(query).matches)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia(query)
    const on = (e) => setM(e.matches)
    setM(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return m
}

const readPref = () => { try { const v = localStorage.getItem(FP_KEY); return v === null ? null : v === '1' } catch { return null } }
const writePref = (v) => { try { localStorage.setItem(FP_KEY, v ? '1' : '0') } catch { /* noop */ } }

// 모비 인물 컷아웃 — 에셋은 배포 시 내려받으므로 실패하면 숨긴다(외부 URL 폴백 금지)
function AgentImg() {
  // 인물 컷아웃을 글 뒤에 크게 깔면 번호·칩이 얼굴을 가린다 — 우하단 원형 아바타(아이콘)로 줄여 겹치지 않게
  const [err, setErr] = useState(false)
  if (err) return null
  return (
    <span aria-hidden className="pointer-events-none absolute bottom-3 right-3 h-14 w-14 overflow-hidden rounded-full bg-white shadow-card ring-2 ring-white">
      <img src="/assets/mobi-agent.png" alt="" onError={() => setErr(true)} className="h-full w-full object-cover object-[50%_10%]" loading="lazy" />
    </span>
  )
}

export default function FloatingPanel() {
  const { db } = useStore()
  const fp = db.benefits?.floating ?? {}
  const nav = useNavigate()
  const { pathname } = useLocation()
  const desktop = useMedia(Q_DESKTOP)
  const wide = useMedia(Q_WIDE)
  const [open, setOpen] = useState(() => (wide ? (readPref() ?? true) : false))
  const ref = useRef(null)

  // 모드가 바뀌면 초기 상태를 다시 잡는다 — 여백 모드는 저장된 선호(기본 펼침), 오버레이 모드는 접힘
  useEffect(() => { setOpen(wide ? (readPref() ?? true) : false) }, [wide])
  // 오버레이 모드: 라우트 이동 시 접힘
  useEffect(() => { if (!wide) setOpen(false) }, [pathname, wide])
  // 오버레이 모드: 바깥 클릭·Escape 시 접힘
  useEffect(() => {
    if (!open || wide) return
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey) }
  }, [open, wide])

  if (!desktop) return null

  const toggle = () => { const next = !open; setOpen(next); writePref(next) }
  const title = fp.title || 'MODUON 알아보기'
  const chat = () => window.dispatchEvent(new CustomEvent('moduon:chat-open'))
  const tel = `tel:${HQ_TEL.replace(/-/g, '')}`
  const btn = 'flex h-11 w-full items-center gap-2.5 rounded-btn px-3.5 text-left text-[13.5px] font-bold transition-colors'
  const chip = 'inline-flex break-keep rounded-full bg-white px-2.5 py-1 text-[11px] font-bold leading-snug text-primary-text shadow-card'

  if (!open) {
    return (
      <button data-t="floating-tab" onClick={toggle} aria-label={`${title} 패널 열기`} aria-expanded={false}
        className="fixed right-0 top-[176px] z-30 hidden w-9 flex-col items-center gap-2 rounded-l-xl bg-primary py-3.5 text-white shadow-cta transition-colors hover:bg-primary-hover lg:flex">
        <span className="text-[12.5px] font-bold tracking-wide" style={{ writingMode: 'vertical-rl' }}>상담하기</span>
        <span className="text-[14px] leading-none" aria-hidden>‹</span>
      </button>
    )
  }

  return (
    <aside ref={ref} data-t="floating-panel" aria-label={title}
      className={`fixed right-2.5 top-[128px] z-30 hidden w-[228px] rounded-card border border-line-card bg-white shadow-panel animate-rise lg:block ${wide ? '' : 'ring-4 ring-primary/10'}`}>
      {/* 접기 탭 — 패널 왼쪽 가장자리에 붙는 작은 › 탭(아정당식) */}
      <button onClick={toggle} aria-label="패널 접기" aria-expanded={true}
        className="absolute -left-[22px] top-4 flex h-12 w-[22px] items-center justify-center rounded-l-lg border border-r-0 border-line-card bg-white text-[15px] text-faint shadow-card transition-colors hover:text-ink">
        ›
      </button>
      <div className="scrollbar-none max-h-[calc(100dvh-270px)] overflow-y-auto p-3">
        <h2 className="px-1 text-[14px] font-extrabold tracking-tight text-ink">{title}</h2>
        <div className="mt-2.5 flex flex-col gap-2">
          {fp.showSignup !== false && (
            <Link to="/benefits/signup" className={`${btn} glass-btn border border-line-card bg-white text-ink hover:border-primary hover:text-primary-text`}>
              <IcGift size={17} className="shrink-0 text-[#F2559A]" />무료회원가입 혜택
            </Link>
          )}
          {fp.showMobi !== false && (
            <button onClick={chat} className={`${btn} glass-btn bg-tint text-primary-text hover:bg-[#E1E9FA]`}>
              <AiStarsIcon size={17} className="shrink-0" />AI 모비와 실시간 상담
            </button>
          )}
          {fp.showConsultant !== false && (
            <button onClick={() => nav('/consult')} className={`${btn} glass-btn bg-[#FFE500] text-ink hover:bg-[#F5DC00]`}>
              <IcHeadset size={17} className="shrink-0" />전문컨설턴트 상담
            </button>
          )}
          {fp.showFinder !== false && (
            <button onClick={() => nav('/diagnosis')} className={`${btn} glass-btn-cta bg-primary text-white hover:bg-primary-hover`}>
              <IcSearch size={17} className="shrink-0" />우리집 맞춤 상품 찾기
            </button>
          )}
        </div>
        {/* 하단 안내 카드 — 상담 시간 문구 + 대표번호 + 채널별 운영시간 칩 + 우하단 모비 아바타(원형) */}
        <div className="relative mt-3 overflow-hidden rounded-btn bg-tint p-3.5">
          <p className="relative z-[1] whitespace-pre-line text-[12.5px] font-bold leading-[1.45] text-ink">{fp.hours || HQ_HOURS}</p>
          <a href={tel} className="tnum relative z-[1] mt-1.5 block text-[21px] font-extrabold tracking-tight text-primary-text">{HQ_TEL}</a>
          {/* 번호 바로 아래 '24시간' 만 두면 대표번호가 24시간으로 읽힌다 — 칩마다 채널을 붙이고 전화는 고객센터와 같은 HQ_HOURS_SHORT */}
          <div className="relative z-[1] mt-2 flex flex-wrap gap-1.5 pr-16">
            <span className={chip}>모비 24시간 무료상담</span>
            <span className={chip}>전화 {HQ_HOURS_SHORT}</span>
          </div>
          <AgentImg />
        </div>
        {/* 고객센터(/support) — GNB 에서 빠진 숨김 항목의 연결 통로(숨김 ≠ 삭제) */}
        <Link to="/support" className="mt-2 block text-center text-[11.5px] font-semibold text-faint transition-colors hover:text-primary-text">고객센터 →</Link>
      </div>
    </aside>
  )
}

// ─── 패널 전용 아이콘 — AI 스파클(모비). icons.jsx 규격(24 viewBox · currentColor) · 헤드셋은 공용 IcHeadset ───
function AiStarsIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M13.5 1c.85 5.8 2.9 7.85 8.7 8.7-5.8.85-7.85 2.9-8.7 8.7-.85-5.8-2.9-7.85-8.7-8.7C10.6 8.85 12.65 6.8 13.5 1Z" />
      <path d="M6 15.2c.45 2.85 1.45 3.85 4.3 4.3-2.85.45-3.85 1.45-4.3 4.3-.45-2.85-1.45-3.85-4.3-4.3 2.85-.45 3.85-1.45 4.3-4.3Z" />
    </svg>
  )
}
