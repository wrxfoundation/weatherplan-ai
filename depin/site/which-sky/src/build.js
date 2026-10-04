// template.html + astro.js + game.js + land.json → index.html(완결 문서) · --artifact <파일>(제목 먼저)
const fs = require('fs'); const path = require('path'); const here = f => path.join(__dirname, f);
const t = fs.readFileSync(here('template.html'), 'utf8');
const game = fs.readFileSync(here('game.js'), 'utf8').replace('/*@LAND@*/', () => fs.readFileSync(here('land.json'), 'utf8').trim());
const art = t.replace('/*@ASTRO@*/', () => fs.readFileSync(here('astro.js'), 'utf8')).replace('/*@GAME@*/', () => game);
if (/\/\*@(ASTRO|GAME|LAND)@\*\//.test(art)) throw new Error('placeholder left');
const cut = art.indexOf('</style>') + '</style>'.length;
const doc = '<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n<meta name="robots" content="noindex">\n' + art.slice(0, cut) + '\n</head>\n<body>\n' + art.slice(cut).trim() + '\n</body>\n</html>\n';
const outIdx = process.argv.indexOf('--out'); fs.writeFileSync(outIdx > 0 ? process.argv[outIdx + 1] : here('../index.html'), doc);
const i = process.argv.indexOf('--artifact'); if (i > 0 && process.argv[i + 1]) fs.writeFileSync(process.argv[i + 1], art);
console.log('index.html', Buffer.byteLength(doc), 'bytes');
