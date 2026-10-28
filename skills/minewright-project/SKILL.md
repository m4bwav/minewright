---
name: minewright-project
description: "Set up and package a Minecraft Bedrock add-on project: behavior pack and resource pack folders, manifest.json format_version 2 with fresh UUIDs, min_engine_version, script module dependencies on @minecraft/server and @minecraft/server-ui by version string, a TypeScript build with esbuild or core-build-tasks, .mcaddon packaging, and install on Windows (GDK com.mojang folder, import-while-running bug), mobile, and consoles through a Realm. Use whenever the user asks to 'start a Bedrock add-on', 'make a behavior pack', 'set up TypeScript for Minecraft scripts', 'what version of @minecraft/server', 'build the mcaddon', 'how do I install this add-on', 'where is com.mojang', 'my add-on won't import', 'get it on Xbox or Switch', or 'refresh minewright-project'. Design and Script API code are minewright-workflow; checks are minewright-checks; live server tests are minewright-server. Bedrock only, not Java (Paper, Spigot, Fabric)."
---

# Bedrock add-on project, build and install

Outcome: a project with a behavior pack and a resource pack whose manifests use current versions and unique UUIDs, one command that builds the script bundle and one that packs a `.mcaddon`, and install steps that match the user's platform.

## Step 0: freshness (every use, one read)

Read `evergreen.json` next to this file. This skill is tier `fast`: module versions and engine versions move with every game release. If `contradiction` is set or today is on or after `next_due`, tell the user in one line, do the task with the current content, then refresh (`evergreen-refresh`). If `verify_at_use` is true, re-check `volatile_claims` first. If `tests.failing` is non-empty, say so and run `evergreen-tune` after the task.

## Step 1: layout

```
my-addon/
  behavior_pack/        manifest.json, entities/, items/, scripts/main.js (built), texts/
  resource_pack/        manifest.json, entity/, models/entity/, textures/, render_controllers/, texts/
  src/                  TypeScript sources (main.ts, config.ts, core/*.ts)
  test/                 node --test unit tests for src/core (*.test.ts)
  package.json  tsconfig.json  eslint.config.mjs  scripts/pack.py (or pack.mjs)
```

Namespace: one, lowercase letters, digits and underscores (`given_jar`, not `given.jar`). Write it in the one-pager.

## Step 2: manifests

Behavior pack `manifest.json` (current numbers checked 2026-10-27; re-check before use):

```json
{
  "format_version": 2,
  "header": { "name": "pack.name", "description": "pack.description", "uuid": "<new>",
              "version": [1, 0, 0], "min_engine_version": [1, 26, 50] },
  "modules": [
    { "type": "data", "uuid": "<new>", "version": [1, 0, 0] },
    { "type": "script", "language": "javascript", "uuid": "<new>", "version": [1, 0, 0], "entry": "scripts/main.js" }
  ],
  "dependencies": [
    { "uuid": "<resource pack header uuid>", "version": [1, 0, 0] },
    { "module_name": "@minecraft/server", "version": "2.11.0" },
    { "module_name": "@minecraft/server-ui", "version": "2.3.0" }
  ]
}
```

- Every UUID is new (`python -c "import uuid; print(uuid.uuid4())"`) and used once: a UUID shared by two packs or modules can stop one of them loading.
- Resource pack: one `resources` module, and a dependency on the behavior pack header UUID so they travel together.
- `min_engine_version` `[1, 26, 50]` is what Mojang's own samples use today. Do not set it above the oldest game version your players have.
- Module versions are plain strings. Bedrock Dedicated Server 1.26.60.6 accepts `@minecraft/server` 0.1.0, 1.19.0, 2.11.0, 2.12.0-beta and 3.0.0-alpha, and `@minecraft/server-ui` 0.1.0, 1.3.0, 2.3.0, 2.4.0-beta and 3.0.0-alpha (listed in its error when asked for a version it lacks). Use the stable one; `-beta` needs the Beta APIs experiment (minewright-workflow Step 3).
- Bump `header.version` on every release you hand out, or a device that already has that version may keep its cached copy.

Entity and resource file `format_version`s: copy component names from a `Mojang/bedrock-samples` file at the same `format_version`, never from memory or an older tutorial. Behavior entities at 1.26.10 and later no longer accept `minecraft:pushable` (use `minecraft:pushable_by_entity: {}` and `minecraft:pushable_by_block: {}`, or neither); Bedrock Dedicated Server refuses the whole entity, and the game shows no error. Do not raise a `format_version` because Creator Tools recommends it without rerunning minewright-checks (its `components` check) and the server self-test. Vanilla resource files still use old versions (client entities 1.10.0, render controllers, animations and geometry 1.8.0), so there is no need to raise those. Details: [references/versions-and-formats.md](references/versions-and-formats.md).

## Step 3: TypeScript build

