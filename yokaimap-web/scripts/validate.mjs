/**
 * 시드 데이터 검증기 — 의존성 0.
 *
 *  1) JSON Schema(draft 2020-12) 부분집합 검증: type/required/additionalProperties/enum/pattern/
 *     minimum·maximum/minLength·maxLength/minItems/items/properties
 *  2) 도메인 무결성 검증(스키마로 표현 불가한 규칙):
 *     - id·canonical 중복 금지
 *     - alias 충돌(다른 개체의 canonical과 같은 alias) 금지
 *     - related[] 의 참조 무결성
 *     - sources 최소 1개(스키마) + 출처 없는 배포 금지 재확인
 *     - 좌표 남한 bbox
 *     - modern 카테고리는 verification=modern_online 이어야 함
 *     - 17개 시도 커버리지(경고)
 *
 * 사용: node scripts/validate.mjs   (build-data.mjs가 import해서도 씀)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SIDO_ALL = JSON.parse(readFileSync(join(ROOT, 'data/regions.json'), 'utf8')).sido.map((s) => s.name)

/* ─── 미니 JSON Schema 검증기 ─────────────────────────────── */
function typeOf(v) {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  if (Number.isInteger(v)) return 'integer'
  return typeof v
}
const typeOk = (v, t) => {
  const list = Array.isArray(t) ? t : [t]
  const actual = typeOf(v)
  return list.some((x) => x === actual || (x === 'number' && actual === 'integer'))
}

export function validateSchema(schema, value, path = '', errors = []) {
  const err = (msg) => errors.push(`${path || '(root)'}: ${msg}`)

  if (schema.enum && !schema.enum.includes(value)) {
    err(`허용되지 않은 값 ${JSON.stringify(value)} — 가능: ${schema.enum.join(', ')}`)
    return errors
  }
  if (schema.const !== undefined && value !== schema.const) err(`상수 불일치`)
  if (schema.type && !typeOk(value, schema.type)) {
    err(`타입 불일치 — 기대 ${schema.type}, 실제 ${typeOf(value)}`)
    return errors
  }

  if (typeof value === 'string') {
    if (schema.minLength != null && value.length < schema.minLength) err(`${schema.minLength}자 이상이어야 함(현재 ${value.length})`)
    if (schema.maxLength != null && value.length > schema.maxLength) err(`${schema.maxLength}자 이하여야 함(현재 ${value.length})`)
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) err(`패턴 불일치 /${schema.pattern}/`)
  }
  if (typeof value === 'number') {
    if (schema.minimum != null && value < schema.minimum) err(`${schema.minimum} 이상이어야 함(현재 ${value})`)
    if (schema.maximum != null && value > schema.maximum) err(`${schema.maximum} 이하여야 함(현재 ${value})`)
  }
  if (Array.isArray(value)) {
    if (schema.minItems != null && value.length < schema.minItems) err(`항목 ${schema.minItems}개 이상 필요(현재 ${value.length})`)
    if (schema.items) value.forEach((v, i) => validateSchema(schema.items, v, `${path}[${i}]`, errors))
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of schema.required ?? []) {
      if (value[key] === undefined) err(`필수 필드 누락: ${key}`)
    }
    const props = schema.properties ?? {}
    for (const [k, v] of Object.entries(value)) {
      if (props[k]) validateSchema(props[k], v, path ? `${path}.${k}` : k, errors)
      else if (schema.additionalProperties === false) err(`정의되지 않은 필드: ${k}`)
    }
  }
  return errors
}

/* ─── 로더 ─────────────────────────────────────────────── */
export function loadSeed() {
  const dir = join(ROOT, 'data/yokai')
  const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
  const entries = []
  for (const f of files) {
    const doc = JSON.parse(readFileSync(join(dir, f), 'utf8'))
    for (const e of doc.entries) entries.push({ ...e, _file: f })
  }
  return entries
}

/**
 * 설화 로더. 파일이 선언한 kind와 레코드의 kind가 어긋나면 분류가 조용히 섞인다.
 * 신화 파일에 민담이 들어가 있어도 아무도 모르므로 여기서 막는다.
 */
export function loadTales() {
  const dir = join(ROOT, 'data/tales')
  if (!existsSync(dir)) return []
  const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
  const tales = []
  for (const f of files) {
    const doc = JSON.parse(readFileSync(join(dir, f), 'utf8'))
    for (const t of doc.tales) tales.push({ ...t, _file: f, _declared: doc.kind })
  }
  return tales
}

/** 시가 로더. 설화와 달리 파일이 분류를 선언하지 않는다(장르가 레코드마다 섞여 있다). */
export function loadSongs() {
  const dir = join(ROOT, 'data/songs')
  if (!existsSync(dir)) return []
  const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
  const songs = []
  for (const f of files) {
    const doc = JSON.parse(readFileSync(join(dir, f), 'utf8'))
    for (const g of doc.songs) songs.push({ ...g, _file: f })
  }
  return songs
}

