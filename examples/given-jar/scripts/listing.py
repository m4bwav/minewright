"""Stage the store-listing upload set in listing/ and check LISTING.md before an upload (stdlib only).

Copies dist/given-jar-VERSION.mcaddon, the pack icon, the hero image and the eye textures into listing/
(gitignored binaries; LISTING.md is the tracked text), then fails when LISTING.md names another version,
when the .mcaddon is missing (run npm run pack), or when a word from --deny appears in the listing text.
Usage: python scripts/listing.py [--deny "word1,word2"]
"""
import argparse
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPO = ROOT.parent.parent
OUT = ROOT / "listing"
IMAGES = {
    "icon.png": ROOT / "art" / "icon.png",
    "hero.jpg": REPO / ".github" / "images" / "hero.jpg",
    "eye-calm.png": ROOT / "art" / "eye_open_128.png",
    "eye-hunt.png": ROOT / "art" / "eye_red_128.png",
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--deny", default="", help="comma-separated words that must not appear (private names)")
    args = ap.parse_args()
    version = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))["version"]
    addon = ROOT / "dist" / f"given-jar-{version}.mcaddon"
    if not addon.exists():
        sys.exit(f"{addon.name} is missing: run npm run pack")
    text = (OUT / "LISTING.md").read_text(encoding="utf-8")
    problems = [f"LISTING.md names version {v}, package.json is {version}"
                for v in sorted(set(re.findall(r"\b0\.\d+\.\d+\b", text))) if v != version]
    for word in filter(None, (w.strip() for w in args.deny.split(","))):
        if re.search(rf"\b{re.escape(word)}\b", text, re.IGNORECASE):
            problems.append(f"LISTING.md contains denied word {word!r}")
    if problems:
        sys.exit("\n".join(problems))
    shutil.copy2(addon, OUT / addon.name)
    for name, src in IMAGES.items():
        shutil.copy2(src, OUT / name)
    for f in sorted(OUT.iterdir()):
        print(f"{f.relative_to(ROOT).as_posix()}: {f.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
