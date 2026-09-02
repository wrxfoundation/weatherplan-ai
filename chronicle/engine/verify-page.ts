/**
 * 공개 검증 페이지 (docs/verify.html) — "provable"을 만질 수 있게.
 *
 * GitHub Pages는 정적이지만, 방문자의 브라우저가 Web Crypto(SHA-256)로 공개 원장을
 * 직접 재계산한다 — 제네시스부터 체인을 다시 잇고 "변조 없음"을 스스로 확인. 서버도,
 * 설치도, 우리에 대한 신뢰도 필요 없다. integrity.ts와 동일 알고리즘을 브라우저에 복제:
 *   content_hash = SHA256(canonicalJson({observed_at,entity_id,field,before,after,source_url}))
 *   chain_hash   = SHA256(prev + content_hash),  genesis = SHA256("chronicle:<id>:genesis")
 *
 * 원장은 jsDelivr(cdn.jsdelivr.net/gh, CORS 보장)로 받는다. 이 파일은 repo만 주입되는
 * 정적 산출물이라 결정적(사이트의 "변경 시에만 커밋" 성질 유지).
 */

/**
 * 브라우저 해시 함수 — integrity.ts와 바이트 단위로 동일해야 한다(거짓 변조 방지).
 * 테스트가 이 문자열을 Node에서 eval해 integrity.ts와 대조한다(verify-page.test.ts).
 * crypto.subtle·TextEncoder는 브라우저/Node22 공통 전역.
 */
export const CLIENT_HASH_FNS =
  "async function sha256Hex(str){\n" +
  '  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));\n' +
  '  return Array.from(new Uint8Array(buf)).map(function(b){ return b.toString(16).padStart(2,"0"); }).join("");\n' +
  "}\n" +
  "function sortKeysDeep(v){\n" +
  '  if (v !== null && typeof v === "object"){\n' +
  '    if (typeof v.toJSON === "function") return sortKeysDeep(v.toJSON());\n' +
  "    if (Array.isArray(v)) return v.map(sortKeysDeep);\n" +
  "    const out = Object.create(null);\n" +
  "    Object.keys(v).sort().forEach(function(k){ out[k] = sortKeysDeep(v[k]); });\n" +
  "    return out;\n" +
  "  }\n" +
  "  return v;\n" +
  "}\n" +
  "function canonicalJson(v){ return JSON.stringify(sortKeysDeep(v)); }\n" +
  "function contentInput(e){ return canonicalJson({ observed_at:e.observed_at, entity_id:e.entity_id, field:e.field, before:e.before, after:e.after, source_url:e.source_url }); }\n";

