// ─── 제휴사 차량 이미지 매핑 자동 생성 ────────────────────────────────────
// 제휴사 목록 페이지에서 "차종명 ↔ 이미지 경로"를 뽑아 cars.js 의 PARTNER_IMAGES 를
// 다시 쓴다. 손으로 54줄을 적지 않기 위한 도구다.
//
//   node scripts/map-car-images.mjs https://acrentcar.com/…목록페이지
//   node scripts/map-car-images.mjs ./saved.html        # 브라우저로 저장한 페이지
//   node scripts/map-car-images.mjs ./list.csv          # 모델명,이미지경로 (헤더 무시)
//
// 네트워크가 막힌 곳에서는 브라우저로 목록 페이지를 저장(Ctrl+S)해서 그 파일을 넘기면 된다.
// 무엇을 찾았고 무엇을 못 찾았는지 전부 출력하므로, 쓰기 전에 눈으로 확인할 수 있다.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CAR_MODELS } from '../src/lib/cars.js'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const target = join(root, 'src', 'lib', 'cars.js')
const src = process.argv[2]
if (!src) {
  console.error('사용법: node scripts/map-car-images.mjs <목록페이지URL | 저장한 HTML | CSV>')
  process.exit(1)
}

// ── 1. 원본 확보
let text
if (/^https?:\/\//.test(src)) {
  console.log(`[map] 가져오는 중: ${src}`)
  const res = await fetch(src, { headers: { 'User-Agent': 'Mozilla/5.0 moduon-mapper' } })
  if (!res.ok) { console.error(`[map] 실패: HTTP ${res.status}`); process.exit(1) }
  text = await res.text()
} else {
  if (!existsSync(src)) { console.error(`[map] 파일이 없습니다: ${src}`); process.exit(1) }
  text = readFileSync(src, 'utf8')
}

