// 스모크 — 게시판 6종(질문/답변·후기·꿀팁·이벤트·불편접수·공지) · 모두온혜택 허브 · 후기 단일소스(홈 Reviews = db.posts) · 고객센터
// 매 시나리오 시작 전 localStorage moduon_db_v1(+혜택 데모 키·세션 조회 기록)을 지워 시드 상태에서 출발한다.
let pw
try { pw = require('/opt/node22/lib/node_modules/playwright') } catch { pw = require('playwright') }
// 여러 스모크를 병렬로 돌릴 때 각자 다른 프리뷰 포트를 쓸 수 있게 — 기본은 qa-all 이 띄우는 4173
const BASE = process.env.QA_BASE ?? 'http://localhost:4173'

;(async () => {
  const browser = await pw.chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  page.on('pageerror', (e) => errors.push('desktop: ' + String(e)))

  let fail = 0
  const check = (ok, label) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`) }
  // 요소 하나가 깨져도 뒤 단언이 살도록 — 읽기 헬퍼는 전부 try/catch
  const text = async (sel, p = page) => { try { return await p.locator(sel).first().innerText({ timeout: 2000 }) } catch { return '' } }
  const bodyText = async (p = page) => { try { return await p.evaluate(() => document.body.innerText) } catch { return '' } }
  const html = async (p = page) => { try { return await p.evaluate(() => document.documentElement.outerHTML) } catch { return '' } }
  const count = async (sel, p = page) => { try { return await p.locator(sel).count() } catch { return -1 } }
  const rowTexts = async (p = page) => { try { return await p.locator('[data-t="board-row"]').allInnerTexts() } catch { return [] } }
  const wait = (ms) => page.waitForTimeout(ms)
  const tail = () => page.url().replace(BASE, '')
  const go = async (path, p = page) => {
    await p.goto(BASE + path, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('main, header', { timeout: 5000 }).catch(() => {})
    await p.waitForTimeout(350)
  }
  // 시드 초기화 — 스토어(moduon_db_v1) + 혜택 데모 키(포인트·가입혜택·초대코드·광고 횟수) + 세션 조회 기록
  const RESET_KEYS = ['moduon_db_v1', 'moduon_points', 'moduon_signup_claimed', 'moduon_ref_code', 'moduon_invites', 'moduon_mall_notify']
  const fresh = async (path) => {
    await page.evaluate((keys) => {
      try {
        keys.forEach((k) => localStorage.removeItem(k))
        Object.keys(localStorage).filter((k) => k.startsWith('moduon_ads_')).forEach((k) => localStorage.removeItem(k))
        sessionStorage.clear()
      } catch { /* noop */ }
    }, RESET_KEYS)
    await go(path)
  }
  const storedPost = (id) => page.evaluate((pid) => { try { return JSON.parse(localStorage.getItem('moduon_db_v1')).posts.find((p) => p.id === pid) ?? null } catch { return null } }, id)
  const storedBalance = () => page.evaluate(() => { try { return JSON.parse(localStorage.getItem('moduon_points')).balance } catch { return null } })

  // origin 에 올라와야 localStorage 를 만질 수 있다 — 가벼운 정적 페이지로 진입
  await go('/support')

  // ────────────────────────────────────────────────────────────────
  // ① /board/qna — 탭 6 · 행 ≥5 · 고정 글 첫 행 · 상태 칩 · 검색 · 글쓰기 → 상세 → 목록(마스킹·연락처 비노출)
  // ────────────────────────────────────────────────────────────────
  await fresh('/board/qna')
  await page.waitForSelector('[data-t="board-list"]', { timeout: 5000 }).catch(() => {})
  const tabN = await count('[data-t="board-tabs"] a')
  check(tabN === 6, `① board-tabs 6개 (${tabN})`)
  let rows = await rowTexts()
  check(rows.length >= 5, `① qna board-row ≥5 (${rows.length})`)
  check(/고정/.test(rows[0] ?? '') && /위약금/.test(rows[0] ?? ''), `① 고정 글(위약금)이 첫 행 (${(rows[0] ?? '').split('\n')[0]})`)
  const doneN = rows.filter((r) => r.includes('답변완료')).length
  const recvN = rows.filter((r) => r.includes('접수')).length
  check(doneN >= 2, `① '답변완료' 칩 2건 이상 (${doneN})`)
  check(recvN >= 1, `① '접수' 칩 존재 (${recvN})`)

  await page.locator('[aria-label="게시글 검색"]').fill('알뜰폰')
  await wait(300)
  rows = await rowTexts()
  check(rows.length === 1 && rows[0].includes('알뜰폰'), `① 검색 '알뜰폰' → 1행 (${rows.length})`)
  const totalTxt = await text('[data-t="board-list"]')
  check(/전체\s*1\s*건/.test(totalTxt), `① 검색 결과 건수 표기 (${(totalTxt.match(/전체\s*\d+\s*건/) || ['?'])[0]})`)

  // 글쓰기 흐름
  await page.locator('[data-t="board-write"]').click()
  await page.waitForSelector('[data-t="post-form"]', { timeout: 5000 }).catch(() => {})
  await wait(200)
  check(tail() === '/board/qna/new', `① 글쓰기 → /board/qna/new (${tail()})`)
  check((await count('[data-t="post-form"]')) === 1, '① post-form 렌더')
  const TITLE = '스모크 테스트 질문입니다 — 사은품 입금 확인'
  const NAME = '테스트작성자' // maskName → 테****자
  const MASKED = '테****자'
  const PHONE = '010-5555-1234'
  const form = page.locator('[data-t="post-form"]')
  await form.locator('input[maxlength="80"]').fill(TITLE)
  await form.locator('textarea').fill('스모크에서 올리는 테스트 본문입니다. 다섯 글자 넘게 적었어요.')
  await form.locator('input[autocomplete="name"]').fill(NAME)
  await form.locator('input[autocomplete="tel"]').fill('1234-56')
  await form.locator('button[type="submit"]').click()
  await wait(300)
  let toast = await text('[role="status"]')
  check(tail() === '/board/qna/new' && toast.includes('연락처'), `① 잘못된 번호는 제출 차단 + 안내 토스트 (${toast || '토스트 없음'})`)
  await form.locator('input[autocomplete="tel"]').fill(PHONE)
  await form.locator('button[type="submit"]').click()
  await page.waitForSelector('[data-t="post-detail"]', { timeout: 5000 }).catch(() => {})
  await wait(300)
  const newId = (tail().match(/^\/board\/qna\/([^/?#]+)$/) || [])[1] ?? ''
  check(/^P[a-z0-9]+$/.test(newId) && newId !== 'new', `① 등록 → /board/qna/<id> (${newId || tail()})`)
  let detail = await text('[data-t="post-detail"]')
  check(detail.includes(TITLE), '① post-detail 에 제목')
  check((await count('[data-t="post-answer-pending"]')) === 1, '① post-answer-pending 표시')
  check((await count('[data-t="post-answer-pending"] button:has-text("모비")')) === 1, '① 답변 대기 블록에 모비 버튼')
  let body = await bodyText()
  let markup = await html()
  check(!body.includes(NAME) && detail.includes(MASKED), `① 상세 작성자 마스킹 (${MASKED})`)
  check(!markup.includes('5555-1234') && !markup.includes('55551234'), '① 상세 화면(DOM 전체)에 연락처 숫자열 없음')
  const savedNew = await storedPost(newId)
  // 어휘는 '접수'(시드 PQ4·PQ5 · 어드민 미답변 KPI 가 status==='접수' 를 센다) — store.jsx POST_CREATE 가 qna 도 '접수'로 시작시킨다
  check(savedNew?.board === 'qna' && savedNew?.phone === PHONE && !savedNew?.answer && savedNew?.status === '접수', `① 스토어에 답변 대기 글로 저장 (status ${savedNew?.status})`)

  // 목록으로 — 새 글이 고정 글 바로 아래 최상단
  await page.locator('a:has-text("목록으로")').first().click()
  await page.waitForSelector('[data-t="board-list"]', { timeout: 5000 }).catch(() => {})
  await wait(300)
  rows = await rowTexts()
  check(rows.length >= 6 && /위약금/.test(rows[0] ?? '') && (rows[1] ?? '').includes(TITLE), `① 목록 최상단(고정 글 아래)에 새 글 (${(rows[1] ?? '').split('\n').find((s) => s.includes('스모크')) ?? '?'})`)
  const newChip = ((rows[1] ?? '').split('\n')[0] ?? '').trim()
  check(newChip === '접수', `① 새 글 상태 칩 = 답변 대기 (접수) (${newChip})`)
  body = await bodyText()
  markup = await html()
  check(!body.includes(NAME) && body.includes(MASKED), '① 목록 작성자 마스킹')
  check(!markup.includes('5555-1234') && !markup.includes('55551234'), '① 목록 화면(DOM 전체)에 연락처 숫자열 없음')
  // 시드 연락처도 소비자 화면에 없어야 한다
  check(!markup.includes('2233-4455') && !markup.includes('9988-1122'), '① 시드 질문자 연락처도 비노출')

  // ────────────────────────────────────────────────────────────────
  // ② /board/review — 별점·카테고리 칩·상세 지역/별점 · 홈 Reviews 와 같은 원천
  // ────────────────────────────────────────────────────────────────
  await fresh('/board/review')
  await page.waitForSelector('[data-t="board-list"]', { timeout: 5000 }).catch(() => {})
  rows = await rowTexts()
  const reviewTotal = Number(((await text('[data-t="board-list"]')).match(/전체\s*(\d+)\s*건/) || [])[1] ?? -1)
  const starN = await count('[data-t="board-row"] [aria-label^="별점"]')
  check(rows.length >= 5 && starN === rows.length, `② 후기 행마다 별점(★) 렌더 (${starN}/${rows.length})`)
  check(rows.some((r) => r.includes('인터넷/TV')) && rows.some((r) => r.includes('휴대폰')), '② 카테고리 칩(인터넷/TV·휴대폰)')
  await page.locator('[data-t="board-row"] a').first().click()
  await page.waitForSelector('[data-t="post-detail"]', { timeout: 5000 }).catch(() => {})
  await wait(300)
  detail = await text('[data-t="post-detail"]')
  check(/^\/board\/review\/[^/]+$/.test(tail()), `② 행 클릭 → 상세 (${tail()})`)
  check(/(서울|경기|인천|부산|대전|광주|대구|울산|세종|강원|충[북남]|전[북남]|경[북남]|제주) [가-힣]+/.test(detail), `② 상세에 지역 (${(detail.match(/(서울|경기|인천|부산|대전|광주) [가-힣]+/) || ['?'])[0]})`)
  check((await count('[data-t="post-detail"] [aria-label^="별점"]')) === 1 && /\b[1-5]\.0\b/.test(detail), `② 상세에 별점 (${(detail.match(/\b[1-5]\.0\b/) || ['?'])[0]})`)

  // 홈 Reviews — 후기 수·첫 후기 문장·'후기 더보기' 링크
  await go('/')
  await page.waitForSelector('a:has-text("후기 더보기")', { timeout: 5000 }).catch(() => {})
  const homeText = await bodyText()
  const homeCount = Number(((homeText.match(/검증 후기\s*([\d,]+)건/) || [])[1] ?? '-1').replace(/,/g, ''))
  check(homeCount > 0 && homeCount === reviewTotal, `② 홈 후기 수 = /board/review 전체 건수 (${homeCount} / ${reviewTotal})`)
  const more = page.locator('a:has-text("후기 더보기")').first()
  check((await more.getAttribute('href').catch(() => null)) === '/board/review', "② '후기 더보기' → /board/review")
  const firstCard = page.locator('a[href^="/board/review/"]:not([href$="/new"])').first()
  const cardHref = await firstCard.getAttribute('href').catch(() => null)
  let cardQuote = ''
  try { cardQuote = (await firstCard.locator('p').first().innerText({ timeout: 2000 })).replace(/[“”"]/g, '').trim() } catch { /* noop */ }
  const snippet = cardQuote.slice(0, 18)
  check(!!cardHref && snippet.length > 5, `② 홈 후기 카드가 게시글 링크 (${cardHref})`)
  await go('/board/review')
  const listContent = await page.locator('[data-t="board-list"]').evaluate((el) => el.textContent).catch(() => '')
  check(listContent.includes(snippet), `② 홈 첫 후기 문장이 후기 목록에 존재 (${snippet}…)`)
  if (cardHref) {
    await go(cardHref)
    detail = await text('[data-t="post-detail"]')
    check(detail.includes(snippet), `② 홈 후기 카드 → 같은 글 상세 (${cardHref})`)
  }

  // ────────────────────────────────────────────────────────────────
  // ③ 이벤트(진행중 2·종료 1·기간) · 공지(고정 첫 행·글쓰기 없음) · 꿀팁(태그·글쓰기 있음)
  // ────────────────────────────────────────────────────────────────
  await go('/board/event')
  rows = await rowTexts()
  const ongoing = rows.filter((r) => r.includes('진행중')).length
  const ended = rows.filter((r) => r.includes('종료')).length
  check(ongoing === 2 && ended === 1, `③ 이벤트 칩 진행중 2·종료 1 (${ongoing}/${ended})`)
  check(rows.length > 0 && rows.every((r) => /\d{1,2}월 \d{1,2}일 ~ \d{1,2}월 \d{1,2}일/.test(r)), `③ 이벤트 행마다 기간 텍스트 (${(rows[0]?.match(/\d{1,2}월 \d{1,2}일 ~ \d{1,2}월 \d{1,2}일/) || ['?'])[0]})`)
  check((await count('[data-t="board-write"]')) === 0, '③ 이벤트: 글쓰기 버튼 없음')

  await go('/board/notice')
  rows = await rowTexts()
  const noticeFirst = (rows[0] ?? '').split('\n').find((s) => s.includes('카테고리')) ?? (rows[0] ?? '').split('\n')[0] ?? '?'
  check(rows.length >= 3 && /고정/.test(rows[0] ?? '') && /렌트\/리스 카테고리/.test(rows[0] ?? ''), `③ 공지 고정 글 첫 행 (${noticeFirst})`)
  check((await count('[data-t="board-write"]')) === 0, '③ 공지: 글쓰기 버튼 없음')

  await go('/board/tip')
  rows = await rowTexts()
  check(rows.some((r) => /#인터넷/.test(r)) && rows.some((r) => /#약정/.test(r)), '③ 꿀팁: 태그(#인터넷 #약정) 표시')
  check((await count('[data-t="board-write"]')) === 1, '③ 꿀팁: 글쓰기 버튼 있음')

  // ────────────────────────────────────────────────────────────────
  // ④ /board/complaint — 목록 없음 · 접수 폼 · 처리 현황 · 제출 → 토스트·초기화 · 내 접수 조회 · 상세/작성 URL 리다이렉트
  // ────────────────────────────────────────────────────────────────
  await fresh('/board/complaint')
  await page.waitForSelector('[data-t="complaint-form"]', { timeout: 5000 }).catch(() => {})
  check((await count('[data-t="board-list"]')) === 0 && (await count('[data-t="board-row"]')) === 0, '④ 불편접수: 목록(board-list) 없음')
  check((await count('[data-t="complaint-form"]')) === 1, '④ complaint-form 존재')
  const statusCells = async () => {
    try { return (await page.locator('[data-t="complaint-status"] .grid > div').allInnerTexts()).map((c) => c.split('\n').map((s) => s.trim()).filter(Boolean)) } catch { return [] }
  }
  let cells = await statusCells()
  check(cells.length === 3 && cells.map((c) => c[1]).join(',') === '접수,처리중,완료' && cells.every((c) => /^\d+$/.test(c[0] ?? '')), `④ complaint-status 접수/처리중/완료 숫자 (${cells.map((c) => c.join(' ')).join(' · ') || '없음'})`)
  const recvBefore = Number(cells[0]?.[0] ?? 0)

  const cform = page.locator('[data-t="complaint-form"]')
  const CT = '스모크 불편접수 테스트 — 콜백 지연'
  const CPHONE = '010-5555-9876'
  await cform.locator('button', { hasText: /^상담$/ }).click()
  const chipCls = (await cform.locator('button', { hasText: /^상담$/ }).getAttribute('class').catch(() => '')) ?? ''
  check(/bg-primary/.test(chipCls), '④ 유형 칩 상담 선택')
  await cform.locator('input[maxlength="80"]').fill(CT)
  await cform.locator('textarea').fill('스모크 테스트용 불편 내용입니다. 콜백이 늦었어요.')
  await cform.locator('input[autocomplete="name"]').fill('불편테스터')
  await cform.locator('input[autocomplete="tel"]').fill(CPHONE)
  await cform.locator('button[type="submit"]').click()
  await wait(300)
  toast = await text('[role="status"]')
  check(toast.includes('접수'), `④ 제출 토스트 '접수' 포함 (${toast || '토스트 없음'})`)
  // 제출 직후 폼 자리에 확인 카드(complaint-done) — 접수됐어요 · 접수 칩 · 제목 · 유형 · 다음 동선 버튼 2개
  await page.waitForSelector('[data-t="complaint-done"]', { timeout: 3000 }).catch(() => {})
  const done = await text('[data-t="complaint-done"]')
  check((await count('[data-t="complaint-done"]')) === 1 && (await count('[data-t="complaint-form"]')) === 0, '④ 제출 직후 폼 → 확인 카드(complaint-done)로 교체')
  check(done.includes('접수됐어요') && done.includes(CT) && done.includes('상담 ·') && done.includes('접수'), `④ 확인 카드에 접수됐어요 · 제목 · 유형 (${done.split('\n')[0] || '없음'})`)
  check((await count('[data-t="complaint-see-mine"]')) === 1 && (await count('[data-t="complaint-again"]')) === 1, '④ 확인 카드 버튼: 내 접수 조회 보기 · 새로 접수하기')
  cells = await statusCells()
  check(Number(cells[0]?.[0]) === recvBefore + 1, `④ 접수 건수 +1 (${recvBefore} → ${cells[0]?.[0]})`)
  check(tail() === '/board/complaint', '④ 제출 후에도 /board/complaint 유지(상세 이동 없음)')
  // 조회 결과 제목은 앞 6자 + … 로 마스킹(인증 없는 데모 — 번호만으로 남의 접수 제목·답변 전문이 읽히지 않게)
  const CT_MASK = CT.slice(0, 6).trimEnd() + '…'
  // 제출 직후 '내 접수 조회'는 방금 접수한 이름·연락처로 이미 채워져 1건이 보인다 — 입력칸엔 연락처가 남지 않는다
  let lookupItems = []
  try { lookupItems = await page.locator('[data-t="complaint-lookup"] li').allInnerTexts() } catch { /* noop */ }
  check(lookupItems.length === 1 && lookupItems[0].includes(CT_MASK) && !lookupItems[0].includes(CT), `④ 제출 직후 내 접수 조회에 방금 접수 1건(마스킹 '${CT_MASK}') (${lookupItems.length})`)
  const lookupInputs = [await page.locator('[aria-label="접수한 이름"]').inputValue().catch(() => 'x'), await page.locator('[aria-label="접수한 연락처"]').inputValue().catch(() => 'x')]
  check(lookupInputs.every((v) => v === ''), `④ 조회 입력칸은 비어 있음(연락처 잔류 없음) (${JSON.stringify(lookupInputs)})`)
  // 새로 접수하기 → 빈 폼으로 복귀
  await page.locator('[data-t="complaint-again"]').click()
  await page.waitForSelector('[data-t="complaint-form"]', { timeout: 3000 }).catch(() => {})
  const cleared = [
    await cform.locator('input[maxlength="80"]').inputValue().catch(() => 'x'),
    await cform.locator('textarea').inputValue().catch(() => 'x'),
    await cform.locator('input[autocomplete="name"]').inputValue().catch(() => 'x'),
    await cform.locator('input[autocomplete="tel"]').inputValue().catch(() => 'x'),
  ]
  check((await count('[data-t="complaint-done"]')) === 0 && cleared.every((v) => v === ''), `④ 새로 접수하기 → 빈 폼 복귀 (${JSON.stringify(cleared)})`)

  // 내 접수 조회 — 이름+연락처가 모두 맞는 접수만. 결과는 상태 칩·마스킹 제목·유형·답변 여부까지만
  await page.locator('[aria-label="접수한 이름"]').fill('불편테스터')
  await page.locator('[aria-label="접수한 연락처"]').fill(CPHONE)
  await page.locator('[data-t="complaint-lookup"] button[type="submit"]').click()
  await wait(300)
  lookupItems = []
  try { lookupItems = await page.locator('[data-t="complaint-lookup"] li').allInnerTexts() } catch { /* noop */ }
  const lookupText = await text('[data-t="complaint-lookup"]')
  check(lookupItems.length === 1 && lookupItems[0].includes(CT_MASK) && lookupItems[0].includes('상담'), `④ 내 접수 조회(이름+연락처) → 방금 접수 1건 (${lookupItems.length})`)
  check(lookupItems[0]?.includes('접수') && lookupItems[0]?.includes('담당자가 확인 후'), '④ 조회 결과: 접수 상태 + 답변 대기 안내')
  check(!/약속 시간에 안 오셨어요|상담 전화가 너무 늦게|견적 금액과 실제 청구/.test(lookupText), '④ 조회 결과에 시드 접수(다른 이름·번호) 없음')
  body = await bodyText()
  check(!body.includes('5555-9876') && !body.includes('7788-9900') && !body.includes('2211-3300') && !body.includes('4455-6677'), '④ 불편접수 화면 텍스트에 연락처 숫자열 없음')
  // 없는 번호 조회 → 0건 안내
  await page.locator('[aria-label="접수한 연락처"]').fill('010-0000-9999')
  await page.locator('[data-t="complaint-lookup"] button[type="submit"]').click()
  await wait(300)
  check((await text('[data-t="complaint-lookup"]')).includes('접수된 건이 없어요'), '④ 없는 연락처 조회 → 0건 안내')
  // 번호만 맞고 이름이 다르면(시드 PC2 서예진 번호) 0건 — 이름+연락처 AND
  await page.locator('[aria-label="접수한 이름"]').fill('홍길동')
  await page.locator('[aria-label="접수한 연락처"]').fill('010-2211-3300')
  await page.locator('[data-t="complaint-lookup"] button[type="submit"]').click()
  await wait(300)
  const lkOther = await text('[data-t="complaint-lookup"]')
  check(lkOther.includes('접수된 건이 없어요') && !lkOther.includes('상담 전화가'), '④ 번호만 맞고 이름이 다르면 0건(이름+연락처 AND)')

  await go('/board/complaint/PC1')
  check(tail() === '/board/complaint', `④ /board/complaint/PC1 → /board/complaint 리다이렉트 (${tail()})`)
  check((await count('[data-t="post-detail"]')) === 0 && (await count('[data-t="complaint-form"]')) === 1, '④ 불편접수 상세 비공개(접수 폼만)')
  await go('/board/complaint/new')
  check(tail() === '/board/complaint' && (await count('[data-t="post-form"]')) === 0, `④ /board/complaint/new → 리다이렉트 (${tail()})`)

  // ────────────────────────────────────────────────────────────────
  // ⑤ /board/qna/PQ1 — 담당자 답변 · 조회수 +1(세션 1회) · 이전/다음 · 없는 id
  // ────────────────────────────────────────────────────────────────
  await fresh('/board/qna/PQ1')
  await page.waitForSelector('[data-t="post-detail"]', { timeout: 5000 }).catch(() => {})
  await wait(300)
  detail = await text('[data-t="post-detail"]')
  const ans = await text('[data-t="post-answer"]')
  check(ans.includes('담당자 답변') && ans.includes('본사 담당자'), `⑤ post-answer 에 담당자 답변 (${ans.split('\n')[0] || '없음'})`)
  check(/조회 89\b/.test(detail), `⑤ 조회수 88 → 89 (${(detail.match(/조회 [\d,]+/) || ['?'])[0]})`)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-t="post-detail"]', { timeout: 5000 }).catch(() => {})
  await wait(400)
  detail = await text('[data-t="post-detail"]')
  check(/조회 89\b/.test(detail), `⑤ 새로고침 후 세션 내 재증가 없음 (${(detail.match(/조회 [\d,]+/) || ['?'])[0]})`)
  const pq1 = await storedPost('PQ1')
  check(pq1?.views === 89, `⑤ 스토어 영속 views=89 (${pq1?.views})`)

  const navRow = (k) => page.locator('nav[aria-label="이전/다음 글"] > div', { hasText: k })
  const nextTitle = await navRow('다음 글').locator('a').first().innerText({ timeout: 2000 }).catch(() => '')
  const prevTitle = await navRow('이전 글').locator('a').first().innerText({ timeout: 2000 }).catch(() => '')
  check(prevTitle.length > 0 && nextTitle.length > 0, `⑤ 이전/다음 링크 (이전: ${prevTitle.slice(0, 14)} · 다음: ${nextTitle.slice(0, 14)})`)
  await navRow('다음 글').locator('a').first().click()
  await wait(500)
  detail = await text('[data-t="post-detail"]')
  check(/^\/board\/qna\/[^/]+$/.test(tail()) && tail() !== '/board/qna/PQ1' && detail.includes(nextTitle), `⑤ 다음 글 이동 (${tail()})`)
  await navRow('이전 글').locator('a').first().click()
  await wait(500)
  check(tail() === '/board/qna/PQ1', `⑤ 이전 글로 복귀 (${tail()})`)
  detail = await text('[data-t="post-detail"]')
  check(/조회 89\b/.test(detail), '⑤ 재진입에도 조회수 유지(89)')

  await go('/board/qna/NOPE_ID')
  check((await count('[data-t="post-detail"]')) === 0 && (await bodyText()).includes('글을 찾을 수 없어요'), '⑤ 없는 id → EmptyState')

  // ────────────────────────────────────────────────────────────────
  // ⑥ /benefits — 허브·포인트·카드 4 · 가입 혜택 1회 · 초대 코드 · 광고 모달(중도 닫기 미적립) · 멤버십몰 준비 중 · :section 강조 · 이벤트
  // ────────────────────────────────────────────────────────────────
  await fresh('/benefits')
  await page.waitForSelector('[data-t="benefits-hero"]', { timeout: 5000 }).catch(() => {})
  check((await count('[data-t="benefits-hero"]')) === 1 && (await count('[data-t="points-card"]')) === 1, '⑥ benefits-hero · points-card')
  const keys = await page.locator('[data-t="benefit-card"]').evaluateAll((els) => els.map((e) => e.dataset.key)).catch(() => [])
  check(keys.join(',') === 'signup,invite,ads,mall', `⑥ benefit-card 4개 순서 (${keys.join(',')})`)

  const claim = page.locator('[data-t="signup-claim"]')
  check(!(await claim.isDisabled().catch(() => true)), '⑥ 가입 혜택 받기 버튼 초기 활성')
  await claim.click()
  // 잔액은 카운트업(600ms) — 원장 줄('+5,000P')이 아니라 잔액 숫자(첫 .tnum)가 5,000 이 될 때까지 기다린다
  const balanceSel = '[data-t="points-card"] .tnum'
  await page.waitForFunction((sel) => /^5,000\s*P$/.test((document.querySelector(sel)?.innerText ?? '').trim()), balanceSel, { timeout: 4000 }).catch(() => {})
  let pointsText = await text('[data-t="points-card"]')
  const balanceTxt = (await text(balanceSel)).trim()
  check(/^5,000\s*P$/.test(balanceTxt) && pointsText.includes('무료회원가입 혜택'), `⑥ signup-claim → 포인트 5,000 반영 (잔액 ${balanceTxt || '?'})`)
  check(await claim.isDisabled().catch(() => false), '⑥ 두 번째 클릭 비활성(disabled)')
  await page.evaluate(() => document.querySelector('[data-t="signup-claim"]')?.click())
  await wait(700)
  pointsText = await text('[data-t="points-card"]')
  let bal = await storedBalance()
  check(bal === 5000 && pointsText.includes('5,000') && !pointsText.includes('10,000'), `⑥ 재클릭 무반응 — 잔액 5,000 유지 (${bal})`)

  const code = (await text('[data-t="ref-code"]')).trim()
  check(/^MD[A-Z0-9]{6}$/.test(code), `⑥ ref-code 형식 MD+6 (${code || '없음'})`)
  const inviteText = await text('[data-t="benefit-card"][data-key="invite"]')
  check(code.length > 0 && inviteText.includes('?ref=' + code), '⑥ 초대 링크에 ?ref=코드')

  let remain = await text('[data-t="ad-remain"]')
  check(remain.includes('10'), `⑥ ad-remain '10' (${remain})`)
  await page.locator('[data-t="ad-watch"]').click()
  await page.waitForSelector('[data-t="ad-modal"]', { timeout: 3000 }).catch(() => {})
  const cd = (await text('[data-t="ad-countdown"]')).trim()
  check((await count('[data-t="ad-modal"]')) === 1 && /^\d+$/.test(cd) && Number(cd) <= 15 && Number(cd) >= 12, `⑥ ad-watch → ad-modal + ad-countdown (${cd || '없음'})`)
  const dlg = page.locator('[role="dialog"]:has([data-t="ad-modal"])')
  const dlgText = await dlg.innerText({ timeout: 2000 }).catch(() => '')
  check(dlgText.includes('지금 닫으면 적립되지 않아요'), '⑥ 모달 안내 문구: 중간에 닫으면 미적립')
  await dlg.locator('button[aria-label="닫기"]').click()
  await wait(400)
  check((await count('[data-t="ad-modal"]')) === 0, '⑥ 모달 닫힘')
  bal = await storedBalance()
  remain = await text('[data-t="ad-remain"]')
  pointsText = await text('[data-t="points-card"]')
  check(bal === 5000 && remain.includes('10') && !pointsText.includes('광고보기'), `⑥ 중도 닫기 → 미적립 (잔액 ${bal} · 남은 ${remain}회)`)
  check((await text('[data-t="benefit-card"][data-key="mall"]')).includes('준비 중'), "⑥ 멤버십몰 카드 '준비 중'")

  // /benefits/invite → invite 카드로 스크롤 + 강조
  await go('/benefits/invite')
  await wait(600)
  const inviteCard = page.locator('[data-t="benefit-card"][data-key="invite"]')
  const icls = (await inviteCard.getAttribute('class').catch(() => '')) ?? ''
  const iactive = await inviteCard.getAttribute('data-active').catch(() => null)
  const ibox = await inviteCard.boundingBox().catch(() => null)
  const scrollY = await page.evaluate(() => window.scrollY).catch(() => 0)
  check(/\bring-2\b/.test(icls) || iactive === 'true', `⑥ /benefits/invite → invite 카드 강조 (${/ring-2/.test(icls) ? 'ring-2' : iactive ?? '없음'})`)
  check(!!ibox && ibox.y >= 0 && ibox.y < 900 && scrollY > 0, `⑥ invite 카드로 스크롤 (y ${Math.round(ibox?.y ?? -1)} · scrollY ${Math.round(scrollY)})`)

  const evLinks = page.locator('[data-t="benefits-events"] a[href^="/board/event/"]')
  const evN = await evLinks.count().catch(() => 0)
  check(evN >= 1, `⑥ benefits-events 진행중 이벤트 링크 ≥1 (${evN})`)
  const evHref = await evLinks.first().getAttribute('href').catch(() => null)
  if (evHref) {
    await evLinks.first().click()
    await page.waitForSelector('[data-t="post-detail"]', { timeout: 5000 }).catch(() => {})
    await wait(300)
    detail = await text('[data-t="post-detail"]')
    check(tail() === evHref && detail.includes('진행중') && detail.includes('기간'), `⑥ 이벤트 링크 → ${evHref}`)
  }

  // ────────────────────────────────────────────────────────────────
  // ⑦ /support — 대표번호 1522-0000 · 옛 번호 없음 · 게시판 링크
  // ────────────────────────────────────────────────────────────────
  await go('/support')
  body = await bodyText()
  markup = await html()
  check(body.includes('1522-0000'), '⑦ 고객센터 대표번호 1522-0000')
  check(!body.includes('1660-0000') && !markup.includes('1660-0000') && !markup.includes('tel:16600000'), '⑦ 옛 번호 1660-0000 없음')
  check((await count('[data-t="support-boards"] a[href="/board/qna"]')) === 1 && (await count('[data-t="support-boards"] a[href="/board/complaint"]')) === 1, '⑦ support-boards → /board/qna · /board/complaint 링크')

  // ────────────────────────────────────────────────────────────────
  // ⑧ 모바일 390 — 탭 6개 가로 스크롤 · 글쓰기 버튼 보임
  // ────────────────────────────────────────────────────────────────
  const mob = await browser.newPage({ viewport: { width: 390, height: 844 } })
  mob.on('pageerror', (e) => errors.push('mobile: ' + String(e)))
  await go('/board/qna', mob)
  await mob.waitForSelector('[data-t="board-list"]', { timeout: 5000 }).catch(() => {})
  const mTabs = await count('[data-t="board-tabs"] a', mob)
  check(mTabs === 6, `⑧ 모바일 탭 6개 (${mTabs})`)
  const sc = await mob.locator('[data-t="board-tabs"]').evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth, ox: getComputedStyle(el).overflowX })).catch(() => ({ sw: 0, cw: 0, ox: '?' }))
  check(sc.sw > sc.cw && /auto|scroll/.test(sc.ox), `⑧ 탭이 가로 스크롤 (${sc.sw} > ${sc.cw} · overflow-x ${sc.ox})`)
  const lastTab = await mob.locator('[data-t="board-tabs"] a').last().evaluate((a) => {
    const nav = a.closest('[data-t="board-tabs"]')
    nav.scrollLeft = nav.scrollWidth
    const r = a.getBoundingClientRect()
    return { x: r.x, right: r.right, label: a.innerText.trim() }
  }).catch(() => null)
  check(!!lastTab && lastTab.x >= 0 && lastTab.right <= 391, `⑧ 스크롤 후 마지막 탭 화면 안 (${lastTab?.label} ${Math.round(lastTab?.x ?? -1)}~${Math.round(lastTab?.right ?? -1)})`)
  const wbtn = mob.locator('[data-t="board-write"]')
  const wb = await wbtn.boundingBox().catch(() => null)
  check(!!wb && (await wbtn.isVisible().catch(() => false)) && wb.x >= 0 && wb.x + wb.width <= 390 && wb.y < 844, `⑧ 모바일 글쓰기 버튼 보임 (x ${Math.round(wb?.x ?? -1)} w ${Math.round(wb?.width ?? 0)} y ${Math.round(wb?.y ?? -1)})`)
  const noHScroll = await mob.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1).catch(() => false)
  check(noHScroll, '⑧ 모바일 페이지 본문 가로 넘침 없음')
  await mob.close()

  // ⑨ 페이지 에러 0
  check(errors.length === 0, `⑨ pageerror 0 (${errors.length})`)
  if (errors.length) console.log('PAGEERROR:', errors.join(' | '))
  await browser.close()
  console.log(fail === 0 ? 'SMOKE: ALL PASS' : `SMOKE: ${fail} FAIL`)
  process.exit(fail === 0 ? 0 : 1)
})().catch((e) => { console.log('SMOKE CRASH:', e); process.exit(1) })
