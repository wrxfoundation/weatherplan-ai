/*
 * wellbian — 예약 유입 출처 기록 (KOL 정산 근거)
 *
 * 왜 필요한가
 *   KOL 쿠폰코드가 없으므로, "이 채널에서 몇 명이 예약했는가"를 증명할 수단이 이것뿐이다.
 *   GA4 는 세션만 보여주므로 정산 문서로 쓸 수 없다. 예약 레코드 자체에 붙어야 한다.
 *
 * 왜 지금인가
 *   이미 들어온 예약이 어디서 왔는지는 나중에 채울 방법이 없다. 소급 불가.
 *
 * 무엇을 하는가
 *   1) 첫 방문 시 URL 의 utm_* 파라미터를 localStorage 에 1회 저장한다.
 *   2) 이미 저장돼 있으면 덮어쓰지 않는다 — first-touch 유지.
 *      KOL 정산은 "누가 데려왔는가"이므로 마지막 방문이 아니라 최초 유입이 기준이다.
 *      (덮어쓰면 사용자가 나중에 검색으로 재방문했을 때 KOL 이 실적을 잃는다.)
 *   3) 예약 제출 시 payload 에 실어 서버로 보낸다.
 *
 * 서버가 할 일
 *   예약 테이블에 컬럼 6개 추가 (전부 nullable, 문자열):
 *     utm_source · utm_medium · utm_campaign · utm_content · referrer · landing_path
 *   UTM 없는 직접 유입은 null 로 둔다 ('direct' 같은 값을 서버가 만들어 넣지 않는다 —
 *   나중에 "정말 직접 유입"과 "기록 실패"를 구분할 수 없게 된다.)
 *
 *   9/15 결제 시에는 예약 레코드의 값을 구매 레코드로 그대로 승계한다.
 *   결제 시점에 다시 읽으면 안 된다 — 그때는 이미 재방문이라 출처가 바뀌어 있다.
 *
 * 개인정보
 *   utm_* 는 채널명이라 개인정보가 아니다. 별도 동의 절차가 필요하지 않다.
 */

(function () {
  var KEY = 'wb_attr';

  try {
    if (localStorage.getItem(KEY)) return; // first-touch 유지 — 덮어쓰지 않는다

    var params = new URLSearchParams(window.location.search);
    var attr = {};

    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
      .forEach(function (k) {
        var v = params.get(k);
        if (v) attr[k] = v.slice(0, 100); // 과도한 길이 차단
      });

    attr.referrer = document.referrer || null;
    attr.landing_path = window.location.pathname;
    attr.first_seen_at = new Date().toISOString();

    localStorage.setItem(KEY, JSON.stringify(attr));
  } catch (e) {
    // 시크릿 모드 · 저장소 차단 환경에서는 조용히 넘어간다.
    // 출처 기록 실패가 예약 자체를 막아서는 안 된다.
  }
})();

/*
 * 예약 제출 시 — 위에서 저장한 값을 payload 에 실어 보낸다.
 *
 *   var attr = {};
 *   try { attr = JSON.parse(localStorage.getItem('wb_attr') || '{}'); } catch (e) {}
 *
 *   fetch('/api/reservation', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(Object.assign({}, formData, { attribution: attr }))
 *   });
 */
