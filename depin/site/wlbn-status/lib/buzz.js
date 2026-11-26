'use strict';
// 웹 언급(뉴스 검색에 잡힌 기사) · 소셜(텔레그램 공개 채널과 대화방) — 누구나 볼 수 있게 공개된 것만 읽는다. 열쇠가 필요 없는 자료원만 쓴다.
//   · 뉴스: 구글 뉴스 검색의 RSS(제목 · 매체 · 날짜 · 주소). 한 번에 최근 것 100건까지라, 받을 때마다 상태에 쌓아 간다(S.buzz.web.items)
//   · 텔레그램: 공지 채널의 공개 미리보기(t.me/s/…)에서 글의 날짜 · 조회 수, 채널 · 대화방 소개 쪽에서 구독자 · 인원 수
//   · wellbian.io 공개 API(/api/network · /api/explorer): 운영자 · 보상 받은 지갑 · 보유 지갑 · 신뢰선 · 기기 수, 날짜별 보상 대상 기기 수(API 는 14일 치만 줘서 받을 때마다 쌓는다)
//   하루 한 번이면 된다(20시간 안에 받았으면 건너뛴다). 한쪽이 안 받아지면 그쪽은 지난 값을 그대로 둔다
//   X(트위터) · 검색량은 열쇠가 있어야 받을 수 있어 넣지 않았다
const GAP = 20 * 3600;
const NEWS = [
  { q: '웰비안 OR wellbian', hl: 'ko', gl: 'KR', ceid: 'KR:ko' },
  { q: 'wellbian', hl: 'en-US', gl: 'US', ceid: 'US:en' },
];
const WORD = /wellbian|웰비안|wlbn/i;      // 제목에 이 낱말이 든 기사만 센다(검색은 본문만 스친 기사 · 같은 글자의 다른 것도 돌려준다)
const tgChannel = () => String(process.env.WATCH_TG_CHANNEL || 'wellbianlabs').replace(/[^A-Za-z0-9_]/g, '');
const tgGroup = () => String(process.env.WATCH_TG_GROUP || 'wellbiantalk').replace(/[^A-Za-z0-9_]/g, '');

const unesc = (s) => String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, '&');
const pick = (xml, tag) => { const m = new RegExp('<' + tag + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + tag + '>').exec(xml); return m ? unesc(m[1]).trim() : ''; };
// RSS 한 통 → [{ id, at(유닉스 초), title, src, url }]
function parseNews(xml) {
  const out = [];
  for (const m of String(xml || '').matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const it = m[1], src = pick(it, 'source'), at = Math.floor(Date.parse(pick(it, 'pubDate')) / 1000), url = pick(it, 'link');
    let title = pick(it, 'title'); while (src && title.endsWith(' - ' + src)) title = title.slice(0, -(' - ' + src).length).trim();      // 제목 끝에 붙는 「 - 매체」는 뗀다(두 번 붙어 오기도 한다)
    if (!title || !(at > 0) || !/^https:\/\//.test(url)) continue;
    out.push({ id: (pick(it, 'guid') || url).slice(-48), at, title: title.slice(0, 160), src: src.slice(0, 60), url: url.slice(0, 600) });
  }
  return out;
}
// 숫자 글(「1 234」 · 「1.2K」 · 「3.4M」) → 수
function num(s) { const t = String(s || '').replace(/[\s, ]/g, ''), m = /^([\d.]+)([KkMm]?)$/.exec(t); if (!m) return null; const v = parseFloat(m[1]) * (/[Kk]/.test(m[2]) ? 1e3 : /[Mm]/.test(m[2]) ? 1e6 : 1); return isFinite(v) ? Math.round(v) : null; }
// 채널 · 대화방 소개 쪽(t.me/이름) → { subs } 또는 { members, online }
function parsePage(html) {
  const m = /<div class="tgme_page_extra">([\s\S]*?)<\/div>/.exec(String(html || '')), t = m ? unesc(m[1].replace(/<[^>]+>/g, '')).trim() : '', o = {};
  const a = /([\d\s., KkMm]+)\s*subscribers?/.exec(t), b = /([\d\s., KkMm]+)\s*members?/.exec(t), c = /([\d\s., KkMm]+)\s*online/.exec(t);
  if (a) o.subs = num(a[1]); if (b) o.members = num(b[1]); if (c) o.online = num(c[1]);
  return o;
}
// 채널 공개 미리보기(t.me/s/이름) → [{ id, at, views }]
function parsePosts(html, channel) {
  const out = [], parts = String(html || '').split('<div class="tgme_widget_message_wrap').slice(1);
  for (const p of parts) {
    const id = new RegExp('data-post="' + channel + '/(\\d+)"', 'i').exec(p), tm = /<time[^>]*datetime="([^"]+)"/.exec(p), vw = /<span class="tgme_widget_message_views">([^<]+)<\/span>/.exec(p);
    const at = tm ? Math.floor(Date.parse(tm[1]) / 1000) : 0; if (!id || !(at > 0)) continue;
    out.push({ id: Number(id[1]), at, views: vw ? num(vw[1]) : null });
  }
  return out;
}
const getText = async (fetchImpl, url, ms) => { const r = await fetchImpl(url, { headers: { accept: 'text/html,application/xml;q=0.9,*/*;q=0.8', 'user-agent': 'Mozilla/5.0 (compatible; wlbn-status)' }, signal: AbortSignal.timeout(ms || 8000) }); if (!r.ok) throw new Error('http ' + r.status); return r.text(); };

