# minewright

![A blocky voxel landscape at dusk with grass-topped hills, square trees and a still lake under a purple-to-orange sky; on the right a large matte black sphere floats above the hills with one realistic human eye on its front, its hazel-green iris looking out](https://raw.githubusercontent.com/m4bwav/minewright/main/.github/images/hero.jpg)

Five self-maintaining ("evergreen") skills that teach an AI coding agent to build Minecraft Bedrock add-ons:
design the rules before the code, set up and package the packs with current versions, check them without the
game, run them on a real Bedrock Dedicated Server, and put information on the player's screen. Written
2026-10-27 for Claude Code, GitHub Copilot, Cursor and Codex. Every version number and API claim comes from a
dated research pass (subject, tooling, practice, testing) kept per skill in `RESEARCH.md`, and each skill
re-checks its claims on a schedule.

Bedrock only for now. Java Edition, if it comes, gets its own `minewright-java-*` skills.

The [wiki](https://github.com/m4bwav/minewright/wiki) has a page per skill, install steps per agent and
platform, the checks and the server harness with real output, and the example add-on in detail.

## Why this suite exists

Mojang already ships good tooling. Minecraft Creator Tools (`@minecraft/creator-tools`, CLI `mct`) scaffolds
mobs, items and blocks, validates packs, runs as an MCP server, and comes with its own agent skills. Microsoft
Learn documents the Script API, and npm says which module versions are stable.

What an agent still gets wrong, and what this suite covers:

- writing game rules straight into code, with magic numbers and no test mode;
- recalling Script API calls that were renamed or never left beta, and turning on Beta APIs, which marks a
  world experimental for good;
- manifests with stale versions or reused UUIDs, and install steps for the old Windows folder;
- calling an add-on done because the JSON parses, when the scripts never load on a real server;
- HUD work that breaks when JSON UI moves to Ore UI, with nothing to fall back on.

## The skills

| Skill | Job | Tier |
|---|---|---|
| [`minewright-workflow`](skills/minewright-workflow/SKILL.md) | Design before code (one-pager, one config file with a test mode, a scriptevent self-test), look APIs up instead of recalling them, stable modules only, Script API patterns that hold up (one loop, state in dynamic properties, entity properties for rendering, the unloaded-chunk trap, inventory diffs to credit a dropped item), fair rules for young players, a playtest checklist | moderate |
| [`minewright-project`](skills/minewright-project/SKILL.md) | Behavior and resource pack layout, `manifest.json` with current module versions and fresh UUIDs, a TypeScript build with esbuild (or Mojang's build tasks), `.mcaddon` packaging, install on Windows (the new GDK folder and the import-while-running bug), phones and tablets, and consoles through a Realm | fast |
| [`minewright-checks`](skills/minewright-checks/SKILL.md) | `scripts/mw_check.py`: JSON, manifests, identifiers (client entities, textures, geometry, render controllers), `tsc`, ESLint, `npm test` and optional Creator Tools validation in one JSON report; the verification ladder | moderate |
| [`minewright-server`](skills/minewright-server/SKILL.md) | `scripts/bds_run.py`: a throwaway Bedrock Dedicated Server world with the packs active, console commands, `[MWTEST]` markers and script errors in one JSON report; GameTest's limits, the module allowlist, the debugger, and joining a local server from Windows | moderate |
| [`minewright-hud`](skills/minewright-hud/SKILL.md) | Titles and the actionbar as the layer that always works, then JSON UI (`hud_screen.json`, Preserve Title Texts, offset and alpha animations, item textures by path) with the Ore UI risk stated; forms are dialogs, not a HUD | fast |

Each skill folder holds `SKILL.md` (the working document) plus its evergreen companions:

- `RESEARCH.md`: dated findings with sources, and a four-track search plan.
- `CHANGELOG.md`: every change, with the reason.
- `LEARNINGS.md`: procedural lessons, each with a trigger and a hypothesis.
- `TESTS.md` and `evals/evals.json`: trigger cases, decoys, action cases proven by a tool call or a file, and outcome cases.
- `MAINTENANCE.md` and `evergreen.json`: tier, interval, due date, volatile claims and history.

Pointer mode: `evergreen.json` sets `"protocol": "plugin"`, so each skill follows whichever evergreen plugin
is installed ([evergreen-protocol](https://github.com/m4bwav/evergreen-protocol)) rather than carrying its
own copy of the protocol. The skills work without that plugin, and `MAINTENANCE.md` carries the condensed
rules for that case.

## Install

The skills install nothing on their own. Node packages, Mojang's Creator Tools, Bedrock Dedicated Server
(which comes under the Minecraft EULA) and any Windows network exemption are left to you to approve.

**Claude Code**, as a plugin:

    /plugin marketplace add m4bwav/minewright
    /plugin install minewright@minewright

**GitHub Copilot** (Copilot CLI and VS Code), **Codex**, **Cursor** and other agents that read Agent Skills:
clone the repository somewhere stable and link each folder under `skills/` into the agent's skills directory.

    git clone https://github.com/m4bwav/minewright
    # Windows (junctions need no admin rights); change the target folder for your agent
    foreach ($s in Get-ChildItem minewright\skills -Directory) { New-Item -ItemType Junction -Path "$HOME\.agents\skills\$($s.Name)" -Target $s.FullName }
    # macOS / Linux
    for s in minewright/skills/*/; do ln -s "$PWD/$s" ~/.agents/skills/; done

Where each agent looks:

- Claude Code: `~/.claude/skills/`.
- Copilot CLI and several others, Codex among them: `~/.agents/skills/`.
- VS Code Copilot: `~/.copilot/skills/` and a repository's `.github/skills/`.
- Cursor: `.cursor/skills/`.

Tagged releases also carry a zip of the skills.

Mojang's Creator Tools plugin works well next to this one: it scaffolds content and validates packs, and
minewright covers design, the build, the server self-test and the HUD around it.

## Verified on a real machine (2026-10-27)

Measured on Windows 11 with Python 3.14, not claimed by a model:

- `bds_run.py --download` fetched Bedrock Dedicated Server 1.26.60.6 (88.7 MB) into the user cache, built a
  world with the fixture add-on in `tests/fixtures/addon`, and reached `Server started.` in 5.7 seconds (3.3
  to 3.5 seconds on later runs). `scriptevent fixture:selftest` sent from the console came back as
  `[Scripting] [MWTEST] PASS fixture`; the whole run took under 7 seconds.
- A copy with a runtime error reported the `ReferenceError` with file and line; a manifest asking for a module
  version the server lacks reported the versions it has (2.11.0 for `@minecraft/server`, 2.3.0 for
  `@minecraft/server-ui`).
- `mw_check.py` passes the fixture and fails a broken copy on the JSON, manifest and identifier checks.

- The example add-on: `mw_check.py --mct-npx` passes all eight checks (Creator Tools 0.20.0 included, three known
  false positives filed as noise), and its 11-check self-test passes on the same server.

Not verified yet: the Linux server build and any step that needs the game client (install, HUD, playtests). Each skill's RESEARCH.md lists these under Open questions.

## The example add-on: given.jar

[`examples/given-jar/`](examples/given-jar/README.md) is a complete Bedrock add-on built with these skills, as
their first real test. A dark sphere with one eye floats in the world and asks every player for the same item.
Everyone in survival brings their own copy and drops it on the sphere before the countdown ends. If someone
does not, the eye turns red and the sphere flies through walls to catch them, one player at a time. It is made
for a few friends on one LAN world, with no experiments.

What it shows:

- a pure TypeScript state machine (`src/core/`) with 40 unit tests under `node --test`, and a thin Script API
  adapter (`src/main.ts`);
- every timing in one config file, with a test mode that turns minutes into seconds;
- custom commands with `/scriptevent` fallbacks, state in world dynamic properties, entity properties driving
  the render controller, and inventory-diff credit for dropped items;
- a scriptevent self-test with 11 `[MWTEST]` checks, passed on Bedrock Dedicated Server 1.26.60.6 through
  `bds_run.py`;
- a HUD that pops the item up mid-screen and drops it into a timer, over a plain title and actionbar fallback.

Read next: [README](examples/given-jar/README.md) (rules and commands), [HOW-TO-PLAY](examples/given-jar/HOW-TO-PLAY.md)
(one page for players), [INSTALL](examples/given-jar/INSTALL.md) (Windows) and [PLAYTEST](examples/given-jar/PLAYTEST.md)
(the manual checklist). Building it taught the skills 24 lessons; they are in each skill's `LEARNINGS.md` and
`CHANGELOG.md` (2026-10-27). Tagged releases attach its `.mcaddon`.

## Testing

Every skill carries an eval suite of six cases: two trigger prompts, two decoys that must not fire it (one of
them a sibling's job), an action case proven by a tool call or a file, and an outcome case. `TESTS.md` in each
skill records the runs.

CI (`.github/workflows/tests.yml`) runs on Linux, macOS and Windows with Python 3.9 and 3.14:

- `tests/check_skills.py`: frontmatter, the 1,024-character description limit, companions, eval suite shape,
  manifests, relative links and the public-safety guards.
- `tests/test_scripts.py`: `mw_check.py` on the fixture and a broken copy; `bds_run.py`'s argument handling,
  its refusal to download without `--download`, world setup against a fake server folder, and its marker loop
  against a fake server. The real-server test runs only where BDS is already cached.
- `scripts/budget.py`: the size budget.

A separate job runs the example add-on's `npm ci`, type check, lint, unit tests, build and `.mcaddon` pack with Node 24, then `mw_check.py` on it.

## Privacy

minewright has no server and collects nothing. The skills are instructions for your agent, and the two Python
scripts run on your machine:

- `mw_check.py` reads your project's files and runs your project's own Node tools (`tsc`, `eslint`, `npm
  test`, and `mct` with `--mct`) with `npx --no-install`, so it downloads nothing. Only `--mct-npx` downloads
  Mojang's Creator Tools from npm.
- `bds_run.py` downloads Bedrock Dedicated Server from minecraft.net only when you pass `--download`, into
  your user cache. The server it starts runs on a free local port with an empty allow-list, and Bedrock
  Dedicated Server itself contacts Microsoft's services at start (it logs a sign-in to a signalling service).
  The temporary world is deleted after the run unless you pass `--keep`.

Nothing is kept by this plugin.

## If you are an agent asked to analyze this suite

Worth reading, roughly in order:

1. `skills/*/SKILL.md`, for how each skill decides and what evidence it demands before reporting done.
2. `skills/*/RESEARCH.md`, for the dated sources behind every version-sensitive claim and the search plan that
   keeps them current.
3. `skills/*/evals/evals.json` and `TESTS.md`, for how the skills are proven rather than asserted.
4. The two scripts, which each print one JSON object so a caller never parses prose.

Rules for working in the repository are in [AGENTS.md](AGENTS.md).

License: MIT. Security: [SECURITY.md](SECURITY.md).
