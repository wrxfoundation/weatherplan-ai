/**
 * DART 전자공시 프록시 — 데이터센터 관련 최근 공시 (D2 이벤트: 투자·착공·설비 신설 등).
 * 사업자 공시는 언론 보도보다 선행하는 1차 출처 — 시드 needs_verify 해소 단서.
 *
 * 소스: opendart.fss.or.kr 공시검색 API (list.json)
 * 환경변수: DART_API_KEY (서버 env 전용, 리포 커밋 금지)
 *
 * 쿼리: ?corp=고유번호(선택) 또는 최근 90일 DC 키워드 공시 스캔.
 * 응답: { available, filings: [{ corp, title, date, url }] } | { available:false }
 *
 * 주의: DART list.json은 corp_code(고유번호) 기반 — 키워드 전문검색 API는 별도(document.xml).
 * v0는 알려진 DC 운영사 corp_code 목록으로 최근 공시를 모아 필터한다.
 * v1: ?doc=접수번호 — 공시 원문(document.xml zip)을 받아 DC 키워드 스니펫·MW 언급을 온디맨드 스캔.
 */
import { inflateRawSync } from 'node:zlib'

const num = (v) => {
  const n = Number.parseInt(v, 10)
  return Number.isFinite(n) ? n : undefined
}

// 주요 DC 운영·건설 상장사 DART 고유번호 (corp_code) — 공개 정보. 확장 가능.
const DC_CORPS = {
  '00126380': '삼성전자',
  '00164779': 'SK(주)',
  '00266961': 'LG유플러스',
  '00164742': 'KT',
  '01515323': '네이버',
  '00258999': '카카오',
  '00113058': 'GS',
}

// DART list.json은 report_nm(공시 '유형'명)만 준다 — '데이터센터'는 본문에 있고 제목엔 거의 없다.
// 그래서 (a) 제목에 DC가 드러나는 드문 케이스 + (b) DC 투자 신호가 되는 공시유형(신규시설투자·공급계약·
// 유형자산 양수·타법인 출자)을 함께 잡되, 유형을 태깅해 '내용 확인 필요'를 정직히 표기한다.
const DC_KEYWORDS = /(데이터센터|데이터\s*센터|IDC|AIDC|전산센터|AI\s*데이터|하이퍼스케일|클라우드\s*센터)/
const CAPEX_KEYWORDS = /(신규\s*시설\s*투자|유형자산\s*(양수|취득)|타법인\s*주식.*출자|영업양수|단일판매.*공급계약|공급계약\s*체결|증설)/

async function fetchJson(url, ms = 6000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' } })
    if (!r.ok) return { _status: r.status }
    return await r.json()
  } finally {
    clearTimeout(t)
  }
}

