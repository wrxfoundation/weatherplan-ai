// 스모크 — 리베이트 단가표 업로드(양식 무관 자동 인식 → 확인 → 반영) (2026-10-01 운영팀 요청)
// "양식이 달라도 단말 × 요금구간 × 가입유형 리베이트만 뽑아 기존 DB 의 같은 칸을 갱신" 이 실제로 되는지 끝까지 본다.
// ① 기본값 = KT K1 원본 시트 14행 × 5구간 · 우리 단말 매핑(아이폰17 3종 → '아이폰17류(전체)', A56 → '그외 5G')
// ② 원본과 같은 파일을 올리면 인식 결과가 지금 표와 같다 — "바뀌는 값 없음"
// ③ 금액을 바꾼 파일(K2 · 10/1 · 플립8·폴드8·아이폰17류 110K MNP) → 바뀌는 R/B 5건을 정확히 보여 주고, 바뀐 칸을 강조
// ④ 반영 → 판매자 설계 화면 R/B 가 새 값(플립8 520,000) · 근거 표기 K2 · 이력 '사용 중'
// ⑤ 매핑 고치기 — S26 울트라를 'S26류'에서 빼면 '그외 5G' 로 떨어지고, 다음 업로드에 그 매핑을 기억한다
// ⑥ 적용일이 미래면 예약 — 지금 표는 그대로
// ⑦ 지우기 → 기본값으로 복귀 · 잘못된 파일은 읽지 않고 이유를 말한다
let pw
try { pw = require('/opt/node22/lib/node_modules/playwright') } catch { pw = require('playwright') }
const { join } = require('node:path')
const BASE = process.env.QA_BASE ?? 'http://localhost:4173'
const FIX = (f) => join(__dirname, 'fixtures', f)
const num = (s) => Number(String(s).replace(/[^0-9]/g, '')) || 0
const SELLER = { role: 'member', memberId: 'MB3', type: '사업자', tier: 'seller', code: 'A1N7742' }

