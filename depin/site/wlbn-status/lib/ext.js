'use strict';
// wellbian.io 와 DexScreener 가 공개한 값. 못 받으면 null — 그때는 마지막으로 받은 값을 쓴다.
const PAIR = '574C424E00000000000000000000000000000000.rDJz8WJhsKgydqJzSZXMpsJot3eRmSkR5_XRP';
const URLS = {
  explorer: 'https://wellbian.io/api/explorer', network: 'https://wellbian.io/api/network', supply: 'https://wellbian.io/api/supply',
  fees: 'https://wellbian.io/api/amm/fees', dex: 'https://api.dexscreener.com/latest/dex/pairs/xrpl/' + PAIR,
};
// 시장 비교용: CoinPaprika 공개 값(키 없이 받는다). 순위 · 값 · 시가총액 / 전체 시가총액 / 코인별 일별 기록
const MKT = 'https://api.coinpaprika.com/v1';
URLS.tickers = MKT + '/tickers?limit=40'; URLS.cglobal = MKT + '/global';
// list = [{ id, start }] → { id: [{ timestamp, price, market_cap }] | null }. 한 번에 넷씩만 부른다
async function fetchHistory(list, fetchImpl) {
  const f = fetchImpl || fetch, out = {};
  for (let i = 0; i < list.length; i += 4) {
    await Promise.all(list.slice(i, i + 4).map(async (x) => {
      try {
        const r = await f(MKT + '/tickers/' + encodeURIComponent(x.id) + '/historical?start=' + x.start + '&interval=1d', { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
        out[x.id] = r.ok ? await r.json() : null;
      } catch (_) { out[x.id] = null; }
    }));
  }
  return out;
}
async function fetchExt(fetchImpl) {
  const f = fetchImpl || fetch, out = {};
  await Promise.all(Object.keys(URLS).map(async (k) => {
    try {
      const r = await f(URLS[k], { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(7000) });
      out[k] = r.ok ? await r.json() : null;
    } catch (_) { out[k] = null; }
  }));
  return out;
}
module.exports = { fetchExt, fetchHistory };
