// 관제 콘솔 공용 원형 — 2026-09-16 시안 8장 + 2026-09-22 관제 개선 요청서(docx) 기준.
//
// 색 규칙 (요청서 19절 · 앱 공통 원칙):
//   · 빨강(#C0392B)은 실제 위험·SOS 에만 쓴다. 상거래·운영 숫자에는 쓰지 않는다.
//   · 위험도(sev) · 처리상태(state) · 기기상태(device) 는 서로 다른 표식으로 구분한다 —
//     위험도는 왼쪽 세로 막대와 배지, 처리상태는 글자 배지, 기기상태는 보라 계열.
//   · 정상 정보보다 예외 정보를 먼저 보이게 한다 — 목록은 위험도·발생시각순.
// 모든 실시간 값에는 마지막 수신 시각을 같이 쓴다 (요청서 3절) — <Stamp/> 로 붙인다.

export const TONE = {
  ok: { fg: "#1E7A5A", bg: "rgba(30,122,90,.12)", bar: "#1E7A5A" },
  warn: { fg: "#8A5D12", bg: "rgba(138,93,18,.12)", bar: "#C9862B" },
  danger: { fg: "#C0392B", bg: "rgba(192,57,43,.1)", bar: "#C0392B" },
  info: { fg: "#3B5C8A", bg: "rgba(59,92,138,.12)", bar: "#3B5C8A" },
  device: { fg: "#6E4FD8", bg: "rgba(110,79,216,.12)", bar: "#6E4FD8" },
  navy: { fg: "#0A1F3C", bg: "rgba(10,31,60,.08)", bar: "#0A1F3C" },
  muted: { fg: "#5C5A54", bg: "rgba(92,90,84,.1)", bar: "#B9B6AC" },
  gold: { fg: "#8A5D12", bg: "rgba(176,141,87,.18)", bar: "#B08D57" },
};

// 위험도 — 요청서 2-2 · 6-2. SEV1 이 가장 급하다.
export const SEV = {
  sev1: { label: "SEV1", tone: "danger", rank: 0 },
  danger: { label: "위험", tone: "danger", rank: 1 },
  warn: { label: "주의", tone: "warn", rank: 2 },
  device: { label: "기기", tone: "device", rank: 3 },
  ok: { label: "정상", tone: "ok", rank: 4 },
};

// 처리 상태 — 요청서 2-2 "미확인·확인·대응 중·종료"
export const CASE_STATE = {
  new: { label: "미확인", tone: "danger" },
  ack: { label: "확인", tone: "warn" },
  active: { label: "대응 중", tone: "info" },
  closed: { label: "종료", tone: "muted" },
};

// 데이터 수신 상태 — 요청서 3절. 오래된 값이 현재처럼 보이지 않게 구분한다.
export const FEED_STATE = {
  live: { label: "정상 수신", tone: "ok" },
  delayed: { label: "수신 지연", tone: "warn" },
  stale: { label: "장시간 미수신", tone: "device" },
  unworn: { label: "워치 미착용", tone: "device" },
  battery: { label: "배터리 방전", tone: "device" },
};

export function Panel({ children, className = "", style, id }) {
  return (
    <section id={id} className={`card-glass rounded-[14px] p-[18px] ${className}`} style={style}>
      {children}
    </section>
  );
}

export function PanelHead({ title, sub, right, className = "" }) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-2 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-bold text-navy">{title}</h2>
        {sub && <div className="mt-0.5 text-[12px] text-muted">{sub}</div>}
      </div>
      {right && <div className="flex shrink-0 flex-wrap items-center gap-2 text-[12px] text-muted">{right}</div>}
    </div>
  );
}

// 상단 통합현황 타일 — 요청서 2-1 "각 항목을 클릭하면 해당 고객 명단이 바로 조회".
// onClick 이 있으면 버튼, 없으면 표시만.
export function Stat({ label, value, unit, sub, tone = "navy", active = false, onClick, className = "" }) {
  const t = TONE[tone];
  const inner = (
    <>
      <div className="text-[12px] font-bold text-muted">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-num text-[26px] font-bold leading-none" style={{ color: t.fg }}>
          {value}
        </span>
        {unit && <span className="text-[12px] font-semibold text-muted">{unit}</span>}
      </div>
      {sub && <div className="mt-1 text-[11px] leading-[1.5] text-muted">{sub}</div>}
    </>
  );
  const base = `card-glass rounded-xl px-4 py-3 text-left ${className}`;
  const style = active
    ? { boxShadow: `inset 0 0 0 2px ${t.bar}`, background: t.bg }
    : tone === "danger" && Number(value) > 0
      ? { background: TONE.danger.bg }
      : undefined;
  if (!onClick) return <div className={base} style={style}>{inner}</div>;
  return (
    <button onClick={onClick} aria-pressed={active} className={`btn-press ${base}`} style={style} title="클릭하면 해당 명단을 봅니다">
      {inner}
    </button>
  );
}

