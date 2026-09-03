// ─── 신청 분기 모달 — "AI와 진행 / 전문 상담사와 진행" ─────────────────────
// 인터넷 빌더·휴대폰 상세·알뜰폰 상세가 같은 갈림길을 쓴다. 상담사 쪽에는 운영 시간을
// 반드시 적는다(스펙: 평일 18시까지) — 시간 밖에 눌러도 접수는 되고 다음 영업일 콜백.
import { useNavigate } from 'react-router-dom'
import { Modal } from './ui'

export const HUMAN_HOURS = '평일 18시까지'

export default function ApplyChoiceModal({ open, onClose, title = '어떻게 진행할까요?', summary, seed, consultTo = '/consult', consultState }) {
  const nav = useNavigate()
  const goAI = () => {
    onClose?.()
    window.dispatchEvent(new CustomEvent('moduon:chat-open', { detail: { seed } }))
  }
  const goHuman = () => {
    onClose?.()
    nav(consultTo, { state: consultState })
  }
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {summary && <p className="rounded-field bg-cream/70 px-3.5 py-2.5 text-[13px] leading-5 text-label">{summary}</p>}
      <div className="mt-4 grid gap-2.5">
        <button
          onClick={goAI}
          data-t="apply-ai"
          className="glass-btn-cta flex h-[64px] w-full flex-col items-center justify-center rounded-btn bg-primary text-white transition-colors hover:bg-primary-hover"
        >
          <span className="text-[15.5px] font-extrabold">AI와 진행할게요</span>
          <span className="text-[11.5px] font-semibold opacity-85">지금 바로 · 24시간 · 바꾸라고 하지 않아요</span>
        </button>
        <button
          onClick={goHuman}
          data-t="apply-human"
          className="glass-btn flex h-[64px] w-full flex-col items-center justify-center rounded-btn border-[1.5px] border-primary bg-white text-primary-text transition-colors hover:bg-tint"
        >
          <span className="text-[15.5px] font-extrabold">전문 상담사와 진행할게요</span>
          <span className="text-[11.5px] font-semibold text-label">{HUMAN_HOURS} · 이후 접수분은 다음 영업일 오전 콜백</span>
        </button>
      </div>
      <p className="mt-3 text-center text-[11.5px] leading-4 text-faint">어느 쪽이든 지금 고른 조건이 그대로 전달돼요 — 다시 설명하지 않아도 됩니다.</p>
    </Modal>
  )
}
