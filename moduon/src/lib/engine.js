// ─── 모두온 계산 엔진: 견적 · 정산 · 라우팅 · 포맷 ───────────────
import { unitBySigungu } from './constants'

// 금액 포맷 (천단위 콤마 + 원, tabular-nums는 CSS에서)
export const won = (n) => `${Math.round(n).toLocaleString('ko-KR')}원`
export const num = (n) => Math.round(n).toLocaleString('ko-KR')

// 이름 마스킹: 김철수 → 김*수 / 두 글자는 김* / 상호는 그대로
export const maskName = (name = '') => {
  if (name.length <= 1) return name
  if (name.length === 2) return name[0] + '*'
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1]
}
// 연락처 마스킹: 010-1234-5678 → 010-****-5678
export const maskPhone = (phone = '') => phone.replace(/(\d{3})-?(\d{3,4})-?(\d{4})/, '$1-****-$3')

export const phoneValid = (phone = '') => /^01[016789]-?\d{3,4}-?\d{4}$/.test(phone.trim())

// ─── S-03 견적 계산기 (핸드오프 확정 로직) ─────────────────────
// 기본 상태: KT · 500M · 정수기 결합 · 프로모션 off → 월 32,900원 / 사은품 350,000원
export const SPEED_MAP = { '100M': 33000, '500M': 44000, '1G': 55000 }
export const BUNDLE_MAP = { none: 0, water: 11100, phone: 8800 }
export const BUNDLE_LABEL = { none: '결합 없음', water: '정수기 렌탈 결합', phone: '휴대폰 결합' }
export const PROMO_DISCOUNT = 3000
export const GIFT_MAP = { '100M': 200000, '500M': 300000, '1G': 400000 }
export const CARRIERS = ['KT', 'SK브로드밴드', 'LG U+']

export function calcQuote({ speed = '500M', bundle = 'water', promo = false } = {}) {
  const base = SPEED_MAP[speed] ?? 0
  const bundleDc = BUNDLE_MAP[bundle] ?? 0
  const promoDc = promo ? PROMO_DISCOUNT : 0
  const total = base - bundleDc - promoDc
  const gift = (GIFT_MAP[speed] ?? 0) + (bundle !== 'none' ? 50000 : 0)
  return { base, bundleDc, promoDc, total, gift }
}

// ─── 사은품 지급 방식 (아정당·다쏜다식 '현금 극대화') ─────────────
export const PAYOUTS = [
  { key: 'cash',    label: '현금',     sub: '설치 확인 후 3영업일 내 계좌 입금', badge: '가장 인기' },
  { key: 'voucher', label: '상품권',   sub: '백화점·신세계 상품권으로 지급' },
  { key: 'bill',    label: '요금할인', sub: '24개월 매월 통신비에서 자동 차감' },
]
// 기준 사은품가(gift) → 방식별 실수령. 현금·상품권은 동일 총액, 요금할인은 24개월 분할.
export function payout(gift, method = 'cash') {
  if (method === 'bill') return { kind: 'monthly', monthly: Math.round(gift / 24), months: 24, total: gift }
  return { kind: 'lump', lump: gift, total: gift }
}

// ─── 설치 가능 지역 조회 (아정당·다쏜다식 즉시조회 시뮬레이션) ─────
// 실서비스에서는 통신사 커버리지 API로 대체. 데모는 권역 매핑으로 '가능/제한'을 결정적으로 산출.
export function installCheck(sigungu) {
  const unit = unitBySigungu(sigungu)
  if (!sigungu) return null
  if (!unit) return { ok: false, unit: null, carriers: [], note: '입력하신 지역을 찾지 못했어요 — 상담사가 직접 확인해 드릴게요.' }
  // 권역 코드로 결정적 가용성(데모): 도서·산간 일부만 특정 통신사 제한
  const limited = ['JJ', 'GW'].includes(unit) // 제주·강원 일부는 광랜 제한 예시
  const carriers = CARRIERS.map((c, i) => ({
    name: c,
    ok: !(limited && i === 2), // 제한 권역은 3번째 통신사 미지원 예시
    max: c === 'KT' ? '1G' : c === 'SK브로드밴드' ? '1G' : '500M',
  }))
  return { ok: true, unit, carriers, note: '설치 가능! 결합 조건에 따라 현금 사은품이 더 커질 수 있어요.' }
}

