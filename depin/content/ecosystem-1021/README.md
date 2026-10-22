# wellbian 백서 Fig 0 — 3주체 선순환 구조 그래픽 (2026-10-21)

서우 「로고 50% 더 키우고 아래 내용도 동일한 톤앤매너로 생성」 — 백서 「3플랫폼 생태계 구조」(Fig 0. 3주체 선순환 구조 · 3.1~3.3 · 기술 대응) 붙여 넣기.

- 산출물: `ecosystem-{ko,en}.jpg`(1920×1080 · 게시 · 백서 삽입용) · `@2x.jpg`(3840×2160) · `.html`(원본 틀)
- 다시 만들기: `python3 build.py`(node + playwright) → PNG → JPEG 92(4:4:4) 변환은 `../architecture-1021/README.md` 와 같은 명령. PNG 는 저장소에 두지 않는다.
- 톤: 구조 그래픽 v3 그대로 — 짙은 남보라 바탕 + 보라 빛 번짐 · 유리 타일(플랫) · 보라 포인트 · 좌상단 모서리 반짝임(`../architecture-1021/assets/glint-corner.png`) · 로고 165×60.

- **10/21 3차(서우 「빛나는 효과 없애고 · 테두리에 맞춰 · 영문판들만」)**: 모서리 반짝임 이미지 뺌 · 무지갯빛은 좌상단 테두리 선 1px 위에만. 영문만 다시 뽑음(`python3 build.py en`) — 국문은 반짝임 판 그대로.

- **10/21 4차 — 수익화 초점(서우 「이것도 수익화에 초점」)**: 칩 「Whitepaper · Fig 0 · Business model」 · 제목 「Rooms make data. Makers pay for it.」 · 부제 「기여자 측정기 → 원시 측정값 → 허브가 비식별 메타데이터로 → 가전 제조사가 구매 또는 API 구독」 · 「Data fees」 레인을 굵은 흰 글자 + 「Revenue」 칩으로 강조 · 순환선 문구 「Rewards are spent back on appliance discounts and filter subscriptions, so the value stays inside the ecosystem.」 사업 모델 설명이지 계약 · 고객 주장이 아님(칩에 Business model). 영문만 다시 뽑음 — 국문 문구는 build.py 에 맞춰 두었고(「방은 데이터를 만들고, 제조사는 값을 냅니다.」) 렌더는 `python3 build.py ko`.

## 구성

| 자리 | 내용 |
|---|---|
| 위 | 칩 「백서 · Fig 0」 · 제목 「3주체 선순환 구조 / Three parties. One loop.」 · 부제 = 백서 첫 문장(국문은 합니다체로) |
| 타일 3 | 데이터 기여자(DATA PROVIDER) · 플랫폼 허브(PLATFORM HUB, 보라 유리로 강조) · 가전 제조사(DATA CONSUMER) — 그림 원문 항목 + 3.1~3.3 요지 한 줄 + 「기술 대응」 칩(XLS-20 라이선스 NFT · 오라클 배치 머클루트 · 5단계 파이프라인 · x402 데이터 상품) |
| 타일 사이 | 실선 → 원시 측정값 · 정제 메타데이터 / 점선 ← 기여 보상 · 데이터 이용료 |
| 아래 | 점선 순환선(기여자 → 제조사) + 「보상은 가전 구매 할인 · 필터 구독 결제로 재유입되어 생태계 안에서 순환」 · 범례(실선 = 데이터 흐름 · 점선 = 가치 흐름) · 출처 줄(paper.wellbianlabs.io/depin) + 보상 가치 비보장 |

## 원문 대비 조정

- 실외(OAQ) 측정기(3.1) → 「다음 라인」으로 표기 — 구조 그래픽 · 정본과 같은 기준(현재 판매 = 실내).
- 「기여도 기반 리워드」는 그대로 두고, 출처 줄에 「보상은 정해진 개수이며 가치는 약속하지 않습니다」.
- 링크 4개는 그림 안에서 칩 이름으로만(이미지라 클릭 불가) — 출처 줄에 paper.wellbianlabs.io/depin.

## 링크드인 — 영문 (1465자 · 서우 개인 계정 · 10/21 · 연재 1편)

연재 제목 형식: `[Building wellbian · Part N] 소제목` — 서우 「연재 형태로 할 거라 앞에 제목을 대괄호 안에」.

이미지: `ecosystem-en.jpg` 한 장(10/21 — 구조 그래픽은 연재 Part 2 로 분리).

```
[Building wellbian · Part 1] Where the revenue comes from

The question I get most about wellbian isn't how it works. It's who pays.

Short answer: the companies that need to know what indoor air actually does.

Air conditioners, dehumidifiers, purifiers and ventilation systems all live inside homes, offices and shops. The teams designing them want to see how real rooms behave: when humidity climbs, how fast CO₂ builds up, what happens after the window closes.

So the model has three parties.

Contributors install indoor-air sensors and earn rewards by contribution.

The platform hub de-identifies the raw readings and turns them into metadata a product team can use.

Appliance makers buy that data outright or subscribe by API. AI agents and smart-home platforms can pay per call in RLUSD, a dollar stablecoin, settled on the XRP Ledger. We verified that per-call rail on XRPL mainnet in August: request, pay, check on-chain, data back. No invoices.

Every new room adds data worth buying. Every call is paid. That's the business.

Rewards are designed to come back around as appliance discounts and filter subscriptions, so the value stays inside the network.

Two things stay fixed. Data is de-identified before anyone can buy it, and every aggregate has to pass a k-anonymity gate. Rewards are defined as quantities, never as a promised value.

If you build appliances or run R&D on indoor environments, I'd like to hear what room data you wish you had.
```

