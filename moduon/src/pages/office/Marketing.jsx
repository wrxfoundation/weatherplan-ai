// ─── P-07 마케팅 스튜디오 — "상품언어는 24시간 일하는 직원" ─────────
// 첨부 문서 흡수: 상품언어×AI(채널 카피·환산 프레이밍), WeatherPlan(날씨
// 트리거 룰·신뢰도 게이트), 22업종 매트릭스(시즌 플레이북), 미라클 톤
// ("숫자가 말하게 한다" 라이프사이클 템플릿). 데모: 발송은 기록만 남긴다.
import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useStore, tenantLeads } from '../../lib/store'
import { marketingCopy } from '../../lib/ai'
import { won, dday, copyText } from '../../lib/engine'
import { unitName, catBySlug } from '../../lib/constants'
import { Card, useToast } from '../../components/ui'
import { AiInsight } from '../../components/AiPanel'
import { IcMegaphone, IcBolt, IcGift, IcShare, IcClock } from '../../components/icons'

// 6대 저항력(가격·시즌·품질·구매·마케팅비·타깃) 룰 스코어링 — 상품언어×AI 흡수
const RESIST_AXES = [
  { k: 'price', label: '가격 저항', words: [['원', '만원'], ['하루', '월 '], ['환산', '꼴', '아끼'], ['무료', '0원']], tip: '금액을 하루 단위로 환산하세요 — "월 32,900원"보다 "하루 1,097원꼴"이 저항을 낮춥니다.' },
  { k: 'season', label: '시즌 저항', words: [['장마', '여름', '폭염'], ['겨울', '한파'], ['이사철', '신학기', '연말'], ['지금', '이번 달', '오늘']], tip: '"지금 신청하면 이번 달부터"처럼 시점 이유를 만들어 주세요.' },
  { k: 'quality', label: '품질 저항', words: [['후기', '별점', '만족'], ['명단', '공개'], ['공식', '정품', '인증'], ['본사', '검수', '책임']], tip: '"실제 지급 명단 공개"처럼 검증 가능한 증거를 한 줄 넣으세요.' },
  { k: 'purchase', label: '구매 저항', words: [['30초', '1분', '10분'], ['신청', '상담'], ['링크', '→', '클릭'], ['콜백', '전화']], tip: '다음 행동을 한 개만, 소요 시간과 함께 — "30초 견적 →".' },
  { k: 'cost', label: '마케팅비 저항', words: [['추천', '소개'], ['공유'], ['재상담', '만기'], ['단골', '다음 달']], tip: '추천·공유 문장을 넣으면 카피 하나가 여러 번 일합니다.' },
  { k: 'target', label: '타깃 저항', words: [['님', '사장님'], ['동네', '지역', '우리'], ['가구', '가족', '1인'], ['{고객명}']], tip: '"{고객명}님·우리 동네"처럼 받는 사람이 자기 얘기로 느끼게 하세요.' },
]
const scoreResistance = (text) => RESIST_AXES.map((a) => ({
  ...a,
  score: text.trim().length < 10 ? 0 : Math.round((a.words.filter((g) => g.some((w) => text.includes(w))).length / a.words.length) * 100),
}))
const RESIST_SAMPLE = '인터넷 갈아타면 최대 152만원+ 돌려받으세요. 월 32,900원, 하루 1,097원꼴. 지급 명단 공개 중 — 30초 견적 신청 →'

const CHANNELS = [
  { key: 'kakao', label: '카톡' },
  { key: 'sms', label: '문자' },
  { key: 'blog', label: '블로그' },
  { key: 'sns', label: 'SNS' },
]
const GOALS = [
  { key: 'acquire', label: '신규 모객' },
  { key: 'renewal', label: '만기 재상담' },
  { key: 'promo', label: '사은품 프로모션' },
]

// 시즌·날씨 트리거 룰 — "트리거 → 자동 대응 → 예상 효과" (수치는 데모 예시)
const WEATHER_RULES = [
  { key: 'wx-rain', name: '장마 · 습도 트리거', trigger: '장마 예보 D-3 · 습도 80%+', action: '제습기·공기청정 렌탈 배너 강화 + 정수기 결합 카피 전환', effect: '렌탈 문의 +40%', score: 92, rule: '"장마 예보 뜨면 제습 결합 배너 키워줘"' },
  { key: 'wx-heat', name: '폭염 트리거', trigger: '최고기온 33℃+ D-7', action: '에어컨·냉장고 제휴 카드 상단 고정, 야간 발송 전환', effect: '가전 문의 +150%', score: 90, rule: '"폭염특보면 에어컨 카드 맨 위로 올려줘"' },
  { key: 'wx-cold', name: '한파 트리거', trigger: '최저기온 −10℃ D-3', action: '보일러·온수매트 프로모션 + 이사 고객 인터넷 이전 안내', effect: '난방 문의 +200%', score: 88, rule: '"한파 D-3이면 보일러 프로모 발송해줘"' },
  { key: 'wx-move', name: '이사철 트리거', trigger: '2·3월 / 8·9월 성수기', action: '인터넷 이전+정수기 이전 설치 번들 캠페인', effect: '이사 리드 41%가 인터넷 동반 문의', score: 93, rule: '"이사철엔 이전설치 번들로 묶어줘"' },
]

