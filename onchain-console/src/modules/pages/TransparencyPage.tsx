import { Card, CardHeader } from '@/components/Card'
import { PageHeader, UpdatedMeta } from '@/components/PageHeader'
import { Pill } from '@/components/Pill'
import { Icon } from '@/components/Icon'
import { kpiTones } from '@/components/KpiCard'

// RLUSD 투명성 공개 시안 (PRD §5.M6 원안) — 고객·파트너 대상 공개 페이지.
// 누적 수취는 M5 '데이터 상점 수익 (RLUSD)' YTD와 정합.
const principles = [
  { no: 1, title: '수취 지갑을 공개합니다', desc: '케이웨더가 결제를 받는 지갑 주소를 상시 공개하며, 변경 시 사전 고지합니다.' },
  { no: 2, title: '모든 결제는 공개 원장에서 검증됩니다', desc: 'RLUSD 결제는 XRPL 공개 원장에 기록되어 누구나 금액·시각·상대를 확인할 수 있습니다.' },
  { no: 3, title: '수취·지급 내역을 상시 관제합니다', desc: '수취·보상 지급·파트너 정산은 온체인 콘솔에서 실시간 관제되고 감사 로그로 보존됩니다.' },
]

export function TransparencyPage() {
  return (
    <>
      <PageHeader
        title="RLUSD 결제 투명성"
        subtitle="케이웨더 데이터 상점의 결제 화폐와 수취 지갑을 공개합니다. 공개 원장에서 누구나 검증할 수 있습니다."
        meta={<UpdatedMeta />}
        actions={<Pill tone="demo">공개 시안 (데모)</Pill>}
      />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <Card className="p-5">
          <span className={`grid h-9 w-9 place-items-center rounded-xl ${kpiTones.navy.chip}`}><Icon name="coins" size={17} /></span>
          <div className="mt-3 text-label font-medium text-body">결제 화폐</div>
          <div className="mt-1 text-[22px] font-bold tracking-tight text-ink">RLUSD</div>
          <div className="mt-1 text-meta leading-relaxed text-mute">1 USD 연동 스테이블코인 — 가격 변동 없이 결제에 사용합니다.</div>
        </Card>
        <Card className="p-5">
          <span className={`grid h-9 w-9 place-items-center rounded-xl ${kpiTones.green.chip}`}><Icon name="badge" size={17} /></span>
          <div className="mt-3 text-label font-medium text-body">발행사</div>
          <div className="mt-1 text-[22px] font-bold tracking-tight text-ink">Ripple</div>
          <div className="mt-1 text-meta leading-relaxed text-mute">NYDFS 규제 하에 발행되는 기관용 스테이블코인입니다.</div>
        </Card>
        <Card className="p-5">
          <span className={`grid h-9 w-9 place-items-center rounded-xl ${kpiTones.purple.chip}`}><Icon name="exchange" size={17} /></span>
          <div className="mt-3 text-label font-medium text-body">국내 유동성</div>
          <div className="mt-1 text-[22px] font-bold tracking-tight text-ink">업비트 상장</div>
          <div className="mt-1 text-meta leading-relaxed text-mute">국내 거래소에서 원화로 환금 가능한 결제 수단입니다.</div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader title="케이웨더 수취 지갑" formula={'등록 전 플레이스홀더 표기 —\n지갑 등록 즉시 실주소·실집계로 전환 (PRD §5.M6)'} />
          <div className="mx-5 rounded-lg border border-line bg-navy-tint px-4 py-4">
            <div className="text-meta font-medium text-mute">데이터 상점 수취 주소 (XRPL)</div>
            <div className="num mt-1.5 flex flex-wrap items-center gap-2 text-[17px] font-bold tracking-tight text-ink">
              rKWEATHER…DEMO
              <Pill tone="demo">지갑 등록 대기</Pill>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-meta text-mute">
              <Icon name="info" size={13} /> 회사 지갑 등록 시 실제 주소와 익스플로러 링크로 전환됩니다.
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4">
            <div className="rounded-lg border border-line-soft p-4">
              <div className="text-meta font-medium text-body">누적 수취 (YTD)</div>
              <div className="num mt-1 text-[22px] font-bold tracking-tight text-ink">$412,210</div>
              <div className="mt-0.5 text-tiny font-normal text-mute">데이터 상점 RLUSD 수취 누계 (데모)</div>
            </div>
            <div className="rounded-lg border border-line-soft p-4">
              <div className="text-meta font-medium text-body">검증 방법</div>
              <div className="mt-1 text-label font-semibold leading-relaxed text-body">
                XRPL 익스플로러에서 주소 검색 → 모든 수취 내역이 공개 원장에 기록되어 있습니다.
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="공개 원칙" />
          <div className="space-y-3 px-5 pb-5">
            {principles.map(p => (
              <div key={p.no} className="flex gap-3 rounded-lg border border-line-soft px-3.5 py-3">
                <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy text-tiny font-bold text-white">{p.no}</span>
                <span>
                  <span className="block text-label font-bold text-ink">{p.title}</span>
                  <span className="mt-0.5 block text-meta leading-relaxed text-body">{p.desc}</span>
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
