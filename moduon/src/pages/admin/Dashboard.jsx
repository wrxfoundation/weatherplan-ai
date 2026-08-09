// ─── S-21 본사 어드민 통합 대시보드 (목업 1 구조 재현) ────────────
// 규모 지표는 목업 기준 데모 수치, 승인 큐·리드·정책값은 실데이터 연동.
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore, adminStats } from '../../lib/store'
import { won, minutesAgo, monthKey } from '../../lib/engine'
import { UNITS, catBySlug } from '../../lib/constants'
import { adminBrief } from '../../lib/ai'
import { KpiCard, Card, DeltaChip, useToast, Btn } from '../../components/ui'
import { Donut, Legend, LineChart, HBars, CHART } from '../../components/charts'
import { AiInsight } from '../../components/AiPanel'
import OpsMap from '../../components/OpsMap'
import { IcStore } from '../../components/icons'

export default function AdminDashboard() {
  const { db, dispatch } = useStore()
  const toast = useToast()
  const s = adminStats(db)

  // AI 경영 브리핑용 실데이터 집계 (권역 공석·SLA·전환·수요)
  const brief = useMemo(() => {
    const byUnit = {}
    for (const u of UNITS) byUnit[u.code] = { name: u.name, active: 0 }
    for (const t of db.tenants) { const e = byUnit[t.unit]; if (e && t.status === '활성') e.active++ }
    const vacant = Object.values(byUnit).filter((u) => u.active === 0).map((u) => u.name)
    const overdue = db.leads.filter((l) => l.status === '접수' && minutesAgo(l.createdAt) >= 10).length
    const conv = db.leads.length ? Math.round((s.done.length / db.leads.length) * 100) : 0
    const cc = {}
    db.leads.forEach((l) => { cc[l.cat] = (cc[l.cat] ?? 0) + 1 })
    const topCat = Object.entries(cc).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c, n]) => ({ name: catBySlug(c)?.name ?? c, n }))
    return { totalSales: s.totalSales, feeIncome: s.feeIncome, monthlyFees: s.monthlyFees, leadsToday: s.leadsToday.length, conv, overdue, activeCount: s.active.length, pendingApps: s.pendingApps.length, vacant, topCat }
  }, [db, s])

  // 이번 달 분양 매출 — 실데이터: 이달 개설 몰 × 분양비 + 활성 몰 × 월 이용료 (승인 즉시 반영)
  const newThisMonth = db.tenants.filter((t) => monthKey(t.openedAt) === monthKey()).length
  const joinRev = newThisMonth * db.policies.joinFee
  const feeRev = s.active.length * db.policies.monthlyFee

  const salesSeries = [86, 92, 104, 98, 118, 124, 129]
  const orderSeries = [2100, 2350, 2600, 2480, 2950, 3120, 3248]
  const labels = [...Array(7)].map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000)
    return `${d.getMonth() + 1}/${d.getDate()}`
  })

  const approve = (id, name) => {
    dispatch({ type: 'APPROVE_APPLICATION', id })
    toast(`${name} 분양을 승인했어요 — 몰이 개설됩니다`)
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* 타이틀 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-[-0.4px] text-bink">분양몰 사업 현황 대시보드</h1>
          <p className="mt-1 text-[13px] text-bmuted">전국 분양·운영·수익·AI 현황을 한눈에 — 데모 수치 포함</p>
        </div>
        <span className="hidden rounded-card bg-tint p-3.5 text-primary-text lg:block"><IcStore size={30} sw={1.6} /></span>
      </div>

      {/* KPI 4 */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="총 분양몰" value={1248} suffix="개" delta={18.7} caption={`실 데모 테넌트 ${db.tenants.length}개 연동`} />
        <Card track="b" className="p-5 animate-rise">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-bmuted">분양 완료 · 분양률</span>
            <DeltaChip value={4.2} />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div>
              <div className="tnum text-[26px] font-extrabold text-bink">1,063<span className="text-[15px]">개</span></div>
              <div className="tnum mt-1 text-[12px] text-bfaint">분양률 85.3%</div>
            </div>
            <Donut size={64} thickness={9} data={[{ label: '완료', value: 85.3, color: CHART.primary }, { label: '잔여', value: 14.7, color: CHART.rest }]} />
          </div>
        </Card>
        <KpiCard label="이번 달 총 매출" value={1248560000} suffix="원" delta={22.5} caption={`실 테넌트 합산 ${won(s.totalSales)}`} />
        <KpiCard label="총 누적 수익" value={12485600000} suffix="원" delta={31.2} caption="분양비+이용료+수수료 누계" />
      </div>

      <div className="mt-4">
        <AiInsight
          title="AI 경영 브리핑"
          desc="오늘의 매출·리드·SLA·권역 공석·수요를 읽고 본사가 바로 실행할 우선 조치를 제안합니다."
          cta="오늘의 브리핑 생성"
          build={() => adminBrief(brief)}
        />
      </div>

      <div className="mt-4">
        <OpsMap />
      </div>

      {/* 분양 및 운영 현황 */}
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[3fr_2fr]">
        <Card track="b" className="p-5">
          <h2 className="text-[15.5px] font-extrabold text-bink">분양 및 운영 현황 — 권역별</h2>
          <div className="mt-4">
            <HBars data={[
              { label: '경기', value: 312, color: CHART.primary },
              { label: '경상', value: 244, color: CHART.indigo },
              { label: '서울', value: 238, color: CHART.primary },
              { label: '전라', value: 198, color: CHART.indigo },
              { label: '충청', value: 156, color: CHART.purple },
              { label: '기타', value: 100, color: CHART.rest },
            ]} format={(v) => `${v}개`} />
          </div>
          <div className="mt-5 flex items-center gap-5 border-t border-brow pt-4">
            <Donut data={[
              { label: '분양 완료', value: 1063, color: CHART.primary },
              { label: '상담 대기', value: 128, color: CHART.warn },
              { label: '분양 가능', value: 57, color: CHART.rest },
            ]} centerTop="85.3%" centerSub="분양률" />
            <Legend data={[
              { label: '분양 완료', value: 1063, color: CHART.primary },
              { label: '상담 대기', value: 128, color: CHART.warn },
              { label: '분양 가능', value: 57, color: CHART.rest },
            ]} className="flex-1" />
          </div>
        </Card>

        {/* 우측: 신규 분양 신청 큐 (실데이터) */}
        <div className="flex flex-col gap-4">
          <Card track="b" className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[15.5px] font-extrabold text-bink">신규 분양 신청</h2>
              <span className="tnum rounded-full bg-warn/10 px-2.5 py-1 text-[11.5px] font-bold text-warn">{s.pendingApps.length}건 대기</span>
            </div>
            <div className="mt-3 flex flex-col gap-2.5">
              {s.pendingApps.slice(0, 3).map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-field border border-bline p-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold text-bink">{a.wantName} <span className="font-medium text-bfaint">({a.wantSlug})</span></div>
                    <div className="text-[11.5px] text-bfaint">{a.name} · {a.type} · {a.sigungu}</div>
                  </div>
                  <button onClick={() => approve(a.id, a.wantName)} className="h-8 shrink-0 rounded-full bg-primary px-3.5 text-[11.5px] font-bold text-white hover:bg-primary-hover">승인하기</button>
                </div>
              ))}
              {s.pendingApps.length === 0 && <div className="py-4 text-center text-[12.5px] text-bfaint">대기 중인 신청이 없어요</div>}
            </div>
            <Link to="/admin/tenants" className="mt-3 flex h-9 items-center justify-center rounded-field border border-bline text-[12.5px] font-bold text-bbody hover:border-primary hover:text-primary-text">분양 관리 전체 보기</Link>
          </Card>

          <Card track="b" className="p-5">
            <h2 className="text-[15.5px] font-extrabold text-bink">이번 달 분양 매출</h2>
            <div className="mt-3 flex flex-col gap-2 text-[13px]">
              <div className="flex justify-between"><span className="text-bmuted">신규 분양비 ({newThisMonth}건)</span><span className="tnum font-bold text-bink">{won(joinRev)}</span></div>
              <div className="flex justify-between"><span className="text-bmuted">월 이용료 ({s.active.length}몰)</span><span className="tnum font-bold text-bink">{won(feeRev)}</span></div>
              <div className="mt-1 flex justify-between border-t border-brow pt-2"><span className="font-bold text-bink">분양 부문 합계</span><span className="tnum font-extrabold text-primary-text">{won(joinRev + feeRev)}</span></div>
            </div>
            <p className="mt-2 text-[11px] text-bfaint">실데이터 기준 · 데모 규모 아님</p>
          </Card>
        </div>
      </div>

      {/* 몰 운영 및 매출 현황 */}
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[3fr_2fr]">
        <Card track="b" className="p-5">
          <h2 className="text-[15.5px] font-extrabold text-bink">몰 운영 및 매출 현황</h2>
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { l: '활성 몰', v: '1,004개' },
              { l: '오늘 주문', v: '3,248건' },
              { l: '오늘 매출', v: '1.28억원' },
              { l: '고객 만족도', v: '4.8점' },
            ].map((k) => (
              <div key={k.l} className="rounded-field bg-brow px-3 py-2.5">
                <div className="text-[11px] font-medium text-bmuted">{k.l}</div>
                <div className="tnum mt-0.5 text-[15.5px] font-extrabold text-bink">{k.v}</div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <LineChart
              labels={labels}
              series={[
                { label: '매출(백만원)', color: CHART.primary, values: salesSeries, fill: true },
                { label: '주문(건)', color: CHART.warn, values: orderSeries.map((v) => v / 30) },
              ]}
            />
          </div>
        </Card>

        {/* 수익 현황 + 지급 도넛 */}
        <div className="flex flex-col gap-4">
          <Card track="b" className="p-5">
            <h2 className="text-[15.5px] font-extrabold text-bink">수익 현황 (이번 달)</h2>
            <div className="mt-3 flex flex-col gap-2 text-[13px]">
              <div className="flex justify-between"><span className="text-bmuted">몰 운영 수수료 ({Math.round(db.policies.feeRate * 100)}%)</span><span className="tnum font-bold text-bink">{won(124856000)}</span></div>
              <div className="flex justify-between"><span className="text-bmuted">광고 수익</span><span className="tnum font-bold text-bink">{won(18200000)}</span></div>
              <div className="flex justify-between"><span className="text-bmuted">기타 (교육·부가서비스)</span><span className="tnum font-bold text-bink">{won(5590000)}</span></div>
              <div className="mt-1 flex items-baseline justify-between rounded-field bg-tint px-3 py-2.5">
                <span className="font-bold text-primary-text">예상 수익 합계</span>
                <span className="tnum text-[17px] font-extrabold text-primary-text">{won(148646000)}</span>
              </div>
            </div>
          </Card>
          <Card track="b" className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[15.5px] font-extrabold text-bink">파트너 지급 현황</h2>
              <Link to="/admin/settlements" className="text-[12px] font-bold text-primary-text">지급 관리 →</Link>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <Donut size={96} thickness={14} data={[
                { label: '지급 완료', value: 832, color: CHART.ok },
                { label: '지급 대기', value: 156, color: CHART.warn },
                { label: '지급 예정', value: 72, color: CHART.rest },
              ]} centerTop="1,060" centerSub="전체 건" />
              <Legend data={[
                { label: '지급 완료', value: 832, color: CHART.ok },
                { label: '지급 대기', value: 156, color: CHART.warn },
                { label: '지급 예정', value: 72, color: CHART.rest },
              ]} className="flex-1" />
            </div>
          </Card>
        </div>
      </div>

      {/* AI 운영 현황 4카드 */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-extrabold text-bink">AI 운영 현황</h2>
          <Link to="/admin/ai" className="text-[12.5px] font-bold text-primary-text">상세 보기 →</Link>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card track="b" className="p-4">
            <div className="text-[12.5px] font-bold text-bmuted">자동화 운영률</div>
            <div className="mt-2 flex items-center gap-3">
              <Donut size={62} thickness={9} data={[{ label: 'auto', value: 92.5, color: CHART.ok }, { label: 'rest', value: 7.5, color: CHART.rest }]} centerTop="92.5%" />
              <ul className="text-[11px] leading-4 text-bbody">
                <li>✓ 리드 배정</li><li>✓ 상담 1차 응대</li><li>✓ 정산 집계</li>
              </ul>
            </div>
          </Card>
          <Card track="b" className="p-4">
            <div className="text-[12.5px] font-bold text-bmuted">챗봇 상담 (오늘)</div>
            <div className="tnum mt-2 text-[22px] font-extrabold text-bink">1,248<span className="text-[13px]">건</span></div>
            <div className="mt-1 text-[11.5px] text-bfaint">AI 해결률 <strong className="text-ok">92.1%</strong> · 평균 응답 18초</div>
          </Card>
          <Card track="b" className="p-4">
            <div className="text-[12.5px] font-bold text-bmuted">자동 분류 (이번 주)</div>
            <div className="tnum mt-2 text-[22px] font-extrabold text-bink">12,856<span className="text-[13px]">건</span></div>
            <div className="mt-1 text-[11.5px] text-bfaint">주문 62% · 문의 24% · 클레임 9% · 기타 5%</div>
          </Card>
          <Card track="b" className="p-4">
            <div className="text-[12.5px] font-bold text-bmuted">AI 추천 인사이트</div>
            <p className="mt-2 text-[12px] leading-[18px] text-bbody">"인기 상품 TOP5를 메인에 노출하면 매출 <strong className="text-ok">+15%</strong> 추정" 외 2건</p>
            <Link to="/admin/ai" className="mt-1.5 inline-block text-[11.5px] font-bold text-primary-text">근거 데이터 →</Link>
          </Card>
        </div>
      </div>

      {/* 분양 & 수익 구조 다이어그램 */}
      <Card track="b" className="mt-4 p-5 sm:p-6">
        <h2 className="text-[15.5px] font-extrabold text-bink">분양 & 수익 구조</h2>
        <div className="mt-4 grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1.3fr_auto_1fr]">
          <div className="rounded-card border border-bline p-4">
            <div className="text-[12px] font-bold text-bmuted">사업자 (파트너)</div>
            <div className="tnum mt-1.5 text-[14px] font-extrabold text-bink">초기 {won(db.policies.joinFee)}</div>
            <div className="tnum text-[13px] font-bold text-bbody">+ 월 {won(db.policies.monthlyFee)}</div>
            <div className="mt-1.5 text-[11px] text-bfaint">분양 신청 → 심사 → 개설</div>
          </div>
          <div className="hidden items-center text-[18px] text-bfaint lg:flex">→</div>
          <div className="rounded-card bg-tint p-4">
            <div className="text-[12px] font-bold text-primary-text">모두온 플랫폼</div>
            <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[11.5px] font-semibold text-bbody">
              <span>· 몰 제공</span><span>· 상품 공급</span><span>· AI 운영</span><span>· 마케팅</span><span>· 리드 배정</span><span>· 정산 관리</span>
            </div>
          </div>
          <div className="hidden items-center text-[18px] text-bfaint lg:flex">→</div>
          <div className="rounded-card border border-bline p-4">
            <div className="text-[12px] font-bold text-bmuted">파트너 수익 예시</div>
            <div className="mt-1.5 text-[11.5px] text-bfaint">월 매출 1,000만원 기준</div>
            <div className="tnum text-[12px] text-bbody">수수료 −{Math.round(10000000 * db.policies.feeRate / 10000)}만 · 이용료 −{Math.round(db.policies.monthlyFee / 10000)}만</div>
            <div className="tnum mt-1 text-[17px] font-extrabold text-primary-text">순수익 {Math.round((10000000 * (1 - db.policies.feeRate) - db.policies.monthlyFee) / 10000)}만원</div>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-bfaint">수익 예시는 실제 수익을 보장하지 않습니다. 수익 구조: 수수료 {Math.round(db.policies.feeRate * 100)}% · 광고 · 기타.</p>
      </Card>
    </div>
  )
}
