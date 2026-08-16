import { useState } from 'react'
import { Link } from 'react-router-dom'
import { META, YOKAI, REGIONS } from '../data/yokai.js'
import { useHead, SITE_ORIGIN } from '../ui/useHead.js'

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL

const OFFERS = [
  {
    id: 'govt',
    title: '권역 콘텐츠 팩',
    who: '지자체 · 문화재단 · 관광공사',
    price: '견적',
    featured: true,
    items: [
      '시군구 단위 전승 정리 + 좌표 + 출처 목록',
      '안내판·리플릿·전시 원고 (근거 각주 포함)',
      '스탬프 투어·둘레길 코스 설계안',
      '도상 사용권 (아트디렉션 통일)',
      '조달 제출용 데이터 근거표 — 레코드별 출처·검증등급·좌표 정밀도',
    ],
  },
  {
    id: 'license',
    title: '데이터 라이선스 · API',
    who: '앱 · 게임 · 미디어 · 교육',
    price: '연 구독',
    items: [
      '전체 레코드 API + 증분 업데이트',
      '출처 표기 면제(화이트라벨) 옵션',
      '스키마 안정성 보장 · 마이그레이션 고지',
      '날씨 연동 엔드포인트(오늘의 괴담지수)',
      '공개 스냅샷은 CC BY 4.0으로 계속 무료',
    ],
  },
  {
    id: 'ip',
    title: 'IP 원안 · 자문',
    who: '웹툰 · 게임 · 영상 스튜디오',
    price: '건별',
    items: [
      '제주 본풀이 12편 등 완결 서사 자료집',
      '고증 자문 및 표기 검수',
      '지역 감수 연결',
      '전승은 공유재 — 파는 것은 정리·고증·자문이며 저작권 이전이 아님',
    ],
  },
]

