"""wellbian 구조 그래픽 v3 (2026-10-21) — 보라 포인트 · 플랫 · 엣지 있는 글라스모피즘 + 세부 설명.

v1(카드 · 화살표 그물) → v2(애플 스타일, 서우 「AI 티」) → v3(서우 「세부 설명 자그맣게 · 보라색 포인트 · 플랫하고 엣지 있는 글라스모피즘」).
Usage: python3 build.py → architecture-{en,ko}.html · .png(1920×1080 @2x). PNG → JPEG 변환은 README.
"""
import pathlib, re, subprocess, os

HERE = pathlib.Path(__file__).resolve().parent
LOGO = (HERE / "../../site/xrpseoul-raffle-static/www/brand/wellbian-nav.svg").read_text()
LOGO = LOGO.replace('width="416" height="151"', 'width="110" height="40"', 1)   # 흰 로고 그대로

T = {
 "en": dict(
  lang="en", h1="One ledger. Two loops.",
  sub="Sensors in real rooms supply verified readings. Manufacturers and AI agents pay per call. Everything settles on the XRP Ledger.",
  tiles=[
   ("supply", "Supply", "Devices earn for verified data.", [
     ("Air sensor", "PM · CO₂ · TVOC · temperature · humidity", "Outdoor line next:\nPM · O₃ · NO₂ · SO₂ · CO"),
     ("Device wallet", "Holds the device’s license NFT", "One device, one NFT"),
     ("Oracle", "License → quality → reward", "Settled daily, claimable after 24 hours")], "rewards"),
   ("demand", "Demand", "Buyers pay per call.", [
     ("Makers · AI agents · smart homes", "Pay automatically, call by call", "In RLUSD, a USD stablecoin"),
     ("x402 gateway", "402 → pay → verify on-chain → 200", "No invoices, no human in the loop"),
     ("Data products", "Aggregates · cohorts · AI reports", "De-identified behind a k-anonymity gate. Cohorts and reports next")], "payments"),
  ],
  ops=("Operations wallet", "pays rewards · receives payments · runs burns"),
  ledger="XRP Ledger", ledger_sub="Where both loops settle.",
  feats=[("License NFT", "XLS-20", "Minted by the operations wallet"),
         ("WLBN · RLUSD", "Issued assets", "Held on trust lines"),
         ("AMM", "XLS-30", "WLBN ↔ RLUSD swaps"),
         ("Issuer (cold)", "Issuance", "Burned tokens return here")],
  foot="Simplified from the wellbian DePIN technical specification v0.3 · Rewards are fixed quantities; no value is promised.",
 ),
 "ko": dict(
  lang="ko", h1="원장 하나. 순환 둘.",
  sub="실제 방의 측정기가 검증된 측정값을 보내고, 제조사와 AI 에이전트는 호출할 때마다 값을 냅니다. 모두 XRP 원장에서 정산됩니다.",
  tiles=[
   ("supply", "공급", "측정기는 검증된 데이터로 보상받습니다.", [
     ("공기질 측정기", "PM · CO₂ · TVOC · 온도 · 습도", "실외 라인은 다음:\nPM · O₃ · NO₂ · SO₂ · CO"),
     ("기기 지갑", "기기의 라이선스 NFT 보유", "기기 1대 = NFT 1개"),
     ("오라클", "라이선스 → 품질 → 보상", "하루 단위 정산 · 24시간 뒤 인출 가능")], "보상"),
   ("demand", "수요", "데이터를 쓰는 쪽이 호출마다 냅니다.", [
     ("제조사 · AI 에이전트 · 스마트홈", "호출할 때마다 자동 결제", "달러 스테이블코인 RLUSD로 결제"),
     ("x402 게이트웨이", "402 → 결제 → 온체인 확인 → 200", "청구서도, 사람의 개입도 없음"),
     ("데이터 상품", "집계 · 코호트 · AI 리포트", "비식별 · k-익명성 관문 · 코호트와 리포트는 다음")], "결제"),
  ],
  ops=("운영 지갑", "보상 지급 · 결제 수취 · 소각 실행"),
  ledger="XRP 원장", ledger_sub="두 순환이 정산되는 곳.",
  feats=[("라이선스 NFT", "XLS-20", "운영 지갑이 발급"),
         ("WLBN · RLUSD", "발행 자산", "트러스트라인 위에 보관"),
         ("AMM", "XLS-30", "WLBN ↔ RLUSD 교환"),
         ("발행 계정(콜드)", "발행", "소각분이 돌아오는 곳")],
  foot="wellbian DePIN 기술 사양 v0.3을 단순화한 그림입니다 · 보상은 정해진 개수이며 가치는 약속하지 않습니다.",
 ),
}

