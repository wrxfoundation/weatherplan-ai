import json, sys
TPL = open("tpl.html", encoding="utf-8").read()
COPY = {
 "en": dict(lang="en", font="'Inter Display','Inter',sans-serif",
   h1="Mining Bitcoin takes a warehouse.", h2="Wellbian takes a shelf.",
   lt="Proof-of-work mining rig", lp="3,500 W",
   rt="Wellbian air monitor", rp="3.6 W",
   k1="Where", k2="Output", k3="Needs",
   l1="An industrial warehouse", l2="Hashes", l3="Industrial power and cooling",
   r1="A shelf in your room", r2="Air data anyone can check", r3="A wall socket and Wi‑Fi",
   sig="An air-quality network shouldn't cost the air.",
   note="Rig: Antminer S21 (200 TH/s), listed at about 3,500 W. Monitor: ARC-600DA, 12 V · 300 mA. Measures PM2.5 · PM10 · CO₂ · TVOC · temperature · humidity."),
 "ko": dict(lang="ko", font="'Pretendard','Inter',sans-serif",
   h1="비트코인 채굴엔 창고가 필요합니다.", h2="웰비안은 선반 한 칸이면 됩니다.",
   lt="작업증명 채굴기", lp="3,500 W",
   rt="웰비안 공기질 측정기", rp="3.6 W",
   k1="어디에", k2="만드는 것", k3="필요한 것",
   l1="산업용 창고", l2="해시값", l3="산업용 전력과 냉방",
   r1="방 안 선반 한 칸", r2="누구나 확인할 수 있는 공기 데이터", r3="콘센트와 와이파이",
   sig="공기를 재는 네트워크가 공기를 태워선 안 됩니다.",
   note="채굴기: Antminer S21(200 TH/s) 표기 전력 약 3,500 W. 측정기: ARC-600DA, 12 V · 300 mA. 초미세먼지 · 미세먼지 · CO₂ · TVOC · 온도 · 습도 측정."),
}
for k, c in COPY.items():
    h = TPL
    for key, val in c.items():
        h = h.replace("{{" + key + "}}", val)
    open(f"ad-{k}.html", "w", encoding="utf-8").write(h)
print("ok")
