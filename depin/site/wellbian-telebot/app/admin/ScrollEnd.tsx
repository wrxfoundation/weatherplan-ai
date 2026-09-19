"use client";

/* 막대는 왼쪽이 과거, 오른쪽이 지금이다. 칸이 화면보다 많아 가로 스크롤이 생기면
   기본 위치가 왼쪽이라 정작 봐야 할 "지금" 이 잘려 보이지 않는다 —
   그룹 분위기를 보려고 만든 화면에서 이게 제일 큰 문제였다.

   붙는 즉시 오른쪽 끝으로 민다. 자바스크립트가 없으면 손으로 밀면 되는 정도라
   화면이 깨지지는 않는다. */

import { useEffect, useRef } from "react";

export default function ScrollEnd({ children, className }: {
  children: React.ReactNode; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);
  return <div ref={ref} className={className}>{children}</div>;
}