CSS = """
@font-face{font-family:"Pretendard";src:url("../../site/event-week/www/fonts/PretendardVariable.woff2") format("woff2");font-weight:100 900}
:root{--bg:#0D0B26;--t1:#F4F3FF;--t2:rgba(226,224,255,.74);--t3:rgba(226,224,255,.50);--p:#4D4DCE;--p1:#A39BFF;--p2:#CDB8FF;
 --glass:rgba(255,255,255,.055);--glass2:rgba(255,255,255,.085);--edge:rgba(255,255,255,.16);--hi:rgba(255,255,255,.32)}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1920px;height:1080px;overflow:hidden}
body{background:var(--bg);color:var(--t1);font-family:"Pretendard",-apple-system,system-ui,sans-serif;padding:0 72px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;overflow:hidden;-webkit-font-smoothing:antialiased}
.bgfx{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.bgfx .g1{position:absolute;width:1100px;height:1100px;left:-260px;top:-520px;border-radius:50%;background:radial-gradient(closest-side,rgba(77,77,206,.75),rgba(77,77,206,0))}
.bgfx .g2{position:absolute;width:1000px;height:1000px;right:-240px;bottom:-560px;border-radius:50%;background:radial-gradient(closest-side,rgba(138,92,255,.60),rgba(138,92,255,0))}
.bgfx .g3{position:absolute;width:760px;height:520px;left:8%;top:34%;border-radius:50%;background:radial-gradient(closest-side,rgba(110,96,255,.42),rgba(110,96,255,0))}
.bgfx .g4{position:absolute;width:760px;height:520px;right:6%;top:30%;border-radius:50%;background:radial-gradient(closest-side,rgba(160,110,255,.36),rgba(160,110,255,0))}
.bgfx .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:48px 48px;mask-image:radial-gradient(ellipse at 50% 40%,#000 30%,transparent 80%)}
.wrap{position:relative;z-index:1;width:100%;display:flex;flex-direction:column;align-items:center}
.logo{height:40px}
h1{margin-top:20px;font-size:76px;font-weight:700;letter-spacing:-.025em;line-height:1.05}
.sub{margin-top:16px;max-width:1180px;text-align:center;font-size:24px;line-height:1.45;color:var(--t2);word-break:keep-all;text-wrap:balance}
.glass{background:linear-gradient(140deg,rgba(255,255,255,.10),rgba(255,255,255,.03) 60%);border:1px solid var(--edge);backdrop-filter:blur(22px) saturate(140%);-webkit-backdrop-filter:blur(22px) saturate(140%);box-shadow:inset 0 1px 0 var(--hi)}
.row{margin-top:40px;width:100%;display:grid;grid-template-columns:1fr 1fr;gap:20px}
/* 햇빛 반사 — 좌상단 테두리에 무지갯빛(테두리만) + 작은 반짝임 */
.glint{position:relative;--gw:440px;--gh:200px}
.ops.glint{--gw:320px;--gh:72px}
.glint::after{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1.5px;pointer-events:none;
 background:radial-gradient(ellipse var(--gw) var(--gh) at 0 0,rgba(255,255,255,.95) 0%,rgba(255,172,222,.90) 10%,rgba(182,152,255,.85) 20%,rgba(122,192,255,.75) 31%,rgba(122,255,202,.55) 43%,rgba(255,228,130,.35) 56%,rgba(255,255,255,0) 72%);
 -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
.glint::before{content:"";position:absolute;left:36px;top:-1px;width:120px;height:34px;transform:translate(-50%,-50%);pointer-events:none;
 background:radial-gradient(circle,#fff 0,rgba(255,255,255,.9) 1.5px,rgba(222,208,255,.45) 6px,rgba(222,208,255,0) 14px),
  linear-gradient(90deg,rgba(255,255,255,0),rgba(150,205,255,.55) 32%,#fff 50%,rgba(255,190,232,.55) 68%,rgba(255,255,255,0)) center/120px 1.5px no-repeat,
  linear-gradient(rgba(255,255,255,0),rgba(255,255,255,.8) 50%,rgba(255,255,255,0)) center/1.5px 34px no-repeat}
.ops.glint::before{transform:translate(-50%,-50%) scale(.75)}
.tile{border-radius:16px;padding:32px 36px 34px;position:relative}
.tile.supply{--acc:var(--p1)} .tile.demand{--acc:var(--p2)}
.eyebrow{display:inline-block;font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--acc);border:1px solid var(--acc);border-radius:6px;padding:4px 9px;background:rgba(163,155,255,.10)}
.tile h2{margin-top:14px;font-size:34px;font-weight:700;letter-spacing:-.02em;line-height:1.15;word-break:keep-all}
.steps{margin-top:28px;display:grid;grid-template-columns:1fr auto 1fr auto 1fr;column-gap:14px;align-items:start}
.step{border-top:1px solid rgba(255,255,255,.14);padding-top:16px;position:relative}
.step::before{content:"";position:absolute;left:0;top:-1px;width:22px;height:2px;background:var(--acc)}
.step b{display:block;font-size:22px;font-weight:600;letter-spacing:-.01em;line-height:1.2;word-break:keep-all;text-wrap:balance}
.step .d{display:block;margin-top:10px;font-size:17px;line-height:1.4;color:var(--t2);word-break:keep-all;text-wrap:balance}
.step .n{display:block;margin-top:7px;font-size:14.5px;line-height:1.4;color:var(--t3);word-break:keep-all;text-wrap:balance}
.chev{font-size:22px;color:var(--acc);padding-top:18px}
.join{width:100%;display:grid;grid-template-columns:1fr 1fr;gap:20px;height:34px}
.join div{display:flex;justify-content:center;align-items:center;gap:10px;font-size:14px;letter-spacing:.04em;color:var(--t3)}
.join i{width:1px;height:34px;display:block}
.join .s i{background:var(--p1)} .join .d i{background:var(--p2)}
.ops{width:100%;height:60px;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:16px;font-size:20px;color:var(--t2);background:rgba(77,77,206,.20);border:1px solid rgba(163,155,255,.38);box-shadow:inset 0 1px 0 rgba(255,255,255,.22)}
.ops b{color:var(--t1);font-weight:700}
.ops .dot{width:6px;height:6px;border-radius:50%;background:var(--p1)}
.join2{width:100%;display:grid;grid-template-columns:repeat(4,1fr);gap:0;height:26px;padding:0 36px}
.join2 i{justify-self:center;width:1px;height:26px;background:rgba(163,155,255,.55)}
.ledger{width:100%;border-radius:16px;padding:32px 36px;display:grid;grid-template-columns:360px 1fr;column-gap:40px;align-items:center;background:var(--glass2)}
.ledger h3{font-size:44px;font-weight:700;letter-spacing:-.02em}
.ledger p{margin-top:8px;font-size:18px;color:var(--t2)}
.feats{display:grid;grid-template-columns:repeat(4,1fr);column-gap:16px}
.feat{border-left:1px solid rgba(255,255,255,.14);padding-left:18px}
.feat b{display:block;font-size:22px;font-weight:600;letter-spacing:-.01em;word-break:keep-all}
.feat .tag{display:inline-block;margin-top:9px;font-size:13px;font-weight:700;letter-spacing:.06em;color:var(--p1);border:1px solid rgba(163,155,255,.45);border-radius:6px;padding:2px 7px}
.feat .n{display:block;margin-top:9px;font-size:15.5px;line-height:1.4;color:var(--t2);word-break:keep-all}
.nw{white-space:nowrap}
.foot{margin-top:22px;font-size:14px;color:var(--t3)}
"""

