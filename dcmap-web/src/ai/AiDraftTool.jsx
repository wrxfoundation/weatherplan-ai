import { useMemo, useState } from 'react'
import { callAiStream, usageLabel, aiReasonLabel } from '../data/aiApi.js'
import { FACILITIES } from '../data/facilities.js'
import { POWER_BALANCE } from '../data/powerBalance.js'
import { recommendSites, recoReasons } from '../score/recommend.js'
import AiText from './AiText.jsx'
import CopyButton from '../ui/CopyButton.jsx'

/* AI 인사이트 자동초안 — 운영자용. 주제 + 실제 집계 데이터 스냅샷만 넘겨 마크다운 기사 '초안'을 생성.
 * 정직성: 스냅샷의 실값만 전달하고, 결과는 '초안(검토 전)'임을 명시. 없는 값은 프롬프트가 '확인 필요'로 처리. */

const PRESETS = [
  '비수도권 데이터센터 입지 유인과 계통 여유 현황',
  '수도권 집중과 전력계통영향평가 관문',
  '전력 트랙(22.9kV·154kV·345kV)과 용량 임계',
  '냉각 기후 우위 지역과 프리쿨링 입지',
]

// 발행 전 검토용 실데이터 스냅샷 — 앱이 실제로 보유한 집계값만(창작 방지).
function buildSnapshot() {
  const total = FACILITIES.length
  const byStatus = {}
  const bySido = {}
  let publicMwSum = 0
  for (const f of FACILITIES) {
    byStatus[f.status] = (byStatus[f.status] || 0) + 1
    const sido = f.sido || '미상'
    bySido[sido] = (bySido[sido] || 0) + 1
    if (typeof f.power_mw_public === 'number') publicMwSum += f.power_mw_public
  }
  const topSido = Object.entries(bySido)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([시도, 시설수]) => ({ 시도, 시설수 }))

  // 시도별 전력 자급률 상·하위(전력거래소/KOSIS 집계)
  const balances = Object.entries(POWER_BALANCE)
    .map(([시도, v]) => ({ 시도, 자급률pct: v?.ratio ?? null }))
    .filter((b) => b.자급률pct != null)
    .sort((a, b) => b.자급률pct - a.자급률pct)
  const 자급률상위 = balances.slice(0, 4)
  const 자급률하위 = balances.slice(-4).reverse()

  // 정적 근거 상위 추천 후보(계산값 — 라이브축 제외)
  const top = recommendSites(8).map((s) => ({
    name: s.name,
    시도: s.sido,
    입지: s.nonCapital ? '비수도권' : '수도권',
    근거점수pct: s.pct,
    변전소km: s.subKm,
    계통여유MW: s.gridMw,
    승인율pct: s.gridApproval,
    냉각: s.climateLabel,
    근거: recoReasons(s).slice(0, 3).join(' · '),
  }))

  return {
    시설전수: total,
    상태별시설수: byStatus,
    공개전력합MW: Math.round(publicMwSum),
    시설밀집시도상위: topSido,
    전력자급률상위: 자급률상위,
    전력자급률하위: 자급률하위,
    정적근거_추천후보상위: top,
    주의: '이 스냅샷은 공개 데이터 집계·정적 근거 계산값이며, 라이브 축(침수·인구·용도지역 등)은 포함되지 않음',
  }
}

export default function AiDraftTool() {
  const [topic, setTopic] = useState('')
  const [ai, setAi] = useState(null)
  const snapshot = useMemo(() => buildSnapshot(), [])

  const gen = async (t) => {
    const query = (t ?? topic).trim()
    if (!query || ai === 'loading') return
    setTopic(query)
    setAi('loading')
    const res = await callAiStream('draft', { query, data: snapshot }, (partial) => setAi({ text: partial, streaming: true }))
    if (res?.available && res.text) setAi({ text: res.text, usage: res.usage })
    else setAi({ error: res?.reason || 'error' })
  }

  return (
    <section className="ai-draft" aria-label="AI 인사이트 자동초안">
      <div className="ai-draft-head">
        <span className="ai-badge">✨ AI 초안 도구</span>
        <span className="ai-src">운영자용 · 공개 데이터 스냅샷 기반 · 발행 전 검토 필요</span>
      </div>
      <p className="ai-draft-desc">
        주제를 입력하면 앱이 보유한 실제 집계·정적 근거 데이터({snapshot.시설전수}개 시설 · 공개 전력 {snapshot.공개전력합MW.toLocaleString()}MW)만으로
        인사이트 기사 <b>초안</b>을 생성합니다. 없는 수치는 만들지 않고 “확인 필요”로 표기합니다.
      </p>
      <form
        className="ai-draft-input"
        onSubmit={(e) => {
          e.preventDefault()
          gen()
        }}
      >
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="예: 비수도권 계통 여유와 데이터센터 입지 유인"
          aria-label="초안 주제"
        />
        <button type="submit" className="btn ai" disabled={ai === 'loading' || !topic.trim()}>
          {ai === 'loading' ? '초안 작성 중…' : '초안 생성'}
        </button>
      </form>
      <div className="ai-draft-presets">
        {PRESETS.map((p) => (
          <button key={p} type="button" className="ai-sug" onClick={() => gen(p)} disabled={ai === 'loading'}>
            {p}
          </button>
        ))}
      </div>

      {ai === 'loading' && (
        <div className="ai-card loading" role="status">
          <span className="sp-spinner" aria-hidden /> 실데이터 스냅샷으로 초안 작성 중…
        </div>
      )}
      {ai && ai !== 'loading' && ai.text && (
        <div className="ai-card" role="region" aria-label="AI 초안 결과">
          <div className="ai-card-head">
            <span className="ai-badge">✨ 초안 (검토 전)</span>
            <span className="ai-src">사실 확인 후 발행하세요 · 스냅샷 실값만 사용</span>
          </div>
          <AiText text={ai.text} />
          {ai.streaming && <span className="ai-cursor" aria-hidden />}
          {!ai.streaming && (
            <div className="ai-draft-foot">
              <CopyButton getText={() => ai.text} label="초안 복사" copiedLabel="복사됨" />
              <button type="button" className="ai-regen" onClick={() => gen()}>
                다시 생성
              </button>
              {ai.usage && <span className="ai-usage">{usageLabel(ai.usage)}</span>}
            </div>
          )}
        </div>
      )}
      {ai && ai !== 'loading' && ai.error && (
        <div className="ai-card err" role="alert">
          {aiReasonLabel(ai.error)}
          {ai.error !== 'not_configured' && (
            <button type="button" className="ai-regen" onClick={() => gen()}>다시 시도</button>
          )}
        </div>
      )}
    </section>
  )
}
