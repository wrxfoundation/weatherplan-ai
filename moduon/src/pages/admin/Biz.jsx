// ─── 본사 어드민 · 경영 전략 파트 (사업기획서 v4 요소 통합) ──────────
// 3계층 구조·AI 등급제 메뉴판·수익 다각화 로드맵·데이터 플라이휠을
// 한 화면에 모아 본사 경영진이 사업 로드맵을 관제한다.
import { useStore, adminStats } from '../../lib/store'
import { won, num, SAUP_TIERS } from '../../lib/engine'
import { UNITS, unitName } from '../../lib/constants'
import { Card } from '../../components/ui'
import { IcCompass } from '../../components/icons'
import { AiInsight } from '../../components/AiPanel'
import { foreignPanel } from '../../lib/ai'

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
  { area: '총판 지역수요 예측', role: '권역 수요·셀러 코칭', tier: 'Claude Opus 5', s: '운영중' },
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
  const distributors = db.distributors ?? [] // 실 총판 계약 현황

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-[-0.4px] text-bink">경영 전략 · 사업 로드맵</h1>
          <p className="mt-1 text-[13px] text-bmuted">사업기획서 v4 기반 — 3계층 구조 · AI 등급제 · 수익 다각화 · 데이터 플라이휠</p>
        </div>
        <span className="hidden rounded-card bg-tint p-3.5 text-primary-text lg:block"><IcCompass size={30} sw={1.6} /></span>
      </div>

      {/* 1. 3계층 사업 구조 */}
      <Card track="b" className="mt-4 p-5 sm:p-6">
        <h2 className="text-[15.5px] font-extrabold text-bink">3계층 사업 구조 <span className="text-[12.5px] font-semibold text-bmuted">· 본사 → 총판 → 셀러</span></h2>
        <div className="mt-4 grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <Layer title="본사 (플랫폼)" tone="text-primary-text" lines={['상품 공급 · AI 운영 · 마케팅 · 정산', '리드 배정 엔진 · 관제']} foot={`수익: 사업권 분양 + 수수료 ${Math.round(p.feeRate * 100)}% + 월 이용료`} />
          <Arrow />
          <Layer title="총판 (영업단)" tone="text-bindigo" lines={['권역 총괄 · 셀러 모집 · 1차 배정', `전국 ${UNITS.length}개 영업단`]} foot={`현황: ${distributors.length}개 권역 총판 계약 · 나머지 모집 중`} badge={`${distributors.length}/${UNITS.length}`} />
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
        <p className="mt-2 text-[11px] text-bfaint">
          계약 완료: {distributors.length ? distributors.map((d) => unitName(d.unit)).join('·') : '없음'} · 나머지 {UNITS.length - distributors.length}개 권역 모집 중
        </p>
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

      {/* 3.5 신시장 확장 스코어보드 — TAM×전환×자산 재활용×페인 종합점수 */}
      <Card track="b" className="mt-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[15.5px] font-extrabold text-bink">신시장 확장 스코어보드 <span className="text-[12.5px] font-semibold text-bmuted">· 다음 진출 우선순위</span></h2>
          <span className="text-[11.5px] text-bfaint">기준: 시장 규모 × 전환 용이성 × 기존 자산 재활용률 × 고객 페인 강도 (각 25점)</span>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {[
            { name: '외국인 개통 시장', score: 88, tam: '체류 외국인 260만 · 결합 침투 낮음', why: '다국어 모비·지급명단·로컬 분양몰 재활용 — 90일 파일럿 공략안 수립 완료', badge: '공략안 v1.0', hot: true },
            { name: '에어컨 설치·이전', score: 79, tam: '여름 성수기 집중 · 이사 리드 연계', why: '이사철 트리거·기사 네트워크 필요 — 시즌 한정 파일럿 적합' },
            { name: '보안·CCTV (소상공인)', score: 74, tam: '자영업 580만 · B2B 반복 수익', why: '분양몰 로컬 영업망 재활용, 월 구독 모델로 정산 엔진 그대로' },
            { name: '자동차보험 갱신', score: 68, tam: '연 단위 갱신 전원 대상', why: '진단·비교 UX 재활용 크지만 설계사 제휴·라이선스 확인 필요' },
            { name: '상조·라이프플랜', score: 55, tam: '고LTV · 장기 납입', why: '신뢰 자산 필요 — 후기·지급명단 축적 후 재평가' },
          ].map((m, i) => (
            <div key={m.name} className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-field border p-3.5 ${m.hot ? 'border-primary/40 bg-tint/30' : 'border-bline'}`}>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12.5px] font-extrabold ${i === 0 ? 'bg-primary text-white' : 'bg-brow text-bmuted'}`}>{i + 1}</span>
              <div className="min-w-[150px]">
                <span className="text-[13.5px] font-bold text-bink">{m.name}</span>
                {m.badge && <span className="ml-1.5 rounded-full bg-orange-tint px-2 py-0.5 text-[10px] font-bold text-orange-text">{m.badge}</span>}
                <div className="text-[11px] text-bfaint">{m.tam}</div>
              </div>
              <div className="min-w-0 flex-1 text-[11.5px] leading-4 text-bmuted">{m.why}</div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-brow"><div className={`h-full rounded-full ${i === 0 ? 'bg-primary' : 'bg-bline'}`} style={{ width: `${m.score}%` }} /></div>
                <span className={`tnum text-[13px] font-extrabold ${i === 0 ? 'text-primary-text' : 'text-bmuted'}`}>{m.score}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2.5 text-[11px] text-bfaint">점수는 내부 평가 기준의 데모 예시입니다. 1순위 외국인 시장은 「외국인 개통 유치 공략안」의 90일 파일럿 게이트(개통 300건)를 통과하면 상위 10개 밀집 권역으로 확대합니다.</p>

        {/* 외국인 오퍼 사전 검증 — 공략안 4세그먼트 페르소나 패널 */}
        <div className="mt-3 border-t border-dashed border-bline pt-3">
          <AiInsight
            title="외국인 파일럿 오퍼 — 페르소나 패널 검증"
            desc="공략안의 4세그먼트(E-9·유학생·재외동포·결혼이민) 가상 패널이 파일럿 오퍼(체류기간 연동 약정·현금 사은품·다국어 상담·동일 가격)에 어떻게 반응할지 사전 검증해요."
            cta="오퍼 반응 시뮬레이션"
            build={() => foreignPanel()}
          />
          <p className="mt-1.5 text-[10.5px] leading-4 text-bfaint">시뮬레이션은 가설 탐색용 — 파일럿 실측(개통 300건 게이트)이 최종 판단 기준입니다.</p>
        </div>
      </Card>

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

      {/* 5. 운영 알고리즘 — 5단계: 의심→삭제→단순화→가속→자동화 (순서가 규율) */}
      <Card track="b" className="mt-4 p-5 sm:p-6">
        <h2 className="text-[15.5px] font-extrabold text-bink">운영 알고리즘 <span className="text-[12.5px] font-semibold text-bmuted">· 다섯 번 묻고, 자동화는 마지막에</span></h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { n: '요구사항을 의심한다', d: '상담 신청은 이름·연락처·지역 3필드뿐. "더 받을까"가 아니라 "왜 받는가"부터 묻는다.' },
            { n: '과감히 삭제한다', d: '지점·재고·직영 영업조직 없이 분양몰 네트워크로 대체 — 최고의 비용은 없는 비용이다.' },
            { n: '단순화한다', d: '가격·수수료·사은품은 상품 정책 단일 소스. 화면마다 다른 숫자를 금지한다.' },
            { n: '사이클을 가속한다', d: '접수→배정→콜백 10분 SLA. 정산은 월말이 아니라 매일 보인다.' },
            { n: '그 다음에야 자동화한다', d: '검증된 루틴만 AI로 — 이긴 구조만 자동화한다(피드백 플라이휠).' },
          ].map((s, i) => (
            <div key={s.n} className="rounded-field border border-bline p-3.5">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-extrabold ${i === 4 ? 'bg-primary text-white' : 'bg-tint text-primary-text'}`}>{i + 1}</span>
              <div className="mt-2 text-[13px] font-extrabold leading-4 text-bink">{s.n}</div>
              <p className="mt-1 text-[11.5px] leading-4 text-bmuted">{s.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-4 text-bfaint">순서가 핵심입니다 — 삭제·단순화 전에 자동화하면 낭비를 자동화하게 됩니다. 신규 기능·정책은 이 다섯 질문을 통과한 뒤에 올립니다.</p>
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
