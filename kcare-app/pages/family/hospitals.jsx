import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { Clay, Line } from "../../components/clay";
import { Btn, Card, TONE } from "../../components/ds";
import { partnerHospitals } from "../../lib/hospitals";
import { assigneeNow } from "../../lib/people";
import { hospitalKey, useAppState } from "../../lib/state";
import { CLOSED } from "../../lib/requests";

// 제휴병원 예약 및 상담 — 회의 8. MOU 병원만, 진료 과목마다 한 곳 이상.
// 예약 요청은 해주세요(REQ-03) 요청으로 전달된다.
//
// 2026-10-28 요청 2 — 목록은 관제 병원 관리와 같은 명부(가구 기록 · lib/hospitals.js)에서 '제휴'만 읽는다.
// 관제가 등록 · 수정 · 삭제하면 새로고침 없이 여기도 바뀐다. 보여 주는 값은 병원명 · 진료과 · 빠른 예약 · 가용 슬롯(있으면).
// 병원이 목록에서 빠져도 이미 보낸 요청 · 잡힌 일정은 병원 이름을 글로 갖고 있어 그대로 남는다.
//
// 패스트트랙 표기는 2026-08-12 요청으로 전부 뺐다. 병원과의 우선 진료 합의가
// 문서로 확정되기 전까지 화면에서 약속하지 않는다.
//
// 대신 "기존에 다니시던 병원 등록하기"를 넣었다 (같은 시트 예약 3번) — 실제로
// 어르신은 30년 다니던 동네 병원을 바꾸지 않는다. 제휴 여부와 무관하게 동행은 간다.
//
// 2026-10-15 시안 틀 — 예약 화면의 '제휴 병원 예약' 과목 버튼이 ?dept=과목 으로 들어온다. 그 병원 카드로 내려가 테두리를 둔다.

const inputCls = "min-h-[52px] w-full rounded-[16px] border-2 border-[#E3DED3] bg-white px-3.5 text-[17px] outline-none focus:border-[#1B2340]";
const smallBtn = "ds-press flex min-h-[44px] items-center justify-center rounded-[14px] px-3.5 text-[15px] font-extrabold";

