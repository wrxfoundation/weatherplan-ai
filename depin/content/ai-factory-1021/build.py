"""연재 Part 3 — Weather AI Factory 그래픽 (2026-10-21).

서우 「기존 백서도 체크해서 이걸 3편으로」 — 브랜드 원글(Weather AI Factory) + 백서 Company v1.0 초안(9/28) §4 AI Infra · wellbianai.io.
톤 · CSS · 아이콘 틀은 구조 그래픽(../architecture-1021/build.py)을 그대로 가져다 쓴다.
Usage: python3 build.py [en|en-9x16 …] → ai-factory-<인자>.html · .png(가로 1920×1080 · 세로 1080×1920, @2x). JPEG 변환은 README.
"""
import pathlib, subprocess, os, sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "architecture-1021"))
sys.dont_write_bytecode = True
import build as A  # noqa: E402  — CSS · LOGO · ICON · ico · nw 재사용

A.ICON.update({
 "db":      '<ellipse cx="12" cy="5.5" rx="7.5" ry="2.8"/><path d="M4.5 5.5v13c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-13"/><path d="M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8"/>',
 "history": '<path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"/><path d="M3.5 4.5V8H7"/><path d="M12 8v4.5l3 1.8"/>',
 "globe":   '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5S9.5 6.1 12 3.5z"/>',
 "chip":    '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3M3 9h3M3 12h3M3 15h3M18 9h3M18 12h3M18 15h3"/>',
 "model":   '<circle cx="6" cy="7" r="2"/><circle cx="18" cy="7" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="12" cy="10" r="1.6"/><path d="M7.8 7.7l2.7 1.4M16.2 7.7l-2.7 1.4M12 11.6V16M7 8.8l4 7.5M17 8.8l-4 7.5"/>',
 "agent":   '<path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5z"/><path d="M8 10h8M8 13h5"/>',
 "api":     '<path d="M8.5 7L4 12l4.5 5"/><path d="M15.5 7L20 12l-4.5 5"/><path d="M13.5 5l-3 14"/>',
 "factory": '<path d="M3.5 20.5V11l5.5 3.2V11l5.5 3.2V5h5v15.5z"/><path d="M2.5 20.5h19"/><path d="M7 17.5h2M12 17.5h2M16.5 17.5h1.5"/>',
})

T = {
 "en": dict(
  lang="en", kicker="Wellbian AI · AI factory",
  h1="Same data. Sold twice.",
  sub="First as verified data, by the call. Then as intelligence: our AI factory refines the same readings, with 30 years of KWeather observation and forecast data, into indexes, forecasts and agents.",
  inp=("Input", "Weather big data", [
    ("sensor",  "Sensors in real rooms", "PM · CO₂ · TVOC · temperature · humidity"),
    ("history", "30 years of KWeather data", "Observation and forecast archive"),
    ("globe",   "City weather", "172 cities · a consensus of eleven weather feeds")]),
  ref=("Refine", "The AI factory", [
    ("Collect", "raw data from every source"),
    ("Clean", "drop bad and missing readings"),
    ("Structure", "shape it for the models"),
    ("Generate", "indexes, forecasts, answers")],
    [("model", "Weather AI models"), ("chip", "B300 GPU inference")]),
  out=("Output", "Weather intelligence", [
    ("agent",   "60-day hyper-local forecast agent", "A decision for your plans · evidence on request", ("live", "Live · demo")),
    ("api",     "Inference API", "Indexes, forecasts, risk indexes", ("soon", "Coming")),
    ("factory", "Industry packages", "Energy · construction · retail · public sector", ("soon", "Coming"))]),
  band=("Revenue", "data by the call · agent plans after launch · inference API · industry packages"),
  note="“Intelligence tokens” is AI-factory language for model output. They are not WLBN.",
  foot="From the Wellbian Labs whitepaper v1.0 draft (2026-09-28) and wellbianai.io · No price or return is promised.",
 ),
}

