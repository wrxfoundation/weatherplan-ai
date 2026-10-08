#!/usr/bin/env node
// 채널별 초대 링크 생성 — 채널 개설 직후 "가장 먼저" 실행해야 하는 스크립트.
//
// 왜 급한가: 텔레그램은 어느 경로로 들어왔는지를 초대 링크로만 구분할 수 있다.
// 링크를 미리 나눠 두지 않으면 이미 들어온 사람의 유입원은 사후에 복원할 방법이 없다.
//
//   node server/bootstrap-invites.mjs           # 없는 링크만 생성 (이어서 실행해도 안전)
//   node server/bootstrap-invites.mjs --print   # 생성된 링크 목록만 출력
//
// 결과: server/data/invites.json  (이 파일이 유입원 집계의 기준표가 된다)

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { tg, requireEnv, nowIso } from './lib/tg.mjs'

// 링크 세트 — 콘솔의 「텔레그램 유입원」 항목과 1:1로 대응한다.
// name은 텔레그램에 저장되는 라벨(32자 제한), label은 콘솔 표기명.
const LINKS = [
  { key: 'x_profile',     name: 'X profile',        label: 'X 프로필 링크' },
  { key: 'x_pinned',      name: 'X pinned post',    label: 'X 고정 게시물' },
  { key: 'landing',       name: 'Landing page',     label: '판매·랜딩 페이지' },
  { key: 'linktree',      name: 'Linktree',         label: '링크트리' },
  { key: 'weather_app',   name: 'Weather app',      label: '날씨앱 알림·홈페이지' },
  { key: 'box_qr',        name: 'Box QR',           label: '박스 QR (배송 후)' },
  { key: 'press',         name: 'Press',            label: '언론 보도' },
  { key: 'partner_dcent', name: 'Partner DCENT',    label: '파트너 · 디센트' },
  { key: 'partner_tl',    name: 'Partner TL',       label: '파트너 · 타임레버리지' },
  { key: 'partner_xrp',   name: 'Partner XRP comm', label: '파트너 · XRP 커뮤니티' },
  { key: 'partner_rpl',   name: 'Partner Ripple',   label: '파트너 · 리플랩스' },
  { key: 'offline',       name: 'Offline event',    label: '오프라인 행사 (10/3)' },
]

const FILE = new URL('./data/invites.json', import.meta.url).pathname

function load() {
  if (!existsSync(FILE)) return { createdAt: nowIso(), chats: {} }
  return JSON.parse(readFileSync(FILE, 'utf8'))
}
function save(db) {
  mkdirSync(new URL('./data/', import.meta.url).pathname, { recursive: true })
  writeFileSync(FILE, JSON.stringify(db, null, 2))
}

async function ensureFor(chatId, chatKey, db) {
  db.chats[chatKey] ??= { chatId, links: {} }
  const bucket = db.chats[chatKey]
  bucket.chatId = chatId

  const chat = await tg('getChat', { chat_id: chatId })
  console.log(`\n■ ${chatKey}: ${chat.title ?? chatId} (${chat.type})`)

  for (const l of LINKS) {
    if (bucket.links[l.key]?.url) {
      console.log(`  · ${l.label.padEnd(22)} 이미 있음`)
      continue
    }
    try {
      // creates_join_request=false → 링크를 누르면 바로 입장(가입 마찰 최소화).
      // 링크마다 name이 달라야 chat_member 이벤트에서 경로가 구분된다.
      const res = await tg('createChatInviteLink', { chat_id: chatId, name: l.name })
      bucket.links[l.key] = { label: l.label, name: l.name, url: res.invite_link, createdAt: nowIso() }
      console.log(`  ✓ ${l.label.padEnd(22)} ${res.invite_link}`)
    } catch (e) {
      console.error(`  ✗ ${l.label.padEnd(22)} ${e.message}`)
      if (/not enough rights|CHAT_ADMIN_REQUIRED/i.test(e.message)) {
        console.error('    → 봇을 해당 채널·그룹의 관리자로 추가하고 "초대 링크 관리" 권한을 켜세요.')
      }
    }
  }
}

const db = load()

if (process.argv.includes('--print')) {
  for (const [chatKey, b] of Object.entries(db.chats)) {
    console.log(`\n■ ${chatKey}`)
    for (const [k, v] of Object.entries(b.links)) console.log(`  ${v.label.padEnd(22)} ${v.url}`)
  }
  process.exit(0)
}

const channel = requireEnv('TELEGRAM_CHANNEL_ID')
await ensureFor(channel, 'channel', db)

const group = process.env.TELEGRAM_GROUP_ID
if (group) await ensureFor(group, 'group', db)
else console.log('\n(대화방 TELEGRAM_GROUP_ID 미설정 — 공지 채널만 처리했습니다)')

save(db)
console.log(`\n저장: server/data/invites.json`)
console.log('이제 각 링크를 해당 위치에만 사용하세요 — 섞어 쓰면 유입원 집계가 무의미해집니다.')
