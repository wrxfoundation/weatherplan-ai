/* 웨더팩트 용도별 증빙 가이드 — 정적 콘텐츠 모듈 (dcmap Insights 구조 축소 이식).
 * UI 의존 없음(순수 데이터). 이중언어는 필드 병기(ko/en) — 렌더 측에서 useMapLang로 선택.
 * 정직성: 일반론 수준의 안내만 담는다 — 제도·수수료·자격 요건 등 구체 수치는 단정하지 않고
 * '기관 확인 필요'로 표기. 법률 자문 아님 고지·출처는 GuidePage가 공통 렌더. */

export const GUIDES = [
  {
    slug: 'insurance-claims',
    ko: '보험 손해사정에서 기상 증빙 활용',
    en: 'Using Weather Evidence in Insurance Claims Adjusting',
    summaryKo:
      '침수·풍수해·우박 사정에서 사고 시점의 기상 사실을 관측 기록으로 확보하는 절차와, 기상현상증명(관측지점 한정)·민간 사실확인의 관계, 시간자료가 중요한 이유.',
    summaryEn:
      'How to secure observation-based weather facts for flood, storm and hail claims — the relationship between official certificates (station-bound) and private fact-check reports, and why hourly data matters.',
    sections: [
      {
        hKo: '왜 기상 증빙이 필요한가',
        hEn: 'Why weather evidence matters',
        pKo: '침수·풍수해·우박 등 자연재해성 사고의 손해사정에서는 "그 시점, 그 지점에 실제로 어떤 기상현상이 있었는가"가 보상·면책 판단의 사실 기초가 됩니다. 피보험자 진술이나 현장 사진만으로는 사고 원인과 기상현상의 인과를 뒷받침하기 어려운 경우가 많아, 공적 관측 기록에 근거한 기상 사실 확인이 사정 품질을 좌우합니다.',
        pEn: 'In adjusting weather-driven losses — flooding, windstorm, hail — the factual foundation of any coverage or exclusion decision is what weather actually occurred at that time and place. Statements and site photos alone rarely establish the causal link, so fact-checking against official observation records underpins the quality of the adjustment.',
      },
      {
        hKo: '관측 근거 확보 절차',
        hEn: 'Procedure for securing observation evidence',
        pKo: '일반적인 절차는 다음과 같습니다. ① 사고 지점의 좌표와 사고 시각(또는 기간)을 특정합니다. ② 사고 지점에서 가까운 관측지점을 거리순으로 확인하고, 지점과 사고 지점 사이의 거리·지형 차이를 기록합니다. ③ 해당 기간의 관측 기록(강수·바람·기온 등 사정에 필요한 요소)을 확보합니다. ④ 관측지점이 사고 지점을 얼마나 대표할 수 있는지의 한계를 리포트에 그대로 명시합니다. 관측지점은 사고 지점과 떨어져 있는 것이 보통이므로, 이 한계를 숨기지 않고 기재하는 것이 오히려 증빙의 신뢰를 높입니다.',
        pEn: 'A typical procedure: (1) pin down the coordinates and time (or period) of the incident; (2) identify the nearest observation stations by distance, noting the distance and terrain differences between station and site; (3) obtain the observation records for the period (precipitation, wind, temperature — whatever the adjustment requires); (4) state plainly in the report how far the station can represent the incident site. Stations are usually some distance from the site, and disclosing that limit strengthens, not weakens, the credibility of the evidence.',
      },
      {
        hKo: '기상현상증명(관측지점 한정)과 민간 사실확인의 관계',
        hEn: 'Official certificates (station-bound) vs. private fact-checks',
        pKo: '기상청이 발급하는 기상현상증명은 공적 증명서이지만, 원칙적으로 관측지점에서 관측된 값에 대한 증명입니다. 즉 "관측지점 A에서 얼마의 강수가 관측되었다"를 증명하는 것이지, "사고 지점 B에 그만큼 비가 왔다"를 증명하는 것은 아닙니다. 사고 지점과 관측지점 사이의 해석 — 거리, 국지성, 복수 지점 비교 — 은 별도의 분석 영역이며, 민간 사실확인 리포트는 이 해석을 보조하는 역할을 합니다. 발급 대상·절차·수수료 등 구체 요건은 발급 기관(기상청) 확인이 필요합니다.',
        pEn: 'The official weather-phenomenon certificate issued by the national weather service is a public document, but it certifies values observed at the station — that station A recorded a given amount of rain, not that incident site B received it. Interpreting the gap between station and site — distance, local variability, multi-station comparison — is a separate analytical task, and a private fact-check report supports that interpretation. Eligibility, procedure and fees for certificates must be confirmed with the issuing agency.',
      },
      {
        hKo: '시간자료의 중요성',
        hEn: 'Why hourly data matters',
        pKo: '일 단위 자료만으로는 단시간 집중호우나 돌풍처럼 짧은 시간에 집중된 기상현상을 포착하기 어렵습니다. 같은 일강수량이라도 하루에 고르게 내린 경우와 한두 시간에 집중된 경우는 침수 사고의 해석이 완전히 달라집니다. 사고 시각이 특정되는 사안일수록 시간(또는 그 이하) 단위 자료로 사고 시각 전후의 추이를 대조하는 것이 증빙의 핵심입니다.',
        pEn: 'Daily data alone cannot capture short-lived events such as cloudbursts or gust fronts. The same daily rainfall total means very different things for a flooding claim depending on whether it fell evenly or within an hour or two. Where the incident time is known, comparing hourly (or finer) records around that time is the core of the evidence.',
      },
      {
        hKo: '실무 체크리스트',
        hEn: 'Practical checklist',
        pKo: '사정 실무에서는 다음을 함께 기록해 두면 좋습니다 — 사고 지점 좌표와 특정 근거, 사용한 관측지점과 거리, 자료의 시간 해상도(시간자료·일자료), 자료 출처와 조회 일자, 관측지점 대표성의 한계. 이 요소들이 갖춰진 기상 증빙은 이후 분쟁 단계에서도 재검증이 가능한 자료가 됩니다.',
        pEn: 'In practice, record together: the incident coordinates and how they were determined, the stations used and their distances, the temporal resolution of the data (hourly vs. daily), the data source and retrieval date, and the representativeness limits of the station. Evidence assembled this way remains re-verifiable if the matter later escalates to a dispute.',
      },
    ],
  },
  {
    slug: 'construction-eot',
    ko: '건설 공기연장(EOT) 클레임과 악천후 일수 입증',
    en: 'Construction EOT Claims and Proving Adverse-Weather Days',
    summaryKo:
      '공기연장 클레임에서 악천후 일수를 입증하는 방법 — 계약상 악천후 기준의 확인, 일자료 기반 일수 집계, 인접 관측지점 병기 원칙.',
    summaryEn:
      'How to substantiate adverse-weather days in extension-of-time claims — contractual weather criteria, daily-data day counting, and the principle of citing adjacent stations.',
    sections: [
      {
        hKo: 'EOT 클레임에서 악천후의 위치',
        hEn: 'Where weather sits in an EOT claim',
        pKo: '공기연장(EOT, Extension of Time) 클레임에서 악천후는 대표적인 연장 사유 중 하나입니다. 다만 "날씨가 나빴다"는 일반적 주장만으로는 인정받기 어렵고, 계약이 정한 기준을 초과하는 악천후가 실제 공정에 영향을 준 날이 며칠이었는지를 관측 기록으로 입증해야 합니다. 기상 증빙은 이 입증의 사실 기초를 제공합니다.',
        pEn: 'Adverse weather is one of the classic grounds for an extension of time, but a general claim that "the weather was bad" rarely succeeds. What must be shown, from observation records, is how many days exceeded the contractually defined weather thresholds and actually affected the works. Weather evidence supplies the factual basis for that showing.',
      },
      {
        hKo: '계약상 악천후 기준의 확인',
        hEn: 'Confirming the contractual weather criteria',
        pKo: '악천후의 기준은 계약마다 다릅니다. 표준 계약조건이나 시방서에 강수량·풍속·기온 등의 임계값이 명시되기도 하고, "통상 예견 가능한 수준을 초과하는 악천후"처럼 해석이 필요한 문언으로 규정되기도 합니다. 어떤 수치가 기준인지는 반드시 해당 계약 문서에서 확인해야 하며, 일반론으로 단정할 수 없습니다. 기준이 불명확한 계약이라면 과거 같은 기간의 통상 기상과 대비하는 방식이 쓰이기도 합니다.',
        pEn: 'What counts as adverse weather is contract-specific. Some conditions of contract or specifications state numeric thresholds for rainfall, wind or temperature; others use interpretive language such as weather "beyond what was reasonably foreseeable". The applicable criteria must always be taken from the contract documents themselves — they cannot be assumed as a general rule. Where the contract is silent, comparison against historical norms for the same period is a commonly used approach.',
      },
      {
        hKo: '일자료 기반 일수 집계 방법',
        hEn: 'Counting days from daily data',
        pKo: '악천후 일수 집계의 기본 단위는 일자료입니다. 공사 기간의 일별 관측값(일강수량·일최대풍속 등)을 계약 기준과 대조해 기준 초과일을 표로 집계하고, 각 초과일이 실제 공정(콘크리트 타설·양중 작업·토공 등)에 어떤 영향을 주었는지는 공사일보 등 시공 기록과 교차 확인합니다. 집계 방법 — 어떤 요소를, 어떤 기준으로, 어떤 지점 자료에서 세었는지 — 을 표와 함께 투명하게 밝히는 것이 분쟁 단계에서의 재검증 가능성을 만듭니다.',
        pEn: 'The basic unit for counting adverse-weather days is daily data. Daily observed values over the construction period (daily rainfall, daily maximum wind, etc.) are tabulated against the contractual criteria to identify exceedance days, and each such day is cross-checked against site diaries for its actual effect on the works (concrete pours, crane lifts, earthworks). Stating the counting method transparently — which elements, which thresholds, which station’s data — is what makes the tally re-verifiable in a dispute.',
      },
      {
        hKo: '인접 지점 병기 원칙',
        hEn: 'The adjacent-station principle',
        pKo: '단일 관측지점에만 의존한 집계는 지점과 현장 간 거리·지형 차이 때문에 상대방 반박에 취약합니다. 최근접 지점을 기준으로 하되 인접한 다른 관측지점의 수치를 병기하면, 특정 지점의 국지적 특성에 좌우되지 않는 집계임을 보일 수 있습니다. 지점 간 값의 차이가 크다면 그 차이 자체를 숨기지 않고 기재하고 해석을 덧붙이는 것이 원칙입니다.',
        pEn: 'A tally that leans on a single station is vulnerable to challenge over station-to-site distance and terrain. Anchor the count on the nearest station but cite adjacent stations alongside it, showing the result is not an artifact of one location. Where stations disagree materially, the principle is to disclose the disagreement and interpret it, not to hide it.',
      },
      {
        hKo: '문서화와 제출 준비',
        hEn: 'Documentation and submission',
        pKo: '집계표에는 자료 출처·관측지점·조회 일자·시간 해상도를 함께 기재하고, 공사일보·작업중지 기록과의 대응 관계를 정리해 둡니다. 계약상 통지 기한 등 절차 요건은 계약·법률 검토 사안이므로, 기상 증빙과 별도로 전문가 확인이 필요합니다.',
        pEn: 'The tabulation should record data source, stations, retrieval date and temporal resolution, mapped against site diaries and stop-work records. Procedural requirements such as contractual notice periods are matters for contract and legal review, to be confirmed with professionals separately from the weather evidence itself.',
      },
    ],
  },
  {
    slug: 'legal-appraisal',
    ko: '소송·분쟁에서의 기상감정',
    en: 'Weather Appraisal in Litigation and Disputes',
    summaryKo:
      '소송·분쟁 절차에서 기상 사실이 다투어질 때의 기상감정 — 기상감정사 제도, 감정 절차, 그리고 증빙력을 만드는 조건(공적 원천·재검증 가능성).',
    summaryEn:
      'Weather appraisal when meteorological facts are contested in legal proceedings — the certified appraiser system, the appraisal process, and what gives evidence its weight (official sources, re-verifiability).',
    sections: [
      {
        hKo: '기상감정이란',
        hEn: 'What weather appraisal is',
        pKo: '소송이나 분쟁에서 "당시 그 지점의 기상 상태"가 쟁점이 되면, 관측 기록을 수집·분석해 전문가 의견으로 정리하는 기상감정이 활용됩니다. 교통사고의 노면 결빙 여부, 침수 피해의 강우 강도, 시설물 파손 시점의 풍속처럼 기상 사실이 책임 판단의 전제가 되는 사안이 대상입니다.',
        pEn: 'When the weather at a given time and place becomes a contested issue in litigation, a weather appraisal — collecting and analyzing observation records into an expert opinion — is used. Typical subjects include road icing in traffic accidents, rainfall intensity in flood damage, and wind speed at the moment a structure failed.',
      },
      {
        hKo: '기상감정사 제도',
        hEn: 'The certified weather appraiser system',
        pKo: '국내에는 기상 분야의 감정을 수행하는 전문 자격으로 기상감정사 제도가 있습니다(기상 관련 법령에 근거한 국가 자격). 자격의 구체적 요건·시험·등록 절차와 감정 업무의 범위는 제도 운영 기관의 최신 안내를 확인해야 하며, 본 가이드는 제도의 존재와 역할 수준에서만 안내합니다. 법원 감정에서는 감정인 지정 절차 등 소송법상의 요건이 별도로 적용됩니다.',
        pEn: 'Korea operates a certified weather appraiser qualification for expert appraisal work in meteorology, established under weather-related legislation. The specific requirements, examinations, registration procedure and scope of practice should be confirmed with the administering agency — this guide notes only that the system exists and what role it plays. Court-ordered appraisals are additionally governed by procedural rules on the appointment of appraisers.',
      },
      {
        hKo: '감정 절차의 일반적 흐름',
        hEn: 'How an appraisal typically proceeds',
        pKo: '일반적인 흐름은 다음과 같습니다. ① 감정 대상 사실의 특정 — 지점·시각·다투어지는 기상 요소를 명확히 합니다. ② 자료 수집 — 관측 기록 등 공적 원천의 자료를 확보합니다. ③ 분석 — 지점 대표성, 시간 해상도, 복수 지점 비교 등을 검토합니다. ④ 감정서 작성 — 방법·출처·한계를 명시한 문서로 정리합니다. 법원 감정의 경우 감정인 지정·감정료 등 절차 요건은 법원과 소송대리인을 통해 확인해야 합니다.',
        pEn: 'A typical flow: (1) specify the facts at issue — location, time, and the contested weather elements; (2) collect data from official sources such as observation records; (3) analyze — station representativeness, temporal resolution, multi-station comparison; (4) write the appraisal report, stating methods, sources and limitations. For court appraisals, procedural matters such as appointment and fees should be confirmed through the court and counsel.',
      },
      {
        hKo: '증빙력의 조건 — 공적 원천과 재검증 가능성',
        hEn: 'What gives evidence its weight — official sources and re-verifiability',
        pKo: '기상 증빙이 절차에서 힘을 갖는 조건은 크게 두 가지입니다. 첫째, 공적 원천 — 분석의 기초 자료가 공식 관측 기록 등 검증된 원천에서 왔고 그 출처가 명시되어 있어야 합니다. 둘째, 재검증 가능성 — 어떤 지점의 어떤 자료를 어떤 방법으로 분석했는지가 공개되어 있어 상대방이나 제3의 전문가가 같은 자료로 같은 결론에 도달할 수 있는지 확인 가능해야 합니다. 반대로 원천이 불명확하거나 방법이 공개되지 않은 분석은 아무리 결론이 그럴듯해도 증빙으로서 취약합니다.',
        pEn: 'Two conditions chiefly give weather evidence its weight. First, official sourcing — the underlying data must come from verified sources such as official observation records, with provenance stated. Second, re-verifiability — the stations, data and methods must be disclosed so that the opposing party or a third-party expert can reach the same result from the same materials. Analysis with unclear sources or undisclosed methods is weak evidence, however plausible its conclusion.',
      },
      {
        hKo: '민간 리포트의 위치',
        hEn: 'Where private reports fit',
        pKo: '자동 생성된 사실확인 리포트나 민간 분석 자료는 사실관계 파악과 쟁점 정리에 유용한 출발점이지만, 그 자체가 감정서를 대체하지는 않습니다. 법적 증빙력이 필요한 국면에서는 자격 있는 감정 전문가의 검수·서명을 거친 문서를 기준으로 삼아야 하며, 검수 전 산출물은 초안으로 취급하는 것이 안전합니다.',
        pEn: 'Automated fact-check reports and private analyses are useful starting points for establishing the facts and framing the issues, but they do not substitute for an appraisal report. Where legal evidentiary weight is required, the reference document is one reviewed and signed by a qualified appraiser; anything short of that review is safest treated as a draft.',
      },
    ],
  },
]

export function findGuide(slug) {
  return GUIDES.find((g) => g.slug === slug) || null
}
