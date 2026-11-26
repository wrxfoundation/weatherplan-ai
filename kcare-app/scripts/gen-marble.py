#!/usr/bin/env python3
"""남색 섹션 배경용 마블링 대리석 텍스처 생성기 → public/bg/marble.webp

    pip install numpy pillow
    python3 scripts/gen-marble.py          # kcare-app 디렉터리에서

만드는 것: 상하좌우가 이어지는(= 이음매 없이 반복되는) 640px 흑백 타일.
CSS 는 이것을 800px 로 키워 깔고 남색 바탕에 soft-light 로 얹는다
(styles/globals.css 의 .sec-navy 참고).

핵심은 도메인 워핑이다. 좌표 자체를 부드러운 노이즈로 밀어서 장(field)을
접으면, 물감을 물 위에서 휘저은 것 같은 소용돌이가 나온다. 한 번 접으면
밋밋하고 세 번 넘어가면 뭉개져서 얼룩이 되므로 두 번 접는다.

접힌 장을 그대로 쓰면 중간 회색이 넓게 깔려 연기처럼 보인다. 그래서
|sin| 을 1보다 작은 지수로 눌러 "대부분 밝고 영점 부근만 가늘게 어두운"
선을 만든다 — 이게 맥이다. 지수를 키우면 맥이 굵어지고, 진동수(k)를
키우면 촘촘해진다. k 가 크면 여백이 사라져 답답해진다.

마지막에 평균을 128 로 되돌리는 이유: 흰 바탕이 넓은 그림을 그대로
soft-light 로 얹으면 남색 섹션이 통째로 밝아진다. 구조는 유지하되 평균만
가운데로 옮겨 남색을 지킨다.

이음매가 없어야 하는 이유: background-repeat 로 반복해 까는데 가장자리가
안 맞으면 화면에 격자 줄이 보인다. 그래서
  · 노이즈는 FFT 로 만들고 (주기성이 수학적으로 보장된다)
  · 워핑 후 표본 추출은 감아서(wrap) 한다 — 좌표가 타일 밖으로 나가도
    반대편에서 이어받는다
  · 마지막 블러도 가장자리를 감아서 건다 (PIL 기본 블러는 가장자리를
    복제 처리해서, 그냥 쓰면 어렵게 맞춘 주기성이 여기서 깨진다)
스크립트 끝에서 가장자리 차이를 내부 인접 화소 차이의 중앙값과 비교해
검증한다. 가장자리 ≈ 내부 여야 통과다.
"""

import numpy as np, os
from PIL import Image, ImageFilter

N = 640
def norm(a): return (a - a.min()) / (np.ptp(a) + 1e-9)

def fbm(n, beta, seed):
    """FFT 로 만든 1/f 노이즈 — 주기성이 보장돼 가장자리가 이어진다."""
    r = np.random.default_rng(seed)
    F = np.fft.fft2(r.normal(size=(n, n)))
    fy = np.fft.fftfreq(n)[:, None]; fx = np.fft.fftfreq(n)[None, :]
    f = np.hypot(fx, fy); f[0, 0] = 1.0
    a = np.real(np.fft.ifft2(F / f ** (beta / 2)))
    return (a - a.mean()) / (a.std() + 1e-9)

def sample_wrap(field, X, Y):
    """감아서(wrap) 겹선형 보간 — 좌표가 타일 밖으로 나가도 반대편에서 이어받아
       도메인 워핑을 해도 타일 주기성이 유지된다."""
    x0 = np.floor(X).astype(np.int64); y0 = np.floor(Y).astype(np.int64)
    fx = X - x0; fy = Y - y0
    x0 %= N; y0 %= N; x1 = (x0 + 1) % N; y1 = (y0 + 1) % N
    return (field[y0, x0] * (1 - fx) * (1 - fy) + field[y0, x1] * fx * (1 - fy)
          + field[y1, x0] * (1 - fx) * fy + field[y1, x1] * fx * fy)

