import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { Card, SectionLabel, PrimaryButton, GhostButton, Badge } from "../components/ui";
import { PRICING, BASE_BENEFITS, PAYMENT_MODES, fmtWon } from "../lib/config";
import { TIER1_DISTRICTS, TIER2_DISTRICTS, SCREENING_ITEMS, screenRegion } from "../lib/region";
import { useAppState } from "../lib/state";

// 온보딩 — REQ-05 상품 · REQ-07 결제권한 · REQ-15 이용적합성 심사
// 단계: ① 보호자 정보 → ② 어르신·지역 심사 → ③ 결제권한 → ④ 상품 확인 → ⑤ 완료

const RELATIONS = ["아들", "딸", "배우자", "기타"];
const DISTRICTS = [...TIER1_DISTRICTS, ...TIER2_DISTRICTS, "그 외 지역"];

export default function Onboarding() {
  const router = useRouter();
  const { dispatch } = useAppState();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    rel: null,
    res: null,
    elderName: "",
    district: null,
    paymentMode: "limit",
    limitAmount: PRICING.paymentLimitDefault,
  });
  const [waitlisted, setWaitlisted] = useState(false);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const result = form.district ? screenRegion(form.district) : null;
  const restricted = result && result.tier === 0;

  const steps = ["보호자", "이용적합성 심사", "결제권한", "상품 확인", "완료"];

  const finish = () => {
    dispatch({
      type: "completeOnboarding",
      payload: {
        rel: form.rel,
        res: form.res,
        elderName: form.elderName || "김순자",
        district: form.district,
        tier: result?.tier ?? 1,
        paymentMode: form.paymentMode,
        limitAmount: form.limitAmount,
        joinedAt: Date.now(),
      },
    });
    setStep(4);
  };

  return (
    <>
      <Head>
        <title>가입 상담 — K-CARE</title>
      </Head>
      <div className="min-h-screen bg-nav">
        <div className="mx-auto min-h-screen w-full max-w-[430px] bg-paper px-4 pb-16 pt-5">
          {/* 진행 표시 */}
          <div className="mb-6 flex items-center gap-1.5">
            {steps.map((s, i) => (
              <div key={s} className="flex-1">
                <div
                  className={`h-[4px] rounded-full ${i <= step ? "bg-gold" : "bg-navy/10"}`}
                />
                <div
                  className={`mt-1 text-[9px] font-bold ${
                    i === step ? "text-navy" : "text-muted/60"
                  }`}
                >
                  {s}
                </div>
              </div>
            ))}
          </div>

          {step === 0 && (
            <section className="animate-tickIn space-y-4">
              <h1 className="text-[24px] font-black leading-[1.4] text-navy">
                어르신과의 관계를
                <br />
                알려주세요
              </h1>
              <Card className="p-5">
                <SectionLabel>관계</SectionLabel>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {RELATIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => set({ rel: r })}
                      className={`btn-press rounded-xl border py-3 text-[14px] font-bold ${
                        form.rel === r
                          ? "border-gold bg-gold/10 text-navy"
                          : "border-navy/15 text-muted"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div className="mt-5">
                  <SectionLabel>거주지</SectionLabel>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {["국내", "해외"].map((r) => (
                      <button
                        key={r}
                        onClick={() => set({ res: r })}
                        className={`btn-press rounded-xl border py-3 text-[14px] font-bold ${
                          form.res === r
                            ? "border-gold bg-gold/10 text-navy"
                            : "border-navy/15 text-muted"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  {form.res === "해외" && (
                    <p className="mt-3 rounded-xl bg-navy/5 p-3 text-[12px] leading-[1.7] text-muted">
                      해외 거주 보호자는 시차에 맞춘 리포트 발송 시각과 현지 통화 결제를
                      배정 상담에서 함께 설정합니다.
                    </p>
                  )}
                </div>
              </Card>
              <PrimaryButton disabled={!form.rel || !form.res} onClick={() => setStep(1)}>
                다음
              </PrimaryButton>
            </section>
          )}

          {step === 1 && (
            <section className="animate-tickIn space-y-4">
              <h1 className="text-[24px] font-black leading-[1.4] text-navy">
                서비스 가능지역 및<br />
                이용적합성 심사
              </h1>
              <p className="text-[12px] leading-[1.7] text-muted">
                주소 기준으로 서비스 권역을 먼저 확인하고, 나머지 항목은 방문 상담에서
                확인합니다.
              </p>
              <Card className="p-5">
                <SectionLabel>어르신 성함 (선택)</SectionLabel>
                <input
                  value={form.elderName}
                  onChange={(e) => set({ elderName: e.target.value })}
                  placeholder="예: 김순자"
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-white px-3.5 py-3 text-[14px] outline-none focus:border-gold"
                />
                <div className="mt-5">
                  <SectionLabel>어르신 거주 지역</SectionLabel>
                  <select
                    value={form.district || ""}
                    onChange={(e) => {
                      set({ district: e.target.value });
                      setWaitlisted(false);
                    }}
                    className="mt-2 w-full rounded-xl border border-navy/15 bg-white px-3.5 py-3 text-[14px] outline-none focus:border-gold"
                  >
                    <option value="" disabled>
                      지역 선택
                    </option>
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </Card>

              {result && (
                <Card
                  className={`animate-tickIn p-5 ${
                    restricted ? "border-danger/30" : "border-green/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <SectionLabel>심사 결과</SectionLabel>
                    <Badge
                      fg={restricted ? "#C0392B" : "#1E7A5A"}
                      bg={restricted ? "rgba(192,57,43,.1)" : "rgba(30,122,90,.12)"}
                    >
                      {result.label}
                    </Badge>
                  </div>
                  <p className="mt-2 text-[13px] leading-[1.75] text-ink">{result.summary}</p>
                  {result.tier === 1 && (
                    <div className="mt-3 rounded-xl bg-navy p-3.5 text-white">
                      <span className="text-[12px] opacity-75">월 구독료 </span>
                      <span className="font-num text-[20px] font-bold">
                        {fmtWon(PRICING.subscription.tier1.monthly)}
                      </span>
                    </div>
                  )}
                  {result.tier === 2 && (
                    <div className="mt-3 rounded-xl bg-amber/10 p-3.5 text-[12px] leading-[1.7] text-amber">
                      2급지 구독료·출동비는 확정 전입니다. 배정 상담에서 안내드립니다.
                    </div>
                  )}
                  {!restricted && (
                    <div className="mt-4 border-t border-navy/10 pt-3">
                      <SectionLabel>방문 상담 시 확인 항목</SectionLabel>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {SCREENING_ITEMS.filter((i) => !i.auto).map((i) => (
                          <span
                            key={i.name}
                            className="rounded-full border border-navy/15 px-2.5 py-1 text-[11px] text-muted"
                          >
                            {i.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {waitlisted && (
                <div className="animate-tickIn rounded-card border border-green/30 bg-[#F1FAF6] p-4 text-[13px] leading-[1.7] text-green">
                  대기 등록이 접수되었습니다. 해당 지역 서비스가 열리면 남겨주신 연락처로
                  가장 먼저 안내드립니다. (데모 — 연락처 수집은 실연동 대기)
                </div>
              )}

              <div className="flex gap-2">
                <GhostButton onClick={() => setStep(0)} className="flex-1">
                  이전
                </GhostButton>
                {restricted ? (
                  <PrimaryButton
                    className="flex-[2]"
                    disabled={waitlisted}
                    onClick={() => setWaitlisted(true)}
                  >
                    {waitlisted ? "대기 등록 완료" : "대기 등록 남기기"}
                  </PrimaryButton>
                ) : (
                  <PrimaryButton
                    className="flex-[2]"
                    disabled={!result}
                    onClick={() => setStep(2)}
                  >
                    다음
                  </PrimaryButton>
                )}
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="animate-tickIn space-y-4">
              <h1 className="text-[24px] font-black leading-[1.4] text-navy">
                결제권한을
                <br />
                선택해 주세요
              </h1>
              <p className="text-[12px] leading-[1.7] text-muted">
                어르신이 스토어에 담은 물품을 누가 결제할지 정합니다. 가입 후에도 보호자가
                변경할 수 있습니다.
              </p>
              <div className="space-y-2.5">
                {PAYMENT_MODES.map((m) => {
                  const on = form.paymentMode === m.key;
                  return (
                    <Card
                      key={m.key}
                      onClick={() => set({ paymentMode: m.key })}
                      className={`p-4 ${on ? "border-gold ring-1 ring-gold/50" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block h-[16px] w-[16px] rounded-full border-[5px] ${
                            on ? "border-gold" : "border-navy/20"
                          }`}
                        />
                        <span className="text-[14px] font-bold text-navy">{m.label}</span>
                        {m.recommended && (
                          <Badge fg="#8A5D12" bg="rgba(176,141,87,.16)">
                            권장
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1.5 pl-6 text-[12px] leading-[1.65] text-muted">
                        {m.desc}
                      </p>
                      {m.key === "limit" && on && (
                        <div className="mt-3 flex items-center gap-2 pl-6">
                          <span className="text-[12px] text-muted">한도</span>
                          {[30000, 50000, 100000].map((v) => (
                            <button
                              key={v}
                              onClick={(e) => {
                                e.stopPropagation();
                                set({ limitAmount: v });
                              }}
                              className={`btn-press rounded-lg border px-2.5 py-1.5 font-num text-[12px] font-bold ${
                                form.limitAmount === v
                                  ? "border-gold bg-gold/10 text-navy"
                                  : "border-navy/15 text-muted"
                              }`}
                            >
                              {fmtWon(v)}
                            </button>
                          ))}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <GhostButton onClick={() => setStep(1)} className="flex-1">
                  이전
                </GhostButton>
                <PrimaryButton className="flex-[2]" onClick={() => setStep(3)}>
                  다음
                </PrimaryButton>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="animate-tickIn space-y-4">
              <h1 className="text-[24px] font-black leading-[1.4] text-navy">
                기본상품을
                <br />
                확인해 주세요
              </h1>
              <Card className="overflow-hidden">
                <div className="bg-navy p-5 text-white">
                  <SectionLabel>
                    <span className="text-gold-soft">K-CARE 기본 멤버십</span>
                  </SectionLabel>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="font-num text-[30px] font-bold">
                      {result?.tier === 2 ? "별도 산정" : fmtWon(PRICING.subscription.tier1.monthly)}
                    </span>
                    {result?.tier !== 2 && <span className="text-[12px] opacity-70">/ 월 · 1급지</span>}
                  </div>
                  <div className="mt-1.5 text-[11px] leading-[1.7] opacity-70">
                    최초 1회 가입비 {fmtWon(PRICING.joinFee.min)}
                    {!PRICING.joinFee.confirmed &&
                      ` (확정 전 · 최대 ${fmtWon(PRICING.joinFee.max)})`}{" "}
                    · 언제든 해지 가능
                  </div>
                </div>
                <ul className="space-y-2.5 p-5">
                  {BASE_BENEFITS.map((b) => (
                    <li key={b.name} className="flex items-start gap-2.5">
                      <span className="mt-[3px] inline-flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full bg-green/15 text-[10px] font-bold text-green">
                        ✓
                      </span>
                      <div>
                        <div className="text-[13px] font-bold text-ink">{b.name}</div>
                        {b.note && <div className="text-[11px] text-muted">{b.note}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
              <div className="flex gap-2">
                <GhostButton onClick={() => setStep(2)} className="flex-1">
                  이전
                </GhostButton>
                <PrimaryButton className="flex-[2]" onClick={finish}>
                  가입 신청 (결제 연동 대기 · 데모)
                </PrimaryButton>
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="animate-tickIn space-y-4 pt-6">
              <div className="mx-auto flex h-[64px] w-[64px] items-center justify-center rounded-full bg-green/12 text-[28px] text-green">
                ✓
              </div>
              <h1 className="text-center text-[24px] font-black leading-[1.4] text-navy">
                가입 신청이
                <br />
                접수되었습니다
              </h1>
              <Card className="p-5">
                <SectionLabel>다음 단계</SectionLabel>
                <ol className="mt-3 space-y-4">
                  {[
                    ["전담 컨시어지 배정", "2인 1조 · 영업일 1일 이내"],
                    ["사전 상담 콜", "30분 · 방문 확인 항목과 케어 프로필 구축"],
                    ["첫 안심방문", "갤럭시 워치 · 안심케어박스 전달"],
                  ].map(([t, d], i) => (
                    <li key={t} className="flex items-start gap-3">
                      <span className="mt-[1px] inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-navy font-num text-[11px] font-bold text-white">
                        {i + 1}
                      </span>
                      <div>
                        <div className="text-[14px] font-bold text-navy">{t}</div>
                        <div className="text-[12px] text-muted">{d}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </Card>
              <PrimaryButton onClick={() => router.push("/family")}>
                가족 앱으로 이동
              </PrimaryButton>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
