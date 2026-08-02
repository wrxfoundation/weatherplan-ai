# 히어로 배경 (정지 이미지 + 루프 영상)

`/service` 랜딩 히어로 뒤에 깔리는 배경입니다. 지금은 **영상까지 들어가 있습니다.**

## 지금 들어 있는 파일

| 파일 | 크기 | 역할 |
|---|---|---|
| `home.webp` | 64KB | 정지 배경 + 영상 poster. 첫 화면을 그리는 건 이 파일입니다 |
| `loop.webm` | 368KB | 루프 영상 (VP9) — Chrome · Firefox · Edge |
| `loop.mp4` | 964KB | 루프 영상 (H.264) — Safari · iOS |

셋 다 같은 원본에서 나왔고, **`home.webp` 는 `loop` 의 0번 프레임과 같은 그림**입니다.
그래서 정지 이미지 → 영상으로 넘어갈 때 화면이 튀지 않습니다. 이 관계가 깨지면
영상이 붙는 순간 배경이 바뀌어 보이므로, 영상을 갈면 poster 도 같이 갈아야 합니다.

## 파일을 넣는 방법

**파일을 넣고 다시 빌드하면 끝입니다.** 스위치를 만질 필요가 없습니다.

`pages/service.jsx` 의 `getStaticProps` 가 빌드할 때 파일 존재를 확인해서 켜고 끕니다.

- `home.webp` 만 있으면 → 정지 배경만
- `home.webp` + `loop.webm` + `loop.mp4` → 루프 영상까지

영상은 **webm·mp4 를 둘 다** 둬야 켜집니다. 한쪽만 두면 그 코덱을 못 읽는
브라우저에서 재생 경로가 통째로 없어지기 때문입니다.

파일이 없으면 배경 없이 지금의 깔끔한 모습 그대로 나오고, CSS 가 파일을 아예
요청하지 않으므로 콘솔에 404 도 남지 않습니다.

## 규격

### 정지 이미지 `home.webp`

| 항목 | 값 |
|---|---|
| 비율 | 16:9 |
| 크기 | 1280 × 720 (영상과 같은 해상도로 맞춥니다) |
| 형식 | WebP (이름은 `home.webp` 유지) |
| 용량 | **250KB 이하** — 히어로가 이미지를 기다리면 첫인상이 늦어집니다 |
| 구도 | **왼쪽 절반은 비어 있어야 합니다** — 그 위에 제목이 올라갑니다 |

### 루프 영상 `loop.webm` · `loop.mp4`

| 항목 | 값 |
|---|---|
| 크기 | 1280 × 720 · 24fps |
| 길이 | 13.2초 (원본 7초를 2배 느리게 — 아래 참고) |
| 소리 | **없음** — 트랙 자체를 뺍니다 |
| 용량 | webm 500KB · mp4 1.2MB 이하 |
| 구도 | 정지 이미지와 동일 |

## 루프를 만드는 방법 (정방향만 · 2배 느리게 · 끝에서 겹쳐 넘기기)

**되감기(역재생)는 쓰지 않습니다.** 앞뒤로 이어 붙이면 되감기는 동안 꽃이
오므라들어 시드는 것처럼 보입니다. 꽃이 피는 방향만 씁니다.

그래서 세 가지를 겁니다:

1. **2배 느리게** — 원본 7초는 배경으로 쓰기에 빠릅니다. 단순 배속은 프레임이
   복제돼 반짝이가 튀므로(측정: 프레임간 차이가 `0.0 1.1 0.0 1.4` 로 진동),
   `minterpolate` 로 중간 프레임을 새로 만들어 24fps 를 채웁니다.
2. **정방향 1회** — 꽃이 피는 방향으로만 갑니다.
3. **끝 0.8초를 처음과 겹쳐 넘김** — 그냥 끊으면 활짝 핀 꽃이 한 프레임 만에
   사라져 눈에 띕니다. 겹쳐 넘기면 꽃만 서서히 옅어지고 벽·화분·커튼은
   그대로라 티가 안 납니다. 되감기가 아니라 **디졸브**라 꽃이 오므라들지 않습니다.

```sh
SRC=원본.mp4
# 1) 2배 느리게 (중간 프레임 생성)
ffmpeg -i "$SRC" -an -vf \
  "setpts=2*PTS,minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" \
  -c:v ffv1 slow.mkv

# 2) 끝 X초를 처음과 겹쳐 넘김 (D = slow.mkv 길이, X = 0.8)
D=13.959; X=0.8; OFF=$(python3 -c "print($D-2*$X)")
ffmpeg -i slow.mkv -filter_complex \
 "[0:v]split=2[a][b];[a]trim=start=$X,setpts=PTS-STARTPTS[main];\
[b]trim=end=$X,setpts=PTS-STARTPTS[head];\
[main][head]xfade=transition=fade:duration=$X:offset=$OFF,fps=24,format=yuv420p[o]" \
 -map "[o]" -an -c:v ffv1 loop_ref.mkv

# 3) 배포용 두 벌 + poster
ffmpeg -i loop_ref.mkv -an -c:v libx264 -preset veryslow -crf 28 \
  -profile:v main -pix_fmt yuv420p -movflags +faststart loop.mp4
ffmpeg -i loop_ref.mkv -an -c:v libvpx-vp9 -crf 46 -b:v 0 -row-mt 1 -cpu-used 1 loop.webm
ffmpeg -i loop.mp4 -vf "select=eq(n\,0)" -vsync 0 poster.png   # → home.webp (quality 92)
```

`xfade` 가 끝나는 지점은 `head` 의 마지막 프레임(원본 X 초 지점)이고 루프의
0번 프레임은 `main` 의 첫 프레임(역시 원본 X 초 지점)이라, 되감김 자리가
그대로 이어집니다 (실측 프레임차 0.69/255 — 안 보입니다).

**그냥 끊고 싶다면** 2)번을 빼고 `slow.mkv` 를 바로 3)번에 넣으면 됩니다.

## 이미 적용된 안전장치

- 왼쪽에서 오른쪽으로 페이퍼색(#F1EFE8) 그라데이션을 덮어 글자 가독성을 지킵니다
- 모바일에서는 더 강하게 덮습니다 (좁은 화면에서는 글자가 이미지 위로 겹치므로)
- **영상을 아예 안 받는 경우** — 이때는 정지 이미지가 그대로 남습니다
  - `prefers-reduced-motion` (모션 최소화)
  - `saveData` (데이터 절약 모드) · 2G급 회선
- 영상은 **하이드레이션 뒤에** 붙습니다. 첫 페인트는 60KB 이미지가 잡으므로
  1MB 영상이 LCP 경로에 끼어들지 않습니다
- 히어로가 화면 밖으로 나가면 재생을 멈춥니다 (배터리·팬)
- 자동재생이 거부돼도(iOS 저전력 모드 등) poster 가 같은 그림이라 티가 안 납니다
- CSP: `img-src 'self'` · `media-src 'self'` 이므로 이 폴더(자기 출처)의 파일만
  뜹니다. 외부 CDN 주소는 차단됩니다

## 프롬프트

생성에 쓴 프롬프트는 `docs/SPLASH-IMAGE-PROMPTS.md` 의 "어르신 앱 스플래시 배경" 항목과
같은 계열입니다. 다시 만들 때 그 문서를 참고하세요.
