import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, durations } from '../src/config.ts';
import { ITEMS } from '../src/items.ts';
import {
  chooseTarget,
  createState,
  deliver,
  eyeFor,
  formatTime,
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
} from '../src/core/machine.ts';
import { deserialize, serialize } from '../src/core/serialize.ts';
import { distance } from '../src/core/vec.ts';

const DT = 0.1;

function player(id: string, x = 0, z = 0, extra: Partial<PlayerView> = {}): PlayerView {
  return {
    id,
    name: id.toUpperCase(),
    eligible: true,
    alive: true,
    dimension: 'minecraft:overworld',
    location: { x, y: 64, z },
    ...extra,
  };
}

function sphereAt(x = 0, z = 0, extra: Partial<SphereView> = {}): SphereView {
  return { present: true, dimension: 'minecraft:overworld', location: { x, y: 64, z }, ...extra };
}

const fixedRandom = () => 0;

/** A world the tests can step: players, a watcher that follows 'move' effects, and every effect seen. */
class World {
  state: GameState = createState();
  players: PlayerView[];
  sphere: SphereView = sphereAt();
  effects: Effect[] = [];

  constructor(players: PlayerView[]) {
    this.players = players;
  }

  run(effects: Effect[]): Effect[] {
    for (const fx of effects) if (fx.kind === 'move') this.sphere = { ...this.sphere, location: fx.location };
    this.effects.push(...effects);
    return effects;
  }

  step(seconds = DT): Effect[] {
    const out: Effect[] = [];
    let left = seconds;
    while (left > 1e-9) {
      const dt = Math.min(DT, left);
      left -= dt;
      out.push(...this.run(tick(this.state, dt, { players: this.players, sphere: this.sphere, random: fixedRandom })));
    }
    return out;
  }

  /** Summon, wait out the first-mission delay, return with a mission running. */
  startMission(): void {
    this.run(summon(this.state));
    this.step(CONFIG.firstMissionDelaySeconds + DT);
    assert.equal(this.state.phase, 'mission');
  }

  give(id: string): ReturnType<typeof deliver> {
    const p = this.players.find((x) => x.id === id);
    assert.ok(p);
    const r = deliver(this.state, p, this.state.itemId ?? '');
    this.run(r.effects);
    return r;
  }

  /** The hunt (or mission) is over and the eye is closed again. */
  finished(): boolean {
    return this.state.phase === 'idle';
  }

  said(pattern: RegExp): boolean {
    return this.effects.some((fx) => fx.kind === 'say' && pattern.test(fx.text));
  }

  of<K extends Effect['kind']>(kind: K): Extract<Effect, { kind: K }>[] {
    return this.effects.filter((fx): fx is Extract<Effect, { kind: K }> => fx.kind === kind);
  }
}

describe('before the watcher exists', () => {
  it('does nothing until summoned', () => {
    const w = new World([player('a')]);
    assert.deepEqual(w.step(100), []);
    assert.equal(w.state.phase, 'idle');
  });

  it('starts the first mission shortly after the summon', () => {
    const w = new World([player('a')]);
    w.run(summon(w.state));
    assert.equal(w.state.hasSphere, true);
    assert.equal(eyeFor(w.state), 'closed');
    w.step(CONFIG.firstMissionDelaySeconds - 0.5);
    assert.equal(w.state.phase, 'idle');
    w.step(1);
    assert.equal(w.state.phase, 'mission');
  });
});

describe('mission start', () => {
  it('picks one item from the tier for everybody, opens the eye and shows the title', () => {
    const w = new World([player('a'), player('b')]);
    w.startMission();
    assert.equal(w.state.itemId, ITEMS.easy[0]?.id);
    assert.equal(eyeFor(w.state), 'open');
    assert.equal(w.state.remaining <= durations(false).mission, true);
    assert.equal(w.state.remaining > durations(false).mission - 1, true);
    const titles = w.of('missionTitle');
    assert.equal(titles.length, 1);
    assert.equal(titles[0]?.to, undefined, 'the title goes to everyone');
    assert.ok(w.said(/It wants: Apple/));
  });

  it('uses the chosen tier and never repeats the last item back to back', () => {
    const w = new World([player('a')]);
    w.run(setTier(w.state, 'hard'));
    w.startMission();
    const first = w.state.itemId;
    assert.ok(ITEMS.hard.some((i) => i.id === first));
    w.give('a');
    w.step(DT);
    assert.equal(w.state.phase, 'idle');
    w.step(durations(false).eyeClosed + DT);
    assert.equal(w.state.phase, 'mission');
    assert.notEqual(w.state.itemId, first);
  });
});

