// ─── 혜택·이벤트 설정 — 포인트 정책(회원가입·친구초대·광고보기·멤버십몰) + 우측 플로팅 패널 문구/노출 ──
// db.benefits 가 단일 소스: 모두온혜택 허브·햄버거·FloatingPanel 이 실시간 참조. 저장은 BENEFITS_UPDATE(patch, note) 한 번.
// 대표번호는 HQ_TEL 을 그대로 보여준다(여기서 바꾸지 않는다 — 헤더·푸터·패널이 같은 상수를 읽는다).
import { useMemo, useState } from 'react'
import { useStore } from '../../lib/store'
import { HQ_TEL, HQ_HOURS, HQ_HOURS_SHORT } from '../../lib/constants'
import { fmtDateTime } from '../../lib/engine'
import { Card, Btn, Field, binputCls, useToast, EmptyState } from '../../components/ui'
import { IcGift, IcSearch, IcRobot, IcPhone } from '../../components/icons'

const NUM_KEYS = ['signupPoints', 'referralPoints', 'referralFriendPoints', 'adViewPoints', 'adDailyLimit']
const FLOAT_KEYS = ['title', 'hours', 'showSignup', 'showMobi', 'showConsultant', 'showFinder']
const KEY_LABEL = {
  signupPoints: '회원가입 포인트', referralPoints: '친구초대(초대자)', referralFriendPoints: '친구초대(친구)', adViewPoints: '광고보기 1회',
  adDailyLimit: '광고보기 일 한도', membershipMallOn: '멤버십몰 오픈', floating: '플로팅 패널',
}
const DEFAULT_FLOAT = { title: 'MODUON 알아보기', hours: HQ_HOURS, showSignup: true, showMobi: true, showConsultant: true, showFinder: true }

const toForm = (b = {}) => ({
  ...Object.fromEntries(NUM_KEYS.map((k) => [k, String(b[k] ?? 0)])),
  membershipMallOn: !!b.membershipMallOn,
  ...Object.fromEntries(FLOAT_KEYS.map((k) => [k, (b.floating ?? {})[k] ?? DEFAULT_FLOAT[k]])),
})

// 스위치 — <input type=checkbox name=…> 를 그대로 두어 스모크가 name 으로 찾는다
function Toggle({ name, label, hint, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-field border border-bline px-3.5 py-3">
      <span className="min-w-0">
        <span className="block text-[13px] font-bold text-bink">{label}</span>
        {hint && <span className="block text-[11.5px] text-bfaint">{hint}</span>}
      </span>
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input type="checkbox" name={name} checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="absolute inset-0 rounded-full bg-bline transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40" />
        <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-card transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  )
}

