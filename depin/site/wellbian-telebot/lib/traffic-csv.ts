/* 유입 CSV 내보내기 (9/8 서우 — "csv로도 export할 수 있게 해줘")

   화면의 표를 그대로 파일로 낸다. 표별로 한 파일씩, 또는 전체를 구역으로 나눈 한 파일.
   일·주·월은 채널을 열로 펼친다 — 엑셀에서 바로 피벗 없이 누적 막대를 그릴 수 있게.
   맨 앞 BOM — 없으면 엑셀이 UTF-8 을 못 알아채 한글이 깨진다(인박스 내보내기와 같은 규칙).
   순수 계산이라 tools/traffic-check.mts 가 값을 고정해 둔다. */

import { CHANNELS, CHANNEL, channelOf, dayLong, type Bucket } from "./traffic";
import type { TrafficSnapshot } from "./ga";
import { xlsx, type Sheet } from "./xlsx";

export type CsvTable = "daily" | "weekly" | "monthly" | "channels" | "sources" | "content" | "campaigns" | "pages" | "all";
export const CSV_TABLES: { key: CsvTable; label: string }[] = [
  { key: "daily", label: "일별" },
  { key: "weekly", label: "주별" },
  { key: "monthly", label: "월별" },
  { key: "channels", label: "채널" },
  { key: "sources", label: "소스/매체" },
  { key: "content", label: "utm_content" },
  { key: "campaigns", label: "캠페인" },
  { key: "pages", label: "페이지" },
  { key: "all", label: "전체 한 파일" },
];
export const isCsvTable = (v: string | null): v is CsvTable => CSV_TABLES.some((t) => t.key === v);

