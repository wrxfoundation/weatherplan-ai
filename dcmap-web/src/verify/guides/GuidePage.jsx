import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import VerifyShell, { verifyGuidesPath, verifyHome } from '../VerifyShell.jsx'
import { useMapLang } from '../../i18n/mapLang.js'
import { findGuide } from './guidesData.js'
import '../verify.css'

/* 용도별 증빙 가이드 본문 — dcmap InsightPage(slug 기사) 구조 축소 이식.
 * 프린트 가능한 소박한 문서 스타일(vf-card 재사용, 추가 스타일은 인라인 최소).
 * 정직성: 일반 정보·법률 자문 아님 고지 + 출처·날짜를 각 편 하단 공통 렌더, CTA는 웨더팩트 조회로. */
export default function GuidePage() {
  const { slug } = useParams()
  const en = useMapLang() === 'en'
  const guide = findGuide(slug)
  const base = verifyGuidesPath()

  useEffect(() => {
    if (!guide) return
    document.title = en ? `${guide.en} — WeatherFact Guides` : `${guide.ko} — 웨더팩트 가이드`
  }, [guide, en])

  if (!guide) {
    return (
      <VerifyShell>
        <main className="page verify-page">
          <section className="vf-card" style={{ marginTop: 24 }}>
            <h1 className="vf-h2">{en ? 'Guide not found' : '가이드를 찾을 수 없습니다'}</h1>
            <p className="vf-muted" style={{ margin: 0 }}>
              <Link to={base}>{en ? '← All guides' : '← 가이드 목록으로'}</Link>
            </p>
          </section>
        </main>
      </VerifyShell>
    )
  }

  return (
    <VerifyShell>
      <main className="page verify-page" style={{ maxWidth: 760 }}>
        <p className="vf-muted" style={{ margin: '4px 0 14px' }}>
          <Link to={base}>{en ? '← All guides' : '← 가이드 목록'}</Link>
        </p>

        <article className="vf-card" style={{ padding: '28px 26px' }}>
          <div className="eyebrow">WEATHERFACT · GUIDE</div>
          <h1 style={{ margin: '6px 0 8px', lineHeight: 1.3 }}>{en ? guide.en : guide.ko}</h1>
          <p className="vf-muted">{en ? guide.summaryEn : guide.summaryKo}</p>

          {guide.sections.map((s) => (
            <section key={s.hKo} style={{ marginTop: 22 }}>
              <h2 className="vf-h2" style={{ fontSize: 'var(--text-md)' }}>
                {en ? s.hEn : s.hKo}
              </h2>
              <p style={{ margin: 0, fontSize: 'var(--text-body)', lineHeight: 'var(--lh-base)' }}>{en ? s.pEn : s.pKo}</p>
            </section>
          ))}

          {/* 공통 고지 — 일반 정보·법률 자문 아님 + 제도 세부는 기관 확인 필요 */}
          <p className="vf-meta-note" style={{ marginTop: 26, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
            {en
              ? 'This guide is general information, not legal advice. Details of institutions, procedures and fees change — confirm with the relevant agency, courts or qualified professionals. Content: WeatherFact editorial (general-knowledge summary), as of 2026-07.'
              : '본 가이드는 일반 정보이며 법률 자문이 아닙니다. 제도·절차·수수료 등 세부 사항은 변경될 수 있으므로 관계 기관·법원·전문가 확인이 필요합니다. 출처: 웨더팩트 편집(일반론 정리), 2026-07 기준.'}
          </p>

          <div className="vf-cta-row">
            <Link to={verifyHome()} className="btn primary">
              {en ? 'Check weather facts for your case' : '내 사건의 기상 사실 조회하기'}
            </Link>
          </div>
        </article>
      </main>
    </VerifyShell>
  )
}
