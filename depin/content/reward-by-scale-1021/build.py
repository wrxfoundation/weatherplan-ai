"""설치 대수 · 매출 조건별 한 대당 하루 보상 표 (2026-10-21).

근거: 토크노믹스 정책 · Genesis participation guide 의 마일스톤 게이트(G4~G10)와 단계 방출표.
단계 ↔ 지점 수는 방출표(단계 방출량 = 지점 수 × 1년 지급량)와 자립 표에서 맞춘 값 — README 참고.
Usage: python3 build.py   (같은 폴더에 reward-table-{ko,en}.html · .png 생성, node + playwright 필요)
"""
import pathlib, re, subprocess, os

HERE = pathlib.Path(__file__).resolve().parent
LOGO = (HERE / "../../site/xrpseoul-raffle-static/www/brand/wellbian-nav.svg").read_text()
LOGO = re.sub(r'fill="(white|#ffffff)"', 'fill="#1B1B48"', LOGO).replace('width="416" height="151"', 'width="116" height="42"', 1)
BASE, DECAY, GENESIS = 7, 0.78, 1.2

# (phase, sites_ko, sites_en, cond_ko, cond_en, now)
ROWS = [
    (1, "6만 대 전", "Before 60K", "제네시스 · 2차 판매", "Genesis and second sale", True),
    (2, "6만 대~", "60K+", "해외 매출 발생", "Overseas revenue", False),
    (3, "12만 대~", "120K+", "연매출 10억 원", "KRW 1B annual revenue", False),
    (4, "22만 대~", "220K+", "연매출 20억 원", "KRW 2B annual revenue", False),
    (5, "35만 대~", "350K+", "연매출 40억 원", "KRW 4B annual revenue", False),
    (6, "50만 대~", "500K+", "별도 공지", "To be announced", False),
    (7, "65만 대~", "650K+", "사업 수익이 보상 재원 전액 부담", "Business revenue funds all rewards", False),
    (8, "65만~100만 대 사이", "Between 650K and 1M", "별도 공지", "To be announced", False),
    (9, "65만~100만 대 사이", "Between 650K and 1M", "별도 공지", "To be announced", False),
    (10, "100만 대", "1M", "잉여 수익 발생", "Surplus revenue", False),
]

T = {
    "ko": dict(
        lang="ko", title="설치 대수가 늘면 하루 보상은 어떻게 바뀌나요?",
        sub="한 대당 하루 WLBN 개수 · 정상 품질(전송률 95% 이상) 기준",
        h=["단계", "전체 설치 대수", "단계가 열리는 매출 조건", "일반 기기", "제네시스 기기", "1단계 대비"],
        day="하루", month="월 약 {m:,}개", now="지금",
        notes=[
            "대수와 매출 조건을 <b>모두</b> 채워야 다음 단계가 열립니다. 매출 조건을 못 채우면 단계가 넘어가지 않으며, 이때 방출량은 줄어들 수 있습니다.",
            "단계가 바뀌면 <b>이미 설치한 기기도</b> 같은 개수를 받습니다. 먼저 참여할수록 누적 개수가 많은 구조입니다.",
            "제네시스 기기 = 1차 판매 구매분, 20% 가산. 품질 상위 10%는 우수 등급으로 더 받고, 전송률 80~95%는 줄어들며 80% 미만은 0개입니다.",
            "보상은 개수로만 정해져 있습니다. 실제 지급 개수와 가치는 보장되지 않으며, 이 표는 수익 예측이 아닙니다.",
        ],
        src="근거: Wellbian 토크노믹스 정책 · Genesis 참여 가이드 (2026-10-21 기준)",
    ),
    "en": dict(
        lang="en", title="How does the daily reward change as the network grows?",
        sub="WLBN per device per day · normal quality (95%+ transmission)",
        h=["Phase", "Devices installed", "Revenue condition to open", "Standard device", "Genesis device", "vs Phase 1"],
        day="per day", month="about {m:,} a month", now="Now",
        notes=[
            "A phase opens only when <b>both</b> the device count and the revenue condition are met. If revenue falls short, the next phase stays closed and emission may be cut.",
            "When the phase changes, <b>devices already installed</b> receive the same amount. Joining earlier means a larger cumulative quantity.",
            "Genesis device = bought in the first sale, +20%. The top 10% by data quality earn more; 80–95% transmission is reduced, and below 80% earns nothing.",
            "Rewards are defined only as quantities. Neither the amount paid nor its value is guaranteed, and this table is not a forecast of returns.",
        ],
        src="Source: Wellbian tokenomics policy and Genesis participation guide (as of 21 Oct 2026)",
    ),
}

