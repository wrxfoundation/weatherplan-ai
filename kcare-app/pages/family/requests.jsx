import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { payHref } from "../../lib/payments";
import FamilyLayout from "../../components/FamilyLayout";
import { Clay, Line } from "../../components/clay";
import { Btn, Card, EvenGrid, Sheet, SheetTitle, TONE, WhiteBtn } from "../../components/ds";
import { STATUS, GUARDIAN_PRESETS, SERVICE_MENU, SERVICE_PLUS, URGENCY, CANCEL_FREE_DAYS, CLOSED, approverOf, canEditRequest, cancelRule, customerStatusLabel, fmtPreferred, fmtScheduled, isStoreOrder, isVisitCall, kstYmd, paymentOf } from "../../lib/requests";
import { EXTRA_PERSON_FEE, addMin, clock12, dateLabel, durStart, durText, kstHm, menuOf, nextAppt, nextApptStart, priceOf, reqTitle, svcTitle } from "../../lib/booking";
import { fmtWon } from "../../lib/config";
import { useAppState } from "../../lib/state";
import { assigneeNow, elderNameOf } from "../../lib/people";
import { BookingPicker, ConfirmSteps, DurationStepper, PeoplePick } from "../../components/BookingParts";
import { honorific } from "../../lib/tracks";
import WelfareList from "../../components/WelfareList";
import { ASK_GUARDIAN, matchWelfare, profileFor, welfareCounts } from "../../lib/welfare";

// 양방향 "해주세요" — REQ-03 + 2026-10-05 운영 결정 (lib/requests.js 머리말)
// 보호자 화면: 요청(금액이 있으면 그 자리에서 결제) → 담당 컨시어지 확인 → 관제 승인 → 일정 확정 (2026-10-22).
// 신청서는 날짜(내일 ~ 1년) · 시작 시간(오전 7시 ~ 오후 8시 · 30분) · 이용 시간(− / +)을 고르고, 금액 · 끝나는 시간이 바로 바뀐다.
// 가족 누구나 금액 제한 없이 결제한다 (주 · 부 보호자 모두 · 2026-10-22). 확정 전까지 목록 상태는 '확정 대기'.
// 컨시어지 제안 중 승인 대상이 보호자인 것은 여기서 수락(결제) · 거절한다.
// 확정 뒤 취소는 서비스일 3일 전까지 바로, 그 안은 관제 승인.
//
// 2026-10-15 디자인 시안 '해주세요': 맨 위 보호자가 할 일(결제 · 수락 대기) 큰 카드 → 진행 중인 요청 →
// 나라 지원 혜택 → 병원 · 생활 타일 → 곧 열려요. 시안의 산호색 결제 카드는 금색으로 (빨강 계열은 위험 신호 전용).
// 타일의 짧은 요금은 lib/requests.js 요금 문구에서 뽑는다 — 금액을 이 화면에 따로 적지 않는다.

const man = (n) => `${(n / 10000).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}만원`;
function shortPrice(s) {
  const L = String(s.priceLabel || "");
  if (/^무료/.test(L)) return "무료";
  if (s.point && /24시간 접수/.test(s.point)) return "24시간 접수";
  let m = L.match(/시간당\s*([\d,]{4,})원/);
  if (m) return `시간당 ${man(Number(m[1].replace(/,/g, "")))}`;
  m = L.match(/1회.*?([\d,]{4,})원/);
  if (m) return `1회 ${man(Number(m[1].replace(/,/g, "")))}`;
  if (/견적/.test(L)) return "견적 후 진행";
  if (s.amount == null) return "요금 확정 전";
  return fmtWon(s.amount);
}

// 서비스 타일 — 분류 색 (병원 초록 · 생활 파랑 · 집 고칠 일 베이지 · 응급은 위험 신호라 빨강 계열).
// 병원 동행 두 가지는 색을 나눈다 — 병원동행(선생님 한 분)이 먼저, 든든 병원동행(선생님 두 분)은 보라 (2026-10-23 요청).
// 두 칸 그리드의 왼쪽 줄에 위아래로 붙여 둔다 (한 분 바로 아래 두 분)
const SECTIONS = [
  {
    title: "병원",
    tone: "green",
    tiles: [
      { no: 3, label: "병원동행", sub: "선생님 한 분", clay: "escort1" },
      { no: 1, label: "병원 예약 대행", clay: "hospitalBook" },
      { no: 2, label: "든든 병원동행", sub: "선생님 두 분", clay: "escort2", tone: "purple" },
      { no: 4, label: "요양병원 케어", clay: "careHospital" },
      { no: 13, label: "약국 심부름", clay: "pill" },
    ],
  },
  {
    title: "생활",
    tone: "blue",
    tiles: [
      { no: 5, label: "추가 안심방문", clay: "safeVisit" },
      { no: 6, label: "함께 해요", clay: "together" },
      { no: 15, label: "함께가요", clay: "outing" },
      { no: 14, label: "자녀 · 손주 동행", clay: "escort2" },
      { no: 12, label: "응급 대응", clay: "siren", tone: "danger" },
    ],
  },
];
const PLUS_TILES = [
  { key: "handyman", label: "핸디맨", clay: "wrench" },
  { key: "builder", label: "공사맨", clay: "cloche" },
  { key: "rental", label: "가전 렌탈", clay: "purifier" },
];
const INACTIVE = SERVICE_MENU.filter((s) => !s.active);
// 복약이 바뀌었을 때 — 복약 미션 화면의 '약이 바뀌었어요'가 ?ask=med 로 연다. 다음 방문 때 새 약봉투를 보고 담당 컨시어지가 고친다
const MED_CHANGE = {
  no: "med-change",
  name: "약이 바뀌었어요",
  priceLabel: "무료 · 담당 컨시어지가 새 약봉투를 보고 복약 일정을 고칩니다",
  amount: 0,
  detail: "바뀐 약 이름 · 먹는 때(아침 · 점심 · 저녁) · 바뀐 날을 적어 주세요.",
};

// 요청 그림 — 제목에서 짐작한다 (없으면 문서)
function reqClay(r) {
  const t = `${r.type} ${r.detail || ""}`;
  if (/슬리퍼/.test(t)) return "goods_slippers";
  if (/매트/.test(t)) return "goods_mat";
  if (/확대경/.test(t)) return "goods_magnifier";
  if (/응급/.test(t)) return "siren";
  if (/복지/.test(t)) return "welfareDoc";
  if (/(^|[^예])약/.test(r.type)) return "pill"; // '예약'의 약은 빼고 (병원 예약 대행이 알약으로 나오던 것)
  if (/병원|진료|검진/.test(t)) return "hospitalBook";
  if (/동행/.test(t)) return "escort1";
  if (/집|곰팡이|환기|수리|핸디맨|공사/.test(t)) return "houseSearch";
  if (/방문/.test(t)) return "safeVisit";
  if (/함께/.test(t)) return "together";
  return "reportDoc";
}
// 상태 칩 색 — 기다림 금색 · 확정/진행 파랑 · 완료 초록 · 끝난 것 회색
const chipTone = (s) =>
  ["awaitingPayment", "cancelRequested", "needsAdmin"].includes(s)
    ? { background: TONE.gold.bg, color: TONE.gold.fg }
    : s === "requested"
      ? { background: TONE.blue.bg, color: TONE.blue.fg }
      : ["confirmed", "inProgress"].includes(s)
        ? { background: TONE.blue.bg, color: TONE.blue.fg }
        : s === "done"
          ? { background: TONE.green.bg, color: TONE.green.fg }
          : { background: "#EEEDEA", color: "#5E5A52" };

