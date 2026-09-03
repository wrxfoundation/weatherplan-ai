#!/bin/sh
# Measured Room 자산을 assets/ 에 받아 둔다. 비워 둬도 페이지는 CDN 에서 바로 불러오므로 선택 사항(오프라인 부스·장기 배포용).
# 장면 사진(기기 없음, 1600px JPEG) 13장 · 같은 구도 영상 루프 13편(Kling 3.0 pro, 5초, 첫 프레임 = 사진) · 기기 컷아웃 PNG(배경 제거, 1024×938)
# 생성 작업 ID: 밤·창 열림 3장 60f1f46a(거실) / 3829f756(침실) / 091e81c6(부엌) · 기기 484fc2a2 → 배경 제거 22ef5055
set -e
cd "$(dirname "$0")/assets"
IMG=https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC
GEN=https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC
get() { echo "$1"; curl -fsSL -o "$1" "$2"; }
get device.png              $IMG/f6aa6c49-ba85-4c10-91a5-1f8cedd11563.png
get living-dusk.jpg         $IMG/fd732637-3131-482a-9a1c-9331bb473167.jpg
get living-window.jpg       $IMG/e0d1dbe2-bdc0-4096-86f1-5b2b5d7c2034.jpg
get living-night.jpg        $IMG/d0c5e4e1-c28d-4ded-ae2f-6a1a6aa5702a.jpg
get living-night-window.jpg $IMG/a6137c4a-91c7-44c9-8742-815e945cdad4.jpg
get bedroom-evening.jpg     $IMG/29bacff3-b7bd-44df-9b42-aa41b58e2fdf.jpg
get bedroom-night.jpg       $IMG/87f4c37b-d8e2-4d5c-a4f1-70e89ba4691e.jpg
get bedroom-night-window.jpg $IMG/87b26b91-eaf7-43b0-ac30-f6d320c461ba.jpg
get bedroom-morning.jpg     $IMG/c6d6d5ec-b793-455d-9977-e9adf1c51b2e.jpg
get kitchen-idle.jpg        $IMG/86dc96a7-afa3-40b3-8ce9-61c14de6a1bf.jpg
get kitchen-cook.jpg        $IMG/4a7aab4a-e21a-4307-8dc2-5fac2bca5deb.jpg
get kitchen-vent.jpg        $IMG/a5412bc8-3256-41a8-8b66-fb97c935da36.jpg
get kitchen-night.jpg       $IMG/0abbbc92-1c64-477a-b05d-72ac79acfab2.jpg
get kitchen-night-window.jpg $IMG/4e44e4c1-56ae-49a6-8d7a-5c3a55cf0b56.jpg
get living-dusk.mp4         $GEN/hf_20260902_235658_8df91bac-67f6-494c-94b4-c58bf40d60da.mp4
get living-window.mp4       $GEN/hf_20260902_235658_6a11398d-e15a-4db4-a844-59b774d17b2a.mp4
get living-night.mp4        $GEN/hf_20260902_235658_c2900432-0742-49f5-9e63-878f29fa0dbf.mp4
get living-night-window.mp4 $GEN/hf_20260903_000340_e82ec00e-4fba-4aa8-b918-bdf1daa0290c.mp4
get bedroom-evening.mp4     $GEN/hf_20260902_235659_d8b95d7f-102c-45ee-a913-6580526cec59.mp4
get bedroom-night.mp4       $GEN/hf_20260902_235658_6bd51df1-c585-4e9c-9b50-6197349be352.mp4
get bedroom-night-window.mp4 $GEN/hf_20260903_000341_59218a4f-c007-4a48-8246-dfdc9183dbd9.mp4
get bedroom-morning.mp4     $GEN/hf_20260902_235658_4498923c-58dc-4c60-8973-77803b240424.mp4
get kitchen-idle.mp4        $GEN/hf_20260902_235658_09134379-3cf2-4d05-9ae9-d476d46a9bd7.mp4
get kitchen-cook.mp4        $GEN/hf_20260902_235658_917da3a6-76a3-4b72-85ac-08ce51c47cb0.mp4
get kitchen-vent.mp4        $GEN/hf_20260902_235658_61831fe4-4d12-4126-a260-e935db6e53c1.mp4
get kitchen-night.mp4       $GEN/hf_20260902_235658_f849d640-3d43-4887-b0b0-f1615aeb7a17.mp4
get kitchen-night-window.mp4 $GEN/hf_20260903_000341_8af427ad-501d-4448-b8be-c567fe45b50b.mp4
ls -l
