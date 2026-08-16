import { useState } from 'react'
import Seal from './Seal.jsx'
import { CAT } from '../data/yokai.js'

/**
 * 도상 판(圖版).
 *
 * 도상은 순차적으로 채워지는 자산이라, 파일이 없거나 아직 안 받아진 상태가 정상이다.
 * 그래서 이미지 로드가 실패하면 조용히 인장 폴백으로 돌아간다 — 깨진 이미지 아이콘을 절대 보이지 않는다.
 * (파일 반입은 scripts/fetch-art.mjs, 생성 규격은 data/art/direction.json)
 */
export default function ArtPlate({ entry, size = 'lg', ratio = '4 / 5' }) {
  const [failed, setFailed] = useState(false)
  const src = entry?.art?.file

  if (!src || failed) {
    return (
      <div className="art-fallback" style={{ '--cat': CAT[entry.category]?.color, aspectRatio: ratio }}>
        <Seal category={entry.category} size={size === 'sm' ? 'lg' : 'xl'} />
      </div>
    )
  }

  return (
    <figure className="art-plate" style={{ '--cat': CAT[entry.category]?.color, aspectRatio: ratio }}>
      <img src={src} alt={`${entry.canonical} 도상`} loading="lazy" onError={() => setFailed(true)} />
      {size !== 'sm' && (
        <figcaption>
          AI 생성 도상 · 아트디렉션 {entry.art.direction}
          {entry.art.status !== 'final' ? ' · 시안' : ''}
        </figcaption>
      )}
    </figure>
  )
}
