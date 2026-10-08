export const fmt = (n: number, digits = 0) =>
  n.toLocaleString('ko-KR', { minimumFractionDigits: digits, maximumFractionDigits: digits })

export const fmtDelta = (n: number, digits = 1, suffix = '%') => {
  const sign = n > 0 ? '+' : n < 0 ? '−' : ''
  return `${sign}${Math.abs(n).toLocaleString('ko-KR', { maximumFractionDigits: digits })}${suffix}`
}

export const shortAddr = (addr: string, head = 4, tail = 5) =>
  addr.length <= head + tail + 1 ? addr : `${addr.slice(0, head)}…${addr.slice(-tail)}`
