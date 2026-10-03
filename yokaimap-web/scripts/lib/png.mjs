/**
 * 최소 PNG 크롭 유틸 (의존성 0, node:zlib만 사용).
 *
 * 왜 필요한가: 헤드리스 크로미움은 `--window-size=W,H`를 줘도 레이아웃 뷰포트가 H보다
 * 87px가량 작다(창 크롬 높이가 빠진다). 반면 `--screenshot` 결과 PNG는 창 크기 그대로 나온다.
 * 그래서 "뷰포트를 원하는 크기로 맞추고(창을 크게) → 나온 PNG의 윗부분만 잘라내는" 방식이 필요하다.
 *
 * 지원: 8비트, 인터레이스 없음, 컬러타입 0/2/4/6 (크로미움 스크린샷은 6=RGBA).
 */
import { inflateSync, deflateSync } from 'node:zlib'

const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }

const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  out.write(type, 4, 'ascii')
  data.copy(out, 8)
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length)
  return out
}

const paeth = (a, b, c) => {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}

/** PNG 버퍼의 위쪽 keepHeight 행만 남긴 새 PNG 버퍼를 돌려준다. */
export function cropPngTop(buf, keepHeight) {
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error('PNG 시그니처 아님')

  let pos = 8
  let ihdr = null
  const idat = []
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('ascii', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') ihdr = data
    else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    pos += 12 + len
  }
  if (!ihdr) throw new Error('IHDR 없음')

  const width = ihdr.readUInt32BE(0)
  const height = ihdr.readUInt32BE(4)
  const bitDepth = ihdr[8]
  const colorType = ihdr[9]
  const interlace = ihdr[12]
  if (bitDepth !== 8 || interlace !== 0 || !CHANNELS[colorType] || colorType === 3) {
    throw new Error(`지원하지 않는 PNG 형식 (bitDepth=${bitDepth}, colorType=${colorType}, interlace=${interlace})`)
  }
  if (keepHeight >= height) return buf

  const bpp = CHANNELS[colorType]
  const stride = width * bpp
  const raw = inflateSync(Buffer.concat(idat))

  // 필터 해제 — keepHeight 행까지만 복원하면 되지만, 필터가 위 행을 참조하므로 순차 처리한다
  const out = Buffer.alloc(stride * keepHeight)
  let prev = Buffer.alloc(stride)
  for (let y = 0; y < keepHeight; y++) {
    const filter = raw[y * (stride + 1)]
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
    const cur = Buffer.alloc(stride)
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0
      const b = prev[i]
      const c = i >= bpp ? prev[i - bpp] : 0
      const x = line[i]
      cur[i] =
        filter === 0 ? x
        : filter === 1 ? (x + a) & 0xff
        : filter === 2 ? (x + b) & 0xff
        : filter === 3 ? (x + ((a + b) >> 1)) & 0xff
        : (x + paeth(a, b, c)) & 0xff
    }
    cur.copy(out, y * stride)
    prev = cur
  }

  // 재인코딩 — 필터 0(None)으로 단순하게. 용량은 deflate가 알아서 줄인다.
  const filtered = Buffer.alloc((stride + 1) * keepHeight)
  for (let y = 0; y < keepHeight; y++) {
    filtered[y * (stride + 1)] = 0
    out.copy(filtered, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }

  const newIhdr = Buffer.from(ihdr)
  newIhdr.writeUInt32BE(keepHeight, 4)

  return Buffer.concat([
    SIG,
    chunk('IHDR', newIhdr),
    chunk('IDAT', deflateSync(filtered, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}
