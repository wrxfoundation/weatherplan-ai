// ─── 모두온 전역 스토어 (Context + Reducer + localStorage 영속) ──
// 소비자몰 → 리드 엔진 → 마이오피스 → 어드민 정산까지 단일 파이프라인의 단일 소스.
// 실서비스에서는 Supabase(Postgres+RLS+Realtime)로 대체 — 인터페이스를 동일하게 유지.
import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { buildSeed, SEED_VERSION } from './seed'
import { routeLead, calcSettlement, monthKey } from './engine'
import { CATEGORIES, REGIONS, unitBySigungu, canTransition } from './constants'

const KEY = 'moduon_db_v1'
const SESSION_KEY = 'moduon_session_v1'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const db = JSON.parse(raw)
      // localStorage는 신뢰할 수 없는 입력 — 핵심 컬렉션이 배열이 아니면 재시드 (흰 화면 사고 방지)
      const sane = ['leads', 'tenants', 'applications', 'products', 'auditLog'].every((k) => Array.isArray(db?.[k]))
      if (db.seedVersion === SEED_VERSION && sane) return db
    }
  } catch { /* 손상 시 재시드 */ }
  return buildSeed()
}

let idSeq = 100
const uid = (p) => `${p}${Date.now().toString(36)}${(idSeq++).toString(36)}`

// 데모 리드 자동 생성용 풀
const DEMO_NAMES = ['김도윤', '이서준', '박하은', '최지우', '정시우', '한예린', '오주원', '신아윤', '장민재', '윤채영']
const DEMO_WISH = ['지금 바로', '오전(9~12시)', '오후(12~18시)', '저녁(18~21시)']

// 권역 로드밸런싱 카운터 유지 — engine.routeLead가 leadCount 낮은 파트너를 우선하므로
// 배정/재배정 시 여기서 증감해야 분산이 실제로 동작한다.
const bumpLeadCount = (tenants, tid, delta) =>
  tenants.map((t) => (t.id === tid ? { ...t, leadCount: Math.max(0, (t.leadCount ?? 0) + delta) } : t))

