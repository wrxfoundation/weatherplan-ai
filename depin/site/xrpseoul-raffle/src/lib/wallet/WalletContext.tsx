"use client";
/* 단독 앱용 지갑 컨텍스트 - 정본(src/lib/wallet/WalletContext.tsx)의 useWallet() 과 같은 모양만 흉내 낸다.
   미리보기 사이트에는 로그인·지갑이 없다. 응모 버튼(로그인 필요)은 정본 사이트로 보낸다(NEXT_PUBLIC_CANONICAL_URL, 기본 wellbian.io/event/xrpl-seoul).
   /preview 는 fake 로 감싸 결제창 화면을 그려 본다. */
import { createContext, useContext, useMemo } from "react";
import { toast } from "@/components/Toast";

export type WalletKind = "dev" | "usb" | "xaman" | "girin" | "embedded" | "inapp";
interface SignResult { hash?: string; result?: string }
interface WalletCtx {
  address: string | null; walletKind: WalletKind | null; walletName: string | null; sessionVerified: boolean;
  openLogin: () => void; signAndSubmit: (tx: Record<string, unknown>) => Promise<SignResult>;
}
const CANONICAL = process.env.NEXT_PUBLIC_CANONICAL_URL || "https://wellbian.io/event/xrpl-seoul";
const EMPTY: WalletCtx = { address: null, walletKind: null, walletName: null, sessionVerified: false, openLogin: () => {}, signAndSubmit: async () => ({}) };
const Ctx = createContext<WalletCtx>(EMPTY);

export function WalletProvider({ children, fake }: { children: React.ReactNode; fake?: boolean }) {
  const value = useMemo<WalletCtx>(() => fake
    ? { address: "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH", walletKind: "embedded", walletName: "간편 지갑", sessionVerified: true, openLogin: () => {}, signAndSubmit: async () => ({}) }
    : {
        ...EMPTY,
        openLogin: () => {
          toast.info("응모(로그인·결제)는 정본 사이트에서 진행됩니다 - 잠시 후 이동합니다.");
          setTimeout(() => { window.location.href = CANONICAL; }, 900);
        },
        signAndSubmit: async () => { throw new Error("이 미리보기에서는 서명하지 않습니다."); },
      }, [fake]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useWallet = () => useContext(Ctx);