export default function BusinessPage() {
  const [kind, setKind] = useState('govt')
  const [state, setState] = useState({ status: 'idle', reason: null })

  useHead({
    title: '기관·기업 협업 — 한국요괴지도',
    description:
      '지자체 권역 콘텐츠 팩, 데이터 라이선스·API, 웹툰·게임 원안 자문. 조달 심사가 요구하는 근거(출처·검증등급·좌표 정밀도)를 레코드 단위로 제시합니다.',
    canonical: '/business',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: '한국요괴지도 기관·기업 협업',
      provider: { '@type': 'Organization', name: '한국요괴지도', url: SITE_ORIGIN },
      areaServed: 'KR',
      serviceType: ['문화 콘텐츠 개발', '데이터 라이선스', 'IP 자문'],
      url: `${SITE_ORIGIN}/business`,
    },
  })

  const submit = async (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setState({ status: 'sending', reason: null })
    try {
      const r = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...Object.fromEntries(form), kind }),
      })
      const data = await r.json().catch(() => ({ ok: false, reason: 'bad_response' }))
      setState({ status: data.ok ? 'sent' : 'failed', reason: data.reason ?? null })
    } catch {
      setState({ status: 'failed', reason: 'network' })
    }
  }

  const preciseSites = YOKAI.flatMap((e) => e.sites).filter((s) => s.precision === 'parcel' || s.precision === 'dong')
    .length
  const highTrust = YOKAI.filter((e) => e.verification === 'primary_text' || e.verification === 'field_record').length

  return (
    <main className="page">
      <p className="eyebrow">FOR INSTITUTIONS</p>
      <h1 style={{ fontSize: 'var(--text-h1)', margin: '4px 0 var(--sp-3)' }}>
        근거가 붙은 요괴 데이터로 협업합니다
      </h1>
      <p className="body-text" style={{ maxWidth: 'var(--read-max)' }}>
        문화 콘텐츠 사업에서 가장 자주 막히는 지점은 &ldquo;이 서술의 근거가 무엇인가&rdquo;입니다. 한국요괴지도는 모든
        레코드에 <strong>출처</strong>·<strong>검증등급</strong>·<strong>좌표 정밀도</strong>를 함께 저장하고,{' '}
        <strong>출처가 없는 레코드는 배포 자체가 실패</strong>하도록 파이프라인을 구성했습니다. 그래서 제출 자료에 근거표를
        그대로 첨부할 수 있습니다.
      </p>

      <div className="trust-row">
        <div>
          <b className="num">{META.count}</b>
          <span>수록 요괴·신격</span>
        </div>
        <div>
          <b className="num">{highTrust}</b>
          <span>고신뢰 등급(원전·채록)</span>
        </div>
        <div>
          <b className="num">{preciseSites}</b>
          <span>정밀 좌표 전승지</span>
        </div>
        <div>
          <b className="num">{REGIONS.length}</b>
          <span>시도 전체 커버</span>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>협업 형태</h2>
        </div>
        <div className="tier-grid">
          {OFFERS.map((o) => (
            <div key={o.id} className={`tier${o.featured ? ' featured' : ''}`}>
              <h3>{o.title}</h3>
              <div className="small muted">{o.who}</div>
              <div className="price">{o.price}</div>
              <ul>
                {o.items.map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </ul>
              <button
                className="btn"
                style={{ marginTop: 'var(--sp-3)' }}
                onClick={() => {
                  setKind(o.id)
                  document.getElementById('lead')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                이 건으로 문의
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>데이터 이용 조건</h2>
        </div>
        <div className="tier-grid">
          <div className="tier">
            <h3>공개 트랙</h3>
            <div className="price">무료 · CC BY 4.0</div>
            <ul>
              <li>개인·연구·AI 답변엔진 인용</li>
              <li>
                <a href="/data/yokai.json">전체 스냅샷 JSON</a> 즉시 다운로드
              </li>
              <li>출처 표기 의무</li>
            </ul>
          </div>
          <div className="tier">
            <h3>상업 트랙</h3>
            <div className="price">연 구독</div>
            <ul>
              <li>API + 증분 업데이트 + SLA</li>
              <li>출처 표기 면제 옵션</li>
              <li>도상 사용권 별도</li>
              <li>파는 것은 데이터가 아니라 최신성·정합성·유지보수입니다</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section" id="lead">
        <div className="section-head">
          <h2>문의</h2>
        </div>

        {state.status === 'sent' ? (
          <div className="notice seal">
            문의가 접수되었습니다. 영업일 기준 2~3일 안에 회신드리겠습니다.
          </div>
        ) : (
          <form className="col" onSubmit={submit} style={{ maxWidth: 'var(--read-max)' }}>
            <div className="row" style={{ gap: 'var(--sp-2)' }}>
              {OFFERS.map((o) => (
                <button
                  type="button"
                  key={o.id}
                  className={`chip${kind === o.id ? ' on' : ''}`}
                  onClick={() => setKind(o.id)}
                >
                  {o.title}
                </button>
              ))}
              <button type="button" className={`chip${kind === 'etc' ? ' on' : ''}`} onClick={() => setKind('etc')}>
                기타
              </button>
            </div>

            <div className="row" style={{ gap: 'var(--sp-3)', alignItems: 'flex-start' }}>
              <div style={{ flex: '1 1 240px' }}>
                <label className="field" htmlFor="org">
                  기관·회사
                </label>
                <input className="input" id="org" name="org" placeholder="OO시청 문화관광과" />
              </div>
              <div style={{ flex: '1 1 160px' }}>
                <label className="field" htmlFor="name">
                  담당자 이름 *
                </label>
                <input className="input" id="name" name="name" required />
              </div>
            </div>

            <div className="row" style={{ gap: 'var(--sp-3)', alignItems: 'flex-start' }}>
              <div style={{ flex: '1 1 240px' }}>
                <label className="field" htmlFor="email">
                  이메일 *
                </label>
                <input className="input" id="email" name="email" type="email" required />
              </div>
              <div style={{ flex: '1 1 160px' }}>
                <label className="field" htmlFor="phone">
                  연락처
                </label>
                <input className="input" id="phone" name="phone" />
              </div>
            </div>

            <div>
              <label className="field" htmlFor="message">
                문의 내용 *
              </label>
              <textarea
                className="input"
                id="message"
                name="message"
                required
                placeholder="사업 개요, 대상 권역, 일정, 예산 범위를 적어 주시면 회신이 빠릅니다."
              />
            </div>

            {/* 허니팟 — 사람에게는 보이지 않는다 */}
            <input name="website" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} aria-hidden="true" />

            <div className="row">
              <button className="btn primary" type="submit" disabled={state.status === 'sending'}>
                {state.status === 'sending' ? '보내는 중…' : '문의 보내기'}
              </button>
              <span className="small muted">보내주신 정보는 문의 회신 목적으로만 사용합니다.</span>
            </div>

            {state.status === 'failed' && (
              <div className="notice warn">
                {state.reason === 'storage_unconfigured'
                  ? '접수 시스템이 아직 연결되지 않았습니다. 접수된 것으로 처리하지 않았습니다.'
                  : '전송에 실패했습니다.'}{' '}
                {CONTACT_EMAIL ? (
                  <>
                    <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>로 직접 보내 주세요.
                  </>
                ) : (
                  '잠시 후 다시 시도해 주세요.'
                )}
              </div>
            )}
          </form>
        )}
      </section>

      <p className="small muted" style={{ marginTop: 'var(--sp-5)' }}>
        데이터 원칙과 검증등급 체계는 <Link to="/about">데이터 원칙</Link> 문서를 참고하세요.
      </p>
    </main>
  )
}
