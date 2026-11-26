#!/usr/bin/env python3
"""K-CARE 로고 벡터화 — 흰 배경 JPEG 원본에서 public/brand/*.svg 와 favicon.svg 를 만든다.

    python3 scripts/gen-logo.py <원본.jpg>

만드는 것:
    public/brand/logo.svg       밝은 배경용 — 원본 2색 그대로
    public/brand/logo-dark.svg  어두운 배경용 — 진한 파랑→흰색, 밝은 파랑→연한 파랑
    public/favicon.svg          심볼(◁C)만 정사각 · 남색 라운드 사각 위

왜 SVG 인가: 상단바 32px, 데모 홈 42px, 사이드바 30px 로 쓰는데 원본은
2728x712 JPEG 이라 글로우와 링잉이 눈에 띈다. 벡터로 뜨면 어느 크기에서도
윤곽이 또렷하고 12KB 로 끝난다.

왜 어두운 배경용을 따로 두는가: brightness(0) invert 는 모든 색을 같은 흰색으로
만든다. K-CARE 로고는 심볼이 진한 파랑/밝은 파랑 2색이라 반전하면 두 조각이
한 덩어리로 붙어 버린다.

필요한 것: numpy · Pillow · potrace(apt install potrace)
"""
import re
import subprocess
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT_BRAND = ROOT / "public" / "brand"
OUT_FAVICON = ROOT / "public" / "favicon.svg"

PRIMARY, ACCENT = "#24618A", "#247BA7"          # 원본에서 측정한 두 색
D_PRIMARY, D_ACCENT = "#FFFFFF", "#7FB2D0"      # 어두운 배경용
PLATE = "#0A1F3C"                               # 파비콘 바탕 (앱의 navy 토큰)

REF_ALPHA = 0.8588      # 솔리드 픽셀의 alpha_raw — 이 값을 1.0 으로 정규화
LUM_SPLIT = 98          # 언매팅한 색의 밝기 경계 (진한 파랑 ~86 · 밝은 파랑 ~108)

# 태그라인("Global Healthcare Concierge") 보정 — 아래 두 값이 하는 일은
# write_svg / separate 주석에 자세히 적었다.
TAG_PT_YMAX = 2620      # potrace y 가 이보다 작으면 태그라인 (소스 y 450 아래)
TAG_STROKE = 30         # potrace 단위. g 의 scale(0.1) 을 거쳐 소스 3px 이 된다


# ── 1. 누끼 + 색 분리 ────────────────────────────────────────────────────────
def separate(src):
    """흰 배경을 알파로 되돌리고 두 색 레이어로 나눈다."""
    a = np.asarray(Image.open(src).convert("RGB")).astype(np.float64)
    H, W, _ = a.shape

    # P = F*alpha + 255*(1-alpha) 를 alpha 에 대해 푼다.
    # 최소 채널이 0 에 가장 가까우므로 그것으로 잡고 솔리드 값으로 정규화한다.
    al = np.clip((255.0 - a.min(axis=2)) / 255.0 / REF_ALPHA, 0, 1)
    F = np.clip((a - 255.0 * (1 - al[..., None])) / np.maximum(al[..., None], 1e-6), 0, 255)
    lum = 0.2126 * F[..., 0] + 0.7152 * F[..., 1] + 0.0722 * F[..., 2]

    # 국소 정규화. 원본 태그라인은 획마다 진하기가 들쭉날쭉하다 — 세로획은
    # alpha 0.8 인데 가로획은 0.3 도 안 되는 곳이 있다(획이 지나가는 열의 7%).
    # 고정 문턱을 그대로 쓰면 그 흐린 가로획이 통째로 사라져 글자가 끊긴다.
    # 그래서 각 획을 '자기 주변 최대값' 기준으로 재어 절반 지점에서 자른다.
    # 바닥값 0.28 은 안전장치다 — 획이 없는 곳의 글로우는 최대 0.04 라
    # 0.04/0.28 = 0.14 로 문턱(0.45)에 한참 못 미친다. 획이 확실한 곳은
    # 국소 최대가 1.0 이라 나눠도 그대로여서 심볼·워드마크는 변하지 않는다.
    lmax = np.asarray(Image.fromarray((al * 255).astype(np.uint8))
                      .filter(ImageFilter.MaxFilter(11))).astype(float) / 255.0
    alc = np.clip(al / np.maximum(lmax, 0.28), 0, 1)

    solid = alc > 0.75
    owner = np.zeros((H, W), np.uint8)
    owner[solid & (lum < LUM_SPLIT)] = 1
    owner[solid & (lum >= LUM_SPLIT)] = 2

    # 안티에일리어싱 띠의 주인 정하기 — 두 색을 동시에 키운다.
    # 한쪽만 팽창시키면 경계가 그만큼 밀린다.
    region = alc > 0.45         # 글로우 꼬리(0.45 아래)는 버린다
    for _ in range(24):
        if not (owner[region] == 0).any():
            break
        for k in (1, 2):
            m = owner == k
            g = np.zeros_like(m)
            g[1:] |= m[:-1]; g[:-1] |= m[1:]
            g[:, 1:] |= m[:, :-1]; g[:, :-1] |= m[:, 1:]
            owner[g & region & (owner == 0)] = k

    # 잔티 정리. 원본에는 밝은 파랑 막대의 위쪽 모서리에 어두운 테두리가 남아
    # 있어서 그대로 두면 계단 모양 조각 수십 개가 진한 파랑으로 떨어진다.
    _merge_specks(owner, want=2, into=1, min_area=300)   # 밝은 파랑 잔티 → 진한 파랑
    _merge_specks(owner, want=1, into=2, min_area=300, adjacent_to=2)
    return owner


