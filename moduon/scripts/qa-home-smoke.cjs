// 스모크 — 소비자 홈 (아정당식 초기화면 대공사)
// ① 2행 헤더(유틸행 5 · 본 GNB 6 · 🔔 · 로그인) ② 햄버거 패널 ③ 메가메뉴 회귀 ④ 우측 플로팅 패널(여백/오버레이/모바일)
// ⑤ 롤링 배너 ⑥ 아이콘 행 6종 ⑦ 지원금 섹션(152만원+ = 45+47+30+30) ⑧ 바로 상담하기 분기 ⑨ 숨김≠삭제(+/support 통로 3곳 · /calculator 스티키) ⑩ 모바일 ⑪ 파트너몰 헤더·배너 ⑫ pageerror
let pw
try { pw = require('/opt/node22/lib/node_modules/playwright') } catch { pw = require('playwright') }
// 여러 스모크를 병렬로 돌릴 때 각자 다른 프리뷰 포트를 쓸 수 있게 — 기본은 qa-all 이 띄우는 4173
const BASE = process.env.QA_BASE ?? 'http://localhost:4173'

;(async () => {
  const browser = await pw.chromium.launch()
  const errors = []
  let fail = 0
  const check = (ok, label) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`) }

  // 뷰포트별로 새 컨텍스트(localStorage 초기 상태 = 첫 방문)를 연다 — browser.newPage 는 컨텍스트를 새로 만든다
  let page = null
  const openPage = async (viewport, path = '/') => {
    if (page) await page.close()
    page = await browser.newPage({ viewport })
    page.on('pageerror', (e) => errors.push(String(e)))
    await page.goto(BASE + path, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
  }
  const goto = async (path) => { await page.goto(BASE + path, { waitUntil: 'networkidle' }); await page.waitForTimeout(400) }
  // 요소가 없을 때 innerText 는 30초 뒤 throw 라 남은 단언이 통째로 날아간다 — 빈 문자열로 떨어뜨린다
  const textOf = async (sel) => { try { return await page.locator(sel).first().innerText({ timeout: 2000 }) } catch { return '' } }
  const attrOf = async (sel, name) => { try { return await page.locator(sel).first().getAttribute(name, { timeout: 2000 }) } catch { return null } }
  const count = (sel) => page.locator(sel).count()
  const visible = async (sel) => { try { return await page.locator(sel).first().isVisible() } catch { return false } }
  const pathOf = () => new URL(page.url()).pathname
  // 실제 사용자처럼 마우스를 단계적으로 옮긴다 — hover() 는 순간이동이라 호버 메뉴의 틈 버그를 못 잡는다
  const glide = async (loc, steps = 25) => { const bb = await loc.boundingBox(); await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps }); await page.waitForTimeout(150) }
  // 바깥 클릭 — 콘텐츠 컨테이너(max-w-6xl) 왼쪽 여백은 링크가 없어 mousedown 만 document 로 올라간다
  const clickOutside = async () => { await page.mouse.click(6, 420); await page.waitForTimeout(250) }
  // 챗 위젯이 실제로 열렸는지 — body 에 '모비'는 배너·패널 문구로 늘 있으니 다이얼로그 자체로 본다
  const chatOpen = async () => (await count('[role="dialog"][aria-label="AI 상담사 모비"]')) === 1

  // ───────────────────────────── ① 헤더 (1280 데스크톱) ─────────────────────────────
  await openPage({ width: 1280, height: 900 })
  const util = await page.locator('[data-t="util-nav"] a').evaluateAll((as) => as.map((a) => [a.innerText.trim(), a.getAttribute('href')]))
  check(util.length === 5, `헤더 유틸행 링크 5개 (${util.length})`)
  check(util.map((x) => x[0]).join(',') === '질문/답변,꿀팁게시판,후기,이벤트,불편접수', `유틸행 라벨 순서 (${util.map((x) => x[0]).join(',')})`)
  check(util.map((x) => x[1]).join(',') === '/board/qna,/board/tip,/board/review,/board/event,/board/complaint', `유틸행 href 순서 (${util.map((x) => x[1]).join(',')})`)

  const main = await page.locator('[data-t="main-nav"] a').evaluateAll((as) => as.map((a) => [a.innerText.trim(), a.getAttribute('href')]))
  check(main.length === 6, `본 GNB 링크 6개 (${main.length})`)
  check(main.map((x) => x[1]).join(',') === '/category/phone,/category/rental,/category/internet,/cars,/partner,/benefits', `본 GNB href 순서 (${main.map((x) => x[1]).join(',')})`)
  const ml = main.map((x) => x[0])
  check(ml[0] === '휴대폰' && ml[1] === '가전렌탈' && ml[2] === '인터넷' && ml[3] === '렌트/리스' && ml[5] === '모두온혜택', `본 GNB 라벨 (${JSON.stringify(ml)})`)
  check(/매장패키지/.test(ml[4] ?? '') && (ml[4] ?? '').includes('사업자'), `매장패키지 + '사업자' 배지 텍스트 (${JSON.stringify(ml[4])})`)
  check((await count('[data-t="main-nav"] a[href="/partner"] span:text-is("사업자")')) === 1, '매장패키지 배지 요소 존재')

  const headerText = await textOf('header')
  check(!/무료\s*상담/.test(headerText), '헤더에 무료 상담 버튼 없음')
  check((await count('header a[href^="tel:"]')) === 0, '헤더에 전화 버튼 없음')

  // 🔔 첫 방문 — 배지 숫자 > 0, 열면 공지·이벤트 항목이 있고 배지는 사라진다
  const badgeBefore = Number(await textOf('[data-t="cnotif"] span'))
  check(badgeBefore > 0, `알림 배지 첫 방문 숫자 > 0 (${badgeBefore})`)
  check(/^알림 \d+건$/.test((await attrOf('[data-t="cnotif"]', 'aria-label')) ?? ''), '알림 버튼 aria-label 에 건수')
  await page.locator('[data-t="cnotif"]').click(); await page.waitForTimeout(300)
  check(await visible('[data-t="cnotif-panel"]'), '🔔 클릭 → 알림 패널 표시')
  const notifItems = await page.locator('[data-t="cnotif-panel"] li a').evaluateAll((as) => as.map((a) => a.getAttribute('href')))
  check(notifItems.length >= 1 && notifItems.every((h) => /^\/board\/(notice|event)\//.test(h)), `알림 항목 ≥1 · 공지/이벤트 글로 연결 (${notifItems.join(' ')})`)
  check((await count('[data-t="cnotif"] span')) === 0 && (await attrOf('[data-t="cnotif"]', 'aria-label')) === '알림', '열고 나면 배지 0')
  await page.keyboard.press('Escape'); await page.waitForTimeout(200)
  check((await count('[data-t="cnotif-panel"]')) === 0, 'Escape → 알림 패널 닫힘')

  await page.locator('header button', { hasText: '로그인/회원가입' }).click(); await page.waitForTimeout(500)
  check(pathOf() === '/login', `로그인/회원가입 → /login (${pathOf()})`)

  // ───────────────────────────── ② 햄버거 패널 ─────────────────────────────
  await goto('/')
  check((await attrOf('[data-t="hamburger"]', 'aria-expanded')) === 'false', '햄버거 초기 aria-expanded=false')
  await page.locator('[data-t="hamburger"]').click(); await page.waitForTimeout(300)
  check(await visible('[data-t="hamburger-panel"]'), '☰ 클릭 → 햄버거 패널 표시')
  check((await attrOf('[data-t="hamburger"]', 'aria-expanded')) === 'true', '햄버거 aria-expanded=true')
  // 라벨은 마지막 span — innerText 첫 줄은 이미지 폴백 원형(첫 글자)이라 라벨이 아니다
  const gridLinks = await page.locator('[data-t="hamburger-panel"] .grid a:visible').evaluateAll((as) => as.map((a) => [(a.querySelector(':scope > span:last-child')?.innerText ?? '').trim(), a.getAttribute('href')]))
  const gridLabels = gridLinks.map((x) => x[0])
  for (const [label, href] of [['인터넷', '/category/internet'], ['가전렌탈', '/category/rental'], ['휴대폰', '/category/phone'], ['매장패키지', '/partner'], ['멤버십몰', '/shop']]) {
    check(gridLinks.some((x) => x[0].startsWith(label) && x[1] === href), `햄버거 그리드: ${label} → ${href}`)
  }
  check(gridLabels.length === 5, `데스크톱 햄버거 그리드 5칸 (${gridLabels.join(',')})`)
  const panelText = await textOf('[data-t="hamburger-panel"]')
  check(panelText.includes('혜택') && panelText.includes('게시판'), '햄버거 섹션 제목: 혜택 · 게시판')
  check((await textOf('[data-t="hamburger-panel"] a[href="/benefits/ads"]')).includes('광고보기'), '혜택: 광고보기 → /benefits/ads')
  check((await textOf('[data-t="hamburger-panel"] a[href="/benefits/invite"]')).includes('친구초대하기'), '혜택: 친구초대하기 → /benefits/invite')
  const boardLinks = await page.locator('[data-t="hamburger-panel"] a[href^="/board/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')))
  check(boardLinks.length === 6 && ['review', 'qna', 'tip', 'event', 'complaint', 'notice'].every((k) => boardLinks.includes(`/board/${k}`)), `게시판 링크 6종 (${boardLinks.join(' ')})`)
  await page.keyboard.press('Escape'); await page.waitForTimeout(250)
  check((await count('[data-t="hamburger-panel"]')) === 0, 'Escape → 햄버거 패널 닫힘')
  await page.locator('[data-t="hamburger"]').click(); await page.waitForTimeout(300)
  check(await visible('[data-t="hamburger-panel"]'), '☰ 재클릭 → 패널 다시 표시')
  await clickOutside()
  check((await count('[data-t="hamburger-panel"]')) === 0, '바깥 클릭 → 햄버거 패널 닫힘')
  await page.locator('[data-t="hamburger"]').click(); await page.waitForTimeout(300)
  await page.locator('[data-t="hamburger-panel"] a[href="/board/notice"]').click(); await page.waitForTimeout(500)
  check(pathOf() === '/board/notice', `패널 안 공지사항 → /board/notice (${pathOf()})`)
  check((await count('[data-t="hamburger-panel"]')) === 0, '라우트 이동 후 패널 닫힘')

  // ───────────────────────────── ③ 메가메뉴 회귀 ─────────────────────────────
  await goto('/')
  await page.mouse.move(640, 700)
  await glide(page.locator('[data-t="main-nav"] a', { hasText: /^가전렌탈$/ }))
  await page.waitForTimeout(200)
  check(await visible('[data-t="mega"]'), '가전렌탈 호버 → 메가메뉴 표시')
  check((await attrOf('[data-t="mega"]', 'data-mega')) === '/category/rental', '메가메뉴 키 = /category/rental')
  check((await count('[data-t="mega-brands"]')) === 1, '메가메뉴 브랜드 목록 존재')
  // 메가 패널은 <header> 의 자식이라 패널 아래(≈780px)까지 내려가야 mouseleave 가 난다 — 패널 박스를 재서 그 밑으로 옮긴다
  const megaBox = await page.locator('[data-t="mega"]').boundingBox()
  const belowY = Math.min((megaBox?.y ?? 0) + (megaBox?.height ?? 0) + 40, 890)
  await page.mouse.move(640, belowY, { steps: 25 }); await page.waitForTimeout(250)
  check((await count('[data-t="mega"]')) === 0, `헤더(메가 패널 포함) 벗어나면 메가메뉴 닫힘 (y=${Math.round(belowY)})`)

  // ───────────────────────────── ⑤ 롤링 배너 ─────────────────────────────
  await goto('/')
  check((await attrOf('[data-t="hero-banner"]', 'data-total')) === '3', `배너 data-total=3 (${await attrOf('[data-t="hero-banner"]', 'data-total')})`)
  const slideIds = await page.locator('[data-t="hero-slide"]').evaluateAll((els) => els.map((e) => e.dataset.id))
  check(slideIds.join(',') === 'B1,B2,B3', `슬라이드 3장 B1,B2,B3 · 비활성 B4 없음 (${slideIds.join(',')})`)
  check(/^1\s*\/\s*3/.test(await textOf('[data-t="hero-counter"]')), `카운터 1/3 (${JSON.stringify(await textOf('[data-t="hero-counter"]'))})`)
  const s1 = await textOf('[data-t="hero-slide"][data-id="B1"]')
  check(s1.includes('모비에게 바로 물어보세요') && s1.includes('24시간 언제든'), '1번 배너 문구: 모비에게 바로 물어보세요 · 24시간 언제든')
  check((await count('[data-t="hero-slide"][data-id="B1"] button:has-text("모비와 상담하기")')) === 1, '1번 배너 CTA 모비와 상담하기(chat)')
  await page.locator('[aria-label="다음 배너"]').click(); await page.waitForTimeout(700)
  check((await attrOf('[data-t="hero-banner"]', 'data-index')) === '1', `다음 배너 클릭 → data-index=1 (${await attrOf('[data-t="hero-banner"]', 'data-index')})`)
  check(/^2\s*\/\s*3/.test(await textOf('[data-t="hero-counter"]')), `카운터 2/3 (${JSON.stringify(await textOf('[data-t="hero-counter"]'))})`)
  check((await textOf('[data-t="hero-slide"][data-id="B2"]')).includes('152만원+'), '2번 배너 문구: 152만원+')
  check((await textOf('[data-t="hero-slide"][data-id="B3"]')).includes('렌트/리스'), '3번 배너 문구: 렌트/리스')
  check((await attrOf('[aria-label="이전 배너"]', 'aria-label')) === '이전 배너', '이전 배너 버튼 존재')
  // 이미지 — 자체 호스팅(/assets/)만. 이 컨테이너엔 파일이 없어 SafeImg 가 <img> 를 떼어내므로 DOM + 스토어 두 겹으로 본다
  const slideImgs = await page.locator('[data-t="hero-slide"] img').evaluateAll((imgs) => imgs.map((i) => i.getAttribute('src')))
  check(slideImgs.every((s) => s.startsWith('/assets/')), `배너 <img> src 전부 /assets/ (${slideImgs.length}개: ${slideImgs.join(' ')})`)
  const dbBanners = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('moduon_db_v1')).banners.map((b) => ({ id: b.id, active: b.active, image: b.image })) } catch { return [] } })
  check(dbBanners.filter((b) => b.active).length === 3 && dbBanners.every((b) => /^\/assets\/[\w.-]+$/.test(b.image)), `스토어 배너 이미지 전부 /assets/ 경로 (${dbBanners.map((b) => b.image).join(' ')})`)
  const html = await page.content()
  check(!html.includes('cloudfront'), '페이지에 cloudfront 없음')
  // 자동 롤링 — 호버·포커스가 멈추게 하므로 마우스를 여백으로 빼고 새로 연다
  const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  check(!reduced, '브라우저 reduced-motion 아님')
  await page.mouse.move(2, 600)
  await goto('/')
  await page.mouse.move(2, 600)
  const idx0 = await attrOf('[data-t="hero-banner"]', 'data-index')
  await page.waitForTimeout(6500)
  const idx1 = await attrOf('[data-t="hero-banner"]', 'data-index')
  check(idx0 === '0' && idx1 !== '0', `자동 롤링 6.5초 후 인덱스 변화 (${idx0} → ${idx1})`)

  // ───────────────────────────── ⑥ 아이콘 행 ─────────────────────────────
  await goto('/')
  const tiles = await page.locator('[data-t="site-tiles"] a').evaluateAll((as) => as.map((a) => {
    const img = a.querySelector('img')
    const label = a.querySelector(':scope > span:last-child')?.innerText.trim() ?? ''
    // 이미지 못 받으면 라벨 첫 글자 원형으로 폴백 — 배지(사업자)는 제외하고 원형 안 글자만 본다
    const circle = [...a.querySelectorAll('span')].find((s) => s.innerText.trim() === label[0] && s !== a.querySelector(':scope > span:last-child'))
    return { href: a.getAttribute('href'), label, img: img ? img.getAttribute('src') : null, fallback: circle ? circle.innerText.trim() : null }
  }))
  check(tiles.length === 6, `아이콘 행 6개 (${tiles.length})`)
  check(tiles.map((t) => t.href).join(',') === '/category/phone,/category/rental,/category/internet,/cars,/partner,/benefits', `아이콘 href 순서 (${tiles.map((t) => t.href).join(',')})`)
  check(tiles.map((t) => t.label).join(',') === '휴대폰,가전렌탈,인터넷,렌트/리스,매장패키지,모두온혜택', `아이콘 라벨 6종 (${tiles.map((t) => t.label).join(',')})`)
  check(tiles.every((t) => (t.img ? /^\/assets\/tile-[\w-]+\.png$/.test(t.img) : t.fallback === t.label[0])),
    `아이콘 이미지 /assets/tile-*.png 또는 첫 글자 폴백 (${tiles.map((t) => t.img ?? `[${t.fallback}]`).join(' ')})`)
  check((await count('[data-t="site-tiles"] a[href="/partner"] span:text-is("사업자")')) === 1, '매장패키지 타일 사업자 배지')
  await page.locator('[data-t="site-tiles"] a[href="/category/phone"]').click(); await page.waitForTimeout(600)
  check(pathOf() === '/category/phone', `휴대폰 타일 → /category/phone (${pathOf()})`)

  // ───────────────────────────── ⑦ 지원금 섹션 ─────────────────────────────
  await goto('/')
  const sup = await textOf('[data-t="support-section"]')
  check(sup.includes('152만원+'), '지원금 총액 152만원+')
  for (const chip of ['휴대폰 45만원+', '인터넷/TV 47만원+', '정수기 30만원+', '가전렌탈 30만원+']) check(sup.includes(chip), `지원금 칩: ${chip}`)
  for (const title of ['가만히 있으면', '챗봇 NO', '한 번 맺은 인연']) check(sup.includes(title), `지원금 카드 제목: ${title}`)
  check(sup.includes('만기일이 언제였더라'), '말풍선: 만기일이 언제였더라')
  const total = Number((sup.match(/최대\s*(\d+)만원\+/) ?? [])[1])
  const parts = [...sup.matchAll(/(휴대폰|인터넷\/TV|정수기|가전렌탈)\s*(\d+)만원\+/g)].map((m) => Number(m[2]))
  const sum = parts.reduce((s, n) => s + n, 0)
  check(parts.length === 4 && sum === 152 && sum === total, `합계 검증 ${parts.join('+')} = ${sum} (표기 ${total})`)

  // ───────────────────────────── ⑧ 바로 상담하기 분기 ─────────────────────────────
  const cta = page.locator('[data-t="cta-split"] button[aria-expanded]', { hasText: '바로 상담하기' })
  check((await cta.count()) === 1 && (await cta.getAttribute('aria-expanded')) === 'false', 'CTA 바로 상담하기 초기 aria-expanded=false')
  check((await count('[data-t="cta-mobi"]')) === 0 && (await count('[data-t="cta-human"]')) === 0, 'CTA 분기 초기 닫힘')
  await cta.click(); await page.waitForTimeout(400)
  check((await cta.getAttribute('aria-expanded')) === 'true', 'CTA 클릭 → aria-expanded=true')
  check((await visible('[data-t="cta-mobi"]')) && (await visible('[data-t="cta-human"]')), 'CTA 분기: cta-mobi · cta-human 표시')
  check((await attrOf('[data-t="cta-human"]', 'href')) === '/consult', `cta-human href=/consult (${await attrOf('[data-t="cta-human"]', 'href')})`)
  check((await textOf('[data-t="cta-mobi"]')).includes('모비') && (await textOf('[data-t="cta-human"]')).includes('전문컨설턴트'), 'CTA 분기 라벨: 모비 · 전문컨설턴트')
  check(!(await chatOpen()), '챗 위젯 아직 닫힘')
  await page.locator('[data-t="cta-mobi"]').click(); await page.waitForTimeout(600)
  check(await chatOpen(), 'cta-mobi 클릭 → 챗 위젯 열림')

  // ───────────────────────────── ⑨ 숨김 ≠ 삭제 ─────────────────────────────
  for (const p of ['/payouts', '/calculator', '/support', '/shop', '/diagnosis']) {
    await goto(p)
    check(pathOf() === p, `숨긴 페이지 직접 접근 유지: ${p} (${pathOf()})`)
  }
  // GNB 에서 빠진 /support 로 가는 통로 — 푸터 · 햄버거 패널(플로팅 패널은 1920 블록에서)
  await goto('/')
  check((await count('footer a[href="/support"]')) === 1, `푸터 고객센터 → /support (${await count('footer a[href="/support"]')})`)
  await page.locator('[data-t="hamburger"]').click(); await page.waitForTimeout(300)
  check((await count('[data-t="hamburger-panel"] a[href="/support"]')) === 1, `햄버거 패널 고객센터 → /support (${await count('[data-t="hamburger-panel"] a[href="/support"]')})`)
  await page.keyboard.press('Escape'); await page.waitForTimeout(200)
  // /calculator 스티키 합계 카드 — 2행 헤더(≈111px) 밑에 묻히지 않게: 400px 스크롤 후 aside top ≥ header bottom
  await goto('/calculator')
  await page.evaluate(() => window.scrollTo(0, 400)); await page.waitForTimeout(350)
  const stk = await page.evaluate(() => {
    const h = document.querySelector('header')?.getBoundingClientRect()
    const a = document.querySelector('main aside.sticky')?.getBoundingClientRect()
    return h && a ? { hb: h.bottom, at: a.top, ah: a.height, sy: window.scrollY } : null
  })
  check(!!stk && stk.sy >= 300 && stk.ah > 0 && stk.at >= stk.hb, `/calculator 400px 스크롤 후 스티키 카드 top(${Math.round(stk?.at ?? -1)}) ≥ 헤더 bottom(${Math.round(stk?.hb ?? -1)}) (scrollY ${Math.round(stk?.sy ?? -1)})`)

  // ───────────────────────────── ④ 플로팅 패널 — 1920 여백 모드 ─────────────────────────────
  await openPage({ width: 1920, height: 1000 })
  check(await visible('[data-t="floating-panel"]'), '1920: 플로팅 패널 기본 펼침')
  check((await count('[data-t="floating-tab"]')) === 0, '1920: 접힘 탭 없음')
  const fp = await textOf('[data-t="floating-panel"]')
  // '24시간' 은 모비 채널에만, 전화는 고객센터와 같은 HQ_HOURS_SHORT(평일 09:00–18:00) — 대표번호가 24시간으로 읽히지 않게 채널별 칩
  for (const s of ['무료회원가입 혜택', '모비와 실시간 상담', '전문컨설턴트 상담', '우리집 맞춤 상품 찾기', '1522-0000', '모비 24시간 무료상담', '평일 09:00–18:00']) check(fp.includes(s), `플로팅 패널 문구: ${s}`)
  check((await attrOf('[data-t="floating-panel"] a[href^="tel:"]', 'href')) === 'tel:15220000', '플로팅 대표번호 tel: 링크')
  check((await count('[data-t="floating-panel"] a[href="/support"]')) === 1, '플로팅 패널 고객센터 → /support')
  check((await attrOf('[data-t="floating-panel"] a[href="/benefits/signup"]', 'href')) === '/benefits/signup', '무료회원가입 혜택 → /benefits/signup')
  await page.locator('[data-t="floating-panel"] button', { hasText: '모비와 실시간 상담' }).click(); await page.waitForTimeout(600)
  check(await chatOpen(), '플로팅 패널 모비와 실시간 상담 → 챗 위젯 열림')
  await page.locator('[data-t="floating-panel"] button[aria-label="패널 접기"]').click(); await page.waitForTimeout(300)
  check((await count('[data-t="floating-panel"]')) === 0 && (await visible('[data-t="floating-tab"]')), '1920: 접기 → 탭만 남음')
  await page.locator('[data-t="floating-tab"]').click(); await page.waitForTimeout(300)
  check(await visible('[data-t="floating-panel"]'), '1920: 탭 클릭 → 다시 펼침')

  // ───────────────────────────── ④ 플로팅 패널 — 1440 오버레이 모드 ─────────────────────────────
  await openPage({ width: 1440, height: 900 })
  check((await visible('[data-t="floating-tab"]')) && (await count('[data-t="floating-panel"]')) === 0, '1440: 탭만 보임(패널 접힘)')
  check((await textOf('[data-t="floating-tab"]')).includes('상담하기'), '1440: 탭 문구 상담하기')
  await page.locator('[data-t="floating-tab"]').click(); await page.waitForTimeout(300)
  check(await visible('[data-t="floating-panel"]'), '1440: 탭 클릭 → 패널 펼침')
  check((await textOf('[data-t="floating-panel"]')).includes('1522-0000'), '1440: 펼친 패널에 대표번호')
  await clickOutside()
  check((await count('[data-t="floating-panel"]')) === 0 && (await visible('[data-t="floating-tab"]')), '1440: 바깥 클릭 → 접힘')

  // ───────────────────────────── ⑩ 모바일 390 (+ ④ 플로팅 미렌더) ─────────────────────────────
  await openPage({ width: 390, height: 800 })
  check((await count('[data-t="floating-panel"]')) === 0 && (await count('[data-t="floating-tab"]')) === 0, '390: 플로팅 패널·탭 없음')
  check(!(await visible('[data-t="util-nav"]')), '390: 유틸행 숨김')
  check((await count('[data-t="main-nav"] a')) === 6, `390: 본 GNB 링크 6개 (${await count('[data-t="main-nav"] a')})`)
  const scroll = await page.locator('[data-t="main-nav"]').evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth, ox: getComputedStyle(el).overflowX }))
  check(scroll.sw > scroll.cw && /auto|scroll/.test(scroll.ox), `390: 본 GNB 가로 스크롤 (${scroll.sw} > ${scroll.cw}, ${scroll.ox})`)
  check((await count('[data-t="hero-banner"]')) === 1, '390: 배너 존재')
  // 배너 CTA 가 31px 로 찌그러지던 회귀 — 슬라이드 3장의 CTA(button/a) 높이 전부 ≥ 40
  const ctaH = await page.locator('[data-t="hero-slide"] :is(button, a)').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)))
  check(ctaH.length === 3 && ctaH.every((h) => h >= 40), `390: 배너 CTA 3개 높이 ≥ 40 (${ctaH.join('/')})`)
  // 🔔 패널 — 종 버튼 기준 right-0 이면 왼쪽이 뷰포트 밖으로 잘리던 회귀: 좌우 16px 여백 안에
  await page.locator('[data-t="cnotif"]').click(); await page.waitForTimeout(300)
  const npb = await page.locator('[data-t="cnotif-panel"]').boundingBox().catch(() => null)
  check(!!npb && npb.x >= 16 && npb.x + npb.width <= 374, `390: 알림 패널 뷰포트 안(좌우 16px) (x ${Math.round(npb?.x ?? -1)} · w ${Math.round(npb?.width ?? 0)})`)
  await page.keyboard.press('Escape'); await page.waitForTimeout(200)
  check((await count('[data-t="cnotif-panel"]')) === 0, '390: Escape → 알림 패널 닫힘')
  await page.locator('[data-t="hamburger"]').click(); await page.waitForTimeout(300)
  check(await visible('[data-t="hamburger-panel"]'), '390: ☰ 클릭 → 패널 표시')
  const mGrid = await page.locator('[data-t="hamburger-panel"] .grid a:visible').evaluateAll((as) => as.map((a) => a.getAttribute('href')))
  check(mGrid.includes('/cars') && mGrid.includes('/benefits'), `390: 패널 그리드에 렌트/리스·모두온혜택 덧붙음 (${mGrid.join(' ')})`)

  // ───────────────────────────── ⑪ 파트너몰 /m/happynet — 헤더(매장 직통·무료 상담) · 배너 CTA 전부 파트너 상담 · 후기 링크 누수 0 ─────────────────────────────
  await openPage({ width: 1440, height: 900 }, '/m/happynet')
  check((await attrOf('header [data-t="tenant-tel"]', 'href')) === 'tel:01023114821', `파트너몰 헤더 매장 직통 tel: (${await attrOf('header [data-t="tenant-tel"]', 'href')})`)
  check((await count('header [data-t="cnotif"]')) === 0 && !/로그인\/회원가입/.test(await textOf('header')), '파트너몰 헤더에 🔔·로그인 없음(본진 전용)')
  check((await attrOf('[data-t="hero-banner"]', 'data-total')) === '2', `파트너몰 배너 data-total=2 (tenant.cats 밖 B3 제외) (${await attrOf('[data-t="hero-banner"]', 'data-total')})`)
  const tCta = await page.locator('[data-t="hero-slide"] :is(button, a)').evaluateAll((els) => els.map((e) => e.getAttribute('href') ?? `<${e.tagName.toLowerCase()}>`))
  check(tCta.length === 2 && tCta.every((h) => h.startsWith('/consult?src=happynet')), `파트너몰 배너 CTA 전부 /consult?src=happynet (${tCta.join(' ')})`)
  check((await count('main a[href^="/board/review"]')) === 0, `파트너몰 main 안 /board/review 링크 0 (${await count('main a[href^="/board/review"]')})`)
  await page.locator('header [data-t="tenant-consult"]').click(); await page.waitForTimeout(500)
  check(pathOf() === '/consult' && new URL(page.url()).searchParams.get('src') === 'happynet', `파트너몰 무료 상담 → /consult?src=happynet (${page.url().replace(BASE, '')})`)
  await openPage({ width: 390, height: 800 }, '/m/happynet')
  check(await visible('header [data-t="tenant-tel"]'), '390 파트너몰: 매장 직통 전화 아이콘 보임')
  check(!(await visible('header [data-t="tenant-consult"]')), '390 파트너몰: 무료 상담 버튼은 sm 미만 생략(본문 CTA 가 같은 경로)')
  const tOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
  check(tOverflow, '390 파트너몰: 가로 넘침 없음')

  // ───────────────────────────── ⑫ pageerror ─────────────────────────────
  check(errors.length === 0, `콘솔 pageerror 0건${errors.length ? ' — ' + errors.join(' | ') : ''}`)

  await browser.close()
  console.log(fail === 0 ? 'SMOKE: ALL PASS' : `SMOKE: ${fail} FAIL`)
  process.exit(fail === 0 ? 0 : 1)
})()
