import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { Card, SectionLabel, PrimaryButton, GhostButton, PendingTag } from "../components/ui";
import { useAppState } from "../lib/state";

// 컨시어지 온보딩 — 심사·채용은 회사에서 완료된 상태. 앱에서는 ① 초대 코드 확인
// ② 기본 정보 ③ 자격·서류 ④ 동의·케어 서약 ⑤ 완료(다음 단계 안내)만 진행한다.
// 서약은 도메인 원칙 그대로 — 2인 1조 · 진단어 금지 · 취소 권한 · 비밀 유지.

const REGIONS = ["강남", "서초", "송파", "강동", "분당"];
const CERTS = ["요양보호사", "간호사 · 간호조무사", "사회복지사", "해당 없음 (교육 예정)"];
const PLEDGES = [
  ["2인 1조 원칙", "짝이 도착하지 않으면 어르신 댁에 혼자 들어가지 않습니다."],
  ["진단어 금지", "리포트에 의료 소견 · 진단명을 쓰지 않습니다 — 관찰한 사실만 기록합니다."],
  ["취소 권한", "어르신 컨디션이 무리라고 판단되면 일정을 중단할 수 있고, 불이익이 없습니다."],
  ["비밀 유지", "어르신 · 가족의 정보를 외부에 말하지 않습니다. 모든 열람은 기록됩니다."],
];

