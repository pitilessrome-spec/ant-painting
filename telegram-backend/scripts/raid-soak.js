'use strict';
// Multiplayer soak test for the raid service against a disposable Postgres database.
//   RAID_TEST_DATABASE_URL=postgres://... DB_SSL=false node scripts/raid-soak.js [teamSizes] [games]
// Every player is a greedy bot hitting the real HTTP routes concurrently on a simulated clock.
// Checks per game: no server errors; HP only goes back up when the boss counterattacks (its heal,
// hatching eggs); member damage covers every point of HP lost; nobody exceeds the turn limit;
// a won room pays each member's drops exactly once.
const { Pool } = require('pg');
const S = require('../lib/raid-service'), R = require('../lib/raid-engine');

const url = process.env.RAID_TEST_DATABASE_URL;
if (!url) { console.error('Set RAID_TEST_DATABASE_URL to a disposable database.'); process.exit(1); }
process.env.ANT_RAID_ENABLED = '1'; process.env.ANT_RAID_V7 = process.env.ANT_RAID_V7 || '1'; delete process.env.ANT_RAID_V6;

const realNow = Date.now.bind(Date);
let clock = realNow();
Date.now = () => clock;           // the service and engine read time through Date.now

async function main() {
  const sizes = (process.argv[2] || 'auto').split(',');
  const games = Number(process.argv[3] || 1);
  const db = new Pool({ connectionString: url, ssl: process.env.DB_SSL === 'false' ? false : undefined, max: 20 });
  await db.query('CREATE TABLE IF NOT EXISTS players(telegram_id BIGINT PRIMARY KEY)'); await S.ensure(db);
  await db.query('INSERT INTO players(telegram_id) SELECT generate_series(1000,1999) ON CONFLICT DO NOTHING');
  let nextId = 1000 + Math.floor((realNow() / 1000) % 500);
  async function req(id, path, body = {}) { let out; const res = { statusCode: 0, setHeader() {}, end(s) { out = JSON.parse(s); } }; await S.route({ method: 'POST', body }, res, db, { id: String(id) }, 'raid/' + path); return { ...out, httpStatus: res.statusCode }; }

  const rows = [], problems = [];
  for (const boss of ['beetle', 'spider', 'prism', 'frost']) for (const tier of ['small', 'medium', 'world']) {
    const list = sizes[0] === 'auto' ? (tier === 'world' ? [R.TIERS[tier].recommended, 8] : [R.TIERS[tier].recommended]) : sizes.map(Number).filter(n => n <= R.TIERS[tier].cap);
    for (const n of list) for (let g = 0; g < games; g++) {
      const ids = Array.from({ length: n }, () => (nextId = nextId >= 1999 ? 1000 : nextId + 1));
      const created = await req(ids[0], 'create', { tier, boss });
      if (created.httpStatus !== 200) { problems.push(`${boss}:${tier} create ${created.error}`); continue; }
      for (const id of ids.slice(1)) { const j = await req(id, 'join', { code: created.code }); if (j.httpStatus !== 200) problems.push(`${boss}:${tier} join ${j.error}`); }
      await req(ids[0], 'start', { room: created.room });
      const started = clock; let errors = 0, moves = 0, last, prev = null, badHeal = 0;
      while (clock - started < R.TIERS[tier].deadline + 5000) {
        clock += 400;
        const results = await Promise.all(ids.map(async id => {
          const v = await req(id, 'state', { room: created.room });
          if (v.httpStatus >= 500) { errors++; return v; }
          if (id === ids[0]) { if (prev && v.hp > prev.hp && v.retaliations === prev.ret) badHeal++; prev = { hp: v.hp, ret: v.retaliations }; }
          if (v.status !== 'active' || v.me.turns >= v.me.turnLimit) return v;
          const sk = v.me.skills.lightning > 0 ? 'lightning' : v.me.skills.bomb > 0 ? 'bomb' : null;
          const counts = {}; v.me.board.forEach(c => { if (c[0]) counts[c[0].c] = (counts[c[0].c] || 0) + 1; });
          const options = v.me.available.slice().sort((a, b) => ((b === v.weak) * 10 + (counts[b] || 0)) - ((a === v.weak) * 10 + (counts[a] || 0)));
          const input = sk ? { kind: 'skill', skill: sk } : { kind: 'color', color: options.find(c => c !== v.me.blocked) ?? options[0] };
          const r = await req(id, 'act', { room: created.room, seq: v.me.seq + 1, epoch: v.retaliations, ...input });
          if (r.httpStatus >= 500) errors++;
          if (r.httpStatus === 200) moves++;
          return r;
        }));
        last = results.find(r => r && r.status) || last;
        if (last && ['won', 'failed'].includes(last.status)) break;
      }
      const st = (await db.query('SELECT state FROM raid_rooms WHERE id=$1', [created.room])).rows[0].state;
      const dealt = Object.values(st.players).reduce((a, p) => a + p.damage, 0);
      if (dealt < st.maxHP - st.hp) problems.push(`${boss}:${tier}x${n} HP lost without damage: dealt ${dealt}, lost ${st.maxHP - st.hp}`);
      if (st.status === 'won' && dealt < st.maxHP) problems.push(`${boss}:${tier}x${n} won with only ${dealt}/${st.maxHP} damage`);
      if (badHeal) problems.push(`${boss}:${tier}x${n} HP rose ${badHeal} times without a counterattack`);
      if (Object.values(st.players).some(p => p.turns > R.TIERS[tier].turns)) problems.push(`${boss}:${tier}x${n} turn limit exceeded`);
      if (errors) problems.push(`${boss}:${tier}x${n} ${errors} server errors`);
      if (st.status === 'won') {
        const d = await db.query('SELECT player_id, count(*)::int AS items FROM raid_drops WHERE room_id=$1 GROUP BY player_id', [created.room]);
        if (st.rulesVersion >= 7 && d.rows.length !== n) problems.push(`${boss}:${tier}x${n} drops for ${d.rows.length}/${n} players`);
        await req(ids[0], 'state', { room: created.room });
        const again = await db.query('SELECT count(*)::int AS n FROM raid_drops WHERE room_id=$1', [created.room]);
        if (again.rows[0].n !== d.rows.reduce((a, r) => a + r.items, 0)) problems.push(`${boss}:${tier}x${n} drops changed on re-read`);
      }
      rows.push({ fight: `${boss}:${tier}`, players: n, result: st.status, secs: Math.round((clock - started) / 1000), hpLeft: Math.round(100 * st.hp / st.maxHP) + '%', healed: dealt - (st.maxHP - st.hp), moves, counterattacks: st.retaliations });
    }
  }
  await db.end();
  console.table(rows);
  console.log(problems.length ? 'PROBLEMS:\n' + problems.join('\n') : 'No problems: no server errors, HP only healed on counterattacks, damage covers all HP lost, turn limits held, drops paid once.');
  process.exit(problems.length ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
