#!/usr/bin/env node
/**
 * OG 카드(1200×630) 생성 — 개발자 머신에서만 돌리고 결과 PNG를 리포에 커밋한다.
 * (Vercel 빌드 환경에는 크로미움이 없으므로 `npm run build`에는 포함하지 않는다.)
 *
 *   node scripts/make-og.mjs            # public/og/*.png 생성
 *   CHROME_BIN=/path/to/chrome node scripts/make-og.mjs
 *
 * 산출물: default.png(사이트) · quiz.png(진단) · cat-<id>.png(분류 14) — 총 16장.
 * 개체별 카드는 W2에서 서버리스 렌더(satori 등)로 붙인다. 그 전까지 개체 페이지는 분류 카드를 쓴다.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { cropPngTop } from './lib/png.mjs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public/og')
const TMP = join(tmpdir(), 'yokaimap-og')

const CANDIDATES = [
  process.env.CHROME_BIN,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean)
const CHROME = CANDIDATES.find((p) => existsSync(p))
if (!CHROME) {
  console.error('❌ 크로미움을 찾지 못했습니다. CHROME_BIN 환경변수로 경로를 지정하세요.')
  process.exit(1)
}

const { categories, count, site_count, version } = JSON.parse(
  readFileSync(join(ROOT, 'public/data/yokai.json'), 'utf8'),
)
// 폰트는 시스템 명조(serif) 폴백을 쓴다. 결과 PNG를 커밋하므로 생성 머신에서만 일관되면 된다.
const fontCss = ''

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

function card({ glyph, color, title, sub, note }) {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>
${fontCss}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#f4efe3;color:#211d18;
  font-family:'NM','Apple SD Gothic Neo',serif;position:relative;overflow:hidden}
/* 고주파 결(반복 1px 그라디언트)은 PNG 용량을 3~5배로 키운다 — 부드러운 라디얼만 남긴다 */
body::after{content:'';position:absolute;inset:0;
  background-image:radial-gradient(62% 48% at 10% 6%,rgba(150,120,70,.13),transparent 70%),
    radial-gradient(58% 42% at 90% 86%,rgba(120,100,60,.10),transparent 72%)}
.wrap{position:relative;z-index:1;height:630px}
/* 절대 배치 — 플렉스 높이 계산 차이로 하단 줄이 잘리는 일이 없게 고정한다 */
.top{position:absolute;left:76px;top:54px;display:flex;align-items:center;gap:16px;
  color:#7a7060;font-size:23px;letter-spacing:.06em}
.brandseal{width:44px;height:44px;border-radius:7px;background:#b23b26;color:#fff;
  display:grid;place-items:center;font-size:26px;font-weight:700}
.mid{position:absolute;left:76px;right:76px;top:150px;bottom:132px;
  display:flex;align-items:center;gap:42px}
.seal{width:172px;height:172px;border-radius:15px;display:grid;place-items:center;
  font-size:96px;font-weight:700;flex:none}
h1{font-size:76px;line-height:1.12;letter-spacing:-.02em}
.sub{margin-top:18px;font-size:27px;line-height:1.5;color:#4d453a;max-width:700px}
.bot{position:absolute;left:76px;right:76px;bottom:52px;display:flex;
  align-items:center;justify-content:space-between;
  border-top:2px solid #c6b697;padding-top:18px;color:#7a7060;font-size:21px}
</style></head><body><div class="wrap">
  <div class="top"><span class="brandseal">怪</span><span>한국요괴지도 · KOREAN YOKAI MAP</span></div>
  <div class="mid">
    <div class="seal" style="background:color-mix(in srgb, ${color} 14%, #faf6ec);border:2px solid color-mix(in srgb, ${color} 34%, #faf6ec);color:${color}">${esc(glyph)}</div>
    <div><h1>${esc(title)}</h1><div class="sub">${esc(sub)}</div></div>
  </div>
  <div class="bot"><span>${esc(note)}</span><span>출처·검증등급 표기 · CC BY 4.0</span></div>
</div></body></html>`
}

const W = 1200
const H = 630

/** 헤드리스 크로미움의 레이아웃 뷰포트는 창 높이보다 작다(창 크롬 높이). 실측해서 보정한다. */
function measureChromeHeight() {
  const probe = join(TMP, 'probe.html')
  writeFileSync(probe, '<!doctype html><title>p</title><body><i id=o></i><script>o.textContent="H"+innerHeight</script>')
  const dom = execFileSync(
    CHROME,
    ['--headless', '--no-sandbox', '--disable-gpu', `--window-size=${W},${H}`, '--virtual-time-budget=1500', '--dump-dom', `file://${probe}`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  )
  const inner = Number(dom.match(/>H(\d+)</)?.[1])
  return Number.isFinite(inner) ? H - inner : 0
}

mkdirSync(OUT, { recursive: true })
mkdirSync(TMP, { recursive: true })
const CHROME_H = measureChromeHeight()
if (CHROME_H) console.log(`  (창 크롬 높이 ${CHROME_H}px 보정 — ${H + CHROME_H}px로 렌더 후 상단 ${H}px 크롭)`)

const jobs = [
  {
    file: 'default.png',
    html: card({
      glyph: '怪',
      color: '#b23b26',
      title: '한국요괴지도',
      sub: `도깨비·구미호·이무기부터 제주 본풀이 신격까지 ${count}체. 전승지 ${site_count}곳을 지도 위에.`,
      note: `데이터 v${version} · 17개 시도 전체 커버`,
    }),
  },
  {
    file: 'quiz.png',
    html: card({
      glyph: '占',
      color: '#6f5aa3',
      title: '요괴 체질진단',
      sub: '8문항으로 알아보는 나와 가장 가까운 한국 요괴. 음양·물뭍·자연사람·수호장난 4축.',
      note: '운세가 아니라 결정론 진단',
    }),
  },
  ...categories.map((c) => ({
    file: `cat-${c.id}.png`,
    html: card({
      glyph: c.glyph,
      color: c.color,
      title: c.name,
      sub: c.blurb.length > 88 ? `${c.blurb.slice(0, 86)}…` : c.blurb,
      note: `한국요괴도감 · ${c.jp_counterpart} 대응`,
    }),
  })),
]

for (const j of jobs) {
  const htmlPath = join(TMP, `${j.file}.html`)
  writeFileSync(htmlPath, j.html)
  execFileSync(
    CHROME,
    [
      '--headless',
      '--no-sandbox',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--window-size=${W},${H + CHROME_H}`,
      '--virtual-time-budget=3000',
      `--screenshot=${join(TMP, j.file)}`,
      `file://${htmlPath}`,
    ],
    { stdio: 'ignore' },
  )
  writeFileSync(join(OUT, j.file), cropPngTop(readFileSync(join(TMP, j.file)), H))
  console.log(`  og/${j.file}`)
}

rmSync(TMP, { recursive: true, force: true })
console.log(`✅ OG 카드 ${jobs.length}장 생성 — public/og/`)
