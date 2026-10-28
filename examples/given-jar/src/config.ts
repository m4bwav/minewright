// Every duration, speed and distance the game uses lives here, so tuning never means hunting through code.
// Durations are in "units": minutes in a normal game, seconds in test mode (/given_jar:testmode on).

export const DURATION_UNITS = {
  /** Time to find and deliver the item. */
  mission: 30,
  /** Time one /given_jar:skip removes from the mission clock. */
  skip: 10,
  /** Break between missions while the eye is closed. */
  eyeClosed: 10,
} as const;

export const SECONDS_PER_UNIT_NORMAL = 60;
export const SECONDS_PER_UNIT_TEST = 1;

export const CONFIG = {
  /** Seconds after the first watcher is summoned before the first mission starts. */
  firstMissionDelaySeconds: 5,
  /** Blocks per second the watcher flies during a hunt. It goes straight through blocks. */
  huntSpeed: 6,
  /** Distance (blocks, eye centre to player chest) that counts as a touch. */
  touchRadius: 1.5,
  /** Damage dealt on touch. Huge, but through applyDamage so a Totem of Undying still saves the player. */
  strikeDamage: 1000,
  /** Seconds to wait for the strike result before treating the target as caught. */
  strikeResultSeconds: 2,
  /** An item counts as delivered within this many blocks of the watcher's centre... */
  deliveryRadius: 2.5,
  /** ...or inside a box this long in front of the eye (the watcher's path)... */
  pathBoxLength: 3,
  /** ...and this wide/tall on each side of the eye's line of sight. */
  pathBoxHalfWidth: 1.5,
  /** Totem path: seconds the watcher fakes a retreat (eye closed, backing away). */
  retreatSeconds: 3,
  /** Totem path: blocks per second while backing away. */
  retreatSpeed: 3,
  /** Totem path: seconds of quiet after the retreat before the jump-scare. */
  scareWaitSeconds: 4,
  /** Totem path: seconds the jump-scare holds in front of the player's face. */
  scareHoldSeconds: 2,
  /** Blocks in front of the player's eyes the watcher appears at for the jump-scare. */
  scareDistance: 1.6,
  /** When the watcher must come back (unloaded chunk, other dimension) it appears this far from the target. */
  respawnDistance: 20,
  /** Height of the watcher's eye above its feet position, in blocks. */
  eyeHeight: 1.2,
  /** Height of a player's chest above their feet, in blocks. */
  playerChestHeight: 1.2,
  /** Script loop period in game ticks (20 ticks = 1 second). */
  loopTicks: 2,
  /** Save state to the world every this many seconds (and on every phase change). */
  saveEverySeconds: 5,
  /** How far (blocks) from a dropped item the dropper can be when we attribute it by inventory change. */
  dropAttributionRadius: 6,
  /** Title on screen at mission start, in ticks: fade in, stay, fade out. */
  titleTicks: { fadeIn: 5, stay: 80, fadeOut: 10 },
} as const;

export function secondsPerUnit(testMode: boolean): number {
  return testMode ? SECONDS_PER_UNIT_TEST : SECONDS_PER_UNIT_NORMAL;
}

export interface Durations {
  mission: number;
  skip: number;
  eyeClosed: number;
}

/** Durations in seconds for the current mode. */
export function durations(testMode: boolean): Durations {
  const s = secondsPerUnit(testMode);
  return {
    mission: DURATION_UNITS.mission * s,
    skip: DURATION_UNITS.skip * s,
    eyeClosed: DURATION_UNITS.eyeClosed * s,
  };
}
