/* WELLBIAN 제품구매 랜딩 — 데모 빌드 v0.1
   ⚠ 실데이터·결제 미연동. CONF의 데모 값을 서버 값으로 교체할 것. */
"use strict";

const CONF = {
  demo: true,
  earlyTotal: 900,  earlyLeft: 184,     // ← 서버 연동 지점
  baseTotal: 4000,  baseLeft: 3126,     // ← 서버 연동 지점
  priceEarly: 450,  priceBase: 650,
  maxQtyDemo: 2,
  holdSeconds: 20 * 60,
};

const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const fmt = n => n.toLocaleString("ko-KR");

/* ── 카운터 주입 ── */
const leftTotal = CONF.earlyLeft + CONF.baseLeft;
const sold = (CONF.earlyTotal + CONF.baseTotal) - leftTotal;
const soldRatio = sold / (CONF.earlyTotal + CONF.baseTotal);
const nextNo = 101 + sold; // 다음 배정 넘버 (#0101 시작)

$$(".js-left-early").forEach(el => el.textContent = fmt(CONF.earlyLeft));
$$(".js-left-base").forEach(el => el.textContent = fmt(CONF.baseLeft));
$(".js-next-no").textContent = String(nextNo).padStart(4, "0");

/* 잔여 수 카운트업 */
function countUp(el, to, ms = 1100) {
  const t0 = performance.now();
  const tick = t => {
    const p = Math.min(1, (t - t0) / ms);
    el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 3))));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
$$(".js-left-total").forEach(el => countUp(el, leftTotal));

/* 레일 채움 */
requestAnimationFrame(() => setTimeout(() => {
  const pct = Math.max(3, soldRatio * 100);
  $("#railFill").style.width = pct + "%";
  $("#railNode").style.left = pct + "%";
}, 350));

/* ── 스크롤 리빌 ── */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}), { threshold: 0.12 });
$$(".rv").forEach(el => io.observe(el));
/* 안전망: IO 미발화 요소도 일정 시간 후 표시 */
setTimeout(() => $$(".rv:not(.in)").forEach(el => el.classList.add("in")), 2600);

/* ── 스티키 바 ── */
const sticky = $("#stickybar");
const hero = $(".hero");
new IntersectionObserver(([e]) => {
  sticky.classList.toggle("on", !e.isIntersecting);
  sticky.setAttribute("aria-hidden", e.isIntersecting);
}, { rootMargin: "-64px 0px 0px 0px" }).observe(hero);

/* ══════════ 구매 모달 ══════════ */
const modal = $("#buyModal");
const STEPS = 6;
let step = 1, qty = 1, wallet = null, paid = false, holdTimer = null;

const mprog = $("#mprog");
mprog.innerHTML = Array.from({ length: STEPS }, () => "<i></i>").join("");

function openModal() {
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  go(1);
}
function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = "";
  clearInterval(holdTimer);
}
function go(n) {
  step = Math.min(STEPS, Math.max(1, n));
  $$(".mstep").forEach(s => s.hidden = +s.dataset.step !== step);
  $$("#mprog i").forEach((i, idx) => i.classList.toggle("on", idx < step));
  $("#mPrev").style.visibility = step === 1 ? "hidden" : "visible";
  $("#mNext").textContent = step === 5 ? "결제 확인" : "다음";
  $("#mnav").style.display = step === STEPS ? "none" : "flex";
  if (step === 5) startHold();
  $(".modal-card").scrollTop = 0;
}
function startHold() {
  clearInterval(holdTimer);
  let s = CONF.holdSeconds;
  const el = $("#holdTimer");
  const paint = () => el.textContent =
    `재고 확보 ${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  paint();
  holdTimer = setInterval(() => { if (--s >= 0) paint(); else clearInterval(holdTimer); }, 1000);
}

/* 열기/닫기 */
$$("[data-buy]").forEach(b => b.addEventListener("click", openModal));
$("#gnbCta").addEventListener("click", openModal);
$$("[data-close]").forEach(b => b.addEventListener("click", closeModal));
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

/* step1 수량 */
$$(".qbtn").forEach(b => b.addEventListener("click", () => {
  qty = Math.min(CONF.maxQtyDemo, Math.max(1, qty + (b.dataset.q === "+" ? 1 : -1)));
  $("#qtyVal").textContent = qty;
  $("#payAmt").textContent = fmt(CONF.priceEarly * qty) + " RLUSD";
}));

/* step2 지갑 (데모) */
$$(".wbtn").forEach(b => b.addEventListener("click", () => {
  $$(".wbtn").forEach(x => x.classList.remove("on"));
  b.classList.add("on");
  wallet = b.dataset.wallet;
  $("#walletName").textContent = wallet;
  $("#walletState").hidden = false;
}));

/* step3 이메일 인증 (데모) */
$("#mailBtn").addEventListener("click", () => {
  if (!$("#fMail").value.includes("@")) { alert("이메일을 입력해 주세요."); return; }
  $("#fCode").hidden = false;
  $("#fCode").value = "482913";
  $("#mailBtn").textContent = "재발송";
});

/* step5 결제 탭·서명 (데모) */
$$(".pt").forEach(t => t.addEventListener("click", () => {
  $$(".pt").forEach(x => x.classList.remove("on"));
  t.classList.add("on");
  $$(".paypane").forEach(p => p.hidden = p.dataset.pane !== t.dataset.pt);
}));
$("#signBtn").addEventListener("click", () => {
  const b = $("#signBtn");
  b.textContent = "지갑 확인 중…"; b.disabled = true;
  setTimeout(() => {
    paid = true;
    $("#signOk").hidden = false;
    b.textContent = "서명 완료";
  }, 1200);
});

/* 다음/이전 + 단계 검증 */
$("#mNext").addEventListener("click", () => {
  if (step === 2 && !wallet) { alert("지갑을 연결해 주세요. (데모: 버튼 선택)"); return; }
  if (step === 3) {
    if (!$("#fName").value || !$("#fAddr").value || !$("#fMail").value)
      { alert("배송 정보를 입력해 주세요."); return; }
  }
  if (step === 4 && !($("#ck1").checked && $("#ck2").checked))
    { alert("필수 약관에 동의해 주세요."); return; }
  if (step === 5 && !paid && $(".pt.on").dataset.pt === "a")
    { alert("지갑 서명을 완료해 주세요. (데모: 서명 요청 버튼)"); return; }
  go(step + 1);
});
$("#mPrev").addEventListener("click", () => go(step - 1));
