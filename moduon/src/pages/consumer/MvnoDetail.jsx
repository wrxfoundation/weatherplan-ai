// ─── 알뜰폰 요금제 상세 — 가입유형·개통방법·유심 보유·유심 종류·고객유형 → 온라인 신청 ──
// 신규 개통이 불가능한 요금제에서 "신규가입"을 고르면 팝업으로 막고 번호이동으로 돌려준다(스펙).
// eSIM 미지원 요금제는 eSIM 선택을 막는다. 조합 판정은 lib/mvno.js mvnoOrder 한 곳.
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { mvnoPlan, mvnoBrand, JOIN, ACTIVATION, SIM_OWN, SIM_TYPES, CUSTOMER, mvnoOrder, showPrice } from '../../lib/mvno'
import { won } from '../../lib/engine'
import { LEGAL } from '../../lib/constants'
import { Modal } from '../../components/ui'
import ApplyChoiceModal from '../../components/ApplyChoiceModal'

export default function MvnoDetail() {
  const { id } = useParams()
  return <MvnoDetailInner key={id} />
}

function MvnoDetailInner() {
  const { id } = useParams()
  const plan = mvnoPlan(id)
  const brand = plan ? mvnoBrand(plan.brand) : null
  const [join, setJoin] = useState('mnp')
  const [simOwn, setSimOwn] = useState('none')
  const [simType, setSimType] = useState('usim')
  const [popup, setPopup] = useState(null) // 차단 사유
  const [ask, setAsk] = useState(false)

  const order = useMemo(() => (plan ? mvnoOrder({ planId: plan.id, join, simOwn, simType }) : null), [plan, join, simOwn, simType])
  // 신규 불가 요금제에서 신규를 고르면 즉시 팝업
  useEffect(() => { const b = order?.blocked.find((x) => x.code === 'no-new'); if (b) setPopup(b) }, [order])

  if (!plan) {
    return <main className="mx-auto max-w-6xl px-5 pt-12 sm:px-10"><div className="rounded-card bg-white p-8 text-center shadow-card"><div className="text-[16px] font-bold text-ink">요금제를 찾지 못했어요</div><Link to="/phone/mvno" className="mt-3 inline-block text-[13.5px] font-bold text-primary-text underline">알뜰폰 요금제 전체 보기</Link></div></main>
  }

  const label = `${brand.name} ${plan.name} · ${JOIN.find((j) => j.key === join)?.label} · 셀프개통 · 유심 ${simOwn === 'have' ? '보유' : SIM_TYPES.find((s) => s.key === simType)?.label}`
  const quote = { type: 'mvno', label: `${label} → 월 ${won(order.monthly)}`, total: order.monthly, gift: 0, planId: plan.id, join, simOwn, simType, customer: 'personal' }
  const seed = `${label} 조건으로 월 ${won(order.monthly)} 알뜰폰 요금제 가입하려는데, 지금 쓰는 요금이랑 비교해서 정말 절약되는지 봐주세요.`

  return (
    <main className="mx-auto max-w-6xl px-5 pb-32 sm:px-10 lg:pb-0">
      <div className="pt-8 sm:pt-12">
        <nav className="text-[12px] text-faint"><Link to="/category/phone" className="hover:text-primary-text">휴대폰</Link> › <Link to="/phone/mvno" className="hover:text-primary-text">알뜰폰 요금제</Link> › {plan.name}</nav>
        <div className="mt-1 flex flex-wrap items-center gap-2.5">
          <span className="text-[13px] font-extrabold" style={{ color: brand.color }}>{brand.name}</span>
          <h1 className="text-[24px] font-extrabold tracking-[-0.6px] text-ink sm:text-[26px]">{plan.name}</h1>
          {!plan.newJoin && <span className="rounded-full bg-orange-tint px-2.5 py-1 text-[11.5px] font-bold text-orange-text">번호이동 전용</span>}
        </div>
        <p className="mt-1 text-[13px] text-muted">{brand.network}망 · 데이터 {plan.data}GB + {plan.after} · 통화 {plan.call} · {brand.perk}</p>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-4">
          <Opt title="가입유형" testId="mvno-join" options={JOIN} value={join} onChange={setJoin}
            disabledKey={!plan.newJoin ? 'new' : null} disabledNote="이 요금제는 신규 개통이 불가능해요" />
          <Opt title="개통방법" testId="mvno-act" options={ACTIVATION} value="self" onChange={() => {}} />
          <Opt title="유심 보유 여부" testId="mvno-simown" options={SIM_OWN} value={simOwn} onChange={setSimOwn} />
          {simOwn === 'none' && (
            <Opt title="유심 종류" testId="mvno-simtype" options={SIM_TYPES.map((s) => ({ ...s, desc: `유심비 ${won(s.fee)}` }))} value={simType} onChange={setSimType}
              disabledKey={!plan.esim ? 'esim' : null} disabledNote="이 요금제는 eSIM을 지원하지 않아요" />
          )}
          <Opt title="고객유형" testId="mvno-cust" options={CUSTOMER} value="personal" onChange={() => {}} />
        </div>

        <aside className="lg:sticky lg:top-24 rounded-section bg-white p-6 shadow-panel" data-t="mvno-card">
          <div className="text-[12.5px] font-semibold text-faint">신청 내용</div>
          <div className="mt-0.5 text-[14.5px] font-bold leading-5 text-ink">{label}</div>
          <div className="mt-4 rounded-field bg-cream/70 p-3.5 text-[13px]">
            <Row l="월 요금" v={won(order.monthly)} bold />
            {plan.promo && <Row l={`정가 (${plan.months}개월 후)`} v={won(plan.monthly)} accent="text-faint" />}
            <Row l="유심비 (1회)" v={order.simFee ? won(order.simFee) : '없음'} accent={order.simFee ? 'text-ink' : 'text-ok'} />
            <div className="mt-1.5 flex justify-between border-t border-line pt-1.5"><span className="font-bold text-ink">첫 달 합계</span><span className="tnum font-extrabold text-ink" data-t="mvno-first">{won(order.firstMonth)}</span></div>
          </div>
          {order.promoNote && <div className="mt-2 rounded-field bg-tint px-3.5 py-2.5 text-[12px] font-semibold leading-4 text-primary-text">{order.promoNote}</div>}
          {!order.ok && <div className="mt-2 rounded-field bg-orange-tint px-3.5 py-2.5 text-[12px] font-semibold leading-4 text-orange-text" data-t="mvno-blocked">{order.blocked[0].msg}</div>}
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-[14px] font-bold text-ink">월 납부</span>
            <span className="tnum text-[30px] font-extrabold tracking-[-1px] text-primary-text" data-t="mvno-total">{won(order.monthly)}</span>
          </div>
          <button onClick={() => setAsk(true)} disabled={!order.ok} data-t="mvno-apply"
            className="shimmer-cta glass-btn-cta mt-4 h-[52px] w-full rounded-btn bg-primary text-[15.5px] font-extrabold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40">
            온라인 신청하기
          </button>
          <p className="mt-3 text-center text-[11px] leading-4 text-label">{LEGAL.quote} 유심 배송은 영업일 1~2일.</p>
        </aside>
      </div>

      <div className="safe-b fixed inset-x-0 bottom-0 z-40 rounded-t-card bg-white px-5 pb-4 pt-3 shadow-bottombar lg:hidden">
        <div className="flex items-center justify-between">
          <div><div className="text-[11px] font-semibold text-faint">월 납부</div><div className="tnum text-[24px] font-extrabold tracking-tight text-primary-text">{won(order.monthly)}</div></div>
          <button onClick={() => setAsk(true)} disabled={!order.ok} className="h-12 rounded-btn bg-primary px-6 text-[15px] font-extrabold text-white disabled:opacity-40">온라인 신청하기</button>
        </div>
      </div>

      {/* 신규 불가 팝업 */}
      <Modal open={!!popup} onClose={() => { setPopup(null); if (join === 'new') setJoin('mnp') }} title="신규 개통이 불가능한 요금제예요">
        <div data-t="mvno-popup">
          <p className="text-[13.5px] leading-6 text-body">{popup?.msg}</p>
          <p className="mt-1.5 text-[12px] leading-5 text-faint">쓰던 번호를 그대로 옮기는 <b className="text-ink">번호이동</b>으로는 바로 가입할 수 있어요.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => { setJoin('mnp'); setPopup(null) }} className="h-11 rounded-btn bg-primary text-[14px] font-bold text-white" data-t="mvno-popup-mnp">번호이동으로 진행</button>
            <Link to="/phone/mvno" className="flex h-11 items-center justify-center rounded-btn border border-line bg-white text-[14px] font-bold text-label">다른 요금제 보기</Link>
          </div>
        </div>
      </Modal>

      <ApplyChoiceModal open={ask} onClose={() => setAsk(false)} summary={`${label} → 월 ${won(order.monthly)} · 첫 달 ${won(order.firstMonth)}`} seed={seed} consultTo="/consult?cat=phone&kind=mvno" consultState={{ quote }} />
    </main>
  )
}

