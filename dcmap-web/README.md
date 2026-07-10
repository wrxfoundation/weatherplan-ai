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
- `VWORLD_KEY` — geocode 캐시(`data/geo_lookup.json`) 미스 항목의 vworld REST 조회용 (신규 지역 추가 시)

## 데이터 원칙 (SPEC §0-1, 불변)

- **공개 소스 온리**: 사업자 공식 발표 · 언론 보도 · 정부 공고 · 공공데이터만 수록
- 국가/공공 보안시설 배제, 상세좌표(필지)는 사업자 공개 주소분만 — 나머지는 시군구/시도 중심점(`geocode_level` 기록)
- 시드 v0.1은 공개 지식 기반 초안: `needs_verify: true` 항목은 검증 대상이며 UI에 "검증 필요" 배지로 노출

## 디자인 토큰 (SPEC §6)

진실원천은 `src/styles/tokens.css`. 컴포넌트는 CSS 변수만 사용하고 hex 하드코딩을 금지한다.
BG `#111111` · Surface `#1A1D23` · Line `#2A2F38` · Text `#E5E7EB` · Grey `#6B7280` · Accent `#1D4ED8` · 건설 amber `#B7791F` · 폰트 Noto Sans KR.

## 전력 인허가 룰북 (M2 스코어링 선행 산출물)

- [`docs/power-licensing-rulebook-v0.md`](./docs/power-licensing-rulebook-v0.md) — 수전 트랙·비용·리드타임·D1 상태 머신 (공개 규정 기반: 기후부공고 제2025-139호 · 한전 기본공급약관 제23조)
- [`data/power_rules_v0.json`](./data/power_rules_v0.json) — 스코어링 엔진이 직접 읽는 정량 룰 (전압 트랙 결정·관문·수수료·기한)

## 이후 확장 (SPEC §3 로드맵)

전력 레이어(`substations.json`) → chronicle 어댑터 D1(psia-tracker)·D3(kepco-headroom) → 스코어링 엔진(§5.2) → MCP 서버(dc.koreaapi.dev). `dc_centers.json`은 chronicle 산출물(latest.json) 소비 구조를 가정한 독립 파일이므로 어댑터 전환은 파일 교체로 완결된다.
