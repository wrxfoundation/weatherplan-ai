/* 인맥 지도 (9/11 서우 — "인맥지도 vercel 배포 아직 안 했는데 추가해줘")

   셀럽 사다리는 X 계정이 우리 답글을 어디까지 받아줬는지를 센다. 이 화면은 다른 질문에 답한다 —
   지금 열려 있는 관계가 어디에 몇 개이고, 각각 다음 수가 무엇인가.

   배치를 레인(가로 성격) × 자세(세로 온도)로 잡은 이유가 있다. 인물 목록은 이름순으로 두면
   "누구와 이야기하고 있는가" 가 보이지 않는다. 레인으로 묶으면 비어 있는 칸이 드러나고
   (지금은 결제·데이터 수요가 얇다), 자세로 정렬하면 손이 갈 곳이 맨 위로 온다.

   행사 필터를 따로 둔 것은 10월 때문이다. KBW(9/29~10/1) · XRP SEOUL(10/3) · NYC 해커톤(10/24~25) ·
   Swell(10/27~29) 이 3주에 몰려 있어서, "그 자리에 누가 있나" 가 곧 준비 목록이 된다.

   ⚠ 이 화면에는 "누구에게 접근하지 않기로 했는가" 가 적혀 있다. 내부 판단이지 대외 입장이 아니다.
   주소를 외부에 공유하지 말 것. */

import { isAuthed } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  PEOPLE, LANES, STANCES, EXCLUDED, NETWORK_UPDATED,
  type Lane, type Stance,
} from "@/lib/network";
import Nav from "../Nav";

export const dynamic = "force-dynamic";

const qs = (o: Record<string, string>) => {
  const p = new URLSearchParams(o);
  for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
  return `${p}`;
};

/* 10월 3주에 몰린 자리들 — meet 문자열에 이 말이 들어 있으면 그 행사로 친다 */
const EVENTS: { key: string; label: string; match: string }[] = [
  { key: "kbw", label: "KBW 9/29~10/1", match: "KBW" },
  { key: "seoul", label: "XRP SEOUL 10/3", match: "10/3" },
  { key: "hack", label: "NYC 해커톤 10/24~25", match: "해커톤" },
  { key: "swell", label: "Swell 10/27~29", match: "Swell" },
];

const ORDER: Record<Stance, number> = { talking: 0, open: 1, linked: 2, hold: 3, off: 4 };

