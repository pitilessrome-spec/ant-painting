// Reads the public health endpoint of your deployed backend. It sends no secrets.
// Usage: API_BASE_URL=https://your-project.vercel.app npm run health
const base = (process.env.API_BASE_URL || '').replace(/\/$/, '');
if (!base.startsWith('https://')) { console.error('Set API_BASE_URL to your HTTPS Vercel address.'); process.exit(1); }
const res = await fetch(base + '/api/health');
console.log('HTTP ' + res.status);
console.log((await res.text()).slice(0, 2000));
process.exit(res.ok ? 0 : 1);
