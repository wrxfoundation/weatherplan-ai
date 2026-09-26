import { useState } from 'react'
import Seal from './Seal.jsx'
import Icon from './Icon.jsx'
import { CAT } from '../data/yokai.js'

/**
 * 도상 판(圖版).
 *
 * 도상은 순차적으로 채워지는 자산이라, 파일이 없거나 아직 안 받아진 상태가 정상이다.
 * 그래서 이미지 로드가 실패하면 조용히 인장 폴백으로 돌아간다 — 깨진 이미지 아이콘을 절대 보이지 않는다.
 * (파일 반입은 scripts/fetch-art.mjs, 생성 규격은 data/art/direction.json)
 */
/**
 * ratio는 도판의 원본 비율(4:5)이 기본이다. 다른 비율을 주면 object-fit: cover가
 * 잘라 내므로, 인물의 얼굴이나 주제가 날아간다(도감 카드가 16/10이라 아기장수의
 * 아기와 아랑의 얼굴이 잘려 있었다). 비율을 바꿔야 하면 fit="contain"을 함께 준다.
 *
 * onZoom을 주면 원본 보기 단추가 붙는다. 두 가지 방식이 있다.
 *  - zoom="button"(기본): 모서리에 작은 단추. 판 전체가 <Link> 안에 있을 때 쓴다.
 *    판을 통째로 누르게 하면 상세로 가는 길이 막힌다.
 *  - zoom="surface": 판 전체가 단추. 상세 페이지처럼 링크와 겹치지 않는 자리에서 쓴다.
 */
export default function ArtPlate({ entry, size = 'lg', ratio = '4 / 5', fit = 'cover', onZoom, zoom = 'button' }) {
  const [failed, setFailed] = useState(false)
  const src = entry?.art?.file

  if (!src || failed) {
    return (
      <div className="art-fallback" style={{ '--cat': CAT[entry.category]?.color, aspectRatio: ratio }}>
        <Seal category={entry.category} size={size === 'sm' ? 'lg' : 'xl'} />
      </div>
    )
  }

  // 카드 안에서 열릴 때가 많다. 링크를 타고 상세로 넘어가 버리면 라이트박스는 못 본다.
  const open = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onZoom(entry)
  }

  return (
    <figure
      className="art-plate"
      data-fit={fit}
      data-zoom={onZoom ? zoom : undefined}
      style={{ '--cat': CAT[entry.category]?.color, aspectRatio: ratio }}
    >
      <img src={src} alt={`${entry.canonical} 도상`} loading="lazy" onError={() => setFailed(true)} />

      {onZoom && zoom === 'surface' && (
        <button type="button" className="art-zoom-surface" onClick={open} aria-label={`${entry.canonical} 도판 크게 보기`}>
          <span className="art-zoom-hint">
            <Icon name="zoom" size={15} /> 크게 보기
          </span>
        </button>
      )}
      {onZoom && zoom === 'button' && (
        <button type="button" className="art-zoom" onClick={open} aria-label={`${entry.canonical} 도판 크게 보기`}>
          <Icon name="zoom" size={17} />
        </button>
      )}

      {size !== 'sm' && (
        <figcaption>
          AI 생성 도상 · 아트디렉션 {entry.art.direction}
          {entry.art.status !== 'final' ? ' · 시안' : ''}
        </figcaption>
      )}
    </figure>
  )
}
