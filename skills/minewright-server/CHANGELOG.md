# Changelog: minewright-server

Every change to [SKILL.md](SKILL.md) and its companions, newest first, each with the reason. Reasons cite findings in [RESEARCH.md](RESEARCH.md) (`R-`), lessons in [LEARNINGS.md](LEARNINGS.md) (`L-`), and test runs in [TESTS.md](TESTS.md) (`T-`). State in `evergreen.json`. Protocol: MAINTENANCE.md.

Entry shape: `### C-YYYYMMDD-n · date · one-line summary`, then `because:` (IDs or "user request"), `files:` (file and section), and a sentence on what changed. Cite section headings, not line numbers.

### C-20261027-2 · 2026-10-27 · Verified run details and download agent
- because: R-20261027-3, L-001, L-002, L-003
- files: scripts/bds_run.py (download), SKILL.md Step 3, LEARNINGS.md
- The download sends a plain user agent after minecraft.net dropped the first one; Step 3 now quotes the console lines seen on a real BDS 1.26.60.6 run instead of expected ones.
### C-20261027-1 · 2026-10-27 · Created as an evergreen unit
- because: user request
- files: SKILL.md, RESEARCH.md, LEARNINGS.md, evergreen.json (skills: also TESTS.md and evals/evals.json)
- Initial version. Tier `moderate`, interval 30d. See R-20261027-1 for the research basis; the first test run, for a skill, is logged in TESTS.md.
