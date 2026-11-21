"use client";
/* 관리자 콘솔 "시스템·용량" 탭 (2026-09-06).
   100만 기기 대비: 지금 하루에 쌓이는 원시 측정 행수·바이트를 실측해 기기 수에 비례해 외삽하고,
   DB 플랜 한도 대비 도달 시점과 "현 구조로 감당 가능한 기기 수"를 보여준다.
   트래픽(일 방문자·페이지뷰·API 호출)은 자체 카운터, 기기 유입은 DeviceIngestLog 로 본다. */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { SystemSnapshot } from "@/lib/system-stats";
import { toast } from "@/components/Toast";
import { Pager, SortTh, usePager, useSort, type SortSpec } from "@/components/admin/sortable";
import TrafficSources from "@/components/admin/TrafficSources";
import type { SourceDayRow } from "@/lib/traffic-source-table";

interface Cfg { planLimitGb: number; alertPct: number; retentionYears: number; readingsPerDevicePerDay: number; ingestLogRetentionDays: number }
interface DayTraffic { page: number; api: number; bot: number; visitors: number }
interface Hist { day: string; dbBytes: number; rawRows: number; rawBytes: number; ingestLogRows: number; ingestLogBytes: number; devices: number; activeDevices: number; rawRows24h: number; pageViews: number; visitors: number; apiHits: number }

const GB = 1024 ** 3;
const fmtB = (b: number) => b >= GB * 1024 * 1024 ? `${(b / GB / 1024 / 1024).toFixed(2)} PB` : b >= GB * 1024 ? `${(b / GB / 1024).toFixed(2)} TB` : b >= GB ? `${(b / GB).toFixed(2)} GB` : b >= 1024 ** 2 ? `${(b / 1024 ** 2).toFixed(1)} MB` : b >= 1024 ? `${(b / 1024).toFixed(0)} KB` : `${Math.round(b)} B`;
const fmtN = (n: number) => n.toLocaleString("ko-KR");
const fmtK = (n: number) => n >= 1e8 ? `${(n / 1e8).toFixed(1)}억` : n >= 1e4 ? `${(n / 1e4).toFixed(n >= 1e6 ? 0 : 1)}만` : fmtN(Math.round(n));
const PRESETS = [1000, 10000, 100000, 1000000];

/* 표 정렬·페이지 (2026-09-09 지시) */
type TrafficRow = DayTraffic & { day: string };
const TRAFFIC_SORT: SortSpec<TrafficRow> = { day: (t) => t.day, visitors: (t) => t.visitors, page: (t) => t.page, api: (t) => t.api, bot: (t) => t.bot };
const TABLE_SORT: SortSpec<SystemSnapshot["tables"][number]> = { name: (t) => t.name, rows: (t) => t.rows, data: (t) => t.tableBytes, index: (t) => t.indexBytes, bytes: (t) => t.bytes, share: (t) => t.bytes };
const HIST_SORT: SortSpec<Hist> = {
  day: (h) => h.day, db: (h) => h.dbBytes, rawRows: (h) => h.rawRows, rawBytes: (h) => h.rawBytes, log: (h) => h.ingestLogBytes,
  devices: (h) => h.devices, in24: (h) => h.rawRows24h, visitors: (h) => h.visitors, page: (h) => h.pageViews, api: (h) => h.apiHits,
};

