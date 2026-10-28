// Script API adapter for given.jar. All rules live in src/core (pure, unit tested); this file only reads the world
// into plain data, runs one loop, and carries out the Effects the core returns.

import {
  CommandPermissionLevel,
  CustomCommandParamType,
  CustomCommandStatus,
  EntityDamageCause,
  GameMode,
  ItemStack,
  system,
  world,
  type CustomCommandOrigin,
  type CustomCommandResult,
  type Dimension,
  type Entity,
  type Player,
  type Vector3,
} from '@minecraft/server';
import { CONFIG, durations } from './config.ts';
import { ITEMS, TIERS, isTier } from './items.ts';
import { chooseDropper, InventorySnapshots } from './core/attribution.ts';
import { clearTitle, missionTitle } from './core/hud.ts';
import {
  createState,
  deliver,
  eyeFor,
  hudLine,
  modeFor,
  playerGone,
  reportStrike,
  setTestMode,
  setTier,
  skip,
  statusText,
  summon,
  tick,
  type Effect,
  type GameState,
  type PlayerView,
  type SphereView,
} from './core/machine.ts';
import { deserialize, serialize } from './core/serialize.ts';
import { inDeliveryZone } from './core/zone.ts';
import { add, distance, flatDirection, scale, up } from './core/vec.ts';

const NS = 'given_jar';
const WATCHER = `${NS}:watcher`;
const STATE_KEY = `${NS}:state`;
const SPHERE_KEY = `${NS}:sphere_id`;
const DROPPER_KEY = `${NS}:dropper`;
const EYE_PROP = `${NS}:eye`;
const MODE_PROP = `${NS}:mode`;
const PREFIX = '§5[given.jar]§r ';
const DT = CONFIG.loopTicks / 20;

let state: GameState = createState();
let sphereId: string | undefined;
let loaded = false;
let paused = false;
let saveTimer = 0;
let hudTimer = 0;
let sweepTimer = 0;
let strikeTarget: string | undefined;
const snapshots = new InventorySnapshots();
const registeredCommands = new Set<string>();

// ---------- persistence ----------

function save(): void {
  world.setDynamicProperty(STATE_KEY, serialize(state));
  world.setDynamicProperty(SPHERE_KEY, sphereId ?? '');
  saveTimer = 0;
}

function load(): void {
  const raw = world.getDynamicProperty(STATE_KEY);
  state = deserialize(typeof raw === 'string' ? raw : undefined);
  const id = world.getDynamicProperty(SPHERE_KEY);
  sphereId = typeof id === 'string' && id !== '' ? id : undefined;
  loaded = true;
}

// ---------- reading the world ----------

function isEligible(p: Player): boolean {
  const mode = p.getGameMode();
  return mode === GameMode.Survival || mode === GameMode.Adventure;
}

function isAlive(p: Player): boolean {
  const health = p.getComponent('minecraft:health');
  return health ? health.currentValue > 0 : true;
}

function playerView(p: Player): PlayerView {
  return {
    id: p.id,
    name: p.name,
    eligible: isEligible(p),
    alive: isAlive(p),
    dimension: p.dimension.id,
    location: { ...p.location },
  };
}

function getSphere(): Entity | undefined {
  if (!sphereId) return undefined;
  const e = world.getEntity(sphereId);
  return e && e.isValid ? e : undefined;
}

function sphereView(e: Entity | undefined): SphereView {
  if (!e) return { present: false, dimension: '', location: { x: 0, y: 0, z: 0 } };
  return { present: true, dimension: e.dimension.id, location: { ...e.location } };
}

function findPlayer(id: string): Player | undefined {
  return world.getAllPlayers().find((p) => p.id === id);
}

function countItem(p: Player, typeId: string): number {
  const container = p.getComponent('minecraft:inventory')?.container;
  if (!container) return 0;
  let n = 0;
  for (let i = 0; i < container.size; i++) {
    const stack = container.getItem(i);
    if (stack?.typeId === typeId) n += stack.amount;
  }
  return n;
}

// ---------- carrying out effects ----------

function say(text: string, to?: string): void {
  if (to) findPlayer(to)?.sendMessage(PREFIX + text);
  else world.sendMessage(PREFIX + text);
}

