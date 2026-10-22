"""wellbian 구조 그래픽 v3 (2026-10-21) — 보라 포인트 · 플랫 · 엣지 있는 글라스모피즘 + 세부 설명.

v1(카드 · 화살표 그물) → v2(애플 스타일, 서우 「AI 티」) → v3(서우 「세부 설명 자그맣게 · 보라색 포인트 · 플랫하고 엣지 있는 글라스모피즘」).
Usage: python3 build.py [en|ko|en-9x16|ko-9x16 …] → architecture-<인자>.html · .png(가로 1920×1080 · 세로 1080×1920, @2x). PNG → JPEG 변환은 README.
"""
import pathlib, re, subprocess, os, sys

HERE = pathlib.Path(__file__).resolve().parent
LOGO = (HERE / "../../site/xrpseoul-raffle-static/www/brand/wellbian-nav.svg").read_text()
LOGO = LOGO.replace('width="416" height="151"', 'width="165" height="60"', 1)   # 흰 로고 그대로

T = {
 "en": dict(
  lang="en", h1="Every room is data. Every call is revenue.",
  sub="Each new room adds verified air data to sell. Manufacturers, AI agents and smart homes pay for every call in RLUSD, a dollar stablecoin, settled on the XRP Ledger.",
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
  lang="ko", h1="방마다 데이터. 호출마다 매출.",
  sub="방이 늘수록 팔 수 있는 검증 데이터가 늘고, 제조사 · AI 에이전트 · 스마트홈은 호출할 때마다 달러 스테이블코인 RLUSD로 값을 냅니다. 정산은 XRP 원장에서.",
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
.logo{height:60px}
h1{margin-top:18px;font-size:70px;font-weight:700;letter-spacing:-.025em;line-height:1.05}
.sub{margin-top:16px;max-width:1180px;text-align:center;font-size:24px;line-height:1.45;color:var(--t2);word-break:keep-all;text-wrap:balance}
.glass{background:linear-gradient(140deg,rgba(255,255,255,.10),rgba(255,255,255,.03) 60%);border:1px solid var(--edge);backdrop-filter:blur(22px) saturate(140%);-webkit-backdrop-filter:blur(22px) saturate(140%);box-shadow:inset 0 1px 0 var(--hi)}
.row{margin-top:40px;width:100%;display:grid;grid-template-columns:1fr 1fr;gap:20px}
/* 햇빛 반사 — 좌상단 테두리 선(1px) 위에만 무지갯빛. 반짝임 · 번짐 없음(10/21 서우 「빛나는 효과 없애고 테두리에 맞춰」). */
.glint{position:relative;--gw:260px;--gh:140px}
.ops.glint{--gw:180px;--gh:52px}
.glint::after{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1px;pointer-events:none;
 background:radial-gradient(ellipse var(--gw) var(--gh) at 0 0,rgba(255,255,255,.85) 0%,rgba(255,172,222,.85) 12%,rgba(182,152,255,.80) 28%,rgba(122,192,255,.70) 44%,rgba(122,255,202,.45) 60%,rgba(255,255,255,0) 78%);
 -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
.tile{border-radius:16px;padding:32px 36px 34px;position:relative}
.tile.supply{--acc:var(--p1)} .tile.demand{--acc:var(--p2)}
.eyebrow{display:inline-block;font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--acc);border:1px solid var(--acc);border-radius:6px;padding:4px 9px;background:rgba(163,155,255,.10)}
.tile h2{margin-top:14px;font-size:34px;font-weight:700;letter-spacing:-.02em;line-height:1.15;word-break:keep-all}
.steps{margin-top:30px;display:grid;grid-template-columns:1fr auto 1fr auto 1fr;column-gap:14px;align-items:start}
.step{position:relative}
/* 아이콘 칸 — 유리(사선 채움 · 위 하이라이트 · 블러) + 좌상단 테두리에 아주 옅은 무지갯빛 · 선 1.9(10/21 서우 「약간 도톰하게 · 유리 질감 · 아주 약간의 무지갯빛」) */
.ico,.ico-s{position:relative;display:grid;place-items:center;color:var(--acc);background:linear-gradient(145deg,rgba(255,255,255,.17),rgba(255,255,255,.04) 52%,rgba(163,155,255,.10)),linear-gradient(120deg,rgba(255,176,226,.07),rgba(150,200,255,.06) 40%,rgba(255,255,255,0) 70%);border:1px solid rgba(255,255,255,.20);box-shadow:inset 0 1px 0 rgba(255,255,255,.38),inset 0 -1px 0 rgba(13,11,38,.25);backdrop-filter:blur(12px) saturate(150%);-webkit-backdrop-filter:blur(12px) saturate(150%)}
.ico::after,.ico-s::after{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1px;pointer-events:none;background:radial-gradient(ellipse 80% 70% at 0 0,rgba(255,255,255,.75),rgba(255,170,224,.65) 22%,rgba(182,152,255,.55) 42%,rgba(120,200,255,.45) 60%,rgba(140,255,210,.2) 74%,rgba(255,255,255,0) 86%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
.ico svg,.ico-s svg{fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 6px rgba(163,155,255,.25))}
.ico{width:68px;height:68px;margin-bottom:20px;border-radius:14px}
.ico svg{width:36px;height:36px}
.step b{display:block;font-size:22px;font-weight:600;letter-spacing:-.01em;line-height:1.2;word-break:keep-all;text-wrap:balance}
.step .d{display:block;margin-top:10px;font-size:17px;line-height:1.4;color:var(--t2);word-break:keep-all;text-wrap:balance}
.step .n{display:block;margin-top:7px;font-size:14.5px;line-height:1.4;color:var(--t3);word-break:keep-all;text-wrap:balance}
.chev{color:var(--acc);padding-top:22px}
.chev svg{width:24px;height:24px;display:block;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.step:not(:last-child)::after{content:"";position:absolute;left:82px;right:-14px;top:34px;height:1px;background:linear-gradient(90deg,rgba(163,155,255,.15),var(--acc))}
.join{width:100%;display:grid;grid-template-columns:1fr 1fr;gap:20px;height:34px}
.join div{display:flex;justify-content:center;align-items:center;gap:10px;font-size:14px;letter-spacing:.04em;color:var(--t3)}
.join i{width:1px;height:34px;display:block}
.join .s i{background:var(--p1)} .join .d i{background:var(--p2)}
.ops{width:100%;height:60px;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:16px;font-size:20px;color:var(--t2);background:rgba(77,77,206,.20);border:1px solid rgba(163,155,255,.38);box-shadow:inset 0 1px 0 rgba(255,255,255,.22)}
.ops b{color:var(--t1);font-weight:700}
.ops .ico-s{width:40px;height:40px;border-radius:10px;color:var(--p1)}
.ops .ico-s svg{width:24px;height:24px}
.join2{width:100%;display:grid;grid-template-columns:repeat(4,1fr);gap:0;height:26px;padding:0 36px}
.join2 i{justify-self:center;width:1px;height:26px;background:rgba(163,155,255,.55)}
.ledger{width:100%;border-radius:16px;padding:32px 36px;display:grid;grid-template-columns:360px 1fr;column-gap:40px;align-items:center;background:var(--glass2)}
.ledger h3{font-size:44px;font-weight:700;letter-spacing:-.02em}
.ledger p{margin-top:8px;font-size:18px;color:var(--t2)}
.feats{display:grid;grid-template-columns:repeat(4,1fr);column-gap:16px}
.feat{display:grid;grid-template-columns:56px 1fr;column-gap:14px;align-items:start}
.feat .ico{width:56px;height:56px;margin:0;border-radius:12px;color:var(--p1)}
.feat .ico svg{width:30px;height:30px}
.feat b{display:block;margin-top:2px;font-size:21px;font-weight:600;letter-spacing:-.01em;word-break:keep-all}
.feat .tag{display:inline-block;margin-top:9px;font-size:13px;font-weight:700;letter-spacing:.06em;color:var(--p1);border:1px solid rgba(163,155,255,.45);border-radius:6px;padding:2px 7px}
.feat .n{display:block;margin-top:9px;font-size:15.5px;line-height:1.4;color:var(--t2);word-break:keep-all}
.nw{white-space:nowrap}
.foot{margin-top:22px;font-size:14px;color:var(--t3)}
"""

# 라인 아이콘(24 그리드 · 선 1.6 · 끝 둥글게) — 10/21 서우 「라인 svg 아이콘을 넣어 재제작 · 너무 텍스트 위주」
ICON = {
 "sensor":  '<rect x="5" y="3" width="10" height="18" rx="2.5"/><circle cx="10" cy="15.5" r="2"/><path d="M8 7.5h4"/><path d="M18 9.5c1 .8 1 2.2 0 3"/><path d="M20.5 7.5c2 1.7 2 5.3 0 7"/>',
 "wallet":  '<path d="M4 8V7a2.5 2.5 0 0 1 2.5-2.5H17V8"/><rect x="4" y="8" width="16" height="11.5" rx="2.5"/><path d="M15.5 13.75h2"/>',
 "oracle":  '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
 "buyers":  '<path d="M3.5 11L12 4l8.5 7"/><path d="M6 9.5v10h12v-10"/><rect x="9.5" y="12.5" width="5" height="5" rx="1"/><path d="M12 10.5v2M12 17.5v2"/>',
 "gateway": '<path d="M5 20V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14"/><path d="M3 20h18"/><path d="M8.5 12h7"/><path d="M13 9.5l2.5 2.5-2.5 2.5"/>',
 "layers":  '<path d="M12 3.5l8.5 4.5-8.5 4.5L3.5 8z"/><path d="M3.5 12l8.5 4.5 8.5-4.5"/><path d="M3.5 16l8.5 4.5 8.5-4.5"/>',
 "vault":   '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="12" cy="12" r="3.5"/><path d="M12 7v1.5M12 15.5V17M7 12h1.5M15.5 12H17"/>',
 "nft":     '<path d="M12 2.8l7.8 4.5v9.4L12 21.2l-7.8-4.5V7.3z"/><path d="M9 10.5h6M9 13.5h4"/>',
 "coins":   '<circle cx="9.5" cy="9.5" r="5.5"/><path d="M15.4 9.6a5.5 5.5 0 1 1-5.8 5.8"/>',
 "swap":    '<path d="M4 8h15"/><path d="M15.5 4.5L19 8l-3.5 3.5"/><path d="M20 16H5"/><path d="M8.5 12.5L5 16l3.5 3.5"/>',
 "cold":    '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/><path d="M9.5 4.6L12 6.6l2.5-2M9.5 19.4L12 17.4l2.5 2"/>',
}
STEP_ICONS = {"supply": ["sensor", "wallet", "oracle"], "demand": ["buyers", "gateway", "layers"]}
FEAT_ICONS = ["nft", "coins", "swap", "cold"]

def ico(name, cls="ico"):
    return f'<span class="{cls}"><svg viewBox="0 0 24 24" aria-hidden="true">{ICON[name]}</svg></span>'

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
            if i: parts.append('<div class="chev"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M0 12h21M16 7l5 5-5 5"/></svg></div>')
            parts.append(f'<div class="step">{ico(STEP_ICONS[cls][i])}<b>{nw(b)}</b><span class="d">{nw(d)}</span><span class="n">{nw(n)}</span></div>')
        tiles.append(f'<section class="tile glass glint {cls}"><div class="eyebrow">{eyebrow}</div><h2>{title}</h2><div class="steps">{"".join(parts)}</div></section>')
        joins.append(f'<div class="{cls[0]}"><i></i>{flow}</div>')
    feats = "".join(f'<div class="feat">{ico(FEAT_ICONS[i])}<div><b>{a}</b><span class="tag">{b}</span><span class="n">{c}</span></div></div>' for i, (a, b, c) in enumerate(t["feats"]))
    ops_name, ops_desc = t["ops"]
    return f"""<!doctype html><html lang="{t['lang']}"><head><meta charset="utf-8"><title>wellbian — {t['h1']}</title><style>{CSS}</style></head><body>
<div class="bgfx"><div class="g1"></div><div class="g2"></div><div class="g3"></div><div class="g4"></div><div class="grid"></div></div>
<div class="wrap">
<div class="logo">{LOGO}</div>
<h1>{t['h1']}</h1><p class="sub">{t['sub']}</p>
<div class="row">{"".join(tiles)}</div>
<div class="join">{"".join(joins)}</div>
<div class="ops glint">{ico("vault", "ico-s")}<b>{ops_name}</b>{ops_desc}</div>
<div class="join2"><i></i><i></i><i></i><i></i></div>
<div class="ledger glass glint"><div><h3>{t['ledger']}</h3><p>{t['ledger_sub']}</p></div><div class="feats">{feats}</div></div>
<p class="foot">{t['foot']}</p>
</div></body></html>"""


# 세로 9:16(1080×1920) — 10/21 서우 「9:16 세로형으로, 모바일에서 잘 보이게」. 같은 문구(T)를 세로로 쌓는다:
# 머리 → 공급 → 수요 → 보상 · 결제 → 운영 지갑 → 원장(2×2). 글자는 가로판의 약 1.4배.
VCSS = """
html,body{width:1080px;height:1920px}
body{padding:0 44px;justify-content:center}
.bgfx .g1{width:900px;height:900px;left:-300px;top:-380px}
.bgfx .g2{width:900px;height:900px;right:-320px;bottom:-360px}
.bgfx .g3{width:700px;height:600px;left:-160px;top:30%}
.bgfx .g4{width:700px;height:600px;right:-200px;top:52%}
.logo{height:52px}
.logo svg{width:143px;height:52px}
h1{margin-top:16px;font-size:74px;line-height:1.04;text-align:center;letter-spacing:-.03em}
.sub{margin-top:14px;max-width:960px;font-size:26px;line-height:1.4}
.vtile{width:100%;margin-top:24px;border-radius:18px;padding:24px 32px 26px}
.vtile + .vtile{margin-top:14px}
.vtile.supply{--acc:var(--p1)} .vtile.demand{--acc:var(--p2)}
.vtile .eyebrow{font-size:16px;padding:4px 10px}
.vtile h2{margin-top:10px;font-size:38px}
.vsteps{margin-top:18px;display:flex;flex-direction:column}
.vstep{position:relative;display:grid;grid-template-columns:72px 1fr;column-gap:22px;align-items:start;padding-bottom:16px}
.vstep:last-child{padding-bottom:0}
.vstep .ico{width:72px;height:72px;margin:0;border-radius:15px}
.vstep .ico svg{width:38px;height:38px}
.vstep:not(:last-child)::after{content:"";position:absolute;left:35px;top:80px;bottom:6px;width:2px;background:linear-gradient(180deg,rgba(163,155,255,.35),var(--acc))}
.vstep:not(:last-child)::before{content:"";position:absolute;left:30px;bottom:7px;width:10px;height:10px;border-right:2px solid var(--acc);border-bottom:2px solid var(--acc);transform:rotate(45deg)}
.vstep b{display:block;margin-top:2px;font-size:31px;font-weight:600;letter-spacing:-.01em;line-height:1.18;word-break:keep-all}
.vstep .d{display:block;margin-top:6px;font-size:24.5px;line-height:1.36;color:var(--t2);word-break:keep-all}
.vstep .n{display:block;margin-top:4px;font-size:20.5px;line-height:1.36;color:var(--t3);word-break:keep-all}
.join{height:28px;margin-top:0}
.join div{font-size:19px}
.join i{height:28px}
.ops{height:auto;min-height:74px;padding:12px 20px;font-size:23px;gap:14px;border-radius:14px}
.ops b{font-size:25px}
.ops .ico-s{width:46px;height:46px;border-radius:11px}
.ops .ico-s svg{width:26px;height:26px}
.join2{grid-template-columns:repeat(2,1fr);height:18px;padding:0 120px}
.join2 i{height:18px}
.vledger{width:100%;border-radius:18px;padding:22px 30px 24px;background:var(--glass2)}
.vledger .hd{display:flex;align-items:baseline;gap:18px;flex-wrap:wrap}
.vledger h3{font-size:46px;font-weight:700;letter-spacing:-.02em}
.vledger p{font-size:24px;color:var(--t2)}
.vfeats{margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:18px 22px}
.vfeats .feat{grid-template-columns:58px 1fr}
.vfeats .feat .ico{width:58px;height:58px}
.vfeats .feat .ico svg{width:31px;height:31px}
.vfeats .feat b{display:inline;font-size:26px;margin-top:0}
.vfeats .feat .tag{font-size:15px;margin:0 0 0 10px;vertical-align:4px}
.vfeats .feat .n{font-size:21px;margin-top:6px;line-height:1.35}
.foot{margin-top:14px;max-width:960px;text-align:center;font-size:18px;line-height:1.45;text-wrap:balance}
"""


# 세로판 하늘 · 에칭 · 건물(10/22 서우 「앞 연재 2개도 위 구름과 해는 동일, 아이콘 · 하단부는 다른 이미지로 — 세로만」).
# 하늘은 3편(../ai-factory-1021)과 같은 그림, 아이콘은 에칭 선화, 오른쪽 아래는 이 편의 건물(아파트 — 「방마다 데이터」, 원장 칸 유리 뒤 배경층).
SKY_V = """
.bgfx .paint{position:absolute;inset:0;background:url("../ai-factory-1021/assets/light-9x16.jpg") center top/cover no-repeat;opacity:.66}
.bgfx .paintfade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(13,11,38,0) 0%,rgba(13,11,38,.10) 14%,rgba(13,11,38,.55) 22%,rgba(13,11,38,.88) 30%,#0D0B26 40%)}
.logo,h1,.sub{text-shadow:0 2px 22px rgba(13,11,38,.55)}
.logo svg{filter:drop-shadow(0 2px 14px rgba(13,11,38,.5))}
.sub{color:rgba(244,243,255,.9)}
.ill{position:absolute;top:16px;right:24px;width:150px;height:150px;pointer-events:none}
.ill img{width:100%;height:100%;object-fit:contain;display:block;opacity:.38;filter:drop-shadow(0 0 4px rgba(163,155,255,.16))}
.fg{position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden}
.bgfx .bld{position:absolute;right:-10px;bottom:-14px;width:300px;height:380px;border-radius:0;background:url("assets/apartment.png") center bottom/contain no-repeat;filter:brightness(.7) saturate(.85) contrast(.96);opacity:.62;-webkit-mask-image:linear-gradient(0deg,transparent 0%,#000 14%);mask-image:linear-gradient(0deg,transparent 0%,#000 14%)}
.bgfx .bldhaze{position:absolute;right:-120px;bottom:-110px;width:560px;height:380px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,196,120,.10),rgba(163,120,255,.06) 55%,rgba(163,120,255,0))}
body{padding:30px 44px 0;justify-content:flex-start}
.foot{align-self:flex-start;text-align:left;max-width:640px;margin-left:6px;text-shadow:0 0 6px #0D0B26,0 0 14px #0D0B26}
"""
V_ILL = {"supply": "etch-supply", "demand": "etch-demand"}  # 원장 칸은 2×2 항목과 겹쳐서 아이콘 없음(etch-ledger.png 는 남겨 둠)

def ill_v(name):
    return f'<div class="ill"><img src="assets/{V_ILL[name]}.png" alt=""></div>'

def page_v(lang):
    t = T[lang]
    tiles, joins = [], []
    for cls, eyebrow, title, steps, flow in t["tiles"]:
        rows = "".join(f'<div class="vstep">{ico(STEP_ICONS[cls][i])}<div><b>{nw(b)}</b><span class="d">{nw(d)}</span><span class="n">{nw(n.replace(chr(10), chr(32)))}</span></div></div>' for i, (b, d, n) in enumerate(steps))
        tiles.append(f'<section class="vtile glass glint {cls}">{ill_v(cls)}<div class="eyebrow">{eyebrow}</div><h2>{title}</h2><div class="vsteps">{rows}</div></section>')
        joins.append(f'<div class="{cls[0]}"><i></i>{flow}</div>')
    feats = "".join(f'<div class="feat">{ico(FEAT_ICONS[i])}<div><b>{a}</b><span class="tag">{b}</span><span class="n">{c}</span></div></div>' for i, (a, b, c) in enumerate(t["feats"]))
    ops_name, ops_desc = t["ops"]
    h1 = t["h1"].replace(". ", ".<br>", 1)
    return f"""<!doctype html><html lang="{t['lang']}"><head><meta charset="utf-8"><title>wellbian — {t['h1']}</title><style>{CSS}{VCSS}{SKY_V}</style></head><body>
<div class="bgfx"><div class="paint"></div><div class="paintfade"></div><div class="g1"></div><div class="g2"></div><div class="g3"></div><div class="g4"></div><div class="grid"></div><div class="bldhaze"></div><div class="bld"></div></div>
<div class="wrap">
<div class="logo">{LOGO}</div>
<h1>{h1}</h1><p class="sub">{t['sub']}</p>
{"".join(tiles)}
<div class="join">{"".join(joins)}</div>
<div class="ops glint">{ico("vault", "ico-s")}<b>{ops_name}</b><span class="nw">{ops_desc}</span></div>
<div class="join2"><i></i><i></i></div>
<div class="vledger glass glint"><div class="hd"><h3>{t['ledger']}</h3><p>{t['ledger_sub']}</p></div><div class="vfeats">{feats}</div></div>
<p class="foot">{nw(t['foot'])}</p>
</div></body></html>"""

if __name__ == "__main__":
    env = dict(os.environ)
    env["NODE_PATH"] = subprocess.run(["npm", "root", "-g"], capture_output=True, text=True).stdout.strip()
    for arg in (sys.argv[1:] or ("en", "ko")):
        lang, _, fmt = arg.partition("-")          # en · ko · en-9x16 · ko-9x16
        name = f"architecture-{arg}"
        html = HERE / f"{name}.html"
        html.write_text(page_v(lang) if fmt == "9x16" else page(lang), encoding="utf-8")
        subprocess.run(["node", str(HERE / "shot.js"), str(html), str(HERE / f"{name}.png"), "1080" if fmt == "9x16" else "1920"], check=True, env=env)
        print("built", arg)
