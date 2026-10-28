# Changelog: minewright-workflow

Every change to [SKILL.md](SKILL.md) and its companions, newest first, each with the reason. Reasons cite findings in [RESEARCH.md](RESEARCH.md) (`R-`), lessons in [LEARNINGS.md](LEARNINGS.md) (`L-`), and test runs in [TESTS.md](TESTS.md) (`T-`). State in `evergreen.json`. Protocol: MAINTENANCE.md.

Entry shape: `### C-YYYYMMDD-n · date · one-line summary`, then `because:` (IDs or "user request"), `files:` (file and section), and a sentence on what changed. Cite section headings, not line numbers.

### C-20261027-2 · 2026-10-27 · Script API corrections from the example add-on
- because: L-001 to L-011, R-20261027-6, R-20261027-7
- files: SKILL.md Step 4; references/script-api-patterns.md sections 1, 3, 4, 5, 7, 8, 9, 10 (new), 12
- The command section now names the real constraint (the callback runs read-only, so world changes go through system.run), aliases, worldLoad, the attribution details, the no-player self-test recipe with waitTicks, recall traps and sound ids. Tests live in test/.

### C-20261027-1 · 2026-10-27 · Created as an evergreen unit
- because: user request
- files: SKILL.md, RESEARCH.md, LEARNINGS.md, evergreen.json (skills: also TESTS.md and evals/evals.json)
- Initial version. Tier `moderate`, interval 30d. See R-20261027-1 for the research basis; the first test run, for a skill, is logged in TESTS.md.
