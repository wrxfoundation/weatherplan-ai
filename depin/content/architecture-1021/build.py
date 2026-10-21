"""wellbian 구조 인포그래픽 (2026-10-21) — 기술 사양 v0.3 Fig 1(4계층 아키텍처)을 공유용으로 다시 그림.

Usage: python3 build.py  → architecture-{en,ko}.html · .png(1920×1080 @2x) · .jpg
근거와 단순화 내역은 README.
"""
import pathlib, re, subprocess, os

HERE = pathlib.Path(__file__).resolve().parent
LOGO = (HERE / "../../site/xrpseoul-raffle-static/www/brand/wellbian-nav.svg").read_text()
LOGO = re.sub(r'fill="(white|#ffffff|#FFFFFF)"', 'fill="#1B1B48"', LOGO)
LOGO = re.sub(r'<svg([^>]*?)\swidth="[^"]*"', r'<svg\1', LOGO, count=1)
LOGO = re.sub(r'<svg([^>]*?)\sheight="[^"]*"', r'<svg\1', LOGO, count=1)
LOGO = LOGO.replace('<svg', '<svg width="132" height="48"', 1)

T = {
 "en": dict(
  lang="en",
  title="How wellbian works: one ledger, two loops",
  sub="Air sensors in real rooms supply verified readings. Manufacturers and AI agents pay per call. Both loops settle on the XRP Ledger.",
  sup="SUPPLY LOOP", supd="devices earn for verified data",
  dem="DEMAND LOOP", demd="buyers pay per call",
  cards=dict(
   indoor=("SENSOR", "Indoor air node", "PM · CO₂ · TVOC · temperature · humidity"),
   outdoor=("SENSOR · NEXT LINE", "Outdoor air node", "PM · O₃ · NO₂ · SO₂ · CO"),
   wallet=("IDENTITY", "Device wallet", "Holds the device's license NFT"),
   oracle=("ORACLE", "DePIN oracle", "License → quality → reward, settled daily"),
   makers=("BUYERS", "Manufacturers · AI agents", "Pay automatically, call by call"),
   home=("BUYERS", "Smart-home platforms", "Pay in RLUSD, a USD stablecoin"),
   gateway=("PAYMENT", "x402 gateway", "402 → pay → verify on-chain → 200"),
   products=("DATA", "Data products", "Aggregates now; cohorts and AI reports next. De-identified, k-anonymity gate"),
  ),
  ops="<b>Operations wallet</b> pays rewards · receives payments · runs burns",
  ledger="XRP LEDGER",
  lcards=[("XLS-20 NFT", "Device licenses"), ("WLBN · RLUSD", "Issued assets on trust lines"),
          ("XLS-30 AMM", "WLBN ↔ RLUSD swaps"), ("Issuer (cold)", "Issuance; burned tokens return here")],
  lab=dict(readings="readings", check="verify", reward="reward", pay="pay per call", ok="200 OK",
           payment="payment", nft="mint license", wlbn="reward", amm="swap", burn="burn"),
  foot="Simplified from the wellbian DePIN technical specification v0.3 · paper.wellbianlabs.io · Rewards are fixed quantities; no value is promised.",
 ),
 "ko": dict(
  lang="ko",
  title="웰비안의 구조: 하나의 원장, 두 개의 순환",
  sub="실제 방에 놓인 공기질 측정기가 검증된 측정값을 올리고, 제조사와 AI 에이전트는 호출할 때마다 값을 냅니다. 두 순환 모두 XRP 원장에서 정산됩니다.",
  sup="공급 순환", supd="측정기가 검증된 데이터로 보상을 받는다",
  dem="수요 순환", demd="데이터를 쓰는 쪽이 호출마다 낸다",
  cards=dict(
   indoor=("측정기", "실내 공기질 노드", "PM · CO₂ · TVOC · 온도 · 습도"),
   outdoor=("측정기 · 다음 라인", "실외 공기질 노드", "PM · O₃ · NO₂ · SO₂ · CO"),
   wallet=("신원", "기기 지갑", "기기의 라이선스 NFT 보유"),
   oracle=("오라클", "DePIN 오라클", "라이선스 → 품질 → 보상 · 하루 단위 정산"),
   makers=("수요자", "제조사 · AI 에이전트", "호출할 때마다 자동 결제"),
   home=("수요자", "스마트홈 플랫폼", "달러 스테이블코인 RLUSD로 결제"),
   gateway=("결제", "x402 게이트웨이", "402 → 결제 → 온체인 확인 → 200"),
   products=("데이터", "데이터 상품", "집계는 지금, 코호트 · AI 리포트는 다음. 비식별 · k-익명성 관문"),
  ),
  ops="<b>운영 지갑</b> 보상 지급 · 결제 수취 · 소각 실행",
  ledger="XRP 원장",
  lcards=[("XLS-20 NFT", "기기 라이선스"), ("WLBN · RLUSD", "트러스트라인 위 발행 자산"),
          ("XLS-30 AMM", "WLBN ↔ RLUSD 교환"), ("발행 계정(콜드)", "발행 · 소각분이 돌아오는 곳")],
  lab=dict(readings="측정값", check="확인", reward="보상", pay="호출당 결제", ok="200 OK",
           payment="결제", nft="라이선스 발급", wlbn="보상", amm="교환", burn="소각"),
  foot="wellbian DePIN 기술 사양 v0.3(paper.wellbianlabs.io)을 단순화한 구조도 · 보상은 정해진 개수이며 가치는 약속하지 않습니다.",
 ),
}

