/* 蚂蚁搬画 · 游戏逻辑（盒子排法、吃格子规则、复活与重排） */
'use strict';
/* ---------- 难度：随关卡变化 ---------- */
function levelParams(lv) {
  return {
    cap: lv <= 30 ? 6 : lv <= 400 ? 5 : 4,
    cmin: lv <= 150 ? 8 : lv <= 500 ? 10 : 12,
    cmax: lv <= 150 ? 20 : lv <= 500 ? 25 : 30
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
    this.rebuild();
  }
  pct() { return Math.floor((this.total - this.left) / this.total * 100); }
  R() { if (!this._R) this._R = reachDist(this.eaten, this.n); return this._R; }
  // 把还没吃的格子重新排成盒子（一定能搬完）
  rebuild() {
    const seq = makeSeqFrom(this.role, this.n, this.eaten, this.rand, this.cmin, this.cmax);
    this.cols = [[], [], [], []];
    seq.forEach((b, i) => this.cols[i % 4].push({ c: b.c, n: b.n, id: i }));
    this.slots.fill(null);
    this.stalled = false;
  }
  reshuffle() { if (this.state !== 'play') return false; this.rebuild(); return true; }
  revive() { if (this.state !== 'lose') return false; this.addSlot(); this.rebuild(); this.state = 'play'; return true; }
  addSlot() { if (this.cap < 7) { this.cap++; this.slots.push(null); } }

  // 这个颜色现在能不能搬（有没有露出来的同色格子），返回要吃的那一格，没有则 -1
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
  // 点顶上的盒子进槽位：不管现在能不能搬都可以放，放错了会卡住
  // 返回 1 成功，2 槽位满了，0 没有盒子
  place(ci) {
    if (this.state !== 'play') return 0;
    const col = this.cols[ci], b = col && col[0];
    if (!b) return 0;
    const si = this.slots.indexOf(null);
    if (si < 0) return 2;
    col.shift();
    this.slots[si] = { c: b.c, n: b.n, t: 0, id: b.id };
    return 1;
  }
  // 提示：剩下的盒子里顺序最靠前的那一个（照这个顺序放，一定能搬完）
  hint() {
    let best = -1, bid = Infinity;
    this.cols.forEach((col, ci) => {
      const b = col[0];
      if (b && b.id < bid) { bid = b.id; best = ci; }
    });
    return best;
  }
  eatCell(i, c) {
    this.eaten[i] = 1; this.left--; this._R = null;
    this.ev.push({ t: 'eat', i, c });
  }
  spawn(path, idx, c) {
    const n = this.n, pts = [[n / 2, n + 0.9]];
    for (const j of path) pts.push([j % n + 0.5, Math.floor(j / n) + 0.5]);
    pts.push([idx % n + 0.5, Math.floor(idx / n) + 0.5]);
    this.ants.push({ c, idx, pts, k: 1, x: pts[0][0], y: pts[0][1], ph: 0, ux: 0, uy: -1 });
  }
  // 盒子出一只蚂蚁：吃掉离洞口最近的同色格子
  emit(b) {
    const idx = this.target(b.c);
    if (idx < 0) return false;
    const path = this.route(idx);
    this.eatCell(idx, b.c);
    this.spawn(path, idx, b.c);
    return true;
  }
  tick(dt) {
    if (this.state !== 'play') return;
    const sp = this.speed;
    for (let si = 0; si < this.slots.length; si++) {
      const b = this.slots[si];
      if (!b) continue;
      b.t += dt * sp;
      if (b.t < 200) continue;
      if (!this.emit(b)) continue;
      b.t = 0;
      if (--b.n <= 0) this.slots[si] = null;
    }
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
    if (this.left <= 0 && !this.ants.length) { this.state = 'win'; return; }
    if (this.ants.length) return;
    if (this.slots.some(b => b && this.target(b.c) >= 0)) { this.stalled = false; return; }
    // 槽位里的盒子都搬不动，也没有蚂蚁在路上
    const full = this.slots.every(b => b);
    const noBoxes = this.cols.every(c => c.length === 0);
    if (full || noBoxes) { this.state = 'lose'; return; }
    if (!this.stalled) { this.stalled = true; this.ev.push({ t: 'stall' }); }
  }
}
