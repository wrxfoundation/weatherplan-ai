import Link from "next/link";
import { SubHeader } from "@/components/chrome";
import {
  A_CUTLINE, COPY_DUAL, COPY_SCORE, COPY_TICKETS,
  NOTICE_SELF_CHECK, NOTICE_TICKET_CAP,
} from "@/lib/data";

/* 2차 응모·순번 안내 서브페이지 — 로직 3단 + 그룹별 참여 예시 4종 (가상 인물) */

const h2: React.CSSProperties = { fontSize: 22, fontWeight: 800, color: "var(--w-deep)" };
const p13: React.CSSProperties = { fontSize: 13.5, lineHeight: 1.7, color: "var(--ink-3)" };

function Num({ n }: { n: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 99, background: "var(--w-main)", color: "#fff", fontSize: 13, fontWeight: 800, flex: "none" }}>
      {n}
    </span>
  );
}

function ScoreChip({ l, v }: { l: string; v: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 5, background: "var(--sec-alt)", border: "1px solid var(--bd-card)", borderRadius: 99, padding: "4px 10px", fontSize: 11.5, whiteSpace: "nowrap" }}>
      <span style={{ color: "var(--ink-3)" }}>{l}</span>
      <b style={{ color: "var(--w-deep)" }}>{v}</b>
    </span>
  );
}

/* 그룹별 예시 카드 */
function PersonaCard({
  badge, badgeStyle, title, intro, steps, point,
}: {
  badge: string; badgeStyle: React.CSSProperties; title: string; intro: string;
  steps: { when: string; what: string }[]; point: string;
}) {
  return (
    <div style={{ border: "1px solid var(--bd-card)", borderRadius: 16, background: "#fff", padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 34, height: 34, borderRadius: 10, fontSize: 14, fontWeight: 800, padding: "0 9px", ...badgeStyle }}>{badge}</span>
        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--w-deep)" }}>{title}</div>
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.65, color: "var(--ink-3)" }}>{intro}</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {steps.map((s, i) => (
          <div key={s.when} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: "var(--w-main)", marginTop: 5, flex: "none" }} />
              {i < steps.length - 1 && <span style={{ width: 2, flex: 1, minHeight: 22, background: "var(--line)" }} />}
            </div>
            <div style={{ paddingBottom: i < steps.length - 1 ? 12 : 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--w-main)" }}>{s.when}</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ink-2)" }}>{s.what}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: "var(--w-tint)", borderRadius: 10, padding: "11px 14px", fontSize: 12.5, lineHeight: 1.6, fontWeight: 700, color: "var(--w-deep)" }}>
        {point}
      </div>
    </div>
  );
}