function showTitle(p: Player, title: string, subtitle: string, stay: number): void {
  p.onScreenDisplay.setTitle(title, {
    subtitle,
    fadeInDuration: CONFIG.titleTicks.fadeIn,
    stayDuration: stay,
    fadeOutDuration: CONFIG.titleTicks.fadeOut,
  });
}

function targets(to?: string): Player[] {
  const all = world.getAllPlayers();
  return to ? all.filter((p) => p.id === to) : all;
}

function trySpawnWatcher(dim: Dimension, at: Vector3): Entity | undefined {
  try {
    return dim.spawnEntity(WATCHER, at);
  } catch {
    return undefined;
  }
}

/** Chunk-unload trap and dimension change: bring the watcher back near the target, behind them. */
function respawnNear(playerId: string): void {
  const p = findPlayer(playerId);
  if (!p) return;
  const old = getSphere();
  const back = scale(flatDirection(p.getViewDirection()), -1);
  let spawned: Entity | undefined;
  for (const dist of [CONFIG.respawnDistance, 8, 3]) {
    spawned = trySpawnWatcher(p.dimension, up(add(p.location, scale(back, dist)), 1));
    if (spawned) break;
  }
  if (!spawned) return;
  sphereId = spawned.id;
  old?.remove();
  syncSphereProperties(spawned);
  save();
}

function moveSphere(e: Entity, location: Vector3, facing: Vector3): void {
  try {
    // teleport never checks for blocks, so the watcher phases straight through walls.
    e.teleport(location, { facingLocation: facing, keepVelocity: false });
  } catch {
    // Target location in an unloaded chunk: the next tick's respawn logic handles it.
  }
}

function strike(playerId: string): void {
  const p = findPlayer(playerId);
  const e = getSphere();
  if (!p) return;
  strikeTarget = playerId;
  // applyDamage, not kill(): a Totem of Undying in hand can still save the player.
  p.applyDamage(CONFIG.strikeDamage, { cause: EntityDamageCause.entityAttack, damagingEntity: e });
  system.runTimeout(() => {
    if (strikeTarget !== playerId) return;
    strikeTarget = undefined;
    const now = findPlayer(playerId);
    const survived = now !== undefined && isAlive(now);
    apply(reportStrike(state, survived ? 'survived' : 'died'));
  }, 10);
}

function scare(playerId: string): void {
  const p = findPlayer(playerId);
  const e = getSphere();
  if (!p || !e) return;
  const head = p.getHeadLocation();
  const front = add(head, scale(p.getViewDirection(), CONFIG.scareDistance));
  moveSphere(e, up(front, -CONFIG.eyeHeight), head);
}

function apply(effects: readonly Effect[]): void {
  let mustSave = false;
  for (const fx of effects) {
    switch (fx.kind) {
      case 'say':
        say(fx.text, fx.to);
        break;
      case 'eye':
      case 'mode': {
        const e = getSphere();
        if (e) syncSphereProperties(e);
        break;
      }
      case 'missionTitle': {
        const t = missionTitle(fx.itemId);
        for (const p of targets(fx.to)) showTitle(p, t.title, t.subtitle, CONFIG.titleTicks.stay);
        break;
      }
      case 'clearTitle': {
        const t = clearTitle();
        for (const p of targets(fx.to)) showTitle(p, t.title, t.subtitle, 1);
        break;
      }
      case 'move': {
        const e = getSphere();
        if (e) moveSphere(e, fx.location, fx.facing);
        break;
      }
      case 'respawnNear':
        respawnNear(fx.playerId);
        break;
      case 'strike':
        strike(fx.playerId);
        break;
      case 'scare':
        scare(fx.playerId);
        break;
      case 'sound':
        for (const p of targets(fx.to)) p.playSound(fx.sound);
        break;
      case 'save':
        mustSave = true;
        break;
    }
  }
  if (mustSave) save();
}

function syncSphereProperties(e: Entity): void {
  const eye = eyeFor(state);
  const mode = modeFor(state);
  if (e.getProperty(EYE_PROP) !== eye) e.setProperty(EYE_PROP, eye);
  if (e.getProperty(MODE_PROP) !== mode) e.setProperty(MODE_PROP, mode);
}

// ---------- deliveries ----------

export interface DeliveryLookup {
  (id: string): { id: string; name: string; eligible: boolean } | undefined;
}

function lookupOnline(id: string): { id: string; name: string; eligible: boolean } | undefined {
  const p = findPlayer(id);
  return p ? { id: p.id, name: p.name, eligible: isEligible(p) } : undefined;
}

