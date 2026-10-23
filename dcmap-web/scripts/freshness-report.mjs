#!/usr/bin/env node
/**
 * 데이터 최신성 리포트 — src/data/freshness.js(사이트 /data 표와 같은 레지스트리)를 Node에서 돌려
 * 마크다운으로 낸다. 주간 GitHub Action이 Job Summary와 이슈 「📊 dcmap 데이터 최신성」에 붙인다.
 *
 * 실행: node scripts/freshness-report.mjs [--out 파일]
 */
import { readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { evaluateFreshness, STATUS, METHODS, behindLabel } from '../src/data/freshness.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const months = readdirSync(join(ROOT, 'data/headroom_snapshots'))
  .map((f) => f.match(/^(\d{4}-\d{2})\.json$/)?.[1])
  .filter(Boolean)
  .sort()
const { rows, count, attention, today } = evaluateFreshness(new Date(), { headroomLatest: months.at(-1) ?? null })

const icon = { overdue: '🔴', unknown: '🟠', review: '🟡', soon: '🔵', fresh: '🟢', reference: '⚪', pending: '⚪', live: '🟢' }
const line = (r) =>
  `| ${icon[r.status]} ${STATUS[r.status].ko}${r.status === 'overdue' ? ` (${behindLabel(r, r, false)})` : ''} | ${r.name} | ${r.asOf ?? '미기록'} | ${r.due ?? '—'} | ${METHODS[r.method].ko} | ${r.how} |`

const need = rows.filter((r) => ['overdue', 'unknown', 'review'].includes(r.status))
const ok = rows.filter((r) => !['overdue', 'unknown', 'review', 'live'].includes(r.status))
const live = rows.filter((r) => r.status === 'live')

const md = [
  `## 📊 dcmap 데이터 최신성 — ${today}`,
  '',
  `손볼 것 **${attention}건** · 지연 ${count.overdue ?? 0} · 기준일 미기록 ${count.unknown ?? 0} · 재확인 ${count.review ?? 0} · 최신 ${(count.fresh ?? 0) + (count.soon ?? 0)} · 고정 ${count.reference ?? 0} · 미수집 ${count.pending ?? 0} · 실시간 ${live.length}`,
  '',
  '> 다음 예정일은 출처별 통상 공표 주기에 따른 **추정**입니다. 같은 판정이 사이트 `/data#freshness` 표에도 그대로 뜹니다.',
  '',
  ...(need.length
    ? ['### 손볼 것', '', '| 상태 | 데이터 | 기준 | 다음 예정(추정) | 방식 | 갱신 방법 |', '|---|---|---|---|---|---|', ...need.map(line), '']
    : ['### 손볼 것 없음 ✅', '']),
  '<details><summary>최신·고정 ' + ok.length + '건</summary>',
  '',
  '| 상태 | 데이터 | 기준 | 다음 예정(추정) | 방식 | 갱신 방법 |',
  '|---|---|---|---|---|---|',
  ...ok.map(line),
  '',
  '</details>',
  '',
  `실시간 연동 ${live.length}종(${live.map((r) => r.name).join(' · ')})은 조회 시점 데이터라 판정 대상이 아닙니다. 연동 상태는 배포의 \`/api/status?probe=1\`로 확인.`,
  '',
].join('\n')

const outIdx = process.argv.indexOf('--out')
if (outIdx > -1) writeFileSync(process.argv[outIdx + 1], md)
else process.stdout.write(md)
