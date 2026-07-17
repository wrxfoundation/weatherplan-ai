import { Link } from 'react-router-dom'
import { useMapLang } from '../../i18n/mapLang.js'

/* 콘텐츠 등급 ③민간 가공(공개 스펙) — 계산기 산식 공개 (src/calc) */
export default function GpuToMw() {
  const en = useMapLang() === 'en'
  return en ? (
    <>
      <p>
        "If I have 10,000 GPUs, how big does the data center need to be?" — turning that question into a number
        is the job of the <Link to="/calc">AI InfraMap GPU calculator</Link>. There's no reason to hide the
        formula, so this piece lays it out as-is. There are three inputs:{' '}
        <strong>GPU model and quantity, and PUE</strong>.
      </p>

      <h2>Step 1 — the chip's appetite</h2>
      <p>
        Based on public specs, the board power (TDP) of a single GPU is{' '}
        <strong>about 0.7 kW for the H100/H200, about 1.0 kW for the B200, and about 1.2 kW for a single
        Blackwell GPU in the GB200</strong> (a GB200 superchip pairs 2 GPUs with a Grace CPU for about 2.7 kW —
        the calculation below is per GPU count). For 10,000 units that's 7–12 MW depending on the model — the
        chip-only figure.
      </p>

      <h2>Step 2 — the server-and-network tax</h2>
      <p>
        GPUs don't run alone. CPUs, memory, storage, network switches, and power-conversion losses come with
        them. The calculator accounts for these with an <strong>overhead factor of 1.2</strong> — a conservative
        floor for industry design practice. At this point 10,000 GB200 GPUs already reach 14.4 MW.
      </p>

      <h2>Step 3 — the cooling tax, PUE</h2>
      <p>
        Finally, multiply by the facility-wide efficiency, <strong>PUE (Power Usage Effectiveness)</strong>. At
        a PUE of 1.3, the whole facility must draw 1.3 MW for every 1 MW of IT load. The result:{' '}
        <strong>10,000 GB200 units × 1.2 kW × 1.2 × PUE 1.3 ≈ 18.7 MW</strong>. The same 10,000 units at H100
        would be about 10.9 MW — the choice of model changes the power-intake track.{' '}
        A shift to <Link to="/insights/liquid-cooling-brief">liquid cooling</Link> that lowers PUE also means
        fitting more GPUs into the same intake capacity.
      </p>

      <h2>This number is the permitting</h2>
      <p>
        If the result <strong>exceeds 10 MW it triggers a grid-impact assessment, and above 40 MW a 154 kV
        intake becomes mandatory</strong> (see <Link to="/insights/power-track-40mw">The 40 MW Wall</Link>).
        That's why the calculator's results screen shows more than just MW — it leads into a track verdict and a
        "view sites that can support this capacity" button. Going from a GPU count all the way to candidate sites
        on the map, in one breath, is the purpose of this tool.
      </p>
    </>
  ) : (
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
