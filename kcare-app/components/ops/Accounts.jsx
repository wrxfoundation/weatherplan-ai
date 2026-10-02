// 계정·권한관리 — 요청서 §16. 권한 6종 × 제한 작업 10종 매트릭스와 계정 목록.
// 매트릭스 편집은 최고관리자에게만 열린다 — 데모에서는 "최고관리자로 보기" 토글로 시연한다.
// 권한·활성 상태 변경은 덮어쓰지 않고 변경 이력을 쌓는다.
import { useMemo, useState } from "react";
import Icon from "../icons";
import { Panel, PanelHead, Stat, Pill, Btn, Table, KV, Field, Toggle, Drawer, Confirm, Note, Empty, Avatar } from "./ui";
import { NOW, fmtDT, fmtRel } from "../../lib/ops-admin";
import { ACCOUNTS_SEED, BRANCHES, PERMS, PERM_MATRIX, ROLES } from "../../lib/ops-admin-sys";

const roleLabel = (k) => ROLES.find((r) => r.key === k)?.label || k;
// 권한은 분류일 뿐 위험이 아니다 — 빨강을 쓰지 않는다
const ROLE_TONE = { super: "navy", hq: "info", branch: "gold", operator: "ok", concierge: "muted", viewer: "muted" };
const DAY = 86400000;

