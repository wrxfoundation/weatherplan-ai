import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { YOKAI } from '../data/yokai.js'
import { useWeather } from '../data/useWeather.js'
import { omenIndex, rankYokai, WEATHER_LABEL } from '../engine/omen.js'
import Icon, { WEATHER_ICON } from '../ui/Icon.jsx'

/**
 * 날씨 × 괴담 위젯 — 일본판이 붙일 수 없는 축.
 * 관측값을 전승 조건(omens.weather/time/season)에 맞춰 점수화하고, 왜 그런지를 함께 보여 준다.
 */
export default function OmenPanel({ lat, lng, sido, now = new Date() }) {
  const { loading, data } = useWeather(lat, lng)

  const ctx = useMemo(
    () => ({ weather: data, hour: now.getHours(), month: now.getMonth() + 1, sido }),
    [data, now, sido],
  )
  const index = useMemo(() => omenIndex(ctx), [ctx])
  const ranked = useMemo(() => rankYokai(YOKAI, ctx, 4), [ctx])

  return (
    <div className="panel omen">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <strong className="small row" style={{ gap: 5 }}>
          <Icon name="flame" size={15} style={{ color: 'var(--gold)' }} />
          오늘의 괴담지수
        </strong>
        <span className="small muted">{data?.place ?? (sido ? `${sido} 일원` : '현재 지점')}</span>
      </div>

      <div className="omen-score">
        <b>{index.score}</b>
        <span className="small muted">/100 · {index.grade}</span>
      </div>
      <div className="omen-bar">
        <span style={{ width: `${index.score}%` }} />
      </div>

      <div className="small muted">
        {loading
          ? '관측값 확인 중…'
          : data?.available
            ? [
                data.tempC != null ? `${data.tempC}℃` : null,
                data.humidity != null ? `습도 ${data.humidity}%` : null,
                data.windMs != null ? `바람 ${data.windMs}m/s` : null,
                data.skyText,
              ]
                .filter(Boolean)
                .join(' · ')
            : `실시간 관측 미연동 — 시각·계절만 반영 (${data?.reason ?? '조회 실패'})`}
      </div>

      {index.factors.length > 0 && (
        <div className="row small" style={{ marginTop: 6, gap: 4 }}>
          {index.factors.map((f) => (
            <span key={f.kind + f.label} className="badge" style={{ color: 'var(--gold)' }}>
              <Icon name={f.kind === 'time' ? 'moon' : (WEATHER_ICON[f.code] ?? 'cloud')} size={12} />
              {f.label} +{f.points}
            </span>
          ))}
        </div>
      )}

      <ul>
        {ranked.length === 0 && (
          <li>
            <span className="muted">지금 조건에 맞는 전승 기록이 없습니다</span>
          </li>
        )}
        {ranked.map(({ entry, reasons }) => (
          <li key={entry.id}>
            <Link to={`/yokai/${entry.id.replace(/^kr-/, '')}`}>{entry.canonical}</Link>
            <span className="muted" style={{ textAlign: 'right' }}>
              {reasons[0]}
            </span>
          </li>
        ))}
      </ul>

      <p className="small muted" style={{ margin: '8px 0 0' }}>
        전승에 기상 조건이 기록된 개체만 점수를 받습니다({Object.keys(WEATHER_LABEL).length}종 조건).
      </p>
    </div>
  )
}
