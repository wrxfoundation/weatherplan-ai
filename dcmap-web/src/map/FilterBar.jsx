import { SIDOS, TYPES } from '../data/facilities.js'

const STATUS_OPTIONS = [
  { key: 'operating', label: '운영' },
  { key: 'construction', label: '건설' },
  { key: 'planned', label: '계획' },
]

// 레이어 아이콘 — 라인(스트로크) 형태로 통일. currentColor 상속, 14px.
const ICON_PATHS = {
  label: <path d="M2.5 2.5h5l5 5-5 5-5-5v-5Z M5.2 5.2h.01" />,
  substation: <path d="M8 1.5 4.5 8H8l-1 4.5L11.5 6H8l0-4.5Z" />, // 번개(변전소 접속점)
  line: <path d="M2 13 5.5 4 9 13 12.5 4 M2 8.5h8" />, // 송전 철탑
  plant: <path d="M2 13V8l3.2 1.8V8l3.2 1.8V4h3.6v9Z M2 13h9.9" />, // 발전소
  renew: <path d="M8 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7 M8 1v2 M8 13v2 M1 8h2 M13 8h2" />, // 재생(태양)
  water: <path d="M8 1.5S3.5 6.5 3.5 9.8a4.5 4.5 0 0 0 9 0C12.5 6.5 8 1.5 8 1.5Z" />, // 수원(물방울)
  semi: <path d="M5 5h6v6H5z M6.5 2.5v2 M9.5 2.5v2 M6.5 11.5v2 M9.5 11.5v2 M2.5 6.5h2 M2.5 9.5h2 M11.5 6.5h2 M11.5 9.5h2" />, // 반도체(칩)
  permit: <path d="M3.5 2h5l3 3v9h-8Z M8.2 2v3h3 M5.5 8.5l1.3 1.3 2.4-2.6" />, // 허가(문서+체크)
  headroom: <path d="M2.5 12a5.5 5.5 0 0 1 11 0 M8 12l2.7-3" />, // 게이지(여유)
  complex: <path d="M2.5 13V6l4-2v3l4-2v8Z M2.5 13h9 M5 8v.01 M8.5 8v.01" />, // 산단
  telecom: <path d="M8 13V7 M4.2 4.2a5.4 5.4 0 0 1 7.6 0 M6 6a2.8 2.8 0 0 1 4 0" />, // 통신 안테나
  public: <path d="M2.5 13h11 M3.5 13V6.5l4.5-3 4.5 3V13 M6.5 13V9h3v4" />, // 공공 건물
  reco: <path d="M8 1.8l1.8 3.9 4.2.5-3.1 2.9.8 4.2L8 11.9 4.3 13.2l.8-4.2L2 6.1l4.2-.5Z" />, // 추천(별)
}
function Icon({ name }) {
  return (
    <svg className="chip-ico" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICON_PATHS[name]}
    </svg>
  )
}

