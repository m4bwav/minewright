// Pure game rules for given.jar. No @minecraft imports: everything the world knows comes in as plain data
// (players, the watcher's position) and everything the world must do goes out as a list of Effects that the
// Script API adapter (src/main.ts) carries out. That keeps every rule unit-testable under plain Node.

import { CONFIG, durations } from '../config.ts';
import { findItem, pickItem, type Tier } from '../items.ts';
import { distance, flatDirection, scale, stepToward, sub, add, up, type Vec3 } from './vec.ts';

export type Phase = 'idle' | 'mission' | 'hunting' | 'jumpscare';
export type Eye = 'open' | 'closed' | 'red';
export type Mode = 'idle' | 'hunting';
export type ScareStep = 'retreat' | 'wait' | 'scare';

export const SOUNDS = {
  missionStart: 'beacon.activate',
  delivered: 'random.orb',
  allDelivered: 'random.levelup',
  eyeCloses: 'beacon.deactivate',
  huntStart: 'mob.elderguardian.curse',
  heartbeat: 'mob.warden.heartbeat',
  jumpscare: 'mob.endermen.scream',
  skip: 'note.pling',
} as const;

export interface PlayerView {
  id: string;
  name: string;
  /** Survival or adventure. Creative and spectator players are exempt from everything. */
  eligible: boolean;
  alive: boolean;
  dimension: string;
  /** Feet position. */
  location: Vec3;
}

export interface SphereView {
  /** False when the watcher entity is missing or in an unloaded chunk. */
  present: boolean;
  dimension: string;
  /** Feet position. */
  location: Vec3;
}

export interface GameState {
  v: 1;
  hasSphere: boolean;
  phase: Phase;
  tier: Tier;
  testMode: boolean;
  /** Seconds left on the current phase clock (idle break, mission, jumpscare step, strike wait). */
  remaining: number;
  itemId: string | null;
  lastItemId: string | null;
  delivered: string[];
  names: Record<string, string>;
  failed: string[];
  caught: string[];
  target: string | null;
  targetDimension: string | null;
  strikePending: boolean;
  scareStep: ScareStep | null;
  heartbeat: number;
}

export type Effect =
  | { kind: 'say'; text: string; to?: string }
  | { kind: 'eye'; eye: Eye }
  | { kind: 'mode'; mode: Mode }
  | { kind: 'missionTitle'; itemId: string; to?: string }
  | { kind: 'clearTitle'; to?: string }
  | { kind: 'move'; location: Vec3; facing: Vec3 }
  | { kind: 'respawnNear'; playerId: string }
  | { kind: 'strike'; playerId: string }
  | { kind: 'scare'; playerId: string }
  | { kind: 'sound'; sound: string; to?: string }
  | { kind: 'save' };

export interface TickContext {
  players: readonly PlayerView[];
  sphere: SphereView;
  random: () => number;
}

export function createState(): GameState {
  return {
    v: 1,
    hasSphere: false,
    phase: 'idle',
    tier: 'easy',
    testMode: false,
    remaining: 0,
    itemId: null,
    lastItemId: null,
    delivered: [],
    names: {},
    failed: [],
    caught: [],
    target: null,
    targetDimension: null,
    strikePending: false,
    scareStep: null,
    heartbeat: 0,
  };
}

export function itemName(id: string | null): string {
  if (!id) return 'nothing';
  return findItem(id)?.name ?? id.replace(/^minecraft:/, '').replace(/_/g, ' ');
}

function nameOf(state: GameState, id: string): string {
  return state.names[id] ?? 'Someone';
}

export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

/** "10 minutes" or "10 seconds" depending on test mode. */
function unitsText(state: GameState, seconds: number): string {
  if (state.testMode || seconds < 60) {
    const s = Math.round(seconds);
    return `${s} second${s === 1 ? '' : 's'}`;
  }
  const m = Math.round(seconds / 60);
  return `${m} minute${m === 1 ? '' : 's'}`;
}

function eligiblePlayers(players: readonly PlayerView[]): PlayerView[] {
  return players.filter((p) => p.eligible);
}

function rememberNames(state: GameState, players: readonly PlayerView[]): void {
  for (const p of players) state.names[p.id] = p.name;
}