describe('deliveries', () => {
  it('credits the dropper once and only for the mission item', () => {
    const w = new World([player('a'), player('b')]);
    w.startMission();
    assert.equal(deliver(w.state, player('a'), 'minecraft:dirt').accepted, false);
    const first = w.give('a');
    assert.equal(first.accepted, true);
    assert.deepEqual(w.state.delivered, ['a']);
    assert.ok(first.effects.some((fx) => fx.kind === 'clearTitle' && fx.to === 'a'));
    const again = w.give('a');
    assert.equal(again.accepted, false);
    assert.equal(again.reason, 'already delivered');
    w.step(DT);
    assert.equal(w.state.phase, 'mission', 'b still has to deliver');
  });

  it('when everyone delivered: reset, eye closed for 10 minutes, then a new mission by itself', () => {
    const w = new World([player('a'), player('b')]);
    w.startMission();
    w.give('a');
    w.give('b');
    w.step(DT);
    assert.equal(w.state.phase, 'idle');
    assert.equal(eyeFor(w.state), 'closed');
    assert.deepEqual(w.state.delivered, []);
    assert.equal(w.state.itemId, null);
    assert.ok(Math.abs(w.state.remaining - 600) < 0.2);
    w.step(599);
    assert.equal(w.state.phase, 'idle');
    w.step(1.1);
    assert.equal(w.state.phase, 'mission');
    assert.ok(Math.abs(w.state.remaining - 1800) < 0.2, 'the mission clock is reset');
  });

  it('does not accept deliveries outside a mission', () => {
    const w = new World([player('a')]);
    w.run(summon(w.state));
    assert.equal(deliver(w.state, player('a'), 'minecraft:apple').reason, 'no mission');
  });
});

describe('skip', () => {
  it('cuts 10 minutes off the mission clock', () => {
    const w = new World([player('a')]);
    w.startMission();
    const before = w.state.remaining;
    w.run(skip(w.state));
    assert.ok(Math.abs(before - 600 - w.state.remaining) < 1e-9);
    assert.equal(w.state.phase, 'mission');
  });

  it('below zero starts the hunt at once', () => {
    const w = new World([player('a')]);
    w.startMission();
    w.run(skip(w.state));
    w.run(skip(w.state));
    w.run(skip(w.state));
    assert.equal(w.state.remaining, 0);
    w.step(DT);
    assert.equal(w.state.phase, 'hunting');
    assert.equal(eyeFor(w.state), 'red');
    assert.deepEqual(w.state.failed, ['a']);
  });

  it('shortens the eye-closed break too, and does nothing during a hunt', () => {
    const w = new World([player('a')]);
    w.startMission();
    w.give('a');
    w.step(DT);
    w.run(skip(w.state));
    w.step(DT);
    assert.equal(w.state.phase, 'mission');
    w.state.remaining = 0;
    w.step(DT);
    assert.equal(w.state.phase, 'hunting');
    const out = skip(w.state);
    assert.equal(w.state.phase, 'hunting');
    assert.ok(out.some((fx) => fx.kind === 'say' && /already on/.test(fx.text)));
  });
});

