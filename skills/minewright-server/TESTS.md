# Tests: minewright-server

Test runs for [SKILL.md](SKILL.md). Cases live in `evals/evals.json`. A failure that taught something is a lesson in [LEARNINGS.md](LEARNINGS.md); a fix it caused is logged in [CHANGELOG.md](CHANGELOG.md) with `because: T-...`; research it triggered is in [RESEARCH.md](RESEARCH.md); counts and the failing list are in `evergreen.json` under `tests`. Rules: MAINTENANCE.md (testing section) and the plugin's `protocol/TESTING.md`.

A test passes on evidence (a tool call in the trace, a file, a marker, a log line), never on the transcript's claim that something was done.

Entry shape: `### T-YYYYMMDD-n · date · harness · env · passed/total`, then one line per failing case (`id · kind · class · what the evidence showed`), then `led to:` (L-, C-, R- ids or none). Newest first. Budget 150 lines; archive older runs to `TESTS-ARCHIVE.md`.

## Runs

### T-20261027-3 · 2026-10-27 · claude -p headless (Claude Code 2.1.281, stream-json, bypassPermissions), one run per case, trigger results via headless main loop · Windows dev machine, about 154 skills installed (116 listed name-only) · 6/6
- decoy-2 re-run three times, one run per tuning step: r1 after C-20261027-4's first edit ("Bedrock only, not Java servers (Spigot, Paper)" at the end of the description): fail, Skill(minewright-server) then Spigot setup scripts. r2 after the clause moved to the front ("(not Java Edition: no Spigot or Paper)"), listing budget raised: pass. r3, same text, default listing: pass. minewright-server is the one minewright skill whose description the default listing shows.
- led to: L-008, C-20261027-4

### T-20261027-2 · 2026-10-27 · claude -p headless (Claude Code 2.1.281, stream-json, bypassPermissions), one run per case, trigger results via headless main loop · Windows dev machine, about 154 skills installed (116 listed name-only) · 5/6
- trigger-1, trigger-2, decoy-1, action-1 (Bash ran bds_run.py on tests/fixtures/addon with --cmd "scriptevent fixture:selftest"; BDS 1.26.60.6 from the cache, [MWTEST] PASS fixture), outcome-1 (says /gametest runall does not exist) pass.
- decoy-2 · trigger · overtrigger · Skill(minewright-server) for "Set up a Minecraft Java server with Spigot plugins"; the run then said the skill only covers Bedrock
- Listing note: with about 154 skills installed, Claude Code lists most of them by name only (4 of the 5 minewright skills, all but minewright-server); trigger cases ran against that real listing.
- Baselines (skills disabled, one run each): action-1 pass but contaminated (the fixture comment names bds_run.py; the run found the main clone's skill on disk and ran it), outcome-1 pass with no tools, redundant on one run.
- led to: L-008, C-20261027-4

### T-20261027-1 · 2026-10-27 · not yet run · skill · 0/0
- Suite scaffolded; no run recorded. Write the cases in `evals/evals.json` (at least two trigger prompts, two decoys, one action case with evidence, one outcome case), run the baseline without the skill, then run with it (`evergreen-test`).
- led to: none
