# Changelog: minewright-hud

Every change to [SKILL.md](SKILL.md) and its companions, newest first, each with the reason. Reasons cite findings in [RESEARCH.md](RESEARCH.md) (`R-`), lessons in [LEARNINGS.md](LEARNINGS.md) (`L-`), and test runs in [TESTS.md](TESTS.md) (`T-`). State in `evergreen.json`. Protocol: MAINTENANCE.md.

Entry shape: `### C-YYYYMMDD-n · date · one-line summary`, then `because:` (IDs or "user request"), `files:` (file and section), and a sentence on what changed. Cite section headings, not line numbers.

### C-20261027-2 · 2026-10-27 · Texture-path titles, title_frame, item_texture.json, BDS blind spot
- because: L-001 to L-005, R-20261027-6, R-20261027-7
- files: SKILL.md Steps 3, 4 and 6
- The popup example sends the texture path and the name in the subtitle; adds the title_frame replace and factory-child notes (unverified in game), the item_texture.json key traps and fixture test, and that BDS cannot test any of it.

### C-20261027-1 · 2026-10-27 · Created as an evergreen unit
- because: user request
- files: SKILL.md, RESEARCH.md, LEARNINGS.md, evergreen.json (skills: also TESTS.md and evals/evals.json)
- Initial version. Tier `fast`, interval 14d. See R-20261027-1 for the research basis; the first test run, for a skill, is logged in TESTS.md.
