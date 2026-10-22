# 연재 Part 3 — Weather AI Factory (2026-10-21)

서우 「기존 백서도 체크해서 이걸 3편으로 제작」 — 브랜드 원글(@wellbianlabs 「Weather AI Factory」 · 인포그래픽) 바탕.

- 산출물: `ai-factory-en.jpg`(1920×1080) · `ai-factory-en-9x16.jpg`(1080×1920, 모바일) · 각 `@2x.jpg` · `.html`(원본 틀).
- 다시 만들기: `python3 build.py`(en · en-9x16) → PNG → JPEG 92(4:4:4)는 `../architecture-1021/README.md` 와 같은 명령. CSS · 아이콘 · 로고는 `../architecture-1021/build.py` 를 import 해서 같은 톤.
- 구성: 칩 「Wellbian AI · AI factory」 · 제목 「Same data. Sold twice.」(10/21 2차 — 수익 각도) · 입력(방 안 측정기 · 케이웨더 30년 관측 · 예보 자료 · 172개 도시 날씨) → 정제(수집 → 정리 → 구조화 → 생성 4단계 · 날씨 AI 모델 · B300 GPU 추론) → 출력(60일 초지역 예보 에이전트 「Live · demo」 · 추론 API 「Coming」 · 산업 패키지 「Coming」) · 「Revenue」 띠(데이터 호출 · 에이전트 요금제(출시 뒤) · 추론 API · 산업 패키지) · 토큰 뜻 한 줄 · 출처 줄.

- **10/21 2차(서우 「로고 30% 더 키워 · 수익성 기반으로 카피」)**: 로고 165×60 → 215×78(세로판 143×52 → 186×68) · 제목 「Same data. Sold twice.」 · 부제 「먼저 검증 데이터로 호출마다, 다음엔 AI 팩토리가 정제한 지능으로」 · 띠 「Revenue」로 네 줄. 추론 API 는 단가 · 과금 방식이 공개되지 않아 「by the call」을 붙이지 않았다(데이터 호출만 「by the call」 — 2편 x402). 1차 카피 「Data in. Intelligence out.」은 버림.

- **10/21 3차(서우 「큰 테이블 우측 상단에 큰 svg 일러스트 라인 아이콘」)**: 타일마다 우상단 라인 일러스트(120 그리드 · `ILLUS`) — 입력 = 해 · 구름 · 빗방울 · 측정기 → 점선 → 데이터베이스, 정제 = 지구 네트워크 · 번개 → GPU 칩, 출력 = 해 · 구름 · 반짝임 + 상승 꺾은선. 가로 140px · 세로 150px. 제목 칸(`.hd`)에 일러스트 높이만큼 자리를 둬 첫 줄 글자와 안 겹치게(세로판은 정제 타일만 — 2열이라 오른쪽 글자가 닿음). 토큰 연상(떠다니는 큐브)은 넣지 않았다.

- **10/21 4차(서우 「AI factory 는 건물처럼 · weather intelligence 는 더 인텔리전스스럽게 — 뇌 형태 · 날씨」)**: 정제 일러스트 = 톱니 지붕 공장동 + 냉각 팬 서버 동 + 정면 GPU 칩 · 문, 위로 구름(데이터 · 점선)과 번개(전력). 출력 일러스트 = 뇌 — 왼쪽 반구는 회로 선 · 노드(생각), 오른쪽 반구는 해 · 구름 · 비(날씨), 가운데 고랑, 오른쪽 위 반짝임.

- **10/21 5차(서우 「최상단에서 메인 카피까지 내려오는 햇살」)**: 배경층에 위 가운데에서 퍼지는 빛줄기(`.rays` — 불규칙한 원뿔 그라데이션 · 살짝 흐림 · 아래로 갈수록 옅게, 제목 줄에서 약 40% 남김) + 위 가운데 은은한 빛 번짐(`.sunglow`). 글자 위로는 올라오지 않는다.

- **10/22 6차(서우 「너무 인위적인 조명 — 황금빛으로 · 방사형 말고 창문으로 들어오는 햇살처럼」)**: 5차 방사형 빛줄기(`.rays`)를 걷어내고, 위 왼쪽에서 비스듬히 내려와 메인 카피에 닿는 **평행한 금빛 띠 넷**(`.shafts` — 창살 사이 간격처럼 폭 · 밝기가 다름 · 크게 흐림 · 아래로 갈수록 옅게) + 위 왼쪽 금빛 번짐(`.sunglow`).

