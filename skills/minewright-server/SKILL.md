---
name: minewright-server
description: "Test a Minecraft Bedrock add-on live on Bedrock Dedicated Server (BDS): one script (bds_run.py) caches BDS (download only with --download, which means the user accepted the Minecraft EULA), builds a throwaway world with the packs active, starts the server, sends console commands such as /scriptevent ns:selftest, reads [MWTEST] PASS/FAIL markers and script errors from the console, stops the server and prints one JSON report. Also: why GameTest is not the default (Beta APIs), server.properties, the module allowlist, the script debugger, and joining a local BDS from Windows (loopback exemption). Use whenever the user asks to 'test my add-on on a server', 'run the self-test', 'does it actually load', 'set up a Bedrock dedicated server', 'run GameTest', 'my scripts don't run on the server', 'connect to my local server', or says 'refresh minewright-server'. Static checks are minewright-checks; writing the self-test is minewright-workflow."
---

# Live tests on Bedrock Dedicated Server

Outcome: the add-on's packs load on a real Bedrock server, its self-test prints `[MWTEST] PASS` for every check, and the reply quotes the JSON report from `bds_run.py`, not a belief that it would work.

## Step 0: freshness (every use, one read)

Read `evergreen.json` next to this file. If `contradiction` is set or today is on or after `next_due`, tell the user in one line, do the task with the current content, then refresh (`evergreen-refresh`) in the same session. If `verify_at_use` is true, re-check `volatile_claims` (the BDS version) first. If `tests.failing` is non-empty, say so in one line and run `evergreen-tune` after the task.

## Step 1: get BDS (once, with the user's yes)

BDS ships for Windows and Linux (x64) only; on macOS use a Linux VM or container. The download is about 89 MB from minecraft.net and comes under the Minecraft EULA (`https://www.minecraft.net/eula`) and privacy policy. Ask before the first download; the user's yes is the `--download` flag:

```
python <this skill>/scripts/bds_run.py <project> --download --cmd "scriptevent <ns>:selftest"
```

It goes to `%LOCALAPPDATA%\minewright\bds\<version>` or `~/.cache/minewright/bds/<version>` (default version 1.26.60.6; `--version` for another). Without `--download` and without a cached copy, the script stops with exit 2 and downloads nothing. `--bds-dir` uses a BDS folder the user already has.

## Step 2: run the self-test

