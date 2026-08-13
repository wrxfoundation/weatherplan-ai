import { Card, CardHeader } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { Pill } from '@/components/Pill'
import { Icon } from '@/components/Icon'

// 산식·방법론 문서 — "숫자의 출처를 물으면 화면이 답한다"(PRD §0.8)의 전체판.
const principles = [
  { icon: 'network', title: '원장 우선', desc: '제3자 유료 API가 아니라 XRPL 공개 원장에서 직접 집계합니다. 누구나 같은 방법으로 재검증할 수 있습니다.' },
  { icon: 'eye', title: '읽기 전용', desc: '콘솔은 원장에 쓰지 않습니다. 유일한 예외는 지수 확정값의 테스트넷 앵커링(증적 기록)입니다.' },
  { icon: 'doc', title: '모든 수치에 산식', desc: '산식 없는 지표는 만들지 않습니다. 각 지표 카드의 ⓘ 아이콘에서 산식을 확인할 수 있습니다.' },
]

const formulas: { module: string; items: { metric: string; formula: string; note?: string }[] }[] = [
  {
    module: 'M1 활성 지갑',
    items: [
      { metric: '일일 트랜잭션', formula: 'count(tx_events where closed_at::date = 오늘)' },
      { metric: '활성 지갑', formula: 'count(distinct 상대 지갑 where 당일 거래 존재)', note: '24시간 무활동 시 비활성' },
      { metric: '자체 이체', formula: 'sum(amount where direction = self)', note: '내부 이동 — 매출 아님' },
    ],
  },
  {
    module: 'M2 정산 지수 (VWI)',
    items: [
      { metric: 'VWI', formula: 'Σ(wᵢ·Tᵢ) / Σwᵢ — 신뢰도 가중 평균', note: '3σ 초과 관측은 이상치로 제거' },
      { metric: '조작 영향', formula: '(조작폭 × 조작 지점 수) / 활성 지점 수' },
      { metric: '앵커 증적', formula: '확정 payload의 SHA-256 → XRPL 트랜잭션 memo 기록' },
    ],
  },
  {
    module: 'M3 결제/정산',
    items: [
      { metric: 'RLUSD 볼륨', formula: 'sum(amount where currency=RLUSD and direction=in)' },
      { metric: 'SKU 분류', formula: 'DestinationTag 규약 — 1001 집계 API · 1002 코호트 · 1003 AI 리포트', note: '태그 없는 수취는 untagged로 별도 집계' },
      { metric: '처리 지연 p50/p95/p99', formula: '결제 요청→검증 완료 소요 시간의 분위수' },
    ],
  },
  {
    module: 'M4 DePIN 보상',
    items: [
      { metric: '지급 성공률 (7D)', formula: 'sum(지급 성공) / sum(지급 대상) — 실패분은 재시도 큐 이월' },
      { metric: '1일 한도 사용률', formula: '금일 지급액 / payout_daily_cap', note: '90% 초과 시 경보, 이상 급증 시 자동중단' },
      { metric: '부정 σ 점수', formula: '위치 검증·데이터 패턴·인근 센서 교차대조 기반 이상도', note: '임계 초과 시 자동 지급 보류 → operator 검토' },
    ],
  },
  {
    module: 'M5 재무 현황',
    items: [
      { metric: '자기자본', formula: '총 자산 − 총 부채' },
      { metric: '가상자산 평가액', formula: 'RLUSD·XRP·WLBN 보유량 × 월말 환산가' },
      { metric: '토크노믹스 시뮬레이션', formula: 'supply[t] = S₀ + Σ(mint − mint·burnRate)\nreward[t] = mint × 0.7 × k × 0.985ᵗ', note: 'S₀ = 20,000,000 (가정치)' },
    ],
  },
  {
    module: 'M6 파트너 정산',
    items: [
      { metric: '정산 대기 금액', formula: 'sum(발생 수익) − sum(정산 완료)' },
      { metric: '정산 통화', formula: 'RLUSD (XRPL) — 화면 금액은 USD 환산 표기' },
    ],
  },
  {
    module: 'M7 소셜 & 미디어',
    items: [
      { metric: '참여율', formula: 'sum(반응) / 팔로워 수 (채널별 7D)' },
      { metric: '가중 감성 지수', formula: 'Σ(score × (KOL이면 3, 아니면 1)) / N — 7일 이동' },
    ],
  },
  {
    module: 'M8 토큰 홀더',
    items: [
      { metric: '홀더 수', formula: 'WLBN 발행계정 account_lines 전량 스냅샷 (일 1회)' },
      { metric: '상위 N 집중도', formula: 'Σ(top-N 잔고) / Σ(전체 잔고)' },
      { metric: '지니 계수', formula: '보유 분포의 불평등도 (0 균등 ~ 1 독점)' },
      { metric: '이탈 홀더', formula: '전주 보유 & 금주 잔고 0인 지갑' },
    ],
  },
  {
    module: 'M9 · 감사',
    items: [
      { metric: '알림 중복 억제', formula: '동일 규칙 60분 내 재발화 금지' },
      { metric: '로그 무결성', formula: '일 단위 해시 체인 생성 → XRPL 기록으로 공증', note: '변조 시 체인 검증 실패로 즉시 감지' },
    ],
  },
]

