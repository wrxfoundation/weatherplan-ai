// ─── 리베이트 단가표 자동 인식 — "양식은 달라도 주소는 같다" ─────────────────────
// 운영팀 요청(2026-10-01): 통신사·대리점마다 엑셀 양식이 다르니, 양식을 통일하지 않고 파일을 그대로 올리면
// 단말 × 요금구간 × 가입유형(010·MNP·기변)의 리베이트만 뽑아 기존 DB 의 같은 칸을 갱신한다.
// 양식 자체를 DB 로 만들지 않는다 — 우리 DB 의 '집주소'(ratecard.js 리베이트 카드)에 값을 꽂을 뿐이다.
//
//   집주소 = 통신사 → 정책(차수·적용일) → 단말 행 → 요금구간(하한 월정액) → 가입유형  ⇒  금액(원)
//
// 시트를 읽는 순서(양식 무관):
//   ① 가입유형 머리 행 — 010/신규 · MNP/번호이동 · 기변/기기변경 이 3번 이상 나오는 행
//   ② 요금구간 — 그 위 칸(병합 포함)의 글자에서 하한 월정액을 읽는다: '110K' '61K이상' '9만원대' '69,000원'
//   ③ 단말 행 — 머리 행 아래로 값 칸이 절반 이상 채워진 행. 첫 값 열 왼쪽의 가장 가까운 글자가 단말 표기
//   ④ 금액 단위 — 시트에 '단위' 표기가 있으면 그것, 없으면 크기로 추정(최대 1,000 이하 = 만원)
//   ⑤ 통신사·차수·적용일·환수 고지 — 시트 이름 › 파일 이름 › 본문 글자 순
// 사람이 정해 줘야 하는 것(못 읽음·애매함)은 issues 로 돌려준다 — 조용히 추측하지 않는다.
import { readXlsx, toGrid, parseRef } from './xlsx'
import { PHONE_DEVICES, deviceTitle } from './phones'
import { PHONE_SPECS } from './phoneSpecs'

export const JOIN_KEYS = ['new', 'mnp', 'chg']
const JOIN_RE = [
  ['new', /^(010|010신규|신규|신규가입|순신규)$/],
  ['mnp', /^(mnp|번호이동|번이|번호이동\(mnp\))$/],
  ['chg', /^(기변|기기변경|보상기변|기변\(보상\))$/],
]
const flat = (v) => String(v ?? '').replace(/\s+/g, '').toLowerCase()
export const joinOf = (v) => { const s = flat(v); for (const [k, re] of JOIN_RE) if (re.test(s)) return k; return null }

// 요금구간 글자 → 하한 월정액(원). 못 읽으면 null — 사람이 정한다.
export function tierMin(label) {
  const s = String(label ?? '')
  let m = /(\d{2,3}(?:\.\d)?)\s*[kK]/.exec(s)
  if (m) return Math.round(parseFloat(m[1]) * 1000)
  m = /(\d{1,3}(?:,\d{3})+|\d{5,6})\s*원?/.exec(s)
  if (m) return Number(m[1].replace(/,/g, ''))
  m = /(\d{1,2})\s*만\s*(?:(\d)\s*천)?/.exec(s)
  if (m) return Number(m[1]) * 10000 + (m[2] ? Number(m[2]) * 1000 : 0)
  return null
}

export function carrierOf(s) {
  const x = String(s ?? '').toUpperCase()
  if (/SKT|SK텔레콤|SK\s*TELECOM/.test(x)) return 'SKT'
  if (/LG\s*U\+|LGU\+?|LG유플러스|유플러스|U\+/.test(x)) return 'LG U+'
  if (/(^|[^A-Z])KT([^A-Z]|$)|케이티/.test(x)) return 'KT'
  return null
}

const DATE_RE = /(20\d{2})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})/
const dateOf = (s) => { const m = DATE_RE.exec(String(s ?? '')); return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : null }
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()

