// ─── 리베이트 단가표 자동 인식 — "양식은 달라도 주소는 같다" ─────────────────────
// 운영팀 요청(2026-10-01): 통신사·대리점마다 엑셀 양식이 다르니, 양식을 통일하지 않고 파일을 그대로 올리면
// 단말 × 요금구간 × 가입유형(010·MNP·기변)의 리베이트만 뽑아 기존 DB 의 같은 칸을 갱신한다.
// 양식 자체를 DB 로 만들지 않는다 — 우리 DB 의 '집주소'(ratecard.js 리베이트 카드)에 값을 꽂을 뿐이다.
//
//   집주소 = 통신사 → 정책(차수·적용일) → 표(5G·LTE…) → 단말 행(용량) → 요금구간(하한 월정액) → 가입유형 → (할인방식)  ⇒  원
//
// 시트를 읽는 순서(양식 무관) — KT K1 · SKT S2 · LG L1 예시로 맞췄다:
//   ① 가입유형 머리 행 — 010/신규 · MNP/번호이동 · 기변/기기변경/기변(전환) 이 3칸 이상 나오는 행. 한 시트에 여러 개면 표도 여러 개
//   ② 할인방식 — 머리 행 바로 아래가 공통/선약(공시/선택약정)이면 가입유형마다 두 칸으로 읽는다
//   ③ 요금구간 — 머리 행 위 칸(병합 포함)의 글자에서 하한: '110K' '61K이상' '119구간' '5G 115군 ↑' '79 이상' '69,000원'
//   ④ 단말 행 — 값 칸이 절반 이상 찬 행. 첫 값 열 왼쪽에서 가장 가까운 글자가 단말 이름, 그다음이 모델명(SM-F971N 등)
//   ⑤ 금액 단위 — 시트의 '단위' 표기, 없으면 크기로 추정(최대 1,000 이하 = 만원)
//   ⑥ 통신사·차수·적용일·환수 고지 — 시트 이름 › 파일 이름 › 본문(가장 많이 나온 통신사)
// 사람이 정해 줘야 하는 것(못 읽음·애매함)은 issues 로 돌려준다 — 조용히 추측하지 않는다.
import { readXlsx, toGrid, parseRef, colName } from './xlsx'
import { PHONE_DEVICES, deviceTitle } from './phones'
import { PHONE_SPECS } from './phoneSpecs'

export const JOIN_KEYS = ['new', 'mnp', 'chg']
const JOIN_LABEL = { new: '010', mnp: 'MNP', chg: '기변' }
const JOIN_RE = [
  ['new', /^(010|010신규|신규|신규가입|순신규)$/],
  ['mnp', /^(mnp|번호이동|번이|이동)$/],
  ['chg', /^(기변|기기변경|보상기변|전환|기변전환)$/],
]
const METHOD_RE = [
  ['support', /^(공통|공통지원금|공시|공시지원|공시지원금|지원금|단말지원)$/],
  ['select', /^(선약|선택약정|약정|요금할인|선택)$/],
]
const flat = (v) => String(v ?? '').replace(/\s+/g, '').toLowerCase()
const tokenOf = (table, v) => {
  if (typeof v !== 'string') return null
  const s = flat(v)
  const t = s.replace(/\(.*?\)/g, '') // '기변(전환)' '번호이동(MNP)' — 괄호 속은 보조 표기
  for (const [k, re] of table) if (re.test(s) || (t && re.test(t))) return k
  return null
}
export const joinOf = (v) => tokenOf(JOIN_RE, v)
export const methodOf = (v) => tokenOf(METHOD_RE, v)

