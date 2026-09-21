"use client";
/* 단독 앱 상단 바 - 정본 헤더(Nav) 대신 로고 + 언어 선택만. 정본에 붙일 때는 이 파일을 쓰지 않는다. */
import { LANGS, useI18n } from "@/lib/launch/i18n";

export default function TopBar() {
  const { lang, setLang } = useI18n();
  return (
    <div style={{ background: "#111135", color: "#fff", height: 66, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 clamp(16px, 4vw, 40px)" }}>
      <a href="https://wellbian.io" target="_blank" rel="noopener" style={{ display: "inline-flex", alignItems: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo_w_medium.svg" alt="wellbian × XRP Ledger" style={{ height: 28, width: "auto" }} />
      </a>
      <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "#c8c8f0" }}>
        <span aria-hidden="true">🌐</span>
        <select value={lang} onChange={(e) => setLang(e.target.value as typeof lang)} aria-label="Language" style={{ background: "#1b1b48", color: "#fff", border: "1px solid #3a3a7a", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}>
          {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </label>
    </div>
  );
}
