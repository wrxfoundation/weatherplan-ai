// 절차 온톨로지(경량) — 로드맵 프로세스 프레임(RoadmapPage NODES)의 미러.
// 용어 온톨로지 맵의 '절차 레이어'용 최소 필드(id·title·basis). RoadmapPage 수정 시 함께 갱신할 것.
// 간선은 basis(공개 근거 문자열)가 실제로 해당 법령을 언급할 때만 생성(정직).
export const PROCESS_NODES = [
  { id: 'P01', title: '부지·용도지역 검토', basis: 'vworld 용도지역·토지이음 · KOSIS/부동산원 지가' },
  { id: 'P02', title: '수전전압 트랙 산정', basis: '한전 기본공급약관 제23조' },
  { id: 'P03', title: '네트워크·백본 검토', basis: '공개 통신 인프라(근사·검증 대기)' },
  { id: 'P04', title: '리스크 스크리닝', basis: '홍수위험지도 · SGIS 인구격자 · 재난안전 재해연보' },
  { id: 'P05', title: '부지·건축 인허가', basis: '국토계획법·건축법·지자체 조례' },
  { id: 'P06', title: '환경영향평가', basis: '환경영향평가법' },
  { id: 'P07', title: '한전 접속 신청', basis: '한전 기본공급약관 제23조' },
  { id: 'P08', title: '계통영향평가 심의', basis: '기후에너지환경부 공고 제2025-139호 · 분산에너지법 · AIDC 특별법' },
  { id: 'P09', title: '송·변전 확충', basis: '한전 송변전 건설 정보공개 플랫폼' },
  { id: 'P10', title: '발전 조달', basis: '발전사업 허가대장 · EPSIS' },
  { id: 'P11', title: '금융·투자 조달', basis: '사업자 공시(DART)' },
  { id: 'P12', title: '냉각·용수 설계', basis: 'OCP 공개 기술자료 · 기상청 공공' },
  { id: 'P13', title: '착공·건설', basis: 'AIDC 특별법 통합창구·타임아웃제' },
  { id: 'P14', title: '준공·사용승인', basis: 'AIDC 특별법 · 지자체 인허가(건축법 사용승인)' },
  { id: 'P15', title: '운영(PUE·RE100)', basis: '사업자 공시(DART) · KDCC/KEEI' },
]