function Opt({ title, options, value, onChange, disabledKey, disabledNote, testId }) {
  return (
    <section className="rounded-card bg-white p-5 shadow-card" data-t={testId}>
      <h2 className="text-[15px] font-bold text-ink">{title}</h2>
      <div className={`mt-3 grid gap-2 ${options.length >= 3 ? 'grid-cols-3' : options.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {options.map((o) => {
          const dis = disabledKey === o.key
          // 불가 옵션도 눌린다 — 누르면 팝업이 이유를 말한다(스펙). aria-disabled 를 붙이면 눌리지 않는 것으로 취급돼 팝업 동선이 죽는다
          return (
            <button key={o.key} onClick={() => onChange(o.key)} aria-pressed={value === o.key} title={dis ? disabledNote : undefined}
              className={`rounded-btn border p-3.5 text-left transition-colors ${value === o.key ? 'border-[1.5px] border-primary bg-tint' : dis ? 'border-dashed border-line bg-cream/50 opacity-70' : 'border-line bg-white hover:border-primary/50'}`}>
              <div className={`text-[14px] font-bold ${value === o.key ? 'text-primary-text' : 'text-ink'}`}>{o.label}</div>
              {(o.desc || dis) && <div className={`mt-0.5 text-[11.5px] ${dis ? 'text-orange-text' : 'text-faint'}`}>{dis ? disabledNote : o.desc}</div>}
            </button>
          )
        })}
      </div>
    </section>
  )
}
function Row({ l, v, accent = 'text-ink', bold }) {
  return <div className="flex items-center justify-between py-0.5"><span className={bold ? 'font-bold text-label' : 'text-label'}>{l}</span><span className={`tnum ${bold ? 'font-extrabold' : 'font-bold'} ${accent}`}>{v}</span></div>
}
