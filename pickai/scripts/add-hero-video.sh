#!/usr/bin/env bash
# ============================================================
# Pick AI · 히어로 배경 영상 배치 스크립트
#
# 사용:
#   bash scripts/add-hero-video.sh "<영상 URL 또는 로컬 파일 경로>"
#
# 하는 일:
#   1) 영상을 내려받아 public/hero.mp4 로 배치
#   2) ffmpeg이 있으면 무음·저용량(H.264)으로 재인코딩 — 히어로 배경은
#      첫 화면 로딩을 잡아먹으므로 용량을 줄이는 편이 좋다
#   3) ffmpeg이 있으면 첫 프레임을 public/hero-poster.jpg 로 추출
#
# ffmpeg이 없어도 동작한다(원본을 그대로 배치하고 안내만 출력).
# ============================================================
set -euo pipefail

SRC="${1:-}"
if [ -z "$SRC" ]; then
  echo "사용법: bash scripts/add-hero-video.sh \"<영상 URL 또는 로컬 파일 경로>\"" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUBLIC="$ROOT/public"
mkdir -p "$PUBLIC"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
RAW="$TMP/raw.mp4"

case "$SRC" in
  http://*|https://*)
    echo "▸ 다운로드: $SRC"
    curl -fL --progress-bar -o "$RAW" "$SRC"
    ;;
  *)
    [ -f "$SRC" ] || { echo "파일을 찾을 수 없습니다: $SRC" >&2; exit 1; }
    echo "▸ 로컬 파일 사용: $SRC"
    cp "$SRC" "$RAW"
    ;;
esac

if command -v ffmpeg >/dev/null 2>&1; then
  echo "▸ 무음·저용량 재인코딩"
  ffmpeg -y -loglevel error -i "$RAW" \
    -an -vcodec libx264 -crf 30 -preset slow -pix_fmt yuv420p \
    -movflags +faststart "$PUBLIC/hero.mp4"

  echo "▸ 포스터(첫 프레임) 추출"
  ffmpeg -y -loglevel error -i "$RAW" -vframes 1 -q:v 4 "$PUBLIC/hero-poster.jpg"
else
  echo "▸ ffmpeg 없음 — 원본을 그대로 배치합니다"
  cp "$RAW" "$PUBLIC/hero.mp4"
  echo "  (권장) ffmpeg 설치 후 다시 실행하면 용량을 크게 줄이고 포스터도 만들어 줍니다"
fi

echo
echo "완료:"
ls -lh "$PUBLIC/hero.mp4" 2>/dev/null || true
ls -lh "$PUBLIC/hero-poster.jpg" 2>/dev/null || true
echo
SIZE_KB=$(du -k "$PUBLIC/hero.mp4" | cut -f1)
if [ "$SIZE_KB" -gt 2048 ]; then
  echo "⚠ hero.mp4 가 2MB를 넘습니다(${SIZE_KB}KB). 히어로 배경은 첫 화면 로딩에 직접 영향을 주므로"
  echo "  -crf 값을 32~36으로 올려 다시 인코딩하는 것을 권합니다."
fi
