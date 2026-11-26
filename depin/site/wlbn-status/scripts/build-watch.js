'use strict';
// 상품판(외부 구독 서비스) 묶음 만들기 — 운영자에게 넘길 폴더를 만든다.
//   node scripts/build-watch.js <만들 폴더>
// 하는 일
//   · public · api · lib · vercel.json · package.json · scripts/mint-token.js 를 옮긴다
//   · public/snapshot.json 을 **무료 요금제만큼만** 남긴 것으로 바꾼다(public 은 누구나 받을 수 있으므로 유료 구역의 자료를 두지 않는다)
//   · README-OPERATOR.md 를 README.md 로 넣는다(내부 README 는 넣지 않는다)
//   · 코드 주석에 남은 내부 메모의 이름을 지운다
//   · lib/edition-on.json 을 넣는다 — 이 묶음은 환경변수 EDITION 을 빠뜨려도 상품판으로 돈다
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), OUT = process.argv[2];
if (!OUT) { console.error('사용: node scripts/build-watch.js <만들 폴더>'); process.exit(2); }
if (fs.existsSync(OUT) && fs.readdirSync(OUT).length) { console.error('비어 있지 않은 폴더다: ' + OUT + ' — 빈 폴더를 주세요'); process.exit(2); }
process.env.EDITION = 'watch';
const core = require('../lib/core'), edition = require('../lib/edition');
const copy = (rel) => fs.cpSync(path.join(ROOT, rel), path.join(OUT, rel), { recursive: true });
fs.mkdirSync(OUT, { recursive: true });
['public', 'api', 'lib', 'vercel.json', 'package.json'].forEach(copy);
fs.mkdirSync(path.join(OUT, 'scripts'), { recursive: true });
['scripts/mint-token.js', 'scripts/refresh-snapshot.js'].forEach(copy);
fs.copyFileSync(path.join(ROOT, 'README-OPERATOR.md'), path.join(OUT, 'README.md'));
fs.writeFileSync(path.join(OUT, 'lib/edition-on.json'), JSON.stringify({ watch: true }) + '\n');      // 이 묶음은 늘 상품판
// 무료만큼만 남긴 미리 넣어 둘 자료
const S = JSON.parse(fs.readFileSync(path.join(ROOT, 'lib/snapshot-state.json'), 'utf8'));
const full = core.buildDatasets(JSON.parse(JSON.stringify(S)), { pub: true });      // pub = 밖으로 내는 판(안쪽 확인을 근거로 한 문구를 쓰지 않는다)
const free = edition.prune(full, 'free', { state: 'none' });
fs.writeFileSync(path.join(OUT, 'public/snapshot.json'), JSON.stringify(Object.assign({ ok: true, generated_at: null, ledger: S.ledger, info: { storage: 'snapshot' } }, free)));
// 주석의 내부 메모에서 이름을 지운다(실행되는 글에는 그 이름이 없다 — 아래에서 문법을 다시 확인한다)
const scrub = (rel) => { const p = path.join(OUT, rel), t = fs.readFileSync(p, 'utf8'), u = t.split('서우').join('요청자'); if (u !== t) fs.writeFileSync(p, u); return t.length - u.length; };
const files = ['public/index.html'].concat(fs.readdirSync(path.join(OUT, 'lib')).filter((f) => /\.js$/.test(f)).map((f) => 'lib/' + f), fs.readdirSync(path.join(OUT, 'api')).map((f) => 'api/' + f));
files.forEach(scrub);
const vm = require('vm'); new vm.Script(fs.readFileSync(path.join(OUT, 'public/index.html'), 'utf8').split('<script>').pop().split('</script>')[0]);
files.filter((f) => /\.js$/.test(f)).forEach((f) => new vm.Script(fs.readFileSync(path.join(OUT, f), 'utf8'), { filename: f }));
const pub = fs.readFileSync(path.join(OUT, 'public/snapshot.json'), 'utf8');
console.log(JSON.stringify({ out: OUT, snapshot_bytes: pub.length, as_of: free.summary[0].as_of, plan: free.edition.plan, locked: free.edition.locked.length, wallets: free.ranges.all.wallets.length, daily: free.daily.length, full_address: /r[1-9A-HJ-NP-Za-km-z]{24,34}/.test(pub), name_left: files.some((f) => fs.readFileSync(path.join(OUT, f), 'utf8').indexOf('서우') >= 0) }));
