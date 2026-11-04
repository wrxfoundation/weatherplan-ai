import { Link } from 'react-router-dom'
import { slugOf, CAT, RAR } from '../data/yokai.js'
import ArtPlate from './ArtPlate.jsx'
import Seal from './Seal.jsx'

/**
 * 컬렉터 카드 — 도감 카드와 다르다.
 *
 * 도감 카드는 "읽기 위한" 카드라 요약문과 출처 배지가 붙는다. 컬렉터 카드는
 * "모으기 위한" 카드라 번호·희귀도·도판만 남긴다. 정보를 덜어 낸 것이 기능이다.
 *
 * 미수집 카드를 목록에서 빼지 않는다. 빈칸이 보여야 무엇을 못 모았는지 알고,
 * 그게 수집의 동력이다. 다만 이름은 남긴다 — 도감이 공개 자료인데 컬렉션에서만
 * 이름을 가리면 같은 데이터에 두 얼굴이 생긴다.
 */
export default function CollectorCard({ entry, no, total, owned, onZoom }) {
  const color = CAT[entry.category]?.color
  const rarity = RAR[entry.rarity]

  return (
    <Link
      className={`cc${owned ? '' : ' locked'}`}
      to={`/yokai/${slugOf(entry)}`}
      style={{ '--cat': color }}
      aria-label={`${no}번 ${entry.canonical}${owned ? ' (수집함)' : ' (미수집)'}`}
    >
      <div className="cc-top">
        <span className="cc-no">
          No.{String(no).padStart(3, '0')}
          <span className="muted"> / {total}</span>
        </span>
        <span>{rarity?.name ?? entry.rarity}</span>
      </div>

      {owned ? (
        <ArtPlate entry={entry} size="sm" onZoom={onZoom} />
      ) : (
        <div className="cc-locked-art">
          <Seal category={entry.category} size="xl" />
        </div>
      )}

      <div className="cc-body">
        <h3 className="cc-name">{entry.canonical}</h3>
        <div className="cc-sub">
          {owned ? (entry.sites[0]?.sigungu ?? entry.distribution) : '미수집'}
        </div>
      </div>
    </Link>
  )
}
