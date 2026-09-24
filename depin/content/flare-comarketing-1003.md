# Flare 10월 공동 마케팅 계획 — 요청·일정·확인할 것 (받음 9/24)

> 출처: Ami(Flare)가 텔레그램으로 공유한 「[Ext] KWeather/ Wellbian <> Flare Co-marketing Plan」(9/24, 4쪽) + 구글 문서 검토 요청.
> 한글 번역본은 채팅 첨부(저장소 밖 — Flare 문안 초안 전문은 옮기지 않는다). **Flare 미공개 계획 — 대외 언급 0.**
> 받는 사람: 이창민 본부장 · 서우(Logan). Flare 데브렐 계정 담당도 개발자 계정 문안을 올릴 예정.

## Ami 의 요청 셋 (휴가 뒤 책상에 돌아오면)

1. 계획과 항목 확정
2. Flare 메인 계정 스레드 · Hugo 키노트 대본에 코멘트
3. **10/3 에 발표하는지, 몇 시인지** 확정

**마감**: 모든 문안 피드백 **9/29(화)**(제안) → 최종본 **10/1(목)** 확정.

## 일정 (6개, 10/3 XRP Seoul 중심)

| 날짜 | 항목 | 승인 | 상태 |
|---|---|---|---|
| 10/2 | 비공개 오찬 — Flare 한국 생태계 파트너들과(초대: Flare APAC) | Flare BD | 초대장 발송 |
| 10/3 | **웰비안 발표 + XRP Seoul 세션** | 웰비안 | **확인 요청** |
| 10/3 | Hugo 키노트 안 케이웨더 슬라이드 2장(FCC 부분 뒤, 35초+25초) | Hugo·Flare 데브렐·웰비안 | 검토 중 |
| 10/3 | Flare 메인 X 스레드 — **웰비안 발표 뒤** 게시 | Flare 마케팅·웰비안 | 검토 중 |
| 10/4 | Flare devs X 스레드 — 아키텍처·FCC 경로 | Flare 데브렐·웰비안 | 초안 |
| 10/12 | Flare 유튜브 업데이트에 소개(녹화 전 대본 공유) | Flare 마케팅 | 초안 |

원칙(원문 강조): **Flare 스레드는 웰비안 자체 발표가 올라간 뒤 — 소식은 웰비안에게서 먼저.**

## 「함께 지키는 선」 — 우리 문안도 이것에 맞춘다

| 상태 | 말하는 것 |
|---|---|
| 메인넷 가동 | 매시간 스냅샷 해시 → **Flare 메인넷 SnapshotAnchor** · 11개 출처·167개 도시·매시간 · 판정 → Flare 메인넷 DeterminationRegistry(weathermarket.ai/docs) · **구독료 = 네이티브 XRP, 가격은 FTSO XRP/USD** |
| 시험 중 | FCC 기밀 레이어 — Coston2 구축·시험. 「live on FCC」「running on FCC」 금지 |
| 미구축 | 블라인드 정산 배포 · 파라메트릭 보험 지급 · FCC 메인넷 일정 언급 0 |

## ⚠ 9/22 문서·우리 글과 달라진 것 — 기술팀(KJ) 확인 필요

Flare 문서에 따르면 **9/23 부터 가동 시스템이 FDC 를 거치지 않는다.** 9/22 「Weather as Settlement Infrastructure」와 비교하면:

| | 9/22 문서 | 9/24 Flare 계획서 |
|---|---|---|
| 지문(앵커) | XRPL 1드롭 송금 메모 → FDC 가 Flare 에서 증명 | **Flare 메인넷 SnapshotAnchor 에 직접 기록** |
| 구독 결제 | XRPL **RLUSD** | XRPL **네이티브 XRP**(FTSO XRP/USD 가격) |
| FDC | 앵커 증명 경로 | **쓰지 않음(9/23~)** |

→ **9/24 게시한 서우 링크드인 글 세 문장이 새 선과 어긋난다**(`linkedin-0924-settlement-oracle.md` 「게시 뒤」에 수정안).
KJ 확인 전에는 고치지 않는다 — 확인되면 그 수정안으로 편집.

## 코멘트 초안 (서우·이창민 본부장 검토용)

- **Hugo 대본 「one of Korea's leading weather data companies」** → 검증되는 숫자로: `a Korean weather company with 30 years of observation, serving 4,000+ enterprise clients`
  (「최대·1위」류를 쓰지 않는 우리 원칙, 기관 청중에겐 숫자가 더 무겁다).
- **「In July … signed an LOI」** — 우리 기록은 LOI **공개 9/5**. 체결 월이 7월이 맞는지 내부 확인.
- **결제 통화 XRP(FTSO 가격)** — RLUSD 에서 바뀐 것이 맞는지 KJ 확인(위 표).
- **개발자 스레드 날짜** — 제목 「Oct 3」 ↔ 본문·일정표 「4 Oct」. 10/4 로 맞추자고 요청.
- **「Reference repo: [link to confirm]」** — 공개할 저장소 링크를 우리가 줄지, 줄을 뺄지 결정.
- 「Weather Data Market, the official oracle of KWeather」 — weathermarket.ai 푸터 문구와 같다. 그대로 둔다.