function blank() { return { at: 0, web: { at: 0, items: {} }, tg: { at: 0, posts: {}, log: {} }, site: { at: 0, epochs: {}, log: {} } }; }
// 상태(S.buzz)를 새로 받아 더한다. 돌려주는 것: { changed, web, tg, skipped }
async function update(S, opts) {
  opts = opts || {};
  const now = opts.now || Math.floor(Date.now() / 1000), fetchImpl = opts.fetchImpl || fetch, t0 = Date.now(), budget = opts.budgetMs || 12000, left = () => budget - (Date.now() - t0);
  if (!S.buzz) S.buzz = blank();
  const B = S.buzz; if (!B.web) B.web = { at: 0, items: {} }; if (!B.tg) B.tg = { at: 0, posts: {}, log: {} };
  if (!opts.force && now - (B.at || 0) < GAP) return { changed: false, skipped: true };
  const info = { changed: false, web: 0, tg: 0, site: 0 };
  // 뉴스
  try {
    const before = Object.keys(B.web.items).length;
    for (const n of NEWS) {
      if (left() < 2500) break;
      const xml = await getText(fetchImpl, 'https://news.google.com/rss/search?q=' + encodeURIComponent(n.q) + '&hl=' + n.hl + '&gl=' + n.gl + '&ceid=' + encodeURIComponent(n.ceid), Math.min(8000, left()));
      for (const it of parseNews(xml)) { if (!WORD.test(it.title)) continue; B.web.items[it.id] = [it.at, it.title, it.src, it.url]; }
    }
    // 같은 제목 · 같은 매체가 주소만 달리 두 번 오는 일이 있다 → 이른 것 하나만 남긴다. 400건을 넘으면 오래된 것부터 버린다
    const seen = {}; Object.keys(B.web.items).sort((a, b) => B.web.items[a][0] - B.web.items[b][0]).forEach((id) => { const v = B.web.items[id], k = v[1] + '|' + v[2]; if (seen[k]) delete B.web.items[id]; else seen[k] = 1; });
    const ids = Object.keys(B.web.items).sort((a, b) => B.web.items[b][0] - B.web.items[a][0]); ids.slice(400).forEach((id) => { delete B.web.items[id]; });
    B.web.at = now; info.web = Math.max(0, Object.keys(B.web.items).length - before); info.changed = true;
  } catch (e) { info.web_error = String((e && e.message) || e).slice(0, 80); }
  // 텔레그램
  try {
    const ch = tgChannel(), gr = tgGroup(), tg = B.tg; let pages = 0, before = 0;
    if (ch && left() > 2500) {
      const pg = parsePage(await getText(fetchImpl, 'https://t.me/' + ch, Math.min(7000, left()))); if (pg.subs != null) tg.subs = pg.subs;
      for (; pages < 3 && left() > 2500; pages++) {
        const posts = parsePosts(await getText(fetchImpl, 'https://t.me/s/' + ch + (before ? '?before=' + before : ''), Math.min(7000, left())), ch); if (!posts.length) break;
        for (const p of posts) tg.posts[p.id] = [p.at, p.views];
        const old = posts.reduce((m, p) => Math.min(m, p.at), Infinity); before = posts.reduce((m, p) => Math.min(m, p.id), Infinity);
        if (old < now - 70 * 86400 || before <= 1) break;      // 열 주 치면 충분하다
      }
      info.tg = Object.keys(tg.posts).length;
    }
    if (gr && left() > 2500) { const pg = parsePage(await getText(fetchImpl, 'https://t.me/' + gr, Math.min(7000, left()))); if (pg.members != null) tg.members = pg.members; if (pg.online != null) tg.online = pg.online; }
    const ids = Object.keys(tg.posts).map(Number).sort((a, b) => b - a); ids.slice(300).forEach((id) => { delete tg.posts[id]; });
    const day = new Date((now + 9 * 3600) * 1000).toISOString().slice(0, 10);      // 한국 날짜
    if (tg.subs != null || tg.members != null) tg.log[day] = [tg.subs == null ? null : tg.subs, tg.members == null ? null : tg.members];
    const days = Object.keys(tg.log).sort(); days.slice(0, Math.max(0, days.length - 400)).forEach((d) => { delete tg.log[d]; });
    tg.at = now; tg.channel = ch; tg.group = gr; info.changed = true;
  } catch (e) { info.tg_error = String((e && e.message) || e).slice(0, 80); }
  // wellbian.io 가 공개한 값. 화면용 자료를 만들면서 이미 받은 것이 있으면 그것을 쓴다(opts.ext — 같은 주소를 두 번 부르지 않는다)
  try {
    const st = B.site || (B.site = { at: 0, epochs: {}, log: {} }), int = (v) => (typeof v === 'number' && isFinite(v) ? Math.round(v) : null), day = new Date((now + 9 * 3600) * 1000).toISOString().slice(0, 10);
    if (!st.epochs) st.epochs = {}; if (!st.log) st.log = {};
    let net = opts.ext && opts.ext.network, ex = opts.ext && opts.ext.explorer;
    if (!net && left() > 2500) net = JSON.parse(await getText(fetchImpl, 'https://wellbian.io/api/network', Math.min(7000, left())));
    if (!ex && left() > 2500) ex = JSON.parse(await getText(fetchImpl, 'https://wellbian.io/api/explorer', Math.min(7000, left())));
    const okNet = !!(net && net.devices), okEx = !!(ex && ex.holders !== undefined);
    if (okNet) {
      st.devices_total = int(net.devices.total); st.devices_active = int(net.devices.active); st.operators = int(net.devices.operators); st.earners = int(net.earnersTotal);
      for (const e of net.epochs || []) if (e && /^\d{4}-\d{2}-\d{2}$/.test(e.date) && int(e.eligibleNodes) !== null) st.epochs[e.date] = [int(e.eligibleNodes), int(e.distributed)];
    }
    if (okEx) { st.holders = int(ex.holders); st.trustlines = int(ex.trustlines); st.claims = ex.claims ? int(ex.claims.count) : null; }
    if (okNet || okEx) {
      st.log[day] = [st.devices_total, st.devices_active, st.operators, st.earners, st.holders, st.trustlines, st.claims].map((v) => (v === undefined ? null : v));
      for (const k of ['epochs', 'log']) { const ds = Object.keys(st[k]).sort(); ds.slice(0, Math.max(0, ds.length - 400)).forEach((d) => { delete st[k][d]; }); }
      st.at = now; info.site = Object.keys(st.epochs).length; info.changed = true;
    }
  } catch (e) { info.site_error = String((e && e.message) || e).slice(0, 80); }
  if (info.changed) B.at = now;
  return info;
}
module.exports = { update, parseNews, parsePage, parsePosts, num, blank, GAP };
