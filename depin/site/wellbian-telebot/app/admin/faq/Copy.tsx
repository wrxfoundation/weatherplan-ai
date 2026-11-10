"use client";

/* 답변 복사 (8/30 서우 — "듀얼 모니터로 보면서 응대")

   보면서 옮겨 적으면 오타가 나고, 오타가 난 답이 그대로 커뮤니티에 남는다.
   정본을 그대로 집어 가는 길을 열어 둔다.

   클립보드가 막힌 환경(비보안 컨텍스트, 권한 거부)에서는 조용히 실패하지 않고
   그 사실을 버튼에 적는다 — 눌렀는데 아무 일도 없으면 붙여넣기 할 때야 안다. */

import { useState } from "react";

export default function Copy({ text, label = "복사" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("done");
    } catch {
      setState("fail");
    }
    setTimeout(() => setState("idle"), 1600);
  };

  return (
    <button type="button" className={`copy${state === "done" ? " done" : state === "fail" ? " fail" : ""}`}
            onClick={copy}
            title={state === "fail" ? "브라우저가 클립보드를 막았습니다 — 직접 선택해 복사하세요" : "답변을 클립보드로"}>
      {state === "done" ? "복사됨" : state === "fail" ? "복사 안 됨" : label}
    </button>
  );
}
