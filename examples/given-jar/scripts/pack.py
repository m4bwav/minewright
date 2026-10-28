"""Zip behavior_pack and resource_pack into dist/given-jar-VERSION.mcaddon (stdlib only).

The .mcaddon holds one folder per pack (given_jar_BP/, given_jar_RP/), each laid out like a .mcpack, so
Minecraft imports both packs from one double-click. Fails when the manifest versions do not match package.json
or when the script bundle is missing (run npm run build first; npm run pack does both).
"""
import json
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PACKS = {"given_jar_BP": ROOT / "behavior_pack", "given_jar_RP": ROOT / "resource_pack"}
SKIP = {"__pycache__", ".DS_Store", "Thumbs.db"}


def main():
    version = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))["version"]
    want = [int(x) for x in version.split(".")]
    for name, folder in PACKS.items():
        header = json.loads((folder / "manifest.json").read_text(encoding="utf-8"))["header"]
        if header["version"] != want:
            sys.exit(f"{name}: manifest version {header['version']} does not match package.json {version}")
    if not (PACKS["given_jar_BP"] / "scripts" / "main.js").exists():
        sys.exit("behavior_pack/scripts/main.js is missing: run npm run build")
    dist = ROOT / "dist"
    dist.mkdir(exist_ok=True)
    out = dist / f"given-jar-{version}.mcaddon"
    count = 0
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for name, folder in PACKS.items():
            for path in sorted(folder.rglob("*")):
                if path.is_file() and not SKIP.intersection(path.parts):
                    z.write(path, f"{name}/{path.relative_to(folder).as_posix()}")
                    count += 1
    print(f"{out.relative_to(ROOT)}: {count} files, {out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
