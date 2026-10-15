import { ReactNode, useState } from 'react'
import { Card, CardHeader } from '@/components/Card'
import { Pill } from '@/components/Pill'
import { Icon } from '@/components/Icon'
import { nodeMapDemo as d, NodeHub } from '@/demo/generators/m4'
import { NodeLeafletMap } from './NodeLeafletMap'

// 글로벌 노드 관리 맵 — 오픈맵 데이터(Natural Earth) 기반 도트 월드맵 + 거점 점 마커 + 라이브 티커.
// 지도는 빌드 타임에 구운 정적 좌표(등장방형 투영)로 자체 렌더링 — 런타임 외부 지도 서비스 미사용.
const fmt = (n: number) => n.toLocaleString('ko-KR')

const flag: Record<string, string> = { KR: '🇰🇷', JP: '🇯🇵', SG: '🇸🇬', GR: '🇬🇷', DE: '🇩🇪', GB: '🇬🇧', US: '🇺🇸', AU: '🇦🇺' }
const toneOf = (u: number) => (u >= 98 ? 'ok' : u >= 95 ? 'warn' : 'bad') as 'ok' | 'warn' | 'bad'
const toneLabel = { ok: '정상', warn: '주의', bad: '점검 필요' }

export function NodeMap({ hubs = d.hubs, filterBar }: { hubs?: NodeHub[]; filterBar?: ReactNode } = {}) {
  const [sel, setSel] = useState<NodeHub | null>(null)
  const [view, setView] = useState<'world' | 'kr'>('world')
  const krHubs = hubs.filter(h => h.country === 'KR')
  const krCount = krHubs.reduce((a, h) => a + h.count, 0)
  const t = d.totals

  return (
    <Card className="mt-4">
      <CardHeader
        title={<>글로벌 노드 관리 맵 <span className="font-medium text-mute">(도시별)</span></>}
        formula={'등록 디바이스의 도시별 분포·상태\n마커 크기 = 디바이스 수, 색 = 가동률(7D)'}
        action={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-tiny text-mute">
            <span className="num">{t.countries}개국 · {fmt(t.registered)}대</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-ok" /> ≥98%</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber" /> 95~98%</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-bad" /> &lt;95%</span>
          </span>
        }
      />
      <div className="grid grid-cols-1 gap-4 px-5 pb-4 xl:grid-cols-[1.7fr_1fr]">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex overflow-hidden rounded-lg border border-line">
              {(['world', 'kr'] as const).map(v => (
                <button key={v} type="button" onClick={() => setView(v)}
                  className={`px-3 py-1 text-meta font-semibold transition-colors ${
                    view === v ? 'bg-navy-soft text-navy-deep' : 'text-mute hover:text-body'}`}>
                  {v === 'world' ? '전 세계' : '한국 (도시별)'}
                </button>
              ))}
            </div>
            {filterBar}
            <span className="num hidden text-tiny font-normal text-mute md:block">
              {view === 'world' ? `휠 줌·드래그 · 클러스터 클릭 시 확대` : `국내 ${krHubs.length}개 도시 · ${fmt(krCount)}대`}
            </span>
          </div>
          <NodeLeafletMap hubs={hubs} view={view} onSelect={h => setSel(cur => (cur?.name === h.name ? null : h))} />

          <div className="mt-2 overflow-hidden rounded-lg border border-line bg-[#0B1220]">
            <div className="kw-ticker flex w-max items-center whitespace-nowrap py-1.5 font-mono text-[11.5px] text-[#B9C4DA]">
              {[...d.ticker, ...d.ticker].map((m, i) => (
                <span key={i} className="flex items-center">
                  <span className="mx-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3FBF7F]" />
                  <span className="num">{m}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="min-w-0">
          {sel ? (
            <div className="rounded-lg border border-line p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-h3 text-ink">
                  <span aria-hidden>{flag[sel.country]}</span> {sel.name}
                  <Pill tone={toneOf(sel.uptime)}>{toneLabel[toneOf(sel.uptime)]}</Pill>
                </span>
                <button type="button" onClick={() => setSel(null)} className="text-tiny font-semibold text-mute hover:text-navy">전체 ✕</button>
              </div>
              <div className="num mt-2 flex items-baseline gap-1.5">
                <b className="text-[25px] font-bold tracking-tight text-ink">{fmt(sel.count)}</b>
                <span className="text-meta text-mute">대 등록 · 가동률 {sel.uptime.toFixed(1)}%</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {([['활성', sel.active, 'text-ok'], ['유휴', sel.idle, 'text-mute'],
                  ['오프라인', sel.offline, 'text-bad'], ['점검 중', sel.maint, 'text-warn']] as const).map(([l, v, c]) => (
                  <div key={l} className="rounded-lg border border-line-soft px-3 py-2">
                    <span className="block text-tiny font-medium text-mute">{l}</span>
                    <b className={`num text-[16px] font-bold ${c}`}>{fmt(v)}</b>
                  </div>
                ))}
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-line-soft">
                <div className="flex h-full">
                  <span className="bg-ok" style={{ width: `${(sel.active / sel.count) * 100}%` }} />
                  <span className="bg-line" style={{ width: `${(sel.idle / sel.count) * 100}%` }} />
                  <span className="bg-bad" style={{ width: `${(sel.offline / sel.count) * 100}%` }} />
                  <span className="bg-amber" style={{ width: `${(sel.maint / sel.count) * 100}%` }} />
                </div>
              </div>
              <p className="mt-2 text-tiny font-normal leading-relaxed text-mute">
                전체 대비 {(sel.count / t.registered * 100).toFixed(1)}% · 오프라인 = 30분 이상 무응답
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-line p-4">
              <div className="text-h3 text-ink">글로벌 요약</div>
              <div className="num mt-2 flex items-baseline gap-1.5">
                <b className="text-[25px] font-bold tracking-tight text-ink">{fmt(t.registered)}</b>
                <span className="text-meta text-mute">대 · {t.countries}개국 · 평균 가동률 {t.uptime}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {([['활성', t.active, 'text-ok'], ['유휴', t.idle, 'text-mute'],
                  ['오프라인', t.offline, 'text-bad'], ['점검 중', t.maint, 'text-warn']] as const).map(([l, v, c]) => (
                  <div key={l} className="rounded-lg border border-line-soft px-3 py-2">
                    <span className="block text-tiny font-medium text-mute">{l}</span>
                    <b className={`num text-[16px] font-bold ${c}`}>{fmt(v)}</b>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-tiny font-normal leading-relaxed text-mute">
                지도 마커를 클릭하면 거점 상세가 표시됩니다. 활성 12,842대는 상단 KPI·대시보드와 동일 집계입니다.
              </p>
            </div>
          )}

          <div className="mt-3 space-y-1.5">
            {d.events.slice(0, 3).map(e => (
              <div key={e.title} className="flex items-center gap-2.5 rounded-lg border border-line-soft px-3 py-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-white" style={{ background: e.color }}>
                  <Icon name={e.icon} size={12} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-label font-semibold text-ink">{e.title}</span>
                  <span className="block truncate text-tiny font-normal text-mute">{e.sub}</span>
                </span>
                <span className="shrink-0 text-tiny font-normal text-mute">{e.ago}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

// 데이터 정결성 & 보상 제공량 — 검증 품질과 지급량(XRP 병기)을 한 스트립에서 표시
export function IntegrityRewardStrip() {
  const t = d.totals
  const todayXrp = (8214.3 / t.xrpRate).toLocaleString('ko-KR', { maximumFractionDigits: 1 })
  return (
    <Card className="mt-4">
      <div className="grid grid-cols-1 divide-y divide-line xl:grid-cols-2 xl:divide-x xl:divide-y-0">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-label font-semibold text-ink">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-ok-soft text-ok"><Icon name="audit" size={14} /></span>
              데이터 정결성 (7D)
            </span>
            <Pill tone="ok">무결성 해시 정상</Pill>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            {([
              ['유효 데이터 비율', t.purity, 0.992, 'bg-ok'],
              ['검증 통과율', t.validPass, 0.984, 'bg-navy'],
              ['이상치 제거', t.outlierCut, 0.016, 'bg-bad'],
            ] as const).map(([l, v, r, c]) => (
              <div key={l} className="rounded-lg border border-line-soft px-3 py-2.5">
                <span className="block text-tiny font-medium text-mute">{l}</span>
                <b className="num text-[17px] font-bold text-ink">{v}</b>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line-soft">
                  <div className={`h-full rounded-full ${c}`} style={{ width: `${r * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-tiny font-normal leading-relaxed text-mute">
            검증 = 3σ 이상치 제거 · 인근 센서 교차대조 · 위치 검증 · 무결성 해시(일 1회 XRPL 기록). 검증 통과 데이터만 보상 대상입니다.
          </p>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-label font-semibold text-ink">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-navy-soft text-navy"><Icon name="coins" size={14} /></span>
              보상 제공량
            </span>
            <span className="num text-tiny font-normal text-mute">1 XRP = ${t.xrpRate.toFixed(2)} (데모 환산)</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <div className="rounded-lg border border-line-soft px-3 py-2.5">
              <span className="block text-tiny font-medium text-mute">오늘 지급 예정</span>
              <b className="num block text-[17px] font-bold text-ink">8,214.3 <span className="text-[12px] font-semibold text-mute">RLUSD</span></b>
              <span className="num block text-meta font-semibold text-navy">≈ {todayXrp} XRP</span>
            </div>
            <div className="rounded-lg border border-line-soft px-3 py-2.5">
              <span className="block text-tiny font-medium text-mute">최근 7일 지급 실적</span>
              <b className="num block text-[17px] font-bold text-ink">{t.reward7dRlusd.toLocaleString('ko-KR', { maximumFractionDigits: 1 })} <span className="text-[12px] font-semibold text-mute">RLUSD</span></b>
              <span className="num block text-meta font-semibold text-navy">≈ {t.reward7dXrp.toLocaleString('ko-KR', { maximumFractionDigits: 1 })} XRP</span>
            </div>
          </div>
          <p className="mt-2.5 text-tiny font-normal leading-relaxed text-mute">
            지급 통화는 RLUSD(XRPL)이며, XRP 환산량은 참고용 병기입니다. 상단 KPI·대시보드 지급액과 동일 집계입니다.
          </p>
        </div>
      </div>
    </Card>
  )
}

export function NodeRegionTable({ rows = d.hubs, compare = [], onToggleCompare }: {
  rows?: NodeHub[]
  compare?: string[]
  onToggleCompare?: (name: string) => void
} = {}) {
  return (
    <Card className="mt-4">
      <CardHeader
        title="거점별 관리 현황"
        formula={'상태 = 가동률(7D) 구간 · 정결성 = 검증 통과 데이터 비율\n보상(7D)은 활성 대수·품질 점수 비례 배분'}
        action={<span className="num text-meta text-mute">표시 {rows.length}개 거점 · 비교 최대 3개</span>}
      />
      <div className="overflow-x-auto px-4">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="whitespace-nowrap border-b border-line text-left text-meta font-medium text-mute">
              <th className="px-2 py-2 font-medium">비교</th>
              <th className="px-2 py-2 font-medium">거점</th>
              <th className="px-2 py-2 text-right font-medium">등록</th>
              <th className="px-2 py-2 text-right font-medium">활성</th>
              <th className="px-2 py-2 text-right font-medium">오프라인</th>
              <th className="px-2 py-2 text-right font-medium">가동률 (7D)</th>
              <th className="px-2 py-2 text-right font-medium">데이터 정결성</th>
              <th className="px-2 py-2 text-right font-medium">보상 (7D, RLUSD)</th>
              <th className="px-2 py-2 text-right font-medium">≈ XRP</th>
              <th className="px-2 py-2 font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(h => {
              const tone = toneOf(h.uptime)
              const checked = compare.includes(h.name)
              return (
                <tr key={h.name} className={`whitespace-nowrap border-b border-line-soft last:border-0 ${checked ? 'bg-navy-tint/60' : ''}`}>
                  <td className="px-2 py-2.5">
                    <button type="button" aria-label={`${h.name} 비교 ${checked ? '해제' : '추가'}`}
                      onClick={() => onToggleCompare?.(h.name)}
                      disabled={!checked && compare.length >= 3}
                      className={`grid h-[18px] w-[18px] place-items-center rounded border text-[11px] font-bold transition-colors ${
                        checked ? 'border-navy bg-navy text-white' : compare.length >= 3 ? 'cursor-not-allowed border-line text-line' : 'border-line text-transparent hover:border-navy/50'}`}>
                      ✓
                    </button>
                  </td>
                  <td className="px-2 py-2.5 text-label font-semibold text-ink">
                    <span aria-hidden className="mr-1.5">{flag[h.country]}</span>{h.name}
                  </td>
                  <td className="num px-2 py-2.5 text-right text-label font-medium text-ink">{fmt(h.count)}</td>
                  <td className="num px-2 py-2.5 text-right text-label text-body">{fmt(h.active)}</td>
                  <td className={`num px-2 py-2.5 text-right text-label font-semibold ${h.offline > 50 ? 'text-bad' : 'text-body'}`}>{fmt(h.offline)}</td>
                  <td className="num px-2 py-2.5 text-right text-label font-semibold text-ink">{h.uptime.toFixed(1)}%</td>
                  <td className={`num px-2 py-2.5 text-right text-label font-semibold ${h.purity >= 99 ? 'text-ok' : h.purity >= 98 ? 'text-ink' : 'text-warn'}`}>{h.purity.toFixed(1)}%</td>
                  <td className="num px-2 py-2.5 text-right text-label font-semibold text-ink">{h.reward7d.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}</td>
                  <td className="num px-2 py-2.5 text-right text-label font-medium text-navy">{h.rewardXrp.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}</td>
                  <td className="px-2 py-2.5"><Pill tone={tone}>{toneLabel[tone]}</Pill></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-6 pb-4 pt-3">
        <span className="num text-tiny font-normal text-mute">
          합계 보상(7D) {d.totals.reward7dRlusd.toLocaleString('ko-KR', { maximumFractionDigits: 1 })} RLUSD ≈ {d.totals.reward7dXrp.toLocaleString('ko-KR', { maximumFractionDigits: 1 })} XRP · 1 XRP = ${d.totals.xrpRate.toFixed(2)} (데모 환산)
        </span>
        <button type="button" className="text-meta font-medium text-navy hover:underline">거점·디바이스 상세 관리 →</button>
      </div>
    </Card>
  )
}


// 비교 트레이 (dcmap CompareTray 포인트) — 최대 3개 도시를 나란히 비교
function CompareTray({ hubs, onRemove, onClear }: {
  hubs: NodeHub[]
  onRemove: (name: string) => void
  onClear: () => void
}) {
  if (hubs.length === 0) return null
  return (
    <div className="fixed bottom-4 left-1/2 z-20 w-[min(860px,calc(100vw-32px))] -translate-x-1/2 rounded-2xl border border-line bg-panel shadow-2xl">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="text-label font-bold text-ink">거점 비교 <span className="num font-semibold text-mute">({hubs.length}/3)</span></span>
        <button type="button" onClick={onClear} className="text-meta font-semibold text-mute hover:text-bad">모두 지우기 ✕</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <tbody>
            {([
              ['거점', (h: NodeHub) => <span className="font-semibold text-ink">{flag[h.country]} {h.name} <button type="button" onClick={() => onRemove(h.name)} className="ml-1 text-mute hover:text-bad">✕</button></span>],
              ['등록 / 활성', (h: NodeHub) => <span className="num">{fmt(h.count)} / {fmt(h.active)}</span>],
              ['가동률 (7D)', (h: NodeHub) => <b className={`num font-bold ${toneOf(h.uptime) === 'ok' ? 'text-ok' : toneOf(h.uptime) === 'warn' ? 'text-warn' : 'text-bad'}`}>{h.uptime.toFixed(1)}%</b>],
              ['데이터 정결성', (h: NodeHub) => <span className="num font-semibold text-ink">{h.purity.toFixed(1)}%</span>],
              ['오프라인', (h: NodeHub) => <span className={`num font-semibold ${h.offline > 50 ? 'text-bad' : 'text-body'}`}>{fmt(h.offline)}대</span>],
              ['보상 (7D)', (h: NodeHub) => <span className="num">{h.reward7d.toLocaleString('ko-KR', { maximumFractionDigits: 1 })} RLUSD <span className="text-navy">≈ {h.rewardXrp.toLocaleString('ko-KR', { maximumFractionDigits: 1 })} XRP</span></span>],
            ] as [string, (h: NodeHub) => ReactNode][]).map(([label, cell]) => (
              <tr key={label} className="whitespace-nowrap border-b border-line-soft last:border-0">
                <td className="w-[110px] px-4 py-2 text-meta font-medium text-mute">{label}</td>
                {hubs.map(h => <td key={h.name} className="px-3 py-2 text-label text-body">{cell(h)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// 노드 섹션 통합 — 필터 상태를 지도·테이블이 공유 (dcmap FilterBar 패턴)
export function NodesSection() {
  const [status, setStatus] = useState<'all' | 'ok' | 'warn' | 'bad'>('all')
  const [region, setRegion] = useState<'all' | 'kr' | 'global'>('all')
  const [compare, setCompare] = useState<string[]>([])

  const filtered = d.hubs.filter(h =>
    (status === 'all' || toneOf(h.uptime) === status) &&
    (region === 'all' || (region === 'kr' ? h.country === 'KR' : h.country !== 'KR')))

  const toggleCompare = (name: string) =>
    setCompare(prev => prev.includes(name) ? prev.filter(n => n !== name) : prev.length >= 3 ? prev : [...prev, name])

  const chip = (active: boolean, disabled = false) =>
    `rounded-full border px-2.5 py-1 text-tiny font-semibold transition-colors ${
      active ? 'border-navy bg-navy text-white' : disabled ? 'border-line text-line' : 'border-line text-body hover:border-navy/40'}`

  const filterBar = (
    <span className="flex flex-wrap items-center gap-1">
      {([['all', '전체'], ['ok', '정상'], ['warn', '주의'], ['bad', '점검']] as const).map(([v, l]) => (
        <button key={v} type="button" onClick={() => setStatus(v)} className={chip(status === v)}>{l}</button>
      ))}
      <span className="mx-1 h-4 w-px bg-line" />
      {([['all', '전 지역'], ['kr', '국내'], ['global', '해외']] as const).map(([v, l]) => (
        <button key={v} type="button" onClick={() => setRegion(v)} className={chip(region === v)}>{l}</button>
      ))}
    </span>
  )

  return (
    <>
      <NodeMap hubs={filtered} filterBar={filterBar} />
      <IntegrityRewardStrip />
      <NodeRegionTable rows={filtered} compare={compare} onToggleCompare={toggleCompare} />
      <CompareTray hubs={d.hubs.filter(h => compare.includes(h.name))}
        onRemove={toggleCompare} onClear={() => setCompare([])} />
    </>
  )
}
