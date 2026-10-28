// Curated mission items a survival player can find or make. Every texture path was checked against
// Mojang/bedrock-samples resource_pack/textures/item_texture.json and the PNG in the same repo
// (release 1.26.50.4, commit 46ba6ea, checked 2026-10-27). Item ids are checked against
// @minecraft/vanilla-data by test/items.test.ts. The texture key often differs from the item id.

export type Tier = 'easy' | 'medium' | 'hard';
export const TIERS: readonly Tier[] = ['easy', 'medium', 'hard'];

export interface MissionItem {
  /** Item type id, e.g. minecraft:diamond. */
  id: string;
  /** Name shown to players. */
  name: string;
  /** Vanilla texture path for the HUD image, without .png. */
  texture: string;
}

function item(id: string, name: string, texture: string): MissionItem {
  return { id: `minecraft:${id}`, name, texture: `textures/items/${texture}` };
}

export const ITEMS: Readonly<Record<Tier, readonly MissionItem[]>> = {
  easy: [
    item('apple', 'Apple', 'apple'),
    item('bread', 'Bread', 'bread'),
    item('stick', 'Stick', 'stick'),
    item('coal', 'Coal', 'coal'),
    item('charcoal', 'Charcoal', 'charcoal'),
    item('raw_iron', 'Raw Iron', 'raw_iron'),
    item('raw_copper', 'Raw Copper', 'raw_copper'),
    item('copper_ingot', 'Copper Ingot', 'copper_ingot'),
    item('wheat', 'Wheat', 'wheat'),
    item('wheat_seeds', 'Wheat Seeds', 'seeds_wheat'),
    item('feather', 'Feather', 'feather'),
    item('leather', 'Leather', 'leather'),
    item('string', 'String', 'string'),
    item('bone', 'Bone', 'bone'),
    item('arrow', 'Arrow', 'arrow'),
    item('flint', 'Flint', 'flint'),
    item('paper', 'Paper', 'paper'),
    item('sugar', 'Sugar', 'sugar'),
    item('sugar_cane', 'Sugar Cane', 'reeds'),
    item('egg', 'Egg', 'egg'),
    item('carrot', 'Carrot', 'carrot'),
    item('potato', 'Potato', 'potato'),
    item('baked_potato', 'Baked Potato', 'potato_baked'),
    item('beetroot', 'Beetroot', 'beetroot'),
    item('bowl', 'Bowl', 'bowl'),
    item('gunpowder', 'Gunpowder', 'gunpowder'),
    item('rotten_flesh', 'Rotten Flesh', 'rotten_flesh'),
    item('spider_eye', 'Spider Eye', 'spider_eye'),
    item('clay_ball', 'Clay Ball', 'clay_ball'),
    item('brick', 'Brick', 'brick'),
    item('snowball', 'Snowball', 'snowball'),
    item('beef', 'Raw Beef', 'beef_raw'),
    item('chicken', 'Raw Chicken', 'chicken_raw'),
    item('porkchop', 'Raw Porkchop', 'porkchop_raw'),
    item('cooked_beef', 'Steak', 'beef_cooked'),
    item('wooden_pickaxe', 'Wooden Pickaxe', 'wood_pickaxe'),
    item('stone_pickaxe', 'Stone Pickaxe', 'stone_pickaxe'),
  ],
  medium: [
    item('iron_ingot', 'Iron Ingot', 'iron_ingot'),
    item('gold_ingot', 'Gold Ingot', 'gold_ingot'),
    item('redstone', 'Redstone Dust', 'redstone_dust'),
    item('lapis_lazuli', 'Lapis Lazuli', 'dye_powder_blue_new'),
    item('emerald', 'Emerald', 'emerald'),
    item('amethyst_shard', 'Amethyst Shard', 'amethyst_shard'),
    item('book', 'Book', 'book_normal'),
    item('shears', 'Shears', 'shears'),
    item('bucket', 'Bucket', 'bucket_empty'),
    item('water_bucket', 'Water Bucket', 'bucket_water'),
    item('lava_bucket', 'Lava Bucket', 'bucket_lava'),
    item('iron_pickaxe', 'Iron Pickaxe', 'iron_pickaxe'),
    item('slime_ball', 'Slimeball', 'slimeball'),
    item('glowstone_dust', 'Glowstone Dust', 'glowstone_dust'),
    item('honeycomb', 'Honeycomb', 'honeycomb'),
    item('cake', 'Cake', 'cake'),
    item('pumpkin_pie', 'Pumpkin Pie', 'pumpkin_pie'),
    item('cookie', 'Cookie', 'cookie'),
    item('sweet_berries', 'Sweet Berries', 'sweet_berries'),
    item('glass_bottle', 'Glass Bottle', 'potion_bottle_empty'),
    item('cooked_salmon', 'Cooked Salmon', 'fish_salmon_cooked'),
    item('mushroom_stew', 'Mushroom Stew', 'mushroom_stew'),
    item('rabbit_foot', "Rabbit's Foot", 'rabbit_foot'),
    item('empty_map', 'Empty Map', 'map_empty'),
    item('lead', 'Lead', 'lead'),
  ],
  hard: [
    item('diamond', 'Diamond', 'diamond'),
    item('diamond_pickaxe', 'Diamond Pickaxe', 'diamond_pickaxe'),
    item('golden_apple', 'Golden Apple', 'apple_golden'),
    item('golden_carrot', 'Golden Carrot', 'carrot_golden'),
    item('ender_pearl', 'Ender Pearl', 'ender_pearl'),
    item('ender_eye', 'Eye of Ender', 'ender_eye'),
    item('blaze_rod', 'Blaze Rod', 'blaze_rod'),
    item('blaze_powder', 'Blaze Powder', 'blaze_powder'),
    item('magma_cream', 'Magma Cream', 'magma_cream'),
    item('nether_wart', 'Nether Wart', 'nether_wart'),
    item('quartz', 'Nether Quartz', 'quartz'),
    item('ghast_tear', 'Ghast Tear', 'ghast_tear'),
    item('prismarine_shard', 'Prismarine Shard', 'prismarine_shard'),
    item('prismarine_crystals', 'Prismarine Crystals', 'prismarine_crystals'),
    item('phantom_membrane', 'Phantom Membrane', 'phantom_membrane'),
    item('enchanted_book', 'Enchanted Book', 'book_enchanted'),
    item('name_tag', 'Name Tag', 'name_tag'),
    item('saddle', 'Saddle', 'saddle'),
    item('spyglass', 'Spyglass', 'spyglass'),
    item('goat_horn', 'Goat Horn', 'goat_horn'),
  ],
};

export function findItem(id: string): MissionItem | undefined {
  for (const tier of TIERS) {
    const hit = ITEMS[tier].find((i) => i.id === id);
    if (hit) return hit;
  }
  return undefined;
}

export function isTier(value: string): value is Tier {
  return (TIERS as readonly string[]).includes(value);
}

/** Pick an item from a tier with a random number in [0, 1). Never returns the excluded id when there is a choice. */
export function pickItem(tier: Tier, random: number, excludeId?: string | null): MissionItem {
  const pool = ITEMS[tier].filter((i) => i.id !== excludeId);
  const list = pool.length > 0 ? pool : ITEMS[tier];
  const index = Math.min(list.length - 1, Math.max(0, Math.floor(random * list.length)));
  const picked = list[index];
  if (!picked) throw new Error(`no items in tier ${tier}`);
  return picked;
}
