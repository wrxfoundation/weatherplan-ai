// 건강 정보 한 벌 — 복용약 · 질환 · 알레르기를 보여 주고(HealthSummary) 고친다(HealthEditor).
//
// 2026-10-02 QA "복용약 등록·수정 버튼이 없다 · 화면마다 약이 다르다". 값은 가구 상태(state.health)
// 한 곳에 있고(lib/meds.js healthOf), 관제(어르신 관리 › 건강·질환)와 컨시어지(고객 탭)가 이 편집기로 고친다.
// 어르신 화면의 복약 미션 · 보호자 마이 · 관제 SOS 119 신고 정보가 같은 값을 읽는다.
// 진단 · 처방은 하지 않는다 — 처방전 · 약봉투에 적힌 것을 옮겨 적는 칸이다.
import { useId, useState } from "react";
import { MED_SLOTS, medSummary } from "../lib/meds";

const DEFAULT_TIME = { 아침: "08:00", 점심: "12:30", 저녁: "19:00", "자기 전": "21:30" };
const splitList = (t) =>
  String(t || "")
    .split(/[,\n·]/)
    .map((x) => x.trim())
    .filter(Boolean);
const fmtAt = (t) =>
  t ? new Date(t).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }) : "";

export function HealthSummary({ health, compact = false }) {
  const meds = medSummary(health.meds);
  const rows = [
    ["질환", health.conditions.length ? health.conditions.join(" · ") : "등록 없음"],
    ["알레르기", health.allergies.length ? health.allergies.join(" · ") : "등록 없음"],
  ];
  return (
    <div className={compact ? "text-[12.5px]" : "text-[13.5px]"}>
      {rows.map(([k, v]) => (
        <div key={k} className="flex gap-3 border-b border-navy/[.06] py-1.5">
          <span className="w-[64px] shrink-0 text-muted">{k}</span>
          <span className="min-w-0 flex-1 font-medium text-ink">{v}</span>
        </div>
      ))}
      <div className="flex gap-3 py-1.5">
        <span className="w-[64px] shrink-0 text-muted">복용약</span>
        <span className="min-w-0 flex-1">
          {meds.length === 0 ? (
            <span className="font-medium text-ink">등록 없음</span>
          ) : (
            meds.map((m) => (
              <span key={m} className="block font-medium leading-[1.6] text-ink">
                {m}
              </span>
            ))
          )}
        </span>
      </div>
      <div className="mt-1 text-[11px] leading-[1.6] text-muted">
        {health.custom && health.at ? `마지막 수정 ${fmtAt(health.at)}${health.by ? ` · ${health.by}` : ""}` : "첫 안심방문 등록값 — 아직 고친 사람 없음"}
      </div>
    </div>
  );
}

