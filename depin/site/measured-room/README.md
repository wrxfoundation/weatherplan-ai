# Measured Room — 방 하나의 공기 시뮬레이션 (v0.1 프로토타입, 2026-09-02)

서우 제안: "실내 공간에 디바이스로 공기 측정하는 것을 시뮬레이션하는 VR 월드". 단일 HTML(Three.js r128, cdnjs) —
드래그로 돌려 보는 거실, 선반 위 기기, 요리·창문·밤 버튼으로 PM2.5·CO₂가 변하고 5분마다 기록 하나가 쌓인다.

- 용도: 10/3 부스 화면(터치), 랜딩 데모, 키노트 클립 소재. 캡션은 항상 "개념 시뮬레이션".
- 규칙: 화면에 공기질 등급 라벨 없음(곡선·숫자만) · 토큰·코인 아이콘 없음 · "보상은 테스트 중" 고정 문구 · 실물 사진 대체 아님.
- 다음 단계(힉스필드): 제품 사진 → GLB(generate_3d)로 기기 교체 · 방 텍스처·배경(generate_image) · 15초 시네마틱(generate_video).
- 게시본: claude.ai 아티팩트 v0.1 (세션 내 링크). 파일 = 이 폴더 index.html.

## Vercel 배포 (정적 사이트, 빌드 없음)

```
cd measured-room
vercel --prod
```
- 첫 실행에서 프로젝트 이름은 `wellbian-measured-room`, 프레임워크는 Other, 빌드 명령·출력 디렉터리는 비워 둔다(루트의 index.html 을 그대로 서빙).
- 또는 Vercel 대시보드 → Add New → Project → 이 폴더를 드래그.
- `noindex` 메타가 걸려 있어 검색엔진에 안 잡힌다. 공식 공개 시점에 그 줄만 지운다.
- 외부 의존: three.js(cdnjs) · Google Fonts. 부스 현장 와이파이가 막히면 three.min.js 를 폴더에 넣고 `<script src>` 를 `./three.min.js` 로 바꾼다.
