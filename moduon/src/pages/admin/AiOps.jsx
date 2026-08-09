// ─── S-25 AI 운영 현황 (목업 2 재현) — "AI가 일하고 사람은 예외만 본다" ──
import { useStore } from '../../lib/store'
import { won, timeAgo } from '../../lib/engine'
import { Card, KpiCard, LiveDot } from '../../components/ui'
import { Donut, Legend, LineChart } from '../../components/charts'

const AUTO_BREAKDOWN = [
  { label: '완전 자동 처리', value: 38542, color: '#17B26A' },
  { label: '부분 자동(사람 확인)', value: 12847, color: '#5377D6' },
  { label: '상담원 연결', value: 6892, color: '#F79009' },
  { label: '대기', value: 1008, color: '#DDE1EC' },
]

const TOP5 = [
  { q: '인터넷 결합하면 월 얼마예요?', n: 2140 },
  { q: '이사할 때 인터넷 이전 vs 신규?', n: 1730 },
  { q: '정수기 의무약정 몇 년이에요?', n: 1288 },
  { q: '사은품은 언제 지급되나요?', n: 1054 },
  { q: '위약금 대납 되나요?', n: 872 },
]

const DEMO_LOG = [
  { at: '방금 전', kind: 'classify', text: '신규 문의 → "주문" 자동 분류 · 해피넷 통신 큐 배정' },
  { at: '2분 전', kind: 'chat', text: '챗봇이 500M+정수기 견적 자동 응답 (월 32,900원)' },
  { at: '6분 전', kind: 'route', text: '본진 리드 → 주소지 권역(수도2단) 파트너 자동 배정' },
  { at: '14분 전', kind: 'sla', text: 'SLA 10분 초과 감지 → 파트너 재알림 발송' },
  { at: '31분 전', kind: 'insight', text: '주간 인사이트 생성: 이사+인터넷 결합 전환율 상승' },
]

