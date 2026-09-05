// 스모크 — /calculator/rental(렌탈 계산기) + /office 가망고객 TOP5
// 계산 정합성까지: 카드할인 토글이 실부담을 정확히 낮추는지, 총액 최저 배지가 실제 최소인지.
let pw
try { pw = require('/opt/node22/lib/node_modules/playwright') } catch { pw = require('playwright') }

const num = (s) => Number(String(s).replace(/[^0-9]/g, '')) || 0

;(async () => {
  const browser = await pw.chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))

  let fail = 0
  const check = (ok, label) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`) }

  // ── 렌탈 계산기 ──
  await page.goto('http://localhost:4173/calculator/rental', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  let text = await page.evaluate(() => document.body.innerText)
  for (const m of ['렌탈 견적 계산기', '방문형', '셀프형', '제휴카드 청구할인', '동시 렌탈 대수', '관리 방식 × 기간 비교', '소유권 이전', '계약 전에 꼭 확인하세요', '의무사용']) {
    check(text.includes(m), `렌더: ${m}`)
  }
  check(text.includes('총액 최저'), '총액 최저 배지')

  const sticky = () => page.locator('aside .tnum.text-\\[32px\\]').first().innerText().then(num)

  // 카드할인은 기본 ON — 끄면 실부담이 올라가야 한다
  const withCard = await sticky()
  await page.click('text=제휴카드 청구할인')
  await page.waitForTimeout(350)
  const noCard = await sticky()
  check(noCard > withCard, `카드할인 해제 시 실부담 증가 (${withCard} → ${noCard})`)
  await page.click('text=제휴카드 청구할인')
  await page.waitForTimeout(350)

  // 동시 2대 → 추가 할인
  const one = await sticky()
  await page.click('text=2대')
  await page.waitForTimeout(350)
  const two = await sticky()
  check(two < one, `동시렌탈 2대 시 실부담 감소 (${one} → ${two})`)

  // 비교표 총 부담 최저 열 검증
  const rows = await page.evaluate(() => [...document.querySelectorAll('table tbody tr')].map((tr) => {
    const td = [...tr.querySelectorAll('td')].map((x) => x.innerText.trim())
    return { label: td[0], total: td[3] }
  }))
  const totals = rows.map((r) => num(r.total))
  check(rows.length === 4 && totals.every((v) => v > 0), `조합 4행 산출 (${totals.join(' / ')})`)
  const minIdx = totals.indexOf(Math.min(...totals))
  check(rows[minIdx].label.includes('총액 최저'), `총액 최저 배지가 실제 최소 행 (${rows[minIdx].label.split('\n')[0]})`)

  // 탭 3분할
  check((await page.locator('a[href="/calculator/rental"]').count()) > 0, '계산기 탭에 렌탈 추가')

  // ── 오피스 가망고객 TOP5 ──
  await page.addInitScript(() => localStorage.setItem('moduon_session_v1', JSON.stringify({ role: 'partner', tenantId: 'T1' })))
  await page.goto('http://localhost:4173/office', { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  text = await page.evaluate(() => document.body.innerText)
  check(text.includes('가망고객 TOP5'), '렌더: 가망고객 TOP5')
  check(text.includes('잔여개월수 기준') && text.includes('위약금 기준'), '랭킹 기준 토글 2종')
  await page.click('text=위약금 기준')
  await page.waitForTimeout(400)
  text = await page.evaluate(() => document.body.innerText)
  check(text.includes('위약금') && (text.includes('위약금 없음') || text.includes('위약금 부담')), '위약금 기준 전환 시 사유 문구')

  if (errors.length) { console.log('PAGEERROR:', errors.join(' | ')); fail++ }
  await browser.close()
  console.log(fail === 0 ? 'SMOKE: ALL PASS' : `SMOKE: ${fail} FAIL`)
  process.exit(fail === 0 ? 0 : 1)
})()
