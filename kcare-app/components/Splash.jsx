import { useEffect, useLayoutEffect, useState } from "react";

// 모바일 앱 스플래시 — 어르신 · 가족 · 컨시어지 3종.
//
// 설계 원칙 세 가지:
// 1) 시연을 늦추지 않는다. 세션당 서비스별 1회만 뜨고, 아무 데나 누르면 즉시 넘어간다.
//    (의뢰자 앞에서 탭을 옮길 때마다 1초씩 기다리게 만들면 그건 사고다)
// 2) 외부 이미지를 쓰지 않는다. CSP가 자기 출처만 허용하고, 스플래시가
//    네트워크를 기다리면 스플래시를 넣은 의미가 없다. 전부 CSS로 그린다.
// 3) 서버 HTML에도 실린다. 나중에 덮으면 본문이 한 번 번쩍이므로,
//    처음부터 덮은 채로 시작해 레이아웃 이펙트에서 걷어낸다.
//
// prefers-reduced-motion에서는 아예 띄우지 않는다 — 장식이므로 뺄 수 있으면 뺀다.

const SEEN = (k) => `kcare-splash-${k}`;

// 서비스별 톤 — 색은 tailwind.config.js 토큰과 같은 값
const SERVICE = {
  elder: {
    bg: "#FDFCF9", // elder
    fg: "#0A1F3C", // navy
    accent: "#B08D57", // gold
    ring: "rgba(176,141,87,.30)",
    eyebrow: "안심 케어",
    title: "오늘도 곁에 있습니다",
    // 어르신 화면은 활자를 키운다 (본문 규격과 같은 원칙)
    big: true,
    hold: 1150,
  },
  family: {
    bg: "#0A1F3C", // navy
    fg: "#FFFFFF",
    accent: "#C9A46B", // gold-soft
    ring: "rgba(201,164,107,.34)",
    eyebrow: "FAMILY MEMBERSHIP",
    title: "멀리 있어도, 매일 곁에",
    big: false,
    hold: 950,
  },
  concierge: {
    bg: "#0E1B2E", // dark
    fg: "#FFFFFF",
    accent: "#B08D57",
    ring: "rgba(176,141,87,.30)",
    eyebrow: "CONCIERGE",
    title: "오늘의 방문을 준비합니다",
    big: false,
    hold: 950,
  },
};

// SSR에서 useLayoutEffect 경고를 피하면서, 브라우저에서는 페인트 전에 실행
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function Splash({ service = "family" }) {
  const s = SERVICE[service] || SERVICE.family;
  const [state, setState] = useState("on"); // on → out → gone

  // 단계마다 타이머를 하나만 둔다. 한 이펙트에 몰아 넣으면 상태가 바뀔 때
  // 정리 함수가 방금 등록한 다음 단계 타이머까지 지워 스플래시가 안 걷힌다.
  const dismiss = () => setState((v) => (v === "on" ? "out" : v));

  useIsoLayoutEffect(() => {
    let skip = false;
    try {
      skip = sessionStorage.getItem(SEEN(service)) === "1";
      sessionStorage.setItem(SEEN(service), "1");
    } catch {
      /* 시크릿 모드 등 sessionStorage 차단 — 그냥 한 번 보여준다 */
    }
    if (!skip && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) skip = true;
    if (skip) setState("gone"); // 페인트 전에 걷어내므로 깜빡임이 없다
  }, [service]);

  // on → out (표시 시간이 지나면 서서히 걷힘)
  useEffect(() => {
    if (state !== "on") return undefined;
    const t = setTimeout(dismiss, s.hold);
    return () => clearTimeout(t);
  }, [state, s.hold]);

  // out → gone (페이드가 끝나면 DOM에서 제거)
  useEffect(() => {
    if (state !== "out") return undefined;
    const t = setTimeout(() => setState("gone"), 280);
    return () => clearTimeout(t);
  }, [state]);

  if (state === "gone") return null;

  return (
    <>
      {/* JS가 없으면 스플래시가 영영 안 걷힌다 — 그 경우엔 아예 숨긴다 */}
      <noscript>
        <style>{`.kc-splash{display:none!important}`}</style>
      </noscript>
      <div
        className={`kc-splash ${state === "out" ? "is-out" : ""}`}
        style={{ background: s.bg, color: s.fg }}
        onPointerDown={dismiss}
        role="presentation"
        aria-hidden="true"
      >
        <div className="kc-splash-in">
          {/* 케어 링 — 밖에서 안으로 모이는 원 두 겹 */}
          <div className="kc-seal" style={{ borderColor: s.ring }}>
            <span className="kc-seal-ring" style={{ borderColor: s.accent }} />
            <span className="kc-seal-mark" style={{ color: s.accent }}>
              K
            </span>
          </div>

          <div className="kc-word" style={{ color: s.fg }}>
            K-CARE
          </div>
          <div className="kc-eyebrow" style={{ color: s.accent }}>
            {s.eyebrow}
          </div>
          <div className={`kc-title ${s.big ? "is-big" : ""}`} style={{ color: s.fg }}>
            {s.title}
          </div>
        </div>

        <div className="kc-foot" style={{ color: s.fg }}>
          K-CARE 시니어 케어 프리미엄 멤버십
        </div>
      </div>
    </>
  );
}