export default function FilterBar({
  statuses,
  onToggleStatus,
  type,
  onType,
  sido,
  onSido,
  minMw,
  onMinMw,
  zone,
  onZone,
  showLabels,
  onToggleLabels,
  showPlants,
  onTogglePlants,
  showSubs,
  onToggleSubs,
  showLines,
  onToggleLines,
  hasLines = false,
  showComplexes,
  onToggleComplexes,
  showNet,
  onToggleNet,
  showRe,
  onToggleRe,
  showWater,
  onToggleWater,
  showSemi,
  onToggleSemi,
  showReco,
  onToggleReco,
  showPublic,
  onTogglePublic,
  power = false,
  showGenPermits,
  onToggleGenPermits,
  showHeadroom,
  onToggleHeadroom,
}) {
  // 레이어 토글을 의미 단위로 그루핑(방대해진 레이어 정돈): 표시·전력·자원·수요·망.
  // cond:false 인 항목(예: 송전선 데이터 없음)은 렌더 제외.
  const LAYER_GROUPS = [
    {
      label: '전력',
      chips: [
        { key: 'subs', icon: 'substation', text: '변전소', on: showSubs, toggle: onToggleSubs, title: '154kV+ 변전소 841개 — DC가 전기를 받는 접속점(OSM 좌표). 전압별 색: 154kV 하늘 / 345kV 보라 / 765kV 분홍' },
        { key: 'lines', icon: 'line', text: '송전선', on: showLines, toggle: onToggleLines, cond: hasLines, title: '송전선로 — OSM power=line, 전압별 색(OpenInfraMap 준거). 154kV+ 계통망' },
        { key: 'plants', icon: 'plant', text: '발전소', on: showPlants, toggle: onTogglePlants, title: '대형 발전단지(원전·석탄) 레이어 — 발전 인프라 근접성 맥락 (DC 전원 매칭 아님)' },
        { key: 'permit', icon: 'permit', text: '발전허가', on: showGenPermits, toggle: onToggleGenPermits, title: '2024년 이후 발전사업 허가 파이프라인 — 시도별 건수 버블(3MW 초과 허가대장). 전력 공급측 신호, 건수 기준' },
        { key: 'headroom', icon: 'headroom', text: '여유용량', on: showHeadroom, toggle: onToggleHeadroom, title: '계통 여유용량 — 시도별 한전 분산전원 여유(KEPCO env 연동 시 실데이터, 미연동 시 연동 대기)' },
      ],
    },
    {
      label: '자원',
      chips: [
        { key: 're', icon: 'renew', text: '재생', on: showRe, toggle: onToggleRe, title: '재생발전단지 — 대형 태양광·풍력(OSM). RE100/PPA 조달 맥락. 초록=풍력/노랑=태양광' },
        { key: 'water', icon: 'water', text: '수원', on: showWater, toggle: onToggleWater, title: '주요 수원 — 한국수자원공사 다목적댐 20·용수댐 14. DC 냉각수 공급원 근접 맥락. 크기=총저수용량(좌표는 행정주소 근사)' },
      ],
    },
    {
      label: '수요',
      chips: [
        { key: 'semi', icon: 'semi', text: '반도체', on: showSemi, toggle: onToggleSemi, title: '반도체·AI 메가클러스터 — 용인 국가산단(9.3GW)·평택·이천·청주·광주전남(6.3GW·65만t/일). AI DC와 전력·용수를 두고 경쟁/공존하는 대수요처. 점선=예정. 출처: 3대 메가프로젝트 국민보고회' },
        { key: 'complex', icon: 'complex', text: '산단', on: showComplexes, toggle: onToggleComplexes, title: '전국 산업단지 511개 — 인센티브·전력/용수 기반시설 사전확보 입지(OSM 지정단지, 대표점 근사)' },
        { key: 'public', icon: 'public', text: '공공DC', on: showPublic, toggle: onTogglePublic, title: '행정·공공기관 데이터센터 61곳 — 행안부 공공데이터(연면적 500㎡+), 좌표는 시군구 중심점' },
      ],
    },
    {
      label: '망',
      chips: [
        { key: 'net', icon: 'telecom', text: '통신망', on: showNet, toggle: onToggleNet, title: '통신망 — 백본 국사·IDC·해저케이블 육양국(OSM telecom + 시드). 네트워크축 근거' },
      ],
    },
  ]
  return (
    <div className="filterbar">
      {/* 1줄: 상태 + 검색컨트롤 + 표시 (넘치면 가로 스크롤) */}
      <div className="fb-row">
      <div className="group">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`chip ${statuses.has(s.key) ? 'on' : ''}`}
            onClick={() => onToggleStatus(s.key)}
          >
            <span className={`dot ${s.key}`} />
            {s.label}
          </button>
        ))}
      </div>

      <select value={type} onChange={(e) => onType(e.target.value)} aria-label="유형 필터">
        <option value="">유형 전체</option>
        {TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <select value={sido} onChange={(e) => onSido(e.target.value)} aria-label="시도 필터">
        <option value="">시도 전체</option>
        {SIDOS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {/* 세부 검색 조건 — 필요 용량·입지(관문 유리)를 검색조건으로 흡수 */}
      <label className="mw-input" title="공개 전력 이 값 이상인 시설만">
        용량 ≥
        <input
          type="number"
          min="0"
          step="10"
          inputMode="numeric"
          placeholder="MW"
          value={minMw ?? ''}
          onChange={(e) => onMinMw(e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0))}
          aria-label="최소 필요 용량(MW)"
        />
        MW
      </label>
      {/* 입지: 전체 / 수도권 / 비수도권 */}
      <div className="group" title="수도권(서울·경기·인천)은 계통영향평가 ±15점 감점, 비수도권은 가점·AIDC 특별법 면제 유인">
        <button type="button" className={`chip ${!zone ? 'on' : ''}`} onClick={() => onZone('')} aria-pressed={!zone}>
          입지 전체
        </button>
        <button type="button" className={`chip ${zone === 'cap' ? 'on' : ''}`} onClick={() => onZone('cap')} aria-pressed={zone === 'cap'}>
          수도권
        </button>
        <button type="button" className={`chip ${zone === 'non' ? 'on' : ''}`} onClick={() => onZone('non')} aria-pressed={zone === 'non'}>
          비수도권
        </button>
      </div>

      {/* 표시·추천 — 데이터 레이어와 성격이 달라 윗줄(검색컨트롤 옆)로. 방대한 레이어 줄을 덜고 윗줄 여백을 채움 */}
      <div className="group" role="group" aria-label="표시">
        <span className="group-sublabel">표시</span>
        <button
          type="button"
          className={`chip chip-reco ${showReco ? 'on' : ''}`}
          onClick={onToggleReco}
          aria-pressed={showReco}
          title="AI 추천 입지 TOP20 — 산업단지 후보를 정적 근거(변전소·공급여유·승인율·네트워크·자가발전)로 랭킹. 클릭 시 전체 분석"
        >
          <Icon name="reco" /> 추천입지
        </button>
        <button
          type="button"
          className={`chip ${showLabels ? 'on' : ''}`}
          onClick={onToggleLabels}
          aria-pressed={showLabels}
          title="맵 위 시설명·용량 라벨 켜기/끄기"
        >
          <Icon name="label" /> 라벨
        </button>
      </div>
      </div>

      {/* 2줄: 지도 레이어(전력·자원·수요·망) — 서브그룹별 독립 알약, 넘치면 이 줄만 가로 스크롤(2줄 유지) */}
      <div className="fb-row fb-row-layers" role="group" aria-label="지도 레이어">
        <span className="group-label">레이어</span>
        {LAYER_GROUPS.map((sg) => {
          const chips = sg.chips.filter((c) => c.cond !== false)
          if (!chips.length) return null
          return (
            <div className="group layer-pill" key={sg.label} role="group" aria-label={`레이어 ${sg.label}`}>
              <span className="group-sublabel">{sg.label}</span>
              {chips.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className={`chip ${c.cls ? `${c.cls} ` : ''}${c.on ? 'on' : ''}`}
                  onClick={c.toggle}
                  aria-pressed={c.on}
                  title={c.title}
                >
                  <Icon name={c.icon} /> {c.text}
                </button>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
