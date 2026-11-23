/* ANT CANVAS · 游戏逻辑（盒子排法、吃格子规则、复活与重排） */
'use strict';
/* ---------- 难度：随关卡变化 ---------- */
function levelParams(lv) {
  return {
    cap: lv <= 30 ? 6 : lv <= 400 ? 5 : 4,
    cmin: lv <= 10 ? 8 : lv <= 300 ? 12 : 30,
    cmax: lv <= 10 ? 20 : lv <= 300 ? 30 : 50
  };
}

/* ---------- 吃格子的规则 ---------- */
// 从洞口出发，只能走已经吃空、且连着洞口的格子
function reachDist(eaten, n) {
  const N = n * n;
  const dist = new Int16Array(N + n).fill(-1), par = new Int32Array(N + n).fill(-1);
  const q = new Int32Array(N + n); let h = 0, t = 0;
  for (let x = 0; x < n; x++) { dist[N + x] = 0; q[t++] = N + x; }
  while (h < t) {
    const i = q[h++];
    let x, y;
    if (i >= N) { x = i - N; y = n; } else { x = i % n; y = (i - x) / n; }
    const cand = y === n ? [[x, n - 1]] : [[x, y - 1], [x - 1, y], [x + 1, y]];
    for (const [a, b] of cand) {
      if (a < 0 || a >= n || b < 0 || b >= n) continue;
      const j = b * n + a;
      if (eaten[j] && dist[j] < 0) { dist[j] = dist[i] + 1; par[j] = i; q[t++] = j; }
    }
  }
  return { dist, par };
}
// 没吃的格子：最下面一排一直露在外面；其他的要相邻的格子已经连着洞口
function expoAt(dist, n, x, y) {
  if (y + 1 >= n) return true;
  for (const [a, b] of [[x, y + 1], [x, y - 1], [x - 1, y], [x + 1, y]]) {
    if (a < 0 || a >= n || b < 0 || b >= n) continue;
    if (dist[b * n + a] >= 0) return true;
  }
  return false;
}
// 同色、露在外面、离洞口最近的一格（蚂蚁每次都吃这一格）
function nearestCell(eaten, n, role, c, dist) {
  let best = -1, bd = Infinity; const hx = n / 2, hy = n + 0.9;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = y * n + x;
    if (eaten[i] || role[i] !== c || !expoAt(dist, n, x, y)) continue;
    const d = (x + 0.5 - hx) * (x + 0.5 - hx) + (y + 0.5 - hy) * (y + 0.5 - hy);
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}
// 模拟一遍正确的搬法，得到盒子顺序：照这个顺序搬，一定能搬完
function makeSeqFrom(role, n, init, R, cmin, cmax) {
  const N = n * n, eaten = Uint8Array.from(init);
  let left = 0; for (let i = 0; i < N; i++) if (!eaten[i]) left++;
  const seq = [];
  while (left > 0) {
    const { dist } = reachDist(eaten, n);
    const cnt = new Int32Array(32);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const i = y * n + x;
      if (!eaten[i] && expoAt(dist, n, x, y)) cnt[role[i]]++;
    }
    const cols = []; for (let c = 0; c < 32; c++) if (cnt[c] > 0) cols.push(c);
    if (!cols.length) throw new Error('no exposed cell');
    const c = cols[Math.floor(R() * cols.length)];
    const k = Math.min(cnt[c], cmin + Math.floor(R() * (cmax - cmin + 1)));
    for (let t = 0; t < k; t++) {
      const { dist: d2 } = reachDist(eaten, n);
      const i = nearestCell(eaten, n, role, c, d2);
      eaten[i] = 1;
    }
    seq.push({ c, n: k });
    left -= k;
  }
  return seq;
}

