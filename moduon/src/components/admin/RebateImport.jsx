// ─── 리베이트 단가표 — 지금 쓰는 표 · 업로드(자동 인식 → 확인 → 반영) · 이력 ─────────────────
// 운영팀 요청(2026-10-01): 양식이 제각각인 엑셀을 그대로 올리면 단말 × 요금구간 × 가입유형 리베이트만 뽑아
// 기존 DB 의 같은 칸을 갱신한다. 인식은 lib/rebateImport.js, 저장 구조(집주소)는 lib/ratecard.js.
// 사람이 확인할 것(통신사·적용일·구간 하한·단말 매핑)은 반영 전에 화면에서 고칠 수 있고, 고친 매핑은 기억한다.
// 한 시트에 표가 여럿(5G·LTE)이면 표마다, 공통/선약 칸이 나뉘면 두 칸으로 보여 준다.
import { useMemo, useState } from 'react'
import { useStore } from '../../lib/store'
import { won, fmtDate } from '../../lib/engine'
import { PHONE_DEVICES, PHONE_PLANS } from '../../lib/phones'
import { activeRebateCard, pendingRebateCards, rebateDetail, sectionsOf, REBATE_JOINS, REBATE_SEED, ymd } from '../../lib/ratecard'
import { importRebateWorkbook, toCard } from '../../lib/rebateImport'
import { Card, Btn, binputCls, useToast } from '../ui'

const CARRIERS = ['KT', 'SKT', 'LG U+']
const JOIN_SHORT = { new: '010', mnp: 'MNP', chg: '기변' }
const METHODS = [['support', '공통'], ['select', '선약']]
const short = (id) => PHONE_DEVICES.find((d) => d.id === id)?.short ?? id
const man = (v) => (v == null ? 'X' : v / 10000)
const flatLabel = (s) => String(s ?? '').replace(/\s+/g, '')
const isSplit = (card) => sectionsOf(card).some((s) => s.method)

