import { Link } from 'react-router-dom'

/* 1차 소스: KDDC Issue Focus(2026.7.7)·STRABASE — Ecolab의 CoolIT Systems 인수.
 * 콘텐츠 등급 ④참고·인사이트. 수치·거래 내용은 원문 인용. */
export default function CoolingPlatformMA() {
  return (
    <>
      <p>
        수처리·산업솔루션 기업 <strong>Ecolab</strong>(NYSE:ECL)이 고밀도 데이터센터용 액체냉각 전문기업{' '}
        <strong>CoolIT Systems를 약 47억 5,000만 달러에 인수</strong>했다(2026.7.2 완료). 단순한 장비기업
        인수가 아니다 — AI 데이터센터의 병목이 GPU와 전력에서 끝나지 않고, 그 GPU를 안정적으로{' '}
        <strong>식히는 열관리·물관리·화학처리·운영 데이터</strong>의 문제로 확장되고 있음을 보여주는 사건이다.
      </p>

      <h2>냉각은 옵션이 아니라 기본 조건이 됐다</h2>
      <p>
        AI 서버의 랙 밀도가 높아질수록 공랭 중심 설계는 한계에 가까워진다. 액체냉각은 이제 친환경 옵션이나
        HPC용 특수 기술이 아니라 <strong>고밀도 AI 인프라를 실제로 구현하기 위한 기본 조건</strong>이다. 핵심
        질문은 “얼마나 많은 칩을 확보했는가”에서 <strong>“그 칩을 얼마나 높은 밀도와 안정성으로 운영할 수
        있는가”</strong>로 옮겨간다. CoolIT은 direct-to-chip 액체냉각의 대표기업으로, NVIDIA·AMD와 맞춤형
        냉각 협력 경험을 갖고 향후 12개월 약 5억 5,000만 달러 매출이 예상된다.
      </p>

      <h2>경쟁축의 이동 — 하드웨어에서 통합 운영 플랫폼으로</h2>
      <p>
        이 거래의 의미는 금액보다 <strong>인수 주체의 성격</strong>에 있다. 물관리·위생 기업이 GPU에 밀착해
        열을 제거하는 냉각 하드웨어 기업을 샀다. 냉각 시장의 경쟁축이 냉각판·CDU 같은 <strong>하드웨어 판매에서
        물·화학·디지털 모니터링·서비스를 결합한 통합 운영 플랫폼</strong>으로 이동하고 있다는 신호다. Ecolab은
        2011년 Nalco 인수로 확보한 실시간 수질 감지·제어(3D TRASAR) 역량과 초순수 처리(Ovivo)를 CoolIT 냉각과
        묶어, Global High-Tech 유효시장을 약 50억 → <strong>100억 달러</strong>로 넓힌다고 밝혔다.
      </p>

      <h2>AI InfraMap의 관점 — 냉각은 용수·기상·전력의 입지 문제다</h2>
      <p>
        액체냉각으로의 전환은 하드웨어 교체가 아니라 <strong>입지 방정식의 재작성</strong>이다. 통합 플랫폼이
        관리하는 것은 결국 <strong>물(용수 확보·수질)·화학·열</strong> — 모두 부지에 종속된 변수다. AI InfraMap이 냉각을
        기상·용수·계약전력과 함께 입지 축으로 다루는 이유다. 냉각 세대교체가 왜 프리쿨링·습구온도·용수 가용성을
        입지 기준으로 끌어올리는지는 <Link to="/insights/liquid-cooling-brief">‘액체냉각으로의 전환’</Link>에서,
        전력·허가로 옮겨간 경쟁의 큰 그림은 <Link to="/insights/power-permit-battle">‘전력·허가가 승부를 가른다’</Link>에서
        이어진다. AI InfraMap은 <Link to="/stats">통계</Link>에서 국내 DC의 공조 방식(외기도입 18.1%)을 이미 추적하고 있다.
      </p>
    </>
  )
}
