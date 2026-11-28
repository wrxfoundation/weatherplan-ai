'use strict';
// 내부판 관리자 모드(44차): 비밀번호로 연 사람만 자료(/api/data · /api/snapshot)를 받는다. 상품판(EDITION=watch)에서는 꺼져 있다.
//   비밀번호는 저장소에 두지 않는다. 고르는 순서:
//     ① 환경변수 ADMIN_PASSWORD — 있으면 이것만 쓴다(Vercel 설정에서 바꾸면 바로 바뀐다)
//     ② 배포 묶음에만 든 lib/admin-pass.json — { salt, hash }(scrypt). scripts/build-internal.js 가 만들 때 넣는다
//     ③ 둘 다 없으면 아무도 열 수 없다(닫힌 채로 둔다 — 열린 채로 두지 않는다)
//   열쇠: 비밀번호를 맞히면 서버가 서명한 열쇠(HOURS 시간 유효)를 준다. 화면은 이 기기에 두고 Authorization: Bearer 로 보낸다.
//   서명 재료가 비밀번호에서 나오므로 비밀번호를 바꾸면 옛 열쇠는 모두 무효가 된다.
const crypto = require('crypto');
const edition = require('./edition');
let FILE = null;
try { FILE = require('./admin-pass.json'); } catch (e) { FILE = null; }
const HOURS = 24;
const ON = !edition.ON;
const envPw = () => String(process.env.ADMIN_PASSWORD || '');
const hasFile = () => !!(FILE && /^[0-9a-f]{32,}$/.test(String(FILE.salt || '')) && /^[0-9a-f]{64}$/.test(String(FILE.hash || '')));
const set = () => !!envPw() || hasFile();
const material = () => (envPw() ? 'env:' + envPw() : hasFile() ? 'file:' + FILE.salt + ':' + FILE.hash : '');
const signKey = () => crypto.createHash('sha256').update('wlbn-admin-key|' + material()).digest();
const b64 = (b) => Buffer.from(b).toString('base64url');
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();

function check(pw) {
  pw = String(pw || '');
  if (!pw || pw.length > 200) return false;
  if (envPw()) return crypto.timingSafeEqual(sha(pw), sha(envPw()));
  if (hasFile()) { const h = crypto.scryptSync(pw, Buffer.from(FILE.salt, 'hex'), 32), t = Buffer.from(FILE.hash, 'hex'); return h.length === t.length && crypto.timingSafeEqual(h, t); }
  return false;
}
function mint(now) {
  if (!set()) return null;
  const exp = Math.floor((now || Date.now()) / 1000) + HOURS * 3600, p = b64(JSON.stringify({ a: 1, x: exp }));
  return { key: p + '.' + b64(crypto.createHmac('sha256', signKey()).update(p).digest()), exp };
}
function verifyKey(k, now) {
  if (!set() || typeof k !== 'string' || k.length > 400) return false;
  const i = k.indexOf('.'); if (i < 1) return false;
  const p = k.slice(0, i), sig = Buffer.from(k.slice(i + 1), 'base64url'), want = crypto.createHmac('sha256', signKey()).update(p).digest();
  if (sig.length !== want.length || !crypto.timingSafeEqual(sig, want)) return false;
  let o; try { o = JSON.parse(Buffer.from(p, 'base64url').toString('utf8')); } catch (e) { return false; }
  return !!o && o.a === 1 && typeof o.x === 'number' && o.x > Math.floor((now || Date.now()) / 1000);
}
function verify(req) { const m = /^Bearer\s+(\S+)$/.exec(String((req && req.headers && req.headers.authorization) || '')); return !!m && verifyKey(m[1]); }
// 만들 때 쓴다(scripts/build-internal.js): 비밀번호 → { salt, hash }
function hashFile(pw) { const salt = crypto.randomBytes(16); return { salt: salt.toString('hex'), hash: crypto.scryptSync(String(pw), salt, 32).toString('hex') }; }

module.exports = { ON, HOURS, set, check, mint, verifyKey, verify, hashFile, need: (req) => ON && !verify(req) };