describe('timeout and the hunt', () => {
  it('players who did not deliver become the failed list', () => {
    const w = new World([player('a'), player('b'), player('c')]);
    w.startMission();
    w.give('b');
    w.step(durations(false).mission + 1);
    assert.equal(w.state.phase, 'hunting');
    assert.deepEqual([...w.state.failed].sort(), ['a', 'c']);
    assert.equal(modeFor(w.state), 'hunting');
  });

  it('with nobody failed the eye just closes', () => {
    const w = new World([player('a', 0, 0, { eligible: false })]);
    w.startMission();
    w.step(durations(false).mission + 1);
    assert.equal(w.state.phase, 'idle');
  });

  it('hunts the closest failed player first, one at a time, each caught once', () => {
    const w = new World([player('far', 30, 0), player('near', 5, 0), player('mid', 0, 12)]);
    w.startMission();
    w.state.remaining = 0;
    w.step(DT);
    assert.equal(w.state.phase, 'hunting');
    const order: string[] = [];
    for (let i = 0; i < 2000 && !w.finished(); i++) {
      const out = w.step(DT);
      const s = out.find((fx) => fx.kind === 'strike');
      if (s && s.kind === 'strike') {
        order.push(s.playerId);
        w.run(reportStrike(w.state, 'died'));
      }
    }
    assert.deepEqual(order, ['near', 'mid', 'far']);
    assert.equal(w.state.phase, 'idle');
    assert.equal(eyeFor(w.state), 'closed');
    assert.ok(Math.abs(w.state.remaining - 600) < 0.2);
  });

  it('flies straight at the target at the configured speed', () => {
    const w = new World([player('a', 20, 0)]);
    w.startMission();
    w.state.remaining = 0;
    w.step(DT);
    w.step(DT); // chooses the target
    const start = { ...w.sphere.location };
    w.step(1);
    const moved = distance(start, w.sphere.location);
    assert.ok(Math.abs(moved - CONFIG.huntSpeed) < 0.01, `moved ${moved}`);
    assert.ok(w.sphere.location.x > start.x);
  });

  it('a target who leaves, dies another way or changes dimension counts as caught', () => {
    const w = new World([player('a', 5, 0), player('b', 10, 0), player('c', 15, 0)]);
    w.startMission();
    w.state.remaining = 0;
    w.step(DT);
    w.step(DT);
    assert.equal(w.state.target, 'a');
    w.players = w.players.filter((p) => p.id !== 'a');
    w.step(DT);
    assert.deepEqual(w.state.caught, ['a']);
    w.step(DT);
    assert.equal(w.state.target, 'b');
    w.run(playerGone(w.state, 'b'));
    assert.deepEqual(w.state.caught, ['a', 'b']);
    w.step(DT);
    assert.equal(w.state.target, 'c');
    w.players = w.players.map((p) => (p.id === 'c' ? { ...p, dimension: 'minecraft:nether' } : p));
    w.step(DT);
    assert.deepEqual(w.state.caught, ['a', 'b', 'c']);
    w.step(DT);
    assert.equal(w.state.phase, 'idle');
  });

  it('a target who died of something else counts as caught', () => {
    const w = new World([player('a', 5, 0)]);
    w.startMission();
    w.state.remaining = 0;
    w.step(DT * 2);
    w.players = [player('a', 5, 0, { alive: false })];
    w.step(DT);
    assert.deepEqual(w.state.caught, ['a']);
  });

  it('a failed player who logged off before their turn is counted caught without a chase', () => {
    const w = new World([player('a', 5, 0), player('b', 8, 0)]);
    w.startMission();
    w.state.remaining = 0;
    w.step(DT);
    w.players = [player('a', 5, 0)];
    let strikes = 0;
    for (let i = 0; i < 200 && w.state.phase !== 'idle'; i++) {
      if (w.step(DT).some((fx) => fx.kind === 'strike')) {
        strikes++;
        w.run(reportStrike(w.state, 'died'));
      }
    }
    assert.equal(strikes, 1);
    assert.equal(w.state.phase, 'idle');
    assert.ok(w.said(/B got away/));
  });

  it('asks the adapter to bring the watcher back when it is unloaded or in another dimension', () => {
    const w = new World([player('a', 5, 0)]);
    w.startMission();
    w.state.remaining = 0;
    w.step(DT);
    w.sphere = sphereAt(0, 0, { present: false });
    const out = w.step(DT);
    assert.ok(out.some((fx) => fx.kind === 'respawnNear' && fx.playerId === 'a'));
    assert.equal(w.state.phase, 'hunting');
  });

  it('no report after a strike still counts as caught', () => {
    const w = new World([player('a', 1, 0)]);
    w.startMission();
    w.state.remaining = 0;
    w.step(DT);
    for (let i = 0; i < 50 && !w.state.strikePending; i++) w.step(DT);
    assert.equal(w.state.strikePending, true);
    w.step(CONFIG.strikeResultSeconds + DT);
    w.step(DT);
    assert.equal(w.state.phase, 'idle');
  });
});

describe('totem: fake retreat then jump-scare', () => {
  it('retreats with the eye closed, waits, scares with the red eye, then counts as caught', () => {
    const w = new World([player('a', 3, 0)]);
    w.startMission();
    w.state.remaining = 0;
    w.step(DT);
    for (let i = 0; i < 50 && !w.state.strikePending; i++) w.step(DT);
    w.run(reportStrike(w.state, 'survived'));
    assert.equal(w.state.phase, 'jumpscare');
    assert.equal(eyeFor(w.state), 'closed');
    const before = distance(w.sphere.location, w.players[0]?.location ?? w.sphere.location);
    w.step(CONFIG.retreatSeconds - DT);
    const after = distance(w.sphere.location, w.players[0]?.location ?? w.sphere.location);
    assert.ok(after > before + 1, 'it backs away');
    w.step(DT * 2);
    assert.equal(w.state.scareStep, 'wait');
    assert.equal(eyeFor(w.state), 'closed');
    const scare = w.step(CONFIG.scareWaitSeconds);
    assert.ok(scare.some((fx) => fx.kind === 'scare' && fx.playerId === 'a'));
    assert.ok(scare.some((fx) => fx.kind === 'sound' && fx.to === 'a'));
    assert.equal(eyeFor(w.state), 'red');
    w.step(CONFIG.scareHoldSeconds + DT);
    assert.ok(w.said(/The eye got A! BOO!/), 'counted as caught');
    w.step(DT);
    assert.equal(w.state.phase, 'idle');
    assert.equal(w.of('strike').length, 1, 'struck only once');
  });

  it('the target leaving during the scare also ends it', () => {
    const w = new World([player('a', 1, 0)]);
    w.startMission();
    w.state.remaining = 0;
    w.step(DT);
    for (let i = 0; i < 50 && !w.state.strikePending; i++) w.step(DT);
    w.run(reportStrike(w.state, 'survived'));
    w.players = [];
    w.step(DT);
    assert.deepEqual(w.state.caught, ['a']);
  });
});