export default function SystemPanel({ secret }: { secret: string }) {
  const [now, setNow] = useState<SystemSnapshot | null>(null);
  const [traffic, setTraffic] = useState<Record<string, DayTraffic>>({});
  const [hist, setHist] = useState<Hist[]>([]);
  /* 유입 소스별 방문자·페이지뷰 (2026-09-26) - ready=false 면 DB 에 소스 열이 아직 없다 */
  const [sources, setSources] = useState<{ ready: boolean; rows: SourceDayRow[] }>({ ready: false, rows: [] });
  const [cfg, setCfg] = useState<Cfg>({ planLimitGb: 8, alertPct: 70, retentionYears: 1, readingsPerDevicePerDay: 1440, ingestLogRetentionDays: 30 });
  const [draft, setDraft] = useState<Cfg | null>(null);
  const [simDevices, setSimDevices] = useState(100000);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const H = { "x-admin-secret": secret, "Content-Type": "application/json" };

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/system", { headers: H, cache: "no-store" });
    const d = await r.json();
    if (!r.ok) { setMsg(d.error || "조회 실패"); toast.err(d.error || "조회 실패"); return; }
    setNow(d.now); setTraffic(d.trafficDays); setHist(d.history); setCfg(d.cfg);
    setSources(d.trafficSources ?? { ready: false, rows: [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret]);
  useEffect(() => { load(); }, [load]);

  const save = async (body: Record<string, unknown>) => {
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/admin/system", { method: "PUT", headers: H, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) { setMsg(d.error || "저장 실패"); toast.err(d.error || "저장 실패"); return; }
      setMsg(body.snapshot ? "스냅샷 저장됨" : "설정 저장됨"); toast.ok(body.snapshot ? "스냅샷 저장됨" : "설정 저장됨"); setDraft(null); await load();
    } finally { setBusy(false); }
  };

  /* ── 실측 기반 용량 모델 ── */
  const model = useMemo(() => {
    if (!now) return null;
    const active = Math.max(1, now.devices.active24h);
    const rowsPerDevDay = now.raw.last24h > 0 ? now.raw.last24h / active : cfg.readingsPerDevicePerDay;
    const bytesPerRow = now.raw.bytesPerRow || 120;                     // 인덱스 포함 실측 (없으면 보수적 기본값)
    const logBytesPerDevDay = now.ingestLog.last24h > 0 ? (now.ingestLog.last24h / active) * (now.ingestLog.bytesPerRow || 700) : 0;
    const rawBytesPerDevDay = rowsPerDevDay * bytesPerRow;
    const perDevDay = rawBytesPerDevDay + logBytesPerDevDay;
    const limit = cfg.planLimitGb * GB;
    const usedPct = limit ? (now.db.bytes / limit) * 100 : 0;
    const todayGrowth = now.raw.last24h * bytesPerRow + now.ingestLog.last24h * (now.ingestLog.bytesPerRow || 0);
    const daysToLimit = todayGrowth > 0 ? Math.max(0, (limit - now.db.bytes) / todayGrowth) : Infinity;
    const capacityDevices = perDevDay > 0 ? Math.floor(limit / (rawBytesPerDevDay * 365 * cfg.retentionYears + logBytesPerDevDay * Math.min(365 * cfg.retentionYears, cfg.ingestLogRetentionDays))) : Infinity;
    const sim = (devices: number) => {
      const rowsDay = devices * rowsPerDevDay;
      const bytesDay = devices * perDevDay;
      const rawOnlyDay = devices * rawBytesPerDevDay;
      const logDay = devices * logBytesPerDevDay;
      const logCap = logDay * Math.min(365, cfg.ingestLogRetentionDays);   // 로그는 보존일치까지만 쌓인다
      const daysTo = bytesDay > 0 ? Math.max(0, (limit - now.db.bytes) / bytesDay) : Infinity;
      return { devices, rowsDay, rowsYear: rowsDay * 365, bytesDay, bytesMonth: rawOnlyDay * 30 + logDay * Math.min(30, cfg.ingestLogRetentionDays), bytesYear: rawOnlyDay * 365 + logCap, rawOnlyYear: rawOnlyDay * 365, daysTo, ingestPerSec: rowsDay / 86400 };
    };
    return { rowsPerDevDay, bytesPerRow, logBytesPerDevDay, rawBytesPerDevDay, perDevDay, limit, usedPct, todayGrowth, daysToLimit, capacityDevices, sim };
  }, [now, cfg]);

  const checks = useMemo(() => {
    if (!now || !model) return [];
    const out: { level: "ok" | "warn" | "bad"; text: string }[] = [];
    out.push(model.usedPct >= cfg.alertPct ? { level: "bad", text: `DB 용량 ${model.usedPct.toFixed(1)}% 사용 - 플랜 한도(${cfg.planLimitGb} GB)에 근접했습니다. 플랜 상향 또는 파티셔닝·아카이브가 필요합니다.` }
      : model.usedPct >= cfg.alertPct / 2 ? { level: "warn", text: `DB 용량 ${model.usedPct.toFixed(1)}% 사용 - 경고선(${cfg.alertPct}%) 도달 예상 ${isFinite(model.daysToLimit) ? Math.round(model.daysToLimit * (cfg.alertPct / 100)) + "일 후" : "-"}.` }
      : { level: "ok", text: `DB 용량 ${model.usedPct.toFixed(1)}% 사용 (${fmtB(now.db.bytes)} / ${cfg.planLimitGb} GB). 현재 유입 속도로 한도까지 ${isFinite(model.daysToLimit) ? Math.round(model.daysToLimit) + "일" : "충분"}.` });
    const logShare = now.db.bytes ? (now.ingestLog.bytes / now.db.bytes) * 100 : 0;
    if (logShare > 40) out.push({ level: "warn", text: `수신 로그(DeviceIngestLog)가 DB 의 ${logShare.toFixed(0)}% 를 차지합니다. 측정값(TelemetryRaw)의 ${(now.ingestLog.bytes / Math.max(1, now.raw.bytes)).toFixed(1)}배입니다. 보존일 ${cfg.ingestLogRetentionDays}일이 지난 로그는 매일 정리 크론이 지웁니다 - 로그가 ${cfg.ingestLogRetentionDays}일치로 안정되면 비중이 내려갑니다.` });
    else out.push({ level: "ok", text: `수신 로그 비중 ${logShare.toFixed(0)}% - 정상 범위.` });
    const connPct = now.db.maxConn ? (now.db.conns / now.db.maxConn) * 100 : 0;
    out.push(connPct > 70 ? { level: "warn", text: `DB 연결 ${now.db.conns}/${now.db.maxConn} (${connPct.toFixed(0)}%) - 커넥션 풀(PgBouncer) 한도에 가깝습니다.` } : { level: "ok", text: `DB 연결 ${now.db.conns}/${now.db.maxConn} (${connPct.toFixed(0)}%).` });
    if (now.db.cacheHitPct !== null) out.push(now.db.cacheHitPct < 95 ? { level: "warn", text: `캐시 적중률 ${now.db.cacheHitPct}% - 95% 미만이면 메모리(컴퓨트) 상향을 검토하세요.` } : { level: "ok", text: `캐시 적중률 ${now.db.cacheHitPct}%.` });
    const m = model.sim(1000000);
    out.push({ level: m.bytesYear > model.limit ? "warn" : "ok", text: `100만 기기 기준 하루 ${fmtK(m.rowsDay)}행(초당 ${fmtN(Math.round(m.ingestPerSec))}건) · ${fmtB(m.bytesDay)}/일 · ${fmtB(m.bytesYear)}/년. 이 규모는 단일 Postgres 테이블로는 불가능하고 시계열 파티셔닝(월별) + 콜드 스토리지 아카이브(Parquet/S3) + 수집 경로 분리(큐)가 필요합니다.` });
    const stale = now.devices.total - now.devices.active24h;
    if (now.devices.total && stale / now.devices.total > 0.3) out.push({ level: "warn", text: `등록 기기 ${now.devices.total}대 중 24시간 내 미수신 ${stale}대 (${Math.round(stale / now.devices.total * 100)}%).` });
    return out;
  }, [now, model, cfg]);

  const days = Object.keys(traffic).sort();
  const trafficRows = useMemo<TrafficRow[]>(() => Object.keys(traffic).sort().reverse().map((d) => ({ day: d, ...traffic[d] })), [traffic]);
  const trafficSort = useSort(trafficRows, TRAFFIC_SORT); const trafficPager = usePager(trafficSort.sorted);
  const tableRows = useMemo(() => now?.tables ?? [], [now]);
  const tableSort = useSort(tableRows, TABLE_SORT); const tablePager = usePager(tableSort.sorted);
  const histRows = useMemo(() => [...hist].reverse(), [hist]);
  const histSort = useSort(histRows, HIST_SORT); const histPager = usePager(histSort.sorted);
  const maxPage = Math.max(1, ...days.map((d) => traffic[d].page));
  const maxVis = Math.max(1, ...days.map((d) => traffic[d].visitors));

  if (!now || !model) return <div className="note">{msg || "시스템 현황 불러오는 중…"}</div>;
  const s = now;
  const simRow = model.sim(simDevices);

  return (
    <div>
      {/* KPI */}
      <div className="stats-grid" style={{ marginBottom: 16 }}>
        <Kpi k="DB 총 용량" v={fmtB(s.db.bytes)} sub={`플랜 한도 ${cfg.planLimitGb} GB 의 ${model.usedPct.toFixed(1)}%`} tone={model.usedPct >= cfg.alertPct ? "bad" : model.usedPct >= cfg.alertPct / 2 ? "warn" : "ok"} />
        <Kpi k="원시 측정 행수" v={fmtK(s.raw.rows)} sub={`${fmtB(s.raw.bytes)} · 행당 ${s.raw.bytesPerRow} B · 24h +${fmtK(s.raw.last24h)}`} />
        <Kpi k="기기 유입 (24h)" v={fmtK(s.ingestLog.last24h)} sub={`활성 기기 ${s.devices.active24h}/${s.devices.total} · 10분 내 ${s.devices.active10m}`} />
        <Kpi k="오늘 방문자" v={fmtN(s.traffic.visitorsToday)} sub={`페이지뷰 ${fmtN(s.traffic.today.page ?? 0)} · API ${fmtN(s.traffic.today.api ?? 0)} · 봇 ${fmtN(s.traffic.today.bot ?? 0)}`} />
        <Kpi k="하루 증가량 (실측)" v={fmtB(model.todayGrowth)} sub={`한도 도달까지 ${isFinite(model.daysToLimit) ? Math.round(model.daysToLimit) + "일" : "-"}`} />
        <Kpi k="감당 가능 기기 수" v={isFinite(model.capacityDevices) ? fmtK(model.capacityDevices) + "대" : "-"} sub={`현 플랜·${cfg.retentionYears}년 보존 기준 · 기기당 ${fmtB(model.perDevDay)}/일`} tone={model.capacityDevices < 100000 ? "warn" : "ok"} />
      </div>

      {/* 체크리스트 */}
      <div className="feed-wrap" style={{ marginBottom: 16 }}>
        <div className="feed-head"><span className="feed-head-title">대비 체크리스트</span><span className="dim">{new Date(s.at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} 기준</span></div>
        <div style={{ padding: "6px 14px 10px" }}>
          {checks.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--line)", fontSize: 13.5, lineHeight: 1.55 }}>
              <span style={{ flex: "none", width: 8, height: 8, marginTop: 7, borderRadius: 99, background: c.level === "bad" ? "#dc2626" : c.level === "warn" ? "#d97706" : "#16a34a" }} />
              <span>{c.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 용량 시뮬레이터 */}
      <div className="feed-wrap" style={{ marginBottom: 16 }}>
        <div className="feed-head"><span className="feed-head-title">용량 시뮬레이터 · 기기 수에 따른 데이터 증가</span><span className="dim">기기당 하루 {fmtN(Math.round(model.rowsPerDevDay))}행 · {fmtB(model.perDevDay)} (실측 외삽)</span></div>
        <div style={{ padding: "10px 14px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {PRESETS.map((p) => <button key={p} className={simDevices === p ? "btn-primary" : "btn-ghost"} onClick={() => setSimDevices(p)} style={{ padding: "6px 12px", fontSize: 13 }}>{fmtK(p)}대</button>)}
          <input className="field-input" type="number" min={1} value={simDevices} onChange={(e) => setSimDevices(Math.max(1, Number(e.target.value) || 1))} style={{ width: 140 }} />
          <span className="dim" style={{ fontSize: 12.5 }}>기기 수를 직접 입력할 수도 있습니다</span>
        </div>
        <div className="feed-table-scroll">
          <table className="feed-table compact">
            <thead><tr><th>기기 수</th><th>하루 행수</th><th>초당 유입</th><th>하루 증가</th><th>한 달</th><th>1년</th><th>1년 (측정값만)</th><th>현 플랜 한도 도달</th></tr></thead>
            <tbody>
              {[...new Set([...PRESETS, simDevices])].sort((a, b) => a - b).map((n) => { const r = model.sim(n); const over = r.bytesYear * cfg.retentionYears > model.limit; return (
                <tr key={n} style={n === simDevices ? { background: "var(--w-tint, #eef)" } : undefined}>
                  <td><b>{fmtK(n)}대</b></td><td className="num">{fmtK(r.rowsDay)}</td><td className="num">{fmtN(Math.round(r.ingestPerSec))}/s</td>
                  <td className="num">{fmtB(r.bytesDay)}</td><td className="num">{fmtB(r.bytesMonth)}</td>
                  <td className="num" style={{ color: over ? "#dc2626" : undefined, fontWeight: over ? 700 : undefined }}>{fmtB(r.bytesYear)}</td>
                  <td className="num">{fmtB(r.rawOnlyYear)}</td>
                  <td className="num">{isFinite(r.daysTo) ? (r.daysTo < 1 ? "1일 미만" : r.daysTo > 3650 ? "10년 이상" : `${Math.round(r.daysTo)}일`) : "-"}</td>
                </tr>); })}
            </tbody>
          </table>
        </div>
        <p className="dim" style={{ fontSize: 12.5, padding: "8px 14px 12px", margin: 0, lineHeight: 1.6 }}>
          선택 {fmtK(simRow.devices)}대: 하루 {fmtB(simRow.bytesDay)}, 1년 {fmtB(simRow.bytesYear)}. 권장 대응 단계 - <b>1만대 이하</b>: 현재 구조(단일 테이블+인덱스) 유지, 플랜 디스크만 상향. <b>10만대</b>: TelemetryRaw 월별 파티셔닝(pg_partman) + 수신 로그 보존기간 30일 + 읽기 전용 리플리카. <b>100만대</b>: 수집을 큐(Kafka/Kinesis)로 분리, 시계열 DB(TimescaleDB/ClickHouse) 또는 Parquet 콜드 아카이브(S3)로 원본 영구 보존, Postgres 에는 최근 N일 + 시간별 집계만.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 16, marginBottom: 16 }}>
        {/* 트래픽 30일 */}
        <div className="feed-wrap">
          <div className="feed-head"><span className="feed-head-title">일일 방문자 · 페이지뷰 · API 호출 (30일)</span><span className="dim">자체 계측 · 봇 제외</span></div>
          <div style={{ padding: "10px 14px 4px" }}>
            {days.length === 0 ? <p className="dim" style={{ fontSize: 13 }}>아직 집계된 트래픽이 없습니다. 배포 직후부터 쌓입니다.</p> : (
              <svg viewBox={`0 0 ${Math.max(300, days.length * 22)} 120`} style={{ width: "100%", height: 130, display: "block" }}>
                {days.map((d, i) => { const t = traffic[d]; const x = i * 22; return (
                  <g key={d}>
                    <rect x={x + 2} y={110 - (t.page / maxPage) * 100} width={8} height={(t.page / maxPage) * 100} fill="#c7c7f0" />
                    <rect x={x + 11} y={110 - (t.visitors / maxVis) * 100} width={8} height={(t.visitors / maxVis) * 100} fill="#4d4dce" />
                    <text x={x + 11} y={118} fontSize={7} textAnchor="middle" fill="#64748b">{d.slice(5)}</text>
                  </g>); })}
              </svg>
            )}
            <div className="dim" style={{ fontSize: 12, display: "flex", gap: 14 }}><span><i style={{ display: "inline-block", width: 10, height: 10, background: "#c7c7f0", marginRight: 4 }} />페이지뷰</span><span><i style={{ display: "inline-block", width: 10, height: 10, background: "#4d4dce", marginRight: 4 }} />방문자</span></div>
          </div>
          <div className="feed-table-scroll" style={{ maxHeight: 260, overflow: "auto" }}>
            <table className="feed-table compact">
              <thead><tr>
                {([["day","날짜"],["visitors","방문자"],["page","페이지뷰"],["api","API 호출"],["bot","봇"]] as [string, string][]).map(([k, label]) => (
                  <SortTh key={k} k={k} sortKey={trafficSort.sortKey} dir={trafficSort.dir} onToggle={trafficSort.toggle}>{label}</SortTh>
                ))}
              </tr></thead>
              <tbody>{trafficPager.slice.map((t) => <tr key={t.day}><td className="mono">{t.day}</td><td className="num">{fmtN(t.visitors)}</td><td className="num">{fmtN(t.page)}</td><td className="num">{fmtN(t.api)}</td><td className="num dim">{fmtN(t.bot)}</td></tr>)}</tbody>
            </table>
          </div>
          <Pager p={trafficPager} unit="일" />
        </div>

        {/* 저장소 테이블 */}
        <div className="feed-wrap">
          <div className="feed-head"><span className="feed-head-title">저장소 · 테이블별 용량</span><span className="dim">{s.db.version}</span></div>
          <div className="feed-table-scroll" style={{ maxHeight: 420, overflow: "auto" }}>
            <table className="feed-table compact">
              <thead><tr>
                {([["name","테이블"],["rows","행수(추정)"],["data","데이터"],["index","인덱스"],["bytes","합계"],["share","비중"]] as [string, string][]).map(([k, label]) => (
                  <SortTh key={k} k={k} sortKey={tableSort.sortKey} dir={tableSort.dir} onToggle={tableSort.toggle}>{label}</SortTh>
                ))}
              </tr></thead>
              <tbody>{tablePager.slice.map((t) => <tr key={t.name}><td className="mono">{t.name}</td><td className="num">{fmtK(t.rows)}</td><td className="num">{fmtB(t.tableBytes)}</td><td className="num">{fmtB(t.indexBytes)}</td><td className="num"><b>{fmtB(t.bytes)}</b></td><td className="num">{s.db.bytes ? (t.bytes / s.db.bytes * 100).toFixed(1) : 0}%</td></tr>)}</tbody>
            </table>
          </div>
          <Pager p={tablePager} unit="개" />
          <p className="dim" style={{ fontSize: 12.5, padding: "8px 14px 12px", margin: 0 }}>원시 측정값 보존 범위: {s.raw.oldest ? new Date(s.raw.oldest).toLocaleDateString("ko-KR") : "-"} ~ {s.raw.newest ? new Date(s.raw.newest).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) : "-"} · 시간별 집계 {fmtK(s.hourly.rows)}행 · 측정값 삭제 정책 없음(영구 보존) · 수신 로그는 {cfg.ingestLogRetentionDays}일 보관 후 폐기</p>
        </div>
      </div>

      {/* 유입 소스별 방문자 · 페이지뷰 + 내려받기 (2026-09-26) */}
      <TrafficSources ready={sources.ready} rows={sources.rows} daily={traffic} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 16, marginBottom: 16 }}>
        {/* DB 상태 + 크론 */}
        <div className="feed-wrap">
          <div className="feed-head"><span className="feed-head-title">DB 상태 · 예약 작업</span></div>
          <div style={{ padding: "10px 14px", fontSize: 13.5, lineHeight: 1.8 }}>
            <div>연결 <b>{s.db.conns}</b> / {s.db.maxConn} (실행 중 {s.db.activeConns}) · 캐시 적중률 <b>{s.db.cacheHitPct ?? "-"}%</b></div>
            <div>원시 유입: 최근 1시간 <b>{fmtN(s.raw.last1h)}</b>행 · 24시간 <b>{fmtN(s.raw.last24h)}</b>행 · 기기당 하루 {fmtN(Math.round(model.rowsPerDevDay))}행</div>
            <div>수신 로그: {fmtK(s.ingestLog.rows)}행 · {fmtB(s.ingestLog.bytes)} · 행당 {fmtN(s.ingestLog.bytesPerRow)} B · 24시간 +{fmtK(s.ingestLog.last24h)}</div>
            <div style={{ marginTop: 6 }} className="dim">DB 예약 작업(pg_cron)</div>
            {s.cron.length === 0 ? <div className="dim">없음</div> : s.cron.map((c) => <div key={c.name} className="mono" style={{ fontSize: 12.5 }}>{c.active ? "●" : "○"} {c.name} <span className="dim">{c.schedule}</span></div>)}
          </div>
        </div>

        {/* 설정 */}
        <div className="feed-wrap">
          <div className="feed-head"><span className="feed-head-title">용량 기준 설정</span></div>
          <div style={{ padding: "10px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {([["planLimitGb", "DB 플랜 한도 (GB)"], ["alertPct", "경고 기준 (%)"], ["retentionYears", "보존 목표 (년)"], ["readingsPerDevicePerDay", "기기당 하루 측정 횟수 (실측 없을 때)"], ["ingestLogRetentionDays", "수신 로그 보존일 (측정값은 영구)"]] as const).map(([k, label]) => (
              <label key={k} style={{ fontSize: 12.5 }}>
                <span className="dim">{label}</span>
                <input className="field-input" type="number" value={(draft ?? cfg)[k]} onChange={(e) => setDraft({ ...(draft ?? cfg), [k]: Number(e.target.value) })} style={{ marginTop: 4 }} />
              </label>
            ))}
          </div>
          <div style={{ padding: "0 14px 12px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button className={`btn-primary${busy ? " is-busy" : ""}`} disabled={busy || !draft} onClick={() => draft && save({ ...draft })} style={{ padding: "8px 14px", fontSize: 13 }}>저장</button>
            <button className={`btn-ghost${busy ? " is-busy" : ""}`} disabled={busy} onClick={() => save({ snapshot: true })} style={{ padding: "8px 14px", fontSize: 13 }}>지금 스냅샷 저장</button>
            <button className={`btn-ghost${busy ? " is-busy" : ""}`} disabled={busy} onClick={load} style={{ padding: "8px 14px", fontSize: 13 }}>새로고침</button>
            {msg && <span className="dim" style={{ fontSize: 12.5 }}>{msg}</span>}
          </div>
          <p className="dim" style={{ fontSize: 12, padding: "0 14px 12px", margin: 0, lineHeight: 1.6 }}>Supabase 플랜 기본 디스크: Free 0.5 GB · Pro 8 GB(초과분 GB당 과금) · 컴퓨트 애드온으로 확장. 한도를 바꾸면 위 게이지와 도달 예상이 다시 계산됩니다. 스냅샷은 매일 정리 크론이 자동 저장합니다.</p>
        </div>
      </div>

      {/* 일별 스냅샷 추이 */}
      <div className="feed-wrap">
        <div className="feed-head"><span className="feed-head-title">일별 추이 (스냅샷)</span><span className="dim">최근 {hist.length}일</span></div>
        <div className="feed-table-scroll" style={{ maxHeight: 320, overflow: "auto" }}>
          <table className="feed-table compact">
            <thead><tr>
              {([["day","날짜"],["db","DB 용량"],["rawRows","원시 행수"],["rawBytes","원시 용량"],["log","수신 로그"],["devices","기기(활성)"],["in24","24h 유입"],["visitors","방문자"],["page","페이지뷰"],["api","API"]] as [string, string][]).map(([k, label]) => (
                <SortTh key={k} k={k} sortKey={histSort.sortKey} dir={histSort.dir} onToggle={histSort.toggle}>{label}</SortTh>
              ))}
            </tr></thead>
            <tbody>
              {hist.length === 0 ? <tr><td colSpan={10} className="dim">아직 스냅샷이 없습니다. &ldquo;지금 스냅샷 저장&rdquo;을 누르거나 다음 정리 크론을 기다리세요.</td></tr>
                : histPager.slice.map((h) => <tr key={h.day}><td className="mono">{h.day}</td><td className="num">{fmtB(h.dbBytes)}</td><td className="num">{fmtK(h.rawRows)}</td><td className="num">{fmtB(h.rawBytes)}</td><td className="num">{fmtB(h.ingestLogBytes)}</td><td className="num">{h.devices} ({h.activeDevices})</td><td className="num">{fmtK(h.rawRows24h)}</td><td className="num">{fmtN(h.visitors)}</td><td className="num">{fmtN(h.pageViews)}</td><td className="num">{fmtN(h.apiHits)}</td></tr>)}
            </tbody>
          </table>
        </div>
        <Pager p={histPager} unit="일" />
      </div>
    </div>
  );
}

function Kpi({ k, v, sub, tone }: { k: string; v: string; sub?: string; tone?: "ok" | "warn" | "bad" }) {
  return (
    <div className="stat-cell span-2">
      <div className="stat-cell-k">{k}</div>
      <div className="stat-cell-v" style={{ fontSize: 24, color: tone === "bad" ? "#dc2626" : tone === "warn" ? "#d97706" : undefined }}>{v}</div>
      {sub && <div className="stat-cell-delta">{sub}</div>}
    </div>
  );
}
