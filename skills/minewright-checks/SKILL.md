---
name: minewright-checks
description: "Check a Minecraft Bedrock add-on without the game before saying a change is done: one script (mw_check.py) checks that every pack JSON parses (comments allowed), the manifests (format_version 2, valid unique UUIDs, versions, min_engine_version, dependencies between packs, script entry exists, beta modules flagged), identifiers (one namespace, every entity has a client entity, textures, geometry and render controllers exist), then tsc, ESLint, npm test and optionally Mojang's Creator Tools validate, in one JSON report. Use whenever the user asks to 'check my add-on', 'validate the behavior pack', 'why is my entity invisible', 'missing texture', 'does my manifest look right', 'lint the Minecraft scripts', 'run the tests', after the agent edits pack JSON or Script API code, or says 'refresh minewright-checks'. Running the add-on on a real server is minewright-server; project setup and packaging are minewright-project."
---

# Bedrock add-on checks without the game

Outcome: a change to an add-on is reported done only with a passing `mw_check.py` report (or the failing checks named and fixed), and each claim in the reply points at a check that ran.

## Step 0: freshness (every use, one read)

Read `evergreen.json` next to this file. If `contradiction` is set or today is on or after `next_due`, tell the user in one line, do the task with the current content, then refresh (`evergreen-refresh`) in the same session. If `tests.failing` is non-empty, say so in one line and run `evergreen-tune` after the task.

## Step 1: run the checks

From any folder:

```
python <this skill>/scripts/mw_check.py <project dir> [--mct] [--only a,b] [--skip a,b]
```

- Packs are found by their `manifest.json` anywhere under the project (`node_modules`, `dist`, `build`, `lib` and `.git` are skipped). Build the TypeScript first, or the manifest check fails on a missing script entry.
- Prints one JSON object: `ok`, per check `status` (pass, fail or skip) with `errors` and `warnings` (or `exit`, `command` and `output_tail` for the Node tools), and a `summary` of counts. Exit 0 when nothing failed, 1 when a check failed, 2 when no pack was found or the arguments were wrong.
- Node tools run with `npx --no-install` from the project folder, so nothing is downloaded; a tool that is not installed is a skip with the reason (`node_modules missing; run npm ci`).
- `--mct` adds Mojang's Creator Tools validator: `mct validate -i <project> --json --force -o <temp>` (the `-o` keeps its report files out of the project; `--force` stops it returning cached results). It needs `@minecraft/creator-tools` installed in the project or globally, and Node 22 or later.

Read the JSON, fix what failed, run it again until `ok` is true. Quote the summary line (pass, fail, skip counts) in the reply. A skip is not a pass: say which checks were skipped and why.

## Step 2: what each check means

| Check | Catches | Notes |
|---|---|---|
| json | a file the game would refuse to load | `//` and `/* */` comments are stripped first, as Bedrock tolerates them; trailing commas are still an error |
| manifest | `format_version` not 2, bad or duplicate UUIDs, version arrays, missing `min_engine_version`, unknown module type, script entry missing, a pack depending on itself | warns on a `-beta` module (Beta APIs experiment) and on a pack dependency that is not in the project |
| identifiers | an entity with no client entity (invisible in game), a texture path with no `.png` or `.tga`, a geometry id no model defines, a render controller that does not exist | warns when more than one namespace is used or a namespace has dots or capitals |
| typescript | type errors | `npx tsc --noEmit`; needs `package.json`, `tsconfig.json` and `node_modules` |
| lint | ESLint findings | runs when an `eslint.config.*` or `.eslintrc*` exists; `eslint-plugin-minecraft-linting` adds Script API rules |
| mct | Creator Tools' rule set (pack size, deprecated components, format versions and more) | opt-in with `--mct` |
| test | unit test failures | `npm test`, when `package.json` has a real test script |

## Step 3: the verification ladder

Climb only as far as the change needs, and say which rung was reached:

1. Static: `mw_check.py` (always, for any pack or script change).
2. Unit tests of the pure core with `node --test` (minewright-workflow keeps game rules free of `@minecraft/*` imports so this works).
3. Creator Tools validation (`--mct`), before a release.
4. A real server: minewright-server's `bds_run.py` loads the packs on Bedrock Dedicated Server, sends `/scriptevent <ns>:selftest`, and reads `[MWTEST]` markers and script errors from the console. This is where a wrong module version or a runtime error shows up.
5. A human playtest in the game, with the checklist from minewright-workflow. The reply says when one is still owed.

## Pitfalls

- A clean static check does not prove the scripts load: a module version the game lacks, or a runtime error, only shows on a server (rung 4).
- An entity that is fine in the behavior pack but has no client entity spawns invisible, with no error in the game.
- Texture paths in client entities have no extension and are relative to the resource pack root.
- Vanilla render controllers (`controller.render.default`) are not in the project; the check allows the common ones and warns on others it cannot see.
- Mojang's own `debug-addon` skill (Creator Tools plugin) runs `mct validate` with a noise filter. If the user has it, the two agree on most findings; this script adds the TypeScript, lint and test checks.

## Output

The `mw_check.py` summary (pass/fail/skip counts), each fix made for a failure, the ladder rung reached, and what is still owed (a server self-test or a human playtest).

## While working: capture learnings

If the user corrects you, the same error happens twice, a workaround is found, or an environment fact is discovered, write it to `LEARNINGS.md` now (format in MAINTENANCE.md; check existing entries first). If a learning proves a claim above wrong, fix it here, log it in `CHANGELOG.md`, and set `contradiction` in `evergreen.json`.

## Maintenance

This skill is evergreen (tier `moderate`; the schedule is in `evergreen.json`). Files: `evergreen.json` (state), [RESEARCH.md](RESEARCH.md) (findings and search plan), [CHANGELOG.md](CHANGELOG.md) (every change, with reasons), [LEARNINGS.md](LEARNINGS.md) (lessons), [TESTS.md](TESTS.md) and `evals/evals.json` (the cases that prove it and the runs). Protocol: MAINTENANCE.md (pointer to the installed evergreen plugin). Refresh with `evergreen-refresh`; test with `evergreen-test`; fix a failure with `evergreen-tune`. Sibling skills in this suite: minewright-checks, minewright-hud, minewright-project, minewright-server, minewright-workflow.
