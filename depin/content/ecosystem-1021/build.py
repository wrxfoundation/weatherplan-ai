"""wellbian 백서 Fig 0 — 3주체 선순환 구조 그래픽 (2026-10-21).

서우 「아래 내용도 동일한 톤앤매너로」 — 구조 그래픽 v3(`../architecture-1021/`)와 같은 바탕 · 유리 타일 · 보라 포인트 · 모서리 반짝임.
Usage: python3 build.py [en|ko …] → ecosystem-{ko,en}.html · .png(1920×1080 @2x). PNG → JPEG 변환은 README.
"""
import pathlib, subprocess, os, sys

HERE = pathlib.Path(__file__).resolve().parent
LOGO = (HERE / "../../site/xrpseoul-raffle-static/www/brand/wellbian-nav.svg").read_text()
LOGO = LOGO.replace('width="416" height="151"', 'width="165" height="60"', 1)

T = {
 "ko": dict(
  lang="ko", kicker="백서 · Fig 0 · 사업 모델", h1="방은 데이터를 만들고, 제조사는 값을 냅니다.",
  sub="기여자의 측정기가 실내 공기 원시 측정값을 만들고, 허브가 이를 비식별 메타데이터로 가공해 가전 제조사에 판매하거나 구독형 API로 제공합니다.",
  tiles=[
   ("provider", "Data Provider", "데이터 기여자",
    ["가정 · 사무실 · 상업시설", "IAQ 측정 IoT 디바이스 설치", "기여도 기반 리워드 획득"],
    "실시간 환경 데이터를 제공하고 기여도에 따라 보상을 받습니다. 실외(OAQ) 측정기(옥상 · 가로변 · 학교)는 다음 라인.",
    ["자격 증명 → XLS-20 라이선스 NFT"]),
   ("hub", "Platform Hub", "플랫폼 허브",
    ["원시 데이터 온체인 무결성 보장", "개인정보 비식별화 처리", "메타데이터 가공 · 품질 평가", "XRPL + 클라우드 인프라"],
    "원시 데이터를 위변조 없이 저장하고, 비식별화한 뒤 제조사가 쓸 수 있는 메타데이터로 가공합니다.",
    ["무결성 → 오라클 배치 머클루트", "비식별화 → 5단계 파이프라인"]),
   ("consumer", "Data Consumer", "가전 제조사",
    ["에어컨 · 제습기 · 공기청정기", "환기 시스템 · 스마트홈 플랫폼", "구매 또는 구독형 API"],
    "정제된 데이터를 구매하거나 구독형 API로 받아 R&D · 마케팅에 활용합니다.",
    ["과금 → x402 데이터 상품"]),
  ],
  lanes=[("원시 측정값", "기여 보상", ""), ("정제 메타데이터", "데이터 이용료", "매출")],
  tech="기술 대응",
  loop="보상은 가전 구매 할인 · 필터 구독 결제로 다시 쓰여, 가치가 생태계 안에 머뭅니다.",
  legend=("데이터 흐름", "가치 흐름"),
  foot="Fig 0. 3주체 선순환 구조 · wellbian 백서 · 기술 대응 상세 paper.wellbianlabs.io/depin · 보상은 정해진 개수이며 가치는 약속하지 않습니다.",
 ),
 "en": dict(
  lang="en", kicker="Whitepaper · Fig 0 · Business model", h1="Rooms make data. Makers pay for it.",
  sub="Contributors’ sensors produce raw indoor-air readings. The hub turns them into de‑identified metadata that appliance makers buy outright or subscribe to by API.",
  tiles=[
   ("provider", "Data Provider", "Data contributors",
    ["Homes · offices · commercial spaces", "Indoor-air (IAQ) IoT sensors installed", "Rewards by contribution"],
    "Supply real-time environmental data and earn rewards by contribution. Outdoor (OAQ) sensors for rooftops, roadsides and schools are the next line.",
    ["Credentials → XLS-20 license NFT"]),
   ("hub", "Platform Hub", "Platform hub",
    ["On-chain integrity for raw data", "Personal data de-identified", "Metadata processing · quality scoring", "XRPL + cloud infrastructure"],
    "Stores raw data tamper-free, de-identifies it, then turns it into metadata manufacturers can use.",
    ["Integrity → oracle batch Merkle root", "De-identification → 5-step pipeline"]),
   ("consumer", "Data Consumer", "Appliance makers",
    ["Air conditioners · dehumidifiers · air purifiers", "Ventilation · smart-home platforms", "Purchase or subscription API"],
    "Buy refined data or subscribe by API, for R&D and marketing.",
    ["Billing → x402 data products"]),
  ],
  lanes=[("Raw readings", "Contribution rewards", ""), ("Refined metadata", "Data fees", "Revenue")],
  tech="Built on",
  loop="Rewards are spent back on appliance discounts and filter subscriptions, so the value stays inside the ecosystem.",
  legend=("Data flow", "Value flow"),
  foot="Fig 0. Three-party loop · wellbian whitepaper · Technical detail at paper.wellbianlabs.io/depin · Rewards are fixed quantities; no value is promised.",
 ),
}

