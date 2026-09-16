"use client";
/* 언어 전환 (PRD §5.4) — localStorage("wb-lang")에 유지, 기본 ko.
   서버 렌더는 항상 ko → 마운트 후 저장값으로 전환(하이드레이션 불일치 없음).

   8/28 서우: KO/EN 토글 → 5개 언어 드롭다운.
   기존 화면 코드 207곳이 `en ? A : B` 삼항으로 쓰여 있어 한 번에 다 못 바꾼다.
   그래서 두 갈래를 같이 굴린다.
     · `en` — 하위호환 플래그. **ko 가 아니면 true** 라서, 아직 옮기지 못한 자리는
       일본어·중국어·스페인어에서도 한국어가 아니라 영어가 나온다(안전한 폴백).
     · `t()` — 새로 쓰는 자리. 언어별 값을 주면 현재 언어를 고르고,
       없으면 en → ko 순으로 떨어진다. 옮긴 자리부터 실제 해당 언어가 나온다. */
import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "ko" | "en" | "ja" | "zh" | "es";

/* 드롭다운 표기는 각 언어를 그 언어로 적는다 — 자기 언어를 못 찾는 일이 없게 */
export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: "ko", label: "한국어", short: "KO" },
  { code: "en", label: "English", short: "EN" },
  { code: "ja", label: "日本語", short: "JA" },
  { code: "zh", label: "中文", short: "ZH" },
  { code: "es", label: "Español", short: "ES" },
];

const CODES = LANGS.map((l) => l.code);
const isLang = (v: unknown): v is Lang => typeof v === "string" && (CODES as string[]).includes(v);

/* <html lang> 에 넣을 BCP 47 태그 */
const HTML_LANG: Record<Lang, string> = { ko: "ko", en: "en", ja: "ja", zh: "zh-Hans", es: "es" };

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "ko",
  setLang: () => {},
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ko");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wb-lang");
      if (isLang(saved) && saved !== "ko") {
        setLangState(saved);
        document.documentElement.lang = HTML_LANG[saved];
      }
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    if (!isLang(l)) return;
    setLangState(l);
    try { localStorage.setItem("wb-lang", l); } catch {}
    try { document.documentElement.lang = HTML_LANG[l]; } catch {}
  };

  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}

/* 언어별 값 묶음. ko 는 필수 — 최후 폴백이 항상 존재하게 한다. */
export type Msg<T = string> = { ko: T } & Partial<Record<Exclude<Lang, "ko">, T>>;

export function pick<T>(m: Msg<T>, lang: Lang): T {
  const v = m[lang];
  if (v !== undefined) return v;
  if (lang !== "ko" && m.en !== undefined) return m.en; // 번역 미완성 자리는 영어로
  return m.ko;
}

export function useI18n() {
  const { lang, setLang } = useContext(LangCtx);
  return {
    lang,
    setLang,
    /* 하위호환: ko 가 아니면 영어 갈래를 탄다 */
    en: lang !== "ko",
    t: <T,>(m: Msg<T>) => pick(m, lang),
  };
}
