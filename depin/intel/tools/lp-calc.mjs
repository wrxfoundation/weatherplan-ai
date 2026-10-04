/* AMM LP 시나리오 계산 — 손으로 적지 않고 돌려서 표를 만든다 */
const FEE = 0.005;                 // 우리 풀 설정 0.50% (wlbn-platform.md)

// 비영구적 손실: 가격이 r 배 됐을 때, 그냥 들고 있는 것 대비
const il = (r) => 2 * Math.sqrt(r) / (1 + r) - 1;
// 기간 수수료 수입: 회전율(일 거래량÷풀) × 수수료율 × 일수
const fee = (turn, days) => turn * FEE * days;

const pct = (x) => (x * 100).toFixed(1).padStart(6) + "%";

console.log("── IL 만 (수수료 0 가정) ─────────────────");
for (const r of [0.2, 0.5, 0.8, 1, 1.5, 2, 3, 5, 10])
  console.log(`  가격 ${String(r).padStart(4)}배 → ${pct(il(r))}`);

console.log("\n── 90일 보유 · 순 결과 (그냥 들고 있는 것 대비) ──");
const turns = [0.05, 0.1, 0.2, 0.5, 1.0];
const ratios = [0.5, 1, 2, 5, 10];
process.stdout.write("  회전율\\가격 |");
for (const r of ratios) process.stdout.write(` ${String(r + "배").padStart(7)}`);
console.log("   | 90일 수수료");
for (const t of turns) {
  process.stdout.write(`  ${String(t).padStart(9)} |`);
  for (const r of ratios) process.stdout.write(` ${pct(fee(t, 90) + il(r))}`);
  console.log(`   | ${pct(fee(t, 90))}`);
}

console.log("\n── 손익분기 회전율 (90일 동안 IL 을 딱 상쇄) ──");
for (const r of ratios.filter((x) => x !== 1))
  console.log(`  가격 ${String(r).padStart(4)}배 → 회전율 ${(-il(r) / (FEE * 90)).toFixed(2)} 필요`);

console.log("\n── 참고: 연율 환산 (회전율만, IL 제외) ──");
for (const t of turns) console.log(`  회전율 ${String(t).padStart(4)} → 연 ${pct(fee(t, 365))}`);
