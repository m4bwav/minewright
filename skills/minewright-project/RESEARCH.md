# Research: minewright-project

Findings that back [SKILL.md](SKILL.md). Changes they caused are logged in [CHANGELOG.md](CHANGELOG.md); procedural lessons live in [LEARNINGS.md](LEARNINGS.md); test runs and their evidence in [TESTS.md](TESTS.md); schedule and state in `evergreen.json`. Protocol: MAINTENANCE.md.

Topic: Bedrock add-on project layout: BP and RP manifests, UUIDs, module dependencies, TypeScript build with esbuild, .mcaddon packaging, install per platform. Tier `fast`. Last refresh 2026-10-27; next due 2026-11-10.

## Current understanding

- Versions on 2026-10-27: Minecraft Bedrock 1.26.60 (`@minecraft/vanilla-data` latest 1.26.60); `@minecraft/server` 2.11.0 and `@minecraft/server-ui` 2.3.0 stable on npm. The Learn server-ui module page still says 2.2.0 (doc lag); Bedrock Dedicated Server 1.26.60.6 accepts 2.3.0 (verified), so npm wins.
- Manifests in `Mojang/bedrock-samples` main: `format_version` 2 and `min_engine_version` `[1, 26, 50]` (one release behind the game).
- Build: `@minecraft/core-build-tasks` 5.7.1 (Mojang/minecraft-scripting-libraries); the `ts-starter` sample lives in `microsoft/minecraft-scripting-samples`, last touched 2025-11-07, with caret ranges `^2.0.0`. `eslint-plugin-minecraft-linting` 2.0.13. Creator Tools 0.20.0 needs Node 22+.
- Windows GDK path `%appdata%\Minecraft Bedrock\users\shared\games\com.mojang`; the UWP LocalState path is legacy. MCPE-227874: double-click import silently fails while the game runs (confirmed, GDK label, fix slated for Preview 1.26.70.20).
- Consoles: Microsoft's install tutorial gives no local import for consoles, only "activate on Windows, upload to a Realm". Experimental Script APIs do not run on Realms.
- Pack size: Creator Tools validation warns above about 100 MB (mobile and Realms uploads).

## Open questions

- When does the MCPE-227874 fix reach a stable release?
- Android 12+ scoped storage claim comes from the community wiki only; a Microsoft source would be better.
- Does base Realms (not Plus) accept an uploaded world with add-ons baked in? No source found either way.
- Exact Learn URL of the Creator Tools pack-size rule (the guessed one returned 404).

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