type Row = (string | number)[];
const cell = (v: string | number) => {
  const s = String(v ?? "");
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const csvLines = (rows: Row[]) => rows.map((r) => r.map(cell).join(",")).join("\r\n");
const n = (v: string | undefined) => Number(v ?? 0) || 0;
const ymd = (k: string) => `${k.slice(0, 4)}-${k.slice(4, 6)}-${k.slice(6, 8)}`;
const CH = CHANNELS.map((c) => c.label);
const byCh = (b: Bucket) => CHANNELS.map((c) => b.by[c.key] ?? 0);

export const csvTables = (s: TrafficSnapshot): Record<Exclude<CsvTable, "all">, Row[]> => {
  const d = s.data;
  return {
    daily: [["날짜", "요일", "세션", ...CH], ...d.daily.map((b) => [ymd(b.key), dayLong(b.key).slice(-2, -1), b.total, ...byCh(b)])],
    weekly: [["주 시작(월)", "주", "세션", ...CH], ...d.weekly.map((b) => [ymd(b.key), b.long, b.total, ...byCh(b)])],
    monthly: [["월", "세션", ...CH], ...d.monthly.map((b) => [`${b.key.slice(0, 4)}-${b.key.slice(4, 6)}`, b.total, ...byCh(b)])],
    channels: [["채널", "세션", "비중(%)", "사용자", "신규 사용자", "참여 세션"],
      ...d.channels.map((c) => [CHANNEL[c.key].label, c.sessions, c.share, c.users, c.newUsers, c.engaged])],
    sources: [["소스", "매체", "채널", "세션", "사용자", "참여 세션"],
      ...d.sources.map((r) => [r.source, r.medium, CHANNEL[r.channel].label, r.sessions, r.users, r.engaged])],
    content: [["채널", "소스", "매체", "utm_content", "세션", "사용자"],
      ...s.byContent.map((r) => [CHANNEL[channelOf(r.sessionSource, r.sessionMedium)].label, r.sessionSource, r.sessionMedium,
        r.sessionManualAdContent === "(not set)" ? "" : r.sessionManualAdContent, n(r.sessions), n(r.activeUsers)])],
    campaigns: [["utm_campaign", "세션", "사용자"], ...s.byCampaign.map((r) => [r.sessionCampaignName, n(r.sessions), n(r.activeUsers)])],
    pages: [["경로", "조회", "사용자"], ...s.byPage.map((r) => [r.pagePath, n(r.screenPageViews), n(r.activeUsers)])],
  };
};

export const trafficCsv = (s: TrafficSnapshot, t: CsvTable): { name: string; csv: string } => {
  const all = csvTables(s);
  const name = `wellbian-traffic-${t}-${s.data.today}.csv`;
  if (t !== "all") return { name, csv: "﻿" + csvLines(all[t]) };
  /* 전체 — 구역마다 제목 행 하나, 구역 사이 빈 줄. 맨 위에 기준 시각. */
  const head: Row[] = [["wellbian.io 유입 · GA4"], ["집계 시작", s.since], ["기준일", ymd(s.data.today)], ["지난 30분 활성 사용자", s.realtime]];
  const parts = [csvLines(head)];
  for (const { key, label } of CSV_TABLES) {
    if (key === "all") continue;
    parts.push(csvLines([[`## ${label}`], ...all[key]]));
  }
  return { name, csv: "﻿" + parts.join("\r\n\r\n") };
};

/* ── 깨짐 대책 (9/8 서우 — "csv 깨져서 나와서") ──────────────────────
   UTF-8 BOM 을 붙여도 여는 프로그램이 BOM 을 무시하면 한글이 깨진다(구형 엑셀 · 일부 뷰어 · 한셀).
   두 가지를 더 낸다.
     · xlsx — 파일 안에 인코딩이 못 박혀 있어 어디서 열어도 같다. 표 하나가 시트 하나. 기본 추천.
     · UTF-16LE + 탭 — 엑셀이 "유니코드 텍스트" 로 확실히 읽는 형식. 확장자는 .csv 그대로 둔다. */
export type ExportFormat = "csv" | "csv16" | "xlsx";
export const isExportFormat = (v: string | null): v is ExportFormat => v === "csv" || v === "csv16" || v === "xlsx";

const tsvLines = (rows: Row[]) => rows.map((r) => r.map((v) => String(v ?? "").replace(/[\t\r\n]/g, " ")).join("\t")).join("\r\n");

export const trafficCsv16 = (s: TrafficSnapshot, t: CsvTable): { name: string; data: Buffer } => {
  const all = csvTables(s);
  const text = t !== "all"
    ? tsvLines(all[t])
    : [tsvLines([["wellbian.io 유입 · GA4"], ["집계 시작", s.since], ["기준일", ymd(s.data.today)], ["지난 30분 활성 사용자", s.realtime]]),
       ...CSV_TABLES.filter((x) => x.key !== "all").map(({ key, label }) => tsvLines([[`## ${label}`], ...all[key as Exclude<CsvTable, "all">]]))].join("\r\n\r\n");
  return { name: `wellbian-traffic-${t}-${s.data.today}-unicode.csv`, data: Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, "utf16le")]) };
};

export const trafficXlsx = (s: TrafficSnapshot): { name: string; data: Buffer } => {
  const all = csvTables(s);
  const sheets: Sheet[] = [
    { name: "요약", rows: [["항목", "값"], ["집계 시작", s.since], ["기준일", ymd(s.data.today)], ["지난 30분 활성 사용자", s.realtime],
      ["오늘 세션", s.data.kpi.today], ["이번 주 세션", s.data.kpi.week], ["런치 이후 세션", s.data.kpi.total],
      ["사용자", s.data.kpi.users], ["신규 사용자", s.data.kpi.newUsers], ["참여 세션", s.data.kpi.engaged]] },
    ...CSV_TABLES.filter((x) => x.key !== "all").map(({ key, label }) => ({ name: label, rows: all[key as Exclude<CsvTable, "all">] })),
  ];
  return { name: `wellbian-traffic-${s.data.today}.xlsx`, data: xlsx(sheets) };
};
