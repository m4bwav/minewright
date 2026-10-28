# Learnings: minewright-project

Procedural lessons for [SKILL.md](SKILL.md). Research findings live in [RESEARCH.md](RESEARCH.md); every change is logged in [CHANGELOG.md](CHANGELOG.md); test runs in [TESTS.md](TESTS.md); state in `evergreen.json`. Format and write-time gate: MAINTENANCE.md (LEARNINGS-FORMAT). Retired entries go to LEARNINGS-ARCHIVE.md with a reason.

Write an entry the moment a real signal happens: a user correction, the same error twice, a discovered workaround, an environment fact, a stated preference, a failed test or a failure in use. Check existing entries first (add / update / retire / none). Trigger and Hypothesis are required. Promote after three confirmations; retire when harmful > helpful.

## Active

### L-001 · 2026-10-27 · minecraft:pushable breaks entities at format_version 1.26.10 and later
- Trigger: The example's entity used minecraft:pushable at format_version 1.26.50; BDS 1.26.60.6 refused the whole entity and every spawn self-test failed. The skill said nothing about entity format versions.
- Hypothesis: The 1.26.10 entity schema replaced pushable with the presence components pushable_by_entity and pushable_by_block.
- Rule: Copy components from a bedrock-samples entity at the same format_version; run the components check and a BDS self-test after any raise.
- Evidence: R-20261027-5
- Scope: skill
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27

### L-002 · 2026-10-27 · Creator Tools' format-version advice can break an entity
- Trigger: mct 0.20.0 recommended raising the entity to 1.26.50 and did not flag minecraft:pushable as invalid there; following it broke the entity.
- Hypothesis: mct checks versions and schemas separately.
- Rule: Treat format-version recommendations as optional; never raise without a BDS run.
- Evidence: R-20261027-5
- Scope: skill
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27

### L-003 · 2026-10-27 · The newest TypeScript and ESLint break the Minecraft lint plugin
- Trigger: npm installed TypeScript 7.0.2 and ESLint 10 by default; typescript-eslint 8.72.1 allows TypeScript below 6.1 and eslint-plugin-minecraft-linting 2.0.13 depends on TypeScript ^5.6 and ESLint ^9.17.
- Hypothesis: The lint ecosystem lags the compiler's major releases.
- Rule: Pin TypeScript 5.9.3 and ESLint 9.39.5 (table in references/versions-and-formats.md).
- Evidence: R-20261027-6
- Scope: skill
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27

### L-004 · 2026-10-27 · npm 11 skips esbuild's install script, and that is fine
- Trigger: npm ci printed an allow-scripts warning for esbuild 0.28.2's postinstall.
- Hypothesis: npm 11 no longer runs install scripts without approval; esbuild ships its binary in an optional platform package.
- Rule: Leave it unapproved; the build works.
- Evidence: R-20261027-7
- Scope: skill
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27

### L-005 · 2026-10-27 · Type stripping needs an erasable tsconfig
- Trigger: Node 24.18 runs test/*.test.ts directly, but only when the code avoids enums and parameter properties and imports use .ts extensions.
- Hypothesis: Type stripping removes types without transforming code.
- Rule: Set allowImportingTsExtensions, erasableSyntaxOnly, verbatimModuleSyntax and types [node]; use --external:@minecraft/* in esbuild.
- Evidence: R-20261027-7
- Scope: skill
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27

### L-006 · 2026-10-27 · Tests live in test/, not tests/
- Trigger: The project layout said tests/ while minewright-workflow and the example add-on used test/.
- Hypothesis: Two skills written separately drifted.
- Rule: Use test/*.test.ts everywhere (layout, npm scripts, pack exclusions).
- Evidence: the given.jar build log (examples/given-jar, 2026-10-27)
- Scope: skill
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27

### L-007 · 2026-10-27 · Vanilla resource files still use old format versions
- Trigger: The example builder listed vanilla client entity, render controller, animation and geometry versions; checking bedrock-samples gave cow 1.10.0, 1.8.0, 1.8.0 and 1.8.0, with some mobs at 1.26.0.
- Hypothesis: Mojang raises resource format versions only when a file needs a newer feature.
- Rule: Do not raise resource format versions for their own sake; quote versions from bedrock-samples, not memory.
- Evidence: R-20261027-5
- Scope: skill
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27

### L-008 · 2026-10-27 · LAN play steps were missing
- Trigger: The install step covered importing but not how friends on the same network join; the example targets a LAN game.
- Hypothesis: Install guides stop at single player.
- Rule: Add the host's Multiplayer and LAN visibility toggles and the join path; mark it community-documented until Mojang's help site is reachable.
- Evidence: the given.jar build log (examples/given-jar, 2026-10-27)
- Scope: skill
- Status: active · helpful 0 · harmful 0 · last_confirmed 2026-10-27

### L-009 · 2026-10-27 · Most skills are listed by name only on this machine
- Trigger: T-20261027-2/-3. decoy-2 (a Paper plugin with Gradle) invoked minewright-project before and after a 'Bedrock only' clause was added. A probe asking the headless session to copy its skill listing showed about 154 skills, 116 of them name-only, minewright-project among them; with `SLASH_COMMAND_TOOL_CHAR_BUDGET=400000` every skill had its description and the same case passed.
- Hypothesis: Claude Code trims the skill listing to a character budget; past it, descriptions are dropped and the model routes on the skill name alone, so description edits cannot change triggering here.
- Rule: before tuning a description for a trigger failure, check whether the listing shows it (ask a headless run to copy its listing entry). If it is name-only, classify the failure `environment`, not undertrigger/overtrigger; fewer installed skills or a larger listing budget is the fix, not more words.
- Evidence: T-20261027-3 (r1 default listing vs r2 raised budget); C-20261027-3
- Scope: environment
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27
