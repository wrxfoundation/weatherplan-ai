/**
 * 홍수위험지도 정보제공포털 프록시 — 임의 지점의 침수 위험(침수심·위험등급)을 조회.
 * 리스크축(15점)의 "침수 리스크" 항목 소스. 데이터센터에 침수는 치명적이라 우선순위 높음.
 *
 * 소스: data.floodmap.go.kr (국가·지방하천 및 도시침수 홍수위험지도 통계·침수심 조회 API).
 *       키 발급: data.floodmap.go.kr/main/guide/auth_key_issuance
 *
 * 환경변수 (Vercel — 서버 env 전용, 리포 커밋 절대 금지):
 *  - FLOODMAP_KEY (필수) — 홍수위험지도 포털 인증키
 *  - FLOODMAP_URL (선택) — 엔드포인트 템플릿. {lat}{lng}{key} 플레이스홀더. 실경로 확정 시 이 env만 수정
 *      (코드 재배포 불필요). 기본값은 포털 침수심 조회 추정 경로.
 *
 * 응답: { available, depthM?, grade?, scenario?, floodType?, scope } | { available:false, reason }
 */
import http from 'node:http'
import https from 'node:https'
import { promises as dnsp } from 'node:dns'
import { proxyConfigured, proxyGetText } from './_proxy.js'

const DEFAULT_URL =
  'https://data.floodmap.go.kr/openapi/floodDepth?lon={lng}&lat={lat}&serviceKey={key}&dataType=JSON'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

const num = (v) => {
  if (v == null) return undefined
  const n = Number.parseFloat(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : undefined
}

const asJson = (text) => {
  try {
    return JSON.parse(text)
  } catch {
    return { _status: 'not_json' }
  }
}

async function fetchJson(url, ms = 8000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json', 'User-Agent': UA } })
    if (!r.ok) return { _status: r.status }
    return asJson(await r.text())
  } finally {
    clearTimeout(t)
  }
}

/**
 * IPv4 A레코드 직결 GET — floodmap 포털의 UND_ERR_CONNECT_TIMEOUT(IPv6 블랙홀·happy-eyeballs)
 * 우회. https는 SNI로 인증서 검증 유지. (supply 프록시와 동일 처방)
 */
async function rawGetText(urlStr, ms = 7000) {
  const u = new URL(urlStr)
  const ips = await dnsp.resolve4(u.hostname)
  if (!ips?.length) throw new Error('no_a_record')
  const isHttps = u.protocol === 'https:'
  const mod = isHttps ? https : http
  const opts = {
    host: ips[0],
    port: u.port || (isHttps ? 443 : 80),
    path: u.pathname + u.search,
    method: 'GET',
    timeout: ms,
    headers: { Host: u.hostname, 'User-Agent': UA, Accept: 'application/json', Connection: 'close' },
  }
  if (isHttps) opts.servername = u.hostname
  return await new Promise((resolve, reject) => {
    const req = mod.request(opts, (r) => {
      if (r.statusCode && r.statusCode >= 400) {
        r.resume()
        reject(new Error(`status_${r.statusCode}`))
        return
      }
      let data = ''
      r.setEncoding('utf8')
      r.on('data', (c) => (data += c))
      r.on('end', () => resolve(data))
    })
    req.on('timeout', () => req.destroy(new Error('raw_timeout')))
    req.on('error', reject)
    req.end()
  })
}

/* 응답 구조가 포털 버전마다 달라 방어적으로 필드 탐색 */
function pick(obj, names, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 6) return undefined
  for (const n of names) if (obj[n] != null && obj[n] !== '') return obj[n]
  for (const v of Object.values(obj)) {
    if (Array.isArray(v) && v.length) {
      const f = pick(v[0], names, depth + 1)
      if (f !== undefined) return f
    } else if (v && typeof v === 'object') {
      const f = pick(v, names, depth + 1)
      if (f !== undefined) return f
    }
  }
  return undefined
}