/* ─── 도메인 무결성 ───────────────────────────────────────── */
export function checkIntegrity(entries) {
  const errors = []
  const warnings = []
  const ids = new Map()
  const canon = new Map()

  for (const e of entries) {
    if (ids.has(e.id)) errors.push(`id 중복: ${e.id} (${ids.get(e.id)} · ${e._file})`)
    ids.set(e.id, e._file)
    if (canon.has(e.canonical)) errors.push(`canonical 중복: ${e.canonical} (${canon.get(e.canonical)} · ${e._file})`)
    canon.set(e.canonical, e._file)
  }

  for (const e of entries) {
    // alias가 다른 개체의 canonical과 겹치면 검색·중복등재가 깨진다
    for (const a of e.aliases ?? []) {
      if (canon.has(a) && canon.get(a) !== e._file) errors.push(`alias 충돌: ${e.id}의 '${a}'가 다른 개체의 canonical`)
      if (a === e.canonical) errors.push(`alias가 canonical과 동일: ${e.id} '${a}'`)
    }
    for (const r of e.related ?? []) {
      if (!ids.has(r)) errors.push(`related 참조 깨짐: ${e.id} → ${r}`)
      if (r === e.id) errors.push(`related 자기참조: ${e.id}`)
    }
    if (!(e.sources?.length > 0)) errors.push(`출처 없는 레코드는 배포 금지: ${e.id}`)
    // 현대괴이는 전승 요괴와 검증등급을 섞지 않는다
    if (e.category === 'modern' && e.verification !== 'modern_online') {
      errors.push(`modern 카테고리는 verification=modern_online 이어야 함: ${e.id} (현재 ${e.verification})`)
    }
    // 광포설화(nationwide)에 정밀좌표(parcel)를 붙이면 '실제 지점'으로 오독된다
    for (const s of e.sites ?? []) {
      if (e.distribution === 'nationwide' && s.precision === 'parcel') {
        warnings.push(`nationwide 개체에 parcel 정밀도 좌표: ${e.id} / ${s.name}`)
      }
    }
    if (e.sensitivity && !e.sensitivity.note) errors.push(`sensitivity에 note 필요: ${e.id}`)
  }

  const covered = new Set(entries.flatMap((e) => (e.sites ?? []).map((s) => s.sido)))
  const missing = SIDO_ALL.filter((s) => !covered.has(s))
  if (missing.length) warnings.push(`시도 커버리지 미달 — 전승지 없는 시도: ${missing.join(', ')}`)

  return { errors, warnings, stats: { total: entries.length, sidoCovered: covered.size } }
}

/**
 * 설화 무결성. 요괴와 규칙이 다른 지점만 본다.
 *  - characters[]는 도감 개체를 가리키므로 요괴 id 집합으로 검사한다
 *  - 전설(legend)은 증거물에 고정되는 것이 정의다. 좌표가 없으면 분류를 의심한다(경고)
 */
export function checkTaleIntegrity(tales, yokaiIds) {
  const errors = []
  const warnings = []
  const ids = new Map()
  const titles = new Map()

  for (const t of tales) {
    if (ids.has(t.id)) errors.push(`설화 id 중복: ${t.id} (${ids.get(t.id)} · ${t._file})`)
    ids.set(t.id, t._file)
    if (titles.has(t.title)) errors.push(`설화 제목 중복: ${t.title} (${titles.get(t.title)} · ${t._file})`)
    titles.set(t.title, t._file)
    if (t._declared && t.kind !== t._declared) {
      errors.push(`파일 분류와 레코드 kind 불일치: ${t.id} — 파일 ${t._declared} / 레코드 ${t.kind}`)
    }
  }

  for (const t of tales) {
    for (const c of t.characters ?? []) {
      if (!yokaiIds.has(c)) errors.push(`설화 characters 참조 깨짐: ${t.id} → ${c}`)
    }
    for (const r of t.related ?? []) {
      if (!ids.has(r)) errors.push(`설화 related 참조 깨짐: ${t.id} → ${r}`)
      if (r === t.id) errors.push(`설화 related 자기참조: ${t.id}`)
    }
    if (!(t.sources?.length > 0)) errors.push(`출처 없는 설화는 배포 금지: ${t.id}`)
    if (t.kind === 'legend' && !(t.sites?.length > 0)) {
      warnings.push(`전설인데 배경지 좌표가 없다 — 민담이 아닌지 확인: ${t.id}`)
    }
    if (t.sensitivity && !t.sensitivity.note) errors.push(`설화 sensitivity에 note 필요: ${t.id}`)
  }

  return { errors, warnings, stats: { total: tales.length } }
}

