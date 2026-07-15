import { Link } from 'react-router-dom'

/* 제도 트래커 — AIDC 특별법 하위법령·전력계통영향평가 고시의 진행 단계 추적.
 * 정직성: 확정(done)은 공개 보도·공포 사실만, 예상(wait/future)은 '예상·미정'을 명시.
 * 각 단계에 출처 링크. 수치를 지어내지 않고, 미정 항목은 미정이라고 쓴다. */

const TRACKS = [
  {
    key: 'aidc',
    title: 'AIDC 특별법 — 하위법령(시행령) 트랙',
    sub: '인허가 원스톱(통합창구)·타임아웃제 · 비수도권 전력계통영향평가 면제 · 특구 지정',
    impact: '면제 용량 상한이 확정되면 GPU 계산기 AIDC 면제 시나리오의 기본 상한과 부지 패널 판정에 자동 반영합니다.',
    steps: [
      {
        date: '2026.05',
        label: '국회 본회의 통과',
        state: 'done',
        src: { name: 'YTN 26.5.9', url: 'https://www.ytn.co.kr/_ln/0105_202605090434415599' },
      },
      {
        date: '2026.06.09',
        label: '공포 — 시행일 확정(공포 후 9개월)',
        state: 'done',
        src: { name: '부산일보', url: 'https://www.busan.com/view/busan/view.php?code=2026050718375921000' },
      },
      {
        date: '2026.06.18',
        label: '과기정통부 하위법령 연구반 킥오프 — 인허가 일괄처리·전력 특례 구체화 착수',
        state: 'done',
        src: { name: '머니투데이 26.6.18', url: 'https://www.mt.co.kr/tech/2026/06/18/2026061810061765879' },
      },
      {
        date: '미정',
        label: '시행령(대통령령) 입법예고 — 면제 용량 상한 · 최소 규모 기준 · 특구 지정 기준',
        state: 'wait',
        note: '제19조 면제 상한은 대통령령 위임 — 수치 미정(우리 계산기 시나리오는 이 값을 가정값으로 시뮬레이션)',
        src: { name: '아주경제 26.7.8', url: 'https://www.ajunews.com/view/20260708135842105' },
      },
      {
        date: '2027.03.10',
        label: '법 시행 — 통합창구 · 비수도권 면제 트랙 개시',
        state: 'future',
      },
    ],
  },
  {
    key: 'psia',
    title: '전력계통영향평가 — 법정 고시 트랙',
    sub: '2년째 시범운영 → 고시 제정(평가항목 · 대행자 제도 · 종합정보지원시스템)',
    impact: '고시가 제정되면 평가 배점·대행자 제도를 PSIA 스코어카드 근거·용어집·절차 P08에 반영합니다.',
    steps: [
      {
        date: '2025.08–2026.03',
        label: '시범운영 심사 — 본심사 통과 수도권 10/24건 vs 비수도권 26/29건(89.7%)',
        state: 'done',
        src: { name: '머니투데이 26.5.23 (기후부 자료)', url: 'https://www.mt.co.kr/tech/2026/05/23/2026052210211399740' },
      },
      {
        date: '2026.05',
        label: '기후에너지환경부 “빠르면 7–8월, 늦어도 연내 제정” 방침',
        state: 'done',
        src: { name: '머니투데이 26.5.20', url: 'https://www.mt.co.kr/tech/2026/05/20/2026051922044934385' },
      },
      {
        date: '2026.06.09–06.29',
        label: '「전력계통영향평가 제도 운영에 관한 규정」 제정안 행정예고 · 의견수렴',
        state: 'done',
        note: '보도 검색 결과 기반 — 원문(행정예고문) 직접 확인 권장',
        src: { name: '에너지데일리', url: 'https://www.energydaily.co.kr/news/articleView.html?idxno=200250' },
      },
      {
        date: '2026 7–8월 (예상)',
        label: '고시 제정 — 평가 배점 · 대행자 제도 법정화',
        state: 'wait',
      },
      {
        date: '제정 이후',
        label: '종합정보지원시스템 개설 — 계통 여유 정보의 공식 창구가 될 가능성',
        state: 'future',
      },
    ],
  },
  {
    key: 'egov',
    title: '전기국가 비전 — 전력망·계통 정보 공개 트랙',
    sub: 'AI·반도체 전력 적기공급 · 2030 재생 100GW · 345kV 변전소 정보 공개 · 비수도권 AIDC 계통영향평가 신속처리',
    impact:
      '정부가 345kV 변전소 정보를 공개하면 지금 "공개 대기"로 비워둔 변전소 여유 레이어에 즉시 반영합니다. 비수도권 신속처리·지역별 요금제는 스코어카드 지역 리스크 배점의 근거가 됩니다.',
    steps: [
      {
        date: '2026.06.29',
        label: '「AI 시대를 선도하는 전기국가 비전」 발표 — 대도약 3대 메가프로젝트 국민보고회',
        state: 'done',
        note: '전기 생산→운송→저장(ESS)→활용 전주기를 국가경쟁력으로. 출처: 산업통상부 보도자료·데일리안 26.6.29.',
      },
      {
        date: '2026.06.29',
        label: 'AI 데이터센터 1단계 8.4GW(SK 5·GS 2.4·네이버 1) → 2단계 포함 총 18.4GW 구축계획 · 약 550조원 투자',
        state: 'done',
        note: 'SK는 1단계 5GW를 2035년까지 15GW로 확장. 우리 시드의 "개별 공개 전력 합계"(현재 약 3GW)는 이 국가계획 대비 개별·공개분임을 소개 히어로에 명시.',
      },
      {
        date: '2026.06.29',
        label: '345kV 변전소 정보 공개 + 비수도권 AIDC 전력계통영향평가 사전협의·신속처리 방침',
        state: 'done',
        note: '우리 서비스가 "공개 대기"로 남겨둔 345kV 여유 정보의 공식 공개 트리거 — 공개 즉시 변전소 레이어에 반영 예정.',
      },
      {
        date: '2026 하반기',
        label: '지역별 전기요금제 도입 · 초거대 AIDC 전기요금 체계 개편',
        state: 'wait',
        note: '지역별 요금이 확정되면 GPU 계산기 TCO의 전력단가를 시도별로 분기 — 현재는 전국 평균 가정.',
      },
      {
        date: '2030',
        label: '재생에너지 100GW 조기 구축 · 송전망·변전소 선제 확충 · RE100 전력거래 플랫폼·VPP·DSO 육성',
        state: 'future',
      },
    ],
  },
]