def _components(mask):
    lab = np.zeros(mask.shape, np.int32)
    H, W = mask.shape
    out, cur = [], 0
    for y0, x0 in zip(*np.where(mask)):
        if lab[y0, x0]:
            continue
        cur += 1
        px, q = [], deque([(y0, x0)])
        lab[y0, x0] = cur
        while q:
            y, x = q.popleft()
            px.append((y, x))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
                yy, xx = y + dy, x + dx
                if 0 <= yy < H and 0 <= xx < W and mask[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = cur
                    q.append((yy, xx))
        out.append(np.array(px))
    return out


def _merge_specks(owner, want, into, min_area, adjacent_to=None):
    near = None
    if adjacent_to is not None:
        near = owner == adjacent_to
        for _ in range(3):
            g = np.zeros_like(near)
            g[1:] |= near[:-1]; g[:-1] |= near[1:]
            g[:, 1:] |= near[:, :-1]; g[:, :-1] |= near[:, 1:]
            near |= g
    comps = _components(owner == want)
    keep = max((len(c) for c in comps), default=0) if adjacent_to is None else None
    for c in comps:
        if len(c) >= min_area:
            continue
        if keep is not None and len(c) == keep:
            continue
        if near is not None and not near[c[:, 0], c[:, 1]].all():
            continue
        owner[c[:, 0], c[:, 1]] = into


# ── 2. potrace ──────────────────────────────────────────────────────────────
def trace(owner, workdir):
    d = {}
    for k, name in ((1, "primary"), (2, "accent")):
        pbm = workdir / f"lay_{name}.pbm"
        svg = workdir / f"tr_{name}.svg"
        Image.fromarray(np.where(owner == k, 0, 255).astype(np.uint8)) \
             .convert("1", dither=Image.NONE).save(pbm)
        subprocess.run(["potrace", "-b", "svg", "--flat", "-a", "1.0", "-O", "0.2",
                        "-t", "3", "-o", str(svg), str(pbm)], check=True)
        d[name] = re.findall(r'<path d="(.*?)"/>', svg.read_text(), re.S)[0]
    return d


# ── 3. 서브패스 분해 (파비콘은 심볼만 남긴다) ────────────────────────────────
TOK = re.compile(r"([MmLlCcZz])|(-?\d*\.?\d+)")


def _subpaths(d):
    """[(d문자열, (x0,y0,x1,y1)), ...] · potrace 좌표계 그대로"""
    cmds, cur, nums = [], None, []
    for m in TOK.finditer(d):
        if m.group(1):
            if cur:
                cmds.append((cur, nums))
            cur, nums = m.group(1), []
        else:
            nums.append(float(m.group(2)))
    if cur:
        cmds.append((cur, nums))

    res, cx, cy, start, buf, box = [], 0.0, 0.0, None, [], None

    def bump(x, y):
        nonlocal box
        box = (x, y, x, y) if box is None else (min(box[0], x), min(box[1], y),
                                                max(box[2], x), max(box[3], y))

    for cmd, n in cmds:
        if cmd in "Mm":
            if buf:
                res.append((" ".join(buf), box))
            buf, box = [], None
            cx, cy = (n[0], n[1]) if cmd == "M" else (cx + n[0], cy + n[1])
            start = (cx, cy)
            buf.append(f"M{cx:g} {cy:g}")
            bump(cx, cy)
            n = n[2:]
            cmd = "L" if cmd == "M" else "l"
            if not n:
                continue
        if cmd in "Ll":
            seg = []
            for i in range(0, len(n), 2):
                cx, cy = (n[i], n[i + 1]) if cmd == "L" else (cx + n[i], cy + n[i + 1])
                bump(cx, cy)
                seg += [f"{n[i]:g}", f"{n[i+1]:g}"]
            buf.append(cmd + " ".join(seg))
        elif cmd in "Cc":
            seg = []
            for i in range(0, len(n), 6):
                p = n[i:i + 6]
                for j in range(0, 6, 2):
                    bump(p[j], p[j + 1]) if cmd == "C" else bump(cx + p[j], cy + p[j + 1])
                cx, cy = (p[4], p[5]) if cmd == "C" else (cx + p[4], cy + p[5])
                seg += [f"{v:g}" for v in p]
            buf.append(cmd + " ".join(seg))
        elif cmd in "Zz":
            buf.append("z")
            if start:
                cx, cy = start
    if buf:
        res.append((" ".join(buf), box))
    return res


# ── 4. SVG 조립 ─────────────────────────────────────────────────────────────
XFORM = "translate(0,712) scale(0.1,-0.1)"      # potrace 출력의 좌표계 (x10 · y 뒤집힘)


def write_svg(out, box, paths, prim, acc, xmax=None, plate=None):
    x0, y0, x1, y1 = box
    w, h = x1 - x0 + 1, y1 - y0 + 1

    def d(name, tagline=None):
        """tagline=True 면 태그라인 서브패스만, False 면 나머지만, None 이면 전부"""
        sp = _subpaths(paths[name])
        if xmax is not None:
            sp = [s for s in sp if s[1][2] <= xmax]
        if tagline is not None:
            sp = [s for s in sp if (s[1][3] < TAG_PT_YMAX) == tagline]
        return " ".join(s for s, _ in sp)

    # 태그라인은 획이 5px(전체 높이 540 대비 약 1%)이라 실제로 쓰는 크기에서
    # 0.3 CSS px 이 된다. 1 픽셀도 안 되는 선은 래스터라이저가 자리에 따라
    # 살리기도 하고 지우기도 해서 글자가 드문드문 끊겨 보인다. 획에 stroke 를
    # 얹어 3px 키운다 — 26px(푸터)에서도 고르게 나오는 최소치다.
    # 심볼·워드마크는 이미 충분히 굵어 건드리지 않는다.
    tag = d("primary", tagline=True)
    rest = d("primary", tagline=False)

    # width/height 를 명시한다 — viewBox 만 있는 SVG 를 <img> 로 걸면 렌더러에 따라
    # 고유 비율을 못 읽고 300x150 으로 떨어질 수 있다 (width:auto 가 무너진다)
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w:g}" height="{h:g}" '
             f'viewBox="{x0:g} {y0:g} {w:g} {h:g}" role="img" aria-label="K-CARE">']
    if plate:
        parts.append(f'<rect x="{x0:g}" y="{y0:g}" width="{w:g}" height="{h:g}" '
                     f'rx="{plate[1]:g}" fill="{plate[0]}"/>')
    parts.append(f'<g transform="{XFORM}">')
    if rest:
        parts.append(f'<path fill="{prim}" d="{rest}"/>')
    if tag:
        parts.append(f'<path fill="{prim}" stroke="{prim}" stroke-width="{TAG_STROKE}" '
                     f'stroke-linejoin="round" stroke-linecap="round" d="{tag}"/>')
    parts += [f'<path fill="{acc}" d="{d("accent")}"/>', "</g></svg>"]
    out.write_text("\n".join(parts) + "\n")
    print(f"{out.relative_to(ROOT)}  {out.stat().st_size} bytes  viewBox {x0:g} {y0:g} {w:g} {h:g}")


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    src = Path(sys.argv[1])
    work = Path("/tmp/kcare-logo")
    work.mkdir(exist_ok=True)

    owner = separate(src)
    ys, xs = np.where(owner > 0)
    box = (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()))
    print(f"타이트 박스 {box} · 비율 {(box[2]-box[0]+1)/(box[3]-box[1]+1):.2f}:1")

    paths = trace(owner, work)
    write_svg(OUT_BRAND / "logo.svg", box, paths, PRIMARY, ACCENT)
    write_svg(OUT_BRAND / "logo-dark.svg", box, paths, D_PRIMARY, D_ACCENT)

    # 파비콘 — 심볼만. 워드마크 경로는 viewBox 밖이라 안 보이지만 파일에는 남으므로
    # 실제로 걷어낸다 (12KB → 1.3KB).
    sym_x1 = 830        # 구분선(894) 앞
    sx = owner[:, :sym_x1]
    ys, xs = np.where(sx > 0)
    sw, sh = xs.max() - xs.min() + 1, ys.max() - ys.min() + 1
    side = round(max(sw, sh) / 0.80)     # 한 변의 10% 씩 여백
    ox = round(xs.min() + sw / 2 - side / 2)
    oy = round(ys.min() + sh / 2 - side / 2)
    write_svg(OUT_FAVICON, (ox, oy, ox + side - 1, oy + side - 1), paths,
              D_PRIMARY, D_ACCENT, xmax=sym_x1 * 10, plate=(PLATE, round(side * 0.22)))


if __name__ == "__main__":
    main()
