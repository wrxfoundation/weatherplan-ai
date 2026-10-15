// ─── 홈 롤링 배너 (아정당식 초기화면 · 목업 [홈 · 랜딩페이지1 배너]) ──────────
// db.banners 중 active 를 order 순으로 돌린다. 문구·이미지·순서는 어드민 배너 관리에서 바꾼다.
// kind 'mobi'  : bg 위에 컷아웃 이미지(기본 우하단, side 'left' 면 좌측) + DOM 텍스트 — 인물·오브제 공용
// kind 'scene' : 21:9 장면 이미지를 배경으로 깔고(한쪽 55%는 비어 있음) 그 위에 텍스트 — side 'left' 면 피사체가 왼쪽, 텍스트 오른쪽
//                배너 높이는 21:9 에 가깝게 잡는다(lg 440px) — 낮으면 object-cover 가 세로를 잘라 머리·떠 있는 오브제가 날아간다
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

// 모바일 이미지 띠 → 글 칸 페이드 마스크. 위쪽 42% 는 거의 손대지 않고 아래로 갈수록 빨리 덮는다(이징 곡선).
const FADE_DOWN = 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,.10) 24%, rgba(0,0,0,.38) 48%, rgba(0,0,0,.72) 72%, #000 100%)'

// 데스크톱 글 쪽 색막 — 단색 구간 없이 72% 까지 부드럽게 옅어진다. 글 끝(≈58%)에서도 ~20% 가 남아 가독성은 예전 이상.
// 알파는 16진 2자리(F0=94%, C7=78%, 85=52%, 3D=24%, 12=7%)
function scrimGradient(color, deg) {
  return `linear-gradient(${deg}deg, ${color} 0%, ${color}F0 18%, ${color}C7 32%, ${color}85 44%, ${color}3D 55%, ${color}12 64%, ${color}00 72%)`
}

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
        className="relative h-[352px] overflow-hidden rounded-section shadow-card touch-pan-y select-none sm:h-[400px] lg:h-[440px]"
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
            // 21:9 장면만 모바일에서 '띠 + 글' 로 쌓는다. mobi(컷아웃)·news 는 object-contain 이라 잘린 적이 없다.
            const stacked = b.kind === 'scene'
            const dark = b.tone === 'dark'
            const scrim = b.scrim ?? (dark ? '#F7F2EE' : '#3F63C7')
            return (
              <div
                key={b.id}
                data-t="hero-slide"
                data-id={b.id}
                aria-hidden={!active}
                inert={!active}
                className="relative flex h-full w-full shrink-0 flex-col overflow-hidden sm:block"
                style={{ background: b.bg }}
              >
                {/* 장식 레이어 — 이미지가 없거나 못 받아왔을 때 배너가 "빈 판"으로 보이지 않게 한다.
                    이미지가 뜨면 그 아래 깔려 보이지 않는다. 2026-09 에 장면 이미지 7종이 CDN 에서 사라져
                    히어로가 통째로 빈 그라디언트로 배포된 적이 있다 — 그때 이 레이어가 없었다. */}
                {b.kind !== 'news' && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 hidden sm:block"
                    style={{
                      background: `radial-gradient(60% 80% at ${left ? '22%' : '78%'} 62%, ${dark ? 'rgba(83,119,214,0.18)' : 'rgba(255,255,255,0.22)'} 0%, transparent 70%)`,
                    }}
                  />
                )}
                {b.kind === 'scene' ? (
                  <>
                    {/* 모바일 — 21:9 장면을 1.1:1 카드에 겹쳐 깔면 가로의 절반이 잘린다(이미지 중앙조차 안 보인다).
                        그래서 sm 미만에서는 겹치지 않고 원본 비율 그대로의 띠로 통째 보여 주고, 글은 아래 칸으로 내린다.
                        aspect 는 img 가 아니라 래퍼에 건다 — 이미지를 못 받아와도 띠가 무너지지 않아야 한다. */}
                    <div
                      data-t="hero-band"
                      className="relative aspect-[21/9] max-h-[152px] w-full shrink-0 overflow-hidden sm:hidden"
                      style={{ background: b.bg }}
                    >
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        style={{ background: `radial-gradient(60% 80% at ${left ? '22%' : '78%'} 62%, ${dark ? 'rgba(83,119,214,0.18)' : 'rgba(255,255,255,0.22)'} 0%, transparent 70%)` }}
                      />
                      <SafeImg src={b.image} aria-hidden className="absolute inset-0 h-full w-full object-cover object-center" loading={i === 0 ? 'eager' : 'lazy'} />
                      {/* 띠 아래쪽을 글 칸 배경(b.bg)으로 녹인다 — 이미지와 색 칸이 가로선 하나로 딱 잘려 이질감이 든다는 피드백.
                          같은 배경을 세로 마스크로 서서히 드러내므로 배너마다 색이 달라도 경계가 저절로 맞는다. */}
                      <span
                        aria-hidden
                        data-t="hero-band-fade"
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%]"
                        style={{ background: b.bg, WebkitMaskImage: FADE_DOWN, maskImage: FADE_DOWN }}
                      />
                    </div>
                    {/* 데스크톱 — 가로가 넉넉해 장면을 전면에 깔고 글을 얹는다(기존 구성 유지) */}
                    <SafeImg src={b.image} aria-hidden className={`absolute inset-0 hidden h-full w-full object-cover sm:block ${left ? 'object-left-top' : 'object-right-top'}`} loading={i === 0 ? 'eager' : 'lazy'} />
                    {/* 텍스트 쪽 스크림 — 톤에 맞춰 잉크 글씨엔 크림, 흰 글씨엔 진파랑을 옅게. 글이 이미지 위에 얹히는 데스크톱에만 필요하다. */}
                    <span aria-hidden data-t="hero-scrim" className="absolute inset-0 hidden sm:block" style={{ background: scrimGradient(scrim, left ? 270 : 90) }} />
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
                <div data-t="hero-text" className={`relative z-10 flex min-h-0 flex-1 flex-col justify-center px-5 pb-9 pt-4 sm:h-full sm:flex-none sm:px-6 sm:pb-6 sm:pt-6 ${dark ? 'text-ink' : 'text-white'} ${stacked || left ? 'w-full' : 'w-[78%]'} ${left ? 'sm:ml-[46%] sm:w-[54%] lg:px-10' : 'sm:w-[62%] sm:px-8 lg:w-[58%] lg:px-12'}`}>
                  {b.eyebrow && <div className={`break-keep text-[12.5px] font-semibold sm:text-[14px] ${dark ? 'text-ink/70' : 'text-white/85'}`}>{b.eyebrow}</div>}
                  <h2 className="mt-1.5 break-keep text-[19px] font-extrabold leading-[1.28] sm:mt-2 tracking-[-0.6px] sm:text-[28px] sm:leading-[1.3] sm:tracking-[-0.8px] lg:text-[34px] lg:tracking-[-1px]">{nl2br(b.title)}</h2>
                  {b.desc && descBlock(b.desc, `mt-3 hidden break-keep text-[14.5px] leading-[24px] lg:block ${dark ? 'text-ink/75' : 'text-white/85'}`)}
                  {b.note && <p className="mt-2 hidden break-keep text-[12.5px] font-bold sm:mt-3 sm:block sm:text-[15px]">{b.note}</p>}
                  {cta?.label && (
                    chat && !tenant ? (
                      <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent('moduon:chat-open'))}
                        className={`glass-btn mt-3 inline-flex h-11 w-fit shrink-0 sm:mt-4 items-center rounded-btn px-5 text-[14px] font-bold transition-colors sm:mt-5 ${dark ? 'bg-ink text-white hover:bg-body' : 'bg-white text-primary-text hover:bg-tint'}`}
                      >
                        {cta.label}
                      </button>
                    ) : (
                      <Link
                        to={chat ? consultTo : ctaTo(cta)}
                        className={`glass-btn mt-3 inline-flex h-11 w-fit shrink-0 sm:mt-4 items-center rounded-btn px-5 text-[14px] font-bold transition-colors sm:mt-5 ${dark ? 'bg-ink text-white hover:bg-body' : 'bg-white text-primary-text hover:bg-tint'}`}
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
