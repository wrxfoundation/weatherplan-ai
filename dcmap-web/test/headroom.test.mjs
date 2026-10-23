// 변전소 여유 — 프록시 응답 해석 · 스냅샷 비교 · 시군구 요약 · 수집 대상 무결성
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { parseTrans, seriesOf } from '../scripts/lib/headroom-parse.mjs'
import { normEntry, entriesOf, changeFeed, sigunguSummary, displaySigungu, firstAvailYear } from '../src/data/headroomLogic.js'

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'))
const YEARS = [2026, 2027, 2028]
const TARGET = { admCd: '41820', sido: '경기', sigungu: '가평군' }

test('seriesOf: 연도 정렬, 빈 값은 0, 항목 없으면 null', () => {
  assert.deepEqual(seriesOf({ years: [2027, 2026, 2028], series: [5, 3, ''] }, YEARS), [3, 5, 0])
  assert.deepEqual(seriesOf({ byYear: { 2026: 1, 2028: 9 } }, YEARS), [1, 0, 9])
  assert.equal(seriesOf(null, YEARS), null)
})

test('parseTrans: 세 흐름을 변전소별로 합치고, 없는 흐름은 null(0과 구분)', () => {
  const json = {
    available: true,
    supply: { kv154: [{ name: '가평', emd: '가평읍', years: YEARS, series: [0, 100, 120] }], kv23: [] },
    renew: { kv154: [{ name: '가평', years: YEARS, series: [370, 370, 125] }, { name: '미금', years: YEARS, series: [785, 785, 800], genMw: 12 }] },
  }
  const out = parseTrans(json, TARGET, YEARS)
  assert.equal(out.length, 2)
  const g = out.find((e) => e.name === '가평')
  assert.equal(g.key, '41820:가평')
  assert.deepEqual(g.supply, [0, 100, 120])
  assert.equal(g.supply23, null)
  const m = out.find((e) => e.name === '미금')
  assert.equal(m.supply, null)
  assert.equal(m.genMw, 12)
  assert.deepEqual(parseTrans({ available: false }, TARGET, YEARS), [])
})

test('parseTrans: 구 스키마(supply.list)도 읽는다', () => {
  const out = parseTrans({ supply: { list: [{ name: 'A', 2026: 10, 2027: 20, 2028: 0 }] } }, TARGET, YEARS)
  assert.deepEqual(out[0].supply, [10, 20, 0])
})

test('normEntry: v1 시드를 v2 모양으로', () => {
  const e = normEntry({ name: '가평', sido: '경기', area: '가평군 가평읍', series: [1, 2] })
  assert.equal(e.key, '가평')
  assert.equal(e.sigungu, '가평군')
  assert.deepEqual(e.renew, [1, 2])
  assert.equal(e.supply, null)
})

test('changeFeed: 같은 변전소·연도·흐름만 비교, 임계 미만 제외', () => {
  const prev = { asOf: '2026-07', years: YEARS, entries: [{ name: 'A', sido: '경기', area: '가평군', series: [100, 100, 100] }] }
  const cur = { asOf: '2026-10', years: YEARS, entries: [{ key: '41820:A', name: 'A', sido: '경기', sigungu: '가평군', renew: [100, 105, 40], supply: [1, 2, 3] }] }
  const f = changeFeed(prev, cur)
  assert.equal(f.from, '2026-07')
  assert.equal(f.compared, 1)
  assert.equal(f.changes.length, 1)
  assert.deepEqual([f.changes[0].year, f.changes[0].was, f.changes[0].now, f.changes[0].delta], [2028, 100, 40, -60])
})

test('displaySigungu·firstAvailYear', () => {
  assert.equal(displaySigungu('포항시남구'), '포항시 남구')
  assert.equal(displaySigungu('가평군'), '가평군')
  assert.equal(firstAvailYear([0, 0, 5], YEARS), 2028)
  assert.equal(firstAvailYear([0, 0, 0], YEARS), null)
})

test('실제 스냅샷: 형식·연도 길이·키 고유', () => {
  const dir = new URL('../data/headroom_snapshots/', import.meta.url)
  const files = readdirSync(dir).filter((f) => /^\d{4}-\d{2}\.json$/.test(f))
  assert.ok(files.length >= 2)
  for (const f of files) {
    const snap = read(`../data/headroom_snapshots/${f}`)
    const entries = entriesOf(snap)
    assert.ok(entries.length > 0, f)
    const keys = entries.map((e) => e.key)
    assert.equal(new Set(keys).size, keys.length, `${f} 키 중복`)
    for (const e of entries) for (const s of ['supply', 'supply23', 'renew']) {
      if (e[s] != null) assert.equal(e[s].length, snap.years.length, `${f} ${e.key} ${s}`)
    }
  }
  const latest = read(`../data/headroom_snapshots/${files.sort().at(-1)}`)
  const rows = sigunguSummary(latest)
  assert.ok(rows.every((r) => r.nowCount <= r.measured && r.measured <= r.substations))
})

test('수집 대상: DC 시설이 모두 어느 시군구 대상에 들어 있다', () => {
  const targets = read('../data/headroom_targets.json').targets
  const facilities = read('../data/dc_centers.json').facilities
  const covered = new Set(targets.flatMap((t) => t.facilities || []))
  const missing = facilities.filter((f) => !covered.has(f.id)).map((f) => f.id)
  assert.deepEqual(missing, [], '대상 밖 시설 — headroom_targets.json에 시군구 추가 필요')
  for (const t of targets) assert.match(t.admCd, /^\d{5}$/)
  assert.equal(new Set(targets.map((t) => t.admCd)).size, targets.length)
})
