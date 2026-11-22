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

## 카페 · 사무실 · 회의실 (v0.16 — 이 파일들은 CDN 대체본이 없다. 지우면 그 공간은 도면 장면으로 열린다)

| 파일 | 무엇 |
|---|---|
| `cafe-day-0.jpg` `cafe-day-1.jpg` `cafe-day-2.jpg` `cafe-night-0.jpg` `cafe-night-1.jpg` | 카페 홀: 낮(빈 매장 · 손님 · 만석) · 밤(빈 매장 · 손님). 1920×1289 JPEG |
| `office-day-0.jpg` `office-day-1.jpg` `office-night-0.jpg` `office-night-1.jpg` | 업무 공간: 낮(빈 · 근무) · 밤(불 꺼짐 · 야근) |
| `meeting-day-0.jpg` `meeting-day-1.jpg` | 회의실: 빈 방 · 회의 중(밤은 페이지가 같은 사진을 어둡게) |
| `<위 이름>-open.webp` (11개) | 문 · 창 열림 조각 — 그 장면 위 제자리에 얹는 알파 그림(사람 자리는 비움). 상자 좌표는 `index.html` `SPACES[..].photo.patch` |

만든 방법 · 작업 ID · 크레딧은 위 폴더 README 의 v0.16.

기기 화면은 파일이 아니라 페이지가 2D 캔버스(800×600)에 실제 ARC-600DA 화면 양식으로 그려서 컷아웃의 화면 자리에 얹는다(`index.html` 의 `SPRITE.screen`).
원본 PNG(2528×1696 · 2048×2048)는 힉스필드 라이브러리에 남아 있다(생성 작업 ID 는 `fetch-assets.sh` 주석 참고).
