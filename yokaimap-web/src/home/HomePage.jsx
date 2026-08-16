import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { YOKAI, CATEGORIES, REGIONS, META, slugOf, CAT, countByCategory } from '../data/yokai.js'
import Seal from '../ui/Seal.jsx'
import YokaiCard from '../ui/YokaiCard.jsx'
import AdSlot from '../ui/AdSlot.jsx'
import OmenPanel from '../map/OmenPanel.jsx'
import ArtPlate from '../ui/ArtPlate.jsx'
import Icon from '../ui/Icon.jsx'
import { useHead, SITE_ORIGIN } from '../ui/useHead.js'

/* 날짜 기반 결정론 선택 — 하루 동안 모두에게 같은 '오늘의 요괴'가 보인다(공유 가능). */
function pickOfDay(list, date, offset = 0) {
  const key = Number(`${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`)
  return list[(key + offset * 37) % list.length]
}

export default function HomePage() {
  const now = new Date()
  const pool = useMemo(() => YOKAI.filter((e) => e.confidence !== 'low'), [])
  const today = useMemo(() => pickOfDay(pool, now, 0), [pool, now])
  const picks = useMemo(() => [1, 2, 3].map((i) => pickOfDay(pool, now, i)), [pool, now])
  const counts = useMemo(() => countByCategory(YOKAI), [])
  const highTrust = useMemo(
    () => YOKAI.filter((e) => e.verification === 'primary_text' || e.verification === 'field_record').length,
    [],
  )

  useHead({
    title: '한국요괴지도 — 전국 요괴·신격 전승지 지도',
    description: `도깨비·구미호·이무기부터 제주 본풀이 신격까지, 공개 자료에 근거가 있는 한국 요괴 ${META.count}체와 전승지 ${META.siteCount}곳. 모든 항목에 출처와 검증등급을 표기합니다.`,
    canonical: '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: '한국요괴지도',
      url: `${SITE_ORIGIN}/`,
      inLanguage: 'ko',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_ORIGIN}/dogam?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  })

  return (
    <main>
      <section className="hero">
        <div className="hero-art" aria-hidden="true" />
        <p className="eyebrow">출처와 검증등급을 붙인 한국 요괴 데이터베이스</p>
        <h1>
          밤이 되면
          <br />
          지도 위에 요괴가 선다
        </h1>
        <p className="lede">
          도깨비·구미호·이무기부터 제주 본풀이 신격까지. 구비문학대계와 고전 원전에 근거가 있는 {META.count}체를 전승지
          좌표와 함께 정리했습니다. 모든 항목에 <strong>출처</strong>와 <strong>검증등급</strong>이 붙어 있습니다.
        </p>

        <div className="row" style={{ gap: 'var(--sp-2)' }}>
          <Link className="btn primary lg" to="/map">
            <Icon name="map" size={17} />
            전승지 지도 열기
          </Link>
          <Link className="btn lg" to="/quiz">
            <Icon name="compass" size={17} />
            요괴 체질진단
          </Link>
          <Link className="btn ghost lg" to="/dogam">
            <Icon name="book" size={17} />
            도감 {META.count}체
          </Link>
        </div>

        <div className="hero-marks" style={{ marginTop: 'var(--sp-4)' }}>
          {CATEGORIES.map((c) => (
            <Link key={c.id} to={`/category/${c.id}`} title={`${c.name} ${counts[c.id] ?? 0}체`}>
              <Seal category={c.id} />
            </Link>
          ))}
        </div>

        <div className="trust-row">
          <div>
            <b className="num">{META.count}</b>
            <span>수록 요괴·신격</span>
          </div>
          <div>
            <b className="num">{META.siteCount}</b>
            <span>전승지 좌표</span>
          </div>
          <div>
            <b className="num">17 / 17</b>
            <span>시도 커버리지</span>
          </div>
          <div>
            <b className="num">{highTrust}</b>
            <span>고신뢰 등급(원전·채록)</span>
          </div>
        </div>
      </section>

      <div className="page" style={{ paddingTop: 0 }}>
        {/* 오늘의 요괴 + 괴담지수 — 재방문 이유를 만드는 자리 */}
        <section className="section" style={{ marginTop: 'var(--sp-5)' }}>
          <div className="section-head">
            <Seal category={today.category} size="sm" />
            <h2>오늘의 요괴</h2>
          </div>
          <div className="row" style={{ alignItems: 'flex-start', gap: 'var(--sp-4)' }}>
            <Link
              className="card"
              to={`/yokai/${slugOf(today)}`}
              style={{ flex: '1 1 380px', '--cat': CAT[today.category]?.color }}
            >
              <div className="row" style={{ alignItems: 'flex-start', gap: 'var(--sp-4)', flexWrap: 'nowrap' }}>
                {today.art?.file ? (
                  <div style={{ width: 128, flex: 'none' }}>
                    <ArtPlate entry={today} size="sm" />
                  </div>
                ) : (
                  <Seal category={today.category} size="lg" />
                )}
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontSize: 'var(--text-h2)' }}>{today.canonical}</h3>
                  <div className="small muted">{today.aliases.slice(0, 3).join(' · ')}</div>
                  <p style={{ marginTop: 'var(--sp-2)' }}>{today.summary}</p>
                </div>
              </div>
            </Link>
            <OmenPanel lat={36.5} lng={127.8} sido={null} />
          </div>
        </section>

        <AdSlot slot="home-mid" />

        <section className="section">
          <div className="section-head">
            <h2>지금 읽어볼 만한</h2>
          </div>
          <div className="card-grid">
            {picks.map((e) => (
              <YokaiCard key={e.id} entry={e} />
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>분류로 보기</h2>
          </div>
          <div className="card-grid">
            {CATEGORIES.map((c) => (
              <Link key={c.id} className="card" to={`/category/${c.id}`} style={{ '--cat': c.color }}>
                <div className="card-head">
                  <Seal category={c.id} />
                  <h3>
                    {c.name} <span className="small muted num">{counts[c.id] ?? 0}</span>
                  </h3>
                </div>
                <p>{c.blurb}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>우리 지역 요괴</h2>
          </div>
          <div className="row">
            {REGIONS.map((r) => (
              <Link key={r.slug} className="chip" to={`/region/${r.slug}`}>
                {r.name}
              </Link>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="notice seal">
            <strong>지자체·기관·스튜디오와 협업합니다.</strong> 권역 요괴 콘텐츠 팩, 스탬프 투어 코스, 데이터
            라이선스·API, 웹툰·게임 원안 자문. 조달 심사에서 요구하는 근거(출처·검증등급·좌표 정밀도)를 레코드 단위로
            제시할 수 있습니다. <Link to="/business">협업 안내 보기 →</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
