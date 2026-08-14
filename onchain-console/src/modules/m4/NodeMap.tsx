import { useState } from 'react'
import { Card, CardHeader } from '@/components/Card'
import { Pill } from '@/components/Pill'
import { Icon } from '@/components/Icon'
import { nodeMapDemo as d, NodeHub } from '@/demo/generators/m4'
import { landDots, koreaDots } from '@/demo/worldDots'

// 글로벌 노드 관리 맵 — 오픈맵 데이터(Natural Earth) 기반 도트 월드맵 + 거점 점 마커 + 라이브 티커.
// 지도는 빌드 타임에 구운 정적 좌표(등장방형 투영)로 자체 렌더링 — 런타임 외부 지도 서비스 미사용.
const fmt = (n: number) => n.toLocaleString('ko-KR')
const W = 360
const VB_Y = 16
const VB_H = 130
const px = (lon: number) => (lon + 180) / 360 * W
const py = (lat: number) => 90 - lat

const flag: Record<string, string> = { KR: '🇰🇷', JP: '🇯🇵', SG: '🇸🇬', GR: '🇬🇷', DE: '🇩🇪', GB: '🇬🇧', US: '🇺🇸', AU: '🇦🇺' }
const toneOf = (u: number) => (u >= 98 ? 'ok' : u >= 95 ? 'warn' : 'bad') as 'ok' | 'warn' | 'bad'
const toneColor = { ok: '#2FA870', warn: '#E0A63E', bad: '#E0574F' }
const toneLabel = { ok: '정상', warn: '주의', bad: '점검 필요' }

export function NodeMap() {
  const [sel, setSel] = useState<NodeHub | null>(null)
  const [view, setView] = useState<'world' | 'kr'>('world')
  const krHubs = d.hubs.filter(h => h.country === 'KR')
  const glHubs = d.hubs.filter(h => h.country !== 'KR')
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
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex overflow-hidden rounded-lg border border-line">
              {(['world', 'kr'] as const).map(v => (
                <button key={v} type="button" onClick={() => setView(v)}
                  className={`px-3 py-1 text-meta font-semibold transition-colors ${
                    view === v ? 'bg-navy-soft text-navy-deep' : 'text-mute hover:text-body'}`}>
                  {v === 'world' ? '전 세계' : '한국 (도시별)'}
                </button>
              ))}
            </div>
            <span className="num text-tiny font-normal text-mute">
              {view === 'world' ? `한국 ${krHubs.length}개 도시는 [한국] 뷰에서 확대됩니다` : `국내 ${krHubs.length}개 도시 · ${fmt(krCount)}대`}
            </span>
          </div>
          {view === 'world' ? (
            <svg viewBox={`0 ${VB_Y} ${W} ${VB_H}`} className="w-full rounded-lg border border-line-soft bg-bg/70" aria-label="글로벌 노드 분포 지도">
              {landDots.map(([lon, lat], i) => (
                <circle key={i} cx={px(lon)} cy={py(lat)} r={0.55} fill="#C3CCDC" />
              ))}
              {glHubs.map(h => {
                const tone = toneOf(h.uptime)
                const r = 1.6 + Math.sqrt(h.count) / 22
                const isSel = sel?.name === h.name
                return (
                  <g key={h.name} className="cursor-pointer" onClick={() => setSel(isSel ? null : h)}>
                    <title>{h.name} · {fmt(h.count)}대</title>
                    <circle cx={px(h.lon)} cy={py(h.lat)} r={r + 2.2} fill={toneColor[tone]} opacity={0.18} className="kw-pulse" />
                    <circle cx={px(h.lon)} cy={py(h.lat)} r={r} fill={toneColor[tone]}
                      stroke={isSel ? '#111C33' : '#FFFFFF'} strokeWidth={isSel ? 1 : 0.7} />
                  </g>
                )
              })}
              <g className="cursor-pointer" onClick={() => setView('kr')}>
                <title>대한민국 {krHubs.length}개 도시 · {fmt(krCount)}대 — 클릭하여 확대</title>
                <circle cx={px(127.6)} cy={py(36.3)} r={9} fill="#3E6FE0" opacity={0.16} className="kw-pulse" />
                <circle cx={px(127.6)} cy={py(36.3)} r={6.2} fill="#3E6FE0" stroke="#FFFFFF" strokeWidth={0.8} />
                <text x={px(127.6)} y={py(36.3) + 1.3} textAnchor="middle" fontSize={3.4} fontWeight={700} fill="#FFFFFF">KR</text>
              </g>
            </svg>
          ) : (
            <svg viewBox={`${px(124.2)} ${py(38.95)} ${px(130.7) - px(124.2)} ${py(32.95) - py(38.95)}`}
              className="w-full rounded-lg border border-line-soft bg-bg/70" aria-label="한국 도시별 노드 분포 지도">
              {koreaDots.map(([lon, lat], i) => (
                <circle key={i} cx={px(lon)} cy={py(lat)} r={0.062} fill="#C3CCDC" />
              ))}
              {krHubs.map(h => {
                const tone = toneOf(h.uptime)
                const r = 0.07 + Math.sqrt(h.count) / 640
                const isSel = sel?.name === h.name
                // 밀집 지역(수도권·동남권) 라벨 겹침 방지용 배치
                const lp = ({
                  서울: { dy: -0.2, end: false }, 성남: { dy: 0.06, end: false },
                  수원: { dy: 0.3, end: true }, 인천: { dy: -0.06, end: true },
                  창원: { dy: 0.12, end: true }, 부산: { dy: 0.02, end: false },
                  울산: { dy: -0.12, end: false }, 광주: { dy: 0.02, end: true },
                } as Record<string, { dy: number; end: boolean }>)[h.name] ?? { dy: 0.02, end: false }
                return (
                  <g key={h.name} className="cursor-pointer" onClick={() => setSel(isSel ? null : h)}>
                    <title>{h.name} · {fmt(h.count)}대 · 가동률 {h.uptime.toFixed(1)}%</title>
                    <circle cx={px(h.lon)} cy={py(h.lat)} r={r + 0.09} fill={toneColor[tone]} opacity={0.18} className="kw-pulse" />
                    <circle cx={px(h.lon)} cy={py(h.lat)} r={r} fill={toneColor[tone]}
                      stroke={isSel ? '#111C33' : '#FFFFFF'} strokeWidth={isSel ? 0.045 : 0.028} />
                    <text x={px(h.lon) + (lp.end ? -(r + 0.1) : r + 0.1)} y={py(h.lat) + lp.dy + 0.07}
                      textAnchor={lp.end ? 'end' : 'start'} fontSize={0.22}
                      fontWeight={isSel ? 700 : 500} fill={isSel ? '#111C33' : '#3D4A63'}>{h.name}</text>
                  </g>
                )
              })}
            </svg>
          )}

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

export function NodeRegionTable() {
  return (
    <Card className="mt-4">
      <CardHeader
        title="거점별 관리 현황"
        formula={'상태 = 가동률(7D) 구간 · 정결성 = 검증 통과 데이터 비율\n보상(7D)은 활성 대수·품질 점수 비례 배분'}
        action={<span className="num text-meta text-mute">등록 {fmt(d.totals.registered)}대 · {d.hubs.length}개 거점</span>}
      />
      <div className="overflow-x-auto px-4">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="whitespace-nowrap border-b border-line text-left text-meta font-medium text-mute">
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
            {d.hubs.map(h => {
              const tone = toneOf(h.uptime)
              return (
                <tr key={h.name} className="whitespace-nowrap border-b border-line-soft last:border-0">
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
