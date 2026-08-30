/* 목록 거르기 — 대시보드와 내보내기가 같은 규칙을 쓴다.
   두 곳에 따로 쓰면 "화면에서 본 것과 받은 파일이 다른" 일이 생기고,
   그건 숫자를 못 믿게 만들어 대시보드 전체를 무용지물로 만든다. */

import type { CsItem } from "./store";

export type Filters = {
  status?: string; topic?: string; kind?: string; sev?: string; q?: string;
};

export const applyFilters = (items: CsItem[], f: Filters): CsItem[] => {
  const q = (f.q ?? "").trim().toLowerCase();
  return items.filter((i) =>
    (!f.status || i.status === f.status) &&
    (!f.topic || i.topic === f.topic) &&
    (!f.sev || (i.sev ?? "low") === f.sev) &&
    (!f.kind || (f.kind === "open" ? i.kind !== "matched" : i.kind === "matched")) &&
    /* 검색은 원문과 처리 메모, 그리고 사람까지 훑는다 — "그 사람이 뭐라고 했더라"가
       실제로 가장 자주 찾는 형태다 */
    (!q || `${i.text} ${i.note ?? ""} ${i.who}`.toLowerCase().includes(q)));
};

const KST = (ms: number) => {
  const d = new Date(ms + 9 * 3600000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
};

const KIND_LABEL: Record<string, string> = {
  unanswered: "답변 없음", matched: "후보 제시", offline: "정본 미로딩",
};
const SEV: Record<string, string> = { high: "긴급", mid: "주의", low: "일반" };
const MOOD: Record<string, string> = { negative: "부정", positive: "긍정", question: "의문" };
const STATUS: Record<string, string> = { new: "신규", doing: "처리중", done: "완료", faq: "FAQ 반영" };

/* 쉼표·따옴표·줄바꿈이 든 원문이 표를 깨뜨리지 않게 RFC 4180 대로 감싼다 */
const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;

export const toCsv = (items: CsItem[]): string => {
  const head = ["시각(KST)", "긴급도", "상태", "종류", "주제", "어조", "언어", "채팅", "사용자", "원문", "메모"];
  const rows = items.map((i) => [
    KST(i.at), SEV[i.sev ?? "low"] ?? "", STATUS[i.status] ?? i.status,
    KIND_LABEL[i.kind] ?? i.kind, i.topic, MOOD[i.mood] ?? i.mood, i.lang,
    i.chatType === "private" ? "1:1" : "그룹", i.who, i.text, i.note ?? "",
  ]);
  /* 맨 앞 BOM — 없으면 엑셀이 UTF-8 을 못 알아채 한글이 깨진다 */
  return "﻿" + [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
};
