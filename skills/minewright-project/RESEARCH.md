# Research: minewright-project

Findings that back [SKILL.md](SKILL.md). Changes they caused are logged in [CHANGELOG.md](CHANGELOG.md); procedural lessons live in [LEARNINGS.md](LEARNINGS.md); test runs and their evidence in [TESTS.md](TESTS.md); schedule and state in `evergreen.json`. Protocol: MAINTENANCE.md.

Topic: Bedrock add-on project layout: BP and RP manifests, UUIDs, module dependencies, TypeScript build with esbuild, .mcaddon packaging, install per platform. Tier `fast`. Last refresh 2026-10-27; next due 2026-11-10.

## Current understanding

- Versions on 2026-10-27: Minecraft Bedrock 1.26.60 (`@minecraft/vanilla-data` latest 1.26.60); `@minecraft/server` 2.11.0 and `@minecraft/server-ui` 2.3.0 stable on npm. The Learn server-ui module page still says 2.2.0 (doc lag); Bedrock Dedicated Server 1.26.60.6 accepts 2.3.0 (verified), so npm wins.
- Manifests in `Mojang/bedrock-samples` main: `format_version` 2 and `min_engine_version` `[1, 26, 60]` since v1.26.60.5 (2026-10-28); the skill keeps [1, 26, 50] as a wider floor.
- Build: `@minecraft/core-build-tasks` 5.7.1 (Mojang/minecraft-scripting-libraries); the `ts-starter` sample lives in `microsoft/minecraft-scripting-samples`, last touched 2025-11-07, with caret ranges `^2.0.0`. `eslint-plugin-minecraft-linting` 2.0.13. Creator Tools 0.20.0 needs Node 22+.
- Windows GDK path `%appdata%\Minecraft Bedrock\users\shared\games\com.mojang`; the UWP LocalState path is legacy. MCPE-227874: double-click import silently fails while the game runs (confirmed, GDK label, fix slated for Preview 1.26.70.20).
- Consoles: Microsoft's install tutorial gives no local import for consoles, only "activate on Windows, upload to a Realm". Experimental Script APIs do not run on Realms.
- Pack size: Creator Tools validation warns above about 100 MB (mobile and Realms uploads).

- Entity components depend on `format_version`: `minecraft:pushable` is rejected from 1.26.10 (BDS-verified, R-20261027-5). Vanilla resource files stay at 1.8.0 to 1.10.0. The working dev dependency set pins TypeScript 5.9.3 and ESLint 9.39.5 because the lint plugins do not accept TypeScript 7 or ESLint 10 (R-20261027-6).

## Open questions

- When does the MCPE-227874 fix reach a stable release?
- Android 12+ scoped storage claim comes from the community wiki only; a Microsoft source would be better.
- Does base Realms (not Plus) accept an uploaded world with add-ons baked in? No source found either way.
- Exact Learn URL of the Creator Tools pack-size rule (the guessed one returned 404).
- Which other components were renamed between 1.21 and 1.26.50 entity format versions? Only `pushable` is known so far.

## Search plan

Four tracks; every refresh runs at least one query on each, scoped to the time since the last refresh.

Subject:

- npm dist-tags for `@minecraft/server`, `@minecraft/server-ui`, `@minecraft/vanilla-data`
- `Mojang/bedrock-samples` `behavior_pack/manifest.json` on `main` (format_version, min_engine_version)
- `https://mojira.dev/MCPE-227874` (import bug status); Learn `gdkpcprojectfolder` and `gettingstarted`

Tooling:

- npm `@minecraft/core-build-tasks`, `eslint-plugin-minecraft-linting`, `@minecraft/creator-tools` latest; `microsoft/minecraft-scripting-samples` ts-starter `package.json`
- `path:SKILL.md "mcaddon"` on GitHub; skills.sh search `minecraft`

Practice:

- `"mcaddon" esbuild OR "core-build-tasks" <year>` on GitHub and blogs; Bedrock OSS wiki project-setup page history