// ── 단말 표기 ↔ 우리 단말 ───────────────────────────────────────────────────
// 표기를 비교용 키로: 공백·'갤럭시' 제거, 영문 표기를 한글로(flip→플립, pro→프로 …)
export function nk(s) {
  return String(s ?? '').toLowerCase()
    .replace(/galaxy|갤럭시/g, '')
    .replace(/iphone/g, '아이폰').replace(/flip/g, '플립').replace(/fold/g, '폴드')
    .replace(/ultra/g, '울트라').replace(/pro\s*max/g, '프로맥스').replace(/pro/g, '프로').replace(/max/g, '맥스').replace(/plus/g, '플러스')
    .replace(/\((5g|lte|4g)\)/g, '').replace(/(^|[^a-z0-9])(5g|lte|4g)(?=$|[^a-z0-9])/g, '$1')
    .replace(/[\s·_]/g, '')
}
const FAMILY_RE = /류|\(전체\)|전체|계열|시리즈|series/g
const VARIANT_RE = /(울트라|플러스|\+|프로맥스|프로|맥스|엣지|fe)$/
const familyKey = (k) => { let x = k; for (let i = 0; i < 3 && VARIANT_RE.test(x); i++) x = x.replace(VARIANT_RE, ''); return x }
const SUFFIX = (x) => x.replace(/(\d)pm$/, '$1프로맥스').replace(/(\d)p$/, '$1프로').replace(/(\d)u$/, '$1울트라')
// 시트 표기에서 모델 번호(A256 · SM-A165 …) — 3~4자리 숫자만(‘S26’ 같은 이름은 제외)
const codesOf = (s) => [...String(s ?? '').toLowerCase().matchAll(/(?:sm-)?([a-z])(\d{3,4})(?![0-9])/g)].map((m) => m[1] + m[2])

