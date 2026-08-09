// ─── A-08 권한·감사 로그 — 정책 변경·지급·재배정 등 주요 행위 전수 기록 ──
import { useStore } from '../../lib/store'
import { fmtDateTime } from '../../lib/engine'
import { Card } from '../../components/ui'

const ROLES = [
  { role: 'hq_admin', scope: '전체 (본사) — 정책·지급 실행 포함', color: '#5377D6' },
  { role: 'hq_staff', scope: '어드민 열람+운영 (정책·지급 실행 제외)', color: '#7D8EE8' },
  { role: 'regional', scope: '관리단 — 소속 권역 파트너·리드 열람', color: '#8B7BFF' },
  { role: 'partner', scope: '자기 몰·자기 리드·자기 정산만 (RLS 강제)', color: '#17B26A' },
  { role: 'consumer', scope: '소비자 회원 — 내 상담·포인트', color: '#F79009' },
]

const ACTION_TONE = {
  '분양 승인': 'bg-ok/10 text-ok', '분양 반려': 'bg-danger/10 text-danger',
  '정책 변경': 'bg-tint text-primary-text', '정산 실행': 'bg-warn/10 text-warn',
  '지급 확정': 'bg-warn/10 text-warn', '리드 재배정': 'bg-brow text-bbody',
  '상품 정책 변경': 'bg-tint text-primary-text', '몰 정지': 'bg-danger/10 text-danger', '몰 재개': 'bg-ok/10 text-ok',
}

export default function AdminAudit() {
  const { db } = useStore()

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-[20px] font-extrabold text-bink">권한 · 감사 로그</h1>
      <p className="mt-0.5 text-[12.5px] text-bmuted">정책 변경·지급·재배정 등 주요 행위는 전부 기록됩니다. 실서비스는 Supabase RLS + audit_logs 테이블.</p>

      {/* RBAC 롤 */}
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
        {ROLES.map((r) => (
          <Card key={r.role} track="b" className="p-4">
            <span className="rounded-md px-2 py-1 font-mono text-[11px] font-bold text-white" style={{ backgroundColor: r.color }}>{r.role}</span>
            <p className="mt-2.5 text-[11.5px] leading-4 text-bbody">{r.scope}</p>
          </Card>
        ))}
      </div>

      {/* 감사 로그 */}
      <Card track="b" className="mt-4 overflow-hidden">
        <div className="hidden grid-cols-[130px_120px_130px_1fr_1.2fr] gap-2 border-b border-brow bg-brow/50 px-5 py-2.5 text-[11.5px] font-bold text-bmuted sm:grid">
          <span>일시</span><span>행위자</span><span>행위</span><span>대상</span><span>상세</span>
        </div>
        {db.auditLog.map((g) => (
          <div key={g.id} className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-brow px-4 py-3 sm:grid-cols-[130px_120px_130px_1fr_1.2fr] sm:px-5">
            <span className="tnum order-2 text-[11.5px] text-bfaint sm:order-none sm:text-[12px]">{fmtDateTime(g.at)}</span>
            <span className="hidden text-[12.5px] font-semibold text-bbody sm:block">{g.actor}</span>
            <span className="order-1 sm:order-none">
              <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ${ACTION_TONE[g.action] ?? 'bg-brow text-bbody'}`}>{g.action}</span>
            </span>
            <span className="order-3 col-span-2 text-[12.5px] font-semibold text-bink sm:order-none sm:col-span-1">{g.target}</span>
            <span className="order-4 col-span-2 text-[12px] text-bmuted sm:order-none sm:col-span-1">{g.detail}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}