Testing:

- this repository's `tests/test_scripts.py`; `mct validate` rule list changes in Creator Tools releases

Best sources: npm registry, Mojang GitHub, Microsoft Learn, mojira.dev for bugs. Noisy: download sites that rehost `.mcaddon` files.

## Findings log

Newest first. One entry per material finding. `Track` is subject, tooling, practice, or testing.

### R-20261030-1 · 2026-10-30 · Quiet: samples manifest moved to [1, 26, 60]
- summary: bedrock-samples v1.26.60.5 (2026-10-28) raised `min_engine_version` in behavior_pack/manifest.json to [1, 26, 60]; the skill's [1, 26, 50] stays valid (a lower floor loads on more clients). npm: @minecraft/server 2.11.0 and server-ui 2.3.0 still latest (betas 2.12.0-beta / 2.4.0-beta for 1.26.61); core-build-tasks 5.7.1, eslint-plugin-minecraft-linting 2.0.13, creator-tools 0.20.0 unchanged. MCPE-227874 still Confirmed. Tooling, practice, testing: nothing new. Known failing case decoy-2 (listing budget) unchanged; not touched.
- track: subject (tooling, practice, testing quiet)
- sources: https://github.com/Mojang/bedrock-samples/blob/main/behavior_pack/manifest.json, https://registry.npmjs.org/@minecraft/server, https://mojira.dev/MCPE-227874 (checked 2026-10-30)
- magnitude: 0.15
- applied: none (RESEARCH.md only)

