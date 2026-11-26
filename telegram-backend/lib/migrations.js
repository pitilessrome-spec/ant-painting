'use strict';
// Database migration runner for sql/NNN_name.sql files.
//
// Safety rules:
// - One runner at a time: a Postgres advisory lock is held for the whole run.
// - Every applied file is recorded in schema_migrations with a SHA-256 checksum.
//   A recorded file whose contents later change stops the run.
// - A database that already has game tables but no migration records is never
//   migrated blindly. Run baseline first: it checks that the tables, columns and
//   indexes each file declares really exist, and records only the files that pass.
// - Each file runs in its own transaction. BEGIN/COMMIT lines inside a file are
//   removed so they cannot end the runner's transaction early.
const { createHash } = require('node:crypto');
const { readdirSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const LOCK_KEY = 702415; // fixed key shared by every copy of this runner
const FILE_RE = /^\d{3}_[a-z0-9_]+\.sql$/;

function listFiles(dir) {
  return readdirSync(dir).filter(f => FILE_RE.test(f)).sort()
    .map(name => {
      const sql = readFileSync(join(dir, name), 'utf8');
      return { name, sql, checksum: createHash('sha256').update(sql).digest('hex') };
    });
}

function stripComments(sql) {
  return sql.replace(/--[^\n]*/g, '');
}

// Remove top-level transaction control so a file can run inside our transaction.
function stripTransaction(sql) {
  return stripComments(sql).replace(/^\s*(BEGIN|COMMIT|START\s+TRANSACTION|END)\s*;\s*$/gim, '');
}

// Split on commas that are not inside parentheses or quotes.
function splitTopLevel(body) {
  const parts = []; let depth = 0, cur = '', quote = false;
  for (const ch of body) {
    if (ch === "'") quote = !quote;
    if (!quote && ch === '(') depth++;
    if (!quote && ch === ')') depth--;
    if (!quote && depth === 0 && ch === ',') { parts.push(cur); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  return parts.map(s => s.trim()).filter(Boolean);
}

// The body of "CREATE TABLE x ( ... )", matched by parenthesis depth.
function tableBody(sql, start) {
  let depth = 0, quote = false;
  for (let i = start; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'") quote = !quote;
    if (quote) continue;
    if (ch === '(') depth++;
    if (ch === ')') { depth--; if (depth === 0) return sql.slice(start + 1, i); }
  }
  throw new Error('Unclosed CREATE TABLE');
}

const CONSTRAINT_WORDS = /^(PRIMARY|UNIQUE|CHECK|CONSTRAINT|FOREIGN|EXCLUDE)\b/i;

// What a migration file promises will exist once it has run.
function expectations(sql) {
  const clean = stripComments(sql);
  const tables = {}; const indexes = [];
  const createRe = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_][a-z0-9_]*)\s*\(/gi;
  let m;
  while ((m = createRe.exec(clean))) {
    const body = tableBody(clean, m.index + m[0].length - 1);
    const cols = splitTopLevel(body).filter(p => !CONSTRAINT_WORDS.test(p))
      .map(p => p.split(/\s+/)[0].replace(/"/g, '').toLowerCase());
    tables[m[1].toLowerCase()] = cols;
  }
  const alterRe = /ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?([a-z_][a-z0-9_]*)([^;]*);/gi;
  while ((m = alterRe.exec(clean))) {
    const t = m[1].toLowerCase();
    const addRe = /ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_][a-z0-9_]*)/gi; let a;
    while ((a = addRe.exec(m[2]))) (tables[t] ||= []).push(a[1].toLowerCase());
  }
  const indexRe = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:CONCURRENTLY\s+)?(?:IF\s+NOT\s+EXISTS\s+)?([a-z_][a-z0-9_]*)/gi;
  while ((m = indexRe.exec(clean))) indexes.push(m[1].toLowerCase());
  return { tables, indexes };
}

// Returns a list of what is missing for one file (empty list = fully present).
async function missingFor(client, file) {
  const { tables, indexes } = expectations(file.sql);
  const missing = [];
  for (const [table, cols] of Object.entries(tables)) {
    const r = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1", [table]);
    if (!r.rows.length) { missing.push('table ' + table); continue; }
    const have = new Set(r.rows.map(x => x.column_name));
    for (const c of cols) if (!have.has(c)) missing.push('column ' + table + '.' + c);
  }
  for (const ix of indexes) {
    const r = await client.query("SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname=$1", [ix]);
    if (!r.rows.length) missing.push('index ' + ix);
  }
  return missing;
}

async function ensureTable(client) {
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY,
    checksum text NOT NULL,
    mode text NOT NULL CHECK (mode IN ('applied','baseline')),
    applied_at timestamptz NOT NULL DEFAULT now())`);
}

async function withLock(client, log, fn, waitMs = 60000) {
  const started = Date.now(); let told = false;
  for (;;) {
    const r = await client.query('SELECT pg_try_advisory_lock($1) AS ok', [LOCK_KEY]);
    if (r.rows[0].ok) break;
    if (!told) { log('Another migration run is in progress; waiting...'); told = true; }
    if (Date.now() - started > waitMs) throw new Error('Timed out waiting for the other migration run to finish');
    await new Promise(res => setTimeout(res, 500));
  }
  try { return await fn(); }
  finally { await client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]); }
}

async function recorded(client) {
  const exists = await client.query("SELECT to_regclass('public.schema_migrations') AS t");
  if (!exists.rows[0].t) return new Map();
  const r = await client.query('SELECT name, checksum, mode FROM schema_migrations');
  return new Map(r.rows.map(x => [x.name, x]));
}

async function hasGameTables(client) {
  const r = await client.query("SELECT to_regclass('public.players') AS t");
  return Boolean(r.rows[0].t);
}

function checkChecksums(files, done) {
  const changed = files.filter(f => done.has(f.name) && done.get(f.name).checksum !== f.checksum);
  if (changed.length) {
    throw new Error('These files changed after they were recorded: ' + changed.map(f => f.name).join(', ') +
      '. Never edit an applied migration; add a new numbered file instead.');
  }
}

// Read-only report.
async function status(client, files) {
  const done = await recorded(client);
  const rows = [];
  for (const f of files) {
    const rec = done.get(f.name);
    let state = rec ? (rec.checksum === f.checksum ? rec.mode : 'CHANGED') : 'pending';
    if (!rec) { const miss = await missingFor(client, f); if (!miss.length) state = 'pending (objects already present)'; }
    rows.push({ name: f.name, state });
  }
  return rows;
}

// Records files whose objects already exist, starting from the first file and
// stopping at the first file that is not fully present.
async function baseline(client, files, log = console.log) {
  return withLock(client, log, async () => {
    await ensureTable(client);
    const done = await recorded(client);
    checkChecksums(files, done);
    const result = { recorded: [], stoppedAt: null, missing: [] };
    for (const f of files) {
      if (done.has(f.name)) { log('already  ' + f.name); continue; }
      const miss = await missingFor(client, f);
      if (miss.length) {
        result.stoppedAt = f.name; result.missing = miss;
        log('stop     ' + f.name + ' is not fully present: ' + miss.join(', '));
        break;
      }
      await client.query("INSERT INTO schema_migrations (name, checksum, mode) VALUES ($1,$2,'baseline')", [f.name, f.checksum]);
      result.recorded.push(f.name);
      log('baseline ' + f.name);
    }
    return result;
  });
}

async function migrate(client, files, log = console.log) {
  return withLock(client, log, async () => {
    const done = await recorded(client);
    if (!done.size && await hasGameTables(client)) {
      throw new Error('This database already has game tables but no migration records. ' +
        'Run "npm run db:baseline" first so existing tables are checked and recorded instead of re-run.');
    }
    await ensureTable(client);
    checkChecksums(files, done);
    const result = { applied: [], skipped: [] };
    for (const f of files) {
      if (done.has(f.name)) { result.skipped.push(f.name); log('skip     ' + f.name); continue; }
      await client.query('BEGIN');
      try {
        await client.query(stripTransaction(f.sql));
        await client.query("INSERT INTO schema_migrations (name, checksum, mode) VALUES ($1,$2,'applied')", [f.name, f.checksum]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(f.name + ' failed and was rolled back: ' + err.message);
      }
      result.applied.push(f.name);
      log('applied  ' + f.name);
    }
    return result;
  });
}

module.exports = { LOCK_KEY, listFiles, stripTransaction, splitTopLevel, expectations, missingFor, status, baseline, migrate };
