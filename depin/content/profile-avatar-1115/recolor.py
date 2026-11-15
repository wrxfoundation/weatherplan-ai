import sys, numpy as np
from PIL import Image

def srgb2lin(c): return np.where(c <= 0.04045, c/12.92, ((c+0.055)/1.055)**2.4)
def lin2srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c*12.92, 1.055*c**(1/2.4)-0.055)
M1 = np.array([[0.4122214708,0.5363325363,0.0514459929],[0.2119034982,0.6806995451,0.1073969566],[0.0883024619,0.2817188376,0.6299787005]])
M2 = np.array([[0.2104542553,0.7936177850,-0.0040720468],[1.9779984951,-2.4285922050,0.4505937099],[0.0259040371,0.7827717662,-0.8086757660]])
def to_oklab(rgb):
    lms = np.cbrt(srgb2lin(rgb) @ M1.T)
    return lms @ M2.T
def to_lin(lab):
    lms = (lab @ np.linalg.inv(M2).T) ** 3
    return lms @ np.linalg.inv(M1).T

def run(src, dst, knots_in, knots_out, chroma_k, lift, report=False):
    im = np.asarray(Image.open(src).convert('RGB')).astype(np.float64)/255
    lab = to_oklab(im)
    L, a, b = lab[...,0], lab[...,1], lab[...,2]
    C = np.hypot(a, b); H = np.degrees(np.arctan2(b, a)) % 360
    if report:
        hist, _ = np.histogram(H, bins=36, range=(0,360), weights=C)
        for i, v in enumerate(hist): print(f'{i*10:3d} {v:9.0f}')
        return
    # 색상 축을 115도에서 끊어 펼친다(노랑 · 호박 구간 45~115 는 그대로)
    Hu = np.where(H < 115, H + 360, H)                # 115..475
    H2 = np.interp(Hu, knots_in, knots_out)
    w = np.interp(Hu, [115, 240, 295, 405, 475], [0, 1, 1, 0, 0])   # 보라 구간 가중
    C2 = C * (1 + (chroma_k - 1) * w)
    L2 = L + (1 - L) * lift * w
    k = np.ones_like(C2)
    for _ in range(14):                                # 색 영역 밖이면 채도만 줄인다
        hr = np.radians(H2)
        lin = to_lin(np.stack([L2, C2*k*np.cos(hr), C2*k*np.sin(hr)], -1))
        bad = ((lin < -1e-4) | (lin > 1 + 1e-4)).any(-1)
        if not bad.any(): break
        k = np.where(bad, k * 0.93, k)
    out = (lin2srgb(lin) * 255 + 0.5).astype(np.uint8)
    Image.fromarray(out).save(dst)
    print(dst, 'clipped px', int((k < 1).sum()))

if __name__ == '__main__':
    src, mode = sys.argv[1], sys.argv[2]
    if mode == 'report': run(src, None, None, None, 1, 0, report=True)
    elif mode == 'blueviolet':   # 靑紫 — 보라를 파랑 쪽으로
        run(src, sys.argv[3], [115, 240, 295, 405, 475], [115, 262, 281, 405, 475], 1.0, 0.0)
    elif mode == 'celadon':      # 靑磁 — 옥빛 청록
        run(src, sys.argv[3], [115, 240, 295, 405, 475], [115, 192, 172, 45, 115], 0.50, 0.30)
