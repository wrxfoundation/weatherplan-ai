// 약관 · 정책 접는 칸 (2026-10-15 시안 '정보 동의 › 약관 · 정책'). 내용은 lib/policies.js 한 곳에서 온다.
// 같은 본문을 공개 화면(/terms · /refund · /privacy)도 그린다 — components/LegalPage.jsx.
// 문장 속 ⟦…⟧ 는 아직 정해지지 않은 값 — 노란 칸(ds-tbd)으로 그리고, 스크린리더에는 '확인 필요'를 붙여 읽힌다.
// (2026-11-10 본문을 다시 쓰면서 ⟦…⟧ 는 없어졌다 — 모르는 값은 문장에 넣지 않는다. 그리는 법은 남겨 둔다.)
import { Line } from "./clay";
import { TONE } from "./ds";

export function Tbd({ text }) {
  const parts = String(text).split(/(⟦[^⟧]*⟧)/);
  return parts.map((s, i) =>
    s.startsWith("⟦") ? (
      <span key={i} className="ds-tbd">
        {s.slice(1, -1)}
        <span className="sr-only"> (확인 필요)</span>
      </span>
    ) : (
      <span key={i}>{s}</span>
    )
  );
}

// 문단 — 문자열 하나거나 여러 문단의 배열
export const parasOf = (p) => (p == null ? [] : Array.isArray(p) ? p : [p]);

// 한 조항 — 문단 → 목록 → 덧붙이는 말 순서
export function PolicyBody({ policy }) {
  return (
    <>
      {policy.sections.map((s) => (
        <div key={s.h}>
          <h4>{s.h}</h4>
          {parasOf(s.p).map((x) => (
            <p key={x} className="mt-1 first:mt-0">
              <Tbd text={x} />
            </p>
          ))}
          {s.li && (
            <ul className={s.p ? "mt-1.5" : ""}>
              {s.li.map((x) => (
                <li key={x}>
                  <Tbd text={x} />
                </li>
              ))}
            </ul>
          )}
          {s.note && (
            <p className="mt-1.5">
              <Tbd text={s.note} />
            </p>
          )}
        </div>
      ))}
      {policy.foot && (
        <div className="ds-src">
          <Tbd text={policy.foot} />
        </div>
      )}
    </>
  );
}

// 접는 칸 하나 — <details> 라 키보드 · 스크린리더가 그대로 연다
export function PolicyAcc({ policy, id }) {
  const tn = TONE[policy.tone] || TONE.stone;
  return (
    <details className="ds-acc" id={id}>
      <summary>
        <span className="ic" style={{ background: tn.bg, color: tn.fg }}>
          <Line name={policy.icon} size={20} />
        </span>
        <span className="tt">{policy.title}</span>
        {policy.draft && (
          <span className="flex-none rounded-full px-2 py-0.5 text-[12px] font-extrabold" style={{ background: TONE.gold.bg, color: TONE.gold.fg }}>
            안내본
          </span>
        )}
        <span className="cv" aria-hidden="true">
          <Line name="chevD" size={20} />
        </span>
      </summary>
      <div className="ds-accbody">
        <PolicyBody policy={policy} />
      </div>
    </details>
  );
}