/** Called when the (first) watcher appears in the world. */
export function summon(state: GameState): Effect[] {
  if (state.hasSphere) return [{ kind: 'eye', eye: eyeFor(state) }, { kind: 'mode', mode: modeFor(state) }];
  state.hasSphere = true;
  if (state.phase === 'idle' && state.itemId === null) state.remaining = CONFIG.firstMissionDelaySeconds;
  return [
    { kind: 'eye', eye: eyeFor(state) },
    { kind: 'mode', mode: modeFor(state) },
    { kind: 'say', text: 'A strange eye is watching you...' },
    { kind: 'save' },
  ];
}

export function eyeFor(state: GameState): Eye {
  switch (state.phase) {
    case 'idle':
      return 'closed';
    case 'mission':
      return 'open';
    case 'hunting':
      return 'red';
    case 'jumpscare':
      return state.scareStep === 'scare' ? 'red' : 'closed';
  }
}

export function modeFor(state: GameState): Mode {
  return state.phase === 'hunting' ? 'hunting' : 'idle';
}

function startMission(state: GameState, random: () => number): Effect[] {
  const item = pickItem(state.tier, random(), state.lastItemId);
  state.phase = 'mission';
  state.itemId = item.id;
  state.lastItemId = item.id;
  state.delivered = [];
  state.failed = [];
  state.caught = [];
  state.target = null;
  state.remaining = durations(state.testMode).mission;
  return [
    { kind: 'eye', eye: 'open' },
    { kind: 'mode', mode: 'idle' },
    { kind: 'missionTitle', itemId: item.id },
    { kind: 'sound', sound: SOUNDS.missionStart },
    {
      kind: 'say',
      text: `The Given opens its eye. It wants: ${item.name}! Everyone must drop one on it. You have ${unitsText(state, state.remaining)}.`,
    },
    { kind: 'save' },
  ];
}

function closeEye(state: GameState, text: string, sound: string): Effect[] {
  state.phase = 'idle';
  state.itemId = null;
  state.delivered = [];
  state.failed = [];
  state.caught = [];
  state.target = null;
  state.targetDimension = null;
  state.strikePending = false;
  state.scareStep = null;
  state.remaining = durations(state.testMode).eyeClosed;
  return [
    { kind: 'eye', eye: 'closed' },
    { kind: 'mode', mode: 'idle' },
    { kind: 'clearTitle' },
    { kind: 'sound', sound },
    { kind: 'say', text: `${text} The Given closes its eye for ${unitsText(state, state.remaining)}.` },
    { kind: 'save' },
  ];
}

function missionOver(state: GameState, players: readonly PlayerView[]): Effect[] {
  const failed = eligiblePlayers(players)
    .filter((p) => !state.delivered.includes(p.id))
    .map((p) => p.id);
  if (failed.length === 0) return closeEye(state, 'Time is up, but nobody is in trouble.', SOUNDS.eyeCloses);
  state.phase = 'hunting';
  state.failed = failed;
  state.caught = [];
  state.target = null;
  state.targetDimension = null;
  state.strikePending = false;
  state.scareStep = null;
  state.remaining = 0;
  const names = failed.map((id) => nameOf(state, id)).join(', ');
  return [
    { kind: 'eye', eye: 'red' },
    { kind: 'mode', mode: 'hunting' },
    { kind: 'clearTitle' },
    { kind: 'sound', sound: SOUNDS.huntStart },
    { kind: 'say', text: `Time is up! The Given's eye turns red. It is coming for: ${names}.` },
    { kind: 'save' },
  ];
}

/** Advance the game by `dt` seconds. */
export function tick(state: GameState, dt: number, ctx: TickContext): Effect[] {
  if (!state.hasSphere) return [];
  rememberNames(state, ctx.players);
  switch (state.phase) {
    case 'idle':
      state.remaining -= dt;
      return state.remaining <= 0 ? startMission(state, ctx.random) : [];
    case 'mission': {
      state.remaining -= dt;
      const eligible = eligiblePlayers(ctx.players);
      if (eligible.length > 0 && eligible.every((p) => state.delivered.includes(p.id))) {
        return closeEye(state, 'Everyone gave The Given what it wanted!', SOUNDS.allDelivered);
      }
      return state.remaining <= 0 ? missionOver(state, ctx.players) : [];
    }
    case 'hunting':
      return huntTick(state, dt, ctx);
    case 'jumpscare':
      return scareTick(state, dt, ctx);
  }
}

