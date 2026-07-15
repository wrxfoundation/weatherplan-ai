# aiagentlabs.co.kr 루트 도메인 연결 — 검토 결과 & 절차 (2026-07-15)

## 검토 결과: 가능 ✅

- 현재 `aiagentlabs.co.kr`은 **GitHub Pages**(185.199.108–111.153)에 연결돼 있음 — Vercel 아님.
- 따라서 "기존 페이지를 서브도메인으로 내리고 루트를 AI InfraMap으로"는
  ① GitHub Pages 커스텀 도메인 변경 + ② DNS 레코드 교체 + ③ Vercel 도메인 추가, 3단계로 충돌 없이 가능.
- Vercel 프로젝트 간 도메인 이동이 아니어서 오히려 간단(도메인 소유 검증만 한 번).

## 절차 (총 15분 내외 + DNS 전파 대기)

### 1. 기존 GitHub Pages 사이트 → 서브도메인 (예: `old.aiagentlabs.co.kr` 또는 `labs.`)
1. 해당 GitHub 저장소 → Settings → Pages → Custom domain 을 `old.aiagentlabs.co.kr`로 변경
2. DNS 관리(도메인 등록처)에서: `old` CNAME → `<GitHub사용자명>.github.io`
3. Pages의 HTTPS 인증서 재발급 대기(수 분~1시간) — 기존 페이지는 이후 `https://old.aiagentlabs.co.kr`에서 그대로 서비스

### 2. 루트 → AI InfraMap (Vercel)
1. Vercel 대시보드 → **aidatacenter 프로젝트**(aidatacenter-red.vercel.app 서빙 프로젝트) → Settings → Domains → `aiagentlabs.co.kr` 추가 (+ `www.aiagentlabs.co.kr` 권장, www→루트 리다이렉트 선택)
2. DNS에서 기존 GitHub Pages A 레코드 4개(185.199.108.153 등) **삭제** 후:
   - `@` A → `76.76.21.21` (Vercel apex)
   - `www` CNAME → `cname.vercel-dns.com`
3. Vercel이 자동 검증·인증서 발급(보통 수 분)

### 3. 앱 쪽 반영 (이 커밋에 포함/필요 env)
- [x] API Origin 화이트리스트에 `aiagentlabs.co.kr`(+서브도메인) 추가 — `_ai.js`·`_lead.js` (이 커밋)
- [ ] **vworld**: 발급 키가 도메인 검증형 — vworld 콘솔에서 인증키에 `aiagentlabs.co.kr` 도메인 추가
      (또는 Vercel env `VWORLD_DOMAIN=aiagentlabs.co.kr` — 서버 프록시 호출의 domain 파라미터)
- [ ] law.go.kr OC — 도메인 무관(키만), KEPCO — 도메인 무관. 조치 불요
- [ ] (선택) index.html OG url·sitemap 등 절대 URL이 생기면 함께 교체

## 주의
- DNS 전파 전까지 루트가 잠시 GitHub Pages/빈 페이지로 보일 수 있음(TTL에 따라 수 분~수 시간)
- GitHub Pages CNAME 파일이 저장소에 커밋돼 있으면(대개 gh-pages 루트) 그 파일도 `old.aiagentlabs.co.kr`로 갱신
- 이미 발행된 링크(aidatacenter-red.vercel.app)는 계속 동작 — Vercel이 프로젝트 도메인으로 유지
