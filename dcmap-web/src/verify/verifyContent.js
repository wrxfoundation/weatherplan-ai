/* 과거 기상 검증(verify) 콘텐츠 모듈 — 프로세스·요금 티어·FAQ 정적 데이터.
 * UI 의존 없음(순수 데이터). 이중언어는 필드 병기(ko/en) — 렌더 측에서 useMapLang로 선택.
 * 정직성: 확정가 표기 금지(가격 검증 중/문의), 법적 효력·데이터 한계는 FAQ에 명시. */

/* 진행 4단계: 조회 → 매칭 → 리포트 초안 → 감정사 검수 */
export const PROCESS_STEPS = [
  {
    ko: '좌표·기간 조회',
    en: 'Point & period lookup',
    descKo: '사고 지점 주소(또는 좌표)와 대상 기간을 입력합니다. 침수·강풍·결빙 등 확인이 필요한 기상 요소를 함께 지정합니다.',
    descEn: 'Enter the incident location (address or coordinates) and the target period, along with the weather elements to verify — flooding, high winds, icing and so on.',
  },
  {
    ko: '관측지점 매칭',
    en: 'Station matching',
    descKo: '최근접 ASOS 관측지점을 거리순으로 매칭하고 커버리지 등급(A~D)을 판정합니다. 지점 거리·대표성 한계까지 그대로 표기합니다.',
    descEn: 'The nearest ASOS stations are matched by distance and a coverage grade (A–D) is assigned. Station distance and representativeness limits are stated as-is.',
  },
  {
    ko: '리포트 초안 자동 생성',
    en: 'Automated report draft',
    descKo: '대상 기간의 관측값 시계열과 용도별 집계(작업불능일·현상 기사 등)를 출처·지점 근거와 함께 리포트 초안으로 자동 구성합니다.',
    descEn: 'Time-series observations and use-case tallies (non-workable days, phenomena logs, etc.) are compiled into a draft report with full source and station provenance.',
  },
  {
    ko: '감정사 검수',
    en: 'Appraiser review',
    descKo: '법적 증빙이 필요한 경우 기상감정 전문가가 초안을 검수·서명합니다. 증빙력이 필요한 상품은 반드시 이 단계를 거칩니다.',
    descEn: 'Where legal evidentiary weight is needed, a certified weather appraiser reviews and signs off on the draft. Evidentiary products always pass through this step.',
  },
]

/* 상품 3티어 — 확정가 표기 금지(정직성): '가격 검증 중' 또는 '문의'만.
 * note는 KO·EN 병기 단일 문자열(렌더가 언어 분기 없이 그대로 출력). */
export const PRICING_TIERS = [
  {
    key: 'self',
    ko: '셀프 조회 리포트',
    en: 'Self-serve lookup report',
    priceKo: '가격 검증 중',
    priceEn: 'Pricing under validation',
    itemsKo: [
      '좌표·기간 입력 → 관측지점 매칭·커버리지 등급',
      '관측값 시계열 자동 리포트(PDF)',
      '출처·지점 거리·한계 명시',
      '참고용 — 감정사 서명 없음',
    ],
    itemsEn: [
      'Point & period input → station matching · coverage grade',
      'Automated observation time-series report (PDF)',
      'Sources, station distance and limitations stated',
      'For reference — no appraiser signature',
    ],
    note: '자동 생성 참고자료 · automated reference document',
  },
  {
    key: 'reviewed',
    ko: '감정사 검수 리포트',
    en: 'Appraiser-reviewed report',
    priceKo: '가격 검증 중 · 문의',
    priceEn: 'Under validation · inquire',
    itemsKo: [
      '셀프 리포트 전체 포함',
      '기상감정 전문가 검수·서명',
      '비관측지점 보간·해석 소견 포함',
      '보험 손해사정·클레임 제출용',
    ],
    itemsEn: [
      'Everything in the self-serve report',
      'Reviewed and signed by a certified weather appraiser',
      'Interpolation and expert interpretation for non-station points',
      'For insurance claims adjustment and claim submissions',
    ],
    note: '감정사 제휴 협의 중 · appraiser partnership in discussion',
  },
  {
    key: 'litigation',
    ko: '소송·중재 감정 지원',
    en: 'Litigation & arbitration support',
    priceKo: '문의',
    priceEn: 'Inquire',
    itemsKo: [
      '검수 리포트 전체 포함',
      '쟁점별 감정 의견서 작성 지원',
      '반대신문 대비 근거·한계 문서화',
      '소송·중재·EOT 클레임 대응',
    ],
    itemsEn: [
      'Everything in the reviewed report',
      'Support drafting expert opinions per issue in dispute',
      'Grounds and limitations documented for cross-examination',
      'For litigation, arbitration and EOT claims',
    ],
    note: '건별 견적 · per-case quote',
  },
]

