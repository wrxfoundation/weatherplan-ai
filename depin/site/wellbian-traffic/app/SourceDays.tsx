"use client";
/* 세션 소스 × 날짜 표 (9/26 서우 — "일자별 세션 소스 별로 보고싶은데")

   행 = 세션 소스(GA 화면과 같은 이름), 열 = 날짜(또는 주), 칸 = 그날 그 소스에서 시작된 세션.
   두 가지 물음을 한 표로 푼다 — 「9/16 에 어디서 왔나」(열을 읽는다, 날짜 머리를 누르면 그날 많은 순)와
   「pixie 는 언제 들어왔나」(행을 읽는다, 소스 찾기).

   칸 색은 브랜드 남색 한 가지의 다섯 단계. 구간을 고정(1–2 · 3–9 · 10–29 · 30–99 · 100+)해서
   일/주를 바꾸거나 필터를 걸어도 같은 색이 같은 크기를 뜻한다. 숫자가 주인공이고 색은 0 과 아닌 칸,
   큰 칸을 가려 주는 보조다. 채널 색 점은 lib/traffic.ts 의 판정을 그대로 쓴다.

   열이 50개를 넘으므로 표는 가로로 스크롤하고, 소스 이름과 합계 두 열은 고정한다. 처음 열 때와 일/주를
   바꿀 때 맨 오른쪽(최근)으로 옮겨 둔다. 마우스를 올리면 그 열과 행이 옅게 칠해지고, 칸을 누르면(휴대폰은
   누르는 수밖에 없다) 표 위에 그 칸의 풀이가 한 줄 뜬다.

   (9/26 서우 "사용자수 기준이야") 세션 / 사용자 전환. 사용자는 더할 수 없어서 합계 열·합계 줄은 서버가 GA 에서 받은
   중복 제거 값이다(lib/source-daily.ts pivotUsers). 거르기(찾기·채널)를 해도 합계 줄은 전체 사용자 그대로 두고 그렇게 적는다 —
   거른 소스들의 중복 제거 합은 GA 에 다시 묻지 않는 한 알 수 없다. 사용자 기본 — 서우의 기준이 사용자다. */

import { useEffect, useMemo, useRef, useState } from "react";
import { CHANNEL, CHANNELS, weekStart, type Channel } from "@/lib/traffic";
import { rollWeeks, type SdGran, type SdPivot } from "@/lib/source-daily";

const fmt = (x: number) => x.toLocaleString("ko-KR");
const BINS = [1, 3, 10, 30, 100];
const heat = (v: number) => BINS.reduce((h, b) => (v >= b ? h + 1 : h), 0);
const BIN_LABEL = ["1–2", "3–9", "10–29", "30–99", "100+"];
const TOP = 25;

const Sw = ({ c }: { c: Channel }) => {
  const m = CHANNEL[c];
  return <i className={`tf-sw${m.hatch ? " hatch" : ""}`} style={m.hatch ? undefined : { background: m.color }} />;
};

type Metric = "users" | "sessions";

