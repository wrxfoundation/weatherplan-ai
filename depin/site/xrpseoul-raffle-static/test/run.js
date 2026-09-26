// XRP SEOUL 래플 정적 사이트 — playwright 검증 (목 RPC · 시계 오버라이드)
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = ['www', 'build'].map((d) => path.resolve(__dirname, '..', d)).find((d) => fs.existsSync(d));  // 저장소는 www/(build/ 는 .gitignore), zip 은 build/
const OUT = path.resolve(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const ADDR = 'rhTTtx8YyKzcmPDsoroYXuHdGMThrnweb1';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.md': 'text/plain' };

function serve() {
  return new Promise((res) => {
    const srv = http.createServer((req, r) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      let f = path.join(ROOT, p);
      if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
      if (!f.startsWith(ROOT) || !fs.existsSync(f)) { r.writeHead(404); r.end('nf'); return; }
      r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(fs.readFileSync(f));
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}

// 브라우저 안에 심는 목: window.__mockTxs 배열을 account_tx / tx 응답으로 변환 (200건 페이징 + ledger_index_min 지원)
const MOCK = `
window.__mockTxs = window.__mockTxs || [];
window.__mkTx = function (o) {           // {account, tag, drops, dateMs, ledger, idx, hash, v2, result, dest}
  var rippleSecs = Math.floor(o.dateMs / 1000) - 946684800;
  var tx = { TransactionType: o.type || 'Payment', Account: o.account, Destination: o.dest || '${ADDR}', Amount: String(o.drops), date: rippleSecs, ledger_index: o.ledger, hash: o.hash, Fee: '12', Sequence: 1 };
  if (o.tag != null) tx.DestinationTag = o.tag;
  var meta = { TransactionResult: o.result || 'tesSUCCESS', TransactionIndex: o.idx || 0, delivered_amount: o.iou ? { currency: 'RLUSD', issuer: 'rX', value: '5' } : String(o.drops) };
  if (o.v2) { delete tx.hash; delete tx.ledger_index; return { tx_json: tx, meta: meta, hash: o.hash, ledger_index: o.ledger, close_time_iso: new Date(o.dateMs).toISOString().replace(/\\.\\d{3}Z$/, 'Z'), validated: true }; }
  return { tx: tx, meta: meta, validated: true };
};
window.__RAFFLE_MOCK = function (method, params) {
  window.__rpcLog = window.__rpcLog || []; window.__rpcLog.push([method, JSON.parse(JSON.stringify(params))]);
  if (method === 'account_tx') {
    var min = params.ledger_index_min, all = window.__mockTxs.slice().sort(function (a, b) { return (b.ledger - a.ledger) || (b.idx - a.idx); });
    if (min > 0) all = all.filter(function (t) { return t.ledger >= min; });
    var start = params.marker ? params.marker.i : 0, page = all.slice(start, start + 200);
    var res = { account: params.account, ledger_index_min: min, ledger_index_max: 999999, validated: true, transactions: page.map(window.__mkTx) };
    if (start + 200 < all.length) res.marker = { i: start + 200 };
    return res;
  }
  if (method === 'tx') {
    var h = params.transaction, t = window.__mockTxs.filter(function (x) { return x.hash === h; })[0];
    if (!t) return { status: 'error', error: 'txnNotFound' };
    var r = window.__mkTx(t); if (r.tx) { var o = r.tx; o.meta = r.meta; o.validated = true; o.hash = t.hash; return o; } return r;
  }
  return { status: 'error', error: 'unknownCmd' };
};`;

function hashOf(i) { return (i.toString(16).toUpperCase().padStart(4, '0') + 'A').padEnd(64, 'F'); }
function payments(n, opts) {           // n개의 서로 다른 계정이 오픈 후 순서대로 5 XRP 입금
  const base = Date.parse('2026-09-22T09:00:30Z'), out = [];
  for (let i = 0; i < n; i++) out.push({ account: 'rPayer' + String(i).padStart(4, '0') + 'xxxxxxxxxxxxxxxxxxxxx', tag: 1000000000 + i * 7 + 1, drops: 5000000, dateMs: base + i * 60000, ledger: 90000000 + i * 15, idx: 3, hash: hashOf(i), v2: i % 3 === 0, ...(opts || {}) });
  return out;
}

async function main() {
  const srv = await serve();
  const port = srv.address().port, base = `http://127.0.0.1:${port}/index.html`;
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (cond, msg) => { console.log((cond ? '  ok  ' : '  FAIL') + ' ' + msg); if (!cond) fails.push(msg); };

  async function open(url, { txs = [], mobile = false, ls = null, nomock = false, ses = null, gmock = null } = {}) {
    const ctx = await b.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 }, deviceScaleFactor: mobile ? 2 : 1, locale: 'ko-KR' });
    if (!nomock) await ctx.addInitScript(MOCK + `\nwindow.__mockTxs = ${JSON.stringify(txs)};` + (ls ? `\ntry{localStorage.setItem('xrpseoul_raffle_v1', ${JSON.stringify(JSON.stringify(ls))});}catch(e){}` : ''));
    if (ses) await ctx.addInitScript(`try{localStorage.setItem('xrpseoul_session_v1', ${JSON.stringify(JSON.stringify(ses))});}catch(e){}`);
    if (gmock) await ctx.addInitScript(`window.__RAFFLE_GOOGLE_MOCK = function (cb) { cb({ email: ${JSON.stringify(gmock)} }); };`);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => fails.push('pageerror: ' + e.message));
    page.on('response', (r) => { if (r.status() === 404) console.log('  404:', r.url()); });
    page.on('console', (m) => { if (m.type() === 'error' && !/qrcode|pretendard|ERR_/.test(m.text())) console.log('  console.error:', m.text()); });
    await page.goto(url, { waitUntil: 'load' });
    const noAnim = async () => { try { await page.addStyleTag({ content: '.rv{opacity:1!important;transform:none!important}' }); } catch (e) { } };  // /test/ 는 로더가 곧바로 리다이렉트·재작성하므로 실패해도 무시
    await noAnim();
    return { ctx, page, noAnim };
  }
  const cta = (page) => page.locator('.hero .js-cta');

  // ── 1. 오픈 전 (9.21 23:00 KST): 버튼 비활성 + D-day 카운트다운 ──
  console.log('[1] BEFORE');
  {
    const { ctx, page } = await open(base + '?now=2026-09-21T14:00:00Z');
    await page.waitForTimeout(1300);
    check(await cta(page).isDisabled(), 'hero CTA disabled');
    const t = await cta(page).textContent(); check(/9\.22\(화\) 18:00 응모 시작/.test(t), 'CTA label = ' + t);
    const cd = await page.locator('.js-cd').textContent(); check(/^시작까지 D-1 · 18:59:5\d$/.test(cd), 'countdown = ' + cd);
    check((await page.locator('.js-count').textContent()) === '0', 'count 0');
    check((await page.locator('.js-when').textContent()) === '9.22(화) 18:00 시작', 'when chip');
    check(await page.locator('.cta-band .js-cta').isDisabled(), 'band CTA disabled');
    await page.screenshot({ path: OUT + '/1-before-desk.png', clip: { x: 0, y: 0, width: 1280, height: 760 } });
    await ctx.close();
    const m = await open(base + '?now=2026-09-21T14:00:00Z', { mobile: true });
    await m.page.waitForTimeout(800);
    await m.page.screenshot({ path: OUT + '/1-before-mob.png', fullPage: false });
    await m.ctx.close();
  }

  // ── 2. 오픈 중, 17명 참여 + 잡음 거래 → 카운트 17, 결제 흐름 → No. 018 ──
  console.log('[2] OPEN + checkout');
  {
    const noise = [
      { account: 'rEarlyBird111111111111111111111111', tag: 1000000099, drops: 5000000, dateMs: Date.parse('2026-09-22T08:00:00Z'), ledger: 89999000, idx: 1, hash: hashOf(900) },   // 오픈 전
      { account: 'rNoTag22222222222222222222222222222', tag: null, drops: 5000000, dateMs: Date.parse('2026-09-22T09:05:00Z'), ledger: 90000005, idx: 1, hash: hashOf(901) },        // 태그 없음
      { account: 'rSmall3333333333333333333333333333', tag: 1000000098, drops: 4000000, dateMs: Date.parse('2026-09-22T09:06:00Z'), ledger: 90000006, idx: 1, hash: hashOf(902) },   // 4 XRP
      { account: ADDR, tag: 1000000097, drops: 5000000, dateMs: Date.parse('2026-09-22T09:07:00Z'), ledger: 90000007, idx: 1, hash: hashOf(903), dest: 'rSomeoneElse' },              // 핫월렛 송신
      { account: 'rFailed444444444444444444444444444', tag: 1000000096, drops: 5000000, dateMs: Date.parse('2026-09-22T09:08:00Z'), ledger: 90000008, idx: 1, hash: hashOf(904), result: 'tecUNFUNDED_PAYMENT' },
      { account: 'rPayer0003xxxxxxxxxxxxxxxxxxxxx', tag: 1000000095, drops: 5000000, dateMs: Date.parse('2026-09-22T09:40:00Z'), ledger: 90000900, idx: 1, hash: hashOf(905) },    // 중복 계정(2번째 결제)
      { account: 'rIou5555555555555555555555555555555', tag: 1000000094, drops: 0, dateMs: Date.parse('2026-09-22T09:09:00Z'), ledger: 90000009, idx: 1, hash: hashOf(906), iou: true },
    ];
    const txs = payments(17).concat(noise);
    const { ctx, page } = await open(base + '?now=2026-09-22T10:00:00Z&poll=700', { txs });
    await page.waitForFunction(() => document.querySelector('.js-count').textContent === '17', null, { timeout: 8000 }).catch(() => {});
    check((await page.locator('.js-count').textContent()) === '17', 'count 17 (noise excluded)');
    check(!(await cta(page).isDisabled()), 'CTA enabled');
    check((await cta(page).textContent()) === '5 XRP 로 참여하기', 'CTA label');
    check(/남은 자리 483명/.test(await page.locator('.js-count-sub').textContent()), 'remaining 483');
    check(/남은 자리 483명 · 9\.27\(일\) 18:00 마감/.test(await page.locator('.js-cd').textContent()), 'hero cd open');
    await page.screenshot({ path: OUT + '/2-open-desk.png', clip: { x: 0, y: 0, width: 1280, height: 760 } });

    check((await page.locator('.js-login').textContent()) === '로그인', 'nav pill 로그인 when signed out');
    await cta(page).click();
    await page.waitForSelector('#lg:not([hidden])');
    await page.waitForTimeout(400);
    check(await page.locator('#ov').isHidden(), 'checkout NOT opened before login');
    const lgTxt = await page.locator('#lg').textContent();
    check(/로그인 또는 회원가입/.test(lgTxt) && /Google로 계속하기/.test(lgTxt) && /또는 이메일로/.test(lgTxt) && /아이디·비밀번호 지갑으로 로그인 \(고급\)/.test(lgTxt) && /D'CENT 앱으로 열기/.test(lgTxt) && /Girin Wallet으로 연결/.test(lgTxt) && /Xaman으로 연결/.test(lgTxt), 'login modal mirrors canonical options');
    await page.screenshot({ path: OUT + '/2b-login-modal.png' });
    await page.click('#lg .lg-opt[data-kind="xaman"]');
    await page.waitForSelector('#ov:not([hidden])');
    await page.waitForTimeout(400);
    check(await page.locator('#lg').isHidden(), 'login modal closed after wallet login');
    check((await page.locator('.js-login').textContent()) === 'Xaman 연결됨', 'nav pill shows wallet session');
    check(await page.locator('#mbody .js-m-soldwarn').isHidden(), 'soldout warning hidden in step1');
    check(/남은 자리/.test(await page.locator('#mbody').textContent()) && /483명/.test(await page.locator('.js-m-remain').textContent()), 'step1 shows remaining');
    await page.screenshot({ path: OUT + '/3-step1.png' });
    await page.click('#m-next');
    await page.waitForSelector('#m-email');
    check(/Xaman 로그인은 이메일이 없어 여기서 받습니다/.test(await page.locator('#mbody').textContent()), 'external wallet → email asked with reason');
    await page.click('#m-next');                                   // 이메일 없이 → 오류
    check(/이메일 형식/.test(await page.locator('#mbody .alert').textContent()), 'email validation');
    await page.fill('#m-email', 'seowoo@example.com');
    await page.click('#m-next');
    check(/두 항목 모두/.test(await page.locator('#mbody .alert').textContent()), 'terms validation');
    await page.click('.term[data-t="0"]'); await page.click('.term[data-t="1"]');
    await page.screenshot({ path: OUT + '/4-step2.png' });
    await page.click('#m-next');
    await page.waitForSelector('#m-qr img');
    const my = JSON.parse(await page.evaluate(() => localStorage.getItem('xrpseoul_raffle_v1')));
    check(my && my.state === 'PAYING' && my.tag >= 1000000000 && my.tag <= 1999999999 && my.email === 'seowoo@example.com', 'PAYING saved, tag ' + (my && my.tag));
    const payTxt = await page.locator('#mbody').textContent();
    check(payTxt.includes(ADDR) && payTxt.includes(String(my.tag)), 'address + tag shown');
    const href = await page.locator('.xaman').getAttribute('href');
    check(href === `https://xumm.app/detect/request:${ADDR}?amount=5&dt=${my.tag}`, 'xaman link ' + href);
    check(await page.locator('#mbody .js-m-soldwarn').isHidden() && await page.locator('#mbody .js-m-low').isHidden(), 'step3 warnings hidden at 483 remaining');
    await page.screenshot({ path: OUT + '/5-step3-pay.png' });
    await page.waitForTimeout(1200);
    check(!/원장 조회에 실패/.test(await page.locator('#mbody').textContent()), 'no rpc error while polling');

    // 내 태그로 입금 발생 → 자동 확인 → No. 018
    await page.evaluate(({ tag, h }) => { window.__mockTxs.push({ account: 'rMeMeMeMeMeMeMeMeMeMeMeMeMeMeMeMe', tag, drops: 5000000, dateMs: Date.parse('2026-09-22T10:00:10Z'), ledger: 90001000, idx: 2, hash: h }); }, { tag: my.tag, h: hashOf(777) });
    await page.waitForFunction(() => /응모가 확정되었습니다/.test(document.querySelector('#mbody').textContent), null, { timeout: 8000 }).catch(() => {});
    const done = await page.locator('#mbody').textContent();
    check(/No\. 018/.test(done), 'raffle number No. 018');
    check(/등록 메일 보내기/.test(done), 'mailto fallback shown (no Google Form)');
    const mail = await page.locator('#mbody a.btn-main').getAttribute('href');
    check(/^mailto:support@wellbianlabs\.io\?subject=/.test(mail) && decodeURIComponent(mail).includes('No. 018') && decodeURIComponent(mail).includes(hashOf(777)), 'mailto prefilled');
    await page.screenshot({ path: OUT + '/6-step4-done.png' });
    await page.click('#m-close');
    await page.waitForTimeout(300);
    check((await cta(page).textContent()) === '내 응모 확인 · No. 018', 'CTA after paid');
    check(await cta(page).evaluate((b) => b.classList.contains('done')), 'CTA green');
    check((await page.locator('.js-count').textContent()) === '18', 'count 18 after my payment');
    const saved = JSON.parse(await page.evaluate(() => localStorage.getItem('xrpseoul_raffle_v1')));
    check(saved.state === 'PAID' && saved.no === 18 && saved.hash === hashOf(777) && saved.account.startsWith('rMeMe'), 'PAID persisted');
    await ctx.close();
  }

  // ── 2c. Google 로그인(가짜 훅) → 이메일 자동 · 「다른 이메일로 받기」 · 로그아웃 ──
  console.log('[2c] Google login → email known');
  {
    const { ctx, page } = await open(base + '?now=2026-09-22T10:00:00Z&poll=700', { txs: payments(17), gmock: 'hong@gmail.com' });
    await page.waitForFunction(() => document.querySelector('.js-count').textContent === '17', null, { timeout: 8000 }).catch(() => {});
    await cta(page).click();
    await page.waitForSelector('#lg:not([hidden])');
    await page.click('#lg-google');
    await page.waitForSelector('#ov:not([hidden])');
    await page.waitForTimeout(400);
    check((await page.locator('.js-login').textContent()) === 'hong@gmail.com', 'nav pill shows google email');
    const pb = await page.locator('.js-login').boundingBox();
    check(pb && pb.x + pb.width <= 1280 && pb.width >= 60, 'nav pill stays inside the viewport (' + Math.round(pb.x + pb.width) + 'px)');
    await page.click('#m-next');
    await page.waitForTimeout(200);
    const s2 = await page.locator('#mbody').textContent();
    check((await page.locator('#m-email').count()) === 0 && /hong@gmail\.com/.test(s2) && /Google 계정으로 로그인해 이메일이 채워졌습니다/.test(s2), 'google → email shown read-only, no input');
    check(/^동의해 주세요/.test((await page.locator('#mbody h3').textContent()).trim()), 'step2 title = 동의해 주세요');
    await page.screenshot({ path: OUT + '/2c-google-step2.png' });
    await page.click('#m-email-edit');
    await page.waitForSelector('#m-email');
    check((await page.inputValue('#m-email')) === 'hong@gmail.com', 'edit reveals input prefilled');
    await page.fill('#m-email', 'other@example.com');
    await page.click('.term[data-t="0"]'); await page.click('.term[data-t="1"]'); await page.click('#m-next');
    await page.waitForSelector('#m-qr img');
    const my = JSON.parse(await page.evaluate(() => localStorage.getItem('xrpseoul_raffle_v1')));
    check(my.state === 'PAYING' && my.email === 'other@example.com', 'overridden email saved');
    await page.click('#mcx'); await page.waitForTimeout(200);
    page.once('dialog', (d) => d.accept());
    await page.click('.js-login'); await page.waitForTimeout(300);
    check((await page.locator('.js-login').textContent()) === '로그인', 'logout via nav pill');
    await cta(page).click();
    await page.waitForSelector('#lg:not([hidden])');
    check(await page.locator('#ov').isHidden(), 'after logout the login modal comes first again');
    await page.fill('#lg-email', 'me@naver.com'); await page.click('#lg-next');
    await page.waitForSelector('#ov:not([hidden])');
    await page.waitForTimeout(300);
    check((await page.locator('.js-login').textContent()) === 'me@naver.com' && /1746|결제|보내 주세요|Destination Tag/.test(await page.locator('#mbody').textContent()), 'email login → resumes PAYING at step 3');
    await ctx.close();
    // Google 미설정 배포본: 훅도 clientId 도 없으면 이메일 안내
    const u = await open(base + '?now=2026-09-22T10:00:00Z&poll=700', { txs: payments(3) });
    await cta(u.page).click(); await u.page.waitForSelector('#lg:not([hidden])'); await u.page.click('#lg-google'); await u.page.waitForTimeout(200);
    check(/Google 로그인이 아직 연결되어 있지 않습니다/.test(await u.page.locator('#lg').textContent()), 'google unset → guided to email');
    await u.ctx.close();
  }

  // ── 3. 해시 직접 입력 경로 + 재방문(PAYING 복원) ──
  console.log('[3] hash path + resume');
  {
    const txs = payments(17);
    const myTag = 1234567890;
    const { ctx, page } = await open(base + '?now=2026-09-22T10:00:00Z&poll=700', { txs, ls: { state: 'PAYING', tag: myTag, email: 'a@b.co', at: 1 }, ses: { kind: 'xaman', email: '', at: 1 } });
    await page.waitForTimeout(1200);
    check((await cta(page).textContent()) === '결제 이어서 하기', 'resume label');
    await cta(page).click();
    await page.waitForSelector('#m-qr img');
    check(/1234567890/.test(await page.locator('#mbody').textContent()), 'resumed at step3 with my tag');
    await page.click('#mbody summary');
    await page.fill('#m-hash', 'zz'); await page.click('#m-hash-go');
    check(/64자리/.test(await page.locator('#mbody').textContent()), 'hash format check');
    await page.fill('#m-hash', hashOf(555)); await page.click('#m-hash-go');
    await page.waitForTimeout(500);
    check(/아직 원장에 없는/.test(await page.locator('#mbody').textContent()), 'txnNotFound message');
    // 잘못된 거래: 4 XRP
    await page.evaluate((h) => { window.__mockTxs.push({ account: 'rHashGuy1111111111111111111111111', tag: 1234567890, drops: 4000000, dateMs: Date.parse('2026-09-22T10:01:00Z'), ledger: 90002000, idx: 1, hash: h }); }, hashOf(556));
    await page.fill('#m-hash', hashOf(556)); await page.click('#m-hash-go');
    await page.waitForTimeout(500);
    check(/입금액이 5 XRP 보다 적어\(4 XRP\)/.test(await page.locator('#mbody').textContent()), 'amount reason');
    // 올바른 거래(다른 태그지만 범위 안) → 그 태그로 인정
    await page.evaluate((h) => { window.__mockTxs.push({ account: 'rHashGuy2222222222222222222222222', tag: 1500000000, drops: 5000000, dateMs: Date.parse('2026-09-22T10:02:00Z'), ledger: 90002100, idx: 1, hash: h }); }, hashOf(557));
    // account_tx 폴링이 먼저 잡지 않도록 목에서 tx 로만 보이게: ledger_index_min 필터가 있어 신규는 폴링에도 잡힐 수 있음 → 어느 쪽이든 No. 018
    await page.fill('#m-hash', hashOf(557)); await page.click('#m-hash-go');
    await page.waitForFunction(() => /응모가 확정되었습니다/.test(document.querySelector('#mbody').textContent), null, { timeout: 8000 }).catch(() => {});
    const done = await page.locator('#mbody').textContent();
    check(/No\. 018/.test(done) && /1500000000/.test(done), 'hash path confirmed with adopted tag');
    await ctx.close();
  }

  // ── 4. 매진(500명) + 501번째 입금자(OVERFLOW) ──
  console.log('[4] SOLD_OUT + overflow');
  {
    const txs = payments(500);
    const lateTag = 1999999000;
    txs.push({ account: 'rLateLateLateLateLateLateLateLate', tag: lateTag, drops: 5000000, dateMs: Date.parse('2026-09-22T20:00:00Z'), ledger: 90100000, idx: 1, hash: hashOf(9001) });
    const { ctx, page } = await open(base + '?now=2026-09-23T00:00:00Z&poll=700', { txs });
    await page.waitForFunction(() => document.querySelector('.js-count').textContent === '500', null, { timeout: 8000 }).catch(() => {});
    check((await page.locator('.js-count').textContent()) === '500', 'count 500 (overflow not counted)');
    check(await cta(page).isDisabled() && (await cta(page).textContent()) === '선착순 500명 마감', 'CTA sold out');
    check((await page.locator('.js-when').textContent()) === '선착순 마감', 'chip sold out');
    check(/마감 · 500명 도달/.test(await page.locator('.js-count-sub').textContent()), 'stat sub sold out');
    check(await page.locator('.js-cd').isHidden(), 'hero cd hidden');
    const pages = await page.evaluate(() => window.__rpcLog.filter((x) => x[0] === 'account_tx').length);
    check(pages >= 3, 'paged account_tx (' + pages + ' calls)');
    await page.screenshot({ path: OUT + '/7-soldout-desk.png', clip: { x: 0, y: 0, width: 1280, height: 760 } });
    await ctx.close();
    const o = await open(base + '?now=2026-09-23T00:00:00Z&poll=700', { txs, ls: { state: 'PAYING', tag: lateTag, email: 'late@x.io', at: 1 }, ses: { kind: 'girin', email: '', at: 1 } });
    await o.page.waitForTimeout(1500);
    check((await cta(o.page).textContent()) === '결제 확인하기' && !(await cta(o.page).isDisabled()), 'late payer can check');
    await cta(o.page).click();
    await o.page.waitForFunction(() => /정원 초과/.test(document.querySelector('#mbody').textContent), null, { timeout: 8000 }).catch(() => {});
    await o.page.waitForTimeout(400);
    const ov = await o.page.locator('#mbody').textContent();
    check(/정원 초과 입금입니다/.test(ov) && /501번째/.test(ov), 'OVERFLOW screen 501');
    await o.page.screenshot({ path: OUT + '/8-overflow.png' });
    await o.ctx.close();
  }

  // ── 4b. 남은 자리 3 → 결제창 경고 표시 ──
  console.log('[4b] low remaining warning');
  {
    const { ctx, page } = await open(base + '?now=2026-09-23T00:00:00Z&poll=700', { txs: payments(497), ls: { state: 'PAYING', tag: 1888888888, email: 'l@x.io', at: 1 }, ses: { kind: 'xaman', email: '', at: 1 } });
    await page.waitForFunction(() => document.querySelector('.js-count').textContent === '497', null, { timeout: 8000 }).catch(() => {});
    await cta(page).click();
    await page.waitForSelector('#m-qr img');
    await page.waitForTimeout(500);
    check(await page.locator('#mbody .js-m-low').isVisible() && await page.locator('#mbody .js-m-soldwarn').isHidden(), 'low warning visible, soldout hidden');
    await page.screenshot({ path: OUT + '/8b-low-warning.png' });
    await ctx.close();
  }

  // ── 4c. 오픈 순간 자동 전환 (18:00 2초 전에 열어 둔 화면) ──
  console.log('[4c] BEFORE → OPEN transition');
  {
    const { ctx, page } = await open(base + '?now=2026-09-22T08:59:58.5Z&poll=700', { txs: payments(3) });
    await page.waitForTimeout(600);
    check(await cta(page).isDisabled() && /응모 시작/.test(await cta(page).textContent()), 'still disabled 1.5s before open');
    await page.waitForFunction(() => !document.querySelector('.hero .js-cta').disabled, null, { timeout: 8000 }).catch(() => {});
    check(!(await cta(page).isDisabled()) && (await cta(page).textContent()) === '5 XRP 로 참여하기', 'auto-enabled at open');
    check((await page.locator('.js-count').textContent()) === '3' && (await page.locator('.js-when').textContent()) === '응모 진행 중', 'count loaded at open');
    await ctx.close();
  }

  // ── 5. 마감 후 ──
  console.log('[5] CLOSED');
  {
    const { ctx, page } = await open(base + '?now=2026-09-28T00:00:00Z', { txs: payments(321) });
    await page.waitForFunction(() => document.querySelector('.js-count').textContent === '321', null, { timeout: 8000 }).catch(() => {});
    check(await cta(page).isDisabled() && (await cta(page).textContent()) === '응모가 마감되었습니다', 'CTA closed');
    check((await page.locator('.js-count').textContent()) === '321', 'final count shown');
    await ctx.close();
  }

  // ── 6. 모바일 결제 화면 캡처 ──
  console.log('[6] mobile checkout shot');
  {
    const { ctx, page } = await open(base + '?now=2026-09-22T10:00:00Z&poll=700', { txs: payments(17), mobile: true, ls: { state: 'PAYING', tag: 1777777777, email: 'm@x.io', at: 1 }, ses: { kind: 'dcent', email: '', at: 1 } });
    await page.waitForTimeout(1000);
    await cta(page).click();
    await page.waitForSelector('#m-qr img');
    await page.waitForTimeout(500);
    await page.screenshot({ path: OUT + '/9-step3-mob.png' });
    await page.evaluate(() => { document.querySelector('#mc').scrollTop = 520; });
    await page.waitForTimeout(200);
    await page.screenshot({ path: OUT + '/9b-step3-mob-scrolled.png' });
    await ctx.close();
  }

  // ── 7. /test/ 시뮬레이터 (본 페이지를 불러와 sim.js 를 끼움 · 제어판) ──
  console.log('[7] /test simulator');
  {
    const { ctx, page, noAnim } = await open(base.replace('index.html', 'test/') + '?now=2026-09-22T09:00:05Z', { nomock: true });
    await page.waitForSelector('#sim', { timeout: 10000 }); await noAnim();
    await page.waitForFunction(() => document.querySelector('.js-count') && document.querySelector('.js-count').textContent === '17', null, { timeout: 8000 }).catch(() => {});
    check(await page.locator('#sim').isVisible(), 'sim panel visible');
    check(/poll=3000/.test(page.url()) && /\/test\//.test(page.url()) && /now=/.test(page.url()), 'redirected to /test/?now=…&poll=3000 (' + page.url() + ')');
    check((await page.locator('.js-count').textContent()) === '17', 'default fake count 17');
    check(/support@wellbianlabs\.io/.test(await page.locator('.cta-band').textContent()), 'contact email support@ on page');
    check((await page.locator('img[src="/images/hero.webp"]').count()) === 1 && (await page.locator('script[src="/js/qrcode.js"]').count()) === 1, 'asset paths rewritten to root');
    check(/테스트\]/.test(await page.title()), 'title marked as test');
    const simNav = async (sel) => { await Promise.all([page.waitForNavigation(), page.click(sel)]); await page.waitForSelector('#sim', { timeout: 10000 }); };
    await simNav('#sim [data-now="2026-09-21T14:00:00Z"]');
    await page.waitForTimeout(1200);
    check(await cta(page).isDisabled() && /응모 시작/.test(await cta(page).textContent()), 'sim clock BEFORE → CTA disabled');
    check(/오픈 전/.test(await page.locator('#sim-clock').textContent()), 'panel shows 오픈 전');
    await simNav('#sim [data-now="2026-09-22T09:00:05Z"]');
    await simNav('#sim [data-paid="497"]');
    await simNav('#sim [data-ses="xaman"]');
    check(/Xaman 연결됨/.test(await page.locator('.js-login').textContent()) && /xaman/.test(await page.locator('#sim-my').textContent()), 'sim session preset xaman');
    await page.waitForFunction(() => document.querySelector('.js-count') && document.querySelector('.js-count').textContent === '497', null, { timeout: 8000 }).catch(() => {});
    check((await page.locator('.js-count').textContent()) === '497', 'sim paid 497');
    await cta(page).click(); await page.waitForSelector('#ov:not([hidden])'); await page.waitForTimeout(300);
    await page.click('#m-next'); await page.waitForSelector('#m-email');
    await page.fill('#m-email', 'sim@example.com'); await page.click('.term[data-t="0"]'); await page.click('.term[data-t="1"]'); await page.click('#m-next');
    await page.waitForSelector('#m-qr img');
    check(await page.locator('#mbody .js-m-low').isVisible(), 'low-remaining warning at 497');
    await page.click('#sim [data-x="mine"]');
    await page.waitForFunction(() => /응모가 확정되었습니다/.test(document.querySelector('#mbody').textContent), null, { timeout: 12000 }).catch(() => {});
    const done = await page.locator('#mbody').textContent();
    check(/No\. 498/.test(done), 'sim payment confirmed No. 498');
    const mail = await page.locator('#mbody a.btn-main').getAttribute('href');
    check(/^mailto:support@wellbianlabs\.io\?/.test(mail), 'mailto goes to support@');
    await page.waitForTimeout(1300);   // 제어판은 1초마다 갱신
    check(/확정 No\. 498/.test(await page.locator('#sim-my').textContent()), 'panel shows my confirmed entry');
    await page.click('#m-close'); await page.waitForTimeout(200);
    await simNav('#sim-reset');
    await simNav('#sim [data-now="2026-09-22T09:00:05Z"]');
    page.once('dialog', (d) => d.accept('seowoo@gmail.com'));
    await cta(page).click(); await page.waitForSelector('#lg:not([hidden])'); await page.click('#lg-google');
    await page.waitForSelector('#ov:not([hidden])'); await page.waitForTimeout(300);
    check((await page.locator('.js-login').textContent()) === 'seowoo@gmail.com', 'sim fake google prompt → session');
    await page.click('#m-next'); await page.waitForTimeout(200);
    check((await page.locator('#m-email').count()) === 0 && /seowoo@gmail\.com/.test(await page.locator('#mbody').textContent()), 'sim google → email not asked');
    await page.screenshot({ path: OUT + '/10-test-page.png' });
    await page.click('#mcx'); await page.waitForTimeout(300);   // ② 단계라 닫기(X)로
    await page.screenshot({ path: OUT + '/11-test-page-panel.png', clip: { x: 0, y: 0, width: 1280, height: 900 } });
    await simNav('#sim-reset');
    await page.waitForTimeout(800);
    check((await page.evaluate(() => localStorage.getItem('xrpseoul_raffle_v1'))) === null && !/now=/.test(page.url()), 'reset cleared my entry and clock');
    await ctx.close();
    const m = await open(base.replace('index.html', 'test/'), { nomock: true, mobile: true });
    await m.page.waitForSelector('#sim', { timeout: 10000 }); await m.page.waitForTimeout(1200);
    check(await m.page.locator('#sim').evaluate((e) => e.classList.contains('min')), 'panel starts collapsed on mobile');
    await m.page.screenshot({ path: OUT + '/12-test-page-mob.png' });
    await m.ctx.close();
  }

  await b.close(); srv.close();
  console.log(fails.length ? `\n${fails.length} FAILED:\n - ` + fails.join('\n - ') : '\nALL PASSED');
  process.exit(fails.length ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
