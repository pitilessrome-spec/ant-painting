'use strict';
// V7: each of the 12 bosses has its own mechanic, a way to beat it, and a phase change.
const test = require('node:test'), assert = require('node:assert/strict');
const R = require('../lib/raid-engine'), BM = require('../lib/boss-mechanics'), A = require('../lib/ant-evolution');

const prev = process.env.ANT_RAID_V7;
process.env.ANT_RAID_V7 = '1';
test.after(() => { if (prev === undefined) delete process.env.ANT_RAID_V7; else process.env.ANT_RAID_V7 = prev; });

function room(boss, tier, players = 1) {
  const s = R.createRoom(tier, boss, '1', 0);
  for (let i = 2; i <= players; i++) R.join(s, String(i));
  R.start(s, '1', 1000);
  return s;
}
const T = (c, extra) => ({ c, skill: null, ...extra });
const cols = (...list) => Array.from({ length: 8 }, (_, i) => (list[i] || []).map(x => typeof x === 'number' ? T(x) : x));
const all = (c, n = 6) => Array.from({ length: 8 }, () => Array.from({ length: n }, () => T(c)));
const play = (s, id, input, now) => R.act(s, id, { seq: s.players[id].seq + 1, ...input }, now);
const color = (s, id, c, now) => play(s, id, { kind: 'color', color: c }, now);
const count = (p, kind) => p.board.flat().filter(t => t.m === kind).length;
const types = r => r.events.map(e => e.type);

test('V7 gives all 12 encounters a different mechanic; V6 rooms have none', () => {
  const keys = Object.keys(BM.MECHANICS);
  assert.equal(keys.length, 12);
  assert.equal(new Set(keys.map(k => BM.MECHANICS[k].mechanic)).size, 12);
  for (const boss of Object.keys(R.BOSSES)) for (const tier of Object.keys(R.TIERS)) assert.ok(BM.MECHANICS[boss + ':' + tier]);
  process.env.ANT_RAID_V7 = '0';
  try { const s = R.createRoom('small', 'beetle', '1', 0); R.start(s, '1', 1000); assert.equal(R.view(s, '1').mechanic, null); }
  finally { process.env.ANT_RAID_V7 = '1'; }
  const v = R.view(room('frost', 'world'), '1');
  assert.equal(v.mechanic.type, 'aurora'); assert.equal(v.bossNameEn, 'Frost Dragon Emperor');
});

test('Giant Ladybug: spots double damage, then turn into buds that deal none', () => {
  const s = room('beetle', 'small'), p = s.players['1'];
  R.advance(s, s.nextRageAt);
  assert.equal(count(p, 'spot'), 3);
  s.ward = 0; s.armor = 0;
  p.board = cols([T(0, { m: 'spot', at: 1 })], [T(0, { m: 'spot', at: 1 })], [T(0, { m: 'spot', at: 1 })], [1], [1], [1], [1], [1]);
  const t = s.nextRageAt - 30000;
  assert.equal(color(s, '1', 0, t).damage, 6 * 3 + 2);
  const plain = room('beetle', 'small'); R.advance(plain, plain.nextRageAt); plain.ward = 0; plain.armor = 0;
  plain.players['1'].board = cols([0], [0], [0], [1], [1], [1], [1], [1]);
  assert.equal(color(plain, '1', 0, t).damage, 3 * 3 + 2);
  const deep = p.board[3][0]; Object.assign(deep, { m: 'spot', at: s.retaliations });
  R.advance(s, s.nextRageAt); R.advance(s, s.nextRageAt);
  assert.equal(deep.m, 'bud');
});

test('Thorn Mantis: thorns cost an extra turn, a bomb burns them, the phase-3 scythe breaks the combo', () => {
  const s = room('beetle', 'medium'), p = s.players['1'];
  R.advance(s, s.nextRageAt);
  assert.equal(count(p, 'thorn'), 2);
  p.blocked = -1; p.board = cols([T(0, { m: 'thorn' })], [1], [1]); p.slow = 0;
  color(s, '1', 0, s.nextRageAt - 20000);
  assert.equal(p.turns, 2);
  p.board = cols([T(1, { m: 'thorn' })], [T(2, { m: 'thorn' })], [3]); p.skills.bomb = 1;
  const r = play(s, '1', { kind: 'skill', skill: 'bomb' }, s.nextRageAt - 10000);
  assert.equal(count(p, 'thorn'), 0); assert.ok(types(r).includes('thorns-burned'));
  s.phase = 3; R.advance(s, s.nextRageAt);
  const at = s.m.scytheAt; assert.ok(at);
  s.combo = { player: '1', until: at + 60000 };
  R.advance(s, at);
  assert.equal(s.combo, null); assert.equal(s.m.sweeps, 1);
});

