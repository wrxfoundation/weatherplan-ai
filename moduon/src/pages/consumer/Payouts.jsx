// ─── 사은품 지급 명단 (아정당식 소셜 프루프 — 흡수) ────────────────────
// 매일 지급된 현금 사은품 내역을 공개해 "왕창 돌려드린다"를 증거로 뒷받침.
// 이름 마스킹·조건별 금액 고지로 개인정보/표시광고법 안전.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PAYOUT_ROSTERS, PAYOUT_CUMULATIVE, PAYOUT_ALL, ymd } from '../../lib/payouts'
import { won, timeAgo } from '../../lib/engine'
import { Card, Modal, useCountUp } from '../../components/ui'

export default function Payouts() {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null)
  const cum = useCountUp(PAYOUT_CUMULATIVE, 900)

  const query = q.trim()
  const matches = useMemo(() => {
    if (!query) return null
    return PAYOUT_ALL.filter((x) => x.name.includes(query) || x.sigungu.includes(query) || x.catLabel.includes(query)).slice(0, 60)
  }, [query])

  return (
    <main className="mx-auto max-w-2xl px-5 pb-20">
      <div className="pt-8">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-tint px-3 py-1 text-[12px] font-bold text-primary-text">
          <span className="h-1.5 w-1.5 rounded-full bg-ok" /> 매일 업데이트 · 실지급 공개
        </div>
        <h1 className="mt-3 text-[26px] font-extrabold tracking-[-0.5px] text-ink">사은품 지급 명단</h1>
        <p className="mt-1.5 text-[14px] leading-[22px] text-muted">설치·개통이 확인된 고객께 지급된 <strong className="font-bold text-ink">현금 사은품 내역</strong>을 매일 공개합니다. 모두온은 유통 단계를 줄인 직접 판매 구조라 남들 받는 그 이상을 돌려드려요.</p>
      </div>

      {/* 누적 지급 카운터 */}
      <div className="mt-5 flex items-center justify-between rounded-card bg-gradient-to-r from-primary to-[#6E90E0] px-5 py-4 text-white shadow-cta">
        <div>
          <div className="text-[12.5px] font-semibold text-white/85">지금까지 사은품 지급 완료</div>
          <div className="tnum mt-0.5 text-[28px] font-extrabold leading-none">{cum.toLocaleString('ko-KR')}<span className="ml-0.5 text-[16px]">명+</span></div>
        </div>
        <Link to="/consult" className="glass-btn-cta shrink-0 rounded-btn bg-white px-4 py-2.5 text-[13px] font-bold text-primary-text">나도 신청하기 →</Link>
      </div>

      {/* 검색 */}
      <div className="mt-4 flex h-[52px] items-center gap-2 rounded-field border border-line bg-white px-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="이름·지역·상품으로 사은품 현황을 확인해보세요"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-ink placeholder:text-disabled focus:outline-none"
        />
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 text-faint"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" /><path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      </div>

      {/* 검색 결과 */}
      {matches && (
        <Card className="mt-4 overflow-hidden p-0">
          <div className="border-b border-line px-4 py-3 text-[13px] font-bold text-ink">검색 결과 <span className="text-primary-text">{matches.length}건</span>{matches.length === 60 && <span className="font-medium text-faint"> (상위 60건)</span>}</div>
          {matches.length === 0 && <div className="py-12 text-center text-[13.5px] text-faint">해당하는 지급 내역이 없어요. 다른 이름·지역으로 검색해 보세요.</div>}
          {matches.map((x, i) => <PayRow key={`${x.name}-${x.sigungu}-${x.amount}-${x.date ?? i}`} x={x} showDate />)}
        </Card>
      )}

      {/* 일자별 명단 목록 */}
      {!matches && (
        <>
          <div className="mt-5 text-[14px] font-bold text-ink">총 <span className="text-primary-text">{PAYOUT_ROSTERS.length}</span>건</div>
          <div className="mt-2 divide-y divide-line rounded-card border border-line bg-white">
            {PAYOUT_ROSTERS.map((r) => (
              <button key={r.id} onClick={() => setOpen(r)} className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-tint/40">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[15px] font-bold text-ink">
                    {ymd(r.date)} 사은품 지급 명단
                    {r.isNew && <span className="flex h-[17px] items-center rounded bg-orange px-1 text-[10px] font-black text-white">N</span>}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[12px] text-faint">
                    <span>{timeAgo(r.date)}</span><span>·</span><span>{r.count}명 지급</span><span>·</span><span>조회 {r.views}</span>
                  </div>
                </div>
                <span className="shrink-0 text-faint">›</span>
              </button>
            ))}
          </div>
        </>
      )}

      <p className="mt-4 text-[11.5px] leading-[17px] text-disabled">
        개인정보 보호를 위해 이름은 마스킹 처리되며, 본인 동의를 받은 지급 건만 게시됩니다. 사은품 금액은 통신사·요금제·약정·상품·재고·지역·심사 결과에 따라 달라지며 표시 금액은 최대치가 아닙니다. 게시 내역은 데모 표본입니다.
      </p>

      {/* 일자별 상세 모달 */}
      <Modal open={!!open} onClose={() => setOpen(null)} title={open ? `${ymd(open.date)} 지급 명단` : ''} wide>
        {open && (
          <>
            <div className="mb-3 flex items-center gap-2 text-[12.5px] text-muted">
              <span className="rounded-full bg-ok/10 px-2.5 py-1 font-bold text-ok">지급 완료 {open.count}명</span>
              <span className="text-faint">조회 {open.views}</span>
            </div>
            <div className="max-h-[52vh] overflow-y-auto rounded-field border border-line">
              <table className="w-full text-[13px]">
                <thead className="sticky top-0 bg-warm text-[11.5px] text-faint">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">고객</th>
                    <th className="px-3 py-2 text-left font-semibold">지역</th>
                    <th className="px-3 py-2 text-left font-semibold">상품</th>
                    <th className="px-3 py-2 text-right font-semibold">사은품</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {open.recipients.map((x, i) => (
                    <tr key={`${x.name}-${x.sigungu}-${x.amount}-${i}`}>
                      <td className="px-3 py-2.5 font-bold text-ink">{x.name}</td>
                      <td className="px-3 py-2.5 text-muted">{x.sigungu}</td>
                      <td className="px-3 py-2.5"><span className="rounded bg-tint px-1.5 py-0.5 text-[11.5px] font-semibold text-primary-text">{x.catLabel}</span></td>
                      <td className="px-3 py-2.5 text-right"><span className="tnum font-extrabold text-ok">{won(x.amount)}</span><div className="text-[10.5px] text-faint">{x.via}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11px] leading-4 text-disabled">현금 사은품은 설치·개통 확인 후 영업일 7일 이내 신청인 명의 계좌로 지급됩니다. 금액은 조건별 상이하며 최대치가 아닙니다.</p>
          </>
        )}
      </Modal>
    </main>
  )
}

function PayRow({ x, showDate }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-0">
      <div className="min-w-0">
        <div className="text-[13.5px] font-bold text-ink">{x.name} <span className="ml-1 font-medium text-faint">{x.sigungu}</span></div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-faint">
          <span className="rounded bg-tint px-1.5 py-0.5 font-semibold text-primary-text">{x.catLabel}</span>
          {showDate && <span>{ymd(x.date)} 지급</span>}
        </div>
      </div>
      <span className="tnum shrink-0 text-[14px] font-extrabold text-ok">{won(x.amount)}</span>
    </div>
  )
}
