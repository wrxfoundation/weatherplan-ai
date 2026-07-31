import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import {
  AI_ASSIGN,
  BRIEFINGS,
  FATIGUE,
  JOBS,
  MAP_DISTRICTS,
  MAP_HOSPITALS,
  MOU_HOSPITALS,
  RISK_WATCH,
  ROUTE_CHAIN,
  SCORE_FACTORS,
  CRM_STAGE,
  CRM_TIMELINE,
  COMMS_TRACKING,
  HOSPITAL_PARTNERS,
  INSURANCE_PARTNER,
  MORNING_BRIEF,
  PARTNER_STATUS,
  WATCH_BOARD,
  WEAR_KPIS,
  WEAR_DEVICES,
  WEAR_RULES,
  WEAR_ACTIONS,
  WEAR_PIPELINE,
  WEAR_CONSENT,
  HANDOFF_CHAIN,
  HANDOFF_STUCK,
  SOS_SUBJECT,
  SOS_TEAM,
  SOS_FAMILY,
  SOS_GOLDEN,
  SOS_LEVELS,
  SOS_HISTORY,
  SOS_KPIS,
  SOS_AFTER,
  ELDER_TAGS,
  TAG_TONE,
  DIRECTORY_ALL,
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
} from "../lib/mock";
import { useAppState } from "../lib/state";
import AiChat from "../components/AiChat";
import HelpTip from "../components/HelpTip";
import Icon from "../components/icons";
import RosterTable from "../components/RosterTable";
import { ROSTERS } from "../lib/rosters";

// 배치관리자(관제) — 핸드오프 09 상세 명세 + REQ-04(긴급 대응 범위, 회의 확정 우선).
// 데스크톱 전용 · 정보 밀도가 정당한 유일한 화면 (10~13px 활자가 정답 — 09 §0).
// 핵심 원칙: ① AI는 제안, 사람이 승인 (L4) ② 짝 없으면 확정 불가 (1인 배차 없음)
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
const DISPATCH_MENUS = [
  ["dash", "대시보드", "home"],
  ["sos", "SOS 대응", "alert"],
  ["elder", "어르신", "user"],
  ["guardian", "보호자", "users"],
  ["concierge", "컨시어지", "heart"],
  ["hospital", "병원", "plus"],
  ["wearable", "웨어러블", "watch"],
  ["weather", "날씨", "drop"],
  ["comms", "커뮤니케이션", "megaphone"],
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

function ControlMap({ sos, mode = "light", onSelect }) {
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
        m.addTo(map).bindPopup(label, { className: "kcare-popup" });
        if (sel && onSelect) m.on("click", () => onSelect(sel)); // 마커 → 플로팅 프로필
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
// 데이터 출처는 케이웨더 단일 (WEATHER_DISTRICTS ↔ MAP_DISTRICTS 이름 매칭).
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
        기상 데이터 — 케이웨더 · 5분 갱신
      </div>
    </div>
  );
}

