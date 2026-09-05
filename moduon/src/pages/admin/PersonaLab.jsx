// ─── 페르소나 랩 — 속성 조합 패널 × 임의 텍스트 가설 시뮬레이션 ─────
// MatrAIx 컨셉의 범용화: 카피·오퍼·정책 어떤 텍스트든 "다양한 한국인
// 페르소나"에게 던져 반응 분포를 사전 탐색한다. 실측 대체 아님.
import { useMemo, useState } from 'react'
import { LAB_AXES, buildLabPanel, personaLab } from '../../lib/ai'
import { Card } from '../../components/ui'
import { AiInsight } from '../../components/AiPanel'
import { IcUsers, IcBulb } from '../../components/icons'

const AXIS_LABEL = { age: '연령대', house: '가구 형태', lean: '민감축', region: '권역' }
const PRESETS = [
  { name: '카피 예시', text: '(광고) 인터넷 갈아타면 최대 152만원+ 돌려받으세요. 월 32,900원 — 하루 1,097원꼴. 지급 명단 공개 중, 30초 견적 → 무료 수신거부: 설정' },
  { name: '오퍼 예시', text: '외국인 고객 파일럿: 체류기간 연동 약정(12/24/36개월), 현금 사은품 계좌 지급, 다국어 상담, 내·외국인 동일 가격 공개' },
  { name: '정책 예시', text: '9월부터 운영 수수료를 10%에서 11%로, 월 이용료를 30만원에서 35만원으로 조정합니다. 대신 정착지원 로컬 매칭 한도를 월 50만원에서 70만원으로 올립니다.' },
]

export default function AdminPersonaLab() {
  // 각 축에서 선택된 값들 — 기본은 전체 선택
  const [sel, setSel] = useState({ age: [...LAB_AXES.age], house: [...LAB_AXES.house], lean: [...LAB_AXES.lean], region: [...LAB_AXES.region] })
  const [size, setSize] = useState(6)
  const [text, setText] = useState('')

  const toggle = (axis, v) => setSel((s) => {
    const on = s[axis].includes(v)
    if (on && s[axis].length === 1) return s // 축당 최소 1개 유지
    return { ...s, [axis]: on ? s[axis].filter((x) => x !== v) : [...s[axis], v] }
  })

  const panel = useMemo(() => buildLabPanel(sel, size), [sel, size])
  const sig = useMemo(() => `${panel.map((p) => p.lean[0]).join('')}-${size}-${text.length}`, [panel, size, text])
  const ready = text.trim().length >= 15

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center gap-2">
        <h1 className="text-[20px] font-extrabold text-bink">페르소나 랩</h1>
        <span className="rounded-full bg-tint px-2.5 py-1 text-[11px] font-bold text-primary-text">가설 시뮬레이션</span>
      </div>
      <p className="mt-0.5 text-[12.5px] text-bmuted">속성을 조합해 한국인 가상 패널을 만들고, 카피·오퍼·정책 어떤 텍스트든 반응을 사전 탐색하세요 — 실측을 대체하지 않는 탐색 도구입니다.</p>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[2fr_3fr]">
        {/* ── 좌: 패널 구성 ── */}
        <Card track="b" className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15.5px] font-extrabold text-bink"><IcUsers size={16} className="text-primary-text" />패널 구성</h2>
            <div className="flex gap-1">
              {[4, 6, 8].map((n) => (
                <button key={n} onClick={() => setSize(n)} className={`tnum h-7 rounded-full px-2.5 text-[11.5px] font-bold ${size === n ? 'bg-bink text-white' : 'bg-brow text-bbody'}`}>{n}인</button>
              ))}
            </div>
          </div>
          {Object.entries(LAB_AXES).map(([axis, values]) => (
            <div key={axis} className="mt-3">
              <div className="text-[11.5px] font-bold text-bmuted">{AXIS_LABEL[axis]}</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {values.map((v) => (
                  <button key={v} onClick={() => toggle(axis, v)} className={`h-8 rounded-full px-3 text-[12px] font-bold transition-colors ${sel[axis].includes(v) ? 'bg-primary text-white' : 'bg-brow text-bbody hover:text-bink'}`}>{v}</button>
                ))}
              </div>
            </div>
          ))}
          <div className="mt-4 border-t border-dashed border-bline pt-3">
            <div className="text-[11.5px] font-bold text-bmuted">생성된 패널 <span className="tnum text-bfaint">{panel.length}인 · 같은 조합이면 항상 같은 패널</span></div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {panel.map((p, i) => (
                <div key={i} className="rounded-field bg-brow/60 px-2.5 py-2">
                  <div className="text-[12px] font-extrabold text-bink">{p.name}</div>
                  <div className="text-[10.5px] leading-3.5 text-bmuted">{p.house} · {p.region} · <span className="font-bold text-primary-text">{p.lean}</span></div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* ── 우: 대상 텍스트 + 시뮬레이션 ── */}
        <Card track="b" className="p-5">
          <h2 className="flex items-center gap-2 text-[15.5px] font-extrabold text-bink"><IcBulb size={16} className="text-warn" />대상 텍스트</h2>
          <p className="mt-1 text-[12px] text-bmuted">카피, 오퍼, 정책 공지 — 반응을 보고 싶은 텍스트를 붙여넣으세요 (15자 이상).</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button key={p.name} onClick={() => setText(p.text)} className="h-7 rounded-full bg-tint px-3 text-[11.5px] font-bold text-primary-text hover:bg-primary hover:text-white">{p.name} 넣기</button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="예) (광고) 인터넷 갈아타면 최대 152만원+ 돌려받으세요…"
            className="mt-2.5 min-h-[110px] w-full rounded-field border border-bline p-3 text-[13px] leading-5 focus:border-primary"
          />
          {ready ? (
            <AiInsight
              key={sig}
              className="mt-3"
              title={`패널 ${panel.length}인 반응 시뮬레이션`}
              desc="각 페르소나가 민감축에 충실하게 상/중/하 반응과 이유를 답하고, 종합에서 가장 약한 축과 보완점을 제시해요."
              cta="반응 시뮬레이션"
              build={() => personaLab({ personas: panel, text })}
            />
          ) : (
            <p className="mt-3 rounded-field bg-brow px-3.5 py-3 text-[12px] text-bmuted">텍스트를 입력하면 시뮬레이션 버튼이 열려요. 프리셋으로 바로 체험해 보세요.</p>
          )}
          <p className="mt-2.5 text-[11px] leading-4 text-bfaint">시뮬레이션은 가설 탐색용이며 실제 소비자 반응·실측 성과를 대체하지 않아요. 결정 게이트는 항상 실데이터(발송 성과·파일럿 KPI)로 두세요.</p>
        </Card>
      </div>
    </div>
  )
}