/** Find mission items near the watcher that a player dropped, credit them and consume one item each. */
function scanDeliveries(game: GameState, sphere: Entity, lookup: DeliveryLookup): Effect[] {
  if (game.phase !== 'mission' || !game.itemId) return [];
  const eye = up(sphere.location, CONFIG.eyeHeight);
  const look = sphere.getViewDirection();
  const effects: Effect[] = [];
  const items = sphere.dimension.getEntities({
    type: 'minecraft:item',
    location: eye,
    maxDistance: CONFIG.deliveryRadius + CONFIG.pathBoxLength + 1,
  });
  for (const itemEntity of items) {
    const stack = itemEntity.getComponent('minecraft:item')?.itemStack;
    const dropper = itemEntity.getDynamicProperty(DROPPER_KEY);
    if (!stack || stack.typeId !== game.itemId || typeof dropper !== 'string') continue;
    if (!inDeliveryZone(eye, look, itemEntity.location)) continue;
    const who = lookup(dropper);
    if (!who) continue;
    const result = deliver(game, who, stack.typeId);
    if (!result.accepted) continue;
    effects.push(...result.effects);
    const where = { ...itemEntity.location };
    const dim = itemEntity.dimension;
    itemEntity.remove();
    if (stack.amount > 1) {
      const rest = stack.clone();
      rest.amount = stack.amount - 1;
      const back = dim.spawnItem(rest, where);
      back.setDynamicProperty(DROPPER_KEY, dropper);
    }
  }
  return effects;
}

function onItemSpawn(itemEntity: Entity): void {
  if (state.phase !== 'mission' || !state.itemId) return;
  const stack = itemEntity.getComponent('minecraft:item')?.itemStack;
  if (!stack || stack.typeId !== state.itemId) return;
  const at = itemEntity.location;
  const candidates = world
    .getAllPlayers()
    .filter((p) => p.dimension.id === itemEntity.dimension.id)
    .map((p) => ({
      id: p.id,
      before: snapshots.before(p.id),
      now: countItem(p, stack.typeId),
      distance: distance(p.location, at),
    }));
  const dropper = chooseDropper(candidates, CONFIG.dropAttributionRadius);
  if (!dropper) return;
  itemEntity.setDynamicProperty(DROPPER_KEY, dropper);
  snapshots.settle(dropper, candidates.find((c) => c.id === dropper)?.now ?? 0);
}

function recordSnapshots(): void {
  const counts = new Map<string, number>();
  if (state.phase === 'mission' && state.itemId) {
    for (const p of world.getAllPlayers()) counts.set(p.id, countItem(p, state.itemId));
  }
  snapshots.record(counts);
}

// ---------- one watcher per world ----------

function adoptSphere(e: Entity): void {
  sphereId = e.id;
  syncSphereProperties(e);
  apply(summon(state));
  save();
}

function onWatcherAppears(e: Entity, spawned: boolean): void {
  if (e.id === sphereId) {
    syncSphereProperties(e);
    return;
  }
  const current = getSphere();
  if (current) {
    const where = { ...e.location };
    const dim = e.dimension;
    e.remove();
    if (spawned) {
      for (const p of dim.getPlayers({ location: where, maxDistance: 16 })) {
        p.sendMessage(PREFIX + 'There can only be one watcher. The new one faded away.');
      }
    }
    return;
  }
  // No loaded watcher: an old one coming back from an unloaded chunk while another exists elsewhere is removed;
  // otherwise this one becomes the watcher.
  if (!spawned && sphereId) {
    e.remove();
    return;
  }
  adoptSphere(e);
}

function sweepDuplicates(): void {
  for (const id of ['overworld', 'nether', 'the_end']) {
    const dim = world.getDimension(id);
    for (const e of dim.getEntities({ type: WATCHER })) {
      if (e.id !== sphereId && getSphere()) e.remove();
    }
  }
}

function summonAt(dim: Dimension, at: Vector3): { ok: boolean; message: string } {
  if (getSphere()) return { ok: false, message: 'There is already a watcher in this world.' };
  const e = trySpawnWatcher(dim, at);
  if (!e) return { ok: false, message: 'Could not summon the watcher here.' };
  adoptSphere(e);
  return { ok: true, message: 'The watcher has arrived.' };
}

// ---------- the loop ----------