;(async () => {
  const browser = await pw.chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  let fail = 0
  const check = (ok, label) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`) }
  const wait = (ms) => page.waitForTimeout(ms)
  const go = async (path) => { await page.goto(BASE + path, { waitUntil: 'domcontentloaded' }); await page.waitForSelector('main, header', { timeout: 6000 }).catch(() => {}); await wait(450) }
  const session = (s) => page.evaluate((v) => { try { v ? localStorage.setItem('moduon_session_v1', JSON.stringify(v)) : localStorage.removeItem('moduon_session_v1') } catch {} }, s)
  const txt = (t) => page.locator(`[data-t="${t}"]`).first().innerText().catch(() => '')
  const count = (sel) => page.locator(sel).count()
  const upload = async (file) => {
    await page.locator('[data-t="rebate-file"]').setInputFiles(typeof file === 'string' ? FIX(file) : file)
    await page.waitForSelector('[data-t="rebate-preview"], [data-t="rebate-error"]', { timeout: 8000 }).catch(() => {})
    await wait(300)
  }
  const diffKeys = () => page.locator('[data-t="rebate-diff-row"]').evaluateAll((rs) => rs.map((r) => `${r.dataset.key}:${r.querySelectorAll('td')[4]?.textContent.replace(/[^0-9]/g, '')}`))
  const rbRebate = async (model) => {
    await session(SELLER); await go(`/phone/shop/${model}`)
    const v = num(await page.locator('[data-t="seller-rb"] [data-t="rb-rebate"] dd').innerText().catch(() => ''))
    const why = await page.locator('[data-t="seller-rb"] [data-t="rb-panel"] p').last().innerText().catch(() => '')
    return { v, why }
  }
  const admin = async () => { await session({ role: 'admin' }); await go('/admin/policies') }

  await go('/login')
  await page.evaluate(() => { try { localStorage.clear() } catch {} })

  // ───────── ① 기본값 ─────────
  console.log('\n── ① 기본값 = KT K1 원본 시트 ──')
  await admin()
  check((await txt('rate-card-source')).includes('기본값'), `지금 쓰는 표 = 기본값 (${await txt('rate-card-source')})`)
  check((await count('[data-t="rate-card-table"] [data-t="rate-card-row"]')) === 14, `원본 14행 그대로 (${await count('[data-t="rate-card-table"] [data-t="rate-card-row"]')})`)
  const map = await page.locator('[data-t="rate-map-item"]').allInnerTexts()
  check(map.some((x) => x.includes('아이폰 17 프로') && x.includes('아이폰17류(전체)')) && map.some((x) => x.startsWith('A56') && x.includes('그외 5G')), '매핑 — 아이폰17 → 아이폰17류(전체), A56 → 그외 5G')

  // ───────── ② 같은 파일 → 변화 없음 ─────────
  console.log('\n── ② 원본과 같은 파일 → 바뀌는 값 없음 ──')
  await upload('kt-k1-rebate-20260918.xlsx')
  check((await page.locator('[data-t="rebate-carrier"]').inputValue()) === 'KT' && (await page.locator('[data-t="rebate-code"]').inputValue()) === 'K1' && (await page.locator('[data-t="rebate-date"]').inputValue()) === '2026-09-18',
    '통신사 KT · 차수 K1 · 적용일 2026-09-18 자동 인식')
  check((await txt('rebate-stats')).includes('14행 × 5구간') && (await txt('rebate-stats')).includes('만원'), `14행 × 5구간 · 만원 (${await txt('rebate-stats')})`)
  const mins = await page.locator('[data-t="rebate-tier-min"]').evaluateAll((xs) => xs.map((x) => Number(x.value)))
  check(JSON.stringify(mins) === JSON.stringify([110000, 90000, 61000, 49000, 37000]), `구간 하한 110K·90K·61K·49K·37K (${mins.join('·')})`)
  check((await count('[data-t="rebate-diff-none"]')) === 1 && (await count('[data-t="rebate-preview-table"] [data-changed="1"]')) === 0, '지금 표와 같음 — 바뀌는 R/B·강조 칸 없음')
  check((await txt('rebate-issues')).includes('인터넷'), '인터넷 결합 구역은 반영하지 않는다고 알림')

  // ───────── ③ 금액 바꾼 파일 → 바뀌는 5건 ─────────
  console.log('\n── ③ 금액을 바꾼 파일 → 바뀌는 R/B 정확히 ──')
  await upload('kt-k2-rebate-test.xlsx') // 새로 고르면 이전 미리보기는 사라진다
  check((await page.locator('[data-t="rebate-code"]').inputValue()) === 'K2' && (await page.locator('[data-t="rebate-date"]').inputValue()) === '2026-10-01', '차수 K2 · 적용일 2026-10-01')
  const keys = (await diffKeys()).sort()
  const want = ['flip8|choice110|mnp:520000', 'fold8|choice110|mnp:500000', 'ip17|choice110|mnp:280000', 'ip17p|choice110|mnp:280000', 'ip17pm|choice110|mnp:280000'].sort()
  check(JSON.stringify(keys) === JSON.stringify(want), `바뀌는 R/B 5건 — 플립8 52만 · 폴드8 50만 · 아이폰17 3종 28만 (${keys.join(' ')})`)
  check((await count('[data-t="rebate-preview-table"] [data-changed="1"]')) === 3, `시트에서 바뀐 칸 3곳 강조 (${await count('[data-t="rebate-preview-table"] [data-changed="1"]')})`)

  // ───────── ④ 반영 → 설계 화면 ─────────
  console.log('\n── ④ 반영 → 판매자 설계 화면 R/B ──')
  await page.locator('[data-t="rebate-apply"]').click(); await wait(400)
  check((await txt('rate-card-source')).includes('kt-k2-rebate-test.xlsx') && (await txt('rebate-history')).includes('사용 중'), '지금 쓰는 표 = 업로드한 K2 · 이력 사용 중')
  let rb = await rbRebate('flip8')
  check(rb.v === 520000 && rb.why.includes('K2'), `플립8 R/B 단가 520,000 · 근거 K2 (${rb.v.toLocaleString()} · ${rb.why.slice(0, 40)})`)
  rb = await rbRebate('ip17p')
  check(rb.v === 280000 && rb.why.includes('아이폰17류(전체)'), `아이폰17 프로 R/B 280,000 · 행 아이폰17류(전체) (${rb.v.toLocaleString()})`)

  // ───────── ⑤ 매핑 고치기 + 기억 ─────────
  console.log('\n── ⑤ 매핑 고치기 · 기억 ──')
  await admin(); await upload('kt-k2-rebate-test.xlsx')
  await page.locator('[data-t="rebate-map-row"][data-label="갤럭시 S26류"] [data-t="rebate-map-chip"][data-id="s26u"]').click(); await wait(250)
  const s26 = (await diffKeys()).filter((k) => k.startsWith('s26u|choice110|mnp'))
  check(s26.length === 1 && s26[0].endsWith(':450000'), `S26 울트라를 S26류에서 빼면 그외 5G(45만)로 — 미리 보여 줌 (${s26.join(' ')})`)
  await page.locator('[data-t="rebate-apply"]').click(); await wait(400)
  rb = await rbRebate('s26u')
  check(rb.v === 450000 && rb.why.includes('그외 5G'), `반영 후 S26 울트라 R/B 450,000 · 그외 5G (${rb.v.toLocaleString()})`)
  await admin(); await upload('kt-k2-rebate-test.xlsx')
  const chips = await page.locator('[data-t="rebate-map-row"][data-label="갤럭시 S26류"] [data-t="rebate-map-chip"]').evaluateAll((xs) => xs.map((x) => x.dataset.id))
  check(!chips.includes('s26u') && chips.includes('s26'), `다음 업로드에 고친 매핑을 기억 (S26류 = ${chips.join(',')})`)

  // ───────── ⑥ 미래 적용일 = 예약 ─────────
  console.log('\n── ⑥ 적용일이 미래면 예약 ──')
  await page.locator('[data-t="rebate-date"]').fill('2099-01-01'); await wait(150)
  await page.locator('[data-t="rebate-apply"]').click(); await wait(400)
  check((await txt('rate-card-pending')).includes('2099-01-01') && (await txt('rate-card-source')).includes('kt-k2'), `예약 표시 · 지금 표는 그대로 (${(await txt('rate-card-pending')).slice(0, 40)})`)

  // ───────── ⑦ 지우기 · 잘못된 파일 ─────────
  console.log('\n── ⑦ 지우기 → 기본값 · 잘못된 파일 ──')
  while ((await count('[data-t="rebate-remove"]')) > 0) { await page.locator('[data-t="rebate-remove"]').first().click(); await wait(200) }
  check((await txt('rate-card-source')).includes('기본값'), '업로드 표를 모두 지우면 기본값으로')
  rb = await rbRebate('flip8')
  check(rb.v === 470000 && rb.why.includes('K1'), `플립8 R/B 다시 470,000 · K1 (${rb.v.toLocaleString()})`)
  await admin()
  await upload({ name: '단가표.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.from('이건 엑셀이 아니다') })
  check((await txt('rebate-error')).includes('엑셀') && (await count('[data-t="rebate-preview"]')) === 0, `엑셀이 아닌 파일 → 이유 안내 (${await txt('rebate-error')})`)
  await upload({ name: '옛날.xls', mimeType: 'application/vnd.ms-excel', buffer: Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, ...new Array(40).fill(0)]) })
  check((await txt('rebate-error')).includes('.xls'), `예전 .xls → 다른 이름으로 저장 안내 (${await txt('rebate-error')})`)

  check(errors.length === 0, `pageerror 0 (${errors.length}${errors[0] ? ` — ${errors[0].slice(0, 100)}` : ''})`)
  await browser.close()
  console.log(fail === 0 ? '\nSMOKE: ALL PASS' : `\nSMOKE: ${fail} FAIL`)
  process.exit(fail === 0 ? 0 : 1)
})()
