"""Run a Bedrock add-on on a throwaway Bedrock Dedicated Server (BDS) and print one JSON report.

Usage (stdlib only, Python 3.9+; BDS ships for Windows and Linux):
    python bds_run.py PROJECT [--download] [--cmd "scriptevent ns:selftest"]... [--expect NAME]...

1. BDS comes from the user cache (%LOCALAPPDATA%\\minewright\\bds\\VERSION or ~/.cache/minewright/bds/VERSION).
   Nothing is downloaded without --download, which means the user accepted the Minecraft EULA.
2. BDS is copied to a temporary instance. Every folder under PROJECT with a manifest.json goes into the world
   and is listed in world_behavior_packs.json / world_resource_packs.json. server.properties gets a test
   world, a free port, cheats on, an empty allow-list and the content log on the console; script modules the
   packs need are added to config/default/permissions.json.
3. The server starts; after "Server started" each --cmd is sent to the console, which is read for
   [MWTEST] PASS name | [MWTEST] FAIL name why | [MWTEST] DONE and script errors, until DONE, every --expect
   name, or --wait seconds. Then "stop".
4. One JSON object. Exit 0: started, a PASS, no FAIL, no missing --expect, no script error. 1: the run
   failed. 2: usage or setup error. Nothing secret is read or printed.
"""
import argparse
import json
import os
import queue
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import threading
import time
import urllib.request
import zipfile
from pathlib import Path

DEFAULT_VERSION = "1.26.60.6"
URL = "https://www.minecraft.net/bedrockdedicatedserver/bin-{plat}/bedrock-server-{ver}.zip"
MARK = re.compile(r"\[MWTEST\]\s+(PASS|FAIL|DONE)(?:\s+(\S+))?(?:\s+(.*))?")
STARTED = re.compile(r"Server started", re.I)
# Script and pack problems BDS prints on the console (content log with console output on).
ERROR = re.compile(r"\[(?:Scripting|Scripts?)\].*(?:error|exception|uncaught)|\bERROR\]|Plugin.*(?:error|failed)"
                   r"|failed to load|is not a valid|No pack found|unable to", re.I)
SKIP_DIRS = {".git", "node_modules", "dist", "__pycache__", ".bds"}
TAIL = 60


def cache_root():
    if os.name == "nt":
        base = Path(os.environ.get("LOCALAPPDATA", Path.home() / "AppData" / "Local"))
    else:
        base = Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache"))
    return base / "minewright" / "bds"


def platform_name():
    if sys.platform.startswith("win"):
        return "win"
    if sys.platform.startswith("linux"):
        return "linux"
    return None


def exe_name():
    return "bedrock_server.exe" if os.name == "nt" else "bedrock_server"


def strip_comments(text):
    """Remove // and /* */ comments outside strings (Bedrock tolerates them in pack JSON)."""
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


def load_json(path):
    return json.loads(strip_comments(Path(path).read_text(encoding="utf-8-sig")))


def as_version(v):
    if isinstance(v, list):
        return v
    if isinstance(v, str):
        try:
            return [int(x) for x in v.split("-")[0].split(".")][:3]
        except ValueError:
            return v
    return v


def find_packs(project):
    """Every folder under PROJECT with a manifest.json, classified as behavior or resource pack."""
    packs = []
    for dp, dns, fns in os.walk(project):
        dns[:] = sorted(d for d in dns if d not in SKIP_DIRS)
        if "manifest.json" in fns:
            dns[:] = []
            try:
                m = load_json(Path(dp) / "manifest.json")
            except (OSError, ValueError) as e:
                packs.append({"dir": dp, "error": "manifest.json does not parse: %s" % e})
                continue
            types = {mod.get("type") for mod in m.get("modules", []) if isinstance(mod, dict)}
            header = m.get("header", {})
            packs.append({"dir": dp, "kind": "resource" if "resources" in types else "behavior",
                          "uuid": header.get("uuid"), "version": as_version(header.get("version")),
                          "name": header.get("name", Path(dp).name),
                          "modules": [d.get("module_name") for d in m.get("dependencies", [])
                                      if isinstance(d, dict) and d.get("module_name")]})
    return packs


