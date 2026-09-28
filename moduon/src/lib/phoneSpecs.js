// ─── 휴대폰 제품 정보(설명) — 단일 소스 ───────────────────────────────────
// 판매자 설계 화면 상단(제로노트식 제품 정보)과 고객 상세의 제품 정보가 전부 여기서 읽는다.
// 기종 목록·가격은 phones.js, 설명은 여기 — 기종을 추가하면 두 곳을 같이 채운다(데이터 검사가 빠진 칸을 잡는다).
//
// [원칙] 확인된 값만 넣는다. 모르는 칸은 비워 두면 화면이 '—' 로 보여 준다.
//   틀린 사양은 빈칸보다 나쁘다 — 고객 안내·표시광고 문제로 번진다. 추측으로 채우지 않는다.
//   verified 'zeronote' : 운영팀이 보낸 제로노트 화면 그대로 옮김(글자 하나 바꾸지 않음)
//            'official' : 제조사 공개 사양(삼성닷컴·애플·뉴스룸)을 검색으로 교차 확인
//   근거·확인 필요 목록은 docs/PHONE_SPECS.md
//
// 표기는 제로노트를 따른다 — 제원은 세로×가로×두께(mm), 여러 줄은 '\n'.

export const SPEC_KEYS = [
  { key: 'cpu', label: 'CPU' },
  { key: 'display', label: '디스플레이' },
  { key: 'screen', label: '화면' },
  { key: 'camera', label: '카메라' },
  { key: 'ram', label: 'RAM' },
  { key: 'storage', label: '내장메모리' }, // 값은 고른 용량 — 데이터에 두지 않는다
  { key: 'body', label: '제원' },
  { key: 'battery', label: '배터리' },
]

export const ATTR_KEYS = [
  { key: 'pay', label: '간편결제' },
  { key: 'ip', label: '방수방진' },
  { key: 'finger', label: '지문인식' },
  { key: 'wireless', label: '무선충전' },
  { key: 'film', label: '필름부착' },
  { key: 'sd', label: '외장메모리' },
  { key: 'sim', label: 'USIM' },
]

// 삼성 국내 모델 공통 구성품(제로노트 폴드8 표기)
const BOX_SAMSUNG = '간단설명서, CtoC케이블, 유심삽입용 핀 등'
const BOX_APPLE = 'USB-C 충전 케이블(1m), 설명서'

