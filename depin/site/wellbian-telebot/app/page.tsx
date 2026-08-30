/* 첫 화면 (8/30 서우 — "배포하면 화면도 보이게")

   배포하고 주소를 열면 "웹훅 엔드포인트입니다" 한 줄뿐이라 대시보드로 갈 길이 없었다.
   설정이 제대로 붙었는지도 /api/health 의 JSON 을 읽어야 알 수 있었다.

   그래서 이 자리를 상태판으로 쓴다. 무엇이 붙었고 무엇이 비었는지 한눈에 보이고,
   비어 있으면 무엇을 하면 되는지 그 자리에 적어 둔다 — 값은 보여주지 않는다. */

import { redirect } from "next/navigation";
import { ADMIN_KEY, isAuthed, setAuthCookie } from "@/lib/auth";
import { storeKind, storeVars, listItems } from "@/lib/store";
import { cacheInfo } from "@/lib/faq-client";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const authed = await isAuthed();
  const info = cacheInfo();

  const rows: [string, boolean, string][] = [
    ["봇 토큰", Boolean(process.env.TG_BOT_TOKEN), "TG_BOT_TOKEN — BotFather 토큰"],
    ["웹훅 시크릿", Boolean(process.env.TG_WEBHOOK_SECRET), "TG_WEBHOOK_SECRET — setWebhook 의 secret_token 과 같은 값"],
    ["정본 주소", info.configured, "FAQ_SOURCE_URL — 판매 사이트의 /api/faq"],
    ["CS 채널", Boolean(process.env.TG_CS_CHAT), "TG_CS_CHAT — 답 못 한 질문을 보낼 채널 (선택)"],
    ["관리 키", Boolean(ADMIN_KEY), "ADMIN_KEY — 대시보드 접근 키"],
    ["저장소", storeKind() === "kv",
      storeKind() === "kv"
        ? `연결됨 — ${storeVars()}`
        : "Vercel → Storage 에서 KV 를 이 프로젝트에 연결 (없으면 배포 때마다 기록이 사라집니다)"],
  ];

  /* 정본을 실제로 읽어 왔는지까지 봐야 "설정은 됐는데 안 닿는" 상태를 구분할 수 있다 */
  const faqNote = info.last
    ? info.last.note === "ok"
      ? `정본 ${info.entries}문항을 읽었습니다`
      : `마지막 시도: ${info.last.note}${info.last.status ? ` (${info.last.status})` : ""}`
    : "아직 읽어 온 적이 없습니다 — 봇에 질문이 한 번 들어오면 읽습니다";

  const total = authed ? (await listItems()).length : 0;

  async function login(form: FormData) {
    "use server";
    if (String(form.get("k") ?? "") !== ADMIN_KEY || !ADMIN_KEY) redirect("/?e=1");
    await setAuthCookie();
    redirect("/admin");
  }

  return (
    <>
      <header className="top">
        <div className="wrap top-in">
          <span className="brand">wellbian FAQ bot</span>
          <span className="brand-sub">@wellbian_faq_bot · @wellbiantalk</span>
          {authed && (
            <nav className="top-nav">
              <a className="chip on" href="/admin">CS 인박스 열기 →</a>
            </nav>
          )}
        </div>
      </header>

      <main className="wrap" style={{ paddingBottom: 72, maxWidth: 720 }}>
        {authed ? (
          <section className="now">
            <a className="now-card lead" href="/admin">
              <div className="now-k">CS 인박스</div>
              <div className="now-v mono" style={{ color: "var(--w-main)" }}>{total}</div>
              <div className="now-note">들어온 문의 · 눌러서 열기</div>
            </a>
            <a className="now-card" href="/admin/people">
              <div className="now-k">사람 보기</div>
              <div className="now-v" style={{ fontSize: 20, color: "var(--ink-2)" }}>→</div>
              <div className="now-note">주의·열성 분류</div>
            </a>
          </section>
        ) : (
          <section className="tools" style={{ marginTop: 4 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>대시보드 열기</div>
            {!ADMIN_KEY ? (
              <div className="notice" style={{ margin: 0 }}>
                <b>ADMIN_KEY 가 설정되지 않았습니다.</b> Vercel 프로젝트 → Settings →
                Environment Variables 에 아무 긴 문자열로 추가한 뒤 Redeploy 하면
                여기서 바로 열 수 있습니다.
              </div>
            ) : (
              <form action={login} className="search" style={{ marginBottom: 0 }}>
                <input name="k" type="password" placeholder="관리 키" autoComplete="current-password" />
                <button className="btn primary" type="submit">열기</button>
              </form>
            )}
            {sp.e && ADMIN_KEY && (
              <p style={{ fontSize: 12.5, color: "var(--warn-text)", marginTop: 8 }}>
                키가 맞지 않습니다.
              </p>
            )}
            <p style={{ fontSize: 12, color: "var(--hint)", marginTop: 10, lineHeight: 1.6 }}>
              한 번 열면 이 브라우저에 30일 동안 기억합니다. 주소에 키가 남지 않습니다.
            </p>
          </section>
        )}

        <section className="tools">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>설정 상태</div>
          {rows.map(([label, ok, hint]) => (
            <div key={label} className="frow" style={{ alignItems: "flex-start", padding: "7px 0",
                                                       borderTop: "1px solid var(--line-2)" }}>
              <span className={`tag ${ok ? "st-done" : "st-doing"}`} style={{ minWidth: 34, textAlign: "center" }}>
                {ok ? "OK" : "없음"}
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 600, width: 92 }}>{label}</span>
              <span style={{ fontSize: 12.5, color: "var(--ink-4)", flex: 1, minWidth: 200, lineHeight: 1.55 }}>
                {hint}
              </span>
            </div>
          ))}
          <p style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 12, lineHeight: 1.6 }}>
            정본 — {faqNote}
          </p>
        </section>

        <p style={{ fontSize: 12.5, color: "var(--hint)", marginTop: 16, lineHeight: 1.7 }}>
          이 주소는 텔레그램 웹훅 엔드포인트이기도 합니다(<code>/api/tg</code>).
          커뮤니티는 <a href="https://t.me/wellbiantalk">t.me/wellbiantalk</a> 입니다.
        </p>
      </main>
    </>
  );
}
