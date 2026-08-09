// ─── 본사 어드민 · 경영 전략 파트 (사업기획서 v4 요소 통합) ──────────
// 3계층 구조·AI 등급제 메뉴판·수익 다각화 로드맵·데이터 플라이휠을
// 한 화면에 모아 본사 경영진이 사업 로드맵을 관제한다.
import { useStore, adminStats } from '../../lib/store'
import { won, num, SAUP_TIERS } from '../../lib/engine'
import { UNITS } from '../../lib/constants'
import { Card } from '../../components/ui'

const STATUS = {
  운영중: 'bg-ok/10 text-ok',
  준비: 'bg-tint text-primary-text',
  기획: 'bg-warn/10 text-warn',
}
function Tag({ s }) {
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS[s] ?? 'bg-brow text-bmuted'}`}>{s}</span>
}

const AI_MENU = [
  { area: '소비자 상담 "모비"', role: '1차 응대·실시간 견적', tier: 'Haiku 4.5 ↔ Opus 라우팅', s: '운영중' },
  { area: '소비자 진단 심화', role: '절감 우선순위 내러티브', tier: 'Claude Opus 5', s: '운영중' },
  { area: '셀러 설계 어시스턴트', role: '최적 구성·상담 스크립트', tier: 'Claude Opus 5', s: '운영중' },
  { area: '본사 경영 브리핑', role: '우선 조치·이상 신호', tier: 'Claude Opus 5', s: '운영중' },
  { area: '총판 지역수요 예측', role: '권역 수요·셀러 코칭', tier: 'Claude Opus 5', s: '준비' },
  { area: '리드 스코어링·이상거래', role: '전환확률·부정 탐지', tier: 'Sonnet ↔ Opus', s: '기획' },
]

const REVENUE = [
  { t: '포인트 · 복지몰', s: '기획', why: '적립·제휴 복지몰로 재구매·리텐션 강화, 락인 확대', kpi: '재구매율 · MAU' },
  { t: '중고폰 매입', s: '준비', why: '번호이동 결합 시 단말 매입 → 부가 마진 + 전환율 상승', kpi: '건당 마진 · 결합률' },
  { t: '카드 결합 청구할인', s: '준비', why: '제휴카드 청구할인으로 통신 결합 시너지·월 납부 절감', kpi: '결합 발급 · ARPU' },
  { t: '금융 리드 송출', s: '기획', why: '대출·보험 제휴 리드 송출 → 고마진 부가 수익', kpi: '리드 단가 · 승인율' },
]

const FLYWHEEL = [
  { n: '유입 데이터', d: '리드·상담·정산' },
  { n: 'AI 학습·개선', d: '프롬프트·정책 튜닝' },
  { n: '전환·자동화 ↑', d: '응대속도·설계품질' },
  { n: '데이터량 ↑', d: '표본 확대·정밀도' },
]

export default function AdminBiz() {
  const { db } = useStore()
  const s = adminStats(db)
  const p = db.policies
  const activeUnits = new Set(db.tenants.filter((t) => t.status === '활성').map((t) => t.unit)).size

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-[-0.4px] text-bink">경영 전략 · 사업 로드맵</h1>
          <p className="mt-1 text-[13px] text-bmuted">사업기획서 v4 기반 — 3계층 구조 · AI 등급제 · 수익 다각화 · 데이터 플라이휠</p>
        </div>
        <span className="hidden rounded-card bg-tint px-4 py-3 text-[26px] lg:block">🧭</span>
      </div>

      {/* 1. 3계층 사업 구조 */}
      <Card track="b" className="mt-4 p-5 sm:p-6">
        <h2 className="text-[15.5px] font-extrabold text-bink">3계층 사업 구조 <span className="text-[12.5px] font-semibold text-bmuted">· 본사 → 총판 → 셀러</span></h2>
        <div className="mt-4 grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <Layer title="본사 (플랫폼)" tone="text-primary-text" lines={['상품 공급 · AI 운영 · 마케팅 · 정산', '리드 배정 엔진 · 관제']} foot={`수익: 사업권 분양 + 수수료 ${Math.round(p.feeRate * 100)}% + 월 이용료`} />
          <Arrow />
          <Layer title="총판 (영업단)" tone="text-bindigo" lines={['권역 총괄 · 셀러 모집 · 1차 배정', `전국 ${UNITS.length}개 영업단`]} foot={`현황: ${activeUnits}/${UNITS.length} 권역 운영 중`} badge={`${activeUnits}/${UNITS.length}`} />
          <Arrow />
          <Layer title="셀러 (대리점)" tone="text-ok" lines={['비교 판매 · 고객 상담 · 개통 관리', '내 브랜드 분양몰 운영']} foot={`가입비 ${won(p.joinFee)} + 월 ${won(p.monthlyFee)}`} />
        </div>

        {/* 사업권(총판) 권역별 시세 */}
        <div className="mt-5 rounded-field border border-bline">
          <div className="border-b border-bline px-4 py-2.5 text-[13px] font-bold text-bink">사업권(총판) 권역별 분양가</div>
          <div className="grid grid-cols-2 gap-px bg-bline sm:grid-cols-4">
            {SAUP_TIERS.map((t) => (
              <div key={t.label} className="bg-white px-4 py-3">
                <div className="text-[11.5px] text-bmuted">{t.label}</div>
                <div className="tnum mt-0.5 text-[15px] font-extrabold text-bink">{won(t.price)}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 2. AI 등급제 메뉴판 */}
      <Card track="b" className="mt-4 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[15.5px] font-extrabold text-bink">AI 등급제 메뉴판 <span className="text-[12.5px] font-semibold text-bmuted">· 역할별 티어 배분</span></h2>
          <span className="text-[11.5px] text-bfaint">기획서 TABLE 2 기준</span>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-[13px]">
            <thead className="text-[11.5px] text-bfaint">
              <tr className="border-b border-bline">
                <th className="px-2 py-2 text-left font-semibold">적용 영역</th>
                <th className="px-2 py-2 text-left font-semibold">역할</th>
                <th className="px-2 py-2 text-left font-semibold">AI 티어</th>
                <th className="px-2 py-2 text-right font-semibold">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bline">
              {AI_MENU.map((r) => (
                <tr key={r.area}>
                  <td className="px-2 py-2.5 font-bold text-bink">{r.area}</td>
                  <td className="px-2 py-2.5 text-bbody">{r.role}</td>
                  <td className="px-2 py-2.5"><span className="rounded bg-tint px-1.5 py-0.5 text-[11.5px] font-semibold text-primary-text">{r.tier}</span></td>
                  <td className="px-2 py-2.5 text-right"><Tag s={r.s} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-bfaint">단순 질의는 경량 모델, 설계·경영·진단 등 고난도는 Opus로 라우팅해 품질과 비용을 동시 최적화합니다.</p>
      </Card>

      {/* 3. 수익 다각화 로드맵 */}
      <div className="mt-4">
        <h2 className="text-[16px] font-extrabold text-bink">수익 다각화 로드맵</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {REVENUE.map((r) => (
            <Card key={r.t} track="b" className="flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="text-[14.5px] font-extrabold text-bink">{r.t}</div>
                <Tag s={r.s} />
              </div>
              <p className="mt-2 flex-1 text-[12.5px] leading-[19px] text-bbody">{r.why}</p>
              <div className="mt-3 border-t border-bline pt-2 text-[11px] text-bfaint">KPI · {r.kpi}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* 4. 데이터 플라이휠 */}
      <Card track="b" className="mt-4 p-5 sm:p-6">
        <h2 className="text-[15.5px] font-extrabold text-bink">데이터 플라이휠 <span className="text-[12.5px] font-semibold text-bmuted">· 쌓일수록 강해지는 해자</span></h2>
        <p className="mt-1 max-w-2xl text-[13px] leading-[21px] text-bbody">
          리드·상담·정산 데이터가 쌓일수록 AI가 정교해지고, 전환율과 자동화가 올라가며, 다시 데이터가 늘어납니다. 규모가 커질수록 후발 주자가 따라오기 어려운 구조적 우위가 됩니다.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {FLYWHEEL.map((f, i) => (
            <div key={f.n} className="flex items-center gap-2">
              <div className="rounded-field border border-bline bg-brow/60 px-3.5 py-2.5">
                <div className="text-[13px] font-extrabold text-bink">{f.n}</div>
                <div className="text-[11px] text-bmuted">{f.d}</div>
              </div>
              <span className="text-[15px] text-primary-text">{i === FLYWHEEL.length - 1 ? '↺' : '→'}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-bfaint">모든 AI 응답·분류·정산 결과는 피드백 라벨과 함께 저장되어 프롬프트·정책 개선에 재사용됩니다(내부 고도화 전용).</p>
      </Card>
    </div>
  )
}

function Layer({ title, tone, lines, foot, badge }) {
  return (
    <div className="rounded-card border border-bline p-4">
      <div className="flex items-center justify-between">
        <div className={`text-[13.5px] font-extrabold ${tone}`}>{title}</div>
        {badge && <span className="tnum rounded-full bg-brow px-2 py-0.5 text-[11px] font-bold text-bbody">{badge}</span>}
      </div>
      <ul className="mt-2 flex flex-col gap-1 text-[12px] leading-[17px] text-bbody">
        {lines.map((l) => <li key={l}>· {l}</li>)}
      </ul>
      <div className="mt-2.5 border-t border-bline pt-2 text-[11.5px] font-semibold text-bink">{foot}</div>
    </div>
  )
}
function Arrow() {
  return <div className="hidden items-center justify-center text-[18px] text-bfaint lg:flex">→</div>
}