const STATE_LABEL = { done: '확정', wait: '진행 중 · 대기', future: '예정' }

export default function PolicyTracker() {
  return (
    <div className="policy-tracker">
      <p className="chart-note" style={{ marginTop: 4 }}>
        데이터센터 입지의 두 핵심 제도가 지금 만들어지는 중입니다. 확정된 사실(공포·공표)과 미정 항목(면제 상한 등)을
        구분해 추적하고, 확정되는 즉시 계산기·스코어카드에 반영합니다. 모든 단계에 출처를 답니다.
      </p>
      {TRACKS.map((t) => (
        <section key={t.key} className="calc-card plc-track">
          <div className="plc-head">
            <h2>{t.title}</h2>
            <p className="plc-sub">{t.sub}</p>
          </div>
          <ol className="plc-steps">
            {t.steps.map((s, i) => (
              <li key={i} className={`plc-step st-${s.state}`}>
                <span className="plc-dot" aria-hidden="true" />
                <div className="plc-body">
                  <div className="plc-row1">
                    <b className="plc-date">{s.date}</b>
                    <span className={`badge plc-state st-${s.state}`}>{STATE_LABEL[s.state]}</span>
                  </div>
                  <div className="plc-label">{s.label}</div>
                  {s.note && <div className="plc-note">{s.note}</div>}
                  {s.src && (
                    <a className="plc-src" href={s.src.url} target="_blank" rel="noreferrer">
                      출처: {s.src.name} ↗
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <p className="plc-impact">▶ {t.impact}</p>
        </section>
      ))}
      <div className="plc-links">
        <Link className="btn" to="/calc">AIDC 면제 시나리오 (계산기)</Link>
        <Link className="btn" to="/?site=36.5,127.8">부지 클릭 → 통과 전망</Link>
        <Link className="btn" to="/dashboard">대시보드 (승인율·본심사)</Link>
      </div>
      <p className="footer-note">
        본 트래커는 공개 보도·공포 사실 기준이며, 법령 원문은 국가법령정보센터에서 확인하세요. 미정 항목(면제 상한 등)은
        확정 전 추정을 싣지 않습니다. 최종 갱신 2026-07-15.
      </p>
    </div>
  )
}
