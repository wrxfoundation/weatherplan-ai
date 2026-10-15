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
        hKo: '호우특보의 공식 기준 읽는 법',
        hEn: 'Reading the official heavy-rain advisory criteria',
        pKo: '침수·풍수해 사정에서 자주 참조되는 공적 맥락 자료가 호우특보 발효 이력입니다. 기상청 호우특보의 공식 기준은 다음과 같습니다 — 호우주의보: 3시간 강우량 60mm 이상 또는 12시간 강우량 110mm 이상이 예상될 때, 호우경보: 3시간 강우량 90mm 이상 또는 12시간 강우량 180mm 이상이 예상될 때. 특보는 "예상"을 기준으로 발효되는 예보적 조치이므로 특정 지점의 실측값을 증명하는 것은 아니지만, 사고 시점에 해당 지역에 주의보·경보가 발효 중이었다는 사실 자체가 기상 상황의 심각성을 보여주는 객관적 기록이 됩니다. 사정 자료에는 관측값과 함께 특보 발효 시각·구역을 병기해 두는 것이 좋습니다.',
        pEn: 'A frequently cited piece of official context in flood and storm adjusting is the heavy-rain advisory record. The official Korean criteria are: heavy-rain advisory (주의보) when 60mm or more in 3 hours, or 110mm or more in 12 hours, is expected; heavy-rain warning (경보) when 90mm or more in 3 hours, or 180mm or more in 12 hours, is expected. Advisories are forecast-based measures — they do not certify a measured value at a specific site — but the fact that an advisory or warning was in force over the area at the incident time is itself an objective record of severity. Record the issuance times and areas alongside the observed values.',
      },
      {
        hKo: '최근접 관측값이 사고 지점 값과 다를 수 있다',
        hEn: 'The nearest station may not equal the incident site',
        pKo: '한국기상산업기술원의 기상감정(호우편) 사례집(가상 사례 기반)이 다루는 핵심 논점 중 하나가 바로 이것입니다 — 최근접 AWS에서 관측된 값과 사고 지점에 실제로 내린 양은 상당히 다를 수 있다는 점입니다. 관측지점이 몇 km만 떨어져 있어도 국지성 집중호우나 산악 지형효과 때문에 값이 크게 갈릴 수 있고, 어느 한쪽이 다른 쪽을 그대로 대신할 수 없습니다. 그래서 실제 기상감정에서는 최근접 지점 값을 그대로 쓰는 대신 복수 지점 비교, 레이더 강우 자료와의 회귀, 거리·고도를 가중한 보간(PRISM 계열) 같은 기법으로 사고 지점 값을 별도로 추정합니다. 사정 실무 관점에서의 시사점은 두 가지입니다 — 최근접 관측값은 출발점이지 결론이 아니며, 관측값과 피해 규모가 어긋나 보이는 사안일수록 지점 대표성 검토와 (필요 시) 감정 단계의 보간 분석이 의미를 가집니다.',
        pEn: 'One of the core points in the hypothetical-case casebook on heavy-rain appraisals published by the Korea Meteorological Industry Technology Institute is exactly this: the value observed at the nearest AWS and the amount that actually fell at the incident site can differ substantially. Even a few kilometers of separation can produce large gaps due to localized cloudbursts or orographic effects, and neither value simply substitutes for the other. Actual appraisals therefore do not take the nearest-station value at face value — they estimate the site value separately, using multi-station comparison, regression against radar rainfall, and distance- and elevation-weighted interpolation (PRISM-family methods). Two practical implications for adjusting: the nearest-station value is a starting point, not a conclusion; and where the observed value and the damage seem inconsistent, a representativeness review — and, if needed, interpolation analysis at the appraisal stage — is where the answer lies.',
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
        hKo: '특보 이력과 지형 편차 — 집계를 보강하는 두 가지',
        hEn: 'Advisory records and terrain variance — two reinforcements',
        pKo: '일수 집계를 뒷받침하는 공적 맥락 자료로 호우특보 발효 이력을 함께 정리해 두면 좋습니다. 기상청 호우특보의 공식 기준(호우주의보: 3시간 60mm 또는 12시간 110mm 이상 예상, 호우경보: 3시간 90mm 또는 12시간 180mm 이상 예상)에 따라 공사 기간 중 현장 지역에 특보가 발효된 날은, 계약 기준과는 별개로 그날의 기상이 통상 수준을 벗어났음을 보여주는 객관적 기록이 됩니다. 한편 한국기상산업기술원의 기상감정(호우편) 사례집(가상 사례 기반)이 보여주듯, 같은 시·군 안에서도 산악 지형효과 때문에 지점 간 강수량이 크게 다를 수 있습니다. 현장이 산지에 인접해 있고 인접 지점 간 값 차이가 큰 사안이라면, 그 차이를 집계표에 그대로 기재하고 필요 시 감정 단계의 보간 분석(거리·고도 가중 등)을 검토하는 것이 과장 없는 대응입니다.',
        pEn: 'Heavy-rain advisory records are useful official context alongside the day count. Days on which an advisory was in force over the site area — under the official criteria (advisory: 60mm/3h or 110mm/12h expected; warning: 90mm/3h or 180mm/12h expected) — are objective records that the weather departed from the norm, independently of the contractual thresholds. Meanwhile, as the hypothetical-case heavy-rain appraisal casebook from the Korea Meteorological Industry Technology Institute illustrates, stations within the same city can record very different rainfall due to orographic effects. Where the site borders mountainous terrain and adjacent stations disagree materially, the unexaggerated response is to record the disagreement as-is in the tabulation and, if needed, consider interpolation analysis (distance- and elevation-weighted) at the appraisal stage.',
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
        hKo: '실제 감정서는 어떤 모습인가',
        hEn: 'What an actual appraisal report looks like',
        pKo: '실제 기상감정서의 구성과 분석 기법을 미리 알아두면 감정을 의뢰하거나 감정 결과를 검토할 때 도움이 됩니다. 기상산업기술원 기상감정(호우편) 사례집·기상감정 표준매뉴얼(2017) 양식 기준으로 감정서는 표지, 의뢰내용, 조사내용(사전조사·현장조사·자료분석), 감정 결과 및 의견, 그리고 다수의 별첨자료(일기도·특보 이력·강수량 분포도·레이더 영상 등)로 구성됩니다. 분석에는 종관기상분석, AWS 실황자료 대조, 레이더 강우강도 회귀, 거리·고도를 가중한 보간(PRISM 계열), 지형효과 분석 같은 기법이 쓰입니다. 각 기법의 의미와 감정서 각 부분의 역할은 별도 가이드 "기상감정서는 어떻게 구성되는가"에서 자세히 다룹니다.',
        pEn: 'Knowing the structure and methods of an actual appraisal report helps both when commissioning one and when reviewing its results. Based on the format of the Korea Meteorological Industry Technology Institute heavy-rain appraisal casebook and the 2017 standard appraisal manual, a report consists of a cover page, the commission details, the investigation (preliminary survey, site survey, data analysis), the findings and opinion, and numerous annexes (weather charts, advisory records, rainfall distribution maps, radar imagery). The analysis employs synoptic meteorological analysis, AWS observation cross-checks, radar rainfall regression, distance- and elevation-weighted interpolation (PRISM-family), and orographic-effect analysis. Each technique and each part of the report is explained in the separate guide "How a Weather Appraisal Report Is Structured".',
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
  {
    slug: 'appraisal-report-anatomy',
    ko: '기상감정서는 어떻게 구성되는가',
    en: 'How a Weather Appraisal Report Is Structured',
    summaryKo:
      '실제 기상감정서의 구조 해부 — 표지·의뢰내용·조사내용(사전조사·현장조사·자료분석)·감정 결과 및 의견·별첨자료의 역할과, 감정에 쓰이는 기법(종관분석·AWS 실황·레이더 강우 회귀·PRISM 보간·지형효과)을 일반 독자용으로 풀어 설명. 기상산업기술원 기상감정(호우편) 사례집·기상감정 표준매뉴얼(2017) 양식 기준.',
    summaryEn:
      'An anatomy of an actual weather appraisal report — the roles of the cover, commission, investigation (preliminary survey, site survey, data analysis), findings and opinion, and annexes — plus a lay explanation of the methods used (synoptic analysis, AWS observations, radar rainfall regression, PRISM interpolation, orographic effects). Based on the KMITI heavy-rain appraisal casebook and the 2017 standard appraisal manual format.',
    sections: [
      {
        hKo: '이 가이드의 근거',
        hEn: 'What this guide is based on',
        pKo: '이 가이드는 한국기상산업기술원이 발간한 기상감정(호우편) 사례집과 기상감정 표준매뉴얼(2017)의 양식을 기준으로 기상감정서의 일반적 구성을 설명합니다. 사례집에 수록된 사례들은 실존 사건이 아닌 가상 시나리오이며, 실제 각 기상기업이 발행하는 감정서는 구성과 내용이 다를 수 있습니다. 따라서 이 가이드는 "감정서가 대체로 어떤 구조와 논리로 쓰이는가"를 이해하기 위한 안내이지, 특정 감정서의 표준을 단정하는 것이 아닙니다.',
        pEn: 'This guide describes the typical structure of a weather appraisal report based on the format of the heavy-rain appraisal casebook published by the Korea Meteorological Industry Technology Institute and the 2017 standard appraisal manual. The cases in the casebook are hypothetical scenarios, not real incidents, and reports issued by individual weather companies may differ in structure and content. Treat this guide as an aid to understanding how such reports are generally organized and argued — not as a definitive standard for any particular report.',
      },
      {
        hKo: '전체 구조 — 다섯 부분',
        hEn: 'The overall structure — five parts',
        pKo: '표준매뉴얼 양식 기준으로 감정서는 크게 다섯 부분으로 구성됩니다. ① 표지 — 발급 업체명·대표자·담당 기상감정사·계약명·발급일을 명시하는 공식 문서의 얼굴입니다. ② 의뢰내용 — 감정대상 일시와 장소, 감정 목적(무엇이 다투어지고 있고 무엇을 밝혀달라는 것인지), 의뢰인 정보를 특정합니다. ③ 조사내용 — 사전조사·현장조사·자료분석으로 나뉘는 감정의 본체입니다. ④ 감정 결과 및 의견 — 분석을 종합한 전문가 판단으로, 감정서의 결론부입니다. ⑤ 별첨자료 — 결론의 근거가 되는 자료 일체를 첨부합니다. 사례집의 사례에서는 별첨이 15종 내외에 이릅니다. 이 구조의 핵심은 "결론(④)만 읽어도 판단을 알 수 있고, 근거(③·⑤)를 따라가면 그 판단을 재검증할 수 있다"는 이중 구조입니다.',
        pEn: 'Under the standard manual format, a report has five parts. (1) Cover — the formal face of the document, stating the issuing company, its representative, the appraiser in charge, the engagement name and the issue date. (2) Commission — pinning down the time and place under appraisal, the purpose (what is contested and what is to be determined), and the client. (3) Investigation — the body of the appraisal, divided into preliminary survey, site survey and data analysis. (4) Findings and opinion — the expert judgment synthesizing the analysis; the report’s conclusion. (5) Annexes — the full set of supporting materials, numbering around fifteen items in the casebook examples. The point of this structure is its duality: the conclusion (4) alone conveys the judgment, while the grounds (3 and 5) let anyone re-verify it.',
      },
      {
        hKo: '조사내용 — 사전조사·현장조사·자료분석',
        hEn: 'The investigation — preliminary survey, site survey, data analysis',
        pKo: '조사내용은 세 단계로 진행됩니다. 사전조사는 감정 대상 지역의 환경을 파악하는 단계로, 특히 지형이 중요합니다 — 사고 지점이 산의 풍상측(바람이 불어오는 쪽)에 있는지, 주변 산의 높이와 배치가 어떤지에 따라 같은 비구름에서도 강수량이 크게 달라질 수 있기 때문입니다. 현장조사는 사고 현장을 직접 답사해 피해 흔적과 주변 여건을 확인하는 단계입니다(수행하지 않았다면 그 사유를 기재합니다). 자료분석은 기상청 일기도·수치일기도, AWS 관측자료, 기상위성·레이더 영상 등 공적 원천의 자료를 종합해 "그날 그 지점에 그런 기상현상이 일어날 조건이었는가"와 "실제로 얼마나 일어났는가"를 분석하는 단계입니다. 어떤 자료를 어떤 방법으로 분석했는지가 모두 별첨과 연결되어 기재됩니다.',
        pEn: 'The investigation proceeds in three stages. The preliminary survey characterizes the environment of the site — terrain above all, since whether the site sits on the windward side of a mountain, and how high and how arranged the surrounding peaks are, can change rainfall dramatically under the same cloud system. The site survey is a physical visit to confirm damage traces and local conditions (if not performed, the reason is recorded). The data analysis then synthesizes materials from official sources — weather charts and numerical charts, AWS observations, satellite and radar imagery — to establish whether conditions for the phenomenon existed at that time and place, and how much of it actually occurred. Every dataset and method used is cross-referenced to an annex.',
      },
      {
        hKo: '기법 1 — 종관분석과 AWS 실황: 조건과 실측',
        hEn: 'Method 1 — synoptic analysis and AWS observations: conditions and measurements',
        pKo: '종관기상분석은 사고 당일의 지상·상층 일기도를 읽어 "큰 그림"을 그리는 작업입니다. 저기압과 전선의 위치, 상층과 하층의 강풍대(제트)가 겹치는지, 남쪽에서 습한 공기가 얼마나 유입되는지, 대기가 얼마나 불안정한지 같은 요소를 종합해 그날 그 지역에 집중호우가 내릴 수 있는 조건이었는지를 판단합니다. 이는 "조건"의 분석입니다. 여기에 AWS(자동기상관측장비) 실황자료가 "실측"을 더합니다 — 사고 지점 주변 여러 관측지점의 시각별 강수량을 대조해 실제로 언제, 어디에, 얼마나 비가 왔는지를 확인합니다. 조건 분석과 실측 대조가 서로를 뒷받침할 때 감정의 설득력이 만들어집니다.',
        pEn: 'Synoptic analysis reads the surface and upper-air charts for the day to draw the big picture: where the low and its fronts sat, whether upper- and lower-level jets coupled, how much moist air streamed in from the south, how unstable the atmosphere was — in short, whether conditions for torrential rain existed over the area. That is the analysis of conditions. AWS (automatic weather station) observations then supply the measurements: hour-by-hour rainfall at multiple stations around the site establishes when, where and how much rain actually fell. The appraisal becomes persuasive when the two — conditions and measurements — corroborate each other.',
      },
      {
        hKo: '기법 2 — 사고 지점 값의 추정: 레이더 회귀와 PRISM',
        hEn: 'Method 2 — estimating the site value: radar regression and PRISM',
        pKo: '관측지점은 사고 지점과 떨어져 있는 것이 보통이므로, 감정의 핵심 과제는 "관측되지 않은 지점의 값"을 과학적으로 추정하는 것입니다. 사례집의 가상 사례에서는 두 계열의 기법이 쓰입니다. 첫째, 레이더 강우 회귀 — 주변 여러 AWS 지점에 대해 레이더가 추정한 강우강도와 실제 관측된 강수량 사이의 관계식(회귀식)을 만들고, 그 관계식에 사고 지점 상공의 레이더 값을 넣어 사고 지점 강수량을 산출합니다. 같은 비구름 시스템 안에서는 레이더와 지상 강수의 관계가 유사하게 작동한다는 점을 이용하는 것입니다. 둘째, PRISM 계열 보간 — 사고 지점과 주변 관측지점 사이의 거리에 따른 가중치와 각 지점의 고도에 따른 강수 특성을 함께 반영해 값을 추정하는 기법으로, 미국 오리건 주립대에서 개발되어 국내에서도 고해상도 강수 자료 생산에 활용되어 온 방법입니다. 가상 사례에서는 두 기법의 결과를 교차 검증하고, 반영하는 지점 수를 달리한 복수의 추정값을 범위로 제시합니다 — 단일 수치를 단정하지 않는 것 자체가 감정의 정직성입니다.',
        pEn: 'Since stations usually sit some distance from the incident site, the central task of an appraisal is to estimate, scientifically, the value at an unobserved point. The casebook’s hypothetical cases use two families of methods. First, radar rainfall regression: build a regression between radar-estimated rain intensity and actually observed rainfall at several nearby AWS stations, then feed the radar value over the site into that relationship to derive the site rainfall — exploiting the fact that within the same storm system the radar-to-ground relationship behaves consistently. Second, PRISM-family interpolation: estimate the site value by weighting nearby stations by distance while accounting for how rainfall varies with each station’s elevation — a method developed at Oregon State University and used in Korea to produce high-resolution precipitation data. The hypothetical cases cross-validate the two methods and present multiple estimates, varying the number of stations used, as a range — declining to assert a single number is itself part of the appraisal’s honesty.',
      },
      {
        hKo: '기법 3 — 지형효과: 같은 도시 안에서도 비는 다르게 내린다',
        hEn: 'Method 3 — orographic effects: rain differs even within one city',
        pKo: '수증기를 머금은 공기가 산과 만나면 사라지지 않고 경사면을 타고 강제로 상승합니다. 상승한 공기는 식으면서 응결하고, 비구름이 산의 풍상측에서 강해집니다 — 이것이 지형효과(산악효과)입니다. 사례집의 가상 사례들은 이 효과 때문에 몇 km 떨어진 관측지점끼리도 강수량이 수십 mm씩 차이 나는 상황을 다룹니다. 사고 지점이 산의 풍상측 사면이나 계곡 하부에 있다면, 평지의 관측지점보다 실제 강수가 많았을 가능성을 지형 분석으로 뒷받침할 수 있습니다. 반대로 이 효과를 무시하고 "가까운 지점 값 = 사고 지점 값"으로 단정하는 것이 감정에서 경계하는 오류입니다.',
        pEn: 'When moisture-laden air meets a mountain it does not vanish — it is forced up the slope, cools, condenses, and the rain cloud intensifies on the windward side. This is the orographic effect. The casebook’s hypothetical cases deal with situations where, because of it, stations only a few kilometers apart differ by tens of millimeters. If the incident site sits on a windward slope or at the foot of a valley, terrain analysis can support the possibility that it received more rain than a flatland station recorded. Conversely, the error appraisals guard against is assuming that the nearest station’s value simply equals the site’s.',
      },
      {
        hKo: '별첨자료 — 결론을 재검증 가능하게 만드는 층',
        hEn: 'The annexes — the layer that makes the conclusion re-verifiable',
        pKo: '사례집 양식 기준으로 별첨자료는 15종 내외에 이르며 대략 다음 계열로 구성됩니다 — 현장 관련(사건현장 약도·지형도·현장 사진), 종관 관련(각 층 일기도·수치일기도·위성 영상), 실황 관련(기상예보문·특보 발효 현황·강수량 분포도·레이더 영상), 추정 관련(주변 관측지점 지리 정보·레이더 회귀 산출·PRISM 분석), 그리고 사안별 참고자료(관련 설계 기준·인근 피해 보도 등). 별첨이 이렇게 두터운 이유는 분명합니다 — 본문의 모든 분석 문장이 별첨 번호로 근거와 연결되어, 제3자가 같은 자료로 같은 결론에 도달할 수 있는지 확인할 수 있게 하기 위해서입니다. 감정서를 검토할 때는 결론부만이 아니라 "이 결론이 어느 별첨에 근거하는가"를 따라 읽는 것이 요령입니다.',
        pEn: 'In the casebook format the annexes number around fifteen, falling roughly into these families: site materials (sketch map, topographic map, photos); synoptic materials (weather charts at each level, numerical charts, satellite imagery); observational materials (forecast texts, advisory records, rainfall distribution maps, radar imagery); estimation materials (geographic data for nearby stations, radar regression output, PRISM analysis); and case-specific references (relevant design standards, reports of nearby damage). The reason the annexes run so thick is plain: every analytical sentence in the body cites an annex number, so a third party can check whether the same materials lead to the same conclusion. When reviewing a report, read not just the conclusion but which annex each conclusion rests on.',
      },
      {
        hKo: '웨더팩트 리포트의 위치 — 관측 사실확인 단계의 자동화',
        hEn: 'Where a WeatherFact report fits — automating the observational fact-check',
        pKo: '위 구조에 비추면 웨더팩트 리포트의 위치가 분명해집니다. 웨더팩트가 자동화하는 것은 이 중 관측 사실확인 단계 — 사고 지점 좌표의 특정, 주변 관측지점의 식별과 거리 산출, 해당 기간 관측 기록의 확보와 정리 — 입니다. 이는 감정서로 치면 조사내용의 기초 자료에 해당하며, 종관분석·레이더 회귀·PRISM 보간·지형효과 분석 같은 전문가의 해석·추정 단계와 감정 결과 및 의견은 자동화 대상이 아닙니다. 즉 웨더팩트 리포트는 감정서가 아니라 감정 전 단계의 사실확인 자료이며, 감정 의뢰 여부를 판단하거나 감정의 기초 사실을 빠르게 정리하는 출발점으로 쓰는 것이 올바른 용법입니다. 출처: 기상산업기술원 기상감정(호우편) 사례집·기상감정 표준매뉴얼(2017) 양식 기준.',
        pEn: 'Against this structure, the place of a WeatherFact report is clear. What WeatherFact automates is the observational fact-check stage — pinning down the site coordinates, identifying nearby stations and their distances, and securing and organizing the observation records for the period. In appraisal-report terms this corresponds to the foundational materials of the investigation; the expert interpretation and estimation stages — synoptic analysis, radar regression, PRISM interpolation, orographic analysis — and the findings and opinion are not automated. A WeatherFact report is therefore not an appraisal report but a pre-appraisal fact-check document, properly used as a starting point for deciding whether to commission an appraisal and for assembling its foundational facts quickly. Source: format of the Korea Meteorological Industry Technology Institute heavy-rain appraisal casebook and the 2017 standard weather appraisal manual.',
      },
    ],
  },
]

export function findGuide(slug) {
  return GUIDES.find((g) => g.slug === slug) || null
}
