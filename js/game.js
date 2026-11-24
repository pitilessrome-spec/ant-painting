/* ANT CANVAS · game logic (box order, eating rules, revive and reshuffle) */
'use strict';
/* ---------- Difficulty: changes with the level ---------- */
function levelChallenge(lv){
  if(lv<3||lv%3!==0)return {id:'classic',name:'Classic',charge:42,shots:7,pace:200};
  const kind=Math.floor(lv/3)%3;
  return kind===1?{id:'rainbow',name:'Rainbow Rush',charge:18,shots:10,pace:165}:kind===2?{id:'precision',name:'Precision Puzzle',charge:42,shots:7,pace:200}:{id:'sprint',name:'Ant Sprint',charge:32,shots:7,pace:130};
}
function levelParams(lv) {
  const challenge=levelChallenge(lv);
  const sprint=challenge.id==='sprint',precision=challenge.id==='precision';
  return {
    challenge,
    cap: 4,   // 4 slots at the start; watching ads adds more (up to 7)
    cmin: sprint ? (lv<=10?4:lv<=300?6:14) : lv <= 10 ? 8 : lv <= 300 ? 12 : 30,
    cmax: sprint ? (lv<=10?10:lv<=300?15:25) : lv <= 10 ? 20 : lv <= 300 ? 30 : 50,
    // Chunked queues expose later boxes earlier, requiring planning.
    chunk: Math.min(6,(lv < 10 ? 1 : lv < 20 ? 2 : lv < 40 ? 3 : lv < 80 ? 4 : 5)+(precision?1:0)),
    hints: lv < 10 ? Infinity : lv < 40 ? 3 : 2,
    reshuffles: lv < 10 ? 0 : 1,
    revives: lv < 10 ? Infinity : 1
  };
}