test('Golden Scarab King: stop the golden ball in 3 columns or the armour thickens', () => {
  const s = room('beetle', 'world'), p = s.players['1'];
  R.advance(s, s.nextRageAt);
  assert.deepEqual([s.m.ball.need, s.m.ball.cols.length], [3, 0]);
  p.board = cols([2], [2], [2], [0], [0]); p.slow = 0;
  const r = color(s, '1', 2, s.m.ball.until - 5000);
  assert.equal(s.m.ball, null); assert.equal(s.m.stopped, 1); assert.ok(types(r).includes('ball-stopped'));
  const miss = room('beetle', 'world'); R.advance(miss, miss.nextRageAt);
  const armor = miss.armor; R.advance(miss, miss.m.ball.until);
  assert.equal(miss.armor, armor + 12); assert.equal(miss.m.missed, 1);
});

test('Toxic Slime: a 6-tile hit splits it, damage drops to 60% until both slime colours are hit, toxic tiles deal nothing', () => {
  const s = room('spider', 'small'), p = s.players['1']; s.ward = 0;
  p.board = Array.from({ length: 8 }, () => [T(0), T(1), T(1)]);
  const a = color(s, '1', 0, 2000);
  assert.ok(types(a).includes('slime-split')); assert.deepEqual(s.m.split.colors, [0, 2]);
  assert.equal(color(s, '1', 1, 3000).damage, Math.floor((7 * 3 + 10) * 0.6));
  color(s, '1', 0, 4000);
  p.board[0].unshift(T(2));
  const m = color(s, '1', 2, 5000);
  assert.ok(types(m).includes('slime-merged')); assert.equal(s.m.split, null);
  const tox = room('spider', 'small'); tox.ward = 0;
  tox.players['1'].board = cols([T(0, { m: 'toxic' })], [T(0, { m: 'toxic' })], [T(0, { m: 'toxic' })], [1]);
  assert.equal(color(tox, '1', 0, 2000).damage, 0 * 5 + 2);
  const life = room('spider', 'small'); life.ward = 0; life.players['1'].ant = A.stats('life', 1);
  life.players['1'].board = cols([T(0, { m: 'toxic' })], [T(0, { m: 'toxic' })], [T(0, { m: 'toxic' })], [1]);
  assert.equal(color(life, '1', 0, 2000).damage, 3 * 5 + 2);
});

test('Phantom Centipede: from phase 2 it hides its weakness and halves damage until a glow tile reveals it', () => {
  const s = room('spider', 'medium'), p = s.players['1'];
  s.phase = 2; const rage = s.nextRageAt; R.advance(s, rage);
  const v = R.view(s, '1', rage + 1000);
  assert.equal(v.weak, null); assert.equal(v.mechanic.hidden, true);
  s.ward = 0; p.slow = 0; p.board = all(3, 1);
  assert.equal(color(s, '1', 3, rage + 1000).damage, Math.floor((7 * 3 + 10) * 0.5));
  p.board = cols([T(3, { m: 'glow' })], [1]);
  const r = color(s, '1', 3, rage + 2000);
  assert.ok(types(r).includes('revealed'));
  assert.equal(R.view(s, '1', rage + 3000).mechanic.hidden, false);
});

test('Abyss Spider Queen: eggs left for 2 counterattacks hatch; cleared eggs do not; phase 3 webs a second colour', () => {
  const s = room('spider', 'world'), p = s.players['1'];
  R.advance(s, s.nextRageAt);
  const egg = p.board.flat().find(t => t.m === 'egg'); assert.ok(egg);
  R.advance(s, s.nextRageAt); R.advance(s, s.nextRageAt);
  assert.equal(egg.m, undefined); assert.ok(s.m.hatched >= 1);
  const c = room('spider', 'world'), q = c.players['1'];
  R.advance(c, c.nextRageAt);
  for (const col of q.board) { const i = col.findIndex(t => t.m === 'egg'); if (i >= 0) col.splice(i, 1); }
  R.advance(c, c.nextRageAt); R.advance(c, c.nextRageAt);
  assert.equal(c.m.hatched || 0, 0);
  q.board = cols([0], [1], [2], [3]); q.blocked = 0; q.m.blocked2 = 1;
  assert.throws(() => color(c, '1', 1, c.nextRageAt - 1000), /Web blocked/);
});

