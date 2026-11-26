'use strict';
// V7 boss drops: amounts from the design table, deterministic rolls, daily cap,
// settlement idempotency, cores and relics feeding ant evolution, V6 unchanged.
const test = require('node:test'), assert = require('node:assert/strict');
const D = require('../lib/raid-drops');
const asMap = list => Object.fromEntries(list.map(d => [d.item, d.quantity]));

test('drop table matches the design: small, medium, world, first clear', () => {
  assert.deepEqual(asMap(D.roll({ roomId: 'a', playerId: '1', tier: 'small', firstClear: true, rewardedToday: 0 })), { relic_shard: 1, material: 2 });
  assert.deepEqual(asMap(D.roll({ roomId: 'a', playerId: '1', tier: 'world', firstClear: false, rewardedToday: 0 })), { relic: 1, evolution_core: 1, material: 5, rare_material: 1 });
  assert.deepEqual(asMap(D.roll({ roomId: 'a', playerId: '1', tier: 'world', firstClear: true, rewardedToday: 0 })), { relic: 1, evolution_core: 3, material: 5, rare_material: 1 });
  const m = asMap(D.roll({ roomId: 'a', playerId: '1', tier: 'medium', firstClear: true, rewardedToday: 0 }));
  assert.equal(m.relic_shard, 2); assert.equal(m.material, 3); assert.ok(m.evolution_core === 1 || m.evolution_core === 2);
});

test('medium core drops about 30% of the time and the same room always rolls the same', () => {
  let hits = 0;
  for (let i = 0; i < 4000; i++) if (asMap(D.roll({ roomId: 'room-' + i, playerId: '7', tier: 'medium', firstClear: false, rewardedToday: 0 })).evolution_core) hits++;
  assert.ok(hits / 4000 > 0.27 && hits / 4000 < 0.33, String(hits / 4000));
  const a = D.roll({ roomId: 'x', playerId: '9', tier: 'medium', firstClear: false, rewardedToday: 0 });
  assert.deepEqual(D.roll({ roomId: 'x', playerId: '9', tier: 'medium', firstClear: false, rewardedToday: 0 }), a);
});

test('after the daily cap only materials drop', () => {
  assert.deepEqual(D.roll({ roomId: 'a', playerId: '1', tier: 'world', firstClear: false, rewardedToday: D.DAILY_CAP }), [{ item: 'material', quantity: 5 }]);
});