CSS = """
@font-face{font-family:"Pretendard";src:url("../../site/event-week/www/fonts/PretendardVariable.woff2") format("woff2");font-weight:100 900}
:root{--bg:#0D0B26;--t1:#F4F3FF;--t2:rgba(226,224,255,.74);--t3:rgba(226,224,255,.50);--p:#4D4DCE;--p1:#A39BFF;--p2:#CDB8FF;--p3:#E2DCFF;
 --edge:rgba(255,255,255,.16);--hi:rgba(255,255,255,.32)}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1920px;height:1080px;overflow:hidden}
body{background:var(--bg);color:var(--t1);font-family:"Pretendard",-apple-system,system-ui,sans-serif;padding:0 72px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;-webkit-font-smoothing:antialiased}
.bgfx{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.bgfx div{position:absolute;border-radius:50%}
.bgfx .g1{width:1100px;height:1100px;left:-260px;top:-520px;background:radial-gradient(closest-side,rgba(77,77,206,.75),rgba(77,77,206,0))}
.bgfx .g2{width:1000px;height:1000px;right:-240px;bottom:-560px;background:radial-gradient(closest-side,rgba(138,92,255,.60),rgba(138,92,255,0))}
.bgfx .g3{width:640px;height:560px;left:2%;top:36%;background:radial-gradient(closest-side,rgba(110,96,255,.40),rgba(110,96,255,0))}
.bgfx .g4{width:700px;height:600px;left:32%;top:32%;background:radial-gradient(closest-side,rgba(140,110,255,.38),rgba(140,110,255,0))}
.bgfx .g5{width:640px;height:560px;right:1%;top:34%;background:radial-gradient(closest-side,rgba(165,115,255,.34),rgba(165,115,255,0))}
.bgfx .grid{inset:0;border-radius:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:48px 48px;mask-image:radial-gradient(ellipse at 50% 40%,#000 30%,transparent 80%)}
.wrap{position:relative;z-index:1;width:100%;display:flex;flex-direction:column;align-items:center}
.logo{height:60px}
.kicker{margin-top:22px;font-size:14px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--p1);border:1px solid rgba(163,155,255,.6);border-radius:6px;padding:5px 11px;background:rgba(163,155,255,.10)}
h1{margin-top:16px;font-size:72px;font-weight:700;letter-spacing:-.025em;line-height:1.05}
.sub{margin-top:14px;max-width:1180px;text-align:center;font-size:23px;line-height:1.45;color:var(--t2);word-break:keep-all;text-wrap:balance}
.glass{background:linear-gradient(140deg,rgba(255,255,255,.10),rgba(255,255,255,.03) 60%);border:1px solid var(--edge);backdrop-filter:blur(22px) saturate(140%);-webkit-backdrop-filter:blur(22px) saturate(140%);box-shadow:inset 0 1px 0 var(--hi)}
/* 햇빛 반사 — 좌상단 테두리 선(1px) 위에만 무지갯빛. 반짝임 · 번짐 없음(10/21 서우 「빛나는 효과 없애고 테두리에 맞춰」). */
.glint{position:relative;--gw:260px;--gh:140px}
.glint::after{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1px;pointer-events:none;
 background:radial-gradient(ellipse var(--gw) var(--gh) at 0 0,rgba(255,255,255,.85) 0%,rgba(255,172,222,.85) 12%,rgba(182,152,255,.80) 28%,rgba(122,192,255,.70) 44%,rgba(122,255,202,.45) 60%,rgba(255,255,255,0) 78%);
 -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
.row{margin-top:40px;width:100%;display:grid;grid-template-columns:1fr 200px 1.12fr 200px 1fr;align-items:stretch}
.tile{border-radius:16px;padding:30px 32px 30px;display:flex;flex-direction:column}
.tile.provider{--acc:var(--p1)} .tile.hub{--acc:var(--p3)} .tile.consumer{--acc:var(--p2)}
.tile.hub{background:linear-gradient(140deg,rgba(130,118,255,.30),rgba(77,77,206,.12) 65%);border-color:rgba(163,155,255,.48)}
.eyebrow{align-self:flex-start;font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--acc);border:1px solid var(--acc);border-radius:6px;padding:4px 9px;background:rgba(163,155,255,.10)}
.tile h2{margin-top:14px;font-size:34px;font-weight:700;letter-spacing:-.02em;line-height:1.15;word-break:keep-all}
.items{margin-top:20px;list-style:none}
.items li{position:relative;border-top:1px solid rgba(255,255,255,.13);padding:11px 0 11px 18px;font-size:19px;font-weight:500;line-height:1.3;color:var(--t1);word-break:keep-all}
.items li::before{content:"";position:absolute;left:0;top:20px;width:6px;height:6px;background:var(--acc)}
.items li:last-child{border-bottom:1px solid rgba(255,255,255,.13)}
.tile .n{margin-top:14px;font-size:15px;line-height:1.45;color:var(--t3);word-break:keep-all;text-wrap:pretty}
.tech{margin-top:auto;padding-top:18px;display:flex;flex-direction:column;align-items:flex-start;gap:7px}
.tech .tl{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--t3)}
.tech .tag{font-size:14px;font-weight:600;color:var(--acc);border:1px solid rgba(163,155,255,.42);border-radius:6px;padding:4px 9px;background:rgba(13,11,38,.35)}
.lane{align-self:center;display:flex;flex-direction:column;align-items:center;gap:8px;padding:0 10px}
.lane svg{width:180px;height:56px;display:block;overflow:visible}
.lbl{font-size:15px;font-weight:600;letter-spacing:-.005em;word-break:keep-all;text-align:center;line-height:1.25}
.lbl.data{color:var(--p1)} .lbl.value{color:var(--p2)}
.lbl.value.money{color:var(--t1);font-size:17px;font-weight:700;line-height:1.1}
.rev{margin-top:-2px;font-size:12px;font-weight:700;letter-spacing:.06em;color:var(--p2);border:1px solid rgba(205,184,255,.55);border-radius:6px;padding:3px 8px;background:rgba(205,184,255,.12);text-align:center;line-height:1.3}
.loop{position:relative;width:100%;height:78px}
.loop svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.loop .pill{position:absolute;left:50%;top:44px;transform:translate(-50%,-50%);white-space:nowrap;font-size:16px;color:var(--t2);background:#17143A;border:1px solid rgba(205,184,255,.42);border-radius:8px;padding:8px 16px}
.loop .pill b{color:var(--p2);font-weight:600}
.legend{margin-top:14px;display:flex;gap:28px;align-items:center;font-size:14px;color:var(--t3)}
.legend span{display:flex;align-items:center;gap:10px}
.legend svg{width:40px;height:4px;display:block}
.nw{white-space:nowrap}
.foot{margin-top:12px;font-size:13.5px;color:var(--t3);text-align:center}
"""

