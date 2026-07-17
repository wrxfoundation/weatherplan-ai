import { useMemo } from 'react'
import Term from '../components/Term.jsx'
import { psiaScore, psiaOutlook } from './psia.js'
import { useMapLang } from '../i18n/mapLang.js'

/* 전력계통영향평가 통과 스코어카드 (해자 — 규제 독점 분석 심화)
 * 로직은 psia.js 공유(CompareTray와 동일 기준). 정직성: 공개 대리지표 기반 '추정'·공식 판정 아님. */

export default function PsiaScorecard({ nonCapital, mw, gridMw = null, approvalPct = null, subKm = null }) {
  const en = useMapLang() === 'en'
  const { factors, composite, coverage } = useMemo(
    () => psiaScore({ nonCapital, mw, gridMw, approvalPct, subKm }),
    [nonCapital, mw, gridMw, approvalPct, subKm],
  )

  const psiaTarget = mw >= 10
  const outlook = psiaOutlook(composite, mw)

  return (
    <div className="psia-card">
      <div className="psia-head">
        <span className="psia-title">
          <Term k="전력계통영향평가">{en ? 'PSIA' : '전력계통영향평가'}</Term> {en ? 'pass outlook' : '통과 전망'}
        </span>
        <span className={`psia-verdict tone-${outlook.tone}`}>{en ? (outlook.labelEn ?? outlook.label) : outlook.label}</span>
      </div>

      {psiaTarget && composite != null ? (
        <>
          <div className="psia-gauge">
            <div className="psia-gauge-track">
              <div className={`psia-gauge-fill tone-${outlook.tone}`} style={{ width: `${composite}%` }} />
              <span className="psia-gauge-mark" style={{ left: '45%' }} title={en ? 'Conditional threshold' : '조건부 경계'} />
              <span className="psia-gauge-mark" style={{ left: '68%' }} title={en ? 'Favorable threshold' : '유리 경계'} />
            </div>
            <div className="psia-gauge-meta">
              <span className="psia-score">{composite}<span className="psia-score-max">/100</span></span>
              <span className="psia-cov">{en ? 'Public-factor coverage' : '공개 요인 커버리지'} {coverage}%</span>
            </div>
          </div>

          <div className="psia-factors">
            {factors.map((f) => (
              <div key={f.key} className={`psia-row${f.score == null ? ' pending' : ''}`}>
                <span className="psia-f-label">
                  {en ? f.labelEn ?? f.label : f.label}
                  <em className="psia-f-w">w{f.weight}</em>
                </span>
                <span className="psia-f-track">
                  {f.score != null && <span className="psia-f-fill" style={{ width: `${f.score}%` }} />}
                </span>
                <span className="psia-f-val">{f.score != null ? f.score : en ? 'pending' : '대기'}</span>
              </div>
            ))}
          </div>

          <div className="psia-basis">
            {factors.filter((f) => f.score != null).map((f) => (
              <div key={f.key}>
                <b>{en ? f.labelEn ?? f.label : f.label}</b> {en ? f.basisEn ?? f.basis : f.basis}
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="psia-na">{!psiaTarget ? (en ? 'Contract power under 10MW — not subject to the power-grid impact assessment.' : '계약전력 10MW 미만 — 전력계통영향평가 대상이 아닙니다.') : (en ? 'Outlook is computed once public factors (grid headroom, approval rate, etc.) are available.' : '계통 여유·승인율 등 공개 요인 확보 후 전망이 산출됩니다.')}</p>
      )}

      <p className="psia-note">
        {en ? (
          <>A <b>rule-based estimate</b> from public proxy indicators (region · grid headroom · DC approval rate · substation · capacity). The official ±15-point detailed scoring is non-public, and the actual pass decision is made by KEPCO / Ministry of Climate, Energy and Environment review.</>
        ) : (
          <>공개 대리지표(입지·계통 여유·DC 승인율·변전소·용량) 기반 <b>규칙 추정</b>입니다. 공식 ±15점 세부 배점은 비공개이며, 실제 통과 판정은 한전·기후에너지환경부 심의로 결정됩니다.</>
        )}
      </p>
    </div>
  )
}
