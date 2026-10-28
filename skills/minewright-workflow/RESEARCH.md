# Research: minewright-workflow

Findings that back [SKILL.md](SKILL.md). Changes they caused are logged in [CHANGELOG.md](CHANGELOG.md); procedural lessons live in [LEARNINGS.md](LEARNINGS.md); test runs and their evidence in [TESTS.md](TESTS.md); schedule and state in `evergreen.json`. Protocol: MAINTENANCE.md.

Topic: Designing and writing Minecraft Bedrock add-ons with an AI agent: design before code, stable Script API patterns, kid-fair rules, playtest checklist. Tier `moderate`. Last refresh 2026-10-27; next due 2026-11-26.

## Current understanding

- Stable Script API on 2026-10-27: `@minecraft/server` 2.11.0 and `@minecraft/server-ui` 2.3.0 (npm `latest`); Minecraft Bedrock 1.26.60. Beta lines (`2.12.0-beta...`, `2.4.0-beta...`) need the Beta APIs experiment. Bedrock Dedicated Server 1.26.60.6 lists exactly 0.1.0, 1.19.0, 2.11.0, 2.12.0-beta and 3.0.0-alpha for `@minecraft/server` (verified, see minewright-server).
- Turning on any experiment marks a world experimental permanently; custom (non-Marketplace) add-ons never earn achievements. So stable-only is the default, and GameTest (`@minecraft/server-gametest`, beta-only, never a stable release) is not the default test route.
- Stabilisation versions from the Learn changelog: `runInterval`/`runTimeout` 1.1.0; `applyImpulse`, `clearVelocity`, `applyDamage`, `addTag`, `kill` 1.2.0; `teleport`, `playerJoin`/`playerLeave` 1.3.0; `scriptEventReceive` 1.4.0; entity `getProperty`/`setProperty`, `entitySpawn`, `playerDimensionChange` 1.6.0; dynamic properties 1.7.0 (extended 1.9.0); `getGameMode`, `HudElement` visibility 1.11.0; custom commands 2.1.0; `EntityHealCause.TotemOfUndying` 2.8.0.
- Custom commands: `system.beforeEvents.startup` `customCommandRegistry.registerCommand`, name needs a namespace, `cheatsRequired` defaults to true, permission enum `CommandPermissionLevel` (Any, GameDirectors, Admin, Host, Owner), result `CustomCommandStatus` (Success, Failure).
- `EntityItemComponent` has only `itemStack`: no owner or dropper field and no drop event, so dropper credit needs inventory diffs.
- `kill()` bypassing a totem is an inference (separate code path), not documented.
- Tooling: Mojang's Creator Tools (`@minecraft/creator-tools` 0.20.0) ships an MCP server (`mct mcp`) and a Claude-style plugin with six skills (create-mob, create-item, create-block, design-model, debug-addon, creator-tools-cli). It covers content scaffolding and validation; design rules, Script API patterns, a server self-test loop and HUD are not in it, which is the gap this suite fills.

- Proven on BDS by the example add-on (R-20261027-6): custom command callbacks are read-only (world changes via `system.run`), short aliases clash with vanilla names, `worldLoad` is where state loads, and a ticking area makes a no-player self-test possible.

## Open questions

- Does `kill()` bypass a Totem of Undying on 1.26.60? Test on BDS with a fake player is not possible; needs an in-game check.
- How often do `@minecraft/server` minor versions ship now (every game release, or between)? The npm publish history answers it.
- Is "Custom Components V2" still gated behind an experiment in 2026? The Experimental Features page was a 2025 snapshot.
- Practice track: no dated write-up of an agent building Bedrock add-ons was found in this pass.

## Search plan

Four tracks; every refresh runs at least one query on each, scoped to the time since the last refresh.

Subject:

- `https://registry.npmjs.org/-/package/@minecraft/server/dist-tags` and `.../@minecraft/server-ui/dist-tags` (stable and beta lines)
- `https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/changelog?view=minecraft-bedrock-stable` (what stabilised, what was deprecated)
- `site:feedback.minecraft.net OR site:minecraft.net "Script API" <year>` (release notes for scripting changes)

Tooling:

- `gh api repos/Mojang/minecraft-creator-tools/releases` and its `plugins/minecraft/skills/` folder (what Mojang's own skills now cover)
- `path:SKILL.md "Bedrock" "add-on"` on GitHub code search; `https://skills.sh/api/search?q=minecraft`
- `https://registry.modelcontextprotocol.io/v0/servers?search=minecraft`

Practice:

- `"claude code" OR copilot OR cursor "bedrock add-on" OR "behavior pack" <year>`; HN Algolia `minecraft bedrock script api`
- Bedrock OSS Discord highlights and wiki.bedrock.dev changes (`https://github.com/Bedrock-OSS/bedrock-wiki/commits/main`)

Testing:

- `@minecraft/server-gametest` dist-tags (does it ever get a stable release?)
- `gh search code "scriptevent" "selftest" --extension ts` (others' in-world self-tests)
- this repository's `tests/test_scripts.py` and minewright-server's real BDS run

Best sources: npm registry JSON, Microsoft Learn with `view=minecraft-bedrock-stable`, Mojang GitHub repositories. Noisy: video tutorials and blog posts pinned to 2023 APIs.

## Findings log

Newest first. One entry per material finding. `Track` is subject, tooling, practice, or testing.

### R-20261027-7 · 2026-10-27 · Subject: Bedrock sound ids
- summary: beacon.activate, beacon.deactivate, random.orb, random.levelup, mob.elderguardian.curse, mob.warden.heartbeat, mob.endermen.scream and note.pling exist in the vanilla sound_definitions.json (checked by the example build). Applied to the patterns reference section 10.
- track: subject
- sources: https://github.com/Mojang/bedrock-samples/blob/main/resource_pack/sounds/sound_definitions.json (checked 2026-10-27)
- magnitude: 0.4 (recommendation changed)
- applied: C-20261027-2

### R-20261027-6 · 2026-10-27 · Testing: Script API behaviour proven by the example's BDS self-test
- summary: On BDS 1.26.60.6 the given.jar self-test passed 11 markers: a tickingarea loads a chunk with no players, spawnEntity and spawnItem work there, setProperty is readable a tick later, 0.6-block teleport steps pass a 3 by 5 stone wall, item entities keep dynamic properties, dimension.runCommand runs a custom command (successCount above 0), and state persists. The server logged the summon alias clash. Learn confirms `System.waitTicks` (stable), `worldLoad` (readable in early execution), `isValid` as a read-only property, and capitalised `GameMode` values. Custom command callbacks running read-only was observed by the example build, not stated on Learn. Applied to SKILL.md Step 4 and the patterns reference sections 3, 4, 5, 7, 8, 9, 10 and 12.
- track: testing
- sources: https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/system?view=minecraft-bedrock-stable, https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/worldafterevents?view=minecraft-bedrock-stable, https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity?view=minecraft-bedrock-stable, https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/gamemode?view=minecraft-bedrock-stable, https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/customcommandregistry?view=minecraft-bedrock-stable, local bds_run.py run 2026-10-27 (minewright-server R-20261027-5) (checked 2026-10-27)
- magnitude: 0.4 (recommendation changed)
- applied: C-20261027-2

### R-20261027-5 · 2026-10-27 · Practice and testing: no dated agent write-ups; the self-test loop proven instead
- summary: No dated practitioner account of an AI agent building Bedrock add-ons turned up in this pass (practice gap, carried to Open questions). For testing, the scriptevent self-test with `[MWTEST]` markers was run on a real Bedrock Dedicated Server 1.26.60.6 (minewright-server R-20261027-3), so Step 1 and Step 6 rely on it.
- track: practice
- sources: local run 2026-10-27, recorded in minewright-server RESEARCH.md (checked 2026-10-27)
- magnitude: n/a (initial)
- applied: C-20261027-1

### R-20261027-4 · 2026-10-27 · Tooling: Mojang's Creator Tools has an MCP server and its own skills
- summary: `@minecraft/creator-tools` 0.20.0 (npm, `mcpName` net.minecraft/mcp) ships `mct mcp` and a plugin in `plugins/minecraft/skills/` with create-mob, create-item, create-block, design-model, debug-addon and creator-tools-cli; it is listed on skills.sh. The only other Minecraft entry in the MCP registry is a server-administration tool, not an authoring one. Response: Step 2 points at Mojang's skills for content scaffolding, and this suite stays on design, build, checks, live tests and HUD.
- track: tooling
- sources: https://github.com/Mojang/minecraft-creator-tools, https://registry.npmjs.org/@minecraft/creator-tools/latest, https://registry.modelcontextprotocol.io/v0/servers?search=minecraft (checked 2026-10-27)
- magnitude: n/a (initial)
- applied: C-20261027-1

### R-20261027-3 · 2026-10-27 · Subject: custom commands, item entities and totems
- summary: `CommandPermissionLevel` (Any 0, GameDirectors 1, Admin 2, Host 3, Owner 4), `cheatsRequired` default true, registration in early execution; `CustomCommandStatus` Success/Failure; `EntityItemComponent` exposes only `itemStack`; `TotemOfUndying` in `EntityHealCause` from 2.8.0. `world.getEntity` and the `entityDie`, `entitySpawn`, `playerLeave`, `playerDimensionChange` after-events confirmed on the stable `world` and `worldafterevents` pages. Applied to Step 4 and the patterns reference.
- track: subject
- sources: https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/commandpermissionlevel?view=minecraft-bedrock-stable, https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/customcommandstatus?view=minecraft-bedrock-stable, https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityitemcomponent?view=minecraft-bedrock-stable, https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/worldafterevents?view=minecraft-bedrock-stable (checked 2026-10-27)
- magnitude: n/a (initial)
- applied: C-20261027-1

### R-20261027-2 · 2026-10-27 · Subject: experiments are permanent; custom add-ons earn no achievements
- summary: The experimental features page says a world with any experiment on cannot go back. Minecraft's FAQ says achievements work with add-ons only when released through the Marketplace, on all platforms. Applied to Step 3.
- track: subject
- sources: https://learn.microsoft.com/en-us/minecraft/creator/documents/experimentalfeaturestoggle, https://www.minecraft.net/en-us/article/achievements-now-work-with-add-ons (checked 2026-10-27)
- magnitude: n/a (initial)
- applied: C-20261027-1

### R-20261027-1 · 2026-10-27 · Subject: stable Script API versions and when each API stabilised
- summary: npm dist-tags give `@minecraft/server` 2.11.0 and `server-ui` 2.3.0 as stable on 2026-10-27, beta lines `2.12.0-beta.1.26.60-stable` and `2.4.0-beta.1.26.60-stable`. The Learn changelog gives the stabilisation versions listed in Current understanding. Applied to Steps 2 to 4 and references/script-api-patterns.md.
- track: subject
- sources: https://registry.npmjs.org/-/package/@minecraft/server/dist-tags, https://registry.npmjs.org/-/package/@minecraft/server-ui/dist-tags, https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/changelog?view=minecraft-bedrock-stable (checked 2026-10-27)
- magnitude: n/a (initial)
- applied: C-20261027-1
