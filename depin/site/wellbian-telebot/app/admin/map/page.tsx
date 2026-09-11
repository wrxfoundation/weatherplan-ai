/* 인맥 수첩 (9/11 서우 — "좀 복잡한데 디렉토리 구조 그리고 최고의 인맥관리 수첩처럼, 회사별로도")

   1차는 레인별 카드 그리드였다. 스무 명일 땐 읽혔지만 일흔이 넘으니 카드가 화면을 덮어
   "지금 손이 가야 할 곳" 이 보이지 않았다. 카드는 하나를 보여 주는 데 좋고 목록은 훑는 데 좋다.
   이 화면에서 하는 일은 훑기다 — 그래서 명부(행)로 바꾸고, 자세한 것은 눌러서 편다.

   보기는 둘이다.
     사람 — 레인별 명부. 평소에 쓰는 화면.
     회사 — 한 회사에 우리가 몇 명 걸려 있는지. 열넷이 둘 이상이라 이 보기가 필요해졌다.
            회사마다 **문**(가장 뜨거운 자세의 한 사람)을 표시한다. "한 하우스에 둘을 동시에
            열지 않는다" 는 원칙이 목록에서 눈에 보이게 하려는 것이다.

   맨 위 「먼저 열 순서」는 대화 중·여는 중만 모은 것이다. 이 화면을 열었을 때 스크롤 없이
   할 일이 보여야 수첩이지, 명단은 수첩이 아니다.

   ⚠ 접근하지 않기로 한 자리가 적혀 있다. 주소를 외부에 공유하지 말 것. */

import { isAuthed } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  PEOPLE, LANES, STANCES, EXCLUDED, NETWORK_UPDATED, STAGES, EVENT_STANCES, MILESTONES,
  type Lane, type Stance, type Person,
} from "@/lib/network";
import Nav from "../Nav";

export const dynamic = "force-dynamic";

const qs = (o: Record<string, string>) => {
  const p = new URLSearchParams(o);
  for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
  return `${p}`;
};

/* 필터 칩에는 우리 사람이 실제로 있는 자리만 올린다 — 빈 칩은 누를 이유가 없다 */
const EVENTS = STAGES.filter((e) => e.match).map((e) => ({ key: e.key, label: e.name.replace(/ 20\d\d$/, ""), match: e.match as string }));

/* 뜨거운 순. 회사의 "문" 과 명부 정렬이 같은 기준을 쓴다 */
const ORDER: Record<Stance, number> = { talking: 0, open: 1, linked: 2, hold: 3, off: 4 };
const orgOf = (p: Person) => p.group ?? p.org;
const laneOf = (key: Lane) => LANES.find((l) => l.key === key);
const stanceOf = (key: Stance) => STANCES.find((s) => s.key === key);
/* 데이터는 마크다운 습관대로 **강조**를 쓴다. 화면에서는 그대로 보이면 안 되니 여기서 푼다 */
const rich = (t: string) =>
  t.split(/(\*\*[^*]+\*\*)/g).map((seg, i) =>
    seg.startsWith("**") && seg.endsWith("**")
      ? <b key={i}>{seg.slice(2, -2)}</b>
      : <span key={i}>{seg}</span>);

const hay = (p: Person) =>
  `${p.name} ${p.org} ${p.group ?? ""} ${p.role} ${p.why} ${p.next} ${p.via ?? ""} ${p.meet ?? ""} ${p.tie ?? ""}`.toLowerCase();

