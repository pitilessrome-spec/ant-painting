// Checks that the required server settings exist. It prints only "set" or "MISSING", never the values.
// Usage (in the telegram-backend folder): npm run env:check
const required = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_WEBHOOK_SECRET', 'TELEGRAM_GAME_SHORT_NAME', 'DATABASE_URL', 'GAME_ORIGIN', 'ANT_ADMIN_KEY'];
const isPlaceholder = v => /^<.*>$/.test(v);
let missing = 0;
for (const name of required) {
  const v = process.env[name];
  const ok = Boolean(v) && !isPlaceholder(v);
  if (!ok) missing++;
  console.log(`${ok ? 'set    ' : 'MISSING'}  ${name}`);
}
const secret = process.env.TELEGRAM_WEBHOOK_SECRET || '';
if (secret && !/^[A-Za-z0-9_-]{32,}$/.test(secret)) console.log('WARN   TELEGRAM_WEBHOOK_SECRET should be 32+ characters: A-Z, a-z, 0-9, _ or -');
const admin = process.env.ANT_ADMIN_KEY || '';
if (admin && admin.length < 32) console.log('WARN   ANT_ADMIN_KEY should be at least 32 random characters');
if (process.env.DB_SSL === 'false') console.log('WARN   DB_SSL=false turns off TLS certificate checks; use it only for a local test database');
console.log(missing ? `\n${missing} setting(s) missing.` : '\nAll required settings are present.');
process.exit(missing ? 1 : 0);
