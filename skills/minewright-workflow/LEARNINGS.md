# Learnings: minewright-workflow

Procedural lessons for [SKILL.md](SKILL.md). Research findings live in [RESEARCH.md](RESEARCH.md); every change is logged in [CHANGELOG.md](CHANGELOG.md); test runs in [TESTS.md](TESTS.md); state in `evergreen.json`. Format and write-time gate: MAINTENANCE.md (LEARNINGS-FORMAT). Retired entries go to LEARNINGS-ARCHIVE.md with a reason.

Write an entry the moment a real signal happens: a user correction, the same error twice, a discovered workaround, an environment fact, a stated preference, a failed test or a failure in use. Check existing entries first (add / update / retire / none). Trigger and Hypothesis are required. Promote after three confirmations; retire when harmful > helpful.

## Active

### L-001 · 2026-10-27 · Command callbacks are read-only; world changes go through system.run
- Trigger: The patterns reference said registration runs in early execution and so work must be deferred. Building given.jar showed the real constraint: the custom command callback itself runs in restricted execution, so spawning or setting properties inside it fails while reads (players, game modes, health) work.
- Hypothesis: Commands run inside the command pipeline, where the engine forbids state changes.
- Rule: Do reads inline in the callback; wrap every world change in system.run.
- Evidence: the given.jar build log (examples/given-jar, 2026-10-27); C-20261027-2
- Scope: skill
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27

### L-002 · 2026-10-27 · Custom command short aliases collide with vanilla names
- Trigger: BDS logged `Custom Command alias [summon] already in use. Required to use full name [given_jar:summon].` for the example's summon command.
- Hypothesis: Bedrock registers an unprefixed alias only when the name is free.
- Rule: Always document and test the full /ns:name; treat the short alias as a bonus.
- Evidence: R-20261027-6
- Scope: skill
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27

### L-003 · 2026-10-27 · Dynamic properties are not readable at the top level of a script
- Trigger: Loading world state at module top level is the obvious first try; the API only allows it after the world exists.
- Hypothesis: Top-level script code runs in early execution, before the world loads.
- Rule: Load state in world.afterEvents.worldLoad.
- Evidence: the given.jar build log (examples/given-jar, 2026-10-27); R-20261027-6
- Scope: skill
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27

### L-004 · 2026-10-27 · 2.x recall traps: isValid is a property, GameMode values are capitalised
- Trigger: The example's first drafts used isValid() and lowercase game mode strings, both from older API shapes.
- Hypothesis: Models remember 1.x method names and string enums.
- Rule: Check the class page before writing isValid, getGameMode comparisons or other enum values.
- Evidence: R-20261027-6
- Scope: skill
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27

### L-005 · 2026-10-27 · Reading an entity after remove() throws
- Trigger: Reading `entity.dimension` after `entity.remove()` threw InvalidEntityError in the self-test, which bds_run.py counted as a script error.
- Hypothesis: A removed entity's handle is invalid immediately.
- Rule: Copy dimension, location and ids before remove().
- Evidence: the given.jar build log (examples/given-jar, 2026-10-27)
- Scope: skill
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27

### L-006 · 2026-10-27 · Dropper credit needs two snapshots, an item tag, give-back and a merge caveat
- Trigger: Inventory-diff attribution missed drops when a loop ran between the drop and the entitySpawn event, and a stack of several items consumed them all.
- Hypothesis: The inventory already shows the lower count by the time the spawn event is handled; item entities stack and merge.
- Rule: Compare against the larger of the last two snapshots, tag credited items with a dynamic property, respawn amount-1 to give extras back, and state the merge limit in the rules.
- Evidence: the given.jar build log (examples/given-jar, 2026-10-27); R-20261027-6
- Scope: skill
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27

### L-007 · 2026-10-27 · A self-test with no players needs a ticking area
- Trigger: Spawning in the example's self-test failed until a chunk was loaded; no player is connected to a test server.
- Hypothesis: Chunks load only near players or in ticking areas.
- Rule: tickingarea add, poll getBlock until defined, then spawn; write the test as async with system.waitTicks.
- Evidence: R-20261027-6
- Scope: skill
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27

### L-008 · 2026-10-27 · Entity property and teleport behaviour confirmed on BDS
- Trigger: The example relied on setProperty being visible next tick and on teleport steps passing through walls; both were assumptions until the self-test checked them.
- Hypothesis: Property writes apply at the next tick; teleport ignores collision.
- Rule: Read properties back a tick later; step teleports at config speed for phasing movement.
- Evidence: R-20261027-6
- Scope: skill
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27

### L-009 · 2026-10-27 · Sound ids come from sound_definitions.json
- Trigger: The example needed eerie sounds; ids recalled from Java Edition do not exist in Bedrock.
- Hypothesis: Bedrock and Java name sounds differently.
- Rule: Check each id in the resource pack's sound_definitions.json before playSound.
- Evidence: R-20261027-7
- Scope: skill
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27

### L-010 · 2026-10-27 · Default spawn y can be a placeholder
- Trigger: Community reports say world.getDefaultSpawnLocation() returns y 32767 until the world settles; the example clamps it. Not verified here.
- Hypothesis: The spawn point is computed lazily.
- Rule: Clamp the y value or find ground before using the default spawn location.
- Evidence: community report, unverified
- Scope: skill
- Status: active · helpful 0 · harmful 0 · last_confirmed 2026-10-27

### L-011 · 2026-10-27 · Notice a totem save by health, not by the heal event
- Trigger: The patterns reference pointed at EntityHealCause.TotemOfUndying; the example found it simpler to check health a few ticks after applyDamage.
- Hypothesis: A player still alive after a lethal hit was saved; no event plumbing needed.
- Rule: After applyDamage, wait a few ticks and test minecraft:health currentValue above 0. Neither route has been seen in a real game yet.
- Evidence: the given.jar build log (examples/given-jar, 2026-10-27)
- Scope: skill
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27