### R-20261027-7 · 2026-10-27 · Testing: the example add-on's npm scripts
- summary: In examples/given-jar with Node 24.18 and npm 11.16: npm ci (117 packages; allow-scripts warning for esbuild, build unaffected), typecheck pass, lint pass, node --test test/*.test.ts 40 of 40 pass, esbuild bundle 47.1 KB, pack wrote dist/given-jar-0.1.0.mcaddon (19 files, 388 KB). Confirms the Step 3 scripts and the --external:@minecraft/* wildcard.
- track: testing
- sources: local run 2026-10-27; examples/given-jar/package.json in this repository (checked 2026-10-27)
- magnitude: 0.4 (recommendation changed)
- applied: C-20261027-2

### R-20261027-6 · 2026-10-27 · Tooling: dev dependency set that installs and lints together
- summary: npm on 2026-10-27: typescript latest 7.0.2, eslint latest 10.13.0; typescript-eslint 8.72.1 peer typescript `>=4.8.4 <6.1.0`; eslint-plugin-minecraft-linting 2.0.13 depends on eslint ^9.17.0 and typescript ^5.6.0. The example pins typescript 5.9.3, eslint 9.39.5, typescript-eslint 8.72.1, esbuild 0.28.2, @types/node 24.19.2. Applied to Step 3 and the versions reference.
- track: tooling
- sources: https://registry.npmjs.org/typescript, https://registry.npmjs.org/typescript-eslint/8.72.1, https://registry.npmjs.org/eslint-plugin-minecraft-linting/2.0.13 (checked 2026-10-27)
- magnitude: 0.4 (recommendation changed)
- applied: C-20261027-2

### R-20261027-5 · 2026-10-27 · Subject: minecraft:pushable is rejected from entity format_version 1.26.10
- summary: BDS 1.26.60.6 refused the fixture entity with minecraft:pushable at format_version 1.26.10 and 1.26.50 (`[ERROR] [Actor] ... minecraft:pushable: this component was found in the input, but is not present in the Schema`, whole entity not loaded) and loaded it at 1.26.0 and with pushable_by_entity/pushable_by_block at 1.26.50. The vanilla cow behavior entity is at 1.26.10 with the new components; vanilla resource files are at 1.10.0 (cow client entity; zombie 1.26.0) and 1.8.0 (cow render controller, animation, geometry). Applied to Step 2 and references/versions-and-formats.md.
- track: subject
- sources: https://github.com/Mojang/bedrock-samples/blob/main/behavior_pack/entities/cow.json, https://github.com/Mojang/bedrock-samples/blob/main/resource_pack/entity/cow.entity.json, https://github.com/Mojang/bedrock-samples/blob/main/resource_pack/render_controllers/cow.render_controllers.json, local bds_run.py runs 2026-10-27 (checked 2026-10-27)
- magnitude: 0.4 (recommendation changed)
- applied: C-20261027-2

### R-20261027-4 · 2026-10-27 · Practice and testing: a quiet pass
- summary: No dated practitioner write-up on agent-built Bedrock projects found. Testing for this skill is structural: minewright-checks validates the manifests it produces, and minewright-server loads them on BDS.
- track: testing
- sources: local run 2026-10-27; tests/test_scripts.py in this repository (checked 2026-10-27)
- magnitude: n/a (initial)
- applied: C-20261027-1

### R-20261027-3 · 2026-10-27 · Tooling: official build tasks, the TS starter and Creator Tools
- summary: `@minecraft/core-build-tasks` 5.7.1 (2026-10-15) from Mojang/minecraft-scripting-libraries; `eslint-plugin-minecraft-linting` 2.0.13; ts-starter in microsoft/minecraft-scripting-samples pins `^5.5.0` build tasks and `^2.0.0` modules; Creator Tools 0.20.0 (`mct create`, `add`, `deploy`, Node 22+). Applied to Step 3 as the official alternative to a plain esbuild bundle.
- track: tooling
- sources: https://github.com/Mojang/minecraft-scripting-libraries, https://github.com/microsoft/minecraft-scripting-samples/tree/main/ts-starter, https://github.com/Mojang/minecraft-creator-tools (checked 2026-10-27)
- magnitude: n/a (initial)
- applied: C-20261027-1

### R-20261029-1 · 2026-10-29 · Subject: CurseForge author flow for Bedrock add-ons
- Source: https://authors.curseforge.com (create form, Files and Media tabs), observed while posting project 1773067 on 2026-10-29.
- Finding: Create has four tabs (game, general, description, license). Bedrock files accept .mcpack and .mcaddon only; the game-version list topped out at 26.50 while the game was 1.26.60; adding a file queues the project for moderation with no separate submit; the project stays hidden until approved.
- Magnitude: new

### R-20261027-2 · 2026-10-27 · Subject: install paths and the import-while-running bug
- summary: GDK path and legacy UWP path from the Learn project-folder page; iOS, Android and console steps from the getting-started tutorial (console tab: Realm upload only); MCPE-227874 confirmed and open in stable. Applied to Step 5.
- track: subject
- sources: https://learn.microsoft.com/en-us/minecraft/creator/documents/gdkpcprojectfolder, https://learn.microsoft.com/en-us/minecraft/creator/documents/gettingstarted, https://mojira.dev/MCPE-227874, https://learn.microsoft.com/en-us/minecraft/creator/documents/bedrockserver/scripting (checked 2026-10-27)
- magnitude: n/a (initial)
- applied: C-20261027-1

### R-20261027-1 · 2026-10-27 · Subject: module and engine versions
- summary: npm: `@minecraft/server` latest 2.11.0, `@minecraft/server-ui` latest 2.3.0, `@minecraft/vanilla-data` 1.26.60. Learn's server-ui module page says 2.2.0 (lag). bedrock-samples main manifest: format_version 2, min_engine_version [1, 26, 50]. BDS 1.26.60.6's own error message lists the versions it accepts (2.11.0 and 2.3.0 among them). Applied to Step 2 and Step 3.
- track: subject
- sources: https://registry.npmjs.org/-/package/@minecraft/server/dist-tags, https://registry.npmjs.org/-/package/@minecraft/server-ui/dist-tags, https://github.com/Mojang/bedrock-samples/blob/main/behavior_pack/manifest.json, https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/minecraft-server-ui?view=minecraft-bedrock-stable (checked 2026-10-27)
- magnitude: n/a (initial)
- applied: C-20261027-1
