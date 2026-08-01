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

## KOBIS_API_KEY — KOFIC 영화관입장권통합전산망 (영화 박스오피스 = 영화 버티컬의 정산 차트)
- 무엇: 일별/주별 박스오피스 순위·관객수를 `chart:kobis-boxoffice` 스냅샷으로 적재. 음악의
  써클차트에 대응하는 **영화 버티컬의 정산급(settlement-grade) 출처** — 예측시장 정산·트렌드 신호.
- 이름 교차검증에는 **쓰지 않음**(국내 개봉 제목은 마케팅 표기라 이름 합의를 떨어뜨림 — Spotify 교훈).
- 발급(무료): https://www.kobis.or.kr/kobisopenapi → 회원가입 → 키 발급.
- 등록: GitHub → Settings → Secrets and variables → Actions → `KOBIS_API_KEY`.
- 미설정 시: 완전 휴면(`boxoffice`가 0건 보고 후 정상 종료). 최초 활성화 때 응답 필드 모양을 한 번
  확인하고, 엔드포인트가 다르면 `KOBIS_URL`로 덮어쓰면 됨(코드 수정 불필요).
