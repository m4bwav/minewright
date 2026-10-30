# Changelog: minewright-hud

Every change to [SKILL.md](SKILL.md) and its companions, newest first, each with the reason. Reasons cite findings in [RESEARCH.md](RESEARCH.md) (`R-`), lessons in [LEARNINGS.md](LEARNINGS.md) (`L-`), and test runs in [TESTS.md](TESTS.md) (`T-`). State in `evergreen.json`. Protocol: MAINTENANCE.md.

Entry shape: `### C-YYYYMMDD-n · date · one-line summary`, then `because:` (IDs or "user request"), `files:` (file and section), and a sentence on what changed. Cite section headings, not line numbers.

### C-20261030-1 · 2026-10-30 · 1.26.60 hotbar restructure noted
- because: R-20261030-1
- files: SKILL.md (Ore UI risk paragraph), RESEARCH.md (Current understanding)
- Names the new hotbar_slots_renderer and hotbar_grid_frame and says hotbar overrides must be re-checked.

### C-20261027-4 · 2026-10-27 · Prefix example matches the code: gj_item:
- because: wiki verification run 2026-10-27 (ai-docs note), L-001
- files: SKILL.md Step 3
- The visibility expression used 'gj:item:' while Step 3's sender and the example use 'gj_item:'.

### C-20261027-3 · 2026-10-27 · action-1 evidence accepts shell writes
- because: T-20261027-2, L-006
- files: evals/evals.json (action-1 evidence, baselines)
- action-1's trace evidence now matches Write|Edit|MultiEdit|Bash|PowerShell with setActionBar|setTitle and names the script file's content as the side effect. No change to SKILL.md.

### C-20261027-2 · 2026-10-27 · Texture-path titles, title_frame, item_texture.json, BDS blind spot
- because: L-001 to L-005, R-20261027-6, R-20261027-7
- files: SKILL.md Steps 3, 4 and 6
- The popup example sends the texture path and the name in the subtitle; adds the title_frame replace and factory-child notes (unverified in game), the item_texture.json key traps and fixture test, and that BDS cannot test any of it.

### C-20261027-1 · 2026-10-27 · Created as an evergreen unit
- because: user request
- files: SKILL.md, RESEARCH.md, LEARNINGS.md, evergreen.json (skills: also TESTS.md and evals/evals.json)
- Initial version. Tier `fast`, interval 14d. See R-20261027-1 for the research basis; the first test run, for a skill, is logged in TESTS.md.
