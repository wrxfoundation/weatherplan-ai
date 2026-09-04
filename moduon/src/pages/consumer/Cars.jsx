// ─── 렌트/리스 — 제조사 → 차종 브라우저 ─────────────────────────────────
// 오토클래스 구조: 국산차/수입차 제조사 그리드 → 차종 카드(리스 월 ~ / 렌트 월 ~)
// → 금주의 특가차량 → "모든 리스·렌트사 견적 비교" 근거. 계산은 lib/cars.js 한 곳.
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CAR_BRANDS, ORIGINS, CAR_MODELS, SPECIALS, CAPITALS, EXTRA_DC, carBrand, carFrom, manwon, carImagePath, galleryPath, hasPartnerImage, GALLERY_N, RENT_LABEL } from '../../lib/cars'
import { won } from '../../lib/engine'
import { LEGAL } from '../../lib/constants'

export default function Cars() {
  const [sp, setSp] = useSearchParams()
  const brand = CAR_BRANDS.some((b) => b.key === sp.get('brand')) ? sp.get('brand') : 'hyundai'
  const setBrand = (k) => { const n = new URLSearchParams(sp); n.set('brand', k); setSp(n, { replace: true }) }
  const [kind, setKind] = useState('') // '' | 'lease' | 'rent'

  const models = useMemo(() => CAR_MODELS.filter((m) => m.brand === brand)
    .map((m) => ({ m, q: carFrom(m.id) }))
    .filter(({ q }) => kind !== 'rent' || q.rent !== null), [brand, kind])
  const b = carBrand(brand)

  return (
    <main className="mx-auto max-w-6xl px-5 sm:px-10">
      <div className="pt-8 sm:pt-12">
        <h1 className="text-[24px] font-extrabold tracking-[-0.6px] text-ink sm:text-[26px]">렌트 · 리스</h1>
        <p className="mt-1.5 text-[14px] text-muted">국내 모든 리스·렌트사 견적을 비교해 최저가로 안내해 드려요. 취등록세·보험료까지 넣은 <b className="text-ink">진짜 월 납입금</b>으로 보여드립니다.</p>
      </div>

      {/* 제조사 선택 */}
      <section className="mt-6 rounded-section bg-white p-5 shadow-card sm:p-6" data-t="car-brands">
        {ORIGINS.map((o) => (
          <div key={o.key} className={o.key === 'imp' ? 'mt-5' : ''}>
            <div className="text-[13px] font-extrabold text-label">{o.label}</div>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {CAR_BRANDS.filter((x) => x.origin === o.key).map((x) => (
                <button key={x.key} onClick={() => setBrand(x.key)} aria-pressed={brand === x.key} data-t="car-brand"
                  className={`flex h-11 items-center justify-center rounded-btn border text-[13px] font-bold transition-colors ${brand === x.key ? 'border-primary bg-primary text-white' : 'border-line bg-white text-label hover:border-primary/60 hover:bg-tint'}`}>
                  {x.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* 차종 */}
      <section className="mt-6" data-t="car-models">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[18px] font-extrabold text-ink">{b.name} <span className="tnum text-primary-text">{models.length}</span><span className="ml-1 text-[13px] font-semibold text-faint">차종</span></h2>
          <div className="inline-flex rounded-full bg-white p-1 shadow-card" data-t="car-kind">
            {[{ k: '', l: '전체' }, { k: 'lease', l: '리스' }, { k: 'rent', l: '렌트' }].map((t) => (
              <button key={t.k} onClick={() => setKind(t.k)} aria-pressed={kind === t.k}
                className={`h-8 rounded-full px-3.5 text-[12.5px] font-bold transition-colors ${kind === t.k ? 'bg-primary text-white' : 'text-label hover:text-primary-text'}`}>{t.l}</button>
            ))}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" data-t="car-grid">
          {models.map(({ m, q }) => (
            <Link key={m.id} to={`/cars/${m.id}`} data-t="car-card"
              className="flex flex-col rounded-card bg-white p-3 shadow-card transition-all hover:-translate-y-[2px] hover:shadow-panel">
              <CarImage model={m} />
              <div className="mt-1 text-center text-[13.5px] font-bold leading-5 text-ink">{m.name}</div>
              <div className="mt-1.5 text-center">
                {kind !== 'rent' && <div className="tnum text-[12.5px] font-bold text-primary-text">리스 월 {manwon(q.lease)} 만원 ~</div>}
                {kind !== 'lease' && (q.rent !== null
                  ? <div className="tnum text-[12.5px] font-bold text-orange-text">렌트 월 {manwon(q.rent)} 만원 ~</div>
                  : <div className={`text-[12.5px] font-bold ${q.rentState === 'none' ? 'text-disabled' : 'text-faint'}`}>{RENT_LABEL[q.rentState]}</div>)}
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-3 text-[11.5px] text-faint">최저 트림 · 초기부담금 30% · 36개월 · 선납금 기준입니다. 조건을 바꾸면 월 납입금이 달라져요.</p>
      </section>

      {/* 금주의 특가차량 */}
      <section className="mt-10" data-t="car-specials">
        <h2 className="text-center text-[22px] font-extrabold tracking-[-0.5px] text-primary-text">금주의 특가차량</h2>
        <p className="mt-1 text-center text-[13px] text-muted">오직 모두온에서만 만날 수 있는 금주의 특가</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SPECIALS.map(({ model, lease, trim }) => (
            <div key={model.id} className="flex flex-col rounded-card bg-tint/50 p-4 shadow-card">
              <div className="flex gap-1.5">
                <span className="rounded bg-orange px-2 py-0.5 text-[11px] font-bold text-white">{model.special.badge}</span>
                {model.id === 'gv80' && <span className="rounded bg-primary px-2 py-0.5 text-[11px] font-bold text-white">한정수량</span>}
              </div>
              <CarImage model={model} size={110} />
              <div className="text-[17px] font-extrabold text-ink">{model.name}</div>
              <div className="text-[12.5px] text-muted">{model.special.trim}</div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-[12.5px] font-bold text-label">월 리스료</span>
                <span><span className="tnum text-[22px] font-extrabold text-primary-text">{won(lease)}</span><span className="text-[11.5px] text-faint"> 부터</span></span>
              </div>
              <Link to={`/cars/${model.id}`} className="mt-3 flex h-11 items-center justify-center rounded-btn bg-primary text-[14px] font-bold text-white transition-colors hover:bg-primary-hover">상세보기</Link>
            </div>
          ))}
        </div>
      </section>

      {/* 비교 근거 */}
      <section className="mt-10 rounded-section bg-white p-5 text-center shadow-card sm:p-7">
        <p className="text-[15px] font-extrabold leading-6 text-ink">
          국내 모든 리스·렌트사 견적을 <span className="text-primary-text">비교 후 최저가 선정</span> + 모두온 <span className="text-primary-text">추가 할인</span>
          <span className="block sm:inline"> = 최저가 캐피탈사 대비 <span className="text-orange-text">{EXTRA_DC} 더 저렴</span></span>
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {CAPITALS.map((c) => <span key={c} className="rounded-full border border-line bg-cream/60 px-2.5 py-1 text-[11.5px] font-semibold text-label">{c}</span>)}
        </div>
        <p className="mt-4 text-[11.5px] text-disabled">{LEGAL.quote} {LEGAL.policy}</p>
      </section>
    </main>
  )
}

// 차량 이미지 — 자체 호스팅 사진이 있으면 사진, 없으면(또는 로드 실패) SVG 실루엣.
// 제휴사 URL 을 직접 걸지 않는다: 그쪽 서버가 죽거나 경로가 바뀌면 목록이 통째로 빈다.
export function CarImage({ model, size = 96, kind = 'list' }) {
  const [err, setErr] = useState(false)
  // 파일이 아직 없으면(다운로드 전·실패) onError 로 SVG 실루엣으로 내려앉는다.
  // 껍데기는 항상 남겨 어떤 변형을 쓰기로 했는지 드러낸다 — 파일 유무와 무관하게 검증 가능하다.
  const src = hasPartnerImage(model.id) ? carImagePath(model.id, kind) : ''
  return (
    <div className="flex justify-center py-1" data-t="car-photo" data-kind={kind} data-src={src}
      style={{ height: size * 0.56 }}>
      {src && !err
        ? <img src={src} alt={model.name} loading="lazy" onError={() => setErr(true)} className="h-full w-auto object-contain" />
        : <CarArt fuel={model.fuel} seg={model.seg} size={size} />}
    </div>
  )
}

// 상세 갤러리 — 장수는 차량마다 달라서, 없는 장은 로드 실패 시 스스로 빠진다.
export function CarGallery({ model }) {
  const [dead, setDead] = useState([])
  if (!hasPartnerImage(model.id)) return null
  const all = Array.from({ length: GALLERY_N }, (_, i) => i + 1)
  const shots = all.filter((n) => !dead.includes(n))
  return (
    <div className="mt-3 grid grid-cols-3 gap-1.5" data-t="car-gallery" data-shots={all.length} data-alive={shots.length}>
      {shots.map((n) => (
        <img key={n} src={galleryPath(model.id, n)} alt={`${model.name} ${n}`} loading="lazy"
          onError={() => setDead((d) => [...d, n])}
          className="h-[62px] w-full rounded-field bg-cream object-cover" />
      ))}
    </div>
  )
}

// 차량 일러스트 — CDN 없이 SVG 한 장. 세그먼트로 실루엣, 연료로 액센트만 바꾼다.
export function CarArt({ fuel = 'gas', seg = 'SUV', size = 96 }) {
  const accent = fuel === 'ev' ? '#17B26A' : fuel === 'hev' ? '#5377D6' : '#F97B4C'
  const tall = seg === 'SUV' || seg === 'MPV'
  return (
    <div className="flex justify-center py-1">
      <svg width={size} height={size * 0.56} viewBox="0 0 100 56" aria-hidden>
        <path d={tall ? 'M10 40 L10 26 Q10 22 15 21 L30 20 L40 11 Q42 9 46 9 L70 9 Q75 9 78 13 L86 21 Q90 22 90 26 L90 40 Z' : 'M8 40 L8 30 Q8 26 13 25 L32 24 L44 15 Q46 13 50 13 L68 13 Q73 13 76 17 L86 25 Q92 26 92 30 L92 40 Z'}
          fill="#5377D6" />
        <path d={tall ? 'M34 20 L43 13 Q44.5 12 47 12 L60 12 L60 20 Z' : 'M40 24 L49 17 Q50.5 16 53 16 L64 16 L64 24 Z'} fill="#EDF1FB" />
        <path d={tall ? 'M63 12 L69 12 Q72 12 74 15 L79 20 L63 20 Z' : 'M67 16 L70 16 Q73 16 75 19 L79 24 L67 24 Z'} fill="#EDF1FB" />
        <rect x={tall ? 10 : 8} y="36" width={tall ? 80 : 84} height="4" rx="2" fill={accent} />
        <circle cx="28" cy="41" r="7" fill="#24272E" /><circle cx="28" cy="41" r="3" fill="#EDF1FB" />
        <circle cx="72" cy="41" r="7" fill="#24272E" /><circle cx="72" cy="41" r="3" fill="#EDF1FB" />
        <ellipse cx="50" cy="50" rx="34" ry="3" fill="#24272E" opacity="0.08" />
      </svg>
    </div>
  )
}
