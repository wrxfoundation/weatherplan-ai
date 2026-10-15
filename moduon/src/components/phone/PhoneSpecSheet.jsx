// ─── 제품 정보(제로노트식) — 판매자 설계 화면 상단 · 고객 상세 ─────────────────────
// 운영팀 요청(2026-09-28): 제로노트처럼 휴대폰 설명(모델명·OS·출시일·사양 8칸·부가 속성·특징·구성품)이 보여야 한다.
// 데이터는 lib/phoneSpecs.js 한 곳. 모르는 칸은 '—' — 추측으로 채우지 않는다.
// action: 제목 오른쪽 자리(설계 화면·고객 상세 모두 '단말변경' 선택 — DeviceSwitch)
// foldKey: 주면 '접기' 버튼이 생기고 접힘 상태를 브라우저에 기억한다(판매자 설계 화면 — 매번 설명을 지나 스크롤하지 않게).
//          인쇄는 접힘과 상관없이 전부 나간다(고객에게 주는 문서).
import { useId, useState } from 'react'
import { PHONE_DEVICES, deviceTitle } from '../../lib/phones'
import { SPEC_KEYS, ATTR_KEYS, phoneSpec, specValue } from '../../lib/phoneSpecs'

const readFold = (k) => { try { return k ? localStorage.getItem(k) === '1' : false } catch { return false } }
const writeFold = (k, v) => { try { if (k) localStorage.setItem(k, v ? '1' : '0') } catch { /* 저장 불가 — 이번 화면에서만 */ } }