// ── 2. "이미지 경로 + 근처 텍스트" 쌍 추출
// CSV 는 모델명,경로 두 열로 본다. HTML 은 /data/car/… 경로와 같은 태그 블록의 한글을 짝짓는다.
const pairs = []
if (extname(src).toLowerCase() === '.csv') {
  for (const line of text.split(/\r?\n/)) {
    const [name, path] = line.split(',').map((x) => (x ?? '').trim().replace(/^"|"$/g, ''))
    if (name && path && !/모델|이미지/.test(name)) pairs.push({ name, path: path.replace(/^.*\/data\/car\//, '') })
  }
} else {
  // ① 정확 추출 — <img> 태그에서 src(/data/car/…)와 alt 를 함께 읽는다.
  //    제휴사 목록의 alt 는 "자동차리스,리스,…,autoclass,<모델명>,<가격>원" 형식이라
  //    쉼표로 잘라 뒤에서 두 번째가 모델명이다. 주변 텍스트를 훑는 것보다 정확하다.
  for (const tag of text.match(/<img\b[^>]*>/gi) ?? []) {
    const src = tag.match(/\bsrc\s*=\s*["']([^"']*\/data\/car\/[A-Za-z0-9_.-]+)["']/i)
    if (!src) continue
    const path = src[1].replace(/^.*\/data\/car\//, '')
    const alt = tag.match(/\balt\s*=\s*["']([^"']*)["']/i)?.[1] ?? ''
    const fields = alt.split(',').map((x) => x.trim()).filter(Boolean)
    // 마지막이 가격(…원)이면 그 앞이 모델명. 아니면 가장 그럴듯한 한글 필드를 쓴다.
    const name = /원$/.test(fields.at(-1) ?? '') ? fields.at(-2) : fields.filter((f) => /[가-힣]/.test(f)).at(-1)
    if (name) pairs.push({ path, name })
  }
  // ② 폴백 — alt 가 없는 사이트 구조면 경로 주변 한글 덩어리로 추정한다
  if (pairs.length === 0) {
    const re = /(?:https?:\/\/[^"'\s]*)?\/data\/car\/([A-Za-z0-9_.-]+)/g
    let m
    while ((m = re.exec(text))) {
      const around = text.slice(Math.max(0, m.index - 600), m.index + 600)
      const names = [...around.matchAll(/[가-힣A-Za-z0-9][가-힣A-Za-z0-9 ]{1,24}/g)]
        .map((x) => x[0].trim()).filter((x) => /[가-힣]/.test(x) || /^[A-Z0-9-]{2,}$/.test(x))
      pairs.push({ path: m[1], names })
    }
    console.log('[map] alt 속성을 못 찾아 주변 텍스트 추정으로 진행합니다 — 결과를 꼭 확인하세요.')
  }
}
console.log(`[map] 이미지 경로 후보 ${pairs.length}건`)
if (pairs.length === 0) {
  console.error('[map] /data/car/… 경로를 찾지 못했습니다. 목록 페이지가 맞는지, 이미지가 스크립트로 그려지는지 확인하세요.')
  console.error('[map] 그런 경우 브라우저에서 페이지를 다 띄운 뒤 저장(Ctrl+S)한 HTML 을 넘기면 됩니다.')
  process.exit(1)
}

// ── 3. 우리 차종과 매칭
// 더뉴·올뉴·신형 같은 수식어와 공백을 걷어낸 뒤, 가장 긴 모델명이 먼저 잡히게 한다
// (팰리세이드 하이브리드가 팰리세이드보다 먼저 매칭돼야 한다).
const norm = (s) => s.replace(/\s+/g, '').replace(/(더뉴|올뉴|신형|디올뉴|the ?new|all ?new)/gi, '').toLowerCase()
const models = [...CAR_MODELS].sort((a, b) => norm(b.name).length - norm(a.name).length)
const found = {}
const usedPaths = new Set()

for (const p of pairs) {
  const hay = norm((p.name ? [p.name] : p.names ?? []).join(' '))
  const hit = models.find((mo) => !found[mo.id] && hay.includes(norm(mo.name)))
  if (hit && !usedPaths.has(p.path)) { found[hit.id] = p.path; usedPaths.add(p.path) }
}

const matched = Object.keys(found)
const missing = CAR_MODELS.filter((m) => !found[m.id])
console.log(`\n[map] 매칭 ${matched.length} / ${CAR_MODELS.length}`)
for (const id of matched) console.log(`  ✓ ${CAR_MODELS.find((m) => m.id === id).name.padEnd(18)} → ${found[id]}`)
if (missing.length) {
  console.log(`\n[map] 못 찾은 차종 ${missing.length}건 — SVG 실루엣으로 표시됩니다. 필요하면 cars.js 의 MANUAL_IMAGES 에 직접 넣으세요.`)
  console.log('  ' + missing.map((m) => m.name).join(', '))
}
if (matched.length === 0) { console.error('\n[map] 하나도 매칭되지 않아 파일을 쓰지 않았습니다.'); process.exit(1) }

// ── 4. cars.js 의 마커 사이를 다시 쓴다
const block = ['/* PARTNER_IMAGES:START */', 'export const PARTNER_IMAGES = {',
  // 키는 반드시 따옴표로 — 우리 차종 id 는 하이픈을 쓴다(grandeur-hev, s-class, 5-series …)
  ...matched.sort().map((id) => `  '${id}': '${found[id]}',`),
  '}', '/* PARTNER_IMAGES:END */'].join('\n')
const cur = readFileSync(target, 'utf8')
const re = /\/\* PARTNER_IMAGES:START \*\/[\s\S]*?\/\* PARTNER_IMAGES:END \*\//
if (!re.test(cur)) { console.error('[map] cars.js 에서 PARTNER_IMAGES 마커를 찾지 못했습니다.'); process.exit(1) }
writeFileSync(target, cur.replace(re, block))
console.log(`\n[map] src/lib/cars.js 갱신 완료. 이어서 이미지를 받으세요:\n  node scripts/fetch-car-images.mjs`)
