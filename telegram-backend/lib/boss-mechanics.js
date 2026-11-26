'use strict';
// V7 boss mechanics: one module per boss (4 worlds x small/medium/world).
// The raid engine calls these hooks; every rule runs on the server. All state is
// plain JSON in room.m (shared) and player.m (per player) so rooms persist as before.
//
// Hooks (all optional):
//   start(s, now)                   fight begins
//   counter(s, {timed, now})        after each boss counterattack (rage timer or phase change)
//   tick(s, now) -> bool            clock-driven events; return true when state changed
//   allowColor(s, p, color)         throw to reject a colour choice
//   canTake(s, p, colIndex) -> bool column may give tiles this action
//   take(s, p, tile, colIndex, ctx) -> {remove, weight}  one tile reached
//   skill(s, p, name, ctx)          a skill was used
//   adjust(s, p, ctx, now)          change ctx.mult / ctx.bonus before ward and power
//   after(s, p, ctx, now)           after damage is applied
//   view(s, p, now) -> object       public state for the client
const PINK = 0, BLUE = 1, GOLD = 2, GREEN = 3;

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const roll = (p, s, salt) => rng((p.seed ^ Math.imul(s.retaliations + 1, 2654435761) ^ salt) >>> 0);
const species = p => p.ant?.species || 'worker';
const expose = p => [...new Set(p.board.filter(a => a.length).map(a => a[0].c))];
const event = (ctx, type, extra) => { if (ctx) ctx.events.push({ type, ...extra }); };
const pm = p => (p.m ||= {});

// Mark n unmarked tiles among the lowest `depth` tiles of each column.
function mark(p, r, n, kind, extra = {}, depth = 3, skip = null) {
  const spots = [];
  p.board.forEach((col, ci) => col.slice(0, depth).forEach((t, ti) => { if (!t.m && !(skip && skip.has(t))) spots.push([ci, ti]); }));
  for (let i = spots.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [spots[i], spots[j]] = [spots[j], spots[i]]; }
  return spots.slice(0, n).map(([ci, ti]) => Object.assign(p.board[ci][ti], { m: kind }, extra));
}
const eachTile = (p, fn) => p.board.forEach((col, ci) => col.forEach((t, ti) => fn(t, ci, ti)));
const clearMark = t => { delete t.m; delete t.at; delete t.hp; };

