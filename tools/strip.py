"""Green-screen a Gemini render, pull out each figure as its own connected
component, and lay them into one horizontal sprite strip of equal cells.

Column-slicing does not work: the figures overlap in x, so a column split
cuts limbs off and leaves a neighbour's hair behind. Every cell here is
masked to the pixels that component actually owns.
"""
import sys, os, math
from collections import deque
from PIL import Image

try:
    import numpy as np
except ImportError:
    np = None


def key_green(im, tol=1.30, floor=70):
    """Green -> transparent, with a despill pass on what survives."""
    im = im.convert("RGBA")
    a = np.array(im).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    green = (g > r * tol) & (g > b * tol) & (g > floor)
    a[..., 3] = np.where(green, 0, a[..., 3])
    # despill: on kept pixels, pull green down to the max of its neighbours
    keep = ~green
    cap = np.maximum(r, b)
    over = keep & (g > cap + 8)
    a[..., 1] = np.where(over, cap + 8, g)
    return Image.fromarray(a.astype(np.uint8), "RGBA")


def components(alpha, thr=40, min_px=400):
    """Label 4-connected blobs of alpha>thr. Returns list of (bbox, mask)."""
    h, w = alpha.shape
    solid = alpha > thr
    seen = np.zeros((h, w), dtype=bool)
    out = []
    ys, xs = np.nonzero(solid)
    for sy, sx in zip(ys, xs):
        if seen[sy, sx]:
            continue
        q = deque([(sy, sx)])
        seen[sy, sx] = True
        pix = []
        x0 = x1 = sx
        y0 = y1 = sy
        while q:
            y, x = q.popleft()
            pix.append((y, x))
            if x < x0: x0 = x
            if x > x1: x1 = x
            if y < y0: y0 = y
            if y > y1: y1 = y
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and solid[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    q.append((ny, nx))
        if len(pix) < min_px:
            continue
        m = np.zeros((y1 - y0 + 1, x1 - x0 + 1), dtype=bool)
        for y, x in pix:
            m[y - y0, x - x0] = True
        out.append(((x0, y0, x1 + 1, y1 + 1), m))
    return out


def reading_order(comps, row_tol=0.35):
    """Sort into rows top-to-bottom, then left-to-right inside each row."""
    if not comps:
        return comps
    heights = [c[0][3] - c[0][1] for c in comps]
    tol = max(heights) * row_tol
    rows = []
    for c in sorted(comps, key=lambda c: c[0][1]):
        cy = c[0][1]
        for row in rows:
            if abs(cy - row[0]) < tol:
                row[1].append(c)
                break
        else:
            rows.append((cy, [c]))
            continue
    ordered = []
    for _, row in sorted(rows, key=lambda r: r[0]):
        ordered.extend(sorted(row, key=lambda c: c[0][0]))
    return ordered


def build(src, dst, expect=None, pad=0.04, align="bottom"):
    im = key_green(Image.open(src))
    arr = np.array(im)
    comps = components(arr[..., 3], min_px=int(arr.shape[0] * arr.shape[1] * 0.004))
    comps = reading_order(comps)
    if expect and len(comps) != expect:
        print("  ! found %d components, expected %d" % (len(comps), expect))
    cuts = []
    for (x0, y0, x1, y1), mask in comps:
        sub = im.crop((x0, y0, x1, y1))
        sa = np.array(sub)
        sa[..., 3] = np.where(mask, sa[..., 3], 0)     # only the pixels it owns
        cuts.append(Image.fromarray(sa, "RGBA"))
    if not cuts:
        raise SystemExit("no components in " + src)

    # one scale for all of them, so their relative sizes survive
    tallest = max(c.height for c in cuts)
    widest = max(c.width for c in cuts)
    cell_h = int(tallest * (1 + pad * 2))
    cell_w = int(max(widest * (1 + pad * 2), cell_h * 0.42))
    sheet = Image.new("RGBA", (cell_w * len(cuts), cell_h), (0, 0, 0, 0))
    for i, c in enumerate(cuts):
        x = i * cell_w + (cell_w - c.width) // 2
        y = (cell_h - c.height) if align == "bottom" else (cell_h - c.height) // 2
        sheet.alpha_composite(c, (x, y))
    sheet.save(dst, "WEBP", quality=92, method=6)
    print("  %-22s %d cells  cell=%dx%d  file=%dx%d  %.0fkB"
          % (os.path.basename(dst), len(cuts), cell_w, cell_h,
             sheet.width, sheet.height, os.path.getsize(dst) / 1024))
    return len(cuts)


if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    expect = int(sys.argv[3]) if len(sys.argv) > 3 else None
    align = sys.argv[4] if len(sys.argv) > 4 else "bottom"
    build(src, dst, expect, align=align)