XCSS = """
.logo{height:78px}
.logo svg{width:215px;height:78px}
.kicker{margin-top:16px;font-size:14px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--p1);border:1px solid rgba(163,155,255,.55);border-radius:999px;padding:6px 14px;background:rgba(163,155,255,.10)}
.fab{margin-top:36px;width:100%;display:grid;grid-template-columns:1fr auto 1.18fr auto 1fr;column-gap:16px;align-items:stretch}
.fab .chev{align-self:center;padding:0;color:var(--p1)}
.fab .chev svg{width:30px;height:30px}
.ft{border-radius:16px;padding:28px 30px 30px;--acc:var(--p1)}
.ft.hub{background:linear-gradient(150deg,rgba(124,110,255,.30),rgba(77,77,206,.16) 60%);border-color:rgba(163,155,255,.55);--acc:var(--p2)}
.ft h2{margin-top:12px;font-size:32px;font-weight:700;letter-spacing:-.02em;line-height:1.15}
.items{margin-top:22px;display:flex;flex-direction:column;gap:18px}
.it{display:grid;grid-template-columns:54px 1fr;column-gap:16px;align-items:start}
.it .ico{width:54px;height:54px;margin:0;border-radius:12px}
.it .ico svg{width:29px;height:29px}
.it b{display:block;font-size:20px;font-weight:600;letter-spacing:-.01em;line-height:1.22;word-break:keep-all}
.it .d{display:block;margin-top:5px;font-size:15.5px;line-height:1.38;color:var(--t2);word-break:keep-all}
.st{display:inline-block;margin-top:7px;font-size:12.5px;font-weight:700;letter-spacing:.06em;border-radius:6px;padding:2px 8px;border:1px solid}
.st.live{color:#8EF0C6;border-color:rgba(142,240,198,.55);background:rgba(142,240,198,.08)}
.st.soon{color:var(--t2);border-color:rgba(226,224,255,.32)}
.proc{margin-top:22px;display:flex;flex-direction:column;gap:12px}
.pr{display:grid;grid-template-columns:34px 1fr;column-gap:14px;align-items:center}
.pr .k{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-size:15px;font-weight:700;color:var(--t1);background:rgba(163,155,255,.22);border:1px solid rgba(205,184,255,.55)}
.pr b{font-size:20px;font-weight:600}
.pr span{margin-left:8px;font-size:16px;color:var(--t2)}
.eng{margin-top:22px;display:grid;grid-template-columns:1fr 1fr;gap:12px}
.eng div{display:flex;align-items:center;gap:12px;border-radius:12px;padding:10px 12px;background:rgba(13,11,38,.28);border:1px solid rgba(205,184,255,.30);font-size:16.5px;font-weight:600}
.eng .ico-s{width:40px;height:40px;border-radius:10px;color:var(--p2)}
.eng .ico-s svg{width:23px;height:23px}
.band{margin-top:22px;backdrop-filter:blur(14px) saturate(130%);-webkit-backdrop-filter:blur(14px) saturate(130%)}
.band .ico-s{color:var(--p1)}
.ill{position:absolute;top:20px;right:22px;width:140px;height:140px;color:var(--acc);pointer-events:none}
.ft .hd{min-height:118px;padding-right:150px}
.ill svg{width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 8px rgba(163,155,255,.35))}
.ill .l2{stroke:rgba(226,224,255,.55)}
.ill .dot{stroke:currentColor;stroke-width:2.2;stroke-dasharray:0 5;opacity:.85}
/* 햇살 — 위에서 구름 사이로 쏟아지는 풍부한 금빛(마니에리스모 · 틴토레토 · 엘 그레코의 하늘빛). 10/22 서우 「인위적인 조명 말고 자연스러운 햇살」.
   그린 빛이 아니라 Higgsfield 로 만든 회화풍 배경(assets/light-*.jpg)을 깔고, 아래쪽은 남보라로 덮어 타일 글씨를 지킨다. */
.paint{position:absolute;inset:0;background:url("assets/light-16x9.jpg") center top/cover no-repeat;opacity:.66}  /* 10/22 서우 「20% 약하게」 .82 → .66 */
.paintfade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(13,11,38,0) 0%,rgba(13,11,38,.10) 24%,rgba(13,11,38,.55) 40%,rgba(13,11,38,.88) 56%,#0D0B26 74%)}
/* 오른쪽 아래 AI 데이터센터 건물(10/22 서우 「우측 하단에 과하지 않게」) — 같은 회화풍(Higgsfield) 그림을 잘라 배경층 맨 위에. 밝은 부분만 보이게(lighten). */
.fg{position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden}
.dc{position:absolute;right:-150px;bottom:-12px;width:560px;height:251px;background:url("assets/datacenter-radar.png") center bottom/contain no-repeat;filter:brightness(.66) saturate(.92) contrast(1.06);-webkit-mask-image:linear-gradient(0deg,transparent 0%,#000 14%);mask-image:linear-gradient(0deg,transparent 0%,#000 14%)}
.dchaze{position:absolute;right:-60px;bottom:-120px;width:760px;height:420px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,196,120,.14),rgba(163,120,255,.08) 55%,rgba(163,120,255,0))}
/* 데이터센터 지붕에서 하늘로 솟는 디지털 정보(점선 기둥) — 10/22 서우 「하늘로 디지털 정보를 쏘는 듯한 효과」(참고 이미지: 지구에서 솟는 점 기둥). 금빛 → 라벤더로 옅어진다. */
.streams{position:absolute;right:84px;bottom:219px;width:70px;height:280px;pointer-events:none;mix-blend-mode:screen;opacity:.9;filter:drop-shadow(0 0 3px rgba(255,214,150,.45))}
.streams svg{width:100%;height:100%;display:block}
.logo,h1,.sub{text-shadow:0 2px 22px rgba(13,11,38,.55)}
.note,.foot{text-shadow:0 0 6px #0D0B26,0 0 14px #0D0B26}
.logo svg{filter:drop-shadow(0 2px 14px rgba(13,11,38,.5))}
.sub{color:rgba(244,243,255,.9)}
.kicker{color:#E6DCFF;background:rgba(13,11,38,.58);border-color:rgba(205,184,255,.65);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.note{margin-top:16px;font-size:16px;color:var(--t2)}
.note b{color:var(--t1);font-weight:600}
.foot{margin-top:10px}
"""

