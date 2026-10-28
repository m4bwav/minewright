---
title: GitHub wiki written and published for 0.1.0
kind: note
date: 2026-10-27
verified: 2026-10-27
stale_after: 2027-04-27
tags: [wiki, docs, 0.1.0, github]
summary: "the wiki's pages, where their git working copy is, how every output on them was produced by the 0.1.0 scripts on a copy of the example add-on, the facts found on the way, the inaccuracies in the shipped docs, and how to update the wiki; read before touching the wiki"
---

# GitHub wiki for 0.1.0

## Summary

Wrote and published https://github.com/m4bwav/minewright/wiki with the wikiwright skill: thirteen pages plus a sidebar and footer, and a splash image on Home. Written from the README, AGENTS.md, the five SKILL.md files with their references, RESEARCH.md, LEARNINGS.md and `evergreen.json`, the two scripts and their `--help`, the tests, the CI workflows and the example's README, HOW-TO-PLAY, INSTALL, PLAYTEST and ART pages. Wiki commits `a3974a2` (the pages) and `4e40b6b` (the budget report after this branch's banner and icon). `live`: 13 pages, 0 failures, sidebar and footer render, 6 anchor links, 0 broken. everwrite `tells.py`: 0 strong.

Pages: Home, Getting-Started, Platforms-and-Install, Given-Jar-Example, Checks-and-the-BDS-Harness, FAQ, Design-and-Script-API (minewright-workflow), Project-and-Packaging (minewright-project), Static-Checks (minewright-checks), Live-Server-Tests (minewright-server), HUD-and-UI (minewright-hud), Research-and-Freshness, Development-and-Release, _Sidebar, _Footer. Image: `images/splash.jpg` (1920 by 1080, 212 KB).

## Where the pages are

A sibling of this repository's clone named `minewright.wiki`, branch `master`, remote `https://github.com/m4bwav/minewright.wiki.git`. Plain markdown links, LF line endings.

## How it was published

Preflight: `placeholder` (the maintainer saved a first page, `Home.md`). The pages were committed over it, Home replacing the placeholder text, and pushed with a plain fast-forward (`5df9081..a3974a2`).

## How the outputs were verified

`2026-10-27-wiki-verify.py` (next to this note) holds every command the Checks-and-the-BDS-Harness page shows, as text. It copies `skills/` and `examples/given-jar/` from a checkout into a fresh demo folder, runs the unbuilt cases, runs `npm ci` and `npm run build` in the example, then runs the built cases, a `--log` run with its scripting lines, and `scripts/pack.py`. It never passes `--download`. It masks seconds, test durations, console timestamps, the port, the session id, the temporary instance, the BDS cache folder, the Node folder, the demo folder and the home folder.

