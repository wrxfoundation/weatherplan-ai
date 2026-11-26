// 구글 플레이 등록 자료 만들기 (2026-11-26) — docs/GOOGLE-PLAY.md '4. 등록 자료'.
//
//   npm run build && npm start &          (시연 화면이 뜨는 서버 — 로그인 설정이 없는 빌드)
//   PLAYWRIGHT_CHROMIUM=/크롬/경로 node scripts/play-assets.mjs
//
//   --base http://localhost:3000   화면을 찍을 서버 (기본값)
//   --out  docs/google-play        결과를 둘 폴더 (기본값)
//   --icons                        public/icons 의 앱 아이콘 4개도 다시 뜬다 (favicon.svg 를 바꿨을 때만)
//
// 만드는 것
//   play-icon-512.png             스토어 아이콘 — 512×512 · 32비트 PNG(알파 채널) · 가장자리까지 남색 (모서리는 플레이가 둥글게 자른다)
//   feature-graphic-1024x500.png  대표 이미지 — 1024×500 · 24비트 PNG(알파 없음)
//   screenshot-NN-*.png           휴대전화 화면 — 1080×1920 (360×640 을 3배로). 시연 화면을 그대로 찍는다
//
// 화면에 보이는 금액 · 병원 이름 · 문구는 시연 데이터다 — 올리기 전에 출시 시점의 실제 앱과 같은지 확인한다.
// 대표 이미지는 Noto Sans KR · Montserrat 를 구글 폰트에서 받는다 (인터넷 필요).
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const BASE = arg("base", "http://localhost:3000").replace(/\/$/, "");
const OUT = path.resolve(ROOT, arg("out", "docs/google-play"));
const NAVY = "#0A1F3C";
const FAVICON = fs.readFileSync(path.join(ROOT, "public/favicon.svg"), "utf8");

// 휴대전화 화면 — 앱을 쓰는 모습 (로그인 화면 · 소개 화면이 아니라)
const SHOTS = [
  ["01-family-home", "/family"],
  ["02-elder-home", "/elder"],
  ["03-requests", "/family/requests"],
  ["04-calendar", "/family/calendar"],
  ["05-meds", "/family/meds"],
  ["06-visit-report", "/family/report"],
  ["07-store", "/family/store"],
];

// favicon.svg — 남색 둥근 사각 + 심볼. 가장자리까지 채운 판(k = 심볼 크기 비율)을 만든다
const CX = 218 + 337.5;
const CY = 15 + 337.5;
const bleed = (k) =>
  FAVICON.replace('rx="148"', 'rx="0"')
    .replace('<g transform="translate(0,712) scale(0.1,-0.1)">', `<g transform="translate(${CX},${CY}) scale(${k}) translate(${-CX},${-CY})"><g transform="translate(0,712) scale(0.1,-0.1)">`)
    .replace("</g></svg>", "</g></g></svg>");
const sized = (svg, px) => svg.replace('width="675" height="675"', `width="${px}" height="${px}" style="display:block"`);

// PNG 를 32비트(RGBA · 색 형식 6)로 쓴다 — 크롬은 불투명한 그림을 24비트로 저장한다
const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const x of buf) c = CRC[(c ^ x) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, body) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(body.length);
  const td = Buffer.concat([Buffer.from(type), body]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
const writeRgbaPng = (file, w, h, rgba) => {
  const row = w * 4 + 1;
  const rows = Buffer.alloc(row * h);
  for (let y = 0; y < h; y++) rgba.copy(rows, y * row + 1, y * w * 4, (y + 1) * w * 4);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // 채널마다 8비트
  ihdr[9] = 6; // RGBA
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(rows, { level: 9 })), chunk("IEND", Buffer.alloc(0))]));
};

