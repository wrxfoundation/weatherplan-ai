import { useEffect, useMemo, useState } from 'react'
import TopBar from '../TopBar.jsx'
import { useMapLang } from '../i18n/mapLang.js'
import {
  GLOBAL_CASES, CASE_TYPES, CASES_META, activeLayers, countByType,
} from '../data/globalCases.js'

const TITLE = '글로벌 AI 인프라 벤치마크 — 해외 사례 라이브러리 | AI InfraMap'
const DESC =
  '해외 AI 인프라·기상 AI 사업자를 같은 틀로 해부한다. 계층별 구조(플랫폼·컴퓨트·모델·관측·국가기관), 정량 지표, 검증된 것과 아직 검증되지 않은 것을 분리해 정리한 사례 라이브러리.'

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/* KO/EN 필드 선택 — `x` / `x_en` 규약. EN인데 _en이 없으면 KO로 폴백(누락은 화면에서 바로 보인다). */
const pick = (obj, key, en) => (en ? obj?.[`${key}_en`] ?? obj?.[key] : obj?.[key])
const pickKo = (obj, en) => (en ? obj?.en ?? obj?.ko : obj?.ko)

export default function BenchmarkPage() {
  const en = useMapLang() === 'en'
  const [type, setType] = useState('all')
  const [openSlug, setOpenSlug] = useState(GLOBAL_CASES[0]?.slug ?? null)

  useEffect(() => {
    document.title = en ? 'Global AI-infrastructure benchmark — case library | AI InfraMap' : TITLE
    setMeta('name', 'description', en
      ? 'Overseas AI-infrastructure and weather-AI operators dissected on one frame: stack layers, quantified scale, and a strict split between what is proven and what is not.'
      : DESC)
  }, [en])

  const counts = useMemo(() => countByType(), [])
  const cases = useMemo(
    () => (type === 'all' ? GLOBAL_CASES : GLOBAL_CASES.filter((c) => c.type === type)),
    [type],
  )
  const layers = useMemo(() => activeLayers(cases), [cases])
  const countries = useMemo(() => new Set(GLOBAL_CASES.map((c) => c.country)).size, [])

  return (
    <>
      <TopBar />
      <main className="page bench-page">
        <header className="bench-hero">
          <div className="eyebrow">{en ? 'GLOBAL BENCHMARK' : '글로벌 벤치마크'}</div>
          <h1>
            {en ? (
              <>Who is actually building this — <em>and what have they really proven?</em></>
            ) : (
              <>누가 실제로 짓고 있고, <em>무엇까지 증명했나</em></>
            )}
          </h1>
          <p className="bench-lede">
            {en
              ? 'Overseas AI-infrastructure and weather-AI operators, dissected on one frame. Every case is broken into the same stack layers, so structures — not press releases — can be compared. What is proven and what is merely announced are kept in separate columns.'
              : '해외 AI 인프라·기상 AI 사업자를 하나의 틀로 해부한다. 모든 사례를 같은 계층으로 쪼개 보도자료가 아니라 구조를 비교한다. 증명된 것과 발표만 된 것은 칸을 나눠 적는다.'}
          </p>
          <div className="bench-stats">
            <div className="bstat"><b>{GLOBAL_CASES.length}</b><span>{en ? 'Cases documented' : '수록 사례'}</span></div>
            <div className="bstat"><b>{countries}</b><span>{en ? 'Countries / regions' : '국가·지역'}</span></div>
            <div className="bstat"><b>{Object.keys(counts).length}</b><span>{en ? 'Strategy archetypes' : '전략 유형'}</span></div>
            <div className="bstat"><b>{CASES_META.updated.slice(0, 7).replace('-', '.')}</b><span>{en ? 'Last updated' : '최종 갱신'}</span></div>
          </div>
        </header>

        <section className="bench-sec">
          <div className="eyebrow">{en ? 'FOUR ARCHETYPES' : '네 가지 유형'}</div>
          <h2>{en ? 'The same market, entered four different ways' : '같은 시장, 네 갈래의 진입 방식'}</h2>
          <div className="arch-grid">
            {Object.entries(CASE_TYPES).map(([k, t]) => (
              <article key={k} className={`arch-card${counts[k] ? '' : ' empty'}`}>
                <div className="arch-head">
                  <h3>{en ? t.en : t.ko}</h3>
                  <span className="arch-n">{counts[k] ?? 0}</span>
                </div>
                <p>{en ? t.en_desc : t.ko_desc}</p>
              </article>
            ))}
          </div>
          <p className="bench-note">
            {en
              ? 'Counts reflect cases documented here, not market share. Archetypes with a zero count are placeholders for cases not yet written up.'
              : '숫자는 이 페이지에 수록된 사례 수이며 시장 점유가 아니다. 0인 유형은 아직 정리하지 않은 자리다.'}
          </p>
        </section>

        <section className="bench-sec">
          <div className="eyebrow">{en ? 'CASES' : '사례'}</div>
          <h2>{en ? 'Case library' : '사례 라이브러리'}</h2>

          <div className="bench-filter" role="group" aria-label={en ? 'Filter by archetype' : '유형 필터'}>
            <button
              type="button"
              className={`bf-chip${type === 'all' ? ' on' : ''}`}
              onClick={() => setType('all')}
              aria-pressed={type === 'all'}
            >
              {en ? 'All' : '전체'} <span className="bf-n">{GLOBAL_CASES.length}</span>
            </button>
            {Object.entries(CASE_TYPES).map(([k, t]) => (
              <button
                key={k}
                type="button"
                className={`bf-chip${type === k ? ' on' : ''}`}
                onClick={() => setType(k)}
                aria-pressed={type === k}
                disabled={!counts[k]}
              >
                {en ? t.en : t.ko} <span className="bf-n">{counts[k] ?? 0}</span>
              </button>
            ))}
          </div>

          {cases.length === 0 && (
            <p className="bench-empty">{en ? 'No cases documented for this archetype yet.' : '이 유형은 아직 수록된 사례가 없다.'}</p>
          )}

          <div className="case-list">
            {cases.map((c) => {
              const open = openSlug === c.slug
              return (
                <article key={c.slug} className={`case-card${open ? ' open' : ''}`}>
                  <button
                    type="button"
                    className="case-head"
                    onClick={() => setOpenSlug(open ? null : c.slug)}
                    aria-expanded={open}
                  >
                    <div className="case-id">
                      <h3>{c.name}</h3>
                      <span className="case-meta">
                        {pick(c, 'country', en)}
                        {c.founded ? ` · ${en ? 'est.' : '설립'} ${c.founded}` : ''}
                        {c.entry?.year ? ` · ${en ? 'weather AI from' : '기상 AI 진입'} ${c.entry.year}` : ''}
                      </span>
                    </div>
                    <span className="case-type">{en ? CASE_TYPES[c.type]?.en : CASE_TYPES[c.type]?.ko}</span>
                    <span className="case-caret" aria-hidden>{open ? '−' : '+'}</span>
                  </button>

                  <p className="case-lede">{pick(c, 'lede', en)}</p>

                  {open && (
                    <div className="case-body">
                      {c.scale?.length > 0 && (
                        <div className="case-scale">
                          {c.scale.map((s) => (
                            <div key={s.k} className="cs-cell">
                              <b>{pick(s, 'v', en)}{pick(s, 'unit', en) && <small>{pick(s, 'unit', en)}</small>}</b>
                              <span className="cs-k">{en ? s.k_en ?? s.k : s.k}</span>
                              {(s.note || s.note_en) && <span className="cs-note">{en ? s.note_en ?? s.note : s.note}</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="case-cols">
                        <div className="case-col proven">
                          <h4>{en ? 'What this case proves' : '이 사례가 증명한 것'}</h4>
                          <ul>
                            {(c.verified ?? []).map((v, i) => <li key={i}>{pickKo(v, en)}</li>)}
                          </ul>
                        </div>
                        <div className="case-col unproven">
                          <h4>{en ? 'What it has not proven' : '아직 증명하지 못한 것'}</h4>
                          <ul>
                            {(c.open ?? []).map((v, i) => <li key={i}>{pickKo(v, en)}</li>)}
                          </ul>
                        </div>
                      </div>

                      {c.timeline?.length > 0 && (
                        <>
                          <h4 className="case-h">{en ? 'Timeline' : '경과'}</h4>
                          <ol className="case-timeline">
                            {c.timeline.map((t) => (
                              <li key={t.when}>
                                <span className="ct-when">{t.when}</span>
                                <span className="ct-what">{pickKo(t, en)}</span>
                              </li>
                            ))}
                          </ol>
                        </>
                      )}

                      {c.markets?.length > 0 && (
                        <>
                          <h4 className="case-h">{en ? 'Target applications' : '타깃 응용'}</h4>
                          <ul className="case-markets">
                            {c.markets.map((m, i) => <li key={i}>{pickKo(m, en)}</li>)}
                          </ul>
                        </>
                      )}

                      {c.read?.length > 0 && (
                        <div className="case-read">
                          <h4>
                            {en ? 'Our reading' : '자체 해석'}
                            <span className="read-tag">{en ? 'interpretation, not fact' : '사실 아님 · 해석'}</span>
                          </h4>
                          <ul>
                            {c.read.map((r, i) => <li key={i}>{pickKo(r, en)}</li>)}
                          </ul>
                        </div>
                      )}

                      <div className="case-src">
                        <b>{en ? 'Sources' : '출처'}</b>
                        {(c.sources ?? []).map((s) => (
                          <span key={s.name} className="src-chip">{pick(s, 'name', en)}<i>{s.when}</i></span>
                        ))}
                        <span className="src-updated">{en ? 'compiled' : '정리'} {c.updated}</span>
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </section>

        {cases.length > 0 && (
          <section className="bench-sec">
            <div className="eyebrow">{en ? 'STRUCTURE COMPARISON' : '구조 비교'}</div>
            <h2>{en ? 'Same layers, different owners' : '같은 계층, 다른 주인'}</h2>
            <p className="bench-sub">
              {en
                ? 'Each row is a layer every operator in this market must fill — by owning it, partnering for it, or leaving it empty. An empty cell is a structural gap, and it is marked as one.'
                : '각 행은 이 시장의 사업자라면 반드시 채워야 하는 계층이다. 직접 보유하거나, 협력으로 메우거나, 비워 둔다. 빈칸은 구조적 공백이며 그렇게 표기한다.'}
            </p>
            <div className="stack-wrap">
              <table className="stack-table">
                <thead>
                  <tr>
                    <th>{en ? 'Layer' : '계층'}</th>
                    {cases.map((c) => <th key={c.slug}>{c.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {layers.map((l) => (
                    <tr key={l.key}>
                      <th scope="row">{en ? l.en : l.ko}</th>
                      {cases.map((c) => {
                        const cell = c.stack?.[l.key]
                        if (!cell) return <td key={c.slug} className="st-none">{en ? 'not documented' : '미정리'}</td>
                        return (
                          <td key={c.slug} className={cell.gap ? 'st-gap' : ''}>
                            <b>{pickKo(cell, en)}</b>
                            {(cell.note || cell.note_en) && (
                              <span className="st-note">{en ? cell.note_en ?? cell.note : cell.note}</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="bench-note">
              {en
                ? 'Amber cells are layers the operator does not hold. “Not documented” means we have not verified it — not that it is absent.'
                : '주황 칸은 해당 사업자가 보유하지 않은 계층이다. 「미정리」는 없다는 뜻이 아니라 아직 확인하지 않았다는 뜻이다.'}
            </p>
          </section>
        )}

        <section className="bench-sec bench-method">
          <div className="eyebrow">{en ? 'HOW THIS IS COMPILED' : '작성 원칙'}</div>
          <h2>{en ? 'Method, and where it stops' : '방법, 그리고 한계'}</h2>
          <p className="bench-sub">{en ? CASES_META.en_note : CASES_META.ko_note}</p>
          <ul className="bench-rules">
            <li>
              <b>{en ? 'Public sources only.' : '공개 자료만.'}</b>{' '}
              {en
                ? 'Company and agency announcements, and press reporting. No non-public financials, no figures obtained privately.'
                : '기업·기관 발표와 언론 보도. 비공개 재무나 사적으로 입수한 수치는 넣지 않는다.'}
            </li>
            <li>
              <b>{en ? 'Proven and announced are separated.' : '증명과 발표를 분리한다.'}</b>{' '}
              {en
                ? 'A demo, a memorandum and a booked contract are not the same evidence, and they never share a column here.'
                : '데모와 양해각서와 실제 수주는 같은 증거가 아니다. 이 페이지에서 한 칸에 섞이지 않는다.'}
            </li>
            <li>
              <b>{en ? 'Interpretation is labelled.' : '해석은 표시한다.'}</b>{' '}
              {en
                ? 'Anything that is our reading rather than a sourced fact is tagged as interpretation.'
                : '출처 있는 사실이 아니라 우리 판단인 부분은 「자체 해석」으로 태그를 단다.'}
            </li>
            <li>
              <b>{en ? 'Gaps stay visible.' : '공백은 감추지 않는다.'}</b>{' '}
              {en
                ? 'An unverified layer is shown as unverified rather than filled with a plausible guess — the same rule the rest of this site follows.'
                : '확인 못 한 계층은 그럴듯한 추정으로 채우지 않고 미확인으로 남긴다. 이 사이트 전체와 같은 규칙이다.'}
            </li>
          </ul>
        </section>
      </main>
    </>
  )
}
