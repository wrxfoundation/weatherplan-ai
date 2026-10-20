TPL = open("tpl.html", encoding="utf-8").read()
COPY = {
 "en": dict(lang="en", font="'Inter Display','Inter',sans-serif",
   h1a="Mining Bitcoin", h1b="takes a warehouse.", h2a="Wellbian", h2b="takes a shelf.",
   lt="Bitcoin mining rig", lp="3,500 W", rt="Wellbian air monitor", rp="3.6 W",
   k1="Power in", k2="Where", k3="Weight", k4="Output",
   l1="220–240 V AC · about 15 A", l2="An industrial warehouse", l2s="(780 cm² a rig, plus racks and cooling)", l3="About 15 kg a rig", l4="Hashes",
   r1="12 V DC · 0.3 A", r2="A shelf in your room", r2s="(about 43 cm²)", r3="260 g", r4="Air data anyone can check",
   sig="An air-quality network shouldn't cost the air.",
   note="Rig: Antminer S21 (200 TH/s) seller listings — about 3,500 W, 400 × 195 × 290 mm, 14–15 kg. Monitor: ARC-600DA spec — 12 V DC, 300 mA, 120 × 118 × 36 mm, 260 g. Images: AI-generated scenes; product photo."),
 "ko": dict(lang="ko", font="'Pretendard','Inter',sans-serif",
   h1a="비트코인 채굴엔", h1b="창고가 필요합니다.", h2a="웰비안은", h2b="선반 한 칸이면 됩니다.",
   lt="비트코인 채굴기", lp="3,500 W", rt="웰비안 공기질 측정기", rp="3.6 W",
   k1="전원", k2="어디에", k3="무게", k4="만드는 것",
   l1="220–240 V 교류 · 약 15 A", l2="산업용 창고", l2s="(1대 780 cm² + 랙 · 냉방 공간)", l3="1대 약 15 kg", l4="해시값",
   r1="12 V 직류 · 0.3 A", r2="방 안 선반 한 칸", r2s="(약 43 cm²)", r3="260 g", r4="누구나 확인할 수 있는 공기 데이터",
   sig="공기를 재는 네트워크가 공기를 태워선 안 됩니다.",
   note="채굴기: Antminer S21(200 TH/s) 판매처 표기 — 약 3,500 W · 400 × 195 × 290 mm · 14~15 kg. 측정기: ARC-600DA 사양 — 12 V 직류 · 300 mA · 120 × 118 × 36 mm · 260 g. 배경은 AI 생성, 제품은 실사."),
}
for k, c in COPY.items():
    h = TPL
    for key, val in c.items():
        h = h.replace("{{" + key + "}}", val)
    assert "{{" not in h, k
    open(f"ad-{k}.html", "w", encoding="utf-8").write(h)
print("ok")
