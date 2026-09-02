#!/bin/sh
# Measured Room 자산을 assets/ 에 받아 둔다. 비워 둬도 페이지는 CDN 에서 바로 불러오므로 선택 사항(오프라인 부스·장기 배포용).
# 장면 사진(기기 렌더 포함, 1600px JPEG) = 힉스필드 Nano Banana Pro 편집본 · 영상 루프 = Kling 3.0 pro image-to-video(1756×1176, 5초, 첫 프레임 = 사진)
# 생성 작업 ID: 거실 aef113ff / 859f3145(창) / 092adf57(밤) · 침실 d5a7c1a0 / 1a3624ef(밤) / 4de77566(아침) · 부엌 64c5f4a6 / 00d738ec(조리) / 3ab71fb1(환기) / 0cee8b14(밤)
set -e
cd "$(dirname "$0")/assets"
IMG=https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC
GEN=https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC
get() { echo "$1"; curl -fsSL -o "$1" "$2"; }
get living-dusk.jpg     $IMG/032f828c-1006-4f89-b467-20ed1c006e98.jpg
get living-window.jpg   $IMG/bce7d982-4050-415d-916e-a3343f788ecb.jpg
get living-night.jpg    $IMG/18cf66b4-e226-470b-831a-d9bf78769c65.jpg
get bedroom-evening.jpg $IMG/380c00c0-b5eb-48e9-b4ce-174cc25d3249.jpg
get bedroom-night.jpg   $IMG/c768b884-34e5-4012-b9e6-982d2f0aa628.jpg
get bedroom-morning.jpg $IMG/bb70c4b6-7c5f-47af-bbfb-a81f358e18a4.jpg
get kitchen-idle.jpg    $IMG/5ec34b89-9bdc-4101-a713-e9e3f4af00a1.jpg
get kitchen-cook.jpg    $IMG/4ba59408-9f1c-48d5-bd8b-47dfc14bbb95.jpg
get kitchen-vent.jpg    $IMG/3e57eb4e-4242-4b46-a76c-3e98225808b2.jpg
get kitchen-night.jpg   $IMG/ebfdc902-50ff-4f25-a3e7-f93738029ab1.jpg
get living-dusk.mp4     $GEN/hf_20260902_222608_76465f7d-3a68-4a83-8f9b-f41ca00c05e7.mp4
get living-window.mp4   $GEN/hf_20260902_222608_37db8bf1-1fd4-4009-9107-390d814bb4db.mp4
get living-night.mp4    $GEN/hf_20260902_222433_070d13d8-119b-482f-b581-9a39e4daaec1.mp4
get bedroom-evening.mp4 $GEN/hf_20260902_222608_f418f545-6d35-4ef6-96d7-9a0c2513a102.mp4
get bedroom-night.mp4   $GEN/hf_20260902_222433_e97ce6ac-614b-4582-a133-aadeb4048471.mp4
get bedroom-morning.mp4 $GEN/hf_20260902_222608_bff369da-36cd-4c1e-adb1-38d3b591ec19.mp4
get kitchen-idle.mp4    $GEN/hf_20260902_222608_3e28c3fc-8d8c-4622-af19-15eaf034767c.mp4
get kitchen-cook.mp4    $GEN/hf_20260902_222432_3f9e041d-3992-4e78-b8f0-1b830caf5335.mp4
get kitchen-vent.mp4    $GEN/hf_20260902_222608_5b8f1c9e-8195-401b-bc5f-ad872ed33c41.mp4
get kitchen-night.mp4   $GEN/hf_20260902_222433_a055ae83-958a-4f94-8539-824decb02b0e.mp4
ls -l