test('Giant Hermit Crab: a big hit makes it hide (35% damage for 5 s, then 4 s before it can hide again), lightning cracks the shell, phase 3 steals a skill', () => {
  const s = room('prism', 'small'), p = s.players['1']; s.ward = 0;
  p.board = all(0, 3);
  const a = color(s, '1', 0, 2000);
  assert.ok(types(a).includes('shell-closed'));
  assert.equal(color(s, '1', 0, 3000).damage, Math.floor((7 * 5 + 10) * 0.35));
  p.skills.lightning = 1;
  const l = play(s, '1', { kind: 'skill', skill: 'lightning' }, 4000);
  assert.ok(types(l).includes('shell-cracked')); assert.equal(l.damage, 32); assert.equal(s.m.shellUntil, 0);
  p.board = all(0, 3);
  assert.ok(!types(color(s, '1', 0, 5000)).includes('shell-closed'));
  assert.ok(types(color(s, '1', 0, 11000)).includes('shell-closed'));
  s.phase = 3; p.skills = { bomb: 1, lightning: 1 }; R.advance(s, s.nextRageAt);
  assert.deepEqual(p.skills, { bomb: 0, lightning: 1 });
});

test('Coral Shark: the tide shifts every column; ten seconds without a hit sends it into a frenzy', () => {
  const s = room('prism', 'medium'), p = s.players['1'];
  const first = p.board[0];
  R.advance(s, s.m.nextTide);
  assert.equal(p.board[7], first); assert.equal(s.m.tides, 1);
  R.advance(s, s.nextRageAt); assert.equal(s.m.frenzies, 1);
  const calm = room('prism', 'medium');
  calm.players['1'].blocked = -1;
  color(calm, '1', R.view(calm, '1').me.available[0], calm.nextRageAt - 5000);
  R.advance(calm, calm.nextRageAt); assert.equal(calm.m.frenzies || 0, 0);
});

test('Rainbow Leviathan: the weakness shifts on a warned schedule; four colours (2+ tiles each) in 6 s stun it (x1.6 damage), then a 20 s wait', () => {
  const s = room('prism', 'world'), p = s.players['1']; s.ward = 0;
  assert.equal(R.view(s, '1', 17000).mechanic.nextWeak, null);
  assert.equal(R.view(s, '1', 18500).mechanic.nextWeak, 1);
  R.advance(s, 21000); assert.equal(s.weak, 1);
  p.board = cols([0, 0], [1, 1], [2, 2], [3, 3], [2]);
  color(s, '1', 0, 22000); color(s, '1', 1, 23000); color(s, '1', 2, 24000);
  const r = color(s, '1', 3, 25000);
  assert.ok(types(r).includes('prism-break')); assert.equal(s.m.stunUntil, 31000); assert.equal(s.m.nextBreakAt, 51000);
  p.board = cols([2]);
  assert.equal(color(s, '1', 2, 26000).damage, Math.floor(3 * 1.6));
});

test('Snowfield Scorpion: a frozen column gives no tiles until thawed from next door; never locks the player out', () => {
  const s = room('frost', 'small'), p = s.players['1'];
  R.advance(s, s.nextRageAt);
  assert.equal(Object.keys(p.m.frozen).length, 1);
  const t = s.nextRageAt - 40000;
  p.blocked = -1; p.m.frozen = { 0: 2 }; p.slow = 0; p.board = cols([2], [1]);
  assert.throws(() => color(s, '1', 2, t), /frozen/);
  p.board = cols([0], [0]);
  const r = color(s, '1', 0, t + 1000);
  assert.equal(r.cleared, 2); assert.ok(types(r).includes('thaw')); assert.deepEqual(p.m.frozen, {});
  p.m.frozen = { 3: 2 }; p.board = cols([1], [], [], [2]);
  color(s, '1', 1, t + 2000); assert.deepEqual(p.m.frozen, { 3: 1 });
  p.m.frozen = { 0: 3 }; p.board = cols([1]);
  assert.equal(color(s, '1', 1, t + 3000).cleared, 1);
});