export default function RequestsPage() {
  const { state, dispatch } = useAppState();
  const [creating, setCreating] = useState(false); // false | true | 서비스 메뉴 항목
  const [openId, setOpenId] = useState(null);
  const [wanted, setWanted] = useState({}); // 미개시 서비스 수요 신호 — no 별 1회
  const [welfareOpen, setWelfareOpen] = useState(false);
  const [closedOpen, setClosedOpen] = useState(false);
  const [editing, setEditing] = useState(null); // 내용을 고치는 요청 (승인 전 · 보호자가 낸 것)
  const ob = state.onboarding;
  const honor = honorific(ob); // 고객 호칭 — "~~님" (2026-08-12 시트)
  const router = useRouter();

  // 복약 미션 '약이 바뀌었어요' → 요청 시트를 바로 연다 (한 번만 · 주소는 그대로 둔다)
  useEffect(() => {
    if (router.query.ask === "med") {
      setCreating(MED_CHANGE);
      router.replace("/family/requests", undefined, { shallow: true });
    }
  }, [router.query.ask]); // eslint-disable-line react-hooks/exhaustive-deps

  const active = state.requests.filter((r) => !CLOSED.includes(r.status));
  const closed = state.requests.filter((r) => CLOSED.includes(r.status));
  // 보호자가 할 일 — 결제 대기 + 승인 대상이 보호자인 컨시어지 제안 (홈 '결제 · 수락 대기'와 같은 기준)
  const isTodo = (r) => r.status === "awaitingPayment" || (r.status === "requested" && approverOf(r) === "guardian");
  const todo = active.filter(isTodo);
  const others = active.filter((r) => !isTodo(r));

  // 복지혜택 (2026-09-04 시트 앱 전체 3번) — 관제가 자동 매칭한 것을 보호자가 확인·신청한다.
  // 답(answers)은 관제·컨시어지·어르신 화면이 같이 본다.
  const honorName = elderNameOf(ob);
  const answers = state.welfare?.answers || {};
  const welfareMatches = matchWelfare(profileFor(honorName, answers));
  const welfareN = welfareCounts(welfareMatches);
  // 이미 보낸 신청 도움 — 열려 있는 요청에서 읽는다 (화면 기억이면 새로고침 뒤 같은 요청이 또 갔다 · 취소하면 다시 보낼 수 있다)
  const welfareSent = Object.fromEntries(
    welfareMatches
      .filter((m) => state.requests.some((r) => r.type === `복지혜택 신청 도움 · ${m.policy.name}` && !CLOSED.includes(r.status)))
      .map((m) => [m.policy.id, true])
  );
  const askWelfare = (m) => {
    if (welfareSent[m.policy.id]) return;
    dispatch({
      type: "addRequest",
      payload: {
        id: `rq-${Date.now()}`,
        dir: "fromGuardian",
        type: `복지혜택 신청 도움 · ${m.policy.name}`,
        detail: `${m.policy.summary} — ${m.policy.value}. 신청 경로: ${m.policy.apply} (${m.policy.org} · ${m.policy.contact}). 확인할 것: ${m.checks}`,
        amount: 0,
        preferredDate: null,
        urgency: "normal",
        assignee: assigneeNow() || "", // 가구 담당 컨시어지가 승인한다 (2026-10-05)
        photos: [],
        status: "requested",
        history: [{ at: Date.now(), status: "requested", note: "보호자 앱 · 복지혜택 신청 도움 요청" }],
        proof: null,
      },
    });
    dispatch({ type: "welfareStatus", id: m.policy.id, status: "신청예정", by: "보호자" });
    dispatch({ type: "pushEvent", payload: { kind: "복지", text: `보호자 복지혜택 신청 도움 요청 — ${m.policy.name}`, color: "#F0D9A8" } });
  };
  const welfareItem = SERVICE_MENU.find((s) => s.no === 9);

  const cardProps = (r) => ({
    req: r,
    open: openId === r.id,
    onToggle: () => setOpenId(openId === r.id ? null : r.id),
    onboarding: ob,
    dispatch,
    payments: state.payments,
    onEdit: () => setEditing(r),
  });

  return (
    <>
      <Head>
        <title>해주세요 — K-CARE</title>
      </Head>
      <FamilyLayout sub="해주세요" title="무엇을 부탁드릴까요?" face={false}>
        {/* 보호자가 할 일 — 결제 · 수락 대기 (시안 맨 위 큰 카드) */}
        {todo.map((r, i) => (
          <TodoCard key={r.id} d={40 + i * 30} {...cardProps(r)} />
        ))}

        {/* 진행 중인 요청 — 한 줄 카드, 누르면 펼친다 */}
        {others.map((r, i) => (
          <RequestRow key={r.id} d={80 + i * 20} {...cardProps(r)} />
        ))}

        {/* 나라 지원 혜택 — 베타부터 연다 (2026-09-04 시트 앱 전체 3번). 무료 회원도 같다 */}
        <button
          type="button"
          onClick={() => setWelfareOpen(true)}
          className="ds-press ds-btn3d ds-r flex items-center gap-3 rounded-[24px] p-4 text-left"
          style={{ "--d": "120ms", background: TONE.beige.bg, boxShadow: `0 5px 0 ${TONE.beige.sh}` }}
        >
          <Clay name="welfareDoc" size={48} />
          <span className="min-w-0 flex-1">
            <span className="block text-[19px]" style={{ color: TONE.beige.fg }}>
              나라 지원 혜택
            </span>
            <span className="block text-[15px] font-bold" style={{ color: TONE.green.title }}>
              {welfareN.high > 0 ? `받으실 가능성 높은 ${welfareN.high}개` : `확인해 볼 것 ${welfareN.check}개`}
            </span>
          </span>
          <Line name="chevR" size={22} style={{ color: TONE.beige.fg }} />
        </button>

        {/* 서비스 타일 — 누르면 요청 시트 (요금 · 범위 · 결제 안내가 그 안에) */}
        <div className="ds-r flex flex-col gap-2.5" style={{ "--d": "160ms" }}>
          {SECTIONS.map((sec, si) => (
            <div key={sec.title} className="flex flex-col gap-2.5" style={si ? { marginTop: 6 } : undefined}>
              <h2 className="ds-sect" style={{ color: TONE[sec.tone].fg }}>
                <i style={{ background: TONE[sec.tone].solid }} />
                {sec.title}
              </h2>
              <div className="ds-g2" style={{ gap: 10 }}>
                {sec.tiles.map((t) => {
                  const s = SERVICE_MENU.find((x) => x.no === t.no && x.active);
                  if (!s) return null;
                  const tn = TONE[t.tone || sec.tone];
                  return (
                    <button key={t.no} type="button" onClick={() => setCreating(s)} className="ds-tap ds-stile" style={{ background: tn.bg, minHeight: 84 }}>
                      <Clay name={t.clay} size={42} className="ds-ico flex-none" />
                      <span className="min-w-0">
                        <b className="text-[17px]" style={{ color: tn.title || tn.fg, fontSize: 17 }}>
                          {t.label}
                        </b>
                        {t.sub && (
                          <small className="font-bold" style={{ color: tn.fg, fontSize: 14 }}>
                            {t.sub}
                          </small>
                        )}
                        <small className={shortPrice(s) === "무료" ? "font-extrabold" : ""} style={{ color: shortPrice(s) === "무료" ? TONE.green.title : tn.sub, fontSize: 14 }}>
                          {shortPrice(s)}
                        </small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* 집 고칠 일 — 해주세요 PLUS 전문업체 연결 (개편안 V2 ONE STOP 축). 책임 경계를 그대로 쓴다 */}
          <h2 className="ds-sect mt-1.5" style={{ color: TONE.beige.fg }}>
            <i style={{ background: "#C9A064" }} />집 고칠 일
          </h2>
          <div className="ds-g3" style={{ gap: 8 }}>
            {PLUS_TILES.map((t) => {
              const p = SERVICE_PLUS.find((x) => x.key === t.key);
              if (!p) return null;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setCreating({ ...p, no: `plus-${p.key}` })}
                  className="ds-tap ds-stile flex-col justify-center text-center"
                  style={{ background: TONE.beige.bg, minHeight: 112, gap: 4 }}
                >
                  <Clay name={t.clay} size={40} className="ds-ico" />
                  <b className="text-[16px]" style={{ color: TONE.beige.fg, fontSize: 16 }}>
                    {t.label}
                  </b>
                  <small style={{ color: TONE.beige.sub, fontSize: 13 }}>{shortPrice(p)}</small>
                </button>
              );
            })}
          </div>
          <p className="text-[13px] leading-[1.6]" style={{ color: "#5E6270" }}>
            직접 못 하는 일은 전문업체로 연결하고 진행 상황을 알려 드립니다. 공사·수리의 책임은 시공 업체에 있습니다.
          </p>
        </div>

        {/* 곧 열려요 — 표기만 하고 비활성. 누르면 '필요해요' 신호로 수요를 잰다 (실무자 요청 그대로) */}
        {INACTIVE.length > 0 && (
          <div className="ds-r flex flex-col gap-2" style={{ "--d": "200ms" }}>
            <h2 className="m-0 text-[15px] font-extrabold" style={{ color: "#5E5A52" }}>
              곧 열려요
            </h2>
            <EvenGrid labels={INACTIVE.map((s) => s.name.replace(/\s*서비스$/, ""))}>
              {INACTIVE.map((s) => {
                const sent = !!wanted[s.no];
                return (
                  <button
                    key={s.no}
                    type="button"
                    aria-pressed={sent}
                    onClick={() => {
                      if (sent) return;
                      setWanted((w) => ({ ...w, [s.no]: true }));
                      dispatch({ type: "pushEvent", payload: { kind: "수요", text: `미개시 서비스 수요 신호 — ${s.name}`, color: "#8FA9CC" } });
                    }}
                    className="ds-press inline-flex min-h-[40px] items-center gap-1 rounded-full px-3.5 text-[15px] font-bold"
                    style={sent ? { background: TONE.green.bg, color: TONE.green.fg } : { background: "#EEEDEA", color: "#5E5A52" }}
                  >
                    {sent && <Line name="check" size={16} />}
                    {s.name.replace(/\s*서비스$/, "")}
                  </button>
                );
              })}
            </EvenGrid>
            <p className="text-[13px]" style={{ color: "#5E6270" }}>
              {Object.keys(wanted).length ? "알려 주셔서 감사합니다 — 열리면 먼저 안내드릴게요." : "필요하시면 눌러서 알려 주세요 — 열리면 먼저 안내드려요."}
            </p>
          </div>
        )}

        <Btn tone="navy" h={58} r={20} className="ds-r text-[17px]" style={{ "--d": "220ms" }} onClick={() => setCreating(true)}>
          직접 적어서 부탁하기
        </Btn>

        {/* 끝난 요청 — 접어 둔다 */}
        {closed.length > 0 && (
          <div className="ds-r flex flex-col gap-2.5" style={{ "--d": "240ms" }}>
            <button
              type="button"
              aria-expanded={closedOpen}
              onClick={() => setClosedOpen((v) => !v)}
              className="ds-press flex min-h-[48px] items-center justify-between rounded-[18px] px-4 text-[16px] font-extrabold"
              style={{ background: "#F3F1EC" }}
            >
              완료 · 종결 {closed.length}건
              <span style={{ transform: closedOpen ? "rotate(180deg)" : undefined }}>
                <Line name="chevD" size={20} />
              </span>
            </button>
            {closedOpen && closed.map((r) => <RequestRow key={r.id} {...cardProps(r)} />)}
          </div>
        )}

        <Card tone="stone" shadow={false} pad={14} className="text-[14px] leading-[1.7]" style={{ color: "#5E6270" }}>
          부탁하시면 결제(무료면 요청) → 담당 컨시어지 확인 → 관제 승인 → 일정 확정 순서로 진행됩니다. 일정이 확정되지 않으면 전액 환불됩니다. 가족 누구나 금액 제한
          없이 결제할 수 있어요. 확정 뒤에는 서비스일 {CANCEL_FREE_DAYS}일 전까지 바로 취소할 수 있고, 그 안에는 관제 승인을 거쳐 취소됩니다.
        </Card>

        {/* 나라 지원 혜택 — 질문 · 판정 목록 · 신청 도움 요청 */}
        {welfareOpen && (
          <Sheet onClose={() => setWelfareOpen(false)} label="나라 지원 혜택">
            <SheetTitle sub={`높음 ${welfareN.high} · 확인 ${welfareN.check}`} title="나라 지원 혜택" />
            <p className="text-[14px] leading-[1.6]" style={{ color: "#5E6270" }}>
              {honor} 정보로 정책 79건을 자동 판정했습니다 · 무료 회원도 이용 · 2026-09-04 검증
            </p>
            {/* 미확인 항목 — 보호자가 답하면 '추가확인'이 '높음'으로 바뀐다 (시트의 노란 입력칸) */}
            <div className="flex flex-col gap-2.5 rounded-[20px] bg-white p-3.5" style={{ boxShadow: "0 3px 0 #E6E2DA" }}>
              <div className="text-[15px] font-extrabold">몇 가지만 확인해 주세요 — 답할수록 판정이 정확해집니다</div>
              {ASK_GUARDIAN.map((q) => {
                const cur = answers[q.key];
                const opts = q.options || ["Y", "N"];
                const label = (o) => (o === "Y" ? "예" : o === "N" ? "아니요" : o);
                return (
                  <div key={q.key} role="group" aria-label={q.q} className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    <span className="min-w-[150px] flex-1 text-[14px]">{q.q}</span>
                    <span className="flex gap-1.5">
                      {opts.map((o) => (
                        <button
                          key={o}
                          type="button"
                          onClick={() => dispatch({ type: "welfareAnswer", key: q.key, value: o })}
                          aria-pressed={cur === o}
                          className="ds-press min-h-[40px] rounded-[12px] px-3 text-[14px] font-extrabold"
                          style={cur === o ? { background: "#1B2340", color: "#FFFFFF" } : { background: "#F3F1EC", color: "#3A3F50" }}
                        >
                          {label(o)}
                        </button>
                      ))}
                      {/* 모름 — 잘못 누른 답을 지워 다시 미확인으로 (방문 때 확인 · 2026-10-18) */}
                      <button
                        type="button"
                        onClick={() => cur != null && dispatch({ type: "welfareAnswer", key: q.key, value: null })}
                        aria-pressed={cur == null}
                        aria-label={`${q.q} — 모름`}
                        className="ds-press min-h-[40px] rounded-[12px] px-3 text-[14px] font-extrabold"
                        style={cur == null ? { background: "#5E6270", color: "#FFFFFF" } : { background: "#F3F1EC", color: "#3A3F50" }}
                      >
                        모름
                      </button>
                    </span>
                  </div>
                );
              })}
              <p className="text-[12px] leading-[1.6]" style={{ color: "#5E6270" }}>
                답은 관제·담당 컨시어지에게만 보이고, 자동판정에만 씁니다. 모르시면 &lsquo;모름&rsquo;으로 두세요 — 방문 때 확인합니다. 잘못 누른 답도 &lsquo;모름&rsquo;을 누르면 지워집니다.
              </p>
            </div>
            <div className="rounded-[20px] bg-white p-3" style={{ boxShadow: "0 3px 0 #E6E2DA" }}>
              <WelfareList
                matches={welfareMatches}
                statuses={state.welfare?.status}
                hideLow
                pageSize={5}
                onStatus={(id, s) => dispatch({ type: "welfareStatus", id, status: s, by: "보호자" })}
                onSend={askWelfare}
                sendLabel="신청 도움 요청"
                sent={welfareSent}
              />
            </div>
            {welfareItem && (
              <WhiteBtn
                className="text-[16px]"
                onClick={() => {
                  setWelfareOpen(false);
                  setCreating(welfareItem);
                }}
              >
                복지 혜택 확인 부탁하기
              </WhiteBtn>
            )}
            <Btn tone="navy" h={54} className="text-[16px]" onClick={() => setWelfareOpen(false)}>
              닫기
            </Btn>
          </Sheet>
        )}

        {creating && (
          <CreateRequestSheet
            preset={typeof creating === "object" ? creating : null}
            myHospitals={(state.myHospitals || []).map((h) => h.name).filter(Boolean)}
            events={state.events}
            honor={honor}
            onClose={() => setCreating(false)}
            onCreate={(req) => {
              dispatch({ type: "addRequest", payload: req });
              dispatch({
                type: "pushEvent",
                payload: { kind: "해주세요", text: `보호자 해주세요 — ${reqTitle(req)}${req.status === "awaitingPayment" ? ` · 결제 ${fmtWon(req.amount)} 후 컨시어지 확인 · 관제 승인` : " · 컨시어지 확인 · 관제 승인 대기"}`, color: "#8FA9CC" },
              });
              // 결제는 요청할 때 먼저 — 가족 누구나 바로 결제창으로 (2026-10-22 · 전에는 주 보호자만). 무료 요청은 시트가 완료 화면을 보인다
              if (req.status === "awaitingPayment") {
                setCreating(false);
                router.push(payHref({ kind: "request", amount: req.amount, orderName: reqTitle(req), ref: req.id }));
              }
            }}
          />
        )}

        {/* 내용 고치기 — 담당 컨시어지가 승인하기 전까지만. 그사이 승인되면 시트가 닫힌다 (승인 뒤에는 취소하고 다시 부탁) */}
        {editing && (() => {
          const cur = state.requests.find((x) => x.id === editing.id);
          if (!cur || !canEditRequest(cur)) return <EditLockedNote req={cur || editing} onClose={() => setEditing(null)} />;
          return (
            <CreateRequestSheet
              initial={cur}
              myHospitals={(state.myHospitals || []).map((h) => h.name).filter(Boolean)}
              honor={honor}
              onClose={() => setEditing(null)}
              onSave={(patch) => {
                dispatch({ type: "editRequest", id: cur.id, patch, by: "보호자", title: svcTitle(cur.type) });
                dispatch({ type: "pushEvent", payload: { kind: "해주세요", text: `보호자 해주세요 내용 수정 — ${svcTitle(cur.type)} · 담당 컨시어지 확인 전`, color: "#8FA9CC" } });
                setEditing(null);
              }}
            />
          );
        })()}
      </FamilyLayout>
    </>
  );
}

// 진행 단계 — 보호자 · 어르신 요청: 결제 → 컨시어지 확인 → 관제 승인 → 일정 확정 → 완료 (2026-10-22).
// 컨시어지 제안: 제안 → 수락(결제) → 확정 → 진행 → 완료. 금액이 없는 것은 첫 단계를 '요청'으로 부른다.
const STEPS_ASK = ["결제", "컨시어지 확인", "관제 승인", "일정 확정", "완료"];
const STEPS_PROPOSAL = ["제안", "수락 · 결제", "확정", "진행", "완료"];
function stepOf(r) {
  if ((CLOSED.includes(r.status) && r.status !== "done") || isVisitCall(r) || isStoreOrder(r)) return -1;
  if (approverOf(r) !== "concierge") {
    switch (r.status) {
      case "awaitingPayment":
      case "requested":
      case "needsAdmin":
        return 1;
      case "confirmed":
      case "cancelRequested":
        return 2;
      case "inProgress":
        return 3;
      case "done":
        return 4;
      default:
        return -1;
    }
  }
  switch (r.status) {
    case "awaitingPayment":
      return 0;
    case "requested":
      return 1;
    case "opsReview":
    case "needsAdmin":
      return 2;
    case "confirmed":
    case "cancelRequested":
    case "inProgress":
      return 4;
    case "done":
      return 5;
    default:
      return -1;
  }
}

// 요청 한 건의 공통 계산 — 큰 카드 · 한 줄 카드가 같이 쓴다
function useReq(req, onboarding, payments) {
  const router = useRouter();
  const honor = honorific(onboarding); // 고객 호칭 — 전부 "~~님" (2026-08-12 시트)
  // 상태 이름 — 요청한 분 말로 (확정 전까지 '확정 대기' · 2026-10-22)
  const st = { ...(STATUS[req.status] || STATUS.requested), label: customerStatusLabel(req) };
  const approver = approverOf(req);
  const proposal = approver !== "concierge";
  const stepIdx = stepOf(req);
  // 요금이 없는(무료 · 미정) 요청은 첫 단계를 '요청'으로 — '결제'에 완료 표시가 붙어 낸 것처럼 보이지 않게 (2026-10-19 점검)
  const free = !(Number(req.amount) > 0);
  const steps = proposal ? (free ? ["제안", "수락", ...STEPS_PROPOSAL.slice(2)] : STEPS_PROPOSAL) : free ? ["요청", ...STEPS_ASK.slice(1)] : STEPS_ASK;
  const pay = paymentOf(payments, req.id);
  const rule = cancelRule(req);
  const scheduled = fmtScheduled(req);
  const visitCall = req.type === "즉시 방문 요청";
  const route = visitCall
    ? `${honor} → 관제`
    : {
        fromConcierge: approver === "elder" ? `컨시어지 제안 → ${honor} 승인` : "컨시어지 제안 → 보호자 승인",
        fromElder: req.status === "awaitingPayment" ? `${honor} 부탁 · 결제 대기` : `${honor} → 담당 컨시어지 → 관제`,
        fromGuardian: "보호자 → 담당 컨시어지 → 관제",
        fromOps: "관제 → 보호자", // 복지혜택 안내 (2026-09-04)
      }[req.dir];
  // 누가 낸 요청인가 — 큰 카드 오른쪽 위
  const who =
    req.dir === "fromConcierge" ? `${req.assignee || "담당"} 선생님 제안` : req.dir === "fromElder" ? `${honor} 부탁` : req.dir === "fromOps" ? "관제 안내" : "보호자 요청";
  // 보호자가 할 수 있는 것 — 결제(결제 대기 · 가족 누구나) · 제안 수락/거절(승인 대상이 보호자일 때) · 취소(규칙대로)
  const canAnswer = req.status === "requested" && approver === "guardian";
  const canPay = req.status === "awaitingPayment";
  // 어르신 '물건 승인 부탁' — 결제 전이면 사지 않기로 닫을 수 있다 (결제 뒤에는 주문이라 관제 · 고객센터)
  const storeAsk = isStoreOrder(req) && req.status === "awaitingPayment" && !pay;
  const canCancel = !visitCall && (!isStoreOrder(req) || storeAsk) && req.dir !== "fromOps" && !canAnswer && ["free", "ops"].includes(rule.mode) && !(proposal && req.status === "requested");
  // 내용 고치기 — 보호자가 낸 요청을, 담당 컨시어지가 승인하기 전까지만 (2026-10-18)
  const canEdit = req.dir === "fromGuardian" && canEditRequest(req);
  const goPay = () => router.push(payHref({ kind: "request", amount: req.amount, orderName: reqTitle(req), ref: req.id }));
  return { honor, st, approver, proposal, stepIdx, steps, pay, rule, scheduled, visitCall, route, who, canAnswer, canPay, canCancel, canEdit, storeAsk, goPay };
}

// 고치려던 사이 승인 · 취소된 요청 — 시트 대신 한 줄 안내
function EditLockedNote({ req, onClose }) {
  return (
    <Sheet onClose={onClose} label="내용 고치기">
      <SheetTitle sub={req?.type || "해주세요"} title="이제 고칠 수 없어요" />
      <p className="text-[15px] leading-[1.6]" style={{ color: "#3A3F50" }}>
        {req && ["confirmed", "inProgress", "awaitingPayment", "opsReview"].includes(req.status)
          ? "담당 컨시어지가 방금 확인했습니다. 확인된 내용은 기록으로 남습니다 — 바꾸시려면 취소하고 다시 부탁해 주세요."
          : "이 요청은 이미 끝났습니다. 끝난 요청의 내용은 기록으로 남습니다."}
      </p>
      <Btn tone="navy" h={54} className="text-[16px]" onClick={onClose}>
        닫기
      </Btn>
    </Sheet>
  );
}

// 단계 막대 — 지난 단계 초록 · 지금 금색 · 남은 것 옅게
function Steps({ steps, at, track = "#EAD9AC" }) {
  return (
    <ol className="m-0 grid list-none gap-1 p-0" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} aria-label={at >= steps.length ? "진행 단계 — 모두 끝남" : `진행 단계 — 지금 ${steps[at]}`}>
      {steps.map((l, i) => (
        <li key={l} className="flex flex-col items-center gap-1" aria-current={i === at ? "step" : undefined}>
          <span className="block h-2 w-full rounded-[4px]" style={{ background: i < at ? TONE.green.solid : i === at ? TONE.gold.solid : track }} />
          <span className="text-center text-[12px] font-extrabold leading-[1.25]" style={{ color: i <= at ? "#1B2340" : "#8A7468" }}>
            {l}
          </span>
        </li>
      ))}
    </ol>
  );
}

// 결제 · 수락 · 취소 버튼과 확인 — 큰 카드와 펼친 한 줄 카드가 같이 쓴다
function Actions({ req, x, dispatch, big, onEdit }) {
  const [confirming, setConfirming] = useState(null); // "cancel" | "decline"
  const { canPay, canAnswer, canCancel, canEdit, storeAsk, rule, pay, goPay, proposal } = x;
  if (!(canPay || canAnswer || canCancel || canEdit)) return null;
  const cancelLabel = storeAsk ? "사지 않기" : proposal && req.status === "awaitingPayment" ? "거절" : rule.mode === "ops" ? "취소 요청 (관제 승인)" : "취소하기";
  return (
    <div className="flex flex-col gap-2">
      {!confirming && canEdit && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`${svcTitle(req.type)} 내용 고치기`}
          className="ds-press flex min-h-[44px] items-center gap-1.5 self-start px-1 text-[15px] font-extrabold underline underline-offset-4"
          style={{ color: "#3A3F50" }}
        >
          내용 고치기 <span className="font-bold no-underline" style={{ color: "#5E6270" }}>· 승인 전까지</span>
        </button>
      )}
      {!confirming && (canPay || canAnswer || canCancel) && (
        <div className="grid gap-2.5" style={{ gridTemplateColumns: (canPay || canAnswer) && (canCancel || canAnswer) ? "2fr 1fr" : "1fr" }}>
          {/* 결제 — 가족 누구나 금액 제한 없이 (2026-10-22 · 전에는 주 보호자만) */}
          {canPay && (
            <Btn tone="gold" h={big ? 56 : 52} className="text-[17px]" onClick={goPay}>
              {big ? "결제하기" : `${fmtWon(req.amount)} 결제하기`}
            </Btn>
          )}
          {canAnswer && (
            <Btn
              tone="gold"
              h={big ? 56 : 52}
              className="text-[17px]"
              onClick={() => {
                dispatch({ type: "respondProposal", id: req.id, accept: true, role: "guardian" });
                dispatch({ type: "pushEvent", payload: { kind: "해주세요", text: `보호자 컨시어지 제안 수락 — ${svcTitle(req.type)}`, color: "#8FE3C0" } });
                if (req.amount > 0) goPay();
              }}
            >
              {req.amount > 0 ? `수락 · ${fmtWon(req.amount)} 결제` : "수락"}
            </Btn>
          )}
          {canAnswer && (
            <WhiteBtn h={big ? 56 : 52} sh="#EAD9AC" color="#6B4A3A" className="text-[16px]" onClick={() => setConfirming("decline")}>
              거절
            </WhiteBtn>
          )}
          {canCancel && !canAnswer && (
            <WhiteBtn h={big ? 56 : 52} sh={big ? "#EAD9AC" : "#E3DED3"} color="#6B4A3A" className="text-[16px]" onClick={() => setConfirming("cancel")}>
              {cancelLabel}
            </WhiteBtn>
          )}
        </div>
      )}
      {confirming && (
        <div className="ds-swap flex flex-col gap-2.5 rounded-[18px] bg-white p-3.5">
          <p className="text-[15px] leading-[1.6]">
            {confirming === "decline"
              ? "이 제안을 거절할까요? 컨시어지에게 거절로 전달됩니다."
              : storeAsk
                ? `이번에는 사지 않을까요? ${x.honor} 화면에 '가족이 이번에는 사지 않기로 했습니다'로 보입니다. 결제된 돈은 없습니다.`
                : rule.mode === "ops"
                ? `${req.status === "inProgress" ? "이미 진행 중이라" : rule.days == null ? "확정 날짜가 없어" : `서비스일까지 ${CANCEL_FREE_DAYS}일이 안 남아`} 관제가 확인한 뒤 취소됩니다.${pay ? " 승인되면 결제하신 금액은 관제가 환불합니다." : ""}`
                : `${cancelLabel === "거절" ? "거절하면 이 제안이 취소됩니다." : "지금 취소하면 바로 취소됩니다."}${pay ? (pay.demo ? ` 데모 결제 ${fmtWon(pay.amount)}은 바로 환불 처리됩니다.` : ` 결제하신 ${fmtWon(pay.amount)}은 관제가 환불 처리합니다.`) : ""}`}
          </p>
          <div className="grid grid-cols-[1fr_2fr] gap-2">
            <WhiteBtn h={50} className="text-[15px]" onClick={() => setConfirming(null)}>
              아니요
            </WhiteBtn>
            <Btn
              tone="navy"
              h={50}
              className="text-[15px]"
              onClick={() => {
                if (confirming === "decline") {
                  dispatch({ type: "respondProposal", id: req.id, accept: false, role: "guardian" });
                  dispatch({ type: "pushEvent", payload: { kind: "해주세요", text: `보호자 컨시어지 제안 거절 — ${svcTitle(req.type)}`, color: "#8FA9CC" } });
                } else {
                  dispatch({ type: "cancelRequest", id: req.id, by: "보호자", ...(storeAsk ? { reason: "보호자가 이번에는 사지 않기로 함" } : {}) });
                  dispatch({
                    type: "pushEvent",
                    payload: { kind: "해주세요", text: `보호자 ${storeAsk ? "물건 승인 부탁 — 사지 않기" : rule.mode === "ops" ? "취소 요청 (관제 승인 필요)" : cancelLabel === "거절" ? "제안 거절" : "취소"} — ${svcTitle(req.type)}`, color: "#B08D57" },
                  });
                }
                setConfirming(null);
              }}
            >
              {storeAsk ? "네, 사지 않습니다" : confirming === "decline" || cancelLabel === "거절" ? "네, 거절합니다" : rule.mode === "ops" ? "네, 취소 요청합니다" : "네, 취소합니다"}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// 펼친 내용 — 금액 · 일정 · 결제 · 처리 이력 · 완료 증빙
// 정해진 일정 앞 글 — '확정'은 관제가 승인한 뒤에만 (컨시어지가 정하고 관제 승인을 기다리는 동안은 '정한 일정' · 2026-10-22 점검)
const schedWord = (r) =>
  ["confirmed", "inProgress", "done", "cancelRequested"].includes(r.status)
    ? "확정"
    : ["cancelled", "rejected"].includes(r.status)
      ? "일정"
      : r.dir === "fromConcierge" || r.dir === "fromOps"
        ? "제안 일정"
        : "정한 일정 (관제 승인 전)";

function Details({ req, x }) {
  const { pay, scheduled, honor } = x;
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[13px]" style={{ color: "#5E6270" }}>
        <span>
          금액 <b className="ds-num" style={{ color: "#1B2340" }}>{req.amount != null ? fmtWon(req.amount) : "확정 전"}</b>
        </span>
        {scheduled ? (
          <span>
            {schedWord(req)} <b className="ds-num" style={{ color: "#1B2340" }}>{scheduled}</b>
          </span>
        ) : (
          (req.preferredDate || req.preferredWhen) && <span>희망 {fmtPreferred(req)}</span>
        )}
        {Number(req.durationMin) > 0 && (
          <span>
            이용 <b className="ds-num" style={{ color: "#1B2340" }}>{durText(req.durationMin)}</b>
            {(req.scheduledTime || req.preferredTime) && ` · 끝 ${clock12(addMin(req.scheduledTime || req.preferredTime, req.durationMin))}`}
          </span>
        )}
        {Number(req.extraPeople) > 0 && <span>인원 {Number(req.extraPeople) + 1}명 (추가 {req.extraPeople}명)</span>}
        {req.nextAppt && <span>다음 외래 동행</span>}
        {req.hospital && <span>병원 {req.hospital}</span>}
        <span>담당 {req.assignee || "미배정"}</span>
        {req.photos?.length > 0 && <span>사진 {req.photos.length}장</span>}
        {req.urgency === "urgent" && <b style={{ color: TONE.gold.fg }}>긴급</b>}
      </div>
      {(pay || req.payBy === "elder") && (
        <div className="text-[13px] font-extrabold">
          {pay?.refund ? (
            <span style={{ color: pay.refund.status === "done" ? TONE.green.fg : TONE.gold.fg }}>
              {pay.refund.status === "done" ? `환불 완료 ${fmtWon(pay.refund.amount)}` : `환불 대기 ${fmtWon(pay.refund.amount)} — 관제가 처리합니다`}
            </span>
          ) : pay ? (
            <span style={{ color: TONE.green.fg }}>
              결제 완료 {fmtWon(pay.amount)}
              {pay.demo ? " (데모 · 실제 결제 없음)" : ""}
            </span>
          ) : (
            <span style={{ color: "#5E6270" }}>{honor} 직접 결제</span>
          )}
        </div>
      )}
      <div className="flex flex-col gap-2 rounded-[16px] p-3" style={{ background: "#F8F7F4" }}>
        <div className="text-[14px] font-extrabold">처리 이력</div>
        {req.history.map((h, i) => {
          const hs = STATUS[h.status] || STATUS.requested;
          return (
            <div key={i} className="flex items-start gap-2.5">
              <span aria-hidden="true" className="mt-[6px] h-2 w-2 flex-none rounded-full" style={{ background: hs.fg }} />
              <div className="min-w-0 flex-1 text-[13px]">
                <b>{hs.label}</b>
                <span className="ds-num ml-2 text-[12px]" style={{ color: "#5E6270" }}>
                  {new Date(h.at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}
                </span>
                {h.note && <div className="leading-[1.6]" style={{ color: "#5E6270" }}>{h.note}</div>}
              </div>
            </div>
          );
        })}
      </div>
      {req.proof && (
        <div className="rounded-[14px] px-3 py-2.5 text-[13px] font-bold" style={{ background: TONE.green.bg, color: TONE.green.fg }}>
          완료증빙 첨부됨 · {req.proof}
        </div>
      )}
    </div>
  );
}

// 보호자가 할 일 — 시안의 큰 결제 카드 (금색)
function TodoCard({ req, open, onToggle, onboarding, dispatch, payments, onEdit, d = 40 }) {
  const x = useReq(req, onboarding, payments);
  return (
    <div className="ds-r flex flex-col gap-3.5 rounded-[26px] p-[18px]" style={{ "--d": `${d}ms`, background: TONE.gold.bg }}>
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full px-3 py-1 text-[14px] font-extrabold text-white" style={{ background: TONE.gold.fg }}>
          {req.status === "awaitingPayment" ? "결제 대기" : "수락 대기"}
        </span>
        <span className="text-[14px] font-bold" style={{ color: "#6B4A3A" }}>
          {x.who}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Clay name={reqClay(req)} size={48} className="flex-none" />
        <div className="min-w-0 flex-1">
          <div className="text-[20px] font-extrabold leading-[1.3]">{reqTitle(req)}</div>
          <div className="line-clamp-2 text-[15px] leading-[1.5]" style={{ color: "#6B4A3A" }}>
            {req.detail}
          </div>
        </div>
        {req.amount != null && <div className="ds-num flex-none text-[19px] font-black">{fmtWon(req.amount)}</div>}
      </div>
      {x.stepIdx >= 0 && <Steps steps={x.steps} at={x.stepIdx} />}
      {req.status === "requested" && x.approver === "elder" && (
        <div className="rounded-[14px] bg-white px-3 py-2 text-[14px] font-bold">{x.honor}이 수락하시면 진행됩니다</div>
      )}
      {/* 가족(어르신 등)이 결제를 부탁했다 — 가족 누구나 낼 수 있다 */}
      {req.status === "awaitingPayment" && req.payAsk && (
        <div className="rounded-[14px] bg-white px-3 py-2 text-[14px] font-bold">
          {req.payAsk.by} 님이 결제를 부탁했어요 · {new Date(req.payAsk.at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit" })}
        </div>
      )}
      <Actions req={req} x={x} dispatch={dispatch} big onEdit={onEdit} />
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-h-[40px] items-center gap-1 self-start text-[14px] font-extrabold underline underline-offset-2" style={{ color: "#6B4A3A" }}>
        {open ? "자세히 접기" : "자세히 보기"}
      </button>
      {open && <Details req={req} x={x} />}
    </div>
  );
}

// 진행 중 · 끝난 요청 — 한 줄 카드. 누르면 단계 · 이력 · 취소가 펼쳐진다
function RequestRow({ req, open, onToggle, onboarding, dispatch, payments, onEdit, d = 80 }) {
  const x = useReq(req, onboarding, payments);
  // 끝난 요청은 어떻게 끝났는지(마지막 이력 — 거절 · 취소 사유)를 보인다. 전에는 취소된 줄에도 '확정 날짜'가 남았다 (2026-10-19 점검 L-17)
  const lastNote = [...(req.history || [])].reverse().find((h) => h.note)?.note || "";
  const sub =
    req.status === "cancelRequested"
      ? "취소 요청 — 관제가 확인하고 있습니다"
      : ["cancelled", "rejected"].includes(req.status)
        ? lastNote || (req.status === "cancelled" ? "취소됨" : "거절됨")
        : req.status === "requested" && x.approver === "concierge" && !x.visitCall
        ? req.opsReturn
          ? `관제가 일정을 다시 맞추고 있어요 — ${req.opsReturn.reason}`
          : `${req.assignee || "담당 컨시어지"} 컨시어지가 일정을 확인하고 관제가 승인하면 확정돼요`
        : req.status === "opsReview" || req.status === "needsAdmin"
          ? "컨시어지 확인 완료 · 관제 승인을 기다려요"
        : req.status === "requested" && x.approver === "elder"
          ? `${x.honor}이 수락하시면 진행됩니다`
          : x.scheduled
            ? `확정 ${x.scheduled}`
            : req.detail;
  return (
    <div className="ds-r overflow-hidden rounded-[22px] bg-white" style={{ "--d": `${d}ms`, boxShadow: "0 4px 0 #E6E2DA" }}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="ds-press flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <Clay name={reqClay(req)} size={44} className="flex-none" />
        <span className="min-w-0 flex-1">
          <b className="block text-[17px] font-extrabold leading-[1.35]">{reqTitle(req)}</b>
          <span className="line-clamp-1 block text-[14px]" style={{ color: "#5E6270" }}>
            {sub}
          </span>
        </span>
        <span className="flex-none rounded-full px-2.5 py-1 text-[13px] font-extrabold" style={chipTone(req.status)}>
          {x.st.label}
        </span>
      </button>
      {open && (
        <div className="ds-swap flex flex-col gap-3 border-t px-4 pb-4 pt-3" style={{ borderColor: "#F0ECE4" }}>
          <div className="text-[12px] font-bold" style={{ color: "#5E6270" }}>
            {x.route}
          </div>
          <p className="text-[14px] leading-[1.6]">{req.detail}</p>
          {x.stepIdx >= 0 && <Steps steps={x.steps} at={x.stepIdx} track="#EEEDEA" />}
          <Actions req={req} x={x} dispatch={dispatch} onEdit={onEdit} />
          <Details req={req} x={x} />
        </div>
      )}
    </div>
  );
}

const fieldCls = "w-full rounded-[16px] border-2 border-[#E3DED3] bg-white px-3.5 text-[16px] outline-none focus:border-[#1B2340]";

// 날짜 · 시작 시간을 꼭 골라야 하는 서비스 (사람이 가는 것). 응급 대응 · 복지 혜택 · 공사맨 견적 · 가전 렌탈 · 약이 바뀌었어요는 고르지 않는다
const DATED = new Set([1, 2, 3, 4, 5, 6, 13, 14, 15, "plus-handyman"]);
// 직접 적어서 부탁하기 · 요금 확정 전 · 무료는 '요청하기', 금액이 있으면 'N원 결제하고 요청' (2026-10-22)
const detailHint = (p) =>
  p?.detail ||
  (p?.no === 2 || p?.no === 3 ? "예: 무릎이 불편하셔서 천천히 걸으세요 · 처방전 챙겨 주세요" : p?.no === 15 ? "예: 강가 산책을 좋아하세요 · 휠체어가 필요해요" : "선생님께 전할 말이 있으면 적어 주세요");

// initial 이 있으면 '내용 고치기' — 종류 · 금액 · 이용 시간 · 인원 · 사진은 그대로 두고 내용 · 희망 일시 · 병원 · 긴급도만 (2026-10-18)
const ymdOfPreferred = (v) => (typeof v === "number" && Number.isFinite(v) ? kstYmd(v) : /^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) ? v : "");
function CreateRequestSheet({ preset, initial = null, onClose, onCreate, onSave, myHospitals = [], events = [], honor = "어르신" }) {
  const editing = !!initial;
  const custom = !preset && !editing; // 직접 적어서 부탁하기
  const [type, setType] = useState(initial ? initial.type : preset ? preset.name : GUARDIAN_PRESETS[0]);
  const [detail, setDetail] = useState(initial?.detail || "");
  const [when, setWhen] = useState({ ymd: ymdOfPreferred(initial?.preferredDate) || null, hm: initial?.preferredTime || null });
  const [hospital, setHospital] = useState(initial?.hospital || "");
  const [urgency, setUrgency] = useState(initial?.urgency || "normal");
  const [photo, setPhoto] = useState(false);
  const [done, setDone] = useState(null); // 보낸 요청 — 무료 · 요금 확정 전은 이 시트에서 완료 화면을 보인다
  // 메뉴 서비스 — 요금 · 이용 시간은 메뉴 값 그대로 (lib/requests.js · lib/booking.js). 보호자가 적는 금액으로 결제하지 않는다
  const onMenu = !!preset && type === preset.name;
  const d = onMenu ? preset.dur || null : null;
  const needsDate = onMenu && DATED.has(preset.no);
  // 병원 동행 — 다음 외래를 고르면 날짜 · 시작 시각은 정해져 있어 이용 시간만 고른다 (2026-10-22)
  const escort = onMenu && d?.nextApptLead != null;
  const appt = escort ? nextAppt(events) : null;
  const [apptPick, setApptPick] = useState(escort && !appt ? "direct" : null); // "next" | "direct"
  const useNext = escort && apptPick === "next" && !!appt;
  const [dur, setDur] = useState(d ? durStart(d) : null);
  const [people, setPeople] = useState(d?.people ? null : 0); // 함께가요 — null 아직 안 고름
  const hospitalAsk = !useNext && (/병원|진료|검진/.test(String(type || "")) || !!initial?.hospital);
  const ymd = useNext ? kstYmd(appt.at) : when.ymd;
  const start = useNext ? nextApptStart(type, appt) : when.hm;
  const amount = editing ? initial.amount ?? null : onMenu ? (d ? priceOf(type, dur, people || 0) : preset.amount ?? null) : null;
  const payNow = !editing && amount > 0;
  const chip = (on) => (on ? { background: "#1B2340", color: "#FFFFFF" } : { background: "#FFFFFF", color: "#3A3F50", boxShadow: "inset 0 0 0 1.5px #E3DED3" });
  // 결제 버튼이 켜지는 조건 — 날짜와 시작 시간을 둘 다 골라야 (2026-10-22). 병원 동행은 어느 진료인지 먼저(다음 외래가 있으면 날짜 칸이
  // 아직 숨어 있다) · 직접 고르면 병원도, 함께가요는 누가 가는지도
  const missing = editing
    ? null
    : escort && !apptPick
      ? "어느 진료에 함께 갈지 골라 주세요"
      : needsDate && !(ymd && start)
        ? "날짜와 시작 시간을 골라 주세요"
        : escort && !useNext && !hospital.trim()
          ? "병원 · 진료과를 적어 주세요"
          : d?.people && people == null
            ? "누가 가는지 골라 주세요"
            : custom && !detail.trim()
              ? "부탁할 내용을 적어 주세요"
              : null;
  // 고친 칸만 보낸다 — 손대지 않은 희망일이 다른 꼴(숫자 ↔ 날짜 글)로 바뀌어 '고침'으로 남지 않게
  const patch = {};
  if (editing) {
    if (detail.trim() !== String(initial.detail || "").trim()) patch.detail = detail.trim();
    if ((when.ymd || "") !== ymdOfPreferred(initial.preferredDate) || (when.hm || "") !== (initial.preferredTime || "")) {
      patch.preferredDate = when.ymd || null;
      patch.preferredTime = when.hm || null;
    }
    if (hospitalAsk && hospital.trim() !== (initial.hospital || "")) patch.hospital = hospital.trim() || null;
    if (urgency !== (initial.urgency || "normal")) patch.urgency = urgency;
  }
  const changed = Object.keys(patch).length > 0;
  const title = editing ? reqTitle(initial) : preset ? svcTitle(preset.name) : "직접 적어서 부탁하기";

  if (done) {
    return (
      <Sheet onClose={onClose} label="요청했어요">
        <div className="ds-swap flex flex-col items-center gap-3 py-2 text-center">
          <span className="ds-pop flex h-[84px] w-[84px] items-center justify-center rounded-full text-white" style={{ background: TONE.green.solid }}>
            <Line name="check" size={44} />
          </span>
          <div className="text-[24px] font-black">요청했어요</div>
          <div className="text-[17px] font-extrabold leading-[1.45]">{reqTitle(done)}</div>
          <div className="text-[15px] font-bold leading-[1.5]" style={{ color: "#5E6270" }}>
            {done.amount == null ? "요금은 담당 컨시어지가 확인하며 알려 드리고, 그 뒤 결제해요" : "컨시어지와 관제가 일정을 맞추면 확정돼요"}
          </div>
        </div>
        <ConfirmSteps at={1} free />
        <Btn tone="navy" h={56} className="text-[17px]" onClick={onClose}>
          해주세요로
        </Btn>
      </Sheet>
    );
  }

  return (
    <Sheet onClose={onClose} label={editing ? `${initial.type} 내용 고치기` : title}>
      <SheetTitle sub={editing ? "내용 고치기" : "해주세요"} title={title} />
      {!editing && preset?.tagline && (
        <p className="text-[16px] font-extrabold leading-[1.5]" style={{ color: "#1B2340" }}>
          {preset.tagline}
        </p>
      )}
      {editing ? (
        <p className="text-[14px] leading-[1.6]" style={{ color: "#5E6270" }}>
          담당 컨시어지가 확인하기 전까지 고칠 수 있습니다. 고친 내용은 컨시어지 · 관제 화면에 바로 보이고 처리 이력에 남습니다. 서비스 종류 · 금액 · 이용 시간은 그대로입니다 — 바꾸시려면 취소하고 다시 부탁해 주세요.
        </p>
      ) : (
        <p className="text-[14px] leading-[1.6]" style={{ color: "#5E6270" }}>
          {payNow ? "요청할 때 결제하고, " : ""}
          {assigneeNow() ? `담당 컨시어지(${assigneeNow()})가 확인하고 관제가 승인하면 일정이 확정됩니다.` : "센터 관제가 담당을 정해 확인하고 승인하면 일정이 확정됩니다."}
          {amount === 0 ? " 따로 내실 금액이 없습니다." : amount == null ? " 요금은 컨시어지가 확인하며 알려 드리고, 그 뒤 결제합니다." : ""}
        </p>
      )}
      {!editing && preset?.priceLabel && (
        <p className="ds-num rounded-[16px] px-3.5 py-2.5 text-[14px] font-extrabold" style={{ background: TONE.gold.bg, color: TONE.gold.fg }}>
          {preset.priceLabel}
        </p>
      )}
      {!editing && (preset?.scope || preset?.note) && (
        <p className="text-[14px] leading-[1.6]" style={{ color: "#3A3F50" }}>
          {[preset.scope, preset.note].filter(Boolean).join(" · ")}
        </p>
      )}

      {custom && (
        <div role="group" aria-label="요청 종류" className="flex flex-col gap-2">
          <div className="text-[15px] font-extrabold">요청 종류</div>
          <EvenGrid labels={GUARDIAN_PRESETS} gap={6}>
            {GUARDIAN_PRESETS.map((p) => (
              <button key={p} type="button" onClick={() => setType(p)} aria-pressed={type === p} className="ds-press min-h-[40px] rounded-full px-3.5 text-[14px] font-extrabold" style={chip(type === p)}>
                {p}
              </button>
            ))}
          </EvenGrid>
        </div>
      )}

      {/* 병원 동행 — 어느 진료에 함께 갈까요: 다음 외래(날짜 · 시작 시각 정해짐) 또는 병원 · 날짜 직접 고르기 */}
      {escort && (
        <div role="group" aria-label="어느 진료에 함께 갈까요" className="flex flex-col gap-2">
          <div className="text-[15px] font-extrabold">어느 진료에 함께 갈까요</div>
          {appt && (
            <button
              type="button"
              aria-pressed={apptPick === "next"}
              onClick={() => setApptPick("next")}
              className="ds-press flex items-start gap-3 rounded-[18px] bg-white px-3.5 py-3 text-left"
              style={{ boxShadow: apptPick === "next" ? `inset 0 0 0 2.5px ${TONE.green.solid}` : `0 3px 0 ${TONE.green.sh}` }}
            >
              <span className="min-w-0 flex-1">
                <b className="block text-[16px]" style={{ color: TONE.green.fg }}>
                  {dateLabel(kstYmd(appt.at))} {clock12(kstHm(appt.at))} · {appt.title}
                </b>
                <small className="block text-[13px] font-bold" style={{ color: "#5E6270" }}>
                  다음 외래 · {clock12(nextApptStart(type, appt))} {d.nextApptMeet || "시작"}
                </small>
              </span>
            </button>
          )}
          <button
            type="button"
            aria-pressed={apptPick === "direct"}
            onClick={() => setApptPick("direct")}
            className="ds-press flex items-start gap-3 rounded-[18px] bg-white px-3.5 py-3 text-left"
            style={{ boxShadow: apptPick === "direct" ? `inset 0 0 0 2.5px ${TONE.green.solid}` : `0 3px 0 ${TONE.green.sh}` }}
          >
            <span className="min-w-0 flex-1">
              <b className="block text-[16px]" style={{ color: TONE.green.fg }}>
                병원 · 날짜 직접 고르기
              </b>
              <small className="block text-[13px] font-bold" style={{ color: "#5E6270" }}>
                {appt ? "다음 외래가 아닌 진료" : "등록된 다음 외래가 없어요"}
              </small>
            </span>
          </button>
        </div>
      )}

      {hospitalAsk && (!escort || apptPick === "direct") && (
        <div className="flex flex-col gap-2">
          <label htmlFor="rq-hospital" className="text-[15px] font-extrabold">
            병원 · 진료과{escort ? "" : " (선택)"}
          </label>
          <input id="rq-hospital" list="req-hospitals" value={hospital} onChange={(e) => setHospital(e.target.value)} placeholder="예: 서울아산병원 정형외과" className={`${fieldCls} min-h-[50px]`} />
          <datalist id="req-hospitals">
            {myHospitals.map((h) => (
              <option key={h} value={h} />
            ))}
          </datalist>
        </div>
      )}

      {/* 날짜 · 시작 시간 — 내일부터 1년 뒤까지 · 오전 7:00 ~ 오후 8:00 30분 간격. 다음 외래를 고르면 정해져 있다 */}
      {(editing || needsDate || custom) && !useNext && (!escort || apptPick === "direct") && (
        <BookingPicker ymd={when.ymd} hm={when.hm} onChange={setWhen} optional={!needsDate} title={needsDate ? "날짜 · 시작 시간" : "희망 날짜 · 시간"} />
      )}

      {/* 이용 시간 — 30분씩. 금액과 끝나는 시간이 바로 바뀐다. 정해진 시간 서비스는 끝나는 시간만 */}
      {!editing && d && (!escort || apptPick) && <DurationStepper d={d} value={dur} onChange={setDur} start={start} />}

      {/* 함께가요 — 누가 가나요 (1명마다 추가 요금 · 신청한 분이 한꺼번에 결제) */}
      {!editing && d?.people && <PeoplePick alone={`${honor}만`} value={people} onChange={setPeople} />}

      <div className="flex flex-col gap-2">
        <label htmlFor="rq-detail" className="text-[15px] font-extrabold">
          {custom || editing ? "상세 내용" : "전할 말"}
          {!custom && !editing && <small className="ml-1.5 text-[13px] font-bold" style={{ color: "#5E6270" }}>선택</small>}
        </label>
        <textarea
          id="rq-detail"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          rows={3}
          placeholder={custom ? "무엇을 어떻게 해드리면 될까요?" : detailHint(preset)}
          className={`${fieldCls} resize-none py-3 leading-[1.6]`}
        />
      </div>

      {(custom || editing) && (
        <div className="grid grid-cols-2 gap-2.5">
          <div role="group" aria-label="긴급도" className="flex flex-col gap-2">
            <div className="text-[15px] font-extrabold">긴급도</div>
            <div className="flex gap-1.5">
              {Object.entries(URGENCY).map(([k, v]) => (
                <button key={k} type="button" onClick={() => setUrgency(k)} aria-pressed={urgency === k} className="ds-press min-h-[44px] flex-1 rounded-[14px] text-[14px] font-extrabold" style={chip(urgency === k)}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          {editing ? (
            <div className="flex flex-col gap-2">
              <div className="text-[15px] font-extrabold">사진</div>
              <p className="flex min-h-[44px] items-center text-[14px]" style={{ color: "#5E6270" }}>
                {initial.photos?.length ? `${initial.photos.length}장 그대로` : "없음"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="text-[15px] font-extrabold">사진 첨부</div>
              <button type="button" onClick={() => setPhoto((v) => !v)} aria-pressed={photo} className="ds-press min-h-[44px] rounded-[14px] text-[14px] font-extrabold" style={chip(photo)}>
                {photo ? "첨부됨 (데모)" : "사진 선택 (데모)"}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="rounded-[16px] bg-white px-3.5 py-3 text-[13px] leading-[1.65]" style={{ color: "#5E6270", boxShadow: "0 3px 0 #E6E2DA" }}>
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-extrabold" style={{ color: "#1B2340" }}>
            {editing ? "금액 (그대로)" : "결제 금액"}
          </span>
          <b className="ds-num text-[19px]" style={{ color: "#1B2340" }} aria-live="polite">
            {amount == null ? "요금 확정 전" : amount === 0 ? "무료" : fmtWon(amount)}
          </b>
        </div>
        {!editing && d?.people && people > 0 && (
          <div className="ds-num mt-0.5 text-right">
            이용 시간 {fmtWon(priceOf(type, dur, 0))} + 추가 {people}명 {fmtWon(people * EXTRA_PERSON_FEE)}
          </div>
        )}
        확정 뒤 취소는 서비스일 {CANCEL_FREE_DAYS}일 전까지 바로, 그 안에는 관제 승인을 거쳐 취소됩니다.
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <WhiteBtn className="flex-1 text-[17px]" onClick={onClose}>
            {editing ? "그만두기" : "닫기"}
          </WhiteBtn>
          <Btn
            tone="navy"
            h={56}
            className="flex-[2] text-[16px] disabled:opacity-50"
            disabled={editing ? !changed || (!menuOf(initial.type) && !detail.trim()) : !!missing}
            onClick={() => {
              if (editing) {
                // 메뉴 서비스는 전할 말이 비어 있어도 된다 — 직접 적은 부탁만 내용이 있어야 한다
                if (changed && (detail.trim() || menuOf(initial.type))) onSave?.(patch);
                return;
              }
              if (missing) return;
              const now = Date.now();
              const req = {
                id: `rq-${now}`,
                dir: "fromGuardian",
                type,
                detail: detail.trim(),
                amount,
                preferredDate: ymd || null,
                preferredTime: start || null,
                ...(d ? { durationMin: d.fixed ? d.min : dur } : {}),
                ...(d?.people ? { extraPeople: people } : {}),
                ...(useNext ? { nextAppt: { at: appt.at, title: appt.title || "", eventId: appt.id || null } } : {}),
                hospital: useNext ? appt.title || null : hospitalAsk && hospital.trim() ? hospital.trim() : null,
                urgency,
                // 가구 담당 컨시어지가 받아 확인한다 — 관제는 바꿀 수 있다 (2026-10-05)
                assignee: assigneeNow() || "",
                photos: photo ? ["첨부사진.jpg"] : [],
                status: payNow ? "awaitingPayment" : "requested",
                history: [
                  { at: now, status: "requested", note: `보호자 요청${useNext ? " · 다음 외래 동행" : ""}` },
                  ...(payNow ? [{ at: now, status: "awaitingPayment", note: `요청과 함께 결제 ${fmtWon(amount)}` }] : []),
                ],
                proof: null,
              };
              onCreate(req);
              if (!payNow) setDone(req);
            }}
          >
            {editing ? (changed ? "고친 내용 저장" : "고친 곳이 없어요") : missing || (payNow ? `${fmtWon(amount)} 결제하고 요청` : "요청하기")}
          </Btn>
        </div>
        {payNow && (
          <p className="text-center text-[13px] font-bold" style={{ color: "#6B6658" }}>
            일정이 확정되지 않으면 전액 환불돼요
          </p>
        )}
      </div>
    </Sheet>
  );
}