class Game {
  constructor(lv, o) {
    o = o || {};
    this.lv = lv; this.rand = o.rand || Math.random;
    const P = buildPicture(lv);
    this.n = P.n; this.role = P.role; this.pal = palette(lv); this.subj = P.subj;
    const prm = levelParams(lv);
    this.cmin = prm.cmin; this.cmax = prm.cmax;
    const N = this.n * this.n;
    this.total = N; this.left = N;
    this.eaten = new Uint8Array(N);
    this.cap = o.cap || prm.cap; this.slots = new Array(this.cap).fill(null);
    this.cols = [[], [], [], []]; this.ants = []; this.ev = [];
    this.state = 'play'; this.speed = o.speed || 1; this._R = null; this.stalled = false;
    this.visualMs = 200;   // 槽位里每隔这么久放出一只蚂蚁（只影响动画）
    this.rebuild();
  }
  pct() { return Math.floor((this.total - this.left) / this.total * 100); }
  R() { if (!this._R) this._R = reachDist(this.eaten, this.n); return this._R; }

  // 把还没吃的格子重新排成盒子（一定能搬完）。槽位里没放出去的蚂蚁先放出去，免得格子一直留着
  rebuild() {
    for (const s of this.slots) {
      if (!s) continue;
      for (const job of s.q) { this.spawnVisual(job); this.ev.push({ t: 'eat', i: job.idx, c: job.c }); }
    }
    const seq = makeSeqFrom(this.role, this.n, this.eaten, this.rand, this.cmin, this.cmax);
    this.cols = [[], [], [], []];
    seq.forEach((b, i) => this.cols[i % 4].push({ c: b.c, n: b.n, id: i }));
    this.slots.fill(null);
    this.stalled = false;
  }
  reshuffle() { if (this.state !== 'play') return false; this.rebuild(); return true; }
  revive() { if (this.state !== 'lose') return false; this.addSlot(); this.rebuild(); this.state = 'play'; return true; }
  addSlot() { if (this.cap < 7) { this.cap++; this.slots.push(null); } }

  // 这个颜色现在能不能吃：返回要吃的那一格，没有则 -1
  target(c) { return nearestCell(this.eaten, this.n, this.role, c, this.R().dist); }
  // 蚂蚁的路：从洞口进来，只经过已经吃空的格子（要在吃之前算）
  route(i) {
    const n = this.n, N = n * n, { dist, par } = this.R();
    const x = i % n, y = (i - x) / n;
    let bj = -1, bd = Infinity, virt = false;
    for (const [a, b] of [[x, y + 1], [x, y - 1], [x - 1, y], [x + 1, y]]) {
      if (a < 0 || a >= n) continue;
      if (b >= n) { virt = true; break; }
      if (b < 0) continue;
      const j = b * n + a;
      if (dist[j] >= 0 && dist[j] < bd) { bd = dist[j]; bj = j; }
    }
    const list = [];
    if (!virt && bj >= 0) { for (let j = bj; j >= 0 && j < N; j = par[j]) list.push(j); list.reverse(); }
    return list;
  }
  eatCell(i) { this.eaten[i] = 1; this.left--; this._R = null; }

  // 逻辑：槽位里的盒子能吃就吃（按槽位顺序，吃到不能吃为止）。只看格子，不看时间。
  cascade() {
    let progress = true;
    while (progress) {
      progress = false;
      for (const s of this.slots) {
        if (!s) continue;
        while (s.n > 0) {
          const idx = this.target(s.c);
          if (idx < 0) break;
          const path = this.route(idx);
          this.eatCell(idx);
          s.q.push({ idx, path, c: s.c });
          s.n--;
          progress = true;
        }
      }
    }
  }

  // 点顶上的盒子进槽位：不管现在能不能搬都可以放，搬不动的会在槽位里等
  // 返回 1 成功，2 槽位满了，0 没有盒子
  place(ci) {
    if (this.state !== 'play') return 0;
    const col = this.cols[ci], b = col && col[0];
    if (!b) return 0;
    const si = this.slots.indexOf(null);
    if (si < 0) return 2;
    col.shift();
    this.slots[si] = { c: b.c, n: b.n, id: b.id, q: [], t: 0 };
    this.stalled = false;
    this.cascade();
    return 1;
  }
  // 提示：剩下的盒子里顺序最靠前的那一个（照这个顺序放，能通关，见 makeGame 里的验证）
  hint() {
    let best = -1, bid = Infinity;
    this.cols.forEach((col, ci) => {
      const b = col[0];
      if (b && b.id < bid) { bid = b.id; best = ci; }
    });
    return best;
  }