// ─── 5.6 정산 로직 (정책값은 policies 테이블에서 주입) ──────────
// 파트너 순수익 = 몰 매출 − 운영 수수료(10%) − 월 이용료(10만)
// 예) 월 매출 10,000,000 → −1,000,000 −100,000 = 8,900,000원
export function calcSettlement(gross, policies) {
  const fee = Math.round(gross * policies.feeRate)
  const net = gross - fee - policies.monthlyFee
  return { gross, fee, monthlyFee: policies.monthlyFee, net }
}

// ─── L-02 리드 라우팅 ──────────────────────────────────────────
// ① 파트너몰 유입 → 해당 파트너  ② 본진 유입 → 고객 주소지 권역의 파트너
// ③ 권역 공석 → 관리단 → 본사 폴백
export function routeLead({ sourceSlug, sigungu }, tenants) {
  const active = tenants.filter((t) => t.status === '활성')
  if (sourceSlug) {
    const t = active.find((t) => t.slug === sourceSlug)
    if (t) return { tenantId: t.id, via: '파트너몰 유입' }
  }
  const unit = unitBySigungu(sigungu)
  if (unit) {
    const regional = active.filter((t) => t.unit === unit)
    if (regional.length) {
      // 권역 내 리드 적은 파트너 우선(간이 로드밸런싱)
      const pick = [...regional].sort((a, b) => (a.leadCount ?? 0) - (b.leadCount ?? 0))[0]
      return { tenantId: pick.id, via: `권역 배정(${unit})` }
    }
    return { tenantId: null, via: `관리단 폴백(${unit})` }
  }
  return { tenantId: null, via: '본사 폴백' }
}

// ─── 시간 유틸 ─────────────────────────────────────────────────
export const minutesAgo = (ts) => Math.max(0, Math.floor((Date.now() - ts) / 60000))
export function timeAgo(ts) {
  const m = minutesAgo(ts)
  if (m < 1) return '방금 전'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  return `${Math.floor(h / 24)}일 전`
}
export const monthKey = (ts = Date.now()) => {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
export const fmtDate = (ts) => {
  const d = new Date(ts)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}
export const fmtDateTime = (ts) => {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
export const dday = (ts) => Math.ceil((ts - Date.now()) / 86400000)

// ─── 추천 링크 귀속 (axion 흡수) ────────────────────────────────
// ?ref=파트너슬러그 를 최초 1회 localStorage에 각인 — 세션을 넘어 유지되어
// 나중에 상담을 신청해도 추천 파트너에게 귀속된다.
export function captureRef() {
  try {
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref) localStorage.setItem('moduon_ref', ref.slice(0, 40))
  } catch { /* noop */ }
  try { return localStorage.getItem('moduon_ref') } catch { return null }
}

// 클립보드 복사 — clipboard API 실패 시 textarea 폴백 (인앱 브라우저 대응)
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true } catch { /* fallthrough */ }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
    return true
  } catch { return false }
}

// 텍스트 파일 내보내기 (마크다운 실행서 등)
export function downloadText(filename, text, mime = 'text/markdown;charset=utf-8') {
  const blob = new Blob([text], { type: mime })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

// CSV 내보내기
export function downloadCSV(filename, rows) {
  const bom = '﻿'
  // 한국어 엑셀 호환: BOM + CRLF (LF만 쓰면 일부 엑셀 버전에서 줄바꿈이 깨진다)
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n')
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
