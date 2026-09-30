#!/usr/bin/env bash
# 회사 전달용 단독 저장소 zip 만들기.
#
# 이 앱은 weatherplan-ai 모노레포 안의 kcare-app 폴더에서 개발됐다. 회사 저장소에서는 이 폴더가
# 저장소 루트가 되고, 모노레포의 docs/kcare 문서(요구사항 · 회의록 · 디자인 핸드오프 · 결정 기록)가
# docs/ 로 합쳐진다. 커밋된 것만 담는다 (git archive) — node_modules · .next · .env.local 은 들어가지 않는다.
#
# 사용: kcare-app 안에서  bash scripts/package-standalone.sh [출력.zip]
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
SHA="$(git -C "$ROOT" rev-parse --short HEAD)"
OUT="${1:-$ROOT/kcare-beta-github-$SHA.zip}"
NAME="kcare-beta"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/$NAME/docs"

git -C "$ROOT" archive HEAD:kcare-app | tar -x -C "$TMP/$NAME"
if git -C "$ROOT" cat-file -e HEAD:docs/kcare 2>/dev/null; then
  git -C "$ROOT" archive HEAD:docs/kcare | tar -x -C "$TMP/$NAME/docs"
fi

# 키 흔적이 섞여 들어가지 않았는지 마지막으로 본다 — 접두어 뒤에 실제 키 본문이 붙은 모양만 잡는다
# (Anthropic · 토스 시크릿 · 구글 클라이언트 보안 비밀). 이 스크립트 자신은 패턴 글자를 담고 있어 뺀다.
KEY_RE='sk-ant-[a-z0-9]+-[A-Za-z0-9_-]{20,}|(test|live)_g?sk_[A-Za-z0-9]{12,}|GOCSPX-[A-Za-z0-9_-]{20,}'
if grep -rIlE --exclude=package-standalone.sh "$KEY_RE" "$TMP/$NAME" >/dev/null 2>&1; then
  echo "키로 보이는 문자열이 들어 있어 중단합니다:" >&2
  grep -rIlE --exclude=package-standalone.sh "$KEY_RE" "$TMP/$NAME" | sed "s|$TMP/$NAME/||" >&2
  exit 1
fi
[ -e "$TMP/$NAME/.env.local" ] && { echo ".env.local 이 들어 있어 중단합니다." >&2; exit 1; }

rm -f "$OUT"
(cd "$TMP" && zip -qr "$OUT" "$NAME")
echo "$OUT ($(find "$TMP/$NAME" -type f | wc -l | tr -d ' ') files)"
