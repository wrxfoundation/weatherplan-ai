// 관제 › 가족 관리 (2026-11-12 — 가족마다 기록 나누기 · pages/api/families.js).
//
// 한 센터 안의 가족을 한눈에 본다 — 누가 가입했는지 · 담당 컨시어지 · 요금제 · 지금 처리할 것 · 가족 가입 코드.
//  · [가족 추가]      새 가족과 가족 가입 코드를 만든다. 그 코드로 가입한 어르신 · 보호자가 그 가족이 된다.
//  · 가족 가입 코드   가족마다 하나. 가입 링크를 복사해 보낸다. [새로 만들기]를 누르면 옛 코드는 바로 막힌다 (가입한 사람은 그대로).
//  · [이 가족 열기]   관제 화면 전체가 그 가족의 기록으로 바뀐다 — 담당 컨시어지 · 요금제는 어르신 관리에서 지정한다.
//  · 빈 가족 지우기   잘못 만든 가족 정리용. 구성원 · 기록이 없는 가족만, 센터 관리자만.
// 데모 · 테스트 가구 1 에는 가족이 하나뿐이라 이 화면이 없다.
import { useState } from "react";
import { Btn, Confirm, Empty, Field, Note, Panel, PanelHead, Pill, Stat } from "./ui";
import { useAuth } from "../../lib/auth";
import { useSync } from "../../lib/state";
import { CENTERS } from "../../lib/centers";
import { PLANS } from "../../lib/plans";
import { familyErrText, familyFlags, refreshFamilies, useFamilies } from "../../lib/families-client";

function copy(text) {
  try {
    navigator.clipboard?.writeText(text);
  } catch (_) {
    /* 권한이 없으면 화면의 글을 직접 복사한다 */
  }
}

const FLAG_TONE = { danger: "danger", warn: "warn", gold: "gold", muted: "muted" };

