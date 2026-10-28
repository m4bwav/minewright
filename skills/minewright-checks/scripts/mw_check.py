"""Check a Minecraft Bedrock add-on without the game and print one JSON object.

Usage (from anywhere; stdlib only, Python 3.9+):
    python mw_check.py [project_dir] [--only a,b] [--skip a,b] [--mct | --mct-npx | --mct-bin PATH]

Packs are the folders under project_dir that hold a manifest.json (.git, node_modules, dist,
__pycache__, .bds, build and lib are skipped). Checks, in order:
  json         every .json file in every pack parses (// and /* */ comments are stripped first, as
               Bedrock tolerates them)
  manifest     format_version 2, valid and unique UUIDs, version arrays, min_engine_version, module
               types, a script module's entry file exists, pack dependencies resolve inside the project,
               no beta script modules (warning)
  identifiers  one namespace for custom ids (warning otherwise), every behavior-pack entity has a
               resource-pack client entity, and client entities point at textures, geometry and render
               controllers that exist
  components   behavior-pack entities do not use components the game rejects at their format_version
               (minecraft:pushable at 1.26.10 and later)
  typescript   npx --no-install tsc --noEmit, when package.json and tsconfig.json exist
  lint         npx --no-install eslint ., when an ESLint config exists
  mct          Creator Tools (mct validate --json --force) on a temporary copy holding only the packs, with
               known false positives moved to "noise". --mct uses mct from node_modules or PATH; --mct-npx
               runs @minecraft/creator-tools through npx -y (a download); --mct-bin names the executable.
  test         npm test, when package.json has a real test script
Each check is "pass", "fail" or "skip" (with the reason). Exit 0 when nothing failed, 1 when a check
failed, 2 for a usage error or when no pack was found. It never raises: a crash is reported in the JSON.
Nothing is downloaded except with --mct-npx: npx runs with --no-install, so a missing tool is a skip.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mw_mct  # noqa: E402

CHECKS = ["json", "manifest", "identifiers", "components", "typescript", "lint", "mct", "test"]
SKIP_DIRS = {".git", "node_modules", "dist", "__pycache__", ".bds", "build", "lib"}
UUID = re.compile(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")
MODULE_TYPES = {"data", "resources", "script", "client_data", "interface", "world_template", "skin_pack"}
VANILLA_RC = {"controller.render.default", "controller.render.item_default"}
TAIL = 25
# Components the game refuses from an entity format_version on (first version, what to use instead).
LEGACY = {"minecraft:pushable": ((1, 26, 10), "use minecraft:pushable_by_entity and minecraft:pushable_by_block "
                                 "({} each) or neither; BDS 1.26.60.6 refused the whole entity at 1.26.50")}
TIMEOUT = 600


def strip_comments(text):
    """Remove // and /* */ comments outside strings."""
    out, i, n, in_str = [], 0, len(text), False
    while i < n:
        c = text[i]
        if in_str:
            out.append(c)
            if c == "\\" and i + 1 < n:
                out.append(text[i + 1])
                i += 1
            elif c == '"':
                in_str = False
        elif c == '"':
            in_str = True
            out.append(c)
        elif text.startswith("//", i):
            while i < n and text[i] != "\n":
                i += 1
            continue
        elif text.startswith("/*", i):
            end = text.find("*/", i + 2)
            i = n if end < 0 else end + 2
            continue
        else:
            out.append(c)
        i += 1
    return "".join(out)


def find_packs(project):
    packs = []
    for dp, dns, fns in os.walk(project):
        dns[:] = sorted(d for d in dns if d not in SKIP_DIRS)
        if "manifest.json" in fns:
            packs.append(Path(dp))
            dns[:] = []
    return packs


def pack_files(pack, suffix=".json"):
    for dp, dns, fns in os.walk(pack):
        dns[:] = sorted(d for d in dns if d not in SKIP_DIRS)
        for f in sorted(fns):
            if f.endswith(suffix):
                yield Path(dp) / f


class Project:
    def __init__(self, root):
        self.root = root
        self.packs = find_packs(root)
        self.docs = {}      # path -> parsed JSON
        self.bad = {}       # path -> error

    def rel(self, p):
        return Path(os.path.relpath(p, self.root)).as_posix()

    def parse_all(self):
        for pack in self.packs:
            for f in pack_files(pack):
                try:
                    self.docs[f] = json.loads(strip_comments(f.read_text(encoding="utf-8-sig")))
                except (OSError, ValueError) as e:
                    self.bad[f] = str(e)

    def manifest(self, pack):
        return self.docs.get(pack / "manifest.json")

    def kind(self, pack):
        m = self.manifest(pack) or {}
        types = {mod.get("type") for mod in m.get("modules", []) if isinstance(mod, dict)}
        return "resource" if "resources" in types else "behavior"


