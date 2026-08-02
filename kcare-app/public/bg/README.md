# 남색 섹션 배경 (루프 영상)

`/service` 랜딩에서 **남색 섹션**(`Section tone="navy"`) 뒤에 깔리는 배경입니다.
지금은 "저희가 하지 않는 것" 과 마무리 CTA, 두 곳에 들어갑니다.

히어로 배경은 여기가 아니라 `public/hero/` 입니다.

## 지금 들어 있는 파일

| 파일 | 크기 | 역할 |
|---|---|---|
| `navy.webp` | 62KB | 정지 배경 + 영상 poster |
| `navy.webm` | 277KB | 루프 영상 (VP9) — Chrome · Firefox · Edge |
| `navy.mp4` | 391KB | 루프 영상 (H.264) — Safari · iOS |

**세 개가 다 있어야 켜집니다.** `pages/service.jsx` 의 `getStaticProps` 가
빌드할 때 확인하고, 하나라도 없으면 지금처럼 단색 남색으로 나옵니다.
webm·mp4 를 둘 다 둬야 하는 이유는 한쪽만 두면 그 코덱을 못 읽는 브라우저에서
재생 경로가 통째로 없어지기 때문입니다.

## 남색 톤을 유지하는 방법

**영상 파일 자체를 흑백으로 구워 둡니다.** 흑백 영상을 남색 바탕에
`mix-blend-mode: soft-light` 로 얹으면 남색의 **명도만** 오르내리고 색상은
남색 그대로 남습니다. 그래서 "남색 위에 숲의 결" 이 됩니다.

런타임에 `filter: grayscale()` 을 거는 방법도 있지만, 스크롤할 때마다 프레임마다
다시 계산해야 해서 파일에 미리 구워 두는 편이 훨씬 쌉니다. 흑백으로 구운 덕에
원본의 금빛 → 푸른빛 색 이동도 같이 사라져서 루프도 더 매끄럽습니다.

세부 값은 `styles/globals.css` 의 `.sec-navy` 에 있습니다 (영상 불투명도 .42,
그 위에 남색 그라데이션 장막 .40 → .72).

## 규격

| 항목 | 값 |
|---|---|
| 크기 | 1280 × 720 · 24fps |
| 길이 | 4.1초 |
| 색 | **흑백** (`hue=s=0`) — 남색 톤은 CSS 가 입힙니다 |
| 소리 | **없음** — 트랙 자체를 뺍니다 |
| 용량 | webm 300KB · mp4 450KB 이하 |
| 구도 | 가로로 길게 잘려 쓰이므로 **위아래 여백이 넉넉한** 컷이 좋습니다 |

## 만드는 방법

원본은 카메라가 계속 앞으로 나아가는 컷이라 첫 프레임과 끝 프레임이 많이
다릅니다(실측 평균차 26/255). 그래서 **끝 1초를 처음과 겹쳐 넘겨** 루프를
만듭니다. 되감기(역재생)는 쓰지 않습니다.

```sh
SRC=원본.mp4
D=5.085; X=1.0; OFF=$(python3 -c "print($D-2*$X)")   # D = 원본 길이
ffmpeg -i "$SRC" -an -filter_complex \
 "[0:v]hue=s=0[g];[g]split=2[a][b];\
[a]trim=start=$X,setpts=PTS-STARTPTS[main];\
[b]trim=end=$X,setpts=PTS-STARTPTS[head];\
[main][head]xfade=transition=fade:duration=$X:offset=$OFF,fps=24,format=yuv420p[o]" \
 -map "[o]" -c:v ffv1 loop_ref.mkv

TAG="-color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709"
ffmpeg -i loop_ref.mkv -an -c:v libx264 -preset veryslow -crf 30 -profile:v high \
  -pix_fmt yuv420p $TAG -movflags +faststart navy.mp4
ffmpeg -i loop_ref.mkv -an -c:v libvpx-vp9 -crf 44 -b:v 0 -row-mt 1 -cpu-used 1 \
  -pix_fmt yuv420p -color_range tv navy.webm
ffmpeg -i navy.mp4 -vf "select=eq(n\,0)" -vsync 0 poster.png   # → navy.webp (quality 88)
```

`-color_range tv` 를 빼먹지 마세요. 안 붙이면 mp4 는 범위 태그가 `unknown` 으로
나가고, webm 은 `tv` 로 나가서 **브라우저에 따라 대비가 미묘하게 달라집니다.**

두 코덱의 crf 값(30 / 44)은 화질이 맞도록 맞춰 놓은 짝입니다 — 실측 luma PSNR
37.1dB / 37.0dB. 한쪽만 바꾸면 브라우저에 따라 화질이 달라집니다.

## 이미 적용된 안전장치

- 남색 그라데이션 장막을 위에 덮어 글자 가독성을 지킵니다 (아래로 갈수록 진하게)
- **영상을 아예 안 받는 경우** — 이때는 `navy.webp` 정지 배경이 남습니다
  - `prefers-reduced-motion` (모션 최소화) · `saveData` · 2G급 회선
- 영상은 **하이드레이션 뒤에** 붙습니다 (첫 페인트를 막지 않음)
- 섹션이 화면 밖으로 나가면 재생을 멈춥니다 — 한 페이지에 영상이 셋이라
  이게 없으면 전부 동시에 돌아갑니다
- CSP: `media-src 'self'` · `img-src 'self'` — 자기 출처 파일만 뜹니다

## 대비 실측 (루프 8개 시점 × 2뷰포트)

글자가 실제로 찍히는 자리만 측정한 최악값입니다.

| | 최저 대비 | 판정 |
|---|---|---|
| 데스크톱 1280 · 경계 섹션 | 6.46:1 | AA 이상 |
| 데스크톱 1280 · 마무리 | 8.18:1 | AAA |
| 모바일 390 · 경계 섹션 | 6.77:1 | AA 이상 |
| 모바일 390 · 마무리 | 8.04:1 | AAA |

영상 불투명도를 올리면 이 값이 내려갑니다. 만질 때 다시 재세요.
