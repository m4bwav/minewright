"""Tests for the two scripts (stdlib unittest). Run from the repository root: python tests/test_scripts.py

mw_check.py runs on tests/fixtures/addon (must pass) and on a broken copy made at test time (must fail the
json, manifest and identifiers checks). bds_run.py is tested without a real server: argument handling, the
no-download guard, world setup against a fake BDS folder, and the marker loop against a fake server written
in Python. When BDS is already in the user cache (bds_run.py --download put it there), one more test runs the
fixture on the real server; otherwise that test is skipped and says so.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CHECK = ROOT / "skills" / "minewright-checks" / "scripts" / "mw_check.py"
BDS = ROOT / "skills" / "minewright-server" / "scripts" / "bds_run.py"
FIXTURE = ROOT / "tests" / "fixtures" / "addon"
BDS_VERSION = "1.26.60.6"

FAKE_SERVER = r'''
import sys
print("[2026-01-01 00:00:00:000 INFO] Starting Server", flush=True)
print("[2026-01-01 00:00:00:000 INFO] Server started.", flush=True)
for line in sys.stdin:
    line = line.strip()
    if line == "scriptevent fixture:selftest":
        print("[2026-01-01 00:00:01:000 WARN] [Scripting] [MWTEST] PASS fixture", flush=True)
        print("[2026-01-01 00:00:01:000 WARN] [Scripting] [MWTEST] FAIL other it broke", flush=True)
        print("[2026-01-01 00:00:01:000 ERROR] [Scripting] [fixture BP] ReferenceError: 'x' is not defined", flush=True)
        print("[2026-01-01 00:00:01:000 WARN] [Scripting] [MWTEST] DONE", flush=True)
    elif line == "scriptevent fixture:good":
        print("[2026-01-01 00:00:01:000 WARN] [Scripting] [MWTEST] PASS fixture", flush=True)
        print("[2026-01-01 00:00:01:000 WARN] [Scripting] [MWTEST] DONE", flush=True)
    elif line == "stop":
        print("Quit correctly", flush=True)
        sys.exit(0)
'''


# Stands in for Creator Tools' `mct validate -i DIR --json --force -o OUT`; its findings mimic 0.20.0's output.
FAKE_MCT = r'''
import json, os, sys
args = sys.argv[1:]
assert args[0] == "validate" and "--json" in args and "--force" in args, args
src = args[args.index("-i") + 1]
assert sorted(os.listdir(src)) == ["behavior_packs", "resource_packs"], os.listdir(src)
assert os.path.isdir(args[args.index("-o") + 1])
items = [
    {"type": "testPass", "message": "fine", "generatorId": "CBFG"},
    {"type": "warning", "message": "JSON structure error", "generatorId": "COMJSON",
     "data": "(render_controllers.controller.render.fixture_dummy.uv_anim) is missing and it is required",
     "path": "/resource_packs/resource_pack/render_controllers/dummy.render_controllers.json"},
    {"type": "recommendation", "generatorId": "FORMATVER", "path": "/resource_packs/resource_pack/entity/dummy.entity.json",
     "message": "Entity type resource version (1.10.0) has a lower minor version number compared to the expected version (1.26.50)"},
    {"type": "recommendation", "generatorId": "ENTITYTYPE130", "path": "/behavior_packs/behavior_pack/entities/dummy.json",
     "message": "Entity format version could be updated to 1.26.50"},
]
if os.environ.get("FAKE_MCT_ERROR"):
    items.append({"type": "error", "generatorId": "ENTITYTYPE1", "message": "broken", "path": "/behavior_packs/x"})
print("Creator Tools banner line")
print(json.dumps({"schemaVersion": "1.0.0", "command": "validate", "errors": len([i for i in items if i["type"] == "error"]),
                  "warnings": 1, "recommendations": 2, "projects": [{"name": "in", "items": items}]}))
sys.exit(4 if os.environ.get("FAKE_MCT_ERROR") else 0)
'''


def run(script, *args, env=None):
    e = dict(os.environ)
    e.update(env or {})
    p = subprocess.run([sys.executable, str(script)] + [str(a) for a in args], capture_output=True, text=True,
                       encoding="utf-8", env=e, timeout=900)
    try:
        payload = json.loads(p.stdout)
    except ValueError:
        payload = None
    return p.returncode, payload, p.stdout + p.stderr


def broken_copy(dest):
    """The fixture with one fault per check: bad JSON, a reused UUID, a missing texture and geometry."""
    shutil.copytree(FIXTURE, dest)
    (dest / "behavior_pack" / "entities" / "broken.json").write_text('{"format_version": "1.21.0",,}', encoding="utf-8")
    rp = dest / "resource_pack" / "manifest.json"
    rp.write_text(rp.read_text(encoding="utf-8").replace(
        "d497e0e3-b5e0-49e9-bc72-1ad5480416f3", "9b806dd4-cde0-4390-9165-441e369e68ad"), encoding="utf-8")
    (dest / "resource_pack" / "textures" / "entity" / "dummy.png").unlink()
    ce = dest / "resource_pack" / "entity" / "dummy.entity.json"
    ce.write_text(ce.read_text(encoding="utf-8").replace("geometry.fixture.dummy", "geometry.fixture.missing"),
                  encoding="utf-8")


def fake_bds(folder):
    folder.mkdir(parents=True)
    (folder / "server.properties").write_text("server-name=Dedicated Server\nlevel-name=Bedrock level\n"
                                              "server-port=19132\nallow-cheats=false\n", encoding="utf-8")
    (folder / "config" / "default").mkdir(parents=True)
    (folder / "config" / "default" / "permissions.json").write_text(
        json.dumps({"allowed_modules": ["@minecraft/server-ui"]}), encoding="utf-8")
    (folder / "worlds" / "old").mkdir(parents=True)
    (folder / "server.py").write_text(FAKE_SERVER, encoding="utf-8")


class CheckTests(unittest.TestCase):
    def test_fixture_passes(self):
        code, out, raw = run(CHECK, FIXTURE)
        self.assertEqual(code, 0, raw)
        self.assertTrue(out["ok"])
        for c in ("json", "manifest", "identifiers", "components"):
            self.assertEqual(out["checks"][c]["status"], "pass", raw)
        self.assertEqual(out["checks"]["identifiers"]["namespaces"], ["fixture"])
        self.assertEqual(out["checks"]["typescript"]["status"], "skip")
        self.assertEqual(out["checks"]["mct"]["status"], "skip")

    def test_broken_copy_fails_the_right_checks(self):
        with tempfile.TemporaryDirectory() as d:
            bad = Path(d) / "addon"
            broken_copy(bad)
            code, out, raw = run(CHECK, bad)
        self.assertEqual(code, 1, raw)
        self.assertFalse(out["ok"])
        checks = out["checks"]
        self.assertEqual(checks["json"]["status"], "fail", raw)
        self.assertTrue(any("broken.json" in e for e in checks["json"]["errors"]), raw)
        self.assertEqual(checks["manifest"]["status"], "fail", raw)
        self.assertTrue(any("also used" in e for e in checks["manifest"]["errors"]), raw)
        self.assertEqual(checks["identifiers"]["status"], "fail", raw)
        errs = " ".join(checks["identifiers"]["errors"])
        self.assertIn("texture", errs)
        self.assertIn("geometry.fixture.missing", errs)

    def test_missing_client_entity_and_beta_module(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "addon"
            shutil.copytree(FIXTURE, p)
            (p / "resource_pack" / "entity" / "dummy.entity.json").unlink()
            bp = p / "behavior_pack" / "manifest.json"
            bp.write_text(bp.read_text(encoding="utf-8").replace('"2.11.0"', '"2.12.0-beta"'), encoding="utf-8")
            code, out, raw = run(CHECK, p, "--only", "manifest,identifiers")
        self.assertEqual(code, 1, raw)
        self.assertIn("no client entity", " ".join(out["checks"]["identifiers"]["errors"]))
        self.assertIn("Beta APIs", " ".join(out["checks"]["manifest"]["warnings"]))
        self.assertEqual(out["checks"]["manifest"]["status"], "pass")

    def test_package_json_without_node_modules_skips_with_reason(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "addon"
            shutil.copytree(FIXTURE, p)
            (p / "package.json").write_text('{"scripts": {"test": "node --test"}}', encoding="utf-8")
            (p / "tsconfig.json").write_text("{}", encoding="utf-8")
            code, out, raw = run(CHECK, p, "--only", "typescript,test")
        self.assertEqual(code, 0, raw)
        self.assertIn("npm ci", out["checks"]["typescript"]["reason"])
        self.assertEqual(out["checks"]["test"]["status"], "skip")

    def test_legacy_component_at_new_format_version(self):
        # BDS 1.26.60.6 refused the whole entity when minecraft:pushable appeared at format_version 1.26.50.
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "addon"
            shutil.copytree(FIXTURE, p)
            ent = p / "behavior_pack" / "entities" / "dummy.json"
            ent.write_text(ent.read_text(encoding="utf-8").replace('"1.21.0"', '"1.26.50"'), encoding="utf-8")
            code, out, raw = run(CHECK, p, "--only", "components")
        self.assertEqual(code, 1, raw)
        errs = " ".join(out["checks"]["components"]["errors"])
        self.assertIn("minecraft:pushable", errs)
        self.assertIn("pushable_by_entity", errs)

    def fake_mct(self, d, error=False):
        script = Path(d) / "fake_mct.py"
        script.write_text(FAKE_MCT, encoding="utf-8")
        env = {"FAKE_MCT_ERROR": "1" if error else ""}
        return run(CHECK, FIXTURE, "--only", "mct", "--mct-bin", script, env=env)

    def test_mct_runs_on_the_packs_only_and_files_known_noise(self):
        with tempfile.TemporaryDirectory() as d:
            code, out, raw = self.fake_mct(d)
        self.assertEqual(code, 0, raw)
        mct = out["checks"]["mct"]
        self.assertEqual(mct["status"], "pass", raw)
        self.assertEqual(mct["via"], "--mct-bin")
        self.assertEqual(mct["errors"], [])
        self.assertEqual(len(mct["noise"]), 2, raw)
        self.assertTrue(any("uv_anim" in n for n in mct["noise"]))
        self.assertTrue(any("caution" in w for w in mct["warnings"]), raw)

    def test_mct_error_fails_the_check(self):
        with tempfile.TemporaryDirectory() as d:
            code, out, raw = self.fake_mct(d, error=True)
        self.assertEqual(code, 1, raw)
        self.assertEqual(out["checks"]["mct"]["status"], "fail")
        self.assertIn("ENTITYTYPE1", out["checks"]["mct"]["errors"][0])

    def test_mct_is_opt_in(self):
        code, out, raw = run(CHECK, FIXTURE, "--skip", "typescript,lint,test")
        self.assertIn("opt-in", out["checks"]["mct"]["reason"])
        code, out, _ = run(CHECK, FIXTURE, "--mct-bin")
        self.assertEqual(code, 2)

    @unittest.skipIf(shutil.which("mct"), "mct is installed globally here")
    def test_mct_missing_points_at_npx(self):
        code, out, raw = run(CHECK, FIXTURE, "--only", "mct", "--mct")
        self.assertEqual(code, 0, raw)
        self.assertIn("--mct-npx", out["checks"]["mct"]["reason"])

    def test_usage_errors(self):
        with tempfile.TemporaryDirectory() as d:
            code, out, _ = run(CHECK, d)
        self.assertEqual(code, 2)
        self.assertIn("manifest.json", out["error"])
        code, out, _ = run(CHECK, FIXTURE, "--only", "nonsense")
        self.assertEqual(code, 2)
        p = subprocess.run([sys.executable, str(CHECK), "--help"], capture_output=True, text=True, encoding="utf-8")
        self.assertEqual(p.returncode, 0)
        self.assertIn("identifiers", p.stdout)


class ServerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        # An empty user cache, so nothing real is found and nothing is downloaded.
        self.env = {"LOCALAPPDATA": str(self.tmp / "cache"), "XDG_CACHE_HOME": str(self.tmp / "cache")}

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_help_lists_every_option(self):
        p = subprocess.run([sys.executable, str(BDS), "--help"], capture_output=True, text=True, encoding="utf-8")
        self.assertEqual(p.returncode, 0)
        for opt in ("--download", "--cmd", "--expect", "--wait", "--bds-dir", "--setup-only", "--keep", "--log"):
            self.assertIn(opt, p.stdout)
        self.assertNotIn("--server-cmd", p.stdout)

    def test_no_download_without_the_flag(self):
        code, out, raw = run(BDS, FIXTURE, "--cmd", "scriptevent fixture:selftest", env=self.env)
        if sys.platform == "darwin":
            self.assertEqual(code, 2)
            self.assertIn("Windows and Linux", out["error"])
            return
        self.assertEqual(code, 2, raw)
        self.assertIn("--download", out["error"])
        self.assertIn("EULA", out["error"])
        self.assertFalse((self.tmp / "cache" / "minewright" / "bds" / BDS_VERSION).exists())

    def test_bad_project(self):
        code, out, _ = run(BDS, self.tmp / "nope", env=self.env)
        self.assertEqual(code, 2)
        empty = self.tmp / "empty"
        empty.mkdir()
        code, out, _ = run(BDS, empty, env=self.env)
        self.assertEqual(code, 2)
        self.assertIn("manifest.json", out["error"])

    def test_world_setup(self):
        bds = self.tmp / "bds"
        fake_bds(bds)
        inst = self.tmp / "inst"
        code, out, raw = run(BDS, FIXTURE, "--bds-dir", bds, "--instance", inst, "--setup-only", "--port", "40100",
                             env=self.env)
        self.assertEqual(code, 0, raw)
        world = inst / "worlds" / "mwtest"
        self.assertFalse((inst / "worlds" / "old").exists(), "the BDS folder's own worlds are not copied")
        bp = json.loads((world / "world_behavior_packs.json").read_text(encoding="utf-8"))
        rp = json.loads((world / "world_resource_packs.json").read_text(encoding="utf-8"))
        self.assertEqual(bp, [{"pack_id": "6f7e6e2d-5fe9-482e-9bf8-0e647d4658a7", "version": [1, 0, 0]}])
        self.assertEqual(rp, [{"pack_id": "e19f4845-e13e-4539-a33f-efa0b1f93573", "version": [1, 0, 0]}])
        self.assertTrue((world / "behavior_packs" / "behavior_pack" / "scripts" / "main.js").is_file())
        self.assertTrue((world / "resource_packs" / "resource_pack" / "manifest.json").is_file())
        props = (inst / "server.properties").read_text(encoding="utf-8")
        for line in ("level-name=mwtest", "server-port=40100", "server-portv6=40101", "allow-cheats=true",
                     "allow-list=true", "content-log-console-output-enabled=true"):
            self.assertIn(line, props.splitlines())
        perms = json.loads((inst / "config" / "default" / "permissions.json").read_text(encoding="utf-8"))
        self.assertEqual(perms["allowed_modules"], ["@minecraft/server-ui", "@minecraft/server"])
        self.assertEqual(out["setup"]["permissions_added"], ["@minecraft/server"])

    def fake_run(self, *extra):
        bds = self.tmp / "bds"
        fake_bds(bds)
        server = json.dumps([sys.executable, "-u", str(bds / "server.py")])
        return run(BDS, FIXTURE, "--bds-dir", bds, "--server-cmd", server, "--wait", "10", *extra, env=self.env)

    def test_markers_and_errors_from_a_fake_server(self):
        code, out, raw = self.fake_run("--cmd", "scriptevent fixture:selftest", "--expect", "fixture")
        self.assertEqual(code, 1, raw)
        self.assertTrue(out["started"])
        self.assertEqual(out["started_line"], "[2026-01-01 00:00:00:000 INFO] Server started.")
        self.assertEqual([m["result"] for m in out["markers"]], ["PASS", "FAIL"])
        self.assertEqual(out["markers"][1], {"result": "FAIL", "name": "other", "detail": "it broke"})
        self.assertEqual(out["summary"]["errors"], 1)
        self.assertTrue(out["stopped_cleanly"])
        self.assertIn("console_tail", out)
        self.assertIsNone(out["instance"], "the temporary instance is removed")

    def test_clean_pass_from_a_fake_server(self):
        code, out, raw = self.fake_run("--cmd", "scriptevent fixture:good", "--expect", "fixture")
        self.assertEqual(code, 0, raw)
        self.assertTrue(out["ok"])
        self.assertEqual(out["summary"], {"pass": 1, "fail": 0, "missing": [], "errors": 0})

    def test_missing_expected_marker(self):
        code, out, raw = self.fake_run("--cmd", "scriptevent fixture:good", "--expect", "fixture",
                                       "--expect", "never", "--wait", "2")
        self.assertEqual(code, 1, raw)
        self.assertEqual(out["summary"]["missing"], ["never"])

    @unittest.skipUnless(sys.platform in ("win32", "linux") and
                         (Path(os.environ.get("LOCALAPPDATA", "") if os.name == "nt" else
                               os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache") or "")
                          / "minewright" / "bds" / BDS_VERSION / ".minewright-complete").exists(),
                         "BDS not in the user cache; run bds_run.py --download once to enable the real-server test")
    def test_fixture_on_real_bds(self):
        code, out, raw = run(BDS, FIXTURE, "--cmd", "scriptevent fixture:selftest", "--expect", "fixture")
        self.assertEqual(code, 0, raw)
        self.assertEqual(out["markers"][0], {"result": "PASS", "name": "fixture", "detail": ""})
        self.assertIn("Server started", out["started_line"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