CSS = """
@font-face{font-family:"Pretendard";src:url("../../site/event-week/www/fonts/PretendardVariable.woff2") format("woff2");font-weight:100 900}
:root{--deep:#1B1B48;--main:#4D4DCE;--tint:#EEEEFB;--teal:#00A991;--teal-t:#E7F5F1;--ink2:#44445E;--cap:#8A8AA3;--card:#FFFFFF;--bd:#E2E2EE;--bg:#F6F6FA}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1920px;height:1080px}
body{background:var(--bg);color:var(--deep);font-family:"Pretendard",system-ui,sans-serif;position:relative;overflow:hidden}
body::before{content:"";position:absolute;inset:0;background:radial-gradient(900px 500px at 0% 0%,#E9E9FB 0,transparent 60%),radial-gradient(900px 520px at 100% 0%,#E3F4EF 0,transparent 60%)}
.abs{position:absolute}
.logo{left:66px;top:46px}
h1{left:72px;top:112px;font-size:52px;font-weight:800;letter-spacing:-.015em;line-height:1.15}
.sub{left:72px;top:184px;width:1560px;font-size:23px;line-height:1.45;color:var(--ink2);word-break:keep-all}
.lane{top:262px;display:flex;align-items:center;gap:12px;font-size:18px;color:var(--ink2);word-break:keep-all}
.pill{font-size:15px;font-weight:800;letter-spacing:.08em;color:#fff;border-radius:999px;padding:6px 14px}
.lane.s .pill{background:var(--main)} .lane.d .pill{background:var(--teal)}
.card{background:var(--card);border:1.5px solid var(--bd);border-radius:20px;padding:20px 24px;box-shadow:0 10px 24px -18px rgba(27,27,72,.35);display:flex;flex-direction:column;gap:6px;word-break:keep-all}
.card .k{font-size:13px;font-weight:800;letter-spacing:.1em}
.card.s .k{color:var(--main)} .card.d .k{color:var(--teal)}
.card.s{border-top:0;box-shadow:inset 0 4px 0 var(--main),0 10px 24px -18px rgba(27,27,72,.35)}
.card.d{border-top:0;box-shadow:inset 0 4px 0 var(--teal),0 10px 24px -18px rgba(27,27,72,.35)}
.card .t{font-size:27px;font-weight:800;line-height:1.2}
.card .x{font-size:18px;line-height:1.4;color:var(--ink2)}
.card.next{border-style:dashed}
.ops{left:72px;top:704px;width:1776px;height:62px;border-radius:999px;background:var(--deep);color:#fff;display:flex;align-items:center;justify-content:center;font-size:21px;letter-spacing:.01em;word-break:keep-all}
.ops b{margin-right:14px;font-weight:800}
.ledger{left:72px;top:820px;width:1776px;height:196px;border-radius:26px;background:linear-gradient(120deg,rgba(43,199,159,.10),rgba(18,135,245,.10) 62%,rgba(77,77,206,.12));border:1.5px solid #D9DCF1}
.ledger .lt{position:absolute;left:32px;top:16px;font-size:14px;font-weight:800;letter-spacing:.14em;color:var(--main)}
.lc{top:862px;width:404px;height:128px;background:#fff;border:1.5px solid var(--bd);border-radius:18px;padding:22px 26px;display:flex;flex-direction:column;gap:6px;word-break:keep-all}
.lc .t{font-size:25px;font-weight:800} .lc .x{font-size:18px;color:var(--ink2);line-height:1.35}
.foot{left:72px;top:1036px;font-size:15px;color:var(--cap)}
.legend{right:72px;top:70px;display:flex;gap:22px;font-size:16px;color:var(--ink2);align-items:center}
.legend span{display:flex;align-items:center;gap:8px}
.legend i{display:inline-block;width:34px;height:4px;border-radius:2px}
svg.wires{position:absolute;left:0;top:0;width:1920px;height:1080px;overflow:visible}
.lbl{font-size:15px;font-weight:700;fill:var(--ink2)}
"""

# geometry
L = dict(indoor=(72, 304), outdoor=(540, 304), wallet=(72, 500), oracle=(540, 500),
         makers=(984, 304), home=(1452, 304), gateway=(984, 500), products=(1452, 500))
