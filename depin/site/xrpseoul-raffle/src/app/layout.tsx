import type { Metadata } from "next";
import "./globals.css";
import { LangProvider } from "@/lib/launch/i18n";
import { WalletProvider } from "@/lib/wallet/WalletContext";
import ToastHost from "@/components/Toast";
import TopBar from "@/components/TopBar";

const TITLE = "XRP SEOUL 2026 래플 · 5 XRP 응모 - Wellbian";
const DESC = "5 XRP 로 응모하고 XRP SEOUL 2026(10/3 서울) 초대권·Weather Data Token Generator™·굿즈를 받아 가세요. 응모하면 래플 NFT 가 지갑으로 발급됩니다.";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://xrpseoul-raffle.vercel.app"),
  title: TITLE,
  description: DESC,
  openGraph: { title: TITLE, description: DESC, type: "website", images: [{ url: "/assets/raffle/hero.webp", width: 2000, height: 1131 }] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC, images: ["/assets/raffle/hero.webp"] },
};

/* 정본 layout 은 next/font(Montserrat·Roboto)로 --font-montserrat/--font-roboto 를 만든다. 단독 앱은 빌드 때 폰트를 받지 않게 Google Fonts CSS 링크로 대신한다. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Roboto:wght@400;700;900&display=swap" />
        <style>{`:root{--font-montserrat:'Montserrat';--font-roboto:'Roboto'}`}</style>
      </head>
      <body>
        <LangProvider>
          <WalletProvider>
            <TopBar />
            <main>{children}</main>
            <ToastHost />
          </WalletProvider>
        </LangProvider>
      </body>
    </html>
  );
}