export default function SourceDays({ day, users, today }: {
  day: SdPivot; users: { day: SdPivot; week: SdPivot | null } | null; today: string;
}) {
  const [metric, setMetric] = useState<Metric>(users ? "users" : "sessions");
  const [gran, setGran] = useState<SdGran>("day");
  const [q, setQ] = useState("");
  const [ch, setCh] = useState<Channel | "all">("all");
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [all, setAll] = useState(false);
  const [pick, setPick] = useState<{ s: string; c: number } | null>(null);
  const week = useMemo(() => rollWeeks(day), [day]);
  const up = users ? (gran === "day" ? users.day : users.week) : null;
  const isUsers = metric === "users" && up !== null;
  const p = isUsers && up ? up : gran === "day" ? day : week;
  const noun = isUsers ? "사용자" : "세션";

  const scroller = useRef<HTMLDivElement>(null);
  const hl = useRef<HTMLStyleElement>(null);
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [gran, metric]);

  /* 열 강조 — 3천 칸을 다시 그리지 않고 규칙 한 줄만 바꾼다 */
  const mark = (c: string) => {
    const st = hl.current;
    if (!st || st.dataset.c === c) return;
    st.dataset.c = c;
    st.textContent = c ? `.sd-t [data-c="${c}"]{box-shadow:inset 0 0 0 99px rgba(77,77,206,.08)}` : "";
  };

  const nowIx = gran === "day"
    ? p.cols.findIndex((c) => c.key === today)
    : p.cols.findIndex((c) => c.key === weekStart(today));
  const needle = q.trim().toLowerCase();
  const rows = p.rows.filter((r) => (ch === "all" || r.channel === ch)
    && (!needle || r.source.toLowerCase().includes(needle) || r.mediums.some((m) => m.toLowerCase().includes(needle))));
  const sorted = sortCol === null ? rows : [...rows].sort((a, b) => b.cells[sortCol] - a.cells[sortCol] || b.total - a.total);
  const narrowed = ch !== "all" || needle !== "";
  const shown = all || narrowed ? sorted : sorted.slice(0, TOP);
  /* 사용자 합계 줄은 늘 전체(중복 제거) — 거른 소스끼리는 더할 수 없다 */
  const foot = isUsers ? p.colTotals : p.cols.map((_, i) => rows.reduce((s, r) => s + r.cells[i], 0));
  const footTotal = isUsers ? p.total : rows.reduce((s, r) => s + r.total, 0);
  const chans = CHANNELS
    .map((c) => ({ c, n: p.rows.filter((r) => r.channel === c.key).reduce((s, r) => s + r.total, 0) }))
    .filter((x) => x.n > 0);

  const unit = gran === "day" ? "그날" : "그 주";
  const sub = (i: number) => (i === nowIx ? (gran === "day" ? "오늘" : "이번 주") : gran === "day" ? (p.cols[i].long.match(/\((.)\)/)?.[1] ?? "") : "주");
  const tip = (source: string, i: number, v: number) => {
    const t = p.colTotals[i];
    return `${source} · ${p.cols[i].long}${i === nowIx ? " · 집계 중" : ""} · ${noun} ${fmt(v)}${t ? ` (${unit} 전체 ${noun} ${fmt(t)}의 ${Math.round((v / t) * 1000) / 10}%)` : ""}`;
  };
  const picked = pick ? p.rows.find((r) => r.source === pick.s) : undefined;
  const pickedOk = picked && pick && pick.c < p.cols.length;

  return (
    <div className="tf-card sd">
      <div className="sd-bar">
        <div className="tf-tabs" role="tablist" aria-label="무엇을 셀까" style={{ margin: 0 }}>
          {(["users", "sessions"] as const).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={metric === m} className={`chip${metric === m ? " on" : ""}`}
              disabled={m === "users" && !users} title={m === "users" && !users ? "GA 사용자 수를 읽지 못했습니다" : undefined}
              onClick={() => { setMetric(m); setSortCol(null); setPick(null); if (m === "users" && users && !users.week) setGran("day"); }}>
              {m === "users" ? "사용자" : "세션"}
            </button>
          ))}
        </div>
        <div className="tf-tabs" role="tablist" aria-label="묶는 단위" style={{ margin: 0 }}>
          {(["day", "week"] as const).map((g) => {
            const off = g === "week" && metric === "users" && users !== null && !users.week;
            return (
              <button key={g} type="button" role="tab" aria-selected={gran === g} className={`chip${gran === g ? " on" : ""}`}
                disabled={off} title={off ? "주별 사용자를 읽지 못했습니다 — 세션으로 바꾸면 주별이 보입니다" : undefined}
                onClick={() => { setGran(g); setSortCol(null); setPick(null); }}>
                {g === "day" ? "일별" : "주별"}
              </button>
            );
          })}
        </div>
        <input className="sd-q" type="search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="소스 찾기 — pixie, x_out, kol …" aria-label="세션 소스 찾기" />
        <span className="tf-tot">{p.cols.length}{gran === "day" ? "일" : "주"} · 소스 {fmt(p.rows.length)}개 · {noun} <b className="mono">{fmt(p.total)}</b>{isUsers ? " (중복 제거)" : ""}</span>
      </div>

      <div className="sd-chips" aria-label="채널로 거르기">
        <button type="button" className={`chip${ch === "all" ? " on" : ""}`} aria-pressed={ch === "all"} onClick={() => setCh("all")}>전체</button>
        {chans.map(({ c, n }) => (
          <button key={c.key} type="button" className={`chip${ch === c.key ? " on" : ""}`} aria-pressed={ch === c.key}
            onClick={() => setCh(ch === c.key ? "all" : c.key)}>
            <Sw c={c.key} />{c.label}{isUsers ? null : <> <span className="n">{fmt(n)}</span></>}
          </button>
        ))}
      </div>

      <p className="sd-pick" aria-live="polite">
        {pickedOk && picked && pick
          ? <><b>{tip(picked.source, pick.c, picked.cells[pick.c])}</b> <button type="button" onClick={() => setPick(null)} aria-label="풀이 닫기">✕</button></>
          : <span>칸을 누르면 {unit} 전체에서 그 소스가 차지한 몫이 여기 뜹니다. 날짜 머리를 누르면 {unit} 많은 순으로 줄을 세웁니다.{isUsers
            ? " 사용자는 날짜끼리 더하지 않습니다 — 여러 날 온 사람은 한 번만 세므로 합계 열·합계 줄(GA 가 중복을 뺀 값)이 칸의 합보다 작습니다." : ""}</span>}
      </p>

      <style ref={hl} />
      <div className="sd-scroll" ref={scroller} onMouseOver={(e) => mark((e.target as HTMLElement).closest<HTMLElement>("[data-c]")?.dataset.c ?? "")}
        onMouseLeave={() => mark("")}>
        <table className="sd-t">
          <caption className="sd-cap">세션 소스별 {gran === "day" ? "일별" : "주별"} 세션 — 행은 세션 소스, 열은 {gran === "day" ? "날짜" : "주(월요일 시작)"}</caption>
          <thead>
            <tr>
              <th scope="col" className="sd-s">세션 소스 <span className="sd-med">매체</span></th>
              <th scope="col" className="sd-n" aria-sort={sortCol === null ? "descending" : "none"}>
                <button type="button" onClick={() => setSortCol(null)} title="합계 많은 순">합계</button>
              </th>
              {p.cols.map((c, i) => (
                <th key={c.key} scope="col" data-c={i} className={`sd-d${c.off ? " sd-off" : ""}${i === nowIx ? " sd-now" : ""}`}
                  aria-sort={sortCol === i ? "descending" : "none"}>
                  <button type="button" onClick={() => setSortCol(sortCol === i ? null : i)} title={`${c.long} — ${unit} 많은 순으로 정렬`}>
                    {c.label}<small>{sub(i)}</small>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr><th scope="row" className="sd-s" style={{ color: "var(--dis)", fontWeight: 500 }}>맞는 소스가 없습니다</th><td className="sd-n" />{p.cols.map((c, i) => <td key={c.key} data-c={i} />)}</tr>
            )}
            {shown.map((r) => (
              <tr key={r.source}>
                <th scope="row" className="sd-s">
                  <span className="sd-src"><Sw c={r.channel} /><span className="sd-name" title={`${r.source} — ${CHANNEL[r.channel].label}`}>{r.source}</span></span>
                  <span className="sd-med">{r.mediums.join(" · ")}</span>
                </th>
                <td className="sd-n mono">{fmt(r.total)}</td>
                {r.cells.map((v, i) => (
                  <td key={i} data-c={i} className={`sd-h${heat(v)}${p.cols[i].off ? " sd-off" : ""}${i === nowIx ? " sd-now" : ""}${pick && pick.s === r.source && pick.c === i ? " sd-on" : ""}`}
                    title={v ? tip(r.source, i, v) : undefined} onClick={() => setPick(v ? { s: r.source, c: i } : null)}>
                    {v ? fmt(v) : ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className="sd-s">{isUsers
                ? <>전체 사용자 <span className="sd-med">중복 제거{narrowed ? " · 거르기와 무관" : ""}</span></>
                : <>합계 <span className="sd-med">{narrowed ? `거른 소스 ${rows.length}개` : `소스 ${rows.length}개 전부`}</span></>}</th>
              <td className="sd-n mono">{fmt(footTotal)}</td>
              {foot.map((v, i) => <td key={i} data-c={i} className={`mono${i === nowIx ? " sd-now" : ""}`}>{v ? fmt(v) : ""}</td>)}
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="sd-foot">
        {!narrowed && sorted.length > TOP && (
          <button type="button" className="btn" onClick={() => setAll(!all)}>
            {all ? `위 ${TOP}개만 보기` : `나머지 ${sorted.length - TOP}개 소스 더 보기`}
          </button>
        )}
        <span className="sd-key" aria-label="칸 색 구간">
          세션
          {BIN_LABEL.map((l, i) => <span key={l}><i className={`sd-h${i + 1}`} />{l}</span>)}
        </span>
      </div>
    </div>
  );
}