// 내부 브라우저 스크립트는 문자열 결합식으로 작성한다(백틱/${} 충돌 회피). repo만 1회 주입.
function clientScript(repo: string): string {
  return (
    'const REPO = "' +
    repo +
    '";\n' +
    'const CDN = "https://cdn.jsdelivr.net/gh/" + REPO + "@main";\n' +
    "const $ = function(id){ return document.getElementById(id); };\n" +
    CLIENT_HASH_FNS +
    "async function fetchText(url){ const r = await fetch(url, { cache: 'no-store' }); if (!r.ok) throw new Error('HTTP ' + r.status + ' — ' + url); return r.text(); }\n" +
    "function setStatus(html, cls){ const o = $('out'); o.className = 'result ' + (cls||''); o.innerHTML = html; }\n" +
    "async function loadSources(){\n" +
    "  try {\n" +
    "    const txt = await fetchText(CDN + '/docs/status.json');\n" +
    "    const list = JSON.parse(txt);\n" +
    "    const sel = $('src'); sel.innerHTML = '';\n" +
    "    list.forEach(function(s){ const o = document.createElement('option'); o.value = s.source_id; o.textContent = s.source_id + '  (' + (s.events||0) + ' events)'; sel.appendChild(o); });\n" +
    "  } catch (e) { $('hint').textContent = 'status.json 로드 실패 — 소스 id를 직접 입력하세요.'; }\n" +
    "}\n" +
    "async function verify(){\n" +
    "  const id = ($('src').value || $('manual').value || '').trim();\n" +
    "  if (!id){ setStatus('소스를 선택하거나 id를 입력하세요.', 'warn'); return; }\n" +
    "  $('go').disabled = true;\n" +
    "  setStatus('원장을 받는 중…', 'run');\n" +
    "  try {\n" +
    "    const base = CDN + '/data/' + id;\n" +
    "    const integrity = JSON.parse(await fetchText(base + '/integrity.json'));\n" +
    "    const raw = await fetchText(base + '/changes.jsonl');\n" +
    "    const lines = raw.split('\\n').filter(function(l){ return l.trim() !== ''; });\n" +
    "    const genesis = await sha256Hex('chronicle:' + id + ':genesis');\n" +
    "    let prev = genesis, count = 0; const errors = [];\n" +
    "    for (let i = 0; i < lines.length; i++){\n" +
    "      let e; try { e = JSON.parse(lines[i]); } catch (x){ errors.push('line ' + (i+1) + ': JSON 파싱 실패'); continue; }\n" +
    "      const ch = await sha256Hex(contentInput(e));\n" +
    "      if (ch !== e.content_hash) errors.push('line ' + (i+1) + ': content_hash 불일치(본문 변조 의심)');\n" +
    "      const link = await sha256Hex(prev + e.content_hash);\n" +
    "      if (link !== e.chain_hash) errors.push('line ' + (i+1) + ': chain_hash 불일치(체인 단절)');\n" +
    "      prev = e.chain_hash; count++;\n" +
    "      if (count % 400 === 0){ setStatus('재계산 중… ' + count + ' / ' + lines.length, 'run'); await new Promise(function(r){ setTimeout(r); }); }\n" +
    "    }\n" +
    "    if (count !== integrity.length) errors.push('길이 불일치: integrity.json=' + integrity.length + ', changes.jsonl=' + count);\n" +
    "    if (prev !== integrity.chain_hash) errors.push('체인 머리 불일치');\n" +
    "    if (genesis !== integrity.genesis) errors.push('제네시스 불일치');\n" +
    "    if (errors.length === 0){\n" +
    "      setStatus('<div class=\\'big ok\\'>\\u2713 검증 통과</div><p><b>' + count + '</b>개 이벤트를 제네시스부터 당신의 브라우저가 재계산했고, 전부 일치합니다. 이 원장은 한 줄도 위조·삭제·재배열되지 않았습니다.</p><div class=\\'hashes\\'><div>genesis <code>' + genesis.slice(0,24) + '\\u2026</code></div><div>chain head <code>' + prev.slice(0,24) + '\\u2026</code></div><div>last observed <code>' + (integrity.updated_at||'-') + '</code></div></div>', 'pass');\n" +
    "    } else {\n" +
    "      const items = errors.slice(0,20).map(function(m){ return '<li>' + m.replace(/</g,'&lt;') + '</li>'; }).join('');\n" +
    "      setStatus('<div class=\\'big bad\\'>\\u2717 검증 실패 (' + errors.length + '건)</div><p>재계산이 기록과 어긋납니다 — 원장이 변경되었을 수 있습니다.</p><ul>' + items + '</ul>', 'fail');\n" +
    "    }\n" +
    "  } catch (e){ setStatus('오류: ' + String(e.message || e).replace(/</g,'&lt;'), 'fail'); }\n" +
    "  $('go').disabled = false;\n" +
    "}\n" +
    "$('go').addEventListener('click', verify);\n" +
    // ?source=<id> 딥링크 — 소스 카드/피드에서 원클릭으로 그 소스를 바로 재검증.
    "var _pre = new URLSearchParams(location.search).get('source');\n" +
    "if (_pre){ $('manual').value = _pre; verify(); }\n" +
    "loadSources();\n"
  );
}

