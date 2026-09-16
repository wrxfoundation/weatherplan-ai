// ─── 모두온혜택 허브 — 무료회원가입 혜택 · 친구초대 · 광고보기 · 멤버십몰 (아정당 구조) ──────
// 포인트 수치는 db.benefits(어드민 혜택 설정)를 읽고, 내 포인트·초대 코드·광고 시청 횟수·멤버십몰 알림 신청은 localStorage 데모.
// /benefits/:section(signup|invite|ads|mall) 으로 들어오면 해당 카드로 스크롤하고 잠시 강조한다 — 같은 섹션 링크를 다시 눌러도 반복.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { copyText, fmtDate, timeAgo } from '../../lib/engine'
import { Btn, Modal, useToast, useCountUp } from '../../components/ui'
import { IcGift, IcUsers, IcMegaphone, IcCart, IcShare, IcCheck, IcCalendar, IcBell } from '../../components/icons'

const SECTIONS = [
  { key: 'signup', label: '무료회원가입 혜택' },
  { key: 'invite', label: '친구초대하기' },
  { key: 'ads', label: '광고보기' },
  { key: 'mall', label: '멤버십몰' },
]
const POINTS_KEY = 'moduon_points'
const SIGNUP_KEY = 'moduon_signup_claimed'
const REF_KEY = 'moduon_ref_code'
const INVITE_KEY = 'moduon_invites'
const MALL_NOTIFY_KEY = 'moduon_mall_notify'
const AD_SEC = 15