ys, xs = np.mgrid[0:N, 0:N].astype(float)

# ── 도메인 워핑 — 마블링의 핵심.
# 좌표 자체를 부드러운 노이즈로 밀어서 장(field)을 접는다. 두 번 접으면
# 물감이 물 위에서 휘저어진 것 같은 소용돌이가 나온다 (한 번이면 밋밋하고,
# 세 번 넘어가면 뭉개져서 얼룩이 된다).
X, Y = xs.copy(), ys.copy()
for i, amp in enumerate((95.0, 48.0)):
    X = X + amp * fbm(N, 4.8, 101 + i * 7)
    Y = Y + amp * fbm(N, 4.8, 211 + i * 7)

# 접힌 좌표에서 완만한 장을 읽으면 그 자체가 흐름이 된다
flow = norm(sample_wrap(fbm(N, 4.2, 331), X, Y))

# ① 맥 — |sin| 을 1보다 작은 지수로 눌러 "대부분 밝고 영점 부근만 가늘게 어두운"
# 선을 만든다. 지수를 키우면 선이 굵어지고, 진동수(k)를 키우면 촘촘해진다.
# 굵은 맥 하나와 가는 맥 하나를 곱해 굵기에 변화를 준다.
def lines(k, p):
    return np.abs(np.sin(2 * np.pi * k * flow)) ** p
veins = lines(2.4, 0.34) * (0.62 + 0.38 * lines(6.2, 0.26))

# ② 넓은 명암 — 흐름을 따라 어떤 구역은 조금 어둡게
broad = 0.5 + 0.5 * np.tanh((flow - 0.5) * 3.2)

# ③ 잔 결 — 결을 따라 난 미세한 줄
striae = norm(sample_wrap(fbm(N, 2.0, 449), X, Y))

# 흰 바탕이 넓고 그 위를 맥이 지나가는 구조. 마지막에 평균을 가운데로
# 되돌리므로(아래) 흰 바탕은 중간 회색이 되고 맥만 어둡게 남는다 —
# 남색 위에 soft-light 로 얹었을 때 남색이 통째로 밝아지지 않게 하려는 것이다.
tex = veins * (0.66 + 0.34 * broad) * (0.95 + 0.05 * striae)
tex = norm(tex)

def wrap_blur(arr, radius):
    """가장자리를 감아서 블러 — PIL 기본 블러는 가장자리를 복제해 주기성을 깬다."""
    pad = int(radius * 4) + 2
    big = np.pad(arr, pad, mode="wrap")
    out = Image.fromarray(np.clip(big, 0, 255).astype(np.uint8), "L").filter(
        ImageFilter.GaussianBlur(radius))
    return np.asarray(out, dtype=float)[pad:-pad, pad:-pad]

a = wrap_blur(tex * 255, 0.6)
a = 128 + (a - a.mean()) * 1.0
img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "L")
pass

b = np.asarray(img, dtype=float)
# 이음매 검사 — 내부 기준값은 한 줄만 보면 우연히 잔잔한 줄에 걸릴 수 있어
# 여러 줄의 중앙값과 비교한다.
col_in = np.median([np.abs(b[:, i] - b[:, i + 1]).mean() for i in range(0, N - 1, 17)])
row_in = np.median([np.abs(b[i, :] - b[i + 1, :]).mean() for i in range(0, N - 1, 17)])
print("이음매 검사 (가장자리 ≈ 내부 중앙값 이면 통과):")
print(f"  좌↔우 {np.abs(b[:,0]-b[:,-1]).mean():.2f}  내부중앙값 {col_in:.2f}")
print(f"  상↔하 {np.abs(b[0,:]-b[-1,:]).mean():.2f}  내부중앙값 {row_in:.2f}")
img.save("public/bg/marble.webp", "WEBP", quality=78, method=6)
print(f"  public/bg/marble.webp: {os.path.getsize('public/bg/marble.webp')/1024:.0f} KB")
