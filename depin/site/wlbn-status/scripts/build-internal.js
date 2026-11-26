'use strict';
// 내부판(관리자 모드) 배포 묶음 만들기 — 44차
//   ADMIN_PASSWORD='…' node scripts/build-internal.js <만들 폴더>
// 하는 일
//   · public · api · lib · scripts · vercel.json · package.json · README.md 를 옮긴다
//   · public/snapshot.json 을 lib/snapshot-view.json 으로 옮긴다 — public 은 누구나 받을 수 있으므로, 미리 넣어 둔 자료도 관리자 열쇠로만(/api/snapshot) 준다
//   · 실행할 때 준 ADMIN_PASSWORD 로 lib/admin-pass.json({ salt, hash } — scrypt)을 만든다. 비밀번호 글자는 어디에도 적지 않는다
//     (주지 않으면 만들지 않는다 — 그때는 Vercel 환경변수 ADMIN_PASSWORD 를 꼭 넣어야 열린다)
//   · 묶음에 든 이 두 파일은 저장소에 넣지 않는다(.gitignore)
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), OUT = process.argv[2];
if (!OUT) { console.error('사용: ADMIN_PASSWORD=… node scripts/build-internal.js <만들 폴더>'); process.exit(2); }
if (fs.existsSync(OUT) && fs.readdirSync(OUT).length) { console.error('비어 있지 않은 폴더다: ' + OUT + ' — 빈 폴더를 주세요'); process.exit(2); }
if (process.env.EDITION) { console.error('EDITION 을 비우고 실행하세요(내부판 묶음이다)'); process.exit(2); }
const copy = (rel) => fs.cpSync(path.join(ROOT, rel), path.join(OUT, rel), { recursive: true });
fs.mkdirSync(OUT, { recursive: true });
['public', 'api', 'lib', 'scripts', 'vercel.json', 'package.json', 'README.md'].forEach(copy);
['lib/admin-pass.json', 'lib/snapshot-view.json', 'lib/edition-on.json'].forEach((rel) => { const p = path.join(OUT, rel); if (fs.existsSync(p)) fs.rmSync(p); });
const snap = path.join(OUT, 'public/snapshot.json');
if (fs.existsSync(snap)) fs.renameSync(snap, path.join(OUT, 'lib/snapshot-view.json'));
const pw = String(process.env.ADMIN_PASSWORD || '');
if (pw) { const admin = require('../lib/admin'); fs.writeFileSync(path.join(OUT, 'lib/admin-pass.json'), JSON.stringify(admin.hashFile(pw)) + '\n'); }
const vm = require('vm'); new vm.Script(fs.readFileSync(path.join(OUT, 'public/index.html'), 'utf8').split('<script>').pop().split('</script>')[0]);
console.log(JSON.stringify({ out: OUT, public_snapshot: fs.existsSync(snap), snapshot_view: fs.existsSync(path.join(OUT, 'lib/snapshot-view.json')), admin_pass_file: fs.existsSync(path.join(OUT, 'lib/admin-pass.json')) }));
