import Head from "next/head";
import Logo from "../components/Logo";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import {
  ELDER,
  JOBS,
  CRM_TIMELINE,
  ELDER_TAGS,
  TAG_TONE,
} from "../lib/mock";
import WelfareList from "../components/WelfareList";
import { PROFILE_FIELDS, WELFARE_PROFILES, matchWelfare, profileFor, welfareCounts } from "../lib/welfare";
import {
  AI_ASSIGN,
  BRIEFINGS,
  FATIGUE,
  CONCIERGE_POS,
  ELDER_HOMES,
  MAP_DISTRICTS,
  MAP_HOSPITALS,
  RISK_WATCH,
  ROUTE_CHAIN,
  SCORE_FACTORS,
  CRM_STAGE,
  COMMS_TRACKING,
  MORNING_BRIEF,
  WEAR_DEVICES,
  HANDOFF_CHAIN,
  HANDOFF_STUCK,
  DIRECTORY_ALL,
  AI_STAGE_NOW,
  AI_EVIDENCE,
  DIRECTORY_TYPE,
  DISPATCH_AI_QA,
  SLA_ROWS,
  STAFF,
  STAFF_STATUS,
  UNMATCHED,
  WEEK_FORECAST,
  WEATHER_NOW,
  WEATHER_AIR,
  WEATHER_HOURLY,
  WEATHER_DISTRICTS,
  WEATHER_ISSUES,
  mapPeople,
} from "../lib/console";
import { useAppState } from "../lib/state";
import AiChat from "../components/AiChat";
import HelpTip from "../components/HelpTip";
import Icon from "../components/icons";
import MapDialog, { distanceM, prettyDistance } from "../components/MapDialog";
import VisitFlow from "../components/VisitFlow";
import MobileSectionNav from "../components/MobileSectionNav";
import StaggerIn from "../components/StaggerIn";
import { ROSTERS } from "../lib/rosters";
import { CREW_RULES } from "../lib/dispatch-policy";
// 관제 콘솔 재구성 — 2026-09-22 관제 개선 요청서(19절) · 시안 8장 (components/ops/*)
import OpsDashboard from "../components/ops/OpsDashboard";
import SosCenter from "../components/ops/SosCenter";
import Thresholds from "../components/ops/Thresholds";
import Devices from "../components/ops/Devices";
import Visits from "../components/ops/Visits";
import ElderMgmt from "../components/ops/ElderMgmt";
import GuardianMgmt from "../components/ops/GuardianMgmt";
import ConciergeMgmt from "../components/ops/ConciergeMgmt";
import RequestsMgmt from "../components/ops/RequestsMgmt";
import TogetherMgmt from "../components/ops/TogetherMgmt";
import CommsMgmt from "../components/ops/CommsMgmt";
import HospitalsMgmt from "../components/ops/HospitalsMgmt";
import Accounts from "../components/ops/Accounts";
import AuditLog from "../components/ops/AuditLog";
import Integrations from "../components/ops/Integrations";
import { SosBanner, useIncidents } from "../lib/ops-sos";

// 배치관리자(관제) — 핸드오프 09 상세 명세 + REQ-04(긴급 대응 범위, 회의 확정 우선).
// 데스크톱 전용 · 정보 밀도가 정당한 유일한 화면 (10~13px 활자가 정답 — 09 §0).
// 핵심 원칙: ① AI는 제안, 사람이 승인 (L4)
//            ② 2인이 필요한 자리에서 짝이 없으면 확정 불가 (lib/dispatch-policy.js)
//               — "1인 배차 없음"은 2026-08-13 개편으로 폐기됐다. 정기 재방문 ·
//                 요양병원 · 부부 가구 · 동행 베이직 · 물품 전달은 1인이 원칙이다.
// ③ 피로도 상한은 시스템이 강제. JOBS 단일 원본에서 그리드·페어보드·KPI가 파생된다.

const NAVY = "#0A1F3C";

const KIND_STYLE = {
  active: { bg: "#0A1F3C", fg: "#FFFFFF" },
  planned: { bg: "#E4E9F1", fg: "#0A1F3C" },
  done: { bg: "#EFEDE6", fg: "#5C5A54" },
  sos: { bg: "#C0392B", fg: "#FFFFFF" },
};

const STATE_PILL = {
  완료: { fg: "#5C5A54", bg: "linear-gradient(180deg,#FBFAF7,#F5F3EE)" },
  진행중: { fg: "#1E7A5A", bg: "rgba(30,122,90,.1)" },
  확정: { fg: "#1E7A5A", bg: "rgba(30,122,90,.1)" },
  "순환 경고": { fg: "#8A5D12", bg: "rgba(138,93,18,.1)" },
  "짝 없음": { fg: "#C0392B", bg: "rgba(192,57,43,.1)" },
};

const FORECAST_TONE = {
  ok: { bg: "linear-gradient(180deg,#F1FAF6,#E6F4EE)", border: "rgba(30,122,90,.24)", fg: "#1E7A5A" },
  warn: { bg: "linear-gradient(180deg,#FFF7E8,#FBEFD8)", border: "rgba(138,93,18,.26)", fg: "#8A5D12" },
  bad: { bg: "linear-gradient(180deg,#FFF1EE,#FBE3DE)", border: "rgba(192,57,43,.28)", fg: "#C0392B" },
};

const RISK_LEVEL = {
  높음: { fg: "#C0392B", bg: "rgba(192,57,43,.1)" },
  중간: { fg: "#8A5D12", bg: "rgba(138,93,18,.1)" },
};

// 발송 센터 — 관제 중간관리 커뮤니케이션. 모든 발송은 티커(감사 로그)에 남는다
const COMMS_TEMPLATES = [
  { id: "heat", title: "폭염 안내 — 보호자 전체 공지", desc: "내일 폭염 특보 예보 · 외출 일정 조정 권고 포함", kind: "메시지", log: "보호자 6가구에 폭염 안내 공지 발송", color: "#8FA9CC" },
  { id: "call", title: "안부 콜 캠페인 — 미수신 어르신", desc: "워치 무수집 · 리포트 미열람 가구 대상 음성 콜", kind: "대응", log: "안부 콜 캠페인 시작 — 대상 2가구", color: "#FF8A80" },
  { id: "briefAll", title: "컨시어지 일괄 브리핑 재발송", desc: "내일 08:30 이전 확인 필수 · 미확인 시 개별 콜", kind: "브리핑", log: "컨시어지 9명에게 내일 브리핑 재발송", color: "#F0D9A8" },
  { id: "tz", title: "리포트 발송 시간 안내 — 해외 보호자", desc: "시차 가구(LA · 시드니) 발송 시간 재확인", kind: "리포트", log: "해외 보호자 2명에게 발송 시간 안내", color: "#8FE3C0" },
  { id: "consent", title: "동의 갱신 안내 — 만료 30일 전", desc: "위치 정보 동의 만료 예정 3가구 · 원탭 갱신 링크", kind: "설정", log: "동의 갱신 안내 발송 — 만료 예정 3가구", color: "#8FA9CC" },
];

function hourToHM(h) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function Panel({ children, className = "", style }) {
  return (
    <section
      className={`card-glass rounded-[14px] p-[18px] ${className}`}
      style={style}
    >
      {children}
    </section>
  );
}

function PanelHead({ title, right }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-[15px] font-bold text-navy">{title}</h2>
      {right && <div className="text-[12px] text-muted">{right}</div>}
    </div>
  );
}

// SOS 경과 — 관제만 본다. 가족 화면 노출 금지 (사건 A 정보 비대칭)
function useElapsed(active) {
  const startRef = useRef(null);
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!active) {
      startRef.current = null;
      setSec(0);
      return undefined;
    }
    if (!startRef.current) startRef.current = Date.now();
    const t = setInterval(() => setSec(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [active]);
  return { sec, label: `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}` };
}

// 관제 좌측 GNB — 업무 단위 분리 (경영 콘솔과 동일 구조)
// 관제 좌측 GNB — 2026-09-22 관제 개선 요청서 1절 순서. 대시보드는 '통합 알림센터'로,
// 방문관리 · 해주세요 관리 · 함께해요 관리 · 관제기준 설정 · 계정·권한 · 감사로그 ·
// 시스템 연동상태를 새로 넣었다. 날씨는 요청서에 없지만 기존 기능이라 아래쪽에 둔다.
const DISPATCH_MENUS = [
  ["dash", "통합 알림센터", "home"],
  ["sos", "SOS 대응", "alert"],
  ["thresholds", "관제기준 설정", "shield"],
  ["elder", "어르신 관리", "user"],
  ["guardian", "보호자 관리", "users"],
  ["concierge", "컨시어지 관리", "heart"],
  ["wearable", "웨어러블·센서", "watch"],
  ["visits", "방문관리", "calendar"],
  ["requests", "해주세요 관리", "hand"],
  ["together", "함께해요 관리", "sun"],
  ["comms", "커뮤니케이션", "megaphone"],
  ["hospital", "병원", "hospital"],
  ["weather", "날씨", "drop"],
  ["accounts", "계정·권한", "unlock"],
  ["audit", "감사로그", "list"],
  ["integrations", "시스템 연동상태", "repeat"],
];

// 관제 맵 — Leaflet · 실측 좌표 (09 §4) · 타일 라이트(OSM)/다크(CARTO) 선택
const MAP_TILES = {
  light: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    subdomains: "abc",
    attribution: "© OpenStreetMap contributors",
    bg: "#E6EBF2",
    district: "rgba(10,31,60,.35)",
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    subdomains: "abcd",
    attribution: "© OpenStreetMap © CARTO",
    bg: "#0E2647",
    district: "rgba(255,255,255,.4)",
  },
};

// 지도 팝업에 보이는 인물 정보 — 관제 개선 요청서(2026-09-22) 5절.
// 어르신: 이름·나이 · 현재 건강상태 · 이상징후 · 현재/마지막 위치 · 마지막 위치 수신 시각 ·
//         담당 컨시어지 · 긴급연락처 · 진행 중인 서비스.
// 컨시어지: 이름 · 근무상태 · 현재/마지막 위치 · 수신 시각 · 수행 중 업무 · 담당 고객 ·
//           출동 가능 · 고객까지 거리 · 예상 이동시간.
// '실시간 위치'와 '마지막 수신 위치'를 글자로 구분한다 (같은 절 마지막 줄).
const MAP_PEOPLE_INFO = {
  김순자: {
    kind: "elder",
    rows: [
      ["나이", "78세"],
      ["건강상태", "주의 — 심박 기준 초과 확인 중"],
      ["이상징후", "심박 132 bpm · 기준 120"],
      ["위치", "실시간 · 강남구 대치동 자택"],
      ["위치 수신", "17:43 (1분 전)"],
      ["담당 컨시어지", "박지현"],
      ["긴급연락", "김민수 (아들 · 주보호자)"],
      ["진행 중 서비스", "병원 동행 13:50–18:00 예정"],
    ],
  },
  박지현: {
    kind: "concierge",
    rows: [
      ["근무상태", "동행 중"],
      ["위치", "실시간 · 서울아산병원 인근"],
      ["위치 수신", "17:44 (방금)"],
      ["수행 중 업무", "김순자 · 서울아산 순환기내과 동행"],
      ["담당 고객", "김순자 외 4명"],
      ["출동 가능", "가능 (동행 종료 후)"],
      ["다음 고객까지", "4.2 km · 약 16분"],
    ],
  },
  정민호: {
    kind: "concierge",
    rows: [
      ["근무상태", "수행 중"],
      ["위치", "실시간 · 강서구"],
      ["위치 수신", "17:41"],
      ["수행 중 업무", "안심방문 · 강필순"],
      ["담당 고객", "강필순 외 3명"],
      ["출동 가능", "불가 (방문 중)"],
    ],
  },
  한서연: {
    kind: "concierge",
    rows: [
      ["근무상태", "대기"],
      ["위치", "마지막 수신 위치 · 용산구"],
      ["위치 수신", "17:20 (24분 전 · 지연)"],
      ["수행 중 업무", "없음"],
      ["담당 고객", "오태식 외 2명"],
      ["출동 가능", "가능 · 1인"],
      ["김순자까지", "6.8 km · 약 25분"],
    ],
  },
};

function popupHtml(name, label) {
  const info = MAP_PEOPLE_INFO[name];
  if (!info) return label;
  const rows = info.rows
    .map(([k, v]) => `<div style="display:flex;gap:8px;font-size:11px;line-height:1.5"><span style="color:#5C5A54;min-width:76px">${k}</span><span style="color:#0A1F3C;font-weight:600">${v}</span></div>`)
    .join("");
  return `<div style="min-width:220px"><div style="font-weight:700;font-size:13px;color:#0A1F3C;margin-bottom:4px">${label}</div>${rows}</div>`;
}

