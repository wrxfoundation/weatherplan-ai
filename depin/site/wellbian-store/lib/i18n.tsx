"use client";
/* KO/EN 토글 (PRD §5.4) — localStorage("wb-lang")에 유지, 기본 ko.
   서버 렌더는 항상 ko → 마운트 후 저장값으로 전환(하이드레이션 불일치 없음). */
import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "ko" | "en";

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "ko",
  setLang: () => {},
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ko");

  useEffect(() => {
    try {
      if (localStorage.getItem("wb-lang") === "en") {
        setLangState("en");
        document.documentElement.lang = "en";
      }
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("wb-lang", l); } catch {}
    try { document.documentElement.lang = l; } catch {}
  };

  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}

export function useI18n() {
  const { lang, setLang } = useContext(LangCtx);
  return { lang, setLang, en: lang === "en" };
}
