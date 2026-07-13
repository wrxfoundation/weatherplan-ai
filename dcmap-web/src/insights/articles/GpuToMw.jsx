import { Link } from 'react-router-dom'

/* 콘텐츠 등급 ③민간 가공(공개 스펙) — 계산기 산식 공개 (src/calc) */
export default function GpuToMw() {
  return (
    <>
      <p>
        “GPU 1만 장이면 데이터센터가 얼마나 커야 하나요?” — 이 질문을 숫자로 바꾸는 것이{' '}
        <Link to="/calc">AI InfraMap GPU 계산기</Link>의 일이다. 산식은 숨길 이유가 없어서, 이 글에서 그대로 공개한다.
        입력은 세 개다: <strong>GPU 기종과 수량, PUE</strong>.
      </p>

      <h2>1단계 — 칩의 밥값</h2>
      <p>
        공개 스펙 기준 GPU 1장의 보드 전력(TDP)은 <strong>H100·H200 약 0.7kW, B200 약 1.0kW, GB200의 블랙웰
        GPU 1장 약 1.2kW</strong>다(GB200 슈퍼칩은 GPU 2장+Grace로 약 2.7kW — 아래 계산은 GPU 장 수 기준). 1만 장이면 기종에 따라 7~12MW — 칩만의 숫자다.
      </p>

      <h2>2단계 — 서버와 네트워크의 세금</h2>
      <p>
        GPU는 혼자 돌지 않는다. CPU·메모리·스토리지·네트워크 스위치·전원 손실이 붙는다. 계산기는 이를{' '}
        <strong>오버헤드 계수 1.2</strong>로 반영한다 — 업계 설계 관행의 보수적 하한선이다. 1만 장의 GB200은
        여기서 이미 14.4MW가 된다.
      </p>

      <h2>3단계 — 냉각의 세금, PUE</h2>
      <p>
        마지막으로 시설 전체 효율 <strong>PUE(전력사용효율)</strong>를 곱한다. PUE 1.3이면 IT 부하 1MW당 시설
        전체는 1.3MW를 끌어와야 한다. 결과: <strong>GB200 1만 장 × 1.2kW × 1.2 × PUE 1.3 ≈ 18.7MW</strong>.
        같은 1만 장이라도 H100이면 약 10.9MW — 기종 선택이 수전 트랙을 바꾼다.{' '}
        <Link to="/insights/liquid-cooling-brief">액체냉각 전환</Link>으로 PUE가 내려가면 같은 수전용량에 더 많은
        GPU를 싣는다는 뜻이기도 하다.
      </p>

      <h2>이 숫자가 곧 인허가다</h2>
      <p>
        계산 결과가 <strong>10MW를 넘으면 계통영향평가 대상, 40MW를 넘으면 154kV 수전 의무</strong>다(
        <Link to="/insights/power-track-40mw">40MW의 벽</Link> 참조). 그래서 계산기의 결과 화면은 MW만 보여주지
        않고 트랙 판정과 “이 용량 가능한 부지 보기” 버튼으로 이어진다 — GPU 수량에서 출발해 지도 위의 후보지까지,
        한 호흡에 가는 것이 이 도구의 목적이다.
      </p>
    </>
  )
}
