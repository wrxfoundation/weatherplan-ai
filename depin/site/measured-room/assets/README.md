# assets — 있으면 우선, 없으면 CDN

`index.html` 은 아래 파일을 먼저 `assets/<이름>` 에서 찾고, 없으면(404) 힉스필드 CDN 주소로 바꿔 부른다. 그러니 **비워 둬도 동작한다.**
오프라인 부스·장기 배포용으로 받아 두려면 폴더 위에서 `sh fetch-assets.sh` (사진 13장 ≈ 1.2MB, 영상 13편 ≈ 9MB, 기기 PNG 0.7MB).

| 파일 | 무엇 | 출처(9/2~3) |
|---|---|---|
| `device.png` | 제품 컷아웃(배경 제거, 1024×938, 화면 꺼짐). 페이지가 실측 척도로 장면에 놓고, 화면 자리에 실시간 화면을 원근으로 얹는다 | 제품 렌더 참조 → Nano Banana Pro 클린 제품 사진 → 배경 제거 |
| `living-dusk.jpg` `living-window.jpg` `living-night.jpg` `living-night-window.jpg` | 거실 저녁 / 창 열림 / 밤 / 밤·창 열림 (기기 없음) | Soul Location(기본) → Nano Banana Pro 상태 편집, 1600px JPEG |
| `bedroom-evening.jpg` `bedroom-night.jpg` `bedroom-night-window.jpg` `bedroom-morning.jpg` | 침실 저녁 / 밤 / 밤·창 열림 / 아침 창 열림 | 〃 |
| `kitchen-idle.jpg` `kitchen-cook.jpg` `kitchen-vent.jpg` `kitchen-night.jpg` `kitchen-night-window.jpg` | 부엌 대기 / 조리 중 / 환기 / 밤 / 밤·창 열림 | 〃 |
| `<같은 이름>.mp4` (13편) | 각 사진과 같은 구도의 5초 앰비언트 루프(커튼·김·조명만 움직임), 24fps, 편당 0.6~0.8MB | Kling 3.0 pro image-to-video, 첫 프레임 = 마지막 프레임 = 그 사진 |

기기 화면은 파일이 아니라 페이지가 2D 캔버스(800×600)에 실제 ARC-600DA 화면 양식으로 그려서 컷아웃의 화면 자리에 얹는다(`index.html` 의 `SPRITE.screen`).
원본 PNG(2528×1696 · 2048×2048)는 힉스필드 라이브러리에 남아 있다(생성 작업 ID 는 `fetch-assets.sh` 주석 참고).
