// ─── A-03(a) 상품 관리 — 지원금·수수료 정책값 인라인 편집 ─────────
// 변경 즉시 소비자몰 카테고리 화면·정산 추정에 반영 (하드코딩 금지 원칙)
import { useState } from 'react'
import { useStore } from '../../lib/store'
import { CATEGORIES, catBySlug } from '../../lib/constants'
import { won } from '../../lib/engine'
import { Card, useToast } from '../../components/ui'

export default function AdminProducts() {
  const { db, dispatch } = useStore()
  const toast = useToast()
  const [cat, setCat] = useState('전체')
  const [editing, setEditing] = useState(null) // {id, field, value}

  const products = db.products.filter((p) => cat === '전체' || p.cat === cat)

  const commit = () => {
    if (!editing) return
    const v = parseInt(String(editing.value).replace(/[^0-9]/g, ''), 10)
    if (!Number.isNaN(v) && v >= 0) {
      dispatch({ type: 'PRODUCT_UPDATE', payload: { id: editing.id, patch: { [editing.field]: v } } })
      toast('정책값이 즉시 반영됐어요 (소비자몰·정산 동기화)')
    }
    setEditing(null)
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-[20px] font-extrabold text-bink">상품 관리</h1>
      <p className="mt-0.5 text-[12.5px] text-bmuted">상품·지원금·성사 수수료는 본사 중앙 관리 — 값을 클릭해 바로 수정하세요. 변경 이력은 감사 로그에 남습니다.</p>

      <div className="scrollbar-none mt-4 flex gap-1.5 overflow-x-auto">
        {['전체', ...CATEGORIES.map((c) => c.slug)].map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`h-8 shrink-0 rounded-full px-3.5 text-[12.5px] font-bold transition-colors ${cat === c ? 'bg-bink text-white' : 'bg-white text-bbody shadow-bcard hover:bg-brow'}`}>
            {c === '전체' ? '전체' : catBySlug(c)?.name}
          </button>
        ))}
      </div>

      <Card track="b" className="mt-4 overflow-hidden">
        <div className="hidden grid-cols-[0.7fr_1.6fr_0.8fr_0.9fr_0.9fr_0.9fr] gap-2 border-b border-brow bg-brow/50 px-5 py-2.5 text-[11.5px] font-bold text-bmuted lg:grid">
          <span>카테고리</span><span>상품명 · 브랜드</span><span>월 요금</span><span>지원금 (클릭 수정)</span><span>성사 수수료 (클릭 수정)</span><span>배지</span>
        </div>
        {products.map((p) => (
          <div key={p.id} className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-brow px-4 py-3.5 lg:grid-cols-[0.7fr_1.6fr_0.8fr_0.9fr_0.9fr_0.9fr] lg:px-5">
            <span className="hidden lg:block"><span className="rounded-md bg-brow px-2 py-1 text-[11.5px] font-semibold text-bbody">{catBySlug(p.cat)?.name}</span></span>
            <div>
              <div className="text-[13.5px] font-bold text-bink">{p.name}</div>
              <div className="text-[11.5px] text-bfaint">{p.brand} <span className="lg:hidden">· {catBySlug(p.cat)?.name}</span></div>
            </div>
            <span className="tnum hidden text-[12.5px] text-bbody lg:block">{p.monthly > 0 ? `${won(p.monthly)}/월` : '—'}</span>
            <EditableCell p={p} field="support" editing={editing} setEditing={setEditing} commit={commit} label="지원금" />
            <EditableCell p={p} field="commission" editing={editing} setEditing={setEditing} commit={commit} label="수수료" accent />
            <span className="hidden lg:block"><span className="rounded-full bg-tint px-2.5 py-1 text-[11px] font-bold text-primary-text">{p.tag}</span></span>
          </div>
        ))}
      </Card>
      <p className="mt-3 text-[11.5px] text-bfaint">AC: 정책 변경이 견적 계산기·정산·소비자몰에 즉시 반영됩니다. 프로모션 기간·버전 관리는 정책 관리 메뉴에서.</p>
    </div>
  )
}

function EditableCell({ p, field, editing, setEditing, commit, label, accent }) {
  const isEditing = editing?.id === p.id && editing?.field === field
  return (
    <span className="flex items-center gap-1">
      <span className="text-[10.5px] text-bfaint lg:hidden">{label}</span>
      {isEditing ? (
        <input
          autoFocus
          defaultValue={p[field]}
          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          className="tnum h-8 w-24 rounded-md border border-primary px-2 text-[12.5px] font-bold text-bink"
        />
      ) : (
        <button
          onClick={() => setEditing({ id: p.id, field, value: p[field] })}
          className={`tnum rounded-md px-2 py-1 text-[12.5px] font-bold transition-colors hover:bg-tint ${accent ? 'text-ok' : 'text-orange-text'}`}
        >
          {p[field] > 0 ? won(p[field]) : '—'} ✎
        </button>
      )}
    </span>
  )
}
