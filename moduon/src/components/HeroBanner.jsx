// ─── 홈 롤링 배너 (아정당식 초기화면 · 목업 [홈 · 랜딩페이지1 배너]) ──────────
// db.banners 중 active 를 order 순으로 돌린다. 문구·이미지·순서는 어드민 배너 관리에서 바꾼다.
// kind 'mobi'  : bg 위에 컷아웃 이미지(기본 우하단, side 'left' 면 좌측) + DOM 텍스트 — 인물·오브제 공용
// kind 'scene' : 21:9 장면 이미지를 배경으로 깔고(한쪽 55%는 비어 있음) 그 위에 텍스트 — side 'left' 면 피사체가 왼쪽, 텍스트 오른쪽
//                텍스트 컬럼 뒤에는 배경색과 같은 계열의 옅은 스크림을 깔아 장면이 조금 침범해도 글이 읽힌다
// kind 'news'  : 이미지 대신 신문 1면 카드(news: kicker·vol·date·headline·big)를 왼쪽에 — 글자가 흐려지지 않게 DOM 으로
// tone 'dark'  : 노랑·연두·라벤더처럼 밝은 배경엔 잉크색 글씨(기본 'light' 는 흰 글씨)
// desc 의 "- " 로 시작하는 줄은 불릿 목록으로 그린다(목업 랜딩페이지2).
// 이미지는 자체 호스팅 경로 — 못 받아오면 이미지만 숨기고 bg 가 받친다.
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SafeImg } from './ui'

const INTERVAL = 5000 // 자동 롤링 간격
const SWIPE_PX = 60   // 이 이상 가로로 끌면 스와이프로 본다

// 배너 문구의 줄바꿈(\n) → <br/>
const nl2br = (s = '') => s.split('\n').map((line, i, arr) => (
  <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
))

// desc — "- " 줄이 하나라도 있으면 불릿 목록, 아니면 줄바꿈 문단
const descBlock = (desc = '', cls = '') => {
  const lines = desc.split('\n').filter((l) => l.trim())
  if (!lines.some((l) => l.trim().startsWith('- '))) return <p className={cls}>{nl2br(desc)}</p>
  return (
    <ul className={`${cls} list-disc pl-5 marker:text-current`}>
      {lines.map((l, i) => <li key={i} className="break-keep">{l.replace(/^\s*-\s*/, '')}</li>)}
    </ul>
  )
}

// 신문 1면 카드 — 목업 랜딩페이지3 ("SPECIAL NEWS · VOL 01 · 20 APRIL 2025 / 구독경제 시대 / 100조원 시장 개막!")
function NewsCard({ news = {} }) {
  return (
    <div className="w-full max-w-[360px] rounded-md bg-[#F7F4EC] px-5 pb-4 pt-3 text-ink shadow-panel ring-1 ring-black/10" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }} aria-hidden>
      <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.12em] text-ink/70">
        <span>{news.kicker ?? 'SPECIAL NEWS'}</span><span>{news.vol ?? 'VOL 01'}</span><span>{news.date ?? ''}</span>
      </div>
      <div className="mt-1.5 border-y-[3px] border-double border-ink py-1 text-center text-[13px] font-extrabold tracking-[-0.2px]">{news.headline}</div>
      <div className="mt-2 break-keep text-center text-[26px] font-black leading-[1.15] tracking-[-1px] sm:text-[30px]">{news.big}</div>
      <div className="mt-2 h-px bg-ink/40" /><div className="mt-1 h-px bg-ink/20" />
    </div>
  )
}

// 배너 CTA 가 가리키는 카테고리(/cars → car, /category/:slug → slug). 상담·혜택 링크는 undefined
const ctaCat = (to = '') => (to.startsWith('/cars') ? 'car' : to.match(/^\/category\/([\w-]+)/)?.[1])

