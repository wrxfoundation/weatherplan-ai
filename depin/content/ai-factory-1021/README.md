# 연재 Part 3 — Weather AI Factory (2026-10-21)

서우 「기존 백서도 체크해서 이걸 3편으로 제작」 — 브랜드 원글(@wellbianlabs 「Weather AI Factory」 · 인포그래픽) 바탕.

- 산출물: `ai-factory-en.jpg`(1920×1080) · `ai-factory-en-9x16.jpg`(1080×1920, 모바일) · 각 `@2x.jpg` · `.html`(원본 틀).
- 다시 만들기: `python3 build.py`(en · en-9x16) → PNG → JPEG 92(4:4:4)는 `../architecture-1021/README.md` 와 같은 명령. CSS · 아이콘 · 로고는 `../architecture-1021/build.py` 를 import 해서 같은 톤.
- 구성: 칩 「Wellbian AI · AI factory」 · 제목 「Data in. Intelligence out.」 · 입력(방 안 측정기 · 케이웨더 30년 관측 · 예보 자료 · 172개 도시 날씨) → 정제(수집 → 정리 → 구조화 → 생성 4단계 · 날씨 AI 모델 · B300 GPU 추론) → 출력(60일 초지역 예보 에이전트 「Live · demo」 · 추론 API 「Coming」 · 산업 패키지 「Coming」) · 「How it earns」 띠 · 토큰 뜻 한 줄 · 출처 줄.

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

## 링크드인 — 영문 (1362자 · 서우 개인 계정 · 연재 3편)

이미지: 가로 `ai-factory-en.jpg` 또는 모바일 세로 `ai-factory-en-9x16.jpg` 한 장.

```
[Building wellbian · Part 3] What the AI factory makes

Part 1 was who pays. Part 2 was how the money moves. Part 3 is what we build on top of the data.

"AI factory" is a term from the GPU world: a data center built to produce intelligence, not just to store files. Ours runs weather AI models on B300 GPU inference.

What goes in: readings from sensors in real rooms, KWeather's 30 years of observation and forecast data, and city weather for 172 cities, each value a consensus of eleven weather feeds.

What happens inside: the raw data is collected, cleaned of bad and missing readings, structured for the models, and turned into output.

What comes out: indexes, forecasts and agents. The first is live today, a 60-day hyper-local forecast agent that answers with a decision for your plans and shows the evidence only when you ask. It's free during the demo. An inference API and industry packages for energy, construction, retail and the public sector come next.

A note on the word "tokens". In AI-factory language, tokens are what a model produces when it answers. They are model output, not WLBN.

Why this matters for the business: one dataset, two things to sell. The data itself, by the call, and what the models make of it.

If you plan around weather in energy, construction or retail, I'd like to hear the first question you'd ask a weather agent.
```

## X — 원글 + 타래 답글 2 (가중 256 · 270 · 192)

```
[Building wellbian · Part 3] What the AI factory makes

In: readings from real rooms, 30 years of KWeather data, city weather for 172 cities.
Out: indexes, forecasts and agents.

The first is live: a 60-day hyper-local forecast agent, free during the demo.
```
```
Inside the factory: collect the raw data, clean out bad and missing readings, structure it for the models, generate the output. Weather AI models on B300 GPU inference.

Next: an inference API and industry packages for energy, construction, retail and the public sector.
```
```
On the word "tokens": in AI-factory language it means what a model produces when it answers. Model output, not WLBN.

One dataset, two things to sell: the data, and what the models make of it.
```

게시 전: 인용 · 원글은 계정당 1일 1건 — 오늘 개인 계정에 이미 올렸으면 내일. 원글엔 세로판, 피드 미리보기에서 잘리면 가로판을 원글 · 세로판을 답글 1에.
