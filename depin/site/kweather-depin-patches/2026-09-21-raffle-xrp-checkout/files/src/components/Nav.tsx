"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useWallet } from "@/lib/wallet/WalletContext";
import { useI18n, LOCALES, pickL } from "@/lib/i18n";
import WalletPanel from "@/components/WalletPanel";
import EmailAuth from "@/components/EmailAuth";
import { LOGO_SVG } from "@/components/landing/parts";
import { toast } from "@/components/Toast";

/* concept-b 헤더 메뉴 - 문구·구성 원본 그대로 */
const LINKS: { href: string; label: string; hot?: boolean; external?: boolean }[] = [
  { href: "/launch", label: "Launch", hot: true },
  { href: "/event/xrpl-seoul", label: "XRP SEOUL 래플" },   // 2026-09-21: 래플 페이지 진입 경로(그동안 외부 링크로만 들어왔다)
  { href: "/redeem", label: "기기 등록" },
  { href: "/membership", label: "라이선스" },
  { href: "/network", label: "익스플로러" },
  { href: "/data", label: "데이터 마켓" },
  { href: "/defi", label: "DeFi" },
  { href: "/token", label: "WELLBIAN" },
];

/* 로컬 번역 사전 - [ko,en,ja,zh,es]. 키는 원문(한국어)이라 미등록 라벨은 그대로 노출된다. */
const L: Record<string, string[]> = {
  "XRP SEOUL 래플": ["XRP SEOUL 래플", "XRP SEOUL Raffle", "XRP SEOUL ラッフル", "XRP SEOUL 抽奖", "Sorteo XRP SEOUL"],
  "기기 등록": ["기기 등록", "Register device", "デバイス登録", "设备注册", "Registrar equipo"],
  "라이선스": ["라이선스", "License", "ライセンス", "许可证", "Licencia"],
  "익스플로러": ["익스플로러", "Explorer", "エクスプローラー", "浏览器", "Explorador"],
  "데이터 마켓": ["데이터 마켓", "Data Market", "データマーケット", "数据市场", "Mercado de datos"],
  "마이페이지": ["마이페이지", "My Page", "マイページ", "我的页面", "Mi página"],
  "앱 내려받기": ["앱 내려받기", "Get the app", "アプリを入手", "获取应用", "Obtener la app"],
  "고객지원": ["고객지원", "Support", "サポート", "客户支持", "Soporte"],
  /* es는 "Iniciar sesión"이 길어 320px 나브를 넘겨서 짧은 동의어 Entrar 사용 */
  "로그인": ["로그인", "Sign In", "ログイン", "登录", "Entrar"],
  "연결 중…": ["연결 중…", "Connecting…", "接続中…", "连接中…", "Conectando…"],
  "aria.home": ["Wellbian 홈으로 이동", "Go to Wellbian home", "Wellbianホームへ移動", "前往 Wellbian 首页", "Ir al inicio de Wellbian"],
  "aria.lang": ["언어 선택", "Select language", "言語選択", "选择语言", "Seleccionar idioma"],
  "aria.menu": ["메뉴 열기", "Open menu", "メニューを開く", "打开菜单", "Abrir menú"],
  "easy.title": ["로그인 또는 회원가입", "Sign in or sign up", "ログインまたは登録", "登录或注册", "Entrar o registrarse"],
  "easy.sub": ["이메일 하나면 됩니다. 설치할 앱도, 준비할 것도 없습니다.", "Just an email - nothing to install, nothing to prepare.", "メールアドレスだけでOK。アプリも準備も不要です。", "只需一个邮箱，无需安装应用或准备任何东西。", "Solo un correo: nada que instalar ni preparar."],
  "easy.or": ["또는 이메일로", "or with email", "またはメールで", "或使用邮箱", "o con correo"],
  "emb.exists.warn": [
    "이 브라우저에는 이미 지갑이 저장되어 있습니다. 새로 가입하면 기존 지갑은 이 브라우저에서 교체됩니다(주소+비밀번호로 언제든 복구 가능).",
    "This browser already has a saved wallet. Signing up replaces it locally (you can recover the old one anytime with its address + password).",
    "このブラウザには既にウォレットが保存されています。新規登録するとローカルでは置き換えられます（アドレス＋パスワードでいつでも復元可能）。",
    "此浏览器已保存钱包。重新注册会在本地替换它（可随时用地址+密码恢复旧钱包）。",
    "Este navegador ya tiene una billetera guardada. Registrarse la reemplaza localmente (puedes recuperar la anterior con su dirección + contraseña).",
  ],
};

