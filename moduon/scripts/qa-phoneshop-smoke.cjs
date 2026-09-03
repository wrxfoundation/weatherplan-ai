// 스모크 — 휴대폰 온라인구매(브라우저·상세·신청 분기) + 알뜰폰(목록·상세·신규불가 팝업)
let pw
try { pw = require('/opt/node22/lib/node_modules/playwright') } catch { pw = require('playwright') }
const num = (s) => Number(String(s).replace(/[^\d]/g, ''))

;(async () => {
  const browser = await pw.chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  let fail = 0
  const check = (ok, label) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`) }
  const t = (sel) => page.locator(sel).innerText()

  // ── 카테고리 진입 2종
  await page.goto('http://localhost:4173/category/phone', { waitUntil: 'networkidle' }); await page.waitForTimeout(400)
  const entries = await t('[data-t="phone-entries"]')
  check(entries.includes('온라인 구매') && entries.includes('알뜰폰 요금제'), '휴대폰 카테고리 1: 온라인 구매 / 알뜰폰 요금제')
  check((await page.evaluate(() => document.body.innerText)).includes('지금 쓰시는 통신사'), '빠른 상담(통신사·기종)은 그대로 유지')

  // ── 온라인 구매: 브라우저
  await page.goto('http://localhost:4173/phone/shop', { waitUntil: 'networkidle' }); await page.waitForTimeout(400)
  check(await page.locator('[data-t="shop-card"]').count() === 8, '기종 8종')
  check(await page.locator('[data-t="shop-cur"]').count() === 1, '우상단 현재 통신사 선택')
  await page.locator('[data-t="shop-filters"] button', { hasText: '삼성' }).click(); await page.waitForTimeout(150)
  check(await page.locator('[data-t="shop-card"]').count() === 5, '삼성 필터 → 5')
  await page.locator('[data-t="shop-filters"] button', { hasText: '애플' }).click(); await page.waitForTimeout(150)
  check(await page.locator('[data-t="shop-card"]').count() === 3, '애플 필터 → 3')
  await page.locator('[data-t="shop-filters"] button', { hasText: /^1TB$/ }).click(); await page.waitForTimeout(150)
  check(await page.locator('[data-t="shop-card"]').count() === 2, '애플 + 1TB → 2 (프로·프로맥스)')
  await page.locator('[data-t="shop-cur"] button', { hasText: /^KT$/ }).click(); await page.waitForTimeout(200)
  check(page.url().includes('cur=KT'), '현 통신사 선택이 URL 에 실림')
  const card0 = await page.locator('[data-t="shop-card"]').first().innerText()
  check(card0.includes('AI 추천') && /번호이동|기기변경/.test(card0), `카드에 AI 추천(번호이동/기변) 배지: ${card0.match(/AI 추천[^\n]*/)?.[0]}`)

  // ── 상세: 옵션 4종 + 우측 카드 합산
  await page.goto('http://localhost:4173/phone/shop/s26u?cur=KT&storage=512GB', { waitUntil: 'networkidle' }); await page.waitForTimeout(500)
  check(await page.locator('[data-t="detail-carriers"] button').count() === 3, '이용할 통신사 3사')
  check((await t('[data-t="detail-carriers"]')).includes('AI 추천'), 'AI 추천 배지')
  check(await page.locator('[data-t="detail-colors"] button').count() === 3, '색상 3종')
  check(await page.locator('[data-t="detail-method"] button').count() === 2, '할인방법: 공통지원금 / 선택약정')
  check(await page.locator('[data-t="detail-months"] button').count() === 4, '할부개월 4종')
  check(await page.locator('[data-t="detail-insurance"][aria-pressed="true"]').count() === 1, '파손보험 기본 가입(무료)')
  const dev = num(await t('[data-t="detail-card"] [data-t="card-device"]')), plan = num(await t('[data-t="detail-card"] [data-t="card-plan"]')), tot = num(await t('[data-t="detail-card"] [data-t="card-total"]'))
  check(tot === dev + plan, `월 납부 예상 = 휴대폰 월 납부금 + 요금제 (${dev} + ${plan} = ${tot})`)
  check((await t('[data-t="detail-card"]')).includes('VAT 포함'), 'VAT 포함 표기')
  const cardTxt = await t('[data-t="detail-card"]')
  for (const k of ['할부원금', '출고가', '공통지원금', '추가지원금', '총 할부이자', '파손보험', '요금제', '월 납부 예상 금액']) check(cardTxt.includes(k), `카드 항목: ${k}`)
  check(cardTxt.includes('50,000원') && cardTxt.includes('무료'), '파손보험 50,000원 → 무료')
  // 부가서비스 +3,500
  await page.locator('[data-t="detail-addon"]').click(); await page.waitForTimeout(150)
  check(num(await t('[data-t="detail-card"] [data-t="card-plan"]')) === plan + 3500, '부가서비스 → 요금제 +3,500')
  // 일시불
  await page.locator('[data-t="detail-months"] button', { hasText: '일시불' }).click(); await page.waitForTimeout(150)
  check((await t('[data-t="detail-card"] [data-t="card-device"]')).includes('일시불'), '일시불 선택 시 월 납부금 자리 "일시불"')
  // 선택약정 → 요금 25% 할인 행
  await page.locator('[data-t="detail-method"] button', { hasText: '선택약정' }).click(); await page.waitForTimeout(150)
  check((await t('[data-t="detail-card"]')).includes('선택약정 할인 25%'), '선택약정 → 요금 할인 행 노출')
  // 통신사 바꾸면 가입유형이 따라간다 (KT 사용 → KT 는 기기변경)
  await page.locator('[data-t="detail-carriers"] button', { hasText: /^kt/i }).click(); await page.waitForTimeout(150)
  check((await t('[data-t="detail-join-note"]')).includes('기기변경'), 'KT 사용자가 KT 선택 → 기기변경')
  // 신청하기 → AI / 전문상담사(평일 18시까지)
  await page.locator('[data-t="detail-card"] [data-t="card-apply"]').click(); await page.waitForTimeout(300)
  check(await page.locator('[data-t="apply-ai"]').count() === 1 && await page.locator('[data-t="apply-human"]').count() === 1, '신청 분기 모달: AI / 전문 상담사')
  check((await t('[data-t="apply-human"]')).includes('평일 18시까지'), '전문 상담사 운영시간 "평일 18시까지"')
  await page.locator('[data-t="apply-human"]').click(); await page.waitForTimeout(600)
  check(page.url().includes('/consult') && page.url().includes('cat=phone'), `전문 상담사 → ${page.url().split('/').pop()}`)

  // ── 알뜰폰: 목록
  await page.goto('http://localhost:4173/phone/mvno', { waitUntil: 'networkidle' }); await page.waitForTimeout(400)
  check(await page.locator('[data-t="mvno-featured"] [data-t="mvno-card"]').count() === 2, '대표 요금제 2')
  check(await page.locator('[data-t="mvno-brands"] [data-t="mvno-card"]').count() === 6, '브랜드별 혜택 6')
  check(await page.locator('[data-t="mvno-all"] table').count() === 0, '전체 목록은 접힘')
  await page.locator('[data-t="mvno-all-btn"]').click(); await page.waitForTimeout(200)
  check(await page.locator('[data-t="mvno-all"] tbody tr').count() === 14, '전체 요금제 보러가기 → 14종')
  await page.locator('[data-t="mvno-all"] button', { hasText: /^KT망$/ }).click(); await page.waitForTimeout(150)
  check(await page.locator('[data-t="mvno-all"] tbody tr').count() === 5, 'KT망 필터 → 5')

  // ── 알뜰폰: 상세 + 신규불가 팝업 + eSIM 차단 + 유심비
  await page.goto('http://localhost:4173/phone/mvno/hello-7g', { waitUntil: 'networkidle' }); await page.waitForTimeout(400)
  for (const s of ['mvno-join', 'mvno-act', 'mvno-simown', 'mvno-simtype', 'mvno-cust']) check(await page.locator(`[data-t="${s}"]`).count() === 1, `옵션 섹션: ${s}`)
  check((await t('[data-t="mvno-join"]')).includes('신규가입') && (await t('[data-t="mvno-join"]')).includes('번호이동'), '가입유형: 신규가입 / 번호이동')
  check((await t('[data-t="mvno-simtype"]')).includes('일반유심') && (await t('[data-t="mvno-simtype"]')).includes('NFC유심') && (await t('[data-t="mvno-simtype"]')).includes('eSIM'), '유심종류: 일반 / NFC / eSIM')
  check(num(await t('[data-t="mvno-first"]')) === 17600 + 7700, '첫 달 = 월요금 17,600 + 일반유심 7,700')
  await page.locator('[data-t="mvno-join"] button', { hasText: '신규가입' }).click(); await page.waitForTimeout(250)
  check(await page.locator('[data-t="mvno-popup"]').count() === 1, '신규 불가 요금제에서 신규 선택 → 팝업')
  check((await t('[data-t="mvno-popup"]')).includes('신규로 개통이 불가능한 요금제'), '팝업 문구: 신규로 개통이 불가능한 요금제')
  await page.locator('[data-t="mvno-popup-mnp"]').click(); await page.waitForTimeout(200)
  check(await page.locator('[data-t="mvno-popup"]').count() === 0, '번호이동으로 진행 → 팝업 닫힘')
  check((await page.locator('[data-t="mvno-join"] button[aria-pressed="true"]').innerText()).includes('번호이동'), '가입유형이 번호이동으로')
  await page.locator('[data-t="mvno-simtype"] button', { hasText: 'eSIM' }).click(); await page.waitForTimeout(200)
  check(await page.locator('[data-t="mvno-blocked"]').count() === 1 && (await t('[data-t="mvno-blocked"]')).includes('eSIM'), 'eSIM 미지원 요금제 → 차단 안내')
  check(await page.locator('[data-t="mvno-apply"]').isDisabled(), '차단 상태에서 신청 버튼 비활성')
  await page.locator('[data-t="mvno-simown"] button', { hasText: '보유' }).first().click(); await page.waitForTimeout(200)
  check(num(await t('[data-t="mvno-first"]')) === 17600, '유심 보유 → 유심비 0, 첫 달 17,600')
  check(!(await page.locator('[data-t="mvno-apply"]').isDisabled()), '차단 해제 → 신청 가능')
  await page.locator('[data-t="mvno-apply"]').click(); await page.waitForTimeout(300)
  check(await page.locator('[data-t="apply-ai"]').count() === 1, '온라인 신청 → AI/상담사 분기')

  if (errors.length) { console.log('PAGEERROR:', errors.join(' | ')); fail++ }
  await browser.close()
  console.log(fail === 0 ? 'SMOKE: ALL PASS' : `SMOKE: ${fail} FAIL`)
  process.exit(fail === 0 ? 0 : 1)
})()
