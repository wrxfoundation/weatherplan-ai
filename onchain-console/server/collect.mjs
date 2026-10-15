#!/usr/bin/env node
// 텔레그램 지표 수집 — 5분~1시간 주기로 돌리면 된다(cron 권장: 매시 정각).
//
//   node server/collect.mjs
//
// 하는 일
//   1) 채널·대화방 구독자 수 스냅샷 (getChatMemberCount)
//   2) 일별 롤업 저장 — server/data/daily/YYYY-MM-DD.json (하루 최종값만 남김)
//   3) 웹훅이 쌓아 둔 가입 이벤트(events.jsonl)를 초대 링크별로 집계
//   4) 프론트가 읽을 public/live/community.json 생성
//
// 이 스크립트는 읽기만 한다. 채널에 아무것도 쓰지 않는다.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { tg, today, nowIso } from './lib/tg.mjs'

const dir = (p) => new URL(p, import.meta.url).pathname
const DAILY = dir('./data/daily/')
const OUT = dir('../public/live/community.json')
const EVENTS = dir('./data/events.jsonl')
const INVITES = dir('./data/invites.json')

mkdirSync(DAILY, { recursive: true })
mkdirSync(dir('../public/live/'), { recursive: true })

async function snapshot(chatId, key) {
  if (!chatId) return null
  try {
    const [chat, count] = await Promise.all([
      tg('getChat', { chat_id: chatId }),
      tg('getChatMemberCount', { chat_id: chatId }),
    ])
    console.log(`· ${key}: ${chat.title} — ${count}명`)
    return { key, title: chat.title, username: chat.username ?? null, members: count }
  } catch (e) {
    console.error(`✗ ${key}: ${e.message}`)
    return null
  }
}

// ── 1~2) 스냅샷 + 일별 롤업 ─────────────────────────────────────
const channel = await snapshot(process.env.TELEGRAM_CHANNEL_ID, 'channel')
const group = await snapshot(process.env.TELEGRAM_GROUP_ID, 'group')

const day = today()
const dayFile = `${DAILY}${day}.json`
// 같은 날 여러 번 돌면 마지막 값으로 덮어쓴다(구독자 수는 스냅샷 성격).
writeFileSync(dayFile, JSON.stringify({ date: day, at: nowIso(), channel, group }, null, 2))

// ── 3) 초대 링크별 가입 집계 (웹훅이 있을 때만 채워진다) ─────────
const sources = {}
if (existsSync(EVENTS)) {
  for (const line of readFileSync(EVENTS, 'utf8').split('\n')) {
    if (!line.trim()) continue
    try {
      const e = JSON.parse(line)
      if (e.type !== 'join') continue
      const k = e.inviteName ?? '(직접·검색)'
      sources[k] = (sources[k] ?? 0) + 1
    } catch { /* 깨진 줄은 건너뛴다 */ }
  }
}

// 초대 링크 라벨 매핑 (name → 한글 라벨)
let labelOf = {}
if (existsSync(INVITES)) {
  const db = JSON.parse(readFileSync(INVITES, 'utf8'))
  for (const b of Object.values(db.chats ?? {})) {
    for (const v of Object.values(b.links ?? {})) labelOf[v.name] = v.label
  }
}

// ── 4) 프론트가 읽을 파일 생성 ──────────────────────────────────
const days = readdirSync(DAILY).filter(f => f.endsWith('.json')).sort()
const series = days.map(f => {
  const d = JSON.parse(readFileSync(DAILY + f, 'utf8'))
  return { date: d.date, channel: d.channel?.members ?? null, group: d.group?.members ?? null }
})

const out = {
  generatedAt: nowIso(),
  telegram: {
    channel: channel && { title: channel.title, username: channel.username, members: channel.members },
    group: group && { title: group.title, username: group.username, members: group.members },
    series,
    sources: Object.entries(sources)
      .map(([name, count]) => ({ name, label: labelOf[name] ?? name, count }))
      .sort((a, b) => b.count - a.count),
    sourcesAvailable: existsSync(EVENTS), // 웹훅 미가동이면 유입원 분해는 비어 있다 — 화면에서 정직하게 표기
  },
  x: process.env.X_FOLLOWERS_MANUAL
    ? { followers: Number(process.env.X_FOLLOWERS_MANUAL), manual: true }
    : { followers: null, manual: true },
}

writeFileSync(OUT, JSON.stringify(out, null, 2))
console.log(`\n저장: public/live/community.json (${series.length}일치)`)
if (!out.telegram.sourcesAvailable) {
  console.log('※ 유입원 분해는 웹훅(server/webhook.mjs)이 돌아야 채워집니다.')
}