function reducer(db, action) {
  const log = (entry) => [{ id: uid('G'), at: Date.now(), ...entry }, ...db.auditLog].slice(0, 200)

  switch (action.type) {
    case 'RESET':
      return buildSeed()

    // ── 리드 파이프라인 ──────────────────────────────
    case 'CREATE_LEAD': {
      const { name, phone, sigungu, cat, cats, wish, source, quote, ref } = action.payload
      // 귀속 우선순위: 파트너몰 유입(src) > 추천 링크(?ref=) > 권역 배정 (axion 흡수)
      const refSlug = source === 'main' && ref && db.tenants.some((t) => t.slug === ref && t.status === '활성') ? ref : null
      const routed = routeLead({ sourceSlug: source !== 'main' ? source : refSlug, sigungu }, db.tenants)
      const via = refSlug ? '추천 링크 유입' : routed.via
      const lead = {
        id: uid('L'), name, phone, sigungu, cat,
        cats: cats?.length ? cats : [cat], // 다중 카테고리 상담 — cat은 대표값으로 유지
        wish,
        status: '접수', tenantId: routed.tenantId, source: source || 'main', via,
        ref: ref || null,
        quote: quote || null, createdAt: Date.now(), read: false, memo: '',
        history: [{ at: Date.now(), to: '접수', by: 'system', note: via }],
      }
      return {
        ...db,
        leads: [lead, ...db.leads],
        tenants: routed.tenantId ? bumpLeadCount(db.tenants, routed.tenantId, +1) : db.tenants,
      }
    }
    case 'SPAWN_DEMO_LEAD': {
      const cats = CATEGORIES.map((c) => c.slug)
      const region = REGIONS[Math.floor(Math.random() * REGIONS.length)]
      const name = DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)]
      const phone = `010-${String(Math.floor(1000 + Math.random() * 9000))}-${String(Math.floor(1000 + Math.random() * 9000))}`
      const routed = routeLead({ sourceSlug: null, sigungu: region.sigungu }, db.tenants)
      const tenantId = action.tenantId ?? routed.tenantId
      const lead = {
        id: uid('L'), name, phone, sigungu: region.sigungu,
        cat: cats[Math.floor(Math.random() * cats.length)],
        wish: DEMO_WISH[Math.floor(Math.random() * DEMO_WISH.length)],
        status: '접수', tenantId, source: 'main', via: action.tenantId ? '데모 생성' : routed.via,
        createdAt: Date.now(), read: false, memo: '', demo: true,
        history: [{ at: Date.now(), to: '접수', by: 'system', note: '실시간 데모 리드' }],
      }
      // 데모 리드 상한 60건 — 최신 60개만 유지, 실 리드는 전량 보존 (localStorage 비대화 방지)
      let leads = [lead, ...db.leads]
      const demoLeads = leads.filter((l) => l.demo)
      if (demoLeads.length > 60) {
        const keep = new Set(demoLeads.slice(0, 60).map((l) => l.id)) // 배열은 최신순 — 앞 60개 유지
        leads = leads.filter((l) => !l.demo || keep.has(l.id))
      }
      return {
        ...db,
        leads,
        tenants: tenantId ? bumpLeadCount(db.tenants, tenantId, +1) : db.tenants,
        lastSpawn: Date.now(),
      }
    }
    case 'LEAD_STATUS': {
      const { id, to, by, note } = action.payload
      // 전이는 LEAD_TRANSITIONS 테이블만 경유 — 불법 전이는 조용히 무시 (kcare 상태머신 패턴)
      const lead = db.leads.find((l) => l.id === id)
      if (!lead || !canTransition(lead.status, to)) return db
      return {
        ...db,
        leads: db.leads.map((l) => l.id === id
          ? {
              ...l, status: to, read: true,
              cancelReason: to === '취소' ? note : l.cancelReason,
              // 완료 시각 기록 — 정산 월 귀속의 기준 (tenantSettlement 참조)
              completedAt: to === '완료' ? Date.now() : l.completedAt,
              history: [...l.history, { at: Date.now(), to, by, note }],
            }
          : l),
        auditLog: log({ actor: by, action: '리드 상태변경', target: id, detail: `${lead.status}→${to}${note ? ` · ${note}` : ''}` }),
      }
    }
    case 'LEAD_READ':
      return { ...db, leads: db.leads.map((l) => (l.id === action.id ? { ...l, read: true } : l)) }
    case 'LEAD_MEMO': {
      const lead = db.leads.find((l) => l.id === action.id)
      if (!lead || lead.memo === action.memo) return db // 변경 없는 blur 저장은 무시 (감사 로그 중복 방지)
      const t = db.tenants.find((x) => x.id === lead.tenantId)
      return {
        ...db,
        leads: db.leads.map((l) => (l.id === action.id ? { ...l, memo: action.memo } : l)),
        auditLog: log({ actor: t?.name ?? '파트너', action: '상담 메모 수정', target: action.id, detail: String(action.memo ?? '').slice(0, 40) }),
      }
    }
    case 'LEAD_REASSIGN': {
      const { id, tenantId, by } = action.payload
      const t = db.tenants.find((x) => x.id === tenantId)
      const prevId = db.leads.find((l) => l.id === id)?.tenantId ?? null
      // 로드밸런싱 카운터 이관: 이전 파트너 −1(하한 0), 새 파트너 +1
      let tenants = prevId ? bumpLeadCount(db.tenants, prevId, -1) : db.tenants
      if (tenantId) tenants = bumpLeadCount(tenants, tenantId, +1)
      return {
        ...db,
        tenants,
        leads: db.leads.map((l) => l.id === id
          ? { ...l, tenantId, via: '수동 재배정', history: [...l.history, { at: Date.now(), to: l.status, by, note: `수동 재배정 → ${t?.name ?? '본사'}` }] }
          : l),
        auditLog: log({ actor: by, action: '리드 재배정', target: id, detail: `→ ${t?.name ?? '본사'}` }),
      }
    }

    // ── 분양 신청 · 테넌트 ───────────────────────────
    case 'ADD_APPLICATION': {
      const app = { id: uid('AP'), status: '대기', appliedAt: Date.now(), ...action.payload }
      return { ...db, applications: [app, ...db.applications] }
    }
    case 'APPROVE_APPLICATION': {
      const app = db.applications.find((a) => a.id === action.id)
      if (!app) return db
      const tenant = {
        id: uid('T'), slug: app.wantSlug, name: app.wantName, owner: app.name,
        unit: unitBySigungu(app.sigungu) ?? 'SD1', sigungu: app.sigungu, status: '활성',
        brand: 'blue', greeting: `${app.wantName}에 오신 것을 환영합니다!`,
        cats: ['phone', 'internet', 'water', 'rental'], openedAt: Date.now(), monthlySales: 0, leadCount: 0, phone: app.phone,
      }
      return {
        ...db,
        applications: db.applications.map((a) => (a.id === action.id ? { ...a, status: '승인' } : a)),
        tenants: [...db.tenants, tenant],
        auditLog: log({ actor: '본사 관리자', action: '분양 승인', target: `${app.wantName}(${app.wantSlug})`, detail: '심사 통과 → 몰 개설 안내 발송' }),
      }
    }
    case 'REJECT_APPLICATION': {
      const app = db.applications.find((a) => a.id === action.id)
      return {
        ...db,
        applications: db.applications.map((a) => (a.id === action.id ? { ...a, status: '반려', rejectReason: action.reason } : a)),
        auditLog: log({ actor: '본사 관리자', action: '분양 반려', target: app?.wantName ?? action.id, detail: action.reason }),
      }
    }
    case 'TENANT_STATUS': {
      const t = db.tenants.find((x) => x.id === action.id)
      return {
        ...db,
        tenants: db.tenants.map((x) => (x.id === action.id ? { ...x, status: action.status } : x)),
        auditLog: log({ actor: '본사 관리자', action: `몰 ${action.status === '활성' ? '재개' : '정지'}`, target: t?.name ?? action.id, detail: '' }),
      }
    }
    case 'TENANT_BRANDING': {
      const { id, patch } = action.payload
      const t = db.tenants.find((x) => x.id === id)
      // 실제로 값이 바뀐 키만 감사 대상 (cats 배열 비교 위해 JSON 비교)
      const changed = t ? Object.keys(patch).filter((k) => JSON.stringify(t[k]) !== JSON.stringify(patch[k])) : []
      return {
        ...db,
        tenants: db.tenants.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        auditLog: changed.length ? log({ actor: t?.owner ?? '파트너', action: '몰 브랜딩 변경', target: t?.name ?? id, detail: changed.join(', ') }) : db.auditLog,
      }
    }

    case 'PRODUCT_UPDATE': {
      const { id, patch } = action.payload
      const p = db.products.find((x) => x.id === id)
      return {
        ...db,
        products: db.products.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        auditLog: log({ actor: '본사 관리자', action: '상품 정책 변경', target: p?.name ?? id, detail: Object.entries(patch).map(([k, v]) => `${k}=${Number(v).toLocaleString()}`).join(', ') }),
      }
    }

    // ── 정책 ─────────────────────────────────────────
    case 'UPDATE_POLICIES': {
      const { joinFee, monthlyFee, feeRate, note } = action.payload
      const version = db.policies.version + 1
      return {
        ...db,
        policies: {
          joinFee, monthlyFee, feeRate, version, appliedAt: Date.now(),
          history: [...db.policies.history, { version, joinFee, monthlyFee, feeRate, appliedAt: Date.now(), by: '본사 관리자', note }],
        },
        auditLog: log({ actor: '본사 관리자', action: '정책 변경', target: `분양 정책 v${version}`, detail: `분양비 ${joinFee.toLocaleString()} / 이용료 ${monthlyFee.toLocaleString()} / 수수료 ${(feeRate * 100).toFixed(0)}%` }),
      }
    }

    // ── 기타 ─────────────────────────────────────────
    case 'AI_EVENT':
      return { ...db, aiEvents: [{ id: uid('AI'), at: Date.now(), ...action.payload }, ...db.aiEvents].slice(0, 100) }
    case 'AUDIT':
      return { ...db, auditLog: log(action.payload) }
    case 'DEMO_FEED':
      return { ...db, demoFeed: action.on }
    case 'SETTLE_CONFIRM':
      return {
        ...db,
        // 확정 상태를 기간 키로 영속 — 새로고침에도 유지. 구버전 DB엔 필드가 없을 수 있어 ?? {}
        settleConfirms: { ...(db.settleConfirms ?? {}), [action.period]: { at: Date.now(), detail: action.detail } },
        auditLog: log({ actor: '본사 관리자', action: '지급 확정', target: action.period, detail: action.detail }),
      }
    default:
      return db
  }
}