VCSS = """
html,body{width:1080px;height:1920px}
body{padding:30px 44px 0;justify-content:flex-start}
.dc{width:470px;height:210px;right:-106px;bottom:-70px}
.dchaze{width:620px;height:360px;right:-90px;bottom:-130px}
.streams{right:90px;bottom:122px;width:60px;height:80px}
.bgfx .g1{width:900px;height:900px;left:-300px;top:-380px}
.bgfx .g2{width:900px;height:900px;right:-320px;bottom:-360px}
.bgfx .g3{width:700px;height:600px;left:-160px;top:30%}
.bgfx .g4{width:700px;height:600px;right:-200px;top:52%}
.logo{height:68px}
.logo svg{width:186px;height:68px}
.kicker{font-size:16px;margin-top:18px}
h1{margin-top:14px;font-size:76px;line-height:1.04;text-align:center;letter-spacing:-.03em}
.sub{margin-top:14px;max-width:960px;font-size:25px;line-height:1.42}
.fab{margin-top:24px;display:flex;flex-direction:column;gap:0}
.fab .chev{align-self:center;transform:rotate(90deg);margin:6px 0}
.fab .chev svg{width:30px;height:30px}
.ft{padding:22px 30px 24px}
.ft h2{font-size:36px;margin-top:10px}
.ft .eyebrow{font-size:15px}
.items{margin-top:16px;gap:14px}
.it{grid-template-columns:60px 1fr;column-gap:18px}
.it .ico{width:60px;height:60px}
.it .ico svg{width:32px;height:32px}
.it b{font-size:28px}
.it .d{font-size:22.5px;margin-top:3px}
.st{font-size:15px;margin-top:6px}
.vrow{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px}
.vrow .st{margin-top:0;vertical-align:4px}
.proc{margin-top:16px;gap:10px;display:grid;grid-template-columns:1fr 1fr;column-gap:16px}
.pr{grid-template-columns:38px 1fr;align-items:start}
.pr .k{width:38px;height:38px;font-size:17px}
.pr b{display:block;font-size:26px}
.pr span{display:block;margin:2px 0 0;font-size:21px;line-height:1.3}
.eng{margin-top:16px}
.eng div{font-size:22px;padding:10px 12px}
.eng .ico-s{width:46px;height:46px}
.eng .ico-s svg{width:26px;height:26px}
.band{height:auto;min-height:74px;padding:12px 20px;font-size:22px;gap:12px;flex-wrap:wrap;border-radius:14px;margin-top:18px;text-align:center}
.band b{font-size:24px}
.band .ico-s{width:46px;height:46px;border-radius:11px}
.band .ico-s svg{width:26px;height:26px}
.paint{background-image:url("assets/light-9x16.jpg")}
.paintfade{background:linear-gradient(180deg,rgba(13,11,38,0) 0%,rgba(13,11,38,.10) 14%,rgba(13,11,38,.55) 22%,rgba(13,11,38,.88) 30%,#0D0B26 40%)}
.ill{top:16px;right:24px;width:150px;height:150px}
.ft .hd{min-height:0;padding-right:170px}
.ft.hub .hd{min-height:130px}
.note{margin-top:14px;font-size:21px;text-align:center;max-width:960px;text-wrap:balance}
.foot{margin-top:10px;max-width:960px;text-align:center;font-size:18px;line-height:1.45;text-wrap:balance}
.note,.foot{align-self:flex-start;text-align:left;max-width:680px;margin-left:6px}
"""


