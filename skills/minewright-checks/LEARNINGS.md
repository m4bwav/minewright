# Learnings: minewright-checks

Procedural lessons for [SKILL.md](SKILL.md). Research findings live in [RESEARCH.md](RESEARCH.md); every change is logged in [CHANGELOG.md](CHANGELOG.md); test runs in [TESTS.md](TESTS.md); state in `evergreen.json`. Format and write-time gate: MAINTENANCE.md (LEARNINGS-FORMAT). Retired entries go to LEARNINGS-ARCHIVE.md with a reason.

Write an entry the moment a real signal happens: a user correction, the same error twice, a discovered workaround, an environment fact, a stated preference, a failed test or a failure in use. Check existing entries first (add / update / retire / none). Trigger and Hypothesis are required. Promote after three confirmations; retire when harmful > helpful.

## Active

### L-001 · 2026-10-27 · mct validate on a project folder reports dev files as errors
- Trigger: Running mct 0.20.0 on examples/given-jar as the skill said gave exit 4 with 14 errors (extraneous files, unknown JSON in art/workflows); the same packs copied alone gave 0 errors.
- Hypothesis: mct expects a folder holding only packs (or behavior_packs/ and resource_packs/).
- Rule: Validate a temporary copy of the pack folders; mw_check.py now does this.
- Evidence: R-20261027-5
- Scope: skill
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27

### L-002 · 2026-10-27 · Creator Tools has known false positives
- Trigger: mct flagged the example's render controller for a missing uv_anim (vanilla controllers omit it), asked for client entity 1.26.50, and flagged a vanilla UI texture link.
- Hypothesis: mct's schema marks optional fields required and recommends the newest versions everywhere.
- Rule: File these under noise; keep them out of errors and warnings.
- Evidence: R-20261027-5
- Scope: skill
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27

### L-003 · 2026-10-27 · --mct found nothing unless mct was installed
- Trigger: The example builder ran mct from a scratch install that mw_check.py could not see, so --mct was a skip.
- Hypothesis: Only node_modules and PATH were searched.
- Rule: Offer --mct-npx (npx -y, with consent) and --mct-bin PATH.
- Evidence: the given.jar build log (examples/given-jar, 2026-10-27)
- Scope: skill
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27

### L-004 · 2026-10-27 · No check caught a component the format_version rejects
- Trigger: json, manifest, identifiers and mct all passed the example's entity while BDS refused it for minecraft:pushable at 1.26.50.
- Hypothesis: Component validity depends on the format_version, which no check compared.
- Rule: The components check knows the rejected-component table; extend it when the server finds another.
- Evidence: R-20261027-6
- Scope: skill
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27

### L-005 · 2026-10-27 · HUD texture paths sent by scripts are unchecked
- Trigger: The example sends vanilla texture paths to its JSON UI image; a wrong key shows a missing texture only in game.
- Hypothesis: The paths live in TypeScript, not in pack JSON.
- Rule: Keep a unit test against a saved list from item_texture.json in the project; say the check cannot see them.
- Evidence: the given.jar build log (examples/given-jar, 2026-10-27)
- Scope: skill
- Status: active · helpful 0 · harmful 0 · last_confirmed 2026-10-27

### L-006 · 2026-10-27 · Concept questions about checks are answered without loading the skill
- Trigger: T-20261027-2/-3 outcome-1 ("typescript and lint were skipped ... is my add-on verified?") never invoked minewright-checks in three runs, with the description listed or not; two answers said a skip is not a pass, one did not.
- Hypothesis: the router loads a skill to act, not to answer a yes/no question it thinks it can answer; the listing is name-only on this machine besides.
- Rule: keep the "a skip is not a pass" rule in the skill's report step (Step 3), where action runs do load it; do not rely on the description to pull in pure questions. Consider rewriting outcome-1 as an action prompt with a mw_check.py report.
- Evidence: T-20261027-3; C-20261027-3
- Scope: skill
- Status: active · helpful 0 · harmful 0 · last_confirmed 2026-10-27

### L · 2026-10-30 · the no-skill arm still finds the skill on disk
- Trigger: T-20261030-1 outcome-1. All three `worth --ab` without-arm runs listed `~/.claude/skills`, found the minewright-checks junction, read SKILL.md and ran mw_check.py.
- Hypothesis: on a machine where the skill is installed as a junction, a baseline with Bash is never skill-free; the `--setting-sources project` isolation only hides the listing.
- Rule: treat baselines from this machine as contaminated when the trace touches `.claude/skills`; for a clean baseline run in a throwaway home (`claude plugin eval`, which needs WSL2 here for Bash cases) or with the junction temporarily absent.
- Evidence: T-20261030-1 (scratch results ck2, without-1..3)