def nw(text):
    """「 · 」로 끊은 덩어리는 한 줄에 — 줄바꿈은 구분점 뒤에서만. \n 은 강제 줄바꿈."""
    if "\n" in text:
        return "<br>".join(nw(line) for line in text.split("\n"))
    parts = text.split(" · ")
    if len(parts) == 1:
        return text
    return " ".join(f'<span class="nw">{p}{" ·" if i < len(parts) - 1 else ""}</span>' for i, p in enumerate(parts))

def page(lang):
    t = T[lang]
    tiles, joins = [], []
    for cls, eyebrow, title, steps, flow in t["tiles"]:
        parts = []
        for i, (b, d, n) in enumerate(steps):
            if i: parts.append('<div class="chev">→</div>')
            parts.append(f'<div class="step"><b>{nw(b)}</b><span class="d">{nw(d)}</span><span class="n">{nw(n)}</span></div>')
        tiles.append(f'<section class="tile glass glint {cls}"><div class="eyebrow">{eyebrow}</div><h2>{title}</h2><div class="steps">{"".join(parts)}</div></section>')
        joins.append(f'<div class="{cls[0]}"><i></i>{flow}</div>')
    feats = "".join(f'<div class="feat"><b>{a}</b><span class="tag">{b}</span><span class="n">{c}</span></div>' for a, b, c in t["feats"])
    ops_name, ops_desc = t["ops"]
    return f"""<!doctype html><html lang="{t['lang']}"><head><meta charset="utf-8"><title>wellbian — {t['h1']}</title><style>{CSS}</style></head><body>
<div class="bgfx"><div class="g1"></div><div class="g2"></div><div class="g3"></div><div class="g4"></div><div class="grid"></div></div>
<div class="wrap">
<div class="logo">{LOGO}</div>
<h1>{t['h1']}</h1><p class="sub">{t['sub']}</p>
<div class="row">{"".join(tiles)}</div>
<div class="join">{"".join(joins)}</div>
<div class="ops glint"><span class="dot"></span><b>{ops_name}</b>{ops_desc}</div>
<div class="join2"><i></i><i></i><i></i><i></i></div>
<div class="ledger glass glint"><div><h3>{t['ledger']}</h3><p>{t['ledger_sub']}</p></div><div class="feats">{feats}</div></div>
<p class="foot">{t['foot']}</p>
</div></body></html>"""

if __name__ == "__main__":
    env = dict(os.environ)
    env["NODE_PATH"] = subprocess.run(["npm", "root", "-g"], capture_output=True, text=True).stdout.strip()
    for lang in ("en", "ko"):
        html = HERE / f"architecture-{lang}.html"
        html.write_text(page(lang), encoding="utf-8")
        subprocess.run(["node", str(HERE / "shot.js"), str(html), str(HERE / f"architecture-{lang}.png"), "1920"], check=True, env=env)
        print("built", lang)
