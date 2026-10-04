"use client";
/* 단독 앱용 언어 컨텍스트 - 정본(src/lib/launch/i18n.tsx)과 같은 내보내기(Lang·LANGS·Msg·pick·useI18n·LangProvider).
   정본은 메인 사이트 i18n(kw_locale)을 구독하지만 여기서는 localStorage("wb-lang") 하나로 돌린다. 서버 렌더는 항상 ko. */
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "ko" | "en" | "ja" | "zh" | "es";

export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: "ko", label: "한국어", short: "KO" },
  { code: "en", label: "English", short: "EN" },
  { code: "ja", label: "日本語", short: "JA" },
  { code: "zh", label: "中文", short: "ZH" },
  { code: "es", label: "Español", short: "ES" },
];
const CODES = LANGS.map((l) => l.code);
const isLang = (v: unknown): v is Lang => typeof v === "string" && (CODES as string[]).includes(v);
const HTML_LANG: Record<Lang, string> = { ko: "ko", en: "en", ja: "ja", zh: "zh-Hans", es: "es" };

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "ko", setLang: () => {} });

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ko");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("wb-lang");
      if (isLang(saved)) { setLangState(saved); document.documentElement.lang = HTML_LANG[saved]; return; }
      const nav = (navigator.language || "ko").slice(0, 2);
      if (isLang(nav) && nav !== "ko") { setLangState(nav); document.documentElement.lang = HTML_LANG[nav]; }
    } catch { /* ignore */ }
  }, []);
  const value = useMemo(() => ({
    lang,
    setLang: (l: Lang) => {
      if (!isLang(l)) return;
      setLangState(l);
      try { localStorage.setItem("wb-lang", l); document.documentElement.lang = HTML_LANG[l]; } catch { /* ignore */ }
    },
  }), [lang]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

/* 언어별 값 묶음. ko 는 필수 - 최후 폴백이 항상 존재하게 한다. */
export type Msg<T = string> = { ko: T } & Partial<Record<Exclude<Lang, "ko">, T>>;

export function pick<T>(m: Msg<T>, lang: Lang): T {
  const v = m[lang];
  if (v !== undefined) return v;
  if (lang !== "ko" && m.en !== undefined) return m.en; // 번역 미완성 자리는 영어로
  return m.ko;
}

export function useI18n() {
  const { lang, setLang } = useContext(LangCtx);
  return { lang, setLang, en: lang !== "ko", t: <T,>(m: Msg<T>) => pick(m, lang) };
}