ARROW_DATA = '<line x1="2" y1="14" x2="168" y2="14" stroke="#A39BFF" stroke-width="2"/><polygon points="178,14 166,8 166,20" fill="#A39BFF"/>'
ARROW_VALUE = '<line x1="178" y1="42" x2="12" y2="42" stroke="#CDB8FF" stroke-width="2" stroke-dasharray="6 6"/><polygon points="2,42 14,36 14,48" fill="#CDB8FF"/>'

def nw(text):
    """「 · 」로 끊은 덩어리는 한 줄에 — 줄바꿈은 구분점 뒤에서만."""
    parts = text.split(" · ")
    if len(parts) == 1:
        return text
    return " ".join(f'<span class="nw">{p}{" ·" if i < len(parts) - 1 else ""}</span>' for i, p in enumerate(parts))

def loop_svg():
    # 기여자 타일 가운데(1fr 열) 아래에서 출발 → 수요자 타일 가운데로 올라감. 열 폭: (1776 − 400) / 3.12 = 441.0
    w, col = 1776, (1776 - 400) / 3.12
    x1, x2, y = col / 2, w - col / 2, 44
    r = 14
    d = f"M{x1:.1f},0 V{y - r} Q{x1:.1f},{y} {x1 + r:.1f},{y} H{x2 - r:.1f} Q{x2:.1f},{y} {x2:.1f},{y - r} V10"
    return (f'<svg viewBox="0 0 {w} 78" preserveAspectRatio="none"><path d="{d}" fill="none" stroke="#CDB8FF" stroke-width="2" stroke-dasharray="6 6"/>'
            f'<polygon points="{x2:.1f},0 {x2 - 6:.1f},12 {x2 + 6:.1f},12" fill="#CDB8FF"/></svg>')

