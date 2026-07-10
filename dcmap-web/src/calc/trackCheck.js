// 전력 인허가 트랙 판정 — M2 스코어링 엔진 전력축의 첫 구현 (규칙 기반, 완전 계산 가능)
// 근거: data/power_rules_v0.json (기본공급약관 제23조 · 기후부공고 2025-139호 · AIDC 특별법)
import rules from '../../data/power_rules_v0.json'

const KRW = (n) => `${(n / 10000).toLocaleString()}만 원`

export function checkPowerTrack(mw, { nonCapital = false } = {}) {
  const kw = mw * 1000
  const t = rules.thresholds
  const fees = rules.fees_krw
  const lt = rules.lead_times

  // 수전전압 트랙 판정 (§1 용량→트랙 룰)
  let track
  if (mw <= 20) {
    track = { voltage: '22.9kV', circuits: '상용 1회선', note: '배전망 수전 — 계통 여유(헤드룸)가 지배 변수' }
  } else if (mw <= 40) {
    track = {
      voltage: '22.9kV 또는 154kV 협의',
      circuits: '22.9kV 시 상용 2회선(+예비)',
      note: '40MW는 22.9kV 옵션의 상한 경계값 — 증설 계획이 있으면 154kV 전제 설계가 안전',
    }
  } else {
    track = {
      voltage: '154kV 의무',
      circuits: '협의',
      note: '자체 수전설비(변전실) 투자 필수 — 154kV+ 변전소 거리가 지배 변수',
    }
  }

  const preNoticeRequired = kw >= t.pre_notice_required_kw
  const psiaRequired = mw >= t.psia_required_mw

  // AIDC 특별법 비수도권 면제 (2027.2 시행, 규모 기준 대통령령 미제정)
  const ex = rules.exemptions?.non_capital_small_aidc
  const exemption =
    psiaRequired && nonCapital && ex
      ? { possible: true, effective: ex.effective, threshold: ex.threshold }
      : null

  // 심의회 상정까지 확정 비용 (154kV 트랙 기준 상한 / 22.9kV 하한)
  const is154 = mw > 40
  const feeRange = is154
    ? fees.pre_review['154kV'] + fees.technical_review['154kV']
    : fees.pre_review['22.9kV'] + fees.technical_review['22.9kV']

  return {
    mw,
    track,
    preNoticeRequired,
    psiaRequired,
    exemption,
    fees: {
      label: is154 ? '154kV 트랙 (사전검토+기술검토비, VAT 별도)' : '22.9kV 트랙 (사전검토+기술검토비, VAT 별도)',
      total: KRW(feeRange),
    },
    leadTime: {
      review: `한전 기술검토 최대 ${lt.technical_review_days_max}일(보완 제외)`,
      assessment: psiaRequired ? `평가서 심사 최대 ${lt.assessment_review_days_max}일` : null,
      deadline: psiaRequired ? `개발 인허가 신청 ${lt.assessment_deadline_before_permit_months}개월 전 평가서 제출 의무` : null,
    },
    basis: [
      rules.valid_basis.tariff,
      psiaRequired ? rules.valid_basis.notice : null,
      exemption ? rules.valid_basis.aidc_special_law : null,
    ].filter(Boolean),
  }
}
