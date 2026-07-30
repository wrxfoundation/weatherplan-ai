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
    relDetail: "", // 관계 '기타' 상세 — 누구인지 기재
    res: null,
    phone: "", // 보호자 연락처 — 배정 상담·대기 안내에 필수
    elderName: "",
    district: null,
    paymentMode: "limit",
    limitAmount: PRICING.paymentLimitDefault,
    agreeTerms: false, // 필수 — 이용약관 (임시보호자 범위 · 119 연계 한계 포함)
    agreePrivacy: false, // 필수 — 개인정보·건강정보 처리
    videoConsent: false, // 선택 — 방문기록 영상
  });
  const [waitlisted, setWaitlisted] = useState(false);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const result = form.district ? screenRegion(form.district) : null;
  const restricted = result && result.tier === 0;
  const phoneDigits = form.phone.replace(/\D/g, "");
  const step0Ready =
    form.rel &&
    form.res &&
    phoneDigits.length >= 10 &&
    (form.rel !== "기타" || form.relDetail.trim());

  const steps = ["보호자", "이용적합성 심사", "결제권한", "상품 확인", "완료"];

  const finish = () => {
    dispatch({
      type: "completeOnboarding",
      payload: {
        rel: form.rel,
        relDetail: form.rel === "기타" ? form.relDetail.trim() : null,
        phone: form.phone,
        res: form.res,
        elderName: form.elderName || "김순자",
        district: form.district,
        tier: result?.tier ?? 1,
        paymentMode: form.paymentMode,
        limitAmount: form.limitAmount,
        videoConsent: form.videoConsent,
        joinedAt: Date.now(),
      },
    });
    dispatch({
      type: "pushEvent",
      payload: {
        kind: "가입",
        text: `신규 가입 접수 — ${form.elderName || "김순자"}님 가구 (${form.district} · ${form.rel})`,
        color: "#8FE3C0",
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
                  className={`mt-1 text-[10px] font-bold ${
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
              <h1 className="text-[27px] font-black leading-[1.4] text-navy">
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
                      className={`btn-press rounded-xl border py-3 text-[16px] font-bold ${
                        form.rel === r
                          ? "border-gold bg-gold/10 text-navy"
                          : "border-navy/15 text-muted"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {/* 기타 선택 시 — 누구인지 기재 (필수) */}
                {form.rel === "기타" && (
                  <input
                    value={form.relDetail}
                    onChange={(e) => set({ relDetail: e.target.value })}
                    placeholder="어떤 관계인지 적어주세요 (예: 조카, 손주, 이웃, 복지기관)"
                    className="animate-tickIn mt-2 w-full rounded-xl border border-gold/60 bg-white px-3.5 py-3 text-[16px] outline-none focus:border-gold"
                  />
                )}
                <div className="mt-5">
                  <SectionLabel>거주지</SectionLabel>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {["국내", "해외"].map((r) => (
                      <button
                        key={r}
                        onClick={() => set({ res: r })}
                        className={`btn-press rounded-xl border py-3 text-[16px] font-bold ${
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
                    <p className="mt-3 rounded-xl bg-navy/5 p-3 text-[13px] leading-[1.7] text-muted">
                      해외 거주 보호자는 시차에 맞춘 리포트 발송 시각과 현지 통화 결제를
                      배정 상담에서 함께 설정합니다.
                    </p>
                  )}
                </div>
                {/* 연락처 — 배정 상담 콜·대기 안내에 필수 */}
                <div className="mt-5">
                  <SectionLabel>보호자 연락처</SectionLabel>
                  <input
                    value={form.phone}
                    onChange={(e) => set({ phone: e.target.value })}
                    type="tel"
                    inputMode="tel"
                    placeholder="010-0000-0000"
                    className="mt-2 w-full rounded-xl border border-navy/15 bg-white px-3.5 py-3 font-num text-[16px] outline-none focus:border-gold"
                  />
                  <p className="mt-1.5 text-[12px] leading-[1.6] text-muted">
                    배정 상담 콜(30분)과 서비스 안내에 사용합니다. 이 번호 외에는 연락하지
                    않습니다.
                  </p>
                </div>
              </Card>
              <PrimaryButton disabled={!step0Ready} onClick={() => setStep(1)}>
                다음
              </PrimaryButton>
            </section>
          )}

          {step === 1 && (
            <section className="animate-tickIn space-y-4">
              <h1 className="text-[27px] font-black leading-[1.4] text-navy">
                서비스 가능지역 및<br />
                이용적합성 심사
              </h1>
              <p className="text-[13px] leading-[1.7] text-muted">
                주소 기준으로 서비스 권역을 먼저 확인하고, 나머지 항목은 방문 상담에서
                확인합니다.
              </p>
              <Card className="p-5">
                <SectionLabel>어르신 성함 (선택)</SectionLabel>
                <input
                  value={form.elderName}
                  onChange={(e) => set({ elderName: e.target.value })}
                  placeholder="예: 김순자"
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-white px-3.5 py-3 text-[16px] outline-none focus:border-gold"
                />
                <div className="mt-5">
                  <SectionLabel>어르신 거주 지역</SectionLabel>
                  <select
                    value={form.district || ""}
                    onChange={(e) => {
                      set({ district: e.target.value });
                      setWaitlisted(false);
                    }}
                    className="mt-2 w-full rounded-xl border border-navy/15 bg-white px-3.5 py-3 text-[16px] outline-none focus:border-gold"
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
                  <p className="mt-2 text-[15px] leading-[1.75] text-ink">{result.summary}</p>
                  {result.tier === 1 && (
                    <div className="mt-3 rounded-xl bg-navy p-3.5 text-white">
                      <span className="text-[13px] opacity-75">월 구독료 </span>
                      <span className="font-num text-[22px] font-bold">
                        {fmtWon(PRICING.subscription.tier1.monthly)}
                      </span>
                    </div>
                  )}
                  {result.tier === 2 && (
                    <div className="mt-3 rounded-xl bg-amber/10 p-3.5 text-[13px] leading-[1.7] text-amber">
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
                            className="rounded-full border border-navy/15 px-2.5 py-1 text-[12px] text-muted"
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
                <div className="animate-tickIn rounded-card border border-green/30 bg-[#F1FAF6] p-4 text-[15px] leading-[1.7] text-green">
                  대기 등록이 접수되었습니다. 해당 지역 서비스가 열리면 남겨주신 연락처(
                  {form.phone})로 가장 먼저 안내드립니다.
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
              <h1 className="text-[27px] font-black leading-[1.4] text-navy">
                결제권한을
                <br />
                선택해 주세요
              </h1>
              <p className="text-[13px] leading-[1.7] text-muted">
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
                        <span className="text-[16px] font-bold text-navy">{m.label}</span>
                        {m.recommended && (
                          <Badge fg="#8A5D12" bg="rgba(176,141,87,.16)">
                            권장
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1.5 pl-6 text-[13px] leading-[1.65] text-muted">
                        {m.desc}
                      </p>
                      {m.key === "limit" && on && (
                        <div className="mt-3 flex items-center gap-2 pl-6">
                          <span className="text-[13px] text-muted">한도</span>
                          {[30000, 50000, 100000].map((v) => (
                            <button
                              key={v}
                              onClick={(e) => {
                                e.stopPropagation();
                                set({ limitAmount: v });
                              }}
                              className={`btn-press rounded-lg border px-2.5 py-1.5 font-num text-[13px] font-bold ${
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
              <h1 className="text-[27px] font-black leading-[1.4] text-navy">
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
                    <span className="font-num text-[34px] font-bold">
                      {result?.tier === 2 ? "별도 산정" : fmtWon(PRICING.subscription.tier1.monthly)}
                    </span>
                    {result?.tier !== 2 && <span className="text-[13px] opacity-70">/ 월 · 1급지</span>}
                  </div>
                  <div className="mt-1.5 text-[12px] leading-[1.7] opacity-70">
                    최초 1회 가입비 {fmtWon(PRICING.joinFee.min)}
                    {!PRICING.joinFee.confirmed &&
                      ` (확정 전 · 최대 ${fmtWon(PRICING.joinFee.max)})`}{" "}
                    · 언제든 해지 가능
                  </div>
                </div>
                <ul className="space-y-2.5 p-5">
                  {BASE_BENEFITS.map((b) => (
                    <li key={b.name} className="flex items-start gap-2.5">
                      <span className="mt-[3px] inline-flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full bg-green/15 text-[11px] font-bold text-green">
                        ✓
                      </span>
                      <div>
                        <div className="text-[15px] font-bold text-ink">{b.name}</div>
                        {b.note && <div className="text-[12px] text-muted">{b.note}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
              {/* 필수 동의 2건 — 없으면 가입 불가 */}
              <Card className="p-4">
                <SectionLabel>필수 동의</SectionLabel>
                <div className="mt-2.5 space-y-2.5">
                  {[
                    [
                      "agreeTerms",
                      "서비스 이용약관 동의",
                      "임시보호자 역할 범위 · 보호자 부재 시 조치 · 긴급 대응은 접수 + 119 연계까지 (기본 상품)",
                    ],
                    [
                      "agreePrivacy",
                      "개인정보·건강정보 처리 동의",
                      "케어 프로필 구축 · 리포트 작성 목적. 건강정보는 서비스 제공 외 목적으로 쓰지 않습니다.",
                    ],
                  ].map(([key, label, desc]) => (
                    <button
                      key={key}
                      onClick={() => set({ [key]: !form[key] })}
                      className="flex w-full items-start gap-2 text-left"
                    >
                      <span
                        className={`mt-[1px] inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border text-[12px] font-bold ${
                          form[key]
                            ? "border-navy bg-navy text-white"
                            : "border-navy/25 text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                      <span>
                        <span className="text-[15px] font-bold text-navy">
                          {label} <span className="text-danger">(필수)</span>
                        </span>
                        <span className="mt-0.5 block text-[12px] leading-[1.6] text-muted">
                          {desc}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </Card>

              {/* REQ-12 — 방문기록 영상 별도 동의 (가입 약관 항목, 선택) */}
              <Card
                onClick={() => set({ videoConsent: !form.videoConsent })}
                className={`p-4 ${form.videoConsent ? "border-gold ring-1 ring-gold/50" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border text-[12px] font-bold ${
                      form.videoConsent
                        ? "border-gold bg-gold text-white"
                        : "border-navy/25 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span className="text-[15px] font-bold text-navy">
                    방문기록 영상 촬영 동의 (선택)
                  </span>
                </div>
                <p className="mt-1.5 pl-6 text-[12px] leading-[1.7] text-muted">
                  서비스 품질관리·분쟁 예방 목적. 거실·현관·주방 등 서비스 공간만 촬영하며
                  욕실·화장실·탈의공간·침실은 촬영하지 않습니다. 일반 방문 영상은 4주 후 자동
                  삭제되고, 열람은 보호자·관리자로 제한됩니다.
                </p>
              </Card>
              <div className="flex gap-2">
                <GhostButton onClick={() => setStep(2)} className="flex-1">
                  이전
                </GhostButton>
                <PrimaryButton
                  className="flex-[2]"
                  disabled={!form.agreeTerms || !form.agreePrivacy}
                  onClick={finish}
                >
                  {form.agreeTerms && form.agreePrivacy
                    ? "가입 신청 (결제 연동 대기 · 데모)"
                    : "필수 동의 후 가입할 수 있습니다"}
                </PrimaryButton>
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="animate-tickIn space-y-4 pt-6">
              <div className="mx-auto flex h-[64px] w-[64px] items-center justify-center rounded-full bg-green/12 text-[31px] text-green">
                ✓
              </div>
              <h1 className="text-center text-[27px] font-black leading-[1.4] text-navy">
                가입 신청이
                <br />
                접수되었습니다
              </h1>
              {/* 가입 요약 — 입력한 그대로 확인 (신뢰: 데이터는 가족의 것) */}
              <Card className="p-5">
                <SectionLabel>가입 정보 요약</SectionLabel>
                <div className="mt-3 space-y-2 text-[14px]">
                  {[
                    ["어르신", `${form.elderName || "김순자"}님 · ${form.district}`],
                    ["보호자", `${form.rel === "기타" ? form.relDetail || "기타" : form.rel} · ${form.phone || "연락처 미입력"}`],
                    ["서비스 지역", `${result?.tier === 2 ? "2급지 (별도 산정)" : "1급지"}`],
                    [
                      "결제권한",
                      { limit: `${(form.limitAmount ?? 50000).toLocaleString()}원 이하 어르신 직접`, both: "양쪽 모두", guardianOnly: "보호자만", elderOnly: "어르신만" }[form.paymentMode] || "한도형",
                    ],
                    ["방문기록 영상", form.videoConsent ? "동의" : "미동의 (언제든 변경 가능)"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3 border-b border-navy/[.07] pb-2 last:border-b-0">
                      <span className="text-muted">{k}</span>
                      <span className="text-right font-bold text-ink">{v}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[12px] leading-[1.7] text-muted">
                  잘못 입력하셨나요? 가입 정보는 마이 탭에서 언제든 수정할 수 있고, 상담 콜에서 함께
                  확인합니다.
                </p>
              </Card>

              <Card className="p-5">
                <SectionLabel>다음 단계</SectionLabel>
                <ol className="mt-3 space-y-4">
                  {[
                    ["전담 컨시어지 배정", "2인 1조 · 영업일 1일 이내"],
                    ["사전 상담 콜", `30분 · ${form.phone}로 연락 · 케어 프로필 구축`],
                    ["첫 안심방문", "갤럭시 워치 · 안심케어박스 전달"],
                  ].map(([t, d], i) => (
                    <li key={t} className="flex items-start gap-3">
                      <span className="mt-[1px] inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-navy font-num text-[12px] font-bold text-white">
                        {i + 1}
                      </span>
                      <div>
                        <div className="text-[16px] font-bold text-navy">{t}</div>
                        <div className="text-[13px] text-muted">{d}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </Card>
              {/* 부보호자 초대 — 가입 정책 연결 (주 보호자 → 초대 링크) */}
              <Card className="p-5">
                <SectionLabel>가족과 함께 보세요</SectionLabel>
                <p className="mt-2 text-[14px] leading-[1.7] text-ink">
                  지금 가입하신 분이 <b>주 보호자</b>입니다. 형제자매 등 부보호자는 마이 탭의{" "}
                  <b>초대 링크</b>로 참여할 수 있어요 — 리포트는 함께 보고, 결제 승인은 주 보호자만
                  합니다.
                </p>
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
