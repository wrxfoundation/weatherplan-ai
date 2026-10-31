/* WELLBIAN 2차 대기 페이지 — 데모 빌드 v0.1 (실데이터 미연동) */
"use strict";
const CONF = {
  demo: true,
  waiters: 3847,                          // ← 서버 연동 지점
  deadline: "2026-09-30T15:00:00Z",       // 9/30 24:00 KST
};
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const fmt = n => n.toLocaleString("ko-KR");

/* 등록자 카운트업 */
function countUp(el, to, ms = 1100) {
  const t0 = performance.now();
  const tick = t => {
    const p = Math.min(1, (t - t0) / ms);
    el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 3))));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
$$(".js-waiters").forEach(el => countUp(el, CONF.waiters));

/* 마감 카운트다운 */
function dday() {
  const ms = new Date(CONF.deadline) - Date.now();
  if (ms <= 0) { $("#dday").textContent = "마감"; return; }
  const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4);
  $("#dday").textContent = `D-${d} ${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}
dday(); setInterval(dday, 30000);

/* 스크롤 리빌 (안전망 포함) */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}), { threshold: 0.12 });
$$(".rv").forEach(el => io.observe(el));
setTimeout(() => $$(".rv:not(.in)").forEach(el => el.classList.add("in")), 2600);

/* 등록 (데모) */
let tickets = 10, rank = 100;
$("#joinBtn").addEventListener("click", () => {
  if (!$("#jMail").value.includes("@")) { alert("이메일을 입력해 주세요."); return; }
  $("#joinCard").hidden = true;
  const my = $("#myCard");
  my.hidden = false; my.classList.add("in");
  paint();
});
function paint() {
  $("#myTickets").textContent = tickets;
  $("#myRank").textContent = rank;
}

/* 미션 자진 체크 (데모) */
$$("#mlist input[type=checkbox]").forEach(c => c.addEventListener("change", () => {
  const t = +c.dataset.t || 0, r = +c.dataset.r || 0;
  tickets += c.checked ? t : -t;
  rank += c.checked ? r : -r;
  paint();
  if ($("#myCard").hidden) {           // 미등록 상태에서 체크 시 등록 유도
    c.checked = false; tickets = 10; rank = 100;
    alert("먼저 대기 등록을 완료해 주세요.");
    location.hash = "#join";
  }
}));

/* 초대 코드 복사 (데모) */
$("#copyBtn").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText("https://buy.wellbianlabs.io/wave2?c=WB-7K4M"); } catch (e) {}
  $("#copyBtn").textContent = "복사됨";
  setTimeout(() => $("#copyBtn").textContent = "복사", 1500);
});
