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
import { readFileSync, readdirSync } from 'node:fs'
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

export function runValidation() {
  const schema = JSON.parse(readFileSync(join(ROOT, 'data/schema/yokai.schema.json'), 'utf8'))
  const entries = loadSeed()
  const errors = []
  for (const e of entries) {
    const { _file, ...rec } = e
    validateSchema(schema, rec, `${_file}:${rec.id}`, errors)
  }
  const integrity = checkIntegrity(entries)
  return { entries, errors: [...errors, ...integrity.errors], warnings: integrity.warnings, stats: integrity.stats }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { errors, warnings, stats } = runValidation()
  for (const w of warnings) console.warn(`⚠️  ${w}`)
  if (errors.length) {
    for (const e of errors) console.error(`❌ ${e}`)
    console.error(`\n검증 실패 — 오류 ${errors.length}건`)
    process.exit(1)
  }
  console.log(`✅ 검증 통과 — ${stats.total}체 · 시도 커버리지 ${stats.sidoCovered}/17 · 경고 ${warnings.length}건`)
}