const pipeline = [
  { no: 1, title: '수집', desc: '전국 관측소 원시 데이터 수집 (10분 주기)' },
  { no: 2, title: '검증·필터링', desc: '결측 제거, 3σ 초과 이상치 제거, 인근 지점 교차대조' },
  { no: 3, title: '산출·확정', desc: '신뢰도 가중 평균 산출 → 60분 주기 확정(final)' },
  { no: 4, title: '앵커링', desc: '확정 payload 해시를 XRPL에 기록 — 사후 변경 불가' },
]

export function MethodologyPage() {
  return (
    <>
      <PageHeader
        title="산식·방법론"
        subtitle="이 콘솔의 모든 숫자가 어떻게 계산되는지 정리한 문서입니다. 각 화면의 ⓘ 툴팁과 동일한 내용의 전체판입니다."
        actions={<Pill tone="navy">v1.0 · 2026-08</Pill>}
      />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        {principles.map(p => (
          <Card key={p.title} className="p-5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-navy-soft text-navy"><Icon name={p.icon} size={17} /></span>
            <div className="mt-3 text-h3 text-ink">{p.title}</div>
            <p className="mt-1.5 text-label leading-relaxed text-body">{p.desc}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <CardHeader title="VWI 산출 파이프라인" formula={'수집 → 검증 → 산출·확정 → 앵커링\n확정 주기 60분, 70분 무기록 시 경보'} />
        <div className="grid grid-cols-1 gap-3 px-5 pb-5 md:grid-cols-4">
          {pipeline.map((s, i) => (
            <div key={s.no} className="relative rounded-lg border border-line-soft p-4">
              <span className="num grid h-6 w-6 place-items-center rounded-full bg-navy text-tiny font-bold text-white">{s.no}</span>
              <div className="mt-2 text-label font-bold text-ink">{s.title}</div>
              <div className="mt-1 text-meta leading-relaxed text-mute">{s.desc}</div>
              {i < 3 && <Icon name="chevronRight" size={15} className="absolute -right-2.5 top-1/2 hidden -translate-y-1/2 text-mute md:block" />}
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4">
        <CardHeader title="모듈별 지표 산식" action={<span className="text-meta text-mute">화면의 ⓘ 툴팁과 동일</span>} />
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 px-5 pb-5 xl:grid-cols-2">
          {formulas.map(g => (
            <div key={g.module}>
              <div className="border-b border-line pb-1.5 text-label font-bold text-navy">{g.module}</div>
              <div className="mt-2 space-y-2.5">
                {g.items.map(it => (
                  <div key={it.metric} className="rounded-lg border border-line-soft px-3.5 py-2.5">
                    <div className="text-label font-semibold text-ink">{it.metric}</div>
                    <div className="num mt-1 whitespace-pre-line font-mono text-[12px] leading-relaxed text-body">{it.formula}</div>
                    {it.note && <div className="mt-1 text-tiny font-normal text-mute">※ {it.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4">
        <CardHeader title="데이터 출처·갱신 주기" />
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="whitespace-nowrap border-b border-line text-left text-meta font-medium text-mute">
                <th className="px-2 py-2 font-medium">데이터</th>
                <th className="px-2 py-2 font-medium">출처</th>
                <th className="px-2 py-2 font-medium">갱신 주기</th>
                <th className="px-2 py-2 font-medium">비고</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['온체인 트랜잭션·잔고', 'XRPL 공개 노드 (account_tx / account_info)', '5분', '등록 지갑 대상 증분 수집'],
                ['홀더 스냅샷', 'WLBN 발행계정 account_lines', '일 1회', '마커 페이지네이션 전량'],
                ['기상 관측', '케이웨더 관측망', '10분 수집 · 60분 확정', 'VWI 산출용'],
                ['소셜·미디어', '수동 입력 + CSV 업로드 (v1)', '수시', 'AI 감성 분류'],
                ['일 롤업 지표', 'tx_events → daily_metrics', '매일 00:10 KST', '대시보드는 롤업만 조회'],
              ].map(r => (
                <tr key={r[0]} className="whitespace-nowrap border-b border-line-soft last:border-0">
                  <td className="px-2 py-2.5 text-label font-semibold text-ink">{r[0]}</td>
                  <td className="px-2 py-2.5 text-label text-body">{r[1]}</td>
                  <td className="num px-2 py-2.5 text-label text-body">{r[2]}</td>
                  <td className="px-2 py-2.5 text-label text-mute">{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