function loop(): void {
  if (!loaded || paused) return;
  const players = world.getAllPlayers();
  const views = players.map(playerView);
  const sphereEntity = getSphere();
  const effects: Effect[] = [];
  if (sphereEntity) {
    syncSphereProperties(sphereEntity);
    effects.push(...scanDeliveries(state, sphereEntity, lookupOnline));
  }
  effects.push(...tick(state, DT, { players: views, sphere: sphereView(sphereEntity), random: Math.random }));
  apply(effects);
  recordSnapshots();

  hudTimer += DT;
  if (hudTimer >= 1) {
    hudTimer = 0;
    for (const p of players) {
      const line = hudLine(state, p.id, isEligible(p));
      if (line) p.onScreenDisplay.setActionBar(line);
    }
  }
  sweepTimer += DT;
  if (sweepTimer >= 2) {
    sweepTimer = 0;
    sweepDuplicates();
  }
  saveTimer += DT;
  if (saveTimer >= CONFIG.saveEverySeconds) save();
}

// ---------- commands ----------

type Action = 'skip' | 'summon' | 'tier' | 'testmode' | 'status';

function runAction(action: Action, arg: string, source: Entity | undefined): string {
  switch (action) {
    case 'skip':
      apply(skip(state));
      return 'Skip done.';
    case 'summon': {
      const dim = source?.dimension ?? world.getDimension('overworld');
      const spawn = world.getDefaultSpawnLocation();
      // The default spawn's y is a huge placeholder until the world settles it; use a sane height instead.
      const base = source?.location ?? { x: spawn.x, y: spawn.y > 300 ? 100 : spawn.y, z: spawn.z };
      const look = source ? flatDirection(source.getViewDirection()) : { x: 0, y: 0, z: 1 };
      return summonAt(dim, up(add(base, scale(look, 3)), 1)).message;
    }
    case 'tier':
      if (!isTier(arg)) return `Unknown tier "${arg}". Use ${TIERS.join(', ')}.`;
      apply(setTier(state, arg));
      return `Tier set to ${arg}.`;
    case 'testmode':
      if (arg !== 'on' && arg !== 'off') return 'Use on or off.';
      apply(setTestMode(state, arg === 'on'));
      return `Test mode ${arg}.`;
    case 'status':
      return statusText(state, world.getAllPlayers().map(playerView));
  }
}

function commandCallback(action: Action) {
  return (origin: CustomCommandOrigin, arg?: string): CustomCommandResult => {
    if (action === 'status') {
      return { status: CustomCommandStatus.Success, message: statusText(state, world.getAllPlayers().map(playerView)) };
    }
    // Custom command callbacks run in restricted (read-only) execution: change the world on the next tick.
    const source = origin.sourceEntity;
    system.run(() => {
      const reply = runAction(action, String(arg ?? ''), source);
      if (source && source.typeId === 'minecraft:player') (source as Player).sendMessage(PREFIX + reply);
      else console.warn(`[given.jar] ${reply}`);
    });
    return { status: CustomCommandStatus.Success };
  };
}

system.beforeEvents.startup.subscribe((event) => {
  const reg = event.customCommandRegistry;
  reg.registerEnum(`${NS}:tier`, [...TIERS]);
  reg.registerEnum(`${NS}:onoff`, ['on', 'off']);
  const ops = CommandPermissionLevel.GameDirectors;
  const commands = [
    { name: `${NS}:skip`, description: 'given.jar: take 10 minutes off the clock', permissionLevel: ops },
    { name: `${NS}:summon`, description: 'given.jar: summon the watcher (only one per world)', permissionLevel: ops },
    {
      name: `${NS}:tier`,
      description: 'given.jar: set how hard the items are',
      permissionLevel: ops,
      mandatoryParameters: [{ name: `${NS}:tier`, type: CustomCommandParamType.Enum }],
    },
    {
      name: `${NS}:testmode`,
      description: 'given.jar: test mode turns minutes into seconds',
      permissionLevel: ops,
      mandatoryParameters: [{ name: `${NS}:onoff`, type: CustomCommandParamType.Enum }],
    },
    {
      name: `${NS}:status`,
      description: 'given.jar: show the game state',
      permissionLevel: CommandPermissionLevel.Any,
    },
  ];
  for (const c of commands) {
    const action = c.name.slice(NS.length + 1) as Action;
    reg.registerCommand({ ...c, cheatsRequired: false }, commandCallback(action));
    registeredCommands.add(c.name);
  }
});

