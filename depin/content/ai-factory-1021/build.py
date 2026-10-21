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
  h1="Data in. Intelligence out.",
  sub="Our AI factory refines readings from real rooms and 30 years of KWeather observation and forecast data into indexes, forecasts and agents. One dataset, two things to sell: the data, and what the models make of it.",
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
  band=("How it earns", "inference API by the call · agent plans after launch · industry packages"),
  note="“Intelligence tokens” is AI-factory language for model output. They are not WLBN.",
  foot="From the Wellbian Labs whitepaper v1.0 draft (2026-09-28) and wellbianai.io · Live = available today, Coming = not yet released · No price or return is promised.",
 ),
}

XCSS = """
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
.band{margin-top:22px}
.band .ico-s{color:var(--p1)}
.note{margin-top:16px;font-size:16px;color:var(--t2)}
.note b{color:var(--t1);font-weight:600}
.foot{margin-top:10px}
"""

VCSS = """
html,body{width:1080px;height:1920px}
body{padding:0 44px;justify-content:center}
.bgfx .g1{width:900px;height:900px;left:-300px;top:-380px}
.bgfx .g2{width:900px;height:900px;right:-320px;bottom:-360px}
.bgfx .g3{width:700px;height:600px;left:-160px;top:30%}
.bgfx .g4{width:700px;height:600px;right:-200px;top:52%}
.logo{height:52px}
.logo svg{width:143px;height:52px}
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
.note{margin-top:14px;font-size:21px;text-align:center;max-width:960px;text-wrap:balance}
.foot{margin-top:10px;max-width:960px;text-align:center;font-size:18px;line-height:1.45;text-wrap:balance}
"""

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
        out = "".join(f'<div class="it">{A.ico(i)}<div><div class="vrow"><b>{b}</b><span class="st {s}">{sl}</span></div><span class="d">{A.nw(d)}</span></div></div>' for i, b, d, (s, sl) in outs)
    else:
        out = "".join(f'<div class="it">{A.ico(i)}<div><b>{b}</b><span class="d">{A.nw(d)}</span><span class="st {s}">{sl}</span></div></div>' for i, b, d, (s, sl) in outs)
    bn, bd = t["band"]
    css = A.CSS + XCSS + (VCSS if vertical else "")
    return f"""<!doctype html><html lang="{t['lang']}"><head><meta charset="utf-8"><title>wellbian — {t['h1']}</title><style>{css}</style></head><body>
<div class="bgfx"><div class="g1"></div><div class="g2"></div><div class="g3"></div><div class="g4"></div><div class="grid"></div></div>
<div class="wrap">
<div class="logo">{A.LOGO}</div>
<div class="kicker">{t['kicker']}</div>
<h1>{t['h1']}</h1><p class="sub">{t['sub']}</p>
<div class="fab">
<section class="ft glass glint"><div class="eyebrow">{ie}</div><h2>{ih}</h2><div class="items">{inp}</div></section>
{CHEV}
<section class="ft hub glass glint"><div class="eyebrow">{re_}</div><h2>{rh}</h2><div class="proc">{proc}</div><div class="eng">{engs}</div></section>
{CHEV}
<section class="ft glass glint"><div class="eyebrow">{oe}</div><h2>{oh}</h2><div class="items">{out}</div></section>
</div>
<div class="ops band glint">{A.ico("coins", "ico-s")}<b>{bn}</b><span>{bd}</span></div>
<p class="note">{t['note']}</p>
<p class="foot">{t['foot']}</p>
</div></body></html>"""

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