def free_port():
    """A UDP port nothing is bound to now, so a test server does not clash with a real one."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.bind(("0.0.0.0", 0))
        return min(s.getsockname()[1], 65534)
    finally:
        s.close()


def download(version, dest, plat):
    url = URL.format(plat=plat, ver=version)
    dest.mkdir(parents=True, exist_ok=True)
    part = dest.parent / ("bedrock-server-%s.zip.part" % version)
    # minecraft.net closes the connection for some agents (curl's default, and one with a URL in it).
    req = urllib.request.Request(url, headers={"User-Agent": "minewright-bds-run/0.1", "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=300) as r, open(part, "wb") as f:
        shutil.copyfileobj(r, f, 1 << 20)
    with zipfile.ZipFile(part) as z:
        z.extractall(dest)
    part.unlink()
    exe = dest / exe_name()
    if os.name != "nt" and exe.exists():
        exe.chmod(0o755)
    (dest / ".minewright-complete").write_text(url + "\n", encoding="utf-8")
    return url


def set_properties(path, values):
    lines = path.read_text(encoding="utf-8").splitlines() if path.exists() else []
    seen, out = set(), []
    for line in lines:
        key = line.split("=", 1)[0].strip()
        if not line.lstrip().startswith("#") and "=" in line and key in values:
            out.append("%s=%s" % (key, values[key]))
            seen.add(key)
        else:
            out.append(line)
    out += ["%s=%s" % (k, v) for k, v in values.items() if k not in seen]
    path.write_text("\n".join(out) + "\n", encoding="utf-8")


def setup_instance(bds, instance, packs, level, port):
    """Copy BDS into INSTANCE and build the world with the packs active."""
    shutil.copytree(bds, instance, ignore=shutil.ignore_patterns("worlds", ".minewright-complete", "*.zip.part"),
                    dirs_exist_ok=True)
    world = instance / "worlds" / level
    entries = {"behavior": [], "resource": []}
    for p in packs:
        sub = "behavior_packs" if p["kind"] == "behavior" else "resource_packs"
        name = re.sub(r"[^A-Za-z0-9_.-]", "_", Path(p["dir"]).name) or "pack"
        shutil.copytree(p["dir"], world / sub / name, ignore=shutil.ignore_patterns(*SKIP_DIRS), dirs_exist_ok=True)
        entries[p["kind"]].append({"pack_id": p["uuid"], "version": p["version"]})
    world.mkdir(parents=True, exist_ok=True)
    (world / "world_behavior_packs.json").write_text(json.dumps(entries["behavior"], indent=2), encoding="utf-8")
    (world / "world_resource_packs.json").write_text(json.dumps(entries["resource"], indent=2), encoding="utf-8")
    set_properties(instance / "server.properties", {
        "server-name": "minewright-test", "level-name": level, "level-seed": "1", "gamemode": "creative",
        "server-port": str(port), "server-portv6": str(port + 1), "allow-cheats": "true", "allow-list": "true",
        "max-players": "2", "content-log-console-output-enabled": "true", "texturepack-required": "false",
    })
    allow = instance / "allowlist.json"
    if not allow.exists():
        allow.write_text("[]", encoding="utf-8")
    perm = instance / "config" / "default" / "permissions.json"
    added = []
    if any(p["modules"] for p in packs):
        try:
            data = load_json(perm) if perm.exists() else {}
        except (OSError, ValueError):
            data = {}
        mods = data.setdefault("allowed_modules", [])
        for p in packs:
            for m in p["modules"]:
                if m not in mods:
                    mods.append(m)
                    added.append(m)
        perm.parent.mkdir(parents=True, exist_ok=True)
        perm.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return {"world": str(world), "port": port, "packs": entries, "permissions_added": added}


def reader(stream, q):
    for line in iter(stream.readline, ""):
        q.put(line.rstrip("\r\n"))
    q.put(None)


def run_server(cmd, cwd, commands, expect, start_timeout, wait, env, log=None):
    t0 = time.time()
    res = {"started": False, "startup_seconds": None, "started_line": None, "commands_sent": [],
           "markers": [], "errors": [], "stopped_cleanly": False, "lines": 0}
    tail = []
    try:
        proc = subprocess.Popen(cmd, cwd=cwd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                text=True, encoding="utf-8", errors="replace", bufsize=1, env=env)
    except OSError as e:
        res["error"] = "could not start the server: %s" % e
        return res, tail
    q = queue.Queue()
    threading.Thread(target=reader, args=(proc.stdout, q), daemon=True).start()
    state = {"done": False, "eof": False}
    seen = set()

    def take(timeout):
        try:
            line = q.get(timeout=timeout)
        except queue.Empty:
            return False
        if line is None:
            state["eof"] = True
            return False
        handle(line)
        return line

    def handle(line):
        res["lines"] += 1
        if log:
            log.write(line + "\n")
        tail.append(line)
        del tail[:-TAIL]
        m = MARK.search(line)
        if m:
            kind, name, why = m.group(1), m.group(2), (m.group(3) or "").strip()
            if kind == "DONE":
                state["done"] = True
            else:
                res["markers"].append({"result": kind, "name": name, "detail": why})
                seen.add(name)
        elif ERROR.search(line):
            res["errors"].append(line.strip()[:400])

    def send(text):
        try:
            proc.stdin.write(text + "\n")
            proc.stdin.flush()
            return True
        except (OSError, ValueError):
            return False

    deadline = t0 + start_timeout
    while time.time() < deadline and not state["eof"]:
        line = take(0.5)
        if line and STARTED.search(line):
            res.update(started=True, started_line=line.strip(), startup_seconds=round(time.time() - t0, 1))
            break
        if not line and proc.poll() is not None and q.empty():
            break
    if res["started"]:
        for c in commands:
            if send(c):
                res["commands_sent"].append(c)
            time.sleep(0.2)
        end = time.time() + wait
        while time.time() < end and not state["eof"]:
            if state["done"] or (expect and set(expect) <= seen):
                break
            take(0.5)
    elif proc.poll() is None:
        res["error"] = "no 'Server started' line within %ds" % start_timeout
    else:
        res["error"] = "the server exited with code %s before it started" % proc.returncode
    if proc.poll() is None:
        send("stop")
        stop_end = time.time() + 30
        while time.time() < stop_end and proc.poll() is None:
            take(0.5)
        if proc.poll() is None:
            proc.kill()
        else:
            res["stopped_cleanly"] = True
    else:
        res["stopped_cleanly"] = proc.returncode == 0
    try:
        proc.wait(timeout=10)
    except subprocess.TimeoutExpired:
        pass
    while take(0.2):
        pass
    res["exit"] = proc.returncode
    res["seconds"] = round(time.time() - t0, 1)
    return res, tail


def parse_args(argv):
    p = argparse.ArgumentParser(prog="bds_run.py", description=__doc__.split("\n\n")[0],
                                formatter_class=argparse.RawDescriptionHelpFormatter,
                                epilog="Prints one JSON object on stdout. Full notes: the docstring at the top of this file.")
    p.add_argument("project", help="add-on project folder (every folder under it with a manifest.json is a pack)")
    p.add_argument("--version", default=DEFAULT_VERSION, help="BDS version to use (default %(default)s)")
    p.add_argument("--download", action="store_true",
                   help="download BDS into the user cache if it is missing (you accept the Minecraft EULA)")
    p.add_argument("--bds-dir", help="use an already extracted BDS folder instead of the cache")
    p.add_argument("--cmd", action="append", default=[], help="console command to send after start (repeatable)")
    p.add_argument("--cmd-file", help="file with one console command per line")
    p.add_argument("--expect", action="append", default=[],
                   help="marker name that must report PASS (repeatable); the run ends early when all are seen")
    p.add_argument("--wait", type=float, default=20, help="seconds to read markers after the commands (default 20)")
    p.add_argument("--start-timeout", type=float, default=180, help="seconds to wait for startup (default 180)")
    p.add_argument("--port", type=int, default=0, help="IPv4 port (default: a free one; IPv6 uses port+1)")
    p.add_argument("--level", default="mwtest", help="world folder name (default %(default)s)")
    p.add_argument("--instance", help="instance folder to build (default: a new temporary folder)")
    p.add_argument("--keep", action="store_true", help="keep the instance folder after the run")
    p.add_argument("--log", help="also write the whole server console to this file")
    p.add_argument("--setup-only", action="store_true", help="build the instance and world, do not start the server")
    p.add_argument("--server-cmd", help=argparse.SUPPRESS)  # tests: run a fake server instead of BDS
    return p.parse_args(argv)


def emit(report, code):
    print(json.dumps(report, indent=2))
    return code


def main(argv):
    try:
        a = parse_args(argv)
    except SystemExit as e:
        return 0 if e.code == 0 else 2
    report = {"ok": False, "bds_version": a.version, "project": None}
    project = Path(a.project).resolve()
    if not project.is_dir():
        report["error"] = "project folder not found: %s" % a.project
        return emit(report, 2)
    report["project"] = project.name
    commands = list(a.cmd)
    if a.cmd_file:
        try:
            commands += [l.strip() for l in Path(a.cmd_file).read_text(encoding="utf-8").splitlines()
                         if l.strip() and not l.lstrip().startswith("#")]
        except OSError as e:
            report["error"] = "cannot read --cmd-file: %s" % e
            return emit(report, 2)
    packs = find_packs(project)
    bad = [p for p in packs if "error" in p]
    if bad:
        report["error"] = "; ".join("%s: %s" % (Path(p["dir"]).name, p["error"]) for p in bad)
        return emit(report, 2)
    if not packs:
        report["error"] = "no manifest.json under %s; not a Bedrock add-on" % project
        return emit(report, 2)
    report["packs"] = [{"name": p["name"], "kind": p["kind"], "uuid": p["uuid"]} for p in packs]

    if a.bds_dir:
        bds = Path(a.bds_dir).resolve()
        if not (bds / "server.properties").exists():
            report["error"] = "--bds-dir has no server.properties: %s" % bds
            return emit(report, 2)
    else:
        plat = platform_name()
        if plat is None:
            report["error"] = "BDS ships for Windows and Linux only; on macOS run it in a Linux VM or container"
            return emit(report, 2)
        bds = cache_root() / a.version
        if not (bds / ".minewright-complete").exists():
            if not a.download:
                report["error"] = ("BDS %s is not in the cache. Rerun with --download to fetch it from minecraft.net "
                                   "(that means you accept the Minecraft EULA), or pass --bds-dir." % a.version)
                report["cache"] = str(bds)
                return emit(report, 2)
            try:
                shutil.rmtree(bds, ignore_errors=True)
                report["downloaded"] = download(a.version, bds, plat)
            except Exception as e:  # fail soft
                report["error"] = "download failed: %s: %s" % (type(e).__name__, e)
                return emit(report, 2)
    report["bds_dir"] = str(bds)

    temp = not a.instance
    instance = Path(a.instance).resolve() if a.instance else Path(tempfile.mkdtemp(prefix="mw-bds-"))
    remove = temp and not a.keep and not a.setup_only
    report["instance"] = None if remove else str(instance)
    try:
        report["setup"] = setup_instance(bds, instance, packs, a.level, a.port or free_port())
        if a.setup_only:
            report["ok"] = True
            report["note"] = "setup only; server not started"
            return emit(report, 0)
        if a.server_cmd:
            cmd = json.loads(a.server_cmd) if a.server_cmd.startswith("[") else a.server_cmd.split()
        else:
            exe = instance / exe_name()
            if not exe.exists():
                report["error"] = "%s missing in %s" % (exe_name(), bds)
                return emit(report, 2)
            cmd = [str(exe)]
        env = dict(os.environ)
        if os.name != "nt":
            env["LD_LIBRARY_PATH"] = str(instance) + os.pathsep + env.get("LD_LIBRARY_PATH", "")
        log = open(a.log, "w", encoding="utf-8") if a.log else None
        try:
            res, tail = run_server(cmd, instance, commands, a.expect, a.start_timeout, a.wait, env, log)
        finally:
            if log:
                log.close()
        report.update(res)
        passes = {m["name"] for m in res["markers"] if m["result"] == "PASS"}
        fails = [m for m in res["markers"] if m["result"] == "FAIL"]
        missing = [n for n in a.expect if n not in passes]
        report["summary"] = {"pass": len(passes), "fail": len(fails), "missing": missing, "errors": len(res["errors"])}
        problems = []
        if not res["started"]:
            problems.append(res.get("error", "server did not start"))
        elif not passes:
            problems.append("no [MWTEST] PASS marker seen; did the add-on load and did the command reach it?")
        if fails:
            problems.append("%d FAIL marker(s)" % len(fails))
        if missing:
            problems.append("expected markers missing: %s" % ", ".join(missing))
        if res["errors"]:
            problems.append("%d script or content error line(s)" % len(res["errors"]))
        report["problems"] = problems
        report["ok"] = not problems
        if not report["ok"]:
            report["console_tail"] = tail
        return emit(report, 0 if report["ok"] else 1)
    except Exception as e:  # fail soft: the caller always gets JSON
        report["ok"] = False
        report["error"] = "%s: %s" % (type(e).__name__, e)
        return emit(report, 1)
    finally:
        if remove:
            shutil.rmtree(instance, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
