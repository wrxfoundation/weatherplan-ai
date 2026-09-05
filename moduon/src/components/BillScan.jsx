// ─── 타사 명세서 AI 스캔 (데모 시뮬레이션) — "읽고 → 체험하고 → 가입" ──
// Wellbian Vision 흡수: 실서비스는 청구서 이미지를 Claude Vision이 판독한다.
// 데모는 파일 내용을 읽지 않고(개인정보 미저장) 결정적 목업 결과로 흐름만 재현.
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { calcQuote, won } from '../lib/engine'
import { useStore } from '../lib/store'
import { IcDoc, IcBolt, IcCheck } from './icons'

const MOCK_BILLS = [
  { carrier: 'KT', plan: '인터넷 500M + TV 베이직', monthly: 45100, note: '약정 만료 3개월 경과 — 할인 종료 상태로 추정' },
  { carrier: 'SK브로드밴드', plan: '인터넷 1G + IPTV', monthly: 52800, note: '결합 할인 미적용 구간 발견' },
  { carrier: 'LG U+', plan: '인터넷 500M 단독', monthly: 47300, note: 'TV 없이 단독 회선 — 결합 전환 여지 큼' },
]

export default function BillScan() {
  const { db } = useStore()
  const nav = useNavigate()
  const fileRef = useRef(null)
  const [state, setState] = useState('idle') // idle | scanning | done
  const [bill, setBill] = useState(null)

  // 모두온 최적 구성(계산기와 동일 엔진) — 500M+정수기 결합+프로모션 기준
  const ours = calcQuote({ speed: '500M', bundle: 'water', promo: true }, db.products)

  const onFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    // 파일 내용은 읽지 않는다 — 파일 크기로 목업 시나리오만 결정(개인정보 미접촉)
    const mock = MOCK_BILLS[f.size % MOCK_BILLS.length]
    setState('scanning')
    setTimeout(() => { setBill(mock); setState('done') }, 1400)
    e.target.value = ''
  }

  const monthlySave = bill ? Math.max(0, bill.monthly - ours.total) : 0
  const total36 = monthlySave * 36 + ours.gift

  return (
    <section className="rounded-card bg-white p-5 shadow-card sm:p-6 animate-rise">
      <div className="flex flex-wrap items-baseline justify-between gap-1.5">
        <h2 className="flex items-center gap-2 text-[16px] font-bold text-ink"><IcDoc size={17} className="text-primary-text" />지금 내는 요금, 명세서로 바로 비교</h2>
        <span className="text-[11.5px] text-faint">타사 청구서를 올리면 AI가 절감액을 계산해요</span>
      </div>

      {state === 'idle' && (
        <>
          <button
            onClick={() => fileRef.current?.click()}
            className="mt-3.5 flex w-full flex-col items-center justify-center gap-1.5 rounded-btn border-2 border-dashed border-line py-7 text-center transition-colors hover:border-primary hover:bg-tint/30"
          >
            <IcBolt size={22} className="text-primary-text" />
            <span className="text-[14px] font-bold text-ink">청구서 사진·PDF를 올려주세요</span>
            <span className="text-[11.5px] text-faint">통신사 앱 캡처도 OK — 10초면 분석 완료</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={onFile} aria-label="명세서 업로드" />
          <p className="mt-2 text-[11px] leading-4 text-faint">데모 시뮬레이션입니다 — 파일은 읽지도, 저장하지도 않아요. 실서비스는 AI 비전이 명세서를 판독합니다.</p>
        </>
      )}

      {state === 'scanning' && (
        <div className="mt-4 flex items-center gap-3 rounded-btn bg-tint/40 px-4 py-5">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <div>
            <div className="text-[13.5px] font-bold text-ink">AI가 명세서를 읽고 있어요…</div>
            <div className="text-[11.5px] text-muted">통신사·요금제·약정 상태를 인식하는 중</div>
          </div>
        </div>
      )}

      {state === 'done' && bill && (
        <div className="mt-4">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <div className="rounded-btn border border-line p-3.5">
              <div className="text-[11px] font-bold text-faint">인식된 현재 요금</div>
              <div className="mt-1 text-[13.5px] font-bold text-ink">{bill.carrier} · {bill.plan}</div>
              <div className="tnum mt-0.5 text-[20px] font-extrabold text-ink">월 {won(bill.monthly)}</div>
              <div className="mt-1 text-[11.5px] leading-4 text-orange-text">{bill.note}</div>
            </div>
            <div className="rounded-btn border-[1.5px] border-ok/50 bg-ok/[0.05] p-3.5">
              <div className="text-[11px] font-bold text-ok">모두온 최적 구성 (500M + 정수기 결합 + 프로모션)</div>
              <div className="tnum mt-1 text-[20px] font-extrabold text-ink">월 {won(ours.total)}</div>
              <div className="tnum mt-0.5 text-[12px] font-bold text-ok">월 −{won(monthlySave)} 절감</div>
              <div className="tnum text-[11.5px] text-muted">+ 현금 사은품 {won(ours.gift)} (조건 충족 시)</div>
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between rounded-btn bg-orange-tint px-4 py-3">
            <span className="text-[12.5px] font-bold text-orange-text"><IcCheck size={13} className="inline -mt-0.5 mr-1" />3년 총 혜택 (절감 + 사은품)</span>
            <span className="tnum text-[18px] font-extrabold text-orange-text">{won(total36)}</span>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => nav('/consult?cat=internet', { state: { billScan: { from: `${bill.carrier} ${bill.plan}`, monthly: bill.monthly, save: monthlySave } } })}
              className="shimmer-cta glass-btn-cta h-11 flex-1 rounded-btn bg-primary text-[14px] font-bold text-white hover:bg-primary-hover"
            >
              이 조건으로 갈아타기 상담 →
            </button>
            <button onClick={() => { setState('idle'); setBill(null) }} className="glass-btn h-11 rounded-btn border border-line bg-white px-4 text-[13px] font-bold text-label hover:border-primary hover:text-primary-text">
              다시 스캔
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-4 text-faint">인식 결과는 데모 예시이며, 실제 위약금·결합 조건은 상담 시 확인됩니다.</p>
        </div>
      )}
    </section>
  )
}
