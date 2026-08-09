// ─── 고객센터 — 연락 채널 + FAQ 허브 ─────────────────────────────
// GNB "고객센터"가 데모 로그인으로 가던 오도를 해소하는 실제 지원 허브.
// 즉시통화·상담·FAQ를 한 화면에 — 답을 못 찾으면 상담 신청으로 수렴.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IcPhone, IcChat, IcClock, IcSearch, IcDoc, IcStore } from '../../components/icons'

const FAQS = [
  { q: '현금 사은품은 언제 지급되나요?', a: '설치·개통 확인 후 영업일 7일 이내에 신청인 명의 계좌로 입금돼요. 3년 약정 기준이며, 12개월 내 해지 시 일부 반환 조건이 있을 수 있어요. 일자별 지급 내역은 "지급 명단"에서 공개하고 있어요.' },
  { q: '우리 동네도 설치가 되나요?', a: '인터넷/TV 카테고리의 "설치 가능 지역 조회"에서 시·군·구로 바로 확인할 수 있어요. 조회에 없는 지역도 상담을 남겨주시면 상담사가 설치 가능 여부를 직접 확인해 드려요.' },
  { q: '기존 통신사 위약금이 남아 있어요.', a: '위약금 잔여 금액과 약정 만기를 알려주시면, 지원금과 상계해 실부담이 얼마인지 계산해 드려요. 조건에 따라 위약금 부담을 줄이는 구성이 가능한 경우가 많아요.' },
  { q: '상담 신청하면 언제 연락이 오나요?', a: '신청 즉시 지역 전담 파트너에게 실시간 배정되고, 평균 10분 안에 전화드려요. 원하시는 상담 시간을 선택하시면 그 시간대에 맞춰 연락드립니다.' },
  { q: '개인정보는 어떻게 관리되나요?', a: '이름·연락처·지역(시·군·구까지만)을 상담 목적에 한해 수집하고, 배정된 상담 파트너에게만 제공돼요. 보유 기간은 상담 완료 후 1년 또는 동의 철회 시까지이며, 모든 열람·처리 내역이 기록됩니다.' },
  { q: '신청을 취소하거나 변경하고 싶어요.', a: '배정된 상담사에게 말씀해 주시거나 대표번호로 연락 주시면 즉시 처리해 드려요. 개통 전 취소는 위약 없이 가능해요.' },
  { q: '견적은 사이트 금액 그대로인가요?', a: 'AI 견적과 계산기 금액은 참고용 기준가예요. 통신사·요금제·약정·재고·지역·심사 결과에 따라 달라질 수 있어 최종 조건은 상담에서 확정돼요. 다만 확정 조건은 계약 전 문자로 한 번 더 안내드립니다.' },
  { q: '분양몰(파트너) 창업은 어디서 문의하나요?', a: '"분양 안내" 메뉴에서 권역·비용 구조를 확인하고 온라인으로 바로 신청할 수 있어요. 대리점 가입비와 월 이용료, 권역별 사업권 조건이 정리돼 있습니다.' },
]

export default function Support() {
  const [openIdx, setOpenIdx] = useState(0)
  return (
    <main className="mx-auto max-w-3xl px-5 pb-16">
      <div className="pt-8">
        <h1 className="text-[26px] font-extrabold tracking-[-0.5px] text-ink">고객센터</h1>
        <p className="mt-1.5 text-[14px] text-muted">궁금한 건 바로, 해결은 끝까지 — 전화·AI 상담·FAQ를 한곳에 모았어요.</p>
      </div>

      {/* 연락 채널 3 */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <a href="tel:16600000" className="glass-btn rounded-card border border-line-soft bg-white p-4 transition-colors hover:border-primary">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tint text-primary-text"><IcPhone size={16} /></span>
          <div className="mt-2.5 text-[14.5px] font-extrabold text-ink">전화 상담</div>
          <div className="tnum mt-0.5 text-[13px] font-bold text-primary-text">1660-0000</div>
          <div className="mt-1 flex items-center gap-1 text-[11.5px] text-faint"><IcClock size={11} /> 평일 09:00–18:00</div>
        </a>
        <Link to="/consult" className="glass-btn rounded-card border border-line-soft bg-white p-4 transition-colors hover:border-primary">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-tint text-orange-text"><IcChat size={16} /></span>
          <div className="mt-2.5 text-[14.5px] font-extrabold text-ink">상담 신청</div>
          <div className="mt-0.5 text-[12px] leading-4 text-muted">30초 신청 · 평균 10분 내 전문 상담사 콜백</div>
        </Link>
        <Link to="/diagnosis" className="glass-btn rounded-card border border-line-soft bg-white p-4 transition-colors hover:border-primary">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ok/10 text-ok"><IcSearch size={16} /></span>
          <div className="mt-2.5 text-[14.5px] font-extrabold text-ink">AI 생활비 진단</div>
          <div className="mt-0.5 text-[12px] leading-4 text-muted">1분 문답으로 새는 돈부터 확인</div>
        </Link>
      </div>

      {/* FAQ 아코디언 */}
      <section className="mt-6 rounded-section bg-white p-5 shadow-card sm:p-7">
        <h2 className="text-[17px] font-extrabold text-ink">자주 묻는 질문</h2>
        <div className="mt-3 divide-y divide-line-card">
          {FAQS.map((f, i) => (
            <div key={f.q}>
              <button
                onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
                aria-expanded={openIdx === i}
                className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
              >
                <span className={`text-[14.5px] font-bold ${openIdx === i ? 'text-primary-text' : 'text-ink'}`}>{f.q}</span>
                <span className={`shrink-0 text-[13px] text-faint transition-transform ${openIdx === i ? 'rotate-180' : ''}`}>⌄</span>
              </button>
              {openIdx === i && <p className="pb-4 text-[13.5px] leading-[22px] text-muted animate-rise">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* 빠른 링크 */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { to: '/calculator', label: '견적 계산기', Icon: IcDoc },
          { to: '/payouts', label: '사은품 지급 명단', Icon: IcDoc },
          { to: '/partner', label: '분양 안내', Icon: IcStore },
          { to: '/login', label: '파트너 로그인', Icon: IcStore },
        ].map(({ to, label, Icon }) => (
          <Link key={label} to={to} className="glass-btn flex items-center gap-2 rounded-field border border-line-soft bg-white px-3 py-2.5 text-[12.5px] font-bold text-body transition-colors hover:border-primary hover:text-primary-text">
            <Icon size={14} className="shrink-0 text-primary-text" /> {label}
          </Link>
        ))}
      </div>

      <p className="mt-4 text-[11.5px] leading-4 text-label">전화 상담 운영시간 외에는 상담 신청을 남겨주시면 다음 영업일 오전에 우선 연락드려요. 데모 빌드의 번호·시간은 예시입니다.</p>
    </main>
  )
}