// 요금구간 글자 → 하한 월정액(원). 못 읽으면 null — 사람이 정한다.
export function tierMin(label) {
  const s = String(label ?? '')
  let m = /(\d{2,3}(?:\.\d)?)\s*[kK]/.exec(s)
  if (m) return Math.round(parseFloat(m[1]) * 1000)
  m = /(\d{1,3}(?:,\d{3})+|\d{5,6})\s*원?/.exec(s)
  if (m) return Number(m[1].replace(/,/g, ''))
  m = /(\d{1,2})\s*만\s*(?:(\d)\s*천)?/.exec(s)
  if (m) return Number(m[1]) * 10000 + (m[2] ? Number(m[2]) * 1000 : 0)
  // '119구간' '115군 ↑' '79 이상' — 천 원 단위 숫자(2~3자리)
  m = /(?:^|[^\d])(\d{2,3})\s*(?:천\s*원?)?\s*(구간|군|이상|↑|원대)/.exec(s)
  if (m) return Number(m[1]) * 1000
  return null
}
// 구간 글자 속 요금제 이름의 숫자(라이트59 → 59) — 구간 숫자보다 낮은 요금제가 섞였는지 알려 주려고. GB 같은 데이터량은 뺀다
const planNums = (label) => {
  const body = String(label ?? '').split(/\n/).slice(1).join(' ') || String(label ?? '').replace(/^[^(]*\(/, '(')
  return [...body.matchAll(/(\d{2,3})(?!\s*(?:\d|gb|g\b|mb|tb|t\b|만|천|k\b|%|개월|일))/gi)].map((m) => Number(m[1]))
}

export function carrierOf(s) {
  const x = String(s ?? '').trim().toUpperCase()
  if (/SKT|SK텔레콤|SK\s*TELECOM/.test(x)) return 'SKT'
  if (/^LG$|LG\s*U\+|LGU\+?|LG유플러스|유플러스|U\+/.test(x)) return 'LG U+'
  if (/(^|[^A-Z])KT([^A-Z]|$)|케이티/.test(x)) return 'KT'
  return null
}

const DATE_RE = /(20\d{2}|\d{2})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})/
const dateOf = (s) => {
  const m = DATE_RE.exec(String(s ?? ''))
  if (!m) return null
  const y = m[1].length === 2 ? `20${m[1]}` : m[1]
  return `${y}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
}
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()
const CATEGORY_RE = /^(5g|lte|4g|3g|구분|모델명|펫네임|단말|기종)$/i
const CODE_LIKE = /(^|[^a-z])(sm-|aip|ip\d|at-|lm-|[a-z]{1,2}\d{2,4}|g\d{3})/i

// ── 단말 표기 ↔ 우리 단말 ───────────────────────────────────────────────────
// 용량 꼬리(512G · _512G · 1TB)를 떼어 따로 돌려준다 — 용량별 행이면 그 용량에만 붙인다
export function storageOf(s) {
  const m = /(?:^|[\s_(/])(\d{3,4})\s*(?:g|gb)\b|(?:^|[\s_(/])(\d)\s*(?:t|tb)\b/i.exec(String(s ?? ''))
  if (!m) return null
  return m[1] ? `${Number(m[1])}GB` : `${m[2]}TB`
}
const stripStorage = (s) => String(s ?? '').replace(/(?:^|[\s_(/])(\d{3,4})\s*(?:g|gb)\b\)?|(?:^|[\s_(/])(\d)\s*(?:t|tb)\b\)?/ig, ' ')

// 표기를 비교용 키로: 공백·'갤럭시' 제거, 영문 표기를 한글로(flip→플립, pro→프로 …), 'Z플립'의 Z 는 떼고
export function nk(s) {
  return stripStorage(s).toLowerCase()
    .replace(/galaxy|갤럭시/g, '')
    .replace(/iphone/g, '아이폰').replace(/flip/g, '플립').replace(/fold/g, '폴드').replace(/\bair\b|air/g, '에어')
    .replace(/ultra/g, '울트라').replace(/pro\s*max/g, '프로맥스').replace(/pro/g, '프로').replace(/max/g, '맥스').replace(/plus/g, '플러스')
    .replace(/\((5g|lte|4g)\)/g, '').replace(/(^|[^a-z0-9])(5g|lte|4g)(?=$|[^a-z0-9])/g, '$1')
    .replace(/[\s·_]/g, '')
    .replace(/z(?=플립|폴드)/g, '')
}
const FAMILY_RE = /류|\(전체\)|전체|계열|시리즈|series/
const VARIANT_RE = /(울트라|플러스|\+|프로맥스|프로|맥스|엣지|fe|에어)$/
const familyKey = (k) => { let x = k; for (let i = 0; i < 3 && VARIANT_RE.test(x); i++) x = x.replace(VARIANT_RE, ''); return x }
const SUFFIX = (x) => x.replace(/(\d)pm$/, '$1프로맥스').replace(/(\d)p$/, '$1프로').replace(/(\d)u$/, '$1울트라')
// 시트 표기에서 모델 번호(A256 · SM-A165 · SM-F971N …) — 3~4자리 숫자만(‘S26’ 같은 이름은 제외)
const codesOf = (s) => [...String(s ?? '').toLowerCase().matchAll(/(?:sm-)?([a-z])(\d{3,4})(?![0-9])/g)].map((m) => m[1] + m[2])

export function parseLabel(label, code = '') {
  const raw = String(label ?? '')
  // '(Air제외)' '(E제외)' — 시리즈에서 뺄 것
  const excludes = [...raw.matchAll(/\(([^)]*?)\s*제외\)/g)].flatMap((m) => m[1].split(/[,/·]/)).map((x) => nk(x)).filter(Boolean)
  let s = nk(raw.replace(/\(([^)]*?)\s*제외\)/g, ''))
  const family = FAMILY_RE.test(s)
  s = s.replace(new RegExp(FAMILY_RE.source, 'g'), '')
  const fallback = /(그외|기타|나머지|전모델|그밖)/.test(s)
  const net = /lte|4g/i.test(raw) ? 'LTE' : /5g/i.test(raw) ? '5G' : null
  // 대안 표기 '아이폰18P/PM' → 아이폰18프로 · 아이폰18프로맥스
  const parts = s.replace(/\(.*?\)/g, '').split(/[/,]/).map((x) => x.trim()).filter(Boolean)
  const base = /^(.*\d)/.exec(parts[0] ?? '')?.[1] ?? ''
  const keys = parts.map((x, i) => SUFFIX(i > 0 && /^\D{1,4}$/.test(x) ? base + x : x))
  return { family, fallback, net, keys, excludes, codes: codesOf(`${raw} ${code}`), storage: storageOf(raw) ?? storageOf(code) }
}

// 우리 단말의 비교 키 — 정확 키 · 시리즈 키 · 모델 번호
const EXTRA_CODES = { a56: ['a566'] } // 설명 데이터에 모델명이 없는 단말(국내 KT 미출시)
export function deviceKeys(d) {
  const exact = nk(deviceTitle(d))
  const model = PHONE_SPECS[d.id]?.model
  const codes = [...(model ? codesOf(model) : []), ...(EXTRA_CODES[d.id] ?? [])]
  return { id: d.id, exact, family: familyKey(exact), codes, net: '5G' }
}

const RANK = { saved: 5, exact: 4, code: 3, family: 2, fallback: 1 }
function matchOne(L, k, net) {
  if (L.keys.includes(k.exact)) return 'exact'
  if (k.codes.some((c) => L.codes.includes(c))) return 'code'
  if (L.family && L.keys.includes(k.family) && !L.excludes.some((x) => x && k.exact.endsWith(x))) return 'family'
  if (L.fallback && (L.net ?? net ?? '5G') === k.net) return 'fallback'
  return null
}

// 행마다 우리 단말을 붙인다 — 한 단말(용량별 행이면 단말×용량)은 가장 구체적인 행 하나에만(정확 > 모델번호 > 시리즈 > 그 외)
// aliases: { '<통신사>|<시트 표기>': [단말 id…] } — 사람이 고친 매핑. 있으면 그대로 쓴다(빈 배열 = 우리 단말 없음)
export function matchGroups(sections, { carrier, aliases = {}, devices = PHONE_DEVICES } = {}) {
  const keys = devices.map(deviceKeys)
  const best = {} // `${id}|${storage}` → { gk, rank, how }
  const all = sections.flatMap((sec) => sec.groups.map((g) => ({ g, net: g.net ?? sec.net })))
  for (const { g, net } of all) {
    const slot = (id) => `${id}|${g.storage ?? ''}`
    const saved = aliases[`${carrier ?? ''}|${g.label}`]
    if (Array.isArray(saved)) { for (const id of saved) if (!best[slot(id)] || RANK.saved > best[slot(id)].rank) best[slot(id)] = { gk: g.key, how: 'saved', rank: RANK.saved }; continue }
    const L = parseLabel(g.label, g.code)
    for (const k of keys) {
      const how = matchOne(L, k, net)
      if (how && (!best[slot(k.id)] || RANK[how] > best[slot(k.id)].rank)) best[slot(k.id)] = { gk: g.key, how, rank: RANK[how] }
    }
  }
  return sections.map((sec) => ({
    ...sec,
    groups: sec.groups.map((g) => {
      const L = parseLabel(g.label, g.code)
      const hits = Object.entries(best).filter(([, b]) => b.gk === g.key).map(([slot, b]) => [slot.split('|')[0], b.how])
      return { ...g, fallback: L.fallback ? (L.net ?? g.net ?? sec.net ?? '5G') : null, devices: hits.map(([id]) => id), match: Object.fromEntries(hits) }
    }),
  }))
}

// ── 시트 하나 → 리베이트 카드 초안 ───────────────────────────────────────────
export function extractRebateSheet(sheet, { fileName = '', aliases = {}, devices = PHONE_DEVICES } = {}) {
  const g = toGrid(sheet)
  const issues = []
  const warn = (msg) => issues.push({ level: 'warn', msg })
  const info = (msg) => issues.push({ level: 'info', msg })
  const joinCols = (r) => { const out = []; for (let c = 1; c <= g.cols; c++) { const j = joinOf(g.at(r, c)); if (j) out.push({ c, j, o: g.origin(r, c) }) } return out }

  // ① 가입유형 머리 행 — 3칸 이상. 이웃한 머리 행(병합으로 두 줄에 걸친 것)은 첫 줄만
  const heads = []
  for (let r = 1; r <= g.rows; r++) {
    const cols = joinCols(r)
    if (cols.length < 3) continue
    if (heads.length && r === heads[heads.length - 1].r + 1 && cols.every((x) => heads[heads.length - 1].cols.some((y) => y.o === x.o))) continue
    heads.push({ r, cols })
  }
  if (!heads.length) return null

  const sections = []
  const texts = Object.entries(sheet.cells).filter(([, v]) => typeof v === 'string').map(([ref, v]) => ({ ref, p: parseRef(ref), v }))
  let prevEnd = 0, split = 0, noLabel = 0, brokenRef = null, negatives = []
  const missingJoins = new Set(), lowPlans = []

  heads.forEach((h, hi) => {
    const nextHead = heads[hi + 1]?.r ?? g.rows + 1
    // ② 할인방식 — 머리 행 바로 아래 칸이 공통/선약이면 가입유형마다 방식별 칸
    const methodRow = h.cols.some((x) => methodOf(g.at(h.r + 1, x.c))) ? h.r + 1 : 0
    const cols = h.cols.map((x) => ({ ...x, m: methodRow ? methodOf(g.at(methodRow, x.c)) : null }))
    // 같은 가입유형 칸이 병합으로 여러 열에 걸쳤는데 방식 표기가 없으면 첫 열만
    const valueCols = cols.filter((x, i) => methodRow ? x.m : (i === 0 || cols[i - 1].o !== x.o))
    if (!methodRow && valueCols.length < cols.length) split++

    // ③ 요금구간 — 머리 행 위로 가장 가까운 글자(앞 표의 끝을 넘지 않는다)
    const tierAt = (c) => {
      for (let r = h.r - 1; r > prevEnd; r--) {
        const v = g.at(r, c)
        if (typeof v !== 'string' || !v.trim() || joinOf(v) || methodOf(v)) continue
        return { label: clean(v), o: g.origin(r, c) }
      }
      return { label: null, o: 'none' }
    }
    const tiers = []
    for (const x of valueCols) {
      const t = tierAt(x.c)
      let cur = tiers[tiers.length - 1]
      const slot = `${x.j}|${x.m ?? ''}`
      if (!cur || cur.o !== t.o || cur.cols[slot] != null) {
        cur = { o: t.o, label: t.label ?? `구간 ${tiers.length + 1}`, min: tierMin(t.label), cols: {} }
        tiers.push(cur)
      }
      cur.cols[slot] = x.c
    }
    const used = new Set()
    tiers.forEach((t, i) => {
      let key = t.min != null ? `t${t.min}` : `tx${i + 1}`
      if (hi > 0) key = `s${hi + 1}${key}`
      while (used.has(key)) key += '_'
      used.add(key); t.key = key
      if (t.label.startsWith('구간 ')) warn(`${hi + 1}번째 표의 ${i + 1}번째 요금구간 머리글을 찾지 못했습니다 — 구간 이름과 하한 월정액을 정해 주세요`)
      else if (t.min == null) warn(`요금구간 「${t.label}」에서 하한 월정액을 읽지 못했습니다 — 몇 원 이상 요금제인지 정해 주세요`)
      else { const low = planNums(t.label).filter((n) => n * 1000 < t.min); if (low.length) lowPlans.push(`${/^.*?(구간|군\s*↑?|이상|↑|[kK](?![a-z]))/.exec(t.label)?.[0] ?? t.label} ← ${low.join('·')}`) }
      for (const j of JOIN_KEYS) if (!Object.keys(t.cols).some((k) => k.startsWith(`${j}|`))) missingJoins.add(j)
    })

    // ④ 단말 행
    const firstC = Math.min(...valueCols.map((x) => x.c))
    const cellVal = (r, c) => {
      if (c == null) return undefined
      const v = g.at(r, c)
      if (typeof v === 'number') return v
      const s = flat(v)
      if (!s) return undefined
      if (/^(x|-|–|—|불가|미취급|n\/a|해당없음)$/.test(s)) return null // 명시적 '취급 안 함'
      const n = Number(s.replace(/[,원]/g, ''))
      return Number.isFinite(n) && /^-?[\d,.]+원?$/.test(s) && !/^0\d/.test(s) ? n : undefined // '010' 같은 표기는 금액이 아니다
    }
    const methods = methodRow ? ['support', 'select'] : [null]
    const rows = []
    let started = false, gap = 0, lastR = h.r
    const startR = (methodRow || h.r) + 1
    for (let r = startR; r < nextHead; r++) {
      const filled = valueCols.filter((x) => cellVal(r, x.c) !== undefined).length
      if (filled === 0 || filled < Math.ceil(valueCols.length / 2)) { if (started && ++gap >= 2) break; continue }
      started = true; gap = 0; lastR = r
      // 이름 — 첫 값 열 왼쪽으로 가장 가까운 글자, 그다음 다른 칸의 글자가 모델명. '5G'·'LTE' 같은 분류는 따로
      let label = null, code = null, cat = null, labelO = null, broken = null
      for (let c = firstC - 1; c >= 1; c--) {
        const v = g.at(r, c), o = g.origin(r, c)
        if (o === labelO) continue
        if (typeof v === 'number' && g.formula(r, c) && !label) { broken = broken ?? { at: `${colName(c)}${r}`, f: g.formula(r, c) }; continue }
        if (typeof v !== 'string' || !v.trim()) continue
        if (CATEGORY_RE.test(flat(v))) { cat = cat ?? clean(v); continue }
        if (!label) { label = clean(v); labelO = o; continue }
        if (!code && CODE_LIKE.test(v)) { code = clean(v); continue }
      }
      if (!label && code) { label = code; code = null }
      if (!label) { noLabel++; if (broken && !brokenRef) brokenRef = broken }
      const vals = {}
      for (const t of tiers) {
        const pick = (m) => JOIN_KEYS.map((j) => { const v = cellVal(r, t.cols[`${j}|${m ?? ''}`]); return typeof v === 'number' ? v : null })
        vals[t.key] = methodRow ? { support: pick('support'), select: pick('select') } : pick(null)
        for (const m of methods) for (const j of JOIN_KEYS) {
          const v = cellVal(r, t.cols[`${j}|${m ?? ''}`])
          if (typeof v === 'number' && v < 0) negatives.push(`${r}행 ${colName(t.cols[`${j}|${m ?? ''}`])}열${g.formula(r, t.cols[`${j}|${m ?? ''}`]) ? `(=${g.formula(r, t.cols[`${j}|${m ?? ''}`])})` : ''}`)
        }
      }
      rows.push({ r, label: label ?? `${r}행(이름 없음)`, nameless: !label, code, cat, vals })
    }
    if (!rows.length) return
    // 표 이름 — 행들의 분류(5G/LTE) 또는 구간 행 왼쪽 끝의 글자
    const cats = rows.map((x) => x.cat).filter(Boolean)
    const tierRow = texts.filter((x) => x.p && x.p.r < h.r && x.p.r > prevEnd && x.p.c < firstC && /^(5g|lte|4g)$/i.test(flat(x.v)))
    const net = cats.length ? (/lte|4g/i.test(cats[0]) ? 'LTE' : '5G') : tierRow.length ? (/lte|4g/i.test(tierRow[tierRow.length - 1].v) ? 'LTE' : '5G') : null
    sections.push({
      key: `s${hi + 1}`, label: net, net, headRow: h.r, method: Boolean(methodRow),
      tiers: tiers.map(({ key, label, min }) => ({ key, label, min })),
      rows, lastR,
    })
    prevEnd = lastR
  })
  if (!sections.length) { warn('가입유형 머리는 찾았지만 금액 행이 없습니다'); return { sheet: sheet.name, empty: true, issues } }

  // ⑤ 단위 — 전 표 공통
  const allVals = sections.flatMap((s) => s.rows.flatMap((x) => Object.values(x.vals).flatMap((v) => (Array.isArray(v) ? v : [...v.support, ...v.select])))).filter((v) => typeof v === 'number')
  const unitText = texts.map((x) => /단위\s*[:：]?\s*(만\s*원|천\s*원|원)/.exec(x.v)?.[1]).find(Boolean)
  const maxAbs = Math.max(0, ...allVals.map(Math.abs))
  let unit, unitSource = 'label'
  if (unitText) unit = /만/.test(unitText) ? 10000 : /천/.test(unitText) ? 1000 : 1
  else {
    unitSource = 'guess'
    unit = maxAbs <= 1000 ? 10000 : maxAbs >= 10000 ? 1 : 1000
    if (unit === 1000) warn('금액 단위를 확신할 수 없습니다(천원으로 읽음) — 시트에 "단위: 만원/천원/원"을 적어 주세요')
  }
  const toWon = (v) => (typeof v === 'number' ? Math.round(v * unit) : null)

  // ⑥ 통신사 · 차수 · 적용일 · 고지
  const firstHead = heads[0].r
  const top = texts.filter((x) => x.p && x.p.r <= firstHead)
  const tally = {}
  for (const x of texts) { const c = carrierOf(x.v); if (c) tally[c] = (tally[c] ?? 0) + 1 }
  const ranked = Object.entries(tally).sort((a, b) => b[1] - a[1])
  const bodyCarrier = ranked.length && (ranked.length === 1 || ranked[0][1] > ranked[1][1]) ? ranked[0][0] : null
  const carrier = carrierOf(sheet.name) ?? carrierOf(fileName) ?? bodyCarrier
  if (!carrier) warn('통신사를 알 수 없습니다 — 시트 이름이나 파일 이름에 KT·SKT·LG U+ 를 넣거나, 아래에서 골라 주세요')
  const codeRe = /^([A-Z]{1,3}\d{1,3})(?:\)|\s|$)/
  const code = top.map((x) => codeRe.exec(clean(x.v))?.[1]).find(Boolean) ?? codeRe.exec(sheet.name)?.[1] ?? null
  const effectiveFrom = top.map((x) => dateOf(x.v)).find(Boolean) ?? texts.map((x) => dateOf(x.v)).find(Boolean) ?? null
  if (!effectiveFrom) warn('적용일(예: 2026.09.18 ~)을 찾지 못했습니다 — 언제부터 쓰는 표인지 정해 주세요')
  const lastR = sections[sections.length - 1].lastR
  // 고지는 마지막 표 아래부터 유선(인터넷·결합) 구역 전까지만 — 그 아래 안내는 유선 상품 몫이다
  const WIRED = /인터넷|결합|유선|초고속|IPTV|홈상품|동판/
  const wiredR = Math.min(...texts.filter((x) => x.p && x.p.r > lastR && WIRED.test(x.v)).map((x) => x.p.r), Infinity)
  const below = texts.filter((x) => x.p && x.p.r > lastR && x.p.r < wiredR)
  const notes = [...new Set(below.flatMap((x) => x.v.split(/\n/)).map((l) => l.replace(/^[\sㅇ★●■○※▶▷◀·\-]+|[\s★◀※]+$/g, '').trim()).filter((l) => /환수|차감/.test(l) && l.replace(/\s/g, '').length >= 8))].slice(0, 14)
  if (wiredR < Infinity) info('표 아래 유선(인터넷·결합) 구역과 그 안내문은 반영하지 않았습니다 — 인터넷 결합 수수료 미반영 원칙')
  // 표 밖 특별 정책 — 리베이트 칸이 아니라 조건부 가감이라 지금은 읽지 않는다(사람이 계산 규칙을 정해야 한다)
  const SIDE = [
    [/추가지원금|추지/, '추가지원금 정책'], [/부가정책|부가서비스/, '부가서비스 가감'], [/usim|유심/i, 'USIM 단독'],
    [/선약\s*개통\s*차감|요금제별\s*차감|모델별\s*차감/, '선약 개통 차감'], [/유통망\s*지원금/, '유통망 지원금 차감'], [/청소년/, '청소년'], [/번들|워치/, '2nd 번들(워치)'],
  ]
  const side = SIDE.filter(([re]) => texts.some((x) => x.p && x.p.r < wiredR && re.test(x.v))).map(([, name]) => name)
  if (side.length) info(`표 밖 특별 정책(${side.join(' · ')})은 금액 계산에 넣지 않았습니다 — 넣을지, 넣는다면 규칙을 정해 주세요`)

  // 시트 단위 경고 — 표마다가 아니라 한 번에
  if (split) warn('가입유형 칸이 아래로 나뉘어 있는데 공통/선약 표기가 없습니다 — 각 가입유형의 첫 칸만 읽었습니다. 어느 칸을 쓰는지 정해 주세요')
  if (sections.some((s) => s.method)) info('공통(공시지원)/선약(선택약정) 칸을 나눠 읽었습니다 — 설계 화면의 할인 방식에 맞는 값을 씁니다')
  if (missingJoins.size) info(`${[...missingJoins].map((j) => JOIN_LABEL[j]).join('·')} 칸이 없는 구간이 있습니다 — 그 가입유형은 '취급 안 함'으로 둡니다`)
  if (lowPlans.length) warn(`구간 숫자보다 낮은 요금제가 들어 있는 구간 ${lowPlans.length}개(${lowPlans.slice(0, 3).join(' / ')}) — 구간을 월정액 하한으로 볼지, 적힌 요금제 목록으로 볼지 정해 주세요`)
  const totalRows = sections.reduce((a, s) => a + s.rows.length, 0)
  if (noLabel) warn(`${noLabel}개 행의 단말 이름을 읽지 못했습니다${brokenRef ? ` — 이름 칸이 다른 칸을 참조하는 수식(${brokenRef.at} =${brokenRef.f})인데 그 칸이 비어 0으로 나옵니다. 엑셀에서 "값으로 붙여넣기" 후 다시 올려 주세요` : ''}`)
  if (negatives.length) warn(`음수 금액 ${negatives.length}칸(${negatives.slice(0, 2).join(', ')}) — 차감 값인지, 빈 칸을 참조한 수식 결과인지 확인해 주세요`)

  let sectionsOut = sections.map((s) => ({
    key: s.key, label: s.label, net: s.net, method: s.method,
    tiers: s.tiers,
    groups: s.rows.map((x, i) => ({
      key: `${s.key}g${i + 1}`, label: x.label, code: x.code, row: x.r, nameless: x.nameless,
      storage: storageOf(x.label) ?? storageOf(x.code),
      net: parseLabel(x.label, x.code).net ?? (/lte|4g/i.test(x.cat ?? '') ? 'LTE' : /5g/i.test(x.cat ?? '') ? '5G' : s.net),
      values: Object.fromEntries(Object.entries(x.vals).map(([k, v]) => [k, Array.isArray(v) ? v.map(toWon) : { support: v.support.map(toWon), select: v.select.map(toWon) }])),
    })),
  }))
  sectionsOut = matchGroups(sectionsOut, { carrier, aliases, devices })
  const linked = new Set(sectionsOut.flatMap((s) => s.groups.flatMap((x) => x.devices)))
  const orphans = devices.filter((d) => !linked.has(d.id)).map((d) => d.short)
  if (orphans.length && noLabel / totalRows < 0.5) warn(`우리 판매 단말 ${orphans.join('·')} 이(가) 어느 행에도 맞지 않습니다('그 외' 행도 없음) — 행을 지정하지 않으면 이 통신사 견적에서 R/B 가 비어 기본 표로 계산됩니다`)

  return {
    sheet: sheet.name, carrier, code, effectiveFrom, unit, unitSource,
    sections: sectionsOut, joins: JOIN_KEYS, notes, issues,
    // 이름을 거의 못 읽은 시트는 기본으로 반영 대상에서 뺀다(엉뚱한 행이 들어가지 않게)
    unreadable: totalRows > 0 && noLabel / totalRows >= 0.5,
    stats: { rows: totalRows, cells: allVals.length, tables: sections.length, nameless: noLabel, headRows: heads.map((x) => x.r) },
  }
}

// 파일 하나(여러 시트) → 시트별 초안. 리베이트 표가 없는 시트는 건너뛴다.
export async function importRebateWorkbook(buf, opts = {}) {
  const { sheets } = await readXlsx(buf)
  const out = []
  for (const s of sheets) {
    const x = extractRebateSheet(s, opts)
    if (x) out.push({ ...x, hidden: s.hidden })
  }
  return { sheets: sheets.map((s) => s.name), tables: out }
}

// 초안 → 저장할 카드. 사람이 고친 값(통신사·차수·적용일·구간 하한·단말 매핑)을 덮어 쓴다.
export function toCard(x, { fileName = '', carrier, code, effectiveFrom, tierMins = {}, mapping = {}, now = Date.now() } = {}) {
  const c = carrier ?? x.carrier
  const cd = (code ?? x.code) || null
  const eff = effectiveFrom ?? x.effectiveFrom
  return {
    id: `${c}-${cd ?? 'X'}-${eff}-${now.toString(36)}`,
    carrier: c, code: cd,
    name: `${c} 정책 단가표${cd ? ` ${cd}` : ''} (리베이트)`,
    effectiveFrom: eff,
    joins: x.joins,
    sections: x.sections.map((s) => ({
      key: s.key, label: s.label, net: s.net, method: s.method,
      tiers: s.tiers.map((t) => ({ ...t, min: tierMins[t.key] ?? t.min })),
      groups: s.groups.map(({ key, label, code: gc, storage, net, fallback, devices, values }) => ({
        key, label, ...(gc ? { code: gc } : {}), ...(storage ? { storage } : {}), net, fallback, devices: mapping[key] ?? devices, values,
      })),
    })),
    notes: x.notes,
    source: { file: fileName, sheet: x.sheet, unit: x.unit, importedAt: now },
  }
}
