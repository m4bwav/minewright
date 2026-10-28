# Script API patterns that hold up (Bedrock, stable modules)

Each pattern names the stable API it relies on and the `@minecraft/server` version that stabilised it (from Microsoft Learn's changelog, checked 2026-10-27; see [RESEARCH.md](../RESEARCH.md)). Check the class page before using a member you are not sure of.

## 1. Pure core, thin adapter

Keep the rules in plain TypeScript (`src/core/*.ts`) with no `@minecraft/*` import: a state machine that takes the time and a list of events and returns the new state plus a list of effects ("show title", "teleport entity", "damage player"). The adapter (`src/main.ts`) is the only file that imports `@minecraft/server`; it gathers events, calls the core, and applies the effects. The core can then be unit tested with `node --test` (Node 24 runs `.ts` files directly by stripping types; use `.ts` extensions in relative imports). Put the tests in `test/*.test.ts`.

## 2. One loop

```ts
import { system, world } from "@minecraft/server";
system.runInterval(() => {
  const now = system.currentTick;
  const effects = core.step(state, now, drainEvents());
  apply(effects);
  if (changed) save(state);
}, 10); // every half second; pick the slowest rate the game tolerates
```

`system.runInterval` and `system.runTimeout` are stable since 1.1.0. One loop with explicit state beats a web of timeouts that a reload cannot resume. Event handlers (`world.afterEvents.*`) only push to the event queue.

## 3. State that survives a reload

- World dynamic properties (stable since 1.7.0, extended in 1.9.0): `world.setDynamicProperty("ns:state", JSON.stringify(state))`. Read them in `world.afterEvents.worldLoad`, not at the top level of the script: top-level code runs in early execution, before the world exists. Keep a `version` field and migrate old shapes.
- Store times as ticks relative to a saved anchor, or as remaining durations; `system.currentTick` restarts with the world.
- Per-player data: a map keyed by `player.id` inside the world state, or player dynamic properties.

## 4. What the client renders: entity properties

Declare in the behavior pack entity:

```json
"description": {
  "identifier": "ns:watcher",
  "properties": {
    "ns:eye": { "type": "enum", "values": ["open", "closed", "red"], "default": "closed", "client_sync": true }
  }
}
```

`entity.setProperty("ns:eye", "red")` and `getProperty` are stable since 1.6.0; values clamp to the declared range and apply next tick (on BDS, `getProperty` one tick later returned the new value). The render controller reads `query.property('ns:eye')`.

## 5. Commands

```ts
import { system, CommandPermissionLevel, CustomCommandStatus } from "@minecraft/server";
system.beforeEvents.startup.subscribe(({ customCommandRegistry }) => {
  customCommandRegistry.registerCommand(
    { name: "ns:skip", description: "Skip ahead", permissionLevel: CommandPermissionLevel.GameDirectors, cheatsRequired: false },
    (origin) => { system.run(() => skip()); return { status: CustomCommandStatus.Success }; });
});
```

Stable since 2.1.0. The name needs a namespace; `cheatsRequired` defaults to true, so set it false when players on a normal world should use it; the levels are `Any`, `GameDirectors`, `Admin`, `Host`, `Owner`. Registration happens in `startup` (early execution). The callback itself runs in restricted (read-only) execution: reading players, game modes and health works there, but every world change (spawn, teleport, set a property, send a title) goes through `system.run`.

- Bedrock also registers a short alias (`/skip` for `ns:skip`) when the name is free. Vanilla names are taken: BDS logs `Custom Command alias [summon] already in use. Required to use full name [ns:summon].` Always document the full `/ns:name`.
- Custom commands run from scripts (`dimension.runCommand("ns:status")` returns `successCount` above 0) and from the Bedrock Dedicated Server console (type `ns:status`; the reply is printed as an INFO line). Keep `/scriptevent ns:skip` as a fallback: `system.afterEvents.scriptEventReceive` (stable since 1.4.0) receives it, and `/scriptevent` itself needs Game Directors permission (on Bedrock Dedicated Server 1.26.60.6 the server console could send it even with cheats off; see minewright-server).

## 6. Finding entities, and the unloaded-chunk trap

Entities in unloaded chunks do not tick and are not returned by `dimension.getEntities`. A watcher that must exist:

- Save its `id` and last location in the world state.
- Each loop, look it up (`world.getEntity(id)`); if missing while a player is near its last spot, it is unloaded, not dead. If it must act (a chase), spawn a fresh one near the target and remove duplicates by tag when the old chunk loads again.
- A `tickingarea` keeps a small area loaded when the design needs that, at a cost.

## 7. Who dropped this item?

`EntityItemComponent` (`minecraft:item`) exposes only `itemStack`; there is no owner or dropper field and no "player dropped item" event. To credit the dropper:

1. Each loop, snapshot each eligible player's inventory counts for the items that matter, and keep the last two snapshots: a loop that runs between the drop and the spawn event already shows the lower count, so compare against the larger of the two.
2. On `world.afterEvents.entitySpawn` (stable since 1.6.0) for an item entity, note its type, amount, location and tick.
3. The player whose count of that item fell by that amount this tick or last, and who stands within a few blocks, is the dropper. If two players match, prefer the nearer one and say so in logs.

Tag the item entity with the dropper (`itemEntity.setDynamicProperty("ns:dropper", player.id)` works on item entities), so a later loop does not credit it twice. Consume one item: if the stack holds more, `dimension.spawnItem` a clone with `amount - 1` to give the extras back, then `remove()` the original. Item entities on the same spot merge, so two players dropping at once can lose one credit; say so in the rules or give a small delivery zone.

## 8. Moving an entity on a script path

`entity.teleport(location, { facingLocation })` (stable since 1.3.0) every loop step moves an entity in a straight line even through blocks; the step size comes from the config speed and the loop interval. `applyImpulse` and `clearVelocity` (stable since 1.2.0) are for physics-driven motion. Set `minecraft:physics` with `has_collision: false` and `has_gravity: false` for a flying, phasing entity.

Teleporting in 0.6-block steps carried an entity through a 3 by 5 stone wall on BDS (the example's self-test).

## 9. Damage, totems and death

- `player.applyDamage(amount, { cause })` (stable since 1.2.0) goes through normal damage, so a Totem of Undying can save the player. The simplest way to notice a save: a few ticks later, the player's `minecraft:health` component still has `currentValue > 0` (the example add-on does this). `EntityHealCause.TotemOfUndying` (2.8.0) is the other route. `kill()` most likely bypasses the totem (inferred, not documented). Neither totem path has been seen in a real game yet.
- `world.afterEvents.entityDie`, `playerLeave` (1.3.0), `playerDimensionChange` (1.6.0) and `player.getGameMode()` (1.11.0) cover the "caught some other way" and exemption rules.

## 10. Recall traps in 2.x

- `entity.isValid` is a property, not a method (`if (e.isValid)`).
- `GameMode` values are capitalised strings: `Survival`, `Adventure`, `Creative`, `Spectator`.
- After `entity.remove()`, any read (`entity.dimension`, `location`) throws `InvalidEntityError`. Copy what you need first.
- `world.getDefaultSpawnLocation()` can report y 32767 before the world settles (community report, unverified); clamp before using it.
- Sound ids come from the resource pack's `sound_definitions.json` (for example `random.orb`, `random.levelup`, `beacon.activate`, `mob.warden.heartbeat`, `mob.endermen.scream`, `note.pling`, all present in 1.26.60); check a name there before `playSound`.

## 11. Showing things to players

Titles and the actionbar (`player.onScreenDisplay.setTitle`, `setActionBar`, with `TitleDisplayOptions` in ticks) and HUD element visibility (`setHudVisibility`, stable since 1.11.0) are the stable display tools. Anything fancier is JSON UI in the resource pack: minewright-hud.

## 12. Self-test markers

Register `ns:selftest` on `scriptEventReceive` and print one line per check with `console.warn`:

```ts
console.warn(`[MWTEST] PASS config`);
console.warn(`[MWTEST] FAIL spawn no watcher after 40 ticks`);
console.warn(`[MWTEST] DONE`);
```

On Bedrock Dedicated Server these appear on the console as `[... WARN] [Scripting] [MWTEST] PASS config`, which minewright-server's `bds_run.py` reads.

- Write the self-test as an `async` function and wait with `await system.waitTicks(n)` (stable `System` method) between steps; print DONE at the end.
- No players on a test server means no loaded chunks. Load one: `dimension.runCommand("tickingarea add circle 0 100 0 2 ns_test true")`, then poll `dimension.getBlock({x: 0, y: 100, z: 0})` each few ticks until it is defined (well within 400 ticks on BDS). After that `spawnEntity` and `spawnItem` work there.
- Call the add-on's own commands with `dimension.runCommand("ns:status")` to prove they registered.
