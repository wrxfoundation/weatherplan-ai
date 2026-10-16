import Head from "next/head";
import Link from "next/link";
import { useEffect } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { WeekBars } from "../../components/GuardianCharts";
import { Clay, Line } from "../../components/clay";
import { Card, TONE } from "../../components/ds";
import { RESULT_TONE, STATE_ORDER, VISIT_REPORT } from "../../lib/visit-report";
import { STAGE_LABEL, visitReportOf } from "../../lib/live-household";
import { FIT3_INFO } from "../../lib/mock";
import { fitMonth } from "../../lib/demo-health";
import { useAppState } from "../../lib/state";
import { useAuth } from "../../lib/auth";

// 마이 › 방문 리포트 (2026-10-15 디자인 시안 '보호자 리포트 · 베타') — 휴대폰에서 읽는 판.
// 내용은 안심방문 리포트 그대로다: 데모는 실무진 예시 리포트(lib/visit-report.js), 테스트 가구는 관제가 보낸 실제 방문 기록(visitReportOf).
// 시안의 '대화 기록 · 모션 센서 · 주간 기간'은 우리 데이터에 없는 것이라 그리지 않는다 — 있는 항목(몸 · 마음 · 집 21가지)을 시안의 모양으로 옮겼다.
// A4 문서(인쇄 · PDF 저장)는 /report/visit 한 곳 — 아래 'PDF로 저장 (A4)'가 그리로 간다.
// '위험'만 빨강이다 — 이 리포트의 위험은 실제 건강 위험 신호다 (lib/visit-report.js RESULT_TONE 주석).

const AXIS_CLAY = { 몸: "heartPulse", 마음: "together", 집: "houseCheck" };
const worst = (items) => [...STATE_ORDER].reverse().find((s) => items.some((i) => i.state === s)) || "양호";
const ymd = (t) => (t ? new Date(Number(t) + 9 * 3600 * 1000).toISOString().slice(0, 10).replace(/-/g, ".") : "—");

function StateChip({ state }) {
  const t = RESULT_TONE[state];
  if (!t) return null;
  return (
    <span className="inline-flex flex-none items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-extrabold" style={{ background: t.bg, color: t.fg }}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: t.dot }} />
      {state}
    </span>
  );
}

function PdfButton() {
  return (
    <Link
      href="/report/visit?from=family"
      className="ds-press ds-btn3d ds-r flex min-h-[56px] items-center justify-center gap-2 rounded-[20px] text-[17px] text-white"
      style={{ background: "#1B2340", boxShadow: "0 5px 0 #0E1428" }}
    >
      <Line name="doc" size={20} />
      PDF로 저장 (A4)
    </Link>
  );
}