export default function AdminAiOps() {
  const { db } = useStore()
  // 실 AI 텔레메트리 — 소비자몰 챗/진단이 쌓는 aiEvents 집계. 5건부터 데모 수치 대신 실측 사용
  const events = db.aiEvents ?? []
  const total = events.length
  const chats = events.filter((e) => e.kind === 'chat').length
  const autoRate = total ? Math.round((events.filter((e) => e.auto === true).length / total) * 1000) / 10 : 0
  const useReal = total >= 5
  const recentAi = events.slice(0, 8)
  const demoLog = DEMO_LOG.slice(0, Math.max(0, 8 - recentAi.length)) // 실이벤트가 쌓일수록 데모 행 대체

  return (
    <div className="mx-auto max-w-6xl">
      {/* 인사 배너 */}
      <Card track="b" className="flex items-center justify-between gap-4 p-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[20px] font-extrabold text-bink">AI 운영 현황</h1>
            <span className="flex items-center gap-1.5 rounded-full bg-ok/10 px-3 py-1 text-[11.5px] font-bold text-ok"><LiveDot /> AI 시스템 정상 운영</span>
          </div>
          <p className="mt-1 text-[13px] text-bmuted">AI가 일하고, 사람은 예외만 봅니다 — 상담·분류·배정·정산 자동화 현황</p>
        </div>
        <span className="hidden text-[40px] lg:block">🤖</span>
      </Card>

      {/* KPI 4 */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="이번 달 전체 매출" value={1248560000} suffix="원" delta={22.5} />
        <KpiCard label="신규 상담 (오늘)" value={1248} suffix="건" delta={8.1} caption={`실 이벤트 ${total}건 수집 (챗 ${chats}건)`} />
        <KpiCard label="AI 자동 처리율" value={useReal ? autoRate : 85.3} format={(n) => Math.round(n * 10) / 10} suffix="%" accent="text-ok" delta={useReal ? undefined : 2.4} caption={useReal ? `실이벤트 ${total}건 기준` : '데모 기준 · 실이벤트 5건부터 실측 전환'} />
        <KpiCard label="고객 만족도" value={4.8} format={() => '4.8'} suffix="점" caption="상담 후 설문 기준" />
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-4">
          {/* 실시간 서비스 상황 */}
          <Card track="b" className="p-5">
            <h2 className="text-[15.5px] font-extrabold text-bink">실시간 서비스 상황 (최근 7일)</h2>
            <div className="mt-4">
              <LineChart
                labels={['월', '화', '수', '목', '금', '토', '일']}
                series={[
                  { label: '정상 처리', color: '#17B26A', values: [5200, 5480, 5910, 5740, 6220, 6480, 6120], fill: true },
                  { label: '경고(지연)', color: '#F79009', values: [180, 140, 210, 160, 190, 150, 130] },
                  { label: '오류(개입)', color: '#F04438', values: [24, 18, 31, 22, 19, 15, 12] },
                ]}
              />
            </div>
          </Card>

          {/* AI 고객 상담 센터 미리보기 */}
          <Card track="b" className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[15.5px] font-extrabold text-bink">AI 고객 상담 센터</h2>
              <span className="text-[11.5px] text-bfaint">전체 1,248 · AI 자동응답 1,063(85.3%) · 상담원 연결 185 · 평균 응답 18초</span>
            </div>
            <div className="mt-4 rounded-card bg-brow p-4">
              <div className="flex justify-end">
                <div className="max-w-[75%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-[13px] text-white">이사하면서 인터넷도 새로 하려는데, 정수기까지 묶으면 얼마예요?</div>
              </div>
              <div className="mt-3 flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white px-3.5 py-3 shadow-bcard">
                  <div className="text-[13px] leading-5 text-bbody">500M + 정수기 결합 기준으로 바로 계산해 드렸어요!</div>
                  <div className="mt-2.5 rounded-field border border-tint bg-tint/50 p-3 text-[12.5px]">
                    <div className="flex justify-between"><span className="text-bmuted">월 납부금</span><strong className="tnum font-extrabold text-primary-text">{won(32900)}</strong></div>
                    <div className="mt-1 flex justify-between"><span className="text-bmuted">사은품 혜택</span><strong className="tnum font-bold text-orange-text">{won(350000)}</strong></div>
                    <div className="mt-1 text-[11px] text-bfaint">약정 3년 · 설치비 무료 · 이사 일정 연동 설치</div>
                  </div>
                  <button className="mt-2.5 w-full rounded-field bg-tint py-2 text-[12px] font-bold text-primary-text">상세 견적서 보기</button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          {/* 자동화 도넛 */}
          <Card track="b" className="p-5">
            <h2 className="text-[15.5px] font-extrabold text-bink">AI 자동화 분해</h2>
            <div className="mt-3 flex items-center gap-4">
              <Donut data={AUTO_BREAKDOWN} centerTop="85.3%" centerSub="자동 처리" />
              <Legend data={AUTO_BREAKDOWN} className="flex-1" />
            </div>
            <p className="mt-3 text-[11px] leading-4 text-bfaint">플라이휠: 모든 AI 응답·분류 결과는 피드백 라벨과 함께 저장 → 프롬프트·정책 개선에 재사용 (내부 고도화 전용).</p>
          </Card>

          {/* 인기 문의 TOP5 */}
          <Card track="b" className="p-5">
            <h2 className="text-[15.5px] font-extrabold text-bink">인기 문의 TOP5</h2>
            <div className="mt-3 flex flex-col gap-2.5">
              {TOP5.map((t, i) => (
                <div key={t.q} className="flex items-center gap-2.5">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${i < 3 ? 'bg-tint text-primary-text' : 'bg-brow text-bmuted'}`}>{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-bbody">{t.q}</span>
                  <span className="tnum text-[11.5px] font-bold text-bfaint">{t.n.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* 실시간 활동 로그 */}
          <Card track="b" className="p-5">
            <h2 className="text-[15.5px] font-extrabold text-bink">실시간 활동 로그</h2>
            <div className="mt-3 flex flex-col">
              {recentAi.map((e) => (
                <LogRow key={e.id} at={timeAgo(e.at)} text={e.kind === 'chat' ? `챗봇 응답(${e.source === 'claude' ? 'Claude' : '데모 브레인'}): "${String(e.q).slice(0, 24)}…"` : e.kind === 'diagnosis' ? `생활비 진단 완료 — ${e.label}` : `자동 분류 — ${e.label ?? e.q}`} live />
              ))}
              {demoLog.map((l) => <LogRow key={l.text} at={l.at} text={l.text} />)}
            </div>
          </Card>
        </div>
      </div>

      {/* 인사이트 3카드 */}
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {[
          { t: '인기 상품 메인 노출', d: '인기 상품 TOP5를 소비자몰 메인에 노출하면 매출 +15% 추정', ref: '최근 30일 클릭·전환 데이터' },
          { t: '이사+인터넷 번들 강화', d: '이사 리드의 41%가 인터넷을 함께 문의 — 번들 CTA 추가 권장', ref: '리드 카테고리 동시 발생 분석' },
          { t: '수도3단 파트너 증설', d: '인천·부천 권역 리드가 처리 용량 대비 1.8배 — 분양 영업 우선 배치', ref: '권역별 리드/파트너 비율' },
        ].map((c) => (
          <Card key={c.t} track="b" className="p-5">
            <div className="flex items-center gap-2 text-[12px] font-bold text-primary-text">💡 AI 추천 인사이트</div>
            <div className="mt-2 text-[14.5px] font-bold text-bink">{c.t}</div>
            <p className="mt-1 text-[12.5px] leading-5 text-bbody">{c.d}</p>
            <button className="mt-2.5 text-[11.5px] font-bold text-primary-text underline underline-offset-2">근거 데이터: {c.ref} →</button>
          </Card>
        ))}
      </div>
    </div>
  )
}

function LogRow({ at, text, live }) {
  return (
    <div className="flex gap-3 border-b border-brow py-2.5 last:border-0">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${live ? 'bg-ok animate-live' : 'bg-bline'}`} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-semibold text-bbody">{text}</div>
        <div className="text-[11px] text-bfaint">{at}</div>
      </div>
    </div>
  )
}