// focus: 이름 검색 결과 — 그 인물 위치로 지도가 즉시 이동하고 마커가 강조된다 (요청서 5절)
function ControlMap({ sos, mode = "light", onSelect, focus, focusKey }) {
  const nodeRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});

  // 이름 검색 → 해당 마커로 이동 · 강조 · 팝업
  useEffect(() => {
    const map = mapRef.current;
    const m = focus && markersRef.current[focus];
    if (!map || !m) return;
    map.flyTo(m.getLatLng(), 15, { duration: 0.8 });
    m.setStyle({ radius: 12, weight: 4 });
    m.openPopup();
    const t = setTimeout(() => m.setStyle({ radius: 7, weight: 2 }), 4000);
    return () => clearTimeout(t);
    // focusKey 는 같은 이름을 다시 찾아도 다시 이동하게 하는 열쇠다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, focusKey]);

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((mod) => {
      const L = mod.default || mod;
      if (cancelled || !nodeRef.current) return;
      const map = L.map(nodeRef.current, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: false, // 페이지 스크롤 중 줌 방지 — 관제사가 위치를 잃는다
      });
      mapRef.current = map;
      const tile = MAP_TILES[mode] || MAP_TILES.light;
      L.tileLayer(tile.url, {
        subdomains: tile.subdomains,
        maxZoom: 19,
        attribution: tile.attribution,
      }).addTo(map);

      const pts = [];
      const add = (lat, lng, label, color, radius, sel) => {
        pts.push([lat, lng]);
        const m = L.circleMarker([lat, lng], {
          radius,
          color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.5,
        });
        m.addTo(map).bindPopup(sel ? popupHtml(sel, label) : label, { className: "kcare-popup" });
        if (sel && onSelect) m.on("click", () => onSelect(sel)); // 마커 → 플로팅 프로필
        if (sel) markersRef.current[sel] = m; // 이름 검색용
      };
      const tileTheme = MAP_TILES[mode] || MAP_TILES.light;
      MAP_DISTRICTS.forEach((d) => add(d.lat, d.lng, d.name, tileTheme.district, 4));
      MAP_HOSPITALS.forEach((h) => add(h.lat, h.lng, `${h.name} · 제휴 병원`, "#B08D57", 7, h.name));
      mapPeople(sos, mode).forEach((p) => add(p.lat, p.lng, p.label, p.color, 7, p.label.split(" ·")[0]));
      map.fitBounds(L.latLngBounds(pts), { padding: [26, 26] });
    });

    const onResize = () => mapRef.current && mapRef.current.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      if (mapRef.current) {
        mapRef.current.remove(); // cleanup 필수 (09 §4)
        mapRef.current = null;
      }
    };
    // onSelect 는 의존성에 넣지 않는다 — 부모가 리렌더될 때마다 새 함수가 오므로
    // 넣으면 지도를 통째로 다시 만든다(타일 재요청 + 깜빡임). 여기서는 최신 값을
    // 참조할 필요도 없어서 초기화 시점 것으로 충분하다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sos, mode]);

  return (
    <div className="relative">
      <div
        ref={nodeRef}
        className="h-[300px] overflow-hidden rounded-[10px]"
        style={{ background: (MAP_TILES[mode] || MAP_TILES.light).bg }}
      />
      <div className="pointer-events-none absolute bottom-2 left-2 z-[1000] rounded-md bg-black/45 px-2 py-1 text-[10px] font-bold tracking-[.08em] text-white/80">
        SEOUL · OpenStreetMap 실측 좌표
      </div>
    </div>
  );
}

// 날씨 지도 — 관제 맵과 같은 Leaflet · 권역 마커에 기온·미세먼지를 상시 라벨로 표시.
// 데이터는 단일 출처를 쓴다 (WEATHER_DISTRICTS ↔ MAP_DISTRICTS 이름 매칭).

const WEATHER_TONE = {
  bad: "#C0392B",
  warn: "#8A5D12",
  info: "#0A1F3C",
  ok: "#1E7A5A",
};

function WeatherMap() {
  const nodeRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((mod) => {
      const L = mod.default || mod;
      if (cancelled || !nodeRef.current) return;
      const map = L.map(nodeRef.current, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: false,
      });
      mapRef.current = map;
      const tile = MAP_TILES.light;
      L.tileLayer(tile.url, { subdomains: tile.subdomains, maxZoom: 19, attribution: tile.attribution }).addTo(map);

      const pts = [];
      WEATHER_DISTRICTS.forEach((w) => {
        const d = MAP_DISTRICTS.find((x) => x.name === w.name);
        if (!d) return;
        pts.push([d.lat, d.lng]);
        const color = WEATHER_TONE[w.tone] || WEATHER_TONE.info;
        // 상시 라벨은 기온만 — 5개 권역이 가까워 긴 라벨은 어느 방향이든 충돌한다.
        // 미세먼지 등 상세는 클릭 팝업 + 지도 아래 권역 칩에서 확인.
        L.circleMarker([d.lat, d.lng], {
          radius: 11,
          color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.35,
        })
          .addTo(map)
          .bindPopup(`${w.name} ${w.temp} · 미세먼지 ${w.pm}`, { className: "kcare-popup" })
          .bindTooltip(w.temp, {
            permanent: true,
            direction: w.dir || "top",
            offset: { top: [0, -12], bottom: [0, 12], left: [-12, 0], right: [12, 0] }[w.dir] || [0, -12],
            className: "kcare-wx-label",
          });
      });
      // 좌우 여백 — 좌/우 방향 상시 라벨이 화면 밖으로 잘리지 않을 만큼만
      map.fitBounds(L.latLngBounds(pts), { padding: [64, 36] });
    });

    const onResize = () => mapRef.current && mapRef.current.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative">
      <div ref={nodeRef} className="h-[300px] overflow-hidden rounded-[10px]" style={{ background: MAP_TILES.light.bg }} />
      <div className="pointer-events-none absolute bottom-2 left-2 z-[1000] rounded-md bg-black/45 px-2 py-1 text-[10px] font-bold tracking-[.08em] text-white/80">
        기상 데이터 — 5분 갱신
      </div>
    </div>
  );
}

