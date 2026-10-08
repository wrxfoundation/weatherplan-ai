import { Link } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { Pill } from '@/components/Pill'

// 운영 통제 현황 — "단단하게 관리되고 있음"을 첫 화면에서 증명하는 스트립.
// 수치는 지갑 레지스트리·M4·감사 로그·알림 규칙 화면과 정합.
const items = [
  { icon: 'audit', title: '감사 로그 무결성', value: '정상', tone: 'ok' as const, sub: '해시 체인 + XRPL 기록 · 최종 검증 14:30', to: '/settings/audit' },
  { icon: 'wallet', title: '지갑 다중서명', value: '14 / 18', tone: 'ok' as const, sub: '한도 설정 16/18 · 콜드 보관 운영', to: '/settings/wallets' },
  { icon: 'power', title: '지급 안전장치', value: '대기 (정상)', tone: 'ok' as const, sub: '1일 한도 41.1% 사용 · 자동중단 이력 0건', to: '/m4' },
  { icon: 'bell', title: '알림 규칙', value: '19 활성', tone: 'navy' as const, sub: '전송 성공률 98.6% · 24h 알림 41건', to: '/settings/alerts' },
]

export function GovernanceStrip() {
  return (
    <div className="mt-4 rounded-card border border-line bg-panel shadow-card">
      <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4 xl:divide-x">
        {items.map(it => (
          <Link key={it.title} to={it.to}
            className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-navy-tint/60">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-navy-soft text-navy">
              <Icon name={it.icon} size={15} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="text-label font-semibold text-ink">{it.title}</span>
                <Pill tone={it.tone} className="num">{it.value}</Pill>
              </span>
              <span className="num block truncate text-tiny font-normal text-mute">{it.sub}</span>
            </span>
            <Icon name="chevronRight" size={13} className="shrink-0 text-mute transition-colors group-hover:text-navy" />
          </Link>
        ))}
      </div>
    </div>
  )
}
