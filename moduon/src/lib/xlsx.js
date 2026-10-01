// ─── xlsx 읽기 (의존성 없음) ─────────────────────────────────────────────────
// 단가표 업로드용 최소 리더. xlsx 는 zip 안의 XML 몇 장이라 필요한 것만 읽는다:
//   workbook.xml(시트 이름) → workbook.xml.rels(시트 파일 경로) → sharedStrings.xml(문자열 표) → sheetN.xml(셀·병합)
// 압축 해제는 브라우저·Node 공통 DecompressionStream('deflate-raw') — 라이브러리를 들이지 않는다.
// 못 읽는 것: .xls(구 바이너리)·암호 걸린 파일·zip64(4GB 초과). 셀 서식·수식은 보지 않고 저장된 값만 쓴다.
//
// 반환: { sheets: [{ name, hidden, cells: { G7: 36, D7: '갤럭시 Z플립 8', … }, merges: ['D7:F7', …] }] }

const td = new TextDecoder('utf-8')
const u16 = (b, o) => b[o] | (b[o + 1] << 8)
const u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0

async function inflateRaw(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

// zip 목차(central directory)만 읽어 두고, 항목은 필요할 때 푼다
export function unzip(buf) {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  if (b.length < 22 || u32(b, 0) !== 0x04034b50) {
    // D0 CF = 예전 OLE 형식(.xls) — 가장 흔한 실수라 따로 안내한다
    throw new Error(b[0] === 0xd0 && b[1] === 0xcf ? '예전 엑셀(.xls) 형식입니다 — 엑셀에서 "다른 이름으로 저장 → .xlsx" 후 올려 주세요' : '엑셀(.xlsx) 파일이 아닙니다')
  }
  let eocd = -1
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) if (u32(b, i) === 0x06054b50) { eocd = i; break }
  if (eocd < 0) throw new Error('파일이 손상됐습니다(zip 목차 없음)')
  const count = u16(b, eocd + 10)
  let p = u32(b, eocd + 16)
  const files = {}
  for (let n = 0; n < count; n++) {
    if (u32(b, p) !== 0x02014b50) throw new Error('파일이 손상됐습니다(zip 목차 오류)')
    const flags = u16(b, p + 8), method = u16(b, p + 10), csize = u32(b, p + 20)
    const nlen = u16(b, p + 28), elen = u16(b, p + 30), clen = u16(b, p + 32), lho = u32(b, p + 42)
    const name = td.decode(b.subarray(p + 46, p + 46 + nlen))
    if (flags & 1) throw new Error('암호가 걸린 파일입니다 — 암호를 풀고 저장한 뒤 올려 주세요')
    files[name] = { method, csize, lho }
    p += 46 + nlen + elen + clen
  }
  const read = async (name) => {
    const f = files[name]
    if (!f) return null
    if (u32(b, f.lho) !== 0x04034b50) throw new Error('파일이 손상됐습니다(zip 항목 오류)')
    const start = f.lho + 30 + u16(b, f.lho + 26) + u16(b, f.lho + 28)
    const data = b.subarray(start, start + f.csize)
    if (f.method === 0) return data
    if (f.method === 8) return inflateRaw(data)
    throw new Error(`지원하지 않는 압축 방식입니다(${f.method})`)
  }
  return { names: Object.keys(files), read }
}

// ── XML 조각 읽기 — 이 파일들의 구조는 고정이라 정규식으로 충분하다(DOMParser 없이 Node 검사에서도 돈다)
const ENT = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" }
const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|lt|gt|amp|quot|apos);/gi, (_, e) => (e[0] === '#'
  ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10))
  : ENT[e.toLowerCase()]))
