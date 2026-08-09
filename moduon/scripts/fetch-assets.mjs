// ─── 브랜드 3D 에셋 자동 다운로드 (Higgsfield 재제작본 · C4D 소프트 스타일) ──
// npm run dev / build 전에 자동 실행(predev/prebuild). 이미 있으면 건너뜀.
// Vercel 빌드에서 public/assets 로 내려받아져 최종 배포물은 자체 호스팅 정적 파일이 된다.
// 프록시 등으로 다운로드가 막힌 환경에서는 경고만 남기고 계속 진행(레이아웃은 정상 동작).
import { mkdirSync, existsSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ASSETS = [
  ['cat-phone.webp', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/11673aeb-580f-4224-b96d-e148856b4374.webp'],
  ['cat-internet.webp', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/fcc6498f-03cb-4a93-98b5-c2d23eff04b9.webp'],
  ['cat-move.webp', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/81150f22-a83b-446e-8174-3e696ec2d452.webp'],
  ['cat-water.webp', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/3f03a64c-d785-4f83-9f19-6989b98f7f2c.webp'],
  ['cat-rental.webp', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/4ed737e2-e175-412e-bfd9-7214df5b7997.webp'],
  ['cat-insurance.webp', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/d3462d86-2f6d-44c6-b89a-ca5f2f4b8886.webp'],
  ['cat-appliance.webp', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/1ecb7cfa-41b4-47ec-aaef-e44f9ba89a4b.webp'],
  ['cat-etc.webp', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/bc8f7a41-bfda-41f6-901d-d96d8665197d.webp'],
  ['tr-thumb.webp', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/c41a78fe-5d0f-42d0-b6d0-b6fb3d9e1618.webp'],
  ['tr-shield.webp', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/17eb7b9e-83ed-4ed7-92b2-d37029ce6923.webp'],
  ['tr-gift.webp', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/8974d640-14ea-443b-8f8d-131b85a8aa13.webp'],
  ['tr-person.webp', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/34ca1b2d-d9ba-4218-8317-f16e036d1449.webp'],
  ['obj-truck.webp', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/c61a62c5-4c8c-432b-97b6-df1234ceda3a.webp'],
  ['obj-wifi.webp', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/cb612cbf-685e-41f3-8db2-a26b4567844b.webp'],
  ['obj-purifier.webp', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/f81876c0-1511-437d-af60-139512e8936d.webp'],
  ['cta-chat.webp', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/c11577c3-5071-4ce6-a2f7-d4d2d0956c02.webp'],
  ['hero-scene.jpg', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/c9df5fd4-df02-49a3-9795-c4346a4fc2ca.jpg'],
]

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const dir = join(root, 'public', 'assets')
mkdirSync(dir, { recursive: true })

let ok = 0, skip = 0, fail = 0
await Promise.all(ASSETS.map(async ([name, url]) => {
  const dest = join(dir, name)
  if (existsSync(dest)) { skip++; return }
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
    ok++
  } catch (e) {
    fail++
    console.warn(`[assets] ${name} 다운로드 실패 (${e.message}) — 배포 환경에서는 자동으로 받아집니다`)
  }
}))
console.log(`[assets] 완료: 신규 ${ok} · 보유 ${skip} · 실패 ${fail} / ${ASSETS.length}`)