export default function HeroBanner({ banners = [], tenant, consultTo = '/consult' }) {
  // 파트너몰은 취급하지 않는 카테고리의 배너를 뺀다(아이콘 행과 같은 기준) — 본진 /cars 등으로 새지 않게
  const items = banners
    .filter((b) => b.active && (!tenant || !ctaCat(b.cta?.to) || tenant.cats.includes(ctaCat(b.cta?.to))))
    .sort((a, b) => a.order - b.order)
  const total = items.length
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  // 모션 축소 선호 — 자동 롤링 없음(수동 이동은 그대로)
  const [reduce] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  const drag = useRef(null)

  // 어드민에서 배너를 끄거나 지워 개수가 줄면 현재 인덱스를 되감는다
  useEffect(() => { if (index >= total) setIndex(0) }, [index, total])

  const go = (i) => setIndex(((i % total) + total) % total)
  const next = () => go(index + 1)
  const prev = () => go(index - 1)

  // 자동 롤링 — 호버·포커스 중에는 멈추고, 수동 이동 뒤에는 간격을 새로 잰다
  useEffect(() => {
    if (paused || reduce || total < 2) return
    const t = setInterval(() => setIndex((i) => (i + 1) % total), INTERVAL)
    return () => clearInterval(t)
  }, [paused, reduce, total, index])

  if (total === 0) return null

  // 파트너몰에서는 모든 CTA 가 파트너 상담(consultTo)으로 흐른다 — 리드 귀속 유지.
  // 카테고리 링크(/cars·/category/:slug)는 cat= 으로 넘기고, 원래 쿼리(cat=… 등)는 그대로 잇는다
  const ctaTo = (cta) => {
    if (!tenant) return cta.to
    const [path, q] = (cta.to ?? '').split('?')
    const cat = ctaCat(path)
    const extra = [cat && `cat=${cat}`, q].filter(Boolean).join('&')
    return extra ? `${consultTo}&${extra}` : consultTo
  }

  // 현재 슬라이드 톤에 맞춘 인디케이터 색 — 밝은 배경에서 흰 점은 안 보인다
  const curDark = items[index]?.tone === 'dark'
  const dot = curDark ? 'bg-ink' : 'bg-white'
  const dotDim = curDark ? 'bg-ink/35 hover:bg-ink/60' : 'bg-white/50 hover:bg-white/80'

  const onPointerDown = (e) => { drag.current = { x: e.clientX, id: e.pointerId } }
  const onPointerUp = (e) => {
    const s = drag.current
    drag.current = null
    if (!s || s.id !== e.pointerId) return
    const dx = e.clientX - s.x
    if (Math.abs(dx) < SWIPE_PX) return
    if (dx < 0) next(); else prev()
  }
  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next() }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
  }

  return (
    <section
      data-t="hero-banner"
      data-index={index}
      data-total={total}
      role="region"
      aria-roledescription="carousel"
      aria-label="홈 배너"
      className="group relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={onKeyDown}
    >
      <div
        className="relative h-[300px] overflow-hidden rounded-section shadow-card touch-pan-y select-none sm:h-[340px]"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { drag.current = null }}
      >
        {/* 슬라이드 트랙 — translateX 로 밀어 넘긴다 */}
        <div
          className="flex h-full transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {items.map((b, i) => {
            const active = i === index
            const cta = b.cta
            const chat = cta?.action === 'chat'
            const left = b.side === 'left' || b.kind === 'news'
            const dark = b.tone === 'dark'
            const scrim = b.scrim ?? (dark ? '#F7F2EE' : '#3F63C7')
            return (
              <div
                key={b.id}
                data-t="hero-slide"
                data-id={b.id}
                aria-hidden={!active}
                inert={!active}
                className="relative h-full w-full shrink-0 overflow-hidden"
                style={{ background: b.bg }}
              >
                {b.kind === 'scene' ? (
                  <>
                    <SafeImg src={b.image} aria-hidden className={`absolute inset-0 h-full w-full object-cover ${left ? 'object-left' : 'object-right'}`} loading={i === 0 ? 'eager' : 'lazy'} />
                    {/* 텍스트 쪽 스크림 — 톤에 맞춰 잉크 글씨엔 크림, 흰 글씨엔 진파랑을 옅게 */}
                    <span aria-hidden className="absolute inset-0" style={{ background: `linear-gradient(${left ? 270 : 90}deg, ${scrim} 0%, ${scrim}B3 32%, ${scrim}00 58%)` }} />
                  </>
                ) : b.kind === 'news' ? (
                  // 신문 카드는 왼쪽 컬럼(모바일은 텍스트 아래로 숨김) — 목업 랜딩페이지3
                  <div className="absolute inset-y-0 left-0 hidden w-[46%] items-center justify-center px-6 sm:flex lg:px-10"><NewsCard news={b.news} /></div>
                ) : left ? (
                  <SafeImg src={b.image} aria-hidden className="absolute bottom-0 left-0 hidden h-[84%] w-[42%] object-contain object-left-bottom sm:block lg:h-[88%]" loading={i === 0 ? 'eager' : 'lazy'} />
                ) : (
                  <SafeImg src={b.image} aria-hidden className="absolute bottom-0 right-0 h-[92%] w-[46%] object-contain object-right-bottom sm:h-full sm:w-[42%]" loading={i === 0 ? 'eager' : 'lazy'} />
                )}

                {/* 텍스트 컬럼 — 장면 왼쪽(55%)이 비어 있어 스크림 없이 글씨를 얹는다(tone 에 따라 흰/잉크).
                    이미지·뉴스 카드가 왼쪽이면 컬럼을 오른쪽으로 민다. 고정 높이(300/340px) 안에 들어와야 하므로
                    제목 크기·컬럼 폭·desc 노출을 sm → lg 로 단계별로 켠다 */}
                <div className={`relative z-10 flex h-full flex-col justify-center px-6 py-6 ${dark ? 'text-ink' : 'text-white'} ${left ? 'w-full sm:ml-[46%] sm:w-[54%] sm:px-6 lg:px-10' : 'w-[78%] sm:w-[62%] sm:px-8 lg:w-[58%] lg:px-12'}`}>
                  {b.eyebrow && <div className={`break-keep text-[12.5px] font-semibold sm:text-[14px] ${dark ? 'text-ink/70' : 'text-white/85'}`}>{b.eyebrow}</div>}
                  <h2 className="mt-2 break-keep text-[20px] font-extrabold leading-[1.25] tracking-[-0.6px] sm:text-[28px] sm:leading-[1.3] sm:tracking-[-0.8px] lg:text-[34px] lg:tracking-[-1px]">{nl2br(b.title)}</h2>
                  {b.desc && descBlock(b.desc, `mt-3 hidden break-keep text-[14.5px] leading-[24px] lg:block ${dark ? 'text-ink/75' : 'text-white/85'}`)}
                  {b.note && <p className="mt-2 break-keep text-[12.5px] font-bold sm:mt-3 sm:text-[15px]">{b.note}</p>}
                  {cta?.label && (
                    chat && !tenant ? (
                      <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent('moduon:chat-open'))}
                        className={`glass-btn mt-4 inline-flex h-11 w-fit shrink-0 items-center rounded-btn px-5 text-[14px] font-bold transition-colors sm:mt-5 ${dark ? 'bg-ink text-white hover:bg-body' : 'bg-white text-primary-text hover:bg-tint'}`}
                      >
                        {cta.label}
                      </button>
                    ) : (
                      <Link
                        to={chat ? consultTo : ctaTo(cta)}
                        className={`glass-btn mt-4 inline-flex h-11 w-fit shrink-0 items-center rounded-btn px-5 text-[14px] font-bold transition-colors sm:mt-5 ${dark ? 'bg-ink text-white hover:bg-body' : 'bg-white text-primary-text hover:bg-tint'}`}
                      >
                        {cta.label}
                      </Link>
                    )
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* 좌우 화살표 — 데스크톱 호버 시에만 드러난다 */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="이전 배너"
              className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink shadow-card opacity-0 transition-opacity hover:bg-white focus-visible:opacity-100 group-hover:opacity-100 sm:inline-flex"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m15 5-7 7 7 7" /></svg>
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="다음 배너"
              className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink shadow-card opacity-0 transition-opacity hover:bg-white focus-visible:opacity-100 group-hover:opacity-100 sm:inline-flex"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m9 5 7 7-7 7" /></svg>
            </button>
          </>
        )}

        {/* 하단 점 인디케이터 */}
        {total > 1 && (
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
            {items.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`${i + 1}번째 배너`}
                aria-current={i === index ? 'true' : undefined}
                className={`h-1.5 rounded-full transition-all ${i === index ? `w-5 ${dot}` : `w-1.5 ${dotDim}`}`}
              />
            ))}
          </div>
        )}

        {/* 우하단 "1/3 ›" 알약 — 누르면 다음 */}
        <button
          type="button"
          data-t="hero-counter"
          onClick={next}
          aria-label={`${index + 1}/${total} · 다음 배너로`}
          className="tnum absolute bottom-4 right-4 z-20 inline-flex h-8 items-center gap-1 rounded-full bg-black/35 px-3 text-[12.5px] font-bold text-white backdrop-blur-sm transition-colors hover:bg-black/50 sm:bottom-5 sm:right-6"
        >
          {index + 1}/{total} <span aria-hidden className="text-[15px] leading-none">›</span>
        </button>
      </div>
    </section>
  )
}