W, H = 396, 136
LC = [104, 540, 976, 1412]

def card(key, side, c, extra=""):
    x, y = L[key]
    k, t, d = c
    return (f'<div class="abs card {side} {extra}" style="left:{x}px;top:{y}px;width:{W}px;height:{H}px">'
            f'<div class="k">{k}</div><div class="t">{t}</div><div class="x">{d}</div></div>')

def wires(lab):
    S, D = "#4D4DCE", "#00A991"
    def arrow(d, col, mk):
        return f'<path d="{d}" fill="none" stroke="{col}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#{mk})"/>'
    def text(x, y, s, anchor="start"):
        return f'<text class="lbl" x="{x}" y="{y}" text-anchor="{anchor}">{s}</text>'
    yb, yt = 304 + H, 500          # row1 bottom 440, row2 top 500
    mid = (yb + yt) // 2           # 470
    r2b = 500 + H                  # 636
    parts = [
        '<defs><marker id="ms" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#4D4DCE"/></marker>'
        '<marker id="md" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#00A991"/></marker></defs>',
        # supply
        arrow(f"M270,{yb} V{yt-6}", S, "ms"),
        arrow(f"M738,{yb} V{mid} H270", S, "ms").replace(' marker-end="url(#ms)"', ''),
        text(284, mid - 8, lab["readings"]),
        arrow(f"M468,{500+H//2} H{540-6}", S, "ms"),
        text(504, 500 + H // 2 - 14, lab["check"], "middle"),
        arrow(f"M738,{r2b} V{704-6}", S, "ms"),
        text(752, r2b + 38, lab["reward"]),
        # demand
        arrow(f"M1182,{yb} V{yt-6}", D, "md"),
        arrow(f"M1650,{yb} V{mid} H1182", D, "md").replace(' marker-end="url(#md)"', ''),
        text(1196, mid - 8, lab["pay"]),
        arrow(f"M1380,{500+H//2} H{1452-6}", D, "md"),
        text(1416, 500 + H // 2 - 14, lab["ok"], "middle"),
        arrow(f"M1182,{r2b} V{704-6}", D, "md"),
        text(1196, r2b + 38, lab["payment"]),
        # ops → ledger cards
    ]
    for (x0, col, mk, key) in ((LC[0], S, "ms", "nft"), (LC[1], S, "ms", "wlbn"), (LC[2], D, "md", "amm"), (LC[3], S, "ms", "burn")):
        cx = x0 + 202
        parts.append(arrow(f"M{cx},766 V{862-6}", col, mk))
        parts.append(text(cx + 14, 818, lab[key]))
    return '<svg class="wires" viewBox="0 0 1920 1080">' + "".join(parts) + "</svg>"

def page(lang):
    t = T[lang]; c = t["cards"]
    cards = "".join([
        card("indoor", "s", c["indoor"]), card("outdoor", "s", c["outdoor"], "next"),
        card("wallet", "s", c["wallet"]), card("oracle", "s", c["oracle"]),
        card("makers", "d", c["makers"]), card("home", "d", c["home"]),
        card("gateway", "d", c["gateway"]), card("products", "d", c["products"]),
    ])
    lcs = "".join(f'<div class="abs lc" style="left:{x}px"><div class="t">{a}</div><div class="x">{b}</div></div>' for x, (a, b) in zip(LC, t["lcards"]))
    return f"""<!doctype html><html lang="{t['lang']}"><head><meta charset="utf-8"><title>wellbian architecture</title><style>{CSS}</style></head><body>
<div class="abs logo">{LOGO}</div>
<div class="abs legend"><span><i style="background:#4D4DCE"></i>{t['sup']}</span><span><i style="background:#00A991"></i>{t['dem']}</span></div>
<h1 class="abs">{t['title']}</h1><p class="abs sub">{t['sub']}</p>
<div class="abs lane s" style="left:72px"><span class="pill">{t['sup']}</span>{t['supd']}</div>
<div class="abs lane d" style="left:984px"><span class="pill">{t['dem']}</span>{t['demd']}</div>
{cards}
<div class="abs ops">{t['ops']}</div>
<div class="abs ledger"><div class="lt">{t['ledger']}</div></div>
{lcs}
{wires(t['lab'])}
<p class="abs foot">{t['foot']}</p>
</body></html>"""

if __name__ == "__main__":
    env = dict(os.environ)
    env["NODE_PATH"] = subprocess.run(["npm", "root", "-g"], capture_output=True, text=True).stdout.strip()
    for lang in ("en", "ko"):
        html = HERE / f"architecture-{lang}.html"
        html.write_text(page(lang), encoding="utf-8")
        png = HERE / f"architecture-{lang}.png"
        subprocess.run(["node", str(HERE / "shot.js"), str(html), str(png), "1920"], check=True, env=env)
        print("built", png.name)
