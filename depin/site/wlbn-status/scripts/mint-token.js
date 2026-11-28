'use strict';
// 상품판 이용권 만들기(운영자가 결제를 확인한 뒤 구독자에게 건넨다).
//   WATCH_SECRET=<서명 열쇠> node scripts/mint-token.js <lite|std|pro> <일수> [메모]
//   예) 스탠더드 한 달:  WATCH_SECRET=... node scripts/mint-token.js std 31 "11월 가입"
//       프로 일 년:      WATCH_SECRET=... node scripts/mint-token.js pro 366
// 서명 열쇠는 환경변수로만 준다 — 파일 · 저장소 · 화면에 적지 않는다. 서버의 WATCH_SECRET 과 같아야 한다.
const edition = require('../lib/edition');
const [plan, days, note] = process.argv.slice(2), secret = process.env.WATCH_SECRET || '';
if (!secret || secret.length < 24) { console.error('WATCH_SECRET 이 없거나 너무 짧다(24자 이상의 무작위 글)'); process.exit(2); }
if (!plan || plan === 'free' || edition.RANK[plan] === undefined || !(Number(days) > 0)) { console.error('사용: node scripts/mint-token.js <lite|std|pro> <일수> [메모]'); process.exit(2); }
const exp = Math.floor(Date.now() / 1000) + Math.round(Number(days) * 86400);
const payload = { p: plan, x: exp }; if (note) payload.n = String(note).slice(0, 40);
console.log(edition.sign(payload, secret));
console.error('요금제 ' + plan + ' · 끝나는 날 ' + new Date(exp * 1000).toISOString().slice(0, 10) + (note ? ' · ' + note : ''));
