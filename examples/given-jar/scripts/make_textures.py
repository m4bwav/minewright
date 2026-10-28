"""Compose the watcher textures and pack icons from the source art in art/ (layout: ART.md).

    python scripts/make_textures.py      (needs Pillow)

Writes resource_pack/textures/entity/watcher_{open,closed,red}.png (256x256 = the 128x128 UV layout at 2x),
resource_pack/textures/given_jar/blank.png and pack_icon.png in both packs.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "art"
RP = ROOT / "resource_pack"
BP = ROOT / "behavior_pack"
SCALE = 2  # pixels per UV unit
# Alpha on the eye under entity_emissive_alpha: 255 = lit like the body, lower = glows more in the dark.
GLOW = {"open": 150, "red": 100, "closed": 225}
IRIS_CROP = 82  # source pixels (of 128) the 9x9 iris cube covers; the 14x14 eye face shows all 128


def uv(x, y):
    return x * SCALE, y * SCALE


def with_alpha(im, alpha):
    im = im.convert("RGBA")
    im.putalpha(alpha)
    return im


def atlas(variant, body):
    out = Image.new("RGBA", uv(128, 128), (13, 9, 20, 255))
    for x in range(0, out.width, body.width):
        for y in range(0, out.height, body.height):
            out.paste(body, (x, y))
    eye = Image.open(ART / f"eye_{variant}_128.png").convert("RGB").resize(uv(64, 64), Image.LANCZOS)
    out.paste(with_alpha(eye, GLOW[variant]), uv(0, 64))
    src = Image.open(ART / f"eye_{variant}_128.png").convert("RGB")
    c = src.width / 2
    half = IRIS_CROP / 2 * src.width / 128
    iris = src.crop((round(c - half), round(c - half), round(c + half), round(c + half))).resize(uv(32, 32), Image.LANCZOS)
    out.paste(with_alpha(iris, GLOW[variant]), uv(64, 64))
    return out


def main():
    body = Image.open(ART / "body_64.png").convert("RGBA")
    (RP / "textures" / "entity").mkdir(parents=True, exist_ok=True)
    for variant in GLOW:
        atlas(variant, body).save(RP / "textures" / "entity" / f"watcher_{variant}.png", optimize=True)
    (RP / "textures" / "given_jar").mkdir(parents=True, exist_ok=True)
    Image.new("RGBA", (16, 16), (0, 0, 0, 0)).save(RP / "textures" / "given_jar" / "blank.png")
    icon = Image.open(ART / "icon.png").convert("RGB").resize((256, 256), Image.LANCZOS)
    for pack in (RP, BP):
        icon.save(pack / "pack_icon.png", optimize=True)
    print("textures and pack icons written")


if __name__ == "__main__":
    main()