export default function DispatchConsole() {
  const { state, dispatch } = useAppState();
  const { sos } = state.demo;
  const { sosDispatched, sos119, assign, unmatchFixed, npsDetractor } = state.ops;
  const checkedIn = state.visit.checkedIn;
  const { label: elapsed, sec: elapsedSec } = useElapsed(sos);
  const [tab, setTab] = useState("live");
  const [range, setRange] = useState("7");
  const [briefed, setBriefed] = useState(false);
  const [mapMode, setMapMode] = useState("light"); // 맵 타일 라이트/다크
  const [query, setQuery] = useState(""); // 통합 검색
  const [menu, setMenu] = useState("dash"); // GNB — 대시보드 외 관리 메뉴
  // 딥링크 — /dispatch?menu=comms 등 (시연 동선에서 감사 로그를 관제와 구분 진입)
  const router = useRouter();
  useEffect(() => {
    const m = router.query.menu;
    if (typeof m === "string" && ["dash", "sos", "elder", "guardian", "concierge", "hospital", "wearable", "weather", "comms"].includes(m)) {
      setMenu(m);
    }
  }, [router.query.menu]);
  const [sent, setSent] = useState({}); // 발송 센터 원샷
  const [briefRead, setBriefRead] = useState(false); // 아침 브리핑 읽음
  const [wearDone, setWearDone] = useState({}); // 웨어러블 기기 액션 원샷
  const [hoStage, setHoStage] = useState("accept"); // 핸드오프 정체 — 선택 단계 (기본: 최대 정체)
  const [hoDone, setHoDone] = useState({}); // 정체 건 처리 원샷
  const [sosNotified, setSosNotified] = useState({}); // SOS 인력·가족 통보 원샷
  const elders = DIRECTORY_ALL.filter((d) => d.type === "elder");
  const guardians = DIRECTORY_ALL.filter((d) => d.type === "guardian");
  const concierges = DIRECTORY_ALL.filter((d) => d.type === "concierge");
  // 사이드바 배지 카운트 — 메뉴별 관리 대상 수
  const MENU_COUNTS = {
    elder: elders.length,
    guardian: guardians.length,
    concierge: concierges.length,
    hospital: MOU_HOSPITALS.length,
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
              className="btn-press rounded-full border px-2.5 py-1 text-[11px] font-bold"
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

  return (
    <>
      <Head>
        <title>배치 관제 센터 — K-CARE</title>
      </Head>
      <div className="console-bg min-h-screen text-ink lg:flex">
        {/* 전고 사이드바 — 경영 콘솔과 동일 구조 (관제 업무 메뉴) */}
        <aside className="sticky top-0 hidden h-screen w-[212px] shrink-0 flex-col lg:flex" style={{ background: NAVY }}>
          <div className="px-5 pt-6">
            <div className="font-num text-[20px] font-extrabold tracking-[.04em] text-white">
              K-CARE <span className="align-top text-[9px] font-bold text-gold">BETA</span>
            </div>
            <div className="mt-1 text-[11px] font-bold tracking-[.14em] text-white/40">관제 콘솔 · 현장 관리</div>
          </div>
          <nav className="mt-5 min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
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
            <a href="/" className="btn-press mt-2.5 block rounded-[10px] border border-white/20 py-2 text-center text-[12px] font-bold text-white/80">데모 홈</a>
          </div>
        </aside>

        <div className="min-w-0 flex-1 px-4 pb-10 pt-7 sm:px-8">
        <div className="mx-auto max-w-[1240px]">
          {/* ── 헤더: 제목 + 시계 + KPI ── */}
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-bold tracking-[.16em] text-muted">
                  역할 04 / 배치 관제 센터
                </span>
                <a href="/" className="text-[12px] font-bold text-muted/60 underline-offset-2 hover:underline">
                  데모 홈
                </a>
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
          </header>

          {/* ── 모바일 메뉴 칩(사이드바 대체) + 통합 검색 ── */}
          <nav className="mt-4 flex flex-wrap items-center gap-2 border-b border-navy/[.08] pb-3">
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
              {DISPATCH_MENUS.map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setMenu(k)}
                  className="btn-press shrink-0 rounded-[10px] border px-3.5 py-2 text-[13px] font-bold"
                  style={
                    menu === k
                      ? { background: NAVY, color: "#FFFFFF", borderColor: NAVY }
                      : { background: "rgba(255,255,255,.6)", color: "#5C5A54", borderColor: "rgba(10,31,60,.14)" }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
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
              </div>
              {/* REQ-04 — 서비스 경계 고지 (회의 확정) */}
              <div className="w-full border-t border-white/25 pt-2 text-[12px] opacity-80">
                기본 상품 보증 범위: 긴급신호 접수 + 119 연계까지 · 현장 도착 SLA 아님 · 이 가구는 야간
                출동(외주) 옵션 미가입
              </div>
            </section>
          )}

          {/* ▼ 대시보드 — 운영 상황판 (menu) */}
          {menu === "dash" && (
            <>
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
            <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
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
            <div className="mt-2.5 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
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
              <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
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

          {/* ── 관제 맵 (09 §4) ── */}
          <section className="card-navy mt-[18px] rounded-[14px] p-[18px]" style={{ background: NAVY }}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[15px] font-bold text-white">관제 맵</h2>
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
                      className={`px-2.5 py-1 text-[11px] font-bold ${
                        mapMode === m ? "bg-white/90 text-navy" : "text-white/60"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </span>
              </div>
            </div>
            <ControlMap sos={sos} mode={mapMode} onSelect={openProfile} />
          </section>

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
            <div className="mt-4 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
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
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(196px, 1fr))" }}>
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

              {/* 페어 편성 보드 (09 §8.2) */}
              <Panel>
                <PanelHead title="오늘 페어 편성 보드" right="주 동행 + 부 동행 · 짝이 비면 배차 확정 불가" />
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

              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))" }}>
                {/* 짝 미매칭 (09 §8.3) — 1인 배차 금지의 실행 UI */}
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
                    짝을 못 찾았다고 1인 배차로 내리지 않습니다. 재배치 · 시니어 투입 · 일정 조정
                    중에서만 고릅니다.
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
                  <span className="text-[12px] text-muted">F5-6 · 케이웨더</span>
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

              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
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
                  <PanelHead title="오늘 배차 브리핑 · 외출 컨디션" right="출발지·도착지 2구간 · 케이웨더" />
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
            </>
          )}

          {/* ════ 어르신 관리 — 명부 + 리스크 워치 ════ */}
          {menu === "elder" && (
            <div className="mt-4 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
              <Panel className="min-w-0">
                <PanelHead
                  title="어르신 명부"
                  right={`전체 ${elders.length}명 · 위험 ${RISK_WATCH.filter((r) => r.level === "높음").length}명`}
                />
                <div className="mt-3 space-y-2">
                  {elders.map((d) => (
                    <div
                      key={d.name}
                      className="flex items-center gap-3 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5"
                    >
                      <button onClick={() => openProfile(d.name)} className="min-w-0 flex-1 text-left hover:opacity-75">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-bold text-navy underline decoration-navy/20 underline-offset-2">
                            {d.name}
                          </span>
                          <span className="font-num text-[12px] text-muted">{d.tag}세</span>
                          {d.alert && (
                            <span className="rounded-full border border-amber/30 bg-[#FFF7E8] px-2 py-0.5 text-[10px] font-bold text-amber">
                              챙길 것
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 truncate text-[12px] text-muted">{d.summary}</div>
                      </button>
                      <button
                        onClick={() => push("대응", `${d.name} 안부 확인 콜 접수 — 담당 컨시어지 배정`, "#8FA9CC")}
                        className="btn-press shrink-0 rounded-[10px] border border-navy/20 px-3 py-1.5 text-[12px] font-bold text-navy"
                      >
                        안부 콜
                      </button>
                    </div>
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.6] text-muted">
                  상세 주소는 담당 확정 후에만 노출됩니다 · 명부 클릭 시 담당·일정·챙길 것 프로필
                </p>
              </Panel>

              <Panel className="min-w-0">
                <PanelHead title="오늘 리스크 워치" right="환경 × 건강 이력 교차 · 단일 지표 판정 금지" />
                <div className="mt-3 space-y-2.5">
                  {RISK_WATCH.map((r) => (
                    <div key={r.name} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                          style={{ color: RISK_LEVEL[r.level].fg, background: RISK_LEVEL[r.level].bg }}
                        >
                          {r.level}
                        </span>
                        <button
                          onClick={() => openProfile(r.name.split(" (")[0])}
                          className="text-[13px] font-bold text-navy underline decoration-navy/20 underline-offset-2"
                        >
                          {r.name}
                        </button>
                      </div>
                      <div className="mt-1 text-[12px] leading-[1.55] text-muted">{r.why}</div>
                      <div className="mt-1 text-[12px] font-bold leading-[1.55] text-ink">조치 — {r.action}</div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          )}

          {menu === "elder" && (
            <Panel className="mt-4 min-w-0">
              <RosterTable
                roster={ROSTERS.elders}
                onRowClick={openProfile}
                onExport={(t) => push("설정", `${t} 엑셀 다운로드 — 접근 기록 저장`, "#8FA9CC")}
              />
            </Panel>
          )}

          {/* ════ 보호자 관리 — 주/부 보호자 · 시차 가구 ════ */}
          {menu === "guardian" && (
            <>
              <p className="mt-4 rounded-xl border border-navy/[.08] bg-white/50 px-4 py-2.5 text-[12px] leading-[1.6] text-muted">
                가입 정책 — 주 보호자 가입 후 초대 링크로 부 보호자 참여 · 결제 승인 권한은 주 보호자에게만
              </p>
              <div className="mt-3 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
                {guardians.map((d) => (
                  <Panel key={d.name} className="min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openProfile(d.name)}
                        className="text-[16px] font-bold text-navy underline decoration-navy/20 underline-offset-2"
                      >
                        {d.name}
                      </button>
                      <span className="text-[12px] text-muted">{d.tag}</span>
                      {d.summary.includes("주 보호자") && (
                        <span className="ml-auto rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-[#7A5C28]">
                          주 보호자
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[12px] leading-[1.55] text-muted">{d.summary}</p>
                    <div className="mt-2.5 space-y-1.5 border-t border-navy/[.08] pt-2.5">
                      {d.rows.map(([k, v]) => (
                        <div key={k} className="flex gap-2 text-[12px]">
                          <span className="w-[44px] shrink-0 font-bold text-gold">{k}</span>
                          <span className="flex-1 leading-[1.55] text-ink">{v}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => push("리포트", `${d.name}에게 최신 케어 리포트 재발송`, "#8FE3C0")}
                        className="btn-press rounded-[10px] border border-navy/20 px-3 py-1.5 text-[12px] font-bold text-navy"
                      >
                        리포트 재발송
                      </button>
                      <button
                        onClick={() => push("메시지", `${d.name}에게 상황 확인 알림 발송`, "#8FA9CC")}
                        className="btn-press rounded-[10px] border border-navy/20 px-3 py-1.5 text-[12px] font-bold text-navy"
                      >
                        상황 알림
                      </button>
                    </div>
                  </Panel>
                ))}
              </div>
            </>
          )}

          {menu === "guardian" && (
            <Panel className="mt-4 min-w-0">
              <RosterTable
                roster={ROSTERS.guardians}
                onRowClick={openProfile}
                onExport={(t) => push("설정", `${t} 엑셀 다운로드 — 접근 기록 저장`, "#8FA9CC")}
              />
            </Panel>
          )}

          {/* ════ 컨시어지 관리 — 명부 + 피로도 게이트 ════ */}
          {menu === "concierge" && (
            <div className="mt-4 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
              <Panel className="min-w-0">
                <PanelHead title="컨시어지 명부" right={`전체 ${concierges.length}명 · 평점 출처: 가족 만족도`} />
                <div className="mt-3 space-y-2">
                  {concierges.map((d) => (
                    <div
                      key={d.name}
                      className="flex items-center gap-3 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5"
                    >
                      <button onClick={() => openProfile(d.name)} className="min-w-0 flex-1 text-left hover:opacity-75">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-bold text-navy underline decoration-navy/20 underline-offset-2">
                            {d.name}
                          </span>
                          <span className="rounded-full bg-navy/[.06] px-2 py-0.5 text-[10px] font-bold text-navy">
                            {d.tag}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-[12px] text-muted">{d.summary}</div>
                      </button>
                      <button
                        onClick={() => push("브리핑", `${d.name}에게 내일 배차 브리핑 재발송`, "#F0D9A8")}
                        className="btn-press shrink-0 rounded-[10px] border border-navy/20 px-3 py-1.5 text-[12px] font-bold text-navy"
                      >
                        브리핑
                      </button>
                    </div>
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.6] text-muted">
                  판매액·업셀 지표는 평가에서 제외 — 평점·케어 품질만 표시 (원칙 1)
                </p>
              </Panel>
              <Panel className="min-w-0">
                <PanelHead title="근무 시간 · 피로도 상한" right="일 10시간 · 주 52시간 상한" />
                <div className="mt-3 space-y-2.5">
                  {FATIGUE.map((f) => (
                    <div key={f.name} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                      <div className="flex items-baseline justify-between">
                        <button
                          onClick={() => openProfile(f.name)}
                          className="text-[13px] font-bold text-navy underline decoration-navy/20 underline-offset-2"
                        >
                          {f.name}
                        </button>
                        <span className="font-num text-[12px] font-bold" style={{ color: f.color }}>
                          {f.hours} · {f.state}
                        </span>
                      </div>
                      <div className="mt-1.5 h-[6px] overflow-hidden rounded-full bg-navy/[.08]">
                        <span className="block h-full rounded-full" style={{ width: `${f.w}%`, background: f.color }} />
                      </div>
                      <div className="mt-1 text-[11px] text-muted">{f.jobs}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.6] text-muted">
                  피로도는 표시가 아니라 게이트 — 90% 이상은 AI 배정 후보에서 자동 제외
                </p>
              </Panel>
            </div>
          )}

          {menu === "concierge" && (
            <Panel className="mt-4 min-w-0">
              <RosterTable
                roster={ROSTERS.concierges}
                onRowClick={openProfile}
                onExport={(t) => push("설정", `${t} 엑셀 다운로드 — 접근 기록 저장`, "#8FA9CC")}
              />
            </Panel>
          )}

          {/* ════ 병원 관리 — MOU 제휴 현황 ════ */}
          {menu === "hospital" && (
            <Panel className="mt-4">
              <PanelHead title="제휴 (MOU) 병원" right="진료 과목마다 한 곳 이상 · 회의 8" />
              <div className="mt-3 grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
                {MOU_HOSPITALS.map((h) => (
                  <div key={h.name} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-navy/[.06] px-2 py-0.5 text-[10px] font-bold text-navy">
                        {h.dept}
                      </span>
                      <button
                        onClick={() => openProfile(h.name)}
                        className="text-[15px] font-bold text-navy underline decoration-navy/20 underline-offset-2"
                      >
                        {h.name}
                      </button>
                      {h.fast && (
                        <span className="ml-auto rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-[#7A5C28]">
                          패스트트랙
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[12px] leading-[1.55] text-muted">{h.note}</div>
                    {/* 파트너 레코드 — 관계도 관리 대상 (담당 · 최근 접점 · 실적 · 슬롯) */}
                    {HOSPITAL_PARTNERS[h.name] && (
                      <div className="mt-2 space-y-1 border-t border-navy/[.06] pt-2 text-[11px] leading-[1.6]">
                        <div className="flex items-center gap-2">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                            style={{ background: PARTNER_STATUS[HOSPITAL_PARTNERS[h.name].status] }}
                          >
                            {HOSPITAL_PARTNERS[h.name].status}
                          </span>
                          <span className="text-muted">담당 {HOSPITAL_PARTNERS[h.name].contact}</span>
                        </div>
                        <div className="text-muted">
                          최근 접점 {HOSPITAL_PARTNERS[h.name].last} · 이번 달 동행{" "}
                          <span className="font-num font-bold text-ink">{HOSPITAL_PARTNERS[h.name].trips}건</span> ·
                          가용 슬롯 <span className="font-bold text-ink">{HOSPITAL_PARTNERS[h.name].slots}</span>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => push("예약", `${h.name} ${h.dept} 예약 슬롯 조회 — 응답 대기`, "#8FA9CC")}
                      className="btn-press mt-2 rounded-[10px] border border-navy/20 px-3 py-1.5 text-[12px] font-bold text-navy"
                    >
                      슬롯 조회
                    </button>
                  </div>
                ))}
              </div>
              {/* 보험 GA — 파트너 파이프라인 (H4: 등록 전 모집 금지) */}
              <div className="mt-3 rounded-xl border border-navy/[.06] bg-white/60 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-bold text-navy">{INSURANCE_PARTNER.name}</span>
                  <div className="ml-auto flex flex-wrap gap-1.5">
                    {INSURANCE_PARTNER.stage.map(([st, done]) => (
                      <span
                        key={st}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          done ? "bg-green/10 text-green" : "border border-navy/15 text-muted"
                        }`}
                      >
                        {done ? `✓ ${st}` : st}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="mt-1.5 text-[11px] leading-[1.6] text-muted">{INSURANCE_PARTNER.note}</p>
              </div>
            </Panel>
          )}

          {menu === "hospital" && (
            <Panel className="mt-4 min-w-0">
              <RosterTable
                roster={ROSTERS.hospitals}
                onRowClick={openProfile}
                onExport={(t) => push("설정", `${t} 엑셀 다운로드 — 접근 기록 저장`, "#8FA9CC")}
              />
            </Panel>
          )}

          {/* ════ SOS 대응 — 당사자 · 대응 인력 · 가족 연락을 한 화면에서 (골든타임) ════ */}
          {menu === "sos" && (
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-[11px] font-bold tracking-[.14em] text-muted">현장 / 긴급 대응</div>
                <h2 className="mt-0.5 text-[17px] font-bold text-navy">SOS 대응 센터</h2>
                <p className="mt-1 text-[13px] leading-[1.7] text-muted">
                  현황 파악과 빠른 조치가 전부입니다 — 당사자 · 대응 인력 · 가족 연락을 한 화면에서 봅니다.
                  경과는 관제만 봅니다 (가족 화면 비노출).
                </p>
              </div>

              {/* 현재 상황 배너 */}
              {sos ? (
                <section className="rounded-[14px] border border-danger/30 bg-danger/[.07] px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="animate-sosPulse rounded-full bg-danger px-3 py-1 text-[12px] font-bold text-white">SOS 진행 중</span>
                    <span className="text-[17px] font-bold text-navy">{SOS_SUBJECT.name}</span>
                    <span className="font-num text-[15px] font-bold text-danger">경과 {elapsed}</span>
                    <span className="text-[12px] font-bold text-muted">
                      {sosDispatched ? "급파 중" : "급파 대기"} · {sos119 ? "119 연계 완료" : "119 연계 대기"}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                    {[["위치", SOS_SUBJECT.where], ["출입", SOS_SUBJECT.key], ["의료 특이", SOS_SUBJECT.alert], ["워치", SOS_SUBJECT.watch]].map(([k, v]) => (
                      <div key={k} className="rounded-lg bg-white/70 px-3 py-2">
                        <span className="text-[11px] font-bold text-muted">{k}</span>{" "}
                        <span className="text-[12px] font-bold text-navy">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        if (sosDispatched) return;
                        dispatch({ type: "opsPatch", patch: { sosDispatched: true } });
                        push("긴급", "SOS 급파 지시 — 박지현 · 서다인 (2인)", "#FF8D7E");
                      }}
                      disabled={sosDispatched}
                      className="btn-press rounded-[10px] px-4 py-2 text-[13px] font-bold text-white disabled:opacity-60"
                      style={{ background: "#C0392B" }}
                    >
                      {sosDispatched ? "급파 중 · 박지현 + 서다인" : "급파 지시 (2인 1조)"}
                    </button>
                    <button
                      onClick={() => {
                        if (sos119) return;
                        dispatch({ type: "opsPatch", patch: { sos119: true } });
                        push("긴급", "119 연계 — 심부전 이력 · 3층 계단 진입 고지", "#FF8D7E");
                      }}
                      disabled={sos119}
                      className="btn-press rounded-[10px] border border-danger/40 px-4 py-2 text-[13px] font-bold text-danger disabled:opacity-50"
                    >
                      {sos119 ? "119 연계 기록됨" : "119 연계"}
                    </button>
                    <button
                      onClick={() => {
                        dispatch({ type: "ackSos" });
                        push("긴급", "SOS 해제 — 관제 확인 · 상황 리포트 작성 대기", "#8FE3C0");
                      }}
                      className="btn-press ml-auto rounded-[10px] border border-navy/25 px-4 py-2 text-[13px] font-bold text-navy"
                    >
                      SOS 해제 (관제 전용)
                    </button>
                  </div>
                </section>
              ) : (
                <section className="rounded-[14px] border border-green/25 bg-green/[.05] px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="rounded-full bg-green/15 px-3 py-1 text-[12px] font-bold text-green">진행 중 SOS 없음</span>
                    <span className="text-[13px] text-muted">최근 발생 — {SOS_HISTORY[0].at} · {SOS_HISTORY[0].who} · {SOS_HISTORY[0].result}</span>
                  </div>
                  <p className="mt-1.5 text-[12px] leading-[1.6] text-muted">
                    대응 인력 · 가족 연락 체계는 아래에서 상시 관리합니다 — 발생 시 이 화면이 즉시 대응 콘솔로 바뀝니다.
                  </p>
                </section>
              )}

              {/* KPI */}
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                {SOS_KPIS.map((k) => (
                  <div key={k.k} className="card-glass rounded-[14px] p-4">
                    <div className="text-[11px] font-bold text-muted">{k.k}</div>
                    <div className="mt-1 font-num text-[24px] font-bold" style={{ color: k.color }}>{k.v}</div>
                    <div className="mt-0.5 text-[11px] text-muted">{k.note}</div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))" }}>
                {/* 대응 인력 */}
                <Panel className="min-w-0">
                  <PanelHead title="대응 인력" right="누가 어디까지 됐는지 — 공백과 중복을 동시에 막는다" />
                  <div className="mt-3 space-y-2">
                    {SOS_TEAM.map((t) => (
                      <div key={t.role} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-navy/[.06] px-2 py-0.5 text-[10px] font-bold text-navy">{t.role}</span>
                          <button
                            onClick={() => openProfile(t.name)}
                            className="text-[13px] font-bold text-navy underline decoration-navy/20 underline-offset-2"
                          >
                            {t.name}
                          </button>
                          <span
                            className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={
                          t.tone === "bad" ? { color: "#C0392B", background: "rgba(192,57,43,.1)" }
                          : t.tone === "warn" ? { color: "#8A5D12", background: "rgba(138,93,18,.12)" }
                          : t.tone === "ok" ? { color: "#1E7A5A", background: "rgba(30,122,90,.1)" }
                          : { color: "#5C5A54", background: "rgba(10,31,60,.06)" }
                            }
                          >
                            {sosDispatched && t.role.includes("컨시어지") ? "출동 중" : sos119 && t.role.includes("119") ? "연계 완료" : t.state}
                          </span>
                        </div>
                        <div className="mt-1 text-[12px] leading-[1.55] text-muted">{t.detail}</div>
                        {t.action && (
                          <button
                            onClick={() => {
                              if (sosNotified[t.role]) return;
                              setSosNotified((v) => ({ ...v, [t.role]: true }));
                              push("긴급", `SOS ${t.action} — ${t.name}`, "#FF8D7E");
                            }}
                            disabled={!!sosNotified[t.role]}
                            className="btn-press mt-2 rounded-[10px] border border-navy/20 px-3 py-1.5 text-[12px] font-bold text-navy disabled:opacity-50"
                          >
                            {sosNotified[t.role] ? `${t.action} 완료 ✓` : t.action}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </Panel>

                {/* 가족 연락 */}
                <Panel className="min-w-0">
                  <PanelHead title="가족 연락 — 우선순위" right="시차 가구 포함 · 중복 연락 방지" />
                  <div className="mt-3 space-y-2">
                    {SOS_FAMILY.map((f) => (
                      <div key={f.name} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-[#7A5C28]">{f.rank}</span>
                          <span className="text-[13px] font-bold text-navy">{f.name}</span>
                          <span className="text-[11px] text-muted">{f.where}</span>
                          <span
                            className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={
                              f.tone === "ok" ? { color: "#1E7A5A", background: "rgba(30,122,90,.1)" }
                              : f.tone === "warn" ? { color: "#8A5D12", background: "rgba(138,93,18,.12)" }
                              : { color: "#5C5A54", background: "rgba(10,31,60,.06)" }
                            }
                          >
                            {f.state}
                          </span>
                        </div>
                        <div className="mt-1 text-[12px] leading-[1.55] text-muted">{f.detail}</div>
                        <button
                          onClick={() => {
                            if (sosNotified[f.name]) return;
                            setSosNotified((v) => ({ ...v, [f.name]: true }));
                            push("긴급", `SOS 가족 통보 — ${f.name} (${f.rank})`, "#FF8D7E");
                          }}
                          disabled={!!sosNotified[f.name]}
                          className="btn-press mt-2 rounded-[10px] border border-navy/20 px-3 py-1.5 text-[12px] font-bold text-navy disabled:opacity-50"
                        >
                          {sosNotified[f.name] ? "통보 기록됨 ✓" : "통보 · 콜"}
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    1순위 응답이 확인되면 하위 순위 콜은 보류하고 요약 통보로 전환합니다 — 새벽 시차 가구에 불필요한 공포를 만들지 않습니다.
                  </p>
                </Panel>

                {/* 골든타임 */}
                <Panel className="min-w-0">
                  <PanelHead title="골든타임 체크" right="경과별 목표 — 관제 내부용" />
                  <div className="mt-3 space-y-2">
                    {SOS_GOLDEN.map(([t, what, who], i) => {
                      const done = sos ? (i === 0 || (i === 1 && sosDispatched) || (i === 2 && sos119)) : false;
                      return (
                        <div key={t} className="flex items-start gap-2.5 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                          <span
                            className="mt-[1px] flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full font-num text-[10px] font-bold"
                            style={done ? { background: "#1E7A5A", color: "#fff" } : { background: "rgba(10,31,60,.08)", color: "#0A1F3C" }}
                          >
                            {done ? "✓" : i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-[12px] font-bold text-navy">{t}</div>
                            <div className="text-[12px] leading-[1.55] text-muted">{what}</div>
                          </div>
                          <span className="shrink-0 text-[10px] font-bold text-muted">{who}</span>
                        </div>
                      );
                    })}
                  </div>
                </Panel>

                {/* 등급 · 프로토콜 */}
                <Panel className="min-w-0">
                  <PanelHead title="SOS 등급 · 대응 프로토콜" right="판단은 사람 (L4) · 자동 해제 없음" />
                  <div className="mt-3 space-y-2">
                    {SOS_LEVELS.map((l) => (
                      <div key={l.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={
                              l.tone === "bad" ? { color: "#C0392B", background: "rgba(192,57,43,.1)" }
                              : l.tone === "warn" ? { color: "#8A5D12", background: "rgba(138,93,18,.12)" }
                              : { color: "#5C5A54", background: "rgba(10,31,60,.06)" }
                            }
                          >
                            {l.k}
                          </span>
                        </div>
                        <div className="mt-1 text-[12px] text-muted">{l.desc}</div>
                        <div className="mt-0.5 text-[12px] font-bold leading-[1.55] text-ink">경로 — {l.route}</div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    해제는 관제만 할 수 있습니다 — 어르신·가족·컨시어지 화면에는 해제 버튼이 없습니다.
                  </p>
                </Panel>

                {/* 이력 */}
                <Panel className="min-w-0">
                  <PanelHead title="SOS 이력" right="최근 4건 · 개별 사건은 관제 소관" />
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left text-[12px]">
                      <thead>
                        <tr className="whitespace-nowrap border-b border-navy/15 text-[11px] font-bold text-muted">
                          <th className="py-1.5 pr-3">발생</th>
                          <th className="py-1.5 pr-3">당사자</th>
                          <th className="py-1.5 pr-3">등급</th>
                          <th className="py-1.5 pr-3">원인</th>
                          <th className="py-1.5 pr-3">응답</th>
                          <th className="py-1.5">결과</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SOS_HISTORY.map((h) => (
                          <tr key={h.at} className="border-b border-navy/[.06]">
                            <td className="whitespace-nowrap py-2 pr-3 font-num text-muted">{h.at}</td>
                            <td className="whitespace-nowrap py-2 pr-3">
                              <button onClick={() => openProfile(h.who.split(" (")[0])} className="font-bold text-navy underline decoration-navy/20 underline-offset-2">
                                {h.who}
                              </button>
                            </td>
                            <td className="whitespace-nowrap py-2 pr-3">
                              <span
                                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                                style={
                                  h.tone === "bad" ? { color: "#C0392B", background: "rgba(192,57,43,.1)" }
                                  : h.tone === "warn" ? { color: "#8A5D12", background: "rgba(138,93,18,.12)" }
                                  : { color: "#5C5A54", background: "rgba(10,31,60,.06)" }
                                }
                              >
                                {h.level}
                              </span>
                            </td>
                            <td className="py-2 pr-3 text-ink">{h.cause}</td>
                            <td className="whitespace-nowrap py-2 pr-3 font-num font-bold text-green">{h.resp}</td>
                            <td className="py-2 text-muted">{h.result}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>

                {/* 사후 조치 */}
                <Panel className="min-w-0">
                  <PanelHead title="사후 조치 — 해제 다음이 더 중요하다" right="숨기지 않는 것이 신뢰" />
                  <ol className="mt-3 space-y-2">
                    {SOS_AFTER.map(([k, v, who], i) => (
                      <li key={k} className="flex items-start gap-2.5 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <span className="mt-[1px] flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-gold font-num text-[10px] font-bold text-navy">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-bold text-navy">{k}</div>
                          <div className="text-[12px] leading-[1.55] text-muted">{v}</div>
                        </div>
                        <span className="shrink-0 text-[10px] font-bold text-muted">{who}</span>
                      </li>
                    ))}
                  </ol>
                </Panel>
              </div>
            </div>
          )}

          {/* ════ 웨어러블 — 기기 자산 · 알림 규칙 · 액션 큐 · 연동 상태 (갤럭시 Fit3) ════ */}
          {menu === "wearable" && (
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-[11px] font-bold tracking-[.14em] text-muted">현장 / 기기 · 알림 · 연동</div>
                <h2 className="mt-0.5 text-[17px] font-bold text-navy">웨어러블 운영 — 갤럭시 Fit3</h2>
                <p className="mt-1 text-[13px] leading-[1.7] text-muted">
                  단일 지표로 판정하지 않습니다 — 알림은 복합 조건, 낙상은 보호자 직통 + 관제 이중 경로.
                </p>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
                {WEAR_KPIS.map((k) => (
                  <div key={k.k} className="card-glass rounded-[14px] p-4">
                    <div className="text-[11px] font-bold text-muted">{k.k}</div>
                    <div className="mt-1 font-num text-[24px] font-bold" style={{ color: k.color }}>{k.v}</div>
                    <div className="mt-0.5 text-[11px] text-muted">{k.note}</div>
                  </div>
                ))}
              </div>

              {/* 오늘의 기기 액션 큐 */}
              <Panel className="min-w-0">
                <PanelHead title="오늘의 기기 액션 큐" right="기기 단위 업무 — 사람 배차와 분리 관리" />
                <div className="mt-3 space-y-2">
                  {WEAR_ACTIONS.map((a, i) => (
                    <div key={a.serial + i} className="flex flex-wrap items-center gap-2.5 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={
                          a.tone === "bad" ? { color: "#C0392B", background: "rgba(192,57,43,.1)" }
                          : a.tone === "warn" ? { color: "#8A5D12", background: "rgba(138,93,18,.12)" }
                          : { color: "#5C5A54", background: "rgba(10,31,60,.06)" }
                        }
                      >
                        {a.level}
                      </span>
                      <span className="font-num text-[11px] font-bold text-navy">{a.serial}</span>
                      <button onClick={() => openProfile(a.who.split(" (")[0])} className="text-[13px] font-bold text-navy underline decoration-navy/20 underline-offset-2">
                        {a.who}
                      </button>
                      <span className="min-w-0 flex-1 text-[12px] text-muted">{a.text}</span>
                      <button
                        onClick={() => {
                          if (wearDone[a.serial + i]) return;
                          setWearDone((v) => ({ ...v, [a.serial + i]: true }));
                          push("설정", `웨어러블 ${a.act} — ${a.serial} · ${a.who}`, "#8FA9CC");
                        }}
                        disabled={!!wearDone[a.serial + i]}
                        className="btn-press shrink-0 rounded-[10px] border border-navy/20 px-3 py-1.5 text-[12px] font-bold text-navy disabled:opacity-50"
                      >
                        {wearDone[a.serial + i] ? "처리됨 ✓" : a.act}
                      </button>
                    </div>
                  ))}
                </div>
              </Panel>

              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(470px, 1fr))" }}>
              <Panel className="min-w-0">
                <PanelHead
                  title="실시간 수신 보드"
                  right={<span className="text-[12px] text-muted">5분 주기 동기화 (준실시간)</span>}
                />
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-[12px]">
                    <thead>
                      <tr className="whitespace-nowrap border-b border-navy/15 text-[11px] font-bold text-muted">
                        <th className="py-1.5 pr-3">어르신</th>
                        <th className="py-1.5 pr-3">착용</th>
                        <th className="py-1.5 pr-3">수신</th>
                        <th className="py-1.5 pr-3">심박</th>
                        <th className="py-1.5 pr-3">SpO₂</th>
                        <th className="py-1.5">특이</th>
                      </tr>
                    </thead>
                    <tbody>
                      {WATCH_BOARD.map((w) => (
                        <tr key={w.name} className="border-b border-navy/[.06]">
                          <td className="py-2 pr-3">
                            <button
                              onClick={() => openProfile(w.name)}
                              className="font-bold text-navy underline decoration-navy/20 underline-offset-2"
                            >
                              {w.name}
                            </button>
                          </td>
                          <td className="whitespace-nowrap py-2 pr-3">
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                              style={
                                w.level === "warn"
                                  ? { color: "#C0392B", background: "rgba(192,57,43,.1)" }
                                  : { color: "#1E7A5A", background: "rgba(30,122,90,.1)" }
                              }
                            >
                              {w.wear}
                            </span>
                          </td>
                          <td className="whitespace-nowrap py-2 pr-3 font-num">{w.sync}</td>
                          <td className="whitespace-nowrap py-2 pr-3 font-num">{w.hr}</td>
                          <td className="whitespace-nowrap py-2 pr-3 font-num">{w.spo2}</td>
                          <td className="py-2 text-muted">{w.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2.5 border-t border-navy/[.08] pt-2 text-[11px] leading-[1.7] text-muted">
                  Samsung Health → Health Connect → 컴패니언 경유 — 실시간 스트리밍이 아닌 준실시간 ·
                  단일 지표로 판정하지 않습니다
                </p>
              </Panel>

                {/* 기기 자산 대장 */}
                <Panel className="min-w-0">
                  <PanelHead title="기기 자산 대장" right={<span className="text-[12px] text-muted">시리얼 · 배터리 · 펌웨어 · 배포일</span>} />
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left text-[12px]">
                      <thead>
                        <tr className="whitespace-nowrap border-b border-navy/15 text-[11px] font-bold text-muted">
                          <th className="py-1.5 pr-3">시리얼</th>
                          <th className="py-1.5 pr-3">사용자</th>
                          <th className="py-1.5 pr-3">지점</th>
                          <th className="py-1.5 pr-3">배터리</th>
                          <th className="py-1.5 pr-3">펌웨어</th>
                          <th className="py-1.5">상태</th>
                        </tr>
                      </thead>
                      <tbody>
                        {WEAR_DEVICES.map((d) => (
                          <tr key={d.serial} className="border-b border-navy/[.06]">
                            <td className="whitespace-nowrap py-2 pr-3 font-num font-bold text-navy">{d.serial}</td>
                            <td className="whitespace-nowrap py-2 pr-3 text-ink">{d.owner}</td>
                            <td className="whitespace-nowrap py-2 pr-3 text-muted">{d.branch}</td>
                            <td className="whitespace-nowrap py-2 pr-3">
                              <span className="font-num font-bold" style={{ color: d.batt <= 20 ? "#C0392B" : d.batt <= 50 ? "#8A5D12" : "#1E7A5A" }}>
                                {d.batt}%
                              </span>
                            </td>
                            <td className="whitespace-nowrap py-2 pr-3 text-muted">{d.fw}</td>
                            <td className="whitespace-nowrap py-2">
                              <span
                                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                                style={
                                  d.tone === "bad" ? { color: "#C0392B", background: "rgba(192,57,43,.1)" }
                                  : d.tone === "warn" ? { color: "#8A5D12", background: "rgba(138,93,18,.12)" }
                                  : d.tone === "ok" ? { color: "#1E7A5A", background: "rgba(30,122,90,.1)" }
                                  : { color: "#5C5A54", background: "rgba(10,31,60,.06)" }
                                }
                              >
                                {d.state}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2.5 border-t border-navy/[.08] pt-2 text-[11px] leading-[1.7] text-muted">
                    분실 · 파손 · 반납은 기기 대장에서 관리합니다 — 어르신 명부(사람)와 기기 대장(자산)은 분리 운영.
                  </p>
                </Panel>

                {/* 알림 규칙 성능 */}
                <Panel className="min-w-0">
                  <PanelHead title="알림 규칙 · 오탐률" right={<span className="text-[12px] font-bold text-danger">오탐 30% 초과는 단독 발송 금지</span>} />
                  <div className="mt-3 space-y-2.5">
                    {WEAR_RULES.map((r) => (
                      <div key={r.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13px] font-bold text-navy">{r.k}</span>
                          <span
                            className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={
                              r.tone === "bad" ? { color: "#C0392B", background: "rgba(192,57,43,.1)" }
                              : r.tone === "warn" ? { color: "#8A5D12", background: "rgba(138,93,18,.12)" }
                              : { color: "#1E7A5A", background: "rgba(30,122,90,.1)" }
                            }
                          >
                            오탐 {r.falseRate}
                          </span>
                        </div>
                        <div className="mt-1 text-[12px] leading-[1.6] text-muted">조건 — {r.cond}</div>
                        <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-muted">
                          <span>발동 <span className="font-num font-bold text-ink">{r.fired}</span></span>
                          <span>실제 <span className="font-num font-bold text-ink">{r.real}</span></span>
                        </div>
                        <div className="mt-1 text-[12px] font-bold leading-[1.55] text-ink">경로 — {r.route}</div>
                      </div>
                    ))}
                  </div>
                </Panel>

                {/* 연동 파이프라인 */}
                <Panel className="min-w-0">
                  <PanelHead title="연동 상태" right={<span className="text-[12px] text-muted">Fit3 → Samsung Health → Health Connect → 컴패니언</span>} />
                  <div className="mt-3 space-y-2">
                    {WEAR_PIPELINE.map(([k, st, note, tone], i) => (
                      <div key={k} className="flex items-start gap-2.5 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <span className="mt-[1px] flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-navy/[.08] font-num text-[10px] font-bold text-navy">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-bold text-navy">{k}</div>
                          <div className="text-[11px] leading-[1.6] text-muted">{note}</div>
                        </div>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={
                            tone === "ok" ? { color: "#1E7A5A", background: "rgba(30,122,90,.1)" }
                            : tone === "warn" ? { color: "#8A5D12", background: "rgba(138,93,18,.12)" }
                            : { color: "#5C5A54", background: "rgba(10,31,60,.06)" }
                          }
                        >
                          {st}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2.5 border-t border-navy/[.08] pt-2 text-[11px] leading-[1.7] text-muted">
                    스트레스 지표는 파트너 SDK 조건부 — 삼성 제휴 협의 대상입니다. 위치는 워치 단독 GPS가 없어 폰 경유로 수집합니다.
                  </p>
                </Panel>

                {/* 동의 · 데이터 */}
                <Panel className="min-w-0">
                  <PanelHead title="동의 · 데이터 관리" right={<span className="text-[12px] text-muted">생체정보 = S1 민감 등급</span>} />
                  <div className="mt-3 space-y-2.5">
                    {WEAR_CONSENT.map((c) => (
                      <div key={c.k} className="flex items-baseline gap-3 border-t border-navy/[.06] pt-2.5 first:border-t-0 first:pt-0">
                        <div className="min-w-0">
                          <div className="text-[13px] font-bold text-navy">{c.k}</div>
                          <div className="text-[11px] text-muted">{c.note}</div>
                        </div>
                        <span
                          className="ml-auto shrink-0 font-num text-[13px] font-bold"
                          style={{ color: c.tone === "warn" ? "#8A5D12" : c.tone === "ok" ? "#1E7A5A" : "#0A1F3C" }}
                        >
                          {c.v}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    낙상 직통 미동의 3가구는 관제 경유로만 통보됩니다 — 동의 없이 경로를 바꾸지 않습니다.
                  </p>
                </Panel>
              </div>
            </div>
          )}

          {/* ════ 날씨 — 현재 기상 · 대기질 · 권역 지도 · 이슈 → 케어 연계 (출처: 케이웨더) ════ */}
          {menu === "weather" && (
            <div className="mt-4 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
              <Panel className="min-w-0">
                <PanelHead title="현재 기상 — 강남지점 권역" right={`케이웨더 · ${WEATHER_NOW.updated}`} />
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
                      className="rounded-full px-2.5 py-1 text-[11px] font-bold"
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
                  기상 데이터는 케이웨더 단일 출처 · 이슈는 배차 · 발송 · 준비물 판단의 재료입니다 — 발송은
                  발송 센터에서, 일정 조정은 관제사 승인으로만 실행됩니다.
                </p>
              </Panel>
            </div>
          )}

          {/* ════ 커뮤니케이션 — 발송 센터 + 감사 로그 ════ */}
          {menu === "comms" && (
            <div className="mt-4 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
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
        />
      </div>
    </>
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
        {crm && (
          <p className="mt-2.5 border-t border-navy/[.08] pt-2 text-[10px] leading-[1.5] text-muted">
            이 열람은 접근 기록에 남고 보호자에게 공개됩니다 — 신뢰 거버넌스
          </p>
        )}
      </div>
    </div>
  );
}