The npm types must match the manifest: `npm i -E @minecraft/server@2.11.0 @minecraft/server-ui@2.3.0`, plus pinned dev dependencies. The newest TypeScript (7.x) and ESLint (10.x) break the Minecraft lint plugin, so pin the set in [references/versions-and-formats.md](references/versions-and-formats.md) (TypeScript 5.9.3, ESLint 9.39.5). Minimal scripts:

```json
"scripts": {
  "build": "esbuild src/main.ts --bundle --format=esm --platform=neutral --target=es2022 --external:@minecraft/* --outfile=behavior_pack/scripts/main.js",
  "typecheck": "tsc --noEmit",
  "test": "node --test test/*.test.ts",
  "lint": "eslint .",
  "pack": "npm run build && python scripts/pack.py"
}
```

- `@minecraft/*` stay external (esbuild accepts the wildcard): the game provides them. Everything else is bundled into one file.
- `tsconfig.json`: `"module": "es2022"`, `"moduleResolution": "bundler"`, `"strict": true`, `"noEmit": true` (esbuild emits), and for Node 24's type stripping in tests `"allowImportingTsExtensions": true`, `"erasableSyntaxOnly": true` (no enums or parameter properties), `"verbatimModuleSyntax": true` and `"types": ["node"]`.
- npm 11 does not run esbuild's install script until approved (`allow-scripts` warning); esbuild still works through its platform package, so leave it unapproved.
- Official alternative: Mojang's `@minecraft/core-build-tasks` (5.7.1) with the `ts-starter` sample in `microsoft/minecraft-scripting-samples` gives `build`, `lint`, `local-deploy` and `mcaddon` tasks. The sample pins older caret ranges (`@minecraft/server ^2.0.0`); pin exact versions instead. Lint rules for Script API code: `eslint-plugin-minecraft-linting` (2.0.13).
- Mojang's Creator Tools CLI (`mct create`, `mct add`, `mct deploy`; Node 22+) scaffolds projects too. Use it if the user prefers; keep this layout's build and tests.

## Step 4: package

An `.mcaddon` is a zip holding the pack folders at its root (`behavior_pack/`, `resource_pack/`); a `.mcpack` is a zip of one pack. `scripts/pack.mjs` builds first, then zips into `dist/<name>-<version>.mcaddon` and leaves out `src/`, `test/` and `node_modules/`. Creator Tools warns above about 100 MB because phones and Realms uploads struggle; stay well under.

## Step 5: install, per platform

- Windows (current GDK build): the game folder moved to `%appdata%\Minecraft Bedrock\users\shared\games\com.mojang` (Preview: `Minecraft Bedrock Preview`). The old `...\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang` is legacy. Double-clicking an `.mcaddon` imports it, but only when Minecraft is fully closed: with the game running the import silently fails (bug MCPE-227874, fix slated for Preview 1.26.70.20). Or copy the pack folders into `development_behavior_packs` and `development_resource_packs`, which reload each time the game starts.
- iPhone and iPad: open the file from Files or a share sheet, choose Minecraft, and wait for the import notification.
- Android: open the downloaded file from the Files app and choose Minecraft. Android 12 and later hide `Android/data/com.mojang.minecraftpe` from most file managers, so import, not copy.
- Xbox, PlayStation and Switch cannot import files. Build the world with the add-on active on Windows or a phone, upload it to a Realm, and open the Realm on the console. Experimental features do not work on Realms gameplay servers.
- Then: create or edit a world, Behavior Packs, activate the pack (the resource pack comes along through the dependency). Leave experiments off.
- LAN play: the host turns on Multiplayer Game and Visible to LAN Players in the world settings; others join from Play, Friends, LAN games, and download the packs on joining. Give operators (Game Directors) to whoever runs the add-on's commands. (Community-documented; Mojang's help site could not be fetched to confirm.)

## Output

The files created or changed, the versions used and where they were checked, the build and pack commands with their output, and install steps for the user's platform only.

## While working: capture learnings

If the user corrects you, the same error happens twice, a workaround is found, or an environment fact is discovered, write it to `LEARNINGS.md` now (format in MAINTENANCE.md; check existing entries first). If a learning proves a claim above wrong, fix it here, log it in `CHANGELOG.md`, and set `contradiction` in `evergreen.json`.

## Maintenance

This skill is evergreen (tier `fast`; the schedule is in `evergreen.json`). Files: `evergreen.json` (state), [RESEARCH.md](RESEARCH.md) (findings and search plan), [CHANGELOG.md](CHANGELOG.md) (every change, with reasons), [LEARNINGS.md](LEARNINGS.md) (lessons), [TESTS.md](TESTS.md) and `evals/evals.json` (the cases that prove it and the runs). Protocol: MAINTENANCE.md (pointer to the installed evergreen plugin). Refresh with `evergreen-refresh`; test with `evergreen-test`; fix a failure with `evergreen-tune`. Sibling skills in this suite: minewright-checks, minewright-hud, minewright-project, minewright-server, minewright-workflow.
