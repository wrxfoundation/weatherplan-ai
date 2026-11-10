// 해지와 환불 표 — 서비스 소개 요금 구역과 공개 문서(/refund · /terms)가 같이 쓴다. 줄은 lib/plans.js 한 곳.
// 700px 이하에서는 표를 풀어 세로로 쌓는다 — 감싸는 쪽에 .lp-tb 가 있어야 한다 (styles/globals.css).
import { EXIT_BOTH, EXIT_HEAD, EXIT_ROWS } from "../lib/plans";

export default function ExitTable({ caption = "요금제별 해지와 환불 조건" }) {
  return (
    <table>
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          {EXIT_HEAD.map((h) => (
            <th key={h} scope="col">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {EXIT_ROWS.map((r) => (
          <tr key={r.k}>
            <th scope="row">{r.k}</th>
            {r.cells.map((c, i) => (
              <td key={i} colSpan={r.cells.length === 1 ? 2 : undefined} data-l={r.cells.length === 1 ? EXIT_BOTH : EXIT_HEAD[i + 1]}>
                {/* 두 칸을 합친 줄은 넓은 화면에서도 '두 요금제 공통'을 적는다 — 왼쪽 칸(안심 기본)만의 조건으로 읽히지 않게 */}
                {r.cells.length === 1 && <span className="lp-tb-both">{EXIT_BOTH}</span>}
                <b>{c.b}</b>
                {c.lines.map((ln) => (
                  <span key={ln} className="block">
                    {ln}
                  </span>
                ))}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
