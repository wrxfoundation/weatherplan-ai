// ─── 본사 어드민 · 프레스룸 (언론 자동화) ────────────────────────────
// 보도자료를 "쓰는 일"이 아니라 "돌아가는 파이프라인"으로: 실데이터 소재 수집
// → AI 초안 → 담당자 검수 → 채널 배포 예약 → 기록. 데모에서는 실제 송출 없이
// 기록만 남기고, 유료 게재형 기사의 '광고' 표기 등 매체 준수를 항상 고지한다.
import { useMemo, useState } from 'react'
import { useStore, adminStats } from '../../lib/store'
import { won, copyText } from '../../lib/engine'
import { Card, useToast } from '../../components/ui'
import { IcMegaphone } from '../../components/icons'
import { AiSpark } from '../../components/AiPanel'
import { callClaude, pressRelease } from '../../lib/ai'

const KINDS = [
  { key: 'open', label: '신규 분양몰 오픈' },
  { key: 'record', label: '월간 실적·지급 공개' },
  { key: 'biz', label: '외국인 파일럿' },
  { key: 'brand', label: '플랫폼 소개' },
]
// 실존 매체명 대신 채널 "유형"으로 관리 — 실제 계약 매체는 운영 단계에서 연결.
// price는 건당 게재 단가(데모 예시, VAT 별도) — 시장에선 매체 등급(포털 제휴
// 여부)에 따라 건당 1만~수십만원대로 형성되고, 도매 대행 단가에 마진을 얹어
// 재판매하는 구조가 일반적이다.
const CHANNELS = [
  { key: 'wire', label: '온라인 뉴스와이어', desc: '배포망 일괄 송출', price: 30000 },
  { key: 'local', label: '지역지·커뮤니티', desc: '분양몰 권역 로컬 매체', price: 20000 },
  { key: 'econ', label: '경제·IT 온라인', desc: '산업·플랫폼 담당 매체', price: 150000 },
  { key: 'portal', label: '포털 제휴 매체', desc: '포털 뉴스 노출 등급', price: 180000 },
  { key: 'newsroom', label: '자사 뉴스룸·블로그', desc: '오가닉·검색 유입', price: 0 },
]
const PIPE = ['소재 자동 수집', 'AI 초안 생성', '담당자 검수', '채널 배포', '클리핑 수집']

const loadChannels = () => {
  try { return new Set(JSON.parse(localStorage.getItem('moduon_press_channels_v1')) ?? ['wire', 'newsroom']) } catch { return new Set(['wire', 'newsroom']) }
}

