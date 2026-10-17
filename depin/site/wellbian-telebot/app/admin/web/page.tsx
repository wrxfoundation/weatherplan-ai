/* 수사망 보드 화면 (9/16)

   명부(/admin/map)와 같은 데이터를 쓰되 보는 것이 다르다 — 목록은 「누가 있나」를,
   이 화면은 「누가 누구와 묶여 있나」를 본다. 한 회사에 우리 손이 둘 이상 들어가 있으면
   붉은 선이 생기고, 셋이면 굵어진다. 상한 규칙이 글자가 아니라 형태로 보이게 하는 것이 목적이다.

   ⚠ 접근하지 않기로 한 자리가 그대로 보인다. 주소를 외부에 공유하지 말 것. */

import { isAuthed } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PEOPLE, LANES, STANCES, MILESTONES, NETWORK_UPDATED } from "@/lib/network";
import Nav from "../Nav";
import Graph, { type Node } from "./Graph";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ k?: string }> }) {
  const sp = await searchParams;
  const k = sp.k ?? "";
  if (!(await isAuthed(k))) redirect(`/admin${k ? `?k=${encodeURIComponent(k)}` : ""}`);

  const nodes: Node[] = PEOPLE.map((p) => ({
    id: p.id, name: p.name, org: p.org, role: p.role,
    lane: p.lane, laneLabel: LANES.find((l) => l.key === p.lane)?.label ?? p.lane,
    stance: p.stance, stanceLabel: STANCES.find((s) => s.key === p.stance)?.label ?? p.stance,
    why: p.why, next: p.next, tie: p.tie, via: p.via, meet: p.meet,
    group: p.group, gate: p.gate,
    gateLabel: p.gate ? MILESTONES.find((m) => m.key === p.gate)?.label : undefined,
    inbound: p.inbound,
  }));

  /* 한 회사에 둘 이상 — 화면 아래 경고 줄에 그대로 쓴다 */
  const byOrg = new Map<string, string[]>();
  for (const p of PEOPLE) {
    const key = p.group ?? p.org;
    if (!key || key.startsWith("(")) continue;
    byOrg.set(key, [...(byOrg.get(key) ?? []), p.name]);
  }
  const crowded = [...byOrg.entries()].filter(([, v]) => v.length >= 2).sort((a, b) => b[1].length - a[1].length);

  const live = PEOPLE.filter((p) => p.stance === "talking" || p.stance === "open").length;

  return (
    <>
      <Nav k={k} current="web" title="수사망 보드"
        sub={<>{PEOPLE.length}명 · 대화 중·여는 중 {live} · 갱신 {NETWORK_UPDATED}</>} />
      <main className="wrap" style={{ paddingBottom: 28 }}>
        <p style={{ fontSize: 12, color: "#8a94a6", lineHeight: 1.7, margin: "10px 0 2px" }}>
          중심에서 멀수록 우리와 먼 자세다. <b style={{ color: "#ff7b7b" }}>붉은 선은 같은 회사</b> —
          한 하우스에 둘을 동시에 열지 않는다는 규칙이 여기서는 선으로 보인다.
          테두리가 <b style={{ color: "#e8c07d" }}>끊긴 원</b>은 게이트가 걸린 사람,
          <b style={{ color: "#ffd166" }}> 노란 고리</b>는 상대가 먼저 온 인바운드다.
          점을 누르면 판정이 열린다.
        </p>
        <Graph nodes={nodes} lanes={LANES.map((l) => ({ key: l.key, label: l.label, note: l.note }))} />

        <section style={{ marginTop: 18 }}>
          <h2 style={{ fontSize: 13, margin: "0 0 8px", color: "#c2ccdb" }}>
            한 회사에 둘 이상 — {crowded.length}곳
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {crowded.map(([org, names]) => (
              <span key={org} style={{
                fontSize: 11, padding: "4px 10px", borderRadius: 999,
                border: `1px solid ${names.length >= 3 ? "#ff5d5d" : "#c8503f"}`,
                color: names.length >= 3 ? "#ff9b9b" : "#e0a99e",
              }}>
                {org} {names.length} · {names.join(" · ")}
              </span>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