The add-on must answer a script event with markers, one line each, printed with `console.warn` (pattern in minewright-workflow's script-api-patterns reference, section 12):

```
[MWTEST] PASS <name>
[MWTEST] FAIL <name> <why>
[MWTEST] DONE
```

```
python <this skill>/scripts/bds_run.py <project> --cmd "scriptevent <ns>:selftest" --expect config --expect spawn
```

- Build first (minewright-project); the packs are copied as they are on disk. Every folder under the project with a `manifest.json` becomes a world pack.
- The script copies BDS to a temporary instance, creates `worlds/mwtest/` with the packs in `behavior_packs/` and `resource_packs/` and listed in `world_behavior_packs.json` / `world_resource_packs.json`, sets `server.properties` (test world name, a free port, cheats on, allow-list on with nobody on it, content log to the console), adds any script module the packs need to `config/default/permissions.json`, starts the server, waits for `Server started.`, sends each `--cmd` (or `--cmd-file` lines), and reads until `[MWTEST] DONE`, every `--expect` name, or `--wait` seconds (default 20). Then it sends `stop`.
- JSON report: `ok`, `started_line`, `startup_seconds`, `markers`, `errors` (lines like `[... ERROR] [Scripting] ...`), `summary` (pass, fail, missing, errors), `problems`, and `console_tail` when something failed. Exit 0 ok, 1 failed, 2 usage or setup error. `--log FILE` writes the whole console; `--keep` keeps the instance folder; `--setup-only` builds it without starting.

Quote the summary in the reply. No PASS marker at all usually means the script never loaded: read `errors` for a module version the server lacks (the error lists the versions it has) or a runtime exception with file and line.

- On success the report has no console lines. Add `--log console.txt` to read replies to commands, warnings such as alias clashes, and the pack stack.
- More commands are more `--cmd` flags, sent in order after start: custom commands without the slash (`--cmd "ns:status"`, whose reply is an INFO line), `--cmd "ns:testmode on"`, then `--cmd "scriptevent ns:selftest"`. For a long interactive session, `--keep` the instance and run `bedrock_server` in it by hand.

## Step 3: what was verified on BDS 1.26.60.6 (Windows, 2026-10-27)

- Startup to `[... INFO] Server started.` took 3 to 6 seconds on a fresh world; a full run with stop took about 5 to 7 seconds.
- Packs placed in the world folder and listed in `world_*_packs.json` load; the console shows `Pack Stack - [00] <name> (id: ..., version: 1.0.0) @ worlds/mwtest/behavior_packs/...`.
- `scriptevent fixture:selftest` typed on the server console reaches `system.afterEvents.scriptEventReceive`, even with `allow-cheats=false`. The console answers `Script event fixture:selftest has been sent`.
- `console.warn` output appears as `[... WARN] [Scripting] [MWTEST] PASS fixture`; uncaught errors as `[... ERROR] [Scripting] [<pack name>] ReferenceError: ... at <anonymous> (main.js:21)`.
- A behavior entity with a component its `format_version` no longer accepts fails to load with `[... ERROR] [Actor] ... minecraft:pushable: this component was found in the input, but is not present in the Schema` (and a matching `[Log]` line); `bds_run.py` counts both as errors. Only the server catches this; the game shows nothing.
- The example add-on's self-test (`examples/given-jar`, 11 markers) proved on the same server: a `tickingarea` loads a chunk with no players connected, entities and items spawn there, entity properties read back one tick after being set, teleport steps carry an entity through stone, item entities keep dynamic properties, custom commands run from `dimension.runCommand` and from the console, and world state persists. A `Custom Command alias [summon] already in use` warning is expected and not an error.
- Not testable here: the resource pack (it is not even listed in the pack stack), JSON UI, textures, sounds and anything a player does. Those need the game.
- The shipped `permissions.json` already allows `@minecraft/server`, `server-ui`, `server-admin`, `server-gametest`, `server-editor` and `debug-utilities`. `@minecraft/server-net` (BDS only) must be added; the script does that when a pack depends on it.

## Step 4: GameTest, if the user insists

`@minecraft/server-gametest` has never had a stable release: it needs the Beta APIs experiment, and that makes a world experimental for good. If the user wants it, use a separate throwaway world only. The command is `/gametest run <name>`, `runset`, `runthese`, `runthis` and friends; there is no `/gametest runall`. Default to the scriptevent self-test.

## Step 5: playing on the local server from Windows

- Leave `bds_run.py` for tests; for a play server, run BDS from its own folder and edit `server.properties` (`online-mode=true` when anyone outside the house can reach it, `allow-list` with the players' gamertags).
- Windows blocks the Minecraft app from reaching a server on the same machine. Microsoft's BDS getting-started page gives the loopback exemption as `CheckNetIsolation.exe LoopbackExempt -a -p=<SID>` with separate SIDs for the retail and Preview apps; copy the SID from that page (`https://learn.microsoft.com/en-us/minecraft/creator/documents/bedrockserver/getting-started`) and run it in an admin prompt, with the user's approval. Other devices on the LAN do not need it.
- Script debugging: `allow-outbound-script-debugging`, `allow-inbound-script-debugging` and `force-inbound-debug-port` (default 19144) in `server.properties`, then attach Microsoft's Minecraft debugger extension in VS Code (https://learn.microsoft.com/en-us/minecraft/creator/documents/scripting/vscode-debugger).
- Realms run no experimental Script APIs. Consoles are widely reported to reach only Realms and featured servers, not a typed address (not confirmed on a Microsoft page).

## Output

The `bds_run.py` summary and markers, every error line with its fix, the BDS version used, and what is still owed (a human playtest in the game).

## While working: capture learnings

If the user corrects you, the same error happens twice, a workaround is found, or an environment fact is discovered, write it to `LEARNINGS.md` now (format in MAINTENANCE.md; check existing entries first). If a learning proves a claim above wrong, fix it here, log it in `CHANGELOG.md`, and set `contradiction` in `evergreen.json`.

## Maintenance

This skill is evergreen (tier `moderate`; the schedule is in `evergreen.json`). Files: `evergreen.json` (state), [RESEARCH.md](RESEARCH.md) (findings and search plan), [CHANGELOG.md](CHANGELOG.md) (every change, with reasons), [LEARNINGS.md](LEARNINGS.md) (lessons), [TESTS.md](TESTS.md) and `evals/evals.json` (the cases that prove it and the runs). Protocol: MAINTENANCE.md (pointer to the installed evergreen plugin). Refresh with `evergreen-refresh`; test with `evergreen-test`; fix a failure with `evergreen-tune`. Sibling skills in this suite: minewright-checks, minewright-hud, minewright-project, minewright-server, minewright-workflow.
