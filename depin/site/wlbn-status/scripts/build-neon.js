'use strict';
// 네온 모드 묶기(52차): neon-src/neon.js + three.js(MIT) → public/neon/neon.js 한 파일(ES 모듈 · 압축)
//   배포에는 묶은 파일만 들어간다(Vercel 에서 따로 만들 일 없음). 고친 뒤에만 다시 묶는다:
//     npm i --no-save three@0.187.0 esbuild@0.25.0 --prefix <작업 폴더>
//     NEON_NODE_MODULES=<작업 폴더>/node_modules node scripts/build-neon.js
const path = require('path'), fs = require('fs');
const NM = process.env.NEON_NODE_MODULES;
if (!NM || !fs.existsSync(path.join(NM, 'three')) || !fs.existsSync(path.join(NM, 'esbuild'))) { console.error('NEON_NODE_MODULES 에 three · esbuild 가 든 node_modules 폴더를 주세요'); process.exit(2); }
const esbuild = require(path.join(NM, 'esbuild'));
const ver = require(path.join(NM, 'three/package.json')).version;
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'public/neon/neon.js');
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const banner = '/* WLBN 네온 모드 — 원본 neon-src/neon.js · scripts/build-neon.js 로 묶음\n * three.js r' + ver.split('.')[1] + ' (' + ver + ') — MIT License, Copyright © 2010-2025 three.js authors — https://github.com/mrdoob/three.js/blob/dev/LICENSE */';
const r = esbuild.buildSync({ entryPoints: [path.join(ROOT, 'neon-src/neon.js')], bundle: true, format: 'esm', minify: true, target: ['es2020'], outfile: OUT, nodePaths: [NM], legalComments: 'none', banner: { js: banner }, metafile: true, logLevel: 'warning' });
const kb = Math.round(fs.statSync(OUT).size / 1024);
console.log(JSON.stringify({ out: path.relative(ROOT, OUT), kb, three: ver, inputs: Object.keys(r.metafile.inputs).length }));