export function parseLabel(label) {
  const raw = String(label ?? '')
  let s = nk(raw)
  const family = FAMILY_RE.test(s); FAMILY_RE.lastIndex = 0
  s = s.replace(FAMILY_RE, '')
  const fallback = /(그외|기타|나머지|전모델|그밖)/.test(s)
  const net = /lte|4g/i.test(raw) ? 'LTE' : /5g/i.test(raw) ? '5G' : null
  // 대안 표기 '아이폰18P/PM' → 아이폰18프로 · 아이폰18프로맥스
  const parts = s.replace(/\(.*?\)/g, '').split(/[/,]/).map((x) => x.trim()).filter(Boolean)
  const base = /^(.*\d)/.exec(parts[0] ?? '')?.[1] ?? ''
  const keys = parts.map((x, i) => SUFFIX(i > 0 && /^\D{1,4}$/.test(x) ? base + x : x))
  return { family, fallback, net, keys, codes: codesOf(raw) }
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
function matchOne(L, k, groupNet) {
  if (L.keys.includes(k.exact)) return 'exact'
  if (k.codes.some((c) => L.codes.includes(c))) return 'code'
  if (L.family && L.keys.includes(k.family)) return 'family'
  if (L.fallback && (L.net ?? groupNet ?? '5G') === k.net) return 'fallback'
  return null
}

// 행마다 우리 단말을 붙인다 — 한 단말은 가장 구체적인 행 하나에만(정확 > 모델번호 > 시리즈 > 그 외)
// aliases: { '<통신사>|<시트 표기>': [단말 id…] } — 사람이 고친 매핑. 있으면 그대로 쓴다(빈 배열 = 우리 단말 없음)
export function matchGroups(groups, { carrier, aliases = {}, devices = PHONE_DEVICES } = {}) {
  const keys = devices.map(deviceKeys)
  const best = {}
  groups.forEach((g, gi) => {
    const saved = aliases[`${carrier ?? ''}|${g.label}`]
    if (Array.isArray(saved)) { for (const id of saved) if (!best[id] || RANK.saved > best[id].rank) best[id] = { gi, how: 'saved', rank: RANK.saved }; return }
    const L = parseLabel(g.label)
    for (const k of keys) {
      const how = matchOne(L, k, g.net)
      if (how && (!best[k.id] || RANK[how] > best[k.id].rank)) best[k.id] = { gi, how, rank: RANK[how] }
    }
  })
  return groups.map((g, gi) => {
    const L = parseLabel(g.label)
    const ids = Object.entries(best).filter(([, b]) => b.gi === gi).map(([id]) => id)
    return { ...g, fallback: L.fallback ? (L.net ?? g.net ?? '5G') : null, devices: ids, match: Object.fromEntries(ids.map((id) => [id, best[id].how])) }
  })
}

// ── 시트 하나 → 리베이트 카드 초안 ───────────────────────────────────────────
export function extractRebateSheet(sheet, { fileName = '', aliases = {}, devices = PHONE_DEVICES } = {}) {
  const g = toGrid(sheet)
  const issues = []
  const warn = (msg) => issues.push({ level: 'warn', msg })
  const info = (msg) => issues.push({ level: 'info', msg })
  const joinCount = (r) => { let n = 0; for (let c = 1; c <= g.cols; c++) if (joinOf(g.at(r, c))) n++; return n }

  // ① 가입유형 머리 행 — 010/MNP/기변 글자가 가장 많이(3개 이상) 나오는 행
  let headR = 0, headN = 2
  for (let r = 1; r <= g.rows; r++) { const n = joinCount(r); if (n > headN) { headR = r; headN = n } }
  if (!headR) return null
  let cols = []
  for (let c = 1; c <= g.cols; c++) { const j = joinOf(g.at(headR, c)); if (j) cols.push({ c, j, o: g.origin(headR, c) }) }
  // 가입유형 칸이 병합돼 아래로 갈라지면(예: 공시/선약) 첫 칸만 — 어느 칸이 리베이트인지는 사람이 정한다
  if (cols.some((x, i) => i > 0 && cols[i - 1].o === x.o)) warn('가입유형 칸이 아래로 나뉘어 있습니다(예: 공시/선약) — 각 가입유형의 첫 칸만 읽었습니다. 어느 칸을 리베이트로 쓸지 정해 주세요')
  cols = cols.filter((x, i) => i === 0 || cols[i - 1].o !== x.o)

  // ② 요금구간 — 머리 행 위로 가장 가까운 글자(숫자만 있는 칸·가입유형 글자는 건너뜀)
  const tierAt = (c) => {
    for (let r = headR - 1; r >= Math.max(1, headR - 8); r--) {
      const v = g.at(r, c)
      if (v == null || typeof v !== 'string' || joinOf(v)) continue
      return { label: clean(v), o: g.origin(r, c) }
    }
    return { label: null, o: 'none' }
  }
  const tiers = []
  for (const x of cols) {
    const t = tierAt(x.c)
    let cur = tiers[tiers.length - 1]
    if (!cur || cur.o !== t.o || cur.cols[x.j] != null) {
      cur = { o: t.o, label: t.label ?? `구간 ${tiers.length + 1}`, min: tierMin(t.label), cols: {} }
      tiers.push(cur)
    }
    cur.cols[x.j] = x.c
  }
  const used = new Set()
  tiers.forEach((t, i) => {
    let key = t.min != null ? `t${t.min}` : `tx${i + 1}`
    while (used.has(key)) key += '_'
    used.add(key); t.key = key
    if (t.label.startsWith('구간 ')) warn(`${i + 1}번째 요금구간의 머리글을 찾지 못했습니다 — 구간 이름과 하한 월정액을 정해 주세요`)
    else if (t.min == null) warn(`요금구간 「${t.label}」에서 하한 월정액을 읽지 못했습니다 — 몇 원 이상 요금제인지 정해 주세요`)
    const miss = JOIN_KEYS.filter((j) => t.cols[j] == null)
    if (miss.length) info(`「${t.label}」 구간에는 ${miss.map((j) => ({ new: '010', mnp: 'MNP', chg: '기변' })[j]).join('·')} 칸이 없습니다(취급 안 함으로 둡니다)`)
  })

  // ③ 단말 행
  const firstC = Math.min(...cols.map((x) => x.c))
  const cellVal = (r, c) => {
    if (c == null) return undefined
    const v = g.at(r, c)
    if (typeof v === 'number') return v
    const s = flat(v)
    if (!s) return undefined
    if (/^(x|-|–|—|불가|미취급|n\/a|해당없음)$/.test(s)) return null // 명시적 '취급 안 함'
    const n = Number(s.replace(/[,원]/g, ''))
    return Number.isFinite(n) && /\d/.test(s) ? n : undefined
  }
  const total = tiers.length * JOIN_KEYS.length
  const rows = []
  let started = false, gap = 0, lastR = headR
  for (let r = headR + 1; r <= g.rows; r++) {
    if (joinCount(r) >= 3) break // 다음 표가 시작됨
    const vals = tiers.map((t) => JOIN_KEYS.map((j) => cellVal(r, t.cols[j])))
    const filled = vals.flat().filter((v) => v !== undefined).length
    if (filled === 0 || filled < Math.ceil(total / 2)) { if (started && ++gap >= 2) break; continue }
    started = true; gap = 0; lastR = r
    // 단말 표기 — 첫 값 열 왼쪽으로 가장 가까운 글자, 그 왼쪽 다른 칸의 글자는 분류(5G/LTE)
    let label = null, cat = null, labelO = null
    for (let c = firstC - 1; c >= 1; c--) {
      const v = g.at(r, c)
      if (typeof v !== 'string' || !v.trim()) continue
      if (!label) { label = clean(v); labelO = g.origin(r, c); continue }
      if (g.origin(r, c) !== labelO) { cat = clean(v); break }
    }
    rows.push({ r, label: label ?? `${r}행`, cat, vals })
    if (!label) warn(`${r}행의 단말 이름을 찾지 못했습니다`)
  }
  if (!rows.length) { warn('가입유형 머리는 찾았지만 금액 행이 없습니다'); return { sheet: sheet.name, empty: true, issues } }

  // ④ 단위
  const texts = Object.entries(sheet.cells).filter(([, v]) => typeof v === 'string').map(([ref, v]) => ({ p: parseRef(ref), v }))
  const unitText = texts.map((x) => /단위\s*[:：]?\s*(만\s*원|천\s*원|원)/.exec(x.v)?.[1]).find(Boolean)
  const nums = rows.flatMap((x) => x.vals.flat()).filter((v) => typeof v === 'number')
  const maxAbs = Math.max(0, ...nums.map(Math.abs))
  let unit, unitSource = 'label'
  if (unitText) unit = /만/.test(unitText) ? 10000 : /천/.test(unitText) ? 1000 : 1
  else {
    unitSource = 'guess'
    unit = maxAbs <= 1000 ? 10000 : maxAbs >= 10000 ? 1 : 1000
    if (unit === 1000) warn('금액 단위를 확신할 수 없습니다(천원으로 읽음) — 시트에 "단위: 만원/천원/원"을 적어 주세요')
  }

  // ⑤ 통신사 · 차수 · 적용일 · 고지
  const top = texts.filter((x) => x.p && x.p.r <= headR)
  // 본문은 칸마다 세어 가장 많이 나온 통신사(고지문의 '타사 SKT 이동' 같은 한두 번 언급에 끌려가지 않게)
  const tally = {}
  for (const x of texts) { const c = carrierOf(x.v); if (c) tally[c] = (tally[c] ?? 0) + 1 }
  const ranked = Object.entries(tally).sort((a, b) => b[1] - a[1])
  const bodyCarrier = ranked.length && (ranked.length === 1 || ranked[0][1] > ranked[1][1]) ? ranked[0][0] : null
  const carrier = carrierOf(sheet.name) ?? carrierOf(fileName) ?? bodyCarrier
  if (!carrier) warn('통신사를 알 수 없습니다 — 시트 이름이나 파일 이름에 KT·SKT·LG U+ 를 넣거나, 아래에서 골라 주세요')
  const code = top.map((x) => clean(x.v)).find((v) => /^[A-Z]{1,3}\d{1,3}$/.test(v)) ?? (/^[A-Z]{1,3}\d{1,3}$/.test(sheet.name) ? sheet.name : null)
  const effectiveFrom = top.map((x) => dateOf(x.v)).find(Boolean) ?? texts.map((x) => dateOf(x.v)).find(Boolean) ?? null
  if (!effectiveFrom) warn('적용일(예: 2026.09.18 ~)을 찾지 못했습니다 — 언제부터 쓰는 표인지 정해 주세요')
  // 고지는 표 바로 아래부터 '인터넷·결합' 구역 전까지만 — 그 아래 안내(설치일 기준 환수 등)는 유선 상품 몫이다
  const wiredR = Math.min(...texts.filter((x) => x.p && x.p.r > lastR && /인터넷|결합/.test(x.v)).map((x) => x.p.r), Infinity)
  const below = texts.filter((x) => x.p && x.p.r > lastR && x.p.r < wiredR)
  const notes = [...new Set(below.flatMap((x) => x.v.split(/\n/)).map((l) => l.replace(/^[\sㅇ★●※▶◀·\-]+|[\s★◀]+$/g, '').trim()).filter((l) => /환수|차감/.test(l)))].slice(0, 12)
  if (wiredR < Infinity) info('표 아래 인터넷·결합 구역(과 그 안내문)은 반영하지 않았습니다 — 인터넷 결합 수수료 미반영 원칙')

  const groups = matchGroups(rows.map((x, i) => ({
    key: `g${i + 1}`, label: x.label, row: x.r,
    net: parseLabel(x.label).net ?? (/lte|4g/i.test(x.cat ?? '') ? 'LTE' : /5g/i.test(x.cat ?? '') ? '5G' : null),
    values: Object.fromEntries(tiers.map((t, ti) => [t.key, x.vals[ti].map((v) => (typeof v === 'number' ? Math.round(v * unit) : null))])),
  })), { carrier, aliases, devices })
  const orphans = devices.filter((d) => !groups.some((x) => x.devices.includes(d.id))).map((d) => d.short)
  if (orphans.length) warn(`우리 판매 단말 ${orphans.join('·')} 이(가) 어느 행에도 맞지 않습니다('그 외' 행도 없음) — 행을 지정해 주세요`)

  return {
    sheet: sheet.name, carrier, code, effectiveFrom, unit, unitSource,
    tiers: tiers.map(({ key, label, min }) => ({ key, label, min })),
    joins: JOIN_KEYS, groups, notes, issues,
    stats: { rows: rows.length, cells: nums.length, headRow: headR },
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
    tiers: x.tiers.map((t) => ({ ...t, min: tierMins[t.key] ?? t.min })),
    joins: x.joins,
    groups: x.groups.map(({ key, label, net, fallback, values }) => ({ key, label, net, fallback, devices: mapping[key] ?? x.groups.find((gg) => gg.key === key).devices, values })),
    notes: x.notes,
    source: { file: fileName, sheet: x.sheet, unit: x.unit, importedAt: now },
  }
}