## 10/3 발표 시각 — 정할 때의 논리

- 우리 키노트 **14:50~15:05**(9/23 Eri 미팅 기록). **Hugo 키노트 시각을 Ami 에게 먼저 받는다.**
- 「웰비안이 먼저」 원칙이 서려면 **우리 발표가 Hugo 슬라이드·Flare 스레드보다 앞서야 한다** → 발표 시각 = Hugo 키노트와 우리 키노트 중 **이른 쪽의 30분 전 이상**.
- 결정은 Kurt 대표·이창민 본부장.

## 우리 쪽 규칙 — 10/3 전에 바꿔야 할 것

`depin/CLAUDE.md` 「웰비안 × Flare 직접 통합 클레임 금지」는 10/3 공동 발표와 정면으로 부딪힌다(9/23 미팅 기록에서 이미 「확인 대기」).
제안 문장: **「측정기는 Flare 에 없다. Weather Data Market(케이웨더 공식 오라클)이 매시간 Flare 메인넷에 기록·판정한다 — 이 문장으로만.
FCC 는 시험 중, 보험 지급은 미구축.」** — 서우 확인 후 반영.

## 팀 카톡 보고본 (9/24, 번역본 PDF 와 함께 — 서우 발송용)

```
[대외] Flare 10월 공동 마케팅 계획 — 검토 요청 (한글 번역본 첨부)

■ 무엇
Flare Ami가 저희가 보낸 문서(Weather as Settlement Infrastructure)를 바탕으로
KBW·XRP Seoul 주간 공동 마케팅 계획을 보내왔습니다.
"스토리가 명확하다"며 이걸로 KBW 자료를 만들겠다고 합니다.

■ 일정 (10/2~10/12, 6개)
- 10/2 비공개 오찬 — Flare 한국 생태계 파트너들과 (초대장 발송됨)
- 10/3 웰비안 발표 + XRP Seoul 세션 ← 저희 확인 필요
- 10/3 Hugo(Flare CEO) 키노트에 케이웨더 슬라이드 2장 (약 1분)
- 10/3 Flare 메인 X 스레드 — 저희 발표 뒤 게시
- 10/4 Flare 개발자 X 스레드 (아키텍처·FCC)
- 10/12 Flare 유튜브 업데이트 영상에 소개
※ 소식은 저희가 먼저 내고 Flare가 뒤따르는 구조입니다.

■ Ami 요청 — 피드백 9/29(화)까지, 최종 확정 10/1(목)
1. 계획·항목 확정
2. Flare 메인 스레드·Hugo 대본 코멘트 (개발자 계정 문안도 추가 예정)
3. 10/3 발표 여부와 시각

■ 먼저 확인 부탁드립니다 (KJ님)
계획서에는 "9/23부터 FDC를 쓰지 않고, 기록은 Flare 메인넷에 직접,
구독료는 RLUSD가 아니라 XRP(가격은 FTSO)"라고 적혀 있습니다.
9/22 저희 문서와 다른 부분이라, 맞다면 대외 문구(제 링크드인 포함)를 여기에 맞춰 고치겠습니다.

■ 정해 주셔야 할 것
1. 10/3 발표 시각 — 저희 키노트는 14:50입니다.
   Hugo 키노트 시각을 Ami에게 받아서, 둘 중 이른 쪽보다 앞서 발표가 나가야 합니다.
2. 개발자 스레드에 넣을 "레퍼런스 저장소" 링크를 공개할지

■ 코멘트 초안 (제가 정리해 두었습니다)
- Hugo 대본의 "한국의 선도적 날씨 기업 중 하나" → "30년 관측·기업 고객 4,000곳 이상"처럼 확인되는 숫자로
- "7월 LOI 체결" 표기 확인 (대외 공개는 9/5)
- 개발자 스레드 날짜가 10/3·10/4로 섞여 있어 10/4로 통일 요청
```
Ami 메시지 번역은 채팅으로만 전달(상대 메시지 원문은 저장소에 두지 않는다 — 요청 셋은 위 「Ami 의 요청 셋」).

## Ami 에게 짧은 회신 (9/24 초안 — 서우 발송용, 발송 여부는 서우 통보 시 갱신)

```
Thanks Ami, and thanks for the kind wishes!
We'll go through the plan with the team and come back with our comments and the Oct 3 announcement timing by Tue 29 Sep.
One thing that would help us set the time: when is Hugo's keynote slot on the 3rd?
```
- 마감(9/29 화)을 우리 입으로 받아 준다 — 연휴 중에도 일정은 지킨다는 신호.
- 질문 하나만: **Hugo 키노트 시각** — 10/3 발표 시각을 정하는 데 필요한 유일한 외부 정보(위 「10/3 발표 시각」).
- 계획 내용에 대한 평가는 아직 하지 않는다(검토 전 동의로 읽히지 않게) · 팀 복귀 날짜도 약속하지 않는다.

