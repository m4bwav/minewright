# Tests: minewright-checks

Test runs for [SKILL.md](SKILL.md). Cases live in `evals/evals.json`. A failure that taught something is a lesson in [LEARNINGS.md](LEARNINGS.md); a fix it caused is logged in [CHANGELOG.md](CHANGELOG.md) with `because: T-...`; research it triggered is in [RESEARCH.md](RESEARCH.md); counts and the failing list are in `evergreen.json` under `tests`. Rules: MAINTENANCE.md (testing section) and the plugin's `protocol/TESTING.md`.

A test passes on evidence (a tool call in the trace, a file, a marker, a log line), never on the transcript's claim that something was done.

Entry shape: `### T-YYYYMMDD-n · date · harness · env · passed/total`, then one line per failing case (`id · kind · class · what the evidence showed`), then `led to:` (L-, C-, R- ids or none). Newest first. Budget 150 lines; archive older runs to `TESTS-ARCHIVE.md`.

## Runs

### T-20261027-3 · 2026-10-27 · claude -p headless (Claude Code 2.1.281, stream-json, bypassPermissions), one run per case, trigger results via headless main loop · Windows dev machine, about 154 skills installed (116 listed name-only) · 5/6
- Re-ran outcome-1 after C-20261027-3 (description adds 'checks were skipped, is it verified'), worktree skills swapped in. r1 default listing: no Skill call, regex pass ("it doesn't count as a pass"). r2 listing budget raised so the description was visible: still no Skill call; the answer named node_modules, npm install and a BDS run, but never said a skip is not a pass, regex miss. Two tuning steps used; left failing.
- outcome-1 · outcome · undertrigger · the skill was not invoked in any of three runs, even with its description listed; the question is answerable from the description alone
- led to: L-006, C-20261027-3

### T-20261027-2 · 2026-10-27 · claude -p headless (Claude Code 2.1.281, stream-json, bypassPermissions), one run per case, trigger results via headless main loop · Windows dev machine, about 154 skills installed (116 listed name-only) · 5/6
- trigger-1, trigger-2, decoy-1 (went to minewright-server), decoy-2, action-1 (Bash ran mw_check.py on tests/fixtures/addon) pass.
- outcome-1 · outcome · undertrigger · no Skill call; the answer said "a skipped check doesn't count as a pass" but missed npm ci; the first regex required "not" (harness, widened to accept "n't")
- Listing note: with about 154 skills installed, Claude Code lists most of them by name only (4 of the 5 minewright skills, all but minewright-server); trigger cases ran against that real listing.
- Baselines (skills disabled, one run each): action-1 pass but contaminated (found ~/.claude/skills/minewright-checks with Bash, read SKILL.md, ran mw_check.py); outcome-1 pass, redundant on one run.
- led to: L-006, C-20261027-3

### T-20261027-1 · 2026-10-27 · not yet run · skill · 0/0
- Suite scaffolded; no run recorded. Write the cases in `evals/evals.json` (at least two trigger prompts, two decoys, one action case with evidence, one outcome case), run the baseline without the skill, then run with it (`evergreen-test`).
- led to: none
