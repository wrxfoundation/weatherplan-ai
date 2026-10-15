import { useEffect, useState } from 'react'

/**
 * 실데이터 소스 — server/collect.mjs 가 만든 public/live/community.json 을 읽는다.
 *
 * 파일이 없으면(=아직 수집기를 안 돌렸으면) 화면은 데모 데이터를 그대로 쓰고
 * 「미연동」으로 표시한다. 없는 데이터를 있는 것처럼 보이게 하지 않는다.
 */

export type LiveChat = { title: string; username: string | null; members: number }

export type LiveData = {
  generatedAt: string
  telegram: {
    channel: LiveChat | null
    group: LiveChat | null
    series: { date: string; channel: number | null; group: number | null }[]
    sources: { name: string; label: string; count: number }[]
    sourcesAvailable: boolean
  }
  x: { followers: number | null; manual: boolean }
}

export type LiveState =
  | { status: 'loading' }
  | { status: 'none' }              // 수집 파일 없음 = 아직 연동 전
  | { status: 'live'; data: LiveData }

export function useLiveCommunity(): LiveState {
  const [state, setState] = useState<LiveState>({ status: 'loading' })

  useEffect(() => {
    let alive = true
    fetch(`${import.meta.env.BASE_URL}live/community.json`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('no-live'))))
      .then((d: LiveData) => { if (alive) setState({ status: 'live', data: d }) })
      .catch(() => { if (alive) setState({ status: 'none' }) })
    return () => { alive = false }
  }, [])

  return state
}

/** 수집 시각이 얼마나 지났는지 — 오래된 데이터를 '지금'처럼 보이지 않게 한다 */
export function freshness(iso: string): { text: string; stale: boolean } {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return { text: '방금', stale: false }
  if (min < 60) return { text: `${min}분 전`, stale: min > 90 }
  const h = Math.floor(min / 60)
  if (h < 24) return { text: `${h}시간 전`, stale: h >= 3 }
  return { text: `${Math.floor(h / 24)}일 전`, stale: true }
}