/** A player dropped the mission item on the watcher. Returns whether the item entity should be consumed. */
export function deliver(
  state: GameState,
  player: { id: string; name: string; eligible: boolean },
  itemId: string,
): { accepted: boolean; reason: string; effects: Effect[] } {
  if (!state.hasSphere || state.phase !== 'mission') return { accepted: false, reason: 'no mission', effects: [] };
  if (itemId !== state.itemId) return { accepted: false, reason: 'wrong item', effects: [] };
  if (!player.eligible) return { accepted: false, reason: 'exempt', effects: [] };
  if (state.delivered.includes(player.id)) return { accepted: false, reason: 'already delivered', effects: [] };
  state.names[player.id] = player.name;
  state.delivered.push(player.id);
  return {
    accepted: true,
    reason: 'delivered',
    effects: [
      { kind: 'sound', sound: SOUNDS.delivered },
      { kind: 'clearTitle', to: player.id },
      { kind: 'say', text: `${player.name} gave The Given a ${itemName(itemId)}.` },
      { kind: 'save' },
    ],
  };
}

/** Operator skip: cut the clock. If the mission clock drops to zero the hunt starts on the next tick. */
export function skip(state: GameState): Effect[] {
  const cut = durations(state.testMode).skip;
  if (!state.hasSphere) return [{ kind: 'say', text: 'The Given is not here yet. Use /given_jar:summon first.' }];
  if (state.phase === 'hunting' || state.phase === 'jumpscare') {
    return [{ kind: 'say', text: 'The hunt is already on. Skip does nothing now.' }];
  }
  state.remaining -= cut;
  const effects: Effect[] = [{ kind: 'sound', sound: SOUNDS.skip }];
  if (state.remaining <= 0) {
    state.remaining = 0;
    effects.push({
      kind: 'say',
      text: state.phase === 'mission' ? 'Skip! Time ran out. The hunt starts now!' : 'Skip! The Given opens its eye now.',
    });
  } else {
    effects.push({
      kind: 'say',
      text: `Skip! ${unitsText(state, cut)} less. ${formatTime(state.remaining)} left.`,
    });
  }
  effects.push({ kind: 'save' });
  return effects;
}

/**
 * Operator attack: start the hunt now on every player in survival or adventure, whatever the phase.
 * For trying out the hunt; a normal mission starts again after it, as after any hunt.
 */
export function attack(state: GameState, players: readonly PlayerView[]): Effect[] {
  if (!state.hasSphere) return [{ kind: 'say', text: 'The Given is not here yet. Use /given_jar:summon first.' }];
  if (state.phase === 'hunting' || state.phase === 'jumpscare') {
    return [{ kind: 'say', text: 'The hunt is already on.' }];
  }
  if (eligiblePlayers(players).length === 0) {
    return [{ kind: 'say', text: 'Nobody is in survival or adventure, so The Given has nobody to hunt.' }];
  }
  state.delivered = [];
  return missionOver(state, players);
}

export function setTier(state: GameState, tier: Tier): Effect[] {
  state.tier = tier;
  return [
    { kind: 'say', text: `Difficulty is now ${tier}. It starts with the next item.` },
    { kind: 'save' },
  ];
}

export function setTestMode(state: GameState, on: boolean): Effect[] {
  if (state.testMode === on) return [{ kind: 'say', text: `Test mode is already ${on ? 'on' : 'off'}.` }];
  state.testMode = on;
  // Keep the same share of the clock: minutes become seconds and back.
  if (state.phase === 'idle' || state.phase === 'mission') {
    state.remaining = on ? state.remaining / 60 : state.remaining * 60;
  }
  return [
    {
      kind: 'say',
      text: on
        ? 'Test mode ON: every minute in the rules is now one second.'
        : 'Test mode OFF: normal minutes again.',
    },
    { kind: 'save' },
  ];
}

/** The player we were striking survived (totem) or died. Called by the adapter after a strike effect. */
export function reportStrike(state: GameState, outcome: 'died' | 'survived'): Effect[] {
  if (state.phase !== 'hunting' || !state.strikePending || !state.target) return [];
  state.strikePending = false;
  if (outcome === 'died') return caught(state, state.target, 'caught');
  state.phase = 'jumpscare';
  state.scareStep = 'retreat';
  state.remaining = CONFIG.retreatSeconds;
  return [{ kind: 'eye', eye: 'closed' }, { kind: 'mode', mode: 'idle' }, { kind: 'save' }];
}

