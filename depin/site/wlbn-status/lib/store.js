'use strict';
// 상태를 Vercel Blob 에 남긴다(프로젝트에 Blob 저장소가 연결돼 있을 때만). 없으면 배포에 든 출발 상태에서 매번 이어 받는다.
const PATHNAME = 'wlbn-status/state.json';
const enabled = () => !!process.env.BLOB_READ_WRITE_TOKEN;
let access = null;   // 저장소 종류(private · public)는 처음 성공한 쪽으로 기억한다

async function load() {
  if (!enabled()) return null;
  const { get } = require('@vercel/blob');
  let lastErr = null;
  for (const a of access ? [access] : ['private', 'public']) {
    try {
      const r = await get(PATHNAME, { access: a, useCache: false });
      if (!r) continue;                           // 이 종류로는 없다(아직 저장한 적 없음)
      access = a;
      return JSON.parse(await new Response(r.stream).text());
    } catch (e) { lastErr = e; }
  }
  // 한 번이라도 읽다가 오류가 났으면(찾을 수 없음 말고) 정말 저장한 적이 없는지 목록으로 확인한다.
  //   파일이 있는데 못 읽은 것 · 목록도 못 본 것은 실패로 알린다 — 호출한 쪽이 「저장한 적 없음」으로 알고 좋은 상태를 출발 상태로 덮어쓰지 않게
  if (lastErr && !/not.?found/i.test(String(lastErr.message || lastErr))) {
    let exists = null;
    try { const { list } = require('@vercel/blob'); const r = await list({ prefix: PATHNAME, limit: 1 }); exists = !!(r && r.blobs && r.blobs.length); } catch (e) { exists = null; }
    if (exists !== false) throw lastErr;
  }
  return null;
}
async function save(state) {
  if (!enabled()) return false;
  const { put } = require('@vercel/blob');
  let lastErr = null;
  for (const a of access ? [access] : ['private', 'public']) {
    try {
      await put(PATHNAME, JSON.stringify(state), { access: a, allowOverwrite: true, addRandomSuffix: false, contentType: 'application/json' });
      access = a;
      return true;
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}
module.exports = { enabled, load, save };
