// Applies the SQL files in sql/ in order, once each, and records them in schema_migrations.
// Usage: npm run db:plan   (lists the files, connects to nothing)
//        npm run db:migrate (needs DATABASE_URL)
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const sqlDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'sql');
const files = (await readdir(sqlDir)).filter(f => /^\d+_.*\.sql$/.test(f)).sort();

if (process.argv.includes('--dry-run')) {
  console.log('Would apply, in order:');
  files.forEach(f => console.log('  ' + f));
  process.exit(0);
}

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL is not set.'); process.exit(1); }
const { default: pg } = await import('pg'); // loaded only when we really connect
// TLS certificate checks stay on unless DB_SSL=false (local test database only).
const ssl = process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: true };
const client = new pg.Client({ connectionString: url, ssl });
await client.connect();
try {
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  const done = new Set((await client.query('SELECT name FROM schema_migrations')).rows.map(r => r.name));
  for (const f of files) {
    if (done.has(f)) { console.log('skip     ' + f); continue; }
    const sql = await readFile(join(sqlDir, f), 'utf8');
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [f]);
      await client.query('COMMIT');
      console.log('applied  ' + f);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('FAILED   ' + f + ': ' + err.message);
      process.exitCode = 1;
      break;
    }
  }
} finally {
  await client.end();
}
