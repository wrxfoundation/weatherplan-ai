import { Link } from 'react-router-dom'
import { META } from '../data/yokai.js'

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="page" style={{ padding: 0 }}>
        <p style={{ margin: '0 0 8px' }}>
          <strong>한국요괴지도</strong> — 한국 구비전승·문헌 기록의 요괴와 신격을 공개 자료 기반으로 정리하는 오픈
          데이터 프로젝트. 데이터 v{META.version} · {META.generated_at} 기준 {META.count}체.
        </p>
        <p style={{ margin: '0 0 8px' }}>
          이 사이트의 서술은 문화·엔터테인먼트 목적이며 특정 종교나 신앙을 권하거나 폄하할 의도가 없습니다. 무속·불교
          신앙과 관련된 항목에는 별도 표기를 두었고, 실존 신당·사유지 방문을 권유하지 않습니다.
        </p>
        <div className="row small">
          <Link to="/dogam">도감</Link>
          <span className="muted">·</span>
          <Link to="/about">데이터 원칙·출처</Link>
          <span className="muted">·</span>
          <a href="/data/yokai.json">공개 데이터셋(JSON)</a>
          <span className="muted">·</span>
          <a href="/llms.txt">llms.txt</a>
          <span className="muted">·</span>
          <span className="muted">데이터 라이선스 {META.license}</span>
        </div>
      </div>
    </footer>
  )
}
