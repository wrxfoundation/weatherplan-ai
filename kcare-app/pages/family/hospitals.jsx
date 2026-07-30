import Head from "next/head";
import { useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { Card, SectionLabel, Badge } from "../../components/ui";
import { MOU_HOSPITALS } from "../../lib/mock";
import { useAppState } from "../../lib/state";

// 제휴 병원 찾기 — 회의 8. MOU 병원만, 진료 과목마다 한 곳 이상.
// 예약 요청은 해주세요(REQ-03) 요청으로 전달된다.

export default function HospitalsPage() {
  const { dispatch } = useAppState();
  const [requested, setRequested] = useState({});

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
        history: [{ at: Date.now(), status: "requested", note: "제휴 병원 찾기에서 요청" }],
        proof: null,
      },
    });
    dispatch({
      type: "pushEvent",
      payload: { kind: "예약", text: `${h.name} 동행 예약 요청 접수`, color: "#8FA9CC" },
    });
  };

  return (
    <>
      <Head>
        <title>제휴 병원 찾기 — K-CARE</title>
      </Head>
      <FamilyLayout title="제휴 병원 찾기">
        <p className="px-1 text-[12px] leading-[1.7] text-muted">
          K-CARE와 MOU를 맺은 병원만 안내합니다. 동행 예약을 요청하면 담당 컨시어지가 예약을
          확인하고 캘린더에 등록합니다.
        </p>

        {MOU_HOSPITALS.map((h) => (
          <Card key={h.name} className="p-4">
            <div className="flex items-center gap-2">
              <Badge fg="#0A1F3C" bg="rgba(10,31,60,.07)">
                {h.dept}
              </Badge>
              {h.fast && (
                <Badge fg="#1E7A5A" bg="rgba(30,122,90,.12)">
                  패스트트랙
                </Badge>
              )}
            </div>
            <div className="mt-2 text-[15px] font-bold text-navy">{h.name}</div>
            <div className="mt-0.5 text-[12px] text-muted">{h.note}</div>
            <button
              onClick={() => requestEscort(h)}
              disabled={!!requested[h.name]}
              className={`btn-press mt-3 w-full rounded-xl border py-2.5 text-[13px] font-bold ${
                requested[h.name]
                  ? "border-green/30 bg-green/10 text-green"
                  : "border-navy/20 text-navy"
              }`}
            >
              {requested[h.name] ? "요청됨 · 해주세요에서 확인" : "동행 예약 요청"}
            </button>
          </Card>
        ))}

        <Card className="p-4">
          <SectionLabel>안내</SectionLabel>
          <p className="mt-2 text-[11px] leading-[1.7] text-muted">
            목록에 없는 병원도 동행은 가능합니다 (패스트트랙 미적용). 제휴 병원은 진료 과목별로
            계속 추가됩니다.
          </p>
        </Card>
      </FamilyLayout>
    </>
  );
}