export function short(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

/** landingIsLaunch: 캠페인 기간 동안 "/"가 (어두운 컨셉 히어로 대신) 런치 페이지를 렌더 중이라는
 *  서버 판정 - 이때 투명 나브는 밝은 배경 위에 흰 글씨가 돼 안 보이므로 짙은 배경을 유지한다. */
export default function Nav({ landingIsLaunch = false }: { landingIsLaunch?: boolean }) {
  const pathname = usePathname();
  const {
    address,
    connecting,
    config,
    dcentAvailable,
    girinAvailable,
    connectDcent,
    connectXaman,
    connectGirin,
    createEmbeddedWallet,
    unlockEmbeddedWallet,
    unlockEmbeddedPasskey,
    connectGoogle,
    socialError,
    hasEmbedded,
    hasEmbeddedPasskey,
    connectDev,
  } = useWallet();
  const { locale, setLocale, t } = useI18n();
  const tt = (k: string) => (L[k] ? pickL(L[k], locale) : k);
  const [open, setOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [seed, setSeed] = useState("");
  const [err, setErr] = useState("");
  const [embOpen, setEmbOpen] = useState(false);
  const [walletsOpen, setWalletsOpen] = useState(false);
  const [embRecover, setEmbRecover] = useState(false);
  const [embCreateOverride, setEmbCreateOverride] = useState<boolean | null>(null);
  const [embId, setEmbId] = useState("");
  const [embIdOk, setEmbIdOk] = useState<boolean | null>(null);
  const [embPw, setEmbPw] = useState("");
  const [embPw2, setEmbPw2] = useState("");
  const [embAddr, setEmbAddr] = useState("");
  const [embBusy, setEmbBusy] = useState(false);
  const [savedUid, setSavedUid] = useState<string | null>(null);
  useEffect(() => {
    import("@/lib/wallet/embedded").then((m) => setSavedUid(m.savedUserId())).catch(() => {});
  }, [open]);
  // 다른 화면(사전예약·구매 모달)이 로그인을 요청하면 연다
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("kw:open-login", onOpen);
    return () => window.removeEventListener("kw:open-login", onOpen);
  }, []);
  // a failed social-login return surfaces here (the modal isn't open after a redirect)
  useEffect(() => {
    if (socialError) {
      setErr(socialError); toast.err(socialError);
      setOpen(true);
    }
  }, [socialError]);
  const langRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* 메뉴가 한 줄에 들어가는지 직접 재서 3단계로 맞춘다 (2026-09-11 지시).
     예전에는 화면 폭 1024px 만 보고 펼쳤는데, 같은 폭이라도 언어마다 메뉴 글자 폭이 크게 다르다
     (1280px 기준 필요 폭: 한국어 1218 · 스페인어 1359 · 일본어 1381, 쓸 수 있는 폭 1201).
     그래서 스페인어·일본어에서는 메뉴가 로그인 버튼을 밀고 화면 밖으로 나갔다.
       roomy     = 시안 그대로(로고-메뉴 간격 80px, 항목 여백 넉넉)
       compact   = 간격 20px · 항목 여백·글자 한 단계 축소 (globals.css 의 .nav-compact)
       collapsed = 그래도 모자라면 메뉴를 접고 햄버거를 띄운다
     폭을 재서 고르므로 어떤 언어가 와도, 글꼴이 늦게 와도 알아서 맞는다. */
  const navRowRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const navEndRef = useRef<HTMLDivElement | null>(null);
  const navLogoRef = useRef<HTMLAnchorElement | null>(null);
  const [navFits, setNavFits] = useState(true);
  useEffect(() => {
    const row = navRowRef.current;
    if (!row || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const nav = navRef.current, end = navEndRef.current, logo = navLogoRef.current;
      if (!nav || !end || !logo) return;
      if (!window.matchMedia("(min-width: 1024px)").matches) {   // 그 아래는 원래 햄버거
        row.classList.remove("nav-compact");
        setNavFits(true);
        return;
      }
      const fitsWith = (compact: boolean) => {
        row.classList.toggle("nav-compact", compact);
        const gap = parseFloat(getComputedStyle(row).columnGap || "0") || 0;
        return logo.offsetWidth + nav.scrollWidth + end.offsetWidth + gap * 2 <= row.clientWidth;
      };
      const roomy = fitsWith(false);
      const compact = roomy ? false : fitsWith(true);
      row.classList.toggle("nav-compact", !roomy && compact);
      setNavFits(roomy || compact);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(row);
    window.addEventListener("resize", measure);
    /* 글꼴이 늦게 오면 글자 폭이 바뀐다 - 다 그려진 뒤 한 번 더 잰다 */
    document.fonts?.ready.then(measure).catch(() => {});
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [locale]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // warm the D'CENT SDK while the modal is open so the click stays inside
  // the user-gesture window (its popup gets blocked otherwise)
  useEffect(() => {
    if (open) import("dcent-web-connector").catch(() => {});
  }, [open]);

  const onConnect = async () => {
    setErr("");
    /* 디센트 인앱 브라우저라고 바로 디센트로 붙지 않는다 - 해제 후 다른 계정
       (구글·아이디·외부지갑)으로 갈아탈 수 없게 되기 때문. 항상 선택 모달을
       띄우고, 모달 최상단의 D'CENT 버튼으로 원클릭 연결은 유지한다. */
    setOpen(true);
  };

  const isLanding = pathname === "/";
  /* 사전구매 히어로는 어두운 보라 배경이 헤더 뒤까지 올라온다 - 그 위에서는 나브를
     투명하게 둬야 배경이 그대로 비친다. "/launch/me" 같은 밝은 페이지까지 잡히면
     흰 메뉴 글씨가 묻히므로 startsWith 대신 경로를 정확히 열거한다.

     landingIsLaunch 는 layout.tsx(루트 레이아웃)가 캠페인 기간 내내 전 페이지에 내려주는
     전역 플래그다 - 경로 조건 없이 그대로 쓰면 라이선스·데이터 마켓 같은 흰 페이지까지
     헤더가 투명해져 흰 메뉴 글씨가 사라진다. 반드시 "/" 로 한정한다. */
  /* 나브를 투명하게 둘 페이지 - 히어로가 margin-top:-90px 로 헤더 뒤까지 올라와
     어두운 배경이 깔리는 곳만 넣는다. /token(메뉴의 WELLBIAN)도 같은 구조라 넣었다(2026-09-11 지시).
     밝은 페이지를 넣으면 흰 메뉴 글씨가 배경에 묻힌다. */
  const DARK_HERO_PATHS = ["/launch", "/launch/test", "/token"];
  const launchHero = (isLanding && landingIsLaunch) || DARK_HERO_PATHS.includes(pathname);
  const transparent = (isLanding || launchHero) && !scrolled;

  return (
    <>

      {/* concept-b 헤더 - 마크업·클래스 원본 그대로, 동작만 실제 앱에 연결 */}
      <header
        /* 히어로 위에서는 화면 폭과 상관없이 투명하게 둔다 (2026-09-11 지시).
           예전에는 1024px 이상에서만 투명(lg:bg-transparent)이라, 노트북을 조금만 좁혀도
           불투명한 남색 띠가 히어로 윗부분을 덮어 배경 그림이 잘려 보였다.
           히어로는 어느 폭에서나 어두워서 흰 메뉴 글씨는 그대로 읽힌다. */
        className={`relative top-0 z-50 w-full transition-colors duration-300 sticky lg:fixed ${
          transparent ? "bg-transparent" : "bg-brand-950"
        }`}
      >
        {/* 콘텐츠 폭: 1920 화면에서 히어로 좌측 텍스트(x=302)와 로고가 같은 x 에서 시작하도록
            1316(=1920-302*2)에 비례시키되 1280 을 하한으로 둔다. 1920 미만에서는 max() 가
            1280 을 고르므로 기존과 완전히 동일하고, 1920 이상에서만 함께 넓어진다. */}
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 hero-fade">
          <div
            ref={navRowRef}
            className="relative mx-auto flex h-16 w-full items-center gap-6 lg:h-[66px] lg:gap-5 xl:gap-[80px]"
            style={{ maxWidth: "max(1280px, calc(1316 * min(100vw, 1920px) / 1920))" }}
          >
            <Link
              ref={navLogoRef}
              href="/"
              aria-label={tt("aria.home")}
              className="inline-flex shrink-0 flex-col gap-1.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ref-blue focus-visible:ring-offset-2"
              dangerouslySetInnerHTML={{ __html: LOGO_SVG }}
            />
            {/* 컨셉 원본은 xl(1280px+)에서만 메뉴 노출 - 일반 노트북에서 메뉴가
                통째로 사라져 보여 lg(1024px+)로 완화 */}
            <nav
              ref={navRef}
              aria-hidden={!navFits}
              className={`hidden lg:block ${navFits ? "" : "pointer-events-none invisible absolute -z-10"}`}
            >
              <ul className="flex items-center lg:translate-y-[3px] gap-[3px] 2xl:gap-[19px]">
                {LINKS.map((l) => (
                  <li key={l.label}>
                    <a
                      className="transition-colors inline-flex h-10 items-center whitespace-nowrap rounded-full px-2 xl:px-4 text-[15px] xl:text-base font-semibold text-white hover:bg-white/[0.07]"
                      href={l.href}
                      {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})}
                    >
                      <span className="relative inline-flex items-center">
                        {tt(l.label)}
                        {l.hot && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img alt="HOT" width={50} height={33} className="absolute -left-[4px] h-auto -top-[16px] w-[32px]" src="/images/icon_hot.svg" />
                        )}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div ref={navEndRef} className="ml-auto flex items-center gap-1.5 sm:gap-3">
              {/* 개인 스테이션 관리는 마이페이지 하나로 통일 - 메뉴에 별도 항목을 두면 중복이라 걷어냈다 */}
              <Link
                href="/my"
                className="hidden sm:inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-full border border-white/25 bg-white/5 px-3.5 text-xs font-bold text-white/85 transition-colors hover:border-white/45 hover:text-white lg:h-9 lg:text-[0.8125rem]"
              >
                {tt("마이페이지")}
              </Link>
              <div className={`lang-switch ${langOpen ? "open" : ""}`} ref={langRef}>
                <button
                  type="button"
                  aria-label={tt("aria.lang")}
                  onClick={() => setLangOpen((v) => !v)}
                  className="inline-flex h-8 shrink-0 items-center gap-1 sm:gap-1.5 whitespace-nowrap rounded-full border px-2 sm:px-3 text-xs font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ref-blue lg:h-9 lg:px-3.5 lg:text-[0.8125rem] border-white/25 bg-white/5 text-white/85 hover:border-white/45 hover:text-white"
                >
                  {LOCALES.find((l) => l.code === locale)?.label}
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5 text-white/50" aria-hidden>
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                <div className="lang-menu">
                  <div className="lang-menu-h">LANGUAGE</div>
                  {LOCALES.map((l) => (
                    <button
                      key={l.code}
                      className={`lang-option ${l.code === locale ? "active" : ""}`}
                      onClick={() => {
                        setLocale(l.code);
                        setLangOpen(false);
                      }}
                    >
                      <span className="code">{l.label}</span>
                      <span className="name">{l.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              {address ? (
                <button
                  onClick={() => setPanelOpen(true)}
                  className="inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-[20px] px-3 sm:px-[1.125rem] text-xs font-bold transition-colors lg:h-9 lg:px-[1.375rem] lg:text-[0.8125rem] bg-ref-blue text-white hover:bg-brand-500"
                >
                  {/* 320px대에서 로그인 상태 나브가 넘치지 않게 초소형에서는 주소를 더 줄인다 */}
                  <span className="sm:hidden">{address.slice(0, 4)}…{address.slice(-2)}</span>
                  <span className="hidden sm:inline">{short(address)}</span>
                </button>
              ) : (
                <button
                  onClick={onConnect}
                  disabled={connecting}
                  className="inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-[20px] px-3 sm:px-[1.125rem] text-xs font-bold transition-colors lg:h-9 lg:px-[1.375rem] lg:text-[0.8125rem] bg-ref-blue text-white hover:bg-brand-500"
                >
                  {connecting ? tt("연결 중…") : tt("로그인")}
                </button>
              )}
              <button
                type="button"
                aria-label={tt("aria.menu")}
                onClick={() => setMenuOpen((v) => !v)}
                /* 9/2: 옆의 KO·로그인 버튼(약 40px)보다 작아 눌리는 느낌이 약했다 - 32 -> 40,
                   아이콘 20 -> 24, 모서리도 옆 버튼과 같은 8px 로. */
                className={`inline-flex size-10 shrink-0 items-center justify-center rounded-[8px] border border-white/25 bg-white/5 text-white ${navFits ? "lg:hidden" : ""}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6" aria-hidden>
                  <path d="M4 5h16" />
                  <path d="M4 12h16" />
                  <path d="M4 19h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {menuOpen && (
          /* 9/2: 이 패널이 문서 흐름 안에 있어 열릴 때 헤더가 커지고 아래 콘텐츠(히어로)를
             통째로 밀어냈다. absolute 로 빼서 아래를 덮게 한다 - 헤더에 relative 를 준 이유다.
             배경이 반투명이면 뒤 히어로가 비쳐 글씨가 안 읽히므로 불투명 bg-brand-950 을 유지한다. */
          <div className={`absolute inset-x-0 top-full border-t border-white/10 bg-brand-950 px-5 pb-4 pt-2 shadow-[0_18px_40px_rgba(9,9,30,.45)] ${navFits ? "lg:hidden" : ""}`}>
            {[...LINKS, { href: "/app", label: "앱 내려받기" }, { href: "/my", label: "마이페이지" }, { href: "/support", label: "고객지원" }].map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-[0.9375rem] font-semibold text-white/85 hover:bg-white/[0.07] hover:text-white"
              >
                {tt(l.label)}
              </a>
            ))}
          </div>
        )}
      </header>

      {panelOpen && address && <WalletPanel onClose={() => setPanelOpen(false)} />}

      {open && !address && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal easy-modal wb-modal" onClick={(e) => e.stopPropagation()}>
            {/* 어르신 UX: 제목은 "무엇을 하는 화면"인지 한 줄, 부제는 안심 문구 한 줄. 기술 용어(계정·지갑) 없음 */}
            <h3 style={{ fontSize: 24, lineHeight: 1.3, marginBottom: 6 }}>
              {pickL(L["easy.title"], locale)}
            </h3>
            <p style={{ fontSize: 15, color: "var(--ink-dim)", lineHeight: 1.6, marginBottom: 16 }}>
              {pickL(L["easy.sub"], locale)}
            </p>
            {(() => {
              const go = (fn: () => Promise<void>) => () =>
                fn().then(() => setOpen(false)).catch((e) => (setErr(e.message), toast.err(e.message)));
              const row: React.CSSProperties = { width: "100%", justifyContent: "center" };
              const embUnlockMode = embCreateOverride === null ? hasEmbedded || embRecover : !embCreateOverride;
              const embSubmit = async () => {
                setErr("");
                setEmbBusy(true);
                try {
                  if (embUnlockMode) {
                    await unlockEmbeddedWallet(embPw, embRecover || !hasEmbedded ? embAddr.trim() : undefined);
                  } else {
                    await createEmbeddedWallet(embId.trim(), embPw);
                  }
                  setOpen(false);
                } catch (e) {
                  setErr((e as Error).message); toast.err((e as Error).message);
                } finally {
                  setEmbBusy(false);
                }
              };
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* 구글은 대다수 사용자가 처음 들어온 경로다. 새 기기·새 브라우저에서
                      돌아온 사람에게는 이것이 곧 "로그인"이므로 주 버튼으로 둔다.
                      아래 회원가입/로그인은 아이디·비밀번호 지갑 전용이다. */}
                  {config?.googleClientId && (
                    <>
                      <button
                        onClick={() => { try { connectGoogle(); } catch (e) { setErr((e as Error).message); toast.err((e as Error).message); } }}
                        disabled={connecting}
                        className={`btn-primary${connecting ? " is-busy" : ""}`}
                        style={{ ...row, fontSize: 18, padding: "15px 18px", minHeight: 54 }}
                      >
                        {connecting ? tt("연결 중…") : t("social.google")}
                      </button>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "6px 0 2px", color: "var(--ink-faint)", fontSize: 13 }}>
                        <span style={{ flex: 1, height: 1, background: "var(--line-2)" }} />{pickL(L["easy.or"], locale)}<span style={{ flex: 1, height: 1, background: "var(--line-2)" }} />
                      </div>
                    </>
                  )}
                  {/* web2 트랙: 이메일이 기본. ① 이메일 → ② 비밀번호(기존/신규 자동 분기). 지갑은 뒤에서 자동 생성된다. */}
                  <EmailAuth onDone={() => setOpen(false)} />
                  {hasEmbeddedPasskey && (
                    <button
                      onClick={() => {
                        setErr("");
                        setEmbBusy(true);
                        unlockEmbeddedPasskey()
                          .then(() => setOpen(false))
                          .catch((e) => (setErr((e as Error).message), toast.err((e as Error).message)))
                          .finally(() => setEmbBusy(false));
                      }}
                      disabled={embBusy}
                      className="btn-primary"
                      style={row}
                    >
                      {embBusy ? "…" : t("pk.unlock")}
                    </button>
                  )}
                  <details style={{ marginTop: 4 }}>
                    <summary style={{ fontSize: 12, color: "var(--ink-faint)", cursor: "pointer" }}>{t("emb.adv")}</summary>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                  {!embOpen ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        // 회원가입은 항상 가입 폼(아이디+비밀번호)을 연다 - 예전엔 이 브라우저에
                        // 지갑이 있으면 몰래 로그인 모드로 바뀌어 비밀번호칸만 보이는 혼란이 있었다
                        onClick={() => { setEmbOpen(true); setEmbCreateOverride(true); }}
                        className={config?.googleClientId || hasEmbeddedPasskey || hasEmbedded ? "btn-ghost" : "btn-primary"}
                        style={{ ...row, flex: 1 }}
                      >
                        {t("emb.create")}
                      </button>
                      <button
                        onClick={() => { setEmbOpen(true); setEmbCreateOverride(false); if (!hasEmbedded) setEmbRecover(true); }}
                        className={hasEmbedded && !hasEmbeddedPasskey ? "btn-primary" : "btn-ghost"}
                        style={{ ...row, flex: 1 }}
                      >
                        {t("emb.unlock")}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, border: "1px solid var(--line-2)", padding: 12 }}>
                      <p style={{ fontSize: 12.5, color: "var(--ink-dim)", lineHeight: 1.6, margin: 0 }}>{t("emb.desc")}</p>
                      {!embUnlockMode && hasEmbedded && (
                        <p style={{ fontSize: 11.5, color: "var(--red)", lineHeight: 1.6, margin: 0 }}>
                          {pickL(L["emb.exists.warn"], locale)}
                        </p>
                      )}
                      {!embUnlockMode && (
                        <>
                          <input
                            value={embId}
                            onChange={(e) => { setEmbId(e.target.value); setEmbIdOk(null); }}
                            onBlur={() => {
                              const id = embId.trim().toLowerCase();
                              if (!/^[a-z0-9][a-z0-9._-]{3,19}$/.test(id)) { setEmbIdOk(null); return; }
                              import("@/lib/wallet/embedded").then((m) => m.checkUserId(id)).then(setEmbIdOk).catch(() => {});
                            }}
                            placeholder={t("emb.id")}
                            className="field-input"
                            autoComplete="username"
                            autoCapitalize="none"
                          />
                          {embIdOk !== null && (
                            <p style={{ fontSize: 11.5, color: embIdOk ? "var(--green)" : "var(--red)", margin: 0 }}>
                              {embIdOk ? `✓ ${t("emb.id.ok")}` : `✕ ${t("emb.id.taken")}`}
                            </p>
                          )}
                        </>
                      )}
                      {embUnlockMode && (embRecover || !hasEmbedded) ? (
                        <input
                          value={embAddr}
                          onChange={(e) => setEmbAddr(e.target.value)}
                          placeholder={t("emb.recover.addr")}
                          className="field-input"
                          autoComplete="username"
                          autoCapitalize="none"
                        />
                      ) : embUnlockMode && savedUid ? (
                        <p className="mono" style={{ fontSize: 12.5, color: "var(--ink-dim)", margin: 0 }}>ID · {savedUid}</p>
                      ) : null}
                      <input
                        type="password"
                        value={embPw}
                        onChange={(e) => setEmbPw(e.target.value)}
                        placeholder={embUnlockMode ? t("emb.pw.unlock") : t("emb.pw")}
                        className="field-input"
                        autoComplete={embUnlockMode ? "current-password" : "new-password"}
                      />
                      {!embUnlockMode && (
                        <>
                          {/* 비밀번호 확인 - 비수탁 지갑이라 오타로 잠그면 영구 분실이다 */}
                          <input
                            type="password"
                            value={embPw2}
                            onChange={(e) => setEmbPw2(e.target.value)}
                            placeholder={t("emb.pw2")}
                            className="field-input"
                            autoComplete="new-password"
                          />
                          {embPw2.length > 0 && embPw !== embPw2 && (
                            <p style={{ fontSize: 11.5, color: "var(--red)", margin: 0 }}>{t("emb.pw.mismatch")}</p>
                          )}
                          <p style={{ fontSize: 11.5, color: "var(--ink-faint)", lineHeight: 1.6, margin: 0 }}>{t("emb.pw.warn")}</p>
                        </>
                      )}
                      <button
                        onClick={embSubmit}
                        disabled={embBusy || embPw.length < 8 || (!embUnlockMode && (embIdOk === false || embPw !== embPw2))}
                        className="btn-primary"
                        style={row}
                      >
                        {embBusy ? "…" : embUnlockMode ? t("emb.unlock") : t("emb.create")}
                      </button>
                      {embUnlockMode && !embRecover && hasEmbedded && (
                        <button
                          onClick={() => setEmbRecover(true)}
                          className="btn-ghost"
                          style={{ ...row, fontSize: 12 }}
                        >
                          {t("emb.recover")}
                        </button>
                      )}
                    </div>
                  )}
                    </div>
                  </details>
                  {!walletsOpen ? (
                    <button
                      onClick={() => setWalletsOpen(true)}
                      className="btn-ghost"
                      style={{ ...row, fontSize: 12, marginTop: 6 }}
                    >
                      {t("modal.wallets.toggle")} ▾
                    </button>
                  ) : (
                    <>
                      {dcentAvailable && (
                        <button onClick={go(connectDcent)} className="btn-primary" style={row}>
                          {t("modal.dcent")}
                        </button>
                      )}
                      <p className="field-label" style={{ margin: "6px 0 0" }}>{t("modal.section.mobile")}</p>
                      {/* 디센트는 USB(브리지) 대신 모바일 앱 지갑으로만 연결한다(사용자 지시).
                          딥링크로 D'CENT 앱의 인앱 브라우저에서 이 사이트를 다시 열면
                          window.xrpl이 주입되어 위 dcentAvailable 버튼이 뜬다. */}
                      {!dcentAvailable && (
                        <>
                          <a
                            href={`https://link.dcentwallet.com/DAppBrowser/?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "https://wellbian.io")}`}
                            className="btn-ghost"
                            style={row}
                          >
                            {t("modal.dcentapp")}
                          </a>
                          <div className="note" style={{ fontSize: 13 }}>{t("modal.dcentapp.d")}</div>
                        </>
                      )}
                      {/* 기린 월렛 - WalletConnect(QR·딥링크). 주입형 확장이 아니라 모바일 앱이다. */}
                      {girinAvailable && (
                        <>
                          <button onClick={go(connectGirin)} className="btn-ghost" style={row}>
                            {t("modal.girin")}
                          </button>
                          <div className="note" style={{ fontSize: 13 }}>{t("modal.girin.d")}</div>
                        </>
                      )}
                      {config?.xamanEnabled && (
                        <button onClick={go(connectXaman)} className="btn-ghost" style={row}>
                          {t("modal.xaman")}
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })()}
            {config?.devWallet && (
              <div style={{ marginTop: 20, borderTop: "1px dotted var(--line-2)", paddingTop: 16 }}>
                <label className="field-label">{t("modal.devseed")}</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    placeholder="s..."
                    className="field-input"
                  />
                  <button
                    onClick={() => connectDev(seed).then(() => setOpen(false)).catch((e) => (setErr(e.message), toast.err(e.message)))}
                    className="btn-ghost"
                  >
                    {t("modal.connect")}
                  </button>
                </div>
              </div>
            )}
            {err && <p style={{ marginTop: 12, fontSize: 13, color: "var(--red)" }}>{err}</p>}
          </div>
        </div>
      )}
    </>
  );
}
