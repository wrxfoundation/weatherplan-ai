/* ═══════════════════════════════════════════════════════════════════════
   테스트 모드 (/test/) — 가짜 XRPL 원장 + 제어판
   실제 XRP·실제 RPC 를 쓰지 않습니다. 본 페이지(index.html)의 스크립트가 원장을 읽을 때
   window.__RAFFLE_MOCK 이 대신 응답합니다. 상태는 이 브라우저(localStorage)에만 저장됩니다.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var KEY = 'xrpseoul_sim_v1', MY = 'xrpseoul_raffle_v1', SES = 'xrpseoul_session_v1';
  var Q = new URLSearchParams(location.search);
  var KST = 9 * 3600000, WD = ['일', '월', '화', '수', '목', '금', '토'];
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var pad3 = function (n) { n = String(n); while (n.length < 3) n = '0' + n; return n; };
  function cfg() { return window.RAFFLE_CONFIG || { address: '', priceXrp: 5, max: 500, openAt: '2026-09-22T09:00:00Z', closeAt: '2026-09-27T09:00:00Z', tagMin: 1000000000, tagMax: 1999999999 }; }
  var clockOffset = 0;
  if (Q.get('now')) { var _n = Date.parse(Q.get('now')); if (!isNaN(_n)) clockOffset = _n - Date.now(); }
  var now = function () { return Date.now() + clockOffset; };
  function fmtKST(ms) { var d = new Date(ms + KST); return (d.getUTCMonth() + 1) + '.' + d.getUTCDate() + '(' + WD[d.getUTCDay()] + ') ' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()); }

  /* ── 상태 ── */
  var state = null;
  try { state = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { }
  if (!state || typeof state !== 'object') state = { paid: 17, extra: [] };
  if (Q.get('paid') != null && !isNaN(+Q.get('paid'))) state.paid = Math.max(0, Math.min(2000, +Q.get('paid')));
  if (!Array.isArray(state.extra)) state.extra = [];
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { } }
  save();
  function myEntry() { try { return JSON.parse(localStorage.getItem(MY) || 'null'); } catch (e) { return null; } }
  function mySes() { try { return JSON.parse(localStorage.getItem(SES) || 'null'); } catch (e) { return null; } }
  /* 가짜 Google 로그인 — 실제 Google 창 대신 이메일만 묻는다 (본 페이지의 「Google로 계속하기」가 이 훅을 쓴다) */
  window.__RAFFLE_GOOGLE_MOCK = function (cb) { var e = prompt('테스트 모드: 가짜 Google 계정 이메일을 입력하세요 (실제 Google 창은 뜨지 않습니다)', 'hong@gmail.com'); if (e) cb({ email: e }); };
  function setSes(kind) {
    try {
      if (kind === 'none') localStorage.removeItem(SES);
      else localStorage.setItem(SES, JSON.stringify({ kind: kind, email: kind === 'google' ? 'hong@gmail.com' : kind === 'email' ? 'hong@naver.com' : '', at: Date.now() }));
    } catch (e) { }
    nav({});
  }

  /* ── 가짜 원장 ── */
  function hashOf(seed) {   // 시드 → 64자리 16진수 (글자당 2자리라 서로 다른 시드는 다른 해시)
    var h = '', str = String(seed); for (var i = 0; i < str.length; i++) h += str.charCodeAt(i).toString(16).padStart(2, '0');
    return (h + '0'.repeat(64)).slice(0, 64).toUpperCase();
  }
  function mk(o) {   // → account_tx 항목(v1 형식)
    var C = cfg();
    var tx = { TransactionType: 'Payment', Account: o.account, Destination: o.dest || C.address, Amount: String(o.drops), Fee: '12', Sequence: 1,
      date: Math.floor(o.dateMs / 1000) - 946684800, ledger_index: o.ledger, hash: o.hash };
    if (o.tag != null) tx.DestinationTag = o.tag;
    return { tx: tx, meta: { TransactionResult: 'tesSUCCESS', TransactionIndex: o.idx || 1, delivered_amount: String(o.drops) }, validated: true };
  }
  function ledger() {
    var C = cfg(), open = Date.parse(C.openAt), out = [];
    for (var i = 0; i < state.paid; i++)
      out.push({ account: 'rSimPayer' + pad3(i) + 'xxxxxxxxxxxxxxxxxxxxx', tag: C.tagMin + i * 7 + 1, drops: C.priceXrp * 1e6, dateMs: open + 30000 + i * 60000, ledger: 90000000 + i * 15, idx: 3, hash: hashOf('P' + i) });
    state.extra.forEach(function (e) { out.push(e); });
    return out;
  }
  window.__RAFFLE_MOCK = function (method, params) {
    var all = ledger().sort(function (a, b) { return (b.ledger - a.ledger) || (b.idx - a.idx); });
    if (method === 'account_tx') {
      var min = params.ledger_index_min;
      if (min > 0) all = all.filter(function (t) { return t.ledger >= min; });
      var start = params.marker ? params.marker.i : 0, page = all.slice(start, start + 200);
      var res = { account: params.account, validated: true, transactions: page.map(mk) };
      if (start + 200 < all.length) res.marker = { i: start + 200 };
      return res;
    }
    if (method === 'tx') {
      var t = all.filter(function (x) { return x.hash === params.transaction; })[0];
      if (!t) return { status: 'error', error: 'txnNotFound' };
      var r = mk(t), o = r.tx; o.meta = r.meta; o.validated = true; o.hash = t.hash; return o;
    }
    return { status: 'error', error: 'unknownCmd' };
  };

  /* ── 제어판 ── */
  function nav(patch) {   // ?now= 만 바꾸고 나머지(poll 등)는 유지
    var p = new URLSearchParams(location.search);
    Object.keys(patch).forEach(function (k) { if (patch[k] == null) p.delete(k); else p.set(k, patch[k]); });
    if (!p.get('poll')) p.set('poll', '3000');
    location.href = location.pathname + '?' + p.toString();
  }
  function addExtra(kind) {
    var C = cfg(), me = myEntry();
    if (kind !== 'other' && !(me && me.tag)) { alert('먼저 「5 XRP 로 참여하기」→ 이메일·동의 → 결제 단계까지 진행해 Destination Tag 를 받으세요.'); return; }
    var k = state.extra.length, seed = 'X' + k + '-' + Date.now();
    var e = { account: 'rSimMe' + String(k).padStart(3, '0') + Math.random().toString(36).slice(2, 8) + 'xxxxxxxxxxxxxxxx',
      tag: kind === 'notag' ? null : (kind === 'other' ? C.tagMin + 900000 + k : me.tag),
      drops: kind === 'short' ? (C.priceXrp - 1) * 1e6 : C.priceXrp * 1e6, dateMs: now(), ledger: 90100000 + k * 10, idx: 1, hash: hashOf(seed), kind: kind };
    state.extra.push(e); state.lastHash = e.hash; save();
    render();
  }
  function reset() {
    try { localStorage.removeItem(MY); localStorage.removeItem(KEY); localStorage.removeItem(SES); } catch (e) { }
    nav({ now: null });
  }
  function copy(t, btn) { var done = function () { var o = btn.textContent; btn.textContent = '복사됨'; setTimeout(function () { btn.textContent = o; }, 1000); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () { }); }

  var CSS = '#sim{position:fixed;right:12px;bottom:12px;z-index:3000;width:min(360px,calc(100vw - 24px));font:13px/1.5 Pretendard,system-ui,sans-serif;color:#eef;background:#15163a;border:1px solid #4d4dce;border-radius:14px;box-shadow:0 12px 36px rgba(0,0,0,.45)}' +
    '#sim.min{width:auto}#sim.min .sim-b{display:none}#sim .sim-h{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 12px;font-weight:800;cursor:pointer;background:#4d4dce;border-radius:13px 13px 0 0}#sim.min .sim-h{border-radius:13px}' +
    '#sim .sim-b{padding:10px 12px 12px;display:flex;flex-direction:column;gap:9px}#sim .sim-r{display:flex;flex-wrap:wrap;gap:5px;align-items:center}#sim .sim-k{width:100%;font-size:11.5px;letter-spacing:.04em;color:#a9a9e6;font-weight:700}' +
    '#sim button{font:inherit;font-size:12.5px;font-weight:700;padding:5px 9px;border-radius:8px;border:1px solid #6e6ee0;background:#22245a;color:#fff;cursor:pointer}#sim button:hover{background:#2f3180}#sim button.on{background:#4d4dce;border-color:#8a8aff}' +
    '#sim button.warn{border-color:#c98a3a;color:#ffd9a8}#sim input{font:inherit;width:64px;padding:4px 7px;border-radius:8px;border:1px solid #6e6ee0;background:#0f1030;color:#fff}' +
    '#sim .sim-s{background:#0f1030;border-radius:9px;padding:7px 9px;font-size:12.5px;color:#d8d8ff;word-break:break-all}#sim .sim-s b{color:#fff}#sim .mono{font-family:ui-monospace,Menlo,Consolas,monospace}';

  var el;
  function build() {
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    el = document.createElement('div'); el.id = 'sim';
    try { var mp = localStorage.getItem(KEY + '_min'); if (mp === '1' || (mp === null && matchMedia('(max-width: 640px)').matches)) el.className = 'min'; } catch (e) { }   // 모바일은 접힌 채로 시작
    el.innerHTML = '<div class="sim-h" id="sim-h"><span>🧪 테스트 모드 · 가짜 원장 (실제 XRP 안 씀)</span><span id="sim-tg">' + (el.className ? '펼치기' : '접기') + '</span></div>' +
      '<div class="sim-b">' +
      '<div class="sim-s" id="sim-clock"></div>' +
      '<div class="sim-r"><span class="sim-k">시계 (?now=)</span>' +
      '<button data-now="2026-09-21T14:00:00Z">오픈 전 (D-1)</button><button data-now="2026-09-22T09:00:05Z">오픈 직후</button>' +
      '<button data-now="2026-09-27T08:00:00Z">마감 1시간 전</button><button data-now="2026-09-27T09:30:00Z">마감 후</button><button data-now="">실제 시각</button></div>' +
      '<div class="sim-r"><span class="sim-k">참여 인원 (오픈 후 5 XRP 낸 서로 다른 지갑 수)</span>' +
      '<button data-paid="0">0</button><button data-paid="17">17</button><button data-paid="497">497</button><button data-paid="499">499</button><button data-paid="500">500 매진</button>' +
      '<input id="sim-paid" type="number" min="0" max="2000"><button id="sim-paid-go">적용</button></div>' +
      '<div class="sim-r"><span class="sim-k">입금 시뮬레이션 (결제 단계에서 누르면 몇 초 안에 확인됨)</span>' +
      '<button data-x="mine">내 태그로 5 XRP 입금</button><button data-x="short" class="warn">4 XRP (부족)</button><button data-x="notag" class="warn">태그 없는 입금</button><button data-x="other">다른 지갑 +1</button></div>' +
      '<div class="sim-r"><span class="sim-k">로그인 세션 (정본 규칙: Google·이메일은 이메일 있음 → 안 묻고, 외부 지갑은 없음 → 물음)</span>' +
      '<button data-ses="none">비로그인</button><button data-ses="google">Google 로그인</button><button data-ses="email">이메일 로그인</button><button data-ses="xaman">Xaman 외부 지갑</button><button data-ses="dcent">D\'CENT</button></div>' +
      '<div class="sim-s" id="sim-my"></div>' +
      '<div class="sim-r"><button id="sim-reset" class="warn">내 응모·시뮬 상태 초기화</button></div>' +
      '<div class="sim-s">문의·등록 메일: <b>support@wellbianlabs.io</b> — 완료 화면의 「등록 메일 보내기」도 이 주소로 열립니다.</div>' +
      '</div>';
    document.body.appendChild(el);
    el.querySelector('#sim-h').addEventListener('click', function () { el.classList.toggle('min'); el.querySelector('#sim-tg').textContent = el.classList.contains('min') ? '펼치기' : '접기'; try { localStorage.setItem(KEY + '_min', el.classList.contains('min') ? '1' : '0'); } catch (e) { } });
    Array.prototype.forEach.call(el.querySelectorAll('[data-now]'), function (b) { b.addEventListener('click', function () { nav({ now: b.getAttribute('data-now') || null }); }); });
    Array.prototype.forEach.call(el.querySelectorAll('[data-paid]'), function (b) { b.addEventListener('click', function () { state.paid = +b.getAttribute('data-paid'); state.extra = []; save(); nav({}); }); });
    el.querySelector('#sim-paid-go').addEventListener('click', function () { var v = +el.querySelector('#sim-paid').value; if (isNaN(v)) return; state.paid = Math.max(0, Math.min(2000, v)); state.extra = []; save(); nav({}); });
    Array.prototype.forEach.call(el.querySelectorAll('[data-x]'), function (b) { b.addEventListener('click', function () { addExtra(b.getAttribute('data-x')); }); });
    el.querySelector('#sim-reset').addEventListener('click', reset);
    Array.prototype.forEach.call(el.querySelectorAll('[data-ses]'), function (b) { b.addEventListener('click', function () { setSes(b.getAttribute('data-ses')); }); });
    el.querySelector('#sim-paid').value = state.paid;
    render(); setInterval(render, 1000);
  }
  function render() {
    if (!el) return;
    var C = cfg(), t = now(), open = Date.parse(C.openAt), close = Date.parse(C.closeAt);
    var ph = t < open ? '오픈 전' : t >= close ? '마감 후' : (state.paid >= C.max ? '매진' : '오픈 중');
    el.querySelector('#sim-clock').innerHTML = '시뮬 시각 <b>' + fmtKST(t) + ' KST</b> · ' + ph + (Q.get('now') ? '' : ' (실제 시각)') + ' · 가짜 참여 <b>' + state.paid + (state.extra.length ? ' +' + state.extra.length : '') + '</b> / ' + C.max;
    var nowKey = Q.get('now') || '';
    Array.prototype.forEach.call(el.querySelectorAll('[data-now]'), function (b) { b.classList.toggle('on', b.getAttribute('data-now') === nowKey); });
    Array.prototype.forEach.call(el.querySelectorAll('[data-paid]'), function (b) { b.classList.toggle('on', +b.getAttribute('data-paid') === state.paid && !state.extra.length); });
    var sesNow = mySes(), sk = sesNow ? sesNow.kind : 'none';
    Array.prototype.forEach.call(el.querySelectorAll('[data-ses]'), function (b) { b.classList.toggle('on', b.getAttribute('data-ses') === sk); });
    var me = myEntry(), s;
    s = '세션: ' + (!sesNow ? '<b>비로그인</b> — 참여 버튼을 누르면 로그인 모달이 먼저 뜹니다' : sesNow.email ? '<b>' + sesNow.kind + '</b> · ' + sesNow.email + ' (이메일 자동)' : '<b>' + sesNow.kind + '</b> 외부 지갑 · 이메일 없음 → 응모 때 물음') + '<br>';
    if (!me) s += '내 응모: 없음 — 본 페이지의 「5 XRP 로 참여하기」로 시작';
    else if (me.state === 'PAID') s += '내 응모: <b>확정 No. ' + pad3(me.no) + '</b> · 태그 <span class="mono">' + me.tag + '</span>';
    else if (me.state === 'OVERFLOW') s += '내 응모: <b>정원 초과</b> (' + me.no + '번째) · 태그 <span class="mono">' + me.tag + '</span>';
    else s += '내 응모: <b>결제 대기</b> · 태그 <span class="mono">' + me.tag + '</span> · 이메일 ' + (me.email || '');
    if (state.lastHash) s += '<br>마지막 가짜 거래 해시 <span class="mono">' + state.lastHash.slice(0, 12) + '…</span> <button id="sim-copy" style="padding:2px 7px">복사</button> — 「거래 해시로 확인」 입력용';
    el.querySelector('#sim-my').innerHTML = s;
    var cb = el.querySelector('#sim-copy'); if (cb) cb.addEventListener('click', function () { copy(state.lastHash, cb); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
