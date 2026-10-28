"""Minecraft Creator Tools validation for mw_check.py (the --mct, --mct-npx and --mct-bin options).

mct validate runs on a temporary copy holding only the packs, because in a project folder it reports art,
tests and configs as errors. Findings known to be false positives are moved to "noise". h is mw_check.
"""
import json
import os
import re
import shutil
import sys
import tempfile
from pathlib import Path

MCT_PKG = "@minecraft/creator-tools@0.20.0"
# mct findings that are not problems (generator, regex over the line, why), seen 2026-10-27 on 0.20.0.
MCT_NOISE = [("COMJSON", r"uv_anim\W.*missing", "vanilla render controllers omit uv_anim"),
             ("FORMATVER", r"Entity type resource version", "vanilla client entities still use 1.8.0 or 1.10.0"),
             ("UNLINK", r"vanilla texture", "linking a vanilla texture is intended in UI files")]
MCT_CAUTION = [("ENTITYTYPE130|FORMATVER", r"(?i)entity", "before raising an entity format_version, rerun "
                "components and a BDS self-test: newer versions reject legacy components")]


def mct_command(root, a):
    b = a["mct_bin"]
    if b:
        return ([sys.executable, b] if b.endswith(".py") else ["node", b] if b.endswith((".js", ".mjs")) else [b]), "--mct-bin"
    local = root / "node_modules" / ".bin" / ("mct.cmd" if os.name == "nt" else "mct")
    if local.is_file():
        return [str(local)], "project node_modules"
    if shutil.which("mct"):
        return [shutil.which("mct")], "PATH"
    if a["mct_npx"] and shutil.which("npx"):
        return [shutil.which("npx"), "-y", MCT_PKG], "npx -y " + MCT_PKG
    return None, None


def check_mct(pj, a, h):
    if not (a["mct"] or a["mct_npx"] or a["mct_bin"]):
        return h.skip("Creator Tools validation is opt-in; pass --mct, --mct-npx or --mct-bin")
    cmd, via = mct_command(pj.root, a)
    if not cmd:
        return h.skip("mct not in node_modules or on PATH; npm i -g @minecraft/creator-tools, or --mct-npx (downloads %s)" % MCT_PKG)
    tmp = Path(tempfile.mkdtemp(prefix="mw-mct-"))
    try:
        # Only the packs: mct counts art, tests and configs in a project folder as errors.
        for pack in pj.packs:
            sub = "resource_packs" if pj.kind(pack) == "resource" else "behavior_packs"
            shutil.copytree(pack, tmp / "in" / sub / pack.name, ignore=shutil.ignore_patterns(*h.SKIP_DIRS))
        (tmp / "out").mkdir()
        r = h.run(cmd + ["validate", "-i", str(tmp / "in"), "--json", "--force", "-o", str(tmp / "out")], pj.root, full=True)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    out = r.pop("full")
    try:
        data = json.loads(out[out.index("{"):out.rindex("}") + 1])
    except ValueError:
        r["reason"] = "no JSON report from mct"
        return r
    errors, warnings, noise = [], [], []
    for i in (i for p in data.get("projects", []) for i in p.get("items", [])):
        if i.get("type") not in ("error", "warning", "recommendation"):
            continue
        line = "%s %s %s: %s %s" % (i["type"], i.get("generatorId"), i.get("path", ""), i.get("message"), i.get("data", ""))
        why = next((w for g, rx, w in MCT_NOISE if i.get("generatorId") == g and re.search(rx, line)), None)
        if why:
            noise.append("%s (noise: %s)" % (line.strip(), why))
            continue
        tip = next((w for g, rx, w in MCT_CAUTION if re.match(g, str(i.get("generatorId"))) and re.search(rx, line)), None)
        (errors if i["type"] == "error" else warnings).append(line.strip() + (" (caution: %s)" % tip if tip else ""))
    return h.result(errors, warnings, {"via": via, "noise": noise, "exit": r["exit"], "seconds": r["seconds"],
                                     "totals": {k: data.get(k) for k in ("errors", "warnings", "recommendations")}})
