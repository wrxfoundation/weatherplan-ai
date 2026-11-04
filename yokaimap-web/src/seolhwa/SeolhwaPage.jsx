import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { TALES, TALE_KINDS, KIND, TALE_META, MOTIFS, filterTales, taleCountByKind, taleSlug } from '../data/tales.js'
import { REGIONS } from '../data/yokai.js'
import Icon from '../ui/Icon.jsx'
import AdSlot from '../ui/AdSlot.jsx'
import { useHead, SITE_ORIGIN } from '../ui/useHead.js'
import { VerificationBadge } from '../ui/Badges.jsx'

/**
 * 설화 목록.
 *
 * 도감과 필터가 다르다. 설화는 분류가 신화·전설·민담 셋뿐이라 분류만으로는 좁혀지지
 * 않으므로 화소(motif)를 실질적인 탐색축으로 쓴다. 희귀도는 아예 없다 — 이야기에
 * 희귀도를 매기는 건 뜻이 없다.
 */
export default function SeolhwaPage() {
  const [params, setParams] = useSearchParams()
  const [kinds, setKinds] = useState(() => new Set(params.get('kind') ? params.get('kind').split(',') : []))
  const [sido, setSido] = useState(params.get('sido') ?? '')
  const [motif, setMotif] = useState(params.get('motif') ?? '')
  const [q, setQ] = useState(params.get('q') ?? '')

  useHead({
    title: `한국 설화 — 신화·전설·민담 ${TALE_META.count}편`,
    description: `원전과 채록에 근거가 있는 한국 설화 ${TALE_META.count}편. 신화·전설·민담으로 나누고, 배경지 좌표와 등장 요괴를 함께 정리했습니다. 모든 항목에 출처와 검증등급이 붙어 있습니다.`,
    canonical: '/seolhwa',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: '한국 설화 — 신화·전설·민담',
      url: `${SITE_ORIGIN}/seolhwa`,
      numberOfItems: TALE_META.count,
      isPartOf: { '@type': 'WebSite', name: '한국요괴지도', url: SITE_ORIGIN },
    },
  })

  const list = useMemo(() => filterTales(TALES, { kinds, sido, q, motif }), [kinds, sido, q, motif])
  const counts = useMemo(() => taleCountByKind(TALES), [])

  const toggleKind = (id) => {
    const next = new Set(kinds)
    next.has(id) ? next.delete(id) : next.add(id)
    setKinds(next)
    const p = new URLSearchParams(params)
    next.size ? p.set('kind', [...next].join(',')) : p.delete('kind')
    setParams(p, { replace: true })
  }
  const reset = () => {
    setKinds(new Set())
    setSido('')
    setMotif('')
    setQ('')
    setParams({}, { replace: true })
  }

  return (
    <main className="page">
      <p className="eyebrow">출처와 검증등급을 붙인 한국 설화</p>
      <h1>
        신화·전설·민담 {TALE_META.count}편
      </h1>
      <p className="lede" style={{ maxWidth: 'var(--read-max)' }}>
        설화는 개체가 아니라 이야기라서 <Link to="/dogam">도감</Link>과 따로 싣습니다. 희귀도나 출몰 조건 같은
        개체의 항목을 붙이지 않고, 대신 유형·화소·배경지·등장 요괴를 답니다.
      </p>

      <div className="panel" style={{ padding: 'var(--sp-4)', marginTop: 'var(--sp-4)' }}>
        <div className="row">
          <input
            className="input"
            placeholder="제목·이표기·화소 검색 (예: 금기, 보은, 난생)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="input" style={{ maxWidth: 160 }} value={sido} onChange={(e) => setSido(e.target.value)}>
            <option value="">전체 지역</option>
            {REGIONS.map((r) => (
              <option key={r.name} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="row" style={{ marginTop: 'var(--sp-3)' }}>
          {TALE_KINDS.map((k) => (
            <button
              key={k.id}
              className={`chip${kinds.has(k.id) ? ' on' : ''}`}
              onClick={() => toggleKind(k.id)}
              title={k.blurb}
            >
              {k.name} <span className="num">{counts[k.id] ?? 0}</span>
            </button>
          ))}
          <span className="spacer" />
          <span className="small muted num">{list.length}편</span>
          {(kinds.size > 0 || sido || motif || q) && (
            <button className="chip" onClick={reset}>
              초기화
            </button>
          )}
        </div>

        {/* 분류가 셋뿐이라 화소가 실질적인 탐색축이다 */}
        <div className="row" style={{ marginTop: 'var(--sp-3)' }}>
          {MOTIFS.slice(0, 14).map((m) => (
            <button
              key={m.name}
              className={`chip${motif === m.name ? ' on' : ''}`}
              onClick={() => setMotif(motif === m.name ? '' : m.name)}
            >
              {m.name} <span className="num">{m.n}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="tale-grid" style={{ marginTop: 'var(--sp-4)' }}>
        {list.map((t) => (
          <TaleCard key={t.id} tale={t} />
        ))}
      </div>

      {list.length === 0 && (
        <div className="empty">
          조건에 맞는 설화가 없습니다.{' '}
          <button className="chip" onClick={reset}>
            필터 초기화
          </button>
        </div>
      )}

      <AdSlot slot="seolhwa-footer" />

      <section className="section">
        <div className="section-head">
          <h2>분류 기준</h2>
        </div>
        <div className="tale-kinds">
          {TALE_KINDS.map((k) => (
            <div key={k.id} className="tale-kind-note" data-kind={k.id}>
              <b>{k.name}</b>
              <p className="small muted">{k.blurb}</p>
            </div>
          ))}
        </div>
        <p className="small muted" style={{ marginTop: 'var(--sp-3)', maxWidth: 'var(--read-max)' }}>
          국문학의 표준 3분법을 그대로 씁니다. 임의로 분류를 늘리지 않고, 전설인데 배경지 좌표가 없으면 빌드가
          경고를 냅니다 — 증거물에 고정되는 것이 전설의 정의이기 때문입니다.
        </p>
      </section>
    </main>
  )
}

function TaleCard({ tale }) {
  const k = KIND[tale.kind]
  return (
    <Link className="tale-card" to={`/seolhwa/${taleSlug(tale)}`} data-kind={tale.kind}>
      <div className="tale-card-top">
        <span className="tale-kind">{k?.name ?? tale.kind}</span>
        {tale.sites.length > 0 && (
          <span className="small muted">
            <Icon name="pin" size={12} /> {tale.sites[0].sigungu ?? tale.sites[0].sido}
          </span>
        )}
        {tale.foreign_origin && <span className="tale-flag" title={tale.foreign_origin.note}>유입 논쟁</span>}
      </div>
      <h3>{tale.title}</h3>
      {tale.aliases.length > 0 && <div className="small muted">{tale.aliases.slice(0, 2).join(' · ')}</div>}
      <p>{tale.summary}</p>
      <div className="row" style={{ gap: 5, marginTop: 'var(--sp-3)' }}>
        <VerificationBadge id={tale.verification} confidence={tale.confidence} />
        {tale.motifs.slice(0, 2).map((m) => (
          <span key={m} className="small muted">
            #{m}
          </span>
        ))}
      </div>
    </Link>
  )
}
