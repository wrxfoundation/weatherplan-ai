// 스모크 — 사업자 판매자 설계(제로노트식) · 렌탈 모델명 (2026-09-28 운영팀 요청)
// ① 같은 주소, 다른 화면 — 비로그인·개인은 소비자 상세, 사업자는 설계 화면
// ② 수당(R/B)이 '월 납부요금정보(A+B)' 칸 바로 위 — 문서 순서와 화면 위치 둘 다
// ③ 추가지원금 ↔ 할부원금 ↔ 내 수당 — 10만 올리면 할부원금·내 수당이 정확히 10만씩 준다
// ④ 상한 — 내 수당 한도를 넘긴 입력은 한도로 잘리고 경고가 뜬다(마이너스 수당 없음)
// ⑤ B 할인(청구카드·복지·프로모션) → 월요금이 정확히 합만큼 준다
// ⑥ 저장하기 → 값 바꾸기 → 불러오기로 복원
// ⑦ 고객 화면 미리보기에는 R/B 가 없고, 고객용 견적 복사 문구에 수당이 없다
// ⑧ /calculator/phone 도 사업자면 같은 설계 화면, 목록에 '사업자 설계 모드' 안내(개인에겐 없음)
// ⑨ 렌탈 모델명 — 카드·계산기에 표시, 상담 접수 라벨에 모델명(없으면 '모델명 미등록')
let pw
try { pw = require('/opt/node22/lib/node_modules/playwright') } catch { pw = require('playwright') }
const BASE = process.env.QA_BASE ?? 'http://localhost:4173'
const num = (s) => Number(String(s).replace(/[^0-9]/g, '')) || 0
const SELLER = { role: 'member', memberId: 'MB3', type: '사업자', tier: 'seller', code: 'A1N7742' }
const PERSONAL = { role: 'member', memberId: 'MB1', type: '개인' }

