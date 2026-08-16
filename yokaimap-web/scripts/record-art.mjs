#!/usr/bin/env node
/**
 * 생성된 도상 job을 data/art/jobs.json에 기록한다.
 *
 * 이미지 생성은 MCP 도구로만 되고 셸에서는 못 하므로, 생성 결과(id·job_id·타임스탬프)를
 * 수작업으로 옮겨 적다 보면 반드시 어긋난다. 기록만이라도 한 곳에서 처리한다.
 *
 *   node scripts/record-art.mjs "kr-eop:0ea5cc6b-...:051606" "kr-jisin:ec6ee5dd-...:051606"
 */
import { readFileSync, writeFileSync } from 'node:fs'

const P = 'data/art/jobs.json'
const BASE = 'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC'
const j = JSON.parse(readFileSync(P, 'utf8'))
const known = new Set(j.items.map((i) => i.id))
const bundle = JSON.parse(readFileSync('public/data/yokai.json', 'utf8'))
const ids = new Set(bundle.entries.map((e) => e.id))

let added = 0
for (const arg of process.argv.slice(2)) {
  const [id, job, ts] = arg.split(':')
  if (!ids.has(id)) throw new Error(`시드에 없는 id: ${id}`)
  if (known.has(id)) {
    // 재생성분은 덮어쓴다 — 같은 개체가 두 번 실리면 fetch-art가 뭘 받을지 모호해진다.
    const it = j.items.find((i) => i.id === id)
    it.job_id = job
    it.url = `${BASE}/hf_20260816_${ts}_${job}.png`
    it.review = { result: 'pending', note: '재생성 — 검수 대기' }
    continue
  }
  j.items.push({
    index: j.items.length,
    kind: 'plate',
    id,
    // .webp — fetch-art가 받으면서 변환한다. 여기서 .png로 적으면 webp 내용이 png 이름으로 저장된다.
    target: `public/img/yokai/${id.replace(/^kr-/, '')}.webp`,
    aspect: '4:5',
    job_id: job,
    url: `${BASE}/hf_20260816_${ts}_${job}.png`,
    review: { result: 'pending', note: '검수 대기 — docs/ART_REVIEW.md 체크리스트' },
  })
  known.add(id)
  added++
}
writeFileSync(P, JSON.stringify(j, null, 2) + '\n')
const total = bundle.entries.filter((e) => e.art_hint).length
console.log(`기록 ${added}건 추가 · 누적 ${j.items.length}건 (도상 대상 ${total}체 + 히어로 1)`)