def result(errors, warnings=None, info=None):
    r = {"status": "fail" if errors else "pass", "errors": errors, "warnings": warnings or []}
    if info:
        r.update(info)
    return r


def skip(reason):
    return {"status": "skip", "reason": reason}


def is_version(v):
    if isinstance(v, list):
        return len(v) == 3 and all(isinstance(x, int) and x >= 0 for x in v)
    return isinstance(v, str) and re.match(r"^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$", v) is not None


def check_json(pj):
    return result(["%s: %s" % (pj.rel(f), e) for f, e in sorted(pj.bad.items())],
                  info={"files": len(pj.docs) + len(pj.bad)})


def check_manifest(pj):
    errors, warnings, seen = [], [], {}
    headers = {}
    for pack in pj.packs:
        m = pj.manifest(pack)
        where = pj.rel(pack / "manifest.json")
        if not isinstance(m, dict):
            errors.append("%s: missing or does not parse" % where)
            continue
        if m.get("format_version") != 2:
            errors.append("%s: format_version is %r, expected 2" % (where, m.get("format_version")))
        h = m.get("header") or {}
        for key in ("name", "uuid", "version"):
            if key not in h:
                errors.append("%s: header.%s missing" % (where, key))
        if "version" in h and not is_version(h["version"]):
            errors.append("%s: header.version %r is not [major, minor, patch] or a semver string" % (where, h["version"]))
        mev = h.get("min_engine_version")
        if mev is None:
            warnings.append("%s: header.min_engine_version missing" % where)
        elif not (isinstance(mev, list) and len(mev) == 3 and all(isinstance(x, int) for x in mev)):
            errors.append("%s: header.min_engine_version %r is not [1, x, y]" % (where, mev))
        ids = [("header", h.get("uuid"))]
        if h.get("uuid"):
            headers[str(h["uuid"]).lower()] = pack
        mods = m.get("modules")
        if not isinstance(mods, list) or not mods:
            errors.append("%s: no modules" % where)
            mods = []
        for i, mod in enumerate(mods):
            if not isinstance(mod, dict):
                continue
            ids.append(("modules[%d]" % i, mod.get("uuid")))
            if mod.get("type") not in MODULE_TYPES:
                errors.append("%s: modules[%d].type %r is unknown" % (where, i, mod.get("type")))
            if "version" in mod and not is_version(mod["version"]):
                errors.append("%s: modules[%d].version %r is not a version" % (where, i, mod["version"]))
            if mod.get("type") == "script":
                if mod.get("language") != "javascript":
                    errors.append("%s: script module language must be \"javascript\"" % where)
                entry = mod.get("entry")
                if not entry or not (pack / entry).is_file():
                    errors.append("%s: script entry %r does not exist (build the TypeScript first?)" % (where, entry))
        for label, u in ids:
            if not isinstance(u, str) or not UUID.match(u):
                errors.append("%s: %s uuid %r is not a valid UUID" % (where, label, u))
                continue
            key = u.lower()
            if key in seen:
                errors.append("%s: %s uuid %s is also used in %s" % (where, label, u, seen[key]))
            else:
                seen[key] = "%s %s" % (where, label)
    for pack in pj.packs:
        m = pj.manifest(pack)
        if not isinstance(m, dict):
            continue
        where = pj.rel(pack / "manifest.json")
        for d in m.get("dependencies", []) or []:
            if not isinstance(d, dict):
                continue
            if d.get("module_name"):
                v = str(d.get("version", ""))
                if not v:
                    errors.append("%s: dependency %s has no version" % (where, d["module_name"]))
                elif "beta" in v or "alpha" in v or "preview" in v:
                    warnings.append("%s: %s %s needs the Beta APIs experiment, which is permanent on a world"
                                    % (where, d["module_name"], v))
            elif d.get("uuid"):
                if str(d["uuid"]).lower() not in headers:
                    warnings.append("%s: dependency %s is not a pack in this project" % (where, d["uuid"]))
                elif headers[str(d["uuid"]).lower()] == pack:
                    errors.append("%s: the pack depends on itself" % where)
    return result(errors, warnings, {"packs": [{"path": pj.rel(p), "kind": pj.kind(p)} for p in pj.packs]})


