import { useState } from 'react'
import { Card, CardHeader, GhostButton, FooterLinkButton } from '@/components/Card'
import { KpiCard, ProgressBar } from '@/components/KpiCard'
import { PageHeader, UpdatedMeta, DownloadButton } from '@/components/PageHeader'
import { AreaChart, Donut } from '@/components/charts'
import { Icon } from '@/components/Icon'
import { FormulaTip } from '@/components/FormulaTip'
import { m2Demo as d } from '@/demo/generators/m2'

function HashLink({ text }: { text: string }) {
  return (
    <span className="num inline-flex cursor-pointer items-center gap-1 text-label font-medium text-navy hover:underline" title="익스플로러 (데모)">
      {text} <Icon name="external" size={11} />
    </span>
  )
}

export function M2Page() {
  const [range, setRange] = useState(d.timeseries.activeRange)

  return (
    <>
      <PageHeader
        title={<span className="inline-flex items-center gap-2">M2 정산 지수 (VWI-SEOUL-TEMP) <FormulaTip formula={'VWI = Σ(wᵢ·Tᵢ) / Σwᵢ\n활성 관측소 신뢰도 가중 평균'} /></span>}
        subtitle="KWeather Verification Index (VWI)는 다수 기상 관측소의 데이터를 집계·필터링하여 산출한 정산용 온도 지수입니다."
        meta={<UpdatedMeta text={`최근 업데이트: ${d.updatedAgo}`} />}
        actions={<><GhostButton>지수 레지스트리 관리 <Icon name="gear" size={14} /></GhostButton><DownloadButton /></>}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard icon="thermo" label="현재 지수 (금일 최신)" formula={'VWI = Σ(wᵢ·Tᵢ) / Σwᵢ'}
          value={d.kpis.current.value} unit={d.kpis.current.unit}
          delta={{ text: d.kpis.current.delta, tone: 'ok' }} deltaLabel=""
          spark={d.kpis.current.spark}
          footer={<div className="num text-meta text-mute">{d.kpis.current.basis}</div>} />
        <KpiCard icon="audit" label="오늘 확정 스냅샷" formula={'count(vwi_snapshots)\nwhere captured_at::date=today and status=final'}
          value={d.kpis.snapshots.value} unit={d.kpis.snapshots.unit}
          sub={d.kpis.snapshots.sub} />
        <KpiCard icon="network" label="활성 관측소" formula={'stations_active / stations_total'}
          value={<>{d.kpis.stations.active} <span className="text-h3 font-semibold text-mute">/ {d.kpis.stations.total}</span></>}
          footer={
            <div className="flex items-center gap-2.5">
              <span className="num shrink-0 text-meta text-body">{d.kpis.stations.ratioText}</span>
              <ProgressBar ratio={d.kpis.stations.ratio} />
            </div>
          } />
        <KpiCard icon="drop" label="이상치 제거" formula={'outliers_removed\n(3σ 초과 관측 제외)'}
          value={d.kpis.outliers.value} unit={d.kpis.outliers.unit}
          sub={d.kpis.outliers.sub} spark={d.kpis.outliers.spark} sparkColor="#E0574F" />
        <KpiCard icon="badge" label="앵커 상태 (XRPL)" formula={'최근 스냅샷 payload_hash의\n체인 기록 여부'}
          value={<span className="text-[21px] text-ok">Anchored</span>}
          footer={
            <div className="flex items-center justify-between text-meta text-mute">
              마지막 앵커 <HashLink text={d.kpis.anchor.lastTx} />
            </div>
          } />
        <KpiCard icon="registry" label="최근 앵커 네트워크" formula={'vwi_snapshots.anchor_network'}
          value={<span className="text-[21px]">{d.kpis.network.name}</span>}
          footer={
            <div className="flex items-center justify-between text-meta text-mute">
              Ledger Index <HashLink text={d.kpis.network.ledgerIndex} />
            </div>
          } />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1.15fr_1.1fr]">
        <Card>
          <CardHeader
            title={<>지수 시계열 <span className="font-medium text-mute">(최근 7일)</span></>}
            action={
              <span className="flex items-center gap-2">
                <span className="flex overflow-hidden rounded-lg border border-line">
                  {d.timeseries.ranges.map(r => (
                    <button key={r} type="button" onClick={() => setRange(r)}
                      className={`num px-2.5 py-1 text-meta font-semibold transition-colors ${
                        range === r ? 'bg-navy-soft text-navy-deep' : 'text-mute hover:text-body'}`}>
                      {r}
                    </button>
                  ))}
                </span>
                <GhostButton>상세 차트 <Icon name="external" size={12} /></GhostButton>
              </span>
            }
          />
          <div className="px-2 pb-1 pl-4 text-meta text-mute">(°C)</div>
          <div className="px-4 pb-4">
            <AreaChart data={d.timeseries.data} height={230}
              yTicks={d.timeseries.yTicks} yFmt={v => `${v}°C`} xLabels={d.timeseries.xLabels} />
          </div>
        </Card>

        <Card>
          <CardHeader title={<>지수 구성 현황 <span className="font-medium text-mute">(금일)</span></>} />
          <div className="flex items-center gap-5 px-5 pb-3">
            <Donut size={150} thickness={26} centerTop="총 관측소" centerBottom={`${d.composition.total}`}
              segments={d.composition.segments.map(s => ({ value: s.value, color: s.color }))} />
            <div className="flex-1 space-y-2.5">
              {d.composition.segments.map(s => (
                <div key={s.label} className="flex items-center justify-between gap-2 whitespace-nowrap text-tiny font-normal">
                  <span className="flex items-center gap-1.5 text-body">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />{s.label}
                  </span>
                  <span className="num shrink-0 font-semibold text-ink">{s.count} <span className="font-normal text-mute">({s.pct})</span></span>
                </div>
              ))}
            </div>
          </div>
          <div className="px-4 pb-4 pt-1">
            <FooterLinkButton>관측소 현황 보기 →</FooterLinkButton>
          </div>
        </Card>

        <Card>
          <CardHeader title={<>오늘 스냅샷 목록 <span className="font-medium text-mute">(최신 5건)</span></>} />
          <div className="px-4">
            <table className="w-full">
              <thead>
                <tr className="border-b border-line text-left text-meta font-medium text-mute">
                  <th className="px-2 py-2 font-medium">시간 (KST)</th>
                  <th className="px-2 py-2 text-right font-medium">지수 (°C)</th>
                  <th className="px-2 py-2 font-medium">상태</th>
                  <th className="px-2 py-2 font-medium">앵커 TX</th>
                </tr>
              </thead>
              <tbody>
                {d.todaySnapshots.map(s => (
                  <tr key={s.tx} className="border-b border-line-soft last:border-0">
                    <td className="num px-2 py-2.5 text-label text-body">{s.time}</td>
                    <td className="num px-2 py-2.5 text-right text-label font-semibold text-ink">{s.value}</td>
                    <td className="px-2 py-2.5 text-label text-body">{s.status}</td>
                    <td className="px-2 py-2.5"><HashLink text={s.tx} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4 pt-3">
            <FooterLinkButton>전체 스냅샷 보기 →</FooterLinkButton>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[2.1fr_1fr]">
        <Card>
          <CardHeader title={<>최근 앵커 이력 <span className="font-medium text-mute">(XRPL Mainnet)</span></>} />
          <div className="overflow-x-auto px-4">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="text-left text-meta font-medium text-mute">
                  <th rowSpan={2} className="px-2 pb-2 align-bottom font-medium">앵커 시간 (KST)</th>
                  <th rowSpan={2} className="px-2 pb-2 text-right align-bottom font-medium">지수 (°C)</th>
                  <th rowSpan={2} className="px-2 pb-2 text-right align-bottom font-medium">스냅샷 수</th>
                  <th colSpan={3} className="border-b border-line-soft px-2 pb-1.5 text-center font-medium">관측소 수</th>
                  <th rowSpan={2} className="px-2 pb-2 align-bottom font-medium">Payload Hash (IPFS)</th>
                  <th rowSpan={2} className="px-2 pb-2 align-bottom font-medium">Anchor TX</th>
                  <th rowSpan={2} className="px-2 pb-2 text-right align-bottom font-medium">Ledger Index</th>
                </tr>
                <tr className="text-meta font-medium text-mute">
                  <th className="px-2 py-1.5 text-right font-medium">전체</th>
                  <th className="px-2 py-1.5 text-right font-medium">활성</th>
                  <th className="px-2 py-1.5 text-right font-medium">이상치 제거</th>
                </tr>
              </thead>
              <tbody>
                {d.anchors.map(a => (
                  <tr key={a.tx} className="border-t border-line-soft">
                    <td className="num px-2 py-2.5 text-label text-body">{a.at}</td>
                    <td className="num px-2 py-2.5 text-right text-label font-semibold text-ink">{a.value}</td>
                    <td className="num px-2 py-2.5 text-right text-label text-body">{a.snaps}</td>
                    <td className="num px-2 py-2.5 text-right text-label text-body">{a.total}</td>
                    <td className="num px-2 py-2.5 text-right text-label text-body">{a.active}</td>
                    <td className="num px-2 py-2.5 text-right text-label text-body">{a.removed}</td>
                    <td className="px-2 py-2.5"><HashLink text={a.payload} /></td>
                    <td className="px-2 py-2.5"><HashLink text={a.tx} /></td>
                    <td className="num px-2 py-2.5 text-right text-label text-body">{a.ledger}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4 pt-3">
            <FooterLinkButton>전체 보기 →</FooterLinkButton>
          </div>
        </Card>

        <Card>
          <CardHeader title={<span className="inline-flex items-center gap-2">지수 산식 <FormulaTip formula={'가중 평균 — 신뢰도 기반 가중치,\n이상치(3σ 초과) 제거 후 산출'} /></span>} />
          <div className="mx-5 rounded-lg border border-line bg-navy-tint px-4 py-5">
            <div className="flex items-center justify-center gap-3 font-serif italic text-ink">
              <span className="text-[19px]">VWI =</span>
              <span className="inline-flex flex-col items-center">
                <span className="num flex items-center gap-1 border-b border-ink/70 px-2 pb-1 text-[15px]">
                  <span className="inline-flex flex-col items-center leading-none">
                    <span className="text-[9px] not-italic">n</span>
                    <span className="text-[17px]">Σ</span>
                    <span className="text-[9px] not-italic">i=1</span>
                  </span>
                  <span>w<sub className="text-[10px]">i</sub> · T<sub className="text-[10px]">i</sub></span>
                </span>
                <span className="num flex items-center gap-1 px-2 pt-1 text-[15px]">
                  <span className="inline-flex flex-col items-center leading-none">
                    <span className="text-[9px] not-italic">n</span>
                    <span className="text-[17px]">Σ</span>
                    <span className="text-[9px] not-italic">i=1</span>
                  </span>
                  <span>w<sub className="text-[10px]">i</sub></span>
                </span>
              </span>
            </div>
          </div>
          <ul className="space-y-2 px-6 py-4 text-meta leading-relaxed text-body">
            <li className="flex gap-2"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-navy" /><span><i>T<sub>i</sub></i> : 관측소 i의 온도 (°C)</span></li>
            <li className="flex gap-2"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-navy" /><span><i>w<sub>i</sub></i> : 관측소 i의 가중치 (신뢰도 기반)</span></li>
            <li className="flex gap-2"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-navy" /><span><i>n</i> : 활성 관측소 수 (이상치 제거 후)</span></li>
          </ul>
          <div className="px-4 pb-4">
            <FooterLinkButton>산식 및 방법론 보기 →</FooterLinkButton>
          </div>
        </Card>
      </div>
    </>
  )
}
