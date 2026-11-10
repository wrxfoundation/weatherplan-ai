"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pager, SortTh, usePager, useSort, type SortSpec } from "@/components/admin/sortable";
import IntegrationsPanel from "@/components/admin/IntegrationsPanel";
import OrdersPanel from "@/components/admin/OrdersPanel";
import SystemPanel from "@/components/admin/SystemPanel";
import MembersPanel from "@/components/admin/MembersPanel";
import BlindDrawPanel from "@/components/admin/BlindDrawPanel";
import RafflePanel from "@/components/admin/RafflePanel";
import PromoPanel from "@/components/admin/PromoPanel";
import AffiliatePanel from "@/components/admin/AffiliatePanel";
import dynamic from "next/dynamic";
import type { MapNode } from "@/components/NodeGlobe";
import { toast } from "@/components/Toast";
import "@/app/wb-page.css";

// 지도는 window 를 만지므로 SSR 을 끈다. 관리자만 쓰는 무거운 의존성이라 지연 로딩.
const mapLoading = () => (
  <div style={{ height: 460, display: "grid", placeItems: "center", color: "var(--ink-faint)", fontSize: 13 }}>
    지도 불러오는 중…
  </div>
);
const NodeMapbox = dynamic(() => import("@/components/NodeMapbox"), { ssr: false, loading: mapLoading });
// 토큰이 없거나 거부되면 외부 의존 없는 D3 글로브로 떨어진다 - 지도 자리가 비는 게 제일 나쁘다.
const NodeGlobe = dynamic(() => import("@/components/NodeGlobe"), { ssr: false, loading: mapLoading });

interface CodeRow {
  id: string;
  batchId: string;
  status: string;
  usedBy: string | null;
  serial: string;
  taxon: string;
  tier: string;
  nftState: string | null;
}

interface Overview {
  devices: { total: number; active: number; online24h: number; operators: number };
  nftStates: Record<string, number>;
  codeStates: Record<string, number>;
  batches: { batchId: string; count: number }[];
  token: { issued: number; hot: number; circulating: number } | null;
  epochs: {
    date: string;
    status: string;
    budget: number | null;
    eligibleNodes: number | null;
    unallocated: number | null;
    error: string | null;
  }[];
  claims: { id: string; wallet: string; amount: number; status: string; txHash: string | null }[];
  accruals: { status: string; count: number; sum: number }[];
  outboxOpen: number;
  config: { economic: Record<string, unknown>; scoring: Record<string, unknown> };
}

interface NewDevice {
  serial: string;
  deviceId: string;
  redeemCode: string;
  hmacKeyId: string;
  deviceKey: string;
}

interface NodeRow {
  deviceId: string; serial: string; taxon: string; tier: string; status: string;
  isVirtual: boolean; feed?: string | null; wallet: string | null; nftState: string | null;
  lastTs: string | null; ageMinutes: number | null; online: boolean; todayCount: number;
  pm10: number | null; pm25: number | null; co2: number | null; tvoc: number | null; temp: number | null; humidity: number | null;
}
interface NodesResp {
  nodes: NodeRow[];
  summary: { total: number; online: number; linked: number; licensed: number; awaitingAccept: number; todayReadings: number };
}
interface ClaimRow2 {
  id: string; wallet: string; amount: number; status: string;
  txHash: string | null; resultCode: string | null; createdAt: string; confirmedAt: string | null;
}
interface RewardsResp {
  holdHours: number;
  byStatus: { status: string; amount: number; count: number }[];
  claimableNow: { amount: number; count: number };
  holding: { amount: number; count: number };
  claims: ClaimRow2[];
  walletBalances: { wallet: string; amount: number; count: number }[];
}

/* 표 정렬 열 (2026-09-08 지시: 관리자 표 머리글 클릭 정렬) */
const NODE_SORT: SortSpec<NodeRow> = {
  status: (n) => (n.online ? 0 : 1) + (n.status === "ACTIVE" ? 0 : 2),
  serial: (n) => n.serial,
  kind: (n) => `${n.taxon}·${n.tier}`,
  nft: (n) => n.nftState === "CLAIMED" ? "1보유" : n.nftState ? "2" + n.nftState : null,
  wallet: (n) => n.wallet,
  last: (n) => n.lastTs ? new Date(n.lastTs).getTime() : null,
  today: (n) => n.todayCount,
  pm10: (n) => n.pm10, pm25: (n) => n.pm25, co2: (n) => n.co2, tvoc: (n) => n.tvoc, temp: (n) => n.temp, humidity: (n) => n.humidity,
};
const CODE_SORT: SortSpec<CodeRow> = {
  serial: (c) => c.serial, batch: (c) => c.batchId, taxon: (c) => c.taxon, tier: (c) => c.tier,
  code: (c) => c.status, nft: (c) => c.nftState, usedBy: (c) => c.usedBy,
};