/** A player left the game, changed dimension or died some other way. */
export function playerGone(state: GameState, playerId: string): Effect[] {
  if ((state.phase === 'hunting' || state.phase === 'jumpscare') && state.target === playerId) {
    return caught(state, playerId, 'gone');
  }
  return [];
}

function caught(state: GameState, playerId: string, how: 'caught' | 'gone' | 'exempt' | 'scared'): Effect[] {
  if (!state.caught.includes(playerId)) state.caught.push(playerId);
  state.target = null;
  state.targetDimension = null;
  state.strikePending = false;
  state.scareStep = null;
  state.phase = 'hunting';
  state.remaining = 0;
  const name = nameOf(state, playerId);
  const text = {
    caught: `The Given caught ${name}!`,
    gone: `${name} got away... this time. That counts as caught.`,
    exempt: `${name} is not playing in survival, so The Given leaves them alone.`,
    scared: `The Given got ${name}! BOO!`,
  }[how];
  return [{ kind: 'eye', eye: 'red' }, { kind: 'mode', mode: 'hunting' }, { kind: 'say', text }, { kind: 'save' }];
}

function remainingTargets(state: GameState): string[] {
  return state.failed.filter((id) => !state.caught.includes(id));
}

function eyePos(sphere: SphereView): Vec3 {
  return up(sphere.location, CONFIG.eyeHeight);
}

function chest(p: PlayerView): Vec3 {
  return up(p.location, CONFIG.playerChestHeight);
}

/** Choose the next failed player: closest first among those online in the watcher's dimension. */
export function chooseTarget(
  state: GameState,
  players: readonly PlayerView[],
  sphere: SphereView,
): { id: string | null; skipped: { id: string; why: 'gone' | 'exempt' }[] } {
  const skipped: { id: string; why: 'gone' | 'exempt' }[] = [];
  const online: PlayerView[] = [];
  for (const id of remainingTargets(state)) {
    const p = players.find((x) => x.id === id);
    if (p && !p.eligible) skipped.push({ id, why: 'exempt' });
    else if (p) online.push(p);
  }
  if (online.length === 0) {
    for (const id of remainingTargets(state)) if (!skipped.some((s) => s.id === id)) skipped.push({ id, why: 'gone' });
    return { id: null, skipped };
  }
  const here = eyePos(sphere);
  const score = (p: PlayerView): number =>
    p.dimension === sphere.dimension ? distance(here, chest(p)) : Number.MAX_SAFE_INTEGER;
  online.sort((a, b) => score(a) - score(b) || a.id.localeCompare(b.id));
  return { id: online[0]?.id ?? null, skipped };
}

function finishHunt(state: GameState): Effect[] {
  return closeEye(state, 'The hunt is over.', SOUNDS.eyeCloses);
}

/** Checks shared by the chase and the jump-scare: the target must still be here, eligible, alive, same dimension. */
function targetStillValid(state: GameState, ctx: TickContext): { player: PlayerView | null; effects: Effect[] } {
  const id = state.target;
  if (!id) return { player: null, effects: [] };
  const p = ctx.players.find((x) => x.id === id);
  if (!p) return { player: null, effects: caught(state, id, 'gone') };
  if (!p.eligible) return { player: null, effects: caught(state, id, 'exempt') };
  if (!p.alive) return { player: null, effects: caught(state, id, 'gone') };
  if (state.targetDimension !== null && p.dimension !== state.targetDimension) {
    return { player: null, effects: caught(state, id, 'gone') };
  }
  return { player: p, effects: [] };
}

function huntTick(state: GameState, dt: number, ctx: TickContext): Effect[] {
  if (state.strikePending) {
    state.remaining -= dt;
    // No report came back (the adapter missed it): count the touch as a catch.
    return state.remaining <= 0 && state.target ? caught(state, state.target, 'caught') : [];
  }
  const effects: Effect[] = [];
  if (!state.target) {
    const pick = chooseTarget(state, ctx.players, ctx.sphere);
    for (const s of pick.skipped) effects.push(...caught(state, s.id, s.why));
    if (!pick.id) return [...effects, ...finishHunt(state)];
    const p = ctx.players.find((x) => x.id === pick.id);
    state.target = pick.id;
    state.targetDimension = p?.dimension ?? null;
    state.heartbeat = 0;
    effects.push({ kind: 'say', text: `The Given is hunting ${nameOf(state, pick.id)}. RUN!` }, { kind: 'save' });
  }
  const check = targetStillValid(state, ctx);
  if (!check.player) return [...effects, ...check.effects];
  const p = check.player;
  if (!ctx.sphere.present || ctx.sphere.dimension !== p.dimension) {
    effects.push({ kind: 'respawnNear', playerId: p.id });
    return effects;
  }
  state.heartbeat -= dt;
  if (state.heartbeat <= 0) {
    state.heartbeat = 1;
    effects.push({ kind: 'sound', sound: SOUNDS.heartbeat, to: p.id });
  }
  const from = eyePos(ctx.sphere);
  const to = chest(p);
  if (distance(from, to) <= CONFIG.touchRadius) {
    state.strikePending = true;
    state.remaining = CONFIG.strikeResultSeconds;
    effects.push({ kind: 'strike', playerId: p.id });
    return effects;
  }
  const step = stepToward(from, to, CONFIG.huntSpeed * dt);
  effects.push({ kind: 'move', location: up(step.point, -CONFIG.eyeHeight), facing: to });
  return effects;
}