def collect(pj):
    """Definitions and references found across the packs."""
    bp_entities, client_entities, geometries, rcs, ns = {}, {}, set(), set(), set()
    for f, doc in pj.docs.items():
        if not isinstance(doc, dict):
            continue
        ent = doc.get("minecraft:entity")
        if isinstance(ent, dict):
            ident = (ent.get("description") or {}).get("identifier")
            if ident:
                bp_entities[ident] = f
        ce = doc.get("minecraft:client_entity")
        if isinstance(ce, dict):
            desc = ce.get("description") or {}
            if desc.get("identifier"):
                client_entities[desc["identifier"]] = (f, desc)
        geo = doc.get("minecraft:geometry")
        if isinstance(geo, list):
            for g in geo:
                gid = ((g or {}).get("description") or {}).get("identifier")
                if gid:
                    geometries.add(gid)
        for k in doc:
            if k.startswith("geometry."):
                geometries.add(k.split(":")[0])
        if isinstance(doc.get("render_controllers"), dict):
            rcs.update(doc["render_controllers"].keys())
        for key in ("minecraft:item", "minecraft:block"):
            ident = ((doc.get(key) or {}).get("description") or {}).get("identifier") if isinstance(doc.get(key), dict) else None
            if ident:
                ns.add(ident.split(":")[0])
    for ident in list(bp_entities) + list(client_entities):
        ns.add(ident.split(":")[0])
    return bp_entities, client_entities, geometries, rcs, ns


def check_identifiers(pj):
    errors, warnings = [], []
    bp_entities, client_entities, geometries, rcs, ns = collect(pj)
    custom_ns = sorted(n for n in ns if n != "minecraft")
    if len(custom_ns) > 1:
        warnings.append("more than one namespace in use: %s" % ", ".join(custom_ns))
    for n in custom_ns:
        if "." in n or not re.match(r"^[a-z0-9_]+$", n):
            warnings.append("namespace %r: use lowercase letters, digits and underscores only" % n)
    rp_roots = [p for p in pj.packs if pj.kind(p) == "resource"]
    for ident, f in sorted(bp_entities.items()):
        if ident.startswith("minecraft:"):
            continue
        if rp_roots and ident not in client_entities:
            errors.append("%s: entity %s has no client entity in the resource pack" % (pj.rel(f), ident))
    for ident, (f, desc) in sorted(client_entities.items()):
        root = next((p for p in rp_roots if str(f).startswith(str(p))), f.parent)
        for key, tex in (desc.get("textures") or {}).items():
            if isinstance(tex, str) and not any((root / (tex + ext)).is_file() for ext in (".png", ".tga", ".jpg", "")):
                errors.append("%s: texture %s (%s) not found as .png or .tga" % (pj.rel(f), key, tex))
        for key, gid in (desc.get("geometry") or {}).items():
            if isinstance(gid, str) and gid not in geometries and not gid.startswith("geometry.humanoid"):
                errors.append("%s: geometry %s (%s) is not defined in any model file" % (pj.rel(f), key, gid))
        for rc in desc.get("render_controllers") or []:
            rid = rc if isinstance(rc, str) else (next(iter(rc)) if isinstance(rc, dict) and rc else None)
            if not rid or rid in rcs or rid in VANILLA_RC:
                continue
            if any(n in rid for n in custom_ns):
                errors.append("%s: render controller %s is not defined" % (pj.rel(f), rid))
            else:
                warnings.append("%s: render controller %s is not in this project (vanilla?)" % (pj.rel(f), rid))
    return result(errors, warnings, {"namespaces": custom_ns, "entities": sorted(bp_entities),
                                     "client_entities": sorted(client_entities)})


def check_components(pj):
    errors = []
    for f, doc in sorted(pj.docs.items()):
        ent = doc.get("minecraft:entity") if isinstance(doc, dict) else None
        if not isinstance(ent, dict):
            continue
        try:
            fv = tuple(int(x) for x in str(doc.get("format_version", "0")).split("."))[:3]
        except ValueError:
            continue
        groups = [ent.get("components") or {}] + list((ent.get("component_groups") or {}).values())
        used = {k for g in groups if isinstance(g, dict) for k in g}
        for comp, (since, fix) in LEGACY.items():
            if comp in used and fv >= since:
                errors.append("%s: %s is not accepted at format_version %s (since %s); %s"
                              % (pj.rel(f), comp, doc.get("format_version"), ".".join(map(str, since)), fix))
    return result(errors)



