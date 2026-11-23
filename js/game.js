/* ANT CANVAS · game logic (box order, eating rules, revive and reshuffle) */
'use strict';
/* ---------- Difficulty: changes with the level ---------- */
function levelParams(lv) {
  return {
    cap: 4,   // 4 slots at the start; watching ads adds more (up to 7)
    cmin: lv <= 10 ? 8 : lv <= 300 ? 12 : 30,
    cmax: lv <= 10 ? 20 : lv <= 300 ? 30 : 50
  };
}

/* ---------- Eating rules ---------- */
// Starting from the hole, ants can only walk through eaten cells that connect to the hole
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
// Uneaten cells: the bottom row is always exposed; other cells need a neighbor that already connects to the hole
function expoAt(dist, n, x, y) {
  if (y + 1 >= n) return true;
  for (const [a, b] of [[x, y + 1], [x, y - 1], [x - 1, y], [x + 1, y]]) {
    if (a < 0 || a >= n || b < 0 || b >= n) continue;
    if (dist[b * n + a] >= 0) return true;
  }
  return false;
}
// The exposed cell of this color closest to the hole (ants always eat this one)
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
// Simulate a correct play to build the box order: following this order always clears the level
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
    this.n = P.n; this.role = P.role; this.pal = palette(lv); this.subj = P.subj; this.kind=P.kind; this.theme=P.theme;
    const prm = levelParams(lv);
    this.cmin = prm.cmin; this.cmax = prm.cmax;
    const N = this.n * this.n;
    this.total = N; this.left = N;
    this.eaten = new Uint8Array(N);
    this.cap = o.cap || prm.cap; this.slots = new Array(this.cap).fill(null);
    this.cols = [[], [], [], []]; this.ants = []; this.ev = [];
    this.state = 'play'; this.speed = o.speed || 1; this._R = null; this.stalled = false;
    this.blastEnabled=typeof window!=='undefined'&&!!(window.AntWorkshop&&window.AntWorkshop.enabled);
    this.blastCharge=0;this.blastRemaining=0;this.blastShots=0;
    this.visualMs = 200;   // time between ants leaving a slot (animation only)
    this.rebuild();
  }
  pct() { return Math.floor((this.total - this.left) / this.total * 100); }
  // UI count: logical remaining (n) + ants queued to walk (q).
  // Decrement only when each queued ant actually leaves the slot in tick().
  slotDisplayCount(s) { return s ? s.n + s.q.length : 0; }
  R() { if (!this._R) this._R = reachDist(this.eaten, this.n); return this._R; }

  // Rebuild the boxes from the uneaten cells (always clearable). Ants still queued in slots are released first so no cell is left hanging
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

  // Can this color be eaten right now? Returns the cell to eat, or -1
  target(c) { return nearestCell(this.eaten, this.n, this.role, c, this.R().dist); }
  // Ant path: from the hole, only through eaten cells (computed before eating)
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

  // Logic: boxes in slots eat whatever they can, in slot order, until nothing more can be eaten. Depends only on cells, never on time
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

  // Load the top box into a slot: allowed even if it cannot move yet; it waits in the slot
  // Returns 1 on success, 2 if all slots are full, 0 if there is no box
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
  // Hint: the next box in order (following this order wins; verified in makeGame)
  hint() {
    let best = -1, bid = Infinity;
    this.cols.forEach((col, ci) => {
      const b = col[0];
      if (b && b.id < bid) { bid = b.id; best = ci; }
    });
    return best;
  }

  spawnVisual(job, mode) {
    const n = this.n, pts = [[n / 2, n + 0.9]];
    if(mode==='blast'){
      this.ants.push({mode:'blast',c:job.c,idx:job.idx,x:n/2,y:n+0.9,ux:0,uy:-1,age:0,done:false,ph:0});
      return;
    }
    for (const j of job.path) pts.push([j % n + 0.5, Math.floor(j / n) + 0.5]);
    pts.push([job.idx % n + 0.5, Math.floor(job.idx / n) + 0.5]);
    this.ants.push({ c: job.c, idx: job.idx, pts, k: 1, x: pts[0][0], y: pts[0][1], ph: 0, ux: 0, uy: -1 });
  }

  tick(dt) {
    if (this.state !== 'play') return;
    const sp = this.speed;
    // 1) Boxes in slots release ants at a steady pace (animation only); finished slots are freed
    for (let si = 0; si < this.slots.length; si++) {
      const s = this.slots[si];
      if (!s) continue;
      if (!s.q.length) s.t = 0;
      else {
        s.t += dt * sp;
        if (s.t >= this.visualMs) {
          s.t = 0;
          const job = s.q.shift();
          const charged=this.blastEnabled&&this.blastRemaining>0;
          if(charged){
            this.blastRemaining--;this.blastShots++;
            this.spawnVisual(job,'blast');
            this.ev.push({t:'shot',i:job.idx,c:job.c});
          }else{
            this.spawnVisual(job);
            this.ev.push({t:'eat',i:job.idx,c:job.c});
            if(this.blastEnabled){
              this.blastCharge++;
              if(this.blastCharge>=42){
                this.blastCharge=0;this.blastRemaining=7;
                this.ev.push({t:'blastReady'});
              }
            }
          }
        }
      }
      if (s.n <= 0 && !s.q.length) this.slots[si] = null;
    }
    // 2) Ants walk
    const step = 0.028 * dt * sp;
    for (const a of this.ants) {
      if(a.mode==='blast'){
        a.age+=dt*sp;
        const t=Math.min(1,a.age/460);
        a.x=this.n/2+Math.sin((a.idx%7)*.8)*.36;
        a.y=this.n+.9-.32*Math.sin(Math.PI*t);
        a.ux=0;a.uy=-1;
        if(t>=1)a.done=true;
        continue;
      }
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
    // 3) Win / lose
    if (this.left <= 0) {
      if (!this.ants.length && this.slots.every(s => !s)) this.state = 'win';
      return;
    }
    if (this.ants.length || this.slots.some(s => s && s.q.length)) return;
    // Every box in the slots is stuck (no ants walking, none queued)
    const full = this.slots.every(s => s);
    const noBoxes = this.cols.every(c => c.length === 0);
    if (full || noBoxes) { this.state = 'lose'; return; }
    if (this.slots.some(s => s) && !this.stalled) { this.stalled = true; this.ev.push({ t: 'stall' }); }
  }

  // Verification: keep loading the hinted box; can the level be cleared? (logic only, no timing)
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

// Generate a level: each random seed builds a box order, which is checked by always loading the hinted box; if it cannot be cleared, try the next seed
function makeGame(lv, o) {
  o = o || {};
  let last = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    const playerSeed=canvasPlayerSeed();
    const raw=lv*977+3+attempt*7919;
    const boxSeed=playerSeed===0?raw:mix32(raw^mix32(playerSeed));
    const g = new Game(lv, Object.assign({}, o, { rand: rng(boxSeed) }));
    const sn = g.snapshot();
    const ok = g.hintWins();
    g.restore(sn);
    if (ok) return g;
    last = g;
  }
  return last;
}