/**
 * 시가 무결성.
 *  - 구전(oral)에 original이 있으면 모순이다. 구전에는 원문이라 부를 것이 없고,
 *    한 판본을 원문으로 적으면 나머지를 지우는 셈이 된다.
 *  - original을 실었으면 reading_note로 표기 체계·해독 사정을 밝혀야 한다.
 *    향찰·한문 원문은 퍼블릭 도메인이지만 해독안은 학자의 저작이라 경계가 필요하다.
 */
export function checkSongIntegrity(songs, yokaiIds, taleIds) {
  const errors = []
  const warnings = []
  const ids = new Map()
  const titles = new Map()

  for (const g of songs) {
    if (ids.has(g.id)) errors.push(`시가 id 중복: ${g.id} (${ids.get(g.id)} · ${g._file})`)
    ids.set(g.id, g._file)
    if (titles.has(g.title)) errors.push(`시가 제목 중복: ${g.title} (${titles.get(g.title)} · ${g._file})`)
    titles.set(g.title, g._file)
  }

  for (const g of songs) {
    if (g.original_script === 'oral' && g.original) {
      errors.push(`구전인데 원문이 있다 — 한 판본을 정본으로 세우게 된다: ${g.id}`)
    }
    if (g.original && !g.reading_note) {
      errors.push(`원문을 실었으면 reading_note로 표기·해독 사정을 밝혀야 한다: ${g.id}`)
    }
    for (const c of g.characters ?? []) {
      if (!yokaiIds.has(c)) errors.push(`시가 characters 참조 깨짐: ${g.id} → ${c}`)
    }
    for (const t of g.tales ?? []) {
      if (!taleIds.has(t)) errors.push(`시가 tales 참조 깨짐: ${g.id} → ${t}`)
    }
    for (const r of g.related ?? []) {
      if (!ids.has(r)) errors.push(`시가 related 참조 깨짐: ${g.id} → ${r}`)
      if (r === g.id) errors.push(`시가 related 자기참조: ${g.id}`)
    }
    if (!(g.sources?.length > 0)) errors.push(`출처 없는 시가는 배포 금지: ${g.id}`)
    // 개체에도 설화에도 걸리지 않으면 목록에서만 닿는 죽은 가지가 된다
    if (!(g.characters?.length || g.tales?.length || g.related?.length)) {
      warnings.push(`어느 개체·설화·시가에도 연결되지 않았다: ${g.id}`)
    }
  }

  return { errors, warnings, stats: { total: songs.length } }
}

export function runValidation() {
  const schema = JSON.parse(readFileSync(join(ROOT, 'data/schema/yokai.schema.json'), 'utf8'))
  const entries = loadSeed()
  const errors = []
  for (const e of entries) {
    const { _file, ...rec } = e
    validateSchema(schema, rec, `${_file}:${rec.id}`, errors)
  }
  const integrity = checkIntegrity(entries)

  const taleSchema = JSON.parse(readFileSync(join(ROOT, 'data/schema/tale.schema.json'), 'utf8'))
  const tales = loadTales()
  const taleErrors = []
  for (const t of tales) {
    const { _file, _declared, ...rec } = t
    validateSchema(taleSchema, rec, `${_file}:${rec.id}`, taleErrors)
  }
  const taleIntegrity = checkTaleIntegrity(tales, new Set(entries.map((e) => e.id)))

  const songSchema = JSON.parse(readFileSync(join(ROOT, 'data/schema/song.schema.json'), 'utf8'))
  const songs = loadSongs()
  const songErrors = []
  for (const g of songs) {
    const { _file, ...rec } = g
    validateSchema(songSchema, rec, `${_file}:${rec.id}`, songErrors)
  }
  const songIntegrity = checkSongIntegrity(
    songs,
    new Set(entries.map((e) => e.id)),
    new Set(tales.map((t) => t.id)),
  )

  return {
    entries,
    tales,
    songs,
    errors: [
      ...errors,
      ...integrity.errors,
      ...taleErrors,
      ...taleIntegrity.errors,
      ...songErrors,
      ...songIntegrity.errors,
    ],
    warnings: [...integrity.warnings, ...taleIntegrity.warnings, ...songIntegrity.warnings],
    stats: { ...integrity.stats, tales: taleIntegrity.stats.total, songs: songIntegrity.stats.total },
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { errors, warnings, stats } = runValidation()
  for (const w of warnings) console.warn(`⚠️  ${w}`)
  if (errors.length) {
    for (const e of errors) console.error(`❌ ${e}`)
    console.error(`\n검증 실패 — 오류 ${errors.length}건`)
    process.exit(1)
  }
  console.log(`✅ 검증 통과 — ${stats.total}체 · 설화 ${stats.tales}편 · 시가 ${stats.songs}편 · 시도 커버리지 ${stats.sidoCovered}/17 · 경고 ${warnings.length}건`)
}