;(async () => {
  const browser = await pw.chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  let fail = 0
  const check = (ok, label) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`) }
  const wait = (ms) => page.waitForTimeout(ms)
  const go = async (path) => { await page.goto(BASE + path, { waitUntil: 'domcontentloaded' }); await page.waitForSelector('main', { timeout: 6000 }).catch(() => {}); await wait(450) }
  const session = (s) => page.evaluate((v) => { try { v ? localStorage.setItem('moduon_session_v1', JSON.stringify(v)) : localStorage.removeItem('moduon_session_v1') } catch {} }, s)
  const count = (sel) => page.locator(sel).count()
  const val = async (sel) => num(await page.locator(sel).first().innerText().catch(() => ''))
  const mine = async () => num(await page.locator('[data-t="seller-rb"] [data-t="rb-mine"] dd').innerText().catch(() => ''))
  const fill = async (t, v) => { await page.locator(`[data-t="${t}"]`).fill(String(v)); await wait(250) }

  await go('/login')
  await page.evaluate(() => { try { ['moduon_db_v1', 'moduon_session_v1', 'moduon_seller_designs_v1'].forEach((k) => localStorage.removeItem(k)) } catch {} })

  // ───────── ① 같은 주소, 다른 화면 ─────────
  console.log('\n── ① 보는 사람에 따라 다른 화면 ──')
  await session(null); await go('/phone/shop/fold8')
  check((await count('[data-t="seller-designer"]')) === 0 && (await count('[data-t="detail-carriers"]')) === 1, '비로그인 — 소비자 상세(설계 화면 아님)')
  await session(PERSONAL); await go('/phone/shop/fold8')
  check((await count('[data-t="seller-designer"]')) === 0 && (await count('[data-t="rb-panel"]')) === 0, '개인회원 — 소비자 상세 · R/B 없음')
  await session(SELLER); await go('/phone/shop/fold8')
  check((await count('[data-t="seller-designer"]')) === 1, '사업자 — 판매자 설계 화면')
  check(await page.locator('[data-t="seller-device"]').inputValue() === 'fold8', '경로의 기종(fold8)이 설계 기종으로 잡힘')
  for (const t of ['seller-a', 'seller-b', 'seller-summary', 'seller-onetime-panel', 'seller-toolbar']) check((await count(`[data-t="${t}"]`)) === 1, `구성: ${t}`)

  // ───────── ② 수당이 월 납부요금정보 바로 위 ─────────
  console.log('\n── ② 수당(R/B) → 월 납부요금정보(A+B) 순서 ──')
  const pos = await page.evaluate(() => {
    const rb = document.querySelector('[data-t="seller-rb"] [data-t="rb-panel"]'), sum = document.querySelector('[data-t="seller-summary"]')
    if (!rb || !sum) return null
    const a = rb.getBoundingClientRect(), b = sum.getBoundingClientRect()
    return { order: !!(rb.compareDocumentPosition(sum) & Node.DOCUMENT_POSITION_FOLLOWING), gap: Math.round(b.top - a.bottom), sameCol: Math.abs(a.left - b.left) < 2 }
  })
  check(!!pos && pos.order && pos.gap >= 0 && pos.gap <= 24 && pos.sameCol, `수당이 월 납부요금정보 바로 위 같은 칸 (간격 ${pos?.gap}px)`)

  // ───────── ③ 추가지원금 ↔ 할부원금 ↔ 내 수당 ─────────
  console.log('\n── ③ 추가지원금 ↔ 할부원금 ↔ 내 수당 ──')
  const p0 = await val('[data-t="seller-principal"]'), m0 = await mine(), t0 = await val('[data-t="seller-total"]')
  check(p0 === 1400000, `기준 할부원금 = KT 가격표 1,400,000 (${p0.toLocaleString()})`)
  check(m0 === 390000, `기준 내 수당 390,000 (R/B 470,000 − 상위 몫) (${m0.toLocaleString()})`)
  const cust0 = (await page.locator('[data-t="seller-rb"] [data-t="rb-customer"] dd').innerText().catch(() => '')).trim()
  check(cust0 !== '' && !/^[-−]/.test(cust0), `추가지원 0 이면 '0원' — '-0원' 아님 (${cust0})`)
  await fill('seller-extra', 100000)
  const p1 = await val('[data-t="seller-principal"]'), m1 = await mine(), t1 = await val('[data-t="seller-total"]')
  check(p0 - p1 === 100000, `추가지원금 10만 → 할부원금 −100,000 (${p1.toLocaleString()})`)
  check(m0 - m1 === 100000, `추가지원금 10만 → 내 수당 −100,000 (${m1.toLocaleString()})`)
  check(t1 < t0, `월 청구금액도 내려감 (${t0.toLocaleString()} → ${t1.toLocaleString()})`)
  check(await val('[data-t="seller-bar-mine"]') === m1, `모바일 하단 바의 내 수당도 같은 값 (${(await val('[data-t="seller-bar-mine"]')).toLocaleString()})`)

  // ───────── ④ 상한 ─────────
  console.log('\n── ④ 내 수당 한도 ──')
  await fill('seller-extra', 99999999)
  const p2 = await val('[data-t="seller-principal"]'), m2 = await mine()
  check(m2 === 0 && p0 - p2 === m0, `한도 초과 입력 → 한도(${m0.toLocaleString()})로 잘림 · 내 수당 0 (할부원금 ${p2.toLocaleString()})`)
  check((await page.locator('[data-t="seller-a"]').innerText()).includes('한도'), '한도 초과 경고 문구')
  await fill('seller-extra', 0)

  // ───────── ⑤ B 할인 ─────────
  console.log('\n── ⑤ 요금 할인 ──')
  const pm0 = await val('[data-t="seller-plan-monthly"]')
  await fill('seller-card', 15000); await fill('seller-welfare', 5000); await fill('seller-promo', 3000)
  const pm1 = await val('[data-t="seller-plan-monthly"]')
  check(pm0 - pm1 === 23000, `청구카드 1.5만 + 복지 0.5만 + 프로모션 0.3만 → 월요금 −23,000 (${pm0.toLocaleString()} → ${pm1.toLocaleString()})`)
  await fill('seller-usim', 7700)
  check(await val('[data-t="seller-onetime"]') === 7700, '유심비 7,700 → 별도 청구금액 7,700')

  // ───────── ⑤-2 가격표 잠금 — 요금제 통째로 'X' ─────────
  console.log('\n── ⑤-2 가격표 잠금 ──')
  const planOff = () => page.locator('[data-t="seller-plan"] option[value="basic4g"]').evaluate((o) => o.disabled).catch(() => null)
  check(await planOff() === true, '폴드8 — 가격표에 칸이 하나도 없는 베이직 4GB 는 요금제 목록에서 꺼짐')
  await page.locator('[data-t="seller-device"]').selectOption('a56'); await wait(300)
  check(await planOff() === false, '가격표 미수록 기종(A56) — 요금제 제한 없음')
  await page.locator('[data-t="seller-plan"]').selectOption('basic4g'); await wait(300)
  await page.locator('[data-t="seller-device"]').selectOption('fold8'); await wait(450)
  check(await page.locator('[data-t="seller-plan"]').inputValue() === 'choice110' && (await count('[data-t="seller-blocked"]')) === 0,
    '베이직 4GB 인 채로 폴드8 을 고르면 되는 요금제(초이스 110)로 자동 이동 · 취급불가 경고 없음')

  // ───────── ⑥ 저장 → 불러오기 ─────────
  console.log('\n── ⑥ 저장 · 불러오기 ──')
  await fill('seller-extra', 50000)
  await page.locator('[data-t="seller-save"]').click(); await wait(300)
  await fill('seller-extra', 0); await fill('seller-card', 0)
  const opts = await page.locator('[data-t="seller-load"] option').evaluateAll((os) => os.map((o) => o.value).filter(Boolean))
  check(opts.length === 1, `저장 목록 1건 (${opts.length})`)
  if (opts[0]) await page.locator('[data-t="seller-load"]').selectOption(opts[0]); await wait(300)
  check(num(await page.locator('[data-t="seller-extra"]').inputValue()) === 50000 && num(await page.locator('[data-t="seller-card"]').inputValue()) === 15000,
    '불러오기 → 추가지원금 50,000 · 청구카드 15,000 복원')

  // ───────── ⑦ 고객에게는 수당이 안 간다 ─────────
  console.log('\n── ⑦ 고객용 출력에 수당 없음 ──')
  await page.evaluate(() => { window.__copied = ''; navigator.clipboard.writeText = async (t) => { window.__copied = t } })
  await page.locator('[data-t="seller-copy"]').click(); await wait(250)
  const copied = await page.evaluate(() => window.__copied)
  check(copied.includes('월 납부 예상') && copied.includes('갤럭시 Z 폴드8'), `고객용 견적 복사됨 (${copied.split('\n')[1] ?? '-'})`)
  check(!/수당|R\/B|리베이트|셀러/.test(copied), '고객용 견적에 수당·R/B 단어 없음')
  const printHidden = await page.locator('[data-t="seller-rb"]').evaluate((el) => el.classList.contains('print:hidden'))
  check(printHidden, '인쇄 시 수당 블록 숨김(print:hidden)')
  await page.locator('[data-t="seller-customer-view"]').click(); await wait(500)
  check(new URL(page.url()).search.includes('view=customer') && (await count('[data-t="customer-preview-strip"]')) === 1, '고객 화면 보기 → 미리보기 띠')
  check((await count('[data-t="rb-panel"]')) === 0 && (await count('[data-t="detail-carriers"]')) === 1, '고객 화면 미리보기에는 R/B 없음')

  // ───────── ⑧ 다른 입구 ─────────
  console.log('\n── ⑧ 견적 계산기 · 목록 ──')
  await go('/calculator/phone')
  check((await count('[data-t="seller-designer"]')) === 1, '사업자 — /calculator/phone 도 설계 화면')
  await go('/phone/shop')
  check((await count('[data-t="shop-biz-notice"]')) === 1, '사업자 — 목록에 사업자 설계 모드 안내')
  await session(PERSONAL); await go('/phone/shop')
  check((await count('[data-t="shop-biz-notice"]')) === 0, '개인회원 — 목록에 안내 없음')
  await session(null); await go('/calculator/phone')
  check((await count('[data-t="seller-designer"]')) === 0, '비로그인 — /calculator/phone 은 기존 계산기')

  // ───────── ⑨ 렌탈 모델명 ─────────
  console.log('\n── ⑨ 렌탈 모델명 ──')
  await go('/category/rental')
  const card = page.locator('[data-t="rental-items"] > div', { hasText: '아이콘 얼음정수기' }).first()
  check((await card.locator('[data-t="rental-model"]').innerText().catch(() => '')) === 'CHPI-7410N', '브랜드 브라우저 카드에 모델명 CHPI-7410N')
  const noModel = page.locator('[data-t="rental-items"] > div', { hasText: '오브제 얼음정수기' }).first()
  check((await noModel.locator('[data-t="rental-model"]').count()) === 0, '모델명 미등록 품목은 고객 카드에 줄을 숨김')
  await card.locator('button', { hasText: '상담' }).click(); await wait(500)
  check((await page.locator('main').innerText()).includes('CHPI-7410N'), '상담 접수 화면(리드 라벨)에 모델명이 넘어감')
  await go('/category/rental')
  await page.locator('[data-t="rental-items"] > div', { hasText: '오브제 얼음정수기' }).first().locator('button', { hasText: '상담' }).click(); await wait(500)
  check((await page.locator('main').innerText()).includes('모델명 미등록'), '모델명 없는 품목은 접수 라벨에 "모델명 미등록" — 처리 담당자가 확인')
  await go('/calculator/rental?item=coway-ice')
  check((await page.locator('[data-t="rental-model"]').allInnerTexts()).includes('CHPI-7410N'), '렌탈 계산기 상품 카드에 모델명')

  check(errors.length === 0, `pageerror 0 (${errors.length}${errors[0] ? ` — ${errors[0].slice(0, 100)}` : ''})`)
  await browser.close()
  console.log(fail === 0 ? '\nSMOKE: ALL PASS' : `\nSMOKE: ${fail} FAIL`)
  process.exit(fail === 0 ? 0 : 1)
})()
