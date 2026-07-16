import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import TopBar from '../TopBar.jsx'
import LeadDialog from './LeadDialog.jsx'
import { CONTACT_EMAIL } from '../data/leadApi.js'

const TITLE = '요금·문의 — AI InfraMap'
const DESC = '데이터센터 부지 인텔리전스 — 무료 도구, 정밀 리포트, 제휴·데이터, 사업 문의.'

/* 요금·문의 페이지 — 수익화 진입점. 정직성: 상용 리포트/구독은 '요청·예정'으로 명확히,
 * 무료로 지금 되는 것과 구분. 각 CTA는 LeadDialog(문의 유형 프리셋)로 연결. */
/* 수익화 퍼널: 무료 지도(훅) → 무료 부지 진단 1건(미끼) → 정밀 리포트(건당·핵심 매출) →
 * 모니터링 구독(반복) → 데이터·API 제휴(규모·인수 온램프). 파는 것은 '계통 통과 판정' — 돈이 걸린 결정. */
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
    price: '건당 · 견적',
    tag: '핵심',
    desc: '검토 중인 부지가 계통을 통과할지 — 애널리스트 2주 대신 정밀 판정 리포트로.',
    features: ['계통영향평가 통과 전망(정밀·근거 명시)', '변전소 실측 여유 + 수전전압 트랙(22.9/154/345kV)', '인허가 리드타임 + 인구·갈등·냉각·RE100 리스크', 'AI 임원 브리프 + PDF 산출물'],
    cta: { label: '정밀 리포트 요청', type: '정밀 리포트 요청' },
    accent: 'report',
    featured: true,
    sample: true,
  },
  {
    key: 'rank',
    name: '후보지 랭킹 리포트',
    price: '건당 · 견적',
    tag: '다부지 비교',
    desc: '검토 중인 후보 3~10곳 중 어디부터 파야 하나 — 통과 가능성 순으로.',
    features: ['다부지 통과 가능성·계통 여유·리드타임 랭킹', '부지별 강·약점 5축 비교표', '“먼저 팔 부지 / 버릴 부지” 권고', 'PDF + 원본 데이터'],
    cta: { label: '랭킹 리포트 요청', type: '후보지 랭킹 리포트' },
    accent: 'report',
  },
  {
    key: 'watch',
    name: '모니터링 구독',
    price: '월정액 · 예정',
    tag: '반복',
    desc: '확보한 부지 주변이 바뀌면 알림 — 뒤늦게 알아서 딜 놓치지 않게.',
    features: ['계통 여유·변전소 실측 변화 알림', '신규 경쟁 신청·공급예정 등장 감지', '계통영향평가 승인 결과·제도 변경 추적', '시나리오·비교 저장 및 팀 공유'],
    cta: { label: '모니터링 관심 등록', type: '모니터링 구독' },
    accent: 'pro',
  },
  {
    key: 'partner',
    name: '제휴 · 데이터 · API',
    price: '협의',
    tag: 'B2B · 글로벌',
    desc: '데이터 라이선스/API·화이트라벨 — 국내외 자문사·플랫폼·오퍼레이터.',
    features: ['집계 데이터·스코어·계통 레이어 API 라이선스', '자문사·프롭테크 화이트라벨(국내외)', '유자격 부지 리드 제휴(EPC·냉각·PPA)', '사업 양수도·전략 투자 논의'],
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

        <div className="wedge-banner">
          <div className="wedge-copy">
            <span className="wedge-kicker">무료 부지 진단 · 선착순</span>
            <b>지금 검토 중인 부지 1곳, 계통 통과될지 무료로 판정해 드립니다.</b>
            <span className="wedge-sub">
              수도권 계통영향평가 최종 승인율은 1.9% — 100곳 신청에 2곳. 당신 부지가 그 2곳인지 먼저 확인하세요.
            </span>
          </div>
          <div className="wedge-cta">
            <button type="button" className="btn primary" onClick={() => openDlg('무료 부지 진단 (1건)')}>
              무료 진단 신청
            </button>
            <Link className="btn" to="/report-sample">
              견본 리포트 보기
            </Link>
          </div>
        </div>

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
              {t.sample && (
                <Link className="tier-sample-link" to="/report-sample">
                  견본 리포트 미리보기 →
                </Link>
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
