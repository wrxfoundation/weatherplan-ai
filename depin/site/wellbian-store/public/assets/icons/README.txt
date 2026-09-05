wellbian 아이콘 — 8종 (8/28 교체 완료)
=========================================

이 폴더에는 프로스티드 글래스 렌더 8장이 들어 있습니다. 이미 사이트에 붙어 있으므로
그냥 두면 됩니다. 아래는 "다시 뽑아 갈아끼울 때" 참고용입니다.

들어 있는 파일
--------------
  카드(우리가 만드는 것 · 화면에서 120px)     원본 192×192
    measure.webp   ① 측정   화면 달린 측정기
    verify.webp    ② 검증   방패 + 체크
    reward.webp    ③ 보상   토큰 3단 스택
    use.webp       ④ 활용   막대그래프 4개

  칩(데이터가 흐를수록 단단해지는 선순환 · 화면에서 66px)   원본 128×128
    data.webp      검증된 데이터    슬래브 3단
    flow.webp      기업/기관 구매   오피스 빌딩 (8/29 교체 — 화살표는 뜻이 안 읽혔다)
    coins.webp     보상 재원 확보    동전 2개
    nodes.webp     측정망 확대      구 4개 + 연결선

규격
----
  형식   WebP (투명 배경 필수)
  크기   카드 192×192 / 칩 128×128   ← 화면 크기의 1.5배 이상이어야 레티나에서 안 뭉갠다
         (8/29 서우가 칩 아이콘을 20%씩 두 번 키워 화면 66px → 96px 원본으로는 1.45배라 모자랐다)
  용량   장당 6.5KB 이하 (현재 11종 합계 68KB)
  여백   사방 4% (92% 로 리사이즈한 뒤 정사각 캔버스 중앙 배치)

새로 뽑을 때
------------
  1. depin/content/icon-prompt.md 의 프롬프트로 생성 (배경은 흰색으로 나온다)
  2. 흰 배경을 지운다. 반드시 fuzz 를 낮게:

       convert in.png -alpha set -bordercolor white -border 2 \
         -fuzz 5% -fill none -draw "matte 0,0 floodfill" -shave 2x2 \
         -trim +repage -resize 176x176 -background none -gravity center -extent 192x192 out.png
       convert out.png -quality 76 -define webp:alpha-quality=85 measure.webp

     (칩은 -resize 118x118 -extent 128x128)

  ⚠ fuzz 값을 올리지 말 것. 유리 재질의 밝은 하이라이트가 흰 배경과 색이 거의 같아서,
    fuzz 22% 로 뽑았던 1차본은 verify 방패가 63.7%, data 가 56.4% 깎여 나갔다.
    배경은 완전히 균일한 순백이라 5% 면 깨끗이 지워진다.

  3. 파일명을 위와 똑같이 맞춰 이 폴더에 덮어쓴다. 코드 수정은 필요 없다.
     (경로는 components/GlassIcons.tsx 의 ICON_PNG 에 이미 잡혀 있다)

되돌리려면
----------
  ICON_PNG 에서 해당 줄을 주석 처리하면 인라인 SVG 폴백으로 돌아간다.
  다만 SVG 로는 유리의 굴절을 만들 수 없어 품질이 떨어진다 — 권하지 않는다.
