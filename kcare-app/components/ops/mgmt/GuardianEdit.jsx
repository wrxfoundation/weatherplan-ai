// 관제 보호자 관리 › 기본정보 [편집] (2026-10-28 업데이트 요청 4).
// 휴대전화 · 거주지역(국내/해외 · 도시 · 시차) · 연락 가능시간 · 야간 연락 · 연락 우선순위 · 역할 · 연락 수신동의.
// 저장 → 수정 사유(4자 이상) 필수 → 수정 이력 → 보호자 앱 마이 · SOS 화면도 같은 값 (state.guardianInfo).
// 수신동의 · 야간 연락은 본인 동의 항목이라 바꾸면 보호자 앱에 알림이 간다 — 사유에 보호자 요청(전화) 등을 꼭 적는다.
// 주 보호자의 역할은 잠근다 — 주 보호자를 다른 사람으로 바꾸는 것은 결제 권한과 엮여 있어 별도 절차.
import { useState } from "react";
import { Field, KV, Note, Toggle } from "../ui";
import { SaveBar, useSave } from "./StaffEdit";
import { CONSENT_ITEMS, GUARDIAN_ROLES_EDIT, WHERE, tzText } from "../../../lib/ops-records";

const blank = (v) => (v && v !== "—" && !/미입력|등록 필요/.test(String(v)) ? String(v) : "");
const consentText = (c) => CONSENT_ITEMS.map(([k, l]) => `${l} ${c[k] ? "받음" : "안 받음"}`).join(" · ");
const placeText = (x) => `${x.where} · ${x.city || "도시 미입력"}${x.where === "해외" ? ` · ${tzText(x.tz === "" ? null : Number(x.tz))}` : ""}`;

function Switch({ id, label, hint, on, onChange }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-navy/[.04] px-3 py-2.5">
      <label htmlFor={id} className="text-[13px] font-medium text-ink">
        {label}
        {hint && <span className="block text-[11px] text-muted">{hint}</span>}
      </label>
      <Toggle id={id} on={on} onChange={onChange} label={label} />
    </div>
  );
}