export function Pill({ tone = "navy", children, className = "", dot = false }) {
  const t = TONE[tone];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-[2px] text-[11px] font-bold ${className}`}
      style={{ color: t.fg, background: t.bg }}
    >
      {dot && <span className="h-[6px] w-[6px] rounded-full" style={{ background: t.fg }} />}
      {children}
    </span>
  );
}

export function SevPill({ sev }) {
  const s = SEV[sev] || SEV.ok;
  return <Pill tone={s.tone}>{s.label}</Pill>;
}

export function StatePill({ state }) {
  const s = CASE_STATE[state] || CASE_STATE.new;
  return <Pill tone={s.tone}>{s.label}</Pill>;
}

export function FeedPill({ feed }) {
  const f = FEED_STATE[feed] || FEED_STATE.live;
  return <Pill tone={f.tone} dot>{f.label}</Pill>;
}

// 마지막 측정·수신 시각 — 모든 값 옆에 붙인다 (요청서 3절)
export function Stamp({ at, prefix = "수신" }) {
  return (
    <span className="font-num text-[11px] text-muted">
      {prefix} {at}
    </span>
  );
}

// 위험도 세로 막대 — 목록 행 왼쪽
export function SevBar({ sev }) {
  const s = SEV[sev] || SEV.ok;
  return <span className="w-[4px] shrink-0 self-stretch rounded-full" style={{ background: TONE[s.tone].bar }} aria-hidden />;
}

export function Avatar({ name, size = 40, tone = "navy" }) {
  const t = TONE[tone];
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{ width: size, height: size, background: t.bg, color: t.fg, fontSize: Math.round(size * 0.34) }}
      aria-hidden
    >
      {name.slice(0, 2)}
    </span>
  );
}

export function Btn({ children, onClick, tone = "navy", ghost = false, small = false, disabled = false, className = "", type = "button", title }) {
  const t = TONE[tone];
  const pad = small ? "px-3 py-1.5 text-[12px]" : "px-4 py-2.5 text-[13px]";
  const style = ghost
    ? { color: t.fg, border: `1px solid ${t.fg}55`, background: "transparent" }
    : { background: t.fg, color: "#FFFFFF" };
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title} className={`btn-press rounded-[10px] font-bold disabled:opacity-40 ${pad} ${className}`} style={style}>
      {children}
    </button>
  );
}

export function Tabs({ tabs, value, onChange, className = "" }) {
  return (
    <div role="tablist" className={`flex flex-wrap gap-1 border-b border-navy/[.08] ${className}`}>
      {tabs.map(([k, label, n]) => {
        const on = value === k;
        return (
          <button
            key={k}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(k)}
            className="btn-press btn-inline -mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] font-bold"
            style={on ? { borderColor: "#B08D57", color: "#0A1F3C" } : { borderColor: "transparent", color: "#5C5A54" }}
          >
            {label}
            {n != null && <span className="font-num text-[11px] text-muted">{n}</span>}
          </button>
        );
      })}
    </div>
  );
}

// 단순 표 — cols: [{k, label, w?, align?, render?}] · rows: 객체 배열 · onRow: 행 클릭
export function Table({ cols, rows, onRow, rowKey = (r, i) => r.id ?? i, selected, empty = "표시할 항목이 없습니다.", dense = false }) {
  const py = dense ? "py-2" : "py-2.5";
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-[13px]">
        <thead>
          <tr className="text-left text-[11px] font-bold tracking-[.04em] text-muted">
            {cols.map((c) => (
              <th key={c.k} className={`border-b border-navy/[.1] px-2 pb-2 font-bold ${c.align === "right" ? "text-right" : ""}`} style={c.w ? { width: c.w } : undefined}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={cols.length} className="px-2 py-6 text-center text-[13px] text-muted">{empty}</td>
            </tr>
          )}
          {rows.map((r, i) => {
            const k = rowKey(r, i);
            const on = selected != null && selected === k;
            return (
              <tr
                key={k}
                onClick={onRow ? () => onRow(r) : undefined}
                className={`border-b border-navy/[.06] ${onRow ? "cursor-pointer hover:bg-navy/[.03]" : ""}`}
                style={on ? { background: "rgba(176,141,87,.12)" } : undefined}
              >
                {cols.map((c) => (
                  <td key={c.k} className={`px-2 ${py} align-top ${c.align === "right" ? "text-right font-num" : ""}`}>
                    {c.render ? c.render(r) : r[c.k]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// 라벨 · 값 한 줄 (상세 패널)
export function KV({ k, v, tone, mono = false }) {
  return (
    <div className="flex items-baseline gap-3 border-t border-navy/[.06] py-2 first:border-t-0">
      <span className="w-[112px] shrink-0 text-[12px] text-muted">{k}</span>
      <span className={`min-w-0 flex-1 text-[13px] font-medium text-ink ${mono ? "font-num" : ""}`} style={tone ? { color: TONE[tone].fg } : undefined}>
        {v}
      </span>
    </div>
  );
}

// 입력 — 등록·수정 폼. 모든 컨트롤에 안정적인 id 를 준다.
export function Field({ id, label, value, onChange, type = "text", placeholder, options, hint, required = false, disabled = false }) {
  const cls = "card-glass w-full rounded-[10px] px-3 py-2 text-[13px] font-medium text-navy outline-none focus:ring-1 focus:ring-gold disabled:opacity-60";
  return (
    <label htmlFor={id} className="block">
      <span className="text-[11px] font-bold text-muted">
        {label}
        {required && <span className="ml-0.5 text-gold">*</span>}
      </span>
      {options ? (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={`mt-1 ${cls}`}>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} rows={3} className={`mt-1 ${cls}`} />
      ) : (
        <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} className={`mt-1 ${cls}`} />
      )}
      {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

export function Toggle({ id, on, onChange, label }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className="btn-press btn-inline relative h-[24px] w-[44px] shrink-0 rounded-full"
      style={{ background: on ? "#1E7A5A" : "rgba(10,31,60,.18)" }}
    >
      <span className="absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow transition-all" style={{ left: on ? 23 : 3 }} />
    </button>
  );
}

// 오른쪽에서 열리는 상세 패널 — 화면을 덮지 않고 옆에 붙는다 (대형 모니터 전제).
// 좁은 화면에서는 전체 폭 모달처럼 보인다.
export function Drawer({ open, onClose, title, sub, children, width = 520, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1200] flex justify-end bg-navy/30" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="card-frost flex h-full w-full max-w-full flex-col overflow-hidden"
        style={{ width }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-navy/[.08] px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-[16px] font-bold text-navy">{title}</h3>
            {sub && <div className="mt-0.5 text-[12px] text-muted">{sub}</div>}
          </div>
          <button onClick={onClose} aria-label="닫기" className="btn-press rounded-[10px] px-3 py-1.5 text-[12px] font-bold text-muted" style={{ background: "rgba(10,31,60,.06)" }}>
            닫기
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-navy/[.08] px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

// 확인 절차 — 출동·종료처럼 되돌리기 어려운 실행 전에 한 번 더 묻는다 (요청서 19절)
export function Confirm({ open, title, body, confirmLabel = "실행", tone = "navy", onConfirm, onCancel, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-navy/40 px-4" onClick={onCancel}>
      <div role="alertdialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className="card-frost w-full max-w-[440px] rounded-[16px] p-5">
        <h3 className="text-[16px] font-bold text-navy">{title}</h3>
        {body && <p className="mt-2 text-[13px] leading-[1.7] text-ink">{body}</p>}
        {children}
        <div className="mt-4 flex justify-end gap-2">
          <Btn ghost tone="muted" onClick={onCancel}>취소</Btn>
          <Btn tone={tone} onClick={onConfirm}>{confirmLabel}</Btn>
        </div>
      </div>
    </div>
  );
}

// 단계별 타임라인 — SOS 대응 절차 · 방문 완료 절차. steps: [{k, title, sub, state: 'done'|'active'|'wait'|'skip', at, right}]
export function Steps({ steps, children }) {
  return (
    <ol className="relative ml-[14px] border-l-2 border-navy/[.1] pl-6">
      {steps.map((s, i) => {
        const tone = s.state === "done" ? "ok" : s.state === "active" ? "warn" : s.state === "fail" ? "danger" : "muted";
        const t = TONE[tone];
        return (
          <li key={s.k || i} className="relative pb-5 last:pb-0">
            <span
              className="absolute -left-[37px] top-0 flex h-[24px] w-[24px] items-center justify-center rounded-full font-num text-[11px] font-bold"
              style={{ background: s.state === "wait" ? "rgba(10,31,60,.08)" : t.fg, color: s.state === "wait" ? "#5C5A54" : "#FFFFFF" }}
            >
              {i + 1}
            </span>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <span className="text-[14px] font-bold" style={{ color: s.state === "wait" ? "#5C5A54" : "#0A1F3C" }}>{s.title}</span>
              {s.right && <span className="font-num text-[12px] font-bold" style={{ color: t.fg }}>{s.right}</span>}
            </div>
            {s.sub && <div className="mt-0.5 text-[12px] leading-[1.6] text-muted">{s.sub}</div>}
            {s.state === "active" && children ? <div className="mt-2">{typeof children === "function" ? children(s) : children}</div> : null}
          </li>
        );
      })}
    </ol>
  );
}

// 진행률 막대
export function Bar({ value, max = 100, tone = "ok", height = 6 }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <span className="block w-full overflow-hidden rounded-full bg-navy/[.08]" style={{ height }}>
      <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: TONE[tone].bar }} />
    </span>
  );
}

export function Empty({ children }) {
  return <div className="rounded-xl bg-navy/[.04] px-4 py-3 text-[13px] text-muted">{children}</div>;
}

// 소형 안내 — 참고자료 문구 등 (의료진 판단을 대신하지 않는다는 고지)
export function Note({ children, tone = "muted" }) {
  const t = TONE[tone];
  return (
    <p className="rounded-xl px-3.5 py-2.5 text-[12px] leading-[1.7]" style={{ background: t.bg, color: t.fg }}>
      {children}
    </p>
  );
}
