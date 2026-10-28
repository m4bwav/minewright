# Research: minewright-server

Findings that back [SKILL.md](SKILL.md). Changes they caused are logged in [CHANGELOG.md](CHANGELOG.md); procedural lessons live in [LEARNINGS.md](LEARNINGS.md); test runs and their evidence in [TESTS.md](TESTS.md); schedule and state in `evergreen.json`. Protocol: MAINTENANCE.md.

Topic: Live testing a Bedrock add-on on Bedrock Dedicated Server: download, world setup, pack activation, scriptevent self-tests, markers, loopback. Tier `moderate`. Last refresh 2026-10-27; next due 2026-11-26.

## Current understanding

- Current BDS: 1.26.60.6 for Windows and Linux (Preview 1.26.70.21), from `https://www.minecraft.net/bedrockdedicatedserver/bin-win/bedrock-server-1.26.60.6.zip` (88.7 MB; `bin-linux` for Linux), as listed by the download page's own API (`net-secondary.web.minecraft-services.net/api/v1.0/download/links`).
- Packs: per-world `behavior_packs/` and `resource_packs/` with `world_behavior_packs.json` / `world_resource_packs.json` (pack_id and version array) activate them; top-level folders share packs across worlds. The how-to HTML shipped in the zip still says packs cannot be activated in a level; Learn is right and the real run agrees.
- `config/default/permissions.json` allowlists script modules; 1.26.60.6 ships server, server-ui, server-admin, server-gametest, server-editor and debug-utilities. `@minecraft/server-net` must be added and works only on BDS.
- Verified on a real run (R-20261027-3): startup in 3 to 6 s, console `scriptevent` reaches scripts (even with cheats off), `console.warn` lines come out as `[... WARN] [Scripting] ...`, script errors as `[... ERROR] [Scripting] [<pack>] ...`, and a missing module version prints the versions the server has.
- GameTest needs Beta APIs; there is no `/gametest runall`. `/scriptevent` needs Game Directors permission and has a 2048-character payload cap.
- A Windows client joining a same-machine BDS still needs the loopback exemption, now given with package SIDs (`CheckNetIsolation.exe LoopbackExempt -a -p=S-1-15-2-...`).
- Script debugging: `allow-outbound-script-debugging`, `allow-inbound-script-debugging`, `force-inbound-debug-port` (default 19144).

- The console runs custom commands without a slash and prints their replies as INFO lines (R-20261027-5); a component the entity's format_version rejects shows as `[ERROR] [Actor]` and `[ERROR] [Log]` lines (R-20261027-6).

## Open questions

- Does the Linux build behave the same under bds_run.py (stdout buffering, `LD_LIBRARY_PATH`)? Only Windows was run.
- The 1.26.60.6 server.properties has `transport=nethernet`, `server-udp-ports=19132` and signs in to a signalling service at start. Can two test servers run at once without clashing on 19132, and does a run work offline?
- Is the resource pack applied? The console's "Pack Stack" line lists only the behavior pack in both the fixture and the example runs, and no resource-pack line ever appears; with no client connected there is nothing to see (R-20261027-5).
- Creator Tools has `mct dedicatedserve`; is it a better runner than bds_run.py for some cases?

## Search plan

Four tracks; every refresh runs at least one query on each, scoped to the time since the last refresh.

Subject:

- `https://net-secondary.web.minecraft-services.net/api/v1.0/download/links` (current BDS versions, the same API the download page uses)
- Learn `documents/bedrockserver/getting-started` and `.../scripting` (packs, permissions, loopback); `commands/commands/gametest` and `.../scriptevent`

Tooling:

- Creator Tools `mct dedicatedserve --help` and its changelog; `gh search repos bedrock dedicated server docker` (container images that track versions)
- `path:SKILL.md "bedrock dedicated server"` on GitHub; MCP registry `?search=bedrock`

Practice:

- `"bedrock dedicated server" "script api" test OR ci <year>`; HN Algolia `bedrock dedicated server`

Testing:

- run `bds_run.py` on `tests/fixtures/addon` after each BDS update and diff the console lines this file quotes (startup line, marker format, error format)

Best sources: the download links API, the zip's own release-notes.txt, Microsoft Learn. Noisy: hosting companies' blog posts.

## Findings log

Newest first. One entry per material finding. `Track` is subject, tooling, practice, or testing.

### R-20261027-6 · 2026-10-27 · Subject: how a rejected entity component shows on the console
- summary: Fixture copies with minecraft:pushable produced two lines at format_version 1.26.10 and 1.26.50 and none at 1.26.0: `[ERROR] [Log] mwtest | actor_definitions | ... | fixture:dummy | minecraft:entity |  -> components -> minecraft:pushable: this component was found in the input, but is not present in the Schema` and `[ERROR] [Actor] ... ERROR: Entity 'fixture:dummy' failed to load from JSON: parse errors occurred: ...`. bds_run.py counts both. Applied to Step 3.
- track: subject
- sources: local bds_run.py runs 2026-10-27 (checked 2026-10-27)
- magnitude: 0.2 (minor)
- applied: C-20261027-3

