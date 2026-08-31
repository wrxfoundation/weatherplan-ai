import { useEffect, useRef } from "react";

// 지도 팝업 — 보호자 홈('지금 어디쯤')과 관제 프로필('위치 지도')이 같이 쓴다
// (2026-08-31 요청). 두 화면이 각자 지도를 만들면 마커 색·좌표·정리(cleanup)가
// 금방 어긋난다. 여기 한 곳에서만 Leaflet 을 다룬다.
//
// 타일은 관제 맵과 같은 OSM 라이트 — next.config.js 의 CSP img-src 가 허용하는
// 출처다. 다른 타일을 쓰려면 CSP 부터 고쳐야 한다.
const TILE = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  subdomains: "abc",
  attribution: "© OpenStreetMap contributors",
  bg: "#E6EBF2",
};

// 두 좌표 사이 직선 거리(m) — 하버사인. 경로가 아니라 직선이라는 점은
// 화면 문구에서 '직선거리'로 밝힌다 (라우팅 엔진이 없다).
export function distanceM(a, b) {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function prettyDistance(m) {
  return m < 1000 ? `${Math.round(m / 10) * 10}m` : `${(m / 1000).toFixed(1)}km`;
}

/**
 * points: [{ lat, lng, label, color, r?, pulse? }]
 * 첫 점과 마지막 점 사이에 점선을 그린다(이동 방향 암시). 점이 하나면 생략.
 */
export default function MapDialog({ open, onClose, title, sub, points = [], foot, actions }) {
  const nodeRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    import("leaflet").then((mod) => {
      const L = mod.default || mod;
      if (cancelled || !nodeRef.current) return;
      const map = L.map(nodeRef.current, { zoomControl: true, attributionControl: true });
      mapRef.current = map;
      L.tileLayer(TILE.url, { subdomains: TILE.subdomains, maxZoom: 19, attribution: TILE.attribution }).addTo(map);

      const pts = [];
      points.forEach((p) => {
        pts.push([p.lat, p.lng]);
        // 움직이는 대상은 테두리를 한 겹 더 둘러 눈에 먼저 들어오게 한다
        if (p.pulse) {
          L.circleMarker([p.lat, p.lng], {
            radius: (p.r || 9) + 7,
            color: p.color,
            weight: 2,
            opacity: 0.45,
            fillColor: p.color,
            fillOpacity: 0.14,
          }).addTo(map);
        }
        L.circleMarker([p.lat, p.lng], {
          radius: p.r || 9,
          color: "#FFFFFF",
          weight: 2,
          fillColor: p.color,
          fillOpacity: 1,
        })
          .addTo(map)
          .bindPopup(p.label, { className: "kcare-popup" });
      });

      if (pts.length > 1) {
        L.polyline([pts[0], pts[pts.length - 1]], {
          color: "#0A1F3C",
          weight: 2,
          opacity: 0.35,
          dashArray: "6 7",
        }).addTo(map);
      }
      if (pts.length === 1) map.setView(pts[0], 15);
      else map.fitBounds(L.latLngBounds(pts), { padding: [40, 40] });
    });

    const onResize = () => mapRef.current && mapRef.current.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      if (mapRef.current) {
        mapRef.current.remove(); // cleanup 필수 — 안 하면 다시 열 때 컨테이너 중복 오류
        mapRef.current = null;
      }
    };
    // points 는 매 렌더 새 배열이라 의존성에 넣으면 지도를 계속 새로 만든다.
    // 열릴 때 한 번 그리면 되는 화면이라 open 만 본다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-[rgba(8,23,45,.72)] px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] overflow-hidden rounded-[20px] bg-white"
        style={{ boxShadow: "0 30px 60px -20px rgba(8,23,45,.6)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start gap-3 px-5 pb-3 pt-4">
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-bold text-navy">{title}</p>
            {sub && <p className="mt-0.5 text-[13px] leading-[1.5] text-muted">{sub}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="btn-press flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-lg border border-navy/15 text-[15px] font-bold text-muted"
          >
            ✕
          </button>
        </div>
        <div ref={nodeRef} className="h-[300px] w-full" style={{ background: TILE.bg }} />
        <div className="px-5 pb-4 pt-3">
          {/* 마커 범례 — 색만으로 구분하지 않는다 (색각 이상 고려) */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {points.map((p) => (
              <span key={p.label} className="flex items-center gap-1.5 text-[13px] font-bold text-navy">
                <span aria-hidden className="h-[10px] w-[10px] rounded-full" style={{ background: p.color }} />
                {p.label}
              </span>
            ))}
          </div>
          {foot && <p className="mt-2.5 text-[13px] leading-[1.6] text-muted">{foot}</p>}
          {actions}
        </div>
      </div>
    </div>
  );
}
