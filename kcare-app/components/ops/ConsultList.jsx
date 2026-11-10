// 관제 — 상담 신청 (2026-11-06 랜딩 요청 5-4). /consult 에서 들어온 가입 상담 신청 목록.
//  · 이름 · 연락처 · 신청자 구분 · 접수 시각 · 처리 상태
//  · 처리: 새 접수 → 연락함 → 상담 종료. 종료하면 이름과 연락처를 지운다 (화면 약속: 상담이 끝나면 파기) — 되돌릴 수 없다
//  · 센터 관제 계정(ops1 · ops2 · ops3 또는 승인된 관제 회원)만 본다. 세 센터가 같은 목록을 본다 — 접수는 센터를 고르지 않는다
import { useCallback, useEffect, useState } from "react";
import { Btn, Confirm, Note, Panel, PanelHead, Pill, Stat, Table } from "./ui";
import { useAuth } from "../../lib/auth";
import { CENTERS } from "../../lib/centers";
import { CONSULT_STATUS, CONSULT_WHO } from "../../lib/consults";
import { fmtDateTime } from "../../lib/ops-time";

const ERR = {
  "schema-missing": "상담 신청 표가 아직 없습니다 — supabase/consults.sql 을 한 번 실행해야 합니다 (DEPLOY.md 4-16).",
  "db-not-configured": "서버 저장(Supabase) 연결 전입니다.",
  "no-center": "센터 관제 계정(ops1 · ops2 · ops3 또는 승인된 관제 회원)으로 들어와야 상담 신청을 볼 수 있습니다.",
  "ops-only": "관제 계정만 볼 수 있습니다.",
  "bad-state": "다른 관제가 먼저 처리했습니다 — 목록을 새로 불러왔습니다.",
  "not-found": "이 접수를 찾지 못했습니다 — 목록을 새로 불러왔습니다.",
  "open-exists": "같은 연락처의 새 접수가 이미 있습니다 — 그 접수를 처리해 주세요.",
  "login-required": "로그인이 만료됐습니다 — 다시 로그인해 주세요.",
  network: "서버에 연결하지 못했습니다 — 연결을 확인하고 새로고침해 주세요.",
};
const errText = (code) => ERR[code] || `처리하지 못했습니다 (${code})`;
// 메뉴 숫자 · 지금 처리할 일이 패널과 같은 수를 보게 — 패널이 새로 읽을 때마다 알린다
const FRESH_EVENT = "kcare-consults-fresh";
const when = (t) => (t ? fmtDateTime(Date.parse(t)) : "—");
const canSee = (user) => user?.role === "ops" && !!CENTERS[user?.center];

// 관제 첫 화면 '지금 처리할 일' · 메뉴 숫자용 — 새 접수 수 (센터 관제만 · 30초마다)
export function useNewConsults() {
  const { user } = useAuth();
  const on = canSee(user);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!on) return undefined;
    let stop = false;
    const get = async () => {
      try {
        const r = await fetch("/api/consult", { cache: "no-store" });
        const j = r.ok ? await r.json() : null;
        if (!stop && j) setN(Number(j.fresh) || 0);
      } catch (_) {
        /* 다음 차례에 */
      }
    };
    const onPanel = (e) => setN(Number(e.detail) || 0);
    get();
    const t = setInterval(get, 30000);
    window.addEventListener(FRESH_EVENT, onPanel);
    return () => {
      stop = true;
      clearInterval(t);
      window.removeEventListener(FRESH_EVENT, onPanel);
    };
  }, [on]);
  return n;
}

