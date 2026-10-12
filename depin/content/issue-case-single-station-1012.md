# 이슈 케이스 — 허리케인 · 태풍 때 「관측소 하나」 정산 문제 (카톡 보고본, 2026-10-12)

> 서우 요청 「단일 관측소 문제로 허리케인이나 태풍 때로 이슈 케이스 — 카톡 보고 형태」 + Artemis 기사 링크.
> 근거는 웹 검색 요약(원문 미열람 — Artemis · CFTC 는 이 환경에서 열리지 않음). 사례 수치는 외부 인용 전 원문 1회 확인.
> 「큰 허리케인 때 공항 관측소가 꺼진다」는 IBKR 설명글 문장은 검색 요약 한 건뿐이라 쓰지 않고, 확인된 실제 사례로 대신했다.

```
[보고] 이슈 케이스 — 허리케인·태풍 때 「관측소 하나」로 정산하면 생기는 문제 (10/12)

1) 요약
- 미국 증권사 인터랙티브 브로커스의 예측시장 ForecastEx가 허리케인 돌풍 계약의 정산 데이터를 관측소 값이 아니라 기상위험 모델링 회사 Reask의 계산값으로 받기로 했습니다 (재보험 전문지 Artemis 보도, 10/8 무렵)
- 계약 예: 「허리케인 Isaias가 플로리다 펜서콜라에 시속 70마일(약 31m/s) 이상 돌풍을 일으킬까?」 — 70마일부터 10마일 단위
- 정산값: 기준점 반경 10km 안 1km 격자들의 최대 3초 돌풍. 미국 허리케인센터 최종 발표 뒤 36시간 안에 확정
- 의미: 미국 규제 예측시장에서 「관측소 한 곳」 대신 「여러 지점을 계산한 값」으로 정산하는 사례가 나왔습니다. 우리가 말해 온 「한 지점이 아니라 여러 출처의 합의값」과 같은 방향입니다

2) 왜 관측소 하나가 문제인가 — 실제 사례
- 2017 허리케인 어마: 마이애미 기상청 관할 8곳 관측 장비가 고장 또는 기능 상실, 멜버른 관측소는 이틀간 풍속을 기록하지 못함
- 2008 열대폭풍 구스타브: 미시시피 내치즈 공항 관측 장비가 정전으로 멈춤. 마지막 기록 43마일(약 19m/s), 실제 최대는 65~70마일(약 29~31m/s)로 추정
- 2019 허리케인 도리안: 캐나다 뉴펀들랜드 공항에서 시속 112km 기록 직후 풍속계 고장
- 연구: 1998~2004년 미국 상륙 사례에서 열대폭풍급 바람이 시작될 때 지상 관측소의 약 25%가 보고를 못 함
- 2024 허리케인 헬렌: 미국 기상청 보고서 스스로 「지점 관측이 최댓값을 잡았을 가능성은 낮다」고 적음
- 태풍: 2013 하이옌 때 필리핀 동부 도플러 레이더가 파괴돼 감시 공백 (국내 관측소 사례는 이번 검색에서 확인하지 못함)
- 평상시: 2026년 4월 파리 샤를드골 공항 센서 이상 수치 — 폴리마켓 기온 시장이 그 센서 하나로 정산되던 중이라 프랑스 기상청이 경찰에 수사 의뢰
→ 바람이 셀수록 관측소는 꺼지거나 최댓값을 놓치고, 정산이 걸린 센서 하나는 조작 표적이 됩니다. 돈이 걸린 순간에 값이 가장 불확실해지는 구조입니다

3) 우리에게 주는 의미
- 태풍은 아시아의 허리케인입니다. 같은 문제가 그대로 있습니다
- 우리 데이터는 172개 도시 · 91개국, 11개 날씨 피드의 합의값, 모든 입력값 공개 원장 기록, 판정은 「충족 · 미충족 · 판정 보류」 셋입니다. 관측이 무너진 날 억지로 값을 내지 않는 「판정 보류」가 이 문제에 대한 우리 답입니다
- 뉴욕 미팅(10/24~29) 대화 소재: 「큰 바람 때 관측소가 꺼지면 정산은 어떻게 하나」 — 이번 사례가 근거가 됩니다
- Reask는 선례이자 경쟁 상대입니다. 지금 확인된 범위는 미국 허리케인뿐이고, 태풍 · 아시아는 확인되지 않았습니다

4) 주의
- 기사 원문은 이 환경에서 열리지 않아 검색 요약 기준입니다. 수치는 외부 인용 전에 원문을 한 번 확인하겠습니다
- 대외 문구에서는 다른 플랫폼 이름 · 파리 공항 사건명 · 「최초」를 쓰지 않고, 예측시장 쪽에는 한국 · 일본 도시를 넣지 않습니다
- 「공항 관측소는 큰 허리케인 때 자주 꺼진다」는 문장은 확인이 안 돼 쓰지 않았습니다 (위 실제 사례로 대체)

5) 다음 할 일
- 예측시장 영문 소개 문단에 한 줄 추가 검토: 「Big storms are when single stations most often go offline or miss the peak gust, which is exactly when the settlement number matters most.」
- 케이웨더에 국내 태풍 때 관측 공백 · 장비 장애 기록이 있는지 확인 요청 (공개 가능한 범위)
- Reask의 태풍 · 아시아 범위 확인

출처: https://www.artemis.bm/news/reask-to-provide-settlement-data-for-interactive-brokers-forecastex-live-hurricane-contracts/
```

## 사례 출처 (검색 요약)

- ForecastEx × Reask: Artemis(위 링크) · IBKR Campus 「Live Hurricane Wind Gust Prediction Markets at ForecastEx」 · 「Hurricane Isaias and ForecastEx's Live Hurricane Wind Gust Contracts」 · ForecastEx CFTC 규칙 · 상품 제출(정산값 정의 · 36시간)
- Irma 2017: Palm Beach Post 2017-10-22 「As Irma raged, faulty gauges took no data」
- Gustav 2008: Natchez Democrat 2008-09-07 「Weather monitoring loses power at Natchez-Adams Airport」
- Dorian 2019: The Telegram(St. John's) 2019-09-10
- 25% 연구: 「Attrition of Ground Weather Observations during Hurricane Landfall」(1998~2004)
- Helene 2024: NWS Jacksonville PSH 요약
- Haiyan 2013: Philstar 2013-11-14 「Doppler radar also destroyed」
- 파리 CDG 2026-04: Bloomberg 2026-04-23 「France Probes Weather Data Tampering After Surge in Polymarket Bets」
