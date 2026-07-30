import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { sha256Hex } from "../../lib/glossary";
import { canonicalDoc } from "./[type]";

// 문서 위변조 검증 — 리포트 푸터의 SHA-256 지문을 정본 지문과 대조.
// 지금은 정본 데이터에서 즉시 재계산(데모) · 실서비스는 발행 시점 지문을 체인에 앵커링해 대조한다.

const DOCS = [
  ["care", "월간 케어 리포트"],
  ["visit", "동행 방문 리포트"],
  ["exec", "월간 사람 · 경영 리포트"],
];

export default function VerifyPage() {
  const [truth, setTruth] = useState({});
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      const t = {};
      for (const [k] of DOCS) t[k] = await sha256Hex(canonicalDoc(k));
      setTruth(t);
    })();
  }, []);

  const check = () => {
    const v = input.trim().toLowerCase();
    if (!v) return;
    const hit = Object.entries(truth).find(([, h]) => h === v);
    setResult(
      hit
        ? { ok: true, label: DOCS.find(([k]) => k === hit[0])[1] }
        : { ok: false }
    );
  };

  return (
    <>
      <Head>
        <title>문서 검증 — K-CARE</title>
      </Head>
      <div className="min-h-screen bg-paper px-4 py-10">
        <div className="mx-auto w-full max-w-[640px]">
          <Link href="/" className="text-[13px] font-bold text-muted underline underline-offset-2">
            ← 데모 홈
          </Link>
          <h1 className="mt-3 text-[25px] font-black text-navy">리포트 위변조 검증</h1>
          <p className="mt-2 text-[14px] leading-[1.75] text-muted">
            리포트 하단의 문서 지문(SHA-256)을 붙여 넣으면 정본 지문과 대조합니다. 문서가 한
            글자라도 바뀌면 지문이 달라져 위변조를 확인할 수 있습니다.
          </p>

          <div className="card-glass mt-5 rounded-[14px] p-5">
            <label className="text-[12px] font-bold text-muted">문서 지문 (64자리 SHA-256)</label>
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setResult(null);
              }}
              rows={2}
              placeholder="예: 3f2a9c…"
              className="mt-2 w-full rounded-xl border border-navy/15 bg-white/80 px-3 py-2.5 font-num text-[13px] text-ink outline-none focus:ring-1 focus:ring-gold"
            />
            <button
              onClick={check}
              disabled={!input.trim()}
              className="btn-press btn-dark mt-3 w-full rounded-xl bg-navy py-3 text-[15px] font-bold text-white disabled:opacity-50"
            >
              대조하기
            </button>
            {result && (
              <div
                className={`mt-3 rounded-xl px-4 py-3 text-[14px] font-bold ${
                  result.ok ? "bg-green/10 text-green" : "bg-[rgba(192,57,43,.1)] text-danger"
                }`}
              >
                {result.ok
                  ? `✓ 일치 — "${result.label}" 정본과 동일합니다`
                  : "✕ 불일치 — 정본과 다릅니다. 위변조 또는 구버전 문서일 수 있습니다."}
              </div>
            )}
          </div>

          <div className="card-glass mt-4 rounded-[14px] p-5">
            <div className="text-[13px] font-bold text-navy">현재 정본 지문</div>
            <div className="mt-2 space-y-2">
              {DOCS.map(([k, label]) => (
                <div key={k} className="text-[12px]">
                  <span className="font-bold text-ink">{label}</span>
                  <div className="break-all font-num text-[11px] text-muted">{truth[k] || "계산 중…"}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
              앵커링 — 발행 시점 지문을 K-CARE Trust Chain(데모)에 기록해 사후 조작을 막습니다.
              퍼블릭 체인 · 공인 타임스탬프(TSA) 연동은 실서비스 단계 과제입니다.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
