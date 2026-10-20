# 「창고 vs 선반」 SNS 16:9 이미지 (2026-10-20)

서우 요청: 비트코인 채굴장과 웰비안 측정기를 좌우로 대비 · 상단 2문장 · 애플 광고처럼.

- 결과: `warehouse-or-shelf-en.png` · `warehouse-or-shelf-ko.png` (1920×1080)
- 문구(영): 「Mining Bitcoin takes a warehouse. / Wellbian takes a shelf.」 · 하단 시그니처 「An air-quality network shouldn't cost the air.」(playbook 미사용 시그니처 — 이 이미지가 첫 사용)
- 문구(국): 「비트코인 채굴엔 창고가 필요합니다. / 웰비안은 선반 한 칸이면 됩니다.」 · 「공기를 재는 네트워크가 공기를 태워선 안 됩니다.」
- 비교 축은 전력 · 위치 · 만드는 것 · 필요한 것만. **수익 · 회수 기간 · 보상 · 토큰 · 가격 0**(10/17 내부 「채굴 코인 vs 측정기」 표의 원가 회수 · kWh 당 수입은 쓰지 않는다).
- 수치 출처: 채굴기 = Antminer S21 (200 TH/s) 판매처 표기 약 3,500 W(일부 3,550 W — 「about」로 표기) · 측정기 = ARC-600DA 12 V · 300 mA = 3.6 W(우리 스펙표, x-activity-log 5f).
- 소음 비교는 뺐다 — 측정기 내부 팬 유무 미확인이라 「Silent」를 쓸 수 없음.
- **사진 권리**: 왼쪽 채굴장 사진은 서우가 준 캡처(출처 미상) — 공개 게시 전 라이선스 사진이나 자체 · 생성 이미지로 교체. 오른쪽은 우리 광고 이미지(제품 사진).
- 다시 만들기: `tpl.html` + `build.py`(문구) → Chromium 스크린샷 1920×1080. 사진 · 폰트 파일은 저장소 밖(폰트는 `site/event-week/www/fonts/PretendardVariable.woff2`).
