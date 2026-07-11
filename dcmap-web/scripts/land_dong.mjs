#!/usr/bin/env node
/**
 * 읍면동별 지가변동률 승격 파이프라인 (KOSIS · 한국부동산원 DT_31501N_010, org 408, 월간)
 *
 * 입력: KOSIS 원본 JSON 덤프 (rows: [{C1, C1_NM, DT, PRD_DE, ...}])
 *   - MCP(kosis_data) 또는 KOSIS 오픈API 응답을 그대로 저장한 파일
 *   - 오픈API 직접 호출: https://kosis.kr/openapi/Param/statisticsParameterData.do
 *       ?method=getList&apiKey=$KOSIS_KEY&orgId=408&tblId=DT_31501N_010
 *       &objL1=ALL&itmId=T1&prdSe=M&newEstPrdCnt=1&format=json&jsonVD=Y
 * 출력: data/land_price_dong_v0.json — DC 입지 시군구만 추려 시군구 요약 + 읍면동 상세
 *
 * 파싱은 문서 순서(깊이우선) 기반: KOSIS 덤프의 C1 코드는 순수 prefix 계층이 아님
 * (예: 서울 강서구가 111504로 양천구 코드대에 끼어 있음 — 도봉구·옹진군도 동일 유형).
 * 시군구 판정: C1 4~5자리, 또는 6자리 이상이라도 이름이 구/시/군으로 끝나는 행.
 * 구가 있는 시(용인 등)는 산하 구의 읍면동까지 시 키로 흡수.
 *
 * 용도지역별(DT_PLCAHTUSE)은 objL 다차원 파라미터 필요 — 현 파이프라인 미지원, 문서 참조.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const RAW = process.argv[2]
if (!RAW) {
  console.error('사용법: node scripts/land_dong.mjs <kosis_raw.json>')
  process.exit(1)
}

const rows = JSON.parse(readFileSync(RAW, 'utf8'))
const period = rows[0]?.PRD_DE
const num = (s) => Number.parseFloat(s)

// 구를 가진 시 — 읍면동이 구 아래에 달리므로 구까지 흡수 (공개 행정구역, 고정 구조)
const CITY_GUS = {
  '경기 수원시': ['장안구', '권선구', '팔달구', '영통구'],
  '경기 성남시': ['수정구', '중원구', '분당구'],
  '경기 안양시': ['만안구', '동안구'],
  '경기 부천시': ['원미구', '소사구', '오정구'],
  '경기 안산시': ['상록구', '단원구'],
  '경기 고양시': ['덕양구', '일산동구', '일산서구'],
  '경기 용인시': ['처인구', '기흥구', '수지구'],
  '경북 포항시': ['남구', '북구'],
}

// 문서 순서(깊이우선) 파싱 — sido → sigungu → dongs 트리 구성
const isSigungu = (r) =>
  r.C1.length === 4 ||
  r.C1.length === 5 ||
  (/[구시군]$/.test(r.C1_NM) && !/[동읍면리가]$/.test(r.C1_NM))

const tree = {} // { "서울 마포구": { rate, dongs: [{name, rate}] } }
let curSido = null
let curKey = null
for (const r of rows) {
  if (r.C1 === '10') continue // 전국
  if (r.C1.length === 2) {
    curSido = r.C1_NM
    // 세종은 시도=시군구 단일 — 시도 행을 곧바로 시군구로 취급
    curKey = curSido === '세종' ? '세종 세종시' : null
    if (curKey) tree[curKey] = { rate: num(r.DT), dongs: [] }
    continue
  }
  if (isSigungu(r)) {
    curKey = `${curSido} ${r.C1_NM}`
    tree[curKey] = { rate: num(r.DT), dongs: [] }
    continue
  }
  if (curKey) tree[curKey].dongs.push({ name: r.C1_NM, rate: num(r.DT) })
}

// DC 입지 시군구 목록은 dc_centers.json에서 도출 (시드가 바뀌면 자동 추종)
const { facilities } = JSON.parse(readFileSync(join(ROOT, 'data/dc_centers.json'), 'utf8'))
const keys = [...new Set(facilities.filter((f) => f.sigungu).map((f) => `${f.sido} ${f.sigungu}`))]

const out = {}
const missing = []
for (const key of keys) {
  const base = tree[key]
  if (!base) {
    missing.push(key)
    continue
  }
  const [sido] = key.split(' ')
  const dongs = [...base.dongs]
  for (const gu of CITY_GUS[key] ?? []) {
    const g = tree[`${sido} ${gu}`]
    if (g) dongs.push(...g.dongs)
  }
  dongs.sort((a, b) => b.rate - a.rate)
  out[key] = { rate: base.rate, dongs }
}

const total = Object.values(out).reduce((n, v) => n + v.dongs.length, 0)
writeFileSync(
  join(ROOT, 'data/land_price_dong_v0.json'),
  JSON.stringify(
    {
      source: 'KOSIS·한국부동산원 「지가변동률」 읍면동별 (orgId 408, tblId DT_31501N_010, 월간)',
      note: '단위 %/월. DC 입지 시군구만 수록. 읍면동 명칭은 부동산원 조사구역 단위(복수 동 병기 있음). 구가 있는 시는 산하 구 전체의 읍면동 포함.',
      period,
      generated_from: 'scripts/land_dong.mjs',
      entries: out,
    },
    null,
    2,
  ) + '\n',
)
console.log(`land_price_dong_v0.json 생성: 시군구 ${Object.keys(out).length}건 · 읍면동 ${total}건 (기준 ${period})`)
if (missing.length) console.warn('매칭 실패:', missing.join(', '))
