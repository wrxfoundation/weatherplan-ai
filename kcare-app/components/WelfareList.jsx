import { useState } from "react";
import Icon from "./icons";
import { PROFILE_FIELDS, VERDICT, VERDICT_TONE, WELFARE_COMMON, WELFARE_STATUS, regionLabel, sourceUrl } from "../lib/welfare";

// 복지혜택 매칭 목록 — 보호자(해주세요) · 컨시어지(제안) · 관제(대시보드·프로필)가 같은
// 컴포넌트를 쓴다 (2026-09-04 시트 앱 전체 3번). 세 화면이 각자 그리면 판정 색·문구·
// 진행상태가 금방 어긋난다. 어르신 화면은 활자 규격이 달라 따로 그린다 (elder.jsx).
//
// matches: lib/welfare.js matchWelfare() 결과. statuses: state.welfare.status.
// onStatus(id, status): 진행상태 변경 — 주는 화면(관제·보호자)만 넘긴다.
// onSend(match): "보호자에게 안내" · "제안 보내기" 같은 한 번짜리 행동. sendLabel 이 버튼 글씨.

const FILTERS = [
  { key: "all", label: "전체" },
  { key: VERDICT.high, label: "높음" },
  { key: VERDICT.check, label: "추가확인" },
  { key: VERDICT.low, label: "낮음" },
];

const FIELD_LABEL = Object.fromEntries(PROFILE_FIELDS.map(([k, l]) => [k, l]));
FIELD_LABEL.income = "소득(중위소득 %)";
FIELD_LABEL.housing = "주거형태";

export function VerdictBadge({ verdict, small }) {
  const t = VERDICT_TONE[verdict];
  return (
    <span
      className={`inline-block shrink-0 rounded-full font-bold ${small ? "px-2 py-[2px] text-[11px]" : "px-2.5 py-[3px] text-[12px]"}`}
      style={{ color: t.fg, background: t.bg }}
    >
      {verdict}
    </span>
  );
}

export default function WelfareList({
  matches,
  statuses = {},
  onStatus,
  onSend,
  sendLabel = "보호자에게 안내",
  sent = {},
  initialFilter = "all",
  pageSize = 6,
  hideLow = false,
}) {
  const [filter, setFilter] = useState(initialFilter);
  const [openId, setOpenId] = useState(null);
  const [shown, setShown] = useState(pageSize);

  const base = hideLow ? matches.filter((m) => m.verdict !== VERDICT.low) : matches;
  const rows = filter === "all" ? base : base.filter((m) => m.verdict === filter);
  const count = (k) => (k === "all" ? base.length : base.filter((m) => m.verdict === k).length);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.filter((f) => !(hideLow && f.key === VERDICT.low)).map((f) => {
          const on = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => {
                setFilter(f.key);
                setShown(pageSize);
              }}
              aria-pressed={on}
              className={`btn-press rounded-full border px-3 py-1.5 text-[12px] font-bold ${
                on ? "border-navy bg-navy text-white" : "border-navy/15 text-muted"
              }`}
            >
              {f.label} <span className="font-num">{count(f.key)}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-2.5 space-y-2">
        {rows.slice(0, shown).map((m) => {
          const p = m.policy;
          const open = openId === p.id;
          const st = statuses[p.id]?.status || "추천";
          return (
            <div key={p.id} className="rounded-xl border border-navy/[.08] bg-white/70">
              <button
                onClick={() => setOpenId(open ? null : p.id)}
                aria-expanded={open}
                className="btn-press flex w-full items-start gap-2.5 p-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[14px] font-bold leading-[1.4] text-navy">{p.name}</span>
                    <VerdictBadge verdict={m.verdict} small />
                    {st !== "추천" && (
                      <span className="rounded-full bg-navy/[.07] px-2 py-[2px] text-[11px] font-bold text-navy">{st}</span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[12px] leading-[1.55] text-muted">
                    {regionLabel(p)} · {p.cat} · {p.summary}
                  </div>
                  <div className="mt-0.5 text-[12px] font-bold text-gold">{p.value}</div>
                </div>
                <span className="shrink-0 text-right">
                  <span className="block font-num text-[15px] font-bold text-navy">{m.score}</span>
                  <span
                    aria-hidden
                    className="mt-1 inline-block text-muted transition-transform duration-200"
                    style={{ transform: open ? "rotate(180deg)" : "none" }}
                  >
                    <Icon name="chev" size={16} strokeWidth={2} />
                  </span>
                </span>
              </button>

              {open && (
                <div className="border-t border-navy/[.07] px-3 pb-3 pt-2.5 text-[12px] leading-[1.6]">
                  <div className="space-y-1">
                    <div><span className="font-bold text-gold">요건 </span><span className="text-ink">{p.req}</span></div>
                    <div><span className="font-bold text-gold">신청 </span><span className="text-ink">{p.apply} · {p.org} · {p.contact}</span></div>
                    <div><span className="font-bold text-gold">판정 </span><span className="text-ink">{m.basis} · 확인할 것: {m.checks}</span></div>
                    {m.missing.length > 0 && (
                      <div>
                        <span className="font-bold text-amber">미확인 </span>
                        <span className="text-ink">{m.missing.map((k) => FIELD_LABEL[k] || k).join(" · ")}</span>
                      </div>
                    )}
                    {m.failed.length > 0 && (
                      <div>
                        <span className="font-bold text-muted">불일치 </span>
                        <span className="text-muted">{m.failed.map((k) => FIELD_LABEL[k] || k).join(" · ")}</span>
                      </div>
                    )}
                    <div className="text-muted">
                      무료 {p.free === "Y" ? "예" : "조건부"} · 검증 {p.confidence} ({WELFARE_COMMON.verifiedAt}) ·{" "}
                      <a href={sourceUrl(p)} target="_blank" rel="noreferrer" className="btn-press btn-inline underline underline-offset-2">
                        공식 출처
                      </a>
                    </div>
                  </div>
                  {(onStatus || onSend) && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      {onStatus && (
                        <label className="flex items-center gap-1.5 text-[12px] font-bold text-muted">
                          진행
                          <select
                            value={st}
                            onChange={(e) => onStatus(p.id, e.target.value)}
                            className="btn-press rounded-lg border border-navy/15 bg-white px-2 py-1.5 text-[12px] font-bold text-navy"
                          >
                            {WELFARE_STATUS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </label>
                      )}
                      {onSend && (
                        <button
                          onClick={() => onSend(m)}
                          disabled={!!sent[p.id]}
                          className={`btn-press ml-auto rounded-lg border px-3 py-1.5 text-[12px] font-bold ${
                            sent[p.id] ? "border-green/30 bg-green/10 text-green" : "border-navy/20 text-navy"
                          }`}
                        >
                          {sent[p.id] ? "✓ 보냄" : sendLabel}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {rows.length === 0 && <p className="py-3 text-center text-[13px] text-muted">해당하는 정책이 없습니다.</p>}
      </div>
      {rows.length > shown && (
        <button
          onClick={() => setShown((n) => n + pageSize)}
          className="btn-press mt-2 w-full rounded-xl border border-navy/15 py-2.5 text-[13px] font-bold text-navy"
        >
          더 보기 · 남은 {rows.length - shown}건
        </button>
      )}
      <p className="mt-2.5 text-[11px] leading-[1.6] text-muted">{WELFARE_COMMON.disclaimer}</p>
    </div>
  );
}