- **10/22 7차(서우 「이것도 인위적 — 마니에리스모 화풍처럼 위에서 내려오는 풍부한 광량의 자연스러운 햇살」)**: CSS 로 그린 빛을 버리고 Higgsfield(nano_banana_2, 2크레딧씩 · 16:9 두 장 중 하나 + 9:16 한 장)로 **구름 사이로 금빛이 쏟아지는 회화풍 배경**을 만들어 깔았다(`assets/light-16x9.jpg` · `light-9x16.jpg`, 작업 ID 80c4bb0f… · 09ce1a6d…). 아래쪽은 남보라로 덮어(`.paintfade`) 타일 글씨를 지키고, 로고 · 제목 · 부제에 옅은 그림자 · 칩은 어두운 유리 바탕으로 가독성 확보. 사람 · 천사 · 건물 없는 하늘만.

- **10/22 8차(서우 「질감 좋은데 효과 20% 정도만 약화」)**: 회화풍 배경 불투명도 .82 → .66.

- **10/22 9차(서우 「LIVE DEMO 나 COMING 칩은 제거」)**: 출력 타일 상태 칩 셋과 출처 줄의 「Live = … Coming = …」 설명을 뺐다. 그림에서 상태 구분은 사라졌으므로 **상태(에이전트만 지금 · 나머지는 다음)는 게시 문안이 맡는다** — 링크드인 「Coming next」 · X 답글 1 「coming」 은 그대로 둔다.

- **10/22 10차(서우 「우측 하단에 과하지 않게 AI 데이터센터 건물」)**: 같은 회화풍으로 Higgsfield 두 장(4크레딧, 작업 ID 5c61b65c… · 1a182cc3…) 중 땅에 낮게 앉은 쪽을 잘라(`assets/datacenter.jpg`) 오른쪽 아래 모서리에 — 지붕 가장자리에 금빛, 몸체는 실루엣, 가장자리는 둥글게 흐려 바탕에 녹임. 띠 · 각주 글씨 아래 · 오른쪽 빈 자리에만(세로판은 내용을 위로 30px 붙여 자리 확보). 첫 시도(밝은 부분만 보이게 섞기)는 건물이 안 보이고 세로판 각주에 걸려 버림.

- **10/22 11차(서우 「아래 사진도 약화 · 하늘로 디지털 정보를 쏘는 듯한 효과」 + 참고 이미지 — 지구에서 솟는 점 기둥)**: 건물 불투명도 .92 → .68. 지붕에서 위로 솟는 점선 기둥(`streams()` — SVG, 점선 34줄 + 가는 실선 9줄, 가운데가 촘촘하고 키가 큼, 금빛 → 라벤더로 옅어짐, 고정 seed). 기둥은 배경층이라 출력 타일 유리 뒤에서는 흐리게 보인다. 세로판은 띠 · 각주 줄 높이에서 기둥을 옅게(마스크) + 각주 · 토큰 줄에 어두운 테두리 그림자.

## 백서 대조 (Company whitepaper v1.0 초안 2026-09-28 · wellbianai.io, 10/21 열람)

