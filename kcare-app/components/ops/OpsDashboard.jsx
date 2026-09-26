// 통합 알림센터 첫 화면 — 요청서 2절 · 시안 "통합 건강·안전 관제".
// 첫 화면의 최우선 목적은 전체 어르신의 실시간 건강·안전상태 확인이다. 운영관리 영역(2-3)은 삭제하지 않고 맨 아래 접이식으로 내린다.
import { useMemo, useState } from "react";
import { Avatar, Btn, Empty, FeedPill, Note, Panel, PanelHead, Pill, SEV, SevBar, SevPill, Stamp, Stat, StatePill, TONE } from "./ui";
import HealthDrawer from "./OpsDashboard/HealthDrawer";
import { STEP_ORDER, useIncidents } from "../../lib/ops-sos";
import { NORMAL_SAMPLE, OPS_TODAY, PRIORITY, SYSTEMS, SYSTEM_STATE, TILES, TOTAL_ELDERS, WATCH_LINKED } from "../../lib/ops-health";
import { fmtClock, fmtDur, fmtElapsed, fmtTime, MIN, useNow } from "../../lib/ops-time";

const stepTitle = (k) => STEP_ORDER.find((s) => s.k === k)?.title || "—";

function tileSub(k, n, ctx) {
  switch (k) {
    case "all": return `워치 연결 ${WATCH_LINKED}명`;
    case "ok": return `전체의 ${((n / TOTAL_ELDERS) * 100).toFixed(1)}%`;
    case "warn": return "확인 필요";
    case "danger": return `SEV1 ${ctx.sev1}명 · 위험 ${n - ctx.sev1}명`;
    case "sos": return `미확인 ${ctx.newSos}건`;
    case "fall": return "낙상 의심 포함";
    case "vital": return "심박·혈중산소 기준 이탈";
    case "inactive": return "움직임·생활반응 없음";
    case "stale": return "2시간 이상";
    case "unworn": return "1시간 이상";
    case "battery": return "워치·센서 20% 이하";
    case "active": return "현장 파견·대응 진행";
    default: return "";
  }
}

