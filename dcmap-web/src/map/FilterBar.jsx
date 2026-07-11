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
  onClearMw,
  showLabels,
  onToggleLabels,
  showPlants,
  onTogglePlants,
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

      <div className="group">
        <button
          type="button"
          className={`chip ${showLabels ? 'on' : ''}`}
          onClick={onToggleLabels}
          aria-pressed={showLabels}
          title="맵 위 시설명·용량 라벨 켜기/끄기"
        >
          라벨 {showLabels ? 'ON' : 'OFF'}
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
          className={`chip ${showPublic ? 'on' : ''}`}
          onClick={onTogglePublic}
          aria-pressed={showPublic}
          title="행정·공공기관 데이터센터 61곳 — 행안부 공공데이터(연면적 500㎡+), 좌표는 시군구 중심점"
        >
          公 공공
        </button>
        {power && (
          <>
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
          </>
        )}
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

      {minMw != null && (
        <span className="mw-chip">
          필요 용량 ≥ {minMw} MW
          <button type="button" onClick={onClearMw} aria-label="용량 필터 해제">
            ×
          </button>
        </span>
      )}
    </div>
  )
}
