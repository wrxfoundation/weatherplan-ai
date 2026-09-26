#!/usr/bin/env bash
# ============================================================
# Pick AI · 배경 영상 배치 스크립트 (히어로 · 푸터 CTA)
#
# 가장 간단한 사용법 — pickai 폴더에서 인자 없이 실행하면 끝:
#
#     bash scripts/add-hero-video.sh
#
#   → B(스캔 스윕) 영상을 public/hero.mp4 로
#   → D(레이어 분해) 영상을 public/footer.mp4 로
#   → ffmpeg이 있으면 무음·저용량 재인코딩 + 첫 프레임 포스터까지 자동
#
# 특정 영상만 바꾸고 싶을 때:
#     bash scripts/add-hero-video.sh "<URL 또는 로컬 파일>"           # → hero
#     bash scripts/add-hero-video.sh "<URL 또는 로컬 파일>" footer    # → footer
#
# ffmpeg이 없어도 동작한다(원본을 그대로 배치하고 안내만 출력).
# ============================================================
set -euo pipefail

# ── 기본 영상 (Higgsfield · Seedance 2.0 · 1080p · 무음 · 5초) ──
HERO_URL="https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260725_141405_47fcb8a0-0554-4de1-83ad-2a5230fba301.mp4"
FOOTER_URL="https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260725_141409_426258c6-162d-447f-95df-33db8380c502.mp4"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUBLIC="$ROOT/public"
mkdir -p "$PUBLIC"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# place <소스(URL 또는 경로)> <hero|footer>
place() {
  local src="$1" target="$2"
  local raw="$TMP/$target-raw.mp4"
  local out="$PUBLIC/$target.mp4"
  local poster="$PUBLIC/$target-poster.jpg"

  echo "── $target ──────────────────────────────"
  case "$src" in
    http://*|https://*)
      echo "▸ 다운로드"
      curl -fL --progress-bar -o "$raw" "$src"
      ;;
    *)
      [ -f "$src" ] || { echo "파일을 찾을 수 없습니다: $src" >&2; return 1; }
      echo "▸ 로컬 파일 사용: $src"
      cp "$src" "$raw"
      ;;
  esac

  if command -v ffmpeg >/dev/null 2>&1; then
    echo "▸ 무음·저용량 재인코딩"
    ffmpeg -y -loglevel error -i "$raw" \
      -an -vcodec libx264 -crf 30 -preset slow -pix_fmt yuv420p \
      -movflags +faststart "$out"
    echo "▸ 포스터(첫 프레임) 추출"
    ffmpeg -y -loglevel error -i "$raw" -vframes 1 -q:v 4 "$poster"
  else
    echo "▸ ffmpeg 없음 — 원본을 그대로 배치"
    cp "$raw" "$out"
  fi

  ls -lh "$out" | awk '{print "  ✓ " $NF " (" $5 ")"}'
  [ -f "$poster" ] && ls -lh "$poster" | awk '{print "  ✓ " $NF " (" $5 ")"}'

  local kb; kb=$(du -k "$out" | cut -f1)
  if [ "$kb" -gt 2048 ]; then
    echo "  ⚠ 2MB 초과(${kb}KB) — 첫 화면 로딩에 영향을 줍니다."
    echo "    ffmpeg -i <원본> -an -vcodec libx264 -crf 34 -preset slow -movflags +faststart $out"
  fi
  echo
}

SRC="${1:-}"
TARGET="${2:-hero}"

if [ -z "$SRC" ]; then
  # 인자 없음 → 기본 영상 두 개 모두 배치
  place "$HERO_URL" hero
  place "$FOOTER_URL" footer
else
  case "$TARGET" in
    hero|footer) ;;
    *) echo "두 번째 인자는 hero 또는 footer 여야 합니다 (받은 값: $TARGET)" >&2; exit 1 ;;
  esac
  place "$SRC" "$TARGET"
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "※ ffmpeg이 없어 원본을 그대로 배치했습니다."
  echo "  설치 후 다시 실행하면 용량을 크게 줄이고 포스터 이미지도 만들어 줍니다."
  echo "  (mac: brew install ffmpeg · ubuntu: sudo apt install ffmpeg)"
  echo
fi

echo "완료. 이제 배포하면 히어로·푸터에 영상이 적용됩니다."