// 침수심(m) → 위험등급(정성). 포털이 등급을 직접 주면 그걸 우선.
function depthGrade(depthM) {
  if (depthM == null) return undefined
  if (depthM <= 0) return '해당없음'
  if (depthM < 0.5) return '낮음'
  if (depthM < 1.0) return '보통'
  if (depthM < 2.0) return '높음'
  return '매우높음'
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')

  const key = process.env.FLOODMAP_KEY
  if (!key) {
    res.status(200).json({ available: false, reason: 'not_configured' })
    return
  }

  const lat = num(req.query.lat)
  const lng = num(req.query.lng)
  if (lat == null || lng == null || lat < 32 || lat > 40 || lng < 123 || lng > 132) {
    res.status(400).json({ available: false, reason: 'bad_point' })
    return
  }

  try {
    const url = (process.env.FLOODMAP_URL || DEFAULT_URL)
      .replaceAll('{lat}', String(lat))
      .replaceAll('{lng}', String(lng))
      .replaceAll('{key}', encodeURIComponent(key))

    // 마감시한(10s) 안에서 순차 폴백. 각 단계를 짧게 잡아 IPv4 직결 단계까지 예산이 남게 한다.
    // undici https(정상 빠른 경로) → IPv4직결 https(CONNECT_TIMEOUT 우회) → IPv4직결 http(최후).
    const httpUrl = url.startsWith('https://') ? url.replace('https://', 'http://') : url
    const start = Date.now()
    const DEADLINE = 10000
    const remain = () => DEADLINE - (Date.now() - start)
    // 프록시(UPSTREAM_PROXY_BASE) 설정 시 KR-IP 경유를 최우선 시도 — 클라우드 IP 차단 근본 우회.
    // 미설정 시 이 티어는 없고 기존 undici→IPv4직결 폴백만 동작(동일).
    const tiers = []
    if (proxyConfigured()) {
      tiers.push(async () => asJson(await proxyGetText(url, Math.min(7000, remain()))))
    }
    tiers.push(
      () => fetchJson(url, Math.min(3500, remain())),
      async () => asJson(await rawGetText(url, Math.min(4000, remain()))),
      async () => asJson(await rawGetText(httpUrl, Math.min(3000, remain()))),
    )
    let body = null
    let lastErr = null
    for (const tier of tiers) {
      if (remain() < 800) break
      try {
        const b = await tier()
        if (b && !b._status) {
          body = b
          break
        }
        body = b // _status면 기록만 하고 다음 단계 시도
      } catch (e) {
        lastErr = e
      }
    }
    if (!body) {
      // message 우선 노출 — no_a_record / status_500 / raw_timeout 등 실제 원인 구분(진단)
      res.status(200).json({ available: false, reason: `upstream_${lastErr?.cause?.code || lastErr?.message || lastErr?.name || 'unreachable'}` })
      return
    }
    if (body?._status) {
      res.status(200).json({ available: false, reason: `upstream_${body._status}` })
      return
    }

    const depthM = num(pick(body, ['침수심', 'floodDepth', 'depth', 'inundationDepth', 'maxDepth', 'dep']))
    const gradeRaw = pick(body, ['위험등급', 'riskGrade', 'grade', 'dangerLevel', 'level'])
    const floodType = pick(body, ['홍수유형', 'floodType', 'type', 'riverType']) // 하천/도시침수 등
    const scenario = pick(body, ['시나리오', 'scenario', 'freqency', 'frequency', 'returnPeriod']) // 재현빈도

    if (depthM == null && gradeRaw == null) {
      // 침수구역 밖 판정은 '성공 응답 + 결과 없음'일 때만. 에러 응답(resultCode 99 등)을
      // "안전"으로 오표기하면 침수 리스크를 놓치므로(치명적) 성공 코드 확인 필수.
      const resultCode = pick(body, ['resultCode', 'result_code', 'returnReasonCode', 'code'])
      const SUCCESS = ['00', '0', 'OK', 'SUCCESS', 'NORMAL_SERVICE', 'INFO-0', 'INFO-00']
      const ok = resultCode != null && SUCCESS.includes(String(resultCode).toUpperCase())
      if (ok) {
        res.status(200).json({ available: true, depthM: 0, grade: '해당없음', scope: '홍수위험지도 조회(침수구역 외)' })
        return
      }
      // 성공 코드가 확인되지 않으면 '안전'이라 단정하지 않고 연동 대기 처리
      res.status(200).json({ available: false, reason: resultCode != null ? `result_${resultCode}` : 'schema_unknown' })
      return
    }

    res.status(200).json({
      available: true,
      depthM,
      grade: gradeRaw != null ? String(gradeRaw) : depthGrade(depthM),
      floodType: floodType ? String(floodType) : undefined,
      scenario: scenario ? String(scenario) : undefined,
      scope: '홍수위험지도 침수심(포털 조회)',
    })
  } catch (e) {
    res.status(200).json({ available: false, reason: `upstream_${e?.cause?.code || e?.name || 'error'}` })
  }
}