근거 · 선: 「per-call rail verified on XRPL mainnet in August」 = 정본 §5(2026-08-13 메인넷 검증 5건 중 AI 에이전트 x402 자율 결제). 제조사 계약 · 고객 · MOU 0 — 「the model」로만. 원장 지문(머클루트 기록) 문장 0 — 기록 상태 확인 전. 보상 → 가전 할인 · 필터 구독은 「designed to」(현재 기능인지 미확인). 가격 · 상장 · WLBN 언급 0 · 보상 = 개수, 가치 비보장.

## X — 영문 (서우 개인 계정 · 연재 1편 · 상한 280)

이미지: `ecosystem-en.jpg` 한 장(구조 그래픽은 Part 2).

**A (추천 · 가중 277)**
```
[Building wellbian · Part 1] Who pays?

The model: appliance makers who want to see how real rooms behave. They buy de-identified indoor-air data or subscribe by API. AI agents pay per call in RLUSD on the XRP Ledger, no invoices.

Every new room adds data. Every call is paid.
```

**B (링크드인과 같은 소제목 · 가중 248)**
```
[Building wellbian · Part 1] Where the revenue comes from

Sensors in real rooms → de-identified air data → appliance makers buy it or subscribe by API. Agents pay per call in RLUSD, settled on XRPL.

Every new room adds data. Every call is paid.
```

「The model:」 · 화살표 흐름 = 사업 모델 설명(계약 · 고객 주장 아님). 보상 재유입 · 원장 지문 · 가격 · WLBN 0.

### X 타래 — A 원글 아래 답글 2개 (10/21, 서우 「타래 댓글로 2개 더」)

**② 왜 사는가 (가중 267)**
```
Why would a maker pay? ACs, dehumidifiers, purifiers and ventilation all run in real rooms. Their teams want to know when humidity climbs, how fast CO₂ builds after the window closes, what PM does while dinner cooks.

If you build appliances, what would you measure?
```

**③ 깨끗하게 · 돈이 도는 길 (가중 271)**
```
How it stays clean: data is de-identified before it's sold, and every aggregate must pass a k-anonymity gate.

How the money moves: request, 402, pay in RLUSD, check on-chain, data back. Verified on XRPL mainnet in August.

Rewards are quantities, never a promised value.
```

근거: ③ 「Verified on XRPL mainnet in August」 = 정본 §5 메인넷 검증(x402 자율 결제). 비식별 · k-익명 관문 = 설계 원칙. 이미지는 ①에만.

## 확인 필요(서우)

- **「보상 → 가전 구매 할인 · 필터 구독 결제 재유입」은 지금 되는 기능인가, 계획인가.** 백서 원문 그대로 넣었다. 아직 계획이면 SNS 게시 전에 「설계」 · 「예정」 표기(미공표 · 미확정 기능을 현재형으로 말하지 않는다 — playbook).
## 세로 9:16 — 하늘 · 에칭 · 건물판 (10/22, 서우 「앞서 연재했던 2개 이미지도 위 구름과 해는 동일, 아이콘이랑 하단부는 다른 이미지로 — 세로 이미지만」)

- 하늘(구름 사이 금빛)은 3편과 같은 그림(`../ai-factory-1021/assets/light-9x16.jpg`, 불투명도 .66 · 아래는 남보라로 덮음) · 로고 · 제목 · 부제 그림자 · 부제 밝게.
- 아이콘은 에칭 선화(Higgsfield, 라벤더 · 투명 배경 · 불투명도 .38 — 3편과 같은 옅기) · 오른쪽 아래 건물은 이 편 전용 회화풍 그림(배경 지우고 가장자리 깎아 흐림 · .62 · 칸 유리 뒤 배경층이라 위쪽은 흐리게 비친다).
- 1편은 세로판이 처음 — 세 칸을 위아래로 쌓고 칸 사이에 실선 ↓(원시 측정값 · 정제 메타데이터) · 점선 ↑(기여 보상 · 데이터 이용료 + 「Revenue」) · 순환 한 줄은 반투명 유리 상자 + 점선 순환 아이콘. 아이콘: 기여자 = 집 · 사무실 · 측정기(`assets/etch-contrib.png`), 허브 = 방패 · 자물쇠 큐브 + 노드(`etch-hub.png`), 제조사 = 에어컨 · 공기청정기 · 제습기(`etch-makers.png`) · 건물 = 불 켜진 주택 · 상점(`assets/homes.png`). `python3 build.py en-9x16`.
- **10/22 서우 「1 · 2 건물을 현대화 — 너무 올드해」**: 1편 건물 → 평지붕 · 유리 외벽 주택 둘 + 유리 사무실 + 모서리 카페(`assets/homes.png` 교체, 상자 540×250). Higgsfield 2장(4크레딧) · 같은 배경 지우기 · 가장자리 깎아 흐림.

