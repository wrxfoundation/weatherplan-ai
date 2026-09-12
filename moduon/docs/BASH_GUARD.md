# Bash 가드 훅 (`.claude/hooks/guard.cjs`)

문서에만 있던 규칙을 **실행 가능한 차단**으로 바꾼 것.
ECC(MIT, github.com/affaan-m/ECC)의 `hooks/` 구조를 우리 규모로 가져왔다.
286개 스킬을 통째로 설치하지 않고, ECC 저자 본인의 권고 — "계획 하나와 단일 규칙 팩으로
시작하세요. 스킬이 많다고 해서 반드시 더 나은 결과를 얻는 것은 아닙니다" — 대로
규칙 팩 하나(`moduon/CLAUDE.md`)와 훅 하나만 취했다.

## 막는 것 — 전부 이 프로젝트에서 실제로 당한 실패다

| # | 트리거 | 왜 |
|---|---|---|
| ① | `pkill -f "vite preview"` | 패턴이 이 명령줄 자체에 매칭돼 셸이 먼저 죽는다(exit 144). 두 번 당했다. 대괄호로 자기매칭을 끊으라고 안내한다 |
| ② | 레포 루트에서 `npm run build/qa/dev` | 루트는 Next, moduon은 Vite. 엉뚱한 앱이 빌드된다 |
| ③ | `git commit -m` 메시지에 괄호·백틱·달러 | 셸 파싱이 깨져 커밋이 조용히 실패한다. `-F <파일>`을 쓰라고 안내한다 |
| ④ | moduon 소스를 건드렸는데 `npm run qa` 미통과 | 검증 안 된 상태로 커밋되는 것을 막는다 |

④의 동작: `npm run qa`가 통과하면 `scripts/lib/qa-stamp.cjs`가 감시 대상
(`src`·`scripts`·`index.html`·`package.json`·설정 2종)의 워킹트리 해시를 `.qa-pass`에 찍는다.
훅은 커밋 시점에 같은 해시를 다시 계산해 대조한다. 해시 계산은 그 모듈 한 곳에만 있다.
문서·에셋만 고친 커밋은 감시 대상이 아니므로 게이트를 그냥 지나간다.

**규칙을 늘리려면 근거가 있어야 한다.** 겪지 않은 실패는 넣지 않는다 —
훅은 많을수록 좋은 게 아니라, 걸리는 게 정당할 때만 신뢰를 얻는다.

## 설계 원칙: fail open

내부 오류·판단 불가 시 **무조건 통과**시킨다. 훅이 일을 막는 것은 훅이 없는 것보다 나쁘다.
stdin이 닫히지 않아도 8초 뒤 통과한다.

## 켜는 법 — 사람이 직접 해야 한다

훅 설정은 자동 명령 실행을 켜는 파일이라 에이전트가 쓸 수 없게 막혀 있다(그게 맞다).
레포 루트에 `.claude/settings.json`을 만들고 아래를 넣으면 활성화된다.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/guard.cjs",
            "timeout": 20,
            "statusMessage": "가드 확인 중"
          }
        ]
      }
    ]
  }
}
```

이미 그 파일이 있다면 통째로 덮지 말고 `hooks.PreToolUse` 배열에 **합쳐야** 한다.
저장 후 `/hooks`를 한 번 열면 설정이 다시 읽힌다. 끄거나 고치는 것도 `/hooks`에서 한다.
훅을 켜지 않아도 나머지는 그대로 동작한다 — 게이트가 자동이 아니라 수동일 뿐이다.

## 손으로 확인하는 법

레포 루트에서:

```
echo '{"tool_name":"Bash","tool_input":{"command":"npm run qa"}}' | node .claude/hooks/guard.cjs
```

출력이 비면 통과, JSON이 나오면 차단이며 `permissionDecisionReason`에 이유가 담긴다.