export default async function MapPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  if (!(await isAuthed(sp.k))) redirect("/");
  const k = (await isAuthed()) ? "" : (sp.k ?? "");

  const view = sp.view === "org" ? "org" : sp.view === "event" ? "event" : sp.view === "step" ? "step" : "people";
  const lane = LANES.some((l) => l.key === sp.lane) ? (sp.lane as Lane) : "";
  const stance = STANCES.some((s) => s.key === sp.stance) ? (sp.stance as Stance) : "";
  const ev = EVENTS.find((e) => e.key === sp.ev)?.key ?? "";
  const q = (sp.q ?? "").trim();
  const link = (o: Record<string, string>) => `/admin/map?${qs({ k, view, lane, stance, ev, q, ...o })}`;

  const evMatch = (meet: string | undefined, key: string) => {
    const e = EVENTS.find((x) => x.key === key);
    return Boolean(e && meet && meet.includes(e.match));
  };

  const ql = q.toLowerCase();
  const list = PEOPLE
    .filter((p) => !lane || p.lane === lane)
    .filter((p) => !stance || p.stance === stance)
    .filter((p) => !ev || evMatch(p.meet, ev))
    .filter((p) => !ql || hay(p).includes(ql))
    .sort((a, b) =>
      ORDER[a.stance] - ORDER[b.stance] ||
      orgOf(a).localeCompare(orgOf(b), "ko") ||
      a.name.localeCompare(b.name, "ko"));

  const n = (s: Stance) => PEOPLE.filter((p) => p.stance === s).length;
  const evCount = (key: string) => PEOPLE.filter((p) => evMatch(p.meet, key)).length;

  /* 먼저 열 순서 — 이 화면을 열었을 때 스크롤 없이 보여야 할 것 */
  const todo = PEOPLE
    .filter((p) => p.stance === "talking" || p.stance === "open")
    .sort((a, b) => ORDER[a.stance] - ORDER[b.stance] || a.name.localeCompare(b.name, "ko"));

  /* 게이트가 풀린 사람 — 진행이 서면서 "이제 열 때" 가 된 자리.
     서우가 MILESTONES 의 done 을 켜는 순간 여기로 올라온다. 이 구조가 전략의 실행부다. */
  const doneKeys = new Set(MILESTONES.filter((m) => m.done).map((m) => m.key));
  const unlocked = PEOPLE
    .filter((p) => p.gate && doneKeys.has(p.gate) && p.stance !== "talking" && p.stance !== "open")
    .sort((a, b) => ORDER[a.stance] - ORDER[b.stance] || a.name.localeCompare(b.name, "ko"));
  const inbound = PEOPLE.filter((p) => p.inbound).length;
  const nextMs = MILESTONES.find((m) => !m.done);

  /* 회사 보기 — 걸린 사람이 있는 조직만, 뜨거운 순 */
  const orgMap = new Map<string, Person[]>();
  for (const p of list) {
    const key = orgOf(p);
    orgMap.set(key, [...(orgMap.get(key) ?? []), p]);
  }
  const orgs = [...orgMap.entries()]
    .map(([name, ps]) => ({
      name,
      ps: [...ps].sort((a, b) => ORDER[a.stance] - ORDER[b.stance] || a.name.localeCompare(b.name, "ko")),
    }))
    .sort((a, b) =>
      ORDER[a.ps[0].stance] - ORDER[b.ps[0].stance] || b.ps.length - a.ps.length ||
      a.name.localeCompare(b.name, "ko"));
  /* 둘 이상 걸린 곳만 카드로 편다. 한 명짜리 마흔다섯을 같은 크기로 늘어놓으면 화면을 덮고,
     정작 "누구부터 여는가" 를 따져야 하는 열넷이 그 안에 묻힌다. */
  const multiOrgs = orgs.filter((o) => o.ps.length > 1);
  const soloOrgs = orgs.filter((o) => o.ps.length === 1);

  const shownLanes = LANES.filter((l) => list.some((p) => p.lane === l.key));

  const Row = ({ p, showOrg = true }: { p: Person; showOrg?: boolean }) => (
    <details className={`dir-row sv-${p.stance}`}>
      <summary>
        <span className="dir-name">
          {p.handle
            ? <a href={`https://x.com/${p.handle}`} target="_blank" rel="noopener noreferrer">{p.name}</a>
            : p.name}
        </span>
        {showOrg && <span className="dir-org">{p.org}</span>}
        <span className="dir-role">{p.role && p.role !== "—" ? p.role : ""}</span>
        <span className="dir-tags">
          {p.tie && <span className="tag tie">{p.tie}</span>}
          {p.meet && <span className="tag meet">{p.meet.split(" ")[0]}</span>}
          <span className={`tag sv-${p.stance}`}>{stanceOf(p.stance)?.label}</span>
        </span>
      </summary>
      <div className="dir-body">
        <div className="dir-k">접점</div>
        <p>{rich(p.why)}</p>
        <div className="dir-k">다음 수</div>
        <p>{rich(p.next)}</p>
        {(p.via || p.meet) && (
          <p className="dir-meta">
            {p.via && <>경유 <b>{p.via}</b>{p.meet ? " · " : ""}</>}
            {p.meet && <>자리 <b>{p.meet}</b></>}
          </p>
        )}
      </div>
    </details>
  );

  return (
    <>
      <Nav k={k} current="map" title="인맥 수첩" sub={<>{PEOPLE.length}명 · {orgs.length}곳 · 자리 {STAGES.length} · 로스터 {NETWORK_UPDATED}</>}>
        <a className={`chip${view === "people" ? " on" : ""}`} href={link({ view: "people" })}>사람</a>
        <a className={`chip${view === "org" ? " on" : ""}`} href={link({ view: "org" })}>회사</a>
        <a className={`chip${view === "step" ? " on" : ""}`} href={link({ view: "step" })}>단계</a>
        <a className={`chip${view === "event" ? " on" : ""}`} href={link({ view: "event" })}>자리</a>
        <form className="dir-search" method="get" action="/admin/map">
          {k && <input type="hidden" name="k" value={k} />}
          <input type="hidden" name="view" value={view} />
          <input name="q" defaultValue={q} placeholder="이름 · 회사 · 접점 검색" aria-label="검색" />
          {q && <a className="dir-clear" href={link({ q: "" })} title="검색 지우기">✕</a>}
        </form>
      </Nav>

      <main className="wrap" style={{ paddingBottom: 72 }}>
        {/* 할 일 먼저. 명단은 그 아래 */}
        <section className="dir-todo">
          <div className="dir-todo-h">
            <b>먼저 열 순서</b>
            <span>
              대화 중 {n("talking")} · 여는 중 {n("open")} · 연결됨 {n("linked")} · 보류 {n("hold")} · 열지 않음 {n("off")}
              {inbound > 0 && <> · <b className="door-k">인바운드 {inbound}</b></>}
            </span>
          </div>
          <ol>
            {todo.map((p) => (
              <li key={p.id}>
                <span className={`dot sv-${p.stance}`} />
                <b>{p.name}</b>
                <span className="dir-todo-org">{p.org}</span>
                <span className="dir-todo-next">{rich(p.next)}</span>
              </li>
            ))}
          </ol>
          {unlocked.length > 0 && (
            <div className="dir-unlock">
              <b>이제 열 때</b>
              <span>진행이 서면서 조건이 풀린 자리</span>
              <ol>
                {unlocked.map((p) => (
                  <li key={p.id}>
                    <b>{p.name}</b><span className="dir-todo-org">{p.org}</span>
                    <span className="dir-todo-next">{rich(p.next)}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {nextMs && (
            <p className="dir-nextms">
              다음 진행 <b>{nextMs.label}</b> <span className="mono">{nextMs.when}</span> — 이게 서면{" "}
              <a href={link({ view: "step" })}>{PEOPLE.filter((p) => p.gate === nextMs.key).length}곳이 열린다 →</a>
            </p>
          )}
        </section>

        <div className="map-filters">
          <a className={`chip${stance || ev || lane || q ? "" : " on"}`} href={link({ stance: "", ev: "", lane: "", q: "" })}>전체 <span className="n">{PEOPLE.length}</span></a>
          {STANCES.map((s) => (
            <a key={s.key} className={`chip sv-${s.key}${stance === s.key ? " on" : ""}`} href={link({ stance: stance === s.key ? "" : s.key })}>
              {s.label} <span className="n">{n(s.key)}</span>
            </a>
          ))}
          <span className="dir-sep" />
          {EVENTS.map((e) => (
            <a key={e.key} className={`chip${ev === e.key ? " on" : ""}`} href={link({ ev: ev === e.key ? "" : e.key })}>
              {e.label} <span className="n">{evCount(e.key)}</span>
            </a>
          ))}
          {lane && <a className="chip on" href={link({ lane: "" })}>{laneOf(lane)?.label} ✕</a>}
        </div>

        {!list.length && view !== "event" && <p className="rep-empty" style={{ marginTop: 20 }}>조건에 맞는 사람이 없습니다.</p>}

        {view === "people" && shownLanes.map((l) => {
          const rows = list.filter((p) => p.lane === l.key);
          return (
            <section key={l.key} className="dir-sec">
              <h2 className="dir-sec-h">
                <a href={link({ lane: lane === l.key ? "" : l.key })}>{l.label}</a>
                <span className="dir-sec-n mono">{rows.length}</span>
                <span className="dir-sec-note">{l.note}</span>
              </h2>
              <div className="dir-list">{rows.map((p) => <Row key={p.id} p={p} />)}</div>
            </section>
          );
        })}

        {view === "org" && (
          <>
            <h2 className="dir-sec-h" style={{ marginTop: 16 }}>
              둘 이상 걸린 곳 <span className="dir-sec-n mono">{multiOrgs.length}</span>
              <span className="dir-sec-note">
                <b className="door-k">문</b> 으로 표시한 사람이 먼저 여는 자리다 — 한 하우스에 둘을 동시에 열지 않는다.
              </span>
            </h2>
            <div className="dir-orgs">
              {multiOrgs.map((o) => (
                <section key={o.name} className={`dir-org-card sv-${o.ps[0].stance}`}>
                  <header>
                    <b>{o.name}</b>
                    <span className="dir-org-lane">{laneOf(o.ps[0].lane)?.label}</span>
                    <span className="dir-org-n mono">{o.ps.length}명</span>
                  </header>
                  <div className="dir-list">
                    {o.ps.map((p, i) => (
                      <div key={p.id} className="dir-org-row">
                        {i === 0 && o.ps.length > 1 && <span className="door" title="먼저 여는 자리">문</span>}
                        <Row p={p} showOrg={false} />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <h2 className="dir-sec-h" style={{ marginTop: 22 }}>
              한 명씩 걸린 곳 <span className="dir-sec-n mono">{soloOrgs.length}</span>
              <span className="dir-sec-note">대부분 보류·열지 않음이다. 한 줄로 둔다.</span>
            </h2>
            <div className="dir-list">
              {soloOrgs.map((o) => (
                <div key={o.name} className="dir-solo">
                  <span className="dir-solo-org">{o.name}</span>
                  <Row p={o.ps[0]} showOrg={false} />
                </div>
              ))}
            </div>
          </>
        )}

        {view === "step" && (
          <>
            <p className="dir-hint">
              모체는 링크드인 컨택이고 행사는 부수다. 지금 안 되는 컨택을 버리지 않고
              <b> 어떤 진행이 서면 열리는지</b>로 묶어 둔다 — 그러는 동안 우리 급이 올라가면 같은 사람에게
              다른 대화가 열린다. 진행이 끝나면 <code>lib/network.ts</code> 의 <code>done</code> 한 줄을 켠다.
            </p>
            <div className="dir-steps">
              {MILESTONES.map((m) => {
                const ppl = PEOPLE.filter((p) => p.gate === m.key);
                return (
                  <section key={m.key} className={`dir-step${m.done ? " done" : ""}`}>
                    <header>
                      <span className="dir-step-mark">{m.done ? "✓" : "○"}</span>
                      <b>{m.label}</b>
                      <span className="dir-step-when mono">{m.when}</span>
                      <span className="dir-step-n mono">{ppl.length}곳</span>
                    </header>
                    <p className="dir-step-proof">{rich(m.proof)}</p>
                    {ppl.length > 0 && (
                      <div className="dir-list">{ppl
                        .sort((a, b) => ORDER[a.stance] - ORDER[b.stance] || a.name.localeCompare(b.name, "ko"))
                        .map((p) => <Row key={p.id} p={p} />)}</div>
                    )}
                  </section>
                );
              })}
            </div>
            <p className="dir-sec-note" style={{ marginTop: 12 }}>
              게이트가 없는 {PEOPLE.filter((p) => !p.gate).length}곳은 지금 열 수 있거나, 규칙상 열지 않기로 한
              자리다 — <a href={link({ view: "people" })}>사람 보기</a>에서 본다.
            </p>
          </>
        )}

        {view === "event" && (
          <>
            <p className="dir-hint">
              <b>행사는 모체가 아니라 부수다.</b> 컨택을 쌓아 두면 그중 몇이 같은 자리에 있을 뿐이고,
              그때 대면으로 한 단계 올린다. 그래서 자리마다 판정을 붙이고 그 자리에 걸린 우리 사람만 센다 —
              명단을 다 옮기면 수첩이 아니라 팸플릿이 된다.
            </p>
            <div className="dir-stages">
              {STAGES.map((e) => {
                const ppl = e.match ? PEOPLE.filter((p) => p.meet?.includes(e.match as string)) : [];
                const hot = ppl.filter((p) => p.stance === "talking" || p.stance === "open").length;
                return (
                  <section key={e.key} className={`dir-stage ev-${e.stance}`}>
                    <header>
                      <b>{e.name}</b>
                      <span className={`tag ev-${e.stance}`}>{EVENT_STANCES.find((x) => x.key === e.stance)?.label}</span>
                      <span className="dir-stage-when mono">{e.when}</span>
                      <span className="dir-stage-where">{e.where}</span>
                    </header>
                    <p className="dir-stage-note">{rich(e.note)}</p>
                    {ppl.length > 0 ? (
                      <p className="dir-stage-ppl">
                        <a href={link({ view: "people", ev: e.key })}>
                          이 자리에 우리 사람 <b>{ppl.length}</b>명{hot ? <> · 열려 있는 대화 <b>{hot}</b></> : null} →
                        </a>
                      </p>
                    ) : (
                      <p className="dir-stage-ppl none">아직 걸린 사람 없음</p>
                    )}
                  </section>
                );
              })}
            </div>
          </>
        )}

        <section style={{ marginTop: 28 }}>
          <h2 className="dir-sec-h"><span>지도에 올리지 않은 것</span></h2>
          <p className="dir-sec-note" style={{ margin: "0 0 8px" }}>
            빠진 것에도 이유가 있다. 목록에 없다고 &quot;아직 못 봤다&quot;가 아니라 &quot;보고 뺐다&quot;는 뜻이다.
          </p>
          <div className="notice">
            {EXCLUDED.map((e, i) => (
              <p key={i} style={{ margin: i ? "6px 0 0" : 0 }}><b>{e.k}</b> — {e.v}</p>
            ))}
          </div>
          <p className="dir-sec-note" style={{ marginTop: 10 }}>
            판정 근거와 문안은 <code>depin/intel/business-directions.md</code>, X 축은 <code>celeb-ladder.md</code> 가
            정본이다. 갱신은 <code>lib/network.ts</code> 를 고쳐 재배포한다. <b>이 주소를 외부에 공유하지 말 것.</b>
          </p>
        </section>
      </main>
    </>
  );
}
