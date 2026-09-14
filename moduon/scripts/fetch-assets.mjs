// ─── 브랜드 3D 에셋 자동 다운로드 (Higgsfield 재제작본 · C4D 소프트 스타일) ──
// npm run dev / build 전에 자동 실행(predev/prebuild). 이미 있으면 건너뜀.
// Vercel 빌드에서 public/assets 로 내려받아져 최종 배포물은 자체 호스팅 정적 파일이 된다.
// 프록시 등으로 다운로드가 막힌 환경에서는 경고만 남기고 계속 진행(레이아웃은 정상 동작).
import { mkdirSync, existsSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ASSETS = [
  // 카테고리 아이콘 8종 — 2026-08-29 한 세트로 동시 재생성(regen v3).
  // 동일 프롬프트 규격: 클레이 3D · 콘플라워 블루+코랄 팔레트 · 좌상단 광원 ·
  // 우하단 단일 접지 그림자 · 오브젝트가 정사각 프레임의 중앙 62%를 차지.
  // 배경 제거(투명 PNG)라 원형 배경색은 CSS(bg-warm) 하나로 통일된다.
  // 개별 재생성은 톤이 어긋나므로 손볼 땐 8개를 다시 한 세트로 뽑을 것.
  ['cat-phone.png', 'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260829_133638_388a19c9-cf44-40b3-8caa-92eeb9cf3f90.png'], // 휴대폰
  ['cat-internet.png', 'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260829_133640_535bd2f7-41ca-49b6-ad42-d6ef3dd3343c.png'], // 인터넷/TV
  ['cat-move.png', 'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260829_133642_8a2bcd3e-7f46-407a-8b3a-817329099477.png'], // 이사
  ['cat-water.png', 'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260829_133645_e03e24cc-2792-48b8-93bb-4a05a03f4b90.png'], // 정수기
  ['cat-rental.png', 'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260829_133647_ea22d7f3-9691-422a-90e6-4634bd3c67ab.png'], // 렌탈
  ['cat-insurance.png', 'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260829_133650_6dc7a5d4-09f7-45a3-b122-abc4db599b57.png'], // 보험
  ['cat-appliance.png', 'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260829_133652_acdb48e6-d3c8-4d9c-be1f-178b293a76ca.png'], // 가전
  ['cat-etc.png', 'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260829_133655_0424735e-a4cf-424d-ad9b-b24da2cbcd20.png'], // 생활/기타
  // 쇼핑몰 — 위 8종과 동일 규격으로 추가 생성(쇼핑백). 대안 후보 08c8fc05(배경 제거 필요)
  ['cat-shop.png', 'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260829_150107_67ec7e2d-c1b3-43e3-a0e7-8c57ffba8bfa.png'], // 쇼핑몰
  // 렌트/리스 — 위와 동일 규격으로 추가 생성(클레이 3D 자동차). 배경 제거 완료.
  // (원본 생성 8259cb30 / 대안 후보 63223e89 — 대안 채택 시 배경 제거를 다시 거쳐야 함)
  ['cat-car.png', 'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260904_055336_e6ea3c0f-4947-421c-b99d-081712ce5ce7.png'], // 렌트/리스
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
  // logo-mark.png 는 더 이상 받지 않는다 — public/assets/brand/logo-moduon-src.png 에서 logo-transparent.mjs 가 잘라낸다
  ['cta-chat.webp', 'https://d2ol7oe51mr4n9.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/790310b0-d472-469b-b6d5-38eedd45e68e.webp'],
  // 히어로 영상(hero-video.mp4)·포스터(hero-scene.jpg)는 레포에 커밋된 자체 호스팅 에셋 — 여기서 받지 않음
  // (아정당식 개편 이후 Home 에서 참조하지 않음 — 현재 미참조(보관), 파일은 유지)

  // ── 아정당식 초기화면 개편(2026-09-09) — GPT Image 2 로 한 세트 생성 ──
  // 롤링 배너 장면 21:9 · 2k. 왼쪽 55% 는 텍스트용 빈 파란 그라디언트라 DOM 글자가 그 위에 얹힌다.
  ['banner-support.png', 'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260909_204855_32697576-178b-4d20-9099-c652d0c586c8.png'], // 지원금 — 돈주머니·코인·선물상자
  ['banner-car.png',     'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260909_204245_90b0cc96-63da-4e4f-a873-e06e4a47151b.png'], // 렌트/리스 — 흰 SUV·키
  ['banner-home.png',    'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260909_204245_b4e33f45-61ba-498b-8346-9f817da7dfde.png'], // 가전렌탈·인터넷 — 정수기·공기청정기·공유기·폰
  // 모비 AI 비서 인물(배경 제거) — 배너 1 과 우측 플로팅 패널이 같이 쓴다
  ['mobi-agent.png',     'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260909_204904_5b38d67a-6f7b-4733-973d-b7b29d7656e0.png'],
  // 1차 동선 아이콘 6종(배경 제거) — 유리질 3D · 콘플라워 블루 + 코랄. 아정당의 파스텔 3D 와 소재·구도가 다른 별도 세트.
  // 개별 재생성은 톤이 어긋나므로 손볼 땐 6개를 한 세트로 다시 뽑을 것.
  ['tile-phone.png',    'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260909_204856_56868b41-b599-496e-ba19-7370fd0b2940.png'], // 휴대폰 — 스마트폰 + 말풍선
  ['tile-rental.png',   'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260909_204857_483da1c4-d4e7-417e-b2a5-e826eea6679c.png'], // 가전렌탈 — 정수기 + 공기청정기
  ['tile-internet.png', 'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260909_204858_d24c929b-65f8-4c72-8351-ae73ddf6f3c2.png'], // 인터넷 — 공유기 + 신호 + TV
  ['tile-car.png',      'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260909_204859_4b9f9a99-5633-4bb5-8888-6df3c6d75349.png'], // 렌트/리스 — 키 + 세단
  ['tile-package.png',  'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260909_204900_cb03ca73-f833-411b-8d04-86dae644756f.png'], // 매장패키지 — 어닝 달린 상점
  ['tile-benefit.png',  'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260909_204903_9c52e903-65c4-412b-b431-96ad0e7a56d0.png'], // 모두온혜택 — 선물상자 + 코인 + % 배지
  // 히어로 롤링 배너 4장 — 2026-09-10 브랜드 톤(콘플라워 블루·크림·코랄, 소프트 3D)으로 한 세트 생성. 21:9 · 2k.
  // 피사체는 한쪽 40% 안에만 두고 반대쪽 60% 는 빈 그라디언트(텍스트는 DOM). 손볼 땐 4장을 한 세트로 다시 뽑을 것.
  ['banner-mobi.png',      'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260910_001039_debdaaa6-5a3b-41e7-87e2-3ee5a3a7b1f7.png'], // 1 모비 — 파랑, 인물+홀로그램 오른쪽
  ['banner-benefit.png',   'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260910_001039_5b400768-9407-4a0f-bb09-a64bbc572064.png'], // 2 혜택 — 크림, 코랄 저금통 오른쪽
  ['banner-subscribe.png', 'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260910_001039_e98dab13-257e-48e6-b131-0d8d791e1c75.png'], // 3 구독경제 — 연파랑, 신문·달력·박스 왼쪽
  ['banner-finder.png',    'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260910_001038_0595ab4b-f01c-45f1-b152-72fa93dbac1a.png'], // 4 혜택 찾기 — 파랑, 과녁·돋보기 왼쪽
  // 목업 랜딩페이지 2·4 오브제(배경 제거) — 저금통(노랑 배너), 과녁(라벤더 배너). 3(뉴스)은 DOM 카드라 이미지 없음
  ['banner-piggy.png',  'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260909_233952_83a97fd6-941a-416d-a171-25ff9b9e9a0e.png'],
  ['banner-target.png', 'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260909_233953_51f9e63c-9be0-40c9-b893-e679713f0a34.png'],
  // 지원금 섹션 일러스트 2종(배경 제거) — 카드② 보라 AI 말풍선, 카드③ 고민하는 여성. 카드① 은 기존 obj-moneybag.png
  ['ill-ai.png',       'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260909_205354_e5a4c6fe-cf4b-4901-901a-b9bd97c2fb56.png'],
  ['ill-thinking.png', 'https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260909_205356_bcb8ab1d-0642-4f5f-a32d-5f659404b524.png'],
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
