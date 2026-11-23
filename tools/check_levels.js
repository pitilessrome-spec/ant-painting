// 检查脚本：node tools/check_levels.js [关卡数，默认 3000]
// 1) 每一关的图案是否都不一样；2) 按提示搬，能不能通关；3) 生成一关要多久。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// 和浏览器里一样，按顺序加载两个脚本（它们都是普通脚本，没有 import）
const jsDir = path.join(__dirname, '..', 'js');
for (const f of ['art.js', 'game.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(jsDir, f), 'utf8'), { filename: f });
}

const N = Math.max(100, parseInt(process.argv[2], 10) || 3000);

// 1) 重复检查：图案的格子和颜色都相同，才算重复
let dups = 0;
const seen = new Set();
const t0 = Date.now();
for (let lv = 1; lv <= N; lv++) {
  const P = buildPicture(lv);
  const key = P.n + ':' + Buffer.from(P.role).toString('base64');
  if (seen.has(key)) dups++; else seen.add(key);
}
console.log(`[图案] ${N} 关：不重复 ${seen.size} 关，重复 ${dups} 关，用时 ${Date.now() - t0} ms`);

// 2) 通关检查：抽一些关卡，每次都按提示（顺序最靠前的盒子）放
function play(lv, policy) {
  const g = new Game(lv, { rand: rng(lv * 977 + 3) });
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
  new Game(lv, { rand: rng(lv) });
  maxBuild = Math.max(maxBuild, Date.now() - b0);
  if (play(lv, g => g.hint()) === 'win') wins++;
}
console.log(`[通关] 抽 ${sample.length} 关，按提示通关 ${wins} 关，用时 ${Date.now() - t1} ms`);
console.log(`[生成] 一关生成最长 ${maxBuild} ms（不含通关模拟）`);

const ok = dups === 0 && wins === sample.length;
console.log(ok ? '全部通过' : '有问题，请看上面的结果');
process.exit(ok ? 0 : 1);