const featureHtml = () => {
  const symbol = FAVICON.replace(/<rect[^>]*\/>\n?/, "").replace('width="675" height="675"', 'width="150" height="150"');
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@500;700;800&family=Montserrat:wght@800&display=swap">
<style>
html,body{margin:0}
body{width:1024px;height:500px;background:${NAVY};color:#fff;font-family:"Noto Sans KR",sans-serif;overflow:hidden;position:relative}
.glow{position:absolute;right:-140px;top:-160px;width:560px;height:560px;border-radius:50%;background:radial-gradient(closest-side,rgba(127,178,208,.22),rgba(127,178,208,0))}
.wrap{position:absolute;inset:0;display:flex;align-items:center;padding:0 84px;gap:56px}
.mark{flex:none;width:190px;height:190px;border-radius:44px;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center}
.eyebrow{font-size:22px;font-weight:700;color:#7FB2D0;letter-spacing:.02em}
h1{margin:14px 0 0;font-size:54px;line-height:1.22;font-weight:800;letter-spacing:-.02em;word-break:keep-all}
.brand{margin-top:26px;font-family:Montserrat,sans-serif;font-weight:800;font-size:26px;letter-spacing:.12em;color:rgba(255,255,255,.92)}
.brand span{font-family:"Noto Sans KR";font-weight:500;letter-spacing:0;font-size:20px;color:rgba(255,255,255,.66);margin-left:14px}
</style></head><body><div class="glow"></div>
<div class="wrap"><div class="mark">${symbol}</div>
<div><div class="eyebrow">시니어 케어 프리미엄 멤버십</div>
<h1>부모님은 늘<br>괜찮다고 하십니다.</h1>
<div class="brand">K-CARE<span>센서가 감지하고 사람이 확인합니다</span></div></div></div>
</body></html>`;
};

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined });
const done = [];

// 1. 스토어 아이콘 512 — 32비트
{
  const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
  await page.setContent(`<body style="margin:0;background:${NAVY}">${sized(bleed(0.8), 512)}</body>`);
  const b64 = await page.evaluate(async () => {
    const svg = document.querySelector("svg");
    const img = new Image();
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(svg));
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const g = canvas.getContext("2d");
    g.drawImage(img, 0, 0, 512, 512);
    const d = g.getImageData(0, 0, 512, 512).data;
    let s = "";
    for (let i = 0; i < d.length; i += 8192) s += String.fromCharCode.apply(null, d.subarray(i, i + 8192));
    return btoa(s);
  });
  writeRgbaPng(path.join(OUT, "play-icon-512.png"), 512, 512, Buffer.from(b64, "base64"));
  await page.close();
  done.push("play-icon-512.png");
}

// 2. 대표 이미지 1024×500 — 알파 없음
{
  const page = await browser.newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
  await page.setContent(featureHtml(), { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(OUT, "feature-graphic-1024x500.png") });
  await page.close();
  done.push("feature-graphic-1024x500.png");
}

// 3. 휴대전화 화면 — 시작 화면(스플래시)이 걷힌 뒤에 찍는다
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, locale: "ko-KR" });
  const page = await ctx.newPage();
  for (const [name, route] of SHOTS) {
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => { const s = document.querySelector(".kc-splash"); return !s || getComputedStyle(s).display === "none"; }, null, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, `screenshot-${name}.png`) });
    done.push(`screenshot-${name}.png`);
  }
  await ctx.close();
}

// 4. 앱 아이콘 (public/icons) — --icons 를 줬을 때만
if (process.argv.includes("--icons")) {
  const dir = path.join(ROOT, "public/icons");
  fs.mkdirSync(dir, { recursive: true });
  const jobs = [
    [FAVICON, 192, "icon-192.png", true], // 모서리 둥근 사각 · 바깥 투명
    [FAVICON, 512, "icon-512.png", true],
    [bleed(0.7), 192, "icon-maskable-192.png", false], // 가장자리까지 남색 · 심볼 70% (원 · 스쿼클로 잘려도 심볼이 남는다)
    [bleed(0.7), 512, "icon-maskable-512.png", false],
  ];
  for (const [svg, px, file, transparent] of jobs) {
    const page = await browser.newPage({ viewport: { width: px, height: px }, deviceScaleFactor: 1 });
    await page.setContent(`<body style="margin:0;background:${transparent ? "transparent" : NAVY}">${sized(svg, px)}</body>`);
    await page.screenshot({ path: path.join(dir, file), omitBackground: transparent });
    await page.close();
    done.push(`public/icons/${file}`);
  }
}

await browser.close();
for (const f of done) {
  const file = f.startsWith("public/") ? path.join(ROOT, f) : path.join(OUT, f);
  console.log(`${String(Math.round(fs.statSync(file).size / 1024)).padStart(5)} KB  ${f}`);
}
console.log(`끝 — ${done.length}개 · ${path.relative(ROOT, OUT)}`);
