import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { Clay, Line } from "../../components/clay";
import { Btn, Card, TONE } from "../../components/ds";
import { HOSPITAL_PARTNERS, MOU_HOSPITALS } from "../../lib/mock";
import { assigneeNow, inCenter } from "../../lib/people";
import { useAppState } from "../../lib/state";

// 제휴병원 예약 및 상담 — 회의 8. MOU 병원만, 진료 과목마다 한 곳 이상.
// 예약 요청은 해주세요(REQ-03) 요청으로 전달된다.
//
// 패스트트랙 표기는 2026-08-12 요청으로 전부 뺐다. 병원과의 우선 진료 합의가
// 문서로 확정되기 전까지 화면에서 약속하지 않는다.
//
// 대신 "기존에 다니시던 병원 등록하기"를 넣었다 (같은 시트 예약 3번) — 실제로
// 어르신은 30년 다니던 동네 병원을 바꾸지 않는다. 제휴 여부와 무관하게 동행은 간다.
//
// 2026-10-15 시안 틀 — 예약 화면의 '제휴 병원 예약' 과목 버튼이 ?dept=과목 으로 들어온다. 그 병원 카드로 내려가 테두리를 둔다.

const inputCls = "min-h-[52px] w-full rounded-[16px] border-2 border-[#E3DED3] bg-white px-3.5 text-[17px] outline-none focus:border-[#1B2340]";

export default function HospitalsPage() {
  const { state, dispatch } = useAppState();
  const router = useRouter();
  const focusDept = typeof router.query.dept === "string" ? router.query.dept : "";
  const [requested, setRequested] = useState({});
  const [form, setForm] = useState({ name: "", dept: "", note: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!focusDept) return;
    const i = MOU_HOSPITALS.findIndex((h) => h.dept === focusDept);
    if (i < 0) return;
    const t = setTimeout(() => document.getElementById(`mou-${i}`)?.scrollIntoView({ block: "center", behavior: "smooth" }), 250);
    return () => clearTimeout(t);
  }, [focusDept]);

  const requestEscort = (h) => {
    if (requested[h.name]) return;
    setRequested((r) => ({ ...r, [h.name]: true }));
    dispatch({
      type: "addRequest",
      payload: {
        id: `rq-${Date.now()}`,
        dir: "fromGuardian",
        type: "병원 예약 확인해 주세요",
        detail: `${h.dept} · ${h.name} 동행 예약을 요청합니다. ${h.note}.`,
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
    setSaved(true);
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
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {state.myHospitals.map((h) => (
                <li key={`${h.name}-${h.at}`} className="flex items-start gap-2.5 rounded-[16px] px-3.5 py-3" style={{ background: "#F3F1EC" }}>
                  <span className="min-w-0 flex-1">
                    <b className="block text-[16px] font-extrabold">{h.name}</b>
                    <span className="block text-[13px] leading-[1.6]" style={{ color: "#5E6270" }}>
                      {[h.dept, h.note].filter(Boolean).join(" · ") || "진료과 미입력"}
                    </span>
                  </span>
                  <span className="flex-none text-[13px] font-extrabold" style={{ color: TONE.green.fg }}>
                    등록됨
                  </span>
                </li>
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
              onChange={(e) => (setSaved(false), setForm((f) => ({ ...f, name: e.target.value })))}
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
              등록했습니다 — 다음 방문 때 컨시어지가 진료 일정을 함께 확인합니다
            </p>
          )}
        </Card>

        <h2 className="ds-sect ds-r m-0" style={{ "--d": "80ms" }}>
          <i aria-hidden="true" style={{ background: TONE.green.solid }} />
          제휴 병원
        </h2>

        {MOU_HOSPITALS.map((h, i) => {
          const on = h.dept === focusDept;
          return (
            <div
              key={h.name}
              id={`mou-${i}`}
              className="ds-r flex flex-col gap-2 rounded-[24px] p-4"
              style={{ "--d": `${100 + i * 30}ms`, background: TONE.green.bg, boxShadow: on ? `inset 0 0 0 3px #1B2340, 0 5px 0 ${TONE.green.sh}` : `0 5px 0 ${TONE.green.sh}` }}
            >
              <span className="self-start rounded-full bg-white px-3 py-1 text-[13px] font-extrabold" style={{ color: TONE.green.fg }}>
                {h.dept}
              </span>
              <div className="text-[19px] font-extrabold">{h.name}</div>
              <div className="text-[14px]" style={{ color: "#4A5068" }}>
                {h.note}
              </div>
              {/* 슬롯 · 동행 건수는 예시 값 — 관제 센터 공간에는 보이지 않는다 (2026-10-06 누수 점검) */}
              {HOSPITAL_PARTNERS[h.name] && !inCenter() && (
                <div className="text-[13px]" style={{ color: "#4A5068" }}>
                  가용 슬롯 <b>{HOSPITAL_PARTNERS[h.name].slots}</b> · 이번 달 K-CARE 동행 <b className="ds-num">{HOSPITAL_PARTNERS[h.name].trips}건</b>
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