export default function DispatchConsole() {
  const { state, dispatch } = useAppState();
  const { sos, nightOption } = state.demo;
  const { sosDispatched, sos119, assign, unmatchFixed, npsDetractor } = state.ops;
  const checkedIn = state.visit.checkedIn;
  const { label: elapsed, sec: elapsedSec } = useElapsed(sos);
  const [tab, setTab] = useState("live");
  const [range, setRange] = useState("7");
  const [briefed, setBriefed] = useState(false);
  const [mapMode, setMapMode] = useState("light"); // 맵 타일 라이트/다크
  const [mapFocus, setMapFocus] = useState(null); // 지도 이름 검색 — 그 위치로 이동·강조 (요청서 5절)
  const [mapQuery, setMapQuery] = useState("");
  const [mapFocusName, setMapFocusName] = useState(null);
  const [sosFocus, setSosFocus] = useState(null); // 대시보드에서 넘어온 SOS 사건 id
  const [query, setQuery] = useState(""); // 통합 검색
  const [menu, setMenu] = useState("dash"); // GNB — 대시보드 외 관리 메뉴
  // 딥링크 — /dispatch?menu=comms 등 (시연 동선에서 감사 로그를 관제와 구분 진입)
  const router = useRouter();
  useEffect(() => {
    const m = router.query.menu;
    if (typeof m === "string" && DISPATCH_MENUS.some(([k]) => k === m)) {
      setMenu(m);
    }
  }, [router.query.menu]);
  const [sent, setSent] = useState({}); // 발송 센터 원샷
  const [briefRead, setBriefRead] = useState(false); // 아침 브리핑 읽음
  const [hoStage, setHoStage] = useState("accept"); // 핸드오프 정체 — 선택 단계 (기본: 최대 정체)
  const [hoDone, setHoDone] = useState({}); // 정체 건 처리 원샷
  // 사이드바 배지 카운트 — 메뉴별 관리 대상 수 (명부가 단일 출처 · 상세 프로필 보유 수와 다름)
  const { open: sosOpen } = useIncidents(); // 진행 중 SOS 사건 — 사이드바 배지 (요청서 6-6)
  const MENU_COUNTS = {
    sos: sosOpen.length,
    elder: ROSTERS.elders.rows.length,
    guardian: ROSTERS.guardians.rows.length,
    concierge: ROSTERS.concierges.rows.length,
    hospital: ROSTERS.hospitals.rows.length,
    wearable: WEAR_DEVICES.length,
  };
  const [profile, setProfile] = useState(null); // 플로팅 프로필 카드
  const [profilePos, setProfilePos] = useState({ x: 0, y: 0 }); // 클릭 지점 — 카드가 근처에 뜬다
  const lastPointer = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const h = (e) => {
      lastPointer.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("pointerdown", h);
    return () => window.removeEventListener("pointerdown", h);
  }, []);

  // 좌측 메뉴로 화면을 바꾸면 본문은 항상 맨 위에서 시작한다
  const scrollFirst = useRef(true);
  useEffect(() => {
    if (scrollFirst.current) {
      scrollFirst.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [menu]);

  const openProfile = (name) => {
    const item = DIRECTORY_ALL.find((d) => d.name === name);
    if (item) {
      setProfilePos(lastPointer.current);
      setProfile(item);
      setQuery("");
    }
  };
  const searchResults =
    query.trim().length >= 1
      ? DIRECTORY_ALL.filter(
          (d) => d.name.includes(query.trim()) || d.summary.includes(query.trim())
        ).slice(0, 8)
      : [];

  // 초 단위 시계 (09 §1) — SOS 경과가 초 단위라 화면이 1초 틱으로 갱신
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const push = (kind, text, color) =>
    dispatch({ type: "pushEvent", payload: { kind, text, color } });

  // ⚙ JOBS 단일 원본 → 상태 반영 파생 (09 §6 · §10)
  const jobs = JOBS.map((j) => {
    if (j.id === "j2") {
      return { ...j, kind: sosDispatched ? "sos" : checkedIn ? "active" : "planned" };
    }
    if (j.id === "j4" && unmatchFixed) {
      return { ...j, sup: "서다인", kind: "planned", state: "확정", note: "서다인 재배치 · 18:10 건 재편성 완료" };
    }
    return j;
  });

  // 배차 그리드 행 — 바가 있는 인력만
  const rows = STAFF.map((st) => {
    const bars = jobs
      .filter((j) => j.lead === st.name || j.sup === st.name)
      .map((j) => {
        const isLead = j.lead === st.name;
        const tok = j.job.split("·")[0].trim();
        const sub = isLead
          ? j.sup
            ? `주 · ${tok} (짝 ${j.sup})`
            : `주 · ${tok} — 부 동행 미배정`
          : `부 · 이동·접수 (주 ${j.lead})`;
        return {
          id: `${j.id}-${isLead ? "L" : "S"}`,
          left: ((j.s - 8) / 12) * 100,
          width: ((j.e - j.s) / 12) * 100,
          label: j.client,
          sub: `${hourToHM(j.s)}–${hourToHM(j.e)} · ${sub}`,
          ...KIND_STYLE[j.kind],
        };
      });
    return { ...st, bars };
  }).filter((r) => r.bars.length);

  // 현재 시각선 (08:00–20:00 구간)
  const nowPct = ((now.getHours() + now.getMinutes() / 60 - 8) / 12) * 100;
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // 페어 KPI — JOBS에서 계산 (09 §8.1)
  const paired = jobs.filter((j) => j.sup).length;
  const rotationWarns = jobs.filter((j) => j.state === "순환 경고").length;
  const pairKpis = [
    {
      k: "오늘 페어 편성",
      v: `${paired} / ${jobs.length}`,
      note: unmatchFixed ? "미편성 해소 · 서다인 재배치" : "1건 미편성 (16:20 투석)",
      color: unmatchFixed ? "#1E7A5A" : "#8A5D12",
    },
    { k: "순환 경고", v: String(rotationWarns), note: "동일 페어 3회 연속 · 다음 배정 순환", color: "#8A5D12" },
    { k: "평균 편성 소요", v: "38초", note: "AI 제안 → 승인", color: "#1E7A5A" },
    // 불변량 — 이 값이 0이 아니게 되는 코드 경로를 만들지 않는다 (예외 승인 절차 없음)
    { k: "단독 배차", v: "0", note: "예외 승인 절차 없음", color: "#1E7A5A" },
  ];

  // KPI — 실시간 계산 · 클릭 시 해당 화면으로 점프
  const unmatchedCount = jobs.filter((j) => !j.sup).length;
  const kpis = [
    { k: "진행중", v: "2", color: "#0A1F3C", tab: "live" },
    { k: "오늘 배차", v: String(jobs.length), color: "#0A1F3C", tab: "live" },
    { k: "가동률", v: "82%", color: "#1E7A5A", tab: "plan" },
    { k: "미매칭", v: String(unmatchedCount), color: unmatchedCount > 0 ? "#C0392B" : "#5C5A54", tab: "pair" },
    { k: "SOS", v: sos ? "1" : "0", color: sos ? "#C0392B" : "#5C5A54", jump: "sos-banner" },
  ];

  // ── 액션 큐 — 지금 관제가 처리할 일. 우선순위·마감을 한 줄로 (상황파악 → 적시 대응) ──
  const [handled, setHandled] = useState({});
  const [watchCalled, setWatchCalled] = useState(false);
  const [guardianPinged, setGuardianPinged] = useState(false);
  const [nightCalled, setNightCalled] = useState(false); // 야간 출동(외주) 호출 — REQ-04
  const actions = [];
  if (sos)
    actions.push({
      id: "sos", level: "critical",
      title: sosDispatched ? "SOS 대응 중 — 119 연계·해제 판단" : "SOS 급파 지시 필요",
      meta: `경과 ${elapsed} · 목표 60초`, jump: "sos-banner",
    });
  if (unmatchedCount > 0)
    actions.push({
      id: "unmatch", level: "high", title: "짝 미매칭 — 한복자 (79) 투석 16:20",
      meta: "해소 목표 15:50 · 서다인 재배치안 승인 대기", jumpTab: "pair",
    });
  if (npsDetractor && !handled.npsCall)
    actions.push({
      id: "npsCall", level: "high",
      title: `만족도 ${npsDetractor.score}점 회복 콜 — 김민수 (${npsDetractor.reason || "사유 미선택"})`,
      meta: "보호자 앱 NPS 접수 → 24h SLA · 회복이 먼저", act: "콜 완료",
      ticker: ["대응", "NPS 회복 콜 완료 — 김민수 · 조치 결과 가족 공유 예정", "#8FA9CC"],
      clear: { npsDetractor: null },
    });
  if (assign === "pending")
    actions.push({
      id: "assign", level: "high", title: `AI 배정안 ${AI_ASSIGN.length}건 승인 대기`,
      meta: "평균 적합 94% · 목표 10분 내 확정", jump: "ai-assign",
    });
  if (!handled.fallCall)
    actions.push({
      id: "fallCall", level: "med", title: "이영호 (81) 경과 관찰 콜",
      meta: "어제 낙상 복합 알림 · 동행 전 컨디션 확인", act: "콜 완료",
      ticker: ["대응", "이영호 경과 관찰 콜 완료 · 컨디션 양호", "#8FA9CC"],
    });
  if (!handled.battCall)
    actions.push({
      id: "battCall", level: "med", title: "박말순 (83) 워치 무수집 확인 콜",
      meta: "6시간 무수집 · 배터리 원인 분리 후 판단", act: "콜 완료",
      ticker: ["대응", "박말순 배터리 확인 콜 완료 · 충전 안내", "#8FA9CC"],
    });
  if (!briefed)
    actions.push({
      id: "brief", level: "med", title: "외출 브리핑 3건 발송",
      meta: "최정자 34점 — 일정 조정 권고 포함", jumpTab: "plan",
    });
  // 어르신 화면에서 온 부탁 — 도와줘요(즉시 방문) · 해주세요 · 복지혜택 (2026-09-04 시트
  // 어르신 해주세요 3번: "관제가 먼저 전화로 확인한다고 되어 있으나 관제 대시보드에 없음").
  // 어르신 화면은 '관제센터에서 확인 전화를 드립니다'라고 약속하므로, 확인 전화를 여기서
  // 끝내면 그 건이 '확인됨'으로 넘어가 어르신·컨시어지 화면 문구가 같이 바뀐다.
  (state.requests || [])
    .filter((r) => r.dir === "fromElder" && r.status === "requested")
    .forEach((r) =>
      actions.push({
        id: `elder-${r.id}`,
        level: r.urgency === "urgent" ? "high" : "med",
        title: `${r.type} — ${ELDER.name} (${ELDER.age})`,
        meta: `어르신 화면 · ${r.detail}`,
        act: "확인 전화 완료",
        ticker: ["대응", `${ELDER.name} ${r.type} 확인 전화 완료 — 컨시어지 ${r.assignee} 진행`, "#8FA9CC"],
        onAct: () => dispatch({ type: "transitionRequest", id: r.id, to: "confirmed", note: "관제 확인 전화 완료 · 컨시어지 진행" }),
      })
    );
  const LEVEL_ORDER = { critical: 0, high: 1, med: 2 };
  actions.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);

  // 헤더 상태 필 — 한눈에 관제 상황 등급
  const status = sos
    ? { label: "SOS 대응 중", cls: "animate-sosPulse bg-danger text-white" }
    : actions.length > 0
    ? { label: `주의 · 처리 대기 ${actions.length}건`, cls: "border border-amber/30 bg-[#FFF7E8] text-amber" }
    : { label: "정상 운영", cls: "bg-[rgba(30,122,90,.12)] text-green" };

  const jumpTo = (a) => {
    setMenu("dash");
    if (a.jumpTab) {
      setTab(a.jumpTab);
      setTimeout(() => document.getElementById("disp-tabs")?.scrollIntoView({ behavior: "smooth" }), 80);
    } else if (a.jump) {
      setTimeout(() => document.getElementById(a.jump)?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
    }
  };

  // 티커 필터 — 관제사가 원하는 종류만 빠르게
  const [tickerFilter, setTickerFilter] = useState("all");
  const TICKER_GROUPS = {
    all: null,
    urgent: ["SOS", "대응", "환경"],
    dispatchG: ["배차", "동행", "예약", "브리핑"],
    care: ["복약", "리포트", "메시지", "어르신", "체크인", "일정"],
    commerce: ["구매대행", "장바구니", "스토어", "옵션", "정산", "보험", "제안", "설정"],
  };
  const tickerGroup = TICKER_GROUPS[tickerFilter];
  const tickerItems = state.ticker.filter((e) => !tickerGroup || tickerGroup.includes(e.kind));
  const renderTicker = (maxH) => (
    <>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {[["all", "전체"], ["urgent", "긴급"], ["dispatchG", "배차"], ["care", "케어"], ["commerce", "커머스"]].map(
          ([k, label]) => (
            <button
              key={k}
              onClick={() => setTickerFilter(k)}
              className="btn-press rounded-full border btn-press px-3 py-2.5 text-[11px] font-bold"
              style={
                tickerFilter === k
                  ? { background: NAVY, color: "#FFFFFF", borderColor: NAVY }
                  : { background: "rgba(255,255,255,.6)", color: "#5C5A54", borderColor: "rgba(10,31,60,.14)" }
              }
            >
              {label}
            </button>
          )
        )}
      </div>
      <div className="mt-2.5 space-y-[9px] overflow-y-auto pr-1" style={{ maxHeight: maxH }}>
        {tickerItems.length === 0 && <div className="py-2 text-[13px] text-muted">해당 종류의 접수가 없습니다.</div>}
        {tickerItems.map((e) => (
          <div key={e.id} className="flex animate-tickIn items-start gap-2">
            <span className="w-[34px] shrink-0 pt-0.5 font-num text-[11px] font-semibold text-muted">
              {new Date(e.at).toTimeString().slice(0, 5)}
            </span>
            <span
              className="shrink-0 rounded-[20px] px-2 py-0.5 text-[11px] font-bold text-navy"
              style={{ background: `${e.color}33` }}
            >
              {e.kind}
            </span>
            <span className="flex-1 text-[13px] leading-[1.5] text-ink">{e.text}</span>
          </div>
        ))}
      </div>
    </>
  );

  const forecast = range === "3" ? WEEK_FORECAST.slice(0, 3) : WEEK_FORECAST;

  // 관제 맵 — 통합 알림센터 오른쪽 열에 들어간다 (OpsDashboard mapSlot). 이름 검색은 요청서 5절.
  const mapPanel = (
    <>
          {/* ── 관제 맵 (09 §4) ── */}
          <section className="card-navy mt-[18px] rounded-[14px] p-[18px]" style={{ background: NAVY }}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-[15px] font-bold text-white">관제 맵</h2>
                {/* 어르신·컨시어지 이름 검색 — 일치하면 지도가 그 위치로 즉시 이동하고 마커가 강조된다 (요청서 5절) */}
                <form
                  className="flex items-center gap-1.5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const q = mapQuery.trim();
                    const hit = Object.keys(MAP_PEOPLE_INFO).find((n) => n.includes(q));
                    setMapFocus(hit ? `${hit}-${Date.now()}` : null);
                    setMapFocusName(hit || null);
                  }}
                >
                  <label htmlFor="map-search" className="sr-only">지도에서 어르신·컨시어지 이름 검색</label>
                  <input
                    id="map-search"
                    list="map-search-names"
                    value={mapQuery}
                    onChange={(e) => setMapQuery(e.target.value)}
                    placeholder="어르신 · 컨시어지 이름"
                    className="w-[168px] rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-[12px] font-medium text-white outline-none placeholder:text-white/40 focus:border-gold"
                  />
                  <datalist id="map-search-names">
                    {Object.keys(MAP_PEOPLE_INFO).map((n) => (
                      <option key={n} value={n} />
                    ))}
                  </datalist>
                  <button type="submit" className="btn-press rounded-lg border border-white/20 px-2.5 py-1.5 text-[12px] font-bold text-white/85">
                    찾기
                  </button>
                  {mapQuery.trim() && mapFocus === null && (
                    <span className="text-[11px] font-bold text-white/60">지도에 없는 이름</span>
                  )}
                </form>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-white/70">
                {[
                  ["#4ADE80", "이동·수행중"],
                  ["#8FA9CC", "대기"],
                  ["#FF6B5B", "SOS"],
                  ["#B08D57", "제휴 병원"],
                ].map(([c, l]) => (
                  <span key={l} className="flex items-center gap-1.5">
                    <span className="h-[7px] w-[7px] rounded-full" style={{ background: c }} />
                    {l}
                  </span>
                ))}
                <span className="font-medium text-white/45">OpenStreetMap 기반 실측 좌표</span>
                <span className="ml-2 flex overflow-hidden rounded-lg border border-white/20">
                  {[
                    ["light", "라이트"],
                    ["dark", "다크"],
                  ].map(([m, label]) => (
                    <button
                      key={m}
                      onClick={() => setMapMode(m)}
                      className={`btn-press px-3 py-2.5 text-[11px] font-bold ${
                        mapMode === m ? "bg-white/90 text-navy" : "text-white/60"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </span>
              </div>
            </div>
            <ControlMap sos={sos} mode={mapMode} onSelect={openProfile} focus={mapFocusName} focusKey={mapFocus} />
          </section>
    </>
  );

  return (
    <>
      <Head>
        <title>배치 관제 센터 — K-CARE</title>
      </Head>
      <div className="console-bg min-h-screen text-ink lg:flex">
        {/* 전고 사이드바 — 경영 콘솔과 동일 구조 (관제 업무 메뉴) */}
        <aside className="sticky top-0 hidden h-screen w-[212px] shrink-0 flex-col lg:flex" style={{ background: NAVY }}>
          <div className="px-5 pt-6">
            <Logo height={30} tone="onDark" beta />
            <div className="mt-1 text-[11px] font-bold tracking-[.14em] text-white/40">관제 콘솔 · 현장 관리</div>
          </div>
          {/* nav 가 이 화면에 둘이라 이름을 붙여 구분한다 (axe: landmark-unique) */}
          <nav aria-label="관제 메뉴" className="mt-5 min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
            {DISPATCH_MENUS.map(([k, label, icon]) => {
              const n = MENU_COUNTS[k];
              return (
                <button
                  key={k}
                  onClick={() => setMenu(k)}
                  className="btn-press flex w-full items-center gap-2.5 rounded-[10px] border-l-[3px] px-3 py-2.5 text-left text-[13px] font-bold"
                  style={
                    menu === k
                      ? { background: "rgba(255,255,255,.1)", color: "#FFFFFF", borderColor: "#B08D57" }
                      : { color: "rgba(255,255,255,.55)", borderColor: "transparent" }
                  }
                >
                  <Icon name={icon} size={16} />
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  {k === "sos" && sos && (
                    <span className="h-[7px] w-[7px] shrink-0 animate-livePing rounded-full bg-danger" />
                  )}
                  {n != null && <span className="shrink-0 font-num text-[11px] text-white/40">{n}</span>}
                </button>
              );
            })}
          </nav>
          <div className="border-t border-white/10 px-5 py-4">
            <p className="text-[10px] leading-[1.6] text-white/35">현장 관제 — 배차 · 해제 실행은 관제사 승인 (L4)</p>
            <Link href="/" className="btn-press mt-2.5 block rounded-[10px] border border-white/20 py-2 text-center text-[12px] font-bold text-white/80">데모 홈</Link>
          </div>
        </aside>

        {/* 랜드마크 — 이 파일은 3,000줄대라 태그를 <main> 으로 바꾸면 짝을 잘못 맞출
            위험이 크다. role="main" 은 보조기기에 같은 랜드마크로 전달되고
            구조를 건드리지 않는다. 파일을 쪼갤 때 <main> 으로 바꾼다. */}
        <div role="main" className="min-w-0 flex-1 px-4 pb-10 pt-7 sm:px-8">
        <div className="mx-auto max-w-[1240px]">
          {/* ── 헤더: 제목 + 시계 + KPI ── */}
          {/* 콘텐츠 제목 영역 — 페이지 배너가 아니다.
              <header> 로 두면 banner 랜드마크로 잡히는데, 이 파일은 role="main"
              (속성)이라 <main> 요소처럼 배너 매핑을 막아 주지 못한다. 그래서
              본문 안에 배너가 중첩된 것으로 보고된다 (axe: landmark-banner-is-top-level). */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-bold tracking-[.16em] text-muted">
                  역할 04 / 배치 관제 센터
                </span>
                <Link href="/" className="tap text-[12px] font-bold text-muted/60 underline-offset-2 hover:underline">
                  데모 홈
                </Link>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2.5">
                <h1 className="text-[29px] font-bold tracking-[-.01em] text-navy">강남지점 실시간 관제</h1>
                <button
                  onClick={() => setMenu("dash")}
                  title="대시보드로 이동"
                  className={`btn-press rounded-full px-3 py-1 text-[12px] font-bold ${status.cls}`}
                >
                  {status.label}
                </button>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[15px] text-muted">
                <span>
                  {now.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
                </span>
                <span className="h-[3px] w-[3px] rounded-full bg-navy/30" />
                <span className="font-num text-[17px] font-bold text-navy">{now.toTimeString().slice(0, 8)}</span>
                <span className="text-[12px] font-semibold">KST</span>
                <span className="ml-1 h-[6px] w-[6px] animate-livePing rounded-full bg-green" />
                <span className="text-[12px] font-bold text-green">LIVE</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {kpis.map((k) => (
                <button
                  key={k.k}
                  onClick={() => {
                    setMenu("dash");
                    if (k.jump)
                      setTimeout(
                        () => document.getElementById(k.jump)?.scrollIntoView({ behavior: "smooth", block: "center" }),
                        80
                      );
                    else setTab(k.tab);
                  }}
                  className="card-glass btn-press min-w-[104px] rounded-xl px-4 py-[11px] text-left"
                  title="클릭하면 해당 화면으로 이동"
                >
                  <div className="text-[11px] font-bold text-muted">{k.k}</div>
                  <div className="font-num text-[22px] font-bold" style={{ color: k.color }}>
                    {k.v}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── 모바일 메뉴 칩(사이드바 대체) + 통합 검색 ── */}
          <nav aria-label="화면 전환" className="mt-4 flex flex-wrap items-center gap-2 border-b border-navy/[.08] pb-3">
            <MobileSectionNav
              groups={[["관제", DISPATCH_MENUS]]}
              current={menu}
              onSelect={setMenu}
              badges={MENU_COUNTS}
              dots={{ sos: !!sos }}
              className="w-full"
            />
            <div className="relative ml-auto w-full min-w-[240px] sm:w-[320px]">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="검색 — 어르신 · 보호자 · 컨시어지 · 병원"
              className="card-glass w-full rounded-xl px-4 py-2.5 text-[15px] font-medium text-navy outline-none placeholder:text-muted/60 focus:ring-1 focus:ring-gold"
            />
            {searchResults.length > 0 && (
              <div className="card-frost absolute left-0 right-0 top-[46px] z-[1050] overflow-hidden rounded-xl">
                {searchResults.map((d) => (
                  <button
                    key={`${d.type}-${d.name}`}
                    onClick={() => openProfile(d.name)}
                    className="flex w-full items-center gap-2.5 border-t border-navy/[.06] px-4 py-2.5 text-left first:border-t-0 hover:bg-navy/[.04]"
                  >
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ color: "#0A1F3C", background: "rgba(10,31,60,.08)" }}
                    >
                      {DIRECTORY_TYPE[d.type].label}
                    </span>
                    <span className="shrink-0 text-[15px] font-bold text-navy">
                      {d.name} <span className="text-[11px] font-medium text-muted">{d.tag}</span>
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[12px] text-muted">{d.summary}</span>
                  </button>
                ))}
              </div>
            )}
              {query.trim().length >= 1 && searchResults.length === 0 && (
                <div className="card-frost absolute left-0 right-0 top-[46px] z-[1050] rounded-xl px-4 py-3 text-[13px] text-muted">
                  검색 결과가 없습니다.
                </div>
              )}
            </div>
          </nav>

          {/* ── SOS 배너 (09 §2 + REQ-04 경계) — SOS 섹션에는 전용 배너가 있으므로 중복 제외 ── */}
          {sos && menu !== "sos" && (
            <section
              id="sos-banner"
              className="mt-[18px] flex flex-wrap items-center gap-[18px] rounded-[14px] bg-danger px-5 py-4 text-white animate-sosPulse"
            >
              <span className="rounded-lg bg-white/[.18] px-2.5 py-1.5 text-[12px] font-bold tracking-[.14em]">
                SOS
              </span>
              <div className="min-w-[240px] flex-1">
                <div className="text-[17px] font-bold">
                  김순자 (78) · 강남구 대치동 — 최근접 컨시어지 박지현 (1.2km)
                </div>
                <div className="mt-0.5 font-num text-[13px] opacity-[.88]">
                  경과 {elapsed} · 목표 응답 60초 이내 · {sos119 ? "119 연계 완료" : "119 연계 대기"}
                </div>
                <div className="mt-2 h-[6px] w-full max-w-[300px] overflow-hidden rounded-full bg-white/25">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (elapsedSec / 60) * 100)}%`,
                      background: elapsedSec >= 60 ? "#FFD9D4" : "#FFFFFF",
                      transition: "width 1s linear",
                    }}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[["접수", true], ["급파", sosDispatched], ["119 연계", sos119], ["해제", false]].map(([st, done]) => (
                    <span
                      key={st}
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        done ? "bg-white text-danger" : "border border-white/40 text-white/75"
                      }`}
                    >
                      {done ? `✓ ${st}` : st}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* 급파 지시가 해제보다 시각적으로 강하다 — 실수 방지 (09 §2) */}
                <button
                  onClick={() => {
                    if (sosDispatched) return;
                    dispatch({ type: "opsPatch", patch: { sosDispatched: true } });
                    push("대응", "박지현 급파 지시 · 119 연계 대기", "#FF8A80");
                  }}
                  disabled={sosDispatched}
                  className="btn-press btn-on-red rounded-xl bg-white px-4 py-2.5 text-[15px] font-bold text-danger disabled:opacity-80"
                >
                  {sosDispatched ? "급파 중 · 박지현" : "급파 지시 (주간 · 가용)"}
                </button>
                <button
                  onClick={() => {
                    if (sos119) return;
                    dispatch({ type: "opsPatch", patch: { sos119: true } });
                    push("대응", "119 연계 기록 · 기본 보증 범위 내 조치", "#FF8A80");
                  }}
                  disabled={sos119}
                  className="btn-press rounded-xl border border-white/70 px-4 py-2.5 text-[15px] font-bold disabled:opacity-70"
                >
                  {sos119 ? "119 연계 기록됨" : "119 연계"}
                </button>
                <button
                  onClick={() => {
                    dispatch({ type: "ackSos" });
                    push("대응", "SOS 확인 처리 — 알림 상태 해제", "#8FA9CC");
                  }}
                  className="btn-press rounded-xl border border-white/40 px-4 py-2.5 text-[15px] font-medium"
                >
                  해제
                </button>
                <button
                  onClick={() => {
                    if (watchCalled) return;
                    setWatchCalled(true);
                    push("대응", "김순자 워치 자동 통화 시도 — 응답 대기", "#FF8A80");
                  }}
                  disabled={watchCalled}
                  className="btn-press rounded-xl border border-white/40 px-4 py-2.5 text-[15px] font-medium disabled:opacity-70"
                >
                  {watchCalled ? "워치 통화 시도됨" : "워치 통화"}
                </button>
                <button
                  onClick={() => {
                    if (guardianPinged) return;
                    setGuardianPinged(true);
                    push("대응", "보호자 김민수에게 상황 확인 알림 발송", "#8FA9CC");
                  }}
                  disabled={guardianPinged}
                  className="btn-press rounded-xl border border-white/40 px-4 py-2.5 text-[15px] font-medium disabled:opacity-70"
                >
                  {guardianPinged ? "보호자 알림 발송됨" : "보호자 알림"}
                </button>
                {/* REQ-04 — 야간 출동은 기본 상품 밖이라 가입 가구에서만 조치로 뜬다.
                    미가입 가구에 이 버튼이 보이면 관제가 없는 자원을 부르게 된다. */}
                {nightOption && (
                  <button
                    onClick={() => {
                      if (nightCalled) return;
                      setNightCalled(true);
                      push("대응", "야간 출동(외주) 파트너 호출 — 옵션 가입 가구", "#F0D9A8");
                    }}
                    disabled={nightCalled}
                    className="btn-press rounded-xl border border-white/40 px-4 py-2.5 text-[15px] font-medium disabled:opacity-70"
                  >
                    {nightCalled ? "야간 출동 요청됨" : "야간 출동 요청 (외주)"}
                  </button>
                )}
              </div>
              {/* REQ-04 — 서비스 경계 고지 (회의 확정) */}
              <div className="w-full border-t border-white/25 pt-2 text-[12px] opacity-80">
                기본 상품 보증 범위: 긴급신호 접수 + 119 연계까지 · 현장 도착 SLA 아님 ·{" "}
                {nightOption
                  ? "이 가구는 야간 출동(외주) 옵션 가입 — 파트너 호출 가능"
                  : "이 가구는 야간 출동(외주) 옵션 미가입"}
              </div>
            </section>
          )}

          {/* ▼ 대시보드 — 운영 상황판 (menu) */}
          {/* 섹션 본문 — 좌측 메뉴로 바꾸면 스르르 올라오며 들어온다 */}
          {menu !== "sos" && (
            <SosBanner
              onOpen={(id) => {
                setSosFocus(id || null);
                setMenu("sos");
              }}
            />
          )}
          <StaggerIn trigger={menu}>
          {menu === "dash" && (
            <OpsDashboard
              onStartSos={(_name, id) => {
                setSosFocus(id || null);
                setMenu("sos");
              }}
              onOpenSos={(id) => {
                setSosFocus(id || null);
                setMenu("sos");
              }}
              mapSlot={mapPanel}
              opsSlot={<>
          {/* ── 방문 업무흐름 8단계 — 일정 수립 알람이 여기로 온다 (2026-08-13 미팅) ── */}
          <section className="mt-[18px]">
            <VisitFlow role="ops" />
          </section>

          {/* ── 보호자 일정등록 요청 승인 (2026-08-12 보호자화면 시트 예약 1번) ──
              보호자가 K-CARE 일정을 '요청'하면 여기서만 캘린더로 올라간다. */}
          <EventApprovals />

          {/* ── 복지혜택 자동 매칭 — 가구별 (2026-09-04 시트 앱 전체 3번) ──
              관제가 자동으로 찾고, 상세는 이름을 눌러 프로필에서 본다. */}
          <WelfareBoard onOpen={openProfile} answers={state.welfare?.answers} statuses={state.welfare?.status} />

          {/* ── 액션 큐 — 지금 처리할 일. 우선순위순, 클릭 즉시 해당 화면 (고도화) ── */}
          <section className="card-glass mt-[18px] rounded-[14px] px-5 py-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[15px] font-bold tracking-[.02em] text-navy">지금 처리할 일</h2>
              <span className="font-num text-[12px] text-muted">{actions.length}건 · 우선순위순</span>
            </div>
            {actions.length === 0 ? (
              <div className="mt-3 rounded-xl bg-[rgba(30,122,90,.08)] px-4 py-3 text-[13px] font-medium text-green">
                처리 대기 없음 — 정상 운영 중입니다.
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {actions.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5"
                  >
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${a.level === "critical" ? "animate-livePing" : ""}`}
                      style={{
                        background: a.level === "critical" ? "#C0392B" : a.level === "high" ? "#8A5D12" : "#5C5A54",
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-bold text-navy">{a.title}</div>
                      <div className="truncate text-[12px] text-muted">{a.meta}</div>
                    </div>
                    {a.act ? (
                      <button
                        onClick={() => {
                          setHandled((h) => ({ ...h, [a.id]: true }));
                          if (a.clear) dispatch({ type: "opsPatch", patch: a.clear });
                          if (a.onAct) a.onAct();
                          push(...a.ticker);
                        }}
                        className="btn-press shrink-0 rounded-[10px] border border-green/40 px-3.5 py-2 text-[13px] font-bold text-green"
                      >
                        {a.act}
                      </button>
                    ) : (
                      <button
                        onClick={() => jumpTo(a)}
                        className="btn-press shrink-0 rounded-[10px] border border-navy/20 px-3.5 py-2 text-[13px] font-bold text-navy"
                      >
                        보기 →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── 역할 간 핸드오프 정체 — 사고는 사람과 사람 사이에서 난다 (단계 클릭 → 멈춘 건) ── */}
          <section className="card-glass mt-[18px] rounded-[14px] px-5 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[15px] font-bold tracking-[.02em] text-navy">역할 간 핸드오프 정체</h2>
              <span className="text-[12px] text-muted">보호자 → 관제 → 컨시어지 → 관제 → 보호자 · 단계를 클릭하면 멈춘 건이 열립니다</span>
            </div>
            <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(180px, 100%), 1fr))" }}>
              {HANDOFF_CHAIN.map((h, i) => {
                const on = hoStage === h.id;
                const tone = h.stuckN >= 3 ? "#C0392B" : h.stuckN >= 2 ? "#8A5D12" : "#1E7A5A";
                return (
                  <button
                    key={h.id}
                    onClick={() => setHoStage(h.id)}
                    className="btn-press rounded-xl border px-3 py-2.5 text-left"
                    style={
                      on
                        ? { borderColor: NAVY, background: "rgba(10,31,60,.05)", boxShadow: "inset 0 0 0 1px rgba(10,31,60,.35)" }
                        : { borderColor: "rgba(10,31,60,.08)", background: "rgba(255,255,255,.6)" }
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-num text-[10px] font-bold text-muted">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-[12px] font-bold text-navy">{h.stage}</span>
                      {h.worst && <span className="ml-auto rounded-full bg-danger/10 px-1.5 py-0.5 text-[9px] font-bold text-danger">최대 정체</span>}
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted">{h.from} → {h.to}</div>
                    <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-navy/[.08]">
                      <div className="h-full rounded-full" style={{ width: `${Math.round((h.stuckN / h.n) * 100)}%`, background: tone }} />
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="font-num text-[11px] font-bold" style={{ color: tone }}>정체 {h.stuckN}</span>
                      <span className="font-num text-[10px] text-muted">/ 진행 {h.n}</span>
                      <span className="ml-auto text-[10px] text-muted">{h.sla}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {(() => {
              const cur = HANDOFF_CHAIN.find((h) => h.id === hoStage);
              const rows = HANDOFF_STUCK[hoStage] || [];
              return (
                <div className="mt-3 border-t border-navy/[.08] pt-3">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-[14px] font-bold text-navy">{cur.stage}</span>
                    <span className="font-num text-[12px] font-bold text-danger">정체 {cur.stuckN}건</span>
                    <span className="text-[12px] text-muted">— {cur.note}</span>
                  </div>
                  <div className="mt-2.5 space-y-2">
                    {rows.map((r) => (
                      <div key={r.code} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-navy/[.06] px-2 py-0.5 font-num text-[10px] font-bold text-navy">{r.code}</span>
                          <span className="text-[13px] font-bold text-navy">{r.who}</span>
                          <span className="font-num text-[11px] font-bold text-danger">{r.wait}</span>
                        </div>
                        <div className="mt-1 text-[12px] leading-[1.55] text-muted">{r.signal}</div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className="min-w-0 flex-1 text-[12px] font-bold leading-[1.55] text-ink">조치 — {r.act}</span>
                          <button
                            onClick={() => {
                              if (hoDone[r.code]) return;
                              setHoDone((v) => ({ ...v, [r.code]: true }));
                              push("대응", `핸드오프 정체 처리 — ${r.code} · ${r.act}`, "#8FA9CC");
                            }}
                            disabled={!!hoDone[r.code]}
                            className="btn-press shrink-0 rounded-[10px] border border-navy/20 px-3 py-1.5 text-[12px] font-bold text-navy disabled:opacity-50"
                          >
                            {hoDone[r.code] ? `${r.owner} 처리됨 ✓` : `${r.owner} 처리`}
                          </button>
                        </div>
                      </div>
                    ))}
                    {rows.length === 0 && <p className="py-3 text-center text-[12px] text-muted">이 단계에 멈춘 건이 없습니다.</p>}
                  </div>
                </div>
              );
            })()}
            <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
              사고는 사람과 사람 사이에서 납니다 — 각 단계의 SLA를 넘긴 건만 여기 모입니다. 처리는 감사 로그에 기록됩니다.
            </p>
          </section>


          {/* ── AI 아침 브리핑 — 능동형: 묻기 전에 먼저 요약한다 (읽음도 감사 로그) ── */}
          <section className="card-glass mt-[18px] rounded-[14px] px-5 py-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-md bg-gold px-1.5 py-0.5 text-[11px] font-bold tracking-[.1em] text-navy">AI</span>
              <h2 className="text-[15px] font-bold text-navy">아침 브리핑</h2>
              <span className="font-num text-[12px] text-muted">{MORNING_BRIEF.date}</span>
              <button
                onClick={() => {
                  if (briefRead) return;
                  setBriefRead(true);
                  push("브리핑", "관제 아침 브리핑 읽음 확인", "#F0D9A8");
                }}
                disabled={briefRead}
                className="btn-press ml-auto rounded-[10px] border border-navy/20 px-3.5 py-1.5 text-[12px] font-bold text-navy disabled:opacity-50"
              >
                {briefRead ? "읽음 확인됨 ✓" : "읽음 확인"}
              </button>
            </div>
            <p className="mt-2 text-[14px] font-bold leading-[1.6] text-ink">{MORNING_BRIEF.summary}</p>
            <div className="mt-2.5 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(250px, 100%), 1fr))" }}>
              {MORNING_BRIEF.items.map((b) => (
                <div key={b.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                  <div className="text-[11px] font-bold text-gold">{b.k}</div>
                  <div className="mt-0.5 text-[12px] leading-[1.6] text-ink">{b.text}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── AI 자율 배차 (09 §3) — L4: 승인 없이는 실행되지 않는다 ── */}
          {assign === "pending" ? (
            <section
              id="ai-assign"
              className="card-navy mt-[18px] rounded-[14px] px-5 py-[18px] text-white"
              style={{
                background: NAVY,
                backgroundImage: "linear-gradient(180deg, rgba(255,255,255,.1), rgba(255,255,255,0))",
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-md bg-gold px-2 py-1 text-[11px] font-bold tracking-[.14em] text-navy">
                    AI 자율 배차 · L4
                  </span>
                  <HelpTip term="L4" light />
                  <span className="text-[16px] font-bold">신규 요청 3건의 배정안이 준비되었습니다</span>
                </div>
                <span className="text-[12px] text-white/60">승인 없이는 실행되지 않습니다 · 8.5 자율성 등급</span>
              </div>
              <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))" }}>
                {/* why(근거) 없는 배정안은 렌더 금지 — 블랙박스 금지 (규제 요건) */}
                {AI_ASSIGN.filter((a) => a.why).map((a) => (
                  <div
                    key={a.client}
                    className="rounded-xl bg-white/[.05] p-3.5"
                    style={{
                      boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,.14), inset 0 0 0 1px rgba(255,255,255,.06), 0 10px 22px -18px rgba(0,0,0,.6)",
                    }}
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="text-[13px] font-bold">{a.client}</span>
                      <span className="font-num text-[11px] text-white/60">{a.time}</span>
                    </div>
                    <div className="mt-0.5 text-[12px] text-white/70">{a.job}</div>
                    <div className="mt-1.5 text-[13px] font-bold text-gold-soft">→ {a.staff}</div>
                    <div className="mt-0.5 font-num text-[12px] font-bold text-[#8FE3C0]">적합 {a.score}%</div>
                    <div className="mt-2 border-t border-white/10 pt-1.5 text-[11px] leading-[1.55] text-white/55">
                      {a.why}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    dispatch({ type: "opsPatch", patch: { assign: "done" } });
                    push("배차", "AI 배정안 3건 일괄 승인 · 평균 적합도 94%", "#B08D57");
                  }}
                  className="btn-press btn-dark rounded-xl bg-gold px-4 py-2.5 text-[15px] font-bold text-navy"
                >
                  3건 일괄 승인
                </button>
                {/* 개별 검토는 일괄 승인과 대등한 선택지 — 없으면 실질 L5 */}
                <button
                  onClick={() => push("배차", "AI 배정안 개별 검토 모드 진입", "#8FA9CC")}
                  className="btn-press rounded-xl border border-white/25 bg-white/[.06] px-4 py-2.5 text-[15px] font-medium text-white/85"
                >
                  개별 검토
                </button>
              </div>
            </section>
          ) : (
            <section
              className="mt-[18px] flex flex-wrap items-center justify-between gap-2 rounded-[14px] border px-5 py-3.5"
              style={{ borderColor: "rgba(30,122,90,.28)", background: "linear-gradient(180deg, #F1FAF6, #E6F4EE)" }}
            >
              <div>
                <span className="text-[12px] font-bold text-green">배정 승인 완료</span>
                <div className="mt-0.5 text-[15px] text-[#2B4A3E]">
                  3건이 각 컨시어지 앱으로 전송되었습니다 · 평균 적합도 94% · 수동 개입 0건
                </div>
              </div>
              <span className="text-[12px] text-[#4A6B5E]">승인 이력은 감사 로그에 기록됩니다</span>
            </section>
          )}

          {/* ── 탭 3개 — 아웃라인 버튼형, 언마운트 전환 (09 §5) ── */}
          <div id="disp-tabs" className="mt-[18px] flex flex-wrap gap-2">
            {[
              ["live", "실시간 운영"],
              ["pair", "페어 편성 · 예외"],
              ["plan", "계획 · 인력"],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className="btn-press rounded-[10px] border px-[18px] py-2.5 text-[13px] font-bold"
                style={
                  tab === k
                    ? { background: NAVY, color: "#FFFFFF", borderColor: NAVY }
                    : { background: "rgba(255,255,255,.6)", color: "#5C5A54", borderColor: "rgba(10,31,60,.14)" }
                }
              >
                {label}
              </button>
            ))}
          </div>

          {/* ════ live 탭 — 배차 그리드 + 실시간 접수 티커 ════ */}
          {tab === "live" && (
            <div className="mt-4 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))" }}>
              <Panel className="min-w-0">
                <PanelHead title="배차 그리드" right={<span className="font-num text-[12px]">08:00 — 20:00 KST</span>} />
                {/* 시간축 — 모바일에선 그리드 전체 가로 스크롤 */}
                <div className="mt-3 overflow-x-auto">
                  <div className="min-w-[600px]">
                <div className="flex pl-[108px]">
                  {["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"].map((h) => (
                    <span key={h} className="flex-1 font-num text-[11px] font-semibold text-muted">
                      {h}
                    </span>
                  ))}
                </div>
                <div className="mt-1 space-y-1">
                  {rows.map((r) => (
                    <div key={r.name} className="flex border-t border-navy/[.06] py-1 first:border-t-0">
                      <button
                        onClick={() => openProfile(r.name)}
                        className="w-[108px] shrink-0 pr-2 pt-2 text-left hover:opacity-70"
                        title="프로필 보기"
                      >
                        <div className="text-[13px] font-bold text-navy underline decoration-navy/20 underline-offset-2">
                          {r.name}
                        </div>
                        <div className="text-[11px] text-muted">{r.meta}</div>
                      </button>
                      <div className="relative min-h-[56px] flex-1">
                        {nowPct > 0 && nowPct < 100 && (
                          <span
                            className="absolute inset-y-0 z-[1] w-[2px]"
                            style={{
                              left: `${nowPct}%`,
                              background: "rgba(192,57,43,.55)",
                              boxShadow: "0 0 0 1px rgba(255,255,255,.5)",
                            }}
                          />
                        )}
                        {r.bars.map((b) => (
                          <button
                            key={b.id}
                            onClick={() => openProfile(b.label.split(" (")[0])}
                            className="absolute bottom-[9px] top-[9px] overflow-hidden rounded-lg px-2 py-1 text-left hover:opacity-85"
                            style={{ left: `${b.left}%`, width: `${b.width}%`, background: b.bg, color: b.fg }}
                            title="어르신 상태 보기"
                          >
                            <div className="truncate whitespace-nowrap text-[12px] font-bold">{b.label}</div>
                            <div className="truncate whitespace-nowrap text-[11px] opacity-85">{b.sub}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                  </div>
                </div>
                {/* 범례 + 현재 시각 */}
                <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-navy/[.08] pt-2.5 text-[11px] font-bold text-muted">
                  {[
                    ["수행중", KIND_STYLE.active.bg],
                    ["예정", KIND_STYLE.planned.bg],
                    ["완료", KIND_STYLE.done.bg],
                    ["SOS 급파", KIND_STYLE.sos.bg],
                  ].map(([l, c]) => (
                    <span key={l} className="flex items-center gap-1.5">
                      <span className="h-[8px] w-[14px] rounded-[3px] border border-navy/10" style={{ background: c }} />
                      {l}
                    </span>
                  ))}
                  <span className="flex items-center gap-1.5">
                    <span className="h-[10px] w-[2px]" style={{ background: "rgba(192,57,43,.55)" }} />
                    현재 시각 {hhmm}
                  </span>
                </div>
              </Panel>

              <Panel className="min-w-0">
                <PanelHead title="실시간 접수 티커" right="전 화면 액션 → 감사 로그 실시간 뷰" />
                {renderTicker(230)}
              </Panel>
            </div>
          )}

          {/* ════ pair 탭 — 페어 편성 · 예외 ════ */}
          {tab === "pair" && (
            <div className="mt-4 space-y-4">
              {/* 페어 KPI (09 §8.1) */}
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(196px, 100%), 1fr))" }}>
                {pairKpis.map((k) => (
                  <Panel key={k.k} className="!p-4">
                    <div className="text-[12px] font-bold text-muted">{k.k}</div>
                    <div className="mt-1 font-num text-[27px] font-bold" style={{ color: k.color }}>
                      {k.v}
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted">{k.note}</div>
                  </Panel>
                ))}
              </div>

              {/* 배차 규칙 — 2026-08-13 개편안. 관제가 판단의 근거를 화면에서 바로 봐야
                  한다. 규칙이 코드(lib/dispatch-policy.js)에만 있고 화면에 없으면
                  "왜 이건 1인인가"를 매번 물어보게 된다. 사유를 함께 적는 이유다. */}
              <Panel>
                <PanelHead title="배차 규칙" right="위험도 기준 · 2026-08-13 개편" />
                <div className="mt-3 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))" }}>
                  <div className="rounded-xl border border-navy/10 bg-white/60 p-3.5">
                    <div className="text-[13px] font-bold text-navy">
                      2인 1조 <span className="font-num text-[12px] text-muted">{CREW_RULES.two.length}가지</span>
                    </div>
                    <ul className="mt-2 space-y-1.5">
                      {CREW_RULES.two.map((r) => (
                        <li key={r.key} className="text-[12px] leading-[1.6]">
                          <b className="text-ink">{r.label}</b>
                          <span className="text-muted"> — {r.why}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-navy/10 bg-white/60 p-3.5">
                    <div className="text-[13px] font-bold text-navy">
                      1인 방문 <span className="font-num text-[12px] text-muted">{CREW_RULES.one.length}가지</span>
                    </div>
                    <ul className="mt-2 space-y-1.5">
                      {CREW_RULES.one.map((r) => (
                        <li key={r.key} className="text-[12px] leading-[1.6]">
                          <b className="text-ink">{r.label}</b>
                          <span className="text-muted"> — {r.why}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="mt-3 text-[11px] leading-[1.7] text-muted">
                  모든 방문을 2인으로 묶으면 원가가 두 배가 되어 지역을 넓힐 수 없습니다.
                  원칙을 버린 것이 아니라 두 사람이 꼭 필요한 자리를 규칙으로 못 박은 것입니다.
                </p>
              </Panel>

              {/* 페어 편성 보드 (09 §8.2) */}
              <Panel>
                <PanelHead title="오늘 페어 편성 보드" right="2인 지정 건은 짝이 비면 확정 불가 · 1인 건은 단독 확정" />
                <div className="mt-3 overflow-x-auto">
                  <div className="min-w-[700px]">
                    <div className="flex gap-2 border-b border-navy/10 pb-2 text-[11px] font-bold tracking-[.06em] text-muted">
                      <span style={{ flex: ".5" }}>시각</span>
                      <span style={{ flex: "1.5" }}>고객 · 업무</span>
                      <span style={{ flex: ".8" }}>주 동행</span>
                      <span style={{ flex: ".8" }}>부 동행</span>
                      <span style={{ flex: "1.6" }}>편성 근거 · 규칙 체크</span>
                      <span style={{ flex: ".7" }}>상태</span>
                    </div>
                    {jobs.map((j) => (
                      <div key={j.id} className="flex items-center gap-2 border-b border-navy/[.06] py-2.5 text-[12px]">
                        <span className="font-num font-bold text-navy" style={{ flex: ".5" }}>
                          {j.t}
                        </span>
                        <span style={{ flex: "1.5" }}>
                          <span className="font-bold text-navy">{j.client}</span>
                          <span className="block text-[11px] text-muted">{j.job}</span>
                        </span>
                        <span className="font-bold text-ink" style={{ flex: ".8" }}>
                          {j.lead}
                        </span>
                        <span className="font-bold" style={{ flex: ".8", color: j.sup ? "#40413F" : "#C0392B" }}>
                          {j.sup || "—"}
                        </span>
                        <span className="text-[11px] leading-[1.5] text-muted" style={{ flex: "1.6" }}>
                          {j.note}
                        </span>
                        <span style={{ flex: ".7" }}>
                          <span
                            className="inline-block rounded-full px-2 py-1 text-[11px] font-bold"
                            style={{ color: STATE_PILL[j.state].fg, background: STATE_PILL[j.state].bg }}
                          >
                            {j.state}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>

              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(330px, 100%), 1fr))" }}>
                {/* 짝 미매칭 (09 §8.3) — 2인 지정 건에서만 뜬다 (lib/dispatch-policy.js CREW_RULES.two) */}
                <section
                  className="rounded-[14px] border p-[18px]"
                  style={{
                    background: "linear-gradient(180deg, #FDF2F0, #F9E8E5)",
                    borderColor: "rgba(192,57,43,.24)",
                  }}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] font-bold tracking-[.14em] text-[#8A1C1C]">
                      짝 미매칭 · 예약 확정 보류
                    </span>
                    <span className="font-num text-[12px] font-bold text-[#8A1C1C]">{UNMATCHED.time}</span>
                  </div>
                  <div className="mt-2 text-[17px] font-bold text-[#7A241C]">{UNMATCHED.client}</div>
                  <div className="mt-1 text-[12px] leading-[1.6] text-[#7A241C]">{UNMATCHED.reason}</div>
                  <div className="mt-3 space-y-2">
                    {/* feasible:false(3안)도 숨기지 않고 불가 이유와 함께 표시 */}
                    {UNMATCHED.options.map((o) => (
                      <div key={o.label} className="rounded-xl border border-navy/10 bg-white/70 px-3 py-2.5">
                        <div className="text-[13px] font-bold text-navy">{o.label}</div>
                        <div className="mt-0.5 text-[12px] font-bold opacity-85" style={{ color: o.fg }}>
                          {o.cost}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      if (unmatchFixed) return; // 1회성
                      dispatch({ type: "opsPatch", patch: { unmatchFixed: true } });
                      push("배차", "한복자 님 투석 동행 페어 편성 완료 · 서다인 재배치", "#8FA9CC");
                    }}
                    className="btn-press btn-dark mt-3 w-full rounded-xl px-4 py-3 text-[13px] font-bold text-white"
                    style={{ background: unmatchFixed ? "#5C5A54" : NAVY }}
                  >
                    {unmatchFixed ? "서다인 재배치 승인 · 18:10 건 재편성 완료" : "송파 권역 서다인 재배치 승인"}
                  </button>
                  <p className="mt-2.5 text-[11px] leading-[1.6] text-[#7A241C]">
                    이 건은 2인 지정(투석 동행)이라 짝을 못 찾았다고 1인으로 내리지 않습니다 —
                    재배치 · 시니어 투입 · 일정 조정 중에서만 고릅니다. 1인이 원칙인 방문
                    (정기 재방문 · 요양병원 · 부부 가구 · 동행 베이직 · 물품 전달)은 여기 오지
                    않습니다.
                  </p>
                </section>

                {/* SLA 관제 (09 §8.4) — 네이비 · 글래스 바 */}
                <section className="card-navy rounded-[14px] p-[18px]" style={{ background: NAVY }}>
                  <div className="flex items-baseline justify-between">
                    <h2 className="text-[15px] font-bold text-white">
                      SLA 관제
                      <HelpTip term="SLA" light />
                    </h2>
                    <span className="text-[12px] text-white/50">목표 대비 오늘</span>
                  </div>
                  <div className="mt-3 space-y-3">
                    {SLA_ROWS.map((s) => (
                      <div key={s.k}>
                        <div className="flex items-baseline justify-between gap-2 text-[13px]">
                          <span className="font-medium text-white">{s.k}</span>
                          <span className="shrink-0">
                            <span className="text-[11px] text-white/45">목표 {s.target} · </span>
                            <span className="font-num font-bold" style={{ color: s.color === "#C0392B" ? "#FF8A80" : s.color === "#8A5D12" ? "#F0D9A8" : "#8FE3C0" }}>
                              {s.now}
                            </span>
                          </span>
                        </div>
                        <div
                          className="mt-1.5 h-[6px] overflow-hidden rounded-full"
                          style={{
                            background: "rgba(255,255,255,.07)",
                            backdropFilter: "blur(6px)",
                            boxShadow: "inset 0 1px 2px rgba(0,0,0,.28), inset 0 0 0 1px rgba(255,255,255,.14)",
                          }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${s.w}%`,
                              background: s.color,
                              boxShadow:
                                "inset 0 1px 0 rgba(255,255,255,.6), inset 0 -1px 0 rgba(0,0,0,.16), inset 0 0 0 .5px rgba(255,255,255,.2)",
                              maskImage: "linear-gradient(to right, rgba(0,0,0,.7), rgba(0,0,0,1))",
                            }}
                          />
                        </div>
                        <div className="mt-1 text-[11px] text-white/45">{s.note}</div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 동선 체인 (09 §8.5) */}
                <Panel>
                  <PanelHead title="동선 체인 · 이동 여유" right="연속 배차 사이 실제 이동 시간" />
                  <div className="mt-3 space-y-4">
                    {ROUTE_CHAIN.map((r) => (
                      <div key={r.staff}>
                        <div className="text-[13px] font-bold text-navy">{r.staff}</div>
                        <div className="mt-2 flex flex-wrap items-start">
                          {r.legs.map((leg, i) => (
                            <span key={leg} className="flex items-start">
                              {i > 0 && <span className="mx-1 mt-[4px] h-[2px] w-[18px] bg-navy/[.16]" />}
                              <span className="flex flex-col items-start">
                                <span className="h-[9px] w-[9px] rounded-full bg-[#3B5C8A]" />
                                <span className="mt-1 whitespace-nowrap text-[11px] text-ink">{leg}</span>
                              </span>
                            </span>
                          ))}
                        </div>
                        <div className="mt-1.5 text-[12px] font-bold" style={{ color: r.color }}>
                          {r.gap}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2 text-[11px] leading-[1.6] text-muted">
                    이동 여유가 실제 소요보다 짧으면 다음 건이 자동으로 지연 위험으로 표시되고, 픽업
                    정시율 SLA에 선반영됩니다.
                  </p>
                </Panel>

                {/* 피로도 (09 §8.6) — 표시가 아니라 게이트 */}
                <Panel>
                  <PanelHead title="근무 시간 · 피로도 상한" right="일 10시간 · 주 52시간 상한" />
                  <div className="mt-3 space-y-3">
                    {FATIGUE.map((f) => (
                      <div key={f.name} className="flex items-center gap-3">
                        <div className="w-[104px] shrink-0">
                          <div className="text-[13px] font-bold text-navy">{f.name}</div>
                          <div className="text-[11px] text-muted">{f.jobs}</div>
                        </div>
                        <div className="flex-1">
                          <div className="h-[6px] overflow-hidden rounded-full bg-navy/[.08]">
                            <div className="h-full rounded-full" style={{ width: `${f.w}%`, background: f.color }} />
                          </div>
                        </div>
                        <span className="w-[40px] shrink-0 font-num text-[13px] font-bold text-navy">{f.hours}</span>
                        <span className="w-[54px] shrink-0 text-right text-[11px] font-bold" style={{ color: f.color }}>
                          {f.state}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2 text-[11px] leading-[1.7] text-muted">
                    이수민은 상한 임박으로 오늘 배차 후보에서 자동 제외됐고 7/29 투석 건 AI 제안에서도
                    빠졌습니다 — 피곤한 동행자가 어르신을 부축하는 것이 가장 흔한 사고 원인입니다.
                  </p>
                </Panel>

                {/* 리스크 워치 (09 §8.7) — 환경 × 이력 교차 */}
                <Panel>
                  <PanelHead title="오늘 리스크 워치" right="환경 × 건강 이력 교차" />
                  <div className="mt-3 space-y-3">
                    {RISK_WATCH.map((w) => (
                      <div key={w.name} className="flex items-start gap-2.5 border-t border-navy/[.06] pt-2.5 first:border-t-0 first:pt-0">
                        <span
                          className="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold"
                          style={{ color: RISK_LEVEL[w.level].fg, background: RISK_LEVEL[w.level].bg }}
                        >
                          {w.level}
                        </span>
                        <div>
                          <div className="text-[13px] font-bold text-navy">{w.name}</div>
                          <div className="text-[11px] text-muted">{w.why}</div>
                          <div className="mt-0.5 text-[12px] font-semibold text-navy">→ {w.action}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            </div>
          )}

          {/* ════ plan 탭 — 계획 · 인력 ════ */}
          {tab === "plan" && (
            <div className="mt-4 space-y-4">
              {/* 컨디션 예보 캘린더 (09 §9.1) */}
              <Panel>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[15px] font-bold text-navy">
                      {range === "3" ? "3일 컨디션 예보 캘린더" : "주간 컨디션 예보 캘린더"}
                    </h2>
                    <div className="flex gap-1">
                      {["3", "7"].map((r) => (
                        <button
                          key={r}
                          onClick={() => setRange(r)}
                          className="rounded-lg px-[11px] py-[5px] text-[11px] font-bold"
                          style={
                            range === r
                              ? { background: NAVY, color: "#fff" }
                              : { background: "rgba(10,31,60,.06)", color: "#5C5A54" }
                          }
                        >
                          {r}일
                        </button>
                      ))}
                    </div>
                  </div>
                  <span className="text-[12px] text-muted">F5-6 · 주간 전망</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {forecast.map((d) => (
                    <div
                      key={d.day}
                      className="min-w-[96px] flex-1 rounded-xl border px-3 py-2.5"
                      style={{ background: FORECAST_TONE[d.tone].bg, borderColor: FORECAST_TONE[d.tone].border }}
                    >
                      <div className="text-[11px] font-bold text-muted">{d.day}</div>
                      <div className="mt-0.5 flex items-baseline gap-1.5">
                        <span className="font-num text-[20px] font-bold text-navy">{d.score}</span>
                        <span className="text-[11px] font-bold" style={{ color: FORECAST_TONE[d.tone].fg }}>
                          {d.grade}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted">{d.note}</div>
                      <div className="font-num text-[11px] text-muted">{d.jobs}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-2.5 text-[11px] leading-[1.6] text-muted">
                  31일(금) 폭염 특보 예보 — 배차 6건 중 3건에 일정 조정 권고를 선제 발송할 수 있습니다
                  (F8-4)
                </p>
              </Panel>

              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))" }}>
                {/* 감점 내역 (09 §9.2) — 룰 엔진 L0 */}
                <Panel>
                  <PanelHead title="감점 내역 · 김순자 (78) 도착 구간" right="100점 감점식 · 룰 엔진(L0) · 커버리지 100%" />
                  <div className="mt-3 space-y-2">
                    {SCORE_FACTORS.map((f) => (
                      <div key={f.name} className="flex items-center gap-2 text-[12px]">
                        <span className="w-[72px] shrink-0 font-bold text-navy">{f.name}</span>
                        <span className="w-[48px] shrink-0 font-num text-[11px] text-muted">가중 {f.weight}</span>
                        <span className="flex-1 text-muted">{f.basis}</span>
                        <span className="w-[42px] shrink-0 text-right font-num text-[13px] font-bold" style={{ color: f.color }}>
                          {f.delta}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-baseline justify-between border-t border-navy/[.18] pt-2">
                      <span className="text-[12px] font-bold text-navy">최종 점수</span>
                      <span className="font-num text-[16px] font-bold text-danger">52 · 주의</span>
                    </div>
                  </div>
                  <p className="mt-2.5 text-[11px] leading-[1.7] text-muted">
                    측정값이 없는 지표는 0점으로 세지 않고 계산에서 제외한 뒤 커버리지로 표기합니다 —
                    결측을 감점으로 위장하지 않습니다
                  </p>
                </Panel>

                {/* 오늘 배차 브리핑 (09 §9.3) */}
                <Panel>
                  <PanelHead title="오늘 배차 브리핑 · 외출 컨디션" right="출발지·도착지 2구간" />
                  <div className="mt-3 space-y-3">
                    {BRIEFINGS.map((b) => (
                      <div key={b.name} className="flex gap-3 border-t border-navy/[.06] pt-2.5 first:border-t-0 first:pt-0">
                        <span className="w-[40px] shrink-0 font-num text-[20px] font-bold" style={{ color: b.color }}>
                          {b.score}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium text-navy">
                            {b.name}{" "}
                            <span className="text-[11px] font-bold" style={{ color: b.color }}>
                              {b.grade}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted">{b.detail}</div>
                          <div className="text-[11px] text-muted">{b.legs}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* 일정 조정 권고는 자동 실행되지 않는다 — 관제사 판단 (자동 취소 금지) */}
                  <button
                    onClick={() => {
                      if (briefed) return;
                      setBriefed(true);
                      push("브리핑", "외출 컨디션 브리핑 3건 발송 · 가족·컨시어지 앱", "#8FA9CC");
                    }}
                    className="btn-press mt-3 w-full rounded-xl border px-4 py-2.5 text-[13px] font-bold"
                    style={
                      briefed
                        ? { borderColor: "rgba(10,31,60,.14)", color: "#5C5A54" }
                        : { borderColor: NAVY, color: NAVY }
                    }
                  >
                    {briefed ? "브리핑 3건 발송 완료" : "브리핑 일괄 발송 (3건)"}
                  </button>
                </Panel>

                {/* 컨시어지 현황 (09 §9.4) — 평점만. 매출 컬럼 금지 */}
                <Panel>
                  <PanelHead title="컨시어지 현황" right="평점 출처: 가족 만족도" />
                  <div className="mt-3 space-y-2.5">
                    {STAFF_STATUS.map((s) => (
                      <div key={s.name} className="flex items-center gap-2.5 text-[12px]">
                        <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: s.color }} />
                        <span className="flex-1 text-[13px] font-medium text-navy">{s.name}</span>
                        <span className="w-[84px] shrink-0 text-muted">{s.area}</span>
                        <span className="w-[32px] shrink-0 font-num text-[13px] font-bold text-navy">{s.jobs}</span>
                        <span className="w-[34px] shrink-0 text-right font-num text-[12px] text-[#7A5C28]">
                          {s.rating}
                        </span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            </div>
          )}
            </>}
            />
          )}

          {/* ════ 어르신 관리 — 요청서 7절 (components/ops/ElderMgmt) ════ */}
          {menu === "elder" && <ElderMgmt openProfile={openProfile} />}


          {/* ════ 보호자 관리 — 요청서 8절 · 시안 (components/ops/GuardianMgmt) ════ */}
          {menu === "guardian" && <GuardianMgmt />}


          {/* ════ 컨시어지 관리 — 요청서 9절 · 시안 (components/ops/ConciergeMgmt) ════ */}
          {menu === "concierge" && <ConciergeMgmt />}


          {/* ════ 병원 관리 — 요청서 15절 · 입력/수정 가능 (components/ops/HospitalsMgmt) ════ */}
          {menu === "hospital" && <HospitalsMgmt />}


          {/* ════ SOS 대응 — 요청서 6절 실행형 콘솔 · 시안 (components/ops/SosCenter) ════ */}
          {menu === "sos" && <SosCenter focusId={sosFocus} />}


          {/* ════ 웨어러블·센서 관리 — 요청서 10절 · 시안 (components/ops/Devices) ════ */}
          {menu === "wearable" && <Devices />}


          {/* ════ 날씨 — 현재 기상 · 대기질 · 권역 지도 · 이슈 → 케어 연계 ════ */}
          {menu === "weather" && (
            <div className="mt-4 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))" }}>
              <Panel className="min-w-0">
                <PanelHead title="현재 기상 — 강남지점 권역" right={WEATHER_NOW.updated} />
                {/* 특보 배너 — 빨강은 위험 신호 전용 원칙과 일치 */}
                <div className="mt-3 rounded-xl border border-danger/25 bg-danger/[.07] px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-danger px-2.5 py-0.5 text-[11px] font-bold text-white">
                      {WEATHER_NOW.alert.name}
                    </span>
                    <span className="text-[12px] font-bold text-danger">{WEATHER_NOW.alert.since}</span>
                  </div>
                  <p className="mt-1.5 text-[12px] leading-[1.6] text-navy">{WEATHER_NOW.alert.guide}</p>
                </div>
                {/* 현재값 */}
                <div className="mt-3 flex items-end gap-4">
                  <div>
                    <div className="font-num text-[44px] font-bold leading-none text-navy">{WEATHER_NOW.temp}</div>
                    <div className="mt-1 text-[12px] font-bold text-danger">체감 {WEATHER_NOW.feels}</div>
                  </div>
                  <div className="grid flex-1 grid-cols-2 gap-1.5">
                    {[["하늘", WEATHER_NOW.sky], ["습도", WEATHER_NOW.humid], ["바람", WEATHER_NOW.wind], ["자외선", WEATHER_NOW.uv]].map(
                      ([k, v]) => (
                        <div key={k} className="rounded-lg bg-navy/[.04] px-2.5 py-1.5">
                          <span className="text-[11px] font-bold text-muted">{k}</span>{" "}
                          <span className="text-[12px] font-bold text-navy">{v}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
                {/* 대기질 */}
                <div className="mt-3 grid grid-cols-4 gap-1.5">
                  {WEATHER_AIR.map((a) => (
                    <div key={a.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-2 py-2 text-center">
                      <div className="text-[10px] font-bold leading-[1.4] text-muted">{a.k}</div>
                      <div className="font-num text-[16px] font-bold text-navy">{a.v}</div>
                      <div className="text-[11px] font-bold" style={{ color: WEATHER_TONE[a.tone] }}>
                        {a.grade}
                      </div>
                    </div>
                  ))}
                </div>
                {/* 시간별 */}
                <div className="mt-3 grid grid-cols-6 gap-1">
                  {WEATHER_HOURLY.map((h) => (
                    <div key={h.t} className="rounded-lg bg-navy/[.03] px-1 py-1.5 text-center" title={h.note || undefined}>
                      <div className="text-[10px] font-bold text-muted">{h.t}</div>
                      <div className="font-num text-[13px] font-bold text-navy">{h.temp}</div>
                      <div className="text-[10px] text-muted">체감 {h.feels}</div>
                      {h.note && <div className="mt-0.5 text-[9px] font-bold text-amber">{h.note}</div>}
                    </div>
                  ))}
                </div>
                {/* 주간 스트립 — 대시보드 컨디션 예보와 동일 데이터 */}
                <div className="mt-3 border-t border-navy/[.08] pt-2.5">
                  <div className="mb-1.5 text-[11px] font-bold text-muted">주간 외출지수 — 예보 기반 배차 조절 (대시보드와 동일)</div>
                  <div className="grid grid-cols-7 gap-1">
                    {WEEK_FORECAST.map((f) => (
                      <div key={f.day} className="rounded-lg bg-navy/[.03] px-1 py-1.5 text-center">
                        <div className="text-[10px] font-bold text-muted">{f.day}</div>
                        <div
                          className="font-num text-[14px] font-bold"
                          style={{ color: f.tone === "bad" ? "#C0392B" : f.tone === "warn" ? "#8A5D12" : "#1E7A5A" }}
                        >
                          {f.score}
                        </div>
                        <div className="text-[9px] text-muted">{f.note}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>

              <Panel className="min-w-0">
                <PanelHead title="날씨 지도" right="권역별 기온 · 미세먼지" />
                <div className="mt-3">
                  <WeatherMap />
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {WEATHER_DISTRICTS.map((w) => (
                    <span
                      key={w.name}
                      className="rounded-full btn-press px-3 py-2.5 text-[11px] font-bold"
                      style={{ color: WEATHER_TONE[w.tone], background: `${WEATHER_TONE[w.tone]}14` }}
                    >
                      {w.name} {w.temp} · {w.pm}
                    </span>
                  ))}
                </div>
                <p className="mt-2.5 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.6] text-muted">
                  나쁨 권역(강남 · 송파)의 오늘 동행은 병원 정문 하차 동선 · KF94 준비물이 자동 반영됩니다 —
                  외출지수 감점 내역은 대시보드 컨디션 예보에서 확인.
                </p>
              </Panel>

              <Panel className="min-w-0">
                <PanelHead title="날씨 이슈 → 케어 연계" right="자동 실행 없음 · 관제사 판단 (L4)" />
                <div className="mt-3 space-y-2">
                  {WEATHER_ISSUES.map((w) => (
                    <div key={w.title} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                          style={{ background: WEATHER_TONE[w.tone] }}
                        >
                          {w.level}
                        </span>
                        <span className="text-[13px] font-bold text-navy">{w.title}</span>
                        <span className="ml-auto text-[11px] text-muted">{w.time}</span>
                      </div>
                      <p className="mt-1.5 text-[12px] leading-[1.65] text-ink">{w.care}</p>
                      {w.cta && (
                        <button
                          onClick={() => setMenu("comms")}
                          className="btn-press mt-2 rounded-[10px] border border-navy/20 px-3 py-1.5 text-[12px] font-bold text-navy"
                        >
                          {w.cta} →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.6] text-muted">
                  기상 데이터는 단일 출처 · 이슈는 배차 · 발송 · 준비물 판단의 재료입니다 — 발송은
                  발송 센터에서, 일정 조정은 관제사 승인으로만 실행됩니다.
                </p>
              </Panel>
            </div>
          )}

          {/* ════ 커뮤니케이션 관리 — 요청서 14절 (고객별 통합 이력 · 후속조치). 아래 발송 센터는 유지 ════ */}
          {menu === "comms" && <CommsMgmt />}

          {/* ════ 커뮤니케이션 — 발송 센터 + 감사 로그 ════ */}
          {menu === "comms" && (
            <div className="mt-4 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))" }}>
              <Panel className="min-w-0">
                <PanelHead title="발송 센터" right="보호자 · 어르신 · 컨시어지 일괄 커뮤니케이션" />
                <div className="mt-3 space-y-2">
                  {COMMS_TEMPLATES.map((t) => {
                    const tr = COMMS_TRACKING[t.id];
                    return (
                      <div key={t.id} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-bold text-navy">{t.title}</div>
                            <div className="truncate text-[12px] text-muted">{t.desc}</div>
                          </div>
                          <button
                            onClick={() => {
                              if (sent[t.id]) return;
                              setSent((v) => ({ ...v, [t.id]: true }));
                              push(t.kind, t.log, t.color);
                            }}
                            disabled={!!sent[t.id]}
                            className="btn-press shrink-0 rounded-[10px] border border-navy/20 px-3.5 py-2 text-[13px] font-bold text-navy disabled:opacity-50"
                          >
                            {sent[t.id] ? "발송됨" : "발송"}
                          </button>
                        </div>
                        {/* 양방향 추적 — 보내고 끝이 아니라 열람·응답까지 */}
                        {sent[t.id] && tr && (
                          <div className="mt-2 border-t border-navy/[.06] pt-2">
                            <div className="flex flex-wrap gap-1.5">
                              {[["발송", tr.sent], ["수신", tr.sent], ["열람", tr.read], ["응답", tr.replied]].map(
                                ([k, n]) => (
                                  <span
                                    key={k}
                                    className="rounded-full bg-navy/[.05] px-2 py-0.5 text-[11px] font-bold text-navy"
                                  >
                                    {k} <span className="font-num">{n}</span>
                                  </span>
                                )
                              )}
                            </div>
                            <div className="mt-1.5 text-[11px] font-bold text-amber">{tr.next}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.6] text-muted">
                  모든 발송은 감사 로그(티커)에 기록 · 미열람은 앱 → 문자 → 음성 콜 순 자동 에스컬레이션 ·
                  어르신 안내는 음성 콜 우선 · 진단어 없이 생활어 사용
                </p>
              </Panel>
              <Panel className="min-w-0">
                <PanelHead title="실시간 접수 티커" right="전 화면 액션 → 감사 로그 실시간 뷰" />
                {renderTicker(430)}
              </Panel>
            </div>
          )}
          {menu === "thresholds" && <Thresholds />}
          {menu === "visits" && <Visits openProfile={openProfile} />}
          {menu === "requests" && <RequestsMgmt />}
          {menu === "together" && <TogetherMgmt />}
          {menu === "accounts" && <Accounts />}
          {menu === "audit" && <AuditLog />}
          {menu === "integrations" && <Integrations />}
          </StaggerIn>
        </div>

        {/* 플로팅 프로필 카드 — 그리드·검색에서 열림 */}
        {profile && (
          <FloatProfile
            item={profile}
            pos={profilePos}
            onClose={() => setProfile(null)}
            onAction={(text) => push("대응", text, "#8FA9CC")}
          />
        )}

        </div>

        {/* AI 관제 어시스턴트 — 우측 하단 플로팅 */}
        <AiChat
          role="dispatch"
          title="AI 관제 어시스턴트"
          subtitle="상황 요약 · 우선순위 제안"
          qa={DISPATCH_AI_QA}
          context={`SOS ${sos ? "진행 중" : "없음"} · 처리 대기 ${actions.length}건 · 미매칭 ${unmatchedCount}건 · 오늘 배차 ${jobs.length}건 · AI 배정안 ${assign === "pending" ? "3건 대기" : "확정"}`}
          intro="관제 상황을 요약해 드립니다. 지금 급한 일, 미매칭 해소 옵션, 리스크 워치를 물어보세요."
          note="AI 제안은 참고용입니다 — 배차 · 해제 등 실행은 관제 담당자 승인으로만 진행됩니다 (L4 · 8.4 Human-in-the-loop)."
          stage={AI_STAGE_NOW}
          evidence={AI_EVIDENCE.dispatch}
        />
      </div>
    </>
  );
}

// 보호자 일정등록 요청 승인 큐 — 2026-08-12 보호자화면 시트 예약 1번.
//
// 보호자가 K-CARE 일정을 등록하면 바로 캘린더에 뜨지 않는다. 관제가 팀 배정과
// 배차가 가능한지 보고 승인해야 어르신·컨시어지 화면에 올라간다. 승인 없이
// 캘린더에 뜨면 아무도 안 가는 일정이 확정된 것처럼 보인다 — 그게 이 큐의 이유다.
function EventApprovals() {
  const { state, dispatch } = useAppState();
  const pending = state.events
    .filter((e) => e.approval === "pending")
    .sort((a, b) => a.at - b.at);

  const decide = (e, approval) => {
    dispatch({ type: "decideEvent", id: e.id, approval });
    dispatch({
      type: "pushEvent",
      payload: {
        kind: "일정",
        text:
          approval === "approved"
            ? `일정등록 요청 승인 — ${e.title} · 어르신·보호자·컨시어지 캘린더 반영`
            : `일정등록 요청 반려 — ${e.title} · 사유는 해주세요로 전달`,
        color: approval === "approved" ? "#8FE3C0" : "#FF8A80",
      },
    });
  };

  if (pending.length === 0) return null;

  return (
    <section className="card-glass mt-[18px] rounded-[14px] px-5 py-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px] font-bold tracking-[.02em] text-navy">보호자 일정등록 요청</h2>
        <span className="font-num text-[12px] text-muted">{pending.length}건 · 승인 대기</span>
      </div>
      <p className="mt-1 text-[12px] leading-[1.7] text-muted">
        승인해야 어르신 · 보호자 · 컨시어지 캘린더에 올라갑니다. 동행이 필요한 건은 팀 배정과
        배차가 가능한지 먼저 확인하세요.
      </p>
      <div className="mt-3 space-y-2">
        {pending.map((e) => (
          <div
            key={e.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-3"
          >
            <span className="w-[92px] shrink-0 font-num text-[13px] font-bold text-navy">
              {new Date(e.at).toLocaleString("ko-KR", {
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </span>
            <div className="min-w-[160px] flex-1">
              <div className="text-[15px] font-bold text-navy">{e.title}</div>
              <div className="text-[12px] text-muted">
                {e.source} ·{" "}
                <span className={e.escort ? "font-bold text-amber" : ""}>
                  {e.escort ? "동행 필요 — 배차 검토" : "동행 불필요 — 일정 공유만"}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => decide(e, "rejected")}
                className="btn-press min-h-[40px] rounded-lg border border-navy/15 px-3.5 text-[13px] font-bold text-muted"
              >
                반려
              </button>
              <button
                onClick={() => decide(e, "approved")}
                className="btn-press btn-dark min-h-[40px] rounded-lg bg-navy px-4 text-[13px] font-bold text-white"
              >
                승인
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// 복지혜택 자동 매칭 — 가구별 한 줄 (2026-09-04 시트 앱 전체 3번).
// 판정은 lib/welfare.js (실무진 DB 3 · 06 시트 공식). 소득·수급·주거는 관제가 모르는 값이라
// 대부분 '추가확인'이다 — 보호자가 앱에서 답하면(state.welfare.answers) 그 자리에서 바뀐다.
// 데모 가구는 김순자 댁 하나라 답은 그 댁에만 얹는다.
function WelfareBoard({ onOpen, answers = {}, statuses = {} }) {
  const rows = Object.keys(WELFARE_PROFILES).map((name) => {
    const prof = profileFor(name, name === ELDER.name ? answers : {});
    const m = matchWelfare(prof);
    const c = welfareCounts(m);
    const active = m.filter((x) => statuses[x.policy.id] && statuses[x.policy.id].status !== "추천").length;
    const unknown =
      PROFILE_FIELDS.filter(([k]) => prof[k] === "미확인").length + (prof.housing === "미확인" ? 1 : 0) + (prof.incomePct == null ? 1 : 0);
    return { name, age: prof.age, where: prof.sigungu, c, active, unknown };
  });
  const totalHigh = rows.reduce((s, r) => s + r.c.high, 0);
  return (
    <section className="card-glass mt-[18px] rounded-[14px] px-5 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-bold tracking-[.02em] text-navy">복지혜택 자동 매칭</h2>
        <span className="font-num text-[12px] text-muted">
          정책 79건 · 검증 2026-09-04 · 이용 가능성 높음 {totalHigh}건 · 무료 회원 포함
        </span>
      </div>
      <p className="mt-1 text-[12px] leading-[1.7] text-muted">
        고객 정보로 자동 판정합니다. 보호자가 답하지 않은 항목(소득·수급·주거)은 &lsquo;추가확인&rsquo;으로
        남습니다 — 이름을 누르면 프로필에서 상세와 진행상태를 봅니다.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[520px] text-[12px]">
          <thead>
            <tr className="text-left text-[11px] text-muted">
              <th className="py-1.5 font-bold">가구</th>
              <th className="py-1.5 text-right font-bold">높음</th>
              <th className="py-1.5 text-right font-bold">추가확인</th>
              <th className="py-1.5 text-right font-bold">낮음</th>
              <th className="py-1.5 text-right font-bold">진행 중</th>
              <th className="py-1.5 text-right font-bold">미확인 항목</th>
              <th className="py-1.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-navy/[.06]">
                <td className="py-2 font-bold text-navy">
                  {r.name} <span className="font-num text-[11px] font-medium text-muted">{r.age} · {r.where}</span>
                </td>
                <td className="py-2 text-right font-num font-bold" style={{ color: "#1E7A5A" }}>{r.c.high}</td>
                <td className="py-2 text-right font-num font-bold" style={{ color: "#8A5D12" }}>{r.c.check}</td>
                <td className="py-2 text-right font-num text-muted">{r.c.low}</td>
                <td className="py-2 text-right font-num font-bold text-navy">{r.active}</td>
                <td className="py-2 text-right font-num text-muted">{r.unknown}</td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => onOpen(r.name)}
                    className="btn-press rounded-[8px] border border-navy/15 px-2.5 py-1.5 text-[11px] font-bold text-navy"
                  >
                    프로필
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// 가구 타임라인 칩 — 폭 고정(2~3자 혼재 시 원형처럼 보이지 않게) + 종류별 톤
const TL_TONE = {
  SOS: { fg: "#C0392B", bg: "rgba(192,57,43,.1)" },
  알림: { fg: "#C0392B", bg: "rgba(192,57,43,.1)" },
  워치: { fg: "#8A5D12", bg: "rgba(138,93,18,.12)" },
  심사: { fg: "#8A5D12", bg: "rgba(138,93,18,.12)" },
  동행: { fg: "#1E7A5A", bg: "rgba(30,122,90,.1)" },
  체크인: { fg: "#1E7A5A", bg: "rgba(30,122,90,.1)" },
  안부: { fg: "#1B7F79", bg: "rgba(27,127,121,.1)" },
  예약: { fg: "#1B7F79", bg: "rgba(27,127,121,.1)" },
  구매: { fg: "#7A5C28", bg: "rgba(176,141,87,.16)" },
  결제: { fg: "#7A5C28", bg: "rgba(176,141,87,.16)" },
};
const tlTone = (k) => TL_TONE[k] || { fg: "#0A1F3C", bg: "rgba(10,31,60,.06)" };

// 플로팅 프로필 — 담당·상태·챙길 것 한눈에. 상세 주소 등은 게이팅 원칙 유지 (더미)
function FloatProfile({ item, pos, onClose, onAction }) {
  // 클릭 지점 근처 배치 — 뷰포트 밖으로 나가지 않게 클램프 (카드 320 × 최대 560)
  const W = 320;
  const H = 560;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const left = Math.max(12, Math.min((pos?.x ?? vw - W) + 14, vw - W - 12));
  const top = Math.max(12, Math.min((pos?.y ?? 96) - 24, vh - Math.min(H, vh - 24) - 12));
  const t = DIRECTORY_TYPE[item.type];
  const crm = CRM_STAGE[item.name]; // 가구 360° — 어르신(가구) 레코드에만 존재
  const tl = CRM_TIMELINE[item.name];
  const tag = ELDER_TAGS[item.name]; // 성별 · 장애 정도 · 보훈 · 장기요양 (어르신만)
  const [acted, setActed] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const home = ELDER_HOMES[item.name]; // 어르신 레코드에만 있다
  // 복지혜택 — 어르신 레코드에만 (2026-09-04 시트 앱 전체 3번). 판정·상태는 lib/welfare.js
  // 와 state.welfare 에서 오고, 보호자 앱·컨시어지 앱이 같은 값을 본다.
  const { state, dispatch } = useAppState();
  const [welfareSent, setWelfareSent] = useState({});
  const wProfile = item.type === "elder" ? profileFor(item.name, item.name === ELDER.name ? state.welfare?.answers : {}) : null;
  const wMatches = wProfile ? matchWelfare(wProfile) : null;
  const wCounts = wMatches ? welfareCounts(wMatches) : null;
  const sendWelfare = (m) => {
    setWelfareSent((s) => ({ ...s, [m.policy.id]: true }));
    dispatch({
      type: "addRequest",
      payload: {
        id: `rq-${Date.now()}`,
        dir: "fromOps",
        type: `복지혜택 안내 · ${m.policy.name}`,
        detail: `${m.policy.summary} — ${m.policy.value}. ${m.verdict} (점수 ${m.score}) · 확인할 것: ${m.checks}. 신청: ${m.policy.apply}`,
        amount: 0,
        preferredDate: null,
        urgency: "normal",
        assignee: "박지현",
        photos: [],
        status: "requested",
        history: [{ at: Date.now(), status: "requested", note: "관제 자동 매칭 → 보호자 안내" }],
        proof: null,
      },
    });
    dispatch({ type: "welfareStatus", id: m.policy.id, status: "자격확인", by: "관제" });
    dispatch({ type: "pushEvent", payload: { kind: "복지", text: `${item.name} 복지혜택 안내 — ${m.policy.name} (${m.verdict})`, color: "#F0D9A8" } });
  };
  // 담당 주 동행이 이동 중이면 같이 찍는다 — rows 의 "담당" 행에서 이름을 뽑는다
  const leadName = (item.rows || []).find((r) => r[0] === "담당")?.[1]?.split(" (")[0];
  const lead = CONCIERGE_POS[leadName];
  const gap = home && lead ? distanceM(lead, home) : null;
  return (
    <div className="fixed inset-0 z-[1100]" onClick={onClose}>
      {/* 스크림 없음 — 카드 자체(card-frost)가 자기 영역 뒤만 블러 처리한다 */}
      <div
        className="card-frost absolute w-[320px] max-w-[calc(100vw-24px)] overflow-y-auto rounded-[14px] p-4"
        style={{ left, top, maxHeight: "min(560px, calc(100vh - 24px))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ color: "#0A1F3C", background: "rgba(10,31,60,.08)" }}
          >
            {t.label}
          </span>
          <span className="text-[17px] font-bold text-navy">
            {item.name} <span className="text-[12px] font-medium text-muted">{item.tag}</span>
          </span>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="btn-press ml-auto flex h-[26px] w-[26px] items-center justify-center rounded-lg border border-navy/15 text-[13px] font-bold text-muted"
          >
            ✕
          </button>
        </div>
        <p className="mt-1.5 text-[12px] leading-[1.6] text-muted">{item.summary}</p>
        {/* 기본 속성 칩 — 성별 · 장애 정도 · 보훈 · 장기요양 (케어 수행에 필요한 범위만) */}
        {tag && (
          <>
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="rounded-md px-2 py-0.5 text-[10px] font-bold" style={{ color: TAG_TONE.sex.fg, background: TAG_TONE.sex.bg }}>
                {tag.sex} · {tag.age}세
              </span>
              {tag.disability && (
                <span className="rounded-md px-2 py-0.5 text-[10px] font-bold" style={{ color: TAG_TONE.disability.fg, background: TAG_TONE.disability.bg }}>
                  {tag.disability}
                </span>
              )}
              {tag.veteran && (
                <span className="rounded-md px-2 py-0.5 text-[10px] font-bold" style={{ color: TAG_TONE.veteran.fg, background: TAG_TONE.veteran.bg }}>
                  {tag.veteran}
                </span>
              )}
              {tag.ltc && (
                <span className="rounded-md px-2 py-0.5 text-[10px] font-bold" style={{ color: TAG_TONE.ltc.fg, background: TAG_TONE.ltc.bg }}>
                  {tag.ltc}
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] leading-[1.5] text-muted">케어 반영 — {tag.care}</p>
          </>
        )}
        <div className="mt-2.5 space-y-1.5 border-t border-navy/[.08] pt-2.5">
          {item.rows.map(([k, v]) => (
            <div key={k} className="flex gap-2 text-[12px]">
              <span className="w-[44px] shrink-0 font-bold text-gold">{k}</span>
              <span className="flex-1 leading-[1.55] text-ink">{v}</span>
            </div>
          ))}
        </div>
        {item.alert && (
          <p className="mt-2.5 rounded-xl border border-amber/30 bg-[#FFF7E8] px-3 py-2 text-[12px] font-bold leading-[1.6] text-[#5A4A22]">
            챙길 것 — {item.alert}
          </p>
        )}
        {/* ── 가구 360° — 라이프사이클 · 이탈 신호 · 타임라인 · 추천 조치 (CRM) ── */}
        {crm && (
          <div className="mt-2.5 flex items-center gap-2 border-t border-navy/[.08] pt-2.5">
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
              style={{ background: crm.color }}
            >
              {crm.stage}
            </span>
            <span className="font-num text-[11px] text-muted">가입 {crm.months}개월</span>
            <span
              className="ml-auto font-num text-[11px] font-bold"
              style={{ color: crm.churn >= 70 ? "#C0392B" : crm.churn >= 40 ? "#8A5D12" : "#1E7A5A" }}
              title="구성: 리포트 미열람 35 · 요청 무응답 25 · 결제 신호 25 · 방문 감소 15"
            >
              이탈 신호 {crm.churn}
            </span>
          </div>
        )}
        {tl && (
          <div className="mt-2.5 border-t border-navy/[.08] pt-2.5">
            <div className="text-[11px] font-bold tracking-[.1em] text-muted">가구 타임라인</div>
            <div className="mt-1.5 max-h-[168px] space-y-2 overflow-y-auto pr-1">
              {tl.map((ev, i) => {
                const t = tlTone(ev.kind);
                return (
                  <div key={i} className="flex items-start gap-2 text-[12px]">
                    <span className="mt-[1px] w-[34px] shrink-0 font-num text-[11px] font-semibold text-muted">{ev.at}</span>
                    <span
                      className="mt-[1px] w-[42px] shrink-0 rounded-md text-center text-[10px] font-bold leading-[18px]"
                      style={{ color: t.fg, background: t.bg }}
                    >
                      {ev.kind}
                    </span>
                    <span className="min-w-0 flex-1 leading-[1.55] text-ink">{ev.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {crm && (
          <div className="mt-2.5 border-t border-navy/[.08] pt-2.5">
            <div className="text-[11px] font-bold text-gold">다음 추천 조치 (AI)</div>
            <p className="mt-1 text-[12px] leading-[1.6] text-ink">{crm.nba}</p>
            <button
              onClick={() => {
                if (acted) return;
                setActed(true);
                onAction?.(`${item.name} — ${crm.nba.split(" — ")[0]} 실행 기록`);
              }}
              disabled={acted}
              className="btn-press mt-2 rounded-[10px] border border-navy/20 px-3 py-1.5 text-[12px] font-bold text-navy disabled:opacity-50"
            >
              {acted ? "실행 기록됨 ✓" : "실행 · 기록"}
            </button>
          </div>
        )}
        {/* 위치 지도 — 어르신 레코드에만. 프로필을 띄운 채 눌러 바로 본다
            (2026-08-31 요청). 담당이 이동 중이면 그 사람도 같이 찍는다. */}
        {home && (
          <button
            onClick={() => setMapOpen(true)}
            className="btn-press mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-navy/15 py-2.5 text-[12px] font-bold text-navy"
            style={{ background: "rgba(10,31,60,.05)" }}
          >
            <span aria-hidden style={{ color: "#B08D57" }}>
              <Icon name="pin" size={15} strokeWidth={2} />
            </span>
            위치 지도 — {home.dong}
          </button>
        )}
        {wMatches && (
          <div className="mt-2.5 border-t border-navy/[.08] pt-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-[.1em] text-muted">복지혜택 자동 매칭</span>
              <span className="ml-auto font-num text-[11px] font-bold">
                <span style={{ color: "#1E7A5A" }}>높음 {wCounts.high}</span> ·{" "}
                <span style={{ color: "#8A5D12" }}>확인 {wCounts.check}</span> ·{" "}
                <span className="text-muted">낮음 {wCounts.low}</span>
              </span>
            </div>
            {WELFARE_PROFILES[item.name]?.basisNote && (
              <p className="mt-1 text-[11px] leading-[1.5] text-muted">근거 — {WELFARE_PROFILES[item.name].basisNote}</p>
            )}
            <div className="mt-2">
              <WelfareList
                matches={wMatches}
                statuses={state.welfare?.status}
                hideLow
                pageSize={4}
                onStatus={(id, s) => dispatch({ type: "welfareStatus", id, status: s, by: "관제" })}
                onSend={sendWelfare}
                sendLabel="보호자에게 안내"
                sent={welfareSent}
              />
            </div>
          </div>
        )}
        {crm && (
          <p className="mt-2.5 border-t border-navy/[.08] pt-2 text-[10px] leading-[1.5] text-muted">
            이 열람은 접근 기록에 남고 보호자에게 공개됩니다 — 신뢰 거버넌스
          </p>
        )}
      </div>
      {home && (
        <MapDialog
          open={mapOpen}
          onClose={() => setMapOpen(false)}
          title={`${item.name} 님 위치`}
          sub={item.summary} /* summary 가 이미 동(洞)으로 시작한다 — 앞에 또 붙이면 중복이다 */
          points={[
            { ...home, label: `${item.name} 님 댁`, color: "#B08D57" },
            ...(lead ? [{ ...lead, label: `${leadName} · ${lead.state}`, color: "#1E7A5A", pulse: true }] : []),
          ]}
          foot={
            gap != null
              ? `담당까지 직선거리 ${prettyDistance(gap)}. 실제 이동 시간은 길·신호에 따라 다릅니다. 좌표는 동(洞) 단위이며 상세 주소는 담당 확정 후에만 열립니다.`
              : "좌표는 동(洞) 단위입니다 — 상세 주소는 담당 확정 후에만 열립니다."
          }
        />
      )}
    </div>
  );
}
