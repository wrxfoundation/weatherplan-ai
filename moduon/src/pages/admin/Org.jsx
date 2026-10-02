// ─── S-27 조직·회원 관리 — 권역(총판) · 지역(대리점) · 셀러 · 회원 ──────
// 본사만 전 계층을 실명으로 본다. 여기서 바꾼 소속·코드가 정산 드릴다운과 R/B 화면에 그대로 반영된다.
import { useMemo, useState } from 'react'
import { useStore } from '../../lib/store'
import { downloadCSV, fmtDate } from '../../lib/engine'
import { unitName, UNITS } from '../../lib/constants'
import {
  allDistributors, allAgencies, allMembers, agenciesOf, sellersOf,
  sellerCode, nextAgencyCode, issueSellerCode, TIER_LABEL,
} from '../../lib/org'
import { opexLabel } from '../../lib/settle'
import { Card, Btn, KpiCard, Modal, Field, binputCls, useToast, EmptyState } from '../../components/ui'

export default function AdminOrg() {
  const { db, dispatch } = useStore()
  const toast = useToast()
  const [tab, setTab] = useState('tree') // tree | members
  const [editSeller, setEditSeller] = useState(null)
  const [newAgency, setNewAgency] = useState(null)
  const [mFilter, setMFilter] = useState('전체')

  const dists = useMemo(() => allDistributors(db).slice().sort((a, b) => String(a.code).localeCompare(String(b.code))), [db])
  const agencies = allAgencies(db)
  const members = allMembers(db)
  const coded = db.tenants.filter((t) => sellerCode(db, t))
  const orphan = db.tenants.filter((t) => !t.agencyId)
  const label = opexLabel(db)

  const exportOrg = () => {
    downloadCSV('모두온_조직도.csv', [
      ['계층', '코드', '이름', '대표', '권역', '상태'],
      ...dists.flatMap((d) => [
        ['총판', d.code, d.name, d.owner, unitName(d.unit), '활성'],
        ...agenciesOf(db, d.id).flatMap((a) => [
          ['대리점', a.code, a.name, a.owner, unitName(d.unit), a.status ?? '활성'],
          ...sellersOf(db, a.id).map((t) => ['셀러', sellerCode(db, t) ?? '', t.name, t.owner, unitName(t.unit), t.status]),
        ]),
      ]),
      ...orphan.map((t) => ['셀러(직할)', '', t.name, t.owner, unitName(t.unit), t.status]),
    ])
    toast('조직도 CSV를 내려받았어요')
  }

  const saveSeller = () => {
    const { id, agencyId, sellerCode: code } = editSeller
    dispatch({ type: 'SELLER_ORG', payload: { id, agencyId, sellerCode: code } })
    toast(agencyId ? '셀러 소속과 식별번호를 저장했어요' : '본사 직할로 변경했어요')
    setEditSeller(null)
  }

  const saveAgency = () => {
    const { distributorId, name, owner, phone, sigungu } = newAgency
    const code = nextAgencyCode(db, distributorId)
    if (!code) { toast('이 권역은 지역 9개를 모두 사용했어요'); return }
    dispatch({ type: 'AGENCY_UPSERT', payload: { code, distributorId, name: name.trim(), owner: owner.trim(), phone: phone.trim(), sigungu: sigungu.trim() } })
    toast(`${code} 대리점을 등록했어요`)
    setNewAgency(null)
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-extrabold text-bink">조직 · 회원 관리</h1>
          <p className="mt-0.5 text-[12.5px] text-bmuted">권역(총판) → 지역(대리점) → 셀러 3계층 · 개인식별번호 A1J1234 = 권역 + 지역 + 셀러코드</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="boutline" size="sm" onClick={exportOrg}>조직도 CSV</Btn>
          <Btn size="sm" onClick={() => setNewAgency({ distributorId: dists[0]?.id ?? '', name: '', owner: '', phone: '', sigungu: '' })}>대리점 등록</Btn>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="권역 총판" value={dists.length} suffix="곳" caption={`전체 ${UNITS.length}개 영업단 중`} />
        <KpiCard label="지역 대리점" value={agencies.length} suffix="곳" caption={`모집중 ${agencies.filter((a) => a.status === '모집중').length}곳`} />
        <KpiCard label="식별번호 발급 셀러" value={coded.length} suffix="명" accent="text-primary-text" caption={orphan.length ? `미소속 ${orphan.length}곳 — 본사 직할` : '전원 소속 배정'} />
        <KpiCard label="회원" value={members.length} suffix="명" caption={`개인 ${members.filter((m) => m.type === '개인').length} · 사업자 ${members.filter((m) => m.type === '사업자').length}`} />
      </div>

      <div data-t="org-tabs" className="mt-4 flex gap-2">
        {[['tree', '조직도'], ['members', '회원']].map(([k, name]) => (
          <button key={k} onClick={() => setTab(k)} aria-pressed={tab === k}
            className={`h-9 rounded-full px-4 text-[13px] font-bold transition-colors ${tab === k ? 'bg-bink text-white' : 'bg-white text-bmuted hover:text-bink'}`}>
            {name}
          </button>
        ))}
      </div>

      {tab === 'tree' && (
        <>
          <Card track="b" className="mt-3 overflow-hidden">
            {dists.map((d) => (
              <div key={d.id} data-t="org-dist">
                <div className="flex items-center gap-2.5 border-b border-brow bg-brow/50 px-4 py-2.5">
                  <span className="tnum flex h-6 w-6 items-center justify-center rounded-md bg-bindigo text-[12px] font-extrabold text-white">{d.code}</span>
                  <span className="text-[13.5px] font-extrabold text-bink">{d.name}</span>
                  <span className="pii text-[12px] text-bmuted">{d.owner}</span>
                  <span className="ml-auto text-[11.5px] text-bfaint">{unitName(d.unit)} · 대리점 {agenciesOf(db, d.id).length}곳</span>
                </div>
                {agenciesOf(db, d.id).map((a) => (
                  <div key={a.id} data-t="org-agency">
                    <div className="flex items-center gap-2.5 border-b border-brow px-4 py-2 pl-8">
                      <span className="tnum rounded-md bg-primary/10 px-1.5 py-0.5 text-[11.5px] font-extrabold text-primary-text">{a.code}</span>
                      <span className="text-[12.5px] font-bold text-bbody">{a.name}</span>
                      <span className="pii text-[11.5px] text-bfaint">{a.owner}</span>
                      {a.status === '모집중' && <span className="rounded-full bg-warn/10 px-2 py-0.5 text-[10.5px] font-bold text-warn">모집중</span>}
                      <span className="ml-auto text-[11px] text-bfaint">셀러 {sellersOf(db, a.id).length}명</span>
                    </div>
                    {sellersOf(db, a.id).map((t) => (
                      <button key={t.id} data-t="org-seller" onClick={() => setEditSeller({ id: t.id, agencyId: t.agencyId ?? '', sellerCode: t.sellerCode ?? '' })}
                        className="flex w-full items-center gap-2.5 border-b border-brow px-4 py-2 pl-14 text-left hover:bg-brow/40">
                        <span className="tnum shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-bmuted shadow-card">{sellerCode(db, t)}</span>
                        <span className="pii truncate text-[12.5px] font-semibold text-bbody">{t.name} · {t.owner}</span>
                        <span className="ml-auto shrink-0 text-[11px] text-bfaint">{t.sigungu}</span>
                      </button>
                    ))}
                    {sellersOf(db, a.id).length === 0 && <div className="border-b border-brow px-4 py-2.5 pl-14 text-[11.5px] text-bfaint">소속 셀러 없음 — 모집 대상 지역</div>}
                  </div>
                ))}
                {agenciesOf(db, d.id).length === 0 && <div className="border-b border-brow px-4 py-2.5 pl-8 text-[11.5px] text-bfaint">등록된 지역 대리점이 없습니다</div>}
              </div>
            ))}
          </Card>

          {orphan.length > 0 && (
            <Card track="b" className="mt-3 overflow-hidden">
              <div className="border-b border-brow bg-warn/[0.06] px-4 py-2.5 text-[13px] font-extrabold text-warn">
                본사 직할 셀러 {orphan.length}곳 — 총판 미계약 권역이라 식별번호가 없습니다
              </div>
              {orphan.map((t) => (
                <button key={t.id} data-t="org-orphan" onClick={() => setEditSeller({ id: t.id, agencyId: '', sellerCode: '' })}
                  className="flex w-full items-center gap-2.5 border-b border-brow px-4 py-2.5 text-left hover:bg-brow/40">
                  <span className="pii truncate text-[12.5px] font-bold text-bbody">{t.name} · {t.owner}</span>
                  <span className="ml-auto shrink-0 text-[11.5px] text-bfaint">{unitName(t.unit)} · {t.sigungu}</span>
                  <span className="shrink-0 text-[11.5px] font-bold text-primary-text">소속 지정 →</span>
                </button>
              ))}
            </Card>
          )}
        </>
      )}

      {tab === 'members' && (
        <Card track="b" className="mt-3 overflow-hidden">
          <div className="flex flex-wrap gap-2 border-b border-brow px-4 py-3">
            {['전체', '개인', '사업자', '대기'].map((f) => (
              <button key={f} onClick={() => setMFilter(f)} aria-pressed={mFilter === f}
                className={`h-8 rounded-full px-3 text-[12px] font-bold transition-colors ${mFilter === f ? 'bg-primary text-white' : 'bg-brow text-bmuted hover:text-bink'}`}>
                {f}
              </button>
            ))}
          </div>
          {members
            .filter((m) => mFilter === '전체' || (mFilter === '대기' ? m.status === '대기' : m.type === mFilter))
            .map((m) => (
              <div key={m.id} data-t="org-member" className="flex flex-wrap items-center gap-2.5 border-b border-brow px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${m.type === '사업자' ? 'bg-bindigo/10 text-bindigo' : 'bg-brow text-bmuted'}`}>{m.type}</span>
                <span className="pii text-[13px] font-bold text-bink">{m.name}</span>
                <span className="pii text-[11.5px] text-bfaint">{m.phone}</span>
                {m.code
                  ? <span className="tnum rounded-full bg-white px-2 py-0.5 text-[11px] font-extrabold text-primary-text shadow-card">{m.code}</span>
                  : <span className="text-[11px] text-bfaint">식별번호 없음</span>}
                {m.tier && <span className="text-[11.5px] font-semibold text-bmuted">{TIER_LABEL[m.tier]}</span>}
                <span className="ml-auto text-[11px] text-bfaint">{fmtDate(m.joinedAt)}</span>
                {m.status === '대기'
                  ? (
                    <button onClick={() => { dispatch({ type: 'MEMBER_STATUS', payload: { id: m.id, status: '승인' } }); toast(`${m.name} 승인 완료`) }}
                      className="rounded-full bg-warn/10 px-2.5 py-1 text-[11.5px] font-bold text-warn hover:bg-warn hover:text-white">
                      대기 → 승인
                    </button>
                  )
                  : <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ${m.status === '정지' ? 'bg-danger/10 text-danger' : 'bg-ok/10 text-ok'}`}>{m.status}</span>}
              </div>
            ))}
          {members.length === 0 && <EmptyState text="가입한 회원이 없어요" />}
        </Card>
      )}

      {/* +@ 표기 명칭 — 정산서·CSV·드릴다운이 전부 이 값을 읽는다 */}
      <Card track="b" className="mt-4 p-5">
        <h2 className="text-[15px] font-extrabold text-bink">정산서 {label} 표기</h2>
        <p className="mt-1 text-[12px] text-bmuted">셀러 판매 건당 총판·대리점에 붙는 +@ 의 명칭입니다. 바꾸면 전 계층 정산서와 CSV가 함께 바뀝니다.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {['영업비', '운영비', '관리비'].map((v) => (
            <button key={v} data-t="opex-preset" onClick={() => { dispatch({ type: 'POLICY_OPEX', label: v }); toast(`정산서 표기를 '${v}'로 바꿨어요`) }}
              aria-pressed={label === v}
              className={`h-9 rounded-full px-4 text-[13px] font-bold transition-colors ${label === v ? 'bg-bink text-white' : 'bg-white text-bmuted shadow-card hover:text-bink'}`}>
              {v}
            </button>
          ))}
        </div>
      </Card>

      {/* 셀러 소속·식별번호 지정 */}
      <Modal open={!!editSeller} onClose={() => setEditSeller(null)} title="셀러 소속 · 식별번호">
        {editSeller && (() => {
          const t = db.tenants.find((x) => x.id === editSeller.id)
          const a = agencies.find((x) => x.id === editSeller.agencyId)
          return (
            <div className="flex flex-col gap-4">
              <div className="rounded-btn bg-brow/60 px-4 py-3">
                <div className="pii text-[13.5px] font-extrabold text-bink">{t?.name} · {t?.owner}</div>
                <div className="text-[11.5px] text-bmuted">{unitName(t?.unit)} · {t?.sigungu}</div>
              </div>
              <Field label="소속 지역 (대리점)">
                <select className={binputCls} value={editSeller.agencyId}
                  onChange={(e) => setEditSeller((s) => ({ ...s, agencyId: e.target.value, sellerCode: e.target.value ? s.sellerCode : '' }))}>
                  <option value="">본사 직할 (식별번호 없음)</option>
                  {dists.map((d) => (
                    <optgroup key={d.id} label={`${d.code} · ${d.name}`}>
                      {agenciesOf(db, d.id).map((x) => <option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}
                    </optgroup>
                  ))}
                </select>
              </Field>
              <Field label="셀러코드" hint="영문 1 + 숫자 4. 비우고 '자동 발급'을 누르면 중복 없이 새로 뽑습니다">
                <div className="flex gap-2">
                  <input className={binputCls} value={editSeller.sellerCode} disabled={!editSeller.agencyId}
                    onChange={(e) => setEditSeller((s) => ({ ...s, sellerCode: e.target.value.toUpperCase().slice(0, 5) }))} placeholder="J1234" />
                  <Btn variant="boutline" size="sm" disabled={!editSeller.agencyId}
                    onClick={() => {
                      const full = issueSellerCode(db, a?.code)
                      setEditSeller((s) => ({ ...s, sellerCode: full ? full.slice(2) : s.sellerCode }))
                    }}>
                    자동 발급
                  </Btn>
                </div>
              </Field>
              <div className="rounded-btn bg-tint px-4 py-3">
                <div className="text-[11.5px] font-bold text-primary-text">개인식별번호</div>
                <div className="tnum text-[20px] font-extrabold tracking-[2px] text-primary-text">
                  {editSeller.agencyId && editSeller.sellerCode ? `${a?.code}${editSeller.sellerCode}` : '—'}
                </div>
              </div>
              <div className="flex gap-2">
                <Btn variant="boutline" className="flex-1" onClick={() => setEditSeller(null)}>취소</Btn>
                <Btn className="flex-1" onClick={saveSeller} disabled={!!editSeller.agencyId && !/^[A-Z]\d{4}$/.test(editSeller.sellerCode)}>저장</Btn>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* 대리점 등록 — 지역 코드는 권역 안에서 자동 채번 */}
      <Modal open={!!newAgency} onClose={() => setNewAgency(null)} title="지역 대리점 등록">
        {newAgency && (
          <div className="flex flex-col gap-4">
            <Field label="소속 권역 (총판)" required>
              <select className={binputCls} value={newAgency.distributorId} onChange={(e) => setNewAgency((s) => ({ ...s, distributorId: e.target.value }))}>
                {dists.map((d) => <option key={d.id} value={d.id}>{d.code} · {d.name} ({unitName(d.unit)})</option>)}
              </select>
            </Field>
            <div className="rounded-btn bg-tint px-4 py-3">
              <div className="text-[11.5px] font-bold text-primary-text">발급될 지역코드</div>
              <div className="tnum text-[20px] font-extrabold tracking-[2px] text-primary-text">{nextAgencyCode(db, newAgency.distributorId) ?? '여유 없음'}</div>
            </div>
            <Field label="대리점명" required><input className={binputCls} value={newAgency.name} onChange={(e) => setNewAgency((s) => ({ ...s, name: e.target.value }))} placeholder="강서지역 대리점" /></Field>
            <Field label="대표자" required><input className={binputCls} value={newAgency.owner} onChange={(e) => setNewAgency((s) => ({ ...s, owner: e.target.value }))} /></Field>
            <Field label="연락처"><input className={binputCls} value={newAgency.phone} onChange={(e) => setNewAgency((s) => ({ ...s, phone: e.target.value }))} placeholder="010-0000-0000" /></Field>
            <Field label="거점 지역"><input className={binputCls} value={newAgency.sigungu} onChange={(e) => setNewAgency((s) => ({ ...s, sigungu: e.target.value }))} placeholder="서울 강서구" /></Field>
            <div className="flex gap-2">
              <Btn variant="boutline" className="flex-1" onClick={() => setNewAgency(null)}>취소</Btn>
              <Btn className="flex-1" onClick={saveAgency} disabled={!newAgency.name.trim() || !newAgency.owner.trim() || !nextAgencyCode(db, newAgency.distributorId)}>등록</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
