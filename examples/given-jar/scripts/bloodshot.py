"""Paint bloodshot veins on the eye art (and a red pupil on the icon). Inputs in art/base/, outputs in art/.

    python scripts/bloodshot.py          (needs Pillow; then run make_textures.py)

eye_open_128.png: red veins on the white, from its outer edge towards the iris.
eye_red_128.png:  the white turned blood red (hunt), with darker veins.
icon.png:         the eye alone on black: bloodshot white, red iris, black pupil (no sphere).
Seeded, so the output is the same on every run.
"""
import math
import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "art"
BASE = ART / "base"
SS = 4  # supersampling for the vein layer


def radial(size, cx, cy, r0, r1, feather):
    """Mask that is 255 between radii r0 and r1, feathered by `feather` pixels."""
    w, h = size
    m = Image.new("L", size)
    px = m.load()
    for y in range(h):
        for x in range(w):
            d = math.hypot(x - cx, y - cy)
            a = min((d - r0) / feather, (r1 - d) / feather, 1.0)
            px[x, y] = max(0, int(255 * a))
    return m


def bright(im, lo, hi):
    """Mask of pixels by luminance: 0 below lo, 255 above hi (the white of the eye, not lids or shadow)."""
    return im.convert("L").point(lambda v: 0 if v <= lo else 255 if v >= hi else int(255 * (v - lo) / (hi - lo)))


def grey(im, hi):
    """Mask of unsaturated pixels (the white of the eye, not skin, lids or a coloured iris)."""
    return im.convert("HSV").getchannel("S").point(lambda v: 255 if v <= hi - 30 else 0 if v >= hi else int(255 * (hi - v) / 30))


def ellipse(size, cx, cy, rx, ry, feather):
    """Mask inside an ellipse (the eye opening), feathered at the edge."""
    m = Image.new("L", size)
    px = m.load()
    for y in range(size[1]):
        for x in range(size[0]):
            e = 1 - math.hypot((x - cx) / rx, (y - cy) / ry)
            px[x, y] = max(0, min(255, int(255 * e * rx / feather)))
    return m


def pupil_mask(im, cx, cy, r):
    """Dark, non-green pixels within r of the pupil centre (the icon's pupil, not its green iris)."""
    m = Image.new("L", im.size)
    px, src = m.load(), im.load()
    for y in range(int(cy - r), int(cy + r)):
        for x in range(int(cx - r), int(cx + r)):
            R, G, B = src[x, y]
            if math.hypot(x - cx, y - cy) < r and R + G + B < 120 and G < max(R, B) + 12:
                px[x, y] = 255
    return m.filter(ImageFilter.GaussianBlur(1.2))


def pupil_centre(im, r):
    """Centroid of the dark pixels within r of the image centre."""
    c, xs, ys, n = im.width / 2, 0, 0, 0
    g = im.convert("L").load()
    for y in range(int(c - r), int(c + r)):
        for x in range(int(c - r), int(c + r)):
            if g[x, y] < 25 and math.hypot(x - c, y - c) < r:
                xs, ys, n = xs + x, ys + y, n + 1
    return xs / n, ys / n


def veins(size, cx, cy, r_out, r_in, count, width, seed):
    """Branching vein lines from radius r_out inwards towards r_in, as an L mask."""
    rng = random.Random(seed)
    w, h = size
    layer = Image.new("L", (w * SS, h * SS))
    d = ImageDraw.Draw(layer)

    def grow(x, y, ang, wd, depth):
        while wd > 0.25:
            step = (r_out - r_in) / 14
            ang += rng.uniform(-0.45, 0.45)
            nx, ny = x + math.cos(ang) * step, y + math.sin(ang) * step
            d.line([(x * SS, y * SS), (nx * SS, ny * SS)], fill=255, width=max(1, round(wd * SS)))
            x, y = nx, ny
            if math.hypot(x - cx, y - cy) < r_in:
                return
            wd *= 0.88
            if depth < 3 and rng.random() < 0.28:
                grow(x, y, ang + rng.choice((-1, 1)) * rng.uniform(0.4, 0.9), wd * 0.75, depth + 1)

    for i in range(count):
        a = 2 * math.pi * (i + rng.uniform(-0.3, 0.3)) / count
        x, y = cx + math.cos(a) * r_out, cy + math.sin(a) * r_out
        grow(x, y, a + math.pi + rng.uniform(-0.5, 0.5), width * rng.uniform(0.7, 1.2), 0)
    return layer.filter(ImageFilter.GaussianBlur(SS * 0.35)).resize(size, Image.LANCZOS)


def paint(im, mask, colour, strength):
    """Blend `colour` into im where mask is set (multiply, so the shading stays)."""
    tint = ImageChops.multiply(im, Image.new("RGB", im.size, colour))
    return Image.composite(tint, im, mask.point(lambda v: int(v * strength)))


def eye(name, sclera_red, seed):
    im = Image.open(BASE / f"{name}.png").convert("RGB")
    cx, cy = pupil_centre(im, 20)
    sclera = ImageChops.multiply(radial(im.size, cx, cy, 33, 66, 3), ImageChops.multiply(bright(im, 55, 105), grey(im, 120)))
    sclera = ImageChops.multiply(sclera, ellipse(im.size, cx, cy - 2, 66, 44, 6))
    if sclera_red:
        # Hunt: the whole white goes blood red; the veins then show darker on top.
        im = paint(im, sclera, (215, 25, 30), 0.92)
    v = veins(im.size, cx, cy, 62, 38, 26, 1.8, seed)
    v = ImageChops.multiply(v, radial(im.size, cx, cy, 37, 66, 3))
    im = paint(im, v, (120, 0, 10) if sclera_red else (190, 25, 30), 0.9)
    im.save(ART / f"{name}.png", optimize=True)


def icon(seed):
    """The icon is the eye alone on black: the bloodshot white disc, a red iris and a black pupil, no sphere."""
    im = Image.open(BASE / "icon.png").convert("RGB")
    cx, cy = pupil_centre(im, 30)
    white = ImageChops.multiply(radial(im.size, cx, cy, 77, 126, 3), bright(im, 70, 110))
    v = veins(im.size, cx, cy, 124, 76, 18, 4.5, seed)
    im = paint(im, ImageChops.multiply(v, white), (185, 20, 25), 0.95)
    # Red iris: the green ring keeps its fibres and shading as brightness, recoloured blood red.
    lum = im.convert("L").point(lambda v: min(255, v * 2))
    red = Image.merge("RGB", (lum, lum.point(lambda v: v // 9), lum.point(lambda v: v // 7)))
    sclera = ImageChops.multiply(grey(im, 70), bright(im, 120, 160))
    keep = ImageChops.lighter(ImageChops.lighter(pupil_mask(im, cx, cy, 36), bright(im, 190, 230)), sclera)
    iris = ImageChops.multiply(radial(im.size, cx, cy, -1, 84, 2), Image.eval(keep, lambda v: 255 - v))
    im = Image.composite(red, im, iris)
    # Only the eye disc on black, cropped so the eye fills the icon.
    disc = radial(im.size, cx, cy, -1, 122, 2)
    im = Image.composite(im, Image.new("RGB", im.size, (0, 0, 0)), disc)
    r = 132
    im = im.crop((round(cx - r), round(cy - r), round(cx + r), round(cy + r))).resize((512, 512), Image.LANCZOS)
    im.save(ART / "icon.png", optimize=True)


def main():
    eye("eye_open_128", False, 11)
    eye("eye_red_128", True, 12)
    icon(13)
    print("bloodshot art written")


if __name__ == "__main__":
    main()
