# KoreaAPI — accounts & API keys (one-pass setup)

> A single shopping list so you can gather everything in one sitting; then I wire it all at
> once. Variable names match [`.env.example`](../.env.example). When you have a value, put it in
> `.env` (local, gitignored) **and** as a GitHub Actions **secret** (repo Settings → Secrets and
> variables → Actions) so the `collect` / `pages` workflows can use it. Ping me with which ones
> you've set and I'll wire the adapters + workflows in one pass.

**Legend:** ✅ done · 🟢 do now (free) · 🟡 Phase-1 revenue (light approval) · 🔵 Phase-2 / later · ⚪ optional

---

## ✅ Already working — no key needed
- **Wikidata · Wikipedia** — credential-free (a compliant User-Agent only). 6 artists live + cross-verified.

## 🟢 Now — free; sharpen the magnet & verification
| Service | What it buys us | Cost | Sign up | Env var |
|---|---|---|---|---|
| **Anthropic (Claude)** | LLM extract + bilingual translation at ingest (cheap collection labor; Haiku) | usage (cheap) | console.anthropic.com → API keys | `ANTHROPIC_API_KEY` |
| ~~Spotify~~ ⚠️ **gated (skip)** | Web API now demands **Premium** (2026 policy change) — **skip it**; we already cross-verify with Wikidata + Wikipedia. A keyless 3rd source isn't worth it (EN-mostly → would *lower* the 1.00 scores). | — | — | — |
| **YouTube Data API v3** ✅ **adapter BUILT** | official-channel stats + latest release → `kind='release'` live-state event (prediction-market settlement + engine ② velocity); identity-guarded. **Set the key → it activates** (`admin youtube`), no code needed | free quota | console.cloud.google.com → enable "YouTube Data API v3" → API key | `YOUTUBE_API_KEY` |

## 🟡 Phase-1 revenue — light approval (site review, no sales threshold)
| Service | What it buys us | Cost | Sign up | Env var |
|---|---|---|---|---|
| **Skimlinks** (or Sovrn) | affiliate links in `get_buy_options` → commission + buy-intent signal | free; site review | skimlinks.com | `SKIMLINKS_PUBLISHER_ID` |
| **Amazon Associates** | affiliate for global goods | free; site review | affiliate-program.amazon.com | `AMAZON_ASSOCIATES_TAG` |
| **Beehiiv** | "Korea Rising" digest (engine ② seed + marketing) | free tier | beehiiv.com | `BEEHIIV_API_KEY`, `BEEHIIV_PUBLICATION_ID` |

## 🔵 Phase-2 — agent payments (x402); wire only when traffic qualifies
| Service | What it buys us | Cost | Sign up | Env var |
|---|---|---|---|---|
| **Coinbase Developer Platform** | x402 facilitator — agents pay per call in USDC | usage | portal.cdp.coinbase.com | `CDP_API_KEY_ID`, `CDP_API_KEY_SECRET` |
| **USDC wallet (Base)** | receiving address for agent payments | — | any Base wallet | `KOREAAPI_PAYOUT_ADDRESS` |

> ROADMAP guardrails: payment rail = **USDC + x402**, *not* "receive BNB"; do **not** launch a token.

## 🔵 Prediction-market vertical (candidate) — mostly NO keys
We are the **oracle** (markets/agents query *us*), so no keys are needed to start. Only if we
later *read* markets to cross-reference: Polymarket (on-chain, public), Kalshi (API + account),
오피니언/Opinion (KR, TBD).

## ⚪ Infra / scale — later
| Service | What it buys us | Cost | Sign up | Env var |
|---|---|---|---|---|
| **Postgres** (Supabase / Neon) | production append-only DB (swap from SQLite) | free tier | supabase.com / neon.tech | `DATABASE_URL` |
| **Domain** (e.g. koreaapi.dev) | agent-facing site + the User-Agent contact | ~$12/yr | any registrar | — |
| **MCP registry** (Smithery) | agent discovery / GEO | free | smithery.ai | — |

---

## If you only do a few now (highest leverage)
1. **Spotify** (free) → a 3rd cross-verification source → Skill Scores + trust ↑
2. **Anthropic** → LLM extraction → unlocks *event/outcome* data (comebacks / charts) = the
   live-state moat **and** the prediction-market vertical
3. **Beehiiv** (free) → first "Korea Rising" digest → traffic → unlocks affiliate approval

Set any of these → drop in `.env` + GitHub Actions secrets → ping me; I wire them in one pass.

## KOSIS_API_KEY — 국가통계포털 (지역 인구, 정부 공식 통계)
- 무엇: `region:` 엔티티에 주민등록인구(월간)를 정부 출처로 부착 (KOSIS 표 DT_1B040A3).
- 발급(무료): https://kosis.kr → 로그인 → 공유서비스(OpenAPI) → 활용신청 → 인증키 확인.
- 등록: GitHub → Settings → Secrets and variables → Actions → `KOSIS_API_KEY`.
- 미설정 시: 소스는 완전 휴면(수집은 정상 진행) — 다른 키들과 같은 dormant 패턴.

---

## 🔵 Phase-2 Tier B — 정부 출처 (공공데이터포털/오픈다트 무료키, dormant 패턴)
KOSIS와 동일: **키 발급 1회 → GitHub Actions secret 등록 → 자동 활성**. 미설정 시 완전 휴면(수집 정상).
권위(정부 배지)가 볼륨보다 값을 만든다 — 순서는 국가유산청(간판·논란0) → 나머지. (docs/PHASE2.md)

### HERITAGE_API_KEY — 국가유산청 (문화유산 정부 지정정보) — 1순위
- 무엇: `heritage:` 엔티티에 국가지정(국보·보물·국가무형유산 등) 정보를 정부 출처로 부착 = 최강 신뢰 배지.
- 발급(무료): https://www.data.go.kr → "국가유산청 국가유산 검색" 활용신청 → 일반 인증키(serviceKey).
  (국가유산청 직접 오픈API `www.khs.go.kr/cha/SearchKindOpenapiList.do` 사용 시에도 이 키를 활성 스위치로 사용.)
- 등록: `HERITAGE_API_KEY`.

### MEDICAL_API_KEY — 건강보험심사평가원 (병원 정부 등록정보)
- 무엇: `medical:` 엔티티에 종별(상급종합 등)·개설일·소재지를 심평원 등록정보로 부착 (병원정보서비스 getHospBasisList).
- 발급(무료): https://www.data.go.kr → "건강보험심사평가원_병원정보서비스" 활용신청 → serviceKey.
- 등록: `MEDICAL_API_KEY`.

### DART_API_KEY — 금융감독원 전자공시 (기업 공식 공시)
- 무엇: `company:` 엔티티에 설립일·대표자·종목코드를 정부 공시(DART)로 부착 = 기업 버티컬의 정부 티어.
- 발급(무료): https://opendart.fss.or.kr → 인증키 신청/관리 → API 인증키(crtfc_key).
- 등록: `DART_API_KEY`.
- 참고: DART는 이름검색이 없고 8자리 `corp_code`로 조회 → `sources/dart.py`의 `CORP_CODES` 시드맵을
  `opendart.fss.or.kr/api/corpCode.xml`(전 종목 코드↔이름)로 확장. 각 항목은 영문 상호 이름가드로 보호되어
  코드가 틀리면 **miss**(다른 회사 데이터 유입 없음).