export function GuardianInfoForm({ g, onSave, onCancel }) {
  const locked = g.role === "주";
  const [init] = useState(() => ({
    tel: blank(g.tel),
    where: g.tz != null ? "해외" : "국내",
    city: blank(g.region),
    tz: g.tz != null ? String(g.tz) : "",
    hours: blank(g.hours),
    night: !!g.night,
    sosOrder: String(g.sosOrder || 1),
    role: g.role,
    consent: { call: !!g.consent?.call, sms: !!g.consent?.sms, push: !!g.consent?.push },
  }));
  const [f, setF] = useState(init);
  const s = useSave(onSave);
  const set = (k) => (v) => {
    setF((x) => ({ ...x, [k]: v }));
    s.setErr("");
  };
  const setC = (k) => (v) => {
    setF((x) => ({ ...x, consent: { ...x.consent, [k]: v } }));
    s.setErr("");
  };
  const consentMoved = consentText(init.consent) !== consentText(f.consent) || init.night !== f.night;
  const roles = [...new Set([...GUARDIAN_ROLES_EDIT, ...(locked ? [] : [init.role])])].filter(Boolean);

  const submit = () => {
    const t = { ...f, tel: f.tel.replace(/\s+/g, " ").trim(), city: f.city.replace(/\s+/g, " ").trim(), hours: f.hours.replace(/\s+/g, " ").trim(), tz: String(f.tz).trim() };
    const digits = t.tel.replace(/\D/g, "").length;
    const tzN = Number(t.tz);
    const bad =
      t.tel && (!/^[0-9+\-() ]+$/.test(t.tel) || digits < 8)
        ? "휴대전화 번호를 확인해 주세요 (숫자 8자리 이상)."
        : t.where === "해외" && (t.tz === "" || !Number.isFinite(tzN) || Math.abs(tzN) > 24)
          ? "해외 거주면 시차를 적어 주세요 — KST 기준 시간 (예: LA −16, 시드니 1)."
          : "";
    const fields = [
      ["휴대전화", init.tel, t.tel],
      ["거주지역", placeText(init), placeText(t)],
      ["연락 가능시간", init.hours, t.hours],
      ["야간 연락", init.night ? "가능" : "안 함", t.night ? "가능" : "안 함"],
      ["연락 우선순위", `${init.sosOrder}순위`, `${t.sosOrder}순위`],
      ...(locked ? [] : [["역할", `${init.role} 보호자`, `${t.role} 보호자`]]),
      ["연락 수신동의", consentText(init.consent), consentText(t.consent)],
    ]
      .filter(([, a, b]) => a !== b)
      .map(([field, before, after]) => ({ field, before: before || "—", after: after || "—" }));
    const patch = {
      tel: t.tel,
      where: t.where,
      city: t.city,
      tz: t.where === "해외" ? tzN : null,
      hours: t.hours,
      night: t.night,
      sosOrder: Number(t.sosOrder),
      ...(locked ? {} : { role: t.role }),
      consent: t.consent,
    };
    s.save(patch, fields, bad, { notify: consentMoved, prev: { consent: init.consent, night: init.night } });
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted">앱 계정 · 연결 어르신(가입 · 초대로만) · 보호자 요청사항(기록)은 고치지 않습니다.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="gi-tel" label="휴대전화" type="tel" value={f.tel} onChange={set("tel")} placeholder="010-0000-0000" />
        <Field id="gi-hours" label="연락 가능시간" value={f.hours} onChange={set("hours")} placeholder="예) 08:00–22:00 · 현지 09:00–21:00" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field id="gi-where" label="거주" value={f.where} onChange={set("where")} options={WHERE} />
        <Field id="gi-city" label="도시 · 지역" value={f.city} onChange={set("city")} placeholder={f.where === "해외" ? "예) LA · 시드니" : "예) 서울 강남구"} />
        {f.where === "해외" ? (
          <Field id="gi-tz" label="시차 (KST 기준 · 시간)" type="number" value={f.tz} onChange={set("tz")} placeholder="예) -16" hint={f.tz !== "" && Number.isFinite(Number(f.tz)) ? tzText(Number(f.tz)) : "현지시간 계산에 씁니다"} />
        ) : (
          <div className="self-end pb-2 text-[11px] text-muted">국내 — 시차 없음</div>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="gi-order" label="연락 우선순위" value={f.sosOrder} onChange={set("sosOrder")} options={["1", "2", "3", "4", "5"]} hint="SOS · 긴급 연락 때 몇 번째로 거는지" />
        {locked ? (
          <div>
            <KV k="역할" v="주 보호자 (잠금)" />
            <p className="text-[11px] text-muted">주 보호자를 다른 사람으로 바꾸는 것은 결제 권한과 엮여 있어 별도 절차입니다.</p>
          </div>
        ) : (
          <Field id="gi-role" label="역할" value={f.role} onChange={set("role")} options={roles} hint="주 보호자로 올리는 것은 별도 절차" />
        )}
      </div>
      <div>
        <h3 className="text-[13px] font-bold text-navy">연락 수신동의</h3>
        <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
          {CONSENT_ITEMS.map(([k, l]) => (
            <Switch key={k} id={`gi-c-${k}`} label={`${l} 수신`} on={f.consent[k]} onChange={setC(k)} />
          ))}
          <Switch id="gi-night" label="야간 연락 가능" hint="22:00 이후" on={f.night} onChange={set("night")} />
        </div>
        {consentMoved && (
          <div className="mt-2">
            <Note tone="warn">수신동의 · 야간 연락은 보호자 본인의 동의 항목입니다 — 사유에 보호자 요청(전화 · 날짜) 등을 꼭 적어 주세요. 바꾼 사실은 저장할 때 보호자 앱에 알림으로 갑니다.</Note>
          </div>
        )}
      </div>
      <SaveBar id="gi" s={s} onCancel={onCancel} onSave={submit} hint="사유 없이는 저장되지 않습니다. 저장하면 바뀐 칸마다 이 보호자의 수정 이력에 남고, 보호자 앱 마이에도 같은 값으로 보입니다." />
    </div>
  );
}
