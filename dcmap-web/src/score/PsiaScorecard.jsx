import { useMemo } from 'react'
import Term from '../components/Term.jsx'

/* 전력계통영향평가 통과 스코어카드 (해자 — 규제 독점 분석 심화)
 * 공개 요인(입지 수도권감점/비수도권가점 · 계통 공급여유 · DC 승인율 · 변전소 거리 · 용량)을
 * 투명 가중으로 정량화해 '통과 전망'을 추정한다.
 * 정직성: 공식 ±15 배점 세부는 비공개이므로, 이는 공개 대리지표 기반 '추정'이며 공식 판정이 아님을
 *   명시. 데이터 미확보 요인은 커버리지에서 제외(가짜로 채우지 않음). */

const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v))

// 각 요인의 하위점수(0~100) — 규칙 기반, 근거 문자열 동반. 데이터 없으면 null(커버리지 제외).
function factorScores({ nonCapital, mw, gridMw, approvalPct, subKm }) {
  return [
    {
      key: 'zone',
      label: '입지 (수도권 규제)',
      weight: 32,
      score: nonCapital ? 100 : 25,
      basis: nonCapital ? '비수도권 — 계통영향평가 가점·AIDC 특별법 면제 트랙(2027.3~)' : '수도권 — 억제 배점(감점)·면제 비대상',
    },
    {
      key: 'headroom',
      label: '계통 공급여유 (시도)',
      weight: 26,
      score: gridMw == null ? null : gridMw >= 1000 ? 100 : gridMw >= 500 ? 84 : gridMw >= 200 ? 66 : gridMw >= 50 ? 46 : gridMw >= 10 ? 28 : 12,
      basis: gridMw == null ? '한전 연계가능용량 미확보' : `한전 연계가능용량 ${gridMw.toLocaleString()}MW`,
    },
    {
      key: 'approval',
      label: 'DC 공급 승인율 (시도)',
      weight: 20,
      score: approvalPct == null ? null : clamp(approvalPct),
      basis: approvalPct == null ? '전력계통영향평가 승인율 미확보' : `전력계통영향평가 공급가능율 ${approvalPct}%`,
    },
    {
      key: 'sub',
      label: '최근접 변전소 (154kV+)',
      weight: 12,
      score: subKm == null ? null : subKm <= 3 ? 100 : subKm <= 8 ? 76 : subKm <= 15 ? 54 : subKm <= 25 ? 34 : 18,
      basis: subKm == null ? '변전소 거리 미확보' : `${subKm.toFixed(1)}km`,
    },
    {
      key: 'mw',
      label: '요청 용량 부담',
      weight: 10,
      score: mw <= 10 ? 92 : mw <= 40 ? 74 : mw <= 100 ? 56 : mw <= 200 ? 44 : 34,
      basis: `${Math.round(mw)}MW — ${mw <= 10 ? '10MW 미만(비대상)' : mw <= 40 ? '154kV 원칙 구간' : mw <= 100 ? '대용량' : '초대용량(심의 강화)'}`,
    },
  ]
}

export default function PsiaScorecard({ nonCapital, mw, gridMw = null, approvalPct = null, subKm = null }) {
  const { factors, composite, coverage } = useMemo(() => {
    const fs = factorScores({ nonCapital, mw, gridMw, approvalPct, subKm })
    const avail = fs.filter((f) => f.score != null)
    const wsum = avail.reduce((a, f) => a + f.weight, 0)
    const comp = wsum ? Math.round(avail.reduce((a, f) => a + f.score * f.weight, 0) / wsum) : null
    return { factors: fs, composite: comp, coverage: Math.round(wsum) }
  }, [nonCapital, mw, gridMw, approvalPct, subKm])

  const psiaTarget = mw >= 10
  const outlook =
    !psiaTarget
      ? { tone: 'good', label: '비대상 (10MW 미만)' }
      : composite == null
        ? { tone: 'wait', label: '데이터 대기' }
        : composite >= 68
          ? { tone: 'good', label: '통과 유리' }
          : composite >= 45
            ? { tone: 'warn', label: '조건부 (보완 필요)' }
            : { tone: 'bad', label: '통과 불리' }

  return (
    <div className="psia-card">
      <div className="psia-head">
        <span className="psia-title">
          <Term k="전력계통영향평가">전력계통영향평가</Term> 통과 전망
        </span>
        <span className={`psia-verdict tone-${outlook.tone}`}>{outlook.label}</span>
      </div>

      {psiaTarget && composite != null ? (
        <>
          <div className="psia-gauge">
            <div className="psia-gauge-track">
              <div className={`psia-gauge-fill tone-${outlook.tone}`} style={{ width: `${composite}%` }} />
              <span className="psia-gauge-mark" style={{ left: '45%' }} title="조건부 경계" />
              <span className="psia-gauge-mark" style={{ left: '68%' }} title="유리 경계" />
            </div>
            <div className="psia-gauge-meta">
              <span className="psia-score">{composite}<span className="psia-score-max">/100</span></span>
              <span className="psia-cov">공개 요인 커버리지 {coverage}%</span>
            </div>
          </div>

          <div className="psia-factors">
            {factors.map((f) => (
              <div key={f.key} className={`psia-row${f.score == null ? ' pending' : ''}`}>
                <span className="psia-f-label">
                  {f.label}
                  <em className="psia-f-w">w{f.weight}</em>
                </span>
                <span className="psia-f-track">
                  {f.score != null && <span className="psia-f-fill" style={{ width: `${f.score}%` }} />}
                </span>
                <span className="psia-f-val">{f.score != null ? f.score : '대기'}</span>
              </div>
            ))}
          </div>

          <div className="psia-basis">
            {factors.filter((f) => f.score != null).map((f) => (
              <div key={f.key}>
                <b>{f.label}</b> {f.basis}
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="psia-na">{!psiaTarget ? '계약전력 10MW 미만 — 전력계통영향평가 대상이 아닙니다.' : '계통 여유·승인율 등 공개 요인 확보 후 전망이 산출됩니다.'}</p>
      )}

      <p className="psia-note">
        공개 대리지표(입지·계통 여유·DC 승인율·변전소·용량) 기반 <b>규칙 추정</b>입니다. 공식 ±15점 세부 배점은 비공개이며, 실제 통과 판정은 한전·기후에너지환경부 심의로 결정됩니다.
      </p>
    </div>
  )
}
