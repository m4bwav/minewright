import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { inDeliveryZone } from '../src/core/zone.ts';
import { chooseDropper, InventorySnapshots } from '../src/core/attribution.ts';

const cfg = { deliveryRadius: 2.5, pathBoxLength: 3, pathBoxHalfWidth: 1.5 };
const eye = { x: 0, y: 65, z: 0 };
const south = { x: 0, y: -0.3, z: 1 };

describe('delivery zone', () => {
  it('counts items close to the watcher from any side', () => {
    assert.equal(inDeliveryZone(eye, south, { x: 0, y: 64, z: 0 }, cfg), true);
    assert.equal(inDeliveryZone(eye, south, { x: -2, y: 64, z: 0 }, cfg), true);
    assert.equal(inDeliveryZone(eye, south, { x: 0, y: 65, z: -2.4 }, cfg), true);
  });

  it('counts items in its path ahead, not behind or off to the side', () => {
    assert.equal(inDeliveryZone(eye, south, { x: 0.5, y: 64, z: 5 }, cfg), true);
    assert.equal(inDeliveryZone(eye, south, { x: 0, y: 64, z: -5 }, cfg), false);
    assert.equal(inDeliveryZone(eye, south, { x: 3, y: 64, z: 4 }, cfg), false);
    assert.equal(inDeliveryZone(eye, south, { x: 0, y: 64, z: 6 }, cfg), false);
    assert.equal(inDeliveryZone(eye, south, { x: 0, y: 70, z: 4 }, cfg), false);
  });
});

describe('who dropped it', () => {
  it('credits the nearest player whose count went down, not simply the nearest player', () => {
    const id = chooseDropper(
      [
        { id: 'nearest', before: 2, now: 2, distance: 0.5 },
        { id: 'dropper', before: 3, now: 2, distance: 2 },
        { id: 'far', before: 1, now: 0, distance: 20 },
      ],
      6,
    );
    assert.equal(id, 'dropper');
  });

  it('returns null when nobody lost an item nearby', () => {
    assert.equal(chooseDropper([{ id: 'a', before: 1, now: 1, distance: 1 }], 6), null);
    assert.equal(chooseDropper([{ id: 'a', before: 1, now: 0, distance: 9 }], 6), null);
  });

  it('snapshots remember the larger of the last two counts and settle after a credit', () => {
    const s = new InventorySnapshots();
    s.record(new Map([['a', 3]]));
    s.record(new Map([['a', 2]]));
    assert.equal(s.before('a'), 3, 'a snapshot taken right after the drop does not hide it');
    s.settle('a', 2);
    assert.equal(s.before('a'), 2);
    s.clear();
    assert.equal(s.before('a'), 0);
  });
});
