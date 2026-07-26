/* ============================================================
 * Pick AI · 경쟁사 나란히 비교
 *
 * 이미 만들어진 진단 결과(/api/scorecard 응답)들을 받아 비교표를 만든다.
 * 네트워크를 타지 않는 순수 함수라 단위 테스트가 가능하다.
 *
 * 핵심 산출물은 "격차(gap)" — 경쟁사는 통과했는데 우리는 못한 항목이다.
 * 이게 실제로 손대야 할 우선순위이고, 나머지는 참고용이다.
 * ============================================================ */

const STATUS_RANK = { pass: 3, warn: 2, fail: 1, na: 0, manual: 0 };
const SEV_RANK = { critical: 0, high: 1, medium: 2, low: 3 };

/** 점수 비교용 — 결과 하나를 가벼운 요약으로 */
export function summarize(result) {
  const r = result.report;
  return {
    inputHost: result.target.inputHost || result.target.host,
    host: result.target.host,
    status: result.target.status,
    reachable: result.target.status >= 200 && result.target.status < 300,
    framework: result.target.framework || null,
    overall: r.overall,
    grade: r.grade,
    areas: {
      seo: r.areas.seo.score,
      aeo: r.areas.aeo.score,
      geo: r.areas.geo.score,
      reach: r.areas.reach.score,
    },
  };
}

/**
 * @param {object} mine   내 사이트 진단 결과
 * @param {object[]} rivals 경쟁사 진단 결과 배열
 * @returns {{me, rivals, areaRows, gaps, wins, ranking}}
 */
export function buildComparison(mine, rivals) {
  const list = (rivals || []).filter(Boolean);
  const me = summarize(mine);
  const rivalSums = list.map(summarize);

  /* 영역별 비교 행 */
  const AREAS = [
    { key: "seo", label: "SEO 기술 기반" },
    { key: "aeo", label: "AEO 답변 최적화" },
    { key: "geo", label: "GEO 생성형 인용" },
    { key: "reach", label: "확산·레퍼런스" },
  ];
  const areaRows = AREAS.map((a) => {
    const mineScore = me.areas[a.key];
    const rivalScores = rivalSums.map((r) => r.areas[a.key]);
    const best = Math.max(mineScore, ...rivalScores);
    return {
      key: a.key,
      label: a.label,
      mine: mineScore,
      rivals: rivalScores,
      /* 최고점 대비 격차 — 음수면 우리가 뒤진다 */
      delta: mineScore - Math.max(...(rivalScores.length ? rivalScores : [mineScore])),
      leader: mineScore === best ? "me" : "rival",
    };
  });

  /* 체크 단위 격차 — 경쟁사가 우리보다 나은 항목 */
  const myChecks = new Map(mine.report.checks.map((c) => [c.id, c]));
  const gaps = [];
  const wins = [];

  for (const [id, mc] of myChecks) {
    if (mc.status === "na" || mc.status === "manual") continue;
    const mineRank = STATUS_RANK[mc.status] ?? 0;

    const rivalStates = list.map((rv, i) => {
      const rc = rv.report.checks.find((c) => c.id === id);
      return {
        host: rivalSums[i].inputHost,
        status: rc ? rc.status : "na",
        rank: rc ? (STATUS_RANK[rc.status] ?? 0) : 0,
      };
    });

    const better = rivalStates.filter((s) => s.rank > mineRank);
    const worse = rivalStates.filter((s) => s.rank > 0 && s.rank < mineRank);

    if (better.length > 0) {
      gaps.push({
        id,
        label: mc.label,
        area: mc.area,
        severity: mc.severity,
        weight: mc.weight,
        mine: mc.status,
        summary: mc.summary,
        fix: mc.fix || null,
        help: mc.help || null,
        rivals: rivalStates,
        /* 몇 개 경쟁사가 우리를 앞서는지 — 정렬 가중치 */
        beatenBy: better.length,
      });
    } else if (worse.length > 0 && mc.status === "pass") {
      wins.push({
        id, label: mc.label, area: mc.area, severity: mc.severity,
        rivals: rivalStates,
        aheadOf: worse.length,
      });
    }
  }

  /* 심각도 → 앞서는 경쟁사 수 → 가중치 순 */
  gaps.sort((a, b) =>
    (SEV_RANK[a.severity] ?? 9) - (SEV_RANK[b.severity] ?? 9) ||
    b.beatenBy - a.beatenBy ||
    (b.weight || 0) - (a.weight || 0)
  );
  wins.sort((a, b) => (SEV_RANK[a.severity] ?? 9) - (SEV_RANK[b.severity] ?? 9) || b.aheadOf - a.aheadOf);

  /* 총점 순위 — 동점이면 내 사이트를 앞에 둔다 */
  const ranking = [{ ...me, isMe: true }, ...rivalSums.map((r) => ({ ...r, isMe: false }))]
    .sort((a, b) => b.overall - a.overall || (a.isMe ? -1 : 1));
  const myRank = ranking.findIndex((r) => r.isMe) + 1;

  return { me, rivals: rivalSums, areaRows, gaps, wins, ranking, myRank, total: ranking.length };
}

/** AI 명령서에 붙일 경쟁 격차 섹션 */
export function comparisonToMarkdown(cmp) {
  if (!cmp) return "";
  const lines = [];
  lines.push("## 경쟁사 비교");
  lines.push("");
  lines.push(`총점 순위: ${cmp.myRank}위 / ${cmp.total}개 사이트`);
  lines.push("");
  lines.push("| 사이트 | 총점 | 등급 | SEO | AEO | GEO | 확산 |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const r of cmp.ranking) {
    lines.push(
      `| ${r.inputHost}${r.isMe ? " (우리)" : ""} | ${r.overall} | ${r.grade} | ` +
      `${r.areas.seo} | ${r.areas.aeo} | ${r.areas.geo} | ${r.areas.reach} |`
    );
  }
  lines.push("");

  if (cmp.gaps.length > 0) {
    lines.push("### 경쟁사는 갖췄는데 우리가 빠뜨린 항목");
    lines.push("");
    lines.push("아래 항목부터 처리하면 경쟁사와의 격차가 가장 빨리 좁혀집니다.");
    lines.push("");
    for (const g of cmp.gaps.slice(0, 12)) {
      const ahead = g.rivals.filter((r) => r.rank > (STATUS_RANK[g.mine] ?? 0)).map((r) => r.host).join(", ");
      lines.push(`- **${g.label}** (${g.severity}) — 우리: ${g.mine} / 앞선 곳: ${ahead}`);
      if (g.summary) lines.push(`  - 현재 상태: ${g.summary}`);
      if (g.fix?.how) lines.push(`  - 조치: ${g.fix.how}`);
    }
    lines.push("");
  } else {
    lines.push("경쟁사가 갖추고 우리가 빠뜨린 항목은 없습니다.");
    lines.push("");
  }

  if (cmp.wins.length > 0) {
    lines.push("### 우리가 앞선 항목 (유지할 것)");
    lines.push("");
    for (const w of cmp.wins.slice(0, 8)) lines.push(`- ${w.label}`);
    lines.push("");
  }
  return lines.join("\n");
}
