import { isTier } from '../items.ts';
import { createState, type GameState, type Phase, type ScareStep } from './machine.ts';

const PHASES: readonly Phase[] = ['idle', 'mission', 'hunting', 'jumpscare'];
const STEPS: readonly ScareStep[] = ['retreat', 'wait', 'scare'];

export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string') : [];
}

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function strOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

/** Parse saved state. Anything missing or broken falls back to the default, so an old save never crashes the game. */
export function deserialize(text: string | undefined | null): GameState {
  const fresh = createState();
  if (!text) return fresh;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return fresh;
  }
  if (typeof raw !== 'object' || raw === null) return fresh;
  const r = raw as Record<string, unknown>;
  const names: Record<string, string> = {};
  if (typeof r.names === 'object' && r.names !== null) {
    for (const [k, v] of Object.entries(r.names as Record<string, unknown>)) if (typeof v === 'string') names[k] = v;
  }
  const phase = PHASES.includes(r.phase as Phase) ? (r.phase as Phase) : fresh.phase;
  const step = STEPS.includes(r.scareStep as ScareStep) ? (r.scareStep as ScareStep) : null;
  const state: GameState = {
    v: 1,
    hasSphere: r.hasSphere === true,
    phase,
    tier: typeof r.tier === 'string' && isTier(r.tier) ? r.tier : fresh.tier,
    testMode: r.testMode === true,
    remaining: num(r.remaining, 0),
    itemId: strOrNull(r.itemId),
    lastItemId: strOrNull(r.lastItemId),
    delivered: strings(r.delivered),
    names,
    failed: strings(r.failed),
    caught: strings(r.caught),
    target: strOrNull(r.target),
    targetDimension: strOrNull(r.targetDimension),
    strikePending: r.strikePending === true,
    scareStep: phase === 'jumpscare' ? (step ?? 'retreat') : null,
    heartbeat: num(r.heartbeat, 0),
  };
  if (state.phase === 'mission' && !state.itemId) state.phase = 'idle';
  return state;
}
