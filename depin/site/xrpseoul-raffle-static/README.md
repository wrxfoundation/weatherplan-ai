# xrpseoul-raffle-static — XRP SEOUL 2026 래플 정적 사이트 (결제창 포함)

서우의 정적 시안(`xrpseoul-raffle_10.zip`, 9/21) 위에 **서버·API 키 없이** 동작하는 XRP 결제창·오픈 카운트다운·선착순 500 마감을 붙인 배포본.
배포 단위는 폴더 통째(Vercel 드롭). 저장소에서는 `www/` (루트 .gitignore 가 `build/` 를 막아 이름만 다름), zip 안에서는 `build/`. 설정·동작 규칙·한계는 **`www/README.md`** 참조.

```
www/              배포 폴더 (= xrpseoul-raffle_12.zip 의 build/)
  index.html      페이지 + 결제창 + 스크립트(파일 끝 RAFFLE 설정 블록)
  js/qrcode.js    QR 라이브러리(qrcode-generator 1.4.4, MIT)
  images/ brand/  에셋
  test/           /test/ 시뮬레이터 — index.html(로더) + sim.js(가짜 원장·제어판). 본 페이지를 그대로 불러와 끼우므로 복사본 아님
test/run.js       playwright 검증 (목 RPC · ?now= 시계 오버라이드) — 9 시나리오
```

## 검증
```
cd depin/site/xrpseoul-raffle-static/test && NODE_PATH=/opt/node22/lib/node_modules node run.js
```
오픈 전(비활성·D-day) · 오픈 중 17명(잡음 거래 제외) → 결제 4단계 → No. 018 · 해시 직접 확인 · 500명 매진 + 501번째 OVERFLOW ·
남은 자리 경고 · 오픈 순간 자동 전환 · 마감 후 · 모바일 캡처 · /test/ 시뮬레이터(시계·인원 전환 → 결제 → 가짜 입금 → No. 498 → 초기화).

## 문의 메일
페이지 본문·완료 화면 mailto·`RAFFLE.contact` 모두 `support@wellbianlabs.io` (9/22 서우 지시로 admin@ 에서 변경).

## 정본 이식
모체(kweather-depin) 이식은 `depin/site/kweather-depin-patches/2026-09-21-raffle-xrp-checkout/`(v8 패치)로 개발자가 진행.
이 정적본은 그 전까지 쓰는 독립 배포본이며, 두 쪽의 규칙(정원 500·계정당 1회·태그 범위·유예 10분)은 같다.