test('Crystal Giant: three crystals cut damage to 30%; each one broken lets more through; they regrow in phase 3', () => {
  const s = room('frost', 'medium'), p = s.players['1']; s.ward = 0; p.slow = 0;
  assert.equal(s.m.crystals.length, 3);
  const free = [0, 1, 2, 3].find(c => !s.m.crystals.some(k => k.c === c));
  p.board = all(free, 1);
  assert.equal(color(s, '1', free, 2000).damage, Math.floor((7 * (free === s.weak ? 5 : 3) + 10) * 0.3));
  const k = s.m.crystals[0]; k.hp = 1; p.board = cols([k.c]);
  const r = color(s, '1', k.c, 3000);
  assert.ok(types(r).includes('crystal-broken'));
  assert.equal(R.view(s, '1').mechanic.crystals.filter(x => x.hp > 0).length, 2);
  p.ant = A.stats('crystal', 1); const k2 = s.m.crystals[1]; k2.hp = 2; p.board = cols([k2.c]);
  color(s, '1', k2.c, 4000); assert.equal(k2.hp, 0);
  for (const x of s.m.crystals) x.hp = 0;
  s.phase = 2; s.hp = Math.floor(s.maxHP * 0.4) + 2; p.board = all(free, 2);
  color(s, '1', free, 5000);
  assert.equal(s.phase, 3); assert.ok(s.m.crystals.every(x => x.hp === 4));
});

test('Frost Dragon Emperor: breath ices the bottom row (2 hits each); aurora tiles charge a 60-damage burst', () => {
  const s = room('frost', 'world'), p = s.players['1'];
  R.advance(s, s.nextRageAt);
  assert.ok(p.board.every(c => !c.length || c[0].m === 'ice'));
  assert.equal(count(p, 'aurora'), 2);
  const t = s.nextRageAt - 30000;
  p.blocked = -1; p.board = cols([T(0, { m: 'ice', hp: 2 }), T(1)]);
  const r = color(s, '1', 0, t);
  assert.equal(r.cleared, 2); assert.ok(types(r).includes('ice-broken')); assert.equal(p.board[0][0].c, 1);
  p.ant = A.stats('crystal', 1); p.board = cols([T(0, { m: 'ice', hp: 3 }), T(1)]);
  assert.equal(color(s, '1', 0, t + 1000).cleared, 1);
  s.m.charge = 5; p.board = cols([T(2, { m: 'aurora' })]);
  const b = color(s, '1', 2, t + 2000);
  assert.ok(types(b).includes('aurora-burst')); assert.ok(b.damage >= 60); assert.equal(s.m.charge, 0);
});

test('all 12 bosses survive 60 moves of 2-player play with the room saved and reloaded as JSON after every move', () => {
  for (const key of Object.keys(BM.MECHANICS)) {
    const [boss, tier] = key.split(':');
    let s = room(boss, tier, 2), now = 2000;
    for (let i = 0; i < 60 && s.status === 'active'; i++) {
      const id = i % 2 ? '2' : '1';
      now += 4000;
      R.advance(s, now); // the service advances the clock before it shows the board
      if (s.status !== 'active') break;
      const v = R.view(s, id, now), p = s.players[id];
      if (p.skills.lightning && i % 7 === 0) { try { play(s, id, { kind: 'skill', skill: 'lightning' }, now); } catch (e) { assert.ok(e.status, key + ': ' + e.message); } }
      else for (const c of v.me.available) {
        try { color(s, id, c, now); break; } catch (e) { assert.ok([409, 429].includes(e.status), key + ': ' + e.message); }
      }
      s = JSON.parse(JSON.stringify(s));
      assert.ok(s.hp >= 0 && s.hp <= s.maxHP, key + ' hp out of range');
      assert.ok(Object.values(s.players).every(q => q.turns <= R.TIERS[tier].turns), key + ' turns over limit');
      assert.ok(['active', 'won', 'failed'].includes(s.status));
    }
    assert.ok(s.retaliations > 0, key + ' never counterattacked');
  }
});
