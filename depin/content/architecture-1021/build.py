"""wellbian 구조 그래픽 v2 (2026-10-21) — 애플 스타일(여백 · 큰 활자 · 회색 타일 · 검정 타일 · 색은 두 단어만).

v1(카드 · 화살표 · 알약 라벨)은 「AI 티가 난다」(서우)로 교체. 근거 · 단순화 내역은 README.
Usage: python3 build.py → architecture-{en,ko}.html · .png(1920×1080 @2x). PNG → JPEG 변환은 README.
"""
import pathlib, re, subprocess, os

HERE = pathlib.Path(__file__).resolve().parent
LOGO = (HERE / "../../site/xrpseoul-raffle-static/www/brand/wellbian-nav.svg").read_text()
LOGO = re.sub(r'fill="(white|#ffffff)"', 'fill="#1D1D1F"', LOGO).replace('width="416" height="151"', 'width="110" height="40"', 1)

T = {
 "en": dict(
  lang="en", h1="One ledger. Two loops.",
  sub="Sensors in real rooms supply verified readings. Manufacturers and AI agents pay per call. Everything settles on the XRP Ledger.",
  tiles=[
   ("supply", "Supply", "Devices earn for verified data.",
    [("Air sensor", "Indoor now. Outdoor next."),
     ("Device wallet", "Holds the device’s license NFT."),
     ("Oracle", "Checks license and quality. Settles once a day.")], "Rewards"),
   ("demand", "Demand", "Buyers pay per call.",
    [("Makers and AI agents", "Pay automatically, call by call."),
     ("x402 gateway", "402. Pay. Verify on-chain. 200."),
     ("Data", "Aggregates now. Cohorts and AI reports next.")], "Payments"),
  ],
  ledger="XRP Ledger",
  ledger_sub="Where both loops settle. An operations wallet pays rewards, receives payments and runs burns.",
  feats=[("License NFT", "XLS-20"), ("WLBN and RLUSD", "Issued assets on trust lines"),
         ("AMM", "WLBN ↔ RLUSD swaps"), ("Issuer", "Issuance. Burns return here.")],
  foot="Simplified from the wellbian DePIN technical specification v0.3. Rewards are fixed quantities; no value is promised.",
 ),
 "ko": dict(
  lang="ko", h1="원장 하나. 순환 둘.",
  sub="실제 방의 측정기가 검증된 측정값을 보내고, 제조사와 AI 에이전트는 호출할 때마다 값을 냅니다. 모두 XRP 원장에서 정산됩니다.",
  tiles=[
   ("supply", "공급", "측정기는 검증된 데이터로 보상받습니다.",
    [("공기질 측정기", "실내는 지금. 실외는 다음."),
     ("기기 지갑", "기기의 라이선스 NFT를 보유합니다."),
     ("오라클", "라이선스와 품질을 확인하고 하루 단위로 정산합니다.")], "보상"),
   ("demand", "수요", "데이터를 쓰는 쪽이 호출마다 냅니다.",
    [("제조사 · AI 에이전트", "호출할 때마다 자동으로 결제합니다."),
     ("x402 게이트웨이", "402. 결제. 온체인 확인. 200."),
     ("데이터", "집계는 지금. 코호트와 AI 리포트는 다음.")], "결제"),
  ],
  ledger="XRP 원장",
  ledger_sub="두 순환이 정산되는 곳. 운영 지갑이 보상 지급, 결제 수취, 소각을 맡습니다.",
  feats=[("라이선스 NFT", "XLS-20"), ("WLBN · RLUSD", "트러스트라인 위 발행 자산"),
         ("AMM", "WLBN ↔ RLUSD 교환"), ("발행 계정", "발행. 소각분이 돌아오는 곳.")],
  foot="wellbian DePIN 기술 사양 v0.3을 단순화한 그림입니다. 보상은 정해진 개수이며 가치는 약속하지 않습니다.",
 ),
}

