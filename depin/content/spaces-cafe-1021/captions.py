"""wellbian spaces 01 · 카페 — 자막 · 시리즈 칩 · 마무리 카드 PNG(1920×1080 투명) 생성.

Usage: python3 captions.py → overlays/*.png (node + playwright). compose.sh 가 이 PNG 를 영상 위에 얹는다.
"""
import pathlib, subprocess, os, json

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "overlays"
LOGO = (HERE / "../../site/xrpseoul-raffle-static/www/brand/wellbian-nav.svg").read_text()
LOGO_S = LOGO.replace('width="416" height="151"', 'width="110" height="40"', 1)
LOGO_L = LOGO.replace('width="416" height="151"', 'width="248" height="90"', 1)

SERIES = "wellbian spaces"
EP = "01 · 카페"
DISC = "장면은 연출(AI 생성) · 보상 화면은 실제 화면 예시 · 보상 수량 · 가치는 보장되지 않습니다"
DISC_UI = "예시 화면 · 전환 수치는 가림 처리 · 비율과 수량은 변동되며 보장되지 않습니다"

CAPS = {
 "cap1": ("웰비안 카페를 소개합니다", DISC),
 "cap2": ("쾌적한 공기와 함께하는 웰비안 카페", DISC),
 "cap3": ("PM10 · PM2.5 · CO₂ · 온도 · 습도 · VOCs", DISC),
 "cap4": ("실내 · 외 날씨 데이터 비교", "실외 값은 외부 날씨 데이터와 비교 · " + DISC),
 "cap5a": ("측정한 날씨 데이터가 WLBN 보상으로", DISC_UI),
 "cap5b": ("클레임한 WLBN 을 RLUSD 나 XRP 로 전환", DISC_UI),
}

BASE = """
@font-face{font-family:"Pretendard";src:url("../../site/event-week/www/fonts/PretendardVariable.woff2") format("woff2");font-weight:100 900}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1920px;height:1080px;background:transparent;overflow:hidden}
body{font-family:"Pretendard",sans-serif;color:#fff;-webkit-font-smoothing:antialiased;position:relative}
.shade{position:absolute;left:0;bottom:0;width:1400px;height:320px;background:linear-gradient(to top,rgba(10,8,30,.62),rgba(10,8,30,0));-webkit-mask-image:linear-gradient(to right,#000 45%,transparent);mask-image:linear-gradient(to right,#000 45%,transparent)}
.cap{position:absolute;left:72px;bottom:96px;font-size:52px;font-weight:700;letter-spacing:-.02em;text-shadow:0 2px 18px rgba(0,0,0,.45)}
.disc{position:absolute;left:72px;bottom:52px;font-size:20px;font-weight:500;color:rgba(255,255,255,.86);text-shadow:0 1px 8px rgba(0,0,0,.6)}
.ui .cap{max-width:620px;font-size:42px;line-height:1.25;word-break:keep-all;text-wrap:balance;bottom:118px}
.ui .disc{max-width:620px;line-height:1.4;word-break:keep-all;text-wrap:balance;bottom:44px}
.ui .shade{width:760px;-webkit-mask-image:none;mask-image:none}
.chip{position:absolute;left:64px;top:56px;display:flex;align-items:center;gap:14px;padding:10px 18px 10px 14px;border-radius:12px;
 background:linear-gradient(140deg,rgba(255,255,255,.20),rgba(255,255,255,.06));border:1px solid rgba(255,255,255,.35);
 backdrop-filter:blur(10px);box-shadow:inset 0 1px 0 rgba(255,255,255,.45)}
.chip .s{font-size:18px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.92)}
.chip .e{font-size:20px;font-weight:700;padding-left:14px;border-left:1px solid rgba(255,255,255,.4)}
.end{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;
 background:radial-gradient(ellipse 70% 60% at 50% 55%,rgba(13,11,38,.55),rgba(13,11,38,.15) 70%,rgba(13,11,38,0))}
.end .t1{font-size:44px;font-weight:600;letter-spacing:-.01em;text-shadow:0 2px 16px rgba(0,0,0,.5)}
.end .t2{margin-top:14px;font-size:96px;font-weight:800;letter-spacing:-.03em;text-shadow:0 4px 24px rgba(0,0,0,.45)}
.end .lg{margin-top:34px}
"""

def page(body):
    return f'<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>{BASE}</style></head><body>{body}</body></html>'

def main():
    OUT.mkdir(exist_ok=True)
    pages = {}
    for k, (cap, disc) in CAPS.items():
        ui = ' class="ui"' if k.startswith("cap5") else ""   # 보상 화면 구간 — 오른쪽 패널(x 748~)을 피해 왼쪽 620px 안에
        pages[k] = page(f'<div{ui}><div class="shade"></div><div class="cap">{cap}</div><div class="disc">{disc}</div></div>')
    pages["chip"] = page(f'<div class="chip">{LOGO_S}<span class="s">{SERIES}</span><span class="e">{EP}</span></div>')
    pages["end"] = page(f'<div class="end"><div class="t1">날씨 데이터가 디지털 자산으로 연결되는 공간</div><div class="t2">웰비안 카페</div><div class="lg">{LOGO_L}</div></div>'
                        f'<div class="disc">{DISC}</div>')
    jobs = []
    for k, html in pages.items():
        f = OUT / f"{k}.html"; f.write_text(html, encoding="utf-8")
        jobs.append([str(f), str(OUT / f"{k}.png")])
    (OUT / "jobs.json").write_text(json.dumps(jobs))
    env = dict(os.environ); env["NODE_PATH"] = subprocess.run(["npm", "root", "-g"], capture_output=True, text=True).stdout.strip()
    subprocess.run(["node", str(HERE / "shot-alpha.js"), str(OUT / "jobs.json")], check=True, env=env)
    print("overlays:", ", ".join(pages))

if __name__ == "__main__":
    main()