// ---------- events ----------

world.afterEvents.worldLoad.subscribe(() => {
  load();
  system.runInterval(loop, CONFIG.loopTicks);
});

world.afterEvents.entitySpawn.subscribe(({ entity }) => {
  if (!loaded || !entity.isValid) return;
  if (entity.typeId === 'minecraft:item') onItemSpawn(entity);
  else if (entity.typeId === WATCHER) onWatcherAppears(entity, true);
});

world.afterEvents.entityLoad.subscribe(({ entity }) => {
  if (loaded && entity.isValid && entity.typeId === WATCHER) onWatcherAppears(entity, false);
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
  if (loaded) apply(playerGone(state, playerId));
});

world.afterEvents.playerDimensionChange.subscribe(({ player }) => {
  if (loaded) apply(playerGone(state, player.id));
});

world.afterEvents.entityDie.subscribe(({ deadEntity }) => {
  if (!loaded || deadEntity.typeId !== 'minecraft:player') return;
  if (strikeTarget === deadEntity.id) return; // the strike timeout reports this one
  apply(playerGone(state, deadEntity.id));
});

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (!loaded || !initialSpawn) return;
  if (state.phase === 'mission' && state.itemId && !state.delivered.includes(player.id)) {
    apply([{ kind: 'missionTitle', itemId: state.itemId, to: player.id }]);
  }
});

system.afterEvents.scriptEventReceive.subscribe((event) => {
  if (!event.id.startsWith(`${NS}:`)) return;
  const name = event.id.slice(NS.length + 1);
  const source = event.sourceEntity;
  if (name === 'selftest') {
    void selftest();
    return;
  }
  if (!['skip', 'summon', 'tier', 'testmode', 'status'].includes(name)) return;
  const reply = runAction(name as Action, event.message.trim(), source);
  if (source && source.typeId === 'minecraft:player') (source as Player).sendMessage(PREFIX + reply);
  else console.warn(`[given.jar] ${reply}`);
});

// ---------- BDS self-test: /scriptevent given_jar:selftest ----------

function mark(ok: boolean, name: string, why = ''): boolean {
  console.warn(ok ? `[MWTEST] PASS ${name}` : `[MWTEST] FAIL ${name} ${why || 'failed'}`);
  return ok;
}

async function check(name: string, body: () => Promise<string | true> | string | true): Promise<boolean> {
  try {
    const result = await body();
    return mark(result === true, name, result === true ? '' : result);
  } catch (e) {
    return mark(false, name, e instanceof Error ? `${e.name}: ${e.message}` : String(e));
  }
}

async function waitFor(test: () => boolean, ticks: number): Promise<boolean> {
  for (let i = 0; i < ticks; i++) {
    if (test()) return true;
    await system.waitTicks(1);
  }
  return test();
}

