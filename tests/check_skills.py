"""Structure checks for the minewright skills (stdlib only, Python 3.9+).

Run from the repository root: python tests/check_skills.py
Exits 1 and prints every problem when a check fails; prints one summary line when all pass.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKILLS = os.path.join(ROOT, "skills")
COMPANIONS = ["SKILL.md", "RESEARCH.md", "CHANGELOG.md", "LEARNINGS.md", "TESTS.md",
              "MAINTENANCE.md", "evergreen.json", os.path.join("evals", "evals.json")]
MAX_SKILL_LINES = 200          # AGENTS.md: skills stay under 200 lines
MAX_DESCRIPTION = 1024         # Agent Skills spec limit for the description field
SKIP_DIRS = {".git", "__pycache__", "dist", "node_modules", "scratch"}
LINK = re.compile(r"\[[^\]]*\]\(([^)\s]+)\)")
# Public-safety guards that name nothing private: an absolute path into someone's home folder
# (placeholders such as C:\Users\<you> are allowed) and AI attribution lines.
HOME_PATH = re.compile(r"(?i)\b[a-z]:[\\/]+users[\\/]+(?!<)[a-z0-9._-]+|/home/(?!<)[a-z0-9._-]+/|/Users/(?!<|Shared)[a-z0-9._-]+/")
ATTRIBUTION = re.compile(r"(?i)co-authored-by:|generated with (claude|chatgpt|copilot)|written by (claude|an ai)")
# Bedrock pack JSON may carry comments; these folders hold add-ons, so their JSON is parsed after stripping.
PACK_ROOTS = (os.path.join(ROOT, "tests", "fixtures"), os.path.join(ROOT, "examples"))

problems = []


def rel(p):
    return os.path.relpath(p, ROOT).replace(os.sep, "/")


def walk_files():
    for dp, dns, fns in os.walk(ROOT):
        dns[:] = [d for d in dns if d not in SKIP_DIRS]
        for f in fns:
            yield os.path.join(dp, f)


def strip_comments(text):
    return re.sub(r'("(?:\\.|[^"\\])*")|//[^\n]*|/\*.*?\*/', lambda m: m.group(1) or "", text, flags=re.S)


def frontmatter(text):
    if not text.startswith("---"):
        return None
    end = text.find("\n---", 3)
    if end < 0:
        return None
    fields = {}
    for line in text[3:end].strip().splitlines():
        m = re.match(r"^([A-Za-z_-]+):\s*(.*)$", line)
        if m:
            v = m.group(2).strip()
            if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
                v = v[1:-1]
            fields[m.group(1)] = v
    return fields


def check_evals(name, path):
    try:
        cases = json.load(open(path, encoding="utf-8")).get("evals", [])
    except (OSError, ValueError):
        return
    kinds = [(c.get("kind"), bool(c.get("decoy"))) for c in cases]
    if sum(1 for k, d in kinds if k == "trigger" and not d) < 2:
        problems.append(f"skills/{name}/evals/evals.json: fewer than two trigger prompts")
    if sum(1 for k, d in kinds if k == "trigger" and d) < 2:
        problems.append(f"skills/{name}/evals/evals.json: fewer than two decoys")
    if not any(c.get("kind") == "action" and c.get("evidence") for c in cases):
        problems.append(f"skills/{name}/evals/evals.json: no action case with evidence")
    if not any(c.get("kind") == "outcome" for c in cases):
        problems.append(f"skills/{name}/evals/evals.json: no outcome case")
    if "TODO" in json.dumps(cases):
        problems.append(f"skills/{name}/evals/evals.json: TODO left in a case")


def check_skills():
    names = sorted(d for d in os.listdir(SKILLS) if os.path.isdir(os.path.join(SKILLS, d)))
    if not names:
        problems.append("skills/: no skill folders")
    for name in names:
        d = os.path.join(SKILLS, name)
        for c in COMPANIONS:
            if not os.path.isfile(os.path.join(d, c)):
                problems.append(f"skills/{name}: missing {c.replace(os.sep, '/')}")
        sk = os.path.join(d, "SKILL.md")
        if os.path.isfile(sk):
            text = open(sk, encoding="utf-8").read()
            fm = frontmatter(text)
            if fm is None:
                problems.append(f"skills/{name}/SKILL.md: no YAML frontmatter")
            else:
                if fm.get("name") != name:
                    problems.append(f"skills/{name}/SKILL.md: frontmatter name {fm.get('name')!r} differs from the folder")
                desc = fm.get("description", "")
                if not desc:
                    problems.append(f"skills/{name}/SKILL.md: empty description")
                elif len(desc) > MAX_DESCRIPTION:
                    problems.append(f"skills/{name}/SKILL.md: description is {len(desc)} characters (limit {MAX_DESCRIPTION})")
                if "TODO" in desc or "<" in desc:
                    problems.append(f"skills/{name}/SKILL.md: description has a TODO or an angle bracket")
                if f"refresh {name}" not in desc:
                    problems.append(f"skills/{name}/SKILL.md: description lacks the 'refresh {name}' trigger")
                if not any(s in desc for s in names if s != name):
                    problems.append(f"skills/{name}/SKILL.md: description names no sibling skill")
            n = text.count("\n") + 1
            if n > MAX_SKILL_LINES:
                problems.append(f"skills/{name}/SKILL.md: {n} lines (budget {MAX_SKILL_LINES})")
            if re.search(r"^## Step 1: <", text, re.M) or "<One paragraph" in text:
                problems.append(f"skills/{name}/SKILL.md: template placeholder left in")
        eg = os.path.join(d, "evergreen.json")
        if os.path.isfile(eg):
            try:
                st = json.load(open(eg, encoding="utf-8"))
                if st.get("name") != name:
                    problems.append(f"skills/{name}/evergreen.json: name {st.get('name')!r} differs from the folder")
                for k in ("tier", "last_checked", "next_due", "protocol"):
                    if k not in st:
                        problems.append(f"skills/{name}/evergreen.json: missing {k}")
                if st.get("source"):
                    problems.append(f"skills/{name}/evergreen.json: source must be null in the repository (it is a local path)")
            except ValueError:
                pass  # reported by check_json
        check_evals(name, os.path.join(d, "evals", "evals.json"))
    return names


def check_json():
    for f in walk_files():
        if f.endswith(".json"):
            try:
                text = open(f, encoding="utf-8-sig").read()
                if f.startswith(PACK_ROOTS):
                    text = strip_comments(text)
                json.loads(text)
            except ValueError as e:
                problems.append(f"{rel(f)}: invalid JSON ({e})")
    for manifest in (os.path.join(ROOT, ".claude-plugin", "plugin.json"), os.path.join(ROOT, "plugin.json")):
        try:
            m = json.load(open(manifest, encoding="utf-8"))
            if not re.match(r"^\d+\.\d+\.\d+$", str(m.get("version", ""))):
                problems.append(f"{rel(manifest)}: version is not X.Y.Z")
        except (OSError, ValueError):
            problems.append(f"{rel(manifest)}: missing or unreadable")
    try:
        a = json.load(open(os.path.join(ROOT, ".claude-plugin", "plugin.json"), encoding="utf-8"))
        b = json.load(open(os.path.join(ROOT, "plugin.json"), encoding="utf-8"))
        if a.get("version") != b.get("version"):
            problems.append("plugin.json and .claude-plugin/plugin.json disagree on the version")
    except (OSError, ValueError):
        pass


def check_links_and_text():
    for f in walk_files():
        if not f.endswith((".md", ".json", ".ps1", ".py", ".yml", ".ts", ".js", ".txt")):
            continue
        text = open(f, encoding="utf-8", errors="replace").read()
        if f.endswith(".md"):
            # inline code spans are not links
            for target in LINK.findall(re.sub(r"`[^`\n]*`", "", text)):
                if re.match(r"^(https?:|mailto:|#)", target):
                    continue
                path = target.split("#", 1)[0]
                if path and not os.path.exists(os.path.normpath(os.path.join(os.path.dirname(f), path))):
                    # examples/ is built in its own branch; a README link to it may land before the folder does
                    if not path.startswith("examples/"):
                        problems.append(f"{rel(f)}: broken relative link {target}")
        if os.path.abspath(f) == os.path.abspath(__file__):
            continue
        m = HOME_PATH.search(text)
        if m:
            problems.append(f"{rel(f)}: absolute home-folder path {m.group(0)!r}; use a placeholder")
        a = ATTRIBUTION.search(text)
        if a:
            problems.append(f"{rel(f)}: AI attribution {a.group(0)!r}")


if __name__ == "__main__":
    names = check_skills()
    check_json()
    check_links_and_text()
    if problems:
        print(f"{len(problems)} problem(s):")
        for p in problems:
            print(" - " + p)
        sys.exit(1)
    print(f"ok: {len(names)} skills, companions, manifests, links and text guards")
