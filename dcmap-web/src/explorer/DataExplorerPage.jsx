import { useMemo, useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import TopBar from '../TopBar.jsx'
import { EXCLUSION_LAYERS } from '../score/exclusions.js'
import EXCLUSION_MANIFEST from '../../data/exclusions/manifest.json'
import { FACILITIES, STATUS_LABEL } from '../data/facilities.js'
import { GEN_RECENT, GEN_LICENSE_META } from '../data/genLicenses.js'
import { CHP_PLANTS } from '../data/chpPlants.js'
import { NEW_PLANTS_2025 } from '../data/newPlants2025.js'
import { GRID_HEADROOM, headroomLabel } from '../data/gridHeadroom.js'
import { DC_ASSESSMENT, approvalLabel } from '../data/gridAssessment.js'
import { SUBSTATIONS } from '../data/substations.js'
import { INDUSTRIAL_COMPLEXES } from '../data/industrialComplexes.js'
import { CAPITAL_PIPELINE } from '../data/capitalPipeline.js'
import { DC_DEALS, RACK_RATES, DEV_CONFLICTS, DEV_CONFLICTS_META } from '../data/dcRealEstate.js'
import { GRID_CONSTRUCTION, GRID_CONSTRUCTION_META, GRID_STAGE_LABEL } from '../data/gridConstruction.js'
import { SUBSTATION_HEADROOM, SUBSTATION_HEADROOM_META } from '../data/substationHeadroom.js'
import { LATEST_SNAPSHOT, SNAPSHOT_COUNT } from '../data/headroomSnapshots.js'
import { toCsv, downloadCsv } from '../data/csv.js'
import { useMapLang } from '../i18n/mapLang.js'

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

// 데이터셋 정의 — 각 축적 자료를 검색·다운로드 가능하게 노출
const DATASETS = [
  {
    key: 'gen',
    label: '발전사업 허가 (2024+)',
    asOf: '2026-04-17',
    source: '3MW 초과 발전사업 허가대장 v2',
    fullCsv: `${BASE}/downloads/gen_licenses_full.csv`,
    fullLabel: `전체 ${GEN_LICENSE_META.total.toLocaleString()}건(2001–2026) CSV`,
    fullLabelEn: `Full ${GEN_LICENSE_META.total.toLocaleString()} cases (2001–2026) CSV`,
    columns: [
      { k: 'date', label: '허가일' },
      { k: 'sido', label: '시도' },
      { k: 'name', label: '상호(사업자)' },
      { k: 'fuel', label: '원동력' },
      { k: 'mw', label: '용량MW(참고치)' },
      { k: 'y', label: '허가연도' },
    ],
    rows: GEN_RECENT.map((r) => ({ date: r.date || '', sido: r.sido || '', name: r.name || '', fuel: r.fuel || '', mw: r.mw ?? '', y: r.y })),
  },
  {
    key: 'chp',
    label: '집단에너지(열병합) 발전소',
    asOf: '2025-07-01',
    source: '집단에너지 발전용량·공급량 현황',
    fullCsv: `${BASE}/downloads/chp_plants.csv`,
    fullLabel: '전체 56곳 CSV',
    fullLabelEn: 'All 56 sites CSV',
    columns: [
      { k: 'op', label: '발전사' },
      { k: 'plant', label: '대상발전소' },
      { k: 'loc', label: '관리소' },
      { k: 'commission', label: '공급년월' },
      { k: 'mw', label: '발전용량MW' },
    ],
    rows: CHP_PLANTS.map((p) => ({ op: p.op, plant: p.plant, loc: p.loc, commission: p.commission, mw: p.mw ?? '' })),
  },
  {
    key: 'new2025',
    label: '2025 신규 발전소(시도별)',
    asOf: '2025',
    source: '2025년도 신규 발전소 설치 현황',
    fullCsv: null,
    columns: [
      { k: 'sido', label: '시도' },
      { k: 'capacityKw', label: '신규 설비용량(KW)' },
      { k: 'capacityMw', label: '≈MW' },
      { k: 'count', label: '발전소 개수' },
    ],
    rows: NEW_PLANTS_2025.map((r) => ({
      sido: r.sido,
      capacityKw: r.capacityKw,
      capacityMw: Math.round(r.capacityKw / 1000),
      count: r.count,
    })),
  },
  {
    key: 'headroom',
    label: '계통 공급여유(시도)',
    asOf: '2027 전망',
    source: '한국전력공사 계통 공급여유(연계가능용량) — 시도 총량',
    fullCsv: null,
    columns: [
      { k: 'sido', label: '시도' },
      { k: 'mw', label: '공급여유MW' },
      { k: 'label', label: '판정' },
      { k: 'note', label: '비고' },
    ],
    rows: Object.values(GRID_HEADROOM)
      .filter((g) => g.sido !== '광주')
      .sort((a, b) => b.mw - a.mw)
      .map((g) => ({ sido: g.sido, mw: g.mw, label: headroomLabel(g.mw), note: g.note || '' })),
  },
  {
    key: 'assessment',
    label: 'DC 전력계통영향평가(시도)',
    asOf: '2026-03-27',
    source: '한전 전력계통영향평가 1차 기술검토 — 데이터센터',
    fullCsv: null,
    columns: [
      { k: 'sido', label: '시도' },
      { k: 'able', label: '공급가능MW' },
      { k: 'unable', label: '공급불가MW' },
      { k: 'rate', label: '승인율%' },
      { k: 'label', label: '판정' },
    ],
    rows: Object.values(DC_ASSESSMENT)
      .filter((a) => a.ratePct != null)
      .sort((a, b) => b.ratePct - a.ratePct)
      .map((a) => ({ sido: a.sido, able: Math.round(a.able), unable: Math.round(a.unable), rate: a.ratePct, label: approvalLabel(a.ratePct) })),
  },
  {
    key: 'substation',
    label: '변전소 현황(한전 본부)',
    asOf: '2026-07-13',
    source: '한국전력공사 변전설비현황 — 지역본부별',
    fullCsv: null,
    columns: [
      { k: 'region', label: '지역본부' },
      { k: 'hv', label: '154kV+ 변전소' },
      { k: 'n765', label: '765kV' },
      { k: 'n345', label: '345kV' },
      { k: 'n154', label: '154kV' },
      { k: 'hvMva', label: '변압기MVA' },
    ],
    rows: [...SUBSTATIONS]
      .sort((a, b) => b.hv - a.hv)
      .map((s) => ({ region: s.region, hv: s.hv, n765: s.n765, n345: s.n345, n154: s.n154, hvMva: s.hvMva })),
  },
  {
    key: 'complex',
    label: '산업단지(전국)',
    asOf: '2026-07',
    source: 'OpenStreetMap landuse=industrial (지정단지 필터)',
    fullCsv: null,
    columns: [
      { k: 'name', label: '단지명' },
      { k: 'type', label: '유형' },
      { k: 'lat', label: '위도' },
      { k: 'lng', label: '경도' },
    ],
    rows: INDUSTRIAL_COMPLEXES.map(([name, lat, lng, type]) => ({ name, type, lat, lng })),
  },
  {
    key: 'capital',
    label: '공급예정 DC',
    asOf: '2026-03',
    source: '삼일PwC(2026.3)·알스퀘어(2025.11) 교차 — 원출처 PwC Analysis·KDCC·국토교통부. IT용량≠수전용량, 준공예정은 지연 가능',
    fullCsv: null,
    columns: [
      { k: 'operator', label: '사업자' },
      { k: 'name', label: '센터명' },
      { k: 'loc', label: '위치' },
      { k: 'itMw', label: 'IT용량MW' },
      { k: 'mwSupply', label: '수전MW' },
      { k: 'due', label: '준공예정' },
    ],
    rows: CAPITAL_PIPELINE.map((r) => ({ ...r, mwSupply: r.mwSupply ?? '', due: r.due ?? '' })),
  },
  (() => {
    // P1 파이프라인 소비: 최신 스냅샷(있으면)을 원천으로, 없으면 정적 시드로 폴백.
    const years = LATEST_SNAPSHOT?.years || SUBSTATION_HEADROOM_META.years
    const snapRows = LATEST_SNAPSHOT?.entries?.length
      ? LATEST_SNAPSHOT.entries.map((e) => ({
          name: e.name, sido: e.sido, area: e.area,
          ...Object.fromEntries(years.map((y, i) => [`y${y}`, e.series?.[i] ?? null])),
          firstAvailYear: years[(e.series || []).findIndex((v) => v > 0)] ?? '—',
          genMw: e.genMw ?? 0, applicants: e.applicants ?? 0,
        }))
      : SUBSTATION_HEADROOM.map((r) => ({
          name: r.name, sido: r.sido, area: r.area,
          ...Object.fromEntries(SUBSTATION_HEADROOM_META.years.map((y) => [`y${y}`, r.byYear[y]])),
          firstAvailYear: r.firstAvailYear ?? '—', genMw: r.genMw, applicants: r.applicants,
        }))
    const snapNote = LATEST_SNAPSHOT
      ? `데이터 자산화 P1 스냅샷 파이프라인: ${SNAPSHOT_COUNT}개월 축적 · 최신 ${LATEST_SNAPSHOT.month}(${LATEST_SNAPSHOT.captured}). 월별 스냅샷이 쌓이면 변화 추이(delta)를 추적한다.`
      : ''
    return {
      key: 'subheadroom',
      label: '변전소 여유용량(연도별)',
      asOf: LATEST_SNAPSHOT ? `스냅샷 ${LATEST_SNAPSHOT.month} · ${SUBSTATION_HEADROOM_META.updated}` : SUBSTATION_HEADROOM_META.updated,
      source: `${SUBSTATION_HEADROOM_META.source}. ${SUBSTATION_HEADROOM_META.note} ${snapNote}`,
      fullCsv: null,
      columns: [
        { k: 'name', label: '변전소' },
        { k: 'sido', label: '시도' },
        { k: 'area', label: '검색지역' },
        ...years.map((y) => ({ k: `y${y}`, label: `${y} MW` })),
        { k: 'firstAvailYear', label: '여유 발생' },
        { k: 'genMw', label: '발전허가(MW)' },
        { k: 'applicants', label: '접속예정(명)' },
      ],
      rows: snapRows,
    }
  })(),
  {
    key: 'gridbuild',
    label: '송변전 건설 파이프라인',
    asOf: GRID_CONSTRUCTION_META.asOf,
    source: `${GRID_CONSTRUCTION_META.source}. ${GRID_CONSTRUCTION_META.note}`,
    fullCsv: null,
    columns: [
      { k: 'stage', label: '단계' },
      { k: 'kv', label: '전압' },
      { k: 'name', label: '사업명' },
      { k: 'kind', label: '설비종류' },
      { k: 'hq', label: '담당본부' },
      { k: 'office', label: '담당사업소' },
    ],
    rows: GRID_CONSTRUCTION.map((r) => ({ ...r, stage: GRID_STAGE_LABEL[r.stage] || r.stage })),
  },
  {
    key: 'deals',
    label: 'DC 거래 사례',
    asOf: '2025-11',
    source: '알스퀘어 리서치센터(2025.11) — 국내 데이터센터 주요 매매 거래. 수전용량 괄호는 IT Load',
    fullCsv: null,
    columns: [
      { k: 'name', label: '자산명' },
      { k: 'addr', label: '주소' },
      { k: 'gfaM2', label: '연면적㎡' },
      { k: 'power', label: '수전용량' },
      { k: 'built', label: '준공' },
      { k: 'dealAt', label: '거래시기' },
      { k: 'priceEok', label: '매입가(억원)' },
      { k: 'seller', label: '매도인' },
      { k: 'buyer', label: '매수인' },
    ],
    rows: DC_DEALS.map((r) => ({ ...r })),
  },
  {
    key: 'racks',
    label: '랙 임대료',
    asOf: '2025',
    source: '알스퀘어 리서치센터(2025.11) — 코로케이션 업체별 공표 랙 임대료. Full 랙 기본 2.2kW(저밀도) — AIDC 고밀도 랙과 과금 구조 상이',
    fullCsv: null,
    columns: [
      { k: 'vendor', label: '사업자' },
      { k: 'rack', label: '랙 타입' },
      { k: 'monthlyKrw', label: '월 임대료(원)' },
      { k: 'basePower', label: '기본 전력' },
      { k: 'extraRate', label: '추가 전력 단가' },
    ],
    rows: RACK_RATES.map((r) => ({ ...r, monthlyKrw: r.monthlyKrw.toLocaleString() })),
  },
  {
    key: 'conflicts',
    label: '개발 갈등 사례',
    asOf: '2025-11',
    source: `알스퀘어 리서치센터(2025.11). ${DEV_CONFLICTS_META.note}`,
    fullCsv: null,
    columns: [
      { k: 'developer', label: '시행사' },
      { k: 'region', label: '지역' },
      { k: 'claims', label: '주민 주장' },
      { k: 'outcome', label: '개발상 이슈' },
    ],
    rows: DEV_CONFLICTS.map((r) => ({ ...r })),
  },
  {
    key: 'dc',
    label: '데이터센터 시설 시드',
    asOf: '2026-07-10',
    source: 'AI InfraMap 시드 v0.1 (공개 소스 집계)',
    fullCsv: null,
    columns: [
      { k: 'name', label: '시설명' },
      { k: 'operator', label: '운영사' },
      { k: 'sido', label: '시도' },
      { k: 'sigungu', label: '시군구' },
      { k: 'type', label: '유형' },
      { k: 'status', label: '상태' },
      { k: 'mw', label: '공개전력MW' },
      { k: 'year', label: '연도' },
    ],
    rows: FACILITIES.map((f) => ({
      name: f.name, operator: f.operator || '', sido: f.sido || '', sigungu: f.sigungu || '',
      type: f.type || '', status: STATUS_LABEL[f.status] || f.status || '', mw: f.power_mw_public ?? '', year: f.year ?? '',
    })),
  },
]

// 입지 배제구역 데이터셋 key — 딥링크(?tab=exclusions) 허용용. 실제 rows/columns는 언어별로 컴포넌트에서 생성.
const EXCLUSION_KEY = 'exclusions'
const DATASET_KEYS = new Set([...DATASETS.map((d) => d.key), EXCLUSION_KEY])

const PER_PAGE = 50

/* 업계 인텔 채널 — 원천 데이터셋 너머, 인사이트 갱신 시 참조하는 정보원 큐레이션.
 * 링크는 최상위(안정) URL만 사용 — 게시물 딥링크는 유실이 잦아 배제. 큐레이션 기준일 2026-07. */
const INTEL_CHANNELS = [
  {
    cat: '데이터센터',
    items: [
      { name: '한국데이터센터연합회 (KDCC)', url: 'https://kdcc.or.kr', desc: '업계 협회 허브 — 뉴스레터·국내 DC 마켓 리포트·데이터센터 서밋 코리아', tags: ['마켓 리포트', '행사'] },
      { name: 'Data Center Dynamics (DCD)', url: 'https://www.datacenterdynamics.com', desc: '글로벌 최대 DC 전문 매체 — 하이퍼스케일·투자·리츠, 국내 프로젝트 속보', tags: ['글로벌', '투자'] },
      { name: '디지털데일리 · 전자신문', url: 'https://www.ddaily.co.kr', desc: '국내 IT지 — 전력계통영향평가·수도권 집중 등 DC 규제 커버리지', tags: ['규제', '계통영향평가'] },
      { name: 'SK에코플랜트 뉴스룸', url: 'https://news.skecoplant.com', desc: '디벨로퍼 기술 블로그 — 랙당 전력밀도, 공랭→수냉 전환 조건 등 실무 디테일', tags: ['냉각', '전력밀도'] },
    ],
  },
  {
    cat: '전력 · 발전',
    items: [
      { name: '전기신문 (electimes)', url: 'https://www.electimes.com', desc: '전력업계 1위 전문지 — 계통·변전·송전 이슈 속보', tags: ['계통', '송전'] },
      { name: '이투뉴스 (e2news)', url: 'https://www.e2news.com', desc: '에너지 정책 심층 — 지역별 차등 요금제 등 굵직한 제도 이슈', tags: ['정책', '차등요금'] },
      { name: '전력거래소 EPSIS', url: 'https://epsis.kpx.or.kr', desc: '실시간 수급·SMP·발전량 원천 통계 — 전력 인사이트의 뿌리', tags: ['원천 데이터', 'SMP'] },
      { name: '정책브리핑 보도자료', url: 'https://www.korea.kr/briefing/pressReleaseList.do', desc: '기후에너지환경부 보도자료·전력수급기본계획 등 정책 원문 확인 경로', tags: ['정책 원문'] },
    ],
  },
  {
    cat: '리포트 · 글로벌',
    items: [
      { name: '삼일PwC — AI 인프라 밸류체인', url: 'https://www.pwc.com/kr/ko/event/event-presentation/event_260318_3-3.pdf', desc: '국가 AI컴퓨팅센터·콜로케이션 사업모델 등 밸류체인 공개 분석 (PDF)', tags: ['밸류체인', 'PDF'] },
      { name: 'SemiAnalysis', url: 'https://semianalysis.com', desc: 'AI 데이터센터 × 전력 글로벌 심층 분석 (딜런 파텔)', tags: ['글로벌', 'AI×전력'] },
    ],
  },
]

/* i18n 사전 — 라벨/제목/출처(리터럴)만 번역. 데이터값·데이터파일 유래 source·소스명(한전·EPSIS 등)은 KO 유지. */
const DS_LABEL_EN = {
  '발전사업 허가 (2024+)': 'Power-gen licenses (2024+)',
  '집단에너지(열병합) 발전소': 'District energy (CHP) plants',
  '2025 신규 발전소(시도별)': '2025 new plants (by sido)',
  '계통 공급여유(시도)': 'Grid headroom (sido)',
  'DC 전력계통영향평가(시도)': 'DC grid impact assessment (sido)',
  '변전소 현황(한전 본부)': 'Substations (KEPCO HQ)',
  '산업단지(전국)': 'Industrial complexes (nationwide)',
  '공급예정 DC': 'Upcoming DC supply',
  '변전소 여유용량(연도별)': 'Substation headroom (by year)',
  '송변전 건설 파이프라인': 'T&D construction pipeline',
  'DC 거래 사례': 'DC deal cases',
  '랙 임대료': 'Rack rates',
  '개발 갈등 사례': 'Development conflict cases',
  '데이터센터 시설 시드': 'Datacenter facility seed',
  '입지 배제구역': 'Exclusion zones',
}
const COL_EN = {
  허가일: 'License date', 시도: 'Sido', '상호(사업자)': 'Business name (operator)', 원동력: 'Prime mover',
  '용량MW(참고치)': 'Capacity MW (indicative)', 허가연도: 'License year', 발전사: 'Operator', 대상발전소: 'Plant',
  관리소: 'Management office', 공급년월: 'Supply date', 발전용량MW: 'Gen capacity MW', '신규 설비용량(KW)': 'New capacity (KW)',
  '발전소 개수': 'Plant count', 공급여유MW: 'Headroom MW', 판정: 'Verdict', 비고: 'Note', 공급가능MW: 'Serviceable MW',
  공급불가MW: 'Non-serviceable MW', '승인율%': 'Approval %', 지역본부: 'Regional HQ', '154kV+ 변전소': '154kV+ substations',
  변압기MVA: 'Transformer MVA', 단지명: 'Complex name', 유형: 'Type', 위도: 'Lat', 경도: 'Lng', 사업자: 'Operator',
  센터명: 'Center name', 위치: 'Location', IT용량MW: 'IT capacity MW', 수전MW: 'Supply MW', 준공예정: 'Due',
  변전소: 'Substation', 검색지역: 'Search area', '여유 발생': 'First headroom', '발전허가(MW)': 'Gen license (MW)',
  '접속예정(명)': 'Pending connections (n)', 단계: 'Stage', 전압: 'Voltage', 사업명: 'Project name', 설비종류: 'Facility type',
  담당본부: 'HQ in charge', 담당사업소: 'Office in charge', 자산명: 'Asset name', 주소: 'Address', '연면적㎡': 'GFA ㎡',
  수전용량: 'Supply capacity', 준공: 'Built', 거래시기: 'Deal date', '매입가(억원)': 'Price (100M KRW)', 매도인: 'Seller',
  매수인: 'Buyer', '랙 타입': 'Rack type', '월 임대료(원)': 'Monthly rent (KRW)', '기본 전력': 'Base power',
  '추가 전력 단가': 'Extra power rate', 시행사: 'Developer', 지역: 'Region', '주민 주장': 'Resident claims',
  '개발상 이슈': 'Development issue', 시설명: 'Facility name', 운영사: 'Operator', 시군구: 'Sigungu', 상태: 'Status',
  공개전력MW: 'Public power MW', 연도: 'Year',
}
const SRC_EN = {
  '3MW 초과 발전사업 허가대장 v2': '3MW+ power-generation license register v2',
  '집단에너지 발전용량·공급량 현황': 'District-energy generation capacity · supply status',
  '2025년도 신규 발전소 설치 현황': '2025 new power-plant installation status',
  '한국전력공사 계통 공급여유(연계가능용량) — 시도 총량': 'KEPCO grid headroom (interconnectable capacity) — sido totals',
  '한전 전력계통영향평가 1차 기술검토 — 데이터센터': 'KEPCO power-grid impact assessment, 1st technical review — datacenters',
  '한국전력공사 변전설비현황 — 지역본부별': 'KEPCO substation facility status — by regional HQ',
  'OpenStreetMap landuse=industrial (지정단지 필터)': 'OpenStreetMap landuse=industrial (designated-complex filter)',
  '삼일PwC(2026.3)·알스퀘어(2025.11) 교차 — 원출처 PwC Analysis·KDCC·국토교통부. IT용량≠수전용량, 준공예정은 지연 가능':
    'Samil PwC (2026.3) · RSquare (2025.11) cross-check — original sources PwC Analysis · KDCC · MOLIT. IT capacity ≠ supply capacity; completion dates may slip',
  '알스퀘어 리서치센터(2025.11) — 국내 데이터센터 주요 매매 거래. 수전용량 괄호는 IT Load':
    'RSquare Research Center (2025.11) — major Korean datacenter transactions. Parenthesized supply capacity is IT Load',
  '알스퀘어 리서치센터(2025.11) — 코로케이션 업체별 공표 랙 임대료. Full 랙 기본 2.2kW(저밀도) — AIDC 고밀도 랙과 과금 구조 상이':
    'RSquare Research Center (2025.11) — published rack rates by colocation vendor. Full rack base 2.2kW (low density) — pricing structure differs from AIDC high-density racks',
  'AI InfraMap 시드 v0.1 (공개 소스 집계)': 'AI InfraMap seed v0.1 (aggregated from public sources)',
}
const CAT_EN = { 데이터센터: 'Datacenter', '전력 · 발전': 'Power · generation', '리포트 · 글로벌': 'Reports · global' }
const DESC_EN = {
  '업계 협회 허브 — 뉴스레터·국내 DC 마켓 리포트·데이터센터 서밋 코리아': 'Industry-association hub — newsletter · Korea DC market reports · Data Center Summit Korea',
  '글로벌 최대 DC 전문 매체 — 하이퍼스케일·투자·리츠, 국내 프로젝트 속보': 'Largest global DC trade outlet — hyperscale · investment · REITs, breaking Korea project news',
  '국내 IT지 — 전력계통영향평가·수도권 집중 등 DC 규제 커버리지': 'Korean IT press — coverage of DC regulation such as grid impact assessment and capital-region concentration',
  '디벨로퍼 기술 블로그 — 랙당 전력밀도, 공랭→수냉 전환 조건 등 실무 디테일': 'Developer tech blog — practical detail such as per-rack power density and air→liquid cooling transition conditions',
  '전력업계 1위 전문지 — 계통·변전·송전 이슈 속보': 'No. 1 power-industry trade paper — breaking grid · substation · transmission news',
  '에너지 정책 심층 — 지역별 차등 요금제 등 굵직한 제도 이슈': 'In-depth energy policy — major institutional issues such as regional differential tariffs',
  '실시간 수급·SMP·발전량 원천 통계 — 전력 인사이트의 뿌리': 'Real-time supply-demand · SMP · generation source statistics — the root of power insights',
  '기후에너지환경부 보도자료·전력수급기본계획 등 정책 원문 확인 경로': 'Path to primary policy texts — Ministry of Climate, Energy and Environment press releases, power supply-demand basic plan, etc.',
  '국가 AI컴퓨팅센터·콜로케이션 사업모델 등 밸류체인 공개 분석 (PDF)': 'Public value-chain analysis — national AI computing center · colocation business models, etc. (PDF)',
  'AI 데이터센터 × 전력 글로벌 심층 분석 (딜런 파텔)': 'Global deep analysis of AI datacenters × power (Dylan Patel)',
}
const TAG_EN = {
  '마켓 리포트': 'Market report', 행사: 'Events', 글로벌: 'Global', 투자: 'Investment', 규제: 'Regulation',
  계통영향평가: 'Grid impact assessment', 냉각: 'Cooling', 전력밀도: 'Power density', 계통: 'Grid', 송전: 'Transmission',
  정책: 'Policy', 차등요금: 'Differential tariff', '원천 데이터': 'Source data', 'SMP': 'SMP', '정책 원문': 'Primary policy',
  밸류체인: 'Value chain', PDF: 'PDF', 'AI×전력': 'AI×power',
}

export default function DataExplorerPage() {
  const en = useMapLang() === 'en'
  const dsL = (ko) => (en ? DS_LABEL_EN[ko] ?? ko : ko)
  const colL = (ko) => (en ? COL_EN[ko] ?? ko : ko)
  const srcL = (ko) => (en ? SRC_EN[ko] ?? ko : ko)
  // 탭 URL 동기화(?tab=) — 카드·아티클에서 특정 데이터셋으로 딥링크 가능하게
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [tab, setTab] = useState(() => (DATASET_KEYS.has(tabParam) ? tabParam : 'gen'))

  // 입지 배제구역 데이터셋 — EXCLUSION_LAYERS(엔진 계약) + manifest(수록 상태) 조인. 언어별 셀값이라 컴포넌트에서 생성.
  // 정직성: manifest가 available=false면 '데이터 대기 / pending' 그대로 노출 — 커버리지를 암시하지 않는다.
  const EXCLUSION_DS = useMemo(() => ({
    key: EXCLUSION_KEY,
    label: '입지 배제구역',
    asOf: EXCLUSION_MANIFEST.asOf || (en ? 'data pending' : '데이터 대기'),
    source: en
      ? 'Legal-exclusion overlay from public GIS polygons (MOLIT · vWorld · MND · MOE · Korea Heritage Service). Population is deployment-side (ops/EXCLUSIONS-RUNBOOK.md) — all layers currently pending; the exclusion engine, map layer and site-panel GO/NO-GO check auto-activate once polygons load'
      : '공개 GIS 폴리곤(국토교통부·브이월드·국방부·환경부·국가유산청) 기반 입지 배제 오버레이. 데이터 주입은 배포측 전용(ops/EXCLUSIONS-RUNBOOK.md) — 현재 전 레이어 데이터 대기, 폴리곤 수록 시 배제 엔진·맵 레이어·부지 패널 GO/NO-GO 판정이 자동 활성화',
    fullCsv: null,
    columns: [
      { k: 'layer', label: en ? 'Layer' : '레이어' },
      { k: 'kind', label: en ? 'Kind (No-go/Restrict)' : '유형(건축 불가/협의 필요)' },
      { k: 'source', label: en ? 'Source' : '출처' },
      { k: 'status', label: en ? 'Status' : '수록 상태' },
    ],
    rows: EXCLUSION_LAYERS.map((L) => {
      const m = EXCLUSION_MANIFEST.layers.find((x) => x.key === L.key)
      const available = !!m?.available
      return {
        layer: en ? L.en : L.ko,
        kind: L.kind === 'block' ? (en ? 'No-go' : '건축 불가') : (en ? 'Restrict' : '협의 필요'),
        source: L.source,
        status: available
          ? (en ? `loaded (${m.asOf})` : `수록 (${m.asOf})`)
          : (en ? 'pending' : '데이터 대기'),
      }
    }),
  }), [en])
  const ALL_DATASETS = useMemo(() => [...DATASETS, EXCLUSION_DS], [EXCLUSION_DS])
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const selectTab = (k) => {
    setTab(k)
    setQ('')
    const next = new URLSearchParams(searchParams)
    if (k === 'gen') next.delete('tab')
    else next.set('tab', k)
    setSearchParams(next, { replace: true })
  }
  useEffect(() => {
    document.title = '데이터 탐색기 — 축적 자료 검색·CSV 다운로드 · AI InfraMap'
    setQ('')
  }, [])

  const ds = ALL_DATASETS.find((d) => d.key === tab)
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return ds.rows
    return ds.rows.filter((r) => ds.columns.some((c) => String(r[c.k] ?? '').toLowerCase().includes(needle)))
  }, [ds, q])
  useEffect(() => setPage(0), [tab, q])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const pageSafe = Math.min(page, pageCount - 1)
  const pageRows = filtered.slice(pageSafe * PER_PAGE, pageSafe * PER_PAGE + PER_PAGE)

  return (
    <>
      <TopBar />
      <div className="power-page">
        <div className="eyebrow">DATA</div>
        <h1 className="power-title">{en ? 'Data explorer — search accumulated sources · CSV download' : '데이터 탐색기 — 축적 자료 검색 · CSV 다운로드'}</h1>
        <p className="power-note">
          {en ? (
            <>
              Search the primary sources AI InfraMap has absorbed and download them as CSV. Each dataset's <strong>base date</strong> is
              shown — the generation license register 2026-04, district energy 2025-07, facility seed 2026-07 — mostly current for 2025~2026.
              (The KDCC facility count of 165 is the 2024 survey, the latest currently published.)
            </>
          ) : (
            <>
              AI InfraMap이 흡수한 원천 자료를 직접 검색하고 CSV로 내려받을 수 있습니다. 각 데이터셋의 <strong>기준일</strong>을
              함께 표기 — 발전 허가대장 2026-04, 집단에너지 2025-07, 시설 시드 2026-07로 대부분 2025~2026 최신입니다.
              (KDCC 시설 수 165는 2024 조사가 현재 공표된 최신치입니다.)
            </>
          )}
        </p>

        <div className="seg-tabs" role="tablist" aria-label={en ? 'Dataset categories' : '데이터셋 분류'}>
          {ALL_DATASETS.map((d) => (
            <button key={d.key} type="button" role="tab" className={`seg-tab ${tab === d.key ? 'on' : ''}`} onClick={() => selectTab(d.key)} aria-selected={tab === d.key}>
              {dsL(d.label)} <span className="n">{d.rows.length.toLocaleString()}</span>
            </button>
          ))}
        </div>

        <div className="explorer-bar">
          <input
            className="explorer-search"
            type="search"
            placeholder={en ? `Search ${dsL(ds.label)} (name · region · fuel, etc.)` : `${ds.label} 검색 (상호·지역·연료 등)`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label={en ? 'Search data' : '데이터 검색'}
          />
          <span className="explorer-count">
            {filtered.length.toLocaleString()} / {ds.rows.length.toLocaleString()}{en ? '' : '건'}
          </span>
          <button
            type="button"
            className="btn primary"
            onClick={() => downloadCsv(`aiinframap_${ds.key}_${q ? 'filtered_' : ''}${ds.asOf}.csv`, toCsv(ds.columns, filtered))}
          >
            {en ? `⬇ Download CSV${q ? ' (results)' : ''}` : `⬇ CSV 다운로드${q ? ' (검색결과)' : ''}`}
          </button>
          {ds.fullCsv && (
            <a className="btn" href={ds.fullCsv} download>
              ⬇ {en ? ds.fullLabelEn ?? ds.fullLabel : ds.fullLabel}
            </a>
          )}
        </div>
        <p className="chart-note" style={{ marginTop: 6 }}>
          {en ? (
            <>
              Base date <strong>{ds.asOf}</strong> · Source: {srcL(ds.source)}. {PER_PAGE} per page · browsing all {filtered.length.toLocaleString()} rows (search · CSV cover the full set). Capacity (MW) is indicative.
            </>
          ) : (
            <>
              기준일 <strong>{ds.asOf}</strong> · 출처: {ds.source}. 페이지당 {PER_PAGE}건 · 전체 {filtered.length.toLocaleString()}건 브라우징(검색·CSV는 전체 대상). 용량(MW)은 참고치.
            </>
          )}
        </p>
        {ds.key === EXCLUSION_KEY && (
          <p className="chart-note" style={{ marginTop: 6 }}>
            {en ? (
              <>
                A “can you legally build” GO/NO-GO overlay outside the five axes. All five layers are currently{' '}
                <strong>data-pending</strong> — nothing here says a specific parcel is covered or clear. Once public GIS
                polygons are loaded deployment-side, each layer flips to “loaded (asOf)” and the exclusion check activates
                automatically. See <Link to="/insights/external-gates-2026">the external-gates brief</Link>.
              </>
            ) : (
              <>
                5축 밖 ‘법적으로 지을 수 있나’ GO/NO-GO 오버레이입니다. 현재 5개 레이어 전부{' '}
                <strong>데이터 대기</strong> — 특정 부지의 저촉·해당 없음을 뜻하지 않습니다. 배포측에서 공개 GIS 폴리곤이
                수록되면 각 레이어가 ‘수록(asOf)’으로 바뀌고 배제 판정이 자동 활성화됩니다.{' '}
                <Link to="/insights/external-gates-2026">외부 관문 브리프</Link> 참조.
              </>
            )}
          </p>
        )}

        <div className="explorer-table-wrap">
          <table className="explorer-table">
            <thead>
              <tr>
                <th style={{ width: 44, textAlign: 'right' }}>#</th>
                {ds.columns.map((c) => <th key={c.k}>{colL(c.label)}</th>)}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, i) => (
                <tr key={i}>
                  <td style={{ textAlign: 'right', color: 'var(--grey)' }}>{pageSafe * PER_PAGE + i + 1}</td>
                  {ds.columns.map((c) => <td key={c.k}>{r[c.k] === '' || r[c.k] == null ? '—' : String(r[c.k])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="chart-note" style={{ padding: '12px' }}>{en ? 'No search results.' : '검색 결과가 없습니다.'}</p>}
        </div>

        {pageCount > 1 && (
          <div className="pager">
            <button type="button" className="btn" disabled={pageSafe === 0} onClick={() => setPage(0)}>{en ? '« First' : '« 처음'}</button>
            <button type="button" className="btn" disabled={pageSafe === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>{en ? '‹ Prev' : '‹ 이전'}</button>
            <span className="pager-info">
              {pageSafe + 1} / {pageCount} {en ? 'page' : '페이지'} · {(pageSafe * PER_PAGE + 1).toLocaleString()}–{Math.min((pageSafe + 1) * PER_PAGE, filtered.length).toLocaleString()}
            </span>
            <button type="button" className="btn" disabled={pageSafe >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}>{en ? 'Next ›' : '다음 ›'}</button>
            <button type="button" className="btn" disabled={pageSafe >= pageCount - 1} onClick={() => setPage(pageCount - 1)}>{en ? 'Last »' : '마지막 »'}</button>
          </div>
        )}

        <section className="intel-section" aria-label={en ? 'Industry intel channels' : '업계 인텔 채널'}>
          <div className="eyebrow">WATCH</div>
          <h2 className="intel-title">{en ? 'Industry intel channels — sources beyond the datasets' : '업계 인텔 채널 — 데이터셋 너머의 정보원'}</h2>
          <p className="chart-note">
            {en ? (
              <>
                A curation of trade press · associations · primary statistics referenced when updating and interpreting the datasets above. Korea's DC scene is more{' '}
                <strong>trade press + associations + reports</strong> than community-driven — all links open external sites. Curated as of 2026-07.
              </>
            ) : (
              <>
                위 데이터셋을 갱신·해석할 때 참조하는 전문지·협회·원천 통계 큐레이션입니다. 국내 DC 판은 커뮤니티보다{' '}
                <strong>전문지 + 협회 + 리포트</strong> 중심 — 모든 링크는 외부 사이트로 열립니다. 큐레이션 기준 2026-07.
              </>
            )}
          </p>
          <div className="intel-grid">
            {INTEL_CHANNELS.map((g) => (
              <div key={g.cat} className="intel-card">
                <h3>{en ? CAT_EN[g.cat] ?? g.cat : g.cat}</h3>
                {g.items.map((it) => (
                  <a key={it.name} className="intel-item" href={it.url} target="_blank" rel="noopener noreferrer">
                    <span className="intel-name">
                      {it.name} <span className="intel-ext" aria-hidden="true">↗</span>
                    </span>
                    <span className="intel-desc">{en ? DESC_EN[it.desc] ?? it.desc : it.desc}</span>
                    <span className="intel-tags">
                      {it.tags.map((t) => (
                        <span key={t} className="intel-tag">{en ? TAG_EN[t] ?? t : t}</span>
                      ))}
                    </span>
                  </a>
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
