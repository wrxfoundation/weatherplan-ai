# assets — 있으면 우선, 없으면 CDN

`index.html` 은 아래 파일을 먼저 `assets/<이름>` 에서 찾고, 없으면(404) 힉스필드 CDN 주소로 바꿔 부른다. 그러니 **비워 둬도 동작한다.**
오프라인 부스·장기 배포용으로 받아 두려면 폴더 위에서 `sh fetch-assets.sh`.

| 파일 | 무엇 | 출처(9/2) |
|---|---|---|
| `living-dusk.jpg` `living-window.jpg` `living-night.jpg` | 거실 저녁 / 창 열림 / 밤 | Soul Location(기본) → Nano Banana Pro 편집(상태), 1600px JPEG |
| `bedroom-evening.jpg` `bedroom-night.jpg` `bedroom-morning.jpg` | 침실 저녁 / 밤 / 아침 창 열림 | 〃 |
| `kitchen-idle.jpg` `kitchen-cook.jpg` `kitchen-vent.jpg` `kitchen-night.jpg` | 부엌 대기 / 조리 중 / 환기 / 밤 | 〃 |
| `device.glb` | 제품 렌더(ARC-600DA 데이터시트, 화면 비움) → Meshy image-to-3D, 텍스처·PBR, 7.8MB | 힉스필드 generate_3d |

원본 PNG(2K) 는 힉스필드 라이브러리에 남아 있다(생성 작업 ID 는 `fetch-assets.sh` 주석 참고).