# 큰 라인 일러스트(120 그리드) — 타일 우상단. 10/21 서우 「큰 테이블 우측 상단에 큰 svg 일러스트 라인 아이콘」.
ILLUS = {
 "data": (
  '<ellipse cx="84" cy="38" rx="22" ry="7"/><path d="M62 38v52c0 3.9 9.8 7 22 7s22-3.1 22-7V38"/>'
  '<path d="M62 55.5c0 3.9 9.8 7 22 7s22-3.1 22-7"/><path d="M62 73c0 3.9 9.8 7 22 7s22-3.1 22-7"/>'
  '<g class="l2"><circle cx="15" cy="20" r="5"/><path d="M15 10.5v2.5M5.5 20H8M8.3 13.3l1.8 1.8M21.7 13.3l-1.8 1.8"/>'
  '<path d="M11 36h15a5.5 5.5 0 0 0 0-11 7.5 7.5 0 0 0-14-1.5A6 6 0 0 0 11 36z"/>'
  '<path d="M15 50c-3.2 4.3-5 7.2-5 9.3a5 5 0 0 0 10 0c0-2.1-1.8-5-5-9.3z"/><path d="M27 56c-1.9 2.6-3 4.3-3 5.6a3 3 0 0 0 6 0c0-1.3-1.1-3-3-5.6z"/>'
  '<rect x="10" y="78" width="13" height="21" rx="3"/><circle cx="16.5" cy="92.5" r="2.6"/><path d="M27 84c1.5 1.3 1.5 3.7 0 5M30.5 81.5c3 2.7 3 7.3 0 10"/></g>'
  '<g class="dot"><path d="M31 29c12 0 18 6 30 12"/><path d="M33 57c10 0 17-1 28 1"/><path d="M35 88c10 0 16-5 26-12"/></g>'),
 "factory": (
  # 건물 — 톱니 지붕 공장동 + 냉각 팬 달린 서버 동 + 정면 GPU 칩 · 문, 위에서 데이터(점선) · 전력(번개)이 들어온다
  '<path d="M8 104h104"/>'
  '<path d="M14 104V60l18-12v12l18-12v12l18-12v12l18-12v56"/>'
  '<rect x="86" y="32" width="22" height="72" rx="2"/>'
  '<circle cx="97" cy="47" r="5.5"/><circle cx="97" cy="66" r="5.5"/><path d="M91 82h12M91 88h12M91 94h12"/>'
  '<rect x="30" y="72" width="24" height="24" rx="3"/><rect x="36.5" y="78.5" width="11" height="11" rx="1.5"/>'
  '<path d="M36 68v4M42 68v4M48 68v4M26 78h4M26 84h4M26 90h4M54 78h4M54 84h4M54 90h4"/>'
  '<rect x="64" y="84" width="12" height="20" rx="1.5"/><path d="M64 74h12"/>'
  '<g class="l2"><path d="M20 30h14a5 5 0 0 0 0-10 7 7 0 0 0-13-1.5A5.5 5.5 0 0 0 20 30z"/><path d="M104 6l-7 12h6l-5 11"/></g>'
  '<g class="dot"><path d="M27 34c2 5 4 8 5 12"/></g>'),
 "intel": (
  # 뇌 + 날씨 — 왼쪽 반구 = 회로(생각), 오른쪽 반구 = 해 · 구름 · 비(날씨), 가운데 고랑, 오른쪽 위 반짝임
  '<path d="M60 22c-9-6-23-5-28 6-10 2-14 12-10 20-8 6-6 20 4 24 0 10 10 18 20 14 4 8 12 8 14 4z"/>'
  '<path d="M60 22c9-6 23-5 28 6 10 2 14 12 10 20 8 6 6 20-4 24 0 10-10 18-20 14-4 8-12 8-14 4z"/>'
  '<path d="M60 22v68"/>'
  '<path d="M29 38h10l5 5M24 56h18M31 75h8l5-5"/><circle cx="46.5" cy="45.5" r="2.4"/><circle cx="45" cy="56" r="2.4"/><circle cx="46.5" cy="67.5" r="2.4"/>'
  '<circle cx="77" cy="40" r="5.5"/><path d="M77 30.5V32M86.5 40H85M70.3 33.3l1 1M83.7 33.3l-1 1"/>'
  '<path d="M71 64h16a5.5 5.5 0 0 0 0-11 7.5 7.5 0 0 0-14-1.8A6 6 0 0 0 71 64z"/>'
  '<g class="l2"><path d="M73 70l-2 4.5M79 70l-2 4.5M85 70l-2 4.5"/>'
  '<path d="M104 8l3 7.6 7.6 3-7.6 3-3 7.6-3-7.6-7.6-3 7.6-3z"/></g>'),
}

