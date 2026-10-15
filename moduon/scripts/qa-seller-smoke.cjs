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
// ⑩ 제품 정보(제로노트식, 2026-09-28 '핸드폰 설명 누락') — 설계 화면 맨 위 · 고객 상세 둘 다.
//    폴드8 은 운영팀이 보낸 제로노트 화면 값 그대로, 용량·색상·단말변경에 따라 제목·RAM·출고가가 같이 바뀐다.
//    출고가는 제조사 국내 출고가(폴드8 256GB 2,278,100 — 예전엔 폴드8 '울트라' 값 2,577,300 이 들어가 있었다)
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

  // ───────── ⑩ 제품 정보(제로노트식) ─────────
  console.log('\n── ⑩ 제품 정보(휴대폰 설명) ──')
  const txt = (t) => page.locator(`[data-t="${t}"]`).first().innerText().catch(() => '')
  const dd = (k) => page.locator(`[data-t="spec-${k}"] dd`).first().innerText().catch(() => '')
  await session(SELLER); await go('/phone/shop/fold8')
  const specFirst = await page.evaluate(() => {
    const a = document.querySelector('[data-t="spec-sheet"]'), b = document.querySelector('[data-t="seller-a"]')
    return !!a && !!b && !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
  })
  check(specFirst, '설계 화면 — 제품 정보가 A·B 설계 칸보다 위')
  check((await txt('spec-title')) === '갤럭시 Z 폴드8 256GB', `제목 = 갤럭시 Z 폴드8 256GB (${await txt('spec-title')})`)
  const meta = await txt('spec-meta')
  check(['SM-F971NK', '안드로이드 17', '2026-08-07'].every((x) => meta.includes(x)), `모델명·OS·출시일 (${meta.replace(/\s+/g, ' ')})`)
  check((await dd('cpu')).includes('4.74GHz+3.6GHz') && (await dd('body')).includes('123.9X161.4X4.5mm') && (await dd('body')).includes('201g') && (await dd('battery')).includes('4,800mAh'),
    '사양 칸 — 제로노트 값(CPU 클럭·제원·무게·배터리)')
  check((await dd('ram')) === '12GB' && (await dd('storage')) === '256GB', `RAM 12GB · 내장메모리 256GB (${await dd('ram')} · ${await dd('storage')})`)
  const attrs = await page.locator('[data-t="spec-attrs"] dd').allInnerTexts()
  check(JSON.stringify(attrs) === JSON.stringify(['삼성월렛', 'IP48', '온스크린', '지원', '미부착', '미지원', '나노+eSIM']), `부가 속성 7종 (${attrs.join('·')})`)
  const feats = await page.locator('[data-t="spec-features"] li').count()
  check(feats === 20 && (await txt('spec-features')).includes('Now nudge'), `특징 목록 20줄(하위 5줄 포함) (${feats})`)
  check((await txt('spec-box')).includes('CtoC케이블'), '구성품')
  check((await val('[data-t="seller-price"]')) === 2278100 && (await val('[data-t="seller-public"]')) === 878100,
    `출고가 2,278,100 · 가격표 반영 할인 878,100 (${(await val('[data-t="seller-price"]')).toLocaleString()} · ${(await val('[data-t="seller-public"]')).toLocaleString()})`)
  // 용량 → 제목·RAM·출고가
  await page.locator('[data-t="seller-storage"][data-id="1TB"]').click(); await wait(300)
  check((await txt('spec-title')) === '갤럭시 Z 폴드8 1TB' && (await dd('ram')) === '16GB' && (await dd('storage')) === '1TB' && (await val('[data-t="seller-price"]')) === 3152600,
    `1TB → 제목·RAM 16GB·출고가 3,152,600 (${await txt('spec-title')} · ${await dd('ram')})`)
  // 색상 → 이름·고객용 견적
  await page.locator('[data-t="spec-colors"] button[aria-label="그라파이트"]').click(); await wait(250)
  await page.evaluate(() => { window.__copied = ''; navigator.clipboard.writeText = async (t) => { window.__copied = t } })
  await page.locator('[data-t="seller-copy"]').click(); await wait(250)
  const copied2 = await page.evaluate(() => window.__copied)
  check((await txt('spec-color')) === '그라파이트' && copied2.includes('갤럭시 Z 폴드8 1TB 그라파이트 (SM-F971NK)'), `색상 그라파이트 → 고객용 견적 첫 줄 (${copied2.split('\n')[1] ?? '-'})`)
  // 단말변경
  await page.locator('[data-t="spec-change"]').selectOption('s26u'); await wait(400)
  check((await txt('spec-title')) === '갤럭시 S26 울트라 256GB' && (await txt('spec-meta')).includes('SM-S948NK') && (await page.locator('[data-t="seller-device"]').inputValue()) === 's26u',
    `단말변경 → S26 울트라 · SM-S948NK · 설계 기종도 s26u (${await txt('spec-title')})`)
  check((await txt('spec-color')) === '코발트 바이올렛', `기종을 바꾸면 색상은 그 기종 기본값 (${await txt('spec-color')})`)
  // 접기 — 기억
  await page.locator('[data-t="spec-fold"]').click(); await wait(200)
  const hiddenNow = !(await page.locator('[data-t="spec-main"]').isVisible())
  await go('/phone/shop/fold8')
  const hiddenAfter = !(await page.locator('[data-t="spec-main"]').isVisible())
  await page.locator('[data-t="spec-fold"]').click(); await wait(200)
  check(hiddenNow && hiddenAfter && (await page.locator('[data-t="spec-main"]').isVisible()), '접기 → 다시 열어도 접힌 채(기억) → 펼치기')
  // 고객 상세
  await session(null); await go('/phone/shop/fold8')
  check((await count('[data-t="spec-sheet"]')) === 1 && (await txt('spec-title')) === '갤럭시 Z 폴드8 256GB', '고객 상세에도 제품 정보')
  await page.locator('[data-t="spec-colors"] button[aria-label="크림"]').click(); await wait(250)
  check((await page.locator('[data-t="detail-colors"] button[aria-label="크림"]').getAttribute('aria-pressed')) === 'true', '제품 정보에서 고른 색상 = 구매 설정 색상(같은 상태)')
  await page.locator('[data-t="spec-change"]').selectOption('ip17p'); await wait(600)
  check(new URL(page.url()).pathname === '/phone/shop/ip17p' && (await txt('spec-title')) === '아이폰 17 프로 256GB', `고객 상세 단말변경 → 해당 기종 주소로 이동 (${new URL(page.url()).pathname})`)

  check(errors.length === 0, `pageerror 0 (${errors.length}${errors[0] ? ` — ${errors[0].slice(0, 100)}` : ''})`)
  await browser.close()
  console.log(fail === 0 ? '\nSMOKE: ALL PASS' : `\nSMOKE: ${fail} FAIL`)
  process.exit(fail === 0 ? 0 : 1)
})()