export default function Families({ onOpened = null }) {
  const { user } = useAuth();
  const sync = useSync();
  const fam = useFamilies();
  const center = CENTERS[user?.center];
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState(null);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [ask, setAsk] = useState(null); // { kind: "code" | "delete" | "rename", f }
  const [rename, setRename] = useState("");
  const [copied, setCopied] = useState(null);
  const [made, setMade] = useState(null); // 방금 만든 가족 — 코드를 크게 한 번 보여 준다

  if (!user?.household) return null;
  if (!center || user.role !== "ops") {
    return (
      <Panel>
        <PanelHead title="가족 관리" sub="관제 센터 계정 전용" />
        <div className="mt-2">
          <Note tone="info">가족 관리는 센터 관제 계정(ops1 · ops2 · ops3 또는 승인된 관제 회원)으로 로그인하면 보입니다.</Note>
        </div>
      </Panel>
    );
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const joinUrl = (code) => `${origin}/join?code=${code}`;
  const copied2s = (k) => {
    setCopied(k);
    setTimeout(() => setCopied((c) => (c === k ? null : c)), 2000);
  };

  const send = async (method, body, key) => {
    setBusy(key);
    setNotice(null);
    let out = null;
    try {
      const r = await fetch("/api/families", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setNotice(familyErrText(j.error || `http-${r.status}`, j.message));
      else out = j;
    } catch (_) {
      setNotice(familyErrText("network"));
    }
    try {
      await refreshFamilies();
    } finally {
      setBusy(null);
    }
    return out;
  };

  const add = async () => {
    const j = await send("POST", { label: label.trim() }, "add");
    if (j?.family) {
      setMade(j.family);
      setAdding(false);
      setLabel("");
    }
  };

  const open = async (f) => {
    setBusy(`open:${f.id}`);
    try {
      await sync.switchFamily(f.id);
      onOpened?.(f);
    } finally {
      setBusy(null);
    }
  };

  const list = fam.families;
  const loading = fam.status !== "ready" && !fam.error;
  const schemaMissing = fam.error === "schema-missing";
  const noCode = list.filter((f) => !f.code).length;
  const noStaff = list.filter((f) => !f.pri && (f.elders.length || f.guardians.length)).length;

  return (
    <Panel>
      <PanelHead
        title={`${center.name} 가족 관리`}
        sub="가족마다 기록(약 · 일정 · 부탁 · 마음사서함 · 결제)이 따로 쌓입니다 — 같은 가족 가입 코드로 가입한 어르신 · 보호자가 한 가족입니다"
        right={
          <span className="flex gap-1.5">
            <Btn ghost small onClick={() => refreshFamilies()}>새로고침</Btn>
            {!schemaMissing && (
              <Btn small disabled={!!busy} onClick={() => (setAdding(true), setMade(null))}>
                가족 추가
              </Btn>
            )}
          </span>
        }
      />

      {(fam.error || notice) && (
        <div className="mt-2 space-y-1.5" role="alert">
          {fam.error && <Note tone="warn">{familyErrText(fam.error)}</Note>}
          {notice && <Note tone="warn">{notice}</Note>}
        </div>
      )}

      {!schemaMissing && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="가족" value={list.length} unit="곳" tone="navy" />
            <Stat label="SOS · 도와줘요" value={list.filter((f) => f.sos || f.help).length} unit="곳" tone={list.some((f) => f.sos) ? "danger" : list.some((f) => f.help) ? "warn" : "muted"} />
            <Stat label="담당 미지정" value={noStaff} unit="곳" tone={noStaff ? "warn" : "muted"} />
            <Stat label="가입 코드 없음" value={noCode} unit="곳" tone={noCode ? "warn" : "muted"} />
          </div>

          <div className="mt-3">
            <Note tone="info">
              어르신 · 보호자는 <b>가족 가입 코드</b>로 가입합니다 — 가족마다 코드가 다릅니다. 컨시어지 · 파트너 · 관제는 계정 · 권한의 <b>센터 가입 코드</b>로 가입합니다.
              담당 컨시어지와 요금제는 그 가족을 연 뒤 어르신 관리에서 지정합니다 — 컨시어지는 담당으로 지정된 가족만 봅니다.
            </Note>
          </div>
        </>
      )}

      {adding && (
        <div className="mt-3 rounded-xl border border-navy/15 bg-white p-3">
          <div className="text-[14px] font-bold text-navy">새 가족 만들기</div>
          <div className="mt-2">
            <Field id="family-label" label="가족 이름 (비워도 됩니다)" value={label} onChange={setLabel} placeholder="예: 대치동 김순자 님 댁" hint="비우면 어르신이 가입한 뒤 '○○ 님 가족'으로 보입니다. 관제 화면에서만 쓰는 이름입니다 (30자까지)." />
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Btn ghost tone="muted" onClick={() => (setAdding(false), setLabel(""))}>닫기</Btn>
            <Btn disabled={busy === "add"} onClick={add}>
              {busy === "add" ? "만드는 중…" : "만들기 — 가입 코드 발급"}
            </Btn>
          </div>
        </div>
      )}

      {made && (
        <div className="mt-3 rounded-xl border border-gold/40 bg-gold/[.08] p-3" role="status">
          <div className="text-[14px] font-bold text-navy">{made.title} — 가족 가입 코드가 만들어졌습니다</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-white px-3 py-1 font-num text-[20px] font-bold tracking-[.2em] text-navy" aria-label="새 가족 가입 코드">{made.code}</span>
            <Btn ghost small onClick={() => (copy(made.code), copied2s("made-code"))}>{copied === "made-code" ? "복사됨" : "코드 복사"}</Btn>
            <Btn ghost small onClick={() => (copy(joinUrl(made.code)), copied2s("made-url"))}>{copied === "made-url" ? "복사됨" : "가입 링크 복사"}</Btn>
          </div>
          <p className="mt-1.5 text-[12px] leading-[1.6] text-muted">이 코드(또는 링크)를 이 가족의 어르신 · 보호자에게만 보내 주세요. 가입 신청은 계정 · 권한에서 승인해야 로그인됩니다.</p>
        </div>
      )}

      <h4 className="mt-5 text-[14px] font-bold text-navy">가족 {list.length ? `${list.length}곳` : ""}</h4>
      {loading ? (
        <div className="mt-2"><Empty>가족 목록을 불러오는 중입니다…</Empty></div>
      ) : list.length === 0 ? (
        <div className="mt-2"><Empty>{schemaMissing ? "가족 나누기 칸을 만든 뒤에 보입니다." : "아직 가족이 없습니다."}</Empty></div>
      ) : (
        <ul className="mt-2 space-y-2">
          {list.map((f) => {
            const here = f.id === sync.household;
            const flags = familyFlags(f, "ops");
            return (
              <li key={f.id} className={`card-glass rounded-xl px-3.5 py-3 ${here ? "ring-1 ring-gold" : ""}`} data-family={f.id}>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[15px] font-bold text-navy">{f.title}</span>
                  {f.first && <Pill tone="muted">첫 가족 · 예전 공간</Pill>}
                  {here && <Pill tone="navy">지금 보는 가족</Pill>}
                  {flags.map((x) => (
                    <Pill key={x.key} tone={FLAG_TONE[x.tone]}>{x.text}</Pill>
                  ))}
                  <span className="flex-1" />
                  <Btn small ghost={here} disabled={here || !!busy} onClick={() => open(f)}>
                    {here ? "보는 중" : busy === `open:${f.id}` ? "여는 중…" : "이 가족 열기"}
                  </Btn>
                </div>

                <dl className="mt-2 grid gap-x-4 gap-y-1 text-[13px] sm:grid-cols-2">
                  <div className="flex gap-2">
                    <dt className="w-[72px] shrink-0 text-muted">어르신</dt>
                    <dd className="min-w-0 font-bold text-ink">{f.elders.length ? f.elders.join(" · ") : <span className="font-medium text-muted">가입 전{f.elderName ? ` (가입 상담: ${f.elderName})` : ""}</span>}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-[72px] shrink-0 text-muted">보호자</dt>
                    <dd className="min-w-0 font-bold text-ink">{f.guardians.length ? f.guardians.join(" · ") : <span className="font-medium text-muted">가입 전</span>}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-[72px] shrink-0 text-muted">담당</dt>
                    <dd className="min-w-0 font-bold text-ink">
                      {f.pri ? `${f.pri}${f.sub ? ` · 부 ${f.sub}` : ""}` : <span className="font-medium text-muted">지정 전 — 가족을 열고 어르신 관리에서</span>}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-[72px] shrink-0 text-muted">요금제</dt>
                    <dd className="min-w-0 font-bold text-ink">{f.plan && PLANS[f.plan] ? PLANS[f.plan].name : <span className="font-medium text-muted">지정 전</span>}</dd>
                  </div>
                </dl>

                <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-lg bg-navy/[.03] px-2.5 py-2">
                  <span className="text-[12px] font-bold text-navy">가족 가입 코드</span>
                  {f.code ? (
                    <>
                      <span className="rounded-md bg-white px-2 py-0.5 font-num text-[15px] font-bold tracking-[.16em] text-navy" aria-label={`${f.title} 가족 가입 코드`}>{f.code}</span>
                      <Btn ghost small onClick={() => (copy(f.code), copied2s(`c:${f.id}`))}>{copied === `c:${f.id}` ? "복사됨" : "코드 복사"}</Btn>
                      <Btn ghost small onClick={() => (copy(joinUrl(f.code)), copied2s(`u:${f.id}`))}>{copied === `u:${f.id}` ? "복사됨" : "가입 링크 복사"}</Btn>
                    </>
                  ) : (
                    <span className="text-[12px] text-muted">아직 없습니다 — 만들어야 이 가족에 새로 가입할 수 있습니다</span>
                  )}
                  <span className="flex-1" />
                  <Btn ghost small tone={f.code ? "warn" : "navy"} disabled={!!busy} onClick={() => setAsk({ kind: "code", f })}>
                    {f.code ? "새로 만들기" : "코드 만들기"}
                  </Btn>
                  <Btn ghost small tone="muted" disabled={!!busy} onClick={() => (setRename(f.label || ""), setAsk({ kind: "rename", f }))}>
                    이름
                  </Btn>
                  {fam.owner && !f.first && !f.members && !f.saved && (
                    <Btn ghost small tone="muted" disabled={!!busy} onClick={() => setAsk({ kind: "delete", f })}>
                      지우기
                    </Btn>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Confirm
        open={!!ask}
        title={
          ask?.kind === "code"
            ? ask.f.code
              ? `${ask.f.title} — 가족 가입 코드를 새로 만듭니다`
              : `${ask.f.title} — 가족 가입 코드를 만듭니다`
            : ask?.kind === "delete"
              ? `${ask.f.title} — 빈 가족을 지웁니다`
              : ask?.kind === "rename"
                ? `${ask.f.title} — 가족 이름`
                : ""
        }
        body={
          ask?.kind === "code"
            ? ask.f.code
              ? "지금 코드는 바로 쓸 수 없게 됩니다. 이미 가입한 구성원에게는 영향이 없고, 새 코드로 가입해도 같은 이 가족에 들어옵니다. 다른 가족을 받으려면 [가족 추가]를 쓰세요."
              : "이 코드로 가입한 어르신 · 보호자가 이 가족에 들어옵니다. 가입 신청은 계정 · 권한에서 승인해야 로그인됩니다."
            : ask?.kind === "delete"
              ? "구성원과 기록이 없는 가족만 지울 수 있습니다. 되돌릴 수 없고, 이 가족의 가입 코드도 더 쓸 수 없게 됩니다."
              : ""
        }
        confirmLabel={ask?.kind === "code" ? (ask.f.code ? "새 코드 만들기" : "코드 만들기") : ask?.kind === "delete" ? "지우기" : "저장"}
        tone={ask?.kind === "delete" || (ask?.kind === "code" && ask.f.code) ? "warn" : "navy"}
        onCancel={() => setAsk(null)}
        onConfirm={() => {
          const x = ask;
          setAsk(null);
          if (x.kind === "code") send("PATCH", { id: x.f.id, action: "code" }, `code:${x.f.id}`);
          else if (x.kind === "delete") send("PATCH", { id: x.f.id, action: "delete" }, `del:${x.f.id}`);
          else send("PATCH", { id: x.f.id, action: "rename", label: rename.trim() }, `name:${x.f.id}`);
        }}
      >
        {ask?.kind === "rename" && (
          <div className="mt-2">
            <Field id="family-rename" label="가족 이름" value={rename} onChange={setRename} placeholder="예: 대치동 김순자 님 댁" hint="비우면 어르신 이름으로 '○○ 님 가족'이라고 보입니다. 관제 · 컨시어지 화면에서만 쓰는 이름입니다." />
          </div>
        )}
      </Confirm>
    </Panel>
  );
}
