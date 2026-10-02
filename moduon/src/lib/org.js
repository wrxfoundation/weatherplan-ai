// ─── 조직 3계층 (권역 총판 → 지역 대리점 → 셀러) 단일 소스 ─────────────
// 개인식별번호 A1J1234 = 권역(영문 1) + 지역(숫자 1) + 셀러코드(영문 1 + 숫자 4).
//
// [원칙] 상위 코드는 하위 코드의 접두사다 — 'A' ⊂ 'A1' ⊂ 'A1J1234'.
//   소속 판정이 문자열 비교 하나로 끝나므로, 정산·권한·검색이 전부 같은 규칙을 쓴다.
//   (부모 id 를 따라 올라가는 조회가 없어야 마스킹 규칙에 구멍이 안 생긴다)
//
// [원칙] 개인회원은 코드를 갖지 않는다 — 조직에 속하지 않으므로 R/B·정산 화면이 전부 닫힌다.
//   사업자회원만 가입 시 추천인(권역)을 지정하고, 그 자리에서 식별번호를 발급받는다.

// 혼동 문자 제외 — I(1) · O(0) 는 코드에 쓰지 않는다. 전화로 불러줄 때 사고가 난다.
export const CODE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const L = `[${CODE_LETTERS}]`

export const CODE_RE = {
  distributor: new RegExp(`^${L}$`),
  agency: new RegExp(`^${L}[1-9]$`),
  seller: new RegExp(`^${L}[1-9]${L}\\d{4}$`),
}
export const FULL_RE = new RegExp(`^(${L})([1-9])(${L}\\d{4})$`)

export const TIER_LABEL = { hq: '본사', distributor: '총판', agency: '대리점', seller: '셀러' }
export const TIER_UNIT = { distributor: '권역', agency: '지역', seller: '셀러' }
// 가입 가능한 사업자 등급 — 본사는 가입 대상이 아니다
export const SIGNUP_TIERS = [
  { key: 'seller', label: '셀러', desc: '고객을 직접 만나 판매합니다. 대리점 소속으로 식별번호를 받아요.' },
  { key: 'agency', label: '대리점', desc: '지역을 맡아 셀러를 모집·관리합니다. 셀러 판매 건당 영업비가 붙어요.' },
  { key: 'distributor', label: '총판', desc: '권역을 맡아 대리점을 관리합니다. 권역 전체 판매에 영업비가 붙어요.' },
]
export const MEMBER_TYPES = [
  { key: '개인', desc: '비교·견적·상담과 모두온 혜택을 이용합니다.' },
  { key: '사업자', desc: '권역·지역 소속으로 판매하고 R/B·정산서를 봅니다.' },
]

// ─── 코드 파싱·판정 ────────────────────────────────────────────
export const tierOfCode = (code = '') =>
  CODE_RE.seller.test(code) ? 'seller' : CODE_RE.agency.test(code) ? 'agency' : CODE_RE.distributor.test(code) ? 'distributor' : null

export function parseCode(code = '') {
  const m = FULL_RE.exec(String(code).trim().toUpperCase())
  if (!m) return null
  return { region: m[1], area: m[2], seller: m[3], agency: `${m[1]}${m[2]}`, full: m[0] }
}
// 소속 판정 — 접두사 규칙. 자기 자신도 '속한다'로 본다(합계에 본인이 들어가야 하므로).
export const isUnder = (code, parent) => !!code && !!parent && String(code).startsWith(String(parent))

// ─── 조회 셀렉터 ───────────────────────────────────────────────
export const allDistributors = (db) => db.distributors ?? []
export const allAgencies = (db) => db.agencies ?? []
export const allMembers = (db) => db.members ?? []

export const distributorByCode = (db, code) => allDistributors(db).find((d) => d.code === code) ?? null
export const agencyByCode = (db, code) => allAgencies(db).find((a) => a.code === code) ?? null
export const agenciesOf = (db, distributorId) => allAgencies(db).filter((a) => a.distributorId === distributorId)
// 셀러 = 분양몰(tenant). 대리점 소속이 없는 몰은 본사 직할로 남는다(코드 없이도 영업은 된다).
export const sellersOf = (db, agencyId) => db.tenants.filter((t) => t.agencyId === agencyId)
export const sellersUnder = (db, distributorId) =>
  agenciesOf(db, distributorId).flatMap((a) => sellersOf(db, a.id))

