import { Link } from 'react-router-dom'
import { META, VERIFICATION, CATEGORIES } from '../data/yokai.js'
import { useHead } from '../ui/useHead.js'

const SOURCES = [
  {
    name: '한국구비문학대계',
    org: '한국학중앙연구원',
    role: '마을 단위 채록 설화. 전승지 좌표화의 1차 원천이자 지역 변이 비교의 기준.',
  },
  { name: '한국민속대백과사전', org: '국립민속박물관', role: '민간신앙·의례·금기 항목의 표준 서술.' },
  { name: '한국향토문화전자대전', org: '한국학중앙연구원', role: '시군구·읍면동 단위 향토 전승. 지역 커버리지 확장용.' },
  { name: '국가유산포털', org: '국가유산청', role: '당집·장승·신당의 실좌표와 지정정보. 근사 좌표를 실좌표로 교체하는 경로.' },
  { name: '한국민족문화대백과사전', org: '한국학중앙연구원', role: '설화 유형·개념 정의.' },
  { name: '고전 원전', org: '삼국유사·삼국사기·조선왕조실록·대동운부군옥·동국세시기 등', role: '검증등급 최상위 근거. 날짜·지명이 붙은 기록.' },
]

export default function AboutPage() {
  useHead({
    title: '데이터 원칙과 출처 — 한국요괴지도',
    description:
      '출처 없는 레코드는 배포하지 않는다, 검증등급을 숨기지 않는다, 실존 신앙을 존중한다 — 한국요괴지도의 데이터 원칙과 원천 자료 목록.',
    canonical: '/about',
  })

  return (
    <main className="page page-narrow">
      <h1 style={{ fontSize: 'var(--text-h1)', marginBottom: 4 }}>데이터 원칙과 출처</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        데이터 v{META.version} · {META.generated_at} 기준 {META.count}체 / 전승지 {META.siteCount}곳 · 라이선스{' '}
        {META.license}
      </p>

      <div className="section">
        <h2>다섯 가지 원칙</h2>
        <ol className="body-text">
          <li>
            <strong>출처 없는 레코드는 배포하지 않는다.</strong> 모든 항목에 최소 1개의 출처가 있어야 하며, 빌드
            스크립트가 이를 강제해 위반 시 배포가 실패한다.
          </li>
          <li>
            <strong>검증등급을 숨기지 않는다.</strong> 근거가 약한 항목을 지우는 대신 등급을 낮춰 표시한다. 근현대
            정리물에서 정착한 서술은 &lsquo;2차 정리물&rsquo;로 명시한다.
          </li>
          <li>
            <strong>좌표의 정밀도를 정직하게 표기한다.</strong> 시군구·시도 중심점은 근사 좌표로 구분 표시하고, 광포설화에
            정밀 좌표를 붙이지 않는다.
          </li>
          <li>
            <strong>실존 신앙을 존중한다.</strong> 무속·불교 신앙과 관련된 항목에는 별도 고지를 달고, 실존 신당·사유지
            방문을 권유하지 않는다.
          </li>
          <li>
            <strong>표기 흔들림은 흡수한다.</strong> 같은 존재의 지역별 이름은 대표 표기 하나에 이표기 목록으로 통합해
            중복 등재를 막는다.
          </li>
        </ol>
      </div>

      <div className="section">
        <h2>검증등급</h2>
        <dl className="kv">
          {VERIFICATION.map((v) => (
            <div key={v.id} style={{ display: 'contents' }}>
              <dt style={{ color: `var(--ver-${v.id})` }}>{v.name}</dt>
              <dd>{v.desc}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="section">
        <h2>원천 자료</h2>
        <dl className="kv" style={{ gridTemplateColumns: '160px 1fr' }}>
          {SOURCES.map((s) => (
            <div key={s.name} style={{ display: 'contents' }}>
              <dt>
                {s.name}
                <div className="small muted">{s.org}</div>
              </dt>
              <dd>{s.role}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="section">
        <h2>분류 체계</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          14개 대분류. 일본 요괴 분류를 번역한 것이 아니라, 한국 자료의 실제 항목 분포에 맞춰 재설계했습니다.
        </p>
        <div className="row">
          {CATEGORIES.map((c) => (
            <Link key={c.id} className="chip" style={{ '--chip-color': c.color }} to={`/category/${c.id}`}>
              <span className="dot" />
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>데이터 이용</h2>
        <p className="body-text">
          전체 데이터셋은 <a href="/data/yokai.json">/data/yokai.json</a>에서 그대로 받을 수 있습니다(CC BY 4.0, 출처
          표기 필요). AI 에이전트용 요약은 <a href="/llms.txt">/llms.txt</a>에 있습니다. 각 레코드는 안정 식별자(id)를
          가지며, id는 변경하지 않습니다.
        </p>
      </div>

      <div className="section">
        <h2>고지</h2>
        <p className="notice">
          이 사이트의 서술은 문화·엔터테인먼트 목적이며, 특정 종교나 신앙을 권하거나 폄하할 의도가 없습니다. 실존
          사건·사고와 결부된 현대 괴담은 특정 사건이나 피해자를 연상시키지 않는 범위에서만 다룹니다. 잘못된 정보나 누락된
          출처를 발견하면 알려 주세요 — 정정 이력은 데이터 버전으로 남깁니다.
        </p>
      </div>
    </main>
  )
}
