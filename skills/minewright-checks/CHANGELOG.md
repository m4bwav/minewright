# Changelog: minewright-checks

Every change to [SKILL.md](SKILL.md) and its companions, newest first, each with the reason. Reasons cite findings in [RESEARCH.md](RESEARCH.md) (`R-`), lessons in [LEARNINGS.md](LEARNINGS.md) (`L-`), and test runs in [TESTS.md](TESTS.md) (`T-`). State in `evergreen.json`. Protocol: MAINTENANCE.md.

Entry shape: `### C-YYYYMMDD-n · date · one-line summary`, then `because:` (IDs or "user request"), `files:` (file and section), and a sentence on what changed. Cite section headings, not line numbers.

### C-20261027-3 · 2026-10-27 · Description: skipped-checks phrasing; outcome-1 regex accepts "n't"
- because: T-20261027-2, L-006
- files: SKILL.md (description), evals/evals.json (outcome-1 regex, baselines)
- Adds 'checks were skipped, is it verified' to the trigger phrases (941 characters). outcome-1's regex now reads `skip.{0,80}(not|n't).{0,20}pass` (harness fix). The case still failed (T-20261027-3).

### C-20261027-2 · 2026-10-27 · mct runs on the packs only, through npx if asked; components check
- because: L-001 to L-005, R-20261027-5, R-20261027-6
- files: scripts/mw_check.py, scripts/mw_mct.py (new), SKILL.md description, Steps 1 and 2, Pitfalls; tests/test_scripts.py
- --mct now finds mct in node_modules or PATH, --mct-npx runs it through npx -y, --mct-bin names it; it validates a packs-only copy and files known false positives as noise. A new components check fails minecraft:pushable at entity format_version 1.26.10 and later.

### C-20261027-1 · 2026-10-27 · Created as an evergreen unit
- because: user request
- files: SKILL.md, RESEARCH.md, LEARNINGS.md, evergreen.json (skills: also TESTS.md and evals/evals.json)
- Initial version. Tier `moderate`, interval 30d. See R-20261027-1 for the research basis; the first test run, for a skill, is logged in TESTS.md.
