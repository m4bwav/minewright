# Tests: minewright-workflow

Test runs for [SKILL.md](SKILL.md). Cases live in `evals/evals.json`. A failure that taught something is a lesson in [LEARNINGS.md](LEARNINGS.md); a fix it caused is logged in [CHANGELOG.md](CHANGELOG.md) with `because: T-...`; research it triggered is in [RESEARCH.md](RESEARCH.md); counts and the failing list are in `evergreen.json` under `tests`. Rules: MAINTENANCE.md (testing section) and the plugin's `protocol/TESTING.md`.

A test passes on evidence (a tool call in the trace, a file, a marker, a log line), never on the transcript's claim that something was done.

Entry shape: `### T-YYYYMMDD-n · date · harness · env · passed/total`, then one line per failing case (`id · kind · class · what the evidence showed`), then `led to:` (L-, C-, R- ids or none). Newest first. Budget 150 lines; archive older runs to `TESTS-ARCHIVE.md`.

## Runs

### T-20261027-3 · 2026-10-27 · claude -p headless (Claude Code 2.1.281, stream-json, bypassPermissions), one run per case, trigger results via headless main loop · Windows dev machine, about 154 skills installed (116 listed name-only) · 3/6
- Re-ran the two trigger failures after C-20261027-3 (description routed .mcaddon to minewright-project, added 'is this API real or current'), worktree skills swapped in for the run. Default listing (r1): trigger-2 and decoy-1 failed again. With the listing budget raised (r2, diagnostic, not this machine's default): trigger-2 invoked minewright-workflow, decoy-1 invoked minewright-project only. Both pass when descriptions are visible.
- trigger-2 · trigger · environment · default listing: answered from memory ("I didn't check the current docs"), no Skill call; passes with descriptions visible
- decoy-1 · trigger · environment · default listing: minewright-workflow invoked for an .mcaddon build because minewright-project is listed by name only; passes with descriptions visible
- action-1 · action · no-op · not re-run (see T-20261027-2)
- led to: L-012, C-20261027-3

### T-20261027-2 · 2026-10-27 · claude -p headless (Claude Code 2.1.281, stream-json, bypassPermissions), one run per case, trigger results via headless main loop · Windows dev machine, about 154 skills installed (116 listed name-only) · 3/6
- trigger-1 pass, decoy-2 pass, outcome-1 pass, after its regex was widened (harness: the answer said "You can't undo it ... no way to switch it back", which the first regex did not accept).
- trigger-2 · trigger · environment · no Skill call; answered "as far as I know" from memory (minewright-workflow listed by name only)
- decoy-1 · trigger · environment · Skill(minewright-workflow) for "Build my behavior pack into an .mcaddon file"; minewright-project was listed by name only
- action-1 · action · no-op · docs/ONE-PAGER.md written with rules and core loop, but no config file: the reply says durations live in `config.js`, the folder has none. The prompt's "Plan it first" also allows stopping after the plan, so the case may be ambiguous; left for evergreen-tune.
- Listing note: with about 154 skills installed, Claude Code lists most of them by name only (4 of the 5 minewright skills, all but minewright-server); trigger cases ran against that real listing.
- Baselines (skills disabled, one run each): action-1 fail (PLAN.md and a skeleton, no one-pager or config), outcome-1 fail (hedged "generally can't be cleanly undone"). Neither case is redundant.
- led to: L-012, L-013, C-20261027-3

### T-20261027-1 · 2026-10-27 · not yet run · skill · 0/0
- Suite scaffolded; no run recorded. Write the cases in `evals/evals.json` (at least two trigger prompts, two decoys, one action case with evidence, one outcome case), run the baseline without the skill, then run with it (`evergreen-test`).
- led to: none
