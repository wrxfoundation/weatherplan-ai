// ─── 배너 관리 — 홈 롤링 배너(db.banners) 순서·노출·문구를 관제. 저장 즉시 홈 히어로에 반영 ──
// kind 'mobi' 는 그라디언트 위 인물 컷아웃 + 텍스트, 'scene' 은 21:9 장면 이미지 위 텍스트(HeroBanner 와 같은 규약).
// 이미지는 자체 호스팅 경로만 — 못 받아오면 썸네일·미리보기 모두 kind 라벨 박스로 대체한다(외부 URL 금지).
import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../../lib/store'
import { SITE_NAV } from '../../lib/constants'
import { Card, Btn, Modal, Drawer, Field, binputCls, useToast, EmptyState, KpiCard } from '../../components/ui'
import { IcMegaphone } from '../../components/icons'

const KIND = { mobi: { label: '모비형', tone: 'bg-tint text-primary-text' }, scene: { label: '장면형', tone: 'bg-brow text-bbody' } }
const DEFAULT_BG = 'linear-gradient(135deg,#2F6BFF 0%,#4F8BFF 100%)'
// 배너에 쓸 수 있는 자체 호스팅 에셋 — fetch-assets.mjs 가 내려받는 경로와 일치
const ASSETS = ['/assets/mobi-agent.png', '/assets/banner-support.png', '/assets/banner-car.png', '/assets/banner-home.png']
const LINKS = [...SITE_NAV.map((n) => n.to), '/consult', '/diagnosis', '/cars', '/benefits', '/benefits/signup', '/benefits/referral']

const firstLine = (s = '') => s.split('\n')[0]

// 배너 → 폼(평탄화) · 폼 → BANNER_UPSERT payload
const toForm = (b) => ({
  id: b.id ?? null, kind: b.kind ?? 'scene', eyebrow: b.eyebrow ?? '', title: b.title ?? '', desc: b.desc ?? '', note: b.note ?? '',
  image: b.image ?? '', bg: b.bg ?? DEFAULT_BG, active: b.active !== false,
  ctaLabel: b.cta?.label ?? '', ctaKind: b.cta?.action === 'chat' ? 'chat' : 'link', ctaTo: b.cta?.to ?? '',
})
const fromForm = (f) => ({
  ...(f.id ? { id: f.id } : {}),
  kind: f.kind, eyebrow: f.eyebrow.trim(), title: f.title.trim(), desc: f.desc.trim(), note: f.note.trim(),
  image: f.image.trim(), bg: f.bg.trim() || DEFAULT_BG, active: f.active,
  cta: f.ctaLabel.trim() ? (f.ctaKind === 'chat' ? { label: f.ctaLabel.trim(), action: 'chat' } : { label: f.ctaLabel.trim(), to: f.ctaTo.trim() || '/consult' }) : null,
})
const NEW_BANNER = { kind: 'scene', image: '/assets/banner-home.png', bg: DEFAULT_BG, active: true, cta: { label: '상담 신청하기', to: '/consult' } }

// 이미지 실패 시 kind 라벨 박스 — 썸네일(표)과 미리보기(드로어)가 공용
function BannerImg({ src, kind, className }) {
  const [err, setErr] = useState(false)
  useEffect(() => { setErr(false) }, [src])
  if (!src || err) return <span className="absolute right-1.5 top-1.5 rounded-full bg-white/25 px-1.5 py-0.5 text-[9px] font-bold text-white">{KIND[kind]?.label ?? kind}</span>
  return <img src={src} alt="" aria-hidden onError={() => setErr(true)} className={className} loading="lazy" />
}

// 21:9 라이브 미리보기 — HeroBanner 의 레이아웃 비율을 축소 재현
function BannerPreview({ b, small = false }) {
  const imgCls = b.kind === 'scene'
    ? 'absolute inset-0 h-full w-full object-cover object-right'
    : 'absolute bottom-0 right-0 h-full w-[42%] object-contain object-right-bottom'
  return (
    <div className={`relative aspect-[21/9] w-full overflow-hidden ${small ? 'rounded-md' : 'rounded-field'}`} style={{ background: b.bg || DEFAULT_BG }}>
      <BannerImg src={b.image} kind={b.kind} className={imgCls} />
      {!small && (
        <div className="relative z-10 flex h-full w-[62%] flex-col justify-center px-4 text-white">
          {b.eyebrow && <div className="truncate text-[8.5px] font-semibold text-white/85">{b.eyebrow}</div>}
          <div className="mt-1 whitespace-pre-line text-[13px] font-extrabold leading-[1.3] tracking-[-0.3px]">{b.title || '제목을 입력하세요'}</div>
          {b.desc && <p className="mt-1 line-clamp-2 whitespace-pre-line text-[8px] leading-[12px] text-white/85">{b.desc}</p>}
          {b.note && <p className="mt-1 text-[8.5px] font-bold">{b.note}</p>}
          {b.cta?.label && <span className="mt-1.5 inline-flex h-6 w-fit items-center rounded-md bg-white px-2 text-[8.5px] font-bold text-primary-text">{b.cta.label}</span>}
        </div>
      )}
    </div>
  )
}