export function renderVerifyPage(repo: string): string {
  const safeRepo = repo.replace(/[^a-zA-Z0-9._/-]/g, ""); // repo 슬러그만 — 스크립트 주입 방지
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Chronicle — 공개 검증</title>
<meta name="description" content="이 원장이 위조되지 않았음을 당신의 브라우저가 직접 재계산해 확인한다 — 서버도 설치도 신뢰도 필요 없이.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400..800&display=swap" rel="stylesheet">
<style>
:root{--bg:#06141b;--glow:#0a2e3d;--line:#1e3a47;--ink:#eaf4f7;--mut:#9fb8c4;--dim:#6e8794;
  --accent:#3bcfe4;--blue:#5fa8f5;--ok:#10b981;--bad:#ef4444;--warn:#f59e0b;
  --glass:linear-gradient(135deg,rgba(255,255,255,.08),rgba(255,255,255,.02));--gbord:rgba(255,255,255,.14);
  --blur:saturate(170%) blur(18px);--gshadow:0 10px 30px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.06);
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
*{box-sizing:border-box;margin:0;padding:0}
body{background-color:var(--bg);color:var(--ink);
  font:16px/1.65 'Montserrat','Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',system-ui,-apple-system,sans-serif;
  background-image:radial-gradient(1100px 520px at 50% -160px,var(--glow) 0%,transparent 58%);background-attachment:fixed}
main{max-width:760px;margin:0 auto;padding:44px 20px 72px}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
code{font-family:var(--mono);font-size:.84em;background:rgba(59,207,228,.08);border:1px solid rgba(59,207,228,.2);border-radius:6px;padding:1px 6px;word-break:break-all}
.eyebrow{color:var(--dim);font-size:11.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase}
h1{font-size:29px;font-weight:800;letter-spacing:-.02em;margin-top:8px;
  background:linear-gradient(90deg,var(--accent),var(--blue));-webkit-background-clip:text;background-clip:text;color:transparent}
.lead{color:var(--mut);margin-top:12px;max-width:620px}
.lead b{color:var(--ink)}
.panel{background:var(--glass);border:1px solid var(--gbord);border-radius:18px;padding:20px 22px;margin:26px 0;
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);box-shadow:var(--gshadow)}
label{display:block;color:var(--mut);font-size:13px;margin-bottom:6px}
select,input,button{font:inherit}
select,input{width:100%;background:rgba(3,12,17,.6);color:var(--ink);border:1px solid var(--gbord);border-radius:10px;padding:10px 12px;margin-bottom:12px}
.row{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.row>*{flex:1;min-width:180px}
button{background:linear-gradient(90deg,var(--accent),var(--blue));color:#04222b;font-weight:800;border:none;border-radius:10px;padding:11px 22px;cursor:pointer;flex:0 0 auto}
button:disabled{opacity:.5;cursor:default}
.hint{color:var(--dim);font-size:12.5px;margin-top:2px}
.result{margin-top:16px;color:var(--mut);font-size:14.5px;min-height:1.5em}
.result.pass{color:var(--ink)}
.big{font-size:22px;font-weight:800;margin-bottom:8px}
.big.ok{color:var(--ok)}.big.bad{color:var(--bad)}
.result.run{color:var(--accent)}.result.warn{color:var(--warn)}
.result ul{margin:10px 0 0 18px;color:#ffb4b4;font-size:13px}
.hashes{margin-top:12px;display:grid;gap:4px;color:var(--dim);font-size:13px}
.how{color:var(--dim);font-size:13.5px;margin-top:8px}
.how code{color:var(--mut)}
footer{margin-top:44px;padding-top:18px;border-top:1px solid var(--line);color:var(--dim);font-size:13px;display:flex;gap:16px;flex-wrap:wrap}
</style>
</head>
<body>
<main>
<header>
  <span class="eyebrow">Chronicle · 무신뢰 검증</span>
  <h1>이 원장, 당신이 직접 검증하세요</h1>
  <p class="lead"><b>우리를 믿지 마세요.</b> 아래 버튼을 누르면 <b>당신의 브라우저</b>가 공개 원장을 받아
  제네시스부터 SHA-256 해시체인을 다시 계산하고, 한 줄이라도 위조·삭제·재배열됐는지 스스로 확인합니다.
  서버도, 설치도, 우리에 대한 신뢰도 필요 없습니다.</p>
</header>

<div class="panel">
  <label for="src">소스 선택</label>
  <select id="src"></select>
  <label for="manual">또는 소스 id 직접 입력</label>
  <input id="manual" placeholder="예: bunyang-capsule" autocomplete="off">
  <div class="row">
    <button id="go">해시체인 재검증</button>
    <span class="hint" id="hint">원장(changes.jsonl)과 체인 상태(integrity.json)를 jsDelivr로 받아 재계산합니다.</span>
  </div>
  <div class="result" id="out">준비됨.</div>
</div>

<p class="how">검증 알고리즘(엔진과 동일): <code>content_hash = SHA256(canonicalJson(본문 6필드))</code> ·
<code>chain_hash = SHA256(prev + content_hash)</code> · <code>genesis = SHA256("chronicle:&lt;id&gt;:genesis")</code>.
외부 앵커(RFC 3161)는 <code>openssl ts -verify</code>로 별도 검증됩니다 — 리포 소유자도 위조할 수 없는 층.</p>

<footer>
  <a href="./index.html">현황판</a>
  <a href="./feed.xml">통합 피드</a>
  <a href="./digest.html">다이제스트</a>
  <a href="https://github.com/${safeRepo}">GitHub</a>
</footer>
</main>
<script>
${clientScript(safeRepo)}
</script>
</body>
</html>
`;
}