export default function ConciergeOnboarding() {
  const router = useRouter();
  const { dispatch } = useAppState();
  const steps = ["초대 확인", "기본 정보", "자격 · 서류", "동의 · 서약", "완료"];
  const [step, setStep] = useState(0);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState(null);
  const [certs, setCerts] = useState([]);
  const [crimCheck, setCrimCheck] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [gps, setGps] = useState(false);
  const [pledged, setPledged] = useState({});

  const codeOk = code.trim().length >= 6;
  const infoOk = name.trim() && phone.replace(/\D/g, "").length >= 10 && region;
  const docsOk = certs.length > 0 && crimCheck;

  // 자격 중복 선택 — "해당 없음"은 다른 자격과 배타적
  const NONE = CERTS[CERTS.length - 1];
  const toggleCert = (c) =>
    setCerts((prev) => {
      if (c === NONE) return prev.includes(NONE) ? [] : [NONE];
      const next = prev.includes(c) ? prev.filter((x) => x !== c) : [...prev.filter((x) => x !== NONE), c];
      return next;
    });
  const allPledged = PLEDGES.every(([t]) => pledged[t]) && privacy && gps;

  const finish = () => {
    dispatch({
      type: "pushEvent",
      payload: {
        kind: "가입",
        text: `컨시어지 등록 완료 — ${name.trim()} (수습 · ${region}) · 교육 배정 대기`,
        color: "#8FE3C0",
      },
    });
    setStep(4);
  };

  return (
    <>
      <Head>
        <title>컨시어지 등록 — K-CARE</title>
      </Head>
      <div className="min-h-screen bg-paper px-5 py-8">
        <div className="mx-auto w-full max-w-[430px]">
          <div className="font-num text-[13px] font-bold tracking-[.18em] text-gold">
            CONCIERGE ONBOARDING
          </div>
          {/* 진행 표시 */}
          <div className="mt-3 flex gap-1.5">
            {steps.map((label, i) => (
              <div key={label} className="flex-1">
                <div className={`h-[4px] rounded-full ${i <= step ? "bg-gold" : "bg-navy/10"}`} />
                <div className={`mt-1 text-[10px] font-bold ${i === step ? "text-navy" : "text-muted/60"}`}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* ① 초대 확인 — 심사·채용은 회사에서 끝난 상태 */}
          {step === 0 && (
            <section className="mt-6 space-y-4 animate-tickIn">
              <h1 className="text-[25px] font-black leading-[1.4] text-navy">
                함께하게 되어
                <br />
                반갑습니다
              </h1>
              <p className="text-[14px] leading-[1.75] text-muted">
                채용이 확정된 분만 등록할 수 있습니다. 합격 안내 문자로 받으신{" "}
                <b className="text-navy">초대 코드</b>를 입력해 주세요.
              </p>
              <Card className="p-[18px]">
                <SectionLabel>초대 코드</SectionLabel>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="예: KCARE-2026"
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-white px-3.5 py-3 font-num text-[17px] tracking-[.06em] outline-none focus:border-gold"
                />
                <p className="mt-2 text-[12px] leading-[1.6] text-muted">
                  코드가 없다면 채용 담당자에게 문의해 주세요 — 심사 · 채용 절차는 앱이 아니라
                  회사에서 진행됩니다.
                </p>
              </Card>
              <PrimaryButton disabled={!codeOk} onClick={() => setStep(1)}>
                코드 확인
              </PrimaryButton>
            </section>
          )}

          {/* ② 기본 정보 */}
          {step === 1 && (
            <section className="mt-6 space-y-4 animate-tickIn">
              <Card className="p-[18px]">
                <SectionLabel>이름</SectionLabel>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="실명을 입력해 주세요"
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-white px-3.5 py-3 text-[16px] outline-none focus:border-gold"
                />
                <div className="mt-4">
                  <SectionLabel>연락처</SectionLabel>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                    inputMode="tel"
                    placeholder="010-0000-0000"
                    className="mt-2 w-full rounded-xl border border-navy/15 bg-white px-3.5 py-3 font-num text-[16px] outline-none focus:border-gold"
                  />
                </div>
                <div className="mt-4">
                  <SectionLabel>희망 권역 (배차 참고)</SectionLabel>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {REGIONS.map((r) => (
                      <button
                        key={r}
                        onClick={() => setRegion(r)}
                        className={`btn-press rounded-full border px-4 py-2 text-[14px] font-bold ${
                          region === r ? "border-gold bg-gold/10 text-navy" : "border-navy/15 text-muted"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="mt-4 rounded-xl bg-navy/5 p-3 text-[12px] leading-[1.7] text-muted">
                  시작 역할은 <b className="text-navy">수습 · 부 동행</b>입니다 — 부 동행 12건 +
                  가족 만족 4.5 이상이면 일반으로 전환되고, 투석 등 고난도 배차가 열립니다.
                </p>
              </Card>
              <div className="flex gap-2">
                <GhostButton onClick={() => setStep(0)} className="flex-1">
                  이전
                </GhostButton>
                <PrimaryButton disabled={!infoOk} onClick={() => setStep(2)} className="flex-[2]">
                  다음
                </PrimaryButton>
              </div>
            </section>
          )}

          {/* ③ 자격 · 서류 */}
          {step === 2 && (
            <section className="mt-6 space-y-4 animate-tickIn">
              <Card className="p-[18px]">
                <SectionLabel>보유 자격 — 중복 선택 가능</SectionLabel>
                <div className="mt-2 space-y-2">
                  {CERTS.map((c) => {
                    const on = certs.includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() => toggleCert(c)}
                        className={`btn-press flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-[14px] font-bold ${
                          on ? "border-gold bg-gold/10 text-navy" : "border-navy/15 text-muted"
                        }`}
                      >
                        <span>{c}</span>
                        <span
                          className={`inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border text-[12px] ${
                            on ? "border-gold bg-gold text-white" : "border-navy/20 text-transparent"
                          }`}
                        >
                          ✓
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4">
                  <SectionLabel>서류 제출</SectionLabel>
                  <div className="mt-2 space-y-2">
                    {["자격증 사본", "보건증 (건강진단결과서)"].map((d) => (
                      <div
                        key={d}
                        className="flex items-center justify-between rounded-xl border border-dashed border-navy/25 px-4 py-3"
                      >
                        <span className="text-[14px] text-ink">{d}</span>
                        <PendingTag>사진 제출 — 연동 대기</PendingTag>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => setCrimCheck((v) => !v)} className="mt-4 flex w-full items-start gap-2 text-left">
                  <span
                    className={`mt-[1px] inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border text-[12px] font-bold ${
                      crimCheck ? "border-navy bg-navy text-white" : "border-navy/25 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span>
                    <span className="text-[14px] font-bold text-navy">
                      범죄경력 조회 동의 <span className="text-danger">(필수)</span>
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-[1.6] text-muted">
                      노인복지법에 따라 회사가 취업 제한 여부를 조회하는 데 동의합니다.
                    </span>
                  </span>
                </button>
              </Card>
              <div className="flex gap-2">
                <GhostButton onClick={() => setStep(1)} className="flex-1">
                  이전
                </GhostButton>
                <PrimaryButton disabled={!docsOk} onClick={() => setStep(3)} className="flex-[2]">
                  다음
                </PrimaryButton>
              </div>
            </section>
          )}

          {/* ④ 동의 · 케어 서약 */}
          {step === 3 && (
            <section className="mt-6 space-y-4 animate-tickIn">
              <Card className="p-[18px]">
                <SectionLabel>필수 동의</SectionLabel>
                <div className="mt-2 space-y-3">
                  {[
                    [privacy, setPrivacy, "개인정보 · 어르신 정보 처리 동의", "케어 수행 목적으로만 사용 · 모든 열람은 기록되어 가족에게 공개됩니다."],
                    [gps, setGps, "근무 중 위치정보 수집 동의", "GPS 체크인 · 동행 중에만 수집 — 근무 외 시간에는 수집하지 않습니다."],
                  ].map(([val, set, label, desc]) => (
                    <button key={label} onClick={() => set(!val)} className="flex w-full items-start gap-2 text-left">
                      <span
                        className={`mt-[1px] inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border text-[12px] font-bold ${
                          val ? "border-navy bg-navy text-white" : "border-navy/25 text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                      <span>
                        <span className="text-[14px] font-bold text-navy">
                          {label} <span className="text-danger">(필수)</span>
                        </span>
                        <span className="mt-0.5 block text-[12px] leading-[1.6] text-muted">{desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </Card>
              <Card className="border border-gold/30 p-[18px]">
                <SectionLabel>케어 서약 — 하나씩 읽고 약속해 주세요</SectionLabel>
                <div className="mt-2 space-y-3">
                  {PLEDGES.map(([t, d]) => (
                    <button
                      key={t}
                      onClick={() => setPledged((v) => ({ ...v, [t]: !v[t] }))}
                      className="flex w-full items-start gap-2 text-left"
                    >
                      <span
                        className={`mt-[1px] inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border text-[12px] font-bold ${
                          pledged[t] ? "border-green bg-green text-white" : "border-navy/25 text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                      <span>
                        <span className="text-[14px] font-bold text-navy">{t}</span>
                        <span className="mt-0.5 block text-[12px] leading-[1.6] text-muted">{d}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </Card>
              <div className="flex gap-2">
                <GhostButton onClick={() => setStep(2)} className="flex-1">
                  이전
                </GhostButton>
                <PrimaryButton disabled={!allPledged} onClick={finish} className="flex-[2]">
                  {allPledged ? "서약하고 등록 완료" : "동의 · 서약을 완료해 주세요"}
                </PrimaryButton>
              </div>
            </section>
          )}

          {/* ⑤ 완료 */}
          {step === 4 && (
            <section className="mt-6 space-y-4 animate-tickIn pt-4">
              <div className="mx-auto flex h-[64px] w-[64px] items-center justify-center rounded-full bg-green/12 text-[31px] text-green">
                ✓
              </div>
              <h1 className="text-center text-[25px] font-black leading-[1.4] text-navy">
                {name.trim() || "컨시어지"}님,
                <br />
                등록이 완료되었습니다
              </h1>
              <Card className="p-5">
                <SectionLabel>다음 단계</SectionLabel>
                <ol className="mt-3 space-y-4">
                  {[
                    ["기본 교육 배정", "치매 케어 · 응급처치 · 앱 사용 (2일 · 유급)"],
                    ["케어박스 · 워치 수령", "첫 출근일 관제센터에서 전달"],
                    ["수습 시작 — 부 동행 12건", `시니어 코치와 페어 · ${region || "강남"} 권역 우선 배차`],
                  ].map(([t, d], i) => (
                    <li key={t} className="flex items-start gap-3">
                      <span className="mt-[1px] inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-navy font-num text-[12px] font-bold text-white">
                        {i + 1}
                      </span>
                      <div>
                        <div className="text-[15px] font-bold text-navy">{t}</div>
                        <div className="text-[12px] leading-[1.6] text-muted">{d}</div>
                      </div>
                    </li>
                  ))}
                </ol>
                <p className="mt-4 border-t border-navy/[.08] pt-3 text-[12px] leading-[1.7] text-muted">
                  평가는 케어 품질만 봅니다 — 판매 실적은 없습니다. 현장의 소리 · 심리상담 · 복지는
                  앱 정산 탭에서 언제든 확인하세요.
                </p>
              </Card>
              <PrimaryButton onClick={() => router.push("/concierge")}>컨시어지 앱 시작하기</PrimaryButton>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