export default async function MapPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  if (!(await isAuthed(sp.k))) redirect("/");
  const k = (await isAuthed()) ? "" : (sp.k ?? "");

  const lane = LANES.some((l) => l.key === sp.lane) ? (sp.lane as Lane) : "";
  const stance = STANCES.some((s) => s.key === sp.stance) ? (sp.stance as Stance) : "";
  const ev = EVENTS.find((e) => e.key === sp.ev)?.key ?? "";
  const link = (o: Record<string, string>) => `/admin/map?${qs({ k, lane, stance, ev, ...o })}`;

  const evMatch = (meet: string | undefined, key: string) => {
    const e = EVENTS.find((x) => x.key === key);
    return Boolean(e && meet && meet.includes(e.match));
  };

  const list = PEOPLE
    .filter((p) => !lane || p.lane === lane)
    .filter((p) => !stance || p.stance === stance)
    .filter((p) => !ev || evMatch(p.meet, ev))
    .sort((a, b) => ORDER[a.stance] - ORDER[b.stance] || a.name.localeCompare(b.name, "ko"));

  const n = (s: Stance) => PEOPLE.filter((p) => p.stance === s).length;
  const laneCount = (l: Lane) => PEOPLE.filter((p) => p.lane === l).length;
  const evCount = (key: string) => PEOPLE.filter((p) => evMatch(p.meet, key)).length;
  /* 10월 자리에 있고 아직 열지 않은 사람 — 준비가 필요한 수 */
  const october = PEOPLE.filter(
    (p) => EVENTS.some((e) => evMatch(p.meet, e.key)) && (p.stance === "open" || p.stance === "hold"),
  ).length;

  const shownLanes = LANES.filter((l) => (!lane || l.key === lane) && list.some((p) => p.lane === l.key));
  const heading = [
    LANES.find((l) => l.key === lane)?.label ?? "전체",
    STANCES.find((s) => s.key === stance)?.label ?? "",
    EVENTS.find((e) => e.key === ev)?.label ?? "",
  ].filter(Boolean).join(" · ");

  return (
    <>
      <Nav k={k} current="map" title="인맥 지도" sub={<>{PEOPLE.length}명 · 로스터 {NETWORK_UPDATED}</>}>
        <span className="flab">레인</span>
        <a className={`chip${lane ? "" : " on"}`} href={link({ lane: "" })}>전체 <span className="n">{PEOPLE.length}</span></a>
        {LANES.map((l) => (
          <a key={l.key} className={`chip${lane === l.key ? " on" : ""}`} href={link({ lane: l.key })}>
            {l.label} <span className="n">{laneCount(l.key)}</span>
          </a>
        ))}
      </Nav>

      <main className="wrap" style={{ paddingBottom: 72 }}>
        <section className="now">
          <div className="now-card lead">
            <div className="now-k">대화 중</div>
            <div className="now-v mono">{n("talking")}</div>
            <div className="now-note">상대가 시간을 냈거나 왕복이 진행 중인 관계</div>
          </div>
          <div className="now-card">
            <div className="now-k">여는 중</div>
            <div className="now-v mono">{n("open")}</div>
            <div className="now-note">초안이 준비됐거나 이미 나간 것</div>
          </div>
          <div className="now-card">
            <div className="now-k">10월 자리에 있는 미개시</div>
            <div className="now-v mono">{october}</div>
            <div className="now-note">KBW·XRP SEOUL·해커톤·Swell 에 있는데 아직 안 연 사람</div>
          </div>
          <div className="now-card">
            <div className="now-k">열지 않음</div>
            <div className="now-v mono">{n("off")}</div>
            <div className="now-note">규칙상 우리가 먼저 열지 않는 자리</div>
          </div>
        </section>

        <div className="map-filters">
          <span className="flab">자세</span>
          <a className={`chip${stance ? "" : " on"}`} href={link({ stance: "" })}>전체</a>
          {STANCES.map((s) => (
            <a key={s.key} className={`chip sv-${s.key}${stance === s.key ? " on" : ""}`} href={link({ stance: s.key })}>
              {s.label} <span className="n">{n(s.key)}</span>
            </a>
          ))}
          <span className="flab" style={{ marginLeft: 10 }}>자리</span>
          <a className={`chip${ev ? "" : " on"}`} href={link({ ev: "" })}>전체</a>
          {EVENTS.map((e) => (
            <a key={e.key} className={`chip${ev === e.key ? " on" : ""}`} href={link({ ev: e.key })}>
              {e.label} <span className="n">{evCount(e.key)}</span>
            </a>
          ))}
        </div>

        <div className="notice">
          <b>{heading}</b> — {list.length}명. 판정 근거와 문안은 <code>depin/intel/business-directions.md</code>,
          X 축은 <code>celeb-ladder.md</code> 가 정본이고 이 화면은 그 지도다. 갱신은 <code>lib/network.ts</code> 를
          고쳐 재배포한다. <b>이 주소를 외부에 공유하지 말 것</b> — 접근하지 않기로 한 자리가 적혀 있다.
        </div>

        {shownLanes.map((l) => {
          const rows = list.filter((p) => p.lane === l.key);
          return (
            <section key={l.key} style={{ marginTop: 18 }}>
              <h2 className="map-lane-h">{l.label} <span className="map-lane-n mono">{rows.length}</span></h2>
              <p className="map-lane-note">{l.note}</p>
              <div className="map-grid">
                {rows.map((p) => (
                  <article key={p.id} className={`map-card sv-${p.stance}`}>
                    <div className="map-top">
                      <span className="map-name">
                        {p.handle
                          ? <a href={`https://x.com/${p.handle}`} target="_blank" rel="noopener noreferrer">{p.name}</a>
                          : p.name}
                      </span>
                      <span className={`tag sv-${p.stance}`}>{STANCES.find((s) => s.key === p.stance)?.label}</span>
                    </div>
                    <div className="map-org">{p.org}{p.role && p.role !== "—" ? ` · ${p.role}` : ""}</div>
                    <p className="map-why">{p.why}</p>
                    <div className="map-k">다음 수</div>
                    <p className="map-next">{p.next}</p>
                    {(p.via || p.meet) && (
                      <div className="map-badges">
                        {p.via && <span className="map-badge">경유 {p.via}</span>}
                        {p.meet && <span className="map-badge meet">{p.meet}</span>}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          );
        })}

        {!list.length && <p className="rep-empty" style={{ marginTop: 20 }}>이 조건에 해당하는 사람이 없습니다.</p>}

        <section style={{ marginTop: 28 }}>
          <h2 className="map-lane-h">지도에 올리지 않은 것</h2>
          <p className="map-lane-note">
            빠진 것에도 이유가 있다. 목록에 없다고 "아직 못 봤다" 가 아니라 "보고 뺐다" 는 뜻이다.
          </p>
          <div className="notice" style={{ marginTop: 8 }}>
            {EXCLUDED.map((e, i) => (
              <p key={i} style={{ margin: i ? "6px 0 0" : 0 }}><b>{e.k}</b> — {e.v}</p>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
