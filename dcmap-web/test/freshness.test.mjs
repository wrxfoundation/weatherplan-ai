// 데이터 최신성 판정 — 화면(/data·기준일 칩)과 주간 Action 리포트가 같은 함수를 쓴다
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DATASETS, judge, normAsOf, periodEnd, evaluateFreshness, STATUS, METHODS, GROUPS } from '../src/data/freshness.js'
import { deriveAsOf } from '../src/data/freshnessSources.js'

const D = (s) => new Date(`${s}T00:00:00Z`)

test('freshness_asof.json이 원본 데이터와 일치 (어긋나면 node scripts/gen-freshness-asof.mjs)', () => {
  const committed = JSON.parse(readFileSync(new URL('../data/freshness_asof.json', import.meta.url), 'utf8'))
  assert.deepEqual(committed, deriveAsOf())
})

test('normAsOf: 표기 통일', () => {
  assert.equal(normAsOf('2026.3.27'), '2026-03-27')
  assert.equal(normAsOf('2026-7'), '2026-07')
  assert.equal(normAsOf('2025'), '2025')
  assert.equal(normAsOf(null), null)
})

test('periodEnd: 기간의 마지막 날', () => {
  assert.equal(periodEnd('2026-02').toISOString().slice(0, 10), '2026-02-28')
  assert.equal(periodEnd('2024').toISOString().slice(0, 10), '2024-12-31')
  assert.equal(periodEnd('2026.3.27').toISOString().slice(0, 10), '2026-03-27')
  assert.equal(periodEnd('미상'), null)
})

test('judge: 월간 자료 — 공표 예정일 전 최신, 지나면 지연(밀린 기간 수)', () => {
  const ds = { asOf: '2026-05', cadence: { kind: 'periodic', days: 31, lagDays: 30 } }
  assert.equal(judge(ds, D('2026-06-15')).status, 'fresh')
  assert.equal(judge(ds, D('2026-07-25')).status, 'soon')
  const late = judge(ds, D('2026-10-23'))
  assert.equal(late.status, 'overdue')
  assert.ok(late.behind >= 2)
})

test('judge: 기준일 없으면 날짜를 지어내지 않는다', () => {
  assert.equal(judge({ asOf: null, cadence: { kind: 'review', days: 90 } }, D('2026-10-23')).status, 'unknown')
  assert.equal(judge({ asOf: null, notCollected: true, cadence: { kind: 'review', days: 90 } }, D('2026-10-23')).status, 'pending')
  assert.equal(judge({ asOf: null, cadence: { kind: 'live' } }, D('2026-10-23')).status, 'live')
})

test('judge: 변전소 스냅샷은 최신 수집 월을 컨텍스트로 받는다', () => {
  const ds = DATASETS.find((d) => d.id === 'headroom-snap')
  assert.equal(judge(ds, D('2026-10-23'), { headroomLatest: '2026-10' }).asOf, '2026-10')
  assert.equal(judge(ds, D('2026-10-23'), {}).status, 'unknown')
})

test('레지스트리 무결성: id 고유, 상태·방식·그룹 사전 일치, EN 출처 존재', () => {
  const ids = DATASETS.map((d) => d.id)
  assert.equal(new Set(ids).size, ids.length)
  for (const d of DATASETS) {
    assert.ok(METHODS[d.method], `${d.id} method`)
    assert.ok(GROUPS[d.group], `${d.id} group`)
    assert.ok(d.nameEn && d.sourceEn, `${d.id} EN`)
  }
  const { rows } = evaluateFreshness(D('2026-10-23'), { headroomLatest: '2026-10' })
  for (const r of rows) assert.ok(STATUS[r.status], `${r.id} → ${r.status}`)
})