def illus(name):
    return f'<div class="ill"><svg viewBox="0 0 120 120" aria-hidden="true">{ILLUS[name]}</svg></div>'


def streams(w=200, h=300, seed=11, n=9):
    """레이더에서 하늘로 오르는 가랑비 같은 점선 몇 줄(10/22 서우 「폭포 말고 가랑비처럼 상징적으로」).
    아래는 0에서 서서히 켜지고 위로 갈수록 사라진다. 같은 seed 면 같은 그림."""
    import random
    r = random.Random(seed)
    parts = [f'<defs><linearGradient id="up" gradientUnits="userSpaceOnUse" x1="0" y1="{h}" x2="0" y2="0">'
             '<stop offset="0" stop-color="#FFE1A6" stop-opacity="0"/><stop offset=".15" stop-color="#FFE1A6" stop-opacity=".85"/>'
             '<stop offset=".5" stop-color="#E9D7FF" stop-opacity=".45"/><stop offset="1" stop-color="#CDB8FF" stop-opacity="0"/></linearGradient></defs>']
    for i in range(n):
        x = w * (0.5 + (i - (n - 1) / 2) / n * 0.8 + r.uniform(-0.03, 0.03))
        hh = h * r.uniform(0.45, 0.95) * (1 - abs(i - (n - 1) / 2) / n * 0.8)
        parts.append(f'<line x1="{x:.1f}" y1="{h}" x2="{x:.1f}" y2="{h-hh:.0f}" stroke="url(#up)" stroke-width="{r.choice([1.6, 2.0])}" stroke-linecap="round" stroke-dasharray="0.1 {r.choice([11, 13, 15])}" stroke-dashoffset="{r.randint(0, 12)}" opacity="{r.uniform(.45, .8):.2f}"/>')
    return f'<div class="streams"><svg viewBox="0 0 {w} {h}" preserveAspectRatio="none" aria-hidden="true">{"".join(parts)}</svg></div>'