def run(cmd, cwd, full=False):
    t0 = time.time()
    try:
        p = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace",
                           timeout=TIMEOUT)
        out, code = (p.stdout or "") + (p.stderr or ""), p.returncode
    except subprocess.TimeoutExpired:
        out, code = "timed out after %ds" % TIMEOUT, -1
    except OSError as e:
        out, code = str(e), -1
    lines = [l for l in out.splitlines() if l.strip()]
    r = {"status": "pass" if code == 0 else "fail", "exit": code, "seconds": round(time.time() - t0, 2),
         "command": " ".join(cmd), "output_tail": lines[-TAIL:]}
    if full:
        r["full"] = out
    return r


def node_checks(name, root):
    pkg = root / "package.json"
    npx, npm = shutil.which("npx"), shutil.which("npm")
    if not pkg.is_file():
        return skip("no package.json")
    if not (root / "node_modules").is_dir():
        return skip("node_modules missing; run npm ci (or npm install) first")
    if name == "typescript":
        if not (root / "tsconfig.json").is_file():
            return skip("no tsconfig.json")
        if not npx:
            return skip("npx not found (install Node.js)")
        if not (root / "node_modules" / "typescript").is_dir():
            return skip("typescript not installed in node_modules")
        return run([npx, "--no-install", "tsc", "--noEmit"], root)
    if name == "lint":
        configs = [c for c in os.listdir(root) if c.startswith("eslint.config.") or c.startswith(".eslintrc")]
        if not configs:
            return skip("no ESLint config")
        if not npx:
            return skip("npx not found (install Node.js)")
        if not (root / "node_modules" / "eslint").is_dir():
            return skip("eslint not installed in node_modules")
        return run([npx, "--no-install", "eslint", "."], root)
    try:
        script = (json.loads(pkg.read_text(encoding="utf-8-sig")).get("scripts") or {}).get("test", "")
    except ValueError:
        return {"status": "fail", "errors": ["package.json does not parse"]}
    if not script or "no test specified" in script:
        return skip("package.json has no test script")
    if not npm:
        return skip("npm not found (install Node.js)")
    return run([npm, "test", "--silent"], root)


def parse_args(argv):
    a = {"project": ".", "only": None, "skip": set(), "mct": False, "mct_npx": False, "mct_bin": None}
    it = iter(argv)
    for x in it:
        if x in ("--only", "--skip"):
            v = next(it, None)
            if v is None:
                raise ValueError("%s needs a value" % x)
            a[x[2:]] = set(v.split(","))
        elif x in ("--mct", "--mct-npx"):
            a[x[2:].replace("-", "_")] = True
        elif x == "--mct-bin":
            a["mct_bin"] = next(it, None)
            if not a["mct_bin"]:
                raise ValueError("--mct-bin needs a value")
        elif x in ("-h", "--help"):
            raise ValueError("help")
        elif x.startswith("--"):
            raise ValueError("unknown option %s" % x)
        else:
            a["project"] = x
    for name in (a["only"] or set()) | a["skip"]:
        if name not in CHECKS:
            raise ValueError("unknown check %s (known: %s)" % (name, ", ".join(CHECKS)))
    if a["only"] and "mct" in a["only"]:
        a["mct"] = True
    return a


def main(argv):
    try:
        a = parse_args(argv)
    except ValueError as e:
        if str(e) == "help":
            print(__doc__.strip())
            return 0
        print(json.dumps({"ok": False, "error": str(e)}))
        return 2
    root = Path(a["project"]).resolve()
    report = {"ok": True, "project": root.name, "checks": {}}
    if not root.is_dir():
        report.update(ok=False, error="not a folder: %s" % a["project"])
        print(json.dumps(report, indent=2))
        return 2
    pj = Project(root)
    if not pj.packs:
        report.update(ok=False, error="no manifest.json under %s; not a Bedrock add-on" % root)
        print(json.dumps(report, indent=2))
        return 2
    wanted = [c for c in CHECKS if (a["only"] is None or c in a["only"]) and c not in a["skip"]]
    try:
        pj.parse_all()
        for c in wanted:
            if c == "json":
                r = check_json(pj)
            elif c == "manifest":
                r = check_manifest(pj)
            elif c == "identifiers":
                r = check_identifiers(pj)
            elif c == "components":
                r = check_components(pj)
            elif c == "mct":
                r = mw_mct.check_mct(pj, a, sys.modules[__name__])
            else:
                r = node_checks(c, root)
            report["checks"][c] = r
            if r["status"] == "fail":
                report["ok"] = False
    except Exception as e:  # fail soft: the caller always gets JSON
        report.update(ok=False, error="%s: %s" % (type(e).__name__, e))
    report["summary"] = {s: sum(1 for r in report["checks"].values() if r["status"] == s) for s in ("pass", "fail", "skip")}
    print(json.dumps(report, indent=2))
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
