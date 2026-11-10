// 글 속의 전화번호가 줄 끝에서 쪼개지지 않게 한다 ("02-2135-" / "7751" 처럼 하이픈에서 끊기는 것을 막는다).
// 글자는 그대로 두고 번호만 줄바꿈 금지 구간으로 감싼다 — 복사 · 검색 결과는 바뀌지 않는다.
const TEL_RE = /(\d{2,4}-\d{3,4}-\d{4}|\d{4}-\d{4})/;

export default function KeepTel({ text }) {
  const parts = String(text).split(TEL_RE);
  if (parts.length === 1) return text;
  return parts.map((s, i) =>
    i % 2 ? (
      <span key={i} className="whitespace-nowrap">
        {s}
      </span>
    ) : (
      s
    )
  );
}
