"use client";

/* 좁은 화면에서 메뉴는 옆으로 밀어 보는 한 줄이다. 기본 위치가 왼쪽이라 오른쪽 묶음(인텔)에
   있는 화면을 열면 정작 "지금 여기" 가 잘려 안 보였다. 붙는 즉시 지금 있는 곳을 가운데로 민다.
   자바스크립트가 없으면 손으로 밀면 되는 정도라 화면이 깨지지는 않는다. */

import { useEffect } from "react";

export default function NavScroll() {
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>(".gnb");
    const on = nav?.querySelector<HTMLElement>("a.on");
    if (!nav || !on || nav.scrollWidth <= nav.clientWidth) return;
    const left = on.getBoundingClientRect().left - nav.getBoundingClientRect().left + nav.scrollLeft;
    nav.scrollLeft = Math.max(0, left - (nav.clientWidth - on.offsetWidth) / 2);
  }, []);
  return null;
}