CSS = """
@font-face{font-family:"Pretendard";src:url("../../site/event-week/www/fonts/PretendardVariable.woff2") format("woff2");font-weight:100 900}
:root{--ink:#1B1B48;--ink2:#44445E;--mute:#8A8AA3;--line:#ECECF3;--bg:#FFFFFF;--panel:#F6F6FA;--acc:#4D4DCE;--acc-t:#EEEEFB}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font-family:"Pretendard",system-ui,sans-serif;width:1080px;padding:64px 60px 52px}
.brand{margin:-8px 0 18px -6px}
h1{font-size:42px;line-height:1.25;font-weight:800;letter-spacing:-.01em;text-wrap:balance;word-break:keep-all}
.sub{margin-top:12px;font-size:22px;color:var(--ink2);word-break:keep-all}
table{width:100%;border-collapse:separate;border-spacing:0;margin-top:34px;font-variant-numeric:tabular-nums}
th{font-size:17px;font-weight:700;color:var(--mute);text-align:left;padding:0 12px 12px;border-bottom:2px solid var(--ink);letter-spacing:.02em}
th.n,td.n{text-align:right}
td{padding:16px 12px;border-bottom:1px solid var(--line);font-size:21px;vertical-align:middle;word-break:keep-all}
td.ph{font-weight:800;font-size:22px;white-space:nowrap}
td.cond{color:var(--ink2);font-size:19px}
td .big{font-size:27px;font-weight:800;display:block;line-height:1.1}
td .small{font-size:14px;color:var(--mute);display:block;margin-top:4px}
td.gen .big{color:var(--acc)}
td.pct{color:var(--ink2)}
tr.now td{background:var(--acc-t)}
tr.now td:first-child{border-radius:12px 0 0 12px}
tr.now td:last-child{border-radius:0 12px 12px 0}
.tag{display:inline-block;margin-left:8px;font-size:13px;font-weight:700;color:#fff;background:var(--acc);border-radius:999px;padding:3px 9px;vertical-align:middle}
.notes{margin-top:30px;background:var(--panel);border-radius:16px;padding:22px 26px;display:grid;gap:10px}
.notes p{font-size:18px;line-height:1.55;color:var(--ink2);word-break:keep-all;padding-left:18px;position:relative}
.notes p::before{content:"";position:absolute;left:0;top:.7em;width:7px;height:7px;border-radius:50%;background:var(--acc)}
.notes b{color:var(--ink)}
.src{margin-top:18px;font-size:15px;color:var(--mute)}
"""

def rows_html(t, lang):
    out = []
    for p, sko, sen, cko, cen, now in ROWS:
        f = DECAY ** (p - 1)
        d, g = BASE * f, BASE * f * GENESIS
        m, mg = round(d * 365 / 12), round(g * 365 / 12)
        sites = sko if lang == "ko" else sen
        cond = cko if lang == "ko" else cen
        label = (f"{p}단계" if lang == "ko" else f"Phase {p}") + (f'<span class="tag">{t["now"]}</span>' if now else "")
        out.append(
            f'<tr class="{"now" if now else ""}"><td class="ph">{label}</td><td>{sites}</td><td class="cond">{cond}</td>'
            f'<td class="n"><span class="big">{d:.2f}</span><span class="small">{t["month"].format(m=m)}</span></td>'
            f'<td class="n gen"><span class="big">{g:.2f}</span><span class="small">{t["month"].format(m=mg)}</span></td>'
            f'<td class="n pct">{f*100:.0f}%</td></tr>')
    return "\n".join(out)

def page(lang):
    t = T[lang]
    head = "".join(f'<th class="{"n" if i >= 3 else ""}">{h}</th>' for i, h in enumerate(t["h"]))
    notes = "".join(f"<p>{n}</p>" for n in t["notes"])
    return f"""<!doctype html><html lang="{t['lang']}"><head><meta charset="utf-8"><title>{t['title']}</title><style>{CSS}</style></head>
<body><div class="brand">{LOGO}</div><h1>{t['title']}</h1><p class="sub">{t['sub']}</p>
<table><thead><tr>{head}</tr></thead><tbody>
{rows_html(t, lang)}
</tbody></table><div class="notes">{notes}</div><p class="src">{t['src']}</p></body></html>"""

if __name__ == "__main__":
    env = dict(os.environ)
    env["NODE_PATH"] = subprocess.run(["npm", "root", "-g"], capture_output=True, text=True).stdout.strip()
    for lang in ("ko", "en"):
        html = HERE / f"reward-table-{lang}.html"
        html.write_text(page(lang), encoding="utf-8")
        subprocess.run(["node", str(HERE / "shot.js"), str(html), str(HERE / f"reward-table-{lang}.png"), "1080"], check=True, env=env)
        print("built", html.name)
