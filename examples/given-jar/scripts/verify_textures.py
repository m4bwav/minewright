"""Regenerate test/fixtures/vanilla-item-textures.json from Mojang/bedrock-samples.

The fixture lists every item texture path in item_texture.json whose PNG exists in the same repo commit.
test/items.test.ts checks that every mission item uses one of them, so a typo or a renamed vanilla texture fails
the unit tests offline. Run when bumping Minecraft versions:  python scripts/verify_textures.py [git-ref]
Needs network access to github.com (stdlib only).
"""
import json
import re
import sys
import urllib.request
from pathlib import Path

REPO = "Mojang/bedrock-samples"


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "given-jar-verify", "Accept": "application/vnd.github+json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8")


def main():
    ref = sys.argv[1] if len(sys.argv) > 1 else "main"
    commit = json.loads(fetch(f"https://api.github.com/repos/{REPO}/commits/{ref}"))
    sha = commit["sha"]
    tree = json.loads(fetch(f"https://api.github.com/repos/{REPO}/git/trees/{sha}?recursive=1"))
    pngs = {t["path"] for t in tree["tree"] if t["path"].endswith(".png")}
    raw = fetch(f"https://raw.githubusercontent.com/{REPO}/{sha}/resource_pack/textures/item_texture.json")
    data = json.loads(re.sub(r"^\s*//.*$", "", raw, flags=re.M))["texture_data"]
    paths = set()
    for entry in data.values():
        tex = entry.get("textures")
        for t in tex if isinstance(tex, list) else [tex]:
            path = t.get("path") if isinstance(t, dict) else t
            if isinstance(path, str) and f"resource_pack/{path}.png" in pngs:
                paths.add(path)
    out = Path(__file__).resolve().parent.parent / "test" / "fixtures" / "vanilla-item-textures.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"source": f"https://github.com/{REPO}", "commit": sha,
                               "message": commit["commit"]["message"].splitlines()[0],
                               "textures": sorted(paths)}, indent=1) + "\n", encoding="utf-8")
    print(f"{len(paths)} texture paths from {REPO}@{sha[:7]} -> {out}")


if __name__ == "__main__":
    main()
