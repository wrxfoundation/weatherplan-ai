// 스모크 — 전 라우트 UX 기계 검사 (모바일 360 터치 · 좁은 폰 320 · 데스크톱 1440)
// 폭을 고른 이유: 안드로이드 표준이 360, 갤럭시 폴드 커버·화면 확대 설정이 320~344 까지 내려간다.
// 2026-09-23 에 390(아이폰)만 봤다가, 인터넷 페이지가 폴드 커버(344)에서 옆으로 밀리는 걸 사용자가 먼저 찾았다.
// 사람이 페이지마다 확인하던 걸 매 커밋 자동으로 본다. 2026-09-23 전수 점검에서 실제로 나온 것들만 담았다.
//
//  ① 가로 넘침 0      — 그리드 아이템 min-width:auto 가 표(420px)·긴 단어에 부풀어 페이지가 옆으로 밀렸다(3곳)
//  ② 에러 0           — pageerror · console.error (CDN·폰트 차단 같은 환경 잡음은 뺀다)
//  ③ 리다이렉트 0      — 역할 세션을 넣었는데 로그인으로 튕기면 가드·세션 규약이 깨진 것
//  ④ h1 정확히 1개     — 홈·파트너몰·로그인에 h1 이 없었다
//  ⑤ 이름 없는 컨트롤 0 — 아이콘만 있는 전화 버튼이 스크린리더에 '링크'로만 읽혔다
//  ⑥ 터치 타깃 ≥ 24px  — WCAG 2.5.8. 문장 속 링크·체크박스·레인지는 예외, .hit 은 ::after 확장분(+16/+12)을 더해 잰다
//  ⑦ iOS 입력 확대 0   — 입력 글자 16px 미만이면 iOS 가 포커스 때 화면을 확대한다. 규칙이 Tailwind 클래스에
//                        져서 무력화돼 있었다 → 그 @supports 블록을 강제로 켠 상태에서 전 입력이 16px 이상인지 본다
//  ⑧ FAB ↔ 하단 바     — 하단 고정 바가 있는 페이지에서 챗 FAB 가 바(전환 버튼)를 덮지 않는다
//  ⑨ alt 없는 img 0
//  ⑩ 이미지 부분 잘림 0 — overflow:hidden 카드가 이미지를 일부만 보여 주면 안 된다(완전히 안/밖은 괜찮다).
//                        혜택 배너 선물상자가 카드 모서리 밖에 걸쳐 위쪽 코인이 잘렸다(2026-09-23 두 번째 이미지 잘림 신고).
//                        의도된 걸침은 data-bleed 로 표시한다. 이 컨테이너는 CDN 이 막혀 이미지가 안 뜨므로,
//                        없는 /assets 요청은 1x1 자리표시로 채워 CSS 크기대로 박스가 생기게 한 뒤 잰다.
let pw
try { pw = require('/opt/node22/lib/node_modules/playwright') } catch { pw = require('playwright') }
const BASE = process.env.QA_BASE ?? 'http://localhost:4173'

