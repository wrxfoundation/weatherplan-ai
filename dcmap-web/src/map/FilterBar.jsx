import { SIDOS, TYPES } from '../data/facilities.js'

const STATUS_OPTIONS = [
  { key: 'operating', label: '운영' },
  { key: 'construction', label: '건설' },
  { key: 'planned', label: '계획' },
]

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
  showComplexes,
  onToggleComplexes,
  showPublic,
  onTogglePublic,
  power = false,
  showGenPermits,
  onToggleGenPermits,
  showHeadroom,
  onToggleHeadroom,
}) {
  return (
    <div className="filterbar">
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

      {/* 지도 레이어 토글 — 시설/전력 정보를 지도 위에 겹쳐 표시(기본 OFF, 필요할 때만) */}
      <div className="group layer-group" role="group" aria-label="지도 레이어">
        <span className="group-label">레이어</span>
        <button
          type="button"
          className={`chip ${showLabels ? 'on' : ''}`}
          onClick={onToggleLabels}
          aria-pressed={showLabels}
          title="맵 위 시설명·용량 라벨 켜기/끄기"
        >
          🏷 라벨
        </button>
        <button
          type="button"
          className={`chip ${showSubs ? 'on' : ''}`}
          onClick={onToggleSubs}
          aria-pressed={showSubs}
          title="154kV+ 변전소 841개 — DC가 전기를 받는 접속점(OSM 좌표). 전압별 색: 154kV 하늘 / 345kV 보라 / 765kV 분홍"
        >
          🔌 변전소
        </button>
        <button
          type="button"
          className={`chip ${showPlants ? 'on' : ''}`}
          onClick={onTogglePlants}
          aria-pressed={showPlants}
          title="대형 발전단지(원전·석탄) 레이어 — 발전 인프라 근접성 맥락 (DC 전원 매칭 아님)"
        >
          ⚡ 발전소
        </button>
        <button
          type="button"
          className={`chip ${showComplexes ? 'on' : ''}`}
          onClick={onToggleComplexes}
          aria-pressed={showComplexes}
          title="전국 산업단지 511개 — 인센티브·전력/용수 기반시설 사전확보 입지(OSM 지정단지, 대표점 근사)"
        >
          🏭 산단
        </button>
        <button
          type="button"
          className={`chip ${showGenPermits ? 'on' : ''}`}
          onClick={onToggleGenPermits}
          aria-pressed={showGenPermits}
          title="2024년 이후 발전사업 허가 파이프라인 — 시도별 건수 버블(3MW 초과 허가대장). 전력 공급측 신호, 건수 기준"
        >
          ◎ 발전허가
        </button>
        <button
          type="button"
          className={`chip ${showHeadroom ? 'on' : ''}`}
          onClick={onToggleHeadroom}
          aria-pressed={showHeadroom}
          title="계통 여유용량 — 시도별 한전 분산전원 여유(KEPCO env 연동 시 실데이터, 미연동 시 연동 대기)"
        >
          ⚡ 여유용량
        </button>
        <button
          type="button"
          className={`chip ${showPublic ? 'on' : ''}`}
          onClick={onTogglePublic}
          aria-pressed={showPublic}
          title="행정·공공기관 데이터센터 61곳 — 행안부 공공데이터(연면적 500㎡+), 좌표는 시군구 중심점"
        >
          公 공공DC
        </button>
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
    </div>
  )
}
