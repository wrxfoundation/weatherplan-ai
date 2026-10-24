import { Link } from 'react-router-dom'
import { META } from '../data/yokai.js'

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div style={{ maxWidth: 'var(--page-max)', margin: '0 auto' }}>
        <div className="row" style={{ gap: 'var(--sp-2)', alignItems: 'baseline' }}>
          <strong style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-lg)', color: 'var(--text-2)' }}>
            한국요괴지도
          </strong>
          <span className="num">
            데이터 v{META.version} · {META.generated_at} 기준 {META.count}체 · {META.license}
          </span>
        </div>

        <p style={{ margin: 'var(--sp-3) 0', maxWidth: 720 }}>
          이 사이트의 서술은 문화·엔터테인먼트 목적이며 특정 종교나 신앙을 권하거나 폄하할 의도가 없습니다. 무속·불교
          신앙과 관련된 항목에는 별도 표기를 두었고, 실존 신당·사유지 방문을 권유하지 않습니다. 현대 괴담은 실제
          사건·피해자·시설을 지목하지 않는 범위에서만 다룹니다.
        </p>

        <div className="row" style={{ gap: 'var(--sp-3)' }}>
          <Link to="/map">지도</Link>
          <Link to="/dogam">도감</Link>
          <Link to="/quiz">체질진단</Link>
          <Link to="/business">기관·기업 협업</Link>
          <Link to="/about">데이터 원칙·출처</Link>
          <a href="/data/yokai.json">공개 데이터셋(JSON)</a>
          <a href="/llms.txt">llms.txt</a>
        </div>
      </div>
    </footer>
  )
}