const S = {
  none: null,
  admin: { role: 'admin' },
  partner: { role: 'partner', tenantId: 'T1' },
  regional: { role: 'regional', distributorId: 'D1' },
  agency: { role: 'agency', agencyId: 'AG1' },
  biz: { role: 'member', memberId: 'MB3', type: '사업자', tier: 'seller', code: 'A1N7742' },
}
// 라우트 전수 — App.jsx 에 라우트를 추가하면 여기에도 넣는다(동적 파라미터는 시드에 있는 값)
const ROUTES = [
  ['/', 'none'], ['/category/phone', 'none'], ['/category/rental', 'none'], ['/category/internet', 'none'],
  ['/calculator', 'none'], ['/calculator/phone', 'biz'], ['/calculator/rental', 'none'],
  ['/consult', 'none'], ['/diagnosis', 'none'], ['/payouts', 'none'], ['/support', 'none'], ['/shop', 'none'],
  ['/onboard/phone', 'none'], ['/onboard/internet', 'none'],
  ['/phone/shop', 'none'], ['/phone/shop/fold8', 'none'], ['/phone/mvno', 'none'], ['/phone/mvno/ktm-11g', 'none'],
  ['/cars', 'none'], ['/cars/palisade', 'none'], ['/signup', 'none'],
  ['/benefits', 'none'], ['/benefits/ads', 'none'], ['/benefits/invite', 'none'], ['/benefits/signup', 'none'],
  ['/board/review', 'none'], ['/board/qna', 'none'], ['/board/qna/PQ1', 'none'], ['/board/tip', 'none'], ['/board/event', 'none'],
  ['/board/complaint', 'none'], ['/board/notice', 'none'], ['/board/qna/new', 'none'],
  ['/m/happynet', 'none'], ['/partner', 'none'], ['/partner/apply', 'none'], ['/ir', 'none'], ['/ir/deck', 'none'], ['/login', 'none'],
  ['/office', 'partner'], ['/office/leads', 'partner'], ['/office/settlement', 'partner'], ['/office/customers', 'partner'],
  ['/office/marketing', 'partner'], ['/office/design', 'partner'], ['/office/resources', 'partner'], ['/office/setup', 'partner'],
  ['/regional', 'regional'], ['/agency', 'agency'],
  ['/admin', 'admin'], ['/admin/biz', 'admin'], ['/admin/tenants', 'admin'], ['/admin/products', 'admin'], ['/admin/policies', 'admin'],
  ['/admin/leads', 'admin'], ['/admin/settlements', 'admin'], ['/admin/ai', 'admin'], ['/admin/persona-lab', 'admin'],
  ['/admin/press', 'admin'], ['/admin/audit', 'admin'], ['/admin/banners', 'admin'], ['/admin/boards', 'admin'],
  ['/admin/complaints', 'admin'], ['/admin/benefits', 'admin'], ['/admin/org', 'admin'],
]
// ONLY=/benefits 처럼 일부 라우트만 — 원인 좁힐 때
const ONLY_RE = process.env.ONLY ? new RegExp(process.env.ONLY) : null
const PNG_1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64')
const NOISE = /Failed to load resource|net::ERR|cloudfront|fonts\.(googleapis|gstatic)|cdn\.jsdelivr|favicon/i

