TPL = open("tpl.html", encoding="utf-8").read()
COPY = {
 "en": dict(lang="en", font="'Inter Display','Inter',sans-serif", h1size="64px",
   h1a="Bitcoin mining", h1b="roars in a warehouse.", h2a="Wellbian", h2b="sits quietly on a table.",
   lt="Bitcoin mining rig · 220–240 V AC · about 15 A", lp="3,500 W", rt="Wellbian air monitor · 12 V DC · 0.3 A", rp="3.6 W", lpct="", rpct="", ratio="about 1/1,000 · 0.1%",
   lc="≈ $252 a month in electricity", lcs="(2,520 kWh = 3.5 kW × 24 h × 30 days, at $0.10/kWh)",
   rc="≈ $0.26 a month in electricity", rcs="(2.6 kWh, same basis)",
   k1="Heat", k2="Noise", k3="Where", k4="Output",
   l1="Nearly all 3,500 W becomes heat", l1s="(about two 2 kW space heaters)",
   l2="About 75 dB, around the clock", l2s="(vacuum-cleaner loud)",
   l3="A huge warehouse", l3s="(780 cm² and 15 kg a rig, plus racks and cooling)", l4="Hashes",
   r1="3.6 W", r1s="(0.1% of the rig — less than a typical LED bulb)",
   r2="Quiet", r2s="(one small sensor fan)",
   r3="A tabletop", r3s="(43 cm², 260 g — 5.5% of the floor, 1.7% of the weight)", r4="Air data anyone can check"),
 "ko": dict(lang="ko", font="'Pretendard','Inter',sans-serif", h1size="60px",
   h1a="비트코인 채굴엔", h1b="거대한 창고에서 시끄럽게", h2a="웰비안은", h2b="테이블 위에서 조용히",
   lt="비트코인 채굴기 · 220–240 V 교류 · 약 15 A", lp="3,500 W", rt="웰비안 공기질 측정기 · 12 V 직류 · 0.3 A", rp="3.6 W", lpct="", rpct="", ratio="약 1/1,000 · 0.1%",
   lc="월 전기료 약 37만 8천 원", lcs="(2,520 kWh = 3.5 kW × 24시간 × 30일, kWh당 150원 가정)",
   rc="월 전기료 약 390원", rcs="(2.6 kWh, 같은 기준)",
   k1="발열", k2="소음", k3="어디에", k4="만드는 것",
   l1="3,500 W 거의 전부가 열", l1s="(2 kW 전기난로 약 2대분)",
   l2="약 75 dB, 24시간", l2s="(진공청소기 수준)",
   l3="거대한 창고", l3s="(1대 780 cm² · 15 kg + 랙 · 냉방)", l4="해시값",
   r1="3.6 W", r1s="(채굴기의 0.1% — LED 전구 한 개보다 적음)",
   r2="조용함", r2s="(작은 센서 팬 하나)",
   r3="테이블 위", r3s="(43 cm² · 260 g — 면적 5.5%, 무게 1.7%)", r4="누구나 확인할 수 있는 공기 데이터"),
}
for k, c in COPY.items():
    h = TPL
    for key, val in c.items():
        h = h.replace("{{" + key + "}}", val)
    assert "{{" not in h, k
    open(f"ad-{k}.html", "w", encoding="utf-8").write(h)
print("ok")
