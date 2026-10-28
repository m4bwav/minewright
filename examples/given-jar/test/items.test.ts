import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MinecraftItemTypes } from '@minecraft/vanilla-data';
import { ITEMS, TIERS, findItem, isTier, pickItem } from '../src/items.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/vanilla-item-textures.json', import.meta.url), 'utf8')) as {
  textures: string[];
};
const vanillaTextures = new Set(fixture.textures);
const vanillaItems = new Set<string>(Object.values(MinecraftItemTypes));

describe('curated items', () => {
  const all = TIERS.flatMap((t) => ITEMS[t]);

  it('every tier has a decent pool', () => {
    for (const t of TIERS) assert.ok(ITEMS[t].length >= 15, `${t} has ${ITEMS[t].length}`);
  });

  it('every id is a real vanilla item (@minecraft/vanilla-data)', () => {
    for (const i of all) assert.ok(vanillaItems.has(i.id), `${i.id} is not in vanilla-data`);
  });

  it('every texture path exists in Mojang/bedrock-samples (test/fixtures, scripts/verify_textures.py)', () => {
    for (const i of all) assert.ok(vanillaTextures.has(i.texture), `${i.id}: ${i.texture} not in item_texture.json`);
  });

  it('ids are unique across tiers and names are set', () => {
    const ids = all.map((i) => i.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const i of all) assert.ok(i.name.length > 0);
  });

  it('findItem, isTier and pickItem', () => {
    assert.equal(findItem('minecraft:diamond')?.name, 'Diamond');
    assert.equal(findItem('minecraft:dirt'), undefined);
    assert.equal(isTier('medium'), true);
    assert.equal(isTier('extreme'), false);
    assert.equal(pickItem('easy', 0).id, ITEMS.easy[0]?.id);
    assert.equal(pickItem('easy', 0.999999).id, ITEMS.easy[ITEMS.easy.length - 1]?.id);
    assert.notEqual(pickItem('easy', 0, ITEMS.easy[0]?.id).id, ITEMS.easy[0]?.id);
  });
});
