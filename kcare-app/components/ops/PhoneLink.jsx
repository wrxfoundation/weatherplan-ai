import { isDemoPhone, telHref } from "../../lib/ops-health";

// 전화번호 — 관제는 전체 번호를 본다. 누르면 전화 앱이 열린다 (PC 는 연결된 전화 앱).
// 예시 고객 번호(010-0xxx)는 실제로 걸리지 않는다고 옆에 적는다.
export default function PhoneLink({ phone, source }) {
  const href = telHref(phone);
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      {href ? (
        <a href={href} className="font-num font-bold text-navy underline underline-offset-2">
          {phone}
        </a>
      ) : (
        <span className="font-num">{phone || "등록 없음"}</span>
      )}
      {source && <span className="text-[11px] text-muted">{source}에서 받은 번호</span>}
      {!source && isDemoPhone(phone) && <span className="text-[11px] text-muted">예시 번호 · 실제 연결 안 됨</span>}
    </span>
  );
}