// 카드 한 장을 시트처럼 — 표(섹션)마다: 행 = 단말 표기, 열 = 요금구간 × 가입유형(× 공통/선약), 만원
// compare 를 주면 그 카드와 다른 칸을 강조한다(같은 시트 표기 · 같은 구간 하한 · 같은 방식끼리, 없던 행은 '새 행')
export function RebateCardTable({ card, compare = null, t = 'rate-card-table' }) {
  const cmpGroups = compare ? sectionsOf(compare).flatMap((s) => s.groups.map((g) => ({ s, g }))) : []
  const before = (g, tier, ji, m) => {
    if (!compare) return undefined
    const hit = cmpGroups.find((x) => flatLabel(x.g.label) === flatLabel(g.label))
    if (!hit) return 'new'
    const ct = hit.s.tiers.find((x) => x.min != null && x.min === tier.min)
    const row = ct ? hit.g.values?.[ct.key] : undefined
    if (row === undefined) return undefined
    const arr = Array.isArray(row) ? row : (row[m ?? 'support'] ?? row.support)
    return arr?.[ji]
  }
  const secs = sectionsOf(card)
  return (
    <div className="flex flex-col gap-4" data-t={t}>
      {secs.map((sec, si) => {
        const ms = sec.method ? METHODS : [[null, '']]
        return (
          <div key={sec.key} data-t="rate-card-section" data-net={sec.net ?? ''}>
            {secs.length > 1 && <div className="mb-1 text-[12px] font-extrabold text-bink">표 {si + 1}{sec.label ? ` · ${sec.label}` : ''}{sec.method ? ' · 공통/선약 구분' : ''}</div>}
            <div className="overflow-x-auto">
              <table className={`w-full text-[12px] ${sec.method ? 'min-w-[1240px]' : 'min-w-[920px]'}`}>
                <thead>
                  <tr className="border-b border-brow text-[11px] text-bmuted">
                    <th rowSpan={sec.method ? 3 : 2} className="px-2 py-2 text-left align-bottom font-semibold">단말(시트 표기)</th>
                    {sec.tiers.map((tier) => (
                      <th key={tier.key} colSpan={card.joins.length * ms.length} className="border-l border-brow px-2 py-2 text-center font-semibold">
                        {tier.label}
                        <span className="block text-[10.5px] font-medium text-bfaint">{tier.min != null ? `월 ${won(tier.min)} 이상` : '하한 미정'}</span>
                      </th>
                    ))}
                  </tr>
                  <tr className="border-b border-brow text-[10.5px] text-bfaint">
                    {sec.tiers.flatMap((tier) => card.joins.map((j, i) => (
                      <th key={`${tier.key}${j}`} colSpan={ms.length} className={`px-1.5 py-1.5 ${sec.method ? 'text-center' : 'text-right'} font-semibold ${i === 0 ? 'border-l border-brow' : ''}`}>{JOIN_SHORT[j]}</th>
                    )))}
                  </tr>
                  {sec.method && (
                    <tr className="border-b border-brow text-[10px] text-bfaint">
                      {sec.tiers.flatMap((tier) => card.joins.flatMap((j, i) => ms.map(([m, ml], mi) => (
                        <th key={`${tier.key}${j}${m}`} className={`px-1 py-1 text-right font-semibold ${i === 0 && mi === 0 ? 'border-l border-brow' : ''}`}>{ml}</th>
                      ))))}
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-brow">
                  {sec.groups.map((g) => (
                    <tr key={g.key} data-t="rate-card-row" data-row={g.key} className={g.fallback ? 'bg-warn/[0.06]' : g.nameless ? 'bg-danger/[0.05]' : ''}>
                      <td className="px-2 py-1.5">
                        <div className="font-bold text-bink">
                          {g.label}
                          {compare && before(g, sec.tiers[0], 0, null) === 'new' && <span className="ml-1.5 rounded bg-primary/10 px-1.5 text-[10px] font-bold text-primary-text" data-t="rate-cell-newrow">새 행</span>}
                        </div>
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {g.code && <span className="rounded bg-brow px-1.5 text-[10px] font-semibold text-bmuted">{g.code}</span>}
                          {g.storage && <span className="rounded bg-primary/10 px-1.5 text-[10px] font-bold text-primary-text">{g.storage}만</span>}
                          {g.fallback && <span className="rounded bg-warn/15 px-1.5 text-[10px] font-bold text-warn">대체 행 · {g.fallback}</span>}
                          {(g.devices ?? []).map((id) => <span key={id} className="rounded bg-ok/10 px-1.5 text-[10px] font-bold text-ok">{short(id)}</span>)}
                        </div>
                      </td>
                      {sec.tiers.flatMap((tier) => card.joins.flatMap((j, ji) => ms.map(([m], mi) => {
                        const row = g.values?.[tier.key]
                        const v = row == null ? null : Array.isArray(row) ? row[ji] : (row[m] ?? row.support)?.[ji]
                        const b = before(g, tier, ji, m)
                        const changed = b !== undefined && b !== 'new' && b !== v
                        return (
                          <td key={`${tier.key}${j}${m}`} title={changed ? `지금 표: ${man(b)}` : undefined} data-changed={changed ? '1' : undefined}
                            className={`tnum px-1.5 py-1.5 text-right ${changed ? 'bg-ok/15 font-extrabold text-bink' : v == null || v === 0 ? 'text-bfaint' : v < 0 ? 'font-bold text-danger' : 'text-bbody'} ${ji === 0 && mi === 0 ? 'border-l border-brow' : ''}`}>
                            {man(v)}{changed && <span className="block text-[9.5px] font-semibold text-bfaint">{man(b)}→</span>}
                          </td>
                        )
                      })))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// 지금 쓰는 표 + 예약 + 업로드 이력 + 업로드 패널
export default function RebateSection() {
  const { db, dispatch } = useStore()
  const toast = useToast()
  const active = activeRebateCard('KT') ?? REBATE_SEED
  const pending = pendingRebateCards('KT')
  const uploaded = db.policies.rebateCards ?? []
  const today = ymd()
  const others = CARRIERS.filter((c) => c !== 'KT').map((c) => [c, activeRebateCard(c)]).filter(([, x]) => x)

  return (
    <Card track="b" className="mt-4 p-5" data-t="rate-card">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15.5px] font-extrabold text-bink">
            {active.name} <span className="text-[12.5px] font-semibold text-bmuted">· {active.effectiveFrom}~ · {active.carrier}</span>
            <span className={`ml-2 rounded px-1.5 py-0.5 text-[10.5px] font-bold ${active.source?.seed ? 'bg-brow text-bmuted' : 'bg-ok/15 text-ok'}`} data-t="rate-card-source">
              {active.source?.seed ? '기본값' : `업로드 · ${active.source?.file ?? ''}`}
            </span>
          </h2>
          <p className="mt-1 text-[12.5px] text-bmuted">
            <b className="text-bink">사업자 R/B 전용</b>입니다 — 고객 가격은 위 가격표가 정합니다(가격표에 없는 단말의 셀프개통 지원금만 이 표 − 마진).
            요금제는 이름이 아니라 <b className="text-bink">월정액이 몇 원 이상인지(구간 하한)</b>로 구간을 찾습니다.
          </p>
        </div>
        <span className="rounded-full bg-tint px-2.5 py-0.5 text-[11px] font-bold text-primary-text">단위: 만원 · X = 취급 안 함</span>
      </div>

      {pending.length > 0 && (
        <div className="mt-3 rounded-field bg-tint px-3.5 py-2.5 text-[12px] text-primary-text" data-t="rate-card-pending">
          예약: {pending.map((c) => `${c.name} — ${c.effectiveFrom}부터 자동 적용`).join(' · ')}
        </div>
      )}
      {others.length > 0 && (
        <div className="mt-3 rounded-field bg-bbg px-3.5 py-2.5 text-[12px] text-bbody" data-t="rate-card-others">
          다른 통신사: {others.map(([c, x]) => `${c} — ${x.name} (${x.effectiveFrom}~)`).join(' · ')} · 그 통신사 견적의 셀프개통 지원금에 쓰입니다
        </div>
      )}

      <div className="mt-3.5"><RebateCardTable card={active} /></div>

      <div className="mt-4 rounded-card bg-bbg px-4 py-3">
        <div className="text-[12.5px] font-extrabold text-bink">판매 단말 → 리베이트 행 (KT)</div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5" data-t="rate-card-map">
          {PHONE_DEVICES.map((dev) => {
            const r = rebateDetail({ deviceId: dev.id, planId: 'choice110', join: 'mnp' })
            return (
              <span key={dev.id} data-t="rate-map-item" data-listed={r.listed ? '1' : '0'} className="text-[12px]">
                <b className="font-bold text-bbody">{dev.short}</b>
                <span className="mx-1 text-bfaint">→</span>
                <span className={r.listed ? 'font-semibold text-ok' : 'font-semibold text-warn'}>{r.device?.label ?? '없음(데모 단가)'}</span>
              </span>
            )
          })}
        </div>
        <p className="mt-2 text-[11px] leading-4 text-bfaint">
          '류'·'(전체)'는 시리즈 전체(예: 갤럭시 S26류 = S26·S26 울트라), '(Air제외)'는 그 단말을 뺍니다. 행에 없는 5G 단말은 <b className="text-warn">그외 5G</b> 행을 씁니다.
          용량별 행(예: 갤럭시S26 512G)이 있으면 그 용량에만 그 행을 씁니다.
        </p>
      </div>

      {active.notes?.length > 0 && (
        <ul className="mt-3 space-y-1 text-[11px] leading-[1.6] text-bfaint">
          {active.notes.map((n) => <li key={n}>· {n}</li>)}
        </ul>
      )}

      {uploaded.length > 0 && (
        <div className="mt-4" data-t="rebate-history">
          <div className="text-[12.5px] font-extrabold text-bink">업로드 이력 <span className="font-semibold text-bfaint">(최신 먼저 · 지우면 그 전 표로 돌아갑니다)</span></div>
          <ul className="mt-1.5 divide-y divide-brow rounded-field border border-bline">
            {uploaded.map((c) => {
              const state = c.id === activeRebateCard(c.carrier)?.id ? '사용 중' : c.effectiveFrom > today ? '예약' : '이전 표'
              return (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-[12px]" data-t="rebate-history-row" data-carrier={c.carrier}>
                  <span className="min-w-0">
                    <span className={`mr-1.5 rounded px-1.5 py-0.5 text-[10.5px] font-bold ${state === '사용 중' ? 'bg-ok/15 text-ok' : state === '예약' ? 'bg-tint text-primary-text' : 'bg-brow text-bmuted'}`}>{state}</span>
                    <b className="text-bink">{c.name}</b> · {c.effectiveFrom}~ · {c.source?.file}{c.source?.sheet ? ` 「${c.source.sheet}」` : ''} <span className="text-bfaint">({fmtDate(c.source?.importedAt)})</span>
                  </span>
                  <button type="button" data-t="rebate-remove" onClick={() => { dispatch({ type: 'REBATE_REMOVE', id: c.id }); toast('업로드한 표를 지웠어요 — 그 전 표로 계산합니다') }}
                    className="h-8 rounded-field px-2.5 text-[12px] font-bold text-danger hover:bg-danger/10">지우기</button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <RebateImport />
    </Card>
  )
}

const allTiers = (x) => x.sections.flatMap((s) => s.tiers)
const allGroups = (x) => x.sections.flatMap((s) => s.groups.map((g) => ({ ...g, section: s })))

function RebateImport() {
  const { db, dispatch } = useStore()
  const toast = useToast()
  const [file, setFile] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [tables, setTables] = useState([]) // 시트별 인식 결과 + 사람이 고친 값

  const onFile = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = '' // 같은 파일을 다시 골라도 onChange 가 오게
    if (!f) return
    setBusy(true); setError(''); setTables([]); setFile(f.name)
    try {
      const r = await importRebateWorkbook(await f.arrayBuffer(), { fileName: f.name, aliases: db.policies.rebateAliases ?? {} })
      if (!r.tables.filter((x) => !x.empty).length) setError(`리베이트 표를 찾지 못했습니다 — 시트 ${r.sheets.length}개(${r.sheets.join(', ')})에 010·MNP·기변 머리 행이 없습니다`)
      setTables(r.tables.filter((x) => !x.empty).map((x) => ({
        x, carrier: x.carrier ?? '', code: x.code ?? '', effectiveFrom: x.effectiveFrom ?? '',
        tierMins: Object.fromEntries(allTiers(x).map((t) => [t.key, t.min ?? ''])),
        mapping: Object.fromEntries(allGroups(x).map((g) => [g.key, g.devices])),
        include: !x.unreadable, // 이름을 거의 못 읽은 시트는 기본으로 뺀다
      })))
    } catch (err) {
      setError(err.message || String(err))
    } finally { setBusy(false) }
  }

  const patch = (i, p) => setTables((ts) => ts.map((t, k) => (k === i ? { ...t, ...p } : t)))
  // 한 단말은 (같은 용량 조건의) 한 행에만 — 다른 행에 붙이면 원래 행에서 떨어진다
  const assign = (i, groupKey, id, on) => setTables((ts) => ts.map((t, k) => {
    if (k !== i) return t
    const st = allGroups(t.x).find((g) => g.key === groupKey)?.storage ?? null
    const same = new Set(allGroups(t.x).filter((g) => (g.storage ?? null) === st).map((g) => g.key))
    const m = Object.fromEntries(Object.entries(t.mapping).map(([gk, ids]) => [gk, same.has(gk) ? ids.filter((x) => x !== id) : ids]))
    if (on) m[groupKey] = [...m[groupKey], id]
    return { ...t, mapping: m }
  }))

  const ready = tables.filter((t) => t.include)
  const problems = (t) => [
    !CARRIERS.includes(t.carrier) && '통신사',
    !/^\d{4}-\d{2}-\d{2}$/.test(t.effectiveFrom) && '적용일',
    allTiers(t.x).some((tier) => { const v = t.tierMins[tier.key]; return v === '' || v == null || !(Number(v) >= 0) }) && '구간 하한',
  ].filter(Boolean)
  const blocked = ready.some((t) => problems(t).length)

  const apply = () => {
    const now = Date.now()
    const cards = ready.map((t, i) => toCard(t.x, {
      fileName: file, carrier: t.carrier, code: t.code.trim() || null, effectiveFrom: t.effectiveFrom, now: now + i,
      tierMins: Object.fromEntries(Object.entries(t.tierMins).map(([k, v]) => [k, Number(v)])),
      mapping: t.mapping,
    }))
    // 사람이 바꾼 매핑만 기억 — 다음에 같은 표기가 오면 그대로 쓴다
    const aliases = {}
    for (const t of ready) for (const g of allGroups(t.x)) {
      const a = [...g.devices].sort().join(','), b = [...t.mapping[g.key]].sort().join(',')
      if (a !== b && !g.nameless) aliases[`${t.carrier}|${g.label}`] = t.mapping[g.key]
    }
    dispatch({ type: 'REBATE_IMPORT', cards, aliases, file })
    toast(`리베이트 표 ${cards.length}장 반영 — 적용일부터 R/B·셀프개통 지원금이 이 값으로 계산됩니다`)
    setTables([]); setFile('')
  }

  return (
    <div className="mt-5 rounded-card border-2 border-dashed border-bline p-4" data-t="rebate-import">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[14.5px] font-extrabold text-bink">단가표 업로드 — 리베이트 자동 반영</h3>
          <p className="mt-0.5 text-[12px] leading-[1.5] text-bmuted">
            양식은 그대로 올리세요. 010·MNP·기변 머리 행을 찾아 <b className="text-bink">단말 × 요금구간 × 가입유형</b>(공통/선약 구분이 있으면 그것까지) 금액만 읽고,
            반영 전에 인식 결과와 바뀌는 R/B 를 보여 드립니다. 여러 시트(통신사별)·한 시트의 여러 표(5G·LTE)도 한 번에 읽습니다.
          </p>
        </div>
        {/* 버튼 모양 위에 투명한 파일 입력을 덮는다 — 누르면 바로 파일 창, 키보드 초점도 입력에 간다 */}
        <label className="relative inline-flex h-10 cursor-pointer items-center rounded-btn bg-bink px-4 text-[13px] font-bold text-white focus-within:ring-2 focus-within:ring-primary/40 hover:bg-bink/90">
          {busy ? '읽는 중…' : '엑셀 파일 선택 (.xlsx)'}
          <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" aria-label="리베이트 단가표 엑셀 파일 선택"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={onFile} data-t="rebate-file" disabled={busy} />
        </label>
      </div>
      {error && <p className="mt-3 rounded-field bg-danger/10 px-3 py-2 text-[12.5px] font-semibold text-danger" data-t="rebate-error">{error}</p>}

      {tables.map((t, i) => (
        <Preview key={`${t.x.sheet}${i}`} t={t} i={i} patch={patch} assign={assign} problems={problems(t)} />
      ))}

      {tables.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          {blocked && <span className="text-[12px] font-semibold text-warn" data-t="rebate-blocked">정해 줄 값이 남았습니다 — {[...new Set(ready.flatMap(problems))].join(' · ')}</span>}
          <Btn variant="ghost" size="sm" onClick={() => { setTables([]); setFile('') }}>취소</Btn>
          <Btn size="sm" onClick={apply} disabled={!ready.length || blocked} data-t="rebate-apply">{ready.length}개 표 반영하기</Btn>
        </div>
      )}
    </div>
  )
}

function Preview({ t, i, patch, assign, problems }) {
  const { x } = t
  // 반영하면 우리 단말 R/B 가 어떻게 바뀌는지 — 우리 요금제 × 가입유형(× 공통/선약) 전수 비교
  const draft = useMemo(() => toCard(x, {
    carrier: t.carrier || 'KT', effectiveFrom: t.effectiveFrom || '2000-01-01', mapping: t.mapping,
    tierMins: Object.fromEntries(Object.entries(t.tierMins).map(([k, v]) => [k, v === '' ? null : Number(v)])),
  }), [x, t.carrier, t.effectiveFrom, t.mapping, t.tierMins])
  const current = activeRebateCard(t.carrier || 'KT') ?? activeRebateCard('KT')
  const diff = useMemo(() => {
    const ms = isSplit(draft) || isSplit(current) ? ['support', 'select'] : ['support']
    const rows = []
    for (const d of PHONE_DEVICES) for (const p of PHONE_PLANS) for (const j of REBATE_JOINS) for (const m of ms) {
      const before = rebateDetail({ deviceId: d.id, planId: p.id, join: j.key, method: m, carrier: t.carrier || 'KT' })
      const after = rebateDetail({ deviceId: d.id, planId: p.id, join: j.key, method: m, card: draft })
      if (before.rebate !== after.rebate || before.covered !== after.covered) rows.push({ d, p, j, m, before, after, key: ms.length > 1 ? `${d.id}|${p.id}|${j.key}|${m}` : `${d.id}|${p.id}|${j.key}` })
    }
    return rows
  }, [draft, current, t.carrier])
  const warnN = x.issues.filter((s) => s.level === 'warn').length
  const multi = x.sections.length > 1
  const tierCount = allTiers(x).length

  return (
    <section className={`mt-4 rounded-card bg-white p-4 shadow-card ${t.include ? '' : 'opacity-80'}`} data-t="rebate-preview" data-sheet={x.sheet}>
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-1.5 text-[13px] font-extrabold text-bink">
          <input type="checkbox" checked={t.include} onChange={(e) => patch(i, { include: e.target.checked })} className="h-4 w-4" data-t="rebate-include" />
          시트 「{x.sheet}」 반영
        </label>
        <span className="text-[11.5px] text-bmuted" data-t="rebate-stats">
          {x.stats.rows}행 × {tierCount}구간{multi ? ` · 표 ${x.sections.length}개` : ''}{x.sections.some((s) => s.method) ? ' · 공통/선약' : ''} · 금액 {x.stats.cells}칸 · 단위 {x.unit === 10000 ? '만원' : x.unit === 1000 ? '천원' : '원'}({x.unitSource === 'label' ? '시트 표기' : '크기로 추정'})
        </span>
        {warnN > 0 && <span className="rounded bg-warn/15 px-1.5 py-0.5 text-[10.5px] font-bold text-warn">확인 {warnN}건</span>}
        {x.unreadable && <span className="rounded bg-danger/10 px-1.5 py-0.5 text-[10.5px] font-bold text-danger" data-t="rebate-unreadable">단말 이름을 거의 못 읽어 기본으로 반영에서 뺐습니다</span>}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <label className="min-w-0 text-[11.5px] font-bold text-bmuted">통신사
          <select value={t.carrier} onChange={(e) => patch(i, { carrier: e.target.value })} data-t="rebate-carrier" className={`${binputCls} mt-1`}>
            <option value="">선택</option>
            {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="min-w-0 text-[11.5px] font-bold text-bmuted">정책 차수(표기)
          <input value={t.code} onChange={(e) => patch(i, { code: e.target.value })} placeholder="예: K1" data-t="rebate-code" className={`${binputCls} mt-1`} />
        </label>
        <label className="min-w-0 text-[11.5px] font-bold text-bmuted">적용일
          <input type="date" value={t.effectiveFrom} onChange={(e) => patch(i, { effectiveFrom: e.target.value })} data-t="rebate-date" className={`${binputCls} mt-1`} />
        </label>
      </div>

      {x.issues.length > 0 && (
        <ul className="mt-3 space-y-1 text-[12px]" data-t="rebate-issues">
          {x.issues.map((s) => (
            <li key={s.msg} className={s.level === 'warn' ? 'font-semibold text-warn' : 'text-bmuted'} data-level={s.level}>{s.level === 'warn' ? '⚠ ' : 'ⓘ '}{s.msg}</li>
          ))}
        </ul>
      )}

      <div className="mt-3">
        <div className="text-[12px] font-extrabold text-bink">요금구간 — 월정액이 이 금액 이상이면 그 구간</div>
        {x.sections.map((sec, si) => (
          <div key={sec.key} className="mt-1.5">
            {multi && <div className="mb-1 text-[11px] font-bold text-bmuted">표 {si + 1}{sec.label ? ` · ${sec.label}` : ''}</div>}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sec.tiers.map((tier) => (
                <label key={tier.key} className="flex min-w-0 items-center gap-2 rounded-field bg-bbg px-2.5 py-1.5 text-[12px] text-bbody">
                  <span className="min-w-0 flex-1 truncate" title={tier.label}>{tier.label}</span>
                  <input type="number" step="1000" value={t.tierMins[tier.key]} data-t="rebate-tier-min" aria-label={`${tier.label} 하한 월정액`}
                    onChange={(e) => patch(i, { tierMins: { ...t.tierMins, [tier.key]: e.target.value } })}
                    className="h-9 w-24 min-w-0 rounded-field border border-bline bg-white px-2 text-right text-[12.5px]" />
                  <span className="text-bfaint">원↑</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <div className="text-[12px] font-extrabold text-bink">단말 매핑 — 시트 표기 → 우리 판매 단말 <span className="font-semibold text-bfaint">(칩을 누르면 빠지고, 고친 매핑은 다음 업로드에 기억됩니다)</span></div>
        <div className="mt-1.5 divide-y divide-brow rounded-field border border-bline" data-t="rebate-mapping">
          {x.sections.map((sec, si) => sec.groups.map((g) => {
            const ids = t.mapping[g.key] ?? []
            const free = PHONE_DEVICES.filter((d) => !ids.includes(d.id))
            return (
              <div key={g.key} className="flex flex-wrap items-center gap-2 px-2.5 py-1.5 text-[12px]" data-t="rebate-map-row" data-label={g.label}>
                <span className={`min-w-[132px] font-bold ${g.nameless ? 'text-danger' : 'text-bink'}`}>{multi ? <span className="mr-1 text-[10.5px] font-semibold text-bfaint">표{si + 1}</span> : null}{g.label}</span>
                {g.code && <span className="rounded bg-brow px-1.5 text-[10px] font-semibold text-bmuted">{g.code}</span>}
                {g.storage && <span className="rounded bg-primary/10 px-1.5 text-[10px] font-bold text-primary-text">{g.storage}만</span>}
                {g.fallback && <span className="rounded bg-warn/15 px-1.5 text-[10px] font-bold text-warn">대체 행({g.fallback})</span>}
                {ids.map((id) => (
                  <button key={id} type="button" onClick={() => assign(i, g.key, id, false)} data-t="rebate-map-chip" data-id={id}
                    className="inline-flex h-7 items-center gap-1 rounded-full bg-ok/10 px-2.5 text-[11.5px] font-bold text-ok hover:bg-danger/10 hover:text-danger" title="빼기">
                    {short(id)} <span aria-hidden>×</span>
                  </button>
                ))}
                <select value="" onChange={(e) => e.target.value && assign(i, g.key, e.target.value, true)} aria-label={`${g.label}에 우리 단말 붙이기`}
                  className="h-7 rounded-full border border-bline bg-white px-2 text-[11.5px] text-bmuted">
                  <option value="">+ 단말</option>
                  {free.map((d) => <option key={d.id} value={d.id}>{d.short}</option>)}
                </select>
              </div>
            )
          }))}
        </div>
      </div>

      <div className="mt-3">
        <div className="text-[12px] font-extrabold text-bink">읽은 표(만원) <span className="font-semibold text-bfaint">— 초록 칸 = 지금 쓰는 표와 다른 값 · 빨간 숫자 = 음수</span></div>
        <div className="mt-1.5"><RebateCardTable card={draft} compare={current} t="rebate-preview-table" /></div>
      </div>

      <div className="mt-3" data-t="rebate-diff">
        <div className="text-[12px] font-extrabold text-bink">반영하면 바뀌는 R/B <span className="font-semibold text-bfaint">— 우리 판매 단말 × 요금제 × 가입유형{isSplit(draft) ? ' × 공통/선약' : ''} ({t.carrier || 'KT'} 기준)</span></div>
        {diff.length === 0
          ? <p className="mt-1 text-[12px] text-bmuted" data-t="rebate-diff-none">지금 쓰는 표와 같습니다(바뀌는 값 없음).</p>
          : (
            <div className="mt-1.5 max-h-[360px] overflow-auto">
              <table className="w-full min-w-[560px] text-[12px]">
                <tbody className="divide-y divide-brow">
                  {diff.map(({ d, p, j, m, before, after, key }) => (
                    <tr key={key} data-t="rebate-diff-row" data-key={key}>
                      <td className="px-2 py-1.5 font-bold text-bink">{d.short}</td>
                      <td className="px-2 py-1.5 text-bbody">{p.name} · {j.label}{key.split('|').length > 3 ? ` · ${m === 'select' ? '선약' : '공통'}` : ''}</td>
                      <td className="tnum px-2 py-1.5 text-right text-bfaint">{before.covered ? won(before.rebate) : '없음'}</td>
                      <td className="px-1 text-bfaint">→</td>
                      <td className={`tnum px-2 py-1.5 text-right font-extrabold ${after.rebate > before.rebate ? 'text-ok' : 'text-danger'}`}>{after.covered ? won(after.rebate) : '없음'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
      {problems.length > 0 && t.include && <p className="mt-2 text-[12px] font-semibold text-warn">이 시트는 {problems.join(' · ')}을(를) 정해야 반영할 수 있습니다.</p>}
    </section>
  )
}
