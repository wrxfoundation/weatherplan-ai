import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { slugOf, CAT } from '../data/yokai.js'
import Icon from './Icon.jsx'
import { RarityBadge, VerificationBadge } from './Badges.jsx'

/**
 * 도판 원본 보기.
 *
 * 목록 카드는 잘림 없이 4:5로 보여 주지만 300px이고 상세 도판도 그 정도다.
 * 그림 자체를 보려는 사람에게는 부족해서, 화면 전체를 쓰는 뷰를 따로 둔다.
 *
 * body로 포털하는 이유: 카드가 hover에서 transform을 쓴다. transform이 걸린
 * 조상이 있으면 position:fixed가 화면이 아니라 그 카드 기준으로 갇힌다.
 * 어디서 열든 화면 기준으로 떠야 하므로 DOM 위치를 아예 분리한다.
 */

/**
 * 라이트박스 상태를 페이지가 들고 있게 하는 훅.
 *
 * 카드가 직접 상태를 들면 카드마다 라이트박스가 하나씩 생긴다. 목록을 넘겨주면
 * ←/→로 그 목록 안에서 이동한다 — 목록이 없으면 한 장짜리로 동작한다.
 *
 *   const { openPlate, lightbox } = useLightbox(list)
 *   <YokaiCard entry={e} onZoom={openPlate} /> … {lightbox}
 */
export function useLightbox(list = []) {
  const [id, setId] = useState(null)

  const openPlate = useCallback((entry) => setId(entry?.id ?? null), [])
  const close = useCallback(() => setId(null), [])

  const idx = list.findIndex((e) => e.id === id)
  const entry = idx >= 0 ? list[idx] : null

  /** 도판 없는 개체는 건너뛴다 — 원본 보기로 넘어갔는데 인장만 뜨면 이동한 뜻이 없다. */
  const step = useCallback(
    (d) => {
      const n = list.length
      if (idx < 0 || n === 0) return
      for (let i = 1; i <= n; i++) {
        const j = (((idx + d * i) % n) + n) % n
        if (list[j]?.art?.file) return setId(list[j].id)
      }
    },
    [idx, list],
  )

  const siblings = list.filter((e) => e?.art?.file).length

  return {
    openPlate,
    lightbox: entry ? (
      <Lightbox
        entry={entry}
        onClose={close}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
        position={siblings > 1 ? { at: list.slice(0, idx + 1).filter((e) => e?.art?.file).length, of: siblings } : null}
      />
    ) : null,
  }
}

function Lightbox({ entry, onClose, onPrev, onNext, position }) {
  const closeRef = useRef(null)
  const [natural, setNatural] = useState(null)
  // 화면에 맞춘 크기 ↔ 실제 픽셀 크기. '원본'을 보러 온 사람에게 축소본만 주면 답이 아니다.
  const [actual, setActual] = useState(false)

  // 핸들러를 ref에 담아 두면 열려 있는 동안 effect가 한 번만 돈다.
  // deps에 그대로 넣으면 ←/→로 개체가 바뀔 때마다 포커스가 튀고 스크롤 잠금이 풀렸다 잠긴다.
  const h = useRef({ onClose, onPrev, onNext })
  h.current = { onClose, onPrev, onNext }

  useEffect(() => {
    const restore = document.activeElement
    closeRef.current?.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') h.current.onClose()
      else if (e.key === 'ArrowLeft') h.current.onPrev()
      else if (e.key === 'ArrowRight') h.current.onNext()
    }
    document.addEventListener('keydown', onKey)

    // 뒤 배경이 같이 스크롤되면 닫은 뒤 엉뚱한 위치에 가 있다
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      if (restore instanceof HTMLElement) restore.focus()
    }
  }, [])

  // 개체가 바뀌면 이전 그림의 크기가 잠깐 남는다
  useEffect(() => {
    setNatural(null)
    setActual(false)
  }, [entry.id])

  const cat = CAT[entry.category]

  return createPortal(
    <div
      className="lb"
      role="dialog"
      aria-modal="true"
      aria-label={`${entry.canonical} 도판 원본 보기`}
      style={{ '--cat': cat?.color }}
    >
      <div className="lb-bar">
        <div className="lb-title">
          <strong>{entry.canonical}</strong>
          {cat && <span className="small muted">{cat.name}</span>}
          {position && (
            <span className="small muted num">
              {position.at} / {position.of}
            </span>
          )}
        </div>
        <button ref={closeRef} type="button" className="lb-x" onClick={onClose} aria-label="닫기 (Esc)">
          <Icon name="close" size={20} />
        </button>
      </div>

      {/* 바깥을 누르면 닫힌다. 그림 위 클릭은 닫지 않는다 — 확대해 놓고 실수로 닫히면 성가시다. */}
      <div
        className="lb-stage"
        data-actual={actual ? 'true' : undefined}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {position && (
          <button type="button" className="lb-nav prev" onClick={onPrev} aria-label="이전 도판 (←)">
            <Icon name="arrowLeft" size={22} />
          </button>
        )}
        <img
          className="lb-img"
          src={entry.art.file}
          alt={`${entry.canonical} 도상 원본`}
          onClick={() => setActual((v) => !v)}
          title={actual ? '화면에 맞추기' : '실제 크기로 보기'}
          onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
        />
        {position && (
          <button type="button" className="lb-nav next" onClick={onNext} aria-label="다음 도판 (→)">
            <Icon name="arrowRight" size={22} />
          </button>
        )}
      </div>

      <div className="lb-foot">
        <div className="lb-meta">
          <RarityBadge id={entry.rarity} />
          <VerificationBadge id={entry.verification} confidence={entry.confidence} />
          <span className="small muted">
            AI 생성 도상 · 아트디렉션 {entry.art.direction}
            {entry.art.status !== 'final' ? ' · 시안' : ''}
          </span>
          {/* 우리가 가진 것은 표시 크기로 줄인 WebP다. 원본이 2k였다고 적으면 거짓말이 된다. */}
          {natural && (
            <button type="button" className="lb-size num" onClick={() => setActual((v) => !v)}>
              {natural.w}×{natural.h}
              <span className="muted"> · {actual ? '화면에 맞추기' : '실제 크기'}</span>
            </button>
          )}
        </div>
        <div className="lb-links">
          <a className="btn ghost sm" href={entry.art.file} target="_blank" rel="noreferrer">
            <Icon name="external" size={14} /> 원본 파일
          </a>
          <Link className="btn ghost sm" to={`/yokai/${slugOf(entry)}`} onClick={onClose}>
            <Icon name="book" size={14} /> 해설 보기
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  )
}
