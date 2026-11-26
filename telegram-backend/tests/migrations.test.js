const test = require('node:test'), assert = require('node:assert/strict');
const { join } = require('node:path');
const M = require('../lib/migrations.js');
const files = M.listFiles(join(__dirname, '..', 'sql'));

test('every migration file declares what it creates', () => {
  const e1 = M.expectations(files.find(f => f.name.startsWith('001')).sql);
  assert.deepEqual(e1.tables.players, ['telegram_id', 'best_level', 'created_at', 'updated_at']);
  assert.ok(e1.indexes.includes('leaderboard_idx'));
  const e3 = M.expectations(files.find(f => f.name.startsWith('003')).sql);
  assert.deepEqual(e3.tables.players, ['display_name', 'show_display_name']);
  const e5 = M.expectations(files.find(f => f.name.startsWith('005')).sql);
  assert.deepEqual(e5.tables.admin_adsgram_reports, ['platform', 'period_start', 'period_end', 'impressions', 'revenue', 'imported_at']);
  for (const f of files) {
    const e = M.expectations(f.sql);
    assert.ok(Object.keys(e.tables).length || e.indexes.length, f.name + ' declares nothing');
  }
});

test('file-level BEGIN/COMMIT are removed so the runner keeps its transaction', () => {
  const s = M.stripTransaction(files.find(f => f.name.startsWith('002')).sql);
  assert.doesNotMatch(s, /^\s*(BEGIN|COMMIT)\s*;/im);
  assert.match(s, /CREATE TABLE IF NOT EXISTS player_backups/);
});

test('commas inside CHECK lists do not split a column definition', () => {
  assert.deepEqual(M.splitTopLevel("a int CHECK (a IN (1,2)), b text DEFAULT 'x,y', PRIMARY KEY(a,b)"),
    ['a int CHECK (a IN (1,2))', "b text DEFAULT 'x,y'", 'PRIMARY KEY(a,b)']);
});

// Integration tests run only against a disposable Postgres server:
//   TEST_DATABASE_URL=postgres://user@localhost:5432/postgres npm run check
const admin = process.env.TEST_DATABASE_URL;
const pg = admin ? require('pg') : null;
const quiet = () => {};
let n = 0;
async function freshDb() {
  const name = 'mig_test_' + process.pid + '_' + (++n);
  const a = new pg.Client({ connectionString: admin }); await a.connect();
  await a.query('DROP DATABASE IF EXISTS ' + name); await a.query('CREATE DATABASE ' + name); await a.end();
  const url = new URL(admin); url.pathname = '/' + name;
  const connect = async () => { const c = new pg.Client({ connectionString: url.href }); await c.connect(); return c; };
  const drop = async () => { const b = new pg.Client({ connectionString: admin }); await b.connect(); await b.query('DROP DATABASE IF EXISTS ' + name + ' WITH (FORCE)'); await b.end(); };
  return { connect, drop };
}
const tables = async c => (await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1")).rows.map(r => r.table_name);

test('fresh database: applies every file once, second run changes nothing', { skip: !admin }, async () => {
  const db = await freshDb(); const c = await db.connect();
  try {
    const r1 = await M.migrate(c, files, quiet);
    assert.deepEqual(r1.applied, files.map(f => f.name));
    const r2 = await M.migrate(c, files, quiet);
    assert.deepEqual(r2.applied, []);
    assert.equal((await c.query("SELECT count(*)::int n FROM schema_migrations WHERE mode='applied'")).rows[0].n, files.length);
    assert.ok((await tables(c)).includes('admin_adsgram_reports'));
  } finally { await c.end(); await db.drop(); }
});

// Builds the state found in production on 2026-11-26: tables made by hand, no records.
async function legacy(c, skipAdsgramReports) {
  for (const f of files) {
    let sql = f.sql;
    if (skipAdsgramReports && f.name.startsWith('005')) sql = sql.replace(/CREATE TABLE IF NOT EXISTS admin_adsgram_reports[\s\S]*?\n\);\n/, '');
    await c.query(sql);
  }
}

test('existing database without records: migrate refuses, baseline records, nothing re-runs', { skip: !admin }, async () => {
  const db = await freshDb(); const c = await db.connect();
  try {
    await legacy(c, false);
    await c.query('INSERT INTO players (telegram_id, best_level) VALUES (42, 77)');
    await assert.rejects(M.migrate(c, files, quiet), /db:baseline/);
    const b = await M.baseline(c, files, quiet);
    assert.deepEqual(b.recorded, files.map(f => f.name));
    assert.equal(b.stoppedAt, null);
    const r = await M.migrate(c, files, quiet);
    assert.deepEqual(r.applied, []);
    assert.equal((await c.query('SELECT best_level FROM players WHERE telegram_id=42')).rows[0].best_level, 77);
  } finally { await c.end(); await db.drop(); }
});

test('baseline stops at a file whose objects are missing; migrate then applies only the rest', { skip: !admin }, async () => {
  const db = await freshDb(); const c = await db.connect();
  try {
    await legacy(c, true);
    const b = await M.baseline(c, files, quiet);
    assert.equal(b.stoppedAt, '005_admin_ads_reports.sql');
    assert.deepEqual(b.missing, ['table admin_adsgram_reports']);
    const r = await M.migrate(c, files, quiet);
    assert.deepEqual(r.applied, ['005_admin_ads_reports.sql']);
    assert.ok((await tables(c)).includes('admin_adsgram_reports'));
  } finally { await c.end(); await db.drop(); }
});

test('an edited migration that was already recorded stops the run', { skip: !admin }, async () => {
  const db = await freshDb(); const c = await db.connect();
  try {
    await M.migrate(c, files, quiet);
    const edited = files.map(f => f.name.startsWith('003') ? { ...f, checksum: 'different' } : f);
    await assert.rejects(M.migrate(c, edited, quiet), /changed after they were recorded: 003/);
  } finally { await c.end(); await db.drop(); }
});

test('a failing file rolls back completely and is not recorded', { skip: !admin }, async () => {
  const db = await freshDb(); const c = await db.connect();
  try {
    const bad = [...files, { name: '999_bad.sql', sql: 'CREATE TABLE half_done (id int);\nSELECT no_such_function();', checksum: 'x' }];
    await assert.rejects(M.migrate(c, bad, quiet), /999_bad.sql failed/);
    assert.ok(!(await tables(c)).includes('half_done'));
    assert.equal((await c.query("SELECT count(*)::int n FROM schema_migrations WHERE name='999_bad.sql'")).rows[0].n, 0);
  } finally { await c.end(); await db.drop(); }
});

test('two runners at once: one waits, every file is applied exactly once', { skip: !admin }, async () => {
  const db = await freshDb(); const a = await db.connect(), b = await db.connect();
  try {
    const slow = [{ name: '000_slow.sql', sql: 'SELECT pg_sleep(0.8);', checksum: 's' }, ...files];
    const waits = []; const [ra, rb] = await Promise.all([M.migrate(a, slow, quiet), M.migrate(b, slow, m => waits.push(m))]);
    assert.equal(ra.applied.length + rb.applied.length, slow.length);
    assert.ok(waits.some(m => /waiting/.test(m)) || ra.applied.length === 0);
    assert.equal((await a.query('SELECT count(*)::int n FROM schema_migrations')).rows[0].n, slow.length);
  } finally { await a.end(); await b.end(); await db.drop(); }
});
