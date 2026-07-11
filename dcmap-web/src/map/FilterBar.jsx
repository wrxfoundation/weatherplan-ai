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