export function HealthEditor({ health, onSave, onCancel }) {
  const uid = useId();
  const [cond, setCond] = useState(health.conditions.join(", "));
  const [alg, setAlg] = useState(health.allergies.join(", "));
  const [slots, setSlots] = useState(() =>
    health.meds.map((d) => ({ slot: d.slot, time: d.time, elderLabel: d.elderLabel || "", items: d.items.map((i) => ({ name: i.name, dose: i.dose || "" })) }))
  );
  const [err, setErr] = useState("");

  const patchSlot = (si, patch) => setSlots((xs) => xs.map((x, i) => (i === si ? { ...x, ...patch } : x)));
  const patchItem = (si, ii, patch) =>
    setSlots((xs) => xs.map((x, i) => (i === si ? { ...x, items: x.items.map((it, j) => (j === ii ? { ...it, ...patch } : it)) } : x)));
  const unused = MED_SLOTS.filter((n) => !slots.some((x) => x.slot === n));

  const save = () => {
    const meds = slots
      .map((x) => ({ ...x, items: x.items.filter((i) => i.name.trim()) }))
      .filter((x) => x.items.length);
    if (meds.some((x) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(x.time))) return setErr("복용 시각을 08:00 처럼 적어 주세요.");
    if (new Set(meds.map((x) => x.slot)).size !== meds.length) return setErr("같은 때(아침 · 점심 …)가 두 번 있습니다.");
    setErr("");
    onSave({ meds, conditions: splitList(cond), allergies: splitList(alg) });
  };

  const input = "min-h-[36px] w-full rounded-lg border border-navy/15 bg-white px-2.5 text-[13px] text-ink";
  const small = "min-h-[32px] shrink-0 rounded-lg border border-navy/15 px-2.5 text-[12px] font-bold text-muted";

  return (
    <div className="space-y-3 text-[13px]">
      <div>
        <label htmlFor={`${uid}-cond`} className="text-[12px] font-bold text-muted">
          질환 (쉼표로 구분)
        </label>
        <input id={`${uid}-cond`} value={cond} onChange={(e) => setCond(e.target.value)} className={`${input} mt-1`} />
      </div>
      <div>
        <label htmlFor={`${uid}-alg`} className="text-[12px] font-bold text-muted">
          알레르기 (없으면 비워 두세요)
        </label>
        <input id={`${uid}-alg`} value={alg} onChange={(e) => setAlg(e.target.value)} className={`${input} mt-1`} />
      </div>
      <div>
        <div className="text-[12px] font-bold text-muted">복용약 — 때마다 약봉투에 적힌 대로</div>
        <div className="mt-1.5 space-y-2.5">
          {slots.map((x, si) => (
            <fieldset key={si} className="rounded-xl border border-navy/[.1] bg-white/70 p-2.5">
              <legend className="sr-only">{x.slot} 복용약</legend>
              <div className="flex flex-wrap items-end gap-2">
                <div className="w-[96px]">
                  <label htmlFor={`${uid}-s${si}`} className="text-[11px] text-muted">
                    때
                  </label>
                  <select id={`${uid}-s${si}`} value={x.slot} onChange={(e) => patchSlot(si, { slot: e.target.value })} className={`${input} mt-0.5`}>
                    {MED_SLOTS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-[104px]">
                  <label htmlFor={`${uid}-t${si}`} className="text-[11px] text-muted">
                    시각
                  </label>
                  <input id={`${uid}-t${si}`} type="time" value={x.time} onChange={(e) => patchSlot(si, { time: e.target.value })} className={`${input} mt-0.5`} />
                </div>
                <div className="min-w-[120px] flex-1">
                  <label htmlFor={`${uid}-l${si}`} className="text-[11px] text-muted">
                    어르신 화면 이름 (예: 아산병원약)
                  </label>
                  <input id={`${uid}-l${si}`} value={x.elderLabel} onChange={(e) => patchSlot(si, { elderLabel: e.target.value })} className={`${input} mt-0.5`} />
                </div>
                <button type="button" onClick={() => setSlots((xs) => xs.filter((_, i) => i !== si))} className={small}>
                  이 때 빼기
                </button>
              </div>
              <div className="mt-2 space-y-1.5">
                {x.items.map((it, ii) => (
                  <div key={ii} className="flex items-end gap-1.5">
                    <div className="min-w-0 flex-1">
                      <label htmlFor={`${uid}-n${si}-${ii}`} className="sr-only">
                        {x.slot} 약 {ii + 1} 이름
                      </label>
                      <input
                        id={`${uid}-n${si}-${ii}`}
                        value={it.name}
                        placeholder="약 이름 (성분)"
                        onChange={(e) => patchItem(si, ii, { name: e.target.value })}
                        className={input}
                      />
                    </div>
                    <div className="w-[72px]">
                      <label htmlFor={`${uid}-d${si}-${ii}`} className="sr-only">
                        {x.slot} 약 {ii + 1} 용량
                      </label>
                      <input id={`${uid}-d${si}-${ii}`} value={it.dose} placeholder="1정" onChange={(e) => patchItem(si, ii, { dose: e.target.value })} className={input} />
                    </div>
                    <button
                      type="button"
                      aria-label={`${x.slot} 약 ${ii + 1} 빼기`}
                      onClick={() => patchSlot(si, { items: x.items.filter((_, j) => j !== ii) })}
                      className={`${small} min-w-[36px]`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => patchSlot(si, { items: [...x.items, { name: "", dose: "1정" }] })} className={small}>
                  + 약 더하기
                </button>
              </div>
            </fieldset>
          ))}
          {unused.length > 0 && (
            <button
              type="button"
              onClick={() => setSlots((xs) => [...xs, { slot: unused[0], time: DEFAULT_TIME[unused[0]], elderLabel: "", items: [{ name: "", dose: "1정" }] }])}
              className={small}
            >
              + 먹는 때 더하기 ({unused[0]})
            </button>
          )}
        </div>
      </div>
      {err && <p className="text-[12px] font-bold text-amber">{err}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="min-h-[40px] flex-1 rounded-xl border border-navy/15 text-[13px] font-bold text-muted">
          취소
        </button>
        <button type="button" onClick={save} className="btn-dark min-h-[40px] flex-[2] rounded-xl bg-navy text-[13px] font-bold text-white">
          저장 — 어르신 · 보호자 · 관제 화면에 같이 바뀝니다
        </button>
      </div>
    </div>
  );
}
