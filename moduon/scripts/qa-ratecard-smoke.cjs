// 스모크 — KT 단말 가격표(K1 2차) → 소비자 가격 · 사업자 R/B
// ① 가격표 값이 엑셀 원본과 일치하는가 (어드민 표 전문 스팟체크)
// ② 요금제 목록이 가격표 열에서 나오는가
// ③ 가격표 값이 실제 할부원금이 되는가 (지원금을 또 빼지 않는가)
// ④ 'X' 조합은 아예 고를 수 없는가 (버튼 비활성)
// ⑤ 가격표 미수록 단말은 기존 계산 경로로 떨어지는가 (임의 가격을 만들지 않는가)
// ⑥ 셀프개통 마진은 미수록 단말에만 걸리는가
// ⑦ 사업자 R/B(리베이트 표)가 그대로 살아 있고 개인에겐 안 보이는가
let pw
try { pw = require('/opt/node22/lib/node_modules/playwright') } catch { pw = require('playwright') }
const BASE = process.env.QA_BASE ?? 'http://localhost:4173'
const num = (s) => Number(String(s).replace(/[^0-9]/g, '')) || 0

;(async () => {
  const browser = await pw.chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))

  let fail = 0
  const check = (ok, label) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`) }
  const wait = (ms) => page.waitForTimeout(ms)
  const go = async (path) => {
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('main, header', { timeout: 5000 }).catch(() => {})
    await wait(400)
  }
  const session = async (s) => page.evaluate((v) => {
    try { v ? localStorage.setItem('moduon_session_v1', JSON.stringify(v)) : localStorage.removeItem('moduon_session_v1') } catch { /* noop */ }
  }, s)
  const rowCells = async (sel) => (await page.locator(sel).allInnerTexts().catch(() => [])).map((t) => t.trim())
  const previewRows = async () => {
    try {
      return await page.locator('[data-t="self-margin-row"]').evaluateAll((trs) => trs.map((tr) => {
        const td = [...tr.querySelectorAll('td')].map((x) => x.textContent.trim())
        return { src: tr.dataset.src, label: td[0], basis: td[1], rebate: td[2], margin: td[3], principal: td[4], total: td[5] }
      }))
    } catch { return [] }
  }

  await go('/login')
  await page.evaluate(() => {
    try {
      ;['moduon_db_v1', 'moduon_session_v1'].forEach((k) => localStorage.removeItem(k))
      sessionStorage.clear()
    } catch { /* noop */ }
  })

  // ───────────── ① 가격표 값이 엑셀과 일치 ─────────────
  console.log('\n── ① 가격표 값이 엑셀과 일치 ──')
  await session({ role: 'admin' })
  await go('/admin/policies')
  const body = await page.evaluate(() => document.body.innerText)
  check(body.includes('KT 단말 가격표 K1'), '가격표 출처 표기(KT 단말 가격표 K1)')
  check(body.includes('2026-09-18'), '가격표 적용일 표기')
  check(body.includes('단말 판매가'), '칸의 의미(고객 단말 판매가) 고지')

  const priceRows = await page.locator('[data-t="price-card-row"]').count()
  check(priceRows === 10, `가격표 전문 10행 (${priceRows})`)
  // 엑셀 원본(만원) — [모델명, 상품명, 초이스110 MNP 공시/선약, 기변 공시/선약, 베이직4G 신규·MNP·기변 공시/선약]
  const expectRows = {
    flip8: 'F776,갤럭시 Z플립8 256G,81,X,86,X,X,X,X,X,X,X',
    fold8: 'F971,갤럭시 Z폴드8 256G,140,X,145,X,X,X,X,X,X,X',
    s26: 'S942,갤럭시 S26 256G,38,X,42,X,X,X,X,X,X,X',
    s26u: 'S948,갤럭시 S26 Ultra 256G,92,X,96,X,X,X,X,X,X,X',
    ip18pm: 'AIP18PM,아이폰18 Pro Max,163,183,166,180,X,X,X,X,X,X',
    a376: 'A376,A37 5G,0,X,0,X,0,X,0,X,10,X',
  }
  for (const [key, want] of Object.entries(expectRows)) {
    const got = (await rowCells(`[data-t="price-card-row"][data-row="${key}"] td`)).join(',').replace(/\s+/g, ' ')
    check(got === want, `${key} 행 = 엑셀 (${got})`)
  }
  check(body.includes('인터넷 결합 수수료') && body.includes('미반영'), '인터넷 결합 수수료 미반영 고지')

  // ───────────── ② 요금제 목록 = 가격표 열 ─────────────
  console.log('\n── ② 요금제 목록이 가격표에서 나온다 ──')
  await go('/calculator/phone')
  const planIds = await page.locator('[data-t="calc-plan"]').evaluateAll((bs) => bs.map((b) => b.dataset.id))
  check(planIds.join(',') === 'choice110,basic4g', `요금제 선택지가 가격표 열 2개와 일치 (${planIds.join(',') || '-'})`)

  // ───────────── ③ 가격표 값이 곧 할부원금 ─────────────
  console.log('\n── ③ 가격표 값이 실제 할부원금이 된다 ──')
  const dis0 = async (sel) => page.locator(sel).isDisabled().catch(() => null)
  const principal = async () => num(await page.locator('[data-t="calc-principal"]').first().innerText().catch(() => ''))
  const source = async () => (await page.locator('[data-t="price-source"]').innerText().catch(() => '')).trim()
  // 기본값: 폴드8 · 초이스110 · 번호이동 · 공시지원 = 140만
  check(await principal() === 1400000, `Z폴드8 · 번호이동 · 공시지원 → 할부원금 1,400,000 (${(await principal()).toLocaleString()})`)
  check((await source()).includes('KT 단말 가격표 K1 적용가'), `근거에 가격표 적용가 표기 (${await source()})`)
  // 기기변경으로 바꾸면 다른 칸 — 145만
  await page.locator('[data-t="calc-join"][data-id="chg"]').click()
  await wait(400)
  check(await principal() === 1450000, `기기변경으로 바꾸면 1,450,000 (${(await principal()).toLocaleString()})`)
  // 단말을 바꾸면 그 줄 — S26 기변 42만
  await page.locator('[data-t="calc-device"][data-id="s26"]').click()
  await wait(400)
  check(await principal() === 420000, `S26 · 기기변경 → 420,000 (${(await principal()).toLocaleString()})`)
  // 가격표 모드에선 '추가지원금(15%)' 줄을 쓰지 않는다 — 이중 계상 방지
  const box = await page.locator('[data-t="calc-breakdown"]').first().innerText().catch(() => '')
  check(box.includes('가격표 반영 할인') && !box.includes('추가지원금'),
    `가격표 모드 — 내역에 15% 추가지원금 줄 없음 (${box.split('\n').filter((l) => l.includes('지원') || l.includes('할인')).join(' / ') || '없음'})`)
  check(await dis0('[data-t="calc-extra15"]') === true, '가격표 모드 — 15% 추가지원금 토글 비활성(무의미한 조작 차단)')

  // ───────────── ④ 'X' 조합은 고를 수 없다 ─────────────
  console.log("\n── ④ 'X' 조합 버튼 비활성 ──")
  const dis = async (sel) => page.locator(sel).isDisabled().catch(() => null)
  check(await dis('[data-t="calc-join"][data-id="new"]') === true, '초이스110 — 010 신규 비활성(시트에 열 없음)')
  check(await dis('[data-t="calc-method"][data-id="select"]') === true, '갤럭시 S26 — 선택약정 비활성(X)')
  check(await dis('[data-t="calc-join"][data-id="mnp"]') === false, '번호이동은 활성')
  // 아이폰18 Pro 는 선택약정 열이 있다 → 우리 판매 단말엔 없으니 가격표 미수록 단말로 확인
  await page.locator('[data-t="calc-plan"][data-id="basic4g"]').click()
  await wait(400)
  check((await source()).includes('취급하지 않는 조합'), `S26 · 베이직4GB — 전 조합 X 안내 (${await source()})`)

  // ───────────── ⑤ 미수록 단말은 기존 계산 경로 ─────────────
  console.log('\n── ⑤ 가격표 미수록 단말 ──')
  await page.locator('[data-t="calc-plan"][data-id="choice110"]').click()
  await page.locator('[data-t="calc-device"][data-id="ip17p"]').click()
  await wait(400)
  check((await source()).includes('가격표 미수록'), `아이폰17프로 — 미수록 안내 (${await source()})`)
  check(await dis('[data-t="calc-method"][data-id="select"]') === false, '미수록 단말은 방식 제한 없음(선택약정 활성)')
  check(await principal() > 0, `미수록 단말도 계산값으로 견적이 나온다 (${(await principal()).toLocaleString()})`)

  // ───────────── ⑥ 셀프개통 마진은 미수록 단말에만 ─────────────
  console.log('\n── ⑥ 마진은 가격표가 못 채우는 조합에만 ──')
  await session({ role: 'admin' })
  await go('/admin/policies')
  const rows = await previewRows()
  check(rows.length === 4, `미리보기 4행 (${rows.length})`)
  check(rows[0]?.src === 'price' && rows[0]?.basis.includes('가격표'), `Z폴드8 — 가격표 적용가 (${rows[0]?.basis})`)
  check(num(rows[0]?.principal) === 1400000, `Z폴드8 할부원금 = 가격표 1,400,000 (${rows[0]?.principal})`)
  check(rows[0]?.rebate === '—' && rows[0]?.margin === '—', '가격표 적용 행에는 리베이트·마진이 걸리지 않는다')
  const mg = rows.find((r) => r.src === 'margin')
  check(!!mg && num(mg.margin) === 100000, `미수록 단말 행만 마진 100,000 (${mg?.label ?? '행 없음'})`)

  // ───────────── ⑦ 사업자 R/B — 리베이트 표는 그대로 ─────────────
  console.log('\n── ⑦ 사업자 R/B(리베이트 표) 유지 ──')
  check(body.includes('사업자 R/B 전용'), '리베이트 표가 R/B 전용임을 고지')
  check(body.includes('직전 수령분'), '리베이트 표가 직전 수령분임을 고지')
  await session({ role: 'member', memberId: 'MB3', type: '사업자', tier: 'seller', code: 'A1N7742' })
  await go('/calculator/phone')
  check((await page.locator('[data-t="rb-panel"]').count()) === 1, '사업자 — R/B 블록 노출')
  const rbRebate = num(await page.locator('[data-t="rb-rebate"]').innerText().catch(() => ''))
  check(rbRebate === 470000, `R/B 단가 = 리베이트 표 470,000 (폴드8·번호이동·초이스110) (${rbRebate.toLocaleString()})`)
  await page.locator('[data-t="calc-join"][data-id="chg"]').click()
  await wait(400)
  check(num(await page.locator('[data-t="rb-rebate"]').innerText().catch(() => '')) === 430000, '기기변경 → 430,000')
  await session({ role: 'member', memberId: 'MB1', type: '개인' })
  await go('/calculator/phone')
  check((await page.locator('[data-t="rb-panel"]').count()) === 0, '개인회원 — R/B 비노출(기존 규칙 유지)')

  check(errors.length === 0, `pageerror 0 (${errors.length}${errors[0] ? ` — ${errors[0].slice(0, 100)}` : ''})`)
  await browser.close()
  console.log(fail === 0 ? '\nSMOKE: ALL PASS' : `\nSMOKE: ${fail} FAIL`)
  process.exit(fail === 0 ? 0 : 1)
})()