test('Postgres: drops pay once per clear, add up on repeats, respect the cap, unlock ants; V6 rooms keep the old reward',
  { skip: !process.env.RAID_TEST_DATABASE_URL }, async () => {
    const { Pool } = require('pg'), S = require('../lib/raid-service'), R = require('../lib/raid-engine');
    const saved = { e: process.env.ANT_RAID_ENABLED, v6: process.env.ANT_RAID_V6, v7: process.env.ANT_RAID_V7 };
    process.env.ANT_RAID_ENABLED = '1'; delete process.env.ANT_RAID_V6; process.env.ANT_RAID_V7 = '1';
    const rooms = [];
    const db = new Pool({ connectionString: process.env.RAID_TEST_DATABASE_URL, ssl: process.env.DB_SSL === 'false' ? false : undefined });
    try {
      await db.query('CREATE TABLE IF NOT EXISTS players(telegram_id BIGINT PRIMARY KEY)'); await S.ensure(db);
      await db.query('INSERT INTO players(telegram_id) SELECT generate_series(101,110) ON CONFLICT DO NOTHING');
      await db.query('DELETE FROM raid_drops WHERE player_id BETWEEN 101 AND 110');
      async function req(id, path, body = {}) { let out; const res = { statusCode: 0, setHeader() {}, end(s) { out = JSON.parse(s); } }; await S.route({ method: 'POST', body }, res, db, { id: String(id) }, 'raid/' + path); return { ...out, httpStatus: res.statusCode }; }
      async function win(owner, boss, tier) {
        const room = await req(owner, 'create', { tier, boss }); assert.equal(room.httpStatus, 200, room.error); rooms.push(room.room);
        await req(owner, 'start', { room: room.room });
        const st = (await db.query('SELECT state FROM raid_rooms WHERE id=$1', [room.room])).rows[0].state; st.hp = 1;
        await db.query('UPDATE raid_rooms SET state=$2 WHERE id=$1', [room.room, JSON.stringify(st)]);
        const v = R.view(st, String(owner)), color = v.me.available.find(c => c !== v.me.blocked) ?? v.me.available[0];
        const r = await req(owner, 'act', { room: room.room, seq: 1, kind: 'color', color });
        assert.equal(r.status, 'won', JSON.stringify(r).slice(0, 200)); return room.room;
      }
      const inv = async id => Object.fromEntries((await req(id, 'inventory')).items.filter(x => x.tier === null).map(x => [x.boss + ':' + x.item_code, x.quantity]));

      // first world clear, then a repeat
      const first = await win(101, 'beetle', 'world');
      assert.deepEqual(await inv(101), { 'beetle:relic': 1, 'beetle:evolution_core': 3, 'beetle:material': 5, 'beetle:rare_material': 1 });
      await req(101, 'state', { room: first }); await req(101, 'state', { room: first });
      assert.equal((await inv(101))['beetle:evolution_core'], 3, 'reading a finished room never pays again');
      await win(101, 'beetle', 'world');
      const after = await inv(101);
      assert.equal(after['beetle:evolution_core'], 4); assert.equal(after['beetle:relic'], 2); assert.equal(after['beetle:material'], 10);
      const ants = await req(101, 'ants');
      assert.equal(ants.cores, 4); assert.ok(ants.ants.find(a => a.species === 'fire').unlockable);

      // daily cap: three full drops, then materials only
      for (let i = 0; i < 4; i++) await win(102, 'spider', 'small');
      const capped = await inv(102);
      assert.equal(capped['spider:relic_shard'], 3); assert.equal(capped['spider:material'], 8);

      // five shards make a relic: 3 small (1 each) + 1 medium (2) on Coral Island unlock the Wing Ant
      for (let i = 0; i < 3; i++) await win(103, 'prism', 'small');
      assert.ok(!(await req(103, 'ants')).ants.find(a => a.species === 'wing').unlockable);
      await win(103, 'prism', 'medium');
      assert.ok((await req(103, 'ants')).ants.find(a => a.species === 'wing').unlockable);

      // a room created with V7 off keeps the old first-clear reward and writes no drops
      process.env.ANT_RAID_V7 = '0';
      await win(104, 'frost', 'world');
      assert.deepEqual(await inv(104), {});
      const old = (await req(104, 'inventory')).items.filter(x => x.tier === 'world');
      assert.deepEqual(old.map(x => x.item_code + ':' + x.quantity).sort(), ['evolution_core:6', 'relic_frost:1']);
    } finally {
      // leave the shared test database as we found it (other tests count first-clear ranks)
      if (rooms.length) for (const t of ['raid_drops', 'raid_rewards', 'raid_clear_attempts', 'raid_first_clears']) await db.query(`DELETE FROM ${t} WHERE room_id = ANY($1::uuid[])`, [rooms]).catch(() => {});
      if (rooms.length) { await db.query('DELETE FROM raid_inventory WHERE source_room = ANY($1::uuid[])', [rooms]).catch(() => {}); await db.query('DELETE FROM raid_rooms WHERE id = ANY($1::uuid[])', [rooms]).catch(() => {}); }
      await db.end();
      for (const [k, v] of [['ANT_RAID_ENABLED', saved.e], ['ANT_RAID_V6', saved.v6], ['ANT_RAID_V7', saved.v7]]) if (v === undefined) delete process.env[k]; else process.env[k] = v;
    }
  });