def page(lang):
    t = T[lang]
    cells = []
    for i, (cls, eyebrow, title, items, note, tech) in enumerate(t["tiles"]):
        lis = "".join(f"<li>{nw(x)}</li>" for x in items)
        tags = "".join(f'<span class="tag">{x}</span>' for x in tech)
        cells.append(f'<section class="tile glass glint {cls}"><div class="eyebrow">{eyebrow}</div><h2>{title}</h2>'
                     f'<ul class="items">{lis}</ul><p class="n">{note}</p><div class="tech"><span class="tl">{t["tech"]}</span>{tags}</div></section>')
        if i < 2:
            top, bottom, rev = t["lanes"][i]
            money = f'<span class="rev">{rev}</span>' if rev else '<span class="rev" style="visibility:hidden">·</span>'   # 두 레인 높이를 맞춰 화살표 높이 정렬
            cells.append(f'<div class="lane"><span class="lbl data">{top}</span><svg viewBox="0 0 180 56">{ARROW_DATA}{ARROW_VALUE}</svg>'
                         f'<span class="lbl value{" money" if rev else ""}">{bottom}</span>{money}</div>')
    solid, dashed = t["legend"]
    legend = (f'<div class="legend"><span><svg viewBox="0 0 40 4"><line x1="0" y1="2" x2="40" y2="2" stroke="#A39BFF" stroke-width="2"/></svg>{solid}</span>'
              f'<span><svg viewBox="0 0 40 4"><line x1="0" y1="2" x2="40" y2="2" stroke="#CDB8FF" stroke-width="2" stroke-dasharray="6 6"/></svg>{dashed}</span></div>')
    return f"""<!doctype html><html lang="{t['lang']}"><head><meta charset="utf-8"><title>wellbian — {t['h1']}</title><style>{CSS}</style></head><body>
<div class="bgfx"><div class="g1"></div><div class="g2"></div><div class="g3"></div><div class="g4"></div><div class="g5"></div><div class="grid"></div></div>
<div class="wrap">
<div class="logo">{LOGO}</div>
<div class="kicker">{t['kicker']}</div>
<h1>{t['h1']}</h1><p class="sub">{t['sub']}</p>
<div class="row">{"".join(cells)}</div>
<div class="loop">{loop_svg()}<div class="pill">{t['loop']}</div></div>
{legend}
<p class="foot">{t['foot']}</p>
</div></body></html>"""

if __name__ == "__main__":
    env = dict(os.environ)
    env["NODE_PATH"] = subprocess.run(["npm", "root", "-g"], capture_output=True, text=True).stdout.strip()
    for lang in (sys.argv[1:] or ("en", "ko")):
        html = HERE / f"ecosystem-{lang}.html"
        html.write_text(page(lang), encoding="utf-8")
        subprocess.run(["node", str(HERE / "shot.js"), str(html), str(HERE / f"ecosystem-{lang}.png"), "1920"], check=True, env=env)
        print("built", lang)