// 페이지 안에서 도는 검사 — 결과는 사람이 읽을 수 있는 문자열 목록
function inPage(mobile) {
  const W = document.documentElement.clientWidth
  const vis = (el) => {
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false
    const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0
  }
  const lab = (el) => {
    const t = el.getAttribute('data-t'); if (t) return `[data-t=${t}]`
    const x = (el.innerText || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 22)
    return `${el.tagName.toLowerCase()}${x ? `「${x}」` : ''}`
  }
  const out = { overflow: 0, overflowers: [], h1: 0, noName: [], small: [], zoom: [], imgNoAlt: 0, fabOverBar: '', clipped: [] }
  // ① 가로 넘침 — 조상이 가로를 자르지 않는 말단 원인까지
  out.overflow = document.documentElement.scrollWidth - W
  if (out.overflow > 1) {
    const inFixed = (el) => { for (let a = el; a && a !== document.body; a = a.parentElement) if (getComputedStyle(a).position === 'fixed') return true; return false }
    const over = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > W + 1 || r.left < -1) && !inFixed(el) }
    for (const el of document.querySelectorAll('body *')) {
      if (!over(el) || [...el.children].some(over)) continue
      let clipped = false
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) if (getComputedStyle(p).overflowX !== 'visible') { clipped = true; break }
      if (!clipped) out.overflowers.push(lab(el))
      if (out.overflowers.length >= 3) break
    }
  }
  // ④ h1
  out.h1 = document.querySelectorAll('h1').length
  // ⑤ 이름 없는 컨트롤
  const inter = [...document.querySelectorAll('a[href], button, [role="button"], [role="checkbox"], select, input:not([type="hidden"]), textarea')].filter(vis)
  const nameOf = (el) => (el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText || el.value ||
    [...el.querySelectorAll('img[alt]')].map((i) => i.alt).join('') ||
    (el.id && document.querySelector(`label[for="${el.id}"]`)?.innerText) || el.closest('label')?.innerText || '').trim()
  out.noName = inter.filter((el) => !nameOf(el)).slice(0, 4).map(lab)
  // ⑥ 터치 타깃 (모바일만)
  if (mobile) {
    for (const el of inter) {
      const cs = getComputedStyle(el)
      if (el.tagName === 'A' && cs.display === 'inline') continue // 문장 속 링크 — 2.5.8 예외
      if (['checkbox', 'radio', 'range'].includes(el.type)) continue // label·트랙이 타깃을 넓힌다
      if (/번째 배너$/.test(el.getAttribute('aria-label') || '')) continue // 히어로 점 — 같은 기능의 '1/4 ›' 알약(32px)·스와이프가 있다(2.5.8 '동등 컨트롤' 예외)
      const r = el.getBoundingClientRect()
      const hit = el.classList.contains('hit') // ::after 로 위아래 8px·좌우 6px 확장
      const h = r.height + (hit ? 16 : 0), w = r.width + (hit ? 12 : 0)
      if (h < 24 || w < 24) out.small.push(`${lab(el)} ${Math.round(w)}x${Math.round(h)}`)
    }
  }
  // ⑦ iOS 확대 — @supports(-webkit-touch-callout) 블록을 무조건 켜 본 뒤 잰다(크로미움은 그 조건이 거짓이라)
  if (mobile) {
    let inner = ''
    for (const sh of document.styleSheets) {
      let rules; try { rules = sh.cssRules } catch { continue }
      for (const r of rules) if (r.conditionText && /-webkit-touch-callout/.test(r.conditionText)) inner += [...r.cssRules].map((x) => x.cssText).join('\n')
    }
    if (!inner) out.zoom.push('iOS 입력 확대 방지 규칙(@supports -webkit-touch-callout)이 스타일시트에 없음')
    const tag = document.createElement('style'); tag.textContent = inner; document.head.appendChild(tag)
    for (const el of document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=hidden]):not([type=file]), select, textarea')) {
      if (!vis(el)) continue
      const fs = parseFloat(getComputedStyle(el).fontSize)
      if (fs < 16) out.zoom.push(`${lab(el)} ${fs}px`)
    }
    tag.remove()
  }
  // ⑧ FAB ↔ 하단 바
  const bar = document.querySelector('[data-bottom-bar]')
  const fab = document.querySelector('button[aria-label="AI 상담"]')
  if (bar && fab && vis(bar) && vis(fab)) {
    const a = bar.getBoundingClientRect(), b = fab.getBoundingClientRect()
    const overlap = !(b.bottom <= a.top || b.top >= a.bottom || b.right <= a.left || b.left >= a.right)
    if (overlap) out.fabOverBar = `FAB(${Math.round(b.top)}~${Math.round(b.bottom)}) 가 하단 바(${Math.round(a.top)}~) 를 덮음`
  }
  // ⑨ alt
  out.imgNoAlt = document.querySelectorAll('img:not([alt])').length
  // ⑩ 이미지 부분 잘림 — 가장 가까운 '잘라내는' 조상(overflow hidden/clip)과 겹치되 다 들어가지 못한 이미지.
  //    스크롤 컨테이너(auto/scroll)의 가장자리 걸침은 스크롤로 보이므로 정상, 캐러셀의 다른 장처럼 완전히 밖이면 안 보이므로 제외.
  for (const img of document.querySelectorAll('img')) {
    if (!vis(img) || img.closest('[data-bleed]')) continue
    const r = img.getBoundingClientRect()
    for (let a = img.parentElement; a && a !== document.body; a = a.parentElement) {
      const cs = getComputedStyle(a)
      if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue
      if (/auto|scroll/.test(cs.overflowX + cs.overflowY)) break
      const c = a.getBoundingClientRect()
      if (r.right <= c.left || r.left >= c.right || r.bottom <= c.top || r.top >= c.bottom) break
      const cut = { 위: c.top - r.top, 오른쪽: r.right - c.right, 아래: r.bottom - c.bottom, 왼쪽: c.left - r.left }
      const over = Object.entries(cut).filter(([, v]) => v > 2)
      if (over.length) out.clipped.push(`${(img.getAttribute('src') || '').split('/').pop()} ${over.map(([k, v]) => `${k} ${Math.round(v)}px`).join('·')}`)
      break
    }
  }
  return out
}

