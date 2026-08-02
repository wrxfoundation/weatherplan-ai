#!/usr/bin/env python3
"""남색 섹션 배경용 대리석 텍스처 생성기 → public/bg/marble.webp

    pip install numpy pillow
    python3 scripts/gen-marble.py          # kcare-app 디렉터리에서

만드는 것: 상하좌우가 이어지는(= 이음매 없이 반복되는) 640px 흑백 타일.
CSS 는 이것을 640px 그대로 깔고 남색 바탕에 soft-light 로 얹는다
(styles/globals.css 의 .sec-navy 참고).

대리석 맥을 만드는 원리: 띠(sin)를 매끄러운 노이즈로 일그러뜨린 뒤
영점 부근만 남기면 구불구불한 선이 된다. 두 가지가 핵심이다.

  · 왜곡 노이즈가 매끄러워야 한다 (fbm 의 beta). beta 가 낮아 고주파가
    남으면 맥 윤곽이 잘게 떨려 서리처럼 부슬부슬해진다. 반대로 너무 높이면
    맥이 나란해져 등고선처럼 보인다. 4.2~4.6 이 흐르는 구간이다.
  · 왜곡 진폭(amp)이 크면 띠가 잘게 부서져 화강암 얼룩이 된다. 3~4 라디안
    안팎으로 누르고, 대신 띠 개수(kx·ky)를 늘려 맥을 촘촘하게 한다.

이음매가 없어야 하는 이유: background-repeat 로 반복해 까는데 가장자리가
안 맞으면 화면에 격자 줄이 보인다. 그래서
  · 띠의 kx·ky 를 정수로 잡아 x·y 양쪽으로 주기를 맞추고
  · 일그러뜨리는 노이즈는 FFT 로 만든다 (주기성이 수학적으로 보장된다)
  · 마지막 블러도 가장자리를 감아서 건다 (PIL 기본 블러는 가장자리를
    복제 처리해서, 그냥 쓰면 어렵게 맞춘 주기성이 여기서 깨진다)
스크립트 끝에서 가장자리 차이를 내부 인접 화소 차이와 비교해 검증한다.
가장자리 ≈ 내부 여야 통과다.
"""

import numpy as np, os
from PIL import Image, ImageFilter

N = 640
def norm(a): return (a - a.min()) / (np.ptp(a) + 1e-9)

def fbm(n, beta, seed):
    """FFT 로 만든 1/f 노이즈 — 주기성이 보장돼 가장자리가 반드시 이어진다."""
    r = np.random.default_rng(seed)
    F = np.fft.fft2(r.normal(size=(n, n)))
    fy = np.fft.fftfreq(n)[:, None]; fx = np.fft.fftfreq(n)[None, :]
    f = np.hypot(fx, fy); f[0, 0] = 1.0
    a = np.real(np.fft.ifft2(F / f ** (beta / 2)))
    return (a - a.mean()) / (a.std() + 1e-9)

ys, xs = np.mgrid[0:N, 0:N].astype(float)

def veins(kx, ky, amp, power, beta, seed):
    """대리석 맥 — 띠(sin)를 노이즈로 일그러뜨린 뒤 영점 부근만 남긴다.
       kx·ky 가 정수라 x·y 양쪽으로 주기가 맞고, 일그러뜨리는 노이즈도
       주기적이라 타일 가장자리가 이어진다."""
    w = fbm(N, beta, seed) * amp
    t = 2 * np.pi * (kx * xs + ky * ys) / N + w
    return (1 - np.abs(np.sin(t))) ** power

# 굵은 맥 하나 + 가는 맥 두 갈래 (방향을 달리해 갈라지는 느낌)
# 왜곡 진폭(amp)이 크면 띠가 잘게 부서져 맥이 아니라 화강암 얼룩이 된다.
# 2 라디안 안팎으로 눌러야 맥이 길게 이어진다. 대신 띠 개수(kx·ky)를 늘린다.
# kx:ky 를 대각으로 잡아 맥이 한 방향으로 흐르게 한다 — 실제 대리석의 결이다.
# beta 가 낮으면(=노이즈에 고주파가 남으면) 맥 윤곽이 잘게 떨려 서리처럼
# 부슬부슬해진다. 4.6 안팎이 매끄럽게 흐르는 지점이고, 그보다 높이면
# 맥이 나란해져서 등고선처럼 보인다. 값을 바꿀 때 이 구간 안에서 움직일 것.
v_main = veins(kx=3, ky=1, amp=3.2, power=5,  beta=4.6, seed=7)
v_sub  = veins(kx=5, ky=2, amp=3.6, power=9,  beta=4.4, seed=19)
v_hair = veins(kx=9, ky=4, amp=4.0, power=18, beta=4.2, seed=31)

body  = norm(fbm(N, 3.6, 41))     # 돌의 넓은 명암
cloud = norm(fbm(N, 2.6, 53))     # 중간 크기 구름 무늬
dust  = norm(fbm(N, 1.6, 67))     # 미세 입자 — 많으면 화강암처럼 보인다

tex = (0.30 * norm(v_main) + 0.18 * norm(v_sub) + 0.10 * norm(v_hair)
       + 0.28 * body + 0.10 * cloud + 0.04 * dust)
tex = norm(tex)

def wrap_blur(arr, radius):
    """가장자리를 감아서 블러한다. PIL 의 기본 블러는 가장자리를 복제해서
       처리하기 때문에 그대로 쓰면 어렵게 맞춘 타일 주기성이 여기서 깨진다."""
    pad = int(radius * 4) + 2
    big = np.pad(arr, pad, mode="wrap")
    out = Image.fromarray(np.clip(big, 0, 255).astype(np.uint8), "L").filter(
        ImageFilter.GaussianBlur(radius))
    return np.asarray(out, dtype=float)[pad:-pad, pad:-pad]

img = Image.fromarray(np.clip(wrap_blur(tex * 255, 0.5), 0, 255).astype(np.uint8), "L")
a = np.asarray(img, dtype=float)
a = 128 + (a - a.mean()) * 0.95
img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "L")
pass

b = np.asarray(img, dtype=float)
print("이음매 검사 (가장자리 ≈ 내부 여야 통과):")
print(f"  좌↔우 {np.abs(b[:,0]-b[:,-1]).mean():.2f}  내부 {np.abs(b[:,N//2]-b[:,N//2+1]).mean():.2f}")
print(f"  상↔하 {np.abs(b[0,:]-b[-1,:]).mean():.2f}  내부 {np.abs(b[N//2,:]-b[N//2+1,:]).mean():.2f}")
img.save("public/bg/marble.webp", "WEBP", quality=74, method=6)
print(f"  public/bg/marble.webp: {os.path.getsize('public/bg/marble.webp')/1024:.0f} KB")