const attr = (tag, name) => { const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`)); return m ? decode(m[1]) : null }
// <t> 를 전부 이어 붙인다(서식이 섞인 글자 조각 포함). <rPh>(발음 표기)는 버린다.
const textOf = (xml) => decode([...xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '').matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((m) => m[1]).join(''))

export const colNum = (letters) => letters.split('').reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0)
export const colName = (n) => { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26) } return s }
export const parseRef = (ref) => { const m = /^([A-Z]+)(\d+)$/.exec(ref ?? ''); return m ? { c: colNum(m[1]), r: Number(m[2]) } : null }

export async function readXlsx(buf) {
  const z = unzip(buf)
  const str = async (name) => { const x = await z.read(name); return x ? td.decode(x) : null }
  const wb = await str('xl/workbook.xml')
  if (!wb) throw new Error('엑셀 통합문서(workbook)가 없습니다 — .xlsx 파일인지 확인해 주세요')
  const rels = (await str('xl/_rels/workbook.xml.rels')) ?? ''
  const relTags = [...rels.matchAll(/<Relationship\b[^>]*>/g)].map((m) => m[0])
  const target = (rid) => {
    const t = attr(relTags.find((x) => attr(x, 'Id') === rid) ?? '', 'Target')
    if (!t) return null
    return t.startsWith('/') ? t.slice(1) : `xl/${t.replace(/^\.\//, '')}`
  }
  const ssXml = await str('xl/sharedStrings.xml')
  const ss = ssXml ? [...ssXml.matchAll(/<si\b[^>]*?(?:\/>|>([\s\S]*?)<\/si>)/g)].map((m) => textOf(m[1] ?? '')) : []

  const sheets = []
  for (const m of wb.matchAll(/<sheet\b[^>]*>/g)) {
    const tag = m[0]
    const path = target(attr(tag, 'r:id'))
    const xml = path ? await str(path) : null
    if (!xml) continue
    const cells = {}
    for (const c of xml.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const a = ` ${c[1]}`, body = c[2] ?? ''
      const ref = attr(a, 'r'), t = attr(a, 't')
      if (!ref) continue
      let v
      if (t === 'inlineStr') v = textOf(/<is\b[^>]*>([\s\S]*?)<\/is>/.exec(body)?.[1] ?? '')
      else {
        const raw = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(body)?.[1]
        if (raw == null) continue
        if (t === 's') v = ss[Number(raw)] ?? ''
        else if (t === 'str' || t === 'e') v = decode(raw)
        else if (t === 'b') v = raw === '1'
        else v = Number(raw)
      }
      if (v === '' || v == null || Number.isNaN(v)) continue
      cells[ref] = v
    }
    const merges = [...xml.matchAll(/<mergeCell\b[^>]*\sref="([^"]+)"/g)].map((x) => x[1])
    sheets.push({ name: attr(tag, 'name') ?? `시트${sheets.length + 1}`, hidden: /hidden/i.test(attr(tag, 'state') ?? ''), cells, merges })
  }
  if (!sheets.length) throw new Error('읽을 수 있는 시트가 없습니다')
  return { sheets }
}

// 병합 칸을 펼친 격자 — 병합 범위의 모든 칸이 왼쪽 위 값과 원점 주소를 갖는다(머리글이 여러 열에 걸친 표를 읽기 쉽게)
export function toGrid(sheet) {
  const val = new Map(), origin = new Map()
  let maxR = 0, maxC = 0
  for (const [ref, v] of Object.entries(sheet.cells)) {
    const p = parseRef(ref); if (!p) continue
    val.set(`${p.r},${p.c}`, v); origin.set(`${p.r},${p.c}`, ref)
    maxR = Math.max(maxR, p.r); maxC = Math.max(maxC, p.c)
  }
  for (const rng of sheet.merges) {
    const [a, b] = rng.split(':').map(parseRef)
    if (!a || !b) continue
    const v = val.get(`${a.r},${a.c}`)
    for (let r = a.r; r <= b.r; r++) for (let c = a.c; c <= b.c; c++) {
      origin.set(`${r},${c}`, `${colName(a.c)}${a.r}`)
      if (v !== undefined) val.set(`${r},${c}`, v)
    }
    maxR = Math.max(maxR, b.r); maxC = Math.max(maxC, b.c)
  }
  return {
    rows: maxR, cols: maxC,
    at: (r, c) => val.get(`${r},${c}`),
    origin: (r, c) => origin.get(`${r},${c}`) ?? `${colName(c)}${r}`,
  }
}
