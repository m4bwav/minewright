# given.jar

A Minecraft Bedrock add-on for a few friends on one LAN world. A dark sphere with one big bloodshot eye, The Given, floats in the world.
When its eye opens it asks for an item, the same item for everybody. Every player in survival must find their own
copy and drop it on the sphere before the clock runs out. If everyone delivers, the eye closes for a break and then
asks again. If someone does not, the whites of the eye turn blood red and The Given flies through walls to catch them, one player at a
time.

- Players: [HOW-TO-PLAY.md](HOW-TO-PLAY.md) (one page)
- Install on Windows: [INSTALL.md](INSTALL.md)
- Manual test checklist: [PLAYTEST.md](PLAYTEST.md)
- Textures and model layout: [ART.md](ART.md)

Display name `given.jar`; identifier namespace `given_jar` (a dot inside a namespace is risky in identifiers and
Molang, so the code uses an underscore). Target: Windows PC, LAN, about 4 players, no experiments, cheats off.

## Rules (what the code does)

| | Normal | Test mode |
|---|---|---|
| Mission time | 30 min | 30 s |
| `/given_jar:skip` takes off | 10 min | 10 s |
| Eye closed between missions | 10 min | 10 s |
| First mission after the sphere arrives | 5 s | 5 s |

- One sphere per world (`given_jar:watcher`). Spawn egg or `/given_jar:summon`. A second one disappears with a chat
  message.
- A mission picks one item from the current tier (`/given_jar:tier easy|medium|hard`, default easy) and never the
  same item twice in a row. Items: [src/items.ts](src/items.ts).
- Delivering: drop the item (Q) on the sphere or just in front of it. The player who dropped it gets the credit,
  found by watching whose inventory lost one, not by who stands closest. One item is used up; extras are given back.
- Everyone in survival or adventure has delivered: the eye closes for the break, then a new mission starts by itself.
- Clock runs out: everyone in survival/adventure who did not deliver is on the list. The eye turns red. The sphere
  flies straight at the closest one, through blocks, 6 blocks a second. A touch deals 1000 damage through
  `applyDamage`, so a Totem of Undying still works. Then the next closest, until each has been caught once.
- Caught also means: left the game, went to another dimension, or died some other way.
- A totem saved them: the eye closes and the sphere backs away for 3 s, waits 4 s, then appears right in front of
  their face with the red eye and a scream (no flashing). That counts as caught.
- After the hunt the eye closes for the break, then a new mission.
- Creative and spectator players are left out of everything: no item to bring, never hunted.
- If the sphere's chunk unloads during a hunt, a new sphere appears near the target and the old one is removed when
  its chunk loads again.

Every number lives in [src/config.ts](src/config.ts).

## Commands

Custom commands need operator rights (`GameDirectors`) but not cheats. `/given_jar:status` works for everyone.

| Command | Fallback (needs cheats) | What it does |
|---|---|---|
| `/given_jar:summon` | `/scriptevent given_jar:summon` | Bring The Given 3 blocks in front of you |
| `/given_jar:attack` | `/scriptevent given_jar:attack` | Summon The Given if it is not here, then start the hunt now on everyone in survival or adventure (to try the hunt) |
| `/given_jar:skip` | `/scriptevent given_jar:skip` | Take 10 minutes off; below zero the hunt starts now |
| `/given_jar:tier easy\|medium\|hard` | `/scriptevent given_jar:tier hard` | Item difficulty from the next mission on |
| `/given_jar:testmode on\|off` | `/scriptevent given_jar:testmode on` | Minutes become seconds |
| `/given_jar:status` | `/scriptevent given_jar:status` | Phase, item, time left, who still has to deliver |
| | `/scriptevent given_jar:selftest` | In-world self-test for a throwaway server world |

Bedrock also registers short aliases (`/skip`, `/tier`, ...) when the name is free; `/summon` is taken by the vanilla
command, so always type `/given_jar:summon`.

## Build

Needs Node 24 and Python 3 with Pillow (only for `make_textures.py`).

```
npm install
npm run typecheck     # tsc --noEmit
npm run lint          # eslint with typescript-eslint and eslint-plugin-minecraft-linting
npm test              # node --test, Node 24 strips the types; no build step
npm run build         # esbuild: src/main.ts -> behavior_pack/scripts/main.js (@minecraft/* external)
npm run pack          # build + scripts/pack.py -> dist/given-jar-<version>.mcaddon
npm run geo           # regenerate the sphere model
python scripts/make_textures.py   # regenerate textures and pack icons from art/
python scripts/verify_textures.py # refresh test/fixtures from Mojang/bedrock-samples (network)
```

## Layout

```
src/config.ts          every duration, speed and distance
src/items.ts           curated items per tier, with checked vanilla texture paths
src/core/              pure rules, no @minecraft imports: machine.ts (state machine), zone.ts (where a drop counts),
                       attribution.ts (who dropped it), serialize.ts (save/load), hud.ts (title markers), vec.ts
src/main.ts            Script API adapter: one system.runInterval loop, commands, events, the self-test
test/                  node:test unit tests of the rules, items and geometry helpers
behavior_pack/         manifest, entities/watcher.json, texts; scripts/main.js is built
resource_pack/         client entity, model, render controller, animations, textures, ui/hud_screen.json, texts
scripts/               build helpers (geometry, textures, pack, texture fixture)
```

State is saved in a world dynamic property (`given_jar:state`) every 5 seconds and on every change; the eye and mode
are entity properties (`given_jar:eye`, `given_jar:mode`) the render controller reads.

## Automated checks

- `npm test`: 40 unit tests of every rule in the table above.
- Bedrock Dedicated Server self-test, with no players:
  `python <minewright>/skills/minewright-server/scripts/bds_run.py examples/given-jar --cmd "scriptevent given_jar:selftest" --wait 90`
  checks that scripts load, config values, command registration, a custom command runs, a ticking area loads, the
  sphere spawns, entity properties set and read back, a second sphere is removed, a credited item is consumed (an
  uncredited one is not, a stack gives the rest back), teleport passes through stone, and state survives save/load.
- What only a person can check (rendering, HUD, the hunt, the totem) is in PLAYTEST.md.

## HUD

The script sends a title `gj_item:<texture path>` with the subtitle `Bring me: <item>` and keeps the action bar
updated every second. `resource_pack/ui/hud_screen.json` hides that raw title, shows the item picture in the middle,
drops it toward the action bar and keeps a small copy there until the player has delivered. If a game update breaks
JSON UI, players see the raw `gj_item:` text once but the subtitle, chat and action bar still say everything, so the
game still works.

## Known limits

- Bedrock merges item entities lying close together. If two players drop the mission item on the same spot within a
  moment, the merged stack keeps one dropper and the other player has to drop again.
- Items moved by hoppers or dispensers have no dropper and never count.
- The texture glow and HUD offsets are tuned blind; PLAYTEST.md has the checks.