function scareTick(state: GameState, dt: number, ctx: TickContext): Effect[] {
  const check = targetStillValid(state, ctx);
  if (!check.player) return check.effects;
  const p = check.player;
  const effects: Effect[] = [];
  state.remaining -= dt;
  if (state.scareStep === 'retreat') {
    if (ctx.sphere.present && ctx.sphere.dimension === p.dimension) {
      const away = flatDirection(sub(ctx.sphere.location, p.location));
      const next = add(ctx.sphere.location, scale(away, CONFIG.retreatSpeed * dt));
      effects.push({ kind: 'move', location: next, facing: chest(p) });
    }
    if (state.remaining <= 0) {
      state.scareStep = 'wait';
      state.remaining = CONFIG.scareWaitSeconds;
    }
    return effects;
  }
  if (state.scareStep === 'wait') {
    if (state.remaining <= 0) {
      state.scareStep = 'scare';
      state.remaining = CONFIG.scareHoldSeconds;
      effects.push(
        { kind: 'scare', playerId: p.id },
        { kind: 'eye', eye: 'red' },
        { kind: 'sound', sound: SOUNDS.jumpscare, to: p.id },
      );
    }
    return effects;
  }
  if (state.remaining <= 0) return caught(state, p.id, 'scared');
  return effects;
}

/** The action bar line for one player. */
export function hudLine(state: GameState, playerId: string, eligible: boolean): string {
  if (!state.hasSphere) return '';
  switch (state.phase) {
    case 'idle':
      return `The Given's eye is closed. Next item in ${formatTime(state.remaining)}`;
    case 'mission': {
      const done = state.delivered.includes(playerId);
      const status = !eligible ? 'just watching' : done ? 'you gave it!' : 'drop it on The Given';
      return `${itemName(state.itemId)}  ${formatTime(state.remaining)}  (${status})`;
    }
    case 'hunting':
    case 'jumpscare':
      if (state.target === playerId) return 'RUN! The Given is coming for YOU!';
      return state.target ? `The Given is hunting ${nameOf(state, state.target)}!` : 'The Given is hunting...';
  }
}

export function statusText(state: GameState, players: readonly PlayerView[]): string {
  const lines = [
    `given.jar: phase ${state.phase}, tier ${state.tier}, test mode ${state.testMode ? 'on' : 'off'}`,
    `The Given: ${state.hasSphere ? 'summoned' : 'not summoned (use /given_jar:summon or the spawn egg)'}`,
  ];
  if (state.phase === 'mission') {
    const eligible = eligiblePlayers(players);
    const done = eligible.filter((p) => state.delivered.includes(p.id)).map((p) => p.name);
    const todo = eligible.filter((p) => !state.delivered.includes(p.id)).map((p) => p.name);
    lines.push(
      `item: ${itemName(state.itemId)}, time left ${formatTime(state.remaining)}`,
      `delivered: ${done.join(', ') || 'nobody yet'}; still to deliver: ${todo.join(', ') || 'nobody'}`,
    );
  } else if (state.phase === 'idle' && state.hasSphere) {
    lines.push(`next item in ${formatTime(state.remaining)}`);
  } else if (state.phase === 'hunting' || state.phase === 'jumpscare') {
    const left = remainingTargets(state).map((id) => nameOf(state, id));
    lines.push(`hunting: ${state.target ? nameOf(state, state.target) : 'choosing'}; still to catch: ${left.join(', ')}`);
  }
  return lines.join('\n');
}
