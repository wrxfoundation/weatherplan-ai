# MODU ON 정식 로고 넣는 곳

1. 로고 원본 이미지를 이 폴더에 아래 이름으로 저장하세요 (흰 배경 그대로 OK):
   - `logo-moduon-src.png`  (또는 JPG면 `logo-moduon-src.jpg`)
2. 평소처럼 배포하면 끝: `vercel --prod`
   - 빌드가 자동으로 흰 배경을 투명 처리해 `logo-moduon.png`를 만들고
   - `/ir/deck` 헤더·브랜드 섹션에 즉시 적용됩니다.

원본(`-src`) 파일은 git에 커밋하지 않아도 됩니다. 파일이 없으면 페이지는 SVG 근사 마크로 안전하게 폴백합니다.
