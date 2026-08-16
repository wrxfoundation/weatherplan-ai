import Head from "next/head";
import { useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { Card, SectionLabel, Badge, PrimaryButton } from "../../components/ui";
import { HOSPITAL_PARTNERS, MOU_HOSPITALS } from "../../lib/mock";
import { useAppState } from "../../lib/state";

// 제휴병원 예약 및 상담 — 회의 8. MOU 병원만, 진료 과목마다 한 곳 이상.
// 예약 요청은 해주세요(REQ-03) 요청으로 전달된다.
//
// 패스트트랙 표기는 2026-08-12 요청으로 전부 뺐다. 병원과의 우선 진료 합의가
// 문서로 확정되기 전까지 화면에서 약속하지 않는다.
//
// 대신 "기존에 다니시던 병원 등록하기"를 넣었다 (같은 시트 예약 3번) — 실제로
// 어르신은 30년 다니던 동네 병원을 바꾸지 않는다. 제휴 여부와 무관하게 동행은 간다.

export default function HospitalsPage() {
  const { state, dispatch } = useAppState();
  const [requested, setRequested] = useState({});
  const [form, setForm] = useState({ name: "", dept: "", note: "" });
  const [saved, setSaved] = useState(false);

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
        assignee: "박지현",
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
      <FamilyLayout title="제휴병원 예약 및 상담">
        <p className="px-1 text-[13px] leading-[1.7] text-muted">
          K-CARE와 MOU를 맺은 병원입니다. 예약·상담을 요청하면 담당 컨시어지가 예약을 확인하고
          캘린더에 등록합니다.
        </p>

        {/* 기존에 다니시던 병원 등록 — 제휴 목록보다 위에 둔다.
            이미 다니는 병원이 있는 분에게는 이쪽이 먼저 할 일이다. */}
        <Card className="p-[18px]">
          <div className="text-[17px] font-black text-navy">다니시던 병원 등록하기</div>
          <p className="mt-1 text-[13px] leading-[1.7] text-muted">
            오래 다니신 병원이 있다면 등록해 주세요. 제휴 병원이 아니어도 동행은 갑니다 — 등록해
            두시면 진료 이력과 다음 예약을 같은 자리에서 관리합니다.
          </p>
          {state.myHospitals.length > 0 && (
            <div className="mt-3 space-y-2">
              {state.myHospitals.map((h) => (
                <div key={`${h.name}-${h.at}`} className="flex items-start gap-2 rounded-xl bg-navy/[.04] px-3 py-2.5">
                  <span className="mt-[6px] h-[7px] w-[7px] shrink-0 rounded-full bg-navy/40" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-bold text-navy">{h.name}</div>
                    <div className="mt-0.5 text-[12px] leading-[1.6] text-muted">
                      {[h.dept, h.note].filter(Boolean).join(" · ") || "진료과 미입력"}
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] font-bold text-green">등록됨</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 space-y-2">
            <div>
              <label htmlFor="myhos-name" className="text-[12px] font-bold text-muted">
                병원 이름
              </label>
              <input
                id="myhos-name"
                value={form.name}
                onChange={(e) => (setSaved(false), setForm((f) => ({ ...f, name: e.target.value })))}
                placeholder="예: 대치동 김내과의원"
                className="mt-1 w-full rounded-xl border border-navy/15 px-3.5 py-3 text-[16px] outline-none focus:border-gold"
              />
            </div>
            <div>
              <label htmlFor="myhos-dept" className="text-[12px] font-bold text-muted">
                진료과 · 담당의 (선택)
              </label>
              <input
                id="myhos-dept"
                value={form.dept}
                onChange={(e) => setForm((f) => ({ ...f, dept: e.target.value }))}
                placeholder="예: 내과 · 김정호 원장"
                className="mt-1 w-full rounded-xl border border-navy/15 px-3.5 py-3 text-[16px] outline-none focus:border-gold"
              />
            </div>
            <div>
              <label htmlFor="myhos-note" className="text-[12px] font-bold text-muted">
                기억해야 할 것 (선택)
              </label>
              <input
                id="myhos-note"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="예: 매달 첫째 주 화요일 혈압약 처방"
                className="mt-1 w-full rounded-xl border border-navy/15 px-3.5 py-3 text-[16px] outline-none focus:border-gold"
              />
            </div>
          </div>
          <PrimaryButton className="mt-3" onClick={saveHospital} disabled={!form.name.trim()}>
            병원 등록
          </PrimaryButton>
          {saved && (
            <p className="mt-2 rounded-xl bg-green/10 px-3.5 py-2.5 text-[13px] font-bold text-green">
              등록했습니다 — 다음 방문 때 컨시어지가 진료 일정을 함께 확인합니다
            </p>
          )}
        </Card>

        <SectionLabel>제휴 병원</SectionLabel>

        {MOU_HOSPITALS.map((h) => (
          <Card key={h.name} className="p-4">
            <div className="flex items-center gap-2">
              <Badge fg="#0A1F3C" bg="rgba(10,31,60,.07)">
                {h.dept}
              </Badge>
            </div>
            <div className="mt-2 text-[17px] font-bold text-navy">{h.name}</div>
            <div className="mt-0.5 text-[13px] text-muted">{h.note}</div>
            {HOSPITAL_PARTNERS[h.name] && (
              <div className="mt-1.5 text-[12px] text-muted">
                가용 슬롯 <b className="text-ink">{HOSPITAL_PARTNERS[h.name].slots}</b> · 이번 달
                K-CARE 동행 <b className="font-num text-ink">{HOSPITAL_PARTNERS[h.name].trips}건</b>
              </div>
            )}
            <button
              onClick={() => requestEscort(h)}
              disabled={!!requested[h.name]}
              className={`btn-press mt-3 w-full rounded-xl border py-2.5 text-[15px] font-bold ${
                requested[h.name]
                  ? "border-green/30 bg-green/10 text-green"
                  : "border-navy/20 text-navy"
              }`}
            >
              {requested[h.name] ? "요청됨 · 해주세요에서 확인" : "예약 · 상담 요청"}
            </button>
          </Card>
        ))}

        <Card className="p-4">
          <SectionLabel>안내</SectionLabel>
          <p className="mt-2 text-[12px] leading-[1.7] text-muted">
            목록에 없는 병원도 동행은 가능합니다. 제휴 병원은 진료 과목별로 계속 추가됩니다.
          </p>
        </Card>
      </FamilyLayout>
    </>
  );
}