## 그룹 경과 (9/24 저녁)

- **20:09 서우 → Ami 회신 발송**(위 초안 그대로, 서우 통보). Hugo 키노트 시각 답 대기.
- **20:42 「디지털사업」 계정 → Flare 측 5명 태그 메시지**(요지, 원문 저장소 비기재):
  계획에 전면 동의 · **실제 XRP 결제와 Flare 체인 앵커 기록까지 전체 흐름 완료** · 우리 날씨 데이터로 만든 예측시장·보험 상품
  **시뮬레이션 페이지** 완성(링크 `weathermarket.io`) · 규제 문제로 실거래는 안 하고 **가상 USDT** 로 동작 · 「Weather Fi」 ·
  「XRP 생태계 안에서 Flare 와 함께 기존 DeFi 를 넘는 날씨 금융의 시작」.

**판정 — 짚을 것 넷**
1. **구조 변경이 우리 팀 입으로 확인됐다**(실제 XRP 결제 · Flare 앵커). → 링크드인 글 수정안(`linkedin-0924-settlement-oracle.md`)은
   KJ 확인을 기다리지 않고 **지금 적용해도 된다** — 수정안 문장은 XRPL 앵커가 병행되든 아니든 틀리지 않는다.
2. **도메인 `weathermarket.io` ↔ `weathermarket.ai`** — Flare 문안은 전부 `weathermarket.ai/docs`. 오타면 Flare 가 잘못된 주소를
   옮겨 쓸 수 있다(남의 도메인일 위험까지). **어느 쪽이 맞는지 확인**, 오타면 그룹에 한 줄 정정. (이 환경에선 두 도메인 모두 프록시 403 — 확인 불가, 재시도 안 함.)
3. **「I absolutely agree」** — Flare 는 계획 전체 승인으로 읽을 수 있다. 9/29 코멘트는 반대가 아니라 **다듬기**(표현·날짜·링크)로 보낸다.
4. **예측시장 시뮬레이션(가상 USDT, 규제로 실거래 불가)** — Flare 의 「함께 지키는 선」에는 없다. **10/3 공개 문구에 넣지 않거나,
   넣으면 「시뮬레이션·가상 자산」을 명시**. 코스닥 상장사 + 예측시장 조합은 규제 질문을 부른다 — 대외 노출 전 법무 확인.

## WeatherMarket.io 문서에서 확인한 사실 (9/24 밤, 서우가 화면·Docs 전문 붙여 넣음)

- **도메인 정리**: `weathermarket.io` = **시뮬레이터**(예측시장·파라메트릭 보험, 가상 sUSDT, 「SIMULATION · VIRTUAL SUSDT ONLY」) ·
  `weathermarket.ai` = **오라클(Weather Data Market)**. 디지털사업 계정 링크는 오타가 아니었다 — Flare 문안의 `.ai/docs` 도 맞다.
- **앵커**: 각 실행을 직렬화·SHA-256 → **Flare 메인넷 SnapshotAnchor = 9/23 부터 기록의 정본**. 그 전 실행은 BNB 체인 1세대 앵커도 있다. (XRPL 앵커 언급 없음.)
- **피드**: 도시당 매시간 **11개 = 직접 3(KWeather · METAR · MET Norway) + Open-Meteo 경유 8** → 지표별 합의값(중앙값 + MAD 이상치 제거, 파라미터는 비공개).
  ⚠ **「eleven independent sources」 표현 재검토** — 8개가 한 API(Open-Meteo)를 거친다. 「11 feeds」가 문서와 같은 말이다(1촌 인사 기본값 문구, 서우 결정 대기).
- **검증 등급**: verified · single_source · mixed · mismatch · unverified. 정산 가능 여부는 오라클이 판단. 판정 = met / not met / withheld(보류 → 무효·환불).
- **정산 신뢰도**: 공식 정산 첫날, 기준선(최근 70%) 위 도시는 판정의 29% 보류, 아래 도시는 56~59% 보류(문서 기재). 화면: 39/167 도시가 안정적으로 정산.
- **요금(공개 문서)**: metered 호출당 0.04 USD, 구독 도시당 25 USD/30일·200 USD/년 — **XRP 결제**.
- **주체**: 데이터 제공 = KWeather Co., Ltd. · **오라클 플랫폼·시뮬레이터 운영 = Wellbian Labs Pte. Ltd.(케이웨더 위임)** — Eri 의 구조 질문 회신에 쓸 수 있는 공개 문장.
- 시뮬레이터 푸터: 「한국 도박 관련 법상 허가가 필요한 활동을 허가 없이 운영하는 것은 금지된다. 이 시뮬레이터는 실제 돈을 쓰지 않는다」 — 대외 노출 시 이 선을 벗어나지 않는다.