function ymd(d) {
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`
}

/** ZIP 로컬 파일 헤더 순회 → 엔트리 버퍼들(deflate면 inflateRaw). DART 원문 zip은 표준 구조. */
function unzipEntries(buf) {
  const out = []
  let i = 0
  while (i + 30 <= buf.length && buf.readUInt32LE(i) === 0x04034b50) {
    const method = buf.readUInt16LE(i + 8)
    const compSize = buf.readUInt32LE(i + 18)
    const nameLen = buf.readUInt16LE(i + 26)
    const extraLen = buf.readUInt16LE(i + 28)
    const start = i + 30 + nameLen + extraLen
    if (!compSize || start + compSize > buf.length) break // 데이터 디스크립터 방식은 미지원 — 안전 중단
    try {
      out.push(method === 8 ? inflateRawSync(buf.subarray(start, start + compSize)) : Buffer.from(buf.subarray(start, start + compSize)))
    } catch {
      /* 개별 엔트리 해제 실패는 건너뜀 */
    }
    i = start + compSize
  }
  return out
}

/** XML/HTML 바이트 → 평문. 인코딩 선언(euc-kr 계열) 감지, 태그·엔티티 제거. */
function toPlainText(bytes) {
  const head = bytes.subarray(0, 200).toString('latin1').toLowerCase()
  let text
  try {
    text = new TextDecoder(/euc-kr|ks_c_5601|ksc5601/.test(head) ? 'euc-kr' : 'utf-8').decode(bytes)
  } catch {
    text = bytes.toString('utf8')
  }
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[#a-zA-Z0-9]+;/g, ' ')
    .replace(/\s+/g, ' ')
}

/** 원문 스캔 — DC 키워드 스니펫(±90자)과 MW 언급 추출 */
async function scanDocument(key, rcpNo, res) {
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 12000)
  try {
    const r = await fetch(`https://opendart.fss.or.kr/api/document.xml?crtfc_key=${key}&rcept_no=${encodeURIComponent(rcpNo)}`, {
      signal: ctrl.signal,
    })
    if (!r.ok) {
      res.status(200).json({ available: false, reason: `upstream_${r.status}` })
      return
    }
    const buf = Buffer.from(await r.arrayBuffer())
    if (buf.subarray(0, 2).toString('latin1') !== 'PK') {
      // zip이 아니면 DART 오류 JSON/XML(키 오류·미존재 등)
      res.status(200).json({ available: false, reason: 'not_zip', hint: buf.subarray(0, 120).toString('utf8') })
      return
    }
    const CAP = 3_000_000 // 스캔 상한(3MB 평문) — 함수 메모리·시간 예산 보호
    let text = ''
    for (const entry of unzipEntries(buf)) {
      text += toPlainText(entry)
      if (text.length > CAP) break
    }
    text = text.slice(0, CAP)
    const kw = /(데이터\s*센터|IDC|AIDC|하이퍼스케일|클라우드\s*센터|전산\s*센터)/g
    const snippets = []
    let m
    while ((m = kw.exec(text)) && snippets.length < 8) {
      const s = Math.max(0, m.index - 90)
      const e = Math.min(text.length, m.index + m[0].length + 90)
      const snip = text.slice(s, e).trim()
      if (!snippets.some((x) => x.includes(snip.slice(20, 60)))) snippets.push(`…${snip}…`)
      kw.lastIndex = m.index + m[0].length + 60 // 같은 문단 중복 수집 방지
    }
    const mwMentions = [...new Set((text.match(/\d[\d,.]{0,8}\s*(?:MW|㎿|메가와트)/gi) || []).map((x) => x.replace(/\s+/g, '')))].slice(0, 10)
    res.status(200).json({ available: true, rcpNo, hasDc: snippets.length > 0, snippets, mwMentions, scannedChars: text.length })
  } catch (e) {
    res.status(200).json({ available: false, reason: `upstream_${e?.cause?.code || e?.name || 'error'}` })
  } finally {
    clearTimeout(t)
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')

  const key = process.env.DART_API_KEY
  if (!key) {
    res.status(200).json({ available: false, reason: 'not_configured' })
    return
  }

  // 원문 스캔 모드 — ?doc=접수번호(14자리)
  const doc = String(req.query.doc || '').trim()
  if (doc) {
    if (!/^\d{10,20}$/.test(doc)) {
      res.status(400).json({ available: false, reason: 'bad_rcp_no' })
      return
    }
    await scanDocument(key, doc, res)
    return
  }

  // 최근 N일 (기본 90) — 프로덕션에서 new Date() 사용 가능 (엣지/서버리스 런타임)
  const days = Math.min(180, Math.max(7, num(req.query.days) ?? 90))
  const end = new Date()
  const begin = new Date(end.getTime() - days * 86400_000)

  try {
    const perCorp = await Promise.all(
      Object.entries(DC_CORPS).map(async ([corp, name]) => {
        const url =
          `https://opendart.fss.or.kr/api/list.json?crtfc_key=${key}` +
          `&corp_code=${corp}&bgn_de=${ymd(begin)}&end_de=${ymd(end)}&page_count=100`
        const body = await fetchJson(url)
        if (body?.status !== '000' || !Array.isArray(body.list)) return []
        const out = []
        for (const it of body.list) {
          const nm = it.report_nm ?? ''
          const isDc = DC_KEYWORDS.test(nm)
          const isCapex = CAPEX_KEYWORDS.test(nm)
          if (!isDc && !isCapex) continue
          out.push({
            corp: name,
            title: nm,
            date: it.rcept_dt,
            type: isDc ? '데이터센터' : '투자·공급',
            rcpNo: it.rcept_no, // 본문 스캔(?doc=)용
            url: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${it.rcept_no}`,
          })
          if (out.length >= 5) break // 대형사 공시 폭주 방지 — 회사당 최근 5건까지
        }
        return out
      }),
    )
    // DC 명시 공시를 상단으로, 그 외엔 최신순
    const filings = perCorp
      .flat()
      .sort((a, b) => (a.type !== b.type ? (a.type === '데이터센터' ? -1 : 1) : a.date < b.date ? 1 : -1))
    if (!filings.length) {
      res.status(200).json({ available: false, reason: 'no_recent_filings' })
      return
    }
    res.status(200).json({ available: true, filings: filings.slice(0, 20), window_days: days })
  } catch (e) {
    res.status(200).json({ available: false, reason: `upstream_${e?.cause?.code || e?.name || 'error'}` })
  }
}