export default function AdminBanners() {
  const { db, dispatch } = useStore()
  const toast = useToast()
  const [form, setForm] = useState(null)      // 드로어 폼(null = 닫힘)
  const [delTarget, setDelTarget] = useState(null)

  const banners = useMemo(() => [...(db.banners ?? [])].sort((a, b) => a.order - b.order), [db.banners])
  const active = banners.filter((b) => b.active)
  const rolling = active.map((b, i) => `${i + 1}. ${firstLine(b.title)}`).join('  →  ')

  const openNew = () => setForm(toForm(NEW_BANNER))
  const openEdit = (b) => setForm(toForm(b))
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e }))
  const preview = form ? fromForm(form) : null
  const valid = !!form && form.title.trim().length > 0

  const save = () => {
    if (!valid) return
    dispatch({ type: 'BANNER_UPSERT', payload: fromForm(form) })
    toast(form.id ? '배너를 수정했어요 — 홈 배너에 즉시 반영' : '배너를 등록했어요 — 홈 배너에 즉시 반영')
    setForm(null)
  }
  const toggle = (b) => {
    dispatch({ type: 'BANNER_TOGGLE', id: b.id })
    toast(b.active ? '노출을 껐어요 — 홈 배너에 즉시 반영' : '노출을 켰어요 — 홈 배너에 즉시 반영')
  }
  const move = (b, dir) => dispatch({ type: 'BANNER_MOVE', id: b.id, dir })
  const remove = () => {
    if (!delTarget) return
    dispatch({ type: 'BANNER_DELETE', id: delTarget.id })
    toast('배너를 삭제했어요 — 감사 로그에 기록됩니다')
    setDelTarget(null)
  }

  return (
    <div className="mx-auto max-w-6xl" data-t="admin-banners">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-extrabold text-bink">배너 관리</h1>
          <p className="mt-0.5 text-[12.5px] text-bmuted">홈 롤링 배너의 순서·노출·문구 — 저장하면 소비자 홈 히어로에 즉시 반영됩니다.</p>
        </div>
        <Btn size="sm" onClick={openNew}>새 배너</Btn>
      </div>

      {/* KPI — 노출 상태와 실제 롤링 순서를 표 위에서 먼저 확인 */}
      <div className="mt-4 grid gap-3 sm:grid-cols-[220px_1fr]">
        <KpiCard label="노출 중 배너" value={active.length} suffix="개" caption={`전체 ${banners.length}개 중 · 5초 자동 롤링`} accent={active.length === 0 ? 'text-danger' : undefined} />
        <Card track="b" className="p-4 sm:p-5 animate-rise">
          <div className="text-[12px] font-medium text-bmuted sm:text-[13px]">현재 롤링 순서</div>
          {active.length === 0 ? (
            <div className="mt-2 text-[13px] font-bold text-danger">노출 중인 배너가 없어 홈 히어로가 비어 있어요 — 노출을 켜주세요</div>
          ) : (
            <div className="mt-2 text-[13px] font-bold leading-6 text-bink">{rolling}</div>
          )}
          <div className="mt-1.5 text-[11px] text-bfaint sm:text-[12px]">모비형 {banners.filter((b) => b.kind === 'mobi').length} · 장면형 {banners.filter((b) => b.kind === 'scene').length}</div>
        </Card>
      </div>

      {/* 배너 표 — order 순. ↑↓ 로 롤링 순서를 바꾼다 */}
      <Card track="b" className="mt-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="text-[15.5px] font-extrabold text-bink">배너 목록 <span className="tnum text-bfaint">{banners.length}</span></h2>
          <span className="text-[11.5px] text-bfaint">노출 OFF 는 숨김이지 삭제가 아니에요</span>
        </div>
        <div className="mt-3 hidden grid-cols-[44px_104px_72px_1.4fr_1fr_70px_72px_104px] gap-2 border-b border-brow bg-brow/50 px-5 py-2.5 text-[11.5px] font-bold text-bmuted lg:grid">
          <span>순서</span><span>썸네일</span><span>종류</span><span>제목</span><span>CTA</span><span>노출</span><span>이동</span><span>액션</span>
        </div>
        {banners.map((b, i) => (
          <div key={b.id} data-t="banner-row" data-id={b.id} className={`grid grid-cols-[1fr_auto] items-center gap-2 border-b border-brow px-4 py-3 lg:grid-cols-[44px_104px_72px_1.4fr_1fr_70px_72px_104px] lg:px-5 ${b.active ? '' : 'opacity-60'}`}>
            <span className="tnum hidden text-[13px] font-extrabold text-bink lg:block">{i + 1}</span>
            <div className="hidden w-[96px] lg:block"><BannerPreview b={b} small /></div>
            <span className="hidden lg:block"><span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${KIND[b.kind]?.tone ?? 'bg-brow text-bbody'}`}>{KIND[b.kind]?.label ?? b.kind}</span></span>
            <div className="min-w-0">
              <div className="truncate text-[13.5px] font-bold text-bink"><span className="tnum mr-1.5 text-bfaint lg:hidden">{i + 1}.</span>{firstLine(b.title)}</div>
              <div className="truncate text-[11.5px] text-bfaint">{b.eyebrow}</div>
              <div className="mt-1 flex flex-wrap gap-1 lg:hidden">
                <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${KIND[b.kind]?.tone ?? 'bg-brow text-bbody'}`}>{KIND[b.kind]?.label ?? b.kind}</span>
                {b.cta?.label && <span className="rounded-full bg-brow px-2 py-0.5 text-[10.5px] font-bold text-bbody">{b.cta.label}</span>}
              </div>
            </div>
            <div className="hidden min-w-0 lg:block">
              {b.cta?.label ? (
                <>
                  <div className="truncate text-[12.5px] font-semibold text-bbody">{b.cta.label}</div>
                  <div className="truncate text-[11px] text-bfaint">{b.cta.action === 'chat' ? '모비 채팅 열기' : b.cta.to}</div>
                </>
              ) : <span className="text-[12px] text-bfaint">없음</span>}
            </div>
            <div className="flex items-center justify-end gap-2 lg:justify-start">
              <button
                type="button" role="switch" aria-checked={b.active} aria-label={`${firstLine(b.title)} 노출`} data-t="banner-toggle"
                onClick={() => toggle(b)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${b.active ? 'bg-primary' : 'bg-bline'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-card transition-transform ${b.active ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {/* 이동(↑↓)과 액션(편집·삭제)은 별도 셀 — 한 셀(72px)에 몰아넣으면 버튼이 한 글자씩 꺾이고 카드 밖으로 잘린다. 모바일은 2행째 좌/우 */}
            <div className="flex items-center gap-1.5">
              <button type="button" data-t="banner-up" aria-label="위로" disabled={i === 0} onClick={() => move(b, -1)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brow text-[12px] font-extrabold text-bbody hover:bg-bink hover:text-white disabled:opacity-30 disabled:hover:bg-brow disabled:hover:text-bbody">↑</button>
              <button type="button" data-t="banner-down" aria-label="아래로" disabled={i === banners.length - 1} onClick={() => move(b, 1)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brow text-[12px] font-extrabold text-bbody hover:bg-bink hover:text-white disabled:opacity-30 disabled:hover:bg-brow disabled:hover:text-bbody">↓</button>
            </div>
            <div className="flex justify-end gap-1.5 lg:justify-start">
              <button type="button" data-t="banner-edit" onClick={() => openEdit(b)} className="h-8 shrink-0 whitespace-nowrap rounded-full bg-tint px-3 text-[11.5px] font-bold text-primary-text hover:bg-primary hover:text-white">편집</button>
              <button type="button" onClick={() => setDelTarget(b)} className="h-8 shrink-0 whitespace-nowrap rounded-full bg-danger/10 px-3 text-[11.5px] font-bold text-danger hover:bg-danger hover:text-white">삭제</button>
            </div>
          </div>
        ))}
        {banners.length === 0 && <EmptyState icon={IcMegaphone} text="등록된 배너가 없어요" sub="새 배너를 눌러 첫 배너를 만들어 보세요" />}
      </Card>

      {/* 배너 편집 드로어 — 좌: 폼 / 상단: 라이브 미리보기 */}
      <Drawer open={!!form} onClose={() => setForm(null)} title={form?.id ? '배너 편집' : '새 배너'}>
        {form && (
          <div className="flex flex-col gap-3.5" data-t="banner-drawer">
            <div>
              <div className="mb-1.5 text-[12px] font-bold text-bmuted">미리보기 <span className="font-medium text-bfaint">· 홈 히어로 축소판</span></div>
              <BannerPreview b={preview} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="종류">
                <select className={binputCls} value={form.kind} onChange={set('kind')}>
                  <option value="mobi">모비형 (인물 컷아웃)</option>
                  <option value="scene">장면형 (21:9 이미지)</option>
                </select>
              </Field>
              <div>
                <span className="mb-1.5 block text-[13px] font-semibold text-label">노출</span>
                <label className="flex h-11 items-center gap-2 rounded-field border border-bline px-3 text-[13px] font-semibold text-bbody sm:h-10">
                  <input type="checkbox" checked={form.active} onChange={set('active')} className="h-4 w-4 accent-[#5377D6]" />
                  {form.active ? '홈에 노출' : '숨김'}
                </label>
              </div>
            </div>
            <Field label="상단 작은 문장 (eyebrow)"><input className={binputCls} value={form.eyebrow} onChange={set('eyebrow')} placeholder="예) 모두온 플랫폼의 AI비서 모비를 소개합니다" /></Field>
            <Field label="제목" required hint="줄바꿈이 배너 줄바꿈으로 그대로 들어가요">
              <textarea className="min-h-[72px] w-full rounded-field border border-bline p-3 text-[14px] text-bink focus:border-primary" value={form.title} onChange={set('title')} placeholder={'“상담원 기다리지 말고,\n모비에게 바로 물어보세요.”'} />
            </Field>
            <Field label="설명 (데스크톱에서만 노출)">
              <textarea className="min-h-[64px] w-full rounded-field border border-bline p-3 text-[13px] text-bink focus:border-primary" value={form.desc} onChange={set('desc')} placeholder="두 줄 이내로 짧게" />
            </Field>
            <Field label="강조 문장 (note)"><input className={binputCls} value={form.note} onChange={set('note')} placeholder="예) 24시간 언제든, 모비와 상담하세요." /></Field>
            <Field label="이미지 경로" hint="자체 호스팅 경로(/assets/…)만 — 못 받아오면 그라디언트만 보여요">
              <input className={binputCls} list="banner-assets" value={form.image} onChange={set('image')} placeholder="/assets/banner-home.png" />
              <datalist id="banner-assets">{ASSETS.map((a) => <option key={a} value={a} />)}</datalist>
            </Field>
            <Field label="배경 (CSS gradient)"><input className={`${binputCls} font-mono text-[12px]`} value={form.bg} onChange={set('bg')} placeholder={DEFAULT_BG} /></Field>
            <div className="rounded-field border border-bline p-3.5">
              <div className="text-[12.5px] font-extrabold text-bink">CTA 버튼</div>
              <div className="mt-2.5 flex flex-col gap-3">
                <Field label="라벨" hint="비우면 버튼 없이 노출"><input className={binputCls} value={form.ctaLabel} onChange={set('ctaLabel')} placeholder="예) 모비와 상담하기" /></Field>
                <div className="flex gap-1.5">
                  {[['link', '링크 이동'], ['chat', '모비 채팅 열기']].map(([k, l]) => (
                    <button key={k} type="button" onClick={() => setForm((f) => ({ ...f, ctaKind: k }))} className={`h-8 rounded-full px-3 text-[12px] font-bold ${form.ctaKind === k ? 'bg-bink text-white' : 'bg-brow text-bbody'}`}>{l}</button>
                  ))}
                </div>
                {form.ctaKind === 'link' && (
                  <Field label="이동 경로">
                    <input className={binputCls} list="banner-links" value={form.ctaTo} onChange={set('ctaTo')} placeholder="/consult" />
                    <datalist id="banner-links">{LINKS.map((l) => <option key={l} value={l} />)}</datalist>
                  </Field>
                )}
              </div>
            </div>
            <div className="mt-1 flex gap-2">
              <Btn variant="boutline" size="sm" className="flex-1" onClick={() => setForm(null)}>취소</Btn>
              <Btn size="sm" className="flex-1" disabled={!valid} onClick={save} data-t="banner-save">{form.id ? '저장' : '등록'}</Btn>
            </div>
            <p className="text-[11px] leading-4 text-bfaint">저장 즉시 소비자 홈 롤링 배너에 반영되고, 권한·감사 로그에 남아요.</p>
          </div>
        )}
      </Drawer>

      <Modal open={!!delTarget} onClose={() => setDelTarget(null)} title="배너 삭제">
        <p className="text-[13.5px] leading-5 text-bbody">
          <strong className="font-extrabold text-bink">“{firstLine(delTarget?.title)}”</strong> 배너를 삭제할까요? 되돌릴 수 없어요.
          잠시 내리는 거라면 삭제 대신 <strong className="text-bink">노출 OFF</strong> 를 권장해요.
        </p>
        <div className="mt-4 flex gap-2">
          <Btn variant="boutline" size="sm" className="flex-1" onClick={() => setDelTarget(null)}>돌아가기</Btn>
          <Btn variant="danger" size="sm" className="flex-1" onClick={remove}>삭제</Btn>
        </div>
      </Modal>
    </div>
  )
}