export const PHONE_SPECS = {
  fold8: {
    verified: 'zeronote', form: 'fold',
    model: 'SM-F971NK', os: '안드로이드 17', released: '2026-08-07',
    line: '스냅드래곤 8 Elite 5세대 · 7.6" · 12GB · 4,800mAh',
    spec: {
      cpu: '갤럭시용 스냅드래곤 8 Elite 5세대 (4.74GHz+3.6GHz, Octa-Core)',
      display: '메인 Dynamic AMOLED 2X, 커버 Dynamic AMOLED 2X',
      screen: '7.6인치\n5.5인치(접었을때)',
      camera: '전면메인 1,000만 + 커버 1,000만 / 후면메인 5,000만 + 초광각 5,000만',
      ram: { '256GB': '12GB', '512GB': '12GB', '1TB': '16GB' }, // 1TB 는 16GB(삼성 출고가 발표)
      body: '123.9X161.4X4.5mm\n201g',
      battery: '4,800mAh\n(C타입)',
    },
    attrs: { pay: '삼성월렛', ip: 'IP48', finger: '온스크린', wireless: '지원', film: '미부착', sd: '미지원', sim: '나노+eSIM' },
    features: [
      [
        '갤럭시용 스냅드래곤 8 Elite 5세대 맞춤형 AP, NPU·GPU·CPU 성능 향상',
        '레이 트레이싱, mDNIe로 그래픽·화질 강화',
        '4,800mAh + 30분 만에 63% 고속충전, 영상 최대 26시간',
        'Now brief(맞춤 브리핑)·포토 어시스트 Galaxy AI, One UI 9 플렉스윈도우',
        'IP48 등급의 방수,방진 기능, 삼성케어 플러스, 삼성덱스, 삼성 헬스, 삼성 월렛 지원',
        { text: 'AI 기능 요약', sub: [
          'Now nudge : 그룹채팅·장소 검색 등 흐름 속에서 맥락 제안, 펼치면 분할화면으로 사진 공유·지도 저장 연결 (16개 언어)',
          '포토 어시스트 : 텍스트 프롬프트 기반 AI 사진 편집, 메인 화면에서 원본/편집본 비교 (41개 언어)',
          '마이 팬캠 : 촬영 후 AI가 특정 인물 중심으로 자동 편집, 화면비 선택 후 바로 공유',
          'AI 자동 줌 : 플렉스모드에서 AI가 피사체를 감지해 단체 사진 구도 자동 확대/축소',
          '온디바이스 AI · Personal Data Engine : 데이터 기기 내 처리·암호화(KEEP·Knox Vault), 기기/클라우드 처리 선택',
        ] },
      ],
      [
        '완전히 새로워진 디자인, 세계에서 가장 가벼운 북(book)형 폴더블',
        '커버 10:16(숏폼) + 메인 4:3(영상), 3,000nits, 반사방지',
        '갤럭시 폴드 사상 가장 평평하게 펼쳐짐, 펼침 4.5mm',
        '플렉스 티타늄·아머 알루미늄·아머 플렉스힌지, 코닝 세라믹3·빅터스2, IP48',
        '제원 : 접었을 때 123.9×81.9×9.7mm, 펼쳤을 때 123.9×161.4×4.5mm, 무게 : 201g',
      ],
      [
        '5천만 화소 듀얼(광각 F1.8 + 초광각 F1.9) 매끄러운 화각 전환',
        '8K 영상 + ProVisual Engine 나이토그래피(야간)',
        '듀얼 레코딩(18:16 유지)로 두 시점 동시 촬영',
        'AI 편집(포토 어시스트·마이 팬캠) · 8K@30fps',
      ],
    ],
    box: BOX_SAMSUNG,
  },

  flip8: {
    verified: 'official', form: 'flip',
    model: 'SM-F776NK', os: '안드로이드 17', released: '2026-08-07',
    line: '엑시노스 2600 · 6.9" · 12GB · 4,300mAh',
    spec: {
      cpu: '엑시노스 2600',
      display: '메인 Dynamic AMOLED 2X, 커버 Super AMOLED',
      screen: '6.9인치\n4.1인치(커버)',
      camera: '전면 1,000만 / 후면메인 5,000만 + 초광각 1,200만',
      ram: '12GB',
      body: '166.9X75.4X6.1mm(펼침)\n180g',
      battery: '4,300mAh\n(C타입)',
    },
    attrs: { pay: '삼성월렛', ip: 'IP48', wireless: '지원', sd: '미지원', sim: '나노+eSIM' },
    features: [
      [
        '갤럭시 Z 플립 사상 가장 얇고 가벼운 모델 — 펼침 6.1mm · 180g',
        '4.1인치 플렉스윈도우 커버 화면 (최대 120Hz)',
        '안드로이드 17 기본 탑재',
        '12GB LPDDR5X 메모리 · UFS 4.0 저장장치',
      ],
    ],
    box: BOX_SAMSUNG,
  },

  s26u: {
    verified: 'official', form: 'bar',
    model: 'SM-S948NK', os: '안드로이드 16', released: '2026-03-11',
    line: '스냅드래곤 8 Elite 5세대 · 6.9" · 2억 화소 · 5,000mAh',
    spec: {
      cpu: '갤럭시용 스냅드래곤 8 Elite 5세대 (4.74GHz+3.6GHz, Octa-Core)',
      display: 'Dynamic AMOLED 2X',
      screen: '6.9인치',
      camera: '전면 1,200만 / 후면메인 2억 + 초광각 5,000만 + 망원 5,000만(5배) + 1,000만(3배)',
      ram: { '256GB': '12GB', '512GB': '12GB', '1TB': '16GB' },
      body: '163.6X78.1X7.9mm\n214g',
      battery: '5,000mAh\n(C타입)',
    },
    attrs: { pay: '삼성월렛', ip: 'IP68', finger: '온스크린', wireless: '지원', sd: '미지원', sim: '나노+eSIM' },
    features: [
      [
        'S펜 내장',
        '프라이버시 디스플레이 — 측면 시야각을 물리적으로 제한',
        '2억 화소 광각 F1.4 조리개 — 전작 대비 수광량 약 47% 개선',
        '초고속 충전 3.0 — 30분 만에 약 75% 충전',
      ],
    ],
    box: BOX_SAMSUNG,
  },

  s26: {
    verified: 'official', form: 'bar',
    model: 'SM-S942NK', os: '안드로이드 16', released: '2026-03-11',
    line: '엑시노스 2600 · 6.3" · 12GB · 4,300mAh',
    spec: {
      cpu: '엑시노스 2600',
      display: 'Dynamic AMOLED 2X',
      screen: '6.3인치',
      camera: '전면 1,200만 / 후면 트리플(메인 5,000만)',
      ram: '12GB',
      body: '149.6X71.7X7.2mm\n167g',
      battery: '4,300mAh\n(C타입)',
    },
    attrs: { pay: '삼성월렛', ip: 'IP68', finger: '온스크린', wireless: '지원', sd: '미지원', sim: '나노+eSIM' },
    features: [
      [
        '6.3인치 콤팩트 플래그십 · 167g',
        '국내 모델 엑시노스 2600 탑재',
        '12GB 메모리 · 256GB / 512GB',
      ],
    ],
    box: BOX_SAMSUNG,
  },

  a56: {
    verified: 'official', form: 'bar',
    model: null, os: null, released: null,
    note: '국내 판매명 갤럭시 퀀텀6 — SK텔레콤 전용 모델',
    line: '엑시노스 1580 · 6.7" · 8GB · 5,000mAh',
    spec: {
      cpu: '엑시노스 1580',
      display: 'Super AMOLED (120Hz)',
      screen: '6.7인치',
      camera: '전면 1,200만 / 후면메인 5,000만 + 초광각 1,200만 + 접사 500만',
      ram: '8GB',
      body: '162.2X77.5X7.4mm\n198g',
      battery: '5,000mAh\n(C타입)',
    },
    attrs: { pay: '삼성월렛', ip: 'IP67' },
    features: [
      [
        '45W 초고속 충전',
        '6.7인치 120Hz 대화면',
      ],
    ],
    box: BOX_SAMSUNG,
  },

  ip17p: {
    verified: 'official', form: 'bar',
    model: null, os: 'iOS 26', released: '2025-09-19',
    line: 'A19 Pro · 6.3" ProMotion · 4,800만 트리플',
    spec: {
      cpu: 'A19 Pro (6코어 CPU, 6코어 GPU)',
      display: 'Super Retina XDR (ProMotion, 상시표시형)',
      screen: '6.3인치',
      camera: '전면 1,800만 / 후면 4,800만 트리플(메인·초광각·망원 4배)',
      ram: '비공개',
      body: '150.0X71.9X8.75mm\n206g',
      battery: '동영상 재생 최대 31시간\n(USB-C)',
    },
    attrs: { pay: 'Apple Pay', ip: 'IP68', finger: '미지원(Face ID)', wireless: '지원(MagSafe)', sd: '미지원', sim: '나노+eSIM' },
    features: [
      [
        'A19 Pro 칩 · 알루미늄 유니바디 · 베이퍼 챔버 냉각',
        '4,800만 화소 망원 — 최대 8배 광학 품질 줌',
        '1,800만 화소 센터 스테이지 전면 카메라',
        '전면 세라믹 실드 2',
      ],
    ],
    box: BOX_APPLE,
  },

  ip17pm: {
    verified: 'official', form: 'bar',
    model: null, os: 'iOS 26', released: '2025-09-19',
    line: 'A19 Pro · 6.9" ProMotion · 최장 배터리',
    spec: {
      cpu: 'A19 Pro (6코어 CPU, 6코어 GPU)',
      display: 'Super Retina XDR (ProMotion, 상시표시형)',
      screen: '6.9인치',
      camera: '전면 1,800만 / 후면 4,800만 트리플(메인·초광각·망원 4배)',
      ram: '비공개',
      body: '163.4X78.0X8.75mm\n233g',
      battery: '동영상 재생 최대 37시간\n(USB-C)',
    },
    attrs: { pay: 'Apple Pay', ip: 'IP68', finger: '미지원(Face ID)', wireless: '지원(MagSafe)', sd: '미지원', sim: '나노+eSIM' },
    features: [
      [
        'A19 Pro 칩 · 알루미늄 유니바디 · 베이퍼 챔버 냉각',
        '4,800만 화소 망원 — 최대 8배 광학 품질 줌',
        '1,800만 화소 센터 스테이지 전면 카메라',
        '아이폰 사상 가장 긴 배터리 사용 시간',
      ],
    ],
    box: BOX_APPLE,
  },

  ip17: {
    verified: 'official', form: 'bar',
    model: null, os: 'iOS 26', released: '2025-09-19',
    line: 'A19 · 6.3" ProMotion · 4,800만 듀얼',
    spec: {
      cpu: 'A19 (6코어 CPU, 5코어 GPU)',
      display: 'Super Retina XDR (ProMotion, 상시표시형)',
      screen: '6.3인치',
      camera: '전면 1,800만 / 후면 4,800만 듀얼(메인·초광각)',
      ram: '비공개',
      body: '149.6X71.5X7.95mm\n177g',
      battery: '동영상 재생 최대 30시간\n(USB-C)',
    },
    attrs: { pay: 'Apple Pay', ip: 'IP68', finger: '미지원(Face ID)', wireless: '지원(MagSafe)', sd: '미지원', sim: '나노+eSIM' },
    features: [
      [
        '기본 모델 최초 ProMotion 120Hz · 상시표시형 디스플레이',
        '4,800만 화소 듀얼 퓨전 카메라(메인·초광각)',
        '1,800만 화소 센터 스테이지 전면 카메라',
        '전면 세라믹 실드 2',
      ],
    ],
    box: BOX_APPLE,
  },
}

const EMPTY = { verified: null, form: 'bar', model: null, os: null, released: null, line: '', spec: {}, attrs: {}, features: [], box: null }
export const phoneSpec = (id) => PHONE_SPECS[id] ?? EMPTY
export const specLine = (id) => PHONE_SPECS[id]?.line ?? ''

// 한 칸의 표시값 — 내장메모리는 고른 용량, RAM 은 용량별 값이 있으면 그 용량 것. 없으면 null(화면이 '—').
export function specValue(spec, key, storage) {
  if (key === 'storage') return storage ?? null
  const v = spec?.spec?.[key]
  if (v && typeof v === 'object') return v[storage] ?? null
  return v ?? null
}