const MECHANICS = {
  // ---------------- Storybook Garden ----------------
  'beetle:small': {
    en: 'Giant Ladybug', mechanic: 'spots',
    counter(s) {
      const life = s.phase === 3 ? 1 : 2, n = s.phase >= 2 ? 4 : 3;
      for (const p of Object.values(s.players)) {
        eachTile(p, t => { if (t.m === 'spot' && s.retaliations - t.at >= life) { t.m = 'bud'; delete t.at; } });
        mark(p, roll(p, s, 11), n, 'spot', { at: s.retaliations });
      }
    },
    take(s, p, t, ci, ctx) {
      if (t.m === 'spot') { event(ctx, 'spot'); return { remove: true, weight: 2 }; }
      if (t.m === 'bud') return { remove: true, weight: 0 };
      return null;
    },
  },
  'beetle:medium': {
    en: 'Thorn Mantis', mechanic: 'thorns',
    counter(s, { now }) {
      const n = s.phase >= 2 ? 3 : 2;
      for (const p of Object.values(s.players)) {
        const r = roll(p, s, 23), cols = p.board.map((c, i) => i).filter(i => p.board[i].length && p.board[i][0].m !== 'thorn');
        for (let k = 0; k < n && cols.length; k++) { const ci = cols.splice(Math.floor(r() * cols.length), 1)[0]; p.board[ci][0].m = 'thorn'; }
      }
      if (s.phase === 3) s.m.scytheAt = now + 3000;
    },
    tick(s, now) { if (s.m.scytheAt && now >= s.m.scytheAt) { s.m.scytheAt = null; s.combo = null; s.m.sweeps = (s.m.sweeps || 0) + 1; return true; } return false; },
    take(s, p, t, ci, ctx) { if (t.m === 'thorn') { if (ctx.extraTurns < 2) ctx.extraTurns++; event(ctx, 'thorn'); } return null; },
    skill(s, p, name, ctx) { if (name === 'bomb') { let n = 0; eachTile(p, t => { if (t.m === 'thorn') { clearMark(t); n++; } }); if (n) event(ctx, 'thorns-burned', { n }); } },
    view: s => ({ scytheAt: s.m.scytheAt || null }),
  },
  'beetle:world': {
    en: 'Golden Scarab King', mechanic: 'golden-ball',
    counter(s, { timed, now }) {
      if (timed) s.m.ball = { until: now + 20000, need: s.phase >= 2 ? 4 : 3, cols: [] };
      if (s.phase === 3) s.armor += 8;
    },
    tick(s, now) { if (s.m.ball && now >= s.m.ball.until) { s.m.ball = null; s.armor += 12; s.m.missed = (s.m.missed || 0) + 1; return true; } return false; },
    take(s, p, t, ci, ctx) {
      const b = s.m.ball;
      if (b && t.c === GOLD && !b.cols.includes(ci)) {
        b.cols.push(ci);
        if (b.cols.length >= b.need) { s.m.ball = null; s.m.stopped = (s.m.stopped || 0) + 1; event(ctx, 'ball-stopped'); }
      }
      return null;
    },
    view: s => ({ ball: s.m.ball ? { until: s.m.ball.until, need: s.m.ball.need, have: s.m.ball.cols.length } : null }),
  },

  // ---------------- Mushroom Forest ----------------
  'spider:small': {
    en: 'Toxic Slime', mechanic: 'split',
    counter(s) { const n = s.phase >= 2 ? 3 : 2; for (const p of Object.values(s.players)) mark(p, roll(p, s, 31), n, 'toxic'); },
    take(s, p, t) { if (t.m === 'toxic') return { remove: true, weight: species(p) === 'life' ? 1 : 0 }; return null; },
    adjust(s, p, ctx) {
      const sp = s.m.split; if (!sp) return;
      const i = sp.colors.indexOf(ctx.color);
      if (i >= 0 && ctx.cleared > 0) sp.hit[i] = true;
      if (sp.hit[0] && sp.hit[1]) { s.m.split = null; ctx.bonus += 30; event(ctx, 'slime-merged'); }
      else ctx.mult *= 0.6;
    },
    after(s, p, ctx) {
      if (!s.m.split && ctx.kind === 'color' && ctx.cleared >= (s.phase === 3 ? 5 : 6)) {
        s.m.split = { colors: [s.weak, (s.weak + 2) % 4], hit: [false, false] };
        event(ctx, 'slime-split', { colors: s.m.split.colors });
      }
    },
    view: s => ({ split: s.m.split ? { colors: s.m.split.colors, hit: s.m.split.hit } : null }),
  },
  'spider:medium': {
    en: 'Phantom Centipede', mechanic: 'fade',
    counter(s, { now }) {
      if (s.phase >= 2) s.m.hiddenUntil = now + (s.phase === 3 ? 10000 : 25000);
      for (const p of Object.values(s.players)) mark(p, roll(p, s, 41), 2, 'glow');
    },
    take(s, p, t, ci, ctx) { if (t.m === 'glow') { s.m.revealUntil = ctx.now + 15000; event(ctx, 'revealed'); } return null; },
    adjust(s, p, ctx, now) { if (hidden(s, now)) ctx.mult *= 0.5; },
    view: (s, p, now) => ({ hidden: hidden(s, now), hideWeak: hidden(s, now), revealUntil: s.m.revealUntil || null }),
  },
  'spider:world': {
    en: 'Abyss Spider Queen', mechanic: 'eggs',
    counter(s) {
      const n = s.phase >= 2 ? 2 : 1;
      for (const p of Object.values(s.players)) {
        const hatched = new Set(); // a tile that just hatched is not re-laid in the same counterattack
        eachTile(p, t => {
          if (t.m === 'egg' && s.retaliations - t.at >= 2) {
            clearMark(t); hatched.add(t); s.m.hatched = (s.m.hatched || 0) + 1;
            s.hp = Math.min(s.maxHP, s.hp + Math.floor(s.maxHP * 0.02));
          }
        });
        mark(p, roll(p, s, 53), n, 'egg', { at: s.retaliations }, 3, hatched);
        pm(p).blocked2 = s.phase === 3 && (p.ant?.resist || 0) < 2 ? (expose(p).find(c => c !== p.blocked) ?? -1) : -1;
      }
    },
    allowColor(s, p, color) { if (p.m?.blocked2 === color && expose(p).length > 2) throw Object.assign(Error('Web blocked color; choose another'), { status: 409 }); },
    take(s, p, t, ci, ctx) { if (t.m === 'egg') event(ctx, 'egg-cleared'); return null; },
    after(s, p) { if (p.m) p.m.blocked2 = -1; },
    view: (s, p) => ({ hatched: s.m.hatched || 0, blocked2: p.m?.blocked2 ?? -1 }),
  },

  // ---------------- Coral Island ----------------
  'prism:small': {
    en: 'Giant Hermit Crab', mechanic: 'shell',
    counter(s, { timed }, ctx) {
      if (s.phase !== 3) return;
      for (const p of Object.values(s.players)) { if (p.skills.bomb > 0) p.skills.bomb--; else if (p.skills.lightning > 0) p.skills.lightning--; }
    },
    adjust(s, p, ctx, now) {
      if (!(s.m.shellUntil > now)) return;
      if (ctx.kind === 'skill' && ctx.skill === 'lightning') { s.m.shellUntil = 0; event(ctx, 'shell-cracked'); return; }
      ctx.mult *= 0.35;
    },
    after(s, p, ctx, now) {
      // Only colour moves make it hide; the lightning that cracks the shell does not re-close it.
      if (ctx.kind === 'color' && !(s.m.shellUntil > now) && now >= (s.m.shellReadyAt || 0) && ctx.raw >= (s.phase >= 2 ? 24 : 30)) {
        s.m.shellUntil = now + 5000; s.m.shellReadyAt = now + 9000; event(ctx, 'shell-closed');
      }
    },
    view: s => ({ shellUntil: s.m.shellUntil || null }),
  },
  'prism:medium': {
    en: 'Coral Shark', mechanic: 'tide',
    start(s, now) { s.m.nextTide = now + 30000; s.m.dir = -1; s.m.lastHitAt = now; },
    tick(s, now) {
      let changed = false;
      while (now >= s.m.nextTide) {
        for (const p of Object.values(s.players)) { if (s.m.dir < 0) p.board.push(p.board.shift()); else p.board.unshift(p.board.pop()); }
        s.m.tides = (s.m.tides || 0) + 1;
        if (s.phase === 3) s.m.dir = -s.m.dir;
        s.m.nextTide += s.phase >= 2 ? 20000 : 30000;
        changed = true;
      }
      return changed;
    },
    counter(s, { now }) {
      if (now - s.m.lastHitAt <= 10000) return;
      for (const p of Object.values(s.players)) {
        const r = roll(p, s, 67);
        for (let i = 0; i < 4; i++) { const col = p.board[i % 8]; if (col.length < 16) { col.unshift({ c: Math.floor(r() * 4), skill: null }); s.regenerated++; } }
      }
      s.m.frenzies = (s.m.frenzies || 0) + 1;
    },
    after(s, p, ctx, now) { s.m.lastHitAt = now; },
    view: s => ({ nextTide: s.m.nextTide, dir: s.m.dir }),
  },
  'prism:world': {
    en: 'Rainbow Leviathan', mechanic: 'prism',
    start(s, now) { s.m.nextShift = now + 20000; s.m.hits = {}; },
    tick(s, now) {
      let changed = false;
      while (now >= s.m.nextShift) {
        s.weak = (s.weak + 1) % 4; s.combo = null;
        s.m.nextShift += s.phase === 1 ? 20000 : s.phase === 2 ? 15000 : 12000;
        changed = true;
      }
      return changed;
    },
    adjust(s, p, ctx, now) { if (s.m.stunUntil > now) ctx.mult *= 1.6; },
    after(s, p, ctx, now) {
      if (ctx.kind !== 'color' || ctx.cleared < 2) return;
      s.m.hits[ctx.color] = now;
      const fresh = Object.values(s.m.hits).filter(t => now - t <= 6000).length;
      if (fresh >= 4 && now >= (s.m.nextBreakAt || 0)) {
        s.m.stunUntil = now + 6000; s.m.nextBreakAt = now + 26000; s.m.hits = {}; s.m.breaks = (s.m.breaks || 0) + 1; event(ctx, 'prism-break');
      }
    },
    view: (s, p, now) => {
      const warn = s.phase === 3 ? 1000 : 3000;
      return { nextShift: s.m.nextShift, nextWeak: now >= s.m.nextShift - warn ? (s.weak + 1) % 4 : null, stunUntil: s.m.stunUntil || null, nextBreakAt: s.m.nextBreakAt || null,
        colorsHit: Object.entries(s.m.hits || {}).filter(([, t]) => now - t <= 6000).map(([c]) => Number(c)) };
    },
  },

  // ---------------- Snowlight Valley ----------------
  'frost:small': {
    en: 'Snowfield Scorpion', mechanic: 'freeze',
    counter(s) {
      const k = s.phase >= 2 ? 2 : 1;
      for (const p of Object.values(s.players)) {
        const turns = (s.phase === 3 ? 3 : 2) - (species(p) === 'frost' ? 1 : 0), r = roll(p, s, 71);
        const cols = p.board.map((c, i) => i).filter(i => p.board[i].length && !(p.m?.frozen?.[i] > 0));
        const fz = pm(p).frozen ||= {};
        for (let n = 0; n < k && cols.length; n++) fz[cols.splice(Math.floor(r() * cols.length), 1)[0]] = turns;
      }
    },
    allowColor(s, p, color) {
      const open = p.board.some((a, i) => a[0]?.c === color && !(p.m?.frozen?.[i] > 0));
      const anyOpen = p.board.some((a, i) => a.length && !(p.m?.frozen?.[i] > 0));
      if (!open && anyOpen) throw Object.assign(Error('That color is frozen; thaw it first'), { status: 409 });
    },
    canTake(s, p, ci) {
      if (!(p.m?.frozen?.[ci] > 0)) return true;
      return !p.board.some((a, i) => a.length && !(p.m.frozen[i] > 0)); // every column frozen: never lock the player out
    },
    take(s, p, t, ci, ctx) {
      const fz = p.m?.frozen; if (!fz) return null;
      for (const j of [ci - 1, ci + 1]) if (fz[j] > 0 && p.board[j]?.[0]?.c === t.c) { delete fz[j]; event(ctx, 'thaw', { col: j }); }
      return null;
    },
    after(s, p) { const fz = p.m?.frozen; if (!fz) return; for (const k of Object.keys(fz)) { fz[k]--; if (fz[k] <= 0) delete fz[k]; } },
    view: (s, p) => ({ frozen: p.m?.frozen || {} }),
  },
  'frost:medium': {
    en: 'Crystal Giant', mechanic: 'crystals',
    start(s) {
      const r = rng((Object.values(s.players)[0]?.seed || 1) ^ 0x51a7);
      const colors = [PINK, BLUE, GOLD, GREEN]; colors.splice(Math.floor(r() * 4), 1);
      s.m.crystals = colors.map(c => ({ c, hp: 6 }));
    },
    counter(s, { timed }) { if (!timed && s.phase === 3 && !s.m.regrown) { s.m.regrown = true; for (const k of s.m.crystals) k.hp = Math.max(k.hp, 4); } },
    take(s, p, t, ci, ctx) {
      const k = s.m.crystals.find(x => x.c === t.c && x.hp > 0);
      if (k) { k.hp = Math.max(0, k.hp - (species(p) === 'crystal' ? 2 : 1)); if (!k.hp) event(ctx, 'crystal-broken', { color: k.c }); }
      return null;
    },
    adjust(s, p, ctx) { ctx.mult *= [1, 0.8, 0.55, 0.3][s.m.crystals.filter(k => k.hp > 0).length]; },
    view: s => ({ crystals: s.m.crystals }),
  },
  'frost:world': {
    en: 'Frost Dragon Emperor', mechanic: 'aurora',
    start(s) { s.m.charge = 0; s.m.need = 6; },
    counter(s, { timed }) {
      for (const p of Object.values(s.players)) {
        if (timed) for (const col of p.board) if (col[0] && col[0].m !== 'ice') Object.assign(col[0], { m: 'ice', hp: s.phase >= 2 ? 3 : 2 });
        mark(p, roll(p, s, 83), s.phase === 3 ? 4 : 2, 'aurora');
      }
    },
    take(s, p, t, ci, ctx) {
      if (t.m === 'ice') {
        if (species(p) === 'crystal' || t.hp <= 1) { clearMark(t); event(ctx, 'ice-broken'); return { remove: true, weight: 1 }; }
        t.hp--; return { remove: false, weight: 0 };
      }
      if (t.m === 'aurora') {
        s.m.charge++;
        if (s.m.charge >= s.m.need) { s.m.charge = 0; ctx.bonus += 60; s.m.bursts = (s.m.bursts || 0) + 1; event(ctx, 'aurora-burst'); }
      }
      return null;
    },
    view: s => ({ charge: s.m.charge, need: s.m.need }),
  },
};

function hidden(s, now) { return s.m.hiddenUntil > now && !(s.m.revealUntil > now); }

const forRoom = s => (s.rulesVersion >= 7 ? MECHANICS[s.boss + ':' + s.tier] || null : null);
const newCtx = (kind, extra) => ({ kind, color: -1, cleared: 0, weight: 0, raw: 0, mult: 1, bonus: 0, extraTurns: 0, events: [], ...extra });

module.exports = { MECHANICS, forRoom, newCtx, hidden };