export default function Accounts() {
  const [accounts, setAccounts] = useState(ACCOUNTS_SEED);
  const [matrix, setMatrix] = useState(PERM_MATRIX);
  const [asSuper, setAsSuper] = useState(false);
  const [changes, setChanges] = useState([]);
  const [selId, setSelId] = useState(ACCOUNTS_SEED[2].id);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("전체");
  const [branch, setBranch] = useState("전체");
  const [active, setActive] = useState("전체");
  const [statF, setStatF] = useState("");
  const [add, setAdd] = useState(null); // { name, login, role, branch }
  const [confirm, setConfirm] = useState(null); // 계정 id — 활성/비활성 전환
  const [roleEdit, setRoleEdit] = useState(null); // { id, to }

  const actor = asSuper ? "최관리 (최고관리자)" : "김태영 (관제사)";
  const log = (field, target, before, after) => setChanges((p) => [{ at: Date.now(), by: actor, field, target, before, after }, ...p]);

  const stats = useMemo(() => ({
    total: accounts.length,
    active: accounts.filter((a) => a.active).length,
    inactive: accounts.filter((a) => !a.active).length,
    superN: accounts.filter((a) => a.role === "super").length,
    stale: accounts.filter((a) => a.active && (!a.lastLogin || NOW - a.lastLogin > 30 * DAY)).length,
  }), [accounts]);

  const rows = useMemo(() => {
    const kw = q.trim();
    return accounts
      .filter((a) => role === "전체" || roleLabel(a.role) === role)
      .filter((a) => branch === "전체" || a.branch === branch)
      .filter((a) => active === "전체" || (active === "활성" ? a.active : !a.active))
      .filter((a) => !statF || (statF === "inactive" ? !a.active : statF === "super" ? a.role === "super" : statF === "stale" ? a.active && (!a.lastLogin || NOW - a.lastLogin > 30 * DAY) : a.active))
      .filter((a) => !kw || [a.name, a.login, a.branch, roleLabel(a.role)].join(" ").includes(kw))
      // 예외 먼저 — 비활성 · 장기 미로그인 → 권한 높은 순
      .sort((a, b) => (a.active ? 1 : 0) - (b.active ? 1 : 0) || ((a.lastLogin || 0) < NOW - 30 * DAY ? 0 : 1) - ((b.lastLogin || 0) < NOW - 30 * DAY ? 0 : 1) || ROLES.findIndex((r) => r.key === a.role) - ROLES.findIndex((r) => r.key === b.role));
  }, [accounts, q, role, branch, active, statF]);

  const cur = accounts.find((a) => a.id === selId) || null;

  const toggleActive = () => {
    const a = accounts.find((x) => x.id === confirm);
    if (a) {
      setAccounts((p) => p.map((x) => (x.id === a.id ? { ...x, active: !x.active } : x)));
      log("계정 상태", `${a.name} (${a.login})`, a.active ? "활성" : "비활성", a.active ? "비활성" : "활성");
    }
    setConfirm(null);
  };
  const changeRole = () => {
    const a = accounts.find((x) => x.id === roleEdit?.id);
    if (a && a.role !== roleEdit.to) {
      setAccounts((p) => p.map((x) => (x.id === a.id ? { ...x, role: roleEdit.to } : x)));
      log("권한", `${a.name} (${a.login})`, roleLabel(a.role), roleLabel(roleEdit.to));
    }
    setRoleEdit(null);
  };
  const togglePerm = (roleKey, permKey) => {
    if (!asSuper || roleKey === "super") return; // 최고관리자 행은 잠근다 — 스스로 권한을 잃지 않게
    const has = matrix[roleKey].includes(permKey);
    setMatrix((m) => ({ ...m, [roleKey]: has ? m[roleKey].filter((k) => k !== permKey) : [...m[roleKey], permKey] }));
    log("권한 매트릭스", `${roleLabel(roleKey)} · ${PERMS.find((p) => p.key === permKey).label}`, has ? "허용" : "제한", has ? "제한" : "허용");
  };
  const saveAdd = () => {
    if (!add.name.trim() || !add.login.trim()) return;
    const id = `ac${Date.now()}`;
    setAccounts((p) => [...p, { id, login: add.login.trim(), name: add.name.trim(), role: add.role, branch: add.branch, active: true, lastLogin: null }]);
    log("계정 추가", `${add.name.trim()} (${add.login.trim()})`, "—", `${roleLabel(add.role)} · ${add.branch}`);
    setSelId(id);
    setAdd(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-bold text-navy">계정 · 권한관리</h2>
          <p className="mt-0.5 text-[13px] text-muted">권한 6종과 제한 작업 10종을 매트릭스로 관리하고, 계정의 활성 상태 · 마지막 로그인을 봅니다</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="ac-as-super" className="flex items-center gap-2 text-[12px] text-muted"><Toggle id="ac-as-super" on={asSuper} onChange={setAsSuper} label="최고관리자로 보기 (데모)" />최고관리자로 보기 <span className="text-[11px]">(매트릭스 편집 시연)</span></label>
          <Btn onClick={() => setAdd({ name: "", login: "", role: "operator", branch: BRANCHES[1] })} disabled={!asSuper && !matrix.operator.includes("accounts")} title={asSuper ? "" : "계정관리 권한이 있는 계정만 추가할 수 있습니다"}><Icon name="plus" size={14} /> 계정 추가</Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Stat label="전체 계정" value={stats.total} unit="개" active={statF === ""} onClick={() => setStatF("")} />
        <Stat label="활성" value={stats.active} unit="개" tone="ok" active={statF === "active"} onClick={() => setStatF(statF === "active" ? "" : "active")} />
        <Stat label="비활성" value={stats.inactive} unit="개" tone="muted" active={statF === "inactive"} onClick={() => setStatF(statF === "inactive" ? "" : "inactive")} />
        <Stat label="최고관리자" value={stats.superN} unit="개" tone="navy" active={statF === "super"} onClick={() => setStatF(statF === "super" ? "" : "super")} />
        <Stat label="30일 미로그인 (활성)" value={stats.stale} unit="개" tone="warn" active={statF === "stale"} onClick={() => setStatF(statF === "stale" ? "" : "stale")} />
      </div>

      <Panel className="!py-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1"><Field id="ac-q" label="검색" value={q} onChange={setQ} placeholder="이름 · 계정 · 지점" /></div>
          <div className="w-[170px]"><Field id="ac-role" label="권한" value={role} onChange={setRole} options={["전체", ...ROLES.map((r) => r.label)]} /></div>
          <div className="w-[150px]"><Field id="ac-branch" label="지점" value={branch} onChange={setBranch} options={["전체", ...BRANCHES]} /></div>
          <div className="w-[120px]"><Field id="ac-active" label="상태" value={active} onChange={setActive} options={["전체", "활성", "비활성"]} /></div>
          <div className="pb-2 text-[12px] text-muted">총 <b className="font-num text-navy">{rows.length}</b>개</div>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Panel>
          <PanelHead title="계정 목록" sub="비활성 · 장기 미로그인 먼저" />
          <div className="mt-3">
            <Table dense rows={rows} selected={cur?.id} onRow={(a) => setSelId(a.id)} cols={[
              { k: "name", label: "이름 · 계정", render: (a) => <div className="flex items-center gap-2"><Avatar name={a.name} size={28} tone={ROLE_TONE[a.role]} /><div><div className="font-bold text-navy">{a.name}</div><div className="font-num text-[11px] text-muted">{a.login}</div></div></div> },
              { k: "role", label: "권한", render: (a) => <Pill tone={ROLE_TONE[a.role]}>{roleLabel(a.role)}</Pill> },
              { k: "branch", label: "지점" },
              { k: "active", label: "상태", render: (a) => <Pill tone={a.active ? "ok" : "muted"} dot>{a.active ? "활성" : "비활성"}</Pill> },
              { k: "last", label: "마지막 로그인", render: (a) => <span className={`font-num text-[12px] ${a.active && (!a.lastLogin || NOW - a.lastLogin > 30 * DAY) ? "font-bold" : ""}`} style={a.active && (!a.lastLogin || NOW - a.lastLogin > 30 * DAY) ? { color: "#8A5D12" } : undefined}>{a.lastLogin ? fmtRel(a.lastLogin) : "로그인 기록 없음"}</span> },
            ]} empty="조건에 맞는 계정이 없습니다." />
          </div>
        </Panel>

        {cur ? (
          <Panel className="self-start">
            <div className="flex items-start gap-3">
              <Avatar name={cur.name} size={44} tone={ROLE_TONE[cur.role]} />
              <div className="min-w-0 flex-1">
                <div className="text-[16px] font-bold text-navy">{cur.name}</div>
                <div className="font-num text-[12px] text-muted">{cur.login} · {cur.branch}</div>
                <div className="mt-1 flex flex-wrap gap-1.5"><Pill tone={ROLE_TONE[cur.role]}>{roleLabel(cur.role)}</Pill><Pill tone={cur.active ? "ok" : "muted"} dot>{cur.active ? "활성" : "비활성"}</Pill></div>
              </div>
            </div>
            <div className="mt-3">
              <KV k="마지막 로그인" v={cur.lastLogin ? fmtDT(cur.lastLogin) : "로그인 기록 없음"} mono />
              <KV k="권한 변경" v={<div className="flex items-end gap-2"><div className="flex-1"><Field id={`ac-role-${cur.id}`} label="권한" value={roleLabel(roleEdit?.id === cur.id ? roleEdit.to : cur.role)} options={ROLES.map((r) => r.label)} disabled={!asSuper} onChange={(v) => setRoleEdit({ id: cur.id, to: ROLES.find((r) => r.label === v).key })} /></div>{roleEdit?.id === cur.id && roleEdit.to !== cur.role && <Btn small onClick={changeRole}>저장</Btn>}</div>} />
            </div>
            <div className="mt-3">
              <div className="mb-1 text-[12px] font-bold text-muted">이 권한으로 가능한 작업</div>
              <ul className="grid grid-cols-2 gap-1">
                {PERMS.map((p) => { const ok = matrix[cur.role].includes(p.key); return <li key={p.key} className={`flex items-center gap-1.5 text-[12px] ${ok ? "text-ink" : "text-muted line-through"}`}><span style={{ color: ok ? "#1E7A5A" : "rgba(10,31,60,.25)" }}><Icon name="check" size={12} strokeWidth={2.5} /></span>{p.label}</li>; })}
              </ul>
            </div>
            <div className="mt-4 flex justify-end">
              <Btn small ghost tone={cur.active ? "muted" : "ok"} onClick={() => setConfirm(cur.id)} disabled={!asSuper && cur.role === "super"}>{cur.active ? "비활성으로 전환" : "활성으로 전환"}</Btn>
            </div>
          </Panel>
        ) : <Panel className="self-start"><Empty>목록에서 계정을 선택하세요.</Empty></Panel>}
      </div>

      <Panel>
        <PanelHead title="권한 매트릭스" sub={asSuper ? "칸을 누르면 허용/제한이 바뀝니다 · 최고관리자 열은 잠김" : "최고관리자만 편집할 수 있습니다 — 현재 조회 전용"} right={<Pill tone={asSuper ? "gold" : "muted"}>{asSuper ? "편집 가능" : "조회 전용"}</Pill>} />
        <div className="mt-3">
          <Table dense rows={PERMS} rowKey={(p) => p.key} cols={[
            { k: "label", label: "제한 작업", render: (p) => <span className="font-semibold text-ink">{p.label}</span> },
            ...ROLES.map((r) => ({
              k: r.key,
              label: <Pill tone={ROLE_TONE[r.key]}>{r.label}</Pill>,
              w: 110,
              render: (p) => {
                const on = matrix[r.key].includes(p.key);
                const locked = !asSuper || r.key === "super";
                return (
                  <button type="button" role="checkbox" aria-checked={on} aria-label={`${r.label} · ${p.label} ${on ? "허용" : "제한"}`} disabled={locked} onClick={() => togglePerm(r.key, p.key)}
                    className={`btn-press btn-inline inline-flex h-[26px] w-[26px] items-center justify-center rounded-[7px] ${locked ? "cursor-default" : ""}`}
                    style={{ background: on ? "rgba(30,122,90,.14)" : "rgba(10,31,60,.05)", color: on ? "#1E7A5A" : "rgba(10,31,60,.25)" }}>
                    {on ? <Icon name="check" size={14} strokeWidth={2.5} /> : <span aria-hidden>—</span>}
                  </button>
                );
              },
            })),
          ]} />
        </div>
      </Panel>

      <Panel>
        <PanelHead title="변경 이력" sub="권한 · 계정 상태 · 매트릭스 변경은 덮어쓰지 않고 쌓입니다 (감사로그와 같은 원칙)" right={<span className="font-num">{changes.length}건</span>} />
        <div className="mt-2">
          {changes.length === 0 ? <Empty>이 세션에서 변경한 내역이 없습니다.</Empty> : (
            <ul className="space-y-1">{changes.map((c, i) => <li key={i} className="text-[12px]"><span className="font-num text-muted">{fmtDT(c.at)}</span> · {c.by} · <b className="text-ink">{c.field}</b> {c.target} · <span className="text-muted line-through">{c.before}</span> → <span className="text-green">{c.after}</span></li>)}</ul>
          )}
        </div>
      </Panel>

      <Note>권한은 최소 권한 원칙으로 부여합니다. 상세주소 · 위치 · 건강정보 조회는 감사로그에 기록됩니다.</Note>

      {add && (
        <Drawer open onClose={() => setAdd(null)} title="계정 추가" sub="추가 즉시 활성 · 첫 로그인 전까지 '로그인 기록 없음'" width={480}
          footer={<div className="flex justify-end gap-2"><Btn ghost tone="muted" onClick={() => setAdd(null)}>취소</Btn><Btn onClick={saveAdd} disabled={!add.name.trim() || !add.login.trim()}>추가</Btn></div>}>
          <div className="space-y-3">
            <Field id="ac-add-name" label="이름" required value={add.name} onChange={(v) => setAdd((a) => ({ ...a, name: v }))} />
            <Field id="ac-add-login" label="접속계정" required value={add.login} onChange={(v) => setAdd((a) => ({ ...a, login: v }))} placeholder="예: ops.hong" />
            <Field id="ac-add-role" label="권한" value={roleLabel(add.role)} options={ROLES.map((r) => r.label)} onChange={(v) => setAdd((a) => ({ ...a, role: ROLES.find((r) => r.label === v).key }))} />
            <Field id="ac-add-branch" label="지점" value={add.branch} options={BRANCHES} onChange={(v) => setAdd((a) => ({ ...a, branch: v }))} />
          </div>
        </Drawer>
      )}

      <Confirm open={!!confirm} title={`계정을 ${accounts.find((a) => a.id === confirm)?.active ? "비활성" : "활성"}으로 전환합니다`} body={`${accounts.find((a) => a.id === confirm)?.name || ""} — 비활성 계정은 로그인할 수 없고, 전환 기록은 변경 이력에 남습니다.`} confirmLabel="전환" onCancel={() => setConfirm(null)} onConfirm={toggleActive} />
    </div>
  );
}
