#!/bin/sh
# Measured Room 자산을 assets/ 에 받아 둔다. 비워 둬도 페이지는 CDN 에서 바로 불러오므로 선택 사항.
# 생성 작업 ID(힉스필드): 거실 17d630f2 / fdb82af1(창) / 8d42922f(밤) · 침실 09df37f7 / 335bf4b4(밤) / 7643b6b3(아침) ·
#   부엌 51b39380 / cd7e0dd0(조리) / f167d735(환기) / 8c2cb1a0(밤) · 기기 efb00451(GLB)
set -e
cd "$(dirname "$0")/assets"
IMG=https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC
GEN=https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC
get() { echo "$1"; curl -fsSL -o "$1" "$2"; }
get living-dusk.jpg     $IMG/fd732637-3131-482a-9a1c-9331bb473167.jpg
get living-window.jpg   $IMG/e0d1dbe2-bdc0-4096-86f1-5b2b5d7c2034.jpg
get living-night.jpg    $IMG/d0c5e4e1-c28d-4ded-ae2f-6a1a6aa5702a.jpg
get bedroom-evening.jpg $IMG/29bacff3-b7bd-44df-9b42-aa41b58e2fdf.jpg
get bedroom-night.jpg   $IMG/87f4c37b-d8e2-4d5c-a4f1-70e89ba4691e.jpg
get bedroom-morning.jpg $IMG/c6d6d5ec-b793-455d-9977-e9adf1c51b2e.jpg
get kitchen-idle.jpg    $IMG/86dc96a7-afa3-40b3-8ce9-61c14de6a1bf.jpg
get kitchen-cook.jpg    $IMG/4a7aab4a-e21a-4307-8dc2-5fac2bca5deb.jpg
get kitchen-vent.jpg    $IMG/a5412bc8-3256-41a8-8b66-fb97c935da36.jpg
get kitchen-night.jpg   $IMG/0abbbc92-1c64-477a-b05d-72ac79acfab2.jpg
get device.glb          $IMG/a2e16b89-d7e2-438e-848a-a375b1918599.glb
# 원본(7.8MB, 텍스처 2048): $GEN/hf_20260902_152637_efb00451-21c3-42a8-b35d-69f81bdb4895.glb
ls -l
