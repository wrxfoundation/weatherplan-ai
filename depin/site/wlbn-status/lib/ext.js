'use strict';
// wellbian.io 와 DexScreener 가 공개한 값. 못 받으면 null — 그때는 마지막으로 받은 값을 쓴다.
const PAIR = '574C424E00000000000000000000000000000000.rDJz8WJhsKgydqJzSZXMpsJot3eRmSkR5_XRP';
const URLS = {
  explorer: 'https://wellbian.io/api/explorer', network: 'https://wellbian.io/api/network', supply: 'https://wellbian.io/api/supply',
  fees: 'https://wellbian.io/api/amm/fees', dex: 'https://api.dexscreener.com/latest/dex/pairs/xrpl/' + PAIR,
};
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
module.exports = { fetchExt };
