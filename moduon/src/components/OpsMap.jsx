// ─── 본사 어드민 오픈맵 — 총판(영업단)·대리점 현황 권역 지도 ────────
// 11개 영업단을 지리적 위치로 배치하고, 실데이터(테넌트·리드·매출)를 노드에 집계.
import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { UNITS } from '../lib/constants'
import { won, num } from '../lib/engine'

// 대략적 지리 좌표(컨테이너 % — 수도권 상단, 제주 하단)
const POS = {
  SD1: [42, 20], SD2: [35, 28], SD3: [24, 25], GW: [65, 17],
  CC1: [32, 42], CC2: [48, 41], JB: [30, 57], JN: [30, 74],
  GB: [60, 49], GN: [59, 68], JJ: [27, 93],
}

export default function OpsMap() {
  const { db } = useStore()
  const [sel, setSel] = useState('SD2')

  const byUnit = useMemo(() => {
    const m = {}
    for (const u of UNITS) m[u.code] = { ...u, dealers: 0, active: 0, sales: 0, leads: 0 }
    for (const t of db.tenants) {
      const e = m[t.unit]
      if (e) { e.dealers++; if (t.status === '활성') e.active++; e.sales += t.monthlySales || 0 }
    }
    for (const l of db.leads) {
      const t = db.tenants.find((x) => x.id === l.tenantId)
      const code = t?.unit
      if (code && m[code]) m[code].leads++
    }
    return m
  }, [db])

  const totals = useMemo(() => {
    const list = Object.values(byUnit)
    return {
      units: list.length,
      staffed: list.filter((u) => u.active > 0).length,
      dealers: list.reduce((s, u) => s + u.dealers, 0),
      sales: list.reduce((s, u) => s + u.sales, 0),
      vacant: list.filter((u) => u.active === 0).length,
    }
  }, [byUnit])

  const s = byUnit[sel]
  const nodeColor = (u) => (u.active === 0 ? 'vacant' : u.active >= 2 ? 'hot' : 'on')

  return (
    <div className="rounded-card bg-white p-5 shadow-bcard">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[15.5px] font-extrabold text-bink">총판·대리점 오픈맵 <span className="text-[12.5px] font-semibold text-bmuted">· 11개 영업단</span></h2>
          <p className="mt-0.5 text-[12px] text-bmuted">권역 노드를 누르면 총판·대리점 현황이 표시됩니다. 색은 대리점 밀도, 점선 링은 모집 필요 권역.</p>
        </div>
        <div className="flex items-center gap-3 text-[12px]">
          <Stat k="운영 권역" v={`${totals.staffed}/${totals.units}`} />
          <Stat k="총 대리점" v={num(totals.dealers)} />
          <Stat k="모집 필요" v={`${totals.vacant}곳`} warn />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_260px]">
        {/* ── 지도 ── */}
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-section border border-bline bg-gradient-to-b from-[#EEF2FB] to-[#F5F7FC] sm:aspect-[5/4]">
          <span className="pointer-events-none absolute left-3 top-2.5 text-[11px] font-bold text-bfaint">대한민국 영업권역도</span>
          {UNITS.map((u) => {
            const d = byUnit[u.code]
            const [x, y] = POS[u.code] ?? [50, 50]
            const kind = nodeColor(d)
            const active = sel === u.code
            const sz = 30 + Math.min(3, d.dealers) * 8
            return (
              <button
                key={u.code}
                onClick={() => setSel(u.code)}
                style={{ left: `${x}%`, top: `${y}%`, width: sz, height: sz }}
                className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[12px] font-extrabold transition-all ${active ? 'z-20 ring-4 ring-primary/25' : 'z-10'} ${
                  kind === 'hot' ? 'bg-primary text-white' : kind === 'on' ? 'bg-bindigo text-white' : 'border-2 border-dashed border-warn bg-white text-warn'
                }`}
                title={`${u.name} · 대리점 ${d.dealers}`}
              >
                {d.dealers}
                <span className={`absolute top-full mt-1 whitespace-nowrap text-[10.5px] font-bold ${active ? 'text-bink' : 'text-bbody'}`}>{u.name}</span>
              </button>
            )
          })}
        </div>

        {/* ── 선택 권역 상세 ── */}
        <div className="flex flex-col gap-3">
          <div className="rounded-field border border-bline bg-brow/40 p-4">
            <div className="flex items-center justify-between">
              <div className="text-[15px] font-extrabold text-bink">{s.name}</div>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${s.active > 0 ? 'bg-ok/10 text-ok' : 'bg-warn/10 text-warn'}`}>{s.active > 0 ? '운영 중' : '모집 필요'}</span>
            </div>
            <div className="mt-1 text-[12px] text-bmuted">{s.cover}</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Cell k="총판" v={s.active > 0 ? '배정' : '공석'} accent={s.active > 0 ? 'text-primary-text' : 'text-warn'} />
              <Cell k="대리점" v={`${s.dealers}개`} />
              <Cell k="이번달 매출" v={won(s.sales)} />
              <Cell k="배정 리드" v={`${s.leads}건`} />
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-field border border-bline p-3 text-[11.5px]">
            <Dot cls="bg-primary" t="대리점 2+" />
            <Dot cls="bg-bindigo" t="운영" />
            <Dot cls="border-2 border-dashed border-warn bg-white" t="모집 필요" />
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ k, v, warn }) {
  return (
    <div className="text-right">
      <div className="text-[10.5px] font-semibold text-bfaint">{k}</div>
      <div className={`tnum text-[15px] font-extrabold ${warn ? 'text-warn' : 'text-bink'}`}>{v}</div>
    </div>
  )
}
function Cell({ k, v, accent = 'text-bink' }) {
  return (
    <div className="rounded-md bg-white px-3 py-2">
      <div className="text-[10.5px] font-semibold text-bfaint">{k}</div>
      <div className={`tnum text-[14px] font-extrabold ${accent}`}>{v}</div>
    </div>
  )
}
function Dot({ cls, t }) {
  return <span className="inline-flex items-center gap-1.5"><span className={`h-3 w-3 rounded-full ${cls}`} />{t}</span>
}
