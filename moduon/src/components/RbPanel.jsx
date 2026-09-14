// ─── R/B 블록 — 사업자 회원에게만 보이는 리베이트 정보 ────────────────
// 계산기 "상부"에 소비자 월 납부금과 완전히 분리된 별도 카드로 얹는다.
// 개인회원·비로그인은 bizIdentity 가 null 이라 컴포넌트 자체가 렌더되지 않는다 —
// 조건을 화면마다 쓰면 언젠가 한 곳이 새므로 판단은 org.bizIdentity 한 곳에서만 한다.
import { useStore, getSession } from '../lib/store'
import { bizIdentity } from '../lib/org'
import { rbFor } from '../lib/rb'
import { won } from '../lib/engine'

export default function RbPanel({ kind = 'phone', deviceId, itemId, mvno = false, join = 'mnp', support = 0, note }) {
  const { db } = useStore()
  const viewer = bizIdentity(db, getSession())
  if (!viewer) return null // 개인회원·비로그인 — R/B 자체를 노출하지 않는다

  const rb = rbFor({ kind, deviceId, itemId, mvno, join, support, viewer })

  return (
    <section data-t="rb-panel" data-tier={viewer.tier} className="animate-rise rounded-card border border-bindigo/25 bg-bindigo/[0.04] p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-bindigo px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-white">R/B</span>
        <h2 className="text-[15px] font-extrabold text-bink">사업자 전용 리베이트</h2>
        <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-bmuted shadow-card">
          {viewer.label}{viewer.code ? ` · ${viewer.code}` : ''}
        </span>
      </div>
      <p className="mt-1.5 text-[12px] leading-[1.5] text-bmuted">
        고객에게 안내하는 월 납부금과는 별개의 값입니다. 아래 금액은 <b className="text-bink">{viewer.label} 화면에서만</b> 보입니다.
      </p>

      <dl data-t="rb-rows" className="mt-3 overflow-hidden rounded-btn bg-white shadow-card">
        {rb.rows.map((r) => (
          <div key={r.key} data-t={`rb-${r.key}`} className={`flex items-center justify-between gap-3 px-3.5 py-2.5 ${r.tone === 'mine' ? 'bg-bindigo/[0.06]' : 'border-b border-brow'}`}>
            <dt className={`text-[12.5px] ${r.tone === 'mine' ? 'font-extrabold text-bink' : 'font-semibold text-bbody'}`}>{r.label}</dt>
            <dd className={`tnum text-[14px] font-extrabold ${r.tone === 'minus' ? 'text-danger' : r.tone === 'mine' ? 'text-bindigo' : 'text-bink'}`}>
              {r.value < 0 ? `−${won(-r.value)}` : won(r.value)}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-2.5 text-[11px] leading-[1.55] text-bfaint">
        {rb.item.name} 기준{rb.joinLabel ? ` · ${rb.joinLabel}` : ''}
        {rb.adjusted ? ' (번호이동 단가 대비 조정 적용)' : ''} · 정책 단가표 기준값이며 최종 지급은 개통 확정 후 정산서로 확정됩니다.
        {note ? ` ${note}` : ''}
      </p>
    </section>
  )
}