describe('creative and spectator players are exempt', () => {
  it('cannot deliver, are not required, and are never hunted', () => {
    const w = new World([player('s', 0, 5), player('c', 0, 1, { eligible: false })]);
    w.startMission();
    assert.equal(deliver(w.state, w.players[1] ?? player('x'), w.state.itemId ?? '').reason, 'exempt');
    w.give('s');
    w.step(DT);
    assert.equal(w.state.phase, 'idle', 'only the survival player had to deliver');
  });

  it('a failed player who switches to creative is left alone', () => {
    const w = new World([player('a', 2, 0), player('b', 9, 0)]);
    w.startMission();
    w.state.remaining = 0;
    w.step(DT);
    w.players = [player('a', 2, 0, { eligible: false }), player('b', 9, 0)];
    let struck: string[] = [];
    for (let i = 0; i < 200 && w.state.phase !== 'idle'; i++) {
      const s = w.step(DT).filter((fx) => fx.kind === 'strike');
      struck = struck.concat(s.map((fx) => (fx.kind === 'strike' ? fx.playerId : '')));
      if (s.length) w.run(reportStrike(w.state, 'died'));
    }
    assert.deepEqual(struck, ['b']);
    assert.ok(w.said(/A is not playing in survival/));
  });

  it('chooseTarget ignores exempt players', () => {
    const s = createState();
    s.failed = ['a', 'b'];
    const pick = chooseTarget(s, [player('a', 1, 0, { eligible: false }), player('b', 50, 0)], sphereAt());
    assert.equal(pick.id, 'b');
    assert.deepEqual(pick.skipped, [{ id: 'a', why: 'exempt' }]);
  });
});

describe('test mode', () => {
  it('uses seconds instead of minutes', () => {
    assert.deepEqual(durations(true), { mission: 30, skip: 10, eyeClosed: 10 });
    assert.deepEqual(durations(false), { mission: 1800, skip: 600, eyeClosed: 600 });
    const w = new World([player('a')]);
    w.run(setTestMode(w.state, true));
    w.startMission();
    assert.ok(w.state.remaining <= 30 && w.state.remaining > 29);
    w.run(skip(w.state));
    assert.ok(w.state.remaining <= 20 && w.state.remaining > 19);
    w.step(20.2);
    assert.equal(w.state.phase, 'hunting');
  });

  it('switching scales the running clock', () => {
    const w = new World([player('a')]);
    w.startMission();
    w.state.remaining = 1200;
    w.run(setTestMode(w.state, true));
    assert.equal(w.state.remaining, 20);
    w.run(setTestMode(w.state, false));
    assert.equal(w.state.remaining, 1200);
  });
});

describe('HUD and status text', () => {
  it('formats time as m:ss', () => {
    assert.equal(formatTime(1800), '30:00');
    assert.equal(formatTime(59.2), '1:00');
    assert.equal(formatTime(-3), '0:00');
  });

  it('tells each player what to do', () => {
    const w = new World([player('a'), player('b', 0, 0, { eligible: false })]);
    w.startMission();
    assert.match(hudLine(w.state, 'a', true), /^Apple {2}\d+:\d\d {2}\(drop it on the eye\)$/);
    assert.match(hudLine(w.state, 'b', false), /just watching/);
    w.give('a');
    assert.match(hudLine(w.state, 'a', true), /you gave it/);
    assert.match(statusText(w.state, w.players), /delivered: A/);
  });
});

describe('save and load', () => {
  it('round-trips every field', () => {
    const w = new World([player('a', 3, 0), player('b', 9, 0)]);
    w.startMission();
    w.give('b');
    w.state.remaining = 0;
    w.step(DT * 2);
    const text = serialize(w.state);
    const back = deserialize(text);
    assert.deepEqual(back, w.state);
    assert.equal(serialize(back), text);
  });

  it('falls back to a fresh state on missing or broken data', () => {
    assert.deepEqual(deserialize(undefined), createState());
    assert.deepEqual(deserialize('{nope'), createState());
    assert.deepEqual(deserialize('42'), createState());
    const partial = deserialize(JSON.stringify({ phase: 'hunting', tier: 'impossible', remaining: 'x' }));
    assert.equal(partial.phase, 'hunting');
    assert.equal(partial.tier, 'easy');
    assert.equal(partial.remaining, 0);
  });
});