export default function WaitlistGuidePage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--panel)" }}>
      <SubHeader right={<span style={{ fontSize: 12.5, color: "var(--cap)" }}>2차 응모·순번 안내</span>} />

      <main className="wl-sec-pad" style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 40, width: "100%" }}>

          {/* 헤드 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link href="/waitlist" style={{ fontSize: 12.5, fontWeight: 700 }}>← 대기 등록으로</Link>
            <h1 style={{ fontSize: "clamp(24px, 3.4vw, 32px)", fontWeight: 800, color: "var(--w-deep)", lineHeight: 1.3 }}>
              2차 물량 응모와 순번, 이렇게 정해집니다
            </h1>
            <p style={p13}>10/3 판매는 S → A → B → 일반 순서로 열립니다. 어떻게 하면 어느 그룹이 되는지, 그룹마다 무엇이 달라지는지 예시로 설명합니다.</p>
          </div>

          {/* ── 로직 3단 ── */}
          <section style={{ background: "#fff", border: "1px solid var(--bd-card)", borderRadius: 16, padding: "26px 28px", display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Num n="1" />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--w-deep)" }}>응모권 — S그룹(1,000명) 추첨</div>
                <div style={p13}>미션으로 모은 응모권이 {COPY_TICKETS}. 추첨 방식은 접수 마감 전에 미리 공개되어 누구나 같은 결과를 다시 확인할 수 있고, 발표는 9/30 마감 직후입니다.</div>
                <div style={p13}>구매 상한은 각 순서마다 <b style={{ color: "var(--w-deep)" }}>1인 5대</b>로 모두 같습니다(마지막 일반 순서부터는 상한 없음). 더 필요한 물량은 이어지는 순서에서 다시 구매할 수 있습니다.</div>
                <div style={{ fontSize: 11.5, color: "var(--cap)" }}>{NOTICE_TICKET_CAP}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Num n="2" />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--w-deep)" }}>순번 점수 — 그룹을 확정합니다</div>
                <div style={p13}>{COPY_SCORE}. 저희가 확인할 수 있는 활동만 점수에 들어갑니다.</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <ScoreChip l="대기 등록" v="100점" /><ScoreChip l="구매 의사" v="20점" /><ScoreChip l="wellbian 커뮤니티" v="20점" /><ScoreChip l="친구 초대" v="30점" />
                </div>
                <div style={p13}>
                  <b style={{ color: "var(--w-deep)" }}>A그룹 기준은 미리 정해져 있습니다 — {A_CUTLINE}점 이상.</b> 대기 등록(100점)에 구매 의사(20점)와 커뮤니티 참여(20점)만 더해도 {A_CUTLINE}점, A그룹이 확정됩니다.
                </div>
                <div style={p13}>기준 점수는 마감까지 바뀌지 않고, 점수는 내려가는 일이 없습니다 — <b style={{ color: "var(--w-deep)" }}>한 번 넘으면 그대로 확정</b>입니다. 내 점수와 적립 내역은 미션 대시보드에서 언제든 확인할 수 있습니다.</div>
                <div style={p13}>선착순이 아닙니다 — <b style={{ color: "var(--w-deep)" }}>같은 점수면 같은 그룹</b>이고, 등록 순서는 배정에 영향을 주지 않습니다. 각 그룹 안에서의 구매만 오픈 후 선착순입니다.</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Num n="3" />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--w-deep)" }}>구매는 S → A → B → 일반 순서로 열립니다 (10/3)</div>
                <div style={p13}>{COPY_DUAL}</div>
                <div style={p13}><b style={{ color: "var(--w-deep)" }}>순서는 보장되지만, 재고는 보장되지 않습니다.</b> 앞 그룹에서 물량이 줄어들 수 있고, 앞 그룹일수록 안전합니다.</div>
                <div style={p13}>다만 <b style={{ color: "var(--w-deep)" }}>B그룹 몫으로 최소 1,000대는 따로 남겨 둡니다</b> — 그룹 몫 보장이며, 그룹 안에서는 선착순입니다. 등록하지 않은 일반 방문자 몫으로 남겨 두는 물량은 없습니다.</div>
              </div>
            </div>
          </section>

          {/* ── 그룹별 참여 예시 ── */}
          <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h2 style={h2}>내 입장에서는 어떻게 되나요? — 그룹별 예시</h2>
              <span style={{ fontSize: 12, color: "var(--cap)" }}>아래 인물은 이해를 돕기 위한 가상의 참여자입니다.</span>
            </div>

            <div className="price-grid" style={{ gap: 16 }}>
              <PersonaCard
                badge="S"
                badgeStyle={{ background: "var(--w-main)", color: "#fff" }}
                title="추첨에 당첨된 지훈 님 — 응모권 58장"
                intro="9월 초에 대기 등록을 하고 미션을 대부분 완료했습니다. 친구 6명 초대까지 성사되어 응모권 58장을 모았습니다."
                steps={[
                  { when: "~ 9/30", what: "미션으로 응모권을 모읍니다. 많을수록 추첨에 유리합니다." },
                  { when: "9/30 마감 직후", what: "추첨 발표 — 당첨되어 S그룹이 됩니다." },
                  { when: "10/3", what: "가장 먼저 구매가 열립니다. 상한인 5대를 구매했습니다." },
                  { when: "그 이후", what: "더 필요하면 A 순서가 열릴 때 다시 구매할 수 있습니다." },
                ]}
                point="응모권은 당첨 확률을 올립니다 — 당첨되어도 구매는 1인 5대까지입니다."
              />

              <PersonaCard
                badge="A"
                badgeStyle={{ background: "var(--w-deep)", color: "#fff" }}
                title="추첨에 떨어진 서연 님 — 170점"
                intro="등록(100점) + 구매 의사(20점) + 커뮤니티(20점) + 친구 초대 성사(30점) = 170점. 응모권도 모았지만 추첨에서는 떨어졌습니다."
                steps={[
                  { when: "9/30 마감 직후", what: "미당첨. 하지만 140점 이상이라 A그룹은 이미 확정되어 있습니다 — 점수는 사라지지 않습니다." },
                  { when: "10/3", what: "S그룹 다음 순서로 구매가 열립니다. S는 1인 5대 상한이 있어 물량이 남아 있습니다." },
                  { when: "구매", what: "남은 물량에서 1인 5대까지 구매합니다 — 그룹 안에서는 선착순입니다." },
                ]}
                point="떨어져도 잃지 않습니다 — 이게 A그룹입니다. 등록 + 구매 의사 + 커뮤니티, 세 가지면 누구나 140점입니다."
              />

              <PersonaCard
                badge="B"
                badgeStyle={{ background: "var(--chip)", color: "var(--w-deep)" }}
                title="등록만 해둔 민재 님 — 100점"
                intro="대기 등록만 하고 다른 미션은 하지 않았습니다. 100점이라 140점 기준에 못 미칩니다."
                steps={[
                  { when: "9/30", what: "140점 미만이라 B그룹으로 확정됩니다." },
                  { when: "10/3", what: "S·A 다음 순서로 열립니다. 그래도 등록하지 않은 방문자보다는 먼저입니다." },
                  { when: "10/3 B 오픈", what: "B 몫으로 남겨 둔 최소 1,000대에서 1인 5대까지, 선착순으로 구매합니다." },
                  { when: "지금 할 수 있는 것", what: "마감 전에 구매 의사(+20점)와 커뮤니티 참여(+20점)만 해도 140점 — A그룹으로 올라가 더 안전해집니다." },
                ]}
                point="등록만 해도 B 몫 최소 1,000대의 기회가 생깁니다. 두 가지만 더 하면 A그룹입니다."
              />

              <PersonaCard
                badge="일반"
                badgeStyle={{ background: "#fff", border: "1px solid var(--bd-card)", color: "var(--ink-3)" }}
                title="등록하지 않은 하늘 님"
                intro="대기 등록을 하지 않고 10/3에 처음 방문했습니다."
                steps={[
                  { when: "10/3", what: "모든 그룹 다음, 마지막 순서에 구매가 열립니다." },
                  { when: "구매", what: "남은 물량이 있을 때만 구매할 수 있습니다. 일반 몫으로 남겨 두는 물량은 없어, 매진이면 기회가 없습니다." },
                  { when: "지금 할 수 있는 것", what: "지금 등록만 해도 응모권 +10장, 100점으로 B그룹부터 시작합니다." },
                ]}
                point="등록에는 비용이 없습니다 — 순서만 달라집니다."
              />
            </div>
          </section>

          {/* 고지 + CTA */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, border: "1px solid var(--bd-card)", background: "#fff", borderRadius: 12, padding: "16px 18px", fontSize: 12, lineHeight: 1.6, color: "var(--cap)" }}>
            {[NOTICE_SELF_CHECK, NOTICE_TICKET_CAP].map((t) => (
              <span key={t} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                <span style={{ flex: "none", width: 4, height: 4, borderRadius: 99, background: "var(--hint)", marginTop: 7 }} />
                {t}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12 }} className="price-grid">
            <Link href="/waitlist" className="btn-main" style={{ fontSize: 15, borderRadius: 11, padding: 15, textDecoration: "none", color: "#fff" }}>
              대기 등록 하러 가기
            </Link>
            <Link href="/me/waitlist" className="btn-outline-deep" style={{ fontSize: 15, borderRadius: 11, padding: 14, textDecoration: "none" }}>
              내 순번 보기
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