| 원글 · 그림 | 백서 · 사이트 | 3편에서 |
|---|---|---|
| Weather Big Data → AI Models → GPU → Weather Intelligence Tokens | 백서 §2 3층(수집 → 정제 = AI 팩토리: 지수 · 예보 · 에이전트 → 경제) · §4 AI Infra: B300 GPU 추론 · 추론 API · 예보 · 에이전트 상품 · 이용권 NFT(순수 유틸리티) · B2C 60일 초지역 예보 에이전트 · 쓰임 에너지 · 건설 · 유통 · 공공 | 그대로. 4단계 이름은 wellbianai.io 「What is an AI factory?」(Raw data mining → Filtering & cleaning → Tokenization & formatting → Intelligence generation)를 쉬운 말로 |
| 「produce Weather Intelligence Tokens」 · 「valuable」 · 「Weather data becomes an asset」 | wellbianai.io: AI 팩토리는 원유를 정제하듯 「고부가 intelligence tokens」를 만드는 데이터센터 = 모델 산출물 | 크립토 청중은 토큰 = WLBN 으로 읽는다 → 그림 · 글에 **「모델 산출물이지 WLBN 이 아니다」** 한 줄. 「valuable」 · 「asset」은 쓰지 않음 |
| 「collected around the world」 | 측정기는 한국 실내 · 전 세계 부분은 172개 도시 합의값(외부 날씨 피드) | 입력 셋을 따로 적어 과장 없이 |
| 상태 표기 없음 | wellbianai.io: 에이전트 **Live(데모 · 무료, 정식 출시 뒤 유료)** · 추론 API · 상품 목록 **Coming** | 「Live · demo」 / 「Coming」 칩. 「How it earns」의 에이전트 요금은 「after launch」 |
| — | 백서 「167개 도시 · 90개국」(9/28 초안) vs 사이트 첫 화면 172 · 91(10/8) | 172 사용. **백서 숫자 갱신 필요**(사이트 쪽 전달) |
| — | 백서 §4 이용권 NFT · B2C 에이전트 「WLBN 보유자 대상」 | 이용권 · WLBN 보유자 조건은 3편에 넣지 않음(매일 적립 상품 권유로 번지지 않게 — 넣을지는 서우 판단) |

넣지 않은 것: 이용권 · 적립 · 가격(에이전트 요금 · API 단가) · GPU 대수 · 위치 · 운영 주체 · NVIDIA(케이웨더 Earth-2 예보 상품과 섞지 않는다) · 「valuable」 · 「asset」.

## 링크드인 — 영문 (1240자 · 서우 개인 계정 · 연재 3편 · 10/21 2차 수익 각도)

이미지: 가로 `ai-factory-en.jpg` 또는 모바일 세로 `ai-factory-en-9x16.jpg` 한 장.

```
[Building wellbian · Part 3] Same data, sold twice

Part 1 was who pays. Part 2 was how a call becomes revenue. Part 3 is the second revenue line, built on the same data.

The first line sells verified data by the call. The second refines that data into something people pay for directly: indexes, forecasts and agents. That's the job of our AI factory, weather AI models running on B300 GPU inference.

What goes in: readings from sensors in real rooms, KWeather's 30 years of observation and forecast data, and city weather for 172 cities, each value a consensus of eleven weather feeds.

What comes out, and how it's sold:
· A 60-day hyper-local forecast agent. Live today, free during the demo, with paid plans after launch.
· An inference API for indexes, forecasts and risk indexes. Coming next.
· Industry packages for energy, construction, retail and the public sector. Coming next.

Every new room feeds both lines: more data to sell, and more for the models to learn from.

A note on the word "tokens". In AI-factory language, tokens are what a model produces when it answers. They are model output, not WLBN.

If you buy forecasts for energy, construction or retail, I'd like to hear the first question you'd ask a weather agent.
```

## X — 원글 + 타래 답글 2 (가중 263 · 232 · 212)

```
[Building wellbian · Part 3] Same data, sold twice

Line one: verified data, by the call.
Line two: our AI factory refines the same data, with 30 years of KWeather data, into indexes, forecasts and agents.

First product live: a 60-day hyper-local forecast agent.
```
```
How line two is sold:
· Forecast agent: free during the demo, paid plans after launch
· Inference API for indexes, forecasts and risk indexes: coming
· Industry packages for energy, construction, retail and the public sector: coming
```
```
Inside: weather AI models on B300 GPU inference, fed by sensors in real rooms and city weather for 172 cities.

Every new room feeds both lines.

On "tokens": in AI-factory language that's model output. Not WLBN.
```

게시 전: 원글(인용 포함)은 계정당 1일 1건 — 오늘 개인 계정에 이미 올렸으면 내일. 원글엔 세로판, 피드 미리보기에서 잘리면 가로판을 원글 · 세로판을 답글 1에.
근거 · 선: 「paid plans after launch」 = wellbianai.io 「Free during the demo; paid plans follow the official launch」 · API · 패키지 = 「Coming」 · 가격 · 단가 · 이용권 · 적립 0 · 「sold twice」는 사업 모델 문장(2편 「Every call is revenue」와 같은 결)이지 매출 실적 주장이 아님.
