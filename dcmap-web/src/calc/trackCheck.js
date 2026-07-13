// 전력 인허가 트랙 판정 — M2 스코어링 엔진 전력축의 첫 구현 (규칙 기반, 완전 계산 가능)
// 근거: data/power_rules_v0.json (기본공급약관 제23조 · 기후부공고 2025-139호 · AIDC 특별법)
import rules from '../../data/power_rules_v0.json'

const KRW = (n) => `${(n / 10000).toLocaleString()}만 원`

export function checkPowerTrack(mw, { nonCapital = false } = {}) {
  const kw = mw * 1000
  const t = rules.thresholds
  const fees = rules.fees_krw
  const lt = rules.lead_times

  // 수전전압 트랙 판정 (기본공급약관 제23조 ① 표 + ③-1 예외)
  //  ① 500kW~1만kW → 22.9kV / 1만kW 초과~40만kW → 154kV / 40만kW 초과 → 345kV 이상
  //  ③-1 예외: 신·증설 후 계약전력 4만kW(40MW) 이하는 한전 변전소 여유·기술조건 충족 시 22.9kV 가능
  let track
  if (mw <= 10) {
    track = { voltage: '22.9kV', circuits: '상용 1회선', note: '배전망 일반공급(계약전력 1만kW 이하 원칙) — 계통 여유(헤드룸)가 지배 변수' }
  } else if (mw <= 40) {
    track = {
      voltage: '154kV 원칙 · 22.9kV 조건부',
      circuits: '22.9kV 시 상용 2회선(+예비)',
      note: '제23조 ①은 1만kW 초과 시 154kV — 다만 ③-1에 따라 한전 변전소 공급여유·기술조건 충족 시 40MW까지 22.9kV 가능(조건부). 40MW가 22.9kV 상한',
    }
  } else if (mw <= 400) {
    track = {
      voltage: '154kV 의무',
      circuits: '협의',
      note: '40MW 초과 — 22.9kV 예외 불가, 자체 수전설비(변전실) 투자 필수. 154kV+ 변전소 거리가 지배 변수',
    }
  } else {
    track = {
      voltage: '345kV 이상',
      circuits: '협의',
      note: '계약전력 40만kW(400MW) 초과 — 제23조 ① 345kV 이상',
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

  // 심의회 상정까지 확정 비용 — 40MW 이하는 22.9kV(③-1 조건부) 기준, 40MW 초과 154kV, 400MW 초과 345kV
  const is154 = mw > 40
  const is345 = mw > 400
  const feeRange = is345
    ? fees.pre_review['154kV'] + fees.technical_review['345kV']
    : is154
      ? fees.pre_review['154kV'] + fees.technical_review['154kV']
      : fees.pre_review['22.9kV'] + fees.technical_review['22.9kV']

  return {
    mw,
    track,
    preNoticeRequired,
    psiaRequired,
    exemption,
    fees: {
      label: `${is345 ? '345kV' : is154 ? '154kV' : '22.9kV'} 트랙 (사전검토+기술검토비, VAT 별도)`,
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
