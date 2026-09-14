// ─── P-07 자료실 (본사 배포 스크립트·배너·교육자료) ───────────────
import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { timeAgo } from '../../lib/engine'
import { Card, useToast } from '../../components/ui'
import { IcDoc, IcChart, IcBox, IcFolder } from '../../components/icons'

const TYPE_ICON = { PDF: IcDoc, XLSX: IcChart, ZIP: IcBox }
const FileIcon = ({ type }) => { const Icon = TYPE_ICON[type] ?? IcFolder; return <Icon size={18} /> }

export default function OfficeResources() {
  useOutletContext()
  const { db } = useStore()
  const toast = useToast()

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-[20px] font-extrabold text-bink">자료실</h1>
      <p className="mt-0.5 text-[12.5px] text-bmuted">본사가 배포한 상담 스크립트·상품 교육자료·홍보 배너. 다운로드 이력이 기록됩니다.</p>

      <div className="mt-4 flex flex-col gap-2.5">
        {db.notices.map((n) => (
          <Card key={n.id} track="b" className="flex items-center gap-3 px-4 py-3.5">
            <span className="shrink-0 rounded-md bg-tint px-2 py-1 text-[11px] font-extrabold text-primary-text">공지</span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-bbody">{n.title}</span>
            <span className="shrink-0 text-[11.5px] text-bfaint">{timeAgo(n.at)}</span>
          </Card>
        ))}
      </div>

      <Card track="b" className="mt-4 overflow-hidden">
        {db.resources.map((r) => (
          <div key={r.id} className="flex items-center gap-3.5 border-b border-brow px-4 py-4 sm:px-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brow text-bbody"><FileIcon type={r.type} /></span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] font-bold text-bink">{r.name}</div>
              <div className="tnum text-[11.5px] text-bfaint">{r.type} · {r.size} · 업데이트 {timeAgo(r.at)} · 다운로드 {r.downloads}회</div>
            </div>
            <button onClick={() => toast(`"${r.name}" 다운로드가 시작됐어요 (데모)`)} className="h-9 shrink-0 rounded-full bg-tint px-4 text-[12.5px] font-bold text-primary-text hover:bg-primary hover:text-white">
              다운로드
            </button>
          </div>
        ))}
      </Card>
    </div>
  )
}