/* FAQ — 필수 포함: 기상현상증명과의 차이 / 법적 효력 / 처리 기간 / 비관측지점 / 데이터 출처 */
export const FAQ = [
  {
    qKo: '정부24 기상현상증명과 무엇이 다른가요?',
    qEn: 'How is this different from the official KMA weather certificate (Gov24)?',
    aKo: '기상현상증명은 기상청 관측지점의 관측값 그대로만 발급됩니다 — 사고 지점이 관측지점이 아니면 그 지점의 값은 나오지 않습니다. 저희는 비관측지점에 대해 최근접 지점 매칭·거리·대표성 등급을 명시하고, 검수 상품에서는 보간과 전문가 해석 소견까지 제공합니다.',
    aEn: 'The official certificate reproduces raw observations at KMA station locations only — if your site is not a station, you get no value for that point. We cover non-station points with nearest-station matching, distance and representativeness grading, and — in reviewed tiers — interpolation plus expert interpretation.',
  },
  {
    qKo: '법적 효력이 있나요?',
    qEn: 'Does the report carry legal weight?',
    aKo: '셀프 조회 리포트는 자동 생성 참고자료로, 그 자체가 법적 증빙을 보장하지 않습니다. 법적 증빙용으로는 기상감정 전문가가 검수·서명한 리포트를 기준으로 하며, 최종 증거 채택 여부는 각 절차(법원·손해사정)의 판단에 따릅니다.',
    aEn: 'The self-serve report is an automated reference document and does not by itself guarantee evidentiary standing. For legal evidence, the appraiser-reviewed and signed report is the baseline — final admissibility always rests with the court or claims process concerned.',
  },
  {
    qKo: '처리 기간은 얼마나 걸리나요?',
    qEn: 'How long does it take?',
    aKo: '셀프 조회 리포트는 데이터 파이프라인 연동 후 즉시(수 분 내) 생성을 목표로 합니다. 감정사 검수 리포트는 검수 일정에 따라 영업일 기준 수 일이 소요될 수 있으며, 소송 지원은 사안별로 협의합니다. 확정 SLA는 검증 후 공지합니다.',
    aEn: 'Self-serve reports target near-instant generation (minutes) once the data pipeline is live. Appraiser-reviewed reports take several business days depending on review scheduling; litigation support is scoped per case. Firm SLAs will be published after validation.',
  },
  {
    qKo: '사고 지점 근처에 관측지점이 없으면 어떻게 처리하나요?',
    qEn: 'What if there is no station near my site?',
    aKo: '최근접 지점 여러 곳을 거리순으로 제시하고 커버리지 등급(A~D)으로 대표성을 판정합니다. 등급이 낮은 경우(C·D) 인접 지점 보간과 보조 자료(AWS·민간 관측망 등)를 병행하며, 그 한계를 리포트에 그대로 명시합니다 — 값을 지어내지 않습니다.',
    aEn: 'We present several nearest stations by distance with a coverage grade (A–D) for representativeness. For weaker grades (C, D) we combine interpolation across adjacent stations with auxiliary data (AWS, private networks), and state those limits plainly in the report — we never fabricate values.',
  },
  {
    qKo: '데이터 출처는 무엇인가요?',
    qEn: 'What are the data sources?',
    aKo: '기본 출처는 기상청 ASOS 등 공공 관측 데이터이며, 리포트의 모든 수치에 지점·시각·출처를 병기합니다. 현재 실측 파이프라인은 연동 전 단계로, 연동 전 화면·예시 수치에는 "데이터 대기" 또는 "예시(실측 아님)"를 명시합니다.',
    aEn: 'The primary sources are public observation datasets such as KMA ASOS, and every figure in a report carries its station, timestamp and source. The live pipeline is not yet connected; until then, screens and sample figures are explicitly labeled "data pending" or "sample (not measured)".',
  },
  {
    qKo: '어떤 사건 유형에 쓸 수 있나요?',
    qEn: 'What kinds of cases is this for?',
    aKo: '보험 손해사정(침수·풍수해·낙뢰 등 사고 시점 검증), 건설 공기연장(EOT) 클레임(기상 작업불능일 집계), 소송·중재(사고 시각 전후 기상 사실관계 재구성)가 대표 용도입니다. 용도별로 리포트에 담기는 기상 요소 구성이 다릅니다.',
    aEn: 'Typical uses are insurance claims adjustment (verifying conditions at time of loss), construction EOT claims (tallying weather non-workable days), and litigation or arbitration (reconstructing meteorological facts around an incident). The report elements differ per use case.',
  },
]
