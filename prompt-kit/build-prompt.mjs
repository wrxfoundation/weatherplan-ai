#!/usr/bin/env node
/**
 * 도메인 무관 이미지 프롬프트 생성기.
 *
 * 프롬프트를 사람이 매번 손으로 쓰면 몇십 장째에 화풍이 반드시 흔들린다.
 * 스타일 블록은 direction.json에 고정하고 개체별 서술만 items에서 끌어온다.
 * 이 파일은 도메인을 모른다 — 요괴든 SF든 브랜드 캐릭터든 direction.json만 갈아끼운다.
 *
 *   node build-prompt.mjs direction.json items.json
 *   node build-prompt.mjs direction.json items.json --json      # API 요청 객체로
 *   node build-prompt.mjs direction.json items.json id-1 id-2   # 지정 개체만
 *   node build-prompt.mjs direction.json --scene hero
 *
 * items.json 한 건의 모양:
 *   { "id": "…", "name_en": "…", "hint": "영문 시각 서술", "group": "GROUP_A",
 *     "anchors": ["costume_b"],   // 선택 — 있으면 group_anchors를 이긴다
 *     "shot": "plate" }           // 선택 — plate(기본) | scene
 */
import { readFileSync } from 'node:fs'

/** 배제문이 여러 이웃으로 나뉘어 있어도 순서를 보존해 이어 붙인다. */
const excludes = (dir) =>
  Object.entries(dir.exclude ?? {})
    .filter(([k, v]) => k !== 'note' && v?.prompt)
    .map(([, v]) => v.prompt)

/**
 * 개체 1건 → 영문 프롬프트.
 *
 * 슬롯 순서가 이 함수의 전부다:
 *   주어 → 앵커 → 스타일 → 배제 → 분류 수식 → 구도 → 일반 금지
 * 배제문이 스타일 바로 뒤인 이유는 프롬프트가 잘려도 배제가 먼저 살아남게 하기 위해서다.
 * 뒤로 밀면 긴 프롬프트에서 제일 먼저 죽는다.
 */
export function promptFor(item, dir) {
  // hint(영문 시각 서술)가 없으면 만들지 않는다. 엉뚱한 도상을 만드는 것보다 없는 편이 낫다.
  if (!item.hint) return null

  const subject = [item.name_en, item.hint].filter(Boolean).join(' — ')

  // 분류 기본 앵커는 뭉툭하다. 개체가 직접 선언했으면 그쪽이 이긴다.
  // (여성 캐릭터에 남성 복식 앵커가 붙거나, 사람이 없는 컷에 사람이 끼어드는 사고가 여기서 난다.)
  const keys = item.anchors ?? dir.group_anchors?.[item.group] ?? []
  const anchors = keys.map((k) => dir.anchors?.[k]).filter(Boolean).join('. ')

  return [
    `${dir.domain} — ${subject}`,
    anchors,
    dir.style,
    ...excludes(dir),
    dir.group_modifiers?.[item.group] ?? '',
    dir.composition?.[item.shot ?? 'plate'] ?? dir.composition?.plate ?? '',
    dir.constraints_general,
  ]
    .filter(Boolean)
    .join('. ')
}

/** 인물이 아닌 풍경 컷. 장면 텍스트는 direction.json에 있어야 재현된다. */
export function scenePrompt(id, dir) {
  const s = dir.scenes?.[id]
  if (!s?.text) throw new Error(`direction.json scenes에 없는 장면: ${id}`)
  const anchors = (s.anchors ?? ['landscape', 'architecture'])
    .map((k) => dir.anchors?.[k])
    .filter(Boolean)
  return {
    ...s,
    prompt: [
      `${dir.domain} — ${s.text}`,
      ...anchors,
      dir.style,
      ...excludes(dir),
      dir.composition?.scene ?? '',
      dir.constraints_general,
    ]
      .filter(Boolean)
      .join('. '),
  }
}

/** 프롬프트 + 모델 파라미터. 색은 문장이 아니라 여기로 넘어간다. */
export function requestFor(item, dir, aspect = '4:5') {
  const prompt = promptFor(item, dir)
  if (!prompt) return null
  return {
    model: dir.model?.id,
    prompt,
    aspect_ratio: aspect,
    resolution: dir.model?.resolution,
    model_type: dir.model?.model_type,
    colors: dir.palette,
    background_color: dir.background_color,
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  const files = args.filter((a) => !a.startsWith('--'))
  const dir = JSON.parse(readFileSync(files[0], 'utf8'))
  const json = args.includes('--json')

  if (args.includes('--scene')) {
    const id = args[args.indexOf('--scene') + 1]
    const s = scenePrompt(id, dir)
    const req = {
      model: dir.model?.id,
      prompt: s.prompt,
      aspect_ratio: s.aspect ?? '16:9',
      resolution: dir.model?.resolution,
      model_type: dir.model?.model_type,
      colors: dir.palette,
      background_color: dir.background_color,
    }
    console.log(json ? JSON.stringify(req, null, 2) : s.prompt)
    process.exit(0)
  }

  const all = JSON.parse(readFileSync(files[1], 'utf8'))
  const items = Array.isArray(all) ? all : all.items
  const ids = files.slice(2)
  const list = ids.length ? items.filter((i) => ids.includes(i.id)) : items

  const ready = list.filter((i) => i.hint)
  const missing = list.length - ready.length

  if (json) {
    console.log(JSON.stringify(ready.map((i) => ({ id: i.id, ...requestFor(i, dir) })), null, 2))
  } else {
    for (const i of ready) console.log(`${i.id}\t${promptFor(i, dir)}`)
  }
  if (missing) console.error(`\n⚠️  hint 없는 ${missing}건은 제외했습니다 — 영문 시각 서술을 먼저 써야 합니다.`)
}