const LOC_SORT: SortSpec<MapNode & Record<string, unknown>> = {
  serial: (n) => n.serial, status: (n) => n.status, lat: (n) => n.lat, lon: (n) => n.lon,
  src: (n) => n.locSource, ip: (n) => (n.locIp as string | undefined) ?? null, area: (n) => n.area,
};
const WALLET_SORT: SortSpec<{ wallet: string; amount: number; count: number }> = { wallet: (w) => w.wallet, count: (w) => w.count, amount: (w) => w.amount };
const CLAIM_SORT: SortSpec<ClaimRow2> = {
  at: (c) => new Date(c.createdAt + (c.createdAt.endsWith("Z") ? "" : "Z")).getTime(), wallet: (c) => c.wallet, amount: (c) => c.amount,
  status: (c) => c.status, tx: (c) => c.txHash ?? c.resultCode,
};
const EPOCH_SORT: SortSpec<Overview["epochs"][number]> = {
  date: (e) => e.date, status: (e) => e.status, budget: (e) => e.budget, nodes: (e) => e.eligibleNodes, unalloc: (e) => e.unallocated, error: (e) => e.error,
};
const OD_SORT: SortSpec<Record<string, string | number | null>> = {
  area: (r) => r.area ?? r.hcode, pm10: (r) => r.pm10, pm25: (r) => r.pm25, temp: (r) => r.temp,
  observed: (r) => r.observedAt ? new Date(String(r.observedAt)).getTime() : null, fetched: (r) => r.error ? null : new Date(String(r.fetchedAt)).getTime(),
};
const OV_CLAIM_SORT: SortSpec<Overview["claims"][number]> = { wallet: (c) => c.wallet, amount: (c) => c.amount, status: (c) => c.status, tx: (c) => c.txHash };

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://wellbian.io";

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [ov, setOv] = useState<Overview | null>(null);
  const [msg, setMsg] = useState("");
  /* 오픈 전 페이지(익스플로러·DeFi·데이터 마켓·스폰서)를 볼 수 있는 임시 링크 (2026-09-13 지시).
     관리자 키를 주소에 넣지 않는다 - 서명된 토큰만 붙고 24시간 뒤 저절로 죽는다. */
  const [previewMsg, setPreviewMsg] = useState("");
  const makePreviewLink = async () => {
    try {
      const r = await fetch("/api/admin/preview-link?hours=24&to=/network", { headers: { "x-admin-secret": secret }, cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "링크를 만들지 못했습니다");
      try { await navigator.clipboard.writeText(d.url); setPreviewMsg("미리보기 링크를 복사했습니다 · 24시간 유효 · 그 브라우저에서 한 번 열면 됩니다"); }
      catch { setPreviewMsg(d.url); }
      toast.ok("미리보기 링크 발급");
    } catch (e) { toast.err((e as Error).message); }
  };
  const [newDevices, setNewDevices] = useState<NewDevice[]>([]);
  const [batch, setBatch] = useState({ count: 3, taxon: "IAQ", tier: "STANDARD", geohash5: "wydm6", isVirtual: true });
  const [settleDate, setSettleDate] = useState("");
  const [revenue, setRevenue] = useState({ month: "", amount: "" });
  const [economicJson, setEconomicJson] = useState("");
  // 재단 최상위 정책 - JSON 덩어리에 묻어두면 오타 하나로 잠금이 풀린다.
  const [payoutOpenAt, setPayoutOpenAt] = useState<string | null>(null);
  const [payoutDraft, setPayoutDraft] = useState("");
  // 서버가 마지막으로 준 economic 원본. payoutOpenAt 만 바꿔 저장할 때 쓴다.
  const [economicBase, setEconomicBase] = useState<Record<string, unknown>>({});
  const [tab, setTab] = useState<"개요" | "스테이션 현황" | "기기·코드" | "NFT" | "토큰" | "보상·클레임" | "정산" | "주문·배송" | "프로모션" | "어필리에이트" | "연동 설정" | "블라인드 추첨" | "래플" | "시스템·용량" | "회원">("개요");
  const [nodes, setNodes] = useState<NodesResp | null>(null);
  const [rw, setRw] = useState<RewardsResp | null>(null);
  const [issue, setIssue] = useState({ count: 10, expiresInDays: 365 });
  const [issued, setIssued] = useState<string[]>([]);
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const walletRows = useMemo(() => rw?.walletBalances ?? [], [rw]);
  const walletSort = useSort(walletRows, WALLET_SORT); const walletPager = usePager(walletSort.sorted);
  const claimRows = useMemo(() => rw?.claims ?? [], [rw]);
  const claimSort = useSort(claimRows, CLAIM_SORT); const claimPager = usePager(claimSort.sorted);
  const epochRows = useMemo(() => ov?.epochs ?? [], [ov]);
  const epochSort = useSort(epochRows, EPOCH_SORT); const epochPager = usePager(epochSort.sorted);
  const ovClaimRows = useMemo(() => ov?.claims ?? [], [ov]);
  const ovClaimSort = useSort(ovClaimRows, OV_CLAIM_SORT); const ovClaimPager = usePager(ovClaimSort.sorted);
  const nodeRows = useMemo(() => nodes?.nodes ?? [], [nodes]);
  const nodeSort = useSort(nodeRows, NODE_SORT);
  const codeSort = useSort(codes, CODE_SORT);
  const nodePager = usePager(nodeSort.sorted);
  const codePager = usePager(codeSort.sorted);
  const [codeBatch, setCodeBatch] = useState("");
  const [health, setHealth] = useState<{
    unregisteredSerials: { serial: string; n: number; last: string }[];
    clockSkewDevices: { serial: string | null; n: number; last: string }[];
    needsLocation: { serial: string; locSource: string | null; hcode: string | null }[];
    offline: { serial: string; lastSeenAt: string | null }[];
    badTimestampRows: number;
  } | null>(null);

  const hdr = useCallback(
    () => ({ "content-type": "application/json", "x-admin-secret": secret }),
    [secret],
  );

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/overview", { headers: { "x-admin-secret": secret } });
    if (!res.ok) {
      setMsg("인증 실패"); toast.ok("인증 실패");
      setAuthed(false);
      return;
    }
    const d = await res.json();
    setOv(d);
    setEconomicJson(JSON.stringify(d.config.economic, null, 2));
    setPayoutOpenAt(d.config.economic?.payoutOpenAt ?? null);
    setEconomicBase(d.config.economic ?? {});
    setAuthed(true);
    setMsg("");
    // 조용히 썩는 문제(등록 누락·시계 미동기·위치 미보정·오프라인)를 함께 점검
    fetch("/api/admin/health", { headers: { "x-admin-secret": secret } })
      .then((r) => (r.ok ? r.json() : null))
      .then(setHealth)
      .catch(() => {});
  }, [secret]);

  useEffect(() => {
    const saved = sessionStorage.getItem("kw_admin_secret");
    if (saved) setSecret(saved);
  }, []);

  const login = async () => {
    sessionStorage.setItem("kw_admin_secret", secret);
    await load();
  };

  const createDevices = async () => {
    const res = await fetch("/api/admin/devices", {
      method: "POST",
      headers: hdr(),
      body: JSON.stringify(batch),
    });
    const d = await res.json();
    if (!res.ok) return setMsg(d.error ?? "실패"); toast.err(d.error ?? "실패");
    setNewDevices(d.devices);
    setMsg(`${d.devices.length}대 생성 (batch: ${d.batchId}) - 코드·키는 지금만 표시됩니다`); toast.ok(`${d.devices.length}대 생성 (batch: ${d.batchId}) - 코드·키는 지금만 표시됩니다`);
    load();
  };

  const runSettle = async () => {
    setMsg("정산 실행 중…"); toast.ok("정산 실행 중…");
    const res = await fetch("/api/admin/settle", {
      method: "POST",
      headers: hdr(),
      body: JSON.stringify(settleDate ? { date: settleDate } : {}),
    });
    const d = await res.json();
    setMsg(res.ok ? `정산: ${d.epochDate} → ${d.status}` : d.error ?? "실패"); toast.err(res.ok ? `정산: ${d.epochDate} → ${d.status}` : d.error ?? "실패");
    load();
  };

  // AMM 유동성 회수 - 증발행 전에 반드시 먼저 해야 한다.
  // 공급량을 늘려도 풀 가격은 옛 비율로 남아, 그 틈으로 차익거래가 RLUSD 를 빼간다.
  const [amm, setAmm] = useState<Record<string, unknown> | null>(null);

  const loadAmm = async () => {
    setMsg("AMM 조회 중…"); toast.ok("AMM 조회 중…");
    const res = await fetch("/api/admin/amm", { headers: { "x-admin-secret": secret } });
    const d = await res.json();
    setAmm(d);
    setMsg(res.ok ? "AMM 조회 완료" : (d.error ?? "실패")); toast.err(res.ok ? "AMM 조회 완료" : (d.error ?? "실패"));
  };

  const withdrawAmm = async () => {
    if (!confirm("AMM 유동성을 전량 회수합니다. 풀이 삭제되고 WLBN·RLUSD 가 핫월렛으로 돌아옵니다. 진행할까요?")) return;
    setMsg("회수 요청 중…"); toast.ok("회수 요청 중…");
    const res = await fetch("/api/admin/amm", {
      method: "POST",
      headers: hdr(),
      body: JSON.stringify({ confirm: "WITHDRAW_ALL" }),
    });
    const d = await res.json();
    setMsg(res.ok ? `회수 큐 등록됨 (${d.queued}) - 1분 내 제출` : (d.error ?? "실패")); toast.err(res.ok ? `회수 큐 등록됨 (${d.queued}) - 1분 내 제출` : (d.error ?? "실패"));
    loadAmm();
  };

  // 스테이션 위치 - 목록 + 지도.
  const [locs, setLocs] = useState<{ nodes: (MapNode & Record<string, unknown>)[]; summary: Record<string, number> } | null>(null);
  const [locEdit, setLocEdit] = useState<{ serial: string; lat: string; lon: string }>({ serial: "", lat: "", lon: "" });
  const locRows = useMemo(() => locs?.nodes ?? [], [locs]);
  const locSort = useSort(locRows, LOC_SORT); const locPager = usePager(locSort.sorted);
  const [mapFallback, setMapFallback] = useState(false);

  const loadLocs = async () => {
    const res = await fetch("/api/admin/locations", { headers: { "x-admin-secret": secret } });
    const d = await res.json();
    if (res.ok) setLocs(d); else { setMsg(d.error ?? "실패"); toast.err(d.error ?? "실패"); }
  };

  const saveLoc = async () => {
    const lat = parseFloat(locEdit.lat), lon = parseFloat(locEdit.lon);
    if (!locEdit.serial || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      setMsg("시리얼과 좌표를 정확히 입력하세요"); toast.ok("시리얼과 좌표를 정확히 입력하세요"); return;
    }
    const res = await fetch("/api/admin/locations", {
      method: "PATCH", headers: hdr(),
      body: JSON.stringify({ serial: locEdit.serial, lat, lon }),
    });
    const d = await res.json();
    setMsg(res.ok ? `${d.serial} 좌표 저장 · ${d.area ?? "행정동 미확인"}` : (d.error ?? "실패")); toast.err(res.ok ? `${d.serial} 좌표 저장 · ${d.area ?? "행정동 미확인"}` : (d.error ?? "실패"));
    if (res.ok) { setLocEdit({ serial: "", lat: "", lon: "" }); loadLocs(); }
  };

  // 크론(10분)을 기다리지 않고 지금 IP 로 일괄 보정
  const backfillLoc = async () => {
    setMsg("IP 로 위치 보정 중…"); toast.ok("IP 로 위치 보정 중…");
    const res = await fetch("/api/admin/locations", { method: "POST", headers: hdr() });
    const d = await res.json();
    setMsg(res.ok ? `보정 완료 - 채움 ${d.filled} / 이동감지 ${d.moved} / 근거없음 ${d.skipped}` : "실패"); toast.ok(res.ok ? `보정 완료 - 채움 ${d.filled} / 이동감지 ${d.moved} / 근거없음 ${d.skipped}` : "실패");
    loadLocs();
  };

  const clearLoc = async (serial: string) => {
    if (!confirm(`${serial} 의 좌표를 지웁니다. 다음 조회 때 IP 로 다시 잡습니다.`)) return;
    const res = await fetch("/api/admin/locations", {
      method: "PATCH", headers: hdr(), body: JSON.stringify({ serial, clear: true }),
    });
    setMsg(res.ok ? `${serial} 좌표 초기화` : "실패"); toast.ok(res.ok ? `${serial} 좌표 초기화` : "실패");
    loadLocs();
  };

  // 케이웨더 실외 미세먼지 설정.
  // 키는 서버에만 두고 화면으로 돌려받지 않는다 - 관리자 화면을 여는 것만으로 새면 안 된다.
  const [od, setOd] = useState<Record<string, unknown> | null>(null);
  const [odForm, setOdForm] = useState({ apiKey: "", cacheMinutes: "10", enabled: false });
  const [odResult, setOdResult] = useState<unknown>(null);
  const odRows = useMemo(() => (Array.isArray(od?.readings) ? (od!.readings as Record<string, string | number | null>[]) : []), [od]);
  const odSort = useSort(odRows, OD_SORT); const odPager = usePager(odSort.sorted);

  const loadOd = async () => {
    const res = await fetch("/api/admin/outdoor", { headers: { "x-admin-secret": secret } });
    const d = await res.json();
    setOd(d);
    const c = d.config ?? {};
    setOdForm({ apiKey: "", cacheMinutes: String(c.cacheMinutes ?? 10), enabled: !!c.enabled });
    setMsg(res.ok ? "실외 설정 조회 완료" : (d.error ?? "실패")); toast.err(res.ok ? "실외 설정 조회 완료" : (d.error ?? "실패"));
  };

  const odPayload = () => ({
    enabled: odForm.enabled,
    ...(odForm.apiKey ? { apiKey: odForm.apiKey } : {}),
    cacheMinutes: parseInt(odForm.cacheMinutes, 10) || 10,
  });

  // 저장 전에 실제로 두 단계(좌표→행정동→미세먼지)를 다 불러본다.
  const testOd = async () => {
    setMsg("케이웨더 시험 호출 중…"); toast.ok("케이웨더 시험 호출 중…");
    const res = await fetch("/api/admin/outdoor?test=1", {
      method: "POST", headers: hdr(), body: JSON.stringify(odPayload()),
    });
    const d = await res.json();
    setOdResult(d);
    setMsg(d.ok ? "시험 성공" : `시험 실패 (${d.step ?? ""}): ${d.error ?? ""} ${d.hint ?? ""}`); toast.err(d.ok ? "시험 성공" : `시험 실패 (${d.step ?? ""}): ${d.error ?? ""} ${d.hint ?? ""}`);
  };

  const saveOd = async () => {
    const res = await fetch("/api/admin/outdoor", {
      method: "POST", headers: hdr(), body: JSON.stringify(odPayload()),
    });
    const d = await res.json();
    setMsg(res.ok ? "실외 설정 저장 완료" : (d.error ?? "실패")); toast.err(res.ok ? "실외 설정 저장 완료" : (d.error ?? "실패"));
    if (res.ok) { setOdForm((f) => ({ ...f, apiKey: "" })); loadOd(); }
  };

  // 크론(10분)을 기다리지 않고 지금 당겨온다.
  const pullOd = async () => {
    setMsg("케이웨더에서 당겨오는 중…"); toast.ok("케이웨더에서 당겨오는 중…");
    const res = await fetch("/api/admin/outdoor", { method: "PATCH", headers: hdr() });
    const d = await res.json();
    setOdResult(d);
    setMsg(res.ok ? `당겨오기 완료 - 성공 ${d.ok ?? 0} / 실패 ${d.failed ?? 0}` : "실패"); toast.err(res.ok ? `당겨오기 완료 - 성공 ${d.ok ?? 0} / 실패 ${d.failed ?? 0}` : "실패");
    loadOd();
  };

  // 기기가 이사갔을 때 행정동코드를 다시 찾게 한다.
  const resetHcode = async () => {
    if (!confirm("저장된 행정동코드를 모두 비웁니다. 다음 조회 때 좌표로 다시 찾습니다.")) return;
    const res = await fetch("/api/admin/outdoor", { method: "DELETE", headers: hdr() });
    const d = await res.json();
    setMsg(res.ok ? `행정동코드 ${d.cleared}건 초기화` : "실패"); toast.ok(res.ok ? `행정동코드 ${d.cleared}건 초기화` : "실패");
    loadOd();
  };

  const saveRevenue = async () => {
    const res = await fetch("/api/admin/config", {
      method: "POST",
      headers: hdr(),
      body: JSON.stringify({ revenue: { month: revenue.month, b2bRevenueRlusd: parseFloat(revenue.amount) } }),
    });
    setMsg(res.ok ? "매출 저장 완료" : "실패"); toast.ok(res.ok ? "매출 저장 완료" : "실패");
  };

  const loadNodes = async () => {
    const res = await fetch("/api/admin/nodes", { headers: { "x-admin-secret": secret } });
    const d = await res.json();
    if (res.ok) setNodes(d);
    else { setMsg(d.error ?? "스테이션 현황을 불러오지 못했습니다"); toast.err(d.error ?? "스테이션 현황을 불러오지 못했습니다"); }
  };

  const loadRewards = async () => {
    const res = await fetch("/api/admin/rewards", { headers: { "x-admin-secret": secret } });
    const d = await res.json();
    if (res.ok) setRw(d);
    else { setMsg(d.error ?? "보상 현황을 불러오지 못했습니다"); toast.err(d.error ?? "보상 현황을 불러오지 못했습니다"); }
  };

  /** 고액 클레임 승인·거절, 서명 전 취소 */
  const claimAction = async (claimId: string, action: "approve" | "reject" | "void") => {
    const label = { approve: "승인", reject: "거절", void: "취소" }[action];
    if (!confirm(`이 클레임을 ${label}할까요?`)) return;
    const res = await fetch("/api/admin/rewards", {
      method: "PATCH",
      headers: hdr(),
      body: JSON.stringify({ claimId, action }),
    });
    const d = await res.json();
    setMsg(d.ok ? `${label} 완료` : `실패: ${d.reason ?? d.error ?? ""}`); toast.err(d.ok ? `${label} 완료` : `실패: ${d.reason ?? d.error ?? ""}`);
    loadRewards();
  };

  /** 기기와 묶이지 않은 리딤코드 대량 발급 - 평문은 이 응답에서만 볼 수 있다 */
  const issueCodes = async () => {
    setIssued([]);
    const res = await fetch("/api/admin/codes/issue", {
      method: "POST",
      headers: hdr(),
      body: JSON.stringify(issue),
    });
    const d = await res.json();
    if (!res.ok) {
      setMsg(d.error ?? "발급 실패"); toast.err(d.error ?? "발급 실패");
      return;
    }
    setIssued(d.codes ?? []);
    setMsg(`${d.count}장 발급 · batch ${d.batchId} - 이 화면을 벗어나면 평문은 다시 볼 수 없습니다`); toast.ok(`${d.count}장 발급 · batch ${d.batchId} - 이 화면을 벗어나면 평문은 다시 볼 수 없습니다`);
  };

  const loadCodes = async (batch?: string) => {
    const q = batch ? `?batch=${encodeURIComponent(batch)}` : "";
    const res = await fetch(`/api/admin/codes${q}`, { headers: { "x-admin-secret": secret } });
    const d = await res.json();
    if (res.ok) setCodes(d.codes);
  };

  const revokeBatch = async (batchId: string) => {
    const res = await fetch("/api/admin/codes", {
      method: "POST",
      headers: hdr(),
      body: JSON.stringify({ batchId }),
    });
    const d = await res.json();
    setMsg(res.ok ? `배치 ${batchId}: 미사용 코드 ${d.revoked}건 무효화` : "실패"); toast.ok(res.ok ? `배치 ${batchId}: 미사용 코드 ${d.revoked}건 무효화` : "실패");
    loadCodes(codeBatch || undefined);
    load();
  };

  /**
   * 잘못된 계정으로 등록된 리딤코드 해제.
   *
   * 리딤한 순간부터 코드가 그 계정에 잠기므로(남이 자리를 차지하는 것을 막기 위해),
   * 사용자가 실수로 다른 계정에서 눌렀을 때 스스로 되돌릴 방법이 없다. 문의를 받으면
   * 여기서 풀어 준다. 되돌릴 수 없는 조작이라 한 번 더 묻는다.
   */
  const releaseCode = async (c: CodeRow) => {
    const lines = [
      `${c.serial} 의 리딤코드를 해제합니다.`,
      "",
      `현재 등록 계정: ${c.usedBy ? c.usedBy.slice(0, 12) + "…" : "(없음)"}`,
      "해제하면 이 코드로 다른 계정에서 다시 등록할 수 있습니다.",
      ...(c.nftState && c.nftState !== "CLAIMED" ? ["이미 발행된 NFT 의 옛 오퍼는 함께 취소됩니다."] : []),
      "",
      "되돌릴 수 없습니다. 진행할까요?",
    ];
    if (!confirm(lines.join("\n"))) return;
    const res = await fetch("/api/admin/codes", {
      method: "POST",
      headers: hdr(),
      body: JSON.stringify({ codeId: c.id, action: "release" }),
    });
    const d = await res.json();
    setMsg(res.ok
      ? `${d.serial ?? c.serial} 해제 완료${d.mintedKept ? " (발행된 NFT 는 유지, 옛 오퍼 취소)" : ""}`
      : (d.error ?? "해제 실패")); toast.err(res.ok
      ? `${d.serial ?? c.serial} 해제 완료${d.mintedKept ? " (발행된 NFT 는 유지, 옛 오퍼 취소)" : ""}`
      : (d.error ?? "해제 실패"));
    loadCodes(codeBatch || undefined);
    load();
  };

  /**
   * 출금 개시일 설정 · 해제.
   *
   * 값을 넣는 순간 온체인 지급이 열리므로, 다른 설정과 달리 한 번 더 묻는다.
   * 저장은 economic 전체를 덮어쓰지 않고 현재 값 위에 이 키만 얹는다 -
   * JSON 편집기에 손대던 중이어도 다른 파라미터가 날아가지 않는다.
   */
  const savePayoutOpen = async (value: string | null) => {
    if (value !== null) {
      const when = new Date(value);
      if (Number.isNaN(when.getTime())) { setMsg("날짜 형식이 올바르지 않습니다"); toast.ok("날짜 형식이 올바르지 않습니다"); return; }
      const opensNow = when.getTime() <= Date.now();
      const ok = confirm(
        `출금을 ${opensNow ? "지금 즉시" : when.toLocaleString()} 개시합니다.

개시 후에는 사용자가 적립 포인트를 온체인으로 인출할 수 있습니다.
계속할까요?`,
      );
      if (!ok) return;
    } else if (!confirm("출금을 다시 잠급니다. 계속할까요?")) {
      return;
    }
    const res = await fetch("/api/admin/config", {
      method: "POST",
      headers: hdr(),
      // saveConfig 는 economic 전체를 갈아끼운다 - 한 키만 보내면 나머지가 사라진다.
      body: JSON.stringify({ economic: { ...economicBase, payoutOpenAt: value } }),
    });
    setMsg(res.ok ? (value ? "출금 개시일 저장 완료" : "출금 잠금으로 되돌림") : "실패"); toast.ok(res.ok ? (value ? "출금 개시일 저장 완료" : "출금 잠금으로 되돌림") : "실패");
    load();
  };

  const saveEconomic = async () => {
    try {
      const parsed = JSON.parse(economicJson);
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: hdr(),
        body: JSON.stringify({ economic: parsed }),
      });
      setMsg(res.ok ? "경제 파라미터 저장 완료" : "실패"); toast.ok(res.ok ? "경제 파라미터 저장 완료" : "실패");
      load();
    } catch {
      setMsg("JSON 형식 오류"); toast.ok("JSON 형식 오류");
    }
  };

  if (!authed) {
    return (
      <div className="wb-page admin-page full-bleed">
      <div style={{ maxWidth: 380, margin: "80px auto 0" }}>
        <div className="section-header">
          <h1>
            관리자 <em>콘솔</em>
          </h1>
        </div>
        <label className="field-label">ADMIN SECRET</label>
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          className="field-input"
          onKeyDown={(e) => e.key === "Enter" && login()}
        />
        <button onClick={login} className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 12 }}>
          접속
        </button>
        {msg && <div className="note warn" style={{ marginTop: 12 }}>{msg}</div>}
      </div>
      </div>
    );
  }

  return (
    <div className="wb-page admin-page full-bleed">
      <div className="section-header">
        <h1>
          관리자 <em>콘솔</em>
        </h1>
        <div className="section-coord">
          <div>OPERATIONS CONSOLE</div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginTop: 4 }}>
            <button onClick={load} className="badge cyan" style={{ cursor: "pointer" }}>
              ↻ REFRESH
            </button>
            {/* 실제 구매 흐름을 미리 눌러 보는 곳 - 카드는 토스 테스트 키라 출금이 없다 */}
            <a href={`${SITE}/launch/test`} target="_blank" rel="noopener noreferrer" className="badge"
               title="실제 판매와 같은 화면 · 주문과 예매권은 테스트 장부 · 카드 결제는 출금 없음">
              판매 리허설 ↗
            </a>
            <a href={`${SITE}/my?mode=test`} target="_blank" rel="noopener noreferrer" className="badge"
               title="리허설로 만든 주문·예매권 확인">
              리허설 결과 ↗
            </a>
            {/* 오픈 전 페이지를 볼 수 있는 임시 링크 - 관리자 키는 주소에 들어가지 않는다 */}
            <button onClick={makePreviewLink} className="badge" style={{ cursor: "pointer" }}
                    title="익스플로러·DeFi·데이터 마켓·스폰서를 미리 보는 링크를 만들어 복사합니다 (24시간)">
              미리보기 링크 복사
            </button>
          </div>
        </div>
      </div>
      {msg && <div className="note" style={{ marginBottom: 24 }}>{msg}</div>}
      {previewMsg && (
        <div className="note" style={{ marginBottom: 24 }}>
          {previewMsg}
          <div className="dim" style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.6 }}>
            링크를 연 브라우저에서만 풀립니다. 오픈 전 페이지는 익스플로러(/network) · DeFi(/defi) · 데이터 마켓(/data) · 스폰서(/sponsor) 입니다.
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 4, marginBottom: 24, flexWrap: "wrap" }}>
        {(["개요", "스테이션 현황", "기기·코드", "NFT", "토큰", "보상·클레임", "정산", "주문·배송", "프로모션", "어필리에이트", "연동 설정", "블라인드 추첨", "래플", "시스템·용량", "회원"] as const).map((name) => (
          <button
            key={name}
            onClick={() => {
              setTab(name);
              if (name === "기기·코드") loadCodes(codeBatch || undefined);
              if (name === "스테이션 현황") loadNodes();
              if (name === "보상·클레임") loadRewards();
            }}
            className={`admin-tab ${tab === name ? "active" : ""}`}
          >
            {name}
          </button>
        ))}
      </div>

      {tab === "개요" && ov && (
        <div className="stats-grid">
          <div className="stat-cell span-3">
            <div className="stat-cell-k"><span>DEVICES</span></div>
            <div className="stat-cell-v">{ov.devices.total}</div>
            <div className="stat-cell-delta dim">운영자 {ov.devices.operators}명</div>
          </div>
          <div className="stat-cell span-3">
            <div className="stat-cell-k"><span>ACTIVE NODES</span></div>
            <div className="stat-cell-v cyan">{ov.devices.active}</div>
            <div className="stat-cell-delta">24H 전송 {ov.devices.online24h}대</div>
          </div>
          <div className="stat-cell span-3">
            <div className="stat-cell-k"><span>OUTBOX OPEN</span></div>
            <div className="stat-cell-v">{ov.outboxOpen}</div>
          </div>
          <div className="stat-cell span-3">
            <div className="stat-cell-k"><span>CLAIMABLE SUM</span></div>
            <div className="stat-cell-v" style={{ fontSize: 24 }}>
              {(ov.accruals.find((a) => a.status === "CLAIMABLE")?.sum ?? 0).toFixed(2)}
              <span className="u">WLBN</span>
            </div>
          </div>
        </div>
      )}

      {tab === "개요" && health && (
        <div className="feed-wrap" style={{ marginTop: 20 }}>
          <div className="feed-head">
            <span className="feed-head-title">기기 헬스 점검</span>
            <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>최근 24시간 · 새로고침 시 재점검</span>
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {health.unregisteredSerials.length > 0 && (
              <div className="note warn">
                <b>서버 미등록 시리얼이 측정값을 보내는 중</b> - 공장 등록기의 &quot;서버에 등록&quot; 단계가 누락된 기기입니다. 등록 전까지 데이터는 버려집니다.
                <div className="mono" style={{ fontSize: 12, marginTop: 6 }}>
                  {health.unregisteredSerials.map((u) => `${u.serial} (${u.n}건)`).join(" · ")}
                </div>
              </div>
            )}
            {health.clockSkewDevices.length > 0 && (
              <div className="note warn">
                <b>시계 미동기 기기 (서버가 시각 보정 중)</b> - RTC/NTP 동기화 실패. 데이터는 서버 시각으로 보정 저장되지만 기기 재부팅·펌웨어 점검을 권장합니다.
                <div className="mono" style={{ fontSize: 12, marginTop: 6 }}>
                  {health.clockSkewDevices.map((u) => `${u.serial ?? "?"} (${u.n}건)`).join(" · ")}
                </div>
              </div>
            )}
            {health.needsLocation.length > 0 && (
              <div className="note">
                <b>주소 보정 필요</b> - 위치가 IP 추정이거나 없습니다. 스테이션 현황 탭에서 좌표를 직접 지정하세요.
                <div className="mono" style={{ fontSize: 12, marginTop: 6 }}>
                  {health.needsLocation.map((u) => `${u.serial}${u.locSource === "ip" ? "(IP추정)" : "(미설정)"}`).join(" · ")}
                </div>
              </div>
            )}
            {health.offline.length > 0 && (
              <div className="note">
                <b>30분 이상 무응답 (ACTIVE 기기)</b>
                <div className="mono" style={{ fontSize: 12, marginTop: 6 }}>
                  {health.offline.map((u) => u.serial).join(" · ")}
                </div>
              </div>
            )}
            {health.badTimestampRows > 0 && (
              <div className="note warn">
                <b>시각 이상 원시 데이터 {health.badTimestampRows}건 잔존</b> - 2026년 이전 또는 미래 시각. 보정 배포 이후에는 0이어야 정상입니다.
              </div>
            )}
            {health.unregisteredSerials.length === 0 && health.clockSkewDevices.length === 0 &&
              health.needsLocation.length === 0 && health.offline.length === 0 && health.badTimestampRows === 0 && (
              <div className="note ok"><b>이상 없음</b> - 등록·시계·위치·수신 모두 정상입니다.</div>
            )}
          </div>
        </div>
      )}

      {tab === "스테이션 현황" && (
        <div className="feed-wrap" style={{ marginBottom: 20 }}>
          <div className="feed-head">
            <span className="feed-head-title">스테이션 위치</span>
            <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {locs && (
                <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                  정확 {locs.summary.exact} · IP추정 {locs.summary.byIp} · 미확인 {locs.summary.total - locs.summary.located}
                </span>
              )}
              <button onClick={loadLocs} className="btn-ghost" style={{ padding: "8px 14px" }}>불러오기</button>
              <button onClick={backfillLoc} className="btn-primary" style={{ padding: "8px 14px" }}>IP로 자동 보정</button>
            </span>
          </div>

          {locs && (mapFallback
            ? <NodeGlobe nodes={locs.nodes} />
            : <NodeMapbox nodes={locs.nodes} onUnavailable={() => setMapFallback(true)} />)}

          {locs && (
            <>
              <div className="row" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", margin: "14px 0" }}>
                <div style={{ minWidth: 150 }}>
                  <label className="field-label">시리얼</label>
                  <input className="field-input" placeholder="IARAW2600127"
                    value={locEdit.serial} onChange={(e) => setLocEdit({ ...locEdit, serial: e.target.value.toUpperCase() })} />
                </div>
                <div style={{ width: 130 }}>
                  <label className="field-label">위도</label>
                  <input className="field-input" placeholder="37.4814"
                    value={locEdit.lat} onChange={(e) => setLocEdit({ ...locEdit, lat: e.target.value })} />
                </div>
                <div style={{ width: 130 }}>
                  <label className="field-label">경도</label>
                  <input className="field-input" placeholder="126.8930"
                    value={locEdit.lon} onChange={(e) => setLocEdit({ ...locEdit, lon: e.target.value })} />
                </div>
                <button onClick={saveLoc} className="btn-primary" style={{ padding: "10px 16px" }}>좌표 지정</button>
              </div>
              <p style={{ fontSize: 12.5, color: "var(--ink-dim)", lineHeight: 1.6, margin: "0 0 12px" }}>
                좌표를 지정하면 행정동을 다시 조회해 실외 미세먼지 기준점이 바뀝니다.
                <b> IP 추정은 시군구 수준이라 실제와 수 km 어긋날 수 있습니다</b> - 설치 위치를 아시면 직접 넣어 주세요.
                자동 보정은 <b>기기가 측정값을 올린 IP</b>를 기준으로 하며, 10분마다 도는 크론이 같은 일을 합니다.
                기기가 다른 IP 로 옮겨가면 다시 잡습니다(관리자가 지정한 좌표는 그대로 둡니다).
              </p>

              <div className="feed-table-scroll">
                <table className="feed-table compact">
                  <thead>
                    <tr>
                      {([["serial","시리얼"],["status","상태"],["lat","위도"],["lon","경도"],["src","출처"],["ip","기준 IP"],["area","행정동"]] as [string, string][]).map(([k, label]) => (
                        <SortTh key={k} k={k} sortKey={locSort.sortKey} dir={locSort.dir} onToggle={locSort.toggle}>{label}</SortTh>
                      ))}
                      <th style={{ textAlign: "right" }} />
                    </tr>
                  </thead>
                  <tbody>
                    {locPager.slice.map((n) => (
                      <tr key={n.serial}>
                        <td className="mono">{n.serial}</td>
                        <td className="dim">{n.status}</td>
                        <td>{n.lat === null ? "-" : n.lat.toFixed(5)}</td>
                        <td>{n.lon === null ? "-" : n.lon.toFixed(5)}</td>
                        <td style={{ color: n.locSource === "ip" ? "var(--amber, #d6a548)" : undefined }}>
                          {n.locSource === "ip" ? "IP 추정" : n.locSource === "manual" ? "관리자" : n.locSource === "user" ? "사용자" : "-"}
                        </td>
                        <td className="mono dim" style={{ fontSize: 11 }}>{(n.locIp as string) ?? "-"}</td>
                        <td className="dim">{n.area ?? "-"}</td>
                        <td style={{ textAlign: "right" }}>
                          {n.lat !== null && (
                            <button onClick={() => clearLoc(n.serial)} className="btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }}>초기화</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pager p={locPager} unit="대" />
            </>
          )}
        </div>
      )}

      {tab === "스테이션 현황" && nodes && (<>
        <div className="stats-grid">
          {([
            ["전체 스테이션", nodes.summary.total],
            ["수집 중", nodes.summary.online],
            ["지갑 연결", nodes.summary.linked],
            ["NFT 보유", nodes.summary.licensed],
            ["수락 대기", nodes.summary.awaitingAccept],
            ["오늘 측정", nodes.summary.todayReadings],
          ] as const).map(([k, v]) => (
            <div key={k} className="stat-cell span-2">
              <div className="stat-cell-k"><span>{k}</span></div>
              <div className="stat-cell-v">{v.toLocaleString()}</div>
            </div>
          ))}
        </div>
        <div className="feed-wrap" style={{ marginBottom: 24 }}>
          <div className="feed-head">
            <span className="feed-head-title">스테이션별 실측</span>
            <button onClick={loadNodes} className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>새로고침</button>
          </div>
          <div className="feed-table-scroll">
            <table className="feed-table compact">
              <thead>
                <tr>
                  {([["status","상태"],["serial","시리얼"],["kind","종류"],["nft","NFT"],["wallet","지갑"],["last","최근"],["today","오늘"],
                     ["pm10","PM10"],["pm25","PM2.5"],["co2","CO₂"],["tvoc","VOC"],["temp","온도"]] as [string, string][]).map(([k, label]) => (
                    <SortTh key={k} k={k} sortKey={nodeSort.sortKey} dir={nodeSort.dir} onToggle={nodeSort.toggle}>{label}</SortTh>
                  ))}
                  <SortTh k="humidity" align="right" sortKey={nodeSort.sortKey} dir={nodeSort.dir} onToggle={nodeSort.toggle}>습도</SortTh>
                </tr>
              </thead>
              <tbody>
                {nodePager.slice.map((n) => (
                  <tr key={n.deviceId}>
                    <td className={n.online ? "ok" : "dim"}>{n.online ? "● 수집" : "○ 없음"}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {n.serial}
                      {/* 배지를 붙여 쓰면 "KWI…406가상" 처럼 시리얼의 일부로 읽힌다 */}
                      {n.isVirtual && <span className="badge" style={{ marginLeft: 8 }}>가상</span>}
                      {n.feed === "kweather" && <span className="badge cyan" style={{ marginLeft: 8 }} title="케이웨더 Air365 IoT 파트너 피드 (10분 주기)">케이웨더</span>}
                    </td>
                    <td className="dim">{n.taxon}·{n.tier}</td>
                    <td className={n.nftState === "CLAIMED" ? "ok" : n.nftState ? "warn" : "dim"}>
                      {n.nftState === "CLAIMED" ? "보유" : n.nftState === "OFFER_CREATED" ? "대기" : n.nftState ?? "–"}
                    </td>
                    <td className="dim">{n.wallet ? n.wallet.slice(0, 6) + "…" + n.wallet.slice(-4) : "–"}</td>
                    <td className="dim">
                      {n.ageMinutes === null ? "–"
                        /* 기기 시계가 서버보다 앞서면 음수가 나온다. "-1분 전"은 뜻이 없으니 방금으로 본다. */
                        : n.ageMinutes <= 0 ? "방금"
                        : n.ageMinutes < 60 ? `${n.ageMinutes}분 전`
                        : n.lastTs ? new Date(n.lastTs).toLocaleString(undefined, { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "–"}
                    </td>
                    <td>{n.todayCount.toLocaleString()}</td>
                    <td className="num">{n.pm10 ?? "–"}</td>
                    <td className="num">{n.pm25 ?? "–"}</td>
                    <td className="num">{n.co2 ?? "–"}</td>
                    <td className="num">{n.tvoc ?? "–"}</td>
                    <td className="num">{n.temp ?? "–"}</td>
                    <td style={{ textAlign: "right" }}>{n.humidity ?? "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager p={nodePager} unit="대" />
        </div>
      </>)}

      {tab === "보상·클레임" && rw && (<>
        <div className="stats-grid">
          <div className="stat-cell span-3 feature">
            <div className="stat-cell-k"><span>인출 가능</span><span style={{ color: "var(--amber)" }}>WLBN</span></div>
            <div className="stat-cell-v cyan">{rw.claimableNow.amount.toFixed(4)}</div>
            <div className="stat-cell-delta dim">{rw.claimableNow.count}건</div>
          </div>
          <div className="stat-cell span-3">
            <div className="stat-cell-k"><span>보류 중</span></div>
            <div className="stat-cell-v">{rw.holding.amount.toFixed(4)}</div>
            <div className="stat-cell-delta dim">{rw.holding.count}건 · 홀드 {rw.holdHours}시간</div>
          </div>
          {rw.byStatus.filter((b) => b.status === "CLAIMED" || b.status === "PENDING").map((b) => (
            <div key={b.status} className="stat-cell span-3">
              <div className="stat-cell-k"><span>{b.status}</span></div>
              <div className="stat-cell-v">{b.amount.toFixed(4)}</div>
              <div className="stat-cell-delta dim">{b.count}건</div>
            </div>
          ))}
        </div>

        <div className="feed-wrap" style={{ marginBottom: 24 }}>
          <div className="feed-head">
            <span className="feed-head-title">지갑별 미인출 잔액</span>
            <button onClick={loadRewards} className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>새로고침</button>
          </div>
          <div className="feed-table-scroll">
            <table className="feed-table compact">
              <thead><tr>
                {([["wallet","지갑"],["count","건수"]] as [string, string][]).map(([k, label]) => (
                  <SortTh key={k} k={k} sortKey={walletSort.sortKey} dir={walletSort.dir} onToggle={walletSort.toggle}>{label}</SortTh>
                ))}
                <SortTh k="amount" align="right" sortKey={walletSort.sortKey} dir={walletSort.dir} onToggle={walletSort.toggle}>금액</SortTh>
              </tr></thead>
              <tbody>
                {walletPager.total === 0 ? (
                  <tr><td colSpan={3} className="dim">없음</td></tr>
                ) : walletPager.slice.map((w) => (
                  <tr key={w.wallet}>
                    <td className="mono">{w.wallet}</td>
                    <td>{w.count}</td>
                    <td style={{ textAlign: "right" }}>{w.amount.toFixed(6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager p={walletPager} />
        </div>

        <div className="feed-wrap" style={{ marginBottom: 24 }}>
          <div className="feed-head"><span className="feed-head-title">클레임 내역</span></div>
          <div className="feed-table-scroll">
            <table className="feed-table compact">
              <thead><tr>
                {([["at","일시"],["wallet","지갑"],["amount","금액"],["status","상태"],["tx","tx"]] as [string, string][]).map(([k, label]) => (
                  <SortTh key={k} k={k} sortKey={claimSort.sortKey} dir={claimSort.dir} onToggle={claimSort.toggle}>{label}</SortTh>
                ))}
                <th style={{ textAlign: "right" }}>조치</th>
              </tr></thead>
              <tbody>
                {claimPager.total === 0 ? (
                  <tr><td colSpan={6} className="dim">없음</td></tr>
                ) : claimPager.slice.map((c) => (
                  <tr key={c.id}>
                    <td className="dim">{new Date(c.createdAt + (c.createdAt.endsWith("Z") ? "" : "Z")).toLocaleString(undefined, { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="mono">{c.wallet.slice(0, 6)}…{c.wallet.slice(-4)}</td>
                    <td>{c.amount.toFixed(4)}</td>
                    <td className={c.status === "CONFIRMED" ? "ok" : c.status === "FAILED" || c.status === "VOID" ? "bad" : "warn"}>{c.status}</td>
                    <td className="dim">{c.txHash ? c.txHash.slice(0, 10) + "…" : c.resultCode ?? "–"}</td>
                    <td style={{ textAlign: "right" }}>
                      {c.status === "INITIATED" ? (
                        <span style={{ display: "inline-flex", gap: 4 }}>
                          <button onClick={() => claimAction(c.id, "approve")} className="btn-ghost" style={{ padding: "4px 9px", fontSize: 11 }}>승인</button>
                          <button onClick={() => claimAction(c.id, "reject")} className="btn-ghost" style={{ padding: "4px 9px", fontSize: 11 }}>거절</button>
                        </span>
                      ) : "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager p={claimPager} />
        </div>
      </>)}

      {tab === "기기·코드" && (<>
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header"><span>리딤코드 발급 (카드 인쇄용)</span></div>
        <p style={{ fontSize: 12.5, color: "var(--ink-dim)", margin: "0 0 12px", lineHeight: 1.6 }}>
          기기와 묶지 않은 코드를 만듭니다. 카드와 측정기는 따로 배송되고,
          사용자가 <b>코드 + 시리얼</b>을 입력할 때 결합됩니다.
          평문 코드는 <b>발급 직후 이 화면에서만</b> 볼 수 있습니다.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end" }}>
          <div>
            <label className="field-label">장수</label>
            <input
              type="number" min={1} max={1000} className="field-input" style={{ width: 110 }}
              value={issue.count}
              onChange={(e) => setIssue({ ...issue, count: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="field-label">유효기간(일)</label>
            <input
              type="number" min={1} max={3650} className="field-input" style={{ width: 130 }}
              value={issue.expiresInDays}
              onChange={(e) => setIssue({ ...issue, expiresInDays: Number(e.target.value) })}
            />
          </div>
          <button onClick={issueCodes} className="btn-primary" style={{ padding: "10px 18px" }}>발급</button>
        </div>
        {issued.length > 0 && (
          <>
            <p className="field-label" style={{ marginTop: 16 }}>
              발급된 코드 {issued.length}장 - 복사해서 카드 생성기에 붙여넣으세요
            </p>
            <textarea
              readOnly
              value={issued.join("\n")}
              onFocus={(e) => e.currentTarget.select()}
              style={{
                width: "100%", height: 150, fontFamily: "var(--mono)", fontSize: 12.5,
                padding: 10, border: "1px solid var(--line-2)", background: "var(--bg-2)", color: "var(--ink)",
              }}
            />
            <p style={{ fontSize: 12, color: "var(--red)", marginTop: 6 }}>
              ⚠ 이 화면을 벗어나면 평문 코드는 다시 볼 수 없습니다 (DB에는 해시만 저장).
            </p>
          </>
        )}
      </div>

      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header"><span>DEVICE BATCH PROVISION</span></div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end" }}>
          <div>
            <label className="field-label">COUNT</label>
            <input
              type="number"
              value={batch.count}
              onChange={(e) => setBatch({ ...batch, count: parseInt(e.target.value) || 1 })}
              className="field-input"
              style={{ width: 90 }}
            />
          </div>
          <div>
            <label className="field-label">NETWORK</label>
            <select
              value={batch.taxon}
              onChange={(e) => setBatch({ ...batch, taxon: e.target.value })}
              className="field-select"
              style={{ width: 160 }}
            >
              <option value="IAQ">IAQ 실내 (3026)</option>
              <option value="OAQ">OAQ 실외 (2026)</option>
            </select>
          </div>
          <div>
            <label className="field-label">TIER</label>
            <select
              value={batch.tier}
              onChange={(e) => setBatch({ ...batch, tier: e.target.value })}
              className="field-select"
              style={{ width: 130 }}
            >
              <option>LITE</option>
              <option>STANDARD</option>
              <option>PRO</option>
            </select>
          </div>
          <div>
            <label className="field-label">GEOHASH5</label>
            <input
              value={batch.geohash5}
              onChange={(e) => setBatch({ ...batch, geohash5: e.target.value })}
              className="field-input"
              style={{ width: 110 }}
            />
          </div>
          <label className="badge" style={{ cursor: "pointer", padding: "10px 12px" }}>
            <input
              type="checkbox"
              checked={batch.isVirtual}
              onChange={(e) => setBatch({ ...batch, isVirtual: e.target.checked })}
            />
            VIRTUAL
          </label>
          <button onClick={createDevices} className="btn-primary">생성</button>
        </div>
        {newDevices.length > 0 && (
          <pre className="mono" style={{ marginTop: 16, overflowX: "auto", background: "var(--bg)", border: "1px solid var(--line)", padding: 14, fontSize: 12, color: "var(--green)" }}>
            {JSON.stringify(newDevices, null, 2)}
          </pre>
        )}
      </div>

      <div className="feed-wrap">
        <div className="feed-head">
          <span className="feed-head-title">REDEEM CODES</span>
          <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {ov && Object.entries(ov.codeStates).map(([s, n]) => (
              <span key={s} className={`badge ${s === "UNUSED" ? "cyan" : s === "USED" ? "green" : ""}`}>{s} {n}</span>
            ))}
            <select
              value={codeBatch}
              onChange={(e) => {
                setCodeBatch(e.target.value);
                loadCodes(e.target.value || undefined);
              }}
              className="field-select"
              style={{ width: 180, padding: "6px 10px", fontSize: 12 }}
            >
              <option value="">전체 배치</option>
              {ov?.batches.map((b) => (
                <option key={b.batchId} value={b.batchId}>{b.batchId} ({b.count})</option>
              ))}
            </select>
            {codeBatch && (
              <button onClick={() => revokeBatch(codeBatch)} className="btn-ghost btn-danger" style={{ padding: "7px 12px", fontSize: 11 }}>
                미사용 코드 무효화
              </button>
            )}
          </span>
        </div>
        <div className="feed-table-scroll">
          <table className="feed-table compact">
            <thead>
              <tr>
                {([["serial","SERIAL"],["batch","BATCH"],["taxon","TAXON"],["tier","TIER"],["code","CODE"],["nft","NFT"]] as [string, string][]).map(([k, label]) => (
                  <SortTh key={k} k={k} sortKey={codeSort.sortKey} dir={codeSort.dir} onToggle={codeSort.toggle}>{label}</SortTh>
                ))}
                <SortTh k="usedBy" align="right" sortKey={codeSort.sortKey} dir={codeSort.dir} onToggle={codeSort.toggle}>USED BY</SortTh>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {codePager.slice.map((c) => (
                <tr key={c.id}>
                  <td className="id">{c.serial}</td>
                  <td className="dim">{c.batchId}</td>
                  <td>{c.taxon}</td>
                  <td>{c.tier}</td>
                  <td className={c.status === "USED" ? "ok" : c.status === "REVOKED" ? "bad" : "warn"}>{c.status}</td>
                  <td className={c.nftState === "CLAIMED" ? "ok" : "dim"}>{c.nftState ?? "-"}</td>
                  <td className="dim" style={{ textAlign: "right" }}>{c.usedBy ? c.usedBy.slice(0, 10) + "…" : "-"}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    {/* 아직 계정에 잠겨 있는 건만 풀 수 있다. 수락이 끝난 건은 소유권이
                        온체인으로 넘어가 서버가 되돌릴 수 없다. */}
                    {c.status !== "REVOKED" && c.nftState !== "CLAIMED" && (c.usedBy || c.status === "LOCKED" || c.status === "USED") ? (
                      <button
                        onClick={() => releaseCode(c)}
                        className="btn-ghost btn-danger"
                        style={{ padding: "4px 8px", fontSize: 10.5 }}
                        title="잘못된 계정으로 등록된 경우 코드를 풀어 다른 계정에서 다시 등록할 수 있게 합니다"
                      >
                        해제
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
              {codes.length === 0 && (
                <tr><td colSpan={8} className="dim" style={{ textAlign: "center", padding: 20 }}>코드가 없습니다</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pager p={codePager} />
      </div>
      </>)}

      {tab === "NFT" && ov && (
        <div className="stats-grid">
          {["MINT_QUEUED", "MINTED", "OFFER_CREATED", "CLAIMED", "MINT_FAILED", "BURNED"].map((s) => (
            <div key={s} className="stat-cell span-4">
              <div className="stat-cell-k"><span>{s}</span></div>
              <div className={`stat-cell-v ${s === "CLAIMED" ? "cyan" : ""}`}>{ov.nftStates[s] ?? 0}</div>
              <div className="stat-cell-delta dim">
                {s === "CLAIMED" ? "사용자 지갑 보유" : s === "OFFER_CREATED" ? "수령 대기" : s === "MINT_FAILED" ? "재시도 필요" : ""}
              </div>
            </div>
          ))}
          <div className="stat-cell span-12 feature">
            <div className="stat-cell-k"><span>NOTE</span></div>
            <p style={{ fontSize: 14, color: "var(--ink-dim)", lineHeight: 1.7 }}>
              라이선스 NFT는 리딤 시 자동 민팅됩니다. OFFER_CREATED 상태는 사용자가 아직 수령 서명을 하지 않은 것으로,
              1-drop 폴백으로 등록된 경우 admin 설정 <code className="mono">economic.allowPendingOffer=true</code>로 보상 적립을 허용할 수 있습니다.
              MINT_FAILED는 해당 기기에서 리딤 재시도 시 자동 재큐잉됩니다.
            </p>
          </div>
        </div>
      )}

      {tab === "토큰" && (
        <div className="stats-grid">
          <div className="stat-cell span-4">
            <div className="stat-cell-k"><span>총 발행량 (ISSUED)</span></div>
            <div className="stat-cell-v">{ov?.token ? ov.token.issued.toLocaleString() : "-"}<span className="u">WLBN</span></div>
            <div className="stat-cell-delta dim">온체인 gateway_balances 실시간</div>
          </div>
          <div className="stat-cell span-4">
            <div className="stat-cell-k"><span>트레저리 (HOT)</span></div>
            <div className="stat-cell-v">{ov?.token ? ov.token.hot.toLocaleString() : "-"}<span className="u">WLBN</span></div>
            <div className="stat-cell-delta dim">보상 지급 재원</div>
          </div>
          <div className="stat-cell span-4">
            <div className="stat-cell-k"><span>유통량 (CIRCULATING)</span></div>
            <div className="stat-cell-v cyan">{ov?.token ? ov.token.circulating.toLocaleString(undefined, { maximumFractionDigits: 4 }) : "-"}<span className="u">WLBN</span></div>
            <div className="stat-cell-delta">발행량 − 트레저리</div>
          </div>
          {ov?.accruals.map((a) => (
            <div key={a.status} className="stat-cell span-3">
              <div className="stat-cell-k"><span>{a.status}</span></div>
              <div className="stat-cell-v" style={{ fontSize: 22 }}>{a.sum.toFixed(2)}</div>
              <div className="stat-cell-delta dim">{a.count}건</div>
            </div>
          ))}
          <div className="stat-cell span-12 feature">
            <div className="stat-cell-k">
              <span>AMM 유동성</span>
              <span style={{ display: "flex", gap: 8 }}>
                <button onClick={loadAmm} className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>풀 조회</button>
                <button onClick={withdrawAmm} className="btn-primary" style={{ padding: "6px 12px", fontSize: 12 }}>전량 회수</button>
              </span>
            </div>
            <p style={{ fontSize: 14, color: "var(--ink-dim)", lineHeight: 1.7 }}>
              발행량을 늘리기 전에 <b style={{ color: "var(--ink)" }}>반드시 먼저 회수</b>하세요. 공급량이 늘어도
              풀 가격은 옛 비율로 남아, 그 틈으로 차익거래가 풀의 RLUSD 를 빼갑니다. 회수하면 풀이 삭제되고
              WLBN·RLUSD 가 핫월렛으로 돌아옵니다.
            </p>
            {amm && (
              <pre
                className="mono"
                style={{
                  fontSize: 11.5, lineHeight: 1.6, margin: 0, padding: 12,
                  background: "var(--bg-2)", border: "1px solid var(--line-2)",
                  overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all",
                }}
              >
                {JSON.stringify(amm, null, 2)}
              </pre>
            )}
          </div>

          <div className="stat-cell span-12 feature">
            <div className="stat-cell-k"><span>발행 · 소각 관리</span></div>
            <p style={{ fontSize: 14, color: "var(--ink-dim)", lineHeight: 1.7 }}>
              <b style={{ color: "var(--ink)" }}>추가 발행</b>: Issuer 콜드 시드로만 가능합니다 (서버 미보관 - 오프라인 보관 중).
              발행: Issuer→Hot으로 WLBN Payment 1건. <b style={{ color: "var(--ink)" }}>소각</b>: 임의 지갑에서 Issuer 주소
              (<code className="mono">rDJz8WJhsKgydqJzSZXMpsJot3eRmSkR5</code>)로 WLBN을 보내면 발행량(채무)이 자동 감소합니다 -
              파생 서비스 수익 50% 소각도 이 방식입니다. 모든 수치는 위 온체인 발행량에 즉시 반영됩니다.
            </p>
          </div>
        </div>
      )}

      {tab === "주문·배송" && <OrdersPanel secret={secret} />}
      {tab === "연동 설정" && <IntegrationsPanel secret={secret} />}
      {tab === "프로모션" && <PromoPanel secret={secret} />}
      {tab === "어필리에이트" && <AffiliatePanel secret={secret} />}
      {tab === "블라인드 추첨" && <BlindDrawPanel secret={secret} />}
      {tab === "래플" && <RafflePanel secret={secret} />}
      {tab === "시스템·용량" && <SystemPanel secret={secret} />}
      {tab === "회원" && <MembersPanel secret={secret} />}

      {tab === "정산" && (<>
      <div className="feed-wrap">
        <div className="feed-head">
          <span className="feed-head-title">EPOCH SETTLEMENT</span>
          <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              value={settleDate}
              onChange={(e) => setSettleDate(e.target.value)}
              placeholder="YYYY-MM-DD (빈칸=어제)"
              className="field-input"
              style={{ width: 190, padding: "6px 10px", fontSize: 12 }}
            />
            <button onClick={runSettle} className="btn-primary" style={{ padding: "8px 14px" }}>수동 정산</button>
          </span>
        </div>
        <div className="feed-table-scroll">
          <table className="feed-table compact">
            <thead>
              <tr>
                {([["date","DATE"],["status","STATUS"],["budget","BUDGET"],["nodes","NODES"],["unalloc","UNALLOCATED"]] as [string, string][]).map(([k, label]) => (
                  <SortTh key={k} k={k} sortKey={epochSort.sortKey} dir={epochSort.dir} onToggle={epochSort.toggle}>{label}</SortTh>
                ))}
                <SortTh k="error" align="right" sortKey={epochSort.sortKey} dir={epochSort.dir} onToggle={epochSort.toggle}>ERROR</SortTh>
              </tr>
            </thead>
            <tbody>
              {epochPager.slice.map((e) => (
                <tr key={e.date}>
                  <td className="dim">{e.date}</td>
                  <td className={e.status === "COMPLETED" ? "ok" : e.status === "FAILED" ? "bad" : "warn"}>{e.status}</td>
                  <td>{e.budget?.toFixed(2) ?? "-"}</td>
                  <td>{e.eligibleNodes ?? "-"}</td>
                  <td>{e.unallocated?.toFixed(2) ?? "-"}</td>
                  <td className="bad" style={{ textAlign: "right" }}>{e.error ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager p={epochPager} unit="일" />
      </div>

      {/* 재단 최상위 정책 - 그리드에 넣으면 옆 패널(실외 미세먼지 표)이 눌린다. 전체 폭으로 둔다. */}
      <div className="panel">
        <div className="panel-header"><span>출금 개시 · 재단 정책</span></div>
        <div style={{ padding: "4px 0 10px", fontSize: 13, lineHeight: 1.7 }}>
          {payoutOpenAt === null ? (
            <div><b style={{ color: "var(--amber)" }}>잠금 중</b> · 개시일 미정 — 온체인 지급이 발생하지 않습니다.</div>
          ) : new Date(payoutOpenAt).getTime() <= Date.now() ? (
            <div><b style={{ color: "var(--green)" }}>개시됨</b> · {new Date(payoutOpenAt).toLocaleString()} 부터 인출 가능</div>
          ) : (
            <div><b style={{ color: "var(--cyan)" }}>개시 예정</b> · {new Date(payoutOpenAt).toLocaleString()}</div>
          )}
          <div style={{ color: "var(--ink-faint)", marginTop: 4 }}>
            DEX 상장 전까지 적립은 사이트 계정 안의 포인트로만 존재합니다. 날짜를 넣으면 그 시각부터 인출이 열립니다.
          </div>
        </div>
        <div className="row" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="datetime-local"
            value={payoutDraft}
            onChange={(e) => setPayoutDraft(e.target.value)}
            className="field"
            style={{ width: 210 }}
          />
          <button onClick={() => savePayoutOpen(payoutDraft ? new Date(payoutDraft).toISOString() : null)}
                  className="btn-ghost" disabled={!payoutDraft}>개시일 설정</button>
          {payoutOpenAt !== null && (
            <button onClick={() => savePayoutOpen(null)} className="btn-ghost"
                    style={{ color: "var(--amber)" }}>잠금으로 되돌리기</button>
          )}
        </div>
      </div>
      <div style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", marginBottom: 24 }}>
        <div className="panel">
          <div className="panel-header">
            <span>실외 미세먼지 (케이웨더 Air365)</span>
            <span style={{ display: "flex", gap: 8 }}>
              <button onClick={loadOd} className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>불러오기</button>
              <button onClick={resetHcode} className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>행정동 재탐색</button>
              <button onClick={testOd} className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>시험 호출</button>
              <button onClick={pullOd} className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>지금 당겨오기</button>
              <button onClick={saveOd} className="btn-primary" style={{ padding: "6px 12px", fontSize: 12 }}>저장</button>
            </span>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--ink-dim)", lineHeight: 1.65, margin: "0 0 12px" }}>
            여기 넣은 키로 <b>서버가 대신 조회</b>해 기기에 내려보냅니다. 키는 기기에 심지 않고 응답에도 섞이지 않으며,
            저장 후에는 화면으로 돌려받을 수 없습니다. <b>크론이 10분마다 케이웨더에서 당겨와 저장</b>하고,
            기기에는 그 저장분을 뿌립니다 - 기기가 몇 대든 호출 수는 <b>동네 수</b>에만 비례하고, 케이웨더가 멈춰도
            마지막 값으로 계속 서비스됩니다. <b>저장 전에 「시험 호출」로 먼저 확인하세요.</b>
          </p>

          <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
            <div>
              <label className="field-label">
                케이웨더 API 키 {od ? `(현재: ${(od.config as Record<string, string>)?.apiKey || "미설정"})` : ""}
              </label>
              <input className="field-input" type="password" placeholder="새 키를 넣을 때만 입력 · 비우면 기존 유지"
                value={odForm.apiKey} onChange={(e) => setOdForm({ ...odForm, apiKey: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ width: 140 }}>
                <label className="field-label">캐시(분)</label>
                <input className="field-input" value={odForm.cacheMinutes}
                  onChange={(e) => setOdForm({ ...odForm, cacheMinutes: e.target.value })} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, paddingBottom: 8 }}>
                <input type="checkbox" checked={odForm.enabled}
                  onChange={(e) => setOdForm({ ...odForm, enabled: e.target.checked })} />
                기기 배포 켜기 - 끄면 기기에 <code>DISABLED</code> 가 나갑니다
              </label>
            </div>
          </div>

          {od?.devices != null && (
            <p style={{ fontSize: 12.5, color: "var(--ink-faint)", margin: "0 0 10px" }}>
              좌표 {(od.devices as Record<string, number>).located} / {(od.devices as Record<string, number>).total}대 ·
              행정동코드 확보 {(od.devices as Record<string, number>).hcodeResolved}대
              {(od.devices as Record<string, number>).missingLocation > 0 &&
                ` · 좌표 없는 ${(od.devices as Record<string, number>).missingLocation}대는 NO_LOCATION 이 나갑니다`}
            </p>
          )}
          {Array.isArray(od?.readings) && (od!.readings as unknown[]).length > 0 && (
            <div className="feed-table-scroll" style={{ marginBottom: 14 }}>
              <table className="feed-table compact">
                <thead><tr>
                  {([["area","행정동"],["pm10","PM10"],["pm25","PM2.5"],["temp","기온"],["observed","관측"],["fetched","갱신"]] as [string, string][]).map(([k, label]) => (
                    <SortTh key={k} k={k} sortKey={odSort.sortKey} dir={odSort.dir} onToggle={odSort.toggle}>{label}</SortTh>
                  ))}
                </tr></thead>
                <tbody>
                  {odPager.slice.map((r) => (
                    <tr key={String(r.hcode)}>
                      <td>{r.area ?? r.hcode}</td>
                      <td>{r.pm10 ?? "-"}</td>
                      <td>{r.pm25 ?? "-"}</td>
                      <td>{r.temp ?? "-"}</td>
                      <td className="dim">{r.observedAt ? new Date(String(r.observedAt)).toLocaleString(undefined, { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}</td>
                      <td className="dim">{r.error ? `⚠ ${r.error}` : new Date(String(r.fetchedAt)).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pager p={odPager} unit="곳" />
            </div>
          )}
          {odResult != null && (
            <pre className="mono" style={{
              fontSize: 11.5, lineHeight: 1.6, margin: "0 0 18px", padding: 12,
              background: "var(--bg-2)", border: "1px solid var(--line-2)",
              maxHeight: 320, overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all",
            }}>{JSON.stringify(odResult, null, 2)}</pre>
          )}

          <div className="panel-header"><span>B2B REVENUE · α BUDGET BASIS (RLUSD 입력 → WLBN 자동환산)</span></div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <label className="field-label">MONTH</label>
              <input
                value={revenue.month}
                onChange={(e) => setRevenue({ ...revenue, month: e.target.value })}
                placeholder="2026-08"
                className="field-input"
                style={{ width: 120 }}
              />
            </div>
            <div>
              <label className="field-label">REVENUE (RLUSD/USD)</label>
              <input
                value={revenue.amount}
                onChange={(e) => setRevenue({ ...revenue, amount: e.target.value })}
                placeholder="0"
                className="field-input"
                style={{ width: 140 }}
              />
            </div>
            <button onClick={saveRevenue} className="btn-ghost">저장</button>
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><span>ECONOMIC PARAMS · JSON</span></div>
          <textarea
            value={economicJson}
            onChange={(e) => setEconomicJson(e.target.value)}
            rows={8}
            className="field-textarea mono"
            style={{ fontSize: 12, color: "var(--green)" }}
          />
          <button onClick={saveEconomic} className="btn-ghost" style={{ marginTop: 10 }}>저장</button>
        </div>
      </div>
      </>)}

      {tab === "개요" && ov && (
        <div className="feed-wrap">
          <div className="feed-head">
            <span className="feed-head-title">RECENT CLAIMS</span>
          </div>
          <div className="feed-table-scroll">
            <table className="feed-table compact">
              <thead>
                <tr>
                  {([["wallet","WALLET"],["amount","AMOUNT"],["status","STATUS"]] as [string, string][]).map(([k, label]) => (
                    <SortTh key={k} k={k} sortKey={ovClaimSort.sortKey} dir={ovClaimSort.dir} onToggle={ovClaimSort.toggle}>{label}</SortTh>
                  ))}
                  <SortTh k="tx" align="right" sortKey={ovClaimSort.sortKey} dir={ovClaimSort.dir} onToggle={ovClaimSort.toggle}>TX</SortTh>
                </tr>
              </thead>
              <tbody>
                {ovClaimPager.slice.map((c) => (
                  <tr key={c.id}>
                    <td className="dim">{c.wallet}</td>
                    <td>{c.amount.toFixed(4)}</td>
                    <td className={c.status === "CONFIRMED" ? "ok" : c.status === "FAILED" ? "bad" : "warn"}>{c.status}</td>
                    <td className="id" style={{ textAlign: "right" }}>{c.txHash?.slice(0, 16) ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager p={ovClaimPager} />
        </div>
      )}
    </div>
  );
}
