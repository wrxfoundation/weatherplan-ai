// ─── P-03 내 몰 개설·브랜딩 마법사 (4단계 + 실시간 미리보기) ──────
import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { BRAND_PRESETS, CATEGORIES, unitName } from '../../lib/constants'
import { Card, Steps, Btn, Field, binputCls, useToast, Logo } from '../../components/ui'

const STEP_LABELS = ['기본 정보', '브랜딩', '카테고리', '개설 완료']

export default function OfficeSetup() {
  const { tenant } = useOutletContext()
  const { dispatch } = useStore()
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(tenant.name)
  const [greeting, setGreeting] = useState(tenant.greeting)
  const [brand, setBrand] = useState(tenant.brand)
  const [cats, setCats] = useState(tenant.cats)

  const brandColor = BRAND_PRESETS.find((b) => b.key === brand)?.color ?? '#5377D6'
  const toggleCat = (slug) => setCats((c) => (c.includes(slug) ? (c.length > 1 ? c.filter((x) => x !== slug) : c) : [...c, slug]))

  const save = () => {
    dispatch({ type: 'TENANT_BRANDING', payload: { id: tenant.id, patch: { name: name.trim() || tenant.name, greeting: greeting.trim(), brand, cats } } })
    setStep(3)
    toast('내 몰에 바로 반영됐어요!')
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-[20px] font-extrabold text-bink">내 몰 설정 · 브랜딩 마법사</h1>
      <p className="mt-0.5 text-[12.5px] text-bmuted">로고·몰 이름·대표 컬러·인사말·노출 카테고리를 꾸며보세요. 상품·가격·정책은 본사가 중앙 관리해요.</p>

      <div className="mt-5"><Steps items={STEP_LABELS} current={step} /></div>

      <div className="mt-5 grid items-start gap-4 lg:grid-cols-[1fr_380px]">
        {/* 좌: 스텝 폼 */}
        <Card track="b" className="p-5 sm:p-6">
          {step === 0 && (
            <div className="flex flex-col gap-4 animate-rise">
              <Field label="몰 이름" required>
                <input className={binputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={12} />
              </Field>
              <Field label="인사말 (히어로 문구)" hint="고객이 처음 보는 한 문장이에요">
                <input className={binputCls} value={greeting} onChange={(e) => setGreeting(e.target.value)} maxLength={40} />
              </Field>
              <Field label="몰 주소">
                <div className="flex h-10 items-center rounded-field border border-bline bg-brow px-3 text-[13.5px] text-bmuted">moduon.com/m/{tenant.slug} <span className="ml-2 text-[11px]">(변경은 본사 문의)</span></div>
              </Field>
              <Field label="관할 권역">
                <div className="flex h-10 items-center rounded-field border border-bline bg-brow px-3 text-[13.5px] text-bmuted">{unitName(tenant.unit)} · {tenant.sigungu}</div>
              </Field>
              <Btn size="sm" className="self-end" onClick={() => setStep(1)}>다음 → 브랜딩</Btn>
            </div>
          )}

          {step === 1 && (
            <div className="animate-rise">
              <Field label="대표 컬러 (프리셋 8종)">
                <div className="mt-1 grid grid-cols-4 gap-2.5">
                  {BRAND_PRESETS.map((b) => (
                    <button
                      key={b.key}
                      onClick={() => setBrand(b.key)}
                      className={`flex flex-col items-center gap-1.5 rounded-field border p-3 transition-colors ${brand === b.key ? 'border-primary bg-tint' : 'border-bline hover:border-primary/50'}`}
                    >
                      <span className="h-7 w-7 rounded-full" style={{ backgroundColor: b.color }} />
                      <span className="text-[11px] font-semibold text-bbody">{b.name}</span>
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="로고 업로드">
                <button onClick={() => toast('데모에서는 이니셜 로고가 적용돼요')} className="mt-1 flex h-20 w-full items-center justify-center rounded-field border border-dashed border-bline text-[12.5px] text-bfaint hover:border-primary hover:text-primary-text">
                  + PNG/SVG 업로드 (데모: 이니셜 자동 생성)
                </button>
              </Field>
              <div className="mt-4 flex justify-between">
                <Btn variant="boutline" size="sm" onClick={() => setStep(0)}>← 이전</Btn>
                <Btn size="sm" onClick={() => setStep(2)}>다음 → 카테고리</Btn>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-rise">
              <Field label={`노출 카테고리 선택 (${cats.length}/8)`} hint="내 몰에 보여줄 서비스만 골라요. 최소 1개.">
                <div className="mt-1 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.slug}
                      onClick={() => toggleCat(c.slug)}
                      className={`flex flex-col items-center gap-2 rounded-field border p-3 transition-colors ${cats.includes(c.slug) ? 'border-primary bg-tint' : 'border-bline opacity-60 hover:opacity-100'}`}
                    >
                      <img src={c.icon} alt="" className="h-10 w-10 rounded-full object-cover" />
                      <span className="text-[12px] font-bold text-bink">{c.name}</span>
                    </button>
                  ))}
                </div>
              </Field>
              <div className="mt-4 flex justify-between">
                <Btn variant="boutline" size="sm" onClick={() => setStep(1)}>← 이전</Btn>
                <Btn size="sm" onClick={save}>저장하고 개설 완료 →</Btn>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center py-8 text-center animate-rise">
              <div className="flex h-20 w-20 items-center justify-center rounded-full text-white" style={{ background: `linear-gradient(135deg, ${brandColor}, #7D8EE8)` }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m4.5 12.5 5 5 10-11" /></svg>
              </div>
              <h2 className="mt-4 text-[19px] font-extrabold text-bink">내 몰이 업데이트됐어요!</h2>
              <p className="mt-1.5 text-[13px] text-bmuted">moduon.com/m/{tenant.slug} 에 즉시 반영됩니다.</p>
              <div className="mt-5 flex gap-2.5">
                <Link to={`/m/${tenant.slug}`} className="inline-flex h-10 items-center rounded-btn bg-primary px-5 text-[13.5px] font-bold text-white hover:bg-primary-hover">내 몰 열어보기</Link>
                <Btn variant="boutline" size="sm" onClick={() => setStep(0)}>다시 수정</Btn>
              </div>
            </div>
          )}
        </Card>

        {/* 우: 실시간 미리보기 */}
        <Card track="b" className="overflow-hidden">
          <div className="border-b border-brow px-4 py-2.5 text-[11.5px] font-bold text-bfaint">실시간 미리보기</div>
          <div className="bg-cream p-4">
            <div className="flex items-center justify-between rounded-t-card bg-white/80 px-3 py-2.5">
              <span className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold text-white" style={{ backgroundColor: brandColor }}>{(name || '몰')[0]}</span>
                <span className="text-[12px] font-extrabold text-ink">{name || '내 몰'}</span>
              </span>
              <span className="rounded-full px-2.5 py-1 text-[9.5px] font-bold text-white" style={{ backgroundColor: brandColor }}>무료 상담</span>
            </div>
            <div className="rounded-b-card bg-white p-4">
              <div className="text-[15px] font-extrabold leading-6 text-ink">모든 서비스,<br /><span style={{ color: brandColor }}>{name || '내 몰'}</span>에서 한 번에</div>
              <p className="mt-1.5 text-[10.5px] leading-4 text-muted">{greeting || '인사말이 여기 표시돼요'}</p>
              <div className="mt-3 grid grid-cols-4 gap-1.5">
                {CATEGORIES.filter((c) => cats.includes(c.slug)).slice(0, 8).map((c) => (
                  <div key={c.slug} className="flex flex-col items-center gap-1">
                    <img src={c.icon} alt="" className="h-8 w-8 rounded-full bg-warm object-cover" />
                    <span className="text-[8.5px] font-semibold text-body">{c.name}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex h-8 items-center justify-center rounded-lg text-[11px] font-bold text-white" style={{ backgroundColor: brandColor }}>
                무료 상담 신청 →
              </div>
            </div>
            <div className="mt-2 text-center"><Logo size="sm" name="powered by 모두온" /></div>
          </div>
        </Card>
      </div>
    </div>
  )
}
