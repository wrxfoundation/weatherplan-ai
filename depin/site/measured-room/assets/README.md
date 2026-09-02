# assets — 있으면 우선, 없으면 CDN

`index.html` 은 아래 파일을 먼저 `assets/<이름>` 에서 찾고, 없으면(404) 힉스필드 CDN 주소로 바꿔 부른다. 그러니 **비워 둬도 동작한다.**
오프라인 부스·장기 배포용으로 받아 두려면 폴더 위에서 `sh fetch-assets.sh` (사진 10장 ≈ 1MB, 영상 10편 ≈ 7MB).

| 파일 | 무엇 | 출처(9/2) |
|---|---|---|
| `living-dusk.jpg` `living-window.jpg` `living-night.jpg` | 거실 저녁 / 창 열림 / 밤 — 콘솔 위에 기기가 렌더링된 사진 | Soul Location(기본) → Nano Banana Pro 편집(기기 합성 → 상태 변형), 1600px JPEG |
| `bedroom-evening.jpg` `bedroom-night.jpg` `bedroom-morning.jpg` | 침실 저녁 / 밤 / 아침 창 열림 — 협탁 위 기기 | 〃 |
| `kitchen-idle.jpg` `kitchen-cook.jpg` `kitchen-vent.jpg` `kitchen-night.jpg` | 부엌 대기 / 조리 중 / 환기 / 밤 — 조리대 위 기기 | 〃 |
| `<같은 이름>.mp4` (10편) | 각 사진과 같은 구도의 5초 앰비언트 루프(커튼·김·조명만 움직이고 기기는 고정), 1756×1176 24fps, 편당 0.6~0.8MB | Kling 3.0 pro image-to-video, 첫 프레임 = 마지막 프레임 = 그 사진 |

기기 화면은 파일이 아니라 페이지가 2D 캔버스에 그려서 사진 속 화면 자리에 원근으로 얹는다(`index.html` 의 `SPACES[*].screen`).
원본 PNG(2528×1696)는 힉스필드 라이브러리에 남아 있다(생성 작업 ID 는 `fetch-assets.sh` 주석 참고). v0.3 의 GLB 기기 모형은 더 쓰지 않는다.
