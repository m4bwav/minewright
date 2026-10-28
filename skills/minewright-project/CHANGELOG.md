# Changelog: minewright-project

Every change to [SKILL.md](SKILL.md) and its companions, newest first, each with the reason. Reasons cite findings in [RESEARCH.md](RESEARCH.md) (`R-`), lessons in [LEARNINGS.md](LEARNINGS.md) (`L-`), and test runs in [TESTS.md](TESTS.md) (`T-`). State in `evergreen.json`. Protocol: MAINTENANCE.md.

Entry shape: `### C-YYYYMMDD-n · date · one-line summary`, then `because:` (IDs or "user request"), `files:` (file and section), and a sentence on what changed. Cite section headings, not line numbers.

### C-20261027-3 · 2026-10-27 · Description: Bedrock only, not Java
- because: T-20261027-2, L-009
- files: SKILL.md (description), evals/evals.json (baselines)
- The description ends "Bedrock only, not Java (Paper, Spigot, Fabric)" and is trimmed elsewhere to stay at 935 characters (esbuild/core-build-tasks, GDK folder, mobile). It passes decoy-2 when descriptions are listed; on this machine the skill is listed by name only (T-20261027-3).

### C-20261027-2 · 2026-10-27 · Entity format versions, pinned dev dependencies, test/ layout, LAN
- because: L-001 to L-008, R-20261027-5, R-20261027-6, R-20261027-7
- files: SKILL.md Steps 1 to 5; references/versions-and-formats.md (new)
- Adds the pushable rule and the advice not to raise format versions on Creator Tools' word, the dev dependency pins, the esbuild wildcard and tsconfig for type stripping, test/ instead of tests/, and LAN joining.

### C-20261027-1 · 2026-10-27 · Created as an evergreen unit
- because: user request
- files: SKILL.md, RESEARCH.md, LEARNINGS.md, evergreen.json (skills: also TESTS.md and evals/evals.json)
- Initial version. Tier `fast`, interval 14d. See R-20261027-1 for the research basis; the first test run, for a skill, is logged in TESTS.md.
