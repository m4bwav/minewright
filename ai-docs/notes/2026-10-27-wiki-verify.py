"""Verification program for the minewright wiki (minewright 0.1.0).

Runs every command the wiki's Checks-and-the-BDS-Harness page shows, against a copy of a checkout:
    python 2026-10-27-wiki-verify.py <checkout> [<demo folder>]
The demo folder gets copies of skills/ and examples/given-jar/ from the checkout, so the commands run from its
root exactly as the pages show them and the checkout itself is never written to. The unbuilt cases run first;
then `npm ci` and `npm run build` run in the example, and the built cases follow. Bedrock Dedicated Server must
already be in the user cache (this program never passes --download). Each case prints "=== label", then
"$ command", the merged stdout and stderr with run-specific values masked (seconds, times, temporary folders,
the cache folder, the Node folder, the port, the session id), then "$ echo $?" and the exit code.
"""
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

CHECKOUT = Path(sys.argv[1]).resolve()
DEMO = Path(sys.argv[2] if len(sys.argv) > 2 else Path.home() / "mw-wiki-demo").resolve()

CHECK = "python skills/minewright-checks/scripts/mw_check.py"
BDS = "python skills/minewright-server/scripts/bds_run.py"

# The commands the pages show, as text. Each runs from the demo folder.
UNBUILT = [
    ("check-help", CHECK + " --help"),
    ("bds-help", BDS + " --help"),
    ("check-unbuilt", CHECK + " examples/given-jar"),
    ("bds-unbuilt", BDS + ' examples/given-jar --cmd "scriptevent given_jar:selftest"'),
    ("check-no-pack", CHECK + " skills"),
    ("bds-not-cached", BDS + ' examples/given-jar --version 1.0.0.1 --cmd "scriptevent given_jar:selftest"'),
]
BUILD = ["npm ci", "npm run build"]
BUILT = [
    ("check-built", CHECK + " examples/given-jar"),
    ("check-only", CHECK + " examples/given-jar --only manifest,identifiers,components"),
    ("bds-built", BDS + ' examples/given-jar --cmd "scriptevent given_jar:selftest"'),
]


def setup():
    if DEMO.exists():
        shutil.rmtree(DEMO)
    DEMO.mkdir(parents=True)
    shutil.copytree(CHECKOUT / "skills", DEMO / "skills", ignore=shutil.ignore_patterns("__pycache__"))
    shutil.copytree(CHECKOUT / "examples/given-jar", DEMO / "examples/given-jar",
                    ignore=shutil.ignore_patterns("node_modules", "dist"))
    built = DEMO / "examples/given-jar/behavior_pack/scripts"
    if built.exists():
        shutil.rmtree(built)


def cache_root():
    if os.name == "nt":
        return Path(os.environ.get("LOCALAPPDATA", Path.home() / "AppData" / "Local")) / "minewright" / "bds"
    return Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache")) / "minewright" / "bds"


def mask(text):
    text = text.replace("\\\\", "\\")
    text = re.sub(r'"(seconds|startup_seconds)": [0-9.]+', r'"\1": <s>', text)
    text = re.sub(r"\(\d+(\.\d+)?ms\)", "(<ms>)", text)
    text = re.sub(r"duration_ms [0-9.]+", "duration_ms <ms>", text)
    text = re.sub(r"\[\d{4}-\d\d-\d\d \d\d:\d\d:\d\d:\d+ ", "[<time> ", text)
    text = re.sub(r'"port": \d+', '"port": <port>', text)
    text = re.sub(r'(server-port(v6)?\\?":\\?")\d+', r"\1<port>", text)
    text = re.sub(r"Accepting clients on \[::\]:\d+", "Accepting clients on [::]:<port>", text)
    text = re.sub(r"Session ID: [0-9a-f-]+", "Session ID: <id>", text)
    text = re.sub(r"[A-Za-z]:\\[^\"\s]*?mw-bds-[A-Za-z0-9_]+|/tmp/mw-bds-[A-Za-z0-9_]+", "<tmp>", text)
    text = text.replace(str(cache_root()), "<cache>")
    npx = shutil.which("npx")
    if npx:
        text = re.sub(re.escape(str(Path(npx).parent)), lambda m: "<node>", text, flags=re.I)
    text = re.sub(re.escape(str(DEMO)), lambda m: "<demo>", text, flags=re.I)
    text = re.sub(re.escape(str(Path.home())), lambda m: "~", text, flags=re.I)
    return text


def run(label, cmd, cwd):
    run_cmd = cmd.replace("python ", '"%s" ' % sys.executable, 1)
    r = subprocess.run(run_cmd, shell=True, cwd=cwd, capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    print("=== " + label)
    print("$ " + cmd)
    out = mask((r.stdout or "") + (r.stderr or "")).rstrip("\n")
    if out:
        print(out)
    print("$ echo $?")
    print(r.returncode)


def main():
    setup()
    print("=== installed")
    print(subprocess.run([sys.executable, "--version"], capture_output=True, text=True).stdout.strip())
    print("Node " + subprocess.run("node --version", shell=True, capture_output=True, text=True).stdout.strip())
    print("BDS cached: " + ", ".join(sorted(p.name for p in cache_root().glob("*"))))
    for label, cmd in UNBUILT:
        run(label, cmd, DEMO)
    example = DEMO / "examples/given-jar"
    for cmd in BUILD:
        r = subprocess.run(cmd, shell=True, cwd=example, capture_output=True, text=True, encoding="utf-8",
                           errors="replace")
        if r.returncode:
            print("=== build failed: " + cmd)
            print(mask(r.stdout + r.stderr))
            sys.exit(1)
    for label, cmd in BUILT:
        run(label, cmd, DEMO)
    log = DEMO / "console.txt"
    run("bds-built-log", BDS + ' examples/given-jar --cmd "scriptevent given_jar:selftest" --log console.txt', DEMO)
    print("=== bds-built-log-scripting")
    print("$ grep -E \"Scripting|Script event\" console.txt")
    for line in log.read_text(encoding="utf-8", errors="replace").splitlines():
        if "Scripting" in line or "Script event" in line:
            print(mask(line))
    run("example-pack", "python scripts/pack.py", example)


if __name__ == "__main__":
    main()