export default function AdminBenefits() {
  const { db, dispatch } = useStore()
  const toast = useToast()
  const b = db.benefits ?? {}
  const [form, setForm] = useState(() => toForm(b))
  const [note, setNote] = useState('')
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }))

  // 바뀐 키만 patch 로 — floating 은 통째로(리듀서가 얕은 병합이라 부분 객체를 보내면 나머지 키가 사라진다)
  const patch = useMemo(() => {
    const p = {}
    NUM_KEYS.forEach((k) => { const v = Math.max(0, Math.round(Number(form[k]) || 0)); if (v !== Number(b[k] ?? 0)) p[k] = v })
    if (form.membershipMallOn !== !!b.membershipMallOn) p.membershipMallOn = form.membershipMallOn
    const fl = Object.fromEntries(FLOAT_KEYS.map((k) => [k, form[k]]))
    const cur = { ...DEFAULT_FLOAT, ...(b.floating ?? {}) }
    if (FLOAT_KEYS.some((k) => fl[k] !== cur[k])) p.floating = fl
    return p
  }, [form, b])
  const dirty = Object.keys(patch).length > 0

  const save = () => {
    if (!dirty) return
    dispatch({ type: 'BENEFITS_UPDATE', payload: { patch, note: note.trim() || '혜택 설정 변경' } })
    toast(`혜택 설정 v${(b.version ?? 1) + 1} 적용 — 소비자 화면에 즉시 반영`)
    setNote('')
  }
  const reset = () => { setForm(toForm(b)); setNote('') }

  const numField = (k, label, hint, suffix = 'P') => (
    <Field key={k} label={label} hint={hint}>
      <div className="relative">
        <input type="number" min={0} name={k} className={`${binputCls} tnum pr-9`} value={form[k]} onChange={set(k)} />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-bfaint">{suffix}</span>
      </div>
    </Field>
  )

  const history = [...(b.history ?? [])].reverse()

  return (
    <div className="mx-auto max-w-6xl" data-t="admin-benefits">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-extrabold text-bink">혜택·이벤트 설정</h1>
          <p className="mt-0.5 text-[12.5px] text-bmuted">포인트 정책과 우측 플로팅 패널 — 현재 <strong className="font-extrabold text-bink">v{b.version ?? 1}</strong> · 저장하면 모두온혜택 허브·햄버거·플로팅 패널이 즉시 새 값을 읽어요.</p>
        </div>
        {dirty && <span className="tnum rounded-full bg-warn/10 px-3 py-1 text-[11.5px] font-bold text-warn">저장 안 된 변경 {Object.keys(patch).length}건</span>}
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        {/* (a) 포인트 정책 */}
        <Card track="b" className="p-5">
          <div className="flex items-center gap-2">
            <IcGift size={16} className="text-[#F2559A]" />
            <h2 className="text-[15.5px] font-extrabold text-bink">포인트 정책</h2>
          </div>
          <p className="mt-1 text-[11.5px] text-bfaint">모두온혜택 허브(회원가입·친구초대·광고보기)와 배너 문구가 이 값을 읽어요.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {numField('signupPoints', '무료회원가입 혜택', '가입 즉시 지급')}
            {numField('referralPoints', '친구초대 — 초대한 사람', '친구 가입 완료 시')}
            {numField('referralFriendPoints', '친구초대 — 초대받은 친구', '가입 즉시')}
            {numField('adViewPoints', '광고보기 1회', '시청 완료 기준')}
            {numField('adDailyLimit', '광고보기 일 한도', '하루 최대 횟수', '회')}
            <div className="flex items-end rounded-field bg-brow px-3.5 py-3 text-[12px] leading-5 text-bbody">
              광고 일 최대 <strong className="tnum text-bink">{(Number(form.adViewPoints) || 0) * (Number(form.adDailyLimit) || 0)}P</strong>
              <span className="ml-1 text-bfaint">(1회 × 한도)</span>
            </div>
          </div>
          <div className="mt-3">
            <Toggle name="membershipMallOn" label="멤버십몰 오픈" hint={form.membershipMallOn ? '햄버거·혜택 허브에서 쇼핑몰로 연결' : '"준비 중" 으로 표시'} checked={form.membershipMallOn} onChange={set('membershipMallOn')} />
          </div>
        </Card>

        {/* (b) 플로팅 패널 — 좌 설정 / 우 실제 패널 모양 미리보기 */}
        <Card track="b" className="p-5">
          <div className="flex items-center gap-2">
            <IcPhone size={16} className="text-primary-text" />
            <h2 className="text-[15.5px] font-extrabold text-bink">플로팅 패널 <span className="text-[12px] font-semibold text-bmuted">"MODUON 알아보기"</span></h2>
          </div>
          <p className="mt-1 text-[11.5px] text-bfaint">데스크톱 우측에 상주하는 상담 패널. 대표번호는 {HQ_TEL}(공통 상수)로 고정돼요.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_200px]">
            <div className="flex flex-col gap-3">
              <Field label="패널 제목"><input name="floatingTitle" className={binputCls} value={form.title} onChange={set('title')} placeholder={DEFAULT_FLOAT.title} /></Field>
              <Field label="상담 안내 문구" hint="줄바꿈이 그대로 들어가요 (3~4줄 권장)">
                <textarea name="floatingHours" className="min-h-[96px] w-full rounded-field border border-bline p-3 text-[13px] leading-5 text-bink focus:border-primary" value={form.hours} onChange={set('hours')} placeholder={HQ_HOURS} />
              </Field>
              <div className="grid grid-cols-1 gap-2">
                <Toggle name="showSignup" label="무료회원가입 혜택" checked={form.showSignup} onChange={set('showSignup')} />
                <Toggle name="showMobi" label="AI 모비와 실시간 상담" checked={form.showMobi} onChange={set('showMobi')} />
                <Toggle name="showConsultant" label="전문컨설턴트 상담" checked={form.showConsultant} onChange={set('showConsultant')} />
                <Toggle name="showFinder" label="우리집 맞춤 상품 찾기" checked={form.showFinder} onChange={set('showFinder')} />
              </div>
            </div>
            <FloatingPreview f={form} />
          </div>
        </Card>
      </div>

      {/* 저장 바 — 변경 사유와 함께 한 번에 적용 */}
      <div className="mt-4 flex flex-col gap-3 rounded-card bg-tint px-5 py-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-primary-text">
            {dirty ? <>바뀐 항목: <strong className="font-extrabold">{Object.keys(patch).map((k) => KEY_LABEL[k] ?? k).join(' · ')}</strong></> : '변경된 항목이 없어요'}
          </div>
          <input name="note" className={`${binputCls} mt-2 bg-white`} placeholder="변경 사유 (예: 9월 가입 프로모션)" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="flex shrink-0 gap-2">
          <Btn variant="boutline" size="sm" disabled={!dirty} onClick={reset}>되돌리기</Btn>
          <Btn size="sm" disabled={!dirty} onClick={save} data-t="benefits-save">v{(b.version ?? 1) + 1}로 저장</Btn>
        </div>
      </div>

      {/* 변경 이력 — 최신순 */}
      <Card track="b" className="mt-4 overflow-hidden">
        <div className="px-5 pt-4 text-[15.5px] font-extrabold text-bink">변경 이력</div>
        <div className="mt-3 hidden grid-cols-[80px_130px_1.4fr_1.6fr] gap-2 border-b border-brow bg-brow/50 px-5 py-2.5 text-[11.5px] font-bold text-bmuted sm:grid">
          <span>버전</span><span>일시</span><span>비고</span><span>바뀐 키</span>
        </div>
        {history.map((h) => (
          <div key={h.version} className="grid grid-cols-2 gap-2 border-b border-brow px-5 py-3 text-[12.5px] sm:grid-cols-[80px_130px_1.4fr_1.6fr]">
            <span className={`w-fit rounded-full px-2 py-0.5 text-[11px] font-extrabold ${h.version === b.version ? 'bg-ok/10 text-ok' : 'bg-brow text-bmuted'}`}>v{h.version}{h.version === b.version ? ' 현행' : ''}</span>
            <span className="tnum text-bmuted">{fmtDateTime(h.at)}</span>
            <span className="col-span-2 text-bbody sm:col-span-1">{h.note} <span className="text-bfaint">· {h.by}</span></span>
            <span className="col-span-2 flex flex-wrap gap-1 sm:col-span-1">
              {Object.keys(h.patch ?? {}).map((k) => <span key={k} className="rounded-full bg-tint px-2 py-0.5 text-[10.5px] font-bold text-primary-text">{KEY_LABEL[k] ?? k}</span>)}
            </span>
          </div>
        ))}
        {history.length === 0 && <EmptyState text="아직 변경 이력이 없어요" sub={`현재 v${b.version ?? 1} — 시드 기본값`} />}
      </Card>
    </div>
  )
}