CSS = """
@font-face{font-family:"Pretendard";src:url("../../site/event-week/www/fonts/PretendardVariable.woff2") format("woff2");font-weight:100 900}
:root{--ink:#1D1D1F;--ink2:#6E6E73;--ink3:#86868B;--tile:#F5F5F7;--line:#D2D2D7;--supply:#4D4DCE;--demand:#00A991}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1920px;height:1080px}
body{background:#fff;color:var(--ink);font-family:"Pretendard",-apple-system,system-ui,sans-serif;padding:0 72px;display:flex;flex-direction:column;align-items:center;justify-content:center;-webkit-font-smoothing:antialiased}
.logo{height:40px}
h1{margin-top:22px;font-size:76px;font-weight:700;letter-spacing:-.025em;line-height:1.05}
.sub{margin-top:18px;max-width:1240px;text-align:center;font-size:25px;line-height:1.45;color:var(--ink2);letter-spacing:-.005em;word-break:keep-all;text-wrap:balance}
.row{margin-top:46px;width:100%;display:grid;grid-template-columns:1fr 1fr;gap:24px}
.tile{background:var(--tile);border-radius:30px;padding:40px 44px 42px;display:flex;flex-direction:column}
.eyebrow{font-size:21px;font-weight:600;letter-spacing:-.005em}
.tile.supply .eyebrow{color:var(--supply)} .tile.demand .eyebrow{color:var(--demand)}
.tile h2{margin-top:6px;font-size:38px;font-weight:700;letter-spacing:-.02em;line-height:1.15;word-break:keep-all}
.steps{margin-top:52px;display:grid;grid-template-columns:1fr auto 1fr auto 1fr;align-items:start;column-gap:18px}
.step b{display:block;font-size:24px;font-weight:600;letter-spacing:-.01em;line-height:1.2;word-break:keep-all}
.step span{display:block;margin-top:8px;font-size:17.5px;line-height:1.45;color:var(--ink2);word-break:keep-all;text-wrap:balance}
.step b{text-wrap:balance}
.chev{font-size:26px;color:#C7C7CC;line-height:1.1;padding-top:1px}
.join{width:100%;display:grid;grid-template-columns:1fr 1fr;gap:24px;height:52px}
.join div{display:flex;justify-content:center;align-items:center;gap:12px;font-size:17px;color:var(--ink3)}
.join i{width:2px;height:52px;display:block}
.join .s i{background:linear-gradient(var(--supply),rgba(77,77,206,.25))}
.join .d i{background:linear-gradient(var(--demand),rgba(0,169,145,.25))}
.ledger{width:100%;background:#1D1D1F;color:#F5F5F7;border-radius:30px;padding:40px 48px;display:grid;grid-template-columns:470px 1fr;column-gap:56px;align-items:center;height:236px}
.ledger h3{font-size:46px;font-weight:700;letter-spacing:-.02em}
.ledger p{margin-top:12px;font-size:19px;line-height:1.5;color:#A1A1A6;word-break:keep-all;text-wrap:balance}
.feats{display:grid;grid-template-columns:repeat(4,1fr);column-gap:28px}
.feat{border-left:1px solid #3A3A3C;padding-left:22px}
.feat b{display:block;font-size:24px;font-weight:600;letter-spacing:-.01em;word-break:keep-all}
.feat span{display:block;margin-top:8px;font-size:17px;line-height:1.45;color:#A1A1A6;word-break:keep-all;text-wrap:balance}
.foot{margin-top:26px;font-size:15px;color:var(--ink3)}
"""

def page(lang):
    t = T[lang]
    tiles, joins = [], []
    for cls, eyebrow, title, steps, flow in t["tiles"]:
        parts = []
        for i, (b, s) in enumerate(steps):
            if i: parts.append('<div class="chev">→</div>')
            parts.append(f'<div class="step"><b>{b}</b><span>{s}</span></div>')
        tiles.append(f'<section class="tile {cls}"><div class="eyebrow">{eyebrow}</div><h2>{title}</h2><div class="steps">{"".join(parts)}</div></section>')
        joins.append(f'<div class="{cls[0]}"><i></i>{flow}</div>')
    feats = "".join(f'<div class="feat"><b>{a}</b><span>{b}</span></div>' for a, b in t["feats"])
    return f"""<!doctype html><html lang="{t['lang']}"><head><meta charset="utf-8"><title>wellbian — {t['h1']}</title><style>{CSS}</style></head><body>
<div class="logo">{LOGO}</div>
<h1>{t['h1']}</h1><p class="sub">{t['sub']}</p>
<div class="row">{"".join(tiles)}</div>
<div class="join">{"".join(joins)}</div>
<div class="ledger"><div><h3>{t['ledger']}</h3><p>{t['ledger_sub']}</p></div><div class="feats">{feats}</div></div>
<p class="foot">{t['foot']}</p>
</body></html>"""

if __name__ == "__main__":
    env = dict(os.environ)
    env["NODE_PATH"] = subprocess.run(["npm", "root", "-g"], capture_output=True, text=True).stdout.strip()
    for lang in ("en", "ko"):
        html = HERE / f"architecture-{lang}.html"
        html.write_text(page(lang), encoding="utf-8")
        subprocess.run(["node", str(HERE / "shot.js"), str(html), str(HERE / f"architecture-{lang}.png"), "1920"], check=True, env=env)
        print("built", lang)
