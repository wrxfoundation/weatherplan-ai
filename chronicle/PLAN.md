# 크로니클 19 — 시간해자 빌드 스펙 v4 (최종 동결판, Claude Code 핸드오프용)

> 원리: **오늘 기록하지 않으면 영원히 살 수 없는 것에 크론을 걸고, 해시체인으로 "먼저·진짜로 기록했다"를 증명한다.**
> v4 변경: 글로벌 2종 추가(#18~19), 2종은 기존 카드에 흡수, 4종 신규 탈락. **19에서 동결 — 이후 추가는 기존 어댑터 자리가 잡힌 뒤에만.**
> 이 문서를 리포에 `PLAN.md`로 넣고 Claude Code에게 읽히는 용도.

---

## 0. 공통 아키텍처 — "19개 프로젝트"가 아니라 "1개 엔진 + 19개 어댑터"

```
chronicle/                      # 공개 모노리포 (public = Actions 무료 + 커밋체인 공증)
├── engine/                     # fetch → normalize → diff → hash → commit → publish
│   ├── fetch.ts                # HTTP/API 호출, 재시도, rate limit
│   ├── diff.ts                 # 이전 스냅샷 대비 변경 감지 (record-level)
│   ├── integrity.ts            # SHA-256 체인: prev_hash + content_hash → chain_hash
│   └── publish.ts              # latest.json / changes.jsonl / feed.xml 생성
├── sources/<id>/               # config.yml + adapter.ts
├── data/<id>/                  # snapshots/ + changes.jsonl + latest.json + integrity.json
└── .github/workflows/<id>.yml  # 소스별 cron
```

**산출물 계약**: `changes.jsonl` 한 줄 = `{observed_at, entity_id, field, before, after, source_url, content_hash, chain_hash}`. 원칙: 원본 보존 / diff 필수 커밋 / append-only / 삭제도 이벤트.

**어댑터 3계열** (인터페이스 공유가 구현 효율의 핵심):
- **API 레코드형**: #4 #5 #7 #9 #13 #18 (JSON 레코드 diff)
- **페이지 텍스트형**: #11 #14 #17 (텍스트 추출 diff)
- **파일/프로브형**: #16 #19 (경량 파일·헤더 수집)

---

## 1. 전체 요약표 — 코어 13 + 글로벌 6

| # | 프로젝트 | 축적물 | 소스 | 주기 | 아날로그 | 트랙 | 시급도 |
|---|---|---|---|---|---|---|---|
| 1 | LLM 한국팩트 타임캡슐 (+행동 배터리 +리더보드 스냅샷) | 모델 응답·행동·리더보드 상태 | 각 LLM API + LMArena 등 | 월 1회+ | Elias / CARFAX | 코어 | ★★★★★ |
| 2 | 정비사업 단계 크로니클 | 1,472구역 단계·고시 변경 | 정비몽땅·부산 | 주 1회 | CoStar | 코어 | ★★★★☆ |
| 3 | 용도지역 변경 원장 | 용도지역·거래허가 diff | vworld/토지이음 | 주 1회 | CoStar | 코어 | ★★★☆☆ |
| 4 | 청약·분양가 박제 | 공고 전문·분양가·경쟁률 | 청약홈 API | 일 1회 | Zillow 이력 | 코어 | ★★★★★ |
| 5 | 실거래 취소·정정 원장 | 취소/정정 전후 이력 | 국토부 API | 일 1회 | CARFAX | 코어 | ★★★☆☆ |
| 6 | 예보 채점 아카이브 (한국 니치) | 예보 박제+실측 대조 | 기상청+ASOS | 3시간/일 | ForecastWatch | 코어 | ★★★☆☆ |
| 7 | 상권 생멸 크로니클 | 인허가·폐업 일변동 | localdata.go.kr | 일 1회 | SafeGraph | 코어 | ★★★☆☆ |
| 8 | K-콘텐츠 성과 시계열 | 일별 조회수/구독자 | YouTube API | 일 1회 | Social Blade | 코어 | ★★☆☆☆ |
| 9 | 국회 입법 diff | 의안 조문·상태 변경 | 열린국회정보 API | 일 1회 | FiscalNote | 코어 | ★★☆☆☆ |
| 10 | MCP 생태계 센서스 | 서버·스키마 변경 | MCP 레지스트리 | 주 1회 | Web of Science | 코어 | ★★★☆☆ |
| 11 | 기관 전망 채점 | 전망 박제+사후 채점 | KB·건산연·한은 | 발표 시 | CXO Guru Grades | 코어 | ★★★★☆ |
| 12 | 공공데이터포털 diff | 데이터셋 변경·삭제 원장 | data.go.kr 메타 | 일 1회 | EDGI | 코어·인프라 | ★★★★☆ |
| 13 | 워크넷 채용 관측소 | 공고·직무·임금 | 고용24 API | 일 1회 | LinkUp/Revelio | 코어 | ★★★☆☆ |
| 14 | AI 벤더 원장 (+시스템프롬프트 +모델 라이프사이클) | 가격·정책·모델카드·폐기일정 diff | 벤더 공개 페이지 | 주 1회 | CamelCamelCamel+NewsDiffs | 글로벌 | ★★★★★ |
| 15 | 컴퓨트 가격 지수 | GPU 렌탈·스팟 시계열 | Lambda·Vast+AWS 스팟 API | 일 1회 | SemiAnalysis | 글로벌 | ★★★★☆ |
| 16 | Agent-Web 동의 센서스 | robots.txt·llms.txt 스냅샷 | 상위 도메인(Tranco) | 일 1회 | Data Provenance Init. | 글로벌 | ★★★★★ |
| 17 | 기업 약속 diff | ESG·DEI 페이지 변경 | S&P500+글로벌 | 주 1회 | NewsDiffs+ESG평가사 | 글로벌 | ★★★☆☆ |
| **18** | **AI 랩 채용 원장** | AI사 공고 전문·직무·지역 | Greenhouse/Lever/Ashby 공개 보드 API | 일 1회 | LinkUp(헤지펀드 판매 실존) | **글로벌** | ★★★★☆ |
| **19** | **에이전트 커머스 센서스** | x402·AP2·ACP 채택 신호 | 도메인 프로브+발표 레지스트리 | 주 1회 | (제네시스 — 최초 센서스) | **글로벌** | ★★★★★ |

---

## 2. 스펙 카드 — 코어 트랙 (#1~13)

### #1 LLM 한국팩트 타임캡슐 — `llm-korea-capsule` (v4 확장)
- 고정 질문셋 300문항(KoreaAPI 그라운드트루스) + 행동 배터리 100프롬프트 → 매달 모델 4~6개 호출, raw+채점 해시 봉인. **v4 추가: LMArena·HELM 등 리더보드 상태 월간 스냅샷** (같은 크론, "The Leaderboard Illusion"이 지적한 조용한 폐기의 기록자가 됨). 폐기 모델은 재측정 불가. 수익화: 연구 인용→미디어→KoreaAPI 세일즈. 토큰 월 $30~120. 홀드아웃 100문항 비공개 유지.

### #2 정비사업 단계 크로니클 — `redev-chronicle`
- 정비몽땅+부산 구역별 추진단계·고시일 주간 스냅샷, 전이 이벤트화. 1,472구역 지도가 시드. 수익화: 재개발 책→소요기간 리포트→B2B. 확인: 서울 열린데이터광장 API 존부.

### #3 용도지역 변경 원장 — `zoning-ledger`
- vworld 파이프라인 재활용, 1단계는 거래허가구역+정비구역 지정/해제. 수익화: 개발 시그널 알림. 리스크: 폴리곤 용량.

### #4 청약·분양가 박제 — `bunyang-capsule`
- 청약홈 API 일간 폴링, 공고 전문·타입별 분양가 즉시 박제. 소멸 최속, ToS 클린. Week 1 첫 어댑터.

### #5 실거래 취소·정정 원장 — `deal-audit-ledger`
- 국토부 API 일간 diff, 취소(2021~)·정정 전후 감사가능 원장. 아실은 표시만. 수익화: 이상거래 리포트→저널리즘.

### #6 예보 채점 — `forecast-scorecard` (한국 니치 고정, 글로벌 확장 금지 — 탈락 12번)
- 기상청 단기예보 박제+ASOS 대조, 리드타임별 적중률. KWeather 데이터 금지, 공공 API만.

### #7 상권 생멸 — `sangwon-chronicle`
- localdata.go.kr 일변동→주소 단위 개업·폐업 계보→"자리의 저주" DB.

### #8 K-콘텐츠 성과 — `kcontent-pulse`
- YouTube API 일별 축적 (Social Blade 모델). ★30일 보존 약관 확인 후 착수.

### #9 국회 입법 diff — `bill-diff`
- 열린국회정보 API, 키워드 필터→조문 diff→주간 규제 인텔. FiscalNote 모델.

### #10 MCP 센서스 — `mcp-census`
- 레지스트리+GitHub 스키마 해시 주간 diff. #16·#19와 "에이전트 웹 관측소" 축.

### #11 기관 전망 채점 — `forecast-graders`
- KB·건산연·주산연·한은 전망 박제→분기 채점→연간 성적표. 기관 공식 보고서만. 7월 시즌 = 지금 착수.

### #12 공공데이터포털 diff — `datago-watch` (인프라 보험)
- data.go.kr 메타 일간 diff. 상품(삭제 원장)+감시탑(내 소스 조기경보) 이중 역할. Week 2 조기 가동.

### #13 워크넷 채용 관측소 — `jobs-observatory`
- 고용24 공식 API로 공고 박제. LinkUp·Revelio 검증 모델. #18과 어댑터 패밀리 공유.

---

## 3. 스펙 카드 — 글로벌 트랙 (#14~19)

### #14 AI 벤더 원장 — `ai-vendor-ledger` (v4 확장)
- 벤더 10여 곳 × 페이지: pricing / rate limits / usage policy / model card **+ v4 흡수: 폐기 일정 페이지(모델 라이프사이클 DB의 원료) + 공식 공개 시스템 프롬프트(Anthropic 릴리즈노트 등)**. 주간 텍스트 diff. The Intercept의 OpenAI "군사" 문구 삭제 포착이 가치 증명 — 체계적 원장은 부재. 수익화: "Cost of Intelligence Index" 정본화 → FinOps 알림 구독 → 저널리즘. 라이프사이클 테이블은 #1 벤치 캡슐의 척추를 겸함.

### #15 컴퓨트 가격 지수 — `compute-price-index`
- GPU 렌탈가(Lambda·RunPod·Vast·CoreWeave) + AWS 스팟(공식 API, **90일치만 제공 → 그 너머 곡선은 아카이버 소유**). SemiAnalysis가 유료로 증명한 인텔의 공개 지수판. #14와 "AI 경제 원장" 브랜드.

### #16 Agent-Web 동의 센서스 — `consent-census`
- Tranco 상위 1만~5만 도메인의 robots.txt+llms.txt 일간 스냅샷. "Consent in Crisis"(MIT 주도)가 Wayback으로 힘겹게 재구성한 역사의 전향적 정본. 법적 최청정(robots.txt 페치 = 용도 그 자체), 저장 ~0. AI 크롤러(GPTBot·ClaudeBot·CCBot) 차단/허용 diff → 월간 "웹의 동의 지형".

### #17 기업 약속 diff — `commitments-watch`
- S&P500+글로벌 ESG·DEI·정책 페이지 주간 텍스트 diff. DEI 삭제 보도 러시가 근거 — 기자의 수동 Wayback 대조를 원장화. 수익화: 저널리즘→ESG 리서치 B2B.

### #18 AI 랩 채용 원장 — `ai-jobs-ledger` ★v4 신규
- **한 줄**: OpenAI·Anthropic·DeepMind·xAI·Mistral 등 AI 기업 50~100곳의 채용공고를 일간 박제 — 직무·팀 신설·지역·요건. "AI 인재 전쟁"의 원장.
- **소급불가 근거**: 공고는 마감 즉시 소멸. "2026년에 어느 랩이 어떤 팀을 어디에 꾸렸나"는 지금 찍은 자만 소유 — 그리고 랩의 채용은 제품 발표 6~12개월 전의 전략 신호(저널리스트들이 이미 공고에서 특종을 캐는 이유).
- **왜 ToS 클린**: Greenhouse(`boards-api.greenhouse.io`)·Lever(`api.lever.co/v0/postings`)·Ashby의 **공개 잡보드 API는 공식적으로 열려 있음** — 스크레이핑이 아니라 공식 엔드포인트.
- **검증 아날로그**: LinkUp — 채용공고 데이터를 기관투자자에게 파는 실존 비즈니스. Revelio Labs 동일.
- **MVP**: 대상사 화이트리스트 50곳 → 보드 API 일간 수집 → 신규/마감 이벤트 + 팀·지역 태깅(Claude) → 월간 "AI Talent Radar".
- **수익화**: 뉴스레터/미디어 인용 → 투자자·리크루터 B2B. **#13과 같은 어댑터 계열(잡보드 API형)이라 구현 한계비용 최소.** 6~12개월.
- **비용**: 토큰 월 ~$10. **리스크**: 일부 랩의 자체 채용 시스템(어댑터 추가), 커버리지는 보드 API 사용사 중심.

### #19 에이전트 커머스 센서스 — `agent-commerce-census` ★v4 신규, 제네시스 창
- **한 줄**: x402(Coinbase)·AP2(Google)·ACP(OpenAI/Stripe) 등 에이전트 결제·커머스 표준의 채택 신호를 주간 센서스 — HTTP 402 응답·`/.well-known/` 매니페스트·공식 발표 통합 레지스트리.
- **소급불가 근거**: **표준들이 2025년에 막 태어남 — 지금 시작하면 채택 곡선을 제네시스부터 완전 보유.** 파도가 커진 뒤엔 "처음부터의 기록"을 아무도 소급 생성 못 함. 19개 중 유일하게 "0일차부터"가 가능한 창.
- **검증 아날로그 대신**: 최초 센서스라 아날로그가 없음 — 그 자체가 포지션(에이전트 커머스의 Elias 자리 선점).
- **MVP**: #16의 크롤 루프에 피기백(같은 도메인 순회에 402/매니페스트 프로브 추가 = **한계비용 사실상 0**) + 발표 기반 통합 레지스트리 수동 큐레이션 → 분기 "Agentic Commerce Adoption Report".
- **수익화**: 이 곡선은 파도가 오면 모두가 인용할 단 하나의 차트 → 그 전까지는 KoreaAPI.dev(x402+ERC-8004 스택)의 시장 조기경보 레이더. **서우가 베팅한 파도를 서우가 계측하는 구조.**
- **비용**: ~$0. **리스크**: 표준 자체가 사멸 → 그래도 "사멸의 기록"은 남고, 베팅 철회 신호로 기능(옵션 관리 비용 절감).

---

## 4. 의도적 탈락·유예 명단 v4

기존 1~14 유지(카히스토리·지지옥션·arXiv·커머스 스크레이핑·링크로트 전체판·차트 diff·앱순위·개인 전망·항공 마일리지·예측시장 온체인·JustWatch·ForecastWatch 글로벌·중국 통계·국내 B급 4종) + v4 신규:

15. **AI 크롤러 행동 관측소(허니팟)** → Cloudflare Radar가 전 세계 트래픽 관측점으로 이미 공개. **현직자의 관측 우위(vantage) 앞에서는 축적 경쟁 불가.**
16. **IMF·Fed 전망/성명 diff** → IMF는 WEO 빈티지를, Fed는 성명 전문을 스스로 아카이브 + WSJ 성명 diff 툴 실존. **원천이 이력을 보존하면 탈락** — 이 테스트의 교과서 사례.
17. **HuggingFace 라이선스/모델카드 diff** → HF 리포는 git이라 이력이 원천에 보존. 삭제 리포 포착만 남는데 니치가 좁음.
18. **프리랜서 단가 관측(Upwork 등)** → 커머스 플랫폼 ToS. 4번과 동일 규율.

**탈락 테스트 3종 정리**: ① 과거를 돈으로 살 수 있는가(온체인) ② 원천이 이력을 보존하는가(IMF·Fed·HF·arXiv) ③ 현직자가 시간 또는 관측점에서 이기고 있는가(지지옥션·JustWatch·Cloudflare) — 하나라도 Yes면 탈락.

---

## 5. 착수 로드맵 v4

**Week 1**: 엔진+해시체인 → #4 청약 → #1 캡슐 1회차 → #2 정비사업
**Week 2**: #12 공공데이터 diff(감시탑) → #11 전망 채점(7월 시즌) → #5 실거래
**Week 3~4**: **#14 AI 벤더 원장(글로벌 개시)** → #6 예보 → #3 용도지역
**Month 2**: #16+#19 동시(같은 크롤 루프) + #10(관측소 3종 완성), #15 컴퓨트, #13 워크넷 → **#18 AI 랩 채용(#13 직후 — 어댑터 계열 공유)**, #7 상권
**Month 3+**: #9 입법, #17 기업 약속, #8(약관 확인 후)

**v4로 동결.** 이후 추가 검토는 코어 크론 10개 이상이 30일 무사고 가동된 뒤에만.

---

## 6. Claude Code 첫 프롬프트 (복붙용)

```
이 리포의 PLAN.md(크로니클 19 스펙 v4)를 읽어줘.

목표: 섹션 0의 chronicle-engine 골격을 TypeScript로 구현하고,
첫 어댑터로 #4 청약홈(bunyang-capsule)을 완성한다.

요구사항:
1. engine: fetch(재시도·백오프) → normalize → record-level diff
   → SHA-256 해시체인(integrity.json) → latest.json/changes.jsonl/feed.xml 퍼블리시
2. sources/bunyang-capsule: 공공데이터포털 청약홈 분양정보 API 어댑터
   (키는 GitHub Secrets의 DATA_GO_KR_KEY)
3. .github/workflows/bunyang.yml: 일 1회 cron, 변경 시에만 커밋
4. 스냅샷 raw 보존 + changes.jsonl append-only, 과거 커밋 수정 금지
5. README에 산출물 계약과 해시체인 검증 방법 문서화

어댑터 인터페이스는 3계열(API 레코드형 / 페이지 텍스트형 / 파일·프로브형)을
공통 추상 위에서 분리 설계할 것 — 이후 #1, #2, #12, #11, #14, #16+#19,
#13→#18 순으로 확장 예정.
```

---

## 7. 시너지 맵 v4

- KoreaAPI ↔ #1(그라운드트루스), #10·#16·#19(에이전트 웹 관측소), #14(신뢰 레이어)
- **KoreaAPI.dev(x402 베팅) ↔ #19 (베팅한 파도의 조기경보 레이더)**
- 재개발 책 ↔ #2·#3·#4·#5·#11 / Weather Plan AI ↔ #6 / 날씨의 아이돌 ↔ #8
- AI 에세이 ↔ #13·#18 (한국+글로벌 노동시장 관측소 쌍)
- "AI 경제 원장" ↔ #14+#15 / 포트폴리오 가동률 ↔ #12

*검증 플래그: #2 서울 API / #6 통보문 범위 / #8 YouTube 약관 / #16 Tranco 규모 / #18 보드 API 미사용 랩 목록 / #19 프로브 방법론 문서화 — 착수 전 각 30분.*