### R-20261027-5 · 2026-10-27 · Testing: the example add-on's self-test on BDS 1.26.60.6
- summary: `python skills/minewright-server/scripts/bds_run.py examples/given-jar --cmd "scriptevent given_jar:selftest"` with ten --expect names: ok true, `[2026-10-27 19:46:53:689 INFO] Server started.` after 4.5 s, 6.9 s in all, 11 PASS markers (scripts_loaded, config_loads, commands_registered, custom_command_runs, tickingarea_loaded, sphere_spawns, entity_properties, one_sphere_per_world, item_delivery, teleport_phases_through_blocks, state_persists), 0 errors. The console showed `Custom Command alias [summon] already in use. Required to use full name [given_jar:summon].` as a WARN (not counted). A second run with `--cmd given_jar:status --cmd "given_jar:testmode on" --cmd "scriptevent given_jar:status"` printed the status as an INFO line and showed test mode on afterwards: the console runs custom commands without a slash. Only the behavior pack appears in Pack Stack. Applied to SKILL.md Steps 2 and 3.
- track: testing
- sources: local runs 2026-10-27; examples/given-jar/src/main.ts in this repository (checked 2026-10-27)
- magnitude: 0.2 (minor)
- applied: C-20261027-3

### R-20261027-4 · 2026-10-27 · Tooling and practice: Creator Tools can run a server too; nothing else found
- summary: Creator Tools lists `dedicatedserve`, `setserverprops` and `eula` commands (CLI README); not tried. No skill or MCP server for testing add-ons on BDS was found; the MCP registry's Minecraft entry administers servers. Practice: no dated write-up found.
- track: tooling
- sources: https://github.com/Mojang/minecraft-creator-tools/blob/main/app/jsnode/README.md, https://registry.modelcontextprotocol.io/v0/servers?search=minecraft (checked 2026-10-27)
- magnitude: n/a (initial)
- applied: C-20261027-1

### R-20261027-3 · 2026-10-27 · Testing: bds_run.py on a real BDS 1.26.60.6 (Windows)
- summary: Ran `python skills/minewright-server/scripts/bds_run.py tests/fixtures/addon --download --cmd "scriptevent fixture:selftest"` on Windows 11 with Python 3.14: download and unzip, then `[2026-10-27 19:17:01:763 INFO] Server started.` after 5.7 s, `Script event fixture:selftest has been sent`, `[... WARN] [Scripting] [MWTEST] PASS fixture`, `[MWTEST] DONE`, clean stop (`Quit correctly`), 6.9 s in all; later cached runs started in 3.3 to 3.5 s. Packs copied into `worlds/mwtest/behavior_packs/` and `resource_packs/` with the two world JSON files loaded (`Pack Stack - [00] minewright fixture BP ... @ worlds/mwtest/behavior_packs/behavior_pack`); the server kept the files and created `level.dat` and `db/` beside them. A copy with a runtime error produced `[... ERROR] [Scripting] [minewright fixture BP] ReferenceError: 'undefinedThing' is not defined    at <anonymous> (main.js:21)`. A manifest asking for `@minecraft/server` 9.9.0 produced `requested invalid version [9.9.0]` with the list 0.1.0, 1.19.0, 2.11.0, 2.12.0-beta, 3.0.0-alpha (server-ui: 0.1.0, 1.3.0, 2.3.0, 2.4.0-beta, 3.0.0-alpha). With `allow-cheats=false` the console scriptevent still reached the script. Applied to Step 3.
- track: testing
- sources: local run 2026-10-27; tests/test_scripts.py in this repository (checked 2026-10-27)
- magnitude: n/a (initial)
- applied: C-20261027-1

### R-20261027-2 · 2026-10-27 · Subject: packs, module allowlist, GameTest, scriptevent, loopback, debugger
- summary: World pack JSON files activate per-world packs; permissions.json lists allowed modules (server-net absent by default); GameTest needs Beta APIs and has no runall; scriptevent needs Game Directors and caps at 2048 characters; loopback exemption uses SIDs; debugger keys and port 19144. Applied to Steps 2, 4 and 5.
- track: subject
- sources: https://learn.microsoft.com/en-us/minecraft/creator/documents/createaworldtemplate, https://learn.microsoft.com/en-us/minecraft/creator/documents/bedrockserver/getting-started, https://learn.microsoft.com/en-us/minecraft/creator/documents/bedrockserver/scripting, https://learn.microsoft.com/en-us/minecraft/creator/commands/commands/gametest, https://learn.microsoft.com/en-us/minecraft/creator/commands/commands/scriptevent, https://learn.microsoft.com/en-us/minecraft/creator/documents/scripting/vscode-debugger (checked 2026-10-27)
- magnitude: n/a (initial)
- applied: C-20261027-1

### R-20261027-1 · 2026-10-27 · Subject: the current BDS build and where to get it
- summary: Stable 1.26.60.6 (Windows and Linux), Preview 1.26.70.21, read from the download page's API; the Windows zip is 88.7 MB and needs no special headers except that minecraft.net drops connections for some user agents (L-001). Applied to Step 1 and the script's default version.
- track: subject
- sources: https://www.minecraft.net/bedrockdedicatedserver/bin-win/bedrock-server-1.26.60.6.zip, https://net-secondary.web.minecraft-services.net/api/v1.0/download/links, https://www.minecraft.net/eula (checked 2026-10-27)
- magnitude: n/a (initial)
- applied: C-20261027-1
