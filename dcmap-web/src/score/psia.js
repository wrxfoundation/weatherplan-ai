// 전력계통영향평가 통과 전망 — 공개 대리지표 정량화(재사용 모듈).
// PsiaScorecard(부지 분석)와 CompareTray(후보 비교)가 공유. 정직성: 공식 배점 아님·규칙 추정.

const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v))

// 요인별 하위점수(0~100)·가중치·근거. 데이터 없으면 score=null(커버리지 제외 — 가짜로 채우지 않음).
export function psiaFactors({ nonCapital, mw, gridMw = null, approvalPct = null, subKm = null }) {
  return [
    {
      key: 'zone',
      label: '입지 (수도권 규제)',
      labelEn: 'Location (capital regulation)',
      weight: 32,
      score: nonCapital ? 100 : 25,
      basis: nonCapital ? '비수도권 — 계통영향평가 가점·AIDC 특별법 면제 트랙(2027.3~)' : '수도권 — 억제 배점(감점)·면제 비대상',
      basisEn: nonCapital ? 'Non-capital — PSIA bonus · AIDC special-act exemption track (from 2027.3)' : 'Capital — suppression scoring (penalty) · not exemption-eligible',
    },
    {
      key: 'headroom',
      label: '계통 공급여유 (시도)',
      labelEn: 'Grid supply headroom (province)',
      weight: 26,
      score: gridMw == null ? null : gridMw >= 1000 ? 100 : gridMw >= 500 ? 84 : gridMw >= 200 ? 66 : gridMw >= 50 ? 46 : gridMw >= 10 ? 28 : 12,
      basis: gridMw == null ? '한전 연계가능용량 미확보' : `한전 연계가능용량 ${gridMw.toLocaleString()}MW`,
      basisEn: gridMw == null ? 'KEPCO available capacity N/A' : `KEPCO available capacity ${gridMw.toLocaleString()}MW`,
    },
    {
      key: 'approval',
      label: 'DC 공급 승인율 (시도)',
      labelEn: 'DC supply approval rate (province)',
      weight: 20,
      score: approvalPct == null ? null : clamp(approvalPct),
      basis: approvalPct == null ? '전력계통영향평가 승인율 미확보' : `전력계통영향평가 공급가능율 ${approvalPct}%`,
      basisEn: approvalPct == null ? 'PSIA approval rate N/A' : `PSIA supply approval ${approvalPct}%`,
    },
    {
      key: 'sub',
      label: '최근접 변전소 (154kV+)',
      labelEn: 'Nearest substation (154kV+)',
      weight: 12,
      score: subKm == null ? null : subKm <= 3 ? 100 : subKm <= 8 ? 76 : subKm <= 15 ? 54 : subKm <= 25 ? 34 : 18,
      basis: subKm == null ? '변전소 거리 미확보' : `${subKm.toFixed(1)}km`,
      basisEn: subKm == null ? 'Substation distance N/A' : `${subKm.toFixed(1)}km`,
    },
    {
      key: 'mw',
      label: '요청 용량 부담',
      labelEn: 'Requested capacity burden',
      weight: 10,
      score: mw <= 10 ? 92 : mw <= 40 ? 74 : mw <= 100 ? 56 : mw <= 200 ? 44 : 34,
      basis: `${Math.round(mw)}MW — ${mw <= 10 ? '10MW 미만(비대상)' : mw <= 40 ? '154kV 원칙 구간' : mw <= 100 ? '대용량' : '초대용량(심의 강화)'}`,
      basisEn: `${Math.round(mw)}MW — ${mw <= 10 ? 'under 10MW (not subject)' : mw <= 40 ? '154kV-principle band' : mw <= 100 ? 'large' : 'very large (stricter review)'}`,
    },
  ]
}

export function psiaScore(input) {
  const factors = psiaFactors(input)
  const avail = factors.filter((f) => f.score != null)
  const wsum = avail.reduce((a, f) => a + f.weight, 0)
  const composite = wsum ? Math.round(avail.reduce((a, f) => a + f.score * f.weight, 0) / wsum) : null
  return { factors, composite, coverage: Math.round(wsum) }
}

export function psiaOutlook(composite, mw) {
  if (mw < 10) return { tone: 'good', label: '비대상 (10MW 미만)', labelEn: 'Not subject (under 10MW)' }
  if (composite == null) return { tone: 'wait', label: '데이터 대기', labelEn: 'Awaiting data' }
  if (composite >= 68) return { tone: 'good', label: '통과 유리', labelEn: 'Pass favorable' }
  if (composite >= 45) return { tone: 'warn', label: '조건부 (보완 필요)', labelEn: 'Conditional (needs work)' }
  return { tone: 'bad', label: '통과 불리', labelEn: 'Pass unfavorable' }
}
