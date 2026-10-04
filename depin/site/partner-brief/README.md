# wellbian Partner Brief (영문 원페이저 · 정적 사이트)

파트너 대화(거래소·온램프·커스터디·커뮤니티) 전에 보내는 한 장. 9/10 서우 — "vercel 에 추가 반영하자"
(Crypto.com 9/11 컨퍼런스콜 준비). 빌드 없음: `index.html` + `assets/device.png` 이 전부다.

## 문구의 출처

숫자와 정책 문장은 전부 `depin/content/site-canon-0910.md`(wellbian.io · 백서 v0.3 · 약관 v1.0 정본)에서
가져왔다. 여기서 새로 만든 사실은 없다. 사이트가 바뀌면 정본 → 이 파일 순으로 고친다.

지킨 것: 보상은 "planned · in testing · not guaranteed" · 가격 전망 0 · 리플은 RLUSD 발행사로만 ·
플레어·멀티체인·거래소 이름 0 · 판매 목표 수치(1차 5,000 등) 0 · 케이웨더 = device partner(30년 · 4,000+ 고객사까지) ·
발행 주체(웰비안 SG)는 약관 문언대로 한 줄. 거래소 게이트(G1~G3 상장 금지 · G4 DEX)는 **먼저 말한다** —
상장 얘기로 흐르는 대화를 정책 문서로 닫기 위해서다.

## 배포 (Vercel, 별도 프로젝트)

```bash
cd depin/site/partner-brief
vercel --prod            # 프로젝트명 wellbian-partner-brief
```

- `vercel.json` 이 `X-Robots-Tag: noindex` 를 붙이고 HTML 에도 `noindex` 메타가 있다 — 검색에 잡히지 않는
  링크로 운용한다. 공개 소개 페이지로 격상하려면 본부장 승인 뒤 둘 다 지운다.
- 헤더의 **Save as PDF** 버튼 = 브라우저 인쇄. A4 인쇄 CSS 가 들어 있어 메일 첨부용 PDF 는 그 자리에서 만든다.
- 이메일 주소는 FAQ 에 공개된 `admin@wellbian.io` 다. 파트너십 전용 주소(support@ 등)로 바꾸려면 `index.html`
  의 `mailto:` 한 곳만 고친다.
- 로고 SVG 는 `measured-room/index.html` 의 트레이스와 같은 경로 데이터, 기기 이미지는 `measured-room/assets/device.png`
  와 같은 파일(컷아웃 v8).

## 갱신

- 판매 일정·가격이 바뀌면 "Where we are" 4칸.
- 게이트 조건이 바뀌면 "Our published token policy" 4칸.
- 2차 판매 공지가 나오면 "Later" 칸을 날짜로.
