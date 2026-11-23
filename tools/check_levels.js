// Check script: node tools/check_levels.js [number of levels, default 3000]
// 1) every level picture is different; 2) following the hint clears the level; 3) how long one level takes to generate.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load the two scripts in order, like the browser does (plain scripts, no imports)
const jsDir = path.join(__dirname, '..', 'js');
for (const f of ['art.js', 'game.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(jsDir, f), 'utf8'), { filename: f });
}

const N = Math.max(100, parseInt(process.argv[2], 10) || 3000);

// 1) Duplicate check: a picture counts as a duplicate only if cells and colors are identical
let dups = 0;
const seen = new Set();
const t0 = Date.now();
for (let lv = 1; lv <= N; lv++) {
  const P = buildPicture(lv);
  const key = P.n + ':' + Buffer.from(P.role).toString('base64');
  if (seen.has(key)) dups++; else seen.add(key);
}
console.log(`[pictures] ${N} levels: ${seen.size} unique, ${dups} duplicates, took ${Date.now() - t0} ms`);

// 2) Clear check: sample some levels and always load the hinted box
function play(lv, policy) {
  const g = makeGame(lv);
  let guard = 0;
  while (g.state === 'play' && guard++ < 900000) {
    for (let k = 0; k < 6; k++) {
      if (g.slots.indexOf(null) < 0) break;
      const c = policy(g);
      if (c < 0 || g.place(c) !== 1) break;
    }
    g.tick(40);
    g.ev.length = 0;
  }
  return g.state;
}
const sample = [];
for (let i = 0; i < 20; i++) sample.push(1 + Math.floor((i * 7919 + 13) * N / 20) % N);
let wins = 0, maxBuild = 0;
const t1 = Date.now();
for (const lv of sample) {
  const b0 = Date.now();
  makeGame(lv);
  maxBuild = Math.max(maxBuild, Date.now() - b0);
  if (play(lv, g => g.hint()) === 'win') wins++;
}
console.log(`[clear] sampled ${sample.length} levels, hint cleared ${wins}, took ${Date.now() - t1} ms`);
console.log(`[generate] slowest level ${maxBuild} ms (excluding the clear simulation)`);

const ok = dups === 0 && wins === sample.length;
console.log(ok ? 'All checks passed' : 'Something failed, see above');
process.exit(ok ? 0 : 1);
