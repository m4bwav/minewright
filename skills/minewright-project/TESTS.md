# Tests: minewright-project

Test runs for [SKILL.md](SKILL.md). Cases live in `evals/evals.json`. A failure that taught something is a lesson in [LEARNINGS.md](LEARNINGS.md); a fix it caused is logged in [CHANGELOG.md](CHANGELOG.md) with `because: T-...`; research it triggered is in [RESEARCH.md](RESEARCH.md); counts and the failing list are in `evergreen.json` under `tests`. Rules: MAINTENANCE.md (testing section) and the plugin's `protocol/TESTING.md`.

A test passes on evidence (a tool call in the trace, a file, a marker, a log line), never on the transcript's claim that something was done.

Entry shape: `### T-YYYYMMDD-n · date · harness · env · passed/total`, then one line per failing case (`id · kind · class · what the evidence showed`), then `led to:` (L-, C-, R- ids or none). Newest first. Budget 150 lines; archive older runs to `TESTS-ARCHIVE.md`.

## Runs

### T-20261027-3 · 2026-10-27 · claude -p headless (Claude Code 2.1.281, stream-json, bypassPermissions), one run per case, trigger results via headless main loop · Windows dev machine, about 154 skills installed (116 listed name-only) · 5/6
- Re-ran decoy-2 after C-20261027-3 (description ends "Bedrock only, not Java (Paper, Spigot, Fabric)"), worktree skills swapped in. Default listing (r1): fail, Skill(minewright-project) again and a Paper plugin scaffolded. Listing budget raised (r2, diagnostic): no Skill call, pass.
- decoy-2 · trigger · environment · the listing shows minewright-project by name only, so the new clause is never seen here
- led to: L-009, C-20261027-3

### T-20261027-2 · 2026-10-27 · claude -p headless (Claude Code 2.1.281, stream-json, bypassPermissions), one run per case, trigger results via headless main loop · Windows dev machine, about 154 skills installed (116 listed name-only) · 5/6
- trigger-1, trigger-2, decoy-1, action-1 (behavior_pack/manifest.json format_version 2 with @minecraft/server, five distinct valid UUIDs, BP depends on the RP header), outcome-1 (named npm dist-tags) pass.
- decoy-2 · trigger · environment · Skill(minewright-project) for "Set up a Paper plugin project with Gradle", then wrote a Gradle project; the listing showed the skill by name only
- Listing note: with about 154 skills installed, Claude Code lists most of them by name only (4 of the 5 minewright skills, all but minewright-server); trigger cases ran against that real listing.
- Baselines (skills disabled, one run each): action-1 fail (Lantern_BP/ and Lantern_RP/, @minecraft/server 2.0.0); outcome-1 pass (ran npm view dist-tags unaided), redundant on one run: sharpen it.
- led to: L-009, C-20261027-3

### T-20261027-1 · 2026-10-27 · not yet run · skill · 0/0
- Suite scaffolded; no run recorded. Write the cases in `evals/evals.json` (at least two trigger prompts, two decoys, one action case with evidence, one outcome case), run the baseline without the skill, then run with it (`evergreen-test`).
- led to: none