function specialCells(lv,n){
 const ice=new Uint8Array(n*n),boss=new Uint8Array(n*n);
 if(lv>=4&&lv%6===4)for(let y=1;y<n-1;y++)for(let x=0;x<n;x++)if((x*7+y*11+lv%19)%19===0)ice[y*n+x]=1;
 if(lv>=10&&lv%10===0){const mid=Math.floor(n/2);for(let y=mid-1;y<mid+2;y++)for(let x=mid-2;x<mid+2;x++)if(x>=0&&x<n&&y>=0&&y<n)boss[y*n+x]=1}
 const gem=lv>=5?Math.floor(n/3)*n+Math.floor(n/2):-1,markers=[];for(let i=0;i<n*n;i++)if(ice[i]||boss[i]||i===gem)markers.push(i);return {ice,boss,gem,markers,power:lv>=7&&lv%6===1?'bomb':lv>=8&&lv%6===2?'wild':null};
}
function iceLocked(eaten,ice,n,i){return !!ice?.[i]&&i+n<eaten.length&&!eaten[i+n]}
function dailyLevel(day){const d=Date.parse(day+'T00:00:00Z');return Number.isFinite(d)?3+(Math.floor(d/86400000)%30+30)%30:3;}
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
function nearestCell(eaten, n, role, c, dist, ice) {
  let best = -1, bd = Infinity; const hx = n / 2, hy = n + 0.9;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = y * n + x;
    if (eaten[i] || (c!==-1&&role[i] !== c) || iceLocked(eaten,ice,n,i) || !expoAt(dist, n, x, y)) continue;
    const d = (x + 0.5 - hx) * (x + 0.5 - hx) + (y + 0.5 - hy) * (y + 0.5 - hy);
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}
// Simulate a correct play to build the box order: following this order always clears the level
function makeSeqFrom(role, n, init, R, cmin, cmax, ice) {
  const N = n * n, eaten = Uint8Array.from(init);
  let left = 0; for (let i = 0; i < N; i++) if (!eaten[i]) left++;
  const seq = [];
  while (left > 0) {
    const { dist } = reachDist(eaten, n);
    const cnt = new Int32Array(32);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const i = y * n + x;
      if (!eaten[i] && !iceLocked(eaten,ice,n,i) && expoAt(dist, n, x, y)) cnt[role[i]]++;
    }
    const cols = []; for (let c = 0; c < 32; c++) if (cnt[c] > 0) cols.push(c);
    if (!cols.length) throw new Error('no exposed cell');
    const c = cols[Math.floor(R() * cols.length)];
    const k = Math.min(cnt[c], cmin + Math.floor(R() * (cmax - cmin + 1)));
    for (let t = 0; t < k; t++) {
      const { dist: d2 } = reachDist(eaten, n);
      const i = nearestCell(eaten, n, role, c, d2, ice);if(i<0)throw Error('invalid generated target');
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
    this.difficulty=prm;this.hintsUsed=0;this.reshufflesUsed=0;this.revivesUsed=0;
    const N = this.n * this.n;
    this.total = N; this.left = N;
    this.eaten = new Uint8Array(N);this.special=specialCells(lv,this.n);this.powerUsed=false;this.powerCharge=0;this.daily=o.daily||null;
    this.cap = o.cap || prm.cap; this.slots = new Array(this.cap).fill(null);
    this.cols = [[], [], [], []]; this.ants = []; this.ev = [];
    this.state = 'play'; this.speed = o.speed || 1; this._R = null; this.stalled = false;
    this.blastEnabled=typeof window!=='undefined'&&!!(window.AntWorkshop&&window.AntWorkshop.enabled);
    this.blastCharge=0;this.blastRemaining=0;this.blastShots=0;this.visualDone=0;
    this.challenge=prm.challenge;this.dispatches=0;this.directDispatches=0;this.smartChain=0;this.bestSmartChain=0;
    this.visualMs = this.challenge.pace;   // time between ants leaving a slot (animation only)
    this.rebuild();
  }
  pct() { return Math.floor((this.total - this.left) / this.total * 100); }
  visualPct() { return Math.floor(Math.min(this.total,this.visualDone) / this.total * 100); }
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
    const seq = makeSeqFrom(this.role, this.n, this.eaten, this.rand, this.cmin, this.cmax,this.special.ice);
    this.cols = [[], [], [], []];
    seq.forEach((b, i) => this.cols[Math.floor(i / this.difficulty.chunk) % 4].push({ c: b.c, n: b.n, id: i }));
    this.slots.fill(null);
    this.stalled = false;
  }
  reshuffle() { if (this.state !== 'play'||this.reshufflesUsed>=this.difficulty.reshuffles) return false; this.reshufflesUsed++;this.rebuild(); return true; }
  revive() { if (this.state !== 'lose'||this.revivesUsed>=this.difficulty.revives) return false; this.revivesUsed++;this.addSlot(); this.rebuild(); this.state = 'play'; return true; }
  useHint() {if(this.state!=='play'||this.hintsUsed>=this.difficulty.hints)return false;this.hintsUsed++;return true;}
  addSlot() { if (this.cap < 7) { this.cap++; this.slots.push(null); } }

  // Can this color be eaten right now? Returns the cell to eat, or -1
  target(c) { return nearestCell(this.eaten, this.n, this.role, c, this.R().dist,this.special.ice); }
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
  eatCell(i) { if(this.eaten[i])return false;this.eaten[i]=1;this.left--;this._R=null;return true; }
  bossHealth(){let total=0,remaining=0;for(let i=0;i<this.total;i++)if(this.special.boss[i]){total++;if(!this.eaten[i])remaining++}return {total,remaining}}
  powerReady(){return !!this.special.power&&!this.powerUsed&&this.powerCharge>=3&&this.state==='play'&&this.left>0&&!this.ants.length&&!this.slots.some(s=>s&&s.q.length)}
  usePower(){
    if(!this.powerReady())return false;
    const mode=this.special.power,n=this.n,first=this.target(-1);if(first<0)return false;
    const hits=[],limit=mode==='bomb'?5:6;
    for(let k=0;k<limit;k++){let i=-1;if(mode==='wild'||k===0)i=this.target(-1);else{
      const dist=this.R().dist,fx=first%n,fy=Math.floor(first/n);
      for(let j=0;j<this.total;j++){const x=j%n,y=Math.floor(j/n);if(Math.abs(x-fx)+Math.abs(y-fy)<=1&&!this.eaten[j]&&!iceLocked(this.eaten,this.special.ice,n,j)&&expoAt(dist,n,x,y)){i=j;break}}
    }if(i<0)break;this.eatCell(i);hits.push({i,c:this.role[i]})}
    if(!hits.length)return false;this.powerUsed=true;this.rebuild();
    for(const hit of hits){this.spawnVisual({idx:hit.i,c:hit.c,path:[]},'blast');this.ev.push({t:'shot',i:hit.i,c:hit.c})}
    this.ev.push({t:'power',mode,count:hits.length});return true;
  }

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
    const before=this.left;
    this.cascade();
    this.dispatches++;
    if(this.left<before){this.directDispatches++;this.powerCharge=Math.min(3,this.powerCharge+1);this.smartChain++;this.bestSmartChain=Math.max(this.bestSmartChain,this.smartChain)}else this.smartChain=0;
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
              if(this.blastCharge>=this.challenge.charge){
                this.blastCharge=0;this.blastRemaining=this.challenge.shots;
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
  mastery(){const rate=this.dispatches?this.directDispatches/this.dispatches:0;const clean=this.hintsUsed===0&&this.reshufflesUsed===0&&this.revivesUsed===0&&this.cap===4&&!this.powerUsed;return {rate,chain:this.bestSmartChain,dispatches:this.dispatches,stars:this.state==='win'?(clean&&rate>=.85?3:rate>=.65?2:1):0,clean};}
  snapshot() {
    return {
      eaten: this.eaten.slice(), left: this.left,dispatches:this.dispatches,directDispatches:this.directDispatches,smartChain:this.smartChain,bestSmartChain:this.bestSmartChain,powerCharge:this.powerCharge,powerUsed:this.powerUsed,
      cols: this.cols.map(col => col.map(b => ({ ...b }))),
      slots: this.slots.map(s => s ? { ...s, q: [] } : null)
    };
  }
  restore(sn) {
    this.eaten = sn.eaten; this.left = sn.left; this.cols = sn.cols; this.slots = sn.slots;
    this.dispatches=sn.dispatches||0;this.directDispatches=sn.directDispatches||0;this.smartChain=sn.smartChain||0;this.bestSmartChain=sn.bestSmartChain||0;this.powerCharge=sn.powerCharge||0;this.powerUsed=!!sn.powerUsed;
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
    const boxSeed=lv>999999&&typeof window!=='undefined'&&window.AntCanvasProfile?window.AntCanvasProfile.levelSeed(lv,977+attempt*7919):playerSeed===0?raw:mix32(raw^mix32(playerSeed));
    const g = new Game(lv, Object.assign({}, o, { rand: rng(boxSeed) }));
    const sn = g.snapshot();
    const ok = g.hintWins();
    g.restore(sn);
    if (ok) return g;
    last = g;
  }
  return last;
}
