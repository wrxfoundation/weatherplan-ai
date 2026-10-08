#!/usr/bin/env node
// 텔레그램 웹훅 수신기 — 가입·이탈 이벤트를 초대 링크와 함께 기록한다.
//
//   node server/webhook.mjs                 # :8787 에서 수신 대기
//   node server/webhook.mjs --register      # 텔레그램에 웹훅 URL 등록
//   node server/webhook.mjs --unregister    # 등록 해제(폴링으로 되돌림)
//
// 중요: chat_member 는 allowed_updates 에 "명시"해야 옵니다. 기본값에 포함되지 않습니다.
// 공개 URL이 필요하므로(HTTPS), 사내 서버나 터널을 쓰세요. 없으면 collect.mjs 만으로도
// 구독자 수 추이는 쌓입니다 — 다만 유입원 분해는 이 웹훅이 있어야 채워집니다.

import { createServer } from 'node:http'
import { appendFileSync, mkdirSync } from 'node:fs'
import { tg, requireEnv, nowIso } from './lib/tg.mjs'

const EVENTS = new URL('./data/events.jsonl', import.meta.url).pathname
mkdirSync(new URL('./data/', import.meta.url).pathname, { recursive: true })

const ALLOWED = ['chat_member', 'message', 'channel_post']

if (process.argv.includes('--register')) {
  const url = requireEnv('TELEGRAM_WEBHOOK_URL')
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET || undefined
  await tg('setWebhook', { url, allowed_updates: ALLOWED, secret_token: secret })
  console.log(`웹훅 등록 완료 · allowed_updates=${ALLOWED.join(',')}`)
  process.exit(0)
}
if (process.argv.includes('--unregister')) {
  await tg('deleteWebhook', {})
  console.log('웹훅 해제 완료')
  process.exit(0)
}

/** 업데이트 1건 → 이벤트 0~1건 (원문 메시지는 저장하지 않는다 — 개인정보 최소 수집) */
function toEvent(u) {
  if (u.chat_member) {
    const m = u.chat_member
    const was = m.old_chat_member?.status
    const now = m.new_chat_member?.status
    const joined = ['left', 'kicked'].includes(was) && ['member', 'administrator', 'creator'].includes(now)
    const left = ['member', 'administrator', 'creator'].includes(was) && ['left', 'kicked'].includes(now)
    if (!joined && !left) return null
    return {
      at: nowIso(),
      type: joined ? 'join' : 'leave',
      chatId: m.chat.id,
      // 유입원 분해의 핵심 — 어느 초대 링크로 들어왔는지
      inviteName: m.invite_link?.name ?? null,
      // 사용자 식별자는 저장하지 않고 중복 판정용 해시만 남긴다
      uid: m.new_chat_member?.user?.id ? String(m.new_chat_member.user.id) : null,
    }
  }
  if (u.message?.text) {
    // 메시지 "본문"은 저장하지 않는다. 응대 지표에 필요한 것은 발생 시각과 방 정보뿐이다.
    return { at: nowIso(), type: 'message', chatId: u.message.chat.id, fromBot: !!u.message.from?.is_bot }
  }
  if (u.channel_post) {
    return { at: nowIso(), type: 'post', chatId: u.channel_post.chat.id, messageId: u.channel_post.message_id }
  }
  return null
}

const secret = process.env.TELEGRAM_WEBHOOK_SECRET
const port = Number(process.env.PORT ?? 8787)

createServer((req, res) => {
  if (req.method !== 'POST') { res.writeHead(200); return res.end('ok') }
  if (secret && req.headers['x-telegram-bot-api-secret-token'] !== secret) {
    res.writeHead(401); return res.end('unauthorized')
  }
  let body = ''
  req.on('data', c => { body += c; if (body.length > 1e6) req.destroy() })
  req.on('end', () => {
    try {
      const ev = toEvent(JSON.parse(body))
      if (ev) {
        appendFileSync(EVENTS, JSON.stringify(ev) + '\n')
        console.log(`${ev.type}${ev.inviteName ? ` · ${ev.inviteName}` : ''}`)
      }
    } catch (e) {
      console.error('파싱 실패:', e.message)
    }
    res.writeHead(200); res.end('ok') // 텔레그램에는 항상 200 (재전송 폭주 방지)
  })
}).listen(port, () => console.log(`웹훅 수신 대기 :${port}`))