export default function ConsultList() {
  const { user } = useAuth();
  const on = canSee(user);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(null);
  const [ask, setAsk] = useState(null); // 상담 종료 확인 — { id, name }
  const [tab, setTab] = useState("open"); // open(새 접수 · 연락함) | done | all

  const take = (j) => {
    setError(null);
    setData(j);
    window.dispatchEvent(new CustomEvent(FRESH_EVENT, { detail: Number(j.fresh) || 0 }));
  };
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/consult", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return setError(j.error || `http-${r.status}`);
      take(j);
    } catch (_) {
      setError("network");
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (!on) return undefined;
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [on, load]);

  if (!on) {
    return (
      <Panel>
        <PanelHead title="상담 신청" sub="서비스 소개의 '가입 상담 신청'으로 들어온 접수" />
        <div className="mt-2">
          <Note tone="info">
            {user?.household ? `${ERR["no-center"]} 지금 계정은 ${user.name}입니다.` : "상담 신청 목록은 센터 관제 계정으로 로그인하면 보입니다 (관제 로그인 /ops/login)."}
          </Note>
        </div>
      </Panel>
    );
  }

  const setStatus = async (id, status) => {
    setBusy(`${id}:${status}`);
    setNotice(null);
    try {
      const r = await fetch("/api/consult", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) take(j);
      else {
        setNotice(errText(j.error || `http-${r.status}`));
        await load();
      }
    } catch (_) {
      setNotice(errText("network"));
    }
    setBusy(null);
  };

  const all = data?.consults || [];
  const count = (s) => all.filter((c) => c.status === s).length;
  const rows = all.filter((c) => (tab === "all" ? true : tab === "done" ? c.status === "done" : c.status !== "done"));
  const cols = [
    { k: "createdAt", label: "접수 시각", w: 132, render: (c) => <span className="font-num">{when(c.createdAt)}</span> },
    {
      k: "name",
      label: "이름",
      render: (c) => (c.name ? <b className="text-navy">{c.name}</b> : <span className="text-muted">지움</span>),
    },
    {
      k: "phone",
      label: "연락처",
      render: (c) =>
        c.phone ? (
          <a href={`tel:${c.phone.replace(/\D/g, "")}`} className="font-num font-bold text-navy underline underline-offset-2">
            {c.phone}
          </a>
        ) : (
          <span className="text-muted">지움</span>
        ),
    },
    {
      k: "who",
      label: "신청자 구분",
      render: (c) => (
        <span>
          {CONSULT_WHO[c.who] || "—"}
          {c.ref && <span className="ml-1.5 font-num text-[11px] text-muted">추천 {c.ref}</span>}
        </span>
      ),
    },
    {
      k: "status",
      label: "처리 상태",
      render: (c) => (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          <Pill tone={CONSULT_STATUS[c.status]?.tone || "muted"} dot={c.status === "new"}>
            {CONSULT_STATUS[c.status]?.label || c.status}
          </Pill>
          {c.againCount > 0 && c.status === "new" && <span className="text-[11px] font-bold text-amber">다시 신청 {c.againCount}회 · {when(c.againAt)}</span>}
          {c.handledBy && <span className="text-[11px] text-muted">{c.handledBy} · {when(c.handledAt)}</span>}
        </span>
      ),
    },
    {
      k: "act",
      label: "처리",
      align: "right",
      render: (c) =>
        c.status === "done" ? null : (
          <span className="inline-flex flex-wrap justify-end gap-1.5">
            {c.status === "new" && (
              <Btn small disabled={!!busy} onClick={() => setStatus(c.id, "contacted")}>
                연락함
              </Btn>
            )}
            {c.status === "contacted" && (
              <Btn ghost small tone="muted" disabled={!!busy} onClick={() => setStatus(c.id, "new")}>
                새 접수로
              </Btn>
            )}
            <Btn ghost small tone="warn" disabled={!!busy} onClick={() => setAsk({ id: c.id, name: c.name })}>
              상담 종료
            </Btn>
          </span>
        ),
    },
  ];

  return (
    <Panel>
      <PanelHead
        title="상담 신청"
        sub="서비스 소개의 '가입 상담 신청'으로 들어온 접수 — 세 센터가 같은 목록을 봅니다"
        right={<Btn ghost small onClick={load}>새로고침</Btn>}
      />
      {(error || notice) && (
        <div className="mt-2 space-y-1.5" role="alert">
          {error && <Note tone="warn">{errText(error)}</Note>}
          {notice && <Note tone="warn">{notice}</Note>}
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2 sm:max-w-[520px]">
        <Stat label="새 접수" value={count("new")} unit="건" tone={count("new") ? "warn" : "muted"} />
        <Stat label="연락함" value={count("contacted")} unit="건" tone="navy" />
        <Stat label="상담 종료" value={count("done")} unit="건" tone="muted" />
      </div>

      <div role="group" aria-label="보기" className="mt-4 flex flex-wrap gap-1.5">
        {[["open", "처리할 것"], ["done", "종료"], ["all", "전체"]].map(([k, label]) => (
          <Btn key={k} small ghost={tab !== k} aria-pressed={tab === k} onClick={() => setTab(k)}>
            {label}
          </Btn>
        ))}
      </div>

      <div className="mt-3">
        <Table cols={cols} rows={rows} dense empty={data ? (tab === "open" ? "처리할 상담 신청이 없습니다." : "표시할 접수가 없습니다.") : error ? "목록을 불러오지 못했습니다." : "불러오는 중…"} />
      </div>
      <p className="mt-3 text-[11.5px] leading-[1.6] text-muted">
        연락을 마쳤으면 &lsquo;연락함&rsquo;, 상담이 끝났으면 &lsquo;상담 종료&rsquo;로 바꿉니다. 종료하면 이름과 연락처를 지웁니다 — 접수 시각 · 신청자 구분 · 처리 기록만 남습니다.
        같은 연락처로 새 접수가 있는 동안 다시 신청하면 줄을 늘리지 않고 &lsquo;다시 신청&rsquo; 횟수만 올립니다.
      </p>

      <Confirm
        open={!!ask}
        title={`${ask?.name || "이 접수"} 상담을 종료합니다`}
        body="이름과 연락처를 지웁니다. 되돌릴 수 없습니다. 가입으로 이어졌다면 회원 가입(가입 코드)은 따로 진행합니다."
        confirmLabel="종료하고 지우기"
        tone="warn"
        onCancel={() => setAsk(null)}
        onConfirm={() => {
          const id = ask.id;
          setAsk(null);
          setStatus(id, "done");
        }}
      />
    </Panel>
  );
}