export const agencyOfSeller = (db, tenant) => allAgencies(db).find((a) => a.id === tenant?.agencyId) ?? null
export const distributorOfAgency = (db, agency) => allDistributors(db).find((d) => d.id === agency?.distributorId) ?? null

// 셀러 한 명의 전체 식별번호 — 대리점 코드 + 셀러코드. 소속이 없으면 null.
export function sellerCode(db, tenant) {
  const a = agencyOfSeller(db, tenant)
  return a && tenant?.sellerCode ? `${a.code}${tenant.sellerCode}` : null
}

// ─── 코드 발급 ─────────────────────────────────────────────────
// 지역 코드: 같은 권역 안에서 1~9. 9개를 다 쓰면 더 못 연다(권역 분할이 정책상 정답).
export function nextAgencyCode(db, distributorId) {
  const d = allDistributors(db).find((x) => x.id === distributorId)
  if (!d?.code) return null
  const used = new Set(agenciesOf(db, distributorId).map((a) => a.code))
  for (let i = 1; i <= 9; i += 1) {
    const code = `${d.code}${i}`
    if (!used.has(code)) return code
  }
  return null
}

// 셀러 코드: 영문 1 + 숫자 4. 전체 조직에서 유일해야 하므로 발급된 전 코드를 본다.
// 난수 + 충돌 시 재시도(최대 200회) — 순번이 아니라 난수여야 판매 규모가 코드로 드러나지 않는다.
export function issueSellerCode(db, agencyCode) {
  if (!agencyCode) return null
  const used = new Set([
    ...db.tenants.map((t) => (t.agencyId && t.sellerCode ? `${agencyOfSeller(db, t)?.code ?? ''}${t.sellerCode}` : null)),
    ...allMembers(db).map((m) => m.code),
  ].filter(Boolean))
  for (let i = 0; i < 200; i += 1) {
    const letter = CODE_LETTERS[Math.floor(Math.random() * CODE_LETTERS.length)]
    const digits = String(Math.floor(1000 + Math.random() * 9000))
    const full = `${agencyCode}${letter}${digits}`
    if (!used.has(full)) return full
  }
  return null
}

// ─── 세션 → 사업자 신분 ────────────────────────────────────────
// R/B 노출과 정산 열람 범위를 단 한 곳에서 정한다. 개인회원·비로그인은 null.
// 기존 데모 롤(partner=셀러, regional=총판, admin=본사)도 사업자로 본다 — 데모 전환이 끊기지 않게.
export function bizIdentity(db, session) {
  if (!session) return null
  if (session.role === 'admin') return { tier: 'hq', label: '본사', name: '본사 관리자', code: null, reveal: Infinity }
  if (session.role === 'regional') {
    const d = allDistributors(db).find((x) => x.id === session.distributorId) ?? allDistributors(db)[0]
    return d ? { tier: 'distributor', label: '총판', name: d.name, code: d.code, id: d.id, reveal: 1 } : null
  }
  if (session.role === 'agency') {
    const a = allAgencies(db).find((x) => x.id === session.agencyId) ?? allAgencies(db)[0]
    return a ? { tier: 'agency', label: '대리점', name: a.name, code: a.code, id: a.id, reveal: 1 } : null
  }
  if (session.role === 'partner') {
    const t = db.tenants.find((x) => x.id === session.tenantId)
    return t ? { tier: 'seller', label: '셀러', name: t.name, code: sellerCode(db, t), id: t.id, reveal: 0 } : null
  }
  if (session.role === 'member') {
    const m = allMembers(db).find((x) => x.id === session.memberId)
    if (!m || m.type !== '사업자') return null
    return { tier: m.tier, label: TIER_LABEL[m.tier], name: m.name, code: m.code, id: m.id, memberId: m.id, reveal: m.tier === 'seller' ? 0 : 1 }
  }
  return null
}

// 조직도 — 어드민 조직 관리와 정산 트리가 같은 모양을 읽는다.
export function orgTree(db) {
  return allDistributors(db).map((d) => ({
    ...d,
    agencies: agenciesOf(db, d.id).map((a) => ({ ...a, sellers: sellersOf(db, a.id) })),
  }))
}