async function selftest(): Promise<void> {
  const overworld = world.getDimension('overworld');
  const center = { x: 0.5, y: 100, z: 0.5 };
  paused = true;
  try {
    mark(loaded, 'scripts_loaded', 'worldLoad never fired');
    await check('config_loads', () => {
      const normal = durations(false);
      const test = durations(true);
      if (normal.mission !== 1800 || normal.skip !== 600 || normal.eyeClosed !== 600) return `normal ${JSON.stringify(normal)}`;
      if (test.mission !== 30 || test.skip !== 10 || test.eyeClosed !== 10) return `test ${JSON.stringify(test)}`;
      return TIERS.every((t) => ITEMS[t].length > 0) || 'empty tier';
    });
    await check('commands_registered', () => {
      const want = ['skip', 'summon', 'tier', 'testmode', 'status'].map((n) => `${NS}:${n}`);
      const missing = want.filter((n) => !registeredCommands.has(n));
      return missing.length === 0 || `missing ${missing.join(',')}`;
    });
    await check('custom_command_runs', () => {
      const r = overworld.runCommand(`${NS}:status`);
      return r.successCount > 0 || `successCount ${r.successCount}`;
    });
    if (getSphere()) {
      mark(false, 'fresh_world', 'a watcher already exists; run the self-test on a throwaway world');
      return;
    }
    await check('tickingarea_loaded', async () => {
      overworld.runCommand('tickingarea add circle 0 100 0 2 given_jar_selftest true');
      const ok = await waitFor(() => {
        try {
          return overworld.getBlock(center) !== undefined;
        } catch {
          return false;
        }
      }, 400);
      return ok || 'chunk at 0 100 0 never loaded';
    });
    await check('sphere_spawns', async () => {
      const r = summonAt(overworld, center);
      if (!r.ok) return r.message;
      await system.waitTicks(2);
      const e = getSphere();
      if (!e) return 'no watcher after summon';
      if (e.typeId !== WATCHER) return `wrong type ${e.typeId}`;
      return state.hasSphere || 'state.hasSphere false';
    });
    await check('entity_properties', async () => {
      const e = getSphere();
      if (!e) return 'no watcher';
      if (e.getProperty(EYE_PROP) !== 'closed') return `eye starts ${String(e.getProperty(EYE_PROP))}`;
      e.setProperty(EYE_PROP, 'red');
      e.setProperty(MODE_PROP, 'hunting');
      await system.waitTicks(1);
      const eye = e.getProperty(EYE_PROP);
      const mode = e.getProperty(MODE_PROP);
      syncSphereProperties(e);
      return (eye === 'red' && mode === 'hunting') || `read back eye=${String(eye)} mode=${String(mode)}`;
    });
    await check('one_sphere_per_world', async () => {
      const second = overworld.spawnEntity(WATCHER, add(center, { x: 3, y: 0, z: 0 }));
      await system.waitTicks(3);
      if (second.isValid) return 'second watcher still exists';
      return getSphere() !== undefined || 'first watcher was removed instead';
    });
    await check('item_delivery', async () => {
      const e = getSphere();
      if (!e) return 'no watcher';
      const game = createState();
      game.hasSphere = true;
      game.phase = 'mission';
      game.itemId = 'minecraft:diamond';
      game.remaining = 30;
      const eye = up(e.location, CONFIG.eyeHeight);
      const credited = overworld.spawnItem(new ItemStack('minecraft:diamond', 3), eye);
      credited.setDynamicProperty(DROPPER_KEY, 'mwtest-player');
      const stray = overworld.spawnItem(new ItemStack('minecraft:diamond', 1), add(eye, { x: 0.5, y: 0, z: 0 }));
      await system.waitTicks(2);
      const lookup = (id: string) => ({ id, name: 'Tester', eligible: true });
      scanDeliveries(game, e, lookup);
      if (!game.delivered.includes('mwtest-player')) return 'delivery not credited';
      if (credited.isValid) return 'credited item entity not consumed';
      if (!stray.isValid) return 'item without a dropper was consumed';
      const left = overworld
        .getEntities({ type: 'minecraft:item', location: eye, maxDistance: 4 })
        .filter((x) => x.getDynamicProperty(DROPPER_KEY) === 'mwtest-player');
      const amount = left[0]?.getComponent('minecraft:item')?.itemStack.amount;
      stray.remove();
      for (const x of left) x.remove();
      return amount === 2 || `leftover stack amount ${String(amount)}`;
    });
    await check('teleport_phases_through_blocks', async () => {
      const e = getSphere();
      if (!e) return 'no watcher';
      overworld.runCommand('fill 2 99 -1 2 103 1 stone');
      const goal = { x: 4.5, y: 100, z: 0.5 };
      for (let i = 0; i < 20 && distance(e.location, goal) > 0.2; i++) {
        const from = e.location;
        const d = distance(from, goal);
        const next = d <= 0.6 ? goal : add(from, scale({ x: goal.x - from.x, y: 0, z: goal.z - from.z }, 0.6 / d));
        moveSphere(e, next, add(goal, { x: 1, y: 0, z: 0 }));
        await system.waitTicks(1);
      }
      overworld.runCommand('fill 2 99 -1 2 103 1 air');
      return distance(e.location, goal) <= 0.2 || `stopped at ${JSON.stringify(e.location)}`;
    });
    await check('state_persists', () => {
      save();
      const raw = world.getDynamicProperty(STATE_KEY);
      const back = deserialize(typeof raw === 'string' ? raw : undefined);
      return serialize(back) === serialize(state) || 'saved state differs';
    });
  } finally {
    getSphere()?.remove();
    sphereId = undefined;
    state = createState();
    save();
    try {
      overworld.runCommand('tickingarea remove given_jar_selftest');
    } catch {
      // already gone
    }
    paused = false;
    console.warn('[MWTEST] DONE');
  }
}