function DemoReport() {
  const H = VISIT_REPORT.head;
  const week = fitMonth().slice(-7);
  return (
    <>
      <div className="ds-hero ds-r text-white" style={{ "--d": "40ms", background: "#1B2340" }}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-extrabold text-white/70">K-CARE 보호자 리포트 · 베타 · 예시</span>
          <span className="flex-none rounded-full bg-white px-2.5 py-1 text-[13px] font-extrabold" style={{ color: "#1B2340" }}>
            {H.verdict}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[32px] font-black leading-[1.2]">{H.client}</span>
          <span className="text-[15px] text-white/80">
            {H.honorific} · {H.age}세
          </span>
        </div>
        <div className="text-[14px] leading-[1.6] text-white/80">
          {H.visitedAt} 방문 · {H.round}회차 (지난 방문 {H.prevAt})
          <br />
          담당 컨시어지 {H.concierge} · {H.tags}
        </div>
        <div className="flex flex-wrap gap-3 text-[12px] font-bold text-white/75">
          {STATE_ORDER.map((s) => (
            <span key={s} className="inline-flex items-center gap-1">
              <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: RESULT_TONE[s].dot }} />
              {s}
            </span>
          ))}
        </div>
      </div>

      <Card className="ds-r flex flex-col gap-3" style={{ "--d": "80ms" }}>
        <p className="text-[16px] leading-[1.7]">
          <b>총평 </b>
          {VISIT_REPORT.summary}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {VISIT_REPORT.axes.map((a) => {
            const w = worst(a.items);
            return (
              <span key={a.axis} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-extrabold" style={{ background: RESULT_TONE[w].bg, color: RESULT_TONE[w].fg }}>
                {a.axis} · {w}
              </span>
            );
          })}
        </div>
      </Card>

      {VISIT_REPORT.axes.map((a, k) => (
        <Card key={a.axis} className="ds-r flex flex-col gap-1" style={{ "--d": `${160 + k * 30}ms` }}>
          <div className="flex items-center gap-2.5 border-b-2 pb-2" style={{ borderColor: "#1B2340" }}>
            <Clay name={AXIS_CLAY[a.axis] || "reportDoc"} size={32} />
            <h2 className="m-0 flex-1 text-[19px] font-extrabold">{a.axis}</h2>
            <span className="text-[13px] font-bold" style={{ color: "#5E6270" }}>
              {a.items.length}가지
            </span>
          </div>
          <ul className="m-0 list-none p-0">
            {a.items.map((i) => (
              <li key={i.k} className="ds-row items-start">
                <span className="ds-k">
                  <b className="!text-[16px]">
                    {i.k}
                    {i.tag && (
                      <span className="ml-1.5 rounded-full px-2 py-0.5 align-middle text-[11px] font-extrabold" style={{ background: "#F3F1EC", color: "#5E6270" }}>
                        {i.tag}
                      </span>
                    )}
                  </b>
                  <small className="leading-[1.55]">{i.note}</small>
                </span>
                <StateChip state={i.state} />
              </li>
            ))}
          </ul>
        </Card>
      ))}

      {/* 몸 신호 — 워치 예시 (보호자 홈 '수면'과 같은 FIT_WEEK) */}
      <Card className="ds-r flex flex-col gap-2.5" style={{ "--d": "260ms" }}>
        <div className="flex items-center gap-2.5 border-b-2 pb-2" style={{ borderColor: "#1B2340" }}>
          <Line name="watch" size={24} />
          <h2 className="m-0 flex-1 text-[19px] font-extrabold">몸 신호</h2>
          <span className="text-[13px] font-bold" style={{ color: "#5E6270" }}>
            {FIT3_INFO.device} · 예시
          </span>
        </div>
        <div className="text-[14px] font-extrabold">요일별 수면 (시간)</div>
        <WeekBars label="최근 7일 수면" days={week.map((d) => ({ label: d.label, value: d.sleep, text: d.sleep.toFixed(1) }))} color="#1B2340" dark={(v) => v < 6} max={8} />
        <div className="ds-src">진한 막대는 6시간 아래로 내려간 날이에요 · 생활 참고용 수치이며 의료 판단이 아닙니다</div>
      </Card>

      {/* 보호자께 꼭 — 리포트에서 유일하게 행동을 요구하는 자리 (시안 순서대로 맨 아래, PDF 바로 위) */}
      <div className="ds-r flex flex-col gap-2.5 rounded-[26px] p-[18px] text-white" style={{ "--d": "280ms", background: "#1B2340" }}>
        <h2 className="m-0 text-[18px] font-extrabold">보호자께 부탁드려요</h2>
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {VISIT_REPORT.guardianTodos.map((t, i) => (
            <li key={i} className="flex gap-2.5 text-[15px] leading-[1.6]">
              <span className="ds-num flex-none font-black" style={{ color: TONE.gold.solid }}>
                {i + 1}
              </span>
              <span>
                <b className="text-white/70">{t.tag} · </b>
                {t.text}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <PdfButton />
      <p className="px-1 text-[13px] leading-[1.6]" style={{ color: "#5E6270" }}>
        관찰 기록이며 진단 · 판단이 아닙니다 · 데모 예시 리포트 (실무진 시안 2026-08-28)
      </p>
    </>
  );
}

function LiveReport() {
  const { state, dispatch } = useAppState();
  const r = visitReportOf(state);
  // '보호자 열람'은 보호자 계정이 열었을 때만 — 컨시어지 · 관제가 같은 주소를 열어도 열람으로 치지 않는다 (2026-10-02 코드 점검)
  const asGuardian = useAuth().user?.role === "guardian";
  useEffect(() => {
    if (asGuardian && r.sent && !r.viewed) dispatch({ type: "visitViewed" });
  }, [asGuardian, r.sent, r.viewed, dispatch]);

  if (!r.sent)
    return (
      <Card tone="stone" shadow={false} pad={22} className="ds-r flex flex-col items-center gap-2 text-center" style={{ "--d": "40ms" }}>
        <Clay name="reportDoc" size={52} />
        <div className="text-[19px] font-black">이번 방문 리포트는 아직 오지 않았어요</div>
        <p className="text-[15px] leading-[1.7]" style={{ color: "#5E6270" }}>
          컨시어지가 방문을 마치면 관제가 기록을 검수한 뒤 보내 드립니다.
          <br />
          지금 단계: <b style={{ color: "#1B2340" }}>{STAGE_LABEL[r.stage]}</b>
          {r.stage === "active" ? ` · 점검 ${r.done}/${r.total}` : ""}
        </p>
      </Card>
    );

  return (
    <>
      <div className="ds-hero ds-r text-white" style={{ "--d": "40ms", background: "#1B2340" }}>
        <span className="text-[13px] font-extrabold text-white/70">K-CARE 보호자 리포트 · 실제 방문 기록</span>
        <div className="flex items-baseline gap-2">
          <span className="text-[32px] font-black leading-[1.2]">{r.client}</span>
          <span className="text-[15px] text-white/80">어르신</span>
        </div>
        <div className="text-[14px] leading-[1.6] text-white/80">
          {ymd(r.visitedTs)} 방문 · 담당 컨시어지 {r.concierge.pri}
          <br />
          관제 검수 {r.reviewedAt || "—"} · 발송 {r.sentAt}
        </div>
      </div>

      <Card className="ds-r flex flex-col gap-3" style={{ "--d": "80ms" }}>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[["확인", `${r.done}/${r.total}`], ...r.axes.map((a) => [a.axis, `${a.items.filter((i) => i.done).length}/${a.items.length}`])].map(([k, v]) => (
            <div key={k} className="rounded-[14px] py-2" style={{ background: "#F3F1EC" }}>
              <div className="text-[12px] font-bold" style={{ color: "#5E6270" }}>
                {k}
              </div>
              <div className="ds-num text-[18px] font-black">{v}</div>
            </div>
          ))}
        </div>
        <p className="text-[16px] leading-[1.7]">
          <b>총평 </b>
          {r.memo || "컨시어지가 남긴 총평이 없습니다."}
        </p>
        <p className="text-[13px]" style={{ color: "#5E6270" }}>
          현장 사진 {r.photos}장 · 사진 파일은 베타에서 저장하지 않습니다
        </p>
      </Card>

      {r.axes.map((a, k) => (
        <Card key={a.axis} className="ds-r flex flex-col gap-1" style={{ "--d": `${120 + k * 30}ms` }}>
          <div className="flex items-center gap-2.5 border-b-2 pb-2" style={{ borderColor: "#1B2340" }}>
            <Clay name={AXIS_CLAY[a.axis] || "reportDoc"} size={32} />
            <h2 className="m-0 flex-1 text-[19px] font-extrabold">{a.axis}</h2>
            <span className="text-[13px] font-bold" style={{ color: "#5E6270" }}>
              확인 {a.items.filter((i) => i.done).length}/{a.items.length}
            </span>
          </div>
          <ul className="m-0 list-none p-0">
            {a.items.map((i) => (
              <li key={i.k} className="ds-row items-start">
                <span className="ds-k">
                  <b className="!text-[16px]">{i.k}</b>
                  {i.note && <small className="leading-[1.55]">{i.note}</small>}
                </span>
                {i.grade ? (
                  <StateChip state={i.grade} />
                ) : (
                  <span
                    className="flex-none rounded-full px-2.5 py-1 text-[13px] font-extrabold"
                    style={i.done ? { background: TONE.green.bg, color: TONE.green.fg } : { background: "#EEEDEA", color: "#5E5A52" }}
                  >
                    {i.done ? "확인함" : "이번엔 보지 않음"}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      ))}

      <PdfButton />
      <p className="px-1 text-[13px] leading-[1.6]" style={{ color: "#5E6270" }}>
        컨시어지 방문 기록 → 관제 검수 → 보호자 발송 · 관찰 기록이며 진단 · 판단이 아닙니다 · 확인하지 않은 항목은 이번 방문에서 보지 않은 것입니다
      </p>
    </>
  );
}

export default function GuardianReportPage() {
  const live = !!useAuth().user?.household;
  return (
    <>
      <Head>
        <title>방문 리포트 — K-CARE</title>
      </Head>
      <FamilyLayout back="/family/my" backLabel="마이로 돌아가기" sub="마이" title="방문 리포트">
        {live ? <LiveReport /> : <DemoReport />}
      </FamilyLayout>
    </>
  );
}
