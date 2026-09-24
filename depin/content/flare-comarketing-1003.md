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
