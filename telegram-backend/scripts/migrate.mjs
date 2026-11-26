// Database migrations for the Telegram backend.
//   npm run db:plan      lists the files; connects to nothing
//   npm run db:status    read-only: shows which files are recorded, pending or changed
//   npm run db:baseline  for a database built before migration records existed:
//                        checks each file's tables, columns and indexes really exist
//                        and records only those files. Changes no game tables.
//   npm run db:migrate   applies pending files, one transaction each, one runner at a time
// All commands except db:plan need DATABASE_URL.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import M from '../lib/migrations.js';

const sqlDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'sql');
const files = M.listFiles(sqlDir);
const mode = process.argv.includes('--dry-run') ? 'plan'
  : process.argv.includes('--status') ? 'status'
  : process.argv.includes('--baseline') ? 'baseline' : 'migrate';

if (mode === 'plan') {
  console.log('Migration files, in order:');
  files.forEach(f => console.log('  ' + f.name + '  ' + f.checksum.slice(0, 12)));
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
  if (mode === 'status') {
    for (const r of await M.status(client, files)) console.log(r.state.padEnd(34) + r.name);
  } else if (mode === 'baseline') {
    const r = await M.baseline(client, files);
    console.log(`Recorded ${r.recorded.length} file(s) as baseline.`);
    if (r.stoppedAt) console.log(`${r.stoppedAt} and later files are not recorded. Run "npm run db:migrate" to apply them.`);
  } else {
    const r = await M.migrate(client, files);
    console.log(`Applied ${r.applied.length}, already recorded ${r.skipped.length}.`);
  }
} catch (err) {
  console.error('STOPPED: ' + err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