// 등록한 병원 한 줄 — 고치기(같은 칸을 그 자리에서) · 지우기(한 번 더 묻는다) (2026-10-18)
// 보호자가 적어 둔 메모라 증명 기록이 아니다. 이미 잡힌 일정 · 해주세요는 병원 이름을 글로 갖고 있어 그대로 남는다.
function MyHospitalRow({ h, onSave, onRemove }) {
  const [mode, setMode] = useState("view"); // view · edit · confirm
  const [f, setF] = useState({ name: h.name || "", dept: h.dept || "", note: h.note || "" });
  const k = hospitalKey(h).replace(/[^A-Za-z0-9가-힣]/g, "");
  const startEdit = () => (setF({ name: h.name || "", dept: h.dept || "", note: h.note || "" }), setMode("edit"));

  if (mode === "edit") {
    return (
      <li className="flex flex-col gap-2 rounded-[16px] px-3.5 py-3" style={{ background: "#F3F1EC" }}>
        <label htmlFor={`mh-name-${k}`} className="text-[14px] font-extrabold" style={{ color: "#3A3F50" }}>
          병원 이름
        </label>
        <input id={`mh-name-${k}`} value={f.name} onChange={(e) => setF((x) => ({ ...x, name: e.target.value }))} className={inputCls} />
        <label htmlFor={`mh-dept-${k}`} className="text-[14px] font-extrabold" style={{ color: "#3A3F50" }}>
          진료과 · 담당의 (선택)
        </label>
        <input id={`mh-dept-${k}`} value={f.dept} onChange={(e) => setF((x) => ({ ...x, dept: e.target.value }))} className={inputCls} />
        <label htmlFor={`mh-note-${k}`} className="text-[14px] font-extrabold" style={{ color: "#3A3F50" }}>
          기억해야 할 것 (선택)
        </label>
        <input id={`mh-note-${k}`} value={f.note} onChange={(e) => setF((x) => ({ ...x, note: e.target.value }))} className={inputCls} />
        <div className="mt-1 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setMode("view")} className={smallBtn} style={{ background: "#FFFFFF", color: "#1B2340", boxShadow: "0 3px 0 #E3DED3" }}>
            그만두기
          </button>
          <button
            type="button"
            disabled={!f.name.trim()}
            onClick={() => (onSave(f), setMode("view"))}
            className={`${smallBtn} disabled:opacity-50`}
            style={{ background: "#1B2340", color: "#FFFFFF", boxShadow: "0 3px 0 #0E1428" }}
          >
            고친 내용 저장
          </button>
        </div>
      </li>
    );
  }
  return (
    <li className="flex flex-col gap-2 rounded-[16px] px-3.5 py-3" style={{ background: "#F3F1EC" }}>
      <div className="flex items-start gap-2.5">
        <span className="min-w-0 flex-1">
          <b className="block text-[16px] font-extrabold">{h.name}</b>
          <span className="block text-[13px] leading-[1.6]" style={{ color: "#5E6270" }}>
            {[h.dept, h.note].filter(Boolean).join(" · ") || "진료과 미입력"}
            {h.editedAt ? " · 고침" : ""}
          </span>
        </span>
        {mode === "view" && (
          <span className="flex flex-none gap-1.5">
            <button type="button" onClick={startEdit} aria-label={`${h.name} 고치기`} className={smallBtn} style={{ background: "#FFFFFF", color: "#1B2340", boxShadow: "0 3px 0 #E3DED3" }}>
              수정
            </button>
            <button type="button" onClick={() => setMode("confirm")} aria-label={`${h.name} 지우기`} className={smallBtn} style={{ background: "#FFFFFF", color: "#6E5A4A", boxShadow: "0 3px 0 #E3DED3" }}>
              삭제
            </button>
          </span>
        )}
      </div>
      {mode === "confirm" && (
        <div className="rounded-[14px] bg-white p-3">
          <p className="text-[15px] font-extrabold">이 병원을 목록에서 지울까요?</p>
          <p className="mt-0.5 text-[13px] leading-[1.6]" style={{ color: "#5E6270" }}>
            이미 잡힌 일정 · 해주세요 요청은 그대로 남습니다.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setMode("view")} className={smallBtn} style={{ background: "#F3F1EC", color: "#1B2340", boxShadow: "0 3px 0 #E3DED3" }}>
              그대로 두기
            </button>
            <button type="button" onClick={onRemove} className={smallBtn} style={{ background: "#1B2340", color: "#FFFFFF", boxShadow: "0 3px 0 #0E1428" }}>
              지우기
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function HospitalsPage() {
  const { state, dispatch } = useAppState();
  const router = useRouter();
  const focusDept = typeof router.query.dept === "string" ? router.query.dept : "";
  // 이미 보낸 예약 · 상담 요청 — 열려 있는 해주세요에서 읽는다 (화면 기억이면 새로고침 뒤 같은 요청이 또 갔다 ·
  // 해주세요에서 취소하면 다시 보낼 수 있다)
  const partners = partnerHospitals(state);
  const requested = Object.fromEntries(
    partners.filter((h) =>
      (state.requests || []).some(
        (r) => r.type === "병원 예약 확인해 주세요" && !CLOSED.includes(r.status) && (r.hospital === h.name || String(r.detail || "").startsWith(`${h.dept} · ${h.name} `))
      )
    ).map((h) => [h.name, true])
  );
  const [form, setForm] = useState({ name: "", dept: "", note: "" });
  const [saved, setSaved] = useState(""); // 마지막으로 한 일 한 줄 (등록 · 수정 · 삭제)

  const focusIdx = partners.findIndex((h) => h.dept === focusDept);
  useEffect(() => {
    if (!focusDept || focusIdx < 0) return;
    const t = setTimeout(() => document.getElementById(`mou-${focusIdx}`)?.scrollIntoView({ block: "center", behavior: "smooth" }), 250);
    return () => clearTimeout(t);
  }, [focusDept, focusIdx]);

  const requestEscort = (h) => {
    if (requested[h.name]) return;
    dispatch({
      type: "addRequest",
      payload: {
        id: `rq-${Date.now()}`,
        dir: "fromGuardian",
        type: "병원 예약 확인해 주세요",
        detail: `${h.dept} · ${h.name} 동행 예약을 요청합니다.`,
        hospital: h.name,
        amount: null,
        preferredDate: null,
        urgency: "normal",
        assignee: assigneeNow() || "",
        photos: [],
        status: "requested",
        history: [{ at: Date.now(), status: "requested", note: "제휴병원 예약 및 상담에서 요청" }],
        proof: null,
      },
    });
    dispatch({
      type: "pushEvent",
      payload: { kind: "예약", text: `${h.name} 동행 예약 요청 접수`, color: "#8FA9CC" },
    });
  };

  const saveHospital = () => {
    const name = form.name.trim();
    if (!name) return;
    dispatch({
      type: "addMyHospital",
      payload: { name, dept: form.dept.trim(), note: form.note.trim(), at: Date.now() },
    });
    dispatch({
      type: "pushEvent",
      payload: { kind: "병원", text: `기존 이용 병원 등록 — ${name}`, color: "#8FA9CC" },
    });
    setForm({ name: "", dept: "", note: "" });
    setSaved("등록했습니다 — 다음 방문 때 컨시어지가 진료 일정을 함께 확인합니다");
  };
  const editHospital = (h, f) => {
    const patch = { name: f.name.trim(), dept: f.dept.trim(), note: f.note.trim() };
    dispatch({ type: "editMyHospital", key: hospitalKey(h), patch });
    dispatch({ type: "pushEvent", payload: { kind: "병원", text: `다니시던 병원 수정 — ${patch.name}`, color: "#8FA9CC" } });
    setSaved(`'${patch.name}' 정보를 고쳤습니다`);
  };
  const removeHospital = (h) => {
    dispatch({ type: "removeMyHospital", key: hospitalKey(h), name: h.name });
    dispatch({ type: "pushEvent", payload: { kind: "병원", text: `다니시던 병원 삭제 — ${h.name}`, color: "#8FA9CC" } });
    setSaved(`'${h.name}'을(를) 목록에서 지웠습니다`);
  };

  return (
    <>
      <Head>
        <title>제휴병원 예약 및 상담 — K-CARE</title>
      </Head>
      <FamilyLayout back="/family/calendar" backLabel="예약으로 돌아가기" sub="예약" title="제휴 병원">
        <p className="ds-r px-1 text-[15px] leading-[1.7]" style={{ color: "#5E6270" }}>
          K-CARE와 MOU를 맺은 병원입니다. 예약·상담을 요청하면 담당 컨시어지가 예약을 확인하고 달력에 등록합니다.
        </p>

        {/* 기존에 다니시던 병원 등록 — 제휴 목록보다 위에 둔다.
            이미 다니는 병원이 있는 분에게는 이쪽이 먼저 할 일이다. */}
        <Card className="ds-r flex flex-col gap-3" style={{ "--d": "40ms" }}>
          <div className="flex items-center gap-3">
            <Clay name="careHospital" size={44} />
            <h2 className="m-0 text-[19px] font-extrabold">다니시던 병원 등록하기</h2>
          </div>
          <p className="text-[14px] leading-[1.7]" style={{ color: "#5E6270" }}>
            오래 다니신 병원도 등록해 주세요. 제휴 병원이 아니어도 동행은 가고, 진료 이력과 다음 예약을 같은 자리에서 관리합니다.
          </p>
          {state.myHospitals.length > 0 && (
            <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-label="등록한 병원">
              {state.myHospitals.map((h) => (
                <MyHospitalRow key={hospitalKey(h)} h={h} onSave={(f) => editHospital(h, f)} onRemove={() => removeHospital(h)} />
              ))}
            </ul>
          )}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="myhos-name" className="text-[14px] font-extrabold" style={{ color: "#3A3F50" }}>
              병원 이름
            </label>
            <input
              id="myhos-name"
              value={form.name}
              onChange={(e) => (setSaved(""), setForm((f) => ({ ...f, name: e.target.value })))}
              placeholder="예: 대치동 김내과의원"
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="myhos-dept" className="text-[14px] font-extrabold" style={{ color: "#3A3F50" }}>
              진료과 · 담당의 (선택)
            </label>
            <input id="myhos-dept" value={form.dept} onChange={(e) => setForm((f) => ({ ...f, dept: e.target.value }))} placeholder="예: 내과 · 김정호 원장" className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="myhos-note" className="text-[14px] font-extrabold" style={{ color: "#3A3F50" }}>
              기억해야 할 것 (선택)
            </label>
            <input id="myhos-note" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="예: 매달 첫째 주 화요일 혈압약 처방" className={inputCls} />
          </div>
          <Btn tone="navy" h={54} className="text-[17px] disabled:opacity-50" onClick={saveHospital} disabled={!form.name.trim()}>
            병원 등록
          </Btn>
          {saved && (
            <p role="status" className="rounded-[16px] px-3.5 py-2.5 text-[14px] font-bold" style={{ background: TONE.green.bg, color: TONE.green.fg }}>
              {saved}
            </p>
          )}
        </Card>

        <h2 className="ds-sect ds-r m-0" style={{ "--d": "80ms" }}>
          <i aria-hidden="true" style={{ background: TONE.green.solid }} />
          제휴 병원
        </h2>

        {partners.length === 0 && (
          <Card tone="stone" shadow={false} pad={14} className="text-[15px] leading-[1.7]" style={{ color: "#5E6270" }}>
            아직 등록된 제휴 병원이 없어요. 관제센터가 제휴 병원을 등록하면 여기에 바로 보입니다.
          </Card>
        )}
        {partners.map((h, i) => {
          const on = h.dept === focusDept;
          return (
            <div
              key={h.id || h.name}
              id={`mou-${i}`}
              className="ds-r flex flex-col gap-2 rounded-[24px] p-4"
              style={{ "--d": `${100 + i * 30}ms`, background: TONE.green.bg, boxShadow: on ? `inset 0 0 0 3px #1B2340, 0 5px 0 ${TONE.green.sh}` : `0 5px 0 ${TONE.green.sh}` }}
            >
              <span className="self-start rounded-full bg-white px-3 py-1 text-[13px] font-extrabold" style={{ color: TONE.green.fg }}>
                {h.dept}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[19px] font-extrabold">{h.name}</span>
                {h.fast && (
                  <span className="rounded-full px-2.5 py-0.5 text-[13px] font-extrabold" style={{ background: TONE.gold.bg, color: TONE.gold.fg }}>
                    빠른 예약
                  </span>
                )}
              </div>
              {/* 가용 슬롯 — 관제 병원 관리에 적은 것만 (비어 있으면 줄을 두지 않는다 · 지어 넣지 않는다) */}
              {h.slots && (
                <div className="text-[14px]" style={{ color: "#4A5068" }}>
                  가용 슬롯 <b>{h.slots}</b>
                </div>
              )}
              <button
                type="button"
                onClick={() => requestEscort(h)}
                disabled={!!requested[h.name]}
                className="ds-press ds-btn3d mt-1 flex min-h-[50px] items-center justify-center gap-2 rounded-[16px] text-[16px]"
                style={requested[h.name] ? { background: "#FFFFFF", color: TONE.green.fg, boxShadow: "none" } : { background: TONE.green.solid, color: "#FFFFFF", boxShadow: `0 4px 0 ${TONE.green.solidSh}` }}
              >
                {requested[h.name] && <Line name="check" size={20} />}
                {requested[h.name] ? "요청됨 · 해주세요에서 확인" : "예약 · 상담 요청"}
              </button>
            </div>
          );
        })}

        <Card tone="stone" shadow={false} pad={14} className="text-[14px] leading-[1.7]" style={{ color: "#5E6270" }}>
          목록에 없는 병원도 동행은 가능하며, 제휴 병원은 진료 과목별로 계속 추가됩니다.
        </Card>
      </FamilyLayout>
    </>
  );
}
