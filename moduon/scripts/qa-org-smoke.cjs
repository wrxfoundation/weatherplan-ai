// 스모크 — 조직 3계층(권역 총판 · 지역 대리점 · 셀러) · 개인식별번호 · R/B · 계층 정산 드릴다운
// ① 회원가입 개인/사업자 분기와 식별번호 발급  ② 등급별 R/B 노출  ③ 정산 드릴다운 마스킹
// ④ 합계 = 하부 합 + 영업비  ⑤ 어드민 조직·회원 관리
// 세션은 localStorage moduon_session_v1 을 직접 주입한다(데모 로그인과 같은 모양).
let pw
try { pw = require('/opt/node22/lib/node_modules/playwright') } catch { pw = require('playwright') }
const BASE = process.env.QA_BASE ?? 'http://localhost:4173'

;(async () => {
  const browser = await pw.chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))

  let fail = 0
  const check = (ok, label) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`) }
  const count = async (sel) => { try { return await page.locator(sel).count() } catch { return -1 } }
  const text = async (sel) => { try { return await page.locator(sel).first().innerText({ timeout: 2000 }) } catch { return '' } }
  const bodyText = async () => { try { return await page.evaluate(() => document.body.innerText) } catch { return '' } }
  const attr = async (sel, n) => { try { return await page.locator(sel).first().getAttribute(n, { timeout: 2000 }) } catch { return null } }
  const wait = (ms) => page.waitForTimeout(ms)
  const tail = () => page.url().replace(BASE, '')
  const go = async (path) => {
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('main, header', { timeout: 5000 }).catch(() => {})
    await wait(350)
  }
  const session = async (s) => page.evaluate((v) => {
    try { v ? localStorage.setItem('moduon_session_v1', JSON.stringify(v)) : localStorage.removeItem('moduon_session_v1') } catch { /* noop */ }
  }, s)
  // 드릴다운 행 — 금액은 data-amount 로 읽는다(화면 포맷과 무관하게 합계를 검증하기 위해)
  const rows = async () => {
    try {
      return await page.locator('[data-t="settle-row"]').evaluateAll((els) => els.map((e) => ({
        kind: e.dataset.kind, masked: e.dataset.masked === '1', depth: Number(e.dataset.depth),
        amount: Number(e.dataset.amount), opex: Number(e.dataset.opex), open: e.dataset.open === '1',
        name: (e.querySelector('button span:nth-child(2)')?.textContent ?? '').trim(),
      })))
    } catch { return [] }
  }
  const clickRow = async (i) => { try { await page.locator('[data-t="settle-row"] button').nth(i).click(); await wait(320) } catch { /* noop */ } }

  // ── 시드 초기화 (v14 에서 출발)
  await go('/login')
  await page.evaluate(() => {
    try {
      ;['moduon_db_v1', 'moduon_session_v1', 'moduon_notif_sig', 'moduon_cnotif_sig', 'moduon_fp_open', 'moduon_points'].forEach((k) => localStorage.removeItem(k))
      sessionStorage.clear()
    } catch { /* noop */ }
  })
  await go('/')

  // ───────────────────────────── ① 회원가입 — 개인 ─────────────────────────────
  console.log('\n── ① 회원가입 · 개인 ──')
  await go('/signup')
  check((await count('[data-t="signup-type"] button')) === 2, `회원 구분 2종 (${await count('[data-t="signup-type"] button')})`)
  await page.locator('[data-t="type-personal"]').click(); await wait(250)
  check((await count('[data-t="signup-region"]')) === 0, '개인 선택 시 추천인(권역) 입력 없음')
  await page.locator('input[placeholder="실명을 입력해 주세요"]').fill('스모크개인')
  await page.locator('input[placeholder="010-0000-0000"]').fill('010-1111-2222')
  await page.locator('button', { hasText: '가입하기' }).click(); await wait(600)
  check(tail().startsWith('/benefits'), `개인 가입 → /benefits (${tail()})`)
  const sPersonal = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('moduon_session_v1')) } catch { return null } })
  check(sPersonal?.role === 'member' && sPersonal?.type === '개인', `세션 개인회원 (${sPersonal?.type})`)

  await go('/calculator/phone')
  check((await count('[data-t="rb-panel"]')) === 0, '개인회원 — 휴대폰 계산기에 R/B 없음')
  await go('/calculator/rental')
  check((await count('[data-t="rb-panel"]')) === 0, '개인회원 — 렌탈 계산기에 R/B 없음')

  // ───────────────────────────── ① 회원가입 — 사업자(셀러) ─────────────────────────────
  console.log('\n── ① 회원가입 · 사업자 + 식별번호 발급 ──')
  await go('/signup')
  await page.locator('[data-t="type-biz"]').click(); await wait(250)
  check((await count('[data-t="signup-region"]')) === 1, '사업자 선택 시 추천인(권역) 입력 노출')
  check((await count('[data-t="signup-tier"] button')) === 3, `가입 등급 3종 (${await count('[data-t="signup-tier"] button')})`)
  await page.locator('input[placeholder="실명을 입력해 주세요"]').fill('스모크셀러')
  await page.locator('input[placeholder="010-0000-0000"]').fill('010-3333-4444')
  await page.locator('[data-t="signup-region"]').selectOption({ index: 1 }); await wait(250)
  check((await count('[data-t="signup-area"]')) === 1, '권역 선택 후 지역(대리점) 노출')
  await page.locator('[data-t="signup-area"]').selectOption({ index: 1 }); await wait(250)
  const preview = await text('[data-t="code-preview"]')
  check(/A1○0000/.test(preview.replace(/\s/g, '')), `식별번호 미리보기 형식 A1○0000 (${preview.split('\n')[1] ?? ''})`)
  await page.locator('button', { hasText: '식별번호 발급하고 가입' }).click(); await wait(700)
  const issued = (await text('[data-t="issued-code"]')).split('\n')[1] ?? ''
  check(/^A1[A-HJ-NP-Z]\d{4}$/.test(issued.trim()), `발급된 개인식별번호 A1 + 셀러코드 (${issued.trim()})`)
  const issuedBody = await bodyText()
  check(issuedBody.includes('권역 A') && issuedBody.includes('지역 A1'), '완료 화면에 권역·지역 소속 표기')

  // ───────────────────────────── ② R/B — 등급별 노출 ─────────────────────────────
  console.log('\n── ② R/B (사업자 전용) ──')
  await go('/calculator/phone')
  check((await count('[data-t="rb-panel"]')) === 1, '사업자회원 — 휴대폰 계산기 상부에 R/B 노출')
  check((await attr('[data-t="rb-panel"]', 'data-tier')) === 'seller', `R/B 등급 seller (${await attr('[data-t="rb-panel"]', 'data-tier')})`)
  check((await count('[data-t="rb-rebate"]')) === 1 && (await count('[data-t="rb-mine"]')) === 1, '셀러: R/B 단가 + 내 수당 행')
  check((await count('[data-t="rb-customer"]')) === 1, '셀러: 고객 지원금 행(재량 있음)')
  check((await count('[data-t="rb-distributor"]')) === 0, '셀러: 총판 몫은 보이지 않음')
  // R/B 블록이 소비자 월 납부금보다 위(상부)에 있어야 한다
  const order = await page.evaluate(() => {
    const rb = document.querySelector('[data-t="rb-panel"]')
    const calc = document.querySelector('main .grid.items-start')
    if (!rb || !calc) return null
    return rb.compareDocumentPosition(calc) & Node.DOCUMENT_POSITION_FOLLOWING ? 'rb-first' : 'calc-first'
  }).catch(() => null)
  check(order === 'rb-first', `R/B 블록이 계산 결과보다 상부 (${order})`)

  await session({ role: 'agency', agencyId: 'AG3' })
  await go('/calculator/rental')
  check((await attr('[data-t="rb-panel"]', 'data-tier')) === 'agency', `대리점 — 렌탈 R/B 등급 agency (${await attr('[data-t="rb-panel"]', 'data-tier')})`)
  check((await count('[data-t="rb-customer"]')) === 0, '대리점: 고객 지원금 행 없음(재량 없음)')
  check((await text('[data-t="rb-mine"]')).includes('대리점'), '대리점: 내 몫 라벨 = 건당 영업비(대리점)')

  await session({ role: 'regional', distributorId: 'D1' })
  await go('/calculator/phone')
  check((await attr('[data-t="rb-panel"]', 'data-tier')) === 'distributor', `총판 — R/B 등급 distributor (${await attr('[data-t="rb-panel"]', 'data-tier')})`)

  await session(null)
  await go('/calculator/phone')
  check((await count('[data-t="rb-panel"]')) === 0, '비로그인 — R/B 없음')

  // ───────────────────────────── ③ 정산 드릴다운 — 셀러 ─────────────────────────────
  console.log('\n── ③ 정산 드릴다운 · 열람 범위 ──')
  await session({ role: 'partner', tenantId: 'T1' })
  await go('/office/settlement')
  check((await count('[data-t="settle-leaf"]')) === 1, '셀러 — 본인 금액만(하부 없음)')
  check((await text('[data-t="seller-code"]')).includes('B1K2580'), `셀러 화면에 식별번호 B1K2580 (${(await text('[data-t="seller-code"]')).split('\n')[0]})`)
  const sellerAmt = Number(await attr('[data-t="settle-leaf"]', 'data-amount'))
  check(sellerAmt > 0, `셀러 영업이익 > 0 (${sellerAmt.toLocaleString()})`)

  // ── 대리점 — 자기 셀러까지 실명
  await session({ role: 'agency', agencyId: 'AG3' })
  await go('/agency')
  check((await count('[data-t="settle-drill"]')) === 1, '대리점 — 정산 드릴다운 표시')
  let r = await rows()
  check(r.length === 1 && r[0].kind === 'agency', `대리점 루트 1행 (${r.length}, ${r[0]?.kind})`)
  await clickRow(0)
  r = await rows()
  const agSellers = r.filter((x) => x.kind === 'seller')
  check(agSellers.length >= 2, `대리점 펼침 → 셀러 ${agSellers.length}행`)
  check(agSellers.every((x) => !x.masked), '대리점 — 자기 셀러는 실명(마스킹 없음)')
  const agOpex = Number(await attr('[data-t="settle-opex"]', 'data-amount'))
  const agSum = agSellers.reduce((a, b) => a + b.amount, 0)
  check(agSum + agOpex === r[0].amount, `합계 검증: 셀러합 ${agSum.toLocaleString()} + 영업비 ${agOpex.toLocaleString()} = 총액 ${r[0].amount.toLocaleString()}`)
  check(agOpex > 0, `영업비(건당 +@) > 0 (${agOpex.toLocaleString()})`)
  check((await bodyText()).includes('영업비'), '정산서에 영업비 명칭 표기')

  // ── 총판 — 대리점까지만 실명, 셀러는 ***
  await session({ role: 'regional', distributorId: 'D1' })
  await go('/regional')
  check((await count('[data-t="settle-drill"]')) === 1, '총판 — 정산 드릴다운 표시')
  r = await rows()
  check(r[0]?.kind === 'distributor', `총판 루트 kind=distributor (${r[0]?.kind})`)
  await clickRow(0)
  r = await rows()
  const dAgencies = r.filter((x) => x.kind === 'agency')
  check(dAgencies.length === 3, `총판 펼침 → 대리점 ${dAgencies.length}행 (B1·B2·B3)`)
  check(dAgencies.every((x) => !x.masked), '총판 — 대리점은 실명(1대까지 열람)')
  const dOpex = Number(await attr('[data-t="settle-opex"]', 'data-amount'))
  check(dAgencies.reduce((a, b) => a + b.amount, 0) + dOpex === r[0].amount, `합계 검증: 대리점합 + 영업비 = 총판 총액 (${r[0].amount.toLocaleString()})`)
  // 대리점 한 칸 더 펼치면 셀러가 *** 로 내려온다
  const firstAgencyIdx = r.findIndex((x) => x.kind === 'agency')
  await clickRow(firstAgencyIdx)
  r = await rows()
  const maskedSellers = r.filter((x) => x.kind === 'seller')
  check(maskedSellers.length >= 1, `총판 — 대리점 펼침 → 셀러 ${maskedSellers.length}행`)
  check(maskedSellers.every((x) => x.masked && x.name === '***'), '총판 — 셀러는 *** 마스킹(본사만 열람)')
  check((await bodyText()).includes('본사만 열람'), '마스킹 사유 안내 문구')

  // ── 본사 — 전 계층 실명
  await session({ role: 'admin' })
  await go('/admin/settlements')
  check((await count('[data-t="settle-drill"]')) === 1, '본사 — 계층 정산 명세 표시')
  r = await rows()
  check(r[0]?.kind === 'hq', `본사 루트 kind=hq (${r[0]?.kind})`)
  await clickRow(0)
  r = await rows()
  const hqDists = r.filter((x) => x.kind === 'distributor')
  check(hqDists.length === 4, `본사 펼침 → 총판 ${hqDists.length}곳`)
  await clickRow(r.findIndex((x) => x.kind === 'distributor' && x.amount > 0))
  r = await rows()
  const hqAg = r.filter((x) => x.kind === 'agency')
  check(hqAg.length >= 1 && hqAg.every((x) => !x.masked), `본사 — 대리점 실명 ${hqAg.length}행`)
  await clickRow(r.findIndex((x) => x.kind === 'agency'))
  r = await rows()
  const hqSellers = r.filter((x) => x.kind === 'seller')
  check(hqSellers.length >= 1 && hqSellers.every((x) => !x.masked && x.name !== '***'), `본사 — 셀러까지 실명 ${hqSellers.length}행`)

  // ───────────────────────────── ④ 어드민 조직·회원 ─────────────────────────────
  console.log('\n── ④ 어드민 조직 · 회원 ──')
  await go('/admin/org')
  check((await count('[data-t="org-dist"]')) === 4, `권역 총판 ${await count('[data-t="org-dist"]')}곳`)
  check((await count('[data-t="org-agency"]')) === 8, `지역 대리점 ${await count('[data-t="org-agency"]')}곳`)
  const orgBody = await bodyText()
  check(orgBody.includes('A1J1234'), '조직도에 예시 식별번호 A1J1234 노출')
  check((await count('[data-t="org-orphan"]')) >= 1, '본사 직할(미소속) 셀러 구간 표시')

  await page.locator('[data-t="org-tabs"] button', { hasText: '회원' }).click(); await wait(350)
  check((await count('[data-t="org-member"]')) >= 6, `회원 ${await count('[data-t="org-member"]')}명 (개인 + 사업자)`)
  const memberBody = await bodyText()
  check(memberBody.includes('개인') && memberBody.includes('사업자'), '회원 목록에 개인/사업자 구분')
  check(memberBody.includes('식별번호 없음'), '개인 회원은 식별번호 없음 표기')
  // 대기 회원 승인
  const pending = await count('span.rounded-full:has-text("대기 → 승인"), button:has-text("대기 → 승인")')
  if (pending > 0) {
    await page.locator('button', { hasText: '대기 → 승인' }).first().click(); await wait(400)
    check(true, '대기 회원 승인 처리')
  }

  // 영업비 명칭 변경 → 정산 화면에 반영
  await page.locator('[data-t="org-tabs"] button', { hasText: '조직도' }).click(); await wait(250)
  await page.locator('[data-t="opex-preset"]', { hasText: '운영비' }).click(); await wait(400)
  await go('/admin/settlements')
  await clickRow(0); await wait(250)
  check((await bodyText()).includes('운영비'), '영업비 → 운영비 변경이 정산서에 반영')

  // ───────────────────────────── ⑤ 오류 없음 ─────────────────────────────
  check(errors.length === 0, `pageerror 0 (${errors.length}${errors[0] ? ` — ${errors[0].slice(0, 120)}` : ''})`)

  await browser.close()
  console.log(fail === 0 ? '\nSMOKE: ALL PASS' : `\nSMOKE: ${fail} FAIL`)
  process.exit(fail === 0 ? 0 : 1)
})()