// ─── 플로팅 패널 미리보기 — FloatingPanel 과 같은 구성(정적, 클릭 없음) ───
function FloatingPreview({ f }) {
  const [imgErr, setImgErr] = useState(false)
  const btn = 'flex h-9 w-full items-center gap-2 rounded-btn px-3 text-left text-[12px] font-bold'
  const visible = ['showSignup', 'showMobi', 'showConsultant', 'showFinder'].filter((k) => f[k]).length
  return (
    <div aria-hidden className="select-none" data-t="floating-preview">
      <div className="mb-1.5 text-[11px] font-bold text-bmuted">미리보기</div>
      <div className="w-full rounded-card border border-line-card bg-white p-2.5 shadow-panel">
        <div className="px-0.5 text-[12.5px] font-extrabold tracking-tight text-ink">{f.title || DEFAULT_FLOAT.title}</div>
        <div className="mt-2 flex flex-col gap-1.5">
          {f.showSignup && <div className={`${btn} border border-line-card bg-white text-ink`}><IcGift size={14} className="shrink-0 text-[#F2559A]" />무료회원가입 혜택</div>}
          {f.showMobi && <div className={`${btn} bg-tint text-primary-text`}><IcRobot size={14} className="shrink-0" />AI 모비와 실시간 상담</div>}
          {f.showConsultant && <div className={`${btn} bg-[#FFE500] text-ink`}><IcPhone size={14} className="shrink-0" />전문컨설턴트 상담</div>}
          {f.showFinder && <div className={`${btn} bg-primary text-white`}><IcSearch size={14} className="shrink-0" />우리집 맞춤 상품 찾기</div>}
          {visible === 0 && <div className="rounded-btn border border-dashed border-bline px-3 py-2 text-center text-[11px] text-bfaint">버튼이 모두 꺼져 있어요</div>}
        </div>
        <div className="relative mt-2.5 overflow-hidden rounded-btn bg-tint p-3">
          <p className="relative z-[1] whitespace-pre-line pr-10 text-[11px] font-bold leading-[1.4] text-ink">{f.hours || HQ_HOURS}</p>
          <div className="tnum relative z-[1] mt-1 text-[17px] font-extrabold tracking-tight text-primary-text">{HQ_TEL}</div>
          {/* 실제 FloatingPanel 과 같은 채널별 칩 2개 — '24시간' 만 두면 대표번호가 24시간으로 읽힌다 */}
                  <span className="relative z-[1] mt-1.5 flex flex-wrap gap-1">
                    <span className="inline-flex rounded-full bg-white px-2 py-0.5 text-[9.5px] font-bold text-primary-text shadow-card">모비 24시간 무료상담</span>
                    <span className="inline-flex rounded-full bg-white px-2 py-0.5 text-[9.5px] font-bold text-primary-text shadow-card">전화 {HQ_HOURS_SHORT}</span>
                  </span>
          {!imgErr && <img src="/assets/mobi-agent.png" alt="" onError={() => setImgErr(true)} className="pointer-events-none absolute -right-1 bottom-0 h-[84px] w-auto object-contain object-bottom" loading="lazy" />}
        </div>
      </div>
    </div>
  )
}
