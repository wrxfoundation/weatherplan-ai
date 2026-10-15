import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import VerifyShell, { verifyGuidesPath, verifyHome } from '../VerifyShell.jsx'
import { useMapLang } from '../../i18n/mapLang.js'
import { GUIDES } from './guidesData.js'
import '../verify.css'

const TITLE = '용도별 증빙 가이드 — 웨더팩트'
const TITLE_EN = 'Evidence Guides by Use Case — WeatherFact'
const DESC = '손해사정·건설 클레임·소송 감정에서 기상 증빙을 활용하는 방법 — 일반 정보 가이드 3편.'
const DESC_EN = 'How to use weather evidence in insurance adjusting, construction claims and litigation — three general-information guides.'

/* 용도별 증빙 가이드 인덱스 — dcmap InsightsIndexPage(카드 인덱스→slug 기사) 구조 축소 이식.
 * 콘텐츠는 guidesData.js 정적 데이터, 정직성 고지·CTA는 GuidePage 본문 하단 공통 렌더. */
export default function GuideIndexPage() {
  const en = useMapLang() === 'en'
  const base = verifyGuidesPath()

  useEffect(() => {
    document.title = en ? TITLE_EN : TITLE
    const el = document.head.querySelector('meta[name="description"]')
    if (el) el.setAttribute('content', en ? DESC_EN : DESC)
  }, [en])

  return (
    <VerifyShell>
      <main className="page verify-page">
        <section className="vf-hero">
          <div className="eyebrow">WEATHERFACT · GUIDES</div>
          <h1>{en ? 'Evidence guides' : '용도별 증빙 가이드'}</h1>
          <p className="sub">
            {en
              ? 'General-information guides on using weather evidence in insurance adjusting, construction EOT claims and legal appraisal. Not legal advice.'
              : '손해사정·건설 공기연장 클레임·소송 감정에서 기상 증빙을 활용하는 방법을 정리한 일반 정보 가이드입니다. 법률 자문이 아닙니다.'}
          </p>
        </section>

        <section className="vf-section" style={{ marginTop: 0 }}>
          <div style={{ display: 'grid', gap: 14 }}>
            {GUIDES.map((g) => (
              <Link key={g.slug} to={`${base}/${g.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="vf-card">
                  <h2 className="vf-h2" style={{ marginBottom: 6 }}>
                    {en ? g.en : g.ko}
                  </h2>
                  <p className="vf-muted" style={{ margin: 0 }}>
                    {en ? g.summaryEn : g.summaryKo}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <p className="vf-meta-note">
          {en ? (
            <>
              These guides are general information, not legal advice. To check the weather facts for your own case, use the{' '}
              <Link to={verifyHome()}>WeatherFact lookup</Link>.
            </>
          ) : (
            <>
              본 가이드는 일반 정보이며 법률 자문이 아닙니다. 개별 사건의 기상 사실 확인은{' '}
              <Link to={verifyHome()}>웨더팩트 조회</Link>를 이용해 주세요.
            </>
          )}
        </p>
      </main>
    </VerifyShell>
  )
}
