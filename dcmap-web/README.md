# 명당(MyeongDang) AI — dcmap-web

한국 AI 데이터센터 부지 인텔리전스 플랫폼의 L1 맵(무료·공개). SPEC은 [`SPEC.md`](./SPEC.md) 참조 (v1.0 동결).

## M1 범위 (맵 v0)

- 시드 65개(`data/dc_seed_v0.1.json`) → vworld 지오코딩 → `data/dc_centers.json`
- React 18 + Vite + Leaflet 다크맵 (CartoDB dark_matter), 상태별 마커(운영 blue / 건설 amber / 계획 grey outline), 클러스터링
- 필터: 상태 · 유형 · 시도, `?min_mw=` 쿼리(계산기 CTA 진입점)
- 시설 상세 `/dc/[slug]`: 메타태그 + schema.org Place JSON-LD, 빌드 시 정적 프리렌더
- `sitemap.xml` · `robots.txt` 자동 생성
- GPU 계산기 `/calc`: GPU 수량 → 필요 MW → "이 용량 가능한 부지 보기" CTA

## 실행

```bash
npm install
npm run dev        # 개발 서버
npm run build      # vite build + 프리렌더/sitemap (scripts/postbuild.mjs)
npm run geocode    # 시드 변경 시 dc_centers.json 재생성
```

- `VITE_SITE_ORIGIN` — sitemap/canonical 기준 도메인 (기본 `https://dc.koreaapi.dev`)
- `VWORLD_KEY` — ① geocode 캐시 미스 항목의 vworld REST 조회(빌드 시) ② `/api/revgeo` 클릭 지점 지번주소(런타임, Vercel env)
- `KWEATHER_API_KEY` / `KWEATHER_API_URL` — `/api/weather` 케이웨더 프록시(런타임, Vercel env). 키는 서버 측 env 전용 — **코드/리포 커밋 절대 금지**. 상세: `.env.example`

### 서버리스 함수 (`api/`)

Vercel이 정적 빌드와 함께 배포. SPA rewrite는 `/api/*` 제외.
- `api/weather.js` — 케이웨더 현재기상 프록시. 엔드포인트는 `KWEATHER_API_URL` 템플릿(`{lat} {lng} {key}`)로 오버라이드 가능 — API 가이드 확정 시 env만 수정. 미설정/실패 시 `{available:false}` → UI '연동 대기' (가짜 수치 금지 원칙)
- `api/revgeo.js` — vworld 리버스 지오코딩(클릭 지점 지번·도로명). 시설 카드에는 **공개 주소(`address_public`)만** 표기 — 시군구 중심점 좌표를 주소로 둔갑시키지 않는다

## 데이터 원칙 (SPEC §0-1, 불변)

- **공개 소스 온리**: 사업자 공식 발표 · 언론 보도 · 정부 공고 · 공공데이터만 수록
- 국가/공공 보안시설 배제, 상세좌표(필지)는 사업자 공개 주소분만 — 나머지는 시군구/시도 중심점(`geocode_level` 기록)
- 시드 v0.1은 공개 지식 기반 초안: `needs_verify: true` 항목은 검증 대상이며 UI에 "검증 필요" 배지로 노출

## 디자인 토큰 (SPEC §6 → v3 리스킨)

진실원천은 `src/styles/tokens.css`. 컴포넌트는 CSS 변수만 사용하고 hex 하드코딩을 금지한다. 타이포는 토큰 스케일(xs11~display34, 굵기 400/600/700)만 사용.
폰트: **Pretendard Variable** (jsdelivr dynamic-subset) → 시스템 폴백. ※ SPEC §6 원문은 Noto Sans KR — '26.07.10 Pretendard로 최종 결정.

**v3 ('26.07.11, 인프라 HUD 레퍼런스 준거 — 사용자 지시)**: 딥 네이비(`#081527`) + 시안 액센트(`#35D5EE`) 리퀴드 글라스로 전면 리스킨.
- 상태 의미색 재배정: **운영 green `#45D483` / 건설 orange `#F59A3C` / 계획 slate outline** (SPEC §6 원안 운영 blue·건설 amber에서 레퍼런스 문법으로 교체 — M2 회고 시 SPEC 반영)
- 리퀴드 글라스: 반투명 표면 + `backdrop-filter: blur+saturate`(고정 요소 전용, 성능 가드레일 유지) + 상단 스펙큘러 하이라이트(`--glass-specular`)
- 공간 위계(elevation) 0~3단 토큰(`--elev-1..3`): 맵(0) < 필터·칩·버튼(1) < 패널·카드(2) < 오버레이·모바일 독(3) — 위계가 오를수록 그림자·불투명도·보더 광량 증가
- 문서형 페이지 배경: 시안 블룸 radial + 엔지니어링 그리드 오버레이(`body::before`)

## 전력 인허가 룰북 (M2 스코어링 선행 산출물)

- [`docs/power-licensing-rulebook-v0.md`](./docs/power-licensing-rulebook-v0.md) — 수전 트랙·비용·리드타임·D1 상태 머신 (공개 규정 기반: 기후부공고 제2025-139호 · 한전 기본공급약관 제23조)
- [`data/power_rules_v0.json`](./data/power_rules_v0.json) — 스코어링 엔진이 직접 읽는 정량 룰 (전압 트랙 결정·관문·수수료·기한)

## 이후 확장 (SPEC §3 로드맵)

전력 레이어(`substations.json`) → chronicle 어댑터 D1(psia-tracker)·D3(kepco-headroom) → 스코어링 엔진(§5.2) → MCP 서버(dc.koreaapi.dev). `dc_centers.json`은 chronicle 산출물(latest.json) 소비 구조를 가정한 독립 파일이므로 어댑터 전환은 파일 교체로 완결된다.
