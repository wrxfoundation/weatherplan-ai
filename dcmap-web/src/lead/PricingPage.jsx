import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import TopBar from '../TopBar.jsx'
import LeadDialog from './LeadDialog.jsx'
import { CONTACT_EMAIL } from '../data/leadApi.js'

const TITLE = '요금·문의 — AI InfraMap'
const DESC = '데이터센터 부지 인텔리전스 — 무료 도구, 정밀 리포트, 제휴·데이터, 사업 문의.'

/* 요금·문의 페이지 — 수익화 진입점. 정직성: 상용 리포트/구독은 '요청·예정'으로 명확히,
 * 무료로 지금 되는 것과 구분. 각 CTA는 LeadDialog(문의 유형 프리셋)로 연결. */
const TIERS = [
  {
    key: 'free',
    name: '무료 (베타)',
    price: '₩0',
    tag: '지금 사용 중',
    desc: '공개 데이터 기반 부지 인텔리전스 — 지금 바로.',
    features: ['전국 DC·발전·계통 인터랙티브 맵', '임의 지점 부지 프리뷰(5축 스코어 커버리지)', 'GPU→전력(MW) 계산기 · 시나리오 비교', 'AI 부지 브리프·자연어 검색·Q&A'],
    cta: { label: '맵 열기', to: '/' },
    accent: 'free',
  },
  {
    key: 'report',
    name: '정밀 부지 리포트',
    price: '요청 기반',
    tag: '맞춤 견적',
    desc: '특정 부지의 전력·인허가·리스크를 정밀 분석한 임원용 리포트.',
    features: ['5축 정밀 스코어링 + 커버리지 근거', '수전전압 트랙·계통영향평가 통과 전망', '계통 여유·변전소·산단·냉각·RE100 종합', 'AI 임원 브리프 + PDF 산출물'],
    cta: { label: '정밀 리포트 요청', type: '정밀 리포트 요청' },
    accent: 'report',
    featured: true,
  },
  {
    key: 'pro',
    name: 'Pro (준비 중)',
    price: '예정',
    tag: '관심 등록',
    desc: '반복 사용 팀을 위한 구독 — 우선순위·저장·내보내기.',
    features: ['무제한 부지 분석·AI 사용', '시나리오·비교 저장 및 팀 공유', '데이터 내보내기(CSV·GeoJSON)', '신규 레이어·기능 우선 제공'],
    cta: { label: 'Pro 관심 등록', type: 'Pro/구독 관심' },
    accent: 'pro',
  },
  {
    key: 'partner',
    name: '제휴 · 데이터 · API',
    price: '협의',
    tag: 'B2B',
    desc: 'EPC·냉각·PPA·법무 제휴, 데이터 라이선스/API, 화이트라벨.',
    features: ['유자격 부지 리드 제휴(EPC·냉각·PPA)', '집계 데이터·스코어 API 라이선스', '지자체·기업 화이트라벨', '사업 양수도·투자 논의'],
    cta: { label: '제휴·데이터 문의', type: '제휴 (EPC·냉각·PPA·법무)' },
    accent: 'partner',
  },
]

export default function PricingPage() {
  const [sp] = useSearchParams()
  const [dlg, setDlg] = useState({ open: false, type: '정밀 리포트 요청', context: '' })

  useEffect(() => {
    document.title = TITLE
    const el = document.head.querySelector('meta[name="description"]')
    if (el) el.setAttribute('content', DESC)
  }, [])

  // 딥링크: /pricing?type=...&ctx=... → 문의 모달 자동 오픈(예: SitePanel '정밀 리포트' CTA)
  useEffect(() => {
    const type = sp.get('type')
    if (type) setDlg({ open: true, type, context: sp.get('ctx') || '' })
  }, [sp])

  const openDlg = (type, context = '') => setDlg({ open: true, type, context })

  return (
    <>
      <TopBar />
      <main className="page pricing-page">
        <div className="eyebrow">PRICING · CONTACT</div>
        <h1>요금 · 문의</h1>
        <p className="sub">{DESC}</p>

        <div className="tier-grid">
          {TIERS.map((t) => (
            <div key={t.key} className={`tier-card tier-${t.accent}${t.featured ? ' featured' : ''}`}>
              {t.featured && <span className="tier-flag">추천</span>}
              <div className="tier-top">
                <span className="tier-name">{t.name}</span>
                <span className="tier-tag">{t.tag}</span>
              </div>
              <div className="tier-price">{t.price}</div>
              <p className="tier-desc">{t.desc}</p>
              <ul className="tier-feats">
                {t.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {t.cta.to ? (
                <Link className="btn primary tier-cta" to={t.cta.to}>
                  {t.cta.label}
                </Link>
              ) : (
                <button type="button" className="btn primary tier-cta" onClick={() => openDlg(t.cta.type)}>
                  {t.cta.label}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="pricing-note">
          <h3>정직성 원칙</h3>
          <p>
            AI InfraMap은 <b>공개 데이터</b>(한전·전력거래소·KOSIS·SGIS·vworld·OSM·기상청 등)를 집계·가공합니다. 산출 근거가 없는 항목은 점수화하지 않고 “데이터 대기”로 명시하며, 값을 지어내지 않습니다.
            상용 리포트·구독은 검토 후 개별 안내드리며, 자동 결제는 아직 제공하지 않습니다. 직접 메일 문의:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
          <div className="pricing-contact-row">
            <button type="button" className="btn" onClick={() => openDlg('데이터·API')}>
              데이터·API 문의
            </button>
            <button type="button" className="btn" onClick={() => openDlg('매각·투자 문의')}>
              매각·투자 문의
            </button>
            <button type="button" className="btn" onClick={() => openDlg('기타 문의')}>
              기타 문의
            </button>
          </div>
        </div>
      </main>

      <LeadDialog open={dlg.open} type={dlg.type} defaultType={dlg.type} context={dlg.context} onClose={() => setDlg((d) => ({ ...d, open: false }))} />
    </>
  )
}