export default function AdminPress() {
  const { db, dispatch } = useStore()
  const toast = useToast()
  const s = adminStats(db)
  const [kind, setKind] = useState('record')
  const [on, setOn] = useState(loadChannels)
  const [state, setState] = useState('idle') // idle | loading | done
  const [text, setText] = useState('')
  const [src, setSrc] = useState('local')
  const [copied, setCopied] = useState(false)

  const now = new Date()
  const monthLabel = `${now.getMonth() + 1}월`
  const dateLabel = `${now.getDate()}일`
  const latestMall = useMemo(() => [...db.tenants].sort((a, b) => (b.openedAt ?? 0) - (a.openedAt ?? 0))[0], [db.tenants])
  const pressLogs = (db.aiEvents ?? []).filter((e) => e.kind === 'press')

  const toggleCh = (key) => {
    const next = new Set(on)
    next.has(key) ? next.delete(key) : next.add(key)
    setOn(next)
    try { localStorage.setItem('moduon_press_channels_v1', JSON.stringify([...next])) } catch { /* noop */ }
  }

  const build = () => pressRelease({
    kind,
    active: s.active.length,
    distributors: (db.distributors ?? []).length,
    done: s.done.length,
    leads: db.leads.length,
    salesText: won(s.totalSales),
    mallName: latestMall?.name ?? '신규 파트너',
    mallRegion: latestMall?.sigungu ?? '수도권',
    monthLabel,
    dateLabel,
  })

  const generate = async () => {
    setState('loading')
    const { prompt, task, local } = build()
    const reply = await callClaude(prompt, task)
    setText((reply ?? local).trim())
    setSrc(reply ? 'claude' : 'local')
    setState('done')
  }

  const copyAll = async () => {
    if (await copyText(text)) { setCopied(true); toast('보도자료 전문을 복사했어요'); setTimeout(() => setCopied(false), 1600) }
  }

  const orderTotal = CHANNELS.filter((c) => on.has(c.key)).reduce((sum, c) => sum + c.price, 0)

  const reserve = () => {
    if (!on.size) { toast('배포할 채널을 1곳 이상 선택하세요'); return }
    const title = (text.split('\n')[0] ?? '').replace('[보도자료] ', '').slice(0, 60)
    const kindLabel = KINDS.find((k) => k.key === kind)?.label ?? kind
    dispatch({ type: 'AI_EVENT', payload: { kind: 'press', q: title, source: src, label: `${kindLabel} · 채널 ${on.size}곳 · ${won(orderTotal)}`, auto: false } })
    toast(`채널 ${on.size}곳 · ${won(orderTotal)}(VAT 별도) 배포를 예약했어요 (데모 — 기록만 남습니다)`)
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-[-0.4px] text-bink">프레스룸 <span className="text-[14px] font-bold text-bmuted">· 언론 자동화</span></h1>
          <p className="mt-1 text-[13px] text-bmuted">운영 데이터가 곧 보도 소재 — 소재 수집부터 초안·배포·기록까지 한 파이프라인으로.</p>
        </div>
        <span className="hidden rounded-card bg-tint p-3.5 text-primary-text lg:block"><IcMegaphone size={30} sw={1.6} /></span>
      </div>

      {/* KPI */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Card track="b" className="p-4"><div className="text-[12px] text-bmuted">배포 예약 기록</div><div className="tnum mt-1 text-[22px] font-extrabold text-bink">{pressLogs.length}<span className="text-[13px]">건</span></div><div className="text-[11px] text-bfaint">데모 — 실송출 없음</div></Card>
        <Card track="b" className="p-4"><div className="text-[12px] text-bmuted">활성 배포 채널</div><div className="tnum mt-1 text-[22px] font-extrabold text-primary-text">{on.size}<span className="text-[13px]">/{CHANNELS.length}곳</span></div><div className="text-[11px] text-bfaint">유형 단위 — 계약 매체는 운영에서 연결</div></Card>
        <Card track="b" className="p-4"><div className="text-[12px] text-bmuted">{monthLabel} 자동 소재</div><div className="tnum mt-1 text-[22px] font-extrabold text-ok">{s.done.length}<span className="text-[13px]">건 완료</span></div><div className="text-[11px] text-bfaint">활성 몰 {s.active.length} · 리드 {db.leads.length}</div></Card>
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[3fr_2fr]">
        {/* ── 좌: AI 보도자료 생성기 ── */}
        <Card track="b" className="p-5">
          <div className="flex items-center gap-1.5 text-[15.5px] font-extrabold text-bink"><AiSpark /> AI 보도자료 생성기</div>
          <p className="mt-1 text-[12px] text-bmuted">소재 유형을 고르면 관제 실데이터(개통·몰·리드·매출)가 자동 주입됩니다. 사실·수치만 — 최상급 표현 금지.</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {KINDS.map((k) => (
              <button key={k.key} onClick={() => { setKind(k.key); setState('idle'); setText('') }} className={`h-8 rounded-full px-3.5 text-[12px] font-bold transition-colors ${kind === k.key ? 'bg-bink text-white' : 'bg-brow text-bbody hover:text-bink'}`}>{k.label}</button>
            ))}
          </div>
          <div className="mt-3 rounded-field bg-brow/60 p-3 text-[11.5px] leading-[17px] text-bmuted">
            소재 미리보기 — 활성 분양몰 <b className="tnum text-bink">{s.active.length}곳</b> · {monthLabel} 완료 <b className="tnum text-bink">{s.done.length}건</b> · 누적 리드 <b className="tnum text-bink">{db.leads.length}건</b>{kind === 'open' && latestMall && <> · 최신 몰 <b className="text-bink">{latestMall.name}({latestMall.sigungu})</b></>}
          </div>

          {state === 'idle' && (
            <button onClick={generate} className="glass-btn-cta mt-3 h-11 w-full rounded-field bg-primary text-[14px] font-bold text-white transition-colors hover:bg-primary-hover">초안 생성하기</button>
          )}
          {state === 'loading' && (
            <div className="mt-4 flex items-center gap-2 text-[13px] font-semibold text-bmuted"><span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" /> 보도자료 작성 중…</div>
          )}
          {state === 'done' && (
            <>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] font-bold text-bfaint">초안 — 발송 전 담당자 검수 필수</span>
                <span className="rounded-full bg-brow px-2 py-0.5 text-[10px] font-bold text-bfaint">{src === 'claude' ? 'Claude Opus 5' : '데모 브레인'}</span>
              </div>
              <div className="mt-1.5 max-h-[380px] overflow-y-auto whitespace-pre-line rounded-field border border-bline bg-white p-4 text-[13px] leading-[22px] text-bbody">{text}</div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button onClick={copyAll} className="glass-btn h-10 flex-1 rounded-field border border-bline bg-white text-[13px] font-bold text-bbody hover:border-primary hover:text-primary-text">{copied ? '복사됐어요!' : '전문 복사'}</button>
                <button onClick={reserve} className="glass-btn-cta h-10 flex-1 rounded-field bg-primary text-[13px] font-bold text-white hover:bg-primary-hover">채널 {on.size}곳 배포 예약 · {won(orderTotal)}</button>
                <button onClick={generate} className="h-10 rounded-field px-3 text-[12.5px] font-bold text-primary-text hover:underline">다시 생성</button>
              </div>
            </>
          )}
          <p className="mt-2.5 text-[11px] leading-4 text-bfaint">유료 게재형 기사는 신문법·표시광고법상 '광고' 표기 의무가 있습니다. 초안의 수치·사실을 검증한 뒤 발송하세요. 데모에서는 실제 송출 없이 기록만 남습니다.</p>
        </Card>

        {/* ── 우: 배포 채널 + 파이프라인 ── */}
        <div className="flex flex-col gap-4">
          <Card track="b" className="p-5">
            <h2 className="text-[15.5px] font-extrabold text-bink">배포 채널</h2>
            <p className="mt-1 text-[12px] text-bmuted">배포 예약 시 켜진 채널로 일괄 전송됩니다.</p>
            <div className="mt-3 flex flex-col gap-2">
              {CHANNELS.map((c) => {
                const active = on.has(c.key)
                return (
                  <button key={c.key} onClick={() => toggleCh(c.key)} className={`flex items-center justify-between gap-2 rounded-field border p-3 text-left transition-colors ${active ? 'border-primary/40 bg-tint/40' : 'border-bline hover:border-bfaint'}`}>
                    <span className="min-w-0">
                      <span className={`block text-[13px] font-bold ${active ? 'text-primary-text' : 'text-bink'}`}>{c.label}</span>
                      <span className="block text-[11px] text-bfaint">{c.desc}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className={`tnum block text-[12.5px] font-extrabold ${active ? 'text-primary-text' : 'text-bbody'}`}>{c.price ? `건당 ${won(c.price)}` : '무료'}</span>
                      <span className={`text-[10.5px] font-extrabold ${active ? 'text-primary-text' : 'text-bfaint'}`}>{active ? '담김 ✓' : '선택'}</span>
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-field bg-brow/60 px-3.5 py-2.5">
              <span className="text-[12px] font-bold text-bmuted">예상 집행액 <span className="text-[10.5px] font-semibold text-bfaint">(VAT 별도)</span></span>
              <span className="tnum text-[16px] font-extrabold text-bink">{won(orderTotal)}</span>
            </div>
            <p className="mt-2 text-[11px] leading-4 text-bfaint">단가는 데모 예시입니다. 실서비스에서는 도매 배포 대행 단가표 계약 또는 매체 직계약으로 채우고, 마진을 얹어 파트너에게 재판매할 수 있습니다.</p>
          </Card>
          <Card track="b" className="p-5">
            <h2 className="text-[15.5px] font-extrabold text-bink">자동화 파이프라인</h2>
            <div className="mt-3 flex flex-col gap-0">
              {PIPE.map((p, i) => (
                <div key={p} className="flex items-start gap-2.5">
                  <div className="flex flex-col items-center">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-extrabold ${i <= 3 ? 'bg-tint text-primary-text' : 'bg-brow text-bfaint'}`}>{i + 1}</span>
                    {i < PIPE.length - 1 && <span className="h-4 w-px bg-bline" />}
                  </div>
                  <div className="pb-2 text-[12.5px] font-bold text-bink">{p}{i === 2 && <span className="ml-1.5 rounded bg-warn/10 px-1.5 py-0.5 text-[10px] font-bold text-warn">사람 게이트</span>}{i === 4 && <span className="ml-1.5 rounded bg-brow px-1.5 py-0.5 text-[10px] font-bold text-bfaint">예정</span>}</div>
                </div>
              ))}
            </div>
            <p className="mt-1 text-[11px] leading-4 text-bfaint">검수(3단계)는 자동화하지 않습니다 — 회사 이름으로 나가는 문장은 사람이 최종 확인합니다.</p>
          </Card>
        </div>
      </div>

      {/* 발행 기록 */}
      <Card track="b" className="mt-4 p-5 sm:p-6">
        <h2 className="text-[15.5px] font-extrabold text-bink">배포 기록</h2>
        {pressLogs.length === 0 ? (
          <p className="mt-2 text-[12.5px] text-bmuted">아직 기록이 없습니다 — 초안을 생성하고 배포를 예약하면 여기에 쌓입니다.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-[13px]">
              <thead className="text-[11.5px] text-bfaint">
                <tr className="border-b border-bline">
                  <th className="px-2 py-2 text-left font-semibold">일시</th>
                  <th className="px-2 py-2 text-left font-semibold">제목</th>
                  <th className="px-2 py-2 text-left font-semibold">유형·채널</th>
                  <th className="px-2 py-2 text-right font-semibold">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bline">
                {pressLogs.map((e) => (
                  <tr key={e.id}>
                    <td className="tnum whitespace-nowrap px-2 py-2.5 text-bmuted">{new Date(e.at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-2 py-2.5 font-bold text-bink">{e.q}</td>
                    <td className="px-2 py-2.5 text-bbody">{e.label}</td>
                    <td className="px-2 py-2.5 text-right"><span className="rounded-full bg-tint px-2 py-0.5 text-[11px] font-bold text-primary-text">배포 예약(데모)</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
