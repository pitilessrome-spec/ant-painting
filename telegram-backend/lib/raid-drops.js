'use strict';
// V7 boss drops (design table, 2026-11-26). Pure and deterministic: the same room and player
// always roll the same result, so a retried settlement cannot change what was paid.
const { createHash } = require('node:crypto');

const DAILY_CAP = 3;            // full drops per boss and size per player per UTC day; after that, materials only
const SHARDS_PER_RELIC = 5;     // five shards of a world's relic count as owning it
const BASE = {
  small: { relic_shard: 1, material: 2 },
  medium: { relic_shard: 2, material: 3 },
  world: { relic: 1, evolution_core: 1, material: 5, rare_material: 1 },
};
const FIRST_CLEAR_CORES = { small: 0, medium: 1, world: 2 };
const MEDIUM_CORE_CHANCE = 0.3;

function chance(roomId, playerId) {
  const h = createHash('sha256').update(`drop:${roomId}:${playerId}`).digest();
  return h.readUInt32BE(0) / 2 ** 32;
}

// -> [{item, quantity}] ; rewardedToday = full-drop clears of this boss and size already today
function roll({ roomId, playerId, tier, firstClear, rewardedToday }) {
  if (!BASE[tier]) throw Error('Unknown tier');
  if (rewardedToday >= DAILY_CAP) return [{ item: 'material', quantity: BASE[tier].material }];
  const out = { ...BASE[tier] };
  if (tier === 'medium' && chance(roomId, playerId) < MEDIUM_CORE_CHANCE) out.evolution_core = 1;
  if (firstClear && FIRST_CLEAR_CORES[tier]) out.evolution_core = (out.evolution_core || 0) + FIRST_CLEAR_CORES[tier];
  return Object.entries(out).map(([item, quantity]) => ({ item, quantity }));
}

module.exports = { roll, chance, DAILY_CAP, SHARDS_PER_RELIC, BASE, FIRST_CLEAR_CORES, MEDIUM_CORE_CHANCE };
