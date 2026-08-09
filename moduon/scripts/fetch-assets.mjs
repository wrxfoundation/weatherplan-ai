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
  // 오브제 4종 — 배경 제거(투명 webp) 버전. 카드 그라데이션 위에 오브젝트만 얹힌다.
  ['obj-truck.webp', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/90e21cc7-d3e9-4686-9b9d-5b0562ded06a.webp'],
  ['obj-wifi.webp', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/33a9a1ff-4f6d-42b1-a55c-a48e0be83a31.webp'],
  ['obj-purifier.webp', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/8ec01fae-7f2e-4433-86d3-35ae49c4f5a2.webp'],
  ['cta-chat.webp', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/790310b0-d472-469b-b6d5-38eedd45e68e.webp'],
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
