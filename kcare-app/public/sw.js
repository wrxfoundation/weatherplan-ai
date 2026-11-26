// K-CARE 서비스 워커 — 하는 일은 하나뿐이다: 인터넷이 끊겼을 때 화면 이동을 '연결 안내'(/offline.html)로 답한다.
// (2026-11-26 구글 플레이 준비) 구글 플레이 앱(TWA)은 오프라인에서 화면을 열지 못하면 앱이 꺼진다 — 크롬의 TWA 품질 기준.
// 아무것도 캐시하지 않는다 — 화면 · API · 그림은 늘 서버에서 받는다. 받아 두는 것은 연결 안내 한 장뿐이다.
// 그래서 예전 화면이 남아 보이는 일이 없다. 이 파일을 고치면 CACHE 이름의 숫자를 올린다.
const CACHE = "kcare-offline-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // cache: "reload" — 브라우저 캐시에 남은 옛 안내가 아니라 서버의 지금 파일을 받는다
      await cache.add(new Request(OFFLINE_URL, { cache: "reload" }));
    })()
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("kcare-offline-") && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  // 화면 이동만 본다 — API · 그림 · 스크립트 요청은 건드리지 않는다 (respondWith 를 부르지 않으면 평소대로 간다)
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    (async () => {
      let res;
      try {
        res = await fetch(event.request);
      } catch (_) {
        const cache = await caches.open(CACHE);
        return (await cache.match(OFFLINE_URL)) || Response.error();
      }
      // 없는 주소(404) · 서버 오류(5xx) — 구글 플레이 앱(TWA)은 화면 응답이 404 · 5xx 면 앱을 꺼 버린다.
      // 우리 안내 화면(pages/404.jsx · 500.jsx)은 그대로 보여 주되 상태만 200 으로 바꿔 건넨다. 본문 · 헤더는 손대지 않는다.
      // (다른 주소로 옮기는 응답은 상태가 0 이라 여기 걸리지 않는다)
      if (res.status === 404 || res.status >= 500) {
        return new Response(res.body, { status: 200, statusText: "OK", headers: res.headers });
      }
      return res;
    })()
  );
});
