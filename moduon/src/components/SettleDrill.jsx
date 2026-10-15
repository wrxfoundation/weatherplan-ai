// ─── 정산 드릴다운 — 금액을 누르면 한 단계 아래가 펼쳐진다 ───────────────
// 총판이면 대리점까지, 대리점이면 셀러까지. 그 아래는 *** 로 내려오고 더 못 편다.
// 마스킹은 settle.maskTree 가 이미 걸어 놓은 상태로 들어온다 — 여기서는 판단하지 않고 그린다.
import { useState } from 'react'
import { won } from '../lib/engine'
import { MASK } from '../lib/settle'

const KIND_LABEL = { hq: '본사', distributor: '총판', agency: '대리점', seller: '셀러' }

function Row({ node, label, depth }) {
  const [open, setOpen] = useState(false)
  const kids = node.children ?? []
  const canOpen = kids.length > 0 && !node.masked
  const pad = { paddingLeft: `${12 + depth * 16}px` }

  return (
    <>
      <div
        data-t="settle-row"
        data-kind={node.kind}
        data-masked={node.masked ? '1' : '0'}
        data-open={open ? '1' : '0'}
        data-depth={depth}
        data-amount={node.amount}
        data-opex={node.opex ?? 0}
        className={`flex items-center gap-2 border-b border-brow ${depth === 0 ? 'bg-brow/40' : ''}`}
      >
        <button
          type="button"
          onClick={() => canOpen && setOpen((v) => !v)}
          disabled={!canOpen}
          aria-expanded={canOpen ? open : undefined}
          aria-label={canOpen ? `${node.name} 상세 ${open ? '접기' : '펼치기'}` : undefined}
          className={`flex flex-1 items-center gap-2 py-3 pr-3 text-left ${canOpen ? 'cursor-pointer hover:bg-brow/60' : 'cursor-default'}`}
          style={pad}
        >
          <span className={`w-3 shrink-0 text-[11px] ${canOpen ? 'text-bfaint' : 'text-transparent'}`} aria-hidden>{open ? '▾' : '▸'}</span>
          <span className={`pii truncate text-[13px] ${depth === 0 ? 'font-extrabold text-bink' : 'font-bold text-bbody'} ${node.masked ? 'tracking-[0.2em] text-bfaint' : ''}`}>
            {node.name}
          </span>
          {node.code && <span className="tnum shrink-0 rounded-full bg-white px-1.5 py-0.5 text-[10.5px] font-bold text-bmuted shadow-card">{node.code}</span>}
          {node.masked && <span className="shrink-0 text-[10.5px] font-semibold text-bfaint">본사만 열람</span>}
          {!node.masked && node.cases > 0 && <span className="tnum shrink-0 text-[11px] text-bfaint">{node.cases}건</span>}
        </button>
        <span className={`tnum shrink-0 pr-4 text-[13.5px] font-extrabold ${depth === 0 ? 'text-bink' : 'text-primary-text'}`}>{won(node.amount)}</span>
      </div>

      {open && kids.map((k) => <Row key={k.id} node={k} label={label} depth={depth + 1} />)}
      {/* +@ — 하위 합계와 내 총액의 차이를 설명하는 줄. 펼쳤을 때만 보여야 합계가 검증된다 */}
      {open && node.opex > 0 && (
        <div data-t="settle-opex" data-amount={node.opex} className="flex items-center gap-2 border-b border-brow bg-ok/[0.05]">
          <span className="flex-1 py-2.5 pr-3 text-[12.5px] font-bold text-ok" style={{ paddingLeft: `${28 + depth * 16}px` }}>{label}</span>
          <span className="tnum shrink-0 pr-4 text-[13px] font-extrabold text-ok">{won(node.opex)}</span>
        </div>
      )}
    </>
  )
}

export default function SettleDrill({ view, title, caption }) {
  if (!view) return null
  const { root, label } = view
  const leaf = !root.children?.length

  return (
    <div data-t="settle-drill" className="overflow-hidden rounded-card border border-bline bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brow px-4 py-3">
        <div>
          <h2 className="text-[15px] font-extrabold text-bink">{title ?? `${KIND_LABEL[root.kind] ?? ''} 정산 명세`}</h2>
          <p className="mt-0.5 text-[11.5px] text-bfaint">{caption ?? `${view.period} 집계 · 금액을 누르면 한 단계 아래가 펼쳐집니다`}</p>
        </div>
        <span className="tnum rounded-full bg-bindigo/10 px-3 py-1 text-[12.5px] font-extrabold text-bindigo">{won(root.amount)}</span>
      </div>
      {leaf
        ? (
          <div data-t="settle-leaf" data-amount={root.amount} className="px-4 py-6 text-center">
            <div className="tnum text-[24px] font-extrabold text-bink">{won(root.amount)}</div>
            <p className="mt-1 text-[12px] text-bmuted">이번 달 내 영업이익 · 완료 {root.cases}건</p>
            <p className="mt-2 text-[11px] text-bfaint">하부 조직이 없어 펼칠 내역이 없습니다.</p>
          </div>
        )
        : <Row node={root} label={label} depth={0} />}
      <p className="px-4 py-2.5 text-[11px] leading-[1.5] text-bfaint">
        상위 금액 = 하부 금액의 합 + {label}. 셀러 실명({MASK} 표시)은 본사만 열람하며, 총판은 하부 1대(대리점)까지 열람합니다.
      </p>
    </div>
  )
}