- Saved output: `2026-10-27-wiki-verify.out.txt`, 13 sections, run on Windows 11 with Python 3.14.6, Node 24.18.0 and BDS 1.26.60.6 (cached) against the `main` checkout at `ff404b3`. Two later runs differed only by the sections added between them (`diffout`: 0 changed).
- Checks-and-the-BDS-Harness was generated from the saved output by a fill-in script (`{{case:<label>}}` placeholders, and one excerpt of `bds-unbuilt` from `"started": true` to the end of `"problems"`), so no output was retyped.
- `outputs`: 19 checked, 0 missing, 8 skipped (folder layouts, a `package.json` excerpt, the marker format, the example's npm script list, the Claude Code commands and the `budget.py` report).
- `snippets`: 0 blocks of a checked language; 5 skipped (the README's install loops, two npm commands, the three repository checks, and a Script API snippet that runs only in the game).
- Repository tests: `tests/test_scripts.py` 18 passed, the real-server test included; `tests/check_skills.py` ok; `scripts/budget.py` GREEN.

Not tested:

- the Claude Code marketplace install, and linking the skills into Copilot, Codex or Cursor;
- `mw_check.py --mct`, `--mct-npx` or `--mct-bin` (Creator Tools was not run; the README's record of a pass stands unchecked);
- `bds_run.py --download`, and the Linux build of BDS;
- anything in the game client: install, the HUD, textures, sounds, the playtest;
- the eval suites (no `T-` run recorded on `main` yet).

## Facts verified while writing (not in the README)

- On an unbuilt checkout, `mw_check.py examples/given-jar` exits 1: `manifest` fails on the missing `scripts/main.js`, and `typescript`, `lint` and `test` skip with `node_modules missing; run npm ci (or npm install) first`.
- On the same unbuilt checkout, `bds_run.py` starts the server, which prints `[Scripting] Plugin [given.jar - 0.1.0] - does not contain main file [main.js].`; no marker arrives, the run waits the full 20 seconds, and exits 1 with 47 console lines.
- `bds_run.py` with a version not in the cache exits 2 before starting anything, and names the cache folder in `cache`.
- `mw_check.py` on a folder with no manifest exits 2 with `no manifest.json under <path>; not a Bedrock add-on`.
- The example's `.mcaddon` from `scripts/pack.py` holds 19 files, 388 KB, with folders `given_jar_BP/` and `given_jar_RP/`.
- `mw_check.py`'s `test` check keeps the last 25 lines of `npm test`; `bds_run.py`'s `console_tail` keeps the last 60.
- `src/items.ts` has 37 easy, 25 medium and 20 hard items.
- The BDS report's `setup.packs` versions are the manifests' header versions (`[0, 1, 0]` for the example), and its `exit` is the server process's exit code, not the script's.
- Three Dependabot pull requests were open on 2026-10-27 (ESLint 10.13.0, `@eslint/js` 10.0.1, `@types/node` 26.6.5); the first two conflict with the pins in minewright-project's versions-and-formats reference.

## Inaccuracies found in the shipped docs

1. `mw_check.py --help` says "node_modules, dist and .git are skipped" when packs are searched. The code (`SKIP_DIRS`) also skips `build`, `lib`, `__pycache__` and `.bds`. SKILL.md (minewright-checks, Step 1) lists five of them. The wiki states the full list. Fix in the docstring for the next release.
2. minewright-hud SKILL.md, Step 3 item 3, shows the prefix test as `(#text - 'gj:item:') = #text`, while item 1, the example's `hud_screen.json` and `src/core/hud.ts` all use `gj_item:`. The wiki does not repeat the formula.
3. The README says "Tagged releases also carry a zip of the skills" and that tagged releases attach the example's `.mcaddon`. On 2026-10-27 there is no tag and no release, so neither exists yet. The wiki says so (FAQ, Development-and-Release, Given-Jar-Example).
4. minewright-project SKILL.md, Step 4, names `scripts/pack.mjs` as the packer; the example ships `scripts/pack.py`, and its `.mcaddon` folders are `given_jar_BP/` and `given_jar_RP/`, not `behavior_pack/` and `resource_pack/`. Not wrong for another project, but the example does it differently.

## Updating the wiki later

1. `git -C <wiki dir> pull --ff-only`.
2. Run `python 2026-10-27-wiki-verify.py <checkout> <demo folder>` with BDS cached, then `wikiwright.py diffout 2026-10-27-wiki-verify.out.txt <new output>`. Every difference is a page to fix; `diffout --save` writes the new output over the old.
3. Regenerate Checks-and-the-BDS-Harness from the new output: copy the page to a template with `{{case:<label>}}` placeholders in place of its `console` blocks, or edit the changed blocks. Then run `wikiwright.py outputs <wiki dir> <new output> --address ''`, `snippets <wiki dir> 2026-10-27-wiki-verify.py`, `check <wiki dir> --version X.Y.Z` and the everwrite checker. Refresh the `budget.py` report on Development-and-Release by hand, after the release's files are committed (it counts tracked files).
4. Commit, push, then `wikiwright.py live m4bwav/minewright <wiki dir>`. Pages that name the version or the date: Home ("About these pages"), Checks-and-the-BDS-Harness (the opening paragraph), Research-and-Freshness (the state table and the research counts), Development-and-Release (releases, budget), FAQ (the release and Dependabot answers), Given-Jar-Example (the tests table, install), _Footer.
5. When a tag is pushed, remove "no release tag yet" from the footer and the "no release" sentences from FAQ, Development-and-Release and Given-Jar-Example.

Related: see also [../HANDOFF.md](../HANDOFF.md), [../log.md](../log.md).
