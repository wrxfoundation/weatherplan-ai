// 스모크 — 어드민 콘텐츠·고객소통(배너·게시판·불편접수·혜택 설정)이 소비자 화면에 실제로 반영되는지
// 어드민에서 바꾸고(→ localStorage moduon_db_v1) 소비자 화면으로 완전 이동(goto)해 같은 스토어를 읽는지 본다.
// 세션은 localStorage moduon_session_v1 = {"role":"admin"} 를 직접 주입하고, 시작 시 moduon_db_v1 을 지워 시드(v11)에서 출발한다.
// 뷰포트 1440×950 — 어드민 사이드바(lg)·불편접수 상세 패널(lg)이 드로어가 아닌 패널로 뜨는 폭.
let pw
try { pw = require('/opt/node22/lib/node_modules/playwright') } catch { pw = require('playwright') }
// 여러 스모크를 병렬로 돌릴 때 각자 다른 프리뷰 포트를 쓸 수 있게 — 기본은 qa-all 이 띄우는 4173
const BASE = process.env.QA_BASE ?? 'http://localhost:4173'

;(async () => {
  const browser = await pw.chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))

  let fail = 0
  const check = (ok, label) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`) }
  // 요소 하나가 깨져도 뒤 단언이 살도록 — 읽기 헬퍼는 전부 try/catch
  const text = async (sel) => { try { return await page.locator(sel).first().innerText({ timeout: 2000 }) } catch { return '' } }
  const bodyText = async () => { try { return await page.evaluate(() => document.body.innerText) } catch { return '' } }
  const count = async (sel) => { try { return await page.locator(sel).count() } catch { return -1 } }
  const attrs = async (sel, name) => { try { return await page.locator(sel).evaluateAll((els, n) => els.map((e) => e.getAttribute(n)), name) } catch { return [] } }
  const attr = async (sel, name) => { try { return await page.locator(sel).first().getAttribute(name, { timeout: 2000 }) } catch { return null } }
  const rowTexts = async (sel) => { try { return await page.locator(sel).allInnerTexts() } catch { return [] } }
  const wait = (ms) => page.waitForTimeout(ms)
  const tail = () => page.url().replace(BASE, '')
  const go = async (path) => {
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('main, header', { timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(350)
  }
  const waitFor = async (sel, ms = 5000) => page.waitForSelector(sel, { timeout: ms }).catch(() => {})
  // 토스트 — 문구가 뜰 때까지(최대 2.5s) 기다렸다가 읽는다. 2.8s 뒤 사라지므로 클릭 직후 호출
  const waitToast = async (re) => {
    try { await page.locator('[role="status"]', { hasText: re }).waitFor({ timeout: 2500 }) } catch { /* 아래에서 현재 문구를 그대로 읽는다 */ }
    return text('[role="status"]')
  }
  // KPI 카드 값 — 라벨(정확 일치)로 카드를 찾아 .tnum 값을 읽는다. useCountUp 이 0→목표로 600ms 애니메이션하므로
  // 기대값과 같아질 때까지(최대 1.6s) 폴링한다. 반환은 숫자(파싱 실패 시 NaN).
  const kpi = async (label, expect) => {
    const read = () => page.evaluate((lab) => {
      const els = [...document.querySelectorAll('div')].filter((d) => d.childElementCount === 0 && d.textContent.trim() === lab)
      for (const el of els) {
        const v = el.closest('.animate-rise')?.querySelector('.tnum')
        if (v) return v.textContent.trim()
      }
      return ''
    }, label).catch(() => '')
    let v = NaN
    for (let i = 0; i < 8; i++) {
      v = parseInt((await read()).replace(/[^\d-]/g, ''), 10)
      if (v === expect) return v
      await wait(200)
    }
    return v
  }
  const db = () => page.evaluate(() => { try { return JSON.parse(localStorage.getItem('moduon_db_v1')) } catch { return null } }).catch(() => null)
  // 감사로그 행의 행위 칩 — 필터 칩은 <button>, 행은 <span> 이라 span 만 센다(정확 일치)
  const auditRows = async (action) => { try { return await page.locator('span.rounded-full', { hasText: new RegExp(`^${action}$`) }).count() } catch { return -1 } }
  const audit = async (section, actions) => {
    await go('/admin/audit')
    for (const a of actions) {
      const n = await auditRows(a)
      check(n >= 1, `${section} 감사로그 '${a}' 행 (${n})`)
    }
  }

  // ────────────────────────────────────────────────────────────────
  // 세션 주입 + 시드 초기화 — origin 에 올라와야 localStorage 를 만질 수 있어 /login 으로 먼저 진입
  // ────────────────────────────────────────────────────────────────
  await go('/login')
  await page.evaluate(() => {
    try {
      localStorage.setItem('moduon_session_v1', JSON.stringify({ role: 'admin' }))
      ;['moduon_db_v1', 'moduon_notif_sig', 'moduon_cnotif_sig', 'moduon_fp_open', 'moduon_points', 'moduon_signup_claimed'].forEach((k) => localStorage.removeItem(k))
      sessionStorage.clear()
    } catch { /* noop */ }
  })

  // ────────────────────────────────────────────────────────────────
  // ① 배너 관리 — 순서(↓) · 노출 토글 · 제목 편집이 홈 롤링 배너에 반영
  // ────────────────────────────────────────────────────────────────
  await go('/admin/banners')
  await waitFor('[data-t="admin-banners"]')
  check((await count('[data-t="admin-banners"]')) === 1, '① admin-banners 렌더')
  // 레이아웃 툴바(검색·🔔)가 페이지 h1 우측 액션(새 배너)을 덮던 회귀 — 세로 겹침 0 + 버튼 상단 4px 지점의 elementFromPoint 가 버튼 자신
  const newBtn = page.locator('main button', { hasText: /^새 배너$/ }).first()
  const nbBox = await newBtn.boundingBox().catch(() => null)
  const searchBox = await page.locator('main button[aria-label="빠른 검색 열기"]').boundingBox().catch(() => null)
  const bellBox = await page.locator('main button[aria-label="알림"]').first().boundingBox().catch(() => null)
  const overlapY = (a, b) => !!a && !!b && a.y < b.y + b.height && b.y < a.y + a.height
  check(!!nbBox && !!searchBox && !!bellBox && !overlapY(nbBox, searchBox) && !overlapY(nbBox, bellBox),
    `① '새 배너'(y${Math.round(nbBox?.y ?? -1)}~${Math.round((nbBox?.y ?? 0) + (nbBox?.height ?? 0))}) 가 툴바 검색·🔔(y${Math.round(searchBox?.y ?? -1)}~${Math.round((searchBox?.y ?? 0) + (searchBox?.height ?? 0))}) 와 세로 겹침 없음`)
  const hit = nbBox ? await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.innerText.trim() ?? null, { x: nbBox.x + nbBox.width / 2, y: nbBox.y + 4 }).catch(() => null) : null
  check(hit === '새 배너', `① 버튼 상단 4px 지점 elementFromPoint = 새 배너 (${hit})`)
  // 사이드바 헤더 — 224px 안에서 워드마크·'HQ 관제' 배지가 각각 한 줄(두 줄로 꺾이지 않음)
  const sb = await page.evaluate(() => {
    const aside = document.querySelector('aside')
    const badge = [...aside?.querySelectorAll('span') ?? []].find((e) => e.textContent.trim() === 'HQ 관제')
    // 로고가 정식 이미지(logo-moduon.png)로 바뀌었다 — 워드마크 텍스트 대신 로고 <img> 의 높이를 본다
    const word = aside?.querySelector('img[alt*="MODUON"]')
    if (!badge || !word) return null
    const wr = word.getBoundingClientRect(), br = badge.getBoundingClientRect()
    return { wordH: wr.height, lh: 44, badgeH: br.height, badgeRight: br.right, asideW: aside.getBoundingClientRect().width }
  }).catch(() => null)
  check(!!sb && sb.wordH > 0 && sb.wordH <= sb.lh, `① 사이드바 로고 이미지 한 줄 (h ${Math.round(sb?.wordH ?? -1)} ≤ ${sb?.lh ?? 0})`)
  check(!!sb && sb.badgeH < 24 && sb.badgeRight <= sb.asideW, `① 'HQ 관제' 배지 한 줄·사이드바 안 (h ${Math.round(sb?.badgeH ?? -1)} · right ${Math.round(sb?.badgeRight ?? -1)} ≤ ${Math.round(sb?.asideW ?? 0)})`)
  let ids = await attrs('[data-t="banner-row"]', 'data-id')
  check(ids.join() === 'B1,B2,B3,B4,B5,B6,B7', `① banner-row 7개 order 순 (${ids.join()})`)
  const seedDb = await db()
  const seedOrders = (seedDb?.banners ?? []).map((b) => `${b.id}:${b.order}`).join(',')
  check(seedOrders === 'B1:0,B2:1,B3:2,B4:3,B5:4,B6:5,B7:6', `① 시드 order 0..6 (${seedOrders})`)
  check((await attr('[data-t="banner-row"][data-id="B5"] [data-t="banner-toggle"]', 'aria-checked')) === 'false', '① B5(예비) 토글 off')
  check((await attr('[data-t="banner-row"][data-id="B1"] [data-t="banner-toggle"]', 'aria-checked')) === 'true', '① B1 토글 on')
  check((await kpi('노출 중 배너', 4)) === 4, '① KPI 노출 중 배너 4')

  // B1 ↓ → B2,B1
  await page.locator('[data-t="banner-row"][data-id="B1"] [data-t="banner-down"]').click()
  await wait(300)
  ids = await attrs('[data-t="banner-row"]', 'data-id')
  check(ids.join() === 'B2,B1,B3,B4,B5,B6,B7', `① B1 아래로 → 표 순서 B2,B1 (${ids.join()})`)
  const afterMove = await db()
  const o = (id) => afterMove?.banners?.find((b) => b.id === id)?.order
  check(o('B2') === 0 && o('B1') === 1, `① 스토어 order B2=0 · B1=1 (${o('B2')}/${o('B1')})`)
  await go('/')
  await waitFor('[data-t="hero-banner"]')
  let slides = await attrs('[data-t="hero-slide"]', 'data-id')
  check(slides[0] === 'B2', `① 홈 hero-slide 첫 data-id B2 (${slides.join()})`)
  check((await attr('[data-t="hero-banner"]', 'data-total')) === '4', `① 홈 hero-banner data-total 4 (${await attr('[data-t="hero-banner"]', 'data-total')})`)

  // B4 노출 on → 홈 4장
  await go('/admin/banners')
  await waitFor('[data-t="admin-banners"]')
  await page.locator('[data-t="banner-row"][data-id="B5"] [data-t="banner-toggle"]').click()
  let toast = await waitToast(/노출을 켰어요/)
  check(toast.includes('노출을 켰어요') && toast.includes('반영'), `① B5 토글 토스트 (${toast || '없음'})`)
  check((await attr('[data-t="banner-row"][data-id="B5"] [data-t="banner-toggle"]', 'aria-checked')) === 'true', '① B5 토글 on 으로')
  await go('/')
  await waitFor('[data-t="hero-banner"]')
  const total4 = await attr('[data-t="hero-banner"]', 'data-total')
  slides = await attrs('[data-t="hero-slide"]', 'data-id')
  check(total4 === '5' && slides.join() === 'B2,B1,B3,B4,B5', `① 홈 hero-banner data-total 5 · 슬라이드 B2,B1,B3,B4,B5 (${total4} · ${slides.join()})`)
  check(/^1\/5/.test((await text('[data-t="hero-counter"]')).trim()), `① hero-counter 1/5 (${(await text('[data-t="hero-counter"]')).trim()})`)

  // B2 제목 편집 → 홈 슬라이드 문구
  await go('/admin/banners')
  await waitFor('[data-t="admin-banners"]')
  await page.locator('[data-t="banner-row"][data-id="B2"] [data-t="banner-edit"]').click()
  await waitFor('[data-t="banner-drawer"]')
  const bd = page.locator('[data-t="banner-drawer"]')
  check((await count('[data-t="banner-drawer"]')) === 1, '① banner-drawer 열림')
  const BT = '테스트 배너 제목'
  await bd.locator('textarea').first().fill(BT)
  await wait(150)
  check((await text('[data-t="banner-drawer"]')).includes(BT), '① 드로어 미리보기에 새 제목 반영')
  await bd.locator('[data-t="banner-save"]').click()
  toast = await waitToast(/반영/)
  check(toast.includes('수정') && toast.includes('반영'), `① 배너 저장 토스트 '반영' (${toast || '없음'})`)
  await wait(250)
  check((await count('[data-t="banner-drawer"]')) === 0, '① 저장 후 드로어 닫힘')
  check((await text('[data-t="banner-row"][data-id="B2"]')).includes(BT), '① 표 B2 행에 새 제목')
  await go('/')
  await waitFor('[data-t="hero-banner"]')
  const slideB2 = await text('[data-t="hero-slide"][data-id="B2"]')
  check(slideB2.includes(BT), `① 홈 B2 슬라이드(첫 장)에 '${BT}'`)
  check(!(await text('[data-t="hero-slide"][data-id="B1"]')).includes(BT), '① 다른 슬라이드(B1)는 그대로')
  await audit('①', ['배너 수정'])

  // ────────────────────────────────────────────────────────────────
  // ② 게시판 관리 — 답변 · 고정 · 숨김 · 공지 등록이 소비자 게시판/🔔 에 반영
  // ────────────────────────────────────────────────────────────────
  await go('/admin/boards/qna')
  await waitFor('[data-t="admin-boards"]')
  check((await count('[data-t="admin-boards"]')) === 1, '② admin-boards 렌더')
  const tabs = await attrs('[data-t="board-tab"]', 'data-board')
  check(tabs.length === 5 && !tabs.includes('complaint') && tabs.join() === 'review,qna,tip,event,notice', `② board-tab 5개 · complaint 없음 (${tabs.join()})`)
  check((await attr('[data-t="board-tab"][data-board="qna"]', 'aria-current')) === 'page', '② qna 탭 활성')
  check((await kpi('미답변 질문', 2)) === 2, '② KPI 미답변 2 (PQ4·PQ5)')
  check(/2/.test(await text('[data-t="board-tab"][data-board="qna"]')), '② qna 탭 배지 2')

  // PQ4 답변
  await page.locator('[data-t="admin-post-row"][data-id="PQ4"] [data-t="post-answer-btn"]').click()
  await waitFor('[data-t="post-answer-drawer"]')
  const ad = page.locator('[data-t="post-answer-drawer"]')
  check((await text('[data-t="post-answer-drawer"]')).includes('렌트/리스 견적은 실제 금액인가요?'), '② 답변 드로어에 PQ4 질문')
  check((await attr('[data-t="post-answer-drawer"] [data-t="post-answer-save"]', 'disabled')) !== null, '② 답변 비어 있으면 등록 비활성')
  const ANS = '테스트 답변입니다'
  await ad.locator('textarea').fill(ANS)
  await ad.locator('[data-t="post-answer-save"]').click()
  toast = await waitToast(/답변을 등록/)
  check(toast.includes('답변을 등록'), `② 답변 등록 토스트 (${toast || '없음'})`)
  await wait(250)
  const rowPQ4 = await text('[data-t="admin-post-row"][data-id="PQ4"]')
  check(rowPQ4.includes('답변완료') && rowPQ4.includes('답변 수정'), `② PQ4 행 상태 답변완료 · 버튼 '답변 수정' (${rowPQ4.split('\n').filter((s) => /답변/.test(s)).join(' / ')})`)
  check((await kpi('미답변 질문', 1)) === 1, '② KPI 미답변 1')
  const storedPQ4 = (await db())?.posts?.find((p) => p.id === 'PQ4')
  check(storedPQ4?.status === '답변완료' && storedPQ4?.answer?.body === ANS, `② 스토어 PQ4 답변완료 + answer (${storedPQ4?.status})`)
  await go('/board/qna/PQ4')
  await waitFor('[data-t="post-detail"]')
  check((await text('[data-t="post-answer"]')).includes(ANS), `② 소비자 /board/qna/PQ4 post-answer 에 '${ANS}'`)
  check((await count('[data-t="post-answer-pending"]')) === 0, '② 답변 대기 블록 사라짐')

  // PQ3 고정 → 소비자 목록 고정 구간
  await go('/admin/boards/qna')
  await waitFor('[data-t="admin-boards"]')
  await page.locator('[data-t="admin-post-row"][data-id="PQ3"] [data-t="post-pin"]').click()
  toast = await waitToast(/고정/)
  check(toast.includes('상단에 고정'), `② PQ3 고정 토스트 (${toast || '없음'})`)
  await wait(250)
  check((await attr('[data-t="admin-post-row"][data-id="PQ3"] [data-t="post-pin"]', 'aria-pressed')) === 'true', '② PQ3 pin aria-pressed')
  ids = await attrs('[data-t="admin-post-row"]', 'data-id')
  check(ids.slice(0, 2).includes('PQ3') && ids.slice(0, 2).includes('PQ2'), `② 어드민 표 상단 2행 = 고정(PQ2·PQ3) (${ids.slice(0, 3).join()})`)
  check((await kpi('고정 글', 2)) === 2, '② KPI 고정 글 2')
  await go('/board/qna')
  await waitFor('[data-t="board-list"]')
  let hrefs = await attrs('[data-t="board-row"] a', 'href')
  let rows = await rowTexts('[data-t="board-row"]')
  check(hrefs.slice(0, 2).includes('/board/qna/PQ3'), `② 소비자 /board/qna 첫 두 행 안에 PQ3 (${hrefs.slice(0, 3).join()})`)
  check(/고정/.test(rows[0] ?? '') && /고정/.test(rows[1] ?? '') && !/고정/.test(rows[2] ?? ''), '② 고정 칩 두 행만')

  // PT1 숨김 → 소비자 꿀팁 목록에서 사라지고 어드민엔 남는다
  await go('/admin/boards/tip')
  await waitFor('[data-t="admin-boards"]')
  await page.locator('[data-t="admin-post-row"][data-id="PT1"] [data-t="post-edit"]').click()
  await waitFor('[data-t="post-edit-drawer"]')
  const ed = page.locator('[data-t="post-edit-drawer"]')
  check((await ed.locator('input:not([type="checkbox"])').first().inputValue().catch(() => '')).includes('인터넷 약정 만기'), '② 편집 드로어에 PT1 제목')
  await ed.locator('select').selectOption('숨김')
  await ed.locator('[data-t="post-save"]').click()
  toast = await waitToast(/수정했어요/)
  check(toast.includes('수정했어요') && toast.includes('반영'), `② PT1 수정 토스트 (${toast || '없음'})`)
  await wait(250)
  const rowPT1 = await text('[data-t="admin-post-row"][data-id="PT1"]')
  check(rowPT1.includes('숨김') && rowPT1.includes('인터넷 약정 만기'), `② 어드민 표에 PT1 남아 있고 상태 숨김 (숨김≠삭제)`)
  await go('/board/tip')
  await waitFor('[data-t="board-list"]')
  hrefs = await attrs('[data-t="board-row"] a', 'href')
  rows = await rowTexts('[data-t="board-row"]')
  check(rows.length >= 4 && !hrefs.includes('/board/tip/PT1') && !rows.some((r) => r.includes('인터넷 약정 만기 3개월')), `② 소비자 /board/tip 에 PT1 없음 (${rows.length}행)`)
  await go('/board/tip/PT1')
  check((await count('[data-t="post-detail"]')) === 0, '② 숨긴 글 직접 URL 도 상세 미노출')

  // 공지 등록 → 소비자 공지 목록(고정 아래 첫 행) · 헤더 🔔 패널
  await go('/admin/boards/notice')
  await waitFor('[data-t="admin-boards"]')
  await page.locator('[data-t="post-new"]').click()
  await waitFor('[data-t="post-edit-drawer"]')
  const nd = page.locator('[data-t="post-edit-drawer"]')
  check((await attr('[data-t="post-edit-drawer"] [data-t="post-save"]', 'disabled')) !== null, '② 새 글 빈 폼은 등록 비활성')
  const NT = '스모크 공지'
  await nd.locator('input:not([type="checkbox"])').first().fill(NT)
  await nd.locator('textarea').fill('스모크에서 등록한 공지 본문입니다.')
  await nd.locator('[data-t="post-save"]').click()
  toast = await waitToast(/새 글을 등록/)
  check(toast.includes('공지사항에 새 글을 등록'), `② 공지 등록 토스트 (${toast || '없음'})`)
  await wait(250)
  const adminNotice = await rowTexts('[data-t="admin-post-row"]')
  check(adminNotice.length === 5 && (adminNotice[1] ?? '').includes(NT), `② 어드민 공지 표 5행 · 고정(PN1) 아래 첫 행이 '${NT}'`)
  await go('/board/notice')
  await waitFor('[data-t="board-list"]')
  rows = await rowTexts('[data-t="board-row"]')
  check(/고정/.test(rows[0] ?? '') && (rows[1] ?? '').includes(NT), `② 소비자 /board/notice 고정 아래 첫 행 '${NT}' (${(rows[1] ?? '').split('\n')[0]})`)
  await page.locator('[data-t="cnotif"]').click()
  await waitFor('[data-t="cnotif-panel"]', 3000)
  const panel = await text('[data-t="cnotif-panel"]')
  check(panel.includes(NT), `② 헤더 🔔 패널에 '${NT}'`)

  // 이벤트 기간 — 저장할 때마다 하루씩 밀리던 회귀(toDateInput 이 UTC ISO 로 잘라 KST 자정 전은 전날이 됨).
  // 컨테이너는 UTC 라 재현이 안 되므로 Asia/Seoul 컨텍스트를 따로 열어 PE1 을 변경 없이 2회 저장 → 드로어 date 값·행 기간 표기·스토어 값이 불변인지 본다
  {
    const kst = await browser.newContext({ viewport: { width: 1440, height: 950 }, timezoneId: 'Asia/Seoul' })
    const kp = await kst.newPage()
    kp.on('pageerror', (e) => errors.push('kst: ' + String(e)))
    await kp.goto(BASE + '/login', { waitUntil: 'domcontentloaded' })
    await kp.evaluate(() => { try { localStorage.setItem('moduon_session_v1', JSON.stringify({ role: 'admin' })); localStorage.removeItem('moduon_db_v1') } catch { /* noop */ } })
    const kstDay = (ts) => (ts ? new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ts)) : '')
    const pe1 = () => kp.evaluate(() => { try { return JSON.parse(localStorage.getItem('moduon_db_v1')).posts.find((p) => p.id === 'PE1')?.period ?? null } catch { return null } }).catch(() => null)
    const rowPeriod = async () => ((await kp.locator('[data-t="admin-post-row"][data-id="PE1"]').innerText({ timeout: 2000 }).catch(() => '')).split('\n').find((l) => l.includes('~')) ?? '').trim()
    const openPE1 = async () => {
      await kp.goto(BASE + '/admin/boards/event', { waitUntil: 'domcontentloaded' })
      await kp.waitForSelector('[data-t="admin-post-row"][data-id="PE1"] [data-t="post-edit"]', { timeout: 5000 }).catch(() => {})
      await kp.waitForTimeout(250)
      const period = await rowPeriod()
      await kp.locator('[data-t="admin-post-row"][data-id="PE1"] [data-t="post-edit"]').click()
      await kp.waitForSelector('[data-t="post-edit-drawer"] input[type="date"]', { timeout: 5000 }).catch(() => {})
      const d = kp.locator('[data-t="post-edit-drawer"] input[type="date"]')
      return { from: await d.nth(0).inputValue().catch(() => ''), to: await d.nth(1).inputValue().catch(() => ''), period }
    }
    const saveDrawer = async () => {
      await kp.locator('[data-t="post-edit-drawer"] [data-t="post-save"]').click()
      await kp.waitForSelector('[data-t="post-edit-drawer"]', { state: 'detached', timeout: 3000 }).catch(() => {})
      await kp.waitForTimeout(250)
    }
    // 시드 period 는 어드민 페이지가 뜬 뒤(스토어가 다시 시드를 써 넣은 뒤) 읽는다 — /login 에서 지운 직후엔 아직 비어 있다
    const d0 = await openPE1()
    const seed = await pe1()
    check(/^\d{4}-\d{2}-\d{2}$/.test(d0.from) && d0.from === kstDay(seed?.from) && d0.to === kstDay(seed?.to), `② KST: PE1 드로어 date = 시드 기간의 KST 달력일 (${d0.from} ~ ${d0.to} · 행 '${d0.period}')`)
    await saveDrawer()
    const p1 = await pe1()
    const d1 = await openPE1()
    await saveDrawer()
    const p2 = await pe1()
    const d2 = await openPE1()
    check(d1.from === d0.from && d1.to === d0.to && d2.from === d0.from && d2.to === d0.to, `② KST: 변경 없이 2회 저장해도 드로어 날짜 불변 (${d0.from}~${d0.to} → ${d1.from}~${d1.to} → ${d2.from}~${d2.to})`)
    check(d1.period === d0.period && d2.period === d0.period, `② KST: 어드민 행 기간 표기 불변 ('${d0.period}' → '${d1.period}' → '${d2.period}')`)
    check(!!p1 && !!p2 && p1.from === p2.from && p1.to === p2.to && kstDay(p2.from) === d0.from && kstDay(p2.to) === d0.to, `② KST: 스토어 period 2회 저장 후 동일·같은 KST 날짜 (${kstDay(p1?.from)}~${kstDay(p1?.to)} / ${kstDay(p2?.from)}~${kstDay(p2?.to)})`)
    await kst.close()
  }
  await audit('②', ['답변 등록', '게시글 등록', '게시글 수정'])

  // ────────────────────────────────────────────────────────────────
  // ③ 불편접수 인박스 — 상태 전이(접수→처리중→완료) · 답변이 소비자 '내 접수 조회' 에 반영
  // ────────────────────────────────────────────────────────────────
  await go('/admin/complaints')
  await waitFor('[data-t="admin-complaints"]')
  check((await count('[data-t="admin-complaints"]')) === 1, '③ admin-complaints 렌더')
  check((await kpi('접수', 1)) === 1 && (await kpi('처리중', 1)) === 1 && (await kpi('완료', 1)) === 1, '③ KPI 접수 1 · 처리중 1 · 완료 1')
  const crows = await page.locator('[data-t="complaint-row"]').evaluateAll((els) => els.map((e) => `${e.dataset.id}:${e.dataset.status}`)).catch(() => [])
  check(crows.length === 3 && crows.includes('PC3:접수') && crows.includes('PC1:처리중') && crows.includes('PC2:완료'), `③ complaint-row 3건 상태 (${crows.join()})`)
  // SLA 경고 규칙: status '접수' && 접수 후 24h 초과 — 시드에서 해당 건을 세어 경고 배지 수와 맞춘다 (PC1 은 처리중이라 경고 없음)
  const cdb = await db()
  const overExpected = (cdb?.posts ?? []).filter((p) => p.board === 'complaint' && p.status === '접수' && Date.now() - p.createdAt > 86400000).length
  const overShown = await page.locator('[data-t="complaint-row"]', { hasText: 'SLA 초과' }).count().catch(() => -1)
  check(overShown === overExpected, `③ SLA 초과 경고 ${overShown}건 = 규칙(접수 && 24h 초과) ${overExpected}건`)
  if (overExpected === 0) check((await bodyText()).includes('24시간 내 첫 응답 목표'), '③ 경고 0 → 접수 KPI 캡션 기본 문구')

  await page.locator('[data-t="complaint-row"][data-id="PC3"]').click()
  await wait(200)
  let detail = await text('[data-t="complaint-detail"]')
  check(detail.includes('견적 금액과 실제 청구가 달라요') && detail.includes('32,900원'), '③ PC3 선택 → complaint-detail 에 제목·본문')
  check((await attr('[data-t="complaint-row"][data-id="PC3"]', 'aria-current')) === 'true', '③ PC3 행 aria-current')
  await page.locator('[data-t="complaint-detail"] [data-t="complaint-status"][data-status="처리중"]').click()
  toast = await waitToast(/처리중/)
  check(toast.includes('처리중'), `③ 상태 변경 토스트 (${toast || '없음'})`)
  await wait(250)
  check((await attr('[data-t="complaint-row"][data-id="PC3"]', 'data-status')) === '처리중', '③ PC3 행 data-status 처리중')
  check((await attr('[data-t="complaint-detail"] [data-t="complaint-status"][data-status="처리중"]', 'aria-pressed')) === 'true', '③ 처리중 버튼 aria-pressed')
  check((await kpi('처리중', 2)) === 2 && (await kpi('접수', 0)) === 0, '③ KPI 접수 0 · 처리중 2')
  const CANS = '스모크 처리 답변입니다'
  check((await attr('[data-t="complaint-detail"] [data-t="complaint-answer-save"]', 'disabled')) !== null, '③ 답변 비어 있으면 저장 비활성')
  await page.locator('[data-t="complaint-detail"] textarea').fill(CANS)
  await page.locator('[data-t="complaint-detail"] [data-t="complaint-answer-save"]').click()
  toast = await waitToast(/완료/)
  check(toast.includes('완료'), `③ 답변 등록 토스트 (${toast || '없음'})`)
  await wait(250)
  check((await attr('[data-t="complaint-row"][data-id="PC3"]', 'data-status')) === '완료', '③ PC3 행 data-status 완료')
  check((await kpi('완료', 2)) === 2 && (await kpi('처리중', 1)) === 1, '③ KPI 완료 2 · 처리중 1')
  detail = await text('[data-t="complaint-detail"]')
  check(detail.includes('답변 등록 · 완료') && detail.includes(CANS), '③ 상세 처리 이력에 답변 등록 · 완료')
  const storedPC3 = (await db())?.posts?.find((p) => p.id === 'PC3')
  check(storedPC3?.status === '완료' && storedPC3?.answer?.body === CANS, `③ 스토어 PC3 완료 + answer (${storedPC3?.status})`)

  await go('/board/complaint')
  await waitFor('[data-t="complaint-lookup"]')
  // 조회는 이름+연락처 2조건(PC3 = 류하늘) — 결과는 상태 칩·앞 6자 마스킹 제목·답변 여부까지만(답변 전문·전체 제목 비노출)
  await page.locator('[data-t="complaint-lookup"] input[aria-label="접수한 이름"]').fill('류하늘')
  await page.locator('[data-t="complaint-lookup"] input[aria-label="접수한 연락처"]').fill('010-4455-6677')
  await page.locator('[data-t="complaint-lookup"] button[type="submit"]').click()
  await wait(300)
  const lk = await text('[data-t="complaint-lookup"]')
  check(lk.includes('견적 금액과…') && lk.includes('완료') && lk.includes('담당자가 답변했어요'), '③ 소비자 내 접수 조회 → PC3 완료 + 답변 안내(마스킹 제목)')
  check(!lk.includes(CANS) && !lk.includes('견적 금액과 실제 청구가 달라요'), '③ 조회 결과에 답변 전문·전체 제목 미노출')
  const lkChip = (await text('[data-t="complaint-lookup"] span.rounded-full')).trim()
  check(lkChip === '완료', `③ 조회 결과 상태 칩 완료 (${lkChip || '없음'})`)
  // 처리 현황 — 셀 [숫자, 라벨] 로 읽어 접수 0 · 처리중 1 · 완료 2
  let cells = []
  try { cells = (await page.locator('[data-t="complaint-status"] .grid > div').allInnerTexts()).map((c) => c.split('\n').map((x) => x.trim()).filter(Boolean)) } catch { cells = [] }
  const cnum = (label) => Number((cells.find((c) => c[1] === label) ?? [])[0] ?? -1)
  check(cnum('접수') === 0 && cnum('처리중') === 1 && cnum('완료') === 2, `③ 소비자 처리 현황 접수 0 · 처리중 1 · 완료 2 (${cells.map((c) => c.join(' ')).join(' · ') || '없음'})`)
  await audit('③', ['불편접수 처리', '불편접수 상태 변경'])

  // ────────────────────────────────────────────────────────────────
  // ④ 혜택·이벤트 설정 — 포인트·플로팅 패널 제목·버튼 노출이 허브/플로팅 패널에 반영
  // ────────────────────────────────────────────────────────────────
  await go('/admin/benefits')
  await waitFor('[data-t="admin-benefits"]')
  check((await count('[data-t="admin-benefits"]')) === 1, '④ admin-benefits 렌더')
  check((await attr('[data-t="benefits-save"]', 'disabled')) !== null, '④ 변경 없으면 benefits-save disabled')
  await page.locator('input[name="signupPoints"]').fill('7000')
  await page.locator('input[name="floatingTitle"]').fill('MODUON 테스트')
  await page.locator('label:has(input[name="showFinder"])').click()
  await wait(150)
  check(!(await page.locator('input[name="showFinder"]').isChecked().catch(() => true)), '④ showFinder 체크 해제(label 클릭)')
  const pv = await text('[data-t="floating-preview"]')
  check(pv.includes('MODUON 테스트') && !pv.includes('우리집 맞춤 상품 찾기') && pv.includes('전문컨설턴트 상담'), '④ floating-preview 에 새 제목 · 찾기 버튼 없음')
  check((await attr('[data-t="benefits-save"]', 'disabled')) === null, '④ 변경 후 benefits-save 활성')
  check((await bodyText()).includes('저장 안 된 변경 2건'), '④ 변경 배지 2건(회원가입 포인트 · 플로팅 패널)')
  await page.locator('[data-t="benefits-save"]').click()
  toast = await waitToast(/v2/)
  check(toast.includes('v2') && toast.includes('반영'), `④ 저장 토스트 v2 (${toast || '없음'})`)
  await wait(250)
  let body = await bodyText()
  check(body.includes('v2 현행') && body.includes('현재 v2'), '④ 이력에 v2 행 · 현행 v2')
  check((await attr('[data-t="benefits-save"]', 'disabled')) !== null, '④ 저장 후 다시 disabled')
  const bstore = (await db())?.benefits
  check(bstore?.signupPoints === 7000 && bstore?.floating?.title === 'MODUON 테스트' && bstore?.floating?.showFinder === false && bstore?.floating?.showMobi === true && bstore?.version === 2, `④ 스토어 benefits v2 (signup ${bstore?.signupPoints} · title ${bstore?.floating?.title} · finder ${bstore?.floating?.showFinder})`)
  await go('/benefits')
  await waitFor('[data-t="benefit-card"][data-key="signup"]')
  const card = await text('[data-t="benefit-card"][data-key="signup"]')
  check(/7,000|7000/.test(card), `④ 소비자 /benefits signup 카드에 7,000 (${(card.match(/[\d,]+P/) || ['?'])[0]})`)
  await page.setViewportSize({ width: 1920, height: 1000 })
  await go('/')
  await waitFor('[data-t="floating-panel"]', 4000)
  const fp = await text('[data-t="floating-panel"]')
  const fpTitle = (await text('[data-t="floating-panel"] h2')).trim()
  check(fpTitle === 'MODUON 테스트', `④ 1920 홈 floating-panel 제목 'MODUON 테스트' (${fpTitle || '없음'})`)
  check((await attr('[data-t="floating-panel"]', 'aria-label')) === 'MODUON 테스트', '④ floating-panel aria-label 도 새 제목')
  check(!fp.includes('우리집 맞춤 상품 찾기') && fp.includes('무료회원가입 혜택') && fp.includes('AI 모비와 실시간 상담') && fp.includes('전문컨설턴트 상담'), "④ '우리집 맞춤 상품 찾기' 버튼 없음 · 나머지 3개는 유지")
  await page.setViewportSize({ width: 1440, height: 950 })
  await audit('④', ['혜택 설정 변경'])

  // ────────────────────────────────────────────────────────────────
  // ⑤ 대시보드 고객소통 카드 · 사이드바 배지 · ⌘K 팔레트
  // ────────────────────────────────────────────────────────────────
  await go('/admin')
  await waitFor('[data-t="dash-comms"]')
  const links = await attrs('[data-t="dash-comms"] a[href]', 'href')
  const NEED = ['/admin/boards/qna', '/admin/complaints', '/admin/boards/event', '/admin/banners']
  check(NEED.every((h) => links.includes(h)), `⑤ dash-comms 링크 4개 (${links.join()})`)
  const ddb = await db()
  const exp = {
    '/admin/boards/qna': (ddb?.posts ?? []).filter((p) => p.board === 'qna' && p.status === '접수').length,
    '/admin/complaints': (ddb?.posts ?? []).filter((p) => p.board === 'complaint' && p.status === '접수').length,
    '/admin/boards/event': (ddb?.posts ?? []).filter((p) => p.board === 'event' && p.status === '진행중').length,
    '/admin/banners': (ddb?.banners ?? []).filter((b) => b.active).length,
  }
  const tiles = await page.locator('[data-t="dash-comms"] a[href]').evaluateAll((els) => els.map((a) => [a.getAttribute('href'), a.innerText])).catch(() => [])
  const nums = Object.fromEntries(tiles.filter(([, t]) => /\d+\s*건/.test(t)).map(([h, t]) => [h, Number((t.match(/(\d+)\s*건/) || [])[1])]))
  check(NEED.every((h) => Number.isInteger(nums[h])), `⑤ dash-comms 4개 숫자 (${NEED.map((h) => nums[h]).join('/')})`)
  check(NEED.every((h) => nums[h] === exp[h]), `⑤ 숫자 = 스토어 집계 (미답변 ${exp['/admin/boards/qna']} · 미처리 ${exp['/admin/complaints']} · 진행중 ${exp['/admin/boards/event']} · 활성 배너 ${exp['/admin/banners']})`)
  check(nums['/admin/boards/qna'] === 1 && nums['/admin/complaints'] === 0 && nums['/admin/banners'] === 5, '⑤ 앞 단계 반영: 미답변 1 · 미처리 0 · 활성 배너 5')
  const badge = (await text('aside a[href="/admin/boards"] span[title="미답변 질문"]')).trim()
  check(badge === String(exp['/admin/boards/qna']), `⑤ 사이드바 '게시판 관리' 배지 = 미답변 수 (${badge || '없음'})`)
  check((await count('aside a[href="/admin/complaints"] span[title="미처리 불편접수"]')) === 0, '⑤ 불편접수 미처리 0 → 배지 없음')
  await page.keyboard.press('Control+k')
  await waitFor('[role="dialog"][aria-label="빠른 검색"]', 3000)
  check((await count('[role="dialog"][aria-label="빠른 검색"]')) === 1, '⑤ Ctrl+K → 커맨드 팔레트')
  await wait(150)
  await page.keyboard.type('배너 관리')
  await wait(250)
  const pal = await text('[role="dialog"][aria-label="빠른 검색"]')
  check(pal.includes('배너 관리') && pal.includes('/admin/banners'), '⑤ 팔레트에서 배너 관리 검색됨')
  await page.keyboard.press('Enter')
  await wait(400)
  check(tail() === '/admin/banners', `⑤ Enter → /admin/banners (${tail()})`)

  // ────────────────────────────────────────────────────────────────
  // ⑥ 비로그인 — 세션 제거 후 /admin/banners → /login
  // ────────────────────────────────────────────────────────────────
  await page.evaluate(() => { try { localStorage.removeItem('moduon_session_v1') } catch { /* noop */ } })
  await go('/admin/banners')
  await wait(300)
  check(tail().startsWith('/login'), `⑥ 비로그인 /admin/banners → /login (${tail()})`)
  check((await count('[data-t="admin-banners"]')) === 0, '⑥ 어드민 화면 미노출')

  // ⑦ 페이지 에러 0
  check(errors.length === 0, `⑦ pageerror 0 (${errors.length})`)
  if (errors.length) console.log('PAGEERROR:', errors.join(' | '))
  await browser.close()
  console.log(fail === 0 ? 'SMOKE: ALL PASS' : `SMOKE: ${fail} FAIL`)
  process.exit(fail === 0 ? 0 : 1)
})().catch((e) => { console.log('SMOKE CRASH:', e); process.exit(1) })
