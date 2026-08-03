/**
 * 스모크 테스트 — 실행 중인 서버(기본 :3100)에 붙어 모든 화면을 실제로 연다.
 *
 *   npm run build && npm start &   # 또는 CI 가 띄운 서버
 *   npm run smoke
 *
 * 왜 필요한가: `next build` 는 이 프로젝트에서 다음을 못 잡는다.
 *   · 정의 안 된 식별자 (렌더 시점에야 터진다)
 *   · Tailwind 클래스 충돌 (예: .collapse 는 visibility:collapse 와 부딪혀
 *     내용이 통째로 사라지는데 빌드는 통과한다)
 *   · 접근성 회귀 (랜드마크·버튼 이름·제목 계층)
 *   · 터치 타깃 축소
 * 전부 화면을 실제로 열어 봐야 드러나는 것들이라 여기서 확인한다.
 *
 * 브라우저: PLAYWRIGHT_CHROMIUM 환경변수로 실행 파일 경로를 넘길 수 있다.
 */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const BASE = process.env.SMOKE_BASE || "http://localhost:3100";
const EXEC = process.env.PLAYWRIGHT_CHROMIUM || undefined;

const ROUTES = [
  "/", "/service", "/onboarding", "/elder", "/care-profile",
  "/family", "/family/calendar", "/family/requests", "/family/my",
  "/family/store", "/family/watch", "/family/hospitals",
  "/concierge", "/concierge-onboarding", "/dispatch", "/admin",
  "/report/verify",
];

// 이 규칙들은 한 번 고쳐 놓은 것이라 다시 늘어나면 실패로 본다.
// color-contrast 는 유지하기로 한 골드 토큰 때문에 제외한다 (별도 과제).
const MUST_BE_ZERO = [
  "button-name", "image-alt", "link-name", "label",
  "landmark-one-main", "landmark-unique", "landmark-banner-is-top-level",
  "page-has-heading-one", "region", "aria-required-attr", "aria-valid-attr-value",
];

// 샌드박스/외부 의존으로 어쩔 수 없는 것 — 실패로 세지 않는다
const IGNORE_ERR = /favicon|fonts\.googleapis|ERR_CONNECTION_RESET|ERR_TUNNEL_CONNECTION_FAILED|tile\.openstreetmap|basemaps\.cartocdn/;

const fails = [];
const note = (m) => console.log(m);

const browser = await chromium.launch({
  executablePath: EXEC,
  args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
});

for (const route of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`JS: ${String(e).slice(0, 140)}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !IGNORE_ERR.test(m.text())) errors.push(`console: ${m.text().slice(0, 140)}`);
  });

  let status = 0;
  try {
    const res = await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 45000 });
    status = res ? res.status() : 0;
    await page.waitForTimeout(700);
  } catch (e) {
    fails.push(`${route} — 열리지 않음: ${String(e).slice(0, 100)}`);
    await ctx.close();
    continue;
  }

  if (status >= 400) fails.push(`${route} — HTTP ${status}`);
  for (const e of errors) fails.push(`${route} — ${e}`);

  // 화면에 실제로 내용이 그려졌는가 (클래스 충돌로 통째로 사라지는 경우를 잡는다)
  const text = await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").trim().length);
  if (text < 60) fails.push(`${route} — 본문이 비어 있음 (보이는 글자 ${text}자)`);

  // 접근성
  await page.addScriptTag({ content: AXE });
  const { violations } = await page.evaluate(async () => window.axe.run(document, { resultTypes: ["violations"] }));
  for (const v of violations) {
    if (MUST_BE_ZERO.includes(v.id)) fails.push(`${route} — a11y ${v.id} (${v.impact}) ${v.nodes.length}건`);
    if (v.impact === "critical") fails.push(`${route} — a11y critical ${v.id} ${v.nodes.length}건`);
  }

  // 터치 타깃 — WCAG 2.2 AA(2.5.8) 최소 24x24.
  // Leaflet 기본 컨트롤은 서드파티라 제외한다.
  const tiny = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('button,a[href],input,select,[role="button"]')) {
      if (el.closest(".leaflet-container")) continue;
      const b = el.getBoundingClientRect();
      if (b.width < 1 || b.height < 1) continue;
      if (b.height < 24 || b.width < 24) out.push(`${el.tagName}"${(el.textContent || "").trim().slice(0, 12)}" ${Math.round(b.width)}x${Math.round(b.height)}`);
    }
    return out;
  });
  for (const t of tiny) fails.push(`${route} — 터치 타깃 24px 미만: ${t}`);

  note(`  ${status === 200 ? "OK " : "!! "} ${route}`);
  await ctx.close();
}

await browser.close();

if (fails.length) {
  console.error(`\n스모크 실패 ${fails.length}건:`);
  for (const f of fails) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\n스모크 통과 — ${ROUTES.length}개 화면`);