export default function PhoneSpecSheet({ device, storage, color, onColor, action, foldKey }) {
  const s = phoneSpec(device.id)
  const [more, setMore] = useState(false)
  const [folded, setFolded] = useState(() => readFold(foldKey))
  const toggleFold = () => { const v = !folded; setFolded(v); writeFold(foldKey, v) }
  const st = storage ?? device.storages?.[0]?.key ?? null
  const col = device.colors.find((c) => c.name === color) ?? device.colors[0]
  const title = deviceTitle(device, st)
  const meta = [s.model, s.os && `OS버전: ${s.os}`, s.released && `출시일: ${s.released}`].filter(Boolean)
  const hasFeatures = s.features?.some((g) => g.length > 0)

  return (
    <section className="rounded-card bg-white p-4 shadow-card sm:p-6" data-t="spec-sheet" data-device={device.id}>
      <div className="flex items-start justify-between gap-3 border-b-2 border-ink pb-3">
        <div className="min-w-0">
          <h2 className="text-[20px] font-extrabold tracking-[-0.5px] text-ink sm:text-[26px]" data-t="spec-title">{title}</h2>
          {meta.length > 0 && (
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-label sm:gap-x-2" data-t="spec-meta">
              {meta.map((m, i) => (
                <span key={m} className="inline-flex items-center gap-2">
                  {/* 구분선은 한 줄에 다 들어가는 폭에서만 — 폰에서 줄이 바뀌면 줄 머리에 '|' 만 남는다 */}
                  {i > 0 && <span aria-hidden className="hidden h-3 w-px bg-line sm:block" />}{m}
                </span>
              ))}
            </p>
          )}
          {s.note && <p className="mt-1 text-[12px] font-bold text-orange-text" data-t="spec-note">{s.note}</p>}
        </div>
        {(action || foldKey) && (
          <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center print:hidden">
            {foldKey && (
              <button type="button" onClick={toggleFold} aria-expanded={!folded} data-t="spec-fold"
                className="h-10 rounded-field px-2.5 text-[12.5px] font-bold text-label transition-colors hover:bg-zone hover:text-ink">
                {folded ? '제품 정보 펼치기 ▼' : '접기 ▲'}
              </button>
            )}
            {action}
          </div>
        )}
      </div>

      <div className={folded ? 'hidden print:block' : ''} data-t="spec-main">
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-[180px_minmax(0,1fr)] lg:grid-cols-[210px_minmax(0,1fr)]">
          {/* 왼쪽 — 그림 · 색상 */}
          <div className="flex flex-col items-center">
            <PhoneFigure form={s.form} color={col.hex} brand={device.brand} />
            <div className="mt-3 flex flex-wrap justify-center gap-1.5" role="group" aria-label="색상" data-t="spec-colors">
              {device.colors.map((c) => (
                <button key={c.name} type="button" onClick={() => onColor?.(c.name)} aria-pressed={col.name === c.name} aria-label={c.name} title={c.name}
                  className={`h-9 w-9 rounded-lg border-2 p-[3px] transition-colors ${col.name === c.name ? 'border-ink' : 'border-transparent hover:border-line'}`}>
                  <span className="block h-full w-full rounded-[5px] border border-black/10" style={{ background: c.hex }} />
                </button>
              ))}
            </div>
            <div className="mt-1.5 text-[13px] font-bold text-ink" data-t="spec-color">{col.name}</div>
          </div>

          {/* 오른쪽 — 사양 8칸 → 부가 속성 · 특징 → 구성품 */}
          <div className="min-w-0">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4" data-t="spec-grid">
              {SPEC_KEYS.map(({ key, label }) => (
                <div key={key} className="min-w-0" data-t={`spec-${key}`}>
                  <dt className="text-[12.5px] font-bold text-primary-text">{label}</dt>
                  <dd className="mt-1 whitespace-pre-line text-[13px] leading-[1.5] text-ink">{specValue(s, key, st) ?? '—'}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[190px_minmax(0,1fr)]">
              <dl className="flex flex-col gap-2 self-start text-[13px]" data-t="spec-attrs">
                {ATTR_KEYS.map(({ key, label }) => (
                  <div key={key} className="flex gap-3" data-t={`spec-attr-${key}`}>
                    <dt className="w-[70px] shrink-0 text-primary-text">{label}</dt>
                    <dd className="min-w-0 text-ink">{s.attrs?.[key] ?? '—'}</dd>
                  </div>
                ))}
              </dl>

              {hasFeatures && (
                <div className="min-w-0">
                  {/* 폰에서는 접어 둔다 — 설계·계산으로 내려가는 길이 길어지지 않게. 데스크톱·인쇄는 항상 펼침 */}
                  <button type="button" onClick={() => setMore(!more)} aria-expanded={more} data-t="spec-more"
                    className="flex h-10 w-full items-center justify-center rounded-field border border-line text-[13px] font-bold text-label transition-colors hover:border-primary hover:text-primary-text lg:hidden print:hidden">
                    제품 설명 {more ? '접기 ▲' : '펼치기 ▼'}
                  </button>
                  <div className={`${more ? 'mt-3 block' : 'hidden'} lg:mt-0 lg:block print:block`} data-t="spec-features">
                    {s.features.map((g, gi) => (
                      <ul key={gi} className={`flex flex-col gap-1 text-[13px] leading-[1.5] text-body ${gi ? 'mt-3' : ''}`}>
                        {g.map((f) => (typeof f === 'string'
                          ? <Dot key={f}>{f}</Dot>
                          : (
                            <Dot key={f.text}>
                              {f.text}
                              <ul className="mt-1 flex flex-col gap-1">
                                {f.sub.map((x) => <li key={x} className="text-[12.5px] text-label">- {x}</li>)}
                              </ul>
                            </Dot>
                          )))}
                      </ul>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {s.box && <div className="mt-5 rounded-field border border-line px-4 py-3 text-center text-[12.5px] text-body" data-t="spec-box">구성품: {s.box}</div>}
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-4 text-faint">제조사 공개 사양 기준이며, 통신사 모델·출시 시점에 따라 일부 다를 수 있어요.</p>
      </div>
    </section>
  )
}

function Dot({ children }) {
  return <li className="relative pl-4 before:absolute before:left-0.5 before:top-[0.6em] before:h-[7px] before:w-[7px] before:rounded-full before:bg-ink">{children}</li>
}

// '단말변경' — 버튼처럼 보이는 네이티브 선택 상자(눌러서 바로 다른 기종 목록이 뜬다. 폰에서도 시스템 선택창)
export function DeviceSwitch({ value, onChange, t = 'spec-change' }) {
  const id = useId()
  return (
    <div className="relative inline-flex h-10 items-center gap-1.5 rounded-field border-2 border-ink bg-white px-3 text-[13.5px] font-extrabold text-ink transition-colors focus-within:ring-2 focus-within:ring-primary/40 hover:bg-zone">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 12a8 8 0 0 1 13.7-5.6L20 9" /><path d="M20 4v5h-5" /><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15" /><path d="M4 20v-5h5" />
      </svg>
      <label htmlFor={id}>단말변경</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} data-t={t}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0">
        {PHONE_DEVICES.map((x) => <option key={x.id} value={x.id}>{deviceTitle(x)}</option>)}
      </select>
    </div>
  )
}

// ── 기기 그림 — 실제 제품 사진 대신 폼팩터별 간단한 일러스트(고른 색상으로 칠한다) ──
function PhoneFigure({ form, color, brand }) {
  // 그라데이션 id 는 인스턴스마다 달라야 한다(같은 화면에 그림이 둘이면 앞의 것을 참조) — useId 의 특수문자는 url() 에서 깨지므로 뺀다
  const gid = `scr${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const fill = `url(#${gid})`
  const screen = (
    <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#EEF1FA" /><stop offset="1" stopColor="#C9D2EC" />
    </linearGradient>
  )
  const lens = (cx, cy, r = 5) => <g key={`${cx}-${cy}`}><circle cx={cx} cy={cy} r={r + 1.6} fill="#1D1F24" opacity="0.85" /><circle cx={cx} cy={cy} r={r} fill="#3A3F4B" /><circle cx={cx - r / 3} cy={cy - r / 3} r={r / 3} fill="#fff" opacity="0.35" /></g>
  if (form === 'fold') {
    // 접었을 때(커버) + 펼쳤을 때 — 폴드8 은 여권형(짧고 넓다)
    return (
      <svg viewBox="0 0 240 150" className="h-auto w-full max-w-[210px]" role="img" aria-label="기기 모양: 폴더블(북 타입)">
        <defs>{screen}</defs>
        <rect x="6" y="18" width="70" height="114" rx="10" fill={color} />
        {lens(22, 34)}{lens(22, 50)}
        <rect x="86" y="18" width="148" height="114" rx="10" fill={color} />
        <rect x="90" y="22" width="140" height="106" rx="7" fill={fill} />
        <line x1="160" y1="22" x2="160" y2="128" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.2" />
        <circle cx="197" cy="30" r="2.2" fill="#1D1F24" />
      </svg>
    )
  }
  if (form === 'flip') {
    return (
      <svg viewBox="0 0 200 190" className="h-auto w-full max-w-[190px]" role="img" aria-label="기기 모양: 플립(클램셸)">
        <defs>{screen}</defs>
        <rect x="14" y="62" width="74" height="86" rx="12" fill={color} />
        <rect x="19" y="67" width="64" height="58" rx="8" fill="#1D1F24" />
        {lens(33, 136, 4.5)}{lens(49, 136, 4.5)}
        <rect x="104" y="10" width="78" height="170" rx="12" fill={color} />
        <rect x="108" y="14" width="70" height="162" rx="9" fill={fill} />
        <line x1="108" y1="95" x2="178" y2="95" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.2" />
        <circle cx="143" cy="22" r="2.2" fill="#1D1F24" />
      </svg>
    )
  }
  // 바 타입 — 뒷면(카메라) + 앞면(화면)
  return (
    <svg viewBox="0 0 200 180" className="h-auto w-full max-w-[190px]" role="img" aria-label="기기 모양: 바 타입">
      <defs>{screen}</defs>
      <rect x="16" y="12" width="78" height="158" rx="14" fill={color} />
      {brand === 'apple'
        ? (<><rect x="22" y="18" width="40" height="40" rx="10" fill="#000" opacity="0.12" />{lens(33, 29)}{lens(33, 47)}{lens(51, 38)}</>)
        : (<>{lens(30, 28)}{lens(30, 44)}{lens(30, 60)}</>)}
      <rect x="106" y="12" width="78" height="158" rx="14" fill="#1D1F24" />
      <rect x="109" y="15" width="72" height="152" rx="11" fill={fill} />
      {brand === 'apple' ? <rect x="133" y="20" width="24" height="7" rx="3.5" fill="#1D1F24" /> : <circle cx="145" cy="23" r="2.4" fill="#1D1F24" />}
      <rect x="92" y="40" width="2.4" height="18" rx="1" fill="#000" opacity="0.15" />
    </svg>
  )
}
