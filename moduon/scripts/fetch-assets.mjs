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
  // 정수기·생활기타 — 톤앤매너 정합 재제작(2026-08-10 2차): 통통한 볼륨·콘플라워 블루(네이비 금지)·우하단 단일 그림자
  // (대안 후보: water 0e2b7b64-31e6-48d6-84ed-ed55e105a632 / etc 082de41a-bf41-45df-8ca6-bcd9bd010684)
  ['cat-water.webp', 'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260810_054701_a566fdec-d119-479f-a618-01e34a9d083c_min.webp'],
  ['cat-rental.webp', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/4ed737e2-e175-412e-bfd9-7214df5b7997.webp'],
  ['cat-insurance.webp', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/d3462d86-2f6d-44c6-b89a-ca5f2f4b8886.webp'],
  ['cat-appliance.webp', 'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260809_132313_dae5b617-7d97-4c2a-8df1-97d86319f00d_min.webp'],
  ['cat-etc.webp', 'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260810_054701_6ffb459d-107a-428b-9ae2-b56d1911b298_min.webp'],
  // 오브제 4종 — 배경 제거(투명 webp) 버전. 카드 그라데이션 위에 오브젝트만 얹힌다.
  ['obj-truck.webp', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/90e21cc7-d3e9-4686-9b9d-5b0562ded06a.webp'],
  ['obj-wifi.webp', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/33a9a1ff-4f6d-42b1-a55c-a48e0be83a31.webp'],
  ['obj-purifier.webp', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/8ec01fae-7f2e-4433-86d3-35ae49c4f5a2.webp'],
  // 핸드폰 오브제 — 홈 혜택 밴드(인터넷·핸드폰·렌탈) 중앙 파란 카드용.
  // 크림 바디 + 코랄 액센트로 파란 배경에서 뜨게 했고, 배경 제거(투명 PNG)까지 마친 산출물.
  // (원본 생성 ab99dcea / 대안 후보 d43d782c — 대안 채택 시 배경 제거를 다시 거쳐야 함)
  ['obj-phone.png', 'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260829_102909_51b963f0-0f3e-4d17-a2ac-716d70557ade.png'],
  // 지원금 밴드 돈주머니 — 다홍색 가죽 + ₩ 음각 + 매듭 풀려 금색 동전 노출, 배경 제거(투명 PNG)
  ['obj-moneybag.png', 'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260809_145422_bf4edf86-9476-4b1c-929c-6d6d04a6dfba.png'],
  // IR 히어로 타워 — "온라인 건물주" 오브제 (크림 배경 일체형, 대안: 08e8aaf0-ed8f-4a2d-ad7c-966311314168)
  ['obj-tower.png', 'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260813_044545_d477c7cd-3093-49e5-ae49-4701e28ef682_min.webp'],
  // 브랜드 로고 마크 — 후보 B(오렌지·블루 듀오톤 루프), 배경 제거(투명 PNG). GNB·푸터·파비콘 공용
  ['logo-mark.png', 'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260809_150901_0e2cd36d-5984-4e56-a494-1b7a8c1590af.png'],
  ['cta-chat.webp', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/790310b0-d472-469b-b6d5-38eedd45e68e.webp'],
  // 히어로 영상(hero-video.mp4)·포스터(hero-scene.jpg)는 레포에 커밋된 자체 호스팅 에셋 — 여기서 받지 않음
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
