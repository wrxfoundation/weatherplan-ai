#!/usr/bin/env python3
"""남색 섹션 배경용 가죽 그레인 텍스처 생성기 → public/bg/leather.webp

    pip install numpy pillow
    python3 scripts/gen-leather.py

만드는 것: 상하좌우가 이어지는(= 이음매 없이 반복되는) 640px 흑백 타일.
CSS 는 이것을 320px 로 깔고 남색 바탕에 soft-light 로 얹는다
(styles/globals.css 의 .sec-navy 참고).

이음매가 없어야 하는 이유: background-repeat 로 반복해 까는데 가장자리가
안 맞으면 화면에 격자 줄이 보인다. 그래서
  · 셀룰러 노이즈는 거리 계산을 토러스로 감싸고 (min(d, N-d))
  · 프랙탈 노이즈는 FFT 로 만든다 (주기성이 수학적으로 보장된다.
    작은 난수 격자를 확대 보간하면 이음매가 남는다)
스크립트 끝에서 가장자리 차이를 내부 인접 화소 차이와 비교해 검증한다.

굵은 얼룩(big_*)의 무게를 낮게 잡은 이유: 넓은 면에 굵은 얼룩을 깔면
가죽이 아니라 곰팡이 자국처럼 보인다. 무게는 잔 결과 모공 쪽에 둔다.
"""

import numpy as np, os
from PIL import Image, ImageFilter

N = 640
def norm(a): return (a - a.min()) / (np.ptp(a) + 1e-9)

def worley(n, cells, seed):
    r = np.random.default_rng(seed)
    pts = r.random((cells, 2)) * n
    ys, xs = np.mgrid[0:n, 0:n]
    f1 = np.full((n, n), 1e9); f2 = np.full((n, n), 1e9)
    for px, py in pts:
        dx = np.abs(xs - px); dx = np.minimum(dx, n - dx)
        dy = np.abs(ys - py); dy = np.minimum(dy, n - dy)
        d = np.hypot(dx, dy)
        np.minimum(f2, np.maximum(f1, d), out=f2)
        np.minimum(f1, d, out=f1)
    return f1, f2

def fbm(n, beta, seed):
    r = np.random.default_rng(seed)
    F = np.fft.fft2(r.normal(size=(n, n)))
    fy = np.fft.fftfreq(n)[:, None]; fx = np.fft.fftfreq(n)[None, :]
    f = np.hypot(fx, fy); f[0, 0] = 1.0
    return np.real(np.fft.ifft2(F / f ** (beta / 2)))

def ridges(cells, seed, sharp):
    f1, f2 = worley(N, cells, seed)
    e = norm(f2 - f1)
    return 1 - np.clip(e * sharp, 0, 1), norm(f1)

# 굵은 결과 잔 결을 겹친다 — 실제 가죽은 셀 크기가 고르지 않다
# 굵은 얼룩은 최소로 — 넓은 면에 깔면 곰팡이 자국처럼 보인다.
# 무게를 잔 결과 모공 쪽으로 옮겨 "알갱이"로 읽히게 한다.
big_e,  big_b  = ridges(300, 11, 2.0)
mid_e,  mid_b  = ridges(1100, 29, 2.7)
fine_e, _      = ridges(3200, 47, 3.4)
micro_e, _     = ridges(7000, 53, 4.0)

pore = norm(fbm(N, 1.3, 23))     # 모공 — 지수를 낮춰 더 잘게
sway = norm(fbm(N, 3.2, 71))     # 넓은 명암 흐름

tex = (0.08 * big_e + 0.26 * mid_e + 0.22 * fine_e + 0.14 * micro_e
       + 0.06 * big_b + 0.04 * sway + 0.20 * pore)
tex = norm(tex)

img = Image.fromarray(np.clip(tex * 255, 0, 255).astype(np.uint8), "L")
img = img.filter(ImageFilter.GaussianBlur(0.35))  # 알갱이를 살리려 아주 약하게만

a = np.asarray(img, dtype=float)
a = 128 + (a - a.mean()) * 0.95                   # 대비 정리
img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "L")
img.save("public/bg/leather_raw.png")

b = np.asarray(img, dtype=float)
print("이음매 검사:")
print(f"  좌↔우 {np.abs(b[:,0]-b[:,-1]).mean():.2f}  내부 {np.abs(b[:,N//2]-b[:,N//2+1]).mean():.2f}")
print(f"  상↔하 {np.abs(b[0,:]-b[-1,:]).mean():.2f}  내부 {np.abs(b[N//2,:]-b[N//2+1,:]).mean():.2f}")
img.save("public/bg/leather.webp", "WEBP", quality=62, method=6)
print(f"  public/bg/leather.webp: {os.path.getsize('public/bg/leather.webp')/1024:.0f} KB")
os.remove("public/bg/leather_raw.png")
