// src/template.html + sim.js + coast.json + mask.json → ../index.html (저장소·정적 호스팅용 완결 문서)
// node build.js --artifact <out.html> 을 주면 claude.ai 아티팩트용(제목 먼저, html/head/body 없음)도 함께 쓴다.
const fs = require('fs'); const path = require('path');
const here = f => path.join(__dirname, f);
const t = fs.readFileSync(here('template.html'), 'utf8');
const sim = fs.readFileSync(here('sim.js'), 'utf8');
const coast = fs.readFileSync(here('coast.json'), 'utf8').trim();
const mask = fs.readFileSync(here('mask.json'), 'utf8').trim();
const art = t.replace('/*@SIM@*/', () => sim).replace('/*@COAST@*/', () => coast).replace('/*@MASK@*/', () => mask);
if (/\/\*@(SIM|COAST|MASK)@\*\//.test(art)) throw new Error('placeholder left');
const cut = art.indexOf('</style>') + '</style>'.length;
const doc = '<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n<meta name="robots" content="noindex">\n' + art.slice(0, cut) + '\n</head>\n<body>\n' + art.slice(cut).trim() + '\n</body>\n</html>\n';
fs.writeFileSync(here('../index.html'), doc);
const i = process.argv.indexOf('--artifact'); if (i > 0 && process.argv[i + 1]) fs.writeFileSync(process.argv[i + 1], art);
console.log('index.html', Buffer.byteLength(doc), 'bytes');