CHEV = '<div class="chev"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M0 12h21M16 7l5 5-5 5"/></svg></div>'

def page(lang, vertical=False):
    t = T[lang]
    ie, ih, items = t["inp"]
    inp = "".join(f'<div class="it">{A.ico(i)}<div><b>{b}</b><span class="d">{A.nw(d)}</span></div></div>' for i, b, d in items)
    re_, rh, steps, eng = t["ref"]
    proc = "".join(f'<div class="pr"><span class="k">{k + 1}</span><div><b>{b}</b><span>{d}</span></div></div>' for k, (b, d) in enumerate(steps))
    engs = "".join(f'<div>{A.ico(i, "ico-s")}{b}</div>' for i, b in eng)
    oe, oh, outs = t["out"]
    if vertical:
        out = "".join(f'<div class="it">{A.ico(i)}<div><b>{b}</b><span class="d">{A.nw(d)}</span></div></div>' for i, b, d, _ in outs)
    else:
        out = "".join(f'<div class="it">{A.ico(i)}<div><b>{b}</b><span class="d">{A.nw(d)}</span></div></div>' for i, b, d, _ in outs)  # 상태 칩(Live · Coming)은 10/22 서우 지시로 뺐다 — 상태는 게시 문안에
    bn, bd = t["band"]
    css = A.CSS + XCSS + (VCSS if vertical else "")
    return f"""<!doctype html><html lang="{t['lang']}"><head><meta charset="utf-8"><title>wellbian — {t['h1']}</title><style>{css}</style></head><body>
<div class="bgfx"><div class="paint"></div><div class="paintfade"></div><div class="g1"></div><div class="g2"></div><div class="g3"></div><div class="g4"></div><div class="grid"></div><div class="dchaze"></div></div>
<div class="wrap">
<div class="logo">{A.LOGO}</div>
<div class="kicker">{t['kicker']}</div>
<h1>{t['h1']}</h1><p class="sub">{t['sub']}</p>
<div class="fab">
<section class="ft glass glint">{illus("data")}<div class="hd"><div class="eyebrow">{ie}</div><h2>{ih}</h2></div><div class="items">{inp}</div></section>
{CHEV}
<section class="ft hub glass glint">{illus("factory")}<div class="hd"><div class="eyebrow">{re_}</div><h2>{rh}</h2></div><div class="proc">{proc}</div><div class="eng">{engs}</div></section>
{CHEV}
<section class="ft glass glint">{illus("intel")}<div class="hd"><div class="eyebrow">{oe}</div><h2>{oh}</h2></div><div class="items">{out}</div></section>
</div>
<div class="ops band glint">{A.ico("coins", "ico-s")}<b>{bn}</b><span>{bd}</span></div>
<p class="note">{t['note']}</p>
<p class="foot">{A.nw(t['foot'])}</p>
</div>
<div class="fg">{streams(70, 280, 11, 6) if not vertical else streams(60, 80, 11, 5)}<div class="dc"></div></div></body></html>"""

if __name__ == "__main__":
    env = dict(os.environ)
    env["NODE_PATH"] = subprocess.run(["npm", "root", "-g"], capture_output=True, text=True).stdout.strip()
    shot = HERE.parent / "architecture-1021" / "shot.js"
    for arg in (sys.argv[1:] or ("en", "en-9x16")):
        lang, _, fmt = arg.partition("-")
        name = f"ai-factory-{arg}"
        html = HERE / f"{name}.html"
        html.write_text(page(lang, vertical=(fmt == "9x16")), encoding="utf-8")
        subprocess.run(["node", str(shot), str(html), str(HERE / f"{name}.png"), "1080" if fmt == "9x16" else "1920"], check=True, env=env)
        print("built", arg)
