# wellbian 구조 인포그래픽 — 하나의 원장, 두 개의 순환 (2026-10-21)

서우 「이걸(DePIN 기술 사양 v0.3 Fig 1 · 4계층 아키텍처) wellbian 컬러에 맞게 예쁘게 인포그래픽화 · 개인 링크드인 · X 공유 문안」.

- 산출물: `architecture-{en,ko}.jpg`(1920×1080 · 게시용) · `@2x.jpg`(3840×2160) · `.html`(원본 틀)
- 다시 만들기: `python3 build.py`(node + playwright · Pretendard = `site/event-week/www/fonts`) → PNG 를 만든 뒤 JPEG 92(4:4:4)로 변환 — PNG 는 저장소에 두지 않는다.
- **v2(10/21, 서우 「디자인이 너무 AI 티가 나서 애플 스타일로」)**: 흰 바탕 · 가운데 큰 제목 「One ledger. Two loops. / 원장 하나. 순환 둘.」 · 회색 타일 두 장(공급 · 수요 — 색은 「Supply/Demand · 공급/수요」 두 단어에만: 인디고 `#4D4DCE` · 틸 `#00A991`) · 단계는 글자 + 옅은 → 만 · 아래 검정 타일 「XRP Ledger」 + 네 요소 · 회색 `#F5F5F7` · 글자 `#1D1D1F` · 보조 `#6E6E73`. 뺀 것: 테두리 카드 · 상단 색 띠 · 알약 라벨 · 대문자 키커 · 그라데이션 얼룩 · 화살표 그물. 로고 = `wellbian-nav.svg`(검정으로 칠함). XRP LEDGER 공동 로고는 쓰지 않음(제휴로 읽힘).
- v1(카드 + 화살표 4계층 판)은 v2로 덮어씀 — 정확성 조정 표는 그대로 유효.

## 원본 대비 단순화 · 정확성 조정
| 원본(Fig 1) | 인포그래픽 | 이유 |
|---|---|---|
| 실외 OAQ 노드 | 「다음 라인」 점선 카드 | 실외는 아직 출시 전(기존 홀더 우선 제안) |
| 「기기 서명」 화살표 | 「readings / 측정값」 | 페이로드 서명 검증은 사양상 로드맵(현재 수집 토큰) |
| 집계 · 코호트 · LLM | 「집계는 지금, 코호트 · AI 리포트는 다음」 | 코호트 · 리포트 엔드포인트는 사양상 planned |
| Hot Wallet `rhTTtx8…web1` | 「운영 지갑」 | 공유 이미지에 지갑 주소 0 |
| verify NFT(오라클 → 원장) | 운영 지갑 → NFT 「라이선스 발급」 | NFT 민팅은 Hot 지갑 서명(사양 Step 3) |
| API 경로(/v1/c · /api/data/*) | 뺌 | 공유용 |
| 스마트홈 「RLUSD → WLBN 스왑」 | 「RLUSD 로 결제」 | 결제 통화만 · 스왑은 AMM 카드에 |
하단에 「보상은 정해진 개수이며 가치는 약속하지 않습니다」 고정.

## 게시 문안 — 서우 개인 계정(내부자 발언 = playbook 그대로: 가격 · 수익 · 상장 0)

### 링크드인 — 영문 (1028자)
```
People keep asking how the pieces of wellbian fit together, so here it is on one page.

Two loops, one ledger.

Supply: air-quality sensors run in real rooms. Each device holds a license NFT. Our oracle checks the license and the data quality, then settles a fixed quantity of rewards once a day.

Demand: manufacturers and AI agents pay for data call by call over x402. A request gets a 402, the payment settles on-chain, the gateway verifies it, and the data comes back. No invoices, and no human in the loop.

Both loops meet on the XRP Ledger: device licenses as NFTs, payments in RLUSD, and an AMM for swaps.

Two rules we designed in from the start. Data is de-identified before it is sold, and every aggregate has to clear a k-anonymity gate. And rewards are defined as quantities, never as value.

Our device partner, KWeather, has measured weather in South Korea for 30 years. wellbian is the network built on top of that.

If you work on data licensing, home appliances or agent payments, I'd be glad to compare notes.
```

### 링크드인 — 국문 (553자)
```
웰비안이 어떻게 돌아가는지 묻는 분이 많아서 한 장에 정리했습니다.

하나의 원장, 두 개의 순환입니다.

공급: 실제 방에 놓인 공기질 측정기가 데이터를 보냅니다. 기기마다 라이선스 NFT가 있고, 오라클이 라이선스와 데이터 품질을 확인한 뒤 하루 단위로 정해진 개수의 보상을 정산합니다.

수요: 제조사와 AI 에이전트는 데이터를 호출할 때마다 x402로 값을 냅니다. 요청하면 402가 돌아오고, 온체인 결제가 확정되면 게이트웨이가 확인한 뒤 데이터를 내줍니다. 청구서도, 사람의 개입도 없습니다.

두 순환은 XRP 원장에서 만납니다. 기기 라이선스는 NFT로, 결제는 RLUSD로, 교환은 AMM으로 처리합니다.

처음부터 두 가지 원칙을 설계에 넣었습니다. 데이터는 비식별화한 뒤에만 팔고, 모든 집계는 k-익명성 관문을 통과해야 합니다. 그리고 보상은 가치가 아니라 개수로만 정합니다.

기기 파트너 케이웨더는 30년 동안 한국의 날씨를 측정해 왔고, 웰비안은 그 위에 지은 네트워크입니다.

데이터 라이선싱, 가전, 에이전트 결제 분야에 계신 분들과 이야기 나누고 싶습니다.
```

### X — 영문 (268자 · 상한 280)
```
How wellbian fits together, on one page.

Supply: air sensors in real rooms send readings. An oracle checks license and quality, then settles a fixed quantity once a day.
Demand: manufacturers and AI agents pay per call over x402.

Both loops settle on the XRP Ledger.
```

### X — 국문 (가중 240 · 상한 280)
```
웰비안 구조를 한 장에.

공급: 실제 방의 공기질 측정기가 측정값을 보내고, 오라클이 라이선스와 품질을 확인해 하루 단위로 정해진 개수를 정산합니다.
수요: 제조사와 AI 에이전트가 호출마다 x402로 결제합니다.

두 순환 모두 XRP 원장에서 정산됩니다.
```

주의: 「데이터는 비식별화한 뒤에만 판다 · 모든 집계는 k-익명성 관문」은 **설계 원칙**으로 썼다(사양의 비식별화 파이프라인 · 롤업 규칙). 고객 · 제조사 계약 · MOU 는 언급하지 않는다(사양상 Phase 2 「진행 중」). 「원장 지문」 문장은 IAQ 배치 머클루트 기록 상태가 확인 전이라 넣지 않았다.