// 라이프사이클 자동 발송 — 미라클 톤: 구체 수치가 말하게 한다
const LIFECYCLE = [
  { key: 'welcome', name: '신규 접수 환영', when: '리드 접수 즉시', tmpl: '{고객명}님, 접수 확인! 평균 10분 내 전문 상담사가 전화드려요.', def: true },
  { key: 'remind', name: '미응대 리마인드', when: 'SLA 10분 초과 시', tmpl: '놓친 상담 1건 — {고객명}님이 기다리고 있어요. 지금 연락하세요.', def: true },
  { key: 'expiry', name: '만기 재상담 (D-90)', when: '약정 만기 90일 전', tmpl: '{고객명}님 만기까지 D-{일수} · 위약금이 가장 낮아지는 구간입니다.', def: true },
  { key: 'review', name: '설치 완료 후기 요청', when: '개통 완료 +3일', tmpl: '{고객명}님, 설치는 만족스러우셨나요? 후기 남기면 다음 혜택 우선 안내.', def: false },
]

export default function OfficeMarketing() {
  const { tenant } = useOutletContext()
  const { db, dispatch } = useStore()
  const toast = useToast()
  const [channel, setChannel] = useState('kakao')
  const [goal, setGoal] = useState('acquire')
  const [copied, setCopied] = useState(false)

  const auto = tenant.automations ?? {}
  const isOn = (key, def = false) => auto[key] ?? def

  const refLink = `${window.location.origin}/?ref=${tenant.slug}`
  const leads = tenantLeads(db, tenant.id)
  const stats = useMemo(() => {
    const sent = (db.auditLog ?? []).filter((a) => a.action === '아웃바운드 발송' && (a.actor === tenant.id || a.actor === tenant.owner)).length
    const inbound = leads.filter((l) => l.source === tenant.slug).length
    const expiring = db.contracts.filter((c) => c.tenantId === tenant.id && dday(c.expiry) <= 90).length
    return { sent, inbound, expiring }
  }, [db.auditLog, db.contracts, leads, tenant])

  const buildCopy = () => marketingCopy({
    tenantName: tenant.name,
    unitName: unitName(tenant.unit),
    sigungu: tenant.sigungu ?? '우리 동네',
    cats: (tenant.cats ?? []).map((s) => catBySlug(s)?.name ?? s),
    giftMax: '152만원+',
    refLink,
    channel,
    goal,
    expiringCount: stats.expiring,
  })

  const toggle = (key, label, def) => {
    dispatch({ type: 'TENANT_AUTOMATION', payload: { id: tenant.id, key, on: !isOn(key, def), label } })
    toast(!isOn(key, def) ? `${label} 자동화를 켰어요 — 감사 로그에 기록됩니다` : `${label} 자동화를 껐어요`)
  }

  const copyRef = async () => {
    if (await copyText(refLink)) { setCopied(true); toast('추천 링크를 복사했어요 — 어디에 붙여도 내 몰로 귀속됩니다'); setTimeout(() => setCopied(false), 1600) }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-extrabold text-bink">마케팅 스튜디오</h1>
          <p className="mt-0.5 text-[12.5px] text-bmuted">상품언어는 24시간 일하는 직원입니다 — 카피 생성부터 시즌 트리거·자동 발송까지 한 곳에서.</p>
        </div>
        <button onClick={copyRef} className="glass-btn flex h-9 items-center gap-1.5 rounded-full border border-bline bg-white px-3.5 text-[12.5px] font-bold text-bbody hover:border-primary hover:text-primary-text">
          <IcShare size={14} /> {copied ? '복사됐어요!' : '내 추천 링크 복사'}
        </button>
      </div>

      {/* 성과 KPI */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Card track="b" className="p-4"><div className="text-[12px] text-bmuted">이번 달 아웃바운드</div><div className="tnum mt-1 text-[22px] font-extrabold text-bink">{stats.sent}<span className="text-[13px]">건</span></div><div className="text-[11px] text-bfaint">알림톡·재상담 발송 기록</div></Card>
        <Card track="b" className="p-4"><div className="text-[12px] text-bmuted">내 몰 링크 유입 리드</div><div className="tnum mt-1 text-[22px] font-extrabold text-primary-text">{stats.inbound}<span className="text-[13px]">건</span></div><div className="text-[11px] text-bfaint">?ref={tenant.slug} 귀속</div></Card>
        <Card track="b" className="p-4"><div className="text-[12px] text-bmuted">만기 캠페인 대상</div><div className="tnum mt-1 text-[22px] font-extrabold text-warn">{stats.expiring}<span className="text-[13px]">명</span></div><div className="text-[11px] text-bfaint">90일 내 만기 — 재상담 골든타임</div></Card>
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[3fr_2fr]">
        {/* ── 좌: AI 카피 생성기 ── */}
        <Card track="b" className="p-5">
          <div className="flex items-center gap-2">
            <IcMegaphone size={16} className="text-primary-text" />
            <h2 className="text-[15.5px] font-extrabold text-bink">AI 카피 생성기</h2>
          </div>
          <p className="mt-1 text-[12px] text-bmuted">채널·목적을 고르면 내 몰 브랜딩(상호·권역·추천링크)이 반영된 카피가 나옵니다. 숫자가 말하게 — 과장 없이.</p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {CHANNELS.map((c) => (
              <button key={c.key} onClick={() => setChannel(c.key)} className={`h-8 rounded-full px-3.5 text-[12px] font-bold transition-colors ${channel === c.key ? 'bg-bink text-white' : 'bg-brow text-bbody hover:text-bink'}`}>{c.label}</button>
            ))}
            <span className="mx-1 h-4 w-px bg-bline" />
            {GOALS.map((g) => (
              <button key={g.key} onClick={() => setGoal(g.key)} className={`h-8 rounded-full px-3.5 text-[12px] font-bold transition-colors ${goal === g.key ? 'bg-primary text-white' : 'bg-tint text-primary-text hover:bg-primary/20'}`}>{g.label}</button>
            ))}
          </div>
          <AiInsight
            key={`${channel}-${goal}`}
            className="mt-3"
            title={`${CHANNELS.find((c) => c.key === channel).label} · ${GOALS.find((g) => g.key === goal).label} 카피`}
            desc="(광고) 표기·수신거부·조건 고지가 포함된 준수형 초안이 생성돼요. {고객명}, D-{일수}는 발송 시 자동 치환됩니다."
            cta="카피 생성하기"
            build={buildCopy}
          />
          <p className="mt-2.5 text-[11px] leading-4 text-bfaint">생성된 카피는 초안입니다. 표시광고법·정보통신망법 준수 여부를 확인 후 사용하세요. 발송은 데모에서 기록만 남습니다.</p>
        </Card>

        {/* ── 우: 자동 발송 시나리오 ── */}
        <Card track="b" className="p-5">
          <div className="flex items-center gap-2">
            <IcClock size={15} className="text-primary-text" />
            <h2 className="text-[15.5px] font-extrabold text-bink">자동 발송 시나리오</h2>
          </div>
          <p className="mt-1 text-[12px] text-bmuted">라이프사이클 이벤트에 맞춰 자동 발송 — 이긴 문구만 자동화하세요.</p>
          <div className="mt-3 flex flex-col gap-2">
            {LIFECYCLE.map((s) => {
              const on = isOn(s.key, s.def)
              return (
                <div key={s.key} className={`rounded-field border p-3 transition-colors ${on ? 'border-primary/40 bg-tint/40' : 'border-bline'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[13px] font-bold text-bink">{s.name}</div>
                      <div className="text-[11px] text-bfaint">{s.when}</div>
                    </div>
                    <button
                      role="switch"
                      aria-checked={on}
                      aria-label={`${s.name} 자동화`}
                      onClick={() => toggle(s.key, s.name, s.def)}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-bline'}`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
                    </button>
                  </div>
                  <div className="mt-2 rounded bg-white px-2.5 py-2 text-[11.5px] leading-4 text-bbody">{s.tmpl}</div>
                </div>
              )
            })}
          </div>
          <p className="mt-2.5 text-[11px] leading-4 text-bfaint">안전장치: 일일 발송 50건 초과 시 자동 정지 · 야간(21시~08시) 발송 보류. 모든 ON/OFF는 감사 로그에 남아요.</p>
        </Card>
      </div>

      {/* ── 저항력 스코어카드 + 만기 캠페인 A/B 실험실 ── */}
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <ResistanceCard />
        <AbLab tenant={tenant} auto={auto} dispatch={dispatch} toast={toast} />
      </div>

      {/* ── 시즌·날씨 트리거 캠페인 ── */}
      <Card track="b" className="mt-4 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-center gap-2">
            <IcBolt size={16} className="text-warn" />
            <h2 className="text-[15.5px] font-extrabold text-bink">시즌·날씨 트리거 캠페인</h2>
          </div>
          <span className="text-[11.5px] text-bfaint">"누구에게"만큼 "언제"가 전환을 가릅니다 — 날씨 영향 업종 70%+</span>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {WEATHER_RULES.map((r) => {
            const on = isOn(r.key)
            const gate = r.score >= 90 ? '자동 실행' : '승인 후 실행'
            return (
              <div key={r.key} className={`rounded-field border p-4 transition-colors ${on ? 'border-primary/40 bg-tint/30' : 'border-bline'}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-extrabold text-bink">{r.name}</span>
                    <span className={`tnum rounded-full px-2 py-0.5 text-[10.5px] font-bold ${r.score >= 90 ? 'bg-ok/10 text-ok' : 'bg-warn/10 text-warn'}`}>신뢰도 {r.score} · {gate}</span>
                  </div>
                  <button
                    role="switch"
                    aria-checked={on}
                    aria-label={`${r.name} 캠페인`}
                    onClick={() => toggle(r.key, r.name)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-bline'}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>
                <div className="mt-2.5 grid gap-1 text-[12px] leading-[18px]">
                  <div><span className="font-bold text-bmuted">트리거</span> <span className="text-bbody">{r.trigger}</span></div>
                  <div><span className="font-bold text-bmuted">자동 대응</span> <span className="text-bbody">{r.action}</span></div>
                  <div><span className="font-bold text-bmuted">예상 효과</span> <span className="font-bold text-ok">{r.effect}</span> <span className="text-bfaint">(과거 시즌 데모 추정)</span></div>
                </div>
                <div className="mt-2 rounded bg-brow px-2.5 py-1.5 text-[11.5px] text-bmuted">자연어 룰: {r.rule}</div>
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-[11px] leading-4 text-bfaint">날씨 트리거는 데모 시나리오입니다. 실서비스는 기상 데이터 연동으로 신뢰도 90+ 룰만 자동 실행, 나머지는 승인 큐로 들어갑니다. 예상 효과는 보장 수치가 아닙니다.</p>
      </Card>

      {/* 추천 링크 안내 */}
      <Card track="b" className="mt-4 flex flex-wrap items-center justify-between gap-3 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-tint text-orange-text"><IcGift size={18} /></span>
          <div>
            <div className="text-[13.5px] font-bold text-bink">추천 링크로 어디서든 모객하세요</div>
            <div className="tnum text-[12px] text-bmuted">{refLink} — 이 링크로 들어온 고객은 어느 화면에서 신청해도 내 몰로 귀속됩니다.</div>
          </div>
        </div>
        <button onClick={copyRef} className="glass-btn-cta h-10 rounded-full bg-primary px-5 text-[13px] font-bold text-white hover:bg-primary-hover">링크 복사</button>
      </Card>
    </div>
  )
}

// 상품언어 저항력 진단 — "언어만 바꿔도 저항이 꺾인다"
function ResistanceCard() {
  const [text, setText] = useState('')
  const axes = useMemo(() => scoreResistance(text), [text])
  const avg = Math.round(axes.reduce((s, a) => s + a.score, 0) / axes.length)
  const weakest = [...axes].sort((a, b) => a.score - b.score)[0]
  const hasText = text.trim().length >= 10
  return (
    <Card track="b" className="p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[15.5px] font-extrabold text-bink">상품언어 저항력 진단</h2>
        {hasText && <span className={`tnum rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${avg >= 60 ? 'bg-ok/10 text-ok' : 'bg-warn/10 text-warn'}`}>종합 {avg}점</span>}
      </div>
      <p className="mt-1 text-[12px] text-bmuted">카피를 붙여넣으면 6가지 구매 저항(가격·시즌·품질·구매·마케팅비·타깃) 극복 여부를 진단해요.</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="진단할 상품 소개문·카피를 붙여넣으세요 (10자 이상)"
        className="mt-3 min-h-[76px] w-full rounded-field border border-bline p-3 text-[13px] leading-5 focus:border-primary"
      />
      {!hasText && (
        <button onClick={() => setText(RESIST_SAMPLE)} className="mt-2 text-[12px] font-bold text-primary-text hover:underline">예시 문구로 체험하기 →</button>
      )}
      {hasText && (
        <>
          <div className="mt-3 flex flex-col gap-1.5">
            {axes.map((a) => (
              <div key={a.k} className="flex items-center gap-2.5">
                <span className="w-[86px] shrink-0 text-[11.5px] font-bold text-bbody">{a.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brow">
                  <div className={`h-full rounded-full transition-all ${a.score >= 60 ? 'bg-ok' : a.score >= 30 ? 'bg-warn' : 'bg-danger/60'}`} style={{ width: `${Math.max(4, a.score)}%` }} />
                </div>
                <span className="tnum w-8 text-right text-[11.5px] font-bold text-bmuted">{a.score}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-field bg-warn/[0.08] px-3.5 py-2.5 text-[12px] leading-[18px] text-bbody">
            <strong className="font-extrabold text-warn">가장 약한 축 · {weakest.label}</strong> — {weakest.tip}
          </div>
        </>
      )}
      <p className="mt-2.5 text-[11px] leading-4 text-bfaint">키워드 룰 기반 데모 진단입니다 — 실서비스는 AI가 문장 단위로 리라이팅까지 제안해요.</p>
    </Card>
  )
}

// 만기 캠페인 A/B 실험실 — 이긴 문구만 자동화로 승격
function AbLab({ tenant, auto, dispatch, toast }) {
  const adopted = auto['ab-renewal-b'] === true
  const V = [
    { key: 'A', angle: '위약금 각도', copy: `(광고) ${tenant.name} — {고객명}님, 만기 D-{일수}. 위약금이 가장 낮아지는 구간이에요. 재상담 →`, sent: 120, click: 5, conv: 2 },
    { key: 'B', angle: '사은품 각도', copy: `(광고) ${tenant.name} — {고객명}님, 지금 갈아타면 현금 사은품 최대 152만원+ (조건 충족 시). 재상담 →`, sent: 120, click: 7, conv: 3 },
  ]
  return (
    <Card track="b" className="p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[15.5px] font-extrabold text-bink">만기 캠페인 A/B 실험실</h2>
        {adopted && <span className="rounded-full bg-ok/10 px-2.5 py-0.5 text-[11.5px] font-bold text-ok">B안 채택됨</span>}
      </div>
      <p className="mt-1 text-[12px] text-bmuted">같은 대상에게 두 각도를 절반씩 발송하고, 이긴 문구만 자동 발송에 승격합니다.</p>
      <div className="mt-3 flex flex-col gap-2">
        {V.map((v) => {
          const ctr = ((v.click / v.sent) * 100).toFixed(1)
          const winner = v.key === 'B'
          return (
            <div key={v.key} className={`rounded-field border p-3 ${winner ? 'border-ok/50 bg-ok/[0.05]' : 'border-bline'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12.5px] font-extrabold text-bink">{v.key}안 · {v.angle} {winner && <span className="ml-1 rounded-full bg-ok/10 px-2 py-0.5 text-[10px] font-bold text-ok">승자</span>}</span>
                <span className="tnum text-[11.5px] font-bold text-bmuted">발송 {v.sent} · 클릭 {ctr}% · 재상담 {v.conv}건</span>
              </div>
              <div className="mt-1.5 rounded bg-white px-2.5 py-2 text-[11.5px] leading-4 text-bbody">{v.copy}</div>
            </div>
          )
        })}
      </div>
      {!adopted ? (
        <button
          onClick={() => { dispatch({ type: 'TENANT_AUTOMATION', payload: { id: tenant.id, key: 'ab-renewal-b', on: true, label: '만기 캠페인 B안(사은품 각도) 채택' } }); toast('B안을 만기 자동 발송 문구로 채택했어요 — 감사 로그에 기록됩니다') }}
          className="glass-btn-cta mt-3 h-10 w-full rounded-field bg-primary text-[13px] font-bold text-white hover:bg-primary-hover"
        >
          승자 B안을 자동 발송에 채택하기
        </button>
      ) : (
        <p className="mt-3 text-[12px] font-semibold text-ok">만기 D-90 자동 발송이 B안(사은품 각도)으로 나갑니다 — 다음 실험은 카피 생성기에서 새 안을 만들어 보세요.</p>
      )}
      <p className="mt-2 text-[11px] leading-4 text-bfaint">발송·클릭 수치는 데모 시뮬레이션입니다. 실서비스는 실제 발송 성과로 자동 판정돼요.</p>
    </Card>
  )
}