// opsCount: 운영현황 안 '지금 처리할 일' 건수 — 접혀 있어도 숫자는 보인다. opsOpen: 어르신 부탁·긴급 건이 있으면 펼친 채로 시작.
export default function OpsDashboard({ onStartSos, onOpenSos, mapSlot, opsSlot, opsCount = null, opsOpen = false }) {
  const { open, start } = useIncidents();
  const now = useNow(1000);
  const [tile, setTile] = useState("all");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState(null);

  // 사건이 열린 고객은 사건의 상태·발생시각을 우선한다 — 같은 고객을 두 곳에서 다르게 보이지 않게
  const rows = useMemo(() => {
    const byName = Object.fromEntries(open.map((i) => [i.customer, i]));
    return PRIORITY.map((r) => {
      const inc = byName[r.name];
      if (!inc) return r;
      const sev = (SEV[inc.sev]?.rank ?? 9) < (SEV[r.sev]?.rank ?? 9) ? inc.sev : r.sev;
      return { ...r, sev, state: inc.state, startedAt: inc.startedAt, incidentId: inc.id, controller: inc.controller || r.controller, step: inc.step };
    }).sort((a, b) => {
      const d = (SEV[a.sev]?.rank ?? 9) - (SEV[b.sev]?.rank ?? 9);
      return d !== 0 ? d : (a.startedAt ?? -a.agoMin) - (b.startedAt ?? -b.agoMin);
    });
  }, [open]);

  const ctx = useMemo(() => ({
    sosNames: new Set(open.map((i) => i.customer)),
    activeNames: new Set(open.filter((i) => i.state === "active").map((i) => i.customer)),
    sev1: rows.filter((r) => r.sev === "sev1").length,
    newSos: open.filter((i) => i.state === "new").length,
  }), [open, rows]);

  const normalCount = TOTAL_ELDERS - rows.length;
  const counts = useMemo(() => Object.fromEntries(TILES.map((t) => {
    if (t.k === "all") return [t.k, TOTAL_ELDERS];
    if (t.k === "ok") return [t.k, normalCount];
    return [t.k, rows.filter((r) => t.filter(r, ctx)).length];
  })), [rows, ctx, normalCount]);

  const activeTile = TILES.find((t) => t.k === tile) || TILES[0];
  const filtered = useMemo(() => {
    const base = tile === "ok" ? [] : rows.filter((r) => activeTile.filter(r, ctx));
    const s = q.trim();
    return s ? base.filter((r) => r.name.includes(s) || r.signal.includes(s) || r.location.includes(s)) : base;
  }, [rows, tile, activeTile, ctx, q]);

  const rowAt = (r) => (r.startedAt ?? (now ? now - r.agoMin * MIN : null));

  function startSos(r) {
    const id = start({ name: r.name, age: r.age, sev: r.sev === "warn" || r.sev === "device" ? "danger" : r.sev, value: r.value, threshold: r.threshold, controller: "김태영" }, r.signal);
    setDetail(null);
    onStartSos?.(r.name, id);
  }

  const detailRow = rows.find((r) => r.name === detail) || null;

  return (
    <div className="space-y-4">
      <PanelHead
        title="통합 건강·안전 관제"
        sub="2026년 9월 22일 화요일 · 전체 서비스 대상자 실시간 현황"
        right={
          <>
            <Pill tone="ok" dot>LIVE {now ? fmtTime(now) : "--:--:--"}</Pill>
            <label htmlFor="ops-dash-q" className="sr-only">회원 이름·이상징후·위치 검색</label>
            <input id="ops-dash-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="회원·이상징후·위치 검색" className="card-glass w-[220px] rounded-[10px] px-3 py-1.5 text-[12px] font-medium text-navy outline-none focus:ring-1 focus:ring-gold" />
          </>
        }
      />

      {/* 2-1 상단 통합현황 12타일 — 클릭하면 아래 명단이 그 조건으로 걸러진다 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" role="group" aria-label="통합현황">
        {TILES.map((t) => (
          <Stat
            key={t.k}
            label={t.label}
            value={counts[t.k]}
            unit={t.k === "sos" || t.k === "active" || t.k === "fall" ? "건" : "명"}
            sub={tileSub(t.k, counts[t.k], ctx)}
            tone={t.k === "danger" || t.k === "sos" ? "danger" : t.tone === "danger" ? "warn" : t.tone}
            active={tile === t.k}
            onClick={() => setTile(tile === t.k ? "all" : t.k)}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* 2-2 이상징후 고객 우선목록 */}
        <Panel className="lg:col-span-7">
          <PanelHead
            title="우선 확인 대상"
            sub={`위험도·발생시각 순 자동 정렬 · ${tile === "all" ? "이상징후 전체" : activeTile.label} ${tile === "ok" ? "" : `${filtered.length}명`}`}
            right={tile !== "all" && <Btn ghost small tone="muted" onClick={() => setTile("all")}>필터 해제</Btn>}
          />
          {tile === "ok" ? (
            <div className="mt-3"><Empty>정상 상태 어르신은 아래 “정상 {normalCount}명 — 명단 보기”에서 확인합니다. 이상징후가 있는 고객만 이 목록에 올라옵니다.</Empty></div>
          ) : filtered.length === 0 ? (
            <div className="mt-3"><Empty>조건에 맞는 고객이 없습니다.</Empty></div>
          ) : (
            <ul className="mt-3 divide-y divide-navy/[.06]">
              {filtered.map((r) => {
                const at = rowAt(r);
                const isDanger = r.sev === "sev1" || r.sev === "danger";
                return (
                  <li key={r.id} className="flex gap-3 py-3">
                    <SevBar sev={r.sev} />
                    <button type="button" onClick={() => setDetail(r.name)} className="btn-press btn-inline shrink-0 self-start rounded-full" aria-label={`${r.name} 상세 확인`}>
                      <Avatar name={r.name} size={42} tone={isDanger ? "danger" : r.sev === "device" ? "device" : "navy"} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* 단독 버튼 — .btn-inline(문장 속 링크 예외)을 붙이면 23px 로 남아 터치 타깃 24px 를 못 넘는다 */}
                        <button type="button" onClick={() => setDetail(r.name)} className="btn-press rounded-md text-[15px] font-bold text-navy">{r.name}</button>
                        <span className="text-[12px] text-muted">{r.age}세</span>
                        <SevPill sev={r.sev} />
                        <StatePill state={r.state} />
                        {r.incidentId && <Pill tone="info">{r.incidentId}</Pill>}
                      </div>
                      <div className="mt-0.5 text-[13px] font-semibold text-ink">{r.signal}</div>
                      <dl className="mt-1.5 grid grid-cols-1 gap-x-4 gap-y-0.5 text-[12px] text-muted sm:grid-cols-2">
                        <div><dt className="inline">측정값 </dt><dd className="inline font-num font-bold" style={{ color: isDanger ? TONE.danger.fg : TONE[SEV[r.sev].tone].fg }}>{r.value}</dd></div>
                        <div><dt className="inline">기준값 </dt><dd className="inline">{r.threshold}</dd></div>
                        <div><dt className="inline">발생 </dt><dd className="inline font-num">{now && at ? fmtTime(at) : "—"} · 지속 {now && at ? fmtDur(now - at) : "—"}</dd></div>
                        <div><dt className="inline">마지막 정상값 </dt><dd className="inline">{r.lastNormal.text} <span className="font-num">({now ? fmtClock(now - r.lastNormal.agoMin * MIN) : "—"})</span></dd></div>
                        <div className="sm:col-span-2"><dt className="inline">위치 </dt><dd className="inline">{r.location}</dd></div>
                        <div className="flex flex-wrap items-center gap-1.5 sm:col-span-2">
                          <dt className="inline">마지막 수신</dt>
                          <dd className="inline"><Stamp at={now ? fmtTime(now - r.rxAgoMin * MIN) : "—"} /></dd>
                          <FeedPill feed={r.feed} />
                          <span>· 담당 관제사 {r.controller || "미배정"}</span>
                          {r.step && <span>· 현재 단계 {stepTitle(r.step)}</span>}
                        </div>
                      </dl>
                    </div>
                    <div className="flex shrink-0 flex-col items-end justify-between gap-2">
                      <Btn ghost small tone="navy" onClick={() => setDetail(r.name)}>상세 확인</Btn>
                      {r.incidentId ? (
                        <Btn small tone="danger" onClick={() => onOpenSos?.(r.incidentId)}>SOS 대응 보기</Btn>
                      ) : (
                        <Btn small tone="danger" onClick={() => startSos(r)}>SOS 대응 시작</Btn>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <details className="mt-3 rounded-xl bg-navy/[.04] px-4 py-2.5">
            <summary className="cursor-pointer text-[13px] font-bold text-green">정상 {normalCount}명 — 명단 보기</summary>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {NORMAL_SAMPLE.map((n) => (
                <button key={n} type="button" onClick={() => setDetail(n)} className="btn-press btn-inline rounded-full px-2.5 py-1 text-[12px] font-bold" style={{ background: TONE.ok.bg, color: TONE.ok.fg }}>
                  {n}
                </button>
              ))}
              <span className="self-center text-[12px] text-muted">외 {Math.max(0, normalCount - NORMAL_SAMPLE.length)}명 · 전체 명단은 어르신 탭에서</span>
            </div>
          </details>
        </Panel>

        {/* 오른쪽 열 — 지도 · 진행 중 SOS · 오늘의 운영업무 · 시스템 연동상태 */}
        <div className="space-y-4 lg:col-span-5">
          {mapSlot || (
            <Panel>
              <PanelHead title="실시간 관제 지도" sub="회원·컨시어지·SOS 위치" />
              <div className="mt-3"><Empty>지도 연동 대기 — 관제 지도 모듈이 이 자리에 들어옵니다.</Empty></div>
            </Panel>
          )}

          <Panel style={open.length ? { boxShadow: "inset 0 0 0 1.5px rgba(192,57,43,.45)" } : undefined}>
            <PanelHead title="진행 중 SOS" sub="사건별 독립 대응 · 경과시간" right={<Pill tone={open.length ? "danger" : "muted"}>{open.length}건</Pill>} />
            {open.length === 0 ? (
              <div className="mt-3"><Empty>진행 중인 SOS 사건이 없습니다.</Empty></div>
            ) : (
              <ul className="mt-3 space-y-2">
                {open.map((inc) => (
                  <li key={inc.id}>
                    <button type="button" onClick={() => onOpenSos?.(inc.id)} className="btn-press card-glass flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left">
                      <span className="font-num rounded-lg px-2 py-1 text-[15px] font-bold" style={{ background: TONE.danger.bg, color: TONE.danger.fg }}>
                        {now ? fmtElapsed(now - inc.startedAt) : "--:--"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-1.5 text-[13px]">
                          <span className="font-num font-bold text-navy">{inc.id}</span>
                          <span className="font-bold text-navy">{inc.customer}</span>
                          <SevPill sev={inc.sev} />
                          <StatePill state={inc.state} />
                        </span>
                        <span className="mt-0.5 block text-[12px] text-muted">{inc.cause} · {stepTitle(inc.step)}{inc.controller ? ` · ${inc.controller}` : " · 담당자 없음"}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel>
            <PanelHead title="오늘의 운영업무" sub="건강관제 이후 처리할 업무" />
            <div className="mt-3 grid grid-cols-3 gap-2">
              {OPS_TODAY.map((o) => <Stat key={o.label} label={o.label} value={o.value} unit={o.unit} sub={o.sub} tone={o.tone} />)}
            </div>
          </Panel>

          <Panel>
            <PanelHead title="시스템 연동상태" sub={<>마지막 확인 <Stamp at={now ? fmtTime(now - 9000) : "—"} prefix="" /></>} />
            <ul className="mt-2 divide-y divide-navy/[.06]">
              {SYSTEMS.map((s) => {
                const st = SYSTEM_STATE[s.state];
                return (
                  <li key={s.name} className="flex items-center justify-between gap-3 py-2">
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold text-ink">{s.name}</span>
                      <span className="block text-[11px] text-muted">{s.sub} · <Stamp at={now ? fmtTime(now - s.checkAgoSec * 1000) : "—"} prefix="확인" /></span>
                    </span>
                    <Pill tone={st.tone} dot>{st.label}</Pill>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </div>

      {/* 2-3 기존 운영관리 영역 — 삭제하지 않고 하단 접이식으로 */}
      <details className="card-glass rounded-[14px] px-[18px] py-3" open={opsOpen || undefined}>
        <summary className="cursor-pointer text-[15px] font-bold text-navy">
          운영현황{" "}
          {opsCount != null && (
            <Pill tone={opsCount > 0 ? (opsOpen ? "danger" : "warn") : "muted"} className="mr-1 align-middle">
              지금 처리할 일 {opsCount}건
            </Pill>
          )}{" "}
          <span className="text-[12px] font-semibold text-muted">— 건강관제 이후 처리할 업무 (방문 업무흐름 · 복지 매칭 · AI 배정 · 배차 그리드 · 핸드오프 · 수락 지연 · 아침 브리핑)</span>
        </summary>
        <div className="mt-3">{opsSlot || <Empty>운영관리 모듈이 이 자리에 들어옵니다.</Empty>}</div>
      </details>

      <Note>건강·센서 데이터는 참고자료이며 의료진의 진단을 대신하지 않습니다.</Note>

      <HealthDrawer name={detail} row={detailRow} open={!!detail} onClose={() => setDetail(null)} onStartSos={detailRow && !detailRow.incidentId ? () => startSos(detailRow) : null} />
    </div>
  );
}