;(async () => {
  const browser = await pw.chromium.launch()
  let fail = 0, checked = 0
  const bad = (vp, path, msg) => { fail++; console.log(`FAIL  ${vp} ${path}  ${msg}`) }
  const PASSES = [
    ['360', { viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true }, 'full'],
    ['320', { viewport: { width: 320, height: 720 }, isMobile: true, hasTouch: true }, 'overflow'], // 넘침·에러만(나머지는 폭과 무관)
    ['1440', { viewport: { width: 1440, height: 900 } }, 'full'],
  ]
  for (const [vp, opt, mode] of PASSES) {
    const ctx = await browser.newContext({ ...opt, deviceScaleFactor: 1 })
    // 로컬에 없는 에셋(CDN 에서 받아 오는 것)은 자리표시로 — 이미지가 실제처럼 CSS 크기로 자리 잡게
    await ctx.route(/\/assets\/.+\.(png|webp|jpe?g)(\?.*)?$/, async (route) => {
      const res = await route.fetch().catch(() => null)
      // preview 서버는 없는 파일에도 SPA 폴백(index.html)을 200 으로 준다 — 상태 코드가 아니라 내용 형식으로 판단한다.
      // (처음엔 res.ok() 로 봤다가, HTML 을 이미지로 넘겨 로드 실패 → 숨김 → 검사에서 빠져 옛 버그를 못 잡았다)
      if (res && res.ok() && /^image\//.test(res.headers()['content-type'] ?? '')) return route.fulfill({ response: res })
      return route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1x1 })
    })
    const page = await ctx.newPage()
    let errs = []
    page.on('pageerror', (e) => errs.push(String(e).slice(0, 140)))
    page.on('console', (m) => { if (m.type() === 'error' && !NOISE.test(m.text())) errs.push(m.text().slice(0, 140)) })
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear() } catch {} })
    for (const [path, sk] of ROUTES.filter(([p]) => !ONLY_RE || ONLY_RE.test(p))) {
      errs = []
      await page.evaluate((s) => { try { s ? localStorage.setItem('moduon_session_v1', JSON.stringify(s)) : localStorage.removeItem('moduon_session_v1') } catch {} }, S[sk])
      await page.goto(BASE + path, { waitUntil: 'load', timeout: 20000 }).catch(() => {})
      await page.waitForTimeout(450)
      const r = await page.evaluate(inPage, vp !== '1440')
      checked++
      const final = new URL(page.url()).pathname
      if (final !== path) bad(vp, path, `리다이렉트 → ${final}`)
      if (r.overflow > 1) bad(vp, path, `가로 넘침 +${r.overflow}px ← ${r.overflowers.join(' | ')}`)
      if (errs.length) bad(vp, path, `에러 ${errs.length}: ${errs[0]}`)
      if (mode === 'overflow') continue
      if (r.h1 !== 1) bad(vp, path, `h1 ${r.h1}개 (1개여야 함)`)
      if (r.noName.length) bad(vp, path, `이름 없는 컨트롤: ${r.noName.join(', ')}`)
      if (r.small.length) bad(vp, path, `24px 미만 터치 타깃 ${r.small.length}: ${r.small.slice(0, 3).join(', ')}`)
      if (r.zoom.length) bad(vp, path, `iOS 확대 유발 입력 ${r.zoom.length}: ${r.zoom.slice(0, 2).join(', ')}`)
      if (r.fabOverBar) bad(vp, path, r.fabOverBar)
      if (r.imgNoAlt) bad(vp, path, `alt 없는 img ${r.imgNoAlt}`)
      if (r.clipped.length) bad(vp, path, `이미지 부분 잘림 ${r.clipped.length}: ${r.clipped.slice(0, 3).join(' | ')}`)
    }
    await ctx.close()
  }
  await browser.close()
  console.log(`\n${checked}페이지 (${ROUTES.length} 라우트 × 360·320·1440) 점검`)
  console.log(fail === 0 ? 'SMOKE: ALL PASS' : `SMOKE: ${fail} FAIL`)
  process.exit(fail === 0 ? 0 : 1)
})()