const StoreCtx = createContext(null)

export function StoreProvider({ children }) {
  const [db, dispatch] = useReducer(reducer, null, load)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* quota */ }
  }, [db])

  const value = useMemo(() => ({ db, dispatch }), [db])
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

// ─── 세션(데모 로그인) ───────────────────────────────
export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) ?? null } catch { return null }
}
export function setSession(s) {
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s))
  else localStorage.removeItem(SESSION_KEY)
}

// ─── 파생 셀렉터 ─────────────────────────────────────
export function tenantLeads(db, tenantId) {
  return db.leads.filter((l) => l.tenantId === tenantId)
}

// 완료 리드 → 카테고리별 추정 매출(데모 단가) — 정산·통계 공용
const CAT_AMOUNT = { phone: 1450000, internet: 990000, move: 1200000, water: 1188000, rental: 890000, insurance: 600000, appliance: 1890000, etc: 450000 }
export const leadAmount = (cat) => CAT_AMOUNT[cat] ?? 500000

export function tenantSettlement(db, tenantId) {
  const t = db.tenants.find((x) => x.id === tenantId)
  // 이중계상 방지: monthlySales는 시드 기준치(몰 자체 매출), 리드 완료분은 leadGross로만 가산.
  // 월 귀속은 완료 시각(completedAt) 기준 — 리드를 완료 처리하는 즉시 이번 달 정산에 반영된다.
  const done = tenantLeads(db, tenantId).filter((l) => l.status === '완료' && monthKey(l.completedAt ?? l.createdAt) === monthKey())
  const leadGross = done.reduce((s, l) => s + leadAmount(l.cat), 0)
  const gross = (t?.monthlySales ?? 0) + leadGross
  const s = calcSettlement(gross, db.policies)
  const pending = tenantLeads(db, tenantId).filter((l) => ['상담완료', '개통대기'].includes(l.status))
  const expected = pending.reduce((sum, l) => sum + leadAmount(l.cat) * db.policies.feeRate, 0)
  return { ...s, doneCount: done.length, pendingCount: pending.length, expected, lines: done.map((l) => ({ id: l.id, name: l.name, cat: l.cat, amount: leadAmount(l.cat), fee: Math.round(leadAmount(l.cat) * db.policies.feeRate), at: l.completedAt ?? l.createdAt })) }
}

export function adminStats(db) {
  const active = db.tenants.filter((t) => t.status === '활성')
  const totalSales = db.tenants.reduce((s, t) => s + (t.monthlySales ?? 0), 0)
  const leadsToday = db.leads.filter((l) => Date.now() - l.createdAt < 86400000)
  const done = db.leads.filter((l) => l.status === '완료')
  const feeIncome = Math.round(totalSales * db.policies.feeRate)
  const monthlyFees = active.length * db.policies.monthlyFee
  const pendingApps = db.applications.filter((a) => a.status === '대기')
  return { active, totalSales, leadsToday, done, feeIncome, monthlyFees, pendingApps }
}