const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v) } catch { return d } }
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* quota */ } }
// 광고 시청 횟수는 날짜 키로 — 자정이 지나면 자동으로 0부터
const todayKey = () => { const d = new Date(); return `moduon_ads_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
// 초대 코드 'MD'+6자리 — 헷갈리는 0/O/1/I 는 뺀다
const makeCode = () => { const cs = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = 'MD'; for (let i = 0; i < 6; i++) s += cs[Math.floor(Math.random() * cs.length)]; return s }
const getRefCode = () => {
  try {
    let c = localStorage.getItem(REF_KEY)
    if (!c) { c = makeCode(); localStorage.setItem(REF_KEY, c) }
    return c
  } catch { return makeCode() }
}
const pt = (n) => `${Number(n ?? 0).toLocaleString('ko-KR')}P`
const hideImg = (e) => { e.currentTarget.style.display = 'none' }

// 혜택 카드 공통 틀 — :section 강조 링은 여기서 받는다
function BenefitCard({ k, icon: Icon, tone, title, desc, hl, cardRef, children }) {
  return (
    <section
      ref={cardRef}
      id={`benefit-${k}`}
      data-t="benefit-card"
      data-key={k}
      className={`rounded-section bg-white p-5 shadow-card transition-shadow sm:p-7 ${hl ? 'ring-2 ring-primary ring-offset-2' : ''}`}
    >
      <div className="flex items-start gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tone}`}><Icon size={20} /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-extrabold text-ink">{title}</h2>
          <p className="mt-1 text-[13px] leading-5 text-muted">{desc}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export default function Benefits() {
  const { section } = useParams()
  const { key: locKey } = useLocation()
  const { db } = useStore()
  const toast = useToast()
  const b = db.benefits ?? {}

  // ── 내 포인트(데모) — 이 브라우저에만 저장 ──
  const [pts, setPts] = useState(() => {
    const v = lsGet(POINTS_KEY, null)
    return v && typeof v.balance === 'number' ? { balance: v.balance, ledger: Array.isArray(v.ledger) ? v.ledger : [] } : { balance: 0, ledger: [] }
  })
  useEffect(() => { lsSet(POINTS_KEY, pts) }, [pts])
  const earn = (amount, label) => setPts((p) => ({ balance: p.balance + amount, ledger: [{ at: Date.now(), amount, label }, ...p.ledger].slice(0, 50) }))
  const balance = useCountUp(pts.balance)

  // ── 무료회원가입 혜택 — 1회만 ──
  const [claimed, setClaimed] = useState(() => lsGet(SIGNUP_KEY, false) === true)
  const claimSignup = () => {
    if (claimed) return
    setClaimed(true)
    lsSet(SIGNUP_KEY, true)
    earn(b.signupPoints ?? 0, '무료회원가입 혜택')
    toast(`${pt(b.signupPoints)} 적립됐어요`)
  }

  // ── 친구초대 — 코드·링크·공유·현황 ──
  const [code] = useState(getRefCode)
  const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${code}`
  const [invites, setInvites] = useState(() => { const v = lsGet(INVITE_KEY, {}); return { sent: v.sent ?? 0, joined: v.joined ?? 0 } })
  useEffect(() => { lsSet(INVITE_KEY, invites) }, [invites])
  const copyLink = async () => {
    const ok = await copyText(link)
    toast(ok ? '초대 링크를 복사했어요' : '복사에 실패했어요', ok ? 'ok' : 'err')
    if (ok) setInvites((v) => ({ ...v, sent: v.sent + 1 }))
  }
  // 카카오·문자 — 기기 공유 시트가 있으면 그걸로, 없으면 링크 복사
  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: '모두온 초대', text: `모두온에서 같이 혜택 받아요! 초대코드 ${code}`, url: link })
        setInvites((v) => ({ ...v, sent: v.sent + 1 }))
      } catch { /* 사용자가 공유 시트를 닫음 */ }
      return
    }
    copyLink()
  }
  const demoJoin = () => {
    setInvites((v) => ({ ...v, joined: v.joined + 1 }))
    earn(b.referralPoints ?? 0, '친구초대 보상')
    toast(`친구가 가입했어요 — ${pt(b.referralPoints)} 적립`)
  }

  // ── 광고보기 — 15초 데모 광고, 일 한도 ──
  const dayKey = todayKey()
  const [adCount, setAdCount] = useState(() => Number(lsGet(dayKey, 0)) || 0)
  const [adOpen, setAdOpen] = useState(false)
  const [left, setLeft] = useState(AD_SEC)
  const rewarded = useRef(false)
  const limit = b.adDailyLimit ?? 0
  const remain = Math.max(0, limit - adCount)
  const startAd = () => {
    if (remain <= 0) { toast('오늘 볼 수 있는 광고를 다 봤어요', 'err'); return }
    rewarded.current = false
    setLeft(AD_SEC)
    setAdOpen(true)
  }
  useEffect(() => {
    if (!adOpen) return
    const t = setInterval(() => setLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [adOpen])
  useEffect(() => {
    if (!adOpen || left > 0 || rewarded.current) return
    rewarded.current = true
    const n = adCount + 1
    setAdCount(n)
    lsSet(dayKey, n)
    earn(b.adViewPoints ?? 0, '광고보기')
    setAdOpen(false)
    toast(`광고 시청 완료 — ${pt(b.adViewPoints)} 적립`)
  }, [left, adOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 멤버십몰 오픈 알림 — 준비 중일 때 제자리에서 신청만 받는다(상담 리드 폼으로 보내지 않음). 1회 ──
  const [mallNotify, setMallNotify] = useState(() => lsGet(MALL_NOTIFY_KEY, false) === true)
  const notifyMall = () => {
    if (mallNotify) return
    setMallNotify(true)
    lsSet(MALL_NOTIFY_KEY, true)
    toast('오픈하면 가장 먼저 알려드릴게요')
  }

  // ── :section → 해당 카드로 스크롤 + 강조. ScrollTop(useLayoutEffect)이 먼저 최상단으로 보내므로 한 틱 뒤에 이동.
  //    deps 에 location.key 를 넣어 같은 섹션 링크(히어로 칩·햄버거·플로팅·푸터)를 다시 눌러도 스크롤·강조가 반복되게 한다 ──
  const refs = useRef({})
  const [hl, setHl] = useState(null)
  useEffect(() => {
    if (!SECTIONS.some((s) => s.key === section)) { setHl(null); return }
    const t1 = setTimeout(() => { refs.current[section]?.scrollIntoView({ behavior: 'smooth', block: 'center' }); setHl(section) }, 60)
    const t2 = setTimeout(() => setHl(null), 3200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [section, locKey])

  // 관련 이벤트 — 진행중 상위 3
  const events = useMemo(
    () => db.posts.filter((p) => p.board === 'event' && p.status === '진행중').sort((a, c) => (c.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || c.createdAt - a.createdAt).slice(0, 3),
    [db.posts],
  )

  return (
    <main className="mx-auto max-w-5xl px-5 pb-16 sm:px-10">
      {/* 허브 히어로 */}
      <section data-t="benefits-hero" className="relative mt-6 overflow-hidden rounded-section p-6 text-white sm:p-9" style={{ background: 'linear-gradient(135deg,#2F6BFF 0%,#4F8BFF 100%)' }}>
        <img src="/assets/tile-benefit.png" alt="" aria-hidden className="pointer-events-none absolute -right-4 -top-4 hidden h-40 w-40 object-contain opacity-90 animate-floaty sm:block" onError={hideImg} />
        <div className="relative">
          <div className="text-[12.5px] font-bold text-white/80">MODUON BENEFIT</div>
          <h1 className="mt-1 text-[26px] font-extrabold tracking-[-0.5px] sm:text-[32px]">모두온혜택</h1>
          <p className="mt-2 max-w-xl text-[14px] leading-[22px] text-white/90">가입만 해도, 친구를 불러도, 광고 한 편만 봐도 포인트가 쌓여요. 쌓인 포인트는 멤버십몰이 열리면 바로 쓸 수 있어요.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <Link key={s.key} to={`/benefits/${s.key}`} className={`inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-bold transition-colors ${section === s.key ? 'bg-white text-primary-text' : 'bg-white/15 text-white hover:bg-white/25'}`}>{s.label}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* 내 포인트 */}
      <section data-t="points-card" className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-section bg-white p-5 shadow-card sm:p-7">
        <div className="flex items-center gap-4">
          <img src="/assets/obj-moneybag.png" alt="" aria-hidden className="h-14 w-14 object-contain" onError={hideImg} />
          <div>
            <div className="text-[12.5px] font-semibold text-label">내 포인트 <span className="text-faint">(데모)</span></div>
            <div className="tnum mt-0.5 text-[28px] font-extrabold leading-8 text-ink">{balance.toLocaleString('ko-KR')}<span className="ml-0.5 text-[16px]">P</span></div>
          </div>
        </div>
        <div className="min-w-0 flex-1 sm:max-w-xs">
          {pts.ledger.length ? (
            <ul className="divide-y divide-line-card text-[12.5px]">
              {pts.ledger.slice(0, 3).map((l, i) => (
                <li key={i} className="flex items-center justify-between gap-2 py-1.5">
                  <span className="truncate text-label">{l.label}</span>
                  <span className="tnum shrink-0 font-bold text-ok">+{l.amount.toLocaleString('ko-KR')}P</span>
                  <span className="shrink-0 text-faint">{timeAgo(l.at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12.5px] leading-5 text-faint">아직 적립 내역이 없어요 — 아래 혜택으로 첫 포인트를 받아보세요.</p>
          )}
        </div>
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {/* ① 무료회원가입 혜택 */}
        <BenefitCard k="signup" icon={IcGift} tone="bg-orange-tint text-orange-text" title="무료회원가입 혜택" desc="가입만 해도 포인트를 드려요. 상담 이력과 만기 알림도 한곳에서." hl={hl === 'signup'} cardRef={(el) => { refs.current.signup = el }}>
          <div className="flex items-baseline gap-1.5">
            <span className="tnum text-[28px] font-extrabold text-primary-text">{pt(b.signupPoints)}</span>
            <span className="text-[13px] text-muted">가입 즉시 적립</span>
          </div>
          {/* 데모에는 실제 가입 화면이 없다 — '가입 즉시 적립'을 이행하는 버튼을 1차로, /login(데모 롤 스위처)은 보조 링크로 문구와 도착 화면을 맞춘다 */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Btn size="sm" className="h-11" onClick={claimSignup} disabled={claimed} data-t="signup-claim">
              {claimed ? <><IcCheck size={14} /> 받기 완료</> : '가입 혜택 받기 (데모)'}
            </Btn>
            <Link to="/login" className="text-[12.5px] font-bold text-primary-text hover:underline">데모 로그인 화면 보기 →</Link>
          </div>
          <p className="mt-2 text-[11.5px] leading-4 text-faint">실서비스에서는 카카오·이메일로 가입하는 즉시 적립돼요. 데모에서는 위 버튼으로 적립을 체험할 수 있어요.</p>
        </BenefitCard>

        {/* ② 친구초대하기 */}
        <BenefitCard k="invite" icon={IcUsers} tone="bg-tint text-primary-text" title="친구초대하기" desc="내 링크로 친구가 가입하면 둘 다 포인트를 받아요." hl={hl === 'invite'} cardRef={(el) => { refs.current.invite = el }}>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-card bg-tint p-3">
              <div className="text-[11.5px] font-semibold text-label">초대한 나</div>
              <div className="tnum text-[20px] font-extrabold text-primary-text">{pt(b.referralPoints)}</div>
            </div>
            <div className="rounded-card bg-orange-tint p-3">
              <div className="text-[11.5px] font-semibold text-label">초대받은 친구</div>
              <div className="tnum text-[20px] font-extrabold text-orange-text">{pt(b.referralFriendPoints)}</div>
            </div>
          </div>
          <div className="mt-3 rounded-field border border-line bg-cream/60 p-3">
            <div className="text-[11.5px] font-semibold text-label">내 초대 코드</div>
            <div className="mt-0.5 flex flex-wrap items-center justify-between gap-2">
              <span data-t="ref-code" className="tnum text-[18px] font-extrabold tracking-wider text-ink">{code}</span>
              <button type="button" onClick={copyLink} className="text-[12.5px] font-bold text-primary-text hover:underline">링크 복사</button>
            </div>
            <div className="mt-1 truncate text-[12px] text-faint">{link}</div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Btn size="sm" onClick={shareLink}><IcShare size={14} /> 카카오·문자로 공유</Btn>
            <Btn variant="outline" size="sm" onClick={copyLink}>링크 복사</Btn>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-label">
            <span>초대 현황 <span className="text-faint">(데모)</span> — 보낸 초대 <b className="tnum text-ink">{invites.sent}</b> · 가입한 친구 <b className="tnum text-ink">{invites.joined}</b></span>
            <button type="button" onClick={demoJoin} className="text-[12px] font-bold text-primary-text hover:underline">친구 가입 시뮬레이션</button>
          </div>
        </BenefitCard>

        {/* ③ 광고보기 */}
        <BenefitCard k="ads" icon={IcMegaphone} tone="bg-ok/10 text-ok" title="광고보기" desc="짧은 광고 한 편에 포인트. 하루 한도까지 몇 번이든." hl={hl === 'ads'} cardRef={(el) => { refs.current.ads = el }}>
          <div className="flex items-baseline gap-1.5">
            <span className="tnum text-[28px] font-extrabold text-primary-text">{pt(b.adViewPoints)}</span>
            <span className="text-[13px] text-muted">/ 1회 · 하루 최대 <b className="tnum">{limit}</b>회</span>
          </div>
          <div className="mt-2 text-[13px] text-body">오늘 <b className="tnum">{adCount}</b>회 시청 · 남은 횟수 <b className="tnum text-primary-text" data-t="ad-remain">{remain}</b>회</div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-line-card" role="progressbar" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={adCount}>
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${limit ? Math.min(100, (adCount / limit) * 100) : 0}%` }} />
          </div>
          <Btn className="mt-4" size="sm" onClick={startAd} disabled={remain <= 0} data-t="ad-watch">{remain <= 0 ? '오늘 한도 소진' : `광고 보기 (${AD_SEC}초)`}</Btn>
          <p className="mt-2 text-[11.5px] text-faint">데모 광고 — 실제 광고는 송출되지 않아요.</p>
        </BenefitCard>

        {/* ④ 멤버십몰 */}
        <BenefitCard k="mall" icon={IcCart} tone="bg-cream text-orange-text" title="멤버십몰" desc="쌓은 포인트로 생활용품·기프티콘을 살 수 있는 회원 전용 몰." hl={hl === 'mall'} cardRef={(el) => { refs.current.mall = el }}>
          {b.membershipMallOn ? (
            <>
              <span className="inline-flex items-center rounded-full bg-ok/10 px-2.5 py-1 text-[12px] font-bold text-ok">오픈</span>
              <p className="mt-2 text-[13px] leading-5 text-body">지금 바로 포인트를 쓸 수 있어요.</p>
              <Link to="/shop" className="glass-btn-cta mt-4 inline-flex h-11 items-center gap-1.5 rounded-btn bg-primary px-5 text-[14px] font-bold text-white transition-colors hover:bg-primary-hover"><IcCart size={15} /> 쇼핑몰 가기</Link>
            </>
          ) : (
            <>
              <span className="inline-flex items-center rounded-full bg-brow px-2.5 py-1 text-[12px] font-bold text-bmuted">준비 중</span>
              <p className="mt-2 text-[13px] leading-5 text-body">멤버십몰이 열리면 쌓인 포인트를 바로 쓸 수 있어요. 오픈 소식을 먼저 받아보세요.</p>
              <Btn variant="outline" size="sm" className="mt-4 h-11" onClick={notifyMall} disabled={mallNotify} data-t="mall-notify">
                {mallNotify ? <><IcCheck size={14} /> 알림 신청 완료</> : <><IcBell size={15} /> 열리면 알림 받기</>}
              </Btn>
              {mallNotify && <p className="mt-2 text-[11.5px] text-faint">오픈 소식은 이 브라우저 기준 데모 알림이에요.</p>}
            </>
          )}
        </BenefitCard>
      </div>

      {/* 관련 이벤트 */}
      <section data-t="benefits-events" className="mt-6 rounded-section bg-white p-5 shadow-card sm:p-7">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-extrabold text-ink">진행 중인 이벤트</h2>
          <Link to="/board/event" className="text-[13px] font-bold text-primary-text hover:underline">전체 보기 →</Link>
        </div>
        {events.length ? (
          <ul className="mt-3 divide-y divide-line-card">
            {events.map((e) => (
              <li key={e.id}>
                <Link to={`/board/event/${e.id}`} className="flex flex-col gap-1 py-3 hover:text-primary-text sm:flex-row sm:items-center sm:justify-between">
                  <span className="truncate text-[14px] font-bold text-ink">{e.title}</span>
                  {e.period && <span className="flex shrink-0 items-center gap-1 text-[12px] text-faint"><IcCalendar size={11} /> {fmtDate(e.period.from)} ~ {fmtDate(e.period.to)}</span>}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[13px] text-faint">진행 중인 이벤트가 없어요.</p>
        )}
      </section>

      <p className="mt-4 text-[11.5px] leading-4 text-label">포인트·초대 현황·광고 시청 횟수는 이 브라우저에만 저장되는 데모 값이에요. 실서비스에서는 회원 계정에 귀속됩니다.</p>

      {/* 데모 광고 모달 — 끝까지 봐야 적립, 중간에 닫으면 적립 없음 */}
      <Modal open={adOpen} onClose={() => setAdOpen(false)} title="데모 광고">
        <div data-t="ad-modal" className="rounded-card p-6 text-center text-white" style={{ background: 'linear-gradient(135deg,#2F6BFF 0%,#4F8BFF 100%)' }}>
          <img src="/assets/ill-ai.png" alt="" aria-hidden className="mx-auto h-24 w-24 object-contain animate-floaty" onError={hideImg} />
          <div className="mt-3 text-[12.5px] font-bold text-white/80">데모 광고</div>
          <div className="mt-1 text-[18px] font-extrabold">모비에게 물어보면 지원금이 보여요</div>
          <div className="tnum mt-4 text-[40px] font-extrabold leading-none" data-t="ad-countdown">{Math.max(0, left)}</div>
          <div className="mt-1 text-[12.5px] text-white/80">초 후 {pt(b.adViewPoints)} 적립</div>
        </div>
        <p className="mt-3 text-[12px] text-faint">끝까지 봐야 포인트가 적립돼요. 지금 닫으면 적립되지 않아요.</p>
      </Modal>
    </main>
  )
}
