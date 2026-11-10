// src/template.html + sim.js → ../index.html (저장소 · 정적 호스팅용 완결 문서). --artifact <파일> 로 아티팩트용(제목 먼저, html/head/body 없음)도 쓴다.
const fs = require('fs'); const path = require('path');
const here = f => path.join(__dirname, f);
const t = fs.readFileSync(here('template.html'), 'utf8');
const art = t.replace('/*@SIM@*/', () => fs.readFileSync(here('sim.js'), 'utf8'));
if (art.includes('/*@SIM@*/')) throw new Error('placeholder left');
const cut = art.indexOf('</style>') + '</style>'.length;
const doc = '<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n<meta name="robots" content="noindex">\n' + art.slice(0, cut) + '\n</head>\n<body>\n' + art.slice(cut).trim() + '\n</body>\n</html>\n';
fs.writeFileSync(here('../index.html'), doc);
const i = process.argv.indexOf('--artifact'); if (i > 0 && process.argv[i + 1]) fs.writeFileSync(process.argv[i + 1], art);
console.log('index.html', Buffer.byteLength(doc), 'bytes');
