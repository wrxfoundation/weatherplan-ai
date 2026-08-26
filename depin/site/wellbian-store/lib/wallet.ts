/* 지갑 어댑터 인터페이스 (PRD §2) — 초기 구현은 mock. xrpl.js 연동 시 어댑터만 교체 */

export interface WalletAdapter {
  id: "dcent" | "xaman" | "gemwallet";
  name: string;
  desc: string;
  detected: boolean;
  connect(): Promise<{ address: string }>;
  sign(tx: { amount: number; to: string; tag: string }): Promise<{ txHash: string }>;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function mockAdapter(
  id: WalletAdapter["id"],
  name: string,
  desc: string,
  detected: boolean
): WalletAdapter {
  return {
    id, name, desc, detected,
    async connect() {
      await delay(700);
      return { address: "rWLB9…kQ2f" };
    },
    async sign() {
      await delay(1600);
      return { txHash: "A3F8…C21E" };
    },
  };
}

export const WALLETS: WalletAdapter[] = [
  mockAdapter("dcent", "D'CENT", "인앱 브라우저에서 자동 감지됨", true),
  mockAdapter("xaman", "Xaman", "간편 웹3 지갑 · QR 연결", false),
  mockAdapter("gemwallet", "GemWallet", "브라우저 확장", false),
];
