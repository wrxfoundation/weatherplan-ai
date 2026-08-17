import Head from "next/head";
import { useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { Card, SectionLabel, PrimaryButton, GhostButton, Badge } from "../../components/ui";
import { STATUS, GUARDIAN_PRESETS, SERVICE_MENU, SERVICE_PLUS, URGENCY } from "../../lib/requests";
import { fmtWon, PRICING } from "../../lib/config";
import { useAppState, needsGuardianApproval } from "../../lib/state";
import { honorific } from "../../lib/tracks";

// 양방향 "해주세요" — REQ-03 (상태 8종 · 첨부 6종) + REQ-07 (결제 한도 승인)
// 보호자 화면: 내 요청 생성 + 컨시어지 발신 요청의 결제 승인.

const fmtD = (t) =>
  new Date(t).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", weekday: "short" });

export default function RequestsPage() {
  const { state, dispatch } = useAppState();
  const isPrimary = (state.demo.guardianRole || "primary") === "primary";
  const [creating, setCreating] = useState(false); // false | true | 서비스 메뉴 항목
  const [openId, setOpenId] = useState(null);
  const [wanted, setWanted] = useState({}); // 미개시 서비스 수요 신호 — no 별 1회
  const ob = state.onboarding;

  const active = state.requests.filter(
    (r) => !["done", "cancelled", "rejected"].includes(r.status)
  );
  const closed = state.requests.filter((r) =>
    ["done", "cancelled", "rejected"].includes(r.status)
  );

  const limitLabel =
    ob?.paymentMode === "limit" || !ob
      ? `${fmtWon(ob?.limitAmount ?? PRICING.paymentLimitDefault)} 초과 시 보호자 승인`
      : null;

  return (
    <>
      <Head>
        <title>해주세요 — K-CARE</title>
      </Head>
      <FamilyLayout title="해주세요">
        <p className="px-1 text-[13px] leading-[1.7] text-muted">
          채팅이 아니라 처리 상태가 남는 업무형 요청입니다. 모든 요청은 사진·금액·완료증빙과
          함께 기록됩니다.{limitLabel && ` 결제권한: ${limitLabel}.`}
        </p>

        {/* 서비스 메뉴 — 실무자 피드백 (2026-08-09): no1~6 활성 · no7~11 예고 · no12 응급 */}
        <Card className="p-4">
          <SectionLabel>지금 요청할 수 있는 서비스</SectionLabel>
          <div className="mt-2.5 space-y-2">
            {SERVICE_MENU.filter((s) => s.active).map((s) => (
              <button
                key={s.no}
                onClick={() => setCreating(s)}
                className="btn-press w-full rounded-xl border border-navy/12 p-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold text-navy">{s.name}</span>
                  <span className="ml-auto shrink-0 rounded-full bg-navy/[.06] px-2 py-[3px] text-[11px] font-bold text-muted">
                    {s.cat}
                  </span>
                </div>
                <div className="mt-1 font-num text-[12.5px] font-bold text-gold">{s.priceLabel}</div>
                <div className="mt-0.5 text-[12px] leading-[1.6] text-muted">{s.scope}</div>
                {s.point && <div className="mt-0.5 text-[12px] leading-[1.6] text-green">{s.point}</div>}
              </button>
            ))}
          </div>

          {/* 해주세요 PLUS — 외주 파트너 연계 (개편안 V2 ONE STOP 축) */}
          <div className="mt-4 border-t border-navy/[.08] pt-3">
            <div className="flex items-center gap-2">
              <SectionLabel>해주세요 PLUS — 전문업체 연결</SectionLabel>
              <Badge fg="#8A5D12" bg="rgba(176,141,87,.16)">
                외주 연계
              </Badge>
            </div>
            <p className="mt-1.5 text-[12px] leading-[1.65] text-muted">
              저희가 직접 못 하는 일은 전문업체로 연결해 드리고 진행 상황을 보고합니다.
              공사·수리의 책임은 시공 업체에 있습니다.
            </p>
            <div className="mt-2.5 space-y-2">
              {SERVICE_PLUS.map((s) => (
                <button
                  key={s.key}
                  onClick={() =>
                    setCreating({
                      no: `plus-${s.key}`,
                      name: s.name,
                      priceLabel: s.priceLabel,
                      amount: s.amount,
                    })
                  }
                  className="btn-press w-full rounded-xl border border-gold/25 bg-gold/[.05] p-3 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold text-navy">{s.name}</span>
                    <span className="ml-auto shrink-0 rounded-full bg-white px-2 py-[3px] text-[11px] font-bold text-muted">
                      {s.tag}
                    </span>
                  </div>
                  <div className={`mt-1 font-num text-[12.5px] font-bold ${s.confirmed ? "text-gold" : "text-muted"}`}>
                    {s.priceLabel}
                  </div>
                  <div className="mt-0.5 text-[12px] leading-[1.6] text-muted">{s.scope}</div>
                  <div className="mt-0.5 text-[11.5px] leading-[1.55] text-amber">{s.note}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 미개시 서비스 — 표기만 하고 비활성. "이런 서비스도 앞으로 이용할 수
              있구나"를 보여주고, 필요 신호로 수요를 잰다 (실무자 요청 그대로) */}
          <div className="mt-4 border-t border-navy/[.08] pt-3">
            <SectionLabel>준비 중인 서비스 — 곧 열립니다</SectionLabel>
            <div className="mt-2.5 space-y-2">
              {SERVICE_MENU.filter((s) => !s.active).map((s) => {
                const sent = !!wanted[s.no];
                return (
                  <div key={s.no} className="rounded-xl border border-dashed border-navy/15 bg-navy/[.025] p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[14.5px] font-bold text-muted">{s.name}</span>
                      <span className="ml-auto shrink-0 rounded-full bg-navy/[.05] px-2 py-[3px] text-[10.5px] font-bold text-muted/70">
                        추후 서비스 개시
                      </span>
                    </div>
                    <div className="mt-0.5 text-[12px] leading-[1.6] text-muted/80">{s.scope}</div>
                    <button
                      onClick={() => {
                        if (sent) return;
                        setWanted((w) => ({ ...w, [s.no]: true }));
                        dispatch({
                          type: "pushEvent",
                          payload: { kind: "수요", text: `미개시 서비스 수요 신호 — ${s.name}`, color: "#8FA9CC" },
                        });
                      }}
                      className={`btn-press mt-2 rounded-lg border px-3 py-1.5 text-[12px] font-bold ${
                        sent ? "border-green/30 bg-green/10 text-green" : "border-navy/20 text-navy"
                      }`}
                    >
                      {sent ? "✓ 알려주셔서 감사합니다 — 열리면 먼저 안내드릴게요" : "이 서비스가 필요하신가요?"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {active.length === 0 && (
          <Card className="p-5 text-center text-[15px] text-muted">진행 중인 요청이 없습니다.</Card>
        )}

        {active.map((r) => (
          <RequestCard
            key={r.id}
            req={r}
            open={openId === r.id}
            onToggle={() => setOpenId(openId === r.id ? null : r.id)}
            onboarding={ob}
            dispatch={dispatch}
            isPrimary={isPrimary}
          />
        ))}

        {closed.length > 0 && (
          <>
            <SectionLabel>완료 · 종결</SectionLabel>
            {closed.map((r) => (
              <RequestCard
                key={r.id}
                req={r}
                open={openId === r.id}
                onToggle={() => setOpenId(openId === r.id ? null : r.id)}
                onboarding={ob}
                dispatch={dispatch}
                isPrimary={isPrimary}
              />
            ))}
          </>
        )}

        <PrimaryButton onClick={() => setCreating(true)}>해주세요 요청하기</PrimaryButton>

        {creating && (
          <CreateRequestSheet
            preset={typeof creating === "object" ? creating : null}
            onClose={() => setCreating(false)}
            onCreate={(req) => {
              dispatch({ type: "addRequest", payload: req });
              setCreating(false);
            }}
          />
        )}
      </FamilyLayout>
    </>
  );
}

const STEP_ORDER = ["requested", "confirmed", "awaitingPayment", "inProgress", "done"];
const STEP_LABELS = ["접수", "확정", "결제", "진행", "완료"];

function RequestCard({ req, open, onToggle, onboarding, dispatch, isPrimary }) {
  const honor = honorific(onboarding); // 고객 호칭 — 전부 "~~님" (2026-08-12 시트)
  const [notified, setNotified] = useState(false); // 부 보호자 → 주 보호자 승인 알림
  const st = STATUS[req.status];
  const needApproval = needsGuardianApproval(onboarding, req.amount);
  const stepIdx = STEP_ORDER.indexOf(req.status); // 취소·처리불가·관리자 검토는 -1 → 스텝퍼 미표시

  return (
    <Card className="overflow-hidden">
      <button onClick={onToggle} className="btn-press w-full p-4 text-left">
        <div className="flex items-center gap-2">
          <Badge fg={st.fg} bg={st.bg}>
            {st.label}
          </Badge>
          {req.urgency === "urgent" && (
            <Badge fg={URGENCY.urgent.fg} bg={URGENCY.urgent.bg}>
              긴급
            </Badge>
          )}
          <span className="ml-auto text-[11px] font-bold text-muted/70">
            {
              {
                fromConcierge: "컨시어지 → 보호자",
                fromElder: `${honor} → 보호자`,
                fromGuardian: "보호자 → 컨시어지",
              }[req.dir]
            }
          </span>
        </div>
        <div className="mt-2 text-[17px] font-bold leading-[1.45] text-navy">{req.type}</div>
        <div className="mt-0.5 line-clamp-2 text-[13px] leading-[1.65] text-muted">
          {req.detail}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted">
          {req.amount != null && (
            <span>
              금액 <b className="font-num text-ink">{fmtWon(req.amount)}</b>
            </span>
          )}
          {req.preferredDate && <span>희망일 {fmtD(req.preferredDate)}</span>}
          <span>담당 {req.assignee}</span>
          {req.photos.length > 0 && <span>사진 {req.photos.length}장</span>}
        </div>
        {/* 진행 스텝퍼 — 지금 어디까지 왔는지 한눈에 */}
        {stepIdx >= 0 && (
          <div className="mt-3 flex items-center gap-1">
            {STEP_LABELS.map((l, i) => (
              <div key={l} className="flex-1">
                <div
                  className="h-[5px] rounded-full"
                  style={{
                    background:
                      i < stepIdx ? "#0A1F3C" : i === stepIdx ? "#B08D57" : "rgba(10,31,60,.1)",
                  }}
                />
                <div
                  className={`mt-1 text-center text-[10px] font-bold ${
                    i === stepIdx ? "text-[#7A5C28]" : i < stepIdx ? "text-navy" : "text-muted/50"
                  }`}
                >
                  {l}
                </div>
              </div>
            ))}
          </div>
        )}
      </button>

      {open && (
        <div className="border-t border-navy/10 bg-paper/60 p-4">
          {/* 상태 타임라인 */}
          <SectionLabel>처리 이력</SectionLabel>
          <div className="mt-2.5 space-y-2">
            {req.history.map((h, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span
                  className="mt-[5px] h-[8px] w-[8px] shrink-0 rounded-full"
                  style={{ background: STATUS[h.status].fg }}
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[13px] font-bold text-ink">
                    {STATUS[h.status].label}
                  </span>
                  <span className="ml-2 font-num text-[11px] text-muted">
                    {new Date(h.at).toLocaleDateString("ko-KR", {
                      month: "numeric",
                      day: "numeric",
                    })}
                  </span>
                  {h.note && (
                    <div className="text-[12px] leading-[1.6] text-muted">{h.note}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {req.proof && (
            <div className="mt-3 rounded-xl border border-green/25 bg-green/5 p-3 text-[12px] text-green">
              완료증빙 첨부됨 · {req.proof}
            </div>
          )}

          {/* 결제대기 — 보호자 승인 (REQ-07 한도 로직) */}
          {req.status === "awaitingPayment" && (
            <div className="mt-4">
              <div className="rounded-xl border border-amber/30 bg-white p-3.5 text-[13px] leading-[1.7] text-ink">
                {needApproval ? (
                  <>
                    결제 금액 <b className="font-num">{fmtWon(req.amount)}</b> —{" "}
                    {onboarding?.paymentMode === "guardianOnly"
                      ? "보호자 결제 방식이므로"
                      : "설정 한도를 초과하여"}{" "}
                    보호자 승인이 필요합니다.
                  </>
                ) : (
                  <>
                    결제 금액 <b className="font-num">{fmtWon(req.amount)}</b> — 설정 한도
                    이내로 {honor} 직접 결제도 가능합니다. 지금 승인하면 바로 진행됩니다.
                  </>
                )}
              </div>
              {isPrimary ? (
                <div className="mt-2.5 flex gap-2">
                  <GhostButton
                    className="flex-1"
                    onClick={() =>
                      dispatch({
                        type: "transitionRequest",
                        id: req.id,
                        to: "needsAdmin",
                        note: "보호자가 금액 확인을 요청함",
                      })
                    }
                  >
                    금액 문의
                  </GhostButton>
                  <PrimaryButton
                    className="flex-[2]"
                    onClick={() =>
                      dispatch({
                        type: "transitionRequest",
                        id: req.id,
                        to: "inProgress",
                        note: `보호자 승인 · ${fmtWon(req.amount)} (결제 연동 대기 · 데모)`,
                      })
                    }
                  >
                    승인하고 결제 (데모)
                  </PrimaryButton>
                </div>
              ) : (
                // 부 보호자 — 결제 승인 권한 없음. 주 보호자 호출만
                <button
                  onClick={() => {
                    if (notified) return;
                    setNotified(true);
                    dispatch({
                      type: "pushEvent",
                      payload: { kind: "승인", text: "부 보호자 → 주 보호자 결제 승인 요청 알림", color: "#8FA9CC" },
                    });
                  }}
                  className={`btn-press mt-2.5 w-full rounded-xl border py-3 text-[15px] font-bold ${
                    notified ? "border-green/30 bg-green/10 text-green" : "border-navy/20 text-navy"
                  }`}
                >
                  {notified ? "✓ 주 보호자(민수)에게 알림 보냄" : "결제 승인은 주 보호자 권한 — 알림 보내기"}
                </button>
              )}
            </div>
          )}

          {/* 취소 — 요청됨·확인됨에서만 (상태 머신 준수) */}
          {["requested", "confirmed"].includes(req.status) &&
            req.dir === "fromGuardian" && (
              <GhostButton
                className="mt-3"
                onClick={() =>
                  dispatch({
                    type: "transitionRequest",
                    id: req.id,
                    to: "cancelled",
                    note: "보호자 취소",
                  })
                }
              >
                요청 취소
              </GhostButton>
            )}
        </div>
      )}
    </Card>
  );
}

function CreateRequestSheet({ preset, onClose, onCreate }) {
  const [type, setType] = useState(preset ? preset.name : GUARDIAN_PRESETS[0]);
  const [detail, setDetail] = useState("");
  const [amount, setAmount] = useState(preset?.amount ? String(preset.amount) : "");
  const [preferredDate, setPreferredDate] = useState("");
  const [urgency, setUrgency] = useState("normal");
  const [photo, setPhoto] = useState(false);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[rgba(8,23,45,.45)]">
      <div className="max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-white p-6 pb-8">
        <div className="mx-auto mb-4 h-[4px] w-[38px] rounded-full bg-navy/15" />
        <div className="text-[19px] font-black text-navy">{preset ? preset.name : "해주세요 요청"}</div>
        <p className="mt-1 text-[12px] text-muted">
          담당 컨시어지에게 전달되고, 처리 상태가 단계별로 기록됩니다.
        </p>
        {preset?.priceLabel && (
          <p className="mt-2 rounded-xl bg-gold/[.08] px-3 py-2 font-num text-[12.5px] font-bold text-gold">
            {preset.priceLabel}
          </p>
        )}

        <div className="mt-4">
          <SectionLabel>요청 종류</SectionLabel>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(preset ? [preset.name, ...GUARDIAN_PRESETS] : GUARDIAN_PRESETS).map((p) => (
              <button
                key={p}
                onClick={() => setType(p)}
                className={`btn-press rounded-full border px-3 py-1.5 text-[13px] font-bold ${
                  type === p ? "border-gold bg-gold/10 text-navy" : "border-navy/15 text-muted"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <SectionLabel>상세 내용</SectionLabel>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={3}
            placeholder="무엇을 어떻게 해드리면 될까요?"
            className="mt-2 w-full resize-none rounded-xl border border-navy/15 px-3.5 py-3 text-[16px] leading-[1.6] outline-none focus:border-gold"
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <SectionLabel>예상 금액 (선택)</SectionLabel>
            <input
              aria-label="예상 금액 (선택)"
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="원"
              className="mt-2 w-full rounded-xl border border-navy/15 px-3.5 py-3 font-num text-[16px] outline-none focus:border-gold"
            />
          </div>
          <div>
            <SectionLabel>희망일 (선택)</SectionLabel>
            <input
              aria-label="희망일 (선택)"
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="mt-2 w-full rounded-xl border border-navy/15 px-3.5 py-3 text-[15px] outline-none focus:border-gold"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div>
            <SectionLabel>긴급도</SectionLabel>
            <div className="mt-2 flex gap-1.5">
              {Object.entries(URGENCY).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => setUrgency(k)}
                  className={`btn-press rounded-lg border px-3 py-1.5 text-[13px] font-bold ${
                    urgency === k
                      ? "border-gold bg-gold/10 text-navy"
                      : "border-navy/15 text-muted"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <SectionLabel>사진 첨부</SectionLabel>
            <button
              onClick={() => setPhoto((v) => !v)}
              className={`btn-press mt-2 w-full rounded-lg border px-3 py-1.5 text-[13px] font-bold ${
                photo ? "border-gold bg-gold/10 text-navy" : "border-navy/15 text-muted"
              }`}
            >
              {photo ? "첨부됨 (데모)" : "사진 선택 (데모)"}
            </button>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <GhostButton onClick={onClose} className="flex-1">
            닫기
          </GhostButton>
          <PrimaryButton
            className="flex-[2]"
            disabled={!detail.trim()}
            onClick={() =>
              onCreate({
                id: `rq-${Date.now()}`,
                dir: "fromGuardian",
                type,
                detail: detail.trim(),
                amount: amount ? Number(amount) : null,
                preferredDate: preferredDate ? new Date(preferredDate).getTime() : null,
                urgency,
                assignee: "박지현",
                photos: photo ? ["첨부사진.jpg"] : [],
                status: "requested",
                history: [{ at: Date.now(), status: "requested", note: "" }],
                proof: null,
              })
            }
          >
            요청 보내기
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