  spawnVisual(job) {
    const n = this.n, pts = [[n / 2, n + 0.9]];
    for (const j of job.path) pts.push([j % n + 0.5, Math.floor(j / n) + 0.5]);
    pts.push([job.idx % n + 0.5, Math.floor(job.idx / n) + 0.5]);
    this.ants.push({ c: job.c, idx: job.idx, pts, k: 1, x: pts[0][0], y: pts[0][1], ph: 0, ux: 0, uy: -1 });
  }

  tick(dt) {
    if (this.state !== 'play') return;
    const sp = this.speed;
    // 1) 槽位里的盒子按节奏把蚂蚁放出来（只是动画），搬完的槽位空出来
    for (let si = 0; si < this.slots.length; si++) {
      const s = this.slots[si];
      if (!s) continue;
      if (!s.q.length) s.t = 0;
      else {
        s.t += dt * sp;
        if (s.t >= this.visualMs) {
          s.t = 0;
          const job = s.q.shift();
          this.spawnVisual(job);
          this.ev.push({ t: 'eat', i: job.idx, c: job.c });
        }
      }
      if (s.n <= 0 && !s.q.length) this.slots[si] = null;
    }
    // 2) 蚂蚁走路
    const step = 0.028 * dt * sp;
    for (const a of this.ants) {
      let d = step;
      while (d > 0 && !a.done) {
        const T = a.pts[a.k], dx = T[0] - a.x, dy = T[1] - a.y, L = Math.hypot(dx, dy);
        if (L <= d) {
          a.x = T[0]; a.y = T[1]; d -= L; a.k++;
          if (a.k >= a.pts.length) {
            if (a.ph === 0) { a.ph = 1; a.pts.reverse(); a.k = 1; }
            else a.done = true;
          }
        } else {
          a.ux = dx / L; a.uy = dy / L;
          a.x += a.ux * d; a.y += a.uy * d; d = 0;
        }
      }
    }
    this.ants = this.ants.filter(a => !a.done);
    // 3) 输赢
    if (this.left <= 0) {
      if (!this.ants.length && this.slots.every(s => !s)) this.state = 'win';
      return;
    }
    if (this.ants.length || this.slots.some(s => s && s.q.length)) return;
    // 槽位里的盒子都搬不动（没有蚂蚁在路上，也没有排队的蚂蚁）
    const full = this.slots.every(s => s);
    const noBoxes = this.cols.every(c => c.length === 0);
    if (full || noBoxes) { this.state = 'lose'; return; }
    if (this.slots.some(s => s) && !this.stalled) { this.stalled = true; this.ev.push({ t: 'stall' }); }
  }

  // 验证用：一直放提示的盒子，能不能搬完（只算逻辑，不看时间）
  hintWins() {
    for (let guard = 0; guard < 100000 && this.left > 0; guard++) {
      for (let si = 0; si < this.slots.length; si++) {
        const s = this.slots[si];
        if (s && s.n <= 0) this.slots[si] = null;
      }
      if (this.slots.indexOf(null) < 0) return false;
      const c = this.hint();
      if (c < 0) return false;
      if (this.place(c) !== 1) return false;
    }
    return this.left <= 0;
  }
  snapshot() {
    return {
      eaten: this.eaten.slice(), left: this.left,
      cols: this.cols.map(col => col.map(b => ({ ...b }))),
      slots: this.slots.map(s => s ? { ...s, q: [] } : null)
    };
  }
  restore(sn) {
    this.eaten = sn.eaten; this.left = sn.left; this.cols = sn.cols; this.slots = sn.slots;
    this._R = null; this.ants = []; this.ev = []; this.stalled = false; this.state = 'play';
  }
}

// 生成一关：每个随机种子生成一套盒子，用“一直放提示的盒子”验证能通关；不能通关就换个种子重来
function makeGame(lv, o) {
  o = o || {};
  let last = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    const g = new Game(lv, Object.assign({}, o, { rand: rng(lv * 977 + 3 + attempt * 7919) }));
    const sn = g.snapshot();
    const ok = g.hintWins();
    g.restore(sn);
    if (ok) return g;
    last = g;
  }
  return last;
}
