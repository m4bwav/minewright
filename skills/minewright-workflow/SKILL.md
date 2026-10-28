---
name: minewright-workflow
description: "Designing and writing Minecraft Bedrock add-ons: a one-pager and one config file before code (every duration in one place, a test mode), APIs looked up on Microsoft Learn and npm, not recalled, stable modules only (Beta APIs make a world experimental for good), patterns that hold up (one runInterval loop, state in world dynamic properties, entity properties for rendering, the unloaded-chunk trap, inventory diffs to find who dropped an item), fair rules for young players, a playtest checklist. Use whenever the agent plans, writes or reviews Bedrock add-on code, or on 'make a Minecraft add-on', 'design my Bedrock mod', 'add a custom mob that...', 'write the script for my add-on', 'is this API real or current', 'what should we playtest', or 'refresh minewright-workflow'. Pack layout, builds and .mcaddon are minewright-project; static checks are minewright-checks; running it on a server is minewright-server; HUD and UI are minewright-hud."
---

# Bedrock add-ons an agent can stand behind

Outcome: an add-on whose rules were written down before the code, whose every Script API call was looked up in current docs and is stable, whose numbers live in one config file, and which ships with a self-test and a playtest checklist.

## Step 0: freshness (every use, one read)

Read `evergreen.json` next to this file. If `contradiction` is set or today is on or after `next_due`, tell the user in one line, do the task with the current content, then refresh (`evergreen-refresh`) in the same session. If `verify_at_use` is true, re-check `volatile_claims` first. If `tests.failing` is non-empty, say so in one line and run `evergreen-tune` after the task.

## Step 1: design before code

For a new add-on or a gameplay feature, write `docs/ONE-PAGER.md` in the project first and show it to the user (template in [references/game-design.md](references/game-design.md)):

- Who plays (ages, platforms, how many players, LAN or Realm), the core loop as one verb, a session's length, what is out of scope.
- Every rule as a sentence a player could repeat, including what happens on edge cases: a player logs off, changes dimension, dies some other way, is in creative or spectator.
- A config file (`src/config.ts` or `scripts/config.js`) holding every duration, speed, radius and count, with a test mode that turns minutes into seconds. Code reads the config; no magic numbers.
- A self-test the add-on runs on `/scriptevent <ns>:selftest` that prints `[MWTEST] PASS|FAIL <name>` lines (minewright-server runs it on a real server).

Write the config file in the same step as the one-pager, even when you stop for approval: the plan is done only when both `docs/ONE-PAGER.md` and the config file exist on disk. Confirm both paths before replying. Bug fixes and reviews skip this step.

## Step 2: look it up, do not recall it

The Script API gets a new minor version with each game release, and models still emit APIs that were renamed or never left beta. Before using an API you are not sure is current:

- Microsoft Learn reference: `https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/minecraft-server?view=minecraft-bedrock-stable` (the `view=minecraft-bedrock-stable` moniker shows only stable members). Class pages follow the same path, for example `.../minecraft/server/entity`.
- Versions: `https://registry.npmjs.org/-/package/@minecraft/server/dist-tags` (`latest` is the stable one). The Learn changelog can lag npm by a day.
- Vanilla ids: the `@minecraft/vanilla-data` package, and `Mojang/bedrock-samples` for JSON examples.
- Mojang's Creator Tools (`@minecraft/creator-tools`, CLI `mct`) ships an MCP server and its own skills for creating mobs, items and blocks and for validation. If the user has it, use its `create-*` skills for content scaffolding; this suite covers design, build, checks, live tests and HUD around it.

Name the page in the reply. If a page cannot be reached, say the API is unverified rather than guessing.

## Step 3: stable modules only

- Depend on `@minecraft/server` and `@minecraft/server-ui` by their stable version strings (current numbers: minewright-project). A `-beta` version needs the Beta APIs experiment, and turning any experiment on marks the world experimental for good: it cannot be turned back.
- GameTest (`@minecraft/server-gametest`) has never had a stable release, so it is not the default test route; the scriptevent self-test is.
- Custom add-ons do not earn achievements (only Marketplace add-ons do), experiments or not. Tell the user before they build on a survival world they care about; a copy of the world is safer.

## Step 4: Script API patterns that hold up

Full examples and the reasons: [references/script-api-patterns.md](references/script-api-patterns.md).

- One `system.runInterval` loop drives the game state machine; event handlers only record what happened. Keep the rules in a pure module with no `@minecraft/*` imports so `node --test` can test them from `test/`, and a thin adapter that talks to the game.
- Persist state in world dynamic properties (JSON string, versioned), loaded in `world.afterEvents.worldLoad`, so a reload or crash resumes. Entity properties (`minecraft:entity` `description.properties`, `client_sync: true`) carry what the client must render, read by render controllers with `query.property('ns:name')`.
- Register slash commands in `system.beforeEvents.startup` with `customCommandRegistry.registerCommand`; names need a namespace, `cheatsRequired` defaults to true, and the permission enum is `CommandPermissionLevel`. The callback runs read-only: make world changes inside `system.run`. Document the full `/ns:name`, because the short alias is dropped when a vanilla command owns it (`/summon`). Keep a `/scriptevent` fallback.
- Entities in unloaded chunks do not tick and cannot be found; a chasing or guarding entity must be re-found or re-spawned near its target, and duplicates removed.
- Nothing records who dropped an item: `minecraft:item` has only `itemStack`. Credit the dropper by diffing each player's inventory between ticks and matching the new item entity near them.
- `applyDamage` respects a Totem of Undying; `kill()` most likely does not (inferred, not documented). Use damage when a totem should be able to save the player.
- Recall traps the example add-on hit: `isValid` is a property, `GameMode` values are capitalised, and reading an entity after `remove()` throws (patterns reference, section 10).
- Creative and spectator players are exempt from anything that hunts or scores players unless the design says otherwise.

## Step 5: fair rules for young players

From [references/game-design.md](references/game-design.md): a threat always has a tell and a way out, timers are visible, failure is never permanent loss of a player's own items unless the user asked for it, no fast flashing, scary moments are short and announced by sound first, and an operator can always skip or pause. Write these into the one-pager.

## Step 6: verify

Run minewright-checks (static), the pure-module unit tests, then minewright-server's self-test on Bedrock Dedicated Server. A human playtest is the last word; hand over the checklist in the game-design reference (section 5) with the test-mode timings.

## Output

The one-pager (Step 1, when it applied), the code, each doc page cited, the check and self-test results, and the playtest checklist still owed.

## While working: capture learnings

If the user corrects you, the same error happens twice, a workaround is found, or an environment fact is discovered, write it to `LEARNINGS.md` now (format in MAINTENANCE.md; check existing entries first). If a learning proves a claim above wrong, fix it here, log it in `CHANGELOG.md`, and set `contradiction` in `evergreen.json`.

## Maintenance

This skill is evergreen (tier `moderate`; the schedule is in `evergreen.json`). Files: `evergreen.json` (state), [RESEARCH.md](RESEARCH.md) (findings and search plan), [CHANGELOG.md](CHANGELOG.md) (every change, with reasons), [LEARNINGS.md](LEARNINGS.md) (lessons), [TESTS.md](TESTS.md) and `evals/evals.json` (the cases that prove it and the runs). Protocol: MAINTENANCE.md (pointer to the installed evergreen plugin). Refresh with `evergreen-refresh`; test with `evergreen-test`; fix a failure with `evergreen-tune`. Sibling skills in this suite: minewright-checks, minewright-hud, minewright-project, minewright-server, minewright-workflow.
