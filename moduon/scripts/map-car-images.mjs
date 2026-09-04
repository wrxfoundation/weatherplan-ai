// ─── 제휴사 차량 이미지 매핑 자동 생성 ────────────────────────────────────
// 제휴사 목록 페이지에서 "차종명 ↔ 이미지 경로"를 뽑아 cars.js 의 PARTNER_IMAGES 를
// 다시 쓴다. 손으로 54줄을 적지 않기 위한 도구다.
//
//   node scripts/map-car-images.mjs ./현대.htm ./기아.htm https://…   # 여러 개 한 번에
//   node scripts/map-car-images.mjs ./saved.html        # 브라우저로 저장한 페이지
//   node scripts/map-car-images.mjs ./list.csv          # 모델명,이미지경로 (헤더 무시)
//   node scripts/map-car-images.mjs --replace ./all.htm # 기존 매핑을 버리고 새로 시작
//
// 기본은 **병합**이다 — 기아 페이지만 넣어도 이미 잡힌 현대 매핑이 날아가지 않는다.
//
// 네트워크가 막힌 곳에서는 브라우저로 목록 페이지를 저장(Ctrl+S)해서 그 파일을 넘기면 된다.
// 무엇을 찾았고 무엇을 못 찾았는지 전부 출력하므로, 쓰기 전에 눈으로 확인할 수 있다.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CAR_MODELS, PARTNER_IMAGES, MANUAL_IMAGES, baseId } from '../src/lib/cars.js'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const target = join(root, 'src', 'lib', 'cars.js')
const args = process.argv.slice(2)
const replace = args.includes('--replace')
const sources = args.filter((a) => !a.startsWith('--'))
// 인자가 없으면 scripts/car-sources.txt 의 URL 목록을 쓴다(자동 갱신 경로)
if (sources.length === 0) {
  const listFile = join(root, 'scripts', 'car-sources.txt')
  if (existsSync(listFile)) {
    for (const line of readFileSync(listFile, 'utf8').split(/\r?\n/)) {
      const t = line.trim()
      if (t && !t.startsWith('#')) sources.push(t)
    }
  }
}
if (sources.length === 0) {
  console.error('사용법: node scripts/map-car-images.mjs [--replace] <목록페이지URL | 저장한 HTML | CSV> ...')
  console.error('또는 scripts/car-sources.txt 에 목록 페이지 URL 을 채우고 인자 없이 실행하세요.')
  process.exit(1)
}

// ── 1. 원본 확보 (여러 개를 이어 붙여 한 번에 훑는다)
const chunks = []
for (const src of sources) {
  if (/^https?:\/\//.test(src)) {
    console.log(`[map] 가져오는 중: ${src}`)
    try {
      const res = await fetch(src, { headers: { 'User-Agent': 'Mozilla/5.0 moduon-mapper' } })
      if (!res.ok) { console.error(`[map] 실패: HTTP ${res.status} — ${src}`); continue }
      chunks.push(await res.text())
    } catch (e) { console.error(`[map] 실패: ${e.message} — ${src}`); continue }
  } else {
    if (!existsSync(src)) { console.error(`[map] 파일이 없습니다: ${src}`); continue }
    console.log(`[map] 읽는 중: ${src}`)
    chunks.push(readFileSync(src, 'utf8'))
  }
}
if (chunks.length === 0) { console.error('[map] 읽을 수 있는 원본이 없습니다.'); process.exit(1) }
const text = chunks.join('\n')
const isCsv = sources.some((s) => extname(s).toLowerCase() === '.csv')

// ── 2. "이미지 경로 + 근처 텍스트" 쌍 추출
// CSV 는 모델명,경로 두 열로 본다. HTML 은 /data/car/… 경로와 같은 태그 블록의 한글을 짝짓는다.
const pairs = []
if (isCsv) {
  for (const line of text.split(/\r?\n/)) {
    const [name, path] = line.split(',').map((x) => (x ?? '').trim().replace(/^"|"$/g, ''))
    if (name && path && !/모델|이미지/.test(name)) pairs.push({ name, path: baseId(path.replace(/^.*\/data\/car\//, '')) })
  }
} else {
  // ① 정확 추출 — <img> 태그에서 src(/data/car/…)와 alt 를 함께 읽는다.
  //    제휴사 목록의 alt 는 "자동차리스,리스,…,autoclass,<모델명>,<가격>원" 형식이라
  //    쉼표로 잘라 뒤에서 두 번째가 모델명이다. 주변 텍스트를 훑는 것보다 정확하다.
  for (const tag of text.match(/<img\b[^>]*>/gi) ?? []) {
    const src = tag.match(/\bsrc\s*=\s*["']([^"']*\/data\/car\/[A-Za-z0-9_.-]+)["']/i)
    if (!src) continue
    // 변형 접미사(_list/_main/_detail_N)를 떼고 기본 ID 만 저장한다 — 쓰는 쪽에서 변형을 만든다
    const path = baseId(src[1].replace(/^.*\/data\/car\//, ''))
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
      pairs.push({ path: baseId(m[1]), names })
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
// 기본은 병합 — 이번에 못 찾은 차종의 기존 매핑을 지우지 않는다
const found = replace ? {} : { ...PARTNER_IMAGES }
const usedPaths = new Set(Object.values(found))
const before = Object.keys(found).length

for (const p of pairs) {
  const hay = norm((p.name ? [p.name] : p.names ?? []).join(' '))
  const hit = models.find((mo) => !found[mo.id] && hay.includes(norm(mo.name)))
  if (hit && !usedPaths.has(p.path)) { found[hit.id] = p.path; usedPaths.add(p.path) }
}

const matched = Object.keys(found)
const missing = CAR_MODELS.filter((m) => !found[m.id] && !MANUAL_IMAGES[m.id])
const newly = matched.length - before
console.log(`\n[map] 매칭 ${matched.length} / ${CAR_MODELS.length}${replace ? '' : ` (이번에 새로 ${newly}건)`}`)
for (const id of matched.sort()) console.log(`  ✓ ${CAR_MODELS.find((m) => m.id === id).name.padEnd(18)} → ${found[id]}`)
if (missing.length) {
  console.log(`\n[map] 못 찾은 차종 ${missing.length}건 — SVG 실루엣으로 표시됩니다. 필요하면 cars.js 의 MANUAL_IMAGES 에 직접 넣으세요.`)
  console.log('  ' + missing.map((m) => m.name).join(', '))
}
// MANUAL_IMAGES 가 이긴다(imagePathOf 의 우선순위). 자동으로 다른 경로를 잡았다면 조용히 묻히므로 알린다.
const shadowed = matched.filter((id) => MANUAL_IMAGES[id] && baseId(MANUAL_IMAGES[id]) !== baseId(found[id]))
if (shadowed.length) {
  console.log(`\n[map] MANUAL_IMAGES 가 덮어쓰는 차종 ${shadowed.length}건 — 자동 매칭 결과는 쓰이지 않습니다.`)
  for (const id of shadowed) console.log(`  ! ${CAR_MODELS.find((m) => m.id === id).name} : 수동 ${MANUAL_IMAGES[id]} (자동 ${found[id]})`)
  console.log('  수동 항목이 더 이상 필요 없으면 cars.js 의 MANUAL_IMAGES 에서 지우세요.')
}
if (matched.length === 0) { console.error('\n[map] 하나도 매칭되지 않아 파일을 쓰지 않았습니다.'); process.exit(1) }
if (!replace && newly === 0) console.log('[map] 새로 잡힌 차종이 없습니다 — 기존 매핑을 그대로 유지합니다.')

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
