// ─── 계층 정산서 (총판 → 대리점 → 셀러) 단일 소스 ─────────────────────
// 전산 화면·CSV·드릴다운이 전부 이 파일의 숫자를 읽는다. 화면마다 다른 합계가 나오면 안 된다.
//
// [합산 규칙]  상위 금액 = 하위 금액의 합 + 영업비(건당 +@)
//   셀러   = 본인 영업이익
//   대리점 = Σ(소속 셀러) + 영업비(셀러 판매 건당 대리점 몫)
//   총판   = Σ(소속 대리점) + 영업비(권역 판매 건당 총판 몫)
//   → 각 계층은 "내 총액"과 "바로 아래 한 대"만 본다. 그 아래는 마스킹된다.
//
// [열람 규칙]  reveal = 실명으로 내려갈 수 있는 깊이.
//   본사 ∞ (셀러 실명까지) · 총판 1 (대리점까지, 셀러는 ***) · 대리점 1 (자기 셀러까지) · 셀러 0 (본인만)
//   마스킹은 화면이 아니라 여기서 건다 — 화면마다 판단하면 언젠가 한 곳이 샌다.
import { RATE_CARD } from './commission'
import { monthKey } from './engine'
import { agenciesOf, sellersOf, allDistributors, allAgencies, sellerCode } from './org'

// +@ 의 정산서 표기 명칭 — 어드민에서 바꿀 수 있고, 바꾸면 전 화면·CSV가 같이 바뀐다.
export const OPEX_LABEL_DEFAULT = '영업비'
export const opexLabel = (db) => db.policies?.opexLabel || OPEX_LABEL_DEFAULT
export const MASK = '***'

// 리드 카테고리 → 정책 단가표 상품. 건당 +@ 단가의 단일 소스는 commission.js 의 hidden.
const CAT_RATE = { phone: 'mno-fold', internet: 'net-lgu', water: 'rental-water', rental: 'rental-air', appliance: 'rental-air', move: 'mvno', insurance: 'mvno', etc: 'mvno', car: 'net-kt' }
const rateOf = (cat) => RATE_CARD.find((r) => r.id === (CAT_RATE[cat] ?? 'mvno')) ?? RATE_CARD[0]
// 한 건이 상위 계층에 얹어 주는 금액 — 대리점 몫 / 총판 몫
export const opexPerCase = (cat, tier) => rateOf(cat).hidden?.[tier] ?? 0

// ─── 계층별 집계 ───────────────────────────────────────────────
// 셀러 한 명: 영업이익(net)과 건수. 금액 산식은 store.tenantSettlement 가 단일 소스이므로 주입받는다.
export function sellerNode(db, tenant, period, settleFn) {
  const s = settleFn(db, tenant.id, period)
  const cases = s.lines ?? []
  return {
    kind: 'seller', id: tenant.id, name: tenant.name, code: sellerCode(db, tenant),
    amount: Math.max(0, s.net), cases: cases.length,
    opexUp: { agency: cases.reduce((x, l) => x + opexPerCase(l.cat, 'agency'), 0), distributor: cases.reduce((x, l) => x + opexPerCase(l.cat, 'distributor'), 0) },
    children: null,
  }
}

export function agencyNode(db, agency, period, settleFn) {
  const sellers = sellersOf(db, agency.id).map((t) => sellerNode(db, t, period, settleFn))
  const sub = sellers.reduce((s, n) => s + n.amount, 0)
  const opex = sellers.reduce((s, n) => s + n.opexUp.agency, 0)
  return {
    kind: 'agency', id: agency.id, name: agency.name, code: agency.code,
    amount: sub + opex, sub, opex, cases: sellers.reduce((s, n) => s + n.cases, 0),
    opexUp: { distributor: sellers.reduce((s, n) => s + n.opexUp.distributor, 0) },
    children: sellers,
  }
}

export function distributorNode(db, dist, period, settleFn) {
  const agencies = agenciesOf(db, dist.id).map((a) => agencyNode(db, a, period, settleFn))
  const sub = agencies.reduce((s, n) => s + n.amount, 0)
  const opex = agencies.reduce((s, n) => s + n.opexUp.distributor, 0)
  return {
    kind: 'distributor', id: dist.id, name: dist.name, code: dist.code,
    amount: sub + opex, sub, opex, cases: agencies.reduce((s, n) => s + n.cases, 0),
    children: agencies,
  }
}

export function hqNode(db, period, settleFn) {
  const dists = allDistributors(db).map((d) => distributorNode(db, d, period, settleFn))
  const sub = dists.reduce((s, n) => s + n.amount, 0)
  return { kind: 'hq', id: 'HQ', name: '본사 전체', code: null, amount: sub, sub, opex: 0, cases: dists.reduce((s, n) => s + n.cases, 0), children: dists }
}

/**
 * 화면이 그대로 그릴 수 있는 정산 트리 한 덩어리.
 * @param viewer bizIdentity() 결과 — { tier, id, reveal }
 * @returns { period, root, label } root.children 은 reveal 깊이를 넘으면 masked:true 로 내려온다.
 */
export function settleView(db, { viewer, period = monthKey(), settleFn }) {
  if (!viewer) return null
  const root =
    viewer.tier === 'hq' ? hqNode(db, period, settleFn)
      : viewer.tier === 'distributor' ? distributorNode(db, allDistributors(db).find((d) => d.id === viewer.id) ?? allDistributors(db)[0] ?? { id: '-', name: '-' }, period, settleFn)
        : viewer.tier === 'agency' ? agencyNode(db, allAgencies(db).find((a) => a.id === viewer.id) ?? allAgencies(db)[0] ?? { id: '-', name: '-' }, period, settleFn)
          : sellerNode(db, db.tenants.find((t) => t.id === viewer.id) ?? db.tenants[0], period, settleFn)
  return { period, root: maskTree(root, viewer.reveal ?? 0), label: opexLabel(db) }
}

// 깊이 제한 — depth 를 다 쓰면 이름을 *** 로 바꾸고 더 내려가지 못하게 children 을 끊는다.
// 금액은 남긴다(합계 검증이 가능해야 하므로). 가려지는 것은 "누구인가" 뿐이다.
export function maskTree(node, depth) {
  if (!node) return node
  const kids = node.children
  if (!kids) return { ...node, masked: false }
  if (depth <= 0) return { ...node, children: kids.map((k) => ({ ...k, name: MASK, code: null, masked: true, children: null })) }
  return { ...node, children: kids.map((k) => maskTree(k, depth - 1)) }
}

// 트리를 CSV 행으로 — 들여쓰기로 계층을 표현한다(엑셀에서 그대로 읽힌다).
export function treeRows(node, label, depth = 0, out = []) {
  out.push([`${'  '.repeat(depth)}${node.name}`, node.code ?? '', node.kind, node.cases ?? '', node.amount])
  ;(node.children ?? []).forEach((k) => treeRows(k, label, depth + 1, out))
  if (node.opex > 0) out.push([`${'  '.repeat(depth + 1)}${label}`, '', 'opex', '', node.opex])
  return out
}
