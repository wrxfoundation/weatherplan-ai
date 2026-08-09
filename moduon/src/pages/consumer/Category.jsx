// ─── S-02 카테고리 상세 — 상품 0개여도 상담 CTA 노출(AC) ─────────
import { Link, useParams, useNavigate } from 'react-router-dom'
import { catBySlug, LEGAL } from '../../lib/constants'
import { useStore } from '../../lib/store'
import { won } from '../../lib/engine'
import { Btn, Card, EmptyState } from '../../components/ui'
import TelcoCompare from '../../components/TelcoCompare'
import InstallCheck from '../../components/InstallCheck'
import Reviews from '../../components/Reviews'

export default function Category() {
  const { slug } = useParams()
  const nav = useNavigate()
  const { db } = useStore()
  const cat = catBySlug(slug)
  if (!cat) return null
  const products = db.products.filter((p) => p.cat === slug)
  const maxSupport = Math.max(0, ...products.map((p) => p.support))

  return (
    <main className="mx-auto max-w-6xl px-5 sm:px-10">
      {/* 카테고리 히어로 */}
      <section className="flex flex-col items-start gap-6 pt-8 sm:flex-row sm:items-center sm:pt-12">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-warm sm:h-24 sm:w-24">
          <img src={cat.icon} alt="" className="h-full w-full object-cover" />
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[26px] font-extrabold tracking-tight text-ink">{cat.name}</h1>
            <span className="rounded-full bg-orange-tint px-3 py-1 text-[12.5px] font-bold text-orange-text">{cat.benefit}</span>
          </div>
          <p className="mt-2 max-w-xl text-[14.5px] leading-6 text-muted">{cat.desc}</p>
        </div>
        <Btn onClick={() => nav(`/consult?cat=${slug}`)} className="shrink-0 shimmer-cta">무료 상담 신청</Btn>
      </section>

      {slug === 'internet' && (
        <div className="mt-6">
          <InstallCheck />
        </div>
      )}

      {/* 비교 포인트 */}
      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { t: '조건 비교', d: '통신사·브랜드별 조건을 한 번에 비교해요' },
          { t: '숨은 혜택', d: '결합·프로모션·카드 할인까지 전부 반영해요' },
          { t: '이중 검수', d: 'AI 1차 설계 + 본사 상담원이 최종 검수해요' },
        ].map((p, i) => (
          <Card key={p.t} className="flex items-start gap-3 p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tint text-[13px] font-extrabold text-primary-text">{i + 1}</span>
            <div>
              <div className="text-[14px] font-bold text-ink">{p.t}</div>
              <div className="mt-0.5 text-[12.5px] leading-5 text-muted">{p.d}</div>
            </div>
          </Card>
        ))}
      </section>

      {/* 상품 리스트 */}
      <section className="mt-8">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-[19px] font-extrabold text-ink">추천 상품 {products.length > 0 && <span className="tnum text-primary-text">{products.length}</span>}</h2>
          {maxSupport > 0 && <span className="text-[13px] font-semibold text-orange-text">지원금 최대 {won(maxSupport)}</span>}
        </div>

        {products.length === 0 ? (
          <Card className="p-8">
            <EmptyState icon="🛎️" text="상담사가 조건에 맞는 상품을 직접 찾아드려요" sub="이 카테고리는 맞춤 견적으로만 안내되고 있어요" />
            <Btn className="mx-auto flex" onClick={() => nav(`/consult?cat=${slug}`)}>무료 상담으로 견적 받기</Btn>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <Card key={p.id} hover className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[12px] font-semibold text-faint">{p.brand}</div>
                    <div className="mt-0.5 text-[16px] font-bold leading-6 text-ink">{p.name}</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-tint px-2.5 py-1 text-[11px] font-bold text-primary-text">{p.tag}</span>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    {p.monthly > 0 ? (
                      <>
                        <span className="text-[12px] text-faint">월</span>{' '}
                        <span className="tnum text-[22px] font-extrabold tracking-tight text-ink">{won(p.monthly)}</span>
                      </>
                    ) : (
                      <span className="text-[14px] font-bold text-label">무료 견적</span>
                    )}
                  </div>
                  {p.support > 0 && (
                    <span className="rounded-full bg-orange-tint px-2.5 py-1 text-[12px] font-bold text-orange-text">최대 {won(p.support)} 지원</span>
                  )}
                </div>
                <button
                  onClick={() => nav(`/consult?cat=${slug}`)}
                  className="mt-4 h-11 w-full rounded-field bg-tint text-[14px] font-bold text-primary-text transition-colors hover:bg-primary hover:text-white"
                >
                  이 조건으로 상담받기
                </button>
              </Card>
            ))}
          </div>
        )}
        {slug === 'internet' && (
          <div className="mt-4 text-center">
            <Link to="/calculator" className="text-[13.5px] font-bold text-primary-text underline underline-offset-4">직접 조건을 바꿔가며 계산해 보고 싶다면 → 견적 계산기</Link>
          </div>
        )}
        {slug === 'phone' && (
          <div className="mt-4 text-center">
            <Link to="/calculator/phone" className="text-[13.5px] font-bold text-primary-text underline underline-offset-4">단말 할부금 + 요금까지 직접 계산해 보려면 → 휴대폰 견적 계산기</Link>
          </div>
        )}
        <p className="mt-6 text-[11.5px] text-disabled">{LEGAL.policy}</p>
      </section>

      <Reviews cat={cat.name} />

      {/* 인터넷/TV — 요금표·절차·FAQ (탐라몰 벤치마크) */}
      {slug === 'internet' && <TelcoCompare />}
    </main>
  )
}
